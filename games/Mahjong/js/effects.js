// effects.js - Visual effects: match particles, path animation, shuffle

export class EffectManager {
  constructor() {
    this.particles = [];
    this.pathLines = [];
    this.floatingTexts = [];
    this.shakeAmount = 0;
    this.shuffleAnim = null; // { tiles, startTime, duration }
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // gravity
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= 0.98;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update path lines
    for (let i = this.pathLines.length - 1; i >= 0; i--) {
      const l = this.pathLines[i];
      l.life -= dt;
      l.alpha = Math.max(0, l.life / l.maxLife);
      if (l.life <= 0) this.pathLines.splice(i, 1);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 60 * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Shake decay
    if (this.shakeAmount > 0) this.shakeAmount *= 0.9;
    if (this.shakeAmount < 0.5) this.shakeAmount = 0;
  }

  emitMatchParticles(x, y, color) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        alpha: 1
      });
    }
  }

  showPath(points, tileW, tileH, offsetX, offsetY) {
    if (!points || points.length < 2) return;
    const screenPoints = points.map(p => ({
      x: offsetX + p.c * tileW + tileW / 2,
      y: offsetY + p.r * tileH + tileH / 2
    }));
    this.pathLines.push({
      points: screenPoints,
      life: 0.6,
      maxLife: 0.6,
      alpha: 1,
      width: 3
    });
  }

  addFloatingText(x, y, text, color = '#f5c842', size = 20) {
    this.floatingTexts.push({
      x, y, text, color, size,
      life: 1.2,
      maxLife: 1.2,
      alpha: 1
    });
  }

  triggerShake(amount = 5) {
    this.shakeAmount = amount;
  }

  startShuffleAnim() {
    this.shuffleAnim = { startTime: performance.now(), duration: 400 };
  }

  getShuffleOffset() {
    if (!this.shuffleAnim) return 0;
    const elapsed = performance.now() - this.shuffleAnim.startTime;
    if (elapsed >= this.shuffleAnim.duration) {
      this.shuffleAnim = null;
      return 0;
    }
    const t = elapsed / this.shuffleAnim.duration;
    return Math.sin(t * Math.PI * 4) * 6 * (1 - t);
  }

  draw(ctx) {
    // Draw path lines
    for (const l of this.pathLines) {
      ctx.save();
      ctx.globalAlpha = l.alpha;
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = l.width;
      ctx.shadowColor = '#f5c842';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(l.points[0].x, l.points[0].y);
      for (let i = 1; i < l.points.length; i++) {
        ctx.lineTo(l.points[i].x, l.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
