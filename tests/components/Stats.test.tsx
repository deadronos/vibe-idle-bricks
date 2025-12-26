import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Decimal from 'break_infinity.js'
import { Stats } from '../../src/components/Stats'
import { useGameStore } from '../../src/store/gameStore'
import { BALL_TYPES } from '../../src/types/game'

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

describe('Stats', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should render coins display', () => {
    useGameStore.setState({ coins: new Decimal(1000) })
    render(<Stats />)
    
    expect(screen.getByText('1.00K')).toBeInTheDocument()
    expect(screen.getByText('Coins')).toBeInTheDocument()
  })

  it('should render bricks broken', () => {
    useGameStore.setState({ bricksBroken: new Decimal(500) })
    render(<Stats />)
    
    // Find the stat container with 'Bricks Broken' label
    const bricksBrokenLabel = screen.getByText('Bricks Broken')
    expect(bricksBrokenLabel).toBeInTheDocument()
    // The value should be in the same stat container
    const statContainer = bricksBrokenLabel.closest('.stat')
    expect(statContainer).toHaveTextContent('500')
  })

  it('should render total bricks (current + total)', () => {
    useGameStore.setState({
      bricksBroken: new Decimal(100),
      totalBricksBroken: new Decimal(900),
    })
    render(<Stats />)
    
    // 100 + 900 = 1000 = 1.00K
    expect(screen.getByText('1.00K')).toBeInTheDocument()
    expect(screen.getByText('Total Bricks')).toBeInTheDocument()
  })

  it('should render ball count', () => {
    useGameStore.setState({
      balls: [
        { id: '1', type: 'basic', x: 0, y: 0, dx: 1, dy: -1 },
        { id: '2', type: 'basic', x: 0, y: 0, dx: 1, dy: -1 },
        { id: '3', type: 'plasma', x: 0, y: 0, dx: 1, dy: -1 },
      ],
    })
    render(<Stats />)
    
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Balls')).toBeInTheDocument()
  })

  it('should display next prestige threshold', () => {
    useGameStore.setState({ prestigeLevel: 2 })
    render(<Stats />)

    expect(screen.getByText('Next Prestige')).toBeInTheDocument()
    expect(screen.getByText('40.00K')).toBeInTheDocument()
  })

  it('should update when store changes', () => {
    const { rerender } = render(<Stats />)
    
    // Initially coins are 0
    const coinsLabel = screen.getByText('Coins')
    let coinsContainer = coinsLabel.closest('.stat')
    expect(coinsContainer).toHaveTextContent('0')
    
    act(() => {
      useGameStore.setState({ coins: new Decimal(5000) })
    })
    rerender(<Stats />)
    coinsContainer = screen.getByText('Coins').closest('.stat')
    
    expect(coinsContainer).toHaveTextContent('5.00K')
  })
})
