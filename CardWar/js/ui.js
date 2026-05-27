// ui.js - UI rendering, card drawing, overlays
import { GAME_CONFIG, CARD_TYPE, RARITY_COLORS, ICON_SYMBOLS, ICON_BG_COLORS, RARITY } from './config.js';

const { CARD_WIDTH, CARD_HEIGHT, FIELD_CARD_WIDTH, FIELD_CARD_HEIGHT, CARD_RADIUS } = GAME_CONFIG;

// --- Card Rendering ---

function drawRoundedRect(ctx, x, y, w, h, r) {
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

// Draw a card at position
export function drawCard(ctx, card, x, y, opts = {}) {
  const w = opts.field ? FIELD_CARD_WIDTH : CARD_WIDTH;
  const h = opts.field ? FIELD_CARD_HEIGHT : CARD_HEIGHT;
  const hovered = opts.hovered || false;
  const playable = opts.playable || false;
  const selected = opts.selected || false;
  const canAttack = opts.canAttack || false;
  const faceDown = opts.faceDown || false;
  const scale = opts.scale || 1;
  const alpha = opts.alpha !== undefined ? opts.alpha : 1;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (scale !== 1) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  if (faceDown) {
    // Card back
    drawRoundedRect(ctx, x, y, w, h, CARD_RADIUS);
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#2a1a4a');
    grad.addColorStop(0.5, '#3d2a6a');
    grad.addColorStop(1, '#2a1a4a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#6a4aaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pattern on back
    ctx.strokeStyle = '#5a3a8a';
    ctx.lineWidth = 1;
    const cx = x + w / 2, cy = y + h / 2;
    for (let r = 10; r < Math.min(w, h) * 0.4; r += 8) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#8a6acc';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('?', cx, cy + 6);

    ctx.restore();
    return;
  }

  const rarityColor = RARITY_COLORS[card.rarity] || '#888';
  const isCreature = card.type === CARD_TYPE.CREATURE;

  // Glow for playable/selected/attackable
  if (selected || canAttack) {
    ctx.shadowColor = canAttack ? '#ffaa00' : '#44ff88';
    ctx.shadowBlur = 12;
  } else if (hovered) {
    ctx.shadowColor = '#8866ff';
    ctx.shadowBlur = 10;
  }

  // Card background
  drawRoundedRect(ctx, x, y, w, h, CARD_RADIUS);
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(1, '#16213e');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Border
  ctx.strokeStyle = rarityColor;
  ctx.lineWidth = selected ? 3 : 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Card art area
  const artY = y + 4;
  const artH = h * 0.4;
  const artX = x + 4;
  const artW = w - 8;

  drawRoundedRect(ctx, artX, artY, artW, artH, 4);
  const iconBg = ICON_BG_COLORS[card.icon] || '#333';
  const artGrad = ctx.createLinearGradient(artX, artY, artX, artY + artH);
  artGrad.addColorStop(0, iconBg);
  artGrad.addColorStop(1, adjustColor(iconBg, -30));
  ctx.fillStyle = artGrad;
  ctx.fill();

  // Icon symbol
  const iconSize = opts.field ? 20 : 26;
  ctx.font = `${iconSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  const icon = ICON_SYMBOLS[card.icon] || '?';
  ctx.fillText(icon, x + w / 2, artY + artH / 2 + iconSize / 3);

  // Mana cost (top-left)
  const costSize = opts.field ? 18 : 22;
  drawCircle(ctx, x + (opts.field ? 10 : 12), y + (opts.field ? 10 : 12), opts.field ? 10 : 12, '#1565C0', '#42A5F5');
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${costSize * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(card.cost, x + (opts.field ? 10 : 12), y + (opts.field ? 14 : 16));

  // Card name
  const nameY = artY + artH + (opts.field ? 12 : 16);
  ctx.fillStyle = '#e0e0ff';
  ctx.font = `bold ${opts.field ? 10 : 12}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(card.name, x + w / 2, nameY);

  // Description (for non-field cards)
  if (!opts.field && card.desc) {
    ctx.fillStyle = '#a0a0c0';
    ctx.font = '9px Arial';
    const descY = nameY + 14;
    // Word wrap
    const words = card.desc.split('');
    let line = '';
    let lineY = descY;
    for (const char of words) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > w - 16) {
        ctx.fillText(line, x + w / 2, lineY);
        line = char;
        lineY += 12;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x + w / 2, lineY);
  }

  // ATK/HP for creatures
  if (isCreature) {
    const statY = y + h - (opts.field ? 8 : 10);
    const statSize = opts.field ? 14 : 18;

    // ATK (bottom-left)
    drawCircle(ctx, x + (opts.field ? 12 : 15), statY, opts.field ? 10 : 13, '#c62828', '#ef5350');
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${statSize * 0.75}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(card.currentAtk, x + (opts.field ? 12 : 15), statY + 4);

    // HP (bottom-right)
    const hpColor = card.currentHp < card.hp ? '#c62828' : '#2E7D32';
    const hpBg = card.currentHp < card.hp ? '#ef5350' : '#66BB6A';
    drawCircle(ctx, x + w - (opts.field ? 12 : 15), statY, opts.field ? 10 : 13, hpColor, hpBg);
    ctx.fillStyle = '#fff';
    ctx.fillText(card.currentHp, x + w - (opts.field ? 12 : 15), statY + 4);
  } else {
    // For spells/heals, show type indicator
    const typeY = y + h - (opts.field ? 10 : 14);
    ctx.fillStyle = card.type === CARD_TYPE.HEAL ? '#44ff88' : '#ff6644';
    ctx.font = `bold ${opts.field ? 9 : 11}px Arial`;
    ctx.textAlign = 'center';
    const typeText = card.type === CARD_TYPE.HEAL ? `+${card.healAmount} HP` :
      card.damage ? (card.target === 'all' ? `${card.damage} 全体` : `${card.damage} 伤害`) :
        card.buffAtk ? `+${card.buffAtk} ATK` : `+${card.buffHp} HP`;
    ctx.fillText(typeText, x + w / 2, typeY);
  }

  // Rarity gem
  ctx.fillStyle = rarityColor;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCircle(ctx, x, y, r, strokeColor, fillColor) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

// --- Mana Crystal Rendering ---

export function drawManaBar(ctx, x, y, current, max) {
  const crystalSize = 12;
  const gap = 4;
  for (let i = 0; i < max; i++) {
    const cx = x + i * (crystalSize * 2 + gap);
    const filled = i < current;
    drawCrystal(ctx, cx, y, crystalSize, filled);
  }
}

function drawCrystal(ctx, x, y, size, filled) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.6, y - size * 0.2);
  ctx.lineTo(x + size * 0.4, y + size * 0.6);
  ctx.lineTo(x - size * 0.4, y + size * 0.6);
  ctx.lineTo(x - size * 0.6, y - size * 0.2);
  ctx.closePath();

  if (filled) {
    const grad = ctx.createLinearGradient(x, y - size, x, y + size);
    grad.addColorStop(0, '#64B5F6');
    grad.addColorStop(0.5, '#1E88E5');
    grad.addColorStop(1, '#0D47A1');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#90CAF9';
  } else {
    ctx.fillStyle = '#1a1a3a';
    ctx.fill();
    ctx.strokeStyle = '#3a3a5a';
  }
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// --- HP Bar ---

export function drawHpBar(ctx, x, y, w, hp, maxHp, label, isEnemy = false) {
  const barH = 24;
  const ratio = hp / maxHp;
  const barColor = ratio > 0.6 ? '#4CAF50' : ratio > 0.3 ? '#FF9800' : '#F44336';

  // Background
  drawRoundedRect(ctx, x, y, w, barH, 6);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Fill
  if (hp > 0) {
    drawRoundedRect(ctx, x + 2, y + 2, (w - 4) * ratio, barH - 4, 4);
    ctx.fillStyle = barColor;
    ctx.fill();
  }

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${label}  ${hp}/${maxHp}`, x + w / 2, y + barH / 2 + 5);
}

// --- Card Tooltip ---

export function drawTooltip(ctx, card, x, y) {
  if (!card) return;

  const tw = 200;
  const th = 120;
  // Keep on screen
  const tx = Math.min(x, ctx.canvas.width - tw - 10);
  const ty = Math.max(10, y - th - 10);

  ctx.save();
  ctx.globalAlpha = 0.95;

  drawRoundedRect(ctx, tx, ty, tw, th, 8);
  ctx.fillStyle = '#1a1a2eee';
  ctx.fill();
  ctx.strokeStyle = RARITY_COLORS[card.rarity] || '#666';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`${card.name}  (${card.cost})`, tx + 12, ty + 25);

  // Type
  const typeNames = { [CARD_TYPE.CREATURE]: '生物', [CARD_TYPE.SPELL]: '法术', [CARD_TYPE.HEAL]: '治疗' };
  ctx.fillStyle = '#aaa';
  ctx.font = '12px Arial';
  ctx.fillText(typeNames[card.type] || '', tx + 12, ty + 42);

  // Description
  ctx.fillStyle = '#ddd';
  ctx.font = '12px Arial';
  ctx.fillText(card.desc || '', tx + 12, ty + 60);

  // Stats for creatures
  if (card.type === CARD_TYPE.CREATURE) {
    ctx.fillStyle = '#ff6666';
    ctx.fillText(`攻击力: ${card.currentAtk}`, tx + 12, ty + 80);
    ctx.fillStyle = '#66ff66';
    ctx.fillText(`生命值: ${card.currentHp}`, tx + 12, ty + 96);
  }

  ctx.restore();
}

// --- Battle Field Layout ---

export function getFieldLayout(canvasW, canvasH) {
  const fieldCenterY = canvasH * 0.45;
  const handY = canvasH - CARD_HEIGHT - 20;
  const enemyHandY = 10;

  return {
    playerHp: { x: 20, y: canvasH - 55, w: 160 },
    aiHp: { x: 20, y: 10, w: 160 },
    playerMana: { x: 20, y: canvasH - 28 },
    aiMana: { x: 20, y: 40 },
    playerDeck: { x: canvasW - 60, y: canvasH - 70 },
    aiDeck: { x: canvasW - 60, y: 15 },
    playerField: {
      startX: (canvasW - (FIELD_CARD_WIDTH + 10) * 3) / 2,
      y: fieldCenterY + 20,
      gap: FIELD_CARD_WIDTH + 10,
    },
    aiField: {
      startX: (canvasW - (FIELD_CARD_WIDTH + 10) * 3) / 2,
      y: fieldCenterY - FIELD_CARD_HEIGHT - 30,
      gap: FIELD_CARD_WIDTH + 10,
    },
    playerHand: {
      startX: 0, // computed dynamically
      y: handY,
    },
    aiHand: {
      startX: 0,
      y: enemyHandY,
    },
    turnBtn: { x: canvasW - 110, y: canvasH - 55, w: 90, h: 35 },
    endBtn: { x: canvasW - 110, y: 15, w: 90, h: 35 }, // not used but keep
  };
}

// --- Draw Battle Scene ---

export function drawBattleScene(ctx, state, layout, hoveredCard, selectedCard, selectedAttacker, pendingSpell) {
  const { canvas } = ctx;
  const cw = canvas.width;
  const ch = canvas.height;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, ch);
  bg.addColorStop(0, '#0a0a1a');
  bg.addColorStop(0.4, '#12122a');
  bg.addColorStop(0.5, '#1a1a3a');
  bg.addColorStop(0.6, '#12122a');
  bg.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, ch);

  // Field divider
  ctx.strokeStyle = '#333366';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(40, ch * 0.45);
  ctx.lineTo(cw - 40, ch * 0.45);
  ctx.stroke();
  ctx.setLineDash([]);

  // Field labels
  ctx.fillStyle = '#444466';
  ctx.font = '11px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('敌方战场', cw - 20, ch * 0.45 - 8);
  ctx.fillText('我方战场', cw - 20, ch * 0.45 + 14);

  // HP bars
  drawHpBar(ctx, layout.playerHp.x, layout.playerHp.y, layout.playerHp.w,
    state.player.hp, 30, '我方');
  drawHpBar(ctx, layout.aiHp.x, layout.aiHp.y, layout.aiHp.w,
    state.ai.hp, 30, '敌方', true);

  // Mana
  ctx.fillStyle = '#888';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('法力:', layout.playerMana.x, layout.playerMana.y - 2);
  drawManaBar(ctx, layout.playerMana.x + 30, layout.playerMana.y,
    state.player.mana, state.player.maxMana);

  ctx.fillText('法力:', layout.aiMana.x, layout.aiMana.y - 2);
  drawManaBar(ctx, layout.aiMana.x + 30, layout.aiMana.y,
    state.ai.mana, state.ai.maxMana);

  // Deck counts
  ctx.fillStyle = '#666';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  drawDeckPile(ctx, layout.playerDeck.x, layout.playerDeck.y, state.player.deck.length);
  ctx.fillText(`${state.player.deck.length}`, layout.playerDeck.x, layout.playerDeck.y + 40);
  drawDeckPile(ctx, layout.aiDeck.x, layout.aiDeck.y, state.ai.deck.length);
  ctx.fillText(`${state.ai.deck.length}`, layout.aiDeck.x, layout.aiDeck.y + 40);

  // AI field
  for (let i = 0; i < state.ai.field.length; i++) {
    const card = state.ai.field[i];
    const cx = layout.aiField.startX + i * layout.aiField.gap;
    drawCard(ctx, card, cx, layout.aiField.y, {
      field: true,
      hovered: hoveredCard === card.uid,
      canAttack: card.canAttack && state.turn === 'ai',
    });
  }

  // Player field
  for (let i = 0; i < state.player.field.length; i++) {
    const card = state.player.field[i];
    const cx = layout.playerField.startX + i * layout.playerField.gap;
    const isSelected = selectedAttacker === card.uid;
    drawCard(ctx, card, cx, layout.playerField.y, {
      field: true,
      hovered: hoveredCard === card.uid,
      canAttack: card.canAttack && state.turn === 'player',
      selected: isSelected,
    });
  }

  // Player hand
  const handCount = state.player.hand.length;
  const handTotalW = handCount * (CARD_WIDTH + 8);
  const handStartX = (cw - handTotalW) / 2;
  for (let i = 0; i < handCount; i++) {
    const card = state.player.hand[i];
    const cx = handStartX + i * (CARD_WIDTH + 8);
    const isHovered = hoveredCard === card.uid;
    const isPlayable = state.turn === 'player' && card.cost <= state.player.mana;
    const isSelected = selectedCard === card.uid;
    drawCard(ctx, card, cx, layout.playerHand.y, {
      hovered: isHovered,
      playable: isPlayable,
      selected: isSelected,
      scale: isHovered ? 1.08 : 1,
    });
  }

  // AI hand (face down)
  const aiHandCount = state.ai.hand.length;
  const aiHandTotalW = aiHandCount * 35;
  const aiHandStartX = (cw - aiHandTotalW) / 2;
  for (let i = 0; i < aiHandCount; i++) {
    const cx = aiHandStartX + i * 35;
    drawCard(ctx, null, cx, layout.aiHand.y, { faceDown: true, field: true });
  }

  // Turn indicator
  ctx.fillStyle = state.turn === 'player' ? '#4CAF50' : '#F44336';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  const turnText = state.turn === 'player' ? '你的回合' : '对手回合';
  ctx.fillText(turnText, cw / 2, ch * 0.45 + 2);

  // End turn button (only during player turn)
  if (state.turn === 'player') {
    drawButton(ctx, layout.turnBtn.x, layout.turnBtn.y,
      layout.turnBtn.w, layout.turnBtn.h, '结束回合');
  }

  // Phase indicator
  if (state.phase === 'play') {
    ctx.fillStyle = '#88ff88';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('出牌阶段 - 选择手牌打出或选择场上生物攻击', cw / 2, ch - 3);
  } else if (state.phase === 'selectTarget') {
    ctx.fillStyle = '#ffaa44';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const targetText = pendingSpell && pendingSpell.target === 'friendly'
      ? '选择友方生物进行增益 (点击己方场上生物)'
      : '选择目标 (点击敌方生物或敌方头像)';
    ctx.fillText(targetText, cw / 2, ch - 3);
  } else if (state.phase === 'selectAttackTarget') {
    ctx.fillStyle = '#ffaa44';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('选择攻击目标 (点击敌方生物或敌方头像)', cw / 2, ch - 3);
  }
}

function drawDeckPile(ctx, x, y, count) {
  for (let i = Math.min(count, 3) - 1; i >= 0; i--) {
    const ox = x + i * 2;
    const oy = y + i * 2;
    drawRoundedRect(ctx, ox - 15, oy, 30, 35, 3);
    ctx.fillStyle = '#2a1a4a';
    ctx.fill();
    ctx.strokeStyle = '#5a3a8a';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (count > 0) {
    ctx.fillStyle = '#8a6acc';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('牌库', x, y + 22);
  }
}

function drawButton(ctx, x, y, w, h, text) {
  drawRoundedRect(ctx, x, y, w, h, 6);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#4a2a8a');
  grad.addColorStop(1, '#2a1a5a');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#7a5aba';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#e0d0ff';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2 + 5);
}

// --- Hit Testing ---

export function getCardAtPos(mx, my, state, layout) {
  // Check player hand
  const handCount = state.player.hand.length;
  const handTotalW = handCount * (CARD_WIDTH + 8);
  const handStartX = (canvasWidth - handTotalW) / 2;

  for (let i = 0; i < handCount; i++) {
    const card = state.player.hand[i];
    const cx = handStartX + i * (CARD_WIDTH + 8);
    if (mx >= cx && mx <= cx + CARD_WIDTH && my >= layout.playerHand.y && my <= layout.playerHand.y + CARD_HEIGHT) {
      return { zone: 'hand', card, index: i };
    }
  }

  // Check player field
  for (let i = 0; i < state.player.field.length; i++) {
    const card = state.player.field[i];
    const cx = layout.playerField.startX + i * layout.playerField.gap;
    if (mx >= cx && mx <= cx + FIELD_CARD_WIDTH && my >= layout.playerField.y && my <= layout.playerField.y + FIELD_CARD_HEIGHT) {
      return { zone: 'playerField', card, index: i };
    }
  }

  // Check AI field
  for (let i = 0; i < state.ai.field.length; i++) {
    const card = state.ai.field[i];
    const cx = layout.aiField.startX + i * layout.aiField.gap;
    if (mx >= cx && mx <= cx + FIELD_CARD_WIDTH && my >= layout.aiField.y && my <= layout.aiField.y + FIELD_CARD_HEIGHT) {
      return { zone: 'aiField', card, index: i };
    }
  }

  // Check AI face (for targeting)
  if (mx >= layout.aiHp.x && mx <= layout.aiHp.x + layout.aiHp.w &&
    my >= layout.aiHp.y && my <= layout.aiHp.y + 24) {
    return { zone: 'aiFace' };
  }

  // Check end turn button
  if (state.turn === 'player' &&
    mx >= layout.turnBtn.x && mx <= layout.turnBtn.x + layout.turnBtn.w &&
    my >= layout.turnBtn.y && my <= layout.turnBtn.y + layout.turnBtn.h) {
    return { zone: 'endTurn' };
  }

  return null;
}

// Store canvas ref for hit testing
let canvasWidth = 800;
let canvasHeight = 600;
export function setCtxRef(ctx) {
  if (ctx && ctx.canvas) {
    canvasWidth = ctx.canvas.width;
    canvasHeight = ctx.canvas.height;
  }
}
export function updateCanvasSize(w, h) {
  canvasWidth = w;
  canvasHeight = h;
}

// --- Start Overlay ---

export function drawStartOverlay(ctx) {
  const { canvas } = ctx;
  const cw = canvas.width;
  const ch = canvas.height;

  // Dark overlay
  ctx.fillStyle = '#0a0a1acc';
  ctx.fillRect(0, 0, cw, ch);

  // Title card
  const cardW = 400;
  const cardH = 500;
  const cx = (cw - cardW) / 2;
  const cy = (ch - cardH) / 2;

  drawRoundedRect(ctx, cx, cy, cardW, cardH, 16);
  const grad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
  grad.addColorStop(0, '#1a103a');
  grad.addColorStop(0.5, '#2a1a5a');
  grad.addColorStop(1, '#1a103a');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#7a5aba';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#e0d0ff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('卡牌战争', cx + cardW / 2, cy + 60);

  // Subtitle
  ctx.fillStyle = '#a090cc';
  ctx.font = '16px Arial';
  ctx.fillText('Card War', cx + cardW / 2, cy + 85);

  // Decorative line
  ctx.strokeStyle = '#6a4a9a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 40, cy + 100);
  ctx.lineTo(cx + cardW - 40, cy + 100);
  ctx.stroke();

  // Difficulty buttons
  const difficulties = [
    { key: 'easy', label: '简单', desc: 'AI随机出牌', color: '#4CAF50' },
    { key: 'medium', label: '中等', desc: 'AI会评估交换', color: '#FF9800' },
    { key: 'hard', label: '困难', desc: 'AI提前规划', color: '#F44336' },
  ];

  const btnW = 300;
  const btnH = 55;
  const btnStartY = cy + 130;

  const buttons = [];
  for (let i = 0; i < difficulties.length; i++) {
    const d = difficulties[i];
    const bx = cx + (cardW - btnW) / 2;
    const by = btnStartY + i * 65;

    drawRoundedRect(ctx, bx, by, btnW, btnH, 8);
    const bGrad = ctx.createLinearGradient(bx, by, bx, by + btnH);
    bGrad.addColorStop(0, d.color + '44');
    bGrad.addColorStop(1, d.color + '22');
    ctx.fillStyle = bGrad;
    ctx.fill();
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, bx + btnW / 2, by + 25);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.fillText(d.desc, bx + btnW / 2, by + 44);

    buttons.push({ x: bx, y: by, w: btnW, h: btnH, key: d.key });
  }

  // Help text
  ctx.fillStyle = '#888';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  const helpY = cy + cardH - 100;
  ctx.fillText('玩法说明:', cx + cardW / 2, helpY);
  ctx.font = '10px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText('点击手牌打出，点击场上生物选择攻击', cx + cardW / 2, helpY + 18);
  ctx.fillText('每个生物每回合可攻击一次', cx + cardW / 2, helpY + 33);
  ctx.fillText('消灭对手全部生命值即可获胜', cx + cardW / 2, helpY + 48);
  ctx.fillText('最高连胜记录保存在本地', cx + cardW / 2, helpY + 63);

  return buttons;
}

// --- Game Over Overlay ---

export function drawGameOverOverlay(ctx, won, stats) {
  const { canvas } = ctx;
  const cw = canvas.width;
  const ch = canvas.height;

  ctx.fillStyle = '#0a0a1acc';
  ctx.fillRect(0, 0, cw, ch);

  const cardW = 360;
  const cardH = 320;
  const cx = (cw - cardW) / 2;
  const cy = (ch - cardH) / 2;

  drawRoundedRect(ctx, cx, cy, cardW, cardH, 16);
  const grad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
  grad.addColorStop(0, won ? '#1a3a1a' : '#3a1a1a');
  grad.addColorStop(1, won ? '#0a2a0a' : '#2a0a0a');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = won ? '#4CAF50' : '#F44336';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title
  ctx.fillStyle = won ? '#4CAF50' : '#F44336';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(won ? '胜利!' : '失败', cx + cardW / 2, cy + 50);

  // Stats
  ctx.fillStyle = '#ccc';
  ctx.font = '14px Arial';
  const lines = [
    `回合数: ${stats.turns}`,
    `打出卡牌: ${stats.cardsPlayed}`,
    `造成伤害: ${stats.damageDealt}`,
    `承受伤害: ${stats.damageTaken}`,
    `连胜: ${stats.streak}`,
    `最高连胜: ${stats.bestStreak}`,
  ];
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx + cardW / 2, cy + 90 + i * 24);
  }

  // Restart button
  const btnW = 200;
  const btnH = 40;
  const bx = cx + (cardW - btnW) / 2;
  const by = cy + cardH - 65;

  drawRoundedRect(ctx, bx, by, btnW, btnH, 8);
  ctx.fillStyle = '#4a2a8a';
  ctx.fill();
  ctx.strokeStyle = '#7a5aba';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#e0d0ff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('再来一局', bx + btnW / 2, by + 26);

  return { x: bx, y: by, w: btnW, h: btnH };
}
