# 🧱 Idle Bricks

An idle/incremental breakout-style game where balls autonomously smash through bricks while you upgrade and expand your arsenal. Built with React, Phaser, and Zustand.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Phaser](https://img.shields.io/badge/Phaser-4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)
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
- **Unbounded brick tiers** — Progressive difficulty with scaling rewards and colors; tiers rise every 100 bricks.
- **Prestige system** — Reset the run for a permanent ×1.25 damage and coin multiplier per level (upgrades are kept).
- **Auto-save** — Versioned, validated progress is saved to local storage every 30 seconds, when the tab is hidden, and when the page is closing.
- **Offline earnings** — Earn 50% of your recent production rate while away, capped at 24 hours.
- **Large number support** — Handles arbitrarily large values using `break_infinity.js`.

## 🎮 How to Play

1. **Watch balls bounce** — They automatically break bricks and earn coins.
2. **Click to focus** — Clicking a brick chips it and marks it as the priority target for targeting balls; ignoring clicks falls back to the weakest brick.
3. **Buy upgrades** — Increase global speed, damage, and coin multipliers from the Shop, or enable auto-buy in Settings (it keeps a 50% coin reserve).
4. **Unlock new balls** — Purchase specialized balls like Plasma (piercing) or Explosive (AoE).
5. **Tier up** — Every 100 bricks broken raises the tier. Past tier 20, health grows faster than value, so upgrades matter more.
6. **Prestige** — Break 10,000 bricks in a run to reset coins, balls, and tier for a permanent ×1.25 damage/coin multiplier, Blueprints, and the permanent prestige tree. Upgrades and tree nodes are kept.

## 🎱 Ball Types

| Ball | Cost | Special Ability |
|------|------|-----------------|
| ⚪ **Basic** | 10 | Standard starter ball. Balanced stats. |
| 🔵 **Fast** | 30 | 2× speed for more frequent hits. |
| 🟠 **Heavy** | 100 | 3× damage, but moves slower. Good for high-health bricks. |
| 🟣 **Plasma** | 500 | Pierces through bricks, damaging multiple in a line. |
| 🔴 **Explosive** | 1,000 | Deals area-of-effect damage to nearby bricks on impact. |
| 🟢 **Sniper** | 3,500 | Actively steers towards the priority brick, or the weakest brick on screen. |

## 🚀 Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (Node 24 LTS recommended; CI uses 24)
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
- **Phaser 4** handles the game loop, physics, collisions, and rendering in a canvas.
- **Zustand** acts as the single source of truth for game state (coins, balls, bricks).

### Data Flow

1. **State**: All game data (coins, balls, bricks) resides in the Zustand store (`useGameStore`).
2. **Game Loop**: The Phaser `GameScene` subscribes to the store and updates the visual representation of balls and bricks every frame.
3. **Actions**: User interactions (clicking "Buy") dispatch actions to the store. Game events (collisions) also dispatch actions (e.g., `damageBrick`, `addCoins`).

### Numeric Precision

All gameplay values (health, coins, damage) use `break_infinity.js` `Decimal` objects to support incremental game scale numbers (e.g., 1e50).

### Balance Source of Truth

Ball stats, costs, tier formulas, and the prestige multiplier live in [`src/types/game.ts`](src/types/game.ts). This README summarizes them; the code is authoritative.

### Progression and Records

Prestige resets the current run at 10,000 bricks while preserving upgrades, Blueprints, achievements, and the permanent prestige tree. The tree has three uncapped nodes: **Might** (+10% damage), **Fortune** (+10% live/simulated coin income), and **Insight** (+10% idle/offline income) per level. Each node costs `ceil(baseCost × 1.6^level)` Blueprints.

The Footer **Records** dialog shows lifetime credited coins, total bricks, best/current tier, run bricks, prestiges, Blueprints, and active playtime. Stats shows per-run goals at 100/500/1,000 bricks, each awarding Blueprints once per run. Each ball type has a permanent, coin-purchased level: damage for every type plus speed for Fast, shown in the Shop and capped at 3× per-type speed. Saves use version 6 and migrate older saves with zeroed tree/records, run-goal claims, and ball levels.

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
- `npm run test:run`: Run the Vitest suite once (used by CI).
- `npm test`: Run Vitest in watch mode.
- `npm run test:coverage`: Run tests with a coverage report.

### Documentation

All source files are fully documented with JSDoc/TSDoc comments. You can inspect the code to see detailed descriptions of functions, parameters, and types.

## 📄 License

MIT
