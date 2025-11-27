import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../../types/game';

/**
 * Ball class that handles movement and bouncing physics
 * Extends Phaser.Physics.Arcade.Image for physics-based movement
 */
export class Ball extends Phaser.Physics.Arcade.Image {
  private ballSpeed: number;
  private ballId: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speed: number,
    id: number
  ) {
    super(scene, x, y, 'ball');
    
    this.ballSpeed = speed;
    this.ballId = id;
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Configure physics body
    this.setCircle(GAME_CONSTANTS.BALL_RADIUS);
    this.setBounce(1, 1);
    this.setCollideWorldBounds(true);
    
    // Set initial velocity with random angle
    this.launchBall();
  }

  /**
   * Launches the ball with a random downward angle
   */
  public launchBall(): void {
    // Random angle between 30 and 150 degrees (downward)
    const angle = Phaser.Math.Between(30, 150);
    const radians = Phaser.Math.DegToRad(angle);
    
    const vx = Math.cos(radians) * this.ballSpeed;
    const vy = Math.sin(radians) * this.ballSpeed;
    
    this.setVelocity(vx, vy);
  }

  /**
   * Updates the ball's speed while maintaining direction
   */
  public updateSpeed(newSpeed: number): void {
    if (!this.body) return;
    
    const velocity = this.body.velocity;
    const currentSpeed = velocity.length();
    
    if (currentSpeed > 0) {
      const scale = newSpeed / currentSpeed;
      this.setVelocity(velocity.x * scale, velocity.y * scale);
    }
    
    this.ballSpeed = newSpeed;
  }

  /**
   * Ensures the ball maintains minimum velocity
   * Prevents the ball from getting stuck
   */
  public ensureMinimumVelocity(): void {
    if (!this.body) return;
    
    const velocity = this.body.velocity;
    const currentSpeed = velocity.length();
    
    // If speed is too low, boost it
    if (currentSpeed < this.ballSpeed * 0.5) {
      this.launchBall();
    }
  }

  /**
   * Gets the ball's unique identifier
   */
  public getBallId(): number {
    return this.ballId;
  }

  /**
   * Handles collision response to ensure proper bouncing
   */
  public handleCollision(): void {
    // Ensure velocity doesn't decrease after collision
    this.ensureMinimumVelocity();
  }

  /**
   * Update method called each frame
   */
  public update(): void {
    this.ensureMinimumVelocity();
  }
}

export default Ball;
