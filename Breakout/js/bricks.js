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
        const x = br.x, y = br.y, w = br.w, h = br.h;

        if (br.type === 'steel') {
            // 钢铁砖：金属质感+铆钉+磨砂
            const g = ctx.createLinearGradient(x, y, x, y + h);
            g.addColorStop(0, '#90a4ae');
            g.addColorStop(0.4, '#78909c');
            g.addColorStop(1, '#546e7a');
            ctx.fillStyle = g;
            ctx.fillRect(x, y, w, h);
            // 金属高光
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x + 2, y + 1, w - 4, h * 0.35);
            // 铆钉
            ctx.fillStyle = '#455a64';
            const rx = [x + 5, x + w - 5], ry = [y + 4, y + h - 4];
            for (const px of rx) for (const py of ry) {
                ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
            }
            // 边框
            ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        } else if (br.type === 'tough') {
            // 加固砖：多层+裂纹+数字
            const g = ctx.createLinearGradient(x, y, x, y + h);
            g.addColorStop(0, br.color);
            g.addColorStop(1, br.color + '88');
            ctx.fillStyle = g;
            ctx.fillRect(x, y, w, h);
            // 内层
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
            // 高光
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(x + 2, y + 1, w - 4, h * 0.3);
            // 裂纹
            if (br.hp === 1) {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + w * 0.3, y); ctx.lineTo(x + w * 0.5, y + h * 0.5); ctx.lineTo(x + w * 0.7, y + h);
                ctx.stroke();
            }
            // 数字
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
            ctx.fillText(br.hp, x + w / 2, y + h / 2 + 4);
        } else if (br.type === 'bomb') {
            // 炸弹砖：暗红底+爆炸图标+脉冲
            const g = ctx.createLinearGradient(x, y, x, y + h);
            g.addColorStop(0, '#d32f2f');
            g.addColorStop(1, '#b71c1c');
            ctx.fillStyle = g;
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(x + 2, y + 1, w - 4, h * 0.3);
            // 爆炸图标
            ctx.fillStyle = '#ff8a65';
            ctx.font = '14px Arial'; ctx.textAlign = 'center';
            ctx.fillText('💥', x + w / 2, y + h / 2 + 5);
        } else if (br.type === 'power') {
            // 道具砖：闪烁+礼物图标
            const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
            const g = ctx.createLinearGradient(x, y, x, y + h);
            g.addColorStop(0, '#7b1fa2');
            g.addColorStop(1, '#4a148c');
            ctx.fillStyle = g;
            ctx.globalAlpha = pulse;
            ctx.fillRect(x, y, w, h);
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x + 2, y + 1, w - 4, h * 0.3);
            // 礼物图标
            ctx.fillStyle = '#ce93d8';
            ctx.font = '14px Arial'; ctx.textAlign = 'center';
            ctx.fillText('🎁', x + w / 2, y + h / 2 + 5);
        } else {
            // 普通砖：渐变+圆角+高光+底部阴影
            const g = ctx.createLinearGradient(x, y, x, y + h);
            g.addColorStop(0, br.color);
            g.addColorStop(0.6, br.color + 'dd');
            g.addColorStop(1, br.color + '99');
            ctx.fillStyle = g;
            // 圆角矩形
            const r = 3;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath(); ctx.fill();
            // 高光
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x + 3, y + 1, w - 6, h * 0.35);
            // 底部阴影
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x + 2, y + h * 0.7, w - 4, h * 0.25);
        }
    });
}
