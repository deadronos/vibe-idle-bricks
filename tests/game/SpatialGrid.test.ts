import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialGrid } from '../../src/game/SpatialGrid';
import type { BrickData, BallData } from '../../src/types';
import Decimal from 'break_infinity.js';

describe('SpatialGrid', () => {
  let grid: SpatialGrid;

  beforeEach(() => {
    grid = new SpatialGrid(100);
  });

  const createBrick = (id: string, x: number, y: number, width: number, height: number): BrickData => ({
    id,
    x,
    y,
    width,
    height,
    tier: 1,
    health: new Decimal(10),
    maxHealth: new Decimal(10),
    value: new Decimal(10),
  });

  const createBall = (x: number, y: number): BallData => ({
    id: 'ball1',
    type: 'basic',
    x,
    y,
    dx: 0,
    dy: 0,
  });

  it('should add bricks and query them correctly', () => {
    const brick1 = createBrick('1', 50, 50, 60, 25);
    const brick2 = createBrick('2', 200, 200, 60, 25);

    grid.add(brick1);
    grid.add(brick2);

    // Ball near brick1
    const ball1 = createBall(60, 60);
    const result1 = grid.query(ball1);
    expect(result1).toContain(brick1);
    expect(result1).not.toContain(brick2);

    // Ball near brick2
    const ball2 = createBall(210, 210);
    const result2 = grid.query(ball2);
    expect(result2).toContain(brick2);
    expect(result2).not.toContain(brick1);
  });

  it('should handle bricks spanning multiple cells', () => {
    // Cell size is 100. Brick at 90, 90 with width 60 height 25.
    // X range: 90 to 150 (cols 0 and 1)
    // Y range: 90 to 115 (rows 0 and 1)
    const brick = createBrick('1', 90, 90, 60, 25);
    grid.add(brick);

    // Check corners
    expect(grid.query(createBall(95, 95))).toContain(brick); // Col 0, Row 0
    expect(grid.query(createBall(145, 110))).toContain(brick); // Col 1, Row 1
  });

  it('should rebuild correctly', () => {
    const brick1 = createBrick('1', 50, 50, 60, 25);
    grid.add(brick1);

    const brick2 = createBrick('2', 200, 200, 60, 25);
    grid.rebuild([brick2]);

    expect(grid.query(createBall(60, 60))).not.toContain(brick1);
    expect(grid.query(createBall(210, 210))).toContain(brick2);
  });

  it('should return empty array when no bricks in range', () => {
    const brick = createBrick('1', 50, 50, 60, 25);
    grid.add(brick);

    const ball = createBall(500, 500);
    expect(grid.query(ball)).toEqual([]);
  });
});
