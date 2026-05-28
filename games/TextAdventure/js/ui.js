// ui.js - 打字机效果文本、选择按钮、状态栏、物品栏
import { CONFIG } from './config.js';
import { sound } from './sound.js';

export class UI {
  constructor() {
    // DOM 元素引用
    this.textArea = document.getElementById('text-area');
    this.choicesArea = document.getElementById('choices-area');
    this.chapterTitle = document.getElementById('chapter-title');
    this.hpBar = document.getElementById('hp-bar');
    this.hpText = document.getElementById('hp-text');
    this.statsDisplay = document.getElementById('stats-display');
    this.inventoryList = document.getElementById('inventory-list');
    this.combatPanel = document.getElementById('combat-panel');
    this.combatLog = document.getElementById('combat-log');
    this.combatActions = document.getElementById('combat-actions');
    this.enemyInfo = document.getElementById('enemy-info');
    this.menuOverlay = document.getElementById('menu-overlay');
    this.endingOverlay = document.getElementById('ending-overlay');
    this.messageToast = document.getElementById('message-toast');
    this.soundBtn = document.getElementById('sound-btn');
    this.skipBtn = document.getElementById('skip-btn');

    this._typewriterTimer = null;
    this._currentText = '';
    this._charIndex = 0;
    this._isTyping = false;
    this._onTypeComplete = null;
    this._skipRequested = false;
  }

  // ===== 打字机效果 =====
  async showText(text, onAction) {
    return new Promise((resolve) => {
      this._currentText = text;
      this._charIndex = 0;
      this._isTyping = true;
      this._skipRequested = false;
      this.textArea.innerHTML = '';
      this.choicesArea.innerHTML = '';
      this.textArea.classList.add('active');

      // 显示跳过按钮
      if (this.skipBtn) {
        this.skipBtn.style.display = 'inline-block';
      }

      this._onTypeComplete = () => {
        this._isTyping = false;
        if (this.skipBtn) this.skipBtn.style.display = 'none';
        if (onAction) onAction();
        resolve();
      };

      this._typeNext();
    });
  }

  _typeNext() {
    if (this._skipRequested) {
      this.textArea.innerHTML = this._formatText(this._currentText);
      this._isTyping = false;
      if (this.skipBtn) this.skipBtn.style.display = 'none';
      if (this._onTypeComplete) this._onTypeComplete();
      return;
    }

    if (this._charIndex >= this._currentText.length) {
      this._isTyping = false;
      if (this.skipBtn) this.skipBtn.style.display = 'none';
      if (this._onTypeComplete) this._onTypeComplete();
      return;
    }

    const char = this._currentText[this._charIndex];
    // 追加字符
    if (char === '\n') {
      this.textArea.innerHTML += '<br>';
    } else {
      this.textArea.innerHTML += this._escapeChar(char);
    }

    // 打字音效（每3个字符一次，避免太频繁）
    if (this._charIndex % 3 === 0) {
      sound.type();
    }

    this._charIndex++;

    // 根据标点符号调整速度
    let delay = CONFIG.TYPE_SPEED;
    if ('。！？……'.includes(char)) delay = CONFIG.TYPE_SPEED * 4;
    else if ('，、；：'.includes(char)) delay = CONFIG.TYPE_SPEED * 2;
    else if (char === '\n') delay = CONFIG.TYPE_SPEED * 3;

    this._typewriterTimer = setTimeout(() => this._typeNext(), delay);
  }

  skipTypewriter() {
    if (this._isTyping) {
      this._skipRequested = true;
      sound.click();
    }
  }

  _escapeChar(char) {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return map[char] || char;
  }

  _formatText(text) {
    return text
      .split('\n')
      .map((line) => (line.trim() === '' ? '<br>' : `<p>${line}</p>`))
      .join('');
  }

  // ===== 选择按钮 =====
  showChoices(choices, onSelect) {
    this.choicesArea.innerHTML = '';
    choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-number">${index + 1}</span> ${choice.text}`;

      if (choice.disabled) {
        btn.classList.add('disabled');
        if (choice.disabledReason) {
          btn.title = choice.disabledReason;
        }
      }

      btn.addEventListener('click', () => {
        if (choice.disabled) {
          sound.click();
          this.showMessage(choice.disabledReason || '条件不满足');
          return;
        }
        sound.click();
        btn.classList.add('selected');
        // 禁用所有按钮
        this.choicesArea.querySelectorAll('.choice-btn').forEach((b) => {
          b.classList.add('disabled');
          b.style.pointerEvents = 'none';
        });
        onSelect(choice, index);
      });

      // 延迟显示动画
      btn.style.animationDelay = `${index * 0.1}s`;
      this.choicesArea.appendChild(btn);
    });
  }

  // ===== 章节标题 =====
  setChapterTitle(title) {
    if (this.chapterTitle) {
      this.chapterTitle.textContent = title;
      this.chapterTitle.classList.add('fade-in');
      setTimeout(() => this.chapterTitle.classList.remove('fade-in'), 1000);
    }
  }

  // ===== 状态栏 =====
  updateStats(character) {
    // HP
    const hpPercent = Math.max(0, (character.hp / character.maxHp) * 100);
    if (this.hpBar) {
      this.hpBar.style.width = hpPercent + '%';
      this.hpBar.className = 'hp-fill';
      if (hpPercent <= 25) this.hpBar.classList.add('critical');
      else if (hpPercent <= 50) this.hpBar.classList.add('low');
    }
    if (this.hpText) {
      this.hpText.textContent = `HP: ${character.hp} / ${character.maxHp}`;
    }

    // 属性
    if (this.statsDisplay) {
      this.statsDisplay.innerHTML = '';
      for (const [key, name] of Object.entries(CONFIG.STAT_NAMES)) {
        const icon = CONFIG.STAT_ICONS[key];
        const val = character.getStat(key);
        const statEl = document.createElement('div');
        statEl.className = 'stat-item';
        statEl.innerHTML = `<span class="stat-icon">${icon}</span><span class="stat-name">${name}</span><span class="stat-value">${val}</span>`;
        this.statsDisplay.appendChild(statEl);
      }
    }
  }

  // ===== 物品栏 =====
  updateInventory(character) {
    if (!this.inventoryList) return;
    this.inventoryList.innerHTML = '';
    if (character.inventory.length === 0) {
      this.inventoryList.innerHTML = '<div class="empty-inventory">背包为空</div>';
      return;
    }
    character.inventory.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'inventory-item';
      el.textContent = item;
      el.title = item;
      this.inventoryList.appendChild(el);
    });
  }

  // ===== 战斗面板 =====
  showCombat(combatState) {
    if (!this.combatPanel) return;
    this.combatPanel.classList.add('active');
    this.textArea.classList.remove('active');
    this.choicesArea.innerHTML = '';

    this.updateCombatUI(combatState);
  }

  hideCombat() {
    if (this.combatPanel) {
      this.combatPanel.classList.remove('active');
    }
    this.textArea.classList.add('active');
  }

  updateCombatUI(combatState) {
    if (!combatState) return;

    // 敌人信息
    if (this.enemyInfo) {
      const hpPercent = Math.max(0, (combatState.enemyHp / combatState.enemyMaxHp) * 100);
      this.enemyInfo.innerHTML = `
        <div class="enemy-name">${combatState.enemyName}</div>
        <div class="enemy-hp-bar">
          <div class="enemy-hp-fill" style="width: ${hpPercent}%"></div>
        </div>
        <div class="enemy-hp-text">HP: ${combatState.enemyHp} / ${combatState.enemyMaxHp}</div>
      `;
    }

    // 战斗日志
    if (this.combatLog) {
      this.combatLog.innerHTML = combatState.log.map((msg) => `<div class="combat-log-line">${msg}</div>`).join('');
      this.combatLog.scrollTop = this.combatLog.scrollHeight;
    }
  }

  showCombatActions(onAction) {
    if (!this.combatActions) return;
    this.combatActions.innerHTML = '';

    const actions = [
      { id: 'attack', text: '⚔️ 攻击', desc: '用力量进行攻击' },
      { id: 'defend', text: '🛡️ 防御', desc: '减少受到的伤害' },
      { id: 'useItem', text: '💊 使用物品', desc: '使用背包中的物品' },
      { id: 'escape', text: '🏃 逃跑', desc: '尝试逃离战斗' },
    ];

    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.className = 'combat-btn';
      btn.textContent = action.text;
      btn.title = action.desc;
      btn.addEventListener('click', () => {
        sound.combat();
        if (action.id === 'useItem') {
          this._showItemSelection(onAction);
        } else {
          onAction(action.id);
        }
      });
      this.combatActions.appendChild(btn);
    });
  }

  _showItemSelection(onAction) {
    const character = window.game?.character;
    if (!character || character.inventory.length === 0) {
      this.showMessage('背包中没有可用的物品！');
      return;
    }

    this.combatActions.innerHTML = '<div class="item-select-title">选择要使用的物品：</div>';
    const usableItems = character.inventory.filter((item) =>
      ['草药包', '治疗药水', '神秘药水', '陈年红酒', '月露精华', '幽冥之花'].includes(item)
    );

    if (usableItems.length === 0) {
      this.showMessage('没有可以在战斗中使用的物品！');
      setTimeout(() => this.showCombatActions(onAction), 1500);
      return;
    }

    usableItems.forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'combat-btn item-btn';
      btn.textContent = item;
      btn.addEventListener('click', () => {
        sound.item();
        onAction('useItem', item);
      });
      this.combatActions.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.className = 'combat-btn back-btn';
    backBtn.textContent = '← 返回';
    backBtn.addEventListener('click', () => this.showCombatActions(onAction));
    this.combatActions.appendChild(backBtn);
  }

  appendCombatLog(msgs) {
    if (!this.combatLog) return;
    msgs.forEach((msg) => {
      const line = document.createElement('div');
      line.className = 'combat-log-line fade-in';
      line.textContent = msg;
      this.combatLog.appendChild(line);
    });
    this.combatLog.scrollTop = this.combatLog.scrollHeight;
  }

  // ===== 菜单 =====
  showMenu(onNewGame, onContinue, onEndings) {
    if (!this.menuOverlay) return;
    this.menuOverlay.classList.add('active');

    const newGameBtn = document.getElementById('menu-new-game');
    const continueBtn = document.getElementById('menu-continue');
    const endingsBtn = document.getElementById('menu-endings');

    if (newGameBtn) {
      newGameBtn.onclick = () => {
        sound.click();
        this.hideMenu();
        onNewGame();
      };
    }
    if (continueBtn) {
      continueBtn.onclick = () => {
        sound.click();
        this.hideMenu();
        onContinue();
      };
    }
    if (endingsBtn) {
      endingsBtn.onclick = () => {
        sound.click();
        onEndings();
      };
    }
  }

  hideMenu() {
    if (this.menuOverlay) {
      this.menuOverlay.classList.remove('active');
    }
  }

  // ===== 结局画面 =====
  showEnding(ending) {
    if (!this.endingOverlay) return;
    const title = document.getElementById('ending-title');
    const desc = document.getElementById('ending-desc');
    const type = document.getElementById('ending-type');

    if (title) title.textContent = ending.title;
    if (desc) desc.textContent = ending.description;
    if (type) {
      const typeMap = { bad: '🌑 坏结局', neutral: '🌗 中立结局', good: '🌖 好结局', true: '🌕 真结局' };
      type.textContent = typeMap[ending.type] || '';
    }

    this.endingOverlay.classList.add('active');

    // 根据结局类型播放音效
    if (ending.type === 'bad' || ending.id === 'death') {
      sound.death();
    } else {
      sound.victory();
    }
  }

  hideEnding() {
    if (this.endingOverlay) {
      this.endingOverlay.classList.remove('active');
    }
  }

  // ===== 消息提示 =====
  showMessage(text, duration = 2500) {
    if (!this.messageToast) return;
    this.messageToast.textContent = text;
    this.messageToast.classList.add('show');
    setTimeout(() => this.messageToast.classList.remove('show'), duration);
  }

  // ===== 音效按钮 =====
  updateSoundButton(enabled) {
    if (this.soundBtn) {
      this.soundBtn.textContent = enabled ? '🔊' : '🔇';
    }
  }

  // ===== 结局收集展示 =====
  showEndingsCollection(endings, unlockedIds) {
    if (!this.endingOverlay) return;
    const title = document.getElementById('ending-title');
    const desc = document.getElementById('ending-desc');
    const type = document.getElementById('ending-type');

    if (title) title.textContent = '结局收集';
    if (type) {
      const completion = Math.round((unlockedIds.length / Object.keys(endings).length) * 100);
      type.textContent = `完成度: ${unlockedIds.length}/${Object.keys(endings).length} (${completion}%)`;
    }
    if (desc) {
      desc.innerHTML = '';
      for (const [id, ending] of Object.entries(endings)) {
        const el = document.createElement('div');
        el.className = 'ending-entry';
        const unlocked = unlockedIds.includes(id);
        el.classList.add(unlocked ? 'unlocked' : 'locked');
        const typeIcon = { bad: '🌑', neutral: '🌗', good: '🌖', true: '🌕' };
        el.innerHTML = `
          <span class="ending-icon">${unlocked ? typeIcon[ending.type] : '❓'}</span>
          <span class="ending-name">${unlocked ? ending.title : '???'}</span>
          ${unlocked ? `<span class="ending-desc-mini">${ending.description}</span>` : ''}
        `;
        desc.appendChild(el);
      }
    }

    this.endingOverlay.classList.add('active');
  }

  // 清除所有内容
  clearAll() {
    if (this.textArea) this.textArea.innerHTML = '';
    if (this.choicesArea) this.choicesArea.innerHTML = '';
    this.hideCombat();
  }
}
