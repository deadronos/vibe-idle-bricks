import { useGameStore } from '../store';

/**
 * Visually hidden, screen-reader-live region that announces the pause state
 * when it changes. Always present in the DOM (even when not paused) so
 * assistive tech doesn't lose its reference target.
 */
export function PauseIndicator() {
  const isPaused = useGameStore((state) => state.isPaused);

  return (
    <div
      className="visually-hidden"
      role="status"
      aria-live="polite"
      data-testid="pause-indicator"
    >
      {isPaused ? 'Game paused' : 'Game running'}
    </div>
  );
}
