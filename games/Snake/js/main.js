import { CELL, COLS, ROWS, BASE_MOVE_INTERVAL } from './config.js';
import { Sound } from './sound.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import * as UI from './ui.js';

// ── Canvas 初始化 ──
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width  = COLS * CELL;
canvas.height = ROWS * CELL;

// ── 游戏状态 ──
let mode = 'classic';
let snake = new Snake();
let food  = new Food();
let score = 0;
let highScore = parseInt(localStorage.getItem('snake_high')) || 0;
let alive = true;
let paused = false;
let gameTimer = 0;
let lastTimestamp = 0;
let moveAccum = 0;

// ── 模式选择 ──
window.setMode = function (m, el) {
    mode = UI.setMode(m, el);
};

// ── 开始游戏 ──
window.startGame = function () {
    Sound.init();
    UI.hideAllScreens();

    snake.init();
    if (mode === 'maze') snake.generateMaze();
    food.spawn((x, y) => snake.isBody(x, y, false) || snake.isMazeWall(x, y));

    score = 0;
    alive = true;
    paused = false;
    lastTimestamp = 0;
    moveAccum = 0;
    UI.updateHUD(score, snake.length, highScore);

    if (!gameTimer) gameTimer = requestAnimationFrame(gameLoop);
};

// ── 返回菜单 ──
window.showMenu = function () {
    UI.showStartScreen();
};

// ── 键盘事件 ──
window.addEventListener('keydown', e => {
    if (e.code === 'KeyP') {
        paused = !paused;
        UI.togglePause(paused);
        return;
    }
    if (e.code === 'KeyR') {
        window.startGame();
        return;
    }
    if (paused) return;

    switch (e.code) {
        case 'ArrowUp':    case 'KeyW': snake.setDirection( 0, -1); e.preventDefault(); break;
        case 'ArrowDown':  case 'KeyS': snake.setDirection( 0,  1); e.preventDefault(); break;
        case 'ArrowLeft':  case 'KeyA': snake.setDirection(-1,  0); e.preventDefault(); break;
        case 'ArrowRight': case 'KeyD': snake.setDirection( 1,  0); e.preventDefault(); break;
    }
});

// ── 游戏主循环（使用 timestamp 计算 delta-time） ──
function gameLoop(timestamp) {
    gameTimer = requestAnimationFrame(gameLoop);

    if (!alive || paused) return;

    // 首帧初始化 timestamp
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const interval = snake.getMoveInterval(BASE_MOVE_INTERVAL);

    // 累积时间，处理可能的多次移动（防止极低帧率时蛇变慢）
    moveAccum += delta;
    let moved = false;

    while (moveAccum >= interval) {
        moveAccum -= interval;
        moved = true;

        // ── 移动 ──
        const result = snake.move(mode);

        if (result !== 'ok') {
            alive = false;
            Sound.play('die');
            highScore = Math.max(highScore, score);
            localStorage.setItem('snake_high', highScore);
            setTimeout(() => UI.showGameOver(score, snake.length, highScore), 500);
            moveAccum = 0;
            return;
        }

        // ── 吃食物 ──
        const head = snake.head;
        if (head.x === food.x && head.y === food.y) {
            let pts = 1;
            switch (food.type) {
                case 'normal': pts = 1; Sound.play('eat'); break;
                case 'speed':  snake.speedBoost  = 120; Sound.play('special'); break;
                case 'slow':   snake.speedSlow   = 120; Sound.play('special'); break;
                case 'double': snake.doubleScore = 120; Sound.play('special'); break;
                case 'poison': pts = -2; Sound.play('die'); snake.shrink(2); break;
            }
            if (snake.doubleScore > 0) pts *= 2;
            score = Math.max(0, score + pts);
            food.spawn((x, y) => snake.isBody(x, y, false) || snake.isMazeWall(x, y));
        } else {
            snake.removeTail();
        }

        snake.tickPowerups();
    }

    // ── 绘制 ──
    if (moved) UI.updateHUD(score, snake.length, highScore);
    draw();
}

// ── 绘制场景 ──
function draw() {
    // 背景
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
    }

    // 食物和蛇
    food.draw(ctx);
    snake.draw(ctx);
}

// ── 初始 HUD 显示 ──
UI.updateHUD(0, 3, highScore);
