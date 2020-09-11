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

export class Observable {
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

export function of(...args: Array<any>): Observable {
  return new Observable(subscriber => {
    args.forEach(val => {
      subscriber.next(val);
    });
    subscriber.complete();
  });
}

export function fromEvent(element, eventTpye: string) {
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

export function interval(intervalInMilisecond) {
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


const GeneratorFunction = function*(){}.constructor;
const AsyncFunction = async function(){}.constructor;
const AsyncGeneratorFunction = async function*(){}.constructor;

function fromArray(arr: Array<any>) {
  return new Observable(subscriber => {
    arr.forEach(val => {
      subscriber.next(val);
    });
    subscriber.complete();
  });
}

function fromPromise(promise: Promise<any>) {
  return new Observable(async subscriber => {
    try {
      const response = await promise;
      subscriber.next(response);
    } catch(error) {
      subscriber.next(error);
    } finally {
      subscriber.complete();
    }
  });
}

// it is not possible to cancel promise 
// passing signal parameter into fetch api solves that
export function fetchAsObservable(input: RequestInfo, init?: RequestInit){
  return new Observable((subscriber) =>{
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(input, {...init, signal})
      .then(res => res.json())
      .then(res => subscriber.next(res))
      .catch(err => subscriber.error(err))
      .finally(() => subscriber.complete());

    return () => {
      controller.abort();
    }
  })
}

function fromGenerator(gen: GeneratorFunction) {
  return new Observable(subscriber => {
    for (let value of gen()) {
      console.log(value)
      subscriber.next(value);
    }
    subscriber.complete();
  });
}


export function from(value: any) {
  if (!!value && typeof value.subscribe !== 'function' && typeof value.then === 'function') {
    return fromPromise(value);
  } else if (Array.isArray(value)) {
    return fromArray(value);
  } else if (typeof value === 'string') {
    return fromArray(value.split(''));
  }
}

export function merge(...observables: Array<Observable>) {
  return new Observable(subscriber => {
    const subscribtion = [];
    let completedCount = 0;
    observables.forEach(observable => {
      subscribtion.push(
        observable.subscribe({
          next: (val) => {
            subscriber.next(val);
          },
          error: (err) => {
            subscriber.error(err);
            completedCount++;
          },
          complete: () => {
            completedCount++;
            if (completedCount === subscribtion.length) {
              subscriber.complete();
            }
          }
        })
      )
    })

    return () => {
      subscribtion.forEach(s => {
        s.unsubscribe();
      })
    }
  });
}

export function empty() {
  return new Observable((subscriber) => {
    subscriber.complete();
  });
}