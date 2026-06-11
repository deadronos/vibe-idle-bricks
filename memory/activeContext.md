# Active Context: Idle Bricks

## Current Work Focus

TASK009 (Suggestion Set) is in progress on branch `feat/suggestion-set`. PR1
(pause) and PR2 (sound + settings + accessibility) are stacked on PR #46;
PR3 (mobile/touch + achievements) is next.

## Recent Changes

- Shipped PR1 + PR2 stacked on PR #46:
  - PR1 (`8f05ebd`): pause control — header button, keyboard
    shortcuts (Space/P/Esc), `aria-live` indicator, overlay. 13
    new tests.
  - PR2 (`11c9f5b`): Web Audio SFX (5 procedural cues), persistent
    settings store, SettingsDrawer in footer, colorblind-friendly
    tier colors, reduced-motion gating for particles/shake. 21 new
    tests; 268/268 total.
- Completed TASK008 dependency upgrade & error fix-up (PR #45):
  - bumped 19 packages within their existing `^` semver ranges (lucide-react, phaser, react/react-dom, zustand, vite, vitest, typescript, eslint, etc.)
  - `npm audit fix` cleared the moderate `brace-expansion` advisory; audit is now clean
  - validation re-run after upgrade: typecheck ✓, lint ✓, 234/234 tests ✓, `vite build` ✓ in 682 ms with identical chunk layout to `main`
  - no application code changes were required
- Completed branch review follow-up fixes:
  - hardened save hydration so partial/invalid upgrade fields default safely
  - removed duplicate tuning constants from `src/game/constants.ts`
  - formatted/clamped offline earnings before showing the welcome-back toast
  - wired `GameScene` to the shared `BallPhysics` helper and restored pointer handling
  - added regression tests for malformed upgrades and offline earnings edge cases

- Addressed issue #28 by optimizing startup bundle loading:
  - lazy-loaded `PhaserGame` behind a React `Suspense` boundary in `App.tsx`
  - added a polished loading-state UI in `App.css` for deferred engine boot
  - split Vite output into `index`, `game-engine`, and `phaser-engine` chunks
  - reduced the startup bundle from ~1.46 MB to ~203 kB
  - documented the deferred Phaser chunk warning threshold in `vite.config.ts`
- Addressed issue #29 by optimizing `src/game/GameScene.ts` hot paths:
  - extracted `BrickManager`, `GameEffects`, and `GameRenderers`
  - added `SpatialGrid.queryBounds()` for bounded explosion lookups
  - added batched brick damage updates in `gameStore.ts`
  - reduced transient effect allocations with pooled floating text and shared explosion graphics
  - added regression tests for bounds querying and batched brick damage

- Fixed TypeScript errors in `GameScene.ts`:
  - Removed unused `trailGraphics` property
  - Removed invalid `add: false` property from `make.graphics`
  - Fixed `BallTypeConfig` type errors by using `ball.type` instead of `config.type`
- Fixed test suite failures:
  - Updated `App.test.tsx` and `Shop.test.tsx` to match new Lucide icon usage
  - Verified all tests pass with `npm run test:run`
  - Verified typecheck and linting pass
- Normalized hydrated save data in `gameStore.ts`:
  - clamp loaded ball counts to `MAX_BALLS`
  - clamp loaded speed upgrade to `MAX_SPEED_UPGRADE`
  - added regression tests for both `load()` and `importSave()` paths
- Implemented TASK004 Visual Polish:
  - Added `lucide-react` icons to UI
  - Integrated "Rajdhani" Google Font
  - Added particle effects, screen shake, and ball trails
  - Implemented floating text for damage/coins
  - Optimized text rendering in `GameScene.ts` (fixed performance bottleneck)
- Created Memory Bank structure with all core files
- Documented project architecture and patterns
- Established task tracking system
- Added GitHub Pages deployment workflow (`.github/workflows/deploy.yml`)
- Configured Vite base path for GitHub Pages deployment
- Implemented TASK003 balance pass (ball costs, tier cap 20, prestige scaling)

## Current State

The game is fully playable with:

- ✅ 6 ball types with unique behaviors
- ✅ Brick generation and tier progression (1-20)
- ✅ Shop for balls and upgrades
- ✅ Prestige system (scaling thresholds)
- ✅ Auto-save every 30 seconds
- ✅ Offline earnings on return
- ✅ Responsive canvas sizing
- ✅ Visual effects (particles, shake, trails)

## Next Steps

TASK009 PR3 (mobile + achievements):

1. Tighten viewport meta tag in `index.html`.
2. Add `touch-action: manipulation` and 44px min size on
   `.buy-btn`/`.tab-btn`/`.game-canvas`.
3. Vitest test mounting `<Shop>` at 360px and asserting no
   horizontal overflow.
4. Add `src/types/achievements.ts` with achievement definitions.
5. Add `achievements: Record<string, boolean>` and stats selector to
   the game store; wire unlock events to toasts.
6. Add a stats route/modal showing unlocked vs locked achievements.
7. Validate, commit, push, open PR.

## Active Decisions

| Decision | Status | Notes |
| -------- | ------ | ----- |
| State management | Resolved | Zustand with selectors |
| Large numbers | Resolved | break_infinity.js Decimal |
| Game engine | Resolved | Phaser 3 |
| Build tool | Resolved | Vite 7 |

## Known Considerations

- `GameScene.ts` is now an orchestrator; rendering/effects/brick generation live in dedicated helpers under `src/game/`
- Phaser is intentionally deferred from the initial startup path; the remaining large async engine chunk is justified in `vite.config.ts`
- Explosive balls may cause performance issues with many simultaneous explosions (mitigated by particle pooling/limits)
- Mobile touch events not explicitly handled (relies on Phaser defaults; PR3 will tighten)
- Save hydration must normalize out-of-range values; purchase/UI caps alone are not enough to prevent oversized loaded state
- Settings are persisted under `idleBricksSettings` (separate from the game save) so `reset()` does not wipe user preferences
- Audio module is a `globalThis` singleton so HMR / dynamic imports / test module duplication share state
