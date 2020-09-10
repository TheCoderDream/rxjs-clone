import {Observable, of, fromEvent,  } from './creators';
import './style.css';
import {map, filter, mapTo, reduce, scan, take, takeUntil, takeWhile, find, startWith, endWith, debounceTime } from './operators';
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


fromEvent(document, 'keyup')
.pipe(
  debounceTime(2000),
  map(e => e.target.value)
).subscribe(console.log);

take(3)(of(1,2,3,4,5,6,7,8)).subscribe(console.log)