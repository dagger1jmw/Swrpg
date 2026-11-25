# Skills and activities (v1)

Decision D-53 (2026-11-16, Fable review row 24). Needed before M3. This is the skill
registry and the activity catalog that progression-numbers.md, npc-generation.md,
training-routines.md, health.md and the routine scheduler read. Data lives in
`src/data/skills.ts` and `src/data/activities.ts`. Sources: `Docs/SW_Activity_Bank_v1.md`
(activities, secondary weights, unlocks) and `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md`
(stats, forms, Force abilities). The bank's "strain bias" multipliers and outcome weights are
legacy-engine mechanics and are replaced by the loads below (Golden Rule 3, D-05).
`docs-v2/calc/activities.mjs` mirrors this file for the calculations.

## 1. Skill categories
Every skill has one category. The category picks its age row (progression-numbers §16), its
rust row (§13) and its body-cap rule (§11).

| Category | Age row (§16) | Rust row (§13) | Body cap |
|---|---|---|---|
| technique | Technique and Force fundamentals | technique / Force (1.0% per 30 d, max 15%, deeper skills slower) | no |
| force | Technique and Force fundamentals | technique / Force | no |
| wisdom | Wisdom skills | technique / Force | no |
| knowledge | Wisdom skills | knowledge (0.25% per 30 d, max 5%) | no |
| physical | Physical training response | physical (after 14 d, 1.0% per 30 d, max 20%) | yes, plus Force boost |
| academic | Academic (1.00 at all ages) | knowledge | no |

## 2. Skills
| Skill | Category | Notes |
|---|---|---|
| Strength, Agility, Endurance | physical | Endurance sets physical fatigue capacity (progression-numbers §3) |
| Willpower | wisdom | sets mental fatigue capacity; trained directly by meditation and Willpower drills and by fatigue (§9, D-51) |
| Charisma | academic | social contests (rolls.md §5) |
| Intelligence | academic | tactics, investigation contests |
| Force Sense | force | perception, precognitive defense |
| Force Control | force | Force capacity (health §2), Force boost (§11) |
| Force Output | force | power-scaled Force attacks |
| Meditation | wisdom | centered state, dark pressure relief |
| Force Knowledge | knowledge | lore, teaching, holocron use |
| Lightsaber forms: Shii-Cho, Makashi, Soresu, Ataru, Shien, Djem So, Niman, Juyo, Vaapad, Tràkata, Jar'Kai, Sokan, Dun Möch, Zero-G Combat, Saberstaff | technique | each form is its own skill; "form group" (progression-numbers §7) = one form skill and its variant (Shien / Djem So, Juyo / Vaapad share E) |
| Force abilities (every entry of force-catalog.md, built from the lore file's Telekinesis, Sensory, Body Enhancement, Mental & Social, Defense, Healing, Light Side, Dark Side, Teleportation & Space/Time, Nature & Environment, Knowledge & Arcane, Sith Alchemy & Forbidden, and Miscellaneous families) | force | each tagged combat / non-combat / both and light / dark / neutral in the catalog; Shatterpoint is shatterpoint perception-only, XP cost x3 |
| "Force body abilities" | force | the Body Enhancement family (Force Strength, Force Endurance, Force Speed, Force Body, ...): the "Force body-ability level" in progression-numbers §11 and health §3 is the highest of these |
| "healing" (Consular archetype) | force | Force Heal (Self), Force Heal (Others), Revitalize: the archetype weight goes to Force Heal (Others) |
| Blaster | technique | ranged combat (rolls.md §4) |
| Melee | technique | non-lightsaber melee and unarmed |
| Piloting | technique | |
| Tracking | technique | |
| Stealth | technique | perception contests (rolls.md §5) |
| Investigation | academic | |
| Tactics | academic | |
| Medicine | academic | stabilizing (health §6), medical care (health §7) |
| Profession:<kind> | technique | civilian archetype (npc-generation §3) |

Unknown skill ids are rejected; there are no aliases to nearby skills (D-07).

## 3. Activity rules
- Each activity declares a load per hour (physical, mental, and Force where it uses the
  Force), a default intensity, the drill ratings it offers, a primary skill and secondary
  weights.
- XP split (progression-numbers §5): 0.75 to the primary skill; 0.25 split among the
  secondaries in proportion to the weights below. Never additive.
- Load categories (progression-numbers §3): saber drill (1.0, 0.4) | physical conditioning
  (1.2, 0.2) | Force drill (0.4, 0.8) plus 0.6 Force load per hour (health §2) | study
  (0.05, 1.0) | meditation (0.05, -0.5).
- Drill ratings: Basic 10, Intermediate 30, Advanced 50, Master 70, Legendary 90
  (progression-numbers §4). An activity offers a rating only when unlocked: Basic always;
  higher ratings need a teacher (or holocron) at or above that rating, or the character's
  own level >= the rating - 10. The scheduler picks the rating per training-routines §3.
- Every activity listed here is on the main curve; new activities need a load, ratings and
  weights before they can be used.

## 4. Activity catalog
Weights are the bank's secondary weights (normalized at use). "All forms" means every form
skill. Unlock is from the bank unless noted.

### Lightsaber forms (saber drill load 1.0 / 0.4)
| Activity | Primary | Secondary weights | Default intensity | Unlock |
|---|---|---|---|---|
| Shii-Cho basics | Shii-Cho | Strength 0.4, Agility 0.3, Endurance 0.2, Force Control 0.15 | standard | always (supervised); solo at Shii-Cho 15 |
| Shii-Cho advanced sequences | Shii-Cho | Strength 0.5, Agility 0.4, Endurance 0.3, Force Control 0.2 | intense | Shii-Cho 21 |
| Makashi basics | Makashi | Agility 0.6, Willpower 0.3, Force Control 0.3, Strength 0.1 | standard | form known |
| Makashi precision footwork | Makashi | Agility 0.7, Willpower 0.4, Force Control 0.3 | standard | Makashi 21 |
| Soresu basics | Soresu | Endurance 0.6, Willpower 0.4, Force Sense 0.3, Force Control 0.25 | standard | form known |
| Soresu deflection drills | Soresu | Endurance 0.5, Force Sense 0.5, Agility 0.3, Willpower 0.3 | standard | Soresu 10 |
| Ataru basics | Ataru | Agility 0.7, Endurance 0.4, Strength 0.3, Force Control 0.3 | intense | form known |
| Ataru acrobatic sequences | Ataru | Agility 0.7, Endurance 0.4, Strength 0.3, Force Control 0.3 | intense | Ataru 21 |
| Shien / Djem So basics | Shien or Djem So | Strength 0.7, Endurance 0.4, Force Control 0.25, Agility 0.2 | intense | form known |
| Niman basics (physical load 0.8, D-121) | Niman | Force Control 0.5, Willpower 0.4, Agility 0.3, Strength 0.2 | standard | form known, or a teacher (D-119) |
| Juyo / Vaapad basics | Juyo or Vaapad | Willpower 0.6, Agility 0.5, Strength 0.4, Force Control 0.3 | intense | form known; not for Initiates |
| Dual saber practice | highest form | second form 0.6, Agility 0.5, Strength 0.3 | standard | two forms known |
| Form combination drills | form A and form B (0.375 each of the 0.75) | Agility 0.4, Force Control 0.3 | standard | both forms 21+ |
| Combat sparring (partner) | form used | Agility 0.5, Endurance 0.5, Strength 0.4, Force Sense 0.3 | intense | always; also gives E (progression-numbers §7) and is ceiling-limited (D-45) |
| Padawan training with master | master's specialty (default main form) | Force Control 0.4, Willpower 0.3 | standard | Padawan; instruction = teacher factor |

A form's basics drill opens when the form is known (level 1+) or a teacher is present (D-119): that
is how a new form is started, and its first session gets the fundamentals transfer
(progression-numbers sec 7a).
Forms with no bank entry (Tràkata, Jar'Kai, Sokan, Dun Möch, Zero-G, Saberstaff) use the
"basics" pattern of their nearest form until M3 data entry: Tràkata and Makashi, Jar'Kai and
Dual saber, Sokan and Ataru, Dun Möch and Makashi (plus Charisma 0.3), Zero-G and Ataru,
Saberstaff and Shii-Cho. Flag any the lore contradicts.

### Force disciplines (Force drill load 0.4 / 0.8 + 0.6 Force)
| Activity | Primary | Secondary weights | Default intensity | Unlock |
|---|---|---|---|---|
| Force Control drill (levitation practice) | Telekinesis, or Force Control if Telekinesis is unknown | Force Control 0.6, Force Sense 0.3, Willpower 0.3 | standard | always |
| Force push / pull drills | Telekinesis (or the sub-ability drilled) | Force Control 0.7, Willpower 0.4, Force Sense 0.2 | standard | Telekinesis 10 |
| Force Sense: passive awareness | Force Sense | Meditation 0.5, Willpower 0.3, Force Control 0.2 | casual | always |
| Force Sense: active scanning | Force Sense | Force Control 0.5, Willpower 0.4, Force Knowledge 0.2 | standard | Force Sense 10 |
| Force Barrier hold | Force Barrier | Force Control 0.7, Willpower 0.5, Endurance 0.2 | standard | ability known |
| Force Speed intervals (physical 1.2 / 0.2 + 0.6 Force) | Force Speed | Force Control 0.5, Agility 0.5, Endurance 0.4 | standard | ability known |
| Force Jump practice (physical 1.2 / 0.2 + 0.6 Force) | Force Jump | Force Control 0.5, Agility 0.4, Strength 0.3 | standard | ability known |
| Mind Trick concentration | Mind Trick | Force Control 0.6, Willpower 0.6, Charisma 0.4 | standard | ability known |
| Force Absorb channeling | Force Absorb | Force Control 0.7, Willpower 0.5, Meditation 0.3 | standard | ability known |
| Battle Meditation focus | Battle Meditation | Force Control 0.6, Meditation 0.5, Willpower 0.5, Force Knowledge 0.3 | standard | ability known; max 1 h per session |
| Force Lightning control (dark-tagged) | Force Lightning | Force Control 0.7, Willpower 0.5 | standard | ability known; dark pressure per alignment.md §3 |
| Force Choke / Grip control (dark-tagged) | Force Choke | Force Control 0.6, Willpower 0.4 | standard | ability known; dark pressure per alignment.md §3 |
| Ability drill (generic) | any other catalog ability | Force Control 0.5, Willpower 0.3, Force Sense 0.2 | standard | ability known |

### Meditation (meditation load 0.05 / -0.5, restores mental)
| Activity | Primary | Secondary weights | Default intensity | Unlock |
|---|---|---|---|---|
| Basic centering | Meditation | Willpower 0.4, Force Sense 0.2, Force Control 0.2 | casual | always; 30+ min counts for centered and light drift |
| Deep Force immersion | Meditation | Willpower 0.5, Force Control 0.4, Force Knowledge 0.3 | standard | Meditation 15 |
| Willpower meditation (D-51) | Willpower | Meditation 0.4, Force Control 0.1 | standard | always |

### Physical conditioning (physical load 1.2 / 0.2)
| Activity | Primary | Secondary weights | Default intensity | Unlock |
|---|---|---|---|---|
| Cardio | Endurance | Strength 0.2, Agility 0.2 | standard | always |
| Strength training | Strength | Endurance 0.4 | standard | always |
| Agility and flexibility | Agility | Endurance 0.3, Strength 0.2 | standard | always |
| Force-enhanced athletics (+0.6 Force) | Agility or Strength | Force Control 0.5, the paired stat 0.3 | standard | any Force ability 21+ |
| Endurance ordeal (Willpower drill, D-51) | Willpower | Endurance 0.5 | intense | always; deliberately trains under fatigue |

### Study (study load 0.05 / 1.0)
| Activity | Primary | Secondary weights | Default intensity | Unlock |
|---|---|---|---|---|
| Force history and lore | Force Knowledge | Willpower 0.3 | casual | always |
| Lightsaber history and form theory | Force Knowledge | all known forms 0.2 (equal) | standard | always |
| Jedi Code and philosophy | Force Knowledge | Willpower 0.4, Meditation 0.2 | standard | Jedi |
| Teaching a Padawan | Force Knowledge | Willpower 0.3, Charisma 0.3 | standard | has an apprentice |
| Academic study | Intelligence | Force Knowledge 0.1 | standard | always |
| Tactics study | Tactics | Intelligence 0.4 | standard | always |

### Non-Force careers (by load category; weights for the archetypes in npc-generation §3)
| Activity | Load | Primary | Secondary weights |
|---|---|---|---|
| Blaster range | saber drill (1.0, 0.4) | Blaster | Agility 0.4, Willpower 0.2 |
| Melee / unarmed drills | physical (1.2, 0.2) | Melee | Strength 0.5, Agility 0.4, Endurance 0.3 |
| Flight simulator / piloting | study (0.05, 1.0) | Piloting | Intelligence 0.3, Agility 0.2 |
| Tracking fieldwork | physical (1.2, 0.2) | Tracking | Endurance 0.4, Intelligence 0.3 |
| Stealth practice | saber drill (1.0, 0.4) | Stealth | Agility 0.5, Willpower 0.2 |
| Investigation casework | study (0.05, 1.0) | Investigation | Intelligence 0.5, Charisma 0.2 |
| Medical training | study (0.05, 1.0) | Medicine | Intelligence 0.4 |
| Profession work | study or physical by kind | Profession:<kind> | Intelligence 0.2 |
| Social practice (negotiation, performance, persuasion drills) | study (0.05, 1.0) | Charisma | Intelligence 0.3, Willpower 0.2 |

These career activities have no bank entry; their weights are a design choice (D-53).
Social practice was added in M3 (D-106): no activity trained Charisma, which the smuggler and
civilian archetypes need.

## 5. Order requirements map to activities (ranks.md §1a)
| Requirement | Activity |
|---|---|
| Initiate 2 h forms | Shii-Cho basics, instructor (D-118: Initiates train Shii-Cho only) |
| Initiate 1 h Force (0.5 h Force Control + 0.5 h Force Sense) | Force Control drill + Force Sense passive awareness at standard intensity, instructor |
| Initiate 1 h study | Force history and lore, instructor |
| Padawan 2 h with master | Padawan training with master, on the form plan's forms (largest first; D-118) |
| Padawan 1 h solo | the form plan's next forms' basics, solo (the default plan: the second form; D-118) |
| Padawan 1 h Force Control + 1 h Force Sense with master | Force Control drill + Force Sense passive awareness at standard intensity, teacher factor (active scanning once Force Sense 10+ is equally valid; the calculations use passive) |

## 6. Required tests
1. Every skill id read by any spec or archetype exists here with a category.
2. Every activity declares loads, a default intensity, ratings and weights; the secondary
   weights normalize to the 0.25 share.
3. The age row and rust row used for each skill match its category.
4. Unknown skill or activity ids are rejected (no alias fallback).

## 7. Stat bands (added by D-423)
The game's progression is the reference scale. Each band says roughly what a level means, from
the calibration profiles (progression-targets §2) and the closed-form lines by archetype and age
(no talent unless stated; "gifted" = x1.25 pace, "ceiling" = prodigy in every domain). Canon
sheets are on this scale too (Jared, D-494; src/data/canon/sheetScale.ts): forms, Force abilities,
Force Control, Force Output, Willpower and the archetype's focus as written; the Force taken out
of Strength, Agility and Endurance; the rest as the game builds it; never below the game's own
line. Bands are guides, not
gates; a figure's archetype focus decides which stats reach the high bands.

| Stat | 40 | 60 | 80 | 100 | 120 |
|---|---|---|---|---|---|
| Lightsaber forms (highest) | a new Knight (Average at 20) | a Master-level duelist (Average at 36, Obi-Wan at 25) | the elite of an era (Average at 57, Anakin at 22) | legendary (Anakin at 29, Average at 82) | apex: beyond the 4.0x ceiling's reach at 60 (Yoda, Sidious) |
| Force Control | Knight-level control (Knight minimum 34 at 20; Average Guardian at 27) | a strong Master (Average Guardian at 65; Luke at 33) | an elite Force user (Luke at 42) | legendary (Luke at 53) | apex (Luke about 116 at 62) |
| Force Sense | a seasoned Knight (Average at 37) | a Master's senses (Average at 70; gifted at 60) | a seer (a Force-focused prodigy, late in life) | legendary foresight | apex |
| Force Output | a Lord's raw power (Sith Warrior at 40 has 30) | a powerful Lord (Sith Warrior at 70) | a dark-side specialist in its prime (Sith Inquisitor's main) | legendary power (an Inquisitor elder) | apex (Vitiate) |
| Willpower | an untrained adult tops out near 35; a Padawan in training | a new Knight (53-61 at 20-25) | a Master at 40 (Average 80) | an elder Jedi at 60 (Average 102) | an elder at 80 (Average 119) |
| Meditation | a devoted contemplative (Consular at 45) | a master of meditation (a Consular's prime, gifted) | rare: a lifelong contemplative prodigy | legendary | apex |
| Force Knowledge | a scholar-Knight (Consular at 30) | a Consular Master at 40 | an Archive master (Consular at 50) | a Consular elder (Average at 60) | the Order's loremasters (Consular at 80) |
| Intelligence | an educated professional (civilian at 40) | an expert (civilian at 60) | brilliant (a gifted specialist's prime) | genius | apex |
| Tactics | an experienced officer (soldier at 52) | a general (soldier at 80; gifted at 65) | a brilliant strategist | legendary | apex |
| Blaster / melee | a trained soldier (soldier at 32) | a veteran (soldier at 46) | an elite marksman or blade (soldier at 63) | legendary (soldier at 80+) | apex |
| Strength, Agility, Endurance (trained level) | a fit, trained adult (a Jedi Knight) | an elite athlete or soldier (soldier Agility at 60) | the Human body cap (80, sec 11 of progression-numbers) | only with species or the Force boost | apex (Force-augmented) |
| Charisma | a practiced speaker (civilian at 70) | a leader | a famed orator | legendary presence | apex |

Notes:
- Force Knowledge and Meditation reach the high bands only for figures whose archetype studies
  them (the Consular); Guardians, Sentinels and Sith Warriors stay near 10-25 for life, because
  their only source is the Initiate's Force Lore hour (D-423 diagnosis; XP-source proposals in
  docs-v2/reports/calibration-2026-11-22.md §4, held for review).
- Intelligence, Charisma and Tactics have no natural baseline and no Order source: a Jedi or Sith
  stays at 0 in them unless the player studies.
