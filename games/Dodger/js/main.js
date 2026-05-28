// 躲避球 - 游戏入口（ES Module）
import {
    W, H,
    BASE_SPAWN_RATE, MIN_SPAWN_RATE, SPAWN_RATE_DECREASE_INTERVAL,
    ENERGY_SPAWN_INTERVAL
} from './config.js';
import { Sound } from './sound.js';
import { createPlayer, updatePlayer } from './player.js';
import {
    spawnObstacle, spawnEnergy,
    updateObstacles, updateEnergyOrbs,
    spawnDeathParticles, updateParticles
} from './obstacles.js';
import { draw, updateHUD } from './ui.js';

// Canvas 初始化
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// ========== 游戏状态 ==========
let player = null;
let obstacles = [];
let energyOrbs = [];
let particles = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('dodger_high')) || 0;
let gameActive = false;
let frameCount = 0;
let spawnTimer = 0;
let energyTimer = 0;
let shakeX = 0;
let shakeY = 0;

// ========== 输入状态 ==========
let keys = {};
let mouseX;  // undefined = 鼠标不在canvas上
let mouseY;

// 供HTML onclick使用
window.startGame = startGame;

// ========== 游戏生命周期 ==========

function startGame() {
    Sound.init();
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');

    player = createPlayer();
    obstacles = [];
    energyOrbs = [];
    particles = [];
    score = 0;
    gameActive = true;
    frameCount = 0;
    spawnTimer = 0;
    energyTimer = 0;
    shakeX = 0;
    shakeY = 0;
    // BUG FIX #3: 开始新游戏时重置鼠标状态，防止旧状态干扰
    mouseX = undefined;
    mouseY = undefined;

    updateHUD(score, highScore, frameCount);
}

// ========== 更新逻辑 ==========

function update() {
    if (!gameActive) return;
    frameCount++;

    // 键盘输入
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
    if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
    if (keys['ArrowDown'] || keys['KeyS']) dy = 1;

    // 鼠标/触摸输入（仅在鼠标位于canvas内时生效）
    if (mouseX !== undefined) {
        const mdx = mouseX - player.x;
        const mdy = mouseY - player.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist > 5) {
            dx = mdx / mdist;
            dy = mdy / mdist;
        }
    }

    // 更新玩家
    updatePlayer(player, dx, dy);

    // 生成障碍物（难度递增）
    spawnTimer++;
    const spawnRate = Math.max(
        MIN_SPAWN_RATE,
        BASE_SPAWN_RATE - Math.floor(frameCount / SPAWN_RATE_DECREASE_INTERVAL)
    );
    if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        spawnObstacle(obstacles);
    }

    // 生成能量球
    energyTimer++;
    if (energyTimer >= ENERGY_SPAWN_INTERVAL) {
        energyTimer = 0;
        spawnEnergy(energyOrbs);
    }

    // 更新障碍物 & 碰撞检测
    if (updateObstacles(obstacles, player)) {
        gameActive = false;
        Sound.play('die');
        shakeX = 10;
        shakeY = 10;
        spawnDeathParticles(particles, player);
        highScore = Math.max(highScore, score);
        localStorage.setItem('dodger_high', highScore);
        setTimeout(() => {
            document.getElementById('goStats').innerHTML =
                `分数: ${score}<br>存活: ${Math.floor(frameCount / 60)}秒<br>最高: ${highScore}`;
            document.getElementById('gameOverOverlay').classList.remove('hidden');
        }, 500);
        return;
    }

    // 能量球拾取
    const orbScore = updateEnergyOrbs(energyOrbs, player, particles);
    if (orbScore > 0) {
        score += orbScore;
        updateHUD(score, highScore, frameCount);
    }

    // 存活计分
    if (frameCount % 60 === 0) {
        score++;
        updateHUD(score, highScore, frameCount);
    }

    // 屏幕震动衰减
    shakeX *= 0.9;
    shakeY *= 0.9;

    // 粒子更新
    particles = updateParticles(particles);
}

// ========== 游戏主循环 ==========

function gameLoop() {
    requestAnimationFrame(gameLoop);
    update();
    draw(ctx, player, obstacles, energyOrbs, particles, shakeX, shakeY);
}

// ========== 事件监听 ==========

// 键盘
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'KeyR') {
        e.preventDefault();
        startGame();
    }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// 鼠标移动
canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = (e.clientX - r.left) * (W / r.width);
    mouseY = (e.clientY - r.top) * (H / r.height);
});

// BUG FIX #3: 鼠标离开canvas时清除状态，恢复键盘控制
canvas.addEventListener('mouseleave', () => {
    mouseX = undefined;
    mouseY = undefined;
});

// 触摸
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    mouseX = (e.touches[0].clientX - r.left) * (W / r.width);
    mouseY = (e.touches[0].clientY - r.top) * (H / r.height);
});

// ========== 启动 ==========
updateHUD(score, highScore, frameCount);
gameLoop();
