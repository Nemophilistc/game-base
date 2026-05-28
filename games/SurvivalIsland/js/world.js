// ============================================================
// world.js - Island map, tile types, day/night cycle
// ============================================================

import {
    TILE, TILE_COLORS, TILE_WALKABLE, TILE_SIZE,
    WORLD_COLS, WORLD_ROWS,
    DAY_LENGTH, DAWN_START, DAY_START, DUSK_START, NIGHT_START,
} from './config.js';

// Simple seeded random
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Simple value noise
function createNoise(seed) {
    const rng = mulberry32(seed);
    const size = 128;
    const grid = [];
    for (let i = 0; i < size * size; i++) grid.push(rng());

    function getGrid(gx, gy) {
        gx = ((gx % size) + size) % size;
        gy = ((gy % size) + size) % size;
        return grid[gy * size + gx];
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

    return function (x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = fade(x - ix), fy = fade(y - iy);
        const a = getGrid(ix, iy), b = getGrid(ix + 1, iy);
        const c = getGrid(ix, iy + 1), d = getGrid(ix + 1, iy + 1);
        return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
    };
}

export function createWorld(seed) {
    seed = seed || (Math.random() * 999999 | 0);
    const rng = mulberry32(seed);
    const noise1 = createNoise(seed);
    const noise2 = createNoise(seed + 1000);

    const tiles = [];
    const resources = []; // { type, x, y, hp, maxHp, id }
    const structures = []; // { type, x, y, hp, maxHp, id, ...extra }
    const animals = []; // { type, x, y, hp, vx, vy, ... }

    let dayTime = 0.3; // start at morning
    let dayCount = 1;
    let weather = 'clear'; // clear, rain, storm
    let weatherTimer = 0;

    let nextId = 1;
    function genId() { return nextId++; }

    // Generate island tiles
    const cx = WORLD_COLS / 2, cy = WORLD_ROWS / 2;
    const maxR = Math.min(cx, cy) * 0.85;

    for (let y = 0; y < WORLD_ROWS; y++) {
        tiles[y] = [];
        for (let x = 0; x < WORLD_COLS; x++) {
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const n1 = noise1(x * 0.08, y * 0.08);
            const n2 = noise2(x * 0.15, y * 0.15);
            const height = n1 * 0.7 + n2 * 0.3;
            const edgeFade = 1 - Math.pow(dist / maxR, 2);
            const val = height * Math.max(0, edgeFade);

            let tile;
            if (val < 0.1) tile = TILE.DEEP_WATER;
            else if (val < 0.2) tile = TILE.WATER;
            else if (val < 0.3) tile = TILE.SAND;
            else if (val < 0.55) tile = TILE.GRASS;
            else if (val < 0.75) tile = TILE.FOREST;
            else tile = TILE.MOUNTAIN;

            tiles[y][x] = tile;
        }
    }

    // Spawn resources
    for (let y = 0; y < WORLD_ROWS; y++) {
        for (let x = 0; x < WORLD_COLS; x++) {
            const tile = tiles[y][x];
            const r = rng();
            if (tile === TILE.FOREST && r < 0.5) {
                resources.push({ type: 'tree', x, y, hp: 5, maxHp: 5, id: genId() });
            } else if (tile === TILE.GRASS && r < 0.08) {
                resources.push({ type: 'rock', x, y, hp: 4, maxHp: 4, id: genId() });
            } else if (tile === TILE.GRASS && r < 0.15) {
                resources.push({ type: 'bush', x, y, hp: 2, maxHp: 2, id: genId() });
            } else if (tile === TILE.FOREST && r < 0.6) {
                resources.push({ type: 'bush', x, y, hp: 2, maxHp: 2, id: genId() });
            }
        }
    }

    // Find a good spawn point (grass tile near center)
    function findSpawnPoint() {
        for (let r = 0; r < 15; r++) {
            for (let i = 0; i < 30; i++) {
                const x = (cx + (rng() * r * 2 - r)) | 0;
                const y = (cy + (rng() * r * 2 - r)) | 0;
                if (x >= 0 && y >= 0 && x < WORLD_COLS && y < WORLD_ROWS) {
                    const t = tiles[y][x];
                    if (t === TILE.GRASS || t === TILE.SAND) {
                        return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
                    }
                }
            }
        }
        return { x: cx * TILE_SIZE + TILE_SIZE / 2, y: cy * TILE_SIZE + TILE_SIZE / 2 };
    }

    function isWalkable(wx, wy) {
        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wy / TILE_SIZE);
        if (tx < 0 || ty < 0 || tx >= WORLD_COLS || ty >= WORLD_ROWS) return false;
        return TILE_WALKABLE[tiles[ty][tx]];
    }

    function getTile(wx, wy) {
        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wy / TILE_SIZE);
        if (tx < 0 || ty < 0 || tx >= WORLD_COLS || ty >= WORLD_ROWS) return TILE.DEEP_WATER;
        return tiles[ty][tx];
    }

    function getResourceAt(wx, wy, range) {
        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wy / TILE_SIZE);
        let best = null, bestDist = range;
        for (const res of resources) {
            const rx = res.x * TILE_SIZE + TILE_SIZE / 2;
            const ry = res.y * TILE_SIZE + TILE_SIZE / 2;
            const d = Math.sqrt((wx - rx) ** 2 + (wy - ry) ** 2);
            if (d < bestDist) {
                bestDist = d;
                best = res;
            }
        }
        return best;
    }

    function removeResource(res) {
        const idx = resources.indexOf(res);
        if (idx >= 0) resources.splice(idx, 1);
    }

    function getStructureAt(wx, wy, range) {
        let best = null, bestDist = range;
        for (const s of structures) {
            const sx = s.x * TILE_SIZE + TILE_SIZE / 2;
            const sy = s.y * TILE_SIZE + TILE_SIZE / 2;
            const d = Math.sqrt((wx - sx) ** 2 + (wy - sy) ** 2);
            if (d < bestDist) {
                bestDist = d;
                best = s;
            }
        }
        return best;
    }

    function addStructure(type, wx, wy) {
        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wy / TILE_SIZE);
        const s = { type, x: tx, y: ty, hp: 100, maxHp: 100, id: genId(), buildTime: 0 };
        structures.push(s);
        return s;
    }

    // Water tile check for fishing
    function isAdjacentToWater(wx, wy) {
        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wy / TILE_SIZE);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = tx + dx, ny = ty + dy;
                if (nx >= 0 && ny >= 0 && nx < WORLD_COLS && ny < WORLD_ROWS) {
                    const t = tiles[ny][nx];
                    if (t === TILE.WATER || t === TILE.DEEP_WATER) return true;
                }
            }
        }
        return false;
    }

    // Update day/night and weather
    function update(dt) {
        dayTime += dt / DAY_LENGTH;
        if (dayTime >= 1) {
            dayTime -= 1;
            dayCount++;
        }

        // Weather
        weatherTimer -= dt;
        if (weatherTimer <= 0) {
            weatherTimer = 20 + rng() * 40;
            const r = rng();
            if (r < 0.5) weather = 'clear';
            else if (r < 0.8) weather = 'rain';
            else weather = 'storm';
        }

        // Spawn wolves at night
        if (isNight() && animals.filter(a => a.type === 'wolf').length < 3) {
            if (rng() < 0.003) {
                const angle = rng() * Math.PI * 2;
                const dist = 200 + rng() * 150;
                const wx = cx * TILE_SIZE + Math.cos(angle) * dist;
                const wy = cy * TILE_SIZE + Math.sin(angle) * dist;
                if (isWalkable(wx, wy)) {
                    animals.push({
                        type: 'wolf',
                        x: wx, y: wy,
                        hp: 40, maxHp: 40,
                        vx: 0, vy: 0,
                        targetX: 0, targetY: 0,
                        stateTimer: 0,
                        state: 'idle',
                    });
                }
            }
        }

        // Remove wolves at dawn
        if (!isNight()) {
            for (let i = animals.length - 1; i >= 0; i--) {
                if (animals[i].type === 'wolf') {
                    animals.splice(i, 1);
                }
            }
        }

        // Spawn rabbits
        if (animals.filter(a => a.type === 'rabbit').length < 8) {
            if (rng() < 0.005) {
                const angle = rng() * Math.PI * 2;
                const dist = 100 + rng() * 300;
                const wx = cx * TILE_SIZE + Math.cos(angle) * dist;
                const wy = cy * TILE_SIZE + Math.sin(angle) * dist;
                if (isWalkable(wx, wy)) {
                    animals.push({
                        type: 'rabbit',
                        x: wx, y: wy,
                        hp: 15, maxHp: 15,
                        vx: 0, vy: 0,
                        targetX: wx, targetY: wy,
                        stateTimer: 0,
                        state: 'idle',
                    });
                }
            }
        }
    }

    function isNight() {
        return dayTime >= NIGHT_START || dayTime < DAWN_START;
    }

    function isDawn() {
        return dayTime >= DAWN_START && dayTime < DAY_START;
    }

    function isDusk() {
        return dayTime >= DUSK_START && dayTime < NIGHT_START;
    }

    function getDaylight() {
        if (dayTime >= DAY_START && dayTime < DUSK_START) return 1; // full day
        if (dayTime >= NIGHT_START || dayTime < DAWN_START) return 0.25; // night
        if (dayTime >= DAWN_START && dayTime < DAY_START) {
            return 0.25 + (dayTime - DAWN_START) / (DAY_START - DAWN_START) * 0.75;
        }
        // dusk
        return 1 - (dayTime - DUSK_START) / (NIGHT_START - DUSK_START) * 0.75;
    }

    function getTimeString() {
        const hours = Math.floor(dayTime * 24);
        const mins = Math.floor((dayTime * 24 - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    function getTimeOfDayName() {
        if (dayTime >= DAY_START && dayTime < DUSK_START) return '白天';
        if (dayTime >= DUSK_START && dayTime < NIGHT_START) return '黄昏';
        if (dayTime >= NIGHT_START) return '夜晚';
        if (dayTime < DAWN_START) return '夜晚';
        return '黎明';
    }

    return {
        tiles, resources, structures, animals,
        findSpawnPoint, isWalkable, getTile,
        getResourceAt, removeResource,
        getStructureAt, addStructure,
        isAdjacentToWater,
        update, isNight, isDawn, isDusk,
        getDaylight, getTimeString, getTimeOfDayName,
        get dayTime() { return dayTime; },
        get dayCount() { return dayCount; },
        get weather() { return weather; },
        set weather(v) { weather = v; },
        get seed() { return seed; },
    };
}
