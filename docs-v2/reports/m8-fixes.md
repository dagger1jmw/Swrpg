# m8-fixes: the browser-test fixes, Jedi tactics learning, and the two approved m8-ground schema changes (2026-11-26)

Decisions D-523 (Part A), D-524 (Part B) and D-525 (Parts C to G). Source: Jared's two Claude in Chrome play tests ("[TEST] Test knight" and "[TEST] Quiz padawan"). Every number not from lore or Jared is invented; each is tagged where it appears and listed in section 9.

Commits: Part A on its own (6bcda67), then Parts B to H together.

## A. The approved m8-ground schema changes (D-523)

### A1. Species as words (proposal 1)

- **Cause:** npcIntroduced carried a 52-value species list in the core schema (about 650 characters every turn), and an unusual species was refused.
- **Change:**
  - `species` is plain words, optional.
  - The code resolves them: an exact name (an id, or the species table's name, plural or not), then the D-239 word list, then the name and description as before.
  - A word nobody can read is not refused. The NPC is "other", and the word goes to the review queue as a species item.
  - In the People tab the player picks the species (`npcSpeciesSet`) or keeps "other".
  - Species items are never resolved by a name match.
- **Test:** `tests/ai/schemaParts.test.ts` A1 checks that no enum goes on the wire, and that Twi'lek, Mon Calamari, kelDor, "Zabraks" and "an Iridonian" all resolve. An empty species is "unknown". "Kiffar" becomes "other" plus a review item, and the player can settle it. The old "gungan is refused" test now expects the review queue (`tests/features/entities.test.ts`).

### A2. The capture fields only with a cue (proposal 2)

- **Cause:** combatStarted's `wantAliveRefs` and each group's `wantAlive` went every turn (about 200 characters).
- **Change:** a new part, `capture`, which is uncapped like `people`. Its cues:
  - a bounty hunter is present;
  - a debt is at the bounty stage;
  - one of the character's ships is flagged by customs;
  - the player's own words (alive, capture, arrest, bounty, prisoner, stun, surrender, "take him in" and the like).

  `partFields` now takes a dotted path into an array's items (`minionGroups.wantAlive`). A field left off the wire still validates if it is sent.
- **Test:** schemaParts A2 checks the fields with and without each cue, and that a sent `wantAlive` still applies.

Proposals 3 and 4 were rejected. relationshipChanged, npcStatusChanged and the thread events stay core, and warship upkeep keeps its sliding scale.

### Schema sizes (characters; cap 12,000)

Measured on the same 18 situations as m8-ground, plus two new ones for the capture cue. "Before" is the m8-ground commit (38cfd09), "after" is Part A. "Core alone" is the same state with only the core part.

| Situation | Before | After | Core alone, after |
| --- | --- | --- | --- |
| alone in the wilds | 6,774 | 6,053 | 6,053 |
| a full story, alone | 7,743 | 7,022 | 7,022 |
| a conversation | 9,052 | 8,331 | 7,553 |
| the Temple with the master | 9,858 | 9,137 | 7,553 |
| a train turn | 8,549 | 7,828 | 7,022 |
| a cantina deal | 10,363 | 9,642 | 7,553 |
| buying alone | 9,054 | 8,333 | 7,022 |
| the spaceport with the ship | 7,955 | 7,234 | 7,022 |
| aboard a ship | 7,955 | 7,234 | 7,022 |
| a briefing | 9,541 | 8,820 | 7,553 |
| an army officer | 6,774 | 6,053 | 6,053 |
| a canon figure | 9,559 | 8,838 | 7,553 |
| a fight about to start | 7,699 | 7,202 | 6,503 |
| a ship battle | 7,955 | 7,234 | 7,022 |
| a ground planning scene | 9,078 | 8,357 | 7,553 |
| a ground battle | 9,052 | 8,331 | 7,553 |
| the largest combination | 10,365 | 9,644 | 7,553 |
| everything at once | 10,048 | 9,327 | 7,553 |
| a bounty hunter here (new) | 10,363 | 9,866 | 7,553 |
| the player speaks of capture (new) | 7,743 | 7,246 | 7,022 |

- Every situation is about 720 characters smaller (about 180 tokens). When the capture cue holds, the saving is about 500.
- The largest situation was 86% of the cap and is now 80%: the largest combination at 9,644. With a bounty hunter present it is 9,866 (82%).
- The core alone is now 6,053 in a fresh state and 7,553 at its largest (63%).
- Parts B to G add no AI fields (the new events are engine or player only), so these sizes still hold.

## B. Jedi tactics learning (D-524)

### B1. One list

- **Cause:** the battle menus added "what any commander can order" behind the tab's back. Ground battles added a frontal assault and a fighting withdrawal; fleet command added the line, the brawl, withdrawing and rolling the ship. So the tab showed no ground tactics while battle offered two.
- **Change:**
  - Those basics are now in every character's list ("anyone can order these").
  - The ground menu, the planning panel and the ship menus read only the list.
  - Old in-flight battles keep the old fallback.
- **Test:** `tests/m8/fixesTactics.test.ts` B1 checks that the tab's ground tactics equal the ground battle's offer, for a Padawan, a civilian and a soldier. It also checks that every dogfight option is on the tab.

### B2. Starting sets

| Character | Ground | Space |
| --- | --- | --- |
| Jedi Padawan (and Knight, Master) | Frontal assault, Defence in depth, Fighting withdrawal | The line, Starfighter screen, Withdraw; the pilot basics (head-on pass, Break, Jinking, Strafing pass); the brawl, Rolling the ship |
| Jedi Initiate | Frontal assault, Fighting withdrawal (anyone's) | the pilot basics and anyone's fleet orders. The initiate set comes on promotion to Padawan |
| Jedi Knight at the front (`jedi-front`) | + Flanking, Ambush (proposal) | + flight school (Knights fly, D-519) |
| Sith apprentice or Lord (proposal) | the same as a Padawan's (`sithAcademy`) | the same |
| Republic trooper (soldier) | Frontal assault, Flanking, Defence in depth, Fighting withdrawal | the basics |
| Army officer | all nine ground manoeuvres | the basics |
| Republic pilot | anyone's | flight school + Starfighter screen (proposal) |
| Imperial officer (naval) | anyone's | the officer academy's formations |
| Smuggler | anyone's | a smuggler's flying |
| Civilian | Frontal assault, Fighting withdrawal | the pilot basics and anyone's fleet orders |

- The initiate set is the brief's example, chosen from the catalog. "Hold position" is Defence in depth, the catalog's holding manoeuvre.
- **Proposals for Jared:**
  - the Sith Academy gets the same basics;
  - a pilot knows the screen;
  - a Jedi at the front knows flanking and ambushes.
- Every other background keeps D-519's sets.
- **Test:** B2 checks the Padawan's set and its source. An initiate does not have it yet, and `rankSet` to Padawan gives it. It also checks that a soldier has more ground tactics than a pilot, and a naval officer more fleet tactics than a soldier.

### B3. Learning more

- **From a teacher:**
  - This uses the existing `tacticStudied` event. No new event was needed.
  - The teacher's own Tactics decides how hard a tactic they can pass on (all invented): basics anyone, standard tactics Tactics 20, advanced tactics 50.
  - The teacher is the person the words name, or the master in the scene. A named teacher the game does not know counts as Tactics 30.
  - Generated Jedi Masters have no Tactics in NPC generation (I measured 0), so they teach only the basics. An officer (74) or a general (91) teaches advanced tactics.
  - **Reading for Jared:** a Jedi Master with military experience who has no Tactics on their sheet can only teach the basics until their sheet, or a posting, gives them Tactics.
- **In the field:**
  - A tactic seen in a battle the character fought becomes "seen, not practised". This was already recorded. Under an NPC commander on the ground, our side's manoeuvres are now seen too.
  - Using it successfully makes it known at the battle's end. "Successfully" means (invented): a dogfight turn won on position, a strike that reached the hull or a system, a fleet round won, or a ground phase won on balance.
  - Being taught it by a commander there follows the teacher rule.
- **Test:** B3 checks that a generated Jedi Master teaches flanking (basic) but not the ambush ("military experience"), and that a general teaches envelopment. It also plays a fleet battle where capping the T is only seen: it is offered with its penalty, flown at -2, and learned on a won round.

### B4 and B5. Seen tactics and the tab

- Seen tactics show on the tab as "seen, not practised".
- They are offered in every battle menu with "seen, not practised: -2" (invented) and flown at -2 on their roll. The suggested ground plan never picks one.
- The tab keeps what each tactic is good against, what it is weak against, and its description, for ground and space.

### B6. Old saves

- Old saves get the starting set for their background, plus every tactic they already used in a battle. That comes from the battle records' new `tacticsUsed`, the last ship battle's formation when the player commanded, and the last ground battle's manoeuvres when commanding.
- Records made before this build did not keep the player's own moves, so only the last battle of each kind can be read.
- **How:** the tactics slice is now version 2. Slice migrations now receive the whole raw save, so this one can read the character, rank and battles.
- **Test:** B6 runs the migration on a raw save.

## C. Display bugs (D-525)

### C1. "D5: positionTaken"

- **Cause:** the ground phase line fell back to the engine's result code for `light` and `positionTaken` when the record had no notes. The end line also showed the end reason code.
- **Change:**
  - `phaseLine` gives every result code its own words.
  - `GROUND_END_WORDS` does the same for the end reasons.
- **Test:** `tests/m8/fixesDisplay.test.ts` C1 renders every code × side × track × own-fight combination. It fails on anything that looks like an identifier (camelCase, snake_case, or a bare code), and checks the reported line.

### C2. Lines contradicting the tracks

- **Cause:** a phase with no strike is `steady` in the engine even when the track moves (`moveTrack`), and the line said "neither side gains" for every `steady`. The player's own fight was a separate line that knew nothing of the sector's result.
- **Change:**
  - The direction comes from the same record as the track: a strike goes to its striker, otherwise the sign of after minus before.
  - The player's own fight is told in the same sentence, with "but" when the two pull apart.
- **Test:** C2 plays 20 seeds of up to 12 phases (well over 100 sector lines). Every line reads the way its record moved, and the reported −3 case now reads "the enemy gain the upper hand".

### C3. A finished battle's panel never cleared

- **Cause:** the dogfight wrap-up showed while the last battle record was two days old or less. The ground battle's own record kept it "recent", so it stayed through the whole ground battle.
- **Change:**
  - The battles slice records the battle that ended and the turn it ended (`ended`). The wrap-up shows on that turn only, and never beside another battle or a planning scene.
  - Field repairs stay offered while the ship needs them and no battle runs.
  - This applies to both ship and ground battles.
- **Test:** C3 covers the selector: shown on the turn it ended, gone the next turn, hidden during planning or another battle, and none for old saves.

### C4 and G7. The location did not follow the player

- **Cause:** no battle event moved the player, and a free start seeded no place.
- **Change:**
  - Beginning a ground battle moves the player to its site. A map world the site names becomes its parent ("the Jabiim highlands" sits inside Jabiim); otherwise the world they are on.
  - A ship battle puts the player aboard their ship.
  - While a battle runs, the narrator cannot move the player. `locationChanged` is refused, and `moveHere` is ignored.
  - The end puts the player where they end up:
    - back at the base after a ground defeat or a withdrawal;
    - still on the field after a win or a hold;
    - held by the enemy when captured;
    - aboard a surviving friendly ship (or at the battle's place) when picked up;
    - otherwise still aboard their own ship.
  - A free start begins at the places of the first start option that fits its path, rank and archetype. A Jedi in 3,661 BBY starts at Coruscant, in the Jedi Temple.
- **Test:** C4 covers the Jabiim site and its parent, the narrator being refused mid-battle, the return to base, a ship battle aboard the ship (inside Coruscant), and the free Jedi start.

## D. Rules bugs (D-525)

### D1. War veteran pre-selected for a 14-year-old

- **Cause:** War veteran's gate also opened on a dated war lived from age 14, so a 14-year-old in 3,661 BBY qualified with war years 0. The scar list then picked its first open entry.
- **Change:**
  - Traits have a requirement field, `requires`. War veteran needs war years above 0 (Jared).
  - A trait closed by a number on the form is greyed with its short reason. If it was selected, it is un-ticked. The form re-checks as the numbers are typed.
  - Path, species and date gates still hide.
- **Requirements added:**

| Trait or option | Requirement | Source |
| --- | --- | --- |
| War veteran | war years above 0 | Jared |
| First kill, young | start age 8 or more | invented |
| Ward | start age 12 or more (someone to look after) | invented |
| Forbidden bond | start age 14 or more | invented |
| Old debt | start age 16 or more (a creditor lends to an adult) | invented |
| War years (background option) | at most the years since age 14 | invented, the traits' veteran age |
| Temple-raised (existing gate) | now greyed with "needs Temple arrival before age 10" instead of hidden | D-515 |

- I checked the other traits and found no form-number requirement worth adding. Contact, patron and outside mentor make sense at any start age; disgraced, outcast and betrayed are story scars.
- **Note for Jared:** the quiz's "Your first battle" scenes are dated by the war and still *give* War veteran, even with war years 0 on the form. I kept that: the scene is the war experience.
- **Test:** `tests/m8/fixesRules.test.ts` D1. Three older tests encoded the old rule and were updated: the Great War date rule, a war veteran created without war years, and 3 war years at 16.

### D2. A severe head wound left Vitality at 76/76

- **What the spec says:** health.md section 3: "Wounds do not lower Vitality, and Vitality does not show a wound (M5 balance row 19, 2026-11-20): only the part of D that is not bypassed comes off Vitality, so a clean or critical saber hit (bypass 1) can make a mortal wound and leave Vitality full. A wound's weakness is its wound penalty (section 6), not Vitality." So the spec keeps them apart on purpose.
- **Change:** the fallback the brief allows. The health card shows the active wounds beside the Vitality bar: the worst one and how many more, for example "severe wound (head) +1 more". A tooltip says wounds weaken through the wound penalty.
- **Not done:** the recommended Vitality cap until a severe wound heals. It would undo balance row 19, so it waits for the realistic-damage build (noted in health.md).
- **Test:** D2 checks the tag, and that Vitality is untouched.

## E. Speed and safety (D-525)

### E1. "Begin the battle" blocked about 2 minutes

- **Cause:** the app showed nothing of the turn until the narration came back, even though the code had decided it all before the call.
- **Change:**
  - As soon as the code has resolved the turn, the app shows the resolved state in the battle and ground panels, the header and the side panel, with the code's own lines and "The narration is on its way…". This holds for every turn, not only battles.
  - If the narration fails completely on a turn the code decided (a battle step, or a fight via its code-written summary), the turn commits with the code's lines. The battle stays playable, and the report says so.
  - A story turn keeps Retry.
- **Test:** `tests/turn/groundPipeline.test.ts` E1. With every narration call failing, "Begin the battle" commits with the code's line and the next phase plays.

### E2. The fallback after one busy reply

- **Cause:** D-240 retried a 5xx three times with backoff on the same model before trying the next one.
- **Change:**
  - A busy (5xx) reply switches to the next model at once.
  - The next model, the last one tried, keeps the retries.
  - Timeouts (no reply at all) keep their old path, as "other errors as is".

| Wait before the fallback model answers (the first model busy every time) | Before | After |
| --- | --- | --- |
| Backoff sleeps | 2 + 4 + 8 = 14 s (10.5-17.5 s with the ±25% jitter) | 0 s |
| Failed calls on the busy model | 4 | 1 |

- **Test:** `tests/turn/overloadRetry.test.ts` covers four cases: one 503 goes straight to the next model with no wait; the next model busy retries at 2 s then 4 s; both exhausted fails with Retry; and the before/after numbers. `tests/turn/pass4Unreached.test.ts`, the simulated 503s, was updated.

### E3. Slash commands

- **Cause:** outside dev mode a "/..." line went to Gemini as a story turn. In dev mode, "/" followed by a non-letter did too.
- **Change:**
  - `slashRoute`: any input starting with "/" is a command.
  - Outside dev mode it is refused on screen with "Commands need dev mode. Nothing was sent."
  - In dev mode it runs in code, and an unknown one answers "Unknown command /x" with the list.
- **Test:** `tests/turn/slashCommands.test.ts` covers both modes.

## F. The planning panel layout (D-525)

- The ground planning step has its own layout. It takes the page's height, with the story above kept to about a fifth of it.
- Its sections fold away: objectives and manoeuvre, units, sector leaders and the player's place, contingencies, and scouting. They are native `<details>` elements, and what the player folded stays folded across redraws.
- The combat panel and the running battle keep their compact layout.
- **To reverse:** set `PLANNING_LAYOUT` to `'compact'` in `src/ui/groundPanel.ts`. The CSS block is marked.
- At iPad width (820-1024 px) the sections stack, and their selects and rows wrap. Not yet seen in a browser (section 8).

## G. The growing-up quiz and creation (D-525)

### G1. Scenes by stage

- **Cause:** a stage counted only once half of it was behind. A 14-year-old Padawan had lived one year of the 3.5-year Padawan stage, so they drew Initiate scenes only.
- **Change:**
  - A stage counts once a quarter year of it is behind (`STAGE_LIVED_MIN`, invented).
  - Scenes are shared out weighted toward the latest stage (`stageAllocation`): at least one per stage, then by the stage's place in the order, so 3 stages and 6 scenes give 1 / 2 / 3.
  - A short stage tops up from the latest stages first.
- **The draws** (three seeds each):

| Start | Seed a | Seed b | Seed c |
| --- | --- | --- | --- |
| Youngling (Initiate, skip 6 to 7; 1 stage) | The prank; Lost and mocked; Out after curfew; A tie from outside | the same four, another order | the same four |
| 14-year-old Padawan (3 stages) | A tie from outside; The forbidden text; Not yet chosen; **Your first battle; The rival Padawan; Your master's flaw** | Out after curfew; A friend falling behind; The Gathering; **Your first battle; The order to withdraw; The rival Padawan** | The prank; Out after curfew; A friend falling behind; **The grateful stranger; Your first battle; The order to withdraw** |
| 20-year-old Padawan (4 stages) | 2 Initiate, then **6 Padawan** (The grateful stranger, Your first battle, The pirate who surrenders, Your mistake, Falling for someone, Injustice the Republic tolerates) | 2 Initiate, 6 Padawan | 2 Initiate, 6 Padawan |
| Non-Jedi civilian, 25, underlevels (3 stages) | A disaster; The security sweep; The gang's test; The hungry younger kid; The crime lord's errand | the same five | the same five |
| Non-Jedi soldier, 20, military family (3 stages) | A disaster; The unfair punishment; The stolen exam; The exercise gone wrong; Your first battle; The patron's offer | A disaster; the exercise; the deserter friend; Your first battle; the black market; the patron | A disaster; the stolen exam; the exercise; the deserter friend; Your first battle; the illegal order |

The civilian draws five, not six: the street pool has only six events, and the latest stage takes them first.

- **Test:** `tests/m8/fixesQuiz.test.ts` G1 checks five seeds: the 14-year-old Padawan always has Padawan scenes, the 20-year-old more Padawan than Initiate, the youngling Initiate only, and the civilian street and anyone only.

### G2. Accept started the campaign and swapped traits silently

- **Cause:** the quiz's Accept and Keep both called Begin straight away. The swap happened inside the game with no word on screen.
- **Change:**
  - Accept fills the trait dropdowns and returns to the form, naming each change ("Temperament: Hot-headed -> Loyal").
  - Keep and Skip return to the form too. Only Begin starts the campaign, and Begin is disabled while the quiz runs.
  - A slot that still holds the accepted suggestion at Begin goes to the game as the quiz's swap, so a tie still links to the quiz's person. A slot the player changed again counts as their own choice.
- **Test:** none automated. The flow is in the UI, so it is on the browser list (section 8).

### G3. Traits on the Character tab

- **Change:** a Traits card, with each trait's kind, how it came (creation, the formative years, the story), its note, upside and downside, and the person it is tied to (their relation, and "dead" or "not met yet").
- The species' own traits are now labelled "Species traits".
- **Test:** G3 covers `selectTraitRows`.

### G4. Quiz NPCs that fit the scene and the trait

- **Cause:** a quiz person got the role and faction of the scene's set (Initiate scenes made Jedi initiates) and the character's age at the scene. Creation-time family ties took the character's own faction.
- **Change:**
  - Each person has a kind:
    - outside the Order (a tie from outside, or family): a civilian;
    - younger (a ward);
    - elder (an officer, sergeant, patron, Sith Lord or agent), with the matching role;
    - otherwise a peer, with the role their age now gives (an Initiate clanmate of a 14-year-old is a Padawan).
  - Creation-time family and ward ties are civilians too.
  - The player's note on that scene:
    - **Read by code where it is reliable:** a relation ("older sister", "father", "friend", with older or younger), which sets the age; and a homeworld, only when stated with "from", "on" or "back on" a world the galaxy map knows.
    - **Kept on the NPC in plain words:** `relation`, `homeworld` and `playerNote` are stored by a new engine event, `npcBackgroundSet`. The memory lines give them to the narrator ("the character's older sister; homeworld Alderaan; the player says: ...").
    - Anything else in the note is not read by code, only kept for the narrator.
- **Test:** G4 covers the note reader, the kinds, and a real creation of a 14-year-old Padawan whose "tie from outside" note is "My older sister still writes from Alderaan". The result is a civilian outside the Order, relation older sister, homeworld Alderaan, aged 18, with the note kept.

### G5. Quiz NPC ages

- **Cause:** a quiz person was aged at the character's age at the scene. A clanmate from 10.5 was made 10 or 11, though the character is now 14.
- **Change:** ages are what they are now (invented):
  - a peer: the character's age;
  - a ward: 4 under;
  - an elder: 20 over;
  - someone outside the Order: 5 over, or the note's relation (an older or younger relative ±4, a parent, aunt or uncle +25, a grandparent +50).
- **Test:** in G4, the clanmate is 14 and a Padawan.

### G6. The Train list offered Sith-only drills

- **Cause:** the Train panel listed every activity. The training rules only refused one later, and warblade training had no path gate at all.
- **The rule (`selectTrainOptions`):**
  - **Left out:** an activity the path closes. That means a path-only activity of another path, and a dark-side power a Jedi does not already know, since the Order never teaches it. Covert learning stays in the story.
  - **Tried, then open or greyed:** everything else is tried through the same rules a session uses, with the teacher actually at hand: the master if present, the instructors of a Temple or academy, otherwise nobody. If it would be refused, it is greyed with the reason; an unknown Force power reads "needs a teacher who knows it".
  - Warblade training (Korriban) is now the Sith path's.
- **Test:** G6 checks that a Jedi Padawan with their master is not offered warblade training, Force Lightning or Force Choke control, that a Sith acolyte is offered the warblade, and that every greyed entry has a reason.

## 8. Not done, or left for Jared

- **Browser check:** not done in this session. Chrome was not connected. Worth a look in play:
  - F, the planning layout at iPad width (Jared to judge);
  - G2, the quiz's return to the form;
  - E1, the pending narration line;
  - G6, the greyed Train entries;
  - D2, the wound tag beside the bar.
- **The Vitality cap** for severe wounds waits for the realistic-damage build (D2).
- **Proposals:** the Sith Academy's basics, the pilot's screen, the Jedi front-line set (B2). Plus the reading on Jedi Masters' Tactics (B3).
- **The quiz's first-battle scene** gives War veteran with war years 0 (D1).

## 9. Every invented number

| Number | Where |
| --- | --- |
| The capture cue's words; a debt at the bounty stage, a bounty hunter, a flagged ship as cues | `CAPTURE_WORDS`, `PART_APPLIES.capture` |
| The tactic tiers (which tactics are basic, standard, advanced); the teacher's Tactics 0 / 20 / 50; an unknown teacher 30 | `tacticTier`, `TEACH_NEEDS`, `UNKNOWN_TEACHER_TACTICS` |
| A seen tactic at -2 | `SEEN_TACTIC_PENALTY` |
| "Used successfully": a won position roll, a strike on the hull or a system, a won fleet round, a ground phase won on balance | `usedTactic`, `stepGround` |
| The proposed sets: the Sith Academy's, the pilot's screen, the Jedi front line | `TACTIC_SETS` |
| Trait requirements: First kill 8, Ward 12, Forbidden bond 14, Old debt 16 (start age); war years from 14 | `requires`, `WAR_SERVICE_FROM_AGE` |
| A stage lived at a quarter year; scenes weighted toward the latest stage | `STAGE_LIVED_MIN`, `stageAllocation` |
| Quiz people now: peer +0, ward -4, elder +20, outside +5; relatives ±4, parents +25, grandparents +50 | `quizPersonAge`, `readPersonNote` |
| Creation family ties 5 over, wards 5 under (the ward's was already 5 under) | `traitCreationEvents`, `handleQuiz` |
| The planning story strip at 22% of the view height | `styles.css .main.planning .feed` |

## 10. Runs

| Run | Result | Time |
| --- | --- | --- |
| Schema sizes at 38cfd09 (a worktree) and after Part A | the table in section A | about 2 s each |
| `npm test` (final code) | 2,066 of 2,066 passed, 170 files | 38 s |
| `npm run typecheck`, `npm run lint` | clean | |
| `npm run test:all` (final code) | 2,122 of 2,122 passed, 185 files | 1,297 s (21.6 min) |
