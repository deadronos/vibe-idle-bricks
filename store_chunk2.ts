    setBricks: (bricks) => set({ bricks }),

    removeBrick: (id) => {
      const state = get();
      set({ bricks: state.bricks.filter((b) => b.id !== id) });
    },

    applyBrickDamageBatch: (operations) => {
      const state = get();
      const nextState = resolveBrickDamageBatch(state.bricks, operations);
      if (nextState.results.length > 0) {
        set({ bricks: nextState.bricks });
      }
      return nextState.results;
    },

    damageBrick: (id, damage) => {
      const [result] = get().applyBrickDamageBatch([{ id, damage }]);
      if (!result) return null;

      return {
        destroyed: result.destroyed,
        value: result.value,
      };
    },

    addExplosion: (x, y, radius) => {
      const state = get();
      set({
        explosions: [
          ...state.explosions,
          { x, y, radius, life: 300, maxLife: 300 },
        ],
      });
    },

    updateExplosions: (deltaTime) => {
      const state = get();
      const nextExplosions: Explosion[] = [];

      for (const explosion of state.explosions) {
        const nextLife = explosion.life - deltaTime;
        if (nextLife > 0) {
          nextExplosions.push({ ...explosion, life: nextLife });
        }
      }

      set({ explosions: nextExplosions });
    },

    save: () => {
      const storage = getLocalStorage();
      if (!storage) return;

      const state = get();
      const saveData = {
        coins: state.coins.toString(),
        bricksBroken: state.bricksBroken.toString(),
        totalBricksBroken: state.totalBricksBroken.toString(),
        prestigeLevel: state.prestigeLevel,
        upgrades: state.upgrades,
        ballCosts: Object.fromEntries(
          Object.entries(state.ballCosts).map(([k, v]) => [k, v.toString()])
        ),
        upgradeCosts: Object.fromEntries(
          Object.entries(state.upgradeCosts).map(([k, v]) => [k, v.toString()])
        ),
        currentTier: state.currentTier,
        balls: state.balls.map((b) => b.type),
        timestamp: Date.now(),
      };
      storage.setItem('idleBricksSave', JSON.stringify(saveData));
    },

    exportSave: () => {
      const state = get();
      const saveData = {
        coins: state.coins.toString(),
        bricksBroken: state.bricksBroken.toString(),
        totalBricksBroken: state.totalBricksBroken.toString(),
        prestigeLevel: state.prestigeLevel,
        upgrades: state.upgrades,
        ballCosts: Object.fromEntries(
          Object.entries(state.ballCosts).map(([k, v]) => [k, v.toString()])
        ),
        upgradeCosts: Object.fromEntries(
          Object.entries(state.upgradeCosts).map(([k, v]) => [k, v.toString()])
        ),
        currentTier: state.currentTier,
        balls: state.balls.map((b) => b.type),
        timestamp: Date.now(),
        version: 1,
      };
      return JSON.stringify(saveData);
    },

    importSave: (data: string) => {
      try {
        const saveData = JSON.parse(data);
        const state = get();
        const { width, height } = state.canvasSize;

        // Basic validation
        if (typeof saveData.coins === 'undefined' || typeof saveData.prestigeLevel === 'undefined') {
          console.error('Invalid save data: missing required fields');
          return false;
        }

        const partialState = parseSaveData(saveData, width, height);

        set({
          ...partialState,
          bricks: [],
          explosions: [],
        timestamp: Date.now(),
        timestamp: Date.now(),

        return true;
      } catch (e) {
        console.error('Failed to import save:', e);
        return false;
      }
    },

    load: () => {
      const storage = getLocalStorage();
      if (!storage) return;

      const saveStr = storage.getItem('idleBricksSave');
      if (!saveStr) return;

      try {
        const saveData = JSON.parse(saveStr);
        const state = get();
        const { width, height } = state.canvasSize;

        const partialState = parseSaveData(saveData, width, height);
        // Exclude timestamp from state as it is not part of GameStore state (except conceptually, but not typed in state update)
        // Wait, the interface says `timestamp` is not in GameStore interface, but it IS in GameState in types.
        // Let's check GameStore interface again. It does NOT have timestamp.

        // Remove timestamp from partialState before setting
        const { timestamp, ...stateToSet } = partialState;

        // Ensure stateToSet conforms to partial GameStore state
        set(stateToSet as Partial<GameStore>);

        // Calculate offline progress
        if (timestamp) {
          const offlineTime = Date.now() - timestamp;
          const seconds = offlineTime / 1000;
          const minutes = seconds / 60;

          if (minutes > 1) {
            const newState = get();
            const coinsPerSecond =
              newState.balls.length *
              (1 + newState.upgrades.coinMult * UPGRADE_MULTIPLIER) *
              (1 + newState.prestigeLevel * PRESTIGE_BONUS);
            const offlineCoins = new Decimal(coinsPerSecond * seconds * OFFLINE_EARNINGS_RATE).floor();

            if (offlineCoins.gt(0)) {
              set({
                coins: newState.coins.add(offlineCoins),
                pendingOfflineMessage: `Welcome back! You earned ${offlineCoins.toString()} coins while away.`,
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    },

    reset: () => {
      const storage = getLocalStorage();
      if (storage) storage.removeItem('idleBricksSave');
      const state = get();
      const { width, height } = state.canvasSize;

      set({
        coins: new Decimal(0),
        bricksBroken: new Decimal(0),
        totalBricksBroken: new Decimal(0),
        prestigeLevel: 0,
        currentTier: 1,
        upgrades: { speed: 0, damage: 0, coinMult: 0 },
        ballCosts: getDefaultBallCosts(),
        upgradeCosts: getDefaultUpgradeCosts(),
        balls: [createBall('basic', width, height)],
        bricks: [],
        explosions: [],
        timestamp: Date.now(),
        timestamp: Date.now(),
    },

    setPaused: (paused) => set({ isPaused: paused }),

    clearOfflineMessage: () => set({ pendingOfflineMessage: null }),

    getDamageMult: () => {
      const state = get();
      return 1 + state.upgrades.damage * UPGRADE_MULTIPLIER;
    },

    getCoinMult: () => {
      const state = get();
      return 1 + state.upgrades.coinMult * UPGRADE_MULTIPLIER;
    },

    getSpeedMult: () => {
      const state = get();
      return 1 + state.upgrades.speed * UPGRADE_MULTIPLIER;
    },
  }))
);
