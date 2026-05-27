// UI 系统：HUD 更新、菜单覆盖层
import { W, H } from './config.js';
import { drawBricks } from './bricks.js';
import { drawPaddle } from './paddle.js';
import { drawBalls } from './ball.js';
import { drawPowerups, drawParticles, drawLaserBeams } from './items.js';
import { POWERUP_ICONS } from './config.js';

/**
 * 更新 HUD 显示
 */
export function updateHUD(score, level, lives, highScore) {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lives').textContent = lives;
    document.getElementById('high').textContent = Math.max(highScore || 0, score);
}

/**
 * 显示游戏结束画面
 */
export function showGameOver(score, level, highScore) {
    document.getElementById('goStats').innerHTML = `分数: ${score}<br>关卡: ${level}<br>最高: ${highScore}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

/**
 * 显示通关画面
 */
export function showWin(score, highScore) {
    document.getElementById('winStats').innerHTML = `总分: ${score}<br>最高: ${highScore}`;
    document.getElementById('winScreen').classList.remove('hidden');
}

/**
 * 隐藏所有覆盖屏幕
 */
export function hideAllScreens() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('winScreen').classList.add('hidden');
}

/**
 * 绘制整个游戏画面
 */
export function draw(ctx, state) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);

    drawBricks(ctx, state.bricks);

    // 挡板
    drawPaddle(ctx, state.paddle);

    // 激光
    drawLaserBeams(ctx, state.laserBeams, H);

    // 球
    drawBalls(ctx, state.balls);

    // 道具
    drawPowerups(ctx, state.powerups, POWERUP_ICONS);

    // 粒子
    drawParticles(ctx, state.particles);
}
