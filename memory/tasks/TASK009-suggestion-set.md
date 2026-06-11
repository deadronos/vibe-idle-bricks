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

**Overall Status:** In Progress - 5% (branch + task file created, awaiting user pick)

### Subtasks

| ID | Description | Status | Updated | Notes |
| - | - | - | - | - |
| 9.1 | Branch + memory task created | Complete | 2026-06-11 | `feat/suggestion-set` |
| 9.2 | Present 5 suggestions to user | Complete | 2026-06-11 | This turn |
| 9.3 | User selects items to implement | Not Started | - | Awaiting user |
| 9.4 | Implement selected items | Not Started | - | Per item |
| 9.5 | Validation, commit, push, PR | Not Started | - | Per item |

## Progress Log

### 2026-06-11

- Created branch `feat/suggestion-set` from `main`
- Surveyed `src/`, `memory/progress.md`, `memory/activeContext.md` for grounded suggestions
- Compiled 5 suggestions with rough scope and a per-item workflow plan
- Task file scaffolded; awaiting user selection
