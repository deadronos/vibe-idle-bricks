# TASK007 - Branch Review Fixes

**Status:** Completed  
**Added:** 2026-04-05  
**Updated:** 2026-04-05

## Original Request

Implement the review follow-up fixes for the `opencode-improvements` branch, focusing on correctness, code quality, and maintainability.

## Thought Process

- Fix the save/import path so malformed or partial upgrade data cannot corrupt state.
- Remove duplicated gameplay constants so tuning values have a single source of truth.
- Address dead code and small UX regressions introduced by the branch.

## Implementation Plan

- Clamp and sanitize all imported upgrade fields in `gameStore.ts`.
- Remove duplicated constants and keep gameplay tuning values centralized.
- Improve offline reward formatting and clamp offline duration defensively.
- Rework `GameScene` to use the extracted ball physics helper or remove dead code.
- Add/update tests for the revised save parsing and offline earnings behavior.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|1.1|Sanitize imported upgrades|Complete|2026-04-05|Partial/invalid upgrade fields are now clamped and defaulted safely.|
|1.2|Remove duplicate constants|Complete|2026-04-05|Duplicate gameplay constants were centralized.|
|1.3|Improve offline earnings UX|Complete|2026-04-05|Offline earnings are clamped and formatted for the toast.|
|1.4|Resolve BallPhysics dead code|Complete|2026-04-05|GameScene now uses BallPhysics for movement/collision logic.|
|1.5|Add regression tests|Complete|2026-04-05|Added coverage for malformed upgrades and offline earnings edge cases.|

## Progress Log

### 2026-04-05

- Opened the branch review follow-up task.
- Identified the main repair areas: save hydration, duplicated constants, offline earnings formatting, and dead physics helper code.
- Implemented the fixes and verified them with build, lint, and test runs.
- Updated the scene to use the shared BallPhysics helper and added regression coverage for the repaired paths.
