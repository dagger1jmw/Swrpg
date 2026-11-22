# Force XP rework: prototype trial 2 (rulings 1–5)

2026-11-21. Jared's rulings on `force-xp-trial.md` (8d6b5a5), built into the prototype and measured on 20 seeds.

**Status (updated 2026-11-21):**
- **Adopted** as the M6 Force XP model after Jared's rulings on this report. The flag stays off in the game until M6 integration.
- The proposed entries below are logged as D-333 to D-337, with the boost cap at Force Control 115, not 110 (`force-xp-trial-3.md`).

## Verdict

**Every gate passes on all 20 seeds.**

| Gate | Result |
|---|---|
| Lifetime gates, 4 profiles × 20 seeds, mortals and spread | All pass. Trial 1's failure, Luke's physical peak, is fixed: the peak is now at 59–60 on every seed (gate 58–68; off 65) |
| Orgus Din: count 7,000 reaches Force Control 84 within ±2 y of count 10,000 | **20/20.** Median +0.45 y, range +0.14 to +0.72 (trial 1: +16.7 y) |
| Luke's ceiling-removal gates: rising at 40–42 y of training; FC > 100 at 62 | Pass on all 20 seeds. Base seed FC at 62: 114.8 (off 110.3) |
| Y_avg, 20-seed median | Worst +2.8% at age 90, a pass, the same as off |

**What each ruling did:**
1. **The boost cap at Force Control 110** moves Luke's peak from 82–83 to 59–60. Force Control itself keeps rising past 100 at about 1.5 a year.
2. **Exercises fitted to the pool** close the Orgus gap. He keeps his full 3.6 h heavy-Control routine, and the strain trim almost never fires (0.4–3.6% of days).
3. **Overnight strain had no recovery bug.** Sleep follows the spec. The cause was same-day overdraw, which the pool fit removes.
4. **The Padawan strain gap is in the proposal's assumptions**, not in the multipliers or in R.
5. **Neutral targets by level band:** every rank, effort and kind row is within 0.005 of off.

**Caveats:**
- Luke's peak now sits one year above the gate's lower edge on every seed.
- Luke's first two milestones are still about 9% slower than off (within ±20%). The level-band targets removed only part of the gap.

## Runtimes (8 workers, 20 seeds)

| Job | Wall time |
|---|---|
| `npm run mortals`, collect (off baseline and the band targets) | 1,170 s |
| `npm run mortals`, on | 1,240 s |
| `npm run spread`, on | 1,122 s |
| Orgus suite, on (40 lives, 95 years) | 832 s |
| Diagnosis: Orgus and Average reserve traces, tracked Luke lives, the Padawan gap check | about 180 s |
| **Total** | **about 4,544 s (76 min)** |

**References:**
- **Orgus collect** is trial 1's run (813 s). Collect mode does not change the game rules, and this collect mortals run reproduces off seed by seed (every gate, milestone, mortal and lost-limb figure).
- **The off spread** is the collect mortals run (the same 80 lives and the same gates).

## What changed in the prototype (harness only)

| Ruling | Code | Rule |
|---|---|---|
| 1 | `src/engine/species.ts` `forceBoost` | With the trial on, the boost reads min(FC, 110): boost = 0.3 × (min(FC, 110) − 40) + 0.2 × Force Speed, max 45. `FORCE_XP_TRIAL.physicalBoostFcCap`. Off is unchanged |
| 2 | `src/engine/forceXpTrial.ts` `scaleExercise` and `poolFit`; the hook's `strainTrim` and `forceSessionRating` | Fitting the exercise to the pool; details below |
| 5 | `targetChallenge` anchors, `targetFor(row, effort, kind, level)`, `levelBand` | Targets keyed by level band; details below |
| (found while building 2) | `buildExercise` | Effort below the tier's normal demand is continuous; details below |

**Ruling 2, fitting the exercise to the pool:**
- **The day fit.** When the day is planned, the day's Force block (all its Force sessions) gets one demand factor f, the largest at which the projected strain peaks at or under 0.75 (the standard strain limit).
- **How demand comes down.** Each exercise's demand drops by f, through lighter effort or a lower tier. Finesse makes up the rating (+30 × log2(1/f)), so the rating and the challenge factor are unchanged.
- **Floor.** Basic at light effort (Force Sight at light effort for sense).
- **Output** keeps its scale gate and is not fitted.
- **Session guard.** Each session uses min(the day fit, the most its own block allows from the reserve now). This guards against differences between the plan and the session.
- **The strain trim** stays as the safety net, in hours, not XP. It runs only while even the floors overrun, and refits after each trim step.

**Ruling 5, targets by level band:**
- Anchors are at the midpoints of 10-level bands: today's hour-weighted challenge mean in that band, from the collect run, for bands with 2,000 or more hours below level 80.
- Targets are interpolated between anchors and held flat past the ends, so a smooth curve replaces the step table.
- At level 80 and above, the last anchor holds. That is the ceiling removal.

**Continuous effort** (found while building ruling 2):
- **Trial 1 behaviour.** Below the tier's normal demand rating, a control or sense exercise switched straight from normal to light effort plus about 30 finesse. So the draw halved where the target crossed that rating, for example at Force Control 35–37.5 with the Moderate tier.
- **Why it mattered.** A plan made at the start of the day could sit just under that line while a session later the same day sat just over it, after its level had moved. The session then drew twice what the plan projected. That broke the day fit.
- **The fix.** Below normal demand, the effort is now the continuous value whose demand rating is the target, floored at light, with no finesse. Draw is continuous in the target, and the rating and free status are unchanged.
- **Side effect.** Low-level exercises draw a little more than in trial 1. The Average Initiate's end-of-day strain is 0.14 against 0.07.

**Harness:**
- `TRIAL_STORE.trace`: an optional callback for reserve events, used for the item 3 and 4 diagnosis.
- `summary.fits`: fitted hours and the mean factor by day bucket.

**Unit tests** in `tests/engine/forceXpTrial.test.ts`, now 12:
- the fit keeps the rating and ends at the limit;
- the fit floor;
- the boost cap is applied only with the trial on;
- band interpolation.

## 1. Lifetime gates (20 seeds per profile)

| Profile | Gates failing (off / trial 2) | Milestones median 21/41/61/81/101 (off) | (trial 2) | Mortal mean (off → trial 2) | Lost mean |
|---|---|---|---|---|---|
| Anakin | none / none | 1.28 / 3.70 / 7.42 / 13.56 / 19.08 | 1.28 / 3.74 / 7.54 / 13.72 / 19.05 | 5.55 → 5.80 | 1.00 → 1.05 |
| Luke | none / none | 1.91 / 6.07 / 12.54 / 21.48 / 33.61 | 2.08 / 6.55 / 13.00 / 21.95 / 34.15 | 4.70 → 4.80 | 1.15 → 1.50 |
| Obi-Wan | none / none | 3.25 / 12.46 / 23.60 / 38.92 / 59.15 | 3.25 / 12.49 / 23.58 / 38.86 / 59.04 | 2.20 → 1.65 | 0.70 → 0.60 |
| Average | none / none | 4.18 / 15.99 / 33.44 / 55.13 / 82.29 | 4.18 / 15.99 / 33.44 / 55.11 / 82.17 | 0.35 → 0.20 | 0.00 → 0.00 |

**Other figures:**
- **Luke's physical peak**, by seed: 59 on 17 seeds and 60 on 3 (trial 1: 82–83; off: 65).
- **The Average's 41** is at 15.99 y.
- **War share** median: Anakin 29.9%, Obi-Wan 23.7%. Obi-Wan's peacetime maximum is 8.2%.
- **The duel tables and D-158 rows** are identical to off.
- **The mortals and spread runs agree** on every gate.

### Luke (base seed, one tracked life)

| Age | FC off | FC trial 1 | FC trial 2 | Physical performance mean: off / trial 1 / trial 2 |
|---|---|---|---|---|
| 42 | 84.4 | 83.2 | 83.2 | 60.9 / 60.5 / 60.6 |
| 54 | 103.2 | 102.9 | 102.5 | 67.6 / 67.5 / 67.5 |
| 59 | 107.9 | 110.9 | 110.3 | 68.9 / 69.8 / **69.6 (peak)** |
| 62 | 110.3 | 115.5 | 114.8 | 69.5 / 71.1 / 69.5 |
| 65 | 112.3 | 120.1 | 119.3 | **69.9 (peak)** / 72.3 / 69.3 |
| 75 | 117.7 | 134.9 | 133.5 | 69.1 / 74.3 / 66.7 |
| 82 | 121.3 | 144.7 | 142.8 | 67.7 / **75.1 (peak)** / 64.0 |
| 89 | 124.7 | 154.0 | 151.5 | 66.4 / 71.7 / 61.6 |

**Why the peak moved earlier than off (59 against 65):**
- With the cap, Force Control adds nothing to the boost past 110, which Luke reaches at about 59.
- In off, Force Control still rises about 0.6 a year past 110, which holds off ageing until 65.
- Force Speed is the only part of the boost still rising, at about 0.9 a year.

The gate passes on every seed, one year inside its edge. If Jared wants the peak nearer 65, the cap is the lever, for example 115 or 120. Not tuned here.

### Neutral start (challenge factor, hour-weighted, all profiles)

| Row | Off (collect) | Trial 2 |
|---|---|---|
| Initiate standard, control / sense | 1.0065 / 1.0067 | 1.0069 / 1.0072 |
| Initiate push, control / sense | 1.0102 / 1.0053 | 1.0053 / 1.0056 |
| Padawan standard, control / sense | 1.0203 / 1.0243 | 1.0201 / 1.0230 |
| Padawan push, control / sense | 1.1260 / 1.1280 | 1.1292 / 1.1328 |
| Knight standard, control / sense | 1.0222 / 1.0220 | 1.0210 / 1.0220 |
| Knight push, control / sense, level < 80 | 1.0274 / 1.0401 | 1.0274 / 1.0401 |
| Knight push, control, level ≥ 80 | 0.5313 (ceiling) | 1.0000 (trial 1: 1.0268) |
| Luke only: Knight push, control / sense, level < 80 | 1.0329 / 1.0574 | 1.0310 / 1.0474 |

**Within a band, the old ladder's sawtooth is smoothed.** Today's band means alternate with the 10/30/50/70/90 ladder ratings: for example, Knight push sense is 1.23 at 10–19, 1.05 at 20–29 and 1.15 at 30–39. The interpolated targets average across that.
- The row means match.
- Luke's early years, which ran in the high bands, still get a little less: sense 1.047 against 1.057.
- That is the likely remaining cause of his first two milestones being about 9% slower. Matching the sawtooth exactly would need a step table, which Golden Rule 7 advises against.

## 2. The binding limit for each rank's default Force block (trial 2)

**Source:** the trial-on mortals run, means per day over 20 seeds. Strain is shown at the end of the day, at bedtime, and as the maximum.

| Rank (profile) | Force h/d planned → kept | Meter trim | Strain trim | Pool fit | endF | Strain end / bed (max) | Binding limit |
|---|---|---|---|---|---|---|---|
| Initiate (Average) | 1.01 → 1.01 | 0% | 0% | none | 0.72 | 0.14 / 0.14 (0.23) | Routine hours |
| Padawan FC 15–25 (Average) | 2.07 → 2.00 | 44%, 0.24 h | 0% | none | 0.97 | 0.16 / 0.19 (0.21) | max(physical, mental) |
| Padawan FC 15–25 (Obi-Wan) | 2.11 → 2.01 | 99%, 1.08 h | 0% | none | 0.98 | 0.08 / 0.11 (0.12) | max(physical, mental) |
| Knight FC 45–55 (Average) | 1.00 → 1.00 | 10%, 0.05 h (fill) | 0% | none | 0.85 | 0.00 / 0.02 (0.06) | Routine hours |
| Knight FC 45–55 (Obi-Wan) | 2.31 → 1.58 | 100%, 2.03 h | 0% | none | 0.94 | 0.00 / 0.04 (0.08) | max(physical, mental) |
| Master FC 80–90 (Luke) | 6.67 → 5.55 | 100%, 1.46 h | 0% | none | 0.98 | 0.06 / 0.08 (0.07) | max(physical, mental) |
| Master FC 80–90 (heavy Control, 10,000) | 3.59 → 3.59 | 0% | 0% | none | n/a | 0.15 / 0.18 (0.21) | Routine hours |
| **Orgus 7,000, Padawan FC 15–25** | 2.06 → 1.99 | 44% | 0.4% | 98% of hours, factor 0.63 | n/a | 0.75 / 0.75 (0.75) | **The pool:** the exercise is lightened, and hours are kept |
| **Orgus 7,000, Knight FC 45–55** | 3.60 → 3.60 | 0% | 0.5% | 100%, factor 0.47 | n/a | 0.72 / 0.85 (0.72) | The pool, as above |
| **Orgus 7,000, Knight FC 80–90** | 3.59 → 3.59 | 0% | 0% | 100%, factor 0.54 | n/a | 0.72 / 0.83 (0.75) | The pool, as above |

**Notes:**
- **The pool fit never fires for the four reference profiles.** Their strain stays at or below 0.23. Average Potential on the heavy routine is fitted on 25–37% of its Knight hours, at factor 0.66–0.70.
- **Bedtime strain is above end-of-day strain for Orgus** (0.85 against 0.72). The plan projects the training blocks only, and the evening sessions run past the last projected block.
  - Sleep clears 0.96, so he always wakes at 0.
  - In the seed 0 trace, the guard holds actual block ends to 0.91 at most.

## 3. Overnight strain (ruling 3): not a recovery bug

**Finding:** sleep recovery is applied as the reserve spec says (§6 "Recovery"; the ruling's §7 is "Growth"). Sleep clears 0.12 strain an hour, 0.96 a night, and the trace shows every night clearing exactly that.

**The cause was same-day strain far past 1.0.** From the trace of Orgus at count 7,000, seed 0, as a Padawan at Force Control 20:
- His pool max is 88 (293 × 0.3 at Force Sense 20), with the comfort line at 44%.
- **Control hour.** The Order's 1 h Control drill draws 6.6 a repetition, 79 for the hour. The pool runs dry inside the hour, and strain reaches 2.9.
- **Sense hour.** The 1 h Force Sight block that follows is all overdraw at ×8. Strain reaches 5.07 in one day.
- **The trim could not cut it.** Those blocks are fixed Order blocks. The trim takes fixed blocks only down to their fresh-day level, as D-165 does, and here that level was itself 5.07.
- **It carried over.** Each night cleared 0.96, so the next day started at 4.1, then 3.3, then 2.4.

**Fix:** none to recovery. Ruling 2 removes the cause.
- With the pool fit, the maximum start-of-day strain is 0.00 (seed 0 trace, 30 years, 9,000 planned days).
- The plan's peak never passes 0.75.
- The strain trim fires on at most 3.6% of days (Knight, other bands; 0.4% as a Padawan).

**Not modelled in the trial** (reported, not built): reserve spec §5 makes strain above 1.0 cause backlash and collapse. The trial carries strain only. With the pool fit, strain past 1.0 no longer occurs in these runs.

## 4. The Padawan strain gap (ruling 4, report only)

**Prediction:** strain reaches the 0.75 standard limit at about 2 h (proposal §4).

**Measured:** about 0.16. It is the same in trial 1 and trial 2, because the fit never fires for the Average.

**Engine check** (count 10,000, Force Sense 20, Conditioning 10: pool 150, comfort line 47%, usual rate 3.9):

| Block | Draw per repetition | Strain | Pool left |
|---|---|---|---|
| **Measured default block:** 1 h Control (rating 20) | 6.25 | 0.21 | 48% |
| … then 1 h Force Sight | 1.25 | 0.26 | 37% |
| **Proposal's block:** 1 h push Control (Basic + finesse 15, rating 35) | 6.25 | 0.21 | 48% |
| 1.5 h of it | 6.25 | 0.57 | 19% |
| 2 h of it | 6.25 | 3.19 | 0% |

**Where the gap comes from:**
- **The multipliers and R = 12 behave as specified.** The pool falls 50% an hour, as the proposal says. The depth multiplier is 0.25 above the comfort line and rises steeply below it. The rate multiplier is 1.5 (6.25 against a 3.9 usual rate).
- **The second hour is Force Sight, not Control.** The default Padawan block is 1 h Control plus 1 h sense with the master, and Force Sight's sustained cost is 2 against Basic Control's 10, so it draws a fifth as much. The pool never crosses the comfort line, and strain ends at about 0.26 on a fresh day. The run mean is 0.16, because meter trims cut some days and not every day starts at a full pool.
- **The proposal's own number was also off.** Two hours of push Control would empty the pool and reach about 3.2 strain. That crosses 0.75 at about 1.6 h, not at 2 h.

**Effect on ruling 2:** yes, the same block shape applies to Orgus.
- At pool 88 his Control hour alone empties the comfort range. The sense hour then runs on overdraw.
- The pool fit lightens both together, by one day factor, at 0.63 on average for Padawan days at Force Control 15–25.

**Item 2's table is unaffected for the reference profiles.** Their binding limits are the meters or the routine hours, as Jared accepted.

## 5. The Orgus Din case

**Setup:**
- The heavy Control routine from trial 1: focus Force Control 0.5, Soresu 0.2, Ataru 0.1, Force Sense 0.1, Willpower 0.1.
- 95 years, counts 7,000 and 10,000, paired by seed.

| Age at FC (20-seed median) | 7,000 | 10,000 | Paired difference (range) | Within 2 y | Trial 1 difference |
|---|---|---|---|---|---|
| 34 | 19.98 | 20.00 | −0.01 (−0.17 to 0.07) | 20/20 | +2.5 |
| 60 | 32.97 | 32.55 | +0.40 (0.34 to 0.57) | 20/20 | +9.4 |
| 70 | 39.15 | 38.71 | +0.44 (0.13 to 0.60) | 20/20 | +10.7 |
| **84** | **49.52** | **49.06** | **+0.45 (0.14 to 0.72)** | **20/20** | +16.7 |

**The gate passes.**
- **The proposal's §6 claim holds once exercises fit the pool.** Low Potential costs Orgus about half a year to Force Control 84. Finesse keeps his challenge equal (1.00–1.03 in every band at both counts), and he keeps his hours.
- **Average Potential on this routine** reaches Force Control 84 at 49.06, against 48.77 in collect. Its Knight days fit on 25–37% of hours, which costs about 0.3 y.
- **The ceiling removal shows after Force Control 80.** At life-year 94, Force Control is 133.9 at 10,000 and 133.5 at 7,000, against 117.5 in collect.

## Proposed decision entries (not adopted; for Jared's review)

These are written as they would go into `decisions.md`, numbered from the next free number. Nothing is logged there yet.

- **D-333 Force XP from exercise difficulty (Jared, proposal; force-xp-rework.md; force-xp-trial.md and force-xp-trial-2.md).**
  - Force-discipline sessions train on an exercise whose rating (demand + finesse, proposal §1–2) replaces the 10–90 drill ladder for Force skills. The M4 XP formula and K are unchanged.
  - Free exercises earn the challenge factor × 0.1 (the trickle).
  - Neutral start: each exercise aims at today's challenge mean, as [level, factor] anchors at 10-level band midpoints for each rank, effort and kind, interpolated between anchors. At level 80 and above the last anchor holds, so there is no ceiling.
  - Below a tier's normal demand rating, effort is continuous, floored at light.
- **D-334 Exercises fit the pool (Jared, ruling 2 on force-xp-trial.md).**
  - Each day's Force block is fitted to the pool: one demand factor, at which the projected strain peaks at or under the standard limit of 0.75. Finesse makes up the rating, so XP is unchanged.
  - The floor is Basic at light effort (Force Sight at light effort for sense).
  - Each session also fits its own block from the reserve at the time.
  - Pool max gates only the scale classes, via Output (reserve §3).
  - The strain trim (proposal §4) stays as the safety net, in hours, for days when even the floors overrun.
  - Gate: Orgus Din (count 7,000, a design default per D-322) on a heavy Control routine reaches Force Control 84 within ±2 years of count 10,000 on all 20 seeds.
- **D-335 Physical Force boost saturates at Force Control 110 (Jared, ruling 1).**
  - Boost = min(45, 0.3 × (min(FC, 110) − 40) + 0.2 × body-ability level). This amends progression-numbers §11.
  - The ceiling removal stays for Force abilities. Luke's 58–68 peak gate is unchanged.
- **D-336 Overnight strain (Jared, ruling 3; finding).**
  - Reserve §6 recovery is applied as specified. Carried strain came from same-day overdraw, which D-334 removes.
  - No change to recovery.
- **D-337 Padawan binding limit (Jared, ruling 4).**
  - The old meters binding for Padawans is accepted. The proposal's prediction that strain binds is withdrawn: its block assumed 2 h of Control, where the real default block is 1 h Control plus 1 h sense.
  - No tuning of R or the multipliers.

## Questions for Jared

1. **Luke's peak at 59–60.** It sits one year inside the gate on every seed. Keep the cap at 110, or raise it (115–120) to move the peak toward the old 65?
2. **Luke's early milestones** are still about 9% slower. They are within the ±20% gate. Accept, or key the targets more finely? A step table would contradict Golden Rule 7.
3. **Backlash and collapse above 1.0 strain** (reserve §5) are not modelled in the trial. With the pool fit, training no longer goes there. Should they be built at M6 integration only?

## The game is unchanged

- `FORCE_XP_TRIAL.enabled = false` and `collect = false`, checked by a unit test.
- The boost cap applies only when the flag is on.
- A collect run reproduces off seed by seed.
