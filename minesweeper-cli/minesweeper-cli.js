import PromptSync from "prompt-sync";

const input = PromptSync({ sigint: true });

const flatten2DArray = (array) => {
  const flattenedArray = [];

  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      flattenedArray.push(array[i][j]);
    }
  }

  return flattenedArray;
};

const split = (s, separator) => {
  const arr = [""];

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (char === separator) arr.push("");
    else arr[arr.length - 1] += s[i];
  }

  return arr;
};

const checkIsInteger = (str) => /^\d+$/.test(str);

const checkInvalidBounds = (x, y) =>
  x < 0 || y < 0 || x >= boardW || y >= boardH;

const getInputInt = (s) => {
  if (!checkIsInteger(s) || s === "0") {
    console.log("only positive integers allowed\n");
    return null;
  }

  return parseInt(s);
};

let rows = 0,
  cols = 0,
  mines = 0;

while (true) {
  rows = getInputInt(input("rows: "));
  if (rows === null) continue;

  cols = getInputInt(input("cols: "));
  if (cols === null) continue;

  mines = getInputInt(input("mines: "));
  if (mines === null) continue;
  if (mines > rows * cols) {
    console.log("can't be more mines than total cells\n");
    continue;
  }

  if (rows !== null && cols !== null && mines !== null) break;
}

const boardW = cols;
const boardH = rows;
const neighborCoords = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const genCell = (x, y) => ({
  x,
  y,
  isRevealed: false,
  hasMine: false,
  neighborMines: 0,
});

const updateNeighborCount = (board, row, col, cell) => {
  for (const [x, y] of neighborCoords) {
    const nY = row + y;
    const nX = col + x;

    if (checkInvalidBounds(nX, nY)) continue;

    const nCell = board[nY][nX];

    if (nCell.hasMine) cell.neighborMines++;
  }
};

const generateBoard = () => {
  const board = [];
  for (let row = 0; row < boardH; row++) {
    board[row] = [];
    for (let col = 0; col < boardW; col++) {
      board[row][col] = genCell(col, row);
    }
  }

  const shuffledCoords = flatten2DArray(board);
  for (let i = shuffledCoords.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * i);

    [shuffledCoords[i], shuffledCoords[randomIndex]] = [
      shuffledCoords[randomIndex],
      shuffledCoords[i],
    ];
  }

  for (let i = 0; i < mines; i++) {
    const { x, y } = shuffledCoords[i];

    board[y][x].hasMine = true;
  }

  for (let row = 0; row < boardH; row++) {
    for (let col = 0; col < boardW; col++) {
      const cell = board[row][col];

      if (cell.hasMine) continue;

      updateNeighborCount(board, row, col, cell);
    }
  }

  return board;
};

const revealCellsBFS = (board, startCell) => {
  const queue = [startCell];

  while (queue.length > 0) {
    const cell = queue.shift();

    for (const [x, y] of neighborCoords) {
      const nX = cell.x + x;
      const nY = cell.y + y;

      if (checkInvalidBounds(nX, nY)) continue;

      const nCell = board[nY][nX];

      if (nCell.isRevealed || nCell.hasMine) continue;

      nCell.isRevealed = true;
      safeCellsLeft--;

      if (nCell.neighborMines === 0) {
        queue.push(nCell);
      }
    }
  }

  safeCellsLeft--;
}

// old approach
// const revealCellsRecursively = (board, cell) => {
//   for (const [x, y] of neighborCoords) {
//     const nX = cell.x + x;
//     const nY = cell.y + y;

//     if (checkInvalidBounds(nX, nY)) continue;

//     const nCell = board[nY][nX];

//     if (nCell.isRevealed || nCell.hasMine) continue;

//     nCell.isRevealed = true;
//     safeCellsLeft--;

//     if (safeCellsLeft <= 0) break;

//     if (nCell.neighborMines === 0)
//       revealCellsRecursively(board, nCell);
//   }
// };

const displayBoard = (board) => {
  let output = "\n";

  output += "   ";

  for (let col = 1; col <= boardW; col++) {
    if (col < 10 && boardW >= 10) output += ` ${col} `;
    else if (col >= 10 && boardW >= 10) output += ` ${col}`;
    else output += `${col}  `;
  }

  output += "\n";

  for (let row = 0; row < boardH; row++) {
    if (row + 1 < 10 && boardH >= 10) output += `${row + 1}  `;
    else output += `${row + 1} `;

    for (let col = 0; col < boardW; col++) {
      const cell = board[row][col];
      const isRevealed = cell.isRevealed;

      if (!isRevealed) {
        output += " # ";
      } else {
        const hasM = cell.hasMine;
        const hasNM = cell.neighborMines > 0;
        const nm = cell.neighborMines;

        output += hasM ? " * " : hasNM ? ` ${nm} ` : " _ ";
      }
    }

    output += "\n";
  }

  console.log(output);
};

let board = generateBoard();

let safeCellsLeft = rows * cols - mines;

while (true) {
  displayBoard(board);

  let index = input("index (x,y): ");
  if (!index) {
    console.log("can't be empty");
    continue;
  }

  const coords = split(index, ",");
  if (coords.length !== 2) {
    console.log("hey there, enter coords in x,y format");
    continue;
  }

  const x = coords[0] - 1;
  const y = coords[1] - 1;
  if (!checkIsInteger(x) || !checkIsInteger(y)) {
    console.log("only positive integers allowed");
    continue;
  }

  let hasInvalidBounds = checkInvalidBounds(x, y);

  if (hasInvalidBounds) {
    console.log("index outside of bounds");
    continue;
  }

  let cell = board[y][x];

  if (cell.isRevealed) {
    console.log("this cell is already revealed")
    continue;
  }

  cell.isRevealed = true;

  if (cell.hasMine) {
    console.log("a mine has been revealed 0w0");
    console.log("you lost the game :(");

    displayBoard(board);

    let newGame = input("new game? (y/n) ");
    if (newGame === "n") break;

    board = generateBoard();

    safeCellsLeft = rows * cols - mines;
  }

  if (cell.neighborMines === 0) {
    revealCellsBFS(board, cell);
  } else {
    safeCellsLeft--;
  }

  if (safeCellsLeft === 0) {
    console.log("yay, all non-mine cells have been revealed!!!");
    console.log("look who has won :)");

    displayBoard(board);

    let newGame = input("new game? (y/n) ");
    if (newGame === "n") break;

    board = generateBoard();

    safeCellsLeft = rows * cols - mines;
  }
}
