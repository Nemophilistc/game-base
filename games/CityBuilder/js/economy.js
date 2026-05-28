// ============================================
// 城市建设者 - 经济系统
// ============================================

import { BUILDINGS, DAY_LENGTH, INITIAL_RESOURCES } from './config.js';

export class Economy {
  constructor() {
    this.gold = INITIAL_RESOURCES.gold;
    this.food = INITIAL_RESOURCES.food;
    this.population = INITIAL_RESOURCES.population;
    this.satisfaction = INITIAL_RESOURCES.satisfaction;

    this.day = 1;
    this.dayTimer = 0;
    this.isDaytime = true;
    this.dayProgress = 0; // 0-1

    // 每日统计
    this.dailyIncome = 0;
    this.dailyExpense = 0;
    this.dailyFoodProduced = 0;
    this.dailyFoodConsumed = 0;

    // 历史记录
    this.history = [];
    this.totalEarned = 0;
    this.totalSpent = 0;
  }

  // 重置每日统计
  resetDailyStats() {
    this.dailyIncome = 0;
    this.dailyExpense = 0;
    this.dailyFoodProduced = 0;
    this.dailyFoodConsumed = 0;
  }

  // 计算建筑统计
  calculateBuildingStats(grid) {
    const stats = {
      totalPopulationCapacity: 0,
      totalJobs: 0,
      totalTaxIncome: 0,
      totalFoodIncome: 0,
      totalResourceIncome: 0,
      totalMaintenance: 0,
      totalPowerSupply: 0,
      totalPowerNeed: 0,
      totalSatisfactionBonus: 0,
      buildingCounts: {},
      buildings: []
    };

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const building = grid.getBuilding(c, r);
        if (!building) continue;

        const config = BUILDINGS[building.type];
        if (!config) continue;

        const level = building.level || 1;
        const multiplier = Math.pow(1.5, level - 1);

        stats.buildings.push({ ...building, col: c, row: r });
        stats.buildingCounts[building.type] = (stats.buildingCounts[building.type] || 0) + 1;

        // 人口容量
        if (config.populationCapacity) {
          stats.totalPopulationCapacity += Math.floor(config.populationCapacity * multiplier);
        }

        // 工作岗位
        if (config.jobs) {
          stats.totalJobs += Math.floor(config.jobs * multiplier);
        }

        // 税收
        if (config.taxIncome) {
          stats.totalTaxIncome += Math.floor(config.taxIncome * multiplier);
        }

        // 食物
        if (config.foodIncome) {
          stats.totalFoodIncome += Math.floor(config.foodIncome * multiplier);
        }

        // 资源
        if (config.resourceIncome) {
          stats.totalResourceIncome += Math.floor(config.resourceIncome * multiplier);
        }

        // 维护费
        stats.totalMaintenance += Math.ceil(config.maintenance * (1 + (level - 1) * 0.3));

        // 电力
        if (config.powerSupply) {
          stats.totalPowerSupply += Math.floor(config.powerSupply * multiplier);
        }
        if (config.powerNeed) {
          stats.totalPowerNeed += config.powerNeed;
        }

        // 满意度加成
        if (config.satisfactionBonus) {
          stats.totalSatisfactionBonus += Math.floor(config.satisfactionBonus * multiplier);
        }
      }
    }

    return stats;
  }

  // 每日结算
  endDay(grid) {
    const stats = this.calculateBuildingStats(grid);
    let notifications = [];

    // 税收收入（基于人口和商业建筑）
    const employedRatio = stats.totalJobs > 0
      ? Math.min(1, this.population / stats.totalJobs)
      : 0;
    const taxFromResidents = Math.floor(this.population * 2 * employedRatio);
    const totalTax = stats.totalTaxIncome + taxFromResidents;

    // 食物
    this.dailyFoodProduced = stats.totalFoodIncome;
    this.dailyFoodConsumed = Math.ceil(this.population * 0.8);
    this.food += this.dailyFoodProduced - this.dailyFoodConsumed;

    // 金币
    this.dailyIncome = totalTax;
    this.dailyExpense = stats.totalMaintenance;
    this.gold += this.dailyIncome - this.dailyExpense;
    this.totalEarned += this.dailyIncome;
    this.totalSpent += this.dailyExpense;

    // 满意度计算
    this.calculateSatisfaction(stats, employedRatio);

    // 人口增长/减少
    if (this.satisfaction >= 50 && this.population < stats.totalPopulationCapacity) {
      const growth = Math.max(1, Math.floor(this.satisfaction / 25));
      const space = stats.totalPopulationCapacity - this.population;
      const added = Math.min(growth, space);
      if (added > 0) {
        this.population += added;
        notifications.push(`+${added} 新居民迁入`);
      }
    } else if (this.satisfaction < 25 && this.population > 0) {
      const leaving = Math.min(2, this.population);
      this.population -= leaving;
      notifications.push(`${leaving} 居民因不满离开`);
    }

    // 食物不足警告
    if (this.food < 0) {
      this.food = 0;
      notifications.push('食物不足！居民挨饿');
    }

    // 金币不足警告
    if (this.gold < 0) {
      notifications.push('财政赤字！减少建筑或增加收入');
    }

    // 电力不足警告
    if (stats.totalPowerNeed > stats.totalPowerSupply && stats.totalPowerNeed > 0) {
      notifications.push('电力不足！建造发电厂');
    }

    // 记录历史
    this.history.push({
      day: this.day,
      gold: this.gold,
      population: this.population,
      food: this.food,
      satisfaction: this.satisfaction
    });

    // 保存每日统计（在重置前）
    const dailyReport = {
      income: this.dailyIncome,
      expense: this.dailyExpense,
      foodProduced: this.dailyFoodProduced,
      foodConsumed: this.dailyFoodConsumed
    };

    // 推进到下一天
    this.day++;
    this.dayTimer = 0;
    this.resetDailyStats();

    return { notifications, stats, dailyReport };
  }

  // 计算满意度
  calculateSatisfaction(stats, employedRatio) {
    let sat = 50; // 基础值

    // 基础设施加成
    sat += stats.totalSatisfactionBonus;

    // 就业率加成
    sat += Math.floor(employedRatio * 15);

    // 食物充足加成
    if (this.food > 0) {
      sat += 5;
    } else {
      sat -= 15;
    }

    // 电力充足
    if (stats.totalPowerSupply >= stats.totalPowerNeed || stats.totalPowerNeed === 0) {
      sat += 5;
    } else {
      sat -= 10;
    }

    // 住房充足
    if (this.population <= stats.totalPopulationCapacity && stats.totalPopulationCapacity > 0) {
      sat += 5;
    } else if (stats.totalPopulationCapacity === 0 && this.population > 0) {
      sat -= 10;
    }

    // 金币为负
    if (this.gold < 0) {
      sat -= 10;
    }

    this.satisfaction = Math.max(0, Math.min(100, sat));
  }

  // 更新时间
  update(dt) {
    this.dayTimer += dt;
    this.dayProgress = this.dayTimer / DAY_LENGTH;
    this.isDaytime = this.dayProgress < 0.5;

    // 一天结束
    if (this.dayTimer >= DAY_LENGTH) {
      return true; // 通知调用者结算
    }
    return false;
  }

  // 扣除建造费用
  spendGold(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    this.totalSpent += amount;
    return true;
  }

  // 获取电力统计
  getPowerStats(grid) {
    const stats = this.calculateBuildingStats(grid);
    return {
      supply: stats.totalPowerSupply,
      need: stats.totalPowerNeed
    };
  }

  // 获取当前状态摘要
  getSummary(grid) {
    const stats = this.calculateBuildingStats(grid);
    return {
      gold: Math.floor(this.gold),
      population: this.population,
      populationCapacity: stats.totalPopulationCapacity,
      food: Math.floor(this.food),
      powerSupply: stats.totalPowerSupply,
      powerNeed: stats.totalPowerNeed,
      satisfaction: Math.floor(this.satisfaction),
      day: this.day,
      dayProgress: this.dayProgress,
      isDaytime: this.isDaytime
    };
  }
}
