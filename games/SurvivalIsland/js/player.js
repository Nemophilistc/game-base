// ============================================================
// player.js - Player stats, movement, inventory
// ============================================================

import {
    PLAYER_SPEED, PLAYER_SIZE, MAX_HEALTH, MAX_HUNGER, MAX_THIRST,
    HUNGER_RATE, THIRST_RATE, STARVING_DAMAGE, DEHYDRATION_DAMAGE,
    INVENTORY_SLOTS, GATHER_TIME,
    RESOURCE_TYPES, NUTRITION,
} from './config.js';
import { Sound } from './sound.js';

export function createPlayer(spawnX, spawnY) {
    const player = {
        x: spawnX,
        y: spawnY,
        size: PLAYER_SIZE,
        speed: PLAYER_SPEED,
        health: MAX_HEALTH,
        hunger: MAX_HUNGER,
        thirst: MAX_THIRST,
        alive: true,
        win: false,

        // Movement
        vx: 0, vy: 0,
        facing: 'down', // up, down, left, right

        // Inventory: array of { type, count }
        inventory: [],
        tools: {
            axe: false,
            pickaxe: false,
            fishingRod: false,
        },

        // Gathering
        gathering: null, // { resource, progress, total }
        interacting: false,

        // Stats tracking
        itemsCrafted: 0,
        structuresBuilt: 0,
        animalsKilled: 0,

        // Attack
        attackCooldown: 0,
        attackDamage: 10,
    };

    // Inventory management
    function addItem(type, count = 1) {
        const existing = player.inventory.find(s => s.type === type);
        if (existing) {
            existing.count += count;
        } else if (player.inventory.length < INVENTORY_SLOTS) {
            player.inventory.push({ type, count });
        } else {
            return false; // full
        }
        return true;
    }

    function removeItem(type, count = 1) {
        const slot = player.inventory.find(s => s.type === type);
        if (!slot || slot.count < count) return false;
        slot.count -= count;
        if (slot.count <= 0) {
            player.inventory = player.inventory.filter(s => s !== slot);
        }
        return true;
    }

    function getItemCount(type) {
        const slot = player.inventory.find(s => s.type === type);
        return slot ? slot.count : 0;
    }

    function hasItems(requirements) {
        for (const [type, count] of Object.entries(requirements)) {
            if (getItemCount(type) < count) return false;
        }
        return true;
    }

    // Crafting
    function canCraft(recipe) {
        return hasItems(recipe.ingredients);
    }

    function craft(recipe) {
        if (!canCraft(recipe)) return false;
        for (const [type, count] of Object.entries(recipe.ingredients)) {
            removeItem(type, count);
        }
        if (recipe.type === 'tool') {
            player.tools[recipe.result] = true;
        } else {
            // For structures, we add a "token" to inventory
            addItem(recipe.result);
        }
        player.itemsCrafted++;
        Sound.craft();
        return true;
    }

    // Eating
    function eat(foodType) {
        const nutr = NUTRITION[foodType];
        if (!nutr) return false;
        if (getItemCount(foodType) <= 0) return false;
        removeItem(foodType);
        player.hunger = Math.min(MAX_HUNGER, player.hunger + nutr.hunger);
        if (nutr.thirst) player.thirst = Math.min(MAX_THIRST, player.thirst + nutr.thirst);
        if (nutr.health) player.health = Math.min(MAX_HEALTH, Math.max(0, player.health + nutr.health));
        Sound.eat();
        return true;
    }

    // Gathering
    function startGather(resource) {
        let time = GATHER_TIME;
        if (resource.type === 'tree' && player.tools.axe) time *= 0.5;
        if (resource.type === 'rock' && player.tools.pickaxe) time *= 0.5;
        player.gathering = { resource, progress: 0, total: time };
    }

    function update(dt, world) {
        if (!player.alive || player.win) return;

        // Hunger and thirst
        player.hunger -= HUNGER_RATE * dt;
        player.thirst -= THIRST_RATE * dt;

        if (player.hunger <= 0) {
            player.hunger = 0;
            player.health -= STARVING_DAMAGE * dt;
        }
        if (player.thirst <= 0) {
            player.thirst = 0;
            player.health -= DEHYDRATION_DAMAGE * dt;
        }

        // Rain restores thirst
        if (world.weather === 'rain' || world.weather === 'storm') {
            player.thirst = Math.min(MAX_THIRST, player.thirst + 1.5 * dt);
        }

        // Shelter bonus
        const shelter = world.structures.find(s =>
            s.type === 'shelter' &&
            Math.abs(s.x * 32 + 16 - player.x) < 48 &&
            Math.abs(s.y * 32 + 16 - player.y) < 48
        );

        if (world.weather === 'storm' && !shelter) {
            player.health -= 3 * dt;
        }

        // Health regen when well-fed
        if (player.hunger > 50 && player.thirst > 50) {
            player.health = Math.min(MAX_HEALTH, player.health + 1 * dt);
        }

        // Movement
        if (!player.gathering) {
            player.x += player.vx * dt;
            player.y += player.vy * dt;

            // Clamp to world bounds
            const margin = player.size;
            player.x = Math.max(margin, Math.min(39 * 32 + 32 - margin, player.x));
            player.y = Math.max(margin, Math.min(39 * 32 + 32 - margin, player.y));

            // Collision with non-walkable
            if (!world.isWalkable(player.x, player.y)) {
                player.x -= player.vx * dt;
                player.y -= player.vy * dt;
            }
        }

        // Gathering progress
        if (player.gathering) {
            player.gathering.progress += dt;
            if (player.gathering.progress >= player.gathering.total) {
                const res = player.gathering.resource;
                // Gather resource
                if (res.type === 'tree') {
                    const amount = player.tools.axe ? 3 : 1;
                    addItem(RESOURCE_TYPES.WOOD, amount);
                    Sound.chop();
                } else if (res.type === 'rock') {
                    const amount = player.tools.pickaxe ? 3 : 1;
                    addItem(RESOURCE_TYPES.STONE, amount);
                    Sound.mine();
                } else if (res.type === 'bush') {
                    addItem(RESOURCE_TYPES.FIBER, 1);
                    if (Math.random() < 0.5) addItem(RESOURCE_TYPES.BERRY, 1);
                    Sound.gather();
                }
                res.hp--;
                if (res.hp <= 0) {
                    world.removeResource(res);
                }
                player.gathering = null;
            }
        }

        // Attack cooldown
        if (player.attackCooldown > 0) {
            player.attackCooldown -= dt;
        }

        // Death check
        if (player.health <= 0) {
            player.health = 0;
            player.alive = false;
        }
    }

    function attack(animals) {
        if (player.attackCooldown > 0) return;
        player.attackCooldown = 0.4;
        Sound.hit();

        // Find animal in range
        for (const animal of animals) {
            const dx = animal.x - player.x;
            const dy = animal.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 48) {
                animal.hp -= player.attackDamage;
                // Knockback
                if (dist > 0) {
                    animal.x += (dx / dist) * 20;
                    animal.y += (dy / dist) * 20;
                }
                if (animal.hp <= 0) {
                    const config = { rabbit: { drop: 'rawMeat', count: 1 }, wolf: { drop: 'rawMeat', count: 2 } };
                    const cfg = config[animal.type];
                    if (cfg) addItem(cfg.drop, cfg.count);
                    player.animalsKilled++;
                    return animal; // signal to remove
                }
                break;
            }
        }
        return null;
    }

    function tryPlaceStructure(type, world) {
        if (!removeItem(type)) return false;
        // Place in front of player
        let px = player.x, py = player.y;
        if (player.facing === 'up') py -= 48;
        else if (player.facing === 'down') py += 48;
        else if (player.facing === 'left') px -= 48;
        else px += 48;

        // Check walkable
        if (!world.isWalkable(px, py)) {
            addItem(type); // refund
            return false;
        }

        world.addStructure(type, px, py);
        if (type === 'boat') {
            player.win = true;
        }
        Sound.build();
        player.structuresBuilt++;
        return true;
    }

    function tryFish(world) {
        if (!player.tools.fishingRod) return false;
        if (!world.isAdjacentToWater(player.x, player.y)) return false;
        if (Math.random() < 0.6) {
            addItem(RESOURCE_TYPES.FISH);
            Sound.gather();
            return true;
        }
        Sound.gather();
        return true; // still successful action, just no fish
    }

    // Cook meat at campfire
    function tryCook(world) {
        const campfire = world.structures.find(s =>
            s.type === 'campfire' &&
            Math.abs(s.x * 32 + 16 - player.x) < 48 &&
            Math.abs(s.y * 32 + 16 - player.y) < 48
        );
        if (!campfire) return false;

        if (getItemCount('rawMeat') > 0) {
            removeItem('rawMeat');
            addItem('cookedMeat');
            Sound.fire();
            return true;
        }
        if (getItemCount('fish') > 0) {
            removeItem('fish');
            addItem('cookedFish');
            Sound.fire();
            return true;
        }
        return false;
    }

    return {
        ...player,
        addItem, removeItem, getItemCount, hasItems,
        canCraft, craft, eat,
        startGather, update, attack,
        tryPlaceStructure, tryFish, tryCook,
    };
}
