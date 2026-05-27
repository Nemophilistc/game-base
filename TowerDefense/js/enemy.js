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

    // 受击闪烁
    const drawColor = this.hitFlash > 0 ? '#fff' : this.color;

    // 飞行单位有翅膀
    if (this.flying) {
      const wingFlap = Math.sin(Date.now() * 0.01) * 5;
      ctx.fillStyle = 'rgba(155,89,182,0.5)';
      ctx.beginPath();
      ctx.ellipse(-s / 2 - 3, -2 + wingFlap, 6, 10, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s / 2 + 3, -2 - wingFlap, 6, 10, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 身体
    ctx.fillStyle = drawColor;
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.fill();

    // 坦克/装甲特殊外观
    if (this.type === 'armored') {
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, s / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Boss特殊外观
    if (this.type === 'boss') {
      // 角
      ctx.fillStyle = '#8B0000';
      ctx.beginPath();
      ctx.moveTo(-6, -s / 2);
      ctx.lineTo(-12, -s / 2 - 10);
      ctx.lineTo(0, -s / 2 - 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -s / 2);
      ctx.lineTo(12, -s / 2 - 10);
      ctx.lineTo(0, -s / 2 - 2);
      ctx.closePath();
      ctx.fill();
    }

    // 治疗单位光环
    if (this.type === 'healer') {
      ctx.strokeStyle = 'rgba(46,204,113,0.4)';
      ctx.lineWidth = 2;
      const pulse = Math.sin(Date.now() * 0.005) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.healRange / CELL_SIZE * CELL_SIZE / 2 + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -3, 3, 0, Math.PI * 2);
    ctx.arc(4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-3, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(5, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 减速效果
    if (this.slowTimer > 0) {
      ctx.fillStyle = 'rgba(0,191,255,0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, s / 2 + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 灼烧效果
    if (this.burnTimer > 0) {
      ctx.fillStyle = 'rgba(255,69,0,0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, s / 2 + 4, 0, Math.PI * 2);
      ctx.fill();
      // 火焰粒子
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = `rgba(255,${100 + Math.random() * 100},0,${0.3 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(
          (Math.random() - 0.5) * s,
          (Math.random() - 0.5) * s - s / 3,
          2 + Math.random() * 2, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.restore();

    // 血条
    if (this.alive && this.hp < this.maxHp) {
      const barW = s;
      const barH = 4;
      const barX = this.x - barW / 2;
      const barY = this.y - s / 2 - 8;
      const hpRatio = this.hp / this.maxHp;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }
  }
}
