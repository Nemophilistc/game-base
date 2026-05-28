// ============================================================
// ui.js - UI系统（手牌渲染、战斗动画、地图显示、商店界面）
// ============================================================

import { CARD_DEFS, STATUS_EFFECTS, STATUS_NAMES, STATUS_EMOJI, COLORS, GAME_CONFIG, SHOP_PRICES, POTIONS } from './config.js';
import { cardSystem } from './cards.js';

export class UI {
    constructor() {
        this.cardCanvas = null;
        this.cardCtx = null;
        this.hoveredCardIndex = -1;
        this.hoveredEnemyIndex = -1;
        this.screenShake = 0;
        this.floatingTexts = [];
        this.cardWidth = 120;
        this.cardHeight = 170;
    }

    // 初始化Canvas
    initCardCanvas(canvas) {
        this.cardCanvas = canvas;
        this.cardCtx = canvas.getContext('2d');
    }

    // ---- 手牌渲染 ----
    drawHand(hand, energy, playableCheck) {
        if (!this.cardCtx) return;
        const ctx = this.cardCtx;
        const canvas = this.cardCanvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!hand || hand.length === 0) return;

        const cardW = this.cardWidth;
        const cardH = this.cardHeight;
        const gap = 10;
        const totalW = hand.length * (cardW + gap) - gap;
        const startX = (canvas.width - totalW) / 2;
        const y = 10;

        hand.forEach((cardId, i) => {
            const def = CARD_DEFS[cardId];
            if (!def) return;

            const x = startX + i * (cardW + gap);
            const isHovered = i === this.hoveredCardIndex;
            const isPlayable = playableCheck ? playableCheck(cardId) : def.cost <= energy;

            // 悬停时卡牌上移
            const drawY = isHovered ? y - 20 : y;

            cardSystem.drawCard(ctx, cardId, x, drawY, cardW, cardH, {
                selected: false,
                playable: isPlayable,
                hovered: isHovered,
            });
        });
    }

    // 获取悬停的手牌索引
    getHoveredCardIndex(mouseX, mouseY, handLength, canvasWidth) {
        const cardW = this.cardWidth;
        const cardH = this.cardHeight;
        const gap = 10;
        const totalW = handLength * (cardW + gap) - gap;
        const startX = (canvasWidth - totalW) / 2;
        const y = 10;

        for (let i = 0; i < handLength; i++) {
            const x = startX + i * (cardW + gap);
            const drawY = i === this.hoveredCardIndex ? y - 20 : y;
            if (mouseX >= x && mouseX <= x + cardW && mouseY >= drawY && mouseY <= drawY + cardH) {
                return i;
            }
        }
        return -1;
    }

    // ---- 敌人渲染 ----
    drawEnemies(ctx, enemies, x, y, width, hoveredEnemyIndex = -1) {
        if (!enemies || enemies.length === 0) return;

        const enemyW = 140;
        const gap = 20;
        const totalW = enemies.length * (enemyW + gap) - gap;
        const startX = x + (width - totalW) / 2;

        enemies.forEach((enemy, i) => {
            if (!enemy.isAlive()) return;

            const ex = startX + i * (enemyW + gap);
            const ey = y;
            const isHovered = i === hoveredEnemyIndex;

            this.drawEnemy(ctx, enemy, ex, ey, enemyW, 160, isHovered);
        });
    }

    // 绘制单个敌人
    drawEnemy(ctx, enemy, x, y, w, h, isHovered) {
        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // 敌人背景
        cardSystem.drawRoundedRect(ctx, x, y, w, h, 10);
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 边框
        cardSystem.drawRoundedRect(ctx, x, y, w, h, 10);
        ctx.strokeStyle = isHovered ? '#e74c3c' : '#4a5568';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Emoji
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.emoji, x + w / 2, y + 40);

        // 名字
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText(enemy.name, x + w / 2, y + 70);

        // HP条
        const hpBarX = x + 10;
        const hpBarY = y + 82;
        const hpBarW = w - 20;
        const hpBarH = 12;
        const hpPercent = enemy.hp / enemy.maxHp;

        // HP条背景
        cardSystem.drawRoundedRect(ctx, hpBarX, hpBarY, hpBarW, hpBarH, 4);
        ctx.fillStyle = '#2d3748';
        ctx.fill();

        // HP条
        cardSystem.drawRoundedRect(ctx, hpBarX, hpBarY, hpBarW * hpPercent, hpBarH, 4);
        const hpColor = hpPercent > 0.5 ? '#e74c3c' : hpPercent > 0.25 ? '#e67e22' : '#c0392b';
        ctx.fillStyle = hpColor;
        ctx.fill();

        // HP数字
        ctx.font = '10px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, x + w / 2, hpBarY + hpBarH / 2);

        // 护甲
        if (enemy.armor > 0) {
            ctx.font = '12px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = COLORS.ARMOR_COLOR;
            ctx.fillText(`🛡${enemy.armor}`, x + w / 2, hpBarY + hpBarH + 14);
        }

        // 意图
        const intent = enemy.getIntentDisplay();
        const intentY = y + h - 25;
        ctx.font = '16px serif';
        ctx.fillText(intent.emoji, x + w / 2 - 20, intentY);
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        const intentColors = {
            attack: '#e74c3c',
            defend: '#3498db',
            buff: '#27ae60',
            debuff: '#9b59b6',
            attack_defend: '#e67e22',
            special: '#e74c3c',
        };
        ctx.fillStyle = intentColors[intent.type] || '#fff';
        ctx.fillText(intent.text, x + w / 2 + 10, intentY);

        // 状态效果
        this.drawStatuses(ctx, enemy.statuses, x + w / 2, y + h - 8, true);

        ctx.restore();
    }

    // 绘制状态效果
    drawStatuses(ctx, statuses, cx, y, small = false) {
        const statusKeys = Object.keys(statuses).filter(k => statuses[k] > 0);
        if (statusKeys.length === 0) return;

        const fontSize = small ? 10 : 12;
        const gap = small ? 30 : 35;
        const startX = cx - (statusKeys.length - 1) * gap / 2;

        ctx.font = `${fontSize}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';

        statusKeys.forEach((status, i) => {
            const sx = startX + i * gap;
            const emoji = STATUS_EMOJI[status] || '?';
            ctx.font = `${fontSize + 2}px serif`;
            ctx.fillText(emoji, sx, y);
            ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(statuses[status].toString(), sx + 12, y);
        });
    }

    // ---- 玩家信息渲染 ----
    drawPlayerInfo(ctx, player, x, y, width) {
        ctx.save();

        // 背景
        cardSystem.drawRoundedRect(ctx, x, y, width, 90, 8);
        const grad = ctx.createLinearGradient(x, y, x, y + 90);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad;
        ctx.fill();
        cardSystem.drawRoundedRect(ctx, x, y, width, 90, 8);
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 角色Emoji
        ctx.font = '30px serif';
        ctx.textAlign = 'left';
        ctx.fillText('🧙', x + 10, y + 35);

        // HP条
        const hpBarX = x + 50;
        const hpBarY = y + 12;
        const hpBarW = width - 140;
        const hpBarH = 16;
        const hpPercent = player.hp / player.maxHp;

        ctx.fillStyle = '#2d3748';
        cardSystem.drawRoundedRect(ctx, hpBarX, hpBarY, hpBarW, hpBarH, 5);
        ctx.fill();

        cardSystem.drawRoundedRect(ctx, hpBarX, hpBarY, hpBarW * hpPercent, hpBarH, 5);
        ctx.fillStyle = COLORS.HP_BAR;
        ctx.fill();

        // HP数字
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${player.hp}/${player.maxHp}`, hpBarX + hpBarW / 2, hpBarY + hpBarH / 2 + 4);

        // 能量
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = COLORS.ENERGY_COLOR;
        ctx.fillText(`⚡${player.energy}/${player.maxEnergy}`, x + 50, y + 48);

        // 护甲
        if (player.armor > 0) {
            ctx.fillStyle = COLORS.ARMOR_COLOR;
            ctx.fillText(`🛡${player.armor}`, x + 130, y + 48);
        }

        // 金币
        ctx.fillStyle = COLORS.GOLD_COLOR;
        ctx.fillText(`💰${player.gold}`, x + 200, y + 48);

        // 抽牌堆/弃牌堆
        ctx.fillStyle = '#95a5a6';
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillText(`抽牌堆: ${player.drawPile.length}`, x + 50, y + 68);
        ctx.fillText(`弃牌堆: ${player.discardPile.length}`, x + 150, y + 68);

        // 药水栏
        const potionX = x + width - 90;
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText('药水:', potionX - 5, y + 20);
        player.potions.forEach((pId, i) => {
            const potion = POTIONS[pId];
            if (potion) {
                ctx.font = '18px serif';
                ctx.fillText('🧪', potionX + i * 25, y + 42);
                ctx.font = '8px "Microsoft YaHei", sans-serif';
                ctx.fillStyle = potion.color;
                ctx.fillText(potion.name.substring(0, 2), potionX + i * 25, y + 56);
            }
        });

        // 玩家状态
        this.drawStatuses(ctx, player.statuses, x + width / 2, y + 82);

        ctx.restore();
    }

    // ---- 浮动文字 ----
    addFloatingText(text, x, y, color = '#fff', duration = 1000) {
        this.floatingTexts.push({
            text, x, y, color, duration,
            startTime: Date.now(),
            startY: y,
        });
    }

    drawFloatingTexts(ctx) {
        const now = Date.now();
        this.floatingTexts = this.floatingTexts.filter(ft => {
            const elapsed = now - ft.startTime;
            if (elapsed > ft.duration) return false;

            const progress = elapsed / ft.duration;
            const alpha = 1 - progress;
            const offsetY = -40 * progress;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = ft.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y + offsetY);
            ctx.fillText(ft.text, ft.x, ft.y + offsetY);
            ctx.restore();

            return true;
        });
    }

    // ---- 商店界面 ----
    drawShop(ctx, shopCards, player, width, height, hoveredShopItem = -1) {
        ctx.save();

        // 标题
        ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = COLORS.GOLD_COLOR;
        ctx.textAlign = 'center';
        ctx.fillText('🛒 商店', width / 2, 40);

        // 金币
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = COLORS.GOLD_COLOR;
        ctx.fillText(`💰 ${player.gold}`, width / 2, 65);

        // 卡牌商品
        const cardW = 120;
        const cardH = 170;
        const gap = 20;
        const startX = (width - (shopCards.length * (cardW + gap) - gap)) / 2;

        shopCards.forEach((cardId, i) => {
            const def = CARD_DEFS[cardId];
            if (!def) return;

            const x = startX + i * (cardW + gap);
            const y = 90;
            const isHovered = i === hoveredShopItem;
            const price = this.getCardPrice(def.rarity);
            const canAfford = player.gold >= price;

            cardSystem.drawCard(ctx, cardId, x, y, cardW, cardH, {
                selected: false,
                playable: canAfford,
                hovered: isHovered,
            });

            // 价格标签
            ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = canAfford ? COLORS.GOLD_COLOR : '#e74c3c';
            ctx.fillText(`💰${price}`, x + cardW / 2, y + cardH + 18);
        });

        // 移除卡牌选项
        const removeY = 290;
        const removeHovered = hoveredShopItem === shopCards.length;
        cardSystem.drawRoundedRect(ctx, width / 2 - 100, removeY, 200, 40, 8);
        ctx.fillStyle = removeHovered ? '#c0392b' : '#922b21';
        ctx.fill();
        cardSystem.drawRoundedRect(ctx, width / 2 - 100, removeY, 200, 40, 8);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`移除卡牌 (💰${SHOP_PRICES.REMOVE_CARD})`, width / 2, removeY + 25);

        // 药水商品
        const potionY = 350;
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText('药水', width / 2, potionY);

        const potionIds = Object.keys(POTIONS);
        const potionStartX = (width - (3 * 80)) / 2;
        for (let i = 0; i < 3; i++) {
            const pId = potionIds[i % potionIds.length];
            const potion = POTIONS[pId];
            const px = potionStartX + i * 80;
            const py = potionY + 15;
            const pHovered = hoveredShopItem === shopCards.length + 1 + i;
            const canBuy = player.gold >= SHOP_PRICES.POTION && player.potions.length < GAME_CONFIG.POTION_SLOTS;

            cardSystem.drawRoundedRect(ctx, px, py, 70, 50, 6);
            ctx.fillStyle = pHovered ? '#2c3e50' : '#1a1a2e';
            ctx.fill();
            cardSystem.drawRoundedRect(ctx, px, py, 70, 50, 6);
            ctx.strokeStyle = canBuy ? potion.color : '#4a5568';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = '20px serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('🧪', px + 35, py + 22);

            ctx.font = '10px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = potion.color;
            ctx.fillText(potion.name, px + 35, py + 38);
            ctx.fillStyle = canBuy ? COLORS.GOLD_COLOR : '#e74c3c';
            ctx.fillText(`💰${SHOP_PRICES.POTION}`, px + 35, py + 48);
        }

        // 返回按钮
        const btnY = height - 60;
        const btnHovered = hoveredShopItem === -2;
        cardSystem.drawRoundedRect(ctx, width / 2 - 60, btnY, 120, 40, 8);
        ctx.fillStyle = btnHovered ? '#2980b9' : '#2471a3';
        ctx.fill();
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('离开商店', width / 2, btnY + 25);

        ctx.restore();
    }

    getCardPrice(rarity) {
        switch (rarity) {
            case 'common': return SHOP_PRICES.CARD_COMMON;
            case 'rare': return SHOP_PRICES.CARD_RARE;
            case 'legendary': return SHOP_PRICES.CARD_LEGENDARY;
            default: return SHOP_PRICES.CARD_COMMON;
        }
    }

    // 获取商店悬停项
    getShopHoverItem(mouseX, mouseY, shopCardsCount, width, height) {
        const cardW = 120;
        const cardH = 170;
        const gap = 20;
        const startX = (width - (shopCardsCount * (cardW + gap) - gap)) / 2;

        // 检查卡牌
        for (let i = 0; i < shopCardsCount; i++) {
            const x = startX + i * (cardW + gap);
            const y = 90;
            if (mouseX >= x && mouseX <= x + cardW && mouseY >= y && mouseY <= y + cardH) {
                return i;
            }
        }

        // 检查移除按钮
        const removeY = 290;
        if (mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && mouseY >= removeY && mouseY <= removeY + 40) {
            return shopCardsCount;
        }

        // 检查药水
        const potionY = 350 + 15;
        const potionStartX = (width - (3 * 80)) / 2;
        for (let i = 0; i < 3; i++) {
            const px = potionStartX + i * 80;
            if (mouseX >= px && mouseX <= px + 70 && mouseY >= potionY && mouseY <= potionY + 50) {
                return shopCardsCount + 1 + i;
            }
        }

        // 检查返回按钮
        const btnY = height - 60;
        if (mouseX >= width / 2 - 60 && mouseX <= width / 2 + 60 && mouseY >= btnY && mouseY <= btnY + 40) {
            return -2;
        }

        return -1;
    }

    // ---- 休息界面 ----
    drawRest(ctx, player, width, height, hoveredChoice = -1) {
        ctx.save();

        // 背景氛围
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 300);
        grad.addColorStop(0, '#1a3a1a');
        grad.addColorStop(1, '#0d1117');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#2ecc71';
        ctx.textAlign = 'center';
        ctx.fillText('🏕️ 休息营地', width / 2, 50);

        // 篝火Emoji
        ctx.font = '60px serif';
        ctx.fillText('🔥', width / 2, 120);

        // 恢复HP选项
        const healAmount = Math.floor(player.maxHp * 0.3);
        const choice1Y = 180;
        const choice1Hover = hoveredChoice === 0;
        cardSystem.drawRoundedRect(ctx, width / 2 - 150, choice1Y, 300, 50, 10);
        ctx.fillStyle = choice1Hover ? '#27ae60' : '#1e8449';
        ctx.fill();
        cardSystem.drawRoundedRect(ctx, width / 2 - 150, choice1Y, 300, 50, 10);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`❤️ 恢复 ${healAmount} HP`, width / 2, choice1Y + 30);

        // 升级卡牌选项
        const choice2Y = 250;
        const choice2Hover = hoveredChoice === 1;
        cardSystem.drawRoundedRect(ctx, width / 2 - 150, choice2Y, 300, 50, 10);
        ctx.fillStyle = choice2Hover ? '#2980b9' : '#2471a3';
        ctx.fill();
        cardSystem.drawRoundedRect(ctx, width / 2 - 150, choice2Y, 300, 50, 10);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.fillText('⬆️ 升级一张卡牌 (费用-1)', width / 2, choice2Y + 30);

        // 当前HP
        ctx.font = '14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText(`当前HP: ${player.hp}/${player.maxHp}`, width / 2, 330);

        ctx.restore();
    }

    // ---- 卡牌选择界面（升级/移除）----
    drawCardSelect(ctx, cards, title, width, height, hoveredIndex = -1) {
        ctx.save();

        // 半透明背景
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ecf0f1';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 35);

        // 卡牌列表
        const cardW = 100;
        const cardH = 140;
        const gap = 12;
        const cols = Math.min(6, cards.length);
        const rows = Math.ceil(cards.length / cols);
        const startX = (width - (cols * (cardW + gap) - gap)) / 2;
        const startY = 55;

        cards.forEach((cardId, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY + row * (cardH + gap + 10);
            const isHovered = i === hoveredIndex;

            cardSystem.drawCard(ctx, cardId, x, y, cardW, cardH, {
                selected: false,
                playable: true,
                hovered: isHovered,
            });
        });

        // 取消按钮
        const btnY = height - 50;
        cardSystem.drawRoundedRect(ctx, width / 2 - 50, btnY, 100, 35, 6);
        ctx.fillStyle = '#7f8c8d';
        ctx.fill();
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('取消', width / 2, btnY + 22);

        ctx.restore();
    }

    // 获取卡牌选择悬停
    getCardSelectHover(mouseX, mouseY, cardCount, width, height) {
        const cardW = 100;
        const cardH = 140;
        const gap = 12;
        const cols = Math.min(6, cardCount);
        const startX = (width - (cols * (cardW + gap) - gap)) / 2;
        const startY = 55;

        for (let i = 0; i < cardCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY + row * (cardH + gap + 10);
            if (mouseX >= x && mouseX <= x + cardW && mouseY >= y && mouseY <= y + cardH) {
                return i;
            }
        }

        // 检查取消按钮
        const btnY = height - 50;
        if (mouseX >= width / 2 - 50 && mouseX <= width / 2 + 50 && mouseY >= btnY && mouseY <= btnY + 35) {
            return -2;
        }

        return -1;
    }

    // ---- 事件界面 ----
    drawEvent(ctx, event, width, height, hoveredChoice = -1) {
        ctx.save();

        // 标题
        ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ecf0f1';
        ctx.textAlign = 'center';
        ctx.fillText(`${event.emoji} ${event.title}`, width / 2, 50);

        // 描述
        ctx.font = '14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#bdc3c7';
        const descLines = this.wrapTextSimple(ctx, event.description, width - 80);
        descLines.forEach((line, i) => {
            ctx.fillText(line, width / 2, 90 + i * 20);
        });

        // 选项
        const choiceStartY = 90 + descLines.length * 20 + 30;
        event.choices.forEach((choice, i) => {
            const cy = choiceStartY + i * 55;
            const isHovered = i === hoveredChoice;

            cardSystem.drawRoundedRect(ctx, width / 2 - 180, cy, 360, 45, 8);
            ctx.fillStyle = isHovered ? '#2c3e50' : '#1a252f';
            ctx.fill();
            cardSystem.drawRoundedRect(ctx, width / 2 - 180, cy, 360, 45, 8);
            ctx.strokeStyle = isHovered ? '#3498db' : '#4a5568';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = '14px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = isHovered ? '#fff' : '#bdc3c7';
            ctx.fillText(choice.text, width / 2, cy + 27);
        });

        ctx.restore();
    }

    // 获取事件悬停选项
    getEventHoverChoice(mouseX, mouseY, event, width) {
        if (!event) return -1;
        const descLines = this.wrapTextSimple(null, event.description, width - 80);
        const choiceStartY = 90 + descLines.length * 20 + 30;

        for (let i = 0; i < event.choices.length; i++) {
            const cy = choiceStartY + i * 55;
            if (mouseX >= width / 2 - 180 && mouseX <= width / 2 + 180 && mouseY >= cy && mouseY <= cy + 45) {
                return i;
            }
        }
        return -1;
    }

    // 简单文字换行
    wrapTextSimple(ctx, text, maxWidth) {
        const lines = [];
        let line = '';
        // 估算每个字符宽度（中文约14px）
        const charWidth = 14;
        const maxChars = Math.floor(maxWidth / charWidth);

        for (let i = 0; i < text.length; i++) {
            line += text[i];
            if (line.length >= maxChars) {
                lines.push(line);
                line = '';
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    // ---- 战斗奖励界面 ----
    drawRewards(ctx, rewards, width, height, hoveredReward = -1) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = COLORS.GOLD_COLOR;
        ctx.textAlign = 'center';
        ctx.fillText('🏆 战斗胜利！', width / 2, 60);

        // 金币奖励
        ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = COLORS.GOLD_COLOR;
        ctx.fillText(`获得 ${rewards.gold} 金币`, width / 2, 100);

        // 卡牌奖励
        if (rewards.cards && rewards.cards.length > 0) {
            ctx.font = '16px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText('选择一张卡牌加入牌组:', width / 2, 140);

            const cardW = 120;
            const cardH = 170;
            const gap = 20;
            const startX = (width - (rewards.cards.length * (cardW + gap) - gap)) / 2;

            rewards.cards.forEach((cardId, i) => {
                const x = startX + i * (cardW + gap);
                const y = 160;
                const isHovered = i === hoveredReward;

                cardSystem.drawCard(ctx, cardId, x, y, cardW, cardH, {
                    selected: false,
                    playable: true,
                    hovered: isHovered,
                });
            });
        }

        // 跳过按钮
        const btnY = height - 60;
        const skipHovered = hoveredReward === -2;
        cardSystem.drawRoundedRect(ctx, width / 2 - 60, btnY, 120, 40, 8);
        ctx.fillStyle = skipHovered ? '#7f8c8d' : '#636e72';
        ctx.fill();
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('跳过', width / 2, btnY + 25);

        ctx.restore();
    }

    // 获取奖励悬停
    getRewardHover(mouseX, mouseY, cardCount, width, height) {
        if (!cardCount) return -1;
        const cardW = 120;
        const cardH = 170;
        const gap = 20;
        const startX = (width - (cardCount * (cardW + gap) - gap)) / 2;

        for (let i = 0; i < cardCount; i++) {
            const x = startX + i * (cardW + gap);
            const y = 160;
            if (mouseX >= x && mouseX <= x + cardW && mouseY >= y && mouseY <= y + cardH) {
                return i;
            }
        }

        const btnY = height - 60;
        if (mouseX >= width / 2 - 60 && mouseX <= width / 2 + 60 && mouseY >= btnY && mouseY <= btnY + 40) {
            return -2;
        }

        return -1;
    }

    // ---- 通用按钮 ----
    drawButton(ctx, text, x, y, w, h, isHovered = false, color = '#2471a3') {
        cardSystem.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = isHovered ? '#2980b9' : color;
        ctx.fill();
        cardSystem.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.textBaseline = 'alphabetic';
    }
}

export const ui = new UI();
