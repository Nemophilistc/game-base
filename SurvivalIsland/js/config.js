// ============================================================
// config.js - Game constants and configuration
// ============================================================

export const TILE_SIZE = 32;
export const WORLD_COLS = 40;
export const WORLD_ROWS = 40;
export const CANVAS_W = 960;
export const CANVAS_H = 640;

// Tile types
export const TILE = {
    WATER: 0,
    SAND: 1,
    GRASS: 2,
    FOREST: 3,
    MOUNTAIN: 4,
    DEEP_WATER: 5,
};

export const TILE_COLORS = {
    [TILE.DEEP_WATER]: '#1a6b8a',
    [TILE.WATER]: '#2e99c4',
    [TILE.SAND]: '#d4b96a',
    [TILE.GRASS]: '#5a9e4b',
    [TILE.FOREST]: '#2d6b30',
    [TILE.MOUNTAIN]: '#7a7a7a',
};

export const TILE_WALKABLE = {
    [TILE.DEEP_WATER]: false,
    [TILE.WATER]: false,
    [TILE.SAND]: true,
    [TILE.GRASS]: true,
    [TILE.FOREST]: true,
    [TILE.MOUNTAIN]: false,
};

// Player
export const PLAYER_SPEED = 120; // pixels per second
export const PLAYER_SIZE = 24;
export const MAX_HEALTH = 100;
export const MAX_HUNGER = 100;
export const MAX_THIRST = 100;
export const HUNGER_RATE = 1.8; // per second
export const THIRST_RATE = 2.5; // per second
export const STARVING_DAMAGE = 5; // per second when hunger=0
export const DEHYDRATION_DAMAGE = 8; // per second when thirst=0
export const INVENTORY_SLOTS = 8;
export const GATHER_RANGE = 48;
export const GATHER_TIME = 0.8; // seconds base
export const STRUCTURE_RANGE = 64;

// Resources
export const RESOURCE_TYPES = {
    WOOD: 'wood',
    STONE: 'stone',
    FIBER: 'fiber',
    BERRY: 'berry',
    RAW_MEAT: 'rawMeat',
    COOKED_MEAT: 'cookedMeat',
    FISH: 'fish',
    COOKED_FISH: 'cookedFish',
};

export const RESOURCE_NAMES = {
    wood: '木材',
    stone: '石头',
    fiber: '纤维',
    berry: '浆果',
    rawMeat: '生肉',
    cookedMeat: '熟肉',
    fish: '鱼',
    cookedFish: '烤鱼',
};

export const RESOURCE_COLORS = {
    wood: '#8B5E3C',
    stone: '#888',
    fiber: '#b8a044',
    berry: '#c44569',
    rawMeat: '#d63031',
    cookedMeat: '#e17055',
    fish: '#74b9ff',
    cookedFish: '#fdcb6e',
};

// Nutrition values
export const NUTRITION = {
    berry: { hunger: 8, thirst: 3 },
    rawMeat: { hunger: 20, thirst: 0, health: -5 },
    cookedMeat: { hunger: 40, thirst: 0 },
    fish: { hunger: 15, thirst: 0, health: -3 },
    cookedFish: { hunger: 35, thirst: 0 },
};

// Structure types
export const STRUCTURE_TYPES = {
    CAMPFIRE: 'campfire',
    SHELTER: 'shelter',
    FARM: 'farm',
    STORAGE: 'storage',
    BOAT: 'boat',
};

export const STRUCTURE_NAMES = {
    campfire: '篝火',
    shelter: '庇护所',
    farm: '农田',
    storage: '储物箱',
    boat: '木筏',
};

export const STRUCTURE_COLORS = {
    campfire: '#e67e22',
    shelter: '#8d6e63',
    farm: '#7cb342',
    storage: '#a1887f',
    boat: '#5d4037',
};

// Day/Night cycle
export const DAY_LENGTH = 120; // seconds per full day
export const DAWN_START = 0.2;  // 20% of day
export const DAY_START = 0.3;
export const DUSK_START = 0.7;
export const NIGHT_START = 0.8;

// Weather
export const WEATHER_CHANGE_INTERVAL = 30; // seconds between weather checks
export const RAIN_THIRST_RESTORE = 3; // per second
export const STORM_SHELTER_DAMAGE = 10; // per second

// Animal types
export const ANIMAL_TYPES = {
    RABBIT: 'rabbit',
    WOLF: 'wolf',
};

export const ANIMAL_CONFIG = {
    rabbit: {
        name: '兔子',
        speed: 60,
        health: 15,
        damage: 0,
        size: 14,
        color: '#c4a882',
        drop: 'rawMeat',
        dropCount: 1,
        aggressive: false,
        spawnWeight: 5,
    },
    wolf: {
        name: '狼',
        speed: 90,
        health: 40,
        damage: 15,
        size: 18,
        color: '#555',
        drop: 'rawMeat',
        dropCount: 2,
        aggressive: true,
        nightOnly: true,
        spawnWeight: 2,
    },
};

// Crafting recipes
export const RECIPES = [
    {
        id: 'axe',
        name: '石斧',
        ingredients: { wood: 2, stone: 2 },
        result: 'axe',
        type: 'tool',
        description: '砍树速度x2',
    },
    {
        id: 'pickaxe',
        name: '石镐',
        ingredients: { wood: 2, stone: 3 },
        result: 'pickaxe',
        type: 'tool',
        description: '采石速度x2',
    },
    {
        id: 'fishingRod',
        name: '钓鱼竿',
        ingredients: { wood: 2, fiber: 3 },
        result: 'fishingRod',
        type: 'tool',
        description: '可以钓鱼',
    },
    {
        id: 'campfire',
        name: '篝火',
        ingredients: { wood: 5, stone: 3 },
        result: 'campfire',
        type: 'structure',
        description: '夜间照明，烹饪食物',
    },
    {
        id: 'shelter',
        name: '庇护所',
        ingredients: { wood: 10, fiber: 5 },
        result: 'shelter',
        type: 'structure',
        description: '安全休息，躲避风暴',
    },
    {
        id: 'farm',
        name: '农田',
        ingredients: { wood: 4, fiber: 3 },
        result: 'farm',
        type: 'structure',
        description: '种植食物',
    },
    {
        id: 'storage',
        name: '储物箱',
        ingredients: { wood: 8, stone: 2 },
        result: 'storage',
        type: 'structure',
        description: '额外存储空间',
    },
    {
        id: 'boat',
        name: '木筏',
        ingredients: { wood: 20, fiber: 10, stone: 5 },
        result: 'boat',
        type: 'structure',
        description: '建造木筏逃离岛屿！',
    },
];

// Colors
export const UI_BG = 'rgba(20, 30, 20, 0.85)';
export const UI_BORDER = 'rgba(100, 160, 80, 0.4)';
export const UI_TEXT = '#d4e8c0';
export const UI_ACCENT = '#6abf4b';
export const UI_DANGER = '#e74c3c';
export const UI_WARNING = '#f39c12';
