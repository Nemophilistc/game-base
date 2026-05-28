// ui.js — 渲染、动画、HUD
import { GRID_SIZE, STORAGE_KEY } from './config.js';

const N = GRID_SIZE;

/** 渲染棋盘 */
export function renderBoard(grid, randomPos, mergedPositions) {
    const board = document.getElementById('board');
    board.innerHTML = '';

    const mergedSet = new Set(mergedPositions.map(p => p.r * N + p.c));

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (grid[r][c] !== 0) {
                cell.textContent = grid[r][c];
                cell.dataset.value = grid[r][c];
                if (randomPos && randomPos.r === r && randomPos.c === c) {
                    cell.classList.add('new');
                }
                // Bug fix: 为合并的格子添加 merged 类
                if (mergedSet.has(r * N + c)) {
                    cell.classList.add('merged');
                }
            }
            board.appendChild(cell);
        }
    }
}

/** 更新分数显示 */
export function updateScore(score, highScore) {
    document.getElementById('score').textContent = score;
    document.getElementById('high').textContent = highScore;
    localStorage.setItem(STORAGE_KEY, highScore);
}

/** 更新撤销按钮 UI */
export function updateUndoUI(undos) {
    document.getElementById('undoCount').textContent = undos;
    document.getElementById('undoBtn').disabled = undos <= 0;
}

/** 显示胜利遮罩 */
export function showWin() {
    document.getElementById('overlayText').textContent = '🎉 2048!';
    document.getElementById('overlayText').style.color = '#4caf50';
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('continueBtn').classList.remove('hidden');
    document.getElementById('overlayMainBtn').textContent = '再来一局';
}

/** 显示失败遮罩 */
export function showGameOver() {
    document.getElementById('overlayText').textContent = '游戏结束';
    document.getElementById('overlayText').style.color = '#f44336';
    document.getElementById('continueBtn').classList.add('hidden');
    document.getElementById('overlayMainBtn').textContent = '再来一局';
    document.getElementById('overlay').classList.remove('hidden');
}

/** 隐藏遮罩 */
export function hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('continueBtn').classList.add('hidden');
}
