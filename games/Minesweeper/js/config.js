// 扫雷游戏配置常量
export const DIFFS = {
    easy:   { cols: 9,  rows: 9,  mines: 10 },
    medium: { cols: 16, rows: 16, mines: 40 },
    hard:   { cols: 30, rows: 16, mines: 99 }
};

export const CELL_SIZE = 32;

// 难度中文名映射
export const DIFF_NAMES = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
};
