// ============================================================
// 配置常量
// ============================================================
export const CONFIG = {
    W: 800, H: 600,
    PLAYER_SPEED: 5, PLAYER_SIZE: 15, PLAYER_HP: 100,
    ENEMY_SPAWN_RATE: 100, BOSS_INTERVAL: 1800, MAX_ENEMIES: 60,
    EXP_BASE: 100, EXP_GROWTH: 1.25,
    BOMB_CD: 300, INV_TIME: 90,
    DASH_DIST: 80, DASH_CD: 180, DASH_INV: 18,
    COMBO_TIMEOUT: 120, POWERUP_CHANCE: 0.30, POWERUP_MAGNET: 120
};

export function initBackground(game) {
    game.bgStars = [];
    for (let i = 0; i < 80; i++) game.bgStars.push({
        x: Math.random() * CONFIG.W,
        y: Math.random() * CONFIG.H,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        alpha: Math.random() * 0.5 + 0.3
    });
    game.bgNebulas = [];
    for (let i = 0; i < 3; i++) game.bgNebulas.push({
        x: Math.random() * CONFIG.W,
        y: Math.random() * CONFIG.H * 0.5,
        r: 60 + Math.random() * 80,
        color: ['rgba(0,100,255,0.03)', 'rgba(100,0,200,0.03)', 'rgba(255,50,0,0.02)'][i],
        speed: 0.1 + Math.random() * 0.1
    });
}

// ============================================================
// 升级选项
// ============================================================
export const UPGRADES = [
    { id: 'power', name: '火力强化', icon: '🔥', desc: '子弹伤害+5', apply: (player) => { player.power += 5; } },
    { id: 'speed', name: '射速强化', icon: '⚡', desc: '射击间隔-1帧', apply: (player) => { player.fireRate = Math.max(3, player.fireRate - 1); } },
    { id: 'weapon', name: '武器升级', icon: '🗡️', desc: '武器等级+1', apply: (player) => { player.wlv = Math.min(5, player.wlv + 1); } },
    { id: 'hp', name: '生命强化', icon: '❤️', desc: '最大HP+20', apply: (player) => { player.maxHp += 20; player.hp = Math.min(player.hp + 20, player.maxHp); } },
    { id: 'heal', name: '紧急修复', icon: '💚', desc: '恢复30%HP', apply: (player) => { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.3); } },
    { id: 'bomb', name: '弹药补充', icon: '💣', desc: '炸弹+1', apply: (player, game) => { game.bombs = Math.min(5, game.bombs + 1); } },
    { id: 'shield_up', name: '护盾强化', icon: '🛡️', desc: '护盾+1', apply: (player) => { player.shield = Math.min(3, player.shield + 1); } },
    { id: 'movespeed', name: '机动强化', icon: '💨', desc: '移动速度+0.5', apply: (player) => { player.speed += 0.5; } }
];

// ============================================================
// 武器定义
// ============================================================
export const WEAPONS = {
    standard: {
        name: '标准弹', icon: '🔵', desc: '均衡的直射子弹，升级后多方向散射',
        fire(p, pBullets, bulletDeps) {
            pBullets.push(new bulletDeps.PBullet(p.x, p.y - 10, 0, -10, p.power, '#00d4ff', bulletDeps));
            if (p.wlv >= 2) {
                // Bug修复: 侧弹vy统一为-8（原为-7不对称）
                pBullets.push(new bulletDeps.PBullet(p.x - 12, p.y - 5, -0.5, -8, p.power * 0.7, '#00d4ff', bulletDeps));
                pBullets.push(new bulletDeps.PBullet(p.x + 12, p.y - 5, 0.5, -8, p.power * 0.7, '#00d4ff', bulletDeps));
            }
            if (p.wlv >= 3) {
                pBullets.push(new bulletDeps.PBullet(p.x - 24, p.y, -1, -8, p.power * 0.5, '#00aaff', bulletDeps));
                pBullets.push(new bulletDeps.PBullet(p.x + 24, p.y, 1, -8, p.power * 0.5, '#00aaff', bulletDeps));
            }
            if (p.wlv >= 4) {
                pBullets.push(new bulletDeps.PBullet(p.x, p.y - 10, 0, -13, p.power * 1.2, '#ffd700', bulletDeps));
            }
            if (bulletDeps.game.activeEffects.spread > 0) {
                for (let i = -2; i <= 2; i++) {
                    if (i === 0) continue;
                    pBullets.push(new bulletDeps.PBullet(p.x, p.y - 10, i * 1.5, -9, p.power * 0.4, '#ffcc00', bulletDeps));
                }
            }
        }
    },
    laser: {
        name: '激光', icon: '🔴', desc: '高穿透激光束，升级后加宽加长',
        fire(p, pBullets, bulletDeps) {
            const w = 4 + p.wlv * 2, dmg = p.power * 0.6;
            pBullets.push(new bulletDeps.LaserBeam(p.x, p.y - 10, w, dmg, '#ff3366', bulletDeps));
        }
    },
    spread: {
        name: '散弹', icon: '🟡', desc: '近距离扇形散射，升级后弹数增加',
        fire(p, pBullets, bulletDeps) {
            let count = 3 + p.wlv;
            if (bulletDeps.game.activeEffects.spread > 0) count += 3;
            const arc = 0.6 + p.wlv * 0.1;
            for (let i = 0; i < count; i++) {
                const a = -Math.PI / 2 + (i - (count - 1) / 2) * (arc / (count - 1));
                pBullets.push(new bulletDeps.PBullet(p.x, p.y - 10, Math.cos(a) * 8, Math.sin(a) * 8, p.power * 0.6, '#ffcc00', bulletDeps));
            }
        }
    }
};
