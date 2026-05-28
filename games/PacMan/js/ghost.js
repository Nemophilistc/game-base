import { CELL, ROWS, COLS } from './config.js';

const GHOST_COLORS = ['#f44336', '#ff69b4', '#00bcd4', '#ff9800'];
const GHOST_START = [
    { x: 9, y: 9 },
    { x: 8, y: 9 },
    { x: 10, y: 9 },
    { x: 9, y: 8 }
];

export function createGhosts() {
    return GHOST_COLORS.map((color, i) => ({
        x: GHOST_START[i].x,
        y: GHOST_START[i].y,
        color,
        dir: { x: (i % 2 === 0) ? 1 : -1, y: 0 },
        mode: 'chase',
        frightened: 0,
        eyeDir: { x: 0, y: -1 }
    }));
}

export function resetGhost(g) {
    g.x = 9; g.y = 9; g.frightened = 0;
}

export function moveGhosts(ghosts, pacman, canMove) {
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

    ghosts.forEach(g => {
        const possible = [];
        const reverse = { x: -g.dir.x, y: -g.dir.y };

        for (const d of dirs) {
            if (d.x === reverse.x && d.y === reverse.y) continue;
            const nx = g.x + d.x, ny = g.y + d.y;
            if (canMove(nx, ny)) possible.push(d);
        }
        if (possible.length === 0) {
            for (const d of dirs) {
                const nx = g.x + d.x, ny = g.y + d.y;
                if (canMove(nx, ny)) possible.push(d);
            }
        }
        if (possible.length === 0) return;

        let chosen;
        if (g.frightened > 0) {
            chosen = possible[Math.floor(Math.random() * possible.length)];
        } else {
            let best = Infinity;
            for (const d of possible) {
                const nx = g.x + d.x, ny = g.y + d.y;
                const dist = (nx - pacman.x) ** 2 + (ny - pacman.y) ** 2;
                if (dist < best) { best = dist; chosen = d; }
            }
        }
        g.dir = chosen;
        g.eyeDir = chosen;
        g.x += g.dir.x; g.y += g.dir.y;

        // Wrap (tunnel)
        if (g.x < 0) g.x = COLS - 1;
        if (g.x >= COLS) g.x = 0;
    });
}

export function drawGhosts(ctx, ghosts) {
    ghosts.forEach(g => {
        const gx = g.x * CELL + CELL / 2, gy = g.y * CELL + CELL / 2;
        if (g.frightened > 0) {
            ctx.fillStyle = g.frightened < 60 && g.frightened % 10 < 5 ? '#fff' : '#2196f3';
        } else {
            ctx.fillStyle = g.color;
        }
        // Ghost body
        ctx.beginPath();
        ctx.arc(gx, gy - 4, CELL / 2 - 2, Math.PI, 0);
        ctx.lineTo(gx + CELL / 2 - 2, gy + CELL / 2 - 2);
        // Wavy bottom
        for (let i = 0; i < 3; i++) {
            const wx = gx + CELL / 2 - 2 - i * (CELL - 4) / 3;
            ctx.lineTo(wx - (CELL - 4) / 6, gy + CELL / 2 - 6);
            ctx.lineTo(wx - (CELL - 4) / 3, gy + CELL / 2 - 2);
        }
        ctx.closePath(); ctx.fill();

        // Eyes
        if (g.frightened <= 0) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(gx - 5, gy - 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(gx + 5, gy - 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#00f';
            ctx.beginPath(); ctx.arc(gx - 5 + g.eyeDir.x * 2, gy - 5 + g.eyeDir.y * 2, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(gx + 5 + g.eyeDir.x * 2, gy - 5 + g.eyeDir.y * 2, 2, 0, Math.PI * 2); ctx.fill();
        }
    });
}
