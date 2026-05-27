// Main game loop
import { CONFIG } from './config.js';
import { Sound } from './sound.js';
import { Player } from './player.js';
import { PlatformManager, PLATFORM_TYPE } from './platforms.js';
import { EnemyManager } from './enemies.js';
import { EffectsManager, Particle } from './effects.js';
import { UI } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

const ui = new UI(canvas);
const platformMgr = new PlatformManager();
const enemyMgr = new EnemyManager();
const effects = new EffectsManager();

let player = null;
let cameraY = 0;
let maxHeight = 0;
let coins = 0;
let highScore = parseInt(localStorage.getItem('doodlejump_high') || '0');
let gameState = 'menu'; // menu | playing | gameover
let lastTime = 0;
let bgOffset = 0;

// Input state
const keys = { left: false, right: false };
let shootTarget = null;

// Background grid lines (notebook paper effect)
const bgLines = [];
for (let i = 0; i < 30; i++) {
  bgLines.push({
    y: i * 50,
    width: 1 + Math.random() * 0.5
  });
}

function drawBackground() {
  // Paper background
  ctx.fillStyle = CONFIG.COLORS.BG;
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

  // Horizontal grid lines (notebook style)
  ctx.strokeStyle = CONFIG.COLORS.BG_LINES;
  ctx.lineWidth = 0.8;
  const lineSpacing = 50;
  const startY = (cameraY % lineSpacing);
  for (let y = -startY; y < CONFIG.HEIGHT + lineSpacing; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.WIDTH, y);
    ctx.stroke();
  }

  // Left margin line (red)
  ctx.strokeStyle = 'rgba(220,80,80,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(50, CONFIG.HEIGHT);
  ctx.stroke();

  // Subtle doodles in background (very faint)
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  const doodleY = (-cameraY * 0.3) % 800;
  for (let i = 0; i < 5; i++) {
    const dx = 60 + i * 70;
    const dy = doodleY + i * 180;
    if (dy > -50 && dy < CONFIG.HEIGHT + 50) {
      // Small star doodle
      drawStarDoodle(ctx, dx, dy, 8 + i * 2);
    }
  }
  ctx.globalAlpha = 1;
}

function drawStarDoodle(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function initGame() {
  player = new Player(CONFIG.WIDTH / 2 - CONFIG.PLAYER_WIDTH / 2, CONFIG.HEIGHT - 100);
  cameraY = 0;
  maxHeight = 0;
  coins = 0;
  platformMgr.init();
  enemyMgr.init();
  effects.init();
  player.jump(CONFIG.JUMP_VELOCITY);
}

function startGame() {
  Sound.resume();
  initGame();
  gameState = 'playing';
  ui.hideStart();
  ui.hideGameOver();
  document.getElementById('hud').style.display = 'flex';
  lastTime = performance.now();
}

function gameOver() {
  gameState = 'gameover';
  Sound.gameOver();
  gameOverDelay = 800; // 800ms delay before showing game over screen
  const totalScore = maxHeight + coins * 10;
  const isNewHigh = totalScore > highScore;
  if (isNewHigh) {
    highScore = totalScore;
    localStorage.setItem('doodlejump_high', String(Math.floor(highScore)));
  }

  // Death particle effect
  if (player) {
    for (let i = 0; i < 15; i++) {
      effects.particles.push(new Particle(
        player.x + player.w / 2 + (Math.random() - 0.5) * 20,
        player.y + player.h / 2,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        Math.random() < 0.5 ? '#4a90d9' : '#e74c3c',
        30 + Math.random() * 20,
        3 + Math.random() * 3
      ));
    }
    player.vy = -8; // bounce up briefly before falling
  }

  // Show game over screen after delay
  setTimeout(() => {
    ui.showGameOver(maxHeight, coins, highScore, isNewHigh);
  }, 800);
}

function handleClick(e) {
  if (gameState !== 'playing') return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = CONFIG.WIDTH / rect.width;
  const scaleY = CONFIG.HEIGHT / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  // Shoot toward click position (convert to world coords)
  shootTarget = { x: mx, y: my + cameraY };
  Sound.shoot();
  effects.emitShoot(player.x + player.w / 2, player.y);
  player.shoot(shootTarget.x, shootTarget.y, performance.now());
}

function handleTouch(e) {
  if (gameState !== 'playing') return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = CONFIG.WIDTH / rect.width;
  const scaleY = CONFIG.HEIGHT / rect.height;
  const mx = (touch.clientX - rect.left) * scaleX;
  const my = (touch.clientY - rect.top) * scaleY;

  shootTarget = { x: mx, y: my + cameraY };
  Sound.shoot();
  effects.emitShoot(player.x + player.w / 2, player.y);
  player.shoot(shootTarget.x, shootTarget.y, performance.now());
}

function handleKeyDown(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
}

function handleKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
}

// Mobile tilt support
let tiltX = 0;
function handleDeviceOrientation(e) {
  if (e.gamma !== null) {
    tiltX = e.gamma; // -90 to 90
    // Map tilt to keys
    keys.left = tiltX < -5;
    keys.right = tiltX > 5;
  }
}

// Touch left/right movement
function handleTouchMove(e) {
  // handled by touch start/click
}

function checkCollisions() {
  if (!player || !player.alive) return;

  const px = player.x;
  const py = player.y;
  const pw = player.w;
  const ph = player.h;
  const playerBottom = py + ph;
  const playerCenterX = px + pw / 2;

  // Platform collisions (only when falling)
  if (player.vy >= 0) {
    for (const p of platformMgr.platforms) {
      if (!p.alive || p.breaking) continue;

      // Check if player feet are near platform top
      const platTop = p.y;
      const prevBottom = playerBottom - player.vy;

      if (
        playerBottom >= platTop &&
        prevBottom <= platTop + 10 &&
        playerCenterX > p.x - 5 &&
        playerCenterX < p.x + p.w + 5 &&
        player.vy >= 0
      ) {
        // Land on platform
        const result = p.onLand();

        if (result === 'break') {
          Sound.platformBreak();
          effects.emitPlatformBreak(p.x, p.y, p.w);
          player.jump(CONFIG.JUMP_VELOCITY);
          effects.emitJumpDust(playerCenterX, playerBottom);
        } else if (result === 'spring') {
          Sound.springBounce();
          player.jump(CONFIG.SPRING_JUMP_VELOCITY);
          effects.emitSpringBounce(playerCenterX, playerBottom);
        } else if (result === 'spike') {
          if (p.spikeHitCooldown <= 0) {
            Sound.spikeHit();
            effects.emitSpikeHit(playerCenterX, playerBottom);
            p.spikeHitCooldown = 1000;
            player.hit();
            if (!player.alive) {
              gameOver();
              return;
            }
          }
          player.jump(CONFIG.JUMP_VELOCITY);
          effects.emitJumpDust(playerCenterX, playerBottom);
        } else {
          // Normal land
          player.y = platTop - ph;
          Sound.jump();
          player.jump(CONFIG.JUMP_VELOCITY);
          effects.emitJumpDust(playerCenterX, playerBottom);
        }
        break;
      }
    }
  }

  // Enemy collisions
  for (const e of enemyMgr.enemies) {
    if (!e.alive) continue;

    // Player hits enemy
    if (
      px + pw > e.x + 4 &&
      px < e.x + e.w - 4 &&
      py + ph > e.y + 4 &&
      py < e.y + e.h - 4
    ) {
      // If player is falling on top of enemy, kill it
      if (player.vy > 0 && py + ph < e.y + e.h / 2 + 5) {
        e.alive = false;
        Sound.enemyDie();
        effects.emitEnemyDie(e.x + e.w / 2, e.y + e.h / 2);
        player.jump(CONFIG.JUMP_VELOCITY);
      } else {
        // Player takes damage
        const dead = player.hit();
        if (dead) {
          gameOver();
          return;
        }
      }
    }
  }

  // Bullet-enemy collisions
  for (const b of player.bullets) {
    for (const e of enemyMgr.enemies) {
      if (!e.alive) continue;
      if (
        b.x > e.x && b.x < e.x + e.w &&
        b.y > e.y && b.y < e.y + e.h
      ) {
        e.alive = false;
        b.life = 0;
        Sound.enemyDie();
        effects.emitEnemyDie(e.x + e.w / 2, e.y + e.h / 2);
        break;
      }
    }
  }

  // Collectible collisions
  for (const c of enemyMgr.collectibles) {
    if (c.collected) continue;
    const dx = playerCenterX - c.x;
    const dy = (py + ph / 2) - c.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      c.collected = true;
      if (c.type === 'coin') {
        coins += 1;
        Sound.coinCollect();
        effects.emitCoinCollect(c.x, c.y);
      } else if (c.type === 'jetpack') {
        player.activateJetpack();
        Sound.jetpackActivate();
        effects.addFloatingText(c.x, c.y - 15, 'JETPACK!', '#e67e22');
      } else if (c.type === 'propeller') {
        player.activatePropeller();
        Sound.propellerActivate();
        effects.addFloatingText(c.x, c.y - 15, 'PROPELLER!', '#9b59b6');
      }
    }
  }
}

function updateCamera() {
  if (!player) return;
  const playerScreenY = player.y - cameraY;

  // Camera follows player upward
  if (playerScreenY < CONFIG.CAMERA_OFFSET) {
    cameraY = player.y - CONFIG.CAMERA_OFFSET;
  }

  // Update max height
  const height = -player.y + CONFIG.HEIGHT;
  if (height > maxHeight) {
    maxHeight = height;
    platformMgr.score = maxHeight;
  }
}

function checkGameOver() {
  if (!player || !player.alive) return;
  // Game over if player falls below camera
  if (player.y - cameraY > CONFIG.HEIGHT + 50) {
    player.alive = false;
    gameOver();
  }
}

let gameOverDelay = 0; // delay before showing game over screen

function update(now) {
  const dt = Math.min(now - lastTime, 50); // cap delta
  lastTime = now;

  if (!player) return;

  // Allow player to continue falling after death (for animation)
  if (gameState === 'gameover') {
    player.vy += CONFIG.GRAVITY;
    player.y += player.vy;
    effects.update();
    gameOverDelay -= dt;
    if (gameOverDelay <= 0) {
      // Show game over screen after delay
    }
    return;
  }

  if (gameState !== 'playing') return;

  player.update(keys, dt);
  platformMgr.update(dt, cameraY);
  enemyMgr.trySpawn(platformMgr.platforms, maxHeight);
  enemyMgr.update(dt, cameraY);
  effects.update();

  // Jetpack/propeller particles
  if (player.jetpackTimer > 0) {
    effects.emitJetpackFlame(player.x + player.w / 2, player.y + player.h);
  }
  if (player.propellerTimer > 0) {
    effects.emitPropellerWind(player.x + player.w / 2, player.y);
  }

  checkCollisions();
  updateCamera();
  checkGameOver();

  // Update HUD
  let powerupText = null;
  if (player.jetpackTimer > 0) {
    powerupText = '🚀 ' + Math.ceil(player.jetpackTimer / 1000) + 's';
  } else if (player.propellerTimer > 0) {
    powerupText = '🚁 ' + Math.ceil(player.propellerTimer / 1000) + 's';
  }
  ui.updateHUD(maxHeight, coins, highScore, player.hp, player.maxHp, powerupText);
}

function draw() {
  drawBackground();

  if (gameState === 'playing' || gameState === 'gameover') {
    platformMgr.draw(ctx, cameraY);
    enemyMgr.draw(ctx, cameraY);
    if (player) player.draw(ctx, cameraY);
    effects.draw(ctx, cameraY);
  }
}

function gameLoop(now) {
  update(now);
  draw();
  requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', handleTouch, { passive: false });
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Try device orientation for mobile tilt
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', handleDeviceOrientation);
}

// Start/restart button handlers
document.getElementById('btn-start').addEventListener('click', () => {
  startGame();
});

document.getElementById('btn-restart').addEventListener('click', () => {
  startGame();
});

// Expose startGame globally
window.startGame = startGame;

// Initial state
ui.showStart();
document.getElementById('hud').style.display = 'none';

// Start game loop
requestAnimationFrame(gameLoop);
