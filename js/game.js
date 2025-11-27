import { Ball } from './ball.js';
import { Brick, BrickManager } from './brick.js';

/**
 * Main Game class - handles game loop, state, and rendering
 */
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.coins = 0;
        this.bricksBroken = 0;
        this.totalBricksBroken = 0; // Across all prestiges
        this.prestigeLevel = 0;
        
        // Upgrades
        this.upgrades = {
            speed: 0,
            damage: 0,
            coinMult: 0
        };
        
        // Ball costs (increase with each purchase)
        this.ballCosts = {
            basic: 10,
            fast: 50,
            heavy: 100,
            plasma: 500,
            explosive: 1000,
            sniper: 2500
        };
        
        // Upgrade costs
        this.upgradeCosts = {
            speed: 100,
            damage: 150,
            coinMult: 200
        };
        
        // Game objects
        this.balls = [];
        this.bricks = [];
        this.explosions = [];
        
        // Brick management
        this.brickManager = new BrickManager(this);
        this.currentTier = 1;
        
        // Initialize with starting ball and bricks
        this.init();
        
        // Start game loop
        this.lastTime = 0;
        this.running = true;
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    init() {
        // Start with one basic ball
        this.balls.push(new Ball('basic', this));
        
        // Generate initial bricks
        this.bricks = this.brickManager.generateBricks(50, this.currentTier);
        
        // Update UI
        this.updateUI();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width - 20;
        this.canvas.height = Math.min(600, window.innerHeight * 0.6);
    }
    
    gameLoop(timestamp) {
        if (!this.running) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update all balls
        for (const ball of this.balls) {
            ball.update();
        }
        
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].life -= deltaTime;
            if (this.explosions[i].life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
        
        // Check if we need more bricks
        if (this.bricks.length < 20) {
            // Increase tier over time
            if (this.bricksBroken > 0 && this.bricksBroken % 100 === 0) {
                this.currentTier = Math.min(10, 1 + Math.floor(this.bricksBroken / 100));
            }
            
            const newBricks = this.brickManager.addBricksToFillScreen(this.bricks, this.currentTier);
            this.bricks.push(...newBricks);
        }
        
        // Update UI periodically
        this.updateUI();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines for visual effect
        this.drawBackground();
        
        // Draw bricks
        for (const brick of this.bricks) {
            brick.draw(this.ctx);
        }
        
        // Draw explosions
        for (const explosion of this.explosions) {
            this.drawExplosion(explosion);
        }
        
        // Draw balls
        for (const ball of this.balls) {
            ball.draw(this.ctx);
        }
    }
    
    drawBackground() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawExplosion(explosion) {
        const progress = 1 - (explosion.life / explosion.maxLife);
        const radius = explosion.radius * (0.5 + progress * 0.5);
        const alpha = 1 - progress;
        
        const gradient = this.ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, radius
        );
        gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 50, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    addExplosion(x, y, radius) {
        this.explosions.push({
            x,
            y,
            radius,
            life: 300,
            maxLife: 300
        });
    }
    
    addCoins(amount) {
        // Apply prestige bonus
        const prestigeBonus = 1 + (this.prestigeLevel * 0.25);
        this.coins += Math.floor(amount * prestigeBonus);
    }
    
    buyBall(type) {
        const cost = this.ballCosts[type];
        if (this.coins >= cost) {
            this.coins -= cost;
            this.balls.push(new Ball(type, this));
            
            // Increase cost for next purchase
            this.ballCosts[type] = Math.ceil(cost * 1.15);
            this.updateShopCosts();
            this.updateUI();
            return true;
        }
        return false;
    }
    
    buyUpgrade(type) {
        const cost = this.upgradeCosts[type];
        if (this.coins >= cost) {
            this.coins -= cost;
            this.upgrades[type]++;
            
            // Increase cost for next purchase
            this.upgradeCosts[type] = Math.ceil(cost * 1.2);
            this.updateShopCosts();
            this.updateUI();
            return true;
        }
        return false;
    }
    
    canPrestige() {
        return this.bricksBroken >= 10000;
    }
    
    prestige() {
        if (!this.canPrestige()) return false;
        
        // Save total bricks broken
        this.totalBricksBroken += this.bricksBroken;
        
        // Increase prestige level
        this.prestigeLevel++;
        
        // Reset game state
        this.coins = 0;
        this.bricksBroken = 0;
        this.currentTier = 1;
        
        // Reset upgrades
        this.upgrades = {
            speed: 0,
            damage: 0,
            coinMult: 0
        };
        
        // Reset costs
        this.ballCosts = {
            basic: 10,
            fast: 50,
            heavy: 100,
            plasma: 500,
            explosive: 1000,
            sniper: 2500
        };
        
        this.upgradeCosts = {
            speed: 100,
            damage: 150,
            coinMult: 200
        };
        
        // Reset game objects
        this.balls = [new Ball('basic', this)];
        this.bricks = this.brickManager.generateBricks(50, this.currentTier);
        this.explosions = [];
        
        this.updateShopCosts();
        this.updateUI();
        
        return true;
    }
    
    updateUI() {
        document.getElementById('coins').textContent = this.formatNumber(this.coins);
        document.getElementById('bricks-broken').textContent = this.formatNumber(this.bricksBroken);
        document.getElementById('total-bricks').textContent = this.formatNumber(this.totalBricksBroken + this.bricksBroken);
        document.getElementById('balls-count').textContent = this.balls.length;
        
        // Update prestige button
        const prestigeBtn = document.getElementById('prestige-btn');
        const prestigeInfo = document.getElementById('prestige-info');
        if (this.canPrestige()) {
            prestigeBtn.disabled = false;
            prestigeInfo.textContent = `+25% coin bonus (Current: +${this.prestigeLevel * 25}%)`;
        } else {
            prestigeBtn.disabled = true;
            prestigeInfo.textContent = `Break ${this.formatNumber(10000 - this.bricksBroken)} more bricks`;
        }
        
        // Update shop button states
        this.updateShopButtons();
    }
    
    updateShopButtons() {
        // Ball shop buttons
        for (const type of ['basic', 'fast', 'heavy', 'plasma', 'explosive', 'sniper']) {
            const btn = document.querySelector(`[data-ball="${type}"]`);
            if (btn) {
                btn.disabled = this.coins < this.ballCosts[type];
            }
        }
        
        // Upgrade buttons
        document.getElementById('upgrade-all-speed').disabled = this.coins < this.upgradeCosts.speed;
        document.getElementById('upgrade-all-damage').disabled = this.coins < this.upgradeCosts.damage;
        document.getElementById('upgrade-coin-mult').disabled = this.coins < this.upgradeCosts.coinMult;
    }
    
    updateShopCosts() {
        // Update ball costs display
        for (const type of ['basic', 'fast', 'heavy', 'plasma', 'explosive', 'sniper']) {
            const costEl = document.getElementById(`cost-${type}`);
            if (costEl) {
                costEl.textContent = this.formatNumber(this.ballCosts[type]);
            }
        }
        
        // Update upgrade costs display
        document.getElementById('cost-speed').textContent = this.formatNumber(this.upgradeCosts.speed);
        document.getElementById('cost-damage').textContent = this.formatNumber(this.upgradeCosts.damage);
        document.getElementById('cost-coin').textContent = this.formatNumber(this.upgradeCosts.coinMult);
    }
    
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return Math.floor(num).toString();
    }
    
    save() {
        const saveData = {
            coins: this.coins,
            bricksBroken: this.bricksBroken,
            totalBricksBroken: this.totalBricksBroken,
            prestigeLevel: this.prestigeLevel,
            upgrades: this.upgrades,
            ballCosts: this.ballCosts,
            upgradeCosts: this.upgradeCosts,
            currentTier: this.currentTier,
            balls: this.balls.map(b => b.type),
            timestamp: Date.now()
        };
        
        localStorage.setItem('idleBricksSave', JSON.stringify(saveData));
        return true;
    }
    
    load() {
        const saveStr = localStorage.getItem('idleBricksSave');
        if (!saveStr) return false;
        
        try {
            const saveData = JSON.parse(saveStr);
            
            this.coins = saveData.coins || 0;
            this.bricksBroken = saveData.bricksBroken || 0;
            this.totalBricksBroken = saveData.totalBricksBroken || 0;
            this.prestigeLevel = saveData.prestigeLevel || 0;
            this.upgrades = saveData.upgrades || { speed: 0, damage: 0, coinMult: 0 };
            this.ballCosts = saveData.ballCosts || this.ballCosts;
            this.upgradeCosts = saveData.upgradeCosts || this.upgradeCosts;
            this.currentTier = saveData.currentTier || 1;
            
            // Recreate balls
            this.balls = [];
            if (saveData.balls && saveData.balls.length > 0) {
                for (const type of saveData.balls) {
                    this.balls.push(new Ball(type, this));
                }
            } else {
                this.balls.push(new Ball('basic', this));
            }
            
            // Calculate offline progress
            if (saveData.timestamp) {
                const offlineTime = Date.now() - saveData.timestamp;
                this.calculateOfflineProgress(offlineTime);
            }
            
            this.updateShopCosts();
            this.updateUI();
            return true;
        } catch (e) {
            console.error('Failed to load save:', e);
            return false;
        }
    }
    
    calculateOfflineProgress(offlineTimeMs) {
        // Simple offline progress - award some coins based on time away
        const seconds = offlineTimeMs / 1000;
        const minutes = seconds / 60;
        
        if (minutes > 1) {
            // Calculate approximate earnings per second
            const coinsPerSecond = this.balls.length * (1 + this.upgrades.coinMult * 0.1) * (1 + this.prestigeLevel * 0.25);
            
            // Award 50% of theoretical earnings (to encourage active play)
            const offlineCoins = Math.floor(coinsPerSecond * seconds * 0.5);
            
            if (offlineCoins > 0) {
                this.coins += offlineCoins;
                console.log(`Welcome back! You earned ${this.formatNumber(offlineCoins)} coins while away.`);
            }
        }
    }
    
    reset() {
        localStorage.removeItem('idleBricksSave');
        
        this.coins = 0;
        this.bricksBroken = 0;
        this.totalBricksBroken = 0;
        this.prestigeLevel = 0;
        this.currentTier = 1;
        
        this.upgrades = {
            speed: 0,
            damage: 0,
            coinMult: 0
        };
        
        this.ballCosts = {
            basic: 10,
            fast: 50,
            heavy: 100,
            plasma: 500,
            explosive: 1000,
            sniper: 2500
        };
        
        this.upgradeCosts = {
            speed: 100,
            damage: 150,
            coinMult: 200
        };
        
        this.balls = [new Ball('basic', this)];
        this.bricks = this.brickManager.generateBricks(50, this.currentTier);
        this.explosions = [];
        
        this.updateShopCosts();
        this.updateUI();
    }
}
