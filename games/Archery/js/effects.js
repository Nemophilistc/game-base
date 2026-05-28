// effects.js - Visual effects: arrow trail, hit effects, bullseye celebration
import { CONFIG } from './config.js';

export class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05; // tiny gravity
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class EffectsManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.screenShakeX = 0;
    this.screenShakeY = 0;
    this.bullseyeFlash = 0;
    this.windParticles = [];
    this.celebrationParticles = [];
  }

  update() {
    // Update particles
    for (const p of this.particles) {
      p.update();
    }
    this.particles = this.particles.filter(p => p.alive);

    // Hard cap to prevent runaway particle accumulation
    if (this.particles.length > 100) {
      this.particles = this.particles.slice(-100);
    }
    if (this.celebrationParticles.length > 50) {
      this.celebrationParticles = this.celebrationParticles.slice(-50);
    }

    // Update floating texts
    for (const ft of this.floatingTexts) {
      ft.y -= 1.5;
      ft.life--;
      ft.alpha = ft.life / ft.maxLife;
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    // Cap floating texts
    if (this.floatingTexts.length > 8) {
      this.floatingTexts = this.floatingTexts.slice(-8);
    }

    // Update screen shake
    if (this.screenShake > 0) {
      this.screenShakeX = (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShakeY = (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) {
        this.screenShake = 0;
        this.screenShakeX = 0;
        this.screenShakeY = 0;
      }
    }

    // Update bullseye flash
    if (this.bullseyeFlash > 0) {
      this.bullseyeFlash -= 0.05;
    }

    // Update wind particles
    this._updateWindParticles();

    // Update celebration particles
    for (const p of this.celebrationParticles) {
      p.update();
      p.vy += 0.02; // lighter gravity for celebration
    }
    this.celebrationParticles = this.celebrationParticles.filter(p => p.alive);
  }

  // Hit effect - sparks at impact point
  spawnHitEffect(x, y, zone) {
    const colors = zone === 0
      ? ['#FFD700', '#FFA500', '#FFFF00', '#fff']
      : ['#FF4444', '#FF8844', '#FFAA44', '#fff'];

    const count = zone === 0 ? 10 : 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2 + Math.random() * 2,
        20 + Math.random() * 20
      ));
    }

    if (zone === 0) {
      this.bullseyeFlash = 0.5;
      this.screenShake = 4;
    } else {
      this.screenShake = 2;
    }
  }

  // Balloon pop effect
  spawnBalloonPop(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2 + Math.random() * 3,
        15 + Math.random() * 15
      ));
    }
    // Confetti
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 2,
        ['#FF4488', '#FFDD44', '#44DDFF', '#DD44FF', '#44FF44'][Math.floor(Math.random() * 5)],
        2 + Math.random() * 2,
        30 + Math.random() * 20
      ));
    }
    this.screenShake = 3;
  }

  // Apple hit effect
  spawnAppleHit(x, y) {
    // Red juice particles
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#CC0000',
        2 + Math.random() * 2,
        20 + Math.random() * 15
      ));
    }
    this.screenShake = 3;
  }

  // Bullseye celebration (big)
  spawnBullseyeCelebration(x, y) {
    // Ring of golden particles
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      const speed = 2 + Math.random() * 2;
      this.celebrationParticles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'][Math.floor(Math.random() * 4)],
        2 + Math.random() * 3,
        35 + Math.random() * 20
      ));
    }

    // Star burst
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      for (let j = 1; j <= 2; j++) {
        const speed = j * 3;
        this.celebrationParticles.push(new Particle(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          '#FFD700',
          3,
          25 + j * 10
        ));
      }
    }

    this.bullseyeFlash = 0.5;
    this.screenShake = 5;
  }

  // Floating score text
  spawnScoreText(x, y, text, color = '#FFD700', size = 24) {
    this.floatingTexts.push({
      x, y,
      text,
      color,
      size,
      life: 45,
      maxLife: 45,
      alpha: 1
    });
  }

  // Combo text
  spawnComboText(x, y, combo) {
    const colors = ['#FF44FF', '#FF44FF', '#FF88FF', '#FFAAFF', '#FFFFFF'];
    const color = colors[Math.min(combo - 1, colors.length - 1)];
    this.floatingTexts.push({
      x, y: y - 30,
      text: `${combo}连击! x${CONFIG.COMBO_MULTIPLIERS[Math.min(combo - 1, CONFIG.COMBO_MULTIPLIERS.length - 1)]}`,
      color,
      size: 28 + Math.min(combo, 5) * 2,
      life: 50,
      maxLife: 50,
      alpha: 1
    });
  }

  // Wind particles (ambient)
  _updateWindParticles() {
    // Spawn new wind particles occasionally
    if (Math.random() < 0.03) {
      this.windParticles.push({
        x: Math.random() > 0.5 ? -10 : CONFIG.CANVAS_WIDTH + 10,
        y: Math.random() * CONFIG.CANVAS_HEIGHT * 0.8,
        size: 1 + Math.random() * 2,
        life: 60 + Math.random() * 60,
        maxLife: 120,
        alpha: 0.2 + Math.random() * 0.3
      });
    }

    for (const p of this.windParticles) {
      p.x += p.life > p.maxLife / 2 ? 1 : -1;
      p.y += Math.sin(p.x / 30) * 0.3;
      p.life--;
    }
    this.windParticles = this.windParticles.filter(p => p.life > 0);

    // Cap wind particles
    if (this.windParticles.length > 30) {
      this.windParticles = this.windParticles.slice(-30);
    }
  }

  updateWindParticlesWithWind(wind) {
    for (const p of this.windParticles) {
      p.x += wind.x * 0.5;
      p.y += wind.y * 0.1 + Math.sin(p.x / 40) * 0.2;
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
    for (const p of this.celebrationParticles) {
      p.draw(ctx);
    }
  }

  drawWindParticles(ctx) {
    ctx.save();
    for (const p of this.windParticles) {
      const alpha = (p.life / p.maxLife) * p.alpha;
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFloatingTexts(ctx) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  drawBullseyeFlash(ctx) {
    if (this.bullseyeFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this.bullseyeFlash * 0.3;
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  drawMissEffect(ctx) {
    // Red flash for miss
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.bullseyeFlash = 0;
    this.windParticles = [];
    this.celebrationParticles = [];
  }
}
