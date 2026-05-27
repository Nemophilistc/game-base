// ============================================================
// shapes.js — 形状创建工厂
// ============================================================

import { SHAPES, COLORS, PHYSICS } from './config.js';
import { Body } from './physics.js';

function computeMass(shape, shapeData, density) {
    if (shape === 'circle') {
        const r = shapeData.radius || 20;
        return Math.PI * r * r * density / 1000;
    }
    if (shape === 'rectangle') {
        return (shapeData.width || 60) * (shapeData.height || 40) * density / 1000;
    }
    if (shape === 'triangle') {
        const s = shapeData.size || 50;
        return (Math.sqrt(3) / 4) * s * s * density / 1000;
    }
    if (shape === 'polygon') {
        const sides = shapeData.sides || 5;
        const r = shapeData.radius || 40;
        return (sides * r * r * Math.sin(Math.PI * 2 / sides) / 2) * density / 1000;
    }
    return 1;
}

function computeInertia(shape, shapeData, mass) {
    if (shape === 'circle') {
        const r = shapeData.radius || 20;
        return 0.5 * mass * r * r;
    }
    if (shape === 'rectangle') {
        const w = shapeData.width || 60;
        const h = shapeData.height || 40;
        return mass * (w * w + h * h) / 12;
    }
    // 近似
    return mass * 1000;
}

export function createCircle(pos, opts = {}) {
    const radius = opts.radius || SHAPES.circle.defaultRadius;
    const density = opts.density || SHAPES.circle.defaultDensity;
    const shapeData = { radius };
    const mass = computeMass('circle', shapeData, density);
    const inertia = computeInertia('circle', shapeData, mass);
    return new Body({
        pos,
        shape: 'circle',
        shapeData,
        mass,
        inertia,
        color: opts.color || COLORS.circle,
        isStatic: opts.isStatic || false,
        restitution: opts.restitution ?? PHYSICS.restitution,
        friction: opts.friction ?? PHYSICS.friction,
    });
}

export function createRectangle(pos, opts = {}) {
    const width = opts.width || SHAPES.rectangle.defaultWidth;
    const height = opts.height || SHAPES.rectangle.defaultHeight;
    const density = opts.density || SHAPES.rectangle.defaultDensity;
    const shapeData = { width, height };
    const mass = computeMass('rectangle', shapeData, density);
    const inertia = computeInertia('rectangle', shapeData, mass);
    return new Body({
        pos,
        shape: 'rectangle',
        shapeData,
        mass,
        inertia,
        color: opts.color || COLORS.rectangle,
        isStatic: opts.isStatic || false,
        restitution: opts.restitution ?? PHYSICS.restitution,
        friction: opts.friction ?? PHYSICS.friction,
    });
}

export function createTriangle(pos, opts = {}) {
    const size = opts.size || SHAPES.triangle.defaultSize;
    const density = opts.density || SHAPES.triangle.defaultDensity;
    const shapeData = { size };
    const mass = computeMass('triangle', shapeData, density);
    const inertia = computeInertia('triangle', shapeData, mass);
    return new Body({
        pos,
        shape: 'triangle',
        shapeData,
        mass,
        inertia,
        color: opts.color || COLORS.triangle,
        isStatic: opts.isStatic || false,
        restitution: opts.restitution ?? PHYSICS.restitution,
        friction: opts.friction ?? PHYSICS.friction,
    });
}

export function createPolygon(pos, opts = {}) {
    const sides = opts.sides || SHAPES.polygon.defaultSides;
    const radius = opts.radius || SHAPES.polygon.defaultSize;
    const density = opts.density || SHAPES.polygon.defaultDensity;
    const shapeData = { sides, radius };
    const mass = computeMass('polygon', shapeData, density);
    const inertia = computeInertia('polygon', shapeData, mass);
    return new Body({
        pos,
        shape: 'polygon',
        shapeData,
        mass,
        inertia,
        color: opts.color || COLORS.polygon,
        isStatic: opts.isStatic || false,
        restitution: opts.restitution ?? PHYSICS.restitution,
        friction: opts.friction ?? PHYSICS.friction,
    });
}

// 根据类型创建
export function createShape(type, pos, opts = {}) {
    switch (type) {
        case 'circle': return createCircle(pos, opts);
        case 'rectangle': return createRectangle(pos, opts);
        case 'triangle': return createTriangle(pos, opts);
        case 'polygon': return createPolygon(pos, opts);
        default: return createCircle(pos, opts);
    }
}
