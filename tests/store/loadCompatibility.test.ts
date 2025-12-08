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
  })
}

describe('GameStore load() backward compatibility', () => {
  beforeEach(() => {
    resetStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('load() should correctly merge default costs when loading partial ballCosts', () => {
    // Create save data with only 'basic' ball cost
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
    }

    localStorageMock.setItem('idleBricksSave', JSON.stringify(partialSaveData))

    // Load the save
    useGameStore.getState().load()

    const state = useGameStore.getState()

    // basic cost should be updated
    expect(state.ballCosts.basic.eq(50)).toBe(true)

    // fast cost should be defined (default)
    expect(state.ballCosts.fast).toBeDefined()
    expect(state.ballCosts.fast.eq(BALL_TYPES.fast.baseCost)).toBe(true)

    // We should be able to buy 'fast' without error
     expect(() => {
        state.buyBall('fast')
    }).not.toThrow()
  })
})
