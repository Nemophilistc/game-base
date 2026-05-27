// ============================================================
// 泡泡堂 - AI 系统
// ============================================================

import { CELL, COLS, ROWS, TILE_EMPTY, TILE_HARD, TILE_SOFT, state, game } from './config.js';
import { placeBomb } from './bomb.js';

export function findNearestTarget(enemy) {
  let best = null;
  let bestDist = Infinity;
  if (state.player.alive) {
    const d = Math.abs(enemy.col - state.player.col) + Math.abs(enemy.row - state.player.row);
    if (d < bestDist) { bestDist = d; best = state.player; }
  }
  for (const e of state.enemies) {
    if (e === enemy || !e.alive) continue;
    const d = Math.abs(enemy.col - e.col) + Math.abs(enemy.row - e.row);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  return best ? { target: best, dist: bestDist } : null;
}

export function updateAI(enemy) {
  if (!enemy.alive) return;
  enemy.update();

  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const inDanger = isInBlastZoneHitbox(enemy);

  // === 最高优先级：逃跑 ===
  if (inDanger || enemy.aiState === 'flee') {
    if (!inDanger) {
      if (enemy.aiState === 'flee') {
        enemy._fleeFromCol = -1;
        enemy._fleeFromRow = -1;
        enemy._fleeStuck = false;
      }
      enemy.aiState = (state.bombs.length > 0 || state.explosions.length > 0) ? 'wait' : 'idle';
    } else {
      enemy.aiState = 'flee';
      const reachedNewCell = (enemy.col !== enemy._fleeFromCol || enemy.row !== enemy._fleeFromRow);
      const needRecalc = reachedNewCell || enemy._fleeStuck || enemy.aiDir < 0;
      if (needRecalc) {
        enemy._fleeFromCol = enemy.col;
        enemy._fleeFromRow = enemy.row;
        enemy._fleeStuck = false;
        const escapeDir = findEscapeDir(enemy);
        if (escapeDir >= 0) {
          enemy.aiDir = escapeDir;
        } else {
          let bestDir = -1, bestDist = -1;
          for (let d = 0; d < 4; d++) {
            const nc = enemy.col + dirs[d][0];
            const nr = enemy.row + dirs[d][1];
            if (isWalkableFor(nc, nr, enemy)) {
              let minD = Infinity;
              for (const bomb of state.bombs) minD = Math.min(minD, Math.abs(bomb.col - nc) + Math.abs(bomb.row - nr));
              if (minD > bestDist) { bestDist = minD; bestDir = d; }
            }
          }
          enemy.aiDir = bestDir >= 0 ? bestDir : enemy.aiDir;
        }
      }
      if (enemy.aiDir >= 0) {
        const oldX = enemy.x, oldY = enemy.y;
        tryMove(enemy, dirs[enemy.aiDir][0], dirs[enemy.aiDir][1]);
        if (enemy.x === oldX && enemy.y === oldY) {
          enemy._fleeStuck = true;
        }
      }
      return;
    }
  }

  // === 等待状态 ===
  if (enemy.aiState === 'wait') {
    if (inDanger) {
      enemy.aiState = 'flee';
    } else if (state.bombs.length === 0 && state.explosions.length === 0) {
      enemy.aiState = 'idle';
    }
    if (enemy.aiState === 'wait') return;
  }

  // === 以下：不在危险区 ===
  const hasActiveBomb = state.bombs.length > 0;
  function safeTryMove(e, dc, dr) {
    if (hasActiveBomb) {
      const nc = e.col + dc;
      const nr = e.row + dr;
      for (let dr2 = 0; dr2 <= 1; dr2++) {
        for (let dc2 = 0; dc2 <= 1; dc2++) {
          const tc = nc + dc2;
          const tr = nr + dr2;
          if (tc >= 0 && tc < COLS && tr >= 0 && tr < ROWS && isInBlastZone(tc, tr)) return false;
        }
      }
    }
    return tryMove(e, dc, dr);
  }

  const nearest = findNearestTarget(enemy);
  const nearSoftWall = hasAdjacentSoftWall(enemy.col, enemy.row);
  const attackRange = game.difficulty === 'hard' ? 10 : game.difficulty === 'normal' ? 8 : 6;
  const bombChance = game.difficulty === 'hard' ? 0.6 : game.difficulty === 'normal' ? 0.4 : 0.25;
  const destroyChance = game.difficulty === 'hard' ? 0.8 : game.difficulty === 'normal' ? 0.6 : 0.4;

  // 确定当前状态
  if (nearSoftWall) {
    enemy.aiState = 'destroy';
  } else if (nearest && nearest.dist <= attackRange) {
    enemy.aiState = 'attack';
    enemy.aiTarget = nearest.target;
  } else {
    enemy.aiState = 'seekWall';
  }

  // --- destroy ---
  if (enemy.aiState === 'destroy') {
    for (let d = 0; d < 4; d++) {
      const nc = enemy.col + dirs[d][0];
      const nr = enemy.row + dirs[d][1];
      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && state.map[nr][nc] === TILE_SOFT) {
        enemy.aiDir = d;
        break;
      }
    }
    if (enemy.canPlaceBomb() && Math.random() < destroyChance) {
      placeBomb(enemy);
      enemy.aiState = 'flee';
      enemy._fleeFromCol = enemy.col;
      enemy._fleeFromRow = enemy.row;
      const escapeDir = findEscapeDir(enemy);
      if (escapeDir >= 0) {
        enemy.aiDir = escapeDir;
      }
      tryMove(enemy, dirs[enemy.aiDir][0], dirs[enemy.aiDir][1]);
      return;
    }
    let moved = safeTryMove(enemy, dirs[enemy.aiDir][0], dirs[enemy.aiDir][1]);
    if (!moved && hasActiveBomb) {
      for (let d = 0; d < 4; d++) {
        const nc = enemy.col + dirs[d][0];
        const nr = enemy.row + dirs[d][1];
        if (canStep(enemy, dirs[d][0], dirs[d][1]) && !isInBlastZone(nc, nr)) {
          enemy.aiDir = d;
          safeTryMove(enemy, dirs[d][0], dirs[d][1]);
          break;
        }
      }
    }

  } else if (enemy.aiState === 'attack' && enemy.aiTarget) {
    // --- attack ---
    const dx = enemy.aiTarget.col - enemy.col;
    const dy = enemy.aiTarget.row - enemy.row;
    let moveDir = -1;
    if (Math.abs(dx) >= Math.abs(dy)) {
      moveDir = dx > 0 ? 3 : 2;
      if (!canStep(enemy, dirs[moveDir][0], dirs[moveDir][1]) || (hasActiveBomb && isInBlastZone(enemy.col + dirs[moveDir][0], enemy.row + dirs[moveDir][1]))) moveDir = dy > 0 ? 1 : 0;
    } else {
      moveDir = dy > 0 ? 1 : 0;
      if (!canStep(enemy, dirs[moveDir][0], dirs[moveDir][1]) || (hasActiveBomb && isInBlastZone(enemy.col + dirs[moveDir][0], enemy.row + dirs[moveDir][1]))) moveDir = dx > 0 ? 3 : 2;
    }
    if (!canStep(enemy, dirs[moveDir][0], dirs[moveDir][1]) || (hasActiveBomb && isInBlastZone(enemy.col + dirs[moveDir][0], enemy.row + dirs[moveDir][1]))) {
      let found = false;
      for (let d = 0; d < 4; d++) {
        if (canStep(enemy, dirs[d][0], dirs[d][1]) && !(hasActiveBomb && isInBlastZone(enemy.col + dirs[d][0], enemy.row + dirs[d][1]))) { moveDir = d; found = true; break; }
      }
      if (!found) moveDir = -1;
    }
    enemy.aiDir = moveDir;
    if (moveDir >= 0) safeTryMove(enemy, dirs[moveDir][0], dirs[moveDir][1]);

    if (enemy.canPlaceBomb() && nearest && nearest.dist <= 4 && hasAnyWalkableAdjacent(enemy) && Math.random() < bombChance) {
      placeBomb(enemy);
      enemy.aiState = 'flee';
      enemy._fleeFromCol = enemy.col;
      enemy._fleeFromRow = enemy.row;
      const escapeDir2 = findEscapeDir(enemy);
      if (escapeDir2 >= 0) {
        enemy.aiDir = escapeDir2;
        tryMove(enemy, dirs[escapeDir2][0], dirs[escapeDir2][1]);
      }
      return;
    }

  } else {
    // --- seekWall ---
    let dir = findNearestSoftWall(enemy.col, enemy.row);
    if (dir >= 0 && hasActiveBomb && isInBlastZone(enemy.col + dirs[dir][0], enemy.row + dirs[dir][1])) {
      let bestDir = -1, bestDist = -1;
      for (let d = 0; d < 4; d++) {
        const nc = enemy.col + dirs[d][0];
        const nr = enemy.row + dirs[d][1];
        if (canStep(enemy, dirs[d][0], dirs[d][1]) && !isInBlastZone(nc, nr)) {
          let minD = Infinity;
          for (const bomb of state.bombs) minD = Math.min(minD, Math.abs(bomb.col - nc) + Math.abs(bomb.row - nr));
          if (minD > bestDist) { bestDist = minD; bestDir = d; }
        }
      }
      if (bestDir >= 0) dir = bestDir;
    }
    if (dir >= 0) {
      enemy.aiDir = dir;
      safeTryMove(enemy, dirs[dir][0], dirs[dir][1]);
    }
  }
}

// --- 辅助函数 ---

function allHitboxCellsEmpty(x, y, dc, dr) {
  const halfSize = CELL * 0.35;
  if (dc !== 0) {
    const newX = dc > 0 ? x + halfSize : x - halfSize;
    const topR = Math.floor((y - halfSize) / CELL);
    const botR = Math.floor((y + halfSize) / CELL);
    const c = Math.floor(newX / CELL);
    if (c < 0 || c >= COLS) return false;
    if (topR < 0 || topR >= ROWS || state.map[topR][c] !== TILE_EMPTY) return false;
    if (botR < 0 || botR >= ROWS || state.map[botR][c] !== TILE_EMPTY) return false;
  }
  if (dr !== 0) {
    const newY = dr > 0 ? y + halfSize : y - halfSize;
    const leftC = Math.floor((x - halfSize) / CELL);
    const rightC = Math.floor((x + halfSize) / CELL);
    const r = Math.floor(newY / CELL);
    if (r < 0 || r >= ROWS) return false;
    if (leftC < 0 || leftC >= COLS || state.map[r][leftC] !== TILE_EMPTY) return false;
    if (rightC < 0 || rightC >= COLS || state.map[r][rightC] !== TILE_EMPTY) return false;
  }
  return true;
}

function tryMove(enemy, dc, dr) {
  const nextCol = enemy.col + dc;
  const nextRow = enemy.row + dr;
  const blocked = nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS ||
    state.map[nextRow][nextCol] !== TILE_EMPTY ||
    state.bombs.some(b => b.col === nextCol && b.row === nextRow && !enemy.passThroughBombs.has(b));
  if (blocked) return false;

  if (dc !== 0) {
    const centerRow = Math.round((enemy.y - CELL / 2) / CELL) * CELL + CELL / 2;
    enemy.y = centerRow;
  }
  if (dr !== 0) {
    const centerCol = Math.round((enemy.x - CELL / 2) / CELL) * CELL + CELL / 2;
    enemy.x = centerCol;
  }

  const spd = enemy.getSpeed();
  const testX = enemy.x + dc * spd;
  const testY = enemy.y + dr * spd;
  if (!allHitboxCellsEmpty(testX, testY, dc, dr)) {
    if (dc !== 0) {
      const centerRow = Math.round((enemy.y - CELL / 2) / CELL) * CELL + CELL / 2;
      if (Math.abs(centerRow - enemy.y) > 1) {
        enemy.y = centerRow;
        if (allHitboxCellsEmpty(enemy.x + dc * spd, enemy.y, dc, dr)) {
          const oldX = enemy.x, oldY = enemy.y;
          enemy.move(dc, dr);
          return (enemy.x !== oldX || enemy.y !== oldY);
        }
      }
    }
    if (dr !== 0) {
      const centerCol = Math.round((enemy.x - CELL / 2) / CELL) * CELL + CELL / 2;
      if (Math.abs(centerCol - enemy.x) > 1) {
        enemy.x = centerCol;
        if (allHitboxCellsEmpty(enemy.x, enemy.y + dr * spd, dc, dr)) {
          const oldX = enemy.x, oldY = enemy.y;
          enemy.move(dc, dr);
          return (enemy.x !== oldX || enemy.y !== oldY);
        }
      }
    }
    return false;
  }

  const oldX = enemy.x, oldY = enemy.y;
  enemy.move(dc, dr);
  return (enemy.x !== oldX || enemy.y !== oldY);
}

function canStep(enemy, dc, dr) {
  const nc = enemy.col + dc;
  const nr = enemy.row + dr;
  return nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS &&
    state.map[nr][nc] === TILE_EMPTY &&
    !state.bombs.some(b => b.col === nc && b.row === nr && !enemy.passThroughBombs.has(b));
}

function hasAdjacentSoftWall(col, row) {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dc, dr] of dirs) {
    const nc = col + dc, nr = row + dr;
    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && state.map[nr][nc] === TILE_SOFT) {
      return true;
    }
  }
  return false;
}

function findNearestSoftWall(col, row) {
  const visited = new Set();
  const queue = [[col, row, -1]];
  visited.add(`${col},${row}`);
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  while (queue.length > 0) {
    const [c, r, firstDir] = queue.shift();
    for (let d = 0; d < 4; d++) {
      const nc = c + dirs[d][0];
      const nr = r + dirs[d][1];
      const key = `${nc},${nr}`;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (visited.has(key)) continue;
      if (state.map[nr][nc] === TILE_HARD) continue;
      visited.add(key);
      const fd = firstDir === -1 ? d : firstDir;
      if (state.map[nr][nc] === TILE_SOFT) return fd;
      if (state.map[nr][nc] === TILE_EMPTY) queue.push([nc, nr, fd]);
    }
  }
  return -1;
}

function isInBlastZone(col, row) {
  for (const bomb of state.bombs) {
    if (bomb.col === col && Math.abs(bomb.row - row) <= bomb.range) {
      const step = bomb.row < row ? 1 : -1;
      let blocked = false;
      for (let r = bomb.row + step; r !== row + step; r += step) {
        if (r === row) break;
        if (state.map[r][col] === TILE_HARD || state.map[r][col] === TILE_SOFT) { blocked = true; break; }
      }
      if (!blocked) return true;
    }
    if (bomb.row === row && Math.abs(bomb.col - col) <= bomb.range) {
      const step = bomb.col < col ? 1 : -1;
      let blocked = false;
      for (let c = bomb.col + step; c !== col + step; c += step) {
        if (c === col) break;
        if (state.map[row][c] === TILE_HARD || state.map[row][c] === TILE_SOFT) { blocked = true; break; }
      }
      if (!blocked) return true;
    }
  }
  return false;
}

function isInBlastZoneHitbox(char) {
  const halfSize = CELL * 0.35;
  const corners = [
    [Math.floor((char.x - halfSize) / CELL), Math.floor((char.y - halfSize) / CELL)],
    [Math.floor((char.x + halfSize) / CELL), Math.floor((char.y - halfSize) / CELL)],
    [Math.floor((char.x - halfSize) / CELL), Math.floor((char.y + halfSize) / CELL)],
    [Math.floor((char.x + halfSize) / CELL), Math.floor((char.y + halfSize) / CELL)],
  ];
  for (const [c, r] of corners) {
    if (c >= 0 && c < COLS && r >= 0 && r < ROWS && isInBlastZone(c, r)) return true;
  }
  return false;
}

function findEscapeDir(char) {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const visited = new Set();
  const queue = [[char.col, char.row, -1]];
  visited.add(`${char.col},${char.row}`);

  function isSafeCell(c, r) {
    for (let dr = 0; dr <= 1; dr++) {
      for (let dc = 0; dc <= 1; dc++) {
        const tc = c + dc;
        const tr = r + dr;
        if (tc >= 0 && tc < COLS && tr >= 0 && tr < ROWS && isInBlastZone(tc, tr)) return false;
      }
    }
    return true;
  }

  while (queue.length > 0) {
    const [c, r, firstDir] = queue.shift();
    for (let d = 0; d < 4; d++) {
      const nc = c + dirs[d][0];
      const nr = r + dirs[d][1];
      const key = `${nc},${nr}`;
      if (visited.has(key)) continue;
      if (!isWalkableFor(nc, nr, char)) continue;
      visited.add(key);
      const fd = firstDir === -1 ? d : firstDir;
      if (isSafeCell(nc, nr)) return fd;
      queue.push([nc, nr, fd]);
    }
  }
  return -1;
}

function hasAnyWalkableAdjacent(enemy) {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dc, dr] of dirs) {
    const nc = enemy.col + dc;
    const nr = enemy.row + dr;
    if (isWalkableFor(nc, nr, enemy)) return true;
  }
  return false;
}

function isWalkableFor(c, r, char) {
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false;
  if (state.map[r][c] !== TILE_EMPTY) return false;
  for (const bomb of state.bombs) {
    if (bomb.col === c && bomb.row === r) {
      if (!char.passThroughBombs.has(bomb)) return false;
    }
  }
  return true;
}

