// main.js - 游戏主循环、回合管理、事件监听

import { SQUARES, COLOR_GROUPS, PLAYER_COLORS, PLAYER_NAMES, START_MONEY, JAIL_BAIL, BUILDING_COSTS, RAILROAD_POSITIONS, UTILITY_POSITIONS } from './config.js';
import { Sound } from './sound.js';
import { Board } from './board.js';
import { Player } from './player.js';
import { CardSystem } from './cards.js';
import { TradeSystem } from './trade.js';
import { AIPlayer } from './ai.js';
import { UI } from './ui.js';

class MonopolyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ui = new UI(this.canvas);
        this.board = new Board();
        this.cards = new CardSystem();
        this.trade = new TradeSystem();
        this.ai = new AIPlayer(this.board);

        this.players = [];
        this.currentPlayerIdx = 0;
        this.gamePhase = 'menu'; // menu | playing | gameOver
        this.turnPhase = 'idle'; // idle | rolling | moving | action | building | trading | card | endTurn

        this.dice1 = 0;
        this.dice2 = 0;
        this.diceRolling = false;
        this.moveSteps = 0;
        this.moveRemaining = 0;
        this.lastRoll = 0;
        this.wasInJail = false; // 标记是否刚从监狱出来

        this.animFrame = null;
        this.lastTime = 0;

        this._setupUIEvents();
        this._showMenu();
    }

    _setupUIEvents() {
        // 开始游戏按钮
        document.getElementById('btnStart').addEventListener('click', () => {
            this._startGame();
        });

        // 掷骰子
        document.getElementById('btnRoll').addEventListener('click', () => {
            if (this.turnPhase === 'idle' && !this._isCurrentAI()) {
                this._rollDice();
            }
        });

        // 购买地产
        document.getElementById('btnBuy').addEventListener('click', () => {
            if (this.turnPhase === 'action') {
                this._buyCurrentProperty();
            }
        });

        // 跳过购买
        document.getElementById('btnSkip').addEventListener('click', () => {
            if (this.turnPhase === 'action') {
                this._skipBuy();
            }
        });

        // 建房
        document.getElementById('btnBuild').addEventListener('click', () => {
            if (this.turnPhase === 'idle' || this.turnPhase === 'building') {
                this._showBuildPanel();
            }
        });

        // 结束回合
        document.getElementById('btnEndTurn').addEventListener('click', () => {
            if (this.turnPhase === 'endTurn' || this.turnPhase === 'building') {
                this._endTurn();
            }
        });

        // 交易
        document.getElementById('btnTrade').addEventListener('click', () => {
            if (this.turnPhase === 'idle' || this.turnPhase === 'building' || this.turnPhase === 'endTurn') {
                this._showTradePanel();
            }
        });

        // 监狱选项
        document.getElementById('btnJailRoll').addEventListener('click', () => {
            if (this.turnPhase === 'action' && this._getCurrentPlayer().inJail) {
                this._jailRoll();
            }
        });
        document.getElementById('btnJailPay').addEventListener('click', () => {
            if (this.turnPhase === 'action' && this._getCurrentPlayer().inJail) {
                this._jailPay();
            }
        });
        document.getElementById('btnJailCard').addEventListener('click', () => {
            if (this.turnPhase === 'action' && this._getCurrentPlayer().inJail) {
                this._jailUseCard();
            }
        });

        // Canvas 鼠标移动
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.ui.hoveredSquare = this.ui.getSquareAtPoint(mx, my);
        });

        // Canvas 点击
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const sqId = this.ui.getSquareAtPoint(mx, my);
            if (sqId >= 0) {
                this._onSquareClick(sqId);
            }
        });

        // 交易弹窗按钮
        document.getElementById('btnTradeConfirm')?.addEventListener('click', () => this._confirmTrade());
        document.getElementById('btnTradeCancel')?.addEventListener('click', () => this._closeTradePanel());

        // 建房面板按钮
        document.getElementById('btnBuildConfirm')?.addEventListener('click', () => this._confirmBuild());
        document.getElementById('btnBuildCancel')?.addEventListener('click', () => this._closeBuildPanel());
    }

    _showMenu() {
        document.getElementById('menuOverlay').style.display = 'flex';
        document.getElementById('sidePanel').style.display = 'none';
        // 停止游戏循环
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
    }

    _startGame() {
        Sound.click();
        const playerCount = parseInt(document.getElementById('playerCount').value) || 2;
        const aiCount = parseInt(document.getElementById('aiCount').value) || 0;

        this.players = [];
        let id = 0;

        // 创建人类玩家
        for (let i = 0; i < playerCount - aiCount; i++) {
            this.players.push(new Player(id, PLAYER_NAMES[id], PLAYER_COLORS[id], false));
            id++;
        }

        // 创建AI玩家
        for (let i = 0; i < aiCount; i++) {
            this.players.push(new Player(id, PLAYER_NAMES[id] + '(AI)', PLAYER_COLORS[id], true));
            id++;
        }

        // 初始化玩家动画位置
        for (const p of this.players) {
            this.ui.playerAnimPos[p.id] = 0;
        }

        this.currentPlayerIdx = 0;
        this.gamePhase = 'playing';
        this.turnPhase = 'idle';

        document.getElementById('menuOverlay').style.display = 'none';
        document.getElementById('sidePanel').style.display = 'flex';

        this._updateUI();
        this._startTurn();
        this._gameLoop();
    }

    _gameLoop(timestamp = 0) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.ui.update(dt);

        this.ui.render({
            players: this.players,
            dice1: this.dice1,
            dice2: this.dice2,
            diceRolling: this.diceRolling
        });

        this.animFrame = requestAnimationFrame((t) => this._gameLoop(t));
    }

    _getCurrentPlayer() {
        return this.players[this.currentPlayerIdx];
    }

    _isCurrentAI() {
        return this._getCurrentPlayer().isAI;
    }

    _startTurn() {
        const player = this._getCurrentPlayer();
        if (player.bankrupt) {
            this._endTurn();
            return;
        }

        this.turnPhase = 'idle';
        this._updateUI();
        this._updateTurnInfo();

        // AI 自动回合
        if (player.isAI) {
            setTimeout(() => this._aiTurn(), 800);
        }
    }

    _aiTurn() {
        const player = this._getCurrentPlayer();
        if (player.bankrupt || !player.isAI) return;

        // AI 狱中逻辑
        if (player.inJail) {
            const decision = this.ai.jailDecision(player);
            if (decision === 'card') {
                this._jailUseCard();
            } else if (decision === 'pay') {
                this._jailPay();
            } else {
                this._rollDice();
            }
            return;
        }

        // AI 建房
        const buildDecision = this.ai.getBuildDecision(player);
        if (buildDecision && this.turnPhase === 'idle') {
            const sq = SQUARES.find(s => s.id === buildDecision.squareId);
            if (sq && this.board.canBuild(sq, player)) {
                const cost = this.board.getBuildCost(sq);
                player.pay(cost);
                player.setHousesOn(sq.id, player.getHousesOn(sq.id) + 1);
                Sound.build();
                this.ui.showMessage(`${player.name} 在 ${sq.name} 建了一栋${player.getHousesOn(sq.id) >= 5 ? '酒店' : '房子'}`);
            }
        }

        // AI 掷骰子
        setTimeout(() => this._rollDice(), 600);
    }

    _rollDice() {
        if (this.diceRolling) return;
        this.diceRolling = true;
        Sound.dice();

        let rollCount = 0;
        const rollInterval = setInterval(() => {
            this.dice1 = Math.floor(Math.random() * 6) + 1;
            this.dice2 = Math.floor(Math.random() * 6) + 1;
            rollCount++;
            if (rollCount >= 12) {
                clearInterval(rollInterval);
                this.diceRolling = false;
                this._onDiceResult();
            }
        }, 80);
    }

    _onDiceResult() {
        const player = this._getCurrentPlayer();
        const d1 = this.dice1;
        const d2 = this.dice2;
        const total = d1 + d2;
        this.lastRoll = total;

        const isDoubles = d1 === d2;
        this.wasInJail = player.inJail;

        // 监狱逻辑
        if (player.inJail) {
            if (isDoubles) {
                player.tryLeaveJail(d1, d2);
                this.ui.showMessage(`${player.name} 掷出双数出狱！`);
                Sound.jail();
                // 双数出狱后移动，但不获得额外回合
            } else {
                player.jailTurns++;
                if (player.jailTurns >= 3) {
                    player.pay(JAIL_BAIL);
                    player.inJail = false;
                    player.jailTurns = 0;
                    this.ui.showMessage(`${player.name} 第三次失败，付$${JAIL_BAIL}出狱，继续移动`);
                } else {
                    this.ui.showMessage(`${player.name} 未掷出双数，留在监狱`);
                    this.turnPhase = 'endTurn';
                    this._updateUI();
                    if (player.isAI) setTimeout(() => this._endTurn(), 1000);
                    return;
                }
            }
        }

        // 三次双数入狱（仅非监狱状态时检查）
        if (!this.wasInJail && isDoubles) {
            player.doublesCount++;
            if (player.doublesCount >= 3) {
                player.goToJail();
                Sound.jail();
                this.ui.showMessage(`${player.name} 连续三次双数，入狱！`);
                this.turnPhase = 'endTurn';
                this._updateUI();
                if (player.isAI) setTimeout(() => this._endTurn(), 1000);
                return;
            }
        } else if (!this.wasInJail) {
            player.doublesCount = 0;
        }

        this.turnPhase = 'moving';
        this.moveSteps = total;
        this._animateMove();
    }

    _animateMove() {
        const player = this._getCurrentPlayer();
        if (this.moveSteps <= 0) {
            this._onLand();
            return;
        }

        this.moveSteps--;
        const oldPos = player.position;
        player.position = (player.position + 1) % 40;

        // 经过起点
        if (player.position < oldPos && !player.inJail) {
            player.money += 200;
            this.ui.showMessage(`${player.name} 经过起点，收取$200`);
        }

        Sound.move();
        this._updateUI();

        setTimeout(() => this._animateMove(), 150);
    }

    _onLand() {
        const player = this._getCurrentPlayer();
        const square = SQUARES[player.position];
        const owner = this.board.findOwner(player.position, this.players);

        // 特殊格子
        if (square.type === 'go') {
            this._endAction();
            return;
        }

        if (square.type === 'gotojail') {
            player.goToJail();
            Sound.jail();
            this.ui.showMessage(`${player.name} 入狱！`);
            this._endAction();
            return;
        }

        if (square.type === 'jail') {
            this.ui.showMessage(`${player.name} 路过监狱/探监`);
            this._endAction();
            return;
        }

        if (square.type === 'parking') {
            this.ui.showMessage(`${player.name} 免费停车`);
            this._endAction();
            return;
        }

        if (square.type === 'tax') {
            player.pay(square.amount);
            Sound.rent();
            this.ui.showMessage(`${player.name} 缴税 $${square.amount}`);
            this._checkBankrupt(player);
            this._endAction();
            return;
        }

        if (square.type === 'chance' || square.type === 'chest') {
            this._handleCard(square.type);
            return;
        }

        // 可购买地产
        if (owner && owner.id !== player.id) {
            // 付租金
            const rent = this.board.calculateRent(square, owner, this.lastRoll);
            if (rent > 0) {
                player.pay(rent);
                owner.receive(rent);
                Sound.rent();
                this.ui.showMessage(`${player.name} 向 ${owner.name} 支付租金 $${rent}`);
                this._checkBankrupt(player);
            }
            this._endAction();
            return;
        }

        if (owner && owner.id === player.id) {
            // 自己的地
            this._endAction();
            return;
        }

        // 无主地产 - 可购买
        if (square.price) {
            if (player.isAI) {
                if (this.ai.shouldBuy(player, square)) {
                    this._buyProperty(player, square);
                }
                this._endAction();
            } else {
                this.turnPhase = 'action';
                this._showBuyPanel(square);
            }
        } else {
            this._endAction();
        }
    }

    _showBuyPanel(square) {
        const player = this._getCurrentPlayer();
        const panel = document.getElementById('actionPanel');
        panel.style.display = 'block';
        document.getElementById('actionTitle').textContent = square.name;
        document.getElementById('actionDesc').textContent = `价格: $${square.price} | 你的现金: $${player.money}`;
        document.getElementById('btnBuy').style.display = player.money >= square.price ? 'inline-block' : 'none';
        document.getElementById('btnSkip').style.display = 'inline-block';
        document.getElementById('btnBuy').textContent = `购买 $${square.price}`;
    }

    _buyCurrentProperty() {
        const player = this._getCurrentPlayer();
        const square = SQUARES[player.position];
        this._buyProperty(player, square);
        this._endAction();
    }

    _buyProperty(player, square) {
        if (player.money >= square.price) {
            player.pay(square.price);
            player.addProperty(square.id);
            Sound.buy();
            this.ui.showMessage(`${player.name} 购买了 ${square.name}`);
        }
    }

    _skipBuy() {
        this.ui.showMessage(`${this._getCurrentPlayer().name} 放弃购买`);
        this._endAction();
    }

    _handleCard(type) {
        Sound.card();
        const player = this._getCurrentPlayer();
        const card = type === 'chance' ? this.cards.drawChance() : this.cards.drawChest();
        const result = this.cards.resolve(card, player, this.board, this.players);

        // 在右侧面板显示卡牌
        const cardPanel = document.getElementById('cardPanel');
        const cardTitle = document.getElementById('cardTitle');
        const cardText = document.getElementById('cardText');
        const cardResult = document.getElementById('cardResult');
        cardTitle.textContent = type === 'chance' ? '机会' : '命运';
        cardTitle.style.color = type === 'chance' ? '#FFA07A' : '#FFB6C1';
        cardText.textContent = card.text;
        cardResult.textContent = '';
        cardPanel.style.display = 'block';

        this.ui.showMessage(card.text, 2500);

        // 执行卡牌动作
        setTimeout(() => {
            let resultText = '';
            for (const action of result.actions) {
                switch (action.type) {
                    case 'moveTo':
                        player.position = action.target;
                        if (action.target === 0) player.money += 200;
                        this._onLand();
                        return;

                    case 'moveBack':
                        player.position = (player.position - action.steps + 40) % 40;
                        this._onLand();
                        return;

                    case 'collect':
                        player.receive(action.amount);
                        resultText += `获得 $${action.amount}  `;
                        break;

                    case 'pay':
                        player.pay(action.amount);
                        resultText += `支付 $${action.amount}  `;
                        this._checkBankrupt(player);
                        break;

                    case 'transfer':
                        const from = this.players.find(p => p.id === action.from);
                        if (from && !from.bankrupt) {
                            from.pay(action.amount);
                            player.receive(action.amount);
                            resultText += `从 ${from.name} 获得 $${action.amount}  `;
                            this._checkBankrupt(from);
                        }
                        break;

                    case 'goToJail':
                        player.goToJail();
                        Sound.jail();
                        cardResult.textContent = '入狱！';
                        this._endAction();
                        return;

                    case 'getOutOfJail':
                        player.getOutOfJailCards++;
                        resultText += '获得出狱卡  ';
                        break;
                }
            }
            if (resultText) cardResult.textContent = resultText;
            this._endAction();
        }, 2000);
    }

    _endAction() {
        this.turnPhase = 'endTurn';
        document.getElementById('actionPanel').style.display = 'none';
        this._updateUI();

        // AI 自动结束回合
        if (this._isCurrentAI()) {
            // AI 建房
            const build = this.ai.getBuildDecision(this._getCurrentPlayer());
            if (build) {
                const sq = SQUARES.find(s => s.id === build.squareId);
                if (sq && this.board.canBuild(sq, this._getCurrentPlayer())) {
                    const cost = this.board.getBuildCost(sq);
                    this._getCurrentPlayer().pay(cost);
                    this._getCurrentPlayer().setHousesOn(sq.id, this._getCurrentPlayer().getHousesOn(sq.id) + 1);
                    Sound.build();
                }
            }
            setTimeout(() => this._endTurn(), 800);
        }
    }

    _endTurn() {
        const player = this._getCurrentPlayer();
        document.getElementById('actionPanel').style.display = 'none';
        document.getElementById('buildPanel').style.display = 'none';
        document.getElementById('tradePanel').style.display = 'none';
        document.getElementById('cardPanel').style.display = 'none';

        // 双数再掷（但刚从监狱出来不算）
        if (this.dice1 === this.dice2 && !this.wasInJail && !player.inJail && !player.bankrupt) {
            this.ui.showMessage(`${player.name} 双数！再掷一次！`);
            this.turnPhase = 'idle';
            this._updateUI();
            if (player.isAI) {
                setTimeout(() => this._rollDice(), 800);
            }
            return;
        }

        // 下一个玩家
        this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;

        // 跳过破产玩家
        let attempts = 0;
        while (this._getCurrentPlayer().bankrupt && attempts < this.players.length) {
            this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
            attempts++;
        }

        // 检查胜利
        const alive = this.players.filter(p => !p.bankrupt);
        if (alive.length === 1) {
            this._gameOver(alive[0]);
            return;
        }

        this._startTurn();
    }

    _checkBankrupt(player) {
        if (player.money >= 0) return;

        // 自动卖建筑自救
        for (const sid of [...player.properties]) {
            if (player.money >= 0) break;
            const sq = SQUARES.find(s => s.id === sid);
            if (!sq || sq.type !== 'property') continue;
            const houses = player.getHousesOn(sid);
            if (houses > 0 && this.board.canSell(sq, player)) {
                const sellPrice = this.board.getBuildCost(sq) / 2;
                player.setHousesOn(sid, houses - 1);
                player.receive(sellPrice);
                this.ui.showMessage(`${player.name} 卖掉 ${sq.name} 的建筑获得 $${sellPrice}`);
            }
        }

        // 还不够则抵押地产（半价卖出）
        for (const sid of [...player.properties]) {
            if (player.money >= 0) break;
            const sq = SQUARES.find(s => s.id === sid);
            if (!sq || !sq.price) continue;
            if (player.getHousesOn(sid) > 0) continue;
            const mortgagePrice = sq.price / 2;
            player.removeProperty(sid);
            player.receive(mortgagePrice);
            this.ui.showMessage(`${player.name} 抵押 ${sq.name} 获得 $${mortgagePrice}`);
        }

        if (player.money < 0) {
            player.bankrupt = true;
            Sound.bankrupt();
            this.ui.showMessage(`${player.name} 破产！`, 3000);
            // 归还所有地产
            for (const sid of player.properties) {
                player.removeProperty(sid);
            }
            player.properties = [];
            player.houses = {};
        }
    }

    _gameOver(winner) {
        this.gamePhase = 'gameOver';
        Sound.win();
        this.ui.showMessage(`${winner.name} 获胜！恭喜！`, 10000);

        document.getElementById('gameOverOverlay').style.display = 'flex';
        document.getElementById('winnerText').textContent = `${winner.name} 获胜！`;
        document.getElementById('winnerMoney').textContent = `最终资产: $${winner.getTotalWorth(SQUARES)}`;

        // 使用 once: true 防止重复绑定
        document.getElementById('btnRestart').addEventListener('click', () => {
            document.getElementById('gameOverOverlay').style.display = 'none';
            this._showMenu();
        }, { once: true });
    }

    // --- 监狱选项 ---
    _jailRoll() {
        this._rollDice();
    }

    _jailPay() {
        const player = this._getCurrentPlayer();
        if (player.payBail()) {
            Sound.buy();
            this.ui.showMessage(`${player.name} 付$${JAIL_BAIL}保释出狱`);
        }
        this._endAction();
    }

    _jailUseCard() {
        const player = this._getCurrentPlayer();
        if (player.useGetOutCard()) {
            Sound.buy();
            this.ui.showMessage(`${player.name} 使用出狱卡`);
        }
        this._endAction();
    }

    // --- 建房面板 ---
    _showBuildPanel() {
        const player = this._getCurrentPlayer();
        const buildable = [];

        for (const sid of player.properties) {
            const sq = SQUARES.find(s => s.id === sid);
            if (sq && sq.type === 'property' && this.board.canBuild(sq, player)) {
                const cost = this.board.getBuildCost(sq);
                const current = player.getHousesOn(sid);
                buildable.push({
                    id: sid,
                    name: sq.name,
                    color: sq.color,
                    cost,
                    current,
                    label: current >= 4 ? '建酒店' : `建第${current + 1}栋`
                });
            }
        }

        if (buildable.length === 0) {
            this.ui.showMessage('没有可建造的地产');
            return;
        }

        const panel = document.getElementById('buildPanel');
        panel.style.display = 'block';
        const list = document.getElementById('buildList');
        list.innerHTML = '';

        for (const item of buildable) {
            const div = document.createElement('div');
            div.className = 'build-item';
            div.innerHTML = `
                <span class="build-color" style="background:${COLOR_GROUPS[item.color]?.css || '#666'}"></span>
                <span>${item.name} (${item.label}) - $${item.cost}</span>
            `;
            div.addEventListener('click', () => {
                const currentHouses = player.getHousesOn(item.id);
                if (currentHouses !== item.current) {
                    this.ui.showMessage('建筑数量已变化，请重新打开');
                    this._closeBuildPanel();
                    return;
                }
                if (player.money >= item.cost) {
                    player.pay(item.cost);
                    player.setHousesOn(item.id, currentHouses + 1);
                    Sound.build();
                    this.ui.showMessage(`在 ${item.name} 建造成功`);
                    this._closeBuildPanel();
                    this._updateUI();
                } else {
                    this.ui.showMessage('现金不足');
                }
            });
            list.appendChild(div);
        }
    }

    _confirmBuild() {
        this._closeBuildPanel();
    }

    _closeBuildPanel() {
        document.getElementById('buildPanel').style.display = 'none';
    }

    // --- 交易面板 ---
    _showTradePanel() {
        const player = this._getCurrentPlayer();
        const others = this.players.filter(p => p.id !== player.id && !p.bankrupt);

        if (others.length === 0) {
            this.ui.showMessage('没有可交易的对手');
            return;
        }

        const panel = document.getElementById('tradePanel');
        panel.style.display = 'block';

        // 对手选择
        const targetSelect = document.getElementById('tradeTarget');
        targetSelect.innerHTML = '';
        for (const other of others) {
            const opt = document.createElement('option');
            opt.value = other.id;
            opt.textContent = `${other.name} ($${other.money})`;
            targetSelect.appendChild(opt);
        }

        // 己方地产
        this._renderTradeProperties('myProps', player);
        // 对方地产（默认第一个对手）
        this._renderTradeProperties('theirProps', others[0]);

        // 移除旧监听器，绑定新的
        const newSelect = targetSelect.cloneNode(true);
        targetSelect.parentNode.replaceChild(newSelect, targetSelect);
        newSelect.addEventListener('change', () => {
            const target = this.players.find(p => p.id === parseInt(newSelect.value));
            if (target) this._renderTradeProperties('theirProps', target);
        });
    }

    _renderTradeProperties(containerId, player) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        for (const sid of player.properties) {
            const sq = SQUARES.find(s => s.id === sid);
            if (!sq || player.getHousesOn(sid) > 0) continue;
            const label = document.createElement('label');
            label.className = 'trade-prop';
            label.innerHTML = `<input type="checkbox" value="${sid}"> ${sq.name}`;
            container.appendChild(label);
        }
        if (player.properties.length === 0 || container.children.length === 0) {
            container.innerHTML = '<span style="color:#94a3b8;font-size:12px">无可交易地产</span>';
        }
    }

    _confirmTrade() {
        const player = this._getCurrentPlayer();
        const targetId = parseInt(document.getElementById('tradeTarget').value);
        const target = this.players.find(p => p.id === targetId);
        if (!target) return;

        const myCash = parseInt(document.getElementById('myCash')?.value) || 0;
        const theirCash = parseInt(document.getElementById('theirCash')?.value) || 0;

        const myProps = [];
        document.querySelectorAll('#myProps input:checked').forEach(cb => myProps.push(parseInt(cb.value)));
        const theirProps = [];
        document.querySelectorAll('#theirProps input:checked').forEach(cb => theirProps.push(parseInt(cb.value)));

        const result = this.trade.executeTrade({
            from: player.id,
            to: target.id,
            offer: { cash: myCash, properties: myProps },
            request: { cash: theirCash, properties: theirProps }
        }, this.players);

        if (result.valid) {
            Sound.buy();
            this.ui.showMessage('交易成功！');
        } else {
            this.ui.showMessage(result.reason || '交易失败');
        }

        this._closeTradePanel();
        this._updateUI();
    }

    _closeTradePanel() {
        document.getElementById('tradePanel').style.display = 'none';
    }

    // --- 格子点击 ---
    _onSquareClick(sqId) {
        const sq = SQUARES[sqId];
        if (!sq) return;

        // 显示地产卡信息
        if (sq.type === 'property' || sq.type === 'railroad' || sq.type === 'utility') {
            const owner = this.board.findOwner(sqId, this.players);
            const info = document.getElementById('squareInfo');
            let html = `<strong>${sq.name}</strong><br>`;
            if (sq.price) html += `价格: $${sq.price}<br>`;
            if (owner) html += `所有者: ${owner.name}<br>`;
            if (sq.type === 'property' && sq.rent) {
                html += `基本租金: $${sq.rent[0]}<br>`;
                const houses = owner ? owner.getHousesOn(sqId) : 0;
                html += `当前建筑: ${houses === 5 ? '酒店' : houses + '栋房'}`;
            }
            info.innerHTML = html;
            info.style.display = 'block';
            setTimeout(() => info.style.display = 'none', 3000);
        }
    }

    // --- UI 更新 ---
    _updateUI() {
        const player = this._getCurrentPlayer();

        // 玩家信息
        let playerInfoHTML = '';
        for (const p of this.players) {
            const style = p.id === player.id ? 'style="color:' + p.color + ';font-weight:bold"' : '';
            const status = p.bankrupt ? ' [破产]' : (p.inJail ? ' [监狱]' : '');
            playerInfoHTML += `<div class="player-item" ${style}>
                <span class="player-dot" style="background:${p.color}"></span>
                ${p.name}: $${p.money}${status}
            </div>`;
        }
        document.getElementById('playerInfo').innerHTML = playerInfoHTML;

        // 按钮状态
        const isHuman = !player.isAI;
        const isIdle = this.turnPhase === 'idle';
        const isEnd = this.turnPhase === 'endTurn';
        const isBuilding = this.turnPhase === 'building';

        document.getElementById('btnRoll').style.display = (isHuman && isIdle) ? 'inline-block' : 'none';
        document.getElementById('btnBuild').style.display = (isHuman && (isIdle || isBuilding || isEnd)) ? 'inline-block' : 'none';
        document.getElementById('btnTrade').style.display = (isHuman && (isIdle || isBuilding || isEnd)) ? 'inline-block' : 'none';
        document.getElementById('btnEndTurn').style.display = (isHuman && (isEnd || isBuilding)) ? 'inline-block' : 'none';

        // 监狱选项
        const jailPanel = document.getElementById('jailPanel');
        if (player.inJail && isHuman && this.turnPhase === 'action') {
            jailPanel.style.display = 'block';
            document.getElementById('btnJailCard').style.display = player.getOutOfJailCards > 0 ? 'inline-block' : 'none';
        } else {
            jailPanel.style.display = 'none';
        }

        // 当前玩家指示
        document.getElementById('turnInfo').textContent = `${player.name} 的回合`;
        document.getElementById('turnInfo').style.color = player.color;
    }

    _updateTurnInfo() {
        const player = this._getCurrentPlayer();
        document.getElementById('turnInfo').textContent = `${player.name} 的回合`;
        document.getElementById('turnInfo').style.color = player.color;
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new MonopolyGame();
});
