import { describe, it, expect } from 'vitest';
import {
  BALL_TYPES,
  UPGRADE_MULTIPLIER,
  PRESTIGE_MULTIPLIER,
  PRESTIGE_THRESHOLD,
  OFFLINE_EARNINGS_RATE,
  MAX_TIER,
  calculateBrickStats,
  getPrestigeMultiplier,
  STARTING_COINS,
  UPGRADE_COST_MULTIPLIER,
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

  it('should grant 35 starting coins', () => {
    expect(STARTING_COINS).toBe(35);
  });

  it('should grow upgrade costs 10% per level', () => {
    expect(UPGRADE_COST_MULTIPLIER).toBe(1.1);
  });

  it('should multiply income by 1.75 per prestige', () => {
    expect(PRESTIGE_MULTIPLIER).toBe(1.75);
  });

  it('should be 0.5 (50% of normal earnings)', () => {
    expect(OFFLINE_EARNINGS_RATE).toBe(0.5);
  });

  it('should be between 0 and 1', () => {
    expect(OFFLINE_EARNINGS_RATE).toBeGreaterThan(0);
    expect(OFFLINE_EARNINGS_RATE).toBeLessThan(1);
  });

  it('should keep the prestige goal fixed at 10,000 bricks', () => {
    expect(PRESTIGE_THRESHOLD).toBe(10000);
  });

  describe('getPrestigeMultiplier', () => {
    it('should start at 1x', () => {
      expect(getPrestigeMultiplier(0)).toBe(1);
    });

    it('should compound multiplicatively', () => {
      expect(getPrestigeMultiplier(1)).toBe(1.75);
      expect(getPrestigeMultiplier(2)).toBeCloseTo(3.0625);
      expect(getPrestigeMultiplier(5)).toBeCloseTo(16.413);
    });

  });

  describe('calculateBrickStats tier curve', () => {
    it('should keep tier 1 pacing unchanged', () => {
      const { maxHealth, value } = calculateBrickStats(1);
      expect(maxHealth.toNumber()).toBe(3);
      expect(value.toNumber()).toBe(1);
    });

    it('should pay more per hit as the tier rises', () => {
      let previous = 0;
      for (let tier = 1; tier <= MAX_TIER; tier++) {
        const { maxHealth, value } = calculateBrickStats(tier);
        const coinsPerHealth = value.div(maxHealth).toNumber();
        expect(coinsPerHealth).toBeGreaterThan(previous);
        previous = coinsPerHealth;
      }
    });

    it('should soften health growth so higher tiers stay killable', () => {
      const tier1 = calculateBrickStats(1).maxHealth;
      const tier20 = calculateBrickStats(MAX_TIER).maxHealth;
      expect(tier20.div(tier1).toNumber()).toBeLessThanOrEqual(6);
      expect(calculateBrickStats(MAX_TIER).value.toNumber()).toBeGreaterThanOrEqual(100);
    });
  });
});
