// 建筑系统
import { CONFIG } from './config.js';
import { game } from './game.js';
import { sound } from './sound.js';
import { formatNumber } from './utils.js';

class BuildingSystem {
  constructor() {
    this.buyAmount = 1; // 购买数量：1, 10, 100
  }

  // 设置购买数量
  setBuyAmount(amount) {
    this.buyAmount = amount;
  }

  // 获取建筑配置
  getBuildingConfig(buildingId) {
    return CONFIG.buildings.find(b => b.id === buildingId);
  }

  // 获取建筑当前价格
  getBuildingCost(buildingId, amount = 1) {
    const config = this.getBuildingConfig(buildingId);
    if (!config) return Infinity;

    const currentCount = game.getBuildingCount(buildingId);
    let totalCost = 0;

    for (let i = 0; i < amount; i++) {
      totalCost += Math.floor(config.baseCost * Math.pow(CONFIG.settings.costMultiplier, currentCount + i));
    }

    return totalCost;
  }

  // 获取建筑每个的产出
  getBuildingProduction(buildingId) {
    const config = this.getBuildingConfig(buildingId);
    if (!config) return 0;

    const multiplier = game.buildingMultipliers[buildingId] || 1;
    const achievementBonus = 1 + game.achievementMultiplier;
    return config.baseProduction * multiplier * achievementBonus;
  }

  // 获取建筑总产出
  getBuildingTotalProduction(buildingId) {
    const count = game.getBuildingCount(buildingId);
    return this.getBuildingProduction(buildingId) * count;
  }

  // 购买建筑
  buy(buildingId) {
    const cost = this.getBuildingCost(buildingId, this.buyAmount);
    if (game.gold < cost) {
      sound.playError();
      return 0;
    }

    const purchased = game.buyBuildingBulk(buildingId, this.buyAmount);
    if (purchased > 0) {
      sound.playBuy();
    }

    return purchased;
  }

  // 获取所有建筑信息（用于UI渲染）
  getAllBuildingsInfo() {
    return CONFIG.buildings.map(config => {
      const count = game.getBuildingCount(config.id);
      const cost = this.getBuildingCost(config.id, this.buyAmount);
      const production = this.getBuildingProduction(config.id);
      const totalProduction = this.getBuildingTotalProduction(config.id);
      const canAfford = game.gold >= cost;
      const isVisible = count > 0 || game.totalGold >= config.baseCost * 0.5;

      return {
        id: config.id,
        name: config.name,
        icon: config.icon,
        description: config.description,
        count,
        cost,
        production,
        totalProduction,
        canAfford,
        isVisible,
        formattedCost: formatNumber(cost),
        formattedProduction: formatNumber(production),
        formattedTotalProduction: formatNumber(totalProduction)
      };
    });
  }
}

// 导出单例
export const buildings = new BuildingSystem();
