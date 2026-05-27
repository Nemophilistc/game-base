// ============================================================
// 泡泡堂 - 主入口（游戏循环、初始化、UI）
// ============================================================

import { CELL, COLS, ROWS, TILE_EMPTY, game, state, keys } from './config.js';
import { generateMap, drawMap } from './map.js';
import { Character } from './character.js';
import { Bomb, drawExplosions, updateExplosions, checkExplosionHit, placeBomb } from './bomb.js';
import { drawItems, checkItemPickup, updateItemTimers, updateItemSpawner } from './item.js';
import { updateAI } from './ai.js';

// DOM 引用
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
game.canvas = canvas;
game.ctx = ctx;
canvas.width = COLS * CELL;
canvas.height = 13 * CELL;

// ============================================================
// 输入
// ============================================================
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape' && game.state === 'playing') {
    pauseGame();
    e.preventDefault();
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ============================================================
// 游戏初始化
// ============================================================
function initGame() {
  generateMap(game.level);
  state.player = new Character(1, 1, true);
  state.player.speed = 0;

  const enemyCount = 3;
  const spawnPoints = [[COLS - 2, ROWS - 2], [COLS - 2, 1], [1, ROWS - 2], [COLS - 2, Math.floor(ROWS / 2)],
    [Math.floor(COLS / 2), 1], [Math.floor(COLS / 2), ROWS - 2]];
  state.enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    const [sc, sr] = spawnPoints[i % spawnPoints.length];
    state.enemies.push(new Character(sc, sr, false));
  }

  state.bombs = [];
  state.explosions = [];
  state.items = [];
  game.frame = 0;
  game.score = 0;
}

// ============================================================
// 游戏主循环
// ============================================================
function gameLoop() {
  requestAnimationFrame(gameLoop);
  game.frame++;

  if (game.state === 'playing') {
    try {
      updateGame();
      drawGame();
    } catch(e) {
      console.error('[MIMO] gameLoop error:', e);
      game.state = 'error';
    }
  } else {
    try {
      drawGame();
    } catch(e) {
      // Ignore draw errors in non-playing states
    }
  }
}

function updateGame() {
  // 玩家输入
  let dx = 0, dy = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
  if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
  if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
  if (keys['ArrowDown'] || keys['KeyS']) dy = 1;
  if (dx !== 0 || dy !== 0) {
    state.player.move(dx, dy);
    state.player.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx < 0 ? 1 : 2;
  }
  if (keys['Space']) {
    placeBomb(state.player);
    keys['Space'] = false;
  }

  state.player.update();

  // 更新炸弹
  for (let i = state.bombs.length - 1; i >= 0; i--) {
    if (state.bombs[i].update()) {
      state.bombs.splice(i, 1);
    }
  }

  // 更新爆炸
  updateExplosions();

  // 更新敌人AI
  for (const enemy of state.enemies) {
    updateAI(enemy);
  }

  // 检查爆炸伤害 - 玩家
  if (state.player.alive && state.player.invincible <= 0) {
    if (checkExplosionHit(state.player.col, state.player.row)) {
      if (state.player.shield > 0) {
        // 护盾抵挡一次伤害
        state.player.shield--;
        state.player.invincible = 90; // 1.5秒无敌
      } else {
        state.player.alive = false;
        game.state = 'lose';
        showMenu('lose');
      }
    }
  }

  // 检查爆炸伤害 - 敌人
  for (const enemy of state.enemies) {
    if (enemy.alive && enemy.invincible <= 0) {
      if (checkExplosionHit(enemy.col, enemy.row)) {
        enemy.alive = false;
        game.score += 100;
      }
    }
  }

  // 道具拾取
  checkItemPickup(state.player);
  for (const enemy of state.enemies) {
    checkItemPickup(enemy);
  }

  // 道具计时器
  updateItemTimers();

  // 随机道具生成
  updateItemSpawner();

  // 胜利检查
  if (state.enemies.every(e => !e.alive)) {
    game.state = 'win';
    showMenu('win');
  }

  // 更新HUD
  updateHUD();
}

// ============================================================
// 渲染
// ============================================================
function drawGame() {
  drawMap();
  if (!state.map || state.map.length === 0) return;

  drawItems();
  for (const bomb of state.bombs) bomb.draw();
  drawExplosions();
  for (const enemy of state.enemies) enemy.draw();
  if (state.player) state.player.draw();
}

// ============================================================
// UI 系统
// ============================================================
function showMenu(type) {
  document.getElementById('ui').classList.add('active');
  document.querySelectorAll('.menu').forEach(m => m.classList.remove('show'));

  if (type === 'start') {
    document.getElementById('startMenu').classList.add('show');
  } else if (type === 'pause') {
    document.getElementById('pauseMenu').classList.add('show');
  } else if (type === 'win') {
    document.getElementById('winMsg').textContent = `得分: ${game.score} · 剩余敌人: 0`;
    document.getElementById('winMenu').classList.add('show');
  } else if (type === 'lose') {
    const alive = state.enemies.filter(e => !e.alive).length;
    document.getElementById('loseMsg').textContent = `击败了 ${alive} 个敌人，得分: ${game.score}`;
    document.getElementById('loseMenu').classList.add('show');
  }
}

function hideMenu() {
  document.getElementById('ui').classList.remove('active');
  document.querySelectorAll('.menu').forEach(m => m.classList.remove('show'));
}

function updateHUD() {
  const hud = document.getElementById('hud');
  hud.style.display = 'flex';
  const p = state.player;
  let status = `炸弹: ${p.maxBombs} | 威力: ${p.flameRange} | 速度: ${p.speed}`;
  if (p.shield > 0) status += ` | 🛡️ ${p.shield}`;
  if (p.fullFire) status += ' | ⭐全火';
  if (p.wallPassTimer > 0) status += ' | 👻穿墙';
  document.getElementById('hudLives').textContent = status;
  document.getElementById('hudScore').textContent = `得分: ${game.score}`;
  const alive = state.enemies.filter(e => e.alive).length;
  document.getElementById('hudEnemies').textContent = `敌人: ${alive}`;
}

function pauseGame() {
  game.state = 'paused';
  showMenu('pause');
}

// ============================================================
// 事件绑定
// ============================================================
try {
console.log('[MIMO] Registering event listeners...');
document.getElementById('btnStart').addEventListener('click', () => {
  console.log('[MIMO] btnStart clicked');
  try {
    game.level = 1;
    initGame();
    game.state = 'playing';
    hideMenu();
    console.log('[MIMO] Game started OK');
  } catch(e) {
    console.error('[MIMO] initGame error:', e);
  }
});

document.getElementById('btnResume').addEventListener('click', () => {
  game.state = 'playing';
  hideMenu();
});

document.getElementById('btnQuit').addEventListener('click', () => {
  game.state = 'menu';
  document.getElementById('hud').style.display = 'none';
  showMenu('start');
});

document.getElementById('btnNext').addEventListener('click', () => {
  game.level++;
  initGame();
  game.state = 'playing';
  hideMenu();
});

document.getElementById('btnWinMenu').addEventListener('click', () => {
  game.state = 'menu';
  document.getElementById('hud').style.display = 'none';
  showMenu('start');
});

document.getElementById('btnRetry').addEventListener('click', () => {
  initGame();
  game.state = 'playing';
  hideMenu();
});

document.getElementById('btnLoseMenu').addEventListener('click', () => {
  game.state = 'menu';
  document.getElementById('hud').style.display = 'none';
  showMenu('start');
});

// 难度选择
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    game.difficulty = btn.dataset.diff;
    console.log('[MIMO] difficulty set to', game.difficulty);
  });
});
console.log('[MIMO] All event listeners registered');
} catch(e) {
  console.error('[MIMO] Event listener error:', e);
}

// ============================================================
// 启动
// ============================================================
console.log('[MIMO] main.js loaded, game.state =', game.state);
showMenu('start');
gameLoop();
console.log('[MIMO] gameLoop started');
