# DESIGN003 - Game Balance Improvements

**Status:** Proposed  
**Created:** 2025-11-28  
**Related Analysis:** [docs/game-balance-analysis.md](../../docs/game-balance-analysis.md)

## Overview

This design addresses balance issues identified in the game progression analysis. The goal is to improve mid-to-late game pacing, fix ball type value propositions, and add depth to the prestige system.

## Requirements (EARS Format)

### High Priority

1. **REQ-001**: THE SYSTEM SHALL reduce Fast ball base cost from 50 to 30 coins.
   - **Acceptance:** Fast ball costs 30 coins at first purchase; cost scaling (×1.15) remains unchanged.
   - **Rationale:** Current 5× cost for 2× DPS is poor ROI compared to other balls.

2. **REQ-002**: THE SYSTEM SHALL extend the tier system cap from 10 to 20.
   - **Acceptance:** Tier increases every 100 bricks until tier 20; health scales as `tier × 3`.
   - **Rationale:** Current cap creates 9,100 bricks of repetitive gameplay before prestige.

3. **REQ-003**: THE SYSTEM SHALL scale prestige threshold based on prestige level.
   - **Acceptance:** First prestige at 10,000 bricks, second at 20,000, third+ at 40,000.
   - **Rationale:** Prevents diminishing challenge after first prestige. Smoother 2× scaling curve.

### Medium Priority

4. **REQ-004**: THE SYSTEM SHALL use exponential brick value scaling: `value = floor(tier^1.2)`.
   - **Acceptance:** Tier 1 = 1 coin, Tier 5 = 6 coins, Tier 10 = 15 coins, Tier 20 = 36 coins.
   - **Rationale:** Higher tiers should feel more rewarding.

5. **REQ-005**: THE SYSTEM SHALL increase Sniper ball base cost from 2500 to 3500 coins.
   - **Acceptance:** Sniper costs 3500 coins at first purchase.
   - **Rationale:** 8.3× relative DPS for 250× cost is too strong late-game. 3500 balances the nerf without making it inaccessible.

6. **REQ-006**: THE SYSTEM SHALL increase Explosive ball radius from 50 to 70 pixels.
   - **Acceptance:** Explosions affect bricks within 70px radius.
   - **Rationale:** Current 50px radius often hits only 0–2 extra bricks, making AoE underwhelming.

### Low Priority

7. **REQ-007**: THE SYSTEM SHALL reduce upgrade cost growth from ×1.2 to ×1.15 per level.
   - **Acceptance:** Upgrade costs at level 10: Speed ~260, Damage ~390, Coin ~520.
   - **Rationale:** Current growth outpaces income potential in mid-game.

### Deferred (Future Design)

- **Splitter Ball** *(Deferred to DESIGN004)*: New ball type at 750 base cost that splits into 2 temporary balls on brick collision.
  - **Reason for deferral:** Splitting mechanics add significant complexity (temporary ball management, collision handling, visual feedback). Recommend separate design document with proper scoping.

## Architecture

### Constants Changes

```typescript
// src/types/game.ts - Updated constants

export const BALL_TYPES: Record<BallType, BallTypeConfig> = {
  // ... existing balls
  fast: {
    speed: 6,
    damage: 1,
    color: '#60a5fa',
    pierce: false,
    explosive: false,
    targeting: false,
    baseCost: 30,  // Changed from 50
    description: '2x speed',
  },
  sniper: {
    speed: 5,
    damage: 5,
    color: '#10b981',
    pierce: false,
    explosive: false,
    targeting: true,
    baseCost: 3500,  // Changed from 2500
    description: 'Targets weakest bricks',
  },
  explosive: {
    speed: 3,
    damage: 2,
    color: '#ef4444',
    pierce: false,
    explosive: true,
    explosionRadius: 70,  // Changed from 50
    targeting: false,
    baseCost: 1000,
    description: 'Damages nearby bricks',
  },
};

export const PRESTIGE_THRESHOLD = 10000;  // Base threshold
export const PRESTIGE_THRESHOLD_SCALE = [10000, 20000, 40000];  // Scaling thresholds (2× curve)
```

### Brick Value Formula Change

```typescript
// src/game/GameScene.ts - BrickManager class

// Current
value: new Decimal(tier),

// Proposed
value: new Decimal(Math.floor(Math.pow(tier, 1.2))),
```

### Tier Cap Change

```typescript
// src/store/gameStore.ts - incrementBricksBroken

// Current
const newTier = Math.min(10, 1 + Math.floor(...));

// Proposed  
const newTier = Math.min(20, 1 + Math.floor(...));
```

### Prestige Threshold Change

```typescript
// src/store/gameStore.ts - canPrestige

// Current
return state.bricksBroken.gte(PRESTIGE_THRESHOLD);

// Proposed
canPrestige: () => {
  const state = get();
  const thresholds = [10000, 20000, 40000];
  const threshold = thresholds[Math.min(state.prestigeLevel, thresholds.length - 1)];
  return state.bricksBroken.gte(threshold);
},
```

### Upgrade Cost Growth Change

```typescript
// src/store/gameStore.ts - buyUpgrade

// Current
[type]: cost.mul(1.2).ceil(),

// Proposed
[type]: cost.mul(1.15).ceil(),
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Balance Change Impact                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Early Game (0-500 bricks)                                      │
│  ├── Fast ball now accessible earlier (30 vs 50 coins)         │
│  └── Slightly faster progression to mid-game                    │
│                                                                  │
│  Mid Game (500-5000 bricks)                                     │
│  ├── Gap between Plasma (500) and Explosive (1000) remains     │
│  ├── Upgrade costs grow slower (×1.15 vs ×1.2)                 │
│  ├── Exponential brick value rewards tier progression          │
│  └── Tier 10-20 provides continued challenge                    │
│                                                                  │
│  Late Game (5000-10000+ bricks)                                 │
│  ├── Sniper requires more investment (3500 vs 2500)            │
│  ├── Explosive more effective with 70px radius                  │
│  └── Tier 20 bricks (60 HP) provide challenge                   │
│                                                                  │
│  Prestige Loop                                                   │
│  ├── First prestige: 10,000 bricks                              │
│  ├── Second prestige: 20,000 bricks (2× longer)                │
│  └── Third+: 40,000 bricks (2× curve)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Quick Wins (Low Risk)

| ID | Task | Files | Effort |
|----|------|-------|--------|
| 1.1 | Reduce Fast ball cost to 30 | `src/types/game.ts` | 5 min |
| 1.2 | Increase Explosive radius to 70 | `src/types/game.ts` | 5 min |
| 1.3 | Increase tier cap to 20 | `src/store/gameStore.ts` | 5 min |

### Phase 2: Value Rebalancing (Medium Risk)

| ID | Task | Files | Effort |
|----|------|-------|--------|
| 2.1 | Implement exponential brick value | `src/game/GameScene.ts` | 15 min |
| 2.2 | Increase Sniper cost to 3500 | `src/types/game.ts` | 5 min |
| 2.3 | Reduce upgrade cost growth to ×1.15 | `src/store/gameStore.ts` | 10 min |

### Phase 3: Prestige Scaling (Medium Risk)

| ID | Task | Files | Effort |
|----|------|-------|--------|
| 3.1 | Add scaling prestige thresholds | `src/types/game.ts`, `src/store/gameStore.ts` | 20 min |
| 3.2 | Update UI to show current threshold | `src/components/Stats.tsx` | 15 min |

### Phase 4: Deferred to DESIGN004

The Splitter ball type has been deferred to a separate design document due to implementation complexity. See **Deferred** section in Requirements.

## Testing Strategy

### Unit Tests

- [ ] Verify Fast ball cost is 30
- [ ] Verify Sniper ball cost is 3500
- [ ] Verify Explosive radius is 70
- [ ] Verify tier cap is 20
- [ ] Verify brick value formula: `Math.floor(tier^1.2)`
- [ ] Verify upgrade cost growth is ×1.15
- [ ] Verify prestige thresholds scale correctly

### Integration Tests

- [ ] Play through early game (0-500 bricks) and verify pacing
- [ ] Verify tier progression to 20 works correctly
- [ ] Test prestige at each threshold level
- [ ] *(Deferred)* Test Splitter ball splitting behavior

### Balance Validation

- [ ] Time to first 1000 coins should be ~5-8 minutes
- [ ] Time to first prestige should be ~6-10 hours
- [ ] All ball types should see purchase at some point

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Exponential value breaks economy | High | Test with simulation; can adjust exponent (1.15-1.25) |
| Splitter ball causes performance issues | Medium | *Deferred to DESIGN004* |
| Save compatibility | Medium | Existing saves use old costs; document migration |
| Prestige threshold too high | Medium | Monitor feedback; can adjust thresholds post-launch |

## Success Metrics

1. **Mid-game retention:** Players should not hit a "wall" before 3000 bricks
2. **Ball variety:** All ball types purchased at least once per run
3. **Prestige engagement:** 50%+ of players should reach first prestige
4. **Late-game challenge:** Tier 15+ bricks should take multiple hits to destroy

## Decision Records

### DR-001: Fast Ball Rebalance Approach

**Decision:** Reduce cost from 50 to 30 (rather than increasing speed from 6 to 7)

**Rationale:**
- Speed 7 would make Fast too similar to Sniper (speed 5 + targeting)
- Lower cost maintains the "budget option" identity
- Easier to balance without affecting physics calculations

### DR-002: Brick Value Exponent Selection

**Decision:** Use exponent 1.2 for brick value scaling

**Rationale:**
- 1.1 too subtle (Tier 10 = 12.6 vs 10)
- 1.3 too aggressive (Tier 10 = 20 vs 10)
- 1.2 provides noticeable but not game-breaking improvement (Tier 10 = 15.8)

### DR-003: Prestige Threshold Scaling

**Decision:** Use fixed thresholds [10k, 25k, 50k] rather than exponential formula

**Rationale:**
- Predictable milestones are easier for players to understand
- Exponential would make later prestiges feel impossible
- Three tiers covers most player engagement range

---

*Design by AI Assistant | November 2025*
