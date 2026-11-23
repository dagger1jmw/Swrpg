# Youth phase, targets, Master minimum and the canon knowledge bands (2026-11-23d; D-461)

This is the unattended run on Jared's rulings on `remeasure-2026-11-23c.md`. It started at about 17:00 and finished at
about 18:55, inside the 6-hour cap. There were no tuning iterations, and no bound was widened.

- **Starting point:** commit `393788e` (D-460). The tag for this run is `calibration-2026-11-23d`.
- **Decision entry:** D-461 in `docs-v2/decisions.md` logs every ruling and result.

## Summary

- **Ruling 1, the career youth phase, is built and measured.**
  - npc test 7 for the Mandalorian now passes: 59.75 on the loop against 60.64 in the closed form (was 2.15 apart).
  - Over its whole 60-year life the closed form tracks the loop within 1.14 levels. The best single pace managed 2.96.
  - The ruling covers three careers, not one: the warrior and the Yuuzhan Vong warrior also start before 15, at 14.
- **Rulings 2–4 are applied.**
  - Obi-Wan's milestones now pass on 20/20 seeds.
  - Luke's 41 target is re-anchored to 5.5.
  - The Master's main minimum is 66.
- **Ruling 7: the canon Force Knowledge and Meditation bands are re-measured and applied, per archetype** (section 4).
- **`test:all` passes completely:** 1,399 of 1,399 tests, 832 s.
- **Two gates are still partial on the 20-seed spread.** Both are minimums or targets the rulings didn't cover, and
  neither was changed:
  - **Luke's milestones, 12/20:** his 21 is at 1.59–1.85 against a 1.68 floor. The last report wrongly said only his
    41 failed.
  - **The Average's rank minimums, 7/20:** the Knight's Force Control 41 is crossed at 21.93–22.14, at most 0.07
    years early.
  - The gated seed passes both, which is why `test:all` is green.

## 1. The career youth phase (ruling 1)

**How it works**
- **The cutoff:** `CAREER_YOUTH_TO = 15`, the age the training budget reaches adult hours (4 h a day to 10, 6 h at 15).
- **The paces:** a career that starts before 15 has `youthPaces` up to 15, then its adult paces after 15.
- **Where it is read:**
  - `phasesFor` splits the single career phase at 15.
  - Creation reads the youth pace, and the focus sliders move it by the youth years' fill.
  - The pace measurement reads both spans. A new harness option, `youthTo`, puts the pre-15 days in their own bucket.
- **Sith acolytes** can use the same mechanism later.

**Measured on the loop (main skill):**

| Archetype (start) | Youth pace | Adult pace (was) | Worst gap over 60 years | At year 25 (npc test 7) |
|---|---|---|---|---|
| Mandalorian (8), blaster | 1.166 | 1.465 (1.425) | 1.14 | 59.75 / 60.64 (passes; was 59.75 / 61.90) |
| Warrior (14), melee | 1.213 | 1.332 (1.330) | 0.90 | 57.43 / 58.09 |
| Yuuzhan Vong warrior (14), melee | 1.212 | 1.400 (1.397) | 1.99 | 58.02 / 59.70 |

- **The Mandalorian, year by year**, closed form minus loop: year 1 +0.60, year 5 +0.64, year 10 +0.67, year 25 +0.89,
  year 40 +0.57, year 60 −0.02.
- **The Vong's remaining gap is in its adult years**, not its one youth year. It isn't in npc test 7, but it is still
  inside the ±2 that test uses.
- **The Vong's Force Control paces are removed again** (D-447: the Vong are outside the Force).
- **Every other npc test 7 archetype passes, unchanged:**
  - Guardian 54.37 / 54.43; Consular 32.61 / 32.65; Sentinel 53.21 / 53.33.
  - Sith Warrior 55.51 / 55.74; Sith Inquisitor 53.94 / 53.80.
  - Soldier 60.04 / 61.33; smuggler 59.19 / 60.88; bounty hunter 60.12 / 61.02; civilian 68.20 / 66.54.

## 2. Targets (rulings 2 and 3)

**Obi-Wan's 21: 3.4 → 3.5.** The +20% limit is now 4.20, and his 21 lands at 4.06–4.12. His milestones pass 20/20.

**Where Luke's 6.9 comes from:**
- **The source:** progression-numbers §12 holds all four profiles' targets. They first appear in the v2 spec commit of
  2026-11-16, as design values.
- **No Legends anchor:** nothing in the spec, the decisions log, `Docs/SWRPG lore/` or `legacy/` gives a source. Nothing
  in Legends puts Luke's 41 at age 26.
  - The only Luke numbers in `legacy/` are the apex anchors, such as peak Luke at about 138.
- **The re-anchor:** the target becomes his measured 20-seed median, 5.46, so **6.9 → 5.5**.
  - His 41 lands at 5.33–5.70, inside the new band of 4.40–6.60 on 20/20 seeds.
- **Still failing:**
  - **Luke's 21** (target 2.1, floor 1.68) fails on 8 of 20 seeds (1.59–1.85). It is not changed, because the ruling
    covered only the 41 (question 1).
  - With it, his milestones gate passes 12/20.

## 3. The Master's minimum (ruling 4)

- **The new minimum: 64 → 66.** The Average is at 66.6 at 40 (gated seed, K 11.64).
  - The Average crosses 66 at 39.21–39.51 years across the 20 seeds, inside 40 ± 2.
- **A rounding note:** D-437 rounded to the nearest level (63.9 → 64). By that rule 66.6 would give 67. I applied 66 as
  ruled; the 66 in my last report came from rounding down. 67 would also pass.
- **The Average's rank-minimum crossings on 20 seeds:**

| Minimum (stated age) | Crossed at | |
|---|---|---|
| Highest form 24 (10) | 10.19–10.33 | in |
| Force Control 19 (10) | 10.66–10.76 | in |
| **Force Control 41 (24)** | **21.93–22.14** | **out on 13 seeds, by at most 0.07 y** |
| Force Sense 40 (24) | 22.37–22.57 | in |
| Willpower 58 (24) | 22.48–22.68 | in |
| Highest form 47 (24) | 23.45–23.66 | in |
| Master's main 66 (40) | 39.21–39.51 | in |

- **Why Force Control 41 fails:** the lower K makes Force Control a little earlier. By the D-426 rule (the Average at
  24, which is 44.6) it would become 44 (question 2).

## 4. The canon Force Knowledge and Meditation bands (ruling 7)

**What was measured**
- **The rule being replaced:** D-429 [2] set these two stats on canon figures from fixed bands by standing: 40 for a
  Knight or Lord, 60 for a Master or Darth, 80 for the Councils, 100 for ancient figures, and one band lower (−20)
  outside the study focus (Consulars and Inquisitors). It said to re-measure them "once the XP sources exist."
- **The lives:** each Order archetype's npc-test-7 life (Padawan at 12, Knight at 25, the yearly mission, its Order's
  seat by date). This is the life generated NPCs reproduce.
- **The sample:** 20 seeds per archetype, 100 lives.
- **The ages:** each standing's band is read at the midpoint of its span: 32.5 for a Knight or Lord (25–40), 50 for a
  Master or Darth (40–60), 70 for the Councils (60–80).

**20-seed medians** (seed spread under 1 level everywhere except the Warrior's Meditation at 50, 19.6–20.6):

| Archetype | Force Knowledge at 32.5 / 50 / 70 | Meditation at 32.5 / 50 / 70 |
|---|---|---|
| Jedi Guardian | 16.8 / 23.0 / 29.1 | 20.1 / 28.1 / 36.1 |
| Jedi Sentinel | 16.8 / 23.1 / 29.2 | 20.0 / 27.9 / 35.9 |
| Jedi Consular | 42.5 / 78.6 / 107.2 | 27.8 / 44.1 / 59.0 |
| Sith Warrior | 13.9 / 18.5 / 23.6 | 14.2 / 20.5 / 26.9 |
| Sith Inquisitor | 25.1 / 41.5 / 56.6 | 17.3 / 26.8 / 35.7 |
| *Old bands, in focus / outside* | *40 / 60 / 80; 20 / 40 / 60* | *40 / 60 / 80; 20 / 40 / 60* |

**Applied per archetype, not as one focus band and one outside band**
- **Why per archetype:** the two focus archetypes are far apart. At 50, a Consular's Force Knowledge is 78.6 and an
  Inquisitor's is 41.5, so a shared median of 60 fits neither.
- **Where it lives:** `KNOWLEDGE_BANDS` in `src/data/canon/sheetScale.ts`, rounded to whole levels.
- **What does not change:**
  - A value is still never above the authored one.
  - The D-429 rule stays for ancient (fixed) figures, careers, Intelligence and Tactics.
  - The hand-set game-scale lines (Vitiate, Revan, Zym and the others) still override.

**Effect on the canon roster:** 50 values move, against the old rule.

| Archetype, stat, standing | Anchors | Change |
|---|---|---|
| Guardian Force Knowledge, Knight / Master | 3 / 6 | −3 / −17 |
| Guardian Meditation, Knight / Master | 3 / 6 | 0 / −12 |
| Sentinel Force Knowledge / Meditation, Master | 1 | −17 / −12 |
| Consular Force Knowledge / Meditation, Knight | 1 | +2 / −12 |
| Warrior Force Knowledge, Knight / Master | 2 / 3 | −6 / −21 |
| Warrior Meditation, Knight / Master | 2 / 3 | −6 / −19 |
| Inquisitor Force Knowledge, Knight / Master / Council | 2 / 5 / 2 | −15 / −18 / −23 |
| Inquisitor Meditation, Knight / Master / Council | 2 / 5 / 2 | −23 / −33 / −41 |

Most values go down: the loop gives far less Meditation than the old bands assumed, and less Force Knowledge outside
the Consulars. The probe is `tests/sweep/bandEffect.test.ts`, and question 3 asks whether to keep the change.

## 5. Results

20-seed spread (3,160 s; it shared the CPU with the band measurement). Years to 21 / 41 / 61 / 81 / 101 on the gated
seed:

| Profile | Gated seed | Target |
|---|---|---|
| Average | 5.08 / 16.00 / 30.82 / 51.72 / 78.20 | 5.0 / 16.0 / 32.1 / 52.7 / 77.5 |
| Obi-Wan | 4.09 / 12.48 / 20.63 / 34.45 / 52.84 | **3.5** / 10.8 / 21.7 / 35.6 / 52.4 |
| Anakin | 1.20 / 3.57 / 6.94 / 12.43 / 18.20 | 1.3 / 4.1 / 8.2 / 13.5 / 19.9 |
| Luke | 1.70 / 5.52 / 11.56 / 20.22 / 31.69 | 2.1 / **5.5** / 13.9 / 22.8 / 33.6 |

| Gate | D-460 | D-461 |
|---|---|---|
| Average: 41 at 16.0 ± 0.1; milestones; within 4.0x; peacetime combat; tiredness | 20/20 | 20/20 |
| Average: rank minimums ±2 y | 0/20 | 7/20 (Force Control 41) |
| Obi-Wan: milestones ±20% | 9/20 | **20/20** |
| Obi-Wan: within 4.0x; Clone Wars share; peacetime combat | 20/20 | 20/20 |
| Anakin: every gate | 20/20 | 20/20 |
| Luke: milestones ±20% | 3/20 | 12/20 (the 21) |
| Luke: within 4.0x; Force rising; physical peak | 20/20 | 20/20 |
| Yearly table and per-hour table | pass | pass (0.1%, −0.0%) |

## 6. Tests

- **`test:all`** (832 s): 146 files and 1,399 tests, all passing. `npm test`, typecheck and lint pass.
- **New:** `tests/engine/careerYouth.test.ts` (3 tests).
  - The split at 15, and that the Order's phases ignore it.
  - Exactly the careers that start before 15 carry a youth pace.
  - A created Mandalorian at 33 is within 1 of the loop, and one starting at 16 reads the adult pace only.
- **Updated:**
  - The band ruling test (`tests/m7/calibrationRulings.test.ts`): Kaedan's Force Knowledge is 23 (was 40), plus the
    measured and fallback cases.
  - The rank-minimum checks (66) in `average.test` and the spread.
  - The milestone targets.
- **New report probes:**
  - `tests/sweep/bands/` (the band measurement, 10 shards).
  - `tests/sweep/bandEffect.test.ts`.
  - `tests/sweep/rankCross.test.ts`, which now takes SEEDS.
  - `tests/sweep/paceFit.test.ts`, which now prints the archetype's own phases.

## 7. Runtimes

| Run | Time |
|---|---|
| Mandalorian paces (soldier and Mandalorian) | 44 s |
| Warrior and Vong paces | 243 s |
| npc test 7 for careers (after the Mandalorian) | 35 s |
| npc test 7, all archetypes (alongside the spread and bands) | about 15 min |
| Pace-fit probes (Mandalorian; warrior and Vong) | 22 s; about 2 min |
| Full spread (80 lives; shared the CPU) | 3,160 s |
| Canon band measurement (100 lives, 8 workers) | 3,544 s |
| Rank crossings, 20 seeds (4 parallel jobs) | 382 s |
| `test:all` | 832 s |

## Questions

1. **Luke's 21** fails on 8 of 20 seeds (1.59–1.85 against a 1.68 floor). Like his 41, it is a design value, not a
   canon anchor. Re-anchor it to his measured median (1.69, so about 1.7), as with the 41?
2. **The Knight's Force Control 41** is crossed at 21.93–22.14, at most 0.07 years early, on 13 seeds. Options:
   - re-set it by the D-426 rule (the Average at 24 is 44.6, so 44);
   - keep 41 and accept it.
3. **The canon knowledge bands:** keep the measured per-archetype values (most canon Order figures lose Force
   Knowledge and Meditation, by up to 41), or keep the old bands? The midpoint ages (32.5, 50, 70) are my choice; the
   start of each standing (25, 40, 60) would give lower values.
4. **The Master's minimum:** 66 as ruled, or 67 by D-437's nearest-level rounding? Both pass.
5. **The Vong warrior** now tracks its loop within 1.99 over its life (1.68 at year 25). It isn't in npc test 7. Add it
   and the warrior to test 7?
