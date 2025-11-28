import { useGameStore } from '../store';
import { type BallType, BALL_TYPES, PRESTIGE_BONUS, getPrestigeThreshold } from '../types';
import { formatNumber } from '../utils';

const ballTypes: BallType[] = ['basic', 'fast', 'heavy', 'plasma', 'explosive', 'sniper'];
type UpgradeType = 'speed' | 'damage' | 'coinMult';

export function Shop() {
  const coins = useGameStore((state) => state.coins);
  const ballCosts = useGameStore((state) => state.ballCosts);
  const upgradeCosts = useGameStore((state) => state.upgradeCosts);
  const upgrades = useGameStore((state) => state.upgrades);
  const bricksBroken = useGameStore((state) => state.bricksBroken);
  const prestigeLevel = useGameStore((state) => state.prestigeLevel);
  const canPrestige = useGameStore((state) => state.canPrestige);
  const buyBall = useGameStore((state) => state.buyBall);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);
  const prestige = useGameStore((state) => state.prestige);

  const handlePrestige = () => {
    if (confirm('Are you sure you want to prestige? You will lose all progress but gain a permanent 25% coin bonus.')) {
      prestige();
    }
  };

  const prestigePercent = Math.round(PRESTIGE_BONUS * 100);
  const canDoPrestige = canPrestige();
  const prestigeThreshold = getPrestigeThreshold(prestigeLevel);
  const bricksNeeded = Math.max(0, prestigeThreshold - bricksBroken.toNumber());

  return (
    <aside className="shop-panel">
      <h2>🛒 Shop</h2>

      <div className="shop-section">
        <h3>Buy Balls</h3>
        <div className="shop-items">
          {ballTypes.map((type) => {
            const config = BALL_TYPES[type];
            const cost = ballCosts[type];
            const canAfford = coins.gte(cost);

            return (
              <button
                key={type}
                className={`shop-item ball-${type}`}
                disabled={!canAfford}
                onClick={() => buyBall(type)}
              >
                <span className="item-name">
                  {type.charAt(0).toUpperCase() + type.slice(1)} Ball
                </span>
                <span className="item-cost">{formatNumber(cost)}</span> coins
                <div className="item-desc">{config.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="shop-section">
        <h3>Upgrades</h3>
        <div className="shop-items">
          <UpgradeButton
            type="speed"
            name="Speed Boost"
            description="All balls +10% speed"
            cost={upgradeCosts.speed}
            coins={coins}
            level={upgrades.speed}
            onBuy={() => buyUpgrade('speed')}
          />
          <UpgradeButton
            type="damage"
            name="Power Boost"
            description="All balls +10% damage"
            cost={upgradeCosts.damage}
            coins={coins}
            level={upgrades.damage}
            onBuy={() => buyUpgrade('damage')}
          />
          <UpgradeButton
            type="coinMult"
            name="Coin Multiplier"
            description="+10% coins earned"
            cost={upgradeCosts.coinMult}
            coins={coins}
            level={upgrades.coinMult}
            onBuy={() => buyUpgrade('coinMult')}
          />
        </div>
      </div>

      <div className="shop-section">
        <h3>Prestige</h3>
        <button
          className="shop-item prestige-btn"
          disabled={!canDoPrestige}
          onClick={handlePrestige}
        >
          <span className="item-name">🌟 Prestige</span>
          <span className="item-desc">Reset for permanent bonuses</span>
          <span className="item-desc">
            {canDoPrestige
              ? `+${prestigePercent}% coin bonus (Current: +${prestigeLevel * prestigePercent}%)`
              : `Break ${formatNumber(bricksNeeded)} more bricks`}
          </span>
        </button>
      </div>
    </aside>
  );
}

interface UpgradeButtonProps {
  type: UpgradeType;
  name: string;
  description: string;
  cost: import('break_infinity.js').default;
  coins: import('break_infinity.js').default;
  level: number;
  onBuy: () => void;
}

function UpgradeButton({ name, description, cost, coins, level, onBuy }: UpgradeButtonProps) {
  const canAfford = coins.gte(cost);

  return (
    <button className="shop-item" disabled={!canAfford} onClick={onBuy}>
      <span className="item-name">{name} <span className="item-level">Lv.{level}</span></span>
      <span className="item-cost">{formatNumber(cost)}</span> coins
      <div className="item-desc">{description}</div>
    </button>
  );
}
