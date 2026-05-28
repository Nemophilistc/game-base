// ============================================================
// ai.js — AI 对弈（minimax + alpha-beta 剪枝，3级难度）
// ============================================================

import { WHITE, BLACK, PIECE_VALUES, PST, BOARD_SIZE } from './config.js';
import { pieceColor, pieceType } from './pieces.js';
import { generateLegalMoves, applyMove, isInCheck, isCheckmate, isStalemate, isInsufficientMaterial, updateCastlingRights, getEnPassantTarget, cloneBoard } from './rules.js';

/**
 * 难度配置
 */
const DIFFICULTY = {
  1: { depth: 2, name: '简单' },
  2: { depth: 3, name: '中等' },
  3: { depth: 4, name: '困难' },
};

/**
 * 获取位置价值（白方视角，黑方翻转）
 */
function getPositionValue(type, r, c, color) {
  const table = PST[type];
  if (!table) return 0;
  const row = color === WHITE ? r : 7 - r;
  return table[row][c];
}

/**
 * 判断是否为残局（双方后都不在，或总子力低于阈值）
 */
function isEndgame(board) {
  let queens = 0;
  let totalMaterial = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const t = pieceType(p);
      if (t === 'Q') queens++;
      if (t !== 'K') totalMaterial += PIECE_VALUES[t] || 0;
    }
  }
  return queens === 0 || totalMaterial < 2500;
}

/**
 * 棋盘评估函数
 * 正值对白方有利，负值对黑方有利
 */
function evaluate(board) {
  let score = 0;
  const endgame = isEndgame(board);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const color = pieceColor(piece);
      const type = pieceType(piece);
      const sign = color === WHITE ? 1 : -1;

      // 子力价值
      const material = PIECE_VALUES[type] || 0;

      // 位置价值
      let positional = 0;
      if (type === 'K' && endgame) {
        positional = getPositionValue('K_END', r, c, color);
      } else {
        positional = getPositionValue(type, r, c, color);
      }

      score += sign * (material + positional);
    }
  }

  // 王安全惩罚：中局时王暴露在中心
  if (!endgame) {
    for (const color of [WHITE, BLACK]) {
      const sign = color === WHITE ? 1 : -1;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] === color + 'K') {
            // 王在中心的惩罚
            if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
              score -= sign * 30;
            }
          }
        }
      }
    }
  }

  return score;
}

/**
 * 走法排序（提高剪枝效率）
 * 优先搜索：吃子 > 将军 > 其他
 */
function orderMoves(moves, board) {
  return moves.sort((a, b) => {
    let scoreA = 0, scoreB = 0;

    // 吃子优先
    const capturedA = board[a.toR][a.toC];
    const capturedB = board[b.toR][b.toC];
    if (capturedA) {
      const attackerA = board[a.fromR][a.fromC];
      scoreA += (PIECE_VALUES[pieceType(capturedA)] || 0) * 10
                - (PIECE_VALUES[pieceType(attackerA)] || 0);
    }
    if (capturedB) {
      const attackerB = board[b.fromR][b.fromC];
      scoreB += (PIECE_VALUES[pieceType(capturedB)] || 0) * 10
                - (PIECE_VALUES[pieceType(attackerB)] || 0);
    }

    // 升变优先
    if (a.special === 'promotion') scoreA += 800;
    if (b.special === 'promotion') scoreB += 800;

    return scoreB - scoreA;
  });
}

/**
 * Minimax + Alpha-Beta 剪枝
 *
 * @param {Array} board - 棋盘
 * @param {number} depth - 剩余搜索深度
 * @param {number} alpha - Alpha 值
 * @param {number} beta - Beta 值
 * @param {boolean} maximizing - 是否为最大化层（白方）
 * @param {object} state - 当前游戏状态快照
 * @returns {number} 评估值
 */
function minimax(board, depth, alpha, beta, maximizing, state) {
  const color = maximizing ? WHITE : BLACK;

  // 生成合法走法
  const moves = generateLegalMoves(board, color, state.enPassantTarget, state.castlingRights);

  // 终局检测
  if (moves.length === 0) {
    if (isInCheck(board, color)) {
      // 将杀：尽量快杀
      return maximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
    }
    return 0; // 逼和
  }

  if (isInsufficientMaterial(board)) return 0;
  if (state.halfMoveClock >= 100) return 0; // 50步规则

  // 到达搜索深度，评估局面
  if (depth === 0) return evaluate(board);

  // 走法排序
  orderMoves(moves, board);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { board: newBoard } = applyMove(board, move);
      const newState = {
        enPassantTarget: getEnPassantTarget(newBoard, move),
        castlingRights: updateCastlingRights(state.castlingRights, move, board[move.fromR][move.fromC]),
        halfMoveClock: (state.halfMoveClock + 1) > 100 ? 100 : state.halfMoveClock + 1,
      };
      const ev = minimax(newBoard, depth - 1, alpha, beta, false, newState);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break; // 剪枝
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { board: newBoard } = applyMove(board, move);
      const newState = {
        enPassantTarget: getEnPassantTarget(newBoard, move),
        castlingRights: updateCastlingRights(state.castlingRights, move, board[move.fromR][move.fromC]),
        halfMoveClock: (state.halfMoveClock + 1) > 100 ? 100 : state.halfMoveClock + 1,
      };
      const ev = minimax(newBoard, depth - 1, alpha, beta, true, newState);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break; // 剪枝
    }
    return minEval;
  }
}

/**
 * AI 计算最佳走法
 *
 * @param {import('./board.js').GameState} gameState - 游戏状态
 * @param {number} difficulty - 难度 1-3
 * @returns {object|null} 最佳走法
 */
export function getBestMove(gameState, difficulty = 2) {
  const depth = DIFFICULTY[difficulty]?.depth || 3;
  const color = gameState.turn;
  const board = gameState.board;

  const moves = generateLegalMoves(board, color, gameState.enPassantTarget, gameState.castlingRights);
  if (moves.length === 0) return null;

  // 只有一个走法，直接返回
  if (moves.length === 1) return moves[0];

  orderMoves(moves, board);

  const isMaximizing = color === WHITE;
  let bestMove = moves[0];
  let bestEval = isMaximizing ? -Infinity : Infinity;

  const state = {
    enPassantTarget: gameState.enPassantTarget,
    castlingRights: gameState.castlingRights,
    halfMoveClock: gameState.halfMoveClock,
  };

  for (const move of moves) {
    const { board: newBoard } = applyMove(board, move);
    const newState = {
      enPassantTarget: getEnPassantTarget(newBoard, move),
      castlingRights: updateCastlingRights(state.castlingRights, move, board[move.fromR][move.fromC]),
      halfMoveClock: state.halfMoveClock + 1,
    };
    const ev = minimax(newBoard, depth - 1, -Infinity, Infinity, !isMaximizing, newState);

    if (isMaximizing) {
      if (ev > bestEval) {
        bestEval = ev;
        bestMove = move;
      }
    } else {
      if (ev < bestEval) {
        bestEval = ev;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

export { DIFFICULTY };
