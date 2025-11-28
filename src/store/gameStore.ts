import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import Decimal from 'break_infinity.js';
import {
  BALL_TYPES,
  UPGRADE_MULTIPLIER,
  PRESTIGE_BONUS,
  OFFLINE_EARNINGS_RATE,
  PRESTIGE_THRESHOLD,
} from '../types';
import type {
  BallType,
  BallData,
  BrickData,
  Upgrades,
  Explosion,
} from '../types';
import { generateId } from '../utils/helpers';

interface GameStore {
  // State
  coins: Decimal;
  bricksBroken: Decimal;
  totalBricksBroken: Decimal;
  prestigeLevel: number;
  upgrades: Upgrades;
  ballCosts: Record<BallType, Decimal>;
  upgradeCosts: Record<keyof Upgrades, Decimal>;
  currentTier: number;
  balls: BallData[];
  bricks: BrickData[];
  explosions: Explosion[];
  canvasSize: { width: number; height: number };
  isPaused: boolean;

  // Actions
  setCanvasSize: (width: number, height: number) => void;
  addCoins: (amount: Decimal) => void;
  incrementBricksBroken: () => void;
  buyBall: (type: BallType) => boolean;
  buyUpgrade: (type: keyof Upgrades) => boolean;
  canPrestige: () => boolean;
  prestige: () => boolean;
  setBricks: (bricks: BrickData[]) => void;
  removeBrick: (id: string) => void;
  damageBrick: (id: string, damage: Decimal) => { destroyed: boolean; value: Decimal } | null;
  addExplosion: (x: number, y: number, radius: number) => void;
  updateExplosions: (deltaTime: number) => void;
  save: () => void;
  load: () => void;
  reset: () => void;
  exportSave: () => string;
  importSave: (data: string) => boolean;
  setPaused: (paused: boolean) => void;
  getDamageMult: () => number;
  getCoinMult: () => number;
  getSpeedMult: () => number;
}

const getDefaultBallCosts = (): Record<BallType, Decimal> => ({
  basic: new Decimal(BALL_TYPES.basic.baseCost),
  fast: new Decimal(BALL_TYPES.fast.baseCost),
  heavy: new Decimal(BALL_TYPES.heavy.baseCost),
  plasma: new Decimal(BALL_TYPES.plasma.baseCost),
  explosive: new Decimal(BALL_TYPES.explosive.baseCost),
  sniper: new Decimal(BALL_TYPES.sniper.baseCost),
});

const getDefaultUpgradeCosts = (): Record<keyof Upgrades, Decimal> => ({
  speed: new Decimal(100),
  damage: new Decimal(150),
  coinMult: new Decimal(200),
});

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
      const newTier = Math.min(10, 1 + Math.floor(state.bricksBroken.add(1).toNumber() / 100));
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
            [type]: cost.mul(1.2).ceil(),
          },
        });
        return true;
      }
      return false;
    },

    canPrestige: () => {
      const state = get();
      return state.bricksBroken.gte(PRESTIGE_THRESHOLD);
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

        const ballCosts: Record<BallType, Decimal> = {} as Record<BallType, Decimal>;
        for (const [key, value] of Object.entries(saveData.ballCosts || {})) {
          ballCosts[key as BallType] = new Decimal(value as string);
        }

        const upgradeCosts: Record<keyof Upgrades, Decimal> = {} as Record<keyof Upgrades, Decimal>;
        for (const [key, value] of Object.entries(saveData.upgradeCosts || {})) {
          upgradeCosts[key as keyof Upgrades] = new Decimal(value as string);
        }

        set({
          coins: new Decimal(saveData.coins || 0),
          bricksBroken: new Decimal(saveData.bricksBroken || 0),
          totalBricksBroken: new Decimal(saveData.totalBricksBroken || 0),
          prestigeLevel: saveData.prestigeLevel || 0,
          upgrades: saveData.upgrades || { speed: 0, damage: 0, coinMult: 0 },
          ballCosts: Object.keys(ballCosts).length > 0 ? ballCosts : getDefaultBallCosts(),
          upgradeCosts: Object.keys(upgradeCosts).length > 0 ? upgradeCosts : getDefaultUpgradeCosts(),
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

        const ballCosts: Record<BallType, Decimal> = {} as Record<BallType, Decimal>;
        for (const [key, value] of Object.entries(saveData.ballCosts || {})) {
          ballCosts[key as BallType] = new Decimal(value as string);
        }

        const upgradeCosts: Record<keyof Upgrades, Decimal> = {} as Record<keyof Upgrades, Decimal>;
        for (const [key, value] of Object.entries(saveData.upgradeCosts || {})) {
          upgradeCosts[key as keyof Upgrades] = new Decimal(value as string);
        }

        set({
          coins: new Decimal(saveData.coins || 0),
          bricksBroken: new Decimal(saveData.bricksBroken || 0),
          totalBricksBroken: new Decimal(saveData.totalBricksBroken || 0),
          prestigeLevel: saveData.prestigeLevel || 0,
          upgrades: saveData.upgrades || { speed: 0, damage: 0, coinMult: 0 },
          ballCosts: Object.keys(ballCosts).length > 0 ? ballCosts : getDefaultBallCosts(),
          upgradeCosts: Object.keys(upgradeCosts).length > 0 ? upgradeCosts : getDefaultUpgradeCosts(),
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
