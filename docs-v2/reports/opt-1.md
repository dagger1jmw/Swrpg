# opt-1: cost and speed fixes from the m8-audit (2026-11-26)

Jared's brief of 26 Nov 2026 took the cost and speed findings of reports/m8-audit.md (Part B); opt-2 takes the correctness ones. Decisions D-529 to D-534. Tuned for Jared's play pattern: Flash-Lite is the main model (about 500 requests a day), each Flash model about 20. Every number not from lore or Jared is invented; each is listed in section I. Nothing here changes a rule's outcome except where stated with its tolerance (F).

Measurements: `tests/measure/*.measure.ts`, run on demand with `npx vitest run --config vitest.measure.config.ts` (never part of npm test or test:all). Tokens are estimated at 4 characters a token, as in the audit.

## A. The narrative schema (D-529; audit C1)

**Changes:**
- npcIntroduced's `role` and `faction`, combatStarted's minion `kind` and `terrainTags` are plain words, resolved by the code (`src/data/entityWords.ts`): an exact id or name (case, spaces, accents and a plural "s" aside), then word lists. A word nobody can read is never refused; it goes to the review queue as species words do (D-523):
  - role "other" and faction "unknown" until the player picks (new review kinds role and faction; new player events `npcRoleSet`, `npcFactionSet`; the People tab's card is generalized from the species card);
  - a minion group fights as the default kind (thug) and an unread terrain word is left out; both are queued as notes to dismiss (review kinds minion and terrain).
- Field descriptions are gone from the wire. Their notes are in contract.md, the fight's sections, and a STORY FLAGS line in the standing rules (the flag list was flagSet's description).
- traitMoment (Jared approved; scars kept by Jared's answer during the batch) is sent only when a moment can fire, with only those moments (`EventDef.wire`, a per-state wire schema):
  - the scars not yet held (a brush with the dark only on a Force path);
  - fearFaced with a held fear not yet overcome, idealBroken with Idealistic, temperamentTested with a held temperament, rivalOutdid with Rival;
  - traitId and toward only alongside a moment that names a held trait.
  Everything filtered out was refused or a no-op before, so no outcome changes. The strict filter (held traits' moments only) would have ended story scars.
- Unchanged, as ruled: combatStarted stays in the core; the thread events stay separate.

**The 20 situations** (characters of the Gemini schema; cap 12,000; the "core" column is the same state with only the core part):

| Situation | Before | After | Core before | Core after |
| --- | --- | --- | --- | --- |
| alone in the wilds | 6,053 (50%) | 4,514 (38%) | 6,053 | 4,514 (38%) |
| a full story, alone | 7,022 (59%) | 5,368 (45%) | 7,022 | 5,368 (45%) |
| a conversation | 8,331 (69%) | 6,565 (55%) | 7,553 | 5,851 (49%) |
| the Temple with the master | 9,137 (76%) | 7,229 (60%) | 7,553 | 5,851 (49%) |
| a train turn | 7,828 (65%) | 6,032 (50%) | 7,022 | 5,368 (45%) |
| a cantina deal | 9,642 (80%) | 7,831 (65%) | 7,553 | 5,851 (49%) |
| buying alone | 8,333 (69%) | 6,634 (55%) | 7,022 | 5,368 (45%) |
| the spaceport with the ship | 7,234 (60%) | 5,523 (46%) | 7,022 | 5,368 (45%) |
| aboard a ship | 7,234 (60%) | 5,523 (46%) | 7,022 | 5,368 (45%) |
| a briefing | 8,820 (74%) | 6,819 (57%) | 7,553 | 5,851 (49%) |
| an army officer | 6,053 (50%) | 4,514 (38%) | 6,053 | 4,514 (38%) |
| a canon figure | 8,838 (74%) | 7,008 (58%) | 7,553 | 5,851 (49%) |
| a fight about to start | 7,202 (60%) | 5,907 (49%) | 6,503 | 5,272 (44%) |
| a ship battle | 7,234 (60%) | 5,523 (46%) | 7,022 | 5,368 (45%) |
| a ground planning scene | 8,357 (70%) | 6,591 (55%) | 7,553 | 5,851 (49%) |
| a ground battle | 8,331 (69%) | 6,565 (55%) | 7,553 | 5,851 (49%) |
| the largest combination | 9,644 (80%) | 7,672 (64%) | 7,553 | 5,851 (49%) |
| everything at once | 9,327 (78%) | 7,262 (61%) | 7,553 | 5,851 (49%) |
| a bounty hunter here | 9,866 (82%) | 7,934 (66%) | 7,553 | 5,851 (49%) |
| the player speaks of capture | 7,246 (60%) | 5,471 (46%) | 7,022 | 5,368 (45%) |

- **Targets met:** the core's largest is 49% (target about 50% or less); every situation is at 66% or less (target 75%).
- The saving is about 1,700 characters on the core's largest. That is more than the audit's estimate (1,340 + 392), because the descriptions of the situational events moved too.
- **Tests:** tests/turn/opt1.test.ts (A1, A2, the sizes); tests/features/entities.test.ts (unread faction and role words queued, not refused).

## B. The state block (D-530; audit C2)

**Changes:**
- **B1:** the SHIPS, DROIDS, TACTICS and ECONOMY instructions left the state block. They are now rules sent with their part:
  - SHIPS with the ship part;
  - TACTICS (with the story tactics known) with training or command;
  - ECONOMY (with the Jedi's note) with goods;
  - DROIDS (the models sold this year, the wipe note) when droids are the scene's business: owned droids, a droid present, goods, or the player's words.
  The facts stay in the state block: "Ships owned", "Money", "Owned droids".
- **B2:** VALID SKILLS goes only with the training part, where routineRequested's priorities and tacticStudied name skills. A choice's skillId cannot simply leave the schema, because it decides a clicked choice's check. Instead it became the skill's name in words, resolved by the code (`skillFromWords`). A word that names no skill stays as written and reads as an unknown skill, exactly as an unknown id did. The intent call keeps VALID SKILLS.
- **B3:** the fixed lines count against the cap. The focus IDs always fit: present NPCs, the current place and the places above it, open threads, the master (now also when absent), and whoever the player named. The rest fill what is left.
- **C1 (below)** moved the day-stable lines (the Order's seat, rank names, leaders and control, canon figures here, the era rules of the character's side, closed worlds) to a WORLD block before the history. They are counted there, not in the state block.

**The audit's C2 table** (tokens). "Before" is the old block. "After, narrative" is the narrative call's block; the WORLD block (679 tokens in these situations) is counted separately. "After, intent" is the intent call's block, which keeps the world lines and VALID SKILLS. "Focus lost" means a focus ID appears nowhere in the block.

| Situation | Before: fixed | Before: whole | Before: IDs dropped | Before: focus lost | After, narrative: fixed | After, narrative: whole | After, narrative: IDs dropped | After, narrative: focus lost | After, intent: whole | After, intent: focus lost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| alone in the wilds | 1,409 | 1,430 | 0 | 0 of 2 | 322 | 343 | 0 | 0 of 2 | 1,225 | 0 |
| an army officer | 1,261 | 1,270 | 0 | 0 of 1 | 273 | 282 | 0 | 0 of 1 | 1,107 | 0 |
| the spaceport with the ship | 1,613 | 1,613 | 3 | 1 of 3 | 407 | 445 | 0 | 0 of 3 | 1,326 | 0 |
| a ship battle | 1,682 | 1,682 | 3 | 1 of 3 | 476 | 519 | 0 | 0 of 3 | 1,401 | 0 |
| everything at once | 1,707 | 1,707 | 7 | 1 of 7 | 500 | 588 | 0 | 0 of 7 | 1,470 | 0 |
| a late campaign (150 NPCs, 60 places, 25 threads, 200 facts) | 1,455 | 1,514 | 233 | 24 of 27 | 327 | 1,468 | 169 | 0 of 27 | 1,728 | 0 |

- No situation of the 21 (the 20 above and the late campaign) drops a focus ID, in either call.
- **Over the cap, by its floor:** the late campaign's intent block, 1,728 of 1,500. It has 25 open threads and the floor keeps them all. This is Jared's rule (open threads are focus IDs), so it is reported, not cut.
- The audit's "whole" column counted every ID uncapped; this table counts what is sent, so the two "before" figures differ.
- **Tests:** opt1.test.ts B (the rules with their part, VALID SKILLS with training, the floor with an absent master in a late campaign); tests/m8/droids.test.ts (the DROIDS rule).

## C. Cheaper calls (D-530; audit P3, C3)

### C1. Stable text first, and Gemini's implicit cache

**The request now runs in this order:**
1. The system text: the standing rules only (core-gm, contract, STORY FLAGS), the same every turn.
2. One exchange before the history: WORLD, the year's LORE and the ARC, answered "Understood.".
3. The history.
4. The turn's own message: RULES FOR THIS TURN (pacing, the fight's sections, the opening, the parts' rules, the event rules), then STATE, MEMORY, RESOLVED and the player's action.

**What the cache gives on the free tier** (checked 26 Nov 2026; ai.google.dev's caching and pricing pages redirect to aistudio.google.com/docs):
- Implicit caching is on by default for Gemini 2.5 and newer models, and needs no setup.
- The minimum prefix is 4,096 tokens for 3.8 Flash and 3.6 Flash. No Flash-Lite model is in the table.
- The pricing page lists context caching on 3.5 Flash-Lite's free tier as **"Not available"**; paid, cached input is $0.03 per million tokens against $0.30. On 3.8 Flash's free tier it is "Free of charge".
- The docs advise putting large, common content at the start and sending similar-prefix requests close together. They do not state how long an implicit cache entry lives, or whether cached tokens count against the free tier's per-minute token limit.
- **So on Jared's free tier the new order saves nothing on Flash-Lite today.** It pays on a paid tier (cached input at a tenth of the price), and possibly in latency.
- The stable prefix (system plus the WORLD, LORE and ARC exchange) is about 4,100-5,700 tokens (the system text about 2,800, WORLD 679, lore 637-2,178, the arc up to 1,000) and changes only with the place, the year, a full-lore turn or a new chapter. That is above Flash's 4,096 minimum.
- The usage log now records the cached tokens Gemini reports (`usageMetadata.cachedContentTokenCount`), shown in the header meter's tooltip, so the real hit rate can be read.

### C2. The history in steps

The oldest turn kept is one numbered 1 more than a multiple of `HISTORY_STEP`. Measured on a campaign from turn 20 to 60, 2,200 characters a turn:

| Step | History tokens per call (average) | Calls whose history starts as the last one's |
| --- | --- | --- |
| 1 (as before) | 7,784 | 0% |
| 2 (chosen) | 7,513 (-271, 3.5%) | 50% |
| 3 | 7,228 | 65% |
| 4 | 6,943 (-841, 11%) | 75% |
| 5 | 6,645 | 80% |
| 6 | 6,374 | 83% |

- **Chosen: 2.** Flash-Lite's free tier gets no cache discount, so the step's only effect today is less history. Step 2 keeps that loss small and keeps the mechanism ready.
- **On a paid tier, raise it to 4.** One constant in context.config.ts.

### C3. Lore

- **Full:** the year's timeline rows go in full on the opening, when the year changed or the player reached a new world since the last story turn, or when the player's words ask. Turn records now keep `worldAfter` for this.
- **Brief, otherwise:**
  - timeline rows that name someone or somewhere in play stay;
  - the people's own entries stay (anything a canon figure present needs);
  - the rest of the year becomes one line: "This year (3,661 BBY) on record: Geonosis campaign; Geonosis campaign continues; The Rim Campaign begins (and 5 more)."
- The lore section drops from 2,178 to 637 tokens on a brief turn.
- **Which mode applied, and why,** is in the Debug tab's lore row ("lore brief (same year, same world)").

### C4. gmRules in a fight

combat-narration.md went from 9,125 to 5,594 characters. Rules were tightened, not removed. The pinned phrases the tests check are kept word for word. **What moved:**
- **combat-long.md:** "a long passage is told as a fight" and the Length line rule. Sent when the block has a Highlights or Length line (from NARRATION_LENGTH.highlightsFrom exchanges).
- **combat-end.md:** the end reason, capture and subduing, a Sith's withdrawal, the fate being the player's, and who won a bout. Sent when the fight ended this turn, or in a sparring session.
- **combat-hold.md:** holdBegun and the HOLD block. Sent when a hold is told, or when holdBegun is legal.
- **The event rules:** contract.md's combatStarted, ship-battle and ground-planning paragraphs (2,865 characters) now go only when the event is offered. None of them can be sent during a fight.

**gmRules:** in a fight, 5,674 -> 4,654 tokens (cap 5,000). On an ordinary turn, 3,392 -> 3,379, after taking on the field notes (about 175 tokens) and the flag list.

### C5. Typed shortcuts

- **The phrases** ("wait", "I wait", "wait a moment", "keep waiting", "rest", "I rest", "take a rest"; and "continue", "go on", "look around", "I look around") are read by the code with no intent call. The first group reads as rest, the second as other, as intent.md maps them.
- **Whole phrases only.** Case, spaces and a final full stop are ignored.
- **Never** during a fight, a pending fight, a hold, a pursuit, a battle or its planning.
- **Everything else**, "I wait for him to leave" included, still goes to the intent call.

### C6. Tokens per narrative call (the audit's P1 table)

40 turns of 2,200 characters of history; 4 characters a token.

| Turn | Total | gmRules | world | state | recentTurns | memory | lore | arc | resolved + input | schema |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ordinary, alone in the wilds (lore brief): before | 16,378 | 3,392 | - | 1,430 | 7,784 | 40 | 2,178 | 0 | 40 | 1,514 |
| Ordinary, alone in the wilds (lore brief): after | **14,031** | 3,379 | 679 | 343 | 7,784 | 40 | 637 | 0 | 40 | 1,129 |
| Ordinary, a conversation that asks about the war (lore full): before | 17,063 | 3,392 | - | 1,505 | 7,784 | 77 | 2,178 | 0 | 44 | 2,083 |
| Ordinary, a conversation that asks about the war (lore full): after | **16,201** | 3,379 | 679 | 418 | 7,784 | 77 | 2,178 | 0 | 44 | 1,642 |
| A fight about to start: before | 19,668 | 5,674 | - | 1,575 | 7,784 | 77 | 2,178 | 0 | 386 | 1,994 |
| A fight about to start: after | **16,351** | 4,654 | 679 | 504 | 7,784 | 77 | 637 | 0 | 386 | 1,630 |
| A late campaign: before | 21,841 | 3,392 | - | 1,514 | 7,784 | 4,046 | 2,178 | 996 | 42 | 1,889 |
| A late campaign: after | **20,494** | 3,379 | 679 | 1,468 | 7,784 | 4,046 | 637 | 996 | 42 | 1,463 |

- **Savings per call:** an ordinary turn about 2,350 tokens (14%), a fight about 3,300 (17%), a late campaign about 1,350 (6%).
- At 40 turns of history the step-2 window happens to start where the old one did. On average it holds about 270 tokens fewer (C2).
- **What stays:** the history is still about half of every call, and memory grows with the campaign (4,000 cap). Neither was in this batch.

### C7. Calls in a 40-turn evening (the audit's P2)

Half the turns typed; estimates.

| | Before | After |
| --- | --- | --- |
| Narrative calls | 40 | 40 (quiet beats and battle phases still none) |
| Intent calls | about 20 | about 17 (C5: about 1 typed turn in 7 is one of the phrases; invented) |
| Summary calls | 2-5 | 2-5 |
| Truncation retries | about 1.6 (E's model) | about 0.2 |
| Narration-check retries | 1-2 | 1-2 |
| **Total** | **about 65** | **about 62** |
| Flash calls | the first 20 narrative calls, until Flash's day is spent | about 5-11 (D); the rest on Flash-Lite |

## D. Model use (D-531)

**The rule.** With the Settings switch on (the default):
- An ordinary story turn runs the narrative list with the premium model (gemini-3.8-flash) moved to the end. Flash-Lite answers; Flash is only the last fallback.
- A **big moment, picked by the code** (`src/turn/premium.ts`), tries the premium model first. The big moments are:
  - the campaign opening;
  - a fight that ended this turn (not a sparring bout);
  - a ship or ground battle's wrap-up;
  - a time skip's narration;
  - a world event the engine marked significant;
  - every chapter summary.
- When Flash's day is spent (a daily-quota reply, or its requests-per-day limit on the meter), the router falls through to the rest of the list (`routedList`).
- One call per turn still holds; a narration-check retry of a big moment uses the same order.

**Settings:** "Use the stronger model for the big moments only" and "Model for the big moments". Off, every story turn uses the list in order: Flash first, as before. The default list itself is unchanged.

**A typical evening** (estimated): an opening 0-1, fights ending 2-3, a battle 0-1, a time skip 1-2, a major world event 0-1, chapter summaries 2-5. That is **about 5-11 Flash calls**, inside the 20 a day, so a second evening still finds some.

**Not built:** a reserve that keeps a few Flash calls back for later in the day. The router uses Flash until its daily limit.

**Tests:** opt1.test.ts D: the routed order; the big moments; in the pipeline, the opening on Flash, an ordinary typed turn on Flash-Lite with no intent call, and the old order with routing off.

## E. Output limits (D-532; audit C4)

**Measure first.**
- The repo holds no real usage logs. The usage log (localStorage) did not record finishReason. The transcripts that do (a call's outcome "truncated") live in the browser's saves.
- From now on, the usage log counts replies cut short per model per day, shown in the meter's tooltip.
- Meanwhile, a simulated evening (`tests/measure/outputBudget.measure.ts`, 2,000 seeded evenings):
  - 40 turns: 1 opening, 4 arrivals, 2 montages or skips, 3 narrated fight beats, 22 ordinary moments, 8 ordinary scenes;
  - the replies' JSON built from real event shapes at typical lengths;
  - prose and thinking lengths drawn from invented distributions (section I).
  A reply is cut short when prose + JSON + thinking exceeds the cap.

**The allowance**, sized from the turn (`src/turn/outputBudget.ts`): opening 900, arrival 600, montage or skip 500, the command part 400, a scene-level turn 500, any other 300 (D-58's figure). It is a ceiling, so a reply that does not need it costs nothing more.

| Turn kind | Its JSON (tokens) | Cut short per evening, before (flat 300) | After |
| --- | --- | --- | --- |
| opening | 1,057 | 0.57 | 0.05 |
| arrival | 690 | 0.45 | 0.04 |
| montage or skip | 663 | 0.21 | 0.05 |
| fight beat | 216 | 0.00 | 0.00 |
| ordinary moment | 345 | 0.06 | 0.06 |
| ordinary scene | 520 | 0.33 | 0.04 |
| **an evening** | | **1.61** | **0.23** |

Each reply cut short was a second call (the truncation retry). These are modelled numbers; the meter's new count gives the real ones.

## F. The pace window (D-533; audit S1)

**Chosen:** per skill, one sum per finished calendar week plus the current week's days, as parallel arrays, XP and hours to 0.001 (`src/engine/paceStore.ts`). Progression v5 migrates old saves.

**Every reader goes through the store:**
- the 4.0x clamp, through `windowSums`;
- the body's ageing, through `storedHours` (it summed everything stored, as before);
- the lifetime harness's pace rates.

**Tolerance:**
- A finished week counts whole when at least 4 of its 7 days are inside the 365-day window, and not at all otherwise. The window's oldest edge moves by at most 3 days.
- The clamp reads XP and hours over the same window, so both sides of its ratio shift together.
- Rounding moves a year's sum by at most about 0.2.
- On the store test's streams, the worst day differs from the exact window by 3.2% of its XP: a heavy week (2.5x) sat on the edge. Every day is within the edge days' own contents.

**Old v new, seeded lives** (`tests/measure/paceLives.measure.ts`, run at the old code and at the new):

| Life | XP, largest difference | Discarded by the clamp (old -> new) | Time (old -> new) |
| --- | --- | --- | --- |
| Jedi Guardian, 12 years | 0 (identical) | 0 -> 0 | 20.8 s -> 16.7 s |
| Sith Warrior, 10 years | 0 | 0 -> 0 | 7.6 s -> 5.6 s |
| soldier, 8 years | 0 | 0 -> 0 | 5.0 s -> 3.9 s |
| Anakin, 12 years | 0 | 0 -> 0 | 36.9 s -> 33.1 s |
| the Average, 8 years | 0 | 0 -> 0 | 4.5 s -> 3.2 s |
| Luke, accelerated path, 4 years (the clamp fires) | 44.5 XP on Djem So (1.2%), 0.11 levels (51.55 -> 51.44) | 650.7 -> 646.4 | 2.3 s -> 1.7 s |

- **Stated tolerance for the readers: 0.25 levels.**
- Where the clamp never fires, the window is never read for a decision, and the lives are identical to the last digit.

**Save size and speed** (`tests/measure/saveSize.measure.ts`: a Jedi Knight in 3,661 BBY on the default routine, time skips of up to 30 days through the real resolver):

| | Before | After |
| --- | --- | --- |
| Save at the start | 6,240 characters | 6,240 |
| After 250 days | 154,189 (pace window 142,492) | **18,291** (window 6,595) |
| After a year | 220,737 (pace window 207,664) | **21,032** (window 7,958) |
| A time skip, per game day | 4.3 ms | 3.7 ms |

- The save at a year is about 10.5x smaller.
- The skip's figure is lower than the audit's 12 ms because this measurement skips through the resolver alone, with no narration or commit.

**Tests:** tests/features/paceWindowStore.test.ts: the store against the old reader on every day of three seeded three-year lives; exact within the first year; at most 53 weeks and 7 days per skill; the migration keeps the sums and the hours. The progression, form-transfer and specialty tests read the store.

## G. The test suite (D-534; audit S4)

**Changes:**
- forceSense.test.ts (six lives in one file), archetypesJedi.test.ts and archetypesSith.test.ts are now one file per archetype: `tests/lifetime/life.<id>.test.ts` for jediGuardian, jediConsular, jediSentinel, sithWarrior, sithInquisitor and soldier.
- **The shared life:** each archetype now runs one life, and npc test 7 and the Force Sense check read from it (`archetypeLife.ts`).
  - The two tests ran the same profile, differing only in the seed and the length.
  - The runner reads a life's length only as its loop bound, so the first 25 years of the longer run are npc test 7's 25-year life. Its check is unchanged.
  - The Force Sense check now reads npc test 7's seed instead of "fs-<id>" (another draw of the same life).
- The career files keep their grouping, on the same helper, and gain "a career has no Force Sense".
- Same assertions, 5 lives fewer.

| Run | Before | After |
| --- | --- | --- |
| test:all | 2,138 tests, 186 files, 1,414 s (this session, while short measurement runs shared the machine; the audit's clean run: 1,327 s) | 2,166 tests, 191 files, 1,118 s (-21% on this session's run) |
| test:lifetime alone | 56 tests, 1,234 s (the audit) | 62 tests, 18 files, 1,174 s (-5%) |

- **Less than the audit hoped (500-700 s for the lifetime suite).** The harness notes measure this machine saturating at about 4 lives at once (tests/support/parallelRuns.ts), so wall time follows the total work more than how it is spread over files. Removing 5 duplicate lives saves about their CPU time. The suite's floor is now the long single-file runs: era3661's 20 seeds and the Average's 95 years in setup hooks, and duelTables (95 s of attributed time).
- test:all against the audit's clean run: 1,327 -> 1,118 s (-16%). Part of the -21% against this session's own "before" is that run sharing the machine with measurements. The rest is the 5 lives removed and the compact pace window, which makes every life faster (F: 10-29% on the seeded lives).

## H. Checks

| Run | Result | Time |
| --- | --- | --- |
| `npm test` (final code) | 2,104 of 2,104 passed, 173 files | about 40 s |
| `npm run typecheck`, `npm run lint` | clean | |
| `npm run test:lifetime` | 62 of 62 passed, 18 files | 1,174 s |
| `npm run test:all` | 2,165 of 2,166 passed, 191 files; the failure was resolve.test.ts's history-window test (it checks the fit rule; the step of 2, set after the last full npm test, starts the window one turn later). The test now pins step 1 for the fit rule and checks the stepped start; it and npm test pass on the final code. The fix touched tests only, so the lifetime files' result stands. | 1,118 s |

### Tests changed for a reason

- **Prompt-wording tests** (blockDetails, combatPass5, narrationCheck): the trimmed combat prompt keeps their pinned phrases word for word. The long-passage test reads combat-long.md.
- **memoryPipeline:** "I look around" is now a typed shortcut, so the test types another phrase where it needs an intent call. Lore is read from the opening exchange, and the report lists the new world section.
- **montagePipeline:** the pacing rules are read from the turn's message.
- **context.test:** LORE is checked in the opening exchange, MEMORY in the turn's message.
- **entities:** unread faction and role words are queued, not refused.
- **progression, formTransfer, specialtyTransfer:** they read the compact store, to its 0.001 precision.

## I. Every invented number

| Number | Where |
| --- | --- |
| The word lists for role, faction, minion kind and terrain; the default minion kind (thug) | `src/data/entityWords.ts` |
| The world section's cap, 1,000 tokens | `CONTEXT_CAPS.world` |
| History step 2 (4 on a paid tier) | `HISTORY_STEP` |
| The lore "asks" word list; 3 rows on the year's line, each cut at about 110 characters | `LORE_ASK`, `yearLine` (context.ts) |
| The typed shortcut phrases | `TYPED_SHORTCUTS` (shortcuts.ts) |
| The big moments, and gemini-3.8-flash as their model | `premium.ts`, `FLASH_ROUTING` |
| The JSON allowances: 900, 600, 500, 500, 400, 300 | `JSON_ALLOWANCE` (outputBudget.ts) |
| E's model: the evening's turn mix; JSON at 3.5 characters a token; prose means and spreads (moment 380 ± 120, scene 620 ± 180, opening 700 ± 200, arrival 600 ± 180, montage 800 ± 200, fight 420 ± 120); thinking uniform 150-1,100 | `tests/measure/outputBudget.measure.ts` |
| The pace store: weeks of 7 calendar days, an edge week counted with 4 days inside, 0.001 precision; the 0.25-level tolerance | `paceStore.ts`, D-533 |
| "About 1 typed turn in 7 is a shortcut phrase"; the evening's Flash count (5-11) | C7, D |

## Not done

- **The response schema in the cache:** no live check of whether `responseJsonSchema` is part of the cached prefix. The audit's open question on `$ref` stays open too.
- **A Flash reserve:** nothing keeps a few calls back for late in the day (D).
- **The history and memory:** they are still most of every call. Their caps were not in this batch.
- **No browser check:** the Settings switch, the People tab's word cards and the meter's tooltip were not seen on an iPad. The tooltip is hover-only information, like the audit's I1.
- **Real cache and truncation numbers:** they need Jared's play. The meter now counts both.
