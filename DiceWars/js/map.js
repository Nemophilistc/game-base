// map.js - Territory grid, map generation, adjacency

import { HEX_SIZE, GRID_COLS, GRID_ROWS, NUM_TERRITORIES, SQRT3 } from './config.js';

/**
 * Convert offset hex coordinates to pixel position (pointy-top, odd-r offset)
 */
export function hexToPixel(col, row, size) {
    return {
        x: size * SQRT3 * (col + 0.5 * (row & 1)),
        y: size * 1.5 * row
    };
}

/**
 * Get the 6 neighbor offsets for odd-r offset hex grid
 */
export function getHexNeighborOffsets(row) {
    if (row & 1) {
        // Odd row
        return [[0, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1]];
    }
    // Even row
    return [[-1, -1], [0, -1], [-1, 0], [1, 0], [-1, 1], [0, 1]];
}

/**
 * Get vertex position for a hex cell (pointy-top)
 */
export function getHexVertex(cx, cy, size, index) {
    const angle = Math.PI / 180 * (60 * index - 90);
    return {
        x: cx + size * Math.cos(angle),
        y: cy + size * Math.sin(angle)
    };
}

// Map neighbor index to the edge it shares (edge = between vertex[edge] and vertex[edge+1])
const NEIGHBOR_TO_EDGE = [5, 0, 4, 1, 3, 2];

/**
 * Pick seed cells that are well-spread using farthest-point sampling
 */
function pickSeeds(cells, count) {
    const seeds = [];
    // Start with a random cell
    seeds.push(cells[Math.floor(Math.random() * cells.length)]);

    while (seeds.length < count) {
        let bestCell = null;
        let bestMinDist = -1;

        for (const cell of cells) {
            if (seeds.includes(cell)) continue;
            // Find minimum distance to any existing seed (using hex distance approximation)
            let minDist = Infinity;
            for (const seed of seeds) {
                const dx = cell.col - seed.col;
                const dy = cell.row - seed.row;
                const dist = Math.abs(dx) + Math.abs(dy) + Math.abs(dx + dy);
                minDist = Math.min(minDist, dist);
            }
            if (minDist > bestMinDist) {
                bestMinDist = minDist;
                bestCell = cell;
            }
        }

        if (bestCell) seeds.push(bestCell);
        else break;
    }

    return seeds;
}

/**
 * Generate a complete map with territories
 */
export function generateMap(cols, rows, hexSize, numTerritories) {
    // Step 1: Generate hex cells within elliptical boundary
    const cells = [];
    const mapWidth = cols * hexSize * SQRT3;
    const mapHeight = rows * hexSize * 1.5 + hexSize * 0.5;
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;
    const radiusX = mapWidth * 0.46;
    const radiusY = mapHeight * 0.44;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const pos = hexToPixel(c, r, hexSize);
            const dx = (pos.x - centerX) / radiusX;
            const dy = (pos.y - centerY) / radiusY;
            if (dx * dx + dy * dy <= 1.0) {
                cells.push({
                    col: c, row: r,
                    x: pos.x, y: pos.y,
                    territoryId: -1
                });
            }
        }
    }

    // Build cell lookup map
    const cellMap = new Map();
    cells.forEach(cell => cellMap.set(`${cell.col},${cell.row}`, cell));

    // Step 2: Pick well-spread seed cells
    const seeds = pickSeeds(cells, numTerritories);

    // Step 3: Assign seeds to players in angular order for clustered starting positions
    const angleCenterX = centerX;
    const angleCenterY = centerY;
    seeds.sort((a, b) => {
        const angleA = Math.atan2(a.y - angleCenterY, a.x - angleCenterX);
        const angleB = Math.atan2(b.y - angleCenterY, b.x - angleCenterX);
        return angleA - angleB;
    });

    // Assign territory IDs to seeds
    seeds.forEach((seed, i) => {
        seed.territoryId = i;
    });

    // Step 4: BFS partition - assign each cell to nearest seed
    const queue = [...seeds];
    let qi = 0;
    while (qi < queue.length) {
        const cell = queue[qi++];
        const offsets = getHexNeighborOffsets(cell.row);
        for (const [dc, dr] of offsets) {
            const key = `${cell.col + dc},${cell.row + dr}`;
            const neighbor = cellMap.get(key);
            if (neighbor && neighbor.territoryId === -1) {
                neighbor.territoryId = cell.territoryId;
                queue.push(neighbor);
            }
        }
    }

    // Step 5: Build territory objects
    const territories = [];
    for (let i = 0; i < numTerritories; i++) {
        territories.push({
            id: i,
            owner: -1,
            dice: 0,
            cells: [],
            neighbors: new Set(),
            cx: 0, cy: 0,
            seedAngle: Math.atan2(seeds[i].y - angleCenterY, seeds[i].x - angleCenterX),
        });
    }

    cells.forEach(cell => {
        if (cell.territoryId >= 0) {
            territories[cell.territoryId].cells.push(cell);
        }
    });

    // Calculate centroids
    territories.forEach(t => {
        if (t.cells.length > 0) {
            t.cx = t.cells.reduce((s, c) => s + c.x, 0) / t.cells.length;
            t.cy = t.cells.reduce((s, c) => s + c.y, 0) / t.cells.length;
        }
    });

    // Step 6: Compute territory adjacency
    for (const cell of cells) {
        const offsets = getHexNeighborOffsets(cell.row);
        for (const [dc, dr] of offsets) {
            const key = `${cell.col + dc},${cell.row + dr}`;
            const neighbor = cellMap.get(key);
            if (neighbor && neighbor.territoryId !== cell.territoryId) {
                territories[cell.territoryId].neighbors.add(neighbor.territoryId);
                territories[neighbor.territoryId].neighbors.add(cell.territoryId);
            }
        }
    }

    return { cells, cellMap, territories, mapWidth, mapHeight };
}

/**
 * Find which cell is at a given pixel position
 */
export function pixelToCell(px, py, cellMap, hexSize) {
    // Approximate: convert pixel to offset hex coordinates
    const row = Math.round(py / (hexSize * 1.5));
    const col = Math.round((px / (hexSize * SQRT3)) - 0.5 * (row & 1));

    // Check this cell and neighbors for closest match
    let bestCell = null;
    let bestDist = Infinity;

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const key = `${col + dc},${row + dr}`;
            const cell = cellMap.get(key);
            if (cell) {
                const dx = px - cell.x;
                const dy = py - cell.y;
                const dist = dx * dx + dy * dy;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestCell = cell;
                }
            }
        }
    }

    // Only return if within hex bounds
    if (bestCell && bestDist < hexSize * hexSize * 1.2) {
        return bestCell;
    }
    return null;
}

/**
 * Get connected components for a player
 */
export function getConnectedComponents(playerId, territories) {
    const visited = new Set();
    const components = [];

    for (const t of territories) {
        if (t.owner !== playerId || visited.has(t.id)) continue;

        const component = [];
        const stack = [t.id];

        while (stack.length > 0) {
            const id = stack.pop();
            if (visited.has(id)) continue;
            visited.add(id);
            component.push(id);

            for (const neighborId of territories[id].neighbors) {
                if (territories[neighborId].owner === playerId && !visited.has(neighborId)) {
                    stack.push(neighborId);
                }
            }
        }

        components.push(component);
    }

    return components;
}

/**
 * Calculate bonus dice for a player based on largest connected group
 */
export function getBonusDice(playerId, territories) {
    const components = getConnectedComponents(playerId, territories);
    if (components.length === 0) return 0;
    const largest = Math.max(...components.map(c => c.length));
    return Math.max(2, Math.floor(largest / 2));
}

/**
 * Render the hex map on canvas
 */
export function renderMap(ctx, mapData, offsetX, offsetY, gameState) {
    const { cells, cellMap, territories } = mapData;
    const hexSize = gameState.hexSize;
    const selectedId = gameState.selectedTerritoryId;
    const hoveredId = gameState.hoveredTerritoryId;
    const validTargets = gameState.validTargets || [];
    const players = gameState.players;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Layer 1: Fill hex cells with territory colors
    for (const cell of cells) {
        const territory = territories[cell.territoryId];
        if (territory.owner < 0) continue;
        const player = players[territory.owner];
        if (!player) continue;

        drawHexPath(ctx, cell.x, cell.y, hexSize);

        // Color based on ownership with slight variation per territory
        const hue = territory.id * 7;
        const isSelected = territory.id === selectedId;
        const isHovered = territory.id === hoveredId;
        const isValidTarget = validTargets.includes(territory.id);

        if (isSelected) {
            ctx.fillStyle = player.lightColor;
        } else if (isHovered) {
            ctx.fillStyle = adjustColor(player.color, 20);
        } else if (isValidTarget) {
            ctx.fillStyle = adjustColor(player.color, -10);
        } else {
            ctx.fillStyle = player.color;
        }

        ctx.globalAlpha = 0.75;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Inner glow for selected
        if (isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Pulse for valid targets
        if (isValidTarget) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 200);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    // Layer 2: Thin hex grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;
    for (const cell of cells) {
        drawHexPath(ctx, cell.x, cell.y, hexSize);
        ctx.stroke();
    }

    // Layer 3: Territory borders (thick lines between different territories)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2.5;

    for (const cell of cells) {
        const offsets = getHexNeighborOffsets(cell.row);
        for (let i = 0; i < 6; i++) {
            const [dc, dr] = offsets[i];
            const key = `${cell.col + dc},${cell.row + dr}`;
            const neighbor = cellMap.get(key);

            if (!neighbor || neighbor.territoryId !== cell.territoryId) {
                const edgeIdx = NEIGHBOR_TO_EDGE[i];
                const v1 = getHexVertex(cell.x, cell.y, hexSize, edgeIdx);
                const v2 = getHexVertex(cell.x, cell.y, hexSize, (edgeIdx + 1) % 6);

                ctx.beginPath();
                ctx.moveTo(v1.x, v1.y);
                ctx.lineTo(v2.x, v2.y);
                ctx.stroke();
            }
        }
    }

    // Layer 4: Dice counts at territory centers
    for (const territory of territories) {
        if (territory.owner < 0 || territory.cells.length === 0) continue;
        const player = players[territory.owner];
        if (!player) continue;

        drawDiceCount(ctx, territory.cx, territory.cy, territory.dice, player, territory.id === selectedId);
    }

    ctx.restore();
}

/**
 * Draw a hex path (pointy-top)
 */
function drawHexPath(ctx, cx, cy, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const v = getHexVertex(cx, cy, size, i);
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
}

/**
 * Draw dice count indicator at territory center
 */
function drawDiceCount(ctx, cx, cy, count, player, isSelected) {
    const size = 16;

    // Background square (die face)
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = player.darkColor;
    ctx.lineWidth = 2;

    const x = cx - size;
    const y = cy - size;
    const w = size * 2;
    const h = size * 2;
    const r = 4;

    // Rounded rect
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Number
    ctx.fillStyle = player.darkColor;
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count.toString(), cx, cy + 1);
}

/**
 * Adjust a hex color brightness
 */
function adjustColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
}
