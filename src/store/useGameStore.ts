import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import Decimal from 'break_infinity.js';
import type { BallStats, BallUpgradeCosts, BrickData, SaveData, Viewport } from '../types';
import { GAME_CONFIG, UPGRADE_CONFIG, BALL_CONFIG, BRICK_CONFIG, SAVE_CONFIG } from '../config/gameConfig';
import { calculateUpgradeCost, calculateBrickHealth, calculateBrickReward, canAfford } from '../utils/bigNumber';

interface GameState {
  // Core game state
  money: Decimal;
  totalBricksDestroyed: number;
  
  // Ball stats
  ballStats: BallStats;
  upgradeCosts: BallUpgradeCosts;
  upgradeLevels: {
    damage: number;
    speed: number;
    count: number;
  };
  
  // Brick data (sparse storage - only track non-destroyed bricks)
  // Key format: "x,y" -> BrickData
  brickHealthMap: Map<string, Decimal>;
  destroyedBricks: Set<string>;
  
  // Viewport tracking
  viewport: Viewport;
  cameraPosition: { x: number; y: number };
  
  // Game status
  isGameRunning: boolean;
  isPaused: boolean;
  
  // Actions
  addMoney: (amount: Decimal | number) => void;
  spendMoney: (amount: Decimal | number) => boolean;
  
  upgradeDamage: () => boolean;
  upgradeSpeed: () => boolean;
  upgradeBallCount: () => boolean;
  
  damageBrick: (brickId: string, damage: Decimal) => { destroyed: boolean; reward: Decimal } | null;
  getBrickHealth: (x: number, y: number) => Decimal;
  isBrickDestroyed: (x: number, y: number) => boolean;
  getBrickData: (x: number, y: number) => BrickData;
  
  setViewport: (viewport: Viewport) => void;
  setCameraPosition: (x: number, y: number) => void;
  
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  
  // Save/Load
  saveGame: () => void;
  loadGame: () => boolean;
  resetGame: () => void;
  
  // Utility
  getVisibleBricks: () => BrickData[];
  getTotalBrickCount: () => number;
}

// Helper to generate brick ID from coordinates
const getBrickId = (x: number, y: number): string => `${x},${y}`;

// Helper to parse brick ID back to coordinates
const parseBrickId = (id: string): { x: number; y: number } => {
  const [x, y] = id.split(',').map(Number);
  return { x, y };
};

// Calculate initial brick health for a position
const getInitialBrickHealth = (y: number): Decimal => {
  const tier = Math.floor(y / 10); // Every 10 rows increases tier
  return calculateBrickHealth(tier, BRICK_CONFIG.baseHealth, BRICK_CONFIG.healthMultiplier);
};

// Calculate brick reward for a position
const getBrickReward = (y: number): Decimal => {
  const tier = Math.floor(y / 10);
  return calculateBrickReward(tier, BRICK_CONFIG.baseReward, BRICK_CONFIG.rewardMultiplier);
};

// Initial state factory
const createInitialState = () => ({
  money: new Decimal(0),
  totalBricksDestroyed: 0,
  
  ballStats: {
    damage: new Decimal(BALL_CONFIG.baseDamage),
    speed: BALL_CONFIG.initialSpeed,
    count: 1,
  },
  
  upgradeCosts: {
    damage: new Decimal(UPGRADE_CONFIG.damage.baseCost),
    speed: new Decimal(UPGRADE_CONFIG.speed.baseCost),
    count: new Decimal(UPGRADE_CONFIG.count.baseCost),
  },
  
  upgradeLevels: {
    damage: 0,
    speed: 0,
    count: 0,
  },
  
  brickHealthMap: new Map<string, Decimal>(),
  destroyedBricks: new Set<string>(),
  
  viewport: {
    x: 0,
    y: 0,
    width: GAME_CONFIG.canvasWidth,
    height: GAME_CONFIG.canvasHeight,
  },
  
  cameraPosition: { x: 0, y: 0 },
  
  isGameRunning: false,
  isPaused: false,
});

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    ...createInitialState(),
    
    // Money actions
    addMoney: (amount) => {
      set((state) => ({
        money: state.money.add(new Decimal(amount)),
      }));
    },
    
    spendMoney: (amount) => {
      const cost = new Decimal(amount);
      const state = get();
      
      if (state.money.gte(cost)) {
        set({ money: state.money.sub(cost) });
        return true;
      }
      return false;
    },
    
    // Upgrade actions
    upgradeDamage: () => {
      const state = get();
      const cost = state.upgradeCosts.damage;
      
      if (!canAfford(state.money, cost)) return false;
      
      const newLevel = state.upgradeLevels.damage + 1;
      const newDamage = state.ballStats.damage.mul(BALL_CONFIG.damageUpgradeMultiplier);
      const newCost = calculateUpgradeCost(
        UPGRADE_CONFIG.damage.baseCost,
        newLevel,
        UPGRADE_CONFIG.damage.costMultiplier
      );
      
      set({
        money: state.money.sub(cost),
        ballStats: {
          ...state.ballStats,
          damage: newDamage,
        },
        upgradeCosts: {
          ...state.upgradeCosts,
          damage: newCost,
        },
        upgradeLevels: {
          ...state.upgradeLevels,
          damage: newLevel,
        },
      });
      
      return true;
    },
    
    upgradeSpeed: () => {
      const state = get();
      const cost = state.upgradeCosts.speed;
      
      if (!canAfford(state.money, cost)) return false;
      
      const newLevel = state.upgradeLevels.speed + 1;
      const newSpeed = Math.min(
        state.ballStats.speed + BALL_CONFIG.speedUpgradeAmount,
        BALL_CONFIG.maxSpeed
      );
      const newCost = calculateUpgradeCost(
        UPGRADE_CONFIG.speed.baseCost,
        newLevel,
        UPGRADE_CONFIG.speed.costMultiplier
      );
      
      set({
        money: state.money.sub(cost),
        ballStats: {
          ...state.ballStats,
          speed: newSpeed,
        },
        upgradeCosts: {
          ...state.upgradeCosts,
          speed: newCost,
        },
        upgradeLevels: {
          ...state.upgradeLevels,
          speed: newLevel,
        },
      });
      
      return true;
    },
    
    upgradeBallCount: () => {
      const state = get();
      const cost = state.upgradeCosts.count;
      
      if (!canAfford(state.money, cost)) return false;
      
      const newLevel = state.upgradeLevels.count + 1;
      const newCost = calculateUpgradeCost(
        UPGRADE_CONFIG.count.baseCost,
        newLevel,
        UPGRADE_CONFIG.count.costMultiplier
      );
      
      set({
        money: state.money.sub(cost),
        ballStats: {
          ...state.ballStats,
          count: state.ballStats.count + 1,
        },
        upgradeCosts: {
          ...state.upgradeCosts,
          count: newCost,
        },
        upgradeLevels: {
          ...state.upgradeLevels,
          count: newLevel,
        },
      });
      
      return true;
    },
    
    // Brick actions
    getBrickHealth: (x, y) => {
      const state = get();
      const id = getBrickId(x, y);
      
      // Check if destroyed
      if (state.destroyedBricks.has(id)) {
        return new Decimal(0);
      }
      
      // Check if we have tracked health
      const trackedHealth = state.brickHealthMap.get(id);
      if (trackedHealth) {
        return trackedHealth;
      }
      
      // Return initial health for this position
      return getInitialBrickHealth(y);
    },
    
    isBrickDestroyed: (x, y) => {
      const state = get();
      return state.destroyedBricks.has(getBrickId(x, y));
    },
    
    getBrickData: (x, y) => {
      const state = get();
      const id = getBrickId(x, y);
      const destroyed = state.destroyedBricks.has(id);
      const maxHealth = getInitialBrickHealth(y);
      const health = destroyed ? new Decimal(0) : (state.brickHealthMap.get(id) || maxHealth);
      const reward = getBrickReward(y);
      const tier = Math.floor(y / 10);
      
      return {
        id,
        x,
        y,
        health,
        maxHealth,
        reward,
        destroyed,
        tier,
      };
    },
    
    damageBrick: (brickId, damage) => {
      const state = get();
      const { y } = parseBrickId(brickId);
      
      // Already destroyed
      if (state.destroyedBricks.has(brickId)) {
        return null;
      }
      
      // Get current health
      const currentHealth = state.brickHealthMap.get(brickId) || getInitialBrickHealth(y);
      const newHealth = currentHealth.sub(damage);
      
      if (newHealth.lte(0)) {
        // Brick destroyed
        const reward = getBrickReward(y);
        const newDestroyedBricks = new Set(state.destroyedBricks);
        newDestroyedBricks.add(brickId);
        
        const newHealthMap = new Map(state.brickHealthMap);
        newHealthMap.delete(brickId);
        
        set({
          destroyedBricks: newDestroyedBricks,
          brickHealthMap: newHealthMap,
          money: state.money.add(reward),
          totalBricksDestroyed: state.totalBricksDestroyed + 1,
        });
        
        return { destroyed: true, reward };
      } else {
        // Brick damaged but not destroyed
        const newHealthMap = new Map(state.brickHealthMap);
        newHealthMap.set(brickId, newHealth);
        
        set({ brickHealthMap: newHealthMap });
        
        return { destroyed: false, reward: new Decimal(0) };
      }
    },
    
    // Viewport actions
    setViewport: (viewport) => {
      set({ viewport });
    },
    
    setCameraPosition: (x, y) => {
      set({ cameraPosition: { x, y } });
    },
    
    // Game control
    startGame: () => {
      set({ isGameRunning: true, isPaused: false });
    },
    
    pauseGame: () => {
      set({ isPaused: true });
    },
    
    resumeGame: () => {
      set({ isPaused: false });
    },
    
    // Get visible bricks based on viewport
    getVisibleBricks: () => {
      const state = get();
      const { viewport, cameraPosition } = state;
      const { brickWidth, brickHeight, brickGap, gridWidth, gridHeight } = GAME_CONFIG;
      
      const cellWidth = brickWidth + brickGap;
      const cellHeight = brickHeight + brickGap;
      
      // Calculate which bricks are in view (with buffer)
      const startX = Math.max(0, Math.floor((cameraPosition.x - cellWidth) / cellWidth));
      const startY = Math.max(0, Math.floor((cameraPosition.y - cellHeight) / cellHeight));
      const endX = Math.min(gridWidth - 1, Math.ceil((cameraPosition.x + viewport.width + cellWidth) / cellWidth));
      const endY = Math.min(gridHeight - 1, Math.ceil((cameraPosition.y + viewport.height + cellHeight) / cellHeight));
      
      const visibleBricks: BrickData[] = [];
      
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const brickData = state.getBrickData(x, y);
          if (!brickData.destroyed) {
            visibleBricks.push(brickData);
          }
        }
      }
      
      return visibleBricks;
    },
    
    getTotalBrickCount: () => {
      return GAME_CONFIG.gridWidth * GAME_CONFIG.gridHeight;
    },
    
    // Save/Load
    saveGame: () => {
      const state = get();
      
      const saveData: SaveData = {
        money: state.money.toString(),
        ballStats: {
          damage: state.ballStats.damage.toString(),
          speed: state.ballStats.speed,
          count: state.ballStats.count,
        },
        upgradeCosts: {
          damage: state.upgradeCosts.damage.toString(),
          speed: state.upgradeCosts.speed.toString(),
          count: state.upgradeCosts.count.toString(),
        },
        destroyedBricks: Array.from(state.destroyedBricks),
        cameraPosition: state.cameraPosition,
        totalBricksDestroyed: state.totalBricksDestroyed,
      };
      
      try {
        localStorage.setItem(SAVE_CONFIG.localStorageKey, JSON.stringify(saveData));
        console.log('Game saved successfully');
      } catch (e) {
        console.error('Failed to save game:', e);
      }
    },
    
    loadGame: () => {
      try {
        const savedData = localStorage.getItem(SAVE_CONFIG.localStorageKey);
        if (!savedData) return false;
        
        const data: SaveData = JSON.parse(savedData);
        
        set({
          money: new Decimal(data.money),
          ballStats: {
            damage: new Decimal(data.ballStats.damage),
            speed: data.ballStats.speed,
            count: data.ballStats.count,
          },
          upgradeCosts: {
            damage: new Decimal(data.upgradeCosts.damage),
            speed: new Decimal(data.upgradeCosts.speed),
            count: new Decimal(data.upgradeCosts.count),
          },
          destroyedBricks: new Set(data.destroyedBricks),
          cameraPosition: data.cameraPosition,
          totalBricksDestroyed: data.totalBricksDestroyed,
        });
        
        console.log('Game loaded successfully');
        return true;
      } catch (e) {
        console.error('Failed to load game:', e);
        return false;
      }
    },
    
    resetGame: () => {
      localStorage.removeItem(SAVE_CONFIG.localStorageKey);
      set(createInitialState());
    },
  }))
);

// Selector hooks for optimized re-renders
export const useGameMoney = () => useGameStore((state) => state.money);
export const useBallStats = () => useGameStore((state) => state.ballStats);
export const useUpgradeCosts = () => useGameStore((state) => state.upgradeCosts);
export const useTotalDestroyed = () => useGameStore((state) => state.totalBricksDestroyed);
export const useIsGameRunning = () => useGameStore((state) => state.isGameRunning);
