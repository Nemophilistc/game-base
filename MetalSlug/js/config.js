// ============================================
// MetalSlug 游戏配置文件
// ============================================

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 700;

// 物理常量
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const MAX_FALL_SPEED = 15;

// 玩家配置
export const PLAYER = {
    width: 40,
    height: 60,
    speed: 4,
    jumpForce: -13,
    maxHP: 100,
    invincibleTime: 1500,
    grenadeCooldown: 800,
    maxGrenades: 10
};

// 武器配置
export const WEAPONS = {
    pistol: {
        name: '手枪',
        damage: 15,
        fireRate: 300,
        bulletSpeed: 12,
        spread: 0.02,
        ammo: Infinity,
        maxAmmo: Infinity,
        bulletSize: 4,
        color: '#FFD700',
        sound: 'pistol'
    },
    machinegun: {
        name: '机枪',
        damage: 12,
        fireRate: 80,
        bulletSpeed: 14,
        spread: 0.05,
        ammo: 200,
        maxAmmo: 200,
        bulletSize: 3,
        color: '#FF6600',
        sound: 'machinegun'
    },
    shotgun: {
        name: '散弹枪',
        damage: 10,
        fireRate: 600,
        bulletSpeed: 11,
        spread: 0.3,
        pellets: 6,
        ammo: 50,
        maxAmmo: 50,
        bulletSize: 3,
        color: '#FF3333',
        sound: 'shotgun'
    },
    rocket: {
        name: '火箭筒',
        damage: 80,
        fireRate: 1000,
        bulletSpeed: 8,
        spread: 0,
        ammo: 20,
        maxAmmo: 20,
        bulletSize: 8,
        explosive: true,
        explosionRadius: 80,
        color: '#FF0000',
        sound: 'rocket'
    },
    laser: {
        name: '激光枪',
        damage: 5,
        fireRate: 50,
        bulletSpeed: 20,
        spread: 0,
        ammo: 300,
        maxAmmo: 300,
        bulletSize: 6,
        piercing: true,
        color: '#00FFFF',
        sound: 'laser'
    }
};

// 敌人配置
export const ENEMIES = {
    infantry: {
        name: '步兵',
        width: 36,
        height: 56,
        hp: 30,
        speed: 1.5,
        damage: 10,
        fireRate: 1500,
        score: 100,
        color: '#4A7023'
    },
    gunner: {
        name: '机枪手',
        width: 40,
        height: 56,
        hp: 60,
        speed: 0.8,
        damage: 8,
        fireRate: 400,
        score: 200,
        color: '#5C4033'
    },
    tank: {
        name: '坦克',
        width: 120,
        height: 70,
        hp: 300,
        speed: 1,
        damage: 25,
        fireRate: 2000,
        score: 500,
        color: '#556B2F',
        vehicle: true
    },
    helicopter: {
        name: '直升机',
        width: 100,
        height: 50,
        hp: 200,
        speed: 2,
        damage: 15,
        fireRate: 800,
        score: 400,
        color: '#708090',
        flying: true
    },
    boss: {
        name: 'Boss',
        width: 180,
        height: 160,
        hp: 2000,
        speed: 1.2,
        damage: 30,
        fireRate: 1000,
        score: 5000,
        color: '#8B0000'
    }
};

// 道具配置
export const ITEMS = {
    weaponBox: { name: '武器箱', width: 30, height: 30, color: '#DAA520' },
    ammo: { name: '弹药', width: 20, height: 20, color: '#FFD700' },
    medkit: { name: '血包', width: 25, height: 25, color: '#FF0000' },
    grenade: { name: '手雷', width: 18, height: 22, color: '#2E8B57' },
    vehicle: { name: '载具', width: 120, height: 70, color: '#556B2F' }
};

// 关卡配置
export const LEVELS = [
    {
        name: '城市废墟',
        bgColor: '#1a1a2e',
        groundColor: '#3a3a4a',
        width: 6000,
        platforms: [
            { x: 300, y: 450, w: 200, h: 20 },
            { x: 600, y: 380, w: 150, h: 20 },
            { x: 900, y: 320, w: 180, h: 20 },
            { x: 1300, y: 420, w: 250, h: 20 },
            { x: 1700, y: 350, w: 200, h: 20 },
            { x: 2200, y: 400, w: 300, h: 20 },
            { x: 2800, y: 350, w: 200, h: 20 },
            { x: 3200, y: 300, w: 180, h: 20 },
            { x: 3700, y: 400, w: 250, h: 20 },
            { x: 4200, y: 350, w: 200, h: 20 },
            { x: 4700, y: 420, w: 300, h: 20 },
            { x: 5200, y: 350, w: 250, h: 20 }
        ],
        enemies: [
            { type: 'infantry', x: 500, y: 0 },
            { type: 'infantry', x: 800, y: 0 },
            { type: 'gunner', x: 1200, y: 0 },
            { type: 'infantry', x: 1600, y: 0 },
            { type: 'infantry', x: 2000, y: 0 },
            { type: 'tank', x: 2500, y: 0 },
            { type: 'infantry', x: 2800, y: 0 },
            { type: 'gunner', x: 3200, y: 0 },
            { type: 'helicopter', x: 3600, y: 100 },
            { type: 'infantry', x: 4000, y: 0 },
            { type: 'gunner', x: 4400, y: 0 },
            { type: 'infantry', x: 4800, y: 0 }
        ],
        destructibles: [
            { type: 'barrel', x: 700, y: 0, explosive: true },
            { type: 'barrel', x: 1500, y: 0, explosive: true },
            { type: 'building', x: 2000, y: 0, hp: 100 },
            { type: 'barrel', x: 3000, y: 0, explosive: true },
            { type: 'building', x: 3800, y: 0, hp: 150 },
            { type: 'barrel', x: 4500, y: 0, explosive: true }
        ],
        items: [
            { type: 'weaponBox', x: 650, y: 360 },
            { type: 'medkit', x: 1400, y: 400 },
            { type: 'ammo', x: 2100, y: 380 },
            { type: 'grenade', x: 2900, y: 330 },
            { type: 'weaponBox', x: 3500, y: 280 },
            { type: 'medkit', x: 4300, y: 330 }
        ],
        boss: { type: 'boss', x: 5500, y: 0, name: '铁甲暴君' }
    },
    {
        name: '丛林密道',
        bgColor: '#0a2e1a',
        groundColor: '#2d5a1e',
        width: 7000,
        platforms: [
            { x: 250, y: 420, w: 180, h: 20 },
            { x: 550, y: 360, w: 160, h: 20 },
            { x: 850, y: 300, w: 200, h: 20 },
            { x: 1200, y: 400, w: 220, h: 20 },
            { x: 1600, y: 340, w: 180, h: 20 },
            { x: 2000, y: 280, w: 200, h: 20 },
            { x: 2400, y: 420, w: 250, h: 20 },
            { x: 2900, y: 350, w: 200, h: 20 },
            { x: 3400, y: 300, w: 180, h: 20 },
            { x: 3900, y: 380, w: 220, h: 20 },
            { x: 4400, y: 320, w: 200, h: 20 },
            { x: 4900, y: 400, w: 250, h: 20 },
            { x: 5400, y: 340, w: 200, h: 20 },
            { x: 5900, y: 380, w: 220, h: 20 },
            { x: 6400, y: 350, w: 200, h: 20 }
        ],
        enemies: [
            { type: 'infantry', x: 400, y: 0 },
            { type: 'infantry', x: 700, y: 0 },
            { type: 'gunner', x: 1100, y: 0 },
            { type: 'infantry', x: 1500, y: 0 },
            { type: 'helicopter', x: 1900, y: 80 },
            { type: 'infantry', x: 2300, y: 0 },
            { type: 'gunner', x: 2700, y: 0 },
            { type: 'tank', x: 3100, y: 0 },
            { type: 'infantry', x: 3500, y: 0 },
            { type: 'gunner', x: 3900, y: 0 },
            { type: 'helicopter', x: 4300, y: 90 },
            { type: 'infantry', x: 4700, y: 0 },
            { type: 'gunner', x: 5100, y: 0 },
            { type: 'tank', x: 5500, y: 0 },
            { type: 'infantry', x: 5900, y: 0 },
            { type: 'gunner', x: 6200, y: 0 }
        ],
        destructibles: [
            { type: 'barrel', x: 600, y: 0, explosive: true },
            { type: 'barrel', x: 1300, y: 0, explosive: true },
            { type: 'building', x: 2100, y: 0, hp: 120 },
            { type: 'barrel', x: 3000, y: 0, explosive: true },
            { type: 'barrel', x: 3800, y: 0, explosive: true },
            { type: 'building', x: 4600, y: 0, hp: 130 },
            { type: 'barrel', x: 5400, y: 0, explosive: true },
            { type: 'building', x: 6000, y: 0, hp: 140 }
        ],
        items: [
            { type: 'weaponBox', x: 500, y: 340 },
            { type: 'medkit', x: 1000, y: 280 },
            { type: 'ammo', x: 1800, y: 320 },
            { type: 'grenade', x: 2500, y: 400 },
            { type: 'vehicle', x: 3000, y: 0 },
            { type: 'weaponBox', x: 3700, y: 280 },
            { type: 'medkit', x: 4500, y: 300 },
            { type: 'ammo', x: 5200, y: 380 },
            { type: 'weaponBox', x: 6000, y: 360 }
        ],
        boss: { type: 'boss', x: 6500, y: 0, name: '丛林巨蟒' }
    },
    {
        name: '敌军基地',
        bgColor: '#2e1a1a',
        groundColor: '#4a3a3a',
        width: 8000,
        platforms: [
            { x: 200, y: 440, w: 200, h: 20 },
            { x: 500, y: 370, w: 180, h: 20 },
            { x: 800, y: 300, w: 200, h: 20 },
            { x: 1100, y: 420, w: 250, h: 20 },
            { x: 1500, y: 350, w: 180, h: 20 },
            { x: 1900, y: 280, w: 200, h: 20 },
            { x: 2300, y: 400, w: 220, h: 20 },
            { x: 2700, y: 330, w: 200, h: 20 },
            { x: 3100, y: 260, w: 180, h: 20 },
            { x: 3500, y: 420, w: 250, h: 20 },
            { x: 3900, y: 350, w: 200, h: 20 },
            { x: 4300, y: 280, w: 220, h: 20 },
            { x: 4700, y: 400, w: 200, h: 20 },
            { x: 5100, y: 330, w: 180, h: 20 },
            { x: 5500, y: 380, w: 250, h: 20 },
            { x: 5900, y: 300, w: 200, h: 20 },
            { x: 6300, y: 350, w: 220, h: 20 },
            { x: 6700, y: 400, w: 200, h: 20 },
            { x: 7100, y: 350, w: 250, h: 20 },
            { x: 7500, y: 380, w: 200, h: 20 }
        ],
        enemies: [
            { type: 'infantry', x: 350, y: 0 },
            { type: 'gunner', x: 650, y: 0 },
            { type: 'infantry', x: 950, y: 0 },
            { type: 'tank', x: 1300, y: 0 },
            { type: 'infantry', x: 1700, y: 0 },
            { type: 'gunner', x: 2100, y: 0 },
            { type: 'helicopter', x: 2500, y: 80 },
            { type: 'infantry', x: 2900, y: 0 },
            { type: 'gunner', x: 3300, y: 0 },
            { type: 'tank', x: 3700, y: 0 },
            { type: 'helicopter', x: 4100, y: 90 },
            { type: 'infantry', x: 4500, y: 0 },
            { type: 'gunner', x: 4900, y: 0 },
            { type: 'tank', x: 5300, y: 0 },
            { type: 'helicopter', x: 5700, y: 80 },
            { type: 'infantry', x: 6100, y: 0 },
            { type: 'gunner', x: 6500, y: 0 },
            { type: 'tank', x: 6900, y: 0 },
            { type: 'helicopter', x: 7200, y: 90 },
            { type: 'gunner', x: 7400, y: 0 }
        ],
        destructibles: [
            { type: 'barrel', x: 500, y: 0, explosive: true },
            { type: 'building', x: 1000, y: 0, hp: 150 },
            { type: 'barrel', x: 1600, y: 0, explosive: true },
            { type: 'barrel', x: 2200, y: 0, explosive: true },
            { type: 'building', x: 2800, y: 0, hp: 160 },
            { type: 'barrel', x: 3400, y: 0, explosive: true },
            { type: 'building', x: 4000, y: 0, hp: 170 },
            { type: 'barrel', x: 4600, y: 0, explosive: true },
            { type: 'barrel', x: 5200, y: 0, explosive: true },
            { type: 'building', x: 5800, y: 0, hp: 180 },
            { type: 'barrel', x: 6400, y: 0, explosive: true },
            { type: 'building', x: 7000, y: 0, hp: 200 }
        ],
        items: [
            { type: 'weaponBox', x: 400, y: 420 },
            { type: 'medkit', x: 900, y: 280 },
            { type: 'ammo', x: 1400, y: 400 },
            { type: 'grenade', x: 2000, y: 260 },
            { type: 'vehicle', x: 2600, y: 0 },
            { type: 'weaponBox', x: 3200, y: 240 },
            { type: 'medkit', x: 3800, y: 330 },
            { type: 'ammo', x: 4400, y: 260 },
            { type: 'weaponBox', x: 5000, y: 310 },
            { type: 'medkit', x: 5600, y: 360 },
            { type: 'grenade', x: 6200, y: 330 },
            { type: 'vehicle', x: 6800, y: 0 },
            { type: 'weaponBox', x: 7300, y: 330 }
        ],
        boss: { type: 'boss', x: 7500, y: 0, name: '终极机甲' }
    }
];

// 地面Y坐标
export const GROUND_Y = CANVAS_HEIGHT - 80;

// 颜色
export const COLORS = {
    sky: '#0f0f23',
    ground: '#3a3a4a',
    player: '#4488FF',
    playerDark: '#2266CC',
    bullet: '#FFD700',
    explosion: '#FF4500',
    smoke: '#666666',
    blood: '#CC0000'
};
