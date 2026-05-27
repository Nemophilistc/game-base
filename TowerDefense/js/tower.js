// ==================== 塔系统 ====================

import { CELL_SIZE, TOWER_TYPES, SELL_REFUND_RATIO } from './config.js';
import { gridToPixel } from './map.js';
import {
  playArrowShoot, playCannonShoot, playIceShoot,
  playElectricShoot, playFlameShoot, playLaserShoot
} from './sound.js';

export class Tower {
  constructor(type, col, row) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.level = 0; // 0-indexed
    this.fireCooldown = 0;
    this.target = null;
    this.angle = 0;
    this.totalInvested = TOWER_TYPES[type].levels[0].cost;

    const pos = gridToPixel(col, row);
    this.x = pos.x;
    this.y = pos.y;
  }

  get stats() {
    return TOWER_TYPES[this.type].levels[this.level];
  }

  get typeName() {
    return TOWER_TYPES[this.type].name;
  }

  get icon() {
    return TOWER_TYPES[this.type].icon;
  }

  get maxLevel() {
    return TOWER_TYPES[this.type].levels.length - 1;
  }

  get upgradeCost() {
    if (this.level >= this.maxLevel) return 0;
    return TOWER_TYPES[this.type].levels[this.level + 1].cost;
  }

  get sellValue() {
    return Math.floor(this.totalInvested * SELL_REFUND_RATIO);
  }

  canUpgrade() {
    return this.level < this.maxLevel;
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    const cost = this.upgradeCost;
    this.totalInvested += cost;
    this.level++;
    return true;
  }

  update(dt, enemies) {
    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this.target = this.findTarget(enemies);
      if (this.target) {
        this.fireCooldown = this.stats.fireRate;
        // 更新朝向
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        this.angle = Math.atan2(dy, dx);
        return this.fire();
      }
    }
    // 更新朝向
    if (this.target && this.target.alive) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      this.angle = Math.atan2(dy, dx);
    }
    return null;
  }

  findTarget(enemies) {
    const range = this.stats.range * CELL_SIZE;
    let closest = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= range) {
        // 优先攻击路径进度最远的
        if (!closest || e.pathProgress > closest.pathProgress) {
          closest = e;
          minDist = dist;
        }
      }
    }
    return closest;
  }

  fire() {
    // 返回射击数据，由 main.js 创建投射物
    const s = this.stats;
    switch (this.type) {
      case 'arrow':
        playArrowShoot();
        break;
      case 'cannon':
        playCannonShoot();
        break;
      case 'ice':
        playIceShoot();
        break;
      case 'electric':
        playElectricShoot();
        break;
      case 'flame':
        playFlameShoot();
        break;
      case 'laser':
        playLaserShoot();
        break;
    }
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      target: this.target,
      angle: this.angle,
      damage: s.damage,
      splashRadius: s.splashRadius || 0,
      slowFactor: s.slowFactor || 0,
      slowDuration: s.slowDuration || 0,
      chainCount: s.chainCount || 0,
      chainRange: (s.chainRange || 0) * CELL_SIZE,
      burnDamage: s.burnDamage || 0,
      burnDuration: s.burnDuration || 0,
      pierceCount: s.pierceCount || 0,
      speed: 400
    };
  }

  draw(ctx, isSelected) {
    const s = this.stats;
    const x = this.x;
    const y = this.y;
    const size = CELL_SIZE * s.size;

    ctx.save();
    ctx.translate(x, y);

    // 选中时显示范围
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, s.range * CELL_SIZE, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 基座
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    // 塔身
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // 等级指示
    const starSize = 4;
    for (let i = 0; i <= this.level; i++) {
      const sx = (i - this.level / 2) * (starSize * 2 + 2);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(sx, -size / 2 - 6, starSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 炮管/武器指向
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    switch (this.type) {
      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size / 2 + 8, 0);
        ctx.stroke();
        break;
      case 'cannon':
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, size / 2 + 10, 10);
        break;
      case 'ice':
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size / 2 + 6, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,191,255,0.5)';
        ctx.beginPath();
        ctx.arc(size / 2 + 6, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'electric':
        // 电弧
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size / 3, -4);
        ctx.lineTo(size / 2 + 4, 2);
        ctx.stroke();
        break;
      case 'flame':
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(size / 2 + 8, 0);
        ctx.lineTo(size / 4, -6);
        ctx.lineTo(size / 4, 6);
        ctx.closePath();
        ctx.fill();
        break;
      case 'laser':
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(0, -3, size / 2 + 12, 6);
        ctx.fillStyle = 'rgba(255,0,255,0.3)';
        ctx.beginPath();
        ctx.arc(size / 2 + 12, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}
