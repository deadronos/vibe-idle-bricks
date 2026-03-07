import { useEffect } from 'react';
import { PhaserGame, Stats, Shop, Footer, ToastProvider, useToast } from './components';
import { useGameStore } from './store';
import './App.css';

/**
 * Inner app wrapper that runs the load-on-mount effect and shows an offline
 * earnings toast, now that it has access to the ToastProvider context.
 */
function GameApp() {
  const load = useGameStore((state) => state.load);
  const pendingOfflineMessage = useGameStore((state) => state.pendingOfflineMessage);
  const clearOfflineMessage = useGameStore((state) => state.clearOfflineMessage);
  const { showToast } = useToast();

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Surface the offline-earnings message as a toast once it is set by load().
  useEffect(() => {
    if (pendingOfflineMessage) {
      showToast(pendingOfflineMessage, 'info');
      clearOfflineMessage();
    }
  }, [pendingOfflineMessage, showToast, clearOfflineMessage]);

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

/**
 * Main application component.
 * Wraps the game in the ToastProvider so all children can show notifications.
 *
 * @returns {JSX.Element} The root application UI.
 */
function App() {
  return (
    <ToastProvider>
      <GameApp />
    </ToastProvider>
  );
}

export default App;
