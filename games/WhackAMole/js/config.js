// 游戏常量配置
export const GAME_TIME = 30000;      // 游戏时长 30秒
export const HOLE_COUNT = 9;         // 地鼠洞数量

// 地鼠类型配置（概率之和必须为1）
export const MOLE_TYPES = {
    normal: { emoji: '🐀', probability: 0.7, baseScore: 10, duration: 1500 },
    golden: { emoji: '⭐', probability: 0.2, baseScore: 30, duration: 1000 },
    bomb:   { emoji: '💣', probability: 0.1, baseScore: -20, duration: 2000 }
};

// 连击倍率：每3连击+1倍，最高5倍
export const COMBO_STEP = 3;
export const MAX_MULTIPLIER = 5;

// 生成速率随分数变化
export const SPAWN_RATE_BASE = 800;
export const SPAWN_RATE_MIN = 400;
export const SPAWN_RATE_SCORE_FACTOR = 2;

// 地鼠冒出时长随分数缩短
export const DURATION_MIN = 600;
export const DURATION_SCORE_FACTOR = 2;
