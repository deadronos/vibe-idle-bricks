import { describe, it, expect } from 'vitest';
import {
  BALL_TYPES,
  UPGRADE_MULTIPLIER,
  PRESTIGE_BONUS,
  OFFLINE_EARNINGS_RATE,
  MAX_TIER,
  PRESTIGE_THRESHOLDS,
  getPrestigeThreshold,
} from '../../src/types/game';

describe('Ball Types Configuration', () => {
  it('should have all expected ball types', () => {
    const expectedTypes = ['basic', 'fast', 'heavy', 'plasma', 'explosive', 'sniper'];
    expect(Object.keys(BALL_TYPES)).toEqual(expect.arrayContaining(expectedTypes));
  });

  describe('Individual Ball Configs', () => {
    Object.entries(BALL_TYPES).forEach(([type, config]) => {
      describe(`${type} ball`, () => {
        it('should have required properties', () => {
          expect(config).toHaveProperty('speed');
          expect(config).toHaveProperty('damage');
          expect(config).toHaveProperty('color');
          expect(config).toHaveProperty('pierce');
          expect(config).toHaveProperty('explosive');
          expect(config).toHaveProperty('targeting');
          expect(config).toHaveProperty('baseCost');
          expect(config).toHaveProperty('description');
        });

        it('should have positive speed and damage', () => {
          expect(config.speed).toBeGreaterThan(0);
          expect(config.damage).toBeGreaterThan(0);
        });

        it('should have positive base cost', () => {
          expect(config.baseCost).toBeGreaterThan(0);
        });
      });
    });

    it('basic ball should have no special abilities', () => {
      const basic = BALL_TYPES.basic;
      expect(basic.pierce).toBe(false);
      expect(basic.explosive).toBe(false);
      expect(basic.targeting).toBe(false);
    });

    it('fast ball should be faster than basic', () => {
      expect(BALL_TYPES.fast.speed).toBeGreaterThan(BALL_TYPES.basic.speed);
    });

    it('heavy ball should deal more damage than basic', () => {
      expect(BALL_TYPES.heavy.damage).toBeGreaterThan(BALL_TYPES.basic.damage);
    });

    it('plasma ball should have pierce ability', () => {
      expect(BALL_TYPES.plasma.pierce).toBe(true);
    });

    it('explosive ball should have explosive ability and radius', () => {
      expect(BALL_TYPES.explosive.explosive).toBe(true);
      expect(BALL_TYPES.explosive.explosionRadius).toBeDefined();
      expect(BALL_TYPES.explosive.explosionRadius).toBeGreaterThan(0);
    });

    it('sniper ball should have targeting ability', () => {
      expect(BALL_TYPES.sniper.targeting).toBe(true);
    });
  });

  describe('Costs and Constants', () => {
    it('should have increasing base costs for more powerful balls', () => {
      expect(BALL_TYPES.fast.baseCost).toBeGreaterThan(BALL_TYPES.basic.baseCost);
      expect(BALL_TYPES.heavy.baseCost).toBeGreaterThan(BALL_TYPES.fast.baseCost);
      expect(BALL_TYPES.plasma.baseCost).toBeGreaterThan(BALL_TYPES.heavy.baseCost);
    });

    it('fast ball should cost 30 coins', () => {
      expect(BALL_TYPES.fast.baseCost).toBe(30);
    });

    it('sniper ball should cost 3500 coins', () => {
      expect(BALL_TYPES.sniper.baseCost).toBe(3500);
    });

    it('explosive ball should have 70px radius', () => {
      expect(BALL_TYPES.explosive.explosionRadius).toBe(70);
    });
  });
});

describe('Game Constants', () => {
  it('should extend tier cap to 20', () => {
    expect(MAX_TIER).toBe(20);
  });

  it('should be 0.1 (10% per level)', () => {
    expect(UPGRADE_MULTIPLIER).toBe(0.1);
  });

  it('should be 0.25 (25% per prestige)', () => {
    expect(PRESTIGE_BONUS).toBe(0.25);
  });

  it('should be 0.5 (50% of normal earnings)', () => {
    expect(OFFLINE_EARNINGS_RATE).toBe(0.5);
  });

  it('should be between 0 and 1', () => {
    expect(OFFLINE_EARNINGS_RATE).toBeGreaterThan(0);
    expect(OFFLINE_EARNINGS_RATE).toBeLessThan(1);
  });

  describe('getPrestigeThreshold', () => {
    it('should be a positive integer', () => {
      expect(getPrestigeThreshold(0)).toBeGreaterThan(0);
      expect(Number.isInteger(getPrestigeThreshold(0))).toBe(true);
    });

    it('should be 10000 bricks', () => {
      expect(getPrestigeThreshold(0)).toBe(10000);
    });

    it('should define the scaling thresholds', () => {
      expect(PRESTIGE_THRESHOLDS).toEqual([10000, 20000, 40000]);
    });

    it('should scale exponentially beyond defined thresholds', () => {
      expect(getPrestigeThreshold(0)).toBe(10000);
      expect(getPrestigeThreshold(1)).toBe(20000);
      expect(getPrestigeThreshold(2)).toBe(40000);
      // New behavior: should scale beyond array
      expect(getPrestigeThreshold(3)).toBe(60000); // 40000 * 1.5
      expect(getPrestigeThreshold(4)).toBe(90000); // 60000 * 1.5
      expect(getPrestigeThreshold(5)).toBe(135000); // 90000 * 1.5
    });
  });
});
