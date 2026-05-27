// 成就系统
import { CONFIG } from './config.js';
import { game } from './game.js';
import { sound } from './sound.js';
import { formatNumber } from './utils.js';

class AchievementSystem {
  constructor() {
    this.pendingNotifications = []; // 待显示的成就通知
  }

  // 获取成就配置
  getAchievementConfig(achievementId) {
    return CONFIG.achievements.find(a => a.id === achievementId);
  }

  // 检查并解锁成就
  checkAndUnlock() {
    const newAchievements = game.checkAchievements();

    if (newAchievements.length > 0) {
      sound.playAchievement();
      this.pendingNotifications.push(...newAchievements);
    }

    return newAchievements;
  }

  // 获取待显示的通知
  getPendingNotifications() {
    const notifications = [...this.pendingNotifications];
    this.pendingNotifications = [];
    return notifications;
  }

  // 获取所有成就信息（用于UI渲染）
  getAllAchievementsInfo() {
    return CONFIG.achievements.map(config => {
      const unlocked = !!game.achievements[config.id];
      const progress = this.getAchievementProgress(config);

      return {
        id: config.id,
        name: config.name,
        description: config.description,
        reward: config.reward,
        unlocked,
        progress,
        formattedReward: `+${(config.reward * 100).toFixed(0)}%`
      };
    });
  }

  // 获取成就进度
  getAchievementProgress(achievementConfig) {
    const condition = achievementConfig.condition;
    let current = 0;
    let target = condition.value;

    switch (condition.type) {
      case 'clicks':
        current = game.clicks;
        break;
      case 'totalGold':
        current = game.totalGold;
        break;
      case 'building':
        current = game.getBuildingCount(condition.buildingId);
        break;
      case 'upgrades':
        current = game.stats.totalUpgradesPurchased;
        break;
      case 'production':
        current = game.productionPerSecond;
        break;
      case 'allBuildings':
        // 对于"所有建筑"类型，计算满足条件的建筑数量
        const satisfied = CONFIG.buildings.filter(b =>
          game.getBuildingCount(b.id) >= condition.value
        ).length;
        current = satisfied;
        target = CONFIG.buildings.length;
        break;
      case 'totalBuildings':
        current = game.getTotalBuildingCount();
        break;
    }

    return {
      current,
      target,
      percentage: Math.min((current / target) * 100, 100)
    };
  }

  // 获取已解锁成就数量
  getUnlockedCount() {
    return Object.keys(game.achievements).length;
  }

  // 获取成就总数
  getTotalCount() {
    return CONFIG.achievements.length;
  }

  // 获取总成就倍率加成
  getTotalBonus() {
    return game.achievementMultiplier;
  }
}

// 导出单例
export const achievements = new AchievementSystem();
