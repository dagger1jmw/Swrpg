# Precognition on the M6 reserve: trial 2 (pain once per new wound)

2026-11-21. Jared's ruling 1 on `precog-m6-trial.md` (a0be1ee). The model and harness assumptions are unchanged from trial 1, except for pain.

**Pain strain in trial 2:**
- **Spike per new wound.** It is added once each time a fighter takes a new wound while holding a sustained ability: moderate +0.05, severe +0.15, critical or mortal +0.30.
- **Carried wounds.** A wound the fighter already carries adds nothing per exchange.
- **Fear and duration strain** are unchanged.

Run settings: precognition at base 5 per exchange, harness switch `PRECOG_M6=base=5,wound=1`. The prototype stays flagged off in the game (`PRECOG_TRIAL.enabled = false`).

## Verdict

**Every target is met and every gate passes, with the starting spike values. No tuning was needed.**

**Equal duels against the targets:**

| Row | Target | Result |
|---|---|---|
| Masters | ≤2% | 0.0–0.1% |
| Senior Knight | ≤3% | 1.2% |
| Padawan 25 v 25 | 20–30% | 24.6% |

**The other checks:**
- Every rolls §8 duel table row and every lifetime gate passes on all 20 seeds of the four profiles, as off does.
- The D-158 heavy-Force rows at 1,000 fights are within 2.5 points of off.
- Mortal wounds and lost limbs are within noise.

**Logged as D-282.** Reserve spec §4 is amended in the repo copy; the design doc needs the same change before the next re-export. The prototype now defaults to this pain model, and `wound=0` reproduces trial 1.

## Runtimes (8 workers, 20 seeds)

| Job | Wall time |
|---|---|
| D-158 heavy-Force rows, 1,000 fights, off and base 5 (two processes in parallel) | 19 s |
| `npm run mortals` | 1,051 s |
| `npm run sweep` | 42 s |
| `npm run severs` | 1,071 s |
| **Total** | **2,183 s (36 min)** |

The off baseline is trial 1's run (a0be1ee), from the same code with the flag off.

The tests passed: mortals 11/11, sweep 2/2, D-158 1/1 each.

## Going dark (the running-on-will tier)

### Lifetime fights (real fights; opponents are Force users at or above the Force-user minimum)

| Profile | Player dark (trial 2) | Player dark (trial 1, base 5) | Opponents dark (trial 2) | Opponents dark (trial 1) |
|---|---|---|---|---|
| Anakin | 0 of 22,115 (0.0%) | 0.3% | 0 of 462 | 0.2% |
| Luke | 0 of 5,631 (0.0%) | 0.5% | 22 of 363 (6.1%) | 6.0% |
| Obi-Wan | 0 of 5,607 (0.0%) | 0.1% | 0 of 260 | 1.9% |
| Average | 0 of 1,740 (0.0%) | 0.0% | 0 of 80 | 2.5% |

Luke's Force-user opponents still go dark 6.1% of the time. They have counts of 10,000 and fight a 27,700-count Luke in long fights, so they run out of pool. Their rate is the same with pain switched off (trial 1 diagnostic: 6.1%), so it comes from the upkeep, not from pain. This is the intended "a smaller connection tires first" effect.

### Equal and table duels (4,000 duels per row)

| Row (duel median) | Dark (trial 2) | Median exchange it happened | End pool | End strain | Exhausted tier | Trial 1 dark |
|---|---|---|---|---|---|---|
| Padawan 25 v 25 (29) | **24.6%** | 55 | 52% | 0.22 | 2.7% | 26.7% |
| Padawan 35 v 35 (31) | 9.9% | 86 | 68% | 0.15 | 1.9% | 16.6% |
| Padawan 30 v Knight 45 (28) | 7.7% (the Padawan 14.1%) | 69 | 75% | 0.12 | 1.4% | 13.8% |
| Knight 45 v 45 (33) | 3.2% | 122 | 77% | 0.13 | 1.4% | 13.1% |
| Senior Knight 55 v 55 (37) | **1.2%** | 155 | 81% | 0.12 | 0.9% | 12.8% |
| Master 70 v 70 (37) | **0.1%** | 197 | 85% | 0.10 | 0.4% | 12.5% |
| Master 85 v 85 (43) | **0.0%** | n/a | 87% | 0.10 | 0.3% | 14.6% |
| Master 100 v 100 (54) | **0.0%** | n/a | 85% | 0.13 | 0.4% | 17.6% |
| Table gap 0 (35) | 1.8% | 142 | 79% | 0.13 | 1.0% | 13.5% |
| Table gap 5 (32) | 1.7% | 147 | 82% | 0.11 | 0.9% | 12.8% |
| Table gap 10 (32) | 1.0% | 142 | 83% | 0.10 | 0.8% | 12.1% |
| Table gap 20 (28) | 0.5% | 142 | 87% | 0.08 | 0.4% | 8.6% |
| Table gap 30 (24) | 0.2% | 138 | 89% | 0.06 | 0.2% | 5.8% |
| Table gap 40 (20) | 0.1% | 143 | 92% | 0.05 | 0.1% | 3.3% |
| Table gap 60 (14) | 0.0% | n/a | 95% | 0.03 | 0.0% | 0.5% |

**What this shows:**
- **The rank-independent floor is gone.** From Knight up, the fighters who go dark do so after exchange 120 or later, about four times the median duel.
- **Padawans still feel it.** A quarter of Padawan 25s lose precognition, and the median Padawan ends with half their pool.
- **Wounds still matter.** A severe wound costs 0.15 strain at once, and a critical or mortal one 0.30. A fighter who takes two or three wounds while already strained can still go dark mid-duel.

## Against off

### Rolls §8 duel tables (target in brackets)

| Gap | off | trial 2 |
|---|---|---|
| 0: win (50), median (34) | 49.8 / 34 | 49.7 / 34 |
| 5 (60 / 33) | 59.6 / 32 | 59.9 / 32 |
| 10 (68 / 34) | 68.7 / 33 | 68.8 / 34 |
| 20 (84 / 29) | 82.6 / 29 | 82.7 / 30 |
| 30 (92 / 24) | 91.2 / 24 | 91.2 / 24 |
| 40 (96 / 20) | 95.7 / 19 | 95.7 / 19 |
| 60 (99 / 13) | 99.0 / 14 | 99.0 / 14 |
| Test 3 (99+ / 5 or fewer) | 100.0 / 2 | 100.0 / 2 |

Every row passes:
- medians 30–40 at gaps 0–10
- the gap-20 median within 29 ± 5
- win rates within ±3 points

### D-158 heavy-Force rows, 1,000 fights each (win / wounded / mortal %)

| Row | off | trial 2 | Win difference |
|---|---|---|---|
| 10 B1 | 69.6 / 12.6 / 11.8 | 67.1 / 12.9 / 12.3 | −2.5 |
| 10 militia | 74.2 / 10.1 / 8.8 | 72.6 / 9.1 / 8.0 | −1.6 |
| 6 troopers | 83.4 / 12.6 / 6.7 | 83.9 / 13.4 / 7.2 | +0.5 |
| 6 elites | 77.0 / 25.0 / 10.6 | 75.0 / 24.5 / 9.9 | −2.0 |
| 4 Mandalorians | 85.5 / 13.4 / 4.4 | 85.4 / 13.9 / 5.4 | −0.1 |
| 6 B2 | 87.8 / 7.7 / 4.8 | 89.1 / 7.4 / 4.4 | +1.3 |
| 4 droidekas | 92.3 / 7.6 / 2.4 | 92.1 / 7.6 / 2.8 | −0.2 |

**Reading the heavy-Force rows:**
- The standard error of a difference at 1,000 fights is about 2 points, so every row is within 1.3 standard errors.
- Wounded and mortal shares move by at most 1 point.
- The 300-fight shift in trial 1 (B1 68.3 → 63.7) was mostly noise. At 1,000 fights it shrinks to −2.5.

**Balanced and mixed rows** (300 fights each, from the mortals run): identical to off except two rows that differ by a single fight:
- 6 elites mixed: exchanges 41.5 → 41.7.
- 4 Mandalorians balanced: mortal 1.0 → 0.7.

### Lifetime gates, mortal wounds, lost limbs (20 seeds per profile)

| Profile | Gates failing (off / trial 2) | Milestones median, 21/41/61/81/101 (trial 2) | Mortal mean (off → trial 2) | Lost mean (off → trial 2) |
|---|---|---|---|---|
| Anakin | none / none | 1.28 / 3.70 / 7.42 / 13.56 / 19.08 (same as off) | 5.55 → 5.55 | 1.00 → 1.00 |
| Luke | none / none | 1.91 / 6.07 / 12.54 / 21.48 / 33.61 (same as off) | 4.70 → 5.10 | 1.15 → 1.10 |
| Obi-Wan | none / none | 3.25 / 12.46 / 23.60 / 38.92 / 59.15 (same as off) | 2.20 → 2.20 | 0.70 → 0.70 |
| Average | none / none | 4.18 / 15.99 / 33.44 / 55.13 / 82.29 (same as off) | 0.35 → 0.35 | 0.00 → 0.00 |

**Other figures:**
- **Y_avg** 20-seed median: worst +2.8% at age 90, a pass, as off.
- **The Average's 41** is at 15.99 y.
- **War share** median: Anakin 29.6%, Obi-Wan 23.6%, as off.
- **severs** reproduces the mortals lost-limb counts seed by seed for every profile.
- **Luke's mortal mean** (+0.4) is the only change. It comes from his opponents going dark (6.1%), which changes later dice. It is within the ±0.5 standard error of 20 seeds.

## What changed in code (harness only)

**`src/engine/precogTrial.ts`:**
- `painPerWound` (default 1, the D-282 rule) and `painSpike` by severity.
- The trial state tracks `woundsSeen`, so only wounds taken since the last upkeep spike.

**Harness switch** (`tests/support/precogTrial.ts`):
- keys `wound` (0 or 1), `smod`, `ssev` and `scrit`

**D-158 report** (`tests/mortals/reports/d158.report.test.ts`):
- `D158_N` (fights per row, default 300)
- `D158_PATTERNS` (a comma list, default all three patterns)

**Unit test:**
- one spike per new wound, and none for a carried wound

**The game is unchanged:**
- `PRECOG_TRIAL.enabled = false`
- The M5 rule (0.4 load per trigger, gate at meter 1.0) runs until the M6 integration.
