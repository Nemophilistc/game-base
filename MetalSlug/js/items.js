// ============================================
// MetalSlug 道具系统
// ============================================

import { ITEMS, GROUND_Y, WEAPONS } from './config.js';
import { soundManager } from './sound.js';

class Item {
    constructor(type, x, y) {
        const config = ITEMS[type];
        this.type = type;
        this.x = x;
        this.y = y || GROUND_Y - config.height;
        this.width = config.width;
        this.height = config.height;
        this.color = config.color;
        this.name = config.name;
        this.dead = false;
        this.bobTimer = Math.random() * Math.PI * 2;
        this.glowTimer = 0;
    }

    update() {
        this.bobTimer += 0.05;
        this.glowTimer += 0.1;
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;
        const bobOffset = Math.sin(this.bobTimer) * 3;
        const drawY = this.y + bobOffset;

        ctx.save();

        // 发光效果
        const glowIntensity = 0.3 + Math.sin(this.glowTimer) * 0.2;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10 * glowIntensity;

        switch (this.type) {
            case 'weaponBox':
                this.drawWeaponBox(ctx, drawX, drawY);
                break;
            case 'ammo':
                this.drawAmmo(ctx, drawX, drawY);
                break;
            case 'medkit':
                this.drawMedkit(ctx, drawX, drawY);
                break;
            case 'grenade':
                this.drawGrenade(ctx, drawX, drawY);
                break;
            case 'vehicle':
                this.drawVehiclePickup(ctx, drawX, drawY);
                break;
        }

        ctx.restore();
    }

    drawWeaponBox(ctx, drawX, drawY) {
        // 箱子主体
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(drawX - 15, drawY - 15, 30, 30);

        // 箱子边框
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX - 15, drawY - 15, 30, 30);

        // 十字标记
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('W', drawX, drawY);

        // 金属光泽
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(drawX - 13, drawY - 13, 12, 4);
    }

    drawAmmo(ctx, drawX, drawY) {
        // 弹药盒
        ctx.fillStyle = '#556B2F';
        ctx.fillRect(drawX - 10, drawY - 8, 20, 16);

        // 子弹
        ctx.fillStyle = '#DAA520';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(drawX - 6 + i * 6, drawY - 5, 4, 10);
        }

        // 边框
        ctx.strokeStyle = '#3a4a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX - 10, drawY - 8, 20, 16);
    }

    drawMedkit(ctx, drawX, drawY) {
        // 白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(drawX - 12, drawY - 12, 24, 24);

        // 红十字
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(drawX - 3, drawY - 10, 6, 20);
        ctx.fillRect(drawX - 10, drawY - 3, 20, 6);

        // 边框
        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX - 12, drawY - 12, 24, 24);
    }

    drawGrenade(ctx, drawX, drawY) {
        // 手雷主体
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 引信
        ctx.fillStyle = '#888';
        ctx.fillRect(drawX - 2, drawY - 14, 4, 6);

        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(drawX - 2, drawY - 3, 3, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawVehiclePickup(ctx, drawX, drawY) {
        // 载具图标（缩小版坦克）
        const scale = 0.4;
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.scale(scale, scale);

        // 履带
        ctx.fillStyle = '#333';
        ctx.fillRect(-50, 20, 100, 15);

        // 车身
        ctx.fillStyle = '#556B2F';
        ctx.fillRect(-45, -10, 90, 30);

        // 炮塔
        ctx.fillStyle = '#4A5D23';
        ctx.beginPath();
        ctx.arc(0, -10, 20, 0, Math.PI * 2);
        ctx.fill();

        // 炮管
        ctx.fillStyle = '#3a4a1a';
        ctx.fillRect(15, -15, 35, 8);

        // 闪光指示
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(-55, -25, 110, 65);

        ctx.restore();

        // 文字提示
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('载具', drawX, drawY + 35);
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            w: this.width,
            h: this.height
        };
    }
}

export class ItemManager {
    constructor() {
        this.items = [];
        this.spawnedVehicles = [];
    }

    spawn(type, x, y) {
        const item = new Item(type, x, y);
        this.items.push(item);
        return item;
    }

    spawnFromLevel(itemSpawns) {
        for (const spawn of itemSpawns) {
            this.spawn(spawn.type, spawn.x, spawn.y);
        }
    }

    update() {
        for (const item of this.items) {
            item.update();
        }
    }

    draw(ctx, cameraX) {
        for (const item of this.items) {
            if (!item.dead) {
                item.draw(ctx, cameraX);
            }
        }
    }

    checkCollision(player) {
        const collected = [];
        const pb = {
            x: player.x - player.width / 2,
            y: player.y,
            w: player.width,
            h: player.height
        };

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (item.dead) continue;

            const ib = item.getBounds();

            if (pb.x < ib.x + ib.w &&
                pb.x + pb.w > ib.x &&
                pb.y < ib.y + ib.h &&
                pb.y + pb.h > ib.y) {

                item.dead = true;
                collected.push(item);
                this.items.splice(i, 1);
                soundManager.play('pickup');
            }
        }

        return collected;
    }

    getRandomWeapon() {
        const weaponKeys = Object.keys(WEAPONS).filter(k => k !== 'pistol');
        return weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
    }

    clear() {
        this.items = [];
        this.spawnedVehicles = [];
    }

    removeItem(item) {
        const idx = this.items.indexOf(item);
        if (idx !== -1) {
            this.items.splice(idx, 1);
        }
    }
}
