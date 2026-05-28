// ui.js - UI overlays and HUD

import { COLORS, DIFFICULTY, LAYOUTS, HINTS_MAX, SHUFFLES_MAX } from './config.js';

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.overlayEl = document.getElementById('overlay');
    this.hudEl = document.getElementById('hud');
    this.hintBtn = document.getElementById('hintBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.onHint = null;
    this.onShuffle = null;
    this._bindButtons();
  }

  _bindButtons() {
    if (this.hintBtn) {
      this.hintBtn.addEventListener('click', () => {
        if (this.onHint) this.onHint();
      });
    }
    if (this.shuffleBtn) {
      this.shuffleBtn.addEventListener('click', () => {
        if (this.onShuffle) this.onShuffle();
      });
    }
  }

  showStartOverlay(onStart) {
    this.overlayEl.innerHTML = `
      <div class="overlay-panel glass-panel">
        <h1 class="title">麻 将 连 连 看</h1>
        <p class="subtitle">Mahjong Link</p>

        <div class="option-group">
          <label>布局选择</label>
          <div class="btn-row" id="layoutRow">
            ${Object.entries(LAYOUTS).map(([k, v], i) =>
              `<button class="opt-btn ${i === 0 ? 'active' : ''}" data-val="${k}">${v.label}</button>`
            ).join('')}
          </div>
        </div>

        <div class="option-group">
          <label>难度选择</label>
          <div class="btn-row" id="diffRow">
            ${Object.entries(DIFFICULTY).map(([k, v], i) =>
              `<button class="opt-btn ${i === 0 ? 'active' : ''}" data-val="${k}">${v.label}</button>`
            ).join('')}
          </div>
        </div>

        <button class="start-btn" id="startBtn">开始游戏</button>

        <div class="help-box">
          <p><b>玩法说明：</b></p>
          <p>点击两个相同的麻将牌进行消除。</p>
          <p>连接路径最多拐弯两次，且不能穿过其他牌。</p>
          <p>提示 <span class="gold">x${HINTS_MAX}</span> | 重排 <span class="gold">x${SHUFFLES_MAX}</span></p>
        </div>
      </div>
    `;
    this.overlayEl.classList.remove('hidden');

    let selectedLayout = 'pyramid';
    let selectedDiff = 'easy';

    this.overlayEl.querySelectorAll('#layoutRow .opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.overlayEl.querySelectorAll('#layoutRow .opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLayout = btn.dataset.val;
      });
    });
    this.overlayEl.querySelectorAll('#diffRow .opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.overlayEl.querySelectorAll('#diffRow .opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDiff = btn.dataset.val;
      });
    });
    this.overlayEl.querySelector('#startBtn').addEventListener('click', () => {
      this.overlayEl.classList.add('hidden');
      onStart(selectedLayout, selectedDiff);
    });
  }

  showWinOverlay(score, time, combo) {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    this.overlayEl.innerHTML = `
      <div class="overlay-panel glass-panel">
        <h1 class="title win-title">恭喜过关！</h1>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">得分</span>
            <span class="stat-value gold">${score}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">用时</span>
            <span class="stat-value">${mins}:${secs.toString().padStart(2, '0')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最高连击</span>
            <span class="stat-value gold">x${combo}</span>
          </div>
        </div>
        <button class="start-btn" id="restartBtn">再来一局</button>
      </div>
    `;
    this.overlayEl.classList.remove('hidden');
    this.overlayEl.querySelector('#restartBtn').addEventListener('click', () => {
      window.startGame();
    });
  }

  showGameOverOverlay(score, reason) {
    this.overlayEl.innerHTML = `
      <div class="overlay-panel glass-panel">
        <h1 class="title lose-title">游戏结束</h1>
        <p class="subtitle">${reason || '没有可消除的牌了'}</p>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">最终得分</span>
            <span class="stat-value gold">${score}</span>
          </div>
        </div>
        <button class="start-btn" id="restartBtn">再来一局</button>
      </div>
    `;
    this.overlayEl.classList.remove('hidden');
    this.overlayEl.querySelector('#restartBtn').addEventListener('click', () => {
      window.startGame();
    });
  }

  updateHUD(score, time, hintsLeft, shufflesLeft, pairsLeft, combo) {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    document.getElementById('hudScore').textContent = score;
    document.getElementById('hudTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('hudPairs').textContent = pairsLeft;
    document.getElementById('hudCombo').textContent = combo > 1 ? `x${combo}` : '';

    if (this.hintBtn) {
      this.hintBtn.textContent = `提示 (${hintsLeft})`;
      this.hintBtn.disabled = hintsLeft <= 0;
    }
    if (this.shuffleBtn) {
      this.shuffleBtn.textContent = `重排 (${shufflesLeft})`;
      this.shuffleBtn.disabled = shufflesLeft <= 0;
    }
  }
}
