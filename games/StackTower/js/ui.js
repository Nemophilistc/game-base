// ui.js - Canvas rendering and HUD updates
import { W, H, BLOCK_H } from './config.js';
import { state } from './blocks.js';

let ctx = null;

export function initCanvas(canvas) {
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
}

export function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    for (let y = 0; y < H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    // Stacked blocks
    state.blocks.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, BLOCK_H);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(b.x, b.y, b.w, BLOCK_H / 2);
    });

    // Current moving block (only when game is active)
    if (state.gameActive) {
        ctx.fillStyle = state.current.color;
        ctx.fillRect(state.current.x, state.current.y, state.current.w, BLOCK_H);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(state.current.x, state.current.y, state.current.w, BLOCK_H / 2);

        // Perfect combo glow indicator
        if (state.perfectCombo > 0) {
            ctx.fillStyle = 'rgba(255,215,0,0.2)';
            ctx.fillRect(state.current.x, state.current.y, state.current.w, BLOCK_H);
        }
    }

    // Falling pieces
    ctx.globalAlpha = 0.6;
    state.falling.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x, f.y, f.w, BLOCK_H);
    });
    ctx.globalAlpha = 1;

    // Particles
    state.particles.forEach(p => {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Perfect combo text
    if (state.perfectCombo > 1 && state.gameActive) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Perfect x' + state.perfectCombo, W / 2, state.current.y - 15);
    }
}

export function updateHUD() {
    document.getElementById('score').textContent = state.score;
    document.getElementById('layers').textContent = state.blocks.length - 1;
    document.getElementById('high').textContent = Math.max(state.highScore, state.score);
}
