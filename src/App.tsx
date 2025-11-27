import React, { useEffect } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { MoneyDisplay, UpgradePanel, StatsPanel, GameControls } from './components/HUD';
import { useGameStore } from './store/useGameStore';
import { SAVE_CONFIG } from './config/gameConfig';
import './App.css';

/**
 * Main App Component
 * Combines React HUD with Phaser game canvas
 */
const App: React.FC = () => {
  const loadGame = useGameStore((state) => state.loadGame);
  const saveGame = useGameStore((state) => state.saveGame);

  // Load save on mount
  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame();
    }, SAVE_CONFIG.autoSaveInterval);

    return () => clearInterval(interval);
  }, [saveGame]);

  // Save on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGame();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveGame]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🧱 Idle Breakout</h1>
        <p className="app-subtitle">Destroy 1,000,000 Bricks!</p>
      </header>

      <main className="app-main">
        <aside className="sidebar left-sidebar">
          <MoneyDisplay />
          <UpgradePanel />
        </aside>

        <div className="game-container">
          <PhaserGame className="phaser-game" />
          <div className="game-controls-container">
            <GameControls />
          </div>
          <div className="game-instructions">
            <p>🎮 Use <kbd>WASD</kbd> or <kbd>Arrow Keys</kbd> to pan the camera</p>
            <p>🖱️ <kbd>Right-click + Drag</kbd> to pan • <kbd>Scroll</kbd> to zoom</p>
          </div>
        </div>

        <aside className="sidebar right-sidebar">
          <StatsPanel />
        </aside>
      </main>

      <footer className="app-footer">
        <p>Made with ❤️ using React + Phaser 3 + TypeScript</p>
      </footer>
    </div>
  );
};

export default App;
