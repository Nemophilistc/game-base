// ============================================================
// ui.js — 工具面板、属性编辑、覆盖层
// ============================================================

import { PHYSICS, COLORS, RENDERING } from './config.js';
import { playClick } from './sound.js';

export class UI {
    constructor(toolManager, world, renderer) {
        this.toolManager = toolManager;
        this.world = world;
        this.renderer = renderer;
        this.selectedBody = null;
        this.paused = false;
        this.panelOpen = true;
        this._build();
    }

    _build() {
        // 左侧工具栏
        this.toolbar = document.getElementById('toolbar');
        // 右侧属性面板
        this.propPanel = document.getElementById('prop-panel');
        // 顶部场景栏
        this.sceneBar = document.getElementById('scene-bar');
        // 物理参数面板
        this.physicsPanel = document.getElementById('physics-panel');

        this._buildToolbar();
        this._buildShapeBar();
        this._buildPhysicsPanel();
        this._buildSceneBar();
        this._buildToggles();
    }

    _buildToolbar() {
        const tools = [
            { id: 'place', icon: '&#9673;', label: '放置' },
            { id: 'drag', icon: '&#10068;', label: '拖拽' },
            { id: 'delete', icon: '&#10006;', label: '删除' },
            { id: 'connect', icon: '&#10070;', label: '连接' },
            { id: 'launch', icon: '&#10148;', label: '发射' },
        ];
        const connectTypes = [
            { id: 'spring', label: '弹簧' },
            { id: 'rope', label: '绳索' },
            { id: 'hinge', label: '铰链' },
        ];

        let html = '<div class="panel-title">工具</div>';
        for (const t of tools) {
            html += `<button class="tool-btn ${t.id === 'place' ? 'active' : ''}" data-tool="${t.id}" title="${t.label}">
                <span class="tool-icon">${t.icon}</span>
                <span class="tool-label">${t.label}</span>
            </button>`;
        }
        html += `<div class="separator"></div>`;
        html += `<div class="sub-label">连接类型</div>`;
        for (const ct of connectTypes) {
            html += `<button class="conn-btn ${ct.id === 'spring' ? 'active' : ''}" data-conn="${ct.id}">${ct.label}</button>`;
        }
        html += `<div class="separator"></div>`;
        html += `<label class="toggle-label"><input type="checkbox" id="chk-static"> 静态物体</label>`;
        html += `<div class="separator"></div>`;
        html += `<button class="action-btn" id="btn-undo">撤销 (Z)</button>`;
        html += `<button class="action-btn danger" id="btn-clear">清空</button>`;

        this.toolbar.innerHTML = html;

        // 事件绑定
        this.toolbar.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                playClick();
                this.toolbar.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toolManager.setTool(btn.dataset.tool);
            });
        });
        this.toolbar.querySelectorAll('.conn-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                playClick();
                this.toolbar.querySelectorAll('.conn-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toolManager.connectType = btn.dataset.conn;
            });
        });
        document.getElementById('chk-static').addEventListener('change', (e) => {
            this.toolManager.isStatic = e.target.checked;
        });
        document.getElementById('btn-undo').addEventListener('click', () => {
            this.toolManager.undo();
        });
        document.getElementById('btn-clear').addEventListener('click', () => {
            this.world.clear();
            this.selectedBody = null;
        });
    }

    _buildShapeBar() {
        const shapes = [
            { id: 'circle', icon: '●', label: '圆形', color: COLORS.circle },
            { id: 'rectangle', icon: '■', label: '矩形', color: COLORS.rectangle },
            { id: 'triangle', icon: '▲', label: '三角', color: COLORS.triangle },
            { id: 'polygon', icon: '⬟', label: '多边形', color: COLORS.polygon },
        ];

        let html = '<div class="panel-title">形状</div>';
        for (const s of shapes) {
            html += `<button class="shape-btn ${s.id === 'circle' ? 'active' : ''}" data-shape="${s.id}" style="--shape-color: ${s.color}">
                <span class="shape-icon">${s.icon}</span>
                <span>${s.label}</span>
            </button>`;
        }
        html += `<div class="separator"></div>`;
        html += `<div class="slider-group">
            <label>大小</label>
            <input type="range" id="shape-size" min="10" max="120" value="40">
            <span id="shape-size-val">40</span>
        </div>`;
        html += `<div class="slider-group">
            <label>密度</label>
            <input type="range" id="shape-density" min="1" max="10" value="5" step="0.5">
            <span id="shape-density-val">1.0</span>
        </div>`;

        const shapeBar = document.getElementById('shape-bar');
        shapeBar.innerHTML = html;

        shapeBar.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                playClick();
                shapeBar.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toolManager.setShape(btn.dataset.shape);
            });
        });

        const sizeSlider = document.getElementById('shape-size');
        const sizeVal = document.getElementById('shape-size-val');
        sizeSlider.addEventListener('input', () => {
            sizeVal.textContent = sizeSlider.value;
            this.toolManager.shapeSize = +sizeSlider.value;
        });

        const densitySlider = document.getElementById('shape-density');
        const densityVal = document.getElementById('shape-density-val');
        densitySlider.addEventListener('input', () => {
            const v = (+densitySlider.value / 5).toFixed(1);
            densityVal.textContent = v;
            this.toolManager.shapeDensity = +v;
        });
    }

    _buildPhysicsPanel() {
        let html = '<div class="panel-title">物理参数</div>';
        html += `<div class="slider-group">
            <label>重力</label>
            <input type="range" id="gravity" min="0" max="2000" value="${PHYSICS.gravity.y}">
            <span id="gravity-val">${PHYSICS.gravity.y}</span>
        </div>`;
        html += `<div class="slider-group">
            <label>摩擦</label>
            <input type="range" id="friction" min="0" max="100" value="${PHYSICS.friction * 100}">
            <span id="friction-val">${PHYSICS.friction}</span>
        </div>`;
        html += `<div class="slider-group">
            <label>弹性</label>
            <input type="range" id="restitution" min="0" max="100" value="${PHYSICS.restitution * 100}">
            <span id="restitution-val">${PHYSICS.restitution}</span>
        </div>`;
        html += `<div class="slider-group">
            <label>时间步</label>
            <input type="range" id="timestep" min="5" max="30" value="${Math.round(PHYSICS.timeStep * 1000)}">
            <span id="timestep-val">${PHYSICS.timeStep}</span>
        </div>`;
        html += `<div class="separator"></div>`;
        html += `<label class="toggle-label"><input type="checkbox" id="chk-pause"> 暂停物理</label>`;

        this.physicsPanel.innerHTML = html;

        // 事件
        const bind = (id, cb) => {
            const el = document.getElementById(id);
            el.addEventListener('input', cb);
        };
        bind('gravity', (e) => {
            this.world.gravity.y = +e.target.value;
            document.getElementById('gravity-val').textContent = e.target.value;
        });
        bind('friction', (e) => {
            this.world.friction = +e.target.value / 100;
            document.getElementById('friction-val').textContent = (+e.target.value / 100).toFixed(2);
        });
        bind('restitution', (e) => {
            this.world.restitution = +e.target.value / 100;
            document.getElementById('restitution-val').textContent = (+e.target.value / 100).toFixed(2);
        });
        bind('timestep', (e) => {
            document.getElementById('timestep-val').textContent = (+e.target.value / 1000).toFixed(3);
        });
        document.getElementById('chk-pause').addEventListener('change', (e) => {
            this.paused = e.target.checked;
        });
    }

    _buildSceneBar() {
        const scenes = [
            { id: 'blank', label: '空白画布' },
            { id: 'domino', label: '多米诺' },
            { id: 'pinball', label: '弹球机' },
            { id: 'chain', label: '链式反应' },
        ];

        let html = '<div class="panel-title">预设场景</div>';
        for (const s of scenes) {
            html += `<button class="scene-btn" data-scene="${s.id}">${s.label}</button>`;
        }
        this.sceneBar.innerHTML = html;
    }

    _buildToggles() {
        let html = '<div class="panel-title">显示</div>';
        html += `<label class="toggle-label"><input type="checkbox" id="chk-velocity"> 速度矢量</label>`;
        html += `<label class="toggle-label"><input type="checkbox" id="chk-trails"> 轨迹线</label>`;
        html += `<label class="toggle-label"><input type="checkbox" id="chk-grid" checked> 网格</label>`;

        const toggleBar = document.getElementById('toggle-bar');
        toggleBar.innerHTML = html;

        document.getElementById('chk-velocity').addEventListener('change', (e) => {
            this.renderer.showVelocity = e.target.checked;
        });
        document.getElementById('chk-trails').addEventListener('change', (e) => {
            this.renderer.showTrails = e.target.checked;
        });
        document.getElementById('chk-grid').addEventListener('change', (e) => {
            this.renderer.showGrid = e.target.checked;
        });
    }

    drawProperties() {
        const panel = this.propPanel;
        if (!this.selectedBody) {
            panel.innerHTML = '<div class="panel-title">属性</div><div class="hint">点击物体查看属性</div>';
            return;
        }
        const b = this.selectedBody;
        let html = '<div class="panel-title">属性</div>';
        html += `<div class="prop-row"><span>类型</span><span>${b.shape}</span></div>`;
        html += `<div class="prop-row"><span>位置</span><span>${Math.round(b.pos.x)}, ${Math.round(b.pos.y)}</span></div>`;
        html += `<div class="prop-row"><span>速度</span><span>${Vec2Len(b.vel).toFixed(1)}</span></div>`;
        html += `<div class="prop-row"><span>质量</span><span>${b.mass.toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><span>角度</span><span>${(b.angle * 180 / Math.PI).toFixed(1)}°</span></div>`;
        html += `<div class="prop-row"><span>静态</span><span>${b.isStatic ? '是' : '否'}</span></div>`;
        html += `<div class="separator"></div>`;
        html += `<button class="action-btn danger" id="btn-delete-selected">删除物体</button>`;
        html += `<button class="action-btn" id="btn-toggle-static">${b.isStatic ? '设为动态' : '设为静态'}</button>`;

        panel.innerHTML = html;

        document.getElementById('btn-delete-selected').addEventListener('click', () => {
            this.world.removeBody(b);
            this.selectedBody = null;
            playClick();
        });
        document.getElementById('btn-toggle-static').addEventListener('click', () => {
            b.isStatic = !b.isStatic;
            if (b.isStatic) {
                b.mass = 0; b.invMass = 0; b.inertia = 0; b.invInertia = 0;
                b.vel = { x: 0, y: 0 }; b.angularVel = 0;
            } else {
                b.mass = 1; b.invMass = 1; b.inertia = 1000; b.invInertia = 0.001;
            }
            playClick();
        });
    }

    selectBody(body) {
        this.selectedBody = body;
    }
}

function Vec2Len(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}
