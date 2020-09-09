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