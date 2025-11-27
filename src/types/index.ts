import Decimal from 'break_infinity.js';

// Ball types and upgrades
export interface BallStats {
  damage: Decimal;
  speed: number;
  count: number;
}

export interface BallUpgradeCosts {
  damage: Decimal;
  speed: Decimal;
  count: Decimal;
}

// Brick data structure
export interface BrickData {
  id: string;
  x: number;       // Grid position X
  y: number;       // Grid position Y
  health: Decimal;
  maxHealth: Decimal;
  reward: Decimal;
  destroyed: boolean;
  tier: number;    // Visual tier based on health
}

// Chunk system for viewport rendering
export interface ChunkData {
  chunkX: number;
  chunkY: number;
  bricks: BrickData[];
}

// Viewport boundaries
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Game configuration constants
export interface GameConfig {
  brickWidth: number;
  brickHeight: number;
  brickGap: number;
  chunkSize: number;        // Bricks per chunk (width/height)
  gridWidth: number;        // Total bricks horizontally
  gridHeight: number;       // Total bricks vertically
  canvasWidth: number;
  canvasHeight: number;
}

// Save data structure
export interface SaveData {
  money: string;            // Serialized Decimal
  ballStats: {
    damage: string;
    speed: number;
    count: number;
  };
  upgradeCosts: {
    damage: string;
    speed: string;
    count: string;
  };
  destroyedBricks: string[]; // Array of brick IDs that are destroyed
  cameraPosition: { x: number; y: number };
  totalBricksDestroyed: number;
}

// Phaser scene event types
export type GameEventType = 
  | 'brick-destroyed'
  | 'money-gained'
  | 'ball-spawned'
  | 'viewport-changed';

export interface GameEvent {
  type: GameEventType;
  payload?: unknown;
}
