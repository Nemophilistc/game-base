// DOM 棋盘渲染模块
import { BOARD_SIZE, BOX_SIZE } from './config.js';

/**
 * 渲染棋盘
 * @param {Object} opts
 * @param {number[][]} opts.board - 当前棋盘
 * @param {boolean[][]} opts.given - 已知格子标记
 * @param {number[][]} opts.solution - 完整解
 * @param {number} opts.selectedRow - 选中行 (-1 表示未选中)
 * @param {number} opts.selectedCol - 选中列 (-1 表示未选中)
 * @param {Set<string>} [opts.errorCells] - 错误格子集合 "r,c"
 */
export function render({ board, given, solution, selectedRow, selectedCol, errorCells }) {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            // 3x3 宫格粗边框
            if (c === 2 || c === 5) cell.classList.add('border-right');
            if (r === 2 || r === 5) cell.classList.add('border-bottom');

            // 格子类型样式
            if (given[r][c]) {
                cell.classList.add('given');
            } else if (board[r][c] !== 0) {
                cell.classList.add('user');
                if (board[r][c] !== solution[r][c]) cell.classList.add('error');
            }

            // 检查错误高亮（checkErrors 标记的）
            if (errorCells && errorCells.has(r + ',' + c)) {
                cell.classList.add('error');
            }

            // 选中与同行/列/宫高亮
            if (r === selectedRow && c === selectedCol) {
                cell.classList.add('selected');
            } else if (selectedRow >= 0 && (
                r === selectedRow ||
                c === selectedCol ||
                (Math.floor(r / BOX_SIZE) === Math.floor(selectedRow / BOX_SIZE) &&
                 Math.floor(c / BOX_SIZE) === Math.floor(selectedCol / BOX_SIZE))
            )) {
                cell.classList.add('highlight');
            }

            if (board[r][c] !== 0) cell.textContent = board[r][c];
            boardEl.appendChild(cell);
        }
    }
}
