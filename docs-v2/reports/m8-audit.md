# m8-audit: the m8-fixes review fixes, then an optimization audit (2026-11-26)

Two parts. Part A is a fix batch from Jared's review of reports/m8-fixes.md and his Claude in Chrome check of that build (decisions D-526, D-527, D-528; committed as "m8-audit part A"). Part B is an audit that changes nothing: findings ranked by impact, each with where it is, why it matters, a suggested fix and a rough size. Every number not from lore or Jared is invented; each is tagged where it appears and listed in A9.

## Part A. The fixes

### A1. Tactic starting sets (approved, D-526)

- The m8-fixes B2 proposals were already in the code as proposals. They are now marked approved in the code and the specs:
  - the Sith Academy teaches the same basics as a Jedi Padawan's set (`sithAcademy`), for an apprentice or Lord, and on promotion from acolyte;
  - a pilot knows the starfighter screen (`pilotFleet`, the `republic-pilot` start);
  - a Jedi at the front knows flanking and ambush (`frontLine`, the `jedi-front` start).
- **Test:** `tests/m8/auditA.test.ts` A1.

### A2. Masters who can teach (D-526)

- **Cause:** the measured Jedi and Sith paces have no Tactics row (the routine has no tactics block), so every generated Jedi Knight, Master and Sith Lord had Tactics 0 in every era and could teach only the basics (the bar for standard tactics is 20, advanced 50).
- **Change:** a closed-form Tactics row on top of the measured paces, no hours moved (the D-191 pattern for Force abilities). `ORDER_TACTICS_PACE` in `src/data/archetypes.ts` (all invented):
  - Padawan (apprentice) phase 0.22 a year: missions with the master, the Temple's briefings and military history;
  - Knight (Lord) phase 0.42 a year: a Knight's own missions;
  - initiates and acolytes none;
  - a war year served 1.4 (it replaces the general war term, 0.3 x the pace now, for this row only: `warPace` in `closedFormLevel`).
- The Sith lines take the same shape. A sheet that gives Tactics keeps it.
- **Before and after** (medians of 21 generated humans; 40 for the "before" column, all 0):

| Generated NPC | Year (war years) | Before | After |
| --- | --- | --- | --- |
| Jedi Knight, 30 | 500 BBY (0) | 0 | 20.0 |
| Jedi Master, 50 | 500 BBY (0) | 0 | 35.2 |
| Jedi Master, 70 | 500 BBY (0) | 0 | 41.9 |
| Sith Lord, 40 | 500 BBY (0) | 0 | 28.0 |
| Padawan, 16 | any (0) | 0 | 7.4 |
| Sith acolyte, 16 | any (0) | 0 | 0 |
| Jedi Knight, 30 | 3,661 BBY (14) | 0 | 49.9 |
| Jedi Master, 50 | 3,661 BBY (20) | 0 | 67.2 |
| Sith Lord, 40 | 3,661 BBY (20) | 0 | 62.9 |
| Jedi Knight, 30 | 3,640 BBY (1) | 0 | 23.0 |

  The spread round each median is about -18% to +40% (talents and the NPC variance): a peacetime Knight 16-28, a Master 29-49.
- **Canon lines that move:** a canon Force user with a Tactics value on a sheet keeps it (checked: Oteg's sheet 72 at 3,642 holds). The 95 canon Force users without one moved from 0 to about 20-39 when read at age 45 (canon lines carry no war years, so they get the peacetime row). One line moved from a non-zero value: Oteg before his sheet's date, 21.4 -> 31.0 at 3,799 BBY (the line is fitted to the sheet at 3,642). The figures in the Great War who were commanders now read about 26-35 at 45: Satele Shan 32.0, Darth Malgus 32.3, Darth Marr 28.8 and Orgus Din 31.0. **For Jared:** the war commanders deserve hand-set Tactics on their sheets (Satele Shan, Malgus, Marr, Orgus Din, Tol Braga, Kao Cen Darach); the row only gives them the curriculum.
  - The full list (name, year read, after; all were 0): Vitiate 36.9, Scourge 36.9, Darth Malgus 32.3, Darth Marr 28.8, Darth Baras 28.8, Darth Angral 28.8, Darth Jadus 28.8, Dread Masters 36.9, Darth Vindican 28.8, Darth Vowrawn 28.8, Darth Thanaton 34.8, Darth Zash 28.8, Darth Mekhis 28.8, Darth Acina 28.8, Exal Kressh 18.0, Zym 31.0, Kao Cen Darach 30.9, Satele Shan 32.0, Orgus Din 31.0, Dar'Nala 31.0, Ngani Zho 31.0, Gnost-Dural 31.0, Ven Zallow 31.0, Jaric Kaedan 31.0, Tol Braga 31.0, Syo Bakarn 26.0, Bela Kiwiiks 31.0, Revan 38.8, Hero of Tython 32.0, the Barsen'thor 31.7, Emperor's Wrath 28.8, Darth Nox 25.9, Kira Carsen 31.5, Aryn Leneer 32.7, Sajar 28.6, Fortris Gall 29.4, Nomen Karr 33.2, Warren Sedoru 30.0, Ardun Kothe 32.4, Belth Allusis 30.3, Shol Bestros 30.2, Jerbhen Hulis 30.5, Wyellett 30.0, Xerender 30.4, Bengel Morr 28.7, Tasiele Shan 34.2, Parkanas Tark 37.5, Kellian Jarro 30.4, Yuon Par 30.5, Leeha Narezz 31.4, Aurei Eadon 33.0, Ako Domi 26.8, Nadia Grell 31.9, Ashara Zavros 34.4, Meetra Surik 28.0, Darth Ekkage 27.5, Darth Vengean 29.0, Darth Azamin 29.9, Darth Decimus 27.2, Darth Ravage 26.2, Darth Mortis 33.4, Darth Rictus 29.8, Darth Karrid 22.1, Darth Hadra 27.2, Darth Arkous 28.7, Darth Arho 29.9, Darth Ikoral 26.4, Raptus 28.9, Bestia 31.4, Brontes 28.7, Calphayus 26.7, Styrak 30.8, Tyrans 29.8, Tarnis 28.2, Praven 20.2, Adraas 24.5, Darth Venemal 22.0, Darth Lachris 26.4, Calypho 28.5, Darth Skotia 26.6, Darth Vich 10.1, Darth Gravus 25.3, Darth Charnus 27.8, Darth Serevin 31.3, Darth Tormen 27.2, Harkun 29.4, Spindrall 28.8, Tremel 31.5, Ragate 32.3, Grathan 30.3, Xalek 27.3, Jaesa Willsaam 22.9, Lana Beniko 32.4, Luke Skywalker 29.5 (read at 26 ABY). Unchanged at 0: Nefarid, Ffon Althe.
- **Readings for Jared:**
  - every generated Jedi in 3,661 BBY now reads as a war veteran for Tactics: the generator gives every combatant role war years for the Great War (`warYearsFor`), so a Knight of 30 has 14. That matches "Jedi who served at the front", but it applies to every Jedi of that age, including a scholar Consular.
  - the closed form now gives Tactics the player's own day loop does not train. A player Jedi learns Tactics by study, teaching and battles. A loop counterpart would need a Tactics block in the Order rows and a re-measure of every Order pace (B2 finding P1).
  - only the Great Galactic War is in the generator's war list (Part B, D1): a Clone Wars Jedi General has no war years and reads 20, not 50.
- **Test:** auditA A2 checks the peace and war targets, the Sith shape, and a created Knight. `tests/m8/fixesTactics.test.ts` B3 was updated: the generated Master of 3,661 now teaches the ambush; a scholar with no Tactics still cannot.

### A3. The quiz's "Your first battle" (D-528)

- **Change:**
  - formative events have `implies`; the three "Your first battle" scenes (Padawan, Sith, military) imply war years of at least 1.
  - Accept or Keep raises the form's war years and names it in the line after the quiz ("War years: 0 -> 1 (your first battle)"; the line now reads "Changed on the form above").
  - A campaign whose quiz has a first battle and fewer war years is refused ("Your first battle (formative years) means war years of at least 1").
  - War years are capped at the years since 14 with a year begun counting (it was rounded down, so a 14.5-year-old Padawan who fought a first battle could record none): 14.5 allows 1, exactly 14 none.
  - A first battle is drawn only when the form could record a war year by the start (a character exactly 14 does not draw it).
- **Other scenes checked:** no other scene implies a form number. The Sacking's scene already needs the character on Coruscant in 3,653 (origin or homeworld); the Force-sensitive scenes read the path.
- **Test:** auditA A3 (the implication, the refusal). Three older traits tests and one m8-fixes quiz test answered a first battle with war years 0; they now pass the war years the answers imply.

### A4. The wounded commander (D-527)

- **Found in play:** a Knight with a mortal wound and 12 minutes to live, after fighting in person during a ground battle, kept every battle order.
- **The rule** (`src/features/battles/command.ts`):
  - **out of the fight** is dying, or incapacitated (health §6: cannot fight). A severe wound that leaves them in the fight keeps command, with the wound's penalty in their performance (the commanders' roll reads it).
  - **By default** command passes to the next in line at once. Ground: the best named leader of ours still leading a sector, else a second-in-command at Tactics 40 (invented); a sector leader's sector goes to its unit's officers. Ships: the first officer.
  - The panel shows it at once ("command has passed": no manoeuvre, reserve or withdrawal; no own fight or falling back). The first order after it records the hand-over and plays no phase or round, so the player can choose.
  - **Medical help:** when the battle next moves on, the medics reach the player if any can (ground: our troops still standing; ships: their ship still standing). A dying player is stabilized (`woundsStabilized`); otherwise "No one can reach you yet" and the clock runs.
  - **The exception, the player's choice only:** "Stay at your post", offered as its own option with its cost in words beside it, not only in a tooltip ("you are dying: you keep command, no medic comes, and the clock keeps running"). Command (or the sector) stays theirs. The narrator never forces it.
  - **NPC commanders:** an NPC commander out of the fight by its wounds rolls the ground commanders' roll as a second-in-command (40). The fleet's NPC commander passing on was already built. Canon fates stay with the tag rules.
- **Reading:** the medics' stabilization is automatic (no Medicine roll). A Medicine roll by the unit's medic could replace it later.
- **Test:** auditA A4: the rule; a commander out of the fight loses the command panel, the next in line commands, no phase plays on the hand-over, the medics stabilize on the next phase; staying at the post keeps command and the wound stays unstabilized; a fit commander cannot "stay at the post"; the fleet's first officer takes and gives back command.

### A5. The planning panel layout (D-528)

- **Cause:** the story choices from before the battle stayed under the planning panel.
- **Change:** while a battle is planned or runs, the story choices are hidden. A running ship or ground battle's panel takes the column too (`main battle-on`: the story above kept to about a quarter of the view).
- **Not seen in a browser at iPad width** (820-1024 px). The planning layout stacks its sections below 900 px (m8-fixes F). The battle panel's map is a 36-column `pre` with horizontal scroll inside the panel.

### A6. The Train list (D-528)

- **a. Plain words:** "needs a Padawan of your own" ("an apprentice" on the Sith path), "name the Force ability to drill", the melee styles by name, and no decision number ("D-459") in the saber-gate reason. The m8-fixes C1 identifier test now covers the Train reasons for five characters, and also refuses decision numbers.
- **b. Path entries:** the Padawan's session is the Jedi path's, the apprentice's the Sith path's, Dun Möch the Sith path's. Checked the rest: Jedi Code is the Jedi path's (already); warblade training the Sith path's (m8-fixes G6); "Teaching a Padawan" reads for both paths (its name says Padawan; left, minor).
- **c. Juyo and Vaapad apart:**
  - "Juyo basics" (keeps the id `juyoVaapadBasics` so saved routines read): known, or a teacher who knows it (an NPC with the form, the Order's instructors or the master's session, a record that covers it).
  - "Vaapad basics": the D-370 gate (from its creation by Windu and Bulq).
- **Test:** auditA A6.

### A7. Test characters' traits (D-528)

- **Chosen:** the card says "Test character: no traits (a test start skips the trait choice)". No default set was invented: traits move rolls, money and people, and a test start is for testing the rest.
- **Test:** auditA A7.

### A8. Notices after a new campaign (D-528)

- **Change:** a status notice records the campaign it was raised in (`src/ui/notices.ts`). Starting or loading another campaign never shows it.
- **Test:** auditA A8.

### A9. Every invented number in Part A

| Number | Where |
| --- | --- |
| The Order's Tactics: Padawan phase 0.22 a year, Knight phase 0.42, a war year 1.4 | `ORDER_TACTICS_PACE` |
| A second-in-command nobody named: Tactics 40 | `SECOND_IN_COMMAND_TACTICS` |
| Medics reach the player while our troops stand (ground), the medical bay while the ship stands; automatic stabilization | `groundHelpReaches`, `shipHelpReaches` |
| A war year begun counts (ceil) | `creation.ts` war years cap |
| A first battle implies war years 1 | `implies` (formativeEvents.ts) |
| The running battle's story strip at 26% of the view | `styles.css .main.battle-on .feed` |

### A10. Runs

| Run | Result | Time |
| --- | --- | --- |
| Tactics measurement (temporary test: 40 NPCs x 6 roles x 4 years, 97 canon lines), before and after | the A2 tables | about 10 s each |
| `npm test` (final Part A code) | 2,082 of 2,082 passed, 171 files | 36 s |
| `npm run typecheck`, `npm run lint` | clean | |
| `npm run test:all` (final Part A code) | 2,138 of 2,138 passed, 186 files | 1,327 s (22.1 min) |

The test:all run shared the machine with a few short measurement tests (seconds each) during its first minutes.

## Part B. The audit (report only: nothing changed)

How the findings were gathered: temporary measurement tests (deleted after; numbers below), greps over `src/`, a scan of exported names, and reading the code. "Size" is the fix's rough size: small (an hour or two), medium (a session), large (more than a session or needs a ruling). Findings are ranked by impact within each group; the overall top twelve are first.

### The top twelve

| # | Finding | Group | Size |
| --- | --- | --- | --- |
| 1 | The state block's fixed lines (1,236-1,666 tokens) are over its own 1,500 cap in every situation, so known IDs are dropped even in a fresh game | caps | medium |
| 2 | The narrative schema core is 63% of the cap at its largest (target well under half); measured savings below get it to about 49% without a ruling, about 40% with one | caps | medium |
| 3 | The generator knows one war (the Great Galactic War); the traits know twelve. Clone Wars Jedi Generals have no war years (Tactics 20, not 50; no combat experience from the war) | duplication, data | small |
| 4 | Flash's free-tier daily limit is 20 requests (the unverified default), so a session's story turns move to Flash-Lite after about 15-20 turns; every turn sends about 18,000 input tokens | cost | medium |
| 5 | The pace window is about 97% of the save (about 530 characters a day, about 190,000 at a full year) and is written every turn | speed | medium |
| 6 | Era-dependent closed forms are run at 1 ABY in two places (`selectPaceForAge`, the instructors' stub): a 3,661 BBY character's pace for age is measured against the Average of another era's curriculum | bug class (dates) | small |
| 7 | The narrator controls teaching: any named teacher the game does not know counts as Tactics 30, and a narrator-made "General" is Tactics 74 at once | bug class (narrator-owned state) | small |
| 8 | The lore section is about 2,200 tokens on every turn, even alone in the wilds (ten years of timeline rows), and the stable text sits after the history, so none of it can be cached | cost | medium |
| 9 | Health §8 (pain suppression: Control Pain, Battlemind, Force Valor, pain channeling, the crash) has engine functions and tests but no way into play; `health.suppression` is never written | dead code | medium (a ruling first) |
| 10 | No saved games from past versions are kept as fixtures; five slices' migrations (locations, npcs, pacing, ranks, world) have no test by name | data | medium |
| 11 | A "skip a year" stopped after 4-83 days on interruptions in 3,661 BBY: a year takes 5-10 narrated turns | speed | small (a ruling) |
| 12 | Battle options' strengths, weaknesses and refusal reasons are only in tooltips; on an iPad they cannot be read, and a disabled button cannot even be focused | UI | small |

### B1. Caps and headroom

**C1. The narrative schema (top item).** Measured on the 20 m8-fixes situations at Part A's code (sizes unchanged by Part A, which adds no AI fields):

- core alone: 6,053 fresh (50%), 7,553 at its largest (63%);
- largest situation: 9,866 with a bounty hunter present (82%; core + people + capture + goods); without one, the largest combination 9,644 (80%).
- Where the largest core goes (characters): the events 6,527, the choices 628, the scene 254. By event: combatStarted 1,049, npcIntroduced 871, locationIntroduced 560, threadOpened 418, traitMoment 392, factLearned 389, hazardOccurred 318, emotionalEvent 308, relationshipChanged 288, threadResolved 244, npcStatusChanged 241, pacingSuggested 221, timeElapsed 218, flagSet 215, threadProgressed 179, locationChanged 150, milestoneBeatAcknowledged 150, sceneEnded 135, the droid event 126. Field descriptions are 690 of the core's characters.
- **Options, with what each saves** (characters off the core; the situational parts lose the same where they repeat):

| Option | Saves | Ruling needed | Size |
| --- | --- | --- | --- |
| a. npcIntroduced `role` as words, resolved by the code (the species pattern, D-523): the 24-role list | about 245 | no (an approved pattern) | small |
| b. combatStarted's minion `kind` as words (19 kinds), resolved by the code | about 225 | no | small |
| c. combatStarted's `terrainTags` as words (18 tags) | about 185 | no | small |
| d. traitMoment only when a held trait (or the quiz) can use it, or its 13 moments filtered to the held traits' | 176-392 | yes (it is core today) | small |
| e. Field descriptions moved into contract.md (the prompt), where they cost tokens but not schema characters | about 600 | no | small |
| f. npcIntroduced `faction` as words (9 factions) | about 85 | no | small |
| g. combatStarted in its own part (cues: someone hostile present, the player's words of a fight, a danger the state shows) | about 1,050 | yes (Jared kept combat starting in the core, D-520) | medium |
| h. Merge thread events into one `thread` event with an `act` field | about 300 | yes (proposal 3 was rejected: thread events stay core) | small |

  a + b + c + e + f save about 1,340: the core's largest 7,553 -> about 6,210 (52%), fresh about 4,710 (39%); the bounty-hunter situation 9,866 -> about 8,530 (71%, under m8-ground's 75%). With d (the full 392) the core's largest is about 5,820 (49%). With g on top, about 4,770 (40%).
  - Not recommended: `$ref` shared definitions. The repeats are short (a ref array is 46 characters), and Gemini's support for `$ref` in `responseJsonSchema` would need a live check first.
- **Why it matters:** each new situational field fights for the last 18%; the core is what every turn pays for.

**C2. The state block over its cap.** `stateBlock` (src/turn/context.ts:294) caps only the ID lines; the fixed lines are never cut. Measured (ratio 4):

| Situation | Fixed lines | Whole block (cap 1,500) | IDs dropped |
| --- | --- | --- | --- |
| alone in the wilds | 1,386 | 2,029 | 2 |
| an army officer | 1,236 | 1,880 | 1 |
| the spaceport with the ship | 1,571 | 2,214 | 3 |
| a ship battle | 1,641 | 2,284 | 3 |
| everything at once | 1,666 | 2,309 | 7 |
| a late campaign (150 NPCs, 60 places, 25 threads, 200 facts) | 1,446 | 2,089 | 238 |

  - Once the fixed lines pass the cap no ID line fits at all; the present NPCs and the current place survive only because their IDs are inside the fixed "Present:" and "Location:" lines. Every other known entity (open threads, the master when absent, places in the chain above) is dropped, and the narrator is told "do not reintroduce them by name" without their IDs.
  - The longest fixed lines: VALID SKILLS 589 characters (53 ids, every turn), the SHIPS instructions 505, DROIDS 432, the era's rank names 385, TACTICS 319, three era rules about 300 each, closed worlds 290, canon figures here 225, leaders 224, holocrons 209, ECONOMY 190.
  - **Fix:** move the static instructions (SHIPS, DROIDS, TACTICS, ECONOMY: about 1,450 characters, 360 tokens) into prompt sections sent only when their part applies (the schema's parts already know when); send VALID SKILLS only when the reply may name a skill (choices' `skillId`, tacticStudied); count the fixed lines against the cap and give the IDs a floor (the focus IDs always fit). **Medium.**

**C3. The other context budgets** (ratio 4; history of 40 turns of 2,200 characters):

| Section | Cap | Measured | Note |
| --- | --- | --- | --- |
| gmRules | 5,000 | 3,392 (moment, scene), 3,561 (montage); **5,674 in a fight**, 5,842 a fight in montage | the combat prompt (9,125 characters) pushes it over; gmRules is reported, never cut |
| state | 1,500 | 1,880-2,309 | C2 |
| recentTurns | 8,000 | 7,910 | at the cap after about 8-14 real turns, by design |
| memory | 4,000 | 22-237 (situations); 4,028 late campaign (297 items dropped) | fills as the campaign grows, by design |
| lore | 3,000 | 2,178 every situation; 2,487 with a canon figure | ten years of timeline rows (B2) |
| arc | 1,000 | 956 at its cap | capped at 4,000 characters (MEMORY_LIMITS.arc) |

  - **gmRules in a fight:** trim combat-narration.md (9,125 characters, the largest prompt file) or raise the cap honestly. **Small.**

**C4. Gemini output limits.** The narrative's output cap is 700 (moment), 1,000 (scene), 1,200 (montage, skip) tokens, plus 300 for the JSON's choices, scene and events (D-58), plus 1,024 of thinking headroom. An event-rich reply (an opening: several npcIntroduced and locationIntroduced with descriptions, five factLearned at 300 characters each) can need 600-900 tokens of JSON alone, so it eats into the narrative or is truncated (then one retry at 1.5x, a second call). **Fix:** size the JSON allowance from the turn's legal events (the opening and arrivals get more), or measure first: the usage log records finishReason; count MAX_TOKENS over Jared's real turns. **Small.**

**C5. Lists that grow with the campaign.** Capped: the world log (50), the economy log, battle history and tallies (500, 50, 30, 20), blockade runs, ship logs (30), possessions history (200), the ground log (40), the pace window (365 days). **Not capped:** memory facts (up to 5 a turn), chapters, the review queue, NPCs (each named one with its own health and generation inputs), relationships, locations, threads and their notes, tactics seen. None of these is sent whole (retrieval picks), but all are saved and loaded every turn (B3, S2). **Fix:** archive resolved threads' notes and departed NPCs' health into a cold store after a year of no contact; cap the review queue (oldest dismissed items go). **Medium.**

### B2. Cost per turn

**P1. Tokens sent per narrative call** (estimated at 4 characters a token; the Debug tab's real numbers were not available to this session):

| Turn | Total | gmRules | state | recentTurns | memory | lore | arc | schema |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| an ordinary story turn (the situations) | 17,700-18,600 | 3,392 | 1,880-2,309 | 7,910 | 22-237 | 2,178-2,487 | 0 | about 2,250 |
| a fight about to start | 20,637 | 5,674 | 2,161 | 7,910 | 77 | 2,178 | 0 | 2,250 |
| a late campaign | 22,847 | 3,392 | 2,089 | 7,910 | 4,028 | 2,178 | 956 | 2,250 |

  The history is about 44% of every call, the rules 19% (27% in a fight), the lore 12%, the schema 12%, the state 11-12%.

**P2. Calls in a day of play.** Per turn: a clicked choice or a battle turn 1 call (quiet battle phases and quiet beats none); typed text 2 (the intent on Flash-Lite, small, then the narrative); plus a second narrative call when the narration check finds a contradiction (D-197) or the reply is truncated (D-16); plus a summary call (Flash-Lite) at each chapter close (at most every 30 turns; at 8+ turns on a scene end; on a move between major places; on a skip of 7+ days). A 40-turn evening with half the turns typed is about 40 narrative calls, 20 intent calls, 2-5 summaries and a few retries: about 65 requests. **The binding limit is Flash's daily 20** (DEFAULT_LIMITS, unverified, D-68): the story moves to Flash-Lite about halfway through the evening.

**P3. What can be trimmed, cached or sent less often:**

| Change | Saves a call | Size |
| --- | --- | --- |
| a. Put the stable text first: the rules, then the year's lore, era rules, rank names and valid skills (the same all day) as a fixed prefix, then the history. Gemini's implicit caching discounts a repeated prefix; today only the system text (about 3,400 tokens) is stable, because the history slides by one turn every call | up to about 6,000 tokens billed at the cached rate | medium |
| b. Slide the history in steps (drop the oldest 4 turns at once, not one each turn), so the prefix stays the same for several calls | more of the 7,900 cached | small |
| c. Lore: the year's timeline rows only when the year changes or the player asks, with a one-line "this year" summary otherwise | about 1,500-2,000 | medium |
| d. C2's static instructions only with their part; VALID SKILLS only when a skill can be named | about 500 | small |
| e. Trim combat-narration.md (fights) | about 1,000-1,500 in fights | small |
| f. Typed text that a choice-like phrase covers ("I wait", "I rest") resolved without the intent call | 1 intent call per such turn | medium |

  Explicit caching (Gemini's cachedContents) would cache the rules and lore for hours; it is billed for storage on paid tiers and its free-tier terms need checking before relying on it.

### B3. Speed

Measured in Node on this PC (a desktop CPU). iPad Safari runs the same JavaScript, usually 2-4 times slower on this kind of work (a reading, not measured).

| What | Measured |
| --- | --- |
| A story turn's code (resolve, no intent) | under 1 ms |
| A 3-day montage | 17 ms |
| A time skip, per day of game time | about 12 ms (44 days in 0.54 s, 68 days in 0.84 s); a full year about 4.5 s, so perhaps 10-20 s on an iPad |
| The save (JSON) at the start | 5,862 characters; loaded (migrations and the whole Zod check) in 21 ms the first time, 1-8 ms after |
| The save after 250 days of skips | about 135,000 characters, of which `progression.paceWindow` is 132,367 |

**S1. The pace window dominates the save** (src/features/progression, D-48). The 365-day ring of daily credited XP and hours per skill grows about 530 characters a day and levels off near 190,000 at a full year: about 97% of the save, written in the turn's commit every turn (and kept in the autosave and the slots). **Fix:** store the ring as compact numbers (fixed-precision arrays per skill, or weekly buckets: the 4.0x clamp reads a 365-day sum, so 52 weekly sums with the current week's days would do). That cuts it about 10x. **Medium; the biggest save and load win.**

**S2. Skips stop early.** Each "skip a year" in the measurement stopped after 4 to 83 days on an interruption (world events in 3,661 BBY, a war year). By design (D-134: jumps stop on a significant event), but at that rate a year takes 5-10 turns, each with a narration call. **Fix:** let minor world events go into the skip report without stopping, stopping only for those about the character (a reading for Jared). **Small, a ruling.**

**S3. Load.** The whole-state Zod check runs on every load: 1-21 ms in Node at these sizes; not a problem now. After S1 it stays small.

**S4. The test suite.** test:all ran 1,327 s (22.1 min) this session: 186 files, 2,138 tests. `npm test` (171 files: everything but the lifetime suite and the long runs) takes 34-38 s, so the 15 lifetime files are about 97% of test:all.

The lifetime suite alone (`vitest run tests/lifetime` with the JSON reporter, 8 workers): 56 of 56 passed, **1,234 s wall**. Per file (the reporter's file times; the four profile files and the 3,661 file run their lives in setup hooks, which it does not attribute, shown as 0):

| File | Time | Tests | Slowest test |
| --- | --- | --- | --- |
| forceSense.test.ts | 417 s | 6 | 140 s (the Jedi Guardian at Knight and at Master) |
| archetypesJedi.test.ts | 319 s | 3 | 114 s (the Guardian's 25-year day loop) |
| archetypesSith.test.ts | 106 s | 3 | 44 s |
| archetypesCareer.test.ts | 105 s | 4 | 29 s |
| duelTables.test.ts | 87 s | 4 | 34 s |
| archetypesCareer2.test.ts | 39 s | 2 | 22 s |
| average, luke, anakin, obiwan, lukeAccelerated, swordmaster, closedForm, knowledge, era3661 | (setup) | 34 | |

- The attributed files sum to 1,073 s of work against 1,234 s of wall time with 8 workers: the run is not spread well. Vitest runs a file's tests one after another in one worker, so forceSense.test.ts alone (417 s, six day-loop lives in one file) and archetypesJedi.test.ts (319 s) set the floor, while the profile lives wait in setup hooks.
- **Fixes, without losing coverage:**
  - split forceSense.test.ts and archetypesJedi.test.ts one life per file, as the archetype tests were already split three ways (`archetypeCase.ts`): the wall time falls toward the longest single life (about 140 s) plus the profiles. Estimate 1,234 s -> about 500-700 s. **Small.**
  - the Jedi Guardian's 25-year loop runs in both forceSense and archetypesJedi; one shared, cached run per seed and archetype (a file cache keyed by the code's hash, or one test file asserting both) removes a duplicate life. **Medium.**
  - the day loop itself: about 12 ms a game day (S2's figure) is the cost every life pays; S1's compact pace window also speeds the loop (it rewrites the ring every day). **Medium.**
- Runtime of the long runs this session: test:all 1,327 s; the lifetime suite alone 1,234 s.


### B4. Bug classes seen this milestone, searched for everywhere

**D-dates. BBY dates as negative seconds.** The m8-droids bug (an ion overload's end floored at second 0, so it never ended in a BBY year). Searched every `Math.max(0, ...)` and `?? 0` on absolute days and seconds:
  - **`selectPaceForAge` and the instructors' stub** (src/features/ranks/selectors.ts:98 and :246) build their characters with `birthDay: 0` (1 ABY). The closed form reads the year for the Jedi Initiate curriculum and the forms that exist then (D-459, D-463), so a 3,661 BBY character is compared with an Average of the 0-60 ABY curriculum. **Fix:** pass the character's own birth day. **Small; top twelve #6.**
  - The economy's old-save starting slice uses start day 0 (src/features/economy/index.ts:141). Harmless today (an old save has no trait debt, the only use), latent. **Small.**
  - The rest are differences of days (`day - since`), safe.

**D-sheets. Sheet values not overriding generated lines.** Every level read goes through `selectNpcLevels`, where a canon figure's sheet wins (checked); combat's minions read their kind's profile (by design). Part A's Tactics row exposed the gap the other way: the canon war commanders have no Tactics on their sheets, so they read the curriculum's 26-35 (A2). **Fix:** hand-set Tactics for the commanders (a lore pass). **Small.**

**D-words. Plain-words fields used as workarounds for the schema cap:**
  - combatStarted `ships` ("enemy: ...; allies: ...; mine: ...; ambush"), read by regex;
  - groundBattlePlanned `details` (defending; terrain; weather; commander; meditator; enemy meditator; command; jammed), read by regex;
  - the droid event's `what` with `ship:`, `tactic:`, `item:` prefixes, still routed although the dedicated events exist since D-520;
  - tacticStudied `what` ("taught X by Y", "practised"), read by regex.
  Once C1 frees room, `details` can become fields inside the command part (that part's situations are 8,357-8,820: room for about 300 characters of fields), and the droid event's prefixes can be retired. **Medium.**

**D-legacy. Formulas carried over from legacy/.** None found in the code; the legacy references left are comments (the time-of-day bands are D-73's decided reading).

**D-codes. Result codes or internal names on screen.** Fixed in this milestone: the ground phase codes (m8-fixes C1), the Train reasons and a decision number in the saber gate (A6). Left:
  - refusal reasons built from ids: `only for padawan or apprentice`, `only for the outsider path` (lower-case ids that read as words; `career` and `outsider` read oddly). **Small.**
  - no test covers the side panel's other texts (the Tactics, Possessions and Character tabs) for identifiers. **Fix:** a test that renders each tab's rows through their selectors for five characters and applies A6's identifier rule. **Small.**

**D-narrator. State the narrator can change that the code should own:**
  - **Teaching:** any named teacher the game does not know counts as Tactics 30 (`UNKNOWN_TEACHER_TACTICS`), enough for standard tactics, so "taught the ambush by Sergeant Kell" always works; and an `npcIntroduced` "officer" or "general" is Tactics 74 or more at once. **Fix:** an unknown teacher teaches only the basics; a teacher must be in the scene. **Small; top twelve #7.**
  - **Presence** (`scene.presentNpcRefs`) decides the teacher at hand (the Train list's master session), the leaders a ground plan may name, and the capture cue (a bounty hunter present). By design (D-13), but a narrator who lists the master as present opens the master's session. **Fix:** none needed now; note it if training exploits appear.
  - `locationIntroduced.moveHere` moves the player outside battles (by design, D-84).

### B5. Duplication and dead code

**U1. Two war lists** (top twelve #3). `WARS` (src/data/npcGen.config.ts:132) has only the Great Galactic War; `FORMATIVE_WARS` (src/data/traits.ts:445) has twelve (the Great Hyperspace War to the Second Galactic Civil War). A Clone Wars Jedi General is generated with war years 0: no war E, no front-line Tactics. D-438 says one dated list. **Fix:** one war list in data with the factions per war, read by both. **Small** (the factions per war need a lore check).
  - The veteran age is two constants: `VETERAN_AGE` (traits rules) and `WAR_SERVICE_FROM_AGE` (creation), both 14. **Small.**

**U2. Rules built and tested but not in play:**
  - Health §8 pain suppression (top twelve #9): the wound penalty takes a `suppression` share (engine/wounds.ts `PenaltyInputs`) that no caller passes; `suppressionCrashMental` and `SUPPRESSION_CRASH_MENTAL` are called only by tests/engine/health.test.ts; `health.suppression` is never written; no ability (Control Pain, Battlemind, Force Valor, pain channeling) starts one. Only the passive Willpower share (Q40) is in play.
  - `TRAIN_INJURED_WORSEN_CHANCE` (health §7: training the injured part risks making it worse): never read.
  - Martial styles: `terasKasiStrike`, `precogDefence`, `stackedSkill` used only by tests (check whether the duel reads them another way).
  - `lastingChance` (healing.ts) is test-only; medicine reads `LASTING_CHANCE` directly: two paths to one rule.
  - **Fix:** a ruling per item: wire it, or delete it with its spec line. **Medium.**

**U3. Never-used exports: 73** (from a scan of every `export` in src against src, tests and scripts). Constants never read include `SPARRING_ACCIDENT`, `DISENGAGE`, `BACTA_SWITCH_PENDING`, `AMBUSH_TRACK`, `BATTLE_LIMITS`, `ACTIVE_PHASE_HOURS`, `MAX_UNITS`, `RANK_AGES`, `AVERAGE_INSTRUCTION`, `TRAINING_DAYS_PER_YEAR`, `PEER_DISCUSSION_RATE`, `FORCE_NEGATING_CREATURES`, `DEFAULT_SPECIES`; selectors never called include `selectInBattle`, `selectTalents`, `selectFocusWeights`, `selectMainForm`, `selectNowAbsSecond`, `selectPendingFight`, `selectInCombat`, `selectDuel`, `selectEconomy`, `selectWoundLoad`, `selectReview`, `selectTier`, `selectEffectiveLevel`, `selectWillpowerToday`, `selectInsight`, `selectRoutines`, `selectHasTrait`, `selectTraitAlignment`. Some constants document a rule the code applies by another name; each needs a look before it goes. About 60 more exports are used only by tests (test harnesses such as `runFleet` and `runGround` are fine; `eraRulesAt`, `controlOnRecordAt`, `KOLTO_SUPPLY_EVENTS`, `canBeBoarded`, `setDroidControl`, `rustAfterUnused` suggest rules the game does not call). **Medium.**

**U4. Old fallbacks for in-flight saves:**
  - battles saved before m8-fixes: `knows()` keeps the old "commander's basics" path when `seenOnly` is absent (rules.ts:520); `usedInOldBattles` reads the last battles for the tactics migration; ground scenes without `seenOnly` or `planKnows`;
  - settings saved before D-80 (`legacySettingsSchema`, src/ai/settings.ts:44);
  - stale comments: `REQUIREMENT_ROW` "Sith on the Jedi rows until M7", the order requirements' header.
  **Fix:** once Jared has no save from before m8-fixes in play, a slice migration fills the absent fields and the fallbacks go. **Small.**

### B6. Data

**T1. Save migration** (top twelve #10). No real saves from past versions are kept (tests/fixtures holds only AI replies). Migrations with a test: character, health, progression, tactics, and the envelope's generic fixture (persist.test). Without one by name: locations, npcs, pacing, ranks, world (v2-v5). **Fix:** export a save at each milestone's tag (from the dev test start), keep them in tests/fixtures/saves, and load each through `loadEnvelope` in a test. Saves from tags before today cannot be made now without checking out each tag; report which load. **Medium.**

**T2. Dated-data gaps:** the war list (U1); ranks, ships and droids are single dated lists already checked by their tests (era tests in tests/m8/world3661, eraRulesColdWar, otherMaps). A scan of the 44 data arrays keyed by id found no duplicate ids except `DUELISTS` (Revan 3, Vitiate 3, Scourge 2, Malgus 2, Luke 2: dated rows of one figure, intended; worth a comment) and no reversed date ranges. The scan misses catalogs kept as records (most of them), whose keys cannot repeat. **Small.**

**T3. Tag maps and the lore index:** covered by tests/m8 world tests and tests/lore (the lore index is rebuilt and checked for determinism before every test run). Not audited further here.

### B7. UI on an iPad (820-1024 px, touch)

- **I1. Tooltip-only information** (top twelve #12): battle options put their strengths, weaknesses and refusal reasons in `title` (groundPanel.ts:202, battlePanel.ts:78; the ship panel shows strong and weak only once picked, never the reason); the duel panel's disabled Force actions explain themselves in `title` (duelPanel.ts:400-405); the usage meter's warnings, the XP numbers on skill bars, the status line's full error text (cut with an ellipsis) are tooltips. A disabled button cannot be focused or tapped, so its reason is unreachable. **Fix:** a "why" line under each group (as A4's stay-at-post line), and the status line wraps instead of cutting. **Small.**
- **I2. Nested scroll boxes:** the duel panel's fighter list (`.duel-fighters`, 7.4 rem) and log (`.duel-log`, 9 rem) scroll inside the panel body, which scrolls too; tables in the side panel (`.table-wrap`) scroll inside the side panel. On touch a swipe catches the inner box first. **Fix:** let the inner lists grow and the panel body scroll alone, or give the inner boxes `overscroll-behavior: contain` with a visible edge. **Small.**
- **I3. Accessible names:** icon buttons have aria-labels; the side-panel toggle's label ("Toggle side panel") and tooltip ("Character, people, places") differ, which is fine. Nothing found where the tooltip is the only name.
- **I4. Widths:** the main layout drops the side panel to an overlay below 900 px; the battle map is a 36-column `pre` (scrolls sideways inside its box at the narrowest); the Train list is a native select whose option texts carry the reasons (long reasons are cut by iOS's picker). Not seen in a browser at these widths in this session.

### B8. Not done, or left for Jared

- The Debug tab's real turn numbers (P1 uses estimates at 4 characters a token).
- A browser check at iPad width (A5, B7).
- Saves from past milestone tags (T1).
- Rulings: C1 d and g; U2 (wire or delete each rule); U1's factions per war.
