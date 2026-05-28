// 画布与游戏常量
export const W = 700;
export const H = 550;

export const BRICK_ROWS = 6;
export const BRICK_COLS = 10;
export const BRICK_W = 60;
export const BRICK_H = 20;
export const BRICK_PAD = 4;
export const BRICK_TOP = 50;

export const COLORS = ['#f44336','#ff9800','#ffeb3b','#4caf50','#2196f3','#9c27b0'];

export const POWERUP_TYPES = ['wide','multi','laser','slow','pierce'];

export const POWERUP_ICONS = {
    wide:'⬜', multi:'🔵', laser:'🔴', slow:'🧊', pierce:'🟡'
};

// 最低球速（防止除零）
export const MIN_BALL_SPEED = 0.5;
