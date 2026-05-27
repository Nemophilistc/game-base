// ============================================================
// 末日幸存者 - 主入口（游戏循环、初始化、事件监听）
// ============================================================

import { CONFIG, game, state, keys } from './config.js';
import { Sound } from './sound.js';
import { Player } from './player.js';
import { Enemy, spawnEnemy } from './enemies.js';
import { Weapon, spawnEnemyProjectile } from './weapons.js';
import { spawnParticle } from './items.js';
import { updateHUD, levelUp, gameOver } from './ui.js';

// ============================================================
// 注入依赖，避免循环引用
// ============================================================
Enemy._spawnEnemyProjectile = spawnEnemyProjectile;

// ============================================================
// Canvas 初始化
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

game.canvas = canvas;
game.ctx = ctx;

// ============================================================
// 输入处理
// ============================================================
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// ============================================================
// 游戏初始化
// ============================================================
function initGame() {
    state.player = new Player();
    state.enemies = [];
    state.projectiles = [];
    state.expOrbs = [];
    state.particles = [];
    state.damageNumbers = [];

    game.time = 0;
    game.kills = 0;
    game.difficulty = 1;
    game.spawnTimer = 0;
    game.spawnRate = CONFIG.ENEMY_SPAWN_RATE;
    game.flashColor = null;
    game.flashTimer = 0;

    // 注入回调，避免 Player 直接依赖 ui.js
    state.player._onLevelUp = levelUp;
    state.player._onDeath = gameOver;
    state.player._updateHUD = updateHUD;

    // 初始武器
    state.player.weapons.push(new Weapon('sword'));

    updateHUD();
}

// ============================================================
// 游戏流程
// ============================================================
export function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    game.state = 'playing';
    Sound.init();
    initGame();
    if (!game.loopRunning) {
        game.loopRunning = true;
        gameLoop();
    }
}

export function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('active');
    game.state = 'playing';
    initGame();
    if (!game.loopRunning) {
        game.loopRunning = true;
        gameLoop();
    }
}

// 绑定到 window 供 HTML onclick 使用
window.startGame = startGame;
window.restartGame = restartGame;

// ============================================================
// 相机系统
// ============================================================
function updateCamera() {
    const player = state.player;
    const targetX = player.x - CONFIG.CANVAS_WIDTH / 2;
    const targetY = player.y - CONFIG.CANVAS_HEIGHT / 2;

    game.camera.x += (targetX - game.camera.x) * CONFIG.CAMERA_SMOOTH;
    game.camera.y += (targetY - game.camera.y) * CONFIG.CAMERA_SMOOTH;

    if (game.shake.intensity > 0) {
        game.shake.x = (Math.random() - 0.5) * game.shake.intensity;
        game.shake.y = (Math.random() - 0.5) * game.shake.intensity;
        game.shake.intensity *= 0.9;
        if (game.shake.intensity < 0.5) game.shake.intensity = 0;
    }
}

// ============================================================
// 绘制背景
// ============================================================
function drawBackground() {
    const player = state.player;
    const time = game.time / 100;
    const bgHue = (time * 0.5) % 360;

    const gridSize = 100;
    const startX = Math.floor(game.camera.x / gridSize) * gridSize;
    const startY = Math.floor(game.camera.y / gridSize) * gridSize;

    ctx.strokeStyle = `hsla(${bgHue}, 30%, 15%, 0.5)`;
    ctx.lineWidth = 1;

    for (let x = startX; x < game.camera.x + CONFIG.CANVAS_WIDTH + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, game.camera.y);
        ctx.lineTo(x, game.camera.y + CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
    }

    for (let y = startY; y < game.camera.y + CONFIG.CANVAS_HEIGHT + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(game.camera.x, y);
        ctx.lineTo(game.camera.x + CONFIG.CANVAS_WIDTH, y);
        ctx.stroke();
    }

    // 网格交叉点发光
    ctx.fillStyle = `hsla(${bgHue}, 50%, 30%, 0.3)`;
    for (let x = startX; x < game.camera.x + CONFIG.CANVAS_WIDTH + gridSize; x += gridSize) {
        for (let y = startY; y < game.camera.y + CONFIG.CANVAS_HEIGHT + gridSize; y += gridSize) {
            const dist = Math.sqrt(
                Math.pow(x - player.x, 2) +
                Math.pow(y - player.y, 2)
            );

            if (dist < 300) {
                const alpha = 1 - (dist / 300);
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.globalAlpha = 1;

    // 玩家周围光环
    const playerGlow = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, 200
    );
    playerGlow.addColorStop(0, 'rgba(78, 205, 196, 0.1)');
    playerGlow.addColorStop(1, 'rgba(78, 205, 196, 0)');

    ctx.fillStyle = playerGlow;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 200, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================================
// 主游戏循环
// ============================================================
function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (game.state !== 'playing') return;

    // 更新游戏时间
    game.time++;
    game.difficulty = 1 + game.time / 36000;

    // 更新生成速率
    game.spawnTimer++;
    game.spawnRate = Math.max(
        CONFIG.ENEMY_SPAWN_RATE_MIN,
        CONFIG.ENEMY_SPAWN_RATE - game.time * CONFIG.ENEMY_SPAWN_RATE_DECREASE / 600
    );

    if (game.spawnTimer >= game.spawnRate && state.enemies.length < CONFIG.MAX_ENEMIES) {
        game.spawnTimer = 0;
        spawnEnemy();
    }

    // 更新玩家
    state.player.update();

    // 更新敌人
    state.enemies.forEach(enemy => enemy.update());

    // 更新弹幕
    state.projectiles = state.projectiles.filter(p => p.update());

    // 更新经验球
    state.expOrbs = state.expOrbs.filter(o => o.update());

    // 更新粒子
    state.particles = state.particles.filter(p => p.update());

    // 更新伤害数字
    state.damageNumbers = state.damageNumbers.filter(n => n.update());

    // 更新相机
    updateCamera();

    // 清屏
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 应用相机变换
    ctx.save();
    ctx.translate(
        -game.camera.x + game.shake.x,
        -game.camera.y + game.shake.y
    );

    // 绘制层次
    drawBackground();
    state.expOrbs.forEach(o => o.draw());
    state.enemies.forEach(enemy => enemy.draw());
    state.projectiles.forEach(p => p.draw());
    state.player.draw();
    state.particles.forEach(p => p.draw());
    state.damageNumbers.forEach(n => n.draw());

    ctx.restore();

    // 屏幕闪烁效果
    if (game.flashTimer > 0) {
        game.flashTimer--;
        ctx.fillStyle = game.flashColor;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        if (game.flashTimer <= 0) {
            game.flashColor = null;
        }
    }

    // 更新HUD
    if (game.time % 10 === 0) {
        updateHUD();
    }
}
