// 躲避球 - 障碍物与能量球系统
import {
    W, H,
    OBSTACLE_TYPES, OBSTACLE_WEIGHTS,
    ENERGY_ORB_RADIUS, ENERGY_ORB_SCORE
} from './config.js';
import { Sound } from './sound.js';

/**
 * 生成一个障碍物（4种类型，加权随机）
 */
export function spawnObstacle(obstacles) {
    let r = Math.random() * 100;
    let type = 'normal';
    for (let i = 0; i < OBSTACLE_TYPES.length; i++) {
        r -= OBSTACLE_WEIGHTS[i];
        if (r <= 0) { type = OBSTACLE_TYPES[i]; break; }
    }

    const obs = {
        x: Math.random() * (W - 40) + 20,
        y: -20,
        type,
        flash: 0
    };

    switch (type) {
        case 'normal':
            obs.w = 20; obs.h = 20;
            obs.vy = 2 + Math.random() * 2;
            obs.vx = 0;
            obs.color = '#f44336';
            break;
        case 'fast':
            obs.w = 12; obs.h = 24;
            obs.vy = 5 + Math.random() * 2;
            obs.vx = (Math.random() - 0.5) * 2;
            obs.color = '#ff9800';
            break;
        case 'wide':
            obs.w = 50; obs.h = 15;
            obs.vy = 1.5;
            obs.vx = (Math.random() - 0.5) * 1;
            obs.color = '#9c27b0';
            break;
        case 'homing':
            obs.w = 16; obs.h = 16;
            obs.vy = 2;
            obs.vx = 0;
            obs.color = '#f44336';
            break;
    }

    obstacles.push(obs);
}

/**
 * 生成一个能量球
 */
export function spawnEnergy(energyOrbs) {
    energyOrbs.push({
        x: Math.random() * (W - 40) + 20,
        y: -15,
        r: ENERGY_ORB_RADIUS,
        vy: 1.5 + Math.random(),
        pulse: 0
    });
}

/**
 * 更新所有障碍物，检测碰撞
 * @returns {boolean} true = 发生碰撞（玩家死亡）
 */
export function updateObstacles(obstacles, player) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.y += o.vy;
        o.x += o.vx;

        // 追踪型障碍物追踪玩家
        if (o.type === 'homing') {
            const hdx = player.x - o.x;
            o.vx += hdx * 0.002;
            o.vx = Math.max(-3, Math.min(3, o.vx));
        }

        if (o.flash > 0) o.flash--;

        // 移除越界障碍物
        if (o.y > H + 30 || o.x < -50 || o.x > W + 50) {
            obstacles.splice(i, 1);
            continue;
        }

        // === BUG FIX #2: 碰撞检测使用中心坐标，与绘制坐标统一 ===
        // o.x, o.y 是左上角；矩形中心 = (o.x + o.w/2, o.y + o.h/2)
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const closestX = Math.max(-o.w / 2, Math.min(o.w / 2, player.x - cx));
        const closestY = Math.max(-o.h / 2, Math.min(o.h / 2, player.y - cy));
        const distX = player.x - cx - closestX;
        const distY = player.y - cy - closestY;

        if (distX * distX + distY * distY < player.r * player.r) {
            return true; // 碰撞！
        }
    }
    return false;
}

/**
 * 更新能量球，检测拾取
 * @returns {number} 拾取获得的分数（0 = 未拾取）
 */
export function updateEnergyOrbs(energyOrbs, player, particles) {
    for (let i = energyOrbs.length - 1; i >= 0; i--) {
        const e = energyOrbs[i];
        e.y += e.vy;
        e.pulse += 0.05;

        if (e.y > H + 20) {
            energyOrbs.splice(i, 1);
            continue;
        }

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (dx * dx + dy * dy < (player.r + e.r) * (player.r + e.r)) {
            Sound.play('collect');
            spawnCollectParticles(particles, e.x, e.y);
            energyOrbs.splice(i, 1);
            return ENERGY_ORB_SCORE;
        }
    }
    return 0;
}

/**
 * 生成死亡粒子效果
 */
export function spawnDeathParticles(particles, player) {
    const colors = ['#00e5ff', '#fff', '#f44336'];
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 3,
            life: 30 + Math.random() * 20,
            color: colors[Math.floor(Math.random() * 3)]
        });
    }
}

/**
 * 生成拾取粒子效果
 */
function spawnCollectParticles(particles, x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20 + Math.random() * 10,
            color: '#00ff96'
        });
    }
}

/**
 * 更新粒子系统，移除死亡粒子
 */
export function updateParticles(particles) {
    return particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        return p.life > 0;
    });
}
