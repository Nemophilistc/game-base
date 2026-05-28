// enemies.js - Bats, snakes, spiders, skeletons with AI
import { TILE, GRAVITY, ENEMY_CFG, T, COLORS } from './config.js';
import { Sound } from './sound.js';

export class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        const cfg = ENEMY_CFG[type];
        this.w = cfg.w;
        this.h = cfg.h;
        this.hp = cfg.hp;
        this.speed = cfg.speed;
        this.damage = cfg.damage;
        this.score = cfg.score;
        this.dead = false;
        this.facing = Math.random() < 0.5 ? 1 : -1;
        this.state = 'idle';
        this.stateTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.originX = x;
        this.originY = y;

        // Bat specific
        this.swooping = false;
        this.swoopTarget = { x: 0, y: 0 };
        this.wingAngle = 0;

        // Spider specific
        this.hangY = y;
        this.dropY = y + 200;
        this.dropping = false;
        this.webLength = 0;

        // Skeleton specific
        this.chasing = false;
        this.alertTimer = 0;

        // Snake specific
        this.patrolDir = this.facing;
        this.hissTimer = 0;
    }

    update(dt, level, playerX, playerY) {
        if (this.dead) return;

        const dtScale = dt / 16.667;
        this.animTimer += dt;
        if (this.animTimer > 150) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
        this.stateTimer += dt;

        switch (this.type) {
            case 'bat': this._updateBat(dt, dtScale, level, playerX, playerY); break;
            case 'snake': this._updateSnake(dt, dtScale, level, playerX, playerY); break;
            case 'spider': this._updateSpider(dt, dtScale, level, playerX, playerY); break;
            case 'skeleton': this._updateSkeleton(dt, dtScale, level, playerX, playerY); break;
        }
    }

    _updateBat(dt, dtScale, level, px, py) {
        this.wingAngle += dt * 0.015;
        const dist = Math.hypot(px - this.x, py - this.y);

        if (this.state === 'idle') {
            // Hover in a pattern
            this.x = this.originX + Math.sin(Date.now() / 800) * 30;
            this.y = this.originY + Math.cos(Date.now() / 600) * 15;
            if (dist < 150) {
                this.state = 'swoop';
                this.swoopTarget = { x: px, y: py };
                this.stateTimer = 0;
            }
        } else if (this.state === 'swoop') {
            const dx = this.swoopTarget.x - this.x;
            const dy = this.swoopTarget.y - this.y;
            const len = Math.hypot(dx, dy);
            if (len > 2) {
                const cfg = ENEMY_CFG.bat;
                this.x += (dx / len) * cfg.swoopSpeed * dtScale;
                this.y += (dy / len) * cfg.swoopSpeed * dtScale;
            }
            this.facing = dx > 0 ? 1 : -1;
            if (this.stateTimer > 2000 || len < 10) {
                this.state = 'retreat';
                this.stateTimer = 0;
            }
        } else if (this.state === 'retreat') {
            const dx = this.originX - this.x;
            const dy = this.originY - this.y;
            const len = Math.hypot(dx, dy);
            if (len > 5) {
                this.x += (dx / len) * this.speed * dtScale;
                this.y += (dy / len) * this.speed * dtScale;
            }
            if (this.stateTimer > 1500) {
                this.state = 'idle';
                this.stateTimer = 0;
            }
        }
    }

    _updateSnake(dt, dtScale, level, px, py) {
        const dist = Math.hypot(px - this.x, py - this.y);

        if (this.state === 'idle') {
            // Patrol
            this.vx = this.patrolDir * this.speed;
            this.x += this.vx * dtScale;
            this.facing = this.patrolDir;

            // Check wall or edge
            const frontCol = Math.floor((this.x + this.patrolDir * (this.w / 2 + 2)) / TILE);
            const groundCol = Math.floor((this.x + this.patrolDir * (this.w / 2)) / TILE);
            const groundRow = Math.floor((this.y + this.h + 2) / TILE);
            const wallRow = Math.floor(this.y / TILE);

            if (level.isSolid(frontCol, wallRow) || !level.isSolid(groundCol, groundRow)) {
                this.patrolDir *= -1;
                this.stateTimer = 0;
            }

            // Chase player if close
            if (dist < 100) {
                this.state = 'chase';
                this.stateTimer = 0;
            }

            // Random pause
            if (this.stateTimer > 3000 && Math.random() < 0.01) {
                this.state = 'pause';
                this.stateTimer = 0;
            }
        } else if (this.state === 'chase') {
            const dx = px - this.x;
            this.patrolDir = dx > 0 ? 1 : -1;
            this.vx = this.patrolDir * this.speed * 1.5;
            this.x += this.vx * dtScale;
            this.facing = this.patrolDir;

            const frontCol = Math.floor((this.x + this.patrolDir * (this.w / 2 + 2)) / TILE);
            const wallRow = Math.floor(this.y / TILE);
            if (level.isSolid(frontCol, wallRow)) {
                this.x -= this.vx * dtScale;
            }

            if (dist > 180 || this.stateTimer > 4000) {
                this.state = 'idle';
                this.stateTimer = 0;
            }
        } else if (this.state === 'pause') {
            if (this.stateTimer > 1500) {
                this.state = 'idle';
                this.stateTimer = 0;
            }
        }

        // Gravity
        const footCol = Math.floor(this.x / TILE);
        const footRow = Math.floor((this.y + this.h + 1) / TILE);
        if (!level.isSolid(footCol, footRow)) {
            this.vy += GRAVITY * dtScale;
            if (this.vy > 8) this.vy = 8;
        } else {
            this.vy = 0;
            this.y = footRow * TILE - this.h;
        }
        this.y += this.vy * dtScale;
    }

    _updateSpider(dt, dtScale, level, px, py) {
        const dist = Math.hypot(px - this.x, py - this.y);

        if (this.state === 'idle') {
            // Hang and sway
            this.webLength = this.y - this.hangY;
            this.x = this.originX + Math.sin(Date.now() / 1000) * 10;
            if (dist < 120 && Math.abs(px - this.x) < 60) {
                this.state = 'drop';
                this.dropping = true;
                this.stateTimer = 0;
            }
        } else if (this.state === 'drop') {
            this.y += ENEMY_CFG.spider.dropSpeed * dtScale;
            const row = Math.floor((this.y + this.h) / TILE);
            const col = Math.floor(this.x / TILE);
            if (level.isSolid(col, row) || this.stateTimer > 1500) {
                this.dropping = false;
                this.state = 'ground';
                this.stateTimer = 0;
            }
        } else if (this.state === 'ground') {
            // Chase on ground
            const dx = px - this.x;
            this.facing = dx > 0 ? 1 : -1;
            this.x += this.facing * this.speed * dtScale;

            const footCol = Math.floor(this.x / TILE);
            const footRow = Math.floor((this.y + this.h + 1) / TILE);
            if (!level.isSolid(footCol, footRow)) {
                this.vy += GRAVITY * dtScale;
            } else {
                this.vy = 0;
                this.y = footRow * TILE - this.h;
            }
            this.y += this.vy * dtScale;

            const frontCol = Math.floor((this.x + this.facing * (this.w / 2 + 2)) / TILE);
            const wallRow = Math.floor(this.y / TILE);
            if (level.isSolid(frontCol, wallRow)) {
                this.x -= this.facing * this.speed * dtScale;
            }

            if (this.stateTimer > 5000) {
                this.state = 'climb';
                this.stateTimer = 0;
            }
        } else if (this.state === 'climb') {
            // Climb back up
            this.y -= 1.5 * dtScale;
            if (this.y <= this.originY) {
                this.y = this.originY;
                this.x = this.originX;
                this.state = 'idle';
                this.stateTimer = 0;
            }
        }
    }

    _updateSkeleton(dt, dtScale, level, px, py) {
        const dist = Math.hypot(px - this.x, py - this.y);

        if (this.state === 'idle') {
            // Patrol
            this.vx = this.patrolDir * this.speed;
            this.x += this.vx * dtScale;
            this.facing = this.patrolDir;

            const frontCol = Math.floor((this.x + this.patrolDir * (this.w / 2 + 2)) / TILE);
            const groundCol = Math.floor((this.x + this.patrolDir * (this.w / 2)) / TILE);
            const groundRow = Math.floor((this.y + this.h + 2) / TILE);
            const wallRow = Math.floor(this.y / TILE);

            if (level.isSolid(frontCol, wallRow) || !level.isSolid(groundCol, groundRow)) {
                this.patrolDir *= -1;
            }

            if (dist < 180) {
                this.state = 'alert';
                this.alertTimer = 0;
                this.stateTimer = 0;
            }
        } else if (this.state === 'alert') {
            // Brief alert pause
            this.facing = px > this.x ? 1 : -1;
            if (this.stateTimer > 500) {
                this.state = 'chase';
                this.chasing = true;
                this.stateTimer = 0;
            }
        } else if (this.state === 'chase') {
            const dx = px - this.x;
            this.facing = dx > 0 ? 1 : -1;
            this.vx = this.facing * ENEMY_CFG.skeleton.chaseSpeed;
            this.x += this.vx * dtScale;

            // Jump over obstacles
            const frontCol = Math.floor((this.x + this.facing * (this.w / 2 + 4)) / TILE);
            const wallRow = Math.floor((this.y + this.h / 2) / TILE);
            const footRow = Math.floor((this.y + this.h + 1) / TILE);
            const groundCol = Math.floor(this.x / TILE);

            if (level.isSolid(frontCol, wallRow)) {
                if (level.isSolid(groundCol, footRow)) {
                    this.vy = -7;
                }
                this.x -= this.vx * dtScale;
            }

            // Gravity
            if (!level.isSolid(groundCol, footRow)) {
                this.vy += GRAVITY * dtScale;
                if (this.vy > 8) this.vy = 8;
            } else {
                this.vy = 0;
                this.y = footRow * TILE - this.h;
            }
            this.y += this.vy * dtScale;

            if (dist > 250 || this.stateTimer > 6000) {
                this.state = 'idle';
                this.chasing = false;
                this.stateTimer = 0;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.dead = true;
            Sound.enemyDie();
            return true;
        }
        return false;
    }

    getHitbox() {
        return {
            x: this.x - this.w / 2,
            y: this.y,
            w: this.w,
            h: this.h
        };
    }

    render(ctx) {
        if (this.dead) return;

        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const f = this.facing;

        switch (this.type) {
            case 'bat': this._renderBat(ctx, x, y, f); break;
            case 'snake': this._renderSnake(ctx, x, y, f); break;
            case 'spider': this._renderSpider(ctx, x, y, f); break;
            case 'skeleton': this._renderSkeleton(ctx, x, y, f); break;
        }
    }

    _renderBat(ctx, x, y, f) {
        const wing = Math.sin(this.wingAngle) * 8;

        // Wings
        ctx.fillStyle = COLORS.batWing;
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.quadraticCurveTo(x - 12 * f, y + 8 + wing, x - 16 * f, y + 2);
        ctx.lineTo(x - 12 * f, y + 6);
        ctx.quadraticCurveTo(x - 6 * f, y + 10 + wing * 0.5, x, y + 8);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.quadraticCurveTo(x + 12 * f, y + 8 - wing, x + 16 * f, y + 2);
        ctx.lineTo(x + 12 * f, y + 6);
        ctx.quadraticCurveTo(x + 6 * f, y + 10 - wing * 0.5, x, y + 8);
        ctx.fill();

        // Body
        ctx.fillStyle = COLORS.bat;
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x + f * 2 - 1, y + 6, 2, 2);
        ctx.fillRect(x + f * 2 + 2, y + 6, 2, 2);

        // Ears
        ctx.fillStyle = COLORS.bat;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 4);
        ctx.lineTo(x - 6, y - 2);
        ctx.lineTo(x - 2, y + 3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + 6, y - 2);
        ctx.lineTo(x + 2, y + 3);
        ctx.fill();
    }

    _renderSnake(ctx, x, y, f) {
        // Body segments
        ctx.fillStyle = COLORS.snake;
        for (let i = 0; i < 4; i++) {
            const sx = x - f * i * 5 + Math.sin(Date.now() / 200 + i) * 2;
            const sy = y + 12 + Math.cos(Date.now() / 300 + i * 0.8) * 1;
            ctx.beginPath();
            ctx.ellipse(sx, sy, i === 0 ? 6 : 4 - i * 0.5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Head
        ctx.fillStyle = COLORS.snakePattern;
        ctx.beginPath();
        ctx.ellipse(x + f * 4, y + 8, 7, 5, f * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pattern
        ctx.fillStyle = COLORS.snake;
        ctx.beginPath();
        ctx.ellipse(x + f * 4, y + 10, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + f * 6 - 1, y + 6, 2, 2);
        ctx.fillRect(x + f * 6 + 2, y + 6, 2, 2);
        // Slit pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(x + f * 6, y + 6, 1, 2);
        ctx.fillRect(x + f * 6 + 2, y + 6, 1, 2);

        // Tongue
        if (this.hissTimer > 0 || Math.random() < 0.005) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + f * 8, y + 8);
            ctx.lineTo(x + f * 13, y + 7);
            ctx.moveTo(x + f * 13, y + 7);
            ctx.lineTo(x + f * 15, y + 5);
            ctx.moveTo(x + f * 13, y + 7);
            ctx.lineTo(x + f * 15, y + 9);
            ctx.stroke();
        }
    }

    _renderSpider(ctx, x, y, f) {
        // Web line
        if (this.state === 'idle' || this.state === 'drop') {
            ctx.strokeStyle = 'rgba(200,200,200,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.originX, this.hangY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = COLORS.spider;
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Abdomen
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(x - f * 6, y + 10, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Red pattern on abdomen
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.arc(x - f * 6, y + 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = COLORS.spider;
        ctx.lineWidth = 1.5;
        const legAnim = Math.sin(Date.now() / 100) * 3;
        for (let i = 0; i < 4; i++) {
            const angle = (i - 1.5) * 0.4;
            // Left legs
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle + Math.PI) * 5, y + 8);
            ctx.lineTo(x - 10 - i * 2, y + 2 + legAnim * (i % 2 === 0 ? 1 : -1));
            ctx.stroke();
            // Right legs
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * 5, y + 8);
            ctx.lineTo(x + 10 + i * 2, y + 2 - legAnim * (i % 2 === 0 ? 1 : -1));
            ctx.stroke();
        }

        // Eyes (cluster)
        ctx.fillStyle = COLORS.spiderEye;
        for (let i = 0; i < 4; i++) {
            const ex = x + f * (4 + (i % 2) * 3 - 1);
            const ey = y + 5 + Math.floor(i / 2) * 3;
            ctx.beginPath();
            ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _renderSkeleton(ctx, x, y, f) {
        // Legs
        ctx.fillStyle = COLORS.skeleton;
        const legAnim = this.chasing ? Math.sin(Date.now() / 80) * 4 : 0;
        ctx.fillRect(x - 4, y + 18, 3, 10 + legAnim);
        ctx.fillRect(x + 1, y + 18, 3, 10 - legAnim);

        // Ribcage
        ctx.fillStyle = COLORS.skeleton;
        ctx.fillRect(x - 6, y + 8, 12, 12);
        // Ribs
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 5, y + 10 + i * 3);
            ctx.lineTo(x + 5, y + 10 + i * 3);
            ctx.stroke();
        }

        // Skull
        ctx.fillStyle = COLORS.skeleton;
        ctx.beginPath();
        ctx.arc(x, y + 5, 7, 0, Math.PI * 2);
        ctx.fill();
        // Jaw
        ctx.fillStyle = '#bbb';
        ctx.fillRect(x - 4, y + 9, 8, 3);

        // Eyes
        ctx.fillStyle = this.chasing ? '#ff0000' : COLORS.skeletonEye;
        ctx.fillRect(x + f * 2 - 2, y + 3, 3, 3);
        ctx.fillRect(x + f * 2 + 2, y + 3, 3, 3);

        // Nose
        ctx.fillStyle = '#222';
        ctx.fillRect(x - 1, y + 6, 2, 2);

        // Arms
        ctx.fillStyle = COLORS.skeleton;
        const armAnim = this.chasing ? Math.sin(Date.now() / 100) * 5 : 0;
        ctx.fillRect(x - 8, y + 8, 3, 10 + armAnim);
        ctx.fillRect(x + 5, y + 8, 3, 10 - armAnim);

        // Sword (when chasing)
        if (this.chasing) {
            ctx.fillStyle = '#aaa';
            ctx.save();
            ctx.translate(x + f * 8, y + 8);
            ctx.rotate(f * -0.3);
            ctx.fillRect(0, 0, f * 14, 2);
            // Handle
            ctx.fillStyle = '#654';
            ctx.fillRect(0, -1, f * 4, 4);
            ctx.restore();
        }

        // Alert indicator
        if (this.state === 'alert') {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('!', x - 3, y - 5);
        }
    }
}

export class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    clear() {
        this.enemies = [];
    }

    spawnFromLevel(level) {
        for (const e of level.enemies) {
            this.enemies.push(new Enemy(e.type, e.x, e.y));
        }
    }

    update(dt, level, playerX, playerY) {
        for (const enemy of this.enemies) {
            enemy.update(dt, level, playerX, playerY);
        }
        this.enemies = this.enemies.filter(e => !e.dead);
    }

    render(ctx) {
        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }
    }
}
