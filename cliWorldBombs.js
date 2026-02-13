import readline from "readline";
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const ROWS = 20;
const COLS = 20;
// 100ms -> 10 FPS
// 50ms -> 20 FPS
const TICK_MS = 50;
const PLAYER_SYMBOL = "|";
const BOMB_SYMBOL = "*";
const BOMB_SPAWN_COOLDOWN = 10;
const BOMB_SETOFF_TIME = 50; // ms

const state = {
  board: [],
  player: {
    x: Math.floor(COLS / 2),
    y: Math.floor(ROWS / 2),
    symbol: PLAYER_SYMBOL,
  },
  bombs: [],
  spawnTimer: BOMB_SPAWN_COOLDOWN,
};

function initBoard(state) {
  for (let y = 0; y < ROWS; y++) {
    state.board[y] = [];

    for (let x = 0; x < COLS; x++) {
      state.board[y][x] = ".";
    }
  }
}

function update(state, dtMs) {
  state.spawnTimer -= dtMs;

  if (state.spawnTimer <= 0) {
    const randomX = Math.floor(Math.random() * COLS);
    const randomY = Math.floor(Math.random() * ROWS);

    state.bombs.push({
      x: randomX,
      y: randomY,
      symbol: BOMB_SYMBOL,
      setOffCount: BOMB_SETOFF_TIME,
      exploaded: false,
    });
    state.board[randomY][randomX] = BOMB_SYMBOL;

    state.spawnTimer = 400 + Math.random() * 600; // 0.4s to 1.0s
  }

  for (let i = 0; i < state.bombs.length; i++) {
    if (state.bombs[i].exploaded) {
      state.board[state.bombs[i].y][state.bombs[i].x] = " ";
      continue;
    }

    state.bombs[i].setOffCount--;

    if (state.bombs[i].setOffCount > 0) continue;

    state.bombs[i].exploaded = true;

    const bx = state.bombs[i].x;
    const by = state.bombs[i].y;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = by + dy;
        const nx = bx + dx;

        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
          if (dx !== 0 || dy !== 0) state.board[ny][nx] = " ";
        }
      }
    }

    if (
      state.bombs[i]?.x === state.player.x &&
      state.bombs[i]?.y === state.player.y
    ) {
      console.log("boom u ded");
      process.exit();
    }
  }
}

function render(state) {
  const { board, player } = state;

  let output = "";

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x === player.x && y === player.y) {
        output += player.symbol + " ";
      } else {
        output += board[y][x] + " ";
      }
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

  if (key.name === "k") state.player.y -= 1;
  if (key.name === "j") state.player.y += 1;
  if (key.name === "h") state.player.x -= 1;
  if (key.name === "l") state.player.x += 1;

  state.player.x = clamp(state.player.x, 0, COLS - 1);
  state.player.y = clamp(state.player.y, 0, ROWS - 1);
});

function initGameLoop() {
  initBoard(state);
  setInterval(() => {
    update(state, TICK_MS);
    render(state);
  }, TICK_MS);
}

initGameLoop();
