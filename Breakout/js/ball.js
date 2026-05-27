// 球模块
import { W, H, MIN_BALL_SPEED } from './config.js';
import Sound from './sound.js';

/**
 * 创建新球（附着在挡板上）
 */
export function createBall(paddleX) {
    return {
        x: paddleX,
        y: H - 30,
        vx: 3 * (Math.random() > 0.5 ? 1 : -1),
        vy: -4,
        r: 6,
        stuck: true,
        pierce: false
    };
}

/**
 * 释放所有粘附的球
 */
export function releaseBalls(balls) {
    balls.forEach(b => { if (b.stuck) b.stuck = false; });
}

/**
 * 更新球的位置和墙壁碰撞，返回越界球的索引列表
 */
export function updateBalls(balls, paddle) {
    const lostIndices = [];

    for (let bi = balls.length - 1; bi >= 0; bi--) {
        const b = balls[bi];
        if (b.stuck) {
            b.x = paddle.x;
            b.y = H - 30;
            continue;
        }
        b.x += b.vx;
        b.y += b.vy;

        // 墙壁碰撞
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }

        // 球出界
        if (b.y > H + 10) {
            lostIndices.push(bi);
        }
    }

    return lostIndices;
}

/**
 * 挡板碰撞检测与反弹
 */
export function paddleCollision(b, paddle) {
    if (b.vy <= 0) return false;
    const paddleTop = H - 20;
    if (b.y + b.r >= paddleTop && b.y - b.r <= paddleTop + paddle.h &&
        b.x >= paddle.x - paddle.w / 2 - b.r && b.x <= paddle.x + paddle.w / 2 + b.r) {
        const off = (b.x - paddle.x) / (paddle.w / 2);
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const angle = off * 1.2;
        b.vx = speed * Math.sin(angle);
        b.vy = -speed * Math.cos(angle);
        b.y = paddleTop - b.r;
        // 最低速度限制
        if (Math.abs(b.vy) < 2) b.vy = -2;
        Sound.play('hit');
        return true;
    }
    return false;
}

/**
 * 绘制所有球
 */
export function drawBalls(ctx, balls) {
    balls.forEach(b => {
        ctx.fillStyle = b.pierce ? '#ffd700' : '#fff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = (b.pierce ? '#ffd700' : '#fff') + '30';
        ctx.beginPath();
        ctx.arc(b.x - b.vx * 0.5, b.y - b.vy * 0.5, b.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
    });
}
