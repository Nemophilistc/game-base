import { MAP_TEMPLATE, CELL, ROWS, COLS, HIGH_SCORE_KEY } from './config.js';
import { Sound } from './sound.js';
import { drawMap } from './map.js';
import { createPacman, resetPacman, drawPacman } from './pacman.js';
import { createGhosts, resetGhost, moveGhosts, drawGhosts } from './ghost.js';
import { updateHUD, hideAllOverlays, showGameOver, showWin } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

let map, pacman, ghosts;
let score, lives, highScore, gameActive, paused;
let powerTimer, totalDots;
let frameCount = 0;

highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;

function canMove(x, y) {
    if (y < 0 || y >= ROWS) return x >= 0 && x < COLS; // tunnel
    if (x < 0 || x >= COLS) return true; // tunnel wrap
    return map[y][x] !== 1 && map[y][x] !== 4;
}

function startGame() {
    Sound.init();
    hideAllOverlays();

    map = MAP_TEMPLATE.map(r => [...r]);
    totalDots = 0;
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            if (map[r][c] === 2 || map[r][c] === 3) totalDots++;

    pacman = createPacman();
    ghosts = createGhosts();
    score = 0; lives = 3; gameActive = true; paused = false; powerTimer = 0; frameCount = 0;
    updateHUD(score, lives, highScore);
}

// Expose startGame for inline onclick handlers in HTML
window.startGame = startGame;

function update() {
    if (!gameActive || paused) return;

    // Pacman movement（每6帧移动一次，约10格/秒，经典吃豆人节奏）
    pacman.moveTimer = (pacman.moveTimer || 0) + 1;
    if (pacman.moveTimer >= 6) {
        pacman.moveTimer = 0;
        const nx = pacman.x + pacman.nextDir.x, ny = pacman.y + pacman.nextDir.y;
        if (canMove(nx, ny)) pacman.dir = pacman.nextDir;

        const mx = pacman.x + pacman.dir.x, my = pacman.y + pacman.dir.y;
        if (canMove(mx, my)) {
            pacman.x = mx; pacman.y = my;
            if (pacman.x < 0) pacman.x = COLS - 1;
            if (pacman.x >= COLS) pacman.x = 0;
        }
    }

    // Mouth animation
    pacman.mouth += pacman.mouthDir * 0.15;
    if (pacman.mouth > 0.4 || pacman.mouth < 0) pacman.mouthDir *= -1;

    // Eat dots
    if (pacman.y >= 0 && pacman.y < ROWS) {
        if (map[pacman.y][pacman.x] === 2) {
            map[pacman.y][pacman.x] = 0; score += 10; totalDots--; Sound.play('eat');
        } else if (map[pacman.y][pacman.x] === 3) {
            map[pacman.y][pacman.x] = 0; score += 50; totalDots--;
            powerTimer = 300; Sound.play('power');
            ghosts.forEach(g => g.frightened = 300);
        }
    }

    if (powerTimer > 0) powerTimer--;
    ghosts.forEach(g => { if (g.frightened > 0) g.frightened--; });

    // Ghost movement (every 10 frames，比吃豆人略慢)
    frameCount++;
    if (frameCount % 10 === 0) moveGhosts(ghosts, pacman, canMove);

    // Collision with ghosts
    for (const g of ghosts) {
        if (g.x === pacman.x && g.y === pacman.y) {
            if (g.frightened > 0) {
                score += 200; Sound.play('ghost');
                resetGhost(g);
            } else {
                lives--; Sound.play('die');
                if (lives <= 0) {
                    gameActive = false;
                    highScore = Math.max(highScore, score);
                    localStorage.setItem(HIGH_SCORE_KEY, highScore);
                    setTimeout(() => showGameOver(score, highScore), 500);
                    return;
                }
                resetPacman(pacman);
                updateHUD(score, lives, highScore);
            }
        }
    }

    // Win check
    if (totalDots <= 0) {
        gameActive = false;
        highScore = Math.max(highScore, score);
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
        setTimeout(() => showWin(score, highScore), 500);
    }

    updateHUD(score, lives, highScore);
}

function draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawMap(ctx, map);
    drawGhosts(ctx, ghosts);
    drawPacman(ctx, pacman);
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    update(); draw();
}

// Event listeners
window.addEventListener('keydown', e => {
    if (e.code === 'KeyP') { paused = !paused; return; }
    if (e.code === 'KeyR') { startGame(); return; }
    switch (e.code) {
        case 'ArrowUp': case 'KeyW': pacman.nextDir = { x: 0, y: -1 }; e.preventDefault(); break;
        case 'ArrowDown': case 'KeyS': pacman.nextDir = { x: 0, y: 1 }; e.preventDefault(); break;
        case 'ArrowLeft': case 'KeyA': pacman.nextDir = { x: -1, y: 0 }; e.preventDefault(); break;
        case 'ArrowRight': case 'KeyD': pacman.nextDir = { x: 1, y: 0 }; e.preventDefault(); break;
    }
});

// Initialize
updateHUD(0, 3, highScore);
gameLoop();
