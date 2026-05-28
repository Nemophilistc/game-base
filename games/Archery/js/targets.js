// targets.js - Target types, movement, hit detection
import { CONFIG } from './config.js';

export class Target {
  constructor(x, y, radius, type = 'static') {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type; // 'static', 'moving', 'wind', 'balloon', 'apple'
    this.alive = true;
    this.hit = false;
    this.hitZone = -1;
    this.hitScore = 0;
    this.fadeAlpha = 1;
    this.hitAnimation = 0;

    // Moving target properties
    this.baseX = x;
    this.speed = CONFIG.MOVING_SPEED_MIN + Math.random() * (CONFIG.MOVING_SPEED_MAX - CONFIG.MOVING_SPEED_MIN);
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.moveRange = CONFIG.MOVING_RANGE;

    // Balloon properties
    this.balloonColor = CONFIG.BALLOON_COLORS[Math.floor(Math.random() * CONFIG.BALLOON_COLORS.length)];
    this.bobOffset = Math.random() * Math.PI * 2;

    // Apple properties
    this.appleAngle = 0;
    this.dummyHeadY = 0;
  }

  update(dt, wind) {
    if (!this.alive) {
      this.fadeAlpha -= 0.05;
      return;
    }

    if (this.hit) {
      this.hitAnimation += dt;
      if (this.hitAnimation > 1000) {
        this.alive = false;
      }
      return;
    }

    switch (this.type) {
      case 'moving':
        this.x += this.speed * this.direction;
        if (this.x > this.baseX + this.moveRange / 2 || this.x < this.baseX - this.moveRange / 2) {
          this.direction *= -1;
        }
        break;

      case 'wind':
        // Wind target sways more with wind
        this.x = this.baseX + wind.x * 8;
        this.y += Math.sin(Date.now() / 800) * 0.3;
        break;

      case 'balloon':
        this.y -= CONFIG.BALLOON_FLOAT_SPEED * 0.3;
        this.x += Math.sin(Date.now() / 1000 + this.bobOffset) * 0.5;
        if (this.y < -50) this.alive = false;
        break;

      case 'apple':
        // Apple sits on dummy's head - slight bob
        this.x = this.baseX;
        this.y = this.dummyHeadY - 25;
        break;
    }
  }

  checkHit(arrow) {
    if (this.hit || !this.alive) return null;

    const dx = arrow.x - this.x;
    const dy = arrow.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.type === 'apple') {
      // Apple is small, need precise hit
      if (dist < CONFIG.APPLE_RADIUS) {
        return { zone: 0, score: CONFIG.APPLE_BONUS, type: 'apple' };
      }
      // Check if hit the dummy (penalty)
      const dummyDx = arrow.x - this.baseX;
      const dummyDy = arrow.y - (this.dummyHeadY + 40);
      const dummyDist = Math.sqrt(dummyDx * dummyDx + dummyDy * dummyDy);
      if (dummyDist < 40) {
        return { zone: -1, score: -CONFIG.APPLE_MISS_PENALTY, type: 'dummy' };
      }
      return null;
    }

    if (this.type === 'balloon') {
      if (dist < CONFIG.BALLOON_RADIUS) {
        return { zone: 0, score: CONFIG.BALLOON_BONUS, type: 'balloon' };
      }
      return null;
    }

    // Standard target (static, moving, wind)
    if (dist < this.radius) {
      // Determine zone (5 zones from center out)
      const ratio = dist / this.radius;
      let zone;
      if (ratio < 0.2) zone = 0;       // Bullseye - 10 pts
      else if (ratio < 0.4) zone = 1;   // 8 pts
      else if (ratio < 0.6) zone = 2;   // 6 pts
      else if (ratio < 0.8) zone = 3;   // 4 pts
      else zone = 4;                     // 2 pts

      return {
        zone,
        score: CONFIG.TARGET_ZONE_SCORES[zone],
        type: this.type
      };
    }

    return null;
  }

  onHit(arrow, hitResult) {
    this.hit = true;
    this.hitZone = hitResult.zone;
    this.hitScore = hitResult.score;
    this.hitAnimation = 0;

    // Stick arrow to target
    arrow.stuck = true;
    arrow.stuckTarget = this;
    arrow.stuckOffsetX = arrow.x - this.x;
    arrow.stuckOffsetY = arrow.y - this.y;
    arrow.stuckZone = hitResult.zone;
  }

  draw(ctx) {
    if (!this.alive && this.fadeAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    if (this.hit) {
      this._drawHitEffect(ctx);
    } else {
      switch (this.type) {
        case 'static':
        case 'moving':
        case 'wind':
          this._drawBullseye(ctx);
          break;
        case 'balloon':
          this._drawBalloon(ctx);
          break;
        case 'apple':
          this._drawDummy(ctx);
          this._drawApple(ctx);
          break;
      }
    }

    ctx.restore();
  }

  _drawBullseye(ctx) {
    const r = this.radius;
    const zones = [
      { radius: r, color: '#FFFFFF' },           // outermost - 2
      { radius: r * 0.8, color: '#2255CC' },     // 4
      { radius: r * 0.6, color: '#DD2222' },     // 6
      { radius: r * 0.4, color: '#4488FF' },     // 8
      { radius: r * 0.2, color: '#FFD700' },     // bullseye - 10
    ];

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(this.x + 3, this.y + 3, r, 0, Math.PI * 2);
    ctx.fill();

    // Board background
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r + 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw zones from outside in
    for (const zone of zones) {
      ctx.fillStyle = zone.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ring outlines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (const zone of zones) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, zone.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center dot
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Type indicator for moving/wind
    if (this.type === 'moving') {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('>>', this.x, this.y - r - 8);
    } else if (this.type === 'wind') {
      ctx.fillStyle = 'rgba(100,200,255,0.8)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('~', this.x, this.y - r - 8);
    }
  }

  _drawBalloon(ctx) {
    const r = CONFIG.BALLOON_RADIUS;

    // String
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + r);
    ctx.quadraticCurveTo(this.x + 5, this.y + r + 15, this.x - 3, this.y + r + 25);
    ctx.stroke();

    // Balloon body
    const gradient = ctx.createRadialGradient(
      this.x - r * 0.3, this.y - r * 0.3, 0,
      this.x, this.y, r
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, this.balloonColor);
    gradient.addColorStop(1, this._darkenColor(this.balloonColor, 0.5));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Knot
    ctx.fillStyle = this._darkenColor(this.balloonColor, 0.7);
    ctx.beginPath();
    ctx.moveTo(this.x - 3, this.y + r);
    ctx.lineTo(this.x, this.y + r + 5);
    ctx.lineTo(this.x + 3, this.y + r);
    ctx.closePath();
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x - r * 0.25, this.y - r * 0.25, r * 0.15, r * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bonus label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`+${CONFIG.BALLOON_BONUS}`, this.x, this.y + 4);
  }

  _drawDummy(ctx) {
    const x = this.baseX;
    const headY = this.dummyHeadY;

    // Body
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x - 15, headY + 20, 30, 50);

    // Stick/stand
    ctx.fillStyle = '#654321';
    ctx.fillRect(x - 4, headY + 70, 8, 40);

    // Cross bar
    ctx.fillRect(x - 25, headY + 30, 50, 5);

    // Head (circle)
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(x, headY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = '#333';
    // Eyes
    ctx.beginPath();
    ctx.arc(x - 6, headY - 3, 2, 0, Math.PI * 2);
    ctx.arc(x + 6, headY - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    // Mouth (worried)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, headY + 8, 5, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  }

  _drawApple(ctx) {
    const x = this.x;
    const y = this.y;
    const r = CONFIG.APPLE_RADIUS;

    // Apple body
    const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, r);
    gradient.addColorStop(0, '#FF3333');
    gradient.addColorStop(1, '#CC0000');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + 3, y - r - 8, x + 1, y - r - 5);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(x + 5, y - r - 2, 6, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(x - 5, y - 5, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bonus label
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`+${CONFIG.APPLE_BONUS}`, x, y + r + 14);
  }

  _drawHitEffect(ctx) {
    const progress = this.hitAnimation / 1000;

    if (this.type === 'balloon') {
      // Balloon pop particles
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const dist = progress * 40;
        const px = this.x + Math.cos(angle) * dist;
        const py = this.y + Math.sin(angle) * dist;
        ctx.fillStyle = this.balloonColor;
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(px, py, 5 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Target hit glow
      ctx.globalAlpha = (1 - progress) * 0.5;
      ctx.fillStyle = this.hitZone === 0 ? '#FFD700' : '#FF4444';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * (1 + progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
  }
}

export class TargetManager {
  constructor() {
    this.targets = [];
    this.level = 1;
    this.spawnTimer = 0;
    this.spawnInterval = 2500;
    this.mode = 'CLASSIC';
    this.challengeIndex = 0;
    this.challengeProgress = 0;
    this.challengeConsecutive = 0;
  }

  setMode(mode) {
    this.mode = mode;
    this.targets = [];
    this.spawnTimer = 0;
    this.challengeIndex = 0;
    this.challengeProgress = 0;
    this.challengeConsecutive = 0;
  }

  setLevel(level) {
    this.level = level;
  }

  update(dt, wind) {
    this.spawnTimer += dt;

    // Spawn new targets
    const maxTargets = this.mode === 'TIME_ATTACK' ? 5 : 3;
    const aliveTargets = this.targets.filter(t => t.alive && !t.hit).length;

    if (aliveTargets < maxTargets && this.spawnTimer > this.spawnInterval) {
      this.spawnTarget();
      this.spawnTimer = 0;
    }

    // Update existing targets
    for (const target of this.targets) {
      target.update(dt, wind);
    }

    // Clean up dead targets
    this.targets = this.targets.filter(t => t.alive || t.fadeAlpha > 0);
  }

  spawnTarget() {
    const distScale = 1 + (this.level - 1) * CONFIG.LEVEL_DISTANCE_INCREASE;
    const radius = CONFIG.TARGET_RADIUS_BASE / distScale;

    // Random target type based on probabilities
    const roll = Math.random();
    let type;
    if (this.mode === 'CHALLENGE') {
      const challenge = CONFIG.CHALLENGE_TARGETS[this.challengeIndex % CONFIG.CHALLENGE_TARGETS.length];
      type = challenge.type;
    } else if (roll < 0.35) {
      type = 'static';
    } else if (roll < 0.55) {
      type = 'moving';
    } else if (roll < 0.70) {
      type = 'wind';
    } else if (roll < 0.88) {
      type = 'balloon';
    } else {
      type = 'apple';
    }

    const baseX = CONFIG.TARGET_BASE_X - (this.level - 1) * 20;
    const y = CONFIG.TARGET_Y_MIN + Math.random() * (CONFIG.TARGET_Y_MAX - CONFIG.TARGET_Y_MIN);

    let target;
    if (type === 'balloon') {
      target = new Target(baseX + Math.random() * 100 - 50, y + 50, CONFIG.BALLOON_RADIUS, 'balloon');
    } else if (type === 'apple') {
      const dummyY = 350 + Math.random() * 100;
      target = new Target(baseX, dummyY - 65, CONFIG.APPLE_RADIUS, 'apple');
      target.dummyHeadY = dummyY - 40;
    } else {
      target = new Target(baseX, y, radius, type);
    }

    this.targets.push(target);
  }

  checkHits(arrow) {
    const results = [];
    for (const target of this.targets) {
      const hit = target.checkHit(arrow);
      if (hit) {
        target.onHit(arrow, hit);
        results.push({ target, hit });

        // Update challenge progress
        if (this.mode === 'CHALLENGE') {
          this._updateChallenge(hit);
        }
      }
    }
    return results;
  }

  _updateChallenge(hit) {
    const challenge = CONFIG.CHALLENGE_TARGETS[this.challengeIndex % CONFIG.CHALLENGE_TARGETS.length];

    if (challenge.consecutive) {
      // Consecutive challenge: track streak separately
      if (hit.score >= CONFIG.COMBO_BULLSEYE_THRESHOLD) {
        this.challengeConsecutive++;
        if (this.challengeConsecutive >= challenge.count) {
          // Challenge complete
          this.challengeIndex++;
          this.challengeProgress = 0;
          this.challengeConsecutive = 0;
        }
      } else {
        // Streak broken
        this.challengeConsecutive = 0;
      }
    } else {
      // Non-consecutive challenge: count individual hits
      let counted = false;
      if (challenge.type === 'bullseye' && hit.zone === 0) {
        counted = true;
      } else if (challenge.type === 'moving' && hit.type === 'moving') {
        counted = true;
      } else if (challenge.type === 'balloon' && hit.type === 'balloon') {
        counted = true;
      } else if (challenge.type === 'apple' && hit.type === 'apple') {
        counted = true;
      }

      if (counted) {
        this.challengeProgress++;
        if (this.challengeProgress >= challenge.count) {
          this.challengeIndex++;
          this.challengeProgress = 0;
          this.challengeConsecutive = 0;
        }
      }
    }
  }

  draw(ctx) {
    for (const target of this.targets) {
      target.draw(ctx);
    }
  }

  getCurrentChallenge() {
    if (this.mode !== 'CHALLENGE') return null;
    return CONFIG.CHALLENGE_TARGETS[this.challengeIndex % CONFIG.CHALLENGE_TARGETS.length];
  }

  getChallengeProgress() {
    return this.challengeProgress;
  }

  reset() {
    this.targets = [];
    this.spawnTimer = 0;
    this.challengeIndex = 0;
    this.challengeProgress = 0;
    this.challengeConsecutive = 0;
  }
}
