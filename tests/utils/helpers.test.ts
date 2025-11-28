import { describe, it, expect } from 'vitest'
import Decimal from 'break_infinity.js'
import { generateId, formatNumber, adjustBrightness, getTierColor } from '../../src/utils/helpers'

describe('generateId', () => {
  it('should generate a string ID', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })

  it('should generate IDs of length 9', () => {
    const id = generateId()
    expect(id.length).toBe(9)
  })

  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(1000)
  })

  it('should only contain alphanumeric characters', () => {
    const id = generateId()
    expect(id).toMatch(/^[a-z0-9]+$/)
  })
})

describe('formatNumber', () => {
  describe('with regular numbers', () => {
    it('should format small numbers without suffix', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(1)).toBe('1')
      expect(formatNumber(999)).toBe('999')
    })

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.00K')
      expect(formatNumber(1500)).toBe('1.50K')
      expect(formatNumber(999999)).toBe('1000.00K')
    })

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.00M')
      expect(formatNumber(1500000)).toBe('1.50M')
      expect(formatNumber(999999999)).toBe('1000.00M')
    })

    it('should format billions with B suffix', () => {
      expect(formatNumber(1000000000)).toBe('1.00B')
      expect(formatNumber(1500000000)).toBe('1.50B')
    })

    it('should use exponential notation for trillions and above', () => {
      const result = formatNumber(1e12)
      expect(result).toMatch(/^1\.00e\+?12$/)
    })
  })

  describe('with Decimal numbers', () => {
    it('should format Decimal small numbers', () => {
      expect(formatNumber(new Decimal(500))).toBe('500')
    })

    it('should format Decimal thousands', () => {
      expect(formatNumber(new Decimal(5000))).toBe('5.00K')
    })

    it('should format Decimal millions', () => {
      expect(formatNumber(new Decimal(5000000))).toBe('5.00M')
    })

    it('should format Decimal billions', () => {
      expect(formatNumber(new Decimal(5000000000))).toBe('5.00B')
    })

    it('should handle very large Decimal numbers', () => {
      const result = formatNumber(new Decimal('1e100'))
      expect(result).toMatch(/e\+?100/)
    })
  })

  it('should floor decimal parts for small numbers', () => {
    expect(formatNumber(123.999)).toBe('123')
    expect(formatNumber(new Decimal(456.789))).toBe('456')
  })
})

describe('adjustBrightness', () => {
  it('should increase brightness with positive percent', () => {
    const result = adjustBrightness('#000000', 50)
    // Black with increased brightness should have non-zero RGB values
    expect(result).not.toBe('#000000')
  })

  it('should decrease brightness with negative percent', () => {
    const result = adjustBrightness('#ffffff', -50)
    // White with decreased brightness should have lower RGB values
    expect(result).not.toBe('#ffffff')
  })

  it('should return valid hex color', () => {
    const result = adjustBrightness('#ff5500', 20)
    expect(result).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('should clamp values to valid RGB range', () => {
    // Max brightness on white should still be valid
    const maxBright = adjustBrightness('#ffffff', 100)
    expect(maxBright).toBe('#ffffff')

    // Min brightness on black should still be valid
    const minBright = adjustBrightness('#000000', -100)
    expect(minBright).toBe('#000000')
  })

  it('should handle colors without # prefix', () => {
    const result = adjustBrightness('ff5500', 0)
    expect(result).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('getTierColor', () => {
  it('should return green for tier 1', () => {
    expect(getTierColor(1)).toBe('#4ade80')
  })

  it('should return blue for tier 2', () => {
    expect(getTierColor(2)).toBe('#60a5fa')
  })

  it('should return different colors for different tiers', () => {
    const colors = new Set<string>()
    for (let tier = 1; tier <= 10; tier++) {
      colors.add(getTierColor(tier))
    }
    // Should have at least 9 unique colors (some might repeat at high tiers)
    expect(colors.size).toBeGreaterThanOrEqual(9)
  })

  it('should handle tier 10 and above', () => {
    const tier10 = getTierColor(10)
    const tier11 = getTierColor(11)
    const tier100 = getTierColor(100)
    
    // High tiers should return the last color
    expect(tier10).toBe('#fbbf24')
    expect(tier11).toBe('#fbbf24')
    expect(tier100).toBe('#fbbf24')
  })

  it('should return valid hex colors', () => {
    for (let tier = 1; tier <= 15; tier++) {
      expect(getTierColor(tier)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
