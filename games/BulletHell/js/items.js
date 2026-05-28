import { CONFIG } from './config.js';
import { Sound } from './sound.js';

// ============================================================
// 道具类型定义
// ============================================================
export const POWERUP_TYPES = [
    { id: 'shield', name: '护盾', color: '#00bcd4', icon: '🛡️' },
    { id: 'fireRate', name: '攻速', color: '#ff9800', icon: '⚡' },
    { id: 'spread', name: '散弹', color: '#ffc107', icon: '🔥' },
    { id: 'tracking', name: '追踪', color: '#9c27b0', icon: '💜' },
    { id: 'heal', name: '回血', color: '#4caf50', icon: '❤️' },
    { id: 'bomb', name: '炸弹', color: '#f44336', icon: '💣' }
];

// ============================================================
// 道具
// ============================================================
export class Powerup {
    constructor(x, y, type, playerRef, gameRef, particlesRef) {
        this.x = x; this.y = y; this.type = type;
        this.size = 12; this.vy = -2; this.life = 600; this.magnetized = false;
        this._player = playerRef;
        this._game = gameRef;
        this._particles = particlesRef;
    }

    update() {
        const player = this._player;
        if (!player) return false;
        this.life--;
        if (this.vy < 1) this.vy += 0.1;
        const d = Math.hypot(player.x - this.x, player.y - this.y);
        if (d < CONFIG.POWERUP_MAGNET) this.magnetized = true;
        if (this.magnetized && d > player.size) {
            this.x += (player.x - this.x) * 0.08;
            this.y += (player.y - this.y) * 0.08;
        }
        if (d < player.size + this.size) {
            applyPowerup(this.type, player, this._game);
            Sound.play('pickup');
            for (let i = 0; i < 8; i++) spawnParticle(this.x, this.y, this.type.color, 'normal', this._particles);
            return false;
        }
        return this.life > 0;
    }

    draw(ctx) {
        const pulse = 0.8 + Math.sin(Date.now() / 200) * 0.2;
        ctx.globalAlpha = this.life < 120 ? (this.life / 120) * 0.5 + 0.5 : 1;
        ctx.fillStyle = this.type.color + '40';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

export function spawnPowerup(x, y, playerRef, gameRef, particlesRef, powerupsRef) {
    const t = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    powerupsRef.push(new Powerup(x, y, t, playerRef, gameRef, particlesRef));
}

export function applyPowerup(type, player, game) {
    switch (type.id) {
        case 'shield': player.shield = Math.min(3, player.shield + 1); break;
        case 'fireRate': game.activeEffects.fireRate = 600; break;
        case 'spread': game.activeEffects.spread = 600; break;
        case 'tracking': game.activeEffects.tracking = 600; break;
        case 'heal': player.hp = Math.min(player.maxHp, player.hp + 30); break;
        case 'bomb': game.bombs = Math.min(5, game.bombs + 1); break;
    }
}

// ============================================================
// 经验球
// ============================================================
export class ExpOrb {
    constructor(x, y, val) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.val = val;
        this.size = 5;
        this.mag = false;
        this._player = null;
    }

    setPlayerRef(playerRef) { this._player = playerRef; }

    update() {
        const player = this._player;
        if (!player) return false;
        const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy);
        if (d < 100) this.mag = true;
        if (this.mag && d > player.size) {
            this.x += dx / d * 8;
            this.y += dy / d * 8;
        }
        if (d < player.size + this.size) {
            player.addExp(this.val);
            return false;
        }
        return true;
    }

    draw(ctx) {
        const g = 0.5 + Math.sin(Date.now() / 200) * 0.3;
        ctx.fillStyle = `rgba(0,212,255,${g})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================
// 粒子
// ============================================================
export function spawnParticle(x, y, color, type, particlesRef) {
    particlesRef.push(new Particle(x, y, color, type));
}

export class Particle {
    constructor(x, y, color, type) {
        this.x = x; this.y = y;
        this.type = type || 'normal';
        this.color = color;
        this.life = 30; this.maxLife = 30;
        switch (this.type) {
            case 'fire':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = -Math.random() * 5 - 2;
                this.size = Math.random() * 6 + 3;
                this.life = 20 + Math.random() * 20;
                break;
            case 'lightning':
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
                this.size = Math.random() * 4 + 2;
                this.life = 10 + Math.random() * 10;
                break;
            default:
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.size = Math.random() * 4 + 2;
        }
        this.maxLife = this.life;
    }

    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.type === 'fire') { this.vy -= 0.1; this.size *= 0.98; }
        else if (this.type === 'lightning') { this.vx *= 0.9; this.vy *= 0.9; }
        else { this.vx *= 0.95; this.vy *= 0.95; }
        this.life--;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// 伤害数字
// ============================================================
export function addDmgNum(x, y, val, color, dmgNumsRef) {
    dmgNumsRef.push(new DmgNum(x, y, val, color));
}

export class DmgNum {
    constructor(x, y, val, color) {
        this.x = x; this.y = y;
        this.val = val; this.color = color;
        this.life = 40; this.vy = -2;
    }

    update() {
        this.y += this.vy; this.vy *= 0.95; this.life--;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / 40;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(typeof this.val === 'number' ? Math.floor(this.val) : this.val, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}
