import { H, FLIPPER_LEN, FLIPPER_LERP, FLIP_SPEED_UP, FLIP_SPEED_REST,
         FLIPPER_Y, FLIPPER_LX, FLIPPER_RX, FLIPPER_COOLDOWN } from './config.js';
import { Sound } from './sound.js';

export function createFlippers() {
    return {
        left:  { x: FLIPPER_LX, y: FLIPPER_Y, angle:  FLIP_SPEED_REST, target:  FLIP_SPEED_REST, cooldown: 0 },
        right: { x: FLIPPER_RX, y: FLIPPER_Y, angle: -FLIP_SPEED_REST, target: -FLIP_SPEED_REST, cooldown: 0 }
    };
}

export function updateFlippers(flippers, keys) {
    const { left, right } = flippers;
    if (keys['ArrowLeft'] || keys['KeyA']) {
        left.target = FLIP_SPEED_UP;
        Sound.play('flipper');
    } else {
        left.target = FLIP_SPEED_REST;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        right.target = -FLIP_SPEED_UP;
        Sound.play('flipper');
    } else {
        right.target = -FLIP_SPEED_REST;
    }
    left.angle  += (left.target  - left.angle)  * FLIPPER_LERP;
    right.angle += (right.target - right.angle) * FLIPPER_LERP;
}

export function collideFlippers(flippers, ball) {
    const list = [flippers.left, flippers.right];
    list.forEach((f, i) => {
        // 冷却递减
        if (f.cooldown > 0) { f.cooldown--; return; }

        const isLeft = i === 0;
        const fLen = FLIPPER_LEN;
        const endX = f.x + (isLeft ? 1 : -1) * Math.cos(f.angle) * fLen;
        const endY = f.y - Math.sin(f.angle) * fLen;

        const dx = endX - f.x, dy = endY - f.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len, ny = dx / len;
        const px = ball.x - f.x, py = ball.y - f.y;
        const dist = Math.abs(px * nx + py * ny);
        const proj = (px * dx + py * dy) / (len * len);

        if (dist < ball.r + 5 && proj >= 0 && proj <= 1) {
            const flip = isLeft ? -1 : 1;
            ball.vy = -8 - Math.abs(f.angle) * 4;
            ball.vx = flip * (f.angle) * 6 + ball.vx * 0.3;
            ball.y = f.y - ball.r - 6;
            f.cooldown = FLIPPER_COOLDOWN;
            Sound.play('flipper');
        }
    });
}
