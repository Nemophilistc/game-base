// ============================================================
// items.js - 经验宝石、道具掉落、磁铁效果
// ============================================================

import { GAME } from './config.js';
import { sound } from './sound.js';

let gemIdCounter = 0;

class XPGem {
    constructor(x, y, value) {
        this.id = ++gemIdCounter;
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = value >= 25 ? 8 : value >= 10 ? 6 : 4;
        this.color = value >= 25 ? '#ff44ff' : value >= 10 ? '#44aaff' : '#44ff44';
        this.alive = true;
        this.attracted = false;
        this.attractSpeed = 0;
        this.age = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update(dt, player) {
        this.age += dt;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        // 磁铁吸引
        if (player.magnetActive && dist < player.magnetRange) {
            this.attracted = true;
        }

        // 大宝石自动飞向玩家
        if (this.value >= 25) {
            this.attracted = true;
        }

        // 拾取范围
        if (dist < player.pickupRange) {
            this.attracted = true;
        }

        if (this.attracted) {
            this.attractSpeed = Math.min(this.attractSpeed + 0.5, 12);
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.attractSpeed;
            this.y += Math.sin(angle) * this.attractSpeed;
        }

        // 拾取
        if (dist < player.radius + this.radius) {
            this.alive = false;
            return this.value;
        }
        return 0;
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = this.x - camera.x;
        const sy = this.y - camera.y + Math.sin(this.age * 0.004 + this.bobOffset) * 2;

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.value >= 25 ? 12 : 6;

        // 菱形宝石
        ctx.beginPath();
        ctx.moveTo(sx, sy - this.radius);
        ctx.lineTo(sx + this.radius * 0.7, sy);
        ctx.lineTo(sx, sy + this.radius);
        ctx.lineTo(sx - this.radius * 0.7, sy);
        ctx.closePath();
        ctx.fill();

        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(sx, sy - this.radius * 0.5);
        ctx.lineTo(sx + this.radius * 0.3, sy - this.radius * 0.1);
        ctx.lineTo(sx, sy + this.radius * 0.2);
        ctx.lineTo(sx - this.radius * 0.3, sy - this.radius * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

export class ItemSystem {
    constructor() {
        this.gems = [];
        this.totalXPCollected = 0;
    }

    spawnGems(x, y, xp) {
        if (xp >= 50) {
            this.gems.push(new XPGem(x, y, 25));
            this.gems.push(new XPGem(x + 5, y - 5, 25));
        } else if (xp >= 20) {
            this.gems.push(new XPGem(x, y, 10));
            this.gems.push(new XPGem(x + 5, y - 3, 10));
        } else if (xp >= 5) {
            this.gems.push(new XPGem(x, y, xp));
        } else {
            this.gems.push(new XPGem(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, xp));
        }
    }

    update(dt, player) {
        let totalXP = 0;
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const xp = this.gems[i].update(dt, player);
            if (xp > 0) {
                totalXP += xp;
                sound.pickup();
                this.gems.splice(i, 1);
            } else if (!this.gems[i].alive) {
                this.gems.splice(i, 1);
            }
        }
        this.totalXPCollected += totalXP;
        return totalXP;
    }

    draw(ctx, camera) {
        for (const gem of this.gems) {
            gem.draw(ctx, camera);
        }
    }

    clear() {
        this.gems = [];
    }
}
