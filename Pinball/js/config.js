export const W = 420, H = 650;

// 物理参数
export const GRAVITY = 0.15;
export const WALL_BOUNCE = 0.8;
export const BUMPER_BOUNCE = 1.1;
export const MAX_SPEED = 15;
export const FLIPPER_LEN = 70;
export const FLIPPER_LERP = 0.4;
export const FLIP_SPEED_UP = -0.5;
export const FLIP_SPEED_REST = 0.4;
export const FLIPPER_COOLDOWN = 10; // 碰撞冷却帧数

// 墙壁边界
export const WALL_L = 20;
export const WALL_R = W - 20;
export const WALL_T = 10;

// 球初始位置
export const BALL_START_X = W / 2;
export const BALL_START_Y = H - 80;
export const BALL_R = 8;

// 挡板初始位置
export const FLIPPER_Y = H - 60;
export const FLIPPER_LX = 120;
export const FLIPPER_RX = 300;
