/**
 * Achievement system types and definitions.
 *
 * Achievements are persistent, milestone-based unlocks the player can view in
 * a modal. Each achievement has a `condition(state)` predicate that the store
 * evaluates whenever the relevant state changes. Conditions are pure
 * functions so they can be exercised by unit tests without spinning up
 * Phaser or a full game session.
 */
import type Decimal from 'break_infinity.js';
import type { BallType, Upgrades } from './game';

/** Minimal shape of the game state needed to evaluate achievement conditions. */
export interface AchievementGameState {
  totalBricksBroken: Decimal;
  bricksBroken: Decimal;
  coins: Decimal;
  prestigeLevel: number;
  currentTier: number;
  balls: ReadonlyArray<{ type: BallType }>;
  upgrades: Upgrades;
}

/** A single achievement definition. */
export interface AchievementDef {
  /** Unique stable id (e.g. `first_brick`). */
  id: string;
  /** Short display name. */
  name: string;
  /** Longer description explaining how to unlock. */
  description: string;
  /** Icon key. Currently a single emoji for visual flair. */
  icon: string;
  /**
   * Pure predicate. Receives the current game state and returns true when
   * the achievement has been earned.
   */
  condition: (state: AchievementGameState) => boolean;
}

/** Map of all unlocked achievements: id → unlockedAt timestamp (ms). */
export type UnlockedAchievements = Record<string, number>;

/** Helper: count balls of a given type the player owns. */
const countBall = (state: AchievementGameState, type: BallType): number =>
  state.balls.filter((b) => b.type === type).length;

/** Helper: count balls the player has purchased total (lifetime). */
const totalBalls = (state: AchievementGameState): number => state.balls.length;

/**
 * Master list of all achievements. The order in this array is the display
 * order in the AchievementsModal (locked & unlocked both render in this
 * order, with unlocked entries shown first within their tier).
 */
export const ACHIEVEMENTS: ReadonlyArray<AchievementDef> = [
  {
    id: 'first_brick',
    name: 'Breaking In',
    description: 'Break your first brick.',
    icon: '🧱',
    condition: (s) => s.totalBricksBroken.gte(1),
  },
  {
    id: 'hundred_bricks',
    name: 'Centurion',
    description: 'Break 100 bricks in total.',
    icon: '💯',
    condition: (s) => s.totalBricksBroken.gte(100),
  },
  {
    id: 'thousand_bricks',
    name: 'Brickstorm',
    description: 'Break 1,000 bricks in total.',
    icon: '🌪️',
    condition: (s) => s.totalBricksBroken.gte(1000),
  },
  {
    id: 'ten_thousand_bricks',
    name: 'Master Mason',
    description: 'Break 10,000 bricks in total.',
    icon: '🏛️',
    condition: (s) => s.totalBricksBroken.gte(10000),
  },
  {
    id: 'first_prestige',
    name: 'A New Beginning',
    description: 'Prestige for the first time.',
    icon: '✨',
    condition: (s) => s.prestigeLevel >= 1,
  },
  {
    id: 'three_prestiges',
    name: 'Loop Veteran',
    description: 'Reach prestige level 3.',
    icon: '🔁',
    condition: (s) => s.prestigeLevel >= 3,
  },
  {
    id: 'first_purchase',
    name: 'Shopper',
    description: 'Buy your first ball.',
    icon: '🛒',
    condition: (s) => totalBalls(s) >= 2,
  },
  {
    id: 'buy_fast',
    name: 'Need For Speed',
    description: 'Own a Fast ball.',
    icon: '⚡',
    condition: (s) => countBall(s, 'fast') >= 1,
  },
  {
    id: 'buy_heavy',
    name: 'Heavy Hitter',
    description: 'Own a Heavy ball.',
    icon: '🔨',
    condition: (s) => countBall(s, 'heavy') >= 1,
  },
  {
    id: 'buy_plasma',
    name: 'Ionized',
    description: 'Own a Plasma ball.',
    icon: '🔵',
    condition: (s) => countBall(s, 'plasma') >= 1,
  },
  {
    id: 'buy_explosive',
    name: 'Boom Box',
    description: 'Own an Explosive ball.',
    icon: '💥',
    condition: (s) => countBall(s, 'explosive') >= 1,
  },
  {
    id: 'buy_sniper',
    name: 'Deadly Precision',
    description: 'Own a Sniper ball.',
    icon: '🎯',
    condition: (s) => countBall(s, 'sniper') >= 1,
  },
  {
    id: 'tier_5',
    name: 'Tier V',
    description: 'Reach tier 5.',
    icon: '🥉',
    condition: (s) => s.currentTier >= 5,
  },
  {
    id: 'tier_10',
    name: 'Tier X',
    description: 'Reach tier 10.',
    icon: '🥈',
    condition: (s) => s.currentTier >= 10,
  },
  {
    id: 'tier_20',
    name: 'Tier XX',
    description: 'Reach the maximum tier 20.',
    icon: '🥇',
    condition: (s) => s.currentTier >= 20,
  },
  {
    id: 'first_upgrade',
    name: 'Power Up',
    description: 'Buy your first upgrade.',
    icon: '⬆️',
    condition: (s) =>
      s.upgrades.speed + s.upgrades.damage + s.upgrades.coinMult >= 1,
  },
  {
    id: 'max_speed',
    name: 'Lightspeed',
    description: 'Max out the Speed upgrade.',
    icon: '🚀',
    condition: (s) => s.upgrades.speed >= 50,
  },
  {
    id: 'max_damage',
    name: 'One Punch',
    description: 'Reach 50 damage upgrades.',
    icon: '👊',
    condition: (s) => s.upgrades.damage >= 50,
  },
];

/** O(1) lookup of achievement definitions by id. */
export const ACHIEVEMENTS_BY_ID: Readonly<Record<string, AchievementDef>> =
  Object.freeze(
    ACHIEVEMENTS.reduce<Record<string, AchievementDef>>((acc, a) => {
      acc[a.id] = a;
      return acc;
    }, {}),
  );

/** Initial unlocked-achievements map: empty (no unlocks yet). */
export const getEmptyUnlocks = (): UnlockedAchievements => ({});

/**
 * Evaluates every achievement condition against the given state and returns
 * the ids of those whose conditions are now true. Caller is responsible for
 * merging these into the store's `unlockedAchievements` map.
 */
export const evaluateAchievements = (
  state: AchievementGameState,
  alreadyUnlocked: UnlockedAchievements,
): string[] => {
  const newlyUnlocked: string[] = [];
  for (const def of ACHIEVEMENTS) {
    if (alreadyUnlocked[def.id]) continue;
    if (def.condition(state)) {
      newlyUnlocked.push(def.id);
    }
  }
  return newlyUnlocked;
};
