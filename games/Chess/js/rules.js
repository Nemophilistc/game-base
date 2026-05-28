// ============================================================
// rules.js — 规则引擎（将军/将杀/和棋/吃过路兵/王车易位/兵升变）
// ============================================================

import { BOARD_SIZE, WHITE, BLACK, KING } from './config.js';
import { generatePseudoMoves, generateAllPseudoMoves, pieceColor, pieceType, inBounds } from './pieces.js';

/**
 * 复制棋盘（深拷贝 8x8 数组）
 */
export function cloneBoard(board) {
  return board.map(row => [...row]);
}

/**
 * 找到指定方王的位置
 */
export function findKing(board, color) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === color + KING) return { r, c };
    }
  }
  return null;
}

/**
 * 判断指定方是否被将军
 */
export function isSquareAttacked(board, r, c, byColor) {
  // 检查所有对方棋子的攻击范围
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (!piece || pieceColor(piece) !== byColor) continue;
      const type = pieceType(piece);
      // 使用不带王车易位的伪走法来检测攻击
      const moves = generatePseudoMoves(row, col, board, null, null);
      for (const m of moves) {
        if (m.toR === r && m.toC === c) return true;
      }
    }
  }
  return false;
}

/**
 * 判断指定方是否被将军
 */
export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  const enemy = color === WHITE ? BLACK : WHITE;
  return isSquareAttacked(board, king.r, king.c, enemy);
}

/**
 * 执行走法（返回新棋盘，处理特殊走法）
 * @param {Array} board - 棋盘
 * @param {object} move - { fromR, fromC, toR, toC, special, promotionPiece }
 * @returns {{ board: Array, captured: string|null }}
 */
export function applyMove(board, move) {
  const newBoard = cloneBoard(board);
  const { fromR, fromC, toR, toC, special, promotionPiece } = move;
  const piece = newBoard[fromR][fromC];
  const captured = newBoard[toR][toC];
  const color = pieceColor(piece);

  newBoard[toR][toC] = piece;
  newBoard[fromR][fromC] = null;

  if (special === 'enPassant') {
    // 吃过路兵：移除被吃的兵
    const capturedPawnRow = color === WHITE ? toR + 1 : toR - 1;
    newBoard[capturedPawnRow][toC] = null;
  } else if (special === 'castleK') {
    // 王翼易位：移动车
    const row = toR;
    newBoard[row][5] = newBoard[row][7];
    newBoard[row][7] = null;
  } else if (special === 'castleQ') {
    // 后翼易位：移动车
    const row = toR;
    newBoard[row][3] = newBoard[row][0];
    newBoard[row][0] = null;
  } else if (special === 'promotion') {
    // 兵升变
    const promoPiece = promotionPiece || 'Q';
    newBoard[toR][toC] = color + promoPiece;
  }

  return { board: newBoard, captured };
}

/**
 * 模拟走法后判断己方是否被将军（用于过滤伪合法走法）
 */
export function wouldBeInCheck(board, move) {
  const piece = board[move.fromR][move.fromC];
  const color = pieceColor(piece);
  const { board: newBoard } = applyMove(board, move);
  return isInCheck(newBoard, color);
}

/**
 * 生成某方所有合法走法（过滤掉会导致自己被将军的走法）
 */
export function generateLegalMoves(board, color, enPassantTarget, castlingRights) {
  const pseudoMoves = generateAllPseudoMoves(board, color, enPassantTarget, castlingRights);
  const legalMoves = [];

  for (const move of pseudoMoves) {
    // 王车易位特殊检查：王经过的格子不能被攻击
    if (move.special === 'castleK' || move.special === 'castleQ') {
      const enemy = color === WHITE ? BLACK : WHITE;
      const row = move.fromR;
      // 王不能在被将军状态时易位
      if (isInCheck(board, color)) continue;
      // 王经过的格子不能被攻击
      if (move.special === 'castleK') {
        if (isSquareAttacked(board, row, 5, enemy) ||
            isSquareAttacked(board, row, 6, enemy)) continue;
      } else {
        if (isSquareAttacked(board, row, 3, enemy) ||
            isSquareAttacked(board, row, 2, enemy)) continue;
      }
    }

    if (!wouldBeInCheck(board, move)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

/**
 * 判断是否将杀（无合法走法且被将军）
 */
export function isCheckmate(board, color, enPassantTarget, castlingRights) {
  if (!isInCheck(board, color)) return false;
  const moves = generateLegalMoves(board, color, enPassantTarget, castlingRights);
  return moves.length === 0;
}

/**
 * 判断是否逼和（无合法走法且未被将军）
 */
export function isStalemate(board, color, enPassantTarget, castlingRights) {
  if (isInCheck(board, color)) return false;
  const moves = generateLegalMoves(board, color, enPassantTarget, castlingRights);
  return moves.length === 0;
}

/**
 * 材料不足和棋判定
 */
export function isInsufficientMaterial(board) {
  const pieces = { w: [], b: [] };
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p) {
        pieces[p[0]].push({ type: p[1], r, c });
      }
    }
  }

  const wPieces = pieces.w.filter(p => p.type !== KING);
  const bPieces = pieces.b.filter(p => p.type !== KING);

  // K vs K
  if (wPieces.length === 0 && bPieces.length === 0) return true;
  // K+B vs K or K+N vs K
  if (wPieces.length === 0 && bPieces.length === 1 &&
      (bPieces[0].type === 'B' || bPieces[0].type === 'N')) return true;
  if (bPieces.length === 0 && wPieces.length === 1 &&
      (wPieces[0].type === 'B' || wPieces[0].type === 'N')) return true;

  return false;
}

/**
 * 计算棋盘的 Zobrist 简化哈希（用于三次重复判定）
 * 使用简单的字符串序列化
 */
export function boardHash(board, turn, castlingRights, enPassantTarget) {
  const boardStr = board.map(row =>
    row.map(p => p || '--').join(',')
  ).join('|');
  const epStr = enPassantTarget ? `${enPassantTarget.r},${enPassantTarget.c}` : '-';
  const castStr = `${castlingRights.wK?1:0}${castlingRights.wQ?1:0}${castlingRights.bK?1:0}${castlingRights.bQ?1:0}`;
  return `${boardStr}|${turn}|${castStr}|${epStr}`;
}

/**
 * 更新王车易位权利
 */
export function updateCastlingRights(castlingRights, move, piece) {
  const newRights = { ...castlingRights };
  const type = pieceType(piece);
  const color = pieceColor(piece);

  // 王移动后失去易位权
  if (type === KING) {
    if (color === WHITE) { newRights.wK = false; newRights.wQ = false; }
    else { newRights.bK = false; newRights.bQ = false; }
  }

  // 车移动后失去对应易位权
  if (type === ROOK) {
    if (color === WHITE) {
      if (move.fromR === 7 && move.fromC === 0) newRights.wQ = false;
      if (move.fromR === 7 && move.fromC === 7) newRights.wK = false;
    } else {
      if (move.fromR === 0 && move.fromC === 0) newRights.bQ = false;
      if (move.fromR === 0 && move.fromC === 7) newRights.bK = false;
    }
  }

  // 车被吃也失去对应易位权
  if (move.toR === 7 && move.toC === 0) newRights.wQ = false;
  if (move.toR === 7 && move.toC === 7) newRights.wK = false;
  if (move.toR === 0 && move.toC === 0) newRights.bQ = false;
  if (move.toR === 0 && move.toC === 7) newRights.bK = false;

  return newRights;
}

/**
 * 计算吃过路兵目标格
 */
export function getEnPassantTarget(board, move) {
  const piece = board[move.toR][move.toC];
  if (!piece) return null;
  if (pieceType(piece) !== PAWN) return null;
  const color = pieceColor(piece);
  const dir = color === WHITE ? -1 : 1;

  // 兵前进两格
  if (Math.abs(move.toR - move.fromR) === 2) {
    const epRow = move.fromR + dir;
    return { r: epRow, c: move.toC };
  }
  return null;
}
