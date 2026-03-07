# [DESIGN005] - Game Loop Hot Path Optimization

**Status:** Implemented  
**Created:** 2026-03-07  
**Author:** AI Agent

## 1. Overview

This design addresses issue #29 by reducing hot-path allocations and store churn inside the Phaser gameplay loop while improving maintainability. The original `GameScene.ts` combined simulation, rendering, effects, and brick generation in one file and explosive-ball damage performed repeated full-state writes while scanning every brick.

## 2. Requirements

- **WHEN** explosive damage is applied, **THE SYSTEM SHALL** limit candidate bricks to the explosion bounds instead of scanning the full brick list.  
  **Acceptance:** `SpatialGrid.queryBounds()` is used for explosion candidate lookup.
- **WHEN** multiple bricks are damaged in the same simulation tick, **THE SYSTEM SHALL** apply those changes in a single brick-state update.  
  **Acceptance:** `applyBrickDamageBatch()` updates the brick list once and returns per-brick results.
- **WHEN** the game renders transient effects each frame, **THE SYSTEM SHALL** reuse graphics/text objects instead of recreating them unnecessarily.  
  **Acceptance:** explosions render through one shared graphics object and floating text uses pooling.
- **WHEN** responsibilities are refactored out of `GameScene.ts`, **THE SYSTEM SHALL** preserve gameplay behavior and existing progression systems.  
  **Acceptance:** tests for collisions/rewards/prestige/save-load continue to pass along with lint and build.

## 3. Architecture

```text
GameScene (orchestrator)
├── BrickManager      # brick layout/generation
├── BallRenderer      # persistent ball graphics
├── BrickRenderer     # persistent brick graphics + selective redraw
├── GameEffects       # particles, floating text pool, explosion overlay
└── SpatialGrid       # collision candidates for ball and explosion bounds
```

## 4. Key Decisions

### 4.1 Batched brick damage

A new `applyBrickDamageBatch()` store action handles multiple brick updates in one pass. This removes the repeated brick-array rewrites that explosive-ball damage previously triggered.

### 4.2 Explosion candidate narrowing

`SpatialGrid` now exposes `queryBounds(minX, minY, maxX, maxY)` so explosions only inspect bricks near the blast radius.

### 4.3 Rendering/effects extraction

`GameScene.ts` now coordinates specialized helpers rather than directly owning every graphics map and effect implementation. This isolates hot-path responsibilities without changing external gameplay APIs.

### 4.4 Lower allocation rendering

- Ball graphics remain persistent per ball ID.
- Brick graphics redraw only when the brick object changes.
- Explosion rendering uses a single shared graphics object.
- Floating text is pooled instead of created/destroyed every time.

## 5. Risks & Mitigations

- **Risk:** Behavior drift in collision rewards or explosive damage.  
  **Mitigation:** Preserve the direct-hit flow, add regression tests for batch damage, and run the full validation suite.
- **Risk:** Hidden dependencies on `GameScene` helper methods.  
  **Mitigation:** Keep public wrapper methods such as `renderBalls`, `renderBricks`, `renderExplosions`, and `updateFloatingTexts`.
- **Risk:** Store mutation side effects from simulation updates.  
  **Mitigation:** Ball updates still end with a store write; tests and build validation confirm no regressions.

## 6. Validation

Validated on 2026-03-07 with:

- `npm run test:run`
- `npm run lint`
- `npm run build`

All passed successfully.
