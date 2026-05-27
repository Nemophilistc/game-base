// effects.js - 视觉特效（连击火焰、判定闪光、背景脉冲）
import { CONFIG } from './config.js';

// 粒子
class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 150 * dt; // 重力
    this.life -= dt * 1000;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// 闪光
class Flash {
  constructor(x, y, color, radius) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius;
    this.maxRadius = radius;
    this.life = CONFIG.FLASH_DURATION;
    this.maxLife = CONFIG.FLASH_DURATION;
  }

  update(dt) {
    this.life -= dt * 1000;
    this.radius = this.maxRadius * (this.life / this.maxLife);
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    const grad = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    grad.addColorStop(0, this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
    grad.addColorStop(1, this.color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class EffectsManager {
  constructor() {
    this.particles = [];
    this.flashes = [];
    this.comboTexts = []; // { text, x, y, color, life, maxLife, scale }
    this.bgPulse = 0;     // 背景脉冲强度 0-1
    this.comboFire = 0;   // 连击火焰强度 0-1
    this.beatPulse = 0;   // 节拍脉冲
    this.screenShake = 0;
  }

  update(dt) {
    // 更新粒子
    for (const p of this.particles) {
      p.update(dt);
    }
    this.particles = this.particles.filter(p => p.alive);

    // 更新闪光
    for (const f of this.flashes) {
      if (!f.update(dt)) {
        this.flashes.splice(this.flashes.indexOf(f), 1);
      }
    }

    // 更新连击文字
    for (const t of this.comboTexts) {
      t.life -= dt * 1000;
      t.scale += dt * 0.5;
    }
    this.comboTexts = this.comboTexts.filter(t => t.life > 0);

    // 衰减背景脉冲
    this.bgPulse *= 0.95;
    this.comboFire *= 0.97;
    this.beatPulse *= 0.9;
    this.screenShake *= 0.85;
  }

  // 判定闪光特效
  spawnJudgeFlash(x, y, judgeType) {
    const color = CONFIG.JUDGE_COLORS[judgeType];
    const radius = judgeType === 'PERFECT' ? 80 : judgeType === 'GREAT' ? 60 : 40;
    this.flashes.push(new Flash(x, y, color, radius));

    // 粒子爆发
    const count = judgeType === 'PERFECT' ? 20 : judgeType === 'GREAT' ? 12 : 6;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = 100 + Math.random() * 200;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 50;
      const size = 2 + Math.random() * 3;
      this.particles.push(new Particle(
        x, y, vx, vy, color,
        CONFIG.PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5),
        size
      ));
    }

    // 背景脉冲
    if (judgeType === 'PERFECT') {
      this.bgPulse = 1;
      this.screenShake = 5;
    } else if (judgeType === 'GREAT') {
      this.bgPulse = 0.6;
      this.screenShake = 3;
    }
  }

  // Perfect炫彩文字
  spawnPerfectText(x, y) {
    this.comboTexts.push({
      text: '✦ PERFECT ✦',
      x: x,
      y: y - 40,
      color: CONFIG.JUDGE_COLORS.PERFECT,
      life: CONFIG.JUDGE_TEXT_DURATION,
      maxLife: CONFIG.JUDGE_TEXT_DURATION,
      scale: 1,
    });
  }

  // 连击特效
  spawnComboEffect(combo, centerX, judgmentY) {
    if (combo <= 0) return;

    // 每10连击显示大特效
    if (combo % 10 === 0 && combo > 0) {
      this.comboTexts.push({
        text: `${combo} COMBO!`,
        x: centerX,
        y: judgmentY - 100,
        color: this._getComboColor(combo),
        life: CONFIG.COMBO_TEXT_DURATION,
        maxLife: CONFIG.COMBO_TEXT_DURATION,
        scale: 1,
      });

      // 连击火焰
      this.comboFire = Math.min(1, combo / 50);

      // 大量粒子
      for (let i = 0; i < 30; i++) {
        const x = centerX + (Math.random() - 0.5) * 300;
        const y = judgmentY;
        const vx = (Math.random() - 0.5) * 100;
        const vy = -200 - Math.random() * 300;
        this.particles.push(new Particle(
          x, y, vx, vy,
          this._getComboColor(combo),
          1200,
          3 + Math.random() * 4
        ));
      }
    }
  }

  // 节拍脉冲（由BGM驱动）
  triggerBeatPulse() {
    this.beatPulse = 1;
  }

  _getComboColor(combo) {
    if (combo >= 100) return '#ff44ff';
    if (combo >= 50) return '#ffaa44';
    if (combo >= 30) return '#ffdd44';
    if (combo >= 10) return '#44ffaa';
    return '#ffffff';
  }

  drawBackground(ctx, w, h) {
    // 背景色随脉冲变化
    const pulse = this.bgPulse;
    if (pulse > 0.01) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      const alpha = pulse * 0.15;
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 连击火焰
    if (this.comboFire > 0.01) {
      // 底部火焰
      const flameH = h * 0.3 * this.comboFire;
      const grad = ctx.createLinearGradient(0, h, 0, h - flameH);
      grad.addColorStop(0, `rgba(255, 100, 20, ${this.comboFire * 0.3})`);
      grad.addColorStop(0.5, `rgba(255, 200, 50, ${this.comboFire * 0.15})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, h - flameH, w, flameH);
    }

    // 节拍脉冲边框
    if (this.beatPulse > 0.01) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.beatPulse * 0.3})`;
      ctx.lineWidth = 4 * this.beatPulse;
      ctx.strokeRect(0, 0, w, h);
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }

  drawFlashes(ctx) {
    for (const f of this.flashes) {
      f.draw(ctx);
    }
  }

  drawComboTexts(ctx) {
    for (const t of this.comboTexts) {
      const alpha = t.life / t.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${24 * t.scale}px "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 15;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  getScreenShake() {
    if (this.screenShake < 0.5) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShake * 2,
      y: (Math.random() - 0.5) * this.screenShake * 2,
    };
  }
}
