import { useMemo } from 'react';
import { useGameStore } from '../store';
import { formatMultiplier, formatNumber } from '../utils';
import { MAX_BALLS, PRESTIGE_THRESHOLD, getPrestigeMultiplier } from '../types';
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
  const ballTypesKey = useGameStore((state) => state.balls.map((ball) => ball.type).join(','));
  const speedLevel = useGameStore((state) => state.upgrades.speed);
  const damageLevel = useGameStore((state) => state.upgrades.damage);
  const coinLevel = useGameStore((state) => state.upgrades.coinMult);
  const currentTier = useGameStore((state) => state.currentTier);
  const prestigeLevel = useGameStore((state) => state.prestigeLevel);
  const prestigeMult = getPrestigeMultiplier(prestigeLevel);
  const incomePerSecond = useMemo(
    () => useGameStore.getState().getIncomePerSecond(),
    // The getter reads the current store; these selections trigger re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ballTypesKey, speedLevel, damageLevel, coinLevel, currentTier, prestigeLevel]
  );

  return (
    <div className="stats">
      <div className="stat stat-coins">
        <Coins className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(coins)}</span>
        <label>Coins</label>
        <span className="stat-rate">≈ {formatNumber(incomePerSecond)}/s</span>
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
        <span className="stat-value" aria-label={`${ballCount} of ${MAX_BALLS} balls`}>
          {ballCount} / {MAX_BALLS}
        </span>
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
