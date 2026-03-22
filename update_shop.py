import sys
import os

path = 'src/components/Shop.tsx'
with open(path, 'r') as f:
    content = f.read()

search_text = """  const buyUpgrade = useGameStore((state) => state.buyUpgrade);"""

replace_text = """  const buyUpgrade = useGameStore((state) => state.buyUpgrade);
  const buyMaxUpgrade = useGameStore((state) => state.buyMaxUpgrade);"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """              level={upgrades.speed}
              onBuy={() => buyUpgrade('speed')}
            />"""

replace_text = """              level={upgrades.speed}
              onBuy={() => buyUpgrade('speed')}
              onBuyMax={() => buyMaxUpgrade('speed')}
            />"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """              level={upgrades.damage}
              onBuy={() => buyUpgrade('damage')}
            />"""

replace_text = """              level={upgrades.damage}
              onBuy={() => buyUpgrade('damage')}
              onBuyMax={() => buyMaxUpgrade('damage')}
            />"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """              level={upgrades.coinMult}
              onBuy={() => buyUpgrade('coinMult')}
            />"""

replace_text = """              level={upgrades.coinMult}
              onBuy={() => buyUpgrade('coinMult')}
              onBuyMax={() => buyMaxUpgrade('coinMult')}
            />"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """  /** Current level of the upgrade. */
  level: number;
  /** Callback to trigger purchase. */
  onBuy: () => void;
}"""

replace_text = """  /** Current level of the upgrade. */
  level: number;
  /** Callback to trigger purchase. */
  onBuy: () => void;
  /** Callback to trigger "buy max" purchase. */
  onBuyMax: () => void;
}"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """function UpgradeButton({ name, icon: Icon, description, cost, coins, level, onBuy }: UpgradeButtonProps) {
  const canAfford = coins.gte(cost);

  return (
    <button className={`shop-item ${canAfford ? 'affordable' : ''}`} disabled={!canAfford} onClick={onBuy}>
      <span className="item-name">
        <Icon size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" />
        {name} <span className="item-level">Lv.{level}</span>
      </span>
      <span className="item-cost">{formatNumber(cost)}</span> coins
      <div className="item-desc">{description}</div>
    </button>
  );
}"""

replace_text = """function UpgradeButton({ name, icon: Icon, description, cost, coins, level, onBuy, onBuyMax }: UpgradeButtonProps) {
  const canAfford = coins.gte(cost);

  return (
    <div className={`shop-item upgrade-item ${canAfford ? 'affordable' : ''}`}>
      <div className="upgrade-main">
        <span className="item-name">
          <Icon size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" />
          {name} <span className="item-level">Lv.{level}</span>
        </span>
        <span className="item-cost">{formatNumber(cost)}</span> coins
        <div className="item-desc">{description}</div>
      </div>
      <div className="upgrade-actions">
        <button className="buy-btn" disabled={!canAfford} onClick={onBuy}>Buy</button>
        <button className="buy-max-btn" disabled={!canAfford} onClick={onBuyMax}>Max</button>
      </div>
    </div>
  );
}"""

if search_text in content:
    content = content.replace(search_text, replace_text)
    with open(path, 'w') as f:
        f.write(content)
    print('Successfully updated ' + path)
else:
    print('Search text not found in ' + path)
