# Copilot Instructions for Idle Bricks

## Project Overview

An idle/incremental breakout-style game using **React 19 + Phaser 3 + Zustand + TypeScript + Vite**. Balls automatically break bricks, earn coins, and players purchase upgrades/new balls.

## Architecture

```
React UI Layer (App.tsx, Shop.tsx, Stats.tsx)
        ↓ reads/writes via hooks
Zustand Store (gameStore.ts) ← single source of truth
        ↑ reads/writes directly
Phaser Game Engine (GameScene.ts)
```

### Key Pattern: Store ↔ Phaser Communication

- **Phaser reads/writes store directly** via `useGameStore.getState()` and `useGameStore.setState()` (not hooks)
- **React components use hooks**: `useGameStore((state) => state.property)` with selectors
- Game loop updates ball positions in store; React UI auto-updates via Zustand subscriptions

## Large Number Handling

All numeric game values use `break_infinity.js` Decimal:

```typescript
import Decimal from 'break_infinity.js';
const health = new Decimal(tier * 3);
health.add(1).mul(2).gte(100); // chainable, comparison methods
```

Never use raw `number` for coins, health, damage, or values that can grow unbounded.

## File Conventions

| Location | Purpose |
|----------|---------|
| `src/store/gameStore.ts` | All game state and actions |
| `src/game/GameScene.ts` | Phaser physics, rendering, collisions |
| `src/types/game.ts` | Type definitions, game constants (`BALL_TYPES`, thresholds) |
| `src/utils/helpers.ts` | Pure utility functions |
| `src/components/` | React UI components (Shop, Stats, Footer) |

## Adding New Ball Types

1. Add type to `BallType` union in `src/types/game.ts`
2. Add config to `BALL_TYPES` object with: `speed`, `damage`, `color`, `pierce`, `explosive`, `targeting`, `baseCost`, `description`
3. Update `getDefaultBallCosts()` in `src/store/gameStore.ts`
4. Special behaviors implemented in `GameScene.ts`: `checkBrickCollisions()`, `seekWeakestBrick()`

## Development Commands

```bash
npm run dev      # Start dev server (Vite HMR)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
npm run typecheck # TypeScript type checking without emit
npm run test     # Run Vitest unit tests
npm run preview  # Preview production build
```

## Critical Patterns

### Brick Collision Returns

`damageBrick()` returns `{ destroyed: boolean, value: Decimal } | null` - always check null before accessing properties.

### ID Generation

Use `generateId()` from helpers for all entity IDs (balls, bricks). Never use array indices as keys.

### Auto-save

Game auto-saves every 30s via Phaser timer. Manual save/load available in store. Save format uses stringified Decimals.

### Prestige System

Reset triggered at 10,000 bricks broken. Resets: coins, upgrades, balls, tier. Keeps: `prestigeLevel`, `totalBricksBroken`.

## Workflow Guidelines

**For small/documentation-only tasks** (bug fixes, typos, minor refactors):
- Implement directly without formal workflow
- Update `memory/activeContext.md` if context changes

**For medium/large changes** (new features, architecture changes, multi-file edits):
- Follow the 6-phase spec-driven workflow in `.github/instructions/spec-driven-workflow-v1.instructions.md`
- Analyze → Design → Implement → Validate → Reflect → Handoff
- Store designs in `memory/designs/`, tasks in `memory/tasks/`

## Memory Bank

Project uses structured Memory Bank in `/memory/` for context persistence per `.github/instructions/memory-bank.instructions.md`.

Key files to check:
- `memory/activeContext.md` - Current work focus and recent changes
- `memory/tasks/_index.md` - Task tracking index
- `memory/progress.md` - What works and what's left
