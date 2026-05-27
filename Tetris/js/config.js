// 常量配置
export const COLS = 10;
export const ROWS = 20;
export const CELL = 28;

export const PIECES = {
    I: { shape: [[1,1,1,1]],             color: '#00bcd4' },
    O: { shape: [[1,1],[1,1]],           color: '#ffeb3b' },
    T: { shape: [[0,1,0],[1,1,1]],       color: '#9c27b0' },
    S: { shape: [[0,1,1],[1,1,0]],       color: '#4caf50' },
    Z: { shape: [[1,1,0],[0,1,1]],       color: '#f44336' },
    J: { shape: [[1,0,0],[1,1,1]],       color: '#2196f3' },
    L: { shape: [[0,0,1],[1,1,1]],       color: '#ff9800' }
};

export const PIECE_NAMES = Object.keys(PIECES);

// 锁定延迟相关常量（毫秒）
export const LOCK_DELAY_MS = 500;   // 0.5 秒
export const MAX_LOCK_RESETS = 15;  // 最多重置锁定15次

// 消行动画时长（毫秒）
export const CLEAR_ANIM_DURATION = 200;
