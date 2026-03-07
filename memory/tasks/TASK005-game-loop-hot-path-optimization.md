# [TASK005] - Game Loop Hot Path Optimization

**Status:** Completed  
**Added:** 2026-03-07  
**Updated:** 2026-03-07  
**Design:** [DESIGN005-game-loop-hot-path-optimization.md](../designs/DESIGN005-game-loop-hot-path-optimization.md)

## Original Request

Address GitHub issue #29: optimize and refactor Phaser game loop hot paths in `src/game/GameScene.ts` while preserving gameplay behavior and passing lint, typecheck, tests, and build.

## Thought Process

The biggest low-risk bottlenecks were not raw math operations; they were repeated object churn and repeated store updates on the brick path:

1. `GameScene.ts` mixed orchestration, rendering, effects, and brick generation.
2. Explosions scanned every brick and called `damageBrick()` repeatedly, which caused repeated brick-array rewrites and spatial-grid rebuilds.
3. Explosion visuals recreated graphics objects every frame.
4. Floating text creation/destruction happened continuously in active gameplay.

The fix focused on isolating hot-path responsibilities and removing the most avoidable work without changing core game rules.

## Implementation Plan

- [x] Extract brick generation into `BrickManager`
- [x] Extract renderers/effects out of `GameScene`
- [x] Add bounded spatial-grid query for explosions
- [x] Batch multi-brick damage in the store
- [x] Add regression tests for grid bounds and batched damage
- [x] Run full validation suite

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Inspect `GameScene` hotspots | Completed | 2026-03-07 | Identified explosion scans/store churn/render allocations |
| 1.2 | Extract helper classes | Completed | 2026-03-07 | Added `BrickManager`, `GameEffects`, `GameRenderers` |
| 1.3 | Optimize explosion query path | Completed | 2026-03-07 | Added `SpatialGrid.queryBounds()` |
| 1.4 | Batch brick damage updates | Completed | 2026-03-07 | Added `applyBrickDamageBatch()` |
| 1.5 | Add regression tests | Completed | 2026-03-07 | Covered bounds query and batched store writes |
| 1.6 | Validate repo scripts | Completed | 2026-03-07 | Tests, lint, and build all passed |

## Progress Log

### 2026-03-07

- Fetched and analyzed issue #29 requirements from GitHub.
- Refactored `GameScene.ts` into an orchestration layer backed by `BrickManager`, `BallRenderer`, `BrickRenderer`, and `GameEffects`.
- Added `SpatialGrid.queryBounds()` so explosions only inspect nearby bricks.
- Added `applyBrickDamageBatch()` to collapse multi-brick damage into a single brick-state update.
- Added regression tests in `tests/game/SpatialGrid.test.ts` and `tests/store/gameStore.test.ts`.
- Verified `npm run test:run`, `npm run lint`, and `npm run build` all pass.
