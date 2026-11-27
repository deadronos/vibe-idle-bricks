# Scratch: next issue batches

Working plan, last updated 2026-11-26. Issue references point at GitHub. Tick boxes as work lands; delete this file once the plan is absorbed into the epics.

## Ground rules

- One batch = one branch = one PR. Do not mix save/architecture work with balance tuning.
- Every batch: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`.
- Every bug fix gets a regression test; every save change gets a legacy fixture.
- Do not tune balance against the stale text in [#50]/[#52]; both now carry status banners.
- No `any`; Decimal for every unbounded game value.

## Batch 0 — Tracker and CI hygiene (0.5 day)

Issues: [#107], [#108]; close [#51]; verify [#81].

- [x] Add `.github/workflows/ci.yml` on pull_request and push to main: npm ci, lint, typecheck, test:run, build.
- [x] Update README, AGENTS, and memory constants; point at `src/types/game.ts` and `package.json` as the source of truth.
- [x] Add `coverage/` to `.gitignore` and untrack it (`git rm -r --cached coverage`).
- [x] Close [#51] (every child is closed). Verify [#81] (text pooling and shared effect objects already shipped); close or rescope.
- [x] Keep [#28] closed; [#104] tracks the chunk regression.

Done 2026-11-26; documentation and CI only, no gameplay code changed.

Why first: protects every later batch and removes misleading constants before balance work.

## Batch 1 — Save integrity (1–2 days)

Issues: [#99].

- [x] Reject NaN and Infinity, require non-negative values, clamp prestige to `MAX_PRESTIGE_LEVEL`, clamp ball costs to a sane range.
- [x] Always write a schema version (local and export); one parse/migrate path; legacy fixture.
- [x] Guard `setItem` with try/catch plus a one-time toast; in-memory fallback.
- [x] Tests: NaN/Infinity coins, negative coins/costs, oversized prestige/tier, future version, legacy migration, quota read/write.

Done 2026-11-26; merged in PR #111. #99 closed.

Exit criteria: crafted saves cannot soft-lock or mint coins; local saves are versioned and migratable.

Why before [#86]: lifetime stats add new persisted fields.

## Batch 2 — Lifecycle, idle, and offline rate (2–3 days)

Issues: [#100], [#76], [#101].

- [x] Save on `pagehide` and on `visibilitychange` when hidden.
- [x] On visible, grant elapsed-time income through the offline path; keep the 24 h cap; do not double-count with `load()`.
- [x] Replace the 0.05 × 0.5 versus 0.1 mismatch with one model: a measured 60 s rolling rate for HUD, ETA, and offline. Revisit with simulation in Batch 5.
- [x] Tests: 5 minutes backgrounded, close/reopen, live:offline ratio.

Merged in #113 on 2026-11-26; #100/#76/#101 closed. Design:
`memory/designs/DESIGN010-lifecycle-and-measured-income.md`.

## Batch 3 — Keyboard and audio quick wins (0.5 day)

Issues: [#102], [#79].

- [x] Ignore Space/P when the event target is a button, link, summary, or `[role=button]`. Merged in #112.
- [x] Unlock the AudioContext on the first pointerdown/keydown; add a ~30 ms per-sound gate and an ~8-voice cap. Merged in #114.
- [x] Tests: focused Buy + Space does not pause; shortcut still works on body/canvas; audio unlock, cooldown, voice cap, and hook cleanup.

Both halves complete: keyboard #112 (consolidated from #109/#110), audio #114.

## Batch 4 — Rendering decision (3–5 days, spike)

Issues: [#104], [#105], [#56], [#60], [#61].

- [x] Spike a Canvas2D renderer at DPR 2; compare 50-ball frame time, bundle size, sharpness, and code size.
- [x] Make the `phaser-engine` chunk real with `codeSplitting` (game engine 62 kB, Phaser 1.37 MB, no size warning).
- [x] Decide: adopt Canvas2D, keep Phaser, or revisit. Record the decision on [#105].
- [x] #60 explosion rims and #61 ball silhouettes in the current Phaser renderer; #56 remains blocked on Phaser 4.

Batch 4a merged in #115. Batch 4b keeps Phaser for Batch 5. The Canvas2D spike improved DPR 2 sharpness and bundle size but missed the 50-ball frame budget. See [the measurements and revisit criteria](memory/designs/DESIGN011-renderer-spike.md).

## Batch 5 — Simulation core (1–2 weeks)

Issues: [#103]; enables [#76] and [#81]. Update or close [#52] when the remaining leaves are done.

- [x] Stage 1: `model/` core with `step`, collisions, damage, reward events, and seeded RNG. Versioned board save is deferred.
- [x] Port collision, damage, rewards, targeting, click handling, and brick generation; `BoardSimulation` remains the store/effects adapter.
- [x] Tests: determinism, one-shot damage, batch damage, targeting, AoE, click, and seeded brick setup; core coverage 99.4% statements.
- [x] Stage 2: live 60 fps renderer reads, 10 Hz board mirror, independent external ball/brick/explosion adoption, forced click/resize publication.
- [x] Stage 3: versioned board save/restore.
- [x] Stage 4: deterministic offline fast-forward.
- [x] Renderers read live runtime state; React reads the 10 Hz store mirror.
- [x] Batch reward/progression writes to meet the total <=10 store-writes/second budget.

Stage 1 merged in #117 and Stage 2 merged in #118 on 2026-11-26; Stages 3–4
and reward-write batching completed 2026-11-26, documented in
`memory/designs/DESIGN012-simulation-core.md`. Ready to close #103 (and review
#52).

## Batch 6 — Economy redesign (1–2 weeks, design first)

Issues: [#106]; rewrite or close [#50].

- [x] Build a headless balance harness: time-to-prestige, income by tier, cap impact, and a greedy buy strategy.
- [x] Choose curves: exponential wall level, multiplicative upgrades, prestige currency, small base multiplier.
- [x] Remove MAX_TIER and MAX_PRESTIGE_LEVEL, or convert them into unlocks; keep MAX_BALLS only as a performance guard.
- [x] Document the formulas in one place; update [#50]'s body or close it.

Completed 2026-11-26: `src/game/model/balanceHarness.ts` + `scripts/balance-report.ts`, unbounded `Decimal` tier/prestige scaling (exponential wall past tier 20), multiplicative `damage`/`coinMult` (`1.08^level`) with capped additive `speed` (`MAX_SPEED_UPGRADE = 50`), `PRESTIGE_MULTIPLIER = 1.25` + persistent **Blueprints** (`SAVE_VERSION = 3` with v0/v1/v2→v3 migration), and `MAX_BALLS = 100`. Documented in `memory/designs/DESIGN013-economy-redesign.md`. Ready to close [#106] and [#50].

## Batch 7 — Content (2–4 weeks, parallelizable)

Issues: [#66], [#85], [#82], [#83], [#86], [#84].

- [x] [#66] achievement rewards: one-time Blueprints, shown in the modal and toast. Merged in #119.
- [x] [#85] batch ball purchase (Max), opt-in auto-buy with a 50% reserve, and run goals at 100/500/1,000 bricks. Offline multiplier is covered by Insight. Merged across #119/#122/#123.
- [x] [#82] gold and armored bricks MVP; spawn table plus in-game documentation. Merged in #120.
- [x] [#83] per-ball progression: permanent per-type levels with coin costs, damage/speed effects, and Shop UI. Merged in #124.
- [ ] [#86] prestige tree and lifetime stats (after [#99]).
- [x] [#84] active layer: click-to-mark priority targeting (optional; idle falls back to weakest). Merged in #122.

Batch 7a merged in #119, Batch 7b in #120, #86 in #121, Batch 7c in #122,
Batch 7d in #123, Batch 7e in #124, DPR-2 spike #125, and Phaser DPR-2
production in #127; #56/#83 closed. All planned batches are complete.

## Batch 8 — Visual leaves (after Batch 4)

Issues: [#56], [#60], [#61].

- [ ] HiDPI correct at DPR 2.
- [x] Explosion rim and transparency so bricks stay readable. (Batch 4a)
- [x] Ball silhouette/ring/trail so type is readable in a monochrome screenshot. (Batch 4a)

## Batch 9 — Cleanup and parking lot

- [x] Verify and close [#81] if the allocation measurement passes. (Audited `GameEffects.ts` & `GameRenderers.ts`; added shared `Graphics` reuse regression test.)
- [x] Remove dead constants (`TRAIL_LENGTH_FACTOR`) and the duplicate `FLOATING_TEXT_LIFE_MS`. (`INITIAL_BRICKS_TO_GENERATE` remains live in `BoardSimulation.ts`.)
- [x] Use `MAX_SPEED_UPGRADE` in the max_speed achievement instead of hardcoded 50.
- [ ] Delete this file once the remaining batches are absorbed into epics.

## Parallel tracks

- Correctness: 0 -> 1 -> 2 -> 3 -> 9
- Architecture: 4 -> 5
- Design: 6 -> 7
- Visuals: 4 -> 8

## Decisions needed

1. Phaser versus Canvas2D ([#104]/[#105]) — blocks [#56]/[#60]/[#61].
2. Income: measured EMA now versus simulated offline ([#101]/[#103]).
3. Prestige shape: 1.75^N versus blueprints plus a small multiplier ([#106]).
4. Active layer: optional bonus or core mechanic ([#84]).
5. Ball cap: keep 50 as a performance guard, raise it after [#103], or remove it ([#106]).

## Snapshot (2026-11-26)

- 365 tests across 31 files; 71.2% statements; `GameScene` at 0%.
- Build: index 246.5 kB (77.3 kB gz), lazy game chunk 1,434.1 kB (375.9 kB gz).
- 27 open issues. [#51] and [#81] are closure candidates. [#28] is closed; [#104] tracks the regression.

[#28]: https://github.com/deadronos/vibe-idle-bricks/issues/28
[#50]: https://github.com/deadronos/vibe-idle-bricks/issues/50
[#51]: https://github.com/deadronos/vibe-idle-bricks/issues/51
[#52]: https://github.com/deadronos/vibe-idle-bricks/issues/52
[#56]: https://github.com/deadronos/vibe-idle-bricks/issues/56
[#60]: https://github.com/deadronos/vibe-idle-bricks/issues/60
[#61]: https://github.com/deadronos/vibe-idle-bricks/issues/61
[#66]: https://github.com/deadronos/vibe-idle-bricks/issues/66
[#76]: https://github.com/deadronos/vibe-idle-bricks/issues/76
[#79]: https://github.com/deadronos/vibe-idle-bricks/issues/79
[#81]: https://github.com/deadronos/vibe-idle-bricks/issues/81
[#82]: https://github.com/deadronos/vibe-idle-bricks/issues/82
[#83]: https://github.com/deadronos/vibe-idle-bricks/issues/83
[#84]: https://github.com/deadronos/vibe-idle-bricks/issues/84
[#85]: https://github.com/deadronos/vibe-idle-bricks/issues/85
[#86]: https://github.com/deadronos/vibe-idle-bricks/issues/86
[#99]: https://github.com/deadronos/vibe-idle-bricks/issues/99
[#100]: https://github.com/deadronos/vibe-idle-bricks/issues/100
[#101]: https://github.com/deadronos/vibe-idle-bricks/issues/101
[#102]: https://github.com/deadronos/vibe-idle-bricks/issues/102
[#103]: https://github.com/deadronos/vibe-idle-bricks/issues/103
[#104]: https://github.com/deadronos/vibe-idle-bricks/issues/104
[#105]: https://github.com/deadronos/vibe-idle-bricks/issues/105
[#106]: https://github.com/deadronos/vibe-idle-bricks/issues/106
[#107]: https://github.com/deadronos/vibe-idle-bricks/issues/107
[#108]: https://github.com/deadronos/vibe-idle-bricks/issues/108
