// grid.js — 网格逻辑（移动、合并、生成、撤销）
import { GRID_SIZE } from './config.js';

const N = GRID_SIZE;

/** 创建空网格 */
export function createGrid() {
    return Array.from({ length: N }, () => Array(N).fill(0));
}

/** 深拷贝网格 */
export function cloneGrid(g) {
    return g.map(r => [...r]);
}

/** 在空位随机生成 2（90%）或 4（10%），返回位置或 null */
export function addRandom(grid) {
    const empty = [];
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            if (grid[r][c] === 0) empty.push({ r, c });
    if (empty.length === 0) return null;
    const pos = empty[Math.floor(Math.random() * empty.length)];
    grid[pos.r][pos.c] = Math.random() < 0.9 ? 2 : 4;
    return pos;
}

/** 逆时针旋转 90 度 */
function rotate(g) {
    const res = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            res[N - 1 - c][r] = g[r][c];
    return res;
}

/** 顺时针旋转 90 度 */
function rotateCW(g) {
    const res = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            res[c][N - 1 - r] = g[r][c];
    return res;
}

/**
 * 执行一次移动
 * @param {number[][]} grid  当前网格
 * @param {string}     dir   'up'|'down'|'left'|'right'
 * @returns {{ grid, moved, scoreGain, mergedPositions, randomPos }}
 */
export function move(grid, dir) {
    let g = cloneGrid(grid);
    let scoreGain = 0;

    // 统一旋转到"向左合并"的方向，处理完再旋转回来
    // 'left': 不旋转  'right': 旋转180°  'up': 逆时针90°  'down': 顺时针90°
    if (dir === 'up') g = rotate(g);          // 逆时针90°
    else if (dir === 'down') g = rotateCW(g); // 顺时针90°
    else if (dir === 'right') { g = rotate(g); g = rotate(g); } // 180°

    for (let r = 0; r < N; r++) {
        let row = g[r].filter(v => v !== 0);
        for (let i = 0; i < row.length - 1; i++) {
            if (row[i] === row[i + 1]) {
                row[i] *= 2;
                scoreGain += row[i];
                row.splice(i + 1, 1);
            }
        }
        while (row.length < N) row.push(0);
        g[r] = row;
    }

    // 旋转回来
    if (dir === 'up') g = rotateCW(g);        // 顺时针90°（逆时针的逆）
    else if (dir === 'down') g = rotate(g);   // 逆时针90°（顺时针的逆）
    else if (dir === 'right') { g = rotate(g); g = rotate(g); } // 180°

    // 检测是否真的移动了
    let moved = false;
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            if (g[r][c] !== grid[r][c]) moved = true;

    if (!moved) return { grid, moved: false, scoreGain: 0, mergedPositions: [], randomPos: null };

    // 检测合并位置：变换前后都非零且值不同 → 合并（值翻倍）
    const mergedPositions = [];
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            if (g[r][c] !== 0 && grid[r][c] !== 0 && g[r][c] !== grid[r][c])
                mergedPositions.push({ r, c });

    const randomPos = addRandom(g);

    return { grid: g, moved: true, scoreGain, mergedPositions, randomPos };
}

/** 判断是否还能移动 */
export function canMove(grid) {
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
            if (grid[r][c] === 0) return true;
            if (c < N - 1 && grid[r][c] === grid[r][c + 1]) return true;
            if (r < N - 1 && grid[r][c] === grid[r + 1][c]) return true;
        }
    return false;
}

/** 检查网格中是否包含目标值 */
export function hasValue(grid, value) {
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            if (grid[r][c] === value) return true;
    return false;
}
