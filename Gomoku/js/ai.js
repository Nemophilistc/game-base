// ai.js — AI 对弈引擎（评估函数 + minimax + alpha-beta 剪枝）

import { BOARD_SIZE, EMPTY, BLACK, WHITE, SCORE, DIFFICULTY } from './config.js';
import { checkWin, isValidMove } from './rules.js';

// ---------- 棋型匹配 ----------

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

/**
 * 沿某方向统计连续同色及两端空位
 * 返回 {count, openEnds}  count=连续数 openEnds=两端开放数(0/1/2)
 */
function countLine(grid, row, col, dr, dc, player) {
    let count = 1;
    let openEnds = 0;

    // 正方向
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === player) {
        count++;
        r += dr;
        c += dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === EMPTY)
        openEnds++;

    // 反方向
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === player) {
        count++;
        r -= dr;
        c -= dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === EMPTY)
        openEnds++;

    return { count, openEnds };
}

/**
 * 对某个位置给某方打分（用于评估函数）
 */
function evaluatePoint(grid, row, col, player) {
    let total = 0;
    for (const [dr, dc] of DIRS) {
        const { count, openEnds } = countLine(grid, row, col, dr, dc, player);
        if (count >= 5) total += SCORE.FIVE;
        else if (count === 4) {
            if (openEnds === 2) total += SCORE.LIVE_FOUR;
            else if (openEnds === 1) total += SCORE.RUSH_FOUR;
        } else if (count === 3) {
            if (openEnds === 2) total += SCORE.LIVE_THREE;
            else if (openEnds === 1) total += SCORE.SLEEP_THREE;
        } else if (count === 2) {
            if (openEnds === 2) total += SCORE.LIVE_TWO;
            else if (openEnds === 1) total += SCORE.SLEEP_TWO;
        }
    }
    return total;
}

// ---------- 全局评估 ----------

function evaluateBoard(grid, aiColor) {
    const humanColor = aiColor === BLACK ? WHITE : BLACK;
    let aiScore = 0, humanScore = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (grid[r][c] === aiColor) {
                aiScore += evaluatePoint(grid, r, c, aiColor);
            } else if (grid[r][c] === humanColor) {
                humanScore += evaluatePoint(grid, r, c, humanColor);
            }
        }
    }
    return aiScore - humanScore * 1.1; // 稍微偏重防守
}

// ---------- 候选点生成 ----------

function getCandidates(grid, range = 2) {
    const set = new Set();
    let hasStone = false;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (grid[r][c] !== EMPTY) {
                hasStone = true;
                for (let dr = -range; dr <= range; dr++) {
                    for (let dc = -range; dc <= range; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE
                            && grid[nr][nc] === EMPTY) {
                            set.add(nr * BOARD_SIZE + nc);
                        }
                    }
                }
            }
        }
    }

    // 棋盘为空时返回中心
    if (!hasStone) {
        const mid = Math.floor(BOARD_SIZE / 2);
        return [{ row: mid, col: mid }];
    }

    return [...set].map(v => ({ row: Math.floor(v / BOARD_SIZE), col: v % BOARD_SIZE }));
}

// ---------- 候选点快速评分（用于排序） ----------

function scoreCandidate(grid, row, col, aiColor) {
    const humanColor = aiColor === BLACK ? WHITE : BLACK;
    grid[row][col] = aiColor;
    const atk = evaluatePoint(grid, row, col, aiColor);
    grid[row][col] = humanColor;
    const def = evaluatePoint(grid, row, col, humanColor);
    grid[row][col] = EMPTY;
    return atk + def;
}

// ---------- Minimax + Alpha-Beta ----------

function minimax(grid, depth, alpha, beta, isMaximizing, aiColor) {
    // 检查是否有人赢了
    // 快速检查：只检查最后一步周围
    const winner = quickWinCheck(grid, aiColor);
    if (winner === aiColor) return SCORE.FIVE * 10;
    if (winner !== null) return -SCORE.FIVE * 10;

    if (depth === 0) return evaluateBoard(grid, aiColor);

    const currentColor = isMaximizing ? aiColor : (aiColor === BLACK ? WHITE : BLACK);
    const candidates = getCandidates(grid);

    if (candidates.length === 0) return 0;

    // 排序候选点以提高剪枝效率
    const scored = candidates.map(p => ({
        ...p,
        s: scoreCandidate(grid, p.row, p.col, aiColor)
    }));
    scored.sort((a, b) => b.s - a.s);

    // 限制候选点数量防止过慢
    const limit = depth >= 4 ? 15 : 20;
    const top = scored.slice(0, limit);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const { row, col } of top) {
            grid[row][col] = currentColor;
            const ev = minimax(grid, depth - 1, alpha, beta, false, aiColor);
            grid[row][col] = EMPTY;
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const { row, col } of top) {
            grid[row][col] = currentColor;
            const ev = minimax(grid, depth - 1, alpha, beta, true, aiColor);
            grid[row][col] = EMPTY;
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

/** 快速检查是否有人获胜（只看有棋子的地方） */
function quickWinCheck(grid, aiColor) {
    const humanColor = aiColor === BLACK ? WHITE : BLACK;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (grid[r][c] !== EMPTY) {
                const w = checkWin(grid, r, c, grid[r][c]);
                if (w) return grid[r][c];
            }
        }
    }
    return null;
}

// ---------- 公共 API ----------

/**
 * AI 计算最佳落子位置
 * @param {Board} board 棋盘对象
 * @param {number} aiColor AI 的颜色
 * @param {string} difficulty 难度 'easy'|'medium'|'hard'
 * @returns {{row: number, col: number}}
 */
export function getAIMove(board, aiColor, difficulty = 'medium') {
    const depth = DIFFICULTY[difficulty] || DIFFICULTY.medium;
    const grid = board.grid;

    // 第一步下中心附近
    if (board.moveCount === 0) {
        const mid = Math.floor(BOARD_SIZE / 2);
        return { row: mid, col: mid };
    }
    if (board.moveCount === 1) {
        const mid = Math.floor(BOARD_SIZE / 2);
        if (grid[mid][mid] !== EMPTY) {
            // 随机偏移一格
            const offsets = [[0, 1], [1, 0], [1, 1], [-1, 1]];
            const [dr, dc] = offsets[Math.floor(Math.random() * offsets.length)];
            return { row: mid + dr, col: mid + dc };
        }
        return { row: mid, col: mid };
    }

    const candidates = getCandidates(grid);
    const scored = candidates.map(p => ({
        ...p,
        s: scoreCandidate(grid, p.row, p.col, aiColor)
    }));
    scored.sort((a, b) => b.s - a.s);

    // 检查是否有直接获胜的点
    const humanColor = aiColor === BLACK ? WHITE : BLACK;
    for (const { row, col } of scored) {
        grid[row][col] = aiColor;
        if (checkWin(grid, row, col, aiColor)) {
            grid[row][col] = EMPTY;
            return { row, col };
        }
        grid[row][col] = EMPTY;
    }

    // 检查是否需要阻止对手获胜
    for (const { row, col } of scored) {
        grid[row][col] = humanColor;
        if (checkWin(grid, row, col, humanColor)) {
            grid[row][col] = EMPTY;
            return { row, col };
        }
        grid[row][col] = EMPTY;
    }

    // Minimax 搜索
    let bestMove = scored[0];
    let bestScore = -Infinity;

    const limit = depth >= 4 ? 12 : 15;
    const top = scored.slice(0, limit);

    for (const { row, col } of top) {
        grid[row][col] = aiColor;
        const score = minimax(grid, depth - 1, -Infinity, Infinity, false, aiColor);
        grid[row][col] = EMPTY;

        if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
        }
    }

    return bestMove;
}
