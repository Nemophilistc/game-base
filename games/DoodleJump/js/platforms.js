// Platform types, generation, scrolling
import { CONFIG } from './config.js';

export const PLATFORM_TYPE = {
  NORMAL: 'normal',
  MOVING: 'moving',
  FRAGILE: 'fragile',
  SPRING: 'spring',
  SPIKE: 'spike',
};

export class Platform {
  constructor(x, y, type = PLATFORM_TYPE.NORMAL) {
    this.x = x;
    this.y = y;
    this.w = CONFIG.PLATFORM_WIDTH;
    this.h = CONFIG.PLATFORM_HEIGHT;
    this.type = type;
    this.alive = true;

    // Moving platform
    this.moveDir = Math.random() < 0.5 ? 1 : -1;
    this.moveSpeed = CONFIG.MOVING_PLATFORM_SPEED;

    // Fragile platform
    this.shaking = false;
    this.shakeTimer = 0;
    this.breaking = false;
    this.breakTimer = 0;

    // Spring
    this.springBounce = 0; // animation timer

    // Spike
    this.spikeHitCooldown = 0;

    // Visual wobble for doodle feel
    this.wobble = Math.random() * Math.PI * 2;
  }

  update(dt) {
    if (this.type === PLATFORM_TYPE.MOVING && this.alive) {
      this.x += this.moveSpeed * this.moveDir;
      if (this.x <= 0 || this.x + this.w >= CONFIG.WIDTH) {
        this.moveDir *= -1;
      }
    }

    if (this.shaking) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.breaking = true;
        this.shakeTimer = 0;
      }
    }

    if (this.breaking) {
      this.breakTimer += dt;
      if (this.breakTimer > 300) {
        this.alive = false;
      }
    }

    if (this.springBounce > 0) this.springBounce -= dt;
    if (this.spikeHitCooldown > 0) this.spikeHitCooldown -= dt;
  }

  onLand() {
    if (this.type === PLATFORM_TYPE.FRAGILE && !this.shaking) {
      this.shaking = true;
      this.shakeTimer = 300;
      return 'break';
    }
    if (this.type === PLATFORM_TYPE.SPRING) {
      this.springBounce = 200;
      return 'spring';
    }
    if (this.type === PLATFORM_TYPE.SPIKE) {
      return 'spike';
    }
    return 'land';
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;

    const sy = this.y - cameraY;
    if (sy > CONFIG.HEIGHT + 20 || sy + this.h < -20) return;

    let sx = this.x;

    // Shake offset for fragile
    if (this.shaking) {
      sx += (Math.random() - 0.5) * 6;
    }

    ctx.save();

    // Breaking animation: fade out and split
    if (this.breaking) {
      const progress = this.breakTimer / 300;
      ctx.globalAlpha = 1 - progress;
      // Split into fragments
      const fragY = sy + progress * 40;
      this._drawFragments(ctx, sx, fragY);
      ctx.restore();
      return;
    }

    const colors = this._getColors();
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    // Draw platform with doodle style
    switch (this.type) {
      case PLATFORM_TYPE.NORMAL:
        this._drawNormal(ctx, sx, sy);
        break;
      case PLATFORM_TYPE.MOVING:
        this._drawMoving(ctx, sx, sy);
        break;
      case PLATFORM_TYPE.FRAGILE:
        this._drawFragile(ctx, sx, sy);
        break;
      case PLATFORM_TYPE.SPRING:
        this._drawSpring(ctx, sx, sy);
        break;
      case PLATFORM_TYPE.SPIKE:
        this._drawSpike(ctx, sx, sy);
        break;
    }

    ctx.restore();
  }

  _getColors() {
    switch (this.type) {
      case PLATFORM_TYPE.NORMAL: return { fill: CONFIG.COLORS.PLATFORM_NORMAL, stroke: CONFIG.COLORS.PLATFORM_NORMAL_DARK };
      case PLATFORM_TYPE.MOVING: return { fill: CONFIG.COLORS.PLATFORM_MOVING, stroke: CONFIG.COLORS.PLATFORM_MOVING_DARK };
      case PLATFORM_TYPE.FRAGILE: return { fill: CONFIG.COLORS.PLATFORM_FRAGILE, stroke: CONFIG.COLORS.PLATFORM_FRAGILE_DARK };
      case PLATFORM_TYPE.SPRING: return { fill: CONFIG.COLORS.PLATFORM_NORMAL, stroke: CONFIG.COLORS.PLATFORM_NORMAL_DARK };
      case PLATFORM_TYPE.SPIKE: return { fill: '#888', stroke: '#555' };
      default: return { fill: '#888', stroke: '#555' };
    }
  }

  _drawNormal(ctx, x, y) {
    // Rounded rectangle with sketch lines
    ctx.fillStyle = CONFIG.COLORS.PLATFORM_NORMAL;
    ctx.strokeStyle = CONFIG.COLORS.PLATFORM_NORMAL_DARK;
    ctx.lineWidth = 2;

    this._sketchyRect(ctx, x, y, this.w, this.h, 4);

    // Grass tufts on top
    ctx.strokeStyle = '#3d8b3d';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const gx = x + 8 + i * 14 + Math.sin(this.wobble + i) * 2;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx - 3, y - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + 3, y - 4);
      ctx.stroke();
    }
  }

  _drawMoving(ctx, x, y) {
    ctx.fillStyle = CONFIG.COLORS.PLATFORM_MOVING;
    ctx.strokeStyle = CONFIG.COLORS.PLATFORM_MOVING_DARK;
    ctx.lineWidth = 2;

    this._sketchyRect(ctx, x, y, this.w, this.h, 4);

    // Arrows showing movement direction
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6;
    const arrowY = y + this.h / 2;
    for (let i = 0; i < 2; i++) {
      const ax = x + 15 + i * 30;
      ctx.beginPath();
      ctx.moveTo(ax, arrowY - 3);
      ctx.lineTo(ax + 6, arrowY);
      ctx.lineTo(ax, arrowY + 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawFragile(ctx, x, y) {
    ctx.fillStyle = CONFIG.COLORS.PLATFORM_FRAGILE;
    ctx.strokeStyle = CONFIG.COLORS.PLATFORM_FRAGILE_DARK;
    ctx.lineWidth = 2;

    this._sketchyRect(ctx, x, y, this.w, this.h, 3);

    // Crack lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + this.w * 0.3, y + 2);
    ctx.lineTo(x + this.w * 0.45, y + this.h - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + this.w * 0.65, y + 3);
    ctx.lineTo(x + this.w * 0.55, y + this.h - 1);
    ctx.stroke();
  }

  _drawSpring(ctx, x, y) {
    // Platform base
    ctx.fillStyle = CONFIG.COLORS.PLATFORM_NORMAL;
    ctx.strokeStyle = CONFIG.COLORS.PLATFORM_NORMAL_DARK;
    ctx.lineWidth = 2;
    this._sketchyRect(ctx, x, y, this.w, this.h, 4);

    // Spring coil on top
    const sx = x + this.w / 2;
    const springH = 12 + (this.springBounce > 0 ? -4 : 0);
    const sy = y - springH;

    ctx.strokeStyle = CONFIG.COLORS.SPRING;
    ctx.fillStyle = CONFIG.COLORS.SPRING;
    ctx.lineWidth = 3;

    // Coil
    ctx.beginPath();
    const coils = 3;
    for (let i = 0; i <= coils; i++) {
      const t = i / coils;
      const cx = sx + (i % 2 === 0 ? -6 : 6);
      const cy = y - t * springH;
      if (i === 0) ctx.moveTo(sx, y);
      else ctx.lineTo(cx, cy);
    }
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Spring top cap
    ctx.fillStyle = CONFIG.COLORS.SPRING_DARK;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  _drawSpike(ctx, x, y) {
    // Gray platform base
    ctx.fillStyle = '#888';
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    this._sketchyRect(ctx, x, y, this.w, this.h, 3);

    // Spikes on top
    ctx.fillStyle = CONFIG.COLORS.PLATFORM_SPIKE;
    ctx.strokeStyle = CONFIG.COLORS.PLATFORM_SPIKE_DARK;
    ctx.lineWidth = 1.5;
    const spikes = 4;
    for (let i = 0; i < spikes; i++) {
      const sx2 = x + (i + 0.5) * (this.w / spikes);
      ctx.beginPath();
      ctx.moveTo(sx2 - 5, y);
      ctx.lineTo(sx2, y - 10);
      ctx.lineTo(sx2 + 5, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  _drawFragments(ctx, x, y) {
    ctx.fillStyle = CONFIG.COLORS.PLATFORM_FRAGILE;
    ctx.strokeStyle = CONFIG.COLORS.PLATFORM_FRAGILE_DARK;
    ctx.lineWidth = 1.5;
    // Draw 4 small fragments
    const frags = [
      { ox: -5, oy: -3 }, { ox: 15, oy: 2 },
      { ox: 35, oy: -1 }, { ox: 50, oy: 4 }
    ];
    for (const f of frags) {
      ctx.save();
      ctx.translate(x + f.ox, y + f.oy);
      ctx.rotate(Math.random() * 0.5);
      ctx.fillRect(-6, -4, 12, 8);
      ctx.strokeRect(-6, -4, 12, 8);
      ctx.restore();
    }
  }

  _sketchyRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y + Math.random());
    ctx.lineTo(x + w - r + Math.random(), y + Math.random());
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w + Math.random(), y + h - r + Math.random());
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r + Math.random(), y + h + Math.random());
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x + Math.random(), y + r + Math.random());
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export class PlatformManager {
  constructor() {
    this.platforms = [];
    this.highestGenerated = 0;
    this.score = 0;
  }

  init() {
    this.platforms = [];
    this.highestGenerated = CONFIG.HEIGHT;
    this.score = 0;

    // Ground platform
    this.platforms.push(new Platform(CONFIG.WIDTH / 2 - CONFIG.PLATFORM_WIDTH / 2, CONFIG.HEIGHT - 50, PLATFORM_TYPE.NORMAL));

    // Generate initial platforms
    let y = CONFIG.HEIGHT - 120;
    while (y > -200) {
      this._generatePlatform(y);
      y -= this._getGap(0);
    }
    this.highestGenerated = y;
  }

  _getGap(difficulty) {
    const minGap = CONFIG.PLATFORM_GAP_MIN + difficulty * 3;
    const maxGap = CONFIG.PLATFORM_GAP_MAX + difficulty * 8;
    return minGap + Math.random() * (maxGap - minGap);
  }

  _generatePlatform(y) {
    const difficulty = Math.min(this.score / CONFIG.DIFFICULTY_INTERVAL, 10);
    const x = Math.random() * (CONFIG.WIDTH - CONFIG.PLATFORM_WIDTH);

    // Type probability based on difficulty
    const r = Math.random();
    let type = PLATFORM_TYPE.NORMAL;

    if (difficulty > 1 && r < 0.12 + difficulty * 0.02) {
      type = PLATFORM_TYPE.MOVING;
    } else if (difficulty > 2 && r < 0.20 + difficulty * 0.03) {
      type = PLATFORM_TYPE.FRAGILE;
    } else if (r < 0.28) {
      type = PLATFORM_TYPE.SPRING;
    } else if (difficulty > 3 && r < 0.32) {
      type = PLATFORM_TYPE.SPIKE;
    }

    this.platforms.push(new Platform(x, y, type));
  }

  update(dt, cameraY) {
    // Update all platforms
    for (const p of this.platforms) {
      p.update(dt);
    }

    // Remove dead or off-screen platforms
    this.platforms = this.platforms.filter(p => p.alive && p.y - cameraY < CONFIG.HEIGHT + 100);

    // Generate new platforms above
    const generateAbove = cameraY - 300;
    while (this.highestGenerated > generateAbove) {
      const gap = this._getGap(Math.min(this.score / CONFIG.DIFFICULTY_INTERVAL, 10));
      this.highestGenerated -= gap;
      this._generatePlatform(this.highestGenerated);
    }
  }

  draw(ctx, cameraY) {
    for (const p of this.platforms) {
      p.draw(ctx, cameraY);
    }
  }
}
