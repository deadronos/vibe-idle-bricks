import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import Decimal from 'break_infinity.js';
import {
  BALL_TYPES,
  UPGRADE_MULTIPLIER,
  PRESTIGE_BONUS,
  MAX_TIER,
  getPrestigeThreshold,
  MAX_BALLS,
  MAX_SPEED_UPGRADE,
  MAX_PRESTIGE_LEVEL,
  COST_MULTIPLIER,
} from '../types';
import type {
  BallType,
  BallData,
  BrickData,
  Upgrades,
  Explosion,
  SaveData,
} from '../types';
import { createBall } from '../utils/helpers';
import { calculateOfflineEarnings } from './earnings';

/**
 * Interface defining the entire state and actions of the game store.
 */
interface GameStore {
  // State
  /** Current amount of coins available to the player. */
  coins: Decimal;
  /** Number of bricks broken in the current prestige run. */
  bricksBroken: Decimal;
  /** Total number of bricks broken across all runs (lifetime stats). */
  totalBricksBroken: Decimal;
  /** Current prestige level, granting global bonuses. */
  prestigeLevel: number;
  /** Current levels of all purchased upgrades. */
  upgrades: Upgrades;
  /** Current cost to purchase the next ball of each type. */
  ballCosts: Record<BallType, Decimal>;
  /** Current cost to purchase the next level of each upgrade. */
  upgradeCosts: Record<keyof Upgrades, Decimal>;
  /** Current difficulty tier for new bricks. */
  currentTier: number;
  /** List of all active balls. */
  balls: BallData[];
  /** List of all active bricks. */
  bricks: BrickData[];
  /** List of active explosion effects. */
  explosions: Explosion[];
  /** The dimensions of the game canvas. */
  canvasSize: { width: number; height: number };
  /** Whether the game simulation is currently paused. */
  isPaused: boolean;
  /**
   * Offline-earnings message set by `load()` to be surfaced as a toast by the UI.
   * Cleared after the UI reads it.
   */
  pendingOfflineMessage: string | null;
  /** Timestamp of the last save or update, used for offline earnings. */
  timestamp: number;

  // Actions
  /**
   * Updates the canvas dimensions and initializes the first ball if needed.
   * @param width - The new width of the canvas.
   * @param height - The new height of the canvas.
   */
  setCanvasSize: (width: number, height: number) => void;

  /**
   * Adds coins to the player's balance, applying prestige bonuses.
   * @param amount - The base amount of coins to add.
   */
  addCoins: (amount: Decimal) => void;

  /**
   * Increments the count of broken bricks and updates the tier if necessary.
   */
  incrementBricksBroken: () => void;

  /**
   * Attempts to purchase a new ball of the specified type.
   * @param type - The type of ball to buy.
   * @returns {boolean} True if the purchase was successful, false otherwise.
   */
  buyBall: (type: BallType) => boolean;

  /**
   * Attempts to purchase an upgrade.
   * @param type - The type of upgrade to buy.
   * @returns {boolean} True if the purchase was successful, false otherwise.
   */
  buyUpgrade: (type: keyof Upgrades) => boolean;

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
  canPrestige: () => boolean;

  /**
   * Resets the game progress to gain prestige levels and bonuses.
   * @returns {boolean} True if prestige was successful.
   */
  prestige: () => boolean;

  /**
   * Updates the list of active bricks (e.g., from the game loop).
   * @param bricks - The new list of bricks.
   */
  setBricks: (bricks: BrickData[]) => void;

  /**
   * Removes a specific brick by ID.
   * @param id - The ID of the brick to remove.
   */
  removeBrick: (id: string) => void;

  /**
   * Applies damage to a specific brick and handles its potential destruction.
   * @param id - The ID of the brick to damage.
   * @param damage - The amount of damage to deal.
   * @returns {{ destroyed: boolean; value: Decimal } | null} The result of the damage (destroyed status and coin value), or null if brick not found.
   */
  damageBrick: (id: string, damage: Decimal) => { destroyed: boolean; value: Decimal } | null;

  /**
   * Applies multiple brick damage operations in a single state update.
   * Returns per-brick results for rewards and effects.
   */
  applyBrickDamageBatch: (operations: BrickDamageOperation[]) => BrickDamageResult[];

  /**
   * Spawns an explosion effect at the specified location.
   * @param x - The X coordinate.
   * @param y - The Y coordinate.
   * @param radius - The radius of the explosion.
   */
  addExplosion: (x: number, y: number, radius: number) => void;

  /**
   * Updates the state of all active explosions (reduces life).
   * @param deltaTime - Time elapsed since last frame.
   */
  updateExplosions: (deltaTime: number) => void;

  /**
   * Persists the current game state to local storage.
   */
  save: () => void;

  /**
   * Loads the game state from local storage and handles offline progress.
   */
  load: () => void;

  /**
   * Resets the entire game state to default (hard reset).
   */
  reset: () => void;

  /**
   * Exports the current save data as a JSON string.
   * @returns {string} The exported save string.
   */
  exportSave: () => string;

  /**
   * Imports a save from a string.
   * @param data - The save data string to import.
   * @returns {boolean} True if import was successful.
   */
  importSave: (data: string) => boolean;

  /**
   * Clears the pending offline notification after it has been shown.
   */
  clearOfflineMessage: () => void;

  /**
   * Pauses or unpauses the game.
   * @param paused - True to pause, false to unpause.
   */
  setPaused: (paused: boolean) => void;

  /**
   * Calculates the current global damage multiplier.
   * @returns {number} The damage multiplier.
   */
  getDamageMult: () => number;

  /**
   * Calculates the current global coin multiplier.
   * @returns {number} The coin multiplier.
   */
  getCoinMult: () => number;

  /**
   * Calculates the current global speed multiplier.
   * @returns {number} The speed multiplier.
   */
  getSpeedMult: () => number;
}

interface BrickDamageOperation {
  id: string;
  damage: Decimal;
}

interface BrickDamageResult {
  id: string;
  brick: BrickData;
  destroyed: boolean;
  value: Decimal;
}

const ZERO_DECIMAL = new Decimal(0);

const parseDecimal = (value: unknown, fallback: Decimal = ZERO_DECIMAL): Decimal => {
  try {
    return new Decimal(value as string | number);
  } catch {
    return new Decimal(fallback);
  }
};

const parseInteger = (value: unknown, fallback = 0, max?: number): number => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const normalizedValue = Math.max(fallback, Math.floor(numericValue));

  if (typeof max === 'number') {
    return Math.min(max, normalizedValue);
  }

  return normalizedValue;
};

const isValidBallType = (value: unknown): value is BallType => {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BALL_TYPES, value);
};

type SaveDataOptions = {
  includeVersion: boolean;
};

interface SaveDataBuilderState {
  coins: Decimal;
  bricksBroken: Decimal;
  totalBricksBroken: Decimal;
  prestigeLevel: number;
  upgrades: Upgrades;
  ballCosts: Record<BallType, Decimal>;
  upgradeCosts: Record<keyof Upgrades, Decimal>;
  currentTier: number;
  balls: BallData[];
}

const buildSaveData = (state: SaveDataBuilderState, options: SaveDataOptions): SaveData => {
  const base: SaveData = {
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

  if (options.includeVersion) {
    return { ...base, version: 1 };
  }
  return base;
};

const resolveBrickDamageBatch = (
  bricks: BrickData[],
  operations: BrickDamageOperation[]
) => {
  const damageByBrickId = new Map<string, Decimal>();

  for (const operation of operations) {
    const currentDamage = damageByBrickId.get(operation.id);
    damageByBrickId.set(
      operation.id,
      currentDamage ? currentDamage.add(operation.damage) : operation.damage
    );
  }

  if (damageByBrickId.size === 0) {
    return {
      bricks,
      results: [] as BrickDamageResult[],
    };
  }

  const nextBricks: BrickData[] = [];
  const results: BrickDamageResult[] = [];

  for (const brick of bricks) {
    const damage = damageByBrickId.get(brick.id);
    if (!damage) {
      nextBricks.push(brick);
      continue;
    }

    const newHealth = brick.health.sub(damage);
    const destroyed = newHealth.lte(0);

    if (destroyed) {
      results.push({
        id: brick.id,
        brick,
        destroyed: true,
        value: brick.value,
      });
      continue;
    }

    const updatedBrick = { ...brick, health: newHealth, lastHitTime: Date.now() };
    nextBricks.push(updatedBrick);
    results.push({
      id: brick.id,
      brick: updatedBrick,
      destroyed: false,
      value: ZERO_DECIMAL,
    });
  }

  return {
    bricks: nextBricks,
    results,
  };
};

/**
 * Returns the default costs for all ball types.
 * @returns {Record<BallType, Decimal>} A map of ball types to their initial costs.
 */
const getDefaultBallCosts = (): Record<BallType, Decimal> => ({
  basic: new Decimal(BALL_TYPES.basic.baseCost),
  fast: new Decimal(BALL_TYPES.fast.baseCost),
  heavy: new Decimal(BALL_TYPES.heavy.baseCost),
  plasma: new Decimal(BALL_TYPES.plasma.baseCost),
  explosive: new Decimal(BALL_TYPES.explosive.baseCost),
  sniper: new Decimal(BALL_TYPES.sniper.baseCost),
});

/**
 * Returns the default costs for all upgrades.
 * @returns {Record<keyof Upgrades, Decimal>} A map of upgrades to their initial costs.
 */
const getDefaultUpgradeCosts = (): Record<keyof Upgrades, Decimal> => ({
  speed: new Decimal(100),
  damage: new Decimal(150),
  coinMult: new Decimal(200),
});

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const isStorageLike = (value: unknown): value is StorageLike => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<StorageLike>;
  return (
    typeof candidate.getItem === 'function' &&
    typeof candidate.setItem === 'function' &&
    typeof candidate.removeItem === 'function'
  );
};

const getLocalStorage = (): StorageLike | undefined => {
  if (typeof window !== 'undefined' && isStorageLike(window.localStorage)) {
    return window.localStorage;
  }

  const maybeLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
  if (isStorageLike(maybeLocalStorage)) {
    return maybeLocalStorage;
  }

  return undefined;
};

/**
 * Parses save data and reconstructs the game state.
 * @param saveData - The raw JSON object from storage.
 * @param canvasWidth - Current canvas width.
 * @param canvasHeight - Current canvas height.
 * @returns {Partial<GameStore>} The partial state to merge.
 */
const parseSaveData = (saveData: SaveData, canvasWidth: number, canvasHeight: number) => {
  // Recreate balls, ignoring invalid values from malformed saves.
  const savedBallTypes = Array.isArray(saveData.balls)
    ? saveData.balls.filter(isValidBallType)
    : [];
  const defaultBallTypes: BallType[] = ['basic'];
  const ballTypes = savedBallTypes.length > 0 ? savedBallTypes.slice(0, MAX_BALLS) : defaultBallTypes;
  const balls: BallData[] = ballTypes.map((type) => {
    return createBall(type, canvasWidth, canvasHeight);
  });

  const ballCosts = getDefaultBallCosts();
  if (saveData.ballCosts) {
    for (const [key, value] of Object.entries(saveData.ballCosts)) {
      if (Object.prototype.hasOwnProperty.call(ballCosts, key)) {
        const ballType = key as BallType;
        ballCosts[ballType] = parseDecimal(value, ballCosts[ballType]);
      }
    }
  }

  const upgradeCosts = getDefaultUpgradeCosts();
  if (saveData.upgradeCosts) {
    for (const [key, value] of Object.entries(saveData.upgradeCosts)) {
      if (Object.prototype.hasOwnProperty.call(upgradeCosts, key)) {
        const upgradeKey = key as keyof Upgrades;
        upgradeCosts[upgradeKey] = parseDecimal(value, upgradeCosts[upgradeKey]);
      }
    }
  }

  const savedUpgrades = saveData.upgrades ?? { speed: 0, damage: 0, coinMult: 0 };

  return {
    coins: parseDecimal(saveData.coins),
    bricksBroken: parseDecimal(saveData.bricksBroken),
    totalBricksBroken: parseDecimal(saveData.totalBricksBroken),
    prestigeLevel: parseInteger(saveData.prestigeLevel),
    upgrades: {
      speed: parseInteger(savedUpgrades.speed, 0, MAX_SPEED_UPGRADE),
      damage: parseInteger(savedUpgrades.damage),
      coinMult: parseInteger(savedUpgrades.coinMult),
    },
    ballCosts,
    upgradeCosts,
    currentTier: parseInteger(saveData.currentTier, 1),
    balls: balls.length > 0 ? balls : [createBall('basic', canvasWidth, canvasHeight)],
    timestamp: saveData.timestamp || Date.now(),
  };
};

/**
 * The main Zustand store hook for managing game state.
 * Uses `subscribeWithSelector` middleware for reactive updates.
 */
export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    coins: new Decimal(0),
    bricksBroken: new Decimal(0),
    totalBricksBroken: new Decimal(0),
    prestigeLevel: 0,
    upgrades: { speed: 0, damage: 0, coinMult: 0 },
    ballCosts: getDefaultBallCosts(),
    upgradeCosts: getDefaultUpgradeCosts(),
    currentTier: 1,
    balls: [],
    bricks: [],
    explosions: [],
    canvasSize: { width: 800, height: 500 },
    isPaused: false,
    pendingOfflineMessage: null,
    timestamp: Date.now(),

    setCanvasSize: (width, height) => {
      set({ canvasSize: { width, height } });
      // Initialize first ball if none exist
      const state = get();
      if (state.balls.length === 0) {
        set({ balls: [createBall('basic', width, height)] });
      }
    },

    addCoins: (amount) => {
      const state = get();
      const prestigeBonus = 1 + state.prestigeLevel * PRESTIGE_BONUS;
      const newCoins = state.coins.add(amount.mul(prestigeBonus));
      set({ coins: newCoins });
    },

    incrementBricksBroken: () => {
      const state = get();
      set({
        bricksBroken: state.bricksBroken.add(1),
      });

      // Check if we need to increase tier
      const newTier = Math.min(MAX_TIER, 1 + Math.floor(state.bricksBroken.add(1).toNumber() / 100));
      if (newTier > state.currentTier) {
        set({ currentTier: newTier });
      }
    },

    buyBall: (type) => {
      const state = get();
      if (state.balls.length >= MAX_BALLS) return false;

      const cost = state.ballCosts[type];

      if (state.coins.gte(cost)) {
        const { width, height } = state.canvasSize;
        const newBall = createBall(type, width, height);

        set({
          coins: state.coins.sub(cost),
          balls: [...state.balls, newBall],
          ballCosts: {
            ...state.ballCosts,
            [type]: cost.mul(COST_MULTIPLIER).ceil(),
          },
        });
        return true;
      }
      return false;
    },

    buyUpgrade: (type) => {
      const state = get();
      if (type === 'speed' && state.upgrades.speed >= MAX_SPEED_UPGRADE) return false;

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
            [type]: cost.mul(COST_MULTIPLIER).ceil(),
          },
        });
        return true;
      }
      return false;
    },

    buyMaxUpgrade: (type) => {
      const state = get();
      if (type === 'speed' && state.upgrades.speed >= MAX_SPEED_UPGRADE) return 0;

      let cost = state.upgradeCosts[type];
      let purchased = 0;

      if (state.coins.lt(cost) || cost.lte(0)) return 0;

      let currentCoins = state.coins;
      let currentUpgradeLevel = state.upgrades[type];
      const currentUpgradeCosts = { ...state.upgradeCosts };

      while (currentCoins.gte(cost) && (type !== 'speed' || currentUpgradeLevel < MAX_SPEED_UPGRADE)) {
        currentCoins = currentCoins.sub(cost);
        currentUpgradeLevel++;
        cost = cost.mul(COST_MULTIPLIER).ceil();
        currentUpgradeCosts[type] = cost;
        purchased++;
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
    },

    canPrestige: () => {
      const state = get();
      const threshold = getPrestigeThreshold(state.prestigeLevel);
      return state.bricksBroken.gte(threshold);
    },

    prestige: () => {
      const state = get();
      if (!get().canPrestige()) return false;
      if (state.prestigeLevel >= MAX_PRESTIGE_LEVEL) return false;

      const { width, height } = state.canvasSize;

      set({
        totalBricksBroken: state.totalBricksBroken.add(state.bricksBroken),
        prestigeLevel: state.prestigeLevel + 1,
        coins: new Decimal(0),
        bricksBroken: new Decimal(0),
        currentTier: 1,
        upgrades: { speed: 0, damage: 0, coinMult: 0 },
        ballCosts: getDefaultBallCosts(),
        upgradeCosts: getDefaultUpgradeCosts(),
        balls: [createBall('basic', width, height)],
        bricks: [],
        explosions: [],
        timestamp: Date.now(),
      });

      return true;
    },

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
      const saveData = buildSaveData(state, { includeVersion: false });
      storage.setItem('idleBricksSave', JSON.stringify(saveData));
    },

    exportSave: () => {
      const state = get();
      const saveData = buildSaveData(state, { includeVersion: true });
      return JSON.stringify(saveData);
    },

    importSave: (data: string) => {
      try {
        const saveData = JSON.parse(data);
        const state = get();
        const { width, height } = state.canvasSize;

        // Basic validation
        if (typeof saveData.coins === 'undefined' || typeof saveData.prestigeLevel === 'undefined') {
          throw new Error('Invalid save data: missing required fields');
        }

        const partialState = parseSaveData(saveData, width, height);

        set({
          ...partialState,
          bricks: [],
          explosions: [],
        });

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

        // Remove timestamp from partialState before setting to conform to GameStore if necessary,
        // but now timestamp IS in GameStore interface.
        set(partialState as Partial<GameStore>);

        // Calculate offline progress
        const loadedTimestamp = partialState.timestamp;
        if (loadedTimestamp) {
          const offlineTime = Date.now() - loadedTimestamp;
          const seconds = offlineTime / 1000;
          const minutes = seconds / 60;

          if (minutes > 1) {
            const newState = get();
            const speedMult = newState.getSpeedMult();
            const damageMult = newState.getDamageMult();
            const coinMult = newState.getCoinMult();

            const { coins: offlineCoins, message } = calculateOfflineEarnings(
              newState.balls,
              speedMult,
              damageMult,
              coinMult,
              newState.prestigeLevel,
              newState.currentTier,
              seconds
            );

            if (offlineCoins.gt(0)) {
              set({
                coins: newState.coins.add(offlineCoins),
                pendingOfflineMessage: message,
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
      });
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
