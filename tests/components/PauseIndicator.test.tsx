import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PauseIndicator } from '../../src/components/PauseIndicator'
import { PauseOverlay } from '../../src/components/PauseOverlay'
import { useGameStore } from '../../src/store/gameStore'
import Decimal from 'break_infinity.js'
import { BALL_TYPES } from '../../src/types/game'

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
    upgradeCosts: { speed: new Decimal(100), damage: new Decimal(150), coinMult: new Decimal(200) },
    currentTier: 1,
    balls: [],
    bricks: [],
    explosions: [],
    canvasSize: { width: 800, height: 500 },
    isPaused: false,
    pendingOfflineMessage: null,
  })
}

describe('PauseIndicator', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('announces "Game running" when not paused', () => {
    render(<PauseIndicator />)
    const indicator = screen.getByTestId('pause-indicator')
    expect(indicator).toHaveTextContent(/game running/i)
    expect(indicator).toHaveAttribute('aria-live', 'polite')
  })

  it('announces "Game paused" when paused', () => {
    useGameStore.setState({ isPaused: true })
    render(<PauseIndicator />)
    expect(screen.getByTestId('pause-indicator')).toHaveTextContent(/game paused/i)
  })
})

describe('PauseOverlay', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('renders nothing when the game is running', () => {
    render(<PauseOverlay />)
    expect(screen.queryByRole('dialog', { name: /game paused/i })).toBeNull()
  })

  it('renders the paused card with a resume button when paused', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    useGameStore.setState({ isPaused: true })
    render(<PauseOverlay />)

    expect(screen.getByRole('dialog', { name: /game paused/i })).toBeInTheDocument()
    const resumeButton = screen.getByRole('button', { name: /^resume$/i })
    expect(resumeButton).toBeInTheDocument()

    await userEvent.setup().click(resumeButton)
    expect(useGameStore.getState().isPaused).toBe(false)
  })
})
