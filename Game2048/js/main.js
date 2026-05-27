// main.js — 游戏主循环、事件监听（键盘+触摸）
import { GRID_SIZE, WIN_VALUE, MAX_UNDOS, STORAGE_KEY, SWIPE_THRESHOLD } from './config.js';
import { playMove, playMerge, playWin, playLose } from './sound.js';
import { createGrid, cloneGrid, addRandom, move, canMove, hasValue } from './grid.js';
import { renderBoard, updateScore, updateUndoUI, showWin, showGameOver, hideOverlay } from './ui.js';

// ── 游戏状态 ──
let grid, score, highScore, undos, prevGrid, prevScore, gameOver, hasWon;

highScore = parseInt(localStorage.getItem(STORAGE_KEY)) || 0;

/** 开始新游戏 */
function newGame() {
    grid = createGrid();
    score = 0;
    undos = MAX_UNDOS;
    gameOver = false;
    hasWon = false;
    prevGrid = null;
    prevScore = 0;

    addRandom(grid);
    addRandom(grid);
    renderBoard(grid, null, []);
    hideOverlay();
    updateUndoUI(undos);
    updateScore(score, highScore);
}

/** 保存状态用于撤销 */
function saveState() {
    prevGrid = cloneGrid(grid);
    prevScore = score;
}

/** 撤销 */
function undo() {
    if (!prevGrid || undos <= 0 || gameOver) return;
    grid = prevGrid;
    score = prevScore;
    undos--;
    prevGrid = null;
    updateUndoUI(undos);
    renderBoard(grid, null, []);
    updateScore(score, highScore);
}

/** 执行移动 */
function doMove(dir) {
    if (gameOver) return;
    saveState();

    const result = move(grid, dir);
    if (!result.moved) {
        prevGrid = null;
        return;
    }

    grid = result.grid;
    score += result.scoreGain;

    // 音效
    playMove();
    if (result.mergedPositions.length > 0) playMerge();

    renderBoard(grid, result.randomPos, result.mergedPositions);
    highScore = Math.max(highScore, score);
    updateScore(score, highScore);

    // 胜利检测（只触发一次，且有继续游戏选项）
    if (!hasWon && hasValue(grid, WIN_VALUE)) {
        hasWon = true;
        playWin();
        showWin();
        return;
    }

    // 失败检测
    if (!canMove(grid)) {
        gameOver = true;
        playLose();
        showGameOver();
    }
}

/** 继续挑战（胜利后） */
function continuePlay() {
    gameOver = false;
    hideOverlay();
}

// ── 键盘事件 ──
window.addEventListener('keydown', e => {
    if (e.code === 'KeyR') { e.preventDefault(); newGame(); return; }
    switch (e.code) {
        case 'ArrowUp':    case 'KeyW': e.preventDefault(); doMove('up');    break;
        case 'ArrowDown':  case 'KeyS': e.preventDefault(); doMove('down');  break;
        case 'ArrowLeft':  case 'KeyA': e.preventDefault(); doMove('left');  break;
        case 'ArrowRight': case 'KeyD': e.preventDefault(); doMove('right'); break;
    }
});

// ── 触摸事件 ──
let touchStartX, touchStartY;
document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});
document.addEventListener('touchend', e => {
    if (!touchStartX) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > SWIPE_THRESHOLD) doMove(dx > 0 ? 'right' : 'left');
    } else {
        if (Math.abs(dy) > SWIPE_THRESHOLD) doMove(dy > 0 ? 'down' : 'up');
    }
});

// ── 按钮事件 ──
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('overlayMainBtn').addEventListener('click', newGame);
document.getElementById('continueBtn').addEventListener('click', continuePlay);

// ── 初始化 ──
updateScore(0, highScore);
newGame();
