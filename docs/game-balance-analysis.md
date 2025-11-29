# Game Balance & Progression Analysis

**Game:** Idle Bricks  
**Version:** Current (as of analysis)  
**Date:** November 2025

---

## Executive Summary

**Overall Rating: 6.5/10** — Solid foundation with clear progression, but some imbalances in mid-to-late game pacing and ball type value propositions.

### Quick Ratings

| Category | Rating | Notes |
|----------|--------|-------|
| Early Game (0–1000 coins) | ⭐⭐⭐⭐ (8/10) | Smooth onboarding, clear goals |
| Mid Game (1000–10000 coins) | ⭐⭐⭐ (6/10) | Some pacing issues, upgrade costs outpace income |
| Late Game (Pre-prestige) | ⭐⭐ (5/10) | Repetitive, lacks meaningful choices |
| Prestige System | ⭐⭐⭐ (6/10) | Functional but needs more depth |
| Ball Variety | ⭐⭐⭐⭐ (7/10) | Good differentiation, some overlap |
| Upgrade System | ⭐⭐⭐ (6/10) | Linear scaling, lacks interesting decisions |

---

## Core Mechanics Analysis

### 1. Brick Health & Value Scaling

**Current Formula:**
- Health: `tier × 3` (Tier 1 = 3 HP, Tier 10 = 30 HP)
- Value: `tier` coins (Tier 1 = 1 coin, Tier 10 = 10 coins)

| Tier | Health | Value | HP per Coin |
|------|--------|-------|-------------|
| 1 | 3 | 1 | 3.0 |
| 2 | 6 | 2 | 3.0 |
| 3 | 9 | 3 | 3.0 |
| 5 | 15 | 5 | 3.0 |
| 10 | 30 | 10 | 3.0 |

**Analysis:** Linear scaling maintains a constant HP/coin ratio. This is **too flat** — higher tiers should feel more rewarding to incentivize progression.

**Recommendation:** Consider exponential value scaling:
```
value = tier^1.2  (Tier 10 → ~15.8 coins instead of 10)
```

### 2. Tier Progression

**Current:** Tier increases every 100 bricks broken (capped at tier 10).

| Bricks | Tier |
|--------|------|
| 0–99 | 1 |
| 100–199 | 2 |
| 500–599 | 6 |
| 900+ | 10 |

**Analysis:** Progression is predictable but the cap at tier 10 creates a ceiling effect. Combined with the 10,000 brick prestige threshold, players will spend significant time at max tier with no new challenges.

**Issues:**
- 900+ bricks at tier 10 = ~9,100 bricks of repetitive gameplay before prestige
- No soft prestige incentives before threshold

### 3. Ball Type Economics

| Ball | Base Cost | Damage | Speed | Special | Value Proposition |
|------|-----------|--------|-------|---------|-------------------|
| Basic | 10 | 1 | 3 | — | Baseline |
| Fast | 50 | 1 | 6 | — | 2× speed, 5× cost |
| Heavy | 100 | 3 | 2.5 | — | 3× damage, 10× cost, slower |
| Plasma | 500 | 2 | 4 | Pierce | 50× cost for pierce |
| Explosive | 1000 | 2 | 3 | AoE (50px) | 100× cost, niche |
| Sniper | 2500 | 5 | 5 | Targeting | 250× cost, best damage |

**DPS Analysis (approximate, ignoring bounces):**

Damage Per Second ≈ `(damage × speed) / average_bounce_distance`

| Ball | Damage × Speed | Relative DPS |
|------|----------------|--------------|
| Basic | 1 × 3 = 3 | 1.0× |
| Fast | 1 × 6 = 6 | 2.0× |
| Heavy | 3 × 2.5 = 7.5 | 2.5× |
| Plasma | 2 × 4 = 8 (+ pierce) | 2.7×+ |
| Explosive | 2 × 3 = 6 (+ AoE) | 2.0×+ |
| Sniper | 5 × 5 = 25 (targeted) | 8.3× |

**Balance Issues:**

1. **Fast ball is undervalued** — 2× DPS for 5× cost is poor ROI
2. **Sniper is overpowered** — 8.3× DPS for 250× cost is excellent late-game
3. **Explosive needs tuning** — AoE is situational; 50px radius often hits 0–2 extra bricks
4. **Heavy is well-balanced** — Good mid-game option

**Recommendations:**
- Fast: Reduce cost to 30 or increase speed to 7
- Sniper: Reduce damage to 4 or increase cost to 5000
- Explosive: Increase radius to 70px or add chain reaction

### 4. Upgrade System

**Current Costs & Scaling:**

| Upgrade | Base Cost | Cost Growth | Effect |
|---------|-----------|-------------|--------|
| Speed | 100 | ×1.2 per level | +10% per level |
| Damage | 150 | ×1.2 per level | +10% per level |
| Coin Mult | 200 | ×1.2 per level | +10% per level |

**Cost at Key Levels:**

| Level | Speed Cost | Damage Cost | Coin Cost |
|-------|------------|-------------|-----------|
| 1 | 100 | 150 | 200 |
| 5 | 207 | 311 | 414 |
| 10 | 516 | 774 | 1,032 |
| 20 | 3,834 | 5,750 | 7,667 |
| 30 | 28,470 | 42,705 | 56,940 |

**Analysis:**

- **Early levels (1–10):** Reasonable costs, good ROI
- **Mid levels (10–20):** Costs grow faster than income potential
- **Late levels (20+):** Diminishing returns, each +10% feels less impactful

**Issue:** The 10% linear boost becomes less noticeable at high levels:
- Level 10 = 2× multiplier (each level added +5% effective increase)
- Level 20 = 3× multiplier (each level added +3.3% effective increase)

**Recommendation:** Consider diminishing cost growth (×1.15) or increasing boost per level at higher tiers.

### 5. Prestige System

**Current:**
- Threshold: 10,000 bricks broken
- Reward: +25% permanent coin bonus per prestige
- Resets: coins, upgrades, balls, tier
- Keeps: prestigeLevel, totalBricksBroken

**Time to First Prestige (estimated):**

Assuming average DPS and brick spawn rates:
- ~10 bricks/minute early → ~30 bricks/minute late
- Rough estimate: 500–800 minutes (8–13 hours) of active play

**Analysis:**

✅ **Good:**
- Clear milestone
- Meaningful reset mechanic
- Permanent progression preserved

❌ **Issues:**
- Single prestige layer limits long-term engagement
- 25% bonus compounds slowly (need 4 prestiges for 2× coins)
- No prestige upgrades or choices
- 10,000 threshold may feel arbitrary

**Recommendations:**
1. Add prestige-exclusive upgrades (e.g., start with 2 balls, unlock new ball types)
2. Consider scaling threshold (1st = 10k, 2nd = 25k, 3rd = 50k)
3. Add "prestige points" currency for meta-upgrades

---

## Progression Flow Analysis

```
Early Game (0-500 bricks)
├── Start with 1 basic ball
├── First purchases: Basic balls (cost 10→12→14...)
├── First upgrade: Speed (100 coins) around ~100 bricks
└── Tier 1-5 progression feels good

Mid Game (500-3000 bricks)
├── Unlock Heavy balls (100 base)
├── Start Plasma consideration (500)
├── Upgrade costs start to outpace income
└── ⚠️ "Wall" feeling around 2000-3000 bricks

Late Game (3000-10000 bricks)
├── Working toward Sniper (2500)
├── Tier 10 reached at 900 bricks (ceiling hit early!)
├── Gameplay becomes repetitive
└── ⚠️ 7000+ bricks of grind with no new content

Prestige Transition
├── Reset is satisfying
├── 25% bonus noticeable
└── Second run ~20% faster
```

### Identified Walls

1. **500–700 bricks:** Fast balls feel expensive for their value
2. **1500–2500 bricks:** Plasma → Sniper gap is large
3. **3000–10000 bricks:** No new unlocks, pure grind

---

## Recommendations Summary

### High Priority

1. **Rebalance Fast ball:** Cost 30 (from 50) or Speed 7 (from 6)
2. **Extend tier system:** Increase cap to 20, adjust prestige threshold accordingly
3. **Add mid-game content:** New ball type at 750–1000 cost range

### Medium Priority

4. **Exponential brick value:** `tier^1.2` for better reward feeling
5. **Prestige upgrades:** Spend prestige points on permanent unlocks
6. **Sniper nerf:** Reduce damage to 4 or increase cost to 5000

### Low Priority / Future Considerations

7. **Achievement system:** Milestone rewards for variety
8. **Challenge modes:** Special brick types or time-limited events
9. **Offline progress improvements:** Current 50% rate feels punishing

---

## Appendix: Key Constants Reference

```typescript
// types/game.ts
UPGRADE_MULTIPLIER = 0.1      // 10% per upgrade level
PRESTIGE_BONUS = 0.25         // 25% per prestige
OFFLINE_EARNINGS_RATE = 0.5   // 50% while offline
PRESTIGE_THRESHOLD = 10000    // Bricks to prestige

// Ball scaling
Ball cost growth: ×1.15 per purchase
Upgrade cost growth: ×1.2 per level

// Brick scaling
Health: tier × 3
Value: tier (linear)
Tier increase: every 100 bricks
Tier cap: 10
```

---

*Analysis by AI Assistant | This document should be updated as game balance changes are implemented.*
