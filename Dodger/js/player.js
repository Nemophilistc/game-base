// 躲避球 - 玩家角色
import { W, H, PLAYER_RADIUS, PLAYER_SPEED, TRAIL_LENGTH } from './config.js';

/**
 * 创建新的玩家对象
 */
export function createPlayer() {
    return {
        x: W / 2,
        y: H - 60,
        r: PLAYER_RADIUS,
        speed: PLAYER_SPEED,
        trail: []
    };
}

/**
 * 更新玩家位置与拖尾
 * @param {object} player - 玩家对象
 * @param {number} dx - 水平方向 (-1/0/1)
 * @param {number} dy - 垂直方向 (-1/0/1)
 */
export function updatePlayer(player, dx, dy) {
    if (dx || dy) {
        const len = Math.sqrt(dx * dx + dy * dy);
        player.x += (dx / len) * player.speed;
        player.y += (dy / len) * player.speed;
    }

    // 边界限制
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));

    // 拖尾
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > TRAIL_LENGTH) player.trail.shift();
}
