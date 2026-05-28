// config.js - Game configuration constants
export const CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 700,

  // Bow position (bottom-left area)
  BOW_X: 150,
  BOW_Y: 500,

  // Arrow physics
  ARROW_GRAVITY: 0.35,
  ARROW_MAX_POWER: 28,
  ARROW_MIN_POWER: 4,
  ARROW_LENGTH: 50,
  ARROW_STICK_TIME: 2000, // ms before stuck arrows fade

  // Wind
  WIND_MAX_STRENGTH: 5,
  WIND_CHANGE_INTERVAL: 5000, // ms

  // Targets
  TARGET_BASE_X: 950,
  TARGET_Y_MIN: 200,
  TARGET_Y_MAX: 550,
  TARGET_RADIUS_BASE: 60,
  TARGET_ZONE_COLORS: ['#FFD700', '#FF4444', '#4488FF', '#22CC22', '#FFFFFF'],
  TARGET_ZONE_NAMES: ['10分', '8分', '6分', '4分', '2分'],
  TARGET_ZONE_SCORES: [10, 8, 6, 4, 2],

  // Moving target
  MOVING_SPEED_MIN: 1,
  MOVING_SPEED_MAX: 3,
  MOVING_RANGE: 200,

  // Balloon
  BALLOON_COLORS: ['#FF4488', '#FF8844', '#FFDD44', '#44DDFF', '#DD44FF'],
  BALLOON_RADIUS: 30,
  BALLOON_BONUS: 15,
  BALLOON_FLOAT_SPEED: 1.2,

  // Apple
  APPLE_RADIUS: 22,
  APPLE_BONUS: 25,
  APPLE_MISS_PENALTY: 5, // hit the dummy instead

  // Dummy (person with apple on head)
  DUMMY_X: 950,
  DUMMY_Y: 480,

  // Combo
  COMBO_MULTIPLIERS: [1, 1.5, 2, 2.5, 3, 4, 5],
  COMBO_BULLSEYE_THRESHOLD: 8, // score >= 8 counts for combo

  // Game modes
  MODES: {
    CLASSIC: { name: '经典模式', arrows: 10, timeLimit: 0 },
    TIME_ATTACK: { name: '限时挑战', arrows: Infinity, timeLimit: 60 },
    CHALLENGE: { name: '挑战模式', arrows: 15, timeLimit: 0 },
  },

  // Levels
  LEVEL_DISTANCE_INCREASE: 0.08, // scale factor per level
  TARGETS_PER_LEVEL: 3,

  // Colors
  COLOR_BG_SKY: '#1a1a2e',
  COLOR_BG_GROUND: '#2d1f0e',
  COLOR_GRASS: '#1a3a1a',
  COLOR_WOOD: '#8B6914',
  COLOR_STRING: '#CCCCCC',
  COLOR_ARROW_SHAFT: '#C4A35A',
  COLOR_ARROW_TIP: '#888888',
  COLOR_ARROW_FEATHER: '#CC3333',
  COLOR_UI_BG: 'rgba(10, 10, 30, 0.85)',
  COLOR_UI_BORDER: 'rgba(180, 140, 80, 0.6)',
  COLOR_UI_TEXT: '#E8D5B0',
  COLOR_UI_ACCENT: '#FF6644',
  COLOR_UI_GOLD: '#FFD700',
  COLOR_UI_COMBO: '#FF44FF',

  // Challenge mode targets
  CHALLENGE_TARGETS: [
    { type: 'bullseye', description: '命中靶心', zone: 0, count: 1 },
    { type: 'moving', description: '命中移动靶', count: 2 },
    { type: 'balloon', description: '击破气球', count: 3 },
    { type: 'bullseye', description: '连续3次8分以上', zone: 1, count: 3, consecutive: true },
    { type: 'apple', description: '命中苹果', count: 1 },
  ],
};
