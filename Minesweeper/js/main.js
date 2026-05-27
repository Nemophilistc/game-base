// 游戏初始化、事件监听、主循环
import { DIFFS } from './config.js';
import Sound from './sound.js';
import { createBoard, cellClick as boardCellClick, cellRightClick as boardRightClick, checkWin } from './board.js';
import {
    renderBoard, updateInfoBar, hideAllOverlays,
    showWinOverlay, showLoseOverlay, setActiveDiffBtn
} from './ui.js';

// ── 游戏状态 ──
let diff = 'easy';
let state = {};
let timerInterval = null;
let elapsed = 0;
let highScores = JSON.parse(localStorage.getItem('minesweeper_high')) || { easy: '--', medium: '--', hard: '--' };

// ── 难度选择 ──
function setDiff(d) {
    diff = d;
    setActiveDiffBtn(d);
}

// ── 开始游戏 ──
function startGame() {
    Sound.init();
    hideAllOverlays();

    const d = DIFFS[diff];
    const { grid, revealed, flagged } = createBoard(d.rows, d.cols);

    state = {
        cols: d.cols,
        rows: d.rows,
        totalMines: d.mines,
        grid,
        revealed,
        flagged,
        mineHit: null,
        gameActive: true,
        gameStarted: false,
        firstClick: true
    };

    elapsed = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;

    updateInfoBar(state.totalMines, 0, highScores[diff]);
    render();
}

// ── 渲染 ──
function render() {
    renderBoard(state, onCellClick, onCellRightClick);
}

// ── 左键点击 ──
function onCellClick(r, c) {
    if (!state.gameActive) return;

    // 首次点击启动计时器
    if (state.firstClick) {
        timerInterval = setInterval(() => {
            elapsed++;
            document.getElementById('timer').textContent = elapsed;
        }, 1000);
    }

    const result = boardCellClick(r, c, state);

    if (result.hit) {
        clearInterval(timerInterval);
        Sound.play('boom');
        render();
        setTimeout(() => showLoseOverlay(elapsed), 500);
        return;
    }

    Sound.play('reveal');

    if (checkWin(state)) {
        state.gameActive = false;
        clearInterval(timerInterval);
        Sound.play('win');
        if (!highScores[diff] || highScores[diff] === '--' || elapsed < highScores[diff]) {
            highScores[diff] = elapsed;
            localStorage.setItem('minesweeper_high', JSON.stringify(highScores));
        }
        render();
        setTimeout(() => showWinOverlay(elapsed, diff), 300);
        return;
    }

    render();
}

// ── 右键标记 ──
function onCellRightClick(r, c) {
    const flagCount = boardRightClick(r, c, state);
    document.getElementById('minesLeft').textContent = state.totalMines - flagCount;
    Sound.play('flag');
    render();
}

// ── 键盘事件 ──
window.addEventListener('keydown', e => {
    if (e.code === 'KeyR') { e.preventDefault(); startGame(); }
});

// ── 全局右键禁用 ──
document.addEventListener('contextmenu', e => e.preventDefault());

// ── 难度按钮事件绑定 ──
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => setDiff(btn.dataset.diff));
});

// ── 开始/重来按钮事件绑定 ──
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('winRestartBtn').addEventListener('click', startGame);
document.getElementById('loseRestartBtn').addEventListener('click', startGame);

// ── 初始化显示 ──
document.getElementById('high').textContent = highScores[diff];
