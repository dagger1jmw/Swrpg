# Force XP rework: prototype trial 1 (neutral start)

2026-11-21. This trial builds `docs-v2/spec/force-xp-rework.md` as a prototype and measures it. Jared's brief asked for a flag that is off in the game, the sense-exercise draw rule, and Orgus Din's count of 7,000 as a design default.

**Status:**
- **Not adopted.**
- The flag is off in the game (`FORCE_XP_TRIAL.enabled = false` in `src/engine/forceXpTrial.ts`).
- No tuning was done past the neutral start.

## Verdict

**The neutral start fails one gate.** Luke's "physical peak at 58–68" fails on all 20 seeds: his peak moves from 65 to 82–83. Every other gate passes on all 20 seeds of the four profiles, as off does.

**What moved: the ceiling removal, not the neutral calibration.**
- Below level 80, the trial's challenge factor matches today's to within 0.01 in every rank, effort and kind row (table below).
- Above level 80, today's 10–90 ladder pays Luke an average challenge of 0.53. The trial pays 1.03, as the proposal intends.
- **His Force Control growth past 100 keeps its pace.** In off, his Force Control slows to about 0.6 a year after age 60. In the trial it keeps rising about 1.5 a year. He reaches Force Control 154 at 89, against 125 in off.
- **That growth holds off ageing.** Luke's physical performance includes the Force boost (§11: 0.3 × (FC − 40) + 0.2 × Force Speed, max 45). The extra boost offsets ageing until the boost cap binds at about age 82. That is where his peak lands.

**This needs a ruling, not tuning.** Any fix touches either the boost (a formula or cap) or the gate. Both choices are Jared's:
- Cap or flatten the Force boost.
- Let high-level Force growth be slower than the trial makes it.
- Move the peak gate.

As briefed, I stopped there. Items 2–4 ran in the same batch, so their results are below for information. They are measured on a start that is not neutral for Luke.

**Two more findings for the ruling:**
- **Orgus Din (item 3) fails by about 17 years.** His count of 7,000 makes the strain trim cut his heavy Control routine every day. The proposal's prediction that low Potential costs growth only past about 2 h a day of pushing does not hold for a 3.6 h routine.
- **Strain never binds for the four reference profiles (item 2).** The proposal predicted that strain would become the Padawan cap. In practice the meters still bind, as today. Strain stays at or below 0.22 everywhere.

## Run settings

**Harness switch:** `FORCE_XP=on` (or `collect`, which records the trial's numbers with the game rules unchanged). Optional keys: `trickle=` and `units=`.

**Defaults:**
- trickle 0.1
- rating slope 30, offset 20
- R (work units per hour) 12
- free-status finesse line +15
- strain limits: easy 0.4, standard 0.75, push 1.0
- K unchanged

**The off baseline** is a `collect` run of the same code.
- It gives the same lives seed by seed as off: every gate, milestone, mortal and lost-limb figure matches trial 2's off run (a0be1ee).
- It also records today's challenge factor for every Force session.

## Runtimes (8 workers, 20 seeds)

| Job | Wall time |
|---|---|
| `npm run mortals`, collect (off baseline) | 1,079 s |
| `npm run mortals`, on | 1,183 s |
| `npm run spread`, on | 1,447 s |
| Orgus suite, on (40 lives, 95 years) | 821 s |
| Orgus suite, collect (40 lives) | 813 s |
| Luke, one tracked life, collect and on in parallel (diagnosis) | 32 s |
| **Total** | **5,375 s (90 min)** |

Mortals and spread each run all 80 lives (4 profiles × 20 seeds). The spread rows match the mortals rows for the same mode.

## What was built (harness only)

**`src/engine/forceXpTrial.ts`** (pure):
- **Exercise model:**
  - rating = 20 + 30 · log2(demand / 10) + finesse
  - Control uses the catalog tier for the level, normal effort, and finesse for the rest, with no extra draw.
  - Output uses a continuous scale gated by pool, with effort making up the gap.
  - Sense follows the rule below.
- **Free rule with trickle:** an exercise is free (trickle 0.1) only when its tier and level qualify and its finesse is under 15.
- **Reserve:** pool, strain, recovery and conditioning per reserve spec §3–7.
- **Neutral targets** and the gap search that hits them.

**`src/features/progression/forceXpTrialHook.ts`:**
- Carries the reserve through each day (activity, then 8 h sleep).
- Builds each Force session's exercise, its rating and its challenge multiplier.
- Applies meditation refills.
- Records the challenge factor and the day statistics.

**Live-code hooks, each guarded by the flag** (`enabled`, or `collect` for recording only):
- `computeXp.ts`: an optional `challengeMult` input.
- `training.ts`: the exercise rating replaces the ladder rating for Force drills.
- `scheduler.ts`: the strain trim after the meter trim.
  - It cuts Force blocks first, then fill, then fixed blocks down to the fresh-day level, in the D-165 style.

**Tests:**
- `tests/engine/forceXpTrial.test.ts`: 8 tests.
- `tests/forcexp/`: the Orgus suite, sharded, run by `vitest.forcexp.config.ts`. It is excluded from `npm test` and `npm run test:all`.

**Sense exercises (Jared's rule, recorded in proposal §2):**
- **Draw:** the catalog's sustained cost per minute held. Force Sight costs 2 below level 60, and Precognition costs 5 from level 60.
- **Scaling:** distance class (reserve §3 factors) × effort × (1 + 0.1 per extra signature).
- **Finesse:** up to +70 adds rating and no draw. Above that, the distance class grows.

**Orgus Din's count of 7,000** is a design default (D-322, lore batch 2), not lore.

## 1. Neutral start

**Method:**
- The default exercise per rank row (Initiate, Padawan, Knight), effort and kind (control or output, and sense) is the one whose challenge factor matches today's hour-weighted mean in that row.
- Today's mean comes from the collect run.
- At level 80 and above the trial keeps its target. That level is where today's ladder ceiling binds, so this is the intended difference.

### Challenge factor, hour-weighted over all four profiles

| Row | Off (collect) | Trial on | Hours (on) |
|---|---|---|---|
| Initiate standard, control | 1.0065 | 1.0071 | 24,310 |
| Initiate standard, sense | 1.0067 | 1.0071 | 24,190 |
| Initiate push, control | 1.0102 | 1.0107 | 31,010 |
| Initiate push, sense | 1.0053 | 1.0054 | 31,010 |
| Padawan standard, control | 1.0203 | 1.0196 | 51,365 |
| Padawan standard, sense | 1.0243 | 1.0250 | 51,371 |
| Padawan push, control | 1.1260 | 1.1246 | 137,146 |
| Padawan push, sense | 1.1280 | 1.1279 | 140,032 |
| Knight standard, control | 1.0222 | 1.0214 | 255,943 |
| Knight standard, sense | 1.0220 | 1.0214 | 213,740 |
| Knight push, control, level < 80 | 1.0274 | 1.0268 | 1,158,351 |
| Knight push, sense, level < 80 | 1.0401 | 1.0393 | 784,307 |
| **Knight push, control, level ≥ 80** | **0.5313** | **1.0268** | 994,410 |

**Per profile, the row means hold for everyone except Luke.**
- Below level 80, Luke's off means are 1.048 (control) and 1.057 (sense). The trial gives him the row means, 1.027 and 1.039.
- The targets are keyed by rank and effort, not by profile. Luke's early years ran above the row mean in off, which is likely the ladder's 30 rating against his low early levels.
- This is probably why his first two milestones are about 10% slower (table below). Both are still within ±20%.

### Lifetime gates (20 seeds per profile)

| Profile | Gates failing (off / on) | Milestones median 21/41/61/81/101 (off) | (on) | Mortal mean (off → on) | Lost mean (off → on) |
|---|---|---|---|---|---|
| Anakin | none / none | 1.28 / 3.70 / 7.42 / 13.56 / 19.08 | 1.28 / 3.70 / 7.45 / 13.52 / 18.97 | 5.55 → 4.40 | 1.00 → 1.10 |
| Luke | none / **physical peak 20 of 20** | 1.91 / 6.07 / 12.54 / 21.48 / 33.61 | 2.14 / 6.71 / 13.12 / 21.98 / 33.95 | 4.70 → 4.75 | 1.15 → 1.65 |
| Obi-Wan | none / none | 3.25 / 12.46 / 23.60 / 38.92 / 59.15 | 3.25 / 12.51 / 23.61 / 38.90 / 59.14 | 2.20 → 1.95 | 0.70 → 0.80 |
| Average | none / none | 4.18 / 15.99 / 33.44 / 55.13 / 82.29 | 4.18 / 15.99 / 33.45 / 55.13 / 82.17 | 0.35 → 0.20 | 0.00 → 0.00 |

**Other figures:**
- **Y_avg** 20-seed median: worst +2.8% at age 90 in off and +2.3% in the trial. Both pass.
- **The Average's 41** is at 15.99 y in both.
- **War share** median: Anakin 29.6% → 30.5%, Obi-Wan 23.6% → 23.3%.
- **Obi-Wan's peacetime maximum** is 8.4% (gate < 10%).
- **Rolls §8 duel tables and the D-158 rows** are identical to off. These fights do not use training.
- **Mortal and lost means** move by up to 1.15 (Anakin's mortal mean, 5.55 → 4.40). Different Force levels change later fights and dice. These are reported, not gated.

### Luke's physical peak (base seed, one tracked life)

| Age | FC off | FC on | Force Speed off / on | Physical performance mean, off | on |
|---|---|---|---|---|---|
| 42 | 84.4 | 83.2 | 32.9 / 33.1 | 60.9 | 60.5 |
| 54 | 103.2 | 102.9 | 44.0 / 43.9 | 67.6 | 67.5 |
| 62 | 110.3 | 115.5 | 51.2 / 51.2 | 69.5 | 71.1 |
| 65 | 112.3 | 120.1 | 53.7 / 53.8 | **69.9 (peak)** | 72.3 |
| 75 | 117.7 | 134.9 | 61.6 / 61.7 | 69.1 | 74.3 |
| 82 | 121.3 | 144.7 | 66.8 / 66.8 | 67.7 | **75.1 (peak)** |
| 89 | 124.7 | 154.0 | 71.5 / 71.7 | 66.4 | 71.7 |

**What the table shows:**
- **Base physical levels are identical.** Strength 34.5 at 70 in both modes.
- **Force Speed is identical.** The difference is all Force Control past about 105.
- **The boost reaches its cap of 45 at about age 82.** At 82 it is 0.3 × 104.7 + 0.2 × 66.8 = 44.8 in the trial. In off it is 39.7 at 89.

## 2. The binding limit for each rank's default Force block

**Source:** the trial-on mortals run, means per day over 20 seeds. "endF" is max(physical, mental) at the end of the day.

**Units:**
- Trim figures are the share of days trimmed and the hours trimmed a day.
- Strain is shown at the end of the day, at its daily peak, and at bedtime (22:00, before sleep).

| Rank (profile, days) | Force h/d planned → kept | Meter trim | Strain trim | endF | Strain end / peak / bed (max) | Binding limit (measured) | Proposal |
|---|---|---|---|---|---|---|---|
| Initiate (Average, 48,000) | 1.01 → 1.01 | 0% | 0% | 0.72 | 0.07 / 0.07 / 0.07 (0.22) | **Routine hours** | Routine hours; strain about 0.1. **Matches.** |
| Padawan FC 15–25 (Average, 18,700) | 2.07 → 2.00 | 44%, 0.24 h | 0% | 0.97 | 0.16 / 0.16 / 0.18 (0.21) | **max(physical, mental)**, as today | Strain, reaching 0.75 at about 2 h. **Does not match:** strain is about 0.16 at 2 h. |
| Padawan FC 15–25 (Obi-Wan, 10,836) | 2.10 → 2.00 | 99%, 1.07 h | 0% | 0.98 | 0.08 / 0.08 / 0.11 (0.12) | max(physical, mental) | (same row) |
| Knight FC 45–55 (Average, 124,035) | 1.00 → 1.00 | 10%, 0.05 h (fill, not Force) | 0% | 0.85 | 0.00 / 0.03 / 0.02 (0.06) | **Routine hours** | max(physical, mental), routine hours for a Guardian. **Close:** Force hours are not cut; strain is about 0.03. |
| Knight FC 45–55 (Obi-Wan, 78,240) | 2.31 → 1.58 | 100%, 2.03 h | 0% | 0.94 | 0.00 / 0.03 / 0.04 (0.08) | max(physical, mental) | (same row) |
| Master FC 80–90 (Luke, 29,018) | 6.67 → 5.55 | 100%, 1.46 h | 0% | 0.98 | 0.06 / 0.06 / 0.08 (0.08) | max(physical, mental) | Routine hours, then mental; strain under 0.2. **Strain matches;** Luke's long routine meets the meter first. |
| Master FC 80–90 (heavy Control, count 10,000, 1 seed) | 3.60 → 3.60 | 0% | 0% | n/a | 0.15 / 0.18 / n/a (0.19) | **Routine hours** | **Matches.** |

**Notes:**
- **Masters at 85.** Only Luke reaches Force Control 80–90 among the four reference profiles. The Average never reaches it. The heavy-Control profile from item 3 adds an average-Potential Master row.
- **Strain never trims a day** for any of the four reference profiles: 0 of about 1.8 million days.
  - The highest end-of-day strain is 0.22 (an Average Initiate day).
  - The proposal's Padawan figure assumed one continuous push band at about 6.3 draw per unit. The measured strain is about a fifth of that prediction. I have not traced the gap; doing so means auditing the rate and depth multipliers against R = 12.
- **Anakin as a Knight:** meter trims cut his Force block from 2.9 to 0.4 h a day, the same as off. The trial does not change his hours.

## 3. The Orgus Din case

**Setup:**
- The Average profile with a heavy Control routine: focus Force Control 0.5, Soresu 0.2, Ataru 0.1, Force Sense 0.1, Willpower 0.1.
- Run for 95 years at count 7,000, and again at 10,000.
- Same seeds, paired by seed suffix.

**Gate:** Force Control 84 within ±2 years of the 10,000 profile, on all 20 seeds.

| Age at FC (20-seed median) | 7,000, on | 10,000, on | Paired difference (range) | Within 2 y | 7,000, collect | 10,000, collect |
|---|---|---|---|---|---|---|
| 34 | 22.4 | 20.0 | +2.5 (2.3 to 2.6) | 0/20 | 20.0 | 20.0 |
| 60 | 43.4 | 33.9 | +9.4 (9.2 to 9.7) | 0/20 | 32.6 | 32.6 |
| 70 | 50.9 | 40.2 | +10.7 (10.4 to 10.9) | 0/20 | 38.7 | 38.7 |
| **84** | **67.4** | **50.6** | **+16.7 (16.5 to 17.1)** | **0/20** | 48.8 | 48.8 |

**The gate fails on every seed: Orgus is about 17 years late.**

**Why (seed 0 day statistics):**
- **Padawan FC 15–25.** His pool max is about 88 (293 × 0.3 at Force Sense 20).
  - Strain runs away: 1.73 at the end of the day on average, with a maximum of 5.04.
  - The strain trim fires on 73% of days and cuts his Force hours from 2.13 to 1.21 a day.
  - The trim stops at the fresh-day level, so strain carried overnight is never cleared. This is a prototype behaviour that needs a ruling: let the trim cut below that level, or let strain cut XP instead of hours.
- **Knight, every level band.** The strain trim fires on 93–100% of days and cuts his 3.6 h Force block to about 2.4–2.6 h. That is about 30% fewer Control hours for life.
  - At 10,000 the trim fires on 14–19% of days (3.4–3.5 h kept) and stops once Force Control passes 80.
- **The proposal said** low Potential costs growth only on days with more than about 2 h of pushing, and this routine is 3.6 h a day. The finesse terms keep the challenge the same (1.02 at both counts). The difference is entirely hours lost to the strain trim.

**Average Potential on this routine is 1.8 years slower than in collect** (50.6 against 48.8). The strain trim also cuts its Knight days, though less often.

**After Force Control 80, the trial's ceiling removal shows:** at life-year 94, Force Control is 131.9 in the trial against 117.5 in collect.

## 4. Luke's ceiling-removal gates

**Gate:** "Force still rising at 40–42 y of training; > 100 at 62."
- It **passes on all 20 seeds in both modes.**
- Base seed, Force Control at 62: off 110.3, on 115.5.
- Growth at 40–42 years of training (ages 59–61): off about 0.8 a year, on about 1.5 a year.

**The ceiling removal does what the proposal intends for Force Control.** Its side effect is the physical-peak failure in item 1.

## Questions for Jared

1. **Luke's physical peak.** Choose one:
   - cap the Force boost's Force Control term, for example at Force Control 110;
   - accept slower growth above 100, for example by a trial target that falls with level above 100;
   - move the gate.
2. **Strain trim at low Potential.** Should carried strain be trimmed below the fresh-day level, or should high strain cut XP rather than hours? Should Orgus's routine be lighter, below the proposal's 2 h line? As it stands, count 7,000 is 17 years behind.
3. **Padawan strain.** The prediction misses by about a factor of five. Should strain become the Padawan cap? If so, that means a change in R, the rate or depth multipliers, or the exercise draw, and I have not tuned any of them.
4. **Luke's early milestones.** The targets are per row, so they are slightly low for a prodigy's early years. Should targets be keyed by level band within a row?

## The game is unchanged

- `FORCE_XP_TRIAL.enabled = false` and `collect = false`, checked by a unit test.
- All hooks are guarded by the flag. A collect run reproduces off seed by seed.
