// 核心游戏状态管理
import { CONFIG } from './config.js';

class GameState {
  constructor() {
    this.reset();
  }

  // 重置游戏状态
  reset() {
    this.gold = 0;
    this.totalGold = 0;
    this.clicks = 0;
    this.clickValue = CONFIG.settings.clickBaseValue;
    this.productionPerSecond = 0;
    this.achievementMultiplier = 0; // 成就提供的额外倍率
    this.lastSaveTime = Date.now();
    this.lastTickTime = Date.now();

    // 建筑数量 { buildingId: count }
    this.buildings = {};
    CONFIG.buildings.forEach(b => {
      this.buildings[b.id] = 0;
    });

    // 建筑倍率 { buildingId: multiplier }
    this.buildingMultipliers = {};
    CONFIG.buildings.forEach(b => {
      this.buildingMultipliers[b.id] = 1;
    });

    // 已购买的升级 { upgradeId: true }
    this.purchasedUpgrades = {};

    // 已达成的成就 { achievementId: true }
    this.achievements = {};

    // 统计数据
    this.stats = {
      totalClicks: 0,
      totalBuildingsPurchased: 0,
      totalUpgradesPurchased: 0,
      startTime: Date.now()
    };
  }

  // 点击
  click() {
    const value = this.getClickValue();
    this.gold += value;
    this.totalGold += value;
    this.clicks++;
    this.stats.totalClicks++;
    return value;
  }

  // 获取点击价值
  getClickValue() {
    return this.clickValue * (1 + this.achievementMultiplier);
  }

  // 获取建筑当前价格
  getBuildingCost(buildingId) {
    const config = CONFIG.buildings.find(b => b.id === buildingId);
    if (!config) return Infinity;
    const count = this.buildings[buildingId] || 0;
    return Math.floor(config.baseCost * Math.pow(CONFIG.settings.costMultiplier, count));
  }

  // 购买建筑
  buyBuilding(buildingId) {
    const cost = this.getBuildingCost(buildingId);
    if (this.gold < cost) return false;

    this.gold -= cost;
    this.buildings[buildingId] = (this.buildings[buildingId] || 0) + 1;
    this.stats.totalBuildingsPurchased++;

    this.recalculateProduction();
    return true;
  }

  // 批量购买建筑
  buyBuildingBulk(buildingId, amount) {
    let purchased = 0;
    for (let i = 0; i < amount; i++) {
      if (this.buyBuilding(buildingId)) {
        purchased++;
      } else {
        break;
      }
    }
    return purchased;
  }

  // 购买升级
  buyUpgrade(upgradeId) {
    const config = CONFIG.upgrades.find(u => u.id === upgradeId);
    if (!config) return false;
    if (this.purchasedUpgrades[upgradeId]) return false;
    if (this.gold < config.cost) return false;

    const buildingCount = this.buildings[config.buildingId] || 0;
    if (buildingCount < config.requiredCount) return false;

    this.gold -= config.cost;
    this.purchasedUpgrades[upgradeId] = true;
    this.stats.totalUpgradesPurchased++;

    // 应用倍率
    this.buildingMultipliers[config.buildingId] *= config.multiplier;

    this.recalculateProduction();
    return true;
  }

  // 重新计算每秒产出
  recalculateProduction() {
    let totalProduction = 0;

    CONFIG.buildings.forEach(config => {
      const count = this.buildings[config.id] || 0;
      const multiplier = this.buildingMultipliers[config.id] || 1;
      const achievementBonus = 1 + this.achievementMultiplier;
      totalProduction += count * config.baseProduction * multiplier * achievementBonus;
    });

    this.productionPerSecond = totalProduction;
  }

  // 游戏tick（每秒调用一次）
  tick() {
    const now = Date.now();
    const elapsed = (now - this.lastTickTime) / 1000; // 秒
    this.lastTickTime = now;

    // 添加产出金币
    const earned = this.productionPerSecond * elapsed;
    this.gold += earned;
    this.totalGold += earned;

    return earned;
  }

  // 计算离线收益
  calculateOfflineEarnings(offlineSeconds) {
    const maxOfflineSeconds = 24 * 60 * 60; // 最多计算24小时
    const seconds = Math.min(offlineSeconds, maxOfflineSeconds);
    return this.productionPerSecond * seconds * CONFIG.settings.offlineEfficiency;
  }

  // 应用离线收益
  applyOfflineEarnings(amount) {
    this.gold += amount;
    this.totalGold += amount;
  }

  // 获取建筑数量
  getBuildingCount(buildingId) {
    return this.buildings[buildingId] || 0;
  }

  // 获取总建筑数量
  getTotalBuildingCount() {
    return Object.values(this.buildings).reduce((sum, count) => sum + count, 0);
  }

  // 检查升级是否可购买
  canBuyUpgrade(upgradeId) {
    const config = CONFIG.upgrades.find(u => u.id === upgradeId);
    if (!config) return false;
    if (this.purchasedUpgrades[upgradeId]) return false;
    if (this.gold < config.cost) return false;

    const buildingCount = this.buildings[config.buildingId] || 0;
    return buildingCount >= config.requiredCount;
  }

  // 获取升级状态
  getUpgradeStatus(upgradeId) {
    const config = CONFIG.upgrades.find(u => u.id === upgradeId);
    if (!config) return { purchased: false, affordable: false, locked: true };

    const purchased = !!this.purchasedUpgrades[upgradeId];
    const buildingCount = this.buildings[config.buildingId] || 0;
    const locked = buildingCount < config.requiredCount;
    const affordable = !purchased && !locked && this.gold >= config.cost;

    return { purchased, affordable, locked };
  }

  // 检查成就
  checkAchievements() {
    const newAchievements = [];

    CONFIG.achievements.forEach(achievement => {
      if (this.achievements[achievement.id]) return; // 已达成

      let earned = false;
      const condition = achievement.condition;

      switch (condition.type) {
        case 'clicks':
          earned = this.clicks >= condition.value;
          break;
        case 'totalGold':
          earned = this.totalGold >= condition.value;
          break;
        case 'building':
          earned = (this.buildings[condition.buildingId] || 0) >= condition.value;
          break;
        case 'upgrades':
          earned = this.stats.totalUpgradesPurchased >= condition.value;
          break;
        case 'production':
          earned = this.productionPerSecond >= condition.value;
          break;
        case 'allBuildings':
          earned = CONFIG.buildings.every(b => (this.buildings[b.id] || 0) >= condition.value);
          break;
        case 'totalBuildings':
          earned = this.getTotalBuildingCount() >= condition.value;
          break;
      }

      if (earned) {
        this.achievements[achievement.id] = true;
        this.achievementMultiplier += achievement.reward;
        this.recalculateProduction();
        newAchievements.push(achievement);
      }
    });

    return newAchievements;
  }

  // 获取存档数据
  getSaveData() {
    return {
      gold: this.gold,
      totalGold: this.totalGold,
      clicks: this.clicks,
      clickValue: this.clickValue,
      buildings: { ...this.buildings },
      buildingMultipliers: { ...this.buildingMultipliers },
      purchasedUpgrades: { ...this.purchasedUpgrades },
      achievements: { ...this.achievements },
      achievementMultiplier: this.achievementMultiplier,
      stats: { ...this.stats },
      lastSaveTime: Date.now(),
      version: 1
    };
  }

  // 从存档加载
  loadSaveData(data) {
    if (!data) return false;

    try {
      this.gold = data.gold || 0;
      this.totalGold = data.totalGold || 0;
      this.clicks = data.clicks || 0;
      this.clickValue = data.clickValue || CONFIG.settings.clickBaseValue;
      this.achievementMultiplier = data.achievementMultiplier || 0;
      this.lastSaveTime = data.lastSaveTime || Date.now();
      this.lastTickTime = Date.now();

      // 加载建筑
      this.buildings = {};
      CONFIG.buildings.forEach(b => {
        this.buildings[b.id] = (data.buildings && data.buildings[b.id]) || 0;
      });

      // 加载倍率
      this.buildingMultipliers = {};
      CONFIG.buildings.forEach(b => {
        this.buildingMultipliers[b.id] = (data.buildingMultipliers && data.buildingMultipliers[b.id]) || 1;
      });

      // 加载升级
      this.purchasedUpgrades = data.purchasedUpgrades || {};

      // 加载成就
      this.achievements = data.achievements || {};

      // 加载统计
      this.stats = data.stats || {
        totalClicks: this.clicks,
        totalBuildingsPurchased: 0,
        totalUpgradesPurchased: 0,
        startTime: Date.now()
      };

      this.recalculateProduction();
      return true;
    } catch (e) {
      console.error('加载存档失败:', e);
      return false;
    }
  }

  // 获取游戏统计
  getPlayTime() {
    return Date.now() - this.stats.startTime;
  }
}

// 导出单例
export const game = new GameState();
