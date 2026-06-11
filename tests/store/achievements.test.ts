/**
 * Tests for the store-level achievement wiring:
 *   - `checkAchievements()` returns the new ids and queues toasts
 *   - `drainPendingAchievementUnlocks()` empties the queue
 *   - `incrementBricksBroken`, `buyBall`, `buyUpgrade`, `prestige` all trigger
 *     the right unlocks
 *   - `reset()` clears achievements and the queue
 *   - Achievements persist in the save via `unlockedAchievements`
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Decimal from 'break_infinity.js'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES, PRESTIGE_THRESHOLD } from '../../src/types/game'

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: () => {
      store = {}
    },
  }
}

const localStorageMock = createLocalStorageMock()
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

/** Reset to a known baseline. */
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
    balls: [{ id: 'seed-basic', type: 'basic', x: 100, y: 100, dx: 0, dy: 0 }],
    bricks: [],
    explosions: [],
    canvasSize: { width: 800, height: 500 },
    isPaused: false,
    pendingOfflineMessage: null,
    unlockedAchievements: {},
    pendingAchievementUnlocks: [],
  })
}

describe('achievement store wiring', () => {
  beforeEach(() => {
    resetStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('starts with empty unlocks and pending queue', () => {
    const state = useGameStore.getState()
    expect(state.unlockedAchievements).toEqual({})
    expect(state.pendingAchievementUnlocks).toEqual([])
  })

  it('unlocks first_brick after a single incrementBricksBroken', () => {
    useGameStore.getState().incrementBricksBroken()
    const state = useGameStore.getState()
    expect(state.unlockedAchievements['first_brick']).toBeGreaterThan(0)
    expect(state.pendingAchievementUnlocks).toContain('first_brick')
  })

  it('does not re-queue an already-unlocked achievement on repeat increments', () => {
    const store = useGameStore.getState()
    store.incrementBricksBroken()
    store.drainPendingAchievementUnlocks()
    const after = useGameStore.getState()
    expect(after.pendingAchievementUnlocks).toEqual([])
    expect(after.unlockedAchievements['first_brick']).toBeGreaterThan(0)

    store.incrementBricksBroken()
    const next = useGameStore.getState()
    expect(next.pendingAchievementUnlocks).toEqual([])
  })

  it('checkAchievements returns the new ids and updates the queue', () => {
    useGameStore.setState({ totalBricksBroken: new Decimal(150) })
    const newIds = useGameStore.getState().checkAchievements()
    expect(newIds).toContain('first_brick')
    expect(newIds).toContain('hundred_bricks')
    const state = useGameStore.getState()
    expect(state.unlockedAchievements['hundred_bricks']).toBeGreaterThan(0)
    expect(state.pendingAchievementUnlocks).toEqual(
      expect.arrayContaining(['first_brick', 'hundred_bricks']),
    )
  })

  it('drainPendingAchievementUnlocks empties the queue but keeps unlocks', () => {
    useGameStore.getState().incrementBricksBroken()
    expect(useGameStore.getState().pendingAchievementUnlocks.length).toBeGreaterThan(0)
    useGameStore.getState().drainPendingAchievementUnlocks()
    const state = useGameStore.getState()
    expect(state.pendingAchievementUnlocks).toEqual([])
    expect(state.unlockedAchievements['first_brick']).toBeGreaterThan(0)
  })

  it('buyBall unlocks first_purchase on the first non-basic ball and the buy_<type> id', () => {
    useGameStore.setState({ coins: new Decimal(1_000_000) })
    const bought = useGameStore.getState().buyBall('fast')
    expect(bought).toBe(true)
    const state = useGameStore.getState()
    expect(state.unlockedAchievements['first_purchase']).toBeGreaterThan(0)
    expect(state.unlockedAchievements['buy_fast']).toBeGreaterThan(0)
    expect(state.pendingAchievementUnlocks).toEqual(
      expect.arrayContaining(['first_purchase', 'buy_fast']),
    )
  })

  it('buyUpgrade unlocks first_upgrade', () => {
    useGameStore.setState({ coins: new Decimal(10_000) })
    const bought = useGameStore.getState().buyUpgrade('speed')
    expect(bought).toBe(true)
    const state = useGameStore.getState()
    expect(state.unlockedAchievements['first_upgrade']).toBeGreaterThan(0)
  })

  it('prestige unlocks first_prestige', () => {
    useGameStore.setState({
      coins: new Decimal(1_000_000),
      bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
      totalBricksBroken: new Decimal(PRESTIGE_THRESHOLD),
    })
    const ok = useGameStore.getState().prestige()
    expect(ok).toBe(true)
    const state = useGameStore.getState()
    expect(state.prestigeLevel).toBe(1)
    expect(state.unlockedAchievements['first_prestige']).toBeGreaterThan(0)
  })

  it('reset() clears achievements and pending queue', () => {
    useGameStore.getState().incrementBricksBroken()
    expect(
      Object.keys(useGameStore.getState().unlockedAchievements).length,
    ).toBeGreaterThan(0)

    useGameStore.getState().reset()
    const state = useGameStore.getState()
    expect(state.unlockedAchievements).toEqual({})
    expect(state.pendingAchievementUnlocks).toEqual([])
  })
})

describe('achievement save/load', () => {
  beforeEach(() => {
    resetStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('includes unlockedAchievements in the save payload', () => {
    useGameStore.setState({
      unlockedAchievements: { first_brick: 1234, hundred_bricks: 5678 },
    })
    useGameStore.getState().save()
    const raw = localStorageMock.setItem.mock.calls.find(
      (c) => c[0] === 'idleBricksSave',
    )?.[1] as string | undefined
    expect(raw).toBeDefined()
    const parsed = JSON.parse(raw ?? '{}')
    expect(parsed.unlockedAchievements).toEqual({
      first_brick: 1234,
      hundred_bricks: 5678,
    })
  })
})
