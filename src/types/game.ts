import Decimal from 'break_infinity.js';

export type BallType = 'basic' | 'fast' | 'heavy' | 'plasma' | 'explosive' | 'sniper';

export interface BallTypeConfig {
  speed: number;
  damage: number;
  color: string;
  pierce: boolean;
  explosive: boolean;
  explosionRadius?: number;
  targeting: boolean;
  baseCost: number;
  description: string;
}

export interface BallData {
  id: string;
  type: BallType;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface BrickData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tier: number;
  health: Decimal;
  maxHealth: Decimal;
  value: Decimal;
}

export interface Upgrades {
  speed: number;
  damage: number;
  coinMult: number;
}

export interface GameState {
  coins: Decimal;
  bricksBroken: Decimal;
  totalBricksBroken: Decimal;
  prestigeLevel: number;
  upgrades: Upgrades;
  ballCosts: Record<BallType, Decimal>;
  upgradeCosts: Record<keyof Upgrades, Decimal>;
  currentTier: number;
  balls: BallData[];
  timestamp: number;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

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

export const UPGRADE_MULTIPLIER = 0.1; // 10% boost per upgrade level
export const PRESTIGE_BONUS = 0.25; // 25% bonus per prestige level
export const OFFLINE_EARNINGS_RATE = 0.5; // 50% of theoretical earnings while offline
export const MAX_TIER = 20;
export const PRESTIGE_THRESHOLDS = [10000, 20000, 40000];
export const PRESTIGE_THRESHOLD = PRESTIGE_THRESHOLDS[0];
export const getPrestigeThreshold = (prestigeLevel: number): number => {
  const index = Math.min(prestigeLevel, PRESTIGE_THRESHOLDS.length - 1);
  return PRESTIGE_THRESHOLDS[index];
};
