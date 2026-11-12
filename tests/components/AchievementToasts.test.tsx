import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider } from '../../src/components/Toast'
import { useAchievementToasts } from '../../src/hooks/useAchievementToasts'
import { useGameStore } from '../../src/store/gameStore'

function Harness() {
  useAchievementToasts()
  return null
}

describe('useAchievementToasts', () => {
  it('shows a single unlock after the previous queue has drained', () => {
    useGameStore.setState({ pendingAchievementUnlocks: [] })
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    )

    act(() => {
      useGameStore.setState({ pendingAchievementUnlocks: ['first_brick'] })
    })
    expect(screen.getByText(/Breaking In/)).toBeInTheDocument()

    act(() => {
      useGameStore.setState({ pendingAchievementUnlocks: ['hundred_bricks'] })
    })
    expect(screen.getByText(/Centurion/)).toBeInTheDocument()
  })
})
