// ============================================
// Mini Golf - Configuration & Constants
// ============================================

export const CANVAS_MAX_W = 800;
export const CANVAS_MAX_H = 900;
export const COURSE_W = 600;
export const COURSE_H = 800;

// Physics
export const BALL_RADIUS = 10;
export const FRICTION = {
    grass: 0.985,
    ice: 0.996,
    desert: 0.975
};
export const BOUNCE_FACTOR = 0.7;
export const BUMPER_BOUNCE = 1.3;
export const MAX_SPEED = 10;
export const STOP_THRESHOLD = 0.08;
export const HOLE_RADIUS = 15;
export const HOLE_CAPTURE_SPEED = 6;
export const SLOPE_FORCE = 0.012;
export const SAND_FRICTION = 0.95;
export const MAX_DRAG = 200;

// Aim line
export const AIM_DOT_COUNT = 30;
export const AIM_DOT_INTERVAL = 3;

// Visual
export const BALL_COLOR = '#FFFFFF';
export const BALL_SHADOW = 'rgba(0,0,0,0.35)';
export const BALL_SHEEN = 'rgba(255,255,255,0.8)';
export const HOLE_COLOR = '#1a1a1a';
export const HOLE_RING = '#0a0a0a';
export const FLAG_COLOR = '#FF3333';
export const WALL_COLOR = '#FFFFFF';
export const WALL_BORDER = '#888888';
export const BUMPER_COLOR = '#FF4444';
export const BUMPER_HIGHLIGHT = '#FF8888';
export const SAND_COLOR = '#E8D5A3';
export const SAND_DARK = '#D4C090';
export const WATER_COLOR = '#4488CC';
export const WATER_DARK = '#3366AA';
export const WATER_HIGHLIGHT = 'rgba(255,255,255,0.15)';
export const SLOPE_COLOR = 'rgba(255,255,255,0.08)';
export const SLOPE_ARROW = 'rgba(255,255,255,0.15)';
export const WINDMILL_COLOR = '#885533';
export const WINDMILL_BLADE = '#BB8844';
export const TUNNEL_COLOR = '#555555';
export const TUNNEL_OPENING = '#333333';
export const TRAIL_COLOR = 'rgba(255,255,255,0.15)';

// Effects
export const TRAIL_LENGTH = 20;
export const CONFETTI_COUNT = 60;
export const SPLASH_COUNT = 12;
export const DUST_COUNT = 6;
export const SPARK_COUNT = 4;
export const CELEBRATION_DURATION = 2000;

// Theme colors
export const THEMES = {
    grass: {
        course: '#3A7D3A',
        courseCenter: '#4A9D4A',
        border: '#2D6B2D',
        accent: '#5AB85A'
    },
    desert: {
        course: '#C2A66B',
        courseCenter: '#D4B87D',
        border: '#A8904F',
        accent: '#E0C88F'
    },
    ice: {
        course: '#7EC8E8',
        courseCenter: '#96D6F0',
        border: '#5AADCC',
        accent: '#B0E4F8'
    }
};

// Course names (Chinese)
export const COURSE_NAMES = [
    '直线推杆',
    '直角弯道',
    '弹珠迷阵',
    '风车田园',
    '之字险途',
    'S弯挑战',
    '窄道穿梭',
    '三角绕行',
    '钻石赛道',
    '环形回路',
    '弹射狂欢',
    '双风车之路',
    '水障碍区',
    '沙漠迷踪',
    '冰面滑行',
    '终极迷宫',
    '风车堡垒',
    '冠军之路'
];

// Full course data
export const COURSES = [
    // Hole 1: 直线推杆
    {
        par: 3,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 100, y1: 30, x2: 500, y2: 30 },
            { x1: 500, y1: 30, x2: 500, y2: 770 },
            { x1: 500, y1: 770, x2: 100, y2: 770 },
            { x1: 100, y1: 770, x2: 100, y2: 30 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 2: 直角弯道
    {
        par: 3,
        start: { x: 300, y: 700 },
        hole: { x: 150, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 80, y1: 30, x2: 520, y2: 30 },
            { x1: 520, y1: 30, x2: 520, y2: 500 },
            { x1: 520, y1: 500, x2: 350, y2: 500 },
            { x1: 350, y1: 500, x2: 350, y2: 770 },
            { x1: 350, y1: 770, x2: 80, y2: 770 },
            { x1: 80, y1: 770, x2: 80, y2: 30 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 3: 弹珠迷阵
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 80, y1: 30, x2: 520, y2: 30 },
            { x1: 520, y1: 30, x2: 520, y2: 770 },
            { x1: 520, y1: 770, x2: 80, y2: 770 },
            { x1: 80, y1: 770, x2: 80, y2: 30 },
            { x1: 150, y1: 600, x2: 450, y2: 600 },
            { x1: 150, y1: 400, x2: 450, y2: 400 },
            { x1: 150, y1: 200, x2: 450, y2: 200 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 4: 风车田园
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 80, y1: 30, x2: 520, y2: 30 },
            { x1: 520, y1: 30, x2: 520, y2: 770 },
            { x1: 520, y1: 770, x2: 80, y2: 770 },
            { x1: 80, y1: 770, x2: 80, y2: 30 }
        ],
        bumpers: [
            { x: 200, y: 350, r: 20, bounce: 1.3 },
            { x: 400, y: 350, r: 20, bounce: 1.3 }
        ],
        sand: [{ x: 250, y: 550, w: 100, h: 60 }],
        water: [{ x: 200, y: 180, w: 200, h: 50 }],
        slopes: [],
        windmill: { x: 300, y: 250, armLength: 80, speed: 0.012, bladeWidth: 12 }
    },
    // Hole 5: 之字险途
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 },
            { x1: 150, y1: 600, x2: 500, y2: 600 },
            { x1: 100, y1: 400, x2: 450, y2: 400 },
            { x1: 150, y1: 200, x2: 500, y2: 200 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 6: S弯挑战
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 },
            { x1: 60, y1: 550, x2: 400, y2: 550 },
            { x1: 200, y1: 300, x2: 540, y2: 300 }
        ],
        bumpers: [],
        sand: [{ x: 400, y: 420, w: 80, h: 60 }],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 7: 窄道穿梭
    {
        par: 3,
        start: { x: 180, y: 700 },
        hole: { x: 420, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 },
            { x1: 60, y1: 350, x2: 200, y2: 350 },
            { x1: 300, y1: 200, x2: 540, y2: 200 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 8: 三角绕行
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 },
            { x1: 300, y1: 200, x2: 450, y2: 450 },
            { x1: 450, y1: 450, x2: 150, y2: 450 },
            { x1: 150, y1: 450, x2: 300, y2: 200 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 9: 钻石赛道
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 },
            { x1: 300, y1: 250, x2: 450, y2: 400 },
            { x1: 450, y1: 400, x2: 300, y2: 550 },
            { x1: 300, y1: 550, x2: 150, y2: 400 },
            { x1: 150, y1: 400, x2: 300, y2: 250 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 10: 环形回路
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 },
            { x1: 220, y1: 350, x2: 300, y2: 270 },
            { x1: 300, y1: 270, x2: 380, y2: 350 },
            { x1: 380, y1: 350, x2: 380, y2: 500 },
            { x1: 380, y1: 500, x2: 300, y2: 580 },
            { x1: 300, y1: 580, x2: 220, y2: 500 },
            { x1: 220, y1: 500, x2: 220, y2: 350 }
        ],
        bumpers: [],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 11: 弹射狂欢
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 }
        ],
        bumpers: [
            { x: 200, y: 300, r: 25, bounce: 1.4 },
            { x: 400, y: 300, r: 25, bounce: 1.4 },
            { x: 300, y: 450, r: 25, bounce: 1.4 },
            { x: 200, y: 550, r: 20, bounce: 1.2 },
            { x: 400, y: 550, r: 20, bounce: 1.2 },
            { x: 300, y: 200, r: 20, bounce: 1.2 }
        ],
        sand: [],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 12: 双风车之路
    {
        par: 5,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 }
        ],
        bumpers: [],
        sand: [{ x: 120, y: 400, w: 80, h: 80 }, { x: 400, y: 400, w: 80, h: 80 }],
        water: [{ x: 230, y: 180, w: 140, h: 40 }],
        slopes: [],
        windmill: { x: 300, y: 500, armLength: 90, speed: 0.015, bladeWidth: 14 }
    },
    // Hole 13: 水障碍区
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 }
        ],
        bumpers: [],
        sand: [{ x: 100, y: 500, w: 100, h: 60 }],
        water: [
            { x: 180, y: 450, w: 240, h: 60 },
            { x: 200, y: 200, w: 200, h: 50 }
        ],
        slopes: [{ x: 200, y: 350, w: 200, h: 80, fx: 0, fy: 0.01 }],
        windmill: null
    },
    // Hole 14: 沙漠迷踪
    {
        par: 4,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 }
        ],
        bumpers: [
            { x: 300, y: 400, r: 30, bounce: 1.2 }
        ],
        sand: [
            { x: 100, y: 350, w: 120, h: 100 },
            { x: 380, y: 350, w: 120, h: 100 },
            { x: 220, y: 550, w: 160, h: 80 },
            { x: 200, y: 150, w: 200, h: 60 }
        ],
        water: [],
        slopes: [],
        windmill: null
    },
    // Hole 15: 冰面滑行
    {
        par: 3,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 100, y1: 30, x2: 500, y2: 30 },
            { x1: 500, y1: 30, x2: 500, y2: 770 },
            { x1: 500, y1: 770, x2: 100, y2: 770 },
            { x1: 100, y1: 770, x2: 100, y2: 30 }
        ],
        bumpers: [
            { x: 200, y: 400, r: 20, bounce: 1.1 },
            { x: 400, y: 400, r: 20, bounce: 1.1 }
        ],
        sand: [],
        water: [{ x: 250, y: 250, w: 100, h: 40 }],
        slopes: [
            { x: 100, y: 300, w: 400, h: 200, fx: 0.008, fy: 0 }
        ],
        windmill: null
    },
    // Hole 16: 终极迷宫
    {
        par: 5,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 },
            { x1: 60, y1: 600, x2: 350, y2: 600 },
            { x1: 250, y1: 450, x2: 540, y2: 450 },
            { x1: 60, y1: 300, x2: 350, y2: 300 },
            { x1: 250, y1: 150, x2: 540, y2: 150 }
        ],
        bumpers: [],
        sand: [],
        water: [{ x: 380, y: 520, w: 100, h: 50 }],
        slopes: [],
        windmill: null
    },
    // Hole 17: 风车堡垒
    {
        par: 5,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 60, y1: 30, x2: 540, y2: 30 },
            { x1: 540, y1: 30, x2: 540, y2: 770 },
            { x1: 540, y1: 770, x2: 60, y2: 770 },
            { x1: 60, y1: 770, x2: 60, y2: 30 }
        ],
        bumpers: [],
        sand: [{ x: 120, y: 600, w: 100, h: 80 }, { x: 380, y: 600, w: 100, h: 80 }],
        water: [{ x: 220, y: 160, w: 160, h: 40 }],
        slopes: [],
        windmill: { x: 300, y: 400, armLength: 100, speed: 0.018, bladeWidth: 16 }
    },
    // Hole 18: 冠军之路
    {
        par: 5,
        start: { x: 300, y: 720 },
        hole: { x: 300, y: 80 },
        w: COURSE_W, h: COURSE_H,
        walls: [
            { x1: 200, y1: 30, x2: 400, y2: 30 },
            { x1: 400, y1: 30, x2: 540, y2: 100 },
            { x1: 540, y1: 100, x2: 540, y2: 700 },
            { x1: 540, y1: 700, x2: 400, y2: 770 },
            { x1: 400, y1: 770, x2: 200, y2: 770 },
            { x1: 200, y1: 770, x2: 60, y2: 700 },
            { x1: 60, y1: 700, x2: 60, y2: 100 },
            { x1: 60, y1: 100, x2: 200, y2: 30 }
        ],
        bumpers: [
            { x: 200, y: 300, r: 20, bounce: 1.2 },
            { x: 400, y: 300, r: 20, bounce: 1.2 },
            { x: 300, y: 500, r: 25, bounce: 1.3 }
        ],
        sand: [
            { x: 100, y: 450, w: 80, h: 60 },
            { x: 420, y: 450, w: 80, h: 60 }
        ],
        water: [
            { x: 230, y: 180, w: 140, h: 40 },
            { x: 230, y: 600, w: 140, h: 40 }
        ],
        slopes: [],
        windmill: { x: 300, y: 350, armLength: 85, speed: 0.015, bladeWidth: 14 }
    }
];
