import * as Phaser from 'phaser';
import { GameScene } from './GameScene';

/**
 * Phaser game configuration object.
 * Defines the renderer, scaling dimensions, and active scenes.
 */
/**
 * Builds the Phaser config with a backing store at `pixelRatio` times the
 * logical 800x500 board. The scene camera zooms by the same ratio so gameplay
 * coordinates and pointer input stay logical.
 */
export const createGameConfig = (
  pixelRatio: number = 1
): Phaser.Types.Core.GameConfig => {
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0f0f1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: Math.round(800 * ratio),
      height: Math.round(500 * ratio),
    },
    scene: [new GameScene({ pixelRatio: ratio, logicalWidth: 800, logicalHeight: 500 })],
  };
};

export const gameConfig: Phaser.Types.Core.GameConfig = createGameConfig(1);

export { GameScene };
