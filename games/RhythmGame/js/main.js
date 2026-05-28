// main.js - 游戏主循环、事件监听、判定逻辑
import { CONFIG } from './config.js';
import { SoundManager } from './sound.js';
import { Note } from './note.js';
import { ChartGenerator } from './chart.js';
import { EffectsManager } from './effects.js';
import { UIManager } from './ui.js';

class RhythmGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundManager();
    this.chart = new ChartGenerator();
    this.effects = new EffectsManager();
    this.ui = new UIManager();

    // 游戏状态
    this.state = 'menu'; // 'menu', 'playing', 'gameover'
    this.difficulty = null;
    this.notes = [];
    this.activeNotes = [];
    this.pressedKeys = new Set();
    this.keyJustPressed = new Set();

    // 时间
    this.gameTime = 0;       // 游戏内时间 (ms)
    this.lastFrameTime = 0;
    this.totalDuration = 0;  // 总时长

    // 轨道布局
    this.laneWidth = 0;
    this.lanePositions = [];

    // 判定统计
    this.stats = {
      perfects: 0,
      greats: 0,
      goods: 0,
      misses: 0,
      totalJudged: 0,
    };

    // hold状态追踪
    this.holdStates = [null, null, null, null];

    this._resize();
    this._bindEvents();
    this._loop(0);
  }

  _resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = Math.min(container.clientWidth, 600);
    this.canvas.height = container.clientHeight;

    this.laneWidth = this.canvas.width / CONFIG.LANE_COUNT;
    this.lanePositions = [];
    for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
      this.lanePositions.push(this.laneWidth * i + this.laneWidth / 2);
    }
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      // 阻止游戏按键触发浏览器默认行为（如书签、地址栏等）
      if (CONFIG.KEYS.includes(key)) {
        e.preventDefault();
      }

      // 菜单状态
      if (this.state === 'menu') {
        if (key === '1') this._startGame('easy');
        else if (key === '2') this._startGame('hard');
        else if (key === '3') this._startGame('hell');
        this.sound.playMenuSfx();
        return;
      }

      // 游戏结束状态
      if (this.state === 'gameover') {
        if (key === 'r') this._startGame(this.difficulty);
        else if (key === 'escape') this._showMenu();
        return;
      }

      // 游戏中
      if (this.state === 'playing') {
        if (CONFIG.KEYS.includes(key)) {
          this.pressedKeys.add(key);
          this.keyJustPressed.add(key);
          this._judgeLane(CONFIG.KEYS.indexOf(key));
          e.preventDefault();
        }
        if (key === 'escape') {
          this._endGame();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.pressedKeys.delete(key);

      // hold音符松开检测
      if (this.state === 'playing' && CONFIG.KEYS.includes(key)) {
        const lane = CONFIG.KEYS.indexOf(key);
        this._releaseHold(lane);
      }
    });

    // 触摸支持
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.sound.init();
      this.sound.resume();

      if (this.state === 'menu') {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const y = touch.clientY - rect.top;
        const h = this.canvas.height;
        if (y > h * 0.45 && y < h * 0.45 + 80) this._startGame('easy');
        else if (y > h * 0.45 + 100 && y < h * 0.45 + 180) this._startGame('hard');
        else if (y > h * 0.45 + 200 && y < h * 0.45 + 280) this._startGame('hell');
        return;
      }

      if (this.state === 'gameover') {
        this._showMenu();
        return;
      }

      for (const touch of e.changedTouches) {
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const lane = Math.floor(x / this.laneWidth);
        if (lane >= 0 && lane < CONFIG.LANE_COUNT) {
          this.pressedKeys.add(CONFIG.KEYS[lane]);
          this.keyJustPressed.add(CONFIG.KEYS[lane]);
          this._judgeLane(lane);
        }
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const lane = Math.floor(x / this.laneWidth);
        if (lane >= 0 && lane < CONFIG.LANE_COUNT) {
          this.pressedKeys.delete(CONFIG.KEYS[lane]);
          this._releaseHold(lane);
        }
      }
    });
  }

  _showMenu() {
    this.state = 'menu';
    this.sound.stopBGM();
  }

  _startGame(diffKey) {
    this.sound.init();
    this.sound.resume();
    this.difficulty = diffKey;
    this.state = 'playing';

    // 重置
    this.gameTime = -2000; // 2秒延迟
    this.pressedKeys.clear();
    this.keyJustPressed.clear();
    this.holdStates = [null, null, null, null];
    this.stats = { perfects: 0, greats: 0, goods: 0, misses: 0, totalJudged: 0 };

    // 生成谱面
    this.notes = this.chart.generate(diffKey);
    this.activeNotes = [...this.notes];

    // 计算总时长
    const lastNote = this.notes[this.notes.length - 1];
    this.totalDuration = lastNote ? lastNote.time + lastNote.duration + 3000 : 10000;

    // 重置UI
    this.ui.reset();

    // 开始BGM
    const bpm = CONFIG.DIFFICULTY[diffKey].bpm;
    this.sound.startBGM(bpm);
  }

  _endGame() {
    this.state = 'gameover';
    this.sound.stopBGM();

    // 计算统计
    const totalNotes = this.stats.totalJudged;
    const accuracy = totalNotes > 0
      ? ((this.stats.perfects * 100 + this.stats.greats * 75 + this.stats.goods * 50) / (totalNotes * 100)) * 100
      : 0;

    const oldHighScore = this.ui.highScore;
    this.ui.saveHighScore();

    this._gameOverStats = {
      score: this.ui.score,
      maxCombo: this.ui.maxCombo,
      accuracy: accuracy,
      perfects: this.stats.perfects,
      greats: this.stats.greats,
      goods: this.stats.goods,
      misses: this.stats.misses,
      isNewHighScore: this.ui.score > oldHighScore,
    };
  }

  _judgeLane(lane) {
    const currentTime = this.gameTime;

    // 找到该轨道最近的未判定音符
    let closestNote = null;
    let closestDiff = Infinity;

    for (const note of this.activeNotes) {
      if (note.lane !== lane || note.judged || !note.active) continue;
      const diff = Math.abs(currentTime - note.time);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestNote = note;
      }
    }

    if (!closestNote) return;

    // 检查判定窗口
    const diff = Math.abs(currentTime - closestNote.time);
    let judgeType = null;

    if (diff <= CONFIG.TIMING.PERFECT) {
      judgeType = 'PERFECT';
    } else if (diff <= CONFIG.TIMING.GREAT) {
      judgeType = 'GREAT';
    } else if (diff <= CONFIG.TIMING.GOOD) {
      judgeType = 'GOOD';
    }

    if (!judgeType) return; // 太早，不判定

    // 处理hold音符
    if (closestNote.type === 'hold') {
      closestNote.judge(judgeType);
      closestNote.holdActive = true;
      this.holdStates[lane] = closestNote;
      // hold的miss需要在release时判断
    } else if (closestNote.type === 'slide') {
      // slide音符：检测滑动方向
      closestNote.judge(judgeType);
      closestNote.slideTriggered = true;
    } else {
      closestNote.judge(judgeType);
    }

    // 更新UI和统计
    this._applyJudgment(judgeType, lane);
  }

  _releaseHold(lane) {
    const holdNote = this.holdStates[lane];
    if (!holdNote) return;

    const currentTime = this.gameTime;
    const endTime = holdNote.time + holdNote.duration;
    const diff = Math.abs(currentTime - endTime);

    // 判定hold尾部
    let judgeType;
    if (diff <= CONFIG.TIMING.PERFECT) {
      judgeType = 'PERFECT';
      this.stats.perfects++;
    } else if (diff <= CONFIG.TIMING.GREAT) {
      judgeType = 'GREAT';
      this.stats.greats++;
    } else if (diff <= CONFIG.TIMING.GOOD) {
      judgeType = 'GOOD';
      this.stats.goods++;
    } else {
      judgeType = 'MISS';
      this.stats.misses++;
    }

    holdNote.holdComplete = true;
    holdNote.holdActive = false;
    this.stats.totalJudged++;
    this.holdStates[lane] = null;

    // 只有提前松开才算miss
    if (currentTime < endTime - CONFIG.TIMING.GOOD) {
      this._applyJudgment('MISS', lane);
    }
  }

  _applyJudgment(judgeType, lane) {
    this.stats.totalJudged++;
    if (judgeType === 'PERFECT') this.stats.perfects++;
    else if (judgeType === 'GREAT') this.stats.greats++;
    else if (judgeType === 'GOOD') this.stats.goods++;
    else if (judgeType === 'MISS') this.stats.misses++;

    const result = this.ui.addJudgment(judgeType);
    const lx = this.lanePositions[lane];
    const judgeY = this.canvas.height * CONFIG.JUDGMENT_LINE_RATIO;

    // 特效
    this.effects.spawnJudgeFlash(lx, judgeY, judgeType);
    if (judgeType === 'PERFECT') {
      this.effects.spawnPerfectText(lx, judgeY);
    }

    // 连击特效
    if (result.combo > 0 && result.combo % 10 === 0) {
      this.effects.spawnComboEffect(result.combo, this.canvas.width / 2, judgeY);
      this.sound.playComboSfx(result.combo);
    }

    // 判定音效
    this.sound.playJudgeSfx(judgeType);
  }

  _update(dt) {
    if (this.state !== 'playing') return;

    // 更新游戏时间
    this.gameTime += dt * 1000;

    // 节拍脉冲
    const bpm = CONFIG.DIFFICULTY[this.difficulty].bpm;
    const beatDuration = 60000 / bpm;
    if (Math.floor(this.gameTime / beatDuration) !== Math.floor((this.gameTime - dt * 1000) / beatDuration)) {
      this.effects.triggerBeatPulse();
    }

    // 判定线位置
    const judgmentY = this.canvas.height * CONFIG.JUDGMENT_LINE_RATIO;
    const noteSpeed = CONFIG.DIFFICULTY[this.difficulty].speed;

    // 更新音符
    for (const note of this.activeNotes) {
      if (!note.active) continue;

      const result = note.update(this.gameTime, judgmentY, noteSpeed);
      if (result === 'MISS' && !note.judged) {
        note.judge('MISS');
        this._applyJudgment('MISS', note.lane);
      }
    }

    // 移除不活跃音符
    this.activeNotes = this.activeNotes.filter(n => n.active);

    // 更新hold状态（按住中）
    for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
      const holdNote = this.holdStates[i];
      if (holdNote && holdNote.holdActive) {
        // 检查是否松开
        if (!this.pressedKeys.has(CONFIG.KEYS[i])) {
          this._releaseHold(i);
        }
      }
    }

    // 进度
    this.ui.progress = Math.max(0, this.gameTime / this.totalDuration);

    // 检查游戏结束
    if (this.gameTime > this.totalDuration || (this.activeNotes.length === 0 && this.gameTime > 0)) {
      this._endGame();
    }

    // 更新特效
    this.effects.update(dt);
    this.ui.update(dt);
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 清空
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    if (this.state === 'menu') {
      this.ui.drawStartScreen(ctx, w, h);
      return;
    }

    // 屏幕震动
    const shake = this.effects.getScreenShake();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 背景特效
    this.effects.drawBackground(ctx, w, h);

    // 绘制轨道背景
    this._drawLanes(ctx, w, h);

    // 判定线
    this.ui.drawJudgmentLine(ctx, w, h, this.laneWidth);

    // 绘制音符
    const noteSpeed = this.difficulty ? CONFIG.DIFFICULTY[this.difficulty].speed : 300;
    const judgmentY = h * CONFIG.JUDGMENT_LINE_RATIO;
    for (const note of this.activeNotes) {
      if (note.active || note.judged) {
        note.draw(ctx, this.laneWidth * note.lane, this.laneWidth);
      }
    }

    // 按键提示
    this.ui.drawKeyHints(ctx, w, h, this.lanePositions, this.pressedKeys);

    // 粒子特效
    this.effects.drawParticles(ctx);
    this.effects.drawFlashes(ctx);
    this.effects.drawComboTexts(ctx);

    ctx.restore();

    // HUD
    this.ui.drawHUD(ctx, w, h);

    // 游戏结束画面
    if (this.state === 'gameover' && this._gameOverStats) {
      this.ui.drawGameOver(ctx, w, h, this._gameOverStats);
    }
  }

  _drawLanes(ctx, w, h) {
    for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
      const lx = this.laneWidth * i;

      // 轨道背景
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)';
      ctx.fillRect(lx, 0, this.laneWidth, h);

      // 轨道线
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, h);
      ctx.stroke();

      // 按下时轨道高亮
      if (this.pressedKeys.has(CONFIG.KEYS[i])) {
        const judgeY = h * CONFIG.JUDGMENT_LINE_RATIO;
        const grad = ctx.createLinearGradient(0, judgeY - 100, 0, judgeY + 50);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, CONFIG.LANE_COLORS[i] + '22');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(lx, judgeY - 100, this.laneWidth, 150);
      }
    }

    // 最后一条轨道线
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w, h);
    ctx.stroke();
  }

  _loop(timestamp) {
    const dt = this.lastFrameTime ? Math.min((timestamp - this.lastFrameTime) / 1000, 0.05) : 0.016;
    this.lastFrameTime = timestamp;

    this._update(dt);
    this._draw();

    // 清除一次性按键状态
    this.keyJustPressed.clear();

    requestAnimationFrame((t) => this._loop(t));
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  new RhythmGame();
});
