# NPC generation (v1)

Reference NPCs (variance off). Amended by D-43 and D-44, then by D-105 (M3): recomputed with
the phase-pace closed form below (docs-v2/calc/npc-closed-form.mjs, K = 15.18). Older values
are kept for history.

| NPC                                                                   | Old | D-43 | Level in main skill |
| --------------------------------------------------------------------- | --- | ---- | ------------------- |
| Padawan, age 16 (trained since 4)                                     | 35  | 35.3 | 34.2                |
| Average Jedi Knight, age 30                                           | 54  | 52.8 | 53.9                |
| Average Jedi Master, age 45                                           | 70  | 66.9 | 69.1                |
| Elder Master, age 70                                                  | 92  | 85.5 | 89.0                |
| Obi-Wan check: x1.48, age 39 (start 3, Padawan 13, Knight 25)         | 81.5 | 78.6 | 80.5               |
| Anakin check: x3.89 (each phase capped at 4.0), 13.5 years (start 9, Padawan 9, Knight 20) | 81 | 78.4 | 79.7 |
| Republic trooper sergeant, 35, start 17, 5 war years                  | 46  | 42.8 | 45.3 (blaster)      |
| Sith warrior, 35, start 8, prodigy, angry (x1.15), 10 war years       | 80  | 76.1 | 79.4                |

## 1. Closed-form skill level
Amended by D-43 (row 9): the age learning factor is included as an exact piecewise-linear
integral, so the closed form follows the same age bands as the day loop.
Amended by D-105 (M3, with D-67 decided): every skill, the main one included, uses a measured
pace per rank phase (Initiate / Padawan / Knight+ for the Jedi and Sith paths; one phase for
careers and outsiders), because the day loop's main-skill rate differs by phase (Initiate 2 h of
forms, Padawan 3 h+, Knight+ half of a full budget). With the D-43 form and D-67 decided, the
day loop and the closed form differed by +2.3 at 5 years and -3.5 at 60 years.

  level(skill) = 41 * (A_eff / A_ref) ^ (1/1.75)
    A_eff = sum over phases of pace(skill, phase) * A(row, phase start, phase end), clipped
            to [start age, current age], + 0.3 * war years * pace(skill, current phase)
            * a(row, current age)
    pace(skill, phase) = archetype phase pace (section 3) * talent * state modifiers *
            variance, each phase capped at 4.0
    Natural baseline (progression-numbers sec 11a) on top: level = (L^1.75 + N(h)^1.75)^(1/1.75)
  Check against the day-by-day Average profile (test 2, computed by npc-closed-form.mjs):
    5 years 20.1 vs 19.8 (+0.3) | 10 years 30.4 vs 30.3 (+0.1) | 30 years 58.3 vs 58.2 (+0.1) |
    60 years 84.6 vs 84.9 (-0.3).
  D-43 form (history):
  level(skill) = 41 * (pace * A_eff / A_ref) ^ (1/1.75)
    A_eff = A(row, start age, current age) + 0.3 * war years * a(row, current age)
    A(row, x0, x1) = integral from x0 to x1 of a(row, age) d(age)
      a(row, age) = the progression-numbers §16 age factor for the skill's category
      (piecewise linear between the anchors at 6, 10, 15, 24, 40, 60; flat outside), so the
      integral is exact (trapezoids between breakpoints)
    A_ref = A(technique, 4, 20) = 17.98 age-weighted years
      (the Average profile reaches 41 in 16 years, starting at 4)
  The war term stands in for combat XP (recalibrate if combat-xp.md section 5 changes).
  pace = archetype skill pace (section 3) * talent multiplier * state modifiers * variance,
    capped at 4.0 (the same limit as the player)
  variance = exp(N(0, 0.12)), seeded per NPC (about +/-12% per skill)
  Check against the day-by-day Average profile (test 2, computed): 10 years 32.1 vs 30.5
    (+1.7) | 30 years 56.9 vs 56.6 (+0.2) | 60 years 81.4 vs 83.0 (-1.6). The old form
    without the age factor gave 87.3 at 60 years (+4.3), which failed test 2.
Physical stats use the same formula, then min(level, body cap for age and species) plus the
  Force boost (progression spec section 11).
Skills an NPC stopped training (retired, changed role) keep their level and gain rust
  (progression spec section 13).

## 2. Talent distribution (per domain, rolled once per NPC)
  Force-trained orders (Jedi, Sith): none 70% | gifted (x1.25) 22% | prodigy (x1.5) 7% |
    exceptional (x1.8) 1%
  Everyone else: none 80% | gifted 17% | prodigy 3% | exceptional 0.2%
  Named story NPCs may have talent set by hand.

## 3. Archetypes (shares of one feasible daily budget)
Amended by D-44 (row 10), D-41 and D-51. The old weights were paces relative to the Average
main skill and summed to far more training than a day holds (Jedi Guardian 3.9x, Sentinel
5.2x). They are now shares of one daily budget:
- The daily hours are the path's default routine: the Order requirements for the rank
  (ranks.md §1a, Jedi and Sith paths) as fixed commitments, filled up to the D-25 standard
  training budget (training-routines §2) by these shares. Careers have no Order
  requirements: the whole budget is filled by shares.
- The main specialty (the first skill listed) takes 0.5 of the fill (D-41). The other
  skills share the remaining 0.5 in proportion to the weights in brackets (the old weights,
  "physical w" = w for each of Strength, Agility and Endurance), plus Willpower 0.4 for Jedi
  and Sith and 0.2 for everyone else (D-51).
- Shares sum to 1, so an archetype never needs more hours than the budget: every NPC or
  created-character level is reachable in play with the same routine (test 7).
- Closed-form pace of skill s = share(s) / 0.5 (the Average main share), times talent,
  state and variance. The main specialty has pace 1.0.
- Amended by D-105: the closed-form paces of every archetype, per phase and per skill, are
  measured by running the archetype's own default routine through the day model
  (docs-v2/calc/archetype-paces.mjs; Order requirements with Padawan / apprentice at 12 and
  Knight / Lord at 20.5 for Jedi and Sith, the Sith on the Jedi rows until M7; careers fill the
  whole budget by shares). A pace is the skill's credited XP per age-weighted year of its own
  age row, divided by R, the Average's mean main-form rate over ages 4-20, so A_ref stays
  17.98. Jedi Guardian (K = 15.18):

  | Skill | Initiate | Padawan | Knight+ |
  |---|---|---|---|
  | main form | 0.844 | 1.177 | 1.099 |
  | Force Control | 0.322 | 0.812 | 0.340 |
  | Force Sense | 0.308 | 0.637 | 0.265 |
  | Willpower (direct + fatigue) | 0.728 | 1.158 | 0.874 |
  | Force Knowledge | 0.257 | 0 | 0 |
  | Strength / Agility / Endurance (trained part) | 0.110 / 0.083 / 0.056 | 0.034 / 0.026 / 0.018 | 0.296 / 0.237 / 0.233 |

  The full table for every archetype is the script's output and src/data/archetypes.ts.
  Custom focus (character creation sliders): a change of share Delta moves the skill's pace by
  Delta * 2 * (that archetype's main Knight+ pace) * fill, where fill is the phase's mean fill
  hours (standard budget minus Order hours, never below 0) over the 6 h Knight+ day: 1 for
  Knight+ and careers from 15, about 0.14 for Padawans, 0 for Initiates under 10 (D-105, amended
  by D-115: before, the Order-fixed phases were unchanged, so the sliders did nothing below
  Knight). An approximation; reachability test 7 checks the default shares.
- History (before D-105): the secondary paces before Knight were ratios to the main form
  (skill XP / main-form XP):

  | Skill | Initiate | Padawan |
  |---|---|---|
  | Force Control | 0.39 | 0.72 |
  | Force Sense | 0.37 | 0.60 |
  | Willpower (direct; fatigue Willpower comes on top) | 0.13 | 0.23 |
  | Force Knowledge | 0.20 | 0 |
  | Strength / Agility / Endurance | 0.09 / 0.07 / 0.05 | 0.03 / 0.02 / 0.01 |

  (These ratios and the nominal Knight+ share paces are replaced by the measured table above.)

| Archetype | Main specialty share | Other shares (old weight in brackets) | Old total |
|---|---|---|---|
| Jedi Guardian | main form 0.50 | second form 0.045 (0.3), Force Control 0.091 (0.6), Force Sense 0.076 (0.5), Strength / Agility / Endurance 0.076 each (0.5), Willpower 0.061 (0.4) | 3.9x |
| Jedi Consular | Force Knowledge 0.50 | Meditation 0.098 (0.8), Force Sense 0.098 (0.8), healing (Force Heal (Others)) 0.098 (0.8), main form 0.049 (0.4), Strength / Agility / Endurance 0.037 each (0.3), Willpower 0.049 (0.4) | 4.7x |
| Jedi Sentinel | main form 0.50 | Force Sense 0.082 (0.8), investigation 0.082 (0.8), stealth 0.082 (0.8), Force Control 0.061 (0.6), Strength / Agility / Endurance 0.051 each (0.5), Willpower 0.041 (0.4) | 5.2x |
| Sith Warrior | main form 0.50 (anger x1.15 on aggressive forms) | Force Output 0.133 (0.8), Strength / Agility / Endurance 0.100 each (0.6), Willpower 0.067 (0.4) | 3.6x |
| Sith Inquisitor | Force Output 0.50 | dark abilities 0.188 (0.9), Force Knowledge 0.146 (0.7), main form 0.083 (0.4), Willpower 0.083 (0.4) | 3.0x |
| Republic / Imperial soldier (start age 17) | blaster 0.50 | tactics 0.115 (0.6), Strength / Agility / Endurance 0.115 each (0.6), Willpower 0.038 (0.2) | 3.4x |
| Mandalorian (start age 8) | blaster 0.50 | melee 0.081 (0.6), Strength / Agility / Endurance 0.108 each (0.8), tactics 0.068 (0.5), Willpower 0.027 (0.2) | 4.5x |
| Smuggler / scoundrel | piloting 0.50 | blaster 0.233 (0.7), Charisma 0.200 (0.6), Willpower 0.067 (0.2) | 2.3x |
| Bounty hunter | blaster 0.50 | tracking 0.132 (0.9), melee 0.074 (0.5), Strength / Agility / Endurance 0.088 each (0.6), Willpower 0.029 (0.2) | 4.1x |
| Civilian | profession 0.50 | Strength / Agility / Endurance / Intelligence / Charisma 0.071 each (0.1), Willpower 0.143 (0.2) | 1.1x |

  Start ages: Jedi 2-5 (most from infancy) | Sith academy 8-16 | others as listed.
  Skill ids and categories: spec/skills-and-activities.md.
  Claude Code may add archetypes from the lore; each needs weights and a start age.
  For the player, their actual routine decides the hours; the routine's default template for
  Knight+ uses the same 0.5 main-specialty split (D-41).

## 4. Generation
  Generate lazily, when an NPC first enters a scene or is referenced in a fight; store the
  seed and inputs (species, birth date, start age, archetype, talents, war years), not the
  levels. Levels are recomputed from the current date whenever needed, so NPCs age and grow.
  npcIntroduced from the AI supplies name, species, faction, role and approximate age. Code
  picks the archetype and rolls talents and variance.
  Rank is assigned from age and skills using ranks.md (amended by D-59).

## 5. Canon NPCs
  Hand-set entries in data (from Docs/SWRPG lore/, especially SW_Characters_09_GreatGalacticWar_ColdWar.md
  for 3,661 BBY). Each lists birth year, species, start age, talents, archetype, and either
  explicit levels or overrides.
  Validation: compute the pace each canon NPC's levels imply. Anything above 4.0x, or far
  outside its archetype, must have a written justification in the data (species lifespan,
  ancient technique, unique event) or be flagged as a question for Jared.

## 6. Minions
  Minions (troopers, droids, thugs) get a stat block from archetype and a 1-5 quality grade
  with no per-skill rolls: grade sets years trained (2, 5, 10, 15, 20) at pace 1.0.
  They use the simplified health rule (out on a moderate wound).

## 7. Required tests
 1. Reference table above reproduces within +/-1 level (variance off).
 2. With the same inputs, the closed form matches a day-by-day simulation of the Average
    profile within +/-2 levels at 10, 30 and 60 years (computed with D-105: +0.1, +0.1, -0.3;
    D-43 had +1.7, +0.2, -1.6 before D-67).
 3. No generated NPC exceeds 4.0x pace; canon exceptions carry a justification.
 4. An NPC met again N years later has levels recomputed for the new age (growth, rust,
    body cap).
 5. Talent rolls match section 2 frequencies within 1 point over 100,000 seeded NPCs.
 6. The same seed always produces the same NPC.
 7. Reachability (D-44): every archetype's shares sum to 1, and an NPC built with them is
    reproduced within +/-2 levels in its main specialty by running the same routine
    (Order requirements + budget + shares) through the day loop, so no NPC or created
    character has a level the player could not earn in play.
 8. The age-factor integral is exact: A(technique, 4, 20) = 17.98 and the closed form uses
    the category's age row (D-43).
