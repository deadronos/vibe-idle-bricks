import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Decimal from 'break_infinity.js'
import { Footer } from '../../src/components/Footer'
import { ToastProvider } from '../../src/components/Toast'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES } from '../../src/types/game'

/** Renders Footer inside the required ToastProvider. */
const renderFooter = () =>
  render(
    <ToastProvider>
      <Footer />
    </ToastProvider>
  )

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
    pendingOfflineMessage: null,
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
    renderFooter()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('should render reset button', () => {
    renderFooter()
    expect(screen.getByRole('button', { name: /^reset$/i })).toBeInTheDocument()
  })

  it('should render auto-save status', () => {
    renderFooter()
    expect(screen.getByText(/auto-saves every 30s/i)).toBeInTheDocument()
  })

  it('should call save when save button clicked', async () => {
    const user = userEvent.setup()
    renderFooter()

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'idleBricksSave',
      expect.any(String)
    )
  })

  it('should show a toast when save button clicked', async () => {
    const user = userEvent.setup()
    renderFooter()

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(screen.getByText(/game saved/i)).toBeInTheDocument()
    )
  })

  it('should open confirm modal when reset clicked', async () => {
    const user = userEvent.setup()
    renderFooter()

    await user.click(screen.getByRole('button', { name: /^reset$/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/reset all progress/i)).toBeInTheDocument()
  })

  it('should reset game when confirm button in modal is clicked', async () => {
    const user = userEvent.setup()

    useGameStore.setState({
      coins: new Decimal(10000),
      prestigeLevel: 5,
    })

    renderFooter()

    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    // Click the "Reset" confirm button inside the dialog
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^reset$/i }))

    expect(useGameStore.getState().coins.eq(0)).toBe(true)
    expect(useGameStore.getState().prestigeLevel).toBe(0)
  })

  it('should not reset when cancel is clicked in modal', async () => {
    const user = userEvent.setup()
    useGameStore.setState({ coins: new Decimal(10000) })

    renderFooter()

    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

    expect(useGameStore.getState().coins.eq(10000)).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should not reset when Escape is pressed in modal', async () => {
    const user = userEvent.setup()
    useGameStore.setState({ coins: new Decimal(10000) })

    renderFooter()

    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(useGameStore.getState().coins.eq(10000)).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render export button', () => {
    renderFooter()
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('should render import button', () => {
    renderFooter()
    expect(screen.getByRole('button', { name: /^import$/i })).toBeInTheDocument()
  })

  describe('export functionality', () => {
    beforeEach(() => {
      resetStore()
      vi.clearAllMocks()
    })

    it('should copy save data to clipboard when export clicked', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      useGameStore.setState({
        coins: new Decimal(5000),
        prestigeLevel: 2,
      })

      renderFooter()

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      expect(writeTextMock).toHaveBeenCalledWith(expect.any(String))
      // Verify the copied data is valid JSON with expected fields
      const copiedData = JSON.parse(writeTextMock.mock.calls[0][0])
      expect(copiedData.coins).toBe('5000')
      expect(copiedData.prestigeLevel).toBe(2)
    })

    it('should show success toast after export', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      renderFooter()

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      await waitFor(() =>
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument()
      )
    })

    it('should fallback to import dialog if clipboard fails', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      renderFooter()

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      )
    })
  })

  describe('import functionality', () => {
    beforeEach(() => {
      resetStore()
      vi.clearAllMocks()
    })

    it('should open import dialog when import clicked', async () => {
      const user = userEvent.setup()

      renderFooter()

      await user.click(screen.getByRole('button', { name: /^import$/i }))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /save data/i })).toBeInTheDocument()
    })

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup()

      renderFooter()

      await user.click(screen.getByRole('button', { name: /^import$/i }))

      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show error toast when import submitted with empty text', async () => {
      const user = userEvent.setup()

      renderFooter()

      await user.click(screen.getByRole('button', { name: /^import$/i }))
      const dialog = screen.getByRole('dialog')
      // Click Import without typing anything
      await user.click(within(dialog).getByRole('button', { name: /^import$/i }))

      await waitFor(() =>
        expect(screen.getByText(/no save data entered/i)).toBeInTheDocument()
      )
      // Dialog stays open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should import save data when valid JSON typed and confirmed', async () => {
      const user = userEvent.setup()
      const saveData = {
        coins: '9999',
        bricksBroken: '500',
        totalBricksBroken: '1000',
        prestigeLevel: 4,
        upgrades: { speed: 5, damage: 3, coinMult: 2 },
        currentTier: 6,
        balls: ['plasma', 'sniper'],
      }

      renderFooter()

      await user.click(screen.getByRole('button', { name: /^import$/i }))

      const textarea = screen.getByRole('textbox', { name: /save data/i })
      fireEvent.change(textarea, { target: { value: JSON.stringify(saveData) } })

      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /^import$/i }))

      const state = useGameStore.getState()
      expect(state.coins.eq(9999)).toBe(true)
      expect(state.prestigeLevel).toBe(4)
      expect(state.balls.map(b => b.type)).toEqual(['plasma', 'sniper'])
    })

    it('should show success toast after successful import', async () => {
      const user = userEvent.setup()
      const saveData = { coins: '100', prestigeLevel: 0, balls: ['basic'] }

      renderFooter()

      await user.click(screen.getByRole('button', { name: /^import$/i }))
      const textarea = screen.getByRole('textbox', { name: /save data/i })
      fireEvent.change(textarea, { target: { value: JSON.stringify(saveData) } })
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /^import$/i }))

      await waitFor(() =>
        expect(screen.getByText(/imported successfully/i)).toBeInTheDocument()
      )
    })

    it('should show error toast for invalid save data', async () => {
      const user = userEvent.setup()

      renderFooter()

      await user.click(screen.getByRole('button', { name: /^import$/i }))
      const textarea = screen.getByRole('textbox', { name: /save data/i })
      fireEvent.change(textarea, { target: { value: 'not valid json' } })
      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /^import$/i }))

      await waitFor(() =>
        expect(screen.getByText(/failed to import/i)).toBeInTheDocument()
      )
    })

    it('should not import if dialog is closed after typing', async () => {
      const user = userEvent.setup()
      const saveData = { coins: '9999', prestigeLevel: 4, balls: ['basic'] }

      useGameStore.setState({ coins: new Decimal(100) })

      renderFooter()

      await user.click(screen.getByRole('button', { name: /^import$/i }))
      const textarea = screen.getByRole('textbox', { name: /save data/i })
      fireEvent.change(textarea, { target: { value: JSON.stringify(saveData) } })

      const dialog = screen.getByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

      // State should be unchanged
      expect(useGameStore.getState().coins.eq(100)).toBe(true)
    })
  })
})
