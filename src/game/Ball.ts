import Phaser from 'phaser';
import Decimal from 'break_infinity.js';

interface BallConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  speed: number;
  damage: Decimal;
  texture?: string;
  radius?: number;
  color?: number;
}

/**
 * Ball class - Extends Phaser.Physics.Arcade.Image
 * Handles ball movement, bouncing, and collision logic
 */
export class Ball extends Phaser.Physics.Arcade.Image {
  private ballSpeed: number;
  private ballDamage: Decimal;
  private readonly radius: number;
  private trail: Phaser.GameObjects.Graphics | null = null;
  private trailPoints: { x: number; y: number; alpha: number }[] = [];
  private readonly maxTrailPoints = 10;

  constructor(config: BallConfig) {
    // Create a graphics texture for the ball if not provided
    const textureKey = config.texture || `ball_${config.color || 0xffffff}`;
    
    // Check if texture exists, if not create it
    if (!config.scene.textures.exists(textureKey)) {
      Ball.createBallTexture(config.scene, textureKey, config.radius || 8, config.color || 0xffffff);
    }
    
    super(config.scene, config.x, config.y, textureKey);
    
    this.radius = config.radius || 8;
    this.ballSpeed = config.speed;
    this.ballDamage = config.damage;
    
    // Add to scene
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);
    
    // Configure physics body
    this.setupPhysics();
    
    // Start with random direction
    this.launchBall();
  }

  /**
   * Create a ball texture programmatically
   */
  static createBallTexture(
    scene: Phaser.Scene,
    key: string,
    radius: number,
    color: number
  ): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    
    // Draw gradient ball with highlight
    graphics.fillStyle(color, 1);
    graphics.fillCircle(radius, radius, radius);
    
    // Add highlight
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(radius - radius * 0.3, radius - radius * 0.3, radius * 0.4);
    
    // Generate texture
    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
  }

  /**
   * Setup physics properties for the ball
   */
  private setupPhysics(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    if (body) {
      // Set circular body
      body.setCircle(this.radius);
      
      // Enable world bounds collision
      body.setCollideWorldBounds(true);
      body.setBounce(1, 1);
      
      // Prevent the ball from sleeping
      body.setAllowGravity(false);
      
      // Set max velocity to prevent extreme speeds
      body.setMaxVelocity(this.ballSpeed * 1.5, this.ballSpeed * 1.5);
    }
  }

  /**
   * Launch the ball in a random direction
   */
  launchBall(): void {
    // Random angle between -45 and 45 degrees (upward)
    const angle = Phaser.Math.FloatBetween(-Math.PI / 4, Math.PI / 4) - Math.PI / 2;
    
    const velocityX = Math.cos(angle) * this.ballSpeed;
    const velocityY = Math.sin(angle) * this.ballSpeed;
    
    this.setVelocity(velocityX, velocityY);
  }

  /**
   * Get the ball's damage value
   */
  getDamage(): Decimal {
    return this.ballDamage;
  }

  /**
   * Update the ball's damage value (for upgrades)
   */
  setDamage(damage: Decimal): void {
    this.ballDamage = damage;
  }

  /**
   * Get the ball's speed
   */
  getSpeed(): number {
    return this.ballSpeed;
  }

  /**
   * Update the ball's speed (for upgrades)
   */
  setSpeed(speed: number): void {
    this.ballSpeed = speed;
    
    // Adjust current velocity to match new speed
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      const currentVelocity = body.velocity;
      const currentSpeed = currentVelocity.length();
      
      if (currentSpeed > 0) {
        const scale = speed / currentSpeed;
        body.setVelocity(currentVelocity.x * scale, currentVelocity.y * scale);
      }
      
      body.setMaxVelocity(speed * 1.5, speed * 1.5);
    }
  }

  /**
   * Handle collision with a brick
   * Adds slight velocity variance to prevent stuck patterns
   */
  onBrickCollision(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    
    // Add tiny random variance to prevent repeating patterns
    const variance = 0.02;
    const randomX = 1 + Phaser.Math.FloatBetween(-variance, variance);
    const randomY = 1 + Phaser.Math.FloatBetween(-variance, variance);
    
    body.setVelocity(
      body.velocity.x * randomX,
      body.velocity.y * randomY
    );
    
    // Ensure speed is maintained
    this.normalizeVelocity();
  }

  /**
   * Normalize velocity to maintain consistent speed
   */
  private normalizeVelocity(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    
    const currentSpeed = body.velocity.length();
    
    // If speed has drifted, correct it
    if (Math.abs(currentSpeed - this.ballSpeed) > 10) {
      const scale = this.ballSpeed / currentSpeed;
      body.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
    }
  }

  /**
   * Enable visual trail effect
   */
  enableTrail(): void {
    if (!this.trail) {
      this.trail = this.scene.add.graphics();
      this.trail.setDepth(this.depth - 1);
    }
  }

  /**
   * Disable trail effect
   */
  disableTrail(): void {
    if (this.trail) {
      this.trail.destroy();
      this.trail = null;
      this.trailPoints = [];
    }
  }

  /**
   * Update trail visual
   */
  private updateTrail(): void {
    if (!this.trail) return;
    
    // Add current position to trail
    this.trailPoints.push({
      x: this.x,
      y: this.y,
      alpha: 1,
    });
    
    // Limit trail length
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.shift();
    }
    
    // Update alpha and draw
    this.trail.clear();
    
    for (let i = 0; i < this.trailPoints.length; i++) {
      const point = this.trailPoints[i];
      point.alpha -= 0.1;
      
      if (point.alpha > 0) {
        this.trail.fillStyle(0xffffff, point.alpha * 0.3);
        this.trail.fillCircle(point.x, point.y, this.radius * (0.5 + point.alpha * 0.5));
      }
    }
    
    // Remove faded points
    this.trailPoints = this.trailPoints.filter((p) => p.alpha > 0);
  }

  /**
   * Phaser update loop
   */
  preUpdate(_time: number, _delta: number): void {
    // Ensure ball doesn't get stuck on edges
    this.handleEdgeStuck();
    
    // Update trail if enabled
    if (this.trail) {
      this.updateTrail();
    }
    
    // Normalize velocity periodically
    this.normalizeVelocity();
  }

  /**
   * Handle ball getting stuck on world edges
   */
  private handleEdgeStuck(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    
    const worldBounds = this.scene.physics.world.bounds;
    
    // Check if ball is stuck at edges
    if (Math.abs(body.velocity.x) < 10) {
      body.setVelocityX(body.velocity.x < 0 ? -this.ballSpeed * 0.3 : this.ballSpeed * 0.3);
    }
    
    if (Math.abs(body.velocity.y) < 10) {
      body.setVelocityY(body.velocity.y < 0 ? -this.ballSpeed * 0.3 : this.ballSpeed * 0.3);
    }
    
    // If stuck at edge, nudge away
    if (this.x <= worldBounds.x + this.radius + 5) {
      body.setVelocityX(Math.abs(body.velocity.x));
    }
    if (this.x >= worldBounds.right - this.radius - 5) {
      body.setVelocityX(-Math.abs(body.velocity.x));
    }
    if (this.y <= worldBounds.y + this.radius + 5) {
      body.setVelocityY(Math.abs(body.velocity.y));
    }
    if (this.y >= worldBounds.bottom - this.radius - 5) {
      body.setVelocityY(-Math.abs(body.velocity.y));
    }
  }

  /**
   * Clean up on destroy
   */
  destroy(fromScene?: boolean): void {
    this.disableTrail();
    super.destroy(fromScene);
  }
}
