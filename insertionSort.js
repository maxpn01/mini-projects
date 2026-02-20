/* 
    today decided to just look at the solution once to understand the implementation
    and then write it myself to solidify the understanding
    it's friday ...
*/

function insertionSort(list) {
  for (let i = 1; i < list.length; i++) {
    let insertIndex = i;
    let currentValue = Number(list.splice(i, 1));

    for (let j = i - 1; j >= 0; j--) {
      if (list[j] > currentValue) {
        insertIndex = j;
      }
    }

    list.splice(insertIndex, 0, currentValue);
  }
}

const list = [3, 2, 1];
insertionSort(list);
