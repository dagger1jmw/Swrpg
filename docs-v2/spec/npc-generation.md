# NPC generation (v1)

Reference NPCs (variance off):

| NPC                                              | Level in main skill |
| ------------------------------------------------ | ------------------- |
| Padawan, age 16 (trained since 4)                | 35                  |
| Average Jedi Knight, age 30                      | 54                  |
| Average Jedi Master, age 45                      | 70                  |
| Elder Master, age 70                             | 92                  |
| Obi-Wan check: 1.48x pace, age 39                | 81.5                |
| Anakin check: 3.89x pace, 13.5 years             | 81                  |
| Republic trooper sergeant, 35, 5 war years       | 46 (blaster)        |
| Sith warrior, 35, prodigy, angry, 10 war years   | 80                  |

## 1. Closed-form skill level
level(skill) = 41 * (effective years * pace / 16) ^ (1/1.75)
  (identical to the progression curve: the Average profile reaches 41 in 16 years)
  effective years = years trained in that skill + 0.3 * war years
    (the war term stands in for combat XP; recalibrate if combat-xp.md section 5 changes)
  pace = archetype skill weight * talent multiplier * state modifiers * variance,
    capped at 4.0 (the same limit as the player)
  variance = exp(N(0, 0.12)), seeded per NPC (about +/-12% per skill)
Physical stats use the same formula, then min(level, body cap for age and species) plus the
  Force boost (progression spec section 11).
Skills an NPC stopped training (retired, changed role) keep their level and gain rust
  (progression spec section 13).

## 2. Talent distribution (per domain, rolled once per NPC)
  Force-trained orders (Jedi, Sith): none 70% | gifted (x1.25) 22% | prodigy (x1.5) 7% |
    exceptional (x1.8) 1%
  Everyone else: none 80% | gifted 17% | prodigy 3% | exceptional 0.2%
  Named story NPCs may have talent set by hand.

## 3. Archetypes (skill weights relative to Average main-skill pace)
  Jedi Guardian: main form 1.0, second form 0.3, Force Control 0.6, Force Sense 0.5,
    Strength/Agility/Endurance 0.5
  Jedi Consular: Force Knowledge 1.0, Meditation 0.8, Force Sense 0.8, healing 0.8,
    main form 0.4, physical 0.3
  Jedi Sentinel: main form 0.7, Force Sense 0.8, investigation/stealth 0.8, Force Control 0.6,
    physical 0.5
  Sith Warrior: main form 1.0 (anger x1.15 on aggressive forms), Force Output 0.8,
    physical 0.6
  Sith Inquisitor: Force Output 1.0, dark abilities 0.9, Force Knowledge 0.7, main form 0.4
  Republic / Imperial soldier: blaster 1.0, tactics 0.6, physical 0.6 (start age 17)
  Mandalorian: blaster 1.0, melee 0.6, physical 0.8, tactics 0.5 (start age 8)
  Smuggler / scoundrel: piloting 1.0, blaster 0.7, Charisma 0.6
  Bounty hunter: blaster 0.9, tracking 0.9, melee 0.5, physical 0.6
  Civilian: profession skill 0.6, everything else 0.1
  Start ages: Jedi 2-5 (most from infancy) | Sith academy 8-16 | others as listed.
  Claude Code may add archetypes from the lore; each needs weights and a start age.

## 4. Generation
  Generate lazily, when an NPC first enters a scene or is referenced in a fight; store the
  seed and inputs (species, birth date, start age, archetype, talents, war years), not the
  levels. Levels are recomputed from the current date whenever needed, so NPCs age and grow.
  npcIntroduced from the AI supplies name, species, faction, role and approximate age. Code
  picks the archetype and rolls talents and variance.
  Rank is assigned from age and skills using the ranks spec (to come).

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
    profile within +/-2 levels at 10, 30 and 60 years.
 3. No generated NPC exceeds 4.0x pace; canon exceptions carry a justification.
 4. An NPC met again N years later has levels recomputed for the new age (growth, rust,
    body cap).
 5. Talent rolls match section 2 frequencies within 1 point over 100,000 seeded NPCs.
 6. The same seed always produces the same NPC.
