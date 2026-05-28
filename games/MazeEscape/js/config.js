// ============================================================
// config.js - Maze Escape Game Configuration
// ============================================================

export const DIFFICULTY = {
    small:  { cols: 10, rows: 10, enemies: 2,  keys: 3,  name: '简单 (10×10)'  },
    medium: { cols: 15, rows: 15, enemies: 4,  keys: 5,  name: '中等 (15×15)'  },
    large:  { cols: 20, rows: 20, enemies: 6,  keys: 8,  name: '困难 (20×20)'  },
};

export const CFG = {
    CELL_SIZE: 48,           // rendered cell size in px
    WALL_THICKNESS: 3,
    PLAYER_RADIUS: 0.35,     // fraction of cell size
    ENEMY_RADIUS: 0.32,
    ITEM_RADIUS: 0.25,

    PLAYER_SPEED: 5.5,       // cells per second
    ENEMY_SPEED: 2.0,
    ENEMY_CHASE_SPEED: 3.2,
    ENEMY_CHASE_RANGE: 6,    // cells
    ENEMY_FREEZE_DURATION: 5,// seconds

    TORCH_RADIUS: 3,         // cells revealed
    MAP_REVEAL_DURATION: 4,  // seconds
    SPEED_BOOST_DURATION: 6,
    SPEED_BOOST_MULT: 1.6,

    STARTING_LIVES: 3,
    INVULN_DURATION: 2,      // seconds after hit

    // Scoring
    SCORE_PER_SECOND: 10,
    SCORE_PER_KEY: 200,
    SCORE_PER_TORCH: 50,
    SCORE_PER_POWERUP: 100,
    SCORE_FINISH_BONUS: 2000,

    // Visual
    BG_COLOR: '#0a0f0a',
    WALL_COLOR: '#1a3a1a',
    WALL_GLOW: '#2ecc71',
    FLOOR_COLOR: '#0d1a0d',
    FOG_COLOR: 'rgba(0,0,0,0.95)',
    FOG_SEMI: 'rgba(0,0,0,0.55)',
    PLAYER_COLOR: '#2ecc71',
    PLAYER_GLOW: '#00ff88',
    ENEMY_COLOR: '#e74c3c',
    ENEMY_GLOW: '#ff4444',
    EXIT_COLOR: '#f1c40f',
    EXIT_GLOW: '#ffdd00',
    KEY_COLOR: '#f1c40f',
    TORCH_COLOR: '#e67e22',
    DOOR_COLOR: '#8b4513',
    LOCKED_COLOR: '#c0392b',
    SPEED_COLOR: '#3498db',
    FREEZE_COLOR: '#9b59b6',
    REVEAL_COLOR: '#1abc9c',
    HUD_BG: 'rgba(0,20,0,0.8)',
    OVERLAY_BG: 'rgba(0,10,0,0.92)',
    GLASS_BG: 'rgba(10,40,10,0.75)',
    GLASS_BORDER: 'rgba(46,204,113,0.3)',
    TEXT_PRIMARY: '#e0ffe0',
    TEXT_ACCENT: '#2ecc71',
    TEXT_GOLD: '#f1c40f',
    TEXT_DANGER: '#e74c3c',
};

export const POWERUP_TYPES = {
    speed:  { label: '加速', icon: '⚡', color: CFG.SPEED_COLOR },
    freeze: { label: '冻结', icon: '❄', color: CFG.FREEZE_COLOR },
    reveal: { label: '全图', icon: '🗺', color: CFG.REVEAL_COLOR },
};
