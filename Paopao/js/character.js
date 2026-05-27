// ============================================================
// 泡泡堂 - 角色类
// ============================================================

import { CELL, COLS, ROWS, TILE_EMPTY, TILE_SOFT, state, game } from './config.js';

export class Character {
  constructor(col, row, isPlayer) {
    this.x = col * CELL + CELL / 2;
    this.y = row * CELL + CELL / 2;
    this.isPlayer = isPlayer;
    this.speed = isPlayer ? 3 : 0;
    this.maxBombs = isPlayer ? 1 : 1;
    this.activeBombs = 0;
    this.flameRange = isPlayer ? 1 : 1;
    this.alive = true;
    this.dir = 0; // 0=down, 1=left, 2=right, 3=up
    this.animFrame = 0;
    this.animTimer = 0;
    this.invincible = 0;
    // 护盾层数
    this.shield = 0;
    // 全火效果（下一颗炸弹覆盖整条走廊）
    this.fullFire = false;
    // 穿墙效果（可穿越软墙）
    this.wallPassTimer = 0;
    // AI
    this.aiTimer = 0;
    this.aiState = 'patrol';
    this.aiTarget = null;
    this.aiDir = -1;
    this.bombCooldown = 0;
    this.passThroughBombs = new Set();
  }

  get col() { return Math.floor(this.x / CELL); }
  get row() { return Math.floor(this.y / CELL); }

  getSpeed() {
    if (this.isPlayer) return 3 + this.speed * 0.5;
    const base = game.difficulty === 'hard' ? 2.8 : game.difficulty === 'normal' ? 2.2 : 1.6;
    return base;
  }

  canPlaceBomb() {
    return this.activeBombs < this.maxBombs && this.bombCooldown <= 0;
  }

  update() {
    if (!this.alive) return;
    if (this.invincible > 0) this.invincible--;
    if (this.bombCooldown > 0) this.bombCooldown--;
    if (this.wallPassTimer > 0) this.wallPassTimer--;

    // 检查是否已离开可穿越的炸弹格子
    for (const bomb of this.passThroughBombs) {
      const bx = bomb.col * CELL + CELL / 2;
      const by = bomb.row * CELL + CELL / 2;
      if (Math.abs(this.x - bx) >= CELL * 0.9 || Math.abs(this.y - by) >= CELL * 0.9) {
        this.passThroughBombs.delete(bomb);
      }
    }

    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  move(dx, dy) {
    if (!this.alive) return;
    const spd = this.getSpeed();
    let nx = this.x + dx * spd;
    let ny = this.y + dy * spd;

    if (dx !== 0) this.dir = dx > 0 ? 2 : 1;
    if (dy !== 0) this.dir = dy > 0 ? 0 : 3;

    const halfSize = CELL * 0.35;
    const bombThresh = CELL * 0.7;
    let canMoveX = true;
    let canMoveY = true;

    // 移动前自动对齐垂直轴
    if (dx !== 0) {
      const centerRow = Math.round((this.y - CELL / 2) / CELL) * CELL + CELL / 2;
      const diff = centerRow - this.y;
      if (Math.abs(diff) > 1) this.y += Math.sign(diff) * Math.min(Math.abs(diff), this.getSpeed());
    }
    if (dy !== 0) {
      const centerCol = Math.round((this.x - CELL / 2) / CELL) * CELL + CELL / 2;
      const diff = centerCol - this.x;
      if (Math.abs(diff) > 1) this.x += Math.sign(diff) * Math.min(Math.abs(diff), this.getSpeed());
    }

    // X方向碰撞
    if (dx !== 0) {
      const newX = dx > 0 ? nx + halfSize : nx - halfSize;
      const c = Math.floor(newX / CELL);
      const topR = Math.floor((this.y - halfSize) / CELL);
      const botR = Math.floor((this.y + halfSize) / CELL);
      if (c < 0 || c >= COLS) {
        canMoveX = false;
      } else {
        const topTile = state.map[topR]?.[c];
        const botTile = state.map[botR]?.[c];
        // 穿墙模式下可穿越软墙
        const wallPass = this.wallPassTimer > 0;
        const topBlocked = topTile === TILE_EMPTY ? false : (wallPass && topTile === TILE_SOFT) ? false : true;
        const botBlocked = botTile === TILE_EMPTY ? false : (wallPass && botTile === TILE_SOFT) ? false : true;
        if (topR < 0 || topR >= ROWS || botR < 0 || botR >= ROWS || topBlocked || botBlocked) {
          canMoveX = false;
        }
      }
    }

    // Y方向碰撞
    if (dy !== 0) {
      const newY = dy > 0 ? ny + halfSize : ny - halfSize;
      const r = Math.floor(newY / CELL);
      const leftC = Math.floor((this.x - halfSize) / CELL);
      const rightC = Math.floor((this.x + halfSize) / CELL);
      if (r < 0 || r >= ROWS) {
        canMoveY = false;
      } else {
        const leftTile = state.map[r]?.[leftC];
        const rightTile = state.map[r]?.[rightC];
        const wallPass = this.wallPassTimer > 0;
        const leftBlocked = leftTile === TILE_EMPTY ? false : (wallPass && leftTile === TILE_SOFT) ? false : true;
        const rightBlocked = rightTile === TILE_EMPTY ? false : (wallPass && rightTile === TILE_SOFT) ? false : true;
        if (leftC < 0 || leftC >= COLS || rightC < 0 || rightC >= COLS || leftBlocked || rightBlocked) {
          canMoveY = false;
        }
      }
    }

    // 炸弹碰撞
    if (canMoveX || canMoveY) {
      for (const bomb of state.bombs) {
        if (this.passThroughBombs.has(bomb)) continue;
        const bx = bomb.col * CELL + CELL / 2;
        const by = bomb.row * CELL + CELL / 2;
        if (canMoveX && Math.abs(nx - bx) < bombThresh && Math.abs(this.y - by) < bombThresh) {
          canMoveX = false;
        }
        if (canMoveY && Math.abs(this.x - bx) < bombThresh && Math.abs(ny - by) < bombThresh) {
          canMoveY = false;
        }
      }
    }

    if (canMoveX) this.x = nx;
    if (canMoveY) this.y = ny;
  }

  draw() {
    if (!this.alive) return;
    const ctx = game.ctx;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const s = CELL * 0.9;

    if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);

    const bounce = this.animFrame % 2 === 0 ? 0 : -2;

    if (this.isPlayer) {
      this.drawPlayerCharacter(ctx, s, bounce);
    } else {
      this.drawEnemyCharacter(ctx, s, bounce);
    }

    // 护盾光环
    if (this.shield > 0) {
      ctx.strokeStyle = '#00ccff';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.6 + Math.sin(game.frame * 0.1) * 0.2;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  drawPlayerCharacter(ctx, s, bounce) {
    // 身体
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.ellipse(0, 2 + bounce, s * 0.45, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 头
    ctx.fillStyle = '#ffcc88';
    ctx.beginPath();
    ctx.arc(0, -6 + bounce, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // 头盔
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, -10 + bounce, s * 0.3, Math.PI, 0);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -8 + bounce, 3.5, 0, Math.PI * 2);
    ctx.arc(4, -8 + bounce, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // 瞳孔
    const eyeOffX = this.dir === 1 ? -1 : this.dir === 2 ? 1 : 0;
    const eyeOffY = this.dir === 3 ? -1 : this.dir === 0 ? 1 : 0;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-4 + eyeOffX, -8 + bounce + eyeOffY, 2, 0, Math.PI * 2);
    ctx.arc(4 + eyeOffX, -8 + bounce + eyeOffY, 2, 0, Math.PI * 2);
    ctx.fill();
    // 嘴巴
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(0, -3 + bounce, 2, 0, Math.PI);
    ctx.fill();
    // 腿
    ctx.fillStyle = '#3366cc';
    const legOff = this.animFrame % 2 === 0 ? 2 : -2;
    ctx.fillRect(-5, 8 + bounce, 4, 4 + legOff);
    ctx.fillRect(1, 8 + bounce, 4, 4 - legOff);
  }

  drawEnemyCharacter(ctx, s, bounce) {
    // 身体
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.ellipse(0, 2 + bounce, s * 0.45, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 头
    ctx.fillStyle = '#ffcc88';
    ctx.beginPath();
    ctx.arc(0, -6 + bounce, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // 恶魔角
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.moveTo(-6, -14 + bounce);
    ctx.lineTo(-3, -8 + bounce);
    ctx.lineTo(-9, -8 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -14 + bounce);
    ctx.lineTo(3, -8 + bounce);
    ctx.lineTo(9, -8 + bounce);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -8 + bounce, 3, 0, Math.PI * 2);
    ctx.arc(4, -8 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(-4, -8 + bounce, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -8 + bounce, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // 邪恶笑容
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -3 + bounce, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();
    // 腿
    ctx.fillStyle = '#cc2222';
    const legOff = this.animFrame % 2 === 0 ? 2 : -2;
    ctx.fillRect(-5, 8 + bounce, 4, 4 + legOff);
    ctx.fillRect(1, 8 + bounce, 4, 4 - legOff);
  }
}
