// ==================== 波次系统 ====================

import { ENEMY_TYPES } from './config.js';
import { Enemy } from './enemy.js';

/** 生成30波敌人配置 */
function generateWaveConfigs() {
  const waves = [];

  for (let w = 1; w <= 30; w++) {
    const enemies = [];
    const hpMult = 1 + (w - 1) * 0.15; // 每波血量增加15%

    // 基础数量随波次增加
    const baseCount = Math.min(5 + Math.floor(w * 1.2), 30);

    // 每5波Boss
    if (w % 5 === 0) {
      // Boss波
      for (let i = 0; i < Math.floor(w / 10) + 1; i++) {
        enemies.push({ type: 'boss', delay: i * 2 });
      }
      // 配一些小兵
      for (let i = 0; i < baseCount / 2; i++) {
        enemies.push({ type: 'normal', delay: i * 0.8 });
      }
    } else {
      // 根据波次解锁不同敌人
      for (let i = 0; i < baseCount; i++) {
        let type = 'normal';
        const roll = Math.random();

        if (w >= 18 && roll < 0.06) {
          type = 'summoner';
        } else if (w >= 15 && roll < 0.1) {
          type = 'shield';
        } else if (w >= 12 && roll < 0.12) {
          type = 'bomber';
        } else if (w >= 9 && roll < 0.15) {
          type = 'assassin';
        } else if (w >= 7 && roll < 0.2) {
          type = 'healer';
        } else if (w >= 5 && roll < 0.25) {
          type = 'armored';
        } else if (w >= 3 && roll < 0.3) {
          type = 'flying';
        } else if (w >= 2 && roll < 0.35) {
          type = 'fast';
        }

        enemies.push({ type, delay: i * 0.6 });
      }
    }

    waves.push({
      number: w,
      enemies,
      hpMultiplier: hpMult,
      bonusGold: w * 40
    });
  }

  return waves;
}

export class WaveManager {
  constructor() {
    this.waves = generateWaveConfigs();
    this.currentWave = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveActive = false;
    this.allWavesComplete = false;
    this.betweenWaves = true;
    this.betweenWaveTimer = 5; // 5秒间隔
    this.pendingEnemies = [];
  }

  get totalWaves() {
    return this.waves.length;
  }

  get waveNumber() {
    return this.currentWave + 1;
  }

  get isLastWave() {
    return this.currentWave >= this.waves.length;
  }

  startNextWave() {
    if (this.currentWave >= this.waves.length) {
      this.allWavesComplete = true;
      return [];
    }

    const wave = this.waves[this.currentWave];
    this.spawnQueue = [...wave.enemies].sort((a, b) => a.delay - b.delay);
    this.spawnTimer = 0;
    this.waveActive = true;
    this.betweenWaves = false;
    this.pendingEnemies = [];

    return wave;
  }

  update(dt, spawnCallback) {
    if (this.betweenWaves && !this.allWavesComplete) {
      this.betweenWaveTimer -= dt;
      if (this.betweenWaveTimer <= 0) {
        this.startNextWave();
        return null; // 返回null表示波次刚开始
      }
      return;
    }

    if (!this.waveActive) return;

    this.spawnTimer += dt;

    // 生成敌人
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].delay <= this.spawnTimer) {
      const spawn = this.spawnQueue.shift();
      const wave = this.waves[this.currentWave];
      const enemy = new Enemy(spawn.type, wave.hpMultiplier);
      spawnCallback(enemy);
    }

    // 检查波次是否结束（所有敌人已生成且场上无存活敌人）
    if (this.spawnQueue.length === 0) {
      return 'spawning_done'; // 通知main.js检查是否所有敌人已消灭
    }
  }

  waveCleared() {
    const bonus = this.waves[this.currentWave]?.bonusGold || 0;
    this.currentWave++;
    this.waveActive = false;

    if (this.currentWave >= this.waves.length) {
      this.allWavesComplete = true;
      return bonus;
    }

    this.betweenWaves = true;
    this.betweenWaveTimer = 8;
    return bonus;
  }

  skipWait() {
    if (this.betweenWaves) {
      this.betweenWaveTimer = 0;
    }
  }

  forceNextWave() {
    if (this.betweenWaves && !this.allWavesComplete) {
      return this.startNextWave();
    }
    return null;
  }
}
