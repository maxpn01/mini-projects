/* 
    today decided to just look at the solution once to understand the implementation
    and then write it myself to solidify the understanding
    it's friday ... my scarce brain cells are cooked

*/
// import { binarySearch } from "./binarySearch.js";

function insertionSort(list) {
  for (let i = 1; i < list.length; i++) {
    // let insertIndex = i;
    let currentValue = Number(list.splice(i, 1));
    // let insertIndex = binarySearch(list, currentValue);

    for (let j = i - 1; j >= 0; j--) {
      if (list[j] > currentValue) {
        insertIndex = j;
      }
    }

    list.splice(insertIndex, 0, currentValue);
  }
}

console.time();
const list = Array.from({ length: 100000 }, (_, i) => 100 - i);
// console.log(list);
insertionSort(list);
// console.log(list);
console.timeEnd();
