// ============================================================
// main.js — 游戏初始化、事件监听、状态机
// ============================================================

import { WHITE, BLACK } from './config.js';
import { pieceColor, pieceType } from './pieces.js';
import { GameState } from './board.js';
import { ChessUI } from './ui.js';
import { generateLegalMoves, isInCheck, isCheckmate, isStalemate, isInsufficientMaterial, findKing } from './rules.js';
import { getBestMove, DIFFICULTY } from './ai.js';
import { playMoveSound, playCaptureSound, playCheckSound, playCheckmateSound, playCastleSound, playDrawSound, playPromotionSound, playUndoSound } from './sound.js';

// ============================================================
// 游戏状态
// ============================================================

let gameState = new GameState();
let ui = null;
let mode = 'pvp'; // 'pvp' | 'ai'
let aiDifficulty = 2;
let aiColor = BLACK;
let selectedSquare = null;
let pendingPromotion = null;
let isAIThinking = false;
let checkFlashInterval = null;

// ============================================================
// 初始化
// ============================================================

function init() {
  const canvas = document.getElementById('chess-canvas');
  const container = document.getElementById('board-container');
  ui = new ChessUI(canvas, container);

  setupEventListeners();
  startGame();
}

function setupEventListeners() {
  const canvas = document.getElementById('chess-canvas');

  // 棋盘点击
  canvas.addEventListener('click', onBoardClick);

  // 模式选择按钮
  document.getElementById('btn-pvp').addEventListener('click', () => {
    setMode('pvp');
  });
  document.getElementById('btn-ai').addEventListener('click', () => {
    setMode('ai');
  });

  // 难度选择
  document.getElementById('difficulty-select').addEventListener('change', (e) => {
    aiDifficulty = parseInt(e.target.value);
  });

  // 悔棋按钮
  document.getElementById('btn-undo').addEventListener('click', onUndo);

  // 重新开始按钮
  document.getElementById('btn-restart').addEventListener('click', onRestart);

  // 认输按钮
  document.getElementById('btn-resign').addEventListener('click', onResign);
}

// ============================================================
// 游戏流程
// ============================================================

function startGame() {
  gameState.reset();
  selectedSquare = null;
  pendingPromotion = null;
  isAIThinking = false;
  clearCheckFlash();
  ui.hideGameOver();
  render();
  updateStatus();
}

function setMode(m) {
  mode = m;
  document.getElementById('btn-pvp').classList.toggle('active', m === 'pvp');
  document.getElementById('btn-ai').classList.toggle('active', m === 'ai');
  document.getElementById('difficulty-panel').style.display = m === 'ai' ? 'flex' : 'none';
  onRestart();
}

// ============================================================
// 走子逻辑
// ============================================================

function onBoardClick(e) {
  if (gameState.gameOver || isAIThinking) return;
  if (pendingPromotion) return;

  // AI 回合时不响应点击
  if (mode === 'ai' && gameState.turn === aiColor) return;

  const rect = ui.canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const tile = ui.pixelToTile(px, py);
  if (!tile) return;

  const { r, c } = tile;
  const piece = gameState.board[r][c];

  if (selectedSquare) {
    // 已选中棋子，尝试走子
    const legalMoves = getLegalMovesForSelected();
    const move = legalMoves.find(m => m.toR === r && m.toC === c);

    if (move) {
      executeMoveWithPromotion(move);
      return;
    }

    // 点击自己的其他棋子，切换选中
    if (piece && pieceColor(piece) === gameState.turn) {
      selectSquare(r, c);
      render();
      return;
    }

    // 点击无效位置，取消选中
    deselectSquare();
    render();
    return;
  }

  // 未选中棋子，尝试选中
  if (piece && pieceColor(piece) === gameState.turn) {
    selectSquare(r, c);
    render();
  }
}

function selectSquare(r, c) {
  selectedSquare = { r, c };
  const legalMoves = generateLegalMoves(
    gameState.board, gameState.turn, gameState.enPassantTarget, gameState.castlingRights
  ).filter(m => m.fromR === r && m.fromC === c);

  ui.setSelected(r, c, legalMoves);
}

function deselectSquare() {
  selectedSquare = null;
  ui.setSelected(null, null, []);
}

function getLegalMovesForSelected() {
  if (!selectedSquare) return [];
  return generateLegalMoves(
    gameState.board, gameState.turn, gameState.enPassantTarget, gameState.castlingRights
  ).filter(m => m.fromR === selectedSquare.r && m.fromC === selectedSquare.c);
}

function executeMoveWithPromotion(move) {
  if (move.special === 'promotion') {
    pendingPromotion = move;
    ui.showPromotionUI(gameState.turn, (promotionPiece) => {
      move.promotionPiece = promotionPiece;
      pendingPromotion = null;
      executeMove(move);
    });
  } else {
    executeMove(move);
  }
}

function executeMove(move) {
  const captured = gameState.board[move.toR][move.toC];
  const isCapture = captured !== null || move.special === 'enPassant';
  const isCastle = move.special === 'castleK' || move.special === 'castleQ';

  gameState.makeMove(move);
  deselectSquare();

  // 音效
  if (isCastle) {
    playCastleSound();
  } else if (move.special === 'promotion') {
    playPromotionSound();
  } else if (isCapture) {
    playCaptureSound();
  } else {
    playMoveSound();
  }

  ui.setLastMove({ fromR: move.fromR, fromC: move.fromC, toR: move.toR, toC: move.toC });

  // 检测游戏结束
  const gameEnd = checkGameEnd();
  if (gameEnd) {
    render();
    return;
  }

  // 检测将军
  const opponentColor = gameState.turn;
  if (isInCheck(gameState.board, opponentColor)) {
    playCheckSound();
    const king = findKing(gameState.board, opponentColor);
    ui.setCheck(king.r, king.c);
    startCheckFlash();
  } else {
    ui.setCheck(null, null);
    clearCheckFlash();
  }

  render();

  // AI 回合
  if (mode === 'ai' && gameState.turn === aiColor && !gameState.gameOver) {
    setTimeout(doAIMove, 300);
  }
}

function checkGameEnd() {
  const color = gameState.turn;
  const legalMoves = generateLegalMoves(
    gameState.board, color, gameState.enPassantTarget, gameState.castlingRights
  );

  if (legalMoves.length === 0) {
    if (isInCheck(gameState.board, color)) {
      // 将杀
      const winner = color === WHITE ? BLACK : WHITE;
      gameState.setGameOver('checkmate', winner);
      playCheckmateSound();
      ui.showGameOver('checkmate', winner, onRestart);
      return true;
    } else {
      // 逼和
      gameState.setGameOver('stalemate');
      playDrawSound();
      ui.showGameOver('stalemate', null, onRestart);
      return true;
    }
  }

  if (isInsufficientMaterial(gameState.board)) {
    gameState.setGameOver('draw');
    playDrawSound();
    ui.showGameOver('draw', null, onRestart);
    return true;
  }

  if (gameState.halfMoveClock >= 100) {
    gameState.setGameOver('draw');
    playDrawSound();
    ui.showGameOver('draw', null, onRestart);
    return true;
  }

  // 三次重复
  const currentHash = (() => {
    const boardStr = gameState.board.map(row =>
      row.map(p => p || '--').join(',')
    ).join('|');
    const epStr = gameState.enPassantTarget ? `${gameState.enPassantTarget.r},${gameState.enPassantTarget.c}` : '-';
    const castStr = `${gameState.castlingRights.wK?1:0}${gameState.castlingRights.wQ?1:0}${gameState.castlingRights.bK?1:0}${gameState.castlingRights.bQ?1:0}`;
    return `${boardStr}|${gameState.turn}|${castStr}|${epStr}`;
  })();
  if (gameState.positionCounts[currentHash] >= 3) {
    gameState.setGameOver('draw');
    playDrawSound();
    ui.showGameOver('draw', null, onRestart);
    return true;
  }

  return false;
}

// ============================================================
// AI 走子
// ============================================================

function doAIMove() {
  if (gameState.gameOver) return;

  isAIThinking = true;
  updateStatus('AI 思考中...');

  // 使用 setTimeout 让 UI 有机会更新
  setTimeout(() => {
    const move = getBestMove(gameState, aiDifficulty);
    isAIThinking = false;

    if (!move) return;

    executeMove(move);
  }, 50);
}

// ============================================================
// 控制按钮
// ============================================================

function onUndo() {
  if (isAIThinking) return;
  if (gameState.gameOver) {
    // 游戏结束后悔棋需要重新打开游戏
    gameState.gameOver = false;
    gameState.gameResult = null;
    gameState.winner = null;
    ui.hideGameOver();
  }

  if (mode === 'ai') {
    // 人机模式悔两步
    gameState.undoTwoMoves();
  } else {
    gameState.undoMove();
  }

  deselectSquare();
  ui.setCheck(null, null);
  clearCheckFlash();
  ui.setLastMove(null);
  playUndoSound();
  render();
  updateStatus();
}

function onRestart() {
  startGame();
}

function onResign() {
  if (gameState.gameOver || isAIThinking) return;
  const winner = gameState.turn === WHITE ? BLACK : WHITE;
  gameState.setGameOver('resign', winner);
  ui.showGameOver('resign', winner, onRestart);
}

// ============================================================
// 渲染 & 更新
// ============================================================

function render() {
  ui.render(gameState.board);
  const historyTexts = gameState.getMoveHistory();
  ui.updateMoveHistory(historyTexts);
  ui.setTurnIndicator(gameState.turn);
}

function updateStatus(extra) {
  const el = document.getElementById('status-text');
  if (!el) return;

  if (extra) {
    el.textContent = extra;
    return;
  }

  if (gameState.gameOver) {
    if (gameState.gameResult === 'checkmate') {
      const winnerName = gameState.winner === WHITE ? '白方' : '黑方';
      el.textContent = `将杀！${winnerName}获胜`;
    } else if (gameState.gameResult === 'stalemate') {
      el.textContent = '逼和！和棋';
    } else if (gameState.gameResult === 'draw') {
      el.textContent = '和棋';
    } else if (gameState.gameResult === 'resign') {
      const winnerName = gameState.winner === WHITE ? '白方' : '黑方';
      el.textContent = `认输，${winnerName}获胜`;
    }
    return;
  }

  const turnName = gameState.turn === WHITE ? '白方' : '黑方';
  const checkStr = isInCheck(gameState.board, gameState.turn) ? ' (将军!)' : '';
  el.textContent = `${turnName}走棋${checkStr}`;
}

// 将军闪烁
function startCheckFlash() {
  clearCheckFlash();
  checkFlashInterval = setInterval(() => {
    render();
  }, 200);
}

function clearCheckFlash() {
  if (checkFlashInterval) {
    clearInterval(checkFlashInterval);
    checkFlashInterval = null;
  }
}

// ============================================================
// 启动
// ============================================================

document.addEventListener('DOMContentLoaded', init);
