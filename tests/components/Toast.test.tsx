import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider, useToast } from '../../src/components/Toast'

function Harness() {
  const { showToast } = useToast()

  return (
    <button
      onClick={() => {
        for (let i = 1; i <= 5; i++) showToast(`Message ${i}`)
      }}
    >
      Show
    </button>
  )
}

describe('ToastProvider', () => {
  it('shows at most three toasts and queues the rest in order', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Show' }))

    expect(screen.getAllByRole('status')).toHaveLength(3)
    expect(screen.queryByText('Message 4')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0])

    expect(screen.queryByText('Message 1')).not.toBeInTheDocument()
    expect(screen.getByText('Message 4')).toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(3)

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0])

    expect(screen.getByText('Message 5')).toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(3)
  })
})
