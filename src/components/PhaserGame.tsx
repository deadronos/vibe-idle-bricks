import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { createGameConfig } from '../game';

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
      const container = containerRef.current;
      const cssWidth = container.clientWidth || 800;
      const cssHeight = container.clientHeight || 500;
      const displayWidth = Math.max(1, Math.min(cssWidth, cssHeight * (800 / 500)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Backing store = displayed CSS size x DPR; the scene camera uses the
      // same ratio so all gameplay coordinates remain on the 800x500 board.
      const pixelRatio = (displayWidth * dpr) / 800;
      const game = new Phaser.Game({
        ...createGameConfig(pixelRatio),
        parent: container,
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
