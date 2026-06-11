import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PauseButton } from '../../src/components/PauseButton'
import { useGameStore } from '../../src/store/gameStore'
import Decimal from 'break_infinity.js'
import { BALL_TYPES } from '../../src/types/game'

/** Reset the store's `isPaused` flag and the transient fields used by Footer tests. */
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

describe('PauseButton', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('renders a "Pause game" button when the game is running', () => {
    render(<PauseButton />)
    const button = screen.getByRole('button', { name: /pause game/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('flips the store flag and label when clicked', async () => {
    const user = userEvent.setup()
    render(<PauseButton />)

    await user.click(screen.getByRole('button', { name: /pause game/i }))

    expect(useGameStore.getState().isPaused).toBe(true)
    expect(screen.getByRole('button', { name: /resume game/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un-pauses the game on a second click', async () => {
    const user = userEvent.setup()
    render(<PauseButton />)

    await user.click(screen.getByRole('button', { name: /pause game/i }))
    await user.click(screen.getByRole('button', { name: /resume game/i }))

    expect(useGameStore.getState().isPaused).toBe(false)
  })
})
