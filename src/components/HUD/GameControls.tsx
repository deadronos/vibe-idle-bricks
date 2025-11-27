import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import './GameControls.css';

/**
 * GameControls - Save, Load, Reset buttons
 */
export const GameControls: React.FC = () => {
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const resetGame = useGameStore((state) => state.resetGame);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset? All progress will be lost!')) {
      resetGame();
      window.location.reload();
    }
  };

  const handleLoad = () => {
    const success = loadGame();
    if (success) {
      window.location.reload();
    } else {
      alert('No save data found!');
    }
  };

  return (
    <div className="game-controls">
      <button className="control-button save" onClick={saveGame}>
        💾 Save
      </button>
      <button className="control-button load" onClick={handleLoad}>
        📂 Load
      </button>
      <button className="control-button reset" onClick={handleReset}>
        🔄 Reset
      </button>
    </div>
  );
};
