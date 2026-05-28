// main.js - Game loop, camera, collision, initialization
import { TILE, COLS, ROWS, WIDTH, HEIGHT, T, COLORS, ENEMY_CFG, ITEM_VALUES, BOMB_FUSE, BOMB_RADIUS } from './config.js';
import { Sound } from './sound.js';
import { Level, RNG } from './level.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { ItemManager, Shop } from './items.js';
import { Effects } from './effects.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.viewW = this.canvas.width;
        this.viewH = this.canvas.height;

        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;

        this.state = 'start'; // 'start', 'playing', 'shop', 'gameover'
        this.level = null;
        this.player = null;
        this.enemyMgr = new EnemyManager();
        this.itemMgr = new ItemManager();
        this.effects = new Effects();
        this.ui = new UI(this.canvas);
        this.shop = null;

        // Camera
        this.camX = 0;
        this.camY = 0;
        this.camTargetX = 0;
        this.camTargetY = 0;

        // Game stats
        this.depth = 1;
        this.totalGold = 0;
        this.totalKills = 0;
        this.timeBonus = 0;
        this.levelTime = 0;
        this.maxLevelTime = 60000; // 60 seconds for time bonus

        // High score
        this.highScore = parseInt(localStorage.getItem('spelunky_highscore') || '0');

        // Darkness overlay canvas
        this.darkCanvas = document.createElement('canvas');
        this.darkCanvas.width = this.viewW;
        this.darkCanvas.height = this.viewH;
        this.darkCtx = this.darkCanvas.getContext('2d');

        // Previous grounded state for landing detection
        this.wasGrounded = false;

        // Keys for shop/start
        this._shopKeyHandler = null;
        this._startKeyHandler = null;

        // Animation frame
        this.lastTime = 0;
        this.running = false;

        this.ui.showStart();
        this._setupStartInput();
        this._loop = this._loop.bind(this);
    }

    _setupStartInput() {
        const handler = (e) => {
            if (e.code === 'Space' && this.state === 'start') {
                e.preventDefault();
                window.removeEventListener('keydown', handler);
                Sound.jump();
                this.ui.transition(() => {
                    this.startGame();
                });
            }
        };
        window.addEventListener('keydown', handler);
    }

    _setupGameOverInput() {
        const handler = (e) => {
            if (e.code === 'Space' && this.state === 'gameover') {
                e.preventDefault();
                window.removeEventListener('keydown', handler);
                Sound.jump();
                this.ui.transition(() => {
                    this.startGame();
                });
            }
        };
        window.addEventListener('keydown', handler);
    }

    _setupShopInput() {
        if (this._shopKeyHandler) {
            window.removeEventListener('keydown', this._shopKeyHandler);
        }
        this._shopKeyHandler = (e) => {
            if (this.state !== 'shop') return;
            e.preventDefault();

            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.ui.selectedShopItem = Math.max(0, this.ui.selectedShopItem - 1);
                Sound.tick();
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.ui.selectedShopItem = Math.min(this.shop.items.length - 1, this.ui.selectedShopItem + 1);
                Sound.tick();
            } else if (e.code === 'Space' || e.code === 'KeyX') {
                const item = this.shop.items[this.ui.selectedShopItem];
                if (item) {
                    const bought = this.shop.tryBuy(item, this.player);
                    if (!bought) {
                        this.ui.shopMessage = '金币不足！';
                        this.ui.shopMessageTimer = 1500;
                    }
                }
            } else if (e.code === 'Escape' || e.code === 'KeyZ') {
                this.closeShop();
            }
        };
        window.addEventListener('keydown', this._shopKeyHandler);
    }

    startGame() {
        this.state = 'playing';
        this.depth = 1;
        this.totalGold = 0;
        this.totalKills = 0;
        this.timeBonus = 0;
        this.ui.hide();
        this._generateLevel();
    }

    _generateLevel() {
        this.level = new Level(this.depth);
        this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
        this.enemyMgr.clear();
        this.enemyMgr.spawnFromLevel(this.level);
        this.itemMgr.clear();
        this.itemMgr.spawnFromLevel(this.level);
        this.shop = null;

        // Create shop if it's every 3rd level
        if (this.depth % 3 === 0 && this.level.rooms && this.level.rooms.length > 2) {
            const rng = new RNG(Date.now() + this.depth * 1337);
            this.shop = new Shop(this.level, rng);
            // Place shop in a mid-level room (not the first or last)
            const shopRoomIdx = Math.floor(this.level.rooms.length / 2);
            const shopRoom = this.level.rooms[shopRoomIdx];
            this.shop.placeInRoom(shopRoom, TILE);

            // Mark shop floor and walls in tiles
            for (let x = shopRoom.x; x < shopRoom.x + shopRoom.w; x++) {
                if (shopRoom.y + shopRoom.h - 1 < this.level.rows) {
                    this.level.tiles[shopRoom.y + shopRoom.h - 1][x] = T.SHOP_FLOOR;
                }
            }
        }

        this.effects = new Effects();
        this.levelTime = 0;
        this.timeBonus = 0;

        // Center camera immediately
        this.camX = this.player.x - this.viewW / 2;
        this.camY = this.player.y - this.viewH / 2;
        this._clampCamera();

        this.ui.showLevelStart(`深度 ${this.depth}`);

        if (this.depth === 1) {
            this.ui.showTutorial('方向键移动 | SPACE跳跃 | SHIFT攻击 | Z炸弹 | C绳索');
        }
    }

    _loop(time) {
        if (!this.running) return;

        const dt = Math.min(time - this.lastTime, 50); // Cap at 50ms
        this.lastTime = time;

        this.update(dt);
        this.render();

        requestAnimationFrame(this._loop);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop);
    }

    update(dt) {
        this.ui.update(dt);

        if (this.state !== 'playing') return;

        this.levelTime += dt;

        // Update player
        const prevHp = this.player.hp;
        const prevGold = this.player.gold;
        const prevHasKey = this.player.hasKey;
        const prevRopes = this.player.ropes;
        const prevBombs = this.player.bombs;
        const wantAction = this.player.input.actionPressed;

        this.player.update(dt, this.level, Sound);

        // Check bomb explosions for effects
        for (const bomb of this.player.activeBombs) {
            if (bomb.exploded && bomb.explosionX !== undefined) {
                this.effects.explosion(bomb.explosionX, bomb.explosionY, 1.5);
                // Check if explosion hits enemies
                for (const enemy of this.enemyMgr.enemies) {
                    const dist = Math.hypot(enemy.x - bomb.explosionX, enemy.y - bomb.explosionY);
                    if (dist < BOMB_RADIUS * TILE) {
                        enemy.takeDamage(99);
                        this.totalKills++;
                        this.effects.enemyDeath(enemy.x, enemy.y, COLORS[enemy.type] || '#888');
                        this.player.gold += enemy.score;
                        this.itemMgr.addFloatingText(enemy.x, enemy.y - 10, `+${enemy.score}`);
                    }
                }
                bomb.explosionX = undefined; // Prevent re-triggering
            }
        }

        // Landing dust
        if (this.player.grounded && !this.wasGrounded) {
            this.effects.landingDust(this.player.x, this.player.y + this.player.h);
        }
        this.wasGrounded = this.player.grounded;

        // Walk dust
        if (this.player.grounded && Math.abs(this.player.vx) > 0.5) {
            this.effects.walkDust(
                this.player.x - this.player.facing * 5,
                this.player.y + this.player.h,
                this.player.facing
            );
        }

        // Player hurt effect
        if (this.player.hp < prevHp && !this.player.dead) {
            this.effects.playerHurt(this.player.x, this.player.y + this.player.h / 2);
        }

        // Player death
        if (this.player.dead) {
            this.effects.explosion(this.player.x, this.player.y + this.player.h / 2, 2);
            this._gameOver();
            return;
        }

        // Update enemies
        this.enemyMgr.update(dt, this.level, this.player.x, this.player.y);

        // Enemy-player collision
        for (const enemy of this.enemyMgr.enemies) {
            if (enemy.dead) continue;
            const ehb = enemy.getHitbox();
            const phb = this.player.getHitbox();
            if (this._boxOverlap(ehb, phb)) {
                // Check if player is stomping (falling on top)
                if (this.player.vy > 0 && this.player.y + this.player.h < enemy.y + enemy.h * 0.5) {
                    enemy.takeDamage(1);
                    this.player.vy = -6; // Bounce
                    this.totalKills++;
                    this.effects.enemyDeath(enemy.x, enemy.y + enemy.h / 2, COLORS[enemy.type] || '#888');
                    this.player.gold += enemy.score;
                    this.itemMgr.addFloatingText(enemy.x, enemy.y - 10, `+${enemy.score}`);
                } else {
                    this.player.takeDamage(enemy.damage, this.level);
                }
            }

            // Whip hit
            const whipBox = this.player.getWhipHitbox();
            if (whipBox && !enemy.dead) {
                if (this._boxOverlap(whipBox, ehb)) {
                    enemy.takeDamage(1);
                    this.totalKills++;
                    this.effects.enemyDeath(enemy.x, enemy.y + enemy.h / 2, COLORS[enemy.type] || '#888');
                    this.player.gold += enemy.score;
                    this.itemMgr.addFloatingText(enemy.x, enemy.y - 10, `+${enemy.score}`);
                    Sound.enemyDie();
                }
            }
        }

        // Update items
        this.itemMgr.update(dt);

        // Item collection
        for (const item of this.itemMgr.items) {
            if (item.collected) continue;
            const ihb = item.getHitbox();
            const phb = this.player.getHitbox();
            if (this._boxOverlap(ihb, phb)) {
                item.collected = true;
                this._collectItem(item);
            }
        }

        // Arrow traps
        this._updateArrowTraps(dt);

        // Shop interaction (press X near shopkeeper)
        if (this.shop && this.shop.shopkeeper && wantAction) {
            const sx = this.shop.shopkeeper.x;
            const sy = this.shop.shopkeeper.y;
            const dist = Math.hypot(this.player.x - sx, this.player.y - sy);
            if (dist < TILE * 2) {
                this.openShop();
            }
        }

        // Door interaction
        const doorCol = Math.floor(this.level.exitDoor.x / TILE);
        const doorRow = Math.floor(this.level.exitDoor.y / TILE);
        const playerCol = Math.floor(this.player.x / TILE);
        const playerRow = Math.floor((this.player.y + this.player.h / 2) / TILE);

        if (Math.abs(playerCol - doorCol) <= 1 && Math.abs(playerRow - doorRow) <= 1) {
            if (this.player.hasKey && !this.level.doorOpen) {
                this.level.doorOpen = true;
                Sound.doorOpen();
                this.effects.doorOpen(this.level.exitDoor.x + TILE / 2, this.level.exitDoor.y + TILE / 2);
            }
            if (this.level.doorOpen) {
                // Enter door
                if (Math.abs(this.player.x - (doorCol * TILE + TILE / 2)) < TILE * 0.7 &&
                    Math.abs(this.player.y - (doorRow * TILE)) < TILE) {
                    this._nextLevel();
                }
            }
        }

        // Effects
        this.effects.update(dt);

        // Camera
        this._updateCamera(dt);
    }

    _collectItem(item) {
        const cfg = ITEM_VALUES[item.type];
        if (!cfg) return;

        switch (item.type) {
            case 'gold_nugget':
            case 'gold_bar':
                this.player.gold += cfg.value;
                Sound.collectGold();
                this.effects.goldCollect(item.x, item.y);
                this.itemMgr.addFloatingText(item.x, item.y - 10, `+${cfg.value}`);
                break;
            case 'gem_ruby':
            case 'gem_emerald':
            case 'gem_sapphire':
                this.player.gold += cfg.value;
                Sound.collectGem();
                const gemColor = item.type === 'gem_ruby' ? COLORS.gemRuby :
                    item.type === 'gem_emerald' ? COLORS.gemEmerald : COLORS.gemSapphire;
                this.effects.gemCollect(item.x, item.y, gemColor);
                this.itemMgr.addFloatingText(item.x, item.y - 10, `+${cfg.value}`);
                break;
            case 'key':
                this.player.hasKey = true;
                Sound.collectKey();
                this.effects.keyCollect(item.x, item.y);
                this.itemMgr.addFloatingText(item.x, item.y - 15, '钥匙!', COLORS.gold);
                break;
            case 'rope_pickup':
                this.player.ropes += cfg.ropeAmount;
                Sound.collectItem();
                this.itemMgr.addFloatingText(item.x, item.y - 10, `+${cfg.ropeAmount}绳索`);
                break;
            case 'bomb_pickup':
                this.player.bombs += cfg.bombAmount;
                Sound.collectItem();
                this.itemMgr.addFloatingText(item.x, item.y - 10, `+${cfg.bombAmount}炸弹`);
                break;
            case 'health':
                if (this.player.hp < this.player.maxHp) {
                    this.player.heal(cfg.healAmount);
                    Sound.collectItem();
                    this.itemMgr.addFloatingText(item.x, item.y - 10, '+1生命', COLORS.uiSuccess);
                } else {
                    item.collected = false; // Don't consume if full HP
                }
                break;
            case 'chest':
                this.player.gold += cfg.value;
                Sound.collectGold();
                this.effects.goldCollect(item.x, item.y);
                this.itemMgr.addFloatingText(item.x, item.y - 10, `+${cfg.value}`, COLORS.gold);
                break;
        }
    }

    _updateArrowTraps(dt) {
        for (const trap of this.level.traps) {
            if (trap.type !== 'arrow' || trap.fired) continue;

            const dist = Math.abs(this.player.x - trap.x);
            if (dist < 3 * TILE) {
                trap.fired = true;
                Sound.arrowShoot();
                // Create arrow projectile
                const arrow = {
                    x: trap.x + (trap.dir > 0 ? TILE : 0),
                    y: trap.y + TILE / 2,
                    vx: trap.dir * 6,
                    vy: 0,
                    life: 2000,
                    active: true
                };
                if (!this.level.arrows) this.level.arrows = [];
                this.level.arrows.push(arrow);
            }
        }

        // Update arrows
        if (this.level.arrows) {
            for (const arrow of this.level.arrows) {
                if (!arrow.active) continue;
                arrow.x += arrow.vx;
                arrow.life -= dt;
                if (arrow.life <= 0) {
                    arrow.active = false;
                    continue;
                }
                // Hit solid
                const col = Math.floor(arrow.x / TILE);
                const row = Math.floor(arrow.y / TILE);
                if (this.level.isSolid(col, row)) {
                    arrow.active = false;
                    continue;
                }
                // Hit player
                const phb = this.player.getHitbox();
                if (arrow.x > phb.x && arrow.x < phb.x + phb.w &&
                    arrow.y > phb.y && arrow.y < phb.y + phb.h) {
                    this.player.takeDamage(1, this.level);
                    arrow.active = false;
                }
            }
            this.level.arrows = this.level.arrows.filter(a => a.active);
        }
    }

    _nextLevel() {
        this.effects.levelComplete(this.player.x, this.player.y);
        Sound.levelComplete();

        // Calculate time bonus
        const timeLeft = Math.max(0, this.maxLevelTime - this.levelTime);
        this.timeBonus += Math.floor(timeLeft / 100);

        this.depth++;
        this.totalGold = this.player.gold;

        this.ui.transition(() => {
            this._generateLevel();
        });
    }

    _gameOver() {
        this.state = 'gameover';
        this.totalGold = this.player.gold;

        // Update high score
        if (this.totalGold > this.highScore) {
            this.highScore = this.totalGold;
            localStorage.setItem('spelunky_highscore', String(this.highScore));
        }

        this.ui.showGameOver({
            depth: this.depth,
            gold: this.totalGold,
            kills: this.totalKills,
            highScore: this.highScore
        });

        this._setupGameOverInput();
    }

    openShop() {
        if (this.state !== 'playing') return;
        this.state = 'shop';
        this.ui.showShop(this.shop.items, this.player);
        this._setupShopInput();
    }

    closeShop() {
        if (this.state !== 'shop') return;
        this.state = 'playing';
        this.ui.hideShop();
        if (this._shopKeyHandler) {
            window.removeEventListener('keydown', this._shopKeyHandler);
            this._shopKeyHandler = null;
        }
    }

    _updateCamera(dt) {
        const targetX = this.player.x - this.viewW / 2;
        const targetY = this.player.y - this.viewH / 2 + 30;

        // Smooth follow
        this.camX += (targetX - this.camX) * 0.08;
        this.camY += (targetY - this.camY) * 0.08;

        this._clampCamera();
    }

    _clampCamera() {
        const maxX = this.level.cols * TILE - this.viewW;
        const maxY = this.level.rows * TILE - this.viewH;
        this.camX = Math.max(0, Math.min(maxX, this.camX));
        this.camY = Math.max(0, Math.min(maxY, this.camY));
    }

    _boxOverlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
            a.y < b.y + b.h && a.y + a.h > b.y;
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.viewW, this.viewH);

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.viewH);
        bgGrad.addColorStop(0, COLORS.bgGrad1);
        bgGrad.addColorStop(1, COLORS.bgGrad2);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.viewW, this.viewH);

        if (this.state === 'playing' || this.state === 'shop') {
            ctx.save();

            // Apply screen shake
            const shake = this.effects.getShakeOffset();
            const camX = Math.round(this.camX + shake.x);
            const camY = Math.round(this.camY + shake.y);
            ctx.translate(-camX, -camY);

            // Render level
            this.level.render(ctx, camX, camY, this.viewW, this.viewH);

            // Render arrows
            if (this.level.arrows) {
                for (const arrow of this.level.arrows) {
                    if (!arrow.active) continue;
                    ctx.fillStyle = COLORS.arrow;
                    ctx.save();
                    ctx.translate(arrow.x, arrow.y);
                    ctx.rotate(arrow.vx > 0 ? 0 : Math.PI);
                    ctx.fillRect(-10, -1.5, 20, 3);
                    // Arrowhead
                    ctx.beginPath();
                    ctx.moveTo(10, -4);
                    ctx.lineTo(14, 0);
                    ctx.lineTo(10, 4);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Render items
            this.itemMgr.render(ctx);

            // Render shop
            if (this.shop) {
                this.shop.render(ctx);
            }

            // Render enemies
            this.enemyMgr.render(ctx);

            // Render player
            this.player.render(ctx);

            // Render particles
            this.effects.renderParticles(ctx);

            ctx.restore();

            // Darkness overlay (torch radius effect)
            this._renderDarkness(ctx, camX, camY);

            // Flash
            this.effects.renderFlash(ctx, this.viewW, this.viewH);

            // HUD
            this.ui.renderHUD(ctx, this.player, this.level, this.timeBonus, this.viewW, this.viewH);

            // Shop overlay
            if (this.state === 'shop') {
                this.ui.renderShopOverlay(ctx, this.viewW, this.viewH);
            }
        }

        // Overlays
        if (this.state === 'start') {
            this.ui.renderStartOverlay(ctx, this.viewW, this.viewH);
        } else if (this.state === 'gameover') {
            this.ui.renderGameOver(ctx, this.viewW, this.viewH);
        }

        // Transition
        this.ui.renderTransition(ctx, this.viewW, this.viewH);
    }

    _renderDarkness(ctx, camX, camY) {
        const dc = this.darkCtx;
        dc.clearRect(0, 0, this.viewW, this.viewH);

        // Fill with darkness
        dc.fillStyle = 'rgba(10,5,0,0.65)';
        dc.fillRect(0, 0, this.viewW, this.viewH);

        // Cut out torch lights
        dc.globalCompositeOperation = 'destination-out';

        // Player torch
        const px = Math.round(this.player.x - camX);
        const py = Math.round(this.player.y + this.player.h / 2 - camY);
        const torchRadius = 130;
        const flicker = 0.9 + Math.sin(Date.now() / 100) * 0.1;

        const grad = dc.createRadialGradient(px, py, 0, px, py, torchRadius * flicker);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        dc.fillStyle = grad;
        dc.fillRect(px - torchRadius, py - torchRadius, torchRadius * 2, torchRadius * 2);

        // Level torches
        for (const torch of this.level.torchPositions) {
            const tx = Math.round(torch.x - camX);
            const ty = Math.round(torch.y - camY - 10);
            const tRadius = 70 * flicker;

            if (tx < -tRadius || tx > this.viewW + tRadius) continue;
            if (ty < -tRadius || ty > this.viewH + tRadius) continue;

            const tGrad = dc.createRadialGradient(tx, ty, 0, tx, ty, tRadius);
            tGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
            tGrad.addColorStop(1, 'rgba(0,0,0,0)');
            dc.fillStyle = tGrad;
            dc.fillRect(tx - tRadius, ty - tRadius, tRadius * 2, tRadius * 2);
        }

        // Door glow (if open)
        if (this.level.doorOpen) {
            const dx = Math.round(this.level.exitDoor.x + TILE / 2 - camX);
            const dy = Math.round(this.level.exitDoor.y + TILE / 2 - camY);
            const dRadius = 80;
            const dGrad = dc.createRadialGradient(dx, dy, 0, dx, dy, dRadius);
            dGrad.addColorStop(0, 'rgba(0,0,0,0.9)');
            dGrad.addColorStop(1, 'rgba(0,0,0,0)');
            dc.fillStyle = dGrad;
            dc.fillRect(dx - dRadius, dy - dRadius, dRadius * 2, dRadius * 2);
        }

        dc.globalCompositeOperation = 'source-over';

        // Apply darkness overlay
        ctx.drawImage(this.darkCanvas, 0, 0);

        // Add warm torch tint
        const warmGrad = ctx.createRadialGradient(px, py, 0, px, py, torchRadius * 1.5);
        warmGrad.addColorStop(0, 'rgba(255,150,50,0.04)');
        warmGrad.addColorStop(1, 'rgba(255,150,50,0)');
        ctx.fillStyle = warmGrad;
        ctx.fillRect(px - torchRadius * 1.5, py - torchRadius * 1.5, torchRadius * 3, torchRadius * 3);
    }
}

// Initialize game on load
let game;
function initGame() {
    game = new Game();
    game.start();
}

// Export for window.startGame
window.startGame = initGame;

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
