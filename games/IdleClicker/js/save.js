// 存档系统
import { CONFIG } from './config.js';
import { game } from './game.js';
import { formatNumber, formatTime } from './utils.js';

class SaveSystem {
  constructor() {
    this.saveKey = 'idleClicker_save';
    this.autoSaveInterval = null;
  }

  // 初始化存档系统
  init() {
    // 加载存档
    this.load();

    // 启动自动存档
    this.startAutoSave();

    // 页面关闭前保存
    window.addEventListener('beforeunload', () => {
      this.save();
    });

    // 页面可见性变化时保存
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.save();
      }
    });
  }

  // 启动自动存档
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      this.save();
    }, CONFIG.settings.saveInterval);
  }

  // 停止自动存档
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // 保存游戏
  save() {
    try {
      const saveData = game.getSaveData();
      const saveString = JSON.stringify(saveData);
      localStorage.setItem(this.saveKey, saveString);
      return true;
    } catch (e) {
      console.error('保存游戏失败:', e);
      return false;
    }
  }

  // 加载游戏
  load() {
    try {
      const saveString = localStorage.getItem(this.saveKey);
      if (!saveString) return false;

      const saveData = JSON.parse(saveString);
      const loaded = game.loadSaveData(saveData);

      if (loaded) {
        // 计算离线收益
        this.calculateOfflineEarnings(saveData);
      }

      return loaded;
    } catch (e) {
      console.error('加载游戏失败:', e);
      return false;
    }
  }

  // 计算离线收益
  calculateOfflineEarnings(saveData) {
    if (!saveData.lastSaveTime) return;

    const now = Date.now();
    const offlineMs = now - saveData.lastSaveTime;
    const offlineSeconds = offlineMs / 1000;

    // 如果离线时间小于10秒，不计算离线收益
    if (offlineSeconds < 10) return;

    const earnings = game.calculateOfflineEarnings(offlineSeconds);

    if (earnings > 0) {
      game.applyOfflineEarnings(earnings);

      // 显示离线收益通知
      this.showOfflineNotification(earnings, offlineSeconds);
    }
  }

  // 显示离线收益通知
  showOfflineNotification(earnings, offlineSeconds) {
    const notification = document.getElementById('offline-notification');
    if (!notification) return;

    const earningsText = formatNumber(earnings);
    const timeText = formatTime(offlineSeconds);

    notification.innerHTML = `
      <div class="offline-content">
        <h3>欢迎回来！</h3>
        <p>您离线了 ${timeText}</p>
        <p>离线收益：<span class="gold-amount">${earningsText}</span> 金币</p>
        <button id="offline-claim-btn">领取</button>
      </div>
    `;

    notification.style.display = 'flex';

    const claimBtn = document.getElementById('offline-claim-btn');
    claimBtn.addEventListener('click', () => {
      notification.style.display = 'none';
    });
  }

  // 删除存档
  deleteSave() {
    try {
      localStorage.removeItem(this.saveKey);
      return true;
    } catch (e) {
      console.error('删除存档失败:', e);
      return false;
    }
  }

  // 导出存档
  exportSave() {
    try {
      const saveData = game.getSaveData();
      const saveString = JSON.stringify(saveData, null, 2);

      // 创建下载
      const blob = new Blob([saveString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `idleClicker_save_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (e) {
      console.error('导出存档失败:', e);
      return false;
    }
  }

  // 导入存档
  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result);
          const loaded = game.loadSaveData(saveData);

          if (loaded) {
            this.save();
            resolve(true);
          } else {
            reject(new Error('无效的存档文件'));
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };

      reader.readAsText(file);
    });
  }

  // 重置游戏
  resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
      this.deleteSave();
      game.reset();
      return true;
    }
    return false;
  }

  // 获取存档信息
  getSaveInfo() {
    try {
      const saveString = localStorage.getItem(this.saveKey);
      if (!saveString) return null;

      const saveData = JSON.parse(saveString);
      return {
        exists: true,
        lastSave: saveData.lastSaveTime ? new Date(saveData.lastSaveTime).toLocaleString('zh-CN') : '未知',
        gold: saveData.gold || 0,
        totalGold: saveData.totalGold || 0,
        buildings: Object.values(saveData.buildings || {}).reduce((sum, count) => sum + count, 0)
      };
    } catch (e) {
      return null;
    }
  }
}

// 导出单例
export const save = new SaveSystem();
