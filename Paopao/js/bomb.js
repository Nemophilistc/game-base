// ============================================================
// 泡泡堂 - 炸弹与爆炸系统
// ============================================================

import { CELL, COLS, ROWS, TILE_HARD, TILE_SOFT, TILE_EMPTY, COLORS, state, game } from './config.js';
import { spawnItemOnExplosion } from './item.js';

export class Bomb {
  constructor(col, row, range, owner) {
    this.col = col;
    this.row = row;
    this.range = range + Math.floor(Math.random() * 3);
    this.owner = owner;
    this.timer = 180; // 3秒 @ 60fps
    this.pulse = 0;
    // 全火效果：覆盖整条走廊
    this.isFullFire = owner.fullFire;
  }

  update() {
    this.timer--;
    this.pulse = (this.pulse + 1) % 20;
    if (this.timer <= 0) {
      this.explode();
      return true;
    }
    return false;
  }

  explode() {
    this.owner.activeBombs--;
    // 全火效果只对当前炸弹生效，消耗掉
    if (this.isFullFire) {
      this.owner.fullFire = false;
    }
    createExplosion(this.col, this.row, this.range, this.isFullFire);
  }

  draw() {
    const ctx = game.ctx;
    const x = this.col * CELL + CELL / 2;
    const y = this.row * CELL + CELL / 2;
    const pulseSize = 1 + Math.sin(this.pulse * Math.PI / 10) * 0.08;
    const urgency = this.timer < 60 ? (Math.floor(this.timer / 8) % 2 === 0 ? 1.2 : 1) : 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulseSize * urgency, pulseSize * urgency);

    // 全火炸弹外观（金色）
    if (this.isFullFire) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(0, 2, CELL * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(0, 2, CELL * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 普通炸弹
      ctx.fillStyle = COLORS.bomb;
      ctx.beginPath();
      ctx.arc(0, 2, CELL * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-4, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    // 引线
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(6, -16, 3, -20);
    ctx.stroke();

    // 火花
    if (this.timer < 120) {
      ctx.fillStyle = Math.random() > 0.5 ? '#ff0' : '#f80';
      ctx.beginPath();
      ctx.arc(3, -20, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function createExplosion(col, row, range, isFullFire) {
  const cells = [[col, row]];
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  for (const [dc, dr] of dirs) {
    if (isFullFire) {
      // 全火模式：覆盖整条走廊直到遇到硬墙
      for (let i = 1; i < 20; i++) {
        const nc = col + dc * i;
        const nr = row + dr * i;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) break;
        if (state.map[nr][nc] === TILE_HARD) break;
        cells.push([nc, nr]);
        if (state.map[nr][nc] === TILE_SOFT) {
          state.map[nr][nc] = TILE_EMPTY;
          game.score += 10;
          spawnItemOnExplosion(nc, nr);
          break;
        }
      }
    } else {
      // 普通模式
      for (let i = 1; i <= range; i++) {
        const nc = col + dc * i;
        const nr = row + dr * i;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) break;
        if (state.map[nr][nc] === TILE_HARD) break;
        cells.push([nc, nr]);
        if (state.map[nr][nc] === TILE_SOFT) {
          state.map[nr][nc] = TILE_EMPTY;
          game.score += 10;
          spawnItemOnExplosion(nc, nr);
          break;
        }
      }
    }
  }
  state.explosions.push({ cells, timer: 40, maxTimer: 40 });
}

export function updateExplosions() {
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    state.explosions[i].timer--;
    if (state.explosions[i].timer <= 0) {
      state.explosions.splice(i, 1);
    }
  }
}

export function drawExplosions() {
  const ctx = game.ctx;
  for (const exp of state.explosions) {
    const progress = 1 - exp.timer / exp.maxTimer;
    const colorIdx = Math.min(Math.floor(progress * COLORS.explosion.length), COLORS.explosion.length - 1);
    for (const [c, r] of exp.cells) {
      const x = c * CELL;
      const y = r * CELL;
      const alpha = 0.3 + (1 - progress) * 0.7;
      ctx.fillStyle = COLORS.explosion[colorIdx];
      ctx.globalAlpha = alpha;
      ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = alpha * 0.5;
      const s = CELL * 0.3 * (1 - progress);
      ctx.beginPath();
      ctx.arc(x + CELL / 2, y + CELL / 2, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export function checkExplosionHit(col, row) {
  for (const exp of state.explosions) {
    if (exp.cells.some(([c, r]) => c === col && r === row)) return true;
  }
  return false;
}

export function placeBomb(char) {
  if (!char.canPlaceBomb()) return;
  const col = char.col;
  const row = char.row;
  if (state.bombs.some(b => b.col === col && b.row === row)) return;
  const bomb = new Bomb(col, row, char.flameRange, char);
  state.bombs.push(bomb);
  char.activeBombs++;
  char.bombCooldown = 15;
  char.passThroughBombs.add(bomb);
}
