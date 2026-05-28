// ============================================================
// 末日幸存者 - 武器系统和弹幕
// ============================================================

import { CONFIG, game, state, keys } from './config.js';
import { spawnParticle, spawnLightningEffect, spawnAuraEffect } from './items.js';

// ============================================================
// 查找最近敌人（供武器瞄准用）
// ============================================================
export function findNearestEnemy(x, y, exclude = []) {
    let nearest = null;
    let minDist = Infinity;

    state.enemies.forEach(enemy => {
        if (exclude.includes(enemy)) return;
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    });

    return nearest;
}

// ============================================================
// 敌人子弹生成（fromEnemy = true，修复Bug关键）
// ============================================================
export function spawnEnemyProjectile(x, y, vx, vy) {
    state.projectiles.push(new Projectile(x, y, vx * 4, vy * 4, 10, '#9b59b6', 8, 300, false, 'normal', true));
}

// ============================================================
// 弹幕类（增加 fromEnemy 参数修复Bug）
// ============================================================
export class Projectile {
    constructor(x, y, vx, vy, damage, color, size, maxDist, piercing = false, type = 'normal', fromEnemy = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.size = size;
        this.maxDist = maxDist;
        this.dist = 0;
        this.piercing = piercing;
        this.hitEnemies = new Set();
        this.type = type;
        this.fromEnemy = fromEnemy; // Bug修复：标记子弹来源
        this.angle = Math.atan2(vy, vx);
        this.trail = [];
        this.life = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.dist += Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.life++;

        // 记录轨迹
        this.trail.push({ x: this.x, y: this.y, life: 10 });
        if (this.trail.length > 20) this.trail.shift();
        this.trail.forEach(t => t.life--);
        this.trail = this.trail.filter(t => t.life > 0);

        // 生成特效粒子
        if (this.type === 'fire' && this.life % 2 === 0) {
            spawnParticle(this.x, this.y, '#ff6b35', 'fire');
        } else if (this.type === 'wind' && this.life % 3 === 0) {
            spawnParticle(this.x, this.y, '#87ceeb', 'wind');
        }

        // 检查距离
        if (this.dist > this.maxDist) return false;

        // Bug修复：根据来源区分碰撞检测目标
        if (this.fromEnemy) {
            // 敌人子弹只检测与玩家的碰撞
            const player = state.player;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.size + player.size) {
                player.takeDamage(this.damage);
                this.onHit();
                return false;
            }
        } else {
            // 玩家子弹检测与敌人的碰撞
            for (let i = state.enemies.length - 1; i >= 0; i--) {
                const enemy = state.enemies[i];
                if (this.hitEnemies.has(enemy)) continue;

                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                if (Math.sqrt(dx * dx + dy * dy) < this.size + enemy.size) {
                    const killed = enemy.takeDamage(this.damage);
                    if (killed) {
                        state.enemies.splice(i, 1);
                    }
                    this.onHit();
                    if (!this.piercing) return false;
                    this.hitEnemies.add(enemy);
                }
            }
        }

        return true;
    }

    onHit() {
        switch (this.type) {
            case 'fire':
                for (let i = 0; i < 15; i++) spawnParticle(this.x, this.y, '#ff6b35', 'fire');
                break;
            case 'lightning':
                for (let i = 0; i < 20; i++) spawnParticle(this.x, this.y, '#ffd700', 'lightning');
                break;
            case 'wind':
                for (let i = 0; i < 10; i++) spawnParticle(this.x, this.y, '#87ceeb', 'wind');
                break;
        }
    }

    draw() {
        const ctx = game.ctx;
        ctx.save();

        switch (this.type) {
            case 'fire': this.drawFire(); break;
            case 'lightning': this.drawLightning(); break;
            case 'wind': this.drawWind(); break;
            default: this.drawNormal(); break;
        }

        ctx.restore();
    }

    drawFire() {
        const ctx = game.ctx;
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2
        );
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.3, '#ff9500');
        gradient.addColorStop(0.6, '#ff6b35');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = t.life / 10;
            const size = this.size * alpha * 0.8;
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawLightning() {
        const ctx = game.ctx;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 3, this.y - this.vy * 3);

        const segments = 5;
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const x = this.x - this.vx * 3 * (1 - t) + (Math.random() - 0.5) * 15;
            const y = this.y - this.vy * 3 * (1 - t) + (Math.random() - 0.5) * 15;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const startX = this.x - this.vx * 2 * Math.random();
            const startY = this.y - this.vy * 2 * Math.random();
            const endX = startX + (Math.random() - 0.5) * 30;
            const endY = startY + (Math.random() - 0.5) * 30;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
    }

    drawWind() {
        const ctx = game.ctx;
        ctx.strokeStyle = 'rgba(135, 206, 235, 0.6)';
        ctx.lineWidth = 2;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        for (let i = 0; i < 5; i++) {
            const offset = (i - 2) * 8;
            const perpX = speed > 0 ? -this.vy * offset / speed : 0;
            const perpY = speed > 0 ? this.vx * offset / speed : 0;

            ctx.beginPath();
            ctx.moveTo(this.x - this.vx * 2 + perpX, this.y - this.vy * 2 + perpY);
            ctx.quadraticCurveTo(
                this.x + perpX * 0.5,
                this.y + perpY * 0.5,
                this.x + perpX,
                this.y + perpY
            );
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = t.life / 10;
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = '#87ceeb';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawNormal() {
        const ctx = game.ctx;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color + '40';
        ctx.beginPath();
        ctx.arc(this.x - this.vx, this.y - this.vy, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================
// 武器类
// ============================================================
export class Weapon {
    constructor(type) {
        this.type = type;
        this.level = 1;
        this.timer = 0;
        this.angle = 0;
        this.active = false;
        this.timer2 = 0;
        this.particleTimer = 0;
        this.init();
    }

    init() {
        switch (this.type) {
            case 'sword':
                this.name = '剑气';
                this.icon = '🗡️';
                this.cooldown = 35;
                this.damage = 20;
                this.range = 180;
                this.count = 1;
                break;
            case 'fire':
                this.name = '火球';
                this.icon = '🔥';
                this.cooldown = 50;
                this.damage = 35;
                this.range = 220;
                this.count = 1;
                break;
            case 'lightning':
                this.name = '闪电';
                this.icon = '⚡';
                this.cooldown = 70;
                this.damage = 50;
                this.range = 280;
                this.count = 1;
                this.chain = 2;
                break;
            case 'orbit':
                this.name = '光环';
                this.icon = '💫';
                this.cooldown = 0;
                this.damage = 15;
                this.range = 90;
                this.count = 2;
                this.angle = 0;
                break;
            case 'aura':
                this.name = '圣光';
                this.icon = '✨';
                this.cooldown = 25;
                this.damage = 12;
                this.range = 120;
                break;
            case 'shield':
                this.name = '护盾';
                this.icon = '🛡️';
                this.cooldown = 150;
                this.duration = 150;
                this.active = false;
                this.timer2 = 0;
                break;
            case 'wind':
                this.name = '疾风';
                this.icon = '💨';
                this.cooldown = 0;
                this.damage = 5;
                this.range = 60;
                this.particleTimer = 0;
                break;
        }
    }

    update(player) {
        this.timer++;

        switch (this.type) {
            case 'sword':
                if (this.timer >= this.cooldown) {
                    this.timer = 0;
                    this.fireSword(player);
                }
                break;
            case 'fire':
                if (this.timer >= this.cooldown) {
                    this.timer = 0;
                    this.fireFire(player);
                }
                break;
            case 'lightning':
                if (this.timer >= this.cooldown) {
                    this.timer = 0;
                    this.fireLightning(player);
                }
                break;
            case 'orbit':
                this.angle += 0.05;
                this.checkOrbitHit(player);
                break;
            case 'aura':
                if (this.timer >= this.cooldown) {
                    this.timer = 0;
                    this.fireAura(player);
                }
                break;
            case 'shield':
                if (this.active) {
                    this.timer2--;
                    if (this.timer2 <= 0) this.active = false;
                } else if (this.timer >= this.cooldown) {
                    this.timer = 0;
                    this.active = true;
                    this.timer2 = this.duration;
                }
                break;
            case 'wind':
                this.particleTimer++;
                if (this.particleTimer >= 3) {
                    this.particleTimer = 0;
                    this.fireWind(player);
                }
                if (this.timer % 15 === 0) {
                    this.checkWindHit(player);
                }
                break;
        }
    }

    fireSword(player) {
        const target = findNearestEnemy(player.x, player.y);
        if (!target) return;

        const dx = target.x - player.x;
        const dy = target.y - player.y;

        for (let i = 0; i < this.count; i++) {
            const angle = Math.atan2(dy, dx) + (i - (this.count - 1) / 2) * 0.3;
            state.projectiles.push(new Projectile(
                player.x, player.y,
                Math.cos(angle) * 8,
                Math.sin(angle) * 8,
                this.damage, '#4ecdc4', 10, this.range, false, 'sword'
            ));
        }
    }

    fireFire(player) {
        const target = findNearestEnemy(player.x, player.y);
        if (!target) return;

        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        state.projectiles.push(new Projectile(
            player.x, player.y,
            (dx / dist) * 6,
            (dy / dist) * 6,
            this.damage, '#ff6b6b', 15, this.range, true, 'fire'
        ));
    }

    fireLightning(player) {
        const target = findNearestEnemy(player.x, player.y);
        if (!target) return;

        const killed = target.takeDamage(this.damage);
        if (killed) {
            const index = state.enemies.indexOf(target);
            if (index > -1) state.enemies.splice(index, 1);
        }
        spawnLightningEffect(player.x, player.y, target.x, target.y);

        // 链式闪电
        let lastX = target.x, lastY = target.y;
        let hitEnemies = [target];
        for (let i = 0; i < this.chain; i++) {
            const next = findNearestEnemy(lastX, lastY, hitEnemies);
            if (!next) break;
            const nextKilled = next.takeDamage(this.damage * 0.7);
            if (nextKilled) {
                const nextIndex = state.enemies.indexOf(next);
                if (nextIndex > -1) state.enemies.splice(nextIndex, 1);
            }
            spawnLightningEffect(lastX, lastY, next.x, next.y);
            hitEnemies.push(next);
            lastX = next.x;
            lastY = next.y;
        }
    }

    checkOrbitHit(player) {
        for (let i = 0; i < this.count; i++) {
            const angle = this.angle + (Math.PI * 2 / this.count) * i;
            const x = player.x + Math.cos(angle) * this.range;
            const y = player.y + Math.sin(angle) * this.range;

            for (let j = state.enemies.length - 1; j >= 0; j--) {
                const enemy = state.enemies[j];
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    if (this.timer % 10 === 0) {
                        const killed = enemy.takeDamage(this.damage);
                        if (killed) {
                            state.enemies.splice(j, 1);
                        }
                    }
                }
            }
        }
    }

    fireAura(player) {
        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const enemy = state.enemies[i];
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.range) {
                const killed = enemy.takeDamage(this.damage);
                if (killed) {
                    state.enemies.splice(i, 1);
                }
            }
        }
        spawnAuraEffect(player.x, player.y, this.range);
    }

    fireWind(player) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.range;
        const x = player.x + Math.cos(angle) * dist;
        const y = player.y + Math.sin(angle) * dist;

        let windVx = 0, windVy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) windVy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) windVy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) windVx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) windVx = 1;

        if (windVx === 0 && windVy === 0) {
            windVx = (Math.random() - 0.5) * 2;
            windVy = (Math.random() - 0.5) * 2;
        }

        const len = Math.sqrt(windVx * windVx + windVy * windVy);
        if (len > 0) {
            windVx /= len;
            windVy /= len;
        }

        for (let i = 0; i < 3; i++) {
            spawnParticle(x, y, '#87ceeb', 'wind');
            // 覆盖最后生成的粒子的速度以匹配风向
            const lastP = state.particles[state.particles.length - 1];
            if (lastP) {
                lastP.vx = windVx * (3 + Math.random() * 4) + (Math.random() - 0.5) * 2;
                lastP.vy = windVy * (3 + Math.random() * 4) + (Math.random() - 0.5) * 2;
            }
        }
    }

    checkWindHit(player) {
        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const enemy = state.enemies[i];
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range) {
                const killed = enemy.takeDamage(this.damage);
                if (killed) {
                    state.enemies.splice(i, 1);
                }
                if (dist > 0) {
                    const pushForce = 3;
                    enemy.x += (dx / dist) * pushForce;
                    enemy.y += (dy / dist) * pushForce;
                }
            }
        }
    }

    draw(player) {
        const ctx = game.ctx;

        switch (this.type) {
            case 'orbit':
                for (let i = 0; i < this.count; i++) {
                    const angle = this.angle + (Math.PI * 2 / this.count) * i;
                    const x = player.x + Math.cos(angle) * this.range;
                    const y = player.y + Math.sin(angle) * this.range;
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(x, y, 10, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'shield':
                if (this.active) {
                    ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, player.size + 15, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            case 'wind': {
                const windAlpha = 0.2 + Math.sin(Date.now() / 200) * 0.1;
                ctx.strokeStyle = `rgba(135, 206, 235, ${windAlpha})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(player.x, player.y, this.range, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                let windDirX = 0, windDirY = 0;
                if (keys['KeyW'] || keys['ArrowUp']) windDirY = -1;
                if (keys['KeyS'] || keys['ArrowDown']) windDirY = 1;
                if (keys['KeyA'] || keys['ArrowLeft']) windDirX = -1;
                if (keys['KeyD'] || keys['ArrowRight']) windDirX = 1;

                if (windDirX !== 0 || windDirY !== 0) {
                    const len = Math.sqrt(windDirX * windDirX + windDirY * windDirY);
                    windDirX /= len;
                    windDirY /= len;

                    ctx.strokeStyle = 'rgba(135, 206, 235, 0.4)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(player.x, player.y);
                    ctx.lineTo(
                        player.x + windDirX * this.range * 0.8,
                        player.y + windDirY * this.range * 0.8
                    );
                    ctx.stroke();
                }
                break;
            }
        }
    }

    levelUp() {
        this.level++;
        switch (this.type) {
            case 'sword':
                this.damage += 8;
                this.count = Math.min(5, 1 + Math.floor(this.level / 2));
                this.cooldown = Math.max(20, this.cooldown - 3);
                break;
            case 'fire':
                this.damage += 15;
                this.cooldown = Math.max(25, this.cooldown - 5);
                break;
            case 'lightning':
                this.damage += 20;
                this.chain = Math.min(5, 2 + Math.floor(this.level / 2));
                break;
            case 'orbit':
                this.count = Math.min(6, 2 + Math.floor(this.level / 2));
                this.damage += 5;
                break;
            case 'aura':
                this.damage += 5;
                this.range += 15;
                break;
            case 'shield':
                this.duration += 40;
                this.cooldown = Math.max(60, this.cooldown - 15);
                break;
            case 'wind':
                this.damage += 3;
                this.range += 10;
                break;
        }
    }
}
