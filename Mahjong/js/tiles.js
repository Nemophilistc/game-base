// tiles.js - Tile definitions, matching logic, layout generation

import { DIFFICULTY } from './config.js';

// Mahjong tile definitions
export const TILE_DEFS = [
  { cat: '万', val: '1万' }, { cat: '万', val: '2万' }, { cat: '万', val: '3万' },
  { cat: '万', val: '4万' }, { cat: '万', val: '5万' }, { cat: '万', val: '6万' },
  { cat: '万', val: '7万' }, { cat: '万', val: '8万' }, { cat: '万', val: '9万' },
  { cat: '条', val: '1条' }, { cat: '条', val: '2条' }, { cat: '条', val: '3条' },
  { cat: '条', val: '4条' }, { cat: '条', val: '5条' }, { cat: '条', val: '6条' },
  { cat: '条', val: '7条' }, { cat: '条', val: '8条' }, { cat: '条', val: '9条' },
  { cat: '筒', val: '1筒' }, { cat: '筒', val: '2筒' }, { cat: '筒', val: '3筒' },
  { cat: '筒', val: '4筒' }, { cat: '筒', val: '5筒' }, { cat: '筒', val: '6筒' },
  { cat: '筒', val: '7筒' }, { cat: '筒', val: '8筒' }, { cat: '筒', val: '9筒' },
  { cat: '风', val: '东' },   { cat: '风', val: '南' },   { cat: '风', val: '西' },
  { cat: '风', val: '北' },
  { cat: '箭', val: '中' },   { cat: '箭', val: '发' },   { cat: '箭', val: '白' },
];

export const CAT_COLORS = {
  '万': '#c0392b', '条': '#27ae60', '筒': '#2980b9',
  '风': '#8e44ad', '箭': '#d35400'
};

// --- Shuffle helper ---
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Layout generators ---
// Each returns: { positions: [{r,c}...], cols, rows }
// positions count must be >= pairs * 2 (each pair = 2 tiles at DIFFERENT positions)

function layoutPyramid(numPairs) {
  // Scale grid based on needed pairs
  const cols = numPairs <= 20 ? 10 : numPairs <= 40 ? 14 : 18;
  const rows = numPairs <= 20 ? 8  : numPairs <= 40 ? 10 : 12;
  const positions = [];
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.min(cx, cy) + 0.5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dr = Math.abs(r - cy) / maxDist;
      const dc = Math.abs(c - cx) / maxDist;
      if (dr + dc <= 1.0) {
        positions.push({ r, c });
      }
    }
  }
  return trimPositions(positions, numPairs, cols, rows);
}

function layoutTurtle(numPairs) {
  const cols = numPairs <= 20 ? 10 : numPairs <= 40 ? 14 : 18;
  const rows = numPairs <= 20 ? 8  : numPairs <= 40 ? 10 : 12;
  const positions = [];
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dr = (r - cy) / (rows / 2);
      const dc = (c - cx) / (cols / 2);
      const dist = dr * dr + dc * dc;
      if (dist < 0.82) positions.push({ r, c });
    }
  }
  // Add head bumps
  const headC = Math.floor(cols / 2);
  positions.push({ r: 0, c: headC - 1 }, { r: 0, c: headC }, { r: 0, c: headC + 1 });
  positions.push({ r: rows - 1, c: headC - 1 }, { r: rows - 1, c: headC }, { r: rows - 1, c: headC + 1 });
  // Deduplicate
  const seen = new Set();
  const unique = positions.filter(p => {
    const k = `${p.r},${p.c}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  return trimPositions(unique, numPairs, cols, rows);
}

function layoutDiamond(numPairs) {
  const cols = numPairs <= 20 ? 10 : numPairs <= 40 ? 14 : 18;
  const rows = numPairs <= 20 ? 8  : numPairs <= 40 ? 10 : 12;
  const positions = [];
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dr = Math.abs(r - cy) / (rows / 2);
      const dc = Math.abs(c - cx) / (cols / 2);
      if (dr + dc <= 0.95) positions.push({ r, c });
    }
  }
  return trimPositions(positions, numPairs, cols, rows);
}

function layoutRandom(numPairs) {
  const cols = numPairs <= 20 ? 10 : numPairs <= 40 ? 14 : 18;
  const rows = numPairs <= 20 ? 8  : numPairs <= 40 ? 10 : 12;
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.78) positions.push({ r, c });
    }
  }
  // Ensure enough
  while (positions.length < numPairs * 2) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!positions.some(p => p.r === r && p.c === c)) {
      positions.push({ r, c });
    }
  }
  return trimPositions(positions, numPairs, cols, rows);
}

function trimPositions(positions, numPairs, cols, rows) {
  shuffle(positions);
  // Need numPairs * 2 positions (each pair gets 2 distinct cells)
  const needed = numPairs * 2;
  if (positions.length < needed) {
    // Should not happen with correct grid sizing, but pad just in case
    const used = new Set(positions.map(p => `${p.r},${p.c}`));
    while (positions.length < needed) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const k = `${r},${c}`;
      if (!used.has(k)) {
        positions.push({ r, c });
        used.add(k);
      }
    }
  }
  return { positions: positions.slice(0, needed), cols, rows };
}

// --- Generate grid ---

export function generateGrid(layoutName, diffName) {
  const diff = DIFFICULTY[diffName];
  const numPairs = diff.pairs;
  const numTypes = diff.types;

  let result;
  switch (layoutName) {
    case 'pyramid': result = layoutPyramid(numPairs); break;
    case 'turtle':  result = layoutTurtle(numPairs); break;
    case 'diamond': result = layoutDiamond(numPairs); break;
    default:        result = layoutRandom(numPairs); break;
  }

  const { positions, cols, rows } = result;
  const actualPairs = numPairs;

  // Select tile types and create pair definitions
  const selectedDefs = TILE_DEFS.slice(0, Math.min(numTypes, TILE_DEFS.length));
  const pairDefs = [];
  for (let i = 0; i < actualPairs; i++) {
    pairDefs.push(selectedDefs[i % selectedDefs.length]);
  }

  // Create flat tile list: each pair gets 2 consecutive positions
  const tiles = [];
  for (let i = 0; i < actualPairs; i++) {
    const def = pairDefs[i];
    const pos1 = positions[i * 2];
    const pos2 = positions[i * 2 + 1];
    tiles.push({
      id: i * 2, def,
      r: pos1.r, c: pos1.c,
      removed: false, selected: false, hinted: false,
      animAlpha: 1, animScale: 1,
      removing: false, removeTime: 0
    });
    tiles.push({
      id: i * 2 + 1, def,
      r: pos2.r, c: pos2.c,
      removed: false, selected: false, hinted: false,
      animAlpha: 1, animScale: 1,
      removing: false, removeTime: 0
    });
  }

  return { tiles, cols, rows };
}

// --- Path finding (max 2 turns) ---

function isLineClear(r1, c1, r2, c2, tiles) {
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (const t of tiles) {
      if (t.removed || t.removing) continue;
      if (t.r === r1 && t.c > minC && t.c < maxC) return false;
    }
    return true;
  }
  if (c1 === c2) {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (const t of tiles) {
      if (t.removed || t.removing) continue;
      if (t.c === c1 && t.r > minR && t.r < maxR) return false;
    }
    return true;
  }
  return false;
}

function isPointOccupied(r, c, tiles) {
  return tiles.some(t => !t.removed && !t.removing && t.r === r && t.c === c);
}

export function findPath(tile1, tile2, tiles, gridCols, gridRows) {
  if (tile1.id === tile2.id) return null;
  if (tile1.def.val !== tile2.def.val) return null;

  const r1 = tile1.r, c1 = tile1.c;
  const r2 = tile2.r, c2 = tile2.c;

  // 0 turns
  if ((r1 === r2 || c1 === c2) && isLineClear(r1, c1, r2, c2, tiles)) {
    return [{ r: r1, c: c1 }, { r: r2, c: c2 }];
  }

  // 1 turn at (r1, c2)
  if (!isPointOccupied(r1, c2, tiles) &&
      isLineClear(r1, c1, r1, c2, tiles) &&
      isLineClear(r1, c2, r2, c2, tiles)) {
    return [{ r: r1, c: c1 }, { r: r1, c: c2 }, { r: r2, c: c2 }];
  }
  // 1 turn at (r2, c1)
  if (!isPointOccupied(r2, c1, tiles) &&
      isLineClear(r1, c1, r2, c1, tiles) &&
      isLineClear(r2, c1, r2, c2, tiles)) {
    return [{ r: r1, c: c1 }, { r: r2, c: c1 }, { r: r2, c: c2 }];
  }

  // 2 turns - horizontal sweep
  for (let c = -1; c <= gridCols; c++) {
    if (c === c1 && c === c2) continue;
    // Path: (r1,c1)->(r1,c)->(r2,c)->(r2,c2)
    const mid1Free = c === c1 || !isPointOccupied(r1, c, tiles);
    const mid2Free = c === c2 || !isPointOccupied(r2, c, tiles);
    if (mid1Free && mid2Free &&
        isLineClear(r1, c1, r1, c, tiles) &&
        isLineClear(r1, c, r2, c, tiles) &&
        isLineClear(r2, c, r2, c2, tiles)) {
      // Build path with deduplication
      const pts = [{ r: r1, c: c1 }];
      if (c !== c1) pts.push({ r: r1, c });
      if (r2 !== r1) pts.push({ r: r2, c });
      if (c2 !== c) pts.push({ r: r2, c: c2 });
      if (pts.length >= 2) return pts;
    }
  }

  // 2 turns - vertical sweep
  for (let r = -1; r <= gridRows; r++) {
    if (r === r1 && r === r2) continue;
    // Path: (r1,c1)->(r,c1)->(r,c2)->(r2,c2)
    const mid1Free = r === r1 || !isPointOccupied(r, c1, tiles);
    const mid2Free = r === r2 || !isPointOccupied(r, c2, tiles);
    if (mid1Free && mid2Free &&
        isLineClear(r1, c1, r, c1, tiles) &&
        isLineClear(r, c1, r, c2, tiles) &&
        isLineClear(r, c2, r2, c2, tiles)) {
      // Build path with deduplication
      const pts = [{ r: r1, c: c1 }];
      if (r !== r1) pts.push({ r, c: c1 });
      if (c2 !== c1) pts.push({ r, c: c2 });
      if (r2 !== r) pts.push({ r: r2, c: c2 });
      if (pts.length >= 2) return pts;
    }
  }

  return null;
}

export function findHintPair(tiles, gridCols, gridRows) {
  const active = tiles.filter(t => !t.removed && !t.removing);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (active[i].def.val === active[j].def.val) {
        const path = findPath(active[i], active[j], tiles, gridCols, gridRows);
        if (path) return { t1: active[i], t2: active[j], path };
      }
    }
  }
  return null;
}

export function shuffleTiles(tiles) {
  const active = tiles.filter(t => !t.removed && !t.removing);
  if (active.length === 0) return;
  const defs = active.map(t => t.def);
  shuffle(defs);
  active.forEach((t, i) => {
    t.def = defs[i];
    t.hinted = false;
  });
}

export function hasValidMoves(tiles, gridCols, gridRows) {
  return findHintPair(tiles, gridCols, gridRows) !== null;
}
