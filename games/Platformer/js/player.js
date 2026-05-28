// player.js - Player class
import { PW, PH, GRAVITY, SPEED, JUMP, WALL_JUMP_X, WALL_JUMP_Y, DASH_SPEED, DASH_DUR, DASH_CD, WALL_SLIDE, FRICTION, AIR_FRICTION, ICE_FRICTION, T, TILE } from './config.js';
import { Sound } from './sound.js';

export class Player {
    constructor(x, y) {
        this.spawnX = x; this.spawnY = y;
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.w = PW; this.h = PH;
        this.onGround = false;
        this.onWall = 0; // -1 left, 0 none, 1 right
        this.facing = 1;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDir = 1;
        this.crouching = false;
        this.slideTimer = 0;
        this.wallSlideTimer = 0;
        this.jumpBuffer = 0;
        this.coyoteTime = 0;
        this.alive = true;
        this.health = 3;
        this.maxHealth = 3;
        this.invincible = 0;
        this.coins = 0;
        this.stars = [false, false, false];
        this.keys = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.runParticles = 0;
        this.h = PH;
    }

    respawn() {
        this.x = this.spawnX; this.y = this.spawnY;
        this.vx = 0; this.vy = 0;
        this.alive = true;
        this.dashTimer = 0; this.dashCooldown = 0;
        this.crouching = false; this.slideTimer = 0;
        this.onWall = 0; this.wallSlideTimer = 0;
        this.invincible = 60;
        this.h = PH;
    }

    takeDamage(effects) {
        if (this.invincible > 0) return;
        this.health--;
        this.invincible = 90;
        effects.burst(this.x + this.w / 2, this.y + this.h / 2, 10, '#FF4444', 4, 4, 20);
        if (this.health <= 0) {
            this.alive = false;
            Sound.die();
            effects.death(this.x + this.w / 2, this.y + this.h / 2);
        }
    }

    update(input, level, effects) {
        if (!this.alive) return;
        if (this.invincible > 0) this.invincible--;
        if (this.dashCooldown > 0) this.dashCooldown--;

        const onIce = this._checkSurface(level) === 'ice';
        const onSand = this._checkSurface(level) === 'sand';
        const fric = onIce ? ICE_FRICTION : (this.onGround ? FRICTION : AIR_FRICTION);
        const spd = onSand ? SPEED * 0.5 : SPEED;

        // Crouch
        const wantCrouch = input.down && this.onGround;
        if (wantCrouch && !this.crouching) {
            this.crouching = true;
            this.h = PH * 0.6;
            this.y += PH * 0.4;
            if (Math.abs(this.vx) > 3) this.slideTimer = 15;
        } else if (!wantCrouch && this.crouching) {
            this.crouching = false;
            this.y -= PH * 0.4;
            this.h = PH;
        }

        // Slide
        if (this.slideTimer > 0) this.slideTimer--;

        // Dash
        if (this.dashTimer > 0) {
            this.vx = this.dashDir * DASH_SPEED;
            this.vy = 0;
            this.dashTimer--;
            effects.dashTrail(this.x + this.w / 2, this.y + this.h / 2);
            if (this.dashTimer === 0) this.vx *= 0.5;
        } else {
            // Movement
            if (input.left && this.slideTimer === 0) { this.vx -= spd * 0.3; this.facing = -1; }
            if (input.right && this.slideTimer === 0) { this.vx += spd * 0.3; this.facing = 1; }

            // Clamp speed
            const maxV = this.crouching ? spd * 0.3 : spd;
            if (Math.abs(this.vx) > maxV) this.vx = Math.sign(this.vx) * maxV;

            // Friction
            if (!input.left && !input.right) this.vx *= fric;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;

            // Wall slide
            this.onWall = 0;
            if (!this.onGround && this.vy > 0) {
                if (this._wallCheck(level, -1)) this.onWall = -1;
                else if (this._wallCheck(level, 1)) this.onWall = 1;
            }
            if (this.onWall !== 0 && this.vy > WALL_SLIDE) {
                this.vy = WALL_SLIDE;
                this.wallSlideTimer++;
            } else {
                this.wallSlideTimer = 0;
            }

            // Gravity
            this.vy += GRAVITY;
            if (this.vy > 14) this.vy = 14;

            // Coyote time
            if (this.onGround) this.coyoteTime = 6;
            else if (this.coyoteTime > 0) this.coyoteTime--;

            // Jump buffer
            if (input.jumpPressed) this.jumpBuffer = 8;
            else if (this.jumpBuffer > 0) this.jumpBuffer--;

            // Jump
            if (this.jumpBuffer > 0) {
                if (this.onWall !== 0) {
                    this.vx = -this.onWall * WALL_JUMP_X;
                    this.vy = WALL_JUMP_Y;
                    this.facing = -this.onWall;
                    this.jumpBuffer = 0;
                    this.onWall = 0;
                    Sound.wallJump();
                    effects.dust(this.x + this.w / 2, this.y + this.h);
                } else if (this.coyoteTime > 0) {
                    this.vy = JUMP * (this.crouching ? 0.7 : 1);
                    this.jumpBuffer = 0;
                    this.coyoteTime = 0;
                    Sound.jump();
                    effects.dust(this.x + this.w / 2, this.y + this.h);
                }
            }

            // Variable jump height
            if (!input.jump && this.vy < -3) this.vy *= 0.7;

            // Dash
            if (input.dashPressed && this.dashCooldown === 0 && this.dashTimer === 0) {
                this.dashTimer = DASH_DUR;
                this.dashCooldown = DASH_CD;
                this.dashDir = this.facing;
                this.vy = 0;
                Sound.dash();
            }
        }

        // Apply velocity and collide
        const wasOnGround = this.onGround;
        this._moveX(level);
        this._moveY(level, effects);

        // Run particles
        if (this.onGround && Math.abs(this.vx) > 2) {
            this.runParticles++;
            if (this.runParticles % 4 === 0) effects.dust(this.x + this.w / 2, this.y + this.h);
        } else {
            this.runParticles = 0;
        }

        // Animation
        this.animTimer++;
        if (this.animTimer > 6) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
    }

    _checkSurface(level) {
        const ty = Math.floor((this.y + this.h + 1) / TILE);
        const tx1 = Math.floor(this.x / TILE);
        const tx2 = Math.floor((this.x + this.w) / TILE);
        for (let tx = tx1; tx <= tx2; tx++) {
            const t = level.getTile(tx, ty);
            if (t === T.ICE) return 'ice';
            if (t === T.SAND) return 'sand';
        }
        return null;
    }

    _wallCheck(level, dir) {
        const cx = dir < 0 ? this.x - 1 : this.x + this.w;
        const ty1 = Math.floor((this.y + 2) / TILE);
        const ty2 = Math.floor((this.y + this.h - 2) / TILE);
        const tx = Math.floor(cx / TILE);
        for (let ty = ty1; ty <= ty2; ty++) {
            const t = level.getTile(tx, ty);
            if (t === T.SOLID || t === T.ICE || t === T.SAND) return true;
        }
        return false;
    }

    _moveX(level) {
        this.x += this.vx;
        const left = Math.floor(this.x / TILE);
        const right = Math.floor((this.x + this.w) / TILE);
        const top = Math.floor(this.y / TILE);
        const bot = Math.floor((this.y + this.h - 1) / TILE);
        for (let ty = top; ty <= bot; ty++) {
            for (let tx of [left, right]) {
                const t = level.getTile(tx, ty);
                if (t === T.SOLID || t === T.ICE || t === T.SAND) {
                    if (this.vx > 0) { this.x = tx * TILE - this.w; this.vx = 0; }
                    else if (this.vx < 0) { this.x = (tx + 1) * TILE; this.vx = 0; }
                }
            }
        }
    }

    _moveY(level, effects) {
        this.y += this.vy;
        this.onGround = false;
        const left = Math.floor(this.x / TILE);
        const right = Math.floor((this.x + this.w - 1) / TILE);
        const top = Math.floor(this.y / TILE);
        const bot = Math.floor((this.y + this.h) / TILE);
        for (let tx = left; tx <= right; tx++) {
            for (let ty of [top, bot]) {
                const t = level.getTile(tx, ty);
                const isSolid = t === T.SOLID || t === T.ICE || t === T.SAND;
                const isPlat = t === T.PLATFORM && this.vy >= 0 && (this.y + this.h - this.vy) <= ty * TILE + 4;
                if (isSolid || isPlat) {
                    if (this.vy > 0) {
                        this.y = ty * TILE - this.h;
                        if (this.vy > 6) { Sound.land(); effects.land(this.x + this.w / 2, this.y + this.h); }
                        this.vy = 0;
                        this.onGround = true;
                    } else if (this.vy < 0 && isSolid) {
                        this.y = (ty + 1) * TILE;
                        this.vy = 0;
                    }
                }
                // Hazards
                if (t === T.SPIKE || t === T.HAZARD) {
                    if (this._overlapsTile(tx, ty)) this.takeDamage(effects);
                }
            }
        }
        // Moving platform support
        for (const mp of level.movingPlatforms) {
            if (this.vy >= 0 && this._overlapsMovingPlatform(mp)) {
                this.y = mp.y - this.h;
                if (this.vy > 6) { Sound.land(); effects.land(this.x + this.w / 2, this.y + this.h); }
                this.vy = 0;
                this.onGround = true;
                this.x += mp.vx || 0;
            }
        }
    }

    _overlapsTile(tx, ty) {
        return this.x + this.w > tx * TILE + 2 && this.x < (tx + 1) * TILE - 2 &&
               this.y + this.h > ty * TILE + 2 && this.y < (ty + 1) * TILE - 2;
    }

    _overlapsMovingPlatform(mp) {
        return this.x + this.w > mp.x && this.x < mp.x + mp.w &&
               this.y + this.h >= mp.y && this.y + this.h <= mp.y + mp.h + 6 && this.y + this.h > mp.y;
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        if (this.invincible > 0 && this.invincible % 6 < 3) return;
        const x = this.x - camX;
        const y = this.y - camY;
        const c = this.dashTimer > 0 ? '#88DDFF' : '#44AAFF';

        // Body
        ctx.fillStyle = c;
        const bh = this.crouching ? PH * 0.6 : PH;
        const by = this.crouching ? y + PH * 0.4 : y;
        ctx.beginPath();
        ctx.roundRect(x + 2, by + 2, this.w - 4, bh - 4, 4);
        ctx.fill();

        // Face
        const ey = by + 6;
        const ex1 = this.facing > 0 ? x + 8 : x + 5;
        const ex2 = this.facing > 0 ? x + 14 : x + 11;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(ex1, ey, 4, 4);
        ctx.fillRect(ex2, ey, 4, 4);
        ctx.fillStyle = '#222';
        ctx.fillRect(ex1 + (this.facing > 0 ? 1 : 0), ey + 1, 2, 2);
        ctx.fillRect(ex2 + (this.facing > 0 ? 1 : 0), ey + 1, 2, 2);

        // Legs animation
        if (this.onGround && Math.abs(this.vx) > 0.5 && !this.crouching) {
            ctx.fillStyle = '#3388DD';
            const legOff = Math.sin(this.animFrame * Math.PI / 2) * 3;
            ctx.fillRect(x + 4, y + bh - 2, 4, 2 + legOff);
            ctx.fillRect(x + this.w - 8, y + bh - 2, 4, 2 - legOff);
        }

        // Wall slide indicator
        if (this.onWall !== 0 && !this.onGround) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            const wx = this.onWall < 0 ? x - 2 : x + this.w;
            ctx.fillRect(wx, y + 4, 2, this.h - 8);
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
