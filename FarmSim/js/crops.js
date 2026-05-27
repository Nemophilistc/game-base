// ============================================
// 农场模拟游戏 - 作物系统
// ============================================

import { CROPS, GROWTH_STAGES, STAGE_NAMES, STAGE_COLORS, PRICE_FLUCTUATION } from './config.js';

export class Crop {
  constructor(type, row, col) {
    this.type = type;
    this.data = CROPS[type];
    this.row = row;
    this.col = col;
    this.stage = GROWTH_STAGES.SEED;
    this.growthProgress = 0;    // 0~100 当前阶段进度
    this.watered = false;        // 今天是否已浇水
    this.waterLevel = 0;         // 连续浇水天数
    this.daysGrown = 0;          // 已生长天数
    this.witherChance = 0;       // 枯萎概率
    this.pestDamage = 0;         // 虫害损伤
    this.alive = true;
  }

  // 浇水
  water() {
    if (!this.alive) return false;
    if (this.watered) return false;
    if (this.stage >= GROWTH_STAGES.MATURE) return false;
    this.watered = true;
    this.waterLevel++;
    return true;
  }

  // 每天更新
  updateDay(weather) {
    if (!this.alive) return;

    // 暴风雨可能直接毁坏作物
    if (weather === 'storm' && Math.random() < 0.15) {
      this.alive = false;
      this.stage = GROWTH_STAGES.WITHERED;
      return;
    }

    // 干旱增加枯萎概率
    if (weather === 'drought') {
      this.witherChance += 0.2;
      if (!this.watered) {
        this.witherChance += 0.15;
      }
    }

    // 虫害减产
    if (weather === 'bug') {
      this.pestDamage += 0.15;
    }

    // 下雨自动浇水
    if (weather === 'rain') {
      this.watered = true;
      this.waterLevel++;
    }

    // 检查是否需要浇水（每天需要至少浇水 waterNeed 次中的1次）
    if (!this.watered && this.stage < GROWTH_STAGES.MATURE) {
      this.witherChance += 0.1;
    }

    // 枯萎判定
    if (this.witherChance > 0 && Math.random() < this.witherChance) {
      this.alive = false;
      this.stage = GROWTH_STAGES.WITHERED;
      return;
    }

    // 生长推进
    if (this.watered && this.stage < GROWTH_STAGES.MATURE) {
      const growPerDay = 100 / this.data.growTime; // 每天生长百分比
      this.growthProgress += growPerDay;

      // 检查是否进入下一阶段
      if (this.growthProgress >= 100) {
        this.growthProgress = 0;
        this.stage++;
        if (this.stage > GROWTH_STAGES.MATURE) {
          this.stage = GROWTH_STAGES.MATURE;
        }
      }
    }

    this.daysGrown++;

    // 成熟后如果太久不收获可能掉落品质
    if (this.stage === GROWTH_STAGES.MATURE && this.daysGrown > this.data.growTime + 5) {
      this.pestDamage += 0.05;
    }

    // 重置每日状态
    this.watered = false;
  }

  // 收获
  harvest() {
    if (!this.alive || this.stage !== GROWTH_STAGES.MATURE) return null;

    const [minYield, maxYield] = this.data.yield;
    let amount = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;

    // 虫害减少产量
    if (this.pestDamage > 0) {
      const loss = Math.floor(amount * Math.min(this.pestDamage, 0.5));
      amount = Math.max(1, amount - loss);
    }

    return {
      type: this.type,
      name: this.data.name,
      amount,
      sellPrice: this.data.sellPrice,
      icon: this.data.icon,
    };
  }

  // 获取阶段名称
  getStageName() {
    return STAGE_NAMES[this.stage];
  }

  // 获取阶段颜色
  getStageColor() {
    return STAGE_COLORS[this.stage];
  }

  // 是否可收获
  isHarvestable() {
    return this.alive && this.stage === GROWTH_STAGES.MATURE;
  }

  // 是否需要浇水
  needsWater() {
    return this.alive && !this.watered && this.stage < GROWTH_STAGES.MATURE;
  }
}
