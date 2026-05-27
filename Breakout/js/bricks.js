// 砖块系统
import { BRICK_ROWS, BRICK_COLS, BRICK_W, BRICK_H, BRICK_PAD, BRICK_TOP, COLORS } from './config.js';
import Sound from './sound.js';
import { spawnBombParticles, spawnBreakParticles } from './items.js';

/**
 * 生成关卡砖块布局
 */
export function generateBricks(lv) {
    const bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            const x = c * (BRICK_W + BRICK_PAD) + BRICK_PAD + 35;
            const y = r * (BRICK_H + BRICK_PAD) + BRICK_TOP;
            let type = 'normal', hp = 1;
            const rand = Math.random();
            if (lv > 5 && rand < 0.04) { type = 'steel'; hp = 999; }
            else if (lv > 2 && rand < 0.12) { type = 'tough'; hp = 2; }
            else if (rand < 0.08) { type = 'bomb'; }
            else if (rand < 0.15) { type = 'power'; }
            bricks.push({ x, y, w: BRICK_W, h: BRICK_H, type, hp, color: COLORS[r % COLORS.length], alive: true });
        }
    }
    return bricks;
}

/**
 * 击中砖块处理（返回是否生成道具）
 */
export function hitBrick(bricks, i, powerups, particles, scoreRef) {
    const br = bricks[i];
    if (br.type === 'steel') { Sound.play('hit'); return null; }

    br.hp--;
    if (br.hp <= 0) {
        br.alive = false;
        scoreRef.value += br.type === 'tough' ? 20 : 10;
        Sound.play('break');

        // 炸弹砖爆炸
        if (br.type === 'bomb') {
            for (let j = bricks.length - 1; j >= 0; j--) {
                if (j !== i && bricks[j].alive && bricks[j].type !== 'steel' &&
                    Math.abs(bricks[j].x - br.x) < BRICK_W * 1.5 &&
                    Math.abs(bricks[j].y - br.y) < BRICK_H * 2) {
                    bricks[j].alive = false;
                    scoreRef.value += 10;
                    spawnBombParticles(particles, bricks[j]);
                }
            }
        }

        // 道具砖掉落
        let powerupType = null;
        if (br.type === 'power') {
            const types = ['wide', 'multi', 'laser', 'slow', 'pierce'];
            powerupType = types[Math.floor(Math.random() * types.length)];
            powerups.push({ x: br.x + BRICK_W / 2, y: br.y + BRICK_H / 2, type: powerupType, speed: 2 });
        }

        spawnBreakParticles(particles, br);
        return powerupType;
    } else {
        Sound.play('hit');
        return null;
    }
}

/**
 * 砖块碰撞检测
 */
export function ballBrickCollision(b, bricks, powerups, particles, scoreRef) {
    for (let i = bricks.length - 1; i >= 0; i--) {
        const br = bricks[i];
        if (!br.alive) continue;
        if (b.x + b.r > br.x && b.x - b.r < br.x + br.w &&
            b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
            if (!b.pierce) {
                const overlapX = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
                const overlapY = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
                if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy;
            }
            hitBrick(bricks, i, powerups, particles, scoreRef);
            if (!b.pierce) break;
        }
    }
}

/**
 * 检查是否过关（所有非钢铁砖块被清除）
 */
export function checkLevelClear(bricks) {
    return bricks.every(b => !b.alive || b.type === 'steel');
}

/**
 * 绘制所有砖块
 */
export function drawBricks(ctx, bricks) {
    bricks.forEach(br => {
        if (!br.alive) return;
        ctx.fillStyle = br.type === 'steel' ? '#78909c' : br.type === 'tough' ? br.color + 'cc' : br.color;
        ctx.fillRect(br.x, br.y, br.w, br.h);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(br.x, br.y, br.w, br.h / 2);
        if (br.type === 'tough' && br.hp > 1) {
            ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
            ctx.fillText(br.hp, br.x + br.w / 2, br.y + br.h / 2 + 3);
        }
        if (br.type === 'bomb') {
            ctx.fillStyle = '#fff'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText('💥', br.x + br.w / 2, br.y + br.h / 2 + 4);
        }
        if (br.type === 'power') {
            ctx.fillStyle = '#fff'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText('🎁', br.x + br.w / 2, br.y + br.h / 2 + 4);
        }
        if (br.type === 'steel') {
            ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
            ctx.strokeRect(br.x + 2, br.y + 2, br.w - 4, br.h - 4);
        }
    });
}
