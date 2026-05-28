// ============================================================
// main.js — 游戏主循环、事件监听、物理步进、预设场景
// ============================================================

import { World, Vec2, Constraint } from './physics.js';
import { Renderer } from './renderer.js';
import { ToolManager } from './tools.js';
import { UI } from './ui.js';
import { createShape, createCircle, createRectangle, createTriangle } from './shapes.js';
import { COLORS } from './config.js';
import { playClick } from './sound.js';

// ======================== 初始化 ========================
const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const world = new World();
const toolManager = new ToolManager(world, renderer);
const ui = new UI(toolManager, world, renderer);

renderer.resize();

// ======================== 预设场景 ========================
function loadScene(name) {
    world.clear();
    ui.selectedBody = null;
    toolManager.undoStack = [];

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // 地面
    const ground = createRectangle({ x: cx, y: canvas.height - 30 }, {
        width: canvas.width + 200,
        height: 60,
        isStatic: true,
        color: '#555',
    });
    world.addBody(ground);

    // 左墙
    const leftWall = createRectangle({ x: -10, y: cy }, {
        width: 20,
        height: canvas.height + 200,
        isStatic: true,
        color: '#555',
    });
    world.addBody(leftWall);

    // 右墙
    const rightWall = createRectangle({ x: canvas.width + 10, y: cy }, {
        width: 20,
        height: canvas.height + 200,
        isStatic: true,
        color: '#555',
    });
    world.addBody(rightWall);

    if (name === 'blank') return;

    if (name === 'domino') {
        for (let i = 0; i < 12; i++) {
            const domino = createRectangle(
                { x: cx - 300 + i * 50, y: canvas.height - 90 },
                { width: 12, height: 60, color: '#E0E0E0' }
            );
            world.addBody(domino);
        }
        // 触发球
        const ball = createCircle({ x: cx - 340, y: canvas.height - 100 }, {
            radius: 20,
            color: COLORS.circle,
        });
        ball.vel.x = 200;
        world.addBody(ball);
        return;
    }

    if (name === 'pinball') {
        // 挡板
        const bumpers = [
            { x: cx - 100, y: cy - 100 },
            { x: cx + 100, y: cy - 100 },
            { x: cx, y: cy - 200 },
            { x: cx - 180, y: cy + 50 },
            { x: cx + 180, y: cy + 50 },
        ];
        for (const bp of bumpers) {
            const bumper = createCircle(bp, {
                radius: 30,
                isStatic: true,
                restitution: 1.2,
                color: '#FF9F43',
            });
            world.addBody(bumper);
        }
        // 弹球
        for (let i = 0; i < 5; i++) {
            const ball = createCircle({
                x: cx + (Math.random() - 0.5) * 200,
                y: cy - 300 - i * 40,
            }, {
                radius: 12 + Math.random() * 8,
                color: `hsl(${i * 60}, 80%, 60%)`,
            });
            ball.vel.x = (Math.random() - 0.5) * 200;
            world.addBody(ball);
        }
        // 弹射器底板
        const flipper = createRectangle(
            { x: cx, y: canvas.height - 80 },
            { width: 200, height: 15, isStatic: true, restitution: 1.5, color: '#4ECDC4' }
        );
        world.addBody(flipper);
        return;
    }

    if (name === 'chain') {
        // 链式反应：大球撞小球群
        const bigBall = createCircle({ x: cx - 300, y: cy - 100 }, {
            radius: 50,
            color: '#FF6B6B',
        });
        bigBall.vel = { x: 400, y: 0 };
        world.addBody(bigBall);

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                const ball = createCircle({
                    x: cx + col * 50 - 75,
                    y: cy - 100 + row * 50,
                }, {
                    radius: 15,
                    color: `hsl(${(row * 6 + col) * 20}, 70%, 60%)`,
                });
                world.addBody(ball);
            }
        }

        // 弹簧连接列
        const springBalls = [];
        for (let i = 0; i < 6; i++) {
            const b = createCircle({ x: cx + 200, y: cy - 150 + i * 60 }, {
                radius: 18,
                color: COLORS.spring,
            });
            world.addBody(b);
            springBalls.push(b);
        }
        for (let i = 0; i < springBalls.length - 1; i++) {
            world.addConstraint(new Constraint('spring', springBalls[i], springBalls[i + 1], {
                restLength: 50,
                stiffness: 80,
                damping: 8,
            }));
        }
    }
}

// ======================== 事件监听 ========================
function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('mousedown', (e) => {
    const screenPos = getCanvasPos(e);
    const worldPos = renderer.screenToWorld(screenPos);

    // 右键选择物体查看属性
    if (e.button === 2) {
        const body = world.getBodyAt(worldPos);
        ui.selectBody(body);
        ui.drawProperties();
        return;
    }

    toolManager.onMouseDown(worldPos, screenPos);
});

canvas.addEventListener('mousemove', (e) => {
    const screenPos = getCanvasPos(e);
    const worldPos = renderer.screenToWorld(screenPos);
    toolManager.onMouseMove(worldPos, screenPos);
});

canvas.addEventListener('mouseup', (e) => {
    const screenPos = getCanvasPos(e);
    const worldPos = renderer.screenToWorld(screenPos);
    toolManager.onMouseUp(worldPos);
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// 缩放
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const screenPos = getCanvasPos(e);
    const worldBefore = renderer.screenToWorld(screenPos);

    renderer.camera.zoom = Math.max(0.2, Math.min(5, renderer.camera.zoom * zoomFactor));

    const worldAfter = renderer.screenToWorld(screenPos);
    renderer.camera.x += worldAfter.x - worldBefore.x;
    renderer.camera.y += worldAfter.y - worldBefore.y;
}, { passive: false });

// 平移（中键或右键+拖拽）
let panStart = null;
let panCamStart = null;
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        panStart = { x: e.clientX, y: e.clientY };
        panCamStart = { x: renderer.camera.x, y: renderer.camera.y };
    }
});
window.addEventListener('mousemove', (e) => {
    if (panStart) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        renderer.camera.x = panCamStart.x + dx / renderer.camera.zoom;
        renderer.camera.y = panCamStart.y + dy / renderer.camera.zoom;
    }
});
window.addEventListener('mouseup', (e) => {
    if (e.button === 1) panStart = null;
});

// 键盘快捷键
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toolManager.undo();
    }
    if (key === 'z' && !e.ctrlKey && !e.metaKey) toolManager.undo();
    if (key === '1') toolManager.setTool('place');
    if (key === '2') toolManager.setTool('drag');
    if (key === '3') toolManager.setTool('delete');
    if (key === '4') toolManager.setTool('connect');
    if (key === '5') toolManager.setTool('launch');
    if (key === 'q') toolManager.setShape('circle');
    if (key === 'w') toolManager.setShape('rectangle');
    if (key === 'e') toolManager.setShape('triangle');
    if (key === 'r') toolManager.setShape('polygon');
    if (key === ' ') {
        e.preventDefault();
        ui.paused = !ui.paused;
        const chk = document.getElementById('chk-pause');
        if (chk) chk.checked = ui.paused;
    }
    if (key === 'escape') toolManager.cancel();
});

// 场景按钮
document.getElementById('scene-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.scene-btn');
    if (btn) {
        playClick();
        loadScene(btn.dataset.scene);
    }
});

// 窗口缩放
window.addEventListener('resize', () => renderer.resize());

// ======================== 主循环 ========================
let lastTime = 0;
let fps = 0;
let frameCount = 0;
let fpsTimer = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // FPS
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 1) {
        fps = frameCount;
        frameCount = 0;
        fpsTimer = 0;
    }

    // 物理
    if (!ui.paused) {
        world.step(dt);
    }

    // 渲染
    renderer.clear();
    renderer.drawGrid();
    renderer.drawTrails(world.bodies);
    renderer.drawConstraints(world.constraints);

    for (const body of world.bodies) {
        renderer.drawBody(body, body === ui.selectedBody);
    }

    renderer.drawParticles(world.particles);
    toolManager.drawOverlay();
    renderer.drawFPS(fps);
    renderer.drawBodyCount(world.bodies.length);

    // 属性面板更新
    if (ui.selectedBody) {
        ui.drawProperties();
    }

    requestAnimationFrame(gameLoop);
}

// ======================== 启动 ========================
loadScene('blank');
requestAnimationFrame(gameLoop);
