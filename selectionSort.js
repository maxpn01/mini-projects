/*
	implemented after a long ahh time
	the sort logic itself is ez, but it took me too long to figure out blunders in the code

  dumb ahh mistakes
  1. used smallestValue instead of smallestIndex
  2. used that smallestValue to swap with list value which didnt work for obv reasons
  3. hence i was getting [1, 1, 1] for [3, 2, 1]
*/

function selectionSort(list) {
  for (let i = 0; i < list.length; i++) {
    let smallestIndex = i;

    for (let j = i; j < list.length; j++) {
      if (list[j] < list[smallestIndex]) {
        smallestIndex = j;
      }
    }

    [list[i], list[smallestIndex]] = [list[smallestIndex], list[i]];
  }
}

const list = [3, 2, 1];
selectionSort(list);

console.log(list);
