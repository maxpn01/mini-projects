// globals
const ROWS = 15;
const COLS = 15;
const MINES = 30;

const root = document.documentElement;

root.style.setProperty("--rows", ROWS);
root.style.setProperty("--cols", COLS);

const CELL_TYPES = {
  EMPTY: "empty",
  MINE: "mine",
  COUNTER: "counter",
};

const boardElement = document.querySelector(".board");
const statusElement = document.getElementById("status");

const board = [];
let isGameOver = false;

// SVG templates
const MINE_SVG = `<svg class="mine-icon" viewBox="0 0 24 24"><path d="M12,2L14.85,5.15L19,4L17.85,8.15L21,11L17.85,13.85L19,18L14.85,16.85L12,20L9.15,16.85L5,18L6.15,13.85L3,11L6.15,8.15L5,4L9.15,5.15L12,2M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" /></svg>`;
const DOT_HTML = `<div class="empty-dot"></div>`;

// audio assets
const boomSound = new Audio("assets/boom.wav");
const cellClickSound = new Audio("assets/safe-click.ogg");
const winSound = new Audio("assets/sector-secured.wav");
const backgroundMusic = new Audio("assets/background.wav");

backgroundMusic.autoplay = true;
backgroundMusic.loop = true;
backgroundMusic.volume = 1;
window.addEventListener("load", backgroundMusic.play(), { once: true });

function playSoundFromStart(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play();
}

// add mine count text
document.getElementById("mine-count").textContent = MINES.toString().padStart(
  2,
  "0",
);

// init board
for (let y = 0; y < ROWS; y++) {
  board[y] = [];
  for (let x = 0; x < COLS; x++) {
    board[y][x] = {
      x,
      y,
      type: CELL_TYPES.EMPTY,
      content: DOT_HTML,
      isRevealed: false,
    };
  }
}

// add mines
let placedMines = 0;
while (placedMines < MINES) {
  const randomY = Math.floor(Math.random() * ROWS);
  const randomX = Math.floor(Math.random() * COLS);

  if (board[randomY][randomX].type === "mine") continue;

  board[randomY][randomX].type = CELL_TYPES.MINE;
  board[randomY][randomX].content = MINE_SVG;

  placedMines++;
}

// add counters
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    if (board[y][x].type === CELL_TYPES.MINE) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) continue;
          if (dx === 0 && dy === 0) continue;
          if (board[ny][nx].type === CELL_TYPES.MINE) continue;

          board[ny][nx].type = CELL_TYPES.COUNTER;

          if (typeof board[ny][nx].content !== "number") {
            board[ny][nx].content = 1;
          } else {
            board[ny][nx].content += 1;
          }
        }
      }
    }
  }
}

// render board
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const cell = board[y][x];
    const el = createElement("div", `cell-${y}-${x}`, "cell hidden");

    el.addEventListener("click", () => onCellClick(cell, el));

    boardElement.append(el);
  }
}

function onCellClick(cell, el) {
  if (isGameOver || cell.isRevealed) return;

  if (cell.type === CELL_TYPES.MINE) {
    playSoundFromStart(boomSound);
    endGame(false);
    revealCell(cell, el);
  } else if (cell.type === CELL_TYPES.EMPTY) {
    playSoundFromStart(cellClickSound);
    floodFill(cell.y, cell.x);
    checkWin();
  } else {
    playSoundFromStart(cellClickSound);
    revealCell(cell, el);
    checkWin();
  }
}

function floodFill(startY, startX) {
  const queue = [[startY, startX]];
  const seen = new Set([`${startY},${startX}`]);

  while (queue.length) {
    const [y, x] = queue.shift();
    const cell = board[y][x];
    const el = document.getElementById(`cell-${y}-${x}`);

    revealCell(cell, el);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = y + dy;
        const nx = x + dx;

        if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) continue;
        if (board[ny][nx].type !== CELL_TYPES.EMPTY) continue;

        const key = `${ny},${nx}`;
        if (!seen.has(key)) {
          seen.add(key);
          queue.push([ny, nx]);
        }
      }
    }
  }
}

function checkWin() {
  let revealedSafeCells = 0;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x].type !== CELL_TYPES.MINE && board[y][x].isRevealed) {
        revealedSafeCells++;
      }
    }
  }

  if (revealedSafeCells === ROWS * COLS - MINES) {
    winSound.play();
    endGame(true);
  }
}

function endGame(won) {
  isGameOver = true;
  statusElement.textContent = won ? "CLEARED" : "FAILED";
  statusElement.style.color = won ? "var(--neon-yellow)" : "var(--neon-pink)";

  // reveal all mines
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x].type === CELL_TYPES.MINE) {
        revealCell(board[y][x], document.getElementById(`cell-${y}-${x}`));
      }
    }
  }

  setTimeout(() => {
    const overlay = document.getElementById("overlay");
    const title = document.getElementById("modal-title");
    const text = document.getElementById("modal-text");

    overlay.style.display = "flex";

    if (won) {
      title.textContent = "ENCRYPTED SUCCESS";
      title.style.color = "var(--neon-cyan)";
      title.style.textShadow = "0 0 10px var(--neon-cyan)";
      text.textContent = "Sector secured. Neural integrity 100%.";
      overlay.querySelector(".modal").style.borderColor = "var(--neon-cyan)";
      overlay.querySelector(".modal").style.boxShadow =
        "0 0 30px rgba(0, 242, 255, 0.4)";
    }
  }, 1800);
}

function revealCell(cell, el) {
  if (cell.isRevealed) return;

  cell.isRevealed = true;
  el.innerHTML = cell.content;

  el.classList.remove("hidden");
  el.classList.add("revealed", `cell-${cell.type}`);
}

function createElement(type, id, className, innerHTML) {
  const element = document.createElement(type);

  if (id) element.id = id;
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;

  if (className?.includes("cell")) {
    element.classList.add("hidden");
  }

  return element;
}
