// ==================== 投射物系统 ====================

import { CELL_SIZE } from './config.js';
import { playExplosion, playEnemyDeath } from './sound.js';

export class Projectile {
  constructor(data) {
    this.type = data.type;
    this.x = data.x;
    this.y = data.y;
    this.target = data.target;
    this.angle = data.angle;
    this.damage = data.damage;
    this.speed = data.speed || 400;
    this.splashRadius = data.splashRadius || 0;
    this.slowFactor = data.slowFactor || 0;
    this.slowDuration = data.slowDuration || 0;
    this.chainCount = data.chainCount || 0;
    this.chainRange = data.chainRange || 0;
    this.burnDamage = data.burnDamage || 0;
    this.burnDuration = data.burnDuration || 0;
    this.pierceCount = data.pierceCount || 0;
    this.pierced = new Set();
    this.alive = true;
    this.trail = [];
  }

  update(dt, enemies) {
    if (!this.alive) return;

    // 保存轨迹
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) this.trail.shift();

    // 激光是瞬时的
    if (this.type === 'laser') {
      this.applyLaser(enemies);
      this.alive = false;
      return;
    }

    // 电塔也是瞬时连锁
    if (this.type === 'electric') {
      this.applyChain(enemies);
      this.alive = false;
      return;
    }

    // 追踪目标
    if (this.target && this.target.alive) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.angle = Math.atan2(dy, dx);

      if (dist < this.speed * dt) {
        this.hit(enemies);
        return;
      }
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    } else {
      // 目标已死，直线飞行
      this.x += Math.cos(this.angle) * this.speed * dt;
      this.y += Math.sin(this.angle) * this.speed * dt;
    }

    // 超出屏幕
    if (this.x < -50 || this.x > 1000 || this.y < -50 || this.y > 700) {
      this.alive = false;
    }
  }

  hit(enemies) {
    if (this.splashRadius > 0) {
      // 范围伤害
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) <= this.splashRadius) {
          e.takeDamage(this.damage);
          this.applyEffects(e);
        }
      }
      playExplosion();
    } else {
      // 单体伤害
      if (this.target && this.target.alive) {
        this.target.takeDamage(this.damage);
        this.applyEffects(this.target);
      }
    }
    this.alive = false;
  }

  applyEffects(enemy) {
    if (this.slowFactor > 0) {
      enemy.applySlow(this.slowFactor, this.slowDuration);
    }
    if (this.burnDamage > 0) {
      enemy.applyBurn(this.burnDamage, this.burnDuration);
    }
  }

  applyLaser(enemies) {
    // 直线穿透
    const dirX = Math.cos(this.angle);
    const dirY = Math.sin(this.angle);
    const range = 600;
    const hitWidth = 15;

    // 按距离排序
    const candidates = enemies
      .filter(e => e.alive)
      .map(e => {
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const along = dx * dirX + dy * dirY;
        const perp = Math.abs(dx * (-dirY) + dy * dirX);
        return { enemy: e, along, perp };
      })
      .filter(c => c.along > 0 && c.along < range && c.perp < hitWidth + CELL_SIZE * c.enemy.size / 2)
      .sort((a, b) => a.along - b.along);

    let pierced = 0;
    for (const c of candidates) {
      if (pierced >= this.pierceCount + 1) break;
      c.enemy.takeDamage(this.damage);
      this.applyEffects(c.enemy);
      pierced++;
    }
  }

  applyChain(enemies) {
    // 连锁闪电
    const hit = [this.target];
    if (this.target && this.target.alive) {
      this.target.takeDamage(this.damage);
      this.applyEffects(this.target);
    }

    let current = this.target;
    for (let i = 0; i < this.chainCount && current; i++) {
      let nearest = null;
      let minDist = this.chainRange;
      for (const e of enemies) {
        if (!e.alive || hit.includes(e)) continue;
        const dx = e.x - current.x;
        const dy = e.y - current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearest = e;
        }
      }
      if (nearest) {
        nearest.takeDamage(this.damage * 0.7);
        this.applyEffects(nearest);
        hit.push(nearest);
        current = nearest;
      }
    }
    // 存储连锁路径用于绘制
    this.chainPath = hit.map(e => ({ x: e.x, y: e.y }));
    this.chainPath.unshift({ x: this.x, y: this.y });
  }

  draw(ctx) {
    if (!this.alive && this.type !== 'electric' && this.type !== 'laser') return;

    ctx.save();

    switch (this.type) {
      case 'arrow':
        this.drawArrow(ctx);
        break;
      case 'cannon':
        this.drawCannonBall(ctx);
        break;
      case 'ice':
        this.drawIce(ctx);
        break;
      case 'electric':
        this.drawLightning(ctx);
        break;
      case 'flame':
        this.drawFlame(ctx);
        break;
      case 'laser':
        this.drawLaserBeam(ctx);
        break;
    }

    ctx.restore();
  }

  drawArrow(ctx) {
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -3);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();
  }

  drawCannonBall(ctx) {
    // 轨迹
    ctx.strokeStyle = 'rgba(100,100,100,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      if (i === 0) ctx.moveTo(t.x, t.y);
      else ctx.lineTo(t.x, t.y);
    }
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawIce(ctx) {
    ctx.translate(this.x, this.y);
    ctx.fillStyle = 'rgba(0,191,255,0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    // 冰晶光芒
    ctx.strokeStyle = 'rgba(0,191,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 2 / 4) * i + Date.now() * 0.003;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.stroke();
    }
  }

  drawLightning(ctx) {
    if (!this.chainPath || this.chainPath.length < 2) return;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(this.chainPath[0].x, this.chainPath[0].y);
    for (let i = 1; i < this.chainPath.length; i++) {
      const p = this.chainPath[i];
      // 锯齿形闪电
      const prev = this.chainPath[i - 1];
      const midX = (prev.x + p.x) / 2 + (Math.random() - 0.5) * 20;
      const midY = (prev.y + p.y) / 2 + (Math.random() - 0.5) * 20;
      ctx.quadraticCurveTo(midX, midY, p.x, p.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 每个节点闪光
    for (const p of this.chainPath) {
      ctx.fillStyle = 'rgba(255,215,0,0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFlame(ctx) {
    // 火焰粒子轨迹
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = i / this.trail.length * 0.5;
      const r = 2 + (i / this.trail.length) * 3;
      ctx.fillStyle = `rgba(255,${60 + i * 15},0,${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x + (Math.random() - 0.5) * 4, t.y + (Math.random() - 0.5) * 4, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLaserBeam(ctx) {
    if (!this.target) return;
    const tx = this.target.x;
    const ty = this.target.y;

    // 光束
    ctx.strokeStyle = 'rgba(255,0,255,0.6)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,200,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
