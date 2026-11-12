import { describe, it, expect } from 'vitest'
import { FIXED_STEP, MAX_CATCH_UP_STEPS, clampAccumulator, clampFrameDelta } from '../../src/game/constants'

describe('clampAccumulator', () => {
  it('accumulates normal frame time', () => {
    expect(clampAccumulator(0, 16)).toBe(16)
    expect(clampAccumulator(3, 5)).toBe(8)
  })

  it('runs at most the catch-up budget after a stall', () => {
    let accumulator = clampAccumulator(0, 10_000)
    let steps = 0
    while (accumulator >= FIXED_STEP) {
      accumulator -= FIXED_STEP
      steps++
    }

    expect(steps).toBe(MAX_CATCH_UP_STEPS)
    expect(accumulator).toBeLessThan(FIXED_STEP)
    expect(clampFrameDelta(10_000)).toBe(FIXED_STEP * MAX_CATCH_UP_STEPS)
  })

  it('drops time beyond the catch-up budget', () => {
    expect(clampAccumulator(0, 10_000)).toBe(FIXED_STEP * MAX_CATCH_UP_STEPS)
    expect(clampAccumulator(FIXED_STEP * MAX_CATCH_UP_STEPS, 16)).toBe(
      FIXED_STEP * MAX_CATCH_UP_STEPS
    )
  })
})
