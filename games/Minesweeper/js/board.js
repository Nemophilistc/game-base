// 棋盘逻辑：生成地雷、flood-fill揭开、标记、胜负判断

/**
 * 创建空白棋盘状态
 * @returns {{ grid: number[][], revealed: boolean[][], flagged: boolean[][] }}
 */
export function createBoard(rows, cols) {
    const grid     = Array.from({ length: rows }, () => Array(cols).fill(0));
    const revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    const flagged  = Array.from({ length: rows }, () => Array(cols).fill(false));
    return { grid, revealed, flagged };
}

/**
 * 放置地雷并计算数字（首次点击安全区域保护）
 */
export function placeMines(grid, rows, cols, totalMines, safeR, safeC) {
    let placed = 0;
    while (placed < totalMines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (grid[r][c] === -1) continue;
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        grid[r][c] = -1;
        placed++;
    }
    // 计算每格周围地雷数
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === -1) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === -1) count++;
                }
            }
            grid[r][c] = count;
        }
    }
}

/**
 * flood-fill 揭开格子（递归）
 */
export function reveal(r, c, rows, cols, grid, revealed, flagged) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    if (grid[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                reveal(r + dr, c + dc, rows, cols, grid, revealed, flagged);
            }
        }
    }
}

/**
 * 左键点击处理
 * @returns {{ hit: boolean, gameActive: boolean }} hit=true 表示踩雷
 */
export function cellClick(r, c, state) {
    const { grid, revealed, flagged } = state;
    if (!state.gameActive || flagged[r][c] || revealed[r][c]) return { hit: false, gameActive: state.gameActive };

    if (state.firstClick) {
        state.firstClick = false;
        placeMines(grid, state.rows, state.cols, state.totalMines, r, c);
        state.gameStarted = true;
    }

    if (grid[r][c] === -1) {
        revealed[r][c] = true;
        state.mineHit = { r, c };
        state.gameActive = false;
        // 揭开所有地雷
        for (let rr = 0; rr < state.rows; rr++) {
            for (let cc = 0; cc < state.cols; cc++) {
                if (grid[rr][cc] === -1 && !flagged[rr][cc]) revealed[rr][cc] = true;
            }
        }
        return { hit: true, gameActive: false };
    }

    reveal(r, c, state.rows, state.cols, grid, revealed, flagged);
    return { hit: false, gameActive: state.gameActive };
}

/**
 * 右键标记/取消旗帜
 * @returns {number} 当前旗帜数
 */
export function cellRightClick(r, c, state) {
    const { revealed, flagged } = state;
    if (!state.gameActive || revealed[r][c]) return flagged.flat().filter(f => f).length;
    flagged[r][c] = !flagged[r][c];
    return flagged.flat().filter(f => f).length;
}

/**
 * 检查是否获胜
 * @returns {boolean}
 */
export function checkWin(state) {
    const { grid, revealed, flagged } = state;
    let unrevealed = 0;
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (!revealed[r][c]) unrevealed++;
        }
    }
    return unrevealed === state.totalMines;
}
