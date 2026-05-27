// Visual effects: particles, break effects, spring effects
import { CONFIG } from './config.js';

export class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size || 3;
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // gravity
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    const sy = this.y - cameraY;
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, sy, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class EffectsManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = []; // { x, y, text, color, life, maxLife }
  }

  init() {
    this.particles = [];
    this.floatingTexts = [];
  }

  // Jump dust effect
  emitJumpDust(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 1.2;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1,
        '#c8b98a',
        15 + Math.random() * 10,
        2 + Math.random() * 2
      ));
    }
  }

  // Spring bounce effect
  emitSpringBounce(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 3 + Math.random() * 4;
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 15,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() < 0.5 ? '#f0ad4e' : '#ff6',
        20 + Math.random() * 15,
        3 + Math.random() * 3
      ));
    }
    // Stars
    for (let i = 0; i < 5; i++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y - 5,
        (Math.random() - 0.5) * 3,
        -3 - Math.random() * 3,
        '#fff',
        25 + Math.random() * 10,
        4
      ));
    }
  }

  // Platform break effect
  emitPlatformBreak(x, y, w) {
    for (let i = 0; i < 15; i++) {
      this.particles.push(new Particle(
        x + Math.random() * w,
        y + Math.random() * 8,
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        Math.random() < 0.5 ? CONFIG.COLORS.PLATFORM_FRAGILE : CONFIG.COLORS.PLATFORM_FRAGILE_DARK,
        25 + Math.random() * 15,
        3 + Math.random() * 4
      ));
    }
  }

  // Jetpack flame particles
  emitJetpackFlame(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 10,
        y + 30,
        (Math.random() - 0.5) * 2,
        2 + Math.random() * 3,
        Math.random() < 0.3 ? '#fff' : (Math.random() < 0.5 ? '#ff6' : CONFIG.COLORS.JETPACK_FLAME),
        12 + Math.random() * 8,
        4 + Math.random() * 4
      ));
    }
  }

  // Coin collect effect
  emitCoinCollect(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * 3,
        Math.sin(angle) * 3,
        '#f1c40f',
        15 + Math.random() * 10,
        2 + Math.random() * 2
      ));
    }
    this.addFloatingText(x, y - 10, '+10', '#f1c40f');
  }

  // Enemy die effect
  emitEnemyDie(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() < 0.5 ? CONFIG.COLORS.ENEMY : CONFIG.COLORS.ENEMY_DARK,
        20 + Math.random() * 10,
        3 + Math.random() * 3
      ));
    }
    this.addFloatingText(x, y - 15, '+50', '#e74c3c');
  }

  // Shoot effect
  emitShoot(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push(new Particle(
        x, y,
        (Math.random() - 0.5) * 2,
        -1 - Math.random() * 2,
        '#ff6',
        8 + Math.random() * 5,
        2
      ));
    }
  }

  // Spike hit effect
  emitSpikeHit(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        CONFIG.COLORS.PLATFORM_SPIKE,
        15 + Math.random() * 10,
        3
      ));
    }
    this.addFloatingText(x, y - 20, '-1 HP', '#e74c3c');
  }

  // Propeller wind effect
  emitPropellerWind(x, y) {
    if (Math.random() < 0.3) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y + 20,
        (Math.random() - 0.5) * 1,
        1 + Math.random() * 2,
        'rgba(255,255,255,0.4)',
        10 + Math.random() * 8,
        2 + Math.random() * 2
      ));
    }
  }

  // Floating text
  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, life: 40, maxLife: 40 });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (!this.particles[i].alive) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.life--;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Cap particles
    if (this.particles.length > 300) {
      this.particles.splice(0, this.particles.length - 300);
    }
  }

  draw(ctx, cameraY) {
    for (const p of this.particles) {
      p.draw(ctx, cameraY);
    }

    for (const ft of this.floatingTexts) {
      const sy = ft.y - cameraY;
      const alpha = ft.life / ft.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, sy);
      ctx.fillText(ft.text, ft.x, sy);
      ctx.globalAlpha = 1;
    }
  }
}
