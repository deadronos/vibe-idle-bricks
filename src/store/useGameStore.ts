import { create } from 'zustand';
import Decimal from 'break_infinity.js';
import { GAME_CONSTANTS } from '../types/game';
import type { BrickData } from '../types/game';
import BigNum from '../utils/bigNumber';

/**
 * Ball statistics
 */
interface BallStats {
  damage: Decimal;
  speed: number;
  count: number;
}

/**
 * Upgrade configuration
 */
interface UpgradeConfig {
  damageUpgradeCost: Decimal;
  speedUpgradeCost: Decimal;
  ballCost: Decimal;
  damageLevel: number;
  speedLevel: number;
}

/**
 * Complete game state interface
 */
interface GameState {
  money: Decimal;
  ballStats: BallStats;
  upgrades: UpgradeConfig;
  brickGrid: Map<string, BrickData>;
  totalBricks: number;
  destroyedBricks: number;
  viewportX: number;
  viewportY: number;
  isInitialized: boolean;
}

/**
 * Game actions interface
 */
interface GameActions {
  addMoney: (amount: Decimal | number) => void;
  spendMoney: (amount: Decimal | number) => boolean;
  upgradeDamage: () => boolean;
  upgradeSpeed: () => boolean;
  addBall: () => boolean;
  destroyBrick: (brickId: string) => void;
  damageBrick: (brickId: string, damage: Decimal) => Decimal | null;
  setViewport: (x: number, y: number) => void;
  initializeBricks: () => void;
  getVisibleBricks: () => BrickData[];
  getBrickById: (id: string) => BrickData | undefined;
  regenerateBricks: () => void;
  hasVisibleBricks: () => boolean;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

/**
 * Generates a unique brick ID from grid coordinates
 */
function getBrickId(row: number, col: number): string {
  return `${row}-${col}`;
}

/**
 * Creates initial brick data for a position
 */
function createBrick(row: number, col: number): BrickData {
  const x = col * (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING);
  const y = row * (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING);
  
  // Calculate health based on row (deeper = more health)
  const baseHealth = 1 + Math.floor(row / 10);
  const health = new Decimal(baseHealth);
  
  // Generate color based on health tier
  const colorTier = Math.min(Math.floor(row / 100), 10);
  const colors = [
    0x00ff00, // Green (easy)
    0x7fff00, // Chartreuse
    0xffff00, // Yellow
    0xffbf00, // Orange-yellow
    0xff8000, // Orange
    0xff4000, // Red-orange
    0xff0000, // Red
    0xff0080, // Pink
    0x8000ff, // Purple
    0x0080ff, // Blue
    0x00ffff, // Cyan (hardest)
  ];
  
  return {
    id: getBrickId(row, col),
    x,
    y,
    width: GAME_CONSTANTS.BRICK_WIDTH,
    height: GAME_CONSTANTS.BRICK_HEIGHT,
    health,
    maxHealth: health.add(0), // Clone
    destroyed: false,
    color: colors[colorTier],
  };
}

/**
 * Creates initial game state
 */
function createInitialState(): GameState {
  return {
    money: new Decimal(0),
    ballStats: {
      damage: new Decimal(GAME_CONSTANTS.INITIAL_BALL_DAMAGE),
      speed: GAME_CONSTANTS.INITIAL_BALL_SPEED,
      count: 1,
    },
    upgrades: {
      damageUpgradeCost: new Decimal(10),
      speedUpgradeCost: new Decimal(15),
      ballCost: new Decimal(50),
      damageLevel: 1,
      speedLevel: 1,
    },
    brickGrid: new Map(),
    totalBricks: GAME_CONSTANTS.TOTAL_BRICKS,
    destroyedBricks: 0,
    viewportX: 0,
    viewportY: 0,
    isInitialized: false,
  };
}

/**
 * Main game store using Zustand
 */
export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  /**
   * Adds money to the player's total
   */
  addMoney: (amount: Decimal | number) => {
    set((state) => ({
      money: state.money.add(BigNum.toDecimal(amount)),
    }));
  },

  /**
   * Attempts to spend money, returns true if successful
   */
  spendMoney: (amount: Decimal | number) => {
    const state = get();
    const cost = BigNum.toDecimal(amount);
    
    if (state.money.gte(cost)) {
      set({
        money: state.money.sub(cost),
      });
      return true;
    }
    return false;
  },

  /**
   * Upgrades ball damage if player has enough money
   */
  upgradeDamage: () => {
    const state = get();
    const cost = state.upgrades.damageUpgradeCost;
    
    if (state.money.gte(cost)) {
      set({
        money: state.money.sub(cost),
        ballStats: {
          ...state.ballStats,
          damage: state.ballStats.damage.mul(1.5),
        },
        upgrades: {
          ...state.upgrades,
          damageUpgradeCost: cost.mul(1.8),
          damageLevel: state.upgrades.damageLevel + 1,
        },
      });
      return true;
    }
    return false;
  },

  /**
   * Upgrades ball speed if player has enough money
   */
  upgradeSpeed: () => {
    const state = get();
    const cost = state.upgrades.speedUpgradeCost;
    
    if (state.money.gte(cost)) {
      set({
        money: state.money.sub(cost),
        ballStats: {
          ...state.ballStats,
          speed: state.ballStats.speed * 1.2,
        },
        upgrades: {
          ...state.upgrades,
          speedUpgradeCost: cost.mul(1.6),
          speedLevel: state.upgrades.speedLevel + 1,
        },
      });
      return true;
    }
    return false;
  },

  /**
   * Adds a new ball if player has enough money
   */
  addBall: () => {
    const state = get();
    const cost = state.upgrades.ballCost;
    
    if (state.money.gte(cost)) {
      set({
        money: state.money.sub(cost),
        ballStats: {
          ...state.ballStats,
          count: state.ballStats.count + 1,
        },
        upgrades: {
          ...state.upgrades,
          ballCost: cost.mul(2),
        },
      });
      return true;
    }
    return false;
  },

  /**
   * Marks a brick as destroyed and adds money
   */
  destroyBrick: (brickId: string) => {
    const state = get();
    const brick = state.brickGrid.get(brickId);
    
    if (brick && !brick.destroyed) {
      const newBrickGrid = new Map(state.brickGrid);
      newBrickGrid.set(brickId, { ...brick, destroyed: true });
      
      // Money reward based on max health
      const reward = brick.maxHealth;
      
      set({
        brickGrid: newBrickGrid,
        destroyedBricks: state.destroyedBricks + 1,
        money: state.money.add(reward),
      });
    }
  },

  /**
   * Damages a brick and returns remaining health, or null if destroyed
   */
  damageBrick: (brickId: string, damage: Decimal) => {
    const state = get();
    const brick = state.brickGrid.get(brickId);
    
    if (!brick || brick.destroyed) {
      return null;
    }
    
    const newHealth = brick.health.sub(damage);
    
    if (newHealth.lte(0)) {
      // Brick is destroyed
      get().destroyBrick(brickId);
      return null;
    }
    
    // Update brick health
    const newBrickGrid = new Map(state.brickGrid);
    newBrickGrid.set(brickId, { ...brick, health: newHealth });
    set({ brickGrid: newBrickGrid });
    
    return newHealth;
  },

  /**
   * Updates the viewport position for brick rendering
   */
  setViewport: (x: number, y: number) => {
    set({
      viewportX: Math.max(0, x),
      viewportY: Math.max(0, y),
    });
  },

  /**
   * Initializes bricks for the visible viewport area
   * Uses lazy initialization - only creates bricks when they come into view
   */
  initializeBricks: () => {
    const state = get();
    if (state.isInitialized) return;
    
    // Only initialize the first visible area
    const visibleRows = Math.ceil(GAME_CONSTANTS.GAME_HEIGHT / (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    const visibleCols = Math.ceil(GAME_CONSTANTS.GAME_WIDTH / (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    
    const newBrickGrid = new Map<string, BrickData>();
    
    for (let row = 0; row < visibleRows; row++) {
      for (let col = 0; col < visibleCols; col++) {
        const brick = createBrick(row, col);
        newBrickGrid.set(brick.id, brick);
      }
    }
    
    set({
      brickGrid: newBrickGrid,
      isInitialized: true,
    });
  },

  /**
   * Gets bricks visible in the current viewport
   */
  getVisibleBricks: () => {
    const state = get();
    const { viewportX, viewportY, brickGrid } = state;
    
    // Calculate visible range
    const startRow = Math.floor(viewportY / (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING));
    const endRow = startRow + Math.ceil(GAME_CONSTANTS.GAME_HEIGHT / (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    
    const startCol = Math.floor(viewportX / (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING));
    const endCol = startCol + Math.ceil(GAME_CONSTANTS.GAME_WIDTH / (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    
    const visibleBricks: BrickData[] = [];
    const newBricks: BrickData[] = [];
    
    // Check for bricks in visible range, create if they don't exist
    for (let row = Math.max(0, startRow); row <= endRow; row++) {
      for (let col = Math.max(0, startCol); col <= endCol; col++) {
        // Check if within total brick bounds
        const brickIndex = row * GAME_CONSTANTS.BRICKS_PER_ROW + col;
        if (brickIndex >= GAME_CONSTANTS.TOTAL_BRICKS) continue;
        if (col >= GAME_CONSTANTS.BRICKS_PER_ROW) continue;
        
        const brickId = getBrickId(row, col);
        let brick = brickGrid.get(brickId);
        
        if (!brick) {
          // Lazy create brick
          brick = createBrick(row, col);
          newBricks.push(brick);
        }
        
        if (!brick.destroyed) {
          visibleBricks.push(brick);
        }
      }
    }
    
    // Batch add new bricks to the grid synchronously
    // This is safe because getVisibleBricks is called from Phaser update loop, not React render
    if (newBricks.length > 0) {
      const newBrickGrid = new Map(brickGrid);
      newBricks.forEach(brick => {
        newBrickGrid.set(brick.id, brick);
      });
      set({ brickGrid: newBrickGrid });
    }
    
    return visibleBricks;
  },

  /**
   * Gets a brick by its ID
   */
  getBrickById: (id: string) => {
    return get().brickGrid.get(id);
  },

  /**
   * Checks if there are any visible (non-destroyed) bricks
   */
  hasVisibleBricks: () => {
    const state = get();
    const { viewportX, viewportY, brickGrid } = state;
    
    const startRow = Math.floor(viewportY / (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING));
    const endRow = startRow + Math.ceil(GAME_CONSTANTS.GAME_HEIGHT / (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    
    const startCol = Math.floor(viewportX / (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING));
    const endCol = startCol + Math.ceil(GAME_CONSTANTS.GAME_WIDTH / (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    
    for (let row = Math.max(0, startRow); row <= endRow; row++) {
      for (let col = Math.max(0, startCol); col <= endCol; col++) {
        const brickId = `${row}-${col}`;
        const brick = brickGrid.get(brickId);
        if (brick && !brick.destroyed) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Regenerates all destroyed bricks in the visible area with increased health
   */
  regenerateBricks: () => {
    const state = get();
    const { viewportX, viewportY, brickGrid } = state;
    
    const startRow = Math.floor(viewportY / (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING));
    const endRow = startRow + Math.ceil(GAME_CONSTANTS.GAME_HEIGHT / (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    
    const startCol = Math.floor(viewportX / (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING));
    const endCol = startCol + Math.ceil(GAME_CONSTANTS.GAME_WIDTH / (GAME_CONSTANTS.BRICK_WIDTH + GAME_CONSTANTS.BRICK_PADDING)) + GAME_CONSTANTS.VIEWPORT_PADDING;
    
    const newBrickGrid = new Map(brickGrid);
    let regeneratedCount = 0;
    
    for (let row = Math.max(0, startRow); row <= endRow; row++) {
      for (let col = Math.max(0, startCol); col <= endCol; col++) {
        const brickId = `${row}-${col}`;
        const existingBrick = brickGrid.get(brickId);
        
        if (existingBrick && existingBrick.destroyed) {
          // Regenerate with slightly more health each wave
          const waveMultiplier = 1 + Math.floor(state.destroyedBricks / 100) * 0.1;
          const baseHealth = 1 + Math.floor(row / 10);
          const newHealth = new Decimal(baseHealth * waveMultiplier);
          
          newBrickGrid.set(brickId, {
            ...existingBrick,
            health: newHealth,
            maxHealth: newHealth,
            destroyed: false,
          });
          regeneratedCount++;
        }
      }
    }
    
    if (regeneratedCount > 0) {
      set({ brickGrid: newBrickGrid });
    }
  },

  /**
   * Resets the game to initial state
   */
  resetGame: () => {
    set(createInitialState());
  },
}));

export default useGameStore;
