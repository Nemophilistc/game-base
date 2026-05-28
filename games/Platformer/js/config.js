// config.js - Game constants and configuration
export const TILE = 32;
export const W = 800;
export const H = 600;

// Physics
export const GRAVITY = 0.55;
export const FRICTION = 0.82;
export const AIR_FRICTION = 0.94;
export const ICE_FRICTION = 0.985;
export const SPEED = 4.2;
export const JUMP = -11.5;
export const WALL_JUMP_X = 7;
export const WALL_JUMP_Y = -10;
export const DASH_SPEED = 16;
export const DASH_DUR = 8;
export const DASH_CD = 120;
export const WALL_SLIDE = 2.2;
export const PW = 20;
export const PH = 28;

// Tile types
export const T = {
    AIR: 0, SOLID: 1, PLATFORM: 2, SPIKE: 3,
    HAZARD: 4, ICE: 5, SAND: 6, DOOR: 7, GOAL: 8,
};

// Game states
export const ST = {
    MENU: 0, SELECT: 1, PLAY: 2, PAUSE: 3, WIN: 4, DEAD: 5,
};

// World themes
export const WORLDS = [
    {
        name: '草地世界', bg: ['#87CEEB', '#E0F0FF'],
        tile: { top: '#5B8C3E', body: '#7B6B3A', topH: '#4A7A30', bodyH: '#6B5B2A' },
        plat: { top: '#A08050', body: '#8B6B40' },
        hazard: '#FF6B6B', spike: '#CC4444',
        bg1: '#A8D8A8', bg2: '#6AAA6A', bg3: '#3A7A3A',
    },
    {
        name: '沙漠世界', bg: ['#FFA07A', '#FFD700'],
        tile: { top: '#DEB887', body: '#C4A06A', topH: '#D0A877', bodyH: '#B4905A' },
        plat: { top: '#CD853F', body: '#A0693D' },
        hazard: '#FF4500', spike: '#CC3300',
        bg1: '#F4C89A', bg2: '#D2A06E', bg3: '#B07842',
    },
    {
        name: '冰雪世界', bg: ['#B0E0E6', '#F0F8FF'],
        tile: { top: '#ADD8E6', body: '#87CEEB', topH: '#9DC8D6', bodyH: '#77BEDB' },
        plat: { top: '#87CEFA', body: '#6BB3D9' },
        hazard: '#4169E1', spike: '#3050CC',
        bg1: '#D8F0F8', bg2: '#B0D8E8', bg3: '#88C0D8',
    },
    {
        name: '熔岩世界', bg: ['#2C1810', '#1A0A05'],
        tile: { top: '#5A5A5A', body: '#3A3A3A', topH: '#4A4A4A', bodyH: '#2A2A2A' },
        plat: { top: '#6A6A6A', body: '#4A4A4A' },
        hazard: '#FF4500', spike: '#CC3300',
        bg1: '#4A2020', bg2: '#3A1515', bg3: '#2A0A0A',
    },
];

// Keys
export const KEYS = {
    LEFT: ['ArrowLeft', 'a', 'A'],
    RIGHT: ['ArrowRight', 'd', 'D'],
    UP: ['ArrowUp', 'w', 'W'],
    DOWN: ['ArrowDown', 's', 'S'],
    JUMP: ['ArrowUp', 'w', 'W', ' '],
    DASH: ['Shift'],
    PAUSE: ['Escape', 'p', 'P'],
};
