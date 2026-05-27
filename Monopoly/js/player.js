// player.js - 玩家类

import { START_MONEY, JAIL_POSITION, PASS_GO_BONUS } from './config.js';

export class Player {
    constructor(id, name, color, isAI = false) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isAI = isAI;
        this.money = START_MONEY;
        this.position = 0;
        this.properties = [];       // 拥有的地产格子ID列表
        this.houses = {};           // { squareId: 0-4 } 4=酒店
        this.inJail = false;
        this.jailTurns = 0;
        this.getOutOfJailCards = 0;
        this.doublesCount = 0;
        this.bankrupt = false;
        this.totalWorth = 0;        // 用于破产判定后的排名
    }

    // 计算总资产（现金 + 地产价值 + 建筑价值）
    getTotalWorth(squareData) {
        let worth = this.money;
        for (const pid of this.properties) {
            const sq = squareData.find(s => s.id === pid);
            if (sq) {
                worth += sq.price || 0;
                if (this.houses[pid]) {
                    const buildCost = this._getBuildCost(sq);
                    worth += this.houses[pid] * buildCost;
                }
            }
        }
        this.totalWorth = worth;
        return worth;
    }

    _getBuildCost(sq) {
        const costs = {
            brown: 50, lightblue: 50, pink: 100, orange: 100,
            red: 150, yellow: 150, green: 200, darkblue: 200
        };
        if (sq.color) return costs[sq.color] || 100;
        return 100; // railroad/utility fallback
    }

    move(steps, totalSquares = 40) {
        const oldPos = this.position;
        this.position = (this.position + steps) % totalSquares;
        // 经过起点
        if (this.position < oldPos && !this.inJail) {
            this.money += PASS_GO_BONUS;
            return true; // 经过了起点
        }
        return false;
    }

    goToJail() {
        this.position = JAIL_POSITION;
        this.inJail = true;
        this.jailTurns = 0;
        this.doublesCount = 0;
    }

    tryLeaveJail(dice1, dice2) {
        if (dice1 === dice2) {
            this.inJail = false;
            this.jailTurns = 0;
            return true;
        }
        this.jailTurns++;
        if (this.jailTurns >= 3) {
            this.inJail = false;
            this.jailTurns = 0;
            this.money -= 50; // 自动付保释金
            return true;
        }
        return false;
    }

    payBail() {
        if (this.money >= 50) {
            this.money -= 50;
            this.inJail = false;
            this.jailTurns = 0;
            return true;
        }
        return false;
    }

    useGetOutCard() {
        if (this.getOutOfJailCards > 0) {
            this.getOutOfJailCards--;
            this.inJail = false;
            this.jailTurns = 0;
            return true;
        }
        return false;
    }

    canAfford(amount) {
        return this.money >= amount;
    }

    pay(amount) {
        this.money -= amount;
        return this.money;
    }

    receive(amount) {
        this.money += amount;
        return this.money;
    }

    addProperty(squareId) {
        if (!this.properties.includes(squareId)) {
            this.properties.push(squareId);
        }
    }

    removeProperty(squareId) {
        this.properties = this.properties.filter(id => id !== squareId);
        delete this.houses[squareId];
    }

    ownsColorGroup(squareIds) {
        return squareIds.every(id => this.properties.includes(id));
    }

    getHousesOn(squareId) {
        return this.houses[squareId] || 0;
    }

    setHousesOn(squareId, count) {
        this.houses[squareId] = count;
    }
}
