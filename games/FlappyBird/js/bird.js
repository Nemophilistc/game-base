// Flappy Bird - 小鸟类（重力物理、扇翅膀动画、绘制）
import { H, GRAVITY, FLAP, BIRD_SIZE } from './config.js';
import Sound from './sound.js';

const bird = {
    x: 100,
    y: H / 2,
    vy: 0,
    angle: 0,
    flapFrame: 0
};

export function resetBird() {
    bird.x = 100;
    bird.y = H / 2;
    bird.vy = 0;
    bird.angle = 0;
    bird.flapFrame = 0;
}

export function flapBird() {
    bird.vy = FLAP;
    bird.flapFrame = 8;
    Sound.play('flap');
}

export function updateBird() {
    bird.vy += GRAVITY;
    bird.y += bird.vy;
    bird.angle = Math.min(Math.max(bird.vy * 3, -30), 90);
    if (bird.flapFrame > 0) bird.flapFrame--;
}

export function drawBird(ctx, frameCount, state) {
    ctx.save();

    if (state === 'ready') {
        // 待机状态：小鸟上下浮动，不旋转
        const bobY = H / 2 + Math.sin(frameCount * 0.05) * 15;
        ctx.translate(bird.x, bobY);
        ctx.rotate(0);
    } else {
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.angle * Math.PI / 180);
    }

    // 身体
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE, BIRD_SIZE * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 翅膀
    const wingY = bird.flapFrame > 0 ? -7 : 4;
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.ellipse(-4, wingY, 13, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 眼白
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(10, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(11, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.fillStyle = '#f44336';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 3);
    ctx.lineTo(15, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

export function getBird() {
    return bird;
}
