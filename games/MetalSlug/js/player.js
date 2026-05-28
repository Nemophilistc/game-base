// ============================================
// MetalSlug 玩家角色系统
// ============================================

import { PLAYER, GRAVITY, MAX_FALL_SPEED, GROUND_Y, WEAPONS } from './config.js';
import { soundManager } from './sound.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER.width;
        this.height = PLAYER.height;
        this.vx = 0;
        this.vy = 0;
        this.hp = PLAYER.maxHP;
        this.maxHP = PLAYER.maxHP;
        this.speed = PLAYER.speed;
        this.jumpForce = PLAYER.jumpForce;
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.grenades = PLAYER.maxGrenades;
        this.lastGrenadeTime = 0;

        // 状态
        this.crouching = false;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.dead = false;
        this.score = 0;

        // 载具
        this.inVehicle = false;
        this.vehicle = null;
        this.vehicleHP = 0;
        this.vehicleMaxHP = 0;

        // 动画
        this.animFrame = 0;
        this.animTimer = 0;
        this.running = false;

        // 输入状态
        this.keys = { left: false, right: false, up: false, down: false, jump: false };
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;

        // 瞄准角度
        this.aimAngle = 0;
    }

    update(platforms, cameraX) {
        if (this.dead) return;

        // 更新无敌时间
        if (this.invincible) {
            this.invincibleTimer -= 16;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // 水平移动
        this.running = false;
        if (this.keys.left) {
            this.vx = -this.speed;
            this.facing = -1;
            this.running = true;
        } else if (this.keys.right) {
            this.vx = this.speed;
            this.facing = 1;
            this.running = true;
        } else {
            this.vx *= 0.8;
        }

        // 蹲下
        if (this.keys.down && this.onGround) {
            this.crouching = true;
            this.height = PLAYER.height * 0.6;
        } else {
            this.crouching = false;
            this.height = PLAYER.height;
        }

        // 跳跃
        if (this.keys.jump && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            soundManager.play('jump');
        }

        // 重力
        this.vy += GRAVITY;
        if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

        // 移动
        this.x += this.vx;
        this.y += this.vy;

        // 地面碰撞
        this.onGround = false;
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // 平台碰撞
        for (const platform of platforms) {
            if (this.vy >= 0 &&
                this.x + this.width / 2 > platform.x &&
                this.x - this.width / 2 < platform.x + platform.w &&
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + platform.h + 10) {
                this.y = platform.y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // 边界限制
        if (this.x < cameraX + this.width / 2) {
            this.x = cameraX + this.width / 2;
        }

        // 计算瞄准角度
        const worldMouseX = this.mouseX + cameraX;
        const worldMouseY = this.mouseY;
        this.aimAngle = Math.atan2(worldMouseY - (this.y + this.height / 2), worldMouseX - this.x);
        if (this.facing === -1) {
            // 如果朝左，调整角度范围
        }

        // 动画更新
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.dead) return;

        if (this.inVehicle) {
            this.vehicleHP -= amount;
            if (this.vehicleHP <= 0) {
                this.exitVehicle();
            }
        } else {
            this.hp -= amount;
        }

        this.invincible = true;
        this.invincibleTimer = PLAYER.invincibleTime;
        soundManager.play('hurt');

        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            soundManager.play('death');
        }
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHP);
    }

    throwGrenade() {
        const now = Date.now();
        if (this.grenades <= 0 || now - this.lastGrenadeTime < PLAYER.grenadeCooldown) return null;
        this.lastGrenadeTime = now;
        this.grenades--;
        soundManager.play('grenade');

        return {
            x: this.x + this.facing * 20,
            y: this.y + this.height / 3,
            vx: this.facing * 8,
            vy: -8,
            damage: 100,
            radius: 100
        };
    }

    enterVehicle(vehicle) {
        this.inVehicle = true;
        this.vehicle = vehicle;
        this.vehicleHP = vehicle.hp;
        this.vehicleMaxHP = vehicle.hp;
        soundManager.play('vehicleEnter');
    }

    exitVehicle() {
        if (this.inVehicle) {
            this.inVehicle = false;
            this.vehicle = null;
            this.vehicleHP = 0;
        }
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;
        const drawY = this.y;

        // 无敌闪烁效果
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        ctx.save();

        if (this.inVehicle) {
            this.drawVehicle(ctx, drawX, drawY);
        } else {
            this.drawCharacter(ctx, drawX, drawY);
        }

        ctx.restore();
    }

    drawCharacter(ctx, drawX, drawY) {
        const w = this.width;
        const h = this.height;

        // 身体阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(drawX, drawY + h + 2, w / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        if (this.facing === -1) {
            ctx.translate(drawX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-drawX, 0);
        }

        // 腿部
        const legOffset = this.running ? Math.sin(this.animTimer * 0.3) * 5 : 0;
        ctx.fillStyle = '#2B4570';
        ctx.fillRect(drawX - 8, drawY + h * 0.6, 8, h * 0.35 + legOffset);
        ctx.fillRect(drawX + 2, drawY + h * 0.6, 8, h * 0.35 - legOffset);

        // 靴子
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(drawX - 10, drawY + h * 0.9 + legOffset, 10, 8);
        ctx.fillRect(drawX, drawY + h * 0.9 - legOffset, 10, 8);

        // 身体
        ctx.fillStyle = '#4488FF';
        ctx.fillRect(drawX - 12, drawY + h * 0.25, 24, h * 0.4);

        // 头盔
        ctx.fillStyle = '#336699';
        ctx.fillRect(drawX - 10, drawY, 20, h * 0.3);
        // 头盔带
        ctx.fillStyle = '#2a5580';
        ctx.fillRect(drawX - 12, drawY + h * 0.15, 24, 4);

        // 脸部
        ctx.fillStyle = '#FFDAB9';
        ctx.fillRect(drawX - 6, drawY + h * 0.1, 12, h * 0.15);
        // 眼睛
        ctx.fillStyle = '#000';
        ctx.fillRect(drawX + 2, drawY + h * 0.12, 3, 3);

        // 武器手臂
        const armY = drawY + h * 0.35;
        const armAngle = this.aimAngle;
        ctx.save();
        ctx.translate(drawX + 8, armY);
        ctx.rotate(armAngle);
        ctx.fillStyle = '#FFDAB9';
        ctx.fillRect(0, -3, 12, 6);
        // 武器
        ctx.fillStyle = '#444';
        ctx.fillRect(10, -4, 20, 8);
        ctx.restore();

        ctx.restore();

        // 生命条
        this.drawHPBar(ctx, drawX, drawY - 10, w, 4, this.hp, this.maxHP);
    }

    drawVehicle(ctx, drawX, drawY) {
        const vw = 120;
        const vh = 70;

        // 履带
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX - vw / 2, drawY + vh - 15, vw, 15);
        // 履带轮
        ctx.fillStyle = '#555';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(drawX - vw / 2 + 15 + i * 25, drawY + vh - 8, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // 车身
        ctx.fillStyle = '#556B2F';
        ctx.fillRect(drawX - vw / 2 + 5, drawY + 10, vw - 10, vh - 25);

        // 炮塔
        ctx.fillStyle = '#4A5D23';
        ctx.fillRect(drawX - 20, drawY - 5, 40, 20);

        // 炮管
        ctx.save();
        ctx.translate(drawX + 10, drawY + 5);
        ctx.rotate(this.aimAngle);
        ctx.fillStyle = '#3a4a1a';
        ctx.fillRect(0, -5, 40, 10);
        ctx.restore();

        // 生命条
        this.drawHPBar(ctx, drawX, drawY - 15, vw, 6, this.vehicleHP, this.vehicleMaxHP);
    }

    drawHPBar(ctx, x, y, width, height, current, max) {
        const barX = x - width / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, y, width, height);
        const ratio = current / max;
        const color = ratio > 0.6 ? '#00FF00' : ratio > 0.3 ? '#FFD700' : '#FF0000';
        ctx.fillStyle = color;
        ctx.fillRect(barX, y, width * ratio, height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, y, width, height);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = PLAYER.maxHP;
        this.maxHP = PLAYER.maxHP;
        this.dead = false;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.grenades = PLAYER.maxGrenades;
        this.inVehicle = false;
        this.vehicle = null;
        this.vehicleHP = 0;
        this.crouching = false;
    }
}
