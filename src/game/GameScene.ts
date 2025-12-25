import Phaser from 'phaser';
import Decimal from 'break_infinity.js';
import { useGameStore } from '../store';
import { BALL_TYPES } from '../types';
import type { BallData, BrickData } from '../types';
import { generateId, getTierColor, adjustBrightness, formatNumber } from '../utils';
import { SpatialGrid } from './SpatialGrid';

/**
 * Main game scene that handles the physics, rendering, and game loop.
 * Connects the Phaser game engine with the Zustand store.
 */
export class GameScene extends Phaser.Scene {
  private ballGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private brickGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private brickTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private explosionGraphics: Phaser.GameObjects.Graphics[] = [];
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private brickManager!: BrickManager;
  private unsubscribe: (() => void) | null = null;
  private spatialGrid: SpatialGrid = new SpatialGrid(100);

  // Visual Effects
  private particleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private floatingTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Initializes the scene, sets up graphics, inputs, and the game loop.
   * Called once when the scene starts.
   */
  create() {
    // Generate textures
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 4, 4);
    graphics.generateTexture('particle', 4, 4);

    // Draw background
    this.backgroundGraphics = this.add.graphics();
    this.drawBackground();

    // Initialize particle emitter
    this.particleEmitter = this.add.particles(0, 0, 'particle', {
      lifespan: 600,
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false
    });

    // Initialize brick manager
    this.brickManager = new BrickManager(this);

    // Subscribe to store changes to keep spatial grid in sync
    this.unsubscribe = useGameStore.subscribe(
      (state) => state.bricks,
      (bricks) => {
        this.spatialGrid.rebuild(bricks);
      }
    );

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

    // Initial resize trigger to ensure bricks are placed correctly
    this.handleResize(this.scale.gameSize);
  }

  /**
   * Handles the window resize event to update canvas size in the store.
   * @param gameSize - The new size of the game canvas.
   */
  handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    useGameStore.getState().setCanvasSize(width, height);
    this.drawBackground();

    // Update existing bricks position ratio if needed, or just let them be.
    // Ideally we might want to re-layout bricks, but for now let's just ensure
    // the brick manager knows about the new bounds for FUTURE bricks.
    // The BrickManager reads from cameras.main which is updated by Phaser automatically.
  }

  /**
   * Draws the background grid and background color.
   */
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

  /**
   * Main game loop, called every frame.
   * Updates game logic and renders entities.
   *
   * @param _time - The current time.
   * @param delta - The time elapsed since the last frame in ms.
   */
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
    this.updateFloatingTexts(delta);
  }

  /**
   * Spawns a floating text effect at the specified position.
   * Used for damage numbers and coin gains.
   *
   * @param x - X coordinate.
   * @param y - Y coordinate.
   * @param text - The text to display.
   * @param color - The hex color string.
   */
  showFloatingText(x: number, y: number, text: string, color: string = '#ffffff') {
    const floatingText = this.add.text(x, y, text, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 2
    });
    floatingText.setOrigin(0.5);
    // Store creation time to handle fade out
    floatingText.setData('life', 1000);
    this.floatingTexts.push(floatingText);
  }

  /**
   * Updates and renders all active floating text effects.
   * @param delta - Time elapsed since last frame.
   */
  updateFloatingTexts(delta: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      const life = text.getData('life') - delta;

      if (life <= 0) {
        text.destroy();
        this.floatingTexts.splice(i, 1);
      } else {
        text.setData('life', life);
        text.y -= 0.05 * delta; // Float up
        text.setAlpha(life / 1000);
      }
    }
  }

  /**
   * Updates the physics and position of all balls.
   * Handles movement, wall collisions, and interaction with bricks.
   *
   * @param delta - Time elapsed since last frame.
   */
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

  /**
   * Calculates a steering vector for a ball to target the weakest brick.
   *
   * @param ball - The ball to steer.
   * @param dx - Current X velocity.
   * @param dy - Current Y velocity.
   * @param bricks - List of potential target bricks.
   * @returns {[number, number]} The new velocity vector [dx, dy].
   */
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

  /**
   * Checks for collisions between a ball and any brick.
   * Handles damage application, bouncing, and effects.
   *
   * @param ball - The ball to check.
   * @param damageMult - Global damage multiplier.
   * @param coinMult - Global coin multiplier.
   * @param config - The ball's configuration.
   * @returns {{ dx: number; dy: number } | null} New velocity vector if bounced, or null if no collision.
   */
  checkBrickCollisions(
    ball: BallData,
    damageMult: number,
    coinMult: number,
    config: typeof BALL_TYPES[keyof typeof BALL_TYPES]
  ): { dx: number; dy: number } | null {
    const store = useGameStore.getState();
    const actualDamage = new Decimal(config.damage).mul(damageMult);
    // Ball radius is 8
    const potentialBricks = this.spatialGrid.query(ball, 8);

    for (const brick of potentialBricks) {
      if (this.ballCollidesWithBrick(ball, brick)) {
        const result = store.damageBrick(brick.id, actualDamage);

        if (result) {
          // Floating text for damage
          // Only show if damage is significant or it's a special ball to reduce clutter
          if (config.damage > 1 || config.explosive || ball.type === 'sniper') {
             this.showFloatingText(brick.x + brick.width/2, brick.y, `-${formatNumber(actualDamage)}`, '#ff4444');
          }

          if (result.destroyed) {
            const coinsEarned = brick.value.mul(coinMult);
            store.addCoins(coinsEarned);
            store.incrementBricksBroken();

            // Visual effects
            const color = getTierColor(brick.tier);
            const colorNum = Phaser.Display.Color.HexStringToColor(color).color;

            this.particleEmitter.setPosition(brick.x + brick.width / 2, brick.y + brick.height / 2);
            this.particleEmitter.setParticleTint(colorNum);
            this.particleEmitter.explode(10);

            // Floating text for coins
            this.showFloatingText(brick.x + brick.width/2, brick.y, `+${formatNumber(coinsEarned)}`, '#ffd700');
          }
        }

        // Explosive effect
        if (config.explosive && config.explosionRadius) {
          this.explode(ball.x, ball.y, config.explosionRadius, actualDamage, coinMult);
          this.cameras.main.shake(100, 0.005); // Screen shake
        }

        // Bounce unless piercing
        if (!config.pierce) {
          return this.calculateBounce(ball, brick);
        }
      }
    }
    return null;
  }

  /**
   * Determines if a ball overlaps with a brick.
   *
   * @param ball - The ball.
   * @param brick - The brick.
   * @returns {boolean} True if they collide.
   */
  ballCollidesWithBrick(ball: BallData, brick: BrickData): boolean {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    return distX * distX + distY * distY < 64; // 8 * 8 radius squared
  }

  /**
   * Calculates the bounce direction when a ball hits a brick.
   *
   * @param ball - The ball.
   * @param brick - The brick.
   * @returns {{ dx: number; dy: number }} The new velocity vector.
   */
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

  /**
   * Triggers an area-of-effect explosion.
   *
   * @param x - Center X.
   * @param y - Center Y.
   * @param radius - Explosion radius.
   * @param damage - Damage to deal to bricks in range.
   * @param coinMult - Coin multiplier for destroyed bricks.
   */
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

          // Particles for exploded bricks
          const color = getTierColor(brick.tier);
          const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
          this.particleEmitter.setPosition(brick.x + brick.width / 2, brick.y + brick.height / 2);
          this.particleEmitter.setParticleTint(colorNum);
          this.particleEmitter.explode(8);
        }
      }
    }

    store.addExplosion(x, y, radius);
  }

  /**
   * Renders the balls on the canvas using Phaser Graphics.
   * @param balls - List of balls to render.
   */
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

      // Draw trail for fast/special balls
      if (config.speed > 5 || ball.type === 'sniper' || ball.type === 'plasma') {
         graphics.lineStyle(4, color, 0.3);
         graphics.beginPath();
         graphics.moveTo(ball.x, ball.y);
         graphics.lineTo(ball.x - ball.dx * 0.15, ball.y - ball.dy * 0.15);
         graphics.strokePath();
      }

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

  /**
   * Renders the bricks on the canvas.
   * @param bricks - List of bricks to render.
   */
  renderBricks(bricks: BrickData[]) {
    // Remove old graphics and text for bricks that no longer exist
    const currentIds = new Set(bricks.map((b) => b.id));
    for (const [id, graphics] of this.brickGraphics) {
      if (!currentIds.has(id)) {
        graphics.destroy();
        this.brickGraphics.delete(id);
      }
    }
    for (const [id, text] of this.brickTexts) {
      if (!currentIds.has(id)) {
        text.destroy();
        this.brickTexts.delete(id);
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
        let text = this.brickTexts.get(brick.id);
        if (!text) {
          text = this.add.text(
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
          this.brickTexts.set(brick.id, text);
        } else {
          // Update position just in case, though bricks don't move currently
          text.setPosition(brick.x + brick.width / 2, brick.y + brick.height / 2);
          text.setText(brick.tier.toString());
        }
      } else {
        // If tier is 1, we don't show text, so remove it if it exists
        const text = this.brickTexts.get(brick.id);
        if (text) {
          text.destroy();
          this.brickTexts.delete(brick.id);
        }
      }
    }
  }

  /**
   * Renders active explosions.
   */
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

  /**
   * Cleanup when the scene is shut down.
   */
  shutdown() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    useGameStore.getState().save();
  }
}

/**
 * Helper class to manage brick generation and placement.
 */
class BrickManager {
  private scene: GameScene;
  private brickWidth = 60;
  private brickHeight = 25;
  private padding = 5;

  // Dynamic offsets
  private get offsetTop() { return Math.max(20, this.scene.cameras.main.height * 0.1); }
  private get offsetLeft() { return Math.max(20, (this.scene.cameras.main.width % (this.brickWidth + this.padding)) / 2); }

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  /**
   * Generates a grid of bricks.
   *
   * @param count - Total number of bricks to generate.
   * @param baseTier - Base difficulty tier for the bricks.
   * @returns {BrickData[]} List of generated bricks.
   */
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

        const brickValue = Math.floor(Math.pow(tier, 1.2));
        bricks.push({
          id: generateId(),
          x,
          y,
          width: this.brickWidth,
          height: this.brickHeight,
          tier,
          health: maxHealth,
          maxHealth,
          value: new Decimal(brickValue),
        });
        created++;
      }
    }

    return bricks;
  }

  /**
   * Adds new bricks to fill empty space on the screen.
   *
   * @param currentBricks - Existing bricks to avoid overlapping.
   * @param baseTier - Base difficulty tier.
   * @returns {BrickData[]} List of newly added bricks.
   */
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

          const brickValue = Math.floor(Math.pow(tier, 1.2));
          newBricks.push({
            id: generateId(),
            x,
            y,
            width: this.brickWidth,
            height: this.brickHeight,
            tier,
            health: maxHealth,
            maxHealth,
            value: new Decimal(brickValue),
          });
        }
      }
    }

    return newBricks;
  }
}
