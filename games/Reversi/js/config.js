// config.js - Game configuration constants

export const BOARD_SIZE = 8;
export const CELL_SIZE = 72;
export const BOARD_PADDING = 32;
export const DISC_RADIUS = CELL_SIZE * 0.4;
export const HUD_HEIGHT = 56;
export const BOARD_PX = BOARD_SIZE * CELL_SIZE + BOARD_PADDING * 2 + HUD_HEIGHT;

// Cell states
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

// Animation durations (ms)
export const FLIP_DURATION = 300;
export const PLACE_DURATION = 200;
export const PARTICLE_DURATION = 400;
export const AI_DELAY = 400;

// Colors
export const COLORS = {
    boardBg: '#1a3a2a',
    boardLine: '#2a5a3a',
    cellNormal: '#1e4a32',
    cellHighlight: 'rgba(0, 200, 160, 0.25)',
    cellLastMove: 'rgba(0, 200, 160, 0.15)',
    blackDisc: '#1a1a1a',
    blackDiscHighlight: '#3a3a3a',
    whiteDisc: '#f0f0f0',
    whiteDiscHighlight: '#ffffff',
    validMoveBlack: 'rgba(30, 30, 30, 0.35)',
    validMoveWhite: 'rgba(220, 220, 220, 0.35)',
    teal: '#00c8a0',
    tealDark: '#00a080',
    tealGlow: 'rgba(0, 200, 160, 0.3)',
    particleBlack: '#4a4a4a',
    particleWhite: '#e0e0e0',
    overlayBg: 'rgba(0, 0, 0, 0.75)',
    glassBg: 'rgba(20, 40, 30, 0.85)',
    glassBorder: 'rgba(0, 200, 160, 0.3)',
    textPrimary: '#e0f0e8',
    textSecondary: '#80a898',
    textAccent: '#00c8a0'
};

// AI positional weights - corners are king, avoid squares adjacent to corners
export const POSITION_WEIGHTS = [
    [120, -20,  20,   5,   5,  20, -20, 120],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [120, -20,  20,   5,   5,  20, -20, 120]
];

// Difficulty settings
export const DIFFICULTY = {
    easy:   { label: '简单', depth: 0 },
    medium: { label: '中等', depth: 3 },
    hard:   { label: '困难', depth: 5 }
};

export const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
];
