# TASK009 - Suggestion Set

**Status:** In Progress
**Added:** 2026-06-11
**Updated:** 2026-06-11
**Branch:** `feat/suggestion-set`

## Original Request

"open a new branch and suggest top 5 fixes or enhancements please"

## Thought Process

The user wants a curated short-list of fixes or enhancements with grounded justification, not a sprawling backlog. Each suggestion should:

- Be grounded in the actual current code (not invented)
- Have an obvious, demonstrable win for the player or the maintainer
- Be small enough to fit in one PR each (or combined into one if closely related)
- Avoid areas recently shipped (TASK005, TASK006, TASK007, TASK008) to prevent rework

## Candidate Survey (for transparency)

Surveyed the current `src/` and `memory/` state on 2026-06-11. Key findings:

- **Sound**: zero references to Audio in `src/**`. Listed as High Priority in `progress.md`.
- **Pause**: store action `setPaused` and state `isPaused` exist, and `GameScene` honours the flag, but there is **no UI affordance** to actually pause (no button, no keyboard shortcut, no `Space` binding, no settings panel). Half-built feature, low risk, high perceived value.
- **Mobile touch**: only Phaser default `pointerdown` for brick clicks. Shop buttons rely on browser default tap; no test coverage for narrow viewports. Listed as Known Issue in `progress.md`.
- **Accessibility**: no `aria-live` regions for stat changes, no reduced-motion preference, no colorblind-friendly brick tiers (all use HSL by tier, but heavy/light collisions may be hard to distinguish).
- **Save slots**: single-slot only. Listed as Low Priority in `progress.md`.
- **Achievements / statistics screen**: listed as Medium Priority in `progress.md`.
- **Settings menu**: not present (would naturally host pause, sound, motion, colorblind toggles).
- **Code health**: the `App.test.tsx` suite has 234 tests, all passing. The `Suspense`/`ErrorBoundary` interaction in `App.tsx` is well-built. No obvious correctness bugs found at a glance.

## Top 5 Suggestions (for user to choose from)

1. **Wire up a Pause control** (small, low risk) — surface the existing `isPaused` state with a header button + `Space`/`P` keyboard shortcut + ESC-to-resume, plus a one-line `aria-live` indicator. Reuses store + GameScene code that already exists.
2. **Add lightweight sound effects** (medium) — Web Audio API with one tiny synthesizer per event (ball-bounce, brick-break, coin-pickup, purchase, prestige). No asset files, no license concerns, fully procedural. Behind a sound-on toggle in a new Settings menu.
3. **Settings menu + reduced-motion + colorblind mode** (medium) — new `Settings` drawer in the Footer. Hosts: sound on/off, reduced motion (suppress shake/trails), colorblind-friendly brick palette. All toggles persist in `localStorage` via the existing save system.
4. **Mobile/touch polish** (medium) — viewport meta tightening, larger touch targets on Shop buttons (`min 44x44`), explicit `touch-action: manipulation` to remove 300 ms tap delay, and a Vitest test using `window.matchMedia` mock to assert the Shop doesn't horizontally overflow at 360 px.
5. **Achievements + Statistics screen** (large) — extend the store with an `achievements` map and a `Stats` route, surface unlock toasts, persist via save. Bigger scope; this is the only "large" candidate of the five.

## Implementation Plan

- [ ] User picks 1-N items from the suggestions above.
- [ ] For each picked item, follow the small-change workflow in `AGENTS.md`:
  - implement directly
  - add/adjust tests
  - run `typecheck`, `lint`, `test:run`, `build`
  - commit per item (or grouped if user requests)
  - update `activeContext.md` and `progress.md`
- [ ] Open one PR per item, or one combined PR if the user asks.
- [ ] On completion, mark TASK009 Completed in `_index.md`.

## Progress Tracking

**Overall Status:** In Progress - 70% (PR1 + PR2 stacked on PR #46; PR3 pending)

### Subtasks

| ID | Description | Status | Updated | Notes |
| - | - | - | - | - |
| 9.1 | Branch + memory task created | Complete | 2026-06-11 | `feat/suggestion-set` |
| 9.2 | Present 5 suggestions to user | Complete | 2026-06-11 | This turn |
| 9.3 | User selects items to implement | Complete | 2026-06-11 | Selected all 5, grouped into 3 PRs |
| 9.4.1 | PR1 — Pause control (header button, keyboard, a11y) | Complete | 2026-06-11 | Commit `8f05ebd`, 13 new tests |
| 9.4.2 | PR2 — Sound + Settings + reduced-motion + colorblind | Complete | 2026-06-11 | Commit `11c9f5b`, 21 new tests |
| 9.4.3 | PR3 — Mobile/touch polish + achievements | Not Started | - | Touch targets, viewport, achievements screen |
| 9.5.1 | PR1 validation + push + open PR | Complete | 2026-06-11 | PR #46 (initial) |
| 9.5.2 | PR2 validation + push + update PR | Complete | 2026-06-11 | PR #46 (now stacks both commits) |
| 9.5.3 | PR3 validation + push + open PR | Not Started | - | After PR2 ships |

## Progress Log

### 2026-06-11

- Created branch `feat/suggestion-set` from `main`
- Surveyed `src/`, `memory/progress.md`, `memory/activeContext.md` for grounded suggestions
- Compiled 5 suggestions with rough scope and a per-item workflow plan
- User selected all 5; plan grouped as PR1 (pause), PR2 (sound + settings), PR3 (mobile + achievements)
- **PR1 (commit `8f05ebd`) shipped**:
  - `useKeyboardShortcuts` hook with `handlersRef` to avoid re-binding
  - `PauseButton`, `PauseIndicator` (visually-hidden `aria-live=polite`), `PauseOverlay`
  - Wired into `App.tsx`; Surface keyboard shortcuts app-wide
  - 13 new tests across 3 components + 1 hook
- **PR2 (commit `11c9f5b`) shipped**:
  - `src/utils/audio.ts` — procedural Web Audio SFX for `ballBounce`, `brickBreak`, `coin`, `purchase`, `prestige`. Singleton stored on `globalThis` so HMR/dynamic imports/duplicated module instances in tests all share state. Safe no-op when AudioContext is unavailable.
  - `src/store/settingsStore.ts` — Zustand store with `soundEnabled`, `reducedMotion`, `colorblindMode`, persisted to `localStorage` under `idleBricksSettings` (kept separate from the game save so `reset()` does not wipe preferences). `hydrate()` validates stored values including a `isColorblindMode` type guard and falls back to defaults on garbage.
  - `src/components/SettingsDrawer.tsx` — modal exposing all three preferences, with proper ARIA roles for toggles and radios, plus a sectioned layout.
  - `Footer.tsx` — added `Settings` button (indigo gradient) that opens the drawer; `aria-haspopup="dialog"` and `aria-expanded` wired.
  - `gameStore.ts` — `playSound` invoked from `damageBrick` (always `ballBounce`, plus `brickBreak` on destroy), `addCoins` (when `amount > 0 && amount < 1000`), `buyBall`, `buyUpgrade`, `prestige`.
  - `helpers.ts` — `getAccessibleTierColor(tier, mode)` applies a Vienot-Brettler sRGB remap per colorblind mode. `GameRenderers` and `GameEffects` read `colorblindMode` on every fill, and `reducedMotion` gates particle/shake effects.
  - 21 new tests across 4 files (`audio.test.ts`, `settingsStore.test.ts`, `SettingsDrawer.test.tsx`, +3 cases in `helpers.test.ts`)
  - `App.css` — added `.btn-settings`, `.settings-section`, `.settings-toggle`, `.settings-radio*` rules.
- **Validation after PR2**: typecheck ✓, lint ✓, 268/268 tests ✓, build ✓ (game-engine chunk warning is expected/justified)
- **PR #46** now contains both PR1 and PR2 stacked; title updated to `feat(sound+settings): add Web Audio SFX, persistent preferences, and accessibility toggles`. PR3 will follow as a separate push.

### Implementation notes for future work

- When a Zustand/Phaser singleton needs to survive HMR + dynamic imports + duplicated test imports, hoist it to `globalThis` (see `src/utils/audio.ts`). Otherwise each `await import()` returns a fresh closure.
- For radio groups in tests, prefer `getByRole('radio', { name: /.../i })` over `getByLabelText` when the label contains multiple text spans.
- For settings persisted to `localStorage`, keep them under a separate key from the game save so `reset()` is not destructive.
