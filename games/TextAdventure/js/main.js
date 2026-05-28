// main.js - 游戏引擎、状态机、事件监听
import { CONFIG } from './config.js';
import { sound } from './sound.js';
import { STORY } from './story.js';
import { Character } from './character.js';
import { CombatSystem } from './combat.js';
import { evaluateEnding, unlockEnding, ENDINGS, getUnlockedEndings } from './endings.js';
import { UI } from './ui.js';

class Game {
  constructor() {
    this.character = null;
    this.ui = new UI();
    this.combat = null;
    this.state = 'menu'; // menu | playing | combat | ending
    this.currentSceneData = null;

    // 暴露给全局（供 story.js 条件判断使用）
    window.game = this;

    this._bindEvents();
    this._showMainMenu();
  }

  // ===== 事件绑定 =====
  _bindEvents() {
    // 音效开关
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const enabled = sound.toggle();
        this.ui.updateSoundButton(enabled);
      });
    }

    // 跳过打字
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.ui.skipTypewriter();
      });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // 空格跳过打字
      if (e.code === 'Space' && this.ui._isTyping) {
        e.preventDefault();
        this.ui.skipTypewriter();
        return;
      }
      // 数字键选择
      if (e.key >= '1' && e.key <= '9' && this.state === 'playing') {
        const btns = this.ui.choicesArea?.querySelectorAll('.choice-btn:not(.disabled)');
        const idx = parseInt(e.key) - 1;
        if (btns && btns[idx]) {
          btns[idx].click();
        }
      }
    });

    // 结局界面关闭
    const endingClose = document.getElementById('ending-close');
    if (endingClose) {
      endingClose.addEventListener('click', () => {
        sound.click();
        this.ui.hideEnding();
        this._showMainMenu();
      });
    }

    // 存档按钮
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this._saveGame();
        this.ui.showMessage('游戏已保存');
      });
    }
  }

  // ===== 主菜单 =====
  _showMainMenu() {
    this.state = 'menu';
    const hasSave = !!localStorage.getItem(CONFIG.SAVE_KEY);
    this.ui.showMenu(
      () => this._newGame(),
      () => this._loadGame(),
      () => this._showEndingsCollection()
    );
  }

  // ===== 新游戏 =====
  _newGame() {
    this.character = new Character();
    this.ui.clearAll();
    this.ui.updateStats(this.character);
    this.ui.updateInventory(this.character);
    this._enterScene('start');
  }

  // ===== 存档 =====
  _saveGame() {
    if (!this.character) return;
    const data = this.character.serialize();
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
  }

  // ===== 读档 =====
  _loadGame() {
    try {
      const data = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY));
      if (!data) {
        this.ui.showMessage('没有找到存档');
        this._showMainMenu();
        return;
      }
      this.character = Character.deserialize(data);
      this.ui.clearAll();
      this.ui.updateStats(this.character);
      this.ui.updateInventory(this.character);
      this._enterScene(this.character.currentScene);
    } catch (e) {
      console.error('读取存档失败:', e);
      this.ui.showMessage('存档损坏，开始新游戏');
      this._newGame();
    }
  }

  // ===== 进入场景 =====
  async _enterScene(sceneId) {
    // 重新开始
    if (sceneId === 'restart') {
      localStorage.removeItem(CONFIG.SAVE_KEY);
      this._newGame();
      return;
    }

    const scene = STORY[sceneId];
    if (!scene) {
      console.error('场景不存在:', sceneId);
      this.ui.showMessage('场景不存在: ' + sceneId);
      return;
    }

    this.state = 'playing';
    this.currentSceneData = scene;
    this.character.visitScene(sceneId);
    this.character.chapter = scene.chapter;

    // 更新章节标题
    const chapterName = CONFIG.CHAPTER_NAMES[scene.chapter] || '';
    if (chapterName) {
      this.ui.setChapterTitle(chapterName);
    }

    // 场景进入效果
    if (scene.chapter === 'chapter3' || scene.chapter === 'chapter4') {
      sound.horror();
    }

    // 战斗场景
    if (scene.combat) {
      await this._startCombat(scene);
      return;
    }

    // 显示文本
    await this.ui.showText(scene.text);

    // 应用场景效果
    if (scene.effects) {
      this._applyEffects(scene.effects);
    }
    if (scene.addItem) {
      this.character.addItem(scene.addItem);
      sound.item();
      this.ui.showMessage(`获得了 ${scene.addItem}！`);
    }
    if (scene.setFlag) {
      this.character.setFlag(scene.setFlag);
    }
    if (scene.hp) {
      this.character.modifyHp(scene.hp);
    }

    // 更新UI
    this.ui.updateStats(this.character);
    this.ui.updateInventory(this.character);

    // 检查结局
    const ending = evaluateEnding(this.character);
    if (ending && ending.id !== 'death') {
      this._triggerEnding(ending);
      return;
    }

    // 显示选择
    this._showSceneChoices(scene);

    // 自动保存
    this._saveGame();
  }

  // ===== 显示场景选择 =====
  _showSceneChoices(scene) {
    const choices = scene.choices.map((choice) => {
      const processed = { ...choice };

      // 检查物品需求
      if (choice.requireItem && !this.character.hasItem(choice.requireItem)) {
        processed.disabled = true;
        processed.disabledReason = choice.conditionMessage || `需要物品: ${choice.requireItem}`;
      }

      // 检查条件函数
      if (choice.condition && !choice.condition()) {
        processed.disabled = true;
        processed.disabledReason = '条件不满足';
      }

      return processed;
    });

    this.ui.showChoices(choices, (choice) => this._handleChoice(choice));
  }

  // ===== 处理选择 =====
  async _handleChoice(choice) {
    // 设置标记
    if (choice.setFlag) {
      this.character.setFlag(choice.setFlag);
    }

    // 移除物品
    if (choice.removeItem) {
      this.character.removeItem(choice.removeItem);
    }

    // 属性检定
    if (choice.statCheck) {
      const { stat, difficulty } = choice.statCheck;
      const roll = this.character.getStat(stat) + Math.floor(Math.random() * 6) + 1;
      const success = roll >= difficulty;

      if (success && choice.successEffects) {
        await this.ui.showText(choice.successEffects.message || '');
        this._applyEffects(choice.successEffects);
      } else if (!success && choice.failEffects) {
        await this.ui.showText(choice.failEffects.message || '');
        this._applyEffects(choice.failEffects);
      }

      // 更新UI
      this.ui.updateStats(this.character);
      this.ui.updateInventory(this.character);

      // 检查死亡
      if (!this.character.isAlive()) {
        const ending = evaluateEnding(this.character);
        if (ending) {
          this._triggerEnding(ending);
          return;
        }
      }
    } else if (choice.effects) {
      await this.ui.showText(choice.effects.message || '');
      this._applyEffects(choice.effects);
      this.ui.updateStats(this.character);
      this.ui.updateInventory(this.character);
    }

    // 添加物品
    if (choice.addItem) {
      this.character.addItem(choice.addItem);
      sound.item();
      this.ui.showMessage(`获得了 ${choice.addItem}！`);
      this.ui.updateInventory(this.character);
    }
    if (choice.addItem2) {
      this.character.addItem(choice.addItem2);
      this.ui.updateInventory(this.character);
    }

    // 进入下一个场景
    const nextScene = choice.effects?.nextScene || choice.successEffects?.nextScene || choice.nextScene;
    if (nextScene) {
      await new Promise((r) => setTimeout(r, 500));
      this._enterScene(nextScene);
    }
  }

  // ===== 应用效果 =====
  _applyEffects(effects) {
    if (!effects) return;
    if (effects.hp) {
      this.character.modifyHp(effects.hp);
    }
    if (effects.addItem) {
      this.character.addItem(effects.addItem);
      sound.item();
    }
    if (effects.removeItem) {
      this.character.removeItem(effects.removeItem);
    }
    if (effects.setFlag) {
      this.character.setFlag(effects.setFlag);
    }
    if (effects.modifyStat) {
      for (const [stat, val] of Object.entries(effects.modifyStat)) {
        this.character.modifyStat(stat, val);
      }
    }
  }

  // ===== 战斗系统 =====
  async _startCombat(scene) {
    this.state = 'combat';
    this.combat = new CombatSystem(this.character, (result) => this._onCombatEnd(result, scene));

    // 先显示战斗前文本
    await this.ui.showText(scene.text);

    // 开始战斗
    const initLog = this.combat.start(scene.combat);
    const combatState = this.combat.getState();
    combatState.log = initLog;

    this.ui.showCombat(combatState);
    this._showCombatActions(scene);
  }

  _showCombatActions(scene) {
    this.ui.showCombatActions((action, item) => {
      const msgs = this.combat.playerAction(action, item);
      const state = this.combat.getState();
      state.log = msgs;
      this.ui.updateCombatUI(state);
      this.ui.updateStats(this.character);

      if (this.combat.finished) {
        setTimeout(() => this._onCombatEnd(this.combat.result, scene), 1500);
      }
    });
  }

  async _onCombatEnd(result, scene) {
    this.ui.hideCombat();
    this.state = 'playing';

    if (result === 'win') {
      // 检查死亡结局
      if (!this.character.isAlive()) {
        const ending = evaluateEnding(this.character);
        if (ending) {
          this._triggerEnding(ending);
          return;
        }
      }
      // 继续到下一场景
      if (scene.choices && scene.choices.length > 0) {
        await this.ui.showText(scene.text || '战斗胜利！');
        this._showSceneChoices(scene);
      }
    } else if (result === 'escape') {
      // 逃跑回到上一个场景
      await this.ui.showText('你成功逃离了战斗。');
      const prevScene = this.character.history[this.character.history.length - 2] || 'entrance_hall';
      this._enterScene(prevScene);
    } else if (result === 'lose') {
      const ending = evaluateEnding(this.character);
      if (ending) {
        this._triggerEnding(ending);
      }
    }

    this.ui.updateStats(this.character);
    this.ui.updateInventory(this.character);
    this._saveGame();
  }

  // ===== 结局 =====
  _triggerEnding(ending) {
    this.state = 'ending';
    unlockEnding(ending.id);
    this.ui.showEnding(ending);
  }

  // ===== 结局收集 =====
  _showEndingsCollection() {
    const unlocked = getUnlockedEndings();
    this.ui.showEndingsCollection(ENDINGS, unlocked);
  }
}

// ===== 启动游戏 =====
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
