import { PhaserGame, Stats, Shop, Footer } from './components';
import './App.css';

/**
 * Main application component.
 * Layouts the game header, main game area, shop, and footer.
 *
 * @returns {JSX.Element} The root application UI.
 */
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
