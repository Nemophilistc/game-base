// config.js - 常量配置
export const CONFIG = {
  // 轨道设置
  LANE_COUNT: 4,
  KEYS: ['s', 'f', 'j', 'k'],
  KEY_LABELS: ['S', 'F', 'J', 'K'],

  // 轨道颜色
  LANE_COLORS: ['#ff4488', '#44aaff', '#44ff88', '#ffaa44'],
  LANE_GLOW: ['#ff448866', '#44aaff66', '#44ff8866', '#ffaa4466'],

  // 判定时间窗口 (ms)
  TIMING: {
    PERFECT: 30,
    GREAT: 60,
    GOOD: 100,
  },

  // 判定分数
  SCORE: {
    PERFECT: 300,
    GREAT: 200,
    GOOD: 100,
    MISS: 0,
  },

  // 判定颜色
  JUDGE_COLORS: {
    PERFECT: '#ffdd44',
    GREAT: '#44ffaa',
    GOOD: '#44aaff',
    MISS: '#ff4444',
  },

  // 判定文字
  JUDGE_TEXT: {
    PERFECT: 'PERFECT',
    GREAT: 'GREAT',
    GOOD: 'GOOD',
    MISS: 'MISS',
  },

  // 连击倍率
  COMBO_MULTIPLIERS: [
    { threshold: 0, mult: 1 },
    { threshold: 10, mult: 2 },
    { threshold: 30, mult: 4 },
    { threshold: 50, mult: 8 },
    { threshold: 100, mult: 16 },
  ],

  // 音符速度 (像素/秒)
  NOTE_SPEED: {
    easy: 300,
    hard: 450,
    hell: 600,
  },

  // 音符类型
  NOTE_TYPE: {
    TAP: 'tap',
    HOLD: 'hold',
    SLIDE: 'slide',
  },

  // 滑动方向
  SLIDE_DIR: {
    LEFT: -1,
    RIGHT: 1,
  },

  // 难度设置
  DIFFICULTY: {
    easy: {
      name: '简单',
      bpm: 120,
      noteDensity: 0.3,
      holdChance: 0.05,
      slideChance: 0.0,
      doubleChance: 0.0,
      speed: 300,
    },
    hard: {
      name: '困难',
      bpm: 140,
      noteDensity: 0.55,
      holdChance: 0.1,
      slideChance: 0.05,
      doubleChance: 0.1,
      speed: 450,
    },
    hell: {
      name: '地狱',
      bpm: 170,
      noteDensity: 0.8,
      holdChance: 0.15,
      slideChance: 0.1,
      doubleChance: 0.25,
      speed: 600,
    },
  },

  // 判定线位置 (距底部比例)
  JUDGMENT_LINE_RATIO: 0.85,

  // 音符大小
  NOTE_WIDTH: 60,
  NOTE_HEIGHT: 20,
  HOLD_WIDTH: 50,

  // 特效持续时间 (ms)
  FLASH_DURATION: 150,
  PARTICLE_LIFETIME: 800,
  COMBO_TEXT_DURATION: 1000,
  JUDGE_TEXT_DURATION: 600,

  // BGM设置
  BGM: {
    bars: 32,
    beatsPerBar: 4,
  },
};
