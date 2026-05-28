// 升级系统
import { CONFIG } from './config.js';
import { game } from './game.js';
import { sound } from './sound.js';
import { formatNumber } from './utils.js';

class UpgradeSystem {
  // 获取升级配置
  getUpgradeConfig(upgradeId) {
    return CONFIG.upgrades.find(u => u.id === upgradeId);
  }

  // 获取建筑的所有升级
  getBuildingUpgrades(buildingId) {
    return CONFIG.upgrades.filter(u => u.buildingId === buildingId);
  }

  // 购买升级
  buy(upgradeId) {
    if (game.buyUpgrade(upgradeId)) {
      sound.playUpgrade();
      return true;
    }
    return false;
  }

  // 获取所有升级信息（用于UI渲染）
  getAllUpgradesInfo() {
    const upgrades = [];
    const processedBuildings = new Set();

    CONFIG.upgrades.forEach(config => {
      const status = game.getUpgradeStatus(config.id);
      const buildingConfig = CONFIG.buildings.find(b => b.id === config.buildingId);

      // 确定可见性：建筑已解锁且有购买记录，或满足解锁条件
      const buildingCount = game.getBuildingCount(config.buildingId);
      const isVisible = buildingCount > 0 || status.purchased;

      if (isVisible) {
        upgrades.push({
          id: config.id,
          name: config.name,
          description: config.description,
          buildingId: config.buildingId,
          buildingName: buildingConfig ? buildingConfig.name : '',
          buildingIcon: buildingConfig ? buildingConfig.icon : '',
          multiplier: config.multiplier,
          cost: config.cost,
          requiredCount: config.requiredCount,
          currentCount: buildingCount,
          ...status,
          formattedCost: formatNumber(config.cost)
        });
      }
    });

    return upgrades;
  }

  // 获取可购买的升级数量
  getAvailableUpgradeCount() {
    return CONFIG.upgrades.filter(u => game.canBuyUpgrade(u.id)).length;
  }

  // 获取建筑的升级进度
  getBuildingUpgradeProgress(buildingId) {
    const upgrades = this.getBuildingUpgrades(buildingId);
    const purchased = upgrades.filter(u => game.purchasedUpgrades[u.id]).length;
    return {
      total: upgrades.length,
      purchased,
      percentage: upgrades.length > 0 ? (purchased / upgrades.length) * 100 : 0
    };
  }
}

// 导出单例
export const upgrades = new UpgradeSystem();
