// ============================================
// 农场模拟游戏 - 动物系统
// ============================================

import { ANIMALS } from './config.js';

let nextAnimalId = 1;

export class Animal {
  constructor(type) {
    this.id = nextAnimalId++;
    this.type = type;
    this.data = ANIMALS[type];
    this.name = this.data.name + '#' + this.id;
    this.hunger = 100;         // 0=饿死 100=饱
    this.cleanliness = 100;    // 0=脏 100=干净
    this.happiness = 100;      // 幸福度影响产出
    this.lastFed = 0;          // 上次喂养天数
    this.lastCleaned = 0;      // 上次清洁天数
    this.lastProduct = 0;      // 上次产出天数
    this.lastBreed = 0;        // 上次繁殖天数
    this.daysAlive = 0;
    this.alive = true;
    this.hasProduct = false;   // 是否有产品可收集
  }

  // 喂养
  feed(currentDay) {
    if (!this.alive) return false;
    this.hunger = Math.min(100, this.hunger + 40);
    this.lastFed = currentDay;
    this.happiness = Math.min(100, this.happiness + 10);
    return true;
  }

  // 清洁
  clean(currentDay) {
    if (!this.alive) return false;
    this.cleanliness = 100;
    this.lastCleaned = currentDay;
    this.happiness = Math.min(100, this.happiness + 15);
    return true;
  }

  // 收集产品
  collectProduct() {
    if (!this.alive || !this.hasProduct) return null;
    this.hasProduct = false;
    this.lastProduct = this.daysAlive;
    return {
      type: this.type,
      product: this.data.product,
      price: this.data.productPrice,
      icon: this.data.icon,
    };
  }

  // 每日更新
  updateDay(currentDay) {
    if (!this.alive) return;

    this.daysAlive++;

    // 饥饿下降
    this.hunger -= 15;
    if (this.hunger < 0) this.hunger = 0;

    // 清洁度下降
    this.cleanliness -= 10;
    if (this.cleanliness < 0) this.cleanliness = 0;

    // 幸福度下降
    if (this.hunger < 30) this.happiness -= 5;
    if (this.cleanliness < 30) this.happiness -= 3;
    if (this.happiness < 0) this.happiness = 0;

    // 饿死或跑掉
    if (this.hunger <= 0) {
      this.alive = false;
      return;
    }

    // 产出产品
    if (this.hunger > 30 && this.cleanliness > 20) {
      const daysSinceProduct = this.daysAlive - this.lastProduct;
      if (daysSinceProduct >= this.data.productInterval) {
        this.hasProduct = true;
      }
    }
  }

  // 尝试繁殖
  tryBreed(currentDay) {
    if (!this.alive) return false;
    if (this.happiness < 60) return false;
    if (this.hunger < 50) return false;
    if (currentDay - this.lastBreed < this.data.breedCooldown) return false;
    if (Math.random() < this.data.breedChance) {
      this.lastBreed = currentDay;
      return true;
    }
    return false;
  }
}

export class AnimalManager {
  constructor() {
    this.animals = [];
    this.products = {}; // 收集的产品库存
  }

  // 购买动物
  buy(type) {
    const data = ANIMALS[type];
    if (!data) return null;
    const animal = new Animal(type);
    this.animals.push(animal);
    return animal;
  }

  // 每日更新
  updateDay(currentDay) {
    const newAnimals = [];
    for (const animal of this.animals) {
      animal.updateDay(currentDay);

      // 检查繁殖
      if (animal.alive && animal.tryBreed(currentDay)) {
        const baby = new Animal(animal.type);
        newAnimals.push(baby);
      }
    }
    // 移除死亡动物
    this.animals = this.animals.filter(a => a.alive);
    // 添加新生动物
    this.animals.push(...newAnimals);
    return newAnimals.length;
  }

  // 获取动物总数
  getCount() {
    return this.animals.length;
  }

  // 按类型获取动物
  getByType(type) {
    return this.animals.filter(a => a.type === type);
  }

  // 收集所有产品
  collectAllProducts() {
    const collected = [];
    for (const animal of this.animals) {
      const product = animal.collectProduct();
      if (product) {
        if (!this.products[product.product]) {
          this.products[product.product] = { ...product, amount: 0 };
        }
        this.products[product.product].amount++;
        collected.push(product);
      }
    }
    return collected;
  }

  // 出售产品
  sellProducts(productName) {
    for (const key of Object.keys(this.products)) {
      if (this.products[key].product === productName) {
        const item = this.products[key];
        const total = item.amount * item.price;
        const amount = item.amount;
        delete this.products[key];
        return { total, amount };
      }
    }
    return null;
  }

  // 获取所有可出售产品
  getProductList() {
    return Object.values(this.products).filter(p => p.amount > 0);
  }
}
