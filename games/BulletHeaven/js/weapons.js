// ============================================================
// weapons.js - 8种自动武器系统（每种独特攻击模式）
// ============================================================

import { WEAPONS } from './config.js';
import { sound } from './sound.js';

class Projectile {
    constructor(x, y, vx, vy, config, level) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = config.damage + (config.levelBonus.damage || 0) * (level - 1);
        this.pierce = config.pierce + (config.levelBonus.pierce || 0) * (level - 1);
        this.radius = config.radius;
        this.color = config.color;
        this.range = config.range;
        this.startX = x;
        this.startY = y;
        this.alive = true;
        this.hitEnemies = new Set();
        this.type = config.id;
        this.explosionRadius = config.explosionRadius ? config.explosionRadius + (config.levelBonus.explosionRadius || 0) * (level - 1) : 0;
        this.slowFactor = config.slowFactor || 0;
        this.slowDuration = config.slowDuration || 0;
        this.cloudRadius = 0;
        this.cloudDuration = 0;
        this.tickRate = 0;
        this.tickTimer = 0;
        this.age = 0;
    }

    update(dt, enemies) {
        this.x += this.vx;
        this.y += this.vy;
        this.age += dt;

        const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
        if (dist > this.range) {
            this.alive = false;
        }

        // 碰撞检测
        for (const enemy of enemies) {
            if (!enemy.alive || this.hitEnemies.has(enemy.id)) continue;
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const dist = Math.hypot(dx, dy);
            if (dist < this.radius + enemy.radius) {
                this.onHitEnemy(enemy);
                this.hitEnemies.add(enemy.id);
                this.pierce--;
                if (this.pierce <= 0) {
                    this.alive = false;
                    break;
                }
            }
        }
    }

    onHitEnemy(enemy) {
        enemy.takeDamage(this.damage);
        if (this.slowFactor > 0) {
            enemy.applySlow(this.slowFactor, this.slowDuration);
        }
    }

    draw(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class FireballProjectile extends Projectile {
    draw(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        ctx.save();
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 15;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.radius);
        grad.addColorStop(0, '#ffff44');
        grad.addColorStop(0.5, '#ff6600');
        grad.addColorStop(1, '#cc2200');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    onHitEnemy(enemy) {
        super.onHitEnemy(enemy);
        if (this.explosionRadius > 0 && !this._exploded) {
            this._exploded = true;
        }
    }
}

class IceSpikeProjectile extends Projectile {
    draw(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        const angle = Math.atan2(this.vy, this.vx);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.fillStyle = '#88ccff';
        ctx.shadowColor = '#88ccff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.radius * 2, 0);
        ctx.lineTo(-this.radius, -this.radius);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.lineTo(-this.radius, this.radius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class ThrowingKnifeProjectile extends Projectile {
    draw(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        const angle = Math.atan2(this.vy, this.vx);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.fillStyle = '#cccccc';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(this.radius * 3, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.6);
        ctx.lineTo(-this.radius * 0.3, 0);
        ctx.lineTo(-this.radius, this.radius * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class AuraOrb {
    constructor(config, level, index, total) {
        this.config = config;
        this.level = level;
        this.index = index;
        this.total = total;
        this.angle = (Math.PI * 2 / total) * index;
        this.damage = config.damage + (config.levelBonus.damage || 0) * (level - 1);
        this.radius = config.radius;
        this.color = config.color;
        this.orbitRadius = config.orbitRadius;
        this.orbitSpeed = config.orbitSpeed;
        this.hitCooldowns = new Map();
    }

    update(dt, player, enemies) {
        this.angle += this.orbitSpeed * dt * 0.001;
        const ox = player.x + Math.cos(this.angle) * this.orbitRadius;
        const oy = player.y + Math.sin(this.angle) * this.orbitRadius;
        this.x = ox;
        this.y = oy;

        // 碰撞
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const lastHit = this.hitCooldowns.get(enemy.id) || 0;
            if (Date.now() - lastHit < 300) continue;
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            if (Math.hypot(dx, dy) < this.radius + enemy.radius) {
                enemy.takeDamage(this.damage);
                this.hitCooldowns.set(enemy.id, Date.now());
            }
        }
    }

    draw(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class PoisonCloud {
    constructor(x, y, config, level) {
        this.x = x;
        this.y = y;
        this.cloudRadius = config.cloudRadius + (config.levelBonus.cloudRadius || 0) * (level - 1);
        this.duration = config.cloudDuration + (config.levelBonus.cloudDuration || 0) * (level - 1);
        this.tickRate = config.tickRate;
        this.damage = config.damage + (config.levelBonus.damage || 0) * (level - 1);
        this.tickTimer = 0;
        this.age = 0;
        this.alive = true;
    }

    update(dt, enemies) {
        this.age += dt;
        this.tickTimer += dt;
        if (this.age > this.duration) {
            this.alive = false;
            return;
        }
        if (this.tickTimer >= this.tickRate) {
            this.tickTimer -= this.tickRate;
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                if (Math.hypot(dx, dy) < this.cloudRadius + enemy.radius) {
                    enemy.takeDamage(this.damage);
                }
            }
        }
    }

    draw(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        const alpha = Math.max(0, 0.3 * (1 - this.age / this.duration));
        ctx.save();
        ctx.fillStyle = `rgba(68,255,68,${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, this.cloudRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(68,255,68,${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

export class WeaponSystem {
    constructor(player) {
        this.player = player;
        this.weapons = {};
        this.projectiles = [];
        this.auraOrbs = [];
        this.poisonClouds = [];
        this.cooldowns = {};
        this._projId = 0;
    }

    addWeapon(weaponId) {
        if (this.weapons[weaponId]) {
            this.weapons[weaponId]++;
            if (weaponId === 'aura') this._rebuildAura();
            return;
        }
        this.weapons[weaponId] = 1;
        this.cooldowns[weaponId] = 0;
        if (weaponId === 'aura') this._rebuildAura();
    }

    _rebuildAura() {
        const cfg = WEAPONS.aura;
        const level = this.weapons.aura;
        const total = cfg.orbitCount + (cfg.levelBonus.orbitCount || 0) * (level - 1) + this.player.projectileBonus;
        this.auraOrbs = [];
        for (let i = 0; i < total; i++) {
            this.auraOrbs.push(new AuraOrb(cfg, level, i, total));
        }
    }

    update(dt, enemies) {
        const now = Date.now();
        const p = this.player;

        for (const [id, level] of Object.entries(this.weapons)) {
            if (id === 'aura') continue;
            const cfg = WEAPONS[id];
            const cd = cfg.cooldown * this.player.cooldownMultiplier;
            if (cd <= 0) continue;
            if (now - this.cooldowns[id] < cd) continue;
            this.cooldowns[id] = now;

            const shots = 1 + this.player.projectileBonus;
            for (let s = 0; s < shots; s++) {
                this._fireWeapon(id, cfg, level, s, shots);
            }
        }

        // 更新投射物
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, enemies);

            // 火球爆炸
            if (proj.type === 'fireball' && !proj.alive && proj.explosionRadius > 0 && proj._exploded) {
                this._fireballExplode(proj, enemies);
            }

            if (!proj.alive) this.projectiles.splice(i, 1);
        }

        // 更新光环
        for (const orb of this.auraOrbs) {
            orb.update(dt, p, enemies);
        }

        // 更新毒雾
        for (let i = this.poisonClouds.length - 1; i >= 0; i--) {
            this.poisonClouds[i].update(dt, enemies);
            if (!this.poisonClouds[i].alive) this.poisonClouds.splice(i, 1);
        }
    }

    _fireWeapon(id, cfg, level, shotIndex, totalShots) {
        const p = this.player;
        const enemies = this._getNearbyEnemies(cfg.range + 100);
        if (enemies.length === 0 && id !== 'holy_light' && id !== 'poison_cloud') return;

        switch (id) {
            case 'sword_wave': this._fireSwordWave(cfg, level, enemies); break;
            case 'fireball': this._fireFireball(cfg, level, enemies); break;
            case 'lightning': this._fireLightning(cfg, level, enemies); break;
            case 'holy_light': this._fireHolyLight(cfg, level, enemies); break;
            case 'ice_spike': this._fireIceSpike(cfg, level, enemies); break;
            case 'poison_cloud': this._firePoisonCloud(cfg, level, enemies); break;
            case 'throwing_knife': this._fireThrowingKnife(cfg, level, enemies); break;
        }
    }

    _fireSwordWave(cfg, level, enemies) {
        const nearest = this._findNearest(enemies);
        if (!nearest) return;
        const angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        const speed = cfg.speed + (cfg.levelBonus.speed || 0) * (level - 1);
        const proj = new Projectile(
            this.player.x, this.player.y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            cfg, level
        );
        this.projectiles.push(proj);
        sound.swordWave();
    }

    _fireFireball(cfg, level, enemies) {
        const nearest = this._findNearest(enemies);
        if (!nearest) return;
        const angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        const proj = new FireballProjectile(
            this.player.x, this.player.y,
            Math.cos(angle) * cfg.speed, Math.sin(angle) * cfg.speed,
            cfg, level
        );
        this.projectiles.push(proj);
        sound.fireball();
    }

    _fireLightning(cfg, level, enemies) {
        const chainCount = cfg.chainCount + (cfg.levelBonus.chainCount || 0) * (level - 1);
        const damage = cfg.damage + (cfg.levelBonus.damage || 0) * (level - 1);
        const targets = [];
        let current = this._findNearest(enemies);
        const hit = new Set();

        for (let i = 0; i < chainCount && current; i++) {
            targets.push({ x: current.x, y: current.y });
            hit.add(current.id);
            current.takeDamage(damage * (i === 0 ? 1 : 0.7));
            // 找下一个最近的
            let next = null;
            let minDist = 200;
            for (const e of enemies) {
                if (!e.alive || hit.has(e.id)) continue;
                const d = Math.hypot(e.x - current.x, e.y - current.y);
                if (d < minDist) { minDist = d; next = e; }
            }
            current = next;
        }

        if (targets.length > 0) {
            // 存储闪电链效果
            this._lightningChains = this._lightningChains || [];
            this._lightningChains.push({
                points: [{ x: this.player.x, y: this.player.y }, ...targets],
                age: 0,
                maxAge: 200,
            });
            sound.lightning();
        }
    }

    _fireHolyLight(cfg, level, enemies) {
        const damage = cfg.damage + (cfg.levelBonus.damage || 0) * (level - 1);
        const aoeRadius = (cfg.aoeRadius + (cfg.levelBonus.aoeRadius || 0) * (level - 1)) * this.player.areaMultiplier;
        for (const enemy of enemies) {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            if (Math.hypot(dx, dy) < aoeRadius + enemy.radius) {
                enemy.takeDamage(damage);
            }
        }
        this._holyLightEffect = { radius: aoeRadius, age: 0, maxAge: 400 };
        sound.holyLight();
    }

    _fireIceSpike(cfg, level, enemies) {
        const nearest = this._findNearest(enemies);
        if (!nearest) return;
        const angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        const proj = new IceSpikeProjectile(
            this.player.x, this.player.y,
            Math.cos(angle) * cfg.speed, Math.sin(angle) * cfg.speed,
            cfg, level
        );
        this.projectiles.push(proj);
        sound.iceSpike();
    }

    _firePoisonCloud(cfg, level, enemies) {
        let tx = this.player.x, ty = this.player.y;
        if (enemies.length > 0) {
            const target = this._findNearest(enemies);
            if (target) {
                const dx = target.x - this.player.x;
                const dy = target.y - this.player.y;
                const d = Math.hypot(dx, dy);
                const maxDist = cfg.range;
                if (d > maxDist) {
                    tx = this.player.x + (dx / d) * maxDist;
                    ty = this.player.y + (dy / d) * maxDist;
                } else {
                    tx = target.x;
                    ty = target.y;
                }
            }
        }
        this.poisonClouds.push(new PoisonCloud(tx, ty, cfg, level));
        sound.poisonCloud();
    }

    _fireThrowingKnife(cfg, level, enemies) {
        const nearest = this._findNearest(enemies);
        if (!nearest) return;
        const angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        const speed = cfg.speed + (cfg.levelBonus.speed || 0) * (level - 1);
        const proj = new ThrowingKnifeProjectile(
            this.player.x, this.player.y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            cfg, level
        );
        this.projectiles.push(proj);
        sound.throwingKnife();
    }

    _fireballExplode(proj, enemies) {
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const dx = enemy.x - proj.x;
            const dy = enemy.y - proj.y;
            if (Math.hypot(dx, dy) < proj.explosionRadius + enemy.radius) {
                enemy.takeDamage(proj.damage * 0.5);
            }
        }
        sound.explosion();
    }

    _getNearbyEnemies(range) {
        const p = this.player;
        return (this._allEnemies || []).filter(e => {
            if (!e.alive) return false;
            return Math.hypot(e.x - p.x, e.y - p.y) < range;
        });
    }

    _findNearest(enemies) {
        const p = this.player;
        let nearest = null;
        let minDist = Infinity;
        for (const e of enemies) {
            if (!e.alive) continue;
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < minDist) { minDist = d; nearest = e; }
        }
        return nearest;
    }

    setEnemies(enemies) {
        this._allEnemies = enemies;
    }

    draw(ctx, camera) {
        // 投射物
        for (const proj of this.projectiles) {
            proj.draw(ctx, camera);
        }

        // 光环
        for (const orb of this.auraOrbs) {
            orb.draw(ctx, camera);
        }

        // 毒雾
        for (const cloud of this.poisonClouds) {
            cloud.draw(ctx, camera);
        }

        // 闪电链效果
        if (this._lightningChains) {
            for (let i = this._lightningChains.length - 1; i >= 0; i--) {
                const chain = this._lightningChains[i];
                chain.age += 16;
                if (chain.age > chain.maxAge) {
                    this._lightningChains.splice(i, 1);
                    continue;
                }
                const alpha = 1 - chain.age / chain.maxAge;
                ctx.save();
                ctx.strokeStyle = `rgba(255,255,0,${alpha})`;
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 15;
                ctx.lineWidth = 3;
                ctx.beginPath();
                for (let j = 0; j < chain.points.length; j++) {
                    const pt = chain.points[j];
                    const sx = pt.x - camera.x + (Math.random() - 0.5) * 8;
                    const sy = pt.y - camera.y + (Math.random() - 0.5) * 8;
                    if (j === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.stroke();
                ctx.restore();
            }
        }

        // 圣光效果
        if (this._holyLightEffect) {
            const hl = this._holyLightEffect;
            hl.age += 16;
            if (hl.age > hl.maxAge) {
                this._holyLightEffect = null;
            } else {
                const alpha = 1 - hl.age / hl.maxAge;
                const sx = this.player.x - camera.x;
                const sy = this.player.y - camera.y;
                ctx.save();
                const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, hl.radius);
                grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`);
                grad.addColorStop(0.7, `rgba(255,255,200,${alpha * 0.3})`);
                grad.addColorStop(1, `rgba(255,255,200,0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx, sy, hl.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }
}
