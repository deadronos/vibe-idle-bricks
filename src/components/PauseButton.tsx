import { useGameStore } from '../store';
import { Pause, Play } from 'lucide-react';

/**
 * Header control that toggles the game's paused state. Uses the existing
 * `isPaused` flag in the game store, which `GameScene.update()` already
 * honors as an early-return.
 *
 * The button text and icon swap based on the current state so the affordance
 * is unambiguous (it always shows the action that *will* happen on click).
 */
export function PauseButton() {
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);

  const label = isPaused ? 'Resume game' : 'Pause game';
  const Icon = isPaused ? Play : Pause;

  return (
    <button
      type="button"
      className={`btn pause-btn ${isPaused ? 'is-paused' : ''}`}
      onClick={() => setPaused(!isPaused)}
      aria-label={label}
      aria-pressed={isPaused}
      title={`${label} (Space or P)`}
    >
      <Icon size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" />
      {isPaused ? 'Resume' : 'Pause'}
    </button>
  );
}
