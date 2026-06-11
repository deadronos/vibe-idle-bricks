/**
 * Tests for the `<AchievementsModal>` component:
 *   - When closed, the gallery is not rendered.
 *   - When open, all 18 achievements render.
 *   - Locked vs unlocked styling is correctly applied.
 *   - Unlocked achievements are sorted first (most recent first).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Decimal from 'break_infinity.js'
import { AchievementsModal } from '../../src/components/AchievementsModal'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES } from '../../src/types/game'
import { ACHIEVEMENTS } from '../../src/types/achievements'

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
    unlockedAchievements: {},
    pendingAchievementUnlocks: [],
  })
}

describe('AchievementsModal', () => {
  beforeEach(() => {
    resetStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('does not render the achievement list when closed', () => {
    render(<AchievementsModal open={false} onClose={() => {}} />)
    expect(screen.queryByTestId('achievements-summary')).not.toBeInTheDocument()
  })

  it('renders the summary with 0 / N when open and no unlocks', () => {
    render(<AchievementsModal open={true} onClose={() => {}} />)
    const summary = screen.getByTestId('achievements-summary')
    expect(summary).toHaveTextContent(`0 / ${ACHIEVEMENTS.length}`)
    expect(summary).toHaveTextContent('unlocked')
  })

  it('renders every achievement id from ACHIEVEMENTS', () => {
    render(<AchievementsModal open={true} onClose={() => {}} />)
    for (const def of ACHIEVEMENTS) {
      expect(screen.getByTestId(`achievement-${def.id}`)).toBeInTheDocument()
    }
  })

  it('marks every achievement as locked when none are unlocked', () => {
    render(<AchievementsModal open={true} onClose={() => {}} />)
    for (const def of ACHIEVEMENTS) {
      const item = screen.getByTestId(`achievement-${def.id}`)
      expect(item).toHaveAttribute('data-unlocked', 'false')
      expect(item.className).toMatch(/is-locked/)
    }
  })

  it('marks unlocked achievements with is-unlocked and shows the date', () => {
    const ts = Date.UTC(2024, 4, 1)
    useGameStore.setState({
      unlockedAchievements: {
        first_brick: ts,
        hundred_bricks: ts + 1000,
      },
    })
    render(<AchievementsModal open={true} onClose={() => {}} />)
    const item = screen.getByTestId('achievement-first_brick')
    expect(item).toHaveAttribute('data-unlocked', 'true')
    expect(item.className).toMatch(/is-unlocked/)
    // Date formatted like "May 1, 2024" (en-US) or similar — just check that
    // something date-like renders in the status region.
    const status = within(item).getByText(/2024|May|\d{1,2}/)
    expect(status).toBeInTheDocument()
  })

  it('sorts unlocked achievements first (most recent first)', () => {
    useGameStore.setState({
      unlockedAchievements: {
        first_brick: 1_000, // older
        hundred_bricks: 2_000, // newer
      },
    })
    render(<AchievementsModal open={true} onClose={() => {}} />)
    const list = screen.getByRole('list', { name: 'Achievements' })
    const items = within(list).getAllByRole('listitem')
    const firstTwoIds = items.slice(0, 2).map((el) => el.dataset.testid)
    expect(firstTwoIds).toEqual([
      'achievement-hundred_bricks',
      'achievement-first_brick',
    ])
  })

  it('updates the summary count when achievements are unlocked', () => {
    useGameStore.setState({
      unlockedAchievements: { first_brick: Date.now() },
    })
    render(<AchievementsModal open={true} onClose={() => {}} />)
    expect(screen.getByTestId('achievements-summary')).toHaveTextContent('1 /')
  })

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<AchievementsModal open={true} onClose={onClose} />)
    // The Modal's cancel button is the second button (Close).
    const buttons = screen.getAllByRole('button')
    const closeBtn = buttons.find((b) => b.textContent === 'Close')
    expect(closeBtn).toBeDefined()
    closeBtn!.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
