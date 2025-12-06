import { useGameStore } from '../store';
import { formatNumber } from '../utils';
import { getPrestigeThreshold } from '../types';
import { Coins, BrickWall, Layers, Circle, TrendingUp } from 'lucide-react';

/**
 * Stats component displaying current game metrics.
 * Shows coins, bricks broken, ball count, and prestige progress.
 *
 * @returns {JSX.Element} The stats dashboard.
 */
export function Stats() {
  const coins = useGameStore((state) => state.coins);
  const bricksBroken = useGameStore((state) => state.bricksBroken);
  const totalBricksBroken = useGameStore((state) => state.totalBricksBroken);
  const balls = useGameStore((state) => state.balls);
  const prestigeLevel = useGameStore((state) => state.prestigeLevel);
  const prestigeTarget = getPrestigeThreshold(prestigeLevel);

  return (
    <div className="stats">
      <div className="stat">
        <Coins className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(coins)}</span>
        <label>Coins</label>
      </div>
      <div className="stat">
        <BrickWall className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(bricksBroken)}</span>
        <label>Bricks Broken</label>
      </div>
      <div className="stat">
        <Layers className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(totalBricksBroken.add(bricksBroken))}</span>
        <label>Total Bricks</label>
      </div>
      <div className="stat">
        <Circle className="stat-icon" size={24} />
        <span className="stat-value">{balls.length}</span>
        <label>Balls</label>
      </div>
      <div className="stat">
        <TrendingUp className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(prestigeTarget)}</span>
        <label>Next Prestige</label>
      </div>
    </div>
  );
}
