// ============================================================
// main.js - Game loop, initialization, input handling
// ============================================================

import {
    CANVAS_W, CANVAS_H, TILE_SIZE, TILE_COLORS,
    GATHER_RANGE, RESOURCE_NAMES, STRUCTURE_NAMES, RECIPES,
} from './config.js';
import { Sound } from './sound.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createCraftingMenu } from './crafting.js';
import { drawResources, drawStructures, drawAnimals } from './resources.js';
import { updateStructures, updateAnimals, drawCampfireLight } from './structures.js';
import {
    updateEffects, drawEffects, drawWeatherOverlay, drawDayNightOverlay,
    spawnRainDrop, spawnFireParticle, spawnSmokeParticle,
    spawnHitEffect, spawnGatherEffect, spawnCraftEffect, clearEffects,
} from './effects.js';
import {
    drawHUD, drawStartOverlay, drawGameOverOverlay, drawWinOverlay,
    drawMinimap, addNotification, updateNotifications, drawNotifications,
} from './ui.js';

let canvas, ctx;
let gameState = 'start'; // start, playing, gameover, win
let player, world, craftingMenu;
let lastTime = 0;
let deathReason = '';
let camX = 0, camY = 0; // current camera position

// Input state
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // Input handlers
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    // Prevent context menu
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Start loop
    requestAnimationFrame(gameLoop);
    render();
}

function startGame() {
    Sound.resume();
    world = createWorld();
    const spawn = world.findSpawnPoint();
    player = createPlayer(spawn.x, spawn.y);
    craftingMenu = createCraftingMenu();
    clearEffects();
    gameState = 'playing';
    deathReason = '';
    addNotification('欢迎来到荒岛！活下去！', '#4caf50');
}

function onKeyDown(e) {
    keys[e.code] = true;

    if (gameState === 'start') {
        if (e.code === 'Enter' || e.code === 'Space') {
            startGame();
        }
        return;
    }

    if (gameState === 'gameover' || gameState === 'win') {
        if (e.code === 'Enter' || e.code === 'Space') {
            startGame();
        }
        return;
    }

    // Playing state
    if (e.code === 'KeyC') {
        craftingMenu.toggle();
    }

    if (craftingMenu && craftingMenu.isVisible()) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            craftingMenu.selectPrev();
            e.preventDefault();
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            craftingMenu.selectNext();
            e.preventDefault();
        }
        if (e.code === 'Enter') {
            const recipe = craftingMenu.craftSelected(player);
            if (recipe) {
                spawnCraftEffect(player.x, player.y);
                const crafted = RECIPES[craftingMenu.getSelectedIndex()];
                addNotification(`制作了 ${crafted.name}！`, '#6abf4b');
            }
        }
        return; // Don't process movement while crafting menu is open
    }

    // Gather / Interact
    if (e.code === 'KeyE') {
        handleGather();
    }

    // Eat / Cook
    if (e.code === 'KeyF') {
        handleEatOrCook();
    }

    // Place structure
    if (e.code === 'KeyR') {
        handlePlaceStructure();
    }

    // Attack
    if (e.code === 'Space') {
        handleAttack();
        e.preventDefault();
    }

    // Fish
    if (e.code === 'KeyQ') {
        handleFish();
    }
}

function onKeyUp(e) {
    keys[e.code] = false;
}

function onMouseDown(e) {
    mouseDown = true;
    if (gameState === 'start') {
        // Check start button click
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const y = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        if (x > CANVAS_W / 2 - 100 && x < CANVAS_W / 2 + 100 && y > 490 && y < 538) {
            startGame();
        }
        return;
    }
    if (gameState === 'gameover' || gameState === 'win') {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const y = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        if (x > CANVAS_W / 2 - 100 && x < CANVAS_W / 2 + 100 && y > 390 && y < 460) {
            startGame();
        }
    }
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    mouseY = (e.clientY - rect.top) * (CANVAS_H / rect.height);
}

function onMouseUp(e) {
    mouseDown = false;
}

function handleGather() {
    if (player.gathering) return;
    const res = world.getResourceAt(player.x, player.y, GATHER_RANGE);
    if (res) {
        player.startGather(res);
        spawnGatherEffect(
            res.x * TILE_SIZE + TILE_SIZE / 2,
            res.y * TILE_SIZE + TILE_SIZE / 2,
            res.type
        );
    }
}

function handleEatOrCook() {
    // Try cooking first
    if (player.tryCook(world)) {
        addNotification('烹饪成功！', '#e67e22');
        return;
    }
    // Try eating
    const foods = ['cookedMeat', 'cookedFish', 'berry', 'rawMeat', 'fish'];
    for (const f of foods) {
        if (player.getItemCount(f) > 0) {
            if (player.eat(f)) {
                addNotification(`吃了 ${RESOURCE_NAMES[f]}`, '#8d6e63');
                return;
            }
        }
    }
}

function handlePlaceStructure() {
    const placeable = ['campfire', 'shelter', 'farm', 'storage', 'boat'];
    for (const p of placeable) {
        if (player.getItemCount(p) > 0) {
            if (player.tryPlaceStructure(p, world)) {
                addNotification(`放置了 ${STRUCTURE_NAMES[p]}`, '#795548');
                if (p === 'boat') {
                    gameState = 'win';
                    Sound.win();
                }
                return;
            }
        }
    }
}

function handleAttack() {
    const killed = player.attack(world.animals);
    if (killed) {
        spawnHitEffect(killed.x, killed.y);
        const idx = world.animals.indexOf(killed);
        if (idx >= 0) world.animals.splice(idx, 1);
        addNotification('击杀！获得食物', '#e74c3c');
    }
}

function handleFish() {
    const fishBefore = player.getItemCount('fish');
    if (player.tryFish(world)) {
        const fishAfter = player.getItemCount('fish');
        if (fishAfter > fishBefore) {
            addNotification('钓到了一条鱼！', '#2196f3');
        } else {
            addNotification('什么都没钓到...', '#888');
        }
    }
}

// ============ Game Loop ============

function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    if (gameState === 'playing') {
        update(dt);
    }

    render();
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Player movement
    let mx = 0, my = 0;
    if (keys['KeyW'] || keys['ArrowUp']) my = -1;
    if (keys['KeyS'] || keys['ArrowDown']) my = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) mx = 1;

    if (!craftingMenu.isVisible()) {
        const len = Math.sqrt(mx * mx + my * my);
        if (len > 0) {
            player.vx = (mx / len) * player.speed;
            player.vy = (my / len) * player.speed;
            if (mx > 0) player.facing = 'right';
            else if (mx < 0) player.facing = 'left';
            else if (my > 0) player.facing = 'down';
            else player.facing = 'up';
        } else {
            player.vx = 0;
            player.vy = 0;
        }
    } else {
        player.vx = 0;
        player.vy = 0;
    }

    // Update systems
    player.update(dt, world);
    world.update(dt);
    updateStructures(world, dt);
    updateAnimals(world, player, dt);
    updateEffects(dt, CANVAS_W, CANVAS_H);
    updateNotifications(dt);

    // Weather effects
    if (world.weather === 'rain') {
        if (Math.random() < 0.3) spawnRainDrop(camX, camY, CANVAS_W);
        if (Math.random() < 0.01) Sound.rain();
    }
    if (world.weather === 'storm') {
        for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.5) spawnRainDrop(camX, camY, CANVAS_W);
        }
    }

    // Campfire effects
    for (const s of world.structures) {
        if (s.type === 'campfire') {
            if (Math.random() < 0.15) {
                spawnFireParticle(
                    s.x * TILE_SIZE + TILE_SIZE / 2,
                    s.y * TILE_SIZE + TILE_SIZE / 2
                );
            }
            if (Math.random() < 0.05) {
                spawnSmokeParticle(
                    s.x * TILE_SIZE + TILE_SIZE / 2,
                    s.y * TILE_SIZE + TILE_SIZE / 2 - 5
                );
            }
            // Fire sound
            if (world.isNight() && Math.random() < 0.02) {
                Sound.fire();
            }
        }
    }

    // Wolf howl at night
    if (world.isNight() && world.animals.some(a => a.type === 'wolf') && Math.random() < 0.002) {
        Sound.wolfHowl();
    }

    // Check death
    if (!player.alive) {
        if (player.health <= 0 && player.hunger <= 0) {
            deathReason = '你饿死在了荒岛上...';
        } else if (player.health <= 0 && player.thirst <= 0) {
            deathReason = '你渴死在了荒岛上...';
        } else if (player.health <= 0) {
            deathReason = '你在荒岛上倒下了...';
        }
        gameState = 'gameover';
        Sound.gameOver();
    }

    // Check win
    if (player.win) {
        gameState = 'win';
    }
}

function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (gameState === 'start') {
        drawStartOverlay(ctx, CANVAS_W, CANVAS_H);
        return;
    }

    if (!world || !player) return;

    // Camera
    const rawCamX = player.x - CANVAS_W / 2;
    const rawCamY = player.y - CANVAS_H / 2;
    const maxCamX = 40 * TILE_SIZE - CANVAS_W;
    const maxCamY = 40 * TILE_SIZE - CANVAS_H;
    camX = Math.max(0, Math.min(maxCamX, rawCamX));
    camY = Math.max(0, Math.min(maxCamY, rawCamY));
    const cx = camX, cy = camY;

    ctx.save();

    // Draw world tiles
    const startCol = Math.max(0, Math.floor(cx / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(cy / TILE_SIZE));
    const endCol = Math.min(39, Math.ceil((cx + CANVAS_W) / TILE_SIZE));
    const endRow = Math.min(39, Math.ceil((cy + CANVAS_H) / TILE_SIZE));

    for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
            const tile = world.tiles[y][x];
            const sx = x * TILE_SIZE - cx;
            const sy = y * TILE_SIZE - cy;
            ctx.fillStyle = TILE_COLORS[tile] || '#000';
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw resources (screen space)
    drawResources(ctx, world, cx, cy, CANVAS_W, CANVAS_H);

    // Draw structures (screen space)
    drawStructures(ctx, world, cx, cy, CANVAS_W, CANVAS_H);

    // Draw animals (screen space)
    drawAnimals(ctx, world, cx, cy, CANVAS_W, CANVAS_H);

    // Draw player (screen space)
    drawPlayer(ctx, player, cx, cy);

    // Draw gathering progress (screen space)
    if (player.gathering) {
        const g = player.gathering;
        const rx = g.resource.x * TILE_SIZE + TILE_SIZE / 2 - cx;
        const ry = g.resource.y * TILE_SIZE - 8 - cy;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(rx - 16, ry, 32, 5);
        ctx.fillStyle = '#6abf4b';
        ctx.fillRect(rx - 16, ry, 32 * (g.progress / g.total), 5);
    }

    // Draw particles (screen space)
    drawEffects(ctx, world, cx, cy, CANVAS_W, CANVAS_H);

    // Draw campfire light (screen space)
    drawCampfireLight(ctx, world, cx, cy, CANVAS_W, CANVAS_H);

    ctx.restore();

    // Screen-space effects
    drawWeatherOverlay(ctx, world, CANVAS_W, CANVAS_H);
    drawDayNightOverlay(ctx, world, CANVAS_W, CANVAS_H);

    // HUD
    drawHUD(ctx, player, world, CANVAS_W, CANVAS_H, craftingMenu);
    drawMinimap(ctx, world, player, CANVAS_W, CANVAS_H);
    drawNotifications(ctx, CANVAS_W);

    // Overlays
    if (gameState === 'gameover') {
        drawGameOverOverlay(ctx, player, world, CANVAS_W, CANVAS_H, deathReason);
    }
    if (gameState === 'win') {
        drawWinOverlay(ctx, player, world, CANVAS_W, CANVAS_H);
    }
}

function drawPlayer(ctx, player, camX, camY) {
    ctx.save();
    const x = player.x - camX, y = player.y - camY;
    const size = player.size;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + size / 2, size / 2, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#4a8c5c';
    ctx.beginPath();
    ctx.ellipse(x, y, size / 2, size / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shirt/vest
    ctx.fillStyle = '#5d7a4a';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, size / 2 - 2, size / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#e8c39e';
    ctx.beginPath();
    ctx.arc(x, y - size / 2 + 2, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#5d3a1a';
    ctx.beginPath();
    ctx.arc(x, y - size / 2 - 1, size / 3, -Math.PI, 0);
    ctx.fill();

    // Eyes (based on facing)
    ctx.fillStyle = '#222';
    let ex1, ey1, ex2, ey2;
    const eo = 3;
    if (player.facing === 'left') {
        ex1 = x - eo - 1; ey1 = y - size / 2 + 2;
        ex2 = x - eo + 3; ey2 = ey1;
    } else if (player.facing === 'right') {
        ex1 = x + eo - 2; ey1 = y - size / 2 + 2;
        ex2 = x + eo + 2; ey2 = ey1;
    } else if (player.facing === 'up') {
        // Don't show eyes when facing up
        ex1 = ex2 = -100; ey1 = ey2 = -100;
    } else {
        ex1 = x - eo; ey1 = y - size / 2 + 2;
        ex2 = x + eo; ey2 = ey1;
    }
    ctx.beginPath();
    ctx.arc(ex1, ey1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex2, ey2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Arms (if gathering, show animation)
    ctx.strokeStyle = '#e8c39e';
    ctx.lineWidth = 3;
    if (player.gathering) {
        const t = player.gathering.progress * 8;
        const armAngle = Math.sin(t) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - size / 2, y);
        ctx.lineTo(x - size / 2 - 8, y + Math.sin(t) * 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size / 2 + 8, y + Math.sin(t + Math.PI) * 6);
        ctx.stroke();
    }

    // Health flash when damaged
    if (player.health < 30) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + Math.sin(Date.now() / 200) * 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// Boot
window.startGame = function () {
    if (gameState !== 'playing') {
        startGame();
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
