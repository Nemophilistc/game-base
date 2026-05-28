// ==================== 游戏主循环 ====================

import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  TOWER_TYPES, MAPS
} from './config.js';
import { initAudio, playBuild, playUpgrade, playSell, playWaveStart, playVictory, playDefeat, playEnemyDeath } from './sound.js';
import { initMap, drawMap, canBuild, placeTower, removeTower, selectMap } from './map.js';
import { Tower } from './tower.js';
import { Projectile } from './projectile.js';
import { WaveManager } from './wave.js';
import { initUI, drawUI, uiState, setCallbacks } from './ui.js';

// ---- 游戏状态 ----
let canvas, ctx;
let towers = [];
let enemies = [];
let projectiles = [];
let particles = [];
let goldPopups = [];
let waveManager;
let lastTime = 0;
let gameStarted = false;

// ---- 粒子效果 ----
class Particle {
  constructor(x, y, color, life = 0.5, vx = 0, vy = 0, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx + (Math.random() - 0.5) * 60;
    this.vy = vy + (Math.random() - 0.5) * 60;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 80 * dt; // 重力
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = this.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- 金币飘字 ----
class GoldPopup {
  constructor(x, y, amount) {
    this.x = x;
    this.y = y;
    this.amount = amount;
    this.life = 1.0;
    this.alive = true;
  }

  update(dt) {
    this.y -= 40 * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life);
    ctx.fillStyle = `rgba(241,196,15,${alpha})`;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${this.amount}G`, this.x, this.y);
  }
}

function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}

// ---- 初始化 ----
function init() {
  canvas = document.getElementById('gameCanvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT + 100; // 额外100px给面板
  ctx = canvas.getContext('2d');

  // 使用默认地图初始化
  initMap(MAPS[0].path);
  initUI(canvas);
  waveManager = new WaveManager();

  setCallbacks({
    onStartGame: startGame,
    onPauseToggle: () => {},
    onSpeedChange: (spd) => { uiState.gameSpeed = spd; },
    onSkipWait: () => { waveManager.forceNextWave(); },
    onTowerSelect: handleTowerSelect,
    onTowerPlace: handleTowerPlace,
    onTowerUpgrade: handleTowerUpgrade,
    onTowerSell: handleTowerSell,
    onMapSelect: handleMapSelect
  });

  requestAnimationFrame(gameLoop);
}

// ---- 回调处理 ----
function handleMapSelect(index) {
  selectMap(index);
  // 重新初始化地图
  initMap(MAPS[index].path);
}

function startGame() {
  initAudio();
  // 使用选中的地图重新初始化
  const mapIndex = uiState.selectedMapIndex || 0;
  initMap(MAPS[mapIndex].path);
  gameStarted = true;
  waveManager = new WaveManager();
  waveManager.startNextWave();
  uiState.waveNumber = 1;
  playWaveStart();
}

function handleTowerSelect(key, col, row) {
  if (key) {
    uiState.selectedTowerType = key;
    uiState.selectedTower = null;
    return;
  }
  // 点击地图上的塔
  if (col !== undefined) {
    const tower = towers.find(t => t.col === col && t.row === row);
    if (tower) {
      uiState.selectedTower = tower;
      uiState.selectedTowerType = null;
    } else {
      uiState.selectedTower = null;
    }
  }
}

function handleTowerPlace(col, row) {
  const type = uiState.selectedTowerType;
  if (!type) return;
  const cost = TOWER_TYPES[type].levels[0].cost;
  if (uiState.gold < cost) return;
  if (!canBuild(col, row)) return;

  uiState.gold -= cost;
  placeTower(col, row);
  const tower = new Tower(type, col, row);
  towers.push(tower);
  uiState.towerCount++;
  uiState.selectedTower = tower;
  uiState.selectedTowerType = null;
  playBuild();
}

function handleTowerUpgrade() {
  const tower = uiState.selectedTower;
  if (!tower || !tower.canUpgrade()) return;
  const cost = tower.upgradeCost;
  if (uiState.gold < cost) return;

  uiState.gold -= cost;
  tower.upgrade();
  playUpgrade();
}

function handleTowerSell() {
  const tower = uiState.selectedTower;
  if (!tower) return;

  uiState.gold += tower.sellValue;
  removeTower(tower.col, tower.row);
  towers = towers.filter(t => t !== tower);
  uiState.selectedTower = null;
  uiState.towerCount--;
  playSell();
}

// ---- 游戏循环 ----
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05) * uiState.gameSpeed;
  lastTime = timestamp;

  if (gameStarted && !uiState.isPaused && !uiState.showStartMenu) {
    update(dt);
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ---- 更新逻辑 ----
function update(dt) {
  if (uiState.showGameOver || uiState.showVictory) return;

  // 更新波次
  const waveResult = waveManager.update(dt, (enemy) => {
    enemies.push(enemy);
  });

  // 更新塔（创建投射物）
  for (const tower of towers) {
    const fireData = tower.update(dt, enemies);
    if (fireData) {
      projectiles.push(new Projectile(fireData));
    }
  }

  // 更新投射物（造成伤害）
  for (const proj of projectiles) {
    proj.update(dt, enemies);
  }

  // 更新敌人（移动、状态效果、死亡动画）
  const reachedEndList = [];
  const diedList = [];
  for (const enemy of enemies) {
    const wasAlive = enemy.alive;
    enemy.update(dt, enemies);

    // 敌人到达终点
    if (enemy.reachedEnd && wasAlive) {
      reachedEndList.push(enemy);
    }

    // 敌人死亡（被击杀）
    if (!enemy.alive && !enemy.reachedEnd && wasAlive) {
      diedList.push(enemy);
    }
  }

  // 处理到达终点的敌人
  for (const _ of reachedEndList) {
    uiState.lives--;
    if (uiState.lives <= 0) {
      uiState.lives = 0;
      uiState.showGameOver = true;
      playDefeat();
      return;
    }
  }

  // 处理被击杀的敌人（奖励）
  for (const enemy of diedList) {
    uiState.gold += enemy.reward;
    uiState.score += enemy.reward;
    uiState.killCount++;
    spawnParticles(enemy.x, enemy.y, 'rgb(255,100,50)', 12);
    goldPopups.push(new GoldPopup(enemy.x, enemy.y - 20, enemy.reward));
    playEnemyDeath();

    // 爆破兵死亡爆炸
    if (enemy.explosionDamage > 0 && !enemy.exploded) {
      enemy.exploded = true;
      // 对周围塔造成伤害（减少塔的血量或直接移除低级塔）
      // 这里改为对周围敌人也造成溅射伤害
      for (const other of enemies) {
        if (other === enemy || !other.alive) continue;
        const dx = other.x - enemy.x;
        const dy = other.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) <= enemy.explosionRadius) {
          other.takeDamage(30, true);
        }
      }
      // 爆炸特效
      spawnParticles(enemy.x, enemy.y, 'rgb(255,150,0)', 20);
      spawnParticles(enemy.x, enemy.y, 'rgb(255,50,0)', 15);
    }
  }

  // 召唤师召唤
  for (const enemy of enemies) {
    if (enemy.alive && enemy._shouldSummon) {
      enemy._shouldSummon = false;
      const summon = new Enemy(enemy.summonType, 1);
      summon.pathIndex = Math.max(0, enemy.pathIndex - 1);
      summon.x = enemy.x + (Math.random() - 0.5) * 20;
      summon.y = enemy.y + (Math.random() - 0.5) * 20;
      enemies.push(summon);
    }
  }

  // 更新粒子和飘字
  for (const p of particles) p.update(dt);
  for (const g of goldPopups) g.update(dt);

  // 清理
  enemies = enemies.filter(e => e.alive || e.deathTimer < 0.3);
  projectiles = projectiles.filter(p => p.alive);
  particles = particles.filter(p => p.alive);
  goldPopups = goldPopups.filter(g => g.alive);

  // 波次生成完毕，检查是否全部消灭
  if (waveResult === 'spawning_done') {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) {
      const bonus = waveManager.waveCleared();
      uiState.gold += bonus;
      uiState.waveNumber = waveManager.waveNumber;

      if (waveManager.allWavesComplete) {
        uiState.showVictory = true;
        playVictory();
        return;
      }

      playWaveStart();
    }
  }

  // 更新UI状态
  uiState.enemyCount = enemies.filter(e => e.alive).length;
  uiState.betweenWaves = waveManager.betweenWaves;
}

// ---- 渲染 ----
function render() {
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 暗色背景
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制地图
  drawMap(ctx);

  // 绘制塔
  for (const tower of towers) {
    tower.draw(ctx, tower === uiState.selectedTower);
  }

  // 绘制敌人
  for (const enemy of enemies) {
    enemy.draw(ctx);
  }

  // 绘制投射物
  for (const proj of projectiles) {
    proj.draw(ctx);
  }

  // 绘制粒子
  for (const p of particles) p.draw(ctx);

  // 绘制金币飘字
  for (const g of goldPopups) g.draw(ctx);

  // 绘制UI（覆盖层）
  drawUI(ctx);
}

// ---- 启动 ----
document.addEventListener('DOMContentLoaded', init);
