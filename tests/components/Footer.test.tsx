import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Decimal from 'break_infinity.js'
import { Footer } from '../../src/components/Footer'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES } from '../../src/types/game'

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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Footer', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('should render save button', () => {
    render(<Footer />)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('should render reset button', () => {
    render(<Footer />)
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('should render auto-save status', () => {
    render(<Footer />)
    expect(screen.getByText(/auto-saves every 30s/i)).toBeInTheDocument()
  })

  it('should call save when save button clicked', async () => {
    const user = userEvent.setup()
    render(<Footer />)
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'idleBricksSave',
      expect.any(String)
    )
  })

  it('should show confirm dialog when reset clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(confirm).mockReturnValue(false)
    
    render(<Footer />)
    
    const resetButton = screen.getByRole('button', { name: /reset/i })
    await user.click(resetButton)
    
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('reset ALL progress')
    )
  })

  it('should reset game when confirm is accepted', async () => {
    const user = userEvent.setup()
    vi.mocked(confirm).mockReturnValue(true)
    
    // Set some state
    useGameStore.setState({
      coins: new Decimal(10000),
      prestigeLevel: 5,
    })
    
    render(<Footer />)
    
    const resetButton = screen.getByRole('button', { name: /reset/i })
    await user.click(resetButton)
    
    expect(useGameStore.getState().coins.eq(0)).toBe(true)
    expect(useGameStore.getState().prestigeLevel).toBe(0)
  })

  it('should not reset when confirm is cancelled', async () => {
    const user = userEvent.setup()
    vi.mocked(confirm).mockReturnValue(false)
    
    useGameStore.setState({ coins: new Decimal(10000) })
    
    render(<Footer />)
    
    const resetButton = screen.getByRole('button', { name: /reset/i })
    await user.click(resetButton)
    
    expect(useGameStore.getState().coins.eq(10000)).toBe(true)
  })
})
