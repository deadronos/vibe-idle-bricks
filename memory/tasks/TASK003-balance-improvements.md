# [TASK003] - Game Balance Improvements

**Status:** Pending  
**Added:** 2025-11-28  
**Updated:** 2025-11-28  
**Design:** [DESIGN003-balance-improvements.md](../designs/DESIGN003-balance-improvements.md)

## Original Request

Implement game balance improvements identified in the game-balance-analysis.md document. This includes adjusting ball costs, extending tier cap, scaling prestige thresholds, and rebalancing various game parameters for improved mid-to-late game pacing.

## Thought Process

The design document (DESIGN003) provides a comprehensive analysis of balance issues and proposes specific changes organized into three phases:

1. **Phase 1 (Quick Wins)** - Low risk changes that can be implemented immediately
2. **Phase 2 (Value Rebalancing)** - Medium risk changes affecting economy
3. **Phase 3 (Prestige Scaling)** - Medium risk changes to prestige system

The Splitter ball type has been deferred to DESIGN004 due to implementation complexity.

Key considerations:
- All numeric changes use `break_infinity.js` Decimal where applicable
- Existing saves should remain compatible (old costs just mean players paid different prices)
- Tests should verify the new values and formulas

## Implementation Plan

### Phase 1: Quick Wins (Low Risk)
- Reduce Fast ball cost from 50 to 30 coins
- Increase Explosive ball radius from 50 to 70 pixels
- Increase tier cap from 10 to 20

### Phase 2: Value Rebalancing (Medium Risk)
- Implement exponential brick value formula: `floor(tier^1.2)`
- Increase Sniper ball cost from 2500 to 3500 coins
- Reduce upgrade cost growth from ×1.2 to ×1.15

### Phase 3: Prestige Scaling (Medium Risk)
- Add scaling prestige thresholds [10k, 20k, 40k]
- Update Stats UI to show current prestige threshold

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description | Status | Updated | Notes |
|-----|-------------|--------|---------|-------|
| 1.1 | Reduce Fast ball cost to 30 | Not Started | 2025-11-28 | `src/types/game.ts` |
| 1.2 | Increase Explosive radius to 70 | Not Started | 2025-11-28 | `src/types/game.ts` |
| 1.3 | Increase tier cap to 20 | Not Started | 2025-11-28 | `src/store/gameStore.ts` |
| 2.1 | Implement exponential brick value | Not Started | 2025-11-28 | `src/game/GameScene.ts` |
| 2.2 | Increase Sniper cost to 3500 | Not Started | 2025-11-28 | `src/types/game.ts` |
| 2.3 | Reduce upgrade cost growth to ×1.15 | Not Started | 2025-11-28 | `src/store/gameStore.ts` |
| 3.1 | Add scaling prestige thresholds | Not Started | 2025-11-28 | `src/types/game.ts`, `src/store/gameStore.ts` |
| 3.2 | Update UI to show current threshold | Not Started | 2025-11-28 | `src/components/Stats.tsx` |
| 4.1 | Add/update unit tests for changes | Not Started | 2025-11-28 | `tests/` |
| 4.2 | Manual playtesting validation | Not Started | 2025-11-28 | Verify pacing improvements |

## Progress Log

### 2025-11-28
- Created task file from DESIGN003
- Outlined all subtasks across 3 phases plus testing
- Ready for implementation

## Testing Checklist

- [ ] Verify Fast ball cost is 30
- [ ] Verify Sniper ball cost is 3500
- [ ] Verify Explosive radius is 70
- [ ] Verify tier cap is 20
- [ ] Verify brick value formula: `Math.floor(tier^1.2)`
- [ ] Verify upgrade cost growth is ×1.15
- [ ] Verify prestige thresholds scale correctly [10k, 20k, 40k]

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/game.ts` | Ball costs, explosion radius, prestige constants |
| `src/store/gameStore.ts` | Tier cap, upgrade growth, prestige logic |
| `src/game/GameScene.ts` | Brick value formula |
| `src/components/Stats.tsx` | Display current prestige threshold |

## Risks

| Risk | Mitigation |
|------|------------|
| Exponential value breaks economy | Test with simulation; adjust exponent if needed |
| Save compatibility | Document migration; existing saves use old costs |
| Prestige threshold too high | Monitor feedback; adjust post-launch |

---

*Task created from DESIGN003 | 2025-11-28*
