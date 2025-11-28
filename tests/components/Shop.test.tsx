import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Decimal from 'break_infinity.js'
import { Shop } from '../../src/components/Shop'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES, PRESTIGE_THRESHOLD, getPrestigeThreshold } from '../../src/types/game'

// Mock window.confirm
vi.stubGlobal('confirm', vi.fn())

// Reset store before each test
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

describe('Shop', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render shop header', () => {
      render(<Shop />)
      expect(screen.getByRole('heading', { name: /shop/i })).toBeInTheDocument()
    })

    it('should render all ball types', () => {
      render(<Shop />)
      
      expect(screen.getByText(/basic ball/i)).toBeInTheDocument()
      expect(screen.getByText(/fast ball/i)).toBeInTheDocument()
      expect(screen.getByText(/heavy ball/i)).toBeInTheDocument()
      expect(screen.getByText(/plasma ball/i)).toBeInTheDocument()
      expect(screen.getByText(/explosive ball/i)).toBeInTheDocument()
      expect(screen.getByText(/sniper ball/i)).toBeInTheDocument()
    })

    it('should render upgrade buttons', () => {
      render(<Shop />)
      
      expect(screen.getByText('Speed Boost')).toBeInTheDocument()
      expect(screen.getByText('Power Boost')).toBeInTheDocument()
      expect(screen.getByText('Coin Multiplier')).toBeInTheDocument()
    })

    it('should render prestige button', () => {
      render(<Shop />)
      expect(screen.getByRole('button', { name: /🌟 prestige/i })).toBeInTheDocument()
    })

    it('should show ball descriptions', () => {
      render(<Shop />)
      
      expect(screen.getByText('Standard ball')).toBeInTheDocument()
      expect(screen.getByText('2x speed')).toBeInTheDocument()
      expect(screen.getByText('3x damage')).toBeInTheDocument()
      expect(screen.getByText('Pierces through bricks')).toBeInTheDocument()
    })
  })

  describe('ball purchases', () => {
    it('should disable ball buttons when cannot afford', () => {
      render(<Shop />)
      
      const basicButton = screen.getByRole('button', { name: /basic ball/i })
      expect(basicButton).toBeDisabled()
    })

    it('should enable ball buttons when can afford', () => {
      useGameStore.setState({ coins: new Decimal(100) })
      render(<Shop />)
      
      const basicButton = screen.getByRole('button', { name: /basic ball/i })
      expect(basicButton).not.toBeDisabled()
    })

    it('should buy ball when clicked', async () => {
      const user = userEvent.setup()
      useGameStore.setState({ coins: new Decimal(100) })
      render(<Shop />)
      
      const basicButton = screen.getByRole('button', { name: /basic ball/i })
      await user.click(basicButton)
      
      expect(useGameStore.getState().balls.length).toBe(1)
      expect(useGameStore.getState().coins.lt(100)).toBe(true)
    })

    it('should update cost display after purchase', async () => {
      const user = userEvent.setup()
      useGameStore.setState({ coins: new Decimal(1000) })
      
      const { rerender } = render(<Shop />)
      
      // Initial cost is 10
      expect(screen.getByText('10')).toBeInTheDocument()
      
      const basicButton = screen.getByRole('button', { name: /basic ball/i })
      await user.click(basicButton)
      
      rerender(<Shop />)
      
      // Cost should have increased (10 * 1.15 = 11.5, rounded up to 12)
      expect(screen.getByText('12')).toBeInTheDocument()
    })
  })

  describe('upgrade purchases', () => {
    it('should disable upgrades when cannot afford', () => {
      render(<Shop />)
      
      const speedButton = screen.getByRole('button', { name: /speed boost/i })
      expect(speedButton).toBeDisabled()
    })

    it('should enable upgrades when can afford', () => {
      useGameStore.setState({ coins: new Decimal(200) })
      render(<Shop />)
      
      const speedButton = screen.getByRole('button', { name: /speed boost/i })
      expect(speedButton).not.toBeDisabled()
    })

    it('should buy upgrade when clicked', async () => {
      const user = userEvent.setup()
      useGameStore.setState({ coins: new Decimal(200) })
      render(<Shop />)
      
      const speedButton = screen.getByRole('button', { name: /speed boost/i })
      await user.click(speedButton)
      
      expect(useGameStore.getState().upgrades.speed).toBe(1)
    })
  })

  describe('prestige', () => {
    it('should disable prestige when threshold not met', () => {
      useGameStore.setState({ bricksBroken: new Decimal(5000) })
      render(<Shop />)
      
      const prestigeButton = screen.getByRole('button', { name: /prestige/i })
      expect(prestigeButton).toBeDisabled()
    })

    it('should show bricks needed when cannot prestige', () => {
      useGameStore.setState({ bricksBroken: new Decimal(5000) })
      render(<Shop />)
      
      expect(screen.getByText(/break 5.00K more bricks/i)).toBeInTheDocument()
    })

    it('should scale required bricks with prestige level', () => {
      const nextThreshold = getPrestigeThreshold(1)
      useGameStore.setState({
        prestigeLevel: 1,
        bricksBroken: new Decimal(nextThreshold - 1000),
      })

      render(<Shop />)

      expect(screen.getByText(/break 1.00K more bricks/i)).toBeInTheDocument()
    })

    it('should enable prestige when threshold met', () => {
      useGameStore.setState({ 
        bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
        canvasSize: { width: 800, height: 500 }
      })
      render(<Shop />)
      
      const prestigeButton = screen.getByRole('button', { name: /prestige/i })
      expect(prestigeButton).not.toBeDisabled()
    })

    it('should show bonus info when can prestige', () => {
      useGameStore.setState({ 
        bricksBroken: new Decimal(getPrestigeThreshold(2)),
        prestigeLevel: 2,
      })
      render(<Shop />)
      
      expect(screen.getByText(/\+25% coin bonus/i)).toBeInTheDocument()
      expect(screen.getByText(/current: \+50%/i)).toBeInTheDocument()
    })

    it('should show confirm dialog when prestige clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(confirm).mockReturnValue(false)
      
      useGameStore.setState({ 
        bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
        canvasSize: { width: 800, height: 500 }
      })
      render(<Shop />)
      
      const prestigeButton = screen.getByRole('button', { name: /prestige/i })
      await user.click(prestigeButton)
      
      expect(confirm).toHaveBeenCalled()
    })

    it('should prestige when confirmed', async () => {
      const user = userEvent.setup()
      vi.mocked(confirm).mockReturnValue(true)
      
      useGameStore.setState({ 
        bricksBroken: new Decimal(PRESTIGE_THRESHOLD),
        coins: new Decimal(10000),
        prestigeLevel: 0,
        canvasSize: { width: 800, height: 500 }
      })
      render(<Shop />)
      
      const prestigeButton = screen.getByRole('button', { name: /prestige/i })
      await user.click(prestigeButton)
      
      expect(useGameStore.getState().prestigeLevel).toBe(1)
      expect(useGameStore.getState().coins.eq(0)).toBe(true)
    })
  })
})
