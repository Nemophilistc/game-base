// combat.js - Battle system, damage calculation, card effects
import { CARD_TYPE, GAME_CONFIG } from './config.js';

// Apply damage to a creature, returns true if it dies
export function damageCreature(creature, amount) {
  creature.currentHp -= amount;
  return creature.currentHp <= 0;
}

// Apply damage to player face
export function damageFace(player, amount) {
  player.hp = Math.max(0, player.hp - amount);
  return player.hp <= 0;
}

// Heal player
export function healPlayer(player, amount) {
  player.hp = Math.min(GAME_CONFIG.STARTING_HP + 10, player.hp + amount);
}

// Buff a creature
export function buffCreature(creature, atk, hp) {
  creature.currentAtk += atk;
  creature.currentHp += hp;
  creature.buffAtk += atk;
  creature.buffHp += hp;
}

// Execute creature attack - attacker hits target creature or face
export function executeCreatureAttack(attacker, target, defendingField, defendingPlayer) {
  const result = {
    attackerUid: attacker.uid,
    targetUid: null,
    attackerDied: false,
    targetDied: false,
    faceDamage: 0,
    attackerDmg: 0,
    targetDmg: 0,
  };

  if (target === null) {
    // Attack face
    result.faceDamage = attacker.currentAtk;
    result.targetDmg = attacker.currentAtk;
    const dead = damageFace(defendingPlayer, attacker.currentAtk);
    attacker.hasAttacked = true;
    attacker.canAttack = false;
    return result;
  }

  // Attack creature - both take damage
  result.targetUid = target.uid;
  result.attackerDmg = target.currentAtk;
  result.targetDmg = attacker.currentAtk;

  result.targetDied = damageCreature(target, attacker.currentAtk);
  result.attackerDied = damageCreature(attacker, target.currentAtk);

  attacker.hasAttacked = true;
  attacker.canAttack = false;

  return result;
}

// Play a spell card
export function playSpell(card, target, opponentField, opponent, player) {
  const result = {
    cardUid: card.uid,
    type: 'spell',
    damage: 0,
    targets: [],
    faceDamage: 0,
    kills: [],
  };

  if (card.target === 'single' && card.damage) {
    // Single target damage spell
    if (target === null) {
      // Hit face
      result.faceDamage = card.damage;
      damageFace(opponent, card.damage);
    } else {
      result.damage = card.damage;
      const died = damageCreature(target, card.damage);
      result.targets.push(target.uid);
      if (died) result.kills.push(target.uid);
    }
  } else if (card.target === 'all' && card.damage) {
    // AOE damage
    result.damage = card.damage;
    for (const creature of [...opponentField]) {
      const died = damageCreature(creature, card.damage);
      result.targets.push(creature.uid);
      if (died) result.kills.push(creature.uid);
    }
  } else if (card.target === 'friendly' && target) {
    // Buff friendly creature
    if (card.buffAtk) {
      buffCreature(target, card.buffAtk, 0);
      result.damage = card.buffAtk;
    }
    if (card.buffHp) {
      buffCreature(target, 0, card.buffHp);
      result.damage = card.buffHp;
    }
    result.targets.push(target.uid);
  }

  return result;
}

// Play a heal card
export function playHeal(card, player) {
  const oldHp = player.hp;
  healPlayer(player, card.healAmount);
  return {
    cardUid: card.uid,
    type: 'heal',
    healAmount: player.hp - oldHp,
  };
}

// Remove dead creatures from field, returns removed creatures
export function removeDeadCreatures(field) {
  const dead = field.filter(c => c.currentHp <= 0);
  const alive = field.filter(c => c.currentHp > 0);
  field.length = 0;
  field.push(...alive);
  return dead;
}

// Prepare creatures for attack phase - mark those that can attack
export function prepareAttackPhase(field) {
  for (const creature of field) {
    if (!creature.hasAttacked) {
      creature.canAttack = true;
    }
  }
}

// Reset creatures for new turn
export function resetCreaturesForTurn(field) {
  for (const creature of field) {
    creature.canAttack = true;
    creature.hasAttacked = false;
  }
}

// Calculate total damage on field
export function totalFieldDamage(field) {
  return field.reduce((sum, c) => sum + c.currentAtk, 0);
}

// Evaluate board state (positive = player advantage)
export function evaluateBoard(playerField, aiField, playerHp, aiHp) {
  let score = 0;
  // HP advantage
  score += (playerHp - aiHp) * 1.5;
  // Field advantage
  for (const c of playerField) {
    score += c.currentAtk + c.currentHp * 0.8;
  }
  for (const c of aiField) {
    score -= c.currentAtk + c.currentHp * 0.8;
  }
  return score;
}
