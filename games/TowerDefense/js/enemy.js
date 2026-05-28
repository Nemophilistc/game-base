// ==================== 敌人系统 ====================

import { CELL_SIZE, ENEMY_TYPES } from './config.js';
import { pathPixels } from './map.js';

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

    // 状态效果
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.burnTimer = 0;
    this.burnDamage = 0;
    this.burnTickTimer = 0;

    // 可视化
    this.hitFlash = 0;
    this.deathTimer = 0;
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
        this.burnTickTimer = 0.5; // 每0.5秒一次DOT
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
      }
    }

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
    // 取更强的减速
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
    // 治疗自身
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
    if (!this.alive && this.deathTimer < 0.3) {
      const alpha = 1 - this.deathTimer / 0.3;
      ctx.globalAlpha = alpha;
      const scale = 1 + this.deathTimer * 3;
      ctx.scale(scale, scale);
    } else if (!this.alive) {
      ctx.restore();
      return;
    }

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, s / 2 + 2, s / 2, s / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const flash = this.hitFlash > 0;

    // 按类型绘制不同外观
    switch (this.type) {
      case 'normal': this._drawSoldier(ctx, s, flash, now); break;
      case 'fast': this._drawRunner(ctx, s, flash, now); break;
      case 'flying': this._drawFairy(ctx, s, flash, now); break;
      case 'armored': this._drawTank(ctx, s, flash, now); break;
      case 'healer': this._drawPriest(ctx, s, flash, now); break;
      case 'boss': this._drawDemon(ctx, s, flash, now); break;
      default:
        ctx.fillStyle = flash ? '#fff' : this.color;
        ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill();
    }

    // 减速效果
    if (this.slowTimer > 0) {
      ctx.strokeStyle = 'rgba(0,191,255,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = (now * 0.003 + i * 2.1) % (Math.PI * 2);
        const r = s / 2 + 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 灼烧效果
    if (this.burnTimer > 0) {
      for (let i = 0; i < 3; i++) {
        const fx = (Math.random() - 0.5) * s * 0.8;
        const fy = -s / 3 + (Math.random() - 0.5) * s * 0.5;
        ctx.fillStyle = `rgba(255,${80 + Math.random() * 120},0,${0.4 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // 血条
    if (this.alive && this.hp < this.maxHp) {
      const barW = s * 1.2;
      const barH = 4;
      const barX = this.x - barW / 2;
      const barY = this.y - s / 2 - 10;
      const hpRatio = this.hp / this.maxHp;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }
  }

  // --- 普通：小兵（盾牌+头盔） ---
  _drawSoldier(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    // 身体
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 2, s / 2, 0, Math.PI * 2);
    ctx.fill();
    // 头盔
    ctx.fillStyle = flash ? '#eee' : '#c0392b';
    ctx.beginPath();
    ctx.arc(0, -3, s / 2.5, Math.PI, 0);
    ctx.fill();
    // 盾牌
    ctx.fillStyle = flash ? '#ddd' : '#7f8c8d';
    ctx.beginPath();
    ctx.ellipse(-s / 2 - 2, 2, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-3, -1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-2, -1, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -1, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // --- 快速：冲刺者（流线型+速度线） ---
  _drawRunner(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    // 身体（椭圆流线型）
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, s / 2.5, s / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // 尖角头饰
    ctx.fillStyle = flash ? '#eee' : '#e67e22';
    ctx.beginPath();
    ctx.moveTo(s / 2, 0);
    ctx.lineTo(s / 2 + 5, -3);
    ctx.lineTo(s / 2 + 5, 3);
    ctx.closePath();
    ctx.fill();
    // 速度线
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.4)' : 'rgba(243,156,18,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const lx = -s / 2 - 4 - i * 4;
      const ly = -3 + i * 3;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 6, ly); ctx.stroke();
    }
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(2, -2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(3, -2, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, 2, 1, 0, Math.PI * 2); ctx.fill();
  }

  // --- 飞行：精灵（翅膀+光环） ---
  _drawFairy(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    const wingFlap = Math.sin(now * 0.008) * 8;
    // 翅膀
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.4)' : 'rgba(155,89,182,0.5)';
    ctx.beginPath();
    ctx.ellipse(-s / 2 - 2, -2 + wingFlap, 5, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s / 2 + 2, -2 - wingFlap, 5, 9, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // 光环
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.5)' : 'rgba(155,89,182,0.4)';
    ctx.lineWidth = 1.5;
    const haloPulse = Math.sin(now * 0.005) * 2;
    ctx.beginPath();
    ctx.arc(0, -s / 2 - 4 + haloPulse, 4, 0, Math.PI * 2);
    ctx.stroke();
    // 身体
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, s / 2.5, 0, Math.PI * 2);
    ctx.fill();
    // 魔法光点
    for (let i = 0; i < 3; i++) {
      const a = now * 0.004 + i * 2.1;
      const r = s / 2 + 5;
      ctx.fillStyle = `rgba(155,89,182,${0.3 + Math.sin(now * 0.005 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2, -1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-1.5, -1, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -1, 1, 0, Math.PI * 2); ctx.fill();
  }

  // --- 装甲：坦克（履带+炮塔+铆钉） ---
  _drawTank(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    // 履带
    ctx.fillStyle = flash ? '#bbb' : '#555';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-s / 2 - 2, -s / 3, s + 4, s * 0.7, 4);
    else ctx.rect(-s / 2 - 2, -s / 3, s + 4, s * 0.7);
    ctx.fill();
    // 履带纹理
    ctx.strokeStyle = flash ? '#999' : '#444';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const ty = -s / 3 + 3 + i * (s * 0.7 / 4);
      ctx.beginPath(); ctx.moveTo(-s / 2, ty); ctx.lineTo(-s / 2 + 6, ty); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s / 2 - 6, ty); ctx.lineTo(s / 2, ty); ctx.stroke();
    }
    // 车身
    ctx.fillStyle = c;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-s / 3, -s / 4, s * 0.65, s * 0.5, 3);
    else ctx.rect(-s / 3, -s / 4, s * 0.65, s * 0.5);
    ctx.fill();
    // 炮塔
    ctx.fillStyle = flash ? '#ddd' : '#666';
    ctx.beginPath();
    ctx.arc(0, 0, s / 4, 0, Math.PI * 2);
    ctx.fill();
    // 炮管
    ctx.strokeStyle = flash ? '#aaa' : '#444';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s / 2 + 4, 0); ctx.stroke();
    // 铆钉
    ctx.fillStyle = flash ? '#ccc' : '#888';
    const rivets = [[-s/4, -s/5], [-s/4, s/5], [s/6, -s/5], [s/6, s/5]];
    for (const [rx, ry] of rivets) {
      ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // --- 治疗：牧师（法杖+治愈光环） ---
  _drawPriest(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    // 治愈光环
    const pulse = Math.sin(now * 0.005) * 4;
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.4)' : 'rgba(46,204,113,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.healRange / CELL_SIZE * s + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = flash ? 'rgba(255,255,255,0.2)' : 'rgba(46,204,113,0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, this.healRange / CELL_SIZE * s + pulse + 4, 0, Math.PI * 2);
    ctx.stroke();
    // 长袍身体
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-s / 3, s / 3);
    ctx.lineTo(-s / 4, -s / 3);
    ctx.lineTo(s / 4, -s / 3);
    ctx.lineTo(s / 3, s / 3);
    ctx.closePath();
    ctx.fill();
    // 头
    ctx.fillStyle = flash ? '#eee' : '#27ae60';
    ctx.beginPath(); ctx.arc(0, -s / 3 - 2, s / 5, 0, Math.PI * 2); ctx.fill();
    // 法杖
    ctx.strokeStyle = flash ? '#ccc' : '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s / 4, -s / 4); ctx.lineTo(s / 4 + 2, s / 3 + 3); ctx.stroke();
    // 法杖宝石
    ctx.fillStyle = flash ? '#fff' : '#2ecc71';
    ctx.beginPath(); ctx.arc(s / 4, -s / 4 - 3, 3, 0, Math.PI * 2); ctx.fill();
    // 十字标记
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.6)' : 'rgba(46,204,113,0.6)';
    ctx.fillRect(-1, -s / 3 - 6, 2, 6);
    ctx.fillRect(-3, -s / 3 - 4, 6, 2);
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2, -s / 3 - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -s / 3 - 2, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // --- Boss：恶魔（双角+翅膀+核心+威压光环） ---
  _drawDemon(ctx, s, flash, now) {
    const c = flash ? '#fff' : this.color;
    // 威压光环
    const auraPulse = Math.sin(now * 0.003) * 6;
    ctx.fillStyle = 'rgba(192,57,43,0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, s / 2 + 10 + auraPulse, 0, Math.PI * 2);
    ctx.fill();
    // 翅膀
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.3)' : 'rgba(139,0,0,0.6)';
    ctx.beginPath();
    ctx.moveTo(-s / 3, 0);
    ctx.quadraticCurveTo(-s / 2 - 8, -s / 2 - 5, -s / 2 - 4, s / 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s / 3, 0);
    ctx.quadraticCurveTo(s / 2 + 8, -s / 2 - 5, s / 2 + 4, s / 4);
    ctx.closePath();
    ctx.fill();
    // 身体
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.fill();
    // 装甲层
    ctx.fillStyle = flash ? '#ddd' : '#922';
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, -0.8, 0.8);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, Math.PI - 0.8, Math.PI + 0.8);
    ctx.fill();
    // 双角
    ctx.fillStyle = flash ? '#ccc' : '#8B0000';
    ctx.beginPath();
    ctx.moveTo(-5, -s / 2 + 2);
    ctx.lineTo(-10, -s / 2 - 12);
    ctx.lineTo(-1, -s / 2 - 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -s / 2 + 2);
    ctx.lineTo(10, -s / 2 - 12);
    ctx.lineTo(1, -s / 2 - 3);
    ctx.closePath();
    ctx.fill();
    // 核心（发光）
    const coreGlow = Math.sin(now * 0.006) * 0.3 + 0.7;
    ctx.fillStyle = flash ? '#fff' : `rgba(255,50,50,${coreGlow})`;
    ctx.beginPath();
    ctx.arc(0, 0, s / 5, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛（恶魔红眼）
    ctx.fillStyle = flash ? '#fff' : '#ff0';
    ctx.beginPath(); ctx.arc(-4, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-3, -3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -3, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}
