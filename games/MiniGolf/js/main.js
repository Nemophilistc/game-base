// ============================================
// Mini Golf - Main Game Loop
// ============================================

import { CANVAS_MAX_W, CANVAS_MAX_H, COURSE_W, COURSE_H, BALL_RADIUS,
         MAX_DRAG, MAX_SPEED, COURSE_NAMES, COURSES } from './config.js';
import * as Sound from './sound.js';
import { createBall, resetBall, isBallMoving, applyShot, step, simulateTrajectory } from './physics.js';
import { drawCourse, drawWalls, drawBumpers, drawWindmill, drawBall, drawAimLine } from './course.js';
import { createTrail, updateTrail, drawTrail, createParticles, updateParticles,
         drawParticles, spawnConfetti, spawnSplash, spawnDust, spawnSparks,
         createCelebration, startCelebration, updateCelebration, drawCelebration } from './effects.js';
import { createStartOverlay, showHoleTransition, showGameComplete } from './ui.js';

// Game state
let canvas, ctx;
let scale = 1, canvasOffX = 0, canvasOffY = 0;
let ball, course, currentHole, startHole, endHole;
let strokes, totalStrokes, holeScores, holePar;
let aiming, aimDragX, aimDragY, aimPower;
let trajectoryPoints;
let trail, particles, celebration;
let frameCount, lastTime;
let gameStarted, transitioning;
let lastBallPos; // for water reset

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    // Input events
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    trail = createTrail();
    particles = createParticles();
    celebration = createCelebration();
    frameCount = 0;
    lastTime = performance.now();
    gameStarted = false;
    transitioning = false;

    createStartOverlay((s, e) => {
        startHole = s;
        endHole = e;
        startGame();
    });

    requestAnimationFrame(gameLoop);
}

function resize() {
    const maxW = Math.min(CANVAS_MAX_W, window.innerWidth - 20);
    const maxH = Math.min(CANVAS_MAX_H, window.innerHeight - 20);
    const aspect = COURSE_W / COURSE_H;
    let cw, ch;
    if (maxW / maxH > aspect) {
        ch = maxH;
        cw = ch * aspect;
    } else {
        cw = maxW;
        ch = cw / aspect;
    }
    canvas.width = cw;
    canvas.height = ch;
    scale = cw / COURSE_W;
    canvasOffX = 0;
    canvasOffY = 0;
}

function toCanvasX(x) { return canvasOffX + x * scale; }
function toCanvasY(y) { return canvasOffY + y * scale; }
function toCourseX(cx) { return (cx - canvasOffX) / scale; }
function toCourseY(cy) { return (cy - canvasOffY) / scale; }

function startGame() {
    Sound.resumeAudio();
    totalStrokes = 0;
    holeScores = [];
    currentHole = startHole;
    gameStarted = true;
    loadHole(currentHole);
}

function loadHole(idx) {
    course = JSON.parse(JSON.stringify(COURSES[idx]));
    course.theme = getThemeForHole(idx);
    course.windmill = course.windmill ? { ...course.windmill, angle: 0 } : null;

    ball = createBall(course.start.x, course.start.y);
    lastBallPos = { x: course.start.x, y: course.start.y };
    strokes = 0;
    holePar = course.par;
    aiming = false;
    aimDragX = 0;
    aimDragY = 0;
    aimPower = 0;
    trajectoryPoints = [];
    trail.points = [];
    particles.list = [];
    transitioning = false;

    showHoleTransition(idx, course.par, COURSE_NAMES[idx], () => {});
}

function getThemeForHole(idx) {
    if (idx === 15) return 'ice';
    if (idx === 13 || idx === 14) return 'desert';
    return 'grass';
}

// Input handlers
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function onPointerDown(e) {
    if (!gameStarted || transitioning) return;
    if (isBallMoving(ball) || ball.inHole) return;
    const pos = getPointerPos(e);
    startAim(pos.x, pos.y);
}

function onPointerMove(e) {
    if (!aiming) return;
    const pos = getPointerPos(e);
    updateAim(pos.x, pos.y);
}

function onPointerUp(e) {
    if (!aiming) return;
    releaseAim();
}

function onTouchStart(e) {
    e.preventDefault();
    if (!gameStarted || transitioning) return;
    if (isBallMoving(ball) || ball.inHole) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startAim(touch.clientX - rect.left, touch.clientY - rect.top);
}

function onTouchMove(e) {
    e.preventDefault();
    if (!aiming) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    updateAim(touch.clientX - rect.left, touch.clientY - rect.top);
}

function onTouchEnd(e) {
    e.preventDefault();
    if (!aiming) return;
    releaseAim();
}

function startAim(cx, cy) {
    const bx = toCanvasX(ball.x), by = toCanvasY(ball.y);
    const dx = cx - bx, dy = cy - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 80) return; // Must click near ball
    aiming = true;
    Sound.resumeAudio();
}

function updateAim(cx, cy) {
    const bx = toCanvasX(ball.x), by = toCanvasY(ball.y);
    aimDragX = cx - bx;
    aimDragY = cy - by;
    const dist = Math.sqrt(aimDragX * aimDragX + aimDragY * aimDragY);
    aimPower = Math.min(1, dist / MAX_DRAG);

    // Calculate trajectory preview
    const power = aimPower * MAX_SPEED;
    const dirX = -aimDragX / (dist || 1);
    const dirY = -aimDragY / (dist || 1);
    trajectoryPoints = simulateTrajectory(
        ball.x, ball.y, dirX * power, dirY * power, course
    );
}

function releaseAim() {
    if (aimPower > 0.05) {
        const dist = Math.sqrt(aimDragX * aimDragX + aimDragY * aimDragY);
        if (dist > 5) {
            const power = aimPower * MAX_SPEED;
            const dirX = -aimDragX / dist;
            const dirY = -aimDragY / dist;
            applyShot(ball, dirX * power, dirY * power);
            lastBallPos = { x: ball.x, y: ball.y };
            strokes++;
            totalStrokes++;
            Sound.playHit();
        }
    }
    aiming = false;
    aimDragX = 0;
    aimDragY = 0;
    aimPower = 0;
    trajectoryPoints = [];
}

function nextHole() {
    holeScores.push(strokes);
    currentHole++;
    if (currentHole >= endHole) {
        const totalPar = holeScores.reduce((sum, _, i) => sum + COURSES[startHole + i].par, 0);
        showGameComplete(totalStrokes, totalPar, holeScores, startHole);
        gameStarted = false;
    } else {
        transitioning = true;
        setTimeout(() => loadHole(currentHole), 800);
    }
}

// HUD
function drawHUD() {
    const pad = 12;
    const fontSize = Math.max(12, Math.min(16, canvas.width * 0.03));

    ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;

    // Top left - Hole info
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(pad - 4, pad - 4, 130, 52);
    ctx.fillStyle = '#4ADE80';
    ctx.fillText(`第 ${currentHole + 1} 洞 / ${endHole}`, pad + 4, pad + fontSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`杆数: ${strokes}`, pad + 4, pad + fontSize * 2 + 4);

    // Top right - Par & Total
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(canvas.width - 130 - pad, pad - 4, 130, 52);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`标准杆: ${holePar}`, canvas.width - pad - 4, pad + fontSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`总杆: ${totalStrokes}`, canvas.width - pad - 4, pad + fontSize * 2 + 4);

    // Power meter
    if (aiming && aimPower > 0) {
        const meterW = 16, meterH = 120;
        const mx = pad + 4, my = canvas.height - meterH - pad - 30;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(mx - 2, my - 2, meterW + 4, meterH + 4);

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(mx, my, meterW, meterH);

        // Fill
        const fillH = meterH * aimPower;
        const gradient = ctx.createLinearGradient(mx, my + meterH, mx, my);
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(0.5, '#eab308');
        gradient.addColorStop(1, '#ef4444');
        ctx.fillStyle = gradient;
        ctx.fillRect(mx, my + meterH - fillH, meterW, fillH);

        // Border
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, meterW, meterH);

        // Label
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${fontSize - 2}px 'Segoe UI', sans-serif`;
        ctx.fillText(`力度 ${Math.round(aimPower * 100)}%`, mx + meterW / 2, my + meterH + 18);
    }

    ctx.textAlign = 'left';
    ctx.lineWidth = 1;
}

// Main game loop
function gameLoop(timestamp) {
    const dt = Math.min(50, timestamp - lastTime);
    lastTime = timestamp;
    frameCount++;

    // Physics
    if (gameStarted && ball && !transitioning) {
        const events = step(ball, course, 1);

        // Handle events
        if (events.wallHit) {
            Sound.playWallBounce();
            spawnSparks(particles, ball.x, ball.y);
        }
        if (events.bumperHit) {
            Sound.playBumper();
            spawnSparks(particles, ball.x, ball.y);
        }
        if (events.windmillHit) {
            Sound.playWindmillHit();
            spawnSparks(particles, ball.x, ball.y);
        }
        if (events.sandHit && isBallMoving(ball)) {
            spawnDust(particles, ball.x, ball.y);
        }
        if (events.waterHit) {
            Sound.playWaterSplash();
            spawnSplash(particles, ball.x, ball.y);
            // Reset to last position after a delay
            setTimeout(() => {
                if (ball.inWater) {
                    resetBall(ball, lastBallPos.x, lastBallPos.y);
                    ball.inWater = false;
                }
            }, 600);
        }
        if (events.holeIn) {
            Sound.playHoleIn();
            spawnConfetti(particles, course.hole.x, course.hole.y);
            startCelebration(celebration);
            setTimeout(() => nextHole(), 2000);
        }

        // Save position when ball stops (for water reset)
        if (!isBallMoving(ball) && !ball.inHole && !ball.inWater) {
            lastBallPos = { x: ball.x, y: ball.y };
        }

        updateTrail(trail, ball.x, ball.y, isBallMoving(ball));
    }

    updateParticles(particles);
    updateCelebration(celebration, dt);

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameStarted && course) {
        drawCourse(ctx, course, toCanvasX, toCanvasY, scale, frameCount);
        drawWalls(ctx, course, toCanvasX, toCanvasY, scale);
        drawBumpers(ctx, course, toCanvasX, toCanvasY, scale);
        drawWindmill(ctx, course.windmill, toCanvasX, toCanvasY, scale);
        drawTrail(ctx, trail, toCanvasX, toCanvasY, scale);

        if (aiming && aimPower > 0) {
            drawAimLine(ctx, ball.x, ball.y, aimDragX, aimDragY,
                       aimPower, trajectoryPoints, toCanvasX, toCanvasY, scale);
        }

        if (!ball.inHole) {
            drawBall(ctx, ball, toCanvasX, toCanvasY, scale);
        }

        drawParticles(ctx, particles, toCanvasX, toCanvasY, scale);
        drawCelebration(ctx, celebration, toCanvasX, toCanvasY, course.hole.x, course.hole.y);
        drawHUD();
    } else if (!gameStarted) {
        // Idle background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(gameLoop);
}

// Expose for HTML
window.startGame = init;
