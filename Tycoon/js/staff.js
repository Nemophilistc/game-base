// ============================================================
// staff.js - 员工系统（厨师/服务员、升级、工资）
// ============================================================
import { STAFF_TYPES } from './config.js';

let nextStaffId = 1;

export class Staff {
  constructor(type) {
    this.id = nextStaffId++;
    this.type = type; // 'chef' | 'waiter'
    this.level = 1;
    this.x = 0;
    this.y = 0;
    this.busy = false;
    this.taskTimer = 0;
    this.currentTask = null; // { type, target, ... }

    const cfg = STAFF_TYPES[type];
    this.salary = cfg.baseSalary;
    this.speed = cfg.baseSpeed;
    this.capacity = type === 'waiter' ? cfg.baseCapacity : 0;
  }

  get config() {
    return STAFF_TYPES[this.type];
  }

  get name() {
    return this.config.name;
  }

  get icon() {
    return this.config.icon;
  }

  // 升级
  upgrade() {
    if (this.level >= this.config.maxLevel) return false;
    this.level++;
    // 每级提升
    if (this.type === 'chef') {
      this.speed = this.config.baseSpeed * (1 + 0.15 * (this.level - 1));
    } else {
      this.speed = this.config.baseSpeed * (1 + 0.12 * (this.level - 1));
      this.capacity = this.config.baseCapacity + (this.level - 1);
    }
    this.salary = Math.floor(this.config.baseSalary * (1 + 0.3 * (this.level - 1)));
    return true;
  }

  get upgradeCost() {
    return this.config.upgradeCost * this.level;
  }

  // 分配任务
  assignTask(task) {
    this.busy = true;
    this.currentTask = task;
    this.taskTimer = 0;
  }

  // 完成任务
  completeTask() {
    this.busy = false;
    const task = this.currentTask;
    this.currentTask = null;
    this.taskTimer = 0;
    return task;
  }

  update(dt) {
    if (this.busy && this.currentTask) {
      this.taskTimer += dt;
    }
  }
}

export class StaffManager {
  constructor() {
    this.staffList = [];
    // 初始员工
    this.hireChef();
    this.hireWaiter();
  }

  get chefs() {
    return this.staffList.filter(s => s.type === 'chef');
  }

  get waiters() {
    return this.staffList.filter(s => s.type === 'waiter');
  }

  get totalDailySalary() {
    return this.staffList.reduce((sum, s) => sum + s.salary, 0);
  }

  hireChef() {
    const s = new Staff('chef');
    // 初始位置在厨房
    s.x = 3;
    s.y = 3;
    this.staffList.push(s);
    return s;
  }

  hireWaiter() {
    const s = new Staff('waiter');
    s.x = 8;
    s.y = 10;
    this.staffList.push(s);
    return s;
  }

  getHireCost(type) {
    const count = this.staffList.filter(s => s.type === type).length;
    const base = type === 'chef' ? 200 : 150;
    return Math.floor(base * Math.pow(1.5, count));
  }

  // 找到空闲的厨师
  findIdleChef() {
    return this.chefs.find(c => !c.busy) || null;
  }

  // 找到空闲的服务员
  findIdleWaiter() {
    return this.waiters.find(w => !w.busy) || null;
  }

  // 烹饪速度加成（所有厨师平均）
  get avgCookSpeed() {
    const chefs = this.chefs;
    if (chefs.length === 0) return 0;
    return chefs.reduce((sum, c) => sum + c.speed, 0) / chefs.length;
  }

  update(dt) {
    for (const s of this.staffList) {
      s.update(dt);
    }
  }
}
