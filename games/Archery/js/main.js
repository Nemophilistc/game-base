// main.js - Main game loop and logic
import { CONFIG } from './config.js';
import { SoundManager } from './sound.js';
import { Bow } from './bow.js';
import { TargetManager } from './targets.js';
import { EffectsManager } from './effects.js';
import { UI } from './ui.js';

class ArcheryGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    // Systems
    this.sound = new SoundManager();
    this.bow = new Bow();
    this.targets = new TargetManager();
    this.effects = new EffectsManager();
    this.ui = new UI(this.canvas);

    // Game state
    this.mode = 'CLASSIC';
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.arrowsLeft = 10;
    this.totalArrows = 10;
    this.timeLeft = 60;
    this.shots = 0;
    this.hits = 0;
    this.bullseyes = 0;
    this.balloons = 0;
    this.apples = 0;
    this.level = 1;
    this.targetsHitForLevel = 0;
    this.gameActive = false;
    this.gameOver = false;
    this.wind = { x: 0, y: 0 };
    this.windTimer = 0;
    this._endScheduled = false;
    this.highScore = this._loadHighScore();

    // Timing
    this.lastTime = 0;
    this.running = false;

    // Mouse state
    this.mouseX = 0;
    this.mouseY = 0;

    // Background elements
    this.clouds = this._generateClouds();
    this.trees = this._generateTrees();

    this._setupCallbacks();
    this._setupInput();

    // Start animation loop (for menu)
    this.running = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  _setupCallbacks() {
    this.ui.onStart = (mode) => this.startGame(mode);
    this.ui.onRestart = () => this.startGame(this.mode);
    this.ui.onModeSelect = (mode) => {
      this.mode = mode;
    };
  }

  _setupInput() {
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.gameActive || this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.sound.init();
      this.bow.startAim(this.mouseX, this.mouseY);
      this.sound.playDraw();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      if (this.bow.aiming) {
        this.bow.updateAim(this.mouseX, this.mouseY);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (!this.gameActive || this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      if (this.bow.aiming) {
        this._shootArrow();
      }
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.gameActive || this.gameOver) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouseY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
      this.sound.init();
      this.bow.startAim(this.mouseX, this.mouseY);
      this.sound.playDraw();
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouseY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
      if (this.bow.aiming) {
        this.bow.updateAim(this.mouseX, this.mouseY);
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.gameActive || this.gameOver) return;
      e.preventDefault();
      if (this.bow.aiming) {
        this._shootArrow();
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') {
        const enabled = this.sound.toggle();
        // Visual feedback could be added
      }
    });
  }

  _shootArrow() {
    if (this.mode !== 'TIME_ATTACK' && this.arrowsLeft <= 0) return;

    const arrow = this.bow.release(this.mouseX, this.mouseY, this.wind, this.sound);
    if (!arrow) return;

    this.shots++;
    if (this.mode !== 'TIME_ATTACK') {
      this.arrowsLeft--;
    }

    // Track arrow and check hits
    this._pendingArrow = arrow;
  }

  startGame(mode) {
    this.mode = mode;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.shots = 0;
    this.hits = 0;
    this.bullseyes = 0;
    this.balloons = 0;
    this.apples = 0;
    this.level = 1;
    this.targetsHitForLevel = 0;
    this.gameActive = true;
    this.gameOver = false;
    this._endScheduled = false;
    this._gameOverStats = null;

    const modeConfig = CONFIG.MODES[mode];
    this.arrowsLeft = modeConfig.arrows === Infinity ? 999 : modeConfig.arrows;
    this.totalArrows = this.arrowsLeft;
    this.timeLeft = modeConfig.timeLimit || 0;

    this.targets.setMode(mode);
    this.targets.setLevel(1);
    this.targets.reset();
    this.bow.clearArrows();
    this.effects.clear();
    this._generateWind();

    this.ui.updateScore(0);
    this.ui.displayScore = 0;

    this.sound.init();
  }

  endGame() {
    if (this.gameOver) return;
    this.gameActive = false;
    this.gameOver = true;

    const hitRate = this.shots > 0 ? Math.round((this.hits / this.shots) * 100) : 0;
    const isNewHighScore = this.score > this.highScore[this.mode];

    if (isNewHighScore) {
      this.highScore[this.mode] = this.score;
      this._saveHighScore();
    }

    this.sound.playGameOver();

    this.ui.showGameOver = true;
    this.ui.gameActive = false;
    this._gameOverStats = {
      totalScore: this.score,
      hitRate,
      maxCombo: this.maxCombo,
      hits: this.hits,
      shots: this.shots,
      bullseyes: this.bullseyes,
      balloons: this.balloons,
      apples: this.apples,
      isNewHighScore
    };
  }

  loop(time) {
    if (!this.running) return;

    const dt = this.lastTime ? Math.min(time - this.lastTime, 33) : 16;
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.ui.update();

    if (!this.gameActive || this.gameOver) {
      this.effects.update();
      return;
    }

    // Update timer
    if (this.mode === 'TIME_ATTACK') {
      this.timeLeft -= dt / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.endGame();
        return;
      }
    }

    // Update wind
    this.windTimer += dt;
    if (this.windTimer > CONFIG.WIND_CHANGE_INTERVAL) {
      this._generateWind();
      this.windTimer = 0;
      this.sound.playWindWhoosh();
    }

    // Wind interpolation for smooth changes
    this._updateWind(dt);

    // Set wind for bow trajectory preview
    this.bow.setCurrentWind(this.wind);

    // Update targets
    this.targets.update(dt, this.wind);

    // Update arrows
    this.bow.updateArrows(dt, this.wind);

    // Check hits for all flying arrows (includes _pendingArrow)
    for (const arrow of this.bow.getActiveArrows()) {
      if (arrow.stuck) continue;
      const hits = this.targets.checkHits(arrow);
      for (const { target, hit } of hits) {
        this._onHit(target, hit);
      }
    }
    this._pendingArrow = null;

    // Check if arrow missed (stuck in ground)
    for (const arrow of this.bow.arrows) {
      if (arrow.stuck && arrow.missed && !arrow._missHandled) {
        arrow._missHandled = true;
        this._onMiss();
      }
    }

    // Check end conditions
    if (this.mode !== 'TIME_ATTACK' && !this._endScheduled) {
      const activeArrows = this.bow.getActiveArrows();
      if (this.arrowsLeft <= 0 && activeArrows.length === 0) {
        // Wait for all arrows to land
        const allStuck = this.bow.arrows.every(a => a.stuck || !a.alive);
        if (allStuck) {
          this._endScheduled = true;
          setTimeout(() => {
            if (this.gameActive && !this.gameOver) {
              this.endGame();
            }
          }, 1000);
        }
      }
    }

    // Update effects
    this.effects.update();
    this.effects.updateWindParticlesWithWind(this.wind);

    // Update UI score
    this.ui.updateScore(this.score);
  }

  _onHit(target, hit) {
    this.hits++;

    // Combo tracking
    if (hit.type === 'dummy') {
      // Penalty hit - reset combo
      this.combo = 0;
    } else if (hit.score >= CONFIG.COMBO_BULLSEYE_THRESHOLD || hit.type === 'balloon' || hit.type === 'apple') {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    } else {
      this.combo = 0;
    }

    // Score with combo multiplier
    const multiplier = CONFIG.COMBO_MULTIPLIERS[Math.min(this.combo - 1, CONFIG.COMBO_MULTIPLIERS.length - 1)];
    const finalScore = Math.round(hit.score * multiplier);
    this.score += finalScore;

    // Track specific hits
    if (hit.zone === 0 && (hit.type === 'static' || hit.type === 'moving' || hit.type === 'wind')) {
      this.bullseyes++;
    }
    if (hit.type === 'balloon') this.balloons++;
    if (hit.type === 'apple') this.apples++;

    // Effects
    if (hit.type === 'balloon') {
      this.effects.spawnBalloonPop(target.x, target.y, target.balloonColor);
      this.sound.playBalloonPop();
    } else if (hit.type === 'apple') {
      this.effects.spawnAppleHit(target.x, target.y);
      this.sound.playBullseye();
    } else if (hit.zone === 0) {
      this.effects.spawnBullseyeCelebration(target.x, target.y);
      this.sound.playBullseye();
    } else {
      this.effects.spawnHitEffect(target.x, target.y, hit.zone);
      this.sound.playHitWood();
    }

    // Score text
    const scoreColor = hit.zone === 0 ? '#FFD700' : hit.score > 5 ? '#FF6644' : '#E8D5B0';
    const scoreText = hit.score > 0 ? `+${finalScore}` : `${finalScore}`;
    this.effects.spawnScoreText(target.x, target.y - 30, scoreText, scoreColor, 28);

    // Zone name
    if (hit.type !== 'balloon' && hit.type !== 'apple' && hit.type !== 'dummy') {
      this.effects.spawnScoreText(target.x, target.y - 55, CONFIG.TARGET_ZONE_NAMES[hit.zone], '#BBAA88', 16);
    } else if (hit.type === 'balloon') {
      this.effects.spawnScoreText(target.x, target.y - 30, '气球!', '#FF4488', 22);
    } else if (hit.type === 'apple') {
      this.effects.spawnScoreText(target.x, target.y - 30, '苹果!', '#FF3333', 22);
    }

    // Combo text
    if (this.combo > 1) {
      this.effects.spawnComboText(target.x, target.y - 80, this.combo);
      this.sound.playCombo(this.combo);
    }

    // Level up
    this.targetsHitForLevel++;
    if (this.targetsHitForLevel >= CONFIG.TARGETS_PER_LEVEL) {
      this.level++;
      this.targetsHitForLevel = 0;
      this.targets.setLevel(this.level);
      this.effects.spawnScoreText(600, 300, `第 ${this.level} 级`, '#FFD700', 36);
    }
  }

  _onMiss() {
    if (!this.gameActive) return;
    this.combo = 0;
    this.sound.playMiss();
    this.effects.spawnScoreText(this.mouseX, Math.min(this.mouseY + 20, CONFIG.CANVAS_HEIGHT - 80), '未命中', '#FF4444', 20);
  }

  _generateWind() {
    const strength = Math.random() * CONFIG.WIND_MAX_STRENGTH;
    const angle = Math.random() * Math.PI * 2;
    this._targetWind = {
      x: Math.cos(angle) * strength,
      y: Math.sin(angle) * strength * 0.3
    };
  }

  _updateWind(dt) {
    if (!this._targetWind) return;
    const lerp = 0.02;
    this.wind.x += (this._targetWind.x - this.wind.x) * lerp;
    this.wind.y += (this._targetWind.y - this.wind.y) * lerp;
  }

  render() {
    const ctx = this.ctx;

    // Clear entire canvas each frame to prevent visual accumulation
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.save();

    // Screen shake
    if (this.effects.screenShake > 0) {
      ctx.translate(this.effects.screenShakeX, this.effects.screenShakeY);
    }

    // Background
    this._drawBackground(ctx);

    // Wind particles
    this.effects.drawWindParticles(ctx);

    // Ground
    this._drawGround(ctx);

    // Targets
    this.targets.draw(ctx);

    // Bow and arrows
    this.bow.draw(ctx);

    // Effects
    this.effects.drawParticles(ctx);
    this.effects.drawFloatingTexts(ctx);
    this.effects.drawBullseyeFlash(ctx);

    ctx.restore();

    // UI (not affected by screen shake)
    this.ui.drawHUD(ctx, {
      mode: this.mode,
      timeLeft: this.timeLeft,
      arrowsLeft: this.arrowsLeft,
      totalArrows: this.totalArrows,
      wind: this.wind,
      combo: this.combo,
      highScore: this.highScore[this.mode] || 0,
      challenge: this.targets.getCurrentChallenge(),
      challengeProgress: this.targets.getChallengeProgress(),
      soundEnabled: this.sound.enabled
    });

    // Overlays
    this.ui.drawStartScreen(ctx);
    if (this._gameOverStats) {
      this.ui.drawGameOver(ctx, this._gameOverStats);
    }
  }

  _drawBackground(ctx) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT * 0.7);
    skyGrad.addColorStop(0, '#0a0a1e');
    skyGrad.addColorStop(0.5, '#1a1a3e');
    skyGrad.addColorStop(1, '#2a2a4e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT * 0.7);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5 + 50) % CONFIG.CANVAS_WIDTH;
      const sy = (i * 73.7 + 20) % (CONFIG.CANVAS_HEIGHT * 0.4);
      const size = 0.5 + (i % 3) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon
    ctx.fillStyle = '#FFE8C0';
    ctx.beginPath();
    ctx.arc(1050, 80, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a1e';
    ctx.beginPath();
    ctx.arc(1040, 72, 30, 0, Math.PI * 2);
    ctx.fill();

    // Distant mountains
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.CANVAS_HEIGHT * 0.55);
    for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += 50) {
      const h = Math.sin(x / 200) * 40 + Math.sin(x / 80) * 20;
      ctx.lineTo(x, CONFIG.CANVAS_HEIGHT * 0.55 - h - 20);
    }
    ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT * 0.7);
    ctx.lineTo(0, CONFIG.CANVAS_HEIGHT * 0.7);
    ctx.closePath();
    ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(60, 60, 80, 0.3)';
    for (const cloud of this.clouds) {
      this._drawCloud(ctx, cloud.x, cloud.y, cloud.size);
    }
  }

  _drawGround(ctx) {
    const groundY = CONFIG.CANVAS_HEIGHT - 60;

    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, CONFIG.CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#2a3a1a');
    groundGrad.addColorStop(0.3, '#1f2e12');
    groundGrad.addColorStop(1, '#1a1a0e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, CONFIG.CANVAS_WIDTH, 60);

    // Grass tufts
    ctx.strokeStyle = '#3a5a2a';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 15) {
      const h = 5 + Math.sin(x / 20) * 3;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 3, groundY - h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 5, groundY);
      ctx.lineTo(x + 2, groundY - h + 2);
      ctx.stroke();
    }

    // Shooting line
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CONFIG.BOW_X + 60, groundY);
    ctx.lineTo(CONFIG.BOW_X + 60, groundY + 60);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  _generateClouds() {
    const clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: 30 + Math.random() * 150,
        size: 20 + Math.random() * 30,
        speed: 0.1 + Math.random() * 0.2
      });
    }
    return clouds;
  }

  _generateTrees() {
    const trees = [];
    for (let i = 0; i < 5; i++) {
      trees.push({
        x: 100 + Math.random() * (CONFIG.CANVAS_WIDTH - 200),
        height: 40 + Math.random() * 30
      });
    }
    return trees;
  }

  _loadHighScore() {
    try {
      return JSON.parse(localStorage.getItem('archery_highscores') || '{}');
    } catch {
      return {};
    }
  }

  _saveHighScore() {
    try {
      localStorage.setItem('archery_highscores', JSON.stringify(this.highScore));
    } catch (e) {
      // localStorage not available
    }
  }
}

// Initialize game (prevent multiple instances)
let gameInstance = null;
window.startGame = function () {
  if (gameInstance) return;
  gameInstance = new ArcheryGame();
};
