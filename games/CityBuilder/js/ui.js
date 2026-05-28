// ============================================
// 城市建设者 - UI系统
// ============================================

import { BUILDINGS, BUILDING_ORDER, MAX_BUILDING_LEVEL } from './config.js';

export class UI {
  constructor(buildingSystem, economy) {
    this.buildingSystem = buildingSystem;
    this.economy = economy;

    this.notifications = [];
    this.notificationTimer = 0;

    this.init();
  }

  init() {
    this.createBuildingPanel();
    this.createSpeedControls();
  }

  // 创建建筑选择面板
  createBuildingPanel() {
    const panel = document.getElementById('building-panel');
    panel.innerHTML = '<div class="panel-title">建筑</div>';

    for (const type of BUILDING_ORDER) {
      const config = BUILDINGS[type];
      const btn = document.createElement('div');
      btn.className = 'building-btn';
      btn.dataset.type = type;
      btn.innerHTML = `
        <span class="building-icon">${config.icon}</span>
        <span class="building-name">${config.name}</span>
        <span class="building-cost">💰${config.cost}</span>
      `;
      btn.title = config.description;
      btn.addEventListener('click', () => {
        this.buildingSystem.selectType(type);
        this.updateBuildingPanel();
      });
      panel.appendChild(btn);
    }
  }

  // 创建速度控制
  createSpeedControls() {
    const bar = document.getElementById('resource-bar');
    const speedDiv = document.createElement('div');
    speedDiv.id = 'speed-controls';
    speedDiv.innerHTML = `
      <button class="speed-btn active" data-speed="1">x1</button>
      <button class="speed-btn" data-speed="2">x2</button>
      <button class="speed-btn" data-speed="3">x3</button>
    `;
    bar.appendChild(speedDiv);
  }

  // 更新建筑面板高亮
  updateBuildingPanel() {
    const btns = document.querySelectorAll('.building-btn');
    btns.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === this.buildingSystem.selectedType);
    });
  }

  // 更新资源显示
  updateResources(summary) {
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set('res-gold', `💰 ${summary.gold}`);
    set('res-pop', `👥 ${summary.population}/${summary.populationCapacity}`);
    set('res-food', `🍎 ${summary.food}`);
    set('res-power', `⚡ ${summary.powerSupply}/${summary.powerNeed}`);

    const satEl = document.getElementById('res-satisfaction');
    if (satEl) {
      satEl.textContent = `😊 ${summary.satisfaction}%`;
      satEl.className = summary.satisfaction >= 60 ? 'good' : summary.satisfaction >= 35 ? 'warn' : 'bad';
    }

    set('res-day', `📅 第${summary.day}天`);

    // 日夜指示
    const dayEl = document.getElementById('res-time');
    if (dayEl) {
      dayEl.textContent = summary.isDaytime ? '☀️ 白天' : '🌙 夜晚';
    }
  }

  // 更新信息面板
  updateInfoPanel(col, row, grid, economy) {
    const panel = document.getElementById('info-panel');

    if (col === null || row === null) {
      panel.classList.add('hidden');
      return;
    }

    const building = grid.getBuilding(col, row);
    if (!building) {
      panel.classList.add('hidden');
      return;
    }

    const config = BUILDINGS[building.type];
    const level = building.level || 1;
    const multiplier = Math.pow(1.5, level - 1);

    panel.classList.remove('hidden');

    let details = '';
    if (config.populationCapacity) details += `人口容量: ${Math.floor(config.populationCapacity * multiplier)} `;
    if (config.jobs) details += `岗位: ${Math.floor(config.jobs * multiplier)} `;
    if (config.taxIncome) details += `税收: +${Math.floor(config.taxIncome * multiplier)}/天 `;
    if (config.foodIncome) details += `食物: +${Math.floor(config.foodIncome * multiplier)}/天 `;
    if (config.powerSupply) details += `电力: +${Math.floor(config.powerSupply * multiplier)} `;
    if (config.satisfactionBonus) details += `满意度: +${Math.floor(config.satisfactionBonus * multiplier)} `;

    const upgradeCost = this.buildingSystem.getUpgradeCost(col, row);
    const canUpgrade = upgradeCost !== null && economy.gold >= upgradeCost;

    panel.innerHTML = `
      <div class="info-header">
        <span class="info-icon">${config.icon}</span>
        <span class="info-name">${config.name}</span>
        <span class="info-level">Lv.${level}</span>
      </div>
      <div class="info-details">${details}</div>
      <div class="info-maint">维护费: ${Math.ceil(config.maintenance * (1 + (level - 1) * 0.3))}/天</div>
      <div class="info-actions">
        ${level < MAX_BUILDING_LEVEL ? `
          <button class="btn-upgrade ${canUpgrade ? '' : 'disabled'}" id="btn-upgrade">
            升级 (💰${upgradeCost})
          </button>
        ` : '<span class="max-level">已满级</span>'}
        <button class="btn-demolish" id="btn-demolish">
          拆除 (返还💰${Math.floor(config.cost * 0.5 * level)})
        </button>
      </div>
    `;

    // 绑定按钮事件
    const upgradeBtn = document.getElementById('btn-upgrade');
    if (upgradeBtn && canUpgrade) {
      upgradeBtn.addEventListener('click', () => {
        const result = this.buildingSystem.upgrade(col, row);
        if (result) {
          this.addNotification(`${config.name} 升级到 Lv.${result.building.level}`, 'success');
        }
      });
    }

    const demolishBtn = document.getElementById('btn-demolish');
    if (demolishBtn) {
      demolishBtn.addEventListener('click', () => {
        const result = this.buildingSystem.demolish(col, row);
        if (result) {
          this.addNotification(`拆除${config.name}，返还 ${result.refund} 金币`, 'warn');
          panel.classList.add('hidden');
        }
      });
    }
  }

  // 添加通知
  addNotification(text, type = 'info') {
    this.notifications.push({ text, type, timer: 300 });
    this.renderNotifications();
  }

  // 批量添加通知
  addNotifications(texts, type = 'info') {
    for (const text of texts) {
      this.notifications.push({ text, type, timer: 300 });
    }
    this.renderNotifications();
  }

  // 更新通知
  updateNotifications(dt) {
    let changed = false;
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].timer -= dt;
      if (this.notifications[i].timer <= 0) {
        this.notifications.splice(i, 1);
        changed = true;
      }
    }
    if (changed) this.renderNotifications();
  }

  // 渲染通知列表
  renderNotifications() {
    const container = document.getElementById('notifications');
    container.innerHTML = '';
    const recent = this.notifications.slice(-5);
    for (const n of recent) {
      const div = document.createElement('div');
      div.className = `notification ${n.type}`;
      div.textContent = n.text;
      const opacity = Math.min(1, n.timer / 60);
      div.style.opacity = opacity;
      container.appendChild(div);
    }
  }

  // 显示帮助
  toggleHelp() {
    const help = document.getElementById('help-overlay');
    help.classList.toggle('hidden');
  }

  // 更新建造按钮可用状态
  updateBuildingAvailability(gold) {
    const btns = document.querySelectorAll('.building-btn');
    btns.forEach(btn => {
      const type = btn.dataset.type;
      const config = BUILDINGS[type];
      btn.classList.toggle('cannot-afford', gold < config.cost);
    });
  }
}
