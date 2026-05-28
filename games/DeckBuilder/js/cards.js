// ============================================================
// cards.js - 卡牌系统
// ============================================================

import { CARD_DEFS, CARD_TYPE, RARITY, COLORS, SHOP_CARD_POOL, CARD_REWARD_COUNT } from './config.js';

export class CardSystem {
    constructor() {
        this.selectedCardIndex = -1;
    }

    // 获取卡牌定义
    getCardDef(cardId) {
        return CARD_DEFS[cardId] || null;
    }

    // 获取卡牌类型颜色
    getCardTypeColor(type) {
        switch (type) {
            case CARD_TYPE.ATTACK: return COLORS.CARD_ATTACK;
            case CARD_TYPE.DEFENSE: return COLORS.CARD_DEFENSE;
            case CARD_TYPE.SKILL: return COLORS.CARD_SKILL;
            default: return '#666';
        }
    }

    // 获取稀有度颜色
    getRarityColor(rarity) {
        switch (rarity) {
            case RARITY.COMMON: return COLORS.RARITY_COMMON;
            case RARITY.RARE: return COLORS.RARITY_RARE;
            case RARITY.LEGENDARY: return COLORS.RARITY_LEGENDARY;
            default: return '#666';
        }
    }

    // 获取卡牌类型图标
    getCardTypeIcon(type) {
        switch (type) {
            case CARD_TYPE.ATTACK: return '⚔️';
            case CARD_TYPE.DEFENSE: return '🛡️';
            case CARD_TYPE.SKILL: return '✨';
            default: return '❓';
        }
    }

    // 获取稀有度名
    getRarityName(rarity) {
        switch (rarity) {
            case RARITY.COMMON: return '普通';
            case RARITY.RARE: return '稀有';
            case RARITY.LEGENDARY: return '传说';
            default: return '';
        }
    }

    // 生成随机卡牌奖励
    generateCardRewards(floor) {
        const rewards = [];
        const pool = this.getRewardPool(floor);

        for (let i = 0; i < CARD_REWARD_COUNT; i++) {
            const cardId = this.randomFromPool(pool);
            if (cardId && !rewards.includes(cardId)) {
                rewards.push(cardId);
            } else {
                // 如果重复，再选一次
                const alt = this.randomFromPool(pool);
                rewards.push(alt);
            }
        }
        return rewards;
    }

    // 获取奖励卡牌池
    getRewardPool(floor) {
        const allCards = Object.keys(CARD_DEFS).filter(id => id !== 'strike' && id !== 'defend');
        if (floor === 0) {
            return allCards.filter(id => {
                const def = CARD_DEFS[id];
                return def.rarity === RARITY.COMMON;
            });
        } else if (floor === 1) {
            return allCards.filter(id => {
                const def = CARD_DEFS[id];
                return def.rarity === RARITY.COMMON || def.rarity === RARITY.RARE;
            });
        }
        return allCards;
    }

    // 从池中随机选一张
    randomFromPool(pool) {
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // 获取商店可售卡牌
    getShopCards(floor) {
        const cards = [];
        const pool = [...SHOP_CARD_POOL];
        for (let i = 0; i < 5; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            cards.push(pool.splice(idx, 1)[0]);
            if (pool.length === 0) break;
        }
        return cards;
    }

    // Canvas绘制卡牌
    drawCard(ctx, cardId, x, y, width, height, options = {}) {
        const def = CARD_DEFS[cardId];
        if (!def) return;

        const { selected = false, playable = true, hovered = false } = options;
        const scale = hovered ? 1.05 : 1;
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        const typeColor = this.getCardTypeColor(def.type);
        const rarityColor = this.getRarityColor(def.rarity);
        const alpha = playable ? 1.0 : 0.5;
        ctx.globalAlpha = alpha;

        // 卡牌阴影
        ctx.shadowColor = selected ? '#fff' : 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = selected ? 15 : 8;
        ctx.shadowOffsetY = 3;

        // 卡牌背景
        this.drawRoundedRect(ctx, x, y, width, height, 10);
        const grad = ctx.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, '#2c3e50');
        grad.addColorStop(0.3, '#1a252f');
        grad.addColorStop(1, '#0d1117');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 边框 - 稀有度颜色
        this.drawRoundedRect(ctx, x, y, width, height, 10);
        ctx.strokeStyle = selected ? '#fff' : rarityColor;
        ctx.lineWidth = selected ? 3 : 2;
        ctx.stroke();

        // 内边框 - 类型颜色
        this.drawRoundedRect(ctx, x + 4, y + 4, width - 8, height - 8, 8);
        ctx.strokeStyle = typeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 费用圆圈
        const costX = x + 18;
        const costY = y + 18;
        ctx.beginPath();
        ctx.arc(costX, costY, 14, 0, Math.PI * 2);
        const costGrad = ctx.createRadialGradient(costX - 3, costY - 3, 0, costX, costY, 14);
        costGrad.addColorStop(0, '#f39c12');
        costGrad.addColorStop(1, '#e67e22');
        ctx.fillStyle = costGrad;
        ctx.fill();
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 费用数字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.cost.toString(), costX, costY);

        // 类型图标
        const typeIcon = this.getCardTypeIcon(def.type);
        ctx.font = '16px serif';
        ctx.textAlign = 'right';
        ctx.fillText(typeIcon, x + width - 10, y + 22);

        // 卡牌图画区域
        const artY = y + 38;
        const artH = height * 0.35;
        this.drawRoundedRect(ctx, x + 8, artY, width - 16, artH, 5);
        const artGrad = ctx.createLinearGradient(x, artY, x, artY + artH);
        artGrad.addColorStop(0, typeColor + '40');
        artGrad.addColorStop(1, typeColor + '15');
        ctx.fillStyle = artGrad;
        ctx.fill();
        ctx.strokeStyle = typeColor + '60';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 卡牌图画 - 根据类型绘制图案
        this.drawCardArt(ctx, def.type, x + width / 2, artY + artH / 2, Math.min(width, artH) * 0.35);

        // 卡牌名称
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        const nameY = artY + artH + 18;
        ctx.fillText(def.name, x + width / 2, nameY);

        // 稀有度标签
        ctx.font = '10px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = rarityColor;
        const rarityText = this.getRarityName(def.rarity);
        ctx.fillText(rarityText, x + width / 2, nameY + 14);

        // 描述文字 - 多行
        ctx.fillStyle = '#bdc3c7';
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        const descY = nameY + 30;
        const maxWidth = width - 20;
        this.wrapText(ctx, def.description, x + width / 2, descY, maxWidth, 14);

        // 底部类型色条
        this.drawRoundedRect(ctx, x + 8, y + height - 14, width - 16, 6, 3);
        ctx.fillStyle = typeColor;
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // 绘制卡牌图案
    drawCardArt(ctx, type, cx, cy, size) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;

        switch (type) {
            case CARD_TYPE.ATTACK:
                // 剑
                ctx.beginPath();
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size * 0.3, cy);
                ctx.lineTo(cx, cy + size * 0.8);
                ctx.lineTo(cx - size * 0.3, cy);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // 剑柄
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.4, cy + size * 0.3);
                ctx.lineTo(cx + size * 0.4, cy + size * 0.3);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, cy + size * 0.3);
                ctx.lineTo(cx, cy + size);
                ctx.stroke();
                break;
            case CARD_TYPE.DEFENSE:
                // 盾牌
                ctx.beginPath();
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size * 0.8, cy - size * 0.5);
                ctx.lineTo(cx + size * 0.7, cy + size * 0.3);
                ctx.lineTo(cx, cy + size);
                ctx.lineTo(cx - size * 0.7, cy + size * 0.3);
                ctx.lineTo(cx - size * 0.8, cy - size * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case CARD_TYPE.SKILL:
                // 星形/魔法
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    const angle = (i * Math.PI) / 2;
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
        }
        ctx.restore();
    }

    // 文字换行
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const chars = text.split('');
        let line = '';
        let lineY = y;

        for (let i = 0; i < chars.length; i++) {
            const testLine = line + chars[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, x, lineY);
                line = chars[i];
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, lineY);
    }

    // 圆角矩形
    drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

export const cardSystem = new CardSystem();
