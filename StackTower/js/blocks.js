// blocks.js - Block logic: state, movement, alignment, cutting
import { W, H, BASE_W, COLORS } from './config.js';
import Sound from './sound.js';

export const state = {
    blocks: [],
    current: null,
    falling: [],
    particles: [],
    score: 0,
    highScore: 0,
    perfectCombo: 0,
    gameActive: false,
    gameEnding: false  // true while waiting for falling animation to finish
};

// Load high score from localStorage
state.highScore = parseInt(localStorage.getItem('stack_high')) || 0;

export function initBlocks() {
    state.blocks = [{ x: W / 2 - BASE_W / 2, w: BASE_W, y: H - 30, color: COLORS[0] }];
    state.current = { x: 0, w: BASE_W, dir: 1, speed: 2, color: COLORS[1 % COLORS.length], y: H - 60 };
    state.falling = [];
    state.particles = [];
    state.score = 0;
    state.perfectCombo = 0;
    state.gameActive = true;
    state.gameEnding = false;
}

export function dropBlock() {
    if (!state.gameActive) return;
    const top = state.blocks[state.blocks.length - 1];
    const overlap = Math.min(state.current.x + state.current.w, top.x + top.w) - Math.max(state.current.x, top.x);

    if (overlap <= 0) {
        // Missed completely - start game over animation
        Sound.play('gameover');
        state.falling.push({ ...state.current, vy: -2, vr: 0 });
        state.gameActive = false;
        state.gameEnding = true;  // wait for falling animation to finish
        state.highScore = Math.max(state.highScore, state.score);
        localStorage.setItem('stack_high', state.highScore);
        return;
    }

    const newX = Math.max(state.current.x, top.x);
    const isPerfect = Math.abs(state.current.x - top.x) < 5 && Math.abs(state.current.w - top.w) < 5;

    if (isPerfect) {
        state.perfectCombo++;
        state.score += 10 * state.perfectCombo;
        Sound.play('perfect');
        spawnPerfectParticles(newX + overlap / 2, state.current.y);
    } else {
        state.perfectCombo = 0;
        state.score += 10;
        // Cut off left overhang
        if (state.current.x < top.x) {
            const cutW = top.x - state.current.x;
            state.falling.push({ x: state.current.x, w: cutW, y: state.current.y, color: state.current.color, vy: 0, vr: 0.05 });
        }
        // Cut off right overhang
        if (state.current.x + state.current.w > top.x + top.w) {
            const cutX = top.x + top.w;
            const cutW = state.current.x + state.current.w - cutX;
            state.falling.push({ x: cutX, w: cutW, y: state.current.y, color: state.current.color, vy: 0, vr: -0.05 });
        }
    }

    state.blocks.push({ x: newX, w: overlap, y: state.current.y, color: state.current.color });
    Sound.play('drop');

    // Scroll up if block is too high
    const blockY = state.current.y;
    if (blockY < 300) {
        const scroll = 300 - blockY;
        for (const b of state.blocks) b.y += scroll;
        for (const f of state.falling) f.y += scroll;
        for (const p of state.particles) p.y += scroll;
    }

    // Prepare next block
    const nextIdx = state.blocks.length;
    const nextW = Math.max(20, overlap - (isPerfect ? 0 : Math.random() * 5));
    const speed = Math.min(5, 2 + nextIdx * 0.1);
    state.current = {
        x: nextIdx % 2 === 0 ? -nextW : W,
        w: nextW,
        dir: nextIdx % 2 === 0 ? 1 : -1,
        speed,
        y: blockY - 30,
        color: COLORS[nextIdx % COLORS.length]
    };
}

function spawnPerfectParticles(x, y) {
    const particleColors = ['#ffd700', '#ff0', '#e040fb', '#00ff96'];
    for (let i = 0; i < 20; i++) {
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            life: 30 + Math.random() * 20,
            color: particleColors[Math.floor(Math.random() * 4)]
        });
    }
}

/**
 * Update all animations. Returns true when game-over falling animation is complete
 * and the overlay should be shown.
 */
export function updateBlocks() {
    // Move current block only when game is active
    if (state.gameActive) {
        state.current.x += state.current.speed * state.current.dir;
        if (state.current.x + state.current.w > W) state.current.dir = -1;
        if (state.current.x < 0) state.current.dir = 1;
    }

    // Always update falling pieces (even during game over animation)
    for (let i = state.falling.length - 1; i >= 0; i--) {
        state.falling[i].y += state.falling[i].vy;
        state.falling[i].vy += 0.3;
        state.falling[i].x += state.falling[i].vr;
        if (state.falling[i].y > H + 50) state.falling.splice(i, 1);
    }

    // Always update particles
    state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        return p.life > 0;
    });

    // Check if game over animation is done (all falling pieces have left the screen)
    if (state.gameEnding && state.falling.length === 0) {
        state.gameEnding = false;
        return true;
    }
    return false;
}
