// ============================================================
// structures.js - Building: campfire, shelter, storage, farm plot, boat
// ============================================================

import { TILE_SIZE } from './config.js';
import { Sound } from './sound.js';

export function updateStructures(world, dt) {
    for (const s of world.structures) {
        // Campfire: flicker effect stored as buildTime
        if (s.type === 'campfire') {
            s.buildTime += dt;
        }

        // Farm: slowly produces food
        if (s.type === 'farm') {
            s.buildTime += dt;
            if (s.buildTime >= 60) { // every 60 seconds
                s.buildTime = 0;
                s.produceReady = true;
            }
        }

        // Storm damage to shelter
        if (world.weather === 'storm' && s.type === 'shelter') {
            s.hp -= 2 * dt;
            if (s.hp <= 0) {
                s.hp = 0;
                // Mark for removal
                s.destroyed = true;
            }
        }
    }

    // Remove destroyed structures
    for (let i = world.structures.length - 1; i >= 0; i--) {
        if (world.structures[i].destroyed) {
            world.structures.splice(i, 1);
        }
    }
}

// Update animal AI
export function updateAnimals(world, player, dt) {
    for (const a of world.animals) {
        a.stateTimer -= dt;

        const dx = player.x - a.x;
        const dy = player.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (a.type === 'rabbit') {
            // Rabbits flee from player
            if (dist < 80) {
                a.state = 'flee';
                a.stateTimer = 2;
            }

            if (a.state === 'flee' && a.stateTimer > 0) {
                // Move away from player
                if (dist > 0) {
                    a.vx = -(dx / dist) * 120;
                    a.vy = -(dy / dist) * 120;
                }
            } else {
                a.state = 'idle';
                // Wander
                if (a.stateTimer <= 0) {
                    a.stateTimer = 1 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    a.vx = Math.cos(angle) * 30;
                    a.vy = Math.sin(angle) * 30;
                }
            }
        } else if (a.type === 'wolf') {
            // Wolves chase player at night
            const isNight = world.isNight();
            if (isNight && dist < 200) {
                a.state = 'chase';
                a.stateTimer = 1;
            } else if (dist < 60) {
                a.state = 'chase';
                a.stateTimer = 1;
            }

            if (a.state === 'chase') {
                if (dist > 0 && dist < 300) {
                    a.vx = (dx / dist) * 90;
                    a.vy = (dy / dist) * 90;
                } else {
                    a.state = 'idle';
                }

                // Attack player if close
                if (dist < 24) {
                    player.health -= 15 * dt;
                    Sound.damage();
                }
            } else {
                a.state = 'idle';
                if (a.stateTimer <= 0) {
                    a.stateTimer = 2 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    a.vx = Math.cos(angle) * 40;
                    a.vy = Math.sin(angle) * 40;
                }
            }
        }

        // Move animal
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Keep in bounds and on walkable tiles
        a.x = Math.max(32, Math.min(39 * 32, a.x));
        a.y = Math.max(32, Math.min(39 * 32, a.y));
        if (!world.isWalkable(a.x, a.y)) {
            a.x -= a.vx * dt;
            a.y -= a.vy * dt;
            a.vx = -a.vx;
            a.vy = -a.vy;
        }

        // Dampen velocity
        a.vx *= 0.95;
        a.vy *= 0.95;
    }
}

export function drawCampfireLight(ctx, world, camX, camY, canvasW, canvasH) {
    // Draw light circles around campfires at night
    if (!world.isNight()) return;

    for (const s of world.structures) {
        if (s.type !== 'campfire') continue;
        const sx = s.x * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = s.y * TILE_SIZE + TILE_SIZE / 2 - camY;

        // Skip if off screen
        if (sx < -150 || sy < -150 || sx > canvasW + 150 || sy > canvasH + 150) continue;

        // Flicker
        const flicker = 0.85 + Math.sin(s.buildTime * 8) * 0.1 + Math.sin(s.buildTime * 13) * 0.05;

        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120 * flicker);
        gradient.addColorStop(0, 'rgba(255, 180, 50, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 20, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(sx - 150, sy - 150, 300, 300);
    }
}
