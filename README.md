# 🧱 Idle Bricks

An idle/incremental breakout-style game where balls autonomously smash through bricks while you upgrade and expand your arsenal.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Phaser](https://img.shields.io/badge/Phaser-3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 How to Play

1. **Watch balls bounce** — They automatically break bricks and earn coins
2. **Buy upgrades** — Increase speed, damage, and coin multipliers
3. **Unlock new balls** — Each type has unique abilities
4. **Tier up** — Breaking 100 bricks increases brick tier (harder but more valuable)
5. **Prestige** — Reset at 10,000 bricks for permanent +25% coin bonus

## 🎱 Ball Types

| Ball | Cost | Special Ability |
|------|------|-----------------|
| ⚪ Basic | 10 | Standard starter ball |
| 🔵 Fast | 50 | 2× speed for more hits |
| 🟠 Heavy | 100 | 3× damage, slower movement |
| 🟣 Plasma | 500 | Pierces through bricks |
| 🔴 Explosive | 1,000 | Area-of-effect damage |
| 🟢 Sniper | 2,500 | Targets weakest bricks |

## ⚡ Features

- **Autonomous gameplay** — Runs itself while you strategize upgrades
- **6 unique ball types** — Each with distinct physics and abilities
- **10 brick tiers** — Progressive difficulty with scaling rewards
- **Prestige system** — Permanent bonuses for long-term progression
- **Auto-save** — Progress saved every 30 seconds + offline earnings
- **Large number support** — Handles arbitrarily large values with break_infinity.js

## 🛠️ Tech Stack

- **React 19** — UI components and state display
- **Phaser 3** — Game engine for physics and rendering
- **Zustand** — Centralized state management
- **TypeScript** — Type-safe codebase
- **Vite** — Fast development and builds

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```text
src/
├── components/     # React UI (Shop, Stats, Footer)
├── game/           # Phaser GameScene and physics
├── store/          # Zustand game state
├── types/          # TypeScript definitions
└── utils/          # Helper functions
```

## 📄 License

MIT
