// main.js - Game engine and main loop
import { W, H, TILE, T, ST, KEYS } from './config.js';
import { Sound } from './sound.js';
import { Effects } from './effects.js';
import { Player } from './player.js';
import { Level, getLevelName, getTotalLevels } from './level.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = W;
        this.canvas.height = H;

        this.ui = new UI();
        this.effects = new Effects();
        this.state = ST.MENU;
        this.level = null;
        this.player = null;
        this.camX = 0;
        this.camY = 0;
        this.currentWorld = 0;
        this.currentLevel = 0;
        this.winTimer = 0;
        this.deathTimer = 0;
        this.frameCount = 0;

        // Input
        this.input = {
            left: false, right: false, up: false, down: false,
            jump: false, jumpPressed: false, dashPressed: false,
        };
        this._prevJump = false;
        this._prevDash = false;

        this._bindEvents();
        this._loop();
    }

    _bindEvents() {
        window.addEventListener('keydown', e => {
            this._key(e, true);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
        });
        window.addEventListener('keyup', e => this._key(e, false));
        this.canvas.addEventListener('click', e => this._click(e));
        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            const r = this.canvas.getBoundingClientRect();
            const sx = W / r.width, sy = H / r.height;
            const t = e.touches[0];
            this._clickAt((t.clientX - r.left) * sx, (t.clientY - r.top) * sy);
        });
    }

    _key(e, down) {
        const k = e.key;
        if (KEYS.LEFT.includes(k)) this.input.left = down;
        if (KEYS.RIGHT.includes(k)) this.input.right = down;
        if (KEYS.UP.includes(k)) this.input.up = down;
        if (KEYS.DOWN.includes(k)) this.input.down = down;
        if (KEYS.JUMP.includes(k)) this.input.jump = down;
        if (KEYS.DASH.includes(k)) this.input.dashPressed = down;
        if (down && KEYS.PAUSE.includes(k)) this._handlePause();
        if (down && k === 'Enter' && this.state === ST.DEAD) this._restartFromDead('retry');
    }

    _click(e) {
        const r = this.canvas.getBoundingClientRect();
        const sx = W / r.width, sy = H / r.height;
        this._clickAt((e.clientX - r.left) * sx, (e.clientY - r.top) * sy);
    }

    _clickAt(mx, my) {
        Sound.click();
        const btn = this.ui.getButtonAt(this.state, mx, my);
        if (!btn) return;

        switch (this.state) {
            case ST.MENU:
                if (btn === 'play') { this.currentWorld = 0; this.currentLevel = 0; this._startLevel(0, 0); }
                if (btn === 'select') this.state = ST.SELECT;
                break;
            case ST.SELECT:
                if (btn === 'back') { this.state = ST.MENU; break; }
                if (btn.startsWith('world_')) { this.ui.selectedWorld = +btn.split('_')[1]; break; }
                if (btn.startsWith('level_')) {
                    const [, w, l] = btn.split('_').map(Number);
                    if (this.ui.isLevelUnlocked(w, l)) this._startLevel(w, l);
                }
                break;
            case ST.PAUSE:
                if (btn === 'menu') { this.state = ST.MENU; }
                break;
            case ST.WIN:
                if (btn === 'next') {
                    const next = this.currentWorld * 5 + this.currentLevel + 1;
                    if (next < getTotalLevels()) {
                        this._startLevel(Math.floor(next / 5), next % 5);
                    } else {
                        this.state = ST.MENU;
                    }
                }
                if (btn === 'menu') this.state = ST.MENU;
                break;
            case ST.DEAD:
                if (btn === 'retry') this._startLevel(this.currentWorld, this.currentLevel);
                if (btn === 'menu') this.state = ST.MENU;
                break;
        }
    }

    _handlePause() {
        if (this.state === ST.PLAY) this.state = ST.PAUSE;
        else if (this.state === ST.PAUSE) this.state = ST.PLAY;
        else if (this.state === ST.DEAD) this._restartFromDead('menu');
    }

    _restartFromDead(action) {
        if (action === 'retry') this._startLevel(this.currentWorld, this.currentLevel);
        else if (action === 'menu') this.state = ST.MENU;
    }

    _startLevel(world, level) {
        this.currentWorld = world;
        this.currentLevel = level;
        this.level = new Level(world, level);
        this.player = new Player(this.level.playerSpawn.x, this.level.playerSpawn.y);
        this.effects = new Effects();
        this.camX = 0; this.camY = 0;
        this.winTimer = 0; this.deathTimer = 0;
        this.state = ST.PLAY;
    }

    _loop() {
        this.frameCount++;
        this._update();
        this._draw();
        requestAnimationFrame(() => this._loop());
    }

    _update() {
        if (this.state !== ST.PLAY) return;

        // Process input edges
        this.input.jumpPressed = this.input.jump && !this._prevJump;
        this.input.dashPressed = this.input.dashPressed && !this._prevDash;

        // Update player
        this.player.update(this.input, this.level, this.effects);

        // Reset edge flags after player update
        this._prevJump = this.input.jump;
        this._prevDash = this.input.dashPressed;

        // Update level
        this.level.updateMovingPlatforms();
        this.level.updateLava();

        // Update enemies
        for (const e of this.level.enemies) {
            if (!e.alive) continue;
            if (e.update.length === 2) e.update(this.level, this.player.x);
            else e.update(this.level);

            // Turret projectiles vs player
            if (e.getProjectiles) {
                for (const p of e.getProjectiles()) {
                    if (this._rectsOverlap(p, this.player.getBounds())) {
                        this.player.takeDamage(this.effects);
                        p.life = 0;
                    }
                }
            }

            // Enemy vs player collision
            if (this._rectsOverlap(e.getBounds(), this.player.getBounds())) {
                // Stomp check: player falling and above enemy center
                if (this.player.vy > 0 && this.player.y + this.player.h < e.y + e.h * 0.5) {
                    e.stomped(this.effects);
                    this.player.vy = -8;
                    Sound.coin();
                } else if (this.player.dashTimer > 0) {
                    // Dash through enemy
                    e.stomped(this.effects);
                } else {
                    this.player.takeDamage(this.effects);
                }
            }
        }

        // Collectibles
        for (const c of this.level.collectibles) {
            c.update();
            if (c.overlaps(this.player.getBounds())) {
                if (c.constructor.name === 'Star') {
                    c.collected = true;
                    this.player.stars[c.index] = true;
                    Sound.star();
                    this.effects.starCollect(c.x + c.w / 2, c.y + c.h / 2);
                } else if (c.constructor.name === 'Coin') {
                    c.collected = true;
                    this.player.coins += c.value;
                    Sound.coin();
                    this.effects.coinCollect(c.x + c.w / 2, c.y + c.h / 2);
                } else if (c.constructor.name === 'Key') {
                    c.collected = true;
                    this.player.keys++;
                    Sound.key();
                    this.effects.coinCollect(c.x + c.w / 2, c.y + c.h / 2);
                } else if (c.constructor.name === 'Door') {
                    if (!c.open && this.player.keys > 0) {
                        c.tryOpen(this.player);
                        Sound.door();
                    }
                }
            }
        }

        // Goal check
        const goalBounds = { x: this.level.goal.x, y: this.level.goal.y, w: 32, h: 40 };
        if (this._rectsOverlap(this.player.getBounds(), goalBounds)) {
            this.winTimer++;
            if (this.winTimer === 1) {
                Sound.win();
                this.effects.goalEffect(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
            }
            if (this.winTimer > 60) {
                const starCount = this.player.stars.filter(Boolean).length;
                this.ui.completeLevel(this.currentWorld, this.currentLevel, starCount);
                this.state = ST.WIN;
            }
        } else {
            this.winTimer = 0;
        }

        // Lava death (only trigger once)
        if (this.player.alive && this.level.checkLavaDeath(this.player)) {
            this.player.health = 0;
            this.player.alive = false;
            Sound.die();
            this.effects.death(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
        }

        // Death
        if (!this.player.alive) {
            this.deathTimer++;
            if (this.deathTimer > 90) this.state = ST.DEAD;
        }

        // Fall off map (only trigger once — without guard, deathTimer resets every frame and the game freezes)
        if (this.player.alive && this.player.y > this.level.rows * TILE + 100) {
            this.player.health = 0;
            this.player.alive = false;
            Sound.die();
            this.deathTimer = 60;
        }

        // Camera
        this._updateCamera();

        // Effects
        this.effects.update();
    }

    _updateCamera() {
        const targetX = this.player.x + this.player.w / 2 - W / 2;
        const targetY = this.player.y + this.player.h / 2 - H / 2;
        this.camX += (targetX - this.camX) * 0.1;
        this.camY += (targetY - this.camY) * 0.1;
        this.camX = Math.max(0, Math.min(this.level.cols * TILE - W, this.camX));
        this.camY = Math.max(0, Math.min(this.level.rows * TILE - H, this.camY));
    }

    _rectsOverlap(a, b) {
        return a.x < b.x + b.w && a.x + (a.w || 0) > b.x &&
               a.y < b.y + b.h && a.y + (a.h || 0) > b.y;
    }

    _draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, W, H);

        switch (this.state) {
            case ST.MENU:
                this.ui.drawMenu(ctx);
                break;
            case ST.SELECT:
                this.ui.drawLevelSelect(ctx);
                break;
            case ST.PLAY:
            case ST.PAUSE:
            case ST.WIN:
            case ST.DEAD:
                this._drawGame(ctx);
                if (this.state === ST.PAUSE) this.ui.drawPause(ctx);
                if (this.state === ST.WIN) this.ui.drawLevelComplete(ctx, this.player.stars.filter(Boolean).length, this.player.coins);
                if (this.state === ST.DEAD) this.ui.drawGameOver(ctx);
                break;
        }
    }

    _drawGame(ctx) {
        // Background
        this.level.drawBackground(ctx, this.camX, this.camY);

        // Tiles
        this.level.drawTiles(ctx, this.camX, this.camY);

        // Moving platforms
        this.level.drawMovingPlatforms(ctx, this.camX, this.camY);

        // Lava (rising)
        this.level.drawLava(ctx, this.camX, this.camY);

        // Goal
        this.level.drawGoal(ctx, this.camX, this.camY);

        // Collectibles
        for (const c of this.level.collectibles) c.draw(ctx, this.camX, this.camY);

        // Enemies
        for (const e of this.level.enemies) {
            if (e.alive) e.draw(ctx, this.camX, this.camY);
        }

        // Player
        this.player.draw(ctx, this.camX, this.camY);

        // Effects
        this.effects.draw(ctx, this.camX, this.camY);

        // HUD
        this.ui.drawHUD(ctx, this.player, this.level);
    }
}

// Start
window.addEventListener('DOMContentLoaded', () => new Game());
