// config.js — 五子棋常量配置

export const BOARD_SIZE = 15;        // 棋盘 15×15
export const WIN_COUNT = 5;          // 五子连珠获胜
export const CELL_SIZE = 40;         // 格子像素大小
export const PADDING = 30;           // 棋盘边距
export const BOARD_PX = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2; // 画布尺寸

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

// AI 难度对应的搜索深度
export const DIFFICULTY = {
    easy:   2,
    medium: 4,
    hard:   6,
};

// 棋型评分
export const SCORE = {
    FIVE:       1000000,   // 五连
    LIVE_FOUR:   100000,   // 活四
    RUSH_FOUR:    10000,   // 冲四
    LIVE_THREE:    1000,   // 活三
    SLEEP_THREE:    100,   // 眠三
    LIVE_TWO:        10,   // 活二
    SLEEP_TWO:        1,   // 眠二
};

// 角色颜色名
export const COLOR_NAME = { [BLACK]: '黑棋', [WHITE]: '白棋' };
