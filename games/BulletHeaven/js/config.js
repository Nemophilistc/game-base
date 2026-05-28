// ============================================================
// config.js - 常量配置（武器数据、敌人数据、升级数据）
// ============================================================

export const GAME = {
    WIDTH: 1280,
    HEIGHT: 720,
    WORLD_WIDTH: 4000,
    WORLD_HEIGHT: 4000,
    TICK_RATE: 60,
    SPAWN_INTERVAL_BASE: 2000,
    SPAWN_INTERVAL_MIN: 300,
    BOSS_INTERVAL: 60,
    MAX_ENEMIES: 250,
    GROUND_TILE: 64,
};

export const PLAYER_CONFIG = {
    RADIUS: 14,
    SPEED: 3.0,
    MAX_HP: 100,
    INVINCIBLE_TIME: 500,
    PICKUP_RANGE: 80,
    XP_MAGNET_RANGE: 200,
};

export const WEAPONS = {
    sword_wave: {
        id: 'sword_wave',
        name: '剑气',
        desc: '向最近敌人发射剑气',
        icon: '⚔️',
        color: '#00ffff',
        damage: 25,
        cooldown: 800,
        speed: 8,
        range: 300,
        pierce: 1,
        radius: 8,
        levelBonus: { damage: 10, speed: 1, pierce: 1 },
    },
    fireball: {
        id: 'fireball',
        name: '火球',
        desc: '范围穿透火球',
        icon: '🔥',
        color: '#ff4400',
        damage: 35,
        cooldown: 1200,
        speed: 5,
        range: 250,
        pierce: 5,
        radius: 14,
        explosionRadius: 60,
        levelBonus: { damage: 15, pierce: 2, explosionRadius: 15 },
    },
    lightning: {
        id: 'lightning',
        name: '闪电',
        desc: '连锁闪电命中多个敌人',
        icon: '⚡',
        color: '#ffff00',
        damage: 20,
        cooldown: 1500,
        speed: 0,
        range: 250,
        chainCount: 3,
        radius: 5,
        levelBonus: { damage: 8, chainCount: 1 },
    },
    aura: {
        id: 'aura',
        name: '光环',
        desc: '环绕玩家旋转的光球',
        icon: '💫',
        color: '#aa66ff',
        damage: 15,
        cooldown: 0,
        speed: 0,
        range: 80,
        orbitCount: 3,
        orbitSpeed: 2,
        orbitRadius: 70,
        radius: 10,
        levelBonus: { damage: 6, orbitCount: 1 },
    },
    holy_light: {
        id: 'holy_light',
        name: '圣光',
        desc: '周围范围AOE',
        icon: '✨',
        color: '#ffffff',
        damage: 30,
        cooldown: 2000,
        speed: 0,
        range: 120,
        aoeRadius: 120,
        radius: 0,
        levelBonus: { damage: 12, aoeRadius: 20 },
    },
    ice_spike: {
        id: 'ice_spike',
        name: '冰锥',
        desc: '减速并伤害敌人',
        icon: '❄️',
        color: '#88ccff',
        damage: 18,
        cooldown: 900,
        speed: 7,
        range: 280,
        pierce: 2,
        radius: 7,
        slowFactor: 0.4,
        slowDuration: 2000,
        levelBonus: { damage: 7, pierce: 1, slowDuration: 500 },
    },
    poison_cloud: {
        id: 'poison_cloud',
        name: '毒雾',
        desc: '持续区域伤害',
        icon: '☠️',
        color: '#44ff44',
        damage: 8,
        cooldown: 2500,
        speed: 0,
        range: 200,
        cloudRadius: 80,
        cloudDuration: 4000,
        tickRate: 500,
        radius: 0,
        levelBonus: { damage: 3, cloudRadius: 15, cloudDuration: 800 },
    },
    throwing_knife: {
        id: 'throwing_knife',
        name: '飞刀',
        desc: '快速单体飞刀',
        icon: '🗡️',
        color: '#cccccc',
        damage: 22,
        cooldown: 400,
        speed: 12,
        range: 350,
        pierce: 1,
        radius: 5,
        levelBonus: { damage: 8, speed: 2 },
    },
};

export const ENEMY_TYPES = {
    slime: {
        id: 'slime',
        name: '史莱姆',
        color: '#44ff44',
        hp: 20,
        speed: 1.2,
        damage: 8,
        radius: 12,
        xp: 3,
        behavior: 'chase',
    },
    bat: {
        id: 'bat',
        name: '蝙蝠',
        color: '#8844aa',
        hp: 12,
        speed: 2.5,
        damage: 5,
        radius: 8,
        xp: 2,
        behavior: 'zigzag',
    },
    skeleton: {
        id: 'skeleton',
        name: '骷髅',
        color: '#ddddaa',
        hp: 40,
        speed: 1.5,
        damage: 12,
        radius: 14,
        xp: 5,
        behavior: 'chase',
    },
    archer: {
        id: 'archer',
        name: '骷髅弓手',
        color: '#cc9944',
        hp: 25,
        speed: 1.0,
        damage: 10,
        radius: 13,
        xp: 6,
        behavior: 'ranged',
        attackRange: 200,
        attackCooldown: 2000,
        projectileSpeed: 4,
    },
    ghost: {
        id: 'ghost',
        name: '幽灵',
        color: '#aaccff',
        hp: 30,
        speed: 1.8,
        damage: 10,
        radius: 14,
        xp: 5,
        behavior: 'phase',
        phaseDuration: 2000,
        visibleDuration: 3000,
    },
    splitter: {
        id: 'splitter',
        name: '分裂体',
        color: '#ff8800',
        hp: 50,
        speed: 1.3,
        damage: 10,
        radius: 16,
        xp: 8,
        behavior: 'split',
        splitCount: 3,
    },
    healer: {
        id: 'healer',
        name: '治疗者',
        color: '#ff66aa',
        hp: 35,
        speed: 1.0,
        damage: 6,
        radius: 13,
        xp: 7,
        behavior: 'healer',
        healRange: 120,
        healAmount: 5,
        healCooldown: 2000,
    },
    charger: {
        id: 'charger',
        name: '冲锋者',
        color: '#ff2222',
        hp: 60,
        speed: 1.0,
        damage: 20,
        radius: 16,
        xp: 10,
        behavior: 'charge',
        chargeSpeed: 6,
        chargeCooldown: 3000,
        chargeRange: 250,
    },
    swarm: {
        id: 'swarm',
        name: '虫群',
        color: '#88aa22',
        hp: 8,
        speed: 2.8,
        damage: 3,
        radius: 6,
        xp: 1,
        behavior: 'swarm',
    },
    boss: {
        id: 'boss',
        name: '精英Boss',
        color: '#ff0000',
        hp: 500,
        speed: 0.8,
        damage: 25,
        radius: 28,
        xp: 100,
        behavior: 'boss',
        attackCooldown: 1500,
        projectileSpeed: 3,
    },
};

export const WAVE_CONFIG = {
    baseSpawnRate: 2000,
    minSpawnRate: 300,
    spawnRateDecay: 50,
    waveDuration: 60,
    enemyTypeWeights: {
        0: { slime: 70, bat: 20, swarm: 10 },
        60: { slime: 40, bat: 20, skeleton: 20, archer: 10, swarm: 10 },
        120: { slime: 20, bat: 15, skeleton: 20, archer: 15, ghost: 10, splitter: 10, swarm: 10 },
        180: { slime: 10, bat: 10, skeleton: 15, archer: 15, ghost: 15, splitter: 15, healer: 10, charger: 5, swarm: 5 },
        300: { skeleton: 10, archer: 15, ghost: 15, splitter: 15, healer: 15, charger: 20, swarm: 10 },
    },
};

export const UPGRADES = {
    maxHp: {
        id: 'maxHp',
        name: '生命强化',
        desc: '最大HP +20',
        icon: '❤️',
        apply: (player) => {
            player.maxHp += 20;
            player.hp = Math.min(player.hp + 20, player.maxHp);
        },
    },
    speed: {
        id: 'speed',
        name: '疾风步',
        desc: '移动速度 +0.5',
        icon: '👟',
        apply: (player) => {
            player.speed += 0.5;
        },
    },
    pickupRange: {
        id: 'pickupRange',
        name: '磁力',
        desc: '拾取范围 +50',
        icon: '🧲',
        apply: (player) => {
            player.pickupRange += 50;
        },
    },
    heal: {
        id: 'heal',
        name: '治愈之光',
        desc: '恢复30%最大HP',
        icon: '💚',
        apply: (player) => {
            player.hp = Math.min(player.hp + player.maxHp * 0.3, player.maxHp);
        },
    },
    might: {
        id: 'might',
        name: '力量',
        desc: '伤害 +10%',
        icon: '💪',
        apply: (player) => {
            player.mightMultiplier += 0.1;
        },
    },
    armor: {
        id: 'armor',
        name: '护甲',
        desc: '减少1点受到伤害',
        icon: '🛡️',
        apply: (player) => {
            player.armor += 1;
        },
    },
    cooldownReduce: {
        id: 'cooldownReduce',
        name: '急速',
        desc: '武器冷却 -8%',
        icon: '⏱️',
        apply: (player) => {
            player.cooldownMultiplier *= 0.92;
        },
    },
    xpBonus: {
        id: 'xpBonus',
        name: '智慧',
        desc: '经验获取 +15%',
        icon: '📖',
        apply: (player) => {
            player.xpMultiplier += 0.15;
        },
    },
    projectileCount: {
        id: 'projectileCount',
        name: '多重射击',
        desc: '投射物数量 +1',
        icon: '🎯',
        apply: (player) => {
            player.projectileBonus += 1;
        },
    },
    regen: {
        id: 'regen',
        name: '生命恢复',
        desc: '每秒恢复1HP',
        icon: '💖',
        apply: (player) => {
            player.regenRate += 1;
        },
    },
    magnet: {
        id: 'magnet',
        name: '超级磁铁',
        desc: '宝石自动飞向玩家',
        icon: '🧲',
        apply: (player) => {
            player.magnetActive = true;
            player.magnetRange = 400;
        },
    },
    areaSize: {
        id: 'areaSize',
        name: '范围扩展',
        desc: '攻击范围 +10%',
        icon: '🔮',
        apply: (player) => {
            player.areaMultiplier += 0.1;
        },
    },
    revive: {
        id: 'revive',
        name: '复活',
        desc: '死亡时复活一次(满HP)',
        icon: '👼',
        apply: (player) => {
            player.revives += 1;
        },
        once: true,
    },
    curse: {
        id: 'curse',
        name: '诅咒',
        desc: '敌人HP-15%，数量+20%',
        icon: '💀',
        apply: (player) => {
            player.curseLevel += 1;
        },
    },
    reroll: {
        id: 'reroll',
        name: '重随',
        desc: '升级选项重随次数+1',
        icon: '🎲',
        apply: (player) => {
            player.rerolls += 1;
        },
    },
};

export const XP_TABLE = [
    0, 10, 25, 45, 70, 100, 140, 190, 250, 320,
    400, 500, 620, 760, 920, 1100, 1300, 1520, 1760, 2020,
    2300, 2600, 2920, 3260, 3620, 4000, 4400, 4820, 5260, 5720,
    6200, 6700, 7220, 7760, 8320, 8900, 9500, 10120, 10760, 11420,
];
