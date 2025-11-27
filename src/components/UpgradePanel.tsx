import { useGameStore } from '../store/useGameStore';
import BigNum from '../utils/bigNumber';

/**
 * Upgrade panel component for purchasing ball upgrades
 */
export function UpgradePanel(): React.ReactElement {
  const money = useGameStore((state) => state.money);
  const ballStats = useGameStore((state) => state.ballStats);
  const upgrades = useGameStore((state) => state.upgrades);
  const upgradeDamage = useGameStore((state) => state.upgradeDamage);
  const upgradeSpeed = useGameStore((state) => state.upgradeSpeed);
  const addBall = useGameStore((state) => state.addBall);

  const canAffordDamage = money.gte(upgrades.damageUpgradeCost);
  const canAffordSpeed = money.gte(upgrades.speedUpgradeCost);
  const canAffordBall = money.gte(upgrades.ballCost);

  return (
    <div className="upgrade-panel">
      <h3>Upgrades</h3>
      
      <div className="upgrade-item">
        <div className="upgrade-info">
          <span className="upgrade-name">Ball Damage</span>
          <span className="upgrade-level">Lv. {upgrades.damageLevel}</span>
          <span className="upgrade-current">
            Current: {BigNum.format(ballStats.damage)}
          </span>
        </div>
        <button
          className={`upgrade-button ${canAffordDamage ? 'can-afford' : 'cannot-afford'}`}
          onClick={() => upgradeDamage()}
          disabled={!canAffordDamage}
        >
          ${BigNum.format(upgrades.damageUpgradeCost)}
        </button>
      </div>

      <div className="upgrade-item">
        <div className="upgrade-info">
          <span className="upgrade-name">Ball Speed</span>
          <span className="upgrade-level">Lv. {upgrades.speedLevel}</span>
          <span className="upgrade-current">
            Current: {ballStats.speed.toFixed(0)}
          </span>
        </div>
        <button
          className={`upgrade-button ${canAffordSpeed ? 'can-afford' : 'cannot-afford'}`}
          onClick={() => upgradeSpeed()}
          disabled={!canAffordSpeed}
        >
          ${BigNum.format(upgrades.speedUpgradeCost)}
        </button>
      </div>

      <div className="upgrade-item">
        <div className="upgrade-info">
          <span className="upgrade-name">Add Ball</span>
          <span className="upgrade-level">Count: {ballStats.count}</span>
        </div>
        <button
          className={`upgrade-button ${canAffordBall ? 'can-afford' : 'cannot-afford'}`}
          onClick={() => addBall()}
          disabled={!canAffordBall}
        >
          ${BigNum.format(upgrades.ballCost)}
        </button>
      </div>
    </div>
  );
}

export default UpgradePanel;
