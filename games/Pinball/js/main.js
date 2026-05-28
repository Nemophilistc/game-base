import { W, H } from './config.js';
import { Sound } from './sound.js';
import { createBall, launchBall, updateBallPhysics, collideWalls,
         collideBumpers, collideTargets, updateParticles, isBallLost } from './physics.js';
import { createFlippers, updateFlippers, collideFlippers } from './flipper.js';
import { draw, updateHUD } from './ui.js';

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 游戏状态
let ball, bumpers, targets, flippers;
let score, lives, highScore, gameActive;
let keys = {};
let particles = [];

highScore = parseInt(localStorage.getItem('pinball_high')) || 0;

function createBumpers() {
    return [
        { x: 140, y: 180, r: 25, color: '#f44336', points: 100, flash: 0 },
        { x: 280, y: 180, r: 25, color: '#4caf50', points: 100, flash: 0 },
        { x: 210, y: 130, r: 30, color: '#2196f3', points: 200, flash: 0 },
        { x: 120, y: 300, r: 20, color: '#ff9800', points: 150, flash: 0 },
        { x: 300, y: 300, r: 20, color: '#9c27b0', points: 150, flash: 0 },
        { x: 210, y: 260, r: 22, color: '#e91e63', points: 250, flash: 0 }
    ];
}

function createTargets() {
    return [
        { x: 60,  y: 120, w: 30, h: 12, color: '#ffd700', points: 500,  alive: true },
        { x: 330, y: 120, w: 30, h: 12, color: '#ffd700', points: 500,  alive: true },
        { x: 60,  y: 400, w: 30, h: 12, color: '#00ff96', points: 300,  alive: true },
        { x: 330, y: 400, w: 30, h: 12, color: '#00ff96', points: 300,  alive: true },
        { x: 170, y: 70,  w: 80, h: 12, color: '#e040fb', points: 1000, alive: true }
    ];
}

function addScore(pts) { score += pts; }

function startGame() {
    Sound.init();
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');

    score = 0; lives = 3; gameActive = true; particles = [];
    bumpers = createBumpers(); targets = createTargets();
    ball = createBall();
    flippers = createFlippers();
    updateHUD(score, lives, highScore);
}

// 暴露给 HTML onclick
window.startGame = startGame;

function update() {
    if (!gameActive) return;

    // 挡板控制与角度插值
    updateFlippers(flippers, keys);

    // 球未发射：吸附在发射位
    if (!ball.launched) return;

    // 球物理
    updateBallPhysics(ball);
    collideWalls(ball);
    collideBumpers(ball, bumpers, particles, addScore);
    collideTargets(ball, targets, particles, addScore);
    collideFlippers(flippers, ball);
    updateHUD(score, lives, highScore);

    // 全部靶被摧毁后 3 秒重生
    if (targets.every(t => !t.alive)) {
        targets = createTargets();
    }

    // 球掉落
    if (isBallLost(ball)) {
        lives--;
        Sound.play('die');
        if (lives <= 0) {
            gameActive = false;
            highScore = Math.max(highScore, score);
            localStorage.setItem('pinball_high', highScore);
            setTimeout(() => {
                document.getElementById('goStats').innerHTML = `分数: ${score}<br>最高: ${highScore}`;
                document.getElementById('gameOverOverlay').classList.remove('hidden');
            }, 500);
            return;
        }
        ball = createBall();
        updateHUD(score, lives, highScore);
    }

    // 粒子更新
    particles = updateParticles(particles);
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    update();
    draw(ctx, ball, bumpers, targets, flippers, particles);
}

// 事件监听
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') { e.preventDefault(); if (ball) launchBall(ball); }
    if (e.code === 'KeyR')  { e.preventDefault(); startGame(); }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// 初始化
particles = [];
updateHUD(score, lives, highScore);

// Bug Fix #1: 启动游戏主循环
gameLoop();
