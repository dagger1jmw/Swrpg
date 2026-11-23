# Calibration follow-ups (2026-11-22; D-445 to D-450)

Answers to the questions in remeasure-2026-11-22.md.

## 1. The Temple in the calibration (D-445)

The Average, Obi-Wan and Anakin now live in the Coruscant Temple in the lifetime runs (x1.15 on Force skills). Luke trains on Dagobah (x1.10) for three months at 22. The Jedi archetypes' paces are measured in the Temple too.

| Profile (gated seed) | Before | After |
|---|---|---|
| Average | 4.43 / 15.99 / 33.19 / 55.79 / 84.00 | 4.43 / 15.99 / 33.05 / 55.47 / 83.51 |
| Obi-Wan | 3.41 / 12.76 / 21.82 / 37.26 / 57.89 | 3.41 / 12.75 / 21.75 / 37.14 / 57.82 |
| Anakin | 1.31 / 3.76 / 7.53 / 13.81 / 19.20 | 1.31 / 3.79 / 7.36 / 13.43 / 19.10 |
| Luke | 2.15 / 6.89 / 14.37 / 24.81 / 38.37 | 2.15 / 6.86 / 14.35 / 24.79 / 38.38 |

- **K** is unchanged at 12.30 (41 at 15.995 years), because the bonus touches only Force skills.
- **The Average at 24** has Force Control 41.4 (was 38.1) and Force Sense 40.2 (was 37.1).
- **Knight minimums**, re-read by the D-51 rule: highest form 47, Force Control 41, Force Sense 40, Willpower 58. Force Sense 37 was met at 21.8, outside the ±2 years.
- **The 4.0x table** changed at 30 (444 to 405), 90 (324 to 300) and 60 (505 to 498). Every other age is within 1%.
  - The drop at 30 is a real loop effect, not the clamp (nothing is discarded).
  - Soresu and Willpower gains fall together for about three years once the Force skills pass about 45.
  - The Temple brings that dip two years earlier.
- **Jedi archetype paces:** Force Control and Force Sense rose about 15%. The Guardian's Knight form fill went from 1.543 to 1.615.
- **Spread (20 seeds):** every gate passes on all 20 seeds, with two exceptions:
  - the Average's 41 at 16.0 ± 0.1 (18 of 20);
  - Obi-Wan's Clone Wars share (19 of 20).

  The worst table deviation is 0.7%.
- **npc test 7:** every archetype's loop is within 1.7 levels of its closed form.
- **Luke on the accelerated path:** Djem So 56.0 and Force Control 61.0 at year 5.
- **Swordmaster:** 55.6 / 67.3 / 88.7 at 30 / 40 / 60.

## 2. Career Willpower (D-446)

The real-loop rates are accepted. A canon NPC's sourced anchor already beats the generator, stat by stat. All 45 anchors in the roster are hand-set sheets.

## 3. The Yuuzhan Vong (D-447)

A Vong NPC gets no Force skills or powers, whatever its archetype. Lightning (and Electric Judgment) now reaches them. Push, choke, mind tricks and sensing still fail against them. A player can't be a Vong: the species is not in the species table.

## 6. Covert discoveries (D-448)

Each discovery escalates, and the narrator is told the step it reaches:

1. The first brings the Master's reprimand.
2. The second brings a summons before the Council.
3. The third and later hold the trials back.

Any discovered dark-side power brings the Council's judgment, with possible expulsion. The code only tracks these steps; nothing is enforced.

## 7. Electric Judgment (D-449)

It stays forbidden, with a Master's permission opening it in any era. It opens fully from 11 ABY.

## 9. The two teaching shares (D-450)

Both shares pay on the same session hours. The instructor's share is 0.10 to 0.13 XP an hour; the review share was 0.01 to 0.02. The review share is removed.

## 10. Feints (D-450)

The old feint test set a seed the game never read, so every pass rolled the same dice. The test is fixed.

Feint success rates over 200 seeds:

| Attacker | vs Padawan | vs Knight | vs Master | vs Sith Lord |
|---|---|---|---|---|
| Padawan 16 | 49.0% | 37.0% | 29.0% | 32.5% |
| Knight 30 | 60.0% | 49.0% | 39.5% | 49.0% |
| Master 50 | 66.0% | 58.5% | 44.0% | 52.5% |

No rule change is needed.

## Runtimes

| Run | Time |
|---|---|
| Pace measurement | 208 s |
| K solve | 52.2 s |
| Spread, before the table change | 2,505.2 s |
| Spread, after the table change | 2,043 s |
| test:all (141 files, 1,372 tests, all pass) | 717.1 s |
| npm test | 22 s, then 73 s under load |
| Year-30 comparison probe | 206 s |
| Crossing probe | 165 s |
