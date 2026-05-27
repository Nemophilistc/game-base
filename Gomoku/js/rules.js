// rules.js — 五子棋规则引擎

import { BOARD_SIZE, WIN_COUNT, EMPTY, BLACK, WHITE } from './config.js';

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]]; // 横 竖 右下 右上

/**
 * 检测某一方是否获胜
 * @returns {Array|null} 获胜的五子坐标数组，或 null
 */
export function checkWin(board, row, col, player) {
    for (const [dr, dc] of DIRS) {
        const cells = [[row, col]];
        // 正方向
        for (let i = 1; i < WIN_COUNT; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
            if (board[r][c] !== player) break;
            cells.push([r, c]);
        }
        // 反方向
        for (let i = 1; i < WIN_COUNT; i++) {
            const r = row - dr * i, c = col - dc * i;
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
            if (board[r][c] !== player) break;
            cells.push([r, c]);
        }
        if (cells.length >= WIN_COUNT) return cells;
    }
    return null;
}

/**
 * 检查位置是否合法
 */
export function isValidMove(board, row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
        && board[row][col] === EMPTY;
}

/**
 * 检查棋盘是否已满（平局）
 */
export function isBoardFull(board) {
    for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++)
            if (board[r][c] === EMPTY) return false;
    return true;
}
