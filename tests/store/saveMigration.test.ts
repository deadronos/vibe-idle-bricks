import { describe, it, expect, beforeEach, vi } from 'vitest'
import Decimal from 'break_infinity.js'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES } from '../../src/types/game'

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
    _setStore: (newStore: Record<string, string>) => { store = newStore },
  }
}

const localStorageMock = createLocalStorageMock()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Helper to reset store state
const resetStore = () => {
  useGameStore.setState({
    coins: new Decimal(0),
    bricksBroken: new Decimal(0),
    totalBricksBroken: new Decimal(0),
    prestigeLevel: 0,
    upgrades: { speed: 0, damage: 0, coinMult: 0 },
    ballCosts: {
      basic: new Decimal(BALL_TYPES.basic.baseCost),
      fast: new Decimal(BALL_TYPES.fast.baseCost),
      heavy: new Decimal(BALL_TYPES.heavy.baseCost),
      plasma: new Decimal(BALL_TYPES.plasma.baseCost),
      explosive: new Decimal(BALL_TYPES.explosive.baseCost),
      sniper: new Decimal(BALL_TYPES.sniper.baseCost),
    },
    upgradeCosts: {
      speed: new Decimal(100),
      damage: new Decimal(150),
      coinMult: new Decimal(200),
    },
    currentTier: 1,
    balls: [],
    bricks: [],
    explosions: [],
    canvasSize: { width: 800, height: 500 },
    isPaused: false,
    pendingOfflineMessage: null,
  })
}

describe('Save Migration and Backward Compatibility', () => {
  beforeEach(() => {
    resetStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should handle partial ballCosts in save data by merging with defaults', () => {
    // Create save data with only 'basic' ball cost
    // Simulates an old save or corrupted save where other ball types are missing
    const partialSaveData = {
      coins: '100000',
      bricksBroken: '0',
      totalBricksBroken: '0',
      prestigeLevel: 0,
      upgrades: { speed: 0, damage: 0, coinMult: 0 },
      ballCosts: {
        basic: '50'
      },
      // Missing other ball types in ballCosts
      upgradeCosts: {},
      currentTier: 1,
      balls: ['basic'],
      timestamp: Date.now(),
      version: 1,
    }

    // Import the save
    const result = useGameStore.getState().importSave(JSON.stringify(partialSaveData))
    expect(result).toBe(true)

    const state = useGameStore.getState()

    // Verify basic cost is updated from save
    expect(state.ballCosts.basic.eq(50)).toBe(true)

    // Verify other costs are present (defaults)
    expect(state.ballCosts.fast).toBeDefined()
    expect(state.ballCosts.fast.eq(BALL_TYPES.fast.baseCost)).toBe(true)

    // Verify we can safely check/buy missing types
    expect(() => {
        state.buyBall('fast')
    }).not.toThrow()
  })

   it('should derive costs from levels and ignore stored upgradeCosts', () => {
    const partialSaveData = {
      coins: '100000',
      prestigeLevel: 0,
      upgradeCosts: {
        speed: '500'
      },
      // Missing other upgrades
      ballCosts: {},
      balls: ['basic'],
    }

    const result = useGameStore.getState().importSave(JSON.stringify(partialSaveData))
    expect(result).toBe(true)

    const state = useGameStore.getState()

    // Saved cost is ignored; level 0 rebuilds to the new base cost.
    expect(state.upgradeCosts.speed.eq(50)).toBe(true)

    // Verify missing cost is default
    expect(state.upgradeCosts.damage).toBeDefined()
    expect(state.upgradeCosts.damage.eq(75)).toBe(true) // Default damage cost

    // Verify safety
    expect(() => {
        state.buyUpgrade('damage')
    }).not.toThrow()
  })

  it('should rebuild upgrade costs from levels for old saves', () => {
    const save = {
      coins: '0',
      prestigeLevel: 0,
      upgrades: { speed: 6, damage: 0, coinMult: 0 },
      upgradeCosts: { speed: '234' },
      ballCosts: {},
      balls: ['basic'],
      version: 1,
    }

    expect(useGameStore.getState().importSave(JSON.stringify(save))).toBe(true)
    expect(useGameStore.getState().upgradeCosts.speed.eq(92)).toBe(true)
  })

  it('should price a clamped speed level, not the raw save value', () => {
    const makeSave = (speed: unknown) => JSON.stringify({
      coins: '0',
      prestigeLevel: 0,
      upgrades: { speed, damage: 0, coinMult: 0 },
      upgradeCosts: {},
      ballCosts: {},
      balls: ['basic'],
      version: 1,
    })

    expect(useGameStore.getState().importSave(makeSave(50))).toBe(true)
    const cappedCost = useGameStore.getState().upgradeCosts.speed
    expect(useGameStore.getState().importSave(makeSave(999))).toBe(true)
    expect(useGameStore.getState().upgradeCosts.speed.eq(cappedCost)).toBe(true)
    expect(useGameStore.getState().upgrades.speed).toBe(50)

    expect(useGameStore.getState().importSave(makeSave('abc'))).toBe(true)
    expect(useGameStore.getState().upgrades.speed).toBe(0)
    expect(useGameStore.getState().upgradeCosts.speed.eq(50)).toBe(true)
  })

  it('should ignore garbage keys in ballCosts', () => {
    const garbageData = {
        coins: '100',
        prestigeLevel: 0,
        ballCosts: {
            'basic': '20',
            'fakeBall': '1000' // Garbage key
        },
        balls: ['basic']
    }

    useGameStore.getState().importSave(JSON.stringify(garbageData))
    const state = useGameStore.getState()

    expect(state.ballCosts.basic.eq(20)).toBe(true)
    // TypeScript check prevents access, but at runtime it should not be there (if our migration fix works)
    expect(Object.prototype.hasOwnProperty.call(state.ballCosts, 'fakeBall')).toBe(false)
  })

  it('should ignore invalid ball types in saved balls and keep valid ones', () => {
    const invalidBallsData = {
      coins: '100',
      prestigeLevel: 0,
      balls: ['basic', 'not-a-real-ball', 'sniper'],
    }

    const result = useGameStore.getState().importSave(JSON.stringify(invalidBallsData))
    expect(result).toBe(true)

    const state = useGameStore.getState()
    expect(state.balls.map((ball) => ball.type)).toEqual(['basic', 'sniper'])
  })
})
