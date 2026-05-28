// ============================================================
// menu.js - 菜单系统（解锁菜品、定价、食材成本）
// ============================================================
import { DISHES } from './config.js';

export class MenuSystem {
  constructor() {
    // 解锁的菜品id列表
    this.unlocked = ['tea', 'rice', 'noodle']; // 初始3道菜
    // 自定义价格调整 (可选：玩家可以调价)
    this.priceOverrides = {};
  }

  // 餐厅等级提升时检查解锁
  checkUnlocks(restaurantLevel) {
    const newlyUnlocked = [];
    for (const dish of DISHES) {
      if (!this.unlocked.includes(dish.id) && restaurantLevel >= dish.unlockLevel) {
        this.unlocked.push(dish.id);
        newlyUnlocked.push(dish);
      }
    }
    return newlyUnlocked;
  }

  // 获取已解锁菜品列表
  getAvailableDishes() {
    return DISHES.filter(d => this.unlocked.includes(d.id));
  }

  // 获取菜品信息
  getDish(id) {
    return DISHES.find(d => d.id === id) || null;
  }

  // 获取菜品售价（含自定义调整）
  getPrice(id) {
    const dish = this.getDish(id);
    if (!dish) return 0;
    return this.priceOverrides[id] ?? dish.price;
  }

  // 设置自定义价格
  setPrice(id, price) {
    const dish = this.getDish(id);
    if (!dish) return false;
    // 价格不能低于成本的80%，也不能高于原价的200%
    const min = Math.floor(dish.cost * 0.8);
    const max = dish.price * 2;
    this.priceOverrides[id] = Math.max(min, Math.min(max, price));
    return true;
  }

  // 随机选择一道已解锁的菜品
  randomDish() {
    const available = this.getAvailableDishes();
    // 权重：便宜菜概率更高
    const weights = available.map(d => 1 / d.cost);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < available.length; i++) {
      r -= weights[i];
      if (r <= 0) return available[i];
    }
    return available[available.length - 1];
  }
}
