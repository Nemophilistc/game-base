// ============================================
// 农场模拟游戏 - 天气系统
// ============================================

import { WEATHER_TYPES, SEASONS } from './config.js';

export class Weather {
  constructor() {
    this.current = 'sunny';
    this.forecast = []; // 未来3天预报
    this.history = [];
  }

  // 根据季节生成天气
  generateWeather(season) {
    const weights = { ...WEATHER_TYPES };

    // 根据季节调整概率
    switch (season) {
      case '春':
        weights.rain.chance = 0.25;
        weights.sunny.chance = 0.35;
        weights.drought.chance = 0.05;
        weights.storm.chance = 0.05;
        weights.bug.chance = 0.05;
        weights.cloudy.chance = 0.25;
        break;
      case '夏':
        weights.sunny.chance = 0.35;
        weights.drought.chance = 0.15;
        weights.rain.chance = 0.15;
        weights.storm.chance = 0.10;
        weights.bug.chance = 0.10;
        weights.cloudy.chance = 0.15;
        break;
      case '秋':
        weights.sunny.chance = 0.30;
        weights.rain.chance = 0.25;
        weights.cloudy.chance = 0.25;
        weights.bug.chance = 0.10;
        weights.drought.chance = 0.05;
        weights.storm.chance = 0.05;
        break;
      case '冬':
        weights.sunny.chance = 0.20;
        weights.cloudy.chance = 0.40;
        weights.rain.chance = 0.15;
        weights.storm.chance = 0.10;
        weights.drought.chance = 0.05;
        weights.bug.chance = 0.10;
        break;
    }

    // 加权随机选择
    const total = Object.values(weights).reduce((s, w) => s + w.chance, 0);
    let rand = Math.random() * total;
    for (const [type, data] of Object.entries(weights)) {
      rand -= data.chance;
      if (rand <= 0) return type;
    }
    return 'sunny';
  }

  // 推进一天
  advanceDay(season) {
    this.history.push(this.current);
    if (this.history.length > 30) this.history.shift();

    // 生成新天气
    this.current = this.generateWeather(season);

    // 更新预报
    this.forecast = [];
    for (let i = 0; i < 3; i++) {
      this.forecast.push(this.generateWeather(season));
    }

    return this.current;
  }

  // 获取当前天气信息
  getCurrent() {
    return {
      type: this.current,
      ...WEATHER_TYPES[this.current],
    };
  }

  // 获取预报
  getForecast() {
    return this.forecast.map(type => ({
      type,
      ...WEATHER_TYPES[type],
    }));
  }
}
