// ============================================
// Mini Golf - Physics Engine
// ============================================

import { BALL_RADIUS, FRICTION, BOUNCE_FACTOR, BUMPER_BOUNCE, MAX_SPEED,
         STOP_THRESHOLD, HOLE_RADIUS, HOLE_CAPTURE_SPEED, SLOPE_FORCE,
         SAND_FRICTION, COURSE_W, COURSE_H } from './config.js';
import * as Sound from './sound.js';

export function createBall(x, y) {
    return { x, y, vx: 0, vy: 0, inHole: false, inWater: false };
}

export function resetBall(ball, x, y) {
    ball.x = x;
    ball.y = y;
    ball.vx = 0;
    ball.vy = 0;
    ball.inHole = false;
    ball.inWater = false;
}

export function isBallMoving(ball) {
    return !ball.inHole && (Math.abs(ball.vx) > STOP_THRESHOLD || Math.abs(ball.vy) > STOP_THRESHOLD);
}

export function applyShot(ball, vx, vy) {
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > MAX_SPEED) {
        const ratio = MAX_SPEED / speed;
        vx *= ratio;
        vy *= ratio;
    }
    ball.vx = vx;
    ball.vy = vy;
}

// Closest point on segment to point
function closestPointOnSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: x1, y: y1, t: 0 };
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * dx, y: y1 + t * dy, t };
}

// Ball-Wall collision
function collideWall(ball, wall, bounce) {
    const cp = closestPointOnSeg(ball.x, ball.y, wall.x1, wall.y1, wall.x2, wall.y2);
    const dx = ball.x - cp.x, dy = ball.y - cp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < BALL_RADIUS && dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
            ball.vx -= (1 + bounce) * dot * nx;
            ball.vy -= (1 + bounce) * dot * ny;
        }
        const push = BALL_RADIUS - dist + 0.5;
        ball.x += nx * push;
        ball.y += ny * push;
        return true;
    }
    return false;
}

// Ball-Bumper collision
function collideBumper(ball, bumper) {
    const dx = ball.x - bumper.x, dy = ball.y - bumper.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = BALL_RADIUS + bumper.r;
    if (dist < minDist && dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
            ball.vx -= (1 + bumper.bounce) * dot * nx;
            ball.vy -= (1 + bumper.bounce) * dot * ny;
        }
        const push = minDist - dist + 1;
        ball.x += nx * push;
        ball.y += ny * push;
        return true;
    }
    return false;
}

// Ball-Windmill collision
function collideWindmill(ball, wm) {
    const cos = Math.cos(wm.angle), sin = Math.sin(wm.angle);
    let hit = false;
    for (let arm = 0; arm < 4; arm++) {
        const a = wm.angle + arm * Math.PI / 2;
        const ac = Math.cos(a), as = Math.sin(a);
        const x1 = wm.x - ac * wm.armLength, y1 = wm.y - as * wm.armLength;
        const x2 = wm.x + ac * wm.armLength, y2 = wm.y + as * wm.armLength;
        const cp = closestPointOnSeg(ball.x, ball.y, x1, y1, x2, y2);
        const dx = ball.x - cp.x, dy = ball.y - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BALL_RADIUS + wm.bladeWidth / 2 && dist > 0) {
            const nx = dx / dist, ny = dy / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
                ball.vx -= (1 + 0.8) * dot * nx;
                ball.vy -= (1 + 0.8) * dot * ny;
            }
            // Add windmill tangential velocity
            const rx = cp.x - wm.x, ry = cp.y - wm.y;
            const tangentX = -ry * wm.speed * 30;
            const tangentY = rx * wm.speed * 30;
            ball.vx += tangentX * 0.05;
            ball.vy += tangentY * 0.05;
            const push = BALL_RADIUS + wm.bladeWidth / 2 - dist + 1;
            ball.x += nx * push;
            ball.y += ny * push;
            hit = true;
        }
    }
    return hit;
}

// Check if ball is in a rectangle area
function inRect(ball, rect) {
    return ball.x >= rect.x && ball.x <= rect.x + rect.w &&
           ball.y >= rect.y && ball.y <= rect.y + rect.h;
}

// Check ball-hole
function checkHole(ball, holePos) {
    const dx = ball.x - holePos.x, dy = ball.y - holePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (dist < HOLE_RADIUS && speed < HOLE_CAPTURE_SPEED) {
        ball.inHole = true;
        ball.vx = 0;
        ball.vy = 0;
        ball.x = holePos.x;
        ball.y = holePos.y;
        return true;
    }
    // Gravitational pull when close and slow
    if (dist < HOLE_RADIUS * 3 && speed < HOLE_CAPTURE_SPEED * 1.5) {
        const pull = 0.0015 * (1 - dist / (HOLE_RADIUS * 3));
        ball.vx -= dx * pull * dist;
        ball.vy -= dy * pull * dist;
    }
    return false;
}

// Check ball-out-of-bounds (safety)
function checkBounds(ball) {
    const margin = BALL_RADIUS + 5;
    if (ball.x < margin) { ball.x = margin; ball.vx = Math.abs(ball.vx) * 0.5; }
    if (ball.x > COURSE_W - margin) { ball.x = COURSE_W - margin; ball.vx = -Math.abs(ball.vx) * 0.5; }
    if (ball.y < margin) { ball.y = margin; ball.vy = Math.abs(ball.vy) * 0.5; }
    if (ball.y > COURSE_H - margin) { ball.y = COURSE_H - margin; ball.vy = -Math.abs(ball.vy) * 0.5; }
}

// Main physics step
export function step(ball, course, dt = 1) {
    if (ball.inHole) return { wallHit: false, bumperHit: false, waterHit: false, sandHit: false, holeIn: false, windmillHit: false };

    const events = { wallHit: false, bumperHit: false, waterHit: false, sandHit: false, holeIn: false, windmillHit: false };

    // Update windmill angle
    if (course.windmill) {
        course.windmill.angle = (course.windmill.angle || 0) + course.windmill.speed * dt;
    }

    // Apply slopes
    if (course.slopes) {
        for (const s of course.slopes) {
            if (inRect(ball, s)) {
                ball.vx += s.fx * SLOPE_FORCE * dt;
                ball.vy += s.fy * SLOPE_FORCE * dt;
            }
        }
    }

    // Check sand friction
    let onSand = false;
    if (course.sand) {
        for (const s of course.sand) {
            if (inRect(ball, s)) { onSand = true; events.sandHit = true; break; }
        }
    }

    const friction = onSand ? SAND_FRICTION : (FRICTION[course.theme] || FRICTION.grass);

    // Sub-step movement
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const steps = speed > 3 ? Math.ceil(speed / 2) : 1;
    const subDt = dt / steps;

    for (let i = 0; i < steps; i++) {
        ball.x += ball.vx * subDt;
        ball.y += ball.vy * subDt;

        // Wall collisions
        for (const w of course.walls) {
            if (collideWall(ball, w, w.bounce || BOUNCE_FACTOR)) {
                events.wallHit = true;
            }
        }

        // Bumper collisions
        if (course.bumpers) {
            for (const b of course.bumpers) {
                if (collideBumper(ball, b)) {
                    events.bumperHit = true;
                }
            }
        }

        // Windmill collision
        if (course.windmill) {
            if (collideWindmill(ball, course.windmill)) {
                events.windmillHit = true;
            }
        }

        checkBounds(ball);
    }

    // Apply friction
    ball.vx *= Math.pow(friction, dt);
    ball.vy *= Math.pow(friction, dt);

    // Check water
    if (course.water) {
        for (const w of course.water) {
            if (inRect(ball, w)) {
                const speed2 = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (speed2 < 2) {
                    events.waterHit = true;
                    ball.inWater = true;
                    ball.vx = 0;
                    ball.vy = 0;
                } else {
                    ball.vx *= 0.92;
                    ball.vy *= 0.92;
                }
                break;
            }
        }
    }

    // Check hole
    if (checkHole(ball, course.hole)) {
        events.holeIn = true;
    }

    // Stop if very slow
    if (Math.abs(ball.vx) < STOP_THRESHOLD && Math.abs(ball.vy) < STOP_THRESHOLD) {
        ball.vx = 0;
        ball.vy = 0;
    }

    return events;
}

// Simulate trajectory for preview
export function simulateTrajectory(startX, startY, vx, vy, course, maxSteps = 120) {
    const points = [];
    let x = startX, y = startY;
    let svx = vx, svy = vy;
    const friction = FRICTION[course.theme] || FRICTION.grass;

    for (let i = 0; i < maxSteps; i++) {
        x += svx;
        y += svy;

        // Wall bounce
        for (const w of course.walls) {
            const cp = closestPointOnSeg(x, y, w.x1, w.y1, w.x2, w.y2);
            const dx = x - cp.x, dy = y - cp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < BALL_RADIUS && dist > 0) {
                const nx = dx / dist, ny = dy / dist;
                const dot = svx * nx + svy * ny;
                if (dot < 0) {
                    svx -= (1 + BOUNCE_FACTOR) * dot * nx;
                    svy -= (1 + BOUNCE_FACTOR) * dot * ny;
                }
                x += nx * (BALL_RADIUS - dist + 1);
                y += ny * (BALL_RADIUS - dist + 1);
            }
        }

        // Bumper bounce
        if (course.bumpers) {
            for (const b of course.bumpers) {
                const dx = x - b.x, dy = y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < BALL_RADIUS + b.r && dist > 0) {
                    const nx = dx / dist, ny = dy / dist;
                    const dot = svx * nx + svy * ny;
                    if (dot < 0) {
                        svx -= (1 + b.bounce) * dot * nx;
                        svy -= (1 + b.bounce) * dot * ny;
                    }
                }
            }
        }

        svx *= friction;
        svy *= friction;

        if (Math.abs(svx) < 0.05 && Math.abs(svy) < 0.05) break;
        if (x < 10 || x > COURSE_W - 10 || y < 10 || y > COURSE_H - 10) break;

        if (i % 3 === 0) points.push({ x, y, alpha: 1 - i / maxSteps });
    }
    return points;
}
