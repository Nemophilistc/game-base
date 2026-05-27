// effects.js - Visual effects: particles, arrows, animations

export class EffectsManager {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.arrow = null;
        this.pulseTime = 0;
    }

    /**
     * Add particle burst effect (for territory capture)
     */
    addCaptureEffect(x, y, color) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + Math.random() * 0.015,
                color,
                size: 2 + Math.random() * 5
            });
        }
    }

    /**
     * Add floating text effect (e.g., "+3 dice")
     */
    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x, y,
            text,
            color,
            life: 1,
            decay: 0.012,
            vy: -0.8
        });
    }

    /**
     * Set attack arrow
     */
    setArrow(fromX, fromY, toX, toY, color) {
        this.arrow = { fromX, fromY, toX, toY, color };
    }

    /**
     * Clear attack arrow
     */
    clearArrow() {
        this.arrow = null;
    }

    /**
     * Update all effects
     */
    update() {
        this.pulseTime += 0.05;

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= p.decay;
            return p.life > 0;
        });

        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y += t.vy;
            t.life -= t.decay;
            return t.life > 0;
        });
    }

    /**
     * Render all effects on canvas
     */
    render(ctx, offsetX, offsetY) {
        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Render particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Render floating texts
        for (const t of this.floatingTexts) {
            ctx.globalAlpha = t.life;
            ctx.fillStyle = t.color;
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.globalAlpha = 1;

        // Render arrow
        if (this.arrow) {
            this.drawArrow(ctx, this.arrow);
        }

        ctx.restore();
    }

    /**
     * Draw an attack arrow
     */
    drawArrow(ctx, arrow) {
        const { fromX, fromY, toX, toY, color } = arrow;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return;

        const nx = dx / len;
        const ny = dy / len;

        // Shorten to not overlap with territory centers
        const margin = 25;
        const startX = fromX + nx * margin;
        const startY = fromY + ny * margin;
        const endX = toX - nx * margin;
        const endY = toY - ny * margin;

        // Animated dash offset
        const dashOffset = (Date.now() / 30) % 20;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -dashOffset;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const headLen = 14;
        const angle = Math.atan2(endY - startY, endX - startX);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLen * Math.cos(angle - 0.4),
            endY - headLen * Math.sin(angle - 0.4)
        );
        ctx.lineTo(
            endX - headLen * Math.cos(angle + 0.4),
            endY - headLen * Math.sin(angle + 0.4)
        );
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Check if any animations are active
     */
    hasActiveAnimations() {
        return this.particles.length > 0 || this.floatingTexts.length > 0;
    }
}
