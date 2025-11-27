import './App.css';
import { PhaserGame } from './phaser/PhaserGame';
import { StatsDisplay, UpgradePanel, BallStats } from './components';

/**
 * Main application component
 * Combines Phaser game canvas with React HUD elements
 */
function App() {
  return (
    <div className="app-container">
      <header className="game-header">
        <h1>Idle Breakout</h1>
        <StatsDisplay />
      </header>
      
      <main className="game-main">
        <aside className="sidebar left-sidebar">
          <UpgradePanel />
        </aside>
        
        <div className="game-canvas">
          <PhaserGame />
        </div>
        
        <aside className="sidebar right-sidebar">
          <BallStats />
        </aside>
      </main>
    </div>
  );
}

export default App;
