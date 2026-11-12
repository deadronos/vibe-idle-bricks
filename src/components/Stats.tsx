import { useGameStore } from '../store';
import { formatMultiplier, formatNumber } from '../utils';
import { PRESTIGE_THRESHOLD, getPrestigeMultiplier } from '../types';
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
  // Selector selects just the length to avoid re-rendering on every frame when ball positions update
  const ballCount = useGameStore((state) => state.balls.length);
  const prestigeLevel = useGameStore((state) => state.prestigeLevel);
  const prestigeMult = getPrestigeMultiplier(prestigeLevel);

  return (
    <div className="stats">
      <div className="stat stat-coins">
        <Coins className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(coins)}</span>
        <label>Coins</label>
      </div>
      <div className="stat stat-bricks">
        <BrickWall className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(bricksBroken)}</span>
        <label>Bricks Broken</label>
      </div>
      <div className="stat stat-total">
        <Layers className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(totalBricksBroken)}</span>
        <label>Total Bricks</label>
      </div>
      <div className="stat stat-balls">
        <Circle className="stat-icon" size={24} />
        <span className="stat-value">{ballCount}</span>
        <label>Balls</label>
      </div>
      <div className="stat stat-prestige-target">
        <TrendingUp className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(PRESTIGE_THRESHOLD)}</span>
        <label>Next Prestige</label>
      </div>
      <div className="stat stat-prestige-bonus">
        <TrendingUp className="stat-icon text-purple-400" size={24} />
        <span className="stat-value">{formatMultiplier(prestigeMult)}×</span>
        <label>Prestige Bonus</label>
      </div>
    </div>
  );
}
