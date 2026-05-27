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
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(paddle.x - paddle.w / 2, H - 20, paddle.w, paddle.h, 6);
    else ctx.rect(paddle.x - paddle.w / 2, H - 20, paddle.w, paddle.h);
    ctx.fill();
    ctx.fillStyle = '#ffb74d';
    ctx.fillRect(paddle.x - paddle.w / 2 + 4, H - 18, paddle.w - 8, 4);
}
