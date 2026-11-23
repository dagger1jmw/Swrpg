# The re-measurement pass and the Order's rules on powers (2026-11-22; D-431 to D-437)

Baseline first: tag `calibration-baseline-2026-11-22b` (commit 8bcaa5f, pushed) and
docs-v2/reference/calibration-baseline-2026-11-22b/ (the first baseline untouched).

## Before and after (gated seed `-s9`; years of training to each tier)

| Profile | Before (K 11.683) | After (K 12.30) | Target |
|---|---|---|---|
| Average | 4.21 / 16.05 / 32.56 / 54.19 / 81.11 | 4.43 / 15.99 / 33.19 / 55.79 / 84.00 | 5.0 / 16.0 / 32.1 / 52.7 / 77.5 |
| Obi-Wan | 3.25 / 12.50 / 23.62 / 39.12 / 59.29 | 3.41 / 12.76 / 21.82 / 37.26 / 57.89 | 3.4 / 10.8 / 21.7 / 35.6 / 52.4 |
| Anakin | 1.28 / 3.68 / 7.22 / 12.93 / 18.18 | 1.31 / 3.76 / 7.53 / 13.81 / 19.20 | 1.3 / 4.1 / 8.2 / 13.5 / 19.9 |
| Luke | 1.92 / 6.00 / 12.50 / 21.48 / 33.48 | 2.15 / 6.89 / 14.37 / 24.81 / 38.37 | 2.1 / 6.9 / 13.9 / 22.8 / 33.6 |

- Every gate passes on all 20 spread seeds except the Average's 41 at 16.0 +/- 0.1 (18 of 20; median 15.99).
- Anakin is inside the 4.0x on all 20 seeds; against the old table he was inside on only 8 of 20.
- Luke on the accelerated path (x3.4): Djem So 56.0 and Force Control 61.0 at year 5.
- K: 41 came at 15.22 years after the routine changes at the old K; 12.30 puts it at 15.995.
- The 4.0x table (Y_AVG):

  | Age | 12 | 16 | 20 | 24 | 30 | 90 |
  |---|---|---|---|---|---|---|
  | Before | 557 | 531 | 550 | 450 | 396 | 289 |
  | After | 599 | 604 | 620 | 560 | 444 | 324 |

  Every other age moved by 4% or less. The verification run puts the Average within 0.9% of the new table at every age.
- Rank minimums:
  - Knight: 47 / 40 / 36 / 56 -> 47 / 38 / 37 / 58. The halved Force Control hour puts the Average at Force Control 38.1 at 24.
  - Master: main specialty 58 -> 64, the Average's level at 40.
- Knowledge (Average Guardian, then Consular, at 25 / 40 / 60):

  | Stat | Profile | Before | After |
  |---|---|---|---|
  | Meditation | Guardian | 11.9 / 16.6 / 22.0 | 15.3 / 22.6 / 30.8 |
  | Meditation | Consular | 13.0 / 27.6 / 41.7 | 17.6 / 33.7 / 50.1 |
  | Force Knowledge | Guardian | 13.0 / 19.9 / 27.9 | 12.6 / 18.0 / 24.7 |
  | Force Knowledge | Consular | 14.3 / 57.4 / 93.5 | 16.0 / 57.0 / 92.1 |

- npc test 7, run with Knight at 25 now: every archetype's loop matches its closed form within 1.7 levels.

## Findings

- Career Willpower: on the loop, career archetypes gain Willpower at a pace of 0.18 to 0.30. The old calc model said 0.83 to 1.00, so career NPCs had about three times the Willpower they should.
- Obi-Wan reached 41 through Shii-Cho, his second Padawan form, which is the one the solo hour trains. Halving that hour put his 41 at 13.07 years, over the 12.96 limit. Profile fix: Shii-Cho 0.5 h in his Padawan plan, which brings 41 to 12.76.
- Long runs are slower. The era profile went from 602.8 s to 941.9 s. The spread took 2,069.4 s.

## Runtimes

| Run | Time |
|---|---|
| Baseline lifetime suite | 247.3 s |
| Baseline era profile | 604.5 s |
| Pace measurement | 205.8 to 285.5 s per run |
| Spread before the table change | 1,698.9 s |
| Spread after the table change | 2,069.4 s |
| Lifetime suite | 956.5 s, then 943.8 s |
