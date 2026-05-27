// ============================================================
// enemies.js - 10种敌人+Boss（波次生成、AI行为）
// ============================================================

import { ENEMY_TYPES, WAVE_CONFIG, GAME } from './config.js';
import { sound } from './sound.js';

let enemyIdCounter = 0;

export class Enemy {
    constructor(type, x, y, curseLevel = 0) {
        const cfg = ENEMY_TYPES[type];
        this.id = ++enemyIdCounter;
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = cfg.radius;
        this.speed = cfg.speed;
        this.baseSpeed = cfg.speed;
        this.damage = cfg.damage;
        this.maxHp = cfg.hp * (1 - curseLevel * 0.15);
        this.hp = this.maxHp;
        this.xp = cfg.xp;
        this.color = cfg.color;
        this.behavior = cfg.behavior;
        this.alive = true;
        this.hitFlash = 0;

        // 行为特定
        this.attackRange = cfg.attackRange || 0;
        this.attackCooldown = cfg.attackCooldown || 0;
        this.projectileSpeed = cfg.projectileSpeed || 0;
        this.lastAttack = 0;
        this.phaseDuration = cfg.phaseDuration || 0;
        this.visibleDuration = cfg.visibleDuration || 0;
        this.phaseTimer = 0;
        this.visible = true;
        this.splitCount = cfg.splitCount || 0;
        this.healRange = cfg.healRange || 0;
        this.healAmount = cfg.healAmount || 0;
        this.healCooldown = cfg.healCooldown || 0;
        this.lastHeal = 0;
        this.chargeSpeed = cfg.chargeSpeed || 0;
        this.chargeCooldown = cfg.chargeCooldown || 0;
        this.chargeRange = cfg.chargeRange || 0;
        this.lastCharge = 0;
        this.charging = false;
        this.chargeTarget = null;
        this.chargeTimer = 0;

        // Zigzag行为
        this.zigzagTimer = 0;
        this.zigzagOffset = Math.random() * Math.PI * 2;

        // Boss行为
        this.bossProjectiles = [];

        this.spawnTime = Date.now();
    }

    update(dt, player) {
        if (!this.alive) return;

        this.hitFlash = Math.max(0, this.hitFlash - dt);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        switch (this.behavior) {
            case 'chase':
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                break;

            case 'zigzag':
                this.zigzagTimer += dt * 0.003;
                const zigAngle = angle + Math.sin(this.zigzagTimer + this.zigzagOffset) * 1.2;
                this.x += Math.cos(zigAngle) * this.speed;
                this.y += Math.sin(zigAngle) * this.speed;
                break;

            case 'ranged':
                if (dist > this.attackRange) {
                    this.x += Math.cos(angle) * this.speed;
                    this.y += Math.sin(angle) * this.speed;
                }
                if (dist < this.attackRange && Date.now() - this.lastAttack > this.attackCooldown) {
                    this.lastAttack = Date.now();
                    this.bossProjectiles.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * this.projectileSpeed,
                        vy: Math.sin(angle) * this.projectileSpeed,
                        damage: this.damage * 0.6,
                        alive: true, age: 0,
                    });
                }
                break;

            case 'phase':
                this.phaseTimer += dt;
                if (this.visible && this.phaseTimer > this.visibleDuration) {
                    this.visible = false;
                    this.phaseTimer = 0;
                } else if (!this.visible && this.phaseTimer > this.phaseDuration) {
                    this.visible = true;
                    this.phaseTimer = 0;
                }
                if (this.visible) {
                    this.x += Math.cos(angle) * this.speed;
                    this.y += Math.sin(angle) * this.speed;
                }
                break;

            case 'split':
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                break;

            case 'healer':
                if (dist > 150) {
                    this.x += Math.cos(angle) * this.speed;
                    this.y += Math.sin(angle) * this.speed;
                }
                break;

            case 'charge':
                if (this.charging) {
                    this.chargeTimer -= dt;
                    this.x += Math.cos(this.chargeAngle) * this.chargeSpeed;
                    this.y += Math.sin(this.chargeAngle) * this.chargeSpeed;
                    if (this.chargeTimer <= 0) {
                        this.charging = false;
                        this.lastCharge = Date.now();
                    }
                } else {
                    if (dist < this.chargeRange && Date.now() - this.lastCharge > this.chargeCooldown) {
                        this.charging = true;
                        this.chargeAngle = angle;
                        this.chargeTimer = 500;
                    } else {
                        this.x += Math.cos(angle) * this.speed;
                        this.y += Math.sin(angle) * this.speed;
                    }
                }
                break;

            case 'swarm':
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                break;

            case 'boss':
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                if (Date.now() - this.lastAttack > this.attackCooldown) {
                    this.lastAttack = Date.now();
                    // Boss发射多方向弹幕
                    const count = 8;
                    for (let i = 0; i < count; i++) {
                        const a = (Math.PI * 2 / count) * i + Date.now() * 0.001;
                        this.bossProjectiles.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * this.projectileSpeed,
                            vy: Math.sin(a) * this.projectileSpeed,
                            damage: this.damage * 0.4,
                            alive: true, age: 0,
                        });
                    }
                }
                break;
        }

        // 更新Boss/远程弹幕
        for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
            const bp = this.bossProjectiles[i];
            bp.x += bp.vx;
            bp.y += bp.vy;
            bp.age += dt;
            if (bp.age > 3000 || bp.x < 0 || bp.x > GAME.WORLD_WIDTH || bp.y < 0 || bp.y > GAME.WORLD_HEIGHT) {
                this.bossProjectiles.splice(i, 1);
            }
        }

        // 边界限制
        this.x = Math.max(this.radius, Math.min(GAME.WORLD_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(GAME.WORLD_HEIGHT - this.radius, this.y));
    }

    takeDamage(amount) {
        if (!this.alive) return;
        if (this.behavior === 'phase' && !this.visible) return;
        this.hp -= amount;
        this.hitFlash = 100;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    applySlow(factor, duration) {
        this.speed = this.baseSpeed * factor;
        clearTimeout(this._slowTimer);
        this._slowTimer = setTimeout(() => {
            this.speed = this.baseSpeed;
        }, duration);
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        if (this.behavior === 'phase' && !this.visible) {
            // 幽灵隐形时显示淡影
            const sx = this.x - camera.x;
            const sy = this.y - camera.y;
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        ctx.save();

        // 受伤闪白
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        // 根据类型绘制不同外形
        switch (this.type) {
            case 'slime':
                this._drawSlime(ctx, sx, sy);
                break;
            case 'bat':
                this._drawBat(ctx, sx, sy);
                break;
            case 'skeleton':
                this._drawSkeleton(ctx, sx, sy);
                break;
            case 'archer':
                this._drawArcher(ctx, sx, sy);
                break;
            case 'ghost':
                this._drawGhost(ctx, sx, sy);
                break;
            case 'splitter':
                this._drawSplitter(ctx, sx, sy);
                break;
            case 'healer':
                this._drawHealer(ctx, sx, sy);
                break;
            case 'charger':
                this._drawCharger(ctx, sx, sy);
                break;
            case 'swarm':
                this._drawSwarm(ctx, sx, sy);
                break;
            case 'boss':
                this._drawBoss(ctx, sx, sy);
                break;
            default:
                ctx.beginPath();
                ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
                ctx.fill();
        }

        // 血条（非满血时显示）
        if (this.hp < this.maxHp) {
            const barW = this.radius * 2;
            const barH = 3;
            const barX = sx - barW / 2;
            const barY = sy - this.radius - 8;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = this.type === 'boss' ? '#ff4444' : '#44ff44';
            ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);
        }

        ctx.restore();

        // Boss弹幕
        for (const bp of this.bossProjectiles) {
            const bsx = bp.x - camera.x;
            const bsy = bp.y - camera.y;
            ctx.save();
            ctx.fillStyle = '#ff4400';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(bsx, bsy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    _drawSlime(ctx, sx, sy) {
        const bounce = Math.sin(Date.now() * 0.005) * 2;
        ctx.beginPath();
        ctx.ellipse(sx, sy + bounce, this.radius, this.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22aa22';
        ctx.beginPath();
        ctx.arc(sx - 3, sy - 3 + bounce, 2.5, 0, Math.PI * 2);
        ctx.arc(sx + 3, sy - 3 + bounce, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawBat(ctx, sx, sy) {
        const wing = Math.sin(Date.now() * 0.015) * 6;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // 翅膀
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy);
        ctx.quadraticCurveTo(sx - this.radius - wing, sy - 8, sx - this.radius * 1.2, sy + 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + 3, sy);
        ctx.quadraticCurveTo(sx + this.radius + wing, sy - 8, sx + this.radius * 1.2, sy + 2);
        ctx.fill();
        // 眼睛
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(sx - 2, sy - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(sx + 2, sy - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSkeleton(ctx, sx, sy) {
        // 头
        ctx.beginPath();
        ctx.arc(sx, sy - 4, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // 身体
        ctx.fillRect(sx - 4, sy + 2, 8, 10);
        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(sx - 3, sy - 5, 2, 0, Math.PI * 2);
        ctx.arc(sx + 3, sy - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawArcher(ctx, sx, sy) {
        ctx.beginPath();
        ctx.arc(sx, sy - 4, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 3, sy + 2, 6, 10);
        // 弓
        ctx.strokeStyle = '#885522';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + 10, sy, 10, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.stroke();
    }

    _drawGhost(ctx, sx, sy) {
        const wave = Math.sin(Date.now() * 0.004) * 3;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy - 3 + wave, this.radius * 0.7, Math.PI, 0);
        ctx.lineTo(sx + this.radius * 0.7, sy + this.radius * 0.5 + wave);
        // 波浪底部
        for (let i = 0; i < 4; i++) {
            const px = sx + this.radius * 0.7 - (this.radius * 1.4 / 4) * (i + 0.5);
            const py = sy + this.radius * 0.5 + wave + (i % 2 === 0 ? 5 : 0);
            ctx.lineTo(px, py);
        }
        ctx.lineTo(sx - this.radius * 0.7, sy + this.radius * 0.5 + wave);
        ctx.fill();
        // 眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx - 4, sy - 4 + wave, 3, 0, Math.PI * 2);
        ctx.arc(sx + 4, sy - 4 + wave, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(sx - 3, sy - 4 + wave, 1.5, 0, Math.PI * 2);
        ctx.arc(sx + 5, sy - 4 + wave, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSplitter(ctx, sx, sy) {
        const pulse = Math.sin(Date.now() * 0.006) * 2;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawHealer(ctx, sx, sy) {
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // 十字
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 2, sy - 6, 4, 12);
        ctx.fillRect(sx - 6, sy - 2, 12, 4);
        // 治疗光环
        if (Date.now() - this.lastHeal < this.healCooldown) {
            ctx.strokeStyle = 'rgba(255,100,170,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, this.healRange, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    _drawCharger(ctx, sx, sy) {
        ctx.beginPath();
        if (this.charging) {
            // 冲锋时拉长
            const angle = this.chargeAngle;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            ctx.ellipse(0, 0, this.radius * 1.4, this.radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        // 角
        ctx.fillStyle = '#aa0000';
        ctx.beginPath();
        ctx.moveTo(sx - 6, sy - this.radius);
        ctx.lineTo(sx - 2, sy - this.radius - 8);
        ctx.lineTo(sx, sy - this.radius);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + 6, sy - this.radius);
        ctx.lineTo(sx + 2, sy - this.radius - 8);
        ctx.lineTo(sx, sy - this.radius);
        ctx.fill();
    }

    _drawSwarm(ctx, sx, sy) {
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#668800';
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawBoss(ctx, sx, sy) {
        const pulse = Math.sin(Date.now() * 0.003) * 3;
        // 光环
        ctx.save();
        ctx.strokeStyle = 'rgba(255,0,0,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius + 10 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        // 身体
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();
        // 面部
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(sx - 8, sy - 6, 4, 0, Math.PI * 2);
        ctx.arc(sx + 8, sy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(sx - 8, sy - 6, 2, 0, Math.PI * 2);
        ctx.arc(sx + 8, sy - 6, 2, 0, Math.PI * 2);
        ctx.fill();
        // 嘴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy + 4, 8, 0, Math.PI);
        ctx.stroke();
    }
}

export class EnemySpawner {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.gameTime = 0;
        this.wave = 0;
        this.bossTimer = 0;
        this.bossSpawned = false;
        this.spawnRate = WAVE_CONFIG.baseSpawnRate;
    }

    update(dt, player, curseLevel) {
        this.gameTime += dt / 1000;
        this.spawnTimer += dt;
        this.bossTimer += dt / 1000;

        // 每60秒Boss
        if (this.bossTimer >= GAME.BOSS_INTERVAL && !this.bossSpawned) {
            this._spawnBoss(player, curseLevel);
            this.bossSpawned = true;
        }
        if (this.bossTimer >= GAME.BOSS_INTERVAL + 5) {
            this.bossTimer = 0;
            this.bossSpawned = false;
        }

        // 难度递增
        const difficulty = Math.floor(this.gameTime / 60);
        this.spawnRate = Math.max(
            WAVE_CONFIG.minSpawnRate,
            WAVE_CONFIG.baseSpawnRate - difficulty * WAVE_CONFIG.spawnRateDecay
        );

        // 生成敌人
        if (this.spawnTimer >= this.spawnRate && this.enemies.length < GAME.MAX_ENEMIES) {
            this.spawnTimer = 0;
            this._spawnEnemy(player, curseLevel);
        }

        // 更新所有敌人
        for (const enemy of this.enemies) {
            enemy.update(dt, player);
        }

        // 清理死亡敌人
        this.enemies = this.enemies.filter(e => e.alive);

        // 治疗者治疗逻辑
        for (const enemy of this.enemies) {
            if (enemy.behavior === 'healer' && enemy.alive) {
                if (Date.now() - enemy.lastHeal > enemy.healCooldown) {
                    enemy.lastHeal = Date.now();
                    for (const other of this.enemies) {
                        if (other === enemy || !other.alive) continue;
                        const dx = other.x - enemy.x;
                        const dy = other.y - enemy.y;
                        if (Math.hypot(dx, dy) < enemy.healRange) {
                            other.hp = Math.min(other.hp + enemy.healAmount, other.maxHp);
                        }
                    }
                }
            }
        }
    }

    _getSpawnWeights() {
        let weights = WAVE_CONFIG.enemyTypeWeights[0];
        for (const [time, w] of Object.entries(WAVE_CONFIG.enemyTypeWeights)) {
            if (this.gameTime >= Number(time)) weights = w;
        }
        return weights;
    }

    _spawnEnemy(player, curseLevel) {
        const weights = this._getSpawnWeights();
        const type = this._weightedRandom(weights);
        const pos = this._getSpawnPos(player);
        this.enemies.push(new Enemy(type, pos.x, pos.y, curseLevel));
    }

    _spawnBoss(player, curseLevel) {
        const pos = this._getSpawnPos(player);
        const boss = new Enemy('boss', pos.x, pos.y, curseLevel);
        boss.maxHp *= (1 + this.wave * 0.3);
        boss.hp = boss.maxHp;
        this.enemies.push(boss);
        this.wave++;
        sound.bossAppear();
    }

    _getSpawnPos(player) {
        const margin = 100;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = player.x + (Math.random() - 0.5) * GAME.WIDTH; y = player.y - GAME.HEIGHT / 2 - margin; break;
            case 1: x = player.x + (Math.random() - 0.5) * GAME.WIDTH; y = player.y + GAME.HEIGHT / 2 + margin; break;
            case 2: x = player.x - GAME.WIDTH / 2 - margin; y = player.y + (Math.random() - 0.5) * GAME.HEIGHT; break;
            case 3: x = player.x + GAME.WIDTH / 2 + margin; y = player.y + (Math.random() - 0.5) * GAME.HEIGHT; break;
        }
        return {
            x: Math.max(20, Math.min(GAME.WORLD_WIDTH - 20, x)),
            y: Math.max(20, Math.min(GAME.WORLD_HEIGHT - 20, y)),
        };
    }

    _weightedRandom(weights) {
        const entries = Object.entries(weights);
        const total = entries.reduce((s, [, w]) => s + w, 0);
        let r = Math.random() * total;
        for (const [type, weight] of entries) {
            r -= weight;
            if (r <= 0) return type;
        }
        return entries[0][0];
    }

    draw(ctx, camera) {
        for (const enemy of this.enemies) {
            enemy.draw(ctx, camera);
        }
    }
}
