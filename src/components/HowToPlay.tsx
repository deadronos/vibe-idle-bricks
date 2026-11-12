import { PRESTIGE_THRESHOLD } from '../types';
import { formatNumber } from '../utils';

/**
 * Collapsible rules panel under the board.
 *
 * The summary is also the canvas `aria-describedby` target, so the click
 * affordance is present for sighted players and assistive tech alike.
 */
export function HowToPlay() {
  return (
    <details className="board-help" id="game-instructions">
      <summary>
        <strong>Click a brick to chip it</strong> · How to play
      </summary>
      <ul>
        <li>Bricks break when their health reaches zero; higher tiers pay more coins.</li>
        <li>Click a brick to deal extra damage to it.</li>
        <li>Buy balls and upgrades in the shop; each ball keeps bouncing on its own.</li>
        <li>Prestige after {formatNumber(PRESTIGE_THRESHOLD)} bricks for a permanent damage and coin multiplier.</li>
        <li>
          <kbd>Space</kbd> or <kbd>P</kbd> pauses; <kbd>Esc</kbd> resumes.
        </li>
      </ul>
    </details>
  );
}
