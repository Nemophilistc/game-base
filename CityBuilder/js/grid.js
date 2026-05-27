// ============================================
// 城市建设者 - 网格地图系统
// ============================================

import { GRID } from './config.js';

export class Grid {
  constructor() {
    this.cols = GRID.cols;
    this.rows = GRID.rows;
    this.cellSize = GRID.cellSize;
    this.cells = [];

    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c] = {
          building: null, // { type, level, ... }
          terrain: 'grass' // 预留地形
        };
      }
    }
  }

  // 获取单元格
  getCell(col, row) {
    if (!this.isValid(col, row)) return null;
    return this.cells[row][col];
  }

  // 设置单元格
  setCell(col, row, data) {
    if (!this.isValid(col, row)) return false;
    this.cells[row][col] = { ...this.cells[row][col], ...data };
    return true;
  }

  // 检查坐标是否有效
  isValid(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  // 世界坐标转网格坐标
  worldToGrid(worldX, worldY) {
    return {
      col: Math.floor(worldX / this.cellSize),
      row: Math.floor(worldY / this.cellSize)
    };
  }

  // 网格坐标转世界坐标（单元格左上角）
  gridToWorld(col, row) {
    return {
      x: col * this.cellSize,
      y: row * this.cellSize
    };
  }

  // 网格坐标转世界坐标（单元格中心）
  gridToWorldCenter(col, row) {
    return {
      x: col * this.cellSize + this.cellSize / 2,
      y: row * this.cellSize + this.cellSize / 2
    };
  }

  // 检查单元格是否为空
  isEmpty(col, row) {
    const cell = this.getCell(col, row);
    return cell && cell.building === null;
  }

  // 获取建筑
  getBuilding(col, row) {
    const cell = this.getCell(col, row);
    return cell ? cell.building : null;
  }

  // 放置建筑
  placeBuilding(col, row, building) {
    if (!this.isEmpty(col, row)) return false;
    return this.setCell(col, row, { building });
  }

  // 移除建筑
  removeBuilding(col, row) {
    const cell = this.getCell(col, row);
    if (!cell || !cell.building) return null;
    const removed = cell.building;
    cell.building = null;
    return removed;
  }

  // 渲染网格
  render(ctx, camera) {
    const { x: startX, y: startY } = camera.screenToWorld(0, 0);
    const { x: endX, y: endY } = camera.screenToWorld(camera.screenW, camera.screenH);

    const startCol = Math.max(0, Math.floor(startX / this.cellSize));
    const startRow = Math.max(0, Math.floor(startY / this.cellSize));
    const endCol = Math.min(this.cols - 1, Math.ceil(endX / this.cellSize));
    const endRow = Math.min(this.rows - 1, Math.ceil(endY / this.cellSize));

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // 绘制地面
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const wx = c * this.cellSize;
        const wy = r * this.cellSize;

        // 棋盘格背景
        const isLight = (c + r) % 2 === 0;
        ctx.fillStyle = isLight ? '#2d5a27' : '#2a5423';
        ctx.fillRect(wx, wy, this.cellSize, this.cellSize);
      }
    }

    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let r = startRow; r <= endRow + 1; r++) {
      ctx.beginPath();
      ctx.moveTo(startCol * this.cellSize, r * this.cellSize);
      ctx.lineTo((endCol + 1) * this.cellSize, r * this.cellSize);
      ctx.stroke();
    }
    for (let c = startCol; c <= endCol + 1; c++) {
      ctx.beginPath();
      ctx.moveTo(c * this.cellSize, startRow * this.cellSize);
      ctx.lineTo(c * this.cellSize, (endRow + 1) * this.cellSize);
      ctx.stroke();
    }

    // 绘制边界
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);

    ctx.restore();
  }
}
