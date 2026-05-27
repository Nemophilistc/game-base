// ============================================
// MetalSlug 主游戏逻辑
// ============================================

import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, LEVELS, GRAVITY, MAX_FALL_SPEED } from './config.js';
import { soundManager } from './sound.js';
import { ParticleSystem } from './particles.js';
import { WeaponSystem } from './weapons.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { Level } from './level.js';
import { ItemManager } from './items.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // 游戏状态
        this.state = 'start'; // start, playing, paused, gameOver, levelComplete, victory
        this.currentLevel = 0;
        this.score = 0;
        this.lives = 3;

        // 系统
        this.particles = new ParticleSystem();
        this.weaponSystem = new WeaponSystem();
        this.enemyManager = new EnemyManager();
        this.itemManager = new ItemManager();
        this.ui = new UI(this.ctx);

        // 玩家
        this.player = new Player(100, GROUND_Y - 60);

        // 关卡
        this.level = null;

        // 相机
        this.cameraX = 0;
        this.cameraTargetX = 0;

        // 手雷系统
        this.grenades = [];

        // 输入状态
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;

        // Boss状态
        this.bossSpawned = false;
        this.bossDefeated = false;

        // 敌人生成
        this.enemySpawnQueue = [];
        this.spawnedEnemies = new Set();

        // 绑定事件
        this.bindEvents();

        // 开始游戏循环
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    bindEvents() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            // 初始化音频上下文
            soundManager.init();

            if (this.state === 'playing') {
                // 武器切换
                if (e.key >= '1' && e.key <= '5') {
                    const weapons = ['pistol', 'machinegun', 'shotgun', 'rocket', 'laser'];
                    const idx = parseInt(e.key) - 1;
                    if (idx < weapons.length) {
                        this.weaponSystem.switchWeapon(weapons[idx]);
                    }
                }

                // 暂停
                if (e.key.toLowerCase() === 'p') {
                    this.state = 'paused';
                }

                // 静音
                if (e.key.toLowerCase() === 'm') {
                    soundManager.toggle();
                }

                // 进入载具
                if (e.key.toLowerCase() === 'r') {
                    this.tryEnterVehicle();
                }

                // 手雷
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.throwGrenade();
                }
            } else if (this.state === 'paused') {
                if (e.key.toLowerCase() === 'p') {
                    this.state = 'playing';
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            soundManager.init();

            if (this.state === 'start') {
                this.startGame();
            } else if (this.state === 'playing') {
                this.mouseDown = true;
            } else if (this.state === 'gameOver') {
                this.restartGame();
            } else if (this.state === 'levelComplete') {
                this.nextLevel();
            } else if (this.state === 'victory') {
                this.restartGame();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 失焦时清除按键
        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouseDown = false;
        });
    }

    startGame() {
        this.state = 'playing';
        this.currentLevel = 0;
        this.score = 0;
        this.lives = 3;
        this.loadLevel(0);
    }

    restartGame() {
        this.startGame();
    }

    loadLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.level = new Level(levelIndex);
        this.player.reset(100, GROUND_Y - 60);
        this.weaponSystem.reset();
        this.enemyManager.clear();
        this.itemManager.clear();
        this.particles.clear();
        this.grenades = [];
        this.cameraX = 0;
        this.cameraTargetX = 0;
        this.bossSpawned = false;
        this.bossDefeated = false;

        // 加载敌人生成队列
        this.enemySpawnQueue = this.level.getEnemySpawns();
        this.spawnedEnemies = new Set();

        // 加载道具
        this.itemManager.spawnFromLevel(this.level.getItemSpawns());

        // 显示关卡名称
        this.ui.addMessage(`第${levelIndex + 1}关: ${this.level.name}`, 180, '#FFD700', 36);
    }

    nextLevel() {
        if (this.currentLevel < LEVELS.length - 1) {
            this.loadLevel(this.currentLevel + 1);
            this.state = 'playing';
        } else {
            this.state = 'victory';
        }
    }

    throwGrenade() {
        const grenade = this.player.throwGrenade();
        if (grenade) {
            this.grenades.push({
                ...grenade,
                timer: 60,
                rotation: 0
            });
        }
    }

    tryEnterVehicle() {
        if (this.player.inVehicle) {
            this.player.exitVehicle();
            return;
        }

        // 检查附近的载具道具
        for (const item of this.itemManager.items) {
            if (item.type === 'vehicle' && !item.dead) {
                const dx = this.player.x - item.x;
                const dy = this.player.y - item.y;
                if (Math.abs(dx) < 80 && Math.abs(dy) < 80) {
                    this.player.enterVehicle({ hp: 300 });
                    item.dead = true;
                    this.itemManager.removeItem(item);
                    break;
                }
            }
        }
    }

    updatePlayerInput() {
        this.player.keys.left = this.keys['a'] || this.keys['arrowleft'];
        this.player.keys.right = this.keys['d'] || this.keys['arrowright'];
        this.player.keys.up = this.keys['w'] || this.keys['arrowup'];
        this.player.keys.down = this.keys['s'] || this.keys['arrowdown'];
        this.player.keys.jump = this.keys['w'] || this.keys['arrowup'];
        this.player.mouseX = this.mouseX;
        this.player.mouseY = this.mouseY;
        this.player.mouseDown = this.mouseDown;
    }

    handlePlayerShooting() {
        if (this.mouseDown && !this.player.dead) {
            const angle = this.player.aimAngle;
            const gunX = this.player.x + Math.cos(angle) * 25;
            const gunY = this.player.y + this.player.height * 0.35 + Math.sin(angle) * 25;

            const bullets = this.weaponSystem.fire(gunX, gunY, angle);
            if (bullets.length > 0) {
                this.particles.addMuzzleFlash(gunX, gunY, angle);
                this.particles.addShellCasing(this.player.x, this.player.y + this.player.height * 0.4, this.player.facing);
            }
        }
    }

    updateCamera() {
        // 相机跟随玩家
        this.cameraTargetX = this.player.x - CANVAS_WIDTH / 3;
        this.cameraX += (this.cameraTargetX - this.cameraX) * 0.1;

        // 限制相机范围
        if (this.cameraX < 0) this.cameraX = 0;
        if (this.level && this.cameraX > this.level.width - CANVAS_WIDTH) {
            this.cameraX = this.level.width - CANVAS_WIDTH;
        }
    }

    spawnEnemies() {
        const viewLeft = this.cameraX - 200;
        const viewRight = this.cameraX + CANVAS_WIDTH + 200;

        for (let i = 0; i < this.enemySpawnQueue.length; i++) {
            if (this.spawnedEnemies.has(i)) continue;

            const spawn = this.enemySpawnQueue[i];
            if (spawn.x >= viewLeft && spawn.x <= viewRight) {
                this.enemyManager.spawn(spawn.type, spawn.x, GROUND_Y - 60);
                this.spawnedEnemies.add(i);
            }
        }

        // Boss生成
        if (!this.bossSpawned && this.level) {
            const bossSpawn = this.level.getBossSpawn();
            if (bossSpawn) {
                const distToBoss = bossSpawn.x - this.player.x;
                if (distToBoss < CANVAS_WIDTH + 100) {
                    const boss = this.enemyManager.spawn('boss', bossSpawn.x, GROUND_Y - 160, { name: bossSpawn.name });
                    this.bossSpawned = true;
                    soundManager.play('bossAppear');
                    this.ui.addMessage(`警告: ${bossSpawn.name} 出现!`, 120, '#FF0000', 32);
                    this.ui.shake(10);
                }
            }
        }
    }

    updateGrenades() {
        for (let i = this.grenades.length - 1; i >= 0; i--) {
            const g = this.grenades[i];
            g.x += g.vx;
            g.y += g.vy;
            g.vy += GRAVITY;
            g.rotation += 0.2;
            g.timer--;

            // 地面碰撞
            if (g.y >= GROUND_Y - 10) {
                g.y = GROUND_Y - 10;
                g.vy *= -0.5;
                g.vx *= 0.8;
            }

            // 爆炸
            if (g.timer <= 0 || g.y > CANVAS_HEIGHT) {
                this.grenades.splice(i, 1);
                this.particles.addBigExplosion(g.x, g.y);
                soundManager.play('explosion');
                this.ui.shake(8);

                // 范围伤害
                this.damageArea(g.x, g.y, g.radius, g.damage);
            }
        }
    }

    damageArea(x, y, radius, damage) {
        // 伤害敌人
        for (const enemy of this.enemyManager.getEnemies()) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
                const dmg = damage * (1 - dist / radius);
                enemy.takeDamage(dmg);
                if (enemy.dead) {
                    this.score += enemy.score;
                    this.particles.addBigExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                }
            }
        }

        // 伤害可破坏物
        for (const d of this.level.getDestructibles()) {
            const dx = d.x - x;
            const dy = d.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
                d.takeDamage(damage);
                if (d.dead && d.explosive) {
                    this.damageArea(d.x, d.y, 100, 150);
                    this.particles.addBigExplosion(d.x, d.y);
                }
            }
        }
    }

    checkBulletCollisions() {
        const bullets = this.weaponSystem.getBullets();

        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (bullet.dead) continue;

            // 玩家子弹击中敌人
            if (!bullet.isEnemy) {
                for (const enemy of this.enemyManager.getEnemies()) {
                    if (this.rectCollision(
                        bullet.x - bullet.size, bullet.y - bullet.size, bullet.size * 2, bullet.size * 2,
                        enemy.x - enemy.width / 2, enemy.y, enemy.width, enemy.height
                    )) {
                        enemy.takeDamage(bullet.damage);
                        this.particles.addSparks(bullet.x, bullet.y);

                        if (enemy.dead) {
                            this.score += enemy.score;
                            this.particles.addBigExplosion(enemy.x, enemy.y + enemy.height / 2);

                            if (enemy.boss) {
                                this.bossDefeated = true;
                                this.ui.addMessage('Boss 已击败!', 180, '#00FF00', 36);
                                // 延迟进入下一关
                                setTimeout(() => {
                                    if (this.state === 'playing') {
                                        this.state = 'levelComplete';
                                    }
                                }, 2000);
                            }
                        }

                        if (bullet.explosive) {
                            this.damageArea(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage);
                            this.particles.addBigExplosion(bullet.x, bullet.y);
                            soundManager.play('explosion');
                            this.ui.shake(5);
                        }

                        if (!bullet.piercing) {
                            bullet.dead = true;
                        }
                        break;
                    }
                }

                // 子弹击中可破坏物
                for (const d of this.level.getDestructibles()) {
                    if (d.dead) continue;
                    const db = d.getBounds();
                    if (this.rectCollision(
                        bullet.x - bullet.size, bullet.y - bullet.size, bullet.size * 2, bullet.size * 2,
                        db.x, db.y, db.w, db.h
                    )) {
                        d.takeDamage(bullet.damage);
                        this.particles.addSparks(bullet.x, bullet.y);

                        if (d.dead && d.explosive) {
                            this.damageArea(d.x, d.y, 100, 150);
                            this.particles.addBigExplosion(d.x, d.y);
                            soundManager.play('explosion');
                            this.ui.shake(6);
                        }

                        if (!bullet.piercing) {
                            bullet.dead = true;
                        }
                        break;
                    }
                }
            }

            // 敌人子弹击中玩家
            if (bullet.isEnemy && !this.player.dead) {
                if (this.rectCollision(
                    bullet.x - bullet.size, bullet.y - bullet.size, bullet.size * 2, bullet.size * 2,
                    this.player.x - this.player.width / 2, this.player.y, this.player.width, this.player.height
                )) {
                    this.player.takeDamage(bullet.damage);
                    this.particles.addBlood(this.player.x, this.player.y + this.player.height / 2);
                    bullet.dead = true;
                }
            }

            // 子弹出界
            if (bullet.x < this.cameraX - 50 || bullet.x > this.cameraX + CANVAS_WIDTH + 50 ||
                bullet.y < -50 || bullet.y > CANVAS_HEIGHT + 50) {
                bullet.dead = true;
            }
        }
    }

    checkEnemyPlayerCollision() {
        if (this.player.dead || this.player.invincible) return;

        for (const enemy of this.enemyManager.getEnemies()) {
            if (enemy.dead) continue;

            if (this.rectCollision(
                this.player.x - this.player.width / 2, this.player.y, this.player.width, this.player.height,
                enemy.x - enemy.width / 2, enemy.y, enemy.width, enemy.height
            )) {
                this.player.takeDamage(enemy.damage);
                this.particles.addBlood(this.player.x, this.player.y + this.player.height / 2);
            }
        }
    }

    checkItemCollisions() {
        const collected = this.itemManager.checkCollision(this.player);

        for (const item of collected) {
            switch (item.type) {
                case 'weaponBox':
                    const randomWeapon = this.itemManager.getRandomWeapon();
                    this.weaponSystem.switchWeapon(randomWeapon);
                    this.weaponSystem.addAmmo(randomWeapon, 100);
                    this.ui.addMessage(`获得 ${this.weaponSystem.weapons[randomWeapon].name}!`, 90, '#FFD700');
                    break;

                case 'ammo':
                    this.weaponSystem.addAmmo(this.weaponSystem.currentWeapon, 50);
                    this.ui.addMessage('弹药补充!', 60, '#FFD700');
                    break;

                case 'medkit':
                    this.player.heal(30);
                    this.ui.addMessage('生命恢复!', 60, '#00FF00');
                    break;

                case 'grenade':
                    this.player.grenades = Math.min(this.player.grenades + 3, 10);
                    this.ui.addMessage('手雷+3', 60, '#2E8B57');
                    break;

                case 'vehicle':
                    // 载具在附近按R进入
                    break;
            }
        }
    }

    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    update() {
        if (this.state !== 'playing') return;

        // 更新输入
        this.updatePlayerInput();

        // 射击
        this.handlePlayerShooting();

        // 更新玩家
        this.player.update(this.level.getPlatforms(), this.cameraX);

        // 更新相机
        this.updateCamera();

        // 生成敌人
        this.spawnEnemies();

        // 更新关卡
        this.level.update();

        // 更新敌人
        this.enemyManager.update(this.player.x, this.player.y, this.level.getPlatforms(), this.weaponSystem);

        // 更新武器
        this.weaponSystem.update();

        // 更新手雷
        this.updateGrenades();

        // 更新道具
        this.itemManager.update();

        // 更新粒子
        this.particles.update();

        // 碰撞检测
        this.checkBulletCollisions();
        this.checkEnemyPlayerCollision();
        this.checkItemCollisions();

        // 更新UI
        this.ui.update();

        // 玩家死亡检查
        if (this.player.dead) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = 'gameOver';
            } else {
                // 复活
                setTimeout(() => {
                    if (this.state === 'playing') {
                        this.player.reset(this.cameraX + 100, GROUND_Y - 60);
                        this.player.invincible = true;
                        this.player.invincibleTimer = 3000;
                    }
                }, 1500);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const shake = this.ui.getShakeOffset();

        ctx.save();
        ctx.translate(shake.x, shake.y);

        // 清屏
        ctx.fillStyle = this.level ? this.level.bgColor : '#0f0f23';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (this.state === 'start') {
            this.ui.drawStartScreen();
        } else {
            // 绘制背景
            if (this.level) {
                this.level.drawBackground(ctx, this.cameraX);
            }

            // 绘制地面
            if (this.level) {
                this.level.drawGround(ctx, this.cameraX);
                this.level.drawPlatforms(ctx, this.cameraX);
                this.level.drawDestructibles(ctx, this.cameraX);
            }

            // 绘制道具
            this.itemManager.draw(ctx, this.cameraX);

            // 绘制手雷
            this.drawGrenades(ctx);

            // 绘制敌人
            this.enemyManager.draw(ctx, this.cameraX);

            // 绘制玩家
            this.player.draw(ctx, this.cameraX);

            // 绘制子弹
            this.weaponSystem.draw(ctx, this.cameraX);

            // 绘制粒子
            this.particles.draw(ctx, this.cameraX);

            // 绘制HUD
            this.ui.drawHUD(this.player, this.weaponSystem, this.level, this.score);

            // 绘制消息
            this.ui.drawMessages();

            // 绘制准心
            this.ui.drawCrosshair(this.mouseX, this.mouseY);

            // 绘制覆盖层
            if (this.state === 'paused') {
                this.ui.drawPauseScreen();
            } else if (this.state === 'gameOver') {
                this.ui.drawGameOverScreen(this.score);
            } else if (this.state === 'levelComplete') {
                this.ui.drawLevelCompleteScreen(this.level.name, this.score);
            } else if (this.state === 'victory') {
                this.ui.drawVictoryScreen(this.score);
            }
        }

        ctx.restore();
    }

    drawGrenades(ctx) {
        for (const g of this.grenades) {
            const drawX = g.x - this.cameraX;
            const drawY = g.y;

            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate(g.rotation);

            // 手雷主体
            ctx.fillStyle = '#2E8B57';
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // 引信
            ctx.fillStyle = '#888';
            ctx.fillRect(-2, -12, 4, 5);

            // 闪烁指示
            if (g.timer < 20) {
                ctx.fillStyle = g.timer % 4 < 2 ? '#FF0000' : '#FF6600';
                ctx.beginPath();
                ctx.arc(0, -12, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update();
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
