// ============================================
// MetalSlug 武器系统
// ============================================

import { WEAPONS } from './config.js';
import { soundManager } from './sound.js';

export class Bullet {
    constructor(x, y, vx, vy, damage, config) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.size = config.bulletSize || 4;
        this.color = config.color || '#FFD700';
        this.explosive = config.explosive || false;
        this.explosionRadius = config.explosionRadius || 0;
        this.piercing = config.piercing || false;
        this.life = 120;
        this.dead = false;
        this.isEnemy = false;
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        if (this.life <= 0) {
            this.dead = true;
        }
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;
        const drawY = this.y;

        // 绘制弹道轨迹
        if (this.trail.length > 1) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size / 2;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x - cameraX, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x - cameraX, this.trail[i].y);
            }
            ctx.lineTo(drawX, drawY);
            ctx.stroke();
            ctx.restore();
        }

        // 绘制子弹
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;

        if (this.explosive) {
            // 火箭弹 - 较大的圆形
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
            ctx.fill();
            // 火焰尾迹
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(drawX - this.vx * 0.3, drawY - this.vy * 0.3, this.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.piercing) {
            // 激光 - 长条形
            ctx.fillStyle = this.color;
            const len = 15;
            const angle = Math.atan2(this.vy, this.vx);
            ctx.translate(drawX, drawY);
            ctx.rotate(angle);
            ctx.fillRect(-len / 2, -this.size / 2, len, this.size);
        } else {
            // 普通子弹 - 小圆点
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export class WeaponSystem {
    constructor() {
        this.bullets = [];
        this.currentWeapon = 'pistol';
        this.weapons = {};
        this.lastFireTime = 0;

        // 初始化武器弹药
        for (const [key, config] of Object.entries(WEAPONS)) {
            this.weapons[key] = {
                ...config,
                currentAmmo: config.ammo
            };
        }
    }

    canFire() {
        const now = Date.now();
        const weapon = this.weapons[this.currentWeapon];
        if (!weapon) return false;
        if (now - this.lastFireTime < weapon.fireRate) return false;
        if (weapon.currentAmmo <= 0 && weapon.currentAmmo !== Infinity) return false;
        return true;
    }

    fire(x, y, angle) {
        if (!this.canFire()) return [];

        const weapon = this.weapons[this.currentWeapon];
        this.lastFireTime = Date.now();

        if (weapon.currentAmmo !== Infinity) {
            weapon.currentAmmo--;
        }

        soundManager.play(weapon.sound);

        const newBullets = [];
        const pellets = weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * 2;
            const finalAngle = angle + spread;
            const vx = Math.cos(finalAngle) * weapon.bulletSpeed;
            const vy = Math.sin(finalAngle) * weapon.bulletSpeed;

            const bullet = new Bullet(x, y, vx, vy, weapon.damage, {
                bulletSize: weapon.bulletSize,
                color: weapon.color,
                explosive: weapon.explosive,
                explosionRadius: weapon.explosionRadius,
                piercing: weapon.piercing
            });
            newBullets.push(bullet);
        }

        this.bullets.push(...newBullets);
        return newBullets;
    }

    fireEnemyBullet(x, y, targetX, targetY, speed = 6, damage = 10) {
        const angle = Math.atan2(targetY - y, targetX - x);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const bullet = new Bullet(x, y, vx, vy, damage, {
            bulletSize: 4,
            color: '#FF4444'
        });
        bullet.isEnemy = true;
        this.bullets.push(bullet);
    }

    switchWeapon(weaponName) {
        if (this.weapons[weaponName]) {
            this.currentWeapon = weaponName;
            return true;
        }
        return false;
    }

    addAmmo(weaponName, amount) {
        if (this.weapons[weaponName]) {
            const weapon = this.weapons[weaponName];
            if (weapon.currentAmmo !== Infinity) {
                weapon.currentAmmo = Math.min(weapon.currentAmmo + amount, weapon.maxAmmo);
            }
        }
    }

    getCurrentWeapon() {
        return {
            name: this.currentWeapon,
            ...this.weapons[this.currentWeapon]
        };
    }

    update() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].dead) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraX) {
        for (const bullet of this.bullets) {
            bullet.draw(ctx, cameraX);
        }
    }

    getBullets() {
        return this.bullets;
    }

    removeBullet(bullet) {
        const idx = this.bullets.indexOf(bullet);
        if (idx !== -1) {
            this.bullets.splice(idx, 1);
        }
    }

    reset() {
        this.bullets = [];
        this.currentWeapon = 'pistol';
        this.lastFireTime = 0;
        for (const [key, config] of Object.entries(WEAPONS)) {
            this.weapons[key] = {
                ...config,
                currentAmmo: config.ammo
            };
        }
    }
}
