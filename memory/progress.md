# Progress: Idle Bricks

## What Works

### Core Gameplay ✅

- `GameScene` now uses the shared `BallPhysics` helper for movement, targeting, and collisions
- Game loop hot paths optimized with bounded explosion queries, batched brick damage, and extracted render/effect helpers
- Ball physics with wall bouncing
- Brick collision detection and damage
- Multiple ball types with unique behaviors:
  - Basic: Standard ball
  - Fast: 2x speed
  - Heavy: 3x damage, slower
  - Plasma: Pierces through bricks
  - Explosive: AOE damage on hit
  - Sniper: Targets weakest bricks

### Progression ✅

- Coin earning based on brick value
- Tier progression (every 100 bricks up to tier 20)
- Prestige system with scaling thresholds (10k → 20k → 40k)
- Speed, damage, and coin multiplier upgrades

### Persistence ✅

- Auto-save every 30 seconds
- localStorage save/load
- Offline earnings calculation
- Save hydration now clamps all upgrade fields and safely defaults malformed values

### UI ✅

- Stats display (coins, bricks, balls)
- Shop panel with ball purchases
- Upgrade buttons with costs
- Prestige button with progress indicator

## What's Left to Build

### High Priority

- [x] Sound effects (Shipped in PR2, commit `11c9f5b`)
- [x] Pause functionality (Shipped in PR1, commit `8f05ebd`)
- [ ] Mobile-friendly touch controls (PR3, pending)

### Medium Priority

- [ ] Achievements system (PR3, pending)
- [ ] Statistics/history screen (PR3, pending)
- [ ] More ball types
- [ ] Special brick types (bonus coins, power-ups)
- [x] Visual particle effects (Completed in TASK004)
- [x] Settings menu (Shipped in PR2)
- [x] Colorblind mode (Shipped in PR2)

### Low Priority

- [ ] Leaderboards
- [ ] Cloud save
- [ ] Multiple save slots

## Current Status

**Phase**: MVP Complete  
**Version**: 1.0.0  
**State**: Playable and functional

### Latest Toolchain (post TASK008)

- React 19.2.7 / React-DOM 19.2.7
- Phaser 4.1.0 (lazy-loaded)
- Vite 8.0.16 + Vitest 4.1.8
- TypeScript 6.0.3 (strict, `erasableSyntaxOnly`)
- ESLint 10.4.1 + typescript-eslint 8.61.0
- jsdom 29.1.1

## Known Issues

1. **Mobile**: No explicit touch event handling
2. **Edge Case**: Very high ball counts may cause frame drops
3. **UI**: Shop doesn't scroll on small screens

## Milestones

| Milestone | Status | Date |
| --------- | ------ | ---- |
| Project setup | ✅ Complete | — |
| Core physics | ✅ Complete | — |
| Ball types | ✅ Complete | — |
| Shop/upgrades | ✅ Complete | — |
| Prestige | ✅ Complete | — |
| Save/Load | ✅ Complete | — |
| Memory Bank Init | ✅ Complete | 2025-11-28 |
