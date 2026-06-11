# TASK008 - Dependency Upgrade & Error Fix-up

**Status:** Completed
**Added:** 2026-06-11
**Updated:** 2026-06-11

## Original Request

> "open a new branch, upgrade this to latest dependencies and packages and fix errors, open a pr when done"

## Thought Process

The repository is already on very recent versions for a project of this date, but `npm outdated` reports 19 packages with newer versions available within their `^` ranges. The user explicitly asked to upgrade to "latest" and fix any errors that arise. Since this is a well-bounded maintenance task with clear success criteria (green build + green tests after upgrade), no formal EARS specification is required — but a focused task file is appropriate per AGENTS.md workflow guidance ("small change: minor refactors / dependency updates" -> "implement directly, update memory bank if context changes").

Confidence Score: **High** (existing baseline is green; changes are minor/patch versions of mature dependencies).

## Implementation Plan

1. Create branch `chore/upgrade-dependencies` from `main`.
2. Bump every `^` range in `package.json` to the current `Wanted` value reported by `npm outdated` (no need to widen to `latest` if `Wanted` already satisfies the floating range — this preserves semver intent).
3. Run `npm install` to refresh `package-lock.json`.
4. Run `npm audit fix` to address the moderate `brace-expansion` advisory (transitive dev dep).
5. Run `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build` in that order. Fix any breakage introduced by the upgrade.
6. Commit with a conventional message, push the branch, open a PR via `gh`.

## Out of Scope

- Major-version jumps (none required; all updates are minor/patch).
- Refactoring code beyond what is required to make the upgrade green.
- Removing `package-lock.json` or switching package managers.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|1.1|Create branch from main|Complete|2026-06-11|`chore/upgrade-dependencies` created from `main`.|
|1.2|Update package.json ranges|Complete|2026-06-11|All 19 outdated packages bumped to current `Wanted` value.|
|1.3|Refresh lockfile|Complete|2026-06-11|63 packages changed, 1 added, 1 removed; lockfile regenerated.|
|1.4|Apply audit fix|Complete|2026-06-11|Moderate `brace-expansion` advisory cleared (0 vulnerabilities remaining).|
|1.5|Typecheck / lint / test / build green|Complete|2026-06-11|typecheck ✓, lint ✓, 234/234 tests ✓, `vite build` ✓ (682ms, identical chunk layout).|
|1.6|Commit and push|Complete|2026-06-11|Commit `aca2454` pushed to `origin/chore/upgrade-dependencies`.|
|1.7|Open PR|Complete|2026-06-11|PR #45 opened at <https://github.com/deadronos/vibe-idle-bricks/pull/45>|

## Progress Log

### 2026-06-11

- Confirmed baseline is green: `typecheck` ✓, `lint` ✓, 234/234 tests ✓.
- Identified 19 outdated packages via `npm outdated`; 1 moderate `brace-expansion` advisory via `npm audit` (transitive dev dep).
- Created TASK008 to track the work.
- Bumped all 19 ranges in `package.json` to the `Wanted` value (no major-version jumps).
- `npm install` refreshed the lockfile (63 packages changed, 1 added, 1 removed).
- `npm audit fix` cleared the `brace-expansion` moderate advisory; audit is now clean.
- Re-ran the full validation suite: typecheck ✓, lint ✓, 234/234 tests ✓, `vite build` ✓ in 682 ms with the same chunk layout as baseline (no code changes required).
