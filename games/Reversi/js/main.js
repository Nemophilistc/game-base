// main.js - Game loop and initialization

import { BOARD_SIZE, CELL_SIZE, BOARD_PADDING, HUD_HEIGHT, DISC_RADIUS, COLORS, BLACK, WHITE, EMPTY, AI_DELAY } from './config.js';
import { playPlace, playFlip, playInvalid, playStart, playGameOver } from './sound.js';
import { initBoard, getBoard, getCurrentPlayer, getBlackCount, getWhiteCount, getLastMove, isValidMove, getValidMoves, makeMove, isGameOver, getWinner } from './board.js';
import { getAIMove } from './ai.js';
import { resetEffects, updateEffects, isAnimating, getAnimatedCells, addFlipAnimations, addPlaceAnimation, addParticles, drawEffects } from './effects.js';
import { initUI, showStart, showGameOver, hideOverlay, getOverlayState, getStartOptions, setStartCallback, setRestartCallback, updateGameOverUI, drawHUD } from './ui.js';

let canvas, ctx;
let canvasWidth, canvasHeight;
let gameMode = 'ai';
let difficulty = 'medium';
let gameActive = false;
let aiThinking = false;
let aiTimer = 0;
let lastTimestamp = 0;

const HIGHSCORE_KEY = 'reversi_highscore';

function getHighScore() {
    return parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10);
}

function setCanvasSize() {
    canvasWidth = BOARD_SIZE * CELL_SIZE + BOARD_PADDING * 2;
    canvasHeight = BOARD_SIZE * CELL_SIZE + BOARD_PADDING * 2 + HUD_HEIGHT;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startGame(options) {
    gameMode = options.mode;
    difficulty = options.difficulty;
    initBoard();
    resetEffects();
    gameActive = true;
    aiThinking = false;
    aiTimer = 0;
    hideOverlay();
    document.getElementById('start-overlay').classList.remove('active');
    document.getElementById('gameover-overlay').classList.remove('active');
    playStart();
}

function restartGame() {
    document.getElementById('gameover-overlay').classList.remove('active');
    startGame({ mode: gameMode, difficulty: difficulty });
}

function endGame() {
    gameActive = false;
    const winner = getWinner();
    const bc = getBlackCount();
    const wc = getWhiteCount();
    showGameOver(winner, bc, wc);
    updateGameOverUI();
    document.getElementById('gameover-overlay').classList.add('active');
    playGameOver();
}

function cellToPixel(r, c) {
    return {
        x: BOARD_PADDING + c * CELL_SIZE + CELL_SIZE / 2,
        y: HUD_HEIGHT + BOARD_PADDING + r * CELL_SIZE + CELL_SIZE / 2
    };
}

function pixelToCell(px, py) {
    const c = Math.floor((px - BOARD_PADDING) / CELL_SIZE);
    const r = Math.floor((py - HUD_HEIGHT - BOARD_PADDING) / CELL_SIZE);
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) return { r, c };
    return null;
}

function handleBoardClick(e) {
    if (!gameActive) return;
    if (isAnimating()) return;
    if (aiThinking) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const cell = pixelToCell(px, py);
    if (!cell) return;

    const player = getCurrentPlayer();

    // In AI mode, only allow clicks when it's the human's turn (black)
    if (gameMode === 'ai' && player === WHITE) return;

    tryMove(cell.r, cell.c);
}

function tryMove(r, c) {
    const player = getCurrentPlayer();

    if (!isValidMove(r, c, player)) {
        playInvalid();
        return;
    }

    const result = makeMove(r, c, player);
    if (!result) return;

    // Sound and effects
    playPlace();
    addPlaceAnimation(result.placed.r, result.placed.c, player);
    addFlipAnimations(result.flips, player);

    // Flip sounds with cascade
    result.flips.forEach((_, i) => {
        setTimeout(() => playFlip(i), i * 50);
    });

    // Particles for each flipped disc
    result.flips.forEach(f => {
        addParticles(f.r, f.c, player);
    });

    // Check game over
    if (isGameOver()) {
        setTimeout(() => endGame(), 600);
        return;
    }

    // If AI's turn
    if (gameMode === 'ai' && getCurrentPlayer() === WHITE) {
        aiThinking = true;
        aiTimer = AI_DELAY;
    }
}

function updateAI(dt) {
    if (!aiThinking || !gameActive) return;

    aiTimer -= dt * 1000;
    if (aiTimer > 0) return;

    aiThinking = false;
    const board = getBoard();
    const move = getAIMove(difficulty, board, WHITE);

    if (move) {
        const result = makeMove(move.r, move.c, WHITE);
        if (result) {
            playPlace();
            addPlaceAnimation(result.placed.r, result.placed.c, WHITE);
            addFlipAnimations(result.flips, WHITE);
            result.flips.forEach((_, i) => {
                setTimeout(() => playFlip(i), i * 50);
            });
            result.flips.forEach(f => {
                addParticles(f.r, f.c, WHITE);
            });
        }
    }

    if (isGameOver()) {
        setTimeout(() => endGame(), 600);
    }
}

// --- Drawing ---

function drawBoard() {
    const w = canvasWidth;
    const h = canvasHeight;

    // Clear
    ctx.fillStyle = '#0a1912';
    ctx.fillRect(0, 0, w, h);

    // Board origin (offset by HUD)
    const bx = BOARD_PADDING;
    const by = HUD_HEIGHT + BOARD_PADDING;
    const boardSize = BOARD_SIZE * CELL_SIZE;

    // Board shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = COLORS.boardBg;
    ctx.fillRect(bx, by, boardSize, boardSize);
    ctx.restore();

    // Board background (no shadow)
    ctx.fillStyle = COLORS.boardBg;
    ctx.fillRect(bx, by, boardSize, boardSize);

    // Grid lines
    ctx.strokeStyle = COLORS.boardLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
        const x = bx + i * CELL_SIZE;
        const y = by + i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.lineTo(x, by + boardSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx, y);
        ctx.lineTo(bx + boardSize, y);
        ctx.stroke();
    }

    // Star points
    const starPoints = [[2, 2], [2, 6], [6, 2], [6, 6]];
    for (const [sr, sc] of starPoints) {
        const sx = bx + sc * CELL_SIZE;
        const sy = by + sr * CELL_SIZE;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.boardLine;
        ctx.fill();
    }
}

function drawDiscs() {
    const board = getBoard();
    const animatedCells = getAnimatedCells();

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === EMPTY) continue;
            if (animatedCells.has(`${r},${c}`)) continue; // skip animated cells
            drawDisc(r, c, board[r][c]);
        }
    }
}

function drawDisc(r, c, color) {
    const { x, y } = cellToPixel(r, c);

    // Shadow
    ctx.beginPath();
    ctx.arc(x, y + 2, DISC_RADIUS + 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Disc with gradient
    const gradient = ctx.createRadialGradient(x - DISC_RADIUS * 0.3, y - DISC_RADIUS * 0.3, 0, x, y, DISC_RADIUS);
    if (color === BLACK) {
        gradient.addColorStop(0, COLORS.blackDiscHighlight);
        gradient.addColorStop(1, COLORS.blackDisc);
    } else {
        gradient.addColorStop(0, COLORS.whiteDiscHighlight);
        gradient.addColorStop(1, COLORS.whiteDisc);
    }

    ctx.beginPath();
    ctx.arc(x, y, DISC_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Edge
    ctx.strokeStyle = color === BLACK ? 'rgba(80,80,80,0.5)' : 'rgba(200,200,200,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawValidMoves() {
    if (!gameActive) return;
    if (isAnimating()) return;

    const player = getCurrentPlayer();

    // In AI mode, don't show valid moves during AI turn
    if (gameMode === 'ai' && player === WHITE) return;

    const moves = getValidMoves(player);
    const color = player === BLACK ? COLORS.validMoveBlack : COLORS.validMoveWhite;

    for (const m of moves) {
        const { x, y } = cellToPixel(m.r, m.c);
        ctx.beginPath();
        ctx.arc(x, y, DISC_RADIUS * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

function drawLastMove() {
    const last = getLastMove();
    if (!last) return;

    const { x, y } = cellToPixel(last.r, last.c);

    // Small teal dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.teal;
    ctx.fill();
}

// --- Game Loop ---

function gameLoop(timestamp) {
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    // Update
    updateEffects(dt);
    updateAI(dt);

    // Draw
    drawBoard();
    drawValidMoves();
    drawDiscs();
    drawLastMove();
    drawEffects(ctx);

    // HUD
    const player = getCurrentPlayer();
    const validMoves = getValidMoves();
    drawHUD(ctx, canvasWidth, player, getBlackCount(), getWhiteCount(), difficulty, gameMode === 'pvp', validMoves.length, isAnimating());

    requestAnimationFrame(gameLoop);
}

// --- Initialization ---

function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    ctx = canvas.getContext('2d');

    setCanvasSize();
    initUI();

    setStartCallback(startGame);
    setRestartCallback(restartGame);

    canvas.addEventListener('click', handleBoardClick);

    // Also handle touch
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleBoardClick({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    });

    showStart();
    requestAnimationFrame(gameLoop);
}

// Expose startGame globally
window.startGame = function(options) {
    startGame(options || { mode: 'ai', difficulty: 'medium' });
};

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
