// Player entity
import { CONFIG } from './config.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = CONFIG.PLAYER_WIDTH;
    this.h = CONFIG.PLAYER_HEIGHT;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.alive = true;
    this.hp = 3;
    this.maxHp = 3;
    this.invincibleTimer = 0; // ms of invincibility after hit

    // Shooting
    this.lastShotTime = 0;

    // Power-ups
    this.jetpackTimer = 0;
    this.propellerTimer = 0;

    // Visual
    this.eyeBlink = 0;
    this.squashTimer = 0; // squash-and-stretch on landing
    this.legWalkFrame = 0;

    // Bullets
    this.bullets = [];
  }

  jump(velocity) {
    this.vy = velocity || CONFIG.JUMP_VELOCITY;
    this.onGround = false;
    this.squashTimer = 8;
  }

  shoot(targetX, targetY, now) {
    if (now - this.lastShotTime < CONFIG.SHOOT_COOLDOWN) return;
    this.lastShotTime = now;

    // Shoot upward toward the target
    const dx = targetX - (this.x + this.w / 2);
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this.bullets.push({
      x: this.x + this.w / 2,
      y: this.y,
      vx: (dx / dist) * CONFIG.BULLET_SPEED,
      vy: (dy / dist) * CONFIG.BULLET_SPEED,
      life: 60
    });
  }

  update(keys, dt) {
    // Horizontal movement
    const speed = CONFIG.PLAYER_SPEED;
    if (keys.left) {
      this.vx = -speed;
      this.facing = -1;
    } else if (keys.right) {
      this.vx = speed;
      this.facing = 1;
    } else {
      this.vx *= 0.85; // friction
    }

    this.x += this.vx;

    // Screen wrapping
    if (this.x + this.w < 0) this.x = CONFIG.WIDTH;
    if (this.x > CONFIG.WIDTH) this.x = -this.w;

    // Power-up timers
    if (this.jetpackTimer > 0) {
      this.jetpackTimer -= dt;
      this.vy = CONFIG.JETPACK_SPEED;
    } else if (this.propellerTimer > 0) {
      this.propellerTimer -= dt;
      this.vy = CONFIG.PROPELLER_SPEED;
    } else {
      // Normal gravity
      this.vy += CONFIG.GRAVITY;
      if (this.vy > CONFIG.MAX_FALL_SPEED) this.vy = CONFIG.MAX_FALL_SPEED;
    }

    this.y += this.vy;

    // Invincibility timer
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    // Animation
    this.eyeBlink = Math.max(0, this.eyeBlink - 1);
    if (Math.random() < 0.005) this.eyeBlink = 8; // random blink
    if (this.squashTimer > 0) this.squashTimer--;
    if (Math.abs(this.vx) > 1) {
      this.legWalkFrame += 0.3;
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.life <= 0 || b.x < -10 || b.x > CONFIG.WIDTH + 10 || b.y < -1000) {
        this.bullets.splice(i, 1);
      }
    }
  }

  hit() {
    if (this.invincibleTimer > 0 || this.jetpackTimer > 0 || this.propellerTimer > 0) return false;
    this.hp--;
    this.invincibleTimer = 1500;
    if (this.hp <= 0) {
      this.alive = false;
      return true; // dead
    }
    return false;
  }

  activateJetpack() {
    this.jetpackTimer = CONFIG.JETPACK_DURATION;
    this.propellerTimer = 0;
  }

  activatePropeller() {
    this.propellerTimer = CONFIG.PROPELLER_DURATION;
    this.jetpackTimer = 0;
  }

  get isFlying() {
    return this.jetpackTimer > 0 || this.propellerTimer > 0;
  }

  draw(ctx, cameraY) {
    const sx = this.x;
    const sy = this.y - cameraY;
    const w = this.w;
    const h = this.h;

    // Skip if off-screen
    if (sy + h < -50 || sy > CONFIG.HEIGHT + 50) return;

    ctx.save();

    // Invincibility flash
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const cx = sx + w / 2;
    const cy = sy + h / 2;

    // Squash and stretch
    let scaleX = 1, scaleY = 1;
    if (this.squashTimer > 0) {
      const t = this.squashTimer / 8;
      scaleX = 1 + t * 0.3;
      scaleY = 1 - t * 0.2;
    } else if (this.vy < -5) {
      scaleY = 1.15;
      scaleX = 0.88;
    }

    ctx.translate(cx, cy);
    ctx.scale(scaleX * this.facing, scaleY);
    ctx.translate(-cx, -cy);

    // Draw jetpack behind player
    if (this.jetpackTimer > 0) {
      this._drawJetpack(ctx, sx, sy, w, h);
    }

    // Body (rounded rectangle with doodle style)
    ctx.fillStyle = CONFIG.COLORS.PLAYER_BODY;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const bx = sx + 4;
    const by = sy + 6;
    const bw = w - 8;
    const bh = h - 16;
    this._drawSketchyRect(ctx, bx, by, bw, bh);

    // Belly patch
    ctx.fillStyle = '#7bb3e0';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, bw * 0.3, bh * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeY = sy + 16;
    const eyeSpacing = 7;
    const eyeSize = this.eyeBlink > 4 ? 1 : 5;

    // Left eye
    ctx.fillStyle = CONFIG.COLORS.PLAYER_EYES;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx - eyeSpacing, eyeY, 5, eyeSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right eye
    ctx.beginPath();
    ctx.ellipse(cx + eyeSpacing, eyeY, 5, eyeSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupils
    if (this.eyeBlink <= 4) {
      ctx.fillStyle = CONFIG.COLORS.PLAYER_PUPIL;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing + 1, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing + 1, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nose (small circle)
    ctx.fillStyle = '#e8a0a0';
    ctx.beginPath();
    ctx.arc(cx, eyeY + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (smile)
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, eyeY + 8, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Legs (animated when walking)
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const legBase = sy + h - 6;
    const legLen = 8;
    const walkOffset = Math.sin(this.legWalkFrame) * 4;

    // Left leg
    ctx.beginPath();
    ctx.moveTo(cx - 6, legBase);
    ctx.lineTo(cx - 6 + (this.onGround ? walkOffset : -3), legBase + legLen);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(cx + 6, legBase);
    ctx.lineTo(cx + 6 + (this.onGround ? -walkOffset : 3), legBase + legLen);
    ctx.stroke();

    // Propeller hat
    if (this.propellerTimer > 0) {
      this._drawPropeller(ctx, cx, sy - 2);
    }

    // Arms
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2.5;
    const armY = sy + 22;
    ctx.beginPath();
    ctx.moveTo(sx + 4, armY);
    ctx.lineTo(sx - 4, armY + (this.isFlying ? -8 : 6));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + w - 4, armY);
    ctx.lineTo(sx + w + 4, armY + (this.isFlying ? -8 : 6));
    ctx.stroke();

    ctx.restore();

    // Bullets
    for (const b of this.bullets) {
      const bx2 = b.x;
      const by2 = b.y - cameraY;
      ctx.fillStyle = CONFIG.COLORS.BULLET;
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx2, by2, CONFIG.BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Trail
      ctx.fillStyle = 'rgba(231,76,60,0.3)';
      ctx.beginPath();
      ctx.arc(bx2 - b.vx * 0.5, by2 - b.vy * 0.5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawSketchyRect(ctx, x, y, w, h) {
    const r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    // Slightly wobbly lines for doodle feel
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

  _drawJetpack(ctx, sx, sy, w, h) {
    const jx = sx + w / 2 - 10;
    const jy = sy + 8;

    // Jetpack body
    ctx.fillStyle = CONFIG.COLORS.JETPACK;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.fillRect(jx, jy, 20, 24);
    ctx.strokeRect(jx, jy, 20, 24);

    // Nozzles
    ctx.fillStyle = '#555';
    ctx.fillRect(jx + 2, jy + 24, 6, 4);
    ctx.fillRect(jx + 12, jy + 24, 6, 4);

    // Flame
    const flameH = 10 + Math.random() * 12;
    const gradient = ctx.createLinearGradient(0, jy + 28, 0, jy + 28 + flameH);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.2, '#ff6');
    gradient.addColorStop(0.5, CONFIG.COLORS.JETPACK_FLAME);
    gradient.addColorStop(1, 'rgba(231,76,60,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(jx + 2, jy + 28);
    ctx.quadraticCurveTo(jx + 5 + Math.random() * 3, jy + 28 + flameH, jx + 8, jy + 28);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(jx + 12, jy + 28);
    ctx.quadraticCurveTo(jx + 15 + Math.random() * 3, jy + 28 + flameH, jx + 18, jy + 28);
    ctx.fill();
  }

  _drawPropeller(ctx, cx, y) {
    const time = Date.now() * 0.02;

    // Hat base
    ctx.fillStyle = CONFIG.COLORS.PROPELLER;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 14, y + 6);
    ctx.lineTo(cx + 14, y + 6);
    ctx.lineTo(cx + 8, y);
    ctx.lineTo(cx - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Propeller blades (spinning)
    ctx.save();
    ctx.translate(cx, y - 2);
    ctx.rotate(time);

    ctx.fillStyle = '#e74c3c';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    // Blade 1
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Blade 2 (perpendicular)
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
