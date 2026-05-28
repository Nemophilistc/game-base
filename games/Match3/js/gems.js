// ============================================================
// gems.js - 宝石类定义与特殊宝石逻辑
// ============================================================

import { GEM_TYPES, SPECIAL } from './config.js';

export class Gem {
  constructor(type, special = SPECIAL.NONE) {
    this.type = type;           // 颜色id (0-6)
    this.special = special;     // 特殊类型
    this.row = 0;
    this.col = 0;

    // 动画状态
    this.x = 0;                // 渲染x（像素）
    this.y = 0;                // 渲染y（像素）
    this.scale = 1;
    this.alpha = 1;
    this.selected = false;
    this.matched = false;       // 标记即将被消除
    this.falling = false;
    this.spawning = false;
    this.spawnTimer = 0;
  }

  get info() {
    return GEM_TYPES[this.type] || GEM_TYPES[0];
  }

  get color()    { return this.info.color; }
  get glow()     { return this.info.glow; }
  get symbol()   { return this.info.symbol; }
  get name()     { return this.info.name; }

  get specialSymbol() {
    if (this.special === SPECIAL.CROSS)   return '✚';
    if (this.special === SPECIAL.RAINBOW) return '🌈';
    if (this.special === SPECIAL.RANGE)   return '✦';
    return '';
  }

  get isSpecial() {
    return this.special !== SPECIAL.NONE;
  }
}

// 生成指定颜色数的随机宝石
export function randomGemType(colorCount) {
  return Math.floor(Math.random() * colorCount);
}
