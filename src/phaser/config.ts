import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { GAME_CONSTANTS } from '../types/game';

/**
 * Phaser game configuration
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONSTANTS.GAME_WIDTH,
  height: GAME_CONSTANTS.GAME_HEIGHT,
  parent: 'phaser-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export default gameConfig;
