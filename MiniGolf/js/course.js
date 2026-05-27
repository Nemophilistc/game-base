// ============================================
// Mini Golf - Course Rendering
// ============================================

import { BALL_RADIUS, HOLE_RADIUS, BALL_COLOR, BALL_SHADOW, BALL_SHEEN,
         HOLE_COLOR, HOLE_RING, FLAG_COLOR, WALL_COLOR, WALL_BORDER,
         BUMPER_COLOR, BUMPER_HIGHLIGHT, SAND_COLOR, SAND_DARK,
         WATER_COLOR, WATER_DARK, WATER_HIGHLIGHT, SLOPE_COLOR, SLOPE_ARROW,
         WINDMILL_COLOR, WINDMILL_BLADE, THEMES } from './config.js';

export function getTheme(course) {
    return THEMES[course.theme] || THEMES.grass;
}

// Draw the course background
export function drawCourse(ctx, course, toCanvasX, toCanvasY, scale, frameCount) {
    const theme = getTheme(course);
    const cx1 = toCanvasX(0), cy1 = toCanvasY(0);
    const cw = course.w * scale, ch = course.h * scale;

    // Background
    const grad = ctx.createRadialGradient(
        cx1 + cw / 2, cy1 + ch / 2, 0,
        cx1 + cw / 2, cy1 + ch / 2, Math.max(cw, ch) * 0.7
    );
    grad.addColorStop(0, theme.courseCenter);
    grad.addColorStop(1, theme.course);
    ctx.fillStyle = grad;
    ctx.fillRect(cx1, cy1, cw, ch);

    // Grass texture dots
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 80; i++) {
        const x = cx1 + (i * 137.5 % cw);
        const y = cy1 + (i * 89.3 % ch);
        ctx.beginPath();
        ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    // Slopes
    if (course.slopes) {
        for (const s of course.slopes) {
            const sx = toCanvasX(s.x), sy = toCanvasY(s.y);
            ctx.fillStyle = SLOPE_COLOR;
            ctx.fillRect(sx, sy, s.w * scale, s.h * scale);
            // Arrow showing slope direction
            ctx.strokeStyle = SLOPE_ARROW;
            ctx.lineWidth = 2;
            const dirX = s.fx > 0 ? 1 : s.fx < 0 ? -1 : 0;
            const dirY = s.fy > 0 ? 1 : s.fy < 0 ? -1 : 0;
            for (let i = 0; i < 3; i++) {
                const ax = sx + (s.w * 0.3 + i * s.w * 0.2) * scale;
                const ay = sy + s.h * 0.5 * scale;
                ctx.beginPath();
                ctx.moveTo(ax - dirX * 10 * scale, ay - dirY * 10 * scale);
                ctx.lineTo(ax + dirX * 10 * scale, ay + dirY * 10 * scale);
                ctx.lineTo(ax + dirX * 6 * scale - dirY * 4 * scale, ay + dirY * 6 * scale + dirX * 4 * scale);
                ctx.stroke();
            }
            ctx.lineWidth = 1;
        }
    }

    // Sand traps
    if (course.sand) {
        for (const s of course.sand) {
            const sx = toCanvasX(s.x), sy = toCanvasY(s.y);
            const sandGrad = ctx.createRadialGradient(
                sx + s.w * scale / 2, sy + s.h * scale / 2, 0,
                sx + s.w * scale / 2, sy + s.h * scale / 2, Math.max(s.w, s.h) * scale * 0.6
            );
            sandGrad.addColorStop(0, SAND_COLOR);
            sandGrad.addColorStop(1, SAND_DARK);
            ctx.fillStyle = sandGrad;
            ctx.beginPath();
            ctx.ellipse(sx + s.w * scale / 2, sy + s.h * scale / 2,
                       s.w * scale / 2, s.h * scale / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Sand dots
            ctx.fillStyle = 'rgba(180,160,120,0.3)';
            for (let i = 0; i < 12; i++) {
                const dx = sx + (s.w * (0.1 + Math.random() * 0.8)) * scale;
                const dy = sy + (s.h * (0.1 + Math.random() * 0.8)) * scale;
                ctx.beginPath();
                ctx.arc(dx, dy, 1.5 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Water hazards
    if (course.water) {
        for (const w of course.water) {
            const wx = toCanvasX(w.x), wy = toCanvasY(w.y);
            const waterGrad = ctx.createRadialGradient(
                wx + w.w * scale / 2, wy + w.h * scale / 2, 0,
                wx + w.w * scale / 2, wy + w.h * scale / 2, Math.max(w.w, w.h) * scale * 0.6
            );
            waterGrad.addColorStop(0, WATER_COLOR);
            waterGrad.addColorStop(1, WATER_DARK);
            ctx.fillStyle = waterGrad;
            ctx.beginPath();
            ctx.ellipse(wx + w.w * scale / 2, wy + w.h * scale / 2,
                       w.w * scale / 2, w.h * scale / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Animated water ripples
            const time = frameCount * 0.03;
            ctx.strokeStyle = WATER_HIGHLIGHT;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const rx = w.w * 0.15 * (i + 1) * scale;
                const ry = w.h * 0.12 * (i + 1) * scale;
                ctx.globalAlpha = 0.3 - i * 0.08;
                ctx.beginPath();
                ctx.ellipse(wx + w.w * scale / 2 + Math.sin(time + i) * 5 * scale,
                           wy + w.h * scale / 2, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;
        }
    }

    // Hole (cup)
    const hx = toCanvasX(course.hole.x), hy = toCanvasY(course.hole.y);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(hx + 2 * scale, hy + 2 * scale, HOLE_RADIUS * scale, 0, Math.PI * 2);
    ctx.fill();
    // Ring
    ctx.fillStyle = HOLE_RING;
    ctx.beginPath();
    ctx.arc(hx, hy, HOLE_RADIUS * scale + 2, 0, Math.PI * 2);
    ctx.fill();
    // Cup
    ctx.fillStyle = HOLE_COLOR;
    ctx.beginPath();
    ctx.arc(hx, hy, HOLE_RADIUS * scale, 0, Math.PI * 2);
    ctx.fill();
    // Inner gradient
    const holeGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, HOLE_RADIUS * scale);
    holeGrad.addColorStop(0, '#000000');
    holeGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(hx, hy, HOLE_RADIUS * scale * 0.8, 0, Math.PI * 2);
    ctx.fill();
    // Flag
    const flagH = 35 * scale;
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx, hy - flagH);
    ctx.stroke();
    ctx.fillStyle = FLAG_COLOR;
    ctx.beginPath();
    ctx.moveTo(hx, hy - flagH);
    ctx.lineTo(hx + 14 * scale, hy - flagH + 8 * scale);
    ctx.lineTo(hx, hy - flagH + 16 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;
}

// Draw walls
export function drawWalls(ctx, course, toCanvasX, toCanvasY, scale) {
    for (const w of course.walls) {
        const sx = toCanvasX(w.x1), sy = toCanvasY(w.y1);
        const ex = toCanvasX(w.x2), ey = toCanvasY(w.y2);

        // Shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 8 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + 2);
        ctx.lineTo(ex + 2, ey + 2);
        ctx.stroke();

        // Main wall
        ctx.strokeStyle = WALL_COLOR;
        ctx.lineWidth = 6 * scale;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }
    ctx.lineCap = 'butt';
    ctx.lineWidth = 1;
}

// Draw bumpers
export function drawBumpers(ctx, course, toCanvasX, toCanvasY, scale) {
    if (!course.bumpers) return;
    for (const b of course.bumpers) {
        const bx = toCanvasX(b.x), by = toCanvasY(b.y);
        const r = b.r * scale;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(bx + 2, by + 2, r, 0, Math.PI * 2);
        ctx.fill();
        // Body
        const bGrad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0, bx, by, r);
        bGrad.addColorStop(0, BUMPER_HIGHLIGHT);
        bGrad.addColorStop(1, BUMPER_COLOR);
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
        // Ring
        ctx.strokeStyle = '#CC2222';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.stroke();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(bx - r * 0.25, by - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.lineWidth = 1;
}

// Draw windmill
export function drawWindmill(ctx, wm, toCanvasX, toCanvasY, scale) {
    if (!wm) return;
    const wx = toCanvasX(wm.x), wy = toCanvasY(wm.y);
    const angle = wm.angle || 0;

    // Center post
    ctx.fillStyle = WINDMILL_COLOR;
    ctx.beginPath();
    ctx.arc(wx, wy, 10 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Blades
    ctx.save();
    ctx.translate(wx, wy);
    for (let arm = 0; arm < 4; arm++) {
        ctx.save();
        ctx.rotate(angle + arm * Math.PI / 2);
        // Blade
        const bladeGrad = ctx.createLinearGradient(0, 0, wm.armLength * scale, 0);
        bladeGrad.addColorStop(0, WINDMILL_COLOR);
        bladeGrad.addColorStop(0.5, WINDMILL_BLADE);
        bladeGrad.addColorStop(1, WINDMILL_COLOR);
        ctx.fillStyle = bladeGrad;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -wm.bladeWidth / 2 * scale);
        ctx.lineTo(wm.armLength * scale, -wm.bladeWidth / 4 * scale);
        ctx.lineTo(wm.armLength * scale, wm.bladeWidth / 4 * scale);
        ctx.lineTo(-8 * scale, wm.bladeWidth / 2 * scale);
        ctx.closePath();
        ctx.fill();
        // Border
        ctx.strokeStyle = '#664422';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();

    // Center cap
    ctx.fillStyle = '#553322';
    ctx.beginPath();
    ctx.arc(wx, wy, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
}

// Draw the ball
export function drawBall(ctx, ball, toCanvasX, toCanvasY, scale) {
    const bx = toCanvasX(ball.x), by = toCanvasY(ball.y);
    const r = BALL_RADIUS * scale;

    // Shadow
    ctx.fillStyle = BALL_SHADOW;
    ctx.beginPath();
    ctx.ellipse(bx + 3 * scale, by + 3 * scale, r * 1.1, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball body
    const ballGrad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0, bx, by, r);
    ballGrad.addColorStop(0, '#FFFFFF');
    ballGrad.addColorStop(0.7, '#E8E8E8');
    ballGrad.addColorStop(1, '#CCCCCC');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();

    // Sheen
    ctx.fillStyle = BALL_SHEEN;
    ctx.beginPath();
    ctx.arc(bx - r * 0.25, by - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw aim line
// dragDx, dragDy are in canvas-pixel units (offset from ball to cursor in canvas space)
export function drawAimLine(ctx, ballX, ballY, dragDx, dragDy, power, trajectoryPoints, toCanvasX, toCanvasY, scale) {
    if (power <= 0) return;

    const bx = toCanvasX(ballX), by = toCanvasY(ballY);

    // Power indicator glow
    ctx.globalAlpha = 0.1 + power * 0.2;
    ctx.strokeStyle = power < 0.5 ? '#44FF44' : power < 0.8 ? '#FFAA00' : '#FF3333';
    ctx.lineWidth = 18 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(bx, by, 25 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';

    // Trajectory dots
    if (trajectoryPoints && trajectoryPoints.length > 0) {
        for (let i = 0; i < trajectoryPoints.length; i++) {
            const p = trajectoryPoints[i];
            const px = toCanvasX(p.x), py = toCanvasY(p.y);
            ctx.globalAlpha = p.alpha * 0.5;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px, py, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Direction arrow (shoots opposite to drag)
    // dragDx/dragDy = cursor - ball in canvas pixels
    // Shot direction = ball - cursor = -drag
    const ax = -dragDx, ay = -dragDy;
    const len = Math.sqrt(ax * ax + ay * ay);
    if (len < 5) return;
    const nx = ax / len, ny = ay / len;
    const arrowLen = Math.min(len * 0.4, 60 * scale);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * scale;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(bx + nx * 20 * scale, by + ny * 20 * scale);
    ctx.lineTo(bx + nx * (20 * scale + arrowLen), by + ny * (20 * scale + arrowLen));
    ctx.stroke();
    // Arrowhead
    const tipX = bx + nx * (20 * scale + arrowLen);
    const tipY = by + ny * (20 * scale + arrowLen);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - nx * 8 * scale + ny * 5 * scale, tipY - ny * 8 * scale - nx * 5 * scale);
    ctx.lineTo(tipX - nx * 8 * scale - ny * 5 * scale, tipY - ny * 8 * scale + nx * 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
}
