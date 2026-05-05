import { vi } from 'vitest';

// Mock Phaser before BrickManager imports it to avoid canvas initialization in jsdom
vi.mock('phaser', () => ({
  default: {},
}));

import { describe, it, expect } from 'vitest';
import { BrickManager } from '../../src/game/BrickManager';
import { BRICK_WIDTH, BRICK_HEIGHT, BRICK_PADDING } from '../../src/game/constants';

function createMockScene(width: number, height: number) {
  return {
    cameras: {
      main: {
        width,
        height,
      },
    },
  } as unknown as import('phaser').Scene;
}

describe('BrickManager', () => {
  describe('generateBricks', () => {
    it('generates the requested number of bricks', () => {
      const manager = new BrickManager(createMockScene(800, 600));
      const bricks = manager.generateBricks(20, 1);
      expect(bricks.length).toBe(20);
    });

    it('lays bricks out in a grid starting from offsetLeft and offsetTop', () => {
      const manager = new BrickManager(createMockScene(800, 600));
      const bricks = manager.generateBricks(2, 1);

      expect(bricks[0].x).toBeLessThan(bricks[1].x);
      expect(bricks[0].y).toBe(bricks[1].y);
    });

    it('assigns bricks the correct dimensions', () => {
      const manager = new BrickManager(createMockScene(400, 300));
      const bricks = manager.generateBricks(1, 1);

      expect(bricks[0].width).toBe(BRICK_WIDTH);
      expect(bricks[0].height).toBe(BRICK_HEIGHT);
    });

    it('varies tier around the base tier', () => {
      const manager = new BrickManager(createMockScene(800, 600));
      const bricks = manager.generateBricks(50, 5);

      const tiers = bricks.map((b) => b.tier);
      const minTier = Math.min(...tiers);
      const maxTier = Math.max(...tiers);

      expect(minTier).toBeGreaterThanOrEqual(4);
      expect(maxTier).toBeLessThanOrEqual(7);
    });

    it('does not drop tier below 1', () => {
      const manager = new BrickManager(createMockScene(800, 600));
      const bricks = manager.generateBricks(100, 1);

      expect(bricks.every((b) => b.tier >= 1)).toBe(true);
    });
  });

  describe('addBricksToFillScreen', () => {
    it('returns empty array when screen is already full', () => {
      const manager = new BrickManager(createMockScene(200, 200));
      const cols = Math.floor((200 - 40) / (BRICK_WIDTH + BRICK_PADDING));
      const maxRows = Math.floor((200 * 0.5 - 20) / (BRICK_HEIGHT + BRICK_PADDING));
      const fullBricks = manager.generateBricks(cols * maxRows, 1);

      const added = manager.addBricksToFillScreen(fullBricks, 1);
      expect(added.length).toBe(0);
    });

    it('fills empty grid slots up to one row worth', () => {
      const manager = new BrickManager(createMockScene(400, 300));
      const existing = manager.generateBricks(5, 1);
      const added = manager.addBricksToFillScreen(existing, 2);

      expect(added.length).toBeGreaterThan(0);
      // Ensure no duplicate positions
      const positions = new Set(existing.concat(added).map((b) => `${b.x},${b.y}`));
      expect(positions.size).toBe(existing.length + added.length);
    });

    it('returns bricks with valid stats', () => {
      const manager = new BrickManager(createMockScene(400, 300));
      const added = manager.addBricksToFillScreen([], 3);

      expect(added.length).toBeGreaterThan(0);
      for (const brick of added) {
        expect(brick.id).toBeTruthy();
        expect(brick.health.gt(0)).toBe(true);
        expect(brick.maxHealth.gt(0)).toBe(true);
        expect(brick.value.gte(0)).toBe(true);
      }
    });
  });
});
