// ============================================================
// enemy.js - 敌人系统
// ============================================================

import { ENEMY_DEFS, STATUS_EFFECTS, INTENT_TYPE, STATUS_NAMES, STATUS_EMOJI } from './config.js';

export class Enemy {
    constructor(defId) {
        const def = ENEMY_DEFS[defId];
        if (!def) throw new Error(`Unknown enemy: ${defId}`);

        this.id = def.id;
        this.name = def.name;
        this.emoji = def.emoji;
        this.type = def.type;
        this.patterns = def.patterns;
        this.gold = this.randomBetween(def.gold[0], def.gold[1]);

        this.maxHp = this.randomBetween(def.maxHp[0], def.maxHp[1]);
        this.hp = this.maxHp;
        this.armor = 0;
        this.statuses = {};
        this.lastDamageTaken = 0;

        // 当前意图
        this.currentIntent = null;
        this.chooseIntent();
    }

    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 选择下一个行动意图
    chooseIntent() {
        const totalWeight = this.patterns.reduce((sum, p) => sum + p.weight, 0);
        let rand = Math.random() * totalWeight;
        for (const pattern of this.patterns) {
            rand -= pattern.weight;
            if (rand <= 0) {
                this.currentIntent = { ...pattern };
                return;
            }
        }
        this.currentIntent = { ...this.patterns[0] };
    }

    // 获取意图显示文本
    getIntentDisplay() {
        if (!this.currentIntent) return { text: '?', emoji: '❓' };

        const intent = this.currentIntent;
        switch (intent.intent) {
            case INTENT_TYPE.ATTACK: {
                let dmg = intent.damage;
                if (this.hasStatus(STATUS_EFFECTS.STRENGTH)) dmg += this.statuses[STATUS_EFFECTS.STRENGTH];
                const hits = intent.hits || 1;
                if (hits > 1) return { text: `${dmg}x${hits}`, emoji: '⚔️', type: 'attack' };
                return { text: `${dmg}`, emoji: '⚔️', type: 'attack' };
            }
            case INTENT_TYPE.DEFEND:
                return { text: `${intent.armor}`, emoji: '🛡️', type: 'defend' };
            case INTENT_TYPE.BUFF:
                return { text: `${STATUS_NAMES[intent.status] || intent.status}+${intent.stacks}`, emoji: '⬆️', type: 'buff' };
            case INTENT_TYPE.DEBUFF:
                return { text: `${STATUS_NAMES[intent.status] || intent.status}+${intent.stacks}`, emoji: '⬇️', type: 'debuff' };
            case INTENT_TYPE.ATTACK_DEFEND: {
                let dmg = intent.damage;
                if (this.hasStatus(STATUS_EFFECTS.STRENGTH)) dmg += this.statuses[STATUS_EFFECTS.STRENGTH];
                return { text: `${dmg}+${intent.armor}🛡`, emoji: '⚔️🛡️', type: 'attack_defend' };
            }
            case INTENT_TYPE.SPECIAL: {
                let dmg = intent.damage || 0;
                if (this.hasStatus(STATUS_EFFECTS.STRENGTH)) dmg += this.statuses[STATUS_EFFECTS.STRENGTH];
                return { text: intent.name || `${dmg}`, emoji: '💀', type: 'special' };
            }
            default:
                return { text: '?', emoji: '❓', type: 'unknown' };
        }
    }

    // 执行意图（敌人回合）
    executeIntent(player) {
        if (!this.currentIntent) return;
        const intent = this.currentIntent;
        const results = [];

        // 中毒伤害
        if (this.hasStatus(STATUS_EFFECTS.POISON)) {
            const poisonDmg = this.statuses[STATUS_EFFECTS.POISON];
            this.hp = Math.max(0, this.hp - poisonDmg);
            this.statuses[STATUS_EFFECTS.POISON]--;
            if (this.statuses[STATUS_EFFECTS.POISON] <= 0) delete this.statuses[STATUS_EFFECTS.POISON];
            results.push({ type: 'poison', target: 'self', damage: poisonDmg });
        }

        // 回复效果
        if (this.hasStatus(STATUS_EFFECTS.REGEN)) {
            this.heal(this.statuses[STATUS_EFFECTS.REGEN]);
            this.statuses[STATUS_EFFECTS.REGEN]--;
            if (this.statuses[STATUS_EFFECTS.REGEN] <= 0) delete this.statuses[STATUS_EFFECTS.REGEN];
        }

        if (this.hp <= 0) return results;

        switch (intent.intent) {
            case INTENT_TYPE.ATTACK: {
                let dmg = intent.damage + (this.statuses[STATUS_EFFECTS.STRENGTH] || 0);
                const hits = intent.hits || 1;
                for (let i = 0; i < hits; i++) {
                    if (this.hasStatus(STATUS_EFFECTS.WEAKNESS)) dmg = Math.floor(dmg * 0.75);
                    const actualDmg = player.takeDamage(dmg);
                    results.push({ type: 'attack', damage: actualDmg, blocked: dmg - actualDmg });
                }
                break;
            }
            case INTENT_TYPE.DEFEND: {
                this.armor += intent.armor;
                results.push({ type: 'defend', armor: intent.armor });
                break;
            }
            case INTENT_TYPE.BUFF: {
                this.addStatus(intent.status, intent.stacks);
                results.push({ type: 'buff', status: intent.status, stacks: intent.stacks });
                break;
            }
            case INTENT_TYPE.DEBUFF: {
                player.addStatus(intent.status, intent.stacks);
                results.push({ type: 'debuff', status: intent.status, stacks: intent.stacks });
                break;
            }
            case INTENT_TYPE.ATTACK_DEFEND: {
                let dmg = intent.damage + (this.statuses[STATUS_EFFECTS.STRENGTH] || 0);
                if (this.hasStatus(STATUS_EFFECTS.WEAKNESS)) dmg = Math.floor(dmg * 0.75);
                this.armor += intent.armor;
                const actualDmg = player.takeDamage(dmg);
                results.push({ type: 'attack_defend', damage: actualDmg, armor: intent.armor, blocked: dmg - actualDmg });
                break;
            }
            case INTENT_TYPE.SPECIAL: {
                let dmg = (intent.damage || 0) + (this.statuses[STATUS_EFFECTS.STRENGTH] || 0);
                if (this.hasStatus(STATUS_EFFECTS.WEAKNESS)) dmg = Math.floor(dmg * 0.75);
                const actualDmg = player.takeDamage(dmg);
                results.push({ type: 'special', name: intent.name, damage: actualDmg });
                break;
            }
        }

        // 回合结束减少状态
        this.reduceStatus(STATUS_EFFECTS.WEAKNESS);
        this.reduceStatus(STATUS_EFFECTS.VULNERABLE);

        // 仪式效果
        if (this.hasStatus(STATUS_EFFECTS.RITUAL)) {
            this.addStatus(STATUS_EFFECTS.STRENGTH, this.statuses[STATUS_EFFECTS.RITUAL]);
        }

        return results;
    }

    // 受到伤害
    takeDamage(amount, ignoreArmor = false) {
        let actualDamage = amount;

        if (!ignoreArmor) {
            // 易伤
            if (this.hasStatus(STATUS_EFFECTS.VULNERABLE)) {
                actualDamage = Math.floor(actualDamage * 1.5);
            }
            if (this.armor >= actualDamage) {
                this.armor -= actualDamage;
                actualDamage = 0;
            } else {
                actualDamage -= this.armor;
                this.armor = 0;
            }
        }

        this.hp = Math.max(0, this.hp - actualDamage);
        this.lastDamageTaken = actualDamage;

        // 荆棘反伤
        if (this.hasStatus(STATUS_EFFECTS.THORNS)) {
            // 荆棘反伤由combat处理
        }

        return actualDamage;
    }

    // 治疗
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    // 状态管理
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

    reduceStatus(status) {
        if (this.statuses[status]) {
            this.statuses[status]--;
            if (this.statuses[status] <= 0) delete this.statuses[status];
        }
    }

    // 清除护甲（回合结束）
    clearArmor() {
        this.armor = 0;
    }

    isAlive() {
        return this.hp > 0;
    }

    // 创建敌人实例
    static createEnemies(defIds) {
        return defIds.map(id => new Enemy(id));
    }
}
