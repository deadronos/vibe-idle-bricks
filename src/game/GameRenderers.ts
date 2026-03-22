import Phaser from 'phaser';
import { BALL_TYPES } from '../types';
import type { BallData, BallType, BrickData } from '../types';
import { adjustBrightness, getTierColor } from '../utils';

const TRAIL_BALL_TYPES: ReadonlySet<BallType> = new Set(['sniper', 'plasma']);

/**
 * Renders active balls using persistent Phaser Graphics instances.
 */
export class BallRenderer {
  private readonly graphicsById = new Map<string, Phaser.GameObjects.Graphics>();
  private readonly seenAtFrame = new Map<string, number>();
  private readonly colorCache = new Map<BallType, number>();
  private frame = 0;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Renders all active balls for the current frame.
   */
  render(balls: BallData[]) {
    this.frame++;

    for (const ball of balls) {
      this.seenAtFrame.set(ball.id, this.frame);
      const graphics = this.getGraphics(ball.id);
      graphics.clear();

      const config = BALL_TYPES[ball.type];
      const color = this.getBallColor(ball.type);

      if (config.speed > 5 || TRAIL_BALL_TYPES.has(ball.type)) {
        graphics.lineStyle(4, color, 0.3);
        graphics.beginPath();
        graphics.moveTo(ball.x, ball.y);
        graphics.lineTo(ball.x - ball.dx * 0.15, ball.y - ball.dy * 0.15);
        graphics.strokePath();
      }

      graphics.fillStyle(color, 0.3);
      graphics.fillCircle(ball.x, ball.y, 16);

      graphics.fillStyle(color, 1);
      graphics.fillCircle(ball.x, ball.y, 8);

      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillCircle(ball.x - 2, ball.y - 2, 3);
    }

    this.pruneUnusedGraphics();
  }

  /**
   * Destroys all allocated graphics.
   */
  destroy() {
    for (const graphics of this.graphicsById.values()) {
      graphics.destroy();
    }

    this.graphicsById.clear();
    this.seenAtFrame.clear();
  }

  private getGraphics(id: string) {
    let graphics = this.graphicsById.get(id);
    if (!graphics) {
      graphics = this.scene.add.graphics();
      this.graphicsById.set(id, graphics);
    }
    return graphics;
  }

  private getBallColor(ballType: BallType) {
    const cached = this.colorCache.get(ballType);
    if (typeof cached === 'number') {
      return cached;
    }

    const color = Phaser.Display.Color.HexStringToColor(BALL_TYPES[ballType].color).color;
    this.colorCache.set(ballType, color);
    return color;
  }

  private pruneUnusedGraphics() {
    for (const [id, graphics] of this.graphicsById) {
      if (this.seenAtFrame.get(id) !== this.frame) {
        graphics.destroy();
        this.graphicsById.delete(id);
        this.seenAtFrame.delete(id);
      }
    }
  }
}

/**
 * Renders bricks and redraws only when a brick instance changes.
 */
export class BrickRenderer {
  private readonly graphicsById = new Map<string, Phaser.GameObjects.Graphics>();
  private readonly textById = new Map<string, Phaser.GameObjects.Text>();
  private readonly seenAtFrame = new Map<string, number>();
  private readonly renderedBrickRefs = new Map<string, BrickData>();
  private readonly tierFillCache = new Map<number, number>();
  private readonly tierBorderCache = new Map<number, number>();
  private frame = 0;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Renders all active bricks.
   */
  render(bricks: BrickData[]) {
    this.frame++;

    for (const brick of bricks) {
      this.seenAtFrame.set(brick.id, this.frame);

      const previousBrick = this.renderedBrickRefs.get(brick.id);
      const isHitFlash = Date.now() - (brick.lastHitTime || 0) < 50;

      if (previousBrick !== brick || isHitFlash) {
        this.drawBrick(brick, isHitFlash);
        this.renderedBrickRefs.set(brick.id, brick);
      }

      this.syncBrickText(brick);
    }

    this.pruneUnusedGraphics();
  }

  /**
   * Destroys all allocated graphics and texts.
   */
  destroy() {
    for (const graphics of this.graphicsById.values()) {
      graphics.destroy();
    }
    for (const text of this.textById.values()) {
      text.destroy();
    }

    this.graphicsById.clear();
    this.textById.clear();
    this.seenAtFrame.clear();
    this.renderedBrickRefs.clear();
  }

  private drawBrick(brick: BrickData, isHitFlash: boolean) {
    const graphics = this.getGraphics(brick.id);
    graphics.clear();

    const fillColor = isHitFlash ? 0xffffff : this.getFillColor(brick.tier);
    const borderColor = this.getBorderColor(brick.tier);
    const healthPercent = brick.health.div(brick.maxHealth).toNumber();

    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRect(brick.x + 2, brick.y + 2, brick.width, brick.height);

    graphics.fillStyle(fillColor, isHitFlash ? 1 : 1);
    graphics.fillRect(brick.x, brick.y, brick.width, brick.height);

    graphics.lineStyle(2, borderColor, 1);
    graphics.strokeRect(brick.x, brick.y, brick.width, brick.height);

    if (healthPercent < 1 && !isHitFlash) {
      graphics.fillStyle(0x000000, 0.5 * (1 - healthPercent));
      graphics.fillRect(brick.x, brick.y, brick.width, brick.height);
    }
  }

  private syncBrickText(brick: BrickData) {
    if (brick.tier <= 1) {
      const text = this.textById.get(brick.id);
      if (text) {
        text.destroy();
        this.textById.delete(brick.id);
      }
      return;
    }

    let text = this.textById.get(brick.id);
    if (!text) {
      text = this.scene.add.text(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2,
        brick.tier.toString(),
        {
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#ffffff',
        }
      );
      text.setOrigin(0.5);
      this.textById.set(brick.id, text);
      return;
    }

    text.setText(brick.tier.toString());
  }

  private getGraphics(id: string) {
    let graphics = this.graphicsById.get(id);
    if (!graphics) {
      graphics = this.scene.add.graphics();
      this.graphicsById.set(id, graphics);
    }
    return graphics;
  }

  private getFillColor(tier: number) {
    const cached = this.tierFillCache.get(tier);
    if (typeof cached === 'number') {
      return cached;
    }

    const color = Phaser.Display.Color.HexStringToColor(getTierColor(tier)).color;
    this.tierFillCache.set(tier, color);
    return color;
  }

  private getBorderColor(tier: number) {
    const cached = this.tierBorderCache.get(tier);
    if (typeof cached === 'number') {
      return cached;
    }

    const color = Phaser.Display.Color.HexStringToColor(
      adjustBrightness(getTierColor(tier), -30)
    ).color;
    this.tierBorderCache.set(tier, color);
    return color;
  }

  private pruneUnusedGraphics() {
    for (const [id, graphics] of this.graphicsById) {
      if (this.seenAtFrame.get(id) !== this.frame) {
        graphics.destroy();
        this.graphicsById.delete(id);
        this.seenAtFrame.delete(id);
        this.renderedBrickRefs.delete(id);

        const text = this.textById.get(id);
        if (text) {
          text.destroy();
          this.textById.delete(id);
        }
      }
    }
  }
}
