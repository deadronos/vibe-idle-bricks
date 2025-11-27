# 🧱 Idle Breakout - 1 Million Bricks

An incremental/idle game where you destroy 1,000,000 bricks using multiple balls with upgrading stats. Built with React, Phaser 3, TypeScript, and Zustand.

![Idle Breakout](https://img.shields.io/badge/Bricks-1%2C000%2C000-green) ![React](https://img.shields.io/badge/React-18-blue) ![Phaser](https://img.shields.io/badge/Phaser-3-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🎮 Features

- **Massive Scale**: 1,000,000 bricks (1000x1000 grid) with viewport-based chunk loading
- **Idle Gameplay**: Balls automatically bounce and destroy bricks
- **Upgrade System**: Increase ball damage, speed, and count
- **Big Number Support**: Handles extremely large numbers with break_infinity.js
- **Persistent Progress**: Auto-save and load functionality
- **Smooth Camera**: Pan with WASD/Arrow keys, zoom with mouse wheel

## 🛠️ Tech Stack

- **Build Tool**: Vite
- **UI Framework**: React 18
- **Language**: TypeScript
- **Game Engine**: Phaser 3
- **State Management**: Zustand
- **Big Numbers**: break_infinity.js

## 📁 Project Structure

```
src/
├── components/
│   └── HUD/
│       ├── MoneyDisplay.tsx      # Shows current money
│       ├── UpgradePanel.tsx      # Upgrade buttons
│       ├── StatsPanel.tsx        # Game statistics
│       └── GameControls.tsx      # Save/Load/Reset buttons
├── config/
│   └── gameConfig.ts             # Game configuration constants
├── game/
│   ├── Ball.ts                   # Ball physics class
│   ├── Brick.ts                  # Brick visual class
│   ├── ChunkManager.ts           # Viewport chunking system
│   ├── GameScene.ts              # Main Phaser scene
│   └── PhaserGame.tsx            # React-Phaser wrapper
├── store/
│   └── useGameStore.ts           # Zustand state management
├── types/
│   └── index.ts                  # TypeScript type definitions
├── utils/
│   └── bigNumber.ts              # break_infinity.js utilities
├── App.tsx                       # Main React component
└── main.tsx                      # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vibe-idle-bricks.git
cd vibe-idle-bricks

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🎯 How to Play

1. **Watch**: Balls automatically bounce around and destroy bricks
2. **Earn**: Each brick destroyed gives you money based on its tier
3. **Upgrade**: Spend money to upgrade ball damage, speed, or add more balls
4. **Explore**: Pan the camera to see the massive 1 million brick grid
5. **Progress**: Destroy all 1,000,000 bricks to win!

### Controls

- **WASD / Arrow Keys**: Pan the camera
- **Right-click + Drag**: Pan the camera
- **Mouse Scroll**: Zoom in/out

## 🏗️ Architecture

### React + Phaser Integration

- **React** handles the HUD (money display, upgrades, stats)
- **Phaser** handles the canvas (balls, bricks, physics)
- **Zustand** bridges both - React reads for UI, Phaser reads for game logic

### Viewport Chunking System

Since rendering 1,000,000 bricks simultaneously is impossible, the game uses a chunk-based system:

1. The grid is divided into 10x10 brick chunks
2. Only chunks visible in the viewport (plus a buffer) are loaded
3. Brick data exists in state for all 1M bricks, but only visible ones are rendered
4. As the camera moves, chunks are loaded/unloaded dynamically

### State Management

```typescript
// The Zustand store manages all game state
interface GameState {
  money: Decimal;              // Current money (big number)
  ballStats: BallStats;        // Damage, speed, count
  brickHealthMap: Map<string, Decimal>;  // Damaged brick health
  destroyedBricks: Set<string>;          // IDs of destroyed bricks
  // ... actions for upgrades, damage, save/load
}
```

## 📊 Big Number Handling

The game uses `break_infinity.js` for handling astronomical numbers:

```typescript
import { formatNumber, formatCurrency } from './utils/bigNumber';

formatNumber(1500000);     // "1.50M"
formatCurrency(2.5e9);     // "$2.50B"
```

## 🔧 Configuration

Edit `src/config/gameConfig.ts` to customize:

- Grid dimensions (default: 1000x1000)
- Brick size and colors
- Ball physics settings
- Upgrade costs and scaling

## 📝 License

MIT License - see [LICENSE](LICENSE) for details
