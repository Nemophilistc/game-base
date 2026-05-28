// ============================================================
// config.js - Game constants and physics parameters
// ============================================================

export const PHYSICS = {
    GRAVITY: 0.15,
    AIR_DENSITY: 0.01,
    LIFT_COEFFICIENT: 0.08,
    DRAG_COEFFICIENT: 0.003,
    THRUST_MAX: 0.35,
    THRUST_ACCEL: 0.008,
    PITCH_SPEED: 0.04,
    FINE_PITCH_SPEED: 0.015,
    MAX_VELOCITY: 12,
    MIN_STALL_SPEED: 2.5,
    STALL_PENALTY: 0.12,
    BOUNCE_FACTOR: 0.4,
    GROUND_FRICTION: 0.92,
};

export const PLANE = {
    WIDTH: 60,
    HEIGHT: 20,
    START_X: 200,
    START_Y: 300,
    START_FUEL: 100,
    FUEL_CONSUMPTION_BASE: 0.02,
    FUEL_CONSUMPTION_BOOST: 0.08,
    BOOST_SPEED_MULT: 2.0,
    BOOST_DURATION: 180,
    SHIELD_DURATION: 300,
};

export const TERRAIN = {
    GROUND_Y: 0.75,
    MOUNTAIN_COUNT: 8,
    MOUNTAIN_MIN_HEIGHT: 80,
    MOUNTAIN_MAX_HEIGHT: 280,
    MOUNTAIN_MIN_WIDTH: 150,
    MOUNTAIN_MAX_WIDTH: 400,
    CLOUD_COUNT: 12,
    CLOUD_MIN_Y: 0.08,
    CLOUD_MAX_Y: 0.45,
    SCROLL_SPEED: 0.3,
    MOUNTAIN_COLORS: ['#4a6741', '#3d5a35', '#5a7a50', '#6b8b60'],
    SNOW_COLOR: '#f0f0f0',
    SKY_TOP: '#1a3a6b',
    SKY_BOTTOM: '#87ceeb',
    GROUND_TOP: '#4a7a3a',
    GROUND_BOTTOM: '#3a6a2a',
};

export const OBSTACLES = {
    BALLOON_COUNT: 4,
    BALLOON_SIZE: 30,
    BALLOON_PENALTY: -50,
    BIRD_COUNT: 6,
    BIRD_SIZE: 20,
    BIRD_SPEED_MIN: 1.5,
    BIRD_SPEED_MAX: 4,
    BIRD_WANDER_RANGE: 120,
    STORM_COUNT: 2,
    STORM_RADIUS: 90,
    STORM_TURBULENCE: 0.6,
    STORM_INTERVAL_MIN: 180,
    STORM_INTERVAL_MAX: 420,
    MOUNTAIN_HITBOX_SHRINK: 15,
};

export const COLLECTIBLES = {
    STAR_COUNT: 8,
    STAR_SIZE: 18,
    STAR_SCORE: 100,
    FUEL_COUNT: 4,
    FUEL_SIZE: 22,
    FUEL_AMOUNT: 30,
    BOOST_COUNT: 2,
    BOOST_SIZE: 20,
    SHIELD_COUNT: 2,
    SHIELD_SIZE: 22,
    SPAWN_RANGE_X: 600,
    SPAWN_RANGE_Y_MIN: 0.1,
    SPAWN_RANGE_Y_MAX: 0.7,
    RESPAWN_INTERVAL: 300,
};

export const EFFECTS = {
    TRAIL_PARTICLES: 60,
    TRAIL_LIFETIME: 40,
    TRAIL_SIZE_MIN: 2,
    TRAIL_SIZE_MAX: 6,
    EXPLOSION_PARTICLES: 50,
    EXPLOSION_LIFETIME: 50,
    SPARK_PARTICLES: 15,
    SPARK_LIFETIME: 20,
    CLOUD_PUFF_COUNT: 20,
    CLOUD_PUFF_LIFETIME: 60,
};

export const SCORING = {
    DISTANCE_RATE: 0.1,
    STAR_BONUS: 100,
    BALLOON_PENALTY: -50,
};

export const UI = {
    FONT_FAMILY: '"Microsoft YaHei", "SimHei", Arial, sans-serif',
    HUD_COLOR: '#ffffff',
    HUD_SHADOW: '#000000',
    WARNING_COLOR: '#ff4444',
    FUEL_COLOR: '#44ff44',
    FUEL_LOW_COLOR: '#ffaa00',
    BOOST_COLOR: '#44aaff',
    SHIELD_COLOR: '#44ffff',
};

export const WORLD = {
    WIDTH: 3000,
    HEIGHT: 900,
    CEILING: 50,
    FLOOR_OFFSET: 60,
};
