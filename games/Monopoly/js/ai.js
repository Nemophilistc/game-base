// ai.js - AI 玩家决策系统

import { SQUARES, COLOR_GROUPS, RAILROAD_POSITIONS, UTILITY_POSITIONS, BUILDING_COSTS } from './config.js';

export class AIPlayer {
    constructor(board) {
        this.board = board;
    }

    // AI 决定是否购买地产
    shouldBuy(player, square) {
        if (!square || !square.price) return false;
        if (player.money < square.price + 100) return false; // 保留$100应急

        // 铁路：尽量买
        if (square.type === 'railroad') {
            const owned = RAILROAD_POSITIONS.filter(p => player.properties.includes(p)).length;
            return owned < 3 || player.money > square.price + 200;
        }

        // 公用事业：便宜时买
        if (square.type === 'utility') {
            return player.money > square.price + 300;
        }

        // 地产：策略性购买
        if (square.type === 'property') {
            const group = COLOR_GROUPS[square.color];
            if (!group) return true;

            const ownedInGroup = group.squares.filter(s => player.properties.includes(s)).length;
            const totalInGroup = group.squares.length;

            // 只差一块就集齐同色 → 强烈推荐买
            if (ownedInGroup === totalInGroup - 1) return true;

            // 早期尽量买便宜地
            if (square.price <= 200) return true;

            // 中后期考虑性价比
            return player.money > square.price + 200;
        }

        return true;
    }

    // AI 决定建房
    getBuildDecision(player) {
        const buildable = [];

        for (const sid of player.properties) {
            const sq = SQUARES.find(s => s.id === sid);
            if (!sq || sq.type !== 'property') continue;
            if (!this.board.canBuild(sq, player)) continue;

            const cost = this.board.getBuildCost(sq);
            if (player.money < cost + 150) continue; // 保留资金

            // 优先级：集齐同色 > 便宜组 > 已有建筑多的
            const group = COLOR_GROUPS[sq.color];
            const ownedInGroup = group ? group.squares.filter(s => player.properties.includes(s)).length : 0;
            const totalInGroup = group ? group.squares.length : 1;
            const currentHouses = player.getHousesOn(sid);

            let priority = 0;
            if (ownedInGroup === totalInGroup) priority += 100;
            priority += (5 - currentHouses) * 10; // 差距大优先
            priority += (500 - (sq.price || 0)) / 10; // 便宜优先

            buildable.push({ squareId: sid, cost, priority, square: sq });
        }

        buildable.sort((a, b) => b.priority - a.priority);
        return buildable.length > 0 ? buildable[0] : null;
    }

    // AI 狱中决策
    jailDecision(player) {
        // 有出狱卡就用
        if (player.getOutOfJailCards > 0) return 'card';
        // 钱多就付保释金
        if (player.money > 300) return 'pay';
        // 否则掷骰子
        return 'roll';
    }

    // AI 交易决策 - 简单策略
    getTradeOffers(player, players) {
        const offers = [];

        for (const other of players) {
            if (other.id === player.id || other.bankrupt) continue;

            // 检查是否有集齐同色的机会
            for (const [colorKey, group] of Object.entries(COLOR_GROUPS)) {
                const myCount = group.squares.filter(s => player.properties.includes(s)).length;
                const theirCount = group.squares.filter(s => other.properties.includes(s)).length;

                if (myCount === group.squares.length - 1 && theirCount === 1) {
                    // 我只差一块就集齐，看对方是否愿意卖
                    const needed = group.squares.find(s => other.properties.includes(s));
                    if (needed === undefined) continue;

                    const sq = SQUARES.find(s => s.id === needed);
                    if (!sq) continue;

                    // 检查对方的地产是否有建筑
                    if (other.getHousesOn(needed) > 0) continue;

                    const offerPrice = Math.floor(sq.price * 1.5);
                    if (player.money > offerPrice + 200) {
                        offers.push({
                            from: player.id,
                            to: other.id,
                            offer: { cash: offerPrice, properties: [] },
                            request: { cash: 0, properties: [needed] }
                        });
                    }
                }
            }
        }

        return offers.length > 0 ? offers[0] : null;
    }

    // AI 处理被迫筹钱（破产前自救）
    getRaiseFunds(player, amount) {
        const actions = [];

        // 先卖建筑
        for (const sid of player.properties) {
            const sq = SQUARES.find(s => s.id === sid);
            if (!sq || sq.type !== 'property') continue;
            const houses = player.getHousesOn(sid);
            if (houses > 0 && this.board.canSell(sq, player)) {
                const sellPrice = this.board.getBuildCost(sq) / 2;
                actions.push({ type: 'sellBuilding', squareId: sid, amount: sellPrice });
            }
        }

        // 如果还不够，卖地产
        let raised = actions.reduce((s, a) => s + a.amount, 0);
        if (raised < amount) {
            const sorted = [...player.properties].sort((a, b) => {
                const sa = SQUARES.find(s => s.id === a);
                const sb = SQUARES.find(s => s.id === b);
                return (sa?.price || 0) - (sb?.price || 0); // 先卖便宜的
            });
            for (const sid of sorted) {
                const sq = SQUARES.find(s => s.id === sid);
                if (sq && sq.price) {
                    actions.push({ type: 'sellProperty', squareId: sid, amount: sq.price / 2 });
                    raised += sq.price / 2;
                    if (raised >= amount) break;
                }
            }
        }

        return actions;
    }
}
