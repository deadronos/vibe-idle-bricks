# AGENTS.md — AI Agent Guidelines for Idle Bricks

This document provides instructions for AI coding agents working on this project.

> **See also:** [.github/copilot-instructions.md](.github/copilot-instructions.md) for additional project guidance, patterns, and conventions.

## Important
Before finishing after making code changes, ensure the relevant validation checks pass for the scope of the change:

- All applicable tests pass (`npm run test` or focused test commands)
- TypeScript compiles without errors (`npm run build` or `npm run typecheck`)
- Linting passes (`npm run lint`)

## Project Overview

**Idle Bricks** is an idle/incremental breakout-style game built with:

- **React 19** — UI layer
- **Phaser 3** — Game engine (physics, rendering)
- **Zustand** — State management
- **TypeScript** — Type safety
- **Vite** — Build tooling

## Architecture

```text
React UI Layer (App.tsx, Shop.tsx, Stats.tsx)
        ↓ reads/writes via hooks
Zustand Store (gameStore.ts) ← single source of truth
        ↑ reads/writes directly
Phaser Game Engine (GameScene.ts)
```

### Communication Pattern

_How to access the store depends on the runtime context:_

- **React components:** use `useGameStore((state) => state.property)` with selectors.
- **Phaser game code:** use `useGameStore.getState()` and `useGameStore.setState()` directly.

## Key Files

The main source files are:

- `src/store/gameStore.ts` — all game state and actions
- `src/game/GameScene.ts` — Phaser physics, rendering, collisions
- `src/types/game.ts` — type definitions, `BALL_TYPES`, constants
- `src/utils/helpers.ts` — pure utility functions
- `src/components/` — React UI components

## Critical Constraints

### Type Safety

- **No `any` usage**: Do not use the `any` type. Always define proper interfaces or types for data structures. Use `unknown` if the type is truly uncertain, and then narrow it safely.
- **Strict Typing**: Ensure all functions and variables are explicitly typed where inference is insufficient.

### Large Number Handling

All numeric game values (coins, health, damage) **must** use `break_infinity.js` Decimal:

```typescript
import Decimal from 'break_infinity.js';
const value = new Decimal(100);
value.add(1).mul(2).gte(50); // chainable API
```

**Never use raw `number`** for values that can grow unbounded.

### ID Generation

Always use `generateId()` from `src/utils/helpers.ts` for entity IDs. Never use array indices.

### Null Checks

`damageBrick()` returns `{ destroyed: boolean, value: Decimal } | null`. Always check for null before accessing properties.

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + production build
npm run lint     # ESLint
npm run typecheck # Run TypeScript type checking without emit
npm run preview  # Preview production build
```

## Adding New Features

### New Ball Type

1. Add to `BallType` union in `src/types/game.ts`
2. Add config to `BALL_TYPES` object (speed, damage, color, abilities, cost)
3. Update `getDefaultBallCosts()` in `src/store/gameStore.ts`
4. Implement behaviors in `GameScene.ts`

### New Upgrade

1. Add to `UpgradeType` in `src/types/game.ts`
2. Add upgrade logic in `src/store/gameStore.ts`
3. Add UI in `src/components/Shop.tsx`

## Workflow Guidelines

See [.github/instructions/spec-driven-workflow-v1.instructions.md](.github/instructions/spec-driven-workflow-v1.instructions.md) for the full specification.

### Small Changes (bug fixes, typos, minor refactors)

- Implement directly
- Update `memory/activeContext.md` if context changes
- If the change exposes a reusable lesson, add it to the relevant docs or Memory Bank note instead of leaving it only in chat history

### Medium/Large Changes (new features, architecture)

Follow the 6-phase spec-driven workflow:

1. **Analyze** — Gather facts, write EARS-style requirements
2. **Design** — Create design doc with diagrams and interfaces
3. **Implement** — Small commits with tests
4. **Validate** — Run tests and manual verification
5. **Reflect** — Refactor, update docs, log technical debt
6. **Handoff** — Prepare PR with summary

Store designs in `memory/designs/`, tasks in `memory/tasks/`.

## Documentation and learning loop

- Before and after meaningful changes, review the relevant guidance in `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/`, and `docs/` to catch drift, duplication, or contradictions.
- If a bug fix, test failure, or investigation reveals a reusable lesson, capture it in the most relevant Memory Bank file and, when it affects project behavior or workflow, mirror it in the appropriate doc under `docs/` or `.github/`.
- Prefer updating the authoritative instruction or documentation source over repeating the same guidance in multiple places.

## Memory Bank

This project uses a structured Memory Bank in `/memory/` for context persistence. See [.github/instructions/memory-bank.instructions.md](.github/instructions/memory-bank.instructions.md) for full documentation.

Key Memory Bank files:

- `memory/activeContext.md` — current work focus and recent changes
- `memory/progress.md` — what works and what’s left
- `memory/tasks/_index.md` — task tracking index
- `memory/projectbrief.md` — core requirements and goals
- `memory/techContext.md` — tech stack and constraints
- `memory/systemPatterns.md` — architecture and patterns

**Read relevant Memory Bank files** at the start of work to recover context.

## Available Agents

The most relevant agents are:

- `Conductor` — orchestrates the planning → implementation → review cycle
- `planning-subagent` — researches context and outlines plans
- `implement-subagent` — executes delegated implementation tasks
- `code-review-subagent` — reviews completed implementation
- `Plan` — researches and outlines multi-step plans

## Testing

- **Vitest** for unit testing (`npm run test`)
- Tests located in `tests/` directory
- Manual testing via `npm run dev`
- Validate TypeScript with `npm run build`
- Type-check only via `npm run typecheck`
- Lint with `npm run lint`

## Auto-Save

Game auto-saves every 30 seconds via Phaser timer. Save format uses stringified Decimals for large number support.
