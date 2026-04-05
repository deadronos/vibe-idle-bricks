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