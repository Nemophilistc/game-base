// ============================================================
// customer.js - 顾客系统（生成、等待、满意度、付钱）
// ============================================================
import {
  ENTRANCE, PATIENCE_BASE, PATIENCE_PER_LVL,
  EAT_TIME_BASE, TIP_RATE_PER_SATISFACTION,
  SATISFACTION_PERFECT, SATISFACTION_GOOD,
  SATISFACTION_OK, SATISFACTION_BAD,
} from './config.js';

// 顾客状态机
export const CUST_STATE = {
  ENTERING:    'entering',    // 走向桌子
  SITTING:     'sitting',     // 坐下等点餐
  ORDERING:    'ordering',    // 正在点餐
  WAITING:     'waiting',     // 等待上菜
  EATING:      'eating',      // 用餐中
  PAYING:      'paying',      // 付钱
  LEAVING:     'leaving',     // 离开（满意）
  ANGRY:       'angry',       // 愤怒离开
};

// 顾客外观
const HAIR_COLORS = ['#2C1810','#5D4037','#8D6E63','#FFD54F','#F44336','#1565C0','#4CAF50'];
const SHIRT_COLORS = ['#E53935','#1E88E5','#43A047','#FB8C00','#8E24AA','#00ACC1','#D81B60','#5E35B1'];

let nextCustomerId = 1;

export class Customer {
  constructor(menu, restaurantLevel) {
    this.id = nextCustomerId++;
    this.state = CUST_STATE.ENTERING;

    // 位置（像素坐标，会在main.js中转为格子）
    this.x = ENTRANCE.col;
    this.y = ENTRANCE.row;

    // 目标位置
    this.targetX = 0;
    this.targetY = 0;
    this.speed = 2.5; // 格/秒

    // 分配的桌子
    this.table = null;

    // 点的菜
    this.orderedDish = menu.randomDish();

    // 耐心值
    this.patience = PATIENCE_BASE + PATIENCE_PER_LVL * Math.max(0, restaurantLevel - 3);
    this.maxPatience = this.patience;

    // 用餐时间
    this.eatTimer = 0;
    this.eatTime = EAT_TIME_BASE;

    // 付钱计时
    this.payTimer = 0;

    // 满意度 0~100
    this.satisfaction = SATISFACTION_PERFECT;

    // 收入（上菜后计算）
    this.revenue = 0;
    this.tip = 0;
    this.paid = false;

    // 是否已到达出口
    this.reachedExit = false;

    // 外观
    this.hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
    this.shirtColor = SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];
    this.skinTone = Math.random() > 0.5 ? '#FFDAB9' : '#F5CBA7';
  }

  get isWaiting() {
    return this.state === CUST_STATE.WAITING || this.state === CUST_STATE.SITTING;
  }

  get isDone() {
    return (this.state === CUST_STATE.LEAVING || this.state === CUST_STATE.ANGRY)
           && this.reachedExit;
  }

  // 走向目标
  moveToward(dt) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.1) {
      this.x = this.targetX;
      this.y = this.targetY;
      return true; // 到达
    }
    const step = this.speed * dt;
    if (step >= dist) {
      this.x = this.targetX;
      this.y = this.targetY;
      return true;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    return false;
  }

  // 设置满意度（只能降低）
  reduceSatisfaction(amount) {
    this.satisfaction = Math.max(0, this.satisfaction - amount);
  }

  // 计算收入
  calculatePayment() {
    const price = this.orderedDish.price;
    this.revenue = price;
    // 小费 = 价格 * 满意度 * 小费率
    this.tip = Math.floor(price * this.satisfaction * TIP_RATE_PER_SATISFACTION);
    return this.revenue + this.tip;
  }

  update(dt) {
    switch (this.state) {
      case CUST_STATE.ENTERING: {
        const arrived = this.moveToward(dt);
        if (arrived) {
          this.state = CUST_STATE.SITTING;
        }
        break;
      }
      case CUST_STATE.SITTING:
      case CUST_STATE.WAITING:
        this.patience -= dt;
        if (this.patience <= 0) {
          this.state = CUST_STATE.ANGRY;
          this.reduceSatisfaction(50);
        }
        // 等待中持续降低满意度
        if (this.patience < this.maxPatience * 0.5) {
          this.reduceSatisfaction(dt * 2);
        }
        break;
      case CUST_STATE.EATING:
        this.eatTimer += dt;
        if (this.eatTimer >= this.eatTime) {
          this.state = CUST_STATE.PAYING;
          this.calculatePayment();
        }
        break;
      case CUST_STATE.PAYING:
        this.payTimer += dt;
        if (this.payTimer >= 2) {
          this.paid = true;
          this.state = CUST_STATE.LEAVING;
        }
        break;
      case CUST_STATE.LEAVING:
      case CUST_STATE.ANGRY:
        if (this.moveToward(dt)) {
          this.reachedExit = true;
        }
        break;
    }
  }
}

export class CustomerManager {
  constructor() {
    this.customers = [];
    this.totalServed = 0;
    this.totalRevenue = 0;
    this.totalTips = 0;
    this.totalAngry = 0;
  }

  addCustomer(customer) {
    this.customers.push(customer);
  }

  removeCustomer(id) {
    this.customers = this.customers.filter(c => c.id !== id);
  }

  get activeCustomers() {
    return this.customers.filter(c => !c.isDone);
  }

  get waitingCustomers() {
    return this.customers.filter(c =>
      c.state === CUST_STATE.SITTING || c.state === CUST_STATE.ORDERING
    );
  }

  get eatingCustomers() {
    return this.customers.filter(c => c.state === CUST_STATE.EATING);
  }

  update(dt) {
    for (const c of this.customers) {
      c.update(dt);
    }
  }

  // 收集已完成的顾客（收入结算）
  collectFinished() {
    const finished = [];
    const remaining = [];
    for (const c of this.customers) {
      if (c.isDone) {
        if (c.paid) {
          this.totalServed++;
          this.totalRevenue += c.revenue;
          this.totalTips += c.tip;
          finished.push(c);
        } else if (c.state === CUST_STATE.ANGRY) {
          this.totalAngry++;
          finished.push(c);
        } else {
          remaining.push(c);
        }
      } else {
        remaining.push(c);
      }
    }
    this.customers = remaining;
    return finished;
  }
}
