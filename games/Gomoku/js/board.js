// board.js — 棋盘状态管理

import { BOARD_SIZE, EMPTY, BLACK, WHITE } from './config.js';

export class Board {
    constructor() {
        this.reset();
    }

    reset() {
        // 15×15 网格，EMPTY=0
        this.grid = Array.from({ length: BOARD_SIZE }, () =>
            new Array(BOARD_SIZE).fill(EMPTY));
        this.history = [];   // [{row, col, player}, ...]
        this.current = BLACK; // 黑先
    }

    /** 落子 */
    place(row, col, player) {
        if (this.grid[row][col] !== EMPTY) return false;
        this.grid[row][col] = player;
        this.history.push({ row, col, player });
        this.current = player === BLACK ? WHITE : BLACK;
        return true;
    }

    /** 悔棋（撤回最近一步） */
    undo() {
        if (this.history.length === 0) return null;
        const last = this.history.pop();
        this.grid[last.row][last.col] = EMPTY;
        this.current = last.player;
        return last;
    }

    /** 获取某位置的棋子 */
    get(row, col) {
        return this.grid[row][col];
    }

    /** 是否为空位 */
    isEmpty(row, col) {
        return this.grid[row][col] === EMPTY;
    }

    /** 步数 */
    get moveCount() {
        return this.history.length;
    }

    /** 最后一手 */
    get lastMove() {
        return this.history.length > 0 ? this.history[this.history.length - 1] : null;
    }

    /** 克隆（供 AI 搜索使用） */
    clone() {
        const b = new Board();
        b.grid = this.grid.map(row => [...row]);
        b.history = [...this.history];
        b.current = this.current;
        return b;
    }
}
