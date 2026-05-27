// ai.js - AI opponent with minimax and alpha-beta pruning

import { BOARD_SIZE, BLACK, WHITE, EMPTY, POSITION_WEIGHTS } from './config.js';
import { getValidMovesOnBoard, simulateMove, countDiscs } from './board.js';

function opponent(player) {
    return player === BLACK ? WHITE : BLACK;
}

/**
 * Evaluate board from the perspective of `player`.
 * Higher = better for `player`.
 */
function evaluate(boardState, player) {
    const opp = opponent(player);
    let score = 0;

    // Positional score
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (boardState[r][c] === player) {
                score += POSITION_WEIGHTS[r][c];
            } else if (boardState[r][c] === opp) {
                score -= POSITION_WEIGHTS[r][c];
            }
        }
    }

    // Mobility (number of moves available)
    const myMoves = getValidMovesOnBoard(boardState, player).length;
    const oppMoves = getValidMovesOnBoard(boardState, opp).length;
    score += (myMoves - oppMoves) * 8;

    // Corner ownership bonus
    const corners = [[0,0],[0,7],[7,0],[7,7]];
    let myCorners = 0, oppCorners = 0;
    for (const [cr, cc] of corners) {
        if (boardState[cr][cc] === player) myCorners++;
        else if (boardState[cr][cc] === opp) oppCorners++;
    }
    score += (myCorners - oppCorners) * 50;

    // Edge stability
    const edges = [
        [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
        [7,1],[7,2],[7,3],[7,4],[7,5],[7,6],
        [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
        [1,7],[2,7],[3,7],[4,7],[5,7],[6,7]
    ];
    let myEdge = 0, oppEdge = 0;
    for (const [er, ec] of edges) {
        if (boardState[er][ec] === player) myEdge++;
        else if (boardState[er][ec] === opp) oppEdge++;
    }
    score += (myEdge - oppEdge) * 3;

    // Disc count (more important in late game)
    const counts = countDiscs(boardState);
    const totalDiscs = counts.black + counts.white;
    if (totalDiscs > 54) {
        // Endgame: disc count matters a lot
        const myCount = player === BLACK ? counts.black : counts.white;
        const oppCount = player === BLACK ? counts.white : counts.black;
        score += (myCount - oppCount) * 10;
    }

    return score;
}

/**
 * Minimax with alpha-beta pruning
 */
function minimax(boardState, depth, alpha, beta, maximizingPlayer, aiPlayer) {
    const moves = getValidMovesOnBoard(boardState, maximizingPlayer);

    if (depth === 0) {
        return { score: evaluate(boardState, aiPlayer), move: null };
    }

    // If no moves for current player, check opponent
    if (moves.length === 0) {
        const oppMoves = getValidMovesOnBoard(boardState, opponent(maximizingPlayer));
        if (oppMoves.length === 0) {
            // Game over
            const counts = countDiscs(boardState);
            const myCount = aiPlayer === BLACK ? counts.black : counts.white;
            const oppCount = aiPlayer === BLACK ? counts.white : counts.black;
            if (myCount > oppCount) return { score: 10000 + myCount, move: null };
            if (myCount < oppCount) return { score: -10000 - oppCount, move: null };
            return { score: 0, move: null };
        }
        // Pass turn
        return minimax(boardState, depth - 1, alpha, beta, opponent(maximizingPlayer), aiPlayer);
    }

    let bestMove = moves[0];

    if (maximizingPlayer === aiPlayer) {
        let maxScore = -Infinity;
        for (const move of moves) {
            const result = simulateMove(boardState, move.r, move.c, maximizingPlayer);
            if (!result) continue;
            const { score } = minimax(result.board, depth - 1, alpha, beta, opponent(maximizingPlayer), aiPlayer);
            if (score > maxScore) {
                maxScore = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return { score: maxScore, move: bestMove };
    } else {
        let minScore = Infinity;
        for (const move of moves) {
            const result = simulateMove(boardState, move.r, move.c, maximizingPlayer);
            if (!result) continue;
            const { score } = minimax(result.board, depth - 1, alpha, beta, opponent(maximizingPlayer), aiPlayer);
            if (score < minScore) {
                minScore = score;
                bestMove = move;
            }
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return { score: minScore, move: bestMove };
    }
}

/**
 * Get AI move based on difficulty
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 * @param {Array} boardState - current board
 * @param {number} aiPlayer - BLACK or WHITE
 * @returns {{ r, c } | null}
 */
export function getAIMove(difficulty, boardState, aiPlayer) {
    const moves = getValidMovesOnBoard(boardState, aiPlayer);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
        // Random valid move
        return moves[Math.floor(Math.random() * moves.length)];
    }

    const depth = difficulty === 'medium' ? 3 : 5;

    // For hard mode, add some heuristics for opening
    if (difficulty === 'hard') {
        const counts = countDiscs(boardState);
        const totalDiscs = counts.black + counts.white;
        if (totalDiscs <= 10) {
            // Early game: prefer moves that are not adjacent to corners
            const safeMoves = moves.filter(m => !isAdjacentToCorner(m.r, m.c) || isCorner(m.r, m.c));
            if (safeMoves.length > 0) {
                // Use minimax on safe moves
                let bestScore = -Infinity;
                let bestMove = safeMoves[0];
                for (const move of safeMoves) {
                    const result = simulateMove(boardState, move.r, move.c, aiPlayer);
                    if (!result) continue;
                    const { score } = minimax(result.board, depth - 1, -Infinity, Infinity, opponent(aiPlayer), aiPlayer);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = move;
                    }
                }
                return bestMove;
            }
        }
    }

    // Minimax search
    const result = minimax(boardState, depth, -Infinity, Infinity, aiPlayer, aiPlayer);
    return result.move || moves[0];
}

function isCorner(r, c) {
    return (r === 0 || r === 7) && (c === 0 || c === 7);
}

function isAdjacentToCorner(r, c) {
    const corners = [[0,0],[0,7],[7,0],[7,7]];
    for (const [cr, cc] of corners) {
        if (Math.abs(r - cr) <= 1 && Math.abs(c - cc) <= 1 && !(r === cr && c === cc)) {
            return true;
        }
    }
    return false;
}
