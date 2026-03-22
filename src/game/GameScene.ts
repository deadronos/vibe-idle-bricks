import Phaser from 'phaser';
import Decimal from 'break_infinity.js';
import { useGameStore } from '../store';
import { BALL_TYPES } from '../types';
import type { BallData, BrickData } from '../types';
import { formatNumber } from '../utils';
import { BrickManager } from './BrickManager';
import { GameEffects } from './GameEffects';
import { BallRenderer, BrickRenderer } from './GameRenderers';
import { SpatialGrid } from './SpatialGrid';

const BALL_RADIUS = 8;
const FIXED_STEP = 8; // ms

type BallConfig = (typeof BALL_TYPES)[keyof typeof BALL_TYPES];

/**
 * Main game scene that handles the physics, rendering, and game loop.
 * Connects the Phaser game engine with the Zustand store.
 */
export class GameScene extends Phaser.Scene {
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private brickManager!: BrickManager;
  private ballRenderer!: BallRenderer;
  private brickRenderer!: BrickRenderer;
  private effects!: GameEffects;
  private unsubscribe: (() => void) | null = null;
  private spatialGrid: SpatialGrid = new SpatialGrid(100);
  private physicsAccumulator: number = 0;
  private weakestBrick: BrickData | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Initializes the scene, sets up graphics, inputs, and the game loop.
   * Called once when the scene starts.
   */
  create() {
    this.backgroundGraphics = this.add.graphics();
    this.drawBackground();

    this.brickManager = new BrickManager(this);
    this.ballRenderer = new BallRenderer(this);
    this.brickRenderer = new BrickRenderer(this);
    this.effects = new GameEffects(this);
    this.effects.initialize();

    this.unsubscribe = useGameStore.subscribe(
      (state) => state.bricks,
      (bricks) => {
        this.spatialGrid.rebuild(bricks);
        this.weakestBrick = this.findWeakestBrick(bricks);
      }
    );

    const store = useGameStore.getState();
    store.setCanvasSize(this.cameras.main.width, this.cameras.main.height);

    const initialBricks = this.brickManager.generateBricks(50, store.currentTier);
    store.setBricks(initialBricks);
    store.load();

    this.time.addEvent({
      delay: 30000,
      callback: () => useGameStore.getState().save(),
      loop: true,
    });

    this.scale.on('resize', this.handleResize, this);
    this.handleResize(this.scale.gameSize);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleBrickClick(pointer);
    });
  }

  /**
   * Handles the window resize event to update canvas size in the store.
   */
  handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    useGameStore.getState().setCanvasSize(width, height);
    this.drawBackground();
  }

  /**
   * Draws the background grid and background color.
   */
  drawBackground() {
    const { width, height } = this.cameras.main;
    this.backgroundGraphics.clear();

    this.backgroundGraphics.fillStyle(0x0f0f1a);
    this.backgroundGraphics.fillRect(0, 0, width, height);

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
   */
  update(_time: number, delta: number) {
    const initialState = useGameStore.getState();
    if (initialState.isPaused) {
      return;
    }

    this.physicsAccumulator += delta;
    while (this.physicsAccumulator >= FIXED_STEP) {
      this.updateBalls(FIXED_STEP);
      this.physicsAccumulator -= FIXED_STEP;
    }

    useGameStore.getState().updateExplosions(delta);

    const stateAfterSimulation = useGameStore.getState();
    if (stateAfterSimulation.bricks.length < 20) {
      const newBricks = this.brickManager.addBricksToFillScreen(
        stateAfterSimulation.bricks,
        stateAfterSimulation.currentTier
      );

      if (newBricks.length > 0) {
        stateAfterSimulation.setBricks([...stateAfterSimulation.bricks, ...newBricks]);
      }
    }

    const renderState = useGameStore.getState();
    this.renderBalls(renderState.balls);
    this.renderBricks(renderState.bricks);
    this.renderExplosions();
    this.updateFloatingTexts(delta);
  }

  /**
   * Spawns a floating text effect at the specified position.
   */
  showFloatingText(x: number, y: number, text: string, color: string = '#ffffff') {
    this.effects.showFloatingText(x, y, text, color);
  }

  /**
   * Updates and renders all active floating text effects.
   */
  updateFloatingTexts(delta: number) {
    this.effects.updateFloatingTexts(delta);
  }

  /**
   * Updates the physics and position of all balls.
   * Handles movement, wall collisions, and interaction with bricks.
   */
  updateBalls(step: number) {
    const store = useGameStore.getState();
    const { width, height } = this.cameras.main;
    const speedMult = store.getSpeedMult();
    const damageMult = store.getDamageMult();
    const coinMult = store.getCoinMult();
    const updatedBalls = store.balls.slice();

    for (const ball of updatedBalls) {
      this.simulateBall(ball, step, speedMult, damageMult, coinMult, width, height);
    }

    useGameStore.setState({ balls: updatedBalls });
  }

  /**
   * Calculates a steering vector for a ball to target the weakest brick.
   */
  seekWeakestBrick(
    ball: BallData,
    dx: number,
    dy: number,
    bricks: BrickData[]
  ): [number, number] {
    const weakest = this.weakestBrick ?? this.findWeakestBrick(bricks);

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
   * Finds the weakest brick in a set of bricks.
   */
  private findWeakestBrick(bricks: BrickData[]): BrickData | null {
    let weakest: BrickData | null = null;
    let minHealth = new Decimal(Infinity);

    for (const brick of bricks) {
      if (brick.health.lt(minHealth)) {
        minHealth = brick.health;
        weakest = brick;
      }
    }

    return weakest;
  }

  /**
   * Checks for collisions between a ball and any brick.
   * Handles damage application, bouncing, and effects.
   */
  checkBrickCollisions(
    ball: BallData,
    damageMult: number,
    coinMult: number,
    config: BallConfig
  ): { dx: number; dy: number } | null {
    const store = useGameStore.getState();
    const actualDamage = new Decimal(config.damage).mul(damageMult);
    const potentialBricks = this.spatialGrid.query(ball, BALL_RADIUS);

    for (const brick of potentialBricks) {
      if (!this.ballCollidesWithBrick(ball, brick)) {
        continue;
      }

      const result = store.damageBrick(brick.id, actualDamage);

      if (result) {
        if (config.damage > 1 || config.explosive || ball.type === 'sniper') {
          this.showFloatingText(
            brick.x + brick.width / 2,
            brick.y,
            `-${formatNumber(actualDamage)}`,
            '#ff4444'
          );
        }

        if (result.destroyed) {
          this.handleBrickDestroyed(brick, coinMult, 10, true);
        }
      }

      if (config.explosive && config.explosionRadius) {
        this.explode(ball.x, ball.y, config.explosionRadius, actualDamage, coinMult);
        this.effects.shakeExplosion();
      }

      if (!config.pierce) {
        return this.calculateBounce(ball, brick);
      }
    }

    return null;
  }

  /**
   * Determines if a ball overlaps with a brick.
   */
  ballCollidesWithBrick(ball: BallData, brick: BrickData): boolean {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    return distX * distX + distY * distY < BALL_RADIUS * BALL_RADIUS;
  }

  /**
   * Calculates the bounce direction when a ball hits a brick.
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
    }

    return { dx: ball.dx, dy: Math.abs(ball.dy) * Math.sign(deltaY) };
  }

  /**
   * Triggers an area-of-effect explosion.
   */
  explode(x: number, y: number, radius: number, damage: Decimal, coinMult: number) {
    const store = useGameStore.getState();
    const explosionDamage = damage.mul(0.5);
    const candidateBricks = this.spatialGrid.queryBounds(
      x - radius,
      y - radius,
      x + radius,
      y + radius
    );
    const impactedBricks = candidateBricks.filter((brick) => this.isBrickWithinRadius(x, y, radius, brick));

    const results = store.applyBrickDamageBatch(
      impactedBricks.map((brick) => ({
        id: brick.id,
        damage: explosionDamage,
      }))
    );

    for (const result of results) {
      if (result.destroyed) {
        this.handleBrickDestroyed(result.brick, coinMult, 8, false);
      }
    }

    store.addExplosion(x, y, radius);
  }

  /**
   * Renders the balls on the canvas using Phaser Graphics.
   */
  renderBalls(balls: BallData[]) {
    this.ballRenderer.render(balls);
  }

  /**
   * Renders the bricks on the canvas.
   */
  renderBricks(bricks: BrickData[]) {
    this.brickRenderer.render(bricks);
  }

  /**
   * Renders active explosions.
   */
  renderExplosions() {
    this.effects.renderExplosions(useGameStore.getState().explosions);
  }

  /**
   * Cleanup when the scene is shut down.
   */
  shutdown() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.weakestBrick = null;

    this.scale.off('resize', this.handleResize, this);
    this.ballRenderer?.destroy();
    this.brickRenderer?.destroy();
    this.effects?.destroy();
    useGameStore.getState().save();
  }

  private handleBrickDestroyed(
    brick: BrickData,
    coinMult: number,
    particleCount: number,
    showCoinText: boolean
  ) {
    const store = useGameStore.getState();
    const coinsEarned = brick.value.mul(coinMult);

    store.addCoins(coinsEarned);
    store.incrementBricksBroken();

    this.effects.emitBrickBreakParticles(brick, particleCount);
    if (showCoinText) {
      this.showFloatingText(
        brick.x + brick.width / 2,
        brick.y,
        `+${formatNumber(coinsEarned)}`,
        '#ffd700'
      );
    }
  }

  private isBrickWithinRadius(x: number, y: number, radius: number, brick: BrickData) {
    const brickCenterX = brick.x + brick.width / 2;
    const brickCenterY = brick.y + brick.height / 2;
    const deltaX = x - brickCenterX;
    const deltaY = y - brickCenterY;
    return deltaX * deltaX + deltaY * deltaY < radius * radius;
  }

  private simulateBall(
    ball: BallData,
    step: number,
    speedMult: number,
    damageMult: number,
    coinMult: number,
    width: number,
    height: number
  ) {
    const config = BALL_TYPES[ball.type];
    const actualSpeed = config.speed * speedMult;
    const currentSpeedSquared = ball.dx * ball.dx + ball.dy * ball.dy;

    let dx = ball.dx;
    let dy = ball.dy;

    if (currentSpeedSquared > 0) {
      const currentSpeed = Math.sqrt(currentSpeedSquared);
      dx = (ball.dx / currentSpeed) * actualSpeed;
      dy = (ball.dy / currentSpeed) * actualSpeed;
    }

    if (config.targeting) {
      const bricks = useGameStore.getState().bricks;
      if (bricks.length > 0) {
        [dx, dy] = this.seekWeakestBrick(ball, dx, dy, bricks);
      }
    }

    let x = ball.x + dx * (step / 16);
    let y = ball.y + dy * (step / 16);

    if (x - BALL_RADIUS < 0) {
      x = BALL_RADIUS;
      dx = Math.abs(dx);
    }
    if (x + BALL_RADIUS > width) {
      x = width - BALL_RADIUS;
      dx = -Math.abs(dx);
    }
    if (y - BALL_RADIUS < 0) {
      y = BALL_RADIUS;
      dy = Math.abs(dy);
    }
    if (y + BALL_RADIUS > height) {
      y = height - BALL_RADIUS;
      dy = -Math.abs(dy);
    }

    ball.x = x;
    ball.y = y;
    ball.dx = dx;
    ball.dy = dy;

    const bounceResult = this.checkBrickCollisions(ball, damageMult, coinMult, config);
    if (bounceResult) {
      ball.dx = bounceResult.dx;
      ball.dy = bounceResult.dy;
    }
  }

  private handleBrickClick(pointer: Phaser.Input.Pointer) {
    const { x, y } = pointer;
    const store = useGameStore.getState();
    const potentialBricks = this.spatialGrid.queryBounds(x - 5, y - 5, x + 5, y + 5);

    for (const brick of potentialBricks) {
      if (x >= brick.x && x <= brick.x + brick.width && y >= brick.y && y <= brick.y + brick.height) {
        const damageMult = store.getDamageMult();
        const coinMult = store.getCoinMult();
        const clickDamage = new Decimal(damageMult).mul(0.5); // 0.5 base damage scaled by upgrades

        const result = store.damageBrick(brick.id, clickDamage);
        if (result) {
          this.showFloatingText(x, y, `-${formatNumber(clickDamage)}`, '#ffcc00');
          if (result.destroyed) {
            this.handleBrickDestroyed(brick, coinMult, 5, true);
          }
        }
        break;
      }
    }
  }
}
