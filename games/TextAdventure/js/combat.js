// combat.js - 遭遇战系统（简单回合制）
import { CONFIG } from './config.js';

export class CombatSystem {
  constructor(character, onCombatEnd) {
    this.character = character;
    this.onCombatEnd = onCombatEnd;
    this.enemy = null;
    this.log = [];
    this.playerTurn = true;
    this.finished = false;
    this.result = null; // 'win' | 'lose' | 'escape'
  }

  start(enemyData) {
    this.enemy = {
      name: enemyData.name,
      hp: enemyData.hp,
      maxHp: enemyData.hp,
      attack: enemyData.attack,
      defense: enemyData.defense,
      description: enemyData.description,
      rewards: enemyData.rewards || {},
    };
    this.log = [`⚔️ 遭遇了 ${this.enemy.name}！`, this.enemy.description];
    this.playerTurn = true;
    this.finished = false;
    this.result = null;
    return this.log.slice();
  }

  // 玩家攻击力
  getPlayerAttack() {
    const base = CONFIG.COMBAT.BASE_ATTACK + this.character.getStat('strength') * 2;
    const variance = Math.floor(base * 0.3);
    let damage = base + Math.floor(Math.random() * variance * 2) - variance;

    // 暴击
    if (Math.random() < CONFIG.COMBAT.CRITICAL_CHANCE + this.character.getStat('dexterity') * 0.01) {
      damage = Math.floor(damage * CONFIG.COMBAT.CRITICAL_MULTIPLIER);
      return { damage, critical: true };
    }
    return { damage, critical: false };
  }

  // 玩家防御力
  getPlayerDefense() {
    return CONFIG.COMBAT.BASE_DEFENSE + this.character.getStat('dexterity');
  }

  // 敌人攻击
  getEnemyAttack() {
    const base = this.enemy.attack;
    const variance = Math.floor(base * 0.3);
    return base + Math.floor(Math.random() * variance * 2) - variance;
  }

  // 玩家行动
  playerAction(action, item) {
    if (this.finished || !this.playerTurn) return [];
    const msgs = [];

    switch (action) {
      case 'attack': {
        const { damage, critical } = this.getPlayerAttack();
        const actualDmg = Math.max(1, damage - this.enemy.defense);
        this.enemy.hp = Math.max(0, this.enemy.hp - actualDmg);
        if (critical) {
          msgs.push(`💥 暴击！你对 ${this.enemy.name} 造成了 ${actualDmg} 点伤害！`);
        } else {
          msgs.push(`⚔️ 你攻击了 ${this.enemy.name}，造成了 ${actualDmg} 点伤害。`);
        }
        if (this.enemy.hp <= 0) {
          msgs.push(`🎉 你击败了 ${this.enemy.name}！`);
          this.finished = true;
          this.result = 'win';
          this._applyRewards(msgs);
        }
        break;
      }
      case 'defend': {
        this._isDefending = true;
        msgs.push('🛡️ 你举起防御姿态，准备迎接攻击。');
        break;
      }
      case 'useItem': {
        if (item && this.character.hasItem(item)) {
          const healed = this._useItemEffect(item);
          if (healed > 0) {
            msgs.push(`💊 你使用了 ${item}，恢复了 ${healed} 点生命值。`);
          } else {
            msgs.push(`你使用了 ${item}。`);
          }
        } else {
          msgs.push('你没有这个物品。');
          return msgs;
        }
        break;
      }
      case 'escape': {
        const chance = CONFIG.COMBAT.ESCAPE_CHANCE + this.character.getStat('dexterity') * 0.05;
        if (Math.random() < chance) {
          msgs.push('🏃 你成功逃离了战斗！');
          this.finished = true;
          this.result = 'escape';
        } else {
          msgs.push('🏃 你试图逃跑，但被敌人挡住了去路！');
        }
        break;
      }
    }

    if (this.finished) return msgs;

    // 敌人回合
    this.playerTurn = false;
    msgs.push(...this._enemyTurn());
    this.playerTurn = true;

    // 检查玩家死亡
    if (!this.character.isAlive()) {
      msgs.push('💀 你的意识逐渐模糊……你倒下了。');
      this.finished = true;
      this.result = 'lose';
    }

    return msgs;
  }

  _enemyTurn() {
    const msgs = [];
    let atk = this.getEnemyAttack();

    if (this._isDefending) {
      atk = Math.floor(atk * CONFIG.COMBAT.DEFENSE_DEF_MULTIPLIER);
      this._isDefending = false;
      msgs.push(`🛡️ 防御减伤！${this.enemy.name} 的攻击被削弱了。`);
    }

    const actualDmg = Math.max(1, atk - this.getPlayerDefense());
    this.character.modifyHp(-actualDmg);
    msgs.push(`💀 ${this.enemy.name} 攻击了你，造成了 ${actualDmg} 点伤害。（HP: ${this.character.hp}/${this.character.maxHp}）`);

    return msgs;
  }

  _useItemEffect(item) {
    let healed = 0;
    switch (item) {
      case '草药包':
        healed = 25;
        break;
      case '治疗药水':
        healed = 50;
        break;
      case '神秘药水':
        healed = Math.random() < 0.7 ? 40 : -20;
        break;
      case '陈年红酒':
        healed = 15;
        break;
      case '月露精华':
        healed = 30;
        break;
      default:
        healed = 10;
    }
    this.character.modifyHp(healed);
    this.character.removeItem(item);
    return healed;
  }

  _applyRewards(msgs) {
    const rewards = this.enemy.rewards;
    if (rewards.addItem) {
      this.character.addItem(rewards.addItem);
      msgs.push(`🎁 获得了 ${rewards.addItem}！`);
    }
    if (rewards.setFlag) {
      this.character.setFlag(rewards.setFlag);
    }
  }

  getState() {
    return {
      enemyName: this.enemy?.name || '',
      enemyHp: this.enemy?.hp || 0,
      enemyMaxHp: this.enemy?.maxHp || 0,
      playerHp: this.character.hp,
      playerMaxHp: this.character.maxHp,
      finished: this.finished,
      result: this.result,
      log: this.log,
    };
  }
}
