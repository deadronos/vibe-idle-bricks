import { describe, it, expect } from 'vitest'
import { calculateIncomePerSecond, calculateOfflineEarnings, MAX_OFFLINE_SECONDS } from '../../src/store/earnings'
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

  it('should stop earning after the offline cap', () => {
    const args: [BallData[], number, number, number, number, number] = [
      [createBall('basic')], 1, 1, 1, 0, 1,
    ]
    const atCap = calculateOfflineEarnings(...args, MAX_OFFLINE_SECONDS)
    const afterCap = calculateOfflineEarnings(...args, MAX_OFFLINE_SECONDS * 10)

    expect(afterCap.coins.eq(atCap.coins)).toBe(true)
    expect(afterCap.message).toContain('24h (max)')
  })

  it('should state the credited duration in the welcome-back message', () => {
    const result = calculateOfflineEarnings(
      [createBall('basic')],
      1,
      1,
      1,
      0,
      1,
      2 * 3600 + 5 * 60
    )

    expect(result.message).toContain('over 2h 5m')
  })

  it('should format short and whole-hour absences', () => {
    const args: [BallData[], number, number, number, number, number] = [
      [createBall('basic')], 1, 1, 1, 0, 1,
    ]

    expect(calculateOfflineEarnings(...args, 90).message).toContain('over 1m')
    expect(calculateOfflineEarnings(...args, 3 * 3600).message).toContain('over 3h')
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

  it('should pin tier 1 income to the live rate', () => {
    // basic ball: 3 hits per brick, value 1, 50% offline -> 0.05 coins/s
    const result = calculateOfflineEarnings([createBall('basic')], 1, 1, 1, 0, 1, 3600)
    expect(result.coins.toNumber()).toBe(90)
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
describe('calculateIncomePerSecond', () => {
  it('returns nominal income for a basic ball at tier 1', () => {
    expect(calculateIncomePerSecond([createBall('basic')], 1, 1, 1, 0, 1).toNumber()).toBe(1)
  })

  it('scales with coin and prestige multipliers', () => {
    const base = calculateIncomePerSecond([createBall('basic')], 1, 1, 1, 0, 1)
    const boosted = calculateIncomePerSecond([createBall('basic')], 1, 1, 2, 1, 1)

    expect(boosted.div(base).toNumber()).toBeCloseTo(3.5, 10)
  })

  it('caps extra damage at the hits a brick actually needs', () => {
    const enough = calculateIncomePerSecond([createBall('basic')], 1, 100, 1, 0, 20)
    const overkill = calculateIncomePerSecond([createBall('basic')], 1, 1000, 1, 0, 20)

    expect(overkill.eq(enough)).toBe(true)
  })
})
