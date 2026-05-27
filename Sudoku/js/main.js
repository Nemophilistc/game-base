// 数独游戏主模块
import { DEFAULT_DIFF_GIVENS } from './config.js';
import { Sound } from './sound.js';
import { generateSudoku } from './generator.js';
import { render } from './ui.js';

// ── 游戏状态 ──
let solution, board, given;
let errors, selectedRow, selectedCol;
let hintsRemaining, timerInterval, elapsed;
let diffGivens;
let gameActive; // Bug fix: 显式声明 gameActive

// ── 辅助：重新渲染 ──
function refresh(errorCells) {
    render({ board, given, solution, selectedRow, selectedCol, errorCells });
}

// ── 难度选择 ──
function setDiff(g, el) {
    diffGivens = g;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
}

// ── 新游戏 ──
function newGame() {
    Sound.init();
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('winOverlay').classList.add('hidden');

    const puzzle = generateSudoku(diffGivens);
    solution = puzzle.solution;
    board = puzzle.board;
    given = puzzle.given;

    errors = 0;
    hintsRemaining = 3;
    elapsed = 0;
    selectedRow = -1;
    selectedCol = -1;
    gameActive = true; // Bug fix: 初始化 gameActive

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsed++;
        const m = Math.floor(elapsed / 60), s = elapsed % 60;
        document.getElementById('timer').textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }, 1000);

    document.getElementById('errors').textContent = '0';
    document.getElementById('hints').textContent = '3';
    refresh();
}

// ── 选中格子 ──
function selectCell(r, c) {
    selectedRow = r;
    selectedCol = c;
    refresh();
}

// ── 输入数字 ──
function inputNum(n) {
    if (!gameActive) return; // Bug fix: 游戏结束后禁止输入
    if (selectedRow < 0 || selectedCol < 0) return;
    if (given[selectedRow][selectedCol]) return;

    if (n === 0) {
        board[selectedRow][selectedCol] = 0;
        Sound.play('place');
        refresh();
        return;
    }

    board[selectedRow][selectedCol] = n;

    if (n !== solution[selectedRow][selectedCol]) {
        errors++;
        document.getElementById('errors').textContent = errors;
        Sound.play('error');
    } else {
        Sound.play('place');
    }

    refresh();
    checkWin();
}

// ── 提示 ──
function useHint() {
    if (!gameActive) return;
    if (hintsRemaining <= 0) return;

    const empty = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0 || board[r][c] !== solution[r][c]) empty.push({ r, c });
        }
    }
    if (empty.length === 0) return;

    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = solution[r][c];
    hintsRemaining--;
    document.getElementById('hints').textContent = hintsRemaining;
    Sound.play('hint');
    selectedRow = r;
    selectedCol = c;
    refresh();
    checkWin();
}

// ── 检查错误（Bug fix: 实现实际的错误检查逻辑）──
function checkErrors() {
    if (!gameActive) return;

    const errorCells = new Set();
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (!given[r][c] && board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
                errorCells.add(r + ',' + c);
            }
        }
    }

    // 重新渲染，高亮错误格子
    refresh(errorCells);

    // 若无错误且棋盘已满，检查是否胜利
    if (errorCells.size === 0 && board.flat().every(v => v !== 0)) {
        checkWin();
    }
}

// ── 胜利检测 ──
function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== solution[r][c]) return;
        }
    }

    // 胜利！
    gameActive = false;
    clearInterval(timerInterval);
    Sound.play('win');

    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    const diffName = diffGivens >= 38 ? '简单' : diffGivens >= 30 ? '中等' : '困难';

    setTimeout(() => {
        document.getElementById('winStats').innerHTML =
            `时间: ${m}:${s < 10 ? '0' : ''}${s}<br>错误: ${errors}<br>难度: ${diffName}`;
        document.getElementById('winOverlay').classList.remove('hidden');
    }, 300);
}

// ── 绑定事件 ──
function bindEvents() {
    // 数字按钮
    for (let i = 1; i <= 9; i++) {
        const btn = document.querySelector(`.num-btn[data-num="${i}"]`);
        if (btn) btn.addEventListener('click', () => inputNum(i));
    }
    const clearBtn = document.querySelector('.num-btn[data-num="0"]');
    if (clearBtn) clearBtn.addEventListener('click', () => inputNum(0));

    // 操作按钮
    const hintBtn = document.getElementById('btnHint');
    if (hintBtn) hintBtn.addEventListener('click', useHint);
    const checkBtn = document.getElementById('btnCheck');
    if (checkBtn) checkBtn.addEventListener('click', checkErrors);
    const restartBtn = document.getElementById('btnRestart');
    if (restartBtn) restartBtn.addEventListener('click', newGame);

    // 难度按钮
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            setDiff(parseInt(this.dataset.givens), this);
        });
    });

    // 开始按钮
    const startBtn = document.getElementById('btnStart');
    if (startBtn) startBtn.addEventListener('click', newGame);

    // 再来一局
    const winBtn = document.getElementById('btnWinRestart');
    if (winBtn) winBtn.addEventListener('click', newGame);

    // 棋盘格子点击（事件委托）
    document.getElementById('board').addEventListener('click', (e) => {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const cells = Array.from(document.getElementById('board').children);
        const idx = cells.indexOf(cell);
        if (idx < 0) return;
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        selectCell(r, c);
    });

    // 键盘快捷键
    window.addEventListener('keydown', e => {
        if (e.code === 'KeyR') { e.preventDefault(); newGame(); return; }
        if (e.code === 'KeyH') { e.preventDefault(); useHint(); return; }
        const n = parseInt(e.key);
        if (n >= 1 && n <= 9) { e.preventDefault(); inputNum(n); return; }
        if (e.code === 'Backspace' || e.code === 'Delete') { e.preventDefault(); inputNum(0); return; }
        if (e.code === 'ArrowUp' && selectedRow > 0) { selectedRow--; refresh(); e.preventDefault(); }
        if (e.code === 'ArrowDown' && selectedRow < 8) { selectedRow++; refresh(); e.preventDefault(); }
        if (e.code === 'ArrowLeft' && selectedCol > 0) { selectedCol--; refresh(); e.preventDefault(); }
        if (e.code === 'ArrowRight' && selectedCol < 8) { selectedCol++; refresh(); e.preventDefault(); }
    });
}

// ── 初始化 ──
diffGivens = DEFAULT_DIFF_GIVENS;
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
});
