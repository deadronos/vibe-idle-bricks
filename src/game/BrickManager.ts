import Phaser from 'phaser';
import Decimal from 'break_infinity.js';
import type { BrickData } from '../types';
import { generateId } from '../utils';

/**
 * Manages brick generation and screen-space placement.
 */
export class BrickManager {
  private readonly brickWidth = 60;
  private readonly brickHeight = 25;
  private readonly padding = 5;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private get offsetTop() {
    return Math.max(20, this.scene.cameras.main.height * 0.1);
  }

  private get offsetLeft() {
    return Math.max(
      20,
      (this.scene.cameras.main.width % (this.brickWidth + this.padding)) / 2
    );
  }

  /**
   * Creates a single brick instance.
   */
  private createBrick(x: number, y: number, baseTier: number): BrickData {
    const tierVariation = Math.floor(Math.random() * 3) - 1;
    const tier = Math.max(1, baseTier + tierVariation);
    const maxHealth = new Decimal(tier * 3);
    const brickValue = Math.floor(Math.pow(tier, 1.2));

    return {
      id: generateId(),
      x,
      y,
      width: this.brickWidth,
      height: this.brickHeight,
      tier,
      health: maxHealth,
      maxHealth,
      value: new Decimal(brickValue),
    };
  }

  /**
   * Generates a grid of bricks.
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

        bricks.push(this.createBrick(x, y, baseTier));
        created++;
      }
    }

    return bricks;
  }

  /**
   * Adds new bricks to fill available space on the screen.
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
    if (bricksToAdd <= 0) {
      return [];
    }

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

          newBricks.push(this.createBrick(x, y, baseTier));
        }
      }
    }

    return newBricks;
  }
}
