// ==================== 地图系统 ====================

import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  ENEMY_PATH, CELL_EMPTY, CELL_PATH, CELL_TOWER, MAPS
} from './config.js';

/** 地图网格：0=空地, 1=路径, 2=塔 */
export const grid = [];

/** 路径像素坐标（敌人行走用） */
export const pathPixels = [];

/** 当前选中的地图索引 */
let currentMapIndex = 0;
/** 当前使用的路径 */
let currentPath = ENEMY_PATH;

/** 获取当前地图索引 */
export function getCurrentMapIndex() { return currentMapIndex; }

/** 切换地图 */
export function selectMap(index) {
  currentMapIndex = index;
}

/** 初始化地图 */
export function initMap(path) {
  const enemyPath = path || ENEMY_PATH;
  currentPath = enemyPath;
  grid.length = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      grid[r][c] = CELL_EMPTY;
    }
  }
  // 标记路径
  for (const [c, r] of enemyPath) {
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      grid[r][c] = CELL_PATH;
    }
  }
  // 计算路径像素坐标（格子中心）
  pathPixels.length = 0;
  for (const [c, r] of enemyPath) {
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

// ---- 地图环境主题 ----
const MAP_THEMES = [
  { // 蜿蜒峡谷 - 沙漠峡谷风格
    name: 'canyon',
    pathColor: '#d4a574',
    pathTexture: '#c9976a',
    groundColor: '#c2955a',
    groundTexture: '#b5884f',
    groundAccent: '#a07840',
    decorations: drawCanyonDecor,
    arrowColor: 'rgba(80,40,0,0.2)',
    gridColor: 'rgba(0,0,0,0.06)'
  },
  { // 迷宫回廊 - 地下城风格
    name: 'dungeon',
    pathColor: '#6b6b7b',
    pathTexture: '#5a5a6a',
    groundColor: '#3a3a4a',
    groundTexture: '#2e2e3e',
    groundAccent: '#44445a',
    decorations: drawDungeonDecor,
    arrowColor: 'rgba(200,180,100,0.2)',
    gridColor: 'rgba(100,100,150,0.08)'
  },
  { // 蛇形长廊 - 暗黑森林风格
    name: 'forest',
    pathColor: '#6b5b3a',
    pathTexture: '#5a4e30',
    groundColor: '#2d5a1e',
    groundTexture: '#245018',
    groundAccent: '#1e4512',
    decorations: drawForestDecor,
    arrowColor: 'rgba(0,60,0,0.2)',
    gridColor: 'rgba(0,50,0,0.06)'
  }
];

function drawCanyonDecor(ctx, x, y, c, r, seed) {
  // 仙人掌
  if (seed === 0) {
    ctx.fillStyle = '#2d8a4e';
    ctx.fillRect(x + 22, y + 12, 6, 28);
    ctx.fillRect(x + 16, y + 18, 6, 4);
    ctx.fillRect(x + 16, y + 12, 4, 10);
    ctx.fillRect(x + 28, y + 22, 6, 4);
    ctx.fillRect(x + 28, y + 16, 4, 10);
    // 仙人掌花
    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.arc(x + 25, y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // 岩石
  if (seed === 1) {
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 42);
    ctx.lineTo(x + 18, y + 20);
    ctx.lineTo(x + 35, y + 18);
    ctx.lineTo(x + 45, y + 25);
    ctx.lineTo(x + 48, y + 42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9B8365';
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 42);
    ctx.lineTo(x + 22, y + 25);
    ctx.lineTo(x + 32, y + 23);
    ctx.lineTo(x + 28, y + 42);
    ctx.closePath();
    ctx.fill();
  }
  // 沙丘凸起
  if (seed === 2) {
    ctx.fillStyle = '#b8884f';
    ctx.beginPath();
    ctx.ellipse(x + 28, y + 40, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c99860';
    ctx.beginPath();
    ctx.ellipse(x + 28, y + 38, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 裂缝纹理
  if (seed === 3) {
    ctx.strokeStyle = '#a07040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 20);
    ctx.lineTo(x + 20, y + 28);
    ctx.lineTo(x + 35, y + 25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 28);
    ctx.lineTo(x + 18, y + 40);
    ctx.stroke();
  }
}

function drawDungeonDecor(ctx, x, y, c, r, seed) {
  // 火把
  if (seed === 0) {
    // 火把柄
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x + 25, y + 15, 5, 25);
    // 火焰
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 15);
    ctx.quadraticCurveTo(x + 27, y + 2, x + 32, y + 15);
    ctx.fill();
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 15);
    ctx.quadraticCurveTo(x + 27, y + 6, x + 30, y + 15);
    ctx.fill();
    // 光晕
    ctx.fillStyle = 'rgba(255,150,0,0.08)';
    ctx.beginPath();
    ctx.arc(x + 28, y + 12, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  // 石柱
  if (seed === 1) {
    ctx.fillStyle = '#555566';
    ctx.fillRect(x + 18, y + 5, 18, 46);
    ctx.fillStyle = '#666677';
    ctx.fillRect(x + 15, y + 3, 24, 6);
    ctx.fillRect(x + 15, y + 44, 24, 6);
    // 石柱纹理
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(x + 22, y + 12, 2, 30);
  }
  // 地面裂缝
  if (seed === 2) {
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 30);
    ctx.lineTo(x + 20, y + 25);
    ctx.lineTo(x + 35, y + 32);
    ctx.lineTo(x + 50, y + 28);
    ctx.stroke();
  }
  // 蜘蛛网
  if (seed === 3) {
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 15 + i * 10, y + 20 + i * 8);
      ctx.stroke();
    }
  }
}

function drawForestDecor(ctx, x, y, c, r, seed) {
  // 树木
  if (seed === 0) {
    // 树干
    ctx.fillStyle = '#4a3520';
    ctx.fillRect(x + 23, y + 22, 8, 25);
    // 树冠
    ctx.fillStyle = '#1a5c10';
    ctx.beginPath();
    ctx.arc(x + 27, y + 18, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x + 27, y + 15, 11, 0, Math.PI * 2);
    ctx.fill();
    // 高光
    ctx.fillStyle = '#2a9a2a';
    ctx.beginPath();
    ctx.arc(x + 23, y + 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // 蘑菇
  if (seed === 1) {
    // 蘑菇柄
    ctx.fillStyle = '#d4c4a0';
    ctx.fillRect(x + 24, y + 32, 6, 12);
    // 蘑菇帽
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.ellipse(x + 27, y + 32, 10, 7, 0, Math.PI, 0);
    ctx.fill();
    // 白点
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 23, y + 28, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 30, y + 30, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // 灌木丛
  if (seed === 2) {
    ctx.fillStyle = '#1a6010';
    ctx.beginPath();
    ctx.arc(x + 15, y + 38, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 30, y + 35, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#228018';
    ctx.beginPath();
    ctx.arc(x + 22, y + 33, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // 草丛和花朵
  if (seed === 3) {
    ctx.fillStyle = '#2a7a20';
    for (let i = 0; i < 5; i++) {
      const gx = x + 8 + i * 9;
      const gy = y + 35 + (i % 3) * 4;
      ctx.fillRect(gx, gy, 2, 8);
      ctx.fillRect(gx + 3, gy + 2, 2, 6);
    }
    // 小花
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(x + 20, y + 30, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5577';
    ctx.beginPath();
    ctx.arc(x + 38, y + 34, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 绘制地图 */
export function drawMap(ctx, path) {
  const enemyPath = currentPath;
  const theme = MAP_THEMES[currentMapIndex] || MAP_THEMES[0];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      const seed = (r * 31 + c * 17) % 8;

      if (grid[r][c] === CELL_PATH) {
        // 路径
        ctx.fillStyle = theme.pathColor;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        // 路径纹理
        ctx.fillStyle = theme.pathTexture;
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, 2);
        ctx.fillRect(x + CELL_SIZE / 3, y + CELL_SIZE / 2, CELL_SIZE / 3, 2);
      } else {
        // 空地
        ctx.fillStyle = theme.groundColor;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        // 地面纹理
        ctx.fillStyle = theme.groundTexture;
        ctx.fillRect(x, y, CELL_SIZE, 1);
        ctx.fillRect(x, y, 1, CELL_SIZE);
        // 地面装饰纹理
        if (seed < 2) {
          ctx.fillStyle = theme.groundAccent;
          ctx.fillRect(x + 10 + seed * 12, y + 15 + seed * 10, 4, 2);
          ctx.fillRect(x + 30 + seed * 6, y + 35 + seed * 5, 3, 2);
        }
        // 地图特有装饰物
        if (seed < 4) {
          theme.decorations(ctx, x, y, c, r, seed);
        }
      }

      // 网格线
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  // 绘制路径方向箭头（每隔几格）
  ctx.fillStyle = theme.arrowColor;
  for (let i = 0; i < enemyPath.length - 1; i += 3) {
    const [c1, r1] = enemyPath[i];
    const [c2, r2] = enemyPath[Math.min(i + 1, enemyPath.length - 1)];
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
  const [ec, er] = enemyPath[0];
  const [xc, xr] = enemyPath[enemyPath.length - 1];

  // 入口
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('入口', ec * CELL_SIZE + CELL_SIZE / 2, er * CELL_SIZE - 8);

  // 出口
  ctx.fillStyle = '#2ecc71';
  ctx.fillText('出口', xc * CELL_SIZE + CELL_SIZE / 2, xr * CELL_SIZE + CELL_SIZE + 12);
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
