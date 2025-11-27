import type { GameConfig } from '../types';

/**
 * Game configuration constants
 * Designed to handle 1,000,000 bricks (1000x1000 grid)
 */
export const GAME_CONFIG: GameConfig = {
  // Brick dimensions
  brickWidth: 60,
  brickHeight: 20,
  brickGap: 2,
  
  // Chunk system (for viewport-based rendering)
  chunkSize: 10,           // 10x10 bricks per chunk
  
  // Grid dimensions (1000 x 1000 = 1,000,000 bricks)
  gridWidth: 1000,
  gridHeight: 1000,
  
  // Canvas dimensions
  canvasWidth: 800,
  canvasHeight: 600,
};

// Ball configuration
export const BALL_CONFIG = {
  radius: 8,
  initialSpeed: 200,
  maxSpeed: 1000,
  speedUpgradeAmount: 25,
  damageUpgradeMultiplier: 1.5,
  baseDamage: 1,
  baseColor: 0xffffff,
};

// Brick configuration
export const BRICK_CONFIG = {
  baseHealth: 10,
  healthMultiplier: 1.5,      // Health increases per row/tier
  baseReward: 1,
  rewardMultiplier: 1.3,      // Reward increases per row/tier
  
  // Tier colors (based on health tier)
  tierColors: [
    0x4ade80,  // Green - Tier 0
    0x22d3ee,  // Cyan - Tier 1
    0x3b82f6,  // Blue - Tier 2
    0xa855f7,  // Purple - Tier 3
    0xf43f5e,  // Red - Tier 4
    0xfbbf24,  // Yellow - Tier 5
    0xf97316,  // Orange - Tier 6
    0xec4899,  // Pink - Tier 7
    0x8b5cf6,  // Violet - Tier 8
    0xffffff,  // White - Tier 9+
  ],
};

// Upgrade costs configuration
export const UPGRADE_CONFIG = {
  damage: {
    baseCost: 10,
    costMultiplier: 1.15,
  },
  speed: {
    baseCost: 25,
    costMultiplier: 1.20,
  },
  count: {
    baseCost: 100,
    costMultiplier: 2.0,
  },
};

// Physics configuration
export const PHYSICS_CONFIG = {
  worldBoundsBuffer: 50,       // Extra space around the visible area
  ballBounceVelocityVariance: 0.05, // Slight randomness to prevent stuck balls
};

// Camera/Viewport configuration
export const VIEWPORT_CONFIG = {
  panSpeed: 500,               // Pixels per second
  zoomMin: 0.5,
  zoomMax: 2.0,
  zoomStep: 0.1,
  chunkLoadBuffer: 1,          // Load chunks this many chunks outside viewport
};

// UI configuration
export const UI_CONFIG = {
  hudHeight: 120,
  upgradeButtonWidth: 150,
  upgradeButtonHeight: 60,
  statsUpdateInterval: 100,    // ms between UI updates
};

// Save/Load configuration
export const SAVE_CONFIG = {
  autoSaveInterval: 30000,     // Auto-save every 30 seconds
  localStorageKey: 'idle-breakout-save',
};
