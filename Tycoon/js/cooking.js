// ============================================================
// cooking.js - 烹饪系统（接单、制作时间、上菜）
// ============================================================
import { soundOrder, soundCooking, soundServe } from './sound.js';

// 订单状态
export const ORDER_STATE = {
  PENDING:  'pending',   // 等待厨师接单
  COOKING:  'cooking',   // 烹饪中
  SERVING:  'serving',   // 上菜中（服务员端菜）
  READY:    'ready',     // 做好等待上菜
  SERVED:   'served',    // 已上菜
};

export class Order {
  constructor(customer, dish) {
    this.id = `order_${customer.id}`;
    this.customerId = customer.id;
    this.dish = dish;
    this.state = ORDER_STATE.PENDING;
    this.cookProgress = 0;     // 0~1
    this.cookTime = dish.cookTime;
    this.chefId = null;        // 负责的厨师id
    this.waiterId = null;      // 上菜的服务员id
    this.serveTimer = 0;       // 上菜计时
    this.serveTime = 0;        // 上菜所需时间
  }

  get cookTimeRemaining() {
    return Math.max(0, this.cookTime * (1 - this.cookProgress));
  }
}

export class CookingSystem {
  constructor() {
    this.orders = [];
    this.completedOrders = 0;
  }

  // 创建新订单
  createOrder(customer) {
    const order = new Order(customer, customer.orderedDish);
    this.orders.push(order);
    soundOrder();
    return order;
  }

  // 厨师接单
  assignChef(order, chef) {
    if (order.state !== ORDER_STATE.PENDING) return false;
    order.state = ORDER_STATE.COOKING;
    order.chefId = chef.id;
    chef.assignTask({ type: 'cooking', orderId: order.id });
    return true;
  }

  // 获取待接单的订单
  getPendingOrders() {
    return this.orders.filter(o => o.state === ORDER_STATE.PENDING);
  }

  // 获取正在烹饪的订单
  getCookingOrders() {
    return this.orders.filter(o => o.state === ORDER_STATE.COOKING);
  }

  // 获取做好等待上菜的订单
  getReadyOrders() {
    return this.orders.filter(o => o.state === ORDER_STATE.READY);
  }

  // 获取上菜中的订单
  getServingOrders() {
    return this.orders.filter(o => o.state === ORDER_STATE.SERVING);
  }

  // 获取订单
  getOrder(orderId) {
    return this.orders.find(o => o.id === orderId) || null;
  }

  update(dt, staffManager, restaurant) {
    // 处理烹饪中的订单
    for (const order of this.getCookingOrders()) {
      const chef = staffManager.chefs.find(c => c.id === order.chefId);
      if (!chef) continue;

      // 烹饪速度 = 厨师速度 * (1 + 厨房设备加成)
      const speedMultiplier = chef.speed * (1 + restaurant.cookingSpeedBonus);
      const progress = (dt / order.cookTime) * speedMultiplier;
      order.cookProgress = Math.min(1, order.cookProgress + progress);

      if (order.cookProgress >= 1) {
        order.state = ORDER_STATE.READY;
        chef.completeTask();
        soundServe();
        this.completedOrders++;
      }
    }

    // 处理待上菜的订单 → 分配服务员
    for (const order of this.getReadyOrders()) {
      if (order.waiterId) continue;
      const waiter = staffManager.findIdleWaiter();
      if (waiter) {
        order.waiterId = waiter.id;
        order.state = ORDER_STATE.SERVING;
        order.serveTime = 1.0 / waiter.speed; // 上菜时间(秒)
        order.serveTimer = 0;
        waiter.assignTask({ type: 'serving', orderId: order.id });
      }
    }

    // 处理上菜中的订单
    for (const order of this.getServingOrders()) {
      const waiter = staffManager.waiters.find(w => w.id === order.waiterId);
      if (!waiter) continue;

      order.serveTimer += dt;
      if (order.serveTimer >= order.serveTime) {
        order.state = ORDER_STATE.SERVED;
        waiter.completeTask();
      }
    }
  }

  // 清理已完成的订单和孤儿订单（客户已离开）
  cleanup(customerIds) {
    this.orders = this.orders.filter(o => {
      if (o.state === ORDER_STATE.SERVED) return false;
      if (customerIds && !customerIds.has(o.customerId)) return false;
      return true;
    });
  }
}
