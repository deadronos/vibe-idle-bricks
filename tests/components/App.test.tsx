import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../../src/App'
import Decimal from 'break_infinity.js'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES } from '../../src/types/game'

// Mock Phaser to avoid canvas issues in tests
vi.mock('phaser', () => ({
  default: {
    Game: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
    })),
  },
}))

// Mock the PhaserGame component
vi.mock('../../src/components/PhaserGame', () => ({
  PhaserGame: () => <div data-testid="phaser-game">Phaser Game Mock</div>,
}))

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

describe('App', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should render the game title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /idle bricks/i })).toBeInTheDocument()
  })

  it('should render stats component', () => {
    render(<App />)
    expect(screen.getByText('Coins')).toBeInTheDocument()
    expect(screen.getByText('Bricks Broken')).toBeInTheDocument()
  })

  it('should render shop component', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /shop/i })).toBeInTheDocument()
  })

  it('should render footer component', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /💾 save/i })).toBeInTheDocument()
    // Use getAllByRole since there are multiple elements with 'reset' (Reset button and "Reset for permanent bonuses")
    const resetButtons = screen.getAllByRole('button', { name: /🔄 reset/i })
    expect(resetButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('should render game area with mocked Phaser', () => {
    render(<App />)
    expect(screen.getByTestId('phaser-game')).toBeInTheDocument()
  })
})
