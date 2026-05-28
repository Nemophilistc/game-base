// ============================================================
// config.js - 游戏常量配置
// ============================================================

export const W = 350;
export const H = 600;
export const LANE_W = 70;
export const LANES = 5;
export const ROAD_LEFT = (W - LANES * LANE_W) / 2;

export const CAR_COLORS = [
    '#f44336', '#2196f3', '#4caf50', '#ff9800',
    '#9c27b0', '#00bcd4', '#e91e63'
];

// 玩家初始生命值
export const INITIAL_LIVES = 3;

// 碰撞箱尺寸
export const COLLISION_X = 35;
export const COLLISION_Y = 60;

// 变道冷却帧数（用于触屏拖拽，键盘直接响应）
export const LANE_CHANGE_COOLDOWN = 8;
