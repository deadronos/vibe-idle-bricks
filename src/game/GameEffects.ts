import * as Phaser from 'phaser';
import type { BrickData, Explosion } from '../types';
import { getAccessibleTierColor, type ColorblindMode } from '../utils';
import { getParsedColor } from './color';
import { useSettingsStore } from '../store/settingsStore';

interface FloatingTextEntry {
  life: number;
  text: Phaser.GameObjects.Text;
}

/**
 * Manages transient visual effects used by the gameplay loop.
 */
export class GameEffects {
  private particleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private explosionGraphics!: Phaser.GameObjects.Graphics;
  private readonly activeFloatingTexts: FloatingTextEntry[] = [];
  private readonly floatingTextPool: Phaser.GameObjects.Text[] = [];
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Initializes graphics-backed effect objects.
   */
  initialize() {
    if (!this.scene.textures.exists('particle')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff);
      graphics.fillRect(0, 0, 4, 4);
      graphics.generateTexture('particle', 4, 4);
      graphics.destroy();
    }

    this.particleEmitter = this.scene.add.particles(0, 0, 'particle', {
      lifespan: 600,
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.explosionGraphics = this.scene.add.graphics();
  }

  /**
   * Displays a floating text indicator.
   */
  showFloatingText(x: number, y: number, text: string, color: string = '#ffffff') {
    const floatingText = this.getFloatingText();
    floatingText
      .setPosition(x, y)
      .setText(text)
      .setColor(color)
      .setAlpha(1)
      .setVisible(true);

    this.activeFloatingTexts.push({ life: 1000, text: floatingText });
  }

  /**
   * Updates active floating text objects and returns expired ones to the pool.
   */
  updateFloatingTexts(delta: number) {
    for (let index = this.activeFloatingTexts.length - 1; index >= 0; index--) {
      const entry = this.activeFloatingTexts[index];
      entry.life -= delta;

      if (entry.life <= 0) {
        entry.text.setVisible(false);
        this.floatingTextPool.push(entry.text);
        this.activeFloatingTexts.splice(index, 1);
        continue;
      }

      entry.text.y -= 0.05 * delta;
      entry.text.setAlpha(entry.life / 1000);
    }
  }

  /**
   * Emits particles for a destroyed brick.
   *
   * When the user has reduced-motion enabled the particle burst is suppressed
   * entirely so the playfield stays visually calm.
   */
  emitBrickBreakParticles(brick: BrickData, count: number) {
    if (useSettingsStore.getState().reducedMotion) return;
    const color = this.getTierColorNumber(brick.tier);
    this.particleEmitter.setPosition(brick.x + brick.width / 2, brick.y + brick.height / 2);
    this.particleEmitter.setParticleTint(color);
    this.particleEmitter.explode(count);
  }

  /**
   * Draws all active explosion overlays using a shared graphics object.
   */
  renderExplosions(explosions: Explosion[]) {
    this.explosionGraphics.clear();

    for (const explosion of explosions) {
      const progress = 1 - explosion.life / explosion.maxLife;
      const radius = explosion.radius * (0.5 + progress * 0.5);
      const alpha = 1 - progress;

      this.explosionGraphics.fillStyle(0xffc832, alpha);
      this.explosionGraphics.fillCircle(explosion.x, explosion.y, radius * 0.5);
      this.explosionGraphics.fillStyle(0xff6432, alpha * 0.5);
      this.explosionGraphics.fillCircle(explosion.x, explosion.y, radius);
    }
  }

  /**
   * Applies the configured explosion screen shake.
   *
   * No-op when reduced-motion is enabled so the game remains calm.
   */
  shakeExplosion() {
    if (useSettingsStore.getState().reducedMotion) return;
    this.scene.cameras.main.shake(100, 0.005);
  }

  /**
   * Cleans up effect objects.
   */
  destroy() {
    this.particleEmitter?.destroy();
    this.explosionGraphics?.destroy();

    for (const entry of this.activeFloatingTexts) {
      entry.text.destroy();
    }
    for (const text of this.floatingTextPool) {
      text.destroy();
    }

    this.activeFloatingTexts.length = 0;
    this.floatingTextPool.length = 0;
  }

  private getFloatingText() {
    const pooledText = this.floatingTextPool.pop();
    if (pooledText) {
      return pooledText;
    }

    const text = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setVisible(false);
    return text;
  }

  private getTierColorNumber(tier: number) {
    const mode: ColorblindMode = useSettingsStore.getState().colorblindMode;
    return getParsedColor(getAccessibleTierColor(tier, mode));
  }
}
