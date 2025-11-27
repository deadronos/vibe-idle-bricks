import Phaser from 'phaser';
import { Ball } from '../objects/Ball';
import { useGameStore } from '../../store/useGameStore';
import { GAME_CONSTANTS } from '../../types/game';
import type { BrickData } from '../../types/game';

/**
 * Phaser representation of a brick with physics
 */
interface PhysicsBrick extends Phaser.Physics.Arcade.Image {
  brickId: string;
}

/**
 * Main game scene that handles ball physics and brick collision
 */
export class GameScene extends Phaser.Scene {
  private balls: Ball[] = [];
  private brickSprites: Map<string, PhysicsBrick> = new Map();
  private brickGroup!: Phaser.Physics.Arcade.StaticGroup;
  private viewportOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Preload assets
   */
  preload(): void {
    // Create ball texture
    const ballGraphics = this.make.graphics({ x: 0, y: 0 });
    ballGraphics.fillStyle(0xffffff);
    ballGraphics.fillCircle(
      GAME_CONSTANTS.BALL_RADIUS,
      GAME_CONSTANTS.BALL_RADIUS,
      GAME_CONSTANTS.BALL_RADIUS
    );
    ballGraphics.generateTexture('ball', GAME_CONSTANTS.BALL_RADIUS * 2, GAME_CONSTANTS.BALL_RADIUS * 2);
    ballGraphics.destroy();

    // Create brick texture
    const brickGraphics = this.make.graphics({ x: 0, y: 0 });
    brickGraphics.fillStyle(0xffffff);
    brickGraphics.fillRect(0, 0, GAME_CONSTANTS.BRICK_WIDTH, GAME_CONSTANTS.BRICK_HEIGHT);
    brickGraphics.generateTexture('brick', GAME_CONSTANTS.BRICK_WIDTH, GAME_CONSTANTS.BRICK_HEIGHT);
    brickGraphics.destroy();
  }

  /**
   * Create game objects
   */
  create(): void {
    // Set world bounds
    this.physics.world.setBounds(
      0,
      0,
      GAME_CONSTANTS.GAME_WIDTH,
      GAME_CONSTANTS.GAME_HEIGHT
    );

    // Create brick static group
    this.brickGroup = this.physics.add.staticGroup();

    // Initialize game state
    const store = useGameStore.getState();
    store.initializeBricks();

    // Create initial balls
    this.syncBalls();

    // Create initial bricks
    this.syncBricks();

    // Set up collision between balls and bricks
    this.physics.add.collider(
      this.balls,
      this.brickGroup,
      this.handleBallBrickCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  /**
   * Update loop - called each frame
   */
  update(): void {
    // Sync ball count with store
    this.syncBalls();

    // Update all balls
    this.balls.forEach(ball => ball.update());

    // Sync visible bricks
    this.syncBricks();

    // Update collision handler for new balls/bricks
    this.updateCollisions();
  }

  /**
   * Syncs the number of balls with the store
   */
  private syncBalls(): void {
    const store = useGameStore.getState();
    const { ballStats } = store;
    const targetCount = ballStats.count;

    // Add new balls if needed
    while (this.balls.length < targetCount) {
      const ball = this.createBall(ballStats.speed, this.balls.length);
      this.balls.push(ball);
    }

    // Update ball speeds
    this.balls.forEach(ball => {
      ball.updateSpeed(ballStats.speed);
    });
  }

  /**
   * Creates a new ball at a random position
   */
  private createBall(speed: number, id: number): Ball {
    const x = Phaser.Math.Between(100, GAME_CONSTANTS.GAME_WIDTH - 100);
    const y = Phaser.Math.Between(
      GAME_CONSTANTS.GAME_HEIGHT - 100,
      GAME_CONSTANTS.GAME_HEIGHT - 50
    );

    return new Ball(this, x, y, speed, id);
  }

  /**
   * Syncs visible bricks with the store using viewport chunking
   */
  private syncBricks(): void {
    const store = useGameStore.getState();
    const visibleBricks = store.getVisibleBricks();

    // Create set of visible brick IDs
    const visibleIds = new Set(visibleBricks.map(b => b.id));

    // Remove bricks that are no longer visible
    this.brickSprites.forEach((sprite, id) => {
      if (!visibleIds.has(id)) {
        sprite.destroy();
        this.brickSprites.delete(id);
      }
    });

    // Add or update visible bricks
    visibleBricks.forEach(brickData => {
      this.updateBrickSprite(brickData);
    });
  }

  /**
   * Updates or creates a brick sprite
   */
  private updateBrickSprite(brickData: BrickData): void {
    let sprite = this.brickSprites.get(brickData.id);

    if (!sprite) {
      // Create new brick sprite
      sprite = this.brickGroup.create(
        brickData.x + brickData.width / 2 - this.viewportOffset.x,
        brickData.y + brickData.height / 2 - this.viewportOffset.y,
        'brick'
      ) as PhysicsBrick;
      
      sprite.brickId = brickData.id;
      sprite.setDisplaySize(brickData.width, brickData.height);
      sprite.setTint(brickData.color);
      sprite.refreshBody();
      
      this.brickSprites.set(brickData.id, sprite);
    }

    // Update brick color based on health percentage
    const healthPercent = brickData.health.div(brickData.maxHealth).toNumber();
    if (healthPercent < 1) {
      // Darken the brick as it takes damage
      const r = ((brickData.color >> 16) & 0xff) * healthPercent;
      const g = ((brickData.color >> 8) & 0xff) * healthPercent;
      const b = (brickData.color & 0xff) * healthPercent;
      sprite.setTint(Phaser.Display.Color.GetColor(Math.floor(r), Math.floor(g), Math.floor(b)));
    }
  }

  /**
   * Updates collision handlers when balls or bricks change
   */
  private updateCollisions(): void {
    // Clear all existing colliders properly
    this.physics.world.colliders.getActive().forEach(collider => {
      this.physics.world.removeCollider(collider);
    });

    // Add collision between all balls and bricks
    if (this.balls.length > 0 && this.brickGroup.getLength() > 0) {
      this.physics.add.collider(
        this.balls,
        this.brickGroup,
        this.handleBallBrickCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }
  }

  /**
   * Handles collision between a ball and a brick
   */
  private handleBallBrickCollision(
    ballObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    brickObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const ball = ballObj as Ball;
    const brick = brickObj as PhysicsBrick;

    // Ensure ball maintains velocity
    ball.handleCollision();

    // Get brick ID and damage it
    const brickId = brick.brickId;
    if (!brickId) return;

    const store = useGameStore.getState();
    const damage = store.ballStats.damage;
    const remainingHealth = store.damageBrick(brickId, damage);

    if (remainingHealth === null) {
      // Brick was destroyed
      this.destroyBrick(brickId);
    }
  }

  /**
   * Destroys a brick sprite
   */
  private destroyBrick(brickId: string): void {
    const sprite = this.brickSprites.get(brickId);
    if (sprite) {
      // Add destruction effect
      this.addDestroyEffect(sprite.x, sprite.y, sprite.tintTopLeft);
      
      sprite.destroy();
      this.brickSprites.delete(brickId);
    }
  }

  /**
   * Adds a visual effect when a brick is destroyed
   */
  private addDestroyEffect(x: number, y: number, color: number): void {
    // Create particle effect
    const particles = this.add.particles(x, y, 'brick', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      lifespan: 300,
      quantity: 5,
      tint: color,
    });

    // Auto-destroy particles after animation
    this.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * Scrolls the viewport by a given amount
   */
  public scrollViewport(deltaX: number, deltaY: number): void {
    this.viewportOffset.x += deltaX;
    this.viewportOffset.y += deltaY;

    // Update store viewport
    const store = useGameStore.getState();
    store.setViewport(this.viewportOffset.x, this.viewportOffset.y);

    // Resync bricks for new viewport
    this.syncBricks();
  }
}

export default GameScene;
