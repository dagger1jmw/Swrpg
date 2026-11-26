# m8-ground: the event schema split, ground command in play, plus the m8-ship-life review fixes (2026-11-26)

Decisions D-520 (Part A), D-521 (Part B) and D-522 (Part C). Spec: docs-v2/spec/ground-command.md (linked from combat-scales.md; every invented number in its section 12, summarised in section 4 here). Checklist item 14 is ticked.

## 1. Part A: the event schema in parts

### What I found first

The old size test built one fresh state and measured it: about 10,600 characters. Real play is bigger. I rebuilt 18 game situations (people present, threads open, a canon figure, a ship docked, a fight starting, both kinds of battle) and measured the committed code (HEAD) in each:

- **Every rich situation was already over the 12,000-character cap**, up to 14,209 (a canon figure present).
- So the schema was not "40 characters under the cap"; it was over it in most of play. Gemini evidently accepted it, but the cap was not holding.

### What was built

- **Every AI event has a part** (`EventDef.part`, `src/ai/schemas/parts.ts`). The core goes every turn; each situational part goes only when its situation holds. Each event's own legality test (D-15) still applies on top.
- **Situational fields:** combatStarted's `ships` (ship or command part), `sparringMode` (training) and `engagedElsewhereRefs` (people) are left out of the wire unless their part applies. When sent they are still valid.
- **Activity parts go one at a time** (goods, ship, training, command). The scene itself wins first (an open planning scene, a ship battle), then what the player's words name, then what the state shows. A turn that says "buy fuel, train and plan the battle" gets one; the next turn names the next.
- **A fight, a battle or an open planning scene turns the activity parts off.** The core still goes.
- **The turn's parts are worked out once** (`narrativeTurnInfo` in the pipeline). The same set decides the schema sent and which events the reply may carry.
- **Smaller schemas:**
  - descriptions are trimmed where the contract prompt already says the same thing;
  - `additionalProperties: false` is left out of the wire (29 characters an object). Zod still parses every reply and every event.
- **The canon-figure events** (`npcCanonDiverged`, `npcTrainingChanged`) now need a canon figure in the scene.
- **One Gemini call per turn stays.**

### Every event and its part

| Event | Feature | Part | Characters |
| --- | --- | --- | --- |
| timeElapsed | clock | core | 218 |
| pacingSuggested | pacing | core | 221 |
| sceneEnded | memory | core | 135 |
| locationIntroduced | locations | core | 560 |
| locationChanged | locations | core | 150 |
| npcIntroduced | npcs | core | 1,368 |
| npcStatusChanged | npcs | core | 241 |
| relationshipChanged | relationships | core | 288 |
| factLearned | memory | core | 389 |
| flagSet | flags | core | 215 |
| threadOpened | threads | core | 418 |
| threadProgressed | threads | core | 179 |
| threadResolved | threads | core | 244 |
| emotionalEvent | progression | core | 308 |
| milestoneBeatAcknowledged | progression | core | 150 |
| traitMoment | traits | core | 392 |
| hazardOccurred | health | core | 318 |
| combatStarted | combat | core (fields: ships → ship or command; sparringMode → training; engagedElsewhereRefs → people) | 1,512 in full |
| droid | droids | core | 126 |
| holdBegun | combat | people | 240 |
| npcCanonDiverged | npcs | people | 280 |
| npcTrainingChanged | npcs | people | 225 |
| promotionProposed | ranks | people | 259 |
| councilSeatProposed | ranks | people | 135 |
| forbiddenPermissionGranted | ranks | people | 197 |
| servicePromotionProposed | ranks | people | 140 |
| trade | economy | goods | 319 |
| money | economy | goods | 554 |
| living | economy | goods | 259 |
| itemMoved (new AI event) | possessions | goods | 175 |
| shipAct (new AI event) | ships | ship | 185 |
| routineRequested | routines | training | 482 |
| tacticStudied (new AI event) | tactics | training | 188 |
| groundBattlePlanned (new) | battles | command | 462 |
| combatEnded | combat | fight | 470 |
| alarmRaised | combat | fight | 130 |
| truceOffered | combat | fight | 176 |
| opponentEngagement | combat | fight | 210 |

- The envelope (narrative, choices, scene) is 1,066 characters.
- The battle part has no events of its own: the code runs the battle.

When each part applies:

| Part | When |
| --- | --- |
| people | someone is present |
| goods | a dealer is present (merchant, smuggler, criminal, bounty hunter, official, politician, servant, droid), a market or cantina, or the player's words of buying, paying, storing |
| ship | aboard a ship or station, at a port, the character's ship docked here, a travel turn, or ship words |
| training | a train or study turn, the master present, a training place, or training words |
| command | an open planning scene, an officer or soldier present, or words of battle plans |
| fight | a fight on or about to start |
| battle | a ship or ground battle |

### Sizes (characters; cap 12,000)

- **The core alone:** 6,774 in a fresh state, 8,274 at its largest (69% of the cap).
- **The largest situation:** 10,365 (86%). That is a canon figure, a merchant and the master at a market, with the player's words naming buying and training (core + people + training).
- **Every situation is under the cap** (a test fails otherwise).
- **The targets are missed.** The core is not well under half, and the largest situation is above 75%. The reason is the core list itself. npcIntroduced (1,368) and combatStarted (1,512) together are over a third of half the cap. The core events add up to about 7,200 characters before the envelope.

| Situation | Before (HEAD) | After | Tokens before → after (÷4) |
| --- | --- | --- | --- |
| alone in the wilds | 11,367 | 6,774 | 2,842 → 1,694 |
| a full story, alone (threads, traits, a beat pending) | 12,526 | 7,743 | 3,132 → 1,936 |
| a conversation | 13,515 | 9,052 | 3,379 → 2,263 |
| the Temple with the master | 13,515 | 9,858 | 3,379 → 2,465 |
| a train turn | 12,526 | 8,549 | 3,132 → 2,138 |
| a cantina deal | 13,515 | 10,363 | 3,379 → 2,591 |
| buying alone | 12,526 | 9,054 | 3,132 → 2,264 |
| the spaceport with the ship | 12,526 | 7,955 | 3,132 → 1,989 |
| aboard a ship | 12,526 | 7,955 | 3,132 → 1,989 |
| a briefing (an officer present) | 13,515 | 9,541 | 3,379 → 2,386 |
| an army officer, alone | 11,021 | 6,774 | 2,756 → 1,694 |
| a canon figure present | 14,209 | 9,559 | 3,553 → 2,390 |
| a fight about to start | 11,494 | 7,699 | 2,874 → 1,925 |
| a ship battle | 12,526 | 7,955 | 3,132 → 1,989 |
| a ground planning scene | 13,515 | 9,078 | 3,379 → 2,270 |
| a ground battle | 13,515 | 9,052 | 3,379 → 2,263 |
| the largest combination | 14,209 | 10,365 | 3,553 → 2,592 |
| the player's words naming everything | 14,209 | 10,048 | 3,553 → 2,512 |

- "Before" is the committed code in the same states. HEAD has no ground events, so its planning and battle rows are the same state without them.
- Schema tokens per turn fall by about 1,000 (a third) in most situations.

### No situation loses an event it needs (tested)

For each situation, the test takes every event the old schema allowed there. Each one must still be sent once its situation comes up: someone present for the people part, or the player's words naming it for an activity part.

Three exceptions are by design:
- during a fight, about to fight, or in a battle, the goods, ship, training and command parts are off;
- in an open planning scene, the other activity parts are off (the planning scene is the scene).

A second test lists each situation's own needs: trade and money at the cantina, shipAct aboard, routineRequested and tacticStudied in training, groundBattlePlanned at a briefing, the canon events with a canon figure.

### A4: the ship, tactic and item events (built)

`shipAct`, `tacticStudied` and `itemMoved` are their own AI events now, in the ship, training and goods parts.
- It is a straight move: the handlers are the same, and the droid event's `ship:`, `tactic:` and `item:` words still go to them (tested to give the same result).
- The STATE lines and the contract prompt name the new events, and keep the droid words for turns where the event is not offered.

### Proposals for Jared (to reach the targets)

The targets can be reached only by changing what is core or how the big core events are written. Each needs a ruling:

| Proposal | Saves | Cost |
| --- | --- | --- |
| npcIntroduced's species as words the code resolves (exact names, then the D-239 word list, else "other") instead of a 52-value list | about 650 from the core | Gemini is no longer held to the list; an unusual species word becomes "other" |
| combatStarted's capture fields (`wantAliveRefs`, a group's `wantAlive`) in a part of their own | about 200 | a capture needs a cue (a bounty, the player wanted) |
| relationshipChanged and npcStatusChanged into the people part | about 530 from the core | the largest case is unchanged (people are present in it); a relationship cannot shift with nobody here |
| threads (open, progressed, resolved) into a "story" part | about 840 | no clean trigger: threads open at any time |

- The first two together would bring the largest situation to about 9,500 (79%).
- With the third as well, the core would be about 6,900 (57%).
- **"Well under half" would need the threads or the inner-life events (emotion, trait moments) out of the core too.** I did not do that without a ruling.

## 2. Part B: the m8-ship-life review fixes

### B1. Upkeep

- **Freighters and light ships:** 0.1% of their value a month.
- **Warships:** their shares are unchanged (fighters 1%, corvettes 0.8%, down to dreadnoughts 0.3%). This is a reading of "warships keep 1%": the old report's 1% was the freighter's share.
- **Missed upkeep** still wears the ship (+0.03 a month) instead of becoming a debt (tested).

The start smuggler's month (the modified XS, 615,000 cr new; modest lifestyle; measured over a month boundary on both versions of the code):

| | Before | After |
| --- | --- | --- |
| Upkeep | 6,150 | 615 |
| Docking (30 cr a day x 31) | 930 | 930 |
| **A month in all** | **7,080** | **1,545** |

### B2. Mods in battle (numbers invented)

| Mod | In battle |
| --- | --- |
| Upgraded guns | +1 barrel on every gun mount (energy and ion guns, not warheads) |
| Military-grade weapons | +1 barrel and heavier guns on the mount (x1.3) |
| Sensor jammer | +2 on the evasion roll against a torpedo lock, beside decoys (+4) |
| Sensor suite | +1 on the dogfight position roll; the enemy formation known in a fleet battle; an ambush spotted sooner (the ambusher starts 1 up the track, not 2) |
| Shields, armour, engines | as before (+25% shields; +20% hull and -1 handling; +1 handling) |

The mods reach the engines as the owned ship's `ShipState.kit`. Each effect is tested on its roll: barrels and weight on the volley, the jammer on the lock's margin (exactly -2), sensors on the position roll, the ambush track and the fleet's intel.

### B3. Recorded as ruled

These are in ship-life.md section 13:
- the front-line Jedi ship check waits for wartime postings (item 11);
- customs standing beyond the Jedi discount waits for the renown system;
- astrogation uses the better of Piloting and Intelligence;
- liners fly only charted routes.

## 3. Part C: ground command in play (as built)

The full rules are in spec/ground-command.md. In short:

- **Starting:**
  - only from a planning scene the narrator opens with `groundBattlePlanned`: the site, the forces in plain words, and one details line (defending, terrain, weather, commander, meditator, command handed, jammed);
  - the battle begins only on the player's word;
  - the code alone ends it.
  - Without a planning scene, a fight is ordinary combat.
- **Who plans:**
  - by rank: army officers of any rung, naval officers from captain, Jedi Knights and Masters, Sith Lords, the fleet-command flag;
  - or the story hands command over;
  - otherwise the player leads a sector (a Padawan, an acolyte, a serving soldier) or fights in the line.
  - Jedi and Sith start at the front; the officer archetype and senior army officers start at the post.
- **The plan:** primary and secondary objectives, a known manoeuvre, sectors with their leaders, support, a reserve, up to two contingencies. It is checked before the battle can begin, and fixed once it does.
- **Before the battle:**
  - three scouting tries: Stealth for the ground, Intelligence for the enemy's likely plan, and recon units help both;
  - terrain and weather are modifiers.
- **The map:**
  - a 6 x 6 grid (7 x 7 and 8 x 8 for big forces) with a terrain key below;
  - the friendly side and the front positions are in sight; enemy strength needs scouting;
  - Ruusan, Geonosis and Jabiim take their features from the lore files;
  - elsewhere the narrator's words are used, tagged invented, and fixed once shown.
- **The battle:**
  - the D-505 phases, with a commanders' Tactics roll each phase and weather;
  - with a command post in contact, changes land at once; without, they land a phase later at -1. High-bond units improvise in their own sector;
  - the player's own sector changes at once;
  - a commander at the post sees everything but raises no morale at the front;
  - the player's own fight is +2 / 0 / -2 for their sector, or personal combat if they go in themselves;
  - battle meditation counts, and a raid can kill the meditator (the side checks).
  - "Let it play out" and taking control back work as in the ship battles.
  - Ordinary phases are the code's own lines. The start, big moments and the end go to the narrator. The narrate-every-turn setting covers ground battles too.
  - A game saved mid-battle loads into the same phase.
- **Results:**
  - objectives taken or held, casualties and morale;
  - a major battle for the world (world scale `ground`);
  - command XP (Tactics with the Intelligence share) for planning and commanding, and field XP for the player's own fighting;
  - the enemy's manoeuvre is recorded as seen.
- **Wartime postings (item 11)** stay story-only. Spec section 10 says where a posting will hook in.

### Readings for Jared (spec section 11)

- What any commander can order without ground training: a frontal assault and a fighting withdrawal.
- Who plans: army officers of every rung, naval officers from captain.
- The commanders' Tactics roll each phase is my reading of "the commander's Tactics roll".
- Known sites: the lore gives the features; where they sit on the grid is invented. Jabiim's lore names only places, so its churned ground is invented and marked so.
- Units' bond and fear stay at the defaults (50 and 0) until postings exist.
- A jammed command post comes only from the narrator's words for now.

## 4. Every invented number

All of them are in spec/ground-command.md section 12, with where each lives. In short:

- **The map:** larger grids above 10 and 16 units a side; what each feature does in the roll; the known sites' squares; the code's own ground when the narrator gives none; positions are a third of the larger force (2 to 6).
- **Weather:** rain and snow -1 to the attacker; storm and fog ground air support and give raids and ambushes +1; night gives raids and ambushes +1.
- **Scouting:** 3 tries, an hour each, DC 13, recon units +3, 2 squares + 1 for each 3 of margin, the enemy's plan at +3, the scouts seen at -5.
- **The plan and orders:**
  - any commander's two manoeuvres;
  - the NPC manoeuvre pools and what each NPC kind knows;
  - enemy deployment;
  - changes without contact (a phase late, -1; improvising at bond 60);
  - a sector losing at track -2.
- **The fight:**
  - 12 phases at most, 24 units a side;
  - the commanders' roll (+1 for each 4 of margin, at most 2);
  - the own fight (won at +3, lost at -3);
  - leaders fall in a rout 20% and a collapse 45%;
  - a raid reaches the meditator 25%;
  - a personal fight is against 4 enemy troops;
  - the player's hazard is severity 1 or 2.
- **The record:**
  - men a unit by command size, and command size by units;
  - a major battle at 12 units or a known site;
  - ours when the story does not say (4 or 3 units);
  - the commander's default place;
  - an NPC leader's duelist tier;
  - a sector leader's command size (a company).
- **Part B:** mods in battle (+1 barrel, x1.3, jammer +2, sensors +1 and an ambush spotted by 1). The freighter upkeep share is Jared's.
- **Part A:** the words and roles that trigger each part, and one activity part at a time.

## 5. Tests

- **`tests/ai/schemaParts.test.ts` (Part A):**
  - all 18 situations are under the cap and use only Gemini keywords;
  - the core and the largest combination are measured;
  - naming everything at once stays under the cap;
  - no situation loses an event it needs;
  - each situation's own needs are sent;
  - the situational fields come and go with their parts;
  - the dedicated events do what the droid words did;
  - the parts are worked out once per turn.
- **`tests/m8/groundCommand.test.ts` (Parts B and C):**
  - Part B: freighter upkeep 0.1% and warships unchanged; missed upkeep wears the ship; each battle mod changes its roll as set;
  - Part C, starting and ending: a battle only from a planning scene and a validated event; no narrator event can end it;
  - Part C, the plan: objectives, a known manoeuvre, sectors, support, a reserve, two contingencies; fixed once begun; contingencies carry out without penalty and without contact;
  - Part C, before the battle: scouting reveals squares and changes the key; Ruusan takes its lore features, elsewhere features are tagged invented;
  - Part C, in battle: changes follow command-post contact; a commander at the post raises no morale at the front; the own fight modifies the sector and can become personal combat; meditation counts and its loss makes the side check;
  - Part C, play and results: let it play out and take control back; a mid-battle save loads into the same phase; phases take 1.5 h; the end raises its record, the world's battle, command XP and the tactics seen; who plans by rank and by hand-over.
- **`tests/turn/groundPipeline.test.ts`:**
  - quiet phases make no AI call;
  - the start, big moments and the end are narrated from the BATTLE block;
  - there are no story choices mid-battle;
  - the narrate-every-turn setting sends every phase.

## 6. Browser check

Not done. The Chrome extension disconnected early in this session, as in the last one. Instead:
- `vite build` bundles the app cleanly;
- the panel's data comes from the selectors the tests cover (the menu, the map, the plan's problems);
- the pipeline test drives a whole ground battle through `playTurn`.

The ground panel, and the Possessions and Tactics tabs, are still worth a look in play.

## 7. Runs

| Run | Result | Time |
| --- | --- | --- |
| Schema sizes, HEAD (a worktree of the committed code) and after | the table in section 1 | about 2 s each |
| The smuggler's month, HEAD and after | 7,080 → 1,545 cr | about 2 s each |
| `npm test` (final code) | 2,029 of 2,029 passed, 165 files | 37 s |
| `npm run typecheck`, `npm run lint`, `vite build` | clean | |
| `npm run test:all` (final code; a first run was stopped because code changed while it ran) | 2,085 of 2,085 passed, 180 files | 1,261 s (21.0 min) |
