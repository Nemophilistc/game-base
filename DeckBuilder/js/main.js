// ============================================================
// main.js - 游戏主循环、事件监听、状态机
// ============================================================

import { GAME_CONFIG, EVENTS, CARD_DEFS, POTIONS, NODE_TYPE, SHOP_PRICES } from './config.js';
import { sound } from './sound.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { CombatSystem } from './combat.js';
import { GameMap, MapNode } from './map.js';
import { cardSystem } from './cards.js';
import { ui } from './ui.js';

// ---- 游戏状态 ----
const GameState = {
    MENU: 'menu',
    MAP: 'map',
    COMBAT: 'combat',
    REWARDS: 'rewards',
    SHOP: 'shop',
    REST: 'rest',
    EVENT: 'event',
    CARD_SELECT: 'card_select',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
};

class Game {
    constructor() {
        this.state = GameState.MENU;
        this.player = new Player();
        this.gameMap = new GameMap();
        this.combat = null;
        this.currentFloor = 0;
        this.currentNode = null;

        // UI状态
        this.hoveredCardIndex = -1;
        this.hoveredEnemyIndex = -1;
        this.hoveredShopItem = -1;
        this.hoveredReward = -1;
        this.hoveredChoice = -1;
        this.hoveredMapNode = null;
        this.hoveredSelectCard = -1;

        // 商店状态
        this.shopCards = [];

        // 事件状态
        this.currentEvent = null;

        // 奖励状态
        this.rewards = null;

        // 卡牌选择状态
        this.selectCards = [];
        this.selectCallback = null;
        this.selectTitle = '';

        // 升级模式
        this.isUpgradeMode = false;

        // Canvas元素
        this.mainCanvas = null;  // 战斗场景 - 敌人
        this.mainCtx = null;
        this.cardCanvas = null;  // 战斗场景 - 手牌
        this.cardCtx = null;
        this.mapCanvas = null;   // 地图
        this.mapCtx = null;
        this.shopCanvas = null;  // 商店
        this.shopCtx = null;
        this.restCanvas = null;  // 休息
        this.restCtx = null;
        this.eventCanvas = null; // 事件
        this.eventCtx = null;
        this.rewardCanvas = null; // 奖励
        this.rewardCtx = null;
        this.cardSelectCanvas = null; // 卡牌选择
        this.cardSelectCtx = null;

        // 当前活动canvas/ctx（用于鼠标事件路由）
        this.activeCanvas = null;
        this.activeCtx = null;
    }

    // 初始化
    init() {
        this.setupCanvas();
        this.setupEvents();
        this.showScreen(GameState.MENU);
        this.renderLoop();
    }

    // 设置Canvas
    setupCanvas() {
        this.mainCanvas = document.getElementById('mainCanvas');
        this.cardCanvas = document.getElementById('cardCanvas');
        this.mapCanvas = document.getElementById('mapCanvas');
        this.shopCanvas = document.getElementById('shopCanvas');
        this.restCanvas = document.getElementById('restCanvas');
        this.eventCanvas = document.getElementById('eventCanvas');
        this.rewardCanvas = document.getElementById('rewardCanvas');
        this.cardSelectCanvas = document.getElementById('cardSelectCanvas');

        if (this.mainCanvas) this.mainCtx = this.mainCanvas.getContext('2d');
        if (this.cardCanvas) {
            this.cardCtx = this.cardCanvas.getContext('2d');
            ui.initCardCanvas(this.cardCanvas);
        }
        if (this.mapCanvas) this.mapCtx = this.mapCanvas.getContext('2d');
        if (this.shopCanvas) this.shopCtx = this.shopCanvas.getContext('2d');
        if (this.restCanvas) this.restCtx = this.restCanvas.getContext('2d');
        if (this.eventCanvas) this.eventCtx = this.eventCanvas.getContext('2d');
        if (this.rewardCanvas) this.rewardCtx = this.rewardCanvas.getContext('2d');
        if (this.cardSelectCanvas) this.cardSelectCtx = this.cardSelectCanvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;

        // 战斗场景的敌人区域
        if (this.mainCanvas) {
            this.mainCanvas.width = Math.min(this.screenWidth - 220, 700);
            this.mainCanvas.height = 280;
        }
        // 手牌区域
        if (this.cardCanvas) {
            this.cardCanvas.width = Math.min(this.screenWidth - 220, 700);
            this.cardCanvas.height = 200;
        }
        // 地图
        if (this.mapCanvas) {
            this.mapCanvas.width = Math.min(this.screenWidth - 40, 900);
            this.mapCanvas.height = Math.min(this.screenHeight - 120, 520);
        }
        // 全屏canvas (shop/rest/event/reward/cardSelect)
        const fullWidth = Math.min(this.screenWidth - 40, 900);
        const fullHeight = Math.min(this.screenHeight - 40, 560);
        [this.shopCanvas, this.restCanvas, this.eventCanvas, this.rewardCanvas, this.cardSelectCanvas].forEach(c => {
            if (c) {
                c.width = fullWidth;
                c.height = fullHeight;
            }
        });
    }

    // 设置事件监听
    setupEvents() {
        // 开始按钮
        document.getElementById('startBtn')?.addEventListener('click', () => {
            sound.init();
            sound.click();
            this.startGame();
        });

        // 重新开始按钮
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            sound.click();
            this.startGame();
        });

        document.getElementById('restartBtn2')?.addEventListener('click', () => {
            sound.click();
            this.startGame();
        });

        // 结束回合按钮
        document.getElementById('endTurnBtn')?.addEventListener('click', () => {
            if (this.state === GameState.COMBAT && this.combat) {
                sound.click();
                this.combat.endPlayerTurn();
            }
        });

        // 卡牌Canvas事件 (战斗手牌)
        if (this.cardCanvas) {
            this.cardCanvas.addEventListener('mousemove', (e) => this.onCardMouseMove(e));
            this.cardCanvas.addEventListener('click', (e) => this.onCardClick(e));
        }

        // 战斗主Canvas事件 (敌人区域)
        if (this.mainCanvas) {
            this.mainCanvas.addEventListener('mousemove', (e) => this.onMainMouseMove(e));
            this.mainCanvas.addEventListener('click', (e) => this.onMainClick(e));
        }

        // 地图Canvas事件
        if (this.mapCanvas) {
            this.mapCanvas.addEventListener('mousemove', (e) => this.onMapMouseMove(e));
            this.mapCanvas.addEventListener('click', (e) => this.onMapClick(e));
        }

        // 商店/休息/事件/奖励/卡牌选择的Canvas事件
        [
            { canvas: this.shopCanvas, prefix: 'shop' },
            { canvas: this.restCanvas, prefix: 'rest' },
            { canvas: this.eventCanvas, prefix: 'event' },
            { canvas: this.rewardCanvas, prefix: 'reward' },
            { canvas: this.cardSelectCanvas, prefix: 'cardSelect' },
        ].forEach(({ canvas, prefix }) => {
            if (canvas) {
                canvas.addEventListener('mousemove', (e) => this.onOverlayMouseMove(e, canvas));
                canvas.addEventListener('click', (e) => this.onOverlayClick(e, canvas));
            }
        });

        // 药水点击
        document.querySelectorAll('.potion-slot').forEach((el, i) => {
            el.addEventListener('click', () => {
                if (this.state === GameState.COMBAT && this.combat) {
                    sound.click();
                    this.combat.usePotion(i, this.hoveredEnemyIndex);
                }
            });
        });
    }

    // ---- 屏幕切换 ----
    showScreen(screenName) {
        const screens = ['menuScreen', 'mapScreen', 'combatScreen', 'shopScreen', 'restScreen', 'eventScreen', 'gameOverScreen', 'victoryScreen', 'cardSelectScreen', 'rewardScreen'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const screenMap = {
            [GameState.MENU]: 'menuScreen',
            [GameState.MAP]: 'mapScreen',
            [GameState.COMBAT]: 'combatScreen',
            [GameState.SHOP]: 'shopScreen',
            [GameState.REST]: 'restScreen',
            [GameState.EVENT]: 'eventScreen',
            [GameState.GAME_OVER]: 'gameOverScreen',
            [GameState.VICTORY]: 'victoryScreen',
            [GameState.CARD_SELECT]: 'cardSelectScreen',
            [GameState.REWARDS]: 'rewardScreen',
        };

        const elId = screenMap[screenName];
        if (elId) {
            const el = document.getElementById(elId);
            if (el) el.style.display = 'flex';
        }

        // 更新活动canvas
        this.updateActiveCanvas();
    }

    updateActiveCanvas() {
        switch (this.state) {
            case GameState.COMBAT:
                this.activeCanvas = this.mainCanvas;
                this.activeCtx = this.mainCtx;
                break;
            case GameState.SHOP:
                this.activeCanvas = this.shopCanvas;
                this.activeCtx = this.shopCtx;
                break;
            case GameState.REST:
                this.activeCanvas = this.restCanvas;
                this.activeCtx = this.restCtx;
                break;
            case GameState.EVENT:
                this.activeCanvas = this.eventCanvas;
                this.activeCtx = this.eventCtx;
                break;
            case GameState.REWARDS:
                this.activeCanvas = this.rewardCanvas;
                this.activeCtx = this.rewardCtx;
                break;
            case GameState.CARD_SELECT:
                this.activeCanvas = this.cardSelectCanvas;
                this.activeCtx = this.cardSelectCtx;
                break;
            default:
                this.activeCanvas = null;
                this.activeCtx = null;
        }
    }

    // ---- 开始游戏 ----
    startGame() {
        this.player.reset();
        this.gameMap.generate();
        this.currentFloor = 0;
        this.currentNode = null;
        this.state = GameState.MAP;
        this.showScreen(GameState.MAP);
        this.renderMap();
    }

    // ---- 地图交互 ----
    onMapMouseMove(e) {
        if (this.state !== GameState.MAP) return;
        const rect = this.mapCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.mapCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.mapCanvas.height / rect.height);
        this.hoveredMapNode = this.gameMap.getNodeAtPos(x, y, this.mapCanvas.width, this.mapCanvas.height);
        this.renderMap();
    }

    onMapClick(e) {
        if (this.state !== GameState.MAP) return;
        const rect = this.mapCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.mapCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.mapCanvas.height / rect.height);
        const node = this.gameMap.getNodeAtPos(x, y, this.mapCanvas.width, this.mapCanvas.height);

        if (node && node.accessible) {
            sound.click();
            this.enterNode(node);
        }
    }

    // 进入节点
    enterNode(node) {
        this.currentNode = this.gameMap.visitNode(node.id);

        switch (node.type) {
            case NODE_TYPE.BATTLE:
            case NODE_TYPE.ELITE:
            case NODE_TYPE.BOSS:
                this.startCombat(node);
                break;
            case NODE_TYPE.SHOP:
                this.enterShop();
                break;
            case NODE_TYPE.REST:
                this.enterRest();
                break;
            case NODE_TYPE.EVENT:
                this.enterEvent();
                break;
            case NODE_TYPE.TREASURE: {
                const gold = Math.floor(Math.random() * 30) + 20;
                this.player.gold += gold;
                this.showRewardsScreen({ gold, cards: [] });
                break;
            }
        }
    }

    // ---- 战斗 ----
    startCombat(node) {
        const enemyIds = node.getEnemies();
        const enemies = Enemy.createEnemies(enemyIds);

        this.combat = new CombatSystem(this.player, (victory, rewards) => {
            this.onCombatEnd(victory, rewards);
        });

        this.state = GameState.COMBAT;
        this.showScreen(GameState.COMBAT);

        const enemyNames = enemies.map(e => e.name).join(', ');
        document.getElementById('enemyNames').textContent = enemyNames;

        this.combat.startCombat(enemies);
    }

    onCombatEnd(victory, rewards) {
        if (victory) {
            const cardRewards = cardSystem.generateCardRewards(this.currentFloor);
            this.rewards = {
                gold: rewards.gold,
                cards: cardRewards,
            };
            this.state = GameState.REWARDS;
            this.showScreen(GameState.REWARDS);
        } else {
            this.state = GameState.GAME_OVER;
            this.showScreen(GameState.GAME_OVER);
            document.getElementById('finalFloor').textContent = `到达: 第${this.currentFloor + 1}层`;
        }
    }

    // ---- 战斗交互 ----
    onCardMouseMove(e) {
        if (this.state !== GameState.COMBAT || !this.combat) return;
        const rect = this.cardCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.cardCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.cardCanvas.height / rect.height);
        ui.hoveredCardIndex = ui.getHoveredCardIndex(x, y, this.player.hand.length, this.cardCanvas.width);
    }

    onCardClick(e) {
        if (this.state !== GameState.COMBAT || !this.combat) return;
        if (!this.combat.isPlayerTurn || this.combat.isProcessing) return;
        const rect = this.cardCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.cardCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.cardCanvas.height / rect.height);
        const idx = ui.getHoveredCardIndex(x, y, this.player.hand.length, this.cardCanvas.width);

        if (idx >= 0) {
            const cardId = this.player.hand[idx];
            const def = CARD_DEFS[cardId];
            if (def && def.cost <= this.player.energy) {
                this.combat.playCard(idx);
            }
        }
    }

    onMainMouseMove(e) {
        if (this.state !== GameState.COMBAT) return;
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.mainCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.mainCanvas.height / rect.height);
        this.hoveredEnemyIndex = this.getHoveredEnemyIndex(x, y);
    }

    onMainClick(e) {
        if (this.state !== GameState.COMBAT || !this.combat) return;
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.mainCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.mainCanvas.height / rect.height);
        const enemyIdx = this.getHoveredEnemyIndex(x, y);
        if (enemyIdx >= 0) {
            this.combat.selectedEnemyIndex = enemyIdx;
        }
    }

    // overlay canvas 通用鼠标事件路由
    onOverlayMouseMove(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const w = canvas.width;
        const h = canvas.height;

        switch (this.state) {
            case GameState.SHOP:
                this.hoveredShopItem = ui.getShopHoverItem(x, y, this.shopCards.length, w, h);
                break;
            case GameState.REST:
                this.hoveredChoice = this.getRestHover(x, y, w, h);
                break;
            case GameState.EVENT:
                if (this.currentEvent) this.hoveredChoice = ui.getEventHoverChoice(x, y, this.currentEvent, w);
                break;
            case GameState.REWARDS:
                if (this.rewards) this.hoveredReward = ui.getRewardHover(x, y, this.rewards.cards?.length || 0, w, h);
                break;
            case GameState.CARD_SELECT:
                this.hoveredSelectCard = ui.getCardSelectHover(x, y, this.selectCards.length, w, h);
                break;
        }
    }

    onOverlayClick(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const w = canvas.width;
        const h = canvas.height;

        switch (this.state) {
            case GameState.SHOP:
                this.handleShopClick(x, y, w, h);
                break;
            case GameState.REST:
                this.handleRestClick(x, y, w, h);
                break;
            case GameState.EVENT:
                this.handleEventClick(x, y, w);
                break;
            case GameState.REWARDS:
                this.handleRewardClick(x, y, w, h);
                break;
            case GameState.CARD_SELECT:
                this.handleCardSelectClick(x, y, w, h);
                break;
        }
    }

    getHoveredEnemyIndex(x, y) {
        if (!this.combat) return -1;
        const enemies = this.combat.enemies;
        const aliveEnemies = enemies.filter(e => e.isAlive());
        if (aliveEnemies.length === 0) return -1;

        const enemyW = 140;
        const gap = 20;
        const totalW = aliveEnemies.length * (enemyW + gap) - gap;
        const startX = (this.mainCanvas.width - totalW) / 2;

        for (let i = 0; i < aliveEnemies.length; i++) {
            const ex = startX + i * (enemyW + gap);
            if (x >= ex && x <= ex + enemyW && y >= 20 && y <= 200) {
                return enemies.indexOf(aliveEnemies[i]);
            }
        }
        return -1;
    }

    // ---- 商店 ----
    enterShop() {
        this.shopCards = cardSystem.getShopCards(this.currentFloor);
        this.state = GameState.SHOP;
        this.showScreen(GameState.SHOP);
    }

    handleShopClick(x, y, w, h) {
        const hovered = ui.getShopHoverItem(x, y, this.shopCards.length, w, h);

        if (hovered === -2) {
            sound.click();
            this.state = GameState.MAP;
            this.showScreen(GameState.MAP);
            this.renderMap();
            return;
        }

        if (hovered >= 0 && hovered < this.shopCards.length) {
            const cardId = this.shopCards[hovered];
            const def = CARD_DEFS[cardId];
            const price = ui.getCardPrice(def.rarity);
            if (this.player.gold >= price) {
                this.player.gold -= price;
                this.player.addCardToDeck(cardId);
                this.shopCards.splice(hovered, 1);
                sound.buy();
            }
        } else if (hovered === this.shopCards.length) {
            if (this.player.gold >= SHOP_PRICES.REMOVE_CARD && this.player.deck.length > 5) {
                this.openCardSelect('选择要移除的卡牌', this.player.deck, (cardId) => {
                    this.player.gold -= SHOP_PRICES.REMOVE_CARD;
                    this.player.removeCardFromDeck(cardId);
                    sound.skill();
                    this.state = GameState.SHOP;
                    this.showScreen(GameState.SHOP);
                });
            }
        } else if (hovered > this.shopCards.length) {
            const potionIdx = hovered - this.shopCards.length - 1;
            const potionIds = Object.keys(POTIONS);
            if (potionIdx < potionIds.length) {
                const pId = potionIds[potionIdx];
                if (this.player.gold >= SHOP_PRICES.POTION && this.player.potions.length < GAME_CONFIG.POTION_SLOTS) {
                    this.player.gold -= SHOP_PRICES.POTION;
                    this.player.addPotion(pId);
                    sound.buy();
                }
            }
        }
    }

    // ---- 休息 ----
    enterRest() {
        this.state = GameState.REST;
        this.showScreen(GameState.REST);
    }

    getRestHover(x, y, w, h) {
        const centerX = w / 2;
        if (x >= centerX - 150 && x <= centerX + 150 && y >= 180 && y <= 230) return 0;
        if (x >= centerX - 150 && x <= centerX + 150 && y >= 250 && y <= 300) return 1;
        return -1;
    }

    handleRestClick(x, y, w, h) {
        const choice = this.getRestHover(x, y, w, h);
        if (choice === 0) {
            const healAmount = Math.floor(this.player.maxHp * 0.3);
            this.player.heal(healAmount);
            sound.heal();
            this.state = GameState.MAP;
            this.showScreen(GameState.MAP);
            this.renderMap();
        } else if (choice === 1) {
            this.isUpgradeMode = true;
            this.openCardSelect('选择要升级的卡牌 (费用-1)', this.player.deck, (cardId) => {
                this.upgradeCard(cardId);
                this.isUpgradeMode = false;
                sound.upgrade();
                this.state = GameState.MAP;
                this.showScreen(GameState.MAP);
                this.renderMap();
            });
        }
    }

    upgradeCard(cardId) {
        const def = CARD_DEFS[cardId];
        if (def && def.cost > 0) {
            const upgradedId = def.id + '_upgraded';
            if (!CARD_DEFS[upgradedId]) {
                const upgraded = { ...def };
                upgraded.cost = def.cost - 1;
                upgraded.name = def.name + '+';
                upgraded.id = upgradedId;
                upgraded.description = def.description.replace(/\d+/g, (m) => Math.floor(parseInt(m) * 1.3));
                CARD_DEFS[upgradedId] = upgraded;
            }
            const idx = this.player.deck.indexOf(cardId);
            if (idx !== -1) {
                this.player.deck[idx] = upgradedId;
            }
        }
    }

    // ---- 事件 ----
    enterEvent() {
        this.currentEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        this.state = GameState.EVENT;
        this.showScreen(GameState.EVENT);
    }

    handleEventClick(x, y, w) {
        const choice = ui.getEventHoverChoice(x, y, this.currentEvent, w);
        if (choice < 0) return;

        const effect = this.currentEvent.choices[choice].effect;
        const value = this.currentEvent.choices[choice].value;

        sound.click();

        switch (effect) {
            case 'heal_percent':
                this.player.heal(Math.floor(this.player.maxHp * value));
                sound.heal();
                break;
            case 'buy_rare_card':
                if (this.player.gold >= value) {
                    this.player.gold -= value;
                    const rareCards = Object.keys(CARD_DEFS).filter(id => CARD_DEFS[id].rarity === 'rare' && !id.includes('_upgraded'));
                    const card = rareCards[Math.floor(Math.random() * rareCards.length)];
                    if (card) this.player.addCardToDeck(card);
                    sound.buy();
                }
                break;
            case 'max_hp_up':
                if (this.player.gold >= value) {
                    this.player.gold -= value;
                    this.player.increaseMaxHp(this.currentEvent.choices[choice].hpGain || 5);
                    sound.skill();
                }
                break;
            case 'gain_strength':
                this.player.addStatus('strength', value);
                sound.skill();
                break;
            case 'gain_dexterity':
                this.player.addStatus('dexterity', value);
                sound.skill();
                break;
            case 'sacrifice_for_card': {
                this.player.takeDamage(Math.floor(this.player.maxHp * value), true);
                const rarePool = Object.keys(CARD_DEFS).filter(id => CARD_DEFS[id].rarity === 'rare' && !id.includes('_upgraded'));
                const rareCard = rarePool[Math.floor(Math.random() * rarePool.length)];
                if (rareCard) this.player.addCardToDeck(rareCard);
                sound.hurt();
                break;
            }
            case 'gold': {
                const goldAmount = Math.floor(Math.random() * (value[1] - value[0] + 1)) + value[0];
                this.player.gold += goldAmount;
                sound.buy();
                break;
            }
            case 'random_buff': {
                const buffs = ['strength', 'dexterity'];
                const buff = buffs[Math.floor(Math.random() * buffs.length)];
                this.player.addStatus(buff, 2);
                sound.skill();
                break;
            }
            case 'none':
            default:
                break;
        }

        if (!this.player.isAlive()) {
            this.state = GameState.GAME_OVER;
            this.showScreen(GameState.GAME_OVER);
            document.getElementById('finalFloor').textContent = `到达: 第${this.currentFloor + 1}层`;
            return;
        }

        this.state = GameState.MAP;
        this.showScreen(GameState.MAP);
        this.renderMap();
    }

    // ---- 奖励 ----
    showRewardsScreen(rewards) {
        this.rewards = rewards;
        this.state = GameState.REWARDS;
        this.showScreen(GameState.REWARDS);
    }

    handleRewardClick(x, y, w, h) {
        const hovered = ui.getRewardHover(x, y, this.rewards.cards?.length || 0, w, h);

        if (hovered === -2) {
            sound.click();
            this.afterReward();
            return;
        }

        if (hovered >= 0 && hovered < (this.rewards.cards?.length || 0)) {
            const cardId = this.rewards.cards[hovered];
            this.player.addCardToDeck(cardId);
            sound.buy();
            this.afterReward();
        }
    }

    afterReward() {
        if (this.currentNode && this.currentNode.type === NODE_TYPE.BOSS) {
            if (this.currentFloor < GAME_CONFIG.MAP_LAYERS - 1) {
                this.currentFloor++;
                this.gameMap.currentFloor = this.currentFloor;
                // 标记新层前排节点为可访问
                const firstRow = this.gameMap.floors[this.currentFloor]?.[0];
                if (firstRow) firstRow.forEach(node => node.accessible = true);
            }
            if (this.currentFloor >= GAME_CONFIG.MAP_LAYERS) {
                this.state = GameState.VICTORY;
                this.showScreen(GameState.VICTORY);
                return;
            }
        }

        this.state = GameState.MAP;
        this.showScreen(GameState.MAP);
        this.renderMap();
    }

    // ---- 卡牌选择 ----
    openCardSelect(title, cards, callback) {
        this.selectCards = [...cards];
        this.selectCallback = callback;
        this.selectTitle = title;
        this.state = GameState.CARD_SELECT;
        this.showScreen(GameState.CARD_SELECT);
    }

    handleCardSelectClick(x, y, w, h) {
        const hovered = ui.getCardSelectHover(x, y, this.selectCards.length, w, h);

        if (hovered === -2) {
            sound.click();
            if (this.isUpgradeMode) {
                this.state = GameState.REST;
                this.showScreen(GameState.REST);
            } else {
                this.state = GameState.SHOP;
                this.showScreen(GameState.SHOP);
            }
            return;
        }

        if (hovered >= 0 && hovered < this.selectCards.length) {
            const cardId = this.selectCards[hovered];
            if (this.selectCallback) {
                this.selectCallback(cardId);
            }
        }
    }

    // ---- 渲染循环 ----
    renderLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.renderLoop());
    }

    update() {
        if (this.state === GameState.COMBAT && this.combat) {
            this.updateCombatUI();
        }
    }

    updateCombatUI() {
        if (!this.combat) return;

        const energyEl = document.getElementById('energyDisplay');
        if (energyEl) energyEl.textContent = `⚡ ${this.player.energy}/${this.player.maxEnergy}`;

        const hpEl = document.getElementById('hpDisplay');
        if (hpEl) hpEl.textContent = `❤️ ${this.player.hp}/${this.player.maxHp}`;

        const armorEl = document.getElementById('armorDisplay');
        if (armorEl) armorEl.textContent = this.player.armor > 0 ? `🛡️ ${this.player.armor}` : '';

        const turnEl = document.getElementById('turnDisplay');
        if (turnEl) turnEl.textContent = `回合 ${this.combat.turn}`;

        const logEl = document.getElementById('combatLog');
        if (logEl && this.combat.combatLog.length > 0) {
            const recentLogs = this.combat.combatLog.slice(-8);
            logEl.innerHTML = recentLogs.map(l => `<div>${l.text}</div>`).join('');
            logEl.scrollTop = logEl.scrollHeight;
        }

        const endTurnBtn = document.getElementById('endTurnBtn');
        if (endTurnBtn) {
            endTurnBtn.disabled = !this.combat.isPlayerTurn || this.combat.isProcessing;
            endTurnBtn.style.opacity = endTurnBtn.disabled ? '0.5' : '1';
        }

        document.querySelectorAll('.potion-slot').forEach((el, i) => {
            if (i < this.player.potions.length) {
                const potion = POTIONS[this.player.potions[i]];
                el.textContent = '🧪';
                el.title = potion ? potion.name : '';
                el.style.opacity = '1';
            } else {
                el.textContent = '';
                el.title = '';
                el.style.opacity = '0.3';
            }
        });
    }

    render() {
        switch (this.state) {
            case GameState.COMBAT:
                this.renderCombat();
                break;
            case GameState.SHOP:
                this.renderShop();
                break;
            case GameState.REST:
                this.renderRest();
                break;
            case GameState.EVENT:
                this.renderEvent();
                break;
            case GameState.REWARDS:
                this.renderRewards();
                break;
            case GameState.CARD_SELECT:
                this.renderCardSelect();
                break;
            case GameState.MAP:
                this.renderMap();
                break;
        }
    }

    renderCombat() {
        if (!this.combat) return;

        // 绘制敌人
        if (this.mainCtx) {
            const ctx = this.mainCtx;
            const w = this.mainCanvas.width;
            const h = this.mainCanvas.height;
            ctx.clearRect(0, 0, w, h);
            ui.drawEnemies(ctx, this.combat.enemies, 0, 10, w, this.hoveredEnemyIndex);
            ui.drawFloatingTexts(ctx);
        }

        // 绘制手牌
        if (this.cardCtx) {
            ui.drawHand(this.player.hand, this.player.energy, (cardId) => {
                const def = CARD_DEFS[cardId];
                return def && def.cost <= this.player.energy && this.combat.isPlayerTurn && !this.combat.isProcessing;
            });
        }
    }

    renderShop() {
        if (!this.shopCtx) return;
        const ctx = this.shopCtx;
        const w = this.shopCanvas.width;
        const h = this.shopCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ui.drawShop(ctx, this.shopCards, this.player, w, h, this.hoveredShopItem);
    }

    renderRest() {
        if (!this.restCtx) return;
        const ctx = this.restCtx;
        const w = this.restCanvas.width;
        const h = this.restCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ui.drawRest(ctx, this.player, w, h, this.hoveredChoice);
    }

    renderEvent() {
        if (!this.eventCtx || !this.currentEvent) return;
        const ctx = this.eventCtx;
        const w = this.eventCanvas.width;
        const h = this.eventCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ui.drawEvent(ctx, this.currentEvent, w, h, this.hoveredChoice);
    }

    renderRewards() {
        if (!this.rewardCtx || !this.rewards) return;
        const ctx = this.rewardCtx;
        const w = this.rewardCanvas.width;
        const h = this.rewardCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ui.drawRewards(ctx, this.rewards, w, h, this.hoveredReward);
    }

    renderCardSelect() {
        if (!this.cardSelectCtx) return;
        const ctx = this.cardSelectCtx;
        const w = this.cardSelectCanvas.width;
        const h = this.cardSelectCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ui.drawCardSelect(ctx, this.selectCards, this.selectTitle, w, h, this.hoveredSelectCard);
    }

    renderMap() {
        if (!this.mapCtx) return;
        const ctx = this.mapCtx;
        const w = this.mapCanvas.width;
        const h = this.mapCanvas.height;
        ctx.clearRect(0, 0, w, h);
        this.gameMap.drawMap(ctx, w, h, this.hoveredMapNode);

        const floorEl = document.getElementById('floorDisplay');
        if (floorEl) {
            const floorNames = ['第一层', '第二层', '第三层'];
            floorEl.textContent = floorNames[this.currentFloor] || `第${this.currentFloor + 1}层`;
        }

        const goldEl = document.getElementById('goldDisplay');
        if (goldEl) goldEl.textContent = `💰 ${this.player.gold}`;

        const mapHpEl = document.getElementById('mapHpDisplay');
        if (mapHpEl) mapHpEl.textContent = `❤️ ${this.player.hp}/${this.player.maxHp}`;
    }
}

// 启动游戏
const game = new Game();
document.addEventListener('DOMContentLoaded', () => {
    game.init();
});

window.game = game;
