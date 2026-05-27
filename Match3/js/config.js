// ============================================================
// config.js - 游戏常量配置
// ============================================================

export const GRID_ROWS = 8;
export const GRID_COLS = 8;
export const CELL_SIZE = 64;
export const GEM_PADDING = 4;

// 7种宝石颜色及符号
export const GEM_TYPES = [
  { id: 0, name: '红宝石',   color: '#ff3b5c', symbol: '♥', glow: '#ff6b8a' }, // ♥
  { id: 1, name: '蓝宝石',   color: '#3b8bff', symbol: '♦', glow: '#6bafff' }, // ♦
  { id: 2, name: '绿宝石',   color: '#3bff6b', symbol: '♣', glow: '#6bff9a' }, // ♣
  { id: 3, name: '黄宝石',   color: '#ffd93b', symbol: '☀', glow: '#ffe56b' }, // ☀
  { id: 4, name: '紫宝石',   color: '#b83bff', symbol: '★', glow: '#d06bff' }, // ★
  { id: 5, name: '橙宝石',   color: '#ff8c3b', symbol: '◆', glow: '#ffb06b' }, // ◆
  { id: 6, name: '青宝石',   color: '#3bffe0', symbol: '♠', glow: '#6bfff0' }, // ♠
];

// 特殊宝石类型
export const SPECIAL = {
  NONE:      'none',
  CROSS:     'cross',      // 十字炸弹：4连 → 消除整行+整列
  RAINBOW:   'rainbow',    // 彩虹宝石：5连 → 消除所有同色
  RANGE:     'range',      // 范围炸弹：L/T形 → 3×3消除
};

export const SPECIAL_SYMBOLS = {
  [SPECIAL.CROSS]:   '✚', // ✚
  [SPECIAL.RAINBOW]: '⚗', // ⚗
  [SPECIAL.RANGE]:   '✦', // ✦
};

// 计分
export const BASE_SCORE_PER_GEM = 10;
export const CHAIN_MULTIPLIERS = [1, 2, 4, 8, 16, 32, 64, 128];

// 动画时间（毫秒）
export const SWAP_DURATION     = 250;
export const FALL_DURATION     = 200;
export const DESTROY_DURATION  = 300;
export const SPAWN_DURATION    = 200;
export const CHAIN_DELAY       = 150;

// 50关配置
// type: 'score'=达到目标分, 'clear'=消除指定数量
// target: 目标分数 或 消除数量
// moves: 限制步数
// colors: 可用宝石颜色数（3-7）
export const LEVELS = [];
(function buildLevels() {
  for (let i = 0; i < 50; i++) {
    const lv = i + 1;
    const isScoreLevel = lv % 3 !== 0;  // 每3关一个消除关
    const colors = Math.min(7, 3 + Math.floor(i / 8));
    const moves  = Math.max(12, 35 - Math.floor(i * 0.4));
    let target, type, clearColor;
    if (isScoreLevel) {
      type = 'score';
      target = 500 + i * 300 + Math.floor(i / 5) * 500;
    } else {
      type = 'clear';
      target = 10 + Math.floor(i * 0.8);
      clearColor = i % 7; // 要消除的颜色id
    }
    LEVELS.push({ level: lv, type, target, moves, colors, clearColor });
  }
})();
