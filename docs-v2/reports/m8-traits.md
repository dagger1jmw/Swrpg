# m8-traits: starting traits and formative events, plus the m8-skills review fixes (2026-11-26)

Decisions D-514 (Part A, the review fixes) and D-515 (traits and the quiz), and D-322 amended (record only). Spec: docs-v2/spec/traits.md (linked from the design notes; every invented number in its section 9, repeated in section 6 here). Checklist item 16 ticked; item 15 has the new calibration notes.

## 1. Part A: the m8-skills review fixes

### Paces (Knight phase, measured on the day loop)

| Archetype | Before | After |
| --- | --- | --- |
| officer | Tactics 1.662, Intelligence 0.969, Willpower 0.693, Charisma 0.281, **Blaster 0.202**, Endurance 0.174, Agility 0.172, Strength 0.148 | Tactics 1.646, Intelligence 0.910, Willpower 0.643, Charisma 0.261, **Blaster 0.344**, Agility 0.184, Endurance 0.154, Strength 0.132 |
| naval officer | Tactics 1.575, Intelligence 0.894, Willpower 0.786, Charisma 0.188, Piloting 0.170, **Blaster 0.106**, Gunnery 0.079 | Tactics 1.586, Intelligence 0.880, Willpower 0.761, **Blaster 0.185**, Charisma 0.181, Piloting 0.160, Gunnery 0.076 |
| field agent | Stealth 1.530, Agility 0.506, Willpower 0.470, Charisma 0.428, Blaster 0.251, Investigation 0.243, Melee 0.188, **Intelligence 0.173**, **Tactics 0** | Stealth 1.473, **Intelligence 0.956**, **Tactics 0.582**, Willpower 0.404, Agility 0.374, Charisma 0.296, Blaster 0.079, Melee 0.060, Investigation 0.059 |
| analyst (unchanged) | Intelligence 1.584, Willpower 0.625, Tactics 0.567, Investigation 0.403, Charisma 0.286, Blaster 0.197 | the same |

- **Weights changed (invented):** officer Blaster 0.25 -> 0.48; naval officer Blaster 0.15 -> 0.28; field agent Intelligence 0.2 -> 5.6 (now by staff work, as the officer's), Tactics 0 -> 2.2, Charisma 0.8 -> 2.0.
- **Jared's rule, per line:** each line trails the officer on Tactics (analyst 0.567, agent 0.582 against 1.646) and is level or ahead on Intelligence (1.584 and 0.956 against 0.910) and Charisma (0.286 and 0.296 against 0.261). Tested per line.
- **The cost (please rule):** the fill gives the main skill half the hours and splits the other half by weight. To lift the field agent's Intelligence from 0.17 to 0.96 and add Tactics, its Blaster, Melee and Investigation lost about two thirds. The field agent now:
  - leads the officer on Intelligence, Charisma, Stealth, Agility, Melee and Investigation;
  - trails on Tactics, Blaster (0.079 against 0.344), Willpower, Strength and Endurance;
  - no longer out-shoots the analyst (the old test said it should; that line was dropped, see section 5).
- **A fix I can propose:** lower the field agent's main share (Stealth gets 0.5 of the fill today, as every archetype's main does) to about 0.35. That gives the hours back to Blaster and Melee without touching Intelligence. It changes a rule every archetype shares, so I have not done it without a ruling.
- **Measurement runs:** five rounds of the officer and intelligence measurements, 64 to 79 s each (careers 3 and 4 run in parallel).

### Canon figures (before -> after, same dates)

| Figure | Date (BBY) | Change | Moves |
| --- | --- | --- | --- |
| Harron Tavus | 3635 | officer -> soldier | Intelligence 58.3 -> 28.0; Tactics 72.1 -> 33.8; Charisma 32.5 -> 14.0; **Blaster 20.9 -> 66.4**; Gunnery 0 -> 14.9 |
| Fideltin Rusk | 3635 | officer -> soldier | Intelligence 54.8 -> 26.9; Tactics 72.0 -> 33.8; Charisma 29.6 -> 14.0; **Blaster 22.0 -> 70.2**; Gunnery 0 -> 15.7 |
| Galena Rans | 3655 (new anchor) | the bomber wing draft | Piloting 60, Gunnery 50, Tactics 45, Blaster 35 (the draft, as written) |
| Galena Rans | 3640 | politician, now with an anchor | Intelligence 55.1 -> 61.3; Tactics 11.0 -> 49.7; Charisma 60.6 -> 67.5; Blaster 10.6 -> 39.7; Piloting 0 -> 64.7; Gunnery 0 -> 54.7 |
| Cipher Nine | 3640 | the approved draft | **Tactics 0 -> 35**; **Melee 12.5 -> 70**; Investigation (draft) 72; Stealth 41.6 -> 40.7; Intelligence 90, Charisma 67.6, Blaster 84 unchanged (her sheet) |
| Theron Shan | 3640 | field agent line | Tactics 0 -> 18.9; Melee 10.0 -> 5.2; Intelligence 86, Charisma 64, Blaster 78, Stealth 78 unchanged (his sheet) |
| Cipher Twelve | 3672 | field agent line | Intelligence 21.3 -> 37.6; Tactics 0 -> 25.5; Charisma 27.3 -> 23.6; Blaster 17.7 -> 9.1; Melee 13.0 -> 6.8; Stealth 44.4 -> 43.4 |
| Hunter | 3640 | field agent line | Intelligence 20.8 -> 36.3; Tactics 0 -> 23.6; Charisma 26.9 -> 23.3; Blaster 13.8 -> 7.1; Melee 13.1 -> 6.8; Stealth 43.6 -> 42.6 |
| Ula Vii | 3623 | field agent line | Intelligence 27.2 -> 56.1; Tactics 0 -> 37.5; Charisma 34.6 -> 29.5; Blaster 22.4 -> 11.5; Melee 21.6 -> 11.2; Stealth 60.6 -> 59.3 |
| Malavai Quinn | 3640 (new anchor) | the approved draft | Tactics 70, Intelligence 60, Charisma 40, Blaster 45, Medicine 40 (as written) |
| Malavai Quinn | 3635 | officer, now with an anchor | Intelligence 55.3 -> 62.2; Tactics 65.1 -> 72.2; Charisma 31.0 -> 42.2; Blaster 21.1 -> 47.2 |
| Shara Jenn | 3642 (new anchor) | the approved draft | Intelligence 80, Investigation 75, Charisma 55, Tactics 40, Blaster 30 |
| Shara Jenn | 3635 | analyst, now with an anchor | Intelligence 79.5 -> 82.9; Tactics 35.2 -> 42.9; Charisma 29.5 -> 57.9; Blaster 19.2 -> 32.9 |

- **Field agents' Tactics** land at 19-38 (Jared's 25-35): Theron Shan is low at 18.9 (24 in 3640, a young figure), and Ula Vii is a little high at 37.5 (an older figure in 3623).
- **Anchors move a figure's other stats.** A figure with an anchor takes the sheeted line (D-506), so Galena's Intelligence and Charisma at 3640 rose by about 6-7. Past her 3655 anchor, her Piloting and Gunnery keep growing on the generic curve (Piloting 64.7 at 3640): the canon line has no rust for a skill left behind. Quinn's and Shara Jenn's lines rise the same way past their drafts.
- **The drafts as anchors:** Quinn, Cipher Nine, Shara Jenn and Galena Rans are the only drafted figures on the roster; the other drafts are stored. Cipher Nine's draft adds only the stats her lore sheet lacks (Melee, Investigation, Tactics).

### Also in Part A

- **Style edges** approved. Darth Desolous's defence edge now needs a cortosis shield (`cortosisShield` on the fighter: an NPC whose description names one; the player once items exist). The Gand findsmen's edge stays +1 on strikes, with partial armour bypass noted for the realistic damage rules beside Teräs Käsi's strike power.
- **Readings ruled** (D-514): the apprentice session without the Melee weight, unarmed fighting on Melee when higher, the social-line base 0.6, the scaled Jedi and Sith pace tables, smugglers losing about 6 Blaster.

## 2. Part B: traits (as built; spec/traits.md)

- **The 44-trait catalog** is dated data: 12 origins, 14 temperaments, 10 scars and 8 ties, each with its hooks, gate and narrator note.
- **Creation:** one origin, one temperament, one scar or tie, and an optional flaw-heavy fourth.
- **Gates:** path, species, homeworld and date. Temple-raised needs arrival before 10. The Sacking needs the character on Coruscant in 3,653. Order 66 and Ossus need a Jedi of the Order then. A war veteran needs war years or a dated war lived from age 14.
- **Weight:**
  - rolls ±1-2, ±2 in all (the intent's `situation`, plus a city's streets, an NPC target's kind, and a target's traits against a mind trick or a taunt);
  - learning ±10-20% inside the M cap, plus a play-XP factor;
  - reactions ±2;
  - combat edges as roll modifiers.
  - No level changes, so the duel tiers and the 4.0x cap are untouched.
- **Ambitious** has no pressure.
- **Alignment pressures** are stored for M6.
- **Change in play** only through `traitMoment` and `tieEnded`.
- **Ties** become NPCs.
- **NPC traits:** canon from the lore list, generated ones from the seed. Their effects apply.
- **The narrator's STATE block** carries the character's and the present NPCs' traits with their notes.

## 3. Part C: the formative quiz (as built)

- **When:** once. At creation for an older start; at a youngling's first skip of a year or more, covering the skipped years.
- **Scenes:** 4-8 by path, age and date, from 50 events.
- **Answers:** 3-4 choices and a note.
- **What answers give:** facts, leanings with suggestions at the end, people with a bond or rivalry (no XP), standing, flags (never the power), and nudges of ±2 per event and ±10 overall. Never stats or skills.
- **UI:**
  - the creation form's trait step (filtered lists, homeworld, the mentor's field, "Suggest from my backstory");
  - the quiz screens after Begin for an older start (Skip declines it);
  - for a youngling, a "Formative years" choice once the quiz is due, opening the same screens.
- **Old saves** load with no traits and the quiz never offered.

### Readings of the brief (please check)

- **52 or 50 events:** the five sets as agreed hold 50 distinct events (9 + 10 + 9 + 9 + 13). The design notes' "52" counts the two shared "Anyone" events twice (the military childhood stage draws them too).
- **Scars from answers:** a dated event's scar is given, recorded on top of the chosen traits ("All three give the Massacre survivor scar"; a first battle: War veteran). Every other answer's scar is a strong leaning offered at the end, so the creation rule (one scar or tie) holds.
- **The catalog's alignment nudges of 3** (the lesson in pain, the illegal order, a padawan's rematch through anger at dark pressure +3) are clamped to the brief's ±2 an event.
- **A youngling start** is a Jedi Initiate, a Sith acolyte, or anyone under 13.
- **The first skip:** a skip of a year or more. Skips resumed within 7 days of an interruption count as one, because a world event often breaks a long skip. While the quiz is due, a continuing skip widens its window.
- **Flaw-heavy** (for the fourth slot): Hot-headed, Stubborn, Reckless, Proud, Betrayed, Brush with the dark side, Outcast, First kill, Disgraced, Forbidden bond.
- **Contradictions refused:** Hot-headed and Patient, Reckless and Cautious, Witty and Reserved.
- **Learning from creation:** starting levels from the closed form do not take trait factors; traits speed learning from the first day of play.
- **Hooks with nothing to read them yet** stay as narrator notes (spec section 10). These are the alignment pressures (M6), standing outside the Order (renown), Disciplined's lighter fatigue, the patron's one intervention, and slower bonds.
- **The narrator's context:** feature `promptSection`s are not read by anything. The trait lines go into the STATE block (turn/context.ts), as the droid lines do.
- **Generated NPCs now have traits in fights**, so their roll modifiers apply. `npm test` and the lifetime gates passed unchanged. The duel sweep (not part of test:all) was not re-run.

## 4. Canon trait assignments (for Jared's review)

Only what the lore says of the figure. Files: P1/P2/P3a/P3b = SW_Characters_09_GGW_ColdWar_Part1/2/3a/3b.md; OLD09 = OLD_SW_Characters_09_GreatGalacticWar_ColdWar.md.

| Figure | Traits | Source |
| --- | --- | --- |
| Fideltin Rusk | Reckless, Lost family | P3a l.175: "reckless, costly commander; his parents' colony destroyed 3650 BBY" |
| Corso Riggs | Farm or frontier world, Betrayed by a friend | P3a l.178: "rancher's son; Viidu's gunman, betrayed by Skavak" |
| Bowdaar | Former prisoner | P3a l.179: "gladiator slave over a century" |
| Tanno Vik | Lost family, Stubborn | P3a l.172: "orphan gang member, then an insubordinate Republic soldier" |
| Vette | Slave-born | P3b l.75: "slave freed by Nok Drayen" (enslaved as a child; the nearest origin) |
| Eleena Daru | Slave-born, Loyal | P3b l.48-52: "Malgus's lover and bodyguard"; a slave in the Geonosis pens |
| Mako | Lost family | P3b l.119: "orphan slicer" |
| Gault Rennow | Witty | P3b l.120: "con artist" |
| Nok Drayen | Betrayed by a friend | P3b l.134: "betrayed and infected" at Nar Shaddaa, 3653 BBY |
| Darth Thanaton | Slave-born, Rival (Darth Nox) | P2 l.140: "born Teneb Kel, a slave"; OLD09 l.681: "rival to Darth Nox" |
| Darth Nox | Slave-born, Rival (Darth Thanaton) | P2 l.234: "born a slave" |
| Darth Arkous | War veteran | P2 l.202: "GGW veteran" |
| Nomen Karr | War veteran | P1 l.275: one of the Order's "most seasoned veterans" |
| Tasiele Shan | Outcast or exile | P1 l.346: "exiled after challenging the Order's views on attachment" |
| Korvan | War veteran | P3a l.188: "veteran of Dantooine and Velmor" |
| Galena Rans | War veteran | P3a l.74: "veteran of the 439th bomber wing" |
| Harron Tavus | War veteran, Betrayed by a friend | P3a: Special Forces in the Minos Cluster and at the Sacking; "turned against the Republic over the Ando Prime abandonment" |
| Scourge | Disciplined | OLD09 l.116: "A powerful, disciplined warrior" |
| Darth Marr | Disciplined, Loyal | OLD09 l.158, l.169: the Empire's "stalwart defender"; "A disciplined, powerful duelist" |
| Darth Malgus | Ambitious | OLD09 l.132: "declared a 'New Empire'" |
| Satele Shan | Forbidden bond (Jace Malcom) | OLD09 l.245: Jace "fell in love with Satele Shan, and fathered her secret son Theron" |
| Jace Malcom | War veteran, Idealistic | OLD09 l.245: "An elite Republic trooper ... a hardened, principled soldier" |
| Orgus Din | War veteran | OLD09 l.296: "battle-hardened Master and Great War veteran" |
| Darth Angral | Hot-headed | OLD09 l.296, l.350: "the vengeful Darth Angral" |
| Darth Baras | Ambitious | OLD09 l.327: posed as the Voice of the Emperor "to seize control of the Empire" |
| Shae Vizla | Mandalorian clan-born | OLD09 l.433: "One of the most legendary Mandalorian warriors" |

- **Weaker readings:** Harron Tavus's "betrayed" reads the Republic's abandonment of his men as the scar. Bowdaar's enslavement is read as Former prisoner, because Slave-born means born into it.
- **Left out:** Zym's "pacifist by temperament" (P1 l.385 says the newer file has no source for it). The design notes' examples, Anakin and Obi-Wan, are not on the roster.

## 5. Tests

- **New:** `tests/m8/traits.test.ts`, 40 tests, covering brief section E and Part A (paces, Tavus and Rusk, the drafts, the Desolous condition).
- **Changed:**
  - `tests/m8/skills.test.ts`: each intelligence line on its own trails the officer on Tactics and is level or ahead on Intelligence and Charisma. The "field agent out-shoots the analyst" line is dropped (section 1).
  - `tests/features/progression.test.ts`: the M2-save fixture strips the new traits slice, as it strips every later slice.

## 6. Every invented number

All are in spec/traits.md section 9. In short:
- **Hooks:** every roll, learning and reaction value; the pressure multipliers and offsets; start money ×2 / ×0.5 / ×3 and the old debt as a Hutt loan.
- **Readings:** the flaw-heavy list and the contradictions.
- **Limits and counts:** the ±2 / 0.8-1.2 / ±2 caps; mentor +10%; the rival's spur +10% for 30 days; 3 fears to overcome; 3 temperament moments; memory age 4; veteran age 14.
- **Dates:** the Sith Empire's years (end 3,600 BBY); the Forbidden bond to 19 ABY; the Galactic War to 3,637.
- **People:** tie names, bonds (-25 / -5 / +30) and ages.
- **The quiz:**
  - event age windows; roll chances (0.5, a disaster's loss 0.25); bond sizes (30 / 20 / 10 / -15 / -25 / -35);
  - stage splits and the half-stage cover rule; youngling under 13; the 368-day skip and the 7-day gap;
  - standing ±2 an event and ±4 overall; 2 Order standing points a step; leaning weights 1 / 2 / 3;
  - a generated NPC's second trait 50%; the backstory leanings.
- **Part A:**
  - the officer's (0.48) and naval officer's (0.28) Blaster weights;
  - the field agent's Intelligence 5.6, Tactics 2.2 and Charisma 2.0 weights;
  - Galena Rans's draft date (3,655 BBY). Her four numbers are Jared's.

## 7. Runs

- **Before** (`npm run test:all` at the start, from PowerShell; a first attempt from Git Bash failed on the drive-letter mismatch): **1,933 of 1,933 passed (173 files) in 1,328 s (22.1 min).** I wrote new files during the run, but nothing imported them until the registry change near its end.
- **Pace measurements:** five rounds of careers 3 and 4, 64-79 s each.
- **Final:**
  - `npm test`: 1,917 of 1,917 (159 files) in 36 s;
  - `npm run typecheck` and `npm run lint`: clean;
  - `npm run test:all`: **1,973 of 1,973 passed (174 files) in 1,259 s (21.0 min)**;
  - `npm run build`: passes.
- **Not done:** the creation step, the quiz screens and the in-game quiz were not checked in a browser (no browser check this session).
