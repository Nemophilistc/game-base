// config.js - Game configuration constants

export const TILE_W = 48;
export const TILE_H = 60;
export const TILE_GAP = 2;

export const DIFFICULTY = {
  easy:   { types: 9,  pairs: 18, label: '简单' },
  medium: { types: 18, pairs: 36, label: '中等' },
  hard:   { types: 27, pairs: 54, label: '困难' }
};

export const LAYOUTS = {
  pyramid:  { label: '金字塔' },
  turtle:   { label: '乌龟' },
  diamond:  { label: '菱形' },
  random:   { label: '随机' }
};

export const HINTS_MAX = 3;
export const SHUFFLES_MAX = 2;

export const COLORS = {
  gold:      '#f5c842',
  amber:     '#ffbf00',
  bg:        '#0d0d1a',
  panelBg:   'rgba(30,30,50,0.85)',
  tileFace:  '#e8dcc8',
  tileEdge:  '#b0a080',
  tileText:  '#2a1a0a',
  selected:  '#f5c842',
  matched:   '#4ade80',
  pathLine:  '#f5c842',
  dim:       'rgba(0,0,0,0.6)'
};
