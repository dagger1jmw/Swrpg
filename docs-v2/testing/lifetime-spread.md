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

- **Anakin, within 4.0x (8 of 20).** The gate is "no milestone faster than the Average's target / 4". Every failing seed fails at tier 41, which must take at least 4.0 years (16.0 / 4); the fixed seed takes 4.18, the 10th percentile 3.85. At 41 every seed is inside ±20% and ≤ 1.2 x target; one seed (`anakin-s17`) misses both at 81 (16.39 y against 16.2). *Why the pace clamp does not prevent it (measured 2026-11-19, corrected; the first version of this note blamed Clone Wars combat, which starts at 19, after tier 41 at about 13):* the clamp never binds. On the fixed seed and on `anakin-s2` and `-s5` (both failing) no XP is discarded, and his main-form XP in years 2-5 (1,400-2,220 a year, about 60% of it sparring with his master) stays under even the share-0.5 cap of 4.0 x Y_avg(age) (2,200-2,380 a year), let alone his own cap at his focus share 0.7 (x 1.4: 3,100-3,300). The gate measures something else: tier 41 is 7,761 XP, and the Average's highest form reaches it in 16.03 y, 484 XP a year, while Y_avg (the Average's most-trained form, per year of age) averages about 556 at ages 4-20. So 4.0 x Y_avg is about 4.6 x the pace the gate assumes at share 0.5, and about 6.4 x at Anakin's share. A seed reaches 41 under 4.0 y whenever its years 2-4 average above 1,940 XP (`-s2`: 2,080-2,180); the spread between seeds is in the sparring XP. Neither the rolling window (Anakin never reaches the cap) nor a clamp bypass (combat XP is clamped like training) is involved. Report only.
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


## Rerun after D-234 (fatigue curve), Anakin's retune, D-230 and D-235 (the Y_avg floor), 2026-11-19

Same harness, 20 seeds per profile, final code. Gates failing per profile (out of 20):

| Profile | Gate | Seeds failing |
|---|---|---|
| average | K: 41 at 16.0 +/- 0.1 y | 2: `average-s5`, `average-s13` |
| average | Y_avg within +/-5% | 2: `average-s6`, `average-s16` |
| anakin | milestones +/-20% | 1: `anakin-s1` |
| anakin | every milestone <= 1.2 x target | 1: `anakin-s1` |
| anakin | Clone Wars share 25-35% | 5: `anakin-s3`, `anakin-s4`, `anakin-s8`, `anakin-s11`, `anakin-s19` |
| obiwan | milestones +/-20% | 1: `obiwan-s8` |
| obiwan | Clone Wars share 20-30% | 3: `obiwan-s3`, `obiwan-s7`, `obiwan-s8` |

Every profile passes the 4.0x floor on all 20 seeds (D-235). Closest seed to its floor: average 4.010x, anakin 1.154x, obiwan 3.099x, luke 1.504x.

anakin war-year shares, 10th-90th percentile: age 19: 24.3-29.6% (median 26.4%); age 20: 25.2-28.6% (median 27.4%); age 21: 25.7-28.9% (median 26.7%).
obiwan war-year shares, 10th-90th percentile: age 35: 21.4-27.4% (median 23.5%); age 36: 22.7-29.9% (median 26.7%); age 37: 22.2-27.4% (median 24.0%).

anakin milestones, median of 20: 21 1.30 y, 41 4.43 y, 61 8.64 y, 81 15.48 y, 101 21.83 y.

## Rerun after D-244 (the weapon-arm rule, the duel-length retune, the war-share retune), 2026-11-19

Same harness, 20 seeds per profile, code at 2cf9c49. Report only: nothing tuned. Anakin and Obi-Wan are the profiles that changed (fight counts, D-244); every Luke and Average seed ran too.

Gates failing per changed profile (out of 20; the previous rerun in brackets):

| Profile | Gate | Seeds failing |
|---|---|---|
| anakin | milestones +/-20% | 0 [1] |
| anakin | every milestone <= 1.2 x target | 0 [1] |
| anakin | within 4.0x (D-235 floor) | 0 [0] |
| anakin | Clone Wars share 25-35% | **7** [5]: `anakin-s1`, `-s2`, `-s10`, `-s12`, `-s15`, `-s16`, `-s17` |
| obiwan | milestones +/-20% | 0 [1] |
| obiwan | not faster than Anakin; within 4.0x | 0 [0] |
| obiwan | Clone Wars share 20-30% | **7** [3]: `obiwan-s1`, `-s3`, `-s9`, `-s10`, `-s16`, `-s18`, `-s19` |
| obiwan | peacetime combat < 10% | 0 [0] |

Milestones (years; median, 10th-90th percentile; previous rerun's median in brackets):

| Milestone | Anakin target | Anakin fixed | Anakin median (p10-p90) | Obi-Wan target | Obi-Wan fixed | Obi-Wan median (p10-p90) |
|---|---|---|---|---|---|---|
| 21 | 1.3 | 1.30 | 1.29 (1.27-1.44) [1.30] | 3.4 | 3.25 | 3.25 (3.24-3.28) [3.25] |
| 41 | 4.1 | 3.99 | 4.03 (3.75-4.42) [4.43] | 10.8 | 12.24 | 12.48 (12.31-12.55) [12.46] |
| 61 | 8.2 | 8.39 | 8.38 (7.97-9.15) [8.64] | 21.7 | 23.53 | 23.57 (23.48-23.68) [23.56] |
| 81 | 13.5 | 15.27 | 15.24 (14.65-15.73) [15.48] | 35.6 | 39.73 | 39.51 (39.33-39.65) [39.49] |
| 101 | 19.9 | 21.42 | 21.54 (21.00-22.25) [21.83] | 52.4 | 59.96 | 59.75 (59.50-59.89) [59.67] |

War-year combat share of the yearly main-form XP (median, 10th-90th percentile, min-max, seeds outside the band; D-159's latest range in brackets):

| Profile, age | Fixed seed | Median | p10-p90 | Min-max | Outside the band |
|---|---|---|---|---|---|
| Anakin 19 (25-35%) | 27.1 | **33.9** | 32.1-36.2 | 27.1-37.4 | 6 above: s1 36.1, s2 36.0, s10 36.2, s12 36.2, s16 36.0, s17 37.4 [24.3-29.6, median 26.4] |
| Anakin 20 | 27.5 | 27.6 | 26.2-28.6 | 24.7-30.0 | 1 below: s15 24.7 [25.2-28.6, 27.4] |
| Anakin 21 | 25.2 | 27.1 | 26.0-28.4 | 25.2-29.3 | 0 [25.7-28.9, 26.7] |
| Obi-Wan 35 (20-30%) | 25.1 | 22.1 | 21.4-25.5 | 19.1-25.6 | 1 below: s16 19.1 [21.4-27.4, 23.5] |
| Obi-Wan 36 | 23.5 | **21.4** | 18.2-24.3 | 17.2-25.2 | 5 below: s1 18.2, s9 17.2, s10 19.9, s18 19.3, s19 17.9 [22.7-29.9, 26.7] |
| Obi-Wan 37 | 25.6 | 25.3 | 22.3-29.1 | 19.4-30.3 | 2: s3 19.4 below, s16 30.3 above [22.2-27.4, 24.0] |

Reading:
- **Anakin at 19:** the fixed seed (27.1%) is the lowest of the 20 seeds. The 25 sparring sessions added by D-244 to lift it put the median at 33.9%, near the top of the band, and six seeds above 35%. The retune was tuned on one seed that sits in the tail.
- **Obi-Wan at 36:** the fixed seed (23.5%) is above the median (21.4%). Cutting his duels from 12 to 10 moved the whole distribution down, so five seeds fall below 20%. The gap between 9 duels (21.1%) and 10 (23.5%) on the fixed seed was large; the seed spread at 36 is wide (17.2-25.2%).
- **Milestones:** better than before for both. No seed fails a milestone gate; Anakin's medians moved 0.2-0.4 y earlier at 41 to 101.
- **Against D-159's note:** a seed outside the band but inside the natural spread is expected. Here the spread itself has moved outside the band: Anakin's age-19 10th-90th range (32.1-36.2%) crosses 35%, and Obi-Wan's age-36 range (18.2-24.3%) crosses 20%.

## Tuned to the median, gated on s7 (D-159 amended), 2026-11-19

The four profile tests now run on `<profile>-s7`, the seed closest to the median across every gate of all four profiles (total normalized distance 4.89; next s6 5.50; the old fixed seed 8.20, 7th of 20). Fight counts retuned to the 20-seed median: Anakin's master sessions 25 -> 11 at 19 and + 10 at 21; Obi-Wan's duels at 36 10 -> 11. Average and Luke: the full spread with those counts; Anakin: his own 20-seed rerun after the age-21 sessions were added (the Average, Luke and Obi-Wan rows do not depend on Anakin's schedule).

Gates failing (out of 20; the previous run in brackets; target: no war-share gate failing on more than 2):

| Profile | Gate | Seeds failing |
|---|---|---|
| average | K: 41 at 16.0 +/- 0.1 y | 1 [2]: `average-s5` |
| average | Y_avg within +/-5% | 1 [2]: `average-s18` |
| average | other gates | 0 |
| anakin | milestones +/-20% and <= 1.2 x target | 1 [0]: `anakin-s18` (81 at 16.21 y, limit 16.20) |
| anakin | within 4.0x | 0 [0] |
| anakin | Clone Wars share 25-35% | **1** [7]: `anakin` (the old fixed seed, 21.5% at 19) |
| obiwan | milestones, 4.0x, peacetime | 0 [0] |
| obiwan | Clone Wars share 20-30% | **4** [7]: `obiwan-s16` (19.1% at 35), `obiwan-s2` (30.4% at 36), `obiwan-s9` and `obiwan-s18` (30.7% at 37) |
| luke | every gate | 0 [0] |

The gated seed s7 passes every gate of all four profiles.

Milestones (years; median, 10th-90th percentile; gated seed s7):

| Milestone | Anakin target | Anakin s7 | Anakin median (p10-p90) | Obi-Wan target | Obi-Wan s7 | Obi-Wan median (p10-p90) |
|---|---|---|---|---|---|---|
| 21 | 1.3 | 1.28 | 1.29 (1.27-1.44) | 3.4 | 3.26 | 3.25 (3.24-3.28) |
| 41 | 4.1 | 3.86 | 4.03 (3.75-4.42) | 10.8 | 12.49 | 12.48 (12.31-12.55) |
| 61 | 8.2 | 8.18 | 8.38 (7.97-9.15) | 21.7 | 23.71 | 23.57 (23.48-23.68) |
| 81 | 13.5 | 14.81 | 15.32 (14.70-15.90) | 35.6 | 39.35 | 39.38 (39.18-39.53) |
| 101 | 19.9 | 21.26 | 21.70 (21.23-22.26) | 52.4 | 59.49 | 59.59 (59.33-59.77) |

War-year combat share (median, 10th-90th percentile, min-max; s7):

| Profile, age | s7 | Median | p10-p90 | Min-max | Outside the band |
|---|---|---|---|---|---|
| Anakin 19 (25-35%) | 30.3 | 29.4 | 26.2-30.9 | 21.5-31.8 | 1 (the old fixed seed, 21.5) |
| Anakin 20 | 26.7 | 27.9 | 26.2-29.4 | 26.1-33.5 | 0 |
| Anakin 21 | 32.1 | 29.6 | 28.0-31.5 | 26.6-32.1 | 0 |
| Obi-Wan 35 (20-30%) | 22.1 | 22.1 | 21.4-25.5 | 19.1-25.6 | 1 (s16 19.1) |
| Obi-Wan 36 | 27.8 | 24.8 | 22.4-28.7 | 20.8-30.4 | 1 (s2 30.4) |
| Obi-Wan 37 | 25.5 | 24.7 | 22.0-28.7 | 21.2-30.7 | 2 (s9, s18 30.7) |

Obi-Wan's failing seeds, shares at 35 / 36 / 37: s2 22.0 / 30.4 / 22.8; s9 25.6 / 24.0 / 30.7; s16 19.1 / 26.6 / 27.0; s18 21.8 / 29.7 / 30.7. Each misses at one age only, beyond the 10th-90th range, with the medians centered: tails, not an offset. Not settled; options for Jared in docs-v2/progress.md.
