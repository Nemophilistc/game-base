// ============================================================
// restaurant.js - 餐厅管理（布局、容量、清洁度、装修）
// ============================================================
import { LAYOUT_TEMPLATE, TABLE_POSITIONS, DECORATIONS, KITCHEN_UPGRADES, TILE } from './config.js';

export class Restaurant {
  constructor() {
    // 深拷贝布局
    this.layout = LAYOUT_TEMPLATE.map(r => [...r]);

    // 桌子状态: { occupied, dirty, customer }
    this.tables = TABLE_POSITIONS.map(t => ({
      ...t,
      occupied: false,
      dirty: false,
      customerId: null,
    }));

    // 装修等级 { decoId: level }
    this.decoLevels = {};
    DECORATIONS.forEach(d => this.decoLevels[d.id] = 0);

    // 厨房设备等级
    this.kitchenLevels = {};
    KITCHEN_UPGRADES.forEach(k => this.kitchenLevels[k.id] = 0);

    // 基础容量（初始桌子数）
    this.baseCapacity = this.tables.length; // 8

    // 清洁度 0~100
    this.cleanliness = 100;
    this.cleanRate = 0; // 每秒自动清洁量（来自洗碗机）
  }

  // 当前最大可用桌数
  get maxCapacity() {
    let extra = 0;
    DECORATIONS.forEach(d => {
      if (d.capacity > 0) extra += d.capacity * this.decoLevels[d.id];
    });
    return this.baseCapacity + extra;
  }

  // 装修满意度加成
  get decorSatisfaction() {
    let total = 0;
    DECORATIONS.forEach(d => {
      total += d.satisfaction * this.decoLevels[d.id];
    });
    return total;
  }

  // 烹饪速度加成 (百分比)
  get cookingSpeedBonus() {
    let total = 0;
    KITCHEN_UPGRADES.forEach(k => {
      total += k.speedBonus * this.kitchenLevels[k.id];
    });
    return total;
  }

  // 找到一张空桌，返回桌子对象或null
  findFreeTable() {
    for (const t of this.tables) {
      if (!t.occupied && !t.dirty) {
        // 检查是否在容量范围内
        const idx = this.tables.indexOf(t);
        if (idx < this.maxCapacity) return t;
      }
    }
    return null;
  }

  // 占用桌子
  occupyTable(table, customerId) {
    table.occupied = true;
    table.dirty = false;
    table.customerId = customerId;
  }

  // 释放桌子（客人离开后变脏）
  leaveTable(table) {
    table.occupied = false;
    table.dirty = true;
    table.customerId = null;
  }

  // 清洁桌子
  cleanTable(table) {
    table.dirty = false;
    this.cleanliness = Math.min(100, this.cleanliness + 2);
  }

  // 找到脏桌
  findDirtyTable() {
    return this.tables.find(t => t.dirty) || null;
  }

  // 升级装修
  upgradeDecor(decoId, money) {
    const deco = DECORATIONS.find(d => d.id === decoId);
    if (!deco) return { success: false, msg: '未知装修' };
    const lv = this.decoLevels[decoId];
    if (lv >= deco.maxLevel) return { success: false, msg: '已达最高级' };
    const cost = deco.cost * (lv + 1);
    if (money < cost) return { success: false, msg: '资金不足' };
    this.decoLevels[decoId] = lv + 1;
    // 洗碗机加清洁速率
    if (decoId === 'auto_wash') {
      this.cleanRate += 0.5;
    }
    return { success: true, cost, msg: `${deco.name} 升至 ${lv + 1} 级` };
  }

  // 升级厨房设备
  upgradeKitchen(kitId, money) {
    const kit = KITCHEN_UPGRADES.find(k => k.id === kitId);
    if (!kit) return { success: false, msg: '未知设备' };
    const lv = this.kitchenLevels[kitId];
    if (lv >= kit.maxLevel) return { success: false, msg: '已达最高级' };
    const cost = kit.cost * (lv + 1);
    if (money < cost) return { success: false, msg: '资金不足' };
    this.kitchenLevels[kitId] = lv + 1;
    return { success: true, cost, msg: `${kit.name} 升至 ${lv + 1} 级` };
  }

  // 每帧更新
  update(dt) {
    // 清洁度自然衰减
    this.cleanliness = Math.max(0, this.cleanliness - dt * 0.3);
    // 自动清洁
    if (this.cleanRate > 0) {
      this.cleanliness = Math.min(100, this.cleanliness + this.cleanRate * dt);
    }
    // 脏桌自动清洁（如果服务员有空，但这里简化为定时）
    for (const t of this.tables) {
      if (t.dirty) {
        // 脏桌会缓慢自动清洁（模拟服务员）
        this.cleanliness = Math.max(0, this.cleanliness - dt * 0.1);
      }
    }
  }

  // 清洁度对满意度的影响
  get cleanlinessBonus() {
    if (this.cleanliness >= 90) return 10;
    if (this.cleanliness >= 70) return 5;
    if (this.cleanliness >= 50) return 0;
    if (this.cleanliness >= 30) return -5;
    return -15;
  }
}
