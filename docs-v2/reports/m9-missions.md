# m9-missions: the opt-2 review fixes, then missions as the heart of play (2026-11-27)

Jared's brief of 27 Nov 2026 (his review of reports/opt-2.md, a Claude in Chrome check of that build, and his design for missions, revised ~1:45 a.m. for total-war postings). Part A is the review's fixes (committed alone as "m9-missions part A"); Part B is the mission system. Decisions D-544 to D-553. Spec added: spec/missions.md (extends spec/duty.md). Specs touched: duty.md, ground-command.md (section 10). **Every number not from lore or Jared is invented**; section E lists them all.

Measurements are on-demand tests (`npx vitest run --config vitest.measure.config.ts <name>`): `missions.measure` (B4-B6), `tactics.measure` (A1f, A3), `opt1.measure` (schema sizes), `saveFixture.measure` (the mid-mission fixture). None is part of npm test or test:all.

## A. Fixes and rulings from the opt-2 review (D-544 to D-547; commit 7f0a24f)

### A1. The war list (data/wars.ts)

| Ruling | Built |
| --- | --- |
| a. Mandalorian Wars: no Jedi Order | factions `republic, mandalorians`; Revan's Jedi count through their own record (no NPC record exists yet; see D) |
| b. Galactic War: Mandalorians on the Empire's side | kept in the list (it names who fought, not which side), commented "Mandalore the Vindicated" |
| c. Clone Wars: Mandalorians | added (Spar's Protectors with the Confederacy); `sith` kept for Dooku and his acolytes |
| d. Galactic Civil War 2 BBY-19 ABY; the Order from about 11 ABY | dates changed; a new field, `factionSpans`, gives a faction its own years inside a war (`jediOrder` from 11 ABY); the war years, wartime and the duty roll read it (`factionWarYears`, `factionWar`) |
| e. Yuuzhan Vong War: the Remnant from 25 ABY | kept |
| f. New Sith Wars as dated campaigns | five campaigns, peace between (below) |

**The New Sith Wars' campaigns** (SW_Timeline_2000_1000BBY Parts 1-2):

| Campaign | Years (BBY) | From the lore | Intensity |
| --- | --- | --- | --- |
| the Schism and the Dark Underlord | 2,000-1,750 | Darth Ruin c. 2,000; the First Battle of Malrev IV 1,750. **A reading:** nothing between is dated; the lore says "the first quarter of the war was dominated by the Dark Underlord", so the span is that quarter | limited |
| Gap Nine to Mizra | 1,500-1,466 | the Republic's draft and three victories c. 1,500; Mizra 1,466 | limited |
| the Sictis Wars | 1,250-1,230 | Belia Darzu's technobeasts | limited |
| the Grumani campaigns | 1,042-1,032 | Chagras' campaign against the Republic (1,042) to Operation Influx and Vanahame (1,032). The Sith civil war from c. 1,100 is the Sith against each other ("the Republic made no attempt to win it back"), so it is not a war for the Republic or the Order | limited |
| the Light and Darkness War (the Ruusan campaign) | 1,010-1,000 | the Brotherhood of Darkness and the Army of Light; the seven battles of Ruusan | **total** |

**Before and after, 1,032 BBY** (medians of 60 generated humans per role; `tactics.measure`; "w" war years; before = opt-2's after):

| Role, age | Archetype | Before | After |
| --- | --- | --- | --- |
| Master, 50 | Guardian | 84.7 (w 34) | **53.6 (w 10)** |
| Master, 50 | Sentinel | 86.1 | 54.4 (w 10) |
| Master, 50 | Consular | 63.4 (w 17) | 45.0 (w 5) |
| Knight, 30 | Guardian | 50.4 (w 14) | 43.5 (w 10) |
| Knight, 30 | Consular | 37.4 (w 7) | 33.2 (w 5) |
| Sith Lord, 40 | Warrior | 69.2 (w 24) | 48.7 (w 10) |
| Sith Lord, 40 | Inquisitor | 52.0 | 39.4 (w 5) |

A Master of 50 in 1,032 BBY served from 1,066: only the Grumani campaigns (1,042-1,032) count now, 10 war years instead of 34.

**War intensities (B5a):** total: the Great Galactic War, the Galactic War, the Clone Wars, the Yuuzhan Vong War, the Light and Darkness War (the Ruusan campaign). Limited, **flagged as readings**: the Great Hyperspace War (one year, beaten back), the Great Sith War (fought at the Order's heart: arguably total), the Mandalorian Wars (limited for the Order, which stayed out), the Jedi Civil War, the Galactic Civil War (a rebellion and a long war of attrition), the Sith-Imperial War (ends with the Alliance broken), the Second Galactic Civil War, the four other New Sith Wars campaigns.

### A2. Approved proposals

The Sith Inquisitor's half war year (already 0.5; now marked approved). The Padawan scale 1.6 -> 1.2 (`MISSION_SCALE_BY_RANK`), and since B7 only for a Padawan or apprentice without a master.

### A3. Command dates

| Figure | Tactics | From | Why |
| --- | --- | --- | --- |
| Meetra Surik | 70 | 3,960 | Malachor V (unchanged) |
| Satele Shan | 88 | 3,651 | unchanged |
| Orgus Din | 65 | **3,681** (was 3,675) | the lore files date no command ("the Minos Cluster during much of the war"), so the war's start |
| Tol Braga | 60 | **3,641** (was in his 3,655 sheet) | his first recorded command is the strike team sent to capture and redeem the Emperor, undated beyond his fall in 3,640; so the start of that war, the Galactic War |

Canon lines that moved: Orgus Din 3,690 47.7 -> 52.9, 3,680 59.7 -> 65.5, 3,670 67.2 -> 69.0, 3,661 69.6 -> 70; Tol Braga 3,661 58.6 -> 57.1, 3,655 60 -> 58.4, 3,641 60.

### A4. The three rulings never applied

| Ruling | Built |
| --- | --- |
| The disengage penalty | `DISENGAGE.advantagePenaltyPerStep` restored: the disengager's roll takes -1 for each step the opponent is ahead on the advantage track (the reading of the old constant's name; being ahead gives no bonus). The lifetime harness's withdrawals use the same contest, so its fights changed slightly; test:all passed. |
| Jar'Kai needs Niman 30 (D-122) | `JARKAI_NIMAN_MIN` restored; `resolveTraining` refuses any session whose primary is Jar'Kai below Niman 30 ("Jar'Kai basics is locked: Jar'Kai needs Niman 30"). |
| Sparring accidents (D-143) | D-185 had built the flat floor's hazard (about 1 in 200 bouts, minor) as a terrain tag, but a spar with no terrain tags rolled nothing. The ruling's "floor": a spar whose terrain carries no hazard of its own is now on a flat floor. |

### A5. The Train list

`resolveTraining` refuses every session while the character is dead, dying or incapacitated (cannot fight); the Train list shows each entry "(not now)" with the reason ("no training while dying", "no training while too badly hurt to fight"). Sessions gated to the student ranks (the Padawan's with the master, the apprentice's) are not listed once the character is past them.

### A6. Dev commands (in /help)

`/mission start [type] [world]` (types: strike, frontline, fleet, infiltration, manhunt, investigation, escort, rescue, recon, diplomacy, and the brief's words: sabotage, engagement, tracking, protection, negotiation, reconnaissance), `/mission end [success|failure|cutShort]`, `/allhands on|off` (a dev-only flag on the duty slice), `/home` (the base on its world: the Temple on Coruscant, the forward base while posted).

### A7. The narrator never assigns a mission

The DUTY line now says never to assign, offer or hint at a new mission, assignment or posting, "not even a summons about one". A narration check (`missionOffered`; an invented phrase list: "your next assignment", "a new mission", "regarding your next posting", "you have been assigned to", "a mission awaits") catches it on any turn whose draft assigned none: one retry, then the sentence is removed. The opt-2 browser line ("A message from the Council regarding your next assignment") is caught (tested).

### A. Checks

npm test, typecheck and lint clean; **test:all 2,233 of 2,233 passed, 198 files, 1,222 s (20.4 min)**.

## B. Missions (D-548 to D-553; spec/missions.md)

### B0. The root cause

The opt-2 check found the narrator running a strike in one turn (to Ord Mantell and back in a day, won with no fight or roll) and the mission never ending. Under opt-2 a mission was a title and a thread: nothing in code moved the character, decided anything or ended it except the thread or a return home. Now the mission is a code-owned record with stages; the narrator can neither create, advance, complete nor end one (each engine-only event is refused from the narrator: tested), and the code moves the character on the mission's travel.

### B1-B2. The record and the types

As spec/missions.md sections 1-2: ten types (the brief's nine, with "front-line engagement" split into a ground engagement and a fleet action), 2-6 stages each, as data. Outbound and return travel wrap the stages.

### B3. The check rule (how a stage's check is chosen from the approach)

1. The code's own choice names the approach ("The approach: slip in unseen").
2. Else the intent's skill, when an approach reads that skill: a narrator's choice "Bluff past the checkpoint" with Charisma is the persuade approach; a typed "I slice the door panel" that the intent reads as Repair is "work the systems".
3. Else the intent's action: investigate -> read the scene; dialogue -> talk your way through; use the Force -> reach out with the Force (Force users only); a fight with no one named -> force the way through (a fight).
4. Else none: the turn is story and the stage waits (the narrator tells it; nothing is rolled).

The approach's skill then rolls against the stage's rating (DC 10 + rating / 10), +10 a complication on the stage, +20 when the approach does not fit the stage, +2 for each ally better at the skill (at most +4); wounds, rust and fatigue as any roll. A fight stage is a real fight (the combat engine); a battle stage a ground battle or a fleet action (their engines); a travel stage is arriving.

**Failure** brings a complication (the stage harder, a complication line on the card and in the narrator's line); a failure by 5 or more first inserts a complication stage (fight your way clear; pick up the thread again). **The mission fails** only when the code says so: a failure with 4 complications already, a fight lost, a deadline passed.

### B4. Travel and mission length

Setting out, a manhunt's next world and coming back are the code's travel choices, by the existing travel rules (passage or the character's own ship); the code moves the character at the trip's end; arriving back at base ends the mission. **Measured spread** (20 seeds a year; days from assignment to the end; 10th / median / 90th percentile; section B6's table has the full simulation):

| Launched from | Peace | Limited war | Total war |
| --- | --- | --- | --- |
| the Temple, an ordinary Knight | 4 / 11 / 16 days | 3 / 10 / 16 | (posted: none from the Temple) |
| the Temple, the Council's best (powerful Knight, Master) | 4 / 9 / 16 | 2-3 / 6 / 13 | - |
| a forward base | - | - | 1 / 2 / 5 (Knight); 1 / 2-3 / 8 (powerful Knight, Master) |

From the Temple the median is 9-11 days, with the 90th percentile at 2-2.5 weeks: inside the brief's "about 1-4 weeks", toward its short end (the travel is 1-7 days each way by passage; a mission's stages take 1-4 days). The Council's best run shorter because a chained mission starts where the last one ended, with no trip out. From a forward base missions are short and local (a median of 2-3 days).

### B5. Postings

A Knight starting in 3,661 BBY is posted at the first midnight to a front of the Great Galactic War (the Hydian Way, the Rim Campaign, Balmorra or Alderaan that year), travels to its forward base when the player chooses, and from then on the daily roll, the 10-day war cadence, home days and the day after a mission run there; the posting's missions go to the front's world or a world within 2 grid squares. Leave every 90-180 days (7-14 days) makes the Temple home again; the posting ends with its front's dates (the Hydian Way front ends with 3,660), a recall (a Council's-best chain to another front), or an evacuation.

### B6. A simulated year

`missions.measure`: 20 seeds a year for each cell, played through `resolveTurn` with no narrator. The player takes the code's choices (the approach with the best skill), resolves fights, begins battles on the suggested plan and lets them play out, travels where the code says, and otherwise asks to skip the rest of the year. Peace: 500 BBY; a limited war: 1,035 BBY (the Grumani campaigns); a total war: 3,661 BBY. The powerful Knight is the dev test start's Knight of 34 with the main form at 72 (top-tier combat: among the Council's best). Medians, (range).

| Who, era | Missions | Success / failure / cut short | Chains | Postings | Leave | Days at the Temple | Longest away (days) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Knight, peace | 7 (6-10) | 5 / 2 / 0 | 0 | 0 | 0 | 314 (302-327) | 57 (36-86) |
| powerful Knight, peace | 9 (5-13) | 6 / 3 / 0 | 2 (0-5) | 0 | 0 | 301 (109-322) | 56 (44-244) |
| Master, peace | 8 (2-11) | 6 / 2 / 0 | 2 (0-4) | 0 | 0 | 302 (19-321) | 67 (47-353) |
| Knight, limited war | 12 (6-19) | 7 / 3 / 2 | 0 | 0 | 0 | 293 (261-309) | 92 (17-124) |
| powerful Knight, limited war | 18 (5-30) | 14 / 4 / 0 | 7 (2-14) | 0 | 0 | 236 (36-269) | 103 (20-324) |
| Master, limited war | 17 (2-28) | 12 / 3 / 1 | 7 (1-14) | 0 | 0 | 237 (17-277) | 120 (18-349) |
| Knight, total war | 16 (6-25) | 10 / 4 / 2 | 0 | 2 | 1 (0-2) | 131 (20-306) | 239 (126-354) |
| powerful Knight, total war | 25 (13-45) | 19 / 5 / 1 | 10 (4-24) | 2 | 0 (0-1) | 127 (1-234) | 215 (109-367) |
| Master, total war | 26 (16-36) | 21 / 4 / 2 | 12 (3-18) | 2 | 0 (0-2) | 116 (1-171) | 220 (126-365) |

**Readings for Jared:**
- The shape holds: an ordinary Knight goes out and comes back (no chains); the Council's best are chained often (a median 7 links a year in a limited war, 10-12 in a total war) and are away longest; in a total war everyone is posted most of the year.
- **Two postings a year** in 3,661: the Hydian Way and the strike into Imperial space end with 3,660, so the first posting often ends with its front and a second follows; an evacuation also ends one.
- **Leave is rare (median 0-1):** a new posting resets the 90-180-day leave clock, and evacuations take the character home anyway. If leave should come every few months whatever happens, it can be counted from the first posting of the war instead.
- **Temple days in a total war (116-131)** are mostly recovery after an evacuation (a posting resumes only once the wounds are healed enough) and the days before the first trip to the front.
- The wide ranges (a Master with 2 missions in peace, 349 days away in a limited war) are single seeds where a long recovery or a long chain dominates the year.
- The harness's player always takes the best-skill approach and resolves fights in one go; a human player will do better or worse.

### B7-B11

As spec/missions.md sections 7-11. Notes:
- **B7:** the master helps on checks and holds half a fight stage's foes; allies stay story-only inside the duel itself (D-143E), so the master does not appear as a fighter.
- **B8:** checked after each turn, never mid-fight or mid-battle (the first simulation found an evacuation mid-battle left the battle open and blocked every later assignment; fixed at the root: the wound check waits for the battle to end).
- **B9:** standing from missions is added to `selectStanding` (the promotions and the Council's test read it).
- **B10:** `missionProposed` is in the people part of the schema (D-520), so the core schema is unchanged. Schema sizes after (cap 12,000; opt-2's in brackets): the core 5,851 (5,851); a briefing 7,367 (7,035); the largest combination 8,004 (7,672); everything at once 7,810 (7,478); a bounty hunter here 8,266, 69% (7,934).
- **B11:** the mission card is on the Character tab above the health card. The skip stops at the assignment, at each stage that needs the player ("The mission needs you: the approach"), and the trip's arrival ends its own turn. The routine plans every day of a mission as a working day (no free day).

### B12. Saves

Duty v2 migrates opt-2 saves: an opt-2 mission becomes a record (its type from its name: "a strike mission" is a strike; on site if the character had left home, else outbound to a curated world picked from the title). tests/fixtures/saves/m9-missions-mid.json: the dev test start's Knight (500 BBY) on a recon on Taris, arrived, its first stage tried; it loads and offers the mission's choices (tested).

## C. Checks

| Run | Result | Time |
| --- | --- | --- |
| Part A: npm test, typecheck, lint | clean (npm test 2,171 of 2,171) | 40 s |
| Part A: test:all | 2,233 of 2,233, 198 files | 1,222 s (20.4 min) |
| Part B: npm test | 2,198 of 2,198 (182 files) | about 45 s |
| Part B: typecheck, lint | clean | |
| Part B: test:all | 2,259 of 2,259, 199 files | 1,224 s (20.4 min) |
| Note | after test:all, the narration check's phrase list lost "orders" and "task" (they flagged ordinary lines such as "turns to the next task"); it touches only the narration check, no lifetime test; npm test, typecheck and lint ran after it | |
| missions.measure (20 seeds x 9 cells) | below | 715 s (11.9 min; it ran beside test:all, single-threaded). Every cell finished and printed; vitest then marked the run failed for passing the measure config's 600 s timeout, so the test now sets its own (an hour) |
| tactics.measure, opt1.measure, saveFixture (mid-mission) | as reported | seconds each |

**Tests added:** tests/m9/partA.test.ts (16: the wars, the scale, the command dates, the three rulings, the Train list, the dev commands, the narration check); tests/m9/missions.test.ts (25: every B item that is pure code, and the scripted mission through `playTurn` with a stubbed narrator: set out for Taris, the stages, a complication, a fight, the travel days, home at the end).

**Tests changed for a reason:**

| Test | Change |
| --- | --- |
| npcGen.test | a Knight of 30 in 1,032 BBY has 10 war years (the Grumani campaigns), not 14 |
| opt2/duty.test | the narrator's thread no longer ends a mission; the code ends it at base (a return with the work undone is a failure); a 3,661 Knight is posted first, so the roll runs at the forward base; a mission never set out for ends after 7 days, so the "no home day on a mission" skip is 5 days |
| features/routines.test (test 10) | duty kept quiet: a mission's days have no free day, which would change the routine's measure |
| tests/support/duty.ts (`quietDuty`) | also switches duty off (`off`), so no posting interrupts a skip test |
| tests/support/lifetime.ts | duty switched off: the lifetime runs measure the training routine |

## D. Not done, or left for Jared

- **Rulings asked for:** the war intensities marked "reading" (A1); the New Sith Wars' first campaign as the whole first quarter (A1f); the Council's best test (B6a); a moderate wound outside all hands sending the character back (B8); every invented number (section E).
- **NPC postings and records:** "Jedi who followed Revan count through their own record" and "unless a posting is recorded" (opt-2 A2) have nothing to read: no NPC has a posting or service record yet.
- **Ground command's posting hooks** (ground-command section 10): the posting's unit as `ours`, command from the posting, the posting's calendar opening battles. The front-line battle uses generic forces (six troops with artillery against six with armour and artillery) and the fleet action three frigates and two corvettes a side.
- **The master in the duel:** story-only (D-143E); the master's share is a count reduction.
- **Other travel** still leaves the move to the narrator; only a mission's, a posting's and leave's trips move the character in code.
- **A lead found during a mission** cannot be proposed (proposals are off duty); a related lead becomes a follow-up only through the Council's chain.
- **Leave** is offered, not forced: its days count whether or not the character goes home.
- **No browser or iPad check** of the mission card, the posting line or the code's choices in this session.
- **Save fixtures from earlier milestone tags** were not made (as opt-2).

## E. Every invented number

| Number | Where |
| --- | --- |
| The mission types' stages, ratings (25-40 after the tuning below), successes needed, hours per attempt, foes | `MISSION_TYPES` |
| The type weights by path and war | `MISSION_TYPE_WEIGHTS` |
| Poor fit +20; +10 a complication; a failure by 5 inserts a stage; 4 complications before a failure fails the mission; allies +2 (at most +4) and hold half the foes; 7 days to set out | `STAGE_RULES` |
| Deadlines: escort 21 days, rescue 14 | `MISSION_TYPES` |
| A moderate wound outside all hands sends the character back | `MISSION_WOUNDS` |
| Standing +2 / -3 / 0 within -15..+15; history 20 | `MISSION_STANDING`, `MISSION_HISTORY_MAX` |
| The Council's best: form 70, standing 70, 5 missions, three in four successes | `COUNCIL_BEST` |
| Chains: 60% at war, 35% in peace; follow-up 50%, front 30%, recall 20%; 5 links | `CHAIN` |
| Postings: who; leave every 90-180 days for 7-14; local worlds within 2 grid squares | `POSTING` |
| The fronts' forward bases and the years marked "reading" | `FRONTS` |
| The curated mission worlds | `MISSION_WORLDS` |
| The battles' forces | turn/missionTurn.ts |
| The narration check's phrase list | `MISSION_HINT` (turn/narrationCheck.ts) |
| The disengage penalty's -1 a step (the old constant's value) | `DISENGAGE` |
| The A1 war intensities and campaign readings | data/wars.ts |

**Tuning made in this session:** the first simulation (2 seeds) had an ordinary Knight failing about two missions in three (stage ratings 35-50, 3 complications before failure). Ratings were lowered by 10 (to 25-40) and a fourth complication allowed; the 20-seed run above is after it.
