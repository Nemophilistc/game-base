// character.js - 角色系统（属性、物品、状态）
import { CONFIG } from './config.js';

export class Character {
  constructor() {
    this.stats = { ...CONFIG.BASE_STATS };
    this.inventory = [];
    this.hp = CONFIG.COMBAT.BASE_HP;
    this.maxHp = CONFIG.COMBAT.BASE_HP;
    this.flags = {}; // 剧情标记
    this.currentScene = 'start';
    this.chapter = 'prologue';
    this.history = []; // 已访问场景
    this.combatState = null;
  }

  // 属性相关
  getStat(statName) {
    return this.stats[statName] || 0;
  }

  modifyStat(statName, amount) {
    if (this.stats[statName] !== undefined) {
      this.stats[statName] = Math.max(0, Math.min(20, this.stats[statName] + amount));
    }
  }

  // HP 相关
  modifyHp(amount) {
    this.hp = Math.max(0, Math.min(this.maxHp, this.hp + amount));
    return this.hp;
  }

  isAlive() {
    return this.hp > 0;
  }

  healFull() {
    this.hp = this.maxHp;
  }

  // 物品系统
  addItem(item) {
    if (!this.inventory.includes(item)) {
      this.inventory.push(item);
      return true;
    }
    return false;
  }

  removeItem(item) {
    const idx = this.inventory.indexOf(item);
    if (idx >= 0) {
      this.inventory.splice(idx, 1);
      return true;
    }
    return false;
  }

  hasItem(item) {
    return this.inventory.includes(item);
  }

  // 剧情标记
  setFlag(flag) {
    this.flags[flag] = true;
  }

  hasFlag(flag) {
    return !!this.flags[flag];
  }

  // 场景记录
  visitScene(sceneId) {
    if (!this.history.includes(sceneId)) {
      this.history.push(sceneId);
    }
    this.currentScene = sceneId;
  }

  hasVisited(sceneId) {
    return this.history.includes(sceneId);
  }

  // 序列化
  serialize() {
    return {
      stats: { ...this.stats },
      inventory: [...this.inventory],
      hp: this.hp,
      maxHp: this.maxHp,
      flags: { ...this.flags },
      currentScene: this.currentScene,
      chapter: this.chapter,
      history: [...this.history],
    };
  }

  // 反序列化
  static deserialize(data) {
    const c = new Character();
    if (!data) return c;
    c.stats = data.stats || { ...CONFIG.BASE_STATS };
    c.inventory = data.inventory || [];
    c.hp = data.hp ?? CONFIG.COMBAT.BASE_HP;
    c.maxHp = data.maxHp ?? CONFIG.COMBAT.BASE_HP;
    c.flags = data.flags || {};
    c.currentScene = data.currentScene || 'start';
    c.chapter = data.chapter || 'prologue';
    c.history = data.history || [];
    return c;
  }
}
