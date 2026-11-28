# m9-tune3: fighting tired, the remaining war paces, data fixes (2026-11-27/28)

Jared's review of reports/m9-tune2.md (27 Nov, about 10 p.m.). Decisions D-574 to D-579. Specs: combat-xp.md (section 1a), missions.md (sections 6, 6a, 12), traits.md.

**Every number not from lore or Jared is invented.** Section H lists them all.

## Summary

- **Fighting tired now rewards keeping form (item 1).** All four targets are met (section A):

  | Target | Before | After |
  | --- | --- | --- |
  | a. Good-form exchange at capacity vs rested | x1.25 | **x1.9**, still rising (x2.6 at twice capacity, x2.77 at the hard limit) |
  | b. Live fight, moderate strain, pushing, vs rested fight | 0.98x | **1.35x** (Dying 56.8% against 42.6%) |
  | c. Tired spar pushing / not pushing, vs rested spar | 0.65x / 0.51x | **1.18x** / **0.61x** (minor injuries 8.0% against 1.3%) |
  | d. Lifetime runs and missions-off curve | | Jedi and Sith Warrior within 0.2 level; missions off within 0.03; the soldier +0.3 before its war (section C) |

  The levers were the curve's shape, a stricter plain threshold (16, was 14), and a push threshold that falls faster with Willpower (one step per 12.5, was 25). Push's strain cost stays x2.
- **The Sith Inquisitor has its own front pace, W 2.4 (item 2).** It lands 58.4 / 69.6 at 35 / 41 against its target of 58.8 / 69.6. The Warrior keeps the Guardian's W, as ruled.
- **The soldier's war now counts (item 3).** The NPC generator does give non-Force careers war years, so the front pace now covers a career's weapon skills (Blaster, Melee, Gunnery). Soldier W 1.4: Blaster 60.8 at 41 against the target 60.7.
  - It has only 2 war years by 41 because of the harness calendar: every life starts at its start age in 1,032 BBY, and the soldier starts at 17. So it is 39 when the war begins (1,010 BBY), and its 25-year life ends at 42.
- **Luke's gate (item 4)** uses the ruled tolerance and passes.
  - The first reading of it was wrong and failed Strength, which peaked at 53. That reading is corrected (section D).
- **Data fixes (item 5):**
  - Nineteen shared fronts now name each side's own base, not just the four the report listed.
  - The three Sith-Empire lists are now one: SITH_POWERS. Four differences were resolved; one is flagged for you (Revan's Sith; section E).
- **Recorded as ruled (item 6):** the base 0.16, Anakin's fight counts, the withdrawal rule.

## A. Fighting tired (item 1): the C3 table before and after

Measured as in m9-tune2 C3: tests/measure/tiredFight.measure.ts, 1,000 runs per case, same fighter and seeds, M 1.0.
- The fighter is a Knight with Soresu 60, Willpower 50 and Endurance 50.
- The live fight is a lethal duel against a same-level Sith duelist.
- The spar is a training-saber session with a peer.
- Two cases are new: moderate strain while pushing, live and spar. The targets are measured on them.
- Injuries, exchanges and collapses are the same before and after: the retune changes XP, not the fight.

| Case | Form XP before | **Form XP after** | x rested (after) | Willpower | Endurance before / after | Exchanges | Injury (worst): none / minor / severe / critical / mortal |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Live, at rest | 19.32 | **19.79** | 1.00 | 0.14 | 0 / 0 | 37.8 | 27.0 / 0 / 28.6 / 1.8 / 42.6% |
| Live, moderate (strain 1.0) | 18.61 | **21.73** | 1.10 | 1.01 | 0 / 0 | 33.3 | 17.3 / 0.4 / 26.4 / 2.7 / 53.2% |
| **Live, moderate, pushing** (new) | 18.85 | **26.78** | **1.35** | 0.95 | 0.72 / 0.80 | 31.6 | 14.1 / 0.2 / 26.7 / 2.2 / 56.8% (0.4% collapse) |
| Live, near the hard limit (3.8) | 6.62 | **7.12** | 0.36 | 0.38 | 0 / 0 | 12.4 | 26.9 / 0.1 / 32.9 / 0 / 40.1% (47.6% collapse) |
| Live, pushing from rest | 20.26 | **24.52** | 1.24 | 0.40 | 0.84 / 0.93 | 36.9 | 26.7 / 0 / 25.2 / 2.1 / 46.0% |
| Spar, at rest | 2.55 | **2.52** | 1.00 | 0 | 0 / 0 | 34 | 98.7 / 1.3% |
| Spar, moderate | 1.30 | **1.53** | **0.61** | 1.01 | 0 / 0 | 34 | 92.3 / 7.7% |
| **Spar, moderate, pushing** (new) | 1.66 | **2.98** | **1.18** | 1.01 | 0.76 / 0.85 | 34 | 92.0 / 8.0% |
| Spar, near the hard limit | 1.27 | **1.29** | 0.51 | 0.51 | 0 / 0 | 17 | 84.3 / 15.7% (100% collapse) |
| Spar, pushing from rest | 2.44 | **2.58** | 1.02 | 0.07 | 0.76 / 0.85 | 34 | 97.2 / 2.8% |

Nobody died outright in any case. The lethal risk is the Dying state, and whoever finds the character decides it.

### A1. The new numbers

| | Before (m9-tune2) | After |
| --- | --- | --- |
| Good-form factor at strain s (capped at the hard limit 4.0) | 1 + s / 4 (linear) | **1 + 1.8 s³ / (1 + s³)** |
| ... at s = 0.3 / 1 / 2 / 4 | 1.08 / 1.25 / 1.5 / 2.0 | 1.05 / **1.90** / 2.60 / 2.77 |
| Good-form threshold (natural d20) | 14 | **16** |
| Pushing: the threshold | 14 - Willpower / 25 (floor 10) | **16 - Willpower / 12.5** (floor 10) |
| ... a Willpower-50 Knight: share of exchanges in good form, plain / pushing | 35% / 45% | 25% / 45% |
| Push's strain per exchange | x2 | x2 (unchanged) |

### A2. How the tuning went (1,000 runs per case per candidate)

Every candidate used the same smooth curve: flat near rest, so rested fights barely move, and about x2 at capacity.

| Candidate | Live mod. push | Spar mod. push | Spar mod. (no push) |
| --- | --- | --- | --- |
| Curve gain 2, thresholds 14 / -W/25 | 1.31x | 1.13x | 0.84x (not "well below") |
| Gain 2, 14 / -W/12.5 | 1.43x | 1.36x | 0.84x |
| Gain 2, 16 / -W/16.7 | 1.28x | 1.02x | 0.64x |
| Gain 2, 16 / -W/12.5 | 1.40x | 1.25x | 0.64x |
| Gain 2, 16 / -W/16.7, push strain x3 | 1.22x | 1.06x | 0.64x |
| Gain 1.8, 16 / -W/12.5, push strain x2.5 | 1.30x | 1.21x | 0.61x |
| **Gain 1.8, 16 / -W/12.5, push strain x2 (chosen)** | **1.35x** | **1.18x** | **0.61x** |

- **The stricter plain threshold is what makes sloppy tired sparring pay little.** In a spar, a low roll past capacity pays e = 0.1. So the spar without pushing is mostly decided by how often form holds.
- **A higher strain cost for pushing hurts the live gain.** It shortens the fight more than it raises the factor.

### A3. Readings

- **Pushing while tired is now the best way to grow, and the price is visible.**
  - **Live:** 1.35x the rested fight's form XP, with Dying 56.8% against 42.6% and a fight 6 exchanges shorter.
  - **Spar:** 1.18x a rested spar. Minor injuries rise from 1.3% to 8.0%, and the session ends past capacity: burnout over a day.
- **Tired without pushing:**
  - Live: 1.10x. Tired good form pays, but holds on only 25% of exchanges.
  - Spar: 0.61x (sloppy form).
- **Pushing from rest:** 1.24x in a duel. Doubled strain carries a 37-exchange fight to about capacity. Spars from rest barely change (1.02x), because strain stays low.
- **The rested live fight rose 2.4%** (19.32 -> 19.79). Strain builds inside a long fight (about 0.6 by its end), and the curve's flat start keeps the rise small. This is the part that touches the lifetimes (section C).

## B. The front pace (items 2 and 3)

### B1. The Sith Inquisitor (item 2)

Its own W, tuned on the 20 seeds (missions on) to its closed form with war years (58.8 at 35, 69.6 at 41):

| W | At 35 | At 41 |
| --- | --- | --- |
| 1.9 (m9-tune2, the Consular's) | 56.3 | 65.8 |
| 2.3 (your estimate) | 58.15 | 69.53 |
| 2.35 | 58.13 | 69.24 |
| 2.45 | 58.72 | 70.34 |
| 2.6 | 59.50 | 71.36 |
| **2.4 (chosen; the final run)** | **58.37** | **69.56** (range 67.7-70.7) |

- **Why 2.4:** the two ages pull slightly apart (2.46 for 35, 2.35 for 41, on a straight-line fit through the four rounds). A least-squares fit over both gave 2.39.
- **Noise:** between neighbouring W values it is about ±0.3 level (2.35 came out under 2.3).
- **The Sith Warrior** keeps 2.75 (the Guardian's): 59.3 / 66.0 against 59.5 / 66.9. That is 0.9 under at 41, accepted.

### B2. The soldier (item 3)

- **Does the NPC generator give non-Force careers war years? Yes.**
  - `warYearsFor` counts every combatant's service years inside its faction's wars, times WAR_YEAR_SHARE: soldiers, Mandalorians, warriors, pilots and officers 1; agents, bounty hunters and smugglers 0.5.
  - The closed form's war term covers every skill row, Blaster included.
  - So the front pace now covers a non-Force career's weapon skills: `FRONT_PACE.careerSkills` (Blaster, Melee, Gunnery).
  - `frontPaced(skill, path)` reads the path. The Jedi and Sith keep the forms, Force skills and Force Knowledge. A Jedi's Blaster is not paced.
- **Soldier W, tuned on the 20 seeds** to its closed form with war years (60.7 at 41):

  | W | Blaster at 41 |
  | --- | --- |
  | 1 | 60.07 |
  | **1.4 (chosen; the final run)** | **60.77** (59.9-61.6) |
  | 2.0 | 61.67 |

- **War years by 41: 2** (posted 673 days on average). The cause is the harness calendar, not the soldier:
  - Every lifetime life starts at its start age in 1,032 BBY (`TEST_YEAR`).
  - The soldier starts at 17, so it is 39 when the Light and Darkness War begins (1,010 BBY).
  - Its 25-year life ends at 42 (1,007 BBY), and "41" is read at the end of its 41st year.
  - The Jedi start at 4, so they are 26 at the war's start: 10 war years.
  - A soldier life that met its war earlier would show a bigger effect from the same W.
- **Other career archetypes** (Mandalorian, pilot, officer...) have W 1. They have no lifetime life to tune on.

## C. The life-gap tables (20 seeds, all six lives)

Main specialty, means at 25 / 30 / 35 / 41.
- **m9-tune2:** that milestone's "after".
- **after:** this milestone's final code.

| Life (main) | off: m9-tune2 | off: after | on: m9-tune2 | **on: after** (range at 41) | Target at 35 / 41 |
| --- | --- | --- | --- | --- | --- |
| Guardian | 49.2 / 55.4 / 61.2 / 67.6 | 49.2 / 55.4 / 61.2 / 67.6 | 49.4 / 57.7 / 64.3 / 70.5 | 49.5 / 57.6 / **64.4 / 70.7** (68.9-72.9) | 64.3 / 70.6 |
| Consular | 18.0 / 35.5 / 48.6 / 61.6 | 18.0 / 35.6 / 48.6 / 61.6 | 17.7 / 37.6 / 51.8 / 64.9 | 17.7 / 37.6 / **51.8 / 64.9** (63.2-66.8) | 51.6 / 64.6 |
| Sentinel | 48.5 / 54.4 / 59.7 / 65.9 | 48.5 / 54.4 / 59.7 / 65.9 | 48.4 / 56.3 / 62.9 / 68.7 | 48.4 / 56.5 / **62.9 / 68.8** (67.4-69.8) | 62.7 / 68.7 |
| Sith Warrior | 46.1 / 52.1 / 57.5 / 63.9 | 46.1 / 52.1 / 57.5 / 63.9 | 46.4 / 52.3 / 59.4 / 65.9 | 46.5 / 52.4 / **59.3 / 66.0** (64.7-67.9) | 59.5 / 66.9 |
| Sith Inquisitor | 36.4 / 48.0 / 57.4 / 67.6 | 36.4 / 48.0 / 57.4 / 67.6 | 35.1 / 46.4 / 56.3 / 65.8 | 35.1 / 46.5 / **58.4 / 69.6** (67.7-70.7) | 58.8 / 69.6 |
| soldier (Blaster) | 31.9 / 42.1 / 50.4 / 59.0 | 31.9 / 42.1 / 50.4 / 59.0 | 33.0 / 43.5 / 51.8 / 59.7 | 33.3 / 43.9 / **52.1 / 60.8** (59.9-61.6) | 51.1 / 60.7 |

- **Missions off:** within 0.03 level of m9-tune2 at every age and life. The harness never pushes, and rested fights rose only 2.4%.
- **Missions on, Jedi and Sith Warrior:** within 0.2 level at every age (target d).
- **The soldier before its war:** +0.34 / +0.36 / +0.29 at 25 / 30 / 35.
  - That is right at "about 0.3". It fights about 1,085 duty runs a life, 27% of them past 10 exchanges, so strain builds in its fights more than in anyone else's.
  - At 35 it is 1.0 above its closed form (51.1); it was 0.7 above before.
  - Not corrected: the cause is item 1's intended rule, and the only lever would be the soldier's own fights.
- **Combat shares (section 5 of combat-xp.md) stay in range:**

  | Run | Anakin (25-35%) | Obi-Wan (20-30%) |
  | --- | --- | --- |
  | Fixed seed (test:all) | 32.8 / 30.2 / 31.5, mean **31.5%** | 26.3 / 32.0 / 28.9, mean **29.1%** |
  | 20 seeds (`SPREAD_ONLY=anakin,obiwan npm run spread`) | median **30.6%** (28.7-34.0%), 20 of 20 in the gate | median **27.1%** (24.6-31.5%), 18 of 20 |
  | m9-tune2, 20 seeds | median 29.8% (27.8-32.5%), 20 of 20 | median 26.8% (23.7-30.3%), 19 of 20 |

  - Peace stays under 10% (the Average and Obi-Wan peace tests pass).
  - Obi-Wan's fixed seed is near the top of its window (29.1%).
- **Mission counts are as before** (e.g. the Guardian: 68 cut short, 1,680 days wounded; the Inquisitor 69, 1,334; the soldier 67, 500). `npm run missions` matches m9-tune2 exactly in every cell (section G).

## D. Luke's body-peak gate (item 4, ruled)

- **Found in test:all, and fixed:** I first coded the tolerance as "the level at 68 within 0.05 of the life's peak". That failed Strength, which peaked at 53 and falls from there (41.93 at 68). The old check had passed it.
- **What the gate now checks:** "peaked by 68 and falling" means no level after 68 is more than 0.05 above the level at 68 (`LUKE_AGES.peakTolerance`). The 5%-at-75 slow-loss part is unchanged.
- **Luke's late body levels** (fixed seed):

  | Stat | At 66 | At 67 | At 68 | At 69 | Highest after 68 | Passes |
  | --- | --- | --- | --- | --- | --- | --- |
  | Strength | 42.02 | 41.98 | 41.93 | 41.88 | 41.88 (69) | yes |
  | Agility | 42.28 | 42.26 | 42.23 | 42.19 | 42.19 (69) | yes |
  | Endurance | 43.289 | 43.293 | 43.281 | 43.269 | **43.326 (76)** | yes, by 0.005 |

  - Endurance passes with little room: it rises again from 71 to 76.
  - If the Endurance curve moves by another hundredth, the gate will fail again. The 20-seed spread is the sturdier measure (m9-tune2's second proposal).

## E. Data fixes (item 5)

### E1. Each side's own base

- **Built:** `FrontDef.sideBases` gives a side's base where opposed sides share a front. `base` stays the Republic side's, and `frontBaseFor` is what the posting reads.
- **More fronts than the four reported:** nineteen named one side's base. All base names are invented:

  | Front | Opposing side's base |
  | --- | --- |
  | the war against the Krath | the Krath's stronghold in the Empress Teta system |
  | the defence of Ossus | Exar Kun's fleet over Ossus; the Mandalorians: the Mandalorian fleet over Ossus |
  | the assault on Yavin 4 | Exar Kun's temple on Yavin 4 |
  | the Dantooine front | the Sith fleet over Dantooine |
  | GGW: Balmorra, Hydian Way, Rim, the strike into Imperial space, Rhen Var, Alderaan | the Imperial occupation command, fleet on the Hydian Way (the Mandalorians: the blockade fleet), forward base in the Ord Radama system, defence command on Ziost, landing force on Rhen Var, garrison on Alderaan |
  | Galactic War: Corellia, Ilum, Balmorra, Taris | the Imperial invasion command (the Mandalorians too), base on Ilum, garrison on Balmorra, outpost on Taris |
  | Clone Wars: Geonosis, Ryloth, Outer Rim, Mygeeto, Kashyyyk | the Separatist droid foundries, occupation force, forces on Felucia, defences, landing force |

- **The Yuuzhan Vong War's three fronts keep one base:** the Imperial Remnant fought beside the Alliance.
- **The Light and Darkness War** was already split (m9-tune2).
- A test checks every front with opposed sides.

### E2. One dated list of Sith powers

- **What changed:** devCommands' `SITH_EMPIRE_YEARS` (the dev duelists) and traits' `SITH_EMPIRE_YEARS` (the Imperial-born gate) are deleted.
  - The dev duelists read `sithSideAt`.
  - The trait reads `sithEmpireSpans()`: every sithEmpire row, so Vitiate's hidden Empire counts during Kun's and Revan's wars.
  - Both come from data/wars.ts `SITH_POWERS`.
- **The differences, and how each was resolved:**

  | Years | Dev list | Traits | SITH_POWERS before | Resolved |
  | --- | --- | --- | --- | --- |
  | Revan's Sith, 3,959-3,955 | Empire | (inside 4,980-3,600) | the Sith of the day | **Sith**, following SITH_POWERS and the wars list (the Jedi Civil War is fought by `sith`; the comment there: Revan's empire is not the Emperor's). **Flag for you:** the lore file calls it "the Sith Empire of Darth Revan and Darth Malak" (SW_Characters_07). If you want it as `sithEmpire`, the Jedi Civil War's factions and the Dantooine front's sides change with it. |
  | Vitiate's Empire between its wars (4,989-3,681, 3,627-3,600) | Sith (only 5,000-4,989 and 3,681-3,627 were Empire) | Empire from 4,980 | Empire from the ancient Empire to 3,600 | **Empire**, by SITH_POWERS: it stood, hidden, between its wars. |
  | Before 4,980 (the ancient Empire) | only 5,000-4,989 | not an Empire | Empire | **Empire**. A character born in the ancient Empire can now be Imperial-born. |
  | Palpatine's Empire, 19 BBY-4 ABY | Sith | not an Empire | Empire | **Empire**. Dev duelists of that era are Imperial, and Imperial-born opens there. |
  | Krayt's Empire | 130-140 ABY Empire | not an Empire | the One Sith only (`sith`) | **A new row, 130-138 ABY.** SW_Characters_18_LegacyEra: Krayt seizes the throne from Roan Fel in 130; Cade Skywalker kills him for good in 138. |

- **What a player can see:** the Imperial-born trait now opens in the ancient Empire, Palpatine's Empire and Krayt's, besides Vitiate's.
  - The trait reads "Imperials react better / Republic suspicion", which fits each of them.
  - If you meant only Vitiate's Empire, that would need a narrower list, not this one.

## F. Recorded as ruled (item 6)

- The combat XP base 0.16.
- The Anakin profile's Clone Wars fight counts (elite squads 16 a year, B1 groups 100).
- The duty player's withdrawal rule.

All logged as D-579.

## G. Checks

| Run | Result | Time |
| --- | --- | --- |
| npm test | 2,266 of 2,266, 186 files | 43 s |
| typecheck | clean | 13 s (143 s under load, beside the tuning runs) |
| lint | clean | 12 s (73 s under load) |
| test:all (lifetime included) | 2,325 of 2,328, three failures: <br>- **Luke's gate, my first reading of the tolerance** (fixed, section D). <br>- Two 5 s timeouts under load (formTransfer, the m8 holds test), the same two as in m9-tune2. <br>All three files pass alone (37 of 37, 33 s). | 1,823 s (beside the missions-on lifegap) |
| Anakin, Obi-Wan, Average lifetime files (for the shares) | 16 of 16 | 118 s |
| Spread, 20 seeds, Anakin and Obi-Wan | as in C | 1,044 s (beside npm run missions) |
| lifegap, missions off, final (120 lives) | as in C | 2,741 s (beside the missions-on run) |
| lifegap, missions on, final (120 lives) | as in C | 3,658 s (beside missions off, then test:all) |
| Tuning: Inquisitor W 2.3 / 2.6 / soldier W 2.0 (20 seeds each) | as in B | 473 / 470 / 389 s (side by side) |
| Tuning: Inquisitor 2.35 / soldier W 1 / 1.4 | as in B | 433 / 379 / 349 s (side by side) |
| Tuning: Inquisitor 2.45 | as in B | 359 s (beside missions off) |
| npm run missions (20 seeds x 15 cells) | 300 years; identical to m9-tune2 in every cell (pooled failure: Knight 13.3% peace / 20.6% total war; Consular Knight 11.9 / 19.9%; Master 7.2 / 7.6%; Padawan 15.6 / 19.1%; Powerful Knight 8.6 / 9.0%) | 537 s (beside the spread) |
| tests/measure/tiredFight.measure.ts (before, then after) | as in A | 5 s, 7 s |
| Tuning sweeps of the tired-fight candidates (4 parallel, 3 rounds) | as in A2 | about 9 s a round |

- **The spread's "Average Y_avg gate FAIL"** comes from `SPREAD_ONLY` leaving out the Average: it reports 0 points. It is not a calibration failure.
- **Tests added or changed:**
  - tests/m9/tune3.test.ts (6): the good-form curve and thresholds, the front pace by archetype and path (the soldier's Blaster paced, its Tactics and a Jedi's Blaster not), each side's base on every opposed front, one Sith list (the dev duelists equal `sithSideAt` from 6,000 BBY to 200 ABY; the Empire spans).
  - tests/m9/tune2.test.ts: the 3c and 3e expectations for the new curve and thresholds.
  - tests/turn/minorFixes.test.ts: the dev duelist's faction by the one list (Revan's era now Sith; 3,620 BBY, 4,500 BBY and 10 BBY Empire; 139 ABY Sith).
  - tests/lifetime/checks.ts and luke.test.ts: the tolerance.
  - tests/measure/tiredFight.measure.ts: the two pushing-at-moderate-strain cases.
  - tests/lifegap/lifegap.ts: `FRONT_PACE_W` (a JSON map), to run a candidate W without editing the config. Tuning only; recorded in the run's env.

## Not done, and found for you

- **Revan's Sith as an Empire?** The lore file says "the Sith Empire of Darth Revan". The code keeps `sith`, per the wars list's reading (E2). Your call.
- **The Imperial-born trait now opens in three more Empires** (ancient, Palpatine's, Krayt's), as a consequence of the one list (E2).
- **The soldier's pre-war ages rose about 0.3** from item 1, right at the limit of target d (C).
- **Luke's Endurance passes the gate by 0.005 level** (D).
- **Obi-Wan's fixed-seed war share is 29.1%,** near its 30% ceiling. The 20-seed median is 27.1%, with 18 of 20 seeds in the gate (C).
- **Other careers' W:** Mandalorians, pilots, officers and the rest are paced on their weapon skills only if given a W. They have 1 now, with no lifetime life to tune on.
- **Push through in a browser:** still checked in code only. This session had no browser.

## H. Every invented number

| Number | Where |
| --- | --- |
| The good-form curve 1 + 1.8 s³ / (1 + s³) (gain 1.8, half-point 1, steepness 3) | `GOOD_FORM` (progression.config) |
| The good-form threshold 16; pushing 16 - Willpower / 12.5, never below 10 | `GOOD_FORM` |
| Push's strain x2 (kept) | `PUSH_THROUGH` (combat.config) |
| The Sith Inquisitor's W 2.4; the soldier's W 1.4 | `FRONT_PACE.byArchetype` |
| The career weapon skills the front pace covers: Blaster, Melee, Gunnery | `FRONT_PACE.careerSkills` |
| Luke's peak tolerance 0.05 (Jared's number; recorded here as the constant) | `LUKE_AGES.peakTolerance` (tests/lifetime/checks.ts) |
| Every side's base name in E1 | `FRONTS[].sideBases` (missions.config) |
| The tired-fight measurement's two new cases (strain 1.0 while pushing, live and spar) | tests/measure/tiredFight.measure.ts |

## m9-tune3b: two rulings and the full check (Jared, 28 Nov 2026)

Decisions D-580 to D-582. Section E2's flags are settled:

1. **Revan's Sith stay `sith`** (D-580, ruled).
   - A power of their own: Vitiate's Empire was hidden then.
   - The SITH_POWERS row is now named "Revan's Sith Empire (Revan's and Malak's Sith)" for the narrator.
   - Its faction id and the wars list are unchanged.
2. **Imperial-born opens only for a birth in Vitiate's Sith Empire** (D-581; amends D-578).
   - The trait has its own dated list again: traits.ts `IMPERIAL_BORN_YEARS`, 4,980 BBY (the founding at Kaas City) to 3,600 BBY (the end, invented). It is read by the birth year.
   - A birth in the ancient Sith Empire, the Brotherhood, Palpatine's Empire or Krayt's Empire does not open it.
   - `sithEmpireSpans`, which only the trait read, is removed.
   - **Tested** (tests/m9/tune3.test.ts):
     - Open at 4,980, 3,700, 3,681 and 3,600 BBY, for a Sith or a character marked Imperial-born.
     - Closed for a non-Imperial career.
     - Closed for births in 5,100 and 4,990 BBY (before Kaas City), 3,599 BBY, 1,020 BBY (the Brotherhood), 10 BBY and 135 ABY.
   - **One difference from before m9-tune3:** the gate now reads the birth year ("born in"). It used to read the birth-to-start window overlapping the same years, which opened it for someone born just before 4,980 who started inside.
3. **The full test:all, after the Luke gate fix:** green, 2,329 of 2,329.
   - **Luke's Endurance passes with only 0.005 level to spare:** 43.281 at 68, and its highest after 68 is 43.326 at 76, against the 0.05 tolerance. A shift of a hundredth in his late Endurance will fail the gate again.
4. **Recorded as accepted** (D-582): the soldier's drift of about 0.3 level before its war.

| Run | Result | Time |
| --- | --- | --- |
| npm test | 2,267 of 2,267, 186 files | 44 s |
| typecheck | clean | 13 s |
| lint | clean | 11 s |
| test:all (lifetime included; run alone) | 2,329 of 2,329, 204 files | 1,148 s (19.1 min) |
