import { describe, it, expect } from 'vitest'
import {
  BALL_TYPES,
  UPGRADE_MULTIPLIER,
  PRESTIGE_BONUS,
  OFFLINE_EARNINGS_RATE,
  PRESTIGE_THRESHOLD,
  PRESTIGE_THRESHOLDS,
  MAX_TIER,
  getPrestigeThreshold,
} from '../../src/types/game'
import type { BallType } from '../../src/types/game'

describe('BALL_TYPES', () => {
  const ballTypes: BallType[] = ['basic', 'fast', 'heavy', 'plasma', 'explosive', 'sniper']

  it('should have all expected ball types', () => {
    for (const type of ballTypes) {
      expect(BALL_TYPES[type]).toBeDefined()
    }
  })

  describe.each(ballTypes)('%s ball type', (type) => {
    it('should have required properties', () => {
      const config = BALL_TYPES[type]
      expect(config.speed).toBeTypeOf('number')
      expect(config.damage).toBeTypeOf('number')
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(config.pierce).toBeTypeOf('boolean')
      expect(config.explosive).toBeTypeOf('boolean')
      expect(config.targeting).toBeTypeOf('boolean')
      expect(config.baseCost).toBeTypeOf('number')
      expect(config.description).toBeTypeOf('string')
    })

    it('should have positive speed and damage', () => {
      const config = BALL_TYPES[type]
      expect(config.speed).toBeGreaterThan(0)
      expect(config.damage).toBeGreaterThan(0)
    })

    it('should have positive base cost', () => {
      expect(BALL_TYPES[type].baseCost).toBeGreaterThan(0)
    })
  })

  describe('ball type special abilities', () => {
    it('basic ball should have no special abilities', () => {
      expect(BALL_TYPES.basic.pierce).toBe(false)
      expect(BALL_TYPES.basic.explosive).toBe(false)
      expect(BALL_TYPES.basic.targeting).toBe(false)
    })

    it('fast ball should be faster than basic', () => {
      expect(BALL_TYPES.fast.speed).toBeGreaterThan(BALL_TYPES.basic.speed)
    })

    it('heavy ball should deal more damage than basic', () => {
      expect(BALL_TYPES.heavy.damage).toBeGreaterThan(BALL_TYPES.basic.damage)
    })

    it('plasma ball should have pierce ability', () => {
      expect(BALL_TYPES.plasma.pierce).toBe(true)
    })

    it('explosive ball should have explosive ability and radius', () => {
      expect(BALL_TYPES.explosive.explosive).toBe(true)
      expect(BALL_TYPES.explosive.explosionRadius).toBeGreaterThan(0)
    })

    it('sniper ball should have targeting ability', () => {
      expect(BALL_TYPES.sniper.targeting).toBe(true)
    })
  })

  describe('ball costs progression', () => {
    it('should have increasing base costs for more powerful balls', () => {
      expect(BALL_TYPES.basic.baseCost).toBeLessThan(BALL_TYPES.fast.baseCost)
      expect(BALL_TYPES.fast.baseCost).toBeLessThan(BALL_TYPES.heavy.baseCost)
      expect(BALL_TYPES.heavy.baseCost).toBeLessThan(BALL_TYPES.plasma.baseCost)
      expect(BALL_TYPES.plasma.baseCost).toBeLessThan(BALL_TYPES.explosive.baseCost)
      expect(BALL_TYPES.explosive.baseCost).toBeLessThan(BALL_TYPES.sniper.baseCost)
    })
  })

  describe('balance adjustments', () => {
    it('fast ball should cost 30 coins', () => {
      expect(BALL_TYPES.fast.baseCost).toBe(30)
    })

    it('sniper ball should cost 3500 coins', () => {
      expect(BALL_TYPES.sniper.baseCost).toBe(3500)
    })

    it('explosive ball should have 70px radius', () => {
      expect(BALL_TYPES.explosive.explosionRadius).toBe(70)
    })
  })
})

describe('Game Constants', () => {
  describe('MAX_TIER', () => {
    it('should extend tier cap to 20', () => {
      expect(MAX_TIER).toBe(20)
    })
  })

  describe('UPGRADE_MULTIPLIER', () => {
    it('should be 0.1 (10% per level)', () => {
      expect(UPGRADE_MULTIPLIER).toBe(0.1)
    })
  })

  describe('PRESTIGE_BONUS', () => {
    it('should be 0.25 (25% per prestige)', () => {
      expect(PRESTIGE_BONUS).toBe(0.25)
    })
  })

  describe('OFFLINE_EARNINGS_RATE', () => {
    it('should be 0.5 (50% of normal earnings)', () => {
      expect(OFFLINE_EARNINGS_RATE).toBe(0.5)
    })

    it('should be between 0 and 1', () => {
      expect(OFFLINE_EARNINGS_RATE).toBeGreaterThan(0)
      expect(OFFLINE_EARNINGS_RATE).toBeLessThanOrEqual(1)
    })
  })

  describe('PRESTIGE_THRESHOLD', () => {
    it('should be 10000 bricks', () => {
      expect(PRESTIGE_THRESHOLD).toBe(10000)
    })

    it('should be a positive integer', () => {
      expect(PRESTIGE_THRESHOLD).toBeGreaterThan(0)
      expect(Number.isInteger(PRESTIGE_THRESHOLD)).toBe(true)
    })
  })

  describe('PRESTIGE_THRESHOLDS', () => {
    it('should define the scaling thresholds', () => {
      expect(PRESTIGE_THRESHOLDS).toEqual([10000, 20000, 40000])
    })
  })

  describe('getPrestigeThreshold', () => {
    it('should clamp levels beyond defined thresholds', () => {
      expect(getPrestigeThreshold(0)).toBe(10000)
      expect(getPrestigeThreshold(1)).toBe(20000)
      expect(getPrestigeThreshold(2)).toBe(40000)
      expect(getPrestigeThreshold(5)).toBe(40000)
    })
  })
})
