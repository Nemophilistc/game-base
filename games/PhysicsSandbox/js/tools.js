// ============================================================
// tools.js — 工具系统
// ============================================================

import { Vec2 } from './physics.js';
import { createShape } from './shapes.js';
import { Constraint } from './physics.js';
import { LAUNCH } from './config.js';
import { playPlace, playDelete, playSpring, playLaunch, playConnect } from './sound.js';

export class ToolManager {
    constructor(world, renderer) {
        this.world = world;
        this.renderer = renderer;
        this.activeTool = 'place';
        this.activeShape = 'circle';
        this.isStatic = false;
        this.connectType = 'spring';

        // 拖拽状态
        this.dragging = false;
        this.dragBody = null;
        this.dragOffset = { x: 0, y: 0 };

        // 连接状态
        this.connectStart = null;

        // 发射状态
        this.launchStart = null;
        this.launching = false;

        // 鼠标位置
        this.mouseWorld = { x: 0, y: 0 };
        this.mouseScreen = { x: 0, y: 0 };

        // 撤销栈
        this.undoStack = [];
    }

    setTool(tool) {
        this.activeTool = tool;
        this.cancel();
    }

    setShape(shape) {
        this.activeShape = shape;
    }

    cancel() {
        this.dragging = false;
        this.dragBody = null;
        this.connectStart = null;
        this.launching = false;
        this.launchStart = null;
    }

    onMouseDown(worldPos, screenPos) {
        this.mouseWorld = worldPos;
        this.mouseScreen = screenPos;

        switch (this.activeTool) {
            case 'place': this._place(worldPos); break;
            case 'drag': this._startDrag(worldPos); break;
            case 'delete': this._delete(worldPos); break;
            case 'connect': this._startConnect(worldPos); break;
            case 'launch': this._startLaunch(worldPos); break;
        }
    }

    onMouseMove(worldPos, screenPos) {
        this.mouseWorld = worldPos;
        this.mouseScreen = screenPos;

        if (this.activeTool === 'drag' && this.dragging && this.dragBody) {
            this._doDrag(worldPos);
        }
    }

    onMouseUp(worldPos) {
        this.mouseWorld = worldPos;

        if (this.activeTool === 'drag') {
            this._endDrag();
        }
        if (this.activeTool === 'connect') {
            this._endConnect(worldPos);
        }
        if (this.activeTool === 'launch') {
            this._doLaunch(worldPos);
        }
    }

    // ---- 放置 ----
    _place(pos) {
        const body = createShape(this.activeShape, pos, { isStatic: this.isStatic });
        this.world.addBody(body);
        this.undoStack.push({ type: 'add', body });
        playPlace();
    }

    // ---- 拖拽 ----
    _startDrag(pos) {
        const body = this.world.getBodyAt(pos);
        if (body) {
            this.dragging = true;
            this.dragBody = body;
            this.dragOffset = Vec2.sub(body.pos, pos);
        }
    }

    _doDrag(pos) {
        if (!this.dragBody) return;
        const target = Vec2.add(pos, this.dragOffset);
        // 使用弹簧力拖拽
        const diff = Vec2.sub(target, this.dragBody.pos);
        this.dragBody.vel = Vec2.scale(diff, 10);
    }

    _endDrag() {
        this.dragging = false;
        this.dragBody = null;
    }

    // ---- 删除 ----
    _delete(pos) {
        const body = this.world.getBodyAt(pos);
        if (body) {
            this.world.removeBody(body);
            this.undoStack.push({ type: 'remove', body });
            playDelete();
        }
    }

    // ---- 连接 ----
    _startConnect(pos) {
        const body = this.world.getBodyAt(pos);
        if (body) {
            this.connectStart = body;
        }
    }

    _endConnect(pos) {
        if (!this.connectStart) return;
        const bodyB = this.world.getBodyAt(pos);
        if (bodyB && bodyB !== this.connectStart) {
            const constraint = new Constraint(this.connectType, this.connectStart, bodyB, {
                restLength: Vec2.dist(this.connectStart.pos, bodyB.pos),
            });
            this.world.addConstraint(constraint);
            this.undoStack.push({ type: 'constraint', constraint });
            playConnect();
        }
        this.connectStart = null;
    }

    // ---- 发射 ----
    _startLaunch(pos) {
        this.launchStart = Vec2.clone(pos);
        this.launching = true;
    }

    _doLaunch(pos) {
        if (!this.launchStart || !this.launching) return;
        const diff = Vec2.sub(this.launchStart, pos);
        const dist = Vec2.len(diff);
        const power = Math.min(LAUNCH.maxPower, dist * LAUNCH.powerScale);
        const dir = Vec2.normalize(diff);

        const body = createShape(this.activeShape, this.launchStart, { isStatic: false });
        body.vel = Vec2.scale(dir, power);
        this.world.addBody(body);
        this.undoStack.push({ type: 'add', body });
        playLaunch();

        this.launching = false;
        this.launchStart = null;
    }

    // ---- 撤销 ----
    undo() {
        if (this.undoStack.length === 0) return;
        const action = this.undoStack.pop();
        if (action.type === 'add') {
            this.world.removeBody(action.body);
        } else if (action.type === 'remove') {
            this.world.addBody(action.body);
        } else if (action.type === 'constraint') {
            this.world.removeConstraint(action.constraint);
        }
    }

    // 绘制连接预览线
    drawOverlay() {
        const { renderer, world } = this;
        const ctx = renderer.ctx;

        // 连接预览
        if (this.activeTool === 'connect' && this.connectStart) {
            const start = renderer.worldToScreen(this.connectStart.pos);
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(this.mouseScreen.x, this.mouseScreen.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 发射预览
        if (this.activeTool === 'launch' && this.launchStart && this.launching) {
            renderer.drawLaunchLine(this.launchStart, this.mouseWorld);
        }

        // 放置预览
        if (this.activeTool === 'place') {
            const sp = renderer.worldToScreen(this.mouseWorld);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            if (this.activeShape === 'circle') {
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 30 * renderer.camera.zoom, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                const size = 30 * renderer.camera.zoom;
                ctx.strokeRect(sp.x - size, sp.y - size * 0.66, size * 2, size * 1.33);
            }
            ctx.setLineDash([]);
        }
    }
}
