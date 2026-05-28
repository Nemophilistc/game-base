// ============================================================
// maze.js - Maze Generation (Recursive Backtracker / DFS)
// ============================================================
// Each cell: { row, col, walls: {N,S,E,W}, visited, revealed, doorDir, locked }
// Walls: true = wall present

export class Maze {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.doors = [];       // [{row, col, dir, locked}]
        this.generate();
    }

    generate() {
        // Init grid
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = {
                    row: r,
                    col: c,
                    walls: { N: true, S: true, E: true, W: true },
                    visited: false,
                    revealed: false,
                    doorDir: null,
                    locked: false,
                };
            }
        }

        // Recursive backtracker
        const stack = [];
        const start = this.grid[0][0];
        start.visited = true;
        stack.push(start);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this._getUnvisitedNeighbors(current);

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this._removeWall(current, next);
                next.visited = true;
                stack.push(next);
            }
        }

        // Reset visited flags for game use
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c].visited = false;
            }
        }
    }

    _getUnvisitedNeighbors(cell) {
        const { row, col } = cell;
        const neighbors = [];
        if (row > 0 && !this.grid[row - 1][col].visited) neighbors.push(this.grid[row - 1][col]);
        if (row < this.rows - 1 && !this.grid[row + 1][col].visited) neighbors.push(this.grid[row + 1][col]);
        if (col > 0 && !this.grid[row][col - 1].visited) neighbors.push(this.grid[row][col - 1]);
        if (col < this.cols - 1 && !this.grid[row][col + 1].visited) neighbors.push(this.grid[row][col + 1]);
        return neighbors;
    }

    _removeWall(a, b) {
        const dr = b.row - a.row;
        const dc = b.col - a.col;
        if (dr === -1) { a.walls.N = false; b.walls.S = false; }
        if (dr === 1)  { a.walls.S = false; b.walls.N = false; }
        if (dc === -1) { a.walls.W = false; b.walls.E = false; }
        if (dc === 1)  { a.walls.E = false; b.walls.W = false; }
    }

    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        return this.grid[row][col];
    }

    canMove(row, col, dir) {
        const cell = this.getCell(row, col);
        if (!cell) return false;
        if (cell.walls[dir]) return false;
        // Check for locked door on current cell
        if (cell.doorDir === dir && cell.locked) return false;
        // Check for locked door on adjacent cell (approaching from other side)
        const opp = { N: 'S', S: 'N', E: 'W', W: 'E' };
        const deltas = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
        const [dr, dc] = deltas[dir];
        const adj = this.getCell(row + dr, col + dc);
        if (adj && adj.doorDir === opp[dir] && adj.locked) return false;
        return true;
    }

    // Place locked doors along passages
    placeDoors(keyCount) {
        this.doors = [];
        const candidates = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                // Don't place doors near start or end
                if (r + c < 3 || (this.rows - 1 - r) + (this.cols - 1 - c) < 3) continue;

                ['E', 'S'].forEach(dir => {
                    if (!cell.walls[dir]) {
                        candidates.push({ row: r, col: c, dir });
                    }
                });
            }
        }

        // Shuffle and pick
        this._shuffle(candidates);
        const count = Math.min(keyCount, candidates.length);

        for (let i = 0; i < count; i++) {
            const d = candidates[i];
            const cell = this.grid[d.row][d.col];
            cell.doorDir = d.dir;
            cell.locked = true;
            this.doors.push(d);
        }
    }

    unlockDoor(row, col) {
        const cell = this.getCell(row, col);
        if (cell && cell.locked) {
            cell.locked = false;
            return true;
        }
        // Check adjacent cell if we're approaching from the other side
        const dirs = { N: [-1, 0, 'S'], S: [1, 0, 'N'], E: [0, 1, 'W'], W: [0, -1, 'E'] };
        for (const [dir, [dr, dc, opp]] of Object.entries(dirs)) {
            const adj = this.getCell(row + dr, col + dc);
            if (adj && adj.doorDir === opp && adj.locked) {
                adj.locked = false;
                return true;
            }
        }
        return false;
    }

    isDoorAt(row, col, dir) {
        const cell = this.getCell(row, col);
        return cell && cell.doorDir === dir && cell.locked;
    }

    // Check if a locked door blocks movement from adjacent cell
    hasLockedDoorTo(row, col, dir) {
        const opp = { N: 'S', S: 'N', E: 'W', W: 'E' };
        const deltas = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
        const [dr, dc] = deltas[dir];
        const adj = this.getCell(row + dr, col + dc);
        return adj && adj.doorDir === opp[dir] && adj.locked;
    }

    // Reveal cells in radius around position
    reveal(centerRow, centerCol, radius) {
        for (let r = centerRow - radius; r <= centerRow + radius; r++) {
            for (let c = centerCol - radius; c <= centerCol + radius; c++) {
                const dist = Math.sqrt((r - centerRow) ** 2 + (c - centerCol) ** 2);
                if (dist <= radius) {
                    const cell = this.getCell(r, c);
                    if (cell) cell.revealed = true;
                }
            }
        }
    }

    revealAll() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c].revealed = true;
            }
        }
    }

    resetRevealed() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c].revealed = false;
            }
        }
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // Find a path from start to goal using BFS (for enemy pathfinding)
    findPath(startRow, startCol, goalRow, goalCol) {
        const key = (r, c) => `${r},${c}`;
        const queue = [{ row: startRow, col: startCol, path: [] }];
        const visited = new Set();
        visited.add(key(startRow, startCol));

        while (queue.length > 0) {
            const { row, col, path } = queue.shift();
            if (row === goalRow && col === goalCol) return path;

            const dirs = [
                { dir: 'N', dr: -1, dc: 0 },
                { dir: 'S', dr: 1, dc: 0 },
                { dir: 'E', dr: 0, dc: 1 },
                { dir: 'W', dr: 0, dc: -1 },
            ];

            for (const { dir, dr, dc } of dirs) {
                const nr = row + dr;
                const nc = col + dc;
                if (this.canMove(row, col, dir) && !visited.has(key(nr, nc))) {
                    visited.add(key(nr, nc));
                    queue.push({ row: nr, col: nc, path: [...path, dir] });
                }
            }
        }
        return null; // No path
    }
}
