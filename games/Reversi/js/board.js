// board.js - Board state, move validation, disc flipping logic

import { BOARD_SIZE, EMPTY, BLACK, WHITE, DIRECTIONS } from './config.js';

let board = [];
let currentPlayer = BLACK;
let blackCount = 2;
let whiteCount = 2;
let lastMove = null;
let moveHistory = [];

export function initBoard() {
    board = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        board[r] = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
            board[r][c] = EMPTY;
        }
    }
    // Standard Othello starting position
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    currentPlayer = BLACK;
    blackCount = 2;
    whiteCount = 2;
    lastMove = null;
    moveHistory = [];
}

export function getBoard() { return board; }
export function getCurrentPlayer() { return currentPlayer; }
export function getBlackCount() { return blackCount; }
export function getWhiteCount() { return whiteCount; }
export function getLastMove() { return lastMove; }
export function getMoveHistory() { return moveHistory; }

export function getCell(r, c) {
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return -1;
    return board[r][c];
}

function opponent(player) {
    return player === BLACK ? WHITE : BLACK;
}

/**
 * Returns discs that would be flipped if player plays at (r, c).
 * Each entry: { r, c, dr, dc } for the direction info
 */
function getFlips(boardState, r, c, player) {
    if (boardState[r][c] !== EMPTY) return [];
    const opp = opponent(player);
    const flips = [];

    for (const [dr, dc] of DIRECTIONS) {
        const dirFlips = [];
        let nr = r + dr;
        let nc = c + dc;

        while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardState[nr][nc] === opp) {
            dirFlips.push({ r: nr, c: nc, dr, dc });
            nr += dr;
            nc += dc;
        }

        if (dirFlips.length > 0 && nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardState[nr][nc] === player) {
            flips.push(...dirFlips);
        }
    }

    return flips;
}

export function isValidMove(r, c, player = currentPlayer) {
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== EMPTY) return false;
    return getFlips(board, r, c, player).length > 0;
}

export function getValidMoves(player = currentPlayer) {
    const moves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (isValidMove(r, c, player)) {
                moves.push({ r, c });
            }
        }
    }
    return moves;
}

/**
 * Make a move. Returns { flips: [{r,c}], placed: {r,c} } or null if invalid.
 */
export function makeMove(r, c, player = currentPlayer) {
    const flips = getFlips(board, r, c, player);
    if (flips.length === 0) return null;

    // Record history
    moveHistory.push({
        player,
        r, c,
        flips: flips.map(f => ({ r: f.r, c: f.c })),
        prevBoard: board.map(row => [...row]),
        prevBlackCount: blackCount,
        prevWhiteCount: whiteCount,
        prevCurrentPlayer: currentPlayer
    });

    // Place disc
    board[r][c] = player;

    // Flip discs
    for (const f of flips) {
        board[f.r][f.c] = player;
    }

    // Update counts
    const flipCount = flips.length;
    if (player === BLACK) {
        blackCount += 1 + flipCount;
        whiteCount -= flipCount;
    } else {
        whiteCount += 1 + flipCount;
        blackCount -= flipCount;
    }

    lastMove = { r, c };

    // Switch turn
    currentPlayer = opponent(player);

    // If opponent has no moves, pass back (or game ends)
    if (getValidMoves(currentPlayer).length === 0) {
        currentPlayer = opponent(currentPlayer);
        // If original player also has no moves, game is over
        // (caller should check isGameOver)
    }

    return { flips: flips.map(f => ({ r: f.r, c: f.c })), placed: { r, c } };
}

export function isGameOver() {
    return getValidMoves(BLACK).length === 0 && getValidMoves(WHITE).length === 0;
}

export function getWinner() {
    if (blackCount > whiteCount) return BLACK;
    if (whiteCount > blackCount) return WHITE;
    return EMPTY; // draw
}

/**
 * Clone the current board state for AI evaluation
 */
export function cloneBoard(boardState) {
    return boardState.map(row => [...row]);
}

/**
 * AI helper: evaluate and make a move on a cloned board without side effects
 */
export function simulateMove(boardState, r, c, player) {
    const flips = getFlips(boardState, r, c, player);
    if (flips.length === 0) return null;

    const newBoard = cloneBoard(boardState);
    newBoard[r][c] = player;
    for (const f of flips) {
        newBoard[f.r][f.c] = player;
    }
    return { board: newBoard, flips: flips.length };
}

/**
 * AI helper: get valid moves on a given board state
 */
export function getValidMovesOnBoard(boardState, player) {
    const moves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (boardState[r][c] === EMPTY && getFlips(boardState, r, c, player).length > 0) {
                moves.push({ r, c });
            }
        }
    }
    return moves;
}

/**
 * Count discs on a board state
 */
export function countDiscs(boardState) {
    let b = 0, w = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (boardState[r][c] === BLACK) b++;
            else if (boardState[r][c] === WHITE) w++;
        }
    }
    return { black: b, white: w };
}
