// Game configuration constants
export const CONFIG = {
  // Canvas
  WIDTH: 400,
  HEIGHT: 700,

  // Player
  PLAYER_WIDTH: 36,
  PLAYER_HEIGHT: 42,
  PLAYER_SPEED: 5,
  JUMP_VELOCITY: -12,
  SPRING_JUMP_VELOCITY: -20,
  GRAVITY: 0.45,
  MAX_FALL_SPEED: 15,

  // Shooting
  BULLET_SPEED: 10,
  BULLET_RADIUS: 4,
  SHOOT_COOLDOWN: 250, // ms

  // Platforms
  PLATFORM_WIDTH: 70,
  PLATFORM_HEIGHT: 14,
  PLATFORM_GAP_MIN: 60,
  PLATFORM_GAP_MAX: 110,
  MOVING_PLATFORM_SPEED: 1.5,

  // Collectibles
  COIN_RADIUS: 10,
  JETPACK_WIDTH: 20,
  JETPACK_HEIGHT: 30,
  PROPELLER_WIDTH: 24,
  PROPELLER_HEIGHT: 20,

  // Jetpack / Propeller
  JETPACK_DURATION: 3000,
  JETPACK_SPEED: -8,
  PROPELLER_DURATION: 5000,
  PROPELLER_SPEED: -5,

  // Enemies
  ENEMY_WIDTH: 30,
  ENEMY_HEIGHT: 28,
  ENEMY_SPEED: 1.2,

  // Camera
  CAMERA_OFFSET: 300, // player stays above this line

  // Difficulty scaling
  DIFFICULTY_INTERVAL: 2000, // height units per difficulty step

  // Colors - doodle style
  COLORS: {
    BG: '#f5f0e1',
    BG_LINES: '#c8d8e8',
    PLATFORM_NORMAL: '#5cb85c',
    PLATFORM_NORMAL_DARK: '#4a9a4a',
    PLATFORM_FRAGILE: '#d4a843',
    PLATFORM_FRAGILE_DARK: '#b8922e',
    PLATFORM_MOVING: '#5bc0de',
    PLATFORM_MOVING_DARK: '#46a5c0',
    PLATFORM_SPIKE: '#d9534f',
    PLATFORM_SPIKE_DARK: '#c43c38',
    SPRING: '#f0ad4e',
    SPRING_DARK: '#d4932a',
    PLAYER_BODY: '#4a90d9',
    PLAYER_DARK: '#3672b0',
    PLAYER_EYES: '#ffffff',
    PLAYER_PUPIL: '#333333',
    ENEMY: '#e74c3c',
    ENEMY_DARK: '#c0392b',
    ENEMY_EYES: '#ffffff',
    COIN: '#f1c40f',
    COIN_DARK: '#d4a90b',
    BULLET: '#e74c3c',
    JETPACK: '#7f8c8d',
    JETPACK_FLAME: '#e67e22',
    PROPELLER: '#9b59b6',
    UI_TEXT: '#2c3e50',
    UI_SCORE: '#e74c3c',
    OVERLAY_BG: 'rgba(0,0,0,0.55)',
    OVERLAY_GLASS: 'rgba(255,255,255,0.12)',
  }
};
