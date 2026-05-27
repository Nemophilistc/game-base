// ============================================================
// board.js — 棋盘状态管理（8×8网格、历史记录、悔棋）
// ============================================================

import { INITIAL_BOARD, INITIAL_CASTLING, WHITE, BLACK } from './config.js';
import { cloneBoard, applyMove, updateCastlingRights, getEnPassantTarget, boardHash } from './rules.js';

/**
 * 游戏状态对象
 */
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = cloneBoard(INITIAL_BOARD);
    this.turn = WHITE; // 白方先行
    this.castlingRights = { ...INITIAL_CASTLING };
    this.enPassantTarget = null;
    this.halfMoveClock = 0;    // 50步规则计数
    this.fullMoveNumber = 1;
    this.history = [];          // 走法历史（用于悔棋）
    this.positionCounts = {};   // 位置出现次数（三次重复）
    this.gameOver = false;
    this.gameResult = null;     // 'checkmate' | 'stalemate' | 'draw' | null
    this.winner = null;         // WHITE | BLACK | null
    this._recordPosition();
  }

  /** 记录当前局面（用于三次重复） */
  _recordPosition() {
    const hash = boardHash(this.board, this.turn, this.castlingRights, this.enPassantTarget);
    this.positionCounts[hash] = (this.positionCounts[hash] || 0) + 1;
  }

  /**
   * 执行走法
   * @param {object} move - { fromR, fromC, toR, toC, special, promotionPiece }
   * @returns {{ captured: string|null, special: string|null }}
   */
  makeMove(move) {
    const piece = this.board[move.fromR][move.fromC];
    const captured = this.board[move.toR][move.toC];
    const isCapture = captured !== null || move.special === 'enPassant';
    const isPawn = piece[1] === 'P';

    // 保存当前状态到历史
    this.history.push({
      board: cloneBoard(this.board),
      turn: this.turn,
      castlingRights: { ...this.castlingRights },
      enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      move: { ...move },
      captured: captured,
    });

    // 执行走法
    const { board: newBoard } = applyMove(this.board, move);
    this.board = newBoard;

    // 更新王车易位权利
    this.castlingRights = updateCastlingRights(this.castlingRights, move, piece);

    // 更新吃过路兵目标
    this.enPassantTarget = getEnPassantTarget(this.board, move);

    // 更新50步规则计数
    if (isCapture || isPawn) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    // 更新回合
    if (this.turn === BLACK) {
      this.fullMoveNumber++;
    }
    this.turn = this.turn === WHITE ? BLACK : WHITE;

    // 记录局面
    this._recordPosition();

    return { captured, special: move.special || null };
  }

  /**
   * 悔棋（撤销上一步）
   * @returns {boolean} 是否成功悔棋
   */
  undoMove() {
    if (this.history.length === 0) return false;

    const last = this.history.pop();
    this.board = last.board;
    this.turn = last.turn;
    this.castlingRights = last.castlingRights;
    this.enPassantTarget = last.enPassantTarget;
    this.halfMoveClock = last.halfMoveClock;
    this.fullMoveNumber = last.fullMoveNumber;
    this.gameOver = false;
    this.gameResult = null;
    this.winner = null;

    // 删除当前位置记录
    const hash = boardHash(this.board, this.turn, this.castlingRights, this.enPassantTarget);
    if (this.positionCounts[hash] > 0) {
      this.positionCounts[hash]--;
    }

    return true;
  }

  /**
   * 连续悔棋两步（人机模式下回到玩家回合）
   */
  undoTwoMoves() {
    if (this.history.length < 2) return false;
    this.undoMove();
    this.undoMove();
    return true;
  }

  /**
   * 标记游戏结束
   */
  setGameOver(result, winner = null) {
    this.gameOver = true;
    this.gameResult = result;
    this.winner = winner;
  }

  /**
   * 获取走法历史的可读格式
   */
  getMoveHistory() {
    const pieceNames = { K: '王', Q: '后', R: '车', B: '象', N: '马', P: '' };
    const files = 'abcdefgh';

    return this.history.map((entry, i) => {
      const move = entry.move;
      const piece = this.board[move.toR][move.toC] || entry.board[move.fromR][move.fromC];
      const type = piece ? piece[1] : 'P';
      const color = piece ? piece[0] : 'w';
      const from = files[move.fromC] + (8 - move.fromR);
      const to = files[move.toC] + (8 - move.toR);
      const isCapture = entry.captured !== null || move.special === 'enPassant';
      const captureStr = isCapture ? 'x' : '-';
      const name = pieceNames[type];

      let notation = '';
      if (move.special === 'castleK') {
        notation = 'O-O';
      } else if (move.special === 'castleQ') {
        notation = 'O-O-O';
      } else {
        notation = `${name}${from}${captureStr}${to}`;
        if (move.special === 'promotion') {
          notation += `=${pieceNames[move.promotionPiece || 'Q']}`;
        }
      }

      const moveNum = Math.floor(i / 2) + 1;
      if (color === WHITE) {
        return `${moveNum}. ${notation}`;
      } else {
        return `${moveNum}... ${notation}`;
      }
    });
  }
}
