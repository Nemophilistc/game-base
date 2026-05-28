// ============================================================
// pieces.js — 棋子走法规则（合法走法生成）
// ============================================================

import { BOARD_SIZE, WHITE, BLACK, KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN } from './config.js';

/**
 * 判断坐标是否在棋盘范围内
 */
export function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

/**
 * 获取棋子颜色
 */
export function pieceColor(piece) {
  return piece ? piece[0] : null;
}

/**
 * 获取棋子类型
 */
export function pieceType(piece) {
  return piece ? piece[1] : null;
}

/**
 * 生成某个棋子的"伪合法"走法（不考虑是否会被将军）
 * 返回 [{ fromR, fromC, toR, toC, special }]
 * special: 'castleK' | 'castleQ' | 'enPassant' | 'promotion' | null
 *
 * @param {number} r - 行
 * @param {number} c - 列
 * @param {Array} board - 8x8 棋盘
 * @param {object|null} enPassantTarget - {r, c} 吃过路兵目标格
 * @param {object} castlingRights - { wK, wQ, bK, bQ }
 */
export function generatePseudoMoves(r, c, board, enPassantTarget, castlingRights) {
  const piece = board[r][c];
  if (!piece) return [];

  const color = pieceColor(piece);
  const type  = pieceType(piece);
  const moves = [];

  const addMove = (toR, toC, special = null) => {
    if (inBounds(toR, toC)) {
      const target = board[toR][toC];
      if (!target || pieceColor(target) !== color) {
        moves.push({ fromR: r, fromC: c, toR, toC, special });
      }
    }
  };

  const addSlide = (dr, dc) => {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (target) {
        if (pieceColor(target) !== color) {
          moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
        }
        break;
      }
      moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
      nr += dr;
      nc += dc;
    }
  };

  switch (type) {
    case PAWN: {
      const dir = color === WHITE ? -1 : 1;
      const startRow = color === WHITE ? 6 : 1;
      const promoRow = color === WHITE ? 0 : 7;

      // 前进一格
      const nr = r + dir;
      if (inBounds(nr, c) && !board[nr][c]) {
        if (nr === promoRow) {
          // 升变
          moves.push({ fromR: r, fromC: c, toR: nr, toC: c, special: 'promotion' });
        } else {
          moves.push({ fromR: r, fromC: c, toR: nr, toC: c });
        }
        // 前进两格（起始位置）
        const nr2 = r + dir * 2;
        if (r === startRow && inBounds(nr2, c) && !board[nr2][c]) {
          moves.push({ fromR: r, fromC: c, toR: nr2, toC: c });
        }
      }

      // 斜吃
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const target = board[nr][nc];
          if (target && pieceColor(target) !== color) {
            if (nr === promoRow) {
              moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, special: 'promotion' });
            } else {
              moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
            }
          }
          // 吃过路兵
          if (enPassantTarget && enPassantTarget.r === nr && enPassantTarget.c === nc) {
            moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, special: 'enPassant' });
          }
        }
      }
      break;
    }

    case KNIGHT: {
      const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of offsets) {
        addMove(r + dr, c + dc);
      }
      break;
    }

    case BISHOP: {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) addSlide(dr, dc);
      break;
    }

    case ROOK: {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) addSlide(dr, dc);
      break;
    }

    case QUEEN: {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) addSlide(dr, dc);
      break;
    }

    case KING: {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        addMove(r + dr, c + dc);
      }

      // 王车易位
      if (castlingRights) {
        const row = color === WHITE ? 7 : 0;
        if (r === row && c === 4) {
          // 王翼易位 (O-O)
          const kKey = color === WHITE ? 'wK' : 'bK';
          if (castlingRights[kKey]) {
            if (!board[row][5] && !board[row][6] &&
                board[row][7] === color + 'R') {
              moves.push({ fromR: r, fromC: c, toR: row, toC: 6, special: 'castleK' });
            }
          }
          // 后翼易位 (O-O-O)
          const qKey = color === WHITE ? 'wQ' : 'bQ';
          if (castlingRights[qKey]) {
            if (!board[row][3] && !board[row][2] && !board[row][1] &&
                board[row][0] === color + 'R') {
              moves.push({ fromR: r, fromC: c, toR: row, toC: 2, special: 'castleQ' });
            }
          }
        }
      }
      break;
    }
  }

  return moves;
}

/**
 * 生成某方所有棋子的伪合法走法
 */
export function generateAllPseudoMoves(board, color, enPassantTarget, castlingRights) {
  const moves = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && pieceColor(piece) === color) {
        moves.push(...generatePseudoMoves(r, c, board, enPassantTarget, castlingRights));
      }
    }
  }
  return moves;
}
