import { W, H, GRAVITY, WALL_BOUNCE, BUMPER_BOUNCE, MAX_SPEED,
         BALL_START_X, BALL_START_Y, BALL_R, WALL_L, WALL_R, WALL_T } from './config.js';
import { Sound } from './sound.js';

export function createBall() {
    return { x: BALL_START_X, y: BALL_START_Y, vx: 0, vy: 0, r: BALL_R, launched: false };
}

export function launchBall(ball) {
    if (ball.launched) return;
    ball.launched = true;
    ball.vy = -10 - Math.random() * 3;
    ball.vx = (Math.random() - 0.5) * 4;
}

export function updateBallPhysics(ball) {
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;
}

export function collideWalls(ball) {
    if (ball.x - ball.r < WALL_L) {
        ball.x = WALL_L + ball.r;
        ball.vx = Math.abs(ball.vx) * WALL_BOUNCE;
        Sound.play('bounce');
    }
    if (ball.x + ball.r > WALL_R) {
        ball.x = WALL_R - ball.r;
        ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE;
        Sound.play('bounce');
    }
    if (ball.y - ball.r < WALL_T) {
        ball.y = WALL_T + ball.r;
        ball.vy = Math.abs(ball.vy) * WALL_BOUNCE;
        Sound.play('bounce');
    }
}

export function collideBumpers(ball, bumpers, particles, addScore) {
    bumpers.forEach(b => {
        const dx = ball.x - b.x, dy = ball.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ball.r + b.r) {
            const nx = dx / dist, ny = dy / dist;
            ball.x = b.x + nx * (ball.r + b.r);
            ball.y = b.y + ny * (ball.r + b.r);
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * BUMPER_BOUNCE;
            ball.vy = (ball.vy - 2 * dot * ny) * BUMPER_BOUNCE;
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed > MAX_SPEED) {
                ball.vx = ball.vx / speed * MAX_SPEED;
                ball.vy = ball.vy / speed * MAX_SPEED;
            }
            b.flash = 10;
            addScore(b.points);
            Sound.play('target');
            spawnParticles(particles, b.x, b.y, b.color, 8);
        }
        if (b.flash > 0) b.flash--;
    });
}

export function collideTargets(ball, targets, particles, addScore) {
    targets.forEach(t => {
        if (!t.alive) return;
        if (ball.x + ball.r > t.x && ball.x - ball.r < t.x + t.w &&
            ball.y + ball.r > t.y && ball.y - ball.r < t.y + t.h) {
            t.alive = false;
            addScore(t.points);
            ball.vy = Math.abs(ball.vy) * 0.5 + 2;
            Sound.play('target');
            spawnParticles(particles, t.x + t.w / 2, t.y + t.h / 2, t.color, 12);
        }
    });
}

export function spawnParticles(particles, x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            life: 25 + Math.random() * 15,
            color
        });
    }
}

export function updateParticles(particles) {
    return particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
        return p.life > 0;
    });
}

export function isBallLost(ball) {
    return ball.y > H + 20;
}
