// ============================================================
// effects.js - 特效系统（粒子、闪光、背景脉冲）
// ============================================================

import { CELL_SIZE, GEM_PADDING } from './config.js';

// --- 粒子类 ---
class Particle {
  constructor(x, y, color, opts = {}) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = opts.angle ?? Math.random() * Math.PI * 2;
    const speed = opts.speed ?? (2 + Math.random() * 4);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = opts.life ?? 1;
    this.decay = opts.decay ?? (0.02 + Math.random() * 0.02);
    this.size = opts.size ?? (2 + Math.random() * 3);
    this.gravity = opts.gravity ?? 0.05;
    this.shape = opts.shape ?? 'circle'; // circle | star | line
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    if (this.shape === 'star') {
      this._drawStar(ctx, this.x, this.y, 5, this.size, this.size * 0.5);
    } else if (this.shape === 'line') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }
}

// --- 闪光效果类 ---
class Flash {
  constructor(x, y, color, maxRadius = 30) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 5;
    this.maxRadius = maxRadius;
    this.life = 1;
    this.decay = 0.06;
  }

  update() {
    this.radius += (this.maxRadius - this.radius) * 0.3;
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life * 0.5;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.5, this.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- 连锁闪电类 ---
class Lightning {
  constructor(x1, y1, x2, y2, color) {
    this.segments = this._generate(x1, y1, x2, y2);
    this.color = color;
    this.life = 1;
    this.decay = 0.08;
  }

  _generate(x1, y1, x2, y2) {
    const segs = [];
    const steps = 8;
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;
    let px = x1, py = y1;
    for (let i = 0; i < steps; i++) {
      const nx = x1 + dx * (i + 1) + (Math.random() - 0.5) * 15;
      const ny = y1 + dy * (i + 1) + (Math.random() - 0.5) * 15;
      segs.push({ x1: px, y1: py, x2: nx, y2: ny });
      px = nx;
      py = ny;
    }
    return segs;
  }

  update() {
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (const s of this.segments) {
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// --- 背景脉冲 ---
class PulseRing {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 10;
    this.life = 1;
    this.decay = 0.04;
    this.maxRadius = 80;
  }

  update() {
    this.radius += (this.maxRadius - this.radius) * 0.15;
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life * 0.3;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// --- 特效管理器 ---
export class EffectsManager {
  constructor() {
    this.particles = [];
    this.flashes = [];
    this.lightnings = [];
    this.pulses = [];
  }

  clear() {
    this.particles = [];
    this.flashes = [];
    this.lightnings = [];
    this.pulses = [];
  }

  // 消除特效：在指定位置生成粒子+闪光
  spawnDestroyEffect(cellX, cellY, color) {
    const cx = cellX + CELL_SIZE / 2;
    const cy = cellY + CELL_SIZE / 2;
    // 粒子
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle(cx, cy, color));
    }
    // 星形粒子
    for (let i = 0; i < 3; i++) {
      this.particles.push(new Particle(cx, cy, '#fff', {
        shape: 'star', size: 3, speed: 1 + Math.random() * 2, life: 0.8,
      }));
    }
    // 闪光
    this.flashes.push(new Flash(cx, cy, color));
  }

  // 连锁特效：闪电连线
  spawnChainEffect(x1, y1, x2, y2, color) {
    this.lightnings.push(new Lightning(x1, y1, x2, y2, color));
  }

  // 背景脉冲
  spawnPulse(cellX, cellY, color) {
    const cx = cellX + CELL_SIZE / 2;
    const cy = cellY + CELL_SIZE / 2;
    this.pulses.push(new PulseRing(cx, cy, color));
  }

  // 特殊宝石激活大特效
  spawnSpecialEffect(cellX, cellY, color) {
    const cx = cellX + CELL_SIZE / 2;
    const cy = cellY + CELL_SIZE / 2;
    for (let i = 0; i < 20; i++) {
      this.particles.push(new Particle(cx, cy, color, {
        speed: 4 + Math.random() * 6,
        size: 3 + Math.random() * 4,
        life: 1.2,
        shape: i % 3 === 0 ? 'star' : 'circle',
      }));
    }
    this.flashes.push(new Flash(cx, cy, '#fff', 50));
    this.pulses.push(new PulseRing(cx, cy, color));
  }

  // 分数飞字（返回一个对象给UI使用）
  createScorePopup(cellX, cellY, score, multiplier) {
    const cx = cellX + CELL_SIZE / 2;
    const cy = cellY + CELL_SIZE / 2;
    return { x: cx, y: cy, score, multiplier, life: 1, vy: -2 };
  }

  update() {
    this.particles = this.particles.filter(p => p.update());
    this.flashes   = this.flashes.filter(f => f.update());
    this.lightnings = this.lightnings.filter(l => l.update());
    this.pulses    = this.pulses.filter(p => p.update());
  }

  draw(ctx) {
    this.pulses.forEach(p => p.draw(ctx));
    this.lightnings.forEach(l => l.draw(ctx));
    this.flashes.forEach(f => f.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));
  }
}
