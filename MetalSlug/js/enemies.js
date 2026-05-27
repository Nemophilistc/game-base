// ============================================
// MetalSlug 敌人系统
// ============================================

import { ENEMIES, GRAVITY, MAX_FALL_SPEED, GROUND_Y } from './config.js';
import { soundManager } from './sound.js';

class Enemy {
    constructor(type, x, y, config = {}) {
        const baseConfig = ENEMIES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = baseConfig.width;
        this.height = baseConfig.height;
        this.hp = config.hp || baseConfig.hp;
        this.maxHP = this.hp;
        this.speed = baseConfig.speed;
        this.damage = baseConfig.damage;
        this.fireRate = baseConfig.fireRate;
        this.score = baseConfig.score;
        this.color = baseConfig.color;
        this.flying = baseConfig.flying || false;
        this.vehicle = baseConfig.vehicle || false;
        this.boss = type === 'boss';

        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.facing = -1;
        this.lastFireTime = 0;
        this.onGround = false;

        // Boss相关
        this.bossName = config.name || baseConfig.name;
        this.phase = 1;
        this.phaseTimer = 0;
        this.attackPattern = 0;

        // 动画
        this.animFrame = 0;
        this.animTimer = 0;

        // 直升机特有
        this.hoverOffset = 0;
        this.hoverTimer = 0;

        // 坦克特有
        this.turretAngle = 0;
    }

    update(playerX, playerY, platforms, weaponSystem) {
        if (this.dead) return;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 面向玩家
        this.facing = dx > 0 ? 1 : -1;

        // 根据类型更新行为
        switch (this.type) {
            case 'infantry':
                this.updateInfantry(dx, dy, dist, platforms, weaponSystem, playerX, playerY);
                break;
            case 'gunner':
                this.updateGunner(dx, dy, dist, platforms, weaponSystem, playerX, playerY);
                break;
            case 'tank':
                this.updateTank(dx, dy, dist, platforms, weaponSystem, playerX, playerY);
                break;
            case 'helicopter':
                this.updateHelicopter(dx, dy, dist, weaponSystem, playerX, playerY);
                break;
            case 'boss':
                this.updateBoss(dx, dy, dist, weaponSystem, playerX, playerY);
                break;
        }

        // 重力（飞行单位除外）
        if (!this.flying) {
            this.vy += GRAVITY;
            if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
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
        }

        // 动画
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    updateInfantry(dx, dy, dist, platforms, weaponSystem, playerX, playerY) {
        // 移动并向玩家靠近
        if (dist > 300) {
            this.vx = this.facing * this.speed;
        } else if (dist > 150) {
            this.vx = this.facing * this.speed * 0.5;
        } else {
            this.vx = 0;
        }

        // 射击
        const now = Date.now();
        if (dist < 500 && now - this.lastFireTime > this.fireRate) {
            this.lastFireTime = now;
            weaponSystem.fireEnemyBullet(
                this.x + this.facing * 20,
                this.y + this.height / 3,
                playerX, playerY, 5, this.damage
            );
        }
    }

    updateGunner(dx, dy, dist, platforms, weaponSystem, playerX, playerY) {
        // 移动较慢
        if (dist > 400) {
            this.vx = this.facing * this.speed;
        } else {
            this.vx *= 0.9;
        }

        // 快速射击
        const now = Date.now();
        if (dist < 600 && now - this.lastFireTime > this.fireRate) {
            this.lastFireTime = now;
            weaponSystem.fireEnemyBullet(
                this.x + this.facing * 25,
                this.y + this.height / 3,
                playerX, playerY, 7, this.damage
            );
        }
    }

    updateTank(dx, dy, dist, platforms, weaponSystem, playerX, playerY) {
        // 坦克移动
        if (dist > 400) {
            this.vx = this.facing * this.speed;
        } else if (dist < 200) {
            this.vx = -this.facing * this.speed * 0.5;
        } else {
            this.vx *= 0.95;
        }

        // 炮塔角度
        this.turretAngle = Math.atan2(playerY - (this.y + 10), playerX - this.x);

        // 射击
        const now = Date.now();
        if (dist < 700 && now - this.lastFireTime > this.fireRate) {
            this.lastFireTime = now;
            weaponSystem.fireEnemyBullet(
                this.x + Math.cos(this.turretAngle) * 50,
                this.y + 10 + Math.sin(this.turretAngle) * 50,
                playerX, playerY, 6, this.damage
            );
        }
    }

    updateHelicopter(dx, dy, dist, weaponSystem, playerX, playerY) {
        // 直升机悬浮移动
        this.hoverTimer += 0.05;
        this.hoverOffset = Math.sin(this.hoverTimer) * 20;

        // 水平移动
        if (dist > 400) {
            this.vx = this.facing * this.speed;
        } else if (dist < 200) {
            this.vx = -this.facing * this.speed;
        } else {
            this.vx *= 0.98;
        }

        // 垂直跟踪
        const targetY = playerY - 150;
        const dyTarget = targetY - this.y;
        this.vy = dyTarget * 0.02;

        this.x += this.vx;
        this.y += this.vy + this.hoverOffset * 0.1;

        // 射击
        const now = Date.now();
        if (dist < 600 && now - this.lastFireTime > this.fireRate) {
            this.lastFireTime = now;
            for (let i = -1; i <= 1; i++) {
                weaponSystem.fireEnemyBullet(
                    this.x + this.facing * 30,
                    this.y + this.height / 2,
                    playerX + i * 50, playerY, 6, this.damage
                );
            }
        }
    }

    updateBoss(dx, dy, dist, weaponSystem, playerX, playerY) {
        this.phaseTimer++;

        // 根据血量切换阶段
        const hpRatio = this.hp / this.maxHP;
        if (hpRatio < 0.3) this.phase = 3;
        else if (hpRatio < 0.6) this.phase = 2;

        // 移动模式
        switch (this.phase) {
            case 1:
                // 缓慢靠近
                if (dist > 300) {
                    this.vx = this.facing * this.speed;
                } else {
                    this.vx = this.facing * this.speed * 0.3;
                }
                // 单发射击
                if (dist < 600 && Date.now() - this.lastFireTime > this.fireRate) {
                    this.lastFireTime = Date.now();
                    weaponSystem.fireEnemyBullet(
                        this.x + this.facing * 60,
                        this.y + 40,
                        playerX, playerY, 7, this.damage
                    );
                }
                break;

            case 2:
                // 来回移动
                this.vx = Math.sin(this.phaseTimer * 0.03) * this.speed * 2;
                // 三连射
                if (dist < 700 && Date.now() - this.lastFireTime > this.fireRate * 0.7) {
                    this.lastFireTime = Date.now();
                    for (let i = -1; i <= 1; i++) {
                        weaponSystem.fireEnemyBullet(
                            this.x + this.facing * 60,
                            this.y + 40,
                            playerX + i * 80, playerY, 8, this.damage
                        );
                    }
                }
                break;

            case 3:
                // 狂暴模式
                this.vx = Math.sin(this.phaseTimer * 0.05) * this.speed * 3;
                // 快速多方向射击
                if (Date.now() - this.lastFireTime > this.fireRate * 0.4) {
                    this.lastFireTime = Date.now();
                    const angles = [-0.5, -0.25, 0, 0.25, 0.5];
                    for (const offset of angles) {
                        const angle = Math.atan2(playerY - this.y, playerX - this.x) + offset;
                        const bx = this.x + Math.cos(angle) * 80;
                        const by = this.y + 60 + Math.sin(angle) * 80;
                        weaponSystem.fireEnemyBullet(bx, by, playerX, playerY, 9, this.damage);
                    }
                }
                break;
        }

        // 更新位置
        this.x += this.vx;

        // 地面碰撞
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            if (this.boss) {
                soundManager.play('bigExplosion');
            }
        }
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;
        const drawY = this.y;

        ctx.save();

        switch (this.type) {
            case 'infantry':
            case 'gunner':
                this.drawSoldier(ctx, drawX, drawY);
                break;
            case 'tank':
                this.drawTank(ctx, drawX, drawY);
                break;
            case 'helicopter':
                this.drawHelicopter(ctx, drawX, drawY);
                break;
            case 'boss':
                this.drawBoss(ctx, drawX, drawY);
                break;
        }

        // 生命条（Boss有特殊血条）
        if (this.boss) {
            this.drawBossHPBar(ctx);
        } else {
            this.drawHPBar(ctx, drawX, drawY - 10, this.width, 4);
        }

        ctx.restore();
    }

    drawSoldier(ctx, drawX, drawY) {
        const w = this.width;
        const h = this.height;

        ctx.save();
        if (this.facing === -1) {
            ctx.translate(drawX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-drawX, 0);
        }

        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(drawX, drawY + h + 2, w / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 腿部
        const legOffset = Math.sin(this.animTimer * 0.3) * 4;
        ctx.fillStyle = this.type === 'gunner' ? '#3a2a1a' : '#2a4a1a';
        ctx.fillRect(drawX - 6, drawY + h * 0.6, 6, h * 0.35 + legOffset);
        ctx.fillRect(drawX + 1, drawY + h * 0.6, 6, h * 0.35 - legOffset);

        // 靴子
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(drawX - 8, drawY + h * 0.9 + legOffset, 8, 6);
        ctx.fillRect(drawX - 1, drawY + h * 0.9 - legOffset, 8, 6);

        // 身体
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX - 10, drawY + h * 0.25, 20, h * 0.4);

        // 头盔/头巾
        if (this.type === 'gunner') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX - 10, drawY, 20, h * 0.25);
            ctx.fillStyle = '#654321';
            ctx.fillRect(drawX - 12, drawY + 2, 24, 6);
        } else {
            ctx.fillStyle = '#3a5a1a';
            ctx.fillRect(drawX - 8, drawY, 16, h * 0.25);
        }

        // 脸部
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(drawX - 5, drawY + h * 0.08, 10, h * 0.15);
        // 眼睛
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(drawX + 1, drawY + h * 0.1, 3, 2);

        // 武器
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX + 8, drawY + h * 0.3, 25, 5);

        ctx.restore();
    }

    drawTank(ctx, drawX, drawY) {
        const w = this.width;
        const h = this.height;

        // 履带
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX - w / 2, drawY + h - 18, w, 18);
        ctx.fillStyle = '#555';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(drawX - w / 2 + 15 + i * 20, drawY + h - 10, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        // 车身
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX - w / 2 + 5, drawY + 15, w - 10, h - 33);

        // 炮塔
        ctx.fillStyle = '#4A5D23';
        ctx.beginPath();
        ctx.arc(drawX, drawY + 15, 25, 0, Math.PI * 2);
        ctx.fill();

        // 炮管
        ctx.save();
        ctx.translate(drawX, drawY + 15);
        ctx.rotate(this.turretAngle);
        ctx.fillStyle = '#3a4a1a';
        ctx.fillRect(0, -5, 50, 10);
        ctx.restore();
    }

    drawHelicopter(ctx, drawX, drawY) {
        const w = this.width;
        const h = this.height;

        // 机身
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(drawX, drawY + h / 2, w / 2 - 10, h / 2 - 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 驾驶舱
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.ellipse(drawX + this.facing * 20, drawY + h / 2, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 尾翼
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(drawX - this.facing * (w / 2 - 5), drawY + h / 2 - 5, this.facing * 30, 10);

        // 旋翼
        const rotorAngle = Date.now() * 0.02;
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(drawX - 40 * Math.cos(rotorAngle), drawY - 5);
        ctx.lineTo(drawX + 40 * Math.cos(rotorAngle), drawY - 5);
        ctx.stroke();

        // 武器挂架
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX - 15, drawY + h - 10, 8, 12);
        ctx.fillRect(drawX + 7, drawY + h - 10, 8, 12);
    }

    drawBoss(ctx, drawX, drawY) {
        const w = this.width;
        const h = this.height;
        const hpRatio = this.hp / this.maxHP;

        // 机身主体
        ctx.fillStyle = this.phase === 3 ? '#AA0000' : this.phase === 2 ? '#993300' : this.color;
        ctx.fillRect(drawX - w / 2, drawY + 30, w, h - 30);

        // 装甲板
        ctx.fillStyle = '#666';
        ctx.fillRect(drawX - w / 2 + 5, drawY + 35, w - 10, 20);
        ctx.fillRect(drawX - w / 2 + 5, drawY + h - 30, w - 10, 20);

        // 头部/指挥塔
        ctx.fillStyle = '#5a0000';
        ctx.fillRect(drawX - 30, drawY, 60, 40);
        // 红色眼睛
        ctx.fillStyle = this.phase === 3 ? '#FF0000' : '#FF4400';
        ctx.fillRect(drawX - 20, drawY + 10, 12, 8);
        ctx.fillRect(drawX + 8, drawY + 10, 12, 8);

        // 手臂/武器
        ctx.fillStyle = '#444';
        // 左臂
        ctx.fillRect(drawX - w / 2 - 20, drawY + 50, 25, 15);
        ctx.fillRect(drawX - w / 2 - 35, drawY + 45, 20, 25);
        // 右臂
        ctx.fillRect(drawX + w / 2 - 5, drawY + 50, 25, 15);
        ctx.fillRect(drawX + w / 2 + 15, drawY + 45, 20, 25);

        // 炮管
        ctx.fillStyle = '#333';
        const gunAngle = Math.atan2(0, this.facing);
        ctx.save();
        ctx.translate(drawX + this.facing * 50, drawY + 70);
        ctx.rotate(gunAngle);
        ctx.fillRect(0, -8, 40, 16);
        ctx.restore();

        // 腿部
        ctx.fillStyle = '#444';
        ctx.fillRect(drawX - 40, drawY + h - 20, 15, 20);
        ctx.fillRect(drawX + 25, drawY + h - 20, 15, 20);

        // 狂暴模式特效
        if (this.phase === 3) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            ctx.strokeRect(drawX - w / 2 - 5, drawY - 5, w + 10, h + 10);
        }
    }

    drawHPBar(ctx, drawX, drawY, width, height) {
        const barX = drawX - width / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, drawY, width, height);
        const ratio = this.hp / this.maxHP;
        ctx.fillStyle = ratio > 0.6 ? '#FF4444' : ratio > 0.3 ? '#FF8800' : '#FF0000';
        ctx.fillRect(barX, drawY, width * ratio, height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, drawY, width, height);
    }

    drawBossHPBar(ctx) {
        const barWidth = 300;
        const barHeight = 20;
        const barX = (1200 - barWidth) / 2;
        const barY = 60;

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX - 5, barY - 25, barWidth + 10, barHeight + 35);

        // Boss名称
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.bossName, 600, barY - 8);

        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 血条
        const ratio = this.hp / this.maxHP;
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * ratio, barY);
        if (this.phase === 3) {
            gradient.addColorStop(0, '#FF0000');
            gradient.addColorStop(1, '#FF4400');
        } else if (this.phase === 2) {
            gradient.addColorStop(0, '#FF4400');
            gradient.addColorStop(1, '#FF8800');
        } else {
            gradient.addColorStop(0, '#FF6600');
            gradient.addColorStop(1, '#FFAA00');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

        // 边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // 阶段标记
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.ceil(this.hp)}/${this.maxHP}`, barX + barWidth, barY + barHeight + 12);
    }
}

export class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    spawn(type, x, y, config = {}) {
        const enemy = new Enemy(type, x, y, config);
        this.enemies.push(enemy);
        return enemy;
    }

    update(playerX, playerY, platforms, weaponSystem) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(playerX, playerY, platforms, weaponSystem);
            if (this.enemies[i].dead) {
                this.enemies.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraX) {
        for (const enemy of this.enemies) {
            enemy.draw(ctx, cameraX);
        }
    }

    getEnemies() {
        return this.enemies;
    }

    removeEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
            this.enemies.splice(idx, 1);
        }
    }

    clear() {
        this.enemies = [];
    }
}
