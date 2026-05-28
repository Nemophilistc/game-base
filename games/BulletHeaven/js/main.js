// ============================================================
// main.js - 游戏主循环、事件监听、相机系统
// ============================================================

import { GAME, XP_TABLE } from './config.js';
import { sound } from './sound.js';
import { Player } from './player.js';
import { WeaponSystem } from './weapons.js';
import { EnemySpawner, Enemy } from './enemies.js';
import { ItemSystem } from './items.js';
import { UpgradeSystem } from './upgrades.js';
import { EffectsSystem } from './effects.js';
import { UI } from './ui.js';

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    follow(target, canvasW, canvasH) {
        this.x = target.x - canvasW / 2;
        this.y = target.y - canvasH / 2;

        // 世界边界限制
        this.x = Math.max(0, Math.min(GAME.WORLD_WIDTH - canvasW, this.x));
        this.y = Math.max(0, Math.min(GAME.WORLD_HEIGHT - canvasH, this.y));
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.camera = new Camera();
        this.ui = new UI(this.canvas);
        this.effects = new EffectsSystem();
        this.keys = {};

        this.state = 'start'; // start, playing, paused, upgrading, gameover
        this.gameTime = 0;
        this.kills = 0;
        this.lastTime = 0;
        this.running = false;

        this._bindEvents();
        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    _bindEvents() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (this.state === 'start') {
                this._startGame();
                return;
            }

            if (this.state === 'upgrading') {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 3 && this._upgradeOptions) {
                    this._selectUpgrade(num - 1);
                }
                if (e.key.toLowerCase() === 'r' && this._upgradeOptions) {
                    this._rerollUpgrade();
                }
            }

            if (e.key === 'Escape') {
                if (this.state === 'playing') {
                    this.state = 'paused';
                } else if (this.state === 'paused') {
                    this.state = 'playing';
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            sound.init();

            if (this.state === 'start') {
                const result = this.ui.handleClick(mx, my);
                if (result === 'start') {
                    this._startGame();
                }
                return;
            }

            if (this.state === 'upgrading') {
                const result = this.ui.handleClick(mx, my);
                if (typeof result === 'number') {
                    // handled by keyboard
                }
                return;
            }

            if (this.state === 'gameover') {
                const result = this.ui.handleClick(mx, my);
                if (result === 'restart') {
                    this._startGame();
                }
            }
        });
    }

    _startGame() {
        sound.init();
        this.player = new Player();
        this.weaponSystem = new WeaponSystem(this.player);
        this.enemySpawner = new EnemySpawner();
        this.itemSystem = new ItemSystem();
        this.upgradeSystem = new UpgradeSystem();
        this.effects = new EffectsSystem();
        this.gameTime = 0;
        this.kills = 0;
        this._upgradeOptions = null;
        this._gameOverTimer = 0;

        // 初始武器：剑气
        this.weaponSystem.addWeapon('sword_wave');

        this.state = 'playing';
        this.ui.showingStart = false;
        this.ui.showingGameOver = false;
    }

    _selectUpgrade(index) {
        if (!this._upgradeOptions || index >= this._upgradeOptions.length) return;
        this.upgradeSystem.applyOption(this._upgradeOptions[index], this.player, this.weaponSystem);
        this.upgradeSystem.pendingLevelUps--;
        this.ui.hideUpgradeOptions();
        this._upgradeOptions = null;

        if (this.upgradeSystem.pendingLevelUps > 0) {
            this._showUpgradeUI();
        } else {
            this.state = 'playing';
        }
    }

    _rerollUpgrade() {
        if (this.player.rerolls <= 0) return;
        this.player.rerolls--;
        this._upgradeOptions = this.upgradeSystem.generateOptions(this.player, this.weaponSystem);
        this.ui.showUpgradeOptions(
            this._upgradeOptions,
            this.player.rerolls,
            (i) => this._selectUpgrade(i),
            () => this._rerollUpgrade()
        );
    }

    _showUpgradeUI() {
        this._upgradeOptions = this.upgradeSystem.generateOptions(this.player, this.weaponSystem);
        this.state = 'upgrading';
        this.ui.showUpgradeOptions(
            this._upgradeOptions,
            this.player.rerolls,
            (i) => this._selectUpgrade(i),
            () => this._rerollUpgrade()
        );
    }

    _loop(timestamp) {
        const dt = this.lastTime ? Math.min(timestamp - this.lastTime, 50) : 16;
        this.lastTime = timestamp;

        this._update(dt);
        this._render();

        requestAnimationFrame(this._loop);
    }

    _update(dt) {
        if (this.state !== 'playing') return;

        this.gameTime += dt / 1000;

        // 更新玩家输入
        this.player.input.up = this.keys['w'] || this.keys['arrowup'];
        this.player.input.down = this.keys['s'] || this.keys['arrowdown'];
        this.player.input.left = this.keys['a'] || this.keys['arrowleft'];
        this.player.input.right = this.keys['d'] || this.keys['arrowright'];

        this.player.update(dt);

        // 更新敌人
        this.enemySpawner.update(dt, this.player, this.player.curseLevel);

        // 更新武器
        this.weaponSystem.setEnemies(this.enemySpawner.enemies);
        this.weaponSystem.update(dt, this.enemySpawner.enemies);

        // 检测敌人死亡 & 掉落
        for (const enemy of this.enemySpawner.enemies) {
            if (!enemy.alive && enemy._deathProcessed) continue;
            if (!enemy.alive) {
                enemy._deathProcessed = true;
                this.kills++;
                this.effects.enemyDeath(enemy.x, enemy.y, enemy.color);
                this.effects.addDamageNumber(enemy.x, enemy.y, `💀`, '#ff4444');
                this.itemSystem.spawnGems(enemy.x, enemy.y, enemy.xp);
                sound.enemyDeath();

                // 分裂行为
                if (enemy.splitCount > 0) {
                    for (let i = 0; i < enemy.splitCount; i++) {
                        const angle = (Math.PI * 2 / enemy.splitCount) * i;
                        const splitEnemy = new Enemy('swarm',
                            enemy.x + Math.cos(angle) * 20,
                            enemy.y + Math.sin(angle) * 20,
                            this.player.curseLevel
                        );
                        this.enemySpawner.enemies.push(splitEnemy);
                    }
                }

                // Boss击杀特效
                if (enemy.type === 'boss') {
                    this.effects.shake(15);
                    this.effects.spawnParticles(enemy.x, enemy.y, '#ff0000', 30, 6, 6, 1000);
                    this.effects.spawnParticles(enemy.x, enemy.y, '#ffcc00', 20, 4, 4, 800);
                }
            }
        }

        // 碰撞伤害（玩家 vs 敌人）
        for (const enemy of this.enemySpawner.enemies) {
            if (!enemy.alive) continue;
            if (enemy.behavior === 'phase' && !enemy.visible) continue;
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.hypot(dx, dy);
            if (dist < enemy.radius + this.player.radius) {
                const dead = this.player.takeDamage(enemy.damage);
                if (dead) {
                    this._gameOver();
                    return;
                }
                this.effects.shake(5);
            }
        }

        // Boss弹幕碰撞
        for (const enemy of this.enemySpawner.enemies) {
            for (const bp of enemy.bossProjectiles) {
                if (!bp.alive) continue;
                const dx = bp.x - this.player.x;
                const dy = bp.y - this.player.y;
                if (Math.hypot(dx, dy) < this.player.radius + 5) {
                    const dead = this.player.takeDamage(bp.damage);
                    bp.alive = false;
                    if (dead) {
                        this._gameOver();
                        return;
                    }
                    this.effects.shake(3);
                }
            }
        }

        // 远程敌人弹幕碰撞
        for (const enemy of this.enemySpawner.enemies) {
            if (enemy.behavior !== 'ranged') continue;
            for (const bp of enemy.bossProjectiles) {
                if (!bp.alive) continue;
                const dx = bp.x - this.player.x;
                const dy = bp.y - this.player.y;
                if (Math.hypot(dx, dy) < this.player.radius + 4) {
                    const dead = this.player.takeDamage(bp.damage);
                    bp.alive = false;
                    if (dead) {
                        this._gameOver();
                        return;
                    }
                }
            }
        }

        // 收集经验
        const xpGained = this.itemSystem.update(dt, this.player);
        if (xpGained > 0) {
            this.player.addXP(xpGained);
            this.effects.addDamageNumber(this.player.x, this.player.y - 20, `+${xpGained}XP`, '#44aaff');
        }

        // 升级检查
        if (this.upgradeSystem.checkLevelUp(this.player)) {
            this.effects.levelUpEffect(this.player.x, this.player.y);
            this._showUpgradeUI();
        }

        // 更新特效
        this.effects.update(dt);

        // 相机跟随
        this.camera.follow(this.player, this.canvas.width, this.canvas.height);
    }

    _gameOver() {
        this.state = 'gameover';
        this.ui.showGameOver({
            time: this.gameTime,
            kills: this.kills,
            level: this.player.level,
        });
        sound.gameOver();
    }

    _render() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.save();

        // 应用屏幕震动
        ctx.translate(this.effects.screenShake.x, this.effects.screenShake.y);

        // 清屏
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, cw, ch);

        if (this.state === 'start') {
            this._drawBackground(ctx);
            this.ui.draw(ctx, null, 0, 0, { weapons: {} });
            ctx.restore();
            return;
        }

        // 绘制背景
        this._drawBackground(ctx);

        // 绘制游戏对象
        this.enemySpawner.draw(ctx, this.camera);
        this.itemSystem.draw(ctx, this.camera);
        this.weaponSystem.draw(ctx, this.camera);
        this.player.draw(ctx, this.camera);
        this.effects.draw(ctx, this.camera);

        // UI
        this.ui.draw(
            ctx,
            this.player,
            this.gameTime,
            this.enemySpawner.enemies.length,
            this.weaponSystem
        );

        // 暂停遮罩
        if (this.state === 'paused') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, cw, ch);
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('暂停', cw / 2, ch / 2);
            ctx.font = '20px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('按 ESC 继续', cw / 2, ch / 2 + 40);
        }

        ctx.restore();
    }

    _drawBackground(ctx) {
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const tile = GAME.GROUND_TILE;
        const startX = Math.floor(this.camera.x / tile) * tile;
        const startY = Math.floor(this.camera.y / tile) * tile;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, cw, ch);

        // 网格线
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let x = startX; x < this.camera.x + cw + tile; x += tile) {
            const sx = x - this.camera.x;
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, ch);
            ctx.stroke();
        }
        for (let y = startY; y < this.camera.y + ch + tile; y += tile) {
            const sy = y - this.camera.y;
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(cw, sy);
            ctx.stroke();
        }

        // 世界边界
        ctx.strokeStyle = 'rgba(255,0,0,0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            -this.camera.x, -this.camera.y,
            GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT
        );
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
