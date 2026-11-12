import Decimal from 'break_infinity.js';

/**
 * Represents the available types of balls in the game.
 * Each type has unique properties and abilities.
 */
export type BallType = 'basic' | 'fast' | 'heavy' | 'plasma' | 'explosive' | 'sniper';

/**
 * Configuration for a specific ball type.
 * Defines the base stats and behavior of the ball.
 */
export interface BallTypeConfig {
  /** The movement speed of the ball. Higher is faster. */
  speed: number;
  /** The amount of damage the ball deals to a brick on impact. */
  damage: number;
  /** The color of the ball in hex format. */
  color: string;
  /** Whether the ball can pass through bricks without bouncing off. */
  pierce: boolean;
  /** Whether the ball creates an explosion on impact. */
  explosive: boolean;
  /** The radius of the explosion if the ball is explosive. */
  explosionRadius?: number;
  /** Whether the ball actively targets specific bricks (e.g., weakest). */
  targeting: boolean;
  /** The base cost to purchase the first ball of this type. */
  baseCost: number;
  /** A human-readable description of the ball's special ability. */
  description: string;
}

/**
 * Represents an instance of a ball in the game world.
 */
export interface BallData {
  /** Unique identifier for the ball. */
  id: string;
  /** The type of the ball (e.g., 'basic', 'fast'). */
  type: BallType;
  /** The current X coordinate of the ball. */
  x: number;
  /** The current Y coordinate of the ball. */
  y: number;
  /** The velocity vector's X component. */
  dx: number;
  /** The velocity vector's Y component. */
  dy: number;
}

/**
 * Represents a brick in the game world.
 */
export interface BrickData {
  /** Unique identifier for the brick. */
  id: string;
  /** The X coordinate of the top-left corner of the brick. */
  x: number;
  /** The Y coordinate of the top-left corner of the brick. */
  y: number;
  /** The width of the brick. */
  width: number;
  /** The height of the brick. */
  height: number;
  /** The tier of the brick, determining its color and difficulty. */
  tier: number;
  /** The current health of the brick. */
  health: Decimal;
  /** The maximum health of the brick. */
  maxHealth: Decimal;
  /** The coin value awarded when the brick is destroyed. */
  value: Decimal;
  /** Timestamp of the last time the brick was hit, for visual effects. */
  lastHitTime?: number;
}

/**
 * Tracks the levels of global upgrades purchased by the player.
 */
export interface Upgrades {
  /** Level of the global speed upgrade. */
  speed: number;
  /** Level of the global damage upgrade. */
  damage: number;
  /** Level of the coin multiplier upgrade. */
  coinMult: number;
}

/**
 * The core state of the game, managed by the store.
 */
export interface GameState {
  /** The current amount of coins the player possesses. */
  coins: Decimal;
  /** The number of bricks broken in the current prestige run. */
  bricksBroken: Decimal;
  /** The total number of bricks broken across all runs. */
  totalBricksBroken: Decimal;
  /** The current prestige level, which grants permanent bonuses. */
  prestigeLevel: number;
  /** Current levels of purchased upgrades. */
  upgrades: Upgrades;
  /** Current cost to purchase the next ball of each type. */
  ballCosts: Record<BallType, Decimal>;
  /** Current cost to purchase the next level of each upgrade. */
  upgradeCosts: Record<keyof Upgrades, Decimal>;
  /** The current difficulty tier for newly spawned bricks. */
  currentTier: number;
  /** List of all active balls in the game. */
  balls: BallData[];
  /** Timestamp of the last save or update, used for offline earnings. */
  timestamp: number;
}

/**
 * Represents an active explosion effect in the game.
 */
export interface Explosion {
  /** The X coordinate of the explosion center. */
  x: number;
  /** The Y coordinate of the explosion center. */
  y: number;
  /** The maximum radius of the explosion effect. */
  radius: number;
  /** The remaining duration of the explosion in frames or time units. */
  life: number;
  /** The initial duration of the explosion. */
  maxLife: number;
}

/**
 * Interface representing the structure of the game save data.
 */
export interface SaveData {
  coins?: string;
  bricksBroken?: string;
  totalBricksBroken?: string;
  prestigeLevel?: number;
  upgrades?: Upgrades;
  ballCosts?: Record<string, string>;
  upgradeCosts?: Record<string, string>;
  currentTier?: number;
  balls?: BallType[];
  unlockedAchievements?: Record<string, number>;
  timestamp?: number;
  version?: number;
}

/**
 * Static configuration for all ball types.
 * Defines the stats and abilities for each ball type.
 */
export const BALL_TYPES: Record<BallType, BallTypeConfig> = {
  basic: {
    speed: 3,
    damage: 1,
    color: '#9ca3af',
    pierce: false,
    explosive: false,
    targeting: false,
    baseCost: 10,
    description: 'Standard ball',
  },
  fast: {
    speed: 6,
    damage: 1,
    color: '#60a5fa',
    pierce: false,
    explosive: false,
    targeting: false,
    baseCost: 30,
    description: '2x speed',
  },
  heavy: {
    speed: 2.5,
    damage: 3,
    color: '#f97316',
    pierce: false,
    explosive: false,
    targeting: false,
    baseCost: 100,
    description: '3x damage',
  },
  plasma: {
    speed: 4,
    damage: 2,
    color: '#a855f7',
    pierce: true,
    explosive: false,
    targeting: false,
    baseCost: 500,
    description: 'Pierces through bricks',
  },
  explosive: {
    speed: 3,
    damage: 2,
    color: '#ef4444',
    pierce: false,
    explosive: true,
    explosionRadius: 70,
    targeting: false,
    baseCost: 1000,
    description: 'Damages nearby bricks',
  },
  sniper: {
    speed: 5,
    damage: 5,
    color: '#10b981',
    pierce: false,
    explosive: false,
    targeting: true,
    baseCost: 3500,
    description: 'Targets weakest bricks',
  },
};

/** Multiplier applied to stats per upgrade level (10% boost). */
export const UPGRADE_MULTIPLIER = 0.1;
/** Damage and coin income are multiplied by this for every prestige level. */
export const PRESTIGE_MULTIPLIER = 1.75;
/** The fraction of theoretical earnings awarded for offline time (50%). */
export const OFFLINE_EARNINGS_RATE = 0.5;
/** The maximum tier level for bricks. */
export const MAX_TIER = 20;
/** The base threshold for the first prestige. */
export const PRESTIGE_THRESHOLD = 10000;


/**
 * Calculates the permanent coin multiplier for a prestige level.
 * Each level multiplies income, so prestiging repeatedly compounds.
 * @param prestigeLevel - The current prestige level.
 * @returns {number} The current coin multiplier.
 */
export const getPrestigeMultiplier = (prestigeLevel: number): number =>
  Math.pow(PRESTIGE_MULTIPLIER, prestigeLevel);

/** Maximum number of balls allowed in the game to prevent performance issues. */
export const MAX_BALLS = 50;

/** Maximum level for the speed upgrade to prevent physics tunneling. */
export const MAX_SPEED_UPGRADE = 50;

/** Maximum prestige level (no upper limit on bonuses, but caps progression). */
export const MAX_PRESTIGE_LEVEL = 100;

/** Cost scaling multiplier when purchasing balls or upgrades. */
export const COST_MULTIPLIER = 1.15;

/**
 * Calculates brick health and value based on tier.
 * Health grows slowly with tier (5.75x by tier 20) while value grows much
 * faster (120x), so a higher tier pays more for roughly the same work.
 */
export const calculateBrickStats = (tier: number): { maxHealth: Decimal; value: Decimal } => {
  const maxHealth = new Decimal(3 * (1 + 0.25 * (tier - 1)));
  const value = new Decimal(Math.floor(Math.pow(tier, 1.6)));
  return { maxHealth, value };
};
