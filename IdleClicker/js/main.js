// 游戏主循环
import { game } from './game.js';
import { save } from './save.js';
import { ui } from './ui.js';
import { achievements } from './achievements.js';

class GameLoop {
  constructor() {
    this.tickInterval = null;
    this.uiUpdateInterval = null;
    this.running = false;
  }

  // 初始化游戏
  init() {
    console.log('放置挂机游戏初始化中...');

    // 初始化存档系统（会自动加载存档）
    save.init();

    // 初始化UI
    ui.init();

    // 启动游戏循环
    this.start();

    console.log('游戏初始化完成！');
    console.log('当前金币:', game.gold);
    console.log('每秒产出:', game.productionPerSecond);
  }

  // 启动游戏循环
  start() {
    if (this.running) return;

    this.running = true;

    // 游戏逻辑tick（每秒）
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / CONFIG.settings.ticksPerSecond);

    // UI更新（每秒更新多次以保持流畅）
    this.uiUpdateInterval = setInterval(() => {
      this.updateUI();
    }, 100); // 100ms = 10fps UI更新

    console.log('游戏循环已启动');
  }

  // 停止游戏循环
  stop() {
    if (!this.running) return;

    this.running = false;

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    if (this.uiUpdateInterval) {
      clearInterval(this.uiUpdateInterval);
      this.uiUpdateInterval = null;
    }

    console.log('游戏循环已停止');
  }

  // 游戏tick
  tick() {
    // 更新游戏状态
    const earned = game.tick();

    // 检查成就
    achievements.checkAndUnlock();
  }

  // 更新UI
  updateUI() {
    ui.updateStats();
  }
}

// 导入CONFIG（用于tick间隔）
import { CONFIG } from './config.js';

// 创建游戏循环实例
const gameLoop = new GameLoop();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  gameLoop.init();
});

// 导出（可选，用于调试）
export { gameLoop };
