import { describe, it, expect, beforeEach, vi } from 'vitest'
import Decimal from 'break_infinity.js'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES, PRESTIGE_THRESHOLD, getPrestigeThreshold, MAX_TIER } from '../../src/types/game'

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

describe('gameStore', () => {
  beforeEach(() => {
    resetStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with zero coins', () => {
      const state = useGameStore.getState()
      expect(state.coins.eq(0)).toBe(true)
    })

    it('should start at tier 1', () => {
      expect(useGameStore.getState().currentTier).toBe(1)
    })

    it('should start with zero prestige level', () => {
      expect(useGameStore.getState().prestigeLevel).toBe(0)
    })

    it('should start with zero upgrades', () => {
      const { upgrades } = useGameStore.getState()
      expect(upgrades.speed).toBe(0)
      expect(upgrades.damage).toBe(0)
      expect(upgrades.coinMult).toBe(0)
    })
  })

  describe('addCoins', () => {
    it('should add coins to the total', () => {
      const store = useGameStore.getState()
      store.addCoins(new Decimal(100))
      expect(useGameStore.getState().coins.eq(100)).toBe(true)
    })

    it('should accumulate coins', () => {
      const store = useGameStore.getState()
      store.addCoins(new Decimal(100))
      store.addCoins(new Decimal(50))
      expect(useGameStore.getState().coins.eq(150)).toBe(true)
    })

    it('should apply prestige bonus to coin gains', () => {
      useGameStore.setState({ prestigeLevel: 1 })
      const store = useGameStore.getState()
      store.addCoins(new Decimal(100))
      // Prestige level 1 = 25% bonus, so 100 * 1.25 = 125
      expect(useGameStore.getState().coins.eq(125)).toBe(true)
    })

    it('should handle large Decimal values', () => {
      const store = useGameStore.getState()
      store.addCoins(new Decimal('1e50'))
      expect(useGameStore.getState().coins.gte('1e50')).toBe(true)
    })
  })

  describe('incrementBricksBroken', () => {
    it('should increment bricks broken counter', () => {
      const store = useGameStore.getState()
      store.incrementBricksBroken()
      expect(useGameStore.getState().bricksBroken.eq(1)).toBe(true)
    })

    it('should increase tier after every 100 bricks', () => {
      useGameStore.setState({ bricksBroken: new Decimal(99) })
      const store = useGameStore.getState()
      store.incrementBricksBroken()
      expect(useGameStore.getState().currentTier).toBe(2)
    })

    it('should cap tier at MAX_TIER', () => {
      useGameStore.setState({ bricksBroken: new Decimal(MAX_TIER * 100) })
      const store = useGameStore.getState()
      store.incrementBricksBroken()
      expect(useGameStore.getState().currentTier).toBe(MAX_TIER)
    })
  })

  describe('buyBall', () => {
    it('should return false when not enough coins', () => {
      const result = useGameStore.getState().buyBall('basic')
      expect(result).toBe(false)
    })

    it('should purchase ball when enough coins', () => {
      useGameStore.setState({ 
        coins: new Decimal(100),
        canvasSize: { width: 800, height: 500 }
      })
      const result = useGameStore.getState().buyBall('basic')
      expect(result).toBe(true)
      expect(useGameStore.getState().balls.length).toBe(1)
    })

    it('should deduct cost from coins', () => {
      useGameStore.setState({ 
        coins: new Decimal(100),
        canvasSize: { width: 800, height: 500 }
      })
      useGameStore.getState().buyBall('basic')
      expect(useGameStore.getState().coins.lt(100)).toBe(true)
    })

    it('should increase ball cost after purchase', () => {
      useGameStore.setState({ 
        coins: new Decimal(1000),
        canvasSize: { width: 800, height: 500 }
      })
      const initialCost = useGameStore.getState().ballCosts.basic.toNumber()
      useGameStore.getState().buyBall('basic')
      const newCost = useGameStore.getState().ballCosts.basic.toNumber()
      expect(newCost).toBeGreaterThan(initialCost)
    })

    it('should create ball with correct type', () => {
      useGameStore.setState({ 
        coins: new Decimal(10000),
        canvasSize: { width: 800, height: 500 }
      })
      useGameStore.getState().buyBall('plasma')
      const balls = useGameStore.getState().balls
      expect(balls[0].type).toBe('plasma')
    })
  })

  describe('buyUpgrade', () => {
    it('should return false when not enough coins', () => {
      const result = useGameStore.getState().buyUpgrade('speed')
      expect(result).toBe(false)
    })

    it('should purchase upgrade when enough coins', () => {
      useGameStore.setState({ coins: new Decimal(200) })
      const result = useGameStore.getState().buyUpgrade('speed')
      expect(result).toBe(true)
      expect(useGameStore.getState().upgrades.speed).toBe(1)
    })

    it('should increase upgrade cost after purchase', () => {
      useGameStore.setState({ coins: new Decimal(1000) })
      const initialCost = useGameStore.getState().upgradeCosts.damage.toNumber()
      useGameStore.getState().buyUpgrade('damage')
      const newCost = useGameStore.getState().upgradeCosts.damage.toNumber()
      expect(newCost).toBeGreaterThan(initialCost)
    })

    it('should apply 15% cost increase per upgrade', () => {
      useGameStore.setState({ coins: new Decimal(10000) })
      const initialCost = useGameStore.getState().upgradeCosts.speed.toNumber()
      useGameStore.getState().buyUpgrade('speed')
      const newCost = useGameStore.getState().upgradeCosts.speed.toNumber()
      // Cost should increase by 15%
      expect(newCost).toBe(Math.ceil(initialCost * 1.15))
    })
  })

  describe('prestige', () => {
    it('should not allow prestige below threshold', () => {
      useGameStore.setState({ bricksBroken: new Decimal(9999) })
      expect(useGameStore.getState().canPrestige()).toBe(false)
      expect(useGameStore.getState().prestige()).toBe(false)
    })

    it('should allow prestige at threshold', () => {
      useGameStore.setState({ 
        bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
        canvasSize: { width: 800, height: 500 }
      })
      expect(useGameStore.getState().canPrestige()).toBe(true)
    })

    it('should reset progress on prestige', () => {
      useGameStore.setState({ 
        bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
        coins: new Decimal(10000),
        currentTier: 5,
        upgrades: { speed: 5, damage: 5, coinMult: 5 },
        canvasSize: { width: 800, height: 500 }
      })
      
      useGameStore.getState().prestige()
      
      const state = useGameStore.getState()
      expect(state.coins.eq(0)).toBe(true)
      expect(state.bricksBroken.eq(0)).toBe(true)
      expect(state.currentTier).toBe(1)
      expect(state.upgrades.speed).toBe(0)
      expect(state.upgrades.damage).toBe(0)
      expect(state.upgrades.coinMult).toBe(0)
    })

    it('should increment prestige level', () => {
      useGameStore.setState({ 
        bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
        canvasSize: { width: 800, height: 500 }
      })
      useGameStore.getState().prestige()
      expect(useGameStore.getState().prestigeLevel).toBe(1)
    })

    it('should accumulate total bricks broken', () => {
      useGameStore.setState({ 
        bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
        totalBricksBroken: new Decimal(5000),
        canvasSize: { width: 800, height: 500 }
      })
      useGameStore.getState().prestige()
      expect(useGameStore.getState().totalBricksBroken.eq(15000)).toBe(true)
    })

    it('should scale prestige threshold with prestige level', () => {
      const levelOneThreshold = getPrestigeThreshold(1)
      useGameStore.setState({ 
        prestigeLevel: 1,
        bricksBroken: new Decimal(levelOneThreshold - 1),
      })
      expect(useGameStore.getState().canPrestige()).toBe(false)

      useGameStore.setState({ bricksBroken: new Decimal(levelOneThreshold) })
      expect(useGameStore.getState().canPrestige()).toBe(true)
    })
  })

  describe('damageBrick', () => {
    beforeEach(() => {
      useGameStore.setState({
        bricks: [
          {
            id: 'brick-1',
            x: 0,
            y: 0,
            width: 50,
            height: 20,
            tier: 1,
            health: new Decimal(10),
            maxHealth: new Decimal(10),
            value: new Decimal(5),
          },
        ],
      })
    })

    it('should return null for non-existent brick', () => {
      const result = useGameStore.getState().damageBrick('fake-id', new Decimal(5))
      expect(result).toBeNull()
    })

    it('should reduce brick health', () => {
      useGameStore.getState().damageBrick('brick-1', new Decimal(3))
      const brick = useGameStore.getState().bricks.find(b => b.id === 'brick-1')
      expect(brick?.health.eq(7)).toBe(true)
    })

    it('should destroy brick when health reaches zero', () => {
      const result = useGameStore.getState().damageBrick('brick-1', new Decimal(10))
      expect(result?.destroyed).toBe(true)
      expect(useGameStore.getState().bricks.length).toBe(0)
    })

    it('should return brick value when destroyed', () => {
      const result = useGameStore.getState().damageBrick('brick-1', new Decimal(15))
      expect(result?.value.eq(5)).toBe(true)
    })

    it('should return zero value when not destroyed', () => {
      const result = useGameStore.getState().damageBrick('brick-1', new Decimal(3))
      expect(result?.destroyed).toBe(false)
      expect(result?.value.eq(0)).toBe(true)
    })
  })

  describe('explosions', () => {
    it('should add explosion with correct properties', () => {
      useGameStore.getState().addExplosion(100, 100, 50)
      const explosions = useGameStore.getState().explosions
      expect(explosions.length).toBe(1)
      expect(explosions[0].x).toBe(100)
      expect(explosions[0].y).toBe(100)
      expect(explosions[0].radius).toBe(50)
      expect(explosions[0].life).toBe(300)
      expect(explosions[0].maxLife).toBe(300)
    })

    it('should update explosion life over time', () => {
      useGameStore.getState().addExplosion(100, 100, 50)
      useGameStore.getState().updateExplosions(100)
      const explosions = useGameStore.getState().explosions
      expect(explosions[0].life).toBe(200)
    })

    it('should remove expired explosions', () => {
      useGameStore.getState().addExplosion(100, 100, 50)
      useGameStore.getState().updateExplosions(400)
      expect(useGameStore.getState().explosions.length).toBe(0)
    })
  })

  describe('multiplier calculations', () => {
    it('should calculate damage multiplier correctly', () => {
      useGameStore.setState({ upgrades: { speed: 0, damage: 5, coinMult: 0 } })
      // 5 levels * 0.1 = 0.5, so 1 + 0.5 = 1.5
      expect(useGameStore.getState().getDamageMult()).toBe(1.5)
    })

    it('should calculate coin multiplier correctly', () => {
      useGameStore.setState({ upgrades: { speed: 0, damage: 0, coinMult: 10 } })
      // 10 levels * 0.1 = 1.0, so 1 + 1.0 = 2.0
      expect(useGameStore.getState().getCoinMult()).toBe(2)
    })

    it('should calculate speed multiplier correctly', () => {
      useGameStore.setState({ upgrades: { speed: 3, damage: 0, coinMult: 0 } })
      // 3 levels * 0.1 = 0.3, so 1 + 0.3 = 1.3
      expect(useGameStore.getState().getSpeedMult()).toBe(1.3)
    })
  })

  describe('pause functionality', () => {
    it('should toggle pause state', () => {
      expect(useGameStore.getState().isPaused).toBe(false)
      useGameStore.getState().setPaused(true)
      expect(useGameStore.getState().isPaused).toBe(true)
      useGameStore.getState().setPaused(false)
      expect(useGameStore.getState().isPaused).toBe(false)
    })
  })

  describe('canvas size', () => {
    it('should update canvas size', () => {
      useGameStore.getState().setCanvasSize(1024, 768)
      const { canvasSize } = useGameStore.getState()
      expect(canvasSize.width).toBe(1024)
      expect(canvasSize.height).toBe(768)
    })

    it('should initialize ball when setting canvas size with no balls', () => {
      useGameStore.setState({ balls: [] })
      useGameStore.getState().setCanvasSize(800, 600)
      expect(useGameStore.getState().balls.length).toBe(1)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set up some state
      useGameStore.setState({
        coins: new Decimal(10000),
        bricksBroken: new Decimal(500),
        prestigeLevel: 3,
        currentTier: 5,
        canvasSize: { width: 800, height: 500 }
      })

      useGameStore.getState().reset()

      const state = useGameStore.getState()
      expect(state.coins.eq(0)).toBe(true)
      expect(state.bricksBroken.eq(0)).toBe(true)
      expect(state.prestigeLevel).toBe(0)
      expect(state.currentTier).toBe(1)
    })

    it('should remove localStorage save', () => {
      useGameStore.getState().reset()
      expect(localStorage.removeItem).toHaveBeenCalledWith('idleBricksSave')
    })
  })

  describe('save', () => {
    beforeEach(() => {
      localStorageMock.clear()
      vi.clearAllMocks()
    })

    it('should save state to localStorage', () => {
      useGameStore.setState({
        coins: new Decimal(1000),
        bricksBroken: new Decimal(50),
        prestigeLevel: 2,
        currentTier: 3,
        balls: [
          { id: 'ball-1', type: 'basic', x: 100, y: 100, dx: 1, dy: -1 },
          { id: 'ball-2', type: 'plasma', x: 200, y: 200, dx: -1, dy: -1 },
        ],
      })

      useGameStore.getState().save()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'idleBricksSave',
        expect.any(String)
      )
    })

    it('should serialize Decimal values as strings', () => {
      useGameStore.setState({
        coins: new Decimal(1000),
        bricksBroken: new Decimal(50),
      })

      useGameStore.getState().save()

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.coins).toBe('1000')
      expect(savedData.bricksBroken).toBe('50')
    })

    it('should save ball types', () => {
      useGameStore.setState({
        balls: [
          { id: 'ball-1', type: 'basic', x: 100, y: 100, dx: 1, dy: -1 },
          { id: 'ball-2', type: 'sniper', x: 200, y: 200, dx: -1, dy: -1 },
        ],
      })

      useGameStore.getState().save()

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.balls).toEqual(['basic', 'sniper'])
    })

    it('should include timestamp', () => {
      const beforeSave = Date.now()
      useGameStore.getState().save()
      const afterSave = Date.now()

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.timestamp).toBeGreaterThanOrEqual(beforeSave)
      expect(savedData.timestamp).toBeLessThanOrEqual(afterSave)
    })
  })

  describe('load', () => {
    beforeEach(() => {
      localStorageMock.clear()
      vi.clearAllMocks()
      resetStore()
    })

    it('should do nothing if no save exists', () => {
      // No save in localStorage (it's cleared)
      const stateBefore = { ...useGameStore.getState() }
      
      useGameStore.getState().load()
      
      // Coins should still be 0
      expect(useGameStore.getState().coins.eq(stateBefore.coins)).toBe(true)
    })

    it('should restore saved state', () => {
      const saveData = {
        coins: '5000',
        bricksBroken: '250',
        totalBricksBroken: '1000',
        prestigeLevel: 3,
        upgrades: { speed: 2, damage: 3, coinMult: 1 },
        ballCosts: {
          basic: '15',
          fast: '75',
          heavy: '150',
          plasma: '750',
          explosive: '1500',
          sniper: '3750',
        },
        upgradeCosts: {
          speed: '150',
          damage: '225',
          coinMult: '300',
        },
        currentTier: 4,
        balls: ['basic', 'plasma'],
        timestamp: Date.now() - 1000, // 1 second ago (no offline bonus)
      }
      localStorageMock._setStore({ idleBricksSave: JSON.stringify(saveData) })

      useGameStore.getState().load()

      const state = useGameStore.getState()
      expect(state.coins.gte(5000)).toBe(true) // May have small offline bonus
      expect(state.bricksBroken.eq(250)).toBe(true)
      expect(state.totalBricksBroken.eq(1000)).toBe(true)
      expect(state.prestigeLevel).toBe(3)
      expect(state.upgrades.speed).toBe(2)
      expect(state.upgrades.damage).toBe(3)
      expect(state.upgrades.coinMult).toBe(1)
      expect(state.currentTier).toBe(4)
      expect(state.balls.length).toBe(2)
    })

    it('should recreate balls with correct types', () => {
      const saveData = {
        coins: '100',
        bricksBroken: '0',
        totalBricksBroken: '0',
        prestigeLevel: 0,
        upgrades: { speed: 0, damage: 0, coinMult: 0 },
        ballCosts: {},
        upgradeCosts: {},
        currentTier: 1,
        balls: ['basic', 'heavy', 'sniper'],
        timestamp: Date.now(),
      }
      localStorageMock._setStore({ idleBricksSave: JSON.stringify(saveData) })

      useGameStore.getState().load()

      const balls = useGameStore.getState().balls
      expect(balls.map(b => b.type)).toEqual(['basic', 'heavy', 'sniper'])
    })

    it('should calculate offline earnings for time > 1 minute', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const saveData = {
        coins: '1000',
        bricksBroken: '100',
        totalBricksBroken: '0',
        prestigeLevel: 1,
        upgrades: { speed: 0, damage: 0, coinMult: 2 },
        ballCosts: {},
        upgradeCosts: {},
        currentTier: 1,
        balls: ['basic', 'basic', 'basic'],
        timestamp: fiveMinutesAgo,
      }
      localStorageMock._setStore({ idleBricksSave: JSON.stringify(saveData) })

      useGameStore.getState().load()

      // Should have more than starting coins due to offline earnings
      expect(useGameStore.getState().coins.gt(1000)).toBe(true)
    })

    it('should handle corrupted save data gracefully', () => {
      localStorageMock._setStore({ idleBricksSave: 'not valid json {{{' })
      
      // Should not throw
      expect(() => useGameStore.getState().load()).not.toThrow()
    })

    it('should use defaults for missing ball costs', () => {
      const saveData = {
        coins: '100',
        balls: ['basic'],
        timestamp: Date.now(),
      }
      localStorageMock._setStore({ idleBricksSave: JSON.stringify(saveData) })

      useGameStore.getState().load()

      // Should have default ball costs
      expect(useGameStore.getState().ballCosts.basic.eq(BALL_TYPES.basic.baseCost)).toBe(true)
    })

    it('should create default ball if no balls in save', () => {
      const saveData = {
        coins: '100',
        balls: [],
        timestamp: Date.now(),
      }
      localStorageMock._setStore({ idleBricksSave: JSON.stringify(saveData) })

      useGameStore.getState().load()

      expect(useGameStore.getState().balls.length).toBe(1)
      expect(useGameStore.getState().balls[0].type).toBe('basic')
    })
  })

  describe('exportSave', () => {
    beforeEach(() => {
      resetStore()
    })

    it('should return valid JSON string', () => {
      const exported = useGameStore.getState().exportSave()
      expect(() => JSON.parse(exported)).not.toThrow()
    })

    it('should include all essential game state', () => {
      useGameStore.setState({
        coins: new Decimal(5000),
        bricksBroken: new Decimal(250),
        totalBricksBroken: new Decimal(1000),
        prestigeLevel: 3,
        upgrades: { speed: 2, damage: 3, coinMult: 1 },
        currentTier: 4,
        balls: [
          { id: 'ball-1', type: 'basic', x: 100, y: 100, dx: 1, dy: -1 },
          { id: 'ball-2', type: 'plasma', x: 200, y: 200, dx: -1, dy: -1 },
        ],
      })

      const exported = useGameStore.getState().exportSave()
      const data = JSON.parse(exported)

      expect(data.coins).toBe('5000')
      expect(data.bricksBroken).toBe('250')
      expect(data.totalBricksBroken).toBe('1000')
      expect(data.prestigeLevel).toBe(3)
      expect(data.upgrades).toEqual({ speed: 2, damage: 3, coinMult: 1 })
      expect(data.currentTier).toBe(4)
      expect(data.balls).toEqual(['basic', 'plasma'])
    })

    it('should include version number', () => {
      const exported = useGameStore.getState().exportSave()
      const data = JSON.parse(exported)
      expect(data.version).toBe(1)
    })

    it('should include timestamp', () => {
      const beforeExport = Date.now()
      const exported = useGameStore.getState().exportSave()
      const afterExport = Date.now()

      const data = JSON.parse(exported)
      expect(data.timestamp).toBeGreaterThanOrEqual(beforeExport)
      expect(data.timestamp).toBeLessThanOrEqual(afterExport)
    })

    it('should serialize ball costs as strings', () => {
      const exported = useGameStore.getState().exportSave()
      const data = JSON.parse(exported)

      expect(typeof data.ballCosts.basic).toBe('string')
      expect(typeof data.ballCosts.plasma).toBe('string')
    })

    it('should serialize upgrade costs as strings', () => {
      const exported = useGameStore.getState().exportSave()
      const data = JSON.parse(exported)

      expect(typeof data.upgradeCosts.speed).toBe('string')
      expect(typeof data.upgradeCosts.damage).toBe('string')
      expect(typeof data.upgradeCosts.coinMult).toBe('string')
    })
  })

  describe('importSave', () => {
    beforeEach(() => {
      resetStore()
    })

    it('should return true on successful import', () => {
      const saveData = {
        coins: '5000',
        bricksBroken: '250',
        totalBricksBroken: '1000',
        prestigeLevel: 3,
        upgrades: { speed: 2, damage: 3, coinMult: 1 },
        ballCosts: { basic: '15', fast: '75', heavy: '150', plasma: '750', explosive: '1500', sniper: '3750' },
        upgradeCosts: { speed: '150', damage: '225', coinMult: '300' },
        currentTier: 4,
        balls: ['basic', 'plasma'],
        timestamp: Date.now(),
        version: 1,
      }

      const result = useGameStore.getState().importSave(JSON.stringify(saveData))
      expect(result).toBe(true)
    })

    it('should restore game state from imported data', () => {
      const saveData = {
        coins: '5000',
        bricksBroken: '250',
        totalBricksBroken: '1000',
        prestigeLevel: 3,
        upgrades: { speed: 2, damage: 3, coinMult: 1 },
        ballCosts: { basic: '15', fast: '75', heavy: '150', plasma: '750', explosive: '1500', sniper: '3750' },
        upgradeCosts: { speed: '150', damage: '225', coinMult: '300' },
        currentTier: 4,
        balls: ['basic', 'plasma'],
        timestamp: Date.now(),
        version: 1,
      }

      useGameStore.getState().importSave(JSON.stringify(saveData))

      const state = useGameStore.getState()
      expect(state.coins.eq(5000)).toBe(true)
      expect(state.bricksBroken.eq(250)).toBe(true)
      expect(state.totalBricksBroken.eq(1000)).toBe(true)
      expect(state.prestigeLevel).toBe(3)
      expect(state.upgrades).toEqual({ speed: 2, damage: 3, coinMult: 1 })
      expect(state.currentTier).toBe(4)
      expect(state.balls.length).toBe(2)
      expect(state.balls.map(b => b.type)).toEqual(['basic', 'plasma'])
    })

    it('should return false for invalid JSON', () => {
      const result = useGameStore.getState().importSave('not valid json {{{')
      expect(result).toBe(false)
    })

    it('should return false for missing required fields', () => {
      const invalidData = { somethingElse: 'value' }
      const result = useGameStore.getState().importSave(JSON.stringify(invalidData))
      expect(result).toBe(false)
    })

    it('should clear bricks and explosions on import', () => {
      useGameStore.setState({
        bricks: [
          { id: 'brick-1', x: 0, y: 0, width: 50, height: 20, tier: 1, health: new Decimal(10), maxHealth: new Decimal(10), value: new Decimal(5) },
        ],
        explosions: [{ x: 100, y: 100, radius: 50, life: 200, maxLife: 300 }],
      })

      const saveData = {
        coins: '100',
        prestigeLevel: 0,
        balls: ['basic'],
        timestamp: Date.now(),
      }

      useGameStore.getState().importSave(JSON.stringify(saveData))

      expect(useGameStore.getState().bricks.length).toBe(0)
      expect(useGameStore.getState().explosions.length).toBe(0)
    })

    it('should use defaults for missing optional fields', () => {
      const minimalData = {
        coins: '100',
        prestigeLevel: 0,
        balls: ['basic'],
      }

      useGameStore.getState().importSave(JSON.stringify(minimalData))

      const state = useGameStore.getState()
      expect(state.currentTier).toBe(1)
      expect(state.upgrades).toEqual({ speed: 0, damage: 0, coinMult: 0 })
    })

    it('should create default ball if balls array is empty', () => {
      const saveData = {
        coins: '100',
        prestigeLevel: 0,
        balls: [],
      }

      useGameStore.getState().importSave(JSON.stringify(saveData))

      expect(useGameStore.getState().balls.length).toBe(1)
      expect(useGameStore.getState().balls[0].type).toBe('basic')
    })

    it('should restore ball costs as Decimals', () => {
      const saveData = {
        coins: '100',
        prestigeLevel: 0,
        ballCosts: { basic: '999', fast: '1000', heavy: '2000', plasma: '5000', explosive: '10000', sniper: '25000' },
        balls: ['basic'],
      }

      useGameStore.getState().importSave(JSON.stringify(saveData))

      const state = useGameStore.getState()
      expect(state.ballCosts.basic.eq(999)).toBe(true)
      expect(state.ballCosts.fast.eq(1000)).toBe(true)
    })

    it('should work with data exported by exportSave', () => {
      // Set up initial state
      useGameStore.setState({
        coins: new Decimal(12345),
        bricksBroken: new Decimal(500),
        totalBricksBroken: new Decimal(2000),
        prestigeLevel: 5,
        upgrades: { speed: 10, damage: 8, coinMult: 6 },
        currentTier: 7,
        balls: [
          { id: 'ball-1', type: 'sniper', x: 100, y: 100, dx: 1, dy: -1 },
          { id: 'ball-2', type: 'explosive', x: 200, y: 200, dx: -1, dy: -1 },
        ],
      })

      // Export
      const exported = useGameStore.getState().exportSave()

      // Reset to different state
      resetStore()

      // Import
      const result = useGameStore.getState().importSave(exported)
      expect(result).toBe(true)

      // Verify
      const state = useGameStore.getState()
      expect(state.coins.eq(12345)).toBe(true)
      expect(state.bricksBroken.eq(500)).toBe(true)
      expect(state.totalBricksBroken.eq(2000)).toBe(true)
      expect(state.prestigeLevel).toBe(5)
      expect(state.upgrades).toEqual({ speed: 10, damage: 8, coinMult: 6 })
      expect(state.currentTier).toBe(7)
      expect(state.balls.map(b => b.type)).toEqual(['sniper', 'explosive'])
    })
  })
})
