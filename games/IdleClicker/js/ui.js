// DOM界面系统
import { game } from './game.js';
import { buildings } from './buildings.js';
import { upgrades } from './upgrades.js';
import { achievements } from './achievements.js';
import { save } from './save.js';
import { sound } from './sound.js';
import { formatNumber, formatPlayTime } from './utils.js';

class UI {
  constructor() {
    this.elements = {};
    this.currentTab = 'buildings';
    this.useChineseNumbers = false;
    this.buyAmount = 1;
  }

  // 初始化UI
  init() {
    this.cacheElements();
    this.bindEvents();
    this.render();
  }

  // 缓存DOM元素
  cacheElements() {
    this.elements = {
      // 顶部信息
      gold: document.getElementById('gold'),
      goldPerSecond: document.getElementById('gold-per-second'),
      clickValue: document.getElementById('click-value'),
      clickBtn: document.getElementById('click-btn'),

      // 标签页
      tabBtns: document.querySelectorAll('.tab-btn'),
      tabContents: document.querySelectorAll('.tab-content'),

      // 建筑面板
      buildingsList: document.getElementById('buildings-list'),
      buyAmountBtns: document.querySelectorAll('.buy-amount-btn'),

      // 升级面板
      upgradesList: document.getElementById('upgrades-list'),

      // 成就面板
      achievementsList: document.getElementById('achievements-list'),
      achievementCount: document.getElementById('achievement-count'),
      achievementBonus: document.getElementById('achievement-bonus'),

      // 统计面板
      playTime: document.getElementById('play-time'),
      totalClicks: document.getElementById('total-clicks'),
      totalGold: document.getElementById('total-gold'),
      totalBuildings: document.getElementById('total-buildings'),
      totalUpgrades: document.getElementById('total-upgrades'),

      // 设置
      numberFormatToggle: document.getElementById('number-format-toggle'),
      exportBtn: document.getElementById('export-btn'),
      importBtn: document.getElementById('import-btn'),
      importFile: document.getElementById('import-file'),
      resetBtn: document.getElementById('reset-btn'),
      saveBtn: document.getElementById('save-btn'),

      // 右侧信息面板
      infoPps: document.getElementById('info-pps'),
      infoClick: document.getElementById('info-click'),
      infoBonus: document.getElementById('info-bonus'),
      buildingsStats: document.getElementById('buildings-stats'),

      // 点击价值显示
      clickValueDisplay: document.getElementById('click-value-display'),

      // 通知
      offlineNotification: document.getElementById('offline-notification'),
      achievementNotification: document.getElementById('achievement-notification')
    };
  }

  // 绑定事件
  bindEvents() {
    // 点击按钮
    if (this.elements.clickBtn) {
      this.elements.clickBtn.addEventListener('click', () => {
        this.handleClick();
      });
    }

    // 标签页切换
    this.elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // 购买数量切换
    this.elements.buyAmountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setBuyAmount(parseInt(btn.dataset.amount));
      });
    });

    // 数字格式切换
    if (this.elements.numberFormatToggle) {
      this.elements.numberFormatToggle.addEventListener('click', () => {
        this.toggleNumberFormat();
      });
    }

    // 存档按钮
    if (this.elements.exportBtn) {
      this.elements.exportBtn.addEventListener('click', () => {
        save.exportSave();
      });
    }

    if (this.elements.importBtn) {
      this.elements.importBtn.addEventListener('click', () => {
        this.elements.importFile.click();
      });
    }

    if (this.elements.importFile) {
      this.elements.importFile.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          try {
            await save.importSave(e.target.files[0]);
            this.render();
            alert('存档导入成功！');
          } catch (err) {
            alert('导入失败：' + err.message);
          }
        }
      });
    }

    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => {
        if (save.resetGame()) {
          this.render();
        }
      });
    }

    if (this.elements.saveBtn) {
      this.elements.saveBtn.addEventListener('click', () => {
        save.save();
        this.showTemporaryMessage('游戏已保存');
      });
    }
  }

  // 处理点击
  handleClick() {
    sound.init(); // 初始化音频（需要用户交互）
    sound.playClick();

    const value = game.click();

    // 显示点击数字动画
    this.showClickAnimation(value);

    this.updateStats();
  }

  // 显示点击数字动画
  showClickAnimation(value) {
    const clickBtn = this.elements.clickBtn;
    if (!clickBtn) return;

    const animation = document.createElement('div');
    animation.className = 'click-animation';
    animation.textContent = `+${formatNumber(value, this.useChineseNumbers)}`;

    // 随机位置
    const rect = clickBtn.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    animation.style.left = `${x}px`;
    animation.style.top = `${y}px`;

    clickBtn.appendChild(animation);

    // 动画结束后移除
    setTimeout(() => {
      animation.remove();
    }, 1000);
  }

  // 切换标签页
  switchTab(tabName) {
    this.currentTab = tabName;

    // 更新标签按钮状态
    this.elements.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 更新标签内容显示
    this.elements.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    this.render();
  }

  // 设置购买数量
  setBuyAmount(amount) {
    this.buyAmount = amount;
    buildings.setBuyAmount(amount);

    this.elements.buyAmountBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.amount) === amount);
    });

    this.render();
  }

  // 切换数字格式
  toggleNumberFormat() {
    this.useChineseNumbers = !this.useChineseNumbers;

    if (this.elements.numberFormatToggle) {
      this.elements.numberFormatToggle.textContent = this.useChineseNumbers ? '切换英文' : '切换中文';
    }

    this.render();
  }

  // 更新顶部统计
  updateStats() {
    if (this.elements.gold) {
      this.elements.gold.textContent = formatNumber(game.gold, this.useChineseNumbers);
    }

    if (this.elements.goldPerSecond) {
      this.elements.goldPerSecond.textContent = formatNumber(game.productionPerSecond, this.useChineseNumbers);
    }

    if (this.elements.clickValue) {
      this.elements.clickValue.textContent = formatNumber(game.getClickValue(), this.useChineseNumbers);
    }

    if (this.elements.clickValueDisplay) {
      this.elements.clickValueDisplay.textContent = formatNumber(game.getClickValue(), this.useChineseNumbers);
    }

    // 更新右侧面板
    this.updateInfoPanel();
  }

  // 更新右侧信息面板
  updateInfoPanel() {
    if (this.elements.infoPps) {
      this.elements.infoPps.textContent = formatNumber(game.productionPerSecond, this.useChineseNumbers) + '/秒';
    }

    if (this.elements.infoClick) {
      this.elements.infoClick.textContent = formatNumber(game.getClickValue(), this.useChineseNumbers);
    }

    if (this.elements.infoBonus) {
      this.elements.infoBonus.textContent = `+${(game.achievementMultiplier * 100).toFixed(0)}%`;
    }

    if (this.elements.buildingsStats) {
      const buildingsInfo = buildings.getAllBuildingsInfo().filter(b => b.count > 0);
      this.elements.buildingsStats.innerHTML = buildingsInfo.map(b => `
        <div class="info-item">
          <span class="info-label">${b.icon} ${b.name}</span>
          <span class="info-value">x${b.count}</span>
        </div>
      `).join('') || '<div class="empty-message">暂无建筑</div>';
    }
  }

  // 渲染建筑列表
  renderBuildings() {
    if (!this.elements.buildingsList) return;

    const buildingsInfo = buildings.getAllBuildingsInfo();
    const visibleBuildings = buildingsInfo.filter(b => b.isVisible);

    this.elements.buildingsList.innerHTML = visibleBuildings.map(building => `
      <div class="building-item ${building.canAfford ? 'affordable' : 'expensive'}" data-id="${building.id}">
        <div class="building-icon">${building.icon}</div>
        <div class="building-info">
          <div class="building-header">
            <span class="building-name">${building.name}</span>
            <span class="building-count">x${building.count}</span>
          </div>
          <div class="building-description">${building.description}</div>
          <div class="building-production">
            每个产出：${building.formattedProduction}/秒
            ${building.count > 0 ? ` | 总产出：${building.formattedTotalProduction}/秒` : ''}
          </div>
        </div>
        <div class="building-cost">
          <button class="buy-btn ${building.canAfford ? '' : 'disabled'}" data-id="${building.id}">
            <span class="cost-amount">${building.formattedCost}</span>
            <span class="cost-label">金币</span>
          </button>
        </div>
      </div>
    `).join('');

    // 绑定购买事件
    this.elements.buildingsList.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const buildingId = btn.dataset.id;
        buildings.buy(buildingId);
        this.render();
      });
    });
  }

  // 渲染升级列表
  renderUpgrades() {
    if (!this.elements.upgradesList) return;

    const upgradesInfo = upgrades.getAllUpgradesInfo();

    if (upgradesInfo.length === 0) {
      this.elements.upgradesList.innerHTML = '<div class="empty-message">购买建筑后解锁升级</div>';
      return;
    }

    this.elements.upgradesList.innerHTML = upgradesInfo.map(upgrade => {
      let statusClass = '';
      let statusText = '';

      if (upgrade.purchased) {
        statusClass = 'purchased';
        statusText = '已购买';
      } else if (upgrade.locked) {
        statusClass = 'locked';
        statusText = `需要 ${upgrade.requiredCount} 个${upgrade.buildingName}`;
      } else if (upgrade.affordable) {
        statusClass = 'affordable';
        statusText = '可购买';
      } else {
        statusClass = 'expensive';
        statusText = '金币不足';
      }

      return `
        <div class="upgrade-item ${statusClass}" data-id="${upgrade.id}">
          <div class="upgrade-icon">${upgrade.buildingIcon}</div>
          <div class="upgrade-info">
            <div class="upgrade-header">
              <span class="upgrade-name">${upgrade.name}</span>
              <span class="upgrade-multiplier">x${upgrade.multiplier}</span>
            </div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-status">${statusText}</div>
          </div>
          ${!upgrade.purchased ? `
            <div class="upgrade-cost">
              <button class="buy-btn ${upgrade.affordable ? '' : 'disabled'}" data-id="${upgrade.id}">
                <span class="cost-amount">${upgrade.formattedCost}</span>
                <span class="cost-label">金币</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // 绑定购买事件
    this.elements.upgradesList.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const upgradeId = btn.dataset.id;
        upgrades.buy(upgradeId);
        this.render();
      });
    });
  }

  // 渲染成就列表
  renderAchievements() {
    if (!this.elements.achievementsList) return;

    const achievementsInfo = achievements.getAllAchievementsInfo();
    const unlockedCount = achievements.getUnlockedCount();
    const totalCount = achievements.getTotalCount();
    const totalBonus = achievements.getTotalBonus();

    if (this.elements.achievementCount) {
      this.elements.achievementCount.textContent = `${unlockedCount}/${totalCount}`;
    }

    if (this.elements.achievementBonus) {
      this.elements.achievementBonus.textContent = `+${(totalBonus * 100).toFixed(0)}%`;
    }

    this.elements.achievementsList.innerHTML = achievementsInfo.map(achievement => `
      <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}" data-id="${achievement.id}">
        <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
        <div class="achievement-info">
          <div class="achievement-header">
            <span class="achievement-name">${achievement.name}</span>
            <span class="achievement-reward">${achievement.formattedReward}</span>
          </div>
          <div class="achievement-description">${achievement.description}</div>
          <div class="achievement-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${achievement.progress.percentage}%"></div>
            </div>
            <span class="progress-text">${formatNumber(achievement.progress.current, this.useChineseNumbers)}/${formatNumber(achievement.progress.target, this.useChineseNumbers)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 渲染统计面板
  renderStats() {
    if (this.elements.playTime) {
      this.elements.playTime.textContent = formatPlayTime(game.getPlayTime());
    }

    if (this.elements.totalClicks) {
      this.elements.totalClicks.textContent = formatNumber(game.stats.totalClicks, this.useChineseNumbers);
    }

    if (this.elements.totalGold) {
      this.elements.totalGold.textContent = formatNumber(game.totalGold, this.useChineseNumbers);
    }

    if (this.elements.totalBuildings) {
      this.elements.totalBuildings.textContent = game.getTotalBuildingCount();
    }

    if (this.elements.totalUpgrades) {
      this.elements.totalUpgrades.textContent = game.stats.totalUpgradesPurchased;
    }
  }

  // 显示成就通知
  showAchievementNotification(achievement) {
    const notification = this.elements.achievementNotification;
    if (!notification) return;

    notification.innerHTML = `
      <div class="achievement-popup">
        <div class="achievement-popup-icon">🏆</div>
        <div class="achievement-popup-content">
          <div class="achievement-popup-title">成就解锁！</div>
          <div class="achievement-popup-name">${achievement.name}</div>
          <div class="achievement-popup-desc">${achievement.description}</div>
          <div class="achievement-popup-reward">+${(achievement.reward * 100).toFixed(0)}% 产出加成</div>
        </div>
      </div>
    `;

    notification.style.display = 'block';

    // 3秒后隐藏
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  // 显示临时消息
  showTemporaryMessage(message) {
    const msg = document.createElement('div');
    msg.className = 'temp-message';
    msg.textContent = message;
    document.body.appendChild(msg);

    setTimeout(() => {
      msg.remove();
    }, 2000);
  }

  // 渲染所有UI
  render() {
    this.updateStats();

    switch (this.currentTab) {
      case 'buildings':
        this.renderBuildings();
        break;
      case 'upgrades':
        this.renderUpgrades();
        break;
      case 'achievements':
        this.renderAchievements();
        break;
      case 'stats':
        this.renderStats();
        break;
    }

    // 更新成就摘要
    this.updateAchievementSummary();

    // 检查成就通知
    const newAchievements = achievements.checkAndUnlock();
    if (newAchievements.length > 0) {
      newAchievements.forEach(a => this.showAchievementNotification(a));
    }
  }

  // 更新成就摘要
  updateAchievementSummary() {
    const unlockedCount = achievements.getUnlockedCount();
    const totalCount = achievements.getTotalCount();
    const totalBonus = achievements.getTotalBonus();

    if (this.elements.achievementCount) {
      this.elements.achievementCount.textContent = `${unlockedCount}/${totalCount}`;
    }

    if (this.elements.achievementBonus) {
      this.elements.achievementBonus.textContent = `+${(totalBonus * 100).toFixed(0)}%`;
    }
  }
}

// 导出单例
export const ui = new UI();
