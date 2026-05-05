import { describe, it, expect } from 'vitest';
import { BallPhysics } from '../../src/game/BallPhysics';
import { BALL_RADIUS } from '../../src/game/constants';
import type { BallData, BrickData } from '../../src/types';
import Decimal from 'break_infinity.js';

function makeBall(overrides: Partial<BallData> = {}): BallData {
  return {
    id: 'b1',
    type: 'basic',
    x: 100,
    y: 100,
    dx: 2,
    dy: 3,
    ...overrides,
  };
}

function makeBrick(overrides: Partial<BrickData> = {}): BrickData {
  return {
    id: 'r1',
    x: 90,
    y: 90,
    width: 60,
    height: 25,
    tier: 1,
    health: new Decimal(10),
    maxHealth: new Decimal(10),
    value: new Decimal(5),
    ...overrides,
  };
}

describe('BallPhysics', () => {
  const physics = new BallPhysics(400, 300);

  describe('applyBallMovement', () => {
    it('moves the ball by velocity scaled to the step', () => {
      const ball = makeBall({ x: 50, y: 50, dx: 4, dy: 6 });
      const result = physics.applyBallMovement(ball, 16);
      expect(result.x).toBeCloseTo(54);
      expect(result.y).toBeCloseTo(56);
      expect(result.dx).toBe(4);
      expect(result.dy).toBe(6);
    });

    it('bounces off the left wall', () => {
      const ball = makeBall({ x: BALL_RADIUS - 2, y: 100, dx: -3, dy: 0 });
      const result = physics.applyBallMovement(ball, 16);
      expect(result.x).toBe(BALL_RADIUS);
      expect(result.dx).toBeGreaterThan(0);
    });

    it('bounces off the right wall', () => {
      const ball = makeBall({ x: 400 - BALL_RADIUS + 2, y: 100, dx: 3, dy: 0 });
      const result = physics.applyBallMovement(ball, 16);
      expect(result.x).toBe(400 - BALL_RADIUS);
      expect(result.dx).toBeLessThan(0);
    });

    it('bounces off the top wall', () => {
      const ball = makeBall({ x: 100, y: BALL_RADIUS - 2, dx: 0, dy: -3 });
      const result = physics.applyBallMovement(ball, 16);
      expect(result.y).toBe(BALL_RADIUS);
      expect(result.dy).toBeGreaterThan(0);
    });

    it('bounces off the bottom wall', () => {
      const ball = makeBall({ x: 100, y: 300 - BALL_RADIUS + 2, dx: 0, dy: 3 });
      const result = physics.applyBallMovement(ball, 16);
      expect(result.y).toBe(300 - BALL_RADIUS);
      expect(result.dy).toBeLessThan(0);
    });
  });

  describe('normalizeVelocity', () => {
    it('scales a non-zero vector to the target speed', () => {
      const result = physics.normalizeVelocity(3, 4, 10);
      expect(result.dx).toBeCloseTo(6);
      expect(result.dy).toBeCloseTo(8);
    });

    it('returns a zero vector when input is zero', () => {
      const result = physics.normalizeVelocity(0, 0, 10);
      expect(result.dx).toBe(0);
      expect(result.dy).toBe(0);
    });
  });

  describe('seekTarget', () => {
    it('returns original velocity when target is null', () => {
      const ball = makeBall({ x: 0, y: 0, dx: 1, dy: 1 });
      const result = physics.seekTarget(ball, 1, 1, null);
      expect(result).toEqual([1, 1]);
    });

    it('steers toward the target brick center', () => {
      const ball = makeBall({ x: 0, y: 0, dx: 1, dy: 0 });
      const brick = makeBrick({ x: 100, y: -10, width: 20, height: 20 });
      const [dx, dy] = physics.seekTarget(ball, 1, 0, brick);
      expect(dx).toBeGreaterThan(1);
      expect(dy).toBeCloseTo(0);
    });
  });

  describe('findWeakestBrick', () => {
    it('returns null for an empty array', () => {
      expect(physics.findWeakestBrick([])).toBeNull();
    });

    it('returns the only brick in a single-item array', () => {
      const brick = makeBrick({ health: new Decimal(5) });
      expect(physics.findWeakestBrick([brick])).toBe(brick);
    });

    it('returns the brick with the lowest health', () => {
      const weak = makeBrick({ id: 'weak', health: new Decimal(2) });
      const strong = makeBrick({ id: 'strong', health: new Decimal(20) });
      expect(physics.findWeakestBrick([strong, weak])).toBe(weak);
    });
  });

  describe('calculateBounce', () => {
    it('bounces horizontally when hitting the side of a brick', () => {
      const ball = makeBall({ x: 60, y: 102.5, dx: 2, dy: 1 });
      const brick = makeBrick({ x: 90, y: 90, width: 60, height: 25 });
      const result = physics.calculateBounce(ball, brick);
      expect(result.dx).toBeLessThan(0);
      expect(result.dy).toBe(ball.dy);
    });

    it('bounces vertically when hitting the top/bottom of a brick', () => {
      const ball = makeBall({ x: 120, y: 130, dx: 1, dy: 2 });
      const brick = makeBrick({ x: 90, y: 90, width: 60, height: 25 });
      const result = physics.calculateBounce(ball, brick);
      expect(result.dx).toBe(ball.dx);
      expect(result.dy).toBeGreaterThan(0);
    });
  });

  describe('ballCollidesWithBrick', () => {
    it('returns true when ball overlaps brick', () => {
      const ball = makeBall({ x: 100, y: 100 });
      const brick = makeBrick({ x: 90, y: 90 });
      expect(physics.ballCollidesWithBrick(ball, brick)).toBe(true);
    });

    it('returns false when ball is far from brick', () => {
      const ball = makeBall({ x: 500, y: 500 });
      const brick = makeBrick({ x: 90, y: 90 });
      expect(physics.ballCollidesWithBrick(ball, brick)).toBe(false);
    });
  });

  describe('isBrickWithinRadius', () => {
    it('returns true when brick center is inside radius', () => {
      const brick = makeBrick({ x: 90, y: 90, width: 20, height: 20 });
      expect(physics.isBrickWithinRadius(100, 100, 50, brick)).toBe(true);
    });

    it('returns false when brick center is outside radius', () => {
      const brick = makeBrick({ x: 500, y: 500, width: 20, height: 20 });
      expect(physics.isBrickWithinRadius(0, 0, 50, brick)).toBe(false);
    });
  });
});
