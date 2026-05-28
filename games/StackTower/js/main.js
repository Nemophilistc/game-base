// main.js - Game initialization, event listeners, game loop
import Sound from './sound.js';
import { state, initBlocks, dropBlock, updateBlocks } from './blocks.js';
import { initCanvas, draw, updateHUD } from './ui.js';

const canvas = document.getElementById('gameCanvas');
initCanvas(canvas);

function startGame() {
    Sound.init();
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    initBlocks();
    updateHUD();
}

function showGameOver() {
    document.getElementById('goStats').innerHTML =
        `层数: ${state.blocks.length}<br>分数: ${state.score}<br>最高: ${state.highScore}`;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    const animDone = updateBlocks();
    if (animDone) showGameOver();
    draw();
}

// Expose startGame for onclick handlers in HTML
window.startGame = startGame;

// Keyboard controls
window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowDown') {
        e.preventDefault();
        dropBlock();
    }
    if (e.code === 'KeyR') {
        e.preventDefault();
        startGame();
    }
});

// Touch / click controls
canvas.addEventListener('click', dropBlock);
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    dropBlock();
});

// Initial HUD and start game loop
updateHUD();
gameLoop();
