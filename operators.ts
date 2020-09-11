import { Observable } from './creators';


export function map(calback: Function) {
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

export function filter(calback: Function) {
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


export function reduce(calback: Function, initial?: any) {

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

export function scan(calback: Function, initial?: any) {

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

export function take(count: number) {
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

export function takeWhile(predicate: (value: any, index: number) => boolean) {
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

export function takeUntil(notifier: Observable) {
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


export function mapTo(value: any) {
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

export function pluck(...args: string[]) {
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

export function toArray() {
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

export function startWith(value: any) {
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

export function endWith(value: any) {
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

export function skip(count: number) {
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

export function find(callback: (value: any, index: number) => boolean) {
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

export function debounceTime(timeInMilisecond) {
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

export function switchMap(project: (val) => Observable) {
  return (observable) => new Observable(subscriber => {
    let innerSub;
    const sub = observable.subscribe(
      {
        next: (val) => {
          if (innerSub) {
            innerSub.unsubscribe();
            innerSub._lift();
          }

          innerSub = project(val).subscribe(
            {
              next: (value) => {
                subscriber.next(value); 
              }
            }
          )
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
        if (innerSub) {
            innerSub.unsubscribe();
            innerSub._lift();
       }
    }
  });
}

function mergeMap(project: (val) => Observable) {
  return (observable) => new Observable(subscriber => {
    let innerSub;
    const sub = observable.subscribe(
      {
        next: (val) => {
          if (innerSub) {
            innerSub.unsubscribe();
            innerSub._lift();
          }

          innerSub = project(val).subscribe(
            {
              next: (value) => {
                subscriber.next(value); 
              }
            }
          )
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
        if (innerSub) {
            innerSub.unsubscribe();
            innerSub._lift();
       }
    }
  });
}

export function distinctUntilChanged(compare?: (prev, next) => boolean) {
    return (observable) => new Observable(subscriber => {
      let prevVal;
      let nextVal;
      const sub = observable.subscribe(
      {
        next: (val) => {
          nextVal = val;
          if (compare && compare(prevVal, nextVal)) subscriber.next(val);
          if (prevVal !== nextVal) subscriber.next(val);
          prevVal = val;
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

export function throttleTime(rate: number) {
      return (observable) => new Observable(subscriber => {
      let lastEmmision = Date.now() - rate;
      const sub = observable.subscribe(
      {
        next: (val) => {
          if (Date.now() - lastEmmision >= rate) {
            subscriber.next(val);
            lastEmmision = Date.now();
          }
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

export function sampleTime(rate: number) {
      return (observable) => new Observable(subscriber => {
      let lastValue;
      const intervalId = setInterval(() => {
        if (lastValue !== undefined) subscriber.next(lastValue);
      }, rate)
      const sub = observable.subscribe(
      {
        next: (val) => {
          lastValue = val;
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
      clearInterval(intervalId);
    }
  })
}

export function auditTime(rate: number) {
      return (observable) => new Observable(subscriber => {
      let lastValue;
      let active = false;
      let timeoutId;
      const sub = observable.subscribe(
      {
        next: (val) => {
          lastValue = val;
          if (!active) {
            timeoutId = setTimeout(() => {
              subscriber.next(lastValue);
              active = false;
            }, rate)
          }
          active = true;
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
      clearTimeout(timeoutId);
    }
  })
}

export function finalize(callback: () => void) {
  return (observable) => new Observable(subscriber => {
    const sub = observable.subscribe(
      {
        next: (val) => {
          subscriber.next(val);
        },
        error: (err) => {
          callback();
          subscriber.error(err);
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