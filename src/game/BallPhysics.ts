import Decimal from 'break_infinity.js';
import type { BallData, BrickData } from '../types';
import {
  BALL_RADIUS,
  SPEED_STEER_STRENGTH,
} from './constants';

export class BallPhysics {
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  applyBallMovement(
    ball: BallData,
    step: number
  ): { x: number; y: number; dx: number; dy: number } {
    let x = ball.x + ball.dx * (step / 16);
    let y = ball.y + ball.dy * (step / 16);
    let dx = ball.dx;
    let dy = ball.dy;

    if (x - BALL_RADIUS < 0) {
      x = BALL_RADIUS;
      dx = Math.abs(dx);
    }
    if (x + BALL_RADIUS > this.width) {
      x = this.width - BALL_RADIUS;
      dx = -Math.abs(dx);
    }
    if (y - BALL_RADIUS < 0) {
      y = BALL_RADIUS;
      dy = Math.abs(dy);
    }
    if (y + BALL_RADIUS > this.height) {
      y = this.height - BALL_RADIUS;
      dy = -Math.abs(dy);
    }

    return { x, y, dx, dy };
  }

  normalizeVelocity(dx: number, dy: number, speed: number): { dx: number; dy: number } {
    const speedSq = dx * dx + dy * dy;
    if (speedSq === 0) {
      return { dx, dy };
    }
    const currentSpeed = Math.sqrt(speedSq);
    return {
      dx: (dx / currentSpeed) * speed,
      dy: (dy / currentSpeed) * speed,
    };
  }

  seekTarget(
    ball: BallData,
    dx: number,
    dy: number,
    target: BrickData | null
  ): [number, number] {
    if (!target) {
      return [dx, dy];
    }

    const targetX = target.x + target.width / 2;
    const targetY = target.y + target.height / 2;
    const deltaX = targetX - ball.x;
    const deltaY = targetY - ball.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (dist > 0) {
      return [
        dx + (deltaX / dist) * SPEED_STEER_STRENGTH,
        dy + (deltaY / dist) * SPEED_STEER_STRENGTH,
      ];
    }

    return [dx, dy];
  }

  findWeakestBrick(bricks: BrickData[]): BrickData | null {
    let weakest: BrickData | null = null;
    let minHealth = new Decimal(Infinity);

    for (const brick of bricks) {
      if (brick.health.lt(minHealth)) {
        minHealth = brick.health;
        weakest = brick;
      }
    }

    return weakest;
  }

  calculateBounce(ball: BallData, brick: BrickData): { dx: number; dy: number } {
    const brickCenterX = brick.x + brick.width / 2;
    const brickCenterY = brick.y + brick.height / 2;
    const deltaX = ball.x - brickCenterX;
    const deltaY = ball.y - brickCenterY;

    const normalizedX = deltaX / (brick.width / 2);
    const normalizedY = deltaY / (brick.height / 2);

    if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
      const bounceDirection = Math.sign(deltaX) || Math.sign(ball.dx) || 1;
      return { dx: Math.abs(ball.dx) * bounceDirection, dy: ball.dy };
    }

    const bounceDirection = Math.sign(deltaY) || Math.sign(ball.dy) || 1;
    return { dx: ball.dx, dy: Math.abs(ball.dy) * bounceDirection };
  }

  ballCollidesWithBrick(ball: BallData, brick: BrickData): boolean {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    return distX * distX + distY * distY < BALL_RADIUS * BALL_RADIUS;
  }

  isBrickWithinRadius(x: number, y: number, radius: number, brick: BrickData): boolean {
    const brickCenterX = brick.x + brick.width / 2;
    const brickCenterY = brick.y + brick.height / 2;
    const deltaX = x - brickCenterX;
    const deltaY = y - brickCenterY;
    return deltaX * deltaX + deltaY * deltaY < radius * radius;
  }

}
