import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { formatNumber, formatCompact, canAfford } from '../../utils/bigNumber';
import './UpgradePanel.css';

/**
 * UpgradePanel - Contains all upgrade buttons
 */
export const UpgradePanel: React.FC = () => {
  const money = useGameStore((state) => state.money);
  const ballStats = useGameStore((state) => state.ballStats);
  const upgradeCosts = useGameStore((state) => state.upgradeCosts);
  const upgradeLevels = useGameStore((state) => state.upgradeLevels);
  
  const upgradeDamage = useGameStore((state) => state.upgradeDamage);
  const upgradeSpeed = useGameStore((state) => state.upgradeSpeed);
  const upgradeBallCount = useGameStore((state) => state.upgradeBallCount);

  const canAffordDamage = canAfford(money, upgradeCosts.damage);
  const canAffordSpeed = canAfford(money, upgradeCosts.speed);
  const canAffordCount = canAfford(money, upgradeCosts.count);

  return (
    <div className="upgrade-panel">
      <h3 className="upgrade-title">Upgrades</h3>
      
      <div className="upgrade-grid">
        {/* Damage Upgrade */}
        <button
          className={`upgrade-button ${canAffordDamage ? 'available' : 'unavailable'}`}
          onClick={upgradeDamage}
          disabled={!canAffordDamage}
        >
          <div className="upgrade-icon">⚔️</div>
          <div className="upgrade-info">
            <div className="upgrade-name">Damage</div>
            <div className="upgrade-level">Lvl {upgradeLevels.damage}</div>
            <div className="upgrade-current">{formatCompact(ballStats.damage)}</div>
          </div>
          <div className="upgrade-cost">
            <span className="cost-label">Cost:</span>
            <span className="cost-value">${formatCompact(upgradeCosts.damage)}</span>
          </div>
        </button>

        {/* Speed Upgrade */}
        <button
          className={`upgrade-button ${canAffordSpeed ? 'available' : 'unavailable'}`}
          onClick={upgradeSpeed}
          disabled={!canAffordSpeed}
        >
          <div className="upgrade-icon">💨</div>
          <div className="upgrade-info">
            <div className="upgrade-name">Speed</div>
            <div className="upgrade-level">Lvl {upgradeLevels.speed}</div>
            <div className="upgrade-current">{formatNumber(ballStats.speed, 0)}</div>
          </div>
          <div className="upgrade-cost">
            <span className="cost-label">Cost:</span>
            <span className="cost-value">${formatCompact(upgradeCosts.speed)}</span>
          </div>
        </button>

        {/* Ball Count Upgrade */}
        <button
          className={`upgrade-button ${canAffordCount ? 'available' : 'unavailable'}`}
          onClick={upgradeBallCount}
          disabled={!canAffordCount}
        >
          <div className="upgrade-icon">🔵</div>
          <div className="upgrade-info">
            <div className="upgrade-name">Balls</div>
            <div className="upgrade-level">Count: {ballStats.count}</div>
            <div className="upgrade-current">+1 Ball</div>
          </div>
          <div className="upgrade-cost">
            <span className="cost-label">Cost:</span>
            <span className="cost-value">${formatCompact(upgradeCosts.count)}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
