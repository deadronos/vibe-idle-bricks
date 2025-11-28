# DESIGN002 - Export/Import Save Feature

**Status:** Implemented  
**Created:** 2025-11-28  
**Related Task:** [TASK002](../tasks/TASK002-export-import-save.md)

## Overview

This design documents the export/import save feature for the Idle Bricks game, allowing players to backup and restore their game state via JSON strings copied to/from the clipboard.

## Requirements (EARS Format)

1. **REQ-001**: WHEN the player clicks "Export", THE SYSTEM SHALL serialize the current game state to JSON and copy it to the clipboard.
   - **Acceptance:** Click Export → JSON string copied → paste into text editor shows valid JSON.

2. **REQ-002**: WHEN the player clicks "Import" and provides valid JSON, THE SYSTEM SHALL restore the game state from the imported data.
   - **Acceptance:** Paste previously exported data → game state matches original.

3. **REQ-003**: WHEN the player provides invalid JSON or malformed data, THE SYSTEM SHALL reject the import and display an error message.
   - **Acceptance:** Import gibberish → error alert shown → game state unchanged.

4. **REQ-004**: THE SYSTEM SHALL prompt for confirmation before overwriting current progress on import.
   - **Acceptance:** Import triggers confirmation dialog before applying changes.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Export Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────────┐     │
│  │  Footer    │───▶│  exportSave  │───▶│  Clipboard API   │     │
│  │  (Button)  │    │  (Store)     │    │  (navigator)     │     │
│  └────────────┘    └──────────────┘    └──────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│                    JSON.stringify()                              │
│                    with Decimal → string                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Import Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────────┐     │
│  │  Footer    │───▶│  prompt()    │───▶│  importSave      │     │
│  │  (Button)  │    │  (User Input)│    │  (Store)         │     │
│  └────────────┘    └──────────────┘    └──────────────────┘     │
│                                               │                  │
│                                               ▼                  │
│                                        JSON.parse()              │
│                                        + Validation              │
│                                        + Decimal rehydration     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Store Actions (`src/store/gameStore.ts`)

#### `exportSave(): string`

Serializes the current game state to a JSON string.

```typescript
exportSave: () => {
  const state = get();
  const saveData = {
    coins: state.coins.toString(),
    bricksBroken: state.bricksBroken.toString(),
    totalBricksBroken: state.totalBricksBroken.toString(),
    prestigeLevel: state.prestigeLevel,
    upgrades: state.upgrades,
    ballCosts: Object.fromEntries(
      Object.entries(state.ballCosts).map(([k, v]) => [k, v.toString()])
    ),
    upgradeCosts: Object.fromEntries(
      Object.entries(state.upgradeCosts).map(([k, v]) => [k, v.toString()])
    ),
    currentTier: state.currentTier,
    balls: state.balls.map((b) => b.type),
    timestamp: Date.now(),
    version: 1,
  };
  return JSON.stringify(saveData);
}
```

**Key decisions:**

- Decimals serialized as strings to preserve precision
- Only ball types saved (positions regenerated on import)
- Bricks and explosions NOT saved (transient state)
- Version field for future migration support

#### `importSave(data: string): boolean`

Parses JSON and restores game state. Returns `true` on success, `false` on failure.

**Validation checks:**

- Valid JSON syntax
- Required fields present (`coins`, `prestigeLevel`)
- Graceful defaults for missing optional fields

**State reset behavior:**

- Bricks cleared (regenerated by game loop)
- Explosions cleared
- Balls recreated with random positions/angles

### 2. UI Component (`src/components/Footer.tsx`)

| Button | Handler | Behavior |
|--------|---------|----------|
| 📤 Export | `handleExport` | Call `exportSave()` → copy to clipboard → show alert |
| 📥 Import | `handleImport` | Prompt for input → confirm overwrite → call `importSave()` |

**Clipboard fallback:** If `navigator.clipboard` fails, falls back to `prompt()` with data for manual copy.

## Save Data Schema

```typescript
interface SaveData {
  // Required
  coins: string;              // Decimal as string
  prestigeLevel: number;

  // Optional (defaults provided)
  bricksBroken?: string;      // Decimal, default "0"
  totalBricksBroken?: string; // Decimal, default "0"
  upgrades?: Upgrades;        // default { speed: 0, damage: 0, coinMult: 0 }
  ballCosts?: Record<BallType, string>;   // defaults to base costs
  upgradeCosts?: Record<string, string>;  // defaults to base costs
  currentTier?: number;       // default 1
  balls?: BallType[];         // default ['basic']

  // Metadata
  timestamp?: number;         // Unix timestamp
  version?: number;           // Schema version (currently 1)
}
```

## Data Flow

```text
Export:
1. User clicks "📤 Export" button
2. handleExport() called in Footer.tsx
3. exportSave() reads current Zustand state
4. Decimals converted to strings via .toString()
5. JSON.stringify() creates portable string
6. navigator.clipboard.writeText() copies to clipboard
7. Alert confirms success (or fallback prompt on error)

Import:
1. User clicks "📥 Import" button
2. handleImport() shows prompt() for paste
3. User confirms overwrite (confirm dialog)
4. importSave(data) parses JSON
5. Validation: check required fields exist
6. Decimals rehydrated via new Decimal(string)
7. Balls recreated with random positions
8. Zustand state updated via set()
9. Alert shows success/failure
```

## Decisions & Trade-offs

### Decision 1: Clipboard vs File Download

**Choice:** Clipboard with prompt fallback

**Rationale:**

- Simpler UX for mobile/desktop
- No file management needed
- Works in all browsers (prompt fallback for Safari)

**Alternative considered:** File download/upload — rejected due to added complexity and mobile limitations.

### Decision 2: What state to persist

**Choice:** Core progression only (coins, upgrades, balls types)

**Rationale:**

- Bricks regenerate each tier — no need to save
- Ball positions are transient
- Explosions are visual effects only
- Keeps save data small and portable

### Decision 3: Decimal serialization

**Choice:** Convert to strings (`"12345"` not `12345`)

**Rationale:**

- JavaScript numbers lose precision beyond 2^53
- `break_infinity.js` Decimal requires string input for large values
- Consistent with existing `save()`/`load()` implementation

### Decision 4: Validation strategy

**Choice:** Minimal required fields + graceful defaults

**Rationale:**

- Supports partial/legacy saves
- Forward-compatible with future additions
- Reduces user-facing errors

## Error Handling

| Error Case | Response |
|------------|----------|
| Invalid JSON syntax | `importSave` returns `false`, alert shown |
| Missing `coins` or `prestigeLevel` | `importSave` returns `false`, alert shown |
| Missing optional fields | Defaults applied, import succeeds |
| Empty balls array | Single 'basic' ball created |
| Unknown ball types | Falls back to 'basic' config |
| Clipboard API unavailable | Fallback to prompt() |

## Testing

| Test | Description | Status |
|------|-------------|--------|
| `exportSave returns valid JSON` | JSON.parse doesn't throw | ✅ |
| `exportSave includes all essential state` | All fields present with correct values | ✅ |
| `exportSave includes version number` | version field equals 1 | ✅ |
| `exportSave includes timestamp` | timestamp within expected range | ✅ |
| `exportSave serializes Decimals as strings` | ballCosts/upgradeCosts are strings | ✅ |
| `importSave returns true on success` | Valid data returns true | ✅ |
| `importSave restores game state` | All fields correctly restored | ✅ |
| `importSave returns false for invalid JSON` | Malformed JSON rejected | ✅ |
| `importSave returns false for missing fields` | Incomplete data rejected | ✅ |
| `importSave clears bricks/explosions` | Transient state reset | ✅ |
| `importSave uses defaults for missing optional` | Graceful degradation | ✅ |
| `importSave creates default ball if empty` | Never zero balls | ✅ |
| `importSave restores Decimals correctly` | ballCosts are Decimal objects | ✅ |
| `roundtrip: export then import` | State preserved through cycle | ✅ |

## Relationship to Existing Save System

| Feature | `save()`/`load()` | `exportSave()`/`importSave()` |
|---------|-------------------|-------------------------------|
| Storage | localStorage | Clipboard/manual |
| Trigger | Auto (30s) / manual button | Manual button only |
| Offline progress | Calculated on load | Not calculated |
| User visibility | Hidden | User sees/controls data |
| Portability | Browser-bound | Cross-browser, cross-device |

## Future Improvements

- [ ] Add Base64 encoding to compress save strings
- [ ] Add checksum for data integrity validation
- [ ] Support version migration (version 1 → 2)
- [ ] Add "Share save" via URL parameter
- [ ] Consider cloud save integration
