// Flappy Bird - HUD、菜单、昼夜背景绘制
import { W, H, GROUND_H } from './config.js';
import { getPipeSpeed } from './pipes.js';

let groundX = 0;

export function updateGroundX(score) {
    const sp = getPipeSpeed(score);
    groundX = ((groundX - sp) % 20 + 20) % 20;
}

export function updateHUD(score, highScore) {
    document.getElementById('score').textContent = score;
    document.getElementById('high').textContent = Math.max(highScore, score);
}

export function showGameOver(score, highScore) {
    document.getElementById('goStats').innerHTML = `分数: ${score}<br>最高: ${highScore}`;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

export function hideOverlays() {
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
}

// ---- Canvas 绘制 ----

export function drawSky(ctx, dayNight) {
    const skyR = Math.floor(135 * dayNight + 20 * (1 - dayNight));
    const skyG = Math.floor(206 * dayNight + 20 * (1 - dayNight));
    const skyB = Math.floor(235 * dayNight + 60 * (1 - dayNight));
    ctx.fillStyle = `rgb(${skyR},${skyG},${skyB})`;
    ctx.fillRect(0, 0, W, H);
}

export function drawStars(ctx, dayNight, frameCount) {
    if (dayNight >= 0.5) return;
    ctx.fillStyle = `rgba(255,255,255,${(1 - dayNight * 2) * 0.6})`;
    for (let i = 0; i < 20; i++) {
        const sx = (i * 97 + frameCount * 0.1) % W;
        const sy = (i * 131) % 300;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawClouds(ctx, dayNight, frameCount) {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + dayNight * 0.2})`;
    for (let i = 0; i < 3; i++) {
        const cx = ((i * 200 + frameCount * 0.3) % (W + 100)) - 50;
        const cy = 80 + i * 60;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 20, cy - 5, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - 15, cy + 3, 12, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawGround(ctx) {
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(0, H - GROUND_H, W, 8);
    ctx.fillStyle = '#4caf50';
    for (let i = -1; i < W / 20 + 2; i++) {
        ctx.fillRect(i * 20 + groundX, H - GROUND_H, 10, 5);
    }
}

export function drawParticles(ctx, particles) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

export function drawScore(ctx, score) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeText(score, W / 2, 70);
    ctx.fillText(score, W / 2, 70);
}
