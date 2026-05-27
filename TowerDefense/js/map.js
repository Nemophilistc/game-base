// ==================== 地图系统 ====================

import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  ENEMY_PATH, CELL_EMPTY, CELL_PATH, CELL_TOWER
} from './config.js';

/** 地图网格：0=空地, 1=路径, 2=塔 */
export const grid = [];

/** 路径像素坐标（敌人行走用） */
export const pathPixels = [];

// 初始化地图
export function initMap() {
  grid.length = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      grid[r][c] = CELL_EMPTY;
    }
  }
  // 标记路径
  for (const [c, r] of ENEMY_PATH) {
    grid[r][c] = CELL_PATH;
  }
  // 计算路径像素坐标（格子中心）
  pathPixels.length = 0;
  for (const [c, r] of ENEMY_PATH) {
    pathPixels.push({
      x: c * CELL_SIZE + CELL_SIZE / 2,
      y: r * CELL_SIZE + CELL_SIZE / 2
    });
  }
}

/** 检查某格是否可建塔 */
export function canBuild(col, row) {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
  return grid[row][col] === CELL_EMPTY;
}

/** 放置塔 */
export function placeTower(col, row) {
  grid[row][col] = CELL_TOWER;
}

/** 移除塔（出售时） */
export function removeTower(col, row) {
  grid[row][col] = CELL_EMPTY;
}

/** 绘制地图 */
export function drawMap(ctx) {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;

      if (grid[r][c] === CELL_PATH) {
        // 路径 - 沙地风格
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        // 路径纹理
        ctx.fillStyle = '#c9976a';
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, 2);
        ctx.fillRect(x + CELL_SIZE / 3, y + CELL_SIZE / 2, CELL_SIZE / 3, 2);
      } else {
        // 空地 - 草地
        ctx.fillStyle = '#4a8c3f';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        // 草地纹理
        ctx.fillStyle = '#3d7a34';
        ctx.fillRect(x, y, CELL_SIZE, 1);
        ctx.fillRect(x, y, 1, CELL_SIZE);
        // 随机草点
        const seed = (r * 31 + c * 17) % 7;
        if (seed < 3) {
          ctx.fillStyle = '#5a9c4f';
          ctx.fillRect(x + 15 + seed * 8, y + 20 + seed * 5, 3, 5);
          ctx.fillRect(x + 30 + seed * 4, y + 35 + seed * 3, 2, 4);
        }
      }

      // 网格线
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  // 绘制路径方向箭头（每隔几格）
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < ENEMY_PATH.length - 1; i += 3) {
    const [c1, r1] = ENEMY_PATH[i];
    const [c2, r2] = ENEMY_PATH[Math.min(i + 1, ENEMY_PATH.length - 1)];
    const cx = c1 * CELL_SIZE + CELL_SIZE / 2;
    const cy = r1 * CELL_SIZE + CELL_SIZE / 2;
    const dx = c2 - c1;
    const dy = r2 - r1;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 入口和出口标记
  const [ec, er] = ENEMY_PATH[0];
  const [xc, xr] = ENEMY_PATH[ENEMY_PATH.length - 1];

  // 入口
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('入口', ec * CELL_SIZE + CELL_SIZE / 2, er * CELL_SIZE - 8);

  // 出口
  ctx.fillStyle = '#2ecc71';
  ctx.fillText('出口', xc * CELL_SIZE + CELL_SIZE / 2, xr * CELL_SIZE + CELL_SIZE + 14);
}

/** 像素坐标转网格坐标 */
export function pixelToGrid(px, py) {
  return {
    col: Math.floor(px / CELL_SIZE),
    row: Math.floor(py / CELL_SIZE)
  };
}

/** 网格坐标转像素中心坐标 */
export function gridToPixel(col, row) {
  return {
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2
  };
}
