import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import gameConfig from './config';

/**
 * React component that wraps the Phaser game instance
 * Handles proper initialization and cleanup within React lifecycle
 */
export function PhaserGame(): React.ReactElement {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only create game if container exists and game doesn't
    if (containerRef.current && !gameRef.current) {
      // Create new Phaser game instance
      const config: Phaser.Types.Core.GameConfig = {
        ...gameConfig,
        parent: containerRef.current,
      };

      gameRef.current = new Phaser.Game(config);
    }

    // Cleanup on unmount
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
      id="phaser-container"
      style={{
        width: '100%',
        maxWidth: '800px',
        aspectRatio: '4/3',
        margin: '0 auto',
      }}
    />
  );
}

export default PhaserGame;
