// DOM 渲染、菜单、覆盖层管理
import { CELL_SIZE, DIFF_NAMES } from './config.js';

/**
 * 渲染棋盘到 DOM
 */
export function renderBoard(state, onCellClick, onCellRightClick) {
    const board = document.getElementById('board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${state.cols}, ${CELL_SIZE}px)`;

    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            if (state.revealed[r][c]) {
                cell.classList.add('revealed');
                if (state.mineHit && state.mineHit.r === r && state.mineHit.c === c) {
                    cell.classList.add('mine-hit');
                } else if (state.grid[r][c] === -1) {
                    cell.classList.add('mine-show');
                }
                if (state.grid[r][c] === -1) {
                    cell.textContent = '💣';
                } else if (state.grid[r][c] > 0) {
                    cell.textContent = state.grid[r][c];
                    cell.classList.add('n' + state.grid[r][c]);
                }
            } else {
                cell.classList.add('hidden');
                if (state.flagged[r][c]) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }
            }

            cell.addEventListener('click', () => onCellClick(r, c));
            cell.addEventListener('contextmenu', e => { e.preventDefault(); onCellRightClick(r, c); });
            board.appendChild(cell);
        }
    }
}

/**
 * 更新信息栏
 */
export function updateInfoBar(minesLeft, elapsed, highScore) {
    document.getElementById('minesLeft').textContent = minesLeft;
    document.getElementById('timer').textContent = elapsed;
    document.getElementById('high').textContent = highScore;
}

/**
 * 隐藏所有覆盖层
 */
export function hideAllOverlays() {
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('winOverlay').classList.add('hidden');
    document.getElementById('loseOverlay').classList.add('hidden');
}

/**
 * 显示胜利覆盖层
 */
export function showWinOverlay(elapsed, diff) {
    const diffName = DIFF_NAMES[diff] || diff;
    document.getElementById('winStats').innerHTML = `时间: ${elapsed}秒<br>难度: ${diffName}`;
    document.getElementById('winOverlay').classList.remove('hidden');
}

/**
 * 显示失败覆盖层
 */
export function showLoseOverlay(elapsed) {
    document.getElementById('loseStats').innerHTML = `时间: ${elapsed}秒`;
    document.getElementById('loseOverlay').classList.remove('hidden');
}

/**
 * 设置难度按钮激活状态
 */
export function setActiveDiffBtn(diff) {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.diff-btn').forEach(b => {
        if (b.dataset.diff === diff) b.classList.add('active');
    });
}
