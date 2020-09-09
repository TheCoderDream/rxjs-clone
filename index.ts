console.clear();

export interface Observer {
  next(value): void;
  error(error): void;
  complete(): void;
  done: boolean;
}

type ObserverFunction = (observable: Observable) => Observable;

export interface Pipeable {
  (args: any[]): ObserverFunction;
}

export class ObserverList {
    private observerList: Array<Observer> = [];

    add(observer): this {
        this.observerList.push(observer);
        return this;
    }

    get count(): number {
        return this.observerList.length;
    }

    get(index): Observer {
        if (index > -1 && index < this.count) {
            return this.observerList[index];
        }
    }

    indexOf(observer, startIndex = 0): number {
        startIndex = startIndex < 0 ? 0 : startIndex;
        while (startIndex < this.count) {
            if (this.observerList[startIndex] === observer) {
                return startIndex;
            }
            startIndex++;
        }
        return -1;
    }

    remove(observer): void {
        this.observerList = this.observerList.filter(o => o !== observer);
    }


    removeAt(index): void {
        this.observerList.splice(index, 1);
    }

    clear(): void {
      this.observerList = [];
    }
}

class Observable {
    observableList = new ObserverList();
    execution: Function;
    teardownLogic: Function = null;

    constructor(execution) {
        this.execution = execution;
    }

    subscribe(nextOrObserver, error = null, complete = null) {
        let observer;

        if (typeof nextOrObserver === "function") {
            observer = {
                next: nextOrObserver,
                error: error,
                complete: complete,
                done: false
            }
        } else {
            observer = {
              ...nextOrObserver,
              done: false
            };
        }
        this.observableList.add(observer);

       this.teardownLogic = this.execution({
            next: this.next.bind(this, observer),
            error: this.error.bind(this, observer),
            complete: this.complete.bind(this, observer)
        });

       return (() => {
           const subscriptions = [observer];

           return {
               unsubscribe: () => {
                   subscriptions.forEach(observer => {
                       observer.done = true;
                       this.observableList.remove(observer);
                   })
               },
               add: (subscription) => {
                   subscriptions.push(
                       ...subscription._subs
                   )
               },
               _subs: subscriptions,
               _lift: () => {
                 observer.done = true;

                 this.reset();
               }
           }
       })();
    }

    next(observer, val) {
      if (observer.done) return;
      if (observer.next && !observer.done) observer.next(val);
    }

    error(observer, err) {
        if (observer.done) return;
        if (observer.error && !observer.done) {
            observer.error(err);
            this.observableList.remove(observer);
        }
        observer.done = true;
        this.reset();
    }

    complete(observer): void {
        if (observer.complete && !observer.done) observer.complete();
        observer.done = true;
        this.reset();
    }

    pipe(...observables: Array<ObserverFunction>): Observable {
      if (!observables.length) {
        return this;
      }

     return observables.reduce((prev, next) => next(prev), this);
    }

    private reset(): void {
      if (this.teardownLogic) this.teardownLogic();
      this.observableList.clear();
    }


}


const observable = new Observable(subscriber => {
  let count = 1;

  const intervalId = setInterval(() => {

    subscriber.next(count);
    count++;
  }, 1000);

  setTimeout(() => {
    subscriber.complete();
  }, 5000);

  return () => {
    clearInterval(intervalId);
  };
});

function of(...args: Array<any>): Observable {
  return new Observable(subscriber => {
    args.forEach(val => {
      subscriber.next(val);
    });
    subscriber.complete();
  });
}

function fromEvent(element, eventTpye: string) {
  return new Observable(subscriber => {
    function eventHandler(event: Event): void {
      subscriber.next(event);
    }

    element.addEventListener(eventTpye, eventHandler);

    return () => {
      element.removeEventListener(eventTpye, eventHandler);
    };
  });
}

// of('hello', 'world', 'we', 'love', 'javascript').subscribe(
//   console.log
// )

// fromEvent(document, "click").subscribe(console.log);


function map(calback: Function) {
  return (observable) => new Observable(subscriber => {
    observable.subscribe(
      {
        next: (val) => {
          subscriber.next(calback(val))
        },
        error: (err) => {
          subscriber.error(calback(err))
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )
  })
}

function filter(calback: Function) {
    return (observable) => new Observable(subscriber => {
    observable.subscribe(
      {
        next: (val) => {
          if (calback(val)) subscriber.next(val)
        },
        error: (err) => {
          subscriber.error(calback(err))
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )
  })
}


function reduce(calback: Function, initial?: any) {

  return (observable) => new Observable(subscriber => {
    let accumulator = initial;
    let index = 0;
    observable.subscribe(
      {
        next: (val) => {
          if (index === 0 && !initial) {
            accumulator = val;
          } else {
            accumulator = calback(accumulator, val, index)
          }
          index++;
        },
        error: (err) => {
          subscriber.error(calback(err))
        },
        complete: () => {
          subscriber.next(accumulator);
          subscriber.complete();
        }
      }
    )
  })
}

function scan(calback: Function, initial?: any) {

  return (observable) => new Observable(subscriber => {
    let accumulator = initial;
    let index = 0;
    observable.subscribe(
      {
        next: (val) => {
          if (index === 0 && !initial) {
            accumulator = val;
          } else {
            accumulator = calback(accumulator, val, index)
          }
          index++;
          subscriber.next(accumulator);
        },
        error: (err) => {
          subscriber.error(calback(err))
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )
  })
}

function interval(intervalInMilisecond) {
  return new Observable((subscriber) => {
    let count = 0;
    const intervalId = setInterval(() => {
      subscriber.next(count);
      count++;
    },intervalInMilisecond)

    return () => {
      clearInterval(intervalId);
    }
  });
}

function take(count: number) {
  return (observable) => new Observable(subscriber => {
    let index = 1;
    if (isNaN(count)) throw new Error(`'count' is not a number`);
    if (count <= 0 ) subscriber.complete();
    const subscribtion = observable.subscribe(
      {
        next: (val) => {
          subscriber.next(val);
          if (index === count) {
            subscriber.complete();
          }
          index++;
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )

    return () => {
      subscribtion._lift();
    }
  })
}

function takeWhile(predicate: (value: any, index: number) => boolean) {
  return (observable) => new Observable(subscriber => {
    let index = 0;
    const subscribtion = observable.subscribe(
      {
        next: (val) => {
          subscriber.next(val);
          if (!predicate(val, index)) {
            subscriber.complete();
          }
          index++;
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )

    return () => {
      subscribtion._lift();
    }
  })
}

function takeUntil(notifier: Observable) {
  return (observable) => new Observable(subscriber => {
    let index = 0;
    const subscribtion = observable.subscribe(
            {
        next: (val) => {
          subscriber.next(val);
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    );

    const sub = notifier.subscribe(val => {
      subscriber.complete();
      subscribtion._lift();
      sub._lift();
    })

    return () => {
      subscribtion._lift();
      sub._lift();
    }
  })
}


function mapTo(value: any) {
  return (observable) => new Observable(subscriber => {
    let index = 0;
    const subscribtion = observable.subscribe(
            {
        next: (val) => {
          subscriber.next(value);
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    );

    return () => {
      subscribtion.unsubscribe();
    }
  })
}

function pluck(...args: string[]) {
    return (observable) => new Observable(subscriber => {
    observable.subscribe(
      {
        next: (val) => {
          let selectedValue = val;
          for (let key of args) {
            if (selectedValue.hasOwnProperty(key)) {
              selectedValue = selectedValue[key];
            }
          }
          subscriber.next(
            selectedValue
          )
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )
  })
}

function toArray() {
    return (observable) => new Observable(subscriber => {
      let result = []
    observable.subscribe(
      {
        next: (val) => {
          result.push(val);
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.next(result);
          subscriber.complete();
        }
      }
    )
  })
}

function startWith(value: any) {
  return (observable) => new Observable(subscriber => {
      subscriber.next(value);
    const subscription = observable.subscribe(
      {
        next: (val) => {
          subscriber.next(val);
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )

    return () => {
      subscription.unsubscribe();
    }
  })
}

function endWith(value: any) {
  return (observable) => new Observable(subscriber => {
    let now = Date.now();
    let timeoutId;
    const subscription = observable.subscribe(
      {
        next: (val) => {
          subscriber.next(val);
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.next(value);
          subscriber.complete();
        }
      }
    )

    return () => {
      subscription.unsubscribe();
    }
  })
}

function skip(count: number) {
    if (isNaN(count)) throw new Error('count is not a number');
    if (count < 0) throw new Error('count must be greater than zero');
    return (observable) => new Observable(subscriber => {
      let index = 0;
    observable.subscribe(
      {
        next: (val) => {
          if (index < count) subscriber.next(val);
          index++;
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )
  })
}

function find(callback: (value: any, index: number) => boolean) {
    return (observable) => new Observable(subscriber => {
      let index = 0;
      const sub = observable.subscribe(
      {
        next: (val) => {
          if (callback(val, index)) subscriber.next(val);
          index++;
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    );

    return () => {
      sub.unsubscribe();
    }
  })
}

function debounceTime(timeInMilisecond) {
  return (observable) => new Observable(subscriber => {
    let now = Date.now();
    let timeoutId;
    const subscription = observable.subscribe(
      {
        next: (val) => {
          const temp = Date.now();
          timeoutId && clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            subscriber.next(val);
          } ,timeInMilisecond) 
        },
        error: (err) => {
          subscriber.error(err)
        },
        complete: () => {
          subscriber.complete();
        }
      }
    )

    return () => {
      subscription.unsubscribe();
    }
  })
}


const of$ = of(1,2,3,4,5, 6).pipe(
  // 11, 12 , 13, ,14 ,15, 16
  map((val) => val + 10),
  // 12, 14, 16
  filter((val) => val % 2 === 0),
  // 10 + 12 + 14 + 16 = 42
  reduce((acc, val) => acc + val, 10)
);

// of$.subscribe(console.log)

// of$.subscribe({
//   next: (val) => {
//     console.log('second subscribtion', val)
//   }, 
//   error: null, 
//   complete: () => {
//     console.log('second subscribtion completed')
//   }
// });

// fromEvent(document, 'keyup').pipe(map(({key}) => key)).subscribe(console.log)

const source = of(1, 2, 3);
// basic scan example, sum over time starting with zero
const example = source.pipe(scan((acc, curr) => acc + curr, 0));
// log accumulated values
// output: 1,3,6
//const subscribe = example.subscribe(val => console.log(val));

// interval(1000).pipe(takeUntil(fromEvent(document, 'click'))).subscribe(console.log);

//  interval(1000).pipe(mapTo('hello rxjs'), takeUntil(fromEvent(document, 'click'))).subscribe(console.log, null , () => console.log('completed'));


// of({name: 'emre', address: {street: '544 sok'}}).pipe(pluck('address', 'street')).subscribe(console.log);

// interval(1000).pipe(take(5), startWith(-1),endWith(6), toArray()).subscribe(console.log);


fromEvent(document.getElementById('emre'), 'keyup')
.pipe(
  debounceTime(2000),
  map(e => e.target.value)
).subscribe(console.log);

take(3)(of(1,2,3,4,5,6,7,8)).subscribe(console.log)