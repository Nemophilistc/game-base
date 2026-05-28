// 躲避球 - 常量配置
export const W = 500;
export const H = 600;

// 玩家
export const PLAYER_RADIUS = 14;
export const PLAYER_SPEED = 5;
export const TRAIL_LENGTH = 12;

// 障碍物类型与权重
export const OBSTACLE_TYPES = ['normal', 'fast', 'wide', 'homing'];
export const OBSTACLE_WEIGHTS = [50, 25, 15, 10];

// 能量球
export const ENERGY_ORB_RADIUS = 10;
export const ENERGY_ORB_SCORE = 50;
export const ENERGY_SPAWN_INTERVAL = 180; // 帧

// 难度递增
export const BASE_SPAWN_RATE = 40;   // 初始生成间隔（帧）
export const MIN_SPAWN_RATE = 10;    // 最小生成间隔
export const SPAWN_RATE_DECREASE_INTERVAL = 300; // 每N帧加速一次
