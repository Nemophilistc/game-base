// ============================================================
// 末日幸存者 - 玩家逻辑
// ============================================================

import { CONFIG, game, state, keys } from './config.js';
import { Particle, addDamageNumber, spawnParticle } from './items.js';

export class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.size = CONFIG.PLAYER_SIZE;
        this.speed = CONFIG.PLAYER_SPEED;
        this.hp = CONFIG.PLAYER_MAX_HP;
        this.maxHp = CONFIG.PLAYER_MAX_HP;
        this.exp = 0;
        this.level = 1;
        this.expToNext = CONFIG.EXP_PER_LEVEL;
        this.invincible = 0;
        this.weapons = [];
        this.upgrades = {};
        this.moveTimer = 0;
    }

    update() {
        // 移动
        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

        // 归一化对角线移动
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // 限制在地图范围内
        this.x = Math.max(-2000, Math.min(2000, this.x));
        this.y = Math.max(-2000, Math.min(2000, this.y));

        // 无敌时间
        if (this.invincible > 0) this.invincible--;

        // 移动时生成风粒子效果
        if (dx !== 0 || dy !== 0) {
            this.moveTimer++;
            if (this.moveTimer % 3 === 0) {
                const particle = new Particle(
                    this.x - dx * 15 + (Math.random() - 0.5) * 10,
                    this.y - dy * 15 + (Math.random() - 0.5) * 10,
                    '#87ceeb',
                    'wind'
                );
                particle.vx = -dx * (2 + Math.random() * 2) + (Math.random() - 0.5) * 1;
                particle.vy = -dy * (2 + Math.random() * 2) + (Math.random() - 0.5) * 1;
                state.particles.push(particle);
            }
        }

        // 更新武器
        this.weapons.forEach(w => w.update(this));
    }

    draw() {
        const ctx = game.ctx;
        ctx.save();

        // 无敌闪烁
        if (this.invincible > 0 && this.invincible % 4 < 2) {
            ctx.globalAlpha = 0.5;
        }

        // 移动方向
        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

        // 移动残影
        if (dx !== 0 || dy !== 0) {
            ctx.globalAlpha = 0.15;
            this.drawCharacterBody(this.x - dx * 10, this.y - dy * 10, 0.9);
            ctx.globalAlpha = 0.08;
            this.drawCharacterBody(this.x - dx * 20, this.y - dy * 20, 0.8);
            ctx.globalAlpha = 1;
        }

        // 外发光
        const glowSize = this.size * 3;
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.size * 0.5,
            this.x, this.y, glowSize
        );
        gradient.addColorStop(0, 'rgba(78, 205, 196, 0.25)');
        gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // 绘制角色身体
        this.drawCharacterBody(this.x, this.y, 1);

        // 武器效果
        this.weapons.forEach(w => w.draw(this));

        ctx.restore();
    }

    drawCharacterBody(x, y, scale) {
        const ctx = game.ctx;
        const s = this.size * scale;
        const time = Date.now() / 200;
        const isMoving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                         keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];

        // 计算朝向角度
        let faceAngle = 0;
        if (isMoving) {
            let fdx = 0, fdy = 0;
            if (keys['KeyW'] || keys['ArrowUp']) fdy = -1;
            if (keys['KeyS'] || keys['ArrowDown']) fdy = 1;
            if (keys['KeyA'] || keys['ArrowLeft']) fdx = -1;
            if (keys['KeyD'] || keys['ArrowRight']) fdx = 1;
            faceAngle = Math.atan2(fdy, fdx);
        }

        ctx.save();
        ctx.translate(x, y);

        // 身体（椭圆形）
        ctx.fillStyle = '#3db8b0';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.7, s * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 身体高光
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.ellipse(-s * 0.15, -s * 0.2, s * 0.45, s * 0.6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 头部
        ctx.fillStyle = '#5dd8d0';
        ctx.beginPath();
        ctx.arc(0, -s * 0.65, s * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 头发（动感）
        ctx.fillStyle = '#2a9d8f';
        const hairWave = isMoving ? Math.sin(time) * 3 : 0;
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, -s * 0.9);
        ctx.quadraticCurveTo(-s * 0.2, -s * 1.3 + hairWave, 0, -s * 1.1);
        ctx.quadraticCurveTo(s * 0.2, -s * 1.3 - hairWave, s * 0.4, -s * 0.9);
        ctx.quadraticCurveTo(s * 0.3, -s * 0.7, 0, -s * 0.7);
        ctx.quadraticCurveTo(-s * 0.3, -s * 0.7, -s * 0.4, -s * 0.9);
        ctx.fill();

        // 眼睛
        const eyeOffsetX = Math.cos(faceAngle) * s * 0.15;
        const eyeOffsetY = Math.sin(faceAngle) * s * 0.1;

        // 左眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-s * 0.2 + eyeOffsetX, -s * 0.7 + eyeOffsetY, s * 0.15, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-s * 0.18 + eyeOffsetX * 1.2, -s * 0.7 + eyeOffsetY, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // 右眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(s * 0.2 + eyeOffsetX, -s * 0.7 + eyeOffsetY, s * 0.15, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(s * 0.22 + eyeOffsetX * 1.2, -s * 0.7 + eyeOffsetY, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴（微笑）
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -s * 0.55, s * 0.12, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // 腿部动画
        const legSwing = isMoving ? Math.sin(time) * 0.4 : 0;

        // 左腿
        ctx.fillStyle = '#2a9d8f';
        ctx.save();
        ctx.translate(-s * 0.25, s * 0.7);
        ctx.rotate(legSwing);
        ctx.fillRect(-s * 0.12, 0, s * 0.24, s * 0.5);
        // 鞋子
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-s * 0.15, s * 0.45, s * 0.3, s * 0.12);
        ctx.restore();

        // 右腿
        ctx.fillStyle = '#2a9d8f';
        ctx.save();
        ctx.translate(s * 0.25, s * 0.7);
        ctx.rotate(-legSwing);
        ctx.fillRect(-s * 0.12, 0, s * 0.24, s * 0.5);
        // 鞋子
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-s * 0.15, s * 0.45, s * 0.3, s * 0.12);
        ctx.restore();

        // 手臂动画
        const armSwing = isMoving ? Math.sin(time + Math.PI) * 0.5 : 0;

        // 左臂
        ctx.fillStyle = '#3db8b0';
        ctx.save();
        ctx.translate(-s * 0.6, -s * 0.2);
        ctx.rotate(armSwing);
        ctx.fillRect(-s * 0.1, 0, s * 0.2, s * 0.45);
        // 手
        ctx.fillStyle = '#5dd8d0';
        ctx.beginPath();
        ctx.arc(0, s * 0.5, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 右臂
        ctx.fillStyle = '#3db8b0';
        ctx.save();
        ctx.translate(s * 0.6, -s * 0.2);
        ctx.rotate(-armSwing);
        ctx.fillRect(-s * 0.1, 0, s * 0.2, s * 0.45);
        // 手
        ctx.fillStyle = '#5dd8d0';
        ctx.beginPath();
        ctx.arc(0, s * 0.5, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;

        this.hp -= amount;
        this.invincible = 30; // 0.5秒无敌
        game.shake.intensity = 8;

        // 伤害数字
        addDamageNumber(this.x, this.y - 30, amount, '#ff6b6b');

        // 受伤粒子效果
        for (let i = 0; i < 10; i++) {
            spawnParticle(this.x, this.y, '#ff6b6b', 'normal');
        }

        // 屏幕闪烁效果
        game.flashColor = 'rgba(255, 0, 0, 0.3)';
        game.flashTimer = 10;

        if (this.hp <= 0) {
            // gameOver 由 main.js 注入
            if (this._onDeath) this._onDeath();
        }
    }

    addExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.expToNext = Math.floor(CONFIG.EXP_PER_LEVEL * Math.pow(CONFIG.EXP_GROWTH, this.level - 1));
            // levelUp 由 main.js 注入
            if (this._onLevelUp) this._onLevelUp();
        }
        // updateHUD 由 main.js 注入
        if (this._updateHUD) this._updateHUD();
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
}
