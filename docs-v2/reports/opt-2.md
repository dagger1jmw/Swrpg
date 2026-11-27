# opt-2: correctness fixes from the m8-audit, plus duty, missions and home days (2026-11-26/27)

Jared's brief of 26 Nov 2026 took the correctness findings of reports/m8-audit.md (Part B) and his rulings on them; opt-1 took the cost and speed ones. Decisions D-535 to D-543. Every number not from lore or Jared is invented; each is listed in section K. Spec added: spec/duty.md. Specs touched: npc-generation.md, traits.md, health.md (§7, §8), ground-command.md.

Measurements are on-demand tests in `tests/measure/` (`npx vitest run --config vitest.measure.config.ts <name>`): tactics, skipStops, missionSpacing, opt1 (schema sizes), saveFixture. None is part of npm test or test:all.

## A. Wars, war years and tactics (D-535; audit U1, D-sheets)

### A1. One war list

`src/data/wars.ts`, read by the NPC generator (war years), the traits (War veteran, the quiz's first battle), the economy (military goods in wartime) and the ranks (wartime for the character's side). It replaces npcGen.config `WARS` (the Great Galactic War only) and traits `FORMATIVE_WARS` (twelve wars, no factions). `VETERAN_AGE` and `WAR_SERVICE_FROM_AGE` are one constant, `WAR_SERVICE_FROM_AGE` (14).

**The wars and their factions, for Jared's check.** Faction ids are the game's (entities.config): the Galactic Empire and later Imperial states read as `sithEmpire`, the Alliance, New Republic and Galactic Alliance as `republic`, the Confederacy as `independent` (the reading shipBattles.config already uses).

| War | Years | Factions | Source | Unsure? |
| --- | --- | --- | --- | --- |
| Great Hyperspace War | 5,000-4,999 BBY | republic, jediOrder, sithEmpire, sith | SW_Timeline_5000_3997BBY; SW_Characters_03 | |
| Great Sith War | 4,000-3,996 BBY | republic, jediOrder, sith, mandalorians | SW_Characters_04-05 (Ulic led the Mandalorians) | |
| Mandalorian Wars | 3,976-3,960 BBY | republic, jediOrder, mandalorians | SW_Characters_06 | **jediOrder:** the Council kept the Order out; Revan's Jedi went against its word |
| Jedi Civil War | 3,959-3,956 BBY | republic, jediOrder, sith | SW_Characters_07 | **sith, not sithEmpire:** Revan's and Malak's empire is not the Emperor's |
| Great Galactic War | 3,681-3,653 BBY | republic, jediOrder, sithEmpire, sith, mandalorians | D-01; SW_Mandalorians_GGW_Part1 | |
| Galactic War | 3,641-3,637 BBY | republic, jediOrder, sithEmpire, sith, mandalorians | SW_Characters_09 (the war years the lore covers) | **mandalorians:** the clans' side by date is not stated in the lore files |
| New Sith Wars | 2,000-1,000 BBY | republic, jediOrder, sith | SW_Characters_10 ("the thousand-year twilight struggle") | **a thousand years of war:** every generated combatant of that millennium is a veteran (A4) |
| Clone Wars | 22-19 BBY | republic, jediOrder, independent, sith | SW_Timeline_32_19BBY; SW_Characters_12 | **sith:** Dooku and his Dark Acolytes; **independent** also covers non-Confederate independents |
| Galactic Civil War | 0-4 ABY | republic, sithEmpire | SW_Timeline_19BBY_4ABY | the dates are traits' old list (the war runs before Yavin and after Endor in the lore) |
| Yuuzhan Vong War | 25-29 ABY | republic, jediOrder, sithEmpire | SW_Timeline_25_44ABY; SW_Characters_15 (the Remnant at Ithor, joining in 28) | **sithEmpire** from 25, not 28 |
| Second Galactic Civil War | 40-41 ABY | republic, jediOrder, independent, sithEmpire, mandalorians | SW_Characters_16 continuity note | |
| Sith-Imperial War | 127-130 ABY | republic, jediOrder, sithEmpire, sith | SW_Characters_18 | |

The economy and the ranks read the same list, so wartime pricing and wartime ranks now apply in every war above, not only the Great Galactic War.

### A2. War years by role

`warYearsFor` multiplies the overlap of service and war by the archetype's share (`WAR_YEAR_SHARE`):
- **Jared's rulings:** Guardians and Sentinels 1, Consulars 0.5, scholars, archivists and healers 0. "Unless a posting is recorded": no posting state exists for an NPC, so they always get 0 (section J).
- **Proposed for the other paths:** front line 1 (Sith Warrior, soldier, Mandalorian, warrior, Yuuzhan Vong warrior, sniper, officer, naval officer, starfighter pilot, ship gunner); support 0.5 (Sith Inquisitor, intelligence agent, bounty hunter, smuggler); everyone else 0.
- **A Clone Wars Jedi General** now has war years: a Guardian Knight of 30 has 2 by 20 BBY and 3 by 19 BBY.

### A3. Hand-set Tactics

Kept as written on the sheet (`COMMAND_FOCUS`, sheetScale.ts); without it a Jedi's or Sith's Tactics is drawn to the standing's band minus 20. Dated so the value applies from when they commanded:

| Figure | Tactics | From | Why that date |
| --- | --- | --- | --- |
| Revan | 95 | every date | a fixed figure (stasis): his sheet holds at every date; Supreme Commander 3,964-3,960 |
| Darth Marr | 90 | 3,661 | the timeline's Dark Councilor span (the Sphere of Defense) |
| Satele Shan | 88 | 3,651 | Grand Master. **Flag:** she led the Hydian Way operation as a Knight in 3,661; 3,661 is the other reading |
| Darth Malgus | 88 | 3,660 | the Rim Campaign (his note) |
| Meetra Surik | 70 | 3,960 | Malachor V. **Flag:** she was a general from about 3,964; the lore files give no year |
| Orgus Din | 65 | 3,675 | **a reading:** the Minos Cluster "during much of" the war; his Master span begins 3,675 |
| Tol Braga | 60 | 3,655 (his sheet) | **Flag:** the lore files show no command date |
| Kao Cen Darach | 60 | 3,681 (his sheet) | Battlemaster, killed at Korriban |

### A4. Progression numbers that moved

**Generated Tactics** (medians of 60 generated humans per role, split by the archetype drawn; `tests/measure/tactics.measure.ts`). "w" is war years.

| Role, age | Archetype | 3,661 BBY (Great War) | 3,640 BBY (Galactic War) | 1,032 BBY (New Sith Wars) | 500 BBY (peace) | 20 BBY (Clone Wars) | 3 ABY (Civil War) | 27 ABY (Vong War) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Padawan, 16 | any | 7.5 (w 0) | 7.5 | 7.5 | 7.5 | 7.5 | 7.5 | 7.5 |
| Knight, 30 | Guardian | 50.4 (w 14) | 23.3 -> 26.1 (w 1 -> 2) | 20.2 -> 50.4 (w 0 -> 14) | 20.2 | 20.2 -> 26.1 (w 0 -> 2) | 20.2 | 20.2 -> 26.1 (w 0 -> 2) |
| Knight, 30 | Sentinel | 51.2 | 23.7 -> 26.5 | 20.5 -> 51.2 | 20.5 | 20.5 -> 26.5 | 20.5 | 20.5 -> 26.5 |
| Knight, 30 | Consular | **50.1 -> 37.4** (w 14 -> 7) | 23.1 | 20.1 -> 37.4 (w 0 -> 7) | 20.1 | 20.1 -> 23.1 (w 0 -> 1) | 20.1 | 20.1 -> 23.1 |
| Master, 50 | Guardian | 67.9 (w 20) | 69.2 -> 70.4 | **35.6 -> 84.7** (w 0 -> 34) | 35.6 | 35.6 -> 39.7 | 35.6 -> 41.6 (w 0 -> 3) | 35.6 -> 39.7 |
| Master, 50 | Sentinel | 68.9 | 70.3 -> 71.6 | **36.1 -> 86.1** | 36.1 | 36.1 -> 40.3 | 36.1 -> 42.3 | 36.1 -> 40.3 |
| Master, 50 | Consular | **67.4 -> 53.2** (w 20 -> 10) | 68.7 -> 54.8 | 35.4 -> 63.4 (w 0 -> 17) | 35.4 | 35.4 -> 37.4 | 35.4 -> 38.4 | 35.4 -> 37.4 |
| Sith Lord, 40 | Warrior | 63.8 | 50.4 -> 52.0 | 28.7 -> 69.2 (w 0 -> 24) | 28.7 | 28.7 -> 33.4 | 28.7 -> 33.4 | 28.7 |
| Sith Lord, 40 | Inquisitor | **64.0 -> 48.6** | 50.3 -> 41.4 | 28.2 -> 52.0 | 28.2 | 28.2 -> 30.7 | 28.2 -> 30.7 | 28.2 |
| Soldier, 28 | soldier | 14.6 | 12.5 -> 12.9 | 12.5 -> 14.6 | 12.5 | 12.5 -> 13.2 | 12.5 -> 13.6 | 12.5 -> 13.2 |
| Officer, 38 | officer | 62.5 | 55.0 -> 55.6 | 53.8 -> 62.5 | 53.8 | 53.8 -> 55.0 | 53.8 -> 55.6 | 53.8 -> 55.0 |
| Officer, 38 | naval officer | 53.1 | 46.7 -> 47.2 | 45.7 -> 53.1 | 45.7 | 45.7 -> 47.0 | 45.7 -> 47.7 | 45.7 -> 47.0 |

One value where nothing moved. War years also feed the general war term on every combat skill (0.3 x the pace, closedForm), so the same NPCs gain a little in their fighting skills too.

**For Jared:**
- **The New Sith Wars** make every generated combatant of 2,000-1,000 BBY a veteran of every year served (a Master of 50 in 1,032 BBY: 34 war years, Tactics 85). If the lore's quieter decades should not count, the war can be split into its dated campaigns.
- **The Sith Inquisitor's half share** is my proposal, not a ruling (it halves a Lord's Tactics in a war).

**Canon lines that moved** (Tactics read at ages 25, 35, 45, 60, at each sheet date and at 3,661; 833 reads of every canon figure). Only the eight commanders moved; no other canon figure has war years.

| Figure | Year (BBY): before -> after |
| --- | --- |
| Revan | every read 38.8 -> 95 (fixed) |
| Darth Marr | 3,677: 9.2 -> 62; 3,667: 20.9 -> 80.5; 3,661: 25.9 -> 90; 3,657: 28.8 -> 91.8; 3,642: 36.9 -> 95; 3,640: 37.5 -> 95 |
| Satele Shan | 3,674: 15.4 -> 57.4; 3,664: 24.8 -> 72.2; 3,661: 27.1 -> 76.1; 3,654: 32 -> 84.6; 3,651: 88; 3,643: 38.2 -> 91.2; 3,639: 39.6 -> 92.2 |
| Darth Malgus | 3,675: 15.9 -> 62.7; 3,665: 25.1 -> 80.4; 3,661: 28.1 -> 86.5; 3,660: 88; 3,655: 32.3 -> 90.2; 3,653: 33.6 -> 90.9; 3,640: 37.9 -> 93 |
| Meetra Surik | 3,965: 13.9 -> 61.8; 3,960: 70; 3,955: 24 -> 72.2 |
| Orgus Din | 3,690: 13.7 -> 47.7; 3,680: 23.6 -> 59.7; 3,675: 65; 3,670: 31 -> 67.2; 3,661: 36.5 -> 69.6; 3,643: 41.1 -> 70 |
| Tol Braga | 3,715: 13.7 -> 23.2; 3,695: 31 -> 34.3; 3,680: 40.2 -> 47.1; 3,661: 49.2 -> 58.6; 3,655: 50.9 -> 60 |
| Kao Cen Darach | 3,715: 13.7 -> 38; 3,705: 23.6 -> 47.5; 3,695: 30.9 -> 55.4; 3,681: 35 -> 60 |

**Readings for Jared:** the canon line grows past a hand-set value (Marr 90 at 3,661, 95 by 3,642; Satele 88 -> 92) and runs back from it along the growth curve (Marr reads 62 as a Sith Lord of 25 in 3,677). That is how every sheet value behaves (D-414); a flat "from this date" value would need a second anchor.

**Tests:** tests/engine/npcGen.test.ts (1,032 BBY now in a war; the shares; the Clone Wars General).

## B. Dates (D-536; audit D-dates)

- **Changed:** `selectPaceForAge` and the instructors' population (`initiatePopulation`) build their closed-form characters born the right number of years before today, not at day 0 (1 ABY). The population is cached per year. The economy's old-save starting slice uses the save's own day.
- **Measured: no number moves today.** The era reaches the closed form only through the Initiate curriculum's forms (D-463). The composite and the main specialty read the highest form: Shii-Cho for every Initiate, in every era. 3,661 BBY and 1 ABY also share the curriculum (every form exists from 3,959 BBY). Tested with a 3,661 BBY Padawan and a 4,500 BBY one. The fix matters for any era-dependent input added to the closed form later.
- The economy's start day is latent: an old save has no trait debt, its only reader.
- **Tests:** tests/opt2/dates.test.ts.

## C. Teaching (D-537; audit D-narrator)

- A teacher the game does not know teaches only the basics (was Tactics 30, enough for standard tactics). With no teacher named and no master present, the same.
- A named NPC must be in the scene ("Sergeant Kell is not in the scene to teach the flanking").
- An NPC the same reply introduces teaches only the basics that turn, whatever its role ("General Kessar (just met: their experience is not known yet)"). From the next turn, its own Tactics decides by the m8-fixes B3a bars (20 standard, 50 advanced). A narrator-made officer is generated as an officer, so once met, an older officer can teach advanced tactics; that is the NPC's own Tactics deciding, as ruled.
- `UNKNOWN_TEACHER_TACTICS` is gone.
- **Tests:** tests/opt2/teaching.test.ts; tests/m8/shipLife.test.ts (the unknown commander now teaches flanking, not the Scissors).

## D. Duty, missions, skips and home days (D-538; spec/duty.md)

### D0. What existed

- No mission, assignment or posting state.
- Missions were a rolled world event, "A mission is offered" (significant: it stopped a skip; weight 2 of the significant kinds' 1 in 150 a day), and the Order's mission funds in the economy.
- A skip stopped on any hook's interruption: the 8 timeline events marked `interrupts`, every significant rolled event, thread deadlines, debt collectors, captivity, death.
- **Built on:** the threads (a mission is a thread), the world's day roll and timeline, the routine's day loop, the wounds. The rolled "mission offered" event is retired, so missions have one source.

### D1. Duty status

- At home (off duty) or on a mission, in a duty slice. Set only by the engine's `missionAssigned` and `missionEnded`; the narrator can send neither (tested).
- A mission opens its thread ("Mission: a relief mission").
- **How a mission ends (proposal, built):** the code checks at every passage of time. It ends when its thread is resolved or failed, or when the character comes home after leaving it. Within one reply time passes first, so an end the reply causes is noticed at the next passage of time.
- **Home base:** a Jedi's is the Order's seat of the year (the Jedi Temple; none while the Order is homeless, 3,653-3,651). Everyone else's is the world duty first saw them on (the academy or the Lord's holdings, the barracks, the home port, the guild hall; labelled by path).
- **On screen:** the health card's "Duty:" line.

### D2. The mission chance

A Weibull hazard (shape 2.5), none in the first 2 days home, scaled so half are assigned by the median. Medians: a Knight 35 days in peace, 10 at war. Scales: Padawan or apprentice 1.6, Knight or Lord 1, Master 1.2, soldiers, officers, pilots and agents 1, smugglers and bounty hunters 1.3; Initiates, acolytes and civilians none.

**A simulated year's spacing** (the roll itself; 20 seeds x 10 years; a mission lasts 14 days in this harness, invented; in play the thread and the trip home decide):

| Who | Era | Median | Days off duty: 10th / median / 90th percentile | Over 60 days | Missions a year (median, range) |
| --- | --- | --- | --- | --- | --- |
| Padawan | peace | 56 | 26 / 54 / 85 | 39% | 5 (3-7) |
| Padawan | war | 16 | 9 / 16 / 25 | 0% | 12 (10-14) |
| Knight | peace | 35 | 17 / 34 / 54 | 6% | 7 (5-9) |
| Knight | war | 10 | 6 / 11 / 15 | 0% | 15 (13-16) |
| Soldier | peace | 35 | 18 / 35 / 55 | 5% | 7 (5-9) |
| Soldier | war | 10 | 6 / 10 / 15 | 0% | 15 (14-17) |

The Knight and the soldier hit the brief's shape (peace about 5 weeks, rarely past 2 months; war 1-2 weeks). **A Padawan in peace** is past 2 months 39% of the time, because the Padawan scale (1.6) stretches the median to 8 weeks. Lower it to about 1.2 if a Padawan should also rarely wait past 2 months.

### D3. Injured and recovering

- **Read from the wounds**, never stored. An unhealed wound (less than three quarters healed, invented) holds an assignment back. The roll is logged ("held back: a severe wound to the left arm (40% healed)"); the hazard keeps rising, so an assignment comes soon after healing.
- **Minor** is the existing scale's lowest band (health.md §5: W 1-9). Minor wounds also heal overnight on a full sleep.
- **All hands on deck:** a minor wound does not block; anything worse still does. These are timeline events marked `allHands`, for the character's side and its allies, while they run and for 14 days after they settle (invented). Which events (a reading, 3,661 network):

| Event | All hands for |
| --- | --- |
| The Battle on the Hydian Way (3,660) | the Republic and the Order (the offensive that breaks the blockade) |
| The Sacking of Coruscant (3,653) | all four sides (the capital's defence; the Empire's offensive) |
| The Desolator crisis (3,643) | the Republic and the Order (Coruscant threatened) |
| Karrid's assault, the Battle of Corellia, the Battle of Ilum, the Emperor's Voice killed (3,640) | all four sides |

- **On screen:** the health card's fitness line.

### D4. Skips: what stops one

- **Still stops:** a mission assignment; anything touching the character, their people or their place (thread deadlines, collectors, captivity, death, a summons, a visitor, trouble nearby, a thread's turn).
- **A timeline event marked `interrupts`** stops only when it touches the character: one of its places is where they are or their home, one of its people is someone they have met, or it is a major turn for their side (`turnFor`: the Treaty, the Sacking and the Treaty's collapse for all four sides; the Battle of Ilum and the Voice's death for the Empire). Otherwise its "World:" line goes into the skip's report and the skip goes on.

**A simulated year of skips in 3,661 BBY** (wartime: the Great War; 20 seeds; the character asks to skip a year and asks again from each stop; the harness plays each mission out as 14 days and resolves its thread):

| Who | Stops a year, before (median, range) | After (median, range) | What stopped them, after (20 years) |
| --- | --- | --- | --- |
| Knight | 4 (1-6) | 30 (26-33) | 292 assignments, 291 home days after them, 12 summons, 6 trouble nearby |
| Padawan | 3 (1-9) | 25 (21-30) | 235 assignments, 235 home days, 18 summons, 11 trouble nearby |
| Soldier | 4 (2-8) | 31 (28-34) | 298 assignments, 296 home days, 22 trouble nearby |

Before, the Knight's 69 stops over 20 years were trouble nearby 13, the Battle on the Hydian Way 20, summoned 19 and mission offered 17. After, the stops on everything but missions fell to 18. The Battle on the Hydian Way no longer stops a character on Coruscant.

**For Jared:** in wartime the missions themselves now stop a year-skip about 30 times: each mission brings an assignment and a home day. That is the brief's design ("a skip runs to the day the roll comes up"; the day after each mission is a home day), but a year of war is now about 30 narrated turns rather than 4. To lengthen the gaps, raise the war median (10 days) or the mission length in play.

### D5. Home days

- **a. The Settings switch** "Stop time skips on free days at home (the day after a mission always stops)", off by default. Reaches the skip as an option; the state never holds it.
- **b. The day after each mission** is a home day whatever the switch says. "Resume the skip (N days left)" is the code's first choice: when a skip stops early (a home day, an assignment, news), the day it was going to is kept, and the choice is offered at home while days are left.
- **c.** Never on a mission (no free day there), never on a skip's own first morning (a resumed skip goes on).
- **d.** The player can play day after day at home; the daily roll still runs; nothing forces the resume.
- **e.** The HOME DAY line gives the narrator who and what is at home: masters and officers there (forms, techniques, tactics), friends (bond 30+) and rivals (-20 or less), the places (for a Jedi the Archives, the training halls, the meditation gardens), and the character's own open threads.

### D6. The narrator's state line

"DUTY (the code's; narrate it, never change it: missions are assigned and ended by the code): Off duty 12 days, at the Jedi Temple. Fit for duty." every turn.

**Tests:** tests/opt2/duty.test.ts (13: the curve, the medians, the code-owned status, both ends, the injury block and its all-hands exception, what stops a skip, the home day and its resume choice, the switch, no home day on a mission, the narrator's line). Older tests about skips keep the roll quiet (`tests/support/duty.ts`): jump, montageSpan, montagePipeline, worldNetworkTurn.

## E. Rules built but not in play (D-539; audit U2)

### E1. Pain suppression

No catalog entry exists for the four powers, so each reads an existing skill (health.config `SUPPRESSION_POWERS`):

| Power | Reads | Share removed | Force load | Starts | Ends |
| --- | --- | --- | --- | --- | --- |
| Control Pain | Force Control | min(60%, level/150) | 0.1 a minute | the health card's button while wounded, or the narrator when the player asks (validated) | the player's button; no wound left; the Force meter past its capacity |
| Battlemind | Force Control (from 20, invented) | min(50%, level/160) | 0.15 a minute | the same | the same, and the crash (+0.5 mental load) when it ends while wounded |
| Force Valor | Battle Meditation | min(50%, level/160) | 0.15 a minute | the same | the same, with the crash |
| Channel the pain (dark side) | the Sith path | 80% | none | the same | the player's button; no wound left. Its minutes are recorded for the dark pressure (+1 a minute, read by the alignment system, M6) |

- The strongest active power counts (at most 80%), on the sheet's wound penalty and on the player's fighter in a duel (the player's fighter is built from the state at a fight's start).
- Careers have none. Allowed while dying: a commander who stays at their post can use them. Never once dead.
- **Found and fixed:** D-527 says a wounded commander keeps command "with the wound's penalty on their rolls", but the commander's Tactics was read without it (`selectPerformance` applies no wounds). The ground battle now reads the player's command Tactics times (1 - the wound penalty) each phase, and the ship battle when it is set up. So a dying commander staying at the post commands at their wounded level unless a power holds the pain.
- Suppression never changes status, the dying timer or healing (tested).

### E2. Training an injured part

- A session whose skills a wound penalizes marks that wound for the day.
- That night it heals at x0.5 (HEAL_MULT.trainingInjured) and rolls 2% (TRAIN_INJURED_WORSEN_CHANCE) to get worse: one band up (minor to moderate, moderate to severe, severe to critical; critical and mortal never), its healing kept as a share.
- The routine already rests skills a moderate-or-worse wound penalizes (training-routines §6), so this mostly bites on a player's own Train choices.

### E3. Martial styles

- **The duel already read both, in its own words.** Precognition was the higher of the fighter's Force Sense and the style's anticipation (plus the centred bonus); the stacked skill was the level plus the style's bonus.
- It now calls `forceSensePrecog` and `stackedSkill` (the weapon factor is 1 until weapon proficiency is built). No change in any roll.
- `precogDefence` documents the rule, with a comment naming the duel's `precog()`.
- `terasKasiStrike` still waits for realistic damage (commented).

### E4. The lasting chance

One reader of LASTING_CHANCE: `lastingChanceAt` (engine/medicine). `lastingChance(w)` and the treatment roll go through it. The untreated path reads the severity the wound heals as (its depth's), as before.

**Tests:** tests/opt2/rulesInPlay.test.ts (8).

## F. Plain-words workarounds (D-540; audit D-words)

- **groundBattlePlanned**'s details line became fields in the command part: `defending`, `terrain`, `weather`, `commander`, `meditator`, `enemyMeditator`, `commandHanded`, `jammed`.
  - The ground-battle event rule describes them.
  - The dev command keeps the words line as its shorthand, read into the fields.
- **The droid event** no longer routes `ship:`, `tactic:` and `item:` words (shipAct, tacticStudied and itemMoved are their own events since D-520).
- A straight move: the ground tests pass unchanged on the fields.

**Schema sizes after** (characters of the Gemini schema, cap 12,000; opt-1's "after" in brackets where it moved):

| Situation | Size | Core |
| --- | --- | --- |
| a briefing | 7,035 (6,819) | 5,851 |
| everything at once | 7,478 (7,262) | 5,851 |
| the largest combination | 7,672 | 5,851 |
| a bounty hunter here | 7,934 (66%) | 5,851 (49%) |
| every other situation | unchanged | unchanged |

## G. Cleanup (D-541; audit U3, U4, D-codes, T2)

### G1. Unused exports

The scan found 76 names referenced nowhere but their own declaration: the audit's set (74 by this scan) and 2 from this batch (`proposalFromWords`, `selectDuty`).

- **Wired, not deleted (a duplicate of an inline number):**
  - `TRAINING_DAYS_PER_YEAR` (creation's `ORDER_SESSIONS_PER_YEAR` was a second 300);
  - `PEER_DISCUSSION_RATE` (the tactics discussion's `peerRate: 0.5`);
  - `BATTLE_LIMITS.capitalPerSide` (the ship battle's cap of 40).
- **Kept with a comment saying where the rule lives:**
  - `FORCE_NEGATING_CREATURES` (the terrain tag "ysalamiri" sets the fight's Force-null bubble);
  - `selectTraitAlignment` (the alignment system's interface, M6).
- **Deleted (72, with `selectTraitIds`, orphaned by `selectHasTrait`):**

- ai/schemas/intent.ts: `SequenceStepIntent`
- ai/schemas/summary.ts: `SummaryReply`
- data/activities.ts: `ACTIVITY_IDS`
- data/combat.config.ts: `DISENGAGE`, `SPARRING_ACCIDENT`
- data/droids.config.ts: `DROID_SKILL_GAME`
- data/economy.config.ts: `LoanSize`
- data/economyPrices.ts: `PRICE_IDS`, `WEAPON_KIND_PRICE`, `ARMOR_KIND_PRICE`
- data/entities.config.ts: `NpcState`
- data/formMatchups.ts: `JARKAI_NIMAN_MIN`
- data/health.config.ts: `BACTA_SWITCH_PENDING`
- data/npcGen.config.ts: `RANK_AGES`
- data/orderRequirements.ts: `AVERAGE_INSTRUCTION`
- data/pacing.config.ts: `M1_PACING_LEVELS`
- data/ranks.config.ts: `ServiceCorps`
- data/sequence.config.ts: `SequenceStepKind`
- data/shipBattles.config.ts: `AMBUSH_TRACK`
- data/shipPrices.ts: `RUNNING_COSTS_SOURCE`, `RepairLevel`
- data/skills.ts: `categoryRules`
- data/species.ts: `DEFAULT_SPECIES`
- data/weapons.ts: `isSlugthrower`
- engine/canonRoster.ts: `canonStatusFactsAt`, `canonLocationsAt`
- engine/combatForce.ts: `groupOfAbility`
- engine/curve.ts: `progressToNext`
- engine/droids.ts: `socialSupport`, `escortRating`
- engine/forceXpTrial.ts: `strainTier`
- engine/paceStore.ts: `PaceStore`
- engine/serviceRanks.ts: `ServiceRecord`
- engine/speed.ts: `GRIEF_ONSET`
- engine/synergy.ts: `synergyCeiling`
- engine/vitality.ts: `vitalityAfterSleep`, `isSpent`
- features/battles/ground.ts: `ACTIVE_PHASE_HOURS`
- features/battles/groundSetup.ts: `proposalFromWords`, `unitCount`, `MAX_UNITS`
- features/battles/index.ts: `systemOf`
- features/battles/rules.ts: `shipAtEnd`
- features/battles/selectors.ts: `selectInBattle`
- features/character/character.ts: `CharacterPathId`
- features/character/selectors.ts: `selectTalents`, `selectFocusWeights`, `selectMainForm`
- features/clock/selectors.ts: `selectNowAbsSecond`
- features/combat/holds.ts: `selectBarrier`
- features/combat/selectors.ts: `selectPendingFight`, `selectInCombat`, `selectDuel`
- features/duty/selectors.ts: `selectDuty`
- features/economy/selectors.ts: `selectEconomy`
- features/health/selectors.ts: `selectWoundLoad`
- features/memory/selectors.ts: `selectReview`
- features/possessions/possessions.ts: `emptyPossessions`
- features/progression/progression.ts: `windowEntrySchema`
- features/progression/selectors.ts: `selectProgression`, `selectTier`, `selectEffectiveLevel`, `selectWillpowerToday`, `selectInsight`
- features/routines/selectors.ts: `selectRoutines`
- features/traits/rules.ts: `heldIds`
- features/traits/selectors.ts: `selectHasTrait`, `selectTraitIds`
- features/traits/traits.ts: `QuizState`
- features/world/captivity.ts: `CaptivityNews`, `isHeld`
- turn/devCommands.ts: `isDevCommand`

**For Jared, three deleted constants were rulings nobody applies** (the rules stay in decisions.md):
- `SPARRING_ACCIDENT`: a sparring accident on a flat floor, 1 in 200 a bout (D-143).
- `JARKAI_NIMAN_MIN`: Jar'Kai needs Niman 30 (D-122). The Jar'Kai activity has no such gate.
- `DISENGAGE.advantagePenaltyPerStep`: the disengage contest uses the position bonus alone.

### G2. Old fallbacks

- **Battles v2** migrates battles and planning scenes saved before m8-fixes:
  - an old ship battle's commander gets the basics into `known` (the old fallback opened them) and an empty `seenOnly`;
  - a planning scene gets an empty `seenOnly` and `planKnows` = what the player knew.
  - The runtime fallbacks are gone: `knows()`'s missing-`seenOnly` path, `?? []`, `?? p.known`. A battle built with no tactics record at all (the engine's harness) still has every tactic open.
- **Kept:** `usedInOldBattles` is the tactics v2 migration itself, not a runtime fallback. `legacySettingsSchema` migrates the browser's settings, not saves.
- **Stale comments removed:** `REQUIREMENT_ROW` ("Sith on the Jedi rows until M7") and the order requirements' header ("stub until M7").

### G3. Ids in refusals, and the tabs test

- **Refusals in words** (data/pathWords.ts):
  - "only for the outsider path" -> "only for Force-sensitives outside the orders";
  - "only for padawan or apprentice" -> "only for a Padawan or a Sith apprentice";
  - a trait's "only for jedi" -> "only for the Jedi", its species by name;
  - the archive and rank refusals likewise.
- **tests/opt2/tabsWords.test.ts** renders the side panel's Character, Possessions and Tactics tabs with the UI's own functions, through a minimal DOM shim (tests/support/domShim.ts). It does this for five characters (a Jedi Knight with a Master present, a Padawan, a Sith Lord, a soldier with a ship, a smuggler) and applies the identifier rule (camelCase, snake_case, decision numbers) to every text, title and label.
  - It found one: the formations' "Strong against" and "Weak against" were ids ("fake, feignedRetreat"). They are names now.

### G4. DUELISTS

Commented: one figure's several rows are dated spans of one bar each (Revan 3, Vitiate 3, Scourge 2, Malgus 2, Luke 2). Tested not to overlap.

## H. Data and saves (D-542; audit T1, C5)

### H1. Save fixtures

- `tests/fixtures/saves/opt-2.json`: a save from the dev test start (a Jedi Knight of 30, 3,661 BBY) at this build. tests/opt2/data.test.ts loads every fixture there through `loadEnvelope`.
- `SAVE_NAME=<milestone> npx vitest run --config vitest.measure.config.ts saveFixture` writes the next one.
- Added to docs-v2/progress.md's habits: one at the end of each milestone.
- Saves from earlier tags were not made (it needs checking out each tag).

### H2. The cold store (invented: a year)

- **Threads:** a thread closed a year keeps its last 3 notes (what retrieval shows: memory/retrieve.ts reads the last three) and moves the older ones to `threads.cold`.
- **NPCs:** a dead NPC unseen for a year moves its health to `npcs.cold`. A living NPC's health was already healed down by the day hook.
- **The review queue** keeps every open item and at most 100 closed ones; the oldest closed go.
- **Not lost:** neither cold store is sent to the narrator; what retrieval picks (open threads, a closed thread's last notes, living NPCs) stays.
- **Not a separate store:** the cold records are still in the save. They leave the lists the turn walks, not the file. A separate storage key would be the next step if the save size matters again.

**Found and fixed with it:** the NPC day hook returned `{ byId }` alone whenever an NPC healed, dropping the slice's `canonTraining` record (D-506). It now keeps the rest of the slice. The thread handlers rebuilt their slice the same way and are fixed too (they had no other field until now).

## I. iPad UI (D-543; audit I1, I2, I4)

- **I1, the "why":**
  - Under each battle option group, on the ship and ground panels, a visible line per option: its strengths, weaknesses and cost, or "(not now)" and the reason. Staying at one's post's cost is among them.
  - Under the duel's Force row: the reason each disabled Force action is disabled.
  - The status line wraps instead of cutting with an ellipsis.
- **I2, the scroll boxes:** the duel's fighter list and log no longer scroll inside the panel body; the body scrolls alone. Side-panel tables scroll sideways only, contained, with a visible inner edge.
- **I3, the Train list:** closed entries are choosable as "<name> (not now)"; the chosen entry's reason shows under the select, and Train is disabled while it is chosen (iOS's picker cuts long option texts).
- **Not seen on an iPad or in a browser** in this session (section J).

## J. Checks

| Run | Result | Time |
| --- | --- | --- |
| `npm test` (final code) | 2,155 of 2,155 passed, 179 files | 38 s |
| `npm run typecheck`, `npm run lint` | clean | |
| `npm run test:all` | 2,217 of 2,217 passed, 197 files (the lifetime tests included) | 1,174 s (19.6 min) |
| Note | test:all ran before the last change (the wounded commander's penalty, E1, which touches only battle phases; no lifetime test plays a ground or ship battle); npm test, typecheck and lint ran after it | |
| Measurements | tactics (twice: before, after), skipStops (before, after: 42 s and 47 s), missionSpacing, opt1, saveFixture | seconds each |

### Tests changed for a reason

| Test | Change |
| --- | --- |
| npcGen.test | 1,032 BBY is in the New Sith Wars now; the shares |
| shipLife.test | an unknown commander teaches the basics only; the droid event's words go to their own events |
| schemaParts.test | the droid event no longer routes |
| groundCommand, auditA, fixesDisplay | the planning scene's fields instead of the details line |
| traits.test | "only for the Jedi" in words |
| progression.test | the M2 fixture leaves out the new duty slice too |
| jump, montageSpan, montagePipeline, worldNetworkTurn | keep the duty roll quiet: they test other parts of a skip |
| worldNetwork | the schema accepts `turnFor` and `allHands` |

## K. Every invented number

| Number | Where |
| --- | --- |
| War years by archetype beyond Jared's three (front line 1, support 0.5, the rest 0) | `WAR_YEAR_SHARE` (data/wars.ts) |
| The faction readings marked in section A1 | data/wars.ts |
| The commanders' Tactics values (Jared approved the suggestion; the values are invented) and the dates read | era09GreatGalacticWar.ts, era09Additions.ts |
| The mission roll: 2 quiet days, shape 2.5, medians 35 and 10 days | `MISSION_ROLL` |
| The scales: Padawan or apprentice 1.6, Master 1.2, analysts 1.2, smugglers and bounty hunters 1.3 | `MISSION_SCALE_BY_RANK`, `MISSION_SCALE_BY_CAREER` |
| Mission names | `MISSION_KINDS` |
| Healed enough for duty at 0.75 | `DUTY_INJURY` |
| All hands 14 days after an event settles; which events are all hands and major turns | `ALL_HANDS_TAIL_DAYS`; worldNetwork3661.ts |
| A friend at bond 30, a rival at -20 (the home day's line) | `selectHomeDayLine` |
| Duty log 30 entries | `DUTY_LOG_MAX` |
| A mission of 14 days in the measurement harnesses | tests/measure |
| Battlemind from Force Control 20; a suppression ends at the Force meter's capacity | `SUPPRESSION_POWERS`, `SUPPRESSION_FORCE_LIMIT` |
| Training the injured part makes it one band worse (the 2% is health.md's design default) | `worsenTrained` (features/health) |
| The cold store: a year, 3 notes kept, 100 closed review items | `COLD_STORE` |
| The Train list's "(not now)" | sidePanel.ts |

## L. Not done, or left for Jared

- **Rulings asked for:** the war factions marked "unsure" (A1); the New Sith Wars as one thousand-year war (A4); the Inquisitor's half share (A2); Satele's, Meetra's, Orgus Din's and Tol Braga's command dates (A3); the Padawan's peace spacing (D2); thirty stops in a war year (D4); the three dead rulings (G1).
- **Postings:** "unless a posting is recorded" has nothing to read. No NPC posting state exists, so scholars, archivists and healers always count 0 war years.
- **The home base moves** only for a Jedi (with the Order's seat). A career's or a Sith's home is the first world duty saw; nothing changes it yet (a posting or a new ship would).
- **On a mission, the routine still has its free days.** Only the home-day stop is off. Dropping free days during a mission would change the routine's balance.
- **Pain suppression mid-fight:** the player's fighter is built at the fight's start, so a power begun during a duel counts from the next fight. Wiring it mid-fight needs the duel to re-read the player's suppression each exchange. In a ground battle it counts from the next phase; in a ship battle, the wound penalty and any suppression are read once, at the battle's setup.
- **No test drives the commander's wounded Tactics through a battle phase** (the phase inputs are internal); the wound penalty and its suppression are tested on the selector.
- **The cold store** is in the save (H2), not a separate storage key.
- **No browser or iPad check** of the "why" lines, the scroll boxes, the Train reason, the health card's duty, fitness and pain buttons, or the Settings switch.
- **Save fixtures from earlier milestone tags** were not made.
