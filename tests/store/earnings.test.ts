import { describe, it, expect } from 'vitest'
import { calculateOfflineEarnings } from '../../src/store/earnings'
import type { BallData } from '../../src/types'

const createBall = (type: BallData['type']): BallData => ({
  id: 'ball-1',
  type,
  x: 0,
  y: 0,
  dx: 1,
  dy: 0,
})

describe('calculateOfflineEarnings', () => {
  it('should clamp negative offline time to zero earnings', () => {
    const result = calculateOfflineEarnings(
      [createBall('basic')],
      1,
      1,
      1,
      0,
      1,
      -120
    )

    expect(result.coins.eq(0)).toBe(true)
    expect(result.message).toBeNull()
  })

  it('should count prestige damage and coins while bricks take multiple hits', () => {
    const balls = [createBall('basic')]
    const base = calculateOfflineEarnings(balls, 1, 1, 1, 0, 1, 3600).coins.toNumber()
    // prestige 1: damage 1.75 -> 2 hits instead of 3 (1.5x rate), coins 1.75x
    const prestiged = calculateOfflineEarnings(balls, 1, 1.75, 1, 1, 1, 3600).coins.toNumber()
    expect(prestiged).toBeCloseTo(base * 1.5 * 1.75, 0)
  })

  it('should stop paying damage once a ball one-shots a brick', () => {
    const balls = [createBall('basic')]
    const tier20 = 20
    const level19 = calculateOfflineEarnings(balls, 1, 1.75 ** 19, 1, 19, tier20, 3600).coins.toNumber()
    const level20 = calculateOfflineEarnings(balls, 1, 1.75 ** 20, 1, 20, tier20, 3600).coins.toNumber()
    expect(level20 / level19).toBeCloseTo(1.75, 2)
  })

  it('should follow the value/health yield at higher tiers', () => {
    const tier1 = calculateOfflineEarnings([createBall('basic')], 1, 1, 1, 0, 1, 3600).coins.toNumber()
    const tier20 = calculateOfflineEarnings([createBall('basic')], 1, 1, 1, 0, 20, 3600).coins.toNumber()
    // tier 20: health 17.25 -> 18 hits, value 120 -> 120/6 of tier 1
    expect(tier20 / tier1).toBeCloseTo(120 / 6)
  })

  it('should format large offline earnings in the welcome-back message', () => {
    const result = calculateOfflineEarnings(
      [createBall('basic')],
      100,
      100,
      100,
      0,
      20,
      3600
    )

    expect(result.coins.gt(0)).toBe(true)
    expect(result.message).toContain('Welcome back!')
    expect(result.message).toContain('M')
  })
})