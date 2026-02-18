/*
	implemented mostly, except missed a few minor improvements

	what i missed
	1. length - 1 in loops
	2. length - i in inner loop
*/
function bubbleSort(list) {
  const sortedList = [...list];

  console.log(list);

  for (let i = 0; i < sortedList.length - 1; i++) {
    for (let j = 0; j < sortedList.length - 1 - i; j++) {
      if (sortedList[j] > sortedList[j + 1]) {
        const temp = sortedList[j];
        sortedList[j] = sortedList[j + 1];
        sortedList[j + 1] = temp;
      }
    }
  }

  return sortedList;
}

const list = [5, 4, 3, 2, 1];
const sortedList = bubbleSort(list);

console.log(sortedList);
