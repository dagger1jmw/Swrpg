# 19 — Master prompt and AI pipeline (legacy V170 audit)

Scope: `MASTER_PROMPT` (legacy/index.html:1702-2774), per-turn context (`buildContext`, legacy/index.html:4018-4178; `buildEventInjection`, 3960-4013), the V162 pre-roll call (`preRollCombatExchange`, 4469-4562), the shared roll-tag scanner (`scanAndFireRollTags`, 4347-4456), and `callGemini` (4564-6347) through rendering (`renderGMMessage`, 6415-6482). The full tag inventory is in the fragment `ai-tags-A.md`. This file summarizes it.

## What it does for the player

- Each player action (typed, or a clicked A-E/Custom choice button) goes to `sendMessage` (6396) and then `callGemini` (4564).
- If the message isn't an `[OVERRIDE]`-style command, a small pre-roll call to Gemini first asks whether this action is a combat exchange. If it is, JS rolls the dice before the story is written (V162/V170).
- The main call sends the system prompt (`MASTER_PROMPT`), a JS-built "AUTHORITATIVE GAME STATE" block, a fake model reply saying "Confirmed", the last 6 turns, and the player's message plus a reminder.
- The reply should hold the story, choices A-D plus Custom, and three blocks: `<<<CHANGES>>>`, `<<<SHEET>>>` and `<<<WORLD>>>`. Code parses them, changes state, strips the blocks out and shows the story. It also shows JS banners for roll results, XP gained, Will of the Force, pressure discharge, shatterpoints and profiles.
- If the reply was cut off or had no choices, code makes extra Gemini calls to repair it.
- Rate limits (HTTP 429) are retried up to 3 times.

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Model (all calls) | `gemini-2.5-flash`, API key in URL query | legacy/index.html:4527, 4617, 4661, 4693, 3680 |
| Main call generation | temperature 0.85, maxOutputTokens 32768, topP 0.95 | legacy/index.html:4607-4611 |
| Pre-roll call | temperature 0.4, maxOutputTokens 200, topP 0.9; own system instruction | legacy/index.html:4520-4525 |
| Truncation continuation call | temperature 0.5, 32768 tokens; fires if `finishReason==='MAX_TOKENS'` or (len>200 and no `<<<END_WORLD>>>`) | legacy/index.html:4650-4673 |
| Missing-choices call | temperature 0.7, 256 tokens; fires if no `^[A-E]\)` line and narrative >300 chars | legacy/index.html:4682-4707 |
| 429 retry wait | `retry in Ns` from the error +3 s, else `(retryCount+1)*25` s; max 3 retries | legacy/index.html:4625-4638 |
| History window | `RECENT_TURNS = 6` turns (12 messages) | legacy/index.html:2791, 6148-6151 |
| Summarize cadence | `SUMMARIZE_EVERY = 10` turns, gated `turnCount % 10 === 0` | legacy/index.html:2792, 6291 |
| Summary call | temperature 0.3, 2048 tokens, keeps last 12 messages | legacy/index.html:3678-3697 |
| Pending-event injection cap | ≤2 critical, ≤2 high, medium until 5 total; ≤2 unsurfaced galaxy events | legacy/index.html:3972-3977, 4003 |
| TRAINING hours guard | reject if claimed hours > max(0.05, 2 × Time Elapsed hours) | legacy/index.html:5115-5120 |
| Strain tag mitigation | `em = compressedBonus(END)/6`. Increases: Physical ×(1−em), Force ×(1−0.5em), Mental ×(1−0.3em) | legacy/index.html:5502-5531; prompt 2344-2359 |
| Strain tag increase guard | increase blocked if no TRAINING:/COMBAT:/COMBAT_ROUND:/COMBAT_START: line this turn, or if `activeCombat` | legacy/index.html:5057, 5508, 5519, 5529 |
| COMBAT_END_CRASH surge | HP ≥51: +5, ≥26: +10, ≥11: +15, ≥1: +20 physical strain | legacy/index.html:5445-5458 |
| WILL_OF_FORCE | alignment += gain (cap 100); equilibrium XP += gain × 8 | legacy/index.html:5269-5280 |
| ALIGNMENT= (legacy tag) | equilibrium XP += val × 20 | legacy/index.html:5821-5825 |
| DARK_PRESSURE discharge | at ≥100: pressure → 40; equilibrium XP −base × (1−discount), base 120/80/60/40/25 by equilibrium ≥76/≥26/≥1/≥−25/else; alignment += loss × 0.06 | legacy/index.html:5827-5868 |
| SURRENDER_DISCOUNT | clamp 0-0.5 | legacy/index.html:5869-5874 |
| MOMENTUM_WINDOW | mult,days; `0,0` closes; expiry = date + days | legacy/index.html:5250-5266 |
| INTERACTION weights | combat 3, training/force 2, dialogue 1; profile visible at ≥5 | legacy/index.html:5671-5673, 5693 |
| Narrative XP fallback | prose `Name: +N XP` → N × 50 XP, only if no TRAINING:/COMBAT: tag | legacy/index.html:5976-6002 |
| Clock | `Time Elapsed:` line: hours×60 + min + sec/60, rounded; midnight crossings advance date | legacy/index.html:6182-6224 |
| Time-of-day labels | Pre-Dawn 3-6, Dawn 6-7, Morning 7-12, Midday 12-14, Afternoon 14-18, Evening 18-21, Night 21-24, Late Night 0-3 | legacy/index.html:6208-6211 |
| Prose COMBAT_END fallback outcome | `/win|victor|success/` → win, else `/loss|lost|defeat/` → narrow_loss, else win; engagement `mixed` | legacy/index.html:6275, 6286 |
| Minor-injury auto clear | Time Elapsed ≥7 h → remove `minor` injuries | legacy/index.html:5048-5050 |

Prompt-only reference tables (the AI is told JS computes these): tier-gap bonus 0/4/9/15/22/30/39 (2037-2046, code 6878-6883); solo bands Fail<8/8-11/12-16/17-20/21+ and opposed margin bands (1983-1984); TACTICAL table capped ±5 (2002-2054); combat base XP T1-T7 = 50/120/300/750/1800/4500/11000 (1815-1817); training outcome tables (2106-2144); `xpRequired = floor(100×1.07^stat)` (2370, code 6904-6907); strain per-round reference values (2240-2246). All of these are replaced by v2 specs.

## State read / written

Read by `buildContext`: `characterSheet.{name,species,age,faction,rank,lifeStage,alignment,alignmentEquilibrium,equilibriumXP,darkPressure,momentumWindow,philosophy,innateTalents,shatterpointFocus,tunnelVision,vaapadAmplification,lastShatterpointMisread,lastShatterpointRoll,hp,maxHp,forceStrain,strain,maxForceStrain,physicalStrain,maxPhysicalStrain,mentalStrain,maxMentalStrain,forceStats,forceStatsXP,forceAbilities,forceAbilitiesXP,lightsaberForms,lightsaberFormsXP,lightsaber,stats,statsXP,forceBarrier,maxForceBarrier,injuries,dominantHand,fightingWith,painChannelActive,inventory,credits,renown,strengths,weaknesses,aptitudes,innatetalent,knownSecrets,backstory}`; `worldState.{location,inGameDate,inGameTime,era,galaxyState,legacyChanges,pendingEvents,npcAgendas,galaxyEventQueue,sceneNPCs,trackedCharacters}`; `masterXP.shatterpoint`; `activeCombat.{opponent,intensity,round,lockedForm,accPhysical,accForce,accMental,lastRollResult,oppInjuries}`; `galaxySimState`, `lastGalaxyEventDate`, `campaignSummary`, `recentHistory`, `turnCount`.

Written as a side effect while building context: `galaxyEventQueue[i].surfaced = true` (4008), `lastShatterpointRoll.resolved = true` (4172), plus `checkMilestones()` and `updateEventPriority()` (3963-3964).

Written by `callGemini` and the parser:
- `characterSheet` is replaced wholesale by the SHEET JSON (4775). Code then restores: `innateTalents, innateAbilities, birthday, lifeStage, rank, storyFlags, alignment, alignmentEquilibrium, equilibriumXP, alignmentPeak, philosophy, darkPressure, momentumWindow, lightsaber, injuries, dominantHand, fightingWith, painChannelActive` (4784-4803), rebuilds `aptitudes` (4813-4830), re-syncs stats and XP from `masterXP` (4833), and normalizes `lightsaberForms` keys (4838-4869).
- **Not protected** (the AI's JSON wins): `name, species, homeworld, faction, age, hp, maxHp, forceStrain, physicalStrain, mentalStrain` and their maxes, `forceBarrier, maxForceBarrier, inventory, credits, renown, strengths, weaknesses, knownSecrets, backstory, lastShatterpointRoll, lastShatterpointMisread, shatterpointFocus, tunnelVision, lastLightActs`. Stat keys that have no `masterXP` entry also stay as the AI wrote them, because `syncMasterXPToSheet` only overwrites keys that exist in `masterXP` (7183-7193).
- `worldState` is replaced wholesale by the WORLD JSON (4894). Code then restores: `trackedCharacters, characterProfiles, interactionWeights, npcAgendas, pendingEvents, worldLog, galaxyEventQueue, galaxyEvents, legacyChanges, lineageRecord, storyFlags, galaxyState, inGameDate, inGameTime` (4901-4932). **Not protected:** `location, era, lastEvent, sceneNPCs, activeThreats, lastMilestone` and any other key.
- `activeCombat` (startCombat 4959-4964, 4542-4545; COMBAT_ROUND / COMBAT_END handlers), `masterXP` (through applyXPToSheet / applyProficiencyXP), `turnXPLog`, `recentHistory`, `fullHistory`, `galaxySimState` (6155-6165), `lastGalaxyEventDate`.

## AI provides vs. code computes

| AI provides | Code computes |
|---|---|
| Story, choices, `Time Elapsed:` line | Clock and date advance (6182-6260) |
| Full SHEET JSON every turn | Restores a protected list, then overwrites stats from `masterXP` |
| Full WORLD JSON every turn | Restores a protected list. Location, era and sceneNPCs are the AI's |
| CHANGES tags (about 60 distinct forms, see fragment) | XP math, strain mitigation, alignment math, NPC stat rolls, injury list |
| ROLL / ROLL_OPPOSED stat paths, TIER_GAP, TACTICAL, label | d20, bonuses, margin (fireRoll 10835). JS overrides TIER_GAP when the opponent's tier is known (10881-10885) and locks the lightsaber form (4362-4370) |
| Pre-roll call: COMBAT_START + ROLL_OPPOSED lines or `NO_ROLL_NEEDED` | Fires the roll before the main call; flags `preRolledForCurrentTurn` |
| Opponent INLINE stat numbers when no profile exists | Saves them to a `disposable` profile and locks them for the fight (4396-4434) |
| Absolute HP, strain, barrier and stat values (HP=, FORCE_STRAIN=, STRENGTH=, FORCE_SENSE=, AGE=, CREDITS=, bare `<FormName>=N`) | Applies them almost as written. Only strain is guarded |
| Prose such as "Physical Strain: 2 → 0", "barrier fell", "Djem So: +3 XP", "combat ended", "It is now Day 4 Coruscann" | 13 regex scans of the story text that write state (see fragment) |

## Known bugs and fragile spots

Highest impact (full table in `bugs-A.md`):
1. **`turnCount` is never incremented.** `turnCount++` was deleted in commit d66f0d3 (it was replaced by the prose COMBAT_END fallback). Nothing in V170 increments it (only resets at 3387, 3551 and load at 8253). Effects: the turn label is always "Turn 1"; `turnCount % 10 === 0` is always true, so `summarizeCampaign()` is called on **every** turn (6291) and makes an extra API call per turn once history passes 16 messages; injury and shatterpoint `turn` stamps are always 0; the "CAMPAIGN HISTORY (turns 1–N)" label is wrong (4121). `window.turnCount` (6799, 6803) is also always undefined, because `let` doesn't create a window property.
2. **Off-by-one `slice()` in the generic `switch` tags.** `GENERATE_PROFILE` slice(16) gives `"=Name"`, which creates an orphan profile (5595). `SHATTERPOINT_ROLL` slice(17) puts a leading `=` in the target (5560). `SHATTERPOINT_PERCEIVED` slice(22) means `parseInt("=2")` is NaN, so the tier is always 1 (5536-5538). `RECURRING_RETURN` slice(18) drops the name's first letter, so the lookup always fails and the tag is a silent no-op (5482-5488).
3. **Dead tags.** `SHATTERPOINT_FOCUS_CLEAR` and `SHATTERPOINT_MISREAD_RESOLVED` have no `=`. The generic key regex (5296) requires `=`, so their `switch` cases (5571, 5589) can never run, and the "MISREAD UNRESOLVED" notice can never be cleared by the AI. The colon forms `SHATTERPOINT_PERCEIVED:` and `SHATTERPOINT_ROLL:` taught at 2540-2544 are also dropped. Docs/updates.md:1404-1417 records these as fixed.
4. **429 retry re-runs the pre-roll.** The recursive `callGemini(..., retryCount+1)` (4633) re-enters the `try` and calls `preRollCombatExchange` again (4601), so a second real combat roll fires for the same action (and on a new fight, a second startCombat path).
5. **The pre-roll catch can delete a live combat.** `if (!activeCombat?.lastRollResult) activeCombat = null` (4559) also runs for an ongoing fight whose last result was already cleared, which is the normal state after a pre-rolled turn (5029-5031). Any exception in the pre-roll then wipes the fight, including accumulated strain.
6. **The repair calls rebuild context with side effects.** The continuation and choices calls (4656, 4688) call `buildContext()` again. The shatterpoint pending roll was already marked resolved (4172), so the repair prompt loses its directive. `checkMilestones()` also runs again.
7. **The markdown fallback is not a fallback.** It runs whenever `**name:**`, `**strain:**` and similar appear (6035), even when the SHEET JSON parsed. It overwrites `alignment` (JS-owned), `hp`, and replaces `forceStats` and `stats` wholesale (6084-6098), bypassing `masterXP`. Its array regex is broken (`[^\]]` inside a template literal becomes `[^]`, so arrays never parse; verified with node).
8. **Narrative strain and barrier regexes have no guards** (5913-5970). The CHANGES strain guard does not apply to them, so "Physical Strain: 2 → 40" in prose sets 40 even mid-combat. The barrier regex `barrier.*(fell|drop|fad...)` sets `forceBarrier=0` on lines like "the barrier between them fell away".
9. **The prose COMBAT_END fallback** (6272-6288) fires on "combat over…" anywhere in the text, and scores a win if the word "success", "win" or "victor" appears anywhere (for example "window").
10. **Direct-set tags bypass XP.** `STRENGTH=`, `FORCE_SENSE=`, `AGE=`, `CREDITS=`, bare `<AbilityOrForm>=N` (5875-5896), and `XP_<Stat>=` (5303-5343), which sets XP `current` directly. The prompt doesn't teach any of these, but the parser accepts them.
11. **Choices regex** `/^[A-E]\s*[\.\-\)]/` (6431) turns any story line starting "A." or "I-" style into a button. For example "A-wing pilots…" starting with `A-` becomes a choice.
12. **`KNOWN_PERSON` calls `autoSave()` mid-parse** (5738), which saves a half-applied turn.

## Conflicts between sources

- **Prompt vs. itself.** It says STEP 2 twice and asks for the SHEET block twice (1722 and 1882). `CHANGES` "REQUIRED EVERY TURN: FORCE_STRAIN=[current]…" (1726-1731) conflicts with "NEVER output FORCE_STRAIN= while combat is active" (2362-2365). "Do NOT write d20 values" (2072) conflicts with the DUEL DISPLAY FORMAT asking for `d20=[SYSTEM] + [bonus]` (2263-2280). SEQUENCE/INTENT input modes resolving 2-5 exchanges (2177-2184) conflict with "ONE ROLL_OPPOSED per exchange" and a pre-roll that fires only one. TIER_GAP is defined as "Positive = player is stronger (opponent's tier − player's tier)" (2034), but that formula has the opposite sign. Barrier breaks at "strain 9+" (2310) on a 0-100 scale, a leftover from the 0-10 scale. There are two tier scales: COMBAT_END tiers 1-7 named Initiate…Transcendent (1803) vs NPC_ROLL tiers 1-6 named Untrained…Legendary (1764), and code `statToTier` uses the Untrained…Transcendent names (6865-6873). Alignment tier names differ: Deep Light/Light/Leaning… (2631-2636) vs Luminous/Attuned/Calm/Balanced/Shadowed/Corrupted/Consumed (4033-4034). Example XP values at 2371-2372 ("3→4: 123", "10→11: 197", "20→21: 387") are 1 higher than `floor(100×1.07^n)` (122/196/386).
- **Prompt vs. code.** The prompt says "DO NOT CHANGE inGameDate", but code also advances the date from prose "It is now / It is currently Day N Month" lines (6227-6262). The prompt calls `ALIGNMENT=` deprecated (2620), but code still applies it ×20 (5821-5825). `LIFE_STAGE=`, `XP:`, `XP_*=`, `COMBAT:`, `AGE=`, `CREDITS=` and direct stat tags are handled by code but not taught (or barely taught) by the prompt. The SHATTERPOINT tags are taught in both `=` and `:` forms (1746-1747 vs 2493, 2540-2544), and only `=` works.
- **Prompt vs. legacy/CLAUDE.md §5A** (legacy/CLAUDE.md:318-410). There, `ALIGNMENT=` is the "light side gains" tag. TRAINING difficulty is listed as `basic|standard|ceiling|wall|above` vs the prompt's `basic|ceiling|above|far`. Outcomes are `fail|contested|…` vs the prompt's `failure|partial|…|breakthrough` (code accepts both sets through alias maps, 6993-6996). COMBAT: outcomes are `decisive_loss…decisive_win` vs COMBAT_END's `overwhelming_win|win|strong_win|narrow_loss|loss|survived`. "Never set age directly" there, but code accepts `AGE=` and SHEET `age`.
- **Prompt vs. Docs/SW_Legends_RPG_Master_Prompt_v7_1.md.** v7.1 contains no tag or JSON protocol at all; it is a design doc. Roll: v7.1 uses `d20 + Σ(stat/20)` with bands ≤1/2-3/4-6/7+ (Part VII), while V170 uses `compressedBonus` + a tier-gap table with bands 8/12/17/21. Strain: v7.1 uses a 0-9+ scale, costs +0…+4 and penalties at 3/6/9 (Part IX), while V170 uses 0-100 with costs +5…+50 and penalties at 21/51/81. Tiers: v7.1 has 5-6 bands (0-20, 20-40, 40-80, 80-100, 85+, 100+), V170 has 7. Progression: v7.1 says "no general XP pool… increase through use"; V170 uses an exponential XP per stat. Dark path: v7.1 says "+2 strain"; the prompt says "+15-20 Force Strain baseline" (2641). v7.1's "Oneness with the Force" (Part VIII) is absent from the prompt. Campaign start: v7.1 has the AI run era selection and creation and confirm the sheet (Part XV), while V170 uses a JS creation screen and then a "CHARACTER CREATED — BEGIN" message (3454-3455), yet the prompt still ends "Begin campaign by presenting era selection" (2772).
- **Player name hard-coded.** The prompt names "Jared" (for example 1752, 1899, 2063, 2494, 2525), and `buildContext` directives do too. That contradicts its own generic character-creation flow.

## Replaced by

- Tag protocol, SHEET/WORLD JSON ownership, and prose regex parsing: **ai-events.md** (schema-checked events, intent call plus narrative response).
- Pre-roll two-call combat, ROLL/ROLL_OPPOSED, TIER_GAP/TACTICAL, margin bands, shatterpoint rolls: **rolls.md** (and **combat-xp.md** for COMBAT_END XP).
- HP=, strain tags, barrier, injury tags, COMBAT_END_CRASH: **health.md**.
- TRAINING:/PROFICIENCY:/XP:/XP_*/direct stat tags: **progression-numbers.md**, **training-routines.md**.
- ALIGNMENT_XP / ALIGNMENT / DARK_PRESSURE / MOMENTUM_WINDOW / WILL_OF_FORCE / SURRENDER_DISCOUNT: **alignment.md**.
- NPC_ROLL / PROFILE_STATS / GENERATE_PROFILE / RECURRING_RETURN / NPC_LIFECYCLE: **npc-generation.md**.
- Force ability keys in prompt: **force-catalog.md**.
- Not covered by a decided spec: the API transport (model choice, retries, truncation continuation, missing-choices repair), context assembly (history window, campaign summarization, event/agenda injection), the clock / Time Elapsed, the override commands ([OVERRIDE] etc.), people / pending events / galaxy-event tags, and rendering. **None — needs a v2 spec.**

## Open questions for Jared

1. Should the v2 prompt and context stay generic (no hard-coded "Jared"), using the character's name from state?
2. Keep the out-of-character commands ([OVERRIDE], [LORE CHECK], [SYSTEM EXPAND], [WORLD ADJUST], [CORRECTION], [AUTHOR NOTE]) in v2? If yes, can they ever change state, and how?
3. Campaign memory: keep a rolling AI summary (and how often), or build memory from code-owned event logs?
4. When the AI reply is cut off or is missing choices, should v2 retry, repair with a second call, or show the story with fallback choices?
5. Gemini model and key handling: stay on `gemini-2.5-flash` with the key in the URL from the browser, or move to a proxy?
6. Which tags with no v2 spec owner (KNOWN_PERSON, INTERACTION, PENDING_EVENT, NPC_AGENDA, RESOLVE_*, SCENE_NPCS, GALAXY_EVENT) become v2 events, and who owns the People tab and story threads?
7. Should the player-input modes SEQUENCE/INTENT (several exchanges per turn) survive under the one-exchange roll model in rolls.md?
