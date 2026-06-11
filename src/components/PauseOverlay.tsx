import { useGameStore } from '../store';
import { Play } from 'lucide-react';

/**
 * On-canvas overlay shown while the game is paused. Replaces the gameplay
 * viewport with a calm "Paused" message and a quick resume button so the
 * player can return to the action from any focus position.
 */
export function PauseOverlay() {
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);

  if (!isPaused) return null;

  return (
    <div
      className="pause-overlay"
      role="dialog"
      aria-modal="false"
      aria-label="Game paused"
    >
      <div className="pause-overlay-card">
        <p className="pause-overlay-eyebrow">Paused</p>
        <h2 className="pause-overlay-title">Take a breather</h2>
        <p className="pause-overlay-copy">
          The simulation is frozen. Press <kbd>Esc</kbd>, click below, or use the
          header button to resume.
        </p>
        <button
          type="button"
          className="buy-btn"
          onClick={() => setPaused(false)}
        >
          <Play size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" />
          Resume
        </button>
      </div>
    </div>
  );
}
