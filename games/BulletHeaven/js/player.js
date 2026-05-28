// ============================================================
// player.js - 玩家类（移动、受伤、无敌帧、属性）
// ============================================================

import { PLAYER_CONFIG, GAME } from './config.js';
import { sound } from './sound.js';

export class Player {
    constructor() {
        this.x = GAME.WORLD_WIDTH / 2;
        this.y = GAME.WORLD_HEIGHT / 2;
        this.radius = PLAYER_CONFIG.RADIUS;
        this.speed = PLAYER_CONFIG.SPEED;
        this.hp = PLAYER_CONFIG.MAX_HP;
        this.maxHp = PLAYER_CONFIG.MAX_HP;
        this.pickupRange = PLAYER_CONFIG.PICKUP_RANGE;
        this.magnetRange = PLAYER_CONFIG.XP_MAGNET_RANGE;
        this.magnetActive = false;
        this.xp = 0;
        this.level = 1;
        this.xpMultiplier = 1.0;
        this.mightMultiplier = 1.0;
        this.cooldownMultiplier = 1.0;
        this.areaMultiplier = 1.0;
        this.projectileBonus = 0;
        this.armor = 0;
        this.regenRate = 0;
        this.regenTimer = 0;
        this.revives = 0;
        this.curseLevel = 0;
        this.rerolls = 0;

        this.invincibleUntil = 0;
        this.hitFlash = 0;
        this.alive = true;
        this.facingAngle = 0;

        this.input = { up: false, down: false, left: false, right: false };
    }

    update(dt) {
        if (!this.alive) return;

        // 移动
        let dx = 0, dy = 0;
        if (this.input.up) dy -= 1;
        if (this.input.down) dy += 1;
        if (this.input.left) dx -= 1;
        if (this.input.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
            this.x += dx * this.speed;
            this.y += dy * this.speed;
            this.facingAngle = Math.atan2(dy, dx);
        }

        // 边界限制
        this.x = Math.max(this.radius, Math.min(GAME.WORLD_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(GAME.WORLD_HEIGHT - this.radius, this.y));

        // 生命恢复
        if (this.regenRate > 0) {
            this.regenTimer += dt;
            if (this.regenTimer >= 1000) {
                this.regenTimer -= 1000;
                this.hp = Math.min(this.hp + this.regenRate, this.maxHp);
            }
        }

        // 受伤闪烁衰减
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
        }
    }

    takeDamage(amount) {
        if (!this.alive) return false;
        if (Date.now() < this.invincibleUntil) return false;

        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;
        this.hitFlash = 200;
        this.invincibleUntil = Date.now() + PLAYER_CONFIG.INVINCIBLE_TIME;
        sound.hit();

        if (this.hp <= 0) {
            if (this.revives > 0) {
                this.revives--;
                this.hp = this.maxHp;
                this.invincibleUntil = Date.now() + 2000;
                return false;
            }
            this.alive = false;
        }
        return true;
    }

    addXP(amount) {
        this.xp += Math.floor(amount * this.xpMultiplier);
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        ctx.save();

        // 无敌闪烁
        if (Date.now() < this.invincibleUntil) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        }
        // 受伤闪红
        if (this.hitFlash > 0) {
            ctx.globalAlpha = 0.8;
        }

        // 身体
        const bodyGrad = ctx.createRadialGradient(sx, sy - 2, 0, sx, sy, this.radius);
        bodyGrad.addColorStop(0, '#ffcc88');
        bodyGrad.addColorStop(1, '#dd8844');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 衣服
        ctx.fillStyle = '#3355aa';
        ctx.beginPath();
        ctx.arc(sx, sy + 3, this.radius * 0.8, 0, Math.PI);
        ctx.fill();

        // 头部
        ctx.fillStyle = '#ffcc88';
        ctx.beginPath();
        ctx.arc(sx, sy - 5, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(sx - 3, sy - 6, 2, 0, Math.PI * 2);
        ctx.arc(sx + 3, sy - 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // 受伤闪红覆盖
        if (this.hitFlash > 0) {
            ctx.fillStyle = `rgba(255,0,0,${this.hitFlash / 300})`;
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius + 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 拾取范围指示
        if (this.magnetActive) {
            ctx.strokeStyle = 'rgba(100,200,255,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(sx, sy, this.magnetRange, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
