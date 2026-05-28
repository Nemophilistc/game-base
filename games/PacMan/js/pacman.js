import { CELL } from './config.js';

export function createPacman() {
    return { x: 9, y: 15, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouth: 0, mouthDir: 1, moveTimer: 0 };
}

export function resetPacman(pacman) {
    pacman.x = 9; pacman.y = 15;
    pacman.dir = { x: 0, y: 0 };
    pacman.nextDir = { x: 0, y: 0 };
    pacman.moveTimer = 0;
}

export function drawPacman(ctx, pacman) {
    const px = pacman.x * CELL + CELL / 2, py = pacman.y * CELL + CELL / 2;
    const angle = Math.atan2(pacman.dir.y, pacman.dir.x);
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(px, py, CELL / 2 - 2, angle + pacman.mouth, angle + Math.PI * 2 - pacman.mouth);
    ctx.lineTo(px, py);
    ctx.closePath(); ctx.fill();
}
