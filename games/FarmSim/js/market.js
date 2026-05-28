// ============================================
// 农场模拟游戏 - 市场系统
// ============================================

import { CROPS, ANIMALS, PRICE_FLUCTUATION } from './config.js';

export class Market {
  constructor() {
    // 今日价格倍率 (1.0 = 原价)
    this.priceMultiplier = {};
    // 价格历史
    this.priceHistory = {};
    // 初始化价格
    this.resetPrices();
  }

  resetPrices() {
    for (const [key, crop] of Object.entries(CROPS)) {
      this.priceMultiplier[key] = 1.0;
      if (!this.priceHistory[key]) this.priceHistory[key] = [];
    }
    for (const [key, animal] of Object.entries(ANIMALS)) {
      this.priceMultiplier[key] = 1.0;
      if (!this.priceHistory[key]) this.priceHistory[key] = [];
    }
  }

  // 每日更新价格
  updatePrices() {
    for (const key of Object.keys(this.priceMultiplier)) {
      // 随机波动 ±30%
      const change = (Math.random() - 0.5) * 2 * PRICE_FLUCTUATION;
      this.priceMultiplier[key] = Math.max(0.5, Math.min(1.5, this.priceMultiplier[key] + change));
      this.priceHistory[key].push(this.priceMultiplier[key]);
      // 只保留最近7天
      if (this.priceHistory[key].length > 7) {
        this.priceHistory[key].shift();
      }
    }
  }

  // 获取种子购买价格
  getSeedPrice(cropType) {
    const base = CROPS[cropType].seedPrice;
    const mult = this.priceMultiplier[cropType] || 1.0;
    return Math.round(base * mult);
  }

  // 获取作物出售价格
  getCropSellPrice(cropType) {
    const base = CROPS[cropType].sellPrice;
    const mult = this.priceMultiplier[cropType] || 1.0;
    return Math.round(base * mult);
  }

  // 获取动物购买价格
  getAnimalPrice(animalType) {
    const base = ANIMALS[animalType].price;
    const mult = this.priceMultiplier[animalType] || 1.0;
    return Math.round(base * mult);
  }

  // 获取动物产品出售价格
  getProductPrice(animalType) {
    const base = ANIMALS[animalType].productPrice;
    const mult = this.priceMultiplier[animalType] || 1.0;
    return Math.round(base * mult);
  }

  // 买种子
  buySeed(cropType, money) {
    const price = this.getSeedPrice(cropType);
    if (money < price) return { success: false, reason: '资金不足' };
    return { success: true, price };
  }

  // 买动物
  buyAnimal(animalType, money) {
    const price = this.getAnimalPrice(animalType);
    if (money < price) return { success: false, reason: '资金不足' };
    return { success: true, price };
  }

  // 获取所有可购买种子
  getSeedList() {
    return Object.entries(CROPS).map(([key, crop]) => ({
      type: key,
      name: crop.name,
      icon: crop.icon,
      price: this.getSeedPrice(key),
      seasons: crop.seasons,
      growTime: crop.growTime,
    }));
  }

  // 获取所有可购买动物
  getAnimalList() {
    return Object.entries(ANIMALS).map(([key, animal]) => ({
      type: key,
      name: animal.name,
      icon: animal.icon,
      price: this.getAnimalPrice(key),
      product: animal.product,
      productPrice: this.getProductPrice(key),
    }));
  }
}
