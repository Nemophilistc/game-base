// ui.js - DOM渲染（格子翻转动画、键盘、统计）

import { WORD_LENGTH, MAX_GUESSES, COLOR, GAME_STATE } from './config.js';

/**
 * 创建游戏板DOM
 * @param {HTMLElement} container - 板容器
 * @returns {HTMLElement[][]} 格子元素二维数组
 */
export function createBoardDOM(container) {
  container.innerHTML = '';
  const cells = [];

  for (let row = 0; row < MAX_GUESSES; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'board-row';
    const rowCells = [];

    for (let col = 0; col < WORD_LENGTH; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;

      // 内部翻转容器
      const inner = document.createElement('div');
      inner.className = 'cell-inner';

      const front = document.createElement('div');
      front.className = 'cell-front';

      const back = document.createElement('div');
      back.className = 'cell-back';

      inner.appendChild(front);
      inner.appendChild(back);
      cell.appendChild(inner);
      rowDiv.appendChild(cell);
      rowCells.push(cell);
    }

    container.appendChild(rowDiv);
    cells.push(rowCells);
  }

  return cells;
}

/**
 * 更新格子显示
 * @param {HTMLElement[][]} cells - 格子元素数组
 * @param {number} row - 行号
 * @param {string} guess - 当前猜测
 */
export function updateRow(cells, row, guess) {
  for (let col = 0; col < WORD_LENGTH; col++) {
    const cell = cells[row][col];
    const front = cell.querySelector('.cell-front');
    const letter = guess[col] || '';

    front.textContent = letter.toUpperCase();

    if (letter) {
      cell.classList.add('filled');
    } else {
      cell.classList.remove('filled');
    }
  }
}

/**
 * 翻转动画揭示颜色
 * @param {HTMLElement[][]} cells - 格子元素数组
 * @param {number} row - 行号
 * @param {string[]} colors - 颜色数组
 * @param {Function} callback - 动画完成回调
 * @param {Function} onFlipSound - 翻转音效回调
 */
export function flipRow(cells, row, colors, callback, onFlipSound) {
  colors.forEach((color, col) => {
    const cell = cells[row][col];
    const back = cell.querySelector('.cell-back');

    setTimeout(() => {
      if (onFlipSound) onFlipSound();

      // 设置背面颜色
      back.className = 'cell-back ' + color;

      // 翻转动画
      cell.classList.add('flipping');

      // 动画结束后回调
      if (col === WORD_LENGTH - 1 && callback) {
        setTimeout(callback, 300);
      }
    }, col * 300);  // 每个格子间隔300ms
  });
}

/**
 * 显示错误消息（格子抖动）
 * @param {HTMLElement[][]} cells - 格子元素数组
 * @param {number} row - 行号
 */
export function shakeRow(cells, row) {
  const rowEl = cells[row][0].parentElement;
  rowEl.classList.add('shake');
  setTimeout(() => rowEl.classList.remove('shake'), 500);
}

/**
 * 显示胜利动画（格子弹跳）
 * @param {HTMLElement[][]} cells - 格子元素数组
 * @param {number} row - 行号
 */
export function bounceRow(cells, row) {
  cells[row].forEach((cell, col) => {
    setTimeout(() => {
      cell.classList.add('bounce');
    }, col * 100);
  });
}

/**
 * 显示结果消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('success'/'error'/'info')
 */
export function showMessage(message, type = 'info') {
  const container = document.getElementById('message-container');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = `message message-${type}`;
  msg.textContent = message;
  container.prepend(msg);

  // 自动移除
  setTimeout(() => {
    msg.classList.add('fade-out');
    setTimeout(() => msg.remove(), 300);
  }, 2000);
}

/**
 * 更新标题栏（模式切换、每日挑战标签等）
 * @param {string} mode - 当前模式
 * @param {boolean} isDaily - 是否为每日挑战
 */
export function updateHeader(mode, isDaily) {
  const modeLabel = document.getElementById('mode-label');
  const dailyLabel = document.getElementById('daily-label');

  if (modeLabel) {
    modeLabel.textContent = mode === 'chinese' ? '中文模式' : '英文模式';
  }

  if (dailyLabel) {
    dailyLabel.style.display = isDaily ? 'inline-block' : 'none';
  }
}

/**
 * 显示游戏结束弹窗
 * @param {string} gameState - 游戏状态
 * @param {string} answer - 答案
 * @param {number} guessCount - 猜测次数
 * @param {Function} onNewGame - 新游戏回调
 * @param {Function} onShare - 分享回调
 */
export function showGameOver(gameState, answer, guessCount, onNewGame, onShare) {
  const modal = document.getElementById('game-over-modal');
  if (!modal) return;

  const title = modal.querySelector('.modal-title');
  const answerEl = modal.querySelector('.modal-answer');
  const statsEl = modal.querySelector('.modal-stats');

  if (gameState === GAME_STATE.WON) {
    title.textContent = '恭喜猜对!';
    title.className = 'modal-title win';
    answerEl.textContent = '';
  } else {
    title.textContent = '很遗憾，没猜对';
    title.className = 'modal-title lose';
    answerEl.textContent = `答案是：${answer}`;
  }

  statsEl.textContent = `你用了 ${guessCount} 次猜测`;

  // 绑定按钮事件
  const newGameBtn = modal.querySelector('.btn-new-game');
  const shareBtn = modal.querySelector('.btn-share');

  if (newGameBtn) {
    newGameBtn.onclick = () => {
      modal.classList.remove('show');
      onNewGame();
    };
  }

  if (shareBtn) {
    shareBtn.onclick = onShare;
  }

  modal.classList.add('show');
}

/**
 * 隐藏游戏结束弹窗
 */
export function hideGameOver() {
  const modal = document.getElementById('game-over-modal');
  if (modal) modal.classList.remove('show');
}

/**
 * 显示统计面板
 * @param {object} stats - 统计数据
 */
export function showStats(stats) {
  const modal = document.getElementById('stats-modal');
  if (!modal) return;

  const values = modal.querySelectorAll('.stat-value');
  if (values.length >= 4) {
    values[0].textContent = stats.gamesPlayed;
    values[1].textContent = stats.gamesPlayed > 0
      ? Math.round(stats.wins / stats.gamesPlayed * 100) + '%'
      : '0%';
    values[2].textContent = stats.currentStreak;
    values[3].textContent = stats.maxStreak;
  }

  // 猜测分布直方图
  const distContainer = modal.querySelector('.guess-distribution');
  if (distContainer) {
    distContainer.innerHTML = '';
    const maxCount = Math.max(...stats.guessDistribution, 1);

    for (let i = 1; i <= MAX_GUESSES; i++) {
      const count = stats.guessDistribution[i] || 0;
      const percent = Math.round((count / maxCount) * 100);

      const row = document.createElement('div');
      row.className = 'dist-row';

      const label = document.createElement('span');
      label.className = 'dist-label';
      label.textContent = i;

      const bar = document.createElement('div');
      bar.className = 'dist-bar';
      bar.style.width = Math.max(percent, 5) + '%';
      bar.textContent = count;

      row.appendChild(label);
      row.appendChild(bar);
      distContainer.appendChild(row);
    }
  }

  modal.classList.add('show');
}

/**
 * 隐藏统计面板
 */
export function hideStats() {
  const modal = document.getElementById('stats-modal');
  if (modal) modal.classList.remove('show');
}
