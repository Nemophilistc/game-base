// ui.js - UI overlay management and HUD

import { DOT_LAYOUTS, PHASE } from './config.js';

export class UIManager {
    constructor() {
        this.elements = {};
    }

    /**
     * Cache DOM element references
     */
    init() {
        this.elements = {
            startOverlay: document.getElementById('start-overlay'),
            battleOverlay: document.getElementById('battle-overlay'),
            gameoverOverlay: document.getElementById('gameover-overlay'),
            hud: document.getElementById('hud'),
            turnIndicator: document.getElementById('turn-indicator'),
            phaseText: document.getElementById('phase-text'),
            dicePool: document.getElementById('dice-pool'),
            playerStats: document.getElementById('player-stats'),
            btnEndTurn: document.getElementById('btn-end-turn'),
            btnHelp: document.getElementById('btn-help'),
            helpBox: document.getElementById('help-box'),
            battleAttacker: document.getElementById('battle-attacker'),
            battleDefender: document.getElementById('battle-defender'),
            battleResult: document.getElementById('battle-result'),
            winnerText: document.getElementById('winner-text'),
            gameOverStats: document.getElementById('gameover-stats'),
        };
    }

    /**
     * Show an overlay
     */
    showOverlay(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
            el.classList.add('visible');
        }
    }

    /**
     * Hide an overlay
     */
    hideOverlay(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.classList.remove('visible');
        }
    }

    /**
     * Update the HUD with current game state
     */
    updateHUD(gameState) {
        const { players, currentPlayerIdx, phase, bonusDice, territories } = gameState;
        const currentPlayer = players[currentPlayerIdx];

        // Turn indicator
        if (this.elements.turnIndicator) {
            this.elements.turnIndicator.innerHTML = `
                <span class="player-dot" style="background:${currentPlayer.color}"></span>
                <span>${currentPlayer.name}的回合</span>
            `;
        }

        // Phase text
        if (this.elements.phaseText) {
            const phaseTexts = {
                [PHASE.DISTRIBUTE]: '分配骰子 (点击己方领地)',
                [PHASE.SELECT_SOURCE]: '选择进攻出发地',
                [PHASE.SELECT_TARGET]: '选择攻击目标',
                [PHASE.AI_TURN]: `${currentPlayer.name} 思考中...`,
                [PHASE.ANIMATING]: '战斗中...',
            };
            this.elements.phaseText.textContent = phaseTexts[phase] || '';
        }

        // Dice pool
        if (this.elements.dicePool) {
            if (phase === PHASE.DISTRIBUTE && bonusDice > 0) {
                this.elements.dicePool.innerHTML = `
                    <span class="dice-pool-label">待分配:</span>
                    <span class="dice-pool-count">${bonusDice}</span>
                `;
                this.elements.dicePool.classList.remove('hidden');
            } else {
                this.elements.dicePool.classList.add('hidden');
            }
        }

        // Player stats
        if (this.elements.playerStats) {
            let statsHTML = '';
            for (const player of players) {
                const territoryCount = territories.filter(t => t.owner === player.id).length;
                const totalDice = territories.filter(t => t.owner === player.id).reduce((s, t) => s + t.dice, 0);
                const isActive = player.id === currentPlayerIdx;
                const isEliminated = territoryCount === 0;
                statsHTML += `
                    <div class="stat-item ${isActive ? 'active' : ''} ${isEliminated ? 'eliminated' : ''}">
                        <span class="player-dot" style="background:${player.color}"></span>
                        <span class="stat-name">${player.name}</span>
                        <span class="stat-detail">${territoryCount}地 ${totalDice}骰</span>
                    </div>
                `;
            }
            this.elements.playerStats.innerHTML = statsHTML;
        }

        // End turn button visibility
        if (this.elements.btnEndTurn) {
            const isHumanTurn = currentPlayer.isHuman;
            const canEndTurn = isHumanTurn && (phase === PHASE.SELECT_SOURCE || phase === PHASE.SELECT_TARGET || phase === PHASE.DISTRIBUTE);
            this.elements.btnEndTurn.style.display = canEndTurn ? 'block' : 'none';
        }
    }

    /**
     * Show battle animation popup
     */
    showBattle(attackerPlayer, defenderPlayer, attackerDice, defenderDice, result, callback) {
        this.showOverlay('battle-overlay');

        // Build attacker dice
        if (this.elements.battleAttacker) {
            this.elements.battleAttacker.innerHTML = `
                <div class="battle-player-name" style="color:${attackerPlayer.lightColor}">${attackerPlayer.name}</div>
                <div class="battle-subtitle">进攻方</div>
                <div class="dice-row" id="att-dice-row"></div>
            `;
        }

        // Build defender dice
        if (this.elements.battleDefender) {
            this.elements.battleDefender.innerHTML = `
                <div class="battle-player-name" style="color:${defenderPlayer.lightColor}">${defenderPlayer.name}</div>
                <div class="battle-subtitle">防守方</div>
                <div class="dice-row" id="def-dice-row"></div>
            `;
        }

        if (this.elements.battleResult) {
            this.elements.battleResult.textContent = '';
        }

        const attRow = document.getElementById('att-dice-row');
        const defRow = document.getElementById('def-dice-row');

        // Create dice elements in rolling state
        const attDiceEls = [];
        const defDiceEls = [];

        for (let i = 0; i < attackerDice.length; i++) {
            const die = this.createDieElement(1, attackerPlayer.color);
            die.classList.add('rolling');
            attRow.appendChild(die);
            attDiceEls.push(die);
        }

        for (let i = 0; i < defenderDice.length; i++) {
            const die = this.createDieElement(1, defenderPlayer.color);
            die.classList.add('rolling');
            defRow.appendChild(die);
            defDiceEls.push(die);
        }

        // Rolling animation - cycle values rapidly
        const rollInterval = setInterval(() => {
            for (const die of attDiceEls) {
                if (die.classList.contains('rolling')) {
                    this.updateDieValue(die, Math.floor(Math.random() * 6) + 1);
                }
            }
            for (const die of defDiceEls) {
                if (die.classList.contains('rolling')) {
                    this.updateDieValue(die, Math.floor(Math.random() * 6) + 1);
                }
            }
        }, 60);

        // Stop dice one by one
        const allDice = [...attDiceEls, ...defDiceEls];
        const allValues = [...attackerDice, ...defenderDice];
        const stopDelay = 800;

        allDice.forEach((die, i) => {
            setTimeout(() => {
                die.classList.remove('rolling');
                die.classList.add('stopped');
                this.updateDieValue(die, allValues[i]);
            }, stopDelay + i * 120);
        });

        // Show result after all dice stopped
        const resultDelay = stopDelay + allDice.length * 120 + 400;
        setTimeout(() => {
            clearInterval(rollInterval);

            // Highlight winners/losers in each comparison pair
            const pairs = Math.min(attackerDice.length, defenderDice.length);
            for (let i = 0; i < pairs; i++) {
                if (attackerDice[i] >= defenderDice[i]) {
                    attDiceEls[i].classList.add('win');
                    defDiceEls[i].classList.add('lose');
                } else {
                    attDiceEls[i].classList.add('lose');
                    defDiceEls[i].classList.add('win');
                }
            }

            // Show result text
            if (this.elements.battleResult) {
                if (result.attackerWins) {
                    this.elements.battleResult.innerHTML = `<span style="color:${attackerPlayer.lightColor}">${attackerPlayer.name} 胜利! 占领领地!</span>`;
                } else {
                    this.elements.battleResult.innerHTML = `<span style="color:${defenderPlayer.lightColor}">${defenderPlayer.name} 防守成功!</span>`;
                }
            }
        }, resultDelay);

        // Auto-dismiss
        setTimeout(() => {
            this.hideOverlay('battle-overlay');
            if (callback) callback();
        }, resultDelay + 1800);
    }

    /**
     * Create a die HTML element with dots
     */
    createDieElement(value, borderColor) {
        const die = document.createElement('div');
        die.className = 'die';
        die.style.borderColor = borderColor || '#888';
        this.updateDieValue(die, value);
        return die;
    }

    /**
     * Update die element to show a specific value
     */
    updateDieValue(die, value) {
        // Clear existing dots
        die.innerHTML = '';
        const dots = DOT_LAYOUTS[value] || DOT_LAYOUTS[1];
        for (const [x, y] of dots) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.style.left = x + '%';
            dot.style.top = y + '%';
            die.appendChild(dot);
        }
    }

    /**
     * Show game over screen
     */
    showGameOver(winner, players, territories) {
        if (this.elements.winnerText) {
            this.elements.winnerText.textContent = `${winner.name} 获得最终胜利!`;
            this.elements.winnerText.style.color = winner.lightColor;
        }

        if (this.elements.gameOverStats) {
            let html = '';
            for (const player of players) {
                const count = territories.filter(t => t.owner === player.id).length;
                if (count > 0) {
                    html += `<div class="stat-item">
                        <span class="player-dot" style="background:${player.color}"></span>
                        <span>${player.name}: 占领 ${count} 块领地</span>
                    </div>`;
                }
            }
            this.elements.gameOverStats.innerHTML = html;
        }

        this.showOverlay('gameover-overlay');
    }

    /**
     * Toggle help box visibility
     */
    toggleHelp() {
        if (this.elements.helpBox) {
            this.elements.helpBox.classList.toggle('visible');
        }
    }
}
