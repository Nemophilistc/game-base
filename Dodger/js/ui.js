// 躲避球 - Canvas渲染与HUD
import { W, H } from './config.js';

/**
 * 主绘制函数
 * === BUG FIX #1: player未定义时安全返回，防止startGame前crash ===
 */
export function draw(ctx, player, obstacles, energyOrbs, particles, shakeX, shakeY) {
    if (!player) return;

    ctx.save();
    ctx.translate((Math.random() - 0.5) * shakeX, (Math.random() - 0.5) * shakeY);

    // 背景
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);

    // 网格线
    ctx.strokeStyle = 'rgba(0,229,255,0.03)';
    for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // 能量球
    energyOrbs.forEach(e => {
        const pr = Math.sin(e.pulse) * 0.2 + 1;
        ctx.fillStyle = '#00ff9630';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * pr * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00ff96';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * pr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(e.x - 3, e.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    });

    // 障碍物
    obstacles.forEach(o => {
        ctx.fillStyle = o.color;
        if (o.type === 'homing') {
            ctx.beginPath();
            ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(o.x, o.y, o.w, o.h);
        }
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        if (o.type === 'homing') {
            ctx.beginPath();
            ctx.arc(o.x + o.w / 2 - 2, o.y + o.h / 2 - 2, o.w / 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(o.x, o.y, o.w, o.h / 2);
        }
    });

    // 玩家拖尾
    player.trail.forEach((t, i) => {
        const alpha = (i / player.trail.length) * 0.3;
        ctx.fillStyle = `rgba(0,229,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, player.r * (i / player.trail.length), 0, Math.PI * 2);
        ctx.fill();
    });

    // 玩家本体
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(player.x - 4, player.y - 4, player.r * 0.4, 0, Math.PI * 2); ctx.fill();

    // 粒子
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.restore();
}

/**
 * 更新HUD显示
 */
export function updateHUD(score, highScore, frameCount) {
    document.getElementById('score').textContent = score;
    document.getElementById('time').textContent = Math.floor(frameCount / 60) + 's';
    document.getElementById('high').textContent = Math.max(highScore, score);
}
