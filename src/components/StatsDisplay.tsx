import { useGameStore } from '../store/useGameStore';
import BigNum from '../utils/bigNumber';

/**
 * Displays current money and brick statistics
 */
export function StatsDisplay(): React.ReactElement {
  const money = useGameStore((state) => state.money);
  const destroyedBricks = useGameStore((state) => state.destroyedBricks);
  const totalBricks = useGameStore((state) => state.totalBricks);

  const progress = (destroyedBricks / totalBricks) * 100;

  return (
    <div className="stats-display">
      <div className="stat-item">
        <span className="stat-label">Money:</span>
        <span className="stat-value money">${BigNum.format(money)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Bricks Destroyed:</span>
        <span className="stat-value">
          {BigNum.format(destroyedBricks)} / {BigNum.format(totalBricks)}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default StatsDisplay;
