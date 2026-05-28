// Enemies on platforms and collectibles
import { CONFIG } from './config.js';

export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = CONFIG.ENEMY_WIDTH;
    this.h = CONFIG.ENEMY_HEIGHT;
    this.alive = true;
    this.vx = (Math.random() < 0.5 ? 1 : -1) * CONFIG.ENEMY_SPEED;
    this.baseY = y;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.animFrame = 0;
    this.eyePhase = Math.random() * Math.PI * 2;
    // Type: 0 = blob, 1 = flying eye
    this.type = Math.random() < 0.5 ? 0 : 1;
  }

  update(dt) {
    this.x += this.vx;
    if (this.x <= 0 || this.x + this.w >= CONFIG.WIDTH) {
      this.vx *= -1;
    }
    this.floatPhase += 0.04;
    this.y = this.baseY + Math.sin(this.floatPhase) * 6;
    this.animFrame += 0.08;
    this.eyePhase += 0.03;
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    const sy = this.y - cameraY;
    if (sy > CONFIG.HEIGHT + 30 || sy + this.h < -30) return;

    const cx = this.x + this.w / 2;
    const cy = sy + this.h / 2;

    ctx.save();

    if (this.type === 0) {
      this._drawBlob(ctx, cx, cy);
    } else {
      this._drawFlyingEye(ctx, cx, cy);
    }

    ctx.restore();
  }

  _drawBlob(ctx, cx, cy) {
    const r = this.w / 2;
    // Body
    ctx.fillStyle = CONFIG.COLORS.ENEMY;
    ctx.strokeStyle = CONFIG.COLORS.ENEMY_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Blobby shape
    for (let a = 0; a < Math.PI * 2; a += 0.2) {
      const wobble = Math.sin(a * 3 + this.animFrame) * 2;
      const px = cx + Math.cos(a) * (r + wobble);
      const py = cy + Math.sin(a) * (r * 0.8 + wobble);
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyes
    const eyeOff = 5;
    ctx.fillStyle = CONFIG.COLORS.ENEMY_EYES;
    ctx.beginPath();
    ctx.arc(cx - eyeOff, cy - 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOff, cy - 3, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (looking at player direction)
    const lookX = Math.sin(this.eyePhase) * 2;
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - eyeOff + lookX, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOff + lookX, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = CONFIG.COLORS.ENEMY_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - eyeOff - 5, cy - 9);
    ctx.lineTo(cx - eyeOff + 3, cy - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + eyeOff + 5, cy - 9);
    ctx.lineTo(cx + eyeOff - 3, cy - 7);
    ctx.stroke();
  }

  _drawFlyingEye(ctx, cx, cy) {
    // Wings
    const wingFlap = Math.sin(this.animFrame * 2) * 8;
    ctx.fillStyle = '#c0392b';
    ctx.strokeStyle = '#922b21';
    ctx.lineWidth = 1.5;
    // Left wing
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy);
    ctx.quadraticCurveTo(cx - 20, cy - 10 + wingFlap, cx - 18, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy);
    ctx.quadraticCurveTo(cx + 20, cy - 10 + wingFlap, cx + 18, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eye body (white)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#922b21';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner pupil
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.collectibles = []; // { x, y, type: 'coin'|'jetpack'|'propeller', collected: false }
    this.spawnTimer = 0;
  }

  init() {
    this.enemies = [];
    this.collectibles = [];
    this.spawnTimer = 0;
  }

  trySpawn(platforms, score) {
    const difficulty = Math.min(score / CONFIG.DIFFICULTY_INTERVAL, 10);

    // Spawn enemies near platforms
    for (const p of platforms) {
      if (p._enemySpawned) continue;
      if (p.y > 0) continue; // don't spawn near start

      const chance = 0.04 + difficulty * 0.025;
      if (Math.random() < chance) {
        this.enemies.push(new Enemy(
          p.x + Math.random() * (p.w - CONFIG.ENEMY_WIDTH),
          p.y - 40 - Math.random() * 20
        ));
        p._enemySpawned = true;
      }
    }

    // Spawn collectibles
    for (const p of platforms) {
      if (p._collectSpawned) continue;
      if (p.y > 0) continue;

      const r = Math.random();
      if (r < 0.06) {
        // Coin
        this.collectibles.push({
          x: p.x + p.w / 2,
          y: p.y - 25,
          type: 'coin',
          collected: false,
          animPhase: Math.random() * Math.PI * 2
        });
        p._collectSpawned = true;
      } else if (r < 0.068) {
        // Jetpack (rare)
        this.collectibles.push({
          x: p.x + p.w / 2,
          y: p.y - 30,
          type: 'jetpack',
          collected: false,
          animPhase: 0
        });
        p._collectSpawned = true;
      } else if (r < 0.076) {
        // Propeller hat (rare)
        this.collectibles.push({
          x: p.x + p.w / 2,
          y: p.y - 28,
          type: 'propeller',
          collected: false,
          animPhase: 0
        });
        p._collectSpawned = true;
      }
    }
  }

  update(dt, cameraY) {
    for (const e of this.enemies) {
      if (e.alive) e.update(dt);
    }
    // Remove off-screen enemies
    this.enemies = this.enemies.filter(e => e.alive && e.y - cameraY < CONFIG.HEIGHT + 100);

    // Update collectible animation
    for (const c of this.collectibles) {
      if (!c.collected) c.animPhase += 0.05;
    }
    this.collectibles = this.collectibles.filter(c => !c.collected && c.y - cameraY < CONFIG.HEIGHT + 100);
  }

  draw(ctx, cameraY) {
    // Draw enemies
    for (const e of this.enemies) {
      e.draw(ctx, cameraY);
    }

    // Draw collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const sy = c.y - cameraY + Math.sin(c.animPhase) * 3;
      if (sy > CONFIG.HEIGHT + 20 || sy < -20) continue;

      ctx.save();

      if (c.type === 'coin') {
        this._drawCoin(ctx, c.x, sy);
      } else if (c.type === 'jetpack') {
        this._drawJetpackItem(ctx, c.x, sy);
      } else if (c.type === 'propeller') {
        this._drawPropellerItem(ctx, c.x, sy);
      }

      ctx.restore();
    }
  }

  _drawCoin(ctx, x, y) {
    const r = CONFIG.COIN_RADIUS;
    // Coin body
    ctx.fillStyle = CONFIG.COLORS.COIN;
    ctx.strokeStyle = CONFIG.COLORS.COIN_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dollar sign
    ctx.fillStyle = CONFIG.COLORS.COIN_DARK;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y + 1);

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawJetpackItem(ctx, x, y) {
    // Glow
    ctx.fillStyle = 'rgba(231,76,60,0.15)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = CONFIG.COLORS.JETPACK;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 8, y - 12, 16, 24);
    ctx.strokeRect(x - 8, y - 12, 16, 24);

    // Flame icon
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 12);
    ctx.quadraticCurveTo(x, y + 20, x + 4, y + 12);
    ctx.fill();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('J', x, y + 2);
  }

  _drawPropellerItem(ctx, x, y) {
    // Glow
    ctx.fillStyle = 'rgba(155,89,182,0.15)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = CONFIG.COLORS.PROPELLER;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 6);
    ctx.lineTo(x + 12, y + 6);
    ctx.lineTo(x + 8, y - 4);
    ctx.lineTo(x - 8, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spinning blades
    const angle = Date.now() * 0.015;
    ctx.save();
    ctx.translate(x, y - 6);
    ctx.rotate(angle);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
