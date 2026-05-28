// player.js - Player movement, jumping, climbing, attacking
import {
    TILE, GRAVITY, MAX_FALL_SPEED, PLAYER_SPEED, PLAYER_JUMP,
    PLAYER_WALL_JUMP_X, PLAYER_WALL_JUMP_Y, PLAYER_CLIMB_SPEED,
    FRICTION, AIR_FRICTION, PLAYER_HP, START_ROPES, START_BOMBS,
    INVULN_TIME, LEDGE_GRAB_TIME, ROPE_LENGTH, BOMB_FUSE, BOMB_RADIUS,
    BOMB_POWER, T, COLORS
} from './config.js';
import { Sound } from './sound.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = 16;
        this.h = 26;
        this.hp = PLAYER_HP;
        this.maxHp = PLAYER_HP;
        this.ropes = START_ROPES;
        this.bombs = START_BOMBS;
        this.gold = 0;
        this.hasKey = false;
        this.facing = 1; // 1 = right, -1 = left
        this.grounded = false;
        this.onLadder = false;
        this.climbing = false;
        this.wallSliding = false;
        this.ledgeGrabbing = false;
        this.ledgeGrabTimer = 0;
        this.invulnTimer = 0;
        this.dead = false;
        this.wasGrounded = false;
        this.jumping = false;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.whipping = false;
        this.whipTimer = 0;
        this.whipHit = false;
        this.whipX = 0;
        this.whipY = 0;
        this.whipW = 0;
        this.whipH = 0;

        // Powerups
        this.hasCompass = false;
        this.hasGloves = false;
        this.hasShoes = false;

        // Active ropes and bombs
        this.activeRopes = [];
        this.activeBombs = [];

        // Input state
        this.input = {
            left: false, right: false, up: false, down: false,
            jump: false, jumpPressed: false,
            action: false, actionPressed: false,
            bomb: false, bombPressed: false,
            rope: false, ropePressed: false,
            whip: false, whipPressed: false,
        };

        // Coyote time
        this.coyoteTime = 0;
        this.coyoteMax = 80; // ms

        // Jump buffer
        this.jumpBuffer = 0;
        this.jumpBufferMax = 100;

        this._setupInput();
    }

    _setupInput() {
        const keyMap = {
            'ArrowLeft': 'left', 'KeyA': 'left',
            'ArrowRight': 'right', 'KeyD': 'right',
            'ArrowUp': 'up', 'KeyW': 'up',
            'ArrowDown': 'down', 'KeyS': 'down',
            'Space': 'jump',
            'KeyX': 'action',
            'KeyZ': 'bomb',
            'KeyC': 'rope',
            'ShiftLeft': 'whip', 'KeyV': 'whip',
        };

        window.addEventListener('keydown', (e) => {
            const action = keyMap[e.code];
            if (action) {
                e.preventDefault();
                if (!this.input[action]) {
                    if (action === 'jump') this.input.jumpPressed = true;
                    if (action === 'action') this.input.actionPressed = true;
                    if (action === 'bomb') this.input.bombPressed = true;
                    if (action === 'rope') this.input.ropePressed = true;
                    if (action === 'whip') this.input.whipPressed = true;
                    // ArrowUp/KeyW also trigger jump
                    if (action === 'up') this.input.jumpPressed = true;
                }
                this.input[action] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const action = keyMap[e.code];
            if (action) {
                e.preventDefault();
                this.input[action] = false;
            }
        });
    }

    update(dt, level, sounds) {
        if (this.dead) return;

        const dtScale = dt / 16.667;

        // Invulnerability
        if (this.invulnTimer > 0) this.invulnTimer -= dt;

        // Coyote time
        if (this.grounded) {
            this.coyoteTime = this.coyoteMax;
        } else if (this.coyoteTime > 0) {
            this.coyoteTime -= dt;
        }

        // Jump buffer
        if (this.input.jumpPressed) this.jumpBuffer = this.jumpBufferMax;
        if (this.jumpBuffer > 0) this.jumpBuffer -= dt;

        // Ledge grab timer
        if (this.ledgeGrabbing) {
            this.ledgeGrabTimer -= dt;
            if (this.ledgeGrabTimer <= 0) this.ledgeGrabbing = false;
        }

        // Whip
        if (this.whipping) {
            this.whipTimer -= dt;
            if (this.whipTimer <= 0) {
                this.whipping = false;
                this.whipHit = false;
            } else if (!this.whipHit) {
                this._updateWhipHitbox();
                this.whipHit = true;
            }
        }

        // Check ladder
        const col = Math.floor((this.x) / TILE);
        const row = Math.floor((this.y + this.h / 2) / TILE);
        this.onLadder = level.isLadder(col, row) || level.isLadder(col, row - 1);

        // Ladder climbing
        if (this.onLadder && (this.input.up || this.input.down)) {
            if (!this.climbing) this.jumpBuffer = 0; // Prevent jump-off when first grabbing ladder
            this.climbing = true;
        }
        if (this.climbing && !this.onLadder) {
            this.climbing = false;
        }

        if (this.climbing) {
            this.vy = 0;
            this.vx = 0;
            if (this.input.up) this.vy = -PLAYER_CLIMB_SPEED;
            if (this.input.down) this.vy = PLAYER_CLIMB_SPEED;
            if (this.input.left) { this.vx = -PLAYER_SPEED * 0.5; this.facing = -1; }
            if (this.input.right) { this.vx = PLAYER_SPEED * 0.5; this.facing = 1; }
            this.x += this.vx * dtScale;
            this._resolveCollisionX(level);
            this.y += this.vy * dtScale;
            this._resolveCollisionY(level);

            // Jump off ladder
            if (this.jumpBuffer > 0) {
                this.climbing = false;
                this.vy = PLAYER_JUMP * 0.7;
                this.jumpBuffer = 0;
                Sound.jump();
            }
            this.grounded = false;
            this._clearInputs();
            return;
        }

        // Wall sliding
        this.wallSliding = false;
        if (!this.grounded && !this.climbing) {
            const wallDir = this._checkWall(level);
            if (wallDir !== 0 && this.vy > 0) {
                if ((wallDir === 1 && this.input.right) || (wallDir === -1 && this.input.left)) {
                    this.wallSliding = true;
                    if (this.vy > 2) this.vy = 2;
                }
            }
        }

        // Ledge grabbing
        if (!this.grounded && !this.climbing && !this.wallSliding && this.vy < 0) {
            // Check if can grab ledge
        }
        if (!this.grounded && this.vy >= 0 && !this.climbing && this.ledgeGrabTimer <= 0) {
            const grabCheck = this._checkLedgeGrab(level);
            if (grabCheck) {
                this.ledgeGrabbing = true;
                this.ledgeGrabTimer = LEDGE_GRAB_TIME;
                this.vx = 0;
                this.vy = 0;
                this.x = grabCheck.x;
                this.y = grabCheck.y;
            }
        }

        // Horizontal movement
        if (!this.ledgeGrabbing) {
            if (this.input.left) {
                this.vx = -PLAYER_SPEED;
                this.facing = -1;
                this.walkTimer += dt;
            } else if (this.input.right) {
                this.vx = PLAYER_SPEED;
                this.facing = 1;
                this.walkTimer += dt;
            } else {
                this.vx *= this.grounded ? FRICTION : AIR_FRICTION;
                if (Math.abs(this.vx) < 0.1) this.vx = 0;
                this.walkTimer = 0;
            }

            // Walk animation
            if (this.walkTimer > 100) {
                this.walkFrame = (this.walkFrame + 1) % 4;
                this.walkTimer = 0;
            }

            // Jumping
            if (this.jumpBuffer > 0 && (this.coyoteTime > 0 || this.wallSliding)) {
                if (this.wallSliding) {
                    const wallDir = this._checkWall(level);
                    this.vx = -wallDir * PLAYER_WALL_JUMP_X;
                    this.facing = -wallDir;
                    this.vy = PLAYER_WALL_JUMP_Y;
                } else {
                    let jumpForce = PLAYER_JUMP;
                    if (this.hasShoes) jumpForce *= 1.15;
                    this.vy = jumpForce;
                }
                this.grounded = false;
                this.coyoteTime = 0;
                this.jumpBuffer = 0;
                Sound.jump();
            }

            // Variable jump height
            if (!this.input.jump && this.vy < 0) {
                this.vy *= 0.7;
            }

            // Gravity
            if (!this.grounded) {
                this.vy += GRAVITY * dtScale;
                if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
            }

            // Move
            this.x += this.vx * dtScale;
            this._resolveCollisionX(level);
            this.wasGrounded = this.grounded;
            this.y += this.vy * dtScale;
            this._resolveCollisionY(level);

            // Landing
            if (this.grounded && !this.wasGrounded && this.vy >= 0) {
                if (sounds) Sound.land();
            }
        }

        // Whip
        if (this.whipPressed && !this.whipping) {
            this.whipping = true;
            this.whipTimer = 300;
            this.whipHit = false;
            Sound.whip();
        }

        // Throw rope
        if (this.ropePressed && this.ropes > 0) {
            this._throwRope();
        }

        // Place bomb
        if (this.bombPressed && this.bombs > 0) {
            this._placeBomb();
        }

        // Check spike death
        this._checkSpikes(level);

        // Update ropes
        this.activeRopes = this.activeRopes.filter(r => {
            r.timer -= dt;
            return r.timer > 0 && !r.done;
        });
        for (const rope of this.activeRopes) {
            if (!rope.extended) {
                rope.extendTimer -= dt;
                if (rope.extendTimer <= 0) {
                    rope.extended = true;
                    // Extend rope chain
                    for (let i = 1; i < ROPE_LENGTH; i++) {
                        rope.segments.push({
                            x: rope.x,
                            y: rope.startY - i * TILE,
                            attached: true
                        });
                    }
                }
            }
        }

        // Update bombs
        this.activeBombs = this.activeBombs.filter(b => !b.exploded);
        for (const bomb of this.activeBombs) {
            bomb.timer -= dt;
            bomb.flicker = bomb.timer < 500;

            // Bomb physics
            bomb.vy += GRAVITY * dtScale;
            if (bomb.vy > MAX_FALL_SPEED) bomb.vy = MAX_FALL_SPEED;
            bomb.x += bomb.vx * dtScale;
            bomb.y += bomb.vy * dtScale;

            // Bomb collision with ground
            const bCol = Math.floor(bomb.x / TILE);
            const bRow = Math.floor((bomb.y + 6) / TILE);
            if (level.isSolid(bCol, bRow)) {
                bomb.y = bRow * TILE - 6;
                bomb.vy = 0;
                bomb.vx *= 0.8;
                bomb.grounded = true;
            }
            // Stop horizontal
            const bhCol = Math.floor((bomb.x + Math.sign(bomb.vx) * 6) / TILE);
            const bhRow = Math.floor(bomb.y / TILE);
            if (level.isSolid(bhCol, bhRow)) {
                bomb.vx = 0;
            }

            if (bomb.timer <= 0) {
                this._explodeBomb(bomb, level);
            }
        }

        // Keep in bounds
        if (this.x < this.w / 2) this.x = this.w / 2;
        if (this.x > level.cols * TILE - this.w / 2) this.x = level.cols * TILE - this.w / 2;

        this._clearInputs();
    }

    _clearInputs() {
        this.input.jumpPressed = false;
        this.input.actionPressed = false;
        this.input.bombPressed = false;
        this.input.ropePressed = false;
        this.input.whipPressed = false;
    }

    _checkWall(level) {
        const margin = 2;
        // Check right
        const rc = Math.floor((this.x + this.w / 2 + margin) / TILE);
        const rrow1 = Math.floor(this.y / TILE);
        const rrow2 = Math.floor((this.y + this.h - 2) / TILE);
        if (level.isSolid(rc, rrow1) || level.isSolid(rc, rrow2)) return 1;
        // Check left
        const lc = Math.floor((this.x - this.w / 2 - margin) / TILE);
        const lrow1 = Math.floor(this.y / TILE);
        const lrow2 = Math.floor((this.y + this.h - 2) / TILE);
        if (level.isSolid(lc, lrow1) || level.isSolid(lc, lrow2)) return -1;
        return 0;
    }

    _checkLedgeGrab(level) {
        // Check above and in front for a ledge
        const checkDist = 6;
        const frontX = this.x + this.facing * (this.w / 2 + checkDist);
        const topY = this.y - 4;
        const topCol = Math.floor(frontX / TILE);
        const topRow = Math.floor(topY / TILE);
        const belowRow = topRow + 1;

        if (!level.isSolid(topCol, topRow) && level.isSolid(topCol, belowRow)) {
            return {
                x: topCol * TILE + TILE / 2 - this.facing * (this.w / 2),
                y: topRow * TILE + TILE - this.h
            };
        }
        return null;
    }

    _resolveCollisionX(level) {
        const half = this.w / 2;
        const top = Math.floor(this.y / TILE);
        const bot = Math.floor((this.y + this.h - 1) / TILE);
        const rows = [];
        for (let r = top; r <= bot; r++) rows.push(r);

        // Right
        if (this.vx > 0) {
            const col = Math.floor((this.x + half) / TILE);
            for (const r of rows) {
                if (level.isSolid(col, r)) {
                    this.x = col * TILE - half;
                    this.vx = 0;
                    break;
                }
            }
        }
        // Left
        if (this.vx < 0) {
            const col = Math.floor((this.x - half) / TILE);
            for (const r of rows) {
                if (level.isSolid(col, r)) {
                    this.x = (col + 1) * TILE + half;
                    this.vx = 0;
                    break;
                }
            }
        }
    }

    _resolveCollisionY(level) {
        const half = this.w / 2;
        const left = Math.floor((this.x - half + 2) / TILE);
        const right = Math.floor((this.x + half - 2) / TILE);
        const cols = [];
        for (let c = left; c <= right; c++) cols.push(c);

        this.grounded = false;

        // Falling down
        if (this.vy >= 0) {
            const row = Math.floor((this.y + this.h) / TILE);
            for (const c of cols) {
                if (level.isSolid(c, row) || (level.isPlatform(c, row) && this.y + this.h <= row * TILE + 4)) {
                    this.y = row * TILE - this.h;
                    this.vy = 0;
                    this.grounded = true;
                    break;
                }
            }
        }
        // Moving up
        if (this.vy < 0) {
            const row = Math.floor(this.y / TILE);
            for (const c of cols) {
                if (level.isSolid(c, row)) {
                    this.y = (row + 1) * TILE;
                    this.vy = 0;
                    break;
                }
            }
        }
    }

    _checkSpikes(level) {
        const col = Math.floor(this.x / TILE);
        const row = Math.floor((this.y + this.h - 1) / TILE);
        if (level.isSpike(col, row)) {
            this.takeDamage(99, level);
            Sound.spikeHit();
        }
    }

    _throwRope() {
        this.ropes--;
        Sound.ropeThrow();
        const rope = {
            x: this.x,
            startY: this.y,
            segments: [{ x: this.x, y: this.y, attached: true }],
            timer: 15000,
            extendTimer: ROPE_LENGTH * 80,
            extended: false,
            done: false
        };
        this.activeRopes.push(rope);
    }

    _placeBomb() {
        this.bombs--;
        const bomb = {
            x: this.x,
            y: this.y + this.h / 2,
            vx: this.facing * 2,
            vy: -2,
            timer: BOMB_FUSE,
            flicker: false,
            grounded: false,
            exploded: false,
            radius: BOMB_RADIUS
        };
        this.activeBombs.push(bomb);
    }

    _explodeBomb(bomb, level) {
        bomb.exploded = true;
        Sound.bombExplode();
        level.destroyRadius(bomb.x, bomb.y, Math.floor(bomb.radius));
        // Return destroyed positions for effects
        bomb.explosionX = bomb.x;
        bomb.explosionY = bomb.y;
    }

    _updateWhipHitbox() {
        const whipLen = 28;
        const whipH = 8;
        this.whipX = this.x + this.facing * (this.w / 2 + whipLen / 2);
        this.whipY = this.y + this.h / 3;
        this.whipW = whipLen;
        this.whipH = whipH;
    }

    getWhipHitbox() {
        if (!this.whipping || this.whipTimer < 200) return null;
        return {
            x: this.whipX - this.whipW / 2,
            y: this.whipY - this.whipH / 2,
            w: this.whipW,
            h: this.whipH
        };
    }

    takeDamage(amount, level) {
        if (this.invulnTimer > 0 || this.dead) return;
        this.hp -= amount;
        this.invulnTimer = INVULN_TIME;
        Sound.playerHurt();
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            Sound.death();
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    getHitbox() {
        return {
            x: this.x - this.w / 2,
            y: this.y,
            w: this.w,
            h: this.h
        };
    }

    render(ctx) {
        if (this.dead) return;

        const drawX = Math.round(this.x);
        const drawY = Math.round(this.y);
        const f = this.facing;

        // Invulnerability flash
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer / 80) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Ledge grabbing pose
        if (this.ledgeGrabbing) {
            // Hanging from ledge
            ctx.fillStyle = COLORS.playerSkin;
            ctx.fillRect(drawX - 5 * f, drawY + 2, 10, 8); // Head
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(drawX - 5, drawY + 10, 10, 14); // Body
            // Arms up
            ctx.fillStyle = COLORS.playerSkin;
            ctx.fillRect(drawX - 3 * f - 1, drawY - 2, 6, 6);
        }
        // Climbing
        else if (this.climbing) {
            // Body
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(drawX - 5, drawY + 6, 10, 18);
            // Head
            ctx.fillStyle = COLORS.playerSkin;
            ctx.fillRect(drawX - 5, drawY, 10, 8);
            // Bandana
            ctx.fillStyle = COLORS.playerBandana;
            ctx.fillRect(drawX - 6, drawY + 4, 12, 3);
            // Eyes
            ctx.fillStyle = COLORS.playerEye;
            ctx.fillRect(drawX - 3, drawY + 3, 2, 2);
            ctx.fillRect(drawX + 1, drawY + 3, 2, 2);
            // Arms reaching
            ctx.fillStyle = COLORS.playerSkin;
            const armOff = Math.sin(Date.now() / 100) * 3;
            ctx.fillRect(drawX - 7, drawY + 8 + armOff, 4, 3);
            ctx.fillRect(drawX + 3, drawY + 8 - armOff, 4, 3);
        }
        // Normal rendering
        else {
            // Legs animation
            const legOffset = this.grounded && Math.abs(this.vx) > 0.3 ? Math.sin(this.walkTimer / 60) * 3 : 0;

            // Legs
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(drawX - 5, drawY + 18, 4, 8 + legOffset);
            ctx.fillRect(drawX + 1, drawY + 18, 4, 8 - legOffset);

            // Body
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(drawX - 6, drawY + 8, 12, 12);

            // Head
            ctx.fillStyle = COLORS.playerSkin;
            ctx.fillRect(drawX - 6, drawY, 12, 10);

            // Bandana
            ctx.fillStyle = COLORS.playerBandana;
            ctx.fillRect(drawX - 7, drawY + 5, 14, 3);
            // Bandana tail
            if (f === -1) {
                ctx.fillRect(drawX + 5, drawY + 5, 5, 2);
                ctx.fillRect(drawX + 8, drawY + 6, 4, 2);
            } else {
                ctx.fillRect(drawX - 10, drawY + 5, 5, 2);
                ctx.fillRect(drawX - 12, drawY + 6, 4, 2);
            }

            // Eyes
            ctx.fillStyle = COLORS.playerEye;
            ctx.fillRect(drawX + f * 2 - 1, drawY + 3, 2, 3);
            ctx.fillRect(drawX + f * 2 + 3, drawY + 3, 2, 3);

            // Arms
            ctx.fillStyle = COLORS.playerSkin;
            if (this.whipping) {
                // Extended arm with whip
                ctx.fillRect(drawX + f * 6, drawY + 10, 8 * f, 3);
            } else if (!this.grounded) {
                // Jump pose
                ctx.fillRect(drawX - 8, drawY + 8, 3, 6);
                ctx.fillRect(drawX + 5, drawY + 8, 3, 6);
            } else {
                ctx.fillRect(drawX - 8, drawY + 10, 3, 5 + legOffset * 0.5);
                ctx.fillRect(drawX + 5, drawY + 10, 3, 5 - legOffset * 0.5);
            }

            // Wall slide effect
            if (this.wallSliding) {
                ctx.fillStyle = 'rgba(200,200,200,0.3)';
                ctx.fillRect(drawX - 8, drawY + 12, 2, 8);
                ctx.fillRect(drawX + 6, drawY + 12, 2, 8);
            }
        }

        // Whip rendering
        if (this.whipping && this.whipTimer > 100) {
            ctx.strokeStyle = COLORS.ropeColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(drawX + this.facing * 6, drawY + 12);
            const whipExtent = 28;
            ctx.lineTo(drawX + this.facing * (6 + whipExtent), drawY + 10);
            ctx.stroke();
            // Whip tip
            ctx.fillStyle = COLORS.ropeColor;
            ctx.fillRect(drawX + this.facing * (6 + whipExtent) - 2, drawY + 8, 4, 4);
        }

        ctx.globalAlpha = 1;

        // Render active bombs
        for (const bomb of this.activeBombs) {
            const bx = Math.round(bomb.x);
            const by = Math.round(bomb.y);
            // Bomb body
            ctx.fillStyle = bomb.flicker && Math.floor(Date.now() / 50) % 2 === 0 ? '#ff4444' : COLORS.bomb;
            ctx.beginPath();
            ctx.arc(bx, by, 6, 0, Math.PI * 2);
            ctx.fill();
            // Fuse
            ctx.strokeStyle = COLORS.bombFuse;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx + 3, by - 5);
            ctx.lineTo(bx + 5, by - 10);
            ctx.stroke();
            // Fuse spark
            if (bomb.timer > 0) {
                ctx.fillStyle = Math.floor(Date.now() / 40) % 2 === 0 ? COLORS.bombSpark : '#ff8800';
                ctx.beginPath();
                ctx.arc(bx + 5, by - 11, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Render active ropes
        for (const rope of this.activeRopes) {
            ctx.strokeStyle = COLORS.ropeColor;
            ctx.lineWidth = 2;
            if (rope.extended) {
                for (let i = 0; i < rope.segments.length - 1; i++) {
                    ctx.beginPath();
                    ctx.moveTo(rope.segments[i].x, rope.segments[i].y);
                    ctx.lineTo(rope.segments[i + 1].x, rope.segments[i + 1].y);
                    ctx.stroke();
                }
                // Hook at top
                const top = rope.segments[rope.segments.length - 1];
                ctx.fillStyle = '#aaa';
                ctx.beginPath();
                ctx.arc(top.x, top.y, 3, 0, Math.PI * 2);
                ctx.fill();
                // Rungs
                for (let i = 0; i < rope.segments.length - 1; i++) {
                    const s = rope.segments[i];
                    ctx.fillStyle = COLORS.ropeColor;
                    ctx.fillRect(s.x - 5, s.y - 1, 10, 2);
                }
            } else {
                // Flying rope
                ctx.beginPath();
                ctx.moveTo(rope.x, rope.startY);
                ctx.lineTo(rope.x, rope.segments[0].y - 20);
                ctx.stroke();
            }
        }
    }
}
