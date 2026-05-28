// ============================================================
// 泡泡堂 - 全局配置和共享状态
// ============================================================

export const COLS = 15;
export const ROWS = 13;
export const CELL = 48;
export const W = COLS * CELL;
export const H = ROWS * CELL;

export const TILE_EMPTY = 0;
export const TILE_HARD = 1;
export const TILE_SOFT = 2;

// 道具类型
export const ITEM_FLAME = 0;
export const ITEM_SPEED = 1;
export const ITEM_BOMB = 2;
export const ITEM_SHIELD = 3;
export const ITEM_FULLFIRE = 4;
export const ITEM_WALLPASS = 5;

export const ITEM_NAMES = ['火焰', '速度', '炸弹', '护盾', '全火', '穿墙'];
export const ITEM_MAX_COUNT = 8; // 地图上同时存在的道具上限

export const COLORS = {
  bg: '#2d5a27',
  grass1: '#3a7a32',
  grass2: '#2d6a28',
  hard: '#5a4a3a',
  hardLight: '#6a5a4a',
  hardDark: '#4a3a2a',
  soft: '#c4a882',
  softLight: '#d4b892',
  softDark: '#a48862',
  bomb: '#222',
  fuse: '#ff4444',
  explosion: ['#ff0', '#ff8800', '#ff4400', '#ff0000', '#cc0000'],
};

// 共享游戏状态
export const game = {
  canvas: null,
  ctx: null,
  state: 'menu', // menu, playing, paused, win, lose
  difficulty: 'easy',
  level: 1,
  score: 0,
  frame: 0,
};

export const state = {
  map: [],
  player: null,
  enemies: [],
  bombs: [],
  explosions: [],
  items: [],
};

export const keys = {};
