// ============================================================
// config.js — 物理沙盒常量配置
// ============================================================

export const PHYSICS = {
    gravity: { x: 0, y: 500 },       // 重力加速度 (px/s²)
    friction: 0.3,                     // 全局摩擦系数
    restitution: 0.6,                  // 弹性系数 (0~1)
    airResistance: 0.01,               // 空气阻力
    angularDamping: 0.05,              // 角速度阻尼
    timeStep: 1 / 60,                  // 物理时间步长
    velocityIterations: 8,             // 速度求解迭代次数
    positionIterations: 3,             // 位置求解迭代次数
    maxVelocity: 2000,                 // 最大速度限制
    sleepThreshold: 0.5,               // 休眠阈值
};

export const CONSTRAINTS = {
    spring: {
        stiffness: 50,                 // 弹簧刚度
        damping: 5,                    // 弹簧阻尼
    },
    rope: {
        stiffness: 100,                // 绳索刚度
        damping: 10,                   // 绳索阻尼
    },
    hinge: {
        stiffness: 200,                // 铰链刚度
        damping: 15,                   // 铰链阻尼
    },
};

export const SHAPES = {
    circle: {
        minRadius: 10,
        maxRadius: 120,
        defaultRadius: 30,
        defaultDensity: 1.0,
    },
    rectangle: {
        minWidth: 15,
        maxWidth: 200,
        minHeight: 15,
        maxHeight: 200,
        defaultWidth: 60,
        defaultHeight: 40,
        defaultDensity: 1.0,
    },
    triangle: {
        minSize: 15,
        maxSize: 150,
        defaultSize: 50,
        defaultDensity: 1.0,
    },
    polygon: {
        minSize: 15,
        maxSize: 150,
        defaultSize: 40,
        defaultSides: 5,
        defaultDensity: 1.0,
    },
};

export const COLORS = {
    circle: '#FF6B6B',
    rectangle: '#4ECDC4',
    triangle: '#FFE66D',
    polygon: '#A78BFA',
    selected: '#FFFFFF',
    constraint: '#00FF88',
    spring: '#FF9F43',
    rope: '#E0E0E0',
    hinge: '#FF4757',
    velocity: '#00BFFF',
    trail: 'rgba(255, 255, 255, 0.15)',
    spark: '#FFD700',
    grid: 'rgba(255, 255, 255, 0.06)',
    gridMajor: 'rgba(255, 255, 255, 0.12)',
    background: '#1a1a2e',
    panel: 'rgba(20, 20, 40, 0.85)',
    text: '#E0E0E0',
    accent: '#4ECDC4',
    danger: '#FF6B6B',
    warning: '#FFE66D',
};

export const PARTICLES = {
    sparkCount: 8,                     // 碰撞火花数量
    sparkLife: 0.4,                    // 火花存活时间 (s)
    sparkSpeed: 200,                   // 火花速度
    sparkSize: 3,                      // 火花大小
};

export const RENDERING = {
    lineWidth: 2,
    showVelocity: false,
    showTrails: false,
    showGrid: true,
    trailLength: 30,                   // 轨迹点数
    trailFade: true,                   // 轨迹渐隐
};

export const UI = {
    panelWidth: 220,
    buttonSize: 44,
    fontSize: 13,
    iconSize: 20,
};

export const LAUNCH = {
    maxPower: 800,                     // 最大发射力度
    powerScale: 3,                     // 蓄力缩放系数
};
