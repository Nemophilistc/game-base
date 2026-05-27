import { W, H, WALL_L, WALL_R, WALL_T, FLIPPER_LEN } from './config.js';

export function draw(ctx, ball, bumpers, targets, flippers, particles) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);

    // 墙壁
    ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(WALL_L - 2, WALL_T - 2); ctx.lineTo(WALL_L - 2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(WALL_R + 2, WALL_T - 2); ctx.lineTo(WALL_R + 2, H); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, WALL_T - 2, W / 2 - WALL_L + 2, Math.PI, 0); ctx.stroke();

    // 圆形碰撞器
    bumpers.forEach(b => {
        ctx.fillStyle = b.color + '40';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.flash > 0 ? '#fff' : b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(b.points, b.x, b.y + 5);
    });

    // 方形靶
    targets.forEach(t => {
        if (!t.alive) return;
        ctx.fillStyle = t.color;
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(t.x, t.y, t.w, t.h / 2);
    });

    // 挡板
    [flippers.left, flippers.right].forEach((f, i) => {
        const isLeft = i === 0;
        const fLen = FLIPPER_LEN;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(isLeft ? -f.angle : f.angle);
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(isLeft ? 0 : -fLen, -6, fLen, 12, 6);
        else ctx.rect(isLeft ? 0 : -fLen, -6, fLen, 12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(isLeft ? 0 : -fLen, -6, fLen, 6);
        ctx.restore();
    });

    // 球
    if (ball) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(ball.x - 2, ball.y - 2, ball.r * 0.4, 0, Math.PI * 2); ctx.fill();
    }

    // 粒子
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 发射提示
    if (ball && !ball.launched) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Arial'; ctx.textAlign = 'center';
        ctx.fillText('按 空格 发射', W / 2, H - 40);
    }
}

export function updateHUD(score, lives, highScore) {
    document.getElementById('score').textContent = score;
    document.getElementById('balls').textContent = lives;
    document.getElementById('high').textContent = Math.max(highScore, score);
}
