import * as Phaser from 'phaser';
import type { BrickData } from '../types';
import { calculateBrickStats } from '../types';
import { generateId } from '../utils';
import {
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_PADDING,
  MAX_ROWS_FILL_FACTOR,
} from './constants';

/**
 * Manages brick generation and screen-space placement.
 */
export class BrickManager {
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
      (this.scene.cameras.main.width % (BRICK_WIDTH + BRICK_PADDING)) / 2
    );
  }

  /**
   * Creates a single brick instance.
   */
  private createBrick(x: number, y: number, baseTier: number): BrickData {
    const tierVariation = Math.floor(Math.random() * 3) - 1;
    const tier = Math.max(1, baseTier + tierVariation);
    const { maxHealth, value } = calculateBrickStats(tier);

    return {
      id: generateId(),
      x,
      y,
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT,
      tier,
      health: maxHealth,
      maxHealth,
      value,
    };
  }

  /**
   * Generates a grid of bricks.
   */
  generateBricks(count: number, baseTier: number): BrickData[] {
    const { width } = this.scene.cameras.main;
    const bricks: BrickData[] = [];
    const cols = Math.floor(
      (width - this.offsetLeft * 2) / (BRICK_WIDTH + BRICK_PADDING)
    );
    const rows = Math.ceil(count / cols);

    let created = 0;

    for (let row = 0; row < rows && created < count; row++) {
      for (let col = 0; col < cols && created < count; col++) {
        const x = this.offsetLeft + col * (BRICK_WIDTH + BRICK_PADDING);
        const y = this.offsetTop + row * (BRICK_HEIGHT + BRICK_PADDING);

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
      (width - this.offsetLeft * 2) / (BRICK_WIDTH + BRICK_PADDING)
    );
    const maxRows = Math.floor(
      (height * MAX_ROWS_FILL_FACTOR - this.offsetTop) / (BRICK_HEIGHT + BRICK_PADDING)
    );
    const maxBricks = cols * maxRows;

    const bricksToAdd = Math.min(maxBricks - currentBricks.length, cols);
    if (bricksToAdd <= 0) {
      return [];
    }

    const occupied = new Set<string>();
    for (const brick of currentBricks) {
      const col = Math.round(
        (brick.x - this.offsetLeft) / (BRICK_WIDTH + BRICK_PADDING)
      );
      const row = Math.round(
        (brick.y - this.offsetTop) / (BRICK_HEIGHT + BRICK_PADDING)
      );
      occupied.add(`${row},${col}`);
    }

    const newBricks: BrickData[] = [];

    for (let row = 0; row < maxRows && newBricks.length < bricksToAdd; row++) {
      for (let col = 0; col < cols && newBricks.length < bricksToAdd; col++) {
        if (!occupied.has(`${row},${col}`)) {
          const x = this.offsetLeft + col * (BRICK_WIDTH + BRICK_PADDING);
          const y = this.offsetTop + row * (BRICK_HEIGHT + BRICK_PADDING);

          newBricks.push(this.createBrick(x, y, baseTier));
        }
      }
    }

    return newBricks;
  }
}
