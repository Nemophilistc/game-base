// 敌人系统（5×8敌人阵列 + UFO）
import { W, H, ENEMY_ROWS, ENEMY_COLS, ENEMY_W, ENEMY_H, ENEMY_PAD, ENEMY_COLORS } from './config.js';
import { Sound } from './sound.js';
import { spawnParticles } from './particles.js';

export class EnemyManager {
    constructor() {
        this.enemies = [];
        this.enemyDir = 1;
        this.enemyStepTimer = 0;
        this.enemyShootTimer = 0;
        this.ufo = null;
        this.ufoTimer = 0;
    }

    initLevel(level) {
        this.enemies = [];
        this.enemyDir = 1;
        this.enemyStepTimer = 0;
        this.enemyShootTimer = 0;
        this.ufo = null;
        this.ufoTimer = 0;

        for (let r = 0; r < ENEMY_ROWS; r++) {
            for (let c = 0; c < ENEMY_COLS; c++) {
                this.enemies.push({
                    x: 60 + c * (ENEMY_W + ENEMY_PAD),
                    y: 50 + r * (ENEMY_H + ENEMY_PAD),
                    w: ENEMY_W,
                    h: ENEMY_H,
                    hp: ENEMY_ROWS - r,
                    color: ENEMY_COLORS[r % ENEMY_COLORS.length],
                    points: (ENEMY_ROWS - r) * 10,
                    alive: true
                });
            }
        }
    }

    // 检查子弹是否击中敌人或UFO，返回 {hit, scoreAdd, powerupType}
    checkBulletHit(bx, by) {
        // 击中敌人
        for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (!e.alive) continue;
            if (bx > e.x && bx < e.x + e.w && by > e.y && by < e.y + e.h) {
                e.hp--;
                if (e.hp <= 0) {
                    e.alive = false;
                    spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.color, 10);
                    Sound.play('hit');
                    return { hit: true, scoreAdd: e.points, powerupType: null, spawnX: 0, spawnY: 0 };
                }
                return { hit: true, scoreAdd: 0, powerupType: null, spawnX: 0, spawnY: 0 };
            }
        }

        // 击中UFO
        if (this.ufo && bx > this.ufo.x && bx < this.ufo.x + 40 && by > this.ufo.y && by < this.ufo.y + 20) {
            const ux = this.ufo.x + 20, uy = this.ufo.y + 10;
            spawnParticles(ux, uy, '#ffd700', 15);
            const types = ['shield', 'triple', 'rapid', 'heal'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.ufo = null;
            Sound.play('powerup');
            return { hit: true, scoreAdd: 100, powerupType: type, spawnX: ux, spawnY: uy };
        }

        return { hit: false, scoreAdd: 0, powerupType: null, spawnX: 0, spawnY: 0 };
    }

    update(level) {
        // 敌人移动
        this.enemyStepTimer++;
        const stepRate = Math.max(10, 40 - level * 2 - Math.floor((ENEMY_ROWS * ENEMY_COLS - this.enemies.filter(e => e.alive).length) * 0.5));
        if (this.enemyStepTimer >= stepRate) {
            this.enemyStepTimer = 0;
            let hitEdge = false;
            const alive = this.enemies.filter(e => e.alive);
            for (const e of alive) {
                if ((this.enemyDir > 0 && e.x + e.w + 8 > W) || (this.enemyDir < 0 && e.x - 8 < 0)) {
                    hitEdge = true;
                    break;
                }
            }
            if (hitEdge) {
                this.enemyDir *= -1;
                for (const e of alive) e.y += 15;
            } else {
                for (const e of alive) e.x += 8 * this.enemyDir;
            }
        }

        // 敌人射击
        this.enemyShootTimer++;
        const shootRate = Math.max(20, 60 - level * 3);
        if (this.enemyShootTimer >= shootRate) {
            this.enemyShootTimer = 0;
            const alive = this.enemies.filter(e => e.alive);
            if (alive.length > 0) {
                const e = alive[Math.floor(Math.random() * alive.length)];
                return { x: e.x + e.w / 2, y: e.y + e.h, vy: 3 + level * 0.3 };
            }
        }
        return null;
    }

    // Bug#3: UFO随机左右方向
    updateUFO() {
        this.ufoTimer++;
        if (!this.ufo && this.ufoTimer > 600) {
            const dir = Math.random() < 0.5 ? 1 : -1;
            const startX = dir > 0 ? -40 : W + 40;
            this.ufo = { x: startX, y: 25, dir };
            this.ufoTimer = 0;
            Sound.play('ufo');
        }
        if (this.ufo) {
            this.ufo.x += 1.5 * this.ufo.dir;
            // 从左进检查右边界，从右进检查左边界
            if ((this.ufo.dir > 0 && this.ufo.x > W + 40) || (this.ufo.dir < 0 && this.ufo.x < -40)) {
                this.ufo = null;
            }
        }
    }

    // 检查敌人是否到达底部（Bug#2: 调整为H-55）
    reachedBottom() {
        return this.enemies.some(e => e.alive && e.y + e.h >= H - 55);
    }

    allDead() {
        return this.enemies.every(e => !e.alive);
    }

    draw(ctx) {
        // 绘制敌人
        this.enemies.forEach(e => {
            if (!e.alive) return;
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x, e.y, e.w, e.h);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(e.x, e.y, e.w, e.h / 2);
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x + 8, e.y + 8, 6, 6);
            ctx.fillRect(e.x + e.w - 14, e.y + 8, 6, 6);
            if (e.hp > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(e.hp, e.x + e.w / 2, e.y + e.h - 4);
            }
        });

        // 绘制UFO
        if (this.ufo) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(this.ufo.x + 20, this.ufo.y + 10, 20, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(this.ufo.x + 20, this.ufo.y + 5, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
