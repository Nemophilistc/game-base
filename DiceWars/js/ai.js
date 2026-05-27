// ai.js - AI opponent strategy

import { MAX_DICE } from './config.js';

export class AI {
    constructor(playerId) {
        this.playerId = playerId;
    }

    /**
     * Distribute bonus dice among owned territories
     * Strategy: favor territories with good attack options
     */
    distributeDice(territories, bonusDice) {
        const myTerritories = territories.filter(t => t.owner === this.playerId);
        let remaining = bonusDice;
        const distribution = new Map();

        // Score each territory for dice placement
        const scored = myTerritories.map(t => ({
            territory: t,
            score: this.scoreForDicePlacement(t, territories)
        }));
        scored.sort((a, b) => b.score - a.score);

        // Distribute dice greedily, cycling through scored list
        let attempts = 0;
        while (remaining > 0 && attempts < 100) {
            for (const { territory } of scored) {
                if (remaining <= 0) break;
                const current = territory.dice + (distribution.get(territory.id) || 0);
                if (current < MAX_DICE) {
                    distribution.set(territory.id, (distribution.get(territory.id) || 0) + 1);
                    remaining--;
                }
            }
            attempts++;
        }

        // If still remaining, dump on any territory with space
        for (const t of myTerritories) {
            while (remaining > 0 && t.dice + (distribution.get(t.id) || 0) < MAX_DICE) {
                distribution.set(t.id, (distribution.get(t.id) || 0) + 1);
                remaining--;
            }
        }

        return distribution;
    }

    /**
     * Score a territory for receiving more dice
     */
    scoreForDicePlacement(territory, allTerritories) {
        let score = 0;
        let hasWeakNeighbor = false;

        for (const neighborId of territory.neighbors) {
            const neighbor = allTerritories[neighborId];
            if (neighbor.owner !== this.playerId) {
                const advantage = territory.dice - neighbor.dice;
                if (advantage >= -1) {
                    hasWeakNeighbor = true;
                    score += 5 + advantage;
                }
            }
        }

        // Prefer territories that already have more dice (concentrate force)
        score += territory.dice * 2;

        // Prefer territories adjacent to enemies
        if (!hasWeakNeighbor) score -= 10;

        // Slight preference for territories with more neighbors (strategic value)
        score += territory.neighbors.size;

        return score;
    }

    /**
     * Choose the best attack to make
     * Returns { source, target } or null if no good attack
     */
    chooseAttack(territories) {
        const myTerritories = territories.filter(t => t.owner === this.playerId && t.dice > 1);

        let bestAttack = null;
        let bestScore = -Infinity;

        for (const source of myTerritories) {
            for (const neighborId of source.neighbors) {
                const target = territories[neighborId];
                if (target.owner === this.playerId) continue;

                const score = this.evaluateAttack(source, target, territories);
                if (score > bestScore) {
                    bestScore = score;
                    bestAttack = { source: source.id, target: target.id };
                }
            }
        }

        // Only attack if score is positive (worth the risk)
        return bestScore > 0 ? bestAttack : null;
    }

    /**
     * Evaluate the value of a specific attack
     */
    evaluateAttack(source, target, territories) {
        const attDice = source.dice - 1; // 1 die stays behind
        const defDice = target.dice;
        const advantage = attDice - defDice;

        // Don't attack with fewer dice than defender
        if (advantage < 0) return -1000;
        // Don't attack if source only has 1 die
        if (source.dice <= 1) return -1000;

        // Base score from dice advantage
        let score = 0;

        // Probability-based scoring
        if (advantage >= 4) score += 50;
        else if (advantage >= 3) score += 35;
        else if (advantage >= 2) score += 20;
        else if (advantage >= 1) score += 8;
        else score -= 15; // Equal dice = risky

        // Bonus for gaining territory
        score += 10;

        // Bonus for breaking enemy connections
        const enemyNeighbors = [...target.neighbors].filter(n =>
            territories[n].owner === target.owner
        ).length;
        if (enemyNeighbors >= 2) score += 8;

        // Bonus if capturing connects our territories
        const myNeighborsOfTarget = [...target.neighbors].filter(n =>
            territories[n].owner === this.playerId
        ).length;
        score += myNeighborsOfTarget * 3;

        // Penalty for leaving source weak after attack
        if (attDice <= 3 && advantage <= 1) score -= 10;

        // Prefer attacking territories with fewer dice (easier wins)
        score += (8 - defDice) * 2;

        // Endgame aggression: if we have many territories, be more aggressive
        const myCount = territories.filter(t => t.owner === this.playerId).length;
        if (myCount > territories.length * 0.5) score += 15;

        return score;
    }
}
