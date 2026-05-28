// ==================== 敌人系统 ====================

import { CELL_SIZE, ENEMY_TYPES } from './config.js';
import { pathPixels } from './map.js';

// roundRect polyfill
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

let enemyIdCounter = 0;

export class Enemy {
  constructor(type, waveMultiplier = 1) {
    this.id = enemyIdCounter++;
    const def = ENEMY_TYPES[type];
    this.type = type;
    this.name = def.name;
    this.maxHp = Math.floor(def.hp * waveMultiplier);
    this.hp = this.maxHp;
    this.baseSpeed = def.speed;
    this.speed = def.speed;
    this.reward = def.reward;
    this.color = def.color;
    this.size = def.size;
    this.armor = def.armor;
    this.flying = def.flying || false;
    this.healAmount = def.healAmount || 0;
    this.healRange = (def.healRange || 0) * CELL_SIZE;
    this.healInterval = def.healInterval || 0;
    this.healCooldown = 0;

    this.alive = true;
    this.reachedEnd = false;

    // 路径跟随
    this.pathIndex = 0;
    this.pathProgress = 0;
    this.x = pathPixels[0].x;
    this.y = pathPixels[0].y;
    this.facingX = 1;
    this.facingY = 0;

    // 状态效果
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.burnTimer = 0;
    this.burnDamage = 0;
    this.burnTickTimer = 0;

    // 可视化
    this.hitFlash = 0;
    this.deathTimer = 0;
    this.walkCycle = Math.random() * Math.PI * 2;
    this.spawnTime = Date.now();
    this.trail = [];
  }

  update(dt, enemies) {
    if (!this.alive) {
      this.deathTimer += dt;
      return;
    }

    // 状态效果：减速
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      this.speed = this.baseSpeed * this.slowFactor;
      if (this.slowTimer <= 0) {
        this.speed = this.baseSpeed;
      }
    }

    // 状态效果：灼烧DOT
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.takeDamage(this.burnDamage, true);
        this.burnTickTimer = 0.5;
      }
    }

    // 治疗能力
    if (this.healAmount > 0) {
      this.healCooldown -= dt;
      if (this.healCooldown <= 0) {
        this.healNearby(enemies);
        this.healCooldown = this.healInterval;
      }
    }

    // 沿路径移动
    if (this.pathIndex < pathPixels.length - 1) {
      const target = pathPixels[this.pathIndex + 1];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = this.speed * CELL_SIZE * dt;

      if (dist <= moveSpeed) {
        this.x = target.x;
        this.y = target.y;
        this.pathIndex++;
        this.pathProgress = this.pathIndex / (pathPixels.length - 1);
      } else {
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
        this.pathProgress = (this.pathIndex + (1 - dist / CELL_SIZE)) / (pathPixels.length - 1);
        // 更新朝向
        this.facingX = dx / dist;
        this.facingY = dy / dist;
      }

      // 走路动画
      this.walkCycle += dt * this.speed * 8;

      // 快速敌人拖尾
      if (this.speed >= 1.5) {
        this.trail.push({ x: this.x, y: this.y, alpha: 0.4, time: Date.now() });
        if (this.trail.length > 8) this.trail.shift();
      }
    }

    // 拖尾衰减
    for (const t of this.trail) {
      t.alpha -= dt * 2;
    }
    this.trail = this.trail.filter(t => t.alpha > 0);

    // 到达终点
    if (this.pathIndex >= pathPixels.length - 1) {
      this.reachedEnd = true;
      this.alive = false;
    }

    // 受击闪烁
    if (this.hitFlash > 0) this.hitFlash -= dt * 5;
  }

  takeDamage(amount, ignoreArmor = false) {
    let dmg = amount;
    if (!ignoreArmor && this.armor > 0) {
      dmg = Math.max(1, amount - this.armor);
    }
    this.hp -= dmg;
    this.hitFlash = 1;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  applySlow(factor, duration) {
    if (factor < this.slowFactor || this.slowTimer <= 0) {
      this.slowFactor = factor;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyBurn(damage, duration) {
    this.burnDamage = damage;
    this.burnTimer = duration;
    this.burnTickTimer = 0.5;
  }

  healNearby(enemies) {
    let healed = false;
    for (const e of enemies) {
      if (e === this || !e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.healRange) {
        e.hp = Math.min(e.maxHp, e.hp + this.healAmount);
        healed = true;
      }
    }
    if (healed) {
      this.hp = Math.min(this.maxHp, this.hp + this.healAmount);
    }
  }

  draw(ctx) {
    const s = this.size * CELL_SIZE;
    const now = Date.now();

    ctx.save();
    ctx.translate(this.x, this.y);

    // 死亡动画
    if (!this.alive && this.deathTimer < 0.4) {
      const t = this.deathTimer / 0.4;
      ctx.globalAlpha = 1 - t;
      const scale = 1 + t * 2;
      ctx.scale(scale, scale);
      // 死亡爆炸粒子
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 3;
        const r = t * s;
        ctx.fillStyle = `rgba(255,150,50,${1 - t})`;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 3 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (!this.alive) {
      ctx.restore();
      return;
    }

    // 拖尾效果
    ctx.restore();
    for (const t of this.trail) {
      ctx.fillStyle = `rgba(243,156,18,${t.alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(t.x - this.x, t.y - this.y, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(this.x, this.y);

    // 地面阴影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, s / 2 + 4, s * 0.6, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const flash = this.hitFlash > 0;
    const bob = Math.sin(this.walkCycle) * 2;

    // 按类型绘制
    switch (this.type) {
      case 'normal': this._drawSoldier(ctx, s, flash, now, bob); break;
      case 'fast': this._drawRunner(ctx, s, flash, now, bob); break;
      case 'flying': this._drawFairy(ctx, s, flash, now); break;
      case 'armored': this._drawTank(ctx, s, flash, now, bob); break;
      case 'healer': this._drawPriest(ctx, s, flash, now, bob); break;
      case 'boss': this._drawDemon(ctx, s, flash, now); break;
      default:
        ctx.fillStyle = flash ? '#fff' : this.color;
        ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill();
    }

    // 减速视觉效果
    if (this.slowTimer > 0) {
      ctx.strokeStyle = 'rgba(0,191,255,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (now * 0.003 + i * 1.57) % (Math.PI * 2);
        const r = s / 2 + 4;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 冰霜粒子
      for (let i = 0; i < 2; i++) {
        const fx = (Math.random() - 0.5) * s;
        const fy = -s / 2 + Math.random() * s;
        ctx.fillStyle = 'rgba(100,200,255,0.5)';
        ctx.fillRect(fx, fy, 2, 2);
      }
    }

    // 灼烧视觉效果
    if (this.burnTimer > 0) {
      for (let i = 0; i < 5; i++) {
        const fx = (Math.random() - 0.5) * s * 0.8;
        const fy = -s / 3 - Math.random() * s * 0.5;
        const r = Math.random();
        ctx.fillStyle = `rgba(255,${50 + r * 150},0,${0.5 + r * 0.3})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // 血条
    if (this.alive && this.hp < this.maxHp) {
      const barW = s * 1.4;
      const barH = 5;
      const barX = this.x - barW / 2;
      const barY = this.y - s / 2 - 12;
      const hpRatio = this.hp / this.maxHp;

      // 血条背景
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
      ctx.fill();

      // 血条颜色
      const barColor = hpRatio > 0.6 ? '#2ecc71' : hpRatio > 0.3 ? '#f39c12' : '#e74c3c';
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * hpRatio, barH, 1);
      ctx.fill();

      // 血条高光
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(barX, barY, barW * hpRatio, barH / 2);
    }

    // 名称标签（Boss和精英）
    if (this.alive && (this.type === 'boss' || this.type === 'healer')) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(this.name).width;
      ctx.beginPath();
      ctx.roundRect(this.x - tw / 2 - 3, this.y - s / 2 - 26, tw + 6, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(this.name, this.x, this.y - s / 2 - 15);
    }
  }

  // --- 步兵：全身人形 + 盾牌 + 头盔 + 走路动画 ---
  _drawSoldier(ctx, s, flash, now, bob) {
    const c = flash ? '#fff' : this.color;
    const legSwing = Math.sin(this.walkCycle) * 4;

    // 腿
    ctx.fillStyle = flash ? '#ddd' : '#8B0000';
    ctx.fillRect(-4, s / 4 + bob, 3, 6 + legSwing);
    ctx.fillRect(2, s / 4 + bob, 3, 6 - legSwing);

    // 身体（躯干）
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(-s / 3, -s / 6 + bob, s * 0.65, s * 0.55, 3);
    ctx.fill();

    // 腰带
    ctx.fillStyle = flash ? '#ccc' : '#5D4037';
    ctx.fillRect(-s / 3, s / 6 + bob, s * 0.65, 3);

    // 盾牌（左手）
    ctx.fillStyle = flash ? '#ddd' : '#78909C';
    ctx.beginPath();
    ctx.ellipse(-s / 2 - 3, 2 + bob, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // 盾牌纹章
    ctx.fillStyle = flash ? '#eee' : '#B0BEC5';
    ctx.beginPath();
    ctx.ellipse(-s / 2 - 3, 2 + bob, 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头
    ctx.fillStyle = flash ? '#eee' : '#FFCCBC';
    ctx.beginPath();
    ctx.arc(0, -s / 3 + bob, s / 4, 0, Math.PI * 2);
    ctx.fill();

    // 头盔
    ctx.fillStyle = flash ? '#ddd' : '#B71C1C';
    ctx.beginPath();
    ctx.arc(0, -s / 3 - 2 + bob, s / 3.5, Math.PI, 0);
    ctx.fill();
    // 头盔檐
    ctx.fillStyle = flash ? '#ccc' : '#880E0E';
    ctx.fillRect(-s / 3, -s / 3 - 1 + bob, s * 0.65, 3);

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-3, -s / 3 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -s / 3 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-2.5, -s / 3 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -s / 3 + bob, 1.2, 0, Math.PI * 2); ctx.fill();

    // 武器（右手长矛）
    ctx.strokeStyle = flash ? '#ccc' : '#5D4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s / 3, -s / 4 + bob);
    ctx.lineTo(s / 2 + 6, -s / 2 - 4 + bob);
    ctx.stroke();
    // 矛头
    ctx.fillStyle = flash ? '#eee' : '#CFD8DC';
    ctx.beginPath();
    ctx.moveTo(s / 2 + 6, -s / 2 - 4 + bob);
    ctx.lineTo(s / 2 + 3, -s / 2 - 8 + bob);
    ctx.lineTo(s / 2 + 9, -s / 2 - 8 + bob);
    ctx.closePath();
    ctx.fill();
  }

  // --- 刺客：流线型 + 匕首 + 残影 ---
  _drawRunner(ctx, s, flash, now, bob) {
    const c = flash ? '#fff' : this.color;
    const lean = 0.2; // 前倾

    ctx.save();
    ctx.rotate(lean);

    // 腿（奔跑动画）
    const legSwing = Math.sin(this.walkCycle) * 6;
    ctx.fillStyle = flash ? '#ddd' : '#222';
    ctx.fillRect(-3, s / 4 + bob, 2, 5 + legSwing);
    ctx.fillRect(2, s / 4 + bob, 2, 5 - legSwing);

    // 身体（紧身衣）
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, bob, s / 3, s / 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 斗篷
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.3)' : 'rgba(230,126,34,0.4)';
    ctx.beginPath();
    ctx.moveTo(-s / 3, -s / 4 + bob);
    ctx.quadraticCurveTo(-s / 2 - 4, 0 + bob, -s / 3, s / 3 + bob);
    ctx.lineTo(-s / 5, 0 + bob);
    ctx.closePath();
    ctx.fill();

    // 头（兜帽）
    ctx.fillStyle = flash ? '#eee' : '#333';
    ctx.beginPath();
    ctx.arc(0, -s / 3 + bob, s / 4, 0, Math.PI * 2);
    ctx.fill();
    // 兜帽尖角
    ctx.fillStyle = flash ? '#ddd' : '#222';
    ctx.beginPath();
    ctx.moveTo(0, -s / 2 + bob);
    ctx.lineTo(-3, -s / 3 - 2 + bob);
    ctx.lineTo(3, -s / 3 - 2 + bob);
    ctx.closePath();
    ctx.fill();

    // 发光眼睛
    ctx.fillStyle = flash ? '#fff' : '#FF5722';
    ctx.beginPath(); ctx.arc(-2, -s / 3 + bob, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -s / 3 + bob, 2, 0, Math.PI * 2); ctx.fill();
    // 眼睛发光
    ctx.shadowColor = '#FF5722';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#FF5722';
    ctx.beginPath(); ctx.arc(-2, -s / 3 + bob, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -s / 3 + bob, 1, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // 匕首
    ctx.fillStyle = flash ? '#eee' : '#CFD8DC';
    ctx.beginPath();
    ctx.moveTo(s / 3, -s / 6 + bob);
    ctx.lineTo(s / 2 + 5, -s / 3 + bob);
    ctx.lineTo(s / 3 + 1, 0 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- 飞龙：翅膀扇动 + 龙形 + 火焰尾迹 ---
  _drawFairy(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    const wingFlap = Math.sin(now * 0.01) * 12;
    const hover = Math.sin(now * 0.004) * 3;

    ctx.save();
    ctx.translate(0, hover);

    // 翅膀（龙翼）
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.4)' : 'rgba(155,89,182,0.6)';
    // 左翼
    ctx.beginPath();
    ctx.moveTo(-s / 4, -2);
    ctx.quadraticCurveTo(-s / 2 - 8, -s / 2 - 6 + wingFlap, -s / 2 - 2, -s / 4 + wingFlap);
    ctx.quadraticCurveTo(-s / 2 - 6, s / 6 + wingFlap * 0.5, -s / 4, s / 4);
    ctx.closePath();
    ctx.fill();
    // 右翼
    ctx.beginPath();
    ctx.moveTo(s / 4, -2);
    ctx.quadraticCurveTo(s / 2 + 8, -s / 2 - 6 - wingFlap, s / 2 + 2, -s / 4 - wingFlap);
    ctx.quadraticCurveTo(s / 2 + 6, s / 6 - wingFlap * 0.5, s / 4, s / 4);
    ctx.closePath();
    ctx.fill();

    // 翅膀骨架
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.3)' : 'rgba(155,89,182,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-s / 4, 0);
    ctx.lineTo(-s / 2 - 4, -s / 3 + wingFlap * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s / 4, 0);
    ctx.lineTo(s / 2 + 4, -s / 3 - wingFlap * 0.7);
    ctx.stroke();

    // 身体（龙身）
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, s / 3, s / 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 鳞片纹理
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.2)' : 'rgba(120,60,150,0.3)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-2 + i * 3, -4 + i * 4, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 头
    ctx.fillStyle = flash ? '#eee' : '#7B1FA2';
    ctx.beginPath();
    ctx.ellipse(0, -s / 3, s / 4, s / 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 龙角
    ctx.fillStyle = flash ? '#ccc' : '#4A148C';
    ctx.beginPath();
    ctx.moveTo(-3, -s / 2.5);
    ctx.lineTo(-6, -s / 2 - 6);
    ctx.lineTo(0, -s / 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, -s / 2.5);
    ctx.lineTo(6, -s / 2 - 6);
    ctx.lineTo(0, -s / 2.5);
    ctx.closePath();
    ctx.fill();

    // 眼睛（龙眼）
    ctx.fillStyle = flash ? '#fff' : '#FFD700';
    ctx.beginPath(); ctx.arc(-3, -s / 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -s / 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    // 竖瞳
    ctx.fillRect(-3.5, -s / 3 - 2, 1.5, 4);
    ctx.fillRect(2.5, -s / 3 - 2, 1.5, 4);

    // 魔法光环
    ctx.strokeStyle = `rgba(155,89,182,${0.3 + Math.sin(now * 0.005) * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, s / 2 + 6, 0, Math.PI * 2);
    ctx.stroke();

    // 飞行魔法粒子
    for (let i = 0; i < 4; i++) {
      const a = now * 0.004 + i * 1.57;
      const r = s / 2 + 4 + Math.sin(now * 0.006 + i) * 3;
      ctx.fillStyle = `rgba(155,89,182,${0.3 + Math.sin(now * 0.005 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- 重甲：全覆式装甲 + 履带 + 炮管 + 铆钉 ---
  _drawTank(ctx, s, flash, now, bob) {
    const c = flash ? '#fff' : this.color;
    const treadOffset = (now * 0.02) % 6;

    // 履带（两侧）
    ctx.fillStyle = flash ? '#999' : '#37474F';
    // 左履带
    ctx.beginPath();
    ctx.roundRect(-s / 2 - 3, -s / 2.5, s * 0.25, s * 0.85, 3);
    ctx.fill();
    // 右履带
    ctx.beginPath();
    ctx.roundRect(s / 2 - s * 0.25 + 3, -s / 2.5, s * 0.25, s * 0.85, 3);
    ctx.fill();

    // 履带纹理
    ctx.strokeStyle = flash ? '#777' : '#263238';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const ty = -s / 2.5 + 3 + i * (s * 0.85 / 5) + treadOffset % (s * 0.85 / 5);
      if (ty > -s / 2.5 && ty < s / 3) {
        ctx.beginPath(); ctx.moveTo(-s / 2 - 1, ty); ctx.lineTo(-s / 2 + 6, ty); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s / 2 - 1, ty); ctx.lineTo(s / 2 - 6, ty); ctx.stroke();
      }
    }

    // 车身（主体装甲）
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(-s / 3, -s / 3, s * 0.65, s * 0.7, 4);
    ctx.fill();

    // 装甲高光
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(-s / 3, -s / 3, s * 0.65, s * 0.35, 4);
    ctx.fill();

    // 炮塔
    ctx.fillStyle = flash ? '#ccc' : '#546E7A';
    ctx.beginPath();
    ctx.arc(0, 0, s / 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 炮管
    ctx.strokeStyle = flash ? '#aaa' : '#37474F';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s / 4, 0);
    ctx.lineTo(s / 2 + 8, 0);
    ctx.stroke();

    // 炮口
    ctx.fillStyle = flash ? '#ddd' : '#263238';
    ctx.beginPath();
    ctx.arc(s / 2 + 8, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // 铆钉
    ctx.fillStyle = flash ? '#bbb' : '#78909C';
    const rivets = [[-s/4, -s/5], [-s/4, s/5], [s/6, -s/5], [s/6, s/5], [0, -s/4], [0, s/4]];
    for (const [rx, ry] of rivets) {
      ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
    }

    // 前灯
    ctx.fillStyle = flash ? '#fff' : '#FFEB3B';
    ctx.shadowColor = '#FFEB3B';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(s / 3, -s / 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s / 3, s / 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // --- 萨满：法袍 + 法杖 + 治愈光环 + 漂浮 ---
  _drawPriest(ctx, s, flash, now, bob) {
    const c = flash ? '#fff' : this.color;
    const hover = Math.sin(now * 0.003) * 2;
    const pulse = Math.sin(now * 0.005) * 4;

    ctx.save();
    ctx.translate(0, hover);

    // 治愈光环（双层）
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.4)' : 'rgba(46,204,113,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.healRange / CELL_SIZE * s + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.15)' : 'rgba(46,204,113,0.12)';
    ctx.beginPath();
    ctx.arc(0, 0, this.healRange / CELL_SIZE * s + pulse + 6, 0, Math.PI * 2);
    ctx.stroke();

    // 法袍（梯形）
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-s / 2.5, s / 3);
    ctx.lineTo(-s / 4, -s / 4);
    ctx.quadraticCurveTo(0, -s / 3, s / 4, -s / 4);
    ctx.lineTo(s / 2.5, s / 3);
    ctx.closePath();
    ctx.fill();

    // 法袍纹饰
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.3)' : 'rgba(39,174,96,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-s / 5, 0);
    ctx.lineTo(0, s / 4);
    ctx.lineTo(s / 5, 0);
    ctx.stroke();

    // 头
    ctx.fillStyle = flash ? '#eee' : '#27ae60';
    ctx.beginPath(); ctx.arc(0, -s / 3 - 2, s / 4.5, 0, Math.PI * 2); ctx.fill();

    // 兜帽
    ctx.fillStyle = flash ? '#ddd' : '#1B5E20';
    ctx.beginPath();
    ctx.arc(0, -s / 3 - 4, s / 4, Math.PI + 0.3, -0.3);
    ctx.closePath();
    ctx.fill();

    // 法杖
    ctx.strokeStyle = flash ? '#ccc' : '#5D4037';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s / 3, -s / 4);
    ctx.lineTo(s / 3 + 2, s / 3 + 4);
    ctx.stroke();

    // 法杖宝石（发光）
    const gemGlow = 0.5 + Math.sin(now * 0.006) * 0.3;
    ctx.fillStyle = flash ? '#fff' : `rgba(46,204,113,${gemGlow})`;
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(s / 3, -s / 4 - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 十字标记
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.6)' : 'rgba(46,204,113,0.7)';
    ctx.fillRect(-1, -s / 3 - 8, 2, 7);
    ctx.fillRect(-3, -s / 3 - 5, 6, 2);

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2, -s / 3 - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -s / 3 - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-1.5, -s / 3 - 2, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -s / 3 - 2, 1, 0, Math.PI * 2); ctx.fill();

    // 治愈光点
    for (let i = 0; i < 3; i++) {
      const a = now * 0.003 + i * 2.1;
      const r = this.healRange / CELL_SIZE * s * 0.7;
      ctx.fillStyle = `rgba(46,204,113,${0.2 + Math.sin(now * 0.004 + i) * 0.15})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- 魔王：双角 + 恶魔翅膀 + 装甲 + 核心 + 威压 ---
  _drawDemon(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    const auraPulse = Math.sin(now * 0.003) * 8;
    const breathe = Math.sin(now * 0.004) * 2;

    // 威压光环（多层）
    for (let i = 3; i > 0; i--) {
      ctx.fillStyle = `rgba(192,57,43,${0.06 * i})`;
      ctx.beginPath();
      ctx.arc(0, 0, s / 2 + 12 + auraPulse + i * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 地面裂纹效果
    ctx.strokeStyle = `rgba(255,50,0,${0.15 + Math.sin(now * 0.005) * 0.1})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r1 = s / 2 + 5;
      const r2 = s / 2 + 15 + Math.sin(now * 0.003 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }

    // 恶魔翅膀
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.3)' : 'rgba(100,0,0,0.7)';
    // 左翼
    ctx.beginPath();
    ctx.moveTo(-s / 4, -s / 6);
    ctx.quadraticCurveTo(-s / 2 - 10, -s / 2 - 8, -s / 2 - 6, -s / 4);
    ctx.quadraticCurveTo(-s / 2 - 14, 0, -s / 2 - 4, s / 3);
    ctx.lineTo(-s / 4, s / 6);
    ctx.closePath();
    ctx.fill();
    // 右翼
    ctx.beginPath();
    ctx.moveTo(s / 4, -s / 6);
    ctx.quadraticCurveTo(s / 2 + 10, -s / 2 - 8, s / 2 + 6, -s / 4);
    ctx.quadraticCurveTo(s / 2 + 14, 0, s / 2 + 4, s / 3);
    ctx.lineTo(s / 4, s / 6);
    ctx.closePath();
    ctx.fill();

    // 翅膀骨骼
    ctx.strokeStyle = flash ? '#ddd' : '#880E0E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-s / 4, -s / 6);
    ctx.lineTo(-s / 2 - 8, -s / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s / 4, -s / 6);
    ctx.lineTo(s / 2 + 8, -s / 3);
    ctx.stroke();

    // 身体
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, breathe, s / 2, 0, Math.PI * 2);
    ctx.fill();

    // 装甲层（前后）
    ctx.fillStyle = flash ? '#ddd' : '#7F0000';
    ctx.beginPath();
    ctx.arc(0, breathe, s / 2, -0.7, 0.7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, breathe, s / 2, Math.PI - 0.7, Math.PI + 0.7);
    ctx.fill();

    // 装甲铆钉
    ctx.fillStyle = flash ? '#ccc' : '#B71C1C';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = s / 2 - 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r + breathe, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 双角（更大更弯曲）
    ctx.fillStyle = flash ? '#ccc' : '#4A0000';
    // 左角
    ctx.beginPath();
    ctx.moveTo(-6, -s / 2 + 4);
    ctx.quadraticCurveTo(-14, -s / 2 - 10, -10, -s / 2 - 16);
    ctx.lineTo(-2, -s / 2 + 2);
    ctx.closePath();
    ctx.fill();
    // 右角
    ctx.beginPath();
    ctx.moveTo(6, -s / 2 + 4);
    ctx.quadraticCurveTo(14, -s / 2 - 10, 10, -s / 2 - 16);
    ctx.lineTo(2, -s / 2 + 2);
    ctx.closePath();
    ctx.fill();

    // 核心（脉动发光）
    const coreGlow = 0.5 + Math.sin(now * 0.006) * 0.4;
    ctx.fillStyle = flash ? '#fff' : `rgba(255,30,30,${coreGlow})`;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, breathe, s / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 核心内环
    ctx.strokeStyle = `rgba(255,200,0,${coreGlow * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, breathe, s / 7, 0, Math.PI * 2);
    ctx.stroke();

    // 恶魔眼（发光红眼）
    ctx.fillStyle = flash ? '#fff' : '#FF0';
    ctx.shadowColor = '#FF0';
    ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(-5, -4 + breathe, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -4 + breathe, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // 竖瞳
    ctx.fillStyle = '#000';
    ctx.fillRect(-6, -6 + breathe, 2.5, 5);
    ctx.fillRect(4, -6 + breathe, 2.5, 5);

    // 嘴（怒吼）
    ctx.strokeStyle = flash ? '#fff' : '#FF0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 4 + breathe);
    ctx.quadraticCurveTo(0, 7 + breathe, 4, 4 + breathe);
    ctx.stroke();

    // 火焰粒子环绕
    for (let i = 0; i < 5; i++) {
      const a = now * 0.003 + i * 1.26;
      const r = s / 2 + 8 + Math.sin(now * 0.005 + i * 2) * 4;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r + breathe;
      const fireAlpha = 0.3 + Math.sin(now * 0.008 + i) * 0.2;
      ctx.fillStyle = `rgba(255,${80 + i * 30},0,${fireAlpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.sin(now * 0.01 + i) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
