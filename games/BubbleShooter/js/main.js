// main.js - Game loop, init, events
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, BUBBLE_RADIUS,
  createGameState, getRandomBubble, GAME_OVER_Y,
} from './config.js';
import { resumeAudio, playShoot, playLevelUp, playGameOver } from './sound.js';
import {
  initGrid, shootBubble, updateFlying, updateFallingBubbles,
  drawGrid, drawShooter, drawFallingBubbles, addNewRow, checkGameOver,
} from './bubbles.js';
import { updateParticles, drawParticles, updatePopAnimations, drawPopAnimations, createGameOverParticles, createGameOverEmbers } from './effects.js';
import { drawHUD, drawBackground, drawStartOverlay, drawGameOverOverlay } from './ui.js';

let canvas, ctx;
let state;
let lastTime = 0;
let levelUpTimer = 0;
let mouseX = 0, mouseY = 0;
let startBtnRect, overBtnRect;
let newRowCooldown = 0;

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  state = createGameState();

  // Event listeners
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', onTouch, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });

  // Calculate button rects
  startBtnRect = { x: CANVAS_WIDTH / 2 - 90, y: 280, w: 180, h: 55 };
  overBtnRect = { x: CANVAS_WIDTH / 2 - 80, y: 430, w: 160, h: 50 };

  // Start game loop
  requestAnimationFrame(gameLoop);
}

function startGame() {
  state = createGameState();
  state.state = 'playing';
  state.colorCount = 4;
  initGrid(state);
  state.shooter.current = getRandomBubble(state);
  state.shooter.next = getRandomBubble(state);
  newRowCooldown = 10000; // 10 seconds before first new row
  levelUpTimer = 0;
  gameOverEmberCooldown = 0;
  resumeAudio();
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;

  if (state.state === 'playing' && !state.flying) {
    const dx = mouseX - state.shooter.x;
    const dy = mouseY - state.shooter.y;
    let angle = Math.atan2(dy, dx);
    // Clamp angle to upward
    if (angle > -0.15) angle = -0.15;
    if (angle < -Math.PI + 0.15) angle = -Math.PI + 0.15;
    state.shooter.angle = angle;
  }
}

function onClick(e) {
  resumeAudio();
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top) * scaleY;

  if (state.state === 'menu') {
    if (isInRect(cx, cy, startBtnRect)) {
      startGame();
    }
  } else if (state.state === 'gameover') {
    if (isInRect(cx, cy, overBtnRect)) {
      startGame();
    }
  } else if (state.state === 'playing') {
    if (!state.flying) {
      shootBubble(state);
      playShoot();
    }
  }
}

function onTouch(e) {
  e.preventDefault();
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
    onMouseMove(fakeEvent);
    onClick(fakeEvent);
  }
}

function onTouchMove(e) {
  e.preventDefault();
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }
}

function isInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap dt
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

let gameOverEmberCooldown = 0;

function update(dt) {
  // Always update particles (so game-over embers keep rendering)
  updateParticles(state.particles, dt);
  updatePopAnimations(state.popAnimations, dt);

  if (state.state === 'gameover') {
    state.gameOverTimer += dt;
    // Spawn ember particles periodically during game over
    gameOverEmberCooldown -= dt;
    if (gameOverEmberCooldown <= 0) {
      state.particles.push(...createGameOverEmbers(CANVAS_WIDTH, CANVAS_HEIGHT, 3));
      gameOverEmberCooldown = 0.4 + Math.random() * 0.3;
    }
    return;
  }

  if (state.state !== 'playing') return;

  // Update flying bubble
  const result = updateFlying(state);
  if (result && (result.popped > 0 || result.fallen > 0)) {
    // Check level progression
    checkLevelUp();
  }

  // Update falling bubbles
  updateFallingBubbles(state, dt);

  // New row timer
  newRowCooldown -= dt * 1000;
  if (newRowCooldown <= 0) {
    addNewRow(state);
    newRowCooldown = Math.max(4000, 10000 - state.level * 500);
    // Check if new row causes game over
    if (checkGameOver(state)) {
      gameOver();
    }
  }

  // Level up timer
  if (levelUpTimer > 0) {
    levelUpTimer -= dt * 1000;
  }

  // Check game over
  if (checkGameOver(state)) {
    gameOver();
  }

  // Shake timer
  if (state.shakeTimer > 0) {
    state.shakeTimer -= dt * 1000;
  }
}

function checkLevelUp() {
  const newLevel = Math.floor(state.score / 200) + 1;
  if (newLevel > state.level) {
    state.level = newLevel;
    state.colorCount = Math.min(6, 4 + Math.floor((state.level - 1) / 2));
    levelUpTimer = 2000;
    playLevelUp();
  }
}

function gameOver() {
  state.state = 'gameover';
  state.gameOverTimer = 0;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('bubbleShooterHighScore', String(state.score));
  }
  // Spawn dramatic burst particles at center
  state.particles.push(...createGameOverParticles(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, 60));
  playGameOver();
}

function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Apply shake
  if (state.shakeTimer > 0) {
    const intensity = state.shakeTimer / 100;
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );
  }

  drawBackground(ctx);

  if (state.state === 'playing' || state.state === 'gameover') {
    drawGrid(ctx, state);
    drawFallingBubbles(ctx, state);
    drawPopAnimations(ctx, state.popAnimations);
    drawShooter(ctx, state);
    drawParticles(ctx, state.particles);
    drawHUD(ctx, state);

    if (levelUpTimer > 0) {
      drawLevelUpNotice();
    }
  }

  if (state.shakeTimer > 0) {
    ctx.restore();
  }

  if (state.state === 'menu') {
    drawBackground(ctx);
    drawStartOverlay(ctx, state);
  }

  if (state.state === 'gameover') {
    drawGameOverOverlay(ctx, state, state.gameOverTimer);
    // Draw ember particles on top of the overlay
    drawParticles(ctx, state.particles);
  }
}

function drawLevelUpNotice() {
  const alpha = Math.min(1, levelUpTimer / 500);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px "Microsoft YaHei", Arial';
  ctx.textAlign = 'center';
  const y = CANVAS_HEIGHT / 2 - 50;
  ctx.fillText(`第 ${state.level} 关!`, CANVAS_WIDTH / 2, y);
  ctx.fillStyle = '#FFA500';
  ctx.font = '18px "Microsoft YaHei", Arial';
  ctx.fillText('难度提升!', CANVAS_WIDTH / 2, y + 35);
  ctx.globalAlpha = 1;
}

// Expose startGame for HTML onclick
window.startGame = startGame;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
