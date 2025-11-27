import Phaser from 'phaser';
import Decimal from 'break_infinity.js';
import type { BrickData } from '../types';
import { BRICK_CONFIG, GAME_CONFIG } from '../config/gameConfig';

/**
 * Brick class - Visual representation of a brick in Phaser
 * Handles rendering, damage display, and destruction effects
 */
export class Brick extends Phaser.GameObjects.Rectangle {
  private brickData: BrickData;
  private healthBar: Phaser.GameObjects.Graphics | null = null;
  private damageText: Phaser.GameObjects.Text | null = null;
  private readonly originalColor: number;

  constructor(scene: Phaser.Scene, brickData: BrickData) {
    const worldX = brickData.x * (GAME_CONFIG.brickWidth + GAME_CONFIG.brickGap);
    const worldY = brickData.y * (GAME_CONFIG.brickHeight + GAME_CONFIG.brickGap);
    
    const color = Brick.getTierColor(brickData.tier);
    
    super(
      scene,
      worldX + GAME_CONFIG.brickWidth / 2,
      worldY + GAME_CONFIG.brickHeight / 2,
      GAME_CONFIG.brickWidth,
      GAME_CONFIG.brickHeight,
      color
    );
    
    this.brickData = brickData;
    this.originalColor = color;
    
    // Add to scene
    scene.add.existing(this);
    
    // Set origin to center
    this.setOrigin(0.5, 0.5);
    
    // Add slight stroke
    this.setStrokeStyle(1, 0x000000, 0.3);
    
    // Enable physics
    scene.physics.add.existing(this, true); // true = static body
    
    // Create health bar for multi-hit bricks
    if (brickData.maxHealth.gt(1)) {
      this.createHealthBar();
    }
  }

  /**
   * Get color based on brick tier
   */
  static getTierColor(tier: number): number {
    const colorIndex = Math.min(tier, BRICK_CONFIG.tierColors.length - 1);
    return BRICK_CONFIG.tierColors[colorIndex];
  }

  /**
   * Create a health bar above the brick
   */
  private createHealthBar(): void {
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  /**
   * Update the health bar display
   */
  private updateHealthBar(): void {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    const healthPercent = this.brickData.health.div(this.brickData.maxHealth).toNumber();
    const barWidth = GAME_CONFIG.brickWidth - 4;
    const barHeight = 3;
    const barX = this.x - GAME_CONFIG.brickWidth / 2 + 2;
    const barY = this.y - GAME_CONFIG.brickHeight / 2 - 5;
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(barX, barY, barWidth, barHeight);
    
    // Health fill
    const healthColor = healthPercent > 0.5 ? 0x4ade80 : healthPercent > 0.25 ? 0xfbbf24 : 0xef4444;
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }

  /**
   * Get the brick's unique ID
   */
  getId(): string {
    return this.brickData.id;
  }

  /**
   * Get grid coordinates
   */
  getGridPosition(): { x: number; y: number } {
    return { x: this.brickData.x, y: this.brickData.y };
  }

  /**
   * Get brick data
   */
  getData(): BrickData {
    return this.brickData;
  }

  /**
   * Update brick data (e.g., after taking damage)
   */
  updateData(newData: BrickData): void {
    this.brickData = newData;
    this.updateHealthBar();
    
    // Flash effect on damage
    this.flashDamage();
  }

  /**
   * Show damage flash effect
   */
  private flashDamage(): void {
    this.setFillStyle(0xffffff);
    
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        this.setFillStyle(this.originalColor);
      }
    });
  }

  /**
   * Show floating damage text
   */
  showDamageNumber(damage: Decimal): void {
    const damageText = this.scene.add.text(
      this.x,
      this.y - 10,
      `-${damage.toFixed(0)}`,
      {
        fontSize: '12px',
        color: '#ff6b6b',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    
    damageText.setOrigin(0.5, 0.5);
    
    // Animate upward and fade
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  /**
   * Play destruction effect
   */
  playDestroyEffect(): void {
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 8,
      tint: this.originalColor,
    });
    
    // Auto-destroy particle emitter
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * Alternative destroy effect without particle texture
   */
  playSimpleDestroyEffect(): void {
    // Create expanding ring effect
    const ring = this.scene.add.circle(this.x, this.y, 5, this.originalColor, 0.8);
    
    this.scene.tweens.add({
      targets: ring,
      radius: GAME_CONFIG.brickWidth,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        ring.destroy();
      },
    });
    
    // Create small debris rectangles
    for (let i = 0; i < 4; i++) {
      const debris = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-10, 10),
        this.y + Phaser.Math.Between(-5, 5),
        Phaser.Math.Between(5, 10),
        Phaser.Math.Between(3, 6),
        this.originalColor
      );
      
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(50, 100);
      
      this.scene.tweens.add({
        targets: debris,
        x: debris.x + Math.cos(angle) * speed,
        y: debris.y + Math.sin(angle) * speed,
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-1, 1),
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          debris.destroy();
        },
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy(fromScene?: boolean): void {
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    
    if (this.damageText) {
      this.damageText.destroy();
      this.damageText = null;
    }
    
    super.destroy(fromScene);
  }
}
