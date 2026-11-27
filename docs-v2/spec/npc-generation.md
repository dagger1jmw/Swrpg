# NPC generation (v1)

Reference NPCs (variance off). Amended by D-43 and D-44, then by D-105 (M3): recomputed with
the phase-pace closed form below (docs-v2/calc/npc-closed-form.mjs, K = 15.18). Older values
are kept for history.
Amended by D-118 / D-119 / D-120 (form plans, fundamentals transfer, K = 11.683): the level in the
main skill is the highest form for form archetypes (the Average plan: Shii-Cho as an Initiate,
Soresu 2 h + Ataru 1 h from Padawan). New values (docs-v2/calc/npc-closed-form.mjs): Padawan 16:
34.2 | Knight 30: 53.3 | Master 45: 67.7 | Elder 70: 86.7 | Obi-Wan check 79.6 | Anakin check 79.7
| trooper sergeant 49.8 (blaster) | Sith warrior 74.8. Test 2 (highest form vs the day loop):
5 y 0.0 | 10 y 0.0 | 30 y +0.6 | 60 y -1.2.
Amended by D-133 (M4): the calc now applies the centered state (x1.05 after 30+ minutes of
meditation, as the game does) and the phase paces were re-measured at K = 11.683. New values:
Padawan 16: 34.2 | Knight 30: 53.6 | Master 45: 68.4 | Elder 70: 87.8 | Obi-Wan check 80.2 | Anakin
check 79.7 | trooper sergeant 50.3 (blaster) | Sith warrior 75.5. Test 2 is now checked against the
src routine day loop (tests/lifetime/average.test.ts).

Amended by D-497 (Jared): an NPC's training day falls from about 50 (data/npcHours.ts: Human-equivalent 50 full, 60 half,
70 a quarter, 80 on 15%; invented), so past 50 the values here are the full day's. An average Guardian Master of 72: best
form 86, Willpower 100 (were 94 and 109). The player's hours are unchanged.
Amended by D-500 (Jared): the Willpower training of an NPC without a sheet stops once it has trained as many real years as
a Human of its path has by 50 (a Jedi 46, a Sith 42, a soldier 33), whatever the species, on the falling day of D-497 until
then. A Sith Inquisitor without a sheet trains Willpower at 1.4 times the path's measured pace (invented).
Amended by D-499 (Jared; the stop is D-500's now): the Willpower training of an NPC without a sheet stops at Human-equivalent 50; an average
Guardian Master has 90 from then on (was 100 at 72). The line under a canon sheet's Willpower is as before.
Amended by D-498 (Jared): its natural Willpower grows on the same schedule past 50 (the natural curve is nearly flat by
then: at most 0.3 of a level of the total).

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
Amended by D-461 (Jared): a career that starts before 15 (CAREER_YOUTH_TO; the training
budget reaches its adult hours at 15) has two phases: a youth pace from its start to 15, then
its adult pace, both measured on the loop (archetype `youthPaces`; the Mandalorian, start 8,
and the warrior and the Yuuzhan Vong warrior, start 14). The Mandalorian's single pace missed
its loop by up to 2.96 levels over its life; with the youth phase, by at most 1.14. Sith
acolytes will use it too (later).

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

### 1a. The Order's Tactics (m8-audit A2, D-526)

The measured Jedi and Sith paces have no Tactics row, so a generated Jedi Master had Tactics 0 and could teach only the basic tactics (m8-fixes B3). A closed-form row on top, no hours moved (the D-191 pattern; `ORDER_TACTICS_PACE`, data/archetypes.ts; invented, tuned on the generator): 0.22 a year in the Padawan (apprentice) phase, 0.42 in the Knight (Lord) phase, none for initiates and acolytes; a war year served counts at 1.4 (it replaces the general war term, 0.3 x the pace now, for this row). Medians of 21 generated NPCs (reports/m8-audit.md): a Knight at 30 Tactics 20 in peace, 50 in the Great War (14 war years); a Master at 50 35 in peace, 67 in the war. A sheet that gives Tactics keeps it; canon lines without one take the row.

**War years (opt-2 A1, A2; D-535).** One dated war list (`src/data/wars.ts`, D-438), read by the generator, the traits, the economy and the ranks: the Great Hyperspace War, the Great Sith War, the Mandalorian Wars, the Jedi Civil War, the Great Galactic War, the Galactic War, the New Sith Wars, the Clone Wars, the Galactic Civil War, the Yuuzhan Vong War, the Second Galactic Civil War and the Sith-Imperial War, each with the factions that fought it (reports/opt-2.md lists them for Jared's check). A combatant counts the overlap of its service years with its faction's wars, times its archetype's share (`WAR_YEAR_SHARE`): Jedi Guardians and Sentinels every war year, Consulars half (Jared); Sith Warriors, soldiers, Mandalorians, warriors, pilots, gunners and officers every year, Inquisitors, agents, bounty hunters and smugglers half, everyone else none (a proposal). Scholars, archivists and healers count none: no posting state exists for an NPC yet. A Clone Wars Jedi General now has war years (2 by 20 BBY, 3 by 19). The veteran age is one constant (`WAR_SERVICE_FROM_AGE`, 14).

**Hand-set Tactics (opt-2 A3; Jared, invented values):** Revan 95 (his fixed sheet), Darth Marr 90 (from 3,661, the Dark Council), Satele Shan 88 (from 3,651, Grand Master), Darth Malgus 88 (from 3,660, the Rim Campaign), Meetra Surik 70 (at 3,960, Malachor V), Orgus Din 65 (from 3,675, a reading), Tol Braga 60 and Kao Cen Darach 60 (on their sheets). Kept as written (`COMMAND_FOCUS`, sheetScale.ts), not drawn to the standing's band.

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
  Amended by D-118 / D-119: lightsaber forms are a pool. `formPaces` gives the pace of all form XP
  per phase and source (Initiate: the Order Shii-Cho block and fill; Padawan: the master session,
  the solo hour and fill; Knight+: fill). Each form's pace is the sources shared out by the form plan
  (the master session to the plan's forms by hours, largest first, for 2 h; the solo hour to the
  next 1 h; fill by plan share), and a form's first phase starts it at 0.75 x the highest form's XP
  then (progression-numbers sec 7a). R is now defined as K * 41^1.75 / A_ref (it was measured from
  the Average), so pace and level agree exactly. Jedi Guardian (K = 11.683): forms Initiate order
  1.091, fill 0.007 | Padawan master 1.203, solo 0.318, fill 0.012 | Knight+ fill 1.543.
  Amended by D-459 (the Jedi Initiate lightsaber curriculum): a Jedi's Initiate form pace runs from
  the saber gate age (6, the Average's) and is shared out by the curriculum: Form I alone to 10, then
  Form I 0.5 and Forms II-VI 0.1 each (Form V's 0.1 split between Shien and Djem So); each survey form
  starts at 10 with the fundamentals transfer, in rotation order (Niman last). The pace is measured
  over those effective years. Sith acolytes keep every Initiate form hour on Form I.
  Amended by D-460: the gate age 5; Form I 0.75 and Forms II-VI 0.05 each in the survey; at the
  Padawan start the plan's main form starts at max(its XP, 0.75 x Form I's XP) (the specialty
  transfer).
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

  D-513 (m8-skills; skills-m8.md §7): nine archetypes added (officer, naval officer, the analyst and field-agent intelligence
  lines, senator or politician, scholar, starfighter pilot, ship gunner, engineer), their paces measured on the day loop; the
  soldier and smuggler take Gunnery and Repair shares; an archetype may name the activity its fill trains a skill with.
  Generated by role: officer 70% officer / 30% naval officer; pilot 70% starfighter pilot / 30% smuggler; politician and scholar
  their own; official 60% civilian / 25% analyst / 15% field agent.
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
  They use the simplified health rule (out on a moderate wound, or when Spent, D-157).
  Amended by D-158: each minion kind has a coordination value (numbers bonus = +1 per extra attacker x
  coordination, rounded down, max +3: B1 droids, militia, thugs 0; line troopers 0.5; elite squads and
  Mandalorians 1.0), a Vitality multiplier, and its weapon and armor; Mandalorians roll beskar by era.
  Amended by D-161: a minion kind may carry an accuracy modifier on its attack rolls: B1 battle droids -3
  (Legends: notoriously poor shots), elite troopers +0.5; amended by D-169: militia -1 (poorly
  trained), Mandalorians +0.5 (elite marksmen).

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
