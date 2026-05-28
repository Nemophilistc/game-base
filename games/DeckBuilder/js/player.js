// ============================================================
// player.js - 玩家角色系统
// ============================================================

import { GAME_CONFIG, STATUS_EFFECTS, STARTING_DECK, CARD_DEFS, POTION_TYPE, POTIONS } from './config.js';

export class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.hp = GAME_CONFIG.STARTING_HP;
        this.maxHp = GAME_CONFIG.MAX_HP;
        this.gold = GAME_CONFIG.STARTING_GOLD;
        this.energy = 0;
        this.maxEnergy = GAME_CONFIG.ENERGY_PER_TURN;
        this.armor = 0;
        this.tempStrength = 0;

        // 状态效果 { statusId: stacks }
        this.statuses = {};

        // 牌组
        this.deck = [];       // 全部卡牌ID
        this.hand = [];       // 手牌
        this.drawPile = [];   // 抽牌堆
        this.discardPile = [];// 弃牌堆
        this.exhaustPile = [];// 消耗堆

        // 药水
        this.potions = []; // 最多3个

        // 初始化牌组
        this.initDeck();
    }

    initDeck() {
        this.deck = [...STARTING_DECK];
        this.hand = [];
        this.drawPile = [];
        this.discardPile = [];
        this.exhaustPile = [];
    }

    // 准备战斗
    prepareForCombat() {
        this.armor = 0;
        this.energy = this.maxEnergy;
        this.statuses = {};
        this.tempStrength = 0;
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];
        this.drawPile = this.shuffleArray([...this.deck]);
    }

    // 洗牌
    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // 抽牌
    drawCards(count) {
        const drawn = [];
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                // 抽牌堆空了，把弃牌堆洗入
                if (this.discardPile.length === 0) break;
                this.drawPile = this.shuffleArray([...this.discardPile]);
                this.discardPile = [];
            }
            const cardId = this.drawPile.pop();
            this.hand.push(cardId);
            drawn.push(cardId);
        }
        return drawn;
    }

    // 弃掉所有手牌
    discardHand() {
        this.discardPile.push(...this.hand);
        this.hand = [];
    }

    // 弃掉指定手牌
    discardFromHand(index) {
        if (index >= 0 && index < this.hand.length) {
            const card = this.hand.splice(index, 1)[0];
            this.discardPile.push(card);
            return card;
        }
        return null;
    }

    // 使用手牌
    playCard(handIndex) {
        if (handIndex >= 0 && handIndex < this.hand.length) {
            const cardId = this.hand.splice(handIndex, 1)[0];
            this.discardPile.push(cardId);
            return cardId;
        }
        return null;
    }

    // 获取手牌数据
    getHandCards() {
        return this.hand.map(id => ({ ...CARD_DEFS[id], instanceId: Math.random() }));
    }

    // 消耗能量
    spendEnergy(amount) {
        if (this.energy >= amount) {
            this.energy -= amount;
            return true;
        }
        return false;
    }

    // 添加能量
    addEnergy(amount) {
        this.energy += amount;
    }

    // 添加护甲
    addArmor(amount) {
        this.armor += Math.max(0, amount);
    }

    // 受到伤害
    takeDamage(amount, ignoreArmor = false) {
        let actualDamage = amount;
        if (!ignoreArmor) {
            if (this.armor >= actualDamage) {
                this.armor -= actualDamage;
                actualDamage = 0;
            } else {
                actualDamage -= this.armor;
                this.armor = 0;
            }
        }
        if (this.hasStatus(STATUS_EFFECTS.VULNERABLE)) {
            actualDamage = Math.floor(actualDamage * 1.5);
        }
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    // 治疗
    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }

    // 护甲在回合结束时清零
    clearArmor() {
        this.armor = 0;
    }

    // 状态效果管理
    addStatus(status, stacks) {
        if (!this.statuses[status]) this.statuses[status] = 0;
        this.statuses[status] += stacks;
    }

    removeStatus(status) {
        delete this.statuses[status];
    }

    getStatus(status) {
        return this.statuses[status] || 0;
    }

    hasStatus(status) {
        return (this.statuses[status] || 0) > 0;
    }

    // 回合开始处理
    onTurnStart() {
        this.energy = this.maxEnergy;
        // 中毒
        if (this.hasStatus(STATUS_EFFECTS.POISON)) {
            const poisonDmg = this.statuses[STATUS_EFFECTS.POISON];
            this.hp = Math.max(0, this.hp - poisonDmg);
            this.statuses[STATUS_EFFECTS.POISON]--;
            if (this.statuses[STATUS_EFFECTS.POISON] <= 0) delete this.statuses[STATUS_EFFECTS.POISON];
        }
        // 回复
        if (this.hasStatus(STATUS_EFFECTS.REGEN)) {
            this.heal(this.statuses[STATUS_EFFECTS.REGEN]);
            this.statuses[STATUS_EFFECTS.REGEN]--;
            if (this.statuses[STATUS_EFFECTS.REGEN] <= 0) delete this.statuses[STATUS_EFFECTS.REGEN];
        }
    }

    // 回合结束处理
    onTurnEnd() {
        // 临时力量
        if (this.tempStrength > 0) {
            this.statuses[STATUS_EFFECTS.STRENGTH] = (this.statuses[STATUS_EFFECTS.STRENGTH] || 0) - this.tempStrength;
            if (this.statuses[STATUS_EFFECTS.STRENGTH] <= 0) delete this.statuses[STATUS_EFFECTS.STRENGTH];
            this.tempStrength = 0;
        }
        // 虚弱减少
        this.reduceStatus(STATUS_EFFECTS.WEAKNESS);
        // 易伤减少
        this.reduceStatus(STATUS_EFFECTS.VULNERABLE);
    }

    reduceStatus(status) {
        if (this.statuses[status]) {
            this.statuses[status]--;
            if (this.statuses[status] <= 0) delete this.statuses[status];
        }
    }

    // 是否存活
    isAlive() {
        return this.hp > 0;
    }

    // 药水管理
    addPotion(potionId) {
        if (this.potions.length < GAME_CONFIG.POTION_SLOTS) {
            this.potions.push(potionId);
            return true;
        }
        return false;
    }

    usePotion(index) {
        if (index >= 0 && index < this.potions.length) {
            return this.potions.splice(index, 1)[0];
        }
        return null;
    }

    // 添加卡牌到牌组
    addCardToDeck(cardId) {
        this.deck.push(cardId);
    }

    // 从牌组移除卡牌
    removeCardFromDeck(cardId) {
        const idx = this.deck.indexOf(cardId);
        if (idx !== -1) {
            this.deck.splice(idx, 1);
            return true;
        }
        return false;
    }

    // 增加最大HP
    increaseMaxHp(amount) {
        this.maxHp += amount;
        this.hp += amount;
    }
}
