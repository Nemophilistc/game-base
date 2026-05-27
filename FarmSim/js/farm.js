// ============================================
// 农场模拟游戏 - 农田系统
// ============================================

import { GRID_COLS, GRID_ROWS, GROWTH_STAGES } from './config.js';
import { Crop } from './crops.js';

// 地块状态
export const TILE_STATES = {
  GRASS: 0,    // 草地
  TILLED: 1,   // 已翻地
  PLANTED: 2,  // 已种植
};

export class Farm {
  constructor() {
    // 地块状态
    this.tiles = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => TILE_STATES.GRASS)
    );
    // 作物数据
    this.crops = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => null)
    );
    // 库存：收获的作物
    this.inventory = {};
    // 背包中的种子
    this.seeds = {};
  }

  // 翻地
  till(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    if (this.tiles[row][col] !== TILE_STATES.GRASS) return false;
    this.tiles[row][col] = TILE_STATES.TILLED;
    return true;
  }

  // 种植
  plant(row, col, cropType) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    if (this.tiles[row][col] !== TILE_STATES.TILLED) return false;
    if (!this.seeds[cropType] || this.seeds[cropType] <= 0) return false;

    this.tiles[row][col] = TILE_STATES.PLANTED;
    this.crops[row][col] = new Crop(cropType, row, col);
    this.seeds[cropType]--;
    if (this.seeds[cropType] <= 0) delete this.seeds[cropType];
    return true;
  }

  // 浇水
  water(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    const crop = this.crops[row][col];
    if (!crop) return false;
    return crop.water();
  }

  // 收获
  harvest(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    const crop = this.crops[row][col];
    if (!crop) return null;

    const result = crop.harvest();
    if (result) {
      // 添加到库存
      if (!this.inventory[result.type]) {
        this.inventory[result.type] = { ...result, amount: 0 };
      }
      this.inventory[result.type].amount += result.amount;

      // 清除地块
      this.crops[row][col] = null;
      this.tiles[row][col] = TILE_STATES.TILLED; // 翻回可种植状态
    }
    return result;
  }

  // 清除枯萎作物
  clearWithered(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    const crop = this.crops[row][col];
    if (!crop || crop.alive) return false;

    this.crops[row][col] = null;
    this.tiles[row][col] = TILE_STATES.TILLED;
    return true;
  }

  // 每日更新所有作物
  updateDay(weather) {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const crop = this.crops[r][c];
        if (crop) {
          crop.updateDay(weather);
        }
      }
    }
  }

  // 添加种子
  addSeeds(type, amount) {
    this.seeds[type] = (this.seeds[type] || 0) + amount;
  }

  // 出售库存
  sellInventory(type) {
    if (!this.inventory[type] || this.inventory[type].amount <= 0) return 0;
    const item = this.inventory[type];
    const total = item.amount * item.sellPrice;
    const amount = item.amount;
    delete this.inventory[type];
    return { total, amount };
  }

  // 获取地块信息
  getTileInfo(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return {
      state: this.tiles[row][col],
      crop: this.crops[row][col],
    };
  }
}
