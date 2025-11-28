import { PhaserGame, Stats, Shop, Footer } from './components';
import './App.css';

function App() {
  return (
    <div className="game-container">
      <header>
        <h1>🧱 Idle Bricks</h1>
        <Stats />
      </header>

      <main>
        <div className="game-area">
          <PhaserGame />
        </div>
        <Shop />
      </main>

      <Footer />
    </div>
  );
}

export default App;
