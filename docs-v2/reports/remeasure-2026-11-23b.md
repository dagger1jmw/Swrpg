# Recalibration under the per-hour clamp, with the Initiate curriculum (2026-11-23; Phase B; D-459)

The unattended Phase B of the answers to remeasure-2026-11-23.md, with Jared's addition (the Initiate lightsaber
curriculum) folded in. Phase B started at step b, at 11:31, and finished at about 13:40, inside the 6-hour cap.

- **Baseline:** tag `calibration-baseline-2026-11-23b` (commit `5498ac3`), folder
  `docs-v2/reference/calibration-baseline-2026-11-23b/`.
- **Phase A** (the per-hour clamp, the counter, the montage test) is in `clamp-2026-11-23-phaseA.md`.

## Summary

- **The curriculum is built** (items 1-3, 5 and 6), and so is the new Initiate Trials test (item 4), from the Average.
- **It moves the Average's 41 from 16.0 to 18.5 years** at the old K.
  - The Average starts Form I at about 5.7, gives it half the saber hours from 10, and starts Padawan Soresu from its
    survey level (about 18) instead of a fresh transfer from Shii-Cho 29.
  - The K solve wants 10.21. The bound is 11.5, so K = 11.5, and the Average's 41 sits at 17.30 years.
  - **I did not widen the bound or tune the curriculum's design defaults.** Per the stopping rules: one full pass at
    the closest in-bounds state, then stop.
- **Goals that pass:**
  - Anakin inside the 4.0x on 20 of 20 seeds.
  - Luke's Djem So 56 by year 5 on the accelerated path (59.8).
  - The Sith archetypes' gates.
  - The Tython move is neutral (0.0% every year).
  - Obi-Wan's Clone Wars share (20 of 20, up from 1 of 20).
  - Both calibration tables.
  - The era profile (20 seeds, no errors).
- **Goals that fail:**
  - The Average's 41 at 16.0 ± 0.1 (0 of 20; 17.19-17.40).
  - Obi-Wan's 41 by 12.96 (13.85) and his milestones gate (0 of 20).
  - Three other gates lose pass rate: the Average's rank minimums (20 -> 0 of 20), Luke's milestones (20 -> 1) and
    Obi-Wan's within 4.0x (20 -> 14).
  - All of these trace back to the curriculum's 2.5-year shift and the K bound (section 4).
- **The per-hour clamp discards nothing for any profile.** Obi-Wan's Soresu runs at 0.92-1.05 times the Average per
  hour; there is no multiplier stacking.
- **The canon-band step was skipped:** not every goal passed.

## 1. What was built

**The curriculum** (`src/data/initiateCurriculum.ts`, `src/features/routines/curriculum.ts`; the Initiate row's 2 h
saber block):

| Phase | When | The 2 h saber block |
|---|---|---|
| Before the gate | Force Control < 13 or Force Knowledge < 5 | Force Control 1 h; physical 0.5 h (agility / strength / endurance by day); centering 0.5 h |
| Form I | from the gate (the Average: about 5.7) | Shii-Cho 2 h |
| Survey | from 10 (the Initiate Trials' minimum age) | Shii-Cho 1 h; Forms II-VI a day each through the other hour (Form V alternating Shien and Djem So by week) |

- **The gate** is the Average's levels at the design gate age 6, rounded down. Force Knowledge is set one lower,
  because 6.0 sat on the line.
- **A survey form's first class starts it with the D-119 transfer** (75% of Form I's XP). Its level carries into the
  Padawan years; there is no second transfer.
- **The closed form and the pace measurement follow the curriculum for Jedi.** The Sith acolyte row is unchanged.
- **The survey classes do not give sparring E.** Only the Shii-Cho class does, as before.
- **The NPC Jedi archetypes still match the loop:** Guardian 52.33 / 52.54, Consular 32.94 / 32.89, Sentinel 51.64 /
  51.81.

**The Initiate Trials** (D-51 style, from the Average on the curriculum; gated seed, K 11.5):

| | Before | After |
|---|---|---|
| Dueling test | highest form at rating 20 | Form I at rating 20, plus 4 of Forms II-VI at 16+ (Form V by its better variant) |
| Force Control check | rating 20 | rating 20 |
| Eligibility minimums | highest form 24, Force Control 14 | Form I 24, Force Control 19 |

- **Form I 24 stays:** the Average meets it at about 11.8, inside ±2 years of 10.
- **Force Control 14 -> 19:** 14 is now met at about 6.2, so the minimum becomes the Average's level at 10 (19.5),
  rounded down.
- **The competence floor of 16** is the Average's lowest of Forms II-VI after one survey year (16.4 at 11), rounded
  down.
- **The Padawan rank row mirrors the new minimums.** The Sith apprentice row keeps 24 / 14.

**Two bugs found and fixed while building it:**
- **Djem So never trained.** Absolute days are negative before 0 BBY, and the Form V variant index went negative.
- **Two lifetime tests called the closed form without the curriculum.** There is now one shared value,
  `CLOSED_FORM_CURRICULUM`.

## 2. The Average's forms, before and after the curriculum (gated seed)

Before: K 12.45, baseline 23b. After: K 11.5, the curriculum. Age 12 is the Average's Padawan selection, after its
Initiate Trials.

| Form | At 12, before | At 12, after | At 25, before | At 25, after |
|---|---|---|---|---|
| Form I (Shii-Cho) | 29.1 | 24.3 | 29.1 | 24.3 |
| Form II (Makashi) | 3.2 | 18.8 | 3.2 | 18.8 |
| Form III (Soresu) | 3.2 | 18.7 | 48.7 | 47.3 |
| Form IV (Ataru) | 3.2 | 18.8 | 32.5 | 29.0 |
| Form V (Shien / Djem So) | 3.2 / 3.2 | 18.5 / 18.5 | 11.3 / 3.2 | 20.3 / 18.5 |
| Form VI (Niman) | 4.8 | 16.8 | 13.5 | 20.1 |
| Force Control | 18.1 | 22.3 | 43.7 | 47.4 |

- Forms below 5 before are their natural baselines.
- The jump to about 18 in Forms II-VI at 12 is the D-119 transfer at each form's first survey class (question 2).

## 3. Final parameters

| Parameter | Bound | Before (23b) | After |
|---|---|---|---|
| K | 11.5-13.5 | 12.45 | **11.5** (the solve wants 10.21; at 11.5 the 41 comes at 17.30 y) |
| Luke's accelerated bonus | x3.0-x4.0 | x3.5 | x3.5 (Djem So 59.8 at year 5; not re-tuned, tuning stopped) |
| Per-hour table | 20-seed median | Phase A | re-measured on the curriculum (`src/data/paceRates.ts`); gate: worst -0.0% |
| Yearly table (`Y_AVG`) | 20-seed median | 4: 583, 8: 609, 12: 606, 20: 629, 90: 338, 98: 207 | 4: 0, 8: 550, 12: 662, 20: 595, 90: 275, 98: 226; gate: worst -0.2% |
| Archetype paces | real loop | D-456 | re-measured (Guardian Initiate Force Control 0.452 -> 0.648, form pace 1.028 -> 1.204) |
| Sith profile constants | ±15% | - | unchanged (the Sith paces moved with K, as accepted in answer [3]) |

## 4. Results

Gated seed (`-s9`), years to 21 / 41 / 61 / 81 / 101:

| Profile | Before (D-456) | After | Target |
|---|---|---|---|
| Average | 4.49 / 16.01 / 31.86 / 54.27 / 82.68 | 5.87 / 17.30 / 32.08 / 52.84 / 79.02 | 5.0 / 16.0 / 32.1 / 52.7 / 77.5 |
| Obi-Wan | 3.46 / 12.49 / 22.03 / 40.27 / 64.62 | 3.96 / 13.85 / 22.23 / 36.55 / 55.60 | 3.4 / 10.8 / 21.7 / 35.6 / 52.4 |
| Anakin | 1.27 / 3.77 / 7.28 / 13.54 / 19.07 | 1.18 / 3.41 / 6.99 / 12.65 / 17.90 | 1.3 / 4.1 / 8.2 / 13.5 / 19.9 |
| Luke | 1.95 / 6.23 / 13.08 / 22.82 / 36.55 | 1.69 / 5.46 / 11.43 / 19.98 / 31.67 | 2.1 / 6.9 / 13.9 / 22.8 / 33.6 |

20-seed spread (1,646 s), gate pass counts:

| Gate | Before | After |
|---|---|---|
| Average: 41 at 16.0 ± 0.1 | 20/20 | **0/20** (17.19-17.40) |
| Average: milestones ±20%, within 4.0x, peacetime combat, tiredness | 20/20 | 20/20 |
| Average: rank minimums ±2 y | 20/20 | **0/20** (Force Control 41 met 2.6 y early; Force Sense 40 early too) |
| Obi-Wan: milestones ±20% | 0/20 | 0/20 (41 at 13.85 against 12.96) |
| Obi-Wan: not faster than Anakin; within 4.0x | 20/20 | **14/20** (21 at 3.91-3.93 against a floor of 3.94) |
| Obi-Wan: Clone Wars share 20-30% | 1/20 | **20/20** (mean 22.3-24.5%) |
| Obi-Wan: peacetime combat | 20/20 | 20/20 |
| Anakin: every gate (4.0x 20/20) | 20/20 | 20/20 |
| Luke: milestones ±20% | 20/20 | **1/20** (41 at 5.27-5.63 against a 5.52 floor: too fast at the lower K) |
| Luke: within 4.0x, Force rising, physical peak | 20/20 | 20/20 |
| Yearly table and per-hour table | pass | pass (-0.2%, -0.0%) |

Why they fail:
- **The Average's 41 and its rank minimums:** the curriculum's 2.5-year shift against the K bound. At K 11.5 the
  Average's levels at 24 are higher in Force Control (45.8) and Force Sense (43.0), so those minimums come about 3
  years early, while its highest form (45.8) misses 47 by a year.
- **Luke:** K 11.5 speeds up everyone without the curriculum.
- **Obi-Wan's 41:** his Initiate form time shrinks like the Average's. K helps him less than it helps the Average.
- **Obi-Wan's within 4.0x:** a curriculum gap (question 3). His profile trains Shii-Cho in his own Initiate fill
  before the gate, while the Average's table holds no form XP then.

**Other checks:**
- **Discarded XP** (the D-458 counter, gated seed, full lives): Average 0, Obi-Wan 0, Anakin 0, Luke 0, every skill.
  Luke on the accelerated path discards 834 XP (the x3.2 cap; reporting only).
- **Luke on the accelerated path:** Djem So 59.8 and Force Control 66.4 at year 5 (goal: Djem So 56).
- **npc test 7:**
  - Sith Warrior 55.91 / 56.13; Sith Inquisitor 54.31 / 54.14.
  - Guardian 52.33 / 52.54; Consular 32.94 / 32.89; Sentinel 51.64 / 51.81.
  - Soldier 60.56 / 61.76; smuggler 59.64 / 61.31; bounty hunter 60.61 / 61.45; civilian 68.67 / 66.79.
  - **The Mandalorian misses at 2.15 levels** (was 2.02): the re-check asked for after Phase B.
- **Tython move:** neutral. The era Average's Force Control and Force Sense XP is identical with and without the move,
  every year 3671-3649 BBY (both x1.15).
- **Swordmaster:** 55.6 / 69.6 / 92.0 at 30 / 40 / 60 (was 56.2 / 68.9 / 89.8).
- **Knowledge at 25 / 40 / 60:**
  - Guardian: Force Knowledge 14.4 / 19.7 / 26.5; Meditation 17.0 / 24.2 / 32.8.
  - Consular: Force Knowledge 18.3 / 59.9 / 96.1; Meditation 19.3 / 35.6 / 52.5.

## 5. Obi-Wan's Soresu per hour under the final table (gated seed)

| Year from age | 15 | 25 | 40 |
|---|---|---|---|
| Window rate / table, XP/h | 1.263 / 1.212 (**x1.04**) | 1.018 / 1.112 (**x0.92**) | 1.006 / 0.954 (**x1.05**) |
| Effective share | x0.960 | x0.887 | x0.933 |
| Challenge (push) | x1.145 | x1.127 | x1.099 |
| Outcome | x0.999 | x0.982 | x1.028 |
| Teacher | x0.954 | x1.000 | x1.000 |
| Age, centered | x1.000, x1.003 | x1.000, x1.003 | x1.000, x1.003 |
| Talent, place, species, accelerated, review | 1 | 1 | 1 |
| Discarded | 0 | 0 | 0 |

The clamp no longer touches Obi-Wan. His milestones now fail on time, not on the clamp.

## 6. Tests

- **Final test:all** (868 s): 144 files, 1,391 tests; 1,385 pass, and 6 fail, every one a reported goal.
- **Failing as reported, not worked around:**
  - `creation.test` test 1: a 24-year-old Average no longer meets the Knight minimum highest form 47 (45.6).
  - `average.test`: the 41 at 16.0, and the rank minimums.
  - `obiwan.test` and `luke.test` milestones.
  - npc test 7 for the Mandalorian (2.15).
- **Updated to the re-measured values (the calibration pins):** K, `Y_AVG`, the Anakin floor, the closed-form
  reference table and the creation references.
- **Rewritten for the curriculum:**
  - The Initiate's first days (`advanceRoutine` test).
  - The transfer test (the survey starts Forms II-VI at 10).
  - The Padawan-start transfer test.
  - The meditation-block test.
- **Dropped:** one sanity clause, "the floor from age 4 is below the target / 4". The yearly table now has no form XP
  before the gate.

## 7. Runtimes

| Run | Time |
|---|---|
| Per-hour table, Average only, 20 seeds (Phase B: buggy Form V, then fixed) | 600 s, then 745 s |
| K solve x2 | 60 s, 72 s |
| Levels probes | 33-148 s each |
| Paces | 234 s |
| Full spread (80 lives) | 1,646 s |
| test:all, before the closed-form caller fix (1,381 of 1,391) | 872 s |
| Final test:all (1,385 of 1,391) | 868 s |
| Jedi npc test 7 and npc test 2 re-run | 129 s |
| Discard report, Obi-Wan breakdown and Tython move (in parallel) | 279 s |

## Questions

1. **The K bound.**
   - The curriculum wants K 10.21 for the Average's 41 at 16.0, below the 11.5 bound. Options:
     - (a) lower the bound, then re-tune;
     - (b) accept a later Average (41 at about 17.3) and move the targets;
     - (c) soften the curriculum's defaults.
   - The defaults are mine and could be softened: the gate age 6 (Force Control 13 / Force Knowledge 5), the survey
     from 10, and Form I's 50% in the survey.
   - Each choice also decides the rank-minimum, Luke and Obi-Wan gates.
2. **The survey transfer.**
   - Each survey form's first class gives the D-119 transfer (75% of Form I's XP). Forms II-VI jump to about 18 at 10,
     and the Padawan main form starts from there.
   - Is the transfer meant to fire for survey classes, or should survey forms start from zero and grow only by their
     hours?
3. **The gate and the Initiate's free time.**
   - The saber gate controls only the Order's saber block. A player's or profile's own fill can still train a form
     before it, as Obi-Wan's profile does (Shii-Cho with instructors).
   - That is why his 21 lands 0.01-0.03 years under the 4.0x floor on six seeds.
   - Should the gate cover all of an Initiate's lightsaber training?
4. **Item 4's reading.** "Skill 3 of 4 at rating 45" is the Knight Trial of Skill. I changed the Initiate Trials and
   left the Knight Trial alone. Correct?
5. **Force Control 14 -> 19.** The Initiate Trials and Padawan minimum moved by the D-51 rule, because the pre-gate
   hours meet 14 almost 4 years early. Rank minimums were on the "nothing else changes" list; keep 19, or hold 14?
6. **The Sith acolyte row** has no curriculum: Korriban is not the Temple. Should acolytes get a version of it?
7. **The Mandalorian's npc test 7 miss** grew from 0.02 to 0.15 over the 2-level limit. Look at its pace fit now?
8. **The canon Force Knowledge and Meditation bands** were not re-measured (not every goal passed). Next session?
