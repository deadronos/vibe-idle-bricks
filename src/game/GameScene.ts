import Phaser from 'phaser';
import Decimal from 'break_infinity.js';
import { useGameStore } from '../store';
import { BALL_TYPES } from '../types';
import type { BallData, BrickData } from '../types';
import { formatNumber } from '../utils';
import { BallPhysics } from './BallPhysics';
import { BrickManager } from './BrickManager';
import { GameEffects } from './GameEffects';
import { BallRenderer, BrickRenderer } from './GameRenderers';
import { SpatialGrid } from './SpatialGrid';
import {
  BALL_RADIUS,
  FIXED_STEP,
  MIN_BRICKS_ON_SCREEN,
  EXPLOSION_DAMAGE_MULTIPLIER,
  EXPLOSION_HIT_PARTICLE_COUNT,
  BALL_HIT_PARTICLE_COUNT,
  CLICK_DAMAGE_BASE,
  CLICK_PARTICLE_COUNT,
} from './constants';

type BallConfig = (typeof BALL_TYPES)[keyof typeof BALL_TYPES];

/**
 * Main game scene that handles the physics, rendering, and game loop.
 * Connects the Phaser game engine with the Zustand store.
 */
export class GameScene extends Phaser.Scene {
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private ballPhysics!: BallPhysics;
  private brickManager!: BrickManager;
  private ballRenderer!: BallRenderer;
  private brickRenderer!: BrickRenderer;
  private effects!: GameEffects;
  private spatialGrid: SpatialGrid = new SpatialGrid(100);
  private physicsAccumulator: number = 0;
  private weakestBrick: BrickData | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.ballPhysics = new BallPhysics(this.cameras.main.width, this.cameras.main.height);

    this.brickManager = new BrickManager(this);
    this.ballRenderer = new BallRenderer(this);
    this.brickRenderer = new BrickRenderer(this, this.time);
    this.effects = new GameEffects(this);
    this.effects.initialize();

    // Note: we rebuild the spatial grid once per frame in update() rather than
    // on every bricks state change, so we don't need to subscribe to brick changes.

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
    // Debounce resize to avoid recreating BallPhysics and redrawing on every pixel of drag.
    if (this.resizeTimer !== null) {
      clearTimeout(this.resizeTimer);
    }
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      const { width, height } = gameSize;
      this.ballPhysics = new BallPhysics(width, height);
      useGameStore.getState().setCanvasSize(width, height);
      this.drawBackground();
    }, 100);
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
    if (stateAfterSimulation.bricks.length < MIN_BRICKS_ON_SCREEN) {
      const newBricks = this.brickManager.addBricksToFillScreen(
        stateAfterSimulation.bricks,
        stateAfterSimulation.currentTier
      );

      if (newBricks.length > 0) {
        stateAfterSimulation.setBricks([...stateAfterSimulation.bricks, ...newBricks]);
      }
    }

    // Rebuild spatial grid and update targeting once per frame — after all brick mutations
    // are settled — rather than on every individual bricks state change.
    this.spatialGrid.rebuild(stateAfterSimulation.bricks);
    this.weakestBrick = this.ballPhysics.findWeakestBrick(stateAfterSimulation.bricks);

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
    const speedMult = store.getSpeedMult();
    const damageMult = store.getDamageMult();
    const coinMult = store.getCoinMult();
    const updatedBalls = store.balls.slice();

    for (const ball of updatedBalls) {
      this.simulateBall(ball, step, speedMult, damageMult, coinMult);
    }

    useGameStore.setState({ balls: updatedBalls });
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
    const physics = this.ballPhysics;

    for (const brick of potentialBricks) {
      if (!physics.ballCollidesWithBrick(ball, brick)) {
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
          this.handleBrickDestroyed(brick, coinMult, BALL_HIT_PARTICLE_COUNT, true);
        }
      }

      if (config.explosive && config.explosionRadius) {
        this.explode(ball.x, ball.y, config.explosionRadius, actualDamage, coinMult);
        this.effects.shakeExplosion();
      }

      if (!config.pierce) {
        return physics.calculateBounce(ball, brick);
      }
    }

    return null;
  }

  /**
   * Triggers an area-of-effect explosion.
   */
  explode(x: number, y: number, radius: number, damage: Decimal, coinMult: number) {
    const store = useGameStore.getState();
    const explosionDamage = damage.mul(EXPLOSION_DAMAGE_MULTIPLIER);
    const candidateBricks = this.spatialGrid.queryBounds(
      x - radius,
      y - radius,
      x + radius,
      y + radius
    );
    const impactedBricks = candidateBricks.filter((brick) => this.ballPhysics.isBrickWithinRadius(x, y, radius, brick));

    const results = store.applyBrickDamageBatch(
      impactedBricks.map((brick) => ({
        id: brick.id,
        damage: explosionDamage,
      }))
    );

    for (const result of results) {
      if (result.destroyed) {
        this.handleBrickDestroyed(result.brick, coinMult, EXPLOSION_HIT_PARTICLE_COUNT, false);
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
    if (this.resizeTimer !== null) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
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

  private simulateBall(
    ball: BallData,
    step: number,
    speedMult: number,
    damageMult: number,
    coinMult: number
  ) {
    const physics = this.ballPhysics;
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
        const target = this.weakestBrick ?? physics.findWeakestBrick(bricks);
        [dx, dy] = physics.seekTarget(ball, dx, dy, target);
      }
    }

    ball.dx = dx;
    ball.dy = dy;

    const movedBall = physics.applyBallMovement(ball, step);
    ball.x = movedBall.x;
    ball.y = movedBall.y;
    ball.dx = movedBall.dx;
    ball.dy = movedBall.dy;

    const bounceResult = this.checkBrickCollisions(ball, damageMult, coinMult, config);
    if (bounceResult) {
      ball.dx = bounceResult.dx;
      ball.dy = bounceResult.dy;
    }

    const normalizedVelocity = physics.normalizeVelocity(ball.dx, ball.dy, actualSpeed);
    ball.dx = normalizedVelocity.dx;
    ball.dy = normalizedVelocity.dy;
  }

  private handleBrickClick(pointer: Phaser.Input.Pointer) {
    const { x, y } = pointer;
    const store = useGameStore.getState();
    const potentialBricks = this.spatialGrid.queryBounds(x - 5, y - 5, x + 5, y + 5);

    for (const brick of potentialBricks) {
      if (x >= brick.x && x <= brick.x + brick.width && y >= brick.y && y <= brick.y + brick.height) {
        const damageMult = store.getDamageMult();
        const coinMult = store.getCoinMult();
        const clickDamage = new Decimal(damageMult).mul(CLICK_DAMAGE_BASE);

        const result = store.damageBrick(brick.id, clickDamage);
        if (result) {
          this.showFloatingText(x, y, `-${formatNumber(clickDamage)}`, '#ffcc00');
          if (result.destroyed) {
            this.handleBrickDestroyed(brick, coinMult, CLICK_PARTICLE_COUNT, true);
          }
        }
        break;
      }
    }
  }
}
