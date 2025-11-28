import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Decimal from 'break_infinity.js'
import { Footer } from '../../src/components/Footer'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES } from '../../src/types/game'

// Mock window.confirm and window.alert and window.prompt
vi.stubGlobal('confirm', vi.fn())
vi.stubGlobal('alert', vi.fn())
vi.stubGlobal('prompt', vi.fn())

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

  it('should render export button', () => {
    render(<Footer />)
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('should render import button', () => {
    render(<Footer />)
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
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

      render(<Footer />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      expect(writeTextMock).toHaveBeenCalledWith(expect.any(String))
      // Verify the copied data is valid JSON with expected fields
      const copiedData = JSON.parse(writeTextMock.mock.calls[0][0])
      expect(copiedData.coins).toBe('5000')
      expect(copiedData.prestigeLevel).toBe(2)
    })

    it('should show success alert after export', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      render(<Footer />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      expect(alert).toHaveBeenCalledWith(expect.stringContaining('clipboard'))
    })

    it('should fallback to prompt if clipboard fails', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      render(<Footer />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      expect(prompt).toHaveBeenCalledWith(
        expect.stringContaining('Copy'),
        expect.any(String)
      )
    })
  })

  describe('import functionality', () => {
    beforeEach(() => {
      resetStore()
      vi.clearAllMocks()
    })

    it('should prompt for save data when import clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(prompt).mockReturnValue(null)

      render(<Footer />)

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      expect(prompt).toHaveBeenCalledWith(expect.stringContaining('Paste'))
    })

    it('should do nothing if prompt cancelled', async () => {
      const user = userEvent.setup()
      vi.mocked(prompt).mockReturnValue(null)

      useGameStore.setState({ coins: new Decimal(5000) })

      render(<Footer />)

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      // State should be unchanged
      expect(useGameStore.getState().coins.eq(5000)).toBe(true)
    })

    it('should ask for confirmation before importing', async () => {
      const user = userEvent.setup()
      const saveData = { coins: '100', prestigeLevel: 0, balls: ['basic'] }
      vi.mocked(prompt).mockReturnValue(JSON.stringify(saveData))
      vi.mocked(confirm).mockReturnValue(false)

      render(<Footer />)

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      expect(confirm).toHaveBeenCalledWith(expect.stringContaining('overwrite'))
    })

    it('should import save data when confirmed', async () => {
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
      vi.mocked(prompt).mockReturnValue(JSON.stringify(saveData))
      vi.mocked(confirm).mockReturnValue(true)

      render(<Footer />)

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      const state = useGameStore.getState()
      expect(state.coins.eq(9999)).toBe(true)
      expect(state.prestigeLevel).toBe(4)
      expect(state.balls.map(b => b.type)).toEqual(['plasma', 'sniper'])
    })

    it('should show success alert after successful import', async () => {
      const user = userEvent.setup()
      const saveData = { coins: '100', prestigeLevel: 0, balls: ['basic'] }
      vi.mocked(prompt).mockReturnValue(JSON.stringify(saveData))
      vi.mocked(confirm).mockReturnValue(true)

      render(<Footer />)

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      expect(alert).toHaveBeenCalledWith(expect.stringContaining('successfully'))
    })

    it('should show error alert for invalid save data', async () => {
      const user = userEvent.setup()
      vi.mocked(prompt).mockReturnValue('not valid json {{{')
      vi.mocked(confirm).mockReturnValue(true)

      render(<Footer />)

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      expect(alert).toHaveBeenCalledWith(expect.stringContaining('Failed'))
    })

    it('should not import if confirm cancelled', async () => {
      const user = userEvent.setup()
      const saveData = { coins: '9999', prestigeLevel: 4, balls: ['basic'] }
      vi.mocked(prompt).mockReturnValue(JSON.stringify(saveData))
      vi.mocked(confirm).mockReturnValue(false)

      useGameStore.setState({ coins: new Decimal(100) })

      render(<Footer />)

      const importButton = screen.getByRole('button', { name: /import/i })
      await user.click(importButton)

      // State should be unchanged
      expect(useGameStore.getState().coins.eq(100)).toBe(true)
    })
  })
})
