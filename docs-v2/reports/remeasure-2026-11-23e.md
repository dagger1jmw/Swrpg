# Calibration close-out, the Jedi Path ruling and the lore commit (2026-11-23e; D-462, D-463, D-464)

This is the unattended run on Jared's three-part message after `remeasure-2026-11-23d.md`. It started at about 19:15
and ended at about 21:20, inside the 6-hour cap. There were no tuning iterations, and no bound was widened.

- **Starting point:** commit `7b13962` (D-461). The tag for this run is `calibration-2026-11-23e`.
- **Decision entries:** D-462 (the calibration rulings), D-463 (the Jedi Path) and D-464 (the economy rulings and the
  lore fixes).

## Summary

- **Every gate passes 20/20 on the spread** (2,863 s): the Average, Obi-Wan, Anakin, Luke, and both calibration tables.
- **`test:all` passes completely:** 1,403 of 1,403 tests, 837 s.
- **The canon knowledge bands are read at each figure's own age where the lore gives a birth year.** 5 figures read
  their own age; 17 fall back to the standing midpoint.
- **The Jedi Path ruling is recorded**, and the survey is now date-driven, with a test.
- **The lore files are fixed and committed:** the 17 economy files, 5 more lore files and 2 research lists.

## Part 1: the calibration rulings (D-462)

| Ruling | Change | Check (20 seeds) |
|---|---|---|
| 1. Luke's 21 | 2.1 → 1.7 (his measured median, 1.69) | his milestones pass 20/20 (21 at 1.59–1.85 against 1.36–2.04) |
| 2. The Knight's Force Control | 41 → 44 (the Average at 24: 44.6) | crossed at 23.54–23.73 |
| 4. The Master's main | 66 → 67 (D-437's nearest-level rounding of 66.6) | crossed at 40.22–40.53 |
| 5. npc test 7 | adds the warrior and the Yuuzhan Vong warrior (±2) | warrior 57.43 / 58.09; Vong 58.02 / 59.70 |

- **Related changes:**
  - The Master row carries the Knight minimums, and the Sith Lord row mirrors them (D-437), so both moved to Force
    Control 44 with the Knight.
  - progression-numbers §12 now notes that Luke's targets are measured regression values, not canon anchors.
  - One test fixture (a Knight-ready Padawan at Force Control 44) moved to 47.

**The Average's rank-minimum crossings** (20 seeds; all inside ±2 years of the stated age):

| Minimum (stated age) | Crossed at |
|---|---|
| Highest form 24 (10) | 10.19–10.33 |
| Force Control 19 (10) | 10.66–10.76 |
| Force Sense 40 (24) | 22.37–22.57 |
| Willpower 58 (24) | 22.48–22.68 |
| Highest form 47 (24) | 23.45–23.66 |
| Force Control 44 (24) | 23.54–23.73 |
| The Master's main 67 (40) | 40.22–40.53 |

**The spread** (2,863 s):

| Profile | Gated seed, years to 21 / 41 / 61 / 81 / 101 | Target | Gates |
|---|---|---|---|
| Average | 5.08 / 16.00 / 30.82 / 51.72 / 78.20 | 5.0 / 16.0 / 32.1 / 52.7 / 77.5 | all 20/20 (rank minimums included) |
| Obi-Wan | 4.09 / 12.48 / 20.63 / 34.45 / 52.84 | 3.5 / 10.8 / 21.7 / 35.6 / 52.4 | all 20/20 |
| Anakin | 1.20 / 3.57 / 6.94 / 12.43 / 18.20 | 1.3 / 4.1 / 8.2 / 13.5 / 19.9 | all 20/20 |
| Luke | 1.70 / 5.52 / 11.56 / 20.22 / 31.69 | **1.7** / 5.5 / 13.9 / 22.8 / 33.6 | all 20/20 |

Both tables pass: `Y_AVG` worst 0.1%, the per-hour table −0.0%.

### The canon bands' read age (ruling 3)

**How the read age is chosen**
- **Own age:** a figure is read at its Human-equivalent age at the sheet's date when the roster's birth year comes from
  the lore.
- **Fallback:** otherwise it is read at the standing midpoint (32.5 / 50 / 70).
- **Why estimates fall back:** every roster figure has a birth year, but 144 of the 196 are estimates (`birthSource:
  'estimate'`, a design default from D-412). I took "where the roster has a birth year" to mean a lore birth year
  (question 1). The other 52 come from the lore.
- **What does not change:** hand-set lines still override, and no value is above the authored one.

**How the bands became curves**
- I re-ran the same 100 lives (5 Order archetypes × 20 seeds, the npc-test-7 life) out to age 100, reading Force
  Knowledge and Meditation at 20, 25, 30, 32.5, 35, 40 … 70, 80, 90 and 100 (3,549 s).
- `KNOWLEDGE_BAND_CURVES` interpolates between those ages and is flat outside them. At 32.5, 50 and 70 the values are
  last run's.

**Counts:** 22 canon figures have a band-read Force Knowledge or Meditation that isn't hand-set (25 anchors).
- **5 figures read their own age**, 1 anchor each:

| Figure | Archetype | Sheet date | Human-equivalent age | Standing | Force Knowledge / Meditation |
|---|---|---|---|---|---|
| Kira Carsen | Guardian | 3637 BBY | 26 | Knight | 15 / 17 |
| Syo Bakarn | Consular | 3650 BBY | 28 | Knight | 29 / 23 |
| Darth Thanaton | Sith Warrior | 3645 BBY | 50 | Darth | 19 / 21 |
| Darth Baras | Inquisitor | 3643 BBY | 54 | Darth | 45 / 29 |
| Darth Vowrawn | Inquisitor | 3645 BBY | 71 | Dark Council | 57 / 36 |

- **17 figures (20 anchors) fall back** to the midpoint.

**bandEffect, re-run** (change in each canon value):

| Archetype, stat, standing | Anchors | Against D-429 | Against the D-461 midpoint read |
|---|---|---|---|
| Consular Force Knowledge / Meditation, Knight | 1 | −11 / −17 | **−14 / −5** (Syo Bakarn, read at 28) |
| Guardian Force Knowledge, Knight / Master | 3 / 6 | −3 (−5 to −3) / −17 | −2 to 0 (Kira Carsen) / 0 |
| Guardian Meditation, Knight / Master | 3 / 6 | 0 (−3 to 0) / −12 | −3 to 0 / 0 |
| Sentinel Force Knowledge / Meditation, Master | 1 | −17 / −12 | 0 / 0 |
| Warrior Force Knowledge, Knight / Master | 2 / 3 | −6 / −21 | 0 / 0 |
| Warrior Meditation, Knight / Master | 2 / 3 | −6 / −19 | 0 / 0 |
| Inquisitor Force Knowledge, Knight / Master / Council | 2 / 5 / 2 | −15 / −18 (−18 to −15) / −23 | 0 / 0 to +3 (Darth Baras) / 0 |
| Inquisitor Meditation, Knight / Master / Council | 2 / 5 / 2 | −23 / −33 (−33 to −31) / −41 (−42 to −40) | 0 / 0 to +2 / 0 |

**A layering fix, so the data layer can compute the age:** `humanEquivalentAge` and the mapping from canon species ids
to species-table ids (Sith Pureblood and the like) moved into `src/data/species.ts`. The engine and the NPC selectors
now use them from there; the data layer imports nothing else, so this keeps a single copy of each.

## Part 2: the Jedi Path ruling (D-463)

- **Recorded:** in the lore index (the Jedi Order section) and in decisions.md. It replaces the narrower lore-batch-13
  framing: D-378 [1]'s "post-Ruusan details as later-era defaults", and D-459's "post-Ruusan default".
- **The baseline:** *The Jedi Path* is the curriculum for the academy-based Order in any era.
- **Era differences override it:**
  - **Entry ages:** from infancy is post-Ruusan; earlier eras take teens or twenties.
  - **Strictness:** "progress or leave" and one Master, one Padawan are post-Ruusan; earlier Masters could have several
    students.
  - **The Initiate Trials' form:** pre-Ruusan, lightsaber construction is the second test; on Dantooine, facing the dark
    side.
  - **No academy stage:** the Je'daii, the early Order and the New Sith Wars.

**The date-driven survey (built).** Each form's earliest attested year (`FORM_FROM_YEAR`, from
SW_Lightsaber_Forms_AllEras_Part1):
- **Form IV Ataru:** 3976 BBY (the Mandalorian Wars).
- **Form V Djem So:** 4000 BBY ("developed before 4000 BBY").
- **Shien:** 3959 BBY ("existed at least by the Jedi Civil War").
- **Forms I, II, III and VI:** no start date in the lore, so every lightsaber era.

How it is used:
- **From 3959 BBY on**, all six forms exist and the curriculum is as specified. This includes 3661 BBY and the test
  year, so the calibration is untouched.
- **Earlier dates** rotate through the forms that exist. Form I keeps 75%, and the rest is split across the others.
- **Where the date comes from:**
  - The day plan reads the date of each day.
  - The closed form reads the year the character reached the survey age.
  - The Initiate Trials count only the forms that exist and need all but one (still 4 of 5 when all exist). This
    scaling is my reading (question 3).
- **Tests:**
  - At 3990 BBY there is no Ataru or Shien, and each of the 4 groups gets 6.25%.
  - At 4100 BBY, 3 groups remain.
  - The closed form at 3990 BBY starts only the existing forms.
  - The Trials at 3990 BBY need 3 of 4.

## Part 3: the lore files (D-464)

**Economy fixes (`Docs/SWRPG lore/SW_Economy_*`, 17 files):**
1. **Endless Vigil:** lines sourced only to it (FFG, Oct 2016) moved to "Not used."
   - **Events:** the IGBC recession line.
   - **Institutions_Debt:** the same fact. It is split from the Muunilinst-backed fact, which stays.
   - **Part 9:** its 64 Endless Vigil items were already under "Not used."
2. **Nexus of Power:** the [gray] rows moved to "Not used." Part 1's [gray] count is updated (559 → 554).
   - **The count:** the economy set holds **5** such rows (Parts 3, 4, 5, 7×2), not 41. None is backed by another source.
   - **Left in place:** CanonGapFill's Bardottan Sphere row also cites it, but it is tagged [canon], not [gray].
   - **Outside the economy set:** the other 33 mentions of Nexus of Power are in Jedi training, ranks, traditions,
     crystals and species files (40 across all lore). Those are outside the economy set, so they are untouched
     (question 2).
3. **CanonGapFill:** 12 broken rows deleted, and its count updated (158 → 146).
   - **What was wrong:** each price cell held prose, an image caption, a quote or an HTML comment, with no price.
   - **The rows:** Sig ×3, Trimantium ×3, Yurfloo ×2, Ziroxin-12 ×4.
4. **The economy rulings are recorded in D-464:**
   - a stable credit;
   - separate Republic and Imperial credits, with a changer's cut;
   - Hutt coins;
   - Jedi decline rewards, consequences only for amassing wealth, and NPC behaviour by alignment;
   - lifestyle tiers;
   - debt;
   - haggling within ±20%.
   - **Note:** the "M8 design notes" with an "Economy" section (and the "Sith acolyte curriculum" section D-461 refers
     to) are not in the repo. D-464 records the rulings from your message and points to that section by name
     (question 4).

**Committed and indexed:**
- **The 17 economy files**, after the fixes.
- **Five more lore files:** SW_Sith_Academies_AllEras, SW_Weapons_Classes_AllEras, SW_Weapons_Armor_Named,
  SW_Starships_Classes, SW_Space_Tactics.
- **Two research lists:** docs-v2/lore/SW_Weapons_Armor_CategoryIndex and SW_Weapons_Armor_Sorted.
- **The lore index changes:**
  - New sections: Starships and space combat, Economy, Research lists.
  - New rows: the Sith academies file (Sith section), the weapon classes and named gear files (Equipment).
  - The Jedi Path note.

## 6. Tests and runtimes

**Tests**
- **`test:all`** (837 s): 147 files and 1,403 tests, all passing.
- **`npm test`** (1,354 tests), typecheck and lint pass.
- **New:**
  - The date-driven survey (2 tests in `tests/features/curriculum.test.ts`).
  - npc test 7 part 4 (`tests/lifetime/archetypesCareer2.test.ts`).
- **Updated:** the band probe (`tests/sweep/bands/`, ages 20–100) and `tests/sweep/bandEffect.test.ts` (read-age counts
  and the comparison with the midpoint read).

**Runtimes**

| Run | Time |
|---|---|
| Band curves (100 lives to 100, 10 workers; shared the CPU with the spread) | 3,549 s |
| Full spread (80 lives) | 2,863 s |
| Rank crossings, 20 seeds (4 jobs) | 310 s |
| `test:all` | 837 s |

## Questions

1. **The bands' read age:** should estimated birth years count as "the roster has a birth year"? Then all 22 figures
   would read their own age, not 5. The estimates are D-412 design defaults derived from rank spans.
2. **Nexus of Power:** the economy set had 5 [gray] rows, not 41, and all are moved. The other 33 mentions are in
   non-economy lore files (Jedi training, ranks, traditions, crystals, species). Should those move to "Not used" too?
3. **The Initiate Trials before 3959 BBY:** need all but one of the existing form groups (3 of 4 at 3990 BBY), or a
   different rule?
4. **The M8 design notes** (the "Economy" and "Sith acolyte curriculum" sections) aren't in the repo. Should they be
   added (for example to `docs-v2/spec/m8-world-checklist.md`), so the decisions can link to them?
