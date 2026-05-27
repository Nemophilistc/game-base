// ============================================================
// main.js - 游戏主循环、事件监听、时间系统
// ============================================================
import {
  START_MONEY, DAY_LENGTH, NIGHT_LENGTH,
  CUSTOMER_INTERVAL_BASE, DAILY_RENT,
  ENTRANCE, TABLE_POSITIONS, TILE,
} from './config.js';
import { Restaurant } from './restaurant.js';
import { CustomerManager, Customer, CUST_STATE } from './customer.js';
import { CookingSystem, ORDER_STATE } from './cooking.js';
import { MenuSystem } from './menu.js';
import { StaffManager } from './staff.js';
import { UI } from './ui.js';
import {
  soundCustomerArrive, soundPayment, soundUpgrade,
  soundCustomerAngry, soundNewDay, soundClick, soundError,
} from './sound.js';

// ============ 游戏状态 ============
class Game {
  constructor(canvas) {
    // 核心系统
    this.restaurant = new Restaurant();
    this.customerManager = new CustomerManager();
    this.cookingSystem = new CookingSystem();
    this.menu = new MenuSystem();
    this.staffManager = new StaffManager();
    this.ui = new UI(canvas);

    // 经济
    this.money = START_MONEY;
    this.dailyRent = DAILY_RENT;
    this.todayRevenue = 0;
    this.todayTips = 0;
    this.todayCost = 0;

    // 时间
    this.day = 1;
    this.dayTimer = DAY_LENGTH;
    this.isNight = false;
    this.nightTimer = 0;
    this.speedIdx = 0; // 0=1x, 1=2x, 2=3x
    this.speeds = [1, 2, 3];

    // 顾客生成
    this.customerTimer = 0;

    // 餐厅等级
    this.restaurantLevel = 1;
    this.exp = 0;
    this.expToNext = 100;

    // 暂停
    this.paused = false;

    // 等待新菜品
    this.pendingNewDishes = null;

    // 清洁任务队列（使用游戏时间）
    this.cleaningTasks = [];

    // 帧时间
    this.dt = 0;
    this.lastTime = 0;
  }

  get speed() {
    return this.speeds[this.speedIdx];
  }

  // ============ 主循环 ============
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    this.dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (!this.paused) {
      const dt = this.dt * this.speed;
      this.update(dt);
    }

    this.ui.render(this);
    requestAnimationFrame(t => this.loop(t));
  }

  // ============ 更新 ============
  update(dt) {
    if (this.isNight) {
      this.updateNight(dt);
      return;
    }

    // 白天
    this.dayTimer -= dt;
    if (this.dayTimer <= 0) {
      this.startNight();
      return;
    }

    // 顾客生成
    this.customerTimer -= dt;
    if (this.customerTimer <= 0) {
      this.spawnCustomer();
      // 根据餐厅等级调整间隔
      const levelBonus = Math.max(0.5, 1 - this.restaurantLevel * 0.05);
      this.customerTimer = CUSTOMER_INTERVAL_BASE * levelBonus * (0.7 + Math.random() * 0.6);
    }

    // 更新系统
    this.restaurant.update(dt);
    this.customerManager.update(dt);
    this.staffManager.update(dt);
    this.cookingSystem.update(dt, this.staffManager, this.restaurant);

    // AI：自动分配任务
    this.autoAssignTasks();

    // 处理离开的顾客
    this.processFinishedCustomers();

    // 更新员工位置
    this.updateStaffPositions(dt);
  }

  // ============ 顾客生成 ============
  spawnCustomer() {
    // 检查是否有空桌
    const table = this.restaurant.findFreeTable();
    if (!table) return;

    const customer = new Customer(this.menu, this.restaurantLevel);
    customer.table = table;

    // 设置目标位置（桌子旁边）
    customer.targetX = table.col;
    customer.targetY = table.row + 1; // 椅子在桌子下方

    // 占用桌子
    this.restaurant.occupyTable(table, customer.id);

    this.customerManager.addCustomer(customer);
    soundCustomerArrive();
  }

  // ============ AI自动分配 ============
  autoAssignTasks() {
    // 1. 厨师接单
    const pending = this.cookingSystem.getPendingOrders();
    for (const order of pending) {
      const chef = this.staffManager.findIdleChef();
      if (chef) {
        this.cookingSystem.assignChef(order, chef);
      }
    }

    // 2. 服务员上菜（在cooking.js的update中已处理）

    // 3. 服务员清洁脏桌
    const dirtyTable = this.restaurant.findDirtyTable();
    if (dirtyTable) {
      const waiter = this.staffManager.findIdleWaiter();
      if (waiter) {
        this.restaurant.cleanTable(dirtyTable);
        const cleanTime = 2.0 / waiter.speed;
        waiter.assignTask({ type: 'cleaning', tableId: dirtyTable.id, timer: 0, duration: cleanTime });
      }
    }

    // 更新清洁任务计时
    for (const s of this.staffManager.staffList) {
      if (s.busy && s.currentTask && s.currentTask.type === 'cleaning') {
        s.currentTask.timer += this.dt * this.speed;
        if (s.currentTask.timer >= s.currentTask.duration) {
          s.completeTask();
        }
      }
    }

    // 4. 等待点餐的顾客自动点餐
    for (const c of this.customerManager.customers) {
      if (c.state === CUST_STATE.SITTING) {
        c.state = CUST_STATE.ORDERING;
        // 创建订单
        this.cookingSystem.createOrder(c);
        c.state = CUST_STATE.WAITING;
        c.patience = c.maxPatience; // 点餐后重置耐心
      }
    }

    // 5. 上菜完成 → 开始用餐（检查SERVED状态的订单）
    for (const order of this.cookingSystem.orders) {
      if (order.state === ORDER_STATE.SERVED) {
        const customer = this.customerManager.customers.find(c => c.id === order.customerId);
        if (customer && customer.state === CUST_STATE.WAITING) {
          customer.state = CUST_STATE.EATING;
          // 食材成本
          this.todayCost += order.dish.cost;
          // 根据等待时间计算满意度
          const waitRatio = 1 - (customer.patience / customer.maxPatience);
          if (waitRatio > 0.5) customer.reduceSatisfaction(20);
          else if (waitRatio > 0.3) customer.reduceSatisfaction(10);
        }
      }
    }
  }

  // ============ 处理完成的顾客 ============
  processFinishedCustomers() {
    // 为刚进入离开状态的顾客设置出口目标
    for (const c of this.customerManager.customers) {
      if ((c.state === CUST_STATE.LEAVING || c.state === CUST_STATE.ANGRY) && !c.reachedExit) {
        if (c.targetX !== ENTRANCE.col || c.targetY !== ENTRANCE.row) {
          c.targetX = ENTRANCE.col;
          c.targetY = ENTRANCE.row;
          // 释放桌子
          if (c.table) {
            this.restaurant.leaveTable(c.table);
            c.table = null;
          }
          // 结算收入（只在第一次设置时执行）
          if (c.paid && !c._revenueCollected) {
            const total = c.revenue + c.tip;
            this.money += total;
            this.todayRevenue += c.revenue;
            this.todayTips += c.tip;
            c._revenueCollected = true;

            const px = c.x * TILE + TILE / 2;
            const py = c.y * TILE + this.ui.hudHeight;
            this.ui.addFloatingText(px, py, `+\u{1F4B0}${total}`, '#FFD700');

            this.gainExp(10 + Math.floor(c.satisfaction / 10));
            soundPayment();
          } else if (c.state === CUST_STATE.ANGRY && !c._angryNotified) {
            c._angryNotified = true;
            soundCustomerAngry();
            const px = c.x * TILE + TILE / 2;
            const py = c.y * TILE + this.ui.hudHeight;
            this.ui.addFloatingText(px, py, '\u{1F621}', '#F44336');
          }
        }
      }
    }

    // 移除已到达出口的顾客
    const finished = this.customerManager.collectFinished();
    // finished中包含reachedExit=true的顾客，已完成结算

    // 清理已上菜的订单和孤儿订单
    const activeCustomerIds = new Set(this.customerManager.customers.map(c => c.id));
    this.cookingSystem.cleanup(activeCustomerIds);
  }

  // ============ 员工位置更新 ============
  updateStaffPositions(dt) {
    for (const s of this.staffManager.staffList) {
      if (s.type === 'chef') {
        // 厨师在厨房区域随机移动
        if (!s.busy) {
          const targetX = 2 + Math.random() * 11;
          const targetY = 2 + Math.random() * 2;
          s.x += (targetX - s.x) * dt * 0.5;
          s.y += (targetY - s.y) * dt * 0.5;
        }
      } else {
        // 服务员在用餐区移动
        if (!s.busy) {
          const targetX = 2 + Math.random() * 11;
          const targetY = 7 + Math.random() * 10;
          s.x += (targetX - s.x) * dt * 0.3;
          s.y += (targetY - s.y) * dt * 0.3;
        }
      }
    }
  }

  // ============ 经验/升级 ============
  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.restaurantLevel++;
      this.expToNext = Math.floor(100 * Math.pow(1.3, this.restaurantLevel - 1));

      // 检查新菜品解锁
      const newDishes = this.menu.checkUnlocks(this.restaurantLevel);
      if (newDishes.length > 0) {
        this.pendingNewDishes = newDishes;
      }

      soundUpgrade();
      this.ui.addFloatingText(
        this.ui.canvas.width / 2,
        this.ui.canvas.height / 2,
        `\u{2B50} 餐厅升至 Lv.${this.restaurantLevel}!`,
        '#FFD700'
      );
    }
  }

  // ============ 夜晚结算 ============
  startNight() {
    this.isNight = true;
    this.nightTimer = NIGHT_LENGTH;

    // 清场：让所有剩余顾客离开
    for (const c of this.customerManager.customers) {
      if (!c.isDone) {
        c.state = CUST_STATE.ANGRY;
        c.reduceSatisfaction(30);
        c.targetX = ENTRANCE.col;
        c.targetY = ENTRANCE.row;
        c._angryNotified = true; // 避免重复音效
        if (c.table) {
          this.restaurant.leaveTable(c.table);
          c.table = null;
        }
      }
    }

    // 显示结算面板
    this.ui.overlay = { type: 'night', title: `\u{1F319} 第${this.day}天 结算` };
    this.paused = true;

    soundNewDay();
  }

  updateNight(dt) {
    // 夜晚由覆盖层按钮控制
  }

  startNewDay() {
    this.day++;
    this.dayTimer = DAY_LENGTH;
    this.isNight = false;
    this.todayRevenue = 0;
    this.todayTips = 0;
    this.todayCost = 0;
    this.customerTimer = 2; // 短暂延迟后开始来客
    this.ui.overlay = null;
    this.paused = false;

    // 扣除工资和租金
    const salary = this.staffManager.totalDailySalary;
    this.money -= salary;
    this.money -= this.dailyRent;

    // 检查破产
    if (this.money < 0) {
      this.money = Math.max(0, this.money);
      // 不破产，但会很困难
    }

    soundNewDay();
  }

  // ============ 操作处理 ============
  handleAction(action, data) {
    switch (action) {
      case 'menu':
        this.ui.overlay = { type: 'menu', title: '\u{1F4D6} 菜单管理' };
        this.paused = true;
        soundClick();
        break;
      case 'staff':
        this.ui.overlay = { type: 'staff', title: '\u{1F468}\u{200D}\u{1F373} 员工管理' };
        this.paused = true;
        soundClick();
        break;
      case 'decor':
        this.ui.overlay = { type: 'decor', title: '\u{1F3E0} 装修升级' };
        this.paused = true;
        soundClick();
        break;
      case 'kitchen':
        this.ui.overlay = { type: 'kitchen', title: '\u{2699}\u{FE0F} 厨房设备' };
        this.paused = true;
        soundClick();
        break;
      case 'speed':
        this.speedIdx = (this.speedIdx + 1) % 3;
        soundClick();
        break;
      case 'close_overlay':
        this.ui.overlay = null;
        this.paused = false;
        this.pendingNewDishes = null;
        soundClick();
        break;
      case 'new_day':
        this.startNewDay();
        break;
      case 'upgrade_staff': {
        const staff = this.staffManager.staffList.find(s => s.id === data.staffId);
        if (staff) {
          if (this.money >= staff.upgradeCost) {
            this.money -= staff.upgradeCost;
            staff.upgrade();
            soundUpgrade();
          } else {
            soundError();
          }
        }
        break;
      }
      case 'hire_chef': {
        const cost = this.staffManager.getHireCost('chef');
        if (this.money >= cost) {
          this.money -= cost;
          this.staffManager.hireChef();
          soundUpgrade();
        } else {
          soundError();
        }
        break;
      }
      case 'hire_waiter': {
        const cost = this.staffManager.getHireCost('waiter');
        if (this.money >= cost) {
          this.money -= cost;
          this.staffManager.hireWaiter();
          soundUpgrade();
        } else {
          soundError();
        }
        break;
      }
      case 'upgrade_decor': {
        const result = this.restaurant.upgradeDecor(data.decoId, this.money);
        if (result.success) {
          this.money -= result.cost;
          soundUpgrade();
        } else {
          soundError();
        }
        break;
      }
      case 'upgrade_kitchen': {
        const result = this.restaurant.upgradeKitchen(data.kitId, this.money);
        if (result.success) {
          this.money -= result.cost;
          soundUpgrade();
        } else {
          soundError();
        }
        break;
      }
    }
  }
}

// ============ 初始化 ============
function initGame() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Game canvas not found');
    return;
  }
  const game = new Game(canvas);

  // 点击事件
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const hit = game.ui.handleClick(px, py);
    if (hit) {
      game.handleAction(hit.action, hit);
    }
  });

  // 触摸事件
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (touch.clientX - rect.left) * scaleX;
    const py = (touch.clientY - rect.top) * scaleY;

    const hit = game.ui.handleClick(px, py);
    if (hit) {
      game.handleAction(hit.action, hit);
    }
  });

  // 鼠标滚轮（菜单滚动）
  canvas.addEventListener('wheel', (e) => {
    if (game.ui.overlay && game.ui.overlay.type === 'menu') {
      game.ui.menuScrollY = Math.max(0, game.ui.menuScrollY + e.deltaY * 0.5);
    }
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case '1': game.handleAction('menu'); break;
      case '2': game.handleAction('staff'); break;
      case '3': game.handleAction('decor'); break;
      case '4': game.handleAction('kitchen'); break;
      case ' ':
        e.preventDefault();
        game.handleAction('speed');
        break;
      case 'Escape':
        if (game.ui.overlay) game.handleAction('close_overlay');
        break;
    }
  });

  // 启动游戏循环
  game.loop(performance.now());
}

// 如果文档已加载，立即初始化；否则等待DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
