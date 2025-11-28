# 🧱 Idle Bricks

An idle/incremental breakout style game where you use multiple balls of different strengths, speeds, and special abilities to smash a million bricks (eventually)!

## 🎮 How to Play

1. **Open the game** - Simply open `index.html` in a modern web browser, or run `npm start`
2. **Watch the balls bounce** - Balls automatically break bricks and earn you coins
3. **Buy more balls** - Use coins to purchase different types of balls with unique abilities
4. **Upgrade your balls** - Increase speed, damage, and coin earnings
5. **Prestige** - After breaking 10,000 bricks, prestige for permanent bonuses

## 🎾 Ball Types

| Ball | Cost | Description |
|------|------|-------------|
| **Basic Ball** | 10 | Standard ball, nothing special |
| **Fast Ball** | 50 | 2x speed for faster brick breaking |
| **Heavy Ball** | 100 | 3x damage to break tougher bricks quickly |
| **Plasma Ball** | 500 | Pierces through bricks without bouncing |
| **Explosive Ball** | 1,000 | Damages nearby bricks on impact |
| **Sniper Ball** | 2,500 | Automatically targets the weakest bricks |

## ⬆️ Upgrades

- **Speed Boost** - All balls move 10% faster
- **Power Boost** - All balls deal 10% more damage
- **Coin Multiplier** - Earn 10% more coins

## 🌟 Prestige System

After breaking 10,000 bricks, you can **prestige** to:
- Reset your progress (coins, balls, upgrades)
- Gain a permanent +25% coin bonus
- Each prestige stacks for greater bonuses!

## 💾 Save System

- Game auto-saves every 30 seconds
- Manual save with the "Save" button
- Progress is stored in your browser's localStorage
- Offline progress is calculated when you return

## 🛠️ Running the Game

### Option 1: Direct Browser
Simply open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

### Option 2: Local Server
```bash
npm start
```
Then open http://localhost:3000 in your browser.

## 🎯 Goal

Break a million bricks! The game features:
- Progressively tougher bricks with higher tiers
- Scaling costs for balls and upgrades
- Strategic decisions on which balls and upgrades to buy
- Prestige mechanics for long-term progression

## 📁 Project Structure

```
vibe-idle-bricks/
├── index.html      # Main HTML file
├── css/
│   └── style.css   # Game styling
├── js/
│   ├── main.js     # Entry point and event handlers
│   ├── game.js     # Main game loop and state
│   ├── ball.js     # Ball class with different types
│   └── brick.js    # Brick class and brick manager
├── package.json    # NPM configuration
└── README.md       # This file
```

## 🎨 Features

- ✅ Multiple ball types with unique abilities
- ✅ Upgrade system for speed, damage, and coins
- ✅ Prestige system for long-term progression
- ✅ Auto-save and manual save
- ✅ Offline progress calculation
- ✅ Responsive design
- ✅ Visual effects (explosions, glowing balls)
- ✅ Progressive brick tiers

## 📜 License

MIT License