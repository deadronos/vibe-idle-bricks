import { useState } from 'react';
import { useGameStore } from '../store';
import { type BallType, BALL_TYPES, PRESTIGE_BONUS, getPrestigeThreshold } from '../types';
import { formatNumber } from '../utils';
import { ShoppingCart, Zap, Crosshair, Bomb, Circle, Hexagon, Star, ArrowUpCircle, Coins, TrendingUp } from 'lucide-react';

/** List of available ball types in the shop order. */
const ballTypes: BallType[] = ['basic', 'fast', 'heavy', 'plasma', 'explosive', 'sniper'];
/** List of available upgrades. */
type UpgradeType = 'speed' | 'damage' | 'coinMult';

/** Mapping of ball types to their icon components. */
const BallIcons: Record<BallType, React.ElementType> = {
  basic: Circle,
  fast: Zap,
  heavy: Hexagon,
  plasma: Star,
  explosive: Bomb,
  sniper: Crosshair,
};

/**
 * Shop component where players can buy new balls and upgrades.
 * Displays current costs, affordability, and handles purchase actions.
 *
 * @returns {JSX.Element} The shop UI panel.
 */
export function Shop() {
  const [activeTab, setActiveTab] = useState<'balls' | 'upgrades' | 'prestige'>('balls');
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
      <h2><ShoppingCart className="inline-icon" size={24} /> Shop</h2>

      <div className="shop-tabs">
        <button 
          className={`shop-tab-btn ${activeTab === 'balls' ? 'active' : ''}`}
          onClick={() => setActiveTab('balls')}
        >
          Balls
        </button>
        <button 
          className={`shop-tab-btn ${activeTab === 'upgrades' ? 'active' : ''}`}
          onClick={() => setActiveTab('upgrades')}
        >
          Upgrades
        </button>
        <button 
          className={`shop-tab-btn ${activeTab === 'prestige' ? 'active' : ''}`}
          onClick={() => setActiveTab('prestige')}
        >
          Prestige
        </button>
      </div>

      {activeTab === 'balls' && (
        <div className="shop-section">
          <h3>Buy Balls</h3>
          <div className="shop-items">
            {ballTypes.map((type) => {
              const config = BALL_TYPES[type];
              const cost = ballCosts[type];
              const canAfford = coins.gte(cost);
              const Icon = BallIcons[type];

              return (
                <button
                  key={type}
                  className={`shop-item ball-${type} ${canAfford ? 'affordable' : ''}`}
                  disabled={!canAfford}
                  onClick={() => buyBall(type)}
                >
                  <span className="item-name">
                    <Icon size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} />
                    {type.charAt(0).toUpperCase() + type.slice(1)} Ball
                  </span>
                  <span className="item-cost">{formatNumber(cost)}</span> coins
                  <div className="item-desc">{config.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'upgrades' && (
        <div className="shop-section">
          <h3>Upgrades</h3>
          <div className="shop-items">
            <UpgradeButton
              type="speed"
              name="Speed Boost"
              icon={Zap}
              description="All balls +10% speed"
              cost={upgradeCosts.speed}
              coins={coins}
              level={upgrades.speed}
              onBuy={() => buyUpgrade('speed')}
            />
            <UpgradeButton
              type="damage"
              name="Power Boost"
              icon={ArrowUpCircle}
              description="All balls +10% damage"
              cost={upgradeCosts.damage}
              coins={coins}
              level={upgrades.damage}
              onBuy={() => buyUpgrade('damage')}
            />
            <UpgradeButton
              type="coinMult"
              name="Coin Multiplier"
              icon={Coins}
              description="+10% coins earned"
              cost={upgradeCosts.coinMult}
              coins={coins}
              level={upgrades.coinMult}
              onBuy={() => buyUpgrade('coinMult')}
            />
          </div>
        </div>
      )}

      {activeTab === 'prestige' && (
        <div className="shop-section">
          <h3>Prestige</h3>
          <button
            className={`shop-item prestige-btn ${canDoPrestige ? 'affordable' : ''}`}
            disabled={!canDoPrestige}
            onClick={handlePrestige}
          >
            <span className="item-name"><TrendingUp size={16} className="inline-block mr-2" /> Prestige</span>
            <span className="item-desc">Reset for permanent bonuses</span>
            <span className="item-desc">
              {canDoPrestige
                ? `+${prestigePercent}% coin bonus (Current: +${prestigeLevel * prestigePercent}%)`
                : `Break ${formatNumber(bricksNeeded)} more bricks`}
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}

/** Props for the UpgradeButton component. */
interface UpgradeButtonProps {
  /** The type of upgrade. */
  type: UpgradeType;
  /** Display name of the upgrade. */
  name: string;
  /** Icon component for the upgrade. */
  icon: React.ElementType;
  /** Description of the upgrade's effect. */
  description: string;
  /** Current cost of the upgrade. */
  cost: import('break_infinity.js').default;
  /** Player's current coin balance. */
  coins: import('break_infinity.js').default;
  /** Current level of the upgrade. */
  level: number;
  /** Callback to trigger purchase. */
  onBuy: () => void;
}

/**
 * Reusable button component for purchasing upgrades.
 *
 * @param props - Component props.
 * @returns {JSX.Element} The upgrade button.
 */
function UpgradeButton({ name, icon: Icon, description, cost, coins, level, onBuy }: UpgradeButtonProps) {
  const canAfford = coins.gte(cost);

  return (
    <button className={`shop-item ${canAfford ? 'affordable' : ''}`} disabled={!canAfford} onClick={onBuy}>
      <span className="item-name">
        <Icon size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} />
        {name} <span className="item-level">Lv.{level}</span>
      </span>
      <span className="item-cost">{formatNumber(cost)}</span> coins
      <div className="item-desc">{description}</div>
    </button>
  );
}
