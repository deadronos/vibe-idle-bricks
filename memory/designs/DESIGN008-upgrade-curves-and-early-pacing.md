# DESIGN008 — Upgrade curves and early pacing (#64, #65)

## Problem

- Upgrade cost grew ×1.15 per level while the effect grew a flat +10% of base,
  so each level bought less than the last. Speed also capped at 50.
- A fresh game started with 0 coins and one 1-damage ball: first brick ~44 s,
  ~0.05 coins/s, so the cheapest 100-coin upgrade was ~30 minutes away.

## Changes

| | Before | After |
|---|---|---|
| Starting coins | 0 | 35 |
| Upgrade base costs | 100 / 150 / 200 | 50 / 75 / 100 |
| Upgrade cost growth | ×1.15 | ×1.10 |
| Ball cost growth | ×1.15 | unchanged |
| Upgrade effect | +10% of base per level | unchanged |

Cost growth is now close to the +10% effect. Because cost still compounds, value
per coin decays about 9% per level, but slower than before and slower than
balls, which stay at ×1.15 and get relatively more expensive over time. Costs
are recomputed from level on load, so existing saves adopt the new curve.

Speed stays capped at 50 (6× base speed). At 60 Hz and the current ball
radius, higher speeds risk tunneling through bricks; the cap is a physics
limit, not an economy decision.

## UI

Each upgrade row shows its current and next total effect (`Speed ×1 → ×1.1`).
At max speed it shows `Max: ×6`.

## Evidence

Live Playwright run on a fresh save (1440×900):

- Start: 35 coins, enough for two basic balls (10 + 12) outright.
- A third ball (14) is affordable within seconds from earned coins; the run
  reached four balls (one starting) with ~0 spent coins.
- 24 coins earned in the next 60 s (~0.4 coins/s).
- First 50-coin upgrade therefore affordable in ~2 minutes; the next costs 55,
  then 61, so the second and third stay well under 10 minutes.

## Tests

- Store: starting coins and base costs, ×1.10 growth, buy-max totals.
- Shop: current → next effect text.
- Constants: `STARTING_COINS = 35`, `UPGRADE_COST_MULTIPLIER = 1.1`.

## Save compatibility

Upgrade costs are derived from the saved level on load, so old saves adopt the
new curve immediately. That is a deliberate one-time windfall: a level-20
speed save paid ~1,637 coins under the old curve and now sees ~340. Existing
players also keep their levels, so the change cannot make them weaker.

Prestige intentionally starts at 0 coins: upgrades and the ×1.75 multiplier
carry over, so the run earns faster than a fresh game even without the grant.
