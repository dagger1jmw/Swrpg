# m8-ship-battles: dogfights and fleet battles in play, plus the m8-traits fixes (2026-11-26)

Decisions D-516 (Part A) and D-517 (the battles). Spec: docs-v2/spec/ship-battles.md (linked from combat-scales.md; every invented number in its section 10, summarised in section 6 here). Checklist item 13 has a part-1 note; it is not ticked (m8-ship-life finishes it).

## 1. Part A: the m8-traits fixes

### Field agent (main share 0.35)

`mainShare` is now a per-archetype setting (`mainShareOf`; the routine's fill and the creation focus read it). Only the field agent has one; every other archetype keeps half to the main. With 0.35 and the old weights, Intelligence (1.133) overtook Stealth (1.094), so the weights were refitted on the day loop in two measured steps (each step about 45-130 s).

| Pace (Knight phase, day loop) | m8-skills | m8-traits | Now | Target |
| --- | --- | --- | --- | --- |
| Stealth | 1.530 | 1.473 | **1.142** (top; 52.7 at 25 years in) | top, about the 50s at 25 |
| Intelligence | 0.173 | 0.956 | **0.943** | keep (officer 0.910) |
| Tactics | 0 | 0.582 | **0.587** | keep |
| Blaster | 0.251 | 0.079 | **0.345** | at least the officer's 0.344 |
| Melee | 0.188 | 0.060 | **0.181** | near 0.19 |
| Investigation | 0.243 | 0.059 | **0.231** | near 0.24 |
| Charisma | 0.428 | 0.296 | 0.299 | |
| Agility / Willpower | 0.506 / 0.470 | 0.374 / 0.404 | 0.358 / 0.296 | |

- **Weights (invented):** Stealth 1, Intelligence 5.6 -> 5.9, Blaster 0.8 -> 3.25, Tactics 2.2 -> 2.35, Charisma 2.0 -> 1.9, Melee 0.6 -> 1.75, Investigation 0.5 -> 1.75, body 0.35 -> 0.32 each, Willpower 0.2.
- The field agent out-shoots the analyst again; the m8-skills test line that m8-traits dropped is back.
- **The cost:** less time goes to Stealth, so unsheeted agents lose 5-8 Stealth (table below). A generated agent 25 years in: Stealth 52.8, Intelligence 52.1, Tactics 36.5, Charisma 29.6, Blaster 26.7, Investigation 21.4, Melee 18.4.

| Figure | Date (BBY) | Before -> after |
| --- | --- | --- |
| Theron Shan | 3640 | Melee 5.2 -> 9.8; Investigation 5.1 -> 11.2; Tactics 18.9 -> 19.0; Intelligence 86, Charisma 64, Blaster 78, Stealth 78 unchanged (his sheet) |
| Cipher Nine | 3640 | Stealth 40.7 -> 35.2; the rest unchanged (her sheet and approved draft) |
| Cipher Twelve | 3672 | Blaster 9.1 -> 21.2; Melee 6.8 -> 12.7; Investigation 8.1 -> 17.6; Stealth 43.4 -> 37.5; Intelligence 37.6 -> 37.4; Tactics 25.5 -> 25.6; Charisma 23.6 -> 23.7 |
| Hunter | 3640 | Blaster 7.1 -> 16.5; Melee 6.8 -> 12.8; Investigation 6.6 -> 14.5; Stealth 42.6 -> 36.9; Intelligence 36.3 -> 36.1; Tactics 23.6 -> 23.7 |
| Ula Vii | 3623 | Blaster 11.5 -> 26.8; Melee 11.2 -> 21.1; Investigation 11.2 -> 24.5; Stealth 59.3 -> 51.2; Intelligence 56.1 -> 55.7; Tactics 37.5 -> 37.7 |

Cipher Nine's Stealth falls because her game-scale Stealth (40.7, under her sheet's 84) is still the archetype's line. That was already low before this change; worth a look.

The re-measure probe (`tests/sweep/skillsRemeasure.test.ts`, which now also reports Investigation and Piloting and takes `EXTRA_BBY` dates) ran before and after. Only the field agents and Galena Rans moved, at 40 figure-dates; no other figure changed.

### Galena Rans

A new canon rule, `holds`: a skill left behind with a career stays at its value from a date on. A draft sheet sets it with `heldFrom`. Galena's Piloting and Gunnery hold from 3,653 BBY.

| BBY | 3655 | 3653 | 3650 | 3645 | 3640 | 3635 |
| --- | --- | --- | --- | --- | --- | --- |
| Piloting before -> after | 60 -> 60 | 61 -> 61 | 62.2 -> 61 | 63.8 -> 61 | 64.7 -> 61 | 65 -> 61 |
| Gunnery before -> after | 50 -> 50 | 51 -> 51 | 52.2 -> 51 | 53.8 -> 51 | 54.7 -> 51 | 55 -> 51 |

Her Tactics, Charisma and Blaster move on as before.

### The duel sweep with traits

`tests/sweep/combatSweep.test.ts` (part of `npm run sweep`) ran in clean copies before traits (m8-skills, 89d9728) and with traits (m8-traits, dc07adf):

- **Size and speed:** 9,840 fights each, in 66.3 s and 66.7 s (75 s and 72 s for the whole run).
- **Broken behaviour:** none in either run.
- **What traits moved:** every row stayed within a fight or two. The largest moves:
  - Padawan 16 against a Sith acolyte at +10, aimed play: 33.3% -> 25.0% won (12 fights);
  - the Knight against Sith duelists: 164/95/55 -> 165/94/54 won of 300 at gaps -10/0/+10, and 23.2% -> 23.0% of the won ending in a withdrawal;
  - a handful of Force-roll counts (for example 932 -> 929 Push resists).
- **The tier gates:** they read levels and rank only, never traits (now tested). So a Master still only buys time against a top duelist, only an apex beats an apex, and a non-Force fighter is below every tier. No gate slipped, so nothing was changed.

## 2. Part B to F: the battles (as built)

### Starting a battle

- **The narrator** sends `combatStarted` with one plain-words field, `ships`, for example "enemy: two Imperial Terminus destroyers; allies: three Thranta corvettes; mine: Aurek".
  - A separate structured event cost 696 characters and broke the 12,000-character schema cap; even a one-field event left the worst case 116 over. So it rides on `combatStarted`, as the droid and trade events did.
  - The combat feature hands it to the battles feature. The narrator cannot send the battle event itself.
- **The checks:**
  - each class is in service that year, and "a Sith frigate" becomes the side's class of that kind in service;
  - the enemy is not the player's own side;
  - no battle or fight is under way, and the player is not a prisoner;
  - a dogfight needs the player's own fighter or freighter; a fleet battle needs capital ships on both sides;
  - command goes by rank, or to whoever the story hands it.
- **From data, whatever the words say:** Angral's armada during the Sacking, and a blockade's pickets.
- **The blockade:** the force-through approach starts a ship battle, and its end records the run.
- **Coruscant:** the PP-1 hold condition needs a fleet battle won at Coruscant (world test kind `battle`).

### Playing it

- **The tactics menu:**
  - dogfight: manoeuvres, power, shields, shots, the freighter crew;
  - attack runs: a pass, hull skimming or a trench run, the facing, torpedoes;
  - a pilot in a fleet: picks the next engagement;
  - command: formation, focus, range, fighters, rolling, warheads, boarding, withdraw.
  - Each move shows what it is strong and weak against and what it costs, read from the engine numbers.
- **"Let it play out":** the code plays chunks of up to 6 steps, or to the next big moment, and the app keeps going until the player takes the controls back.
- **Boarding and evacuation:** as the brief (spec sections 5 and 6).
- **Narration:** quiet turns are the code's own lines; the big moments and the end go to the narrator in a BATTLE block.
- **What is saved and raised:**
  - the battle saved whole;
  - a record with casualties, morale and whether it was a major battle;
  - the world reads the last battle;
  - XP: Gunnery, Piloting (new, on combat XP's exchange rule), Repair, Tactics from command;
  - damage carries over, and field repairs come after.
- **Dev:** `/battle <words>` starts a battle with no AI call.

### Readings to check (spec section 9)

- **Quiet turns:** code-written, no AI call. A setting to narrate every turn would be easy to add.
- **Abandoning ship:** ends the player's part, even when they commanded the fleet from it.
- **A disabled fighter in a fleet battle:** counts as lost to its pilot.
- **Named NPCs:** never killed by a battle's casualties.
- **Later-era factions:** the Galactic Empire's ships read as `sithEmpire`, the Alliance's as `republic`.

## 3. Browser check (Jared's key, this session)

A dev test start, then `/battle enemy: two Imperial Supremacy fighters; mine: Aurek`:

- **Seen working:**
  - the panel, the menu and its greyed-out moves;
  - a quiet turn with a code line and no AI call;
  - "Let it play out" playing a six-turn chunk;
  - a big moment (the first fighter destroyed, the second coming in) narrated by Gemini;
  - a reload in the middle of the battle coming back into the same turn;
  - "Take the controls".
- **Two UI bugs, fixed:**
  - the map was squashed to one line;
  - "Take the controls" was almost always disabled during auto-play, because the app is busy nearly all the time. It now stays enabled and takes effect when the turn in flight ends.
- **Not seen:** the browser extension disconnected while the break-off turn was waiting on Gemini, so the wrap-up on screen was not checked (the tests cover it). Gemini was overloaded and retried several times during the session.

## 4. Tests

- **New:**
  - `tests/m8/shipBattles.test.ts`: 35 tests covering brief section G and Part A;
  - `tests/turn/battlePipeline.test.ts`: quiet turns make no call, big moments send the BATTLE block, and there are no story choices during a battle.
- **Changed:**
  - `tests/m8/blockade.test.ts`: the capture comes through a forced battle lost by surrender;
  - `tests/m8/world3661.test.ts`: the hinge needs four won battles, and ground fights no longer count;
  - `tests/m8/skills.test.ts`: the field agent out-shoots the analyst;
  - `tests/features/progression.test.ts`: the M2 fixture strips the battles slice.

## 5. Runs

| Run | Result | Time |
| --- | --- | --- |
| `test:all` before (clean HEAD copy, from PowerShell; the pace runs overlapped part of it) | 1,973 of 1,973 passed, 174 files | 1,390 s (23.2 min) |
| Pace measurements, three rounds of the field agent | | 106 s, 135 s, 44 s |
| Duel sweeps, before and with traits | | 75 s and 72 s |
| Re-measure probe, before and after | | about 1.4 s each |
| `npm test` | 1,953 of 1,953 passed, 161 files | 33 s |
| `npm run typecheck`, `npm run lint` | clean | |
| `test:all` after | 2,009 of 2,009 passed, 176 files | 1,346 s (22.4 min) |

## 6. Every invented number

In full in spec/ship-battles.md section 10. In short:

- **Proposals and ambush:** the caps on a proposal (40 capital ships, 24 fighters a side); an ambush starts 2 up the track.
- **Crews and command:** generic crews (navy 45, elite 65, militia 30, pirate 30, droid 35); the first officer at the commander's Tactics less 15; command sizes by ship count (1 / 3 / 8 / 20).
- **Timing:** a fleet round every 36 dogfight turns.
- **Boarding:** 50% a round, +2 / +1 edges, the bridge reached at a margin of 4, at most 3 rounds, troops 3-6 by ship kind.
- **Evacuation:** the last-off hazard (severity 3 at the break-up chance); early-leave chances (Sith 35%, Empire 20%) and trait weights; a crew shaken for 2 rounds.
- **Endings:** surrender under 25% strength when outnumbered 3 to 1.
- **Narration:** a big hit is a quarter of the hull.
- **Attack runs:** the step count, the DC, the skim and trench numbers, the point-defence share.
- **Battle data:** who flies each class; crew sizes and casualty shares; morale +5 / 0 / -8; field repair an hour a system, a patch a quarter hour, rating 40; the armada's counts; the Hydian pickets (Fury-class, 0.6 and 1.2 a strength point); what counts as a major battle.
- **Part A:** the field agent's 0.35 main share and its refitted weights. Galena's hold date, 3,653 BBY, is the brief's.
