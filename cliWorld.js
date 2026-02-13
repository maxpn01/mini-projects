import readline from "readline";
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const ROWS = 25;
const COLS = 25;

const state = {
  board: [],
  player: { x: 0, y: 0, symbol: "|" },
};

function render(state) {
  const { board, player } = state;

  for (let y = 0; y < ROWS; y++) {
    board[y] = [];

    for (let x = 0; x < COLS; x++) {
      if (x === player.x && y === player.y) {
        board[y][x] = player.symbol;
      } else {
        board[y][x] = ".";
      }
    }
  }

  let output = "";

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      output += board[y][x] + " ";
    }

    output += "\n";
  }

  console.clear();
  console.log(output);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

process.stdin.on("keypress", (str, key) => {
  if (key.name === "q" || (key.ctrl && key.name === "c")) {
    process.exit();
  }

  if (key.name === "up" || key.name === "w") state.player.y -= 1;
  if (key.name === "down" || key.name === "s") state.player.y += 1;
  if (key.name === "left" || key.name === "a") state.player.x -= 1;
  if (key.name === "right" || key.name === "d") state.player.x += 1;

  state.player.x = clamp(state.player.x, 0, COLS - 1);
  state.player.y = clamp(state.player.y, 0, ROWS - 1);
});

function initGameLoop() {
  setInterval(() => {
    render(state);
  }, 50); // 100 = 10 FPS, 50 = 20 FPS
}

initGameLoop();
