// bubbles.js - Bubble grid, matching logic, shooting
import {
  BUBBLE_RADIUS, BUBBLE_DIAMETER, COLS, ROW_HEIGHT, COL_WIDTH,
  GRID_OFFSET_X, GRID_OFFSET_Y, SHOOT_SPEED, MIN_MATCH,
  CANVAS_WIDTH, CANVAS_HEIGHT, GAME_OVER_Y,
  SPECIAL_NONE, SPECIAL_BOMB, SPECIAL_RAINBOW,
  getRandomBubble, getRandomColor, SCORE_POP, SCORE_FLOAT, BUBBLE_COLORS,
} from './config.js';
import { createPopParticles, createBombParticles, createRainbowParticles, createPopAnimation } from './effects.js';
import { playPop, playFall, playBomb, playCombo } from './sound.js';

// Get pixel position for a grid cell
export function getCellPos(row, col) {
  const offset = row % 2 === 1 ? BUBBLE_RADIUS : 0;
  return {
    x: GRID_OFFSET_X + col * COL_WIDTH + offset,
    y: GRID_OFFSET_Y + row * ROW_HEIGHT,
  };
}

// Get nearest grid cell from pixel position
export function getNearestCell(x, y) {
  const row = Math.round((y - GRID_OFFSET_Y) / ROW_HEIGHT);
  const offset = row % 2 === 1 ? BUBBLE_RADIUS : 0;
  const col = Math.round((x - GRID_OFFSET_X - offset) / COL_WIDTH);
  return { row, col };
}

// Initialize the grid with starting rows
export function initGrid(state) {
  state.grid = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    const maxCols = r % 2 === 1 ? COLS - 1 : COLS;
    for (let c = 0; c < maxCols; c++) {
      row.push({
        color: getRandomColor(state),
        special: SPECIAL_NONE,
      });
    }
    state.grid.push(row);
  }
}

// Ensure grid has enough rows
function ensureRow(state, row) {
  while (state.grid.length <= row) {
    const r = state.grid.length;
    const maxCols = r % 2 === 1 ? COLS - 1 : COLS;
    const newRow = [];
    for (let c = 0; c < maxCols; c++) {
      newRow.push(null);
    }
    state.grid.push(newRow);
  }
}

// Get neighbors of a cell (hex grid)
export function getNeighbors(row, col) {
  const neighbors = [];
  const even = row % 2 === 0;
  // Same row
  neighbors.push({ row, col: col - 1 });
  neighbors.push({ row, col: col + 1 });
  // Row above
  if (even) {
    neighbors.push({ row: row - 1, col: col - 1 });
    neighbors.push({ row: row - 1, col });
  } else {
    neighbors.push({ row: row - 1, col });
    neighbors.push({ row: row - 1, col: col + 1 });
  }
  // Row below
  if (even) {
    neighbors.push({ row: row + 1, col: col - 1 });
    neighbors.push({ row: row + 1, col });
  } else {
    neighbors.push({ row: row + 1, col });
    neighbors.push({ row: row + 1, col: col + 1 });
  }
  return neighbors.filter(n => {
    const maxCols = n.row % 2 === 1 ? COLS - 1 : COLS;
    return n.row >= 0 && n.col >= 0 && n.col < maxCols;
  });
}

// Get bubble at grid position
function getBubble(grid, row, col) {
  if (row < 0 || row >= grid.length) return null;
  if (!grid[row] || col < 0 || col >= grid[row].length) return null;
  return grid[row][col];
}

// Find connected same-color bubbles (flood fill)
function findMatchingCluster(grid, row, col) {
  const target = getBubble(grid, row, col);
  if (!target) return [];

  const visited = new Set();
  const cluster = [];
  const queue = [{ row, col }];

  while (queue.length > 0) {
    const { row: r, col: c } = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const bubble = getBubble(grid, r, c);
    if (!bubble) continue;

    // Match check: same color or rainbow target or bubble is rainbow
    const isMatch = bubble.special === SPECIAL_RAINBOW ||
                    target.special === SPECIAL_RAINBOW ||
                    bubble.color === target.color;
    if (!isMatch) continue;

    cluster.push({ row: r, col: c });

    const neighbors = getNeighbors(r, c);
    for (const n of neighbors) {
      if (!visited.has(`${n.row},${n.col}`)) {
        queue.push(n);
      }
    }
  }
  return cluster;
}

// Find all bubbles connected to the top row
function findConnectedToTop(grid) {
  const connected = new Set();
  const queue = [];

  // Start from all bubbles in row 0
  if (grid[0]) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[0][c]) {
        queue.push({ row: 0, col: c });
        connected.add(`0,${c}`);
      }
    }
  }

  while (queue.length > 0) {
    const { row, col } = queue.shift();
    const neighbors = getNeighbors(row, col);
    for (const n of neighbors) {
      const key = `${n.row},${n.col}`;
      if (connected.has(key)) continue;
      const bubble = getBubble(grid, n.row, n.col);
      if (bubble) {
        connected.add(key);
        queue.push(n);
      }
    }
  }
  return connected;
}

// Find bomb-affected area
function findBombArea(grid, row, col) {
  const area = [{ row, col }];
  const neighbors = getNeighbors(row, col);
  for (const n of neighbors) {
    if (getBubble(grid, n.row, n.col)) {
      area.push(n);
    }
  }
  return area;
}

// Place bubble and check for matches
export function placeBubble(state, row, col) {
  ensureRow(state, row);
  const maxCols = row % 2 === 1 ? COLS - 1 : COLS;
  if (col < 0 || col >= maxCols) return { popped: 0, fallen: 0 };

  const flying = state.flying;
  state.grid[row][col] = {
    color: flying.color,
    special: flying.special,
  };

  let allToRemove = [];

  // Handle special bubbles
  if (flying.special === SPECIAL_BOMB) {
    const bombArea = findBombArea(state.grid, row, col);
    allToRemove = bombArea;
    // Add bomb particles
    const pos = getCellPos(row, col);
    state.particles.push(...createBombParticles(pos.x, pos.y));
    playBomb();
  } else if (flying.special === SPECIAL_RAINBOW) {
    // Rainbow matches all adjacent colors
    const cluster = findMatchingCluster(state.grid, row, col);
    if (cluster.length >= MIN_MATCH) {
      allToRemove = cluster;
    }
  } else {
    const cluster = findMatchingCluster(state.grid, row, col);
    if (cluster.length >= MIN_MATCH) {
      allToRemove = cluster;
    }
  }

  let poppedCount = 0;
  let fallenCount = 0;

  // Remove matched bubbles
  if (allToRemove.length > 0) {
    // Combo system
    const now = Date.now();
    if (now - state.lastPopTime < 2000) {
      state.combo++;
    } else {
      state.combo = 1;
    }
    state.lastPopTime = now;

    if (state.combo > 1) {
      playCombo(state.combo);
    }

    for (const cell of allToRemove) {
      const pos = getCellPos(cell.row, cell.col);
      const bubble = getBubble(state.grid, cell.row, cell.col);
      if (bubble) {
        if (bubble.special === SPECIAL_RAINBOW) {
          state.particles.push(...createRainbowParticles(pos.x, pos.y));
        } else {
          state.particles.push(...createPopParticles(pos.x, pos.y, bubble.color));
        }
        state.popAnimations.push(createPopAnimation(pos.x, pos.y, bubble.color));
      }
      state.grid[cell.row][cell.col] = null;
      poppedCount++;
    }

    playPop();

    // Calculate score with combo multiplier
    const comboMultiplier = Math.min(state.combo, 5);
    state.score += poppedCount * SCORE_POP * comboMultiplier;

    // Find and drop floating clusters
    const connected = findConnectedToTop(state.grid);
    for (let r = 0; r < state.grid.length; r++) {
      if (!state.grid[r]) continue;
      for (let c = 0; c < state.grid[r].length; c++) {
        const key = `${r},${c}`;
        if (state.grid[r][c] && !connected.has(key)) {
          const pos = getCellPos(r, c);
          state.fallingBubbles.push({
            x: pos.x,
            y: pos.y,
            color: state.grid[r][c].color,
            special: state.grid[r][c].special,
            vy: 0,
            radius: BUBBLE_RADIUS,
          });
          state.grid[r][c] = null;
          fallenCount++;
        }
      }
    }

    if (fallenCount > 0) {
      state.score += fallenCount * SCORE_FLOAT * comboMultiplier;
      playFall();
    }

    // Clean up empty rows from the bottom
    trimGrid(state);
  }

  return { popped: poppedCount, fallen: fallenCount };
}

// Remove empty trailing rows
function trimGrid(state) {
  while (state.grid.length > 0) {
    const lastRow = state.grid[state.grid.length - 1];
    if (!lastRow || lastRow.every(b => b === null)) {
      state.grid.pop();
    } else {
      break;
    }
  }
}

// Check if game over (bubbles too low)
export function checkGameOver(state) {
  for (let r = 0; r < state.grid.length; r++) {
    if (!state.grid[r]) continue;
    for (let c = 0; c < state.grid[r].length; c++) {
      if (state.grid[r][c]) {
        const pos = getCellPos(r, c);
        if (pos.y + BUBBLE_RADIUS >= GAME_OVER_Y) {
          return true;
        }
      }
    }
  }
  return false;
}

// Add new row at the top
export function addNewRow(state) {
  // Shift all rows down
  state.grid.unshift(null);
  // Create new top row
  const maxCols = 0 % 2 === 0 ? COLS : COLS - 1;
  const newRow = [];
  for (let c = 0; c < maxCols; c++) {
    newRow.push({
      color: getRandomColor(state),
      special: SPECIAL_NONE,
    });
  }
  state.grid[0] = newRow;
}

// Shoot bubble
export function shootBubble(state) {
  if (state.flying || state.state !== 'playing') return;

  const shooter = state.shooter;
  state.flying = {
    x: shooter.x,
    y: shooter.y,
    vx: Math.cos(shooter.angle) * SHOOT_SPEED,
    vy: Math.sin(shooter.angle) * SHOOT_SPEED,
    color: shooter.current.color,
    special: shooter.current.special,
    radius: BUBBLE_RADIUS,
  };

  shooter.current = shooter.next;
  shooter.next = getRandomBubble(state);
}

// Update flying bubble
export function updateFlying(state) {
  if (!state.flying) return null;

  const f = state.flying;
  f.x += f.vx;
  f.y += f.vy;

  // Wall bounce
  if (f.x - BUBBLE_RADIUS <= 0) {
    f.x = BUBBLE_RADIUS;
    f.vx = Math.abs(f.vx);
  }
  if (f.x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
    f.x = CANVAS_WIDTH - BUBBLE_RADIUS;
    f.vx = -Math.abs(f.vx);
  }

  // Ceiling collision
  if (f.y - BUBBLE_RADIUS <= GRID_OFFSET_Y - ROW_HEIGHT) {
    const cell = getNearestCell(f.x, f.y);
    const result = placeBubble(state, cell.row, cell.col);
    state.flying = null;
    return result;
  }

  // Grid collision
  for (let r = 0; r < state.grid.length; r++) {
    if (!state.grid[r]) continue;
    for (let c = 0; c < state.grid[r].length; c++) {
      const bubble = state.grid[r][c];
      if (!bubble) continue;
      const pos = getCellPos(r, c);
      const dx = f.x - pos.x;
      const dy = f.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BUBBLE_DIAMETER * 0.9) {
        const cell = getNearestCell(f.x, f.y);
        const result = placeBubble(state, cell.row, cell.col);
        state.flying = null;
        return result;
      }
    }
  }

  // Off screen safety
  if (f.y > CANVAS_HEIGHT + 50) {
    state.flying = null;
    return null;
  }

  return null;
}

// Update falling bubbles
export function updateFallingBubbles(state, dt) {
  for (let i = state.fallingBubbles.length - 1; i >= 0; i--) {
    const b = state.fallingBubbles[i];
    b.vy += 0.5 * dt * 60;
    b.y += b.vy * dt * 60;
    b.radius *= 0.99;
    if (b.y > CANVAS_HEIGHT + 50 || b.radius < 1) {
      state.fallingBubbles.splice(i, 1);
    }
  }
}

// Get trajectory points for aiming line
export function getTrajectory(state, maxLength = 300) {
  const shooter = state.shooter;
  let x = shooter.x;
  let y = shooter.y;
  let vx = Math.cos(shooter.angle) * 4;
  let vy = Math.sin(shooter.angle) * 4;
  const points = [{ x, y }];
  let dist = 0;

  while (dist < maxLength) {
    x += vx;
    y += vy;
    dist += 4;

    // Wall bounce
    if (x - BUBBLE_RADIUS <= 0) { x = BUBBLE_RADIUS; vx = Math.abs(vx); }
    if (x + BUBBLE_RADIUS >= CANVAS_WIDTH) { x = CANVAS_WIDTH - BUBBLE_RADIUS; vx = -Math.abs(vx); }

    // Hit top
    if (y <= GRID_OFFSET_Y) break;

    // Hit a bubble
    let hit = false;
    for (let r = 0; r < state.grid.length; r++) {
      if (!state.grid[r]) continue;
      for (let c = 0; c < state.grid[r].length; c++) {
        if (!state.grid[r][c]) continue;
        const pos = getCellPos(r, c);
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < BUBBLE_DIAMETER * 0.9) {
          hit = true;
          break;
        }
      }
      if (hit) break;
    }
    if (hit) break;

    points.push({ x, y });
  }
  points.push({ x, y });
  return points;
}

// Draw a single bubble
export function drawBubble(ctx, x, y, color, special, radius = BUBBLE_RADIUS, alpha = 1) {
  ctx.globalAlpha = alpha;

  // Main circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (special === SPECIAL_RAINBOW) {
    // Rainbow gradient
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#FF88FF');
    grad.addColorStop(0.6, '#8888FF');
    grad.addColorStop(1, '#88FFFF');
    ctx.fillStyle = grad;
  } else if (special === SPECIAL_BOMB) {
    // Bomb bubble - dark with red glow
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    grad.addColorStop(0, '#666666');
    grad.addColorStop(0.7, '#333333');
    grad.addColorStop(1, '#111111');
    ctx.fillStyle = grad;
  } else {
    // Normal bubble with gradient
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    grad.addColorStop(0, lightenColor(color, 60));
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, darkenColor(color, 40));
    ctx.fillStyle = grad;
  }
  ctx.fill();

  // Highlight
  ctx.beginPath();
  ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * alpha})`;
  ctx.fill();

  // Special icons
  if (special === SPECIAL_BOMB) {
    // Bomb icon - explosion symbol
    ctx.fillStyle = `rgba(255, 60, 60, ${alpha})`;
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('*', x, y);
  } else if (special === SPECIAL_RAINBOW) {
    // Rainbow icon
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
    ctx.font = `bold ${radius * 0.9}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y);
  }

  ctx.globalAlpha = 1;
}

function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `rgb(${r},${g},${b})`;
}

// Draw the grid
export function drawGrid(ctx, state) {
  for (let r = 0; r < state.grid.length; r++) {
    if (!state.grid[r]) continue;
    for (let c = 0; c < state.grid[r].length; c++) {
      const bubble = state.grid[r][c];
      if (!bubble) continue;
      const pos = getCellPos(r, c);
      drawBubble(ctx, pos.x, pos.y, bubble.color, bubble.special);
    }
  }
}

// Draw falling bubbles
export function drawFallingBubbles(ctx, state) {
  for (const b of state.fallingBubbles) {
    drawBubble(ctx, b.x, b.y, b.color, b.special, b.radius, 0.7);
  }
}

// Draw the shooter
export function drawShooter(ctx, state) {
  const shooter = state.shooter;

  // Draw trajectory line
  if (state.state === 'playing' && !state.flying) {
    const points = getTrajectory(state);
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw aiming arrow
  if (state.state === 'playing') {
    const arrowLen = 40;
    const ax = shooter.x + Math.cos(shooter.angle) * arrowLen;
    const ay = shooter.y + Math.sin(shooter.angle) * arrowLen;
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(ax, ay);
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Arrow head
    const headLen = 10;
    const headAngle = 0.4;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - Math.cos(shooter.angle - headAngle) * headLen,
      ay - Math.sin(shooter.angle - headAngle) * headLen
    );
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - Math.cos(shooter.angle + headAngle) * headLen,
      ay - Math.sin(shooter.angle + headAngle) * headLen
    );
    ctx.stroke();
  }

  // Draw current bubble
  if (shooter.current) {
    drawBubble(ctx, shooter.x, shooter.y, shooter.current.color, shooter.current.special);
  }

  // Draw next bubble preview
  if (shooter.next) {
    ctx.globalAlpha = 0.7;
    drawBubble(ctx, shooter.x + 50, shooter.y + 10, shooter.next.color, shooter.next.special, BUBBLE_RADIUS * 0.7);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('下一个', shooter.x + 50, shooter.y + 30);
  }

  // Draw flying bubble
  if (state.flying) {
    const f = state.flying;
    // Trail
    ctx.beginPath();
    ctx.arc(f.x, f.y, BUBBLE_RADIUS + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    drawBubble(ctx, f.x, f.y, f.color, f.special);
  }
}
