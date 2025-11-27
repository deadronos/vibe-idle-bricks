import { useGameStore } from '../store/useGameStore';
import BigNum from '../utils/bigNumber';

/**
 * Displays detailed ball and game statistics
 */
export function BallStats(): React.ReactElement {
  const ballStats = useGameStore((state) => state.ballStats);
  const destroyedBricks = useGameStore((state) => state.destroyedBricks);

  // Calculate DPS (damage per second) estimate
  const estimatedDPS = ballStats.damage.mul(ballStats.count).mul(ballStats.speed / 100);

  return (
    <div className="ball-stats">
      <h3>Ball Stats</h3>
      <div className="stat-row">
        <span>Balls:</span>
        <span>{ballStats.count}</span>
      </div>
      <div className="stat-row">
        <span>Damage per Hit:</span>
        <span>{BigNum.format(ballStats.damage)}</span>
      </div>
      <div className="stat-row">
        <span>Speed:</span>
        <span>{ballStats.speed.toFixed(0)}</span>
      </div>
      <div className="stat-row">
        <span>Est. DPS:</span>
        <span>{BigNum.format(estimatedDPS)}</span>
      </div>
      <div className="stat-row">
        <span>Total Destroyed:</span>
        <span>{BigNum.format(destroyedBricks)}</span>
      </div>
    </div>
  );
}

export default BallStats;
