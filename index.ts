import {Observable, of, fromEvent, from, interval, fetchAsObservable, merge, empty } from './creators';
import './style.css';
import {map, filter, mapTo, reduce, scan, take, takeUntil, takeWhile, find, startWith, endWith, debounceTime, distinctUntilChanged, throttleTime, sampleTime, auditTime, switchMap, pluck } from './operators';
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


fromEvent(document.getElementById('example'), 'keyup')
.pipe(
  throttleTime(1000),

  map(e => e.target.value),
  distinctUntilChanged()
).subscribe(console.log);

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