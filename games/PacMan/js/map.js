import { CELL, ROWS, COLS } from './config.js';

export function drawMap(ctx, map) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * CELL, y = r * CELL;
            if (map[r][c] === 1) {
                ctx.fillStyle = '#1a237e';
                ctx.fillRect(x, y, CELL, CELL);
                ctx.strokeStyle = '#283593'; ctx.lineWidth = 1;
                ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
            } else if (map[r][c] === 2) {
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, 3, 0, Math.PI * 2); ctx.fill();
            } else if (map[r][c] === 3) {
                const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255,235,59,${pulse})`;
                ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, 7, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
}
