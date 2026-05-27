// config.js - Game configuration constants

export const HEX_SIZE = 30;
export const GRID_COLS = 15;
export const GRID_ROWS = 11;
export const NUM_TERRITORIES = 22;
export const MAX_DICE = 8;
export const FIRST_TURN_BONUS = 5;
export const INITIAL_TERRITORY_DICE = 2;

export const PLAYER_DEFS = [
    { name: '红方', color: '#e74c3c', lightColor: '#ff6b6b', darkColor: '#c0392b', isHuman: true },
    { name: '蓝方', color: '#3498db', lightColor: '#5dade2', darkColor: '#2980b9', isHuman: false },
    { name: '绿方', color: '#2ecc71', lightColor: '#58d68d', darkColor: '#27ae60', isHuman: false },
    { name: '黄方', color: '#f1c40f', lightColor: '#f7dc6f', darkColor: '#d4ac0f', isHuman: false },
];

export const PHASE = {
    MENU: 'menu',
    DISTRIBUTE: 'distribute',
    SELECT_SOURCE: 'select_source',
    SELECT_TARGET: 'select_target',
    ANIMATING: 'animating',
    AI_TURN: 'ai_turn',
    GAME_OVER: 'game_over',
};

export const SQRT3 = Math.sqrt(3);

// Dot layouts for dice faces (percentage positions)
export const DOT_LAYOUTS = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};
