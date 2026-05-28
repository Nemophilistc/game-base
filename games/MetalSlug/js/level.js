// ============================================
// MetalSlug 关卡系统
// ============================================

import { LEVELS, GROUND_Y, CANVAS_HEIGHT } from './config.js';
import { soundManager } from './sound.js';

class Destructible {
    constructor(config) {
        this.type = config.type;
        this.x = config.x;
        this.y = GROUND_Y - (config.type === 'barrel' ? 40 : 80);
        this.width = config.type === 'barrel' ? 30 : 60;
        this.height = config.type === 'barrel' ? 40 : 80;
        this.hp = config.hp || (config.type === 'barrel' ? 20 : 100);
        this.maxHP = this.hp;
        this.explosive = config.explosive || false;
        this.dead = false;
        this.deathTimer = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0 && !this.dead) {
            this.dead = true;
            this.deathTimer = 30;
            if (this.explosive) {
                soundManager.play('explosion');
            }
        }
    }

    update() {
        if (this.dead && this.deathTimer > 0) {
            this.deathTimer--;
        }
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;
        const drawY = this.y;

        if (this.dead) {
            // 销毁后的残骸
            ctx.fillStyle = '#333';
            ctx.globalAlpha = this.deathTimer / 30;
            ctx.fillRect(drawX - this.width / 2, drawY, this.width, this.height / 2);
            ctx.globalAlpha = 1;
            return;
        }

        ctx.save();

        if (this.type === 'barrel') {
            // 油桶
            ctx.fillStyle = this.explosive ? '#8B0000' : '#556B2F';
            ctx.beginPath();
            ctx.ellipse(drawX, drawY + 5, this.width / 2, this.height / 2 - 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 油桶标记
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.explosive ? '!' : '', drawX, drawY + 10);

            // 金属光泽
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(drawX, drawY + 5, this.width / 2, this.height / 2 - 5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 顶部
            ctx.fillStyle = '#777';
            ctx.beginPath();
            ctx.ellipse(drawX, drawY - this.height / 2 + 8, this.width / 2 - 2, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 建筑物
            ctx.fillStyle = '#696969';
            ctx.fillRect(drawX - this.width / 2, drawY, this.width, this.height);

            // 窗户
            ctx.fillStyle = '#2a2a3a';
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 2; col++) {
                    ctx.fillRect(
                        drawX - this.width / 2 + 8 + col * 25,
                        drawY + 8 + row * 22,
                        15, 12
                    );
                }
            }

            // 裂痕（受伤时）
            if (this.hp < this.maxHP * 0.5) {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(drawX - 10, drawY + 20);
                ctx.lineTo(drawX + 5, drawY + 40);
                ctx.lineTo(drawX - 5, drawY + 60);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }
}

export class Level {
    constructor(levelIndex) {
        this.levelIndex = levelIndex;
        this.config = LEVELS[levelIndex];
        this.platforms = this.config.platforms.map(p => ({ ...p }));
        this.destructibles = this.config.destructibles.map(d => new Destructible(d));
        this.width = this.config.width;
        this.bgColor = this.config.bgColor;
        this.groundColor = this.config.groundColor;
        this.name = this.config.name;

        // 背景装饰
        this.bgElements = this.generateBackground();
    }

    generateBackground() {
        const elements = [];
        const count = Math.floor(this.width / 200);

        for (let i = 0; i < count; i++) {
            const type = Math.random();
            const x = i * 200 + Math.random() * 100;

            if (type < 0.3) {
                // 远景建筑
                elements.push({
                    type: 'building',
                    x: x,
                    width: 40 + Math.random() * 60,
                    height: 80 + Math.random() * 120,
                    color: `rgba(60,60,80,${0.3 + Math.random() * 0.3})`
                });
            } else if (type < 0.5) {
                // 山丘
                elements.push({
                    type: 'hill',
                    x: x,
                    width: 100 + Math.random() * 150,
                    height: 40 + Math.random() * 60,
                    color: `rgba(40,50,40,${0.2 + Math.random() * 0.2})`
                });
            }
        }

        return elements;
    }

    update() {
        for (const d of this.destructibles) {
            d.update();
        }
    }

    drawBackground(ctx, cameraX) {
        // 绘制背景装饰（视差滚动）
        for (const el of this.bgElements) {
            const parallaxX = el.x - cameraX * 0.3;

            if (el.type === 'building') {
                ctx.fillStyle = el.color;
                ctx.fillRect(parallaxX, GROUND_Y - el.height, el.width, el.height);
            } else if (el.type === 'hill') {
                ctx.fillStyle = el.color;
                ctx.beginPath();
                ctx.moveTo(parallaxX - el.width / 2, GROUND_Y);
                ctx.quadraticCurveTo(parallaxX, GROUND_Y - el.height, parallaxX + el.width / 2, GROUND_Y);
                ctx.fill();
            }
        }

        // 绘制星星/远景
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + cameraX * 0.1) % 1200;
            const y = (i * 89) % 300;
            ctx.fillRect(x, y, 2, 2);
        }
    }

    drawGround(ctx, cameraX) {
        // 地面主体
        ctx.fillStyle = this.groundColor;
        ctx.fillRect(0, GROUND_Y, 1200, CANVAS_HEIGHT - GROUND_Y);

        // 地面纹理
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 60; i++) {
            const x = (i * 25 - cameraX * 0.5) % 1200;
            ctx.fillRect(x, GROUND_Y, 20, 3);
        }

        // 地面顶部高光
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, GROUND_Y, 1200, 2);
    }

    drawPlatforms(ctx, cameraX) {
        for (const p of this.platforms) {
            const drawX = p.x - cameraX;
            const drawY = p.y;

            // 平台主体
            ctx.fillStyle = '#5a5a6a';
            ctx.fillRect(drawX, drawY, p.w, p.h);

            // 平台顶部高光
            ctx.fillStyle = '#7a7a8a';
            ctx.fillRect(drawX, drawY, p.w, 3);

            // 平台阴影
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(drawX, drawY + p.h, p.w, 5);

            // 铆钉装饰
            ctx.fillStyle = '#888';
            for (let i = 0; i < p.w; i += 20) {
                ctx.beginPath();
                ctx.arc(drawX + i + 10, drawY + p.h / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawDestructibles(ctx, cameraX) {
        for (const d of this.destructibles) {
            d.draw(ctx, cameraX);
        }
    }

    getPlatforms() {
        return this.platforms;
    }

    getDestructibles() {
        return this.destructibles;
    }

    getEnemySpawns() {
        return this.config.enemies.map(e => ({ ...e }));
    }

    getItemSpawns() {
        return this.config.items.map(i => ({ ...i }));
    }

    getBossSpawn() {
        return this.config.boss ? { ...this.config.boss } : null;
    }

    removeDestructible(destructible) {
        const idx = this.destructibles.indexOf(destructible);
        if (idx !== -1) {
            this.destructibles.splice(idx, 1);
        }
    }
}
