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

  it('should apply the prestige bonus exactly once', () => {
    const balls = [createBall('basic')]
    const base = calculateOfflineEarnings(balls, 1, 1, 1, 0, 1, 60).coins.toNumber()
    const prestiged = calculateOfflineEarnings(balls, 1, 1, 1, 1, 1, 60).coins.toNumber()
    expect(prestiged).toBeCloseTo(base * 1.75)
  })

  it('should follow the value/health yield at higher tiers', () => {
    const tier1 = calculateOfflineEarnings([createBall('basic')], 1, 1, 1, 0, 1, 3600).coins.toNumber()
    const tier20 = calculateOfflineEarnings([createBall('basic')], 1, 1, 1, 0, 20, 3600).coins.toNumber()
    // value 120, health 17.25 -> 120*3/17.25
    expect(tier20 / tier1).toBeCloseTo((120 * 3) / 17.25, 2)
  })

  it('should format large offline earnings in the welcome-back message', () => {
    const result = calculateOfflineEarnings(
      [createBall('basic')],
      100,
      100,
      100,
      0,
      1,
      60
    )

    expect(result.coins.gt(0)).toBe(true)
    expect(result.message).toContain('Welcome back!')
    expect(result.message).toContain('M')
  })
})