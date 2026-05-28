// ============================================================
// renderer.js — 渲染系统
// ============================================================

import { COLORS, RENDERING } from './config.js';
import { Vec2 } from './physics.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.showVelocity = RENDERING.showVelocity;
        this.showTrails = RENDERING.showTrails;
        this.showGrid = RENDERING.showGrid;
        this.camera = { x: 0, y: 0, zoom: 1 };
    }

    clear() {
        const { ctx, canvas } = this;
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawGrid() {
        if (!this.showGrid) return;
        const { ctx, canvas, camera } = this;
        const step = 40 * camera.zoom;
        const offsetX = (camera.x * camera.zoom) % step;
        const offsetY = (camera.y * camera.zoom) % step;

        ctx.lineWidth = 1;
        // 小网格
        ctx.strokeStyle = COLORS.grid;
        ctx.beginPath();
        for (let x = offsetX; x < canvas.width; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = offsetY; y < canvas.height; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        // 大网格
        const bigStep = step * 5;
        const bigOffX = (camera.x * camera.zoom) % bigStep;
        const bigOffY = (camera.y * camera.zoom) % bigStep;
        ctx.strokeStyle = COLORS.gridMajor;
        ctx.beginPath();
        for (let x = bigOffX; x < canvas.width; x += bigStep) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = bigOffY; y < canvas.height; y += bigStep) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    }

    worldToScreen(pos) {
        return {
            x: (pos.x + this.camera.x) * this.camera.zoom,
            y: (pos.y + this.camera.y) * this.camera.zoom,
        };
    }

    screenToWorld(pos) {
        return {
            x: pos.x / this.camera.zoom - this.camera.x,
            y: pos.y / this.camera.zoom - this.camera.y,
        };
    }

    drawBody(body, selected = false) {
        const { ctx } = this;
        const sp = this.worldToScreen(body.pos);
        const z = this.camera.zoom;

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(body.angle);
        ctx.scale(z, z);

        // 填充
        ctx.fillStyle = body.color;
        ctx.strokeStyle = selected ? COLORS.selected : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = selected ? 2.5 : 1.2;

        if (body.shape === 'circle') {
            const r = body.shapeData.radius || 20;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // 旋转指示线
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(r * 0.8, 0);
            ctx.stroke();
        } else if (body.shape === 'rectangle') {
            const w = body.shapeData.width || 60;
            const h = body.shapeData.height || 40;
            ctx.beginPath();
            ctx.rect(-w / 2, -h / 2, w, h);
            ctx.fill();
            ctx.stroke();
        } else if (body.shape === 'triangle') {
            const s = body.shapeData.size || 50;
            const h = s * Math.sqrt(3) / 2;
            ctx.beginPath();
            ctx.moveTo(0, -h * 2 / 3);
            ctx.lineTo(-s / 2, h / 3);
            ctx.lineTo(s / 2, h / 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (body.shape === 'polygon') {
            const sides = body.shapeData.sides || 5;
            const r = body.shapeData.radius || 40;
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // 静态物体标记
        if (body.isStatic) {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            const aabb = body.getAABB();
            const hw = (aabb.maxX - aabb.minX) / 2;
            const hh = (aabb.maxY - aabb.minY) / 2;
            ctx.beginPath();
            ctx.rect(-hw, -hh, hw * 2, hh * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();

        // 速度矢量
        if (this.showVelocity && !body.isStatic) {
            const speed = Vec2.len(body.vel);
            if (speed > 5) {
                const dir = Vec2.normalize(body.vel);
                const len = Math.min(speed * 0.15, 60);
                const end = Vec2.add(sp, Vec2.scale(dir, len));
                ctx.strokeStyle = COLORS.velocity;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(sp.x, sp.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
                // 箭头
                const arrowSize = 6;
                const angle = Math.atan2(dir.y, dir.x);
                ctx.beginPath();
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(
                    end.x - arrowSize * Math.cos(angle - 0.4),
                    end.y - arrowSize * Math.sin(angle - 0.4)
                );
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(
                    end.x - arrowSize * Math.cos(angle + 0.4),
                    end.y - arrowSize * Math.sin(angle + 0.4)
                );
                ctx.stroke();
            }
        }
    }

    drawTrails(bodies) {
        if (!this.showTrails) return;
        const { ctx } = this;

        for (const body of bodies) {
            if (body.isStatic || body.trail.length < 2) continue;
            ctx.strokeStyle = COLORS.trail;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const first = this.worldToScreen(body.trail[0]);
            ctx.moveTo(first.x, first.y);
            for (let i = 1; i < body.trail.length; i++) {
                const p = this.worldToScreen(body.trail[i]);
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }
    }

    drawConstraints(constraints) {
        const { ctx } = this;

        for (const c of constraints) {
            if (c.broken) continue;
            const pA = this.worldToScreen(Vec2.add(c.bodyA.pos, Vec2.rotate(c.anchorA, c.bodyA.angle)));
            const pB = this.worldToScreen(Vec2.add(c.bodyB.pos, Vec2.rotate(c.anchorB, c.bodyB.angle)));

            ctx.lineWidth = 2;
            if (c.type === 'spring') {
                // 锯齿形弹簧
                ctx.strokeStyle = COLORS.spring;
                const dx = pB.x - pA.x;
                const dy = pB.y - pA.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const coils = 12;
                const amp = 8;
                ctx.beginPath();
                ctx.moveTo(pA.x, pA.y);
                for (let i = 1; i <= coils; i++) {
                    const t = i / coils;
                    const mx = pA.x + dx * t;
                    const my = pA.y + dy * t;
                    const nx = -dy / len;
                    const ny = dx / len;
                    const off = (i % 2 === 0 ? 1 : -1) * amp;
                    ctx.lineTo(mx + nx * off, my + ny * off);
                }
                ctx.lineTo(pB.x, pB.y);
                ctx.stroke();
            } else if (c.type === 'rope') {
                ctx.strokeStyle = COLORS.rope;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(pA.x, pA.y);
                ctx.lineTo(pB.x, pB.y);
                ctx.stroke();
                ctx.setLineDash([]);
                // 端点
                ctx.fillStyle = COLORS.rope;
                ctx.beginPath();
                ctx.arc(pA.x, pA.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(pB.x, pB.y, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (c.type === 'hinge') {
                ctx.strokeStyle = COLORS.hinge;
                ctx.beginPath();
                ctx.moveTo(pA.x, pA.y);
                ctx.lineTo(pB.x, pB.y);
                ctx.stroke();
                // 铰链点
                ctx.fillStyle = COLORS.hinge;
                const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
                ctx.beginPath();
                ctx.arc(mid.x, mid.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawParticles(particles) {
        const { ctx } = this;
        for (const p of particles) {
            const sp = this.worldToScreen(p.pos);
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, p.size * this.camera.zoom, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawLaunchLine(start, end) {
        const { ctx } = this;
        const s = this.worldToScreen(start);
        const e = this.worldToScreen(end);

        // 蓄力线
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(1, dist / 200);

        ctx.strokeStyle = `hsl(${120 - power * 120}, 100%, 60%)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 力度指示
        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        ctx.fillText(`力度: ${Math.floor(power * 100)}%`, e.x + 10, e.y - 10);
    }

    drawFPS(fps) {
        const { ctx, canvas } = this;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`FPS: ${fps}`, canvas.width - 10, 20);
        ctx.textAlign = 'left';
    }

    drawBodyCount(count) {
        const { ctx, canvas } = this;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`物体: ${count}`, canvas.width - 10, 36);
        ctx.textAlign = 'left';
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
