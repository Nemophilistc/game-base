# MIMO Game Collection

这是一个游戏合集项目，包含多个独立的小游戏。

## 📁 项目结构

```
MIMO_GAME/
├── Paopao/                    # 泡泡堂游戏
│   ├── index.html            # 游戏入口
│   ├── js/                   # 游戏逻辑
│   │   ├── main.js           # 主循环和初始化
│   │   ├── config.js         # 配置常量
│   │   ├── map.js            # 地图生成
│   │   ├── character.js      # 角色系统
│   │   ├── bomb.js           # 炸弹系统
│   │   ├── item.js           # 道具系统
│   │   └── ai.js             # AI敌人
│   ├── GAME_DEVELOPMENT_GUIDE.md  # 开发指南
│   └── DEBUG_RETROSPECTIVE.md     # 调试回顾
├── articles/                  # 文章目录
├── scripts/                   # 工具脚本
└── README.md                  # 本文件
```

## 🎮 游戏列表

### 1. 泡泡堂 (Paopao)
- **类型**: 单人对战AI的泡泡堂游戏
- **技术**: HTML5 Canvas + 原生JavaScript
- **特色**: 14种道具、9种场景、智能AI敌人
- **运行**: 直接打开 `Paopao/index.html`

## 🚀 快速开始

1. 进入游戏目录：`cd Paopao`
2. 用浏览器打开 `index.html`
3. 开始游戏！

## 📝 开发说明

每个游戏都是独立的项目，有自己的目录和文档。添加新游戏时：
1. 在根目录创建新文件夹
2. 在文件夹内开发游戏
3. 更新本README文件

## 🎯 设计原则

- **单文件优先**: 尽量保持简单，避免过度工程化
- **无依赖**: 使用原生技术，无需安装包管理器
- **即时运行**: 直接打开HTML文件即可玩
- **中文友好**: 所有界面和文档使用中文

---

*最后更新: 2026年5月26日*
