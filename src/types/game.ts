import Decimal from 'break_infinity.js';

/**
 * Represents a single brick in the game
 */
export interface BrickData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: Decimal;
  maxHealth: Decimal;
  destroyed: boolean;
  color: number;
}

/**
 * Represents a chunk of bricks for viewport rendering
 */
export interface BrickChunk {
  chunkX: number;
  chunkY: number;
  bricks: BrickData[];
}

/**
 * Ball upgrade stats
 */
export interface BallStats {
  damage: Decimal;
  speed: number;
  count: number;
}

/**
 * Upgrade costs and multipliers
 */
export interface UpgradeConfig {
  damageUpgradeCost: Decimal;
  speedUpgradeCost: Decimal;
  ballCost: Decimal;
  damageMultiplier: number;
  speedMultiplier: number;
}

/**
 * Complete game state
 */
export interface GameState {
  money: Decimal;
  ballStats: BallStats;
  upgrades: UpgradeConfig;
  brickGrid: Map<string, BrickData>;
  totalBricks: number;
  destroyedBricks: number;
  viewportX: number;
  viewportY: number;
}

/**
 * Game actions that can modify state
 */
export interface GameActions {
  addMoney: (amount: Decimal) => void;
  spendMoney: (amount: Decimal) => boolean;
  upgradeDamage: () => boolean;
  upgradeSpeed: () => boolean;
  addBall: () => boolean;
  destroyBrick: (brickId: string) => void;
  setViewport: (x: number, y: number) => void;
  initializeBricks: () => void;
  resetGame: () => void;
}

/**
 * Viewport bounds for rendering
 */
export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Constants for the game
 */
export const GAME_CONSTANTS = {
  BRICK_WIDTH: 40,
  BRICK_HEIGHT: 20,
  BRICK_PADDING: 2,
  CHUNK_SIZE: 10, // Number of bricks per chunk dimension
  VIEWPORT_PADDING: 2, // Extra chunks to load around viewport
  TOTAL_BRICKS: 1_000_000,
  BRICKS_PER_ROW: 1000,
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  BALL_RADIUS: 8,
  INITIAL_BALL_SPEED: 200,
  INITIAL_BALL_DAMAGE: 1,
} as const;
