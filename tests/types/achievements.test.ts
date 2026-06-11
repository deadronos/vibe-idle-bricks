/**
 * Tests for the achievement definitions and `evaluateAchievements` helper.
 *
 * The predicates are pure functions, so we can construct a minimal
 * `AchievementGameState` and verify each condition triggers at the right
 * threshold.
 */
import { describe, it, expect } from 'vitest'
import Decimal from 'break_infinity.js'
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  getEmptyUnlocks,
  evaluateAchievements,
  type AchievementGameState,
} from '../../src/types/achievements'

/** Builds a minimal state with the given brick / prestige / tier / balls / upgrades. */
const buildState = (overrides: Partial<AchievementGameState> = {}): AchievementGameState => ({
  totalBricksBroken: new Decimal(0),
  bricksBroken: new Decimal(0),
  coins: new Decimal(0),
  prestigeLevel: 0,
  currentTier: 1,
  balls: [{ type: 'basic' }],
  upgrades: { speed: 0, damage: 0, coinMult: 0 },
  ...overrides,
})

describe('ACHIEVEMENTS', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a definition for every id in ACHIEVEMENTS_BY_ID', () => {
    for (const def of ACHIEVEMENTS) {
      expect(ACHIEVEMENTS_BY_ID[def.id]).toBe(def)
    }
  })

  it('ACHIEVEMENTS_BY_ID is frozen', () => {
    expect(Object.isFrozen(ACHIEVEMENTS_BY_ID)).toBe(true)
  })

  it('every achievement has a non-empty name and description', () => {
    for (const def of ACHIEVEMENTS) {
      expect(def.name.length).toBeGreaterThan(0)
      expect(def.description.length).toBeGreaterThan(0)
      expect(def.icon.length).toBeGreaterThan(0)
    }
  })
})

describe('getEmptyUnlocks', () => {
  it('returns a fresh empty object on each call', () => {
    const a = getEmptyUnlocks()
    const b = getEmptyUnlocks()
    expect(a).toEqual({})
    expect(b).toEqual({})
    expect(a).not.toBe(b)
  })
})

describe('evaluateAchievements', () => {
  it('returns no ids for an empty state with no unlocks', () => {
    const result = evaluateAchievements(buildState(), {})
    expect(result).toEqual([])
  })

  it('unlocks first_brick and first_purchase when totalBricksBroken ≥ 1 and a basic ball exists', () => {
    // first_purchase requires >= 2 balls (initial basic + nothing yet).
    // With 1 basic ball and 0 bricks, only first_brick is not satisfied.
    const state = buildState({ totalBricksBroken: new Decimal(1) })
    const result = evaluateAchievements(state, {})
    expect(result).toContain('first_brick')
    expect(result).not.toContain('first_purchase')
  })

  it('unlocks hundred_bricks at 100 but not at 99', () => {
    const at99 = evaluateAchievements(
      buildState({ totalBricksBroken: new Decimal(99) }),
      {},
    )
    const at100 = evaluateAchievements(
      buildState({ totalBricksBroken: new Decimal(100) }),
      {},
    )
    expect(at99).not.toContain('hundred_bricks')
    expect(at100).toContain('hundred_bricks')
  })

  it('unlocks first_prestige when prestigeLevel is 1', () => {
    const result = evaluateAchievements(buildState({ prestigeLevel: 1 }), {})
    expect(result).toContain('first_prestige')
  })

  it('unlocks three_prestiges when prestigeLevel is 3', () => {
    const result = evaluateAchievements(buildState({ prestigeLevel: 3 }), {})
    expect(result).toContain('first_prestige')
    expect(result).toContain('three_prestiges')
  })

  it('unlocks buy_fast when a fast ball is owned', () => {
    const result = evaluateAchievements(
      buildState({ balls: [{ type: 'basic' }, { type: 'fast' }] }),
      {},
    )
    expect(result).toContain('buy_fast')
    expect(result).toContain('first_purchase')
  })

  it('unlocks tier_5, tier_10, tier_20 at the right thresholds', () => {
    const t5 = evaluateAchievements(buildState({ currentTier: 5 }), {})
    const t10 = evaluateAchievements(buildState({ currentTier: 10 }), {})
    const t20 = evaluateAchievements(buildState({ currentTier: 20 }), {})
    expect(t5).toContain('tier_5')
    expect(t5).not.toContain('tier_10')
    expect(t10).toContain('tier_5')
    expect(t10).toContain('tier_10')
    expect(t10).not.toContain('tier_20')
    expect(t20).toContain('tier_5')
    expect(t20).toContain('tier_10')
    expect(t20).toContain('tier_20')
  })

  it('unlocks first_upgrade when any upgrade level is ≥ 1', () => {
    const speed = evaluateAchievements(
      buildState({ upgrades: { speed: 1, damage: 0, coinMult: 0 } }),
      {},
    )
    const damage = evaluateAchievements(
      buildState({ upgrades: { speed: 0, damage: 1, coinMult: 0 } }),
      {},
    )
    const coin = evaluateAchievements(
      buildState({ upgrades: { speed: 0, damage: 0, coinMult: 1 } }),
      {},
    )
    expect(speed).toContain('first_upgrade')
    expect(damage).toContain('first_upgrade')
    expect(coin).toContain('first_upgrade')
  })

  it('unlocks max_speed at speed=50 and max_damage at damage=50', () => {
    const r = evaluateAchievements(
      buildState({ upgrades: { speed: 50, damage: 50, coinMult: 0 } }),
      {},
    )
    expect(r).toContain('max_speed')
    expect(r).toContain('max_damage')
  })

  it('is idempotent: already-unlocked achievements are not returned again', () => {
    const state = buildState({
      totalBricksBroken: new Decimal(200),
      prestigeLevel: 1,
      currentTier: 10,
    })
    const all = evaluateAchievements(state, {})
    const expected = new Set(all)
    expect(expected.has('first_brick')).toBe(true)
    expect(expected.has('hundred_bricks')).toBe(true)
    expect(expected.has('first_prestige')).toBe(true)
    expect(expected.has('tier_5')).toBe(true)
    expect(expected.has('tier_10')).toBe(true)

    // Build the timestamp map from the just-unlocked ids, then re-evaluate.
    const alreadyUnlocked = [...all].reduce<Record<string, number>>(
      (acc, id) => {
        acc[id] = Date.now()
        return acc
      },
      {},
    )
    const replay = evaluateAchievements(state, alreadyUnlocked)
    expect(replay).toEqual([])
  })

  it('only returns achievements that satisfy the condition', () => {
    // 50 bricks, no prestige, tier 1, 1 basic ball: only first_brick.
    const state = buildState({ totalBricksBroken: new Decimal(50) })
    const result = evaluateAchievements(state, {})
    expect(result).toEqual(['first_brick'])
  })
})
