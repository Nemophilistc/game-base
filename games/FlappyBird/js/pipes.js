// Flappy Bird - 管道系统（生成、移动、碰撞检测、绘制）
import { W, H, BASE_PIPE_SPEED, BASE_PIPE_GAP, PIPE_WIDTH, PIPE_INTERVAL, BIRD_SIZE, GROUND_H } from './config.js';
import Sound from './sound.js';

let pipes = [];

export function resetPipes() {
    pipes = [];
}

export function getPipeSpeed(score) {
    return BASE_PIPE_SPEED + score * 0.03;
}

export function getPipeGap(score) {
    return Math.max(100, BASE_PIPE_GAP - score * 1.5);
}

export function updatePipes(score, frameCount, bird, onScore) {
    const sp = getPipeSpeed(score);
    const gap = getPipeGap(score);

    // 生成新管道
    if (frameCount % PIPE_INTERVAL === 0) {
        const gapY = 100 + Math.random() * (H - 250 - gap);
        pipes.push({ x: W, gapY, gapH: gap, scored: false });
    }

    // 移动管道
    pipes.forEach(p => p.x -= sp);

    // 计分
    pipes.forEach(p => {
        if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
            p.scored = true;
            Sound.play('score');
            onScore();
        }
    });

    // 移除屏幕外管道
    pipes = pipes.filter(p => p.x > -PIPE_WIDTH);
}

export function checkCollision(bird) {
    // 地面和天花板
    if (bird.y + BIRD_SIZE > H - GROUND_H || bird.y - BIRD_SIZE < 0) {
        return true;
    }

    // 管道碰撞
    for (const p of pipes) {
        if (bird.x + BIRD_SIZE > p.x && bird.x - BIRD_SIZE < p.x + PIPE_WIDTH) {
            if (bird.y - BIRD_SIZE < p.gapY || bird.y + BIRD_SIZE > p.gapY + p.gapH) {
                return true;
            }
        }
    }

    return false;
}

export function drawPipes(ctx) {
    pipes.forEach(p => {
        const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
        grad.addColorStop(0, '#4caf50');
        grad.addColorStop(0.5, '#66bb6a');
        grad.addColorStop(1, '#388e3c');

        // 上管道
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(p.x - 3, p.gapY - 20, PIPE_WIDTH + 6, 20);

        // 下管道
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, p.gapY + p.gapH, PIPE_WIDTH, H - p.gapY - p.gapH - GROUND_H);
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(p.x - 3, p.gapY + p.gapH, PIPE_WIDTH + 6, 20);
    });
}
