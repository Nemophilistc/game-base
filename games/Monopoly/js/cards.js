// cards.js - 事件卡系统

import { CHANCE_CARDS, CHEST_CARDS } from './config.js';

export class CardSystem {
    constructor() {
        this.chanceDeck = this.shuffle([...CHANCE_CARDS]);
        this.chestDeck = this.shuffle([...CHEST_CARDS]);
        this.chanceIndex = 0;
        this.chestIndex = 0;
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    drawChance() {
        const card = this.chanceDeck[this.chanceIndex];
        this.chanceIndex = (this.chanceIndex + 1) % this.chanceDeck.length;
        return card;
    }

    drawChest() {
        const card = this.chestDeck[this.chestIndex];
        this.chestIndex = (this.chestIndex + 1) % this.chestDeck.length;
        return card;
    }

    // 执行卡牌效果，返回 { message, action, value }
    // 调用方负责实际修改游戏状态
    resolve(card, player, board, players) {
        const result = { card, message: card.text, actions: [] };

        switch (card.action) {
            case 'moveTo':
                result.actions.push({ type: 'moveTo', target: card.value });
                break;

            case 'nearestUtility':
                result.actions.push({ type: 'moveTo', target: board.getNearest(player.position, 'utility'), payDouble: true });
                break;

            case 'nearestRailroad':
                result.actions.push({ type: 'moveTo', target: board.getNearest(player.position, 'railroad'), payDouble: true });
                break;

            case 'collect':
                result.actions.push({ type: 'collect', amount: card.value });
                break;

            case 'pay':
                result.actions.push({ type: 'pay', amount: card.value });
                break;

            case 'collectFromAll':
                for (const p of players) {
                    if (p.id !== player.id && !p.bankrupt) {
                        result.actions.push({ type: 'transfer', from: p.id, to: player.id, amount: card.value });
                    }
                }
                break;

            case 'payPerBuilding':
                let totalPay = 0;
                for (const sid of player.properties) {
                    const houses = player.getHousesOn(sid);
                    if (houses === 5) {
                        totalPay += card.hotel || (card.house * 5);
                    } else {
                        totalPay += houses * card.house;
                    }
                }
                if (totalPay > 0) {
                    result.actions.push({ type: 'pay', amount: totalPay });
                }
                break;

            case 'goToJail':
                result.actions.push({ type: 'goToJail' });
                break;

            case 'getOutOfJail':
                result.actions.push({ type: 'getOutOfJail' });
                break;

            case 'back':
                result.actions.push({ type: 'moveBack', steps: card.value });
                break;
        }

        return result;
    }
}
