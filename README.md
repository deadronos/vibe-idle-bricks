# Idle Breakout

An "Idle Breakout" style incremental game where the player destroys 1 million bricks using multiple balls with upgrading stats.

![Game Screenshot](https://github.com/user-attachments/assets/25d5b8fb-db16-4309-99cd-e34972192008)

## Tech Stack

- **Build**: Vite
- **UI Framework**: React
- **Language**: TypeScript
- **Game Engine**: Phaser 3
- **Math**: break_infinity.js (for handling large damage/money numbers)
- **State Management**: Zustand (to bridge React and Phaser)

## Project Structure

```
src/
├── components/           # React HUD components
│   ├── BallStats.tsx    # Ball statistics display
│   ├── StatsDisplay.tsx # Money and progress display
│   ├── UpgradePanel.tsx # Upgrade purchase buttons
│   └── index.ts         # Component exports
├── phaser/              # Phaser game engine files
│   ├── objects/
│   │   └── Ball.ts      # Ball class with physics
│   ├── scenes/
│   │   └── GameScene.ts # Main game scene with brick chunking
│   ├── config.ts        # Phaser configuration
│   └── PhaserGame.tsx   # React wrapper for Phaser
├── store/
│   └── useGameStore.ts  # Zustand store for game state
├── types/
│   └── game.ts          # TypeScript interfaces and constants
├── utils/
│   └── bigNumber.ts     # break_infinity.js wrapper utilities
├── App.tsx              # Main application component
├── App.css              # Application styles
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Features

### Architecture
- **React** handles the HUD (Money, Upgrades, Stats)
- **Phaser** handles the canvas (Balls bouncing, Bricks breaking)
- **Zustand** bridges React and Phaser with a shared game state

### The "Million Brick" Problem
The game implements a **viewport chunking system** where:
- Only bricks visible in the current viewport are rendered as physics objects
- Bricks are lazily created when they come into view
- Data for all 1 million bricks can exist in the state without rendering them all

### Big Numbers
The `bigNumber.ts` utility wraps break_infinity.js to:
- Format large numbers (e.g., 1.5e6 → "1.5M")
- Handle damage and money calculations with arbitrary precision
- Support suffixes from K to Vg (vigintillion)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Game Mechanics

- **Ball Damage**: Increases damage per hit (1.5x multiplier per upgrade)
- **Ball Speed**: Increases ball velocity (1.2x multiplier per upgrade)
- **Add Ball**: Adds another ball to the game
- **Money**: Earned by destroying bricks (based on brick health)
- **Brick Health**: Increases as you progress deeper into the brick grid
