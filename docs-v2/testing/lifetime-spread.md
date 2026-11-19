# Lifetime seed spread (2026-11-19, overnight)

Report only: nothing was tuned. Each lifetime profile ran on its fixed seed and 19 more (`<profile>-s1` to
`-s19`), through the same harness and gates as `tests/lifetime` (`npm run spread`; tests/spread/). Code: the
combat pass 2 fixes D-208 to D-216 with the physical hard limit at 4.0 (D-208 amended).

80 lifetimes in all.

## Gates that fail on more than 2 of the 20 seeds

| Profile | Gate | Seeds failing |
|---|---|---|
| anakin | within 4.0x | 8 of 20 |
| anakin | Clone Wars share 25-35% | 8 of 20 |
| obiwan | Clone Wars share 20-30% | 4 of 20 |

Each gate is tuned on the fixed seed (D-159: the fixed seed plus 5 more for retunes). A gate that fails on many seeds is a band narrower than the run-to-run spread, not a broken fixed seed.

What the flags mean (report only):

- **Anakin, within 4.0x (8 of 20).** The gate is "no milestone faster than the Average's target / 4". Every failing seed fails at tier 41, which must take at least 4.0 years (16.0 / 4); the fixed seed takes 4.18, the 10th percentile 3.85. The 4.0x clamp (D-48) holds his training XP, but scripted war combat XP early in the Clone Wars lands before 41 on some seeds. At 41 every seed is inside ±20% and ≤ 1.2 x target; one seed (`anakin-s17`) misses both at 81 (16.39 y against 16.2).
- **Anakin, Clone Wars share 25-35% (8 of 20).** Mostly age 19 (6 seeds below 25%; median 25.4%, the fixed seed 25.2%). The band's floor sits on the median of the first war year.
- **Obi-Wan, Clone Wars share 20-30% (4 of 20).** Age 36 above 30% on 3 seeds (up to 36.9%) and age 35 below 20% on one (18.3%). D-159 already accepted this spread for seed 3.
- Everything else fails on 2 seeds or fewer: the Average's K check (41 at 16.0 ± 0.1 y: 2) and Y_avg (2).

Compared with the first run (physical hard limit 2.0), the amendment to 4.0 lowered Anakin's war-share failures from 12 to 8 and Obi-Wan's from 6 to 4; the 4.0x failures went from 6 to 8 (seed noise at tier 41).

## The Average (highest form; 95 years)

20 seeds: `average` (the fixed seed) and `average-s1` to `-s19`. Years to each milestone; the target and the +/-20% band are progression-numbers §12.

| Milestone | Target (band) | Fixed seed | Median | 10th pct | 90th pct | Worst seed (years, off target) |
|---|---|---|---|---|---|---|
| 21 | 5.0 (4.00-6.00) | 4.19 | 4.18 | 4.15 | 4.21 | `average-s18` 4.13 (-17.4%) |
| 41 | 16.0 (12.80-19.20) | 16.03 | 15.98 | 15.92 | 16.04 | `average-s5` 15.84 (-1.0%) |
| 61 | 32.1 (25.68-38.52) | 33.54 | 33.44 | 33.36 | 33.55 | `average-s19` 33.67 (+4.9%) |
| 81 | 52.7 (42.16-63.24) | 55.26 | 55.13 | 54.95 | 55.28 | `average-s19` 55.54 (+5.4%) |
| 101 | 77.5 (62.00-93.00) | 82.28 | 82.12 | 81.91 | 82.42 | `average-s19` 82.48 (+6.4%) |

Gates (tests/lifetime), seeds failing out of 20:

| Gate | Fails | Seeds |
|---|---|---|
| K: 41 at 16.0 +/- 0.1 y | 2 | `average-s5`, `average-s13` |
| milestones +/-20% | 0 | none |
| not faster than Anakin; within 4.0x | 0 | none |
| peacetime combat < 10% | 0 | none |
| Y_avg within +/-5% | 2 | `average-s6`, `average-s16` |
| rank minimums +/-2 y | 0 | none |
| day-end tiredness < 1.1 | 0 | none |

Gate values across seeds: yAvgMaxDeviation median 0.027, range 0.019-0.157; peacetimeMaxShare median 0.010, range 0.008-0.025.

Run time per seed: median 67 s.

## Anakin (main form; 70 years)

20 seeds: `anakin` (the fixed seed) and `anakin-s1` to `-s19`. Years to each milestone; the target and the +/-20% band are progression-numbers §12.

| Milestone | Target (band) | Fixed seed | Median | 10th pct | 90th pct | Worst seed (years, off target) |
|---|---|---|---|---|---|---|
| 21 | 1.3 (1.04-1.56) | 1.29 | 1.30 | 1.28 | 1.44 | `anakin-s16` 1.51 (+16.4%) |
| 41 | 4.1 (3.28-4.92) | 4.18 | 4.20 | 3.85 | 4.60 | `anakin-s4` 4.73 (+15.4%) |
| 61 | 8.2 (6.56-9.84) | 9.26 | 8.70 | 7.88 | 9.26 | `anakin-s17` 9.33 (+13.8%) |
| 81 | 13.5 (10.80-16.20) | 15.82 | 15.46 | 14.93 | 15.98 | `anakin-s17` 16.39 (+21.4%) |
| 101 | 19.9 (15.92-23.88) | 22.35 | 21.91 | 21.16 | 22.44 | `anakin-s17` 22.74 (+14.3%) |

War-year combat share of the yearly main-form XP (band 25-35%):

| Age | Fixed seed | Median | 10th pct | 90th pct | Min (seed) | Max (seed) | Seeds outside the band |
|---|---|---|---|---|---|---|---|
| 19 | 25.2% | 25.4% | 22.6% | 27.4% | 21.0% (`anakin-s17`) | 28.4% (`anakin-s11`) | 6 |
| 20 | 26.1% | 27.4% | 26.0% | 29.4% | 24.2% (`anakin-s16`) | 31.6% (`anakin-s7`) | 2 |
| 21 | 26.4% | 27.6% | 25.5% | 30.0% | 24.7% (`anakin-s13`) | 30.7% (`anakin-s15`) | 1 |

Gates (tests/lifetime), seeds failing out of 20:

| Gate | Fails | Seeds |
|---|---|---|
| milestones +/-20% | 1 | `anakin-s17` |
| every milestone <= 1.2 x target | 1 | `anakin-s17` |
| within 4.0x | 8 **FLAG** | `anakin-s2`, `anakin-s3`, `anakin-s5`, `anakin-s6`, `anakin-s12`, `anakin-s14`, `anakin-s15`, `anakin-s18` |
| Clone Wars share 25-35% | 8 **FLAG** | `anakin-s4`, `anakin-s5`, `anakin-s6`, `anakin-s8`, `anakin-s9`, `anakin-s13`, `anakin-s16`, `anakin-s17` |

Gate values across seeds: warMin median 0.252, range 0.210-0.269; warMax median 0.284, range 0.264-0.316.

Run time per seed: median 55 s.

## Obi-Wan (main form; 70 years)

20 seeds: `obiwan` (the fixed seed) and `obiwan-s1` to `-s19`. Years to each milestone; the target and the +/-20% band are progression-numbers §12.

| Milestone | Target (band) | Fixed seed | Median | 10th pct | 90th pct | Worst seed (years, off target) |
|---|---|---|---|---|---|---|
| 21 | 3.4 (2.72-4.08) | 3.25 | 3.25 | 3.23 | 3.28 | `obiwan-s3` 3.22 (-5.2%) |
| 41 | 10.8 (8.64-12.96) | 12.62 | 12.46 | 12.29 | 12.70 | `obiwan-s8` 12.97 (+20.1%) |
| 61 | 21.7 (17.36-26.04) | 23.65 | 23.56 | 23.45 | 23.76 | `obiwan-s8` 24.22 (+11.6%) |
| 81 | 35.6 (28.48-42.72) | 39.41 | 39.49 | 39.29 | 39.91 | `obiwan-s8` 40.19 (+12.9%) |
| 101 | 52.4 (41.92-62.88) | 59.65 | 59.67 | 59.50 | 60.19 | `obiwan-s8` 60.50 (+15.5%) |

War-year combat share of the yearly main-form XP (band 20-30%):

| Age | Fixed seed | Median | 10th pct | 90th pct | Min (seed) | Max (seed) | Seeds outside the band |
|---|---|---|---|---|---|---|---|
| 35 | 24.2% | 24.0% | 21.1% | 26.5% | 18.3% (`obiwan-s12`) | 27.4% (`obiwan-s9`) | 1 |
| 36 | 24.0% | 27.4% | 23.8% | 32.3% | 21.6% (`obiwan-s18`) | 36.9% (`obiwan-s14`) | 4 |
| 37 | 26.4% | 25.6% | 22.5% | 27.2% | 20.0% (`obiwan-s19`) | 28.0% (`obiwan-s15`) | 0 |

Gates (tests/lifetime), seeds failing out of 20:

| Gate | Fails | Seeds |
|---|---|---|
| milestones +/-20% | 1 | `obiwan-s8` |
| not faster than Anakin; within 4.0x | 0 | none |
| Clone Wars share 20-30% | 4 **FLAG** | `obiwan-s3`, `obiwan-s4`, `obiwan-s12`, `obiwan-s14` |
| peacetime combat < 10% | 0 | none |

Gate values across seeds: warMin median 0.229, range 0.183-0.258; warMax median 0.274, range 0.235-0.369; peacetimeMaxShare median 0.080, range 0.077-0.089.

Run time per seed: median 59 s.

## Luke (Force Control; 70 years)

20 seeds: `luke` (the fixed seed) and `luke-s1` to `-s19`. Years to each milestone; the target and the +/-20% band are progression-numbers §12.

| Milestone | Target (band) | Fixed seed | Median | 10th pct | 90th pct | Worst seed (years, off target) |
|---|---|---|---|---|---|---|
| 21 | 2.1 (1.68-2.52) | 1.85 | 1.90 | 1.82 | 2.02 | `luke-s1` 1.78 (-15.4%) |
| 41 | 6.9 (5.52-8.28) | 6.02 | 6.14 | 6.02 | 6.33 | `luke-s12` 5.93 (-14.0%) |
| 61 | 13.9 (11.12-16.68) | 12.50 | 12.64 | 12.49 | 12.80 | `luke-s12` 12.44 (-10.5%) |
| 81 | 22.8 (18.24-27.36) | 21.39 | 21.54 | 21.37 | 21.72 | `luke-s12` 21.35 (-6.4%) |
| 101 | 33.6 (26.88-40.32) | 33.91 | 33.96 | 33.77 | 34.25 | `luke-s3` 34.38 (+2.3%) |

Gates (tests/lifetime), seeds failing out of 20:

| Gate | Fails | Seeds |
|---|---|---|
| milestones +/-20% | 0 | none |
| not faster than Anakin; within 4.0x | 0 | none |
| Force still rising at 40-42 y of training; > 100 at 62 | 0 | none |
| physical peak at 58-68 | 0 | none |

Gate values across seeds: physicalPeakAge median 65.000, range 65.000-65.000.

Run time per seed: median 30 s.

## For comparison: the first run (hard limit 2.0, before the amendment)

80 lifetimes. Gates failing on more than 2 of 20 seeds then:

| Profile | Gate | Seeds failing |
|---|---|---|
| anakin | within 4.0x | 6 of 20 |
| anakin | Clone Wars share 25-35% | 12 of 20 |
| obiwan | Clone Wars share 20-30% | 6 of 20 |

