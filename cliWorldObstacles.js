import readline from "readline";
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const ROWS = 20;
const COLS = 20;
// 100ms -> 10 FPS
// 50ms -> 20 FPS
const TICK_MS = 50;
const PLAYER_SYMBOL = "|";
const OBSTACLE_SYMBOL = "*";
const OBSTACLE_SPAWN_COOLDOWN = 10;
const OBSTACLE_SPEED = 5; // cells/sec
const SCORE_POINTS = 10;

const state = {
  board: [],
  player: {
    x: Math.floor(COLS / 2),
    y: Math.floor(ROWS / 2),
    symbol: PLAYER_SYMBOL,
  },
  obstacles: [],
  spawnTimer: OBSTACLE_SPAWN_COOLDOWN,
  score: 0,
};

function update(state, dtMs) {
  state.spawnTimer -= dtMs;

  if (state.spawnTimer <= 0) {
    const randomY = Math.floor(Math.random() * ROWS);

    state.obstacles.push({
      x: COLS - 1,
      y: randomY,
      symbol: OBSTACLE_SYMBOL,
    });

    state.spawnTimer = 400 + Math.random() * 600; // 0.4s to 1.0s
  }

  const obstacleSpeed = (OBSTACLE_SPEED * dtMs) / 1000;

  for (let i = 0; i < state.obstacles.length; i++) {
    state.obstacles[i].x -= obstacleSpeed;

    if (
      Math.floor(state.obstacles[i].x) === state.player.x &&
      state.obstacles[i].y === state.player.y
    ) {
      process.exit();
    }

    if (state.obstacles[i].x < 0) {
      state.obstacles.splice(i, 1);
      state.score += SCORE_POINTS;
      i--;
    }
  }
}

function render(state) {
  const { board, player, obstacles, score } = state;

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

  for (let i = 0; i < obstacles.length; i++) {
    const ox = Math.round(obstacles[i].x);
    const oy = Math.round(obstacles[i].y);

    if (ox >= 0 && ox < COLS) {
      board[oy][ox] = obstacles[i].symbol;
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
  // console.log("score: ", score);
  // console.log(obstacles);
  // console.log(player);
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
  setInterval(() => {
    update(state, TICK_MS);
    render(state);
  }, TICK_MS);
}

initGameLoop();
