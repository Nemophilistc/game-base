// ============================================
// 农场模拟游戏 - 主循环 / 事件监听 / 时间系统
// ============================================

import {
  SEASONS, DAYS_PER_SEASON, DAY_START_HOUR, DAY_END_HOUR,
  INITIAL_MONEY, CROPS, ANIMALS
} from './config.js';
import { initAudio, Sound } from './sound.js';
import { Farm } from './farm.js';
import { AnimalManager } from './animals.js';
import { Market } from './market.js';
import { Weather } from './weather.js';
import { UI } from './ui.js';

// ============ 游戏状态 ============
const state = {
  // 时间
  seasonIndex: 0,       // 0=春 1=夏 2=秋 3=冬
  day: 1,
  hour: DAY_START_HOUR,
  totalDays: 0,
  paused: false,        // 晚上休息暂停
  dayOver: false,

  // 经济
  money: INITIAL_MONEY,

  // 选择的种子类型（种植模式下）
  selectedSeedType: null,

  // 种子面板打开状态
  showSeedSelect: false,
};

// ============ 初始化系统 ============
const canvas = document.getElementById('gameCanvas');
const ui = new UI(canvas);
const farm = new Farm();
const animalMgr = new AnimalManager();
const market = new Market();
const weather = new Weather();

// 初始天气
weather.advanceDay(SEASONS[state.seasonIndex]);

// ============ 时间系统 ============
function getSeason() {
  return SEASONS[state.seasonIndex];
}

function advanceHour() {
  state.hour++;
  if (state.hour >= DAY_END_HOUR) {
    endDay();
  }
}

function endDay() {
  state.dayOver = true;
  state.paused = true;

  // 收集动物产品
  const products = animalMgr.collectAllProducts();
  if (products.length > 0) {
    const productNames = products.map(p => p.product).join('、');
    ui.showMessage(`收集到: ${productNames}`, '#FFD700', 180);
  }

  // 更新作物
  farm.updateDay(weather.current);

  // 更新动物
  const newBorn = animalMgr.updateDay(state.totalDays);
  if (newBorn > 0) {
    Sound.breed();
    ui.showMessage(`有${newBorn}只新动物诞生！`, '#FF69B4', 150);
  }

  // 更新市场价格
  market.updatePrices();

  // 推进天气
  weather.advanceDay(getSeason());

  // 推进日期
  state.totalDays++;
  state.day++;
  if (state.day > DAYS_PER_SEASON) {
    state.day = 1;
    state.seasonIndex = (state.seasonIndex + 1) % 4;
    Sound.seasonChange();
    ui.showMessage(`季节变换 - 现在是${getSeason()}！`, '#90EE90', 180);
  }

  state.hour = DAY_START_HOUR;
  state.dayOver = false;
  state.paused = false;
  Sound.newDay();
}

// ============ 绘制主循环 ============
function render() {
  const weatherInfo = weather.getCurrent();

  // 更新鼠标位置（悬停效果）
  // ui.updateMouse 在事件监听中设置

  // 绘制农场
  ui.drawFarm(farm, weatherInfo.type);

  // 绘制HUD
  const seasonProgress = (state.day - 1) / DAYS_PER_SEASON;
  ui.drawHUD({
    season: getSeason(),
    day: state.day,
    hour: state.hour,
    money: state.money,
    weather: weatherInfo,
    animalCount: animalMgr.getCount(),
    seasonProgress,
  });

  // 绘制悬停提示
  if (ui.hoveredTile && !ui.showShop && !ui.showAnimalPanel && !state.showSeedSelect) {
    ui.drawTooltip(farm, ui.hoveredTile.row, ui.hoveredTile.col);
  }

  // 绘制面板
  if (ui.showShop) {
    ui.drawShop(market, state.money, getSeason(), animalMgr.products, farm.seeds, farm.inventory);
  } else if (ui.showAnimalPanel) {
    ui._animalActions = [];
    ui.drawAnimalPanel(animalMgr);
  } else if (state.showSeedSelect) {
    ui.drawSeedSelectPanel(farm.seeds, getSeason());
  }

  requestAnimationFrame(render);
}

// ============ 事件处理 ============
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = getMousePos(e);
  ui.updateMouse(x, y);
});

canvas.addEventListener('click', (e) => {
  initAudio();
  const { x, y } = getMousePos(e);

  // 商店面板打开
  if (ui.showShop) {
    handleShopClick(x, y);
    return;
  }

  // 动物面板打开
  if (ui.showAnimalPanel) {
    handleAnimalPanelClick(x, y);
    return;
  }

  // 种子选择面板打开
  if (state.showSeedSelect) {
    handleSeedSelectClick(x, y);
    return;
  }

  // 工具栏点击
  const tool = ui.getClickedTool(x, y);
  if (tool) {
    ui.selectedTool = tool;
    if (tool === 'plant') {
      // 如果有种子，打开种子选择面板
      const seedTypes = Object.keys(farm.seeds).filter(k => farm.seeds[k] > 0);
      if (seedTypes.length > 0) {
        state.showSeedSelect = true;
      } else {
        ui.showMessage('没有种子，请先去商店购买', '#FF6666');
        Sound.error();
      }
    }
    return;
  }

  // 功能按钮点击
  const funcBtn = ui.getClickedFuncBtn(x, y);
  if (funcBtn) {
    switch (funcBtn) {
      case 'shop':
        ui.showShop = true;
        break;
      case 'animal':
        ui.showAnimalPanel = true;
        break;
      case 'collect':
        handleCollect();
        break;
      case 'nextDay':
        if (!state.dayOver) {
          state.hour = DAY_END_HOUR;
          endDay();
        }
        break;
    }
    return;
  }

  // 农田点击 (网格区域: 8行 × 64px = 512)
  if (y < 512) {
    handleFarmClick(x, y);
  }
});

// 右键取消选择
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  state.selectedSeedType = null;
  state.showSeedSelect = false;
  ui.showShop = false;
  ui.showAnimalPanel = false;
});

// ============ 农田点击处理 ============
function handleFarmClick(mx, my) {
  const tile = ui.getClickedTile(mx, my);
  if (!tile) return;
  const { row, col } = tile;

  switch (ui.selectedTool) {
    case 'hoe': {
      const info = farm.getTileInfo(row, col);
      if (!info) break;
      if (info.state === 0) { // GRASS
        if (farm.till(row, col)) {
          Sound.hoe();
          ui.showMessage('翻地成功');
          advanceHour();
        }
      } else if (info.crop && !info.crop.alive) {
        if (farm.clearWithered(row, col)) {
          Sound.hoe();
          ui.showMessage('清除了枯萎作物');
          advanceHour();
        }
      } else {
        ui.showMessage('这里不需要锄头', '#FF6666');
        Sound.error();
      }
      break;
    }

    case 'water': {
      const info = farm.getTileInfo(row, col);
      if (!info || !info.crop) {
        ui.showMessage('这里没有作物', '#FF6666');
        Sound.error();
        break;
      }
      if (farm.water(row, col)) {
        Sound.water();
        ui.showMessage('浇水成功');
        advanceHour();
      } else {
        ui.showMessage('今天已经浇过水了', '#FF9900');
        Sound.error();
      }
      break;
    }

    case 'sickle': {
      const info = farm.getTileInfo(row, col);
      if (!info || !info.crop) {
        ui.showMessage('这里没有作物', '#FF6666');
        Sound.error();
        break;
      }
      if (info.crop.isHarvestable()) {
        const result = farm.harvest(row, col);
        if (result) {
          Sound.harvest();
          ui.showMessage(`收获了 ${result.amount} 个 ${result.name}！`, '#FFD700');
          advanceHour();
        }
      } else if (!info.crop.alive) {
        ui.showMessage('作物已枯萎，用锄头清除', '#FF6666');
        Sound.error();
      } else {
        ui.showMessage('作物还没成熟', '#FF9900');
        Sound.error();
      }
      break;
    }

    case 'plant': {
      if (!state.selectedSeedType) {
        state.showSeedSelect = true;
        ui.showMessage('请先选择种子', '#FF9900');
        break;
      }
      const info = farm.getTileInfo(row, col);
      if (!info || info.state !== 1) { // TILLED
        ui.showMessage('需要先翻地才能种植', '#FF6666');
        Sound.error();
        break;
      }
      const cropData = CROPS[state.selectedSeedType];
      if (!cropData.seasons.includes(getSeason())) {
        ui.showMessage(`${cropData.name}不适合在${getSeason()}种植`, '#FF6666');
        Sound.error();
        break;
      }
      if (farm.plant(row, col, state.selectedSeedType)) {
        Sound.plant();
        ui.showMessage(`种下了${cropData.name}`);
        advanceHour();
      } else {
        ui.showMessage('种植失败（没有种子）', '#FF6666');
        Sound.error();
      }
      break;
    }

    case 'feed': {
      ui.showMessage('饲料工具用于动物，请打开动物面板', '#FF9900');
      break;
    }
  }
}

// ============ 商店点击处理 ============
function handleShopClick(mx, my) {
  // 关闭按钮
  if (ui.getClickedCloseBtn(mx, my)) {
    ui.showShop = false;
    return;
  }

  // 标签页切换 (面板中心 x = 768/2 = 384)
  const tabArea = { y: 65, h: 30 };
  const tabW = 120;
  const tabs = ['seeds', 'animals', 'sell'];
  tabs.forEach((tab, i) => {
    const tx = 384 - (tabs.length * tabW) / 2 + i * tabW;
    if (ui._isInRect(mx, my, tx, tabArea.y, tabW - 4, tabArea.h)) {
      ui.selectedTab = tab;
    }
  });

  // 商品点击
  const item = ui.getClickedShopItem(mx, my);
  if (!item) return;

  if (item.type === 'seed') {
    const result = market.buySeed(item.cropType, state.money);
    if (result.success) {
      state.money -= result.price;
      farm.addSeeds(item.cropType, 1);
      Sound.buy();
      ui.showMessage(`购买了1个${CROPS[item.cropType].name}种子 (-${result.price}💰)`, '#90EE90');
    } else {
      Sound.error();
      ui.showMessage(result.reason, '#FF6666');
    }
  } else if (item.type === 'animal') {
    const result = market.buyAnimal(item.animalType, state.money);
    if (result.success) {
      state.money -= result.price;
      animalMgr.buy(item.animalType);
      Sound.buy();
      ui.showMessage(`购买了${ANIMALS[item.animalType].name} (-${result.price}💰)`, '#90EE90');
    } else {
      Sound.error();
      ui.showMessage(result.reason, '#FF6666');
    }
  } else if (item.type === 'sell') {
    if (item.category === 'crop') {
      const result = farm.sellInventory(item.itemType);
      if (result && result.total > 0) {
        state.money += result.total;
        Sound.sell();
        ui.showMessage(`出售了 ${result.amount} 个 ${CROPS[item.itemType].name} (+${result.total}💰)`, '#FFD700');
      }
    }
  }
}

// ============ 动物面板点击处理 ============
function handleAnimalPanelClick(mx, my) {
  if (ui.getClickedCloseBtn(mx, my)) {
    ui.showAnimalPanel = false;
    return;
  }

  const action = ui.getClickedAnimalAction(mx, my);
  if (action) {
    const animal = animalMgr.animals.find(a => a.id === action.id);
    if (!animal) return;

    if (action.action === 'feed') {
      const feedCost = animal.data.feedCost;
      if (state.money < feedCost) {
        Sound.error();
        ui.showMessage('资金不足', '#FF6666');
        return;
      }
      state.money -= feedCost;
      animal.feed(state.totalDays);
      Sound.feed();
      ui.showMessage(`喂养了${animal.name} (-${feedCost}💰)`);
    } else if (action.action === 'clean') {
      const cleanCost = animal.data.cleanCost;
      if (state.money < cleanCost) {
        Sound.error();
        ui.showMessage('资金不足', '#FF6666');
        return;
      }
      state.money -= cleanCost;
      animal.clean(state.totalDays);
      Sound.water();
      ui.showMessage(`清洁了${animal.name} (-${cleanCost}💰)`);
    }
  }
}

// ============ 种子选择面板点击处理 ============
function handleSeedSelectClick(mx, my) {
  if (ui.getClickedCloseBtn(mx, my)) {
    state.showSeedSelect = false;
    return;
  }

  const item = ui.getClickedSeedSelect(mx, my);
  if (item && item.canPlant) {
    state.selectedSeedType = item.type;
    state.showSeedSelect = false;
    ui.showMessage(`已选择 ${CROPS[item.type].name} 种子`, '#90EE90');
  } else if (item && !item.canPlant) {
    Sound.error();
    ui.showMessage(`${CROPS[item.type].name}不适合在${getSeason()}种植`, '#FF6666');
  }
}

// ============ 收集产品 ============
function handleCollect() {
  const products = animalMgr.collectAllProducts();
  if (products.length > 0) {
    Sound.harvest();
    const summary = products.map(p => p.product).join('、');
    ui.showMessage(`收集到: ${summary}`, '#FFD700');
  } else {
    ui.showMessage('暂无可收集的产品', '#FF9900');
  }
}

// ============ 键盘快捷键 ============
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ui.showShop = false;
    ui.showAnimalPanel = false;
    state.showSeedSelect = false;
  }
  if (e.key === 'b' || e.key === 'B') {
    ui.showShop = !ui.showShop;
    ui.showAnimalPanel = false;
    state.showSeedSelect = false;
  }
  if (e.key === 'n' || e.key === 'N') {
    ui.showAnimalPanel = !ui.showAnimalPanel;
    ui.showShop = false;
    state.showSeedSelect = false;
  }
  if (e.key === ' ' && !ui.showShop && !ui.showAnimalPanel) {
    e.preventDefault();
    if (!state.dayOver) {
      state.hour = DAY_END_HOUR;
      endDay();
    }
  }
});

// ============ 启动游戏 ============
console.log('农场模拟游戏启动！');
render();
