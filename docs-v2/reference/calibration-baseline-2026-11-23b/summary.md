# Baseline numbers (commit 5498ac3)

## Curve and ceiling
- K = 12.45; XP(L) = K x L^1.75. `M_CAP` 2.8.
- The 4.0x clamp (D-457): per skill, over 365 days, 4.0 x the Average's XP per hour in that skill (src/data/paceRates.ts,
  Phase A measurement) x the character's hours in it. Fights are outside it.
- `Y_AVG` (the lifetime 4.0x floor and the yearly table gate): 4: 583, 8: 609, 12: 606, 16: 625, 20: 629, 24: 558,
  30: 484, 40: 472, 50: 462, 60: 480, 70: 449, 80: 448, 90: 338, 98: 207. Under the per-hour clamp the Average's year at 98
  reads +19% (the old share rule had clamped it); not yet re-measured.
- Accelerated path x3.5 (cap x3.2). Force bonuses: Force-rich x1.10, major nexus x1.15, site x1.15.

## Rank ladder
- Padawan 12 (min 10: highest form 24, Force Control 14). Knight 25 (highest form 47, Force Control 41, Force Sense 40,
  Willpower 58). Master: main specialty 64.
- The Initiate Trials: highest form at rating 20 and Force Control at rating 20, both needed.
- The Initiate row: Shii-Cho basics 2 h with instructors, Force Control 0.5 h, Sense 0.5 h, Force lore 1 h.

## Last measured lifetime results (gated seed `-s9`; D-456, commit 51a14cd, the share clamp)
| Profile | 21 | 41 | 61 | 81 | 101 |
|---|---|---|---|---|---|
| Average | 4.49 | 16.01 | 31.86 | 54.27 | 82.68 |
| Obi-Wan | 3.46 | 12.49 | 22.03 | 40.27 | 64.62 |
| Anakin | 1.27 | 3.77 | 7.28 | 13.54 | 19.07 |
| Luke | 1.95 | 6.23 | 13.08 | 22.82 | 36.55 |

- 20-seed spread (D-456): every gate 20 of 20 except Obi-Wan's milestones (0 of 20) and Clone Wars share (1 of 20).
- Phase A (the per-hour clamp, the Average measured with the clamp open): the Average's 41 at 15.91-16.04 on all 20 seeds;
  Obi-Wan's Soresu 0.87-1.03x the Average's XP per hour at 15 / 25 / 40; nothing discarded.
