// main.js - Game controller

import {
    HEX_SIZE, GRID_COLS, GRID_ROWS, NUM_TERRITORIES,
    MAX_DICE, FIRST_TURN_BONUS, INITIAL_TERRITORY_DICE,
    PLAYER_DEFS, PHASE, SQRT3
} from './config.js';
import { SoundManager } from './sound.js';
import { rollDice, resolveBattle } from './dice.js';
import { generateMap, pixelToCell, getConnectedComponents, getBonusDice, renderMap, hexToPixel } from './map.js';
import { AI } from './ai.js';
import { EffectsManager } from './effects.js';
import { UIManager } from './ui.js';

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mapData = null;
        this.players = [];
        this.ais = [];
        this.currentPlayerIdx = 0;
        this.phase = PHASE.MENU;
        this.selectedTerritoryId = null;
        this.hoveredTerritoryId = null;
        this.validTargets = [];
        this.bonusDice = 0;
        this.effects = new EffectsManager();
        this.sound = new SoundManager();
        this.ui = new UIManager();
        this.hexSize = HEX_SIZE;
        this.offsetX = 0;
        this.offsetY = 0;
        this.animating = false;
        this.attackChain = false; // Can chain attacks after conquering
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui.init();
        this.resize();

        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.deselect();
        });

        document.getElementById('btn-end-turn').addEventListener('click', () => this.endTurn());
        document.getElementById('btn-help').addEventListener('click', () => this.ui.toggleHelp());

        // Player count buttons
        document.getElementById('btn-2p').addEventListener('click', () => this.startGame(2));
        document.getElementById('btn-3p').addEventListener('click', () => this.startGame(3));
        document.getElementById('btn-4p').addEventListener('click', () => this.startGame(4));
        document.getElementById('btn-rules').addEventListener('click', () => document.getElementById('help-box').classList.toggle('visible'));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.deselect();
            if (e.key === 'Enter' || e.key === ' ') {
                if (this.phase === PHASE.SELECT_SOURCE || this.phase === PHASE.SELECT_TARGET) {
                    this.endTurn();
                }
            }
        });

        this.sound.init();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.recalculateLayout();
        this.render();
    }

    recalculateLayout() {
        if (!this.mapData) return;

        // Calculate hex size to fit the map on screen
        const maxW = this.canvas.width * 0.88;
        const maxH = (this.canvas.height - 80) * 0.88;
        const mapNatW = GRID_COLS * HEX_SIZE * SQRT3;
        const mapNatH = GRID_ROWS * HEX_SIZE * 1.5 + HEX_SIZE;

        this.hexSize = Math.min(HEX_SIZE, maxW / (mapNatW / HEX_SIZE), maxH / (mapNatH / HEX_SIZE));
        this.hexSize = Math.max(18, this.hexSize);

        const actualW = GRID_COLS * this.hexSize * SQRT3;
        const actualH = GRID_ROWS * this.hexSize * 1.5 + this.hexSize * 0.5;
        this.offsetX = (this.canvas.width - actualW) / 2;
        this.offsetY = (this.canvas.height - actualH) / 2 + 20;

        // Recompute cell positions for the new hex size
        this.recomputeCellPositions();
    }

    recomputeCellPositions() {
        if (!this.mapData) return;
        for (const cell of this.mapData.cells) {
            const pos = hexToPixel(cell.col, cell.row, this.hexSize);
            cell.x = pos.x;
            cell.y = pos.y;
        }
        for (const t of this.mapData.territories) {
            if (t.cells.length > 0) {
                t.cx = t.cells.reduce((s, c) => s + c.x, 0) / t.cells.length;
                t.cy = t.cells.reduce((s, c) => s + c.y, 0) / t.cells.length;
            }
        }
    }

    startGame(numPlayers) {
        this.sound.ensureContext();
        this.sound.click();

        // Generate map
        this.mapData = generateMap(GRID_COLS, GRID_ROWS, HEX_SIZE, NUM_TERRITORIES);

        // Create players
        this.players = [];
        this.ais = [];
        for (let i = 0; i < numPlayers; i++) {
            this.players.push({
                id: i,
                ...PLAYER_DEFS[i],
                eliminated: false,
            });
            if (!PLAYER_DEFS[i].isHuman) {
                this.ais.push(new AI(i));
            }
        }

        // Assign territories to players based on angular order of seeds
        const { territories } = this.mapData;
        const seedsPerPlayer = Math.ceil(NUM_TERRITORIES / numPlayers);
        territories.forEach((t, i) => {
            const playerIdx = Math.min(Math.floor(i / seedsPerPlayer), numPlayers - 1);
            t.owner = playerIdx;
            t.dice = INITIAL_TERRITORY_DICE;
        });

        this.currentPlayerIdx = 0;
        this.phase = PHASE.DISTRIBUTE;
        this.bonusDice = FIRST_TURN_BONUS;
        this.selectedTerritoryId = null;
        this.hoveredTerritoryId = null;
        this.validTargets = [];
        this.attackChain = false;

        this.recalculateLayout();
        this.ui.hideOverlay('start-overlay');
        this.sound.turnStart();
        this.updateState();

        // If first player is AI, start AI turn
        if (!this.players[0].isHuman) {
            this.startAITurn();
        }
    }

    /**
     * Get local pixel position from mouse event
     */
    getLocalPos(e) {
        return {
            x: e.clientX - this.offsetX,
            y: e.clientY - this.offsetY
        };
    }

    handleClick(e) {
        if (this.animating) return;
        if (!this.mapData) return;

        const currentPlayer = this.players[this.currentPlayerIdx];
        if (!currentPlayer || currentPlayer.eliminated) return;
        if (!currentPlayer.isHuman) return;

        const pos = this.getLocalPos(e);
        const cell = pixelToCell(pos.x, pos.y, this.mapData.cellMap, this.hexSize);
        if (!cell) return;

        const territory = this.mapData.territories[cell.territoryId];

        switch (this.phase) {
            case PHASE.DISTRIBUTE:
                this.handleDistribute(territory);
                break;
            case PHASE.SELECT_SOURCE:
                this.handleSelectSource(territory);
                break;
            case PHASE.SELECT_TARGET:
                this.handleSelectTarget(territory);
                break;
        }
    }

    handleDistribute(territory) {
        if (territory.owner !== this.currentPlayerIdx) return;
        if (territory.dice >= MAX_DICE) {
            this.sound.error();
            return;
        }
        if (this.bonusDice <= 0) return;

        territory.dice++;
        this.bonusDice--;
        this.sound.click();

        // Auto-advance to attack phase when all dice distributed
        if (this.bonusDice <= 0) {
            this.phase = PHASE.SELECT_SOURCE;
            this.effects.addFloatingText(territory.cx, territory.cy, '+1', '#fff');
        }

        this.updateState();
    }

    handleSelectSource(territory) {
        if (territory.owner !== this.currentPlayerIdx) return;
        if (territory.dice <= 1) {
            this.sound.error();
            return;
        }

        // Check if this territory has any valid attack targets
        const targets = this.getValidTargets(territory.id);
        if (targets.length === 0) {
            this.sound.error();
            return;
        }

        this.selectedTerritoryId = territory.id;
        this.validTargets = targets;
        this.phase = PHASE.SELECT_TARGET;
        this.sound.click();

        // Set up arrow preview
        const target = this.mapData.territories[targets[0]];
        this.effects.setArrow(territory.cx, territory.cy, target.cx, target.cy, '#ff6b6b');

        this.updateState();
    }

    handleSelectTarget(territory) {
        // Clicking on own territory reselects source
        if (territory.owner === this.currentPlayerIdx) {
            this.handleSelectSource(territory);
            return;
        }

        if (!this.validTargets.includes(territory.id)) {
            this.sound.error();
            return;
        }

        this.executeAttack(this.selectedTerritoryId, territory.id);
    }

    getValidTargets(territoryId) {
        const territory = this.mapData.territories[territoryId];
        return [...territory.neighbors].filter(nId => {
            const n = this.mapData.territories[nId];
            return n.owner !== this.currentPlayerIdx;
        });
    }

    executeAttack(sourceId, targetId) {
        const source = this.mapData.territories[sourceId];
        const target = this.mapData.territories[targetId];
        const attackerPlayer = this.players[source.owner];
        const defenderPlayer = this.players[target.owner];

        this.phase = PHASE.ANIMATING;
        this.animating = true;
        this.effects.clearArrow();
        this.updateState();

        // Resolve battle
        const result = resolveBattle(source.dice - 1, target.dice); // -1 because 1 stays behind
        const attDiceRolled = source.dice - 1;

        this.sound.diceRoll();

        // Show battle popup with animation
        this.ui.showBattle(attackerPlayer, defenderPlayer, result.attackerDice, result.defenderDice, result, () => {
            // After animation completes
            if (result.attackerWins) {
                // Attacker conquers territory
                const oldOwner = target.owner;
                target.owner = source.owner;
                source.dice = 1; // Leave 1 die behind
                target.dice = result.attSurvivors; // Move survivors in

                this.sound.capture();
                this.effects.addCaptureEffect(target.cx, target.cy, attackerPlayer.color);
                this.effects.addFloatingText(target.cx, target.cy - 20, '占领!', attackerPlayer.lightColor);

                // Check if old owner is eliminated
                const oldOwnerTerritories = this.mapData.territories.filter(t => t.owner === oldOwner);
                if (oldOwnerTerritories.length === 0) {
                    this.players[oldOwner].eliminated = true;
                    this.sound.eliminate();
                    this.effects.addFloatingText(
                        this.canvas.width / 2 - this.offsetX,
                        this.canvas.height / 2 - this.offsetY,
                        `${defenderPlayer.name} 被淘汰!`,
                        '#ff4444'
                    );
                }

                // Check win condition
                const alivePlayers = this.players.filter(p => !p.eliminated);
                if (alivePlayers.length === 1) {
                    this.animating = false;
                    this.gameOver(alivePlayers[0]);
                    return;
                }

                // Chain attack: can continue from newly conquered territory or any owned territory
                this.attackChain = true;
                this.selectedTerritoryId = null;
                this.validTargets = [];
                this.phase = PHASE.SELECT_SOURCE;
                this.sound.battleWin();
            } else {
                // Defender wins - attacker loses dice
                source.dice = 1; // Attacker reduced to 1
                this.sound.battleLose();
                this.effects.addFloatingText(source.cx, source.cy, '失败!', '#ff4444');

                this.selectedTerritoryId = null;
                this.validTargets = [];
                this.phase = PHASE.SELECT_SOURCE;
            }

            this.animating = false;
            this.updateState();
        });
    }

    endTurn() {
        if (this.animating) return;
        this.sound.click();

        this.selectedTerritoryId = null;
        this.validTargets = [];
        this.effects.clearArrow();
        this.attackChain = false;

        // Move to next alive player
        this.nextPlayer();
    }

    nextPlayer() {
        let attempts = 0;
        do {
            this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
            attempts++;
        } while (this.players[this.currentPlayerIdx].eliminated && attempts < this.players.length);

        // Calculate bonus dice for new current player
        this.bonusDice = getBonusDice(this.currentPlayerIdx, this.mapData.territories);

        // If player gets 0 bonus (shouldn't happen if they have territories), give minimum
        if (this.bonusDice === 0 && this.mapData.territories.some(t => t.owner === this.currentPlayerIdx)) {
            this.bonusDice = 2;
        }

        this.phase = PHASE.DISTRIBUTE;
        this.sound.turnStart();

        const currentPlayer = this.players[this.currentPlayerIdx];

        // Auto-skip distribute if no bonus dice or only 1 territory with max dice
        if (this.bonusDice <= 0 || this.allTerritoriesMaxDice()) {
            this.phase = PHASE.SELECT_SOURCE;
        }

        this.updateState();

        // If AI turn, start AI logic
        if (!currentPlayer.isHuman) {
            this.startAITurn();
        }
    }

    allTerritoriesMaxDice() {
        const myTerritories = this.mapData.territories.filter(t => t.owner === this.currentPlayerIdx);
        return myTerritories.every(t => t.dice >= MAX_DICE);
    }

    /**
     * Execute AI turn with delays for visual feedback
     */
    startAITurn() {
        this.phase = PHASE.AI_TURN;
        this.updateState();

        const ai = this.ais.find(a => a.playerId === this.currentPlayerIdx);
        if (!ai) {
            this.endTurn();
            return;
        }

        // Phase 1: Distribute dice
        setTimeout(() => {
            const dist = ai.distributeDice(this.mapData.territories, this.bonusDice);
            for (const [tId, count] of dist) {
                this.mapData.territories[tId].dice += count;
            }
            this.bonusDice = 0;
            this.updateState();

            // Phase 2: Make attacks
            this.aiAttackSequence(ai, 0);
        }, 600);
    }

    aiAttackSequence(ai, attackCount) {
        // Stop if game is over
        if (this.phase === PHASE.GAME_OVER) return;
        // Limit consecutive attacks to prevent infinite loops
        if (attackCount >= 8) {
            this.endTurn();
            return;
        }

        const attack = ai.chooseAttack(this.mapData.territories);
        if (!attack) {
            // No good attacks, end turn
            setTimeout(() => this.endTurn(), 400);
            return;
        }

        const source = this.mapData.territories[attack.source];
        const target = this.mapData.territories[attack.target];

        // Show arrow briefly
        this.effects.setArrow(source.cx, source.cy, target.cx, target.cy,
            this.players[ai.playerId].lightColor);
        this.selectedTerritoryId = attack.source;
        this.updateState();

        // Execute attack after brief delay
        setTimeout(() => {
            this.selectedTerritoryId = null;
            this.executeAIAttack(ai.playerId, attack.source, attack.target, attackCount);
        }, 700);
    }

    executeAIAttack(playerId, sourceId, targetId, attackCount) {
        const source = this.mapData.territories[sourceId];
        const target = this.mapData.territories[targetId];
        const attackerPlayer = this.players[source.owner];
        const defenderPlayer = this.players[target.owner];

        this.phase = PHASE.ANIMATING;
        this.animating = true;
        this.effects.clearArrow();

        const result = resolveBattle(source.dice - 1, target.dice);

        this.sound.diceRoll();

        this.ui.showBattle(attackerPlayer, defenderPlayer, result.attackerDice, result.defenderDice, result, () => {
            if (result.attackerWins) {
                const oldOwner = target.owner;
                target.owner = source.owner;
                source.dice = 1;
                target.dice = result.attSurvivors;

                this.sound.capture();
                this.effects.addCaptureEffect(target.cx, target.cy, attackerPlayer.color);

                // Check elimination
                if (!this.mapData.territories.some(t => t.owner === oldOwner)) {
                    this.players[oldOwner].eliminated = true;
                    this.sound.eliminate();
                }

                // Check win
                const alive = this.players.filter(p => !p.eliminated);
                if (alive.length === 1) {
                    this.animating = false;
                    this.gameOver(alive[0]);
                    return;
                }

                this.animating = false;
                this.updateState();

                // Continue AI attacks
                setTimeout(() => this.aiAttackSequence(this.ais.find(a => a.playerId === playerId), attackCount + 1), 500);
            } else {
                source.dice = 1;
                this.sound.battleLose();
                this.animating = false;
                this.updateState();

                // Continue AI attacks from other territories
                setTimeout(() => this.aiAttackSequence(this.ais.find(a => a.playerId === playerId), attackCount + 1), 500);
            }
        });
    }

    gameOver(winner) {
        this.phase = PHASE.GAME_OVER;
        this.sound.gameWin();
        this.ui.showGameOver(winner, this.players, this.mapData.territories);
        this.updateState();
    }

    deselect() {
        if (this.phase === PHASE.SELECT_TARGET) {
            this.selectedTerritoryId = null;
            this.validTargets = [];
            this.effects.clearArrow();
            this.phase = PHASE.SELECT_SOURCE;
            this.updateState();
        }
    }

    handleMouseMove(e) {
        if (!this.mapData || this.animating) return;

        const pos = this.getLocalPos(e);
        const cell = pixelToCell(pos.x, pos.y, this.mapData.cellMap, this.hexSize);
        const newHovered = cell ? cell.territoryId : null;

        if (newHovered !== this.hoveredTerritoryId) {
            this.hoveredTerritoryId = newHovered;

            // Update arrow if selecting target
            if (this.phase === PHASE.SELECT_TARGET && this.selectedTerritoryId !== null) {
                if (newHovered !== null && this.validTargets.includes(newHovered)) {
                    const source = this.mapData.territories[this.selectedTerritoryId];
                    const target = this.mapData.territories[newHovered];
                    this.effects.setArrow(source.cx, source.cy, target.cx, target.cy, '#ff6b6b');
                }
            }

            this.render();
        }
    }

    updateState() {
        this.ui.updateHUD({
            players: this.players,
            currentPlayerIdx: this.currentPlayerIdx,
            phase: this.phase,
            bonusDice: this.bonusDice,
            territories: this.mapData ? this.mapData.territories : [],
        });
        this.render();
    }

    /**
     * Main render function
     */
    render() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (!this.mapData) return;

        // Render map
        renderMap(ctx, this.mapData, this.offsetX, this.offsetY, {
            hexSize: this.hexSize,
            selectedTerritoryId: this.selectedTerritoryId,
            hoveredTerritoryId: this.hoveredTerritoryId,
            validTargets: this.validTargets,
            players: this.players,
        });

        // Render effects
        this.effects.render(ctx, this.offsetX, this.offsetY);
    }

    /**
     * Main game loop
     */
    gameLoop() {
        this.effects.update();

        // Re-render if effects are active
        if (this.effects.hasActiveAnimations()) {
            this.render();
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game
const game = new Game();

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { game.init(); });
} else {
    game.init();
}

// Expose startGame globally for HTML buttons
window.startGame = (numPlayers) => game.startGame(numPlayers);
