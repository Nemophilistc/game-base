// ============================================================
// main.js - 游戏初始化、事件监听、主循环
// ============================================================

import {
    W, H, LANE_W, LANES, ROAD_LEFT,
    INITIAL_LIVES, COLLISION_X, COLLISION_Y
} from './config.js';
import { Sound } from './sound.js';
import { drawCar, createPlayer, spawnCar, spawnPickup } from './car.js';
import { drawRoad } from './road.js';
import { updateHUD, hideStartOverlay, hideGameOverOverlay, showGameOver } from './ui.js';

// ---- Canvas 初始化 ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// ---- 游戏状态 ----
let player, cars, pickups, particles;
let score, highScore, gameActive, lives;
let roadSpeed, baseSpeed, frameCount;
let keys = {};
let shakeX, shakeY;

highScore = parseInt(localStorage.getItem('racing_high')) || 0;

// ---- 粒子生成 ----
function spawnCrashParticles() {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: player.x, y: player.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 3,
            life: 30 + Math.random() * 20,
            color: ['#f44336', '#ff9800', '#ffeb3b'][Math.floor(Math.random() * 3)]
        });
    }
}

function spawnCollectParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20 + Math.random() * 10,
            color
        });
    }
}

// ---- 游戏初始化 ----
function startGame() {
    Sound.init();
    hideStartOverlay();
    hideGameOverOverlay();

    player = createPlayer();
    cars = [];
    pickups = [];
    particles = [];
    score = 0;
    gameActive = true;
    frameCount = 0;
    lives = INITIAL_LIVES;
    baseSpeed = 3;
    roadSpeed = baseSpeed;
    shakeX = 0;
    shakeY = 0;
    updateHUD(score, roadSpeed, highScore, lives);
}

// ---- 碰撞处理 ----
function handleCollision() {
    lives--;
    Sound.play('crash');
    shakeX = 15;
    shakeY = 15;
    spawnCrashParticles();

    if (lives <= 0) {
        gameActive = false;
        highScore = Math.max(highScore, score);
        localStorage.setItem('racing_high', highScore);
        setTimeout(() => {
            showGameOver(score, highScore, lives);
        }, 500);
    } else {
        // 还有命：短暂无敌后继续
        player.invincible = 120;
        updateHUD(score, roadSpeed, highScore, lives);
    }
}

// ---- 逻辑更新 ----
function update() {
    if (!gameActive) return;
    frameCount++;

    // 玩家平滑移动到目标车道
    const targetX = ROAD_LEFT + player.lane * LANE_W + LANE_W / 2;
    player.x += (targetX - player.x) * 0.2;

    // 速度递增
    baseSpeed = 3 + frameCount * 0.0005;
    roadSpeed = baseSpeed;

    // 分数
    if (frameCount % 5 === 0) score += Math.floor(roadSpeed);
    if (player.invincible > 0) player.invincible--;

    // 生成敌车和道具
    if (frameCount % Math.max(20, 50 - Math.floor(frameCount / 200)) === 0) {
        const newCar = spawnCar(roadSpeed, cars);
        if (newCar) cars.push(newCar);
    }
    if (frameCount % 200 === 0) {
        const newPickup = spawnPickup(pickups);
        if (newPickup) pickups.push(newPickup);
    }

    // 更新敌车
    for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        c.y += roadSpeed + c.speed;
        if (c.y > H + 100) { cars.splice(i, 1); continue; }

        // 碰撞检测
        if (player.invincible <= 0 &&
            Math.abs(player.x - c.x) < COLLISION_X &&
            Math.abs(player.y - c.y) < COLLISION_Y) {
            handleCollision();
            if (!gameActive) return;
            cars.splice(i, 1);
            continue;
        }

        // 超越得分
        if (!c.passed && c.y > player.y + 40) {
            c.passed = true;
            score += 10;
            Sound.play('pass');
            updateHUD(score, roadSpeed, highScore, lives);
        }
    }

    // 更新道具
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.y += roadSpeed;
        if (p.y > H + 30) { pickups.splice(i, 1); continue; }
        if (Math.abs(player.x - p.x) < 30 && Math.abs(player.y - p.y) < 30) {
            if (p.type === 'heal') {
                // 修复道具：恢复1点生命（上限为初始生命值）
                if (lives < INITIAL_LIVES) {
                    lives++;
                }
                // 同时给短暂无敌保护
                player.invincible = 60;
            } else {
                score += 100;
            }
            Sound.play('collect');
            spawnCollectParticles(p.x, p.y, p.type === 'heal' ? '#4caf50' : '#ffeb3b');
            pickups.splice(i, 1);
            updateHUD(score, roadSpeed, highScore, lives);
        }
    }

    // 屏幕震动衰减
    shakeX *= 0.9;
    shakeY *= 0.9;

    // 粒子更新
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        return p.life > 0;
    });
}

// ---- 渲染 ----
function draw() {
    ctx.save();
    ctx.translate(
        (Math.random() - 0.5) * shakeX,
        (Math.random() - 0.5) * shakeY
    );

    // 道路
    drawRoad(ctx, frameCount, roadSpeed, pickups);

    // 敌车
    cars.forEach(c => drawCar(ctx, c.x, c.y, c.color, false));

    // 玩家（无敌闪烁）
    if (player.invincible > 0 && player.invincible % 6 < 3) {
        ctx.globalAlpha = 0.5;
    }
    drawCar(ctx, player.x, player.y, player.color, true);
    ctx.globalAlpha = 1;

    // 粒子
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 生命值显示（画布内）
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('❤'.repeat(Math.max(0, lives)), 10, H - 10);

    ctx.restore();
}

// ---- 主循环 ----
function gameLoop() {
    requestAnimationFrame(gameLoop);
    update();
    draw();
}

// ---- 事件监听 ----
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyR') { e.preventDefault(); startGame(); }

    // 直接响应按键变道（修复Bug：不再依赖帧计数）
    if (gameActive) {
        if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && player.lane > 0) {
            player.lane--;
        }
        if ((e.code === 'ArrowRight' || e.code === 'KeyD') && player.lane < LANES - 1) {
            player.lane++;
        }
    }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// 触屏控制
let touchStartX;
canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
});
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dx) > 30) {
        if (dx > 0 && player.lane < LANES - 1) {
            player.lane++;
            touchStartX = e.touches[0].clientX;
        }
        if (dx < 0 && player.lane > 0) {
            player.lane--;
            touchStartX = e.touches[0].clientX;
        }
    }
});

// 暴露 startGame 给 HTML 按钮的 onclick
window.startGame = startGame;

// 初始 HUD
updateHUD(score || 0, roadSpeed || 3, highScore, lives || INITIAL_LIVES);

// Bug修复：启动游戏主循环（原代码定义了 gameLoop 但从未调用）
gameLoop();
