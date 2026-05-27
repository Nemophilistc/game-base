// config.js - Game constants and configuration

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Basket
export const BASKET_WIDTH = 100;
export const BASKET_HEIGHT = 40;
export const BASKET_SPEED = 400; // px/s
export const BASKET_Y_OFFSET = 60; // from bottom

// Items
export const ITEM_SIZE = 30;

export const ITEM_TYPES = {
    GOLD_COIN: {
        id: 'gold_coin',
        points: 10,
        color: '#FFD700',
        glow: '#FFA000',
        label: '+10',
        emoji: '🪙',
        size: 28,
        weight: 40, // spawn weight
    },
    SILVER_COIN: {
        id: 'silver_coin',
        points: 5,
        color: '#C0C0C0',
        glow: '#A0A0A0',
        label: '+5',
        emoji: '🪙',
        size: 24,
        weight: 30,
    },
    DIAMOND: {
        id: 'diamond',
        points: 25,
        color: '#00E5FF',
        glow: '#00B8D4',
        label: '+25',
        emoji: '💎',
        size: 26,
        weight: 8,
    },
    STAR: {
        id: 'star',
        points: 0,
        color: '#FF6F00',
        glow: '#FF8F00',
        label: 'x2',
        emoji: '⭐',
        size: 30,
        weight: 5,
        powerUp: 'multiplier',
        duration: 10000,
    },
    BOMB: {
        id: 'bomb',
        points: 0,
        color: '#D32F2F',
        glow: '#B71C1C',
        label: '💣',
        emoji: '💣',
        size: 30,
        weight: 10,
        danger: true,
    },
    ROCK: {
        id: 'rock',
        points: 0,
        color: '#795548',
        glow: '#5D4037',
        label: '🪨',
        emoji: '🪨',
        size: 32,
        weight: 7,
        danger: true,
        debuff: 'slow',
        duration: 5000,
    },
    MAGNET: {
        id: 'magnet',
        points: 0,
        color: '#F44336',
        glow: '#E53935',
        label: 'M',
        emoji: '🧲',
        size: 28,
        weight: 4,
        powerUp: 'magnet',
        duration: 8000,
    },
    SHIELD: {
        id: 'shield',
        points: 0,
        color: '#42A5F5',
        glow: '#1E88E5',
        label: 'S',
        emoji: '🛡️',
        size: 28,
        weight: 3,
        powerUp: 'shield',
        duration: 0, // one-time use
    },
    SLOW: {
        id: 'slow',
        points: 0,
        color: '#66BB6A',
        glow: '#43A047',
        label: 'T',
        emoji: '🐌',
        size: 28,
        weight: 3,
        powerUp: 'slow',
        duration: 6000,
    },
};

// Difficulty
export const DIFFICULTY = {
    initialFallSpeed: 120, // px/s
    maxFallSpeed: 450,
    speedIncreaseRate: 0.8, // px/s per second
    initialSpawnInterval: 1200, // ms
    minSpawnInterval: 350,
    spawnIntervalDecrease: 3, // ms per second
    maxConcurrentItems: 12,
    bombWeightIncrease: 0.02, // per second
};

// Combo
export const COMBO = {
    maxMultiplier: 5,
    thresholds: [3, 6, 10, 15], // catches needed for each combo level
};

// Lives
export const MAX_LIVES = 3;
export const MISSES_TO_LOSE_LIFE = 10;

// Magnet
export const MAGNET_RANGE = 150; // px
export const MAGNET_STRENGTH = 300; // px/s pull speed

// Visual
export const PARTICLE_COUNT = 12;
export const SHAKE_DURATION = 300; // ms
export const SHAKE_INTENSITY = 8; // px
export const COMBO_FLASH_DURATION = 400; // ms

// Colors
export const COLORS = {
    bg: '#1a1a2e',
    bgGradientTop: '#16213e',
    bgGradientBottom: '#0f3460',
    gold: '#FFD700',
    amber: '#FF8F00',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0BEC5',
    danger: '#F44336',
    hudBg: 'rgba(0, 0, 0, 0.5)',
    panelBg: 'rgba(255, 255, 255, 0.08)',
    panelBorder: 'rgba(255, 255, 255, 0.15)',
};
