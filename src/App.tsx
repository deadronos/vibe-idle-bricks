import { lazy, Suspense, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Component } from 'react';
import { Footer } from './components/Footer';
import { PauseButton } from './components/PauseButton';
import { PauseIndicator } from './components/PauseIndicator';
import { PauseOverlay } from './components/PauseOverlay';
import { Shop } from './components/Shop';
import { Stats } from './components/Stats';
import { ToastProvider, useToast } from './components/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useGameStore } from './store';
import './App.css';

const LazyPhaserGame = lazy(async () => {
  const module = await import('./components/PhaserGame');

  return {
    default: module.PhaserGame,
  };
});

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PhaserErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="game-canvas game-canvas-error"
          role="alert"
          aria-live="assertive"
        >
          <div className="game-loading-card">
            <h2 className="game-loading-title">Game Failed to Load</h2>
            <p className="game-loading-copy">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              className="buy-btn"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function GameLoadingFallback() {
  return (
    <div
      className="game-canvas game-canvas-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="game-loading-card">
        <div className="game-loading-spinner" aria-hidden="true" />
        <p className="game-loading-eyebrow">Optimizing startup…</p>
        <h2 className="game-loading-title">Preparing the arena</h2>
        <p className="game-loading-copy">
          The game engine is loading in the background so the shop and stats can
          appear immediately.
        </p>
      </div>
    </div>
  );
}

/**
 * Inner app wrapper that runs the load-on-mount effect and shows an offline
 * earnings toast, now that it has access to the ToastProvider context.
 */
function GameApp() {
  const load = useGameStore((state) => state.load);
  const pendingOfflineMessage = useGameStore((state) => state.pendingOfflineMessage);
  const clearOfflineMessage = useGameStore((state) => state.clearOfflineMessage);
  const setPaused = useGameStore((state) => state.setPaused);
  const { showToast } = useToast();

  const handlePauseToggle = useCallback(() => {
    setPaused(!useGameStore.getState().isPaused);
  }, [setPaused]);

  const handleResume = useCallback(() => {
    if (useGameStore.getState().isPaused) {
      setPaused(false);
    }
  }, [setPaused]);

  useKeyboardShortcuts({
    onPauseToggle: handlePauseToggle,
    onResume: handleResume,
  });

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
        <div className="header-actions">
          <PauseButton />
        </div>
        <Stats />
      </header>

      <main>
        <div className="game-area">
          <PhaserErrorBoundary>
            <Suspense fallback={<GameLoadingFallback />}>
              <LazyPhaserGame />
            </Suspense>
          </PhaserErrorBoundary>
          <PauseOverlay />
        </div>
        <Shop />
      </main>

      <Footer />
      <PauseIndicator />
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
