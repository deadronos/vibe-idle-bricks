import { useGameStore } from '../store';
import { formatNumber } from '../utils';
import { getPrestigeThreshold } from '../types';

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
        <span className="stat-value">{formatNumber(coins)}</span>
        <label>Coins</label>
      </div>
      <div className="stat">
        <span className="stat-value">{formatNumber(bricksBroken)}</span>
        <label>Bricks Broken</label>
      </div>
      <div className="stat">
        <span className="stat-value">{formatNumber(totalBricksBroken.add(bricksBroken))}</span>
        <label>Total Bricks</label>
      </div>
      <div className="stat">
        <span className="stat-value">{balls.length}</span>
        <label>Balls</label>
      </div>
      <div className="stat">
        <span className="stat-value">{formatNumber(prestigeTarget)}</span>
        <label>Next Prestige</label>
      </div>
    </div>
  );
}
