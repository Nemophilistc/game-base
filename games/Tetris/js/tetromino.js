// 方块模块：创建、旋转、碰撞检测
import { COLS, ROWS, PIECES, PIECE_NAMES, LOCK_DELAY } from './config.js';

/**
 * 创建新方块
 * @param {string|null} forceName - 强制指定方块名（用于hold）
 * @param {string|null} nextName  - 预览队列中的下一个方块名
 * @returns {{ name, shape, color, x, y }}
 */
export function createPiece(forceName, nextName) {
    const name = forceName || nextName || PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    const p = PIECES[name];
    return {
        name,
        shape: p.shape.map(r => [...r]),
        color: p.color,
        x: Math.floor((COLS - p.shape[0].length) / 2),
        y: 0
    };
}

/**
 * 随机获取下一个方块名
 */
export function randomPieceName() {
    return PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
}

/**
 * 顺时针旋转形状矩阵
 */
export function rotate(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const res = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            res[c][rows - 1 - r] = shape[r][c];
        }
    }
    return res;
}

/**
 * 碰撞检测：shape 在 (px, py) 是否合法
 * @param {number[][]} shape
 * @param {number} px
 * @param {number} py
 * @param {(number|string|null)[][]} board
 */
export function fits(shape, px, py, board) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (!shape[r][c]) continue;
            const nx = px + c;
            const ny = py + r;
            if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
            if (ny >= 0 && board[ny][nx]) return false;
        }
    }
    return true;
}

/**
 * 计算幽灵方块的 Y 坐标（硬降目标位置）
 */
export function getGhostY(piece, board) {
    let gy = piece.y;
    while (fits(piece.shape, piece.x, gy + 1, board)) {
        gy++;
    }
    return gy;
}
