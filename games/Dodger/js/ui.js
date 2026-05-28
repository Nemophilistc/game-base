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
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const hw = o.w / 2;
        const hh = o.h / 2;

        if (o.type === 'normal') {
            // 普通：红色尖刺球
            ctx.fillStyle = o.color;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = Math.PI / 4 * i + Date.now() * 0.002;
                const r = i % 2 === 0 ? hw : hw * 0.65;
                ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            ctx.closePath(); ctx.fill();
            // 核心
            ctx.fillStyle = '#ff8a80';
            ctx.beginPath(); ctx.arc(cx, cy, hw * 0.4, 0, Math.PI * 2); ctx.fill();
            // 眼睛
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx - 3, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 3, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 4, cy - 2, 1.2, 0, Math.PI * 2); ctx.fill();
        } else if (o.type === 'fast') {
            // 快速：橙色箭头形
            ctx.fillStyle = o.color;
            ctx.beginPath();
            ctx.moveTo(cx, cy - hh);
            ctx.lineTo(cx + hw, cy + hh * 0.3);
            ctx.lineTo(cx + hw * 0.3, cy + hh * 0.3);
            ctx.lineTo(cx + hw * 0.3, cy + hh);
            ctx.lineTo(cx - hw * 0.3, cy + hh);
            ctx.lineTo(cx - hw * 0.3, cy + hh * 0.3);
            ctx.lineTo(cx - hw, cy + hh * 0.3);
            ctx.closePath(); ctx.fill();
            // 速度线
            ctx.strokeStyle = 'rgba(255,152,0,0.4)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const ly = cy + hh + 3 + i * 4;
                ctx.beginPath(); ctx.moveTo(cx - 4 + i * 2, ly); ctx.lineTo(cx + 4 - i * 2, ly); ctx.stroke();
            }
            // 眼睛
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx - 2, cy - hh * 0.2, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 2, cy - hh * 0.2, 2, 0, Math.PI * 2); ctx.fill();
        } else if (o.type === 'wide') {
            // 宽型：紫色横条+铆钉
            ctx.fillStyle = o.color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(o.x, o.y, o.w, o.h, 4);
            else ctx.rect(o.x, o.y, o.w, o.h);
            ctx.fill();
            // 铆钉
            ctx.fillStyle = '#ce93d8';
            ctx.beginPath(); ctx.arc(o.x + 5, cy, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(o.x + o.w - 5, cy, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
            // 警告标记
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
            ctx.fillText('⚠', cx, cy + 3);
        } else if (o.type === 'homing') {
            // 追踪：红色机械眼
            ctx.fillStyle = '#f44336';
            ctx.beginPath(); ctx.arc(cx, cy, hw, 0, Math.PI * 2); ctx.fill();
            // 外环
            ctx.strokeStyle = '#d32f2f';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, hw + 2, 0, Math.PI * 2); ctx.stroke();
            // 大眼
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx, cy, hw * 0.55, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#d32f2f';
            ctx.beginPath(); ctx.arc(cx, cy, hw * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(cx, cy, hw * 0.15, 0, Math.PI * 2); ctx.fill();
            // 扫描线
            const scanAngle = Date.now() * 0.005;
            ctx.strokeStyle = 'rgba(244,67,54,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(scanAngle) * hw * 1.5, cy + Math.sin(scanAngle) * hw * 1.5);
            ctx.stroke();
        }
    });

    // 玩家拖尾
    player.trail.forEach((t, i) => {
        const alpha = (i / player.trail.length) * 0.25;
        ctx.fillStyle = `rgba(0,229,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, player.r * 0.8 * (i / player.trail.length), 0, Math.PI * 2);
        ctx.fill();
    });

    // 玩家角色
    const px = player.x, py = player.y, pr = player.r;
    // 外发光
    ctx.fillStyle = 'rgba(0,229,255,0.15)';
    ctx.beginPath(); ctx.arc(px, py, pr + 6, 0, Math.PI * 2); ctx.fill();
    // 身体
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    // 身体高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(px - 3, py - 3, pr * 0.5, 0, Math.PI * 2); ctx.fill();
    // 面罩
    ctx.fillStyle = 'rgba(0,229,255,0.3)';
    ctx.beginPath(); ctx.arc(px, py - 1, pr * 0.7, 0, Math.PI * 2); ctx.fill();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px - 4, py - 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 4, py - 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0a2e';
    ctx.beginPath(); ctx.arc(px - 3, py - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 5, py - 2, 2, 0, Math.PI * 2); ctx.fill();
    // 眼睛高光
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px - 4, py - 3, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 4, py - 3, 1, 0, Math.PI * 2); ctx.fill();
    // 嘴巴
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px, py + 3, 3, 0.1, Math.PI - 0.1); ctx.stroke();

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
