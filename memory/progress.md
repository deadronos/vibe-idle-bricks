# Progress: Idle Bricks

## What Works

### Core Gameplay ✅

- `GameScene` and `CanvasGame` use `BoardSimulation` as the store/effects adapter over the pure `src/game/model/` board core; `BallPhysics` remains a compatibility wrapper
- The core owns fixed-step movement, wall/brick collisions, Decimal damage, reward events, explosions, targeting, and click damage without React/Zustand/Phaser/browser APIs
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
- Tier progression (every 100 bricks, with no tier cap)
- Prestige system with a fixed 10,000-brick goal and a ×1.25 damage and coin multiplier per level; upgrades, Blueprints, achievements, and the permanent prestige tree are kept across prestiges
- Prestige tree with uncapped Might (damage), Fortune (live/simulated coins), and Insight (idle/offline coins) nodes; costs grow by 1.6× and effects by 1.1× per level
- Speed, damage, and coin multiplier upgrades

### Persistence ✅

- Auto-save every 30 seconds, on `pagehide`, and when the tab becomes hidden
- localStorage save/load
- Background returns of at least 60 seconds grant idle income once through `applyIdleEarnings`, capped at 24 hours
- Offline earnings use 50% of the measured-or-fallback live rate; the same rolling 60-second rate powers the Stats HUD and Shop ETAs
- Save hydration now clamps all upgrade fields and safely defaults malformed values
- Save validation rejects future versions and sanitizes NaN/Infinity, negative values, oversized prestige/tier, and out-of-range ball costs; writes are versioned and storage failures surface a toast
- Version 6 saves persist prestige-tree levels, lifetime credited coins, best tier, and bounded active playtime; v0–v5 saves migrate safely

### UI ✅

- Stats display (coins, bricks, balls)
- Shop panel with ball purchases
- Upgrade buttons with costs
- Prestige button with progress indicator and permanent Blueprint tree cards
- Footer Records dialog with lifetime coins, total bricks, best/current tier, run bricks, prestiges, Blueprints, and active playtime
- Keyboard shortcuts ignore interactive controls so Space activates a focused button instead of pausing
- Audio unlocks from the first gesture; ball/brick/coin cues have a 30 ms cooldown and an 8-voice, 600 ms cap
- Explosions use a faint core with a bright rim; ball types have distinct silhouettes (ring, hexagon, star, spikes, crosshair)
- Canvas2D spike reduced board JS by 96.3% and sharpened DPR 2 text, but was slower at 50 balls; Phaser remains the production renderer for Batch 5, with the simulation extracted to `BoardSimulation`

## What's Left to Build

### Simulation follow-ups (Batch 5 Stages 2–4)

- [ ] 10 Hz immutable UI snapshot bus and renderer snapshot reads (store-write budget not yet solved)
- [ ] Versioned board save/restore with seed and validated state hydration
- [ ] Deterministic offline board fast-forward using the pure core

### High Priority

- [x] Sound effects (Shipped in PR2, commit `11c9f5b`)
- [x] Pause functionality (Shipped in PR1, commit `8f05ebd`)
- [x] Mobile-friendly touch controls (Shipped in PR3, commit `59106f6`)

### Medium Priority

- [x] Achievements system (Shipped in PR3, commit `59106f6` — 18 achievements, gallery modal, toasts, persisted in save); each unlock now grants one-time Blueprints shown in the modal/toast
- [x] Shop ball rows support a **Max** purchase up to `MAX_BALLS`
- [x] Gold bricks pay 5×; armored bricks have 2× health and resist non-piercing hits (heavy/plasma/explosive pierce)
- [x] Click a brick to chip it and mark it as a priority target for targeting balls; idle fallback targets the weakest brick
- [x] Optional auto-buy buys affordable upgrades/balls once per second while keeping a 50% coin reserve
- [x] Run goals at 100/500/1,000 bricks award Blueprints once per run, show Stats progress, and reset on prestige
- [x] Per-ball-type levels purchased with coins: damage for every type, Fast speed, visible Shop effects, permanent through prestige
- [ ] Statistics/history screen (Deferred; not in PR3)
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

### Latest Toolchain (2026-11-26)

- React 19.3.0 / React-DOM 19.3.0
- Phaser 4.2.1 (lazy-loaded)
- Vite 8.3.3 + Vitest 5.0.3
- TypeScript 6.0.3 (strict, `erasableSyntaxOnly`)
- ESLint 10.12.0 + typescript-eslint 8.71.1
- jsdom 30.1.2
- **Test count**: 532 passing across 46 files
- **Core coverage**: 99.41% statements (170/171), 100% lines/functions, 87.34% branches
- **Board publication**: at most 10 store mirror updates per second; renderers read live runtime state
- **CI**: `.github/workflows/ci.yml` runs lint, typecheck, `test:run`, and build on PRs and `main`

## Known Issues

- `incrementBricksBroken` now updates `totalBricksBroken` per-brick; prestige no longer
  double-counts. Achievement conditions reference `totalBricksBroken` as a lifetime
  total, so this fix is required for `first_brick`, `hundred_bricks`, etc. to ever
  fire. Old saves migrated transparently (the per-brick update simply adds to the
  persisted value).

## PR3 Highlights (commit `59106f6`)

- **Mobile polish**: viewport meta tightened (`viewport-fit=cover`), `touch-action: manipulation` on interactive elements, `touch-action: none` on game canvas, `env(safe-area-inset-*)` on `.game-container`.
- **Achievement system**: 18 milestone achievements (first_brick, hundred_bricks, thousand_bricks, ten_thousand_bricks, first_prestige, three_prestiges, first_purchase, buy_fast, buy_heavy, buy_plasma, buy_explosive, buy_sniper, tier_5/10/20, first_upgrade, max_speed, max_damage) with gallery modal, success toasts, and per-save persistence.
- **State pattern**: `unlockedAchievements: Record<string, number>` (id → unlock ms) and `pendingAchievementUnlocks: string[]` in-memory queue drained by `useAchievementToasts` hook.

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
