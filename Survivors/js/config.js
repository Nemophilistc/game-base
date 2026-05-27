// ============================================================
// 末日幸存者 - 全局配置和共享状态
// ============================================================

export const CONFIG = {
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 700,
    PLAYER_SPEED: 4,
    PLAYER_MAX_HP: 100,
    PLAYER_SIZE: 20,
    ENEMY_SIZE: 15,
    EXP_PER_LEVEL: 60,
    EXP_GROWTH: 1.2,
    ENEMY_SPAWN_RATE: 45, // 帧，更快出怪
    ENEMY_SPAWN_RATE_MIN: 15,
    ENEMY_SPAWN_RATE_DECREASE: 0.5,
    MAX_ENEMIES: 250,
    ITEM_MAGNET_RANGE: 100,
    CAMERA_SMOOTH: 0.1
};

// 共享游戏状态（所有模块通过 import 引用同一对象）
export const game = {
    state: 'menu', // menu, playing, levelup, gameover
    time: 0,
    kills: 0,
    camera: { x: 0, y: 0 },
    shake: { x: 0, y: 0, intensity: 0 },
    difficulty: 1,
    loopRunning: false,
    flashColor: null,
    flashTimer: 0,
    spawnTimer: 0,
    spawnRate: CONFIG.ENEMY_SPAWN_RATE,
    ctx: null,        // main.js 初始化后设置
    canvas: null       // main.js 初始化后设置
};

export const state = {
    player: null,
    enemies: [],
    projectiles: [],
    expOrbs: [],
    particles: [],
    damageNumbers: []
};

export const keys = {};

// 升级选项元数据（apply 在 ui.js 中绑定）
export const UPGRADE_DEFS = [
    { id: 'sword', name: '剑气', icon: '🗡️', desc: '发射剑气攻击最近的敌人' },
    { id: 'fire', name: '火球', icon: '🔥', desc: '发射火球造成范围伤害' },
    { id: 'lightning', name: '闪电', icon: '⚡', desc: '闪电链，可弹射多个敌人' },
    { id: 'orbit', name: '光环', icon: '💫', desc: '环绕身体的护体光球' },
    { id: 'aura', name: '圣光', icon: '✨', desc: '范围伤害光环' },
    { id: 'shield', name: '护盾', icon: '🛡️', desc: '周期性获得护盾保护' },
    { id: 'maxhp', name: '生命强化', icon: '❤️', desc: '最大生命值+20' },
    { id: 'wind', name: '疾风', icon: '💨', desc: '环绕玩家的风之领域，持续伤害周围敌人' },
    { id: 'magnet', name: '磁铁', icon: '🧲', desc: '经验吸取范围+50' },
    { id: 'heal', name: '治疗', icon: '💚', desc: '恢复30%生命值' },
    { id: 'speed', name: '疾步', icon: '🦶', desc: '移动速度+0.5' }
];
