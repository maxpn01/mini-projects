/*
	initial incomplete solution
	mistake was not fully understanding the problem

	what i missed
	1. the proper calculation of the mid value (should find the middle of the interval itself)
	2. low=mid+1 and high=mid-1 because old mid value is already known as not the target
*/
function initialBinarySearchSolution(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor(high / 2) + 1;

    if (arr[mid] === target) {
      return true;
    } else if (arr[mid] < target) {
      low = mid;
    } else {
      high = mid;
    }

    // console.log(low, high, mid);
  }

  return false;
}

/* the right solution */

function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (arr[mid] === target) return true;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }

  return false;
}

const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];

console.log(binarySearch(a, 7));
