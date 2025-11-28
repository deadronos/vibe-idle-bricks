/**
 * Ball class representing different types of balls in the game
 */
export class Ball {
    constructor(type, game) {
        this.game = game;
        this.type = type;
        this.radius = 8;
        
        // Set properties based on ball type
        this.setTypeProperties();
        
        // Random starting position at bottom center area
        this.x = game.canvas.width / 2 + (Math.random() - 0.5) * 200;
        this.y = game.canvas.height - 50;
        
        // Random direction (mostly upward)
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }
    
    setTypeProperties() {
        // Note: Ball costs are managed in game.js ballCosts property
        const types = {
            basic: {
                speed: 3,
                damage: 1,
                color: '#9ca3af',
                pierce: false,
                explosive: false,
                targeting: false
            },
            fast: {
                speed: 6,
                damage: 1,
                color: '#60a5fa',
                pierce: false,
                explosive: false,
                targeting: false
            },
            heavy: {
                speed: 2.5,
                damage: 3,
                color: '#f97316',
                pierce: false,
                explosive: false,
                targeting: false
            },
            plasma: {
                speed: 4,
                damage: 2,
                color: '#a855f7',
                pierce: true,
                explosive: false,
                targeting: false
            },
            explosive: {
                speed: 3,
                damage: 2,
                color: '#ef4444',
                pierce: false,
                explosive: true,
                explosionRadius: 50,
                targeting: false
            },
            sniper: {
                speed: 5,
                damage: 5,
                color: '#10b981',
                pierce: false,
                explosive: false,
                targeting: true
            }
        };
        
        const props = types[this.type] || types.basic;
        Object.assign(this, props);
        this.baseSpeed = this.speed;
        this.baseDamage = this.damage;
    }
    
    update() {
        // Apply global upgrades
        const speedMult = 1 + (this.game.upgrades.speed * 0.1);
        const actualSpeed = this.baseSpeed * speedMult;
        
        // Normalize and apply speed
        const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        if (currentSpeed > 0) {
            this.dx = (this.dx / currentSpeed) * actualSpeed;
            this.dy = (this.dy / currentSpeed) * actualSpeed;
        }
        
        // Targeting behavior for sniper balls
        if (this.targeting && this.game.bricks.length > 0) {
            this.seekWeakestBrick();
        }
        
        // Move ball
        this.x += this.dx;
        this.y += this.dy;
        
        // Wall collisions
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = Math.abs(this.dx);
        }
        if (this.x + this.radius > this.game.canvas.width) {
            this.x = this.game.canvas.width - this.radius;
            this.dx = -Math.abs(this.dx);
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy = Math.abs(this.dy);
        }
        // Bottom wall - ball bounces back (idle game - no losing)
        if (this.y + this.radius > this.game.canvas.height) {
            this.y = this.game.canvas.height - this.radius;
            this.dy = -Math.abs(this.dy);
        }
        
        // Check brick collisions
        this.checkBrickCollisions();
    }
    
    seekWeakestBrick() {
        // Find the weakest brick
        let weakest = null;
        let minHealth = Infinity;
        
        for (const brick of this.game.bricks) {
            if (brick.health < minHealth) {
                minHealth = brick.health;
                weakest = brick;
            }
        }
        
        if (weakest) {
            // Gently steer toward the weakest brick
            const targetX = weakest.x + weakest.width / 2;
            const targetY = weakest.y + weakest.height / 2;
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                // Small steering force
                const steerStrength = 0.03;
                this.dx += (dx / dist) * steerStrength;
                this.dy += (dy / dist) * steerStrength;
            }
        }
    }
    
    checkBrickCollisions() {
        const damageMult = 1 + (this.game.upgrades.damage * 0.1);
        const actualDamage = this.baseDamage * damageMult;
        
        for (let i = this.game.bricks.length - 1; i >= 0; i--) {
            const brick = this.game.bricks[i];
            
            if (this.collidesWith(brick)) {
                // Deal damage
                const destroyed = brick.takeDamage(actualDamage);
                
                if (destroyed) {
                    // Award coins
                    const coinMult = 1 + (this.game.upgrades.coinMult * 0.1);
                    this.game.addCoins(brick.value * coinMult);
                    this.game.bricksBroken++;
                    this.game.bricks.splice(i, 1);
                }
                
                // Explosive effect
                if (this.explosive) {
                    this.explode();
                }
                
                // Bounce unless piercing
                if (!this.pierce) {
                    this.bounceOffBrick(brick);
                }
                
                // Only hit one brick per frame (unless piercing)
                if (!this.pierce) {
                    break;
                }
            }
        }
    }
    
    collidesWith(brick) {
        // Circle-rectangle collision
        const closestX = Math.max(brick.x, Math.min(this.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(this.y, brick.y + brick.height));
        const distX = this.x - closestX;
        const distY = this.y - closestY;
        return (distX * distX + distY * distY) < (this.radius * this.radius);
    }
    
    bounceOffBrick(brick) {
        // Determine which side was hit
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;
        const dx = this.x - brickCenterX;
        const dy = this.y - brickCenterY;
        
        // Normalize by brick dimensions
        const normalizedX = dx / (brick.width / 2);
        const normalizedY = dy / (brick.height / 2);
        
        if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
            this.dx = Math.abs(this.dx) * Math.sign(dx);
        } else {
            this.dy = Math.abs(this.dy) * Math.sign(dy);
        }
    }
    
    explode() {
        const damageMult = 1 + (this.game.upgrades.damage * 0.1);
        const explosionDamage = this.baseDamage * damageMult * 0.5;
        const coinMult = 1 + (this.game.upgrades.coinMult * 0.1);
        
        for (let i = this.game.bricks.length - 1; i >= 0; i--) {
            const brick = this.game.bricks[i];
            const brickCenterX = brick.x + brick.width / 2;
            const brickCenterY = brick.y + brick.height / 2;
            const dist = Math.sqrt(
                Math.pow(this.x - brickCenterX, 2) + 
                Math.pow(this.y - brickCenterY, 2)
            );
            
            if (dist < this.explosionRadius) {
                const destroyed = brick.takeDamage(explosionDamage);
                if (destroyed) {
                    this.game.addCoins(brick.value * coinMult);
                    this.game.bricksBroken++;
                    this.game.bricks.splice(i, 1);
                }
            }
        }
        
        // Visual effect
        this.game.addExplosion(this.x, this.y, this.explosionRadius);
    }
    
    draw(ctx) {
        // Draw ball glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw ball
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw white highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}
