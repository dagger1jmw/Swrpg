# Overnight re-measure, 2026-11-23 (Phase B; D-456)

Unattended run of Phase B of the follow-up answers. Started 01:18, finished about 03:40, well inside the 6-hour cap.
Baseline before the run: tag `calibration-baseline-2026-11-23`, folder `docs-v2/reference/calibration-baseline-2026-11-23/`.

## Summary

- **The dip at 30 was accidental and is fixed (D-456: a rest before a trim).**
- **K, the 4.0x table, the archetype paces and Luke's accelerated-path bonus were re-measured inside their bounds.** The tuning took two iterations.
- **Goals that pass:**
  - the Average's 41 at 16.0 years (20 of 20 seeds, up from 18);
  - Obi-Wan's 41 by 12.96 years;
  - Anakin inside the 4.0x on every seed;
  - Luke's Djem So 56 by year 5;
  - the Sith archetypes' gates;
  - the Tython move costing nothing.
- **Goals that fail:**
  - **Obi-Wan's milestones ±20%** (0 of 20 seeds, was 20 of 20) and **his Clone Wars share** (1 of 20, was 19 of 20). The cause is outside the tuning bounds (below), so I didn't widen them.
  - **Mandalorian npc test 7**, by 0.02 levels.
- **One unit test fails because of the fix** and was left for you (montageSpan).
- **The canon-band step was skipped:** it runs only once every goal passes.

## 1. The fix (D-456)

The diagnosis was clear, so the fix was applied (the Phase A report has the full chain). When a day projects over its tiredness limit, the planner first takes every rest between physical blocks; those rests cost clock time, not training hours. Only a day still over the limit is trimmed. The real day loop takes the rests the plan marks as needed.

- On the gated Average, the fill trims at ages 22-36 go from 29-234 days a year to none.
- The 4.0x table point at 30 goes from 405 to 484.

## 2. Final parameter values

| Parameter | Bound | Before | After |
|---|---|---|---|
| K | 11.5-13.5 | 12.30 | **12.45** (41 at 16.005 y on the gated seed; 12.47 gave 16.027) |
| Luke's accelerated-path bonus | x3.0-x4.0 | x3.4 | **x3.5** (cap multiplier stays x3.2) |
| 4.0x table (`Y_AVG`) | 20-seed median | see below | see below |
| Archetype paces | real loop | D-445 | re-measured (below) |
| Sith constants shifted by the seats | ±15% | — | form fills within ±15%; some stat paces above (question 3) |

4.0x table, by age:

| Age | 4 | 8 | 12 | 16 | 20 | 24 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 98 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Before | 582 | 611 | 599 | 604 | 620 | 560 | 405 | 468 | 461 | 498 | 452 | 446 | 300 | 204 |
| After | 583 | 609 | 606 | 625 | 629 | 558 | **484** | 472 | 462 | 480 | 449 | 448 | **338** | 207 |

The verification spread passes the table gate: worst deviation 2.0%, at age 98.

Paces (a selection; all of them are in `src/data/archetypes.ts`):

| Archetype | Pace | Before | After |
|---|---|---|---|
| Jedi Guardian | Padawan Willpower | 1.348 | 1.512 |
| Jedi Guardian | Knight form fill | 1.615 | 1.662 |
| Sith Warrior | Padawan Force Control | 0.994 | 1.143 (+15%) |
| Sith Warrior | Padawan Force Output | 0.822 | 0.985 (+20%) |
| Sith Warrior | Knight Willpower | 0.972 | 1.207 (+24%) |
| Sith Warrior | Knight form fill | 1.372 | 1.528 (+11%) |
| Sith Inquisitor | Knight Force Output | 1.503 | 1.701 (+13%) |
| Soldier | Knight Willpower | 0.302 | 0.59 |
| Warrior | Knight Willpower | 0.176 | 0.587 |
| Bounty hunter | Knight Willpower | 0.296 | 0.712 |

The Vong's measured Force Control pace (0.004) is removed again (D-447).

Nothing else changed: rank minimums, nexus multipliers, the instructor share, the covert and Order rules, and the stat formulas are as they were.

## 3. Results

Gated seed (`-s9`), years to 21 / 41 / 61 / 81 / 101:

| Profile | Before (D-445) | After |
|---|---|---|
| Average | 4.43 / 15.99 / 33.05 / 55.47 / 83.51 | 4.49 / 16.01 / 31.86 / 54.27 / 82.68 |
| Obi-Wan | 3.41 / 12.75 / 21.75 / 37.14 / 57.82 | 3.46 / 12.49 / 22.03 / 40.27 / 64.62 |
| Anakin | 1.31 / 3.79 / 7.36 / 13.43 / 19.10 | 1.27 / 3.77 / 7.28 / 13.54 / 19.07 |
| Luke | 2.15 / 6.86 / 14.35 / 24.79 / 38.38 | 1.95 / 6.23 / 13.08 / 22.82 / 36.55 |

20-seed spread, gate pass counts:

| Gate | Before | After |
|---|---|---|
| Average: 41 at 16.0 ± 0.1 | 18/20 | **20/20** |
| Average: milestones, 4.0x, peacetime combat, rank minimums, tiredness | 20/20 | 20/20 |
| Obi-Wan: milestones ±20% | 20/20 | **0/20** (101 at 64.6 y against a 52.4 target, +23%) |
| Obi-Wan: Clone Wars share 20-30% | 19/20 | **1/20** (mean 15.6%) |
| Obi-Wan: 4.0x, peacetime combat | 20/20 | 20/20 |
| Anakin: every gate (4.0x on 20/20) | 20/20 | 20/20 |
| Luke: every gate | 20/20 | 20/20 |
| Table gate | pass (0.7%) | pass (2.0%) |

Other checks:

- **Luke on the accelerated path:** Djem So 56.2 and Force Control 61.7 at year 5 (goal: Djem So 56).
- **npc test 7:** every archetype within 2 levels except the Mandalorian, at 2.02.
  - Sith Warrior 53.37 / 53.59; Sith Inquisitor 51.93 / 51.81.
  - Guardian 53.73 / 53.78; Consular 30.77 / 30.84; Sentinel 52.70 / 52.84.
  - Soldier 57.66 / 58.97; smuggler 56.87 / 58.53; bounty hunter 57.78 / 58.70; civilian 65.66 / 65.03.
- **Coruscant -> Tython:** the era Average's Force Control and Force Sense XP is identical, year for year, with the move and without it (0.0% each year; both x1.15). There is no visible drop.
- **Swordmaster:** 56.2 / 68.9 / 89.8 at 30 / 40 / 60 (was 55.6 / 67.3 / 88.7).
- **Knowledge at 25 / 40 / 60:**

  | Archetype | Force Knowledge | Meditation |
  |---|---|---|
  | Guardian | 12.5 / 17.8 / 24.4 | 15.3 / 22.3 / 30.6 |
  | Consular | 16.2 / 56.7 / 91.3 | 17.5 / 33.4 / 49.6 |

- **The Average at 24:** highest form 47.3, Force Control 41.8, Force Sense 40.7, Willpower 60.2. The minimums 47 / 41 / 40 / 58 are kept, as instructed.

## 4. Why Obi-Wan fails

- The 4.0x clamp caps a skill by its share of training hours (D-104; Obi-Wan has no focus weights, so his share is his hours share).
- The old trims cut his other fill blocks harder than his Soresu block. That raised Soresu's share, and with it Soresu's cap.
- With the fill no longer trimmed, Soresu's share falls back to the plan's proportions. At ages 26-30 the clamp now discards about 356 XP a year from him (101 before). His combat XP falls with it: war years 87 XP a year against 169.
- Measured both ways with the same K and table:

  | | 81 | 101 | War share |
  |---|---|---|---|
  | Without the fix | 37.5 | 58.4 | about 24% |
  | With the fix | 40.3 | 64.6 | 15.6% |

- Nothing inside the bounds moves it: the table is measured, not set, and K is fixed by the Average.

## 5. Unit tests left for you

**`tests/turn/montageSpan.test.ts`** ("a 3 months montage turn ends on the same day ... three months later") fails.

- Its seed, 'span-2', was hand-picked to roll no world event over three months (D-427 had already shifted the RNG once). The fix shifts it again, and the span now rolls "The character is summoned".
- Re-picking a seed until the test passes is the kind of change that should be yours, so I left it.

Everything else in `test:all` passes (final run: 1,379 of 1,383; typecheck and lint clean).

## 6. Harness findings

- **The lifetime harness's `discarded` counter always reads 0.** It looks for the clamp notes on applied events, but routine sessions put them on the session log. Earlier "nothing was discarded" statements rested on it, including D-445's reading of the dip.
  - Not changed: the counter is a reporting tool, and lifetime tests may read it.
  - Added instead: `fightStats.combatDiscardedXp`, which counts combat XP the clamp discards.
- **A life now moves to its place at the next wake, before the day hook runs.** In Phase A the era profile probed the first day of 3,650 before the move; that was my bug, now fixed.
- **Repaired:** a PowerShell edit in Phase A had double-encoded the non-ASCII characters in `tests/support/lifetime.ts`.

## 7. Runtimes

| Run | Time |
|---|---|
| K solve x4 | about 54 s each |
| Paces | 236 s |
| Spread 1 (old table; failed the table gate, as expected) | 1,629 s |
| Spread 2 (verification) | 1,676 s |
| test:all, first run | 817 s |
| Lifetime report re-run | 206 s |
| Tython-move check | 72 s |
| Obi-Wan and career diagnosis probes | 50-95 s each |
| Final test:all | 892 s: 142 files, 1,383 tests; 4 fail (Obi-Wan x2, the Mandalorian, montageSpan), all reported here; the era profile passes on 20 seeds |

## Questions

1. **Obi-Wan:** the fix breaks his milestones and war-share gates through the hours-share clamp. Options:
   - (a) give Obi-Wan focus weights, so the clamp reads his intended Soresu share;
   - (b) re-tune his profile (war fights, plan);
   - (c) change the clamp's share rule;
   - (d) widen the bounds.

   All of these are outside tonight's bounds.
2. **Career Willpower:** the fix roughly doubles career Willpower paces (soldier 0.30 -> 0.59), because careers had been losing 230-320 fill hours a year to trims, and the Willpower earned from fatigue went with them. D-446 accepted the old rates. Keep the new ones?
3. **Sith paces:** at their seats, some Sith stat paces rose more than 15%: Warrior Knight Willpower +24%, Padawan Force Output +20%, Force Sense +18%. Part of each rise is the fix itself, which raised Jedi Willpower 8-12% too. Is "Sith constants within ±15%" meant to cover the archetype paces? If so, which should be capped?
4. **Mandalorian npc test 7** fails by 0.02 levels (loop 57.49 against closed form 59.51). Accept it, or look at the Mandalorian's pace fit?
5. **montageSpan:** re-pick the seed, or make the test independent of world events?
6. **The `discarded` counter:** fix it to read the session logs? Some lifetime checks may then change.
7. **The canon Force Knowledge and Meditation bands** were not re-measured, because not every goal passed. The loop now gives:
   - a Guardian Knight: Force Knowledge 12-18, Meditation 15-22;
   - a Consular Master at 40-60: Force Knowledge 57-91, Meditation 33-50.

   The bands are 40 / 60 / 80, with focus figures one band higher. Run the re-measure next session?
