# Baseline numbers (commit 07d3a11)

## Curve and ceiling
- K = 12.30; XP(L) = K x L^1.75.
- `PACE_CAP` 4.0 over 365 days against `Y_AVG` (4: 582, 8: 611, 12: 599, 16: 604, 20: 620, 24: 560, 30: 405, 40: 468,
  50: 461, 60: 498, 70: 452, 80: 446, 90: 300, 98: 204). `M_CAP` 2.8.
- Accelerated path x3.4 (cap x3.2).
- Force bonuses on Force skills: ordinary nexus or Force-rich planet x1.10; major nexus planet x1.15 (Tython, Korriban,
  Dromund Kaas; D-451); site x1.15; no stacking; leaning must match or be balanced.

## Rank ladder
- Padawan 12 (min 10: highest form 24, Force Control 14). Knight 25 (min 18, 10 Padawan years: highest form 47, Force
  Control 41, Force Sense 40, Willpower 58). Master: main specialty 64, typical 40.

## Where the calibration lives (D-445, D-451)
- Average, Obi-Wan, Anakin: the Order seat by the run's calendar (the Coruscant Temple at the neutral test year, x1.15).
- Luke: Dagobah x1.10 for one month at 22 (D-452; measured with three months before this baseline).
- Jedi archetypes: paces measured in the Coruscant Temple (D-445). Sith archetypes: paces measured with no home site;
  from this baseline they live at their seats (Korriban academy, Dromund Kaas), not yet re-measured.

## Last measured lifetime results (gated seed `-s9`; D-445, commit af22259, with Luke's three months)
| Profile | 21 | 41 | 61 | 81 | 101 |
|---|---|---|---|---|---|
| Average | 4.43 | 15.99 | 33.05 | 55.47 | 83.51 |
| Obi-Wan | 3.41 | 12.75 | 21.75 | 37.14 | 57.82 |
| Anakin | 1.31 | 3.79 | 7.36 | 13.43 | 19.10 |
| Luke | 2.15 | 6.86 | 14.35 | 24.79 | 38.38 |

- 20-seed spread: every gate on 20 of 20 except the Average's 41 at 16.0 +/- 0.1 (18 of 20) and Obi-Wan's Clone Wars
  share (19 of 20). Worst table deviation 0.7%.
- Luke on the accelerated path: Djem So 56.0 and Force Control 61.0 at year 5.
- npc test 7: every archetype within 1.7 levels of its closed form.
- Swordmaster: 55.6 / 67.3 / 88.7 at 30 / 40 / 60.
- The dip at 30 (D-455): the Average's 4.0x table point at 30 is 405 (444 before the Temple).
