// UI 模块：HUD、绘图、预览
import { COLS, ROWS, CELL, PIECES } from './config.js';
import { getGhostY } from './tetromino.js';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

/**
 * 绘制单个格子（带立体效果）
 */
function drawCell(c, x, y, color) {
    c.fillStyle = color;
    c.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    c.fillStyle = 'rgba(255,255,255,0.15)';
    c.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, (CELL - 2) / 2);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(x * CELL + 1, y * CELL + (CELL / 2), CELL - 2, (CELL - 2) / 2);
}

/**
 * 绘制预览方块（next / hold）
 */
function drawPreview(pctx, pcanvas, name) {
    pctx.fillStyle = '#1a1a1a';
    pctx.fillRect(0, 0, pcanvas.width, pcanvas.height);
    if (!name) return;
    const p = PIECES[name];
    const s = p.shape;
    const cs = 16;
    const ox = (pcanvas.width - s[0].length * cs) / 2;
    const oy = (pcanvas.height - s.length * cs) / 2;
    s.forEach((row, r) => row.forEach((v, c) => {
        if (v) {
            pctx.fillStyle = p.color;
            pctx.fillRect(ox + c * cs, oy + r * cs, cs - 1, cs - 1);
            pctx.fillStyle = 'rgba(255,255,255,0.15)';
            pctx.fillRect(ox + c * cs, oy + r * cs, cs - 1, cs / 2);
        }
    }));
}

/**
 * 主绘制函数
 */
export function draw(state) {
    // 背景
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, canvas.height);
        ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(canvas.width, r * CELL);
        ctx.stroke();
    }

    // 已锁定方块
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (state.board[r][c]) drawCell(ctx, c, r, state.board[r][c]);
        }
    }

    // 消行动画：全屏闪烁（纯视觉效果，棋盘数据已同步更新）
    if (state.clearAnim) {
        const progress = Math.min(state.clearAnim.elapsed / 200, 1);
        const alpha = Math.sin(progress * Math.PI * 3) * 0.4 + 0.1;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
        ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    }

    // 幽灵方块
    if (state.current && state.gameActive) {
        const gy = getGhostY(state.current, state.board);
        state.current.shape.forEach((row, r) => row.forEach((v, c) => {
            if (v) {
                ctx.fillStyle = state.current.color + '30';
                ctx.fillRect((state.current.x + c) * CELL, (gy + r) * CELL, CELL, CELL);
                ctx.strokeStyle = state.current.color + '60';
                ctx.strokeRect((state.current.x + c) * CELL, (gy + r) * CELL, CELL, CELL);
            }
        }));
    }

    // 当前方块
    if (state.current && state.gameActive) {
        state.current.shape.forEach((row, r) => row.forEach((v, c) => {
            if (v) drawCell(ctx, state.current.x + c, state.current.y + r, state.current.color);
        }));
    }

    // 侧边预览
    drawPreview(nextCtx, nextCanvas, state.next);
    drawPreview(holdCtx, holdCanvas, state.hold);
}

/**
 * 更新 HUD 数值
 */
export function updateHUD(state) {
    document.getElementById('score').textContent = state.score;
    document.getElementById('level').textContent = state.level;
    document.getElementById('lines').textContent = state.lines;
    document.getElementById('high').textContent = Math.max(state.highScore, state.score);
}

/**
 * 初始化最高分显示
 */
export function initHUD(highScore) {
    document.getElementById('high').textContent = highScore;
}
