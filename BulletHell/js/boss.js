import { CONFIG } from './config.js';

// ============================================================
// Boss类型配置
// ============================================================
export const BOSS_TYPES = {
    boss_mech: {
        hpMult: 600, size: 50, speed: 0.5, score: 1500,
        color: '#e74c3c', bossType: 'mech'
    },
    boss_ghost: {
        hpMult: 450, size: 45, speed: 0.8, score: 1200,
        color: '#9c27b0', bossType: 'ghost', visTimer: 0
    },
    boss_final: {
        hpMult: 1000, size: 60, speed: 0.4, score: 3000,
        color: '#ff1744', bossType: 'final'
    }
};

// ============================================================
// Boss移动模式
// ============================================================
export function bossUpdate(enemy) {
    if (enemy.y < 100) {
        enemy.y += enemy.speed;
    } else {
        const d = enemy.dir || 1;
        enemy.x += Math.sin(enemy.angle) * 2 * d;
        enemy.y += Math.cos(enemy.angle * 0.5) * 1;
    }
    enemy.phaseTimer++;
    if (enemy.phaseTimer >= 300) {
        enemy.phaseTimer = 0;
        enemy.phase = (enemy.phase + 1) % 3;
    }
}

// ============================================================
// Boss隐身更新（幽灵Boss专用）
// ============================================================
export function bossGhostUpdate(enemy) {
    enemy.visTimer++;
    if (enemy.visTimer >= 180) {
        enemy.visible = !enemy.visible;
        enemy.visTimer = 0;
    }
}

// ============================================================
// Boss开火模式（EBullet作为参数传入避免循环依赖）
// ============================================================
export function bossFire(enemy, player, eBullets, EBulletClass) {
    switch (enemy.bossType) {
        case 'mech': bossMechFire(enemy, player, eBullets, EBulletClass); break;
        case 'ghost': if (enemy.visible) bossGhostFire(enemy, player, eBullets, EBulletClass); break;
        case 'final': bossFinalFire(enemy, player, eBullets, EBulletClass); break;
    }
}

// --- 机械Boss ---
function bossMechFire(enemy, player, eBullets, EB) {
    switch (enemy.phase) {
        case 0:
            if (enemy.shootTimer % 20 === 0) bossSpread(enemy, player, 5, 0.3, eBullets, EB);
            break;
        case 1:
            if (enemy.shootTimer % 30 === 0) bossCircle(enemy, 12, eBullets, EB);
            break;
        case 2:
            if (enemy.shootTimer % 3 === 0) {
                const a = Math.sin(enemy.angle * 5) * 1.2;
                eBullets.push(new EB(enemy.x, enemy.y, Math.cos(a) * 5, Math.sin(a) * 5, '#ff0000', 7));
            }
            break;
    }
}

// --- 幽灵Boss ---
function bossGhostFire(enemy, player, eBullets, EB) {
    switch (enemy.phase) {
        case 0:
            if (enemy.shootTimer % 15 === 0) bossCircle(enemy, 6, eBullets, EB);
            break;
        case 1:
            if (enemy.shootTimer % 25 === 0) {
                for (let i = 0; i < 4; i++)
                    eBullets.push(new EB(enemy.x, enemy.y,
                        (Math.random() - 0.5) * 6, 3 + Math.random() * 2, '#ce93d8', 5, true));
            }
            break;
        case 2:
            if (enemy.shootTimer % 10 === 0) bossSpread(enemy, player, 7, 0.25, eBullets, EB);
            break;
    }
}

// --- 最终Boss ---
function bossFinalFire(enemy, player, eBullets, EB) {
    switch (enemy.phase) {
        case 0:
            if (enemy.shootTimer % 10 === 0) bossSpread(enemy, player, 8, 0.2, eBullets, EB);
            break;
        case 1:
            if (enemy.shootTimer % 8 === 0) {
                bossCircle(enemy, 16, eBullets, EB);
                bossAimed(enemy, player, eBullets, EB);
            }
            break;
        case 2:
            if (enemy.shootTimer % 5 === 0) {
                const a = enemy.angle * 8;
                eBullets.push(new EB(enemy.x, enemy.y, Math.cos(a) * 4, Math.sin(a) * 4, '#ff0000', 6));
                eBullets.push(new EB(enemy.x, enemy.y, Math.cos(a + Math.PI) * 4, Math.sin(a + Math.PI) * 4, '#ff4400', 6));
            }
            if (enemy.shootTimer % 60 === 0) bossCircle(enemy, 20, eBullets, EB);
            break;
    }
}

// ============================================================
// Boss通用射击辅助
// ============================================================
function bossAimed(enemy, player, eBullets, EB) {
    if (!player) return;
    const dx = player.x - enemy.x, dy = player.y - enemy.y, d = Math.hypot(dx, dy);
    if (d > 0) eBullets.push(new EB(enemy.x, enemy.y, dx / d * 4, dy / d * 4, enemy.color, 5));
}

function bossSpread(enemy, player, n, sp, eBullets, EB) {
    if (!player) return;
    const ba = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    for (let i = 0; i < n; i++) {
        const a = ba + (i - (n - 1) / 2) * sp;
        eBullets.push(new EB(enemy.x, enemy.y, Math.cos(a) * 4, Math.sin(a) * 4, enemy.color, 5));
    }
}

function bossCircle(enemy, n, eBullets, EB) {
    for (let i = 0; i < n; i++) {
        const a = Math.PI * 2 / n * i + enemy.angle;
        eBullets.push(new EB(enemy.x, enemy.y, Math.cos(a) * 3, Math.sin(a) * 3, enemy.color, 4));
    }
}
