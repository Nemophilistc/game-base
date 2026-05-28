// effects.js - Flip animations, placement effects, particles

import { CELL_SIZE, BOARD_PADDING, HUD_HEIGHT, DISC_RADIUS, FLIP_DURATION, PLACE_DURATION, PARTICLE_DURATION, COLORS, BLACK, WHITE } from './config.js';

let flips = [];
let placements = [];
let particles = [];
let globalTime = 0;

export function resetEffects() {
    flips = [];
    placements = [];
    particles = [];
    globalTime = 0;
}

export function updateEffects(dt) {
    globalTime += dt;

    // Update flips
    flips = flips.filter(f => {
        f.progress += dt / f.duration;
        return f.progress < 1;
    });

    // Update placements
    placements = placements.filter(p => {
        p.progress += dt / p.duration;
        return p.progress < 1;
    });

    // Update particles
    particles = particles.filter(p => {
        p.progress += dt / p.duration;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt; // gravity
        return p.progress < 1;
    });
}

export function isAnimating() {
    return flips.length > 0 || placements.length > 0;
}

export function addFlipAnimation(r, c, fromColor, toColor) {
    flips.push({
        r, c, fromColor, toColor,
        progress: 0,
        duration: FLIP_DURATION,
        delay: 0
    });
}

export function addFlipAnimations(flipList, toColor) {
    flipList.forEach((f, i) => {
        const fromColor = toColor === BLACK ? WHITE : BLACK;
        flips.push({
            r: f.r, c: f.c, fromColor, toColor,
            progress: 0,
            duration: FLIP_DURATION,
            delay: i * 50 // cascade delay
        });
    });
}

export function addPlaceAnimation(r, c, color) {
    placements.push({
        r, c, color,
        progress: 0,
        duration: PLACE_DURATION
    });
}

export function getAnimatedCells() {
    const cells = new Set();
    for (const f of flips) cells.add(`${f.r},${f.c}`);
    for (const p of placements) cells.add(`${p.r},${p.c}`);
    return cells;
}

export function addParticles(r, c, color) {
    const cx = BOARD_PADDING + c * CELL_SIZE + CELL_SIZE / 2;
    const cy = HUD_HEIGHT + BOARD_PADDING + r * CELL_SIZE + CELL_SIZE / 2;
    const particleColor = color === BLACK ? COLORS.particleBlack : COLORS.particleWhite;

    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
        const speed = 60 + Math.random() * 80;
        particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 40,
            color: particleColor,
            size: 2 + Math.random() * 3,
            progress: 0,
            duration: PARTICLE_DURATION
        });
    }
}

export function drawEffects(ctx) {
    // Draw flips
    for (const f of flips) {
        const actualProgress = Math.max(0, f.progress - f.delay / f.duration);
        if (actualProgress <= 0) continue;

        const cx = BOARD_PADDING + f.c * CELL_SIZE + CELL_SIZE / 2;
        const cy = HUD_HEIGHT + BOARD_PADDING + f.r * CELL_SIZE + CELL_SIZE / 2;

        // Scale X from 1 -> 0 -> 1, swap color at halfway
        let scaleX;
        let color;
        if (actualProgress < 0.5) {
            scaleX = 1 - actualProgress * 2;
            color = f.fromColor;
        } else {
            scaleX = (actualProgress - 0.5) * 2;
            color = f.toColor;
        }

        scaleX = Math.max(0.01, scaleX);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scaleX, 1);

        // Shadow
        ctx.beginPath();
        ctx.arc(0, 2, DISC_RADIUS + 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // Disc
        const gradient = ctx.createRadialGradient(-DISC_RADIUS * 0.3, -DISC_RADIUS * 0.3, 0, 0, 0, DISC_RADIUS);
        if (color === BLACK) {
            gradient.addColorStop(0, COLORS.blackDiscHighlight);
            gradient.addColorStop(1, COLORS.blackDisc);
        } else {
            gradient.addColorStop(0, COLORS.whiteDiscHighlight);
            gradient.addColorStop(1, COLORS.whiteDisc);
        }

        ctx.beginPath();
        ctx.arc(0, 0, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Edge highlight
        ctx.strokeStyle = color === BLACK ? 'rgba(80,80,80,0.5)' : 'rgba(200,200,200,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    // Draw placements (bounce-in effect)
    for (const p of placements) {
        const cx = BOARD_PADDING + p.c * CELL_SIZE + CELL_SIZE / 2;
        const cy = HUD_HEIGHT + BOARD_PADDING + p.r * CELL_SIZE + CELL_SIZE / 2;

        // Ease-out bounce
        let scale;
        const t = p.progress;
        if (t < 0.6) {
            scale = (t / 0.6) * 1.15;
        } else if (t < 0.8) {
            scale = 1.15 - ((t - 0.6) / 0.2) * 0.15;
        } else {
            scale = 1.0;
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const gradient = ctx.createRadialGradient(-DISC_RADIUS * 0.3, -DISC_RADIUS * 0.3, 0, 0, 0, DISC_RADIUS);
        if (p.color === BLACK) {
            gradient.addColorStop(0, COLORS.blackDiscHighlight);
            gradient.addColorStop(1, COLORS.blackDisc);
        } else {
            gradient.addColorStop(0, COLORS.whiteDiscHighlight);
            gradient.addColorStop(1, COLORS.whiteDisc);
        }

        ctx.beginPath();
        ctx.arc(0, 0, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = p.color === BLACK ? 'rgba(80,80,80,0.5)' : 'rgba(200,200,200,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    // Draw particles
    for (const p of particles) {
        const alpha = 1 - p.progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - p.progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
    }
}
