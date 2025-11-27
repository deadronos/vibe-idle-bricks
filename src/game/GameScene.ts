import Phaser from 'phaser';
import { Ball } from './Ball';
import { Brick } from './Brick';
import { ChunkManager } from './ChunkManager';
import { useGameStore } from '../store/useGameStore';
import { GAME_CONFIG, BALL_CONFIG, VIEWPORT_CONFIG } from '../config/gameConfig';
import type { BrickData } from '../types';

/**
 * Main Game Scene - Handles all Phaser game logic
 * Manages balls, bricks, collisions, and viewport-based rendering
 */
export class GameScene extends Phaser.Scene {
  private balls: Ball[] = [];
  private bricks: Map<string, Brick> = new Map();
  private brickGroup!: Phaser.Physics.Arcade.StaticGroup;
  private chunkManager!: ChunkManager;
  
  // Camera controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  
  // Store subscription cleanup
  private unsubscribe?: () => void;
  
  // Track current ball count for spawning
  private currentBallCount: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Create a simple particle texture
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }

  create(): void {
    // Initialize physics group for bricks
    this.brickGroup = this.physics.add.staticGroup();
    
    // Initialize chunk manager
    this.chunkManager = new ChunkManager();
    this.setupChunkManager();
    
    // Setup world bounds
    this.setupWorldBounds();
    
    // Setup camera
    this.setupCamera();
    
    // Setup input
    this.setupInput();
    
    // Subscribe to store changes
    this.subscribeToStore();
    
    // Start the game
    const store = useGameStore.getState();
    store.startGame();
    
    // Initial chunk load
    this.updateViewport();
    
    // Spawn initial balls
    this.syncBalls();
    
    // Setup ball-brick collision
    this.setupCollisions();
  }

  /**
   * Setup the chunk manager callbacks
   */
  private setupChunkManager(): void {
    this.chunkManager.setOnChunkLoad((_chunkX, _chunkY, bricks) => {
      this.loadBricks(bricks);
    });
    
    this.chunkManager.setOnChunkUnload((chunkX, chunkY) => {
      this.unloadChunk(chunkX, chunkY);
    });
  }

  /**
   * Setup world bounds based on total grid size
   */
  private setupWorldBounds(): void {
    const worldSize = ChunkManager.getTotalWorldSize();
    
    // Set physics world bounds
    this.physics.world.setBounds(
      0,
      0,
      worldSize.width,
      worldSize.height
    );
  }

  /**
   * Setup camera with pan controls
   */
  private setupCamera(): void {
    const worldSize = ChunkManager.getTotalWorldSize();
    
    // Set camera bounds
    this.cameras.main.setBounds(0, 0, worldSize.width, worldSize.height);
    
    // Enable camera follow smoothing
    this.cameras.main.setLerp(0.1, 0.1);
    
    // Initial position
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
  }

  /**
   * Setup keyboard input for camera control
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;
    
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    
    // Mouse wheel zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      const camera = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(
        camera.zoom + (deltaY > 0 ? -VIEWPORT_CONFIG.zoomStep : VIEWPORT_CONFIG.zoomStep),
        VIEWPORT_CONFIG.zoomMin,
        VIEWPORT_CONFIG.zoomMax
      );
      camera.setZoom(newZoom);
      this.updateViewport();
    });
    
    // Mouse drag pan
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let cameraStartX = 0;
    let cameraStartY = 0;
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        isDragging = true;
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        cameraStartX = this.cameras.main.scrollX;
        cameraStartY = this.cameras.main.scrollY;
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const dx = dragStartX - pointer.x;
        const dy = dragStartY - pointer.y;
        this.cameras.main.scrollX = cameraStartX + dx / this.cameras.main.zoom;
        this.cameras.main.scrollY = cameraStartY + dy / this.cameras.main.zoom;
        this.updateViewport();
      }
    });
    
    this.input.on('pointerup', () => {
      isDragging = false;
    });
  }

  /**
   * Subscribe to Zustand store for reactive updates
   */
  private subscribeToStore(): void {
    // Subscribe to ball count changes
    this.unsubscribe = useGameStore.subscribe(
      (state) => state.ballStats.count,
      (newCount) => {
        if (newCount !== this.currentBallCount) {
          this.syncBalls();
        }
      }
    );
    
    // Also subscribe to ball stats for damage/speed updates
    useGameStore.subscribe(
      (state) => state.ballStats,
      (stats) => {
        this.updateBallStats(stats.damage, stats.speed);
      }
    );
  }

  /**
   * Setup collision detection between balls and bricks
   */
  private setupCollisions(): void {
    // We'll use overlap with process callback for more control
    this.physics.add.collider(
      this.balls,
      this.brickGroup,
      (ballObj, brickObj) => {
        this.handleBallBrickCollision(ballObj as Ball, brickObj as unknown as Brick);
      },
      undefined,
      this
    );
  }

  /**
   * Handle collision between a ball and a brick
   */
  private handleBallBrickCollision(ball: Ball, brickRect: Brick): void {
    const brick = brickRect as Brick;
    const brickId = brick.getId();
    const damage = ball.getDamage();
    
    // Apply damage through the store
    const store = useGameStore.getState();
    const result = store.damageBrick(brickId, damage);
    
    if (result) {
      if (result.destroyed) {
        // Brick destroyed
        brick.playSimpleDestroyEffect();
        this.removeBrick(brickId);
      } else {
        // Brick damaged but not destroyed
        const { x, y } = brick.getGridPosition();
        const newData = store.getBrickData(x, y);
        brick.updateData(newData);
        brick.showDamageNumber(damage);
      }
      
      // Apply slight velocity change to ball
      ball.onBrickCollision();
    }
  }

  /**
   * Load bricks from brick data array
   */
  private loadBricks(brickDataArray: BrickData[]): void {
    for (const data of brickDataArray) {
      if (!this.bricks.has(data.id)) {
        const brick = new Brick(this, data);
        this.bricks.set(data.id, brick);
        this.brickGroup.add(brick);
      }
    }
  }

  /**
   * Unload all bricks in a chunk
   */
  private unloadChunk(chunkX: number, chunkY: number): void {
    const positions = this.chunkManager.getBrickPositionsInChunk(chunkX, chunkY);
    
    for (const pos of positions) {
      const id = `${pos.x},${pos.y}`;
      const brick = this.bricks.get(id);
      if (brick) {
        this.brickGroup.remove(brick);
        brick.destroy();
        this.bricks.delete(id);
      }
    }
  }

  /**
   * Remove a specific brick by ID
   */
  private removeBrick(brickId: string): void {
    const brick = this.bricks.get(brickId);
    if (brick) {
      this.brickGroup.remove(brick);
      brick.destroy();
      this.bricks.delete(brickId);
    }
  }

  /**
   * Sync ball count with store
   */
  private syncBalls(): void {
    const store = useGameStore.getState();
    const targetCount = store.ballStats.count;
    
    // Remove excess balls
    while (this.balls.length > targetCount) {
      const ball = this.balls.pop();
      if (ball) {
        ball.destroy();
      }
    }
    
    // Add new balls
    while (this.balls.length < targetCount) {
      this.spawnBall();
    }
    
    this.currentBallCount = targetCount;
    
    // Refresh collision
    this.setupCollisions();
  }

  /**
   * Spawn a new ball
   */
  private spawnBall(): void {
    const store = useGameStore.getState();
    const { damage, speed } = store.ballStats;
    
    // Spawn at center of current viewport
    const camera = this.cameras.main;
    const spawnX = camera.scrollX + GAME_CONFIG.canvasWidth / 2;
    const spawnY = camera.scrollY + GAME_CONFIG.canvasHeight / 2;
    
    const ball = new Ball({
      scene: this,
      x: spawnX,
      y: spawnY,
      speed: speed,
      damage: damage,
      radius: BALL_CONFIG.radius,
      color: BALL_CONFIG.baseColor,
    });
    
    this.balls.push(ball);
  }

  /**
   * Update all balls' stats
   */
  private updateBallStats(damage: import('break_infinity.js').default, speed: number): void {
    for (const ball of this.balls) {
      ball.setDamage(damage);
      ball.setSpeed(speed);
    }
  }

  /**
   * Update the viewport and trigger chunk loading
   */
  private updateViewport(): void {
    const camera = this.cameras.main;
    const store = useGameStore.getState();
    
    const viewport = {
      x: camera.scrollX,
      y: camera.scrollY,
      width: camera.width / camera.zoom,
      height: camera.height / camera.zoom,
    };
    
    store.setViewport(viewport);
    store.setCameraPosition(camera.scrollX, camera.scrollY);
    
    this.chunkManager.updateViewport(viewport, (x, y) => store.getBrickData(x, y));
  }

  /**
   * Handle camera movement via keyboard
   */
  private handleCameraInput(delta: number): void {
    const speed = VIEWPORT_CONFIG.panSpeed * (delta / 1000);
    const camera = this.cameras.main;
    
    let moved = false;
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      camera.scrollX -= speed;
      moved = true;
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      camera.scrollX += speed;
      moved = true;
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      camera.scrollY -= speed;
      moved = true;
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      camera.scrollY += speed;
      moved = true;
    }
    
    if (moved) {
      this.updateViewport();
    }
  }

  update(_time: number, delta: number): void {
    const store = useGameStore.getState();
    
    // Skip update if paused
    if (store.isPaused) return;
    
    // Handle camera input
    this.handleCameraInput(delta);
    
    // Keep balls within current physics bounds
    for (const ball of this.balls) {
      const body = ball.body as Phaser.Physics.Arcade.Body;
      if (body) {
        // Ensure ball stays in world
        const worldSize = ChunkManager.getTotalWorldSize();
        if (ball.x < BALL_CONFIG.radius) {
          ball.x = BALL_CONFIG.radius;
          body.setVelocityX(Math.abs(body.velocity.x));
        }
        if (ball.x > worldSize.width - BALL_CONFIG.radius) {
          ball.x = worldSize.width - BALL_CONFIG.radius;
          body.setVelocityX(-Math.abs(body.velocity.x));
        }
        if (ball.y < BALL_CONFIG.radius) {
          ball.y = BALL_CONFIG.radius;
          body.setVelocityY(Math.abs(body.velocity.y));
        }
        if (ball.y > worldSize.height - BALL_CONFIG.radius) {
          ball.y = worldSize.height - BALL_CONFIG.radius;
          body.setVelocityY(-Math.abs(body.velocity.y));
        }
      }
    }
  }

  /**
   * Clean up on scene shutdown
   */
  shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Clean up balls
    for (const ball of this.balls) {
      ball.destroy();
    }
    this.balls = [];
    
    // Clean up bricks
    for (const brick of this.bricks.values()) {
      brick.destroy();
    }
    this.bricks.clear();
  }
}
