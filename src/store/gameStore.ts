import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import Decimal from 'break_infinity.js';
import {
  BALL_TYPES,
  UPGRADE_MULTIPLIER,
  PRESTIGE_BONUS,
  OFFLINE_EARNINGS_RATE,
  MAX_TIER,
  getPrestigeThreshold,
} from '../types';
import type {
  BallType,
  BallData,
  BrickData,
  Upgrades,
  Explosion,
} from '../types';
import { generateId } from '../utils/helpers';

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

/**
 * Creates the initial basic ball for a new game or run.
 * @param canvasWidth - The width of the canvas.
 * @param canvasHeight - The height of the canvas.
 * @returns {BallData} The initial ball object.
 */
const createInitialBall = (canvasWidth: number, canvasHeight: number): BallData => {
  const x = canvasWidth / 2 + (Math.random() - 0.5) * 200;
  const y = canvasHeight - 50;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
  const speed = BALL_TYPES.basic.speed;

  return {
    id: generateId(),
    type: 'basic',
    x,
    y,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
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

    setCanvasSize: (width, height) => {
      set({ canvasSize: { width, height } });
      // Initialize first ball if none exist
      const state = get();
      if (state.balls.length === 0) {
        set({ balls: [createInitialBall(width, height)] });
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
      const cost = state.ballCosts[type];

      if (state.coins.gte(cost)) {
        const config = BALL_TYPES[type];
        const { width, height } = state.canvasSize;
        const x = width / 2 + (Math.random() - 0.5) * 200;
        const y = height - 50;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;

        const newBall: BallData = {
          id: generateId(),
          type,
          x,
          y,
          dx: Math.cos(angle) * config.speed,
          dy: Math.sin(angle) * config.speed,
        };

        set({
          coins: state.coins.sub(cost),
          balls: [...state.balls, newBall],
          ballCosts: {
            ...state.ballCosts,
            [type]: cost.mul(1.15).ceil(),
          },
        });
        return true;
      }
      return false;
    },

    buyUpgrade: (type) => {
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

    canPrestige: () => {
      const state = get();
      const threshold = getPrestigeThreshold(state.prestigeLevel);
      return state.bricksBroken.gte(threshold);
    },

    prestige: () => {
      const state = get();
      if (!get().canPrestige()) return false;

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
        balls: [createInitialBall(width, height)],
        bricks: [],
        explosions: [],
      });

      return true;
    },

    setBricks: (bricks) => set({ bricks }),

    removeBrick: (id) => {
      const state = get();
      set({ bricks: state.bricks.filter((b) => b.id !== id) });
    },

    damageBrick: (id, damage) => {
      const state = get();
      const brickIndex = state.bricks.findIndex((b) => b.id === id);
      if (brickIndex === -1) return null;

      const brick = state.bricks[brickIndex];
      const newHealth = brick.health.sub(damage);
      const destroyed = newHealth.lte(0);

      if (destroyed) {
        set({
          bricks: state.bricks.filter((b) => b.id !== id),
        });
        return { destroyed: true, value: brick.value };
      } else {
        const newBricks = [...state.bricks];
        newBricks[brickIndex] = { ...brick, health: newHealth };
        set({ bricks: newBricks });
        return { destroyed: false, value: new Decimal(0) };
      }
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
      set({
        explosions: state.explosions
          .map((e) => ({ ...e, life: e.life - deltaTime }))
          .filter((e) => e.life > 0),
      });
    },

    save: () => {
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
      localStorage.setItem('idleBricksSave', JSON.stringify(saveData));
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

        // Recreate balls
        const balls: BallData[] = (saveData.balls || ['basic']).map((type: BallType) => {
          const config = BALL_TYPES[type] || BALL_TYPES.basic;
          const x = width / 2 + (Math.random() - 0.5) * 200;
          const y = height - 50;
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
          return {
            id: generateId(),
            type,
            x,
            y,
            dx: Math.cos(angle) * config.speed,
            dy: Math.sin(angle) * config.speed,
          };
        });

        const ballCosts = getDefaultBallCosts();
        if (saveData.ballCosts) {
          for (const [key, value] of Object.entries(saveData.ballCosts)) {
            if (Object.prototype.hasOwnProperty.call(ballCosts, key)) {
              ballCosts[key as BallType] = new Decimal(value as string);
            }
          }
        }

        const upgradeCosts = getDefaultUpgradeCosts();
        if (saveData.upgradeCosts) {
          for (const [key, value] of Object.entries(saveData.upgradeCosts)) {
            if (Object.prototype.hasOwnProperty.call(upgradeCosts, key)) {
              upgradeCosts[key as keyof Upgrades] = new Decimal(value as string);
            }
          }
        }

        set({
          coins: new Decimal(saveData.coins || 0),
          bricksBroken: new Decimal(saveData.bricksBroken || 0),
          totalBricksBroken: new Decimal(saveData.totalBricksBroken || 0),
          prestigeLevel: saveData.prestigeLevel || 0,
          upgrades: saveData.upgrades || { speed: 0, damage: 0, coinMult: 0 },
          ballCosts,
          upgradeCosts,
          currentTier: saveData.currentTier || 1,
          balls: balls.length > 0 ? balls : [createInitialBall(width, height)],
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
      const saveStr = localStorage.getItem('idleBricksSave');
      if (!saveStr) return;

      try {
        const saveData = JSON.parse(saveStr);
        const state = get();
        const { width, height } = state.canvasSize;

        // Recreate balls
        const balls: BallData[] = (saveData.balls || ['basic']).map((type: BallType) => {
          const config = BALL_TYPES[type] || BALL_TYPES.basic;
          const x = width / 2 + (Math.random() - 0.5) * 200;
          const y = height - 50;
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
          return {
            id: generateId(),
            type,
            x,
            y,
            dx: Math.cos(angle) * config.speed,
            dy: Math.sin(angle) * config.speed,
          };
        });

        const ballCosts = getDefaultBallCosts();
        if (saveData.ballCosts) {
          for (const [key, value] of Object.entries(saveData.ballCosts)) {
            if (Object.prototype.hasOwnProperty.call(ballCosts, key)) {
              ballCosts[key as BallType] = new Decimal(value as string);
            }
          }
        }

        const upgradeCosts = getDefaultUpgradeCosts();
        if (saveData.upgradeCosts) {
          for (const [key, value] of Object.entries(saveData.upgradeCosts)) {
            if (Object.prototype.hasOwnProperty.call(upgradeCosts, key)) {
              upgradeCosts[key as keyof Upgrades] = new Decimal(value as string);
            }
          }
        }

        set({
          coins: new Decimal(saveData.coins || 0),
          bricksBroken: new Decimal(saveData.bricksBroken || 0),
          totalBricksBroken: new Decimal(saveData.totalBricksBroken || 0),
          prestigeLevel: saveData.prestigeLevel || 0,
          upgrades: saveData.upgrades || { speed: 0, damage: 0, coinMult: 0 },
          ballCosts,
          upgradeCosts,
          currentTier: saveData.currentTier || 1,
          balls: balls.length > 0 ? balls : [createInitialBall(width, height)],
        });

        // Calculate offline progress
        if (saveData.timestamp) {
          const offlineTime = Date.now() - saveData.timestamp;
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
              set({ coins: newState.coins.add(offlineCoins) });
              console.log(`Welcome back! You earned ${offlineCoins.toString()} coins while away.`);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    },

    reset: () => {
      localStorage.removeItem('idleBricksSave');
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
        balls: [createInitialBall(width, height)],
        bricks: [],
        explosions: [],
      });
    },

    setPaused: (paused) => set({ isPaused: paused }),

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
