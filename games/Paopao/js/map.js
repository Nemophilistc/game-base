// ============================================================
// 泡泡堂 - 地图生成与渲染
// ============================================================

import { COLS, ROWS, CELL, TILE_EMPTY, TILE_HARD, TILE_SOFT, COLORS, state, game } from './config.js';

export function generateMap(stage) {
  state.map = [];
  for (let r = 0; r < ROWS; r++) {
    state.map[r] = [];
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        state.map[r][c] = TILE_HARD;
      } else if (r % 2 === 0 && c % 2 === 0) {
        state.map[r][c] = TILE_HARD;
      } else {
        state.map[r][c] = TILE_EMPTY;
      }
    }
  }
  // 放置软墙
  const softCount = 30 + stage * 5;
  let placed = 0;
  const spawnPoints = [[1, 1], [COLS - 2, ROWS - 2], [COLS - 2, 1], [1, ROWS - 2],
    [COLS - 2, Math.floor(ROWS / 2)], [Math.floor(COLS / 2), 1], [Math.floor(COLS / 2), ROWS - 2]];
  const safeSet = new Set();
  for (const [sc, sr] of spawnPoints) {
    for (const [dr, dc] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = sr + dr, nc = sc + dc;
      if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1) {
        safeSet.add(`${nr},${nc}`);
      }
    }
  }
  let attempts = 0;
  while (placed < softCount && attempts < 500) {
    const r = 1 + Math.floor(Math.random() * (ROWS - 2));
    const c = 1 + Math.floor(Math.random() * (COLS - 2));
    if (state.map[r][c] === TILE_EMPTY && !safeSet.has(`${r},${c}`)) {
      state.map[r][c] = TILE_SOFT;
      placed++;
    }
    attempts++;
  }
}

export function drawMap() {
  const ctx = game.ctx;
  if (!state.map || state.map.length === 0) return;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL;
      const y = r * CELL;
      ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.grass1 : COLORS.grass2;
      ctx.fillRect(x, y, CELL, CELL);
      if (state.map[r][c] === TILE_HARD) {
        drawHardWall(x, y);
      } else if (state.map[r][c] === TILE_SOFT) {
        drawSoftWall(x, y);
      }
    }
  }
}

function drawHardWall(x, y) {
  const ctx = game.ctx;
  ctx.fillStyle = COLORS.hard;
  ctx.fillRect(x, y, CELL, CELL);
  ctx.fillStyle = COLORS.hardLight;
  ctx.fillRect(x + 2, y + 2, CELL / 2 - 3, CELL / 2 - 3);
  ctx.fillRect(x + CELL / 2 + 1, y + CELL / 2 + 1, CELL / 2 - 3, CELL / 2 - 3);
  ctx.fillStyle = COLORS.hardDark;
  ctx.fillRect(x + CELL / 2 + 1, y + 2, CELL / 2 - 3, CELL / 2 - 3);
  ctx.fillRect(x + 2, y + CELL / 2 + 1, CELL / 2 - 3, CELL / 2 - 3);
  ctx.strokeStyle = COLORS.hardDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
}

function drawSoftWall(x, y) {
  const ctx = game.ctx;
  ctx.fillStyle = COLORS.soft;
  ctx.fillRect(x, y, CELL, CELL);
  ctx.fillStyle = COLORS.softLight;
  ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
  ctx.fillStyle = COLORS.softDark;
  ctx.fillRect(x + CELL / 2 - 2, y + 4, 4, CELL - 8);
  ctx.fillRect(x + 4, y + CELL / 2 - 2, CELL - 8, 4);
  ctx.strokeStyle = COLORS.softDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
}
