// ============================================================
// 末日幸存者 - 道具、经验球、粒子、伤害数字
// ============================================================

import { CONFIG, game, state } from './config.js';

// ============================================================
// 经验球
// ============================================================
export class ExpOrb {
    constructor(x, y, value) {
        this.x = x + (Math.random() - 0.5) * 30;
        this.y = y + (Math.random() - 0.5) * 30;
        this.value = value;
        this.size = 6;
        this.magnetized = false;
    }

    update() {
        const player = state.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 磁铁效果
        if (dist < CONFIG.ITEM_MAGNET_RANGE) {
            this.magnetized = true;
        }

        if (this.magnetized) {
            const speed = 8;
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        }

        // 收集
        if (dist < player.size + this.size) {
            player.addExp(this.value);
            return false;
        }

        return true;
    }

    draw() {
        const ctx = game.ctx;
        ctx.save();

        // 外发光效果
        const glowAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 3
        );
        gradient.addColorStop(0, `rgba(78, 205, 196, ${glowAlpha})`);
        gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // 经验球主体
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 内核高光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 旋转光环
        const angle = Date.now() / 500;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, angle, angle + Math.PI / 2);
        ctx.stroke();

        ctx.restore();
    }
}

// ============================================================
// 粒子系统
// ============================================================
export class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;

        switch (type) {
            case 'fire':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = -Math.random() * 5 - 2;
                this.size = Math.random() * 8 + 4;
                this.life = 20 + Math.random() * 20;
                this.maxLife = this.life;
                this.colors = ['#ff6b35', '#ff9500', '#ffcc00', '#ff4444'];
                break;
            case 'wind':
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 3;
                this.size = Math.random() * 6 + 2;
                this.life = 15 + Math.random() * 15;
                this.maxLife = this.life;
                this.colors = ['#87ceeb', '#add8e6', '#e0f0ff', '#ffffff'];
                break;
            case 'lightning':
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
                this.size = Math.random() * 5 + 2;
                this.life = 10 + Math.random() * 10;
                this.maxLife = this.life;
                this.colors = ['#ffd700', '#ffff00', '#00ffff', '#ffffff'];
                break;
            case 'exp':
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = -Math.random() * 2 - 1;
                this.size = Math.random() * 4 + 2;
                this.life = 25 + Math.random() * 15;
                this.maxLife = this.life;
                this.colors = ['#4ecdc4', '#44bd32', '#00ff88', '#ffffff'];
                break;
            default: // normal
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.size = Math.random() * 4 + 2;
                this.colors = [color];
                break;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        switch (this.type) {
            case 'fire':
                this.vy -= 0.1;
                this.size *= 0.98;
                this.vx *= 0.98;
                break;
            case 'wind':
                this.vx *= 0.97;
                this.vy *= 0.97;
                this.size *= 0.99;
                break;
            case 'lightning':
                this.vx *= 0.9;
                this.vy *= 0.9;
                break;
            default:
                this.vx *= 0.95;
                this.vy *= 0.95;
                break;
        }

        this.life--;
        return this.life > 0;
    }

    draw() {
        const ctx = game.ctx;
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;

        const colorIndex = Math.floor(Math.random() * this.colors.length);
        ctx.fillStyle = this.colors[colorIndex];

        switch (this.type) {
            case 'fire': {
                const fireSize = this.size * (1 + (1 - alpha) * 0.5);
                ctx.beginPath();
                ctx.arc(this.x, this.y, fireSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffff00';
                ctx.globalAlpha = alpha * 0.8;
                ctx.beginPath();
                ctx.arc(this.x, this.y, fireSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'wind':
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.size * 2, this.size, Math.atan2(this.vy, this.vx), 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'lightning':
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.random() * Math.PI * 2);
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 / 4) * i;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;
            default:
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.globalAlpha = 1;
    }
}

// ============================================================
// 伤害数字
// ============================================================
export class DamageNumber {
    constructor(x, y, value, color) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.color = color;
        this.life = 40;
        this.vy = -2;
    }

    update() {
        this.y += this.vy;
        this.vy *= 0.95;
        this.life--;
        return this.life > 0;
    }

    draw() {
        const ctx = game.ctx;
        ctx.globalAlpha = this.life / 40;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(this.value), this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// 辅助生成函数
// ============================================================
export function spawnExpOrb(x, y, value) {
    state.expOrbs.push(new ExpOrb(x, y, value));
}

export function spawnParticle(x, y, color, type = 'normal') {
    state.particles.push(new Particle(x, y, color, type));
}

export function addDamageNumber(x, y, value, color) {
    state.damageNumbers.push(new DamageNumber(x, y, value, color));
}

export function spawnLightningEffect(x1, y1, x2, y2) {
    const segments = 8;
    for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 25;
        const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 25;
        spawnParticle(x, y, '#ffd700', 'lightning');
    }
    for (let i = 0; i < 10; i++) {
        spawnParticle(x2, y2, '#00ffff', 'lightning');
    }
}

export function spawnAuraEffect(x, y, range) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        const px = x + Math.cos(angle) * range;
        const py = y + Math.sin(angle) * range;
        spawnParticle(px, py, '#4ecdc4', 'exp');
    }
}
