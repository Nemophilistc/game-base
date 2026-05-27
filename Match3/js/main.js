// ============================================================
// main.js - 游戏主循环、事件监听、状态机
// ============================================================

import { GRID_ROWS, GRID_COLS, CELL_SIZE, LEVELS, SPECIAL, CHAIN_DELAY } from './config.js';
import { Board } from './board.js';
import { EffectsManager } from './effects.js';
import { UI } from './ui.js';
import { Sound } from './sound.js';

// --- 游戏状态 ---
const STATE = {
  MENU:          'menu',
  IDLE:          'idle',        // 等待玩家操作
  SWAPPING:      'swapping',    // 交换动画中
  CHECKING:      'checking',    // 匹配检测中
  DESTROYING:    'destroying',  // 消除动画中
  FALLING:       'falling',     // 下落动画中
  LEVEL_COMPLETE:'levelComplete',
  GAME_OVER:     'gameOver',
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.board = null;
    this.effects = new EffectsManager();
    this.ui = new UI(this.canvas);

    // 游戏数据
    this.state = STATE.MENU;
    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.targetScore = 0;
    this.targetClear = 0;
    this.clearCount = 0;
    this.levelConfig = null;

    // 选择
    this.selected = null;       // { row, col }
    this.swapFrom = null;
    this.swapTo = null;

    // 动画计时器
    this.animTimer = 0;
    this.animDuration = 0;
    this.animCallback = null;

    // 连锁
    this.chainLevel = 0;
    this.chainQueue = [];

    // 触摸
    this.touchStart = null;

    // 布局
    this._resize();
    this._bindEvents();
    this._loop();
  }

  // --- 调整画布大小 ---
  _resize() {
    const boardW = GRID_COLS * CELL_SIZE + 40;
    const boardH = GRID_ROWS * CELL_SIZE + 140;
    // 适配屏幕
    const maxW = Math.min(window.innerWidth, 600);
    const maxH = window.innerHeight;
    const scale = Math.min(maxW / boardW, maxH / boardH, 1.5);
    this.canvas.width = boardW;
    this.canvas.height = boardH;
    this.canvas.style.width = `${boardW * scale}px`;
    this.canvas.style.height = `${boardH * scale}px`;
    this.scale = scale;
  }

  // --- 事件绑定 ---
  _bindEvents() {
    // 鼠标点击
    this.canvas.addEventListener('click', (e) => this._handleClick(e));
    // 触摸
    this.canvas.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this._handleTouchEnd(e), { passive: false });
    // 窗口大小变化
    window.addEventListener('resize', () => this._resize());
  }

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  _handleClick(e) {
    const { x, y } = this._getPos(e);

    if (this.state === STATE.MENU) {
      if (this.ui.isMenuButtonClick(x, y)) {
        Sound.click();
        this._startLevel(1);
      }
      return;
    }

    if (this.state === STATE.LEVEL_COMPLETE) {
      Sound.click();
      this._nextLevel();
      return;
    }

    if (this.state === STATE.GAME_OVER) {
      Sound.click();
      this.state = STATE.MENU;
      return;
    }

    if (this.state !== STATE.IDLE) return;

    const cell = this.ui.pixelToCell(x, y);
    if (!cell) return;

    Sound.click();
    this._selectOrSwap(cell.row, cell.col);
  }

  _handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const { x, y } = this._getPos(e.touches[0]);
    this.touchStart = { x, y, time: Date.now() };
  }

  _handleTouchEnd(e) {
    e.preventDefault();
    if (!this.touchStart) return;
    const { x, y } = this._getPos(e.changedTouches[0]);
    const dx = x - this.touchStart.x;
    const dy = y - this.touchStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - this.touchStart.time;

    // 视为滑动
    if (dist > 20 && elapsed < 500 && this.state === STATE.IDLE) {
      const cell = this.ui.pixelToCell(this.touchStart.x, this.touchStart.y);
      if (cell) {
        let dr = 0, dc = 0;
        if (Math.abs(dx) > Math.abs(dy)) {
          dc = dx > 0 ? 1 : -1;
        } else {
          dr = dy > 0 ? 1 : -1;
        }
        const tr = cell.row + dr;
        const tc = cell.col + dc;
        if (tr >= 0 && tr < GRID_ROWS && tc >= 0 && tc < GRID_COLS) {
          this.selected = { row: cell.row, col: cell.col };
          this._trySwap(cell.row, cell.col, tr, tc);
        }
      }
      this.touchStart = null;
      return;
    }

    // 视为点击
    this.touchStart = null;
    this._handleClick({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
  }

  // --- 选择/交换逻辑 ---
  _selectOrSwap(row, col) {
    if (this.selected) {
      const { row: sr, col: sc } = this.selected;
      if (sr === row && sc === col) {
        // 取消选择
        this.selected = null;
        this.ui.selectedGem = null;
        return;
      }
      if (this.board.isAdjacent(sr, sc, row, col)) {
        this._trySwap(sr, sc, row, col);
      } else {
        // 重新选择
        this.selected = { row, col };
        this.ui.selectedGem = { row, col };
      }
    } else {
      this.selected = { row, col };
      this.ui.selectedGem = { row, col };
    }
  }

  _trySwap(r1, c1, r2, c2) {
    this.selected = null;
    this.ui.selectedGem = null;

    // 检查彩虹宝石交互
    const gem1 = this.board.getGem(r1, c1);
    const gem2 = this.board.getGem(r2, c2);

    this.state = STATE.SWAPPING;
    this.swapFrom = { row: r1, col: c1 };
    this.swapTo = { row: r2, col: c2 };

    Sound.swap();

    // 执行交换
    this.board.swap(r1, c1, r2, c2);
    this.moves--;

    // 彩虹宝石特殊处理
    if (gem1 && gem1.special === SPECIAL.RAINBOW) {
      const targetType = gem2 ? gem2.type : 0;
      this._startAnim(250, () => {
        const result = this.board.activateRainbowAt(r2, c2, targetType);
        this._processClearResult(result);
      });
      return;
    }
    if (gem2 && gem2.special === SPECIAL.RAINBOW) {
      const targetType = gem1 ? gem1.type : 0;
      this._startAnim(250, () => {
        const result = this.board.activateRainbowAt(r1, c1, targetType);
        this._processClearResult(result);
      });
      return;
    }

    // 检查匹配
    this._startAnim(250, () => {
      const matches = this.board.findAllMatches();
      if (matches.length === 0) {
        // 无匹配，交换回来
        Sound.fail();
        this.board.swap(r1, c1, r2, c2);
        this.moves++; // 恢复步数
        this.state = STATE.IDLE;
      } else {
        this.chainLevel = 0;
        this.board.resetChain();
        this._processMatches(matches);
      }
    });
  }

  // --- 处理匹配结果 ---
  _processMatches(matches) {
    this.state = STATE.CHECKING;

    // 放置上一轮的特殊宝石
    this.board.placeSpecials();

    this.board.chainLevel = this.chainLevel;
    const result = this.board.clearMatches(matches);
    this._processClearResult(result);
  }

  _processClearResult(result) {
    const { cleared, totalScore, multiplier, totalCleared } = result;

    this.score += totalScore;
    if (this.levelConfig && this.levelConfig.type === 'clear') {
      this.clearCount += totalCleared;
    }

    // 特效
    for (const cell of cleared) {
      const { x, y } = this.ui.cellToPixel(cell.r, cell.c);
      const color = cell.color || '#fff';
      this.effects.spawnDestroyEffect(x, y, color);
      if (totalCleared > 5) {
        this.effects.spawnPulse(x, y, color);
      }
    }

    // 分数飞字
    if (cleared.length > 0) {
      const mid = cleared[Math.floor(cleared.length / 2)];
      const { x, y } = this.ui.cellToPixel(mid.r, mid.c);
      this.ui.addScorePopup(x, y, totalScore, multiplier);
    }

    if (this.chainLevel > 0) {
      Sound.chain(this.chainLevel);
      this.ui.triggerShake(2 + this.chainLevel);
    } else {
      Sound.match(this.chainLevel);
    }

    if (totalCleared >= 5) {
      Sound.special();
    }

    // 消除动画后下落
    this.state = STATE.DESTROYING;
    this._startAnim(300, () => {
      this._doGravity();
    });
  }

  // --- 重力下落 ---
  _doGravity() {
    this.state = STATE.FALLING;
    const drops = this.board.applyGravity();
    const newGems = this.board.fillEmpty();

    this._startAnim(250, () => {
      // 检查新匹配
      this.chainLevel++;
      this.board.incrementChain();
      const newMatches = this.board.findAllMatches();
      if (newMatches.length > 0) {
        setTimeout(() => this._processMatches(newMatches), CHAIN_DELAY);
      } else {
        this._endTurn();
      }
    });
  }

  // --- 回合结束 ---
  _endTurn() {
    this.chainLevel = 0;
    this.board.resetChain();

    // 检查胜负
    if (this._checkWin()) {
      this.state = STATE.LEVEL_COMPLETE;
      Sound.levelComplete();
      return;
    }

    if (this.moves <= 0) {
      this.state = STATE.GAME_OVER;
      Sound.gameOver();
      return;
    }

    // 检查是否还有可用移动
    if (!this.board.hasValidMoves()) {
      // 打乱棋盘
      this.board.init();
      this.board.resetChain();
    }

    this.state = STATE.IDLE;
  }

  _checkWin() {
    const cfg = this.levelConfig;
    if (!cfg) return false;
    if (cfg.type === 'score') return this.score >= cfg.target;
    if (cfg.type === 'clear') return this.clearCount >= cfg.target;
    return false;
  }

  // --- 关卡管理 ---
  _startLevel(lv) {
    this.level = lv;
    this.levelConfig = LEVELS[lv - 1];
    this.board = new Board(this.levelConfig.colors);
    this.board.init();
    this.score = 0;
    this.moves = this.levelConfig.moves;
    this.clearCount = 0;
    this.chainLevel = 0;
    this.selected = null;
    this.ui.selectedGem = null;
    this.ui.scorePopups = [];
    this.effects.clear();
    this.state = STATE.IDLE;
  }

  _nextLevel() {
    if (this.level < 50) {
      this._startLevel(this.level + 1);
    } else {
      // 通关
      this.state = STATE.MENU;
    }
  }

  // --- 动画计时 ---
  _startAnim(duration, callback) {
    this.animTimer = 0;
    this.animDuration = duration;
    this.animCallback = callback;
  }

  // --- 主循环 ---
  _loop() {
    const now = Date.now();

    // 动画更新
    if (this.animCallback) {
      this.animTimer += 16; // ~60fps
      if (this.animTimer >= this.animDuration) {
        const cb = this.animCallback;
        this.animCallback = null;
        cb();
      }
    }

    // 特效更新
    this.effects.update();

    // 绘制
    this.ui.draw(
      this.board,
      this.effects,
      this.score,
      this.moves,
      this.level,
      this.chainLevel,
      this.state,
      this.levelConfig,
      this.clearCount,
    );

    requestAnimationFrame(() => this._loop());
  }
}

// --- 启动 ---
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
