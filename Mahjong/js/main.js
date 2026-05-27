// main.js - Game loop, rendering, and main logic

import { TILE_W, TILE_H, COLORS, HINTS_MAX, SHUFFLES_MAX } from './config.js';
import { Sound } from './sound.js';
import { generateGrid, findPath, findHintPair, shuffleTiles, hasValidMoves, CAT_COLORS } from './tiles.js';
import { EffectManager } from './effects.js';
import { UI } from './ui.js';

class MahjongGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.effects = new EffectManager();
    this.ui = new UI(this.canvas);

    this.state = 'menu';
    this.tiles = [];
    this.gridCols = 0;
    this.gridRows = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.selectedTile = null;
    this.hintPair = null;
    this.hintPath = null;
    this.hintsLeft = HINTS_MAX;
    this.shufflesLeft = SHUFFLES_MAX;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.elapsed = 0;
    this.pairsLeft = 0;
    this.tileScale = 1;
    this.lastTime = 0;
    this.needCheckMoves = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.ui.onHint = () => this._doHint();
    this.ui.onShuffle = () => {
      if (this.state !== 'playing' || this.shufflesLeft <= 0) return;
      this.shufflesLeft--;
      this._doShuffle();
    };

    this._raf = this._raf.bind(this);
    requestAnimationFrame(this._raf);
    this.ui.showStartOverlay((layout, diff) => this.startGame(layout, diff));
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.screenW = this.canvas.clientWidth;
    this.screenH = this.canvas.clientHeight;
    this._recalcLayout();
  }

  _recalcLayout() {
    if (this.gridCols === 0) return;
    const padX = 40, padY = 70;
    const maxW = this.screenW - padX;
    const maxH = this.screenH - padY;
    const scaleW = maxW / (this.gridCols * TILE_W);
    const scaleH = maxH / (this.gridRows * TILE_H);
    this.tileScale = Math.min(scaleW, scaleH, 1.3);
    const totalW = this.gridCols * TILE_W * this.tileScale;
    const totalH = this.gridRows * TILE_H * this.tileScale;
    this.offsetX = (this.screenW - totalW) / 2;
    this.offsetY = (this.screenH - totalH) / 2 + 25;
  }

  startGame(layoutName, diffName) {
    const result = generateGrid(layoutName, diffName);
    this.tiles = result.tiles;
    this.gridCols = result.cols;
    this.gridRows = result.rows;
    this.selectedTile = null;
    this.hintPair = null;
    this.hintPath = null;
    this.hintsLeft = HINTS_MAX;
    this.shufflesLeft = SHUFFLES_MAX;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.elapsed = 0;
    this.pairsLeft = this.tiles.length / 2;
    this.state = 'playing';
    this.effects = new EffectManager();
    this._recalcLayout();

    // Ensure initial solvability
    if (!hasValidMoves(this.tiles, this.gridCols, this.gridRows)) {
      this._doShuffle();
    }
  }

  _onClick(e) {
    if (this.state !== 'playing') return;

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - this.offsetX;
    const my = e.clientY - rect.top - this.offsetY;
    const tw = TILE_W * this.tileScale;
    const th = TILE_H * this.tileScale;

    // Find clicked tile (topmost - highest index at same cell)
    let clicked = null;
    for (let i = this.tiles.length - 1; i >= 0; i--) {
      const t = this.tiles[i];
      if (t.removed || t.removing) continue;
      const tx = t.c * tw;
      const ty = t.r * th;
      if (mx >= tx && mx < tx + tw && my >= ty && my < ty + th) {
        clicked = t;
        break;
      }
    }

    if (!clicked) return;

    if (!this.selectedTile) {
      clicked.selected = true;
      this.selectedTile = clicked;
      Sound.select();
    } else if (this.selectedTile.id === clicked.id) {
      clicked.selected = false;
      this.selectedTile = null;
    } else {
      const path = findPath(this.selectedTile, clicked, this.tiles, this.gridCols, this.gridRows);
      if (path) {
        this._matchTiles(this.selectedTile, clicked, path);
      } else {
        Sound.invalid();
        this.effects.triggerShake(4);
        this.combo = 0;
        this.selectedTile.selected = false;
        clicked.selected = true;
        this.selectedTile = clicked;
      }
    }
  }

  _matchTiles(t1, t2, path) {
    t1.selected = false;
    t2.selected = false;
    t1.removing = true;
    t2.removing = true;
    t1.removeTime = 0.35;
    t2.removeTime = 0.35;
    this.selectedTile = null;
    this.hintPair = null;
    this.hintPath = null;

    const tw = TILE_W * this.tileScale;
    const th = TILE_H * this.tileScale;
    this.effects.showPath(path, tw, th, this.offsetX, this.offsetY);

    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    const baseScore = 100;
    const comboBonus = Math.min(this.combo - 1, 10) * 25;
    const timeBonus = Math.max(0, Math.floor((300 - this.elapsed) / 3));
    const gained = baseScore + comboBonus + timeBonus;
    this.score += gained;

    const cx1 = this.offsetX + t1.c * tw + tw / 2;
    const cy1 = this.offsetY + t1.r * th + th / 2;
    const cx2 = this.offsetX + t2.c * tw + tw / 2;
    const cy2 = this.offsetY + t2.r * th + th / 2;
    const color = CAT_COLORS[t1.def.cat] || COLORS.gold;
    this.effects.emitMatchParticles(cx1, cy1, color);
    this.effects.emitMatchParticles(cx2, cy2, color);
    this.effects.addFloatingText((cx1 + cx2) / 2, Math.min(cy1, cy2) - 15, `+${gained}`, COLORS.gold, 20);
    if (this.combo > 1) {
      this.effects.addFloatingText((cx1 + cx2) / 2, Math.min(cy1, cy2) - 42, `${this.combo}连击!`, '#ff6b6b', 16);
    }

    Sound.match();
    this.pairsLeft--;
  }

  _doShuffle() {
    shuffleTiles(this.tiles);
    this.effects.startShuffleAnim();
    Sound.shuffle();
    if (this.selectedTile) {
      this.selectedTile.selected = false;
      this.selectedTile = null;
    }
    this.hintPair = null;
    this.hintPath = null;
    this.needCheckMoves = true;
  }

  _doHint() {
    if (this.hintsLeft <= 0) return;
    const hint = findHintPair(this.tiles, this.gridCols, this.gridRows);
    if (hint) {
      this.hintsLeft--;
      this.hintPair = [hint.t1, hint.t2];
      this.hintPath = hint.path;
      hint.t1.hinted = true;
      hint.t2.hinted = true;
      Sound.hint();
      setTimeout(() => {
        if (this.hintPair) {
          this.hintPair[0].hinted = false;
          this.hintPair[1].hinted = false;
          this.hintPair = null;
          this.hintPath = null;
        }
      }, 2500);
    }
  }

  _raf(now) {
    requestAnimationFrame(this._raf);
    if (this.lastTime === 0) this.lastTime = now;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state === 'playing') {
      this.elapsed += dt;
      this._update(dt);
    }
    this._draw();
  }

  _update(dt) {
    this.effects.update(dt);

    for (const t of this.tiles) {
      if (t.removing) {
        t.removeTime -= dt;
        t.animAlpha = Math.max(0, t.removeTime / 0.35);
        t.animScale = 1 + (1 - t.animAlpha) * 0.25;
        if (t.removeTime <= 0) {
          t.removed = true;
          t.removing = false;
          t.animAlpha = 0;
          this.needCheckMoves = true;
        }
      }
    }

    this.ui.updateHUD(this.score, this.elapsed, this.hintsLeft, this.shufflesLeft, this.pairsLeft, this.combo);

    // Check win
    const allGone = this.tiles.every(t => t.removed || t.removing);
    if (this.pairsLeft <= 0 && allGone) {
      this.state = 'win';
      Sound.complete();
      this._saveHighScore();
      setTimeout(() => this.ui.showWinOverlay(this.score, this.elapsed, this.maxCombo), 600);
      return;
    }

    // Check no moves (only after tile state changes)
    if (this.needCheckMoves) {
      this.needCheckMoves = false;
      const active = this.tiles.filter(t => !t.removed && !t.removing);
      if (active.length > 0 && !hasValidMoves(this.tiles, this.gridCols, this.gridRows)) {
        if (this.shufflesLeft > 0) {
          this.shufflesLeft--;
          this._doShuffle();
        } else {
          this.state = 'gameover';
          Sound.gameOver();
          this._saveHighScore();
          setTimeout(() => this.ui.showGameOverOverlay(this.score, '没有可消除的牌了'), 600);
        }
      }
    }
  }

  _saveHighScore() {
    const key = 'mahjong_high_score';
    const prev = parseInt(localStorage.getItem(key) || '0');
    if (this.score > prev) localStorage.setItem(key, this.score);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, this.screenW, this.screenH);

    // Subtle background pattern
    ctx.save();
    ctx.globalAlpha = 0.025;
    ctx.fillStyle = COLORS.gold;
    for (let i = 0; i < this.screenW; i += 50) {
      for (let j = 0; j < this.screenH; j += 50) {
        if ((i + j) % 100 === 0) ctx.fillRect(i, j, 25, 25);
      }
    }
    ctx.restore();

    if (this.state === 'menu') return;

    ctx.save();
    if (this.effects.shakeAmount > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.effects.shakeAmount * 2,
        (Math.random() - 0.5) * this.effects.shakeAmount * 2
      );
    }

    const tw = TILE_W * this.tileScale;
    const th = TILE_H * this.tileScale;
    const shuffleOff = this.effects.getShuffleOffset();

    for (const t of this.tiles) {
      if (t.removed) continue;
      if (t.removing && t.animAlpha <= 0) continue;
      this._drawTile(ctx, t, tw, th, shuffleOff);
    }

    // Draw hint path directly (not through effects, to avoid stacking)
    if (this.hintPath && this.hintPath.length >= 2) {
      ctx.save();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 12;
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -performance.now() / 50;
      ctx.beginPath();
      const hp = this.hintPath;
      ctx.moveTo(this.offsetX + hp[0].c * tw + tw / 2, this.offsetY + hp[0].r * th + th / 2);
      for (let i = 1; i < hp.length; i++) {
        ctx.lineTo(this.offsetX + hp[i].c * tw + tw / 2, this.offsetY + hp[i].r * th + th / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore();
    this.effects.draw(ctx);
  }

  _drawTile(ctx, tile, tw, th, shuffleOff) {
    const x = this.offsetX + tile.c * tw + shuffleOff;
    const y = this.offsetY + tile.r * th + shuffleOff;

    ctx.save();

    if (tile.removing) {
      ctx.globalAlpha = tile.animAlpha;
      const cx = x + tw / 2, cy = y + th / 2;
      ctx.translate(cx, cy);
      ctx.scale(tile.animScale, tile.animScale);
      ctx.translate(-cx, -cy);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    this._roundRect(ctx, x + 2, y + 3, tw - 2, th - 2, 5);
    ctx.fill();

    // Face gradient
    const grad = ctx.createLinearGradient(x, y, x, y + th);
    if (tile.selected) {
      grad.addColorStop(0, '#fff8e0');
      grad.addColorStop(1, '#ffe080');
    } else if (tile.hinted) {
      grad.addColorStop(0, '#e0f0ff');
      grad.addColorStop(1, '#a0d0ff');
    } else {
      grad.addColorStop(0, '#f5eed8');
      grad.addColorStop(1, '#d8ccaa');
    }
    ctx.fillStyle = grad;
    this._roundRect(ctx, x + 1, y + 1, tw - 3, th - 3, 5);
    ctx.fill();

    // Top highlight
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#fff';
    this._roundRect(ctx, x + 2, y + 2, tw - 5, th * 0.15, 3);
    ctx.fill();
    ctx.restore();

    // Border
    const borderColor = tile.selected ? COLORS.selected : tile.hinted ? '#60a5fa' : '#a09070';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = tile.selected ? 2.5 : 1.5;
    this._roundRect(ctx, x + 1, y + 1, tw - 3, th - 3, 5);
    ctx.stroke();

    // Glow
    if (tile.selected || tile.hinted) {
      ctx.save();
      ctx.shadowColor = tile.selected ? COLORS.selected : '#60a5fa';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = tile.selected ? COLORS.selected : '#60a5fa';
      ctx.lineWidth = 2;
      this._roundRect(ctx, x, y, tw, th, 6);
      ctx.stroke();
      ctx.restore();
    }

    // Category color wash
    const catColor = CAT_COLORS[tile.def.cat] || '#555';
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = catColor;
    this._roundRect(ctx, x + 3, y + 3, tw - 7, th - 7, 4);
    ctx.fill();
    ctx.restore();

    // Text rendering
    const def = tile.def;
    const isWind = def.cat === '风' || def.cat === '箭';

    // Category label (top)
    ctx.fillStyle = catColor;
    ctx.font = `bold ${Math.max(9, tw * 0.2)}px "Microsoft YaHei", "SimHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.cat, x + tw / 2, y + th * 0.22);

    // Main character
    ctx.fillStyle = COLORS.tileText;
    if (isWind) {
      ctx.font = `bold ${Math.max(14, tw * 0.42)}px "Microsoft YaHei", "SimHei", sans-serif`;
      ctx.fillText(def.val, x + tw / 2, y + th * 0.58);
    } else {
      const num = def.val.charAt(0);
      ctx.font = `bold ${Math.max(16, tw * 0.45)}px "Microsoft YaHei", "SimHei", sans-serif`;
      ctx.fillText(num, x + tw / 2, y + th * 0.53);
      ctx.font = `${Math.max(9, tw * 0.2)}px "Microsoft YaHei", "SimHei", sans-serif`;
      ctx.fillText(def.cat, x + tw / 2, y + th * 0.8);
    }

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// Init
const game = new MahjongGame();
window.startGame = function() {
  game.ui.showStartOverlay((layout, diff) => game.startGame(layout, diff));
};
