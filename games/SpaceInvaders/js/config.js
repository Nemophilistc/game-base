// 常量配置
export const W = 600;
export const H = 700;

// 敌人参数
export const ENEMY_ROWS = 5;
export const ENEMY_COLS = 8;
export const ENEMY_W = 36;
export const ENEMY_H = 28;
export const ENEMY_PAD = 8;
export const ENEMY_COLORS = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];

// 玩家参数
export const PLAYER_W = 40;
export const PLAYER_H = 20;
export const PLAYER_SPEED = 5;
export const PLAYER_Y_BASE = H - 50; // 玩家基线Y

// 子弹
export const BULLET_SPEED = 8;
export const TRIPLE_SIDE_VX = 2;
export const TRIPLE_SIDE_VY = -8; // 修复Bug#1: 统一为-8

// 无敌时间（帧数，60fps下1.5秒=90帧）
export const INVINCIBLE_FRAMES = 90;

// 道具
export const POWERUP_FALL_SPEED = 2;
export const TRIPLE_DURATION = 300; // 帧
export const RAPID_DURATION = 300;
export const RAPID_COOLDOWN = 8;
export const NORMAL_COOLDOWN = 18;
export const MAX_SHIELD = 3;
export const MAX_LIVES = 5;
