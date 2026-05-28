// ============================================================
// combat.js - 回合制战斗系统
// ============================================================

import { CARD_DEFS, STATUS_EFFECTS, GAME_CONFIG, POTIONS, POTION_TYPE } from './config.js';
import { sound } from './sound.js';

export class CombatSystem {
    constructor(player, onCombatEnd) {
        this.player = player;
        this.onCombatEnd = onCombatEnd;
        this.enemies = [];
        this.turn = 0;
        this.isPlayerTurn = true;
        this.keepArmor = false;
        this.combatLog = [];
        this.animations = [];
        this.selectedEnemyIndex = 0;
        this.isProcessing = false;
    }

    // 开始战斗
    startCombat(enemies) {
        this.enemies = enemies;
        this.turn = 0;
        this.isPlayerTurn = true;
        this.keepArmor = false;
        this.combatLog = [];
        this.animations = [];
        this.selectedEnemyIndex = 0;
        this.isProcessing = false;

        this.player.prepareForCombat();
        sound.enemyAppear();
        this.startPlayerTurn();
    }

    // 开始玩家回合
    startPlayerTurn() {
        this.turn++;
        this.isPlayerTurn = true;
        this.player.onTurnStart();
        this.drawCards(GAME_CONFIG.CARDS_PER_TURN);
        sound.turnStart();
        this.addLog(`--- 第${this.turn}回合 ---`);
    }

    // 抽牌
    drawCards(count) {
        const drawn = this.player.drawCards(count);
        drawn.forEach(() => sound.drawCard());
        return drawn;
    }

    // 出牌
    playCard(handIndex) {
        if (!this.isPlayerTurn || this.isProcessing) return false;

        const cardId = this.player.hand[handIndex];
        if (!cardId) return false;

        const def = CARD_DEFS[cardId];
        if (!def) return false;

        // 检查能量
        if (!this.player.spendEnergy(def.cost)) {
            sound.noEnergy();
            return false;
        }

        // 执行卡牌
        this.player.playCard(handIndex);
        sound.playCard();

        // 播放音效
        switch (def.type) {
            case 'attack': sound.attack(); break;
            case 'defense': sound.defend(); break;
            case 'skill': sound.skill(); break;
        }

        // 执行效果
        def.effect(this.player, this.getAliveEnemies(), this);
        this.addLog(`使用了 ${def.name}`);

        // 添加动画
        this.addAnimation({
            type: 'card_play',
            cardName: def.name,
            cardType: def.type,
            duration: 500,
        });

        // 检查敌人是否全部死亡
        if (this.checkEnemiesDead()) {
            this.endCombat(true);
            return true;
        }

        return true;
    }

    // 对敌人造成伤害（包含荆棘反伤）
    dealDamageToEnemy(enemy, amount) {
        if (!enemy.isAlive()) return;

        const actualDmg = enemy.takeDamage(amount);
        this.addAnimation({
            type: 'damage',
            target: 'enemy',
            enemyId: enemy.id,
            value: actualDmg,
            duration: 400,
        });

        // 荆棘反伤
        if (enemy.hasStatus(STATUS_EFFECTS.THORNS) && actualDmg > 0) {
            const thornsDmg = enemy.getStatus(STATUS_EFFECTS.THORNS);
            this.player.takeDamage(thornsDmg, true);
            this.addLog(`${enemy.name} 的荆棘反弹了 ${thornsDmg} 点伤害`);
        }
    }

    // 添加能量
    addEnergy(amount) {
        this.player.addEnergy(amount);
    }

    // 弃掉随机手牌
    discardRandom(count) {
        for (let i = 0; i < count; i++) {
            if (this.player.hand.length > 0) {
                const idx = Math.floor(Math.random() * this.player.hand.length);
                this.player.discardFromHand(idx);
            }
        }
    }

    // 使用药水
    usePotion(potionIndex, enemyIndex = 0) {
        const potionId = this.player.usePotion(potionIndex);
        if (!potionId) return;

        const potion = POTIONS[potionId];
        if (!potion) return;

        sound.skill();
        this.addLog(`使用了 ${potion.name}`);

        switch (potion.type) {
            case POTION_TYPE.HEAL:
                this.player.heal(Math.floor(this.player.maxHp * potion.value));
                break;
            case POTION_TYPE.ENERGY:
                this.player.addEnergy(potion.value);
                break;
            case POTION_TYPE.STRENGTH:
                this.player.addStatus(STATUS_EFFECTS.STRENGTH, potion.value);
                break;
            case POTION_TYPE.DEXTERITY:
                this.player.addStatus(STATUS_EFFECTS.DEXTERITY, potion.value);
                break;
            case POTION_TYPE.FIRE:
                this.enemies.forEach(e => {
                    if (e.isAlive()) this.dealDamageToEnemy(e, potion.value);
                });
                break;
        }

        if (this.checkEnemiesDead()) {
            this.endCombat(true);
        }
    }

    // 结束玩家回合
    endPlayerTurn() {
        if (!this.isPlayerTurn || this.isProcessing) return;

        this.isPlayerTurn = false;
        this.isProcessing = true;

        // 弃掉手牌
        this.player.discardHand();

        // 回合结束处理
        if (!this.keepArmor) {
            this.player.clearArmor();
        }
        this.player.onTurnEnd();

        // 敌人回合
        this.executeEnemyTurns();
    }

    // 执行敌人回合
    async executeEnemyTurns() {
        const aliveEnemies = this.getAliveEnemies();

        for (let i = 0; i < aliveEnemies.length; i++) {
            const enemy = aliveEnemies[i];
            if (!enemy.isAlive()) continue;

            await this.wait(600);

            const results = enemy.executeIntent(this.player);

            // 处理结果动画
            results.forEach(result => {
                switch (result.type) {
                    case 'attack':
                        sound.hurt();
                        this.addLog(`${enemy.name} 攻击了你，造成 ${result.damage} 点伤害`);
                        this.addAnimation({ type: 'damage', target: 'player', value: result.damage, duration: 400 });
                        break;
                    case 'defend':
                        sound.defend();
                        this.addLog(`${enemy.name} 获得了 ${result.armor} 点护甲`);
                        break;
                    case 'buff':
                        this.addLog(`${enemy.name} 强化了自身`);
                        break;
                    case 'debuff':
                        this.addLog(`${enemy.name} 对你施加了负面效果`);
                        break;
                    case 'attack_defend':
                        sound.hurt();
                        this.addLog(`${enemy.name} 攻击了你 (${result.damage}) 并获得 ${result.armor} 护甲`);
                        this.addAnimation({ type: 'damage', target: 'player', value: result.damage, duration: 400 });
                        break;
                    case 'special':
                        sound.hurt();
                        this.addLog(`${enemy.name} 使用了 ${result.name}，造成 ${result.damage} 点伤害`);
                        this.addAnimation({ type: 'damage', target: 'player', value: result.damage, duration: 500 });
                        break;
                    case 'poison':
                        sound.poison();
                        this.addLog(`${enemy.name} 受到了 ${result.damage} 点中毒伤害`);
                        break;
                }
            });

            // 敌人清除护甲
            enemy.clearArmor();

            // 敌人选择下一个意图
            enemy.chooseIntent();

            // 检查玩家是否死亡
            if (!this.player.isAlive()) {
                this.endCombat(false);
                return;
            }
        }

        await this.wait(400);

        // 检查敌人是否全部死亡（中毒等）
        if (this.checkEnemiesDead()) {
            this.endCombat(true);
            return;
        }

        // 开始新回合
        this.isProcessing = false;
        this.startPlayerTurn();
    }

    // 检查敌人是否全部死亡
    checkEnemiesDead() {
        return this.enemies.every(e => !e.isAlive());
    }

    // 获取存活敌人
    getAliveEnemies() {
        return this.enemies.filter(e => e.isAlive());
    }

    // 结束战斗
    endCombat(victory) {
        this.isProcessing = true;
        setTimeout(() => {
            if (victory) {
                sound.victory();
                const goldReward = this.calculateGoldReward();
                this.player.gold += goldReward;
                this.addLog(`胜利！获得 ${goldReward} 金币`);
            } else {
                sound.defeat();
                this.addLog('你被击败了...');
            }
            if (this.onCombatEnd) {
                this.onCombatEnd(victory, this.getRewards(victory));
            }
        }, 800);
    }

    // 计算金币奖励
    calculateGoldReward() {
        let total = 0;
        this.enemies.forEach(e => {
            total += e.gold;
        });
        return total;
    }

    // 获取战斗奖励
    getRewards(victory) {
        if (!victory) return null;
        return {
            gold: this.calculateGoldReward(),
            enemies: this.enemies,
        };
    }

    // 等待
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 添加日志
    addLog(msg) {
        this.combatLog.push({ text: msg, time: Date.now() });
        if (this.combatLog.length > 50) this.combatLog.shift();
    }

    // 添加动画
    addAnimation(anim) {
        anim.startTime = Date.now();
        this.animations.push(anim);
    }

    // 获取当前动画
    getActiveAnimations() {
        const now = Date.now();
        this.animations = this.animations.filter(a => now - a.startTime < a.duration);
        return this.animations;
    }
}
