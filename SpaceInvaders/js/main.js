// 游戏主循环、初始化、事件监听
import { W, H, MAX_LIVES } from './config.js';
import { Sound } from './sound.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { ItemManager } from './items.js';
import { updateParticles, drawParticles, resetParticles, spawnParticles } from './particles.js';
import { UI } from './ui.js';

// Canvas初始化
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 游戏状态
let score, lives, level, highScore, gameActive, paused;
let keys = {};
let bullets, enemyBullets;

// 模块实例
const player = new Player();
const enemies = new EnemyManager();
const items = new ItemManager();
const ui = new UI();

// 加载最高分
highScore = parseInt(localStorage.getItem('invaders_high')) || 0;

function initLevel(lv) {
    player.reset();
    bullets = [];
    enemyBullets = [];
    enemies.initLevel(lv);
    items.reset();
    resetParticles();
}

function startGame() {
    Sound.init();
    ui.hideStart();
    score = 0;
    lives = 3;
    level = 1;
    gameActive = true;
    paused = false;
    initLevel(level);
    ui.updateHUD(score, level, lives, highScore);
}

function endGame() {
    gameActive = false;
    highScore = Math.max(highScore, score);
    localStorage.setItem('invaders_high', highScore);
    setTimeout(() => {
        ui.showGameOver(score, level, highScore);
    }, 500);
}

function shoot() {
    player.shoot(bullets, items.triple, items.rapid);
}

function update() {
    // 玩家移动
    player.update(keys);

    // 射击
    if (keys['Space'] || keys['ArrowUp']) shoot();

    // 玩家子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.y < -10 || b.x < -10 || b.x > W + 10) {
            bullets.splice(i, 1);
            continue;
        }

        // 击中敌人/UFO
        const result = enemies.checkBulletHit(b.x, b.y);
        if (result.hit) {
            bullets.splice(i, 1);
            score += result.scoreAdd;
            if (result.powerupType) {
                items.spawn(result.spawnX, result.spawnY, result.powerupType);
            }
            ui.updateHUD(score, level, lives, highScore);
        }
    }

    // 敌人移动和射击
    const enemyShot = enemies.update(level);
    if (enemyShot) {
        enemyBullets.push(enemyShot);
    }

    // UFO
    enemies.updateUFO();

    // 敌人子弹
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.y += b.vy;
        if (b.y > H + 10) {
            enemyBullets.splice(i, 1);
            continue;
        }
        // Bug#4: 被击中检测 - 增加无敌帧判断
        if (b.y >= H - 50 && b.x > player.x - player.w / 2 && b.x < player.x + player.w / 2) {
            if (player.isInvincible()) {
                // 无敌状态，忽略伤害
                enemyBullets.splice(i, 1);
                continue;
            }
            if (items.shield > 0) {
                items.shield--;
                Sound.play('powerup');
            } else {
                lives--;
                Sound.play('die');
                spawnParticles(player.x, H - 45, '#00ff96', 15);
                player.startInvincible(); // Bug#4: 进入无敌状态
                if (lives <= 0) {
                    endGame();
                    return;
                }
            }
            enemyBullets.splice(i, 1);
            ui.updateHUD(score, level, lives, highScore);
        }
    }

    // 道具拾取
    const pickup = items.checkPickup(player.x, player.w);
    if (pickup.picked) {
        if (pickup.type === 'heal') {
            lives = Math.min(MAX_LIVES, lives + 1);
        }
        ui.updateHUD(score, level, lives, highScore);
    }

    // 更新道具
    items.update();

    // 更新粒子
    updateParticles();

    // 胜利检查
    if (enemies.allDead()) {
        level++;
        initLevel(level);
        ui.updateHUD(score, level, lives, highScore);
    }

    // 失败检查 - Bug#2: 调整为H-55
    if (enemies.reachedBottom()) {
        endGame();
    }
}

function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // 星星背景
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 60; i++) {
        const sx = (i * 97 + Date.now() * 0.01) % W;
        const sy = (i * 131) % H;
        ctx.fillRect(sx, sy, 1, 1);
    }

    // 敌人和UFO
    enemies.draw(ctx);

    // 玩家
    player.draw(ctx, items.shield, items.triple);

    // 玩家子弹
    bullets.forEach(b => {
        const color = items.triple > 0 ? '#ff0' : '#00ff96';
        ctx.fillStyle = color;
        ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
        // 子弹发光
        ctx.fillStyle = color + '40';
        ctx.beginPath(); ctx.arc(b.x, b.y - 2, 6, 0, Math.PI * 2); ctx.fill();
    });

    // 敌人子弹
    enemyBullets.forEach(b => {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(b.x - 2, b.y, 4, 10);
        // 子弹发光
        ctx.fillStyle = 'rgba(255,68,68,0.3)';
        ctx.beginPath(); ctx.arc(b.x, b.y + 5, 5, 0, Math.PI * 2); ctx.fill();
    });

    // 道具
    items.draw(ctx);

    // 粒子
    drawParticles(ctx);
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!gameActive || paused) return;
    update();
    if (gameActive) draw();
}

// 事件监听
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'KeyR') startGame();
    if (e.code === 'KeyP' && gameActive) paused = !paused;
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// 初始HUD
ui.updateHUD(0, 1, 3, highScore);

// 暴露startGame到全局（HTML按钮onclick需要）
window.startGame = startGame;

// 启动游戏循环
gameLoop();
