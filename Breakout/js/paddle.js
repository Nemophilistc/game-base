// 挡板模块
import { W, H } from './config.js';

/**
 * 创建新挡板
 */
export function createPaddle() {
    return { x: W / 2, w: 80, h: 12, speed: 7, laser: 0 };
}

/**
 * 更新挡板位置（键盘输入）
 */
export function updatePaddle(paddle, keys) {
    if (keys['ArrowLeft'] || keys['KeyA']) paddle.x -= paddle.speed;
    if (keys['ArrowRight'] || keys['KeyD']) paddle.x += paddle.speed;
    paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, paddle.x));
}

/**
 * 绘制挡板
 */
export function drawPaddle(ctx, paddle) {
    const px = paddle.x - paddle.w / 2;
    const py = H - 20;
    const pw = paddle.w;
    const ph = paddle.h;

    // 底部阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px + 2, py + 2, pw, ph, 6);
    else ctx.rect(px + 2, py + 2, pw, ph);
    ctx.fill();

    // 主体渐变
    const g = ctx.createLinearGradient(px, py, px, py + ph);
    g.addColorStop(0, '#ffb74d');
    g.addColorStop(0.4, '#ff9800');
    g.addColorStop(1, '#e65100');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, 6);
    else ctx.rect(px, py, pw, ph);
    ctx.fill();

    // 高光条
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(px + 4, py + 2, pw - 8, 3);

    // 中央装饰
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(paddle.x, py + ph / 2, 5, 0, Math.PI * 2); ctx.fill();

    // 两端发光
    ctx.fillStyle = 'rgba(255,200,0,0.4)';
    ctx.beginPath(); ctx.arc(px + 8, py + ph / 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + pw - 8, py + ph / 2, 3, 0, Math.PI * 2); ctx.fill();
}
