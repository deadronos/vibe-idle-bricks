# 🧱 Idle Bricks

An idle/incremental breakout-style game where balls autonomously smash through bricks while you upgrade and expand your arsenal. Built with React, Phaser, and Zustand.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Phaser](https://img.shields.io/badge/Phaser-4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

## 📖 Table of Contents

- [Features](#-features)
- [How to Play](#-how-to-play)
- [Ball Types](#-ball-types)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [License](#-license)

## ⚡ Features

- **Autonomous gameplay** — Runs itself while you strategize upgrades.
- **6 unique ball types** — Each with distinct physics, stats, and abilities.
- **10 brick tiers** — Progressive difficulty with scaling rewards and colors.
- **Prestige system** — Reset progress for permanent coin multipliers (+25% per level).
- **Auto-save** — Progress is saved to local storage every 30 seconds.
- **Offline Earnings** — Earn coins based on your production rate while the game is closed.
- **Large number support** — Handles arbitrarily large values using `break_infinity.js`.

## 🎮 How to Play

1. **Watch balls bounce** — They automatically break bricks and earn coins.
2. **Buy upgrades** — Increase global speed, damage, and coin multipliers from the Shop.
3. **Unlock new balls** — Purchase specialized balls like Plasma (piercing) or Explosive (AoE).
4. **Tier up** — Breaking bricks increases the brick tier (harder but more valuable).
5. **Prestige** — Once you reach a brick threshold (e.g., 10,000), you can prestige to reset for a permanent bonus.

## 🎱 Ball Types

| Ball | Cost | Special Ability |
|------|------|-----------------|
| ⚪ **Basic** | 10 | Standard starter ball. Balanced stats. |
| 🔵 **Fast** | 50 | 2× speed for more frequent hits. |
| 🟠 **Heavy** | 100 | 3× damage, but moves slower. Good for high-health bricks. |
| 🟣 **Plasma** | 500 | Pierces through bricks, damaging multiple in a line. |
| 🔴 **Explosive** | 1,000 | Deals area-of-effect damage to nearby bricks on impact. |
| 🟢 **Sniper** | 2,500 | Actively steers towards the weakest brick on screen. |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/idle-bricks.git
   cd idle-bricks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

## 🏗️ Architecture

The application uses a layered architecture separating UI, State, and Game Logic:

- **React 19** handles the UI (Shop, Stats, Footer).
- **Phaser 3** handles the game loop, physics, collisions, and rendering in a canvas.
- **Zustand** acts as the single source of truth for game state (coins, balls, bricks).

### Data Flow

1. **State**: All game data (coins, balls, bricks) resides in the Zustand store (`useGameStore`).
2. **Game Loop**: The Phaser `GameScene` subscribes to the store and updates the visual representation of balls and bricks every frame.
3. **Actions**: User interactions (clicking "Buy") dispatch actions to the store. Game events (collisions) also dispatch actions (e.g., `damageBrick`, `addCoins`).

### Numeric Precision

All gameplay values (health, coins, damage) use `break_infinity.js` `Decimal` objects to support incremental game scale numbers (e.g., 1e50).

## 📁 Project Structure

```text
src/
├── components/     # React UI components (Shop, Stats, etc.)
│   └── PhaserGame.tsx # Wrapper for the Phaser engine
├── game/           # Phaser game logic
│   └── GameScene.ts   # Main scene handling physics & rendering
├── store/          # Zustand state management
│   └── gameStore.ts   # Central store definition
├── types/          # TypeScript interfaces and constants
│   └── game.ts        # Ball types, Brick data, Game state
├── utils/          # Helper functions
│   └── helpers.ts     # ID generation, number formatting
├── App.tsx         # Main layout
└── main.tsx        # Entry point
```

## 💻 Development

### Commands

- `npm run dev`: Start dev server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run typecheck`: Run TypeScript compiler check.
- `npm test`: Run Vitest unit tests.

### Documentation

All source files are fully documented with JSDoc/TSDoc comments. You can inspect the code to see detailed descriptions of functions, parameters, and types.

## 📄 License

MIT
