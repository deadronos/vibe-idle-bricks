import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game';

/**
 * React component that initializes and contains the Phaser game instance.
 * It handles the mounting and cleanup of the game engine.
 *
 * @returns {JSX.Element} The container div for the Phaser game.
 */
export function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current,
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="game-canvas" />;
}
