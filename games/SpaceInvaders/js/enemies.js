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
            const cx = e.x + e.w / 2;
            const cy = e.y + e.h / 2;
            const hw = e.w / 2;
            const hh = e.h / 2;

            // 根据颜色类型绘制不同形状的敌人
            if (e.color === '#f44336' || e.color === '#e53935') {
                // 顶层：恶魔型（尖角+翅膀）
                ctx.fillStyle = e.color;
                // 身体
                ctx.beginPath();
                ctx.moveTo(cx, cy + hh);
                ctx.lineTo(cx - hw, cy - hh * 0.3);
                ctx.lineTo(cx - hw * 0.7, cy - hh);
                ctx.lineTo(cx - hw * 0.2, cy - hh * 0.6);
                ctx.lineTo(cx, cy - hh);
                ctx.lineTo(cx + hw * 0.2, cy - hh * 0.6);
                ctx.lineTo(cx + hw * 0.7, cy - hh);
                ctx.lineTo(cx + hw, cy - hh * 0.3);
                ctx.closePath();
                ctx.fill();
                // 眼睛
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(cx - 6, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 6, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 7, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
            } else if (e.color === '#ff9800' || e.color === '#fb8c00') {
                // 第二层：甲虫型（圆壳+触角）
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.ellipse(cx, cy, hw, hh, 0, 0, Math.PI * 2);
                ctx.fill();
                // 壳纹
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(cx, cy - hh); ctx.lineTo(cx, cy + hh); ctx.stroke();
                // 触角
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(cx - 8, cy - hh); ctx.lineTo(cx - 14, cy - hh - 8); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx + 8, cy - hh); ctx.lineTo(cx + 14, cy - hh - 8); ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(cx - 14, cy - hh - 8, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 14, cy - hh - 8, 2, 0, Math.PI * 2); ctx.fill();
                // 眼睛
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(cx - 7, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 7, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(cx - 6, cy - 3, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 8, cy - 3, 2, 0, Math.PI * 2); ctx.fill();
            } else if (e.color === '#ffeb3b' || e.color === '#fdd835') {
                // 第三层：水母型（波浪边+触手）
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.arc(cx, cy - hh * 0.3, hw, Math.PI, 0);
                ctx.lineTo(cx + hw, cy + hh * 0.3);
                // 波浪底边
                for (let i = 0; i < 5; i++) {
                    const wx = cx + hw - (i + 1) * (e.w / 5);
                    const wy = cy + hh * 0.3 + (i % 2 === 0 ? 5 : 0);
                    ctx.lineTo(wx, wy);
                }
                ctx.closePath();
                ctx.fill();
                // 眼睛
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(cx - 6, cy - hh * 0.2, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 6, cy - hh * 0.2, 3, 0, Math.PI * 2); ctx.fill();
                // 发光
                ctx.fillStyle = 'rgba(255,235,59,0.3)';
                ctx.beginPath(); ctx.arc(cx, cy, hw * 0.5, 0, Math.PI * 2); ctx.fill();
            } else if (e.color === '#4caf50' || e.color == '#43a047') {
                // 第四层：水晶型（菱形+光芒）
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.moveTo(cx, cy - hh);
                ctx.lineTo(cx + hw, cy);
                ctx.lineTo(cx, cy + hh);
                ctx.lineTo(cx - hw, cy);
                ctx.closePath();
                ctx.fill();
                // 内部菱形
                ctx.fillStyle = '#81c784';
                ctx.beginPath();
                ctx.moveTo(cx, cy - hh * 0.5);
                ctx.lineTo(cx + hw * 0.5, cy);
                ctx.lineTo(cx, cy + hh * 0.5);
                ctx.lineTo(cx - hw * 0.5, cy);
                ctx.closePath();
                ctx.fill();
                // 核心
                ctx.fillStyle = '#c8e6c9';
                ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
                // 眼睛
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 5, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
            } else {
                // 底层：机械型（方形+铆钉+装甲）
                ctx.fillStyle = e.color;
                ctx.fillRect(e.x + 2, e.y, e.w - 4, e.h);
                ctx.fillRect(e.x, e.y + 3, e.w, e.h - 6);
                // 装甲板
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(e.x + 4, e.y + 2, e.w - 8, e.h / 2 - 2);
                // 铆钉
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath(); ctx.arc(e.x + 6, e.y + 5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(e.x + e.w - 6, e.y + 5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(e.x + 6, e.y + e.h - 5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(e.x + e.w - 6, e.y + e.h - 5, 1.5, 0, Math.PI * 2); ctx.fill();
                // 眼睛（发光）
                ctx.fillStyle = '#ff1744';
                ctx.beginPath(); ctx.arc(cx - 7, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 7, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,23,68,0.3)';
                ctx.beginPath(); ctx.arc(cx - 7, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 7, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
            }

            if (e.hp > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(e.hp, cx, e.y + e.h + 10);
            }
        });

        // 绘制UFO
        if (this.ufo) {
            const ux = this.ufo.x + 20;
            const uy = this.ufo.y + 10;
            const t = Date.now() * 0.003;

            // 光环
            ctx.strokeStyle = 'rgba(255,215,0,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(ux, uy, 25 + Math.sin(t) * 3, 0, Math.PI * 2); ctx.stroke();

            // 主体
            const ufoGrad = ctx.createLinearGradient(ux - 20, uy, ux + 20, uy);
            ufoGrad.addColorStop(0, '#ffd700');
            ufoGrad.addColorStop(0.5, '#fff176');
            ufoGrad.addColorStop(1, '#ffd700');
            ctx.fillStyle = ufoGrad;
            ctx.beginPath();
            ctx.ellipse(ux, uy, 22, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // 顶盖
            ctx.fillStyle = '#ffb300';
            ctx.beginPath();
            ctx.ellipse(ux, uy - 4, 12, 8, 0, Math.PI, 0);
            ctx.fill();

            // 顶灯
            ctx.fillStyle = '#ff0';
            ctx.beginPath(); ctx.arc(ux, uy - 8, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,0,0.4)';
            ctx.beginPath(); ctx.arc(ux, uy - 8, 8, 0, Math.PI * 2); ctx.fill();

            // 底部灯
            const lights = [-12, -4, 4, 12];
            for (const lx of lights) {
                ctx.fillStyle = `hsl(${(t * 50 + lx * 10) % 360},100%,60%)`;
                ctx.beginPath(); ctx.arc(ux + lx, uy + 5, 2, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
}
