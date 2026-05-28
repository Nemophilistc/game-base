// bow.js - Bow aiming, power, arrow physics
import { CONFIG } from './config.js';

export class Arrow {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.rotation = Math.atan2(vy, vx);
    this.alive = true;
    this.stuck = false;
    this.stuckTime = 0;
    this.stuckTarget = null;
    this.stuckOffsetX = 0;
    this.stuckOffsetY = 0;
    this.stuckZone = -1;
    this.trail = [];
    this.fadeAlpha = 1;
    this.missed = false;
    this.hitGroundY = 0;
  }

  update(dt, wind) {
    if (this.stuck) {
      this.stuckTime += dt;
      if (this.stuckTime > CONFIG.ARROW_STICK_TIME) {
        this.fadeAlpha -= 0.02;
        if (this.fadeAlpha <= 0) this.alive = false;
      }
      // If stuck to a moving target, follow it
      if (this.stuckTarget && this.stuckTarget.alive) {
        this.x = this.stuckTarget.x + this.stuckOffsetX;
        this.y = this.stuckTarget.y + this.stuckOffsetY;
      }
      return;
    }

    if (!this.alive) return;

    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 15) this.trail.shift();

    // Apply wind
    this.vx += wind.x * 0.02;
    this.vy += wind.y * 0.005;

    // Apply gravity
    this.vy += CONFIG.ARROW_GRAVITY;

    // Move
    this.x += this.vx;
    this.y += this.vy;

    // Update rotation to follow velocity
    this.rotation = Math.atan2(this.vy, this.vx);

    // Check ground
    if (this.y > CONFIG.CANVAS_HEIGHT - 60) {
      this.missed = true;
      this.hitGroundY = CONFIG.CANVAS_HEIGHT - 60;
      this.y = this.hitGroundY;
      this.stuck = true;
      this.alive = true;
    }

    // Check out of bounds
    if (this.x > CONFIG.CANVAS_WIDTH + 50 || this.x < -50 || this.y < -100) {
      this.missed = true;
      this.alive = false;
    }
  }

  draw(ctx) {
    if (!this.alive && !this.stuck) return;

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    // Draw trail
    if (this.trail.length > 1 && !this.stuck) {
      for (let i = 1; i < this.trail.length; i++) {
        const alpha = i / this.trail.length * 0.4;
        ctx.strokeStyle = `rgba(255, 220, 150, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.stroke();
      }
    }

    // Draw arrow
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const len = CONFIG.ARROW_LENGTH;

    // Shaft
    ctx.strokeStyle = CONFIG.COLOR_ARROW_SHAFT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(len / 2, 0);
    ctx.stroke();

    // Tip (triangle)
    ctx.fillStyle = CONFIG.COLOR_ARROW_TIP;
    ctx.beginPath();
    ctx.moveTo(len / 2 + 8, 0);
    ctx.lineTo(len / 2 - 4, -4);
    ctx.lineTo(len / 2 - 4, 4);
    ctx.closePath();
    ctx.fill();

    // Feathers (fletching)
    ctx.fillStyle = CONFIG.COLOR_ARROW_FEATHER;
    // Top feather
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(-len / 2 - 12, -8);
    ctx.lineTo(-len / 2 + 5, 0);
    ctx.closePath();
    ctx.fill();
    // Bottom feather
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(-len / 2 - 12, 8);
    ctx.lineTo(-len / 2 + 5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export class Bow {
  constructor() {
    this.x = CONFIG.BOW_X;
    this.y = CONFIG.BOW_Y;
    this.aiming = false;
    this.pullBack = 0; // 0 to 1
    this.aimAngle = -Math.PI / 4; // default aim angle
    this.maxPull = 80;
    this.arrows = [];
    this.canShoot = true;
    this.drawSoundPlaying = false;
  }

  startAim(mouseX, mouseY) {
    this.aiming = true;
    this.pullBack = 0;
    this.updateAim(mouseX, mouseY);
  }

  updateAim(mouseX, mouseY) {
    if (!this.aiming) return;

    // Calculate pull back based on distance from bow
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.pullBack = Math.min(1, dist / this.maxPull);
    this.aimAngle = Math.atan2(dy, dx);
  }

  release(mouseX, mouseY, wind, sound) {
    if (!this.aiming || this.pullBack < 0.05) {
      this.aiming = false;
      return null;
    }

    this.updateAim(mouseX, mouseY);

    const power = CONFIG.ARROW_MIN_POWER + this.pullBack * (CONFIG.ARROW_MAX_POWER - CONFIG.ARROW_MIN_POWER);
    const angle = this.aimAngle;

    const arrow = new Arrow(
      this.x + Math.cos(angle) * 40,
      this.y + Math.sin(angle) * 40,
      Math.cos(angle) * power,
      Math.sin(angle) * power
    );

    this.arrows.push(arrow);
    this.aiming = false;
    this.pullBack = 0;

    if (sound) sound.playRelease();

    return arrow;
  }

  getTrajectoryPreview(wind) {
    if (!this.aiming || this.pullBack < 0.05) return [];

    const power = CONFIG.ARROW_MIN_POWER + this.pullBack * (CONFIG.ARROW_MAX_POWER - CONFIG.ARROW_MIN_POWER);
    const angle = this.aimAngle;
    const points = [];

    let px = this.x + Math.cos(angle) * 40;
    let py = this.y + Math.sin(angle) * 40;
    let vx = Math.cos(angle) * power;
    let vy = Math.sin(angle) * power;

    for (let i = 0; i < 60; i++) {
      vx += wind.x * 0.02;
      vy += wind.y * 0.005;
      vy += CONFIG.ARROW_GRAVITY;
      px += vx;
      py += vy;
      points.push({ x: px, y: py });
      if (py > CONFIG.CANVAS_HEIGHT || px > CONFIG.CANVAS_WIDTH || px < 0) break;
    }

    return points;
  }

  updateArrows(dt, wind) {
    for (const arrow of this.arrows) {
      arrow.update(dt, wind);
    }
    // Clean up dead arrows after fade
    this.arrows = this.arrows.filter(a => a.alive || a.stuck);
  }

  draw(ctx) {
    // Draw stuck arrows
    for (const arrow of this.arrows) {
      if (arrow.stuck) arrow.draw(ctx);
    }

    // Draw flying arrows
    for (const arrow of this.arrows) {
      if (!arrow.stuck) arrow.draw(ctx);
    }

    // Draw bow
    this._drawBow(ctx);

    // Draw trajectory preview
    if (this.aiming && this.pullBack > 0.05) {
      this._drawTrajectoryPreview(ctx);
    }
  }

  _drawBow(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const aimAngle = this.aiming ? this.aimAngle : -Math.PI / 4;

    ctx.rotate(aimAngle);

    // Bow limbs (arc)
    const bowRadius = 50;
    const bowThickness = 5;

    ctx.strokeStyle = CONFIG.COLOR_WOOD;
    ctx.lineWidth = bowThickness;
    ctx.lineCap = 'round';

    // Upper limb
    ctx.beginPath();
    ctx.arc(0, 0, bowRadius, -Math.PI * 0.35, -Math.PI * 0.02);
    ctx.stroke();

    // Lower limb
    ctx.beginPath();
    ctx.arc(0, 0, bowRadius, Math.PI * 0.02, Math.PI * 0.35);
    ctx.stroke();

    // Grip
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(-4, -8, 8, 16);

    // String
    const pullDist = this.pullBack * 25;
    ctx.strokeStyle = CONFIG.COLOR_STRING;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-Math.PI * 0.35) * bowRadius, Math.sin(-Math.PI * 0.35) * bowRadius);
    ctx.lineTo(-pullDist, 0);
    ctx.lineTo(Math.cos(Math.PI * 0.35) * bowRadius, Math.sin(Math.PI * 0.35) * bowRadius);
    ctx.stroke();

    // Nocked arrow when aiming
    if (this.aiming && this.pullBack > 0) {
      ctx.fillStyle = CONFIG.COLOR_ARROW_SHAFT;
      ctx.strokeStyle = CONFIG.COLOR_ARROW_TIP;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-pullDist, 0);
      ctx.lineTo(-pullDist - CONFIG.ARROW_LENGTH * 0.7, 0);
      ctx.stroke();

      // Arrow tip
      ctx.fillStyle = CONFIG.COLOR_ARROW_TIP;
      ctx.beginPath();
      ctx.moveTo(-pullDist - CONFIG.ARROW_LENGTH * 0.7 - 6, 0);
      ctx.lineTo(-pullDist - CONFIG.ARROW_LENGTH * 0.7 + 2, -3);
      ctx.lineTo(-pullDist - CONFIG.ARROW_LENGTH * 0.7 + 2, 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  _drawTrajectoryPreview(ctx) {
    const wind = this._currentWind || { x: 0, y: 0 };
    const points = this.getTrajectoryPreview(wind);

    for (let i = 0; i < points.length; i++) {
      const alpha = 1 - i / points.length;
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  setCurrentWind(wind) {
    this._currentWind = wind;
  }

  getActiveArrows() {
    return this.arrows.filter(a => !a.stuck && a.alive);
  }

  getStuckArrows() {
    return this.arrows.filter(a => a.stuck);
  }

  clearArrows() {
    this.arrows = [];
  }
}
