// main.js - Game loop, state machine, collision detection

import { GAME_WIDTH, GAME_HEIGHT, MAX_LIVES, MISSES_TO_LOSE_LIFE, COMBO, COLORS } from './config.js';
import { Sound } from './sound.js';
import { Player } from './player.js';
import { ItemSpawner } from './items.js';
import { Effects } from './effects.js';
import { UI } from './ui.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;

        this.state = 'menu'; // menu | playing | gameover
        this.score = 0;
        this.lives = MAX_LIVES;
        this.combo = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.misses = 0;
        this.itemsCaught = 0;
        this.coinsCaught = 0;
        this.diamondsCaught = 0;
        this.elapsed = 0;
        this.lastTime = 0;

        this.player = new Player(GAME_HEIGHT);
        this.spawner = new ItemSpawner();
        this.effects = new Effects();
        this.ui = new UI();
        this.items = [];

        this.keys = new Set();
        this.mouseX = null;
        this.useMouseControl = false;

        this._globalSlow = false;
        this._globalSlowTimer = 0;

        this.bgStars = this._generateBgStars(60);
        this.bgClouds = this._generateBgClouds(5);

        this._bindEvents();
        this._startLoop();
    }

    _generateBgStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                size: 0.5 + Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 2,
            });
        }
        return stars;
    }

    _generateBgClouds(count) {
        const clouds = [];
        for (let i = 0; i < count; i++) {
            clouds.push({
                x: Math.random() * GAME_WIDTH,
                y: 50 + Math.random() * (GAME_HEIGHT * 0.5),
                width: 80 + Math.random() * 120,
                height: 20 + Math.random() * 30,
                speed: 5 + Math.random() * 10,
                alpha: 0.03 + Math.random() * 0.04,
            });
        }
        return clouds;
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key);
            if (e.key === ' ' || e.key === 'Enter') {
                if (this.state === 'menu') this._startGame();
                else if (this.state === 'gameover') this._restart();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = GAME_WIDTH / rect.width;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.useMouseControl = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouseX = null;
            this.useMouseControl = false;
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'menu') {
                this._startGame();
            } else if (this.state === 'gameover') {
                this._restart();
            }
        });

        // Touch support
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = GAME_WIDTH / rect.width;
            this.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
            this.useMouseControl = true;
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'menu') {
                this._startGame();
            } else if (this.state === 'gameover') {
                this._restart();
            }
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = GAME_WIDTH / rect.width;
            this.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
            this.useMouseControl = true;
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.mouseX = null;
            this.useMouseControl = false;
        });
    }

    _startGame() {
        Sound.init();
        this.state = 'playing';
        this.score = 0;
        this.lives = MAX_LIVES;
        this.combo = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.misses = 0;
        this.itemsCaught = 0;
        this.coinsCaught = 0;
        this.diamondsCaught = 0;
        this.elapsed = 0;
        this.items = [];
        this._globalSlow = false;
        this._globalSlowTimer = 0;
        this.player = new Player(GAME_HEIGHT);
        this.spawner.reset();
        this.effects.clear();
    }

    _restart() {
        this._startGame();
    }

    _gameOver() {
        this.state = 'gameover';
        Sound.gameOver();

        const mins = Math.floor(this.elapsed / 60000);
        const secs = Math.floor((this.elapsed / 1000) % 60);

        const isNewHighScore = this.score > this.ui.highScore;
        this.ui.saveHighScore(this.score);

        this.ui.gameOverStats = {
            score: this.score,
            itemsCaught: this.itemsCaught,
            coinsCaught: this.coinsCaught,
            diamondsCaught: this.diamondsCaught,
            maxCombo: this.maxCombo,
            survivalTime: `${mins}:${secs.toString().padStart(2, '0')}`,
            isNewHighScore,
        };
    }

    _checkCollision(item, player) {
        const ib = item.bounds;
        const pb = player.bounds;
        return ib.right > pb.left && ib.left < pb.right && ib.bottom > pb.top && ib.top < pb.bottom;
    }

    _handleItemCatch(item) {
        const type = item.type;
        item.alive = false;
        item.caught = true;
        this.itemsCaught++;
        this.player.onCatch();

        if (type.points > 0) {
            // Score item
            this.comboCount++;
            this._updateCombo();

            const points = type.points * this.combo * this.player.multiplier;
            this.score += points;

            if (type.id === 'gold_coin' || type.id === 'silver_coin') {
                this.coinsCaught++;
                Sound.coinCatch(this.combo);
                this.effects.spawnCatchParticles(item.x, item.y, type.color, 10);
                this.effects.addFloatingText(item.x, item.y - 20, `+${points}`, COLORS.gold);
            } else if (type.id === 'diamond') {
                this.diamondsCaught++;
                Sound.diamondCatch();
                this.effects.spawnDiamondParticles(item.x, item.y);
                this.effects.addFloatingText(item.x, item.y - 20, `+${points}`, '#00E5FF', 24);
            }

            if (this.combo >= 3) {
                this.effects.triggerComboFlash(this.combo);
                this.effects.spawnComboParticles(item.x, item.y, this.combo);
            }
        } else if (type.powerUp) {
            // Power-up
            Sound.powerUp();
            this.effects.spawnPowerUpParticles(item.x, item.y, type.color);

            switch (type.powerUp) {
                case 'multiplier':
                    this.player.activateMultiplier(type.duration);
                    this.effects.addFloatingText(item.x, item.y - 20, 'x2 得分!', '#FF6F00', 22);
                    break;
                case 'magnet':
                    this.player.activateMagnet(type.duration);
                    this.effects.addFloatingText(item.x, item.y - 20, '磁铁!', '#F44336', 22);
                    break;
                case 'shield':
                    this.player.activateShield();
                    this.effects.addFloatingText(item.x, item.y - 20, '护盾!', '#42A5F5', 22);
                    break;
                case 'slow':
                    // Global slow effect on items
                    this._globalSlow = true;
                    this._globalSlowTimer = type.duration;
                    this.effects.addFloatingText(item.x, item.y - 20, '减速!', '#66BB6A', 22);
                    break;
            }
        } else if (type.danger) {
            // Caught a danger item
            if (type.id === 'bomb') {
                if (this.player.hasShield) {
                    // Shield absorbs bomb
                    this.player.hasShield = false;
                    Sound.shieldBlock();
                    this.effects.spawnCatchParticles(item.x, item.y, '#42A5F5', 12);
                    this.effects.addFloatingText(item.x, item.y - 20, '护盾挡住!', '#42A5F5', 20);
                } else {
                    // Hit by bomb
                    Sound.bombHit();
                    this.effects.spawnBombExplosion(item.x, item.y);
                    this.effects.startShake(12, 400);
                    this.lives--;
                    this._resetCombo();
                    this.effects.addFloatingText(item.x, item.y - 20, '-1 生命', '#F44336', 24);
                    if (this.lives <= 0) {
                        this._gameOver();
                    }
                }
            } else if (type.id === 'rock') {
                Sound.rockHit();
                this.player.applySlow(type.duration);
                this.effects.triggerSlowFlash();
                this.effects.spawnCatchParticles(item.x, item.y, '#795548', 8);
                this.effects.addFloatingText(item.x, item.y - 20, '减速!', '#795548', 20);
            }
        }
    }

    _updateCombo() {
        let newCombo = 1;
        for (let i = COMBO.thresholds.length - 1; i >= 0; i--) {
            if (this.comboCount >= COMBO.thresholds[i]) {
                newCombo = i + 2;
                break;
            }
        }
        newCombo = Math.min(newCombo, COMBO.maxMultiplier);

        if (newCombo > this.combo) {
            Sound.comboLevel(newCombo);
        }
        this.combo = newCombo;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
    }

    _resetCombo() {
        if (this.comboCount >= 3) {
            Sound.comboBreak();
        }
        this.combo = 0;
        this.comboCount = 0;
    }

    _handleItemMiss(item) {
        const type = item.type;
        if (type.points > 0 || type.powerUp) {
            // Missed a good item
            this.misses++;
            this._resetCombo();
            Sound.miss();
            if (this.misses >= MISSES_TO_LOSE_LIFE) {
                this.misses = 0;
                this.lives--;
                this.effects.addFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, '掉落太多! -1 生命', '#F44336', 22);
                this.effects.startShake(8, 300);
                if (this.lives <= 0) {
                    this._gameOver();
                }
            }
        } else if (type.id === 'bomb') {
            // Bomb hit ground - safe, small explosion
            Sound.bombExplode();
            this.effects.spawnBombExplosion(item.x, GAME_HEIGHT - 30);
        }
    }

    _startLoop() {
        requestAnimationFrame((t) => this._loop(t));
    }

    _loop(timestamp) {
        if (this.lastTime === 0) this.lastTime = timestamp;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = timestamp;

        this._update(dt);
        this._draw();

        requestAnimationFrame((t) => this._loop(t));
    }

    _update(dt) {
        // Update background
        this.bgStars.forEach(s => {
            s.twinkle += s.speed * dt;
        });
        this.bgClouds.forEach(c => {
            c.x += c.speed * dt;
            if (c.x > GAME_WIDTH + c.width) c.x = -c.width;
        });

        if (this.state !== 'playing') return;

        this.elapsed += dt * 1000;

        // Update player
        this.player.update(dt, this.keys, this.useMouseControl ? this.mouseX : null);

        // Global slow timer
        if (this._globalSlow) {
            this._globalSlowTimer -= dt * 1000;
            if (this._globalSlowTimer <= 0) {
                this._globalSlow = false;
            }
        }

        // Spawn items
        const newItems = this.spawner.update(dt, this.elapsed, this.items);
        this.items.push(...newItems);

        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.slowFactor = this._globalSlow ? 0.5 : 1;
            item.update(dt, this.player, this._globalSlow);

            // Check collision with player
            if (item.alive && this._checkCollision(item, this.player)) {
                this._handleItemCatch(item);
            }

            // Check if missed
            if (!item.alive && item.missed) {
                this._handleItemMiss(item);
            }

            // Remove dead items
            if (!item.alive) {
                this.items.splice(i, 1);
            }
        }

        // Update effects
        this.effects.update(dt);
    }

    _drawBg(ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        grad.addColorStop(0, COLORS.bgGradientTop);
        grad.addColorStop(1, COLORS.bgGradientBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Stars
        this.bgStars.forEach(s => {
            const alpha = 0.3 + Math.sin(s.twinkle) * 0.3;
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Clouds
        this.bgClouds.forEach(c => {
            ctx.fillStyle = `rgba(255,255,255,${c.alpha})`;
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Ground line
        const groundY = GAME_HEIGHT - 30;
        const groundGrad = ctx.createLinearGradient(0, groundY - 5, 0, GAME_HEIGHT);
        groundGrad.addColorStop(0, 'rgba(255,143,0,0.1)');
        groundGrad.addColorStop(1, 'rgba(255,143,0,0.02)');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundY - 5, GAME_WIDTH, GAME_HEIGHT - groundY + 5);

        ctx.strokeStyle = 'rgba(255,143,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(GAME_WIDTH, groundY);
        ctx.stroke();
    }

    _draw() {
        const ctx = this.ctx;

        ctx.save();

        // Apply screen shake
        if (this.effects.shakeTimer > 0) {
            ctx.translate(this.effects.shakeOffsetX, this.effects.shakeOffsetY);
        }

        // Background
        this._drawBg(ctx);

        if (this.state === 'playing' || this.state === 'gameover') {
            // Draw items
            for (const item of this.items) {
                item.draw(ctx);
            }

            // Draw player
            this.player.draw(ctx);

            // Draw particles
            this.effects.drawParticles(ctx);

            // Draw floating texts
            this.effects.drawFloatingTexts(ctx);

            // Draw screen effects
            this.effects.drawScreenEffects(ctx);

            // Draw HUD
            this.ui.drawHUD(ctx, this.score, this.lives, this.combo, this.comboCount, this.player, this.elapsed, this.misses);

            // Combo popup
            if (this.combo >= 3) {
                this.ui.drawComboPopup(ctx, this.combo);
            }
        }

        ctx.restore();

        // Overlays (not affected by shake)
        if (this.state === 'menu') {
            this.ui.drawStartOverlay(ctx);
        } else if (this.state === 'gameover') {
            this.ui.drawGameOverOverlay(ctx, this.ui.gameOverStats);
        }
    }
}

// Export start function for index.html
export function startGame() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    new Game(canvas);
}
