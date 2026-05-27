// 游戏主循环、关卡生成、碰撞检测、输入处理
import { W, H } from './config.js';
import Sound from './sound.js';
import { createPaddle, updatePaddle } from './paddle.js';
import { createBall, releaseBalls, updateBalls, paddleCollision } from './ball.js';
import { generateBricks, ballBrickCollision, checkLevelClear, hitBrick } from './bricks.js';
import { updatePowerups, updateLaser, updateParticles } from './items.js';
import { updateHUD, showGameOver, showWin, hideAllScreens, draw } from './ui.js';

// 画布初始化
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 游戏状态
let state = {
    paddle: null,
    balls: [],
    bricks: [],
    powerups: [],
    particles: [],
    laserBeams: []
};
let score = 0;
let lives = 3;
let level = 1;
let highScore = 0;
let gameActive = false;
let sticking = true;
let keys = {};
let loopRunning = false;

/**
 * 初始化关卡
 */
function initLevel(lv) {
    level = lv;
    state.paddle = createPaddle();
    state.balls = [createBall(W / 2)];
    state.powerups = [];
    state.particles = [];
    state.laserBeams = [];
    sticking = true;
    state.bricks = generateBricks(lv);
    updateHUD(score, level, lives, highScore);
}

/**
 * 开始游戏
 */
function startGame() {
    Sound.init();
    hideAllScreens();
    score = 0;
    lives = 3;
    gameActive = true;
    highScore = parseInt(localStorage.getItem('breakout_high')) || 0;
    initLevel(1);
    if (!loopRunning) {
        loopRunning = true;
        gameLoop();
    }
}

/**
 * 游戏结束
 */
function gameOver() {
    gameActive = false;
    highScore = Math.max(highScore, score);
    localStorage.setItem('breakout_high', highScore);
    showGameOver(score, level, highScore);
}

/**
 * 通关
 */
function winGame() {
    gameActive = false;
    highScore = Math.max(highScore, score);
    localStorage.setItem('breakout_high', highScore);
    showWin(score, highScore);
}

/**
 * 主更新逻辑
 */
function update() {
    // 挡板键盘移动
    updatePaddle(state.paddle, keys);

    // 激光系统
    const scoreRefLaser = { value: score };
    const newBeams = updateLaser(state.paddle, state.bricks, (i) => {
        hitBrick(state.bricks, i, state.powerups, state.particles, scoreRefLaser);
    });
    score = scoreRefLaser.value;
    state.laserBeams = state.laserBeams.concat(newBeams);
    state.laserBeams = state.laserBeams.filter(l => { l.life--; return l.life > 0; });

    // 球更新
    const lostIndices = updateBalls(state.balls, state.paddle);
    for (const bi of lostIndices) {
        state.balls.splice(bi, 1);
        if (state.balls.length === 0) {
            lives--;
            Sound.play('die');
            if (lives <= 0) { gameOver(); return; }
            state.balls.push(createBall(state.paddle.x));
            sticking = true;
        }
    }

    // 球-挡板 & 球-砖块 碰撞
    const scoreRef = { value: score };
    for (const b of state.balls) {
        if (b.stuck) continue;
        paddleCollision(b, state.paddle);
        ballBrickCollision(b, state.bricks, state.powerups, state.particles, scoreRef);
    }
    score = scoreRef.value;

    // 道具更新
    updatePowerups(state.powerups, state.paddle, state.balls, H);

    // 粒子更新
    state.particles = updateParticles(state.particles);

    // 过关检测
    if (checkLevelClear(state.bricks)) {
        if (level >= 20) { winGame(); return; }
        initLevel(level + 1);
    }

    updateHUD(score, level, lives, highScore);
}

/**
 * 主游戏循环
 */
function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!gameActive) return;
    update();
    draw(ctx, state);
}

// ===== 输入事件 =====

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        e.preventDefault();
        releaseBalls(state.balls);
        sticking = false;
    }
    if (e.code === 'KeyR') startGame();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    if (state.paddle) state.paddle.x = (e.clientX - rect.left) * (W / rect.width);
});
canvas.addEventListener('click', () => {
    releaseBalls(state.balls);
    sticking = false;
});

// 暴露 startGame 给 HTML 按钮 onclick
window.startGame = startGame;

// 初始 HUD
highScore = parseInt(localStorage.getItem('breakout_high')) || 0;
updateHUD(score, level, lives, highScore);
