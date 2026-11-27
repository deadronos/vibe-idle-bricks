# Active Context: Idle Bricks

## Current Work Focus

DPR-2 renderer spike (#125) is merged (2026-11-27). At the same 1760×1100
backing store, optimized Canvas measured ~98–100 ms/frame vs Phaser DPR-2
~105–108 ms, while normal blurry Phaser is ~84–87 ms. Canvas currently lacks
production visuals, so the recommendation is Phaser DPR-2 as the #56 fix; no
production renderer switch was made. Design: `memory/designs/DESIGN017-dpr2-renderer-spike.md`.

Batch 7e (**Per-ball progression**) is **complete** (2026-11-27,
PR #124): permanent per-type levels bought with
coins, per-type damage and Fast speed multipliers in the board/offline core,
Shop level/effect/upgrade UI, and save v6. 532 tests across 46 files; #83 is
closed.

Batch 7d (**Run goals**) is **complete** (2026-11-27, PR #123):
100/500/1,000-brick goals award 1/2/3 Blueprints once per run, show progress in
Stats and a toast, reset on prestige, and persist in save v5. The offline
multiplier is covered by the Insight node. 525 tests across 45 files; #85 is
closed.

Batch 7c (**Active focus + auto-buy**) is **complete** (2026-11-27,
PR #122): clicking a brick now marks it as the
priority target for targeting balls, with a yellow focus ring in Phaser and the
Canvas spike; idle play falls back to the weakest brick. Settings gain an
opt-in auto-buy that buys affordable upgrades/balls once per second while
preserving a 50% coin reserve. Settings now hydrate at app start. 519 tests
across 43 files; #84 closed, and Batch 7d later completed #85.

Issue #86 (**Prestige tree and lifetime records**) is **complete**
(2026-11-26, PR #121): uncapped Might/Fortune/Insight Blueprint nodes,
shop cards and purchase controls, lifetime coins/best tier/playtime tracking,
a read-only Footer Records dialog, and `SAVE_VERSION = 4` migration for v0–v3
saves. Fortune flows through the existing board coin multiplier exactly once;
Insight applies after both offline paths. Playtime is save-bound and gaps over
60 seconds are truncated. A review fix also restores achievement Blueprint
rewards in the batched `applyBoardRewards` path. Validation: 510 tests across
42 files, lint, typecheck, production build, and Canvas Vite build pass.
Design: `memory/designs/DESIGN014-prestige-tree-records.md`.

Batch 7b (**Special bricks MVP**) is **complete** (2026-11-26, PR #120):
gold bricks pay 5×, armored bricks have 2× health and take 25% damage from
non-piercing hits, both spawn at 10%, persist in the board save, and have
distinct visuals. 494 tests across 40 files; #82 is closed.

Batch 7a (**Rewards and purchase QoL**) is **complete** (2026-11-26,
PR #119): achievements now grant one-time Blueprints exactly once and show the
reward in the modal/toast, and the Shop has a per-ball **Max** purchase action.
490 tests across 40 files; #66 is closed, while #85 stays open for auto-buy and
run goals. The simulation/economy issues #103, #106, #50, and #52 are closed.

Batch 6 (**Economy redesign**, #106) is **complete** (2026-11-26):
- Headless balance harness (`src/game/model/balanceHarness.ts`, `scripts/balance-report.ts`) with greedy ROI strategy, income-by-tier, and cap-impact reports.
- Removed `MAX_TIER` and `MAX_PRESTIGE_LEVEL` hard caps; added unbounded `Decimal` exponential wall scaling past tier 20 (`1.18^(t-20)` health / `1.12^(t-20)` value).
- Multiplicative `damage` and `coinMult` upgrades (`1.08^level` as `Decimal`); `speed` remains additive and capped at `MAX_SPEED_UPGRADE = 50`.
- Prestige redesigned to `1.25^prestigeLevel` (`Decimal`) + persistent **Blueprints** (`SAVE_VERSION = 3`, v0/v1/v2→v3 migration), shown in Stats and Prestige UI.
- Raised `MAX_BALLS` to `100`. Full suite: 483 tests across 40 files. Design: `memory/designs/DESIGN013-economy-redesign.md`.

Batch 5 (**Simulation core**, #103) is **complete** (2026-11-26):
- Stage 1 (PR #117): platform-free `src/game/model/` core with `BoardSimulation` adapter.
- Stage 2 (PR #118): live 60 fps renderer reads, 10 Hz store board mirror, independent external adoption.
- Stage 3 & reward-write batching: `SAVE_VERSION = 2` board save/restore (dimensions, RNG seed/state, validated stringified-`Decimal` bricks, v0/v1 migration, deterministic ball spawn on restore) and `applyBoardRewards` batching coins/bricks/tier/achievements with the 10 Hz board mirror (`<= 10` total store writes/second; immediate flush on click/resize/pause/save/export/prestige/destroy).
- Stage 4: deterministic headless offline fast-forward (`src/game/model/offline.ts`, bounded 60 s fixed-step simulation + deterministic extrapolation capped at 24h) wired into `applyIdleEarnings` for restored boards.
Design: `memory/designs/DESIGN012-simulation-core.md`.

Batch 9 (**Cleanup & parking lot**) is **complete** (2026-11-26): removed dead `TRAIL_LENGTH_FACTOR`, deduplicated `FLOATING_TEXT_LIFE_MS`, switched `max_speed` achievement to `MAX_SPEED_UPGRADE`, and verified #81 pooling/shared-graphics reuse (468 tests across 39 files).

Batch 0 from `scratch.md` is **complete** (2026-11-26): PR CI, refreshed
README/AGENTS/memory constants, `coverage/` untracked, and #51/#81 closed.

Batch 1 (save integrity, #99) is **complete** (2026-11-26, PR #111):
versioned local/export saves, total numeric validation, future-version
rejection, storage-failure toasts, and an unversioned-save migration.

The keyboard and audio halves of Batch 3 (#102/#79) are **complete**
(2026-11-26): keyboard in PR #112 (consolidated from #109/#110) and audio in
PR #114. Batch 4 is **complete**: Batch 4a (PR #115) added the real
`phaser-engine` chunk, explosion rims and ball silhouettes (#104/#60/#61);
Batch 4b (PR #116) extracted `BoardSimulation`, benchmarked a DPR-aware
Canvas2D adapter and decided to keep Phaser for Batch 5. Production HiDPI (#56)
remains open.

Batch 2 (#100/#76/#101) is **complete** (2026-11-26, PR #113): pagehide and
hidden-tab saves, 60-second-plus background catch-up through the shared
`applyIdleEarnings` action with a 24-hour cap, and one measured 60-second coin
rate (nominal × 0.1 fallback) for the HUD, ETAs, and 50% offline earnings.
Design: `memory/designs/DESIGN010-lifecycle-and-measured-income.md`.

Current toolchain: React 19.3.0, Phaser 4.2.1, Vite 8.3.3, Vitest 5.0.3,
TypeScript 6.0.3. The entries below are historical context from the November
playtest and earlier batches.

## Recent Changes

- Batch 7e (PR #124): per-ball-type levels (Basic/Heavy damage, Fast damage+speed, Plasma/
  Explosive/Sniper damage), Shop upgrade row, save v6, prestige persistence and
  full-reset clearing. Per-type speed is capped at 3×.

- Batch 7d (PR #123): run goals (100/500/1,000 bricks → 1/2/3 Blueprints), Stats progress,
  toast queue, save v5 migration, prestige/reset behavior. Offline multiplier is
  handled by the existing Insight node.

- Batch 7c (PR #122): click-to-mark priority targeting in the pure core, BoardSimulation,
  Phaser renderer, and Canvas spike; opt-in Settings auto-buy with a 50% coin
  reserve; app-start settings hydration. Regression tests cover targeting,
  focus rendering, reserve behavior, persistence, and the one-second tick.

- Issue #86 (PR #121): permanent Blueprint tree nodes (Might/Fortune/Insight),
  lifetime coin/best-tier/playtime records, Records modal, and v4 migration.
  Tree and records survive prestige and clear on full reset. Review also fixed
  achievement Blueprint rewards in the batched `applyBoardRewards` path.
  510 tests across 42 files plus lint/typecheck/production/Canvas builds pass.

- Batch 7b (PR #120): gold and armored bricks MVP. Gold pays 5× tier value; armored gets
  2× health and takes 25% damage from basic/fast/sniper/click hits, while heavy,
  plasma, explosive, and explosion sources pierce. Both spawn at 10%, persist in
  the saved board, and render with distinct fills/borders. In-game help updated.

- Batch 7a (PR #119): one-time Blueprint rewards for all 18 achievements, shown in the
  achievements modal and unlock toast; Shop ball rows now support a **Max**
  purchase that spends what the player can afford up to `MAX_BALLS`. Tests cover
  reward idempotency, modal/toast display, batch purchase economics, and the cap.

- Batch 5 Stage 2 (PR #118): `BoardSimulation.getRenderState()` feeds
  `GameScene`/`CanvasGame` at 60 fps; the store board mirror publishes at most
  every 100 ms, with independent adoption of externally replaced balls, bricks,
  and explosions. Click/resize publish immediately. Tests cover the publication
  ceiling, stale-mirror rendering, external buy/prestige sync, refill, and
  explosion aging. Economy writes remain immediate.

- Batch 5 Stage 1 (PR #117): extracted fixed-step physics, collisions, batched Decimal
  damage, reward/effect events, explosions, targeting, and click damage into
  `src/game/model/`; `BoardSimulation` now synchronizes the store and applies
  core events. Added seeded brick setup and deterministic regression coverage.
  Focused validation: 139 tests, 99.41% core statement coverage.

- Batch 4b (PR #116): the Canvas2D spike cut lazy board JavaScript by 96.3%
  and produced sharper DPR 2 text, but measured slower at 50 balls while
  drawing 4.84× the backing pixels. Decision: keep Phaser for Batch 5; revisit
  after snapshot-fed rendering with a static brick/text layer. Shared
  simulation now lives in `BoardSimulation`, with resize fixed and 432 tests.

- Batch 4a (#104/#60/#61, PR #115): Rolldown `codeSplitting` now emits a real
  `phaser-engine` chunk (game engine 62 kB, Phaser 1.37 MB, no size warning);
  explosions use a bright rim with a faint core; ball types have distinct
  silhouettes (ring, hexagon, star, spikes, crosshair). #56 and #105 remain.

- Batch 3 audio (#79, PR #114): the app's
  one-shot capture listeners call `AudioModule.unlock()` on the first
  pointerdown/keydown/touchstart and clean up on unlock or unmount. Context
  creation is gesture-gated; suspended contexts resume without duplicate
  in-flight resumes. High-frequency ballBounce/brickBreak/coin cues have 30 ms
  cooldowns, and a timestamped window caps active sound voices at eight for
  600 ms (covering the longest existing cue). Muting and jsdom's no-Web-Audio
  no-op are preserved. Validation: lint, typecheck, 418 tests, and build pass.

- Batch 2 lifecycle/income (#100/#76/#101): save on pagehide and hidden
  tabs, grant absences of at least 60 seconds through a shared capped idle
  action, and use one rolling 60-second measured coin rate for live HUD, shop
  ETA, and 50% offline earnings. The rate is snapshotted when the tab hides so
  the pruned tracker does not change the grant. Nominal income × 0.1 remains
  the fallback before samples exist. Tracking resets on
  load/import/reset/prestige and is not persisted. Validation: lint, typecheck,
  407 tests, and build pass.

- In review: accessibility/onboarding batch (#72, #73, #74) on
  `ux/accessibility-batch`. A collapsible hint under the board ("Click a brick
  to chip it · How to play"), a labelled canvas with `aria-describedby`, a
  `pointer` cursor only while hovering a brick, and honest reduced-motion
  copy plus non-drifting popups. Design:
  `memory/designs/DESIGN009-accessibility-and-onboarding.md`.
- Shipped #59 (PR #96): floating popups take `'damage' | 'coin'`, coins are
  gold with `¢`, damage near-white, `MAX_ACTIVE_FLOATING_TEXTS = 8` with coin
  eviction and jitter; killing hits no longer stack a damage popup under the
  coin popup.
- Working on #68 (PR #97): `calculateHitRate`/`calculateIncomePerSecond` in
  `src/store/earnings.ts` (nominal, shared with offline earnings), store
  `getIncomePerSecond()` applies `LIVE_INCOME_CALIBRATION = 0.1` measured in
  live play, `planMaxUpgrade()` shared by the Max button and its shop preview,
  `n / 50` ball cap, and time-to-afford hints with `aria-describedby`.
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
- ✅ Brick generation and tier progression (unbounded tiers, rising every 100 bricks)
- ✅ Shop for balls and upgrades
- ✅ Prestige system (fixed 10,000-brick threshold, ×1.25 damage and coin multiplier per level)
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

Batch 4 evaluated a DPR-aware Canvas2D adapter. Phaser remains the production renderer for Batch 5. See [the comparison and revisit criteria](designs/DESIGN011-renderer-spike.md).

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
- Audio module is a `globalThis` singleton so HMR / dynamic imports / test module duplication share state; only `unlock()` may create its AudioContext, from a real user gesture
