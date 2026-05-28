export const TUBE_CAPACITY = 4;
export const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
  '#00bcd4', '#ff5722', '#795548', '#607d8b'
];
export const COLOR_NAMES = [
  '红', '蓝', '绿', '黄', '紫', '青', '橙', '粉', '靛', '深橙', '棕', '灰'
];

export const LEVELS = [];
for (let i = 0; i < 60; i++) {
  const colorCount = Math.min(3 + Math.floor(i / 5), 12);
  const emptyTubes = i < 10 ? 2 : i < 30 ? 2 : 3;
  LEVELS.push({ colorCount, emptyTubes });
}

export const state = {
  currentLevel: 0,
  tubes: [],
  selectedTube: -1,
  pouring: false,
  pourFrom: -1,
  pourTo: -1,
  pourProgress: 0,
  moves: 0,
  undosLeft: 3,
  timer: 0,
  gameActive: false,
  completedTubes: 0,
  highScores: JSON.parse(localStorage.getItem('colorsort_scores') || '{}'),
  stars: JSON.parse(localStorage.getItem('colorsort_stars') || '{}')
};

export function saveHighScore(level, moves, time) {
  const key = `l${level}`;
  const prev = state.highScores[key];
  if (!prev || moves < prev.moves || (moves === prev.moves && time < prev.time)) {
    state.highScores[key] = { moves, time };
    localStorage.setItem('colorsort_scores', JSON.stringify(state.highScores));
  }
  const starKey = key;
  const starCount = moves <= LEVELS[level].colorCount * 3 ? 3 :
                    moves <= LEVELS[level].colorCount * 5 ? 2 : 1;
  const prevStars = state.stars[starKey] || 0;
  if (starCount > prevStars) {
    state.stars[starKey] = starCount;
    localStorage.setItem('colorsort_stars', JSON.stringify(state.stars));
  }
  return starCount;
}
