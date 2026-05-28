import { COLORS } from './config.js';

export class EffectManager {
  constructor() {
    this.particles = [];
    this.texts = [];
  }
  addComplete(x, y, colorIdx) {
    const color = COLORS[colorIdx];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.02 + Math.random() * 0.02, size: 3 + Math.random() * 4,
        color
      });
    }
  }
  addScore(x, y, text, color = '#fff') {
    this.texts.push({ x, y, text, color, life: 1, vy: -1.5 });
  }
  update() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= p.decay;
      return p.life > 0;
    });
    this.texts = this.texts.filter(t => {
      t.y += t.vy; t.life -= 0.02;
      return t.life > 0;
    });
  }
  draw(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    this.texts.forEach(t => {
      ctx.globalAlpha = t.life;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
  }
}
