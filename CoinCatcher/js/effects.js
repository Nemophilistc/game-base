// effects.js - Particles, screen shake, combo effects

import { GAME_WIDTH, GAME_HEIGHT, SHAKE_DURATION, SHAKE_INTENSITY } from './config.js';

class Particle {
    constructor(x, y, vx, vy, color, size, life, gravity = 200) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.alive = true;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 10;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.alive = false;
            return;
        }
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotSpeed * dt;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const scale = 0.5 + alpha * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size * scale / 2, -this.size * scale / 2, this.size * scale, this.size * scale);
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color, size = 20, duration = 1.0) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = duration;
        this.maxLife = duration;
        this.alive = true;
        this.vy = -80;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.alive = false;
            return;
        }
        this.y += this.vy * dt;
        this.vy *= 0.98;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const scale = 0.8 + (1 - this.life / this.maxLife) * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${this.size * scale}px "Segoe UI", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillText(this.text, this.x, this.y);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

export class Effects {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.comboFlash = 0;
        this.comboFlashColor = '#FFD700';
        this.slowFlash = 0;
    }

    spawnCatchParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 100 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 50;
            const size = 3 + Math.random() * 4;
            const life = 0.4 + Math.random() * 0.4;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }

    spawnDiamondParticles(x, y) {
        const colors = ['#B3E5FC', '#00E5FF', '#00B8D4', '#FFFFFF', '#80DEEA'];
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const speed = 120 + Math.random() * 180;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 80;
            const size = 2 + Math.random() * 5;
            const life = 0.5 + Math.random() * 0.5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 100));
        }
    }

    spawnBombExplosion(x, y) {
        const colors = ['#FF5722', '#FF9800', '#FFEB3B', '#F44336', '#333333', '#666666'];
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 300;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100;
            const size = 4 + Math.random() * 8;
            const life = 0.5 + Math.random() * 0.8;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 300));
        }
        // Smoke
        for (let i = 0; i < 8; i++) {
            const vx = (Math.random() - 0.5) * 60;
            const vy = -50 - Math.random() * 80;
            this.particles.push(new Particle(x + (Math.random() - 0.5) * 20, y, vx, vy, 'rgba(80,80,80,0.6)', 10 + Math.random() * 15, 1 + Math.random(), -20));
        }
    }

    spawnPowerUpParticles(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14;
            const speed = 80 + Math.random() * 120;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 3 + Math.random() * 3;
            this.particles.push(new Particle(x, y, vx, vy, color, size, 0.6 + Math.random() * 0.4, 0));
        }
    }

    spawnComboParticles(x, y, comboLevel) {
        const colors = ['#FFD700', '#FFA000', '#FF6F00', '#FF3D00'];
        const count = 8 + comboLevel * 4;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 150;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 60;
            const size = 2 + Math.random() * 4;
            const color = colors[Math.min(comboLevel, colors.length - 1)];
            this.particles.push(new Particle(x, y, vx, vy, color, size, 0.4 + Math.random() * 0.3, 100));
        }
    }

    addFloatingText(x, y, text, color, size = 20) {
        this.floatingTexts.push(new FloatingText(x, y, text, color, size));
    }

    startShake(intensity = SHAKE_INTENSITY, duration = SHAKE_DURATION) {
        this.shakeTimer = duration / 1000;
        this.shakeIntensity = intensity;
    }

    triggerComboFlash(combo) {
        this.comboFlash = 0.4;
        if (combo >= 10) this.comboFlashColor = '#FF3D00';
        else if (combo >= 6) this.comboFlashColor = '#FF6F00';
        else if (combo >= 3) this.comboFlashColor = '#FFA000';
        else this.comboFlashColor = '#FFD700';
    }

    triggerSlowFlash() {
        this.slowFlash = 0.3;
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(dt);
            if (!this.floatingTexts[i].alive) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const progress = this.shakeTimer / (SHAKE_DURATION / 1000);
            this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity * progress;
            this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity * progress;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }

        // Combo flash
        if (this.comboFlash > 0) {
            this.comboFlash -= dt;
        }

        // Slow flash
        if (this.slowFlash > 0) {
            this.slowFlash -= dt;
        }
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }

    drawFloatingTexts(ctx) {
        for (const ft of this.floatingTexts) {
            ft.draw(ctx);
        }
    }

    drawScreenEffects(ctx) {
        // Combo flash
        if (this.comboFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.comboFlash * 0.2;
            ctx.fillStyle = this.comboFlashColor;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.restore();
        }

        // Slow debuff flash
        if (this.slowFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.slowFlash * 0.15;
            ctx.fillStyle = '#795548';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTimer = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.comboFlash = 0;
        this.slowFlash = 0;
    }
}
