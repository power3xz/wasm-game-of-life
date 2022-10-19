import { Universe } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg.wasm";

const CELL_SIZE = 5;
const GRID_COLOR = "#ccc";
const DEAD_COLOR = "#fff";
const ALIVE_COLOR = "#000";

const universe = Universe.new();
const width = universe.width();
const height = universe.height();
const canvas = document.getElementById(
  "game-of-life-canvas"
)! as HTMLCanvasElement;
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;
canvas.addEventListener("click", (event) => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  if (readyGlider) {
    universe.set_cell(row - 1, col, true);
    universe.set_cell(row, col + 1, true);
    universe.set_cell(row + 1, col - 1, true);
    universe.set_cell(row + 1, col, true);
    universe.set_cell(row + 1, col + 1, true);
  } else if (readyPulsar) {
  } else {
    universe.toggle_cell(row, col);
  }

  drawGrid();
  drawCells();
});
const ctx = canvas.getContext("2d");

const drawGrid = () => {
  if (!ctx) {
    return;
  }
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }
  ctx.stroke();
};

const getIndex = (row: number, column: number) => {
  return row * width + column;
};

const bitIsSet = (n: number, arr: Uint8Array) => {
  const byte = Math.floor(n / 8);
  const mask = 1 << n % 8;
  return (arr[byte] & mask) === mask;
};

const drawCells = () => {
  if (!ctx) {
    return;
  }
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, (width * height) / 8);

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      ctx.fillStyle = bitIsSet(idx, cells) ? ALIVE_COLOR : DEAD_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

let animationId: null | number = null;
let tickPerFrame = 1;

const playPauseButton = document.getElementById("play-pause")!;

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = "▶️";
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

playPauseButton.addEventListener("click", () => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});
let readyGlider = false;
let readyPulsar = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Alt") {
    readyGlider = true;
  }
  if (e.key === "Shift") {
    readyPulsar = true;
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Alt") {
    readyGlider = false;
  }
  if (e.key === "Shift") {
    readyPulsar = false;
  }
});

const tickRange = document.querySelector<HTMLInputElement>("#tick-range")!;
tickRange.addEventListener("change", (e) => {
  tickPerFrame = (e.target as any).value;
  console.log(tickPerFrame);
});

const isPaused = () => {
  return animationId === null;
};
const renderLoop = () => {
  for (let i = 0; i < tickPerFrame; i++) {
    universe.tick();
  }

  drawGrid();
  drawCells();

  animationId = requestAnimationFrame(renderLoop);
};

drawGrid();
drawCells();
play();
