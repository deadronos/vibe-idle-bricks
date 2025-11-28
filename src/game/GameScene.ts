import Phaser from 'phaser';
import Decimal from 'break_infinity.js';
import { useGameStore } from '../store';
import { BALL_TYPES } from '../types';
import type { BallData, BrickData } from '../types';
import { generateId, getTierColor, adjustBrightness } from '../utils';

export class GameScene extends Phaser.Scene {
  private ballGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private brickGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private explosionGraphics: Phaser.GameObjects.Graphics[] = [];
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private brickManager!: BrickManager;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Draw background
    this.backgroundGraphics = this.add.graphics();
    this.drawBackground();

    // Initialize brick manager
    this.brickManager = new BrickManager(this);

    // Subscribe to store changes
    const store = useGameStore.getState();
    store.setCanvasSize(this.cameras.main.width, this.cameras.main.height);

    // Generate initial bricks
    const initialBricks = this.brickManager.generateBricks(50, store.currentTier);
    useGameStore.getState().setBricks(initialBricks);

    // Load saved game
    useGameStore.getState().load();

    // Auto-save every 30 seconds
    this.time.addEvent({
      delay: 30000,
      callback: () => useGameStore.getState().save(),
      loop: true,
    });

    // Handle resize
    this.scale.on('resize', this.handleResize, this);
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    useGameStore.getState().setCanvasSize(gameSize.width, gameSize.height);
    this.drawBackground();
  }

  drawBackground() {
    const { width, height } = this.cameras.main;
    this.backgroundGraphics.clear();

    // Fill background
    this.backgroundGraphics.fillStyle(0x0f0f1a);
    this.backgroundGraphics.fillRect(0, 0, width, height);

    // Draw grid lines
    this.backgroundGraphics.lineStyle(1, 0xffffff, 0.03);

    for (let x = 0; x < width; x += 50) {
      this.backgroundGraphics.beginPath();
      this.backgroundGraphics.moveTo(x, 0);
      this.backgroundGraphics.lineTo(x, height);
      this.backgroundGraphics.strokePath();
    }

    for (let y = 0; y < height; y += 50) {
      this.backgroundGraphics.beginPath();
      this.backgroundGraphics.moveTo(0, y);
      this.backgroundGraphics.lineTo(width, y);
      this.backgroundGraphics.strokePath();
    }
  }

  update(_time: number, delta: number) {
    const store = useGameStore.getState();
    if (store.isPaused) return;

    // Update balls
    this.updateBalls(delta);

    // Update explosions
    store.updateExplosions(delta);

    // Check if we need more bricks
    if (store.bricks.length < 20) {
      const newBricks = this.brickManager.addBricksToFillScreen(
        store.bricks,
        store.currentTier
      );
      if (newBricks.length > 0) {
        store.setBricks([...store.bricks, ...newBricks]);
      }
    }

    // Render all game objects
    this.renderBalls(store.balls);
    this.renderBricks(store.bricks);
    this.renderExplosions();
  }

  updateBalls(delta: number) {
    const store = useGameStore.getState();
    const { width, height } = this.cameras.main;
    const speedMult = store.getSpeedMult();
    const damageMult = store.getDamageMult();
    const coinMult = store.getCoinMult();

    const updatedBalls: BallData[] = [];

    for (const ball of store.balls) {
      const config = BALL_TYPES[ball.type];
      const actualSpeed = config.speed * speedMult;

      // Normalize and apply speed
      const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      let dx = ball.dx;
      let dy = ball.dy;

      if (currentSpeed > 0) {
        dx = (ball.dx / currentSpeed) * actualSpeed;
        dy = (ball.dy / currentSpeed) * actualSpeed;
      }

      // Targeting behavior for sniper balls
      if (config.targeting && store.bricks.length > 0) {
        const [newDx, newDy] = this.seekWeakestBrick(ball, dx, dy, store.bricks);
        dx = newDx;
        dy = newDy;
      }

      // Move ball
      let x = ball.x + dx * (delta / 16);
      let y = ball.y + dy * (delta / 16);

      // Wall collisions
      if (x - 8 < 0) {
        x = 8;
        dx = Math.abs(dx);
      }
      if (x + 8 > width) {
        x = width - 8;
        dx = -Math.abs(dx);
      }
      if (y - 8 < 0) {
        y = 8;
        dy = Math.abs(dy);
      }
      if (y + 8 > height) {
        y = height - 8;
        dy = -Math.abs(dy);
      }

      // Create updated ball with new position
      let updatedBall: BallData = { ...ball, x, y, dx, dy };

      // Check brick collisions with the updated position
      const bounceResult = this.checkBrickCollisions(updatedBall, damageMult, coinMult, config);
      if (bounceResult) {
        updatedBall = { ...updatedBall, dx: bounceResult.dx, dy: bounceResult.dy };
      }

      updatedBalls.push(updatedBall);
    }

    // Update store with new ball positions
    useGameStore.setState({ balls: updatedBalls });
  }

  seekWeakestBrick(
    ball: BallData,
    dx: number,
    dy: number,
    bricks: BrickData[]
  ): [number, number] {
    let weakest: BrickData | null = null;
    let minHealth = new Decimal(Infinity);

    for (const brick of bricks) {
      if (brick.health.lt(minHealth)) {
        minHealth = brick.health;
        weakest = brick;
      }
    }

    if (weakest) {
      const targetX = weakest.x + weakest.width / 2;
      const targetY = weakest.y + weakest.height / 2;
      const deltaX = targetX - ball.x;
      const deltaY = targetY - ball.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (dist > 0) {
        const steerStrength = 0.03;
        return [
          dx + (deltaX / dist) * steerStrength,
          dy + (deltaY / dist) * steerStrength,
        ];
      }
    }

    return [dx, dy];
  }

  checkBrickCollisions(
    ball: BallData,
    damageMult: number,
    coinMult: number,
    config: typeof BALL_TYPES[keyof typeof BALL_TYPES]
  ): { dx: number; dy: number } | null {
    const store = useGameStore.getState();
    const actualDamage = new Decimal(config.damage).mul(damageMult);

    for (const brick of store.bricks) {
      if (this.ballCollidesWithBrick(ball, brick)) {
        const result = store.damageBrick(brick.id, actualDamage);

        if (result?.destroyed) {
          store.addCoins(brick.value.mul(coinMult));
          store.incrementBricksBroken();
        }

        // Explosive effect
        if (config.explosive && config.explosionRadius) {
          this.explode(ball.x, ball.y, config.explosionRadius, actualDamage, coinMult);
        }

        // Bounce unless piercing
        if (!config.pierce) {
          return this.calculateBounce(ball, brick);
        }
      }
    }
    return null;
  }

  ballCollidesWithBrick(ball: BallData, brick: BrickData): boolean {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    return distX * distX + distY * distY < 64; // 8 * 8 radius squared
  }

  calculateBounce(ball: BallData, brick: BrickData): { dx: number; dy: number } {
    const brickCenterX = brick.x + brick.width / 2;
    const brickCenterY = brick.y + brick.height / 2;
    const deltaX = ball.x - brickCenterX;
    const deltaY = ball.y - brickCenterY;

    const normalizedX = deltaX / (brick.width / 2);
    const normalizedY = deltaY / (brick.height / 2);

    if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
      return { dx: Math.abs(ball.dx) * Math.sign(deltaX), dy: ball.dy };
    } else {
      return { dx: ball.dx, dy: Math.abs(ball.dy) * Math.sign(deltaY) };
    }
  }

  explode(x: number, y: number, radius: number, damage: Decimal, coinMult: number) {
    const store = useGameStore.getState();
    const explosionDamage = damage.mul(0.5);

    for (const brick of store.bricks) {
      const brickCenterX = brick.x + brick.width / 2;
      const brickCenterY = brick.y + brick.height / 2;
      const dist = Math.sqrt(
        Math.pow(x - brickCenterX, 2) + Math.pow(y - brickCenterY, 2)
      );

      if (dist < radius) {
        const result = store.damageBrick(brick.id, explosionDamage);
        if (result?.destroyed) {
          store.addCoins(brick.value.mul(coinMult));
          store.incrementBricksBroken();
        }
      }
    }

    store.addExplosion(x, y, radius);
  }

  renderBalls(balls: BallData[]) {
    // Remove old graphics for balls that no longer exist
    const currentIds = new Set(balls.map((b) => b.id));
    for (const [id, graphics] of this.ballGraphics) {
      if (!currentIds.has(id)) {
        graphics.destroy();
        this.ballGraphics.delete(id);
      }
    }

    // Render each ball
    for (const ball of balls) {
      let graphics = this.ballGraphics.get(ball.id);
      if (!graphics) {
        graphics = this.add.graphics();
        this.ballGraphics.set(ball.id, graphics);
      }

      graphics.clear();
      const config = BALL_TYPES[ball.type];
      const color = Phaser.Display.Color.HexStringToColor(config.color).color;

      // Draw glow
      graphics.fillStyle(color, 0.3);
      graphics.fillCircle(ball.x, ball.y, 16);

      // Draw ball
      graphics.fillStyle(color, 1);
      graphics.fillCircle(ball.x, ball.y, 8);

      // Draw highlight
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillCircle(ball.x - 2, ball.y - 2, 3);
    }
  }

  renderBricks(bricks: BrickData[]) {
    // Remove old graphics for bricks that no longer exist
    const currentIds = new Set(bricks.map((b) => b.id));
    for (const [id, graphics] of this.brickGraphics) {
      if (!currentIds.has(id)) {
        graphics.destroy();
        this.brickGraphics.delete(id);
      }
    }

    // Render each brick
    for (const brick of bricks) {
      let graphics = this.brickGraphics.get(brick.id);
      if (!graphics) {
        graphics = this.add.graphics();
        this.brickGraphics.set(brick.id, graphics);
      }

      graphics.clear();
      const color = getTierColor(brick.tier);
      const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
      const healthPercent = brick.health.div(brick.maxHealth).toNumber();

      // Draw shadow
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRect(brick.x + 2, brick.y + 2, brick.width, brick.height);

      // Draw brick
      graphics.fillStyle(colorNum, 1);
      graphics.fillRect(brick.x, brick.y, brick.width, brick.height);

      // Draw border
      const borderColor = Phaser.Display.Color.HexStringToColor(
        adjustBrightness(color, -30)
      ).color;
      graphics.lineStyle(2, borderColor, 1);
      graphics.strokeRect(brick.x, brick.y, brick.width, brick.height);

      // Draw damage overlay
      if (healthPercent < 1) {
        graphics.fillStyle(0x000000, 0.5 * (1 - healthPercent));
        graphics.fillRect(brick.x, brick.y, brick.width, brick.height);
      }

      // Draw tier number
      if (brick.tier > 1) {
        const text = this.add.text(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2,
          brick.tier.toString(),
          {
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ffffff',
          }
        );
        text.setOrigin(0.5);
        // Clean up text after a frame
        this.time.delayedCall(16, () => text.destroy());
      }
    }
  }

  renderExplosions() {
    // Clean up old explosion graphics
    for (const graphics of this.explosionGraphics) {
      graphics.destroy();
    }
    this.explosionGraphics = [];

    const explosions = useGameStore.getState().explosions;

    for (const explosion of explosions) {
      const graphics = this.add.graphics();
      const progress = 1 - explosion.life / explosion.maxLife;
      const radius = explosion.radius * (0.5 + progress * 0.5);
      const alpha = 1 - progress;

      // Draw explosion gradient (simplified)
      graphics.fillStyle(0xffc832, alpha);
      graphics.fillCircle(explosion.x, explosion.y, radius * 0.5);
      graphics.fillStyle(0xff6432, alpha * 0.5);
      graphics.fillCircle(explosion.x, explosion.y, radius);

      this.explosionGraphics.push(graphics);
    }
  }

  shutdown() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    useGameStore.getState().save();
  }
}

class BrickManager {
  private scene: GameScene;
  private brickWidth = 60;
  private brickHeight = 25;
  private padding = 5;
  private offsetTop = 50;
  private offsetLeft = 50;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  generateBricks(count: number, baseTier: number): BrickData[] {
    const { width } = this.scene.cameras.main;
    const bricks: BrickData[] = [];
    const cols = Math.floor(
      (width - this.offsetLeft * 2) / (this.brickWidth + this.padding)
    );
    const rows = Math.ceil(count / cols);

    let created = 0;

    for (let row = 0; row < rows && created < count; row++) {
      for (let col = 0; col < cols && created < count; col++) {
        const x = this.offsetLeft + col * (this.brickWidth + this.padding);
        const y = this.offsetTop + row * (this.brickHeight + this.padding);

        const tierVariation = Math.floor(Math.random() * 3) - 1;
        const tier = Math.max(1, baseTier + tierVariation);
        // Health scales linearly with tier: tier 1 = 3, tier 5 = 15, tier 10 = 30
        const maxHealth = new Decimal(tier * 3);

        bricks.push({
          id: generateId(),
          x,
          y,
          width: this.brickWidth,
          height: this.brickHeight,
          tier,
          health: maxHealth,
          maxHealth,
          value: new Decimal(tier),
        });
        created++;
      }
    }

    return bricks;
  }

  addBricksToFillScreen(currentBricks: BrickData[], baseTier: number): BrickData[] {
    const { width, height } = this.scene.cameras.main;
    const cols = Math.floor(
      (width - this.offsetLeft * 2) / (this.brickWidth + this.padding)
    );
    const maxRows = Math.floor(
      (height * 0.5 - this.offsetTop) / (this.brickHeight + this.padding)
    );
    const maxBricks = cols * maxRows;

    const bricksToAdd = Math.min(maxBricks - currentBricks.length, cols);
    if (bricksToAdd <= 0) return [];

    const occupied = new Set<string>();
    for (const brick of currentBricks) {
      const col = Math.round(
        (brick.x - this.offsetLeft) / (this.brickWidth + this.padding)
      );
      const row = Math.round(
        (brick.y - this.offsetTop) / (this.brickHeight + this.padding)
      );
      occupied.add(`${row},${col}`);
    }

    const newBricks: BrickData[] = [];

    for (let row = 0; row < maxRows && newBricks.length < bricksToAdd; row++) {
      for (let col = 0; col < cols && newBricks.length < bricksToAdd; col++) {
        if (!occupied.has(`${row},${col}`)) {
          const x = this.offsetLeft + col * (this.brickWidth + this.padding);
          const y = this.offsetTop + row * (this.brickHeight + this.padding);

          const tierVariation = Math.floor(Math.random() * 3) - 1;
          const tier = Math.max(1, baseTier + tierVariation);
          // Health scales linearly with tier: tier 1 = 3, tier 5 = 15, tier 10 = 30
          const maxHealth = new Decimal(tier * 3);

          newBricks.push({
            id: generateId(),
            x,
            y,
            width: this.brickWidth,
            height: this.brickHeight,
            tier,
            health: maxHealth,
            maxHealth,
            value: new Decimal(tier),
          });
        }
      }
    }

    return newBricks;
  }
}
