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
    const now = Date.now();

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

    // 按类型绘制不同塔身
    switch (this.type) {
      case 'arrow': this._drawArrowTower(ctx, size, now); break;
      case 'cannon': this._drawCannonTower(ctx, size, now); break;
      case 'ice': this._drawIceTower(ctx, size, now); break;
      case 'electric': this._drawElectricTower(ctx, size, now); break;
      case 'flame': this._drawFlameTower(ctx, size, now); break;
      case 'laser': this._drawLaserTower(ctx, size, now); break;
      default:
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.fill();
    }

    // 等级星星
    const starSize = 3;
    for (let i = 0; i <= this.level; i++) {
      const sx = (i - this.level / 2) * (starSize * 2 + 2);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(sx, -size / 2 - 8, starSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- 箭塔：木质高塔+弓 ---
  _drawArrowTower(ctx, size, now) {
    // 石基
    ctx.fillStyle = '#6d4c41';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-size / 2, -size / 4, size, size * 0.6, 3);
    else ctx.rect(-size / 2, -size / 4, size, size * 0.6);
    ctx.fill();
    // 木质塔身
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(0, -2, size / 2.5, 0, Math.PI * 2);
    ctx.fill();
    // 木纹
    ctx.strokeStyle = 'rgba(100,60,20,0.3)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-size / 3, i * 4);
      ctx.lineTo(size / 3, i * 4);
      ctx.stroke();
    }
    // 弓臂
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 6, -0.6, 0.6);
    ctx.stroke();
    // 弓弦
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    const bowR = size / 2 + 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-0.6) * bowR, Math.sin(-0.6) * bowR);
    ctx.lineTo(Math.cos(0.6) * bowR, Math.sin(0.6) * bowR);
    ctx.stroke();
    // 箭
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(size / 2 + 8, 0);
    ctx.lineTo(size / 2 + 2, -2);
    ctx.lineTo(size / 2 + 2, 2);
    ctx.closePath();
    ctx.fill();
  }

  // --- 炮塔：金属底座+粗炮管 ---
  _drawCannonTower(ctx, size, now) {
    // 金属底座
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#444');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    // 铆钉
    ctx.fillStyle = '#999';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * size / 3, Math.sin(a) * size / 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 炮塔旋转部分
    ctx.rotate(this.angle);
    // 炮管
    ctx.fillStyle = '#555';
    ctx.fillRect(0, -4, size / 2 + 10, 8);
    // 炮口
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(size / 2 + 10, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // 炮口焰
    if (this.fireCooldown > this.stats.fireRate - 0.1) {
      ctx.fillStyle = 'rgba(255,150,0,0.6)';
      ctx.beginPath();
      ctx.arc(size / 2 + 14, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- 冰塔：水晶结构 ---
  _drawIceTower(ctx, size, now) {
    // 冰晶基座
    ctx.fillStyle = 'rgba(0,150,255,0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 2, 0, Math.PI * 2);
    ctx.fill();
    // 主水晶体（六边形）
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i - Math.PI / 6;
      const r = size / 2.5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    // 内部折射
    ctx.fillStyle = 'rgba(200,240,255,0.4)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i - Math.PI / 6;
      const r = size / 4;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    // 旋转冰晶碎片
    const rot = now * 0.002;
    ctx.fillStyle = 'rgba(0,191,255,0.5)';
    for (let i = 0; i < 3; i++) {
      const a = rot + (Math.PI * 2 / 3) * i;
      const r = size / 2 + 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + 0.3) * (r - 4), Math.sin(a + 0.3) * (r - 4));
      ctx.lineTo(Math.cos(a - 0.3) * (r - 4), Math.sin(a - 0.3) * (r - 4));
      ctx.closePath();
      ctx.fill();
    }
    // 武器指向
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#00CED1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size / 2 + 6, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,191,255,0.6)';
    ctx.beginPath();
    ctx.arc(size / 2 + 6, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 电塔：特斯拉线圈 ---
  _drawElectricTower(ctx, size, now) {
    // 底座
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    // 线圈层
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const r = size / 3 + i * 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 顶部球体
    const pulse = Math.sin(now * 0.008) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(255,215,0,${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, size / 5, 0, Math.PI * 2);
    ctx.fill();
    // 电弧
    ctx.strokeStyle = `rgba(255,215,0,${0.4 + Math.sin(now * 0.01) * 0.3})`;
    ctx.lineWidth = 1;
    ctx.rotate(this.angle);
    for (let i = 0; i < 3; i++) {
      const a = (i - 1) * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const mid = size / 4;
      ctx.lineTo(mid, a * 8);
      ctx.lineTo(size / 2 + 4, a * 4);
      ctx.stroke();
    }
    // 顶部电光球
    ctx.fillStyle = `rgba(255,255,200,${pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 火焰塔：火山口+火焰 ---
  _drawFlameTower(ctx, size, now) {
    // 火山基座
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(-size / 2, size / 4);
    ctx.lineTo(-size / 4, -size / 3);
    ctx.lineTo(size / 4, -size / 3);
    ctx.lineTo(size / 2, size / 4);
    ctx.closePath();
    ctx.fill();
    // 熔岩纹路
    ctx.strokeStyle = 'rgba(255,100,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-size / 6, 0);
    ctx.quadraticCurveTo(0, -size / 4, size / 6, 0);
    ctx.stroke();
    // 火焰核心
    const flicker = Math.sin(now * 0.012) * 2;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(0, -size / 4 - 2 + flicker, size / 4, 0, Math.PI * 2);
    ctx.fill();
    // 内焰
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, -size / 4 - 1 + flicker, size / 6, 0, Math.PI * 2);
    ctx.fill();
    // 火焰粒子
    for (let i = 0; i < 3; i++) {
      const fy = -size / 3 - i * 4 + Math.sin(now * 0.01 + i) * 3;
      const fx = (Math.random() - 0.5) * size * 0.4;
      const alpha = 0.4 - i * 0.1;
      ctx.fillStyle = `rgba(255,${100 + i * 50},0,${alpha})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 喷射方向
    ctx.rotate(this.angle);
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(size / 2 + 6, 0);
    ctx.lineTo(size / 3, -5);
    ctx.lineTo(size / 3, 5);
    ctx.closePath();
    ctx.fill();
  }

  // --- 激光塔：科技天线碟 ---
  _drawLaserTower(ctx, size, now) {
    // 底座
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    // 科技纹路
    ctx.strokeStyle = 'rgba(255,0,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
    ctx.stroke();
    // 能量环
    const ringRot = now * 0.003;
    ctx.strokeStyle = `rgba(255,0,255,${0.3 + Math.sin(now * 0.005) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2.5, ringRot, ringRot + 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size / 2.5, ringRot + Math.PI, ringRot + Math.PI + 1.5);
    ctx.stroke();
    // 天线碟
    ctx.rotate(this.angle);
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.ellipse(size / 4, 0, size / 4, size / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // 发射管
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(0, -2, size / 2 + 10, 4);
    // 透镜发光
    const lensGlow = Math.sin(now * 0.008) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,0,255,${lensGlow})`;
    ctx.beginPath();
    ctx.arc(size / 2 + 10, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    // 能量光圈
    ctx.fillStyle = `rgba(255,0,255,${lensGlow * 0.2})`;
    ctx.beginPath();
    ctx.arc(size / 2 + 10, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
