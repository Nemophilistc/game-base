// 道具与粒子系统
import { H, BRICK_W, BRICK_H, MIN_BALL_SPEED } from './config.js';
import Sound from './sound.js';

/**
 * 应用道具效果
 */
export function applyPowerup(type, paddle, balls) {
    switch (type) {
        case 'wide':
            paddle.w = Math.min(150, paddle.w + 30);
            break;
        case 'multi': {
            const nb = balls.find(b => !b.stuck) || balls[0];
            if (nb) {
                balls.push({ x: nb.x, y: nb.y, vx: nb.vx + 1, vy: nb.vy, r: 6, stuck: false, pierce: false });
                balls.push({ x: nb.x, y: nb.y, vx: nb.vx - 1, vy: nb.vy, r: 6, stuck: false, pierce: false });
            }
            break;
        }
        case 'slow':
            balls.forEach(b => {
                b.vx *= 0.7;
                b.vy *= 0.7;
                // Bug修复：防止速度趋近于零导致除零
                const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                if (sp < MIN_BALL_SPEED) {
                    b.vx = (b.vx / (sp || 1)) * MIN_BALL_SPEED;
                    b.vy = (b.vy / (sp || 1)) * MIN_BALL_SPEED;
                }
            });
            break;
        case 'pierce':
            balls.forEach(b => { b.pierce = true; });
            setTimeout(() => balls.forEach(b => b.pierce = false), 8000);
            break;
        case 'laser':
            paddle.laser = 240;
            break;
    }
}

/**
 * 更新道具下落，返回被拾取的道具类型列表
 */
export function updatePowerups(powerups, paddle, balls, H) {
    const picked = [];
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.speed;
        if (p.y > H) { powerups.splice(i, 1); continue; }
        if (p.y + 10 > H - 20 && p.x > paddle.x - paddle.w / 2 && p.x < paddle.x + paddle.w / 2) {
            applyPowerup(p.type, paddle, balls);
            Sound.play('powerup');
            picked.push(p.type);
            powerups.splice(i, 1);
        }
    }
    return picked;
}

/**
 * 更新激光系统，返回激光砖块碰撞检测用的数据
 */
export function updateLaser(paddle, bricks, hitBrickFn) {
    const laserBeams = [];
    if (paddle.laser > 0) {
        paddle.laser--;
        if (paddle.laser % 8 === 0) {
            for (let i = bricks.length - 1; i >= 0; i--) {
                const br = bricks[i];
                if (!br.alive) continue;
                if (Math.abs(paddle.x - (br.x + br.w / 2)) < br.w / 2 + paddle.w / 4 && br.y < H - 20) {
                    hitBrickFn(i);
                    break;
                }
            }
            laserBeams.push({ x: paddle.x, life: 6 });
        }
    }
    return laserBeams;
}

/**
 * 生成炸弹爆炸粒子
 */
export function spawnBombParticles(particles, brick) {
    for (let k = 0; k < 5; k++) {
        particles.push({
            x: brick.x + BRICK_W / 2, y: brick.y + BRICK_H / 2,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 20, color: brick.color
        });
    }
}

/**
 * 生成砖块破碎粒子
 */
export function spawnBreakParticles(particles, brick) {
    for (let k = 0; k < 8; k++) {
        particles.push({
            x: brick.x + BRICK_W / 2, y: brick.y + BRICK_H / 2,
            vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
            life: 25, color: brick.color
        });
    }
}

/**
 * 更新粒子生命周期
 */
export function updateParticles(particles) {
    return particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        return p.life > 0;
    });
}

/**
 * 绘制道具
 */
export function drawPowerups(ctx, powerups, icons) {
    powerups.forEach(p => {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(icons[p.type] || '?', p.x, p.y);
    });
}

/**
 * 绘制粒子
 */
export function drawParticles(ctx, particles) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 25;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

/**
 * 绘制激光光束
 */
export function drawLaserBeams(ctx, laserBeams, H) {
    laserBeams.forEach(l => {
        ctx.globalAlpha = l.life / 6;
        ctx.fillStyle = '#f44336';
        ctx.fillRect(l.x - 2, 0, 4, H - 20);
        ctx.fillStyle = '#ff8a80';
        ctx.fillRect(l.x - 1, 0, 2, H - 20);
        ctx.globalAlpha = 1;
    });
}
