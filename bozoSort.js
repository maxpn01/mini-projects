function checkIsSorted(list) {
  for (let i = 0; i < list.length - 1; i++) {
    if (list[i] > list[i + 1]) return false;
  }

  return true;
}

function bozoSort(list) {
  const sortedList = [...list];

  while (!checkIsSorted(sortedList)) {
    let i = Math.floor(Math.random() * list.length);
    let j = Math.floor(Math.random() * list.length);

    [sortedList[i], sortedList[j]] = [sortedList[j], sortedList[i]];

    console.log(sortedList);
  }

  return sortedList;
}

// const list = [5, 4, 3, 2, 1]; // 10ms
// const list = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // 37s, 12s
const list = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // vs code crashed

console.time("bozo");
const sorted = bozoSort(list);
console.timeEnd("bozo");

console.log(sorted);
