import * as Phaser from 'phaser';
import { BALL_TYPES } from '../types';
import { HIT_FLASH_DURATION_MS } from './constants';
import type { BallData, BallType, BrickData } from '../types';
import {
  adjustBrightness,
  getAccessibleTierColor,
  getContrastTextColor,
  type ColorblindMode,
} from '../utils';
import { getParsedColor } from './color';
import { useSettingsStore } from '../store/settingsStore';

const TRAIL_BALL_TYPES: ReadonlySet<BallType> = new Set(['sniper', 'plasma']);

/**
 * Base renderer class that manages common logic for allocating and pruning Phaser Graphics objects.
 */
abstract class BaseRenderer<T> {
  protected readonly graphicsById = new Map<string, Phaser.GameObjects.Graphics>();
  protected readonly seenAtFrame = new Map<string, number>();
  protected frame = 0;
  protected readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  abstract render(items: T[]): void;

  destroy() {
    for (const graphics of this.graphicsById.values()) {
      graphics.destroy();
    }
    this.graphicsById.clear();
    this.seenAtFrame.clear();
  }

  protected getGraphics(id: string) {
    let graphics = this.graphicsById.get(id);
    if (!graphics) {
      graphics = this.scene.add.graphics();
      this.graphicsById.set(id, graphics);
    }
    return graphics;
  }

  protected pruneUnusedGraphics() {
    for (const [id, graphics] of this.graphicsById) {
      if (this.seenAtFrame.get(id) !== this.frame) {
        graphics.destroy();
        this.graphicsById.delete(id);
        this.seenAtFrame.delete(id);
        this.onPruned(id);
      }
    }
  }

  protected onPruned(id: string) {
    void id;
  }
}

/**
 * Renders active balls using persistent Phaser Graphics instances.
 */
export class BallRenderer extends BaseRenderer<BallData> {
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

  private getBallColor(ballType: BallType) {
    return getParsedColor(BALL_TYPES[ballType].color);
  }
}

/**
 * Renders bricks and redraws only when a brick instance changes.
 */
export class BrickRenderer extends BaseRenderer<BrickData> {
  private readonly textById = new Map<string, Phaser.GameObjects.Text>();
  private readonly renderedBrickRefs = new Map<string, BrickData>();
  private readonly flashingBrickIds = new Set<string>();

  constructor(scene: Phaser.Scene) {
    super(scene);
  }

  render(bricks: BrickData[]) {
    this.frame++;
    const now = performance.now();

    for (const brick of bricks) {
      this.seenAtFrame.set(brick.id, this.frame);

      const previousBrick = this.renderedBrickRefs.get(brick.id);
      const hitAge = now - (brick.lastHitTime ?? 0);
      // A negative age means the timestamp came from another clock (e.g. Date.now);
      // treating it as a hit would keep the brick white forever.
      const isHitFlash =
        brick.lastHitTime !== undefined &&
        hitAge >= 0 &&
        hitAge < HIT_FLASH_DURATION_MS;
      const wasHitFlash = this.flashingBrickIds.has(brick.id);

      // Redraw while flashing and once more when the flash expires, otherwise
      // the white flash frame would stay on screen until the next hit.
      if (previousBrick !== brick || isHitFlash || wasHitFlash) {
        this.drawBrick(brick, isHitFlash);
        this.renderedBrickRefs.set(brick.id, brick);
      }

      if (isHitFlash) {
        this.flashingBrickIds.add(brick.id);
      } else {
        this.flashingBrickIds.delete(brick.id);
      }

      this.syncBrickText(brick, isHitFlash);
    }

    this.pruneUnusedGraphics();
  }

  /**
   * Destroys all allocated graphics and texts.
   */
  destroy() {
    super.destroy();
    for (const text of this.textById.values()) {
      text.destroy();
    }
    this.textById.clear();
    this.renderedBrickRefs.clear();
    this.flashingBrickIds.clear();
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
      graphics.fillStyle(0x000000, 0.4 * (1 - healthPercent));
      graphics.fillRect(brick.x, brick.y, brick.width, brick.height);

      // A thin bar reads better than dimming alone when a brick has many hits.
      const barX = brick.x + 3;
      const barY = brick.y + brick.height - 5;
      const barWidth = brick.width - 6;
      const barColor = healthPercent > 0.5 ? 0x4ade80 : healthPercent > 0.25 ? 0xfacc15 : 0xef4444;
      graphics.fillStyle(0x000000, 0.55);
      graphics.fillRect(barX, barY, barWidth, 3);
      graphics.fillStyle(barColor, 1);
      graphics.fillRect(barX, barY, Math.max(1, barWidth * healthPercent), 3);
    }
  }

  private syncBrickText(brick: BrickData, isHitFlash: boolean) {
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
          color: isHitFlash ? '#0f172a' : this.getTextColor(brick.tier),
        }
      );
      text.setOrigin(0.5);
      this.textById.set(brick.id, text);
      return;
    }

    text.setText(brick.tier.toString());
    text.setColor(isHitFlash ? '#0f172a' : this.getTextColor(brick.tier));
  }

  private getTextColor(tier: number) {
    const mode: ColorblindMode = useSettingsStore.getState().colorblindMode;
    return getContrastTextColor(getAccessibleTierColor(tier, mode));
  }

  private getFillColor(tier: number) {
    const mode: ColorblindMode = useSettingsStore.getState().colorblindMode;
    return getParsedColor(getAccessibleTierColor(tier, mode));
  }

  private getBorderColor(tier: number) {
    const mode: ColorblindMode = useSettingsStore.getState().colorblindMode;
    return getParsedColor(adjustBrightness(getAccessibleTierColor(tier, mode), -30));
  }

  protected onPruned(id: string) {
    this.renderedBrickRefs.delete(id);
    this.flashingBrickIds.delete(id);
    const text = this.textById.get(id);
    if (text) {
      text.destroy();
      this.textById.delete(id);
    }
  }
}
