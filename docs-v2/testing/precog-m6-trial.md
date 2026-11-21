# Precognition on the M6 reserve: harness trial

2026-11-21 (overnight run). M6 integration checklist item 5 (`docs-v2/spec/m6-integration-checklist.md`). It tests reserve spec §2–5 (`docs-v2/spec/force-reserve.md`) as far as precognition needs them, using the unit conversion from the step 1 report (`docs-v2/testing/m6-step1-report.md` §1). **Not adopted.** The game still runs the M5 rule. The prototype is `src/engine/precogTrial.ts`, behind `PRECOG_TRIAL.enabled` (false). Only the test harness turns it on, through the `PRECOG_M6` environment variable (`tests/support/precogTrial.ts`).

## Verdict

- **Best candidate: base 5 per exchange**, the catalog's Complex sustained cost (`force-catalog-m6.md`).
  - Every rolls §8 duel table row, every lifetime gate on all 20 seeds of all four profiles, and the Y_avg median pass, as they do now.
  - The D-158 rows, mortal wounds and lost limbs stay within run-to-run noise of the M5 baseline.
- **Targets:**
  - **A Padawan feels it: met.** At 25 v 25, 27% of Padawans lose their precognition before the duel ends, and the median Padawan ends with half the pool.
  - **Sustainable for a whole duel from senior Knight upward: met in real fights, but not in long even duels.**
    - In the lifetime runs, a senior Knight or stronger loses precognition in at most 0.5% of real fights.
    - In equal duels of 4,000 runs, 12–18% of fighters at every rank go dark, at a median of exchange 60–70. These are the long, bloody duels.
    - The cause is the reserve spec's pain focus strain, not the upkeep (next section). With pain strain off, Masters go dark 0%, senior Knights 0.7% and Knights 2.5%.
- **Integration looks feasible.** No gate or table moves at base 5, so the M5 model does not have to stay for balance reasons.
  - Your one decision is how pain strain should work on a sustained ability.
  - Until you decide, M5 stays.
- Bases above 5 only make things worse. At base 10, 20% of senior Knights go dark; at base 15, one Obi-Wan seed fails the ±20% milestone gate.

## The finding that matters: pain sets a floor that rank does not lift

Reserve §4 adds a flat focus strain each exchange while a hold is up and the fighter is hurt:
- moderate wound +0.01
- severe +0.02
- critical or mortal +0.03

That strain does not scale with the pool, the Conditioning or the draw. A fighter carrying a severe wound for 50 exchanges takes +1.0 strain from pain alone and crosses the running-on-will line, whatever their rank.

In long equal duels both fighters are usually wounded, so the dark share is the same at every rank: 13% for a Knight, 13% for a senior Knight, 12–18% for a Master. It even rises with the Masters, because their duels last longest (median 53 exchanges at 100 v 100).

Switching pain strain off (diagnostic only, not a candidate) removes the floor and leaves the rank gradient the brief asks for.

Options for you (none built):
1. Keep it. A badly wounded fighter losing the future is good fiction, and in real lifetime fights it happens in under 1% of fights.
2. Scale pain strain by Conditioning, the way the comfort line and the usual rate already scale.
3. Count pain strain once per wound rather than every exchange.
4. Exempt sustained senses (precognition, Battle Meditation later) from the per-exchange pain strain and keep it for active holds.

## Model and harness assumptions

| Item | As run | Source |
|---|---|---|
| Potential (count) | Average Jedi 10,000; Anakin and Luke 27,700; Obi-Wan 13,000 (strong Master); generated NPCs 10,000 | brief; reserve §11 |
| Pool ceiling | 500 × (count / 10,000)^1.5 (10,000 → 500; 27,700 → 2,305) | reserve §11 |
| Pool max | Ceiling × share by Force Sense: 30% at 20, 70% at 50, 95% at 90, interpolated | anchored on reserve §3 worked example; harness assumption |
| Conditioning | By fighting level: 0 at 0, 10 at 20, 40 at 50, 70 at 90, 85 at 120 | harness assumption |
| Comfort line | 50% of the pool at Conditioning 0 → 20% at 100 | brief / reserve §4 defaults |
| Usual rate | 2% of the pool per exchange at Conditioning 0 → 8% at 100 | brief / reserve §4 defaults |
| Draw | base × state ÷ efficiency. State: centered 0.85, tired 1 + 0.5 × strain (cap 1.5). Efficiency 1 + level/50 + Force Control/100, both read as Force Sense | reserve §2 |
| Strain | draw ÷ pool max × min(8, depth × rate) + focus | reserve §4 |
| Depth multiplier | 0.25 at or above the comfort line, 0.25 × 32^d below it (d = depth under the line as a share of the line) | reserve §4 |
| Rate multiplier | 2^(draw share ÷ usual − 1), 1 at or below usual, cap 4 | reserve §4 |
| Focus strain | duration 0.001 per exchange held; pain moderate 0.01, severe 0.02, critical/mortal 0.03; fear 0.01 | reserve §4 |
| Strain unit | strain = Force meter ÷ capacity (step 1 conversion B1); trial strain is added to the meter as strain × capacity | step 1 report §1 |
| Tiers | worse of pool and strain; "senses go dark" = running on will (strain > 1.0 or pool empty) | reserve §12; brief |
| Precognition | held from exchange 1; upkeep paid every exchange; trigger chance exactly D-244 min(0.5, FS/200) while held; once dark, off for the rest of the fight (lull centering not modelled, the pessimistic choice) | brief; catalog (never free in combat) |
| Old M5 cost | the 0.4 meter load per trigger is skipped while the trial runs (the pool replaces it) | step 1 conversion |
| Fight start | full pool; strain carries in through the Force meter | harness assumption |
| Exchange | one combat round = one exchange; no killing-blow softening | brief |

## Sweep and runs

**Candidates:**
- off (the M5 baseline)
- base 5, 7.5, 10 and 15
- base 5 with pain strain off (diagnostic)

The comfort-line and usual-rate defaults were not swept. Base 5 already meets the upkeep targets, and the remaining dark share comes from pain, which those two defaults do not touch.

**Each candidate ran the following, sharded across 8 cores, with all 20 seeds per profile:**
- `npm run mortals`: 4 profiles × 20 seeds of lifetimes with every lifetime gate, plus the duel-table, D-158 and precog-trial report files.
- `npm run sweep`.
- `npm run severs`.

| Candidate | mortals | sweep | severs | Total |
|---|---|---|---|---|
| off | 1,025 s | 40 s | 1,006 s | 2,071 s |
| base 5 | 974 s | 42 s | 1,017 s | 2,033 s |
| base 7.5 | 979 s | 41 s | 1,014 s | 2,034 s |
| base 10 | 991 s | 42 s | 1,019 s | 2,052 s |
| base 15 | 1,032 s | 42 s | 1,010 s | 2,084 s |
| base 5, pain off | 962 s | 41 s | 1,015 s | 2,018 s |

The whole batch took 12,292 s (3 h 25 min). Each mortals run passed all 11 of its tests, and each sweep passed both of its tests.

## Results

### Rolls §8 duel tables (target in brackets)

| Gap | off | base 5 | base 7.5 | base 10 | base 15 | base 5 pain off |
|---|---|---|---|---|---|---|
| 0: win (50), median (34) | 49.8 / 34 | 49.6 / 35 | 49.5 / 35 | 49.1 / 35 | 50.0 / 35 | 49.7 / 34 |
| 5 (60 / 33) | 59.6 / 32 | 59.5 / 32 | 59.8 / 32 | 60.1 / 32 | 60.3 / 32 | 59.9 / 32 |
| 10 (68 / 34) | 68.7 / 33 | 69.2 / 33 | 69.3 / 34 | 69.2 / 33 | 69.8 / 33 | 68.8 / 33 |
| 20 (84 / 29) | 82.6 / 29 | 82.7 / 29 | 82.7 / 30 | 82.8 / 30 | 83.0 / 30 | 82.7 / 29 |
| 30 (92 / 24) | 91.2 / 24 | 91.0 / 24 | 91.3 / 24 | 91.2 / 24 | 91.3 / 24 | 91.2 / 24 |
| 40 (96 / 20) | 95.7 / 19 | 95.7 / 19 | 95.6 / 19 | 95.6 / 19 | 95.8 / 20 | 95.7 / 19 |
| 60 (99 / 13) | 99.0 / 14 | 99.0 / 14 | 99.0 / 14 | 99.0 / 14 | 99.1 / 14 | 99.0 / 14 |

Every row passes for every candidate:
- medians 30–40 at gaps 0–10
- the gap-20 median within 29 ± 5
- win rates within ±3 points

Precognition's trigger chance is unchanged while it is held. The per-exchange average falls only because dark fighters stop triggering. At Knight 45 v 45 it is 0.098 off, 0.090 at base 5 and 0.071 at base 15. At Padawan 25 v 25 it is 0.098, 0.079 and 0.038.

### D-158 rows (300 fights each; the heavy-Force rows are the only ones that move)

| Row (win / wounded / mortal %) | off | base 5 | base 7.5 | base 10 | base 15 |
|---|---|---|---|---|---|
| 10 B1, heavy Force | 68.3 / 12.3 / 11.7 | 63.7 / 16.0 / 15.0 | 63.7 / 14.3 / 13.7 | 59.7 / 14.7 / 13.7 | 58.7 / 18.0 / 17.0 |
| 10 militia, heavy Force | 68.3 / 14.0 / 12.3 | 70.7 / 8.7 / 7.0 | 67.7 / 10.3 / 9.0 | 66.0 / 9.0 / 7.7 | 63.0 / 10.7 / 9.7 |
| 6 troopers, heavy Force | 84.7 / 12.7 / 6.0 | 88.7 / 11.3 / 4.0 | 87.0 / 12.0 / 4.7 | 85.0 / 12.3 / 4.7 | 80.3 / 15.7 / 7.0 |
| 6 elites, heavy Force | 74.0 / 28.0 / 14.3 | 70.3 / 26.7 / 12.3 | 70.7 / 27.7 / 11.7 | 71.7 / 27.7 / 11.0 | 71.7 / 25.7 / 9.3 |
| 4 Mandalorians, heavy Force | 89.0 / 14.0 / 5.3 | 87.3 / 12.3 / 5.0 | 87.3 / 13.3 / 6.0 | 84.7 / 15.7 / 8.3 | 84.3 / 14.7 / 7.0 |

- **Balanced and mixed rows** are identical to the baseline or within 1 point in every candidate.
- **Heavy-Force rows at base 5** move both ways by up to 4.6 points. The standard error at 300 fights is about 2.7 points.
- **Base 5 with pain off** gives the same heavy-Force numbers as base 5 (B1 63.7 / 16.0 / 15.0) with almost no dark senses. The shift therefore comes from dropping the old 0.4 meter load, which changes the meter and the dice path. It is not caused by precognition going dark.
- **Base 10 and 15** pull the heavy-Force wins down steadily, to 58.7–63.0% on B1 and militia at base 15.
- The D-158 report has no pass/fail assertions. Its targets are D-158's (heavy Force is not one of them).

### Lifetime gates, mortal wounds, lost limbs (20 seeds per profile)

| Candidate | Gates failing | Y_avg median, worst | Mortal mean A / L / O / Avg | Lost mean A / L / O | Severs = mortals lost |
|---|---|---|---|---|---|
| off | none | +2.8% at 90 | 5.55 / 4.70 / 2.20 / 0.35 | 1.00 / 1.15 / 0.70 | yes |
| base 5 | none | +2.8% at 90 | 4.60 / 5.15 / 2.15 / 0.40 | 0.85 / 1.25 / 0.90 | yes |
| base 7.5 | none | +2.8% at 90 | 5.35 / 5.25 / 2.15 / 0.40 | 0.90 / 1.55 / 0.90 | yes |
| base 10 | none | +2.6% at 90 | 4.80 / 4.90 / 1.50 / 0.40 | 0.65 / 1.55 / 0.70 | yes |
| base 15 | Obi-Wan s8 milestones ±20% | +2.1% at 90 | 5.25 / 5.15 / 2.00 / 0.35 | 1.10 / 1.30 / 0.75 | yes |
| base 5, pain off | none | +2.8% at 90 | 5.55 / 5.00 / 2.20 / 0.35 | 1.00 / 1.15 / 0.70 | yes |

(A = Anakin, L = Luke, O = Obi-Wan, Avg = Average.)

- **Milestones:** the medians change by at most 0.3 years in any profile. Base 5 Anakin is 1.28 / 3.71 / 7.44 / 13.47 / 18.82 against 1.28 / 3.70 / 7.42 / 13.56 / 19.08 off. The Average's 41 stays at 15.99 y in every candidate.
- **Mortal and lost means** move by about ±1 per lifetime with no trend across the bases. A few dark fights change a lifetime's later dice, and 20 seeds of 4–6 mortal wounds carry about ±0.5 standard error.
- **Lost limbs:** severs reproduces the mortals lost-limb means exactly for every candidate.

### How often fighters reach the running-on-will tier

**Real fights in the lifetime runs (the player; and Force-user opponents at or above the Force-user minimum level):**

| Candidate | Anakin | Luke | Obi-Wan | Average | Opponents A / L / O / Avg |
|---|---|---|---|---|---|
| base 5 | 0.3% of 22,051 | 0.5% of 5,623 | 0.1% of 5,611 | 0.0% of 1,740 | 0.2 / 6.0 / 1.9 / 2.5% |
| base 7.5 | 0.5% | 0.5% | 0.1% | 0.1% | 0.2 / 13.9 / 1.9 / 2.5% |
| base 10 | 0.3% | 0.5% | 1.0% | 0.3% | 0.7 / 24.2 / 1.2 / 3.8% |
| base 15 | 0.4% | 0.8% | 3.6% | 2.8% | 1.9 / 37.9 / 5.0 / 10.0% |
| base 5, pain off | 0.0% | 0.0% | 0.0% | 0.0% | 0.0 / 6.1 / 0.0 / 0.0% |

Luke's Force-user opponents go dark 6% of the time even with pain off. These are pool-limited fighters with counts of 10,000 facing a 27,700-count fighter in long fights. They are the only fighters whose darkness comes from the upkeep alone at base 5.

**Equal and table duels (4,000 duels per row): share of fighters who went dark, and the median exchange it happened.**

| Row (duel median) | base 5 | base 7.5 | base 10 | base 15 | base 5 pain off |
|---|---|---|---|---|---|
| Padawan 25 v 25 (29) | 26.7% @53 | 40.8% @38 | 52.8% @28 | 68.8% @17 | 21.8% @57 |
| Padawan 35 v 35 (31) | 16.6% @61 | 26.5% @56 | 36.4% @46 | 51.2% @31 | 8.6% @90 |
| Padawan 30 v Knight 45 (28) | 13.8% @58 | 21.4% @48 | 28.5% @37 | 42.0% @24 | 6.2% @73 |
| Knight 45 v 45 (33) | 13.1% @60 | 18.3% @64 | 24.4% @60 | 39.2% @45 | 2.5% @131 |
| Senior Knight 55 v 55 (36) | 12.8% @61 | 15.5% @62 | 20.4% @66 | 32.2% @57 | 0.7% @170 |
| Master 70 v 70 (37) | 12.5% @63 | 13.6% @61 | 15.3% @62 | 23.6% @68 | 0.0% |
| Master 85 v 85 (43) | 14.6% @67 | 15.2% @67 | 16.8% @67 | 23.8% @76 | 0.0% |
| Master 100 v 100 (53) | 17.6% @71 | 18.1% @70 | 19.7% @71 | 24.9% @78 | 0.0% |
| Table gap 0 (34) | 13.5% @61 | 16.5% @63 | 22.1% @66 | 35.0% @53 | 1.1% @153 |
| Table gap 20 (28) | 8.6% @59 | 10.0% @58 | 12.4% @60 | 20.4% @52 | 0.3% @153 |
| Table gap 60 (14) | 0.5% @53 | 0.7% @51 | 1.0% @49 | 2.5% @44 | 0.0% |

**End-of-duel pool share and strain at base 5:**

| Row | Pool | Strain |
|---|---|---|
| Padawan 25 | 53% | 0.20 |
| Knight 45 | 77% | 0.12 |
| Senior Knight 55 | 81% | 0.11 |
| Master 70 | 85% | 0.10 |
| Master 100 | 86% | 0.12 |

The exhausted tier peaks at about 4–5% for every rank.

At base 5, a fighter at senior Knight level or higher who goes dark does so around exchange 60–70. That is nearly twice the median duel length, and it happens only to the wounded. Below Knight, the pool runs out as well: Padawan 25's median end pool is 53%, and the darkness arrives earlier (exchange 53).

## What integration would need (not done)

- **Pain strain.** Your decision on how pain focus strain works on sustained senses (the four options above).
- **The live engine:**
  - pool and Conditioning per character (M6 build steps 2–4)
  - the counts for named characters
  - pool max from Force Sense
  - lull centering, so a darkened sense can come back
- **Retiring the M5 rule.** The 0.4 meter load per trigger goes, with the step 1 unit conversion for the rest of the meter.
- **Re-measuring before adoption.** A full `npm run test:all` and the duel-table and D-158 reports. Nothing here changes `K` or the lifetime schedules.
