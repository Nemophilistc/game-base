// config.js - Game constants and configuration
export const TILE = 32;
export const COLS = 40;
export const ROWS = 28;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

// Tile types
export const T = {
    AIR: 0,
    WALL: 1,
    PLATFORM: 2,
    LADDER: 3,
    SPIKE: 4,
    ARROW_TRAP: 5,
    EXIT_DOOR: 6,
    SHOP_FLOOR: 7,
    SHOP_WALL: 8,
    CRACKED_WALL: 9,
    STONE: 10,
    MOSS_WALL: 11,
    DIRT: 12,
};

// Tile colors
export const TILE_COLORS = {
    [T.WALL]: ['#5c3a1e', '#4a2e16', '#6b4423'],
    [T.PLATFORM]: ['#8b6914', '#7a5c10', '#9c7a1a'],
    [T.LADDER]: ['#8b7355', '#7a6345'],
    [T.SPIKE]: ['#c0c0c0', '#a0a0a0'],
    [T.ARROW_TRAP]: ['#6b5b3a', '#5a4a2a'],
    [T.EXIT_DOOR]: ['#8b4513', '#a0522d'],
    [T.SHOP_FLOOR]: ['#6b5b3a', '#7a6a4a'],
    [T.SHOP_WALL]: ['#8b7355', '#7a6345'],
    [T.CRACKED_WALL]: ['#5c3a1e', '#4a2e16'],
    [T.STONE]: ['#696969', '#5a5a5a', '#787878'],
    [T.MOSS_WALL]: ['#3a5c2a', '#2e4a22', '#4a6b35'],
    [T.DIRT]: ['#6b4423', '#5a3618', '#7c5530'],
};

// Physics
export const GRAVITY = 0.45;
export const MAX_FALL_SPEED = 10;
export const PLAYER_SPEED = 2.8;
export const PLAYER_JUMP = -8.2;
export const PLAYER_WALL_JUMP_X = 5;
export const PLAYER_WALL_JUMP_Y = -7.5;
export const PLAYER_CLIMB_SPEED = 2.2;
export const FRICTION = 0.82;
export const AIR_FRICTION = 0.92;

// Player
export const PLAYER_HP = 3;
export const START_ROPES = 4;
export const START_BOMBS = 4;
export const INVULN_TIME = 1500;
export const LEDGE_GRAB_TIME = 200;
export const ROPE_LENGTH = 8;
export const BOMB_FUSE = 2200;
export const BOMB_RADIUS = 2.5;
export const BOMB_POWER = 5;

// Enemy configs
export const ENEMY_CFG = {
    bat: { w: 24, h: 16, hp: 1, speed: 1.5, swoopSpeed: 4, damage: 1, score: 200 },
    snake: { w: 28, h: 18, hp: 1, speed: 1, damage: 1, score: 300 },
    spider: { w: 22, h: 20, hp: 2, speed: 1.5, dropSpeed: 5, damage: 1, score: 400 },
    skeleton: { w: 22, h: 30, hp: 3, speed: 1.8, chaseSpeed: 2.5, damage: 1, score: 500 },
};

// Item values
export const ITEM_VALUES = {
    gold_nugget: { value: 100, w: 10, h: 10 },
    gold_bar: { value: 500, w: 16, h: 10 },
    gem_ruby: { value: 800, w: 12, h: 12 },
    gem_emerald: { value: 1200, w: 12, h: 12 },
    gem_sapphire: { value: 2000, w: 12, h: 12 },
    key: { value: 0, w: 14, h: 10 },
    rope_pickup: { value: 0, w: 12, h: 14, ropeAmount: 2 },
    bomb_pickup: { value: 0, w: 12, h: 14, bombAmount: 2 },
    health: { value: 0, w: 14, h: 14, healAmount: 1 },
    chest: { value: 1000, w: 20, h: 16 },
};

// Shop items
export const SHOP_ITEMS = [
    { id: 'rope', name: '绳索 x2', cost: 500, type: 'rope', amount: 2 },
    { id: 'bomb', name: '炸弹 x2', cost: 800, type: 'bomb', amount: 2 },
    { id: 'health', name: '恢复生命', cost: 1000, type: 'health', amount: 1 },
    { id: 'compass', name: '出口指南针', cost: 1500, type: 'compass', amount: 1 },
    { id: 'gloves', name: '攀爬手套', cost: 2000, type: 'gloves', amount: 1 },
    { id: 'shoes', name: '弹簧靴', cost: 2500, type: 'shoes', amount: 1 },
];

// Colors
export const COLORS = {
    bg: '#1a0e05',
    bgGrad1: '#1a0e05',
    bgGrad2: '#0d0703',
    wall: '#5c3a1e',
    wallDark: '#3a2210',
    wallLight: '#7a5230',
    platform: '#8b6914',
    platformTop: '#a07818',
    ladder: '#8b7355',
    spike: '#c0c0c0',
    spikeTip: '#e0e0e0',
    arrowTrap: '#6b5b3a',
    arrow: '#888',
    door: '#8b4513',
    doorFrame: '#d4a040',
    doorKnob: '#ffd700',
    doorGlow: 'rgba(255,215,0,0.3)',
    shopFloor: '#6b5b3a',
    shopWall: '#8b7355',
    gold: '#ffd700',
    goldShine: '#fff8b0',
    gemRuby: '#ff2244',
    gemEmerald: '#22cc66',
    gemSapphire: '#2266ff',
    gemShine: '#ffffff',
    key: '#ffd700',
    keyShine: '#fff8b0',
    ropeColor: '#c8a050',
    ropePickup: '#c8a050',
    bomb: '#555',
    bombFuse: '#ff6600',
    bombSpark: '#ffcc00',
    health: '#ff4444',
    healthCross: '#ffffff',
    chest: '#8b6914',
    chestBand: '#ffd700',
    player: '#e8a040',
    playerSkin: '#f0c878',
    playerEye: '#222',
    playerBandana: '#cc3333',
    invuln: 'rgba(255,200,100,0.4)',
    bat: '#553366',
    batWing: '#442255',
    snake: '#446633',
    snakePattern: '#558844',
    spider: '#222',
    spiderEye: '#ff0000',
    skeleton: '#ccccbb',
    skeletonEye: '#ff4444',
    shopkeeper: '#cc8844',
    shopkeeperShotgun: '#666',
    particle: '#ffcc44',
    torchGlow: 'rgba(255,150,50,0.08)',
    darkness: 'rgba(10,5,0,',
    hudBg: 'rgba(15,8,3,0.85)',
    hudBorder: 'rgba(180,140,60,0.4)',
    hudText: '#e8c878',
    hudValue: '#ffd700',
    uiBg: 'rgba(15,8,3,0.92)',
    uiBorder: 'rgba(180,140,60,0.5)',
    uiAccent: '#d4a040',
    uiDanger: '#cc3333',
    uiSuccess: '#44aa44',
    white: '#ffffff',
    black: '#000000',
};
