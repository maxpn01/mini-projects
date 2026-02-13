// input is array
// output is boolean

// SOLUTION 1 -- SET COMPARISON
// function hasDuplicate(nums) {
//   const unique = new Set(nums);

//   return unique.size !== nums.length;
// }

// SOLUTION 2 -- BRUTEFORCE LOOPS
// function hasDuplicate(nums) {
//   for (let i = 0; i < nums.length; i++) {
//     let current = nums[i];
//     for (let j = i + 1; j < nums.length; j++) {
//       if (nums[j] === current) return true;
//     }
//   }
//   return false;
// }

// SOLUTION 3 -- SORTED PAIRS
// function hasDuplicate(nums) {
//   const sortedNums = nums.sort();
//   let previousNum = sortedNums[0];

//   for (let i = 1; i < sortedNums.length; i++) {
//     if (sortedNums[i] === previousNum) return true;

//     previousNum = sortedNums[i];
//   }

//   return false;
// }

// SOLUTION 4 -- SEEN MAP
function hasDuplicate(nums) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    if (seen.has(current)) return true;
    seen.set(current, true);
  }

  return false;
}

// TEST CASES

console.log(hasDuplicate([1, 2, 3, 4, 4])); // true
console.log(hasDuplicate([1, 2, 3, 4, 5])); // false
