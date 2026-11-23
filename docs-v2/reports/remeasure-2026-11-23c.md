# The curriculum fix and the recalibration (2026-11-23c; D-460)

This is the unattended run on Jared's rulings on `remeasure-2026-11-23b.md`. It started at about 15:15 and finished at
about 16:55, well inside the 6-hour cap. It used one probe sequence and one full pass, with no tuning iterations.

- **Starting point:** commit `b2363d4` (Phase B, D-459). The tag for this run is `calibration-2026-11-23c`.
- **Decision entry:** D-460 in `docs-v2/decisions.md` logs every ruling, what was built and the results.

## Summary

- **Rulings 2 and 3 are built.**
  - *Ruling 2, the Padawan specialty transfer:* the main form starts at max(its XP, 0.75 × Form I's XP) on its first
    session as a Padawan.
  - *Ruling 3, the saber gate:* it now covers the Initiate's free training too.
- **The levers, in order** (the K solve on the gated seed):
  - (a) alone: 10.84;
  - (a)+(b): 11.11;
  - (a)+(b)+(c): **11.66**. This is the first combination inside 11.5–13.5, so all three levers are taken.
- **K = 11.64.** The Average's 41 is at 16.00 on the gated seed, and inside 16.0 ± 0.1 on **20 of 20** seeds.
- **Goals that pass:**
  - The Average's 41, its milestones, within 4.0x, peacetime combat and tiredness.
  - Obi-Wan's 41 by 12.96 (12.44–12.60), his Clone Wars share (20/20) and within 4.0x (20/20, up from 14/20).
  - Anakin's 4.0x on 20/20, and every other Anakin gate.
  - Luke's Djem So on the accelerated path: 59.6 at year 5 (goal 56).
  - The Sith gates, and Tython (neutral every year).
  - Both calibration tables.
  - No XP discarded for any profile.
- **Goals that still fail.** None was tuned around, and no bound was widened.
  - **Obi-Wan's milestones, 9/20:** only his 21 misses, at 4.06–4.12 years against a limit of 4.08 (target 3.4, +20%).
  - **Luke's milestones, 3/20:** his 41 is at 5.33–5.70 against a floor of 5.52. He is slightly too fast.
  - **The Average's rank minimums, 0/20:** only the Master's main specialty misses. 64 comes at 37.46 against 40 ± 2.
  - **The Mandalorian, npc test 7:** 59.75 on the loop against 61.90 in the closed form. No single pace can fit it
    (section 5).
- **Skipped:** the canon Force Knowledge and Meditation bands, because not every goal passes (ruling 8).

## 1. What was built

**Ruling 2: the Padawan specialty transfer**
- **When it fires:** the main form's first session as a Jedi past Initiate starts that form at max(its XP, 0.75 × Form
  I's XP).
  - It happens once in a life.
  - It sits outside the pace window.
  - The card shows a "specialty transfer" note.
- **A character created past Initiate already holds it.** The closed form includes it. The flag reads `creation`, and
  the engine refuses a second transfer.
- **The closed form:** for a Jedi with the curriculum, the Padawan plan's main form gets the same max at the Padawan
  start.
- **No other form gets it.** The second form keeps its survey XP.

**Ruling 3: the gate covers free training**
- **The training rule:** a Jedi Initiate before the gate cannot train a lightsaber form, alone or taught.
- **The scheduler:** sends a pre-gate Initiate's free form hours where the saber class's hours go (Force Control,
  physical training, centering), and notes it.
- **Spars are not gated.** They are fights, not training sessions. Obi-Wan's spars start at 6, after his gate.

**Levers (b) and (c)**

| | D-459 | D-460 |
|---|---|---|
| Survey | Form I 1 h, Forms II–VI 1 h by rotation (about 10% each) | Form I 1.5 h, Forms II–VI 0.5 h by rotation (about 5% each) |
| Gate | Force Control 13 / Force Knowledge 5 (the Average at 6) | Force Control 9 / Force Knowledge 4 (the Average at 5: 9.7 / 4.2, rounded down) |
| When the Average opens the saber classes | about 5.7 | about 4.9 |

**The Initiate Trials, re-set by the D-51 rule from the Average** (gated seed, K 11.64):
- **The competence floor moves 16 → 18:** the Average's lowest of Forms II–VI after one survey year is Niman at 18.0
  at age 11.
- **Form I 24 stays:** the Average meets it at about 10.3.
- **Force Control 19 stays:** the Average meets it at about 10.9, and ruling 5 keeps it.

**A fix to my own harness change**
- **The problem:** the lifetime harness took D-119 transfers out of the yearly and phase XP, but not the new specialty
  transfer. The first yearly-table measurement read 1,193 at 12 because of that.
- **The fix:** the specialty transfer is now taken out the same way, and the yearly table was re-measured.
- **A side effect, also fixed:** for a while the harness logged the specialty transfer as a D-119 transfer, which broke
  one test.

**Also fixed: two files with broken characters.** A PowerShell read-and-write of two source files added a byte-order
mark and double-encoded the non-ASCII characters (`§` became `Â§`). Both files are repaired; their diffs show only the
intended changes.

## 2. The lever probes (gated seed; levels probe and K solve)

All at K 11.5, except the two settling runs at the bottom.

| Step | Solved K | Average's 21 | Average's 41 |
|---|---|---|---|
| (a) the specialty transfer, plus the gate over free training | 10.84 | 5.87 | 16.70 |
| (a)+(b) Form I at 75% in the survey | 11.11 | 5.87 | 16.40 |
| (a)+(b)+(c) the gate at 5 | **11.66** | 5.03 | 15.84 |
| settling: K 11.66 | 11.64 | 5.09 | 16.02 |
| settling: K **11.64** | 11.64 | 5.08 | **16.00** |

## 3. The Average's forms (gated seed)

- **"D-459":** K 11.5, gate at 6, survey at 50%, no specialty transfer.
- **"D-460":** this run.
- **12** is the Average's Padawan start, after its Initiate Trials. The 12 column is before the specialty transfer,
  which lands on Soresu's first Padawan session.

| | At 12, D-459 | At 12, D-460 | At 25, D-459 | At 25, D-460 |
|---|---|---|---|---|
| Form I (Shii-Cho) | 24.3 | 27.3 | 24.3 | 27.3 |
| Form II (Makashi) | 18.8 | 20.4 | 18.8 | 20.4 |
| Form III (Soresu) | 18.7 | 20.4 | 47.3 | 49.2 |
| Form IV (Ataru) | 18.8 | 20.4 | 29.0 | 30.0 |
| Form V (Shien / Djem So) | 18.5 / 18.5 | 20.3 / 20.2 | 20.3 / 18.5 | 21.8 / 20.2 |
| Form VI (Niman) | 16.8 | 18.1 | 20.1 | 21.3 |
| Force Control | 22.3 | 20.7 | 47.4 | 46.3 |

- **Soresu at 13:** 26.0. That is 0.75 × Shii-Cho's XP, plus a year of Padawan training.
- **The Average at the Initiate Trials (11):** Form I 25.5; Forms II–V 20.2; Niman 18.0; Force Control 19.3.

## 4. Final parameters

| Parameter | Bound | Before (D-459) | After |
|---|---|---|---|
| K | 11.5–13.5 | 11.5 (at the bound) | **11.64** |
| Luke's accelerated bonus | x3.0–x4.0 | x3.5 | x3.5 (Djem So 59.6 at year 5) |
| Per-hour table | 20-seed median | D-459 | re-measured (`src/data/paceRates.ts`); gate worst -0.0% |
| Yearly table (`Y_AVG`) | 20-seed median | 8: 550, 12: 662, 20: 595, 60: 461 | 8: 567, 12: 620, 20: 634, 60: 449; the rest within 2.5%; gate worst 0.1% |
| Archetype paces | real loop | D-459 | re-measured; the Vong's Force Control pace removed again (D-447) |
| Gate | – | FC 13 / FK 5, age 6 | FC 9 / FK 4, age 5 |
| Survey Form I share | – | 0.5 | 0.75 |
| Competence floor | – | 16 | 18 |
| Sith profile constants | ±15% | unchanged | unchanged |

## 5. Results

Years to 21 / 41 / 61 / 81 / 101, on the gated seed (`-s9`):

| Profile | D-459 | D-460 | Target |
|---|---|---|---|
| Average | 5.87 / 17.30 / 32.08 / 52.84 / 79.02 | 5.08 / 16.00 / 30.82 / 51.72 / 78.20 | 5.0 / 16.0 / 32.1 / 52.7 / 77.5 |
| Obi-Wan | 3.96 / 13.85 / 22.23 / 36.55 / 55.60 | 4.09 / 12.48 / 20.63 / 34.45 / 52.84 | 3.4 / 10.8 / 21.7 / 35.6 / 52.4 |
| Anakin | 1.18 / 3.41 / 6.99 / 12.65 / 17.90 | 1.20 / 3.57 / 6.94 / 12.43 / 18.20 | 1.3 / 4.1 / 8.2 / 13.5 / 19.9 |
| Luke | 1.69 / 5.46 / 11.43 / 19.98 / 31.67 | 1.70 / 5.52 / 11.56 / 20.22 / 31.69 | 2.1 / 6.9 / 13.9 / 22.8 / 33.6 |

Gate pass counts from the 20-seed spread (1,740 s):

| Gate | D-459 | D-460 |
|---|---|---|
| Average: 41 at 16.0 ± 0.1 | 0/20 | **20/20** (15.96–16.09) |
| Average: milestones ±20%, within 4.0x, peacetime combat, tiredness | 20/20 | 20/20 |
| Average: rank minimums ±2 y | 0/20 | 0/20 (only the Master's main 64: 37.46) |
| Obi-Wan: milestones ±20% | 0/20 | **9/20** (only the 21: 4.06–4.12 against 4.08; the 41 at 12.44–12.60) |
| Obi-Wan: not faster than Anakin; within 4.0x | 14/20 | **20/20** |
| Obi-Wan: Clone Wars share; peacetime combat | 20/20 | 20/20 |
| Anakin: every gate | 20/20 | 20/20 |
| Luke: milestones ±20% | 1/20 | 3/20 (41 at 5.33–5.70 against the 5.52 floor) |
| Luke: within 4.0x, Force rising, physical peak | 20/20 | 20/20 |
| Yearly and per-hour tables | pass | pass (0.1%, -0.0%) |

**The Average's rank-minimum crossings** (gated seed, the stated age in brackets):

| Minimum | Crossed at |
|---|---|
| Highest form 24 (10) | 10.19 |
| Force Control 19 (10) | 10.76 |
| Force Control 41 (24) | 22.04 |
| Force Sense 40 (24) | 22.44 |
| Willpower 58 (24) | 22.67 |
| Highest form 47 (24) | 23.52 |
| The Master's main 64 (40) | **37.46** |

**Why the remaining goals fail:**
- **Obi-Wan's 21:** ruling 3 stops his free Shii-Cho before the gate. He starts at 3, and the gate opens at about 4.6
  for him, so his Form I starts later than before. He misses by 0.01–0.04 years on 11 seeds.
- **Luke's 41:** K went from 12.45 (D-456) to 11.64, which makes everyone faster. The curriculum only slows the Order
  path, and Luke is an outsider. The only in-bounds lever on the accelerated path (×3.5) doesn't apply to his spread
  profile.
- **The Master's main 64:** the D-437 minimum is the Average's highest form at 40, and K is lower. The Average is now at
  66.6 at 40.

**Other checks:**
- **npc test 7:**
  - Guardian 54.37 / 54.43; Consular 32.61 / 32.65; Sentinel 53.21 / 53.33.
  - Sith Warrior 55.51 / 55.74; Sith Inquisitor 53.94 / 53.80.
  - Soldier 60.04 / 61.33; smuggler 59.19 / 60.88; bounty hunter 60.12 / 61.02; civilian 68.20 / 66.54.
  - **The Mandalorian: 59.75 / 61.90 (2.15).**
- **Tython move:** neutral. The era Average's Force Control and Force Sense XP is identical with and without the
  move, every year 3671–3649 BBY.
- **Discarded XP over full lives:** Average, Obi-Wan, Anakin and Luke all 0.

## 6. The Mandalorian's pace fit (ruling 7)

Its blaster on the loop (npc test 7's life, start 8) against the closed form at its measured pace (1.443). The last
column is the single pace that would match the loop at that year.

| Year (age) | Loop | Closed | Matching pace |
|---|---|---|---|
| 1 (9) | 8.88 | 10.70 | 1.041 |
| 5 (13) | 22.60 | 26.25 | 1.111 |
| 10 (18) | 34.47 | 38.13 | 1.209 |
| 25 (33) | 59.75 | 62.35 | 1.339 |
| 40 (48) | 78.34 | 80.06 | 1.389 |
| 60 (68) | 98.39 | 99.09 | 1.425 |

The probe ran at K 11.5, before the re-measure. The test above is at K 11.64 with the re-measured pace: 59.75 against
61.90.

- **The cause is the training budget, which ramps with age:**
  - 4 h a day to 10, rising to 6 h at 15.
  - The closed form's single pace can't follow the ramp.
  - The Mandalorian is the only career archetype that starts before 15.
- **The best single pace (1.355, minimax over the 60 years) still misses by up to 2.96 levels:** +2.7 at year 5 and
  -2.8 at year 60.
- **Not done:** setting 1.355 would pass year 25, but it means tuning to the test and moving away from the measured
  pace. The measured pace stays.
- **The real fix** is a youth pace phase for careers that start before 15: a pace from the start to 15 and the adult
  pace after it, measured on the loop. That changes the closed form's structure for careers, so per Golden Rule 7 it
  waits for approval (question 1).

## 7. Obi-Wan's Soresu per hour under the final table (gated seed)

| Year from age | 15 | 25 | 40 |
|---|---|---|---|
| Window rate / table, XP/h | 1.219 / 1.191 (**x1.02**) | 0.927 / 1.109 (**x0.84**) | 0.919 / 0.959 (**x0.96**) |
| Hours (Obi-Wan / Average) | 1,015 / 719 | 985 / 654 | 923 / 655 |
| Effective share | x0.959 | x0.888 | x0.942 |
| Challenge (push) | x1.129 | x1.015 | x1.012 |
| Outcome | x0.995 | x1.018 | x1.013 |
| Teacher | x0.954 | x1.000 | x1.000 |
| Age, centered | x1.000, x1.003 | x1.000, x1.003 | x1.000, x1.003 |
| Discarded | 0 | 0 | 0 |

The cap is 4.0x, and Obi-Wan runs at or below the Average's rate per hour. He gets ahead by training more hours.

## 8. Tests

- **Final `test:all`** (1,065 s): 145 files and 1,396 tests; 1,391 pass. The 5 failures:
  - `average.test`, the transfers test. This was my harness change; it is fixed and re-run: 7 of 8 pass.
  - `average.test`, ranks test 1. This is the Master's main 64, reported.
  - `obiwan.test` milestones: the 21.
  - `luke.test` milestones: the 41, at 5.52 against 5.52.
  - npc test 7 for the Mandalorian.
- **After the fix:** 4 failures remain, each one a goal reported above.
- **New tests:**
  - `tests/features/specialtyTransfer.test.ts` (5 tests): the gate in the training rule and the scheduler, the
    specialty transfer once, at 0 when not needed, held at creation, and a second one refused.
  - The curriculum test now covers the closed form's specialty transfer.
- **Updated pins:**
  - K, `Y_AVG` at 20 and the Anakin floor (3.22).
  - The closed-form reference table: Padawan 16 is 33.1, Knight 30 55.6, Obi-Wan 81.2.
  - The creation references from the day loop: 24-year-old Knight 47.7, 9-year-old Shii-Cho 20.8, 16-year-old Soresu
    33.1, campaign at 25 49.2.
  - The survey shares, and the applied-experience fixture, which now starts past the gate.
- **Fixed by this run:** creation test 1 failed under D-459; the Average now meets the Knight minimums at 24.
- **New report probes in `tests/sweep/`:** `paceFit.test.ts` (ARCH) and `rankCross.test.ts`.

## 9. Runtimes

| Run | Time |
|---|---|
| Probes (a), (b), (c): K solve and levels in parallel | 57 s, 60 s, 57 s |
| Gate levels at 4.5–5.5 | 1 s |
| K settling runs (11.66, 11.64) | 51 s, 50 s |
| Trials levels probe | 116 s |
| Mandalorian pace-fit probe (x2) | 67 s, 70 s |
| Per-hour table, Average only, 20 seeds (the clamp open) | 635 s |
| Yearly table re-measure after the harness fix (20 seeds) | 769 s |
| Paces (in parallel with the above) | 513 s |
| Creation reference levels | 149 s |
| Rank crossings | 50 s |
| Full spread (80 lives) | 1,740 s |
| `test:all` | 1,065 s |
| Obi-Wan breakdown, discard report and Tython (in parallel) | 556 s |
| Archetype and Luke accelerated logs | 123 s |
| `average.test` re-run | 88 s |

## Questions

1. **The Mandalorian: approve a youth pace phase for careers that start before 15?** This means a pace from the start
   to 15 (where the budget reaches adult hours), then the adult pace, both measured on the loop. It touches
   `phasesFor`, creation and the pace measurement. Only the Mandalorian starts that young now. The alternatives are to
   accept the 2.15 or widen test 7.
2. **Obi-Wan's 21 (4.06–4.12 against 4.08).** Ruling 3 caused it, and every other Obi-Wan goal passes. Options:
   - accept it;
   - move the 21 target, which is not canon-anchored (3.4 → about 3.5);
   - give his profile's pre-gate hours to Force Control or Force Knowledge, so he reaches the gate sooner.
3. **Luke's 41 (5.33–5.70 against 5.52).** K is set by the Average, and Luke's spread profile has no in-bounds lever.
   Options:
   - accept it;
   - tune his profile, for example his main share, outside this run's bounds;
   - re-anchor his targets.
4. **The Master's main specialty minimum 64.** The Average reaches it at 37.46. By the D-437 rule (the Average at 40)
   it would become 66. Re-set it, or keep 64? Rank minimums were on the "nothing else changes" list.
5. **The gate at 5 (lever c).** The Average now opens the saber classes at about 4.9 (Force Control 9, Force Knowledge
   4). The ages are design defaults; please confirm 5 is acceptable for the lore.
6. **The specialty transfer's timing.** It fires on the main form's first session as a Padawan, not at the moment of
   promotion, so a Padawan who picks the main form later still gets it, measured against Form I at that time. Is that
   the intended reading?
7. **The canon Force Knowledge and Meditation bands** are deferred again, because not every goal passes. Should they
   run anyway next session?
8. **Open item (ruling 6):** the Sith acolyte curriculum, from the Korriban academy lore, in a later design pass.
