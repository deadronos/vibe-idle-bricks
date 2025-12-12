import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { BALL_TYPES } from '../../src/types/game';
import Decimal from 'break_infinity.js';

describe('GameStore load legacy/partial save', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should initialize missing ball costs when loading an incomplete save', () => {
    // Create a save data that only has 'basic' ball cost
    const partialSaveData = {
      coins: "100",
      bricksBroken: "0",
      totalBricksBroken: "0",
      prestigeLevel: 0,
      upgrades: { speed: 0, damage: 0, coinMult: 0 },
      // MISSING other ball types
      ballCosts: {
        basic: "10"
      },
      upgradeCosts: {
        speed: "100",
        damage: "150",
        coinMult: "200"
      },
      currentTier: 1,
      balls: ['basic'],
      timestamp: Date.now(),
    };

    // Mock localStorage
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue(JSON.stringify(partialSaveData));

    // Load the save
    useGameStore.getState().load();

    const state = useGameStore.getState();

    // Check if 'basic' cost is loaded correctly
    expect(state.ballCosts.basic.toString()).toBe("10");

    // Check if 'fast' cost is initialized to default
    expect(state.ballCosts.fast).toBeDefined();
    expect(state.ballCosts.fast.toString()).toBe(BALL_TYPES.fast.baseCost.toString());

    // Check all ball types
    Object.keys(BALL_TYPES).forEach((type) => {
        const key = type as keyof typeof BALL_TYPES;
        expect(state.ballCosts[key]).toBeDefined();
        expect(state.ballCosts[key]).toBeInstanceOf(Decimal);
    });
  });

    it('should initialize missing upgrade costs when loading an incomplete save', () => {
    // Create a save data that only has 'speed' upgrade cost
    const partialSaveData = {
      coins: "100",
      bricksBroken: "0",
      totalBricksBroken: "0",
      prestigeLevel: 0,
      upgrades: { speed: 0, damage: 0, coinMult: 0 },
      ballCosts: {
        basic: "10"
      },
      // MISSING other upgrade types
      upgradeCosts: {
        speed: "100"
      },
      currentTier: 1,
      balls: ['basic'],
      timestamp: Date.now(),
    };

    // Mock localStorage
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue(JSON.stringify(partialSaveData));

    // Load the save
    useGameStore.getState().load();

    const state = useGameStore.getState();

    // Check if 'speed' cost is loaded correctly
    expect(state.upgradeCosts.speed.toString()).toBe("100");

    // Check if 'damage' cost is initialized to default
    expect(state.upgradeCosts.damage).toBeDefined();
    expect(state.upgradeCosts.damage.toString()).toBe("150"); // Default damage cost
  });
});
