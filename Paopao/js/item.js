// ============================================================
// 泡泡堂 - 道具系统（6种道具 + 随机生成）
// ============================================================

import { CELL, COLS, ROWS, TILE_EMPTY,
  ITEM_FLAME, ITEM_SPEED, ITEM_BOMB, ITEM_SHIELD, ITEM_FULLFIRE, ITEM_WALLPASS,
  ITEM_MAX_COUNT, state, game } from './config.js';

// 随机生成计时器
let spawnTimer = 0;
const SPAWN_INTERVAL_MIN = 180; // 3秒
const SPAWN_INTERVAL_MAX = 300; // 5秒
let nextSpawn = SPAWN_INTERVAL_MIN + Math.floor(Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN));

// 软墙爆炸时掉落道具（已有逻辑）
export function spawnItemOnExplosion(col, row) {
  if (Math.random() < 0.35) {
    const type = randomItemType();
    state.items.push({ col, row, type, timer: 600 });
  }
}

// 随机在空格子上生成道具
export function updateItemSpawner() {
  if (game.state !== 'playing') return;
  spawnTimer++;
  if (spawnTimer < nextSpawn) return;
  spawnTimer = 0;
  nextSpawn = SPAWN_INTERVAL_MIN + Math.floor(Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN));

  // 超过上限不再生成
  if (state.items.length >= ITEM_MAX_COUNT) return;

  // 找空格子（避开炸弹、已有道具、角色位置）
  const occupied = new Set();
  for (const item of state.items) occupied.add(`${item.col},${item.row}`);
  for (const bomb of state.bombs) occupied.add(`${bomb.col},${bomb.row}`);
  if (state.player?.alive) occupied.add(`${state.player.col},${state.player.row}`);
  for (const e of state.enemies) {
    if (e.alive) occupied.add(`${e.col},${e.row}`);
  }

  const candidates = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (state.map[r][c] === TILE_EMPTY && !occupied.has(`${c},${r}`)) {
        candidates.push([c, r]);
      }
    }
  }
  if (candidates.length === 0) return;

  const [col, row] = candidates[Math.floor(Math.random() * candidates.length)];
  const type = randomItemType();
  state.items.push({ col, row, type, timer: 900 }); // 15秒后消失
}

function randomItemType() {
  // 权重：火焰25%、速度20%、炸弹20%、护盾15%、全火10%、穿墙10%
  const roll = Math.random();
  if (roll < 0.25) return ITEM_FLAME;
  if (roll < 0.45) return ITEM_SPEED;
  if (roll < 0.65) return ITEM_BOMB;
  if (roll < 0.80) return ITEM_SHIELD;
  if (roll < 0.90) return ITEM_FULLFIRE;
  return ITEM_WALLPASS;
}

export function drawItems() {
  const ctx = game.ctx;
  for (const item of state.items) {
    const x = item.col * CELL + CELL / 2;
    const y = item.row * CELL + CELL / 2;
    const bob = Math.sin(game.frame * 0.05) * 3;

    // 即将消失时闪烁
    if (item.timer < 120 && Math.floor(item.timer / 8) % 2 === 0) continue;

    ctx.save();
    ctx.translate(x, y + bob);

    // 背景光晕
    const glowColors = {
      [ITEM_FLAME]: 'rgba(255,68,68,0.3)',
      [ITEM_SPEED]: 'rgba(68,170,255,0.3)',
      [ITEM_BOMB]: 'rgba(68,255,68,0.3)',
      [ITEM_SHIELD]: 'rgba(0,204,255,0.3)',
      [ITEM_FULLFIRE]: 'rgba(255,170,0,0.3)',
      [ITEM_WALLPASS]: 'rgba(170,100,255,0.3)',
    };
    ctx.fillStyle = glowColors[item.type] || 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, CELL * 0.35, 0, Math.PI * 2);
    ctx.fill();

    const s = CELL * 0.25;

    if (item.type === ITEM_FLAME) {
      drawFlameIcon(ctx, s);
    } else if (item.type === ITEM_SPEED) {
      drawSpeedIcon(ctx, s);
    } else if (item.type === ITEM_BOMB) {
      drawBombIcon(ctx, s);
    } else if (item.type === ITEM_SHIELD) {
      drawShieldIcon(ctx, s);
    } else if (item.type === ITEM_FULLFIRE) {
      drawFullFireIcon(ctx, s);
    } else if (item.type === ITEM_WALLPASS) {
      drawWallPassIcon(ctx, s);
    }

    ctx.restore();
  }
}

function drawFlameIcon(ctx, s) {
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s, 0, 0, s);
  ctx.quadraticCurveTo(-s, 0, 0, -s);
  ctx.fill();
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.5, 0, 0, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.5, 0, 0, -s * 0.5);
  ctx.fill();
}

function drawSpeedIcon(ctx, s) {
  ctx.fillStyle = '#44aaff';
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `${s}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', 0, 0);
}

function drawBombIcon(ctx, s) {
  ctx.fillStyle = '#44ff44';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${s}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', 0, 1);
}

function drawShieldIcon(ctx, s) {
  // 盾牌形状
  ctx.fillStyle = '#00ccff';
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.8, -s * 0.4);
  ctx.lineTo(s * 0.8, s * 0.2);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.8, s * 0.2);
  ctx.lineTo(-s * 0.8, -s * 0.4);
  ctx.closePath();
  ctx.fill();
  // 盾牌高光
  ctx.fillStyle = '#66eeff';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.lineTo(s * 0.4, -s * 0.3);
  ctx.lineTo(s * 0.3, s * 0.1);
  ctx.lineTo(0, s * 0.3);
  ctx.lineTo(-s * 0.1, s * 0.1);
  ctx.lineTo(-s * 0.2, -s * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawFullFireIcon(ctx, s) {
  // 星星
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
    ctx.lineTo(Math.cos(innerAngle) * s * 0.4, Math.sin(innerAngle) * s * 0.4);
  }
  ctx.closePath();
  ctx.fill();
  // 中心闪光
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWallPassIcon(ctx, s) {
  // 幽灵形状
  ctx.fillStyle = '#aa66ff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(0, -s * 0.2, s * 0.6, Math.PI, 0);
  ctx.lineTo(s * 0.6, s * 0.5);
  // 波浪底部
  ctx.quadraticCurveTo(s * 0.3, s * 0.2, 0, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.3, s * 0.2, -s * 0.6, s * 0.5);
  ctx.closePath();
  ctx.fill();
  // 眼睛
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(-s * 0.2, -s * 0.2, s * 0.15, 0, Math.PI * 2);
  ctx.arc(s * 0.2, -s * 0.2, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.15, s * 0.08, 0, Math.PI * 2);
  ctx.arc(s * 0.25, -s * 0.15, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

export function checkItemPickup(char) {
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    if (char.col === item.col && char.row === item.row) {
      applyItemEffect(char, item.type);
      if (char.isPlayer) game.score += 50;
      state.items.splice(i, 1);
    }
  }
}

function applyItemEffect(char, type) {
  if (type === ITEM_FLAME) char.flameRange = Math.min(char.flameRange + 1, 6);
  if (type === ITEM_SPEED) char.speed = Math.min(char.speed + 1, 5);
  if (type === ITEM_BOMB) char.maxBombs = Math.min(char.maxBombs + 1, 5);
  if (type === ITEM_SHIELD) char.shield = Math.min(char.shield + 1, 3);
  if (type === ITEM_FULLFIRE) char.fullFire = true;
  if (type === ITEM_WALLPASS) char.wallPassTimer = 600; // 10秒
}

export function updateItemTimers() {
  for (let i = state.items.length - 1; i >= 0; i--) {
    state.items[i].timer--;
    if (state.items[i].timer <= 0) state.items.splice(i, 1);
  }
}
