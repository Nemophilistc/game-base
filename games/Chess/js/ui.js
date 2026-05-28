// ============================================================
// ui.js — 棋盘渲染、棋子绘制、走法高亮、覆盖层
// ============================================================

import { BOARD_SIZE, PIECE_UNICODE, COLORS, WHITE, BLACK } from './config.js';
import { pieceColor, pieceType } from './pieces.js';

/** 棋盘字母标记 */
const FILES = 'abcdefgh';
const RANKS = '87654321';

export class ChessUI {
  constructor(canvasEl, containerEl) {
    this.canvas = canvasEl;
    this.container = containerEl;
    this.ctx = canvasEl.getContext('2d');
    this.tileSize = 80;
    this.padding = 30; // 棋盘边距（用于显示坐标）
    this.selectedSquare = null;      // {r, c}
    this.legalMoves = [];            // [{toR, toC, ...}]
    this.lastMove = null;            // {fromR, fromC, toR, toC}
    this.checkSquare = null;         // 被将军的王的位置
    this.checkFlashTimer = 0;
    this.animating = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const minDim = Math.min(this.container.clientWidth, this.container.clientHeight - 10);
    this.tileSize = Math.floor((minDim - this.padding * 2) / BOARD_SIZE);
    const size = this.tileSize * BOARD_SIZE + this.padding * 2;
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
  }

  /** 将棋盘坐标 (r,c) 转换为像素坐标 */
  _tileToPixel(r, c) {
    return {
      x: this.padding + c * this.tileSize,
      y: this.padding + r * this.tileSize,
    };
  }

  /** 将像素坐标转换为棋盘坐标 (r,c) */
  pixelToTile(px, py) {
    const c = Math.floor((px - this.padding) / this.tileSize);
    const r = Math.floor((py - this.padding) / this.tileSize);
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;
    return { r, c };
  }

  /** 设置选中的格子 */
  setSelected(r, c, legalMoves) {
    this.selectedSquare = r !== null ? { r, c } : null;
    this.legalMoves = legalMoves || [];
  }

  /** 设置上一步走法 */
  setLastMove(move) {
    this.lastMove = move;
  }

  /** 设置被将军的王的位置 */
  setCheck(r, c) {
    this.checkSquare = r !== null ? { r, c } : null;
  }

  /** 主渲染函数 */
  render(board) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制棋盘格子
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const { x, y } = this._tileToPixel(r, c);
        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? COLORS.lightSquare : COLORS.darkSquare;
        ctx.fillRect(x, y, ts, ts);

        // 上一步高亮
        if (this.lastMove) {
          if ((r === this.lastMove.fromR && c === this.lastMove.fromC) ||
              (r === this.lastMove.toR && c === this.lastMove.toC)) {
            ctx.fillStyle = COLORS.lastMove;
            ctx.fillRect(x, y, ts, ts);
          }
        }

        // 选中格子高亮
        if (this.selectedSquare && r === this.selectedSquare.r && c === this.selectedSquare.c) {
          ctx.fillStyle = COLORS.selectedSquare;
          ctx.fillRect(x, y, ts, ts);
        }

        // 将军高亮
        if (this.checkSquare && r === this.checkSquare.r && c === this.checkSquare.c) {
          const flash = Math.sin(Date.now() / 150) > 0;
          if (flash) {
            ctx.fillStyle = COLORS.checkHighlight;
            ctx.fillRect(x, y, ts, ts);
          }
        }

        // 合法走法提示
        for (const move of this.legalMoves) {
          if (r === move.toR && c === move.toC) {
            if (board[r][c]) {
              // 吃子位置：圆环
              ctx.strokeStyle = 'rgba(0,0,0,0.25)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(x + ts/2, y + ts/2, ts/2 - 3, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              // 空位：小圆点
              ctx.fillStyle = 'rgba(0,0,0,0.2)';
              ctx.beginPath();
              ctx.arc(x + ts/2, y + ts/2, ts/6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // 绘制坐标标记
    ctx.font = `${Math.max(12, ts * 0.18)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let c = 0; c < BOARD_SIZE; c++) {
      const isLight = (BOARD_SIZE - 1 + c) % 2 === 0;
      ctx.fillStyle = isLight ? COLORS.darkSquare : COLORS.lightSquare;
      // 底部文件标记
      ctx.fillText(FILES[c], this.padding + c * ts + ts/2, this.padding + BOARD_SIZE * ts + ts * 0.22);
      // 顶部文件标记
      ctx.fillText(FILES[c], this.padding + c * ts + ts/2, this.padding - ts * 0.22);
    }
    for (let r = 0; r < BOARD_SIZE; r++) {
      const isLight = (r) % 2 === 0;
      ctx.fillStyle = isLight ? COLORS.darkSquare : COLORS.lightSquare;
      ctx.fillText(RANKS[r], this.padding - ts * 0.22, this.padding + r * ts + ts/2);
      ctx.fillText(RANKS[r], this.padding + BOARD_SIZE * ts + ts * 0.22, this.padding + r * ts + ts/2);
    }

    // 绘制棋子
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const { x, y } = this._tileToPixel(r, c);
        this._drawPiece(ctx, piece, x, y, ts);
      }
    }
  }

  /** 绘制棋子（Unicode 符号 + 描边） */
  _drawPiece(ctx, piece, x, y, ts) {
    const unicode = PIECE_UNICODE[piece];
    if (!unicode) return;

    const color = pieceColor(piece);
    const fontSize = ts * 0.75;

    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = x + ts / 2;
    const cy = y + ts / 2;

    // 描边
    ctx.strokeStyle = color === WHITE ? COLORS.blackPieceStroke : COLORS.whitePieceStroke;
    ctx.lineWidth = 2;
    ctx.strokeText(unicode, cx, cy);

    // 填充
    ctx.fillStyle = color === WHITE ? COLORS.whitePiece : COLORS.blackPiece;
    ctx.fillText(unicode, cx, cy);
  }

  /** 显示兵升变选择 UI */
  showPromotionUI(color, callback) {
    const overlay = document.getElementById('promotion-overlay');
    overlay.innerHTML = '';
    overlay.style.display = 'flex';

    const pieces = ['Q', 'R', 'B', 'N'];
    const labels = ['后', '车', '象', '马'];

    pieces.forEach((type, i) => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      const unicode = PIECE_UNICODE[color + type];
      btn.innerHTML = `<span class="promo-piece">${unicode}</span><span class="promo-label">${labels[i]}</span>`;
      btn.addEventListener('click', () => {
        overlay.style.display = 'none';
        callback(type);
      });
      overlay.appendChild(btn);
    });
  }

  /** 显示游戏结束覆盖层 */
  showGameOver(result, winner, onRestart) {
    const overlay = document.getElementById('gameover-overlay');
    overlay.style.display = 'flex';

    let title = '';
    let subtitle = '';

    if (result === 'checkmate') {
      const winnerName = winner === WHITE ? '白方' : '黑方';
      title = '将杀!';
      subtitle = `${winnerName}获胜`;
    } else if (result === 'stalemate') {
      title = '和棋';
      subtitle = '逼和';
    } else if (result === 'draw') {
      title = '和棋';
      subtitle = '三次重复 / 50步规则 / 材料不足';
    } else if (result === 'resign') {
      const winnerName = winner === WHITE ? '白方' : '黑方';
      title = '认输';
      subtitle = `${winnerName}获胜`;
    }

    overlay.innerHTML = `
      <div class="gameover-box">
        <div class="gameover-title">${title}</div>
        <div class="gameover-subtitle">${subtitle}</div>
        <button class="gameover-btn" id="restart-btn">再来一局</button>
      </div>
    `;

    document.getElementById('restart-btn').addEventListener('click', () => {
      overlay.style.display = 'none';
      onRestart();
    });
  }

  /** 隐藏游戏结束覆盖层 */
  hideGameOver() {
    document.getElementById('gameover-overlay').style.display = 'none';
  }

  /** 更新走法历史显示 */
  updateMoveHistory(moves) {
    const el = document.getElementById('move-history');
    if (!el) return;

    // 显示最近 30 步
    const recent = moves.slice(-30);
    el.innerHTML = '';

    for (let i = 0; i < recent.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'history-row';
      const moveNum = Math.floor((moves.length - recent.length + i) / 2) + 1;

      const numSpan = document.createElement('span');
      numSpan.className = 'history-num';
      numSpan.textContent = `${moveNum}.`;
      row.appendChild(numSpan);

      const whiteSpan = document.createElement('span');
      whiteSpan.className = 'history-move';
      whiteSpan.textContent = recent[i] || '';
      row.appendChild(whiteSpan);

      if (recent[i + 1]) {
        const blackSpan = document.createElement('span');
        blackSpan.className = 'history-move';
        blackSpan.textContent = recent[i + 1];
        row.appendChild(blackSpan);
      }

      el.appendChild(row);
    }

    el.scrollTop = el.scrollHeight;
  }

  /** 设置当前回合指示 */
  setTurnIndicator(turn) {
    const el = document.getElementById('turn-indicator');
    if (el) {
      el.textContent = turn === WHITE ? '白方走棋' : '黑方走棋';
      el.className = turn === WHITE ? 'turn-white' : 'turn-black';
    }
  }
}
