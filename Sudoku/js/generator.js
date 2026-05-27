// 数独生成器模块：生成完整解 + 挖洞
import { BOARD_SIZE, BOX_SIZE } from './config.js';

function isValid(board, r, c, n) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (board[r][i] === n) return false;
        if (board[i][c] === n) return false;
    }
    const br = Math.floor(r / BOX_SIZE) * BOX_SIZE;
    const bc = Math.floor(c / BOX_SIZE) * BOX_SIZE;
    for (let i = br; i < br + BOX_SIZE; i++) {
        for (let j = bc; j < bc + BOX_SIZE; j++) {
            if (board[i][j] === n) return false;
        }
    }
    return true;
}

function solve(board) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                for (let i = nums.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [nums[i], nums[j]] = [nums[j], nums[i]];
                }
                for (const n of nums) {
                    if (isValid(board, r, c, n)) {
                        board[r][c] = n;
                        if (solve(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

/**
 * 生成数独谜题
 * @param {number} diffGivens - 保留的已知格子数（越大越简单）
 * @returns {{ solution: number[][], board: number[][], given: boolean[][] }}
 */
export function generateSudoku(diffGivens) {
    const solution = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    solve(solution);

    const board = solution.map(r => [...r]);
    const given = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

    // 随机打乱所有格子坐标
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) cells.push({ r, c });
    }
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // 挖洞
    let removed = 0;
    const toRemove = BOARD_SIZE * BOARD_SIZE - diffGivens;
    for (const { r, c } of cells) {
        if (removed >= toRemove) break;
        board[r][c] = 0;
        removed++;
    }

    // 标记已知格子
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) given[r][c] = true;
        }
    }

    return { solution, board, given };
}
