// Flappy Bird - 游戏主循环、初始化、事件监听
import { W, H, HIGH_SCORE_KEY } from './config.js';
import Sound from './sound.js';
import { resetBird, flapBird, updateBird, drawBird, getBird } from './bird.js';
import { resetPipes, updatePipes, checkCollision, drawPipes, getPipeSpeed } from './pipes.js';
import {
    updateGroundX, updateHUD, showGameOver, hideOverlays,
    drawSky, drawStars, drawClouds, drawGround, drawParticles, drawScore
} from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

let score = 0;
let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
let state = 'ready';
let frameCount = 0;
let dayNight = 0;
let particles = [];

// ---- 初始化 ----

function init() {
    resetBird();
    resetPipes();
    particles = [];
    score = 0;
    frameCount = 0;
    state = 'ready';
    updateHUD(score, highScore);
}

function startGame() {
    Sound.init();
    hideOverlays();
    init();
    state = 'playing';
}

// ---- 扇翅膀 ----

function flap() {
    if (state === 'ready') {
        startGame();
        return;
    }
    if (state !== 'playing') return;
    flapBird();
}

// ---- 死亡 ----

function die() {
    state = 'dead';
    Sound.play('die');

    const bird = getBird();
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: bird.x,
            y: bird.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            life: 30,
            color: ['#ffeb3b', '#ff9800', '#f44336'][Math.floor(Math.random() * 3)]
        });
    }

    highScore = Math.max(highScore, score);
    localStorage.setItem(HIGH_SCORE_KEY, highScore);

    setTimeout(() => {
        showGameOver(score, highScore);
    }, 500);
}

// ---- 游戏主循环 ----

function gameLoop() {
    requestAnimationFrame(gameLoop);
    frameCount++;
    dayNight = (Math.sin(frameCount * 0.001) + 1) / 2;

    if (state === 'playing') {
        updateBird();

        const bird = getBird();
        updatePipes(score, frameCount, bird, () => {
            score++;
            updateHUD(score, highScore);
        });

        updateGroundX(score);

        if (checkCollision(bird)) {
            die();
            return;
        }
    } else {
        // ready/dead 状态也要更新地面滚动（用默认速度）
        updateGroundX(score);
    }

    // 粒子更新
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        return p.life > 0;
    });

    draw();
}

// ---- 绘制 ----

function draw() {
    drawSky(ctx, dayNight);
    drawStars(ctx, dayNight, frameCount);
    drawClouds(ctx, dayNight, frameCount);
    drawPipes(ctx);
    drawGround(ctx);
    drawBird(ctx, frameCount, state);
    drawParticles(ctx, particles);

    if (state === 'playing' || state === 'dead') {
        drawScore(ctx, score);
    }
}

// ---- 事件监听 ----

window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
    }
    if (e.code === 'KeyR') {
        e.preventDefault();
        startGame();
    }
});

canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    flap();
});

// 暴露 startGame 给 HTML 按钮的 onclick
window.startGame = startGame;

// ---- 启动 ----
updateHUD(score, highScore);
init();
gameLoop();
