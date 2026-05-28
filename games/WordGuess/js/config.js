// config.js - 游戏常量配置

export const WORD_LENGTH = 5;        // 每个词的长度
export const MAX_GUESSES = 6;        // 最大猜测次数

// 颜色状态
export const COLOR = {
  CORRECT: 'correct',     // 绿色 - 位置正确
  PRESENT: 'present',     // 黄色 - 存在但位置错误
  ABSENT: 'absent',       // 灰色 - 不存在
  EMPTY: 'empty',         // 空
};

// 游戏模式
export const MODE = {
  CHINESE: 'chinese',
  ENGLISH: 'english',
};

// 游戏状态
export const GAME_STATE = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

// 每日挑战种子基准日期
export const SEED_DATE = new Date(2024, 0, 1); // 2024-01-01

// localStorage keys
export const STORAGE_KEY = {
  STATS_CHINESE: 'wordguess_stats_chinese',
  STATS_ENGLISH: 'wordguess_stats_english',
  DAILY_DATE: 'wordguess_daily_date',
  DAILY_STATE: 'wordguess_daily_state',
  CURRENT_MODE: 'wordguess_mode',
};
