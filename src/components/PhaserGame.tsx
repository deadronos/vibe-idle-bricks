import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
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
      const game = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current,
      });
      // The board is visual; the wrapper and the hint under it carry the
      // accessible name and instructions.
      game.canvas.setAttribute('role', 'img');
      game.canvas.setAttribute('aria-label', 'Brick game board');
      game.canvas.setAttribute('aria-describedby', 'game-instructions');
      gameRef.current = game;
    }

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
      className="game-canvas"
      role="group"
      aria-label="Brick game board"
      aria-describedby="game-instructions"
    />
  );
}
