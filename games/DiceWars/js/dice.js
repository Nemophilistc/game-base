// dice.js - Dice rolling and battle resolution

/**
 * Roll N dice, return sorted array (descending)
 */
export function rollDice(count) {
    const results = [];
    for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * 6) + 1);
    }
    return results.sort((a, b) => b - a);
}

/**
 * Resolve a battle between attacker and defender
 * Rules: compare dice pairs highest to lowest, attacker wins ties
 * Returns detailed battle result
 */
export function resolveBattle(attackerCount, defenderCount) {
    const attDice = rollDice(attackerCount);
    const defDice = rollDice(defenderCount);

    const pairs = Math.min(attackerCount, defenderCount);
    let attWins = 0;
    let defWins = 0;
    const comparisons = [];

    for (let i = 0; i < pairs; i++) {
        const attDie = attDice[i];
        const defDie = defDice[i];
        const attWin = attDie >= defDie; // attacker wins ties
        if (attWin) attWins++;
        else defWins++;
        comparisons.push({ attDie, defDie, attWin });
    }

    const attackerWins = attWins > defWins;

    return {
        attackerDice: attDice,
        defenderDice: defDice,
        comparisons,
        attWins,
        defWins,
        attackerWins,
        // Attacker loses dice equal to defender's round wins
        // Defender loses all dice if attacker wins
        attSurvivors: attackerWins ? attackerCount - defWins : 0,
    };
}
