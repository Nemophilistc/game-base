// ui.js — 棋盘渲染、棋子绘制、获胜线高亮、覆盖层

import { BOARD_SIZE, CELL_SIZE, PADDING, BOARD_PX, EMPTY, BLACK, WHITE } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = BOARD_PX;
        this.canvas.height = BOARD_PX;

        // 高 DPI 支持
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = BOARD_PX * dpr;
        this.canvas.height = BOARD_PX * dpr;
        this.canvas.style.width = BOARD_PX + 'px';
        this.canvas.style.height = BOARD_PX + 'px';
        this.ctx.scale(dpr, dpr);

        this.hoverPos = null;   // 悬停位置 {row, col}
        this.winLine = null;    // 获胜连线
    }

    // ------ 坐标转换 ------

    /** 像素坐标 → 棋盘坐标 */
    pxToBoard(px, py) {
        const col = Math.round((px - PADDING) / CELL_SIZE);
        const row = Math.round((py - PADDING) / CELL_SIZE);
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
        return { row, col };
    }

    /** 棋盘坐标 → 像素坐标 */
    boardToPx(row, col) {
        return {
            x: PADDING + col * CELL_SIZE,
            y: PADDING + row * CELL_SIZE,
        };
    }

    // ------ 绘制 ------

    /** 完整重绘 */
    draw(board, lastMove, winLine) {
        const ctx = this.ctx;
        this.winLine = winLine;

        // 木纹背景
        this._drawBoardBg(ctx);

        // 网格线
        this._drawGrid(ctx);

        // 星位（天元 + 四个星）
        this._drawStars(ctx);

        // 棋子
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] !== EMPTY) {
                    this._drawStone(ctx, r, c, board[r][c],
                        lastMove && lastMove.row === r && lastMove.col === c);
                }
            }
        }

        // 悬停预览
        if (this.hoverPos && board[this.hoverPos.row][this.hoverPos.col] === EMPTY) {
            this._drawHover(ctx, this.hoverPos.row, this.hoverPos.col);
        }

        // 获胜线
        if (winLine && winLine.length >= 2) {
            this._drawWinLine(ctx, winLine);
        }
    }

    // ------ 内部绘制方法 ------

    _drawBoardBg(ctx) {
        // 渐变木纹
        const grad = ctx.createLinearGradient(0, 0, BOARD_PX, BOARD_PX);
        grad.addColorStop(0, '#e8c878');
        grad.addColorStop(0.3, '#dcb560');
        grad.addColorStop(0.5, '#e2be6a');
        grad.addColorStop(0.7, '#d4a84a');
        grad.addColorStop(1, '#ddb85c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

        // 细微纹理
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < BOARD_PX; i += 3) {
            const offset = Math.sin(i * 0.05) * 4;
            ctx.fillStyle = i % 6 === 0 ? '#b08030' : '#c09040';
            ctx.fillRect(0, i + offset, BOARD_PX, 1);
        }
        ctx.globalAlpha = 1;

        // 边框阴影
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, BOARD_PX - 2, BOARD_PX - 2);
    }

    _drawGrid(ctx) {
        ctx.strokeStyle = '#5a3a10';
        ctx.lineWidth = 1;

        for (let i = 0; i < BOARD_SIZE; i++) {
            const pos = PADDING + i * CELL_SIZE;
            // 横线
            ctx.beginPath();
            ctx.moveTo(PADDING, pos);
            ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, pos);
            ctx.stroke();
            // 竖线
            ctx.beginPath();
            ctx.moveTo(pos, PADDING);
            ctx.lineTo(pos, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
            ctx.stroke();
        }
    }

    _drawStars(ctx) {
        const stars = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];
        ctx.fillStyle = '#5a3a10';
        for (const [r, c] of stars) {
            const { x, y } = this.boardToPx(r, c);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawStone(ctx, row, col, player, isLast) {
        const { x, y } = this.boardToPx(row, col);
        const r = CELL_SIZE * 0.43;

        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        if (player === BLACK) {
            // 黑棋渐变
            const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
            grad.addColorStop(0, '#606060');
            grad.addColorStop(0.5, '#303030');
            grad.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = grad;
        } else {
            // 白棋渐变
            const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.6, '#f0f0f0');
            grad.addColorStop(1, '#d0d0d0');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 最后一手标记 — 红色小圆点
        if (isLast) {
            ctx.fillStyle = '#e02020';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawHover(ctx, row, col) {
        const { x, y } = this.boardToPx(row, col);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(x, y, CELL_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    _drawWinLine(ctx, cells) {
        if (cells.length < 2) return;

        // 按行列排序连线
        const sorted = [...cells].sort((a, b) =>
            a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);

        const first = this.boardToPx(sorted[0][0], sorted[0][1]);
        const last = this.boardToPx(sorted[sorted.length - 1][0], sorted[sorted.length - 1][1]);

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.85)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        ctx.lineTo(last.x, last.y);
        ctx.stroke();

        // 高亮每个获胜棋子
        for (const [r, c] of cells) {
            const { x, y } = this.boardToPx(r, c);
            ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, CELL_SIZE * 0.45, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
