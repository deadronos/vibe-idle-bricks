# [TASK002] - Introduce Export/Import Save Buttons

**Status:** Completed
**Added:** 2025-11-28
**Updated:** 2025-11-28

## Original Request

Introduce an export/import button for gamestate as JSON.

## Thought Process

The user wants a way to backup and restore their save data manually. This is common in idle games.
We already have `saveGame` and `loadGame` which work with `localStorage`. We can reuse the serialization logic.

**Approach:**

1. **Export**: Serialize the current state (using the existing logic if possible, or extracting it) to a JSON string. Copy to clipboard.
2. **Import**: Prompt user for string. Parse JSON. Rehydrate `Decimal`s. Update store.

**Design:**

- **Store**: Add `exportSave` and `importSave` to `useGameStore`.
- **UI**: Add buttons to `Footer.tsx`.

## Implementation Plan

- [x] Update `gameStore.ts` with `exportSave` and `importSave` actions.
- [x] Update `Footer.tsx` with "Export Save" and "Import Save" buttons.
- [x] Add basic validation and user feedback (alerts).

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description           | Status    | Updated    | Notes                          |
| --- | --------------------- | --------- | ---------- | ------------------------------ |
| 2.1 | Update gameStore.ts   | Completed | 2025-11-28 | Added exportSave/importSave    |
| 2.2 | Update Footer.tsx     | Completed | 2025-11-28 | Added Export/Import buttons    |
| 2.3 | Verify functionality  | Completed | 2025-11-28 | Tests added, manual test passed|

## Progress Log

### 2025-11-28

- Created task file.
- Added `exportSave()` action: serializes state to JSON with Decimals as strings.
- Added `importSave()` action: parses JSON, validates, rehydrates Decimals, restores state.
- Added Export/Import buttons to Footer with clipboard API and prompt fallback.
- Added confirmation dialog before import to prevent accidental overwrites.
- Added comprehensive unit tests for both actions.
- Created retrospective design document: [DESIGN002](../designs/DESIGN002-export-import-save.md)
- Task completed.
