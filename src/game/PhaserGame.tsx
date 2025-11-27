import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { GAME_CONFIG } from '../config/gameConfig';

interface PhaserGameProps {
  className?: string;
}

/**
 * PhaserGame - React wrapper component for the Phaser game instance
 * Handles proper initialization and cleanup within React lifecycle
 */
export const PhaserGame: React.FC<PhaserGameProps> = ({ className }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only initialize if we have a container and no game yet
    if (containerRef.current && !gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: GAME_CONFIG.canvasWidth,
        height: GAME_CONFIG.canvasHeight,
        backgroundColor: '#1a1a2e',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false, // Set to true for physics debugging
          },
        },
        scene: [GameScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          pixelArt: false,
          antialias: true,
          antialiasGL: true,
        },
        audio: {
          disableWebAudio: true,
        },
      };

      gameRef.current = new Phaser.Game(config);
    }

    // Cleanup function
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: GAME_CONFIG.canvasWidth,
        height: GAME_CONFIG.canvasHeight,
      }}
    />
  );
};
