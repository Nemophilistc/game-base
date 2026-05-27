// config.js - Constants and shared state
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

// Bubble grid settings
export const BUBBLE_RADIUS = 18;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
export const COLS = 12;
export const ROW_HEIGHT = BUBBLE_DIAMETER * 0.866; // sqrt(3)/2 for hex stagger
export const COL_WIDTH = BUBBLE_DIAMETER;
export const GRID_OFFSET_X = (CANVAS_WIDTH - COLS * COL_WIDTH) / 2 + BUBBLE_RADIUS;
export const GRID_OFFSET_Y = 60;

// Game settings
export const SHOOT_SPEED = 12;
export const MIN_MATCH = 3;
export const COMBO_TIMEOUT = 2000;
export const NEW_ROW_INTERVAL = 8000; // ms between new row descents
export const GAME_OVER_Y = CANVAS_HEIGHT - 120;

// Scoring
export const SCORE_POP = 10;
export const SCORE_FLOAT = 20;

// Colors (warm palette)
export const BUBBLE_COLORS = [
  '#FF4444', // Red
  '#FF8800', // Orange
  '#FFCC00', // Yellow
  '#44CC44', // Green
  '#4488FF', // Blue
  '#CC44FF', // Purple
];

export const BUBBLE_COLOR_NAMES = ['红色', '橙色', '黄色', '绿色', '蓝色', '紫色'];

// Special bubble types
export const SPECIAL_NONE = 0;
export const SPECIAL_BOMB = 1;
export const SPECIAL_RAINBOW = 2;

// Game state
export function createGameState() {
  return {
    grid: [],          // 2D array of bubble objects
    shooter: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 60,
      angle: -Math.PI / 2,
      current: null,
      next: null,
    },
    flying: null,      // Currently flying bubble
    score: 0,
    level: 1,
    combo: 0,
    lastPopTime: 0,
    newRowTimer: 0,
    state: 'menu',     // menu, playing, gameover
    particles: [],
    fallingBubbles: [],
    popAnimations: [],
    shakeTimer: 0,
    highScore: parseInt(localStorage.getItem('bubbleShooterHighScore') || '0'),
    colorCount: 4,     // starts with 4 colors, increases with level
  };
}

export function getRandomColor(state) {
  return BUBBLE_COLORS[Math.floor(Math.random() * state.colorCount)];
}

export function getRandomBubble(state) {
  const r = Math.random();
  if (r < 0.03) return { color: '#FFFFFF', special: SPECIAL_RAINBOW };
  if (r < 0.07) return { color: '#FF0000', special: SPECIAL_BOMB };
  return { color: getRandomColor(state), special: SPECIAL_NONE };
}
