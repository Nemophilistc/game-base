// ============================================================
// 末日幸存者 - 敌人系统
// ============================================================

import { CONFIG, game, state } from './config.js';
import { spawnExpOrb, spawnParticle, addDamageNumber } from './items.js';

export class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = CONFIG.ENEMY_SIZE;
        this.speed = 1.5;
        this.hp = 20;
        this.maxHp = 20;
        this.damage = 10;
        this.exp = 10;
        this.color = '#ff6b6b';
        this.hitFlash = 0;
        this.attackCooldown = 0;
        this.shootTimer = 0;

        this.initType();
    }

    initType() {
        const hpMult = 1 + (game.difficulty - 1) * 0.2;

        switch (this.type) {
            case 'fast':
                this.speed = 2.5;
                this.hp = Math.floor(8 * hpMult);
                this.maxHp = this.hp;
                this.color = '#ffa502';
                this.size = 12;
                break;
            case 'tank':
                this.speed = 0.8;
                this.hp = Math.floor(30 * hpMult);
                this.maxHp = this.hp;
                this.damage = 12;
                this.exp = 20;
                this.color = '#8B4513';
                this.size = 22;
                break;
            case 'ranged':
                this.speed = 1;
                this.hp = Math.floor(12 * hpMult);
                this.maxHp = this.hp;
                this.damage = 10;
                this.exp = 15;
                this.color = '#9b59b6';
                this.shootTimer = 0;
                break;
            case 'boss':
                this.speed = 0.6;
                this.hp = Math.floor(150 * hpMult);
                this.maxHp = this.hp;
                this.damage = 20;
                this.exp = 100;
                this.color = '#e74c3c';
                this.size = 40;
                break;
            default:
                this.hp = Math.floor(10 * hpMult);
                this.maxHp = this.hp;
                this.damage = 6;
                break;
        }
    }

    update() {
        const player = state.player;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        // 碰撞玩家
        if (dist < this.size + player.size) {
            if (this.attackCooldown <= 0) {
                player.takeDamage(this.damage);
                this.attackCooldown = 60;
            }
        }
        if (this.attackCooldown > 0) this.attackCooldown--;

        // 远程敌人射击（通过注入的静态方法调用，避免循环依赖）
        if (this.type === 'ranged') {
            this.shootTimer++;
            if (this.shootTimer >= 120) {
                this.shootTimer = 0;
                if (dist < 300 && Enemy._spawnEnemyProjectile) {
                    Enemy._spawnEnemyProjectile(this.x, this.y, dx / dist, dy / dist);
                }
            }
        }

        if (this.hitFlash > 0) this.hitFlash--;
    }

    draw() {
        const ctx = game.ctx;
        ctx.save();

        if (this.hitFlash > 0) {
            const scale = 1 + (this.hitFlash / 10);
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.translate(-this.x, -this.y);
        }

        this.drawEnemyBody();

        // 血条
        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2.5;
            const barHeight = 5;
            const bx = this.x - barWidth / 2;
            const by = this.y - this.size - 15;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(bx - 1, by - 1, barWidth + 2, barHeight + 2);

            const hpPercent = this.hp / this.maxHp;
            let hpColor;
            if (hpPercent > 0.6) hpColor = '#4ecdc4';
            else if (hpPercent > 0.3) hpColor = '#ffa502';
            else hpColor = '#ff6b6b';

            const hpGradient = ctx.createLinearGradient(bx, by, bx + barWidth * hpPercent, by);
            hpGradient.addColorStop(0, hpColor);
            hpGradient.addColorStop(1, hpColor + '80');
            ctx.fillStyle = hpGradient;
            ctx.fillRect(bx, by, barWidth * hpPercent, barHeight);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(bx, by, barWidth * hpPercent, barHeight / 2);
        }

        ctx.restore();
    }

    drawEnemyBody() {
        const time = Date.now() / 300;
        const s = this.size;

        switch (this.type) {
            case 'normal': this.drawNormalEnemy(s, time); break;
            case 'fast': this.drawFastEnemy(s, time); break;
            case 'tank': this.drawTankEnemy(s, time); break;
            case 'ranged': this.drawRangedEnemy(s, time); break;
            case 'boss': this.drawBossEnemy(s, time); break;
        }
    }

    drawNormalEnemy(s, time) {
        const ctx = game.ctx;
        const player = state.player;

        ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, s * 0.8, s, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#ddd' : '#cc4444';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + s * 0.1, s * 0.6, s * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        const lookX = Math.atan2(player.y - this.y, player.x - this.x);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x - s * 0.25, this.y - s * 0.2, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - s * 0.25 + Math.cos(lookX) * s * 0.05, this.y - s * 0.2 + Math.sin(lookX) * s * 0.05, s * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x + s * 0.25, this.y - s * 0.2, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + s * 0.25 + Math.cos(lookX) * s * 0.05, this.y - s * 0.2 + Math.sin(lookX) * s * 0.05, s * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#880000';
        ctx.beginPath();
        ctx.moveTo(this.x - s * 0.3, this.y + s * 0.3);
        for (let i = 0; i < 5; i++) {
            const px = this.x - s * 0.3 + (s * 0.6 / 5) * (i + 0.5);
            const py = this.y + s * 0.3 + (i % 2 === 0 ? s * 0.15 : 0);
            ctx.lineTo(px, py);
        }
        ctx.lineTo(this.x + s * 0.3, this.y + s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    drawFastEnemy(s, time) {
        const ctx = game.ctx;

        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x - this.speed * 3, this.y, s * 0.6, s * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + s, this.y);
        ctx.quadraticCurveTo(this.x, this.y - s * 0.8, this.x - s * 0.8, this.y);
        ctx.quadraticCurveTo(this.x, this.y + s * 0.8, this.x + s, this.y);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + s * 0.3, this.y - s * 0.1, s * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + s * 0.35, this.y - s * 0.1, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const offset = Math.sin(time + i) * s * 0.3;
            ctx.beginPath();
            ctx.moveTo(this.x - s * 0.5, this.y + offset);
            ctx.lineTo(this.x - s * 1.5, this.y + offset);
            ctx.stroke();
        }
    }

    drawTankEnemy(s, time) {
        const ctx = game.ctx;

        ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#8B4513';
        const armorSize = s * 1.1;
        ctx.fillRect(this.x - armorSize, this.y - armorSize * 0.8, armorSize * 2, armorSize * 1.6);

        ctx.fillStyle = this.hitFlash > 0 ? '#ddd' : '#6B3410';
        ctx.fillRect(this.x - armorSize * 0.8, this.y - armorSize * 0.6, armorSize * 1.6, armorSize * 1.2);

        ctx.fillStyle = '#4a2800';
        const rivetPositions = [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5], [-0.7, 0], [0.7, 0]];
        rivetPositions.forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(this.x + s * rx, this.y + s * ry, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(this.x - s * 0.4, this.y - s * 0.3, s * 0.25, s * 0.15);
        ctx.fillRect(this.x + s * 0.15, this.y - s * 0.3, s * 0.25, s * 0.15);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - s * 0.35, this.y - s * 0.27, s * 0.15, s * 0.09);
        ctx.fillRect(this.x + s * 0.2, this.y - s * 0.27, s * 0.15, s * 0.09);

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - s * 0.4, this.y + s * 0.1, s * 0.8, s * 0.3);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - s * 0.4, this.y + s * 0.1 + (s * 0.3 / 4) * (i + 1));
            ctx.lineTo(this.x + s * 0.4, this.y + s * 0.1 + (s * 0.3 / 4) * (i + 1));
            ctx.stroke();
        }
    }

    drawRangedEnemy(s, time) {
        const ctx = game.ctx;
        const magicGlow = 0.3 + Math.sin(time * 2) * 0.2;

        ctx.strokeStyle = `rgba(155, 89, 182, ${magicGlow})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, s * 1.3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - s);
        ctx.quadraticCurveTo(this.x + s * 0.8, this.y - s * 0.5, this.x + s * 0.6, this.y + s * 0.3);
        ctx.quadraticCurveTo(this.x + s * 0.4, this.y + s, this.x, this.y + s * 0.8);
        ctx.quadraticCurveTo(this.x - s * 0.4, this.y + s, this.x - s * 0.6, this.y + s * 0.3);
        ctx.quadraticCurveTo(this.x - s * 0.8, this.y - s * 0.5, this.x, this.y - s);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x - s * 0.2, this.y - s * 0.2, s * 0.18, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(this.x - s * 0.2, this.y - s * 0.2, s * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x + s * 0.2, this.y - s * 0.2, s * 0.18, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(this.x + s * 0.2, this.y - s * 0.2, s * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(155, 89, 182, ${0.5 + Math.sin(time * 3) * 0.3})`;
        ctx.lineWidth = 1.5;
        const runeAngle = time * 2;
        for (let i = 0; i < 3; i++) {
            const angle = runeAngle + (Math.PI * 2 / 3) * i;
            const rx = this.x + Math.cos(angle) * s * 0.6;
            const ry = this.y + Math.sin(angle) * s * 0.6;
            ctx.beginPath();
            ctx.arc(rx, ry, s * 0.08, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawBossEnemy(s, time) {
        const ctx = game.ctx;
        const player = state.player;

        ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + Math.sin(time * 2) * 0.1})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, s * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#c0392b';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - s * 1.2);
        ctx.quadraticCurveTo(this.x + s * 0.8, this.y - s * 0.8, this.x + s, this.y);
        ctx.quadraticCurveTo(this.x + s * 0.9, this.y + s * 0.8, this.x, this.y + s);
        ctx.quadraticCurveTo(this.x - s * 0.9, this.y + s * 0.8, this.x - s, this.y);
        ctx.quadraticCurveTo(this.x - s * 0.8, this.y - s * 0.8, this.x, this.y - s * 1.2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#ddd' : '#992222';
        ctx.beginPath();
        ctx.moveTo(this.x - s * 0.6, this.y - s * 0.3);
        ctx.quadraticCurveTo(this.x - s * 1.8, this.y - s * 1.5, this.x - s * 1.5, this.y + s * 0.2);
        ctx.quadraticCurveTo(this.x - s * 1.2, this.y + s * 0.5, this.x - s * 0.5, this.y);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x + s * 0.6, this.y - s * 0.3);
        ctx.quadraticCurveTo(this.x + s * 1.8, this.y - s * 1.5, this.x + s * 1.5, this.y + s * 0.2);
        ctx.quadraticCurveTo(this.x + s * 1.2, this.y + s * 0.5, this.x + s * 0.5, this.y);
        ctx.fill();

        const lookX = Math.atan2(player.y - this.y, player.x - this.x);

        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.ellipse(this.x - s * 0.35, this.y - s * 0.3, s * 0.22, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - s * 0.35 + Math.cos(lookX) * s * 0.05, this.y - s * 0.3 + Math.sin(lookX) * s * 0.05, s * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - s * 0.35 + Math.cos(lookX) * s * 0.08, this.y - s * 0.3 + Math.sin(lookX) * s * 0.08, s * 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.ellipse(this.x + s * 0.35, this.y - s * 0.3, s * 0.22, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + s * 0.35 + Math.cos(lookX) * s * 0.05, this.y - s * 0.3 + Math.sin(lookX) * s * 0.05, s * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + s * 0.35 + Math.cos(lookX) * s * 0.08, this.y - s * 0.3 + Math.sin(lookX) * s * 0.08, s * 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#880000';
        ctx.beginPath();
        ctx.moveTo(this.x - s * 0.5, this.y + s * 0.2);
        for (let i = 0; i < 7; i++) {
            const px = this.x - s * 0.5 + (s / 7) * (i + 0.5);
            const py = this.y + s * 0.2 + (i % 2 === 0 ? s * 0.25 : s * 0.05);
            ctx.lineTo(px, py);
        }
        ctx.lineTo(this.x + s * 0.5, this.y + s * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(this.x - s * 0.4, this.y - s * 0.8);
        ctx.lineTo(this.x - s * 0.7, this.y - s * 1.6);
        ctx.lineTo(this.x - s * 0.2, this.y - s * 0.9);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x + s * 0.4, this.y - s * 0.8);
        ctx.lineTo(this.x + s * 0.7, this.y - s * 1.6);
        ctx.lineTo(this.x + s * 0.2, this.y - s * 0.9);
        ctx.fill();

        if (Math.random() < 0.3) {
            spawnParticle(
                this.x + (Math.random() - 0.5) * s,
                this.y - s * 0.5,
                '#ff6b35',
                'fire'
            );
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlash = 5;
        addDamageNumber(this.x, this.y - 20, amount, '#ffd700');

        for (let i = 0; i < 5; i++) {
            spawnParticle(this.x, this.y, this.color, 'normal');
        }

        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        game.kills++;

        const expCount = Math.ceil(this.exp / 3);
        for (let i = 0; i < expCount; i++) {
            spawnExpOrb(this.x, this.y, Math.ceil(this.exp / expCount));
        }

        for (let i = 0; i < 20; i++) {
            spawnParticle(this.x, this.y, this.color, 'normal');
        }
        for (let i = 0; i < 8; i++) {
            spawnParticle(this.x, this.y, '#4ecdc4', 'exp');
        }

        switch (this.type) {
            case 'boss':
                for (let i = 0; i < 30; i++) spawnParticle(this.x, this.y, '#ff6b35', 'fire');
                for (let i = 0; i < 20; i++) spawnParticle(this.x, this.y, '#ffd700', 'lightning');
                break;
            case 'tank':
                for (let i = 0; i < 15; i++) spawnParticle(this.x, this.y, '#8B4513', 'normal');
                break;
            case 'fast':
                for (let i = 0; i < 10; i++) spawnParticle(this.x, this.y, '#ffa502', 'wind');
                break;
            case 'ranged':
                for (let i = 0; i < 12; i++) spawnParticle(this.x, this.y, '#9b59b6', 'lightning');
                break;
        }
    }
}

// 静态属性，由 main.js 注入以避免循环依赖
Enemy._spawnEnemyProjectile = null;

// ============================================================
// 敌人生成
// ============================================================
export function spawnEnemy() {
    const player = state.player;
    const angle = Math.random() * Math.PI * 2;
    const dist = 500 + Math.random() * 200;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    let type = 'normal';
    const rand = Math.random();
    if (rand < 0.05 * game.difficulty) type = 'boss';
    else if (rand < 0.12) type = 'tank';
    else if (rand < 0.25) type = 'fast';
    else if (rand < 0.35) type = 'ranged';

    state.enemies.push(new Enemy(x, y, type));
}
