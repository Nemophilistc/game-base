// ============================================================
// board.js - 棋盘逻辑：交换、匹配检测、消除、下落、填充
// ============================================================

import { GRID_ROWS, GRID_COLS, SPECIAL, BASE_SCORE_PER_GEM, CHAIN_MULTIPLIERS } from './config.js';
import { Gem, randomGemType } from './gems.js';

export class Board {
  constructor(colorCount = 7) {
    this.colorCount = colorCount;
    this.grid = [];           // grid[row][col] = Gem | null
    this.chainLevel = 0;      // 当前连锁等级
    this.pendingSpecials = []; // 本轮待生成的特殊宝石 [{row,col,special}]
    this.clearStats = {};     // 消除统计 { colorId: count }
  }

  // --- 初始化棋盘（无初始匹配） ---
  init() {
    this.grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const gem = new Gem(this._safeRandomType(r, c));
        gem.row = r;
        gem.col = c;
        this.grid[r][c] = gem;
      }
    }
    this.chainLevel = 0;
    this.clearStats = {};
    return this.grid;
  }

  // 生成不会造成初始匹配的颜色
  _safeRandomType(r, c) {
    let type;
    let attempts = 0;
    do {
      type = randomGemType(this.colorCount);
      attempts++;
    } while (attempts < 50 && this._wouldMatch(r, c, type));
    return type;
  }

  _wouldMatch(r, c, type) {
    // 检查左边两个
    if (c >= 2 &&
        this.grid[r][c - 1] && this.grid[r][c - 1].type === type &&
        this.grid[r][c - 2] && this.grid[r][c - 2].type === type) {
      return true;
    }
    // 检查上面两个
    if (r >= 2 &&
        this.grid[r - 1] && this.grid[r - 1][c] && this.grid[r - 1][c].type === type &&
        this.grid[r - 2] && this.grid[r - 2][c] && this.grid[r - 2][c].type === type) {
      return true;
    }
    return false;
  }

  // --- 获取宝石 ---
  getGem(r, c) {
    if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return null;
    return this.grid[r][c];
  }

  // --- 交换两个宝石 ---
  swap(r1, c1, r2, c2) {
    const gem1 = this.grid[r1][c1];
    const gem2 = this.grid[r2][c2];
    if (!gem1 || !gem2) return false;
    this.grid[r1][c1] = gem2;
    this.grid[r2][c2] = gem1;
    gem1.row = r2; gem1.col = c2;
    gem2.row = r1; gem2.col = c1;
    return true;
  }

  // 检查两个位置是否相邻
  isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
  }

  // --- 匹配检测 ---
  // 返回所有匹配组 [{ cells: [{r,c}...], length, shape }]
  findAllMatches() {
    const hRuns = this._findHorizontalRuns();
    const vRuns = this._findVerticalRuns();
    // 合并重叠的横纵匹配，形成L/T/十字形
    return this._mergeMatches(hRuns, vRuns);
  }

  _findHorizontalRuns() {
    const runs = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      let c = 0;
      while (c < GRID_COLS) {
        const gem = this.grid[r][c];
        if (!gem) { c++; continue; }
        const type = gem.type;
        let end = c + 1;
        while (end < GRID_COLS && this.grid[r][end] && this.grid[r][end].type === type) {
          end++;
        }
        const len = end - c;
        if (len >= 3) {
          const cells = [];
          for (let k = c; k < end; k++) cells.push({ r, c: k });
          runs.push({ cells, length: len, dir: 'h' });
        }
        c = end;
      }
    }
    return runs;
  }

  _findVerticalRuns() {
    const runs = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let r = 0;
      while (r < GRID_ROWS) {
        const gem = this.grid[r][c];
        if (!gem) { r++; continue; }
        const type = gem.type;
        let end = r + 1;
        while (end < GRID_ROWS && this.grid[end][c] && this.grid[end][c].type === type) {
          end++;
        }
        const len = end - r;
        if (len >= 3) {
          const cells = [];
          for (let k = r; k < end; k++) cells.push({ r: k, c });
          runs.push({ cells, length: len, dir: 'v' });
        }
        r = end;
      }
    }
    return runs;
  }

  // 合并横纵匹配，检测L/T/十字形
  _mergeMatches(hRuns, vRuns) {
    const allRuns = [...hRuns, ...vRuns];
    if (allRuns.length === 0) return [];

    // 建立cell -> run索引
    const cellMap = new Map(); // "r,c" -> [runIndex...]
    allRuns.forEach((run, idx) => {
      run.cells.forEach(({ r, c }) => {
        const key = `${r},${c}`;
        if (!cellMap.has(key)) cellMap.set(key, []);
        cellMap.get(key).push(idx);
      });
    });

    // 合并有共享cell的run
    const used = new Set();
    const merged = [];

    for (let i = 0; i < allRuns.length; i++) {
      if (used.has(i)) continue;
      used.add(i);

      const group = new Set();
      const queue = [i];
      const dirs = new Set();
      let maxLen = allRuns[i].length;

      while (queue.length > 0) {
        const idx = queue.shift();
        dirs.add(allRuns[idx].dir);
        maxLen = Math.max(maxLen, allRuns[idx].length);
        allRuns[idx].cells.forEach(({ r, c }) => {
          const key = `${r},${c}`;
          group.add(key);
          const neighbors = cellMap.get(key) || [];
          for (const ni of neighbors) {
            if (!used.has(ni)) {
              used.add(ni);
              queue.push(ni);
            }
          }
        });
      }

      const cells = [...group].map(k => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      });

      // 判断形状
      let shape = 'line';
      if (dirs.size > 1) {
        shape = 'lt';  // L/T形
      } else if (maxLen >= 5) {
        shape = 'five';
      } else if (maxLen >= 4) {
        shape = 'four';
      }

      merged.push({ cells, length: cells.length, shape, maxRunLen: maxLen });
    }

    return merged;
  }

  // --- 消除匹配的宝石 ---
  // 返回 { cleared: [{r,c,color}], specials, totalScore, multiplier, totalCleared }
  clearMatches(matches) {
    this.pendingSpecials = [];
    const toClear = new Set();
    let totalCleared = 0;
    const cleared = [];

    for (const match of matches) {
      // 决定特殊宝石生成位置和类型
      let special = SPECIAL.NONE;
      let specialPos = null;

      if (match.shape === 'lt') {
        special = SPECIAL.RANGE;
        specialPos = this._findIntersection(match);
      } else if (match.shape === 'five') {
        special = SPECIAL.RAINBOW;
        specialPos = match.cells[Math.floor(match.cells.length / 2)];
      } else if (match.shape === 'four') {
        special = SPECIAL.CROSS;
        specialPos = match.cells[Math.floor(match.cells.length / 2)];
      }

      for (const { r, c } of match.cells) {
        const key = `${r},${c}`;
        if (!toClear.has(key)) {
          toClear.add(key);
          const gem = this.grid[r][c];
          if (gem) {
            this.clearStats[gem.type] = (this.clearStats[gem.type] || 0) + 1;
            cleared.push({ r, c, color: gem.color, type: gem.type });
            if (gem.special !== SPECIAL.NONE) {
              this._activateSpecial(gem, toClear, cleared);
            }
          }
          totalCleared++;
        }
      }

      // 在匹配位置放置特殊宝石
      if (special !== SPECIAL.NONE && specialPos) {
        this.pendingSpecials.push({
          r: specialPos.r,
          c: specialPos.c,
          special,
          type: this.grid[specialPos.r]?.[specialPos.c]?.type ?? 0,
        });
      }
    }

    // 清除宝石
    for (const key of toClear) {
      const [r, c] = key.split(',').map(Number);
      this.grid[r][c] = null;
    }

    const multiplier = CHAIN_MULTIPLIERS[Math.min(this.chainLevel, CHAIN_MULTIPLIERS.length - 1)];
    const finalCount = cleared.length;
    const totalScore = finalCount * BASE_SCORE_PER_GEM * multiplier;

    return { cleared, specials: this.pendingSpecials, totalScore, multiplier, totalCleared: finalCount };
  }

  // 查找L/T形的交叉点
  _findIntersection(match) {
    // 选择有最多邻居的cell
    const cellSet = new Set(match.cells.map(({ r, c }) => `${r},${c}`));
    let best = match.cells[0];
    let bestCount = -1;
    for (const { r, c } of match.cells) {
      let count = 0;
      const neighbors = [
        { r: r - 1, c }, { r: r + 1, c },
        { r, c: c - 1 }, { r, c: c + 1 },
      ];
      for (const n of neighbors) {
        if (cellSet.has(`${n.r},${n.c}`)) count++;
      }
      if (count > bestCount) {
        bestCount = count;
        best = { r, c };
      }
    }
    return best;
  }

  // 激活特殊宝石效果
  _activateSpecial(gem, toClear, cleared) {
    const { row: r, col: c, special } = gem;
    const addCell = (nr, nc) => {
      const key = `${nr},${nc}`;
      if (!toClear.has(key) && nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        toClear.add(key);
        const g = this.grid[nr][nc];
        if (g) {
          this.clearStats[g.type] = (this.clearStats[g.type] || 0) + 1;
          cleared.push({ r: nr, c: nc, color: g.color, type: g.type });
        }
      }
    };

    if (special === SPECIAL.CROSS) {
      for (let k = 0; k < GRID_COLS; k++) addCell(r, k);
      for (let k = 0; k < GRID_ROWS; k++) addCell(k, c);
    } else if (special === SPECIAL.RANGE) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          addCell(r + dr, c + dc);
        }
      }
    } else if (special === SPECIAL.RAINBOW) {
      const targetType = gem.type;
      for (let rr = 0; rr < GRID_ROWS; rr++) {
        for (let cc = 0; cc < GRID_COLS; cc++) {
          if (this.grid[rr][cc] && this.grid[rr][cc].type === targetType) {
            addCell(rr, cc);
          }
        }
      }
    }
  }

  // 处理彩虹宝石被交换时触发
  activateRainbowAt(r, c, targetType) {
    const toClear = new Set();
    toClear.add(`${r},${c}`);
    for (let rr = 0; rr < GRID_ROWS; rr++) {
      for (let cc = 0; cc < GRID_COLS; cc++) {
        const g = this.grid[rr][cc];
        if (g && g.type === targetType) {
          toClear.add(`${rr},${cc}`);
        }
      }
    }
    // 清除
    const cleared = [];
    for (const key of toClear) {
      const [cr, cc] = key.split(',').map(Number);
      const gem = this.grid[cr][cc];
      if (gem) {
        this.clearStats[gem.type] = (this.clearStats[gem.type] || 0) + 1;
        cleared.push({ r: cr, c: cc, color: gem.color, type: gem.type });
      } else {
        cleared.push({ r: cr, c: cc, color: '#fff', type: 0 });
      }
      this.grid[cr][cc] = null;
    }
    const multiplier = CHAIN_MULTIPLIERS[Math.min(this.chainLevel, CHAIN_MULTIPLIERS.length - 1)];
    const totalScore = cleared.length * BASE_SCORE_PER_GEM * multiplier;
    return { cleared, totalScore, multiplier, totalCleared: cleared.length };
  }

  // --- 放置特殊宝石到棋盘 ---
  placeSpecials() {
    for (const sp of this.pendingSpecials) {
      const { r, c, special, type } = sp;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const gem = new Gem(type, special);
        gem.row = r;
        gem.col = c;
        gem.spawning = true;
        this.grid[r][c] = gem;
      }
    }
    this.pendingSpecials = [];
  }

  // --- 重力下落 ---
  // 返回下落信息 [{ fromR, toR, c, gem }]
  applyGravity() {
    const drops = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let writeRow = GRID_ROWS - 1;
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          if (r !== writeRow) {
            const gem = this.grid[r][c];
            drops.push({ fromR: r, toR: writeRow, c, gem });
            this.grid[writeRow][c] = gem;
            this.grid[r][c] = null;
            gem.row = writeRow;
            gem.col = c;
          }
          writeRow--;
        }
      }
    }
    return drops;
  }

  // --- 填充空位 ---
  // 返回新生成的宝石 [{ r, c, gem }]
  fillEmpty() {
    const newGems = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let emptyCount = 0;
      for (let r = 0; r < GRID_ROWS; r++) {
        if (this.grid[r][c] === null) emptyCount++;
      }
      let fillIdx = 0;
      for (let r = 0; r < GRID_ROWS; r++) {
        if (this.grid[r][c] === null) {
          const gem = new Gem(randomGemType(this.colorCount));
          gem.row = r;
          gem.col = c;
          gem.spawning = true;
          this.grid[r][c] = gem;
          newGems.push({ r, c, gem, fromAbove: emptyCount - fillIdx });
          fillIdx++;
        }
      }
    }
    return newGems;
  }

  // --- 检查是否还有可用移动 ---
  hasValidMoves() {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        // 尝试右交换
        if (c < GRID_COLS - 1) {
          this.swap(r, c, r, c + 1);
          const matches = this.findAllMatches();
          this.swap(r, c, r, c + 1);
          if (matches.length > 0) return true;
        }
        // 尝试下交换
        if (r < GRID_ROWS - 1) {
          this.swap(r, c, r + 1, c);
          const matches = this.findAllMatches();
          this.swap(r, c, r + 1, c);
          if (matches.length > 0) return true;
        }
      }
    }
    return false;
  }

  // 重置连锁等级
  resetChain() {
    this.chainLevel = 0;
    this.clearStats = {};
  }

  incrementChain() {
    this.chainLevel++;
  }
}
