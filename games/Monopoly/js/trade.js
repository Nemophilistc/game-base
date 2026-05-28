// trade.js - 交易系统

export class TradeSystem {
    constructor() {
        this.currentTrade = null;
    }

    // 创建交易提议
    createTrade(fromPlayer, toPlayer, offer, request) {
        this.currentTrade = {
            from: fromPlayer.id,
            to: toPlayer.id,
            offer: {
                cash: offer.cash || 0,
                properties: offer.properties || [],
                getOutCards: offer.getOutCards || 0
            },
            request: {
                cash: request.cash || 0,
                properties: request.properties || [],
                getOutCards: request.getOutCards || 0
            }
        };
        return this.currentTrade;
    }

    // 验证交易是否合法
    validateTrade(trade, players) {
        const from = players.find(p => p.id === trade.from);
        const to = players.find(p => p.id === trade.to);
        if (!from || !to) return { valid: false, reason: '玩家不存在' };
        if (from.bankrupt || to.bankrupt) return { valid: false, reason: '不能与破产玩家交易' };

        // 检查现金
        if (trade.offer.cash > from.money) return { valid: false, reason: '出价方现金不足' };
        if (trade.request.cash > to.money) return { valid: false, reason: '对方现金不足' };

        // 检查地产
        for (const pid of trade.offer.properties) {
            if (!from.properties.includes(pid)) return { valid: false, reason: '出价方不拥有该地产' };
            if (from.getHousesOn(pid) > 0) return { valid: false, reason: '有建筑的地产不能交易' };
        }
        for (const pid of trade.request.properties) {
            if (!to.properties.includes(pid)) return { valid: false, reason: '对方不拥有该地产' };
            if (to.getHousesOn(pid) > 0) return { valid: false, reason: '有建筑的地产不能交易' };
        }

        // 检查出狱卡
        if (trade.offer.getOutCards > from.getOutOfJailCards) return { valid: false, reason: '出狱卡不足' };
        if (trade.request.getOutCards > to.getOutOfJailCards) return { valid: false, reason: '对方出狱卡不足' };

        return { valid: true };
    }

    // 执行交易
    executeTrade(trade, players) {
        const validation = this.validateTrade(trade, players);
        if (!validation.valid) return validation;

        const from = players.find(p => p.id === trade.from);
        const to = players.find(p => p.id === trade.to);

        // 现金转移
        from.pay(trade.offer.cash);
        to.receive(trade.offer.cash);
        to.pay(trade.request.cash);
        from.receive(trade.request.cash);

        // 地产转移
        for (const pid of trade.offer.properties) {
            from.removeProperty(pid);
            to.addProperty(pid);
        }
        for (const pid of trade.request.properties) {
            to.removeProperty(pid);
            from.addProperty(pid);
        }

        // 出狱卡转移
        from.getOutOfJailCards -= trade.offer.getOutCards;
        to.getOutOfJailCards += trade.offer.getOutCards;
        to.getOutOfJailCards -= trade.request.getOutCards;
        from.getOutOfJailCards += trade.request.getOutCards;

        this.currentTrade = null;
        return { valid: true, message: '交易完成' };
    }

    // 获取交易摘要文本
    getTradeSummary(trade, players) {
        const from = players.find(p => p.id === trade.from);
        const to = players.find(p => p.id === trade.to);
        const lines = [`${from.name} 提议与 ${to.name} 交易：`];

        if (trade.offer.cash > 0) lines.push(`  出价: $${trade.offer.cash}`);
        if (trade.offer.properties.length > 0) {
            lines.push(`  出价地产: ${trade.offer.properties.join(', ')}`);
        }

        if (trade.request.cash > 0) lines.push(`  要求: $${trade.request.cash}`);
        if (trade.request.properties.length > 0) {
            lines.push(`  要求地产: ${trade.request.properties.join(', ')}`);
        }

        return lines.join('\n');
    }
}
