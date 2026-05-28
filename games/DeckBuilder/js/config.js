// ============================================================
// config.js - 杀戮尖塔风格卡牌Roguelike 常量配置
// ============================================================

// ---- 游戏基础常量 ----
export const GAME_CONFIG = {
    STARTING_HP: 80,
    MAX_HP: 80,
    ENERGY_PER_TURN: 3,
    CARDS_PER_TURN: 5,
    STARTING_GOLD: 99,
    STARTING_DECK_SIZE: 10,
    MAP_LAYERS: 3,
    NODES_PER_ROW: [3, 4, 3, 4, 3], // 每层每行节点数
    ROWS_PER_FLOOR: 5,
    POTION_SLOTS: 3,
    CARD_REWARD_COUNT: 3,
    ELITE_GOLD_REWARD: [25, 40],
    NORMAL_GOLD_REWARD: [10, 20],
    BOSS_GOLD_REWARD: [50, 80],
};

// ---- 卡牌稀有度 ----
export const RARITY = {
    COMMON: 'common',
    RARE: 'rare',
    LEGENDARY: 'legendary',
};

// ---- 卡牌类型 ----
export const CARD_TYPE = {
    ATTACK: 'attack',
    DEFENSE: 'defense',
    SKILL: 'skill',
};

// ---- 状态效果 ----
export const STATUS_EFFECTS = {
    STRENGTH: 'strength',       // 力量：增加攻击伤害
    DEXTERITY: 'dexterity',     // 敏捷：增加护甲获取
    POISON: 'poison',           // 中毒：回合结束受伤害，层数-1
    WEAKNESS: 'weakness',       // 虚弱：攻击伤害降低25%
    VULNERABLE: 'vulnerable',   // 易伤：受到伤害增加50%
    REGEN: 'regen',             // 回复：回合开始回复HP
    THORNS: 'thorns',           // 荆棘：受攻击时反弹伤害
    RITUAL: 'ritual',           // 仪式：回合结束获得力量
    SHARP: 'sharp',             // 锋利：下次攻击额外伤害
};

// ---- 敌人意图类型 ----
export const INTENT_TYPE = {
    ATTACK: 'attack',
    DEFEND: 'defend',
    BUFF: 'buff',
    DEBUFF: 'debuff',
    ATTACK_DEFEND: 'attack_defend',
    SPECIAL: 'special',
};

// ---- 节点类型 ----
export const NODE_TYPE = {
    BATTLE: 'battle',
    ELITE: 'elite',
    BOSS: 'boss',
    SHOP: 'shop',
    REST: 'rest',
    EVENT: 'event',
    START: 'start',
    TREASURE: 'treasure',
};

// ---- 药水效果 ----
export const POTION_TYPE = {
    HEAL: 'heal',           // 回复药水
    ENERGY: 'energy',       // 能量药水
    STRENGTH: 'strength',   // 力量药水
    DEXTERITY: 'dexterity', // 敏捷药水
    FIRE: 'fire',           // 火焰药水（对敌伤害）
};

// ---- 药水数据 ----
export const POTIONS = {
    heal_potion: {
        id: 'heal_potion',
        name: '回复药水',
        description: '回复25%最大HP',
        type: POTION_TYPE.HEAL,
        color: '#e74c3c',
        value: 0.25,
    },
    energy_potion: {
        id: 'energy_potion',
        name: '能量药水',
        description: '本回合获得2点能量',
        type: POTION_TYPE.ENERGY,
        color: '#f39c12',
        value: 2,
    },
    strength_potion: {
        id: 'strength_potion',
        name: '力量药水',
        description: '获得3点力量',
        type: POTION_TYPE.STRENGTH,
        color: '#c0392b',
        value: 3,
    },
    dexterity_potion: {
        id: 'dexterity_potion',
        name: '敏捷药水',
        description: '获得3点敏捷',
        type: POTION_TYPE.DEXTERITY,
        color: '#27ae60',
        value: 3,
    },
    fire_potion: {
        id: 'fire_potion',
        name: '火焰药水',
        description: '对所有敌人造成20伤害',
        type: POTION_TYPE.FIRE,
        color: '#e67e22',
        value: 20,
    },
};

// ---- 卡牌定义 (30+种) ----
export const CARD_DEFS = {
    // ===== 攻击牌 =====
    strike: {
        id: 'strike',
        name: '斩击',
        type: CARD_TYPE.ATTACK,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '造成6点伤害',
        effect: (player, enemies, combat) => {
            const dmg = 6 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
        },
    },
    heavy_strike: {
        id: 'heavy_strike',
        name: '重击',
        type: CARD_TYPE.ATTACK,
        cost: 2,
        rarity: RARITY.COMMON,
        description: '造成12点伤害',
        effect: (player, enemies, combat) => {
            const dmg = 12 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
        },
    },
    double_cut: {
        id: 'double_cut',
        name: '连斩',
        type: CARD_TYPE.ATTACK,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '造成4点伤害两次',
        effect: (player, enemies, combat) => {
            const dmg = 4 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
            combat.dealDamageToEnemy(enemies[0], dmg);
        },
    },
    poison_blade: {
        id: 'poison_blade',
        name: '毒刃',
        type: CARD_TYPE.ATTACK,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '造成4点伤害，施加3层中毒',
        effect: (player, enemies, combat) => {
            const dmg = 4 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
            enemies[0].addStatus(STATUS_EFFECTS.POISON, 3);
        },
    },
    burning_strike: {
        id: 'burning_strike',
        name: '燃烧斩',
        type: CARD_TYPE.ATTACK,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '造成4点伤害，施加2层易伤',
        effect: (player, enemies, combat) => {
            const dmg = 4 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
            enemies[0].addStatus(STATUS_EFFECTS.VULNERABLE, 2);
        },
    },
    critical_hit: {
        id: 'critical_hit',
        name: '暴击',
        type: CARD_TYPE.ATTACK,
        cost: 2,
        rarity: RARITY.COMMON,
        description: '造成14点伤害',
        effect: (player, enemies, combat) => {
            const dmg = 14 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
        },
    },
    whirlwind: {
        id: 'whirlwind',
        name: '旋风斩',
        type: CARD_TYPE.ATTACK,
        cost: 2,
        rarity: RARITY.RARE,
        description: '对所有敌人造成8点伤害',
        effect: (player, enemies, combat) => {
            const dmg = 8 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            enemies.forEach(e => {
                if (e.hp > 0) combat.dealDamageToEnemy(e, dmg);
            });
        },
    },
    pierce: {
        id: 'pierce',
        name: '穿刺',
        type: CARD_TYPE.ATTACK,
        cost: 2,
        rarity: RARITY.RARE,
        description: '造成10点伤害，无视护甲',
        effect: (player, enemies, combat) => {
            const dmg = 10 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            enemies[0].takeDamage(dmg, true); // ignore armor
        },
    },
    blood_thirst: {
        id: 'blood_thirst',
        name: '嗜血斩',
        type: CARD_TYPE.ATTACK,
        cost: 1,
        rarity: RARITY.RARE,
        description: '造成6点伤害，回复2点HP',
        effect: (player, enemies, combat) => {
            const dmg = 6 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
            player.heal(2);
        },
    },
    execute: {
        id: 'execute',
        name: '处刑',
        type: CARD_TYPE.ATTACK,
        cost: 2,
        rarity: RARITY.RARE,
        description: '造成8点伤害，若敌人HP<30%则伤害翻倍',
        effect: (player, enemies, combat) => {
            let dmg = 8 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            if (enemies[0].hp / enemies[0].maxHp < 0.3) dmg *= 2;
            combat.dealDamageToEnemy(enemies[0], dmg);
        },
    },
    cleave: {
        id: 'cleave',
        name: '横扫',
        type: CARD_TYPE.ATTACK,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '对所有敌人造成5点伤害',
        effect: (player, enemies, combat) => {
            const dmg = 5 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            enemies.forEach(e => {
                if (e.hp > 0) combat.dealDamageToEnemy(e, dmg);
            });
        },
    },
    blade_storm: {
        id: 'blade_storm',
        name: '剑刃风暴',
        type: CARD_TYPE.ATTACK,
        cost: 3,
        rarity: RARITY.LEGENDARY,
        description: '造成5点伤害五次',
        effect: (player, enemies, combat) => {
            const dmg = 5 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            for (let i = 0; i < 5; i++) {
                if (enemies[0].hp > 0) combat.dealDamageToEnemy(enemies[0], dmg);
            }
        },
    },
    heavy_swing: {
        id: 'heavy_swing',
        name: '蓄力重劈',
        type: CARD_TYPE.ATTACK,
        cost: 3,
        rarity: RARITY.RARE,
        description: '造成24点伤害',
        effect: (player, enemies, combat) => {
            const dmg = 24 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
        },
    },
    quick_slash: {
        id: 'quick_slash',
        name: '快斩',
        type: CARD_TYPE.ATTACK,
        cost: 0,
        rarity: RARITY.RARE,
        description: '造成3点伤害',
        effect: (player, enemies, combat) => {
            const dmg = 3 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
        },
    },

    // ===== 防御牌 =====
    defend: {
        id: 'defend',
        name: '防御',
        type: CARD_TYPE.DEFENSE,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '获得5点护甲',
        effect: (player) => {
            const block = 5 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
        },
    },
    iron_wall: {
        id: 'iron_wall',
        name: '铁壁',
        type: CARD_TYPE.DEFENSE,
        cost: 2,
        rarity: RARITY.COMMON,
        description: '获得12点护甲',
        effect: (player) => {
            const block = 12 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
        },
    },
    shield_up: {
        id: 'shield_up',
        name: '举盾',
        type: CARD_TYPE.DEFENSE,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '获得7点护甲',
        effect: (player) => {
            const block = 7 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
        },
    },
    counter_stance: {
        id: 'counter_stance',
        name: '反击姿态',
        type: CARD_TYPE.DEFENSE,
        cost: 1,
        rarity: RARITY.RARE,
        description: '获得5点护甲，获得2层荆棘',
        effect: (player) => {
            const block = 5 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
            player.addStatus(STATUS_EFFECTS.THORNS, 2);
        },
    },
    unbreakable: {
        id: 'unbreakable',
        name: '坚不可摧',
        type: CARD_TYPE.DEFENSE,
        cost: 2,
        rarity: RARITY.RARE,
        description: '获得18点护甲',
        effect: (player) => {
            const block = 18 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
        },
    },
    shield_wall: {
        id: 'shield_wall',
        name: '盾墙',
        type: CARD_TYPE.DEFENSE,
        cost: 3,
        rarity: RARITY.LEGENDARY,
        description: '获得30点护甲',
        effect: (player) => {
            const block = 30 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
        },
    },
    evasion: {
        id: 'evasion',
        name: '闪避',
        type: CARD_TYPE.DEFENSE,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '获得4点护甲，获得1层敏捷',
        effect: (player) => {
            const block = 4 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
            player.addStatus(STATUS_EFFECTS.DEXTERITY, 1);
        },
    },
    barricade: {
        id: 'barricade',
        name: '堡垒',
        type: CARD_TYPE.DEFENSE,
        cost: 2,
        rarity: RARITY.LEGENDARY,
        description: '获得10点护甲，护甲不再在回合结束清零',
        effect: (player, enemies, combat) => {
            const block = 10 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
            combat.keepArmor = true;
        },
    },

    // ===== 技能牌 =====
    heal: {
        id: 'heal',
        name: '治疗术',
        type: CARD_TYPE.SKILL,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '回复5点HP',
        effect: (player) => {
            player.heal(5);
        },
    },
    strengthen: {
        id: 'strengthen',
        name: '强化',
        type: CARD_TYPE.SKILL,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '获得2层力量',
        effect: (player) => {
            player.addStatus(STATUS_EFFECTS.STRENGTH, 2);
        },
    },
    weaken: {
        id: 'weaken',
        name: '弱化',
        type: CARD_TYPE.SKILL,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '给敌人施加2层虚弱',
        effect: (player, enemies) => {
            enemies[0].addStatus(STATUS_EFFECTS.WEAKNESS, 2);
        },
    },
    war_cry: {
        id: 'war_cry',
        name: '战吼',
        type: CARD_TYPE.SKILL,
        cost: 0,
        rarity: RARITY.COMMON,
        description: '弃1张牌，抽2张牌',
        effect: (player, enemies, combat) => {
            combat.discardRandom(1);
            combat.drawCards(2);
        },
    },
    tactical_retreat: {
        id: 'tactical_retreat',
        name: '战术撤退',
        type: CARD_TYPE.SKILL,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '获得4点护甲，抽1张牌',
        effect: (player, enemies, combat) => {
            const block = 4 + player.getStatus(STATUS_EFFECTS.DEXTERITY);
            player.addArmor(block);
            combat.drawCards(1);
        },
    },
    haste: {
        id: 'haste',
        name: '急速',
        type: CARD_TYPE.SKILL,
        cost: 0,
        rarity: RARITY.RARE,
        description: '抽3张牌',
        effect: (player, enemies, combat) => {
            combat.drawCards(3);
        },
    },
    power_up: {
        id: 'power_up',
        name: '蓄力',
        type: CARD_TYPE.SKILL,
        cost: 2,
        rarity: RARITY.RARE,
        description: '获得3层力量',
        effect: (player) => {
            player.addStatus(STATUS_EFFECTS.STRENGTH, 3);
        },
    },
    poison_fog: {
        id: 'poison_fog',
        name: '毒雾',
        type: CARD_TYPE.SKILL,
        cost: 2,
        rarity: RARITY.RARE,
        description: '对所有敌人施加6层中毒',
        effect: (player, enemies) => {
            enemies.forEach(e => {
                if (e.hp > 0) e.addStatus(STATUS_EFFECTS.POISON, 6);
            });
        },
    },
    berserk: {
        id: 'berserk',
        name: '狂暴',
        type: CARD_TYPE.SKILL,
        cost: 0,
        rarity: RARITY.RARE,
        description: '获得2点能量，失去5点HP',
        effect: (player, enemies, combat) => {
            combat.addEnergy(2);
            player.takeDamage(5, true);
        },
    },
    life_drain: {
        id: 'life_drain',
        name: '生命汲取',
        type: CARD_TYPE.SKILL,
        cost: 2,
        rarity: RARITY.LEGENDARY,
        description: '造成8点伤害，回复等量HP',
        effect: (player, enemies, combat) => {
            const dmg = 8 + player.getStatus(STATUS_EFFECTS.STRENGTH);
            combat.dealDamageToEnemy(enemies[0], dmg);
            player.heal(Math.min(dmg, enemies[0].lastDamageTaken || dmg));
        },
    },
    bloodlust: {
        id: 'bloodlust',
        name: '嗜血',
        type: CARD_TYPE.SKILL,
        cost: 1,
        rarity: RARITY.LEGENDARY,
        description: '本回合力量翻倍',
        effect: (player) => {
            const str = player.getStatus(STATUS_EFFECTS.STRENGTH);
            player.addStatus(STATUS_EFFECTS.STRENGTH, str);
        },
    },
    purify: {
        id: 'purify',
        name: '净化',
        type: CARD_TYPE.SKILL,
        cost: 1,
        rarity: RARITY.COMMON,
        description: '移除自身所有负面状态',
        effect: (player) => {
            player.removeStatus(STATUS_EFFECTS.WEAKNESS);
            player.removeStatus(STATUS_EFFECTS.VULNERABLE);
            player.removeStatus(STATUS_EFFECTS.POISON);
        },
    },
    offering: {
        id: 'offering',
        name: '献祭',
        type: CARD_TYPE.SKILL,
        cost: 0,
        rarity: RARITY.LEGENDARY,
        description: '失去6点HP，获得2点能量，抽3张牌',
        effect: (player, enemies, combat) => {
            player.takeDamage(6, true);
            combat.addEnergy(2);
            combat.drawCards(3);
        },
    },
    metallicize: {
        id: 'metallicize',
        name: '金属化',
        type: CARD_TYPE.SKILL,
        cost: 1,
        rarity: RARITY.RARE,
        description: '获得3层荆棘',
        effect: (player) => {
            player.addStatus(STATUS_EFFECTS.THORNS, 3);
        },
    },
    flex: {
        id: 'flex',
        name: '屈伸',
        type: CARD_TYPE.SKILL,
        cost: 0,
        rarity: RARITY.COMMON,
        description: '获得2层力量（回合结束失去）',
        effect: (player) => {
            player.addStatus(STATUS_EFFECTS.STRENGTH, 2);
            player.tempStrength += 2;
        },
    },
};

// ---- 初始牌组 ----
export const STARTING_DECK = [
    'strike', 'strike', 'strike', 'strike', 'strike',
    'defend', 'defend', 'defend', 'defend',
    'heal',
];

// ---- 商店价格 ----
export const SHOP_PRICES = {
    CARD_COMMON: 50,
    CARD_RARE: 80,
    CARD_LEGENDARY: 150,
    REMOVE_CARD: 75,
    POTION: 30,
};

// ---- 商店卡牌池 ----
export const SHOP_CARD_POOL = [
    'heavy_strike', 'double_cut', 'poison_blade', 'burning_strike', 'critical_hit',
    'cleave', 'shield_up', 'iron_wall', 'evasion', 'counter_stance',
    'strengthen', 'weaken', 'tactical_retreat', 'war_cry', 'purify', 'flex',
    'whirlwind', 'pierce', 'blood_thirst', 'execute', 'heavy_swing', 'quick_slash',
    'unbreakable', 'haste', 'power_up', 'poison_fog', 'berserk', 'metallicize',
    'blade_storm', 'shield_wall', 'life_drain', 'bloodlust', 'offering', 'barricade',
];

// ---- 敌人定义 ----
export const ENEMY_DEFS = {
    // === 普通敌人 ===
    slime: {
        id: 'slime',
        name: '史莱姆',
        maxHp: [28, 35],
        type: 'normal',
        gold: [5, 10],
        emoji: '🟢',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 6, weight: 50 },
            { intent: INTENT_TYPE.ATTACK, damage: 9, weight: 25 },
            { intent: INTENT_TYPE.DEFEND, armor: 5, weight: 25 },
        ],
    },
    skeleton: {
        id: 'skeleton',
        name: '骷髅兵',
        maxHp: [35, 45],
        type: 'normal',
        gold: [8, 15],
        emoji: '💀',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 8, weight: 40 },
            { intent: INTENT_TYPE.ATTACK, damage: 12, weight: 30 },
            { intent: INTENT_TYPE.ATTACK_DEFEND, damage: 6, armor: 4, weight: 30 },
        ],
    },
    bat: {
        id: 'bat',
        name: '蝙蝠',
        maxHp: [20, 26],
        type: 'normal',
        gold: [5, 10],
        emoji: '🦇',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 5, weight: 40 },
            { intent: INTENT_TYPE.ATTACK, damage: 5, hits: 2, weight: 30 },
            { intent: INTENT_TYPE.DEBUFF, status: STATUS_EFFECTS.WEAKNESS, stacks: 1, weight: 30 },
        ],
    },
    goblin: {
        id: 'goblin',
        name: '哥布林',
        maxHp: [30, 40],
        type: 'normal',
        gold: [10, 18],
        emoji: '👺',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 7, weight: 35 },
            { intent: INTENT_TYPE.ATTACK, damage: 10, weight: 30 },
            { intent: INTENT_TYPE.ATTACK_DEFEND, damage: 5, armor: 5, weight: 20 },
            { intent: INTENT_TYPE.DEBUFF, status: STATUS_EFFECTS.VULNERABLE, stacks: 1, weight: 15 },
        ],
    },
    poison_snake: {
        id: 'poison_snake',
        name: '毒蛇',
        maxHp: [32, 42],
        type: 'normal',
        gold: [8, 15],
        emoji: '🐍',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 6, weight: 30 },
            { intent: INTENT_TYPE.DEBUFF, status: STATUS_EFFECTS.POISON, stacks: 4, weight: 40 },
            { intent: INTENT_TYPE.ATTACK, damage: 9, weight: 30 },
        ],
    },
    fungi: {
        id: 'fungi',
        name: '毒蘑菇',
        maxHp: [25, 32],
        type: 'normal',
        gold: [5, 12],
        emoji: '🍄',
        patterns: [
            { intent: INTENT_TYPE.DEBUFF, status: STATUS_EFFECTS.POISON, stacks: 3, weight: 40 },
            { intent: INTENT_TYPE.BUFF, status: STATUS_EFFECTS.STRENGTH, stacks: 2, weight: 30 },
            { intent: INTENT_TYPE.ATTACK, damage: 5, weight: 30 },
        ],
    },

    // === 精英敌人 ===
    elite_skeleton: {
        id: 'elite_skeleton',
        name: '骷髅将军',
        maxHp: [65, 80],
        type: 'elite',
        gold: [25, 40],
        emoji: '⚔️',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 14, weight: 30 },
            { intent: INTENT_TYPE.ATTACK_DEFEND, damage: 10, armor: 8, weight: 25 },
            { intent: INTENT_TYPE.BUFF, status: STATUS_EFFECTS.STRENGTH, stacks: 3, weight: 20 },
            { intent: INTENT_TYPE.ATTACK, damage: 20, weight: 25 },
        ],
    },
    shadow_assassin: {
        id: 'shadow_assassin',
        name: '暗影刺客',
        maxHp: [55, 70],
        type: 'elite',
        gold: [25, 40],
        emoji: '🥷',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 12, weight: 25 },
            { intent: INTENT_TYPE.DEBUFF, status: STATUS_EFFECTS.VULNERABLE, stacks: 2, weight: 20 },
            { intent: INTENT_TYPE.ATTACK, damage: 18, weight: 25 },
            { intent: INTENT_TYPE.ATTACK, damage: 8, hits: 3, weight: 30 },
        ],
    },
    gargoyle: {
        id: 'gargoyle',
        name: '石像鬼',
        maxHp: [70, 90],
        type: 'elite',
        gold: [30, 45],
        emoji: '🗿',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 10, weight: 25 },
            { intent: INTENT_TYPE.DEFEND, armor: 15, weight: 25 },
            { intent: INTENT_TYPE.ATTACK_DEFEND, damage: 12, armor: 8, weight: 30 },
            { intent: INTENT_TYPE.BUFF, status: STATUS_EFFECTS.STRENGTH, stacks: 2, weight: 20 },
        ],
    },

    // === BOSS ===
    skeleton_king: {
        id: 'skeleton_king',
        name: '骷髅王',
        maxHp: [120, 140],
        type: 'boss',
        gold: [60, 80],
        emoji: '👑',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 12, weight: 25 },
            { intent: INTENT_TYPE.ATTACK_DEFEND, damage: 10, armor: 12, weight: 20 },
            { intent: INTENT_TYPE.BUFF, status: STATUS_EFFECTS.STRENGTH, stacks: 3, weight: 15 },
            { intent: INTENT_TYPE.ATTACK, damage: 8, hits: 3, weight: 20 },
            { intent: INTENT_TYPE.DEBUFF, status: STATUS_EFFECTS.VULNERABLE, stacks: 2, weight: 20 },
        ],
    },
    shadow_dragon: {
        id: 'shadow_dragon',
        name: '暗影龙',
        maxHp: [160, 180],
        type: 'boss',
        gold: [70, 100],
        emoji: '🐉',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 18, weight: 25 },
            { intent: INTENT_TYPE.ATTACK, damage: 10, hits: 2, weight: 20 },
            { intent: INTENT_TYPE.BUFF, status: STATUS_EFFECTS.STRENGTH, stacks: 4, weight: 15 },
            { intent: INTENT_TYPE.ATTACK_DEFEND, damage: 14, armor: 10, weight: 20 },
            { intent: INTENT_TYPE.SPECIAL, name: '龙息', damage: 25, weight: 20 },
        ],
    },
    death: {
        id: 'death',
        name: '死神',
        maxHp: [200, 220],
        type: 'boss',
        gold: [80, 120],
        emoji: '💀',
        patterns: [
            { intent: INTENT_TYPE.ATTACK, damage: 15, weight: 20 },
            { intent: INTENT_TYPE.DEBUFF, status: STATUS_EFFECTS.POISON, stacks: 8, weight: 15 },
            { intent: INTENT_TYPE.ATTACK, damage: 10, hits: 3, weight: 20 },
            { intent: INTENT_TYPE.BUFF, status: STATUS_EFFECTS.STRENGTH, stacks: 5, weight: 15 },
            { intent: INTENT_TYPE.SPECIAL, name: '收割', damage: 30, weight: 15 },
            { intent: INTENT_TYPE.ATTACK_DEFEND, damage: 12, armor: 15, weight: 15 },
        ],
    },
};

// ---- 按楼层获取敌人池 ----
export function getEnemyPool(floor) {
    if (floor === 0) return ['slime', 'bat', 'fungi'];
    if (floor === 1) return ['skeleton', 'goblin', 'poison_snake', 'fungi'];
    return ['skeleton', 'goblin', 'poison_snake'];
}

export function getElitePool(floor) {
    if (floor === 0) return ['elite_skeleton'];
    if (floor === 1) return ['elite_skeleton', 'shadow_assassin'];
    return ['shadow_assassin', 'gargoyle'];
}

export function getBoss(floor) {
    if (floor === 0) return 'skeleton_king';
    if (floor === 1) return 'shadow_dragon';
    return 'death';
}

// ---- 随机事件 ----
export const EVENTS = [
    {
        id: 'fountain',
        title: '神秘喷泉',
        description: '你发现了一处散发着微光的泉水...',
        emoji: '⛲',
        choices: [
            { text: '饮水恢复 (回复25%HP)', effect: 'heal_percent', value: 0.25 },
            { text: '离开', effect: 'none' },
        ],
    },
    {
        id: 'merchant_ghost',
        title: '幽灵商人',
        description: '一个透明的商人向你招手，他的货物漂浮在空中...',
        emoji: '👻',
        choices: [
            { text: '花30金币购买随机稀有卡', effect: 'buy_rare_card', value: 30 },
            { text: '花50金币获得5点最大HP', effect: 'max_hp_up', value: 50, hpGain: 5 },
            { text: '离开', effect: 'none' },
        ],
    },
    {
        id: 'shrine',
        title: '古老祭坛',
        description: '一座被遗忘的祭坛，上面刻着神秘的符文...',
        emoji: '🏛️',
        choices: [
            { text: '祈祷 (获得2层力量)', effect: 'gain_strength', value: 2 },
            { text: '供奉 (失去10%HP，获得稀有卡)', effect: 'sacrifice_for_card', value: 0.10 },
            { text: '离开', effect: 'none' },
        ],
    },
    {
        id: 'treasure_chest',
        title: '宝箱',
        description: '一个古老的宝箱，似乎没有陷阱...',
        emoji: '📦',
        choices: [
            { text: '打开 (获得50-100金币)', effect: 'gold', value: [50, 100] },
            { text: '离开', effect: 'none' },
        ],
    },
    {
        id: 'training_dummy',
        title: '训练假人',
        description: '一个破旧的训练假人，可以用来练习...',
        emoji: '🎯',
        choices: [
            { text: '练习攻击 (获得1层力量)', effect: 'gain_strength', value: 1 },
            { text: '练习防御 (获得1层敏捷)', effect: 'gain_dexterity', value: 1 },
            { text: '离开', effect: 'none' },
        ],
    },
    {
        id: 'blacksmith',
        title: '铁匠铺',
        description: '废弃的铁匠铺中炉火仍在燃烧...',
        emoji: '🔨',
        choices: [
            { text: '升级武器 (获得2层力量)', effect: 'gain_strength', value: 2 },
            { text: '加固护甲 (获得2层敏捷)', effect: 'gain_dexterity', value: 2 },
            { text: '离开', effect: 'none' },
        ],
    },
    {
        id: 'mushroom_grove',
        title: '蘑菇林',
        description: '奇异的蘑菇散发着荧光...',
        emoji: '🍄',
        choices: [
            { text: '食用蘑菇 (随机效果)', effect: 'random_buff' },
            { text: '离开', effect: 'none' },
        ],
    },
];

// ---- 颜色配置 ----
export const COLORS = {
    CARD_ATTACK: '#c0392b',
    CARD_DEFENSE: '#2980b9',
    CARD_SKILL: '#27ae60',
    RARITY_COMMON: '#95a5a6',
    RARITY_RARE: '#3498db',
    RARITY_LEGENDARY: '#f39c12',
    HP_BAR: '#e74c3c',
    ARMOR_COLOR: '#3498db',
    ENERGY_COLOR: '#f39c12',
    GOLD_COLOR: '#f1c40f',
    NODE_BATTLE: '#e74c3c',
    NODE_ELITE: '#e67e22',
    NODE_BOSS: '#8e44ad',
    NODE_SHOP: '#27ae60',
    NODE_REST: '#2ecc71',
    NODE_EVENT: '#3498db',
    NODE_TREASURE: '#f1c40f',
    NODE_START: '#95a5a6',
};

// ---- 状态效果中文名 ----
export const STATUS_NAMES = {
    [STATUS_EFFECTS.STRENGTH]: '力量',
    [STATUS_EFFECTS.DEXTERITY]: '敏捷',
    [STATUS_EFFECTS.POISON]: '中毒',
    [STATUS_EFFECTS.WEAKNESS]: '虚弱',
    [STATUS_EFFECTS.VULNERABLE]: '易伤',
    [STATUS_EFFECTS.REGEN]: '回复',
    [STATUS_EFFECTS.THORNS]: '荆棘',
    [STATUS_EFFECTS.RITUAL]: '仪式',
    [STATUS_EFFECTS.SHARP]: '锋利',
};

export const STATUS_EMOJI = {
    [STATUS_EFFECTS.STRENGTH]: '💪',
    [STATUS_EFFECTS.DEXTERITY]: '🏃',
    [STATUS_EFFECTS.POISON]: '☠️',
    [STATUS_EFFECTS.WEAKNESS]: '😵',
    [STATUS_EFFECTS.VULNERABLE]: '💥',
    [STATUS_EFFECTS.REGEN]: '💚',
    [STATUS_EFFECTS.THORNS]: '🌿',
    [STATUS_EFFECTS.RITUAL]: '🔮',
    [STATUS_EFFECTS.SHARP]: '⚔️',
};
