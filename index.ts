import {Observable, of, fromEvent, from, interval, fetchAsObservable, merge, empty, timer, combineLatest } from './creators';
import './style.css';
import {map, filter, mapTo, reduce, scan, take, takeUntil, takeWhile, find, startWith, endWith, debounceTime, distinctUntilChanged, throttleTime, sampleTime, auditTime, switchMap, pluck, exhaustMap, tap, switchMapTo, finalize } from './operators';
import { calculateMortgage } from './helpers';
console.clear();

//       EXAMPLES

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



// of('hello', 'world', 'we', 'love', 'javascript').subscribe(
//   console.log
// )

// fromEvent(document, "click").subscribe(console.log);



console.group('of operator');

const of$ = of(1,2,3,4,5, 6).pipe(
  // 11, 12 , 13, ,14 ,15, 16
  map((val) => val + 10),
  // 12, 14, 16
  filter((val) => val % 2 === 0),
  // 10 + 12 + 14 + 16 = 42
  reduce((acc, val) => acc + val, 10)
).subscribe(console.log)

console.groupEnd();

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

const debounceResult = document.querySelector('#debounce > span')

fromEvent(document.getElementById('example'), 'keyup')
.pipe(
  debounceTime(1000),

  map(e => e.target.value),
  distinctUntilChanged()
).subscribe((val) => debounceResult.innerHTML = val);

take(3)(of(1,2,3,4,5,6,7,8)).subscribe(console.log)
// get completed 
from(fetch('https://jsonplaceholder.typicode.com/todos').then(res => res.json()))
.pipe(
)

function calculateScrollPercent(element) {
  const { scrollTop, scrollHeight, clientHeight } = element;

  return (scrollTop / (scrollHeight - clientHeight)) * 100;
}

const progressBar = document.querySelector('.progress-bar') as HTMLDivElement;

fromEvent(document, 'scroll')
  .pipe(
    auditTime(50),
    map(({target}) => calculateScrollPercent(target.documentElement))
  ).subscribe(val => {progressBar.style.width = val + '%' })

// fromEvent(document, 'click')
//   .pipe(
//     // restart counter on every click
//     switchMap(() => interval(1000).pipe(take(10)))
//   )
//   .subscribe(console.log);

const timer1 = interval(1000).pipe(mapTo('first'), take(2));
const timer2 = interval(2000).pipe(mapTo('second'), take(1));
const timer3 = interval(500).pipe(mapTo('third'), take(3));
const merged = merge(timer1, timer2, timer3);
merged.subscribe(x => console.log(x));

const COUNTDOWN_SECONDS = 10;

// elem refs
const remainingLabel = document.getElementById('remaining');
const pauseButton = document.getElementById('pause');
const resumeButton = document.getElementById('resume');

// streams
const interval$ = interval(1000).pipe(mapTo(-1));
const pause$ = fromEvent(pauseButton, 'click').pipe(mapTo(false));
const resume$ = fromEvent(resumeButton, 'click').pipe(mapTo(true));

const timer$ = merge(pause$, resume$)
  .pipe(
    startWith(true),
    switchMap(val => (val ? interval$ : empty())),
    scan((acc, curr) => (curr ? curr + acc : acc), COUNTDOWN_SECONDS),
    takeWhile(v => v > 0)
  )
  .subscribe((val: any) => remainingLabel.innerHTML = val);


const inputBox = document.getElementById('text-input');
const typeaheadContainer = document.getElementById('typeahead-container');

const BASE_URL = 'https://api.openbrewerydb.org/breweries';
// streams
const input$ = fromEvent(inputBox, 'keyup');

input$
  .pipe(
    debounceTime(200),
    map(e => e.target.value),
    distinctUntilChanged(),
    switchMap(searchTerm => fetchAsObservable(
      `${BASE_URL}?by_name=${searchTerm}`
      )
    )
  )
  .subscribe((response: any[]) => {
    typeaheadContainer.innerHTML = response.map(b => b.name).join('<br>');
  });

// const clicks = fromEvent(document, 'click');
// const result = clicks.pipe(
//   exhaustMap(ev => interval(1000).pipe(take(5)))
// );
// result.subscribe(x => console.log(x));


// elems
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const pollingStatus = document.getElementById('polling-status');
const dogImage: any = document.getElementById('dog');

// streams
const startClick$ = fromEvent(startButton, 'click');
const stopClick$ = fromEvent(stopButton, 'click');

startClick$
  .pipe(
    tap(val => console.log('tap 1')),
    exhaustMap(() =>
      timer(0, 5000).pipe(
        tap(() => {(pollingStatus.innerHTML = 'Active'); console.log('tap 2')}),
        switchMap(
          () => fetchAsObservable('https://random.dog/woof.json').pipe(pluck('url'))
        ),
        takeUntil(stopClick$),
        finalize(() => (pollingStatus.innerHTML = 'Stopped'))
      )
    )
  )
  .subscribe(url => (dogImage.src = url));

const first = document.getElementById('first');
const second = document.getElementById('second');
const latestValue = document.querySelector('.latest-value > span')


const inputAsValue = elem => {
  return fromEvent(elem, 'input').pipe(
    map((event: any) => event.target.valueAsNumber)
  );
};

combineLatest(
  inputAsValue(first), 
  inputAsValue(second)
)
.pipe(
  filter(([first, second]) => {
    return !isNaN(first) && !isNaN(second);
  }),
  map(([first, second]) => first + second)
)
.subscribe(val => latestValue.innerHTML = val);

// elems
const loanAmount = document.getElementById('loanAmount');
const interest = document.getElementById('interest');
const loanLength = document.querySelectorAll('.loanLength');
const expected = document.getElementById('expected');

// helpers
const createInputValueStream = elem => {
  return fromEvent(elem, 'input').pipe(
    map((event: any) => parseFloat(event.target.value))
  );
};

// streams
const interest$ = createInputValueStream(interest);
const loanLength$ = createInputValueStream(loanLength);
const loanAmount$ = createInputValueStream(loanAmount);

const calculation$ = combineLatest(interest$, loanAmount$, loanLength$).pipe(
  map(([interest, loanAmount, loanLength]) => {
    return calculateMortgage(interest, loanAmount, loanLength);
  }),
  tap(console.log),
  filter(mortageAmount => !isNaN(mortageAmount)),
);

calculation$.subscribe(mortageAmount => {
  expected.innerHTML = mortageAmount;
});