# Active Context: Idle Bricks

## Current Work Focus

PR #59 (visuals/floating-text) is **in flight**: coin popups are gold with a
`¢` suffix, damage is red, popups are capped at 8 (coins evict the oldest
damage) and jitter slightly so same-brick hits stay readable. #56 (HiDPI) is
blocked on Phaser 4: the engine no longer exposes a game-level `resolution`
and the manual backing-store workaround is broken upstream.

TASK009 (Suggestion Set) is **complete** and merged to `main` (merge `20505e0`).

## Recent Changes

- Shipped #59: `GameEffects.showFloatingText` takes `'damage' | 'coin'`,
  colours by kind, `MAX_ACTIVE_FLOATING_TEXTS = 8`, coin popups replace the
  oldest damage popup at the cap, and positions get ±6/±4 px jitter.
- Shipped visuals batch PR #95: `getContrastTextColor()` picks near-black or
  white from WCAG luminance; damaged bricks draw a green/yellow/red HP bar;
  `drawBackground()` adds a floor strip, launch-zone band and side walls;
  `BrickManager.offsetTop` is 20% of height; prestige shows
  `current / threshold bricks this run` and disables at `MAX_PRESTIGE_LEVEL`.
- Shipped reliability PR #94 (merged `b857249`): `clampAccumulator` caps a
  stalled frame at `FIXED_STEP * 5`, `MAX_OFFLINE_SECONDS = 24h` caps idle
  income, and the toast reports `over 24h (max)`. 338 tests.
- Shipped PR #93 (merged `d337e7e`): upgrades start at 50/75/100, grow ×1.10
  (balls stay ×1.15), new games start with 35 coins, upgrade rows show their
  total effect (`×1 → ×1.1`, `Max: ×6`); costs are rebuilt from the parsed
  level on load and one `calculateUpgradeCost` serves buying and loading.
  Design: `memory/designs/DESIGN008-upgrade-curves-and-early-pacing.md`.
- Shipped PR #92 (merged `0ce6e88`, release v0.0.11): brick value
  `floor(tier^1.6)`, health `3*(1+0.25*(tier-1))`, prestige ×1.75 with a fixed
  10,000-brick goal, upgrades kept across prestige. Design:
  `memory/designs/DESIGN007-tier-and-prestige-balance.md`.
- Shipped PRs #88/#90/#91: hit-flash clock, canvas aspect, Stats formatting,
  modal cancel, load-once guard, toast queue, save-on-load, and the mobile
  layout (responsive CSS must stay last in `src/App.css`).

- Completed TASK010 dependency upgrade to latest (branch `chore/deps-upgrade-latest`):
  - bumped all runtime and dev dependencies to their latest releases: react/react-dom 19.3.0, phaser 4.2.1, zustand 5.0.15, lucide-react 1.48.0, vite 8.3.1, vitest/@vitest/* 5.0.2, eslint 10.11.0, jsdom 30.1.1, @testing-library/jest-dom 7.0.1, @types/node 26.6.3, typescript-eslint 8.70.1
  - TypeScript intentionally held at 6.0.3 (latest 6.x): `typescript-eslint@8.70.1` peer range is `>=4.8.4 <6.1.0`, so TypeScript 7 is not yet supported upstream
  - `npm audit fix` cleared 4 transitive advisories (browserslist, @babel/core, @humanfs/node, baseline-browser-mapping); audit is clean (0 vulnerabilities)
  - no application code changes were required
  - validation re-run after upgrade: typecheck ✓, lint ✓, 304/304 tests ✓, `vite build` ✓

- Shipped PR3 (`59106f6`) on PR #46: mobile touch polish + achievement system
  - index.html: viewport meta tightened (`viewport-fit=cover`)
  - App.css: `touch-action: manipulation` on interactive elements, `none` on
    game canvas, `env(safe-area-inset-*)` on `.game-container`
  - types/achievements.ts: 18 milestone achievements with pure condition
    predicates (first_brick, hundred/thousand/ten_thousand_bricks,
    first/three_prestiges, first_purchase, buy_*, tier_5/10/20, first_upgrade,
    max_speed, max_damage)
  - store/gameStore.ts: `unlockedAchievements` (persisted) +
    `pendingAchievementUnlocks` (in-memory queue) wired into
    incrementBricksBroken, buyBall, buyUpgrade, buyMaxUpgrade, prestige
  - components/AchievementsModal.tsx: gallery with summary, locked/unlocked
    cards, recent-first sort
  - components/Footer.tsx: Achievements button (Trophy icon, amber gradient)
  - hooks/useAchievementToasts.ts: subscribes to pending queue, fires success
    toasts, drains queue
  - **Bug fix**: `incrementBricksBroken` now updates `totalBricksBroken` per
    brick. Previously it was only updated at prestige, so `first_brick` and
    similar achievements could never fire. `prestige()` no longer double-counts.
  - 34 new tests (16 type, 10 store, 8 component, 2 mobile); 304/304 total
  - All four gates green: typecheck ✓, lint ✓, test ✓, build ✓

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
| Game engine | Resolved | Phaser 4 |
| Build tool | Resolved | Vite 8 |

## Known Considerations

- `GameScene.ts` is now an orchestrator; rendering/effects/brick generation live in dedicated helpers under `src/game/`
- Phaser is intentionally deferred from the initial startup path; the remaining large async engine chunk is justified in `vite.config.ts`
- Explosive balls may cause performance issues with many simultaneous explosions (mitigated by particle pooling/limits)
- Mobile touch events not explicitly handled (relies on Phaser defaults; PR3 will tighten)
- Save hydration must normalize out-of-range values; purchase/UI caps alone are not enough to prevent oversized loaded state
- Settings are persisted under `idleBricksSettings` (separate from the game save) so `reset()` does not wipe user preferences
- Audio module is a `globalThis` singleton so HMR / dynamic imports / test module duplication share state
