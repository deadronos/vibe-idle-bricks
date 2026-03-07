# [TASK006] - Startup Bundle Optimization

**Status:** Completed  
**Added:** 2026-03-07  
**Updated:** 2026-03-07  
**Design:** [DESIGN006-startup-bundle-optimization.md](../designs/DESIGN006-startup-bundle-optimization.md)

## Original Request

Address GitHub issue #28: optimize startup bundle and load performance, reduce the oversized startup chunk, keep lazy-loading UX polished, and then push the branch and open a pull request.

## Thought Process

The baseline build shows the entire game engine ships in the initial `index` chunk (`1,459.55 kB`). Because Phaser is the dominant heavy dependency and the React shell is comparatively light, the safest improvement is to defer the game engine behind a lazy UI boundary and keep the rest of the interface available immediately.

## Implementation Plan

- [x] Inspect baseline build output and locate the eager Phaser import path
- [x] Add a lazy game-surface boundary with polished fallback UI
- [x] Ensure the Phaser/game modules load asynchronously and preserve cleanup behavior
- [x] Update tests for the lazy-render path
- [x] Run full validation and compare build output
- [x] Push branch and open PR

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Measure baseline bundle | Complete | 2026-03-07 | `index` chunk is 1,459.55 kB with Vite warning |
| 1.2 | Design lazy-loading approach | Complete | 2026-03-07 | Phaser deferred behind App-level lazy boundary |
| 1.3 | Implement UI + chunk split | Completed | 2026-03-07 | Added App-level lazy boundary and polished fallback |
| 1.4 | Update tests | Completed | 2026-03-07 | App test now awaits lazy game surface |
| 1.5 | Validate repo scripts | Completed | 2026-03-07 | Lint, typecheck, tests, and build all passed |
| 1.6 | Push branch and PR | Completed | 2026-03-07 | Branch pushed and PR #34 opened |

## Progress Log

### 2026-03-07

- Fetched and reviewed GitHub issue #28.
- Captured the baseline production build warning and startup bundle size.
- Identified the eager import chain `App.tsx` → `PhaserGame.tsx` → `phaser` / `src/game` as the primary startup cost.
- Selected an App-level lazy-loading boundary with a polished fallback as the implementation strategy.
- Implemented a Suspense-based loading boundary in `App.tsx` and styled the deferred game fallback in `App.css`.
- Kept Phaser isolated in explicit `game-engine` and `phaser-engine` async chunks via `vite.config.ts`.
- Verified the startup bundle dropped from `1,459.55 kB` to `202.92 kB` and the build warning is now explicitly justified in config.
- Verified `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run build` all pass.
- Pushed branch `deadronos/issue28` and opened [PR #34](https://github.com/deadronos/vibe-idle-bricks/pull/34).
