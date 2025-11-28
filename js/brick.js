/**
 * Brick class representing destructible bricks
 */
export class Brick {
    constructor(x, y, width, height, tier = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.tier = tier;
        
        // Health and value scale with tier
        this.maxHealth = Math.ceil(tier * 1.5);
        this.health = this.maxHealth;
        this.value = tier; // Coins awarded when destroyed
        
        // Color based on tier
        this.setColor();
    }
    
    setColor() {
        const colors = [
            '#4ade80', // Green - Tier 1
            '#60a5fa', // Blue - Tier 2
            '#facc15', // Yellow - Tier 3
            '#f97316', // Orange - Tier 4
            '#ef4444', // Red - Tier 5
            '#a855f7', // Purple - Tier 6
            '#ec4899', // Pink - Tier 7
            '#14b8a6', // Teal - Tier 8
            '#8b5cf6', // Violet - Tier 9
            '#fbbf24', // Amber - Tier 10+
        ];
        
        const colorIndex = Math.min(this.tier - 1, colors.length - 1);
        this.color = colors[colorIndex];
        
        // Calculate darker version for damage display
        this.baseColor = this.color;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    draw(ctx) {
        // Calculate health percentage for visual feedback
        const healthPercent = this.health / this.maxHealth;
        
        // Draw brick shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw brick with gradient
        const gradient = ctx.createLinearGradient(
            this.x, this.y, 
            this.x, this.y + this.height
        );
        gradient.addColorStop(0, this.adjustBrightness(this.color, 20));
        gradient.addColorStop(1, this.adjustBrightness(this.color, -20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = this.adjustBrightness(this.color, -30);
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw damage overlay
        if (healthPercent < 1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * (1 - healthPercent)})`;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw crack lines for damaged bricks
            if (healthPercent < 0.7) {
                this.drawCracks(ctx, healthPercent);
            }
        }
        
        // Draw tier number for higher tier bricks
        if (this.tier > 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                this.tier.toString(),
                this.x + this.width / 2,
                this.y + this.height / 2
            );
        }
    }
    
    drawCracks(ctx, healthPercent) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Draw cracks based on damage
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const numCracks = Math.floor((1 - healthPercent) * 5) + 1;
        
        for (let i = 0; i < numCracks; i++) {
            const angle = (i / numCracks) * Math.PI * 2;
            const length = Math.min(this.width, this.height) * 0.4;
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
        }
        
        ctx.stroke();
    }
    
    adjustBrightness(hex, percent) {
        // Convert hex to RGB, adjust, and convert back
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

/**
 * BrickManager handles brick generation and layout
 */
export class BrickManager {
    constructor(game) {
        this.game = game;
        this.brickWidth = 60;
        this.brickHeight = 25;
        this.padding = 5;
        this.offsetTop = 50;
        this.offsetLeft = 50;
    }
    
    generateBricks(count, baseTier = 1) {
        const bricks = [];
        const cols = Math.floor((this.game.canvas.width - this.offsetLeft * 2) / (this.brickWidth + this.padding));
        const rows = Math.ceil(count / cols);
        
        let created = 0;
        
        for (let row = 0; row < rows && created < count; row++) {
            for (let col = 0; col < cols && created < count; col++) {
                const x = this.offsetLeft + col * (this.brickWidth + this.padding);
                const y = this.offsetTop + row * (this.brickHeight + this.padding);
                
                // Vary tier slightly for variety
                const tierVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                const tier = Math.max(1, baseTier + tierVariation);
                
                bricks.push(new Brick(x, y, this.brickWidth, this.brickHeight, tier));
                created++;
            }
        }
        
        return bricks;
    }
    
    addBricksToFillScreen(currentBricks, baseTier) {
        const cols = Math.floor((this.game.canvas.width - this.offsetLeft * 2) / (this.brickWidth + this.padding));
        const maxRows = Math.floor((this.game.canvas.height * 0.5 - this.offsetTop) / (this.brickHeight + this.padding));
        const maxBricks = cols * maxRows;
        
        const bricksToAdd = Math.min(maxBricks - currentBricks.length, cols); // Add one row at a time
        
        if (bricksToAdd <= 0) return [];
        
        // Find the lowest row with bricks
        let lowestY = this.offsetTop;
        for (const brick of currentBricks) {
            if (brick.y > lowestY) {
                lowestY = brick.y;
            }
        }
        
        // If there's room, add a new row at the top and shift others down
        // Otherwise, just add more bricks
        const newBricks = [];
        
        // Check for empty positions in the grid
        const occupied = new Set();
        for (const brick of currentBricks) {
            const col = Math.round((brick.x - this.offsetLeft) / (this.brickWidth + this.padding));
            const row = Math.round((brick.y - this.offsetTop) / (this.brickHeight + this.padding));
            occupied.add(`${row},${col}`);
        }
        
        // Fill in gaps from top to bottom
        for (let row = 0; row < maxRows && newBricks.length < bricksToAdd; row++) {
            for (let col = 0; col < cols && newBricks.length < bricksToAdd; col++) {
                if (!occupied.has(`${row},${col}`)) {
                    const x = this.offsetLeft + col * (this.brickWidth + this.padding);
                    const y = this.offsetTop + row * (this.brickHeight + this.padding);
                    
                    const tierVariation = Math.floor(Math.random() * 3) - 1;
                    const tier = Math.max(1, baseTier + tierVariation);
                    
                    newBricks.push(new Brick(x, y, this.brickWidth, this.brickHeight, tier));
                }
            }
        }
        
        return newBricks;
    }
}
