import sys
import os

path = 'src/store/gameStore.ts'
with open(path, 'r') as f:
    content = f.read()

search_text = """  buyUpgrade: (type: keyof Upgrades) => boolean;

  /**
   * Checks if the player meets the requirements to prestige.
   * @returns {boolean} True if prestige is available.
   */
  canPrestige: () => boolean;"""

replace_text = """  buyUpgrade: (type: keyof Upgrades) => boolean;

  /**
   * Attempts to purchase as many levels of an upgrade as possible.
   * @param type - The type of upgrade to buy.
   * @returns {number} The number of levels purchased.
   */
  buyMaxUpgrade: (type: keyof Upgrades) => number;

  /**
   * Checks if the player meets the requirements to prestige.
   * @returns {boolean} True if prestige is available.
   */
  canPrestige: () => boolean;"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """    buyUpgrade: (type) => {
      const state = get();
      const cost = state.upgradeCosts[type];

      if (state.coins.gte(cost)) {
        set({
          coins: state.coins.sub(cost),
          upgrades: {
            ...state.upgrades,
            [type]: state.upgrades[type] + 1,
          },
          upgradeCosts: {
            ...state.upgradeCosts,
            [type]: cost.mul(1.15).ceil(),
          },
        });
        return true;
      }
      return false;
    },"""

replace_text = """    buyUpgrade: (type) => {
      const state = get();
      const cost = state.upgradeCosts[type];

      if (state.coins.gte(cost)) {
        set({
          coins: state.coins.sub(cost),
          upgrades: {
            ...state.upgrades,
            [type]: state.upgrades[type] + 1,
          },
          upgradeCosts: {
            ...state.upgradeCosts,
            [type]: cost.mul(1.15).ceil(),
          },
        });
        return true;
      }
      return false;
    },

    buyMaxUpgrade: (type) => {
      let state = get();
      let cost = state.upgradeCosts[type];
      let purchased = 0;

      if (state.coins.lt(cost)) return 0;

      let currentCoins = state.coins;
      let currentUpgradeLevel = state.upgrades[type];
      let currentUpgradeCosts = { ...state.upgradeCosts };

      while (currentCoins.gte(cost)) {
        currentCoins = currentCoins.sub(cost);
        currentUpgradeLevel++;
        cost = cost.mul(1.15).ceil();
        currentUpgradeCosts[type] = cost;
        purchased++;

        // Safety break to prevent infinite loops (should not happen with 1.15 multiplier)
        if (purchased >= 1000) break;
      }

      set({
        coins: currentCoins,
        upgrades: {
          ...state.upgrades,
          [type]: currentUpgradeLevel,
        },
        upgradeCosts: currentUpgradeCosts,
      });

      return purchased;
    },"""

if search_text in content:
    content = content.replace(search_text, replace_text)
    with open(path, 'w') as f:
        f.write(content)
    print('Successfully updated ' + path)
else:
    print('Search text not found in ' + path)
