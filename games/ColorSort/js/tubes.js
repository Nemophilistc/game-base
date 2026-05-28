import { TUBE_CAPACITY, COLORS, LEVELS } from './config.js';

export function generateLevel(levelIdx) {
  const level = LEVELS[levelIdx];
  const colorCount = level.colorCount;
  const totalTubes = colorCount + level.emptyTubes;
  const segments = [];
  for (let c = 0; c < colorCount; c++) {
    for (let i = 0; i < TUBE_CAPACITY; i++) {
      segments.push(c);
    }
  }
  // Shuffle
  for (let i = segments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [segments[i], segments[j]] = [segments[j], segments[i]];
  }
  const tubes = [];
  for (let t = 0; t < totalTubes; t++) {
    const tube = [];
    for (let i = 0; i < TUBE_CAPACITY; i++) {
      const idx = t * TUBE_CAPACITY + i;
      if (idx < segments.length) tube.push(segments[idx]);
    }
    tubes.push(tube);
  }
  return tubes;
}

export function canPour(fromTube, toTube) {
  if (fromTube.length === 0) return false;
  if (toTube.length >= TUBE_CAPACITY) return false;
  if (toTube.length === 0) return true;
  return fromTube[fromTube.length - 1] === toTube[toTube.length - 1];
}

export function pour(fromTube, toTube) {
  const color = fromTube.pop();
  toTube.push(color);
  return color;
}

export function isTubeComplete(tube) {
  if (tube.length === 0) return true;
  if (tube.length !== TUBE_CAPACITY) return false;
  return tube.every(c => c === tube[0]);
}

export function isAllComplete(tubes) {
  return tubes.every(t => t.length === 0 || isTubeComplete(t));
}

export function getTopColorCount(tube) {
  if (tube.length === 0) return 0;
  const topColor = tube[tube.length - 1];
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === topColor) count++;
    else break;
  }
  return count;
}

export function drawTube(ctx, x, y, w, h, tube, selected, hover, pourAnim) {
  const cap = TUBE_CAPACITY;
  const segH = h / cap;
  const radius = 8;

  // Tube glass
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();
  ctx.strokeStyle = selected ? '#fff' : hover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.stroke();

  // Clips for liquid
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 2);
  ctx.lineTo(x + w - 2, y + 2);
  ctx.lineTo(x + w - 2, y + h - 2);
  ctx.lineTo(x + 2, y + h - 2);
  ctx.closePath();
  ctx.clip();

  // Liquid segments
  for (let i = 0; i < tube.length; i++) {
    const segY = y + h - (i + 1) * segH;
    const color = COLORS[tube[i]];
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, segY + 1, w - 4, segH - 2);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 4, segY + 2, w * 0.3, segH - 4);
  }

  // Pour animation overlay
  if (pourAnim && pourAnim.tubeIdx === tube.length) {
    // handled in main
  }

  ctx.restore();

  // Glow for selected
  if (selected) {
    ctx.save();
    ctx.shadowColor = COLORS[tube[tube.length-1]] || '#fff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}
