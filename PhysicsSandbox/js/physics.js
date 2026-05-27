// ============================================================
// physics.js — 物理引擎 (刚体、碰撞、约束)
// ============================================================

import { PHYSICS, CONSTRAINTS } from './config.js';
import { playCollision } from './sound.js';

// ======================== 向量工具 ========================
export const Vec2 = {
    add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; },
    sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; },
    scale(a, s) { return { x: a.x * s, y: a.y * s }; },
    dot(a, b) { return a.x * b.x + a.y * b.y; },
    cross(a, b) { return a.x * b.y - a.y * b.x; },
    len(a) { return Math.sqrt(a.x * a.x + a.y * a.y); },
    lenSq(a) { return a.x * a.x + a.y * a.y; },
    normalize(a) {
        const l = Vec2.len(a);
        return l > 0 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
    },
    dist(a, b) { return Vec2.len(Vec2.sub(a, b)); },
    distSq(a, b) { return Vec2.lenSq(Vec2.sub(a, b)); },
    rotate(v, angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
    },
    perpCW(v) { return { x: v.y, y: -v.x }; },
    perpCCW(v) { return { x: -v.y, y: v.x }; },
    lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; },
    neg(a) { return { x: -a.x, y: -a.y }; },
    clone(a) { return { x: a.x, y: a.y }; },
};

// ======================== 刚体 ========================
let nextId = 1;

export class Body {
    constructor(opts = {}) {
        this.id = nextId++;
        this.pos = opts.pos ? Vec2.clone(opts.pos) : { x: 0, y: 0 };
        this.vel = opts.vel ? Vec2.clone(opts.vel) : { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        this.angle = opts.angle || 0;
        this.angularVel = opts.angularVel || 0;
        this.torque = 0;
        this.mass = opts.mass || 1;
        this.invMass = this.mass > 0 ? 1 / this.mass : 0;
        this.inertia = opts.inertia || this.mass * 1000;
        this.invInertia = this.inertia > 0 ? 1 / this.inertia : 0;
        this.restitution = opts.restitution ?? PHYSICS.restitution;
        this.friction = opts.friction ?? PHYSICS.friction;
        this.isStatic = opts.isStatic || false;
        this.shape = opts.shape || 'circle';
        this.shapeData = opts.shapeData || {};
        this.color = opts.color || '#FFFFFF';
        this.trail = [];
        this.sleeping = false;
        this.sleepTimer = 0;
        this.userData = opts.userData || {};
        if (this.isStatic) {
            this.mass = 0;
            this.invMass = 0;
            this.inertia = 0;
            this.invInertia = 0;
        }
    }

    applyForce(force) {
        if (this.isStatic) return;
        this.acc.x += force.x * this.invMass;
        this.acc.y += force.y * this.invMass;
    }

    applyImpulse(impulse, contactPoint) {
        if (this.isStatic) return;
        this.vel.x += impulse.x * this.invMass;
        this.vel.y += impulse.y * this.invMass;
        if (contactPoint) {
            const r = Vec2.sub(contactPoint, this.pos);
            this.angularVel += Vec2.cross(r, impulse) * this.invInertia;
        }
    }

    getAABB() {
        if (this.shape === 'circle') {
            const r = this.shapeData.radius || 20;
            return {
                minX: this.pos.x - r,
                minY: this.pos.y - r,
                maxX: this.pos.x + r,
                maxY: this.pos.y + r,
            };
        }
        const pts = this.getVertices();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of pts) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return { minX, minY, maxX, maxY };
    }

    getVertices() {
        if (this.shape === 'circle') return [];
        const sd = this.shapeData;
        let local;
        if (this.shape === 'rectangle') {
            const hw = (sd.width || 60) / 2;
            const hh = (sd.height || 40) / 2;
            local = [{ x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh }];
        } else if (this.shape === 'triangle') {
            const s = sd.size || 50;
            const h = s * Math.sqrt(3) / 2;
            local = [
                { x: 0, y: -h * 2 / 3 },
                { x: -s / 2, y: h / 3 },
                { x: s / 2, y: h / 3 },
            ];
        } else if (this.shape === 'polygon') {
            const sides = sd.sides || 5;
            const r = sd.radius || 40;
            local = [];
            for (let i = 0; i < sides; i++) {
                const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
                local.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }
        } else {
            local = [];
        }
        return local.map(v => Vec2.add(this.pos, Vec2.rotate(v, this.angle)));
    }
}

// ======================== 碰撞对 ========================
export class Contact {
    constructor(bodyA, bodyB, normal, depth, contacts) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.normal = normal;
        this.depth = depth;
        this.contacts = contacts;
    }
}

// ======================== 碰撞检测 ========================
function AABBOverlap(a, b) {
    const aabbA = a.getAABB();
    const aabbB = b.getAABB();
    return aabbA.minX < aabbB.maxX && aabbA.maxX > aabbB.minX &&
           aabbA.minY < aabbB.maxY && aabbA.maxY > aabbB.minY;
}

function circleVsCircle(a, b) {
    const diff = Vec2.sub(b.pos, a.pos);
    const dist = Vec2.len(diff);
    const rA = a.shapeData.radius || 20;
    const rB = b.shapeData.radius || 20;
    const pen = rA + rB - dist;
    if (pen <= 0) return null;
    const normal = dist > 0 ? Vec2.scale(diff, 1 / dist) : { x: 0, y: -1 };
    const contact = Vec2.add(a.pos, Vec2.scale(normal, rA));
    return new Contact(a, b, normal, pen, [contact]);
}

function getAxes(vertices) {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        const edge = Vec2.sub(vertices[j], vertices[i]);
        axes.push(Vec2.normalize(Vec2.perpCW(edge)));
    }
    return axes;
}

function projectOnAxis(vertices, axis) {
    let min = Infinity, max = -Infinity;
    for (const v of vertices) {
        const proj = Vec2.dot(v, axis);
        if (proj < min) min = proj;
        if (proj > max) max = proj;
    }
    return { min, max };
}

function polygonVsPolygon(a, b) {
    const vertsA = a.getVertices();
    const vertsB = b.getVertices();
    if (vertsA.length === 0 || vertsB.length === 0) return null;

    const axes = [...getAxes(vertsA), ...getAxes(vertsB)];
    let minDepth = Infinity;
    let bestAxis = null;

    for (const axis of axes) {
        const projA = projectOnAxis(vertsA, axis);
        const projB = projectOnAxis(vertsB, axis);
        const overlap = Math.min(projA.max - projB.min, projB.max - projA.min);
        if (overlap <= 0) return null;
        if (overlap < minDepth) {
            minDepth = overlap;
            bestAxis = axis;
        }
    }

    // 确保法线从A指向B
    const d = Vec2.sub(b.pos, a.pos);
    if (Vec2.dot(d, bestAxis) < 0) {
        bestAxis = Vec2.neg(bestAxis);
    }

    // 计算接触点（简化：使用最近顶点）
    let contacts = [];
    let minDist = Infinity;
    for (const v of vertsB) {
        const dist = Math.abs(Vec2.dot(Vec2.sub(v, a.pos), bestAxis));
        if (dist < minDist + 5) {
            contacts.push(v);
            minDist = dist;
        }
    }
    if (contacts.length > 2) contacts = contacts.slice(0, 2);
    if (contacts.length === 0) {
        contacts = [Vec2.lerp(a.pos, b.pos, 0.5)];
    }

    return new Contact(a, b, bestAxis, minDepth, contacts);
}

function circleVsPolygon(circle, polygon) {
    const verts = polygon.getVertices();
    if (verts.length === 0) return null;
    const r = circle.shapeData.radius || 20;

    // 找最近边
    let minDist = Infinity;
    let closest = null;
    let bestNormal = null;

    for (let i = 0; i < verts.length; i++) {
        const j = (i + 1) % verts.length;
        const edge = Vec2.sub(verts[j], verts[i]);
        const toCircle = Vec2.sub(circle.pos, verts[i]);
        let t = Vec2.dot(toCircle, edge) / Vec2.dot(edge, edge);
        t = Math.max(0, Math.min(1, t));
        const closestPt = Vec2.add(verts[i], Vec2.scale(edge, t));
        const dist = Vec2.dist(circle.pos, closestPt);
        if (dist < minDist) {
            minDist = dist;
            closest = closestPt;
            bestNormal = Vec2.normalize(Vec2.sub(circle.pos, closestPt));
        }
    }

    const pen = r - minDist;
    if (pen <= 0) return null;

    return new Contact(circle, polygon, bestNormal, pen, [closest]);
}

function detectCollision(a, b) {
    if (a.shape === 'circle' && b.shape === 'circle') {
        return circleVsCircle(a, b);
    }
    if (a.shape === 'circle' && b.shape !== 'circle') {
        return circleVsPolygon(a, b);
    }
    if (a.shape !== 'circle' && b.shape === 'circle') {
        const c = circleVsPolygon(b, a);
        if (c) {
            c.bodyA = a;
            c.bodyB = b;
            c.normal = Vec2.neg(c.normal);
        }
        return c;
    }
    return polygonVsPolygon(a, b);
}

// ======================== 碰撞响应 ========================
function resolveCollision(contact) {
    const { bodyA, bodyB, normal, depth, contacts } = contact;
    const e = Math.min(bodyA.restitution, bodyB.restitution);
    const sf = (bodyA.friction + bodyB.friction) / 2;

    // 位置修正
    const totalInvMass = bodyA.invMass + bodyB.invMass;
    if (totalInvMass === 0) return;
    const correction = Vec2.scale(normal, depth / totalInvMass * 0.8);
    if (!bodyA.isStatic) bodyA.pos = Vec2.sub(bodyA.pos, Vec2.scale(correction, bodyA.invMass));
    if (!bodyB.isStatic) bodyB.pos = Vec2.add(bodyB.pos, Vec2.scale(correction, bodyB.invMass));

    for (const cp of contacts) {
        const rA = Vec2.sub(cp, bodyA.pos);
        const rB = Vec2.sub(cp, bodyB.pos);

        const velA = Vec2.add(bodyA.vel, Vec2.scale(Vec2.perpCCW(rA), bodyA.angularVel));
        const velB = Vec2.add(bodyB.vel, Vec2.scale(Vec2.perpCCW(rB), bodyB.angularVel));
        const relVel = Vec2.sub(velA, velB);
        const contactVel = Vec2.dot(relVel, normal);

        if (contactVel > 0) continue;

        const rACrossN = Vec2.cross(rA, normal);
        const rBCrossN = Vec2.cross(rB, normal);
        const invMassSum = bodyA.invMass + bodyB.invMass +
            rACrossN * rACrossN * bodyA.invInertia +
            rBCrossN * rBCrossN * bodyB.invInertia;

        const j = -(1 + e) * contactVel / invMassSum / contacts.length;
        const impulse = Vec2.scale(normal, j);

        if (!bodyA.isStatic) {
            bodyA.vel = Vec2.add(bodyA.vel, Vec2.scale(impulse, bodyA.invMass));
            bodyA.angularVel += Vec2.cross(rA, impulse) * bodyA.invInertia;
        }
        if (!bodyB.isStatic) {
            bodyB.vel = Vec2.sub(bodyB.vel, Vec2.scale(impulse, bodyB.invMass));
            bodyB.angularVel -= Vec2.cross(rB, impulse) * bodyB.invInertia;
        }

        // 摩擦
        let tangent = Vec2.sub(relVel, Vec2.scale(normal, Vec2.dot(relVel, normal)));
        const tLen = Vec2.len(tangent);
        if (tLen > 0.001) {
            tangent = Vec2.scale(tangent, 1 / tLen);
            const jt = -Vec2.dot(relVel, tangent) / invMassSum / contacts.length;
            const frictionImpulse = Math.abs(jt) < j * sf
                ? Vec2.scale(tangent, jt)
                : Vec2.scale(tangent, -j * sf);

            if (!bodyA.isStatic) {
                bodyA.vel = Vec2.add(bodyA.vel, Vec2.scale(frictionImpulse, bodyA.invMass));
                bodyA.angularVel += Vec2.cross(rA, frictionImpulse) * bodyA.invInertia;
            }
            if (!bodyB.isStatic) {
                bodyB.vel = Vec2.sub(bodyB.vel, Vec2.scale(frictionImpulse, bodyB.invMass));
                bodyB.angularVel -= Vec2.cross(rB, frictionImpulse) * bodyB.invInertia;
            }
        }
    }
}

// ======================== 约束系统 ========================
export class Constraint {
    constructor(type, bodyA, bodyB, opts = {}) {
        this.type = type;
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.anchorA = opts.anchorA ? Vec2.clone(opts.anchorA) : Vec2.clone(bodyA.pos);
        this.anchorB = opts.anchorB ? Vec2.clone(opts.anchorB) : Vec2.clone(bodyB.pos);
        this.restLength = opts.restLength ?? Vec2.dist(bodyA.pos, bodyB.pos);
        const cfg = CONSTRAINTS[type] || CONSTRAINTS.spring;
        this.stiffness = opts.stiffness ?? cfg.stiffness;
        this.damping = opts.damping ?? cfg.damping;
        this.breakForce = opts.breakForce || Infinity;
        this.broken = false;
    }
}

function solveConstraint(c) {
    if (c.broken) return;
    const { bodyA, bodyB, type } = c;

    const anchorAWorld = Vec2.add(bodyA.pos, Vec2.rotate(c.anchorA, bodyA.angle));
    const anchorBWorld = Vec2.add(bodyB.pos, Vec2.rotate(c.anchorB, bodyB.angle));
    const diff = Vec2.sub(anchorBWorld, anchorAWorld);
    const dist = Vec2.len(diff);

    if (dist < 0.0001) return;

    let force = { x: 0, y: 0 };

    if (type === 'spring') {
        const stretch = dist - c.restLength;
        const dir = Vec2.scale(diff, 1 / dist);
        const relVel = Vec2.sub(bodyB.vel, bodyA.vel);
        const dampForce = Vec2.dot(relVel, dir) * c.damping;
        force = Vec2.scale(dir, stretch * c.stiffness + dampForce);
    } else if (type === 'rope') {
        if (dist > c.restLength) {
            const stretch = dist - c.restLength;
            const dir = Vec2.scale(diff, 1 / dist);
            const relVel = Vec2.sub(bodyB.vel, bodyA.vel);
            const dampForce = Vec2.dot(relVel, dir) * c.damping;
            force = Vec2.scale(dir, stretch * c.stiffness + dampForce);
        }
    } else if (type === 'hinge') {
        const stretch = dist - c.restLength;
        const dir = Vec2.scale(diff, 1 / dist);
        force = Vec2.scale(dir, stretch * c.stiffness);
    }

    // 断裂检测
    const forceMag = Vec2.len(force);
    if (forceMag > c.breakForce) {
        c.broken = true;
        return;
    }

    if (!bodyA.isStatic) {
        bodyA.vel = Vec2.add(bodyA.vel, Vec2.scale(force, bodyA.invMass * (1 / 60)));
    }
    if (!bodyB.isStatic) {
        bodyB.vel = Vec2.sub(bodyB.vel, Vec2.scale(force, bodyB.invMass * (1 / 60)));
    }
}

// ======================== 物理世界 ========================
export class World {
    constructor() {
        this.bodies = [];
        this.constraints = [];
        this.gravity = { ...PHYSICS.gravity };
        this.friction = PHYSICS.friction;
        this.restitution = PHYSICS.restitution;
        this.collisionPairs = [];
        this.particles = []; // 碰撞火花
    }

    addBody(body) {
        this.bodies.push(body);
        return body;
    }

    removeBody(body) {
        const idx = this.bodies.indexOf(body);
        if (idx !== -1) this.bodies.splice(idx, 1);
        // 移除相关约束
        this.constraints = this.constraints.filter(c => c.bodyA !== body && c.bodyB !== body);
    }

    addConstraint(constraint) {
        this.constraints.push(constraint);
        return constraint;
    }

    removeConstraint(constraint) {
        const idx = this.constraints.indexOf(constraint);
        if (idx !== -1) this.constraints.splice(idx, 1);
    }

    clear() {
        this.bodies = [];
        this.constraints = [];
        this.particles = [];
    }

    step(dt) {
        const stepDt = dt || PHYSICS.timeStep;

        // 施加重力
        for (const b of this.bodies) {
            if (b.isStatic) continue;
            b.vel.x += this.gravity.x * stepDt;
            b.vel.y += this.gravity.y * stepDt;
            // 空气阻力
            b.vel.x *= (1 - PHYSICS.airResistance);
            b.vel.y *= (1 - PHYSICS.airResistance);
            b.angularVel *= (1 - PHYSICS.angularDamping);
        }

        // 碰撞检测
        this.collisionPairs = [];
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];
                if (a.isStatic && b.isStatic) continue;
                if (!AABBOverlap(a, b)) continue;
                const contact = detectCollision(a, b);
                if (contact) {
                    this.collisionPairs.push(contact);
                }
            }
        }

        // 碰撞响应
        for (const c of this.collisionPairs) {
            resolveCollision(c);
            // 碰撞火花
            const speed = Vec2.dist(c.bodyA.vel, c.bodyB.vel);
            if (speed > 50) {
                playCollision(speed);
                this.spawnSparks(c.contacts[0], c.normal, speed);
            }
        }

        // 约束求解
        for (let iter = 0; iter < 4; iter++) {
            for (const c of this.constraints) {
                solveConstraint(c);
            }
        }
        // 移除断裂约束
        this.constraints = this.constraints.filter(c => !c.broken);

        // 更新位置
        for (const b of this.bodies) {
            if (b.isStatic) continue;
            b.vel.x += b.acc.x * stepDt;
            b.vel.y += b.acc.y * stepDt;
            b.acc.x = 0;
            b.acc.y = 0;
            // 限速
            const speed = Vec2.len(b.vel);
            if (speed > PHYSICS.maxVelocity) {
                b.vel = Vec2.scale(Vec2.normalize(b.vel), PHYSICS.maxVelocity);
            }
            b.pos.x += b.vel.x * stepDt;
            b.pos.y += b.vel.y * stepDt;
            b.angle += b.angularVel * stepDt;

            // 记录轨迹
            if (b.trail.length > 30) b.trail.shift();
            b.trail.push(Vec2.clone(b.pos));
        }

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= stepDt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.pos.x += p.vel.x * stepDt;
            p.pos.y += p.vel.y * stepDt;
            p.vel.y += this.gravity.y * stepDt * 0.3;
        }
    }

    spawnSparks(pos, normal, speed) {
        const count = Math.min(12, Math.floor(speed / 80));
        for (let i = 0; i < count; i++) {
            const angle = Math.atan2(normal.y, normal.x) + (Math.random() - 0.5) * Math.PI;
            const spd = 50 + Math.random() * 200;
            this.particles.push({
                pos: { x: pos.x, y: pos.y },
                vel: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
                life: 0.2 + Math.random() * 0.3,
                maxLife: 0.5,
                size: 1.5 + Math.random() * 2.5,
                color: `hsl(${30 + Math.random() * 30}, 100%, ${60 + Math.random() * 30}%)`,
            });
        }
    }

    getBodyAt(pos) {
        for (let i = this.bodies.length - 1; i >= 0; i--) {
            const b = this.bodies[i];
            if (b.shape === 'circle') {
                if (Vec2.dist(pos, b.pos) <= (b.shapeData.radius || 20)) return b;
            } else {
                // 简单AABB检测
                const aabb = b.getAABB();
                if (pos.x >= aabb.minX && pos.x <= aabb.maxX &&
                    pos.y >= aabb.minY && pos.y <= aabb.maxY) return b;
            }
        }
        return null;
    }
}
