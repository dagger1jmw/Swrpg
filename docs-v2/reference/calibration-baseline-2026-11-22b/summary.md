# Baseline numbers (commit 8bcaa5f)

## Curve and ceiling
- K = 11.683 (docs-v2/calc/progression-sim.mjs), XP(L) = K x L^1.75; XP(41) = 7,761.
- `PACE_CAP` 4.0 over 365 days against `Y_AVG` (12: 557, 16: 531, 20: 550, 24: 450, 30: 396, 40: 471, 60: 487, 90: 289);
  ages 20, 24, 30 frozen (D-426) and skipped by the sanity checks. `M_CAP` 2.8.
- Accelerated path x3.2 (cap x3.2). Force-rich world x1.10 on Force skills (planet level only).

## Routine
- Padawan and apprentice fixed hours 5 h at every age (master 2 h, solo form 1 h, Force Control 1 h, awareness 1 h; the
  Sith apprentice the same with awareness). Fixed blocks alone end a standard day at f 1.01 at 12, 0.96 at 14, 0.92 at 16.
- Daily life: meditation block off; Knight study 1 h on 3 days of 7 (DAILY_LIFE_PACES Force Knowledge 0.139, Consular 0.189).

## Rank ladder
- Padawan 12 (min 10: highest form 24, Force Control 14). Knight 25 (min 18, 10 Padawan years: highest form 47, Force Control 40,
  Force Sense 36, Willpower 56). Master: main specialty 58 (met by the Average at 33.7), typical 35.
- Standing: 50% percentile, 30% deeds (20 a deed, capped at 5), 20% relationships; bypass 75.

## Lifetime results at this commit (gated seed `-s9`; measured from the tag, 2026-11-22; lifetime suite 247 s + era 603 s)
| Profile | 21 | 41 | 61 | 81 | 101 |
|---|---|---|---|---|---|
| Average | 4.21 | 16.05 | 32.56 | 54.19 | 81.11 |
| Obi-Wan | 3.25 | 12.50 | 23.62 | 39.12 | 59.29 |
| Anakin | 1.28 | 3.68 | 7.22 | 12.93 | 18.18 |
| Luke | 1.92 | 6.00 | 12.50 | 21.48 | 33.48 |

- Luke on the accelerated path: 21 / 41 / 61 at 0.83 / 2.51 / 4.81 years.
- npc test 7 (Knight at 20.5, 25 years): Guardian 52.38 vs 52.50; Consular 41.77 vs 39.87; Sentinel 51.63 / 51.76; Sith Warrior
  50.48 / 50.53; Inquisitor 43.17 / 43.26; soldier 57.65 / 57.66; Mandalorian 57.04 / 58.53; smuggler 59.06 / 60.64; bounty
  hunter 56.68 / 56.66; civilian 67.64 / 66.16.
- Knowledge (Average Guardian / Consular at 25 / 40 / 60): Force Knowledge 13.0 / 19.9 / 27.9 and 14.3 / 57.4 / 93.5;
  Meditation 11.9 / 16.6 / 22.0 and 13.0 / 27.6 / 41.7.
- Swordmaster: main form 57.4 at 30, 70.2 at 40, 91.8 at 60.
