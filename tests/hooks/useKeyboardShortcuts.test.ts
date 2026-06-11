import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts'
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

const fireKey = (key: string, target: EventTarget = document.body) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Remove any leftover listeners by unmounting the last hook.
  })

  it('toggles pause when Space is pressed', () => {
    const onToggle = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onPauseToggle: onToggle }))

    fireKey(' ')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('toggles pause when "p" is pressed (lowercase and uppercase)', () => {
    const onToggle = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onPauseToggle: onToggle }))

    fireKey('p')
    fireKey('P')
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  it('calls onResume on Escape and not onPauseToggle', () => {
    const onToggle = vi.fn()
    const onResume = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onPauseToggle: onToggle, onResume: onResume }))

    fireKey('Escape')
    expect(onResume).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('does nothing when focus is inside an editable element', () => {
    const onToggle = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onPauseToggle: onToggle }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    fireKey(' ', input)
    document.body.removeChild(input)

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('does nothing when the event has defaultPrevented = true', () => {
    const onToggle = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onPauseToggle: onToggle }))

    // Dispatch a fresh event and call preventDefault() *before* dispatch so
    // the listener observes defaultPrevented === true.
    const preventedEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    preventedEvent.preventDefault()
    document.body.dispatchEvent(preventedEvent)

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('ignores key repeat', () => {
    const onToggle = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onPauseToggle: onToggle }))

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, repeat: true })
    document.body.dispatchEvent(event)
    expect(onToggle).not.toHaveBeenCalled()
  })
})
