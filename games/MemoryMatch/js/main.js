// js/main.js - 游戏初始化、事件监听

import { Sound } from './sound.js';
import {
    getGridCols, getCards, getFlipped, getMatched,
    getMoves, getTotalPairs,
    setDifficulty, loadBestScores, initGame, onCardClick
} from './cards.js';
import {
    renderBoard, updateInfo, updateTimer,
    hideOverlays, showWinOverlay, setActiveDiffBtn
} from './ui.js';

// 渲染当前游戏状态
function render() {
    renderBoard(getCards(), getFlipped(), getMatched(), getGridCols(), handleCardClick);
}

// 翻牌点击处理
function handleCardClick(idx) {
    onCardClick(idx, {
        onFlip() { Sound.play('flip'); },
        onUpdateUI() {
            const m = getMatched();
            const matchCount = m.filter(v => v).length / 2;
            updateInfo(getMoves(), matchCount, getTotalPairs());
            render();
        },
        onMatch(matchCount) { Sound.play('match'); },
        onMismatch() { Sound.play('mismatch'); },
        onWin(moves, elapsed, best) {
            Sound.play('win');
            showWinOverlay(moves, elapsed, best);
        }
    });
}

// 开始新游戏
function startGame() {
    Sound.init();
    hideOverlays();
    initGame({
        onTimerTick(elapsed) { updateTimer(elapsed); }
    });
    updateInfo(0, 0, getTotalPairs());
    updateTimer(0);
    render();
}

// 设置难度
function setDiff(cols, rows, el) {
    setDifficulty(cols, rows);
    setActiveDiffBtn(el);
}

// 初始化
loadBestScores();

// 难度按钮事件
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const c = parseInt(this.dataset.cols);
        const r = parseInt(this.dataset.rows);
        setDiff(c, r, this);
    });
});

// 开始/重来按钮事件
document.getElementById('btnStart').addEventListener('click', startGame);
document.getElementById('btnRestart').addEventListener('click', startGame);
document.getElementById('btnAgain').addEventListener('click', startGame);

// 键盘快捷键
window.addEventListener('keydown', e => {
    if (e.code === 'KeyR') { e.preventDefault(); startGame(); }
});
