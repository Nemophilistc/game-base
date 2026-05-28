// items.js - Falling items (coins, power-ups, bombs)

import { GAME_WIDTH, ITEM_TYPES, ITEM_SIZE, MAGNET_RANGE, MAGNET_STRENGTH } from './config.js';

const ALL_ITEMS = Object.values(ITEM_TYPES);

export class FallingItem {
    constructor(type, x, fallSpeed) {
        this.type = type;
        this.x = x;
        this.y = -type.size;
        this.size = type.size;
        this.speed = fallSpeed * (0.85 + Math.random() * 0.3);
        this.baseSpeed = this.speed;
        this.alive = true;
        this.caught = false;
        this.missed = false;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 3;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 2 + Math.random() * 2;
        this.wobbleAmp = 15 + Math.random() * 10;
        this.baseX = x;
        this.shimmerPhase = Math.random() * Math.PI * 2;
        this.glowPulse = 0;
        this.magnetized = false;
        this.slowFactor = 1;
    }

    get bounds() {
        return {
            left: this.x - this.size / 2,
            right: this.x + this.size / 2,
            top: this.y - this.size / 2,
            bottom: this.y + this.size / 2,
        };
    }

    update(dt, player, isSlowedGlobal) {
        this.glowPulse += dt * 4;
        this.shimmerPhase += dt * 3;
        this.rotation += this.rotSpeed * dt;
        this.wobble += this.wobbleSpeed * dt;

        // Wobble movement
        const wobbleX = Math.sin(this.wobble) * this.wobbleAmp * dt;

        // Magnet pull
        if (player.hasMagnet && !this.type.danger) {
            const dx = player.centerX - this.x;
            const dy = player.centerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAGNET_RANGE && dist > 0) {
                const pull = MAGNET_STRENGTH / dist;
                this.x += (dx / dist) * pull * dt;
                this.y += (dy / dist) * pull * dt;
                this.magnetized = true;
            } else {
                this.magnetized = false;
            }
        } else {
            this.magnetized = false;
        }

        // Fall speed with slow power-up
        let effectiveSpeed = this.speed * this.slowFactor;
        if (isSlowedGlobal) {
            effectiveSpeed *= 0.5;
        }

        this.x += wobbleX;
        this.y += effectiveSpeed * dt;

        // Clamp x
        this.x = Math.max(this.size / 2, Math.min(GAME_WIDTH - this.size / 2, this.x));

        // Check if fallen past screen
        if (this.y > 650) {
            this.alive = false;
            this.missed = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const isDanger = this.type.danger;
        const isPowerUp = !!this.type.powerUp;

        // Glow effect
        const glowSize = this.size + 8 + Math.sin(this.glowPulse) * 3;
        if (isDanger) {
            ctx.shadowColor = this.type.glow;
            ctx.shadowBlur = 15 + Math.sin(this.glowPulse * 2) * 5;
        } else if (isPowerUp) {
            ctx.shadowColor = this.type.glow;
            ctx.shadowBlur = 12;
        } else {
            ctx.shadowColor = this.type.glow;
            ctx.shadowBlur = 8 + Math.sin(this.shimmerPhase) * 4;
        }

        ctx.rotate(this.rotation);

        // Draw based on type
        switch (this.type.id) {
            case 'gold_coin':
            case 'silver_coin':
                this._drawCoin(ctx);
                break;
            case 'diamond':
                this._drawDiamond(ctx);
                break;
            case 'star':
                this._drawStar(ctx);
                break;
            case 'bomb':
                this._drawBomb(ctx);
                break;
            case 'rock':
                this._drawRock(ctx);
                break;
            case 'magnet':
                this._drawMagnet(ctx);
                break;
            case 'shield':
                this._drawShield(ctx);
                break;
            case 'slow':
                this._drawSlow(ctx);
                break;
            default:
                this._drawCircle(ctx);
        }

        ctx.shadowBlur = 0;
        ctx.restore();

        // Magnetized indicator
        if (this.magnetized) {
            ctx.save();
            ctx.strokeStyle = 'rgba(244, 67, 54, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    _drawCoin(ctx) {
        const r = this.size / 2;
        const isGold = this.type.id === 'gold_coin';

        // Coin body
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        if (isGold) {
            grad.addColorStop(0, '#FFF176');
            grad.addColorStop(0.4, '#FFD700');
            grad.addColorStop(1, '#FFA000');
        } else {
            grad.addColorStop(0, '#E8E8E8');
            grad.addColorStop(0.4, '#C0C0C0');
            grad.addColorStop(1, '#9E9E9E');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer highlight
        const shimmerAngle = this.shimmerPhase;
        const shimmerX = Math.cos(shimmerAngle) * r * 0.3;
        const shimmerY = Math.sin(shimmerAngle) * r * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(this.shimmerPhase) * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(shimmerX, shimmerY, r * 0.5, r * 0.3, shimmerAngle, 0, Math.PI * 2);
        ctx.fill();

        // Dollar sign
        ctx.fillStyle = isGold ? 'rgba(180,120,0,0.6)' : 'rgba(100,100,100,0.6)';
        ctx.font = `bold ${r * 1.1}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);

        // Edge ring
        ctx.strokeStyle = isGold ? 'rgba(255,200,0,0.5)' : 'rgba(200,200,200,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawDiamond(ctx) {
        const s = this.size / 2;
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, '#B3E5FC');
        grad.addColorStop(0.3, '#00E5FF');
        grad.addColorStop(0.6, '#00B8D4');
        grad.addColorStop(1, '#006064');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.8, -s * 0.2);
        ctx.lineTo(s, s * 0.3);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, s * 0.3);
        ctx.lineTo(-s * 0.8, -s * 0.2);
        ctx.closePath();
        ctx.fill();

        // Facets
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s);
        ctx.moveTo(-s * 0.8, -s * 0.2);
        ctx.lineTo(s * 0.8, -s * 0.2);
        ctx.stroke();

        // Sparkle
        const sp = Math.sin(this.shimmerPhase * 2) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,255,255,${sp * 0.8})`;
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.3, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawStar(ctx) {
        const outer = this.size / 2;
        const inner = outer * 0.4;
        const spikes = 5;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, outer);
        grad.addColorStop(0, '#FFF9C4');
        grad.addColorStop(0.5, '#FFD600');
        grad.addColorStop(1, '#FF6F00');

        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Glow ring
        ctx.strokeStyle = `rgba(255,200,0,${0.3 + Math.sin(this.glowPulse) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, outer + 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawBomb(ctx) {
        const r = this.size / 2;

        // Body
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        grad.addColorStop(0, '#616161');
        grad.addColorStop(0.5, '#333333');
        grad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 2, r, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -r + 2);
        ctx.quadraticCurveTo(r * 0.5, -r - 5, r * 0.3, -r - 8);
        ctx.stroke();

        // Fuse spark
        const sparkT = Date.now() / 100;
        ctx.fillStyle = `rgba(255,${150 + Math.sin(sparkT) * 100},0,${0.7 + Math.sin(sparkT * 3) * 0.3})`;
        ctx.beginPath();
        ctx.arc(r * 0.3, -r - 8, 3 + Math.sin(sparkT) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Danger glow
        ctx.strokeStyle = `rgba(244,67,54,${0.3 + Math.sin(this.glowPulse * 2) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, r + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Skull symbol
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `${r * 0.9}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', 0, 3);
    }

    _drawRock(ctx) {
        const s = this.size / 2;
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, s * 0.3);
        ctx.lineTo(-s * 0.5, -s * 0.7);
        ctx.lineTo(s * 0.2, -s);
        ctx.lineTo(s * 0.9, -s * 0.3);
        ctx.lineTo(s * 0.7, s * 0.6);
        ctx.lineTo(-s * 0.1, s);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.7);
        ctx.lineTo(s * 0.2, -s);
        ctx.lineTo(s * 0.1, -s * 0.2);
        ctx.lineTo(-s * 0.4, 0);
        ctx.closePath();
        ctx.fill();

        // Danger indicator
        ctx.strokeStyle = `rgba(244,67,54,${0.2 + Math.sin(this.glowPulse) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, s + 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawMagnet(ctx) {
        const s = this.size / 2;
        // U-shape magnet
        ctx.lineWidth = s * 0.5;
        ctx.lineCap = 'round';

        // Red half
        ctx.strokeStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        // Blue half
        ctx.strokeStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        // Poles
        ctx.fillStyle = '#F44336';
        ctx.fillRect(-s * 0.8, -s * 0.3, s * 0.35, s * 0.6);
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(s * 0.45, -s * 0.3, s * 0.35, s * 0.6);
    }

    _drawShield(ctx) {
        const s = this.size / 2;
        ctx.fillStyle = '#42A5F5';
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.9, -s * 0.4);
        ctx.lineTo(s * 0.7, s * 0.6);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.7, s * 0.6);
        ctx.lineTo(-s * 0.9, -s * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1E88E5';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.5);
        ctx.lineTo(s * 0.4, -s * 0.2);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s * 0.5);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s * 0.4, -s * 0.2);
        ctx.closePath();
        ctx.fill();

        // Check mark
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, 0);
        ctx.lineTo(-s * 0.05, s * 0.2);
        ctx.lineTo(s * 0.25, -s * 0.2);
        ctx.stroke();
    }

    _drawSlow(ctx) {
        const s = this.size / 2;
        // Clock icon
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Clock hands
        const t = Date.now() / 1000;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(t) * s * 0.4, Math.sin(t) * s * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(t * 0.2) * s * 0.25, Math.sin(t * 0.2) * s * 0.25);
        ctx.stroke();
    }

    _drawCircle(ctx) {
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class ItemSpawner {
    constructor() {
        this.spawnTimer = 0;
        this.difficultyTime = 0;
    }

    getSpawnInterval(elapsed) {
        const base = 1200 - elapsed * 0.003;
        return Math.max(350, base);
    }

    getFallSpeed(elapsed) {
        return 120 + elapsed * 0.08;
    }

    getWeights(elapsed) {
        // Increase bomb weight over time
        const bombBonus = Math.min(15, elapsed * 0.005);
        const rockBonus = Math.min(8, elapsed * 0.003);
        const powerUpBonus = Math.min(2, elapsed * 0.001);

        return ALL_ITEMS.map(item => {
            if (item.id === 'bomb') return item.weight + bombBonus;
            if (item.id === 'rock') return item.weight + rockBonus;
            if (item.powerUp) return item.weight + powerUpBonus;
            return item.weight;
        });
    }

    pickItemType(elapsed) {
        const weights = this.getWeights(elapsed);
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < ALL_ITEMS.length; i++) {
            r -= weights[i];
            if (r <= 0) return ALL_ITEMS[i];
        }
        return ALL_ITEMS[0];
    }

    spawn(elapsed, items) {
        const interval = this.getSpawnInterval(elapsed);
        this.spawnTimer += 16.67; // approximate, actual dt used in update

        if (this.spawnTimer >= interval && items.length < 12) {
            this.spawnTimer = 0;
            const type = this.pickItemType(elapsed);
            const x = 40 + Math.random() * (GAME_WIDTH - 80);
            const speed = this.getFallSpeed(elapsed);
            return new FallingItem(type, x, speed);
        }
        return null;
    }

    update(dt, elapsed, items) {
        this.spawnTimer += dt * 1000;
        const interval = this.getSpawnInterval(elapsed);

        const spawned = [];
        while (this.spawnTimer >= interval && items.length + spawned.length < 12) {
            this.spawnTimer -= interval;
            const type = this.pickItemType(elapsed);
            const x = 40 + Math.random() * (GAME_WIDTH - 80);
            const speed = this.getFallSpeed(elapsed);
            spawned.push(new FallingItem(type, x, speed));
        }
        return spawned;
    }

    reset() {
        this.spawnTimer = 0;
    }
}
