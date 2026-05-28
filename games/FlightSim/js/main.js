// ============================================================
// main.js - Game loop, event listeners, camera system
// ============================================================

import { WORLD, SCORING, PHYSICS, PLANE, COLLECTIBLES, OBSTACLES } from './config.js';
import { SoundManager } from './sound.js';
import { Plane } from './plane.js';
import { Terrain } from './terrain.js';
import { ObstacleManager } from './obstacles.js';
import { CollectibleManager } from './collectibles.js';
import { EffectsManager } from './effects.js';
import { UIOverlay } from './ui.js';

// === Game State ===
const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3 };

let canvas, ctx;
let gameState = STATE.MENU;
let plane, terrain, obstacles, collectibles, effects, ui, sound;
let cameraX = 0;
let score = 0;
let distanceTraveled = 0;
let frame = 0;
let keys = {};
let shakeOffset = { x: 0, y: 0 };

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resize();

    sound = new SoundManager();
    plane = new Plane();
    terrain = new Terrain(canvas.width, canvas.height);
    obstacles = new ObstacleManager(canvas.width, canvas.height, terrain.getGroundY());
    collectibles = new CollectibleManager(canvas.width, canvas.height, terrain.getGroundY());
    effects = new EffectsManager();
    ui = new UIOverlay(canvas.width, canvas.height);

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Touch controls for mobile
    setupTouchControls();

    requestAnimationFrame(gameLoop);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (terrain) {
        terrain.canvasWidth = canvas.width;
        terrain.canvasHeight = canvas.height;
        terrain.groundY = canvas.height * 0.75;
    }
    if (ui) {
        ui.canvasWidth = canvas.width;
        ui.canvasHeight = canvas.height;
    }
}

function onKeyDown(e) {
    keys[e.code] = true;

    if (gameState === STATE.MENU) {
        sound.init();
        sound.resume();
        startGame();
        return;
    }

    if (e.code === 'KeyP') {
        if (gameState === STATE.PLAYING) {
            gameState = STATE.PAUSED;
        } else if (gameState === STATE.PAUSED) {
            gameState = STATE.PLAYING;
        }
    }

    if (e.code === 'KeyM') {
        const muted = sound.toggleMute();
        ui.showMessage(muted ? '已静音' : '已取消静音', 60);
    }

    if (e.code === 'KeyR' && gameState === STATE.GAMEOVER) {
        startGame();
    }

    if (e.code === 'Space' && gameState === STATE.PLAYING) {
        plane.shoot();
        sound.playShoot();
    }
}

function onKeyUp(e) {
    keys[e.code] = false;
}

function setupTouchControls() {
    let touchStartY = 0;
    let touchStartX = 0;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState === STATE.MENU) {
            sound.init();
            sound.resume();
            startGame();
            return;
        }
        if (gameState === STATE.GAMEOVER) {
            startGame();
            return;
        }
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;

        // Right side tap = shoot
        if (touch.clientX > canvas.width * 0.7) {
            keys['Space'] = true;
            setTimeout(() => keys['Space'] = false, 100);
        }
        // Left side tap = boost
        if (touch.clientX < canvas.width * 0.3) {
            keys['ShiftLeft'] = true;
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (gameState !== STATE.PLAYING) return;
        const touch = e.touches[0];
        const dy = touch.clientY - touchStartY;
        const dx = touch.clientX - touchStartX;

        keys['ArrowUp'] = dy < -20;
        keys['ArrowDown'] = dy > 20;
        keys['ArrowLeft'] = dx < -20;
        keys['ArrowRight'] = dx > 20;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = false;
        keys['ArrowDown'] = false;
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
        keys['ShiftLeft'] = false;
        keys['Space'] = false;
    }, { passive: false });
}

function startGame() {
    // Resume AudioContext before any sound calls (browser may have suspended it)
    sound.init();
    sound.resume();

    // Clear stale input state from previous game
    keys = {};

    plane.reset();
    effects.reset();
    score = 0;
    distanceTraveled = 0;
    cameraX = 0;
    frame = 0;
    terrain = new Terrain(canvas.width, canvas.height);
    obstacles = new ObstacleManager(canvas.width, canvas.height, terrain.getGroundY());
    collectibles = new CollectibleManager(canvas.width, canvas.height, terrain.getGroundY());

    // Clear UI state from previous game
    ui.screenShake = 0;
    ui.messages = [];

    gameState = STATE.PLAYING;
    ui.showMessage('起飞!', 90, '#44ff44');
}

function updateCamera() {
    const targetX = plane.x - canvas.width * 0.3;
    cameraX += (targetX - cameraX) * 0.08;
    cameraX = Math.max(0, Math.min(WORLD.WIDTH - canvas.width, cameraX));
}

function gameLoop(timestamp) {
    frame++;

    if (gameState === STATE.PLAYING) {
        update();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    const groundY = terrain.getGroundY();

    // Update plane
    plane.update(keys, groundY, 1);

    // Sound
    sound.updateEngine(plane.thrust, plane.speed);
    sound.updateWind(plane.speed);

    // Trail particles
    if (frame % 2 === 0 && plane.alive) {
        effects.addTrail(
            plane.x - Math.cos(plane.angle) * PLANE.WIDTH * 0.4,
            plane.y - Math.sin(plane.angle) * PLANE.WIDTH * 0.4,
            plane.vx, plane.vy, plane.boosted
        );
    }

    // Camera
    updateCamera();

    // Terrain
    terrain.update(cameraX);

    // Obstacles
    obstacles.update(plane.x, plane.y);

    // Collectibles
    collectibles.update(plane.x);

    // Effects
    effects.update();
    ui.update();

    // Score from distance
    distanceTraveled += Math.abs(plane.vx) * 0.1;
    score += Math.abs(plane.vx) * SCORING.DISTANCE_RATE;

    // === Collisions ===
    if (plane.alive && !plane.invincible) {
        // Balloon collision
        const balloon = obstacles.checkBalloonCollision(plane.x, plane.y, PLANE.WIDTH, PLANE.HEIGHT);
        if (balloon) {
            score += OBSTACLES.BALLOON_PENALTY;
            effects.addSparks(plane.x, plane.y, 10);
            sound.playCollision();
            ui.showMessage(`气球! ${OBSTACLES.BALLOON_PENALTY}`, 60, '#ff4444');
            ui.triggerShake(6);
            plane.hitFlash = 15;
        }

        // Bird collision
        const bird = obstacles.checkBirdCollision(plane.x, plane.y, PLANE.WIDTH, PLANE.HEIGHT);
        if (bird) {
            const dead = plane.hit(1);
            effects.addSparks(plane.x, plane.y, 15);
            sound.playCollision();
            ui.triggerShake(10);
            if (dead) {
                effects.addExplosion(plane.x, plane.y);
                sound.playExplosion();
                gameState = STATE.GAMEOVER;
            }
            plane.hitFlash = 20;
        }

        // Storm
        const storm = obstacles.isInStorm(plane.x, plane.y);
        if (storm) {
            plane.vx += (Math.random() - 0.5) * OBSTACLES.STORM_TURBULENCE;
            plane.vy += (Math.random() - 0.5) * OBSTACLES.STORM_TURBULENCE;
            if (frame % 5 === 0) {
                effects.addStormEffect(plane.x, plane.y);
            }
            if (frame % 30 === 0) {
                ui.triggerShake(4);
            }
        }

        // Mountain collision
        const mountainHitboxes = terrain.getMountainHitboxes();
        for (const m of mountainHitboxes) {
            const shrink = OBSTACLES.MOUNTAIN_HITBOX_SHRINK;
            if (plane.x > m.x + shrink && plane.x < m.x + m.width - shrink &&
                plane.y > m.y + shrink && plane.y < m.y + m.height) {
                const dead = plane.hit(1);
                effects.addExplosion(plane.x, plane.y);
                sound.playExplosion();
                ui.triggerShake(15);
                if (dead) {
                    gameState = STATE.GAMEOVER;
                }
                break;
            }
        }
    }

    // Projectile vs obstacles
    plane.projectiles.forEach(p => {
        // Check birds
        for (const bird of obstacles.birds) {
            const dx = p.x - bird.x;
            const dy = p.y - bird.y;
            if (Math.sqrt(dx * dx + dy * dy) < bird.size + 5) {
                effects.addSparks(bird.x, bird.y, 8);
                sound.playCollect();
                score += 50;
                ui.showMessage('+50 击中!', 60, '#ffdd00');
                bird.centerX = plane.x + (Math.random() > 0.5 ? 1 : -1) * 500;
                bird.centerY = canvas.height * 0.1 + Math.random() * canvas.height * 0.5;
                p.life = 0;
                break;
            }
        }
    });

    // Collectible collision
    const collected = collectibles.checkCollision(plane.x, plane.y, PLANE.WIDTH, PLANE.HEIGHT);
    collected.forEach(type => {
        switch (type) {
            case 'star':
                score += COLLECTIBLES.STAR_SCORE;
                sound.playCollect();
                ui.showMessage(`+${COLLECTIBLES.STAR_SCORE} 星星!`, 60, '#ffdd00');
                break;
            case 'fuel':
                plane.addFuel(COLLECTIBLES.FUEL_AMOUNT);
                sound.playCollectFuel();
                ui.showMessage(`+${COLLECTIBLES.FUEL_AMOUNT} 燃料!`, 60, '#44ff44');
                break;
            case 'boost':
                plane.addBoost();
                sound.playBoost();
                ui.showMessage('加速!', 90, '#4488ff');
                break;
            case 'shield':
                plane.addShield();
                sound.playShield();
                ui.showMessage('护盾激活!', 90, '#44ffff');
                break;
        }
        effects.addCollectEffect(plane.x, plane.y, type);
    });

    // Stall warning
    if (plane.stalling && frame % 60 === 0) {
        sound.playStall();
        ui.showMessage('失速!', 40, '#ff4444');
    }

    // Ground death
    if (!plane.alive && gameState === STATE.PLAYING) {
        effects.addExplosion(plane.x, plane.y);
        sound.playExplosion();
        gameState = STATE.GAMEOVER;
    }

    // Shake
    shakeOffset = ui.getShakeOffset();
}

function draw() {
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    // Clear
    ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);

    // Terrain background
    terrain.draw(ctx, cameraX, frame);

    // Obstacles
    obstacles.draw(ctx, cameraX);

    // Collectibles
    collectibles.draw(ctx, cameraX);

    // Effects
    effects.draw(ctx, cameraX);

    // Plane
    if (plane.alive || gameState === STATE.GAMEOVER) {
        plane.draw(ctx, cameraX);
    }

    ctx.restore();

    // UI (not affected by camera shake)
    if (gameState === STATE.PLAYING || gameState === STATE.PAUSED) {
        ui.drawHUD(ctx, plane, score, distanceTraveled);
        ui.drawMinimap(ctx, plane, terrain.mountains, obstacles, collectibles, cameraX);
        ui.drawMessages(ctx);
    }

    if (gameState === STATE.MENU) {
        ui.drawStartScreen(ctx);
    } else if (gameState === STATE.PAUSED) {
        ui.drawPauseScreen(ctx);
    } else if (gameState === STATE.GAMEOVER) {
        ui.drawGameOver(ctx, score, distanceTraveled);
    }
}

// Start
window.addEventListener('DOMContentLoaded', init);
