# DESIGN007: Tier and Prestige Balance

Implements issues #62 (tier curve) and #63 (prestige).

## Problem

Brick health grew linearly with tier (`tier * 3`) while value grew as
`tier^1.2`. A tier-20 brick took 20x as long to break for 1.8x the income, so
progress was a penalty. Prestige reset coins, balls, upgrades, and tier for an
additive +25%, while the next threshold doubled — never a good trade.

## Tier curve

| | Formula | Tier 1 | Tier 20 |
|---|---|---|---|
| Health | `3 * (1 + 0.25 * (tier - 1))` | 3 | 17.25 (5.75x) |
| Value | `floor(tier^1.6)` | 1 | 120 (120x) |

- Health grows slowly, value grows fast. Coins per point of health rises every
  tier (tested), so a higher tier pays more for roughly the same work.
- Tier 1 pacing is unchanged (3 health, 1 coin).
- Damage upgrades (+10% each) and prestiges keep kill time from growing with
  the 5.75x health increase.

## Prestige

- `PRESTIGE_MULTIPLIER = 1.75`: every level multiplies **damage and coin
  income** by 1.75. Damage is included because brick break rate is the limit,
  not coin income.
- **The goal stays at 10,000 bricks.** A growing goal cannot stay faster: once
  balls one-shot bricks, the break rate is capped by ball count and speed, so
  damage stops helping and a 1.5x threshold would make every later run longer.
  A fixed goal turns prestige into a speedrun of the same board, which is the
  only shape that stays honest under the cap.
- **Kept:** upgrade levels and their costs, achievements, prestige bonus.
- **Reset:** coins, balls, ball costs, tier, bricks broken this run.
- The confirm dialog now states what is kept as well as what is reset.

## Simulation (greedy player, offline-rate proxy)

Coins/s use the game's own `OFFLINE_EARNINGS_CONSTANT` conversion from
nominal ball power to bricks/s.

- First 10k bricks: **0.47 h** vs 1.31 h with the old curve.
- Prestige: same 10,000-brick goal with 1.75x damage and income per level, so
  projected time falls until the one-hit/ball-cap floor, then stays flat
  instead of growing.
- Fixed one-ball comparison: tier 20 brick takes 5.75x longer (115 s vs 20 s)
  but pays 21x more per second (1.04 vs 0.05 coins/s); with normal purchasing
  the measured per-brick time falls from 20 s at tier 1 to 0.1 s at tier 20.
- Offline earnings use the same `value * 3 / health` yield factor (normalised
  to 1 at tier 1) and apply the prestige bonus once.

## Tests

- `tests/types/game.test.ts`: value/health strictly increasing by tier; health
  ratio ≤ 6x; value at 20 ≥ 100; prestige work strictly decreasing.
- `tests/store/gameStore.test.ts`: prestige keeps upgrades and upgrade costs,
  resets balls/coins/tier; damage multiplier includes prestige.
- `tests/components/*`: new prestige copy and thresholds.
