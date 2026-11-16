# Legacy V170 bugs and design flaws

Phase 1 audit of `legacy/index.html` (V170, commit 8bef4a1). All line numbers refer to that file unless noted. Severity: **High** = corrupts state, loses progress, or makes a feature not work at all; **Med** = wrong results in normal play; **Low** = cosmetic, rare, or dead code.

Sections:
1. Root causes (the patterns behind most bugs)
2. High-severity bugs, deduplicated across areas (BUG-NNN IDs)
3. Full findings by area (A–H), including Med and Low
4. v170-audit.md verification (consolidated)

Spot-check: the main agent re-read the cited lines for BUG-002, 003, 004, 005, 006, 010, 015, 016, 025, 026, 028, 029, 030, 031 and 032, and for the lore claims in Docs/SWRPG lore/. All matched.

## 1. Root causes

| # | Pattern | Bugs it produces |
|---|---|---|
| R1 | **The AI writes game state.** The SHEET and WORLD JSON replace whole objects, and an allow-list restores some fields afterward. Fields missing from the list (HP, strain, species, inventory, credits, renown, Shatterpoint session, any level without a `masterXP` entry) are AI-owned by accident | BUG-001, 006, 007, 015, 020, 021 |
| R2 | **Hand-written string parsing.** `slice(n)` with hand-counted prefix lengths; one generic `KEY=value` regex (5296) that silently drops bare tags and colon forms the prompt teaches | BUG-003, 004, 005, 016 |
| R3 | **Prose is parsed as data.** Around 35 regexes read strain, HP, barrier, XP, dates, time and combat end from story text, bypassing the tag guards | BUG-006, 007; A15–A20; D barrier rows |
| R4 | **No turn transaction.** `buildContext` mutates state and runs 2–3 times per turn. The pre-roll applies side effects before the main call. Retries re-run real rolls | BUG-008, 009; A8–A10 |
| R5 | **Duplicate sources of truth.** Prompt tables copied from engine constants; two Force ability tables; two "Time Elapsed" parsers; two canon NPC stat sheets; doc XP tables that don't match the code | BUG-019; C33; E prompt-table rows; G lore rows |
| R6 | **Jedi-only defaults.** Rank → life stage → mandatory training and milestones assume the Jedi Order for every faction | BUG-023; F and H faction rows |
| R7 | **Engine and UI tangled.** Rule functions write the DOM; render functions write game state; global mutable state | H UI rows; E "engine writes DOM" |
| R8 | **Features half-finished, or removed by later patches.** Story flags, legacy/lineage, the galaxy sim, the turn counter and V144's blade-color scrub | BUG-002, 017, 027 |

## 2. High-severity bugs (deduplicated)

| ID | Area | Symptom | Root cause | Lines | Found by |
|---|---|---|---|---|---|
| BUG-001 | AI pipeline | AI JSON can silently change hp, strains, barrier, species, backstory, discoveryAge, inventory, credits, renown, Shatterpoint focus/misread, and any level with no `masterXP` entry | Full `characterSheet` replace + allow-list restore (R1) | 4775, 4784-4803, 7183-7193 | A11, B, C17, E |
| BUG-002 | AI pipeline | Every turn is "Turn 1"; the campaign-summary API call fires every turn once history passes 16 messages; turn stamps on injuries and Shatterpoint records are always 0 | `turnCount++` was deleted (commit d66f0d3) and nothing increments it; `turnCount % SUMMARIZE_EVERY === 0` is always true | 2784, 6291, 4121, 5356, 5542, 6799, 6803 | A1, C20 |
| BUG-003 | NPCs | `RECURRING_RETURN=` never does anything | `slice(18)` on a 17-char prefix drops the first letter of the name | 5483-5487 | A2, B |
| BUG-004 | NPCs | `GENERATE_PROFILE=` creates an orphan profile keyed `"=Name"` | `slice(16)` keeps the `=` | 5595 | A3, B |
| BUG-005 | Shatterpoint | Misreads can never be cleared; focus can't be cleared by tag; the colon forms taught at 2493/2540/2543 never fire; perceived tier is always 1; the roll target starts with `=` | Bare tags fail the `=` regex at 5296 before the switch; `slice(22)`/`slice(17)` keep the `=`. Docs/updates.md:1404-1417 says these were fixed | 5296, 5536-5538, 5558-5560, 5571, 5589 | A4, A5, C5, C6, C19 |
| BUG-006 | AI pipeline | Markdown fallback overwrites JS-owned `alignment` and `hp`, and replaces `forceStats`/`stats` wholesale, **even when the JSON parsed fine** | Triggered by `**field:**` markers, not by a JSON failure; runs after the snapshot restore | 6034-6100 | A13, C10, F |
| BUG-007 | Strain/HP | Strain jumps, or resets to 0, mid-combat or on idle turns from recap prose ("Physical Strain: 2 → 40", "fully restored"); the AI can set HP/strain through the SHEET with no guard | Prose regexes and SHEET JSON bypass the activity, combat and mitigation guards that exist only on tags | 5913-5956, 4775, 5502-5532 | A15, E |
| BUG-008 | Combat | A 429 retry fires a second real roll for the same action | Recursive `callGemini` re-runs `preRollCombatExchange` | 4600-4602, 4633 | A6 |
| BUG-009 | Combat | A network error during a pre-roll silently deletes an ongoing fight (round, accumulated strain, form lock) | The `catch` nulls `activeCombat` whenever `lastRollResult` is empty, which is normal after a pre-rolled turn | 4557-4561, 5029-5031 | A7, E |
| BUG-010 | Rolls | A margin between 0 and 1 shows "Narrow loss" on the roll card while the AI is told "PLAYER WINS"; "Contested" is unreachable | Fractional margins skip `>=1` and `===0` and land in `>=-3`; `winner` uses `margin > 0` | 10971-10986, 4130 | E |
| BUG-011 | Opponents | The opening roll against an NPC generated that turn (`NPC_ROLL`/`PROFILE_STATS`) ignores the generated stats | The roll scan and pre-roll run before the CHANGES loop that applies those tags; the prompt tells the AI to emit both in one reply | 4997, 4601, 5614-5664, 1768 | E |
| BUG-012 | Rolls | An opponent with no stats gets a double tier-gap swing | Fallback `oppBonus = statBonus − tierGapBonus` while the player also gets `+tierGapBonus` | 10953, 10902 | E |
| BUG-013 | NPCs | Tier 4–6 NPCs fight with forms one tier higher; tier 6 saber 170 = Transcendent | Fixed `saber` pool values cross the `statToTier` bands | 3010-3012, 3094-3096, 6865-6874 | E |
| BUG-014 | Injury | An amputation can be erased | `INJURY_ADD` replaces any wound on that body part, permanent ones included; heal/sleep then clears it | 5355, 5365, 5048-5050 | E |
| BUG-015 | Health | 0 HP shows as 100/100 and has no penalty | `hp \|\| 100` everywhere; markdown `parseInt \|\| hp` can't set 0 | 7335, 7383, 7423, 10650, 4055, 4069, 5446, 10589, 6084 | E, H |
| BUG-016 | Opponents | Opponent INLINE stats still drift between rounds (the V138 bug persists) | Auto-register saves only dotted keys, but the prompt's own examples use bare keys, so the profile stays `stats:{}` | 4417-4434 vs 1968, 2222 | B, E |
| BUG-017 | Force abilities | Any ability (dark, Sith-locked, era-locked) appears on the sheet the first time the AI tags it; story-flag gates do nothing | No prerequisite, alignment or flag check on first XP; catalog `flags` never read; no tag can set story flags | 7127-7155, 5109-5148, 8772, 4891, 4912, 11678-11683 | D, G, H |
| BUG-018 | Force abilities | XP on a non-catalog key (e.g. `ForceHeal`) disappears after reload | Main paths accept unknown keys; `repairForceAbilities` runs only on load and drops them | 5109-5222, 7078, 8321 | D |
| BUG-019 | Force abilities | AI invents non-catalog ability names | The catalog key list is never sent; `FORCE_ABILITY_RULES` (sent every turn) uses 21 non-catalog names and contradicts catalog prerequisites | 10518-10556, 11091-11094 | D |
| BUG-020 | Stats/XP | AI-written levels become permanent "authoritative" XP | Sync overwrites only keys already in `masterXP`; the first award seeds from the AI-writable sheet level + `*XP.current` | 3396-3398, 7136-7155, 7183-7193 | C1 |
| BUG-021 | Stats/XP | The AI controls XP size | AI picks outcome (×3.0) and difficulty (×2.0) keywords; tier mult up to ×3.5 → up to 630 XP/h | 2084-2092, 6956-6965 | C2 |
| BUG-022 | Momentum | A dark-side discharge opens an unbounded XP multiplier on all story XP | Prompt opens the window after discharge; no clamp on mult or days; the promised alignment effect was never built | 1777, 2616, 5250-5264, 6969-6972 | C3, C4, F |
| BUG-023 | Rank | The AI can set any rank from any faction (youngling → master, Jedi → captain) | `RANK=` checks only a flat cross-faction set | 2999, 4744-4751, 5239-5246 | F |
| BUG-024 | Alignment | Consumed characters (< −75) can never climb back | `getRedemptionMultiplier` returns null and `addEquilibriumXP` exits early; no unlock event exists | 4200-4205, 4256 | F |
| BUG-025 | Calendar | A new character's age drops by 1 on the first turn | Birthday defaults to month 6, start date is month 1; `computeAge` subtracts 1 | 3383, 3403, 3434, 7820, 8012-8015 | B, G |
| BUG-026 | Calendar/Lore | Campaigns in 1–2 digit years (Clone Wars 22 BBY, GCW 1 BBY) never advance the date and get 3661 BBY lore and NPCs | Date regexes require 3–4 digit years; lore falls back to 3661 | 7704, 7711, 7736, 10499, 11024-11026 | G |
| BUG-027 | World | Galaxy events, Legacy Changes, Lineage and galaxyState panels are always empty; the prompt shows "Jedi=?" | Snapshot-restored every turn with no other writer (since V125) | 4888-4892, 4909-4913, 6158-6159 | G, H |
| BUG-028 | Lore | Campaign opens with the Hydian Way blockade already broken | Legacy copied the timeline's 3,660 BBY seed ("FACTION STATE SEEDS (3,660 BBY)", "Year 21 … blockade just broken", SW_Legends_Galaxy_Timeline.md:475-479) into the 3,661 campaign. Legends timeline: the blockade **begins** in 3,661 BBY (:381) and **breaks** in 3,660 (:391). The timeline itself is consistent. Judged against the Legends lore file, not Disney canon (re-checked under the Legends-only rule; see lore-checks.md) | 8976-8982, 9114 | G |
| BUG-029 | Lore | Satele Shan called "Daughter of Bastila Shan" | Data error. Legends (SWTOR) lore: "a descendant of the legendary Revan and Bastila Shan" (SW_Characters_09_GreatGalacticWar_ColdWar.md:195) | 9061 | G |
| BUG-030 | Simulator | Custom drills award 0 XP | Drills mapped to activities with no `weights`/`strainBias`; `_custom` never read | 11211, 11986, 11457 | H |
| BUG-031 | Simulator | After an auto-pause, Resume does nothing and the time skip is never synced to the AI | `runSimChunks` returns instead of awaiting `waitForResume`; `finishSimulation` skipped | 11909-11914, 12096-12101 | H |
| BUG-032 | Simulator | Abort while manually paused keeps XP, strain and date, but never sends the sync block (a V151 regression path) | `abortSimulation` never resolves the pending `waitForResume` promise | 12086, 12104-12113 | H |
| BUG-033 | Simulator | Infinite retry; possible double XP on retry | `catch` does `i--` with no cap; XP applied before later steps that can throw | 11916-11919, 11992-12053 | H |
| BUG-034 | UI/security | AI text can inject markup or script into the page | `innerHTML` with unescaped AI strings in many panels; `escapeHtml` used twice and doesn't escape quotes | 7353, 7419, 7583, 7642-7650, 8093, 8108-8142, 8187-8191, 5707, 6515-6517 | H, B |
| BUG-035 | Lore | Non-3661 campaigns get Great Galactic War lore and NPCs | Fallback to 3661 when the year regex fails; NPCs and era label not filtered by date | 10499, 10506-10510, 11024-11026 | G |

Notable Med bugs that deserve a mention in Phase 2 planning: mid-combat save loses the fight (E, G: 8227-8249); `buildContext` mutates state 2–3×/turn (A9, A10, G); critical threads sort as lowest priority (`priorityOrder[p] || 3`, 3970/3994; B, G); turns played during summarization are lost (G: 3653, 3696); sync block missing from `fullHistory` (G, H: 12181); non-Jedi characters get Jedi mandatory rows (F, H: 2997, 11171); a render function rewrites date and age (H: 8015, 8045, 8054).

## 3. Full findings by area
### Bugs and design flaws — Area A (master prompt + AI pipeline)

All lines are in legacy/index.html unless noted.

| # | Sev | Area | Symptom | Root cause | Line(s) |
|---|---|---|---|---|---|
| A1 | High | Turn counter | Turn label stuck at Turn 1. Summarization API call fires every turn once history is past 16 messages. Turn stamps are always 0 | `turnCount++` was deleted in commit d66f0d3 (May 23, 2026) and nothing else increments it | 2784, 6291, 4121, 5356, 5542; `window.turnCount` 6799, 6803 |
| A2 | High | NPC tags | `RECURRING_RETURN=` never works | `slice(18)` vs a 17-char prefix drops the first letter of the name, so the profile lookup fails | 5484-5487 |
| A3 | High | NPC tags | `GENERATE_PROFILE=` creates a profile keyed `"=Name"`, an orphan that CHARACTER:/INTERACTION never find | `slice(16)` keeps the `=` | 5595-5597 |
| A4 | High | Shatterpoint tags | Misread can never be cleared; focus can never be cleared by tag | `SHATTERPOINT_MISREAD_RESOLVED` / `SHATTERPOINT_FOCUS_CLEAR` have no `=`, so the generic regex fails before the `switch`. Docs/updates.md:1404-1417 claims they were fixed | 5296, 5571, 5589, 4049 |
| A5 | Med | Shatterpoint tags | Perceived tier is always 1; roll target text starts with `=`; colon forms taught at 2493/2540/2543 are ignored | `slice(22)`/`slice(17)` keep the `=`; colon form fails the regex | 5536-5538, 5558-5560 |
| A6 | High | Pre-roll / retry | A 429 retry fires a second real combat roll for the same action | Recursive `callGemini` re-runs `preRollCombatExchange` | 4600-4602, 4633 |
| A7 | High | Pre-roll | An exception in the pre-roll can delete an ongoing fight (accumulated strain, round, locked form) | Catch nulls `activeCombat` whenever `lastRollResult` is empty, and that is normal after a pre-rolled turn because it gets cleared | 4557-4560, 5029-5031 |
| A8 | Med | Pre-roll | Pre-roll runs side effects before the main call (startCombat, INLINE profile registration, backfill). If the main call then fails, they stay applied with no narrative | No transaction or rollback around a turn | 4469-4562, 4396-4434 |
| A9 | Med | Context | Repair calls (continuation, choices) lose the shatterpoint directive and re-run `checkMilestones`/`updateEventPriority` | `buildContext` mutates state (`resolved=true`, `surfaced=true`) and is called 2-3 times per turn | 3963-3964, 4008, 4172, 4656, 4688 |
| A10 | Med | Context | If the main call fails, the pending shatterpoint result and surfaced galaxy events are already consumed and lost | Same mutation happens before the API call | 4008, 4172, 4604 |
| A11 | High | SHEET ownership | AI JSON can silently change hp, strains, barrier, age, species, name, credits, inventory, renown, traits, shatterpoint focus and misread, and any stat with no masterXP entry | Allow-list restore instead of code ownership; `syncMasterXPToSheet` only touches keys that exist in `masterXP` | 4775, 4784-4803, 7183-7193 |
| A12 | Med | WORLD ownership | AI JSON controls location, era, sceneNPCs, activeThreats (merged into `galaxySimState`) | Same pattern; `activeThreats` is read from AI JSON | 4894-4932, 6164 |
| A13 | High | Markdown fallback | Overwrites JS-owned `alignment`, sets hp, replaces `forceStats`/`stats` wholesale, even when the SHEET JSON parsed fine | Triggered by `**field:**` text, not by JSON failure; bypasses masterXP | 6035-6099 |
| A14 | Low | Markdown fallback | Array fields never parse | `[^\]]` inside a template literal becomes `[^]` (verified with node) | 6041-6045 |
| A15 | High | Prose strain regex | Strain can jump mid-combat or on idle turns from prose like "Physical Strain: 2 → 40" or "fully restored" | Prose regex bypasses the CHANGES activity/combat guards | 5913-5956 |
| A16 | Med | Prose barrier regex | `forceBarrier` is zeroed by unrelated text ("the barrier between them fell") or set from "barrier at 3 meters" | Over-broad patterns over the whole narrative | 5959-5970 |
| A17 | Med | Prose COMBAT_END | Fights end on "combat over the years"; losses scored as wins whenever "success", "win" or "victor" appears anywhere | Loose regex; default outcome `win` | 6272-6288 |
| A18 | Med | Prose XP | `Name: +N XP` in prose gives N×50 XP; a second regex writes XP current/required directly with no gate | Legacy fallback kept after the tag system | 5976-6031 |
| A19 | Med | Direct-set tags | `STRENGTH=`, `FORCE_SENSE=`, `<Form>=N`, `AGE=`, `CREDITS=`, `XP_<Stat>=` change levels or XP without the XP system. Stat tags have no NaN guard | Old switch cases kept; not taught but accepted | 5303-5343, 5875-5894 |
| A20 | Med | Time | "Time Elapsed: 2 hours (120 minutes)" counts 4 h. The first prose line with "time elapsed" wins. Prose "It is now Day N" moves the date although the prompt says the date is JS-owned | Free-text regex; 3 date writers in this function | 5036-5045, 6189-6199, 6219, 6227-6262 |
| A21 | Med | Rendering | Story lines beginning "A-", "B.", "C-" become choice buttons | Choice regex `/^[A-E]\s*[\.\-\)]/` | 6431 |
| A22 | Low | Persistence | Half-applied turn saved | `KNOWN_PERSON` calls `autoSave()` inside the CHANGES loop | 5738 |
| A23 | Low | Tags | `PAIN_CHANNEL=active` is accepted at any alignment; `OPP_INJURY_ADD` has no severity whitelist; empty `RESOLVE_NPC_AGENDA` keyword wipes all of that NPC's agendas | Missing guards | 5439-5443, 5385-5395, 5787-5795 |
| A24 | Med | Prompt | Contradictory instructions (strain tags every turn vs never in combat; "no d20 math" vs duel display with d20; SHEET requested twice; TIER_GAP sign; barrier "strain 9+") | Prompt grew by accretion (V1xx patches) | 1722/1882, 1726-1731 vs 2362-2365, 2072 vs 2263-2280, 2034, 2310 |
| A25 | Med | Prompt | Player name "Jared" hard-coded in the system prompt and context directives | Written for one campaign | 1752, 1899, 2063, 2494, 2525 |
| A26 | Low | Prompt | Override replies still apply CHANGES/SHEET/WORLD state changes, so an [OVERRIDE] can silently change state | No `isOverride` gate on parsing | 4571-4578, 4711-6260 |
| A27 | Low | Security / cost | API key in the URL query on 5 call sites; up to 5 Gemini calls per turn (pre-roll, main, continuation, choices, summary) | Browser-only design | 3680, 4527, 4617, 4661, 4693 |
| A28 | Low | Roll scan | `ROLL:` without a following `ROLL_LABEL=` silently never fires | Fire is triggered only by the label line | 4353-4354, 4441-4450 |
| A29 | Low | COMBAT_START pre-scan | A `COMBAT_START:` line anywhere in the reply (even in prose) starts combat | Pre-scan uses all of rawText | 4958-4965 |


### Bugs — Area B (character creation, NPCs, items, species)

All line numbers refer to legacy/index.html (V170).

| Severity | Area | Symptom | Root cause | Line(s) |
|---|---|---|---|---|
| High | NPC | RECURRING_RETURN never does anything | `slice(18)` on a 17-char prefix drops the first letter of the name, so the profile lookup fails | 5483, 5486 |
| High | NPC | GENERATE_PROFILE profiles unreachable by name | `slice(16)` keeps the "=", so the key is "=Name" | 5595-5603 |
| High | NPC | Opponent INLINE stats drift between rounds (the V138 bug persists) | Auto-register saves only dotted keys; the prompt teaches bare keys, so the profile stays `stats:{}` | 4417-4434 vs 1968, 2222 |
| High | Creation/Species/Items | AI can erase or alter backstory, discoveryAge, species, inventory, credits | SHEET JSON fully replaces characterSheet; these are not in the restore list | 4775, 4784-4803 |
| Med | Creation | Age shows 1 lower than entered right after creation | Birthday is month 6 but the start date is month 1; computeAge subtracts 1 | 3383, 3403, 3434, 7820, 8012-8015 |
| Med | NPC | INTERACTION creates empty stat stubs that later shadow real stats (V159 root cause) | Unconditional stub creation | 5687-5692 |
| Med | NPC/events | "critical" threads and agendas sort as lowest priority | `priorityOrder[p] \|\| 3` with critical = 0 | 3970, 3994 |
| Med | NPC | Scene NPCs from lastSeen never detected; Temple NPCs always "present" | Uses the date half of lastSeen; 'temple' keyword too broad | 3727-3728, 3937 |
| Med | NPC | `tier` field has three meanings (canon flag vs dueling tier) | GENERATE_PROFILE/INTERACTION/CANON use 1/2 as a flag; NPC_ROLL uses 1-6 | 3575, 5597, 5655, 5689, 5488 |
| Med | NPC/Creation | Canon 3,661 BBY NPCs seeded in every era | `seedCanonProfiles` is not era-aware | 3443, 3566, 3628-3637 |
| Med | NPC | NPCs never age or grow except via an AI tag | No birth year/species on profiles | 3573-3626, 5652-5663 |
| Med | Items | Blade-color scrub described in docs does not exist | `scrubBladeColor()` removed at some point after V144 | (absent); Docs/updates.md V144 |
| Low | Creation | AI always sees "INNATE TALENT: none" | Wrong key `innatetalent` | 4088, 7589 |
| Low | Creation | discoveryAge collected but never used | Dead field | 3372, 3429 |
| Low | Creation | ABY campaigns unsupported | 'BBY' hard-coded | 3403, 3433-3434 |
| Low | Creation | Bounty-hunter "veteran" labeled as the Mandalorian veteran; RANK= accepts cross-faction ranks | Duplicate rank value; flat validation set | 2980, 2985, 2999, 4747, 7351 |
| Low | Creation | Non-Jedi old saves migrated to Jedi ranks | Jedi-only migration map | 8274 |
| Low | Creation | Changing the rank dropdown discards manual stat allocations | `onchange` re-randomizes | HTML 1234 |
| Low | Creation | Starting alignment ignores the chosen philosophy | Faction-only | 3405-3408 |
| Low | Creation | AGE= tag lets the AI set age directly | Switch case exists | 5886 |
| Low | Items | Credits hidden when the inventory is empty | Credits line nested in the inventory check | 7581-7586 |
| Low | Items | "[object Object]" and HTML injection from inventory items | Assumes strings, raw innerHTML | 4084, 7583 |
| Low | Items | CREDITS= tag dead | Not taught in the prompt | 5887 |
| Low | Items | Sith/non-Force characters get a green training saber line in every prompt | Faction-blind default and injection | 4062, 7205-7207 |
| Low | NPC | PROFILE_STATS before profile creation is silently dropped | Requires an existing profile | 5618 |
| Low | NPC | NPC_ROLL can overwrite a canon NPC's stats | No canon guard | 5651-5663 |
| Low | NPC | RESOLVE_NPC_AGENDA with an empty keyword wipes all agendas | `includes('')` | 5790-5793 |
| Low | NPC | Disposed opponent remains in trackedCharacters | Only the profile is deleted | 3145 |
| Low | NPC | Prompt fragment "- forceAbilities: plain numbers only." under the INTERACTION docs | Prompt text spliced from another list | 1909-1911 |
| Low | NPC/Creation | Not seedable | Direct `Math.random()` | 3054, 3108, 3174 |
| Low | Species | Age input capped at 120 for all species | Fixed HTML max | HTML 1217 |


### Bugs and design flaws — Area C (stats/XP, proficiencies/talents, Shatterpoint, momentum)

| # | Severity | Area | Symptom | Root cause | Line(s) |
|---|---|---|---|---|---|
| C1 | High | Stats/XP | AI-written levels become permanent "authoritative" XP | Sync only overwrites keys already in `masterXP`; creation seeds only stats > 0 and no Force abilities; first award seeds from the AI-writable sheet level + `*XP.current` | 3396-3398, 7136-7155, 7183-7193 |
| C2 | High | Stats/XP | AI controls XP size | AI picks outcome (up to x3.0) and difficulty (up to x2.0) keywords; JS roll not linked to outcome; tier mult up to x3.5 -> 630 XP/h max | 2084-2092, 6956-6965 |
| C3 | High | Momentum | Dark-side discharge grants an XP multiplier | Prompt opens window after discharge; V128 made it multiply all story XP; promised alignment effect not implemented | 1777, 2616, 5250-5264, 6969-6972 |
| C4 | High | Momentum | Unbounded XP multiplier / duration | No clamp on mult or days | 5253-5263 |
| C5 | High | Shatterpoint | `SHATTERPOINT_MISREAD_RESOLVED` and `SHATTERPOINT_FOCUS_CLEAR` never fire; misread flag permanent | Bare tags fail the `KEY = value` regex before the switch | 5296-5297, 5571, 5589; taught 1749, 1751, 2553, 2559 |
| C6 | High | Shatterpoint | Colon-form `SHATTERPOINT_PERCEIVED:` / `SHATTERPOINT_ROLL:` silently ignored (no roll fires) | Same regex requires `=`; prompt teaches both forms | 5296, 2493, 2540-2545 vs 1746-1747 |
| C7 | Med | Stats/XP | Prose "Name: +N XP" gives N x 50 XP | Fallback runs on full `rawText`; gated only by TRAINING:/COMBAT: | 5976-6002 |
| C8 | Med | Stats/XP | Untaught stat-set and `<Name>=N` tags change levels | Parser cases still live; no sync after CHANGES loop | 5875-5893 |
| C9 | Med | Stats/XP | `XP_<Stat>=N` injects XP into the next seed | Writes `*XP.current`, which seeding adds to totalXP | 5302-5342, 7142-7151 |
| C10 | Med | Stats/XP | Markdown fallback replaces stats wholesale | Fallback assigns parsed objects directly | 6035-6098 |
| C11 | Med | Talents | Blade Intuition etc. don't boost combat/XP:/proficiency awards | `applyTalentXPMultiplier` only called in TRAINING: main and sim | 5142, 11996 (missing at 5130, 5160, 5187, 5214, 6600, 6604) |
| C12 | Med | Talents | AI aptitude text becomes a real talent | `repairTalentConsistency` promotes matching labels | 7044-7052 |
| C13 | Med | Talents | Zero-talent characters accept AI-written talents | Restore skipped when snapshot array is empty | 4784-4785 |
| C14 | Med | Proficiency | Soft cap differs between code and AI context at 20/40/60/80 | `>=` in code vs `<=` in lore context | 7294-7295 vs 11090 |
| C15 | Med | Shatterpoint | No interpretation strain ever applied; AI can't apply it either | No SP strain code; `FORCE_STRAIN=` increases dropped without TRAINING/COMBAT tags and during combat | 5057, 5508; prompt 2474-2489 |
| C16 | Med | Shatterpoint | Partial reads treated as misreads | `misread` set for `contested` | 6798, 6802 |
| C17 | Med | Shatterpoint | SP session fields rewritten by AI SHEET JSON | Not in snapshot/restore list | 4722-4772, 4784-4804 |
| C18 | Med | Shatterpoint | Path A has two tracks; 5x award deletes the 1x entry, sheet level re-seeds it | Guards only for ShatterSense holders | 5119-5121, 6736-6737, 7136-7155 |
| C19 | Low | Shatterpoint | Perceived tier always 1; roll target starts with "=" | `slice(22)` / `slice(17)` keep the separator | 5538, 5560 |
| C20 | Low | Shatterpoint | `turn` always 0 in roll/misread records | `window.turnCount` undefined (`let` at top level) | 2784, 6799, 6803 |
| C21 | Low | Shatterpoint | Sim practice uses Legendary outcome weight at L5 | Level used as tier index | 11554, 11975 |
| C22 | Low | Shatterpoint | Path A cap (L20), "roll to notice below L10" and tier locks not enforced | Prompt-only rules | 2455, 2474-2477; 5536-5556 |
| C23 | Low | Talents | Battle Meditation (Innate) label says "XP x0.3"; code gives x3.33 | Label/doc wording | 7003-7005, 8744 |
| C24 | Low | Talents | 4 talents have no mechanics | Labels only | 8737-8742 |
| C25 | Low | Proficiency | Trickle undiscounted; 1% loops back to the trained sub | Forward trickle raw; back-trickle calls applyXPToSheet which trickles forward | 7163, 7268-7285 |
| C26 | Low | Proficiency | Same session scored on two scales (TRAINING: tier-mult vs PROFICIENCY: raw) | Two entry paths | 5123-5137 vs 5174-5196 |
| C27 | Low | Momentum | Window can never expire | `expiresDate` '' when no date; parse errors swallowed | 5261, 4916-4923 |
| C28 | Low | Stats/XP | Keywords `standard`, `wall`, `fail` (taught in legacy/CLAUDE.md) silently = x1.0 | Missing from maps | 6957-6962 |
| C29 | Low | Stats/XP | Tier names differ between state block and prompt | `statToTier` names vs prompt PROGRESSION TIERS | 6865-6874, 4054, 4059 vs 2645-2652 |
| C30 | Low | Stats/XP | Domain averages skip forceOutput / forceControl; ability avg drops when a new ability is learned | Hand-picked lists | 3733-3750 |
| C31 | Low | XP inject | Preview shows wrong result for stats without a `masterXP` entry | Preview uses total 0, apply seeds from sheet | 8465-8468 vs 7136-7155 |
| C32 | Low | Creation | Pool may be left unspent; padawan saber 40 vs other caps 30 | 500-pick random walk; table values | 2920, 3167-3181 |
| C33 | Low | Docs | Cumulative XP tables in XP Reference / legacy/CLAUDE.md are wrong (L40 31,440 vs 19,943; L100 882,440 vs 1,238,115) | Doc error | 6904-6914 |
| C34 | Low (cross-area: combat XP) | Combat | `COMBAT:` tag base XP: tierGap -1 or lower gives 120 (tier-0 base is 0, falls back to `|| 120`), tierGap 0 gives 50 | `calcCombatXP` called without opponentTier; `oppTier = 1 + tierGap` | 5159, 7103-7104 |


### Bugs and design flaws: Area D (Force abilities and lightsaber forms)

All lines are legacy/index.html.

| Severity | Area | Symptom | Root cause | Line(s) |
|---|---|---|---|---|
| High | Unlock | Any ability (dark, Sith-locked, era-locked) can appear on the sheet the first time the AI tags it | No prereq, alignment or flag check on first XP; the prompt calls the first TRAINING: tag the unlock | 7127-7155, 5109-5148, 2386-2390 |
| High | Unlock | Story-flag gates do nothing | Catalog `flags` never read; no tag sets story flags | 8772, 8777-8945 (flags fields), 11661-11681 |
| High | Data loss | XP on a non-catalog key (e.g. `ForceHeal`) disappears after reload | Main paths accept unknown keys; `repairForceAbilities` runs only on load and drops them | 4775, 5109-5222, 7078, 8321 |
| High | AI context | AI invents non-catalog names | Catalog key list never sent; `FORCE_ABILITY_RULES` (sent each turn) uses 21 non-catalog sub names and wrong prereqs; LORE_DATABASE uses 16 non-catalog keys | 10518-10556, 11091-11094, 2390 |
| Med | Data model | Two in-code ability tables disagree (ForceWave, ChainLightning, BattleForesight, BattleMeditation, ForceDrain, SithAlchemy prereqs; ForceBarrier/ForceBody/ForceSense "subs") | `FORCE_ABILITY_RULES` written separately and never reconciled | 10518-10556 vs 8774-8946 |
| Med | Prereqs | ForceAffliction, ForceSubjugate, ForceStormWormhole can never be offered in the sim | Prereq on a sub-ability compared as a level; subs only have proficiency % | 11199-11200, 8942, 8899, 8911 |
| Med | Proficiency | Nested sub-abilities (ForceRend/Grip/Crush/Horror/Insanity) give a level to a sub-ability | 20% trickle-back calls `applyXPToSheet('forceAbilities.'+par)` where `par` is itself a sub | 7270, 8790-8793, 8842-8843 |
| Med | Tags | `XP: forceAbilities.<SubKey>` creates a level track for a sub-ability | No sub redirect in the XP: handler (TRAINING: has one) | 5205-5222 vs 5124-5138 |
| Med | Tags | `PROFICIENCY:` with an unknown parent unlocks the parent | Handler checks only `catalog[sub].par === parent`; trickle creates the parent's level | 5174-5198, 7270 |
| Med | Forms | `Kii-Shikk` saved as `Kiishikk`; misses weights and labels | `_FORM_CANON` key keeps its hyphen but lookup strips hyphens | 4843, 4846-4847 |
| Med | Forms | Form XP under two spellings: one entry is thrown away | Merge keeps the max-XP entry, not the sum | 4852-4855 |
| Med | Forms | Vaapad/Juyo/Jar'Kai available with no prereqs or flags | No form gating anywhere | — (absence; see lore doc 188-194) |
| Med | Barrier | Barrier zeroed or set by unrelated prose; null barrier made to appear | Loose single-line regexes on narrative text | 5959, 5963-5969 |
| Low | Barrier | Barrier integrity has no gameplay effect | Nothing outside display reads `forceBarrier` | 4064, 7386-7394, 5535 |
| Low | Prompt | Prompt says every Padawan+ has a passive barrier, and "strain 9+" breaks it | Stale prompt text (old 0-10 strain scale); contradicts the catalog's FC10 prereq | 2307, 2310, 8858 |
| Low | Prompt | Prompt says subs are not valid TRAINING: targets; code accepts them | Prompt not updated after V124 | 1835 vs 5123-5138 |
| Low | Proficiency | Soft cap at base level 20 is 50% in the sidebar and 25% in the AI context | `>=20` vs `<=20` boundary | 7295, 11090 |
| Low | Proficiency | Trickle-back uncapped (lore caps it at the parent's xpRequired) | Not implemented | 7269-7270; lore doc 142 |
| Low | Repair | Alias merge: object/number mix skipped; other fields dropped; duplicates summed | Ad-hoc merge rules | 7079-7088 |
| Low | Sim | `anySaberForm` returns NaN if a form value is an object; mixes `cs` with the global `characterSheet` | `Math.max(...Object.values())` on raw values | 11193-11203 |
| Low | Catalog | ControlPain prereqs/D differ from lore (FC20/Med15/null vs FC25/Med20/2.5) | Added in V139 without matching lore | 8816 |
| Low | Catalog | Force Plague missing; several lore OR-conditions dropped (Dark Transfer, Mechu-deru, Force Enlightenment) | Lore conditions that are not numbers were not modeled | 8876, 8880, 8924, 8942 |
| Low | Label scan | "Shien/Djem So" opponent label resolves to `Shien` | Substring scan in key order; `Shien` comes before `ShienDjemSo` | 10737, 10747-10751 |
| Low | NPC | SithInquisitor always gets ForceLightning; no gates | Archetype list skips the catalog | 3031-3039, 3104-3111 |
| Low | Shatterpoint | Four separate guards for "Shatterpoint not in forceAbilities" | Dual existence as catalog root and separate track | 4807-4809, 5120, 5212, 6735-6737, 6760-6762, 7059-7063 |


### Bugs and design flaws — Area E (combat, rolls/opponents, injury/HP/strain)

| Sev | Area | Symptom | Root cause | Line(s) |
| --- | --- | --- | --- | --- |
| High | Rolls | Roll card says "Narrow loss" but the AI is told "PLAYER WINS"; banner says "You barely lost" | Fractional margin in (0,1) skips `>=1` and `===0` and lands in `>=-3`; `winner` uses `margin>0`. "Contested" is unreachable | 10971-10979, 10986, 4130, 10820-10833 |
| High | Opponents | Opening roll vs a freshly `NPC_ROLL`/`PROFILE_STATS` NPC ignores the generated stats | Roll scan (4997) and pre-roll (4601) run before the CHANGES loop that applies these tags (5614-5664); prompt tells the AI to emit both in one reply (1768) | 4997, 5614-5664, 1768 |
| High | Rolls | Opponent with no stats gets a double tier-gap swing (8 pts for one tier) | Fallback `oppBonus = statBonus − tierGapBonus` while the player also gets `+tierGapBonus` | 10953, 10902 |
| High | NPC gen | Tier 4-6 NPCs fight with forms one tier higher; tier 6 saber 170 = Transcendent | Fixed `saber` pool values 90/120/170 cross the statToTier bands; core/force averages fall below tier | 3010-3012, 3094-3096, 6865-6874 |
| High | Injury | Amputation can be erased | `INJURY_ADD` replaces any wound at that body part, including permanent; then `INJURY_HEAL` or a 7 h sleep clears it | 5355, 5365, 5048-5050 |
| High | Health | 0 HP shows 100/100 and has no penalty | `cs.hp ‖ 100` everywhere; `getHPThresholdPenalty(0)=0`; markdown `parseInt ‖ hp` can't set 0 | 10650, 4055, 4069, 5446, 7335, 7383, 7423, 10589, 6084 |
| High | Strain | AI can set strain/HP to anything, mid-combat included | SHEET JSON replaces the sheet with no hp/strain snapshot; the later tag delta is computed against the overwritten value | 4719-4803, 4775, 5502-5532 |
| Med | Strain | Strain jumps or zeroes from recap prose | Narrative regex (arrow, "reduced to", "fully restored", triple) writes absolute values with no activity or combat gate | 5913-5956 |
| Med | Strain | Strain can drop to 0 with no rest | Decreases are never gated or validated in tags/markdown/regex | 5507, 5518, 5529, 6060-6082 |
| Med | Combat | Reload mid-fight loses combat strain, round, opponent injuries, form lock | `activeCombat` not in `buildSave`; `COMBAT_END` rebuilds `round:5, acc:0` | 8227-8247, 5096-5098 |
| Med | Combat | Network error on a pre-roll silently ends the fight | `catch` nulls `activeCombat` whenever there's no `lastRollResult`, even for ongoing combat | 4557-4561 |
| Med | Combat | Prose fallback ends combat and almost always records "win" | Phrase regex over the whole reply; `/win/` matches "window/wind/winter" and is checked first; no fate | 6271-6287 |
| Med | Combat XP | XP ignores the real opponent strength and result | Base uses the AI's `COMBAT_END` tier; outcome/engagement AI-chosen; overwhelming_win 0.5 < narrow_loss 1.5 | 5102, 7103-7122 |
| Med | Rolls | Systematic player bias | Opponent gets no experience bonus (player gets form×0.4 + FC×0.3 + FS×0.2) | 10852-10871, 10956-10959, prompt 2191 |
| Med | Rolls | Opponent tier set by an unrelated stat (e.g. charisma) | `getOppPrimaryStatValue` final fallback returns the first value | 10698-10699 |
| Med | Rolls | Hybrid two-form roll gets an extra form bonus | Tier uses only `paths[0]`; bonus sums all paths; prompt says "averages" | 10873-10875, 1993 |
| Med | Rolls | Strain has no roll effect despite prompt tables | `calcRollPenalties` has no strain term; prompt gives two different strain-penalty schemes | 10648-10673, 2024-2025, 2331-2342 |
| Med | Opponents | INLINE bare-key stats (prompt's own example format) re-read each exchange | Only dotted keys are persisted; an empty profile stub makes `_existingStats` null | 4415-4432, 1968, 2222, 2224 |
| Med | Opponents | Profile forks on name drift ("Malgus" vs "Darth Malgus"; pre-roll vs main name) | Exact-string profile keys; `COMBAT_START` rename at 5072-5073 doesn't move stats | 4389, 5072-5073, 3596 |
| Med | Clock | Combat never advances the clock | Seconds rounded to whole minutes, no carry-over; budget is prompt-only | 6191-6198, 2217, 4142 |
| Med | Injury | Minor wounds clear on any 7 h block (not just sleep) | Auto-clear keys off the first "time elapsed" line only | 5034-5050 |
| Low | Combat | Duration factor off by one | `round` starts at 1 and counts exchanges | 6553, 6646, 6595, 7107 |
| Low | Combat | Form lock overrides an explicit player form change | Rewrite has no player-intent check | 4362-4370 |
| Low | Opponents | `NPC_ROLL` re-rolls stats if repeated | Handler always overwrites `stats` | 5652-5662 |
| Low | Opponents | Backfilled stats are invented and permanent | Mean of existing stats ‖ 20, persisted | 10758-10778 |
| Low | Rolls | Opponent injuries double-counted | Prompt +2 TACTICAL for injured opponent plus code subtracts wound weights | 2014, 10956-10959 |
| Low | Injury | Pain channel persists across turns; no dark-pressure/strain cost | Snapshot restore; costs not implemented | 4728, 4803, 10656-10660 |
| Low | Injury | Opponent permanent injuries never surface | Write-only field | 5409-5420 |
| Low | Injury | "Generic" rolls (endurance/willpower only) take arm/leg wound penalties | Fallback `apply all` branch | 10636 |
| Low | Code | Dead/duplicate logic | `tierGapBonus()` unused; severity weights ×4; HP penalty re-implemented in state block | 6877-6882, 4068-4070, 5351, 6651-6652 |
| Low | Code | Prompt strain reference table duplicates engine values (V161 drift risk) | Hand-copied table | 2240-2245 vs 6626-6632 |
| Low | Code | Engine functions write DOM | `updateCombatStrain`, `fireRoll` | 6670-6680, 11003-11007 |
| Low | Tests | Rolls/NPC gen not reproducible | 6 bare `Math.random()` calls | 3054, 3108, 3174, 6782, 10904, 10960 |
| Low | Prompt | Tier names differ between prompt and code; TIER_GAP sign text contradicts itself | Unsynced text | 1803, 1973-1980, 2645-2652 vs 6865-6874; 2034 |


### Bugs and design flaws — area F

| Sev | Area | Symptom | Root cause | Line(s) |
|---|---|---|---|---|
| High | Alignment | Prose `**alignment:** N` silently resets alignment | Markdown fallback runs whenever markers are present (not only when JSON fails), after the snapshot restore, and writes alignment directly | 6035-6036, 6051, 6085 |
| High | Alignment | Consumed characters can never climb back (meditation, WOF and passive drift all do nothing) | `getRedemptionMultiplier` returns null below −75 and `addEquilibriumXP` returns early; no event exists to unblock it | 4200-4205, 4256 |
| High | Rank | AI can set any rank from any faction (youngling→master, Jedi→captain) | RANK= checks only the flat cross-faction set; no requirement, faction or sequence check | 2999, 5239-5246, 4744-4751 |
| Med | Alignment | Momentum window boosts all training XP instead of dark acts | `applyMomentumToXP` applied to stat XP sites; alignment XP untouched | 6969-6972; 5130, 5141, 5160, 5187, 5214, 6600, 6604 |
| Med | Alignment | Dark pressure never falls on its own; repeated `=100` discharges every turn | Only writes are AI total-set and discharge; no decay; no rate limit | 5827-5868 |
| Med | Alignment | `DARK_PRESSURE=+15` meant as a delta sets pressure to 15 | Tag takes a total but the prompt lists deltas | 2607-2614, 5830 |
| Med | Alignment | One dark act counted twice | Prompt teaches both negative ALIGNMENT_XP and a DARK_PRESSURE rise for the same acts | 2593-2597, 2609-2614 |
| Med | Alignment | Old saves drift to alignment 0; AI can set philosophy | Load migration doesn't seed equilibrium/philosophy; the tick defaults eq to 0; the null snapshot skips restore | 8260-8263, 4309-4312, 4795 |
| Med | Rank/sim | Sith/Republic/Mandalorian characters get Jedi temple mandatory rows, incl. light-side alignment XP | lifeStage is derived faction-blind; `SIM_MANDATORY` keyed only by lifeStage | 2997, 8711-8721, 12022-12025 |
| Med | Rank | Promotion silently drops "with padawan" / council stages and the Padawan Instruction row | RANK= maps only to 4 bare stages; `*_with_padawan` reachable only via the untaught LIFE_STAGE= | 2997, 5243, 8722-8727; updates.md:139 |
| Med | Milestones | Padawans get youngling milestones; padawans and knights get "Agri-Corps risk" | Checks use only age plus domain averages, not rank/lifeStage | 3754-3813, 3886-3893 |
| Med | Milestones | Non-Jedi factions get Jedi selection/Agri-Corps threads | isSith else Jedi set; no other faction sets | 3888-3890 |
| Low | Milestones | Milestone set flips on a temporary alignment spike | Uses current alignment < −50 instead of equilibrium/faction | 3889 |
| Low | Milestones | Thresholds misfire under the new curve; forceOutput ignored | Fixed thresholds; domain averages read sheet copies and skip forceOutput | 3733-3749, 3751-3881 |
| Low | Milestones | Non-lore / era-blind NPCs attached ("Master Denko"; Zym in every era) | Hard-coded npcs arrays | 3758-3839 |
| Low | Alignment | WOF spike ignores multipliers, applies when Consumed, skips the peak update; card shows the wrong XP | Direct `alignment +=` beside `addEquilibriumXP` | 5275-5288 |
| Low | Alignment | Ability prereqs unlock on a temporary spike | `darkSide`/`lightSide` prereqs read current alignment | 11192-11195 |
| Low | Alignment | Falling from Luminous is ~100× cheaper per point than climbing | Dark threshold uses `min(0,eq)`, flat 80 for eq ≥ 0 | 4186-4197 |
| Low | Alignment | Long sims lose or misapply drift | Lump `addEquilibriumXP` with a 50-step cap and leftover clamp; drift rate fixed from the start value | 12034-12035, 4264-4284, 4329 |
| Low | Alignment | Momentum window never expires if WORLD JSON fails | Expiry check lives inside the WORLD parse path | 4915-4924 |
| Low | Alignment | Tier label / threshold logic duplicated 4×; transition scene collapses tiers | Copy-paste | 4033-4036, 7317-7325, 12301 |
| Low | UI | Alignment bar tier ticks in the wrong places | Hard-coded 18/30/37/63/70/82% vs. true 12.5/25/37.5/62.5/75/87.5% | 7364-7369 |
| Low | Alignment | PAIN_CHANNEL shown "ACTIVE" for light characters | Gate checked only at roll time | 5439-5442, 4077, 10657 |
| Low | Alignment | DarkAffinity "drift accelerates", prompt tier effects, `lastLightActs` do nothing | Never implemented | 8740, 2630-2636, 3410/8263 |
| Low | Rank | LIFE_STAGE and RANK in one block: result depends on line order | Pre-scan prefers RANK; main loop is sequential | 4738-4750, 5225-5246 |
| Low | Milestones | `worldState.lastMilestoneCheck` is dead | Initialised, never used | 1889, 3438 |


### Bugs and design flaws — Area G

All lines refer to legacy/index.html.

| Sev | Area | Symptom | Root cause | Line(s) |
|---|---|---|---|---|
| High | Calendar | A new character's age drops by 1 on the first turn | Birthday defaults to Day 1 of month 6; start date is Day 1 of month 1; computeAge subtracts 1 | 3383, 3403, 3434, 7820, 8012-8015 |
| High | Calendar | Clone Wars (22 BBY) / GCW (1 BBY) campaigns: date never advances; age and events break | Date regex requires 3-4 digit years | 1181-1182, 7704, 7711, 7736 |
| High | World | Galaxy, Legacy and Lineage panels always empty; prompt shows "Jedi=?"; lastGalaxyEventDate never set | galaxyEvents/legacyChanges/lineageRecord/galaxyState are restored from the snapshot every turn and have no other writer (since V125) | 4888-4892, 4909-4913, 4092-4096, 6158-6159 |
| High | Lore | Non-3661 campaigns get Great Galactic War lore and NPCs | Fallback to 3661 when the regex fails; activeNPCs and era label not filtered by date | 10499, 10506-10510, 11024-11026 |
| High | Lore | Campaign opens as if the Hydian Way blockade is already broken (canon: begins 3661, broken 3660) | Year-21 seed copied into the 3661 currentEra; Hylo Visz status also wrong | 8976-8982, 9114 |
| High | Lore | Satele Shan called "Daughter of Bastila Shan" (canon: descendant, ~300 yrs apart) | Data error | 9061 |
| Med | Calendar | The AI can still jump the date forward with "It is now Day N Month" | Date regex fallback still active for date (only removed for time) | 6229-6258 |
| Med | Calendar | Seconds-only combat turns skip the alignment tick; the two parsers disagree | Duplicate "Time Elapsed" parser with no seconds and no bold strip | 5036-5043 vs 6189-6198, 6267 |
| Med | Calendar | "1 day", "an hour" etc. elapse 0 time | Regex handles digits + hour/min/sec only | 6192-6199 |
| Med | Calendar | Unknown month name silently becomes a day of year | Fallback branch | 7729-7730, 8040-8046 |
| Med | Calendar | Sim time skips never set the time of day (contradicts Sim Rules §10) | Only date advanced | 12053 |
| Med | Events | Critical threads sort below low ones | `priorityOrder[p]\|\|3` treats 0 as falsy | 3970, 3994 |
| Med | Events | All threads (even low) become "MUST ADDRESS" after 3 days; milestones count from creation | Escalation rule + triggerDate=today | 3895, 3920-3922 |
| Med | Events | Galaxy events marked surfaced even when the request fails, or seen only by a retry call | Side effect inside buildContext, which runs up to 3×/turn | 4008, 4604, 4656, 4688 |
| Med | Memory | Turns played while the summary runs are lost from memory | Captures toSummarize, then trims the live array with slice(-12) after await | 3653, 3696 |
| Med | Memory | Time skip is forgotten after 6 turns | Sync block not pushed into fullHistory, so the summarizer never sees it | 12181 (vs 12335 for transition scene) |
| Med | Save | Load/Save modal won't open if any slot is corrupt | Unguarded JSON.parse | 12425 |
| Med | Save | Manual save over quota fails with no error; each manual save doubles storage | No try/catch; autoSave() after slot write | 12445-12446, 12468-12469 |
| Med | Save | Reload mid-combat loses the fight and its accumulated strain | activeCombat not in save | 8227-8249 |
| Med | Save | New Game then reload brings the old game back | Autosave not cleared; activeCombat not reset | 3542-3568 |
| Med | Save | API key sent in URL query; plain-text storage; inconsistent validation | Design | 3470, 3518, 3680, 4617, 4661, 4693 |
| Low | Calendar | Starting weekday "Primeday" disagrees with formula (Centaxday for 3661 BBY) | Hardcoded string | 3434, 7691 |
| Low | Calendar | BBY counts past 0 into negatives; never ABY | Rollover logic | 7739-7746 |
| Low | Calendar | Prompt both forbids and requires the AI to update inGameDate | Contradictory prompt lines | 1895 vs 1912 |
| Low | Calendar | setManualDate applies the date, then returns early on a bad time without saving | Order of operations | 7862, 7871 |
| Low | Flags | Story flags have no effect; catalog `flags` never checked; not sent to AI; two flag stores | Unfinished feature | 3424, 4754, 8772, 11678-11684 |
| Low | World | _mergedLog not protected; dropped whenever the AI omits it | Snapshot list incomplete | 4879-4913, 8071-8086 |
| Low | Memory | "Your full save history is preserved" is false | fullHistory trimmed to 12 after summary; feed to 50 | 6386, 3696, 8246 |
| Low | Lore | Two divergent stat sheets for Satele/Zym/Malgus; Satele tier "Master" vs status "Knight" | CANON_PROFILES_3661BBY vs LORE_DATABASE | 3579-3603, 9039, 9055-9060, 9070 |
| Low | Lore | Jace Malcom called SIS (canon: trooper / Supreme Commander) | Data error | 9105 |
| Low | Save | Save names and AI feed restored as raw HTML | innerHTML | 8338, 12437 |


### Bugs and design flaws — Area H

| Sev | Area | Symptom | Root cause | Line(s) |
|---|---|---|---|---|
| High | Simulator | Custom drills award 0 XP and use the default strain bias | Drills mapped to activities without `weights`/`strainBias`/`defaultIntensity`; `_custom` is never read | `legacy/index.html:11211`, `11986`, `11457` |
| High | Simulator | After an auto-pause, Resume does nothing; the time skip is never synced to the AI | `runSimChunks` `return`s instead of awaiting `waitForResume`; `simPauseCallback` stays null; `finishSimulation` is skipped | `11909-11914`, `12096-12101` |
| High | Simulator | Abort while manually paused: XP, strain and date are kept, but no sync block (V151 regression path) | `abortSimulation` never resolves the pending `waitForResume` promise, so the loop hangs | `11900`, `12086`, `12104-12113` |
| High | Simulator | Infinite retry; possible double XP on retry | `catch` does `i--` with no cap, and XP is applied before later steps that can throw | `11916-11919`, `11992-12053` |
| Med | Simulator | Strain over long simulations is barely cumulative (one day's net per week) | Delta applied once per 7-day chunk | `12044-12050` |
| Med | Simulator | Overtraining penalty is identical for every week of a run | `simGetStrainPenalty` uses the planned daily estimate, not current or accumulated strain | `11564-11566`, `11933` |
| Med | Simulator | Shatterpoint practice outcome weight is wrong | `SIM_OUTCOME_WEIGHT` indexed by level instead of tier−1 | `11554`, `11976` |
| Med | Simulator | Non-Jedi characters get Jedi "with Master"/youngling mandatory rows | `RANK_LIFESTAGE_MAP` collapses every faction onto Jedi life stages | `2997`, `11171` |
| Med | Simulator | "Personal Input" never yields XP despite the UI promise | Only pasted into the narrative prompt | `1536`, `12066-12067` |
| Med | Simulator | Difficulty / tier-gap training missing; rows are always standard | No UI control; `r.difficulty` fixed | `11296`, `11986` |
| Med | Simulator / flags | Story flags gate nothing; the AI can never set them | No code reads catalog `flags`; WORLD snapshot restores `storyFlags`; no tag exists | `4891`, `4912`, `11678-11683` |
| Med | Simulator / AI | Sync block not in `fullHistory`; lost on the next summarize | Pushed to `recentHistory` only | `12181` vs `12335` |
| Low | Simulator | Preview differs from the XP actually applied; warning text says "no XP penalty" at ×0.9 | Preview omits the talent multiplier; stale copy | `11537`, `11996`, `11499`, `11571` |
| Low | Simulator | Mandatory hour edits reset on reopen; 0 hours impossible | Rows rebuilt with defaults; `parseFloat()\|\|default` | `11145`, `11177-11184`, `11362`, `11448`, `11960` |
| Low | Simulator | >24 h schedule allowed; "1 Year" = 364 days of a 368-day year | No validation; 52×7 | `11374`, `11867` |
| Low | Simulator | Pause-condition text ignored | Only ">3 level-ups" checked | `11881`, `11909`, `12083` |
| Low | Simulator | Time of day never advanced; sync block stats hardcoded to ShiiCho | — | `12053`, `12156`, `12166` |
| Low | Simulator | Empty AI narrative on gemini-2.5-flash | 180/100 max tokens include thinking tokens | `12068`, `12076` |
| Low | Simulator | API key in URL query string | — | `12372` |
| Low | Simulator | Custom drills lost across devices / on Clear Cache | Stored in `localStorage` only, outside the save | `11689`, `11714`, `8582` |
| Low | Strain sync | Blocking `prompt()` ×4; barrier −1 means 0 | — | `8546-8559` |
| High | UI | AI text can inject markup or script into the page | `innerHTML` with unescaped AI strings (sheet, log, galaxy, legacy, lineage, People, profile card); `escapeHtml` used only twice and does not escape quotes | `7353`, `7419`, `7583`, `7642-7650`, `8093`, `8108-8142`, `8187-8191`, `5707`, `6515-6517` |
| Med | UI | HP 0 shows 100/100 with no penalty | `s.hp\|\|100` | `7335`, `7383`, `7423` |
| Med | UI | Combat strain bars flicker between the preview and the stored value | `updateCombatStrain` writes the DOM; the next `updateCharacterSheet` rebuilds `innerHTML` from the stored value | `6662-6683`, `7655` |
| Med | UI / state | A render function writes game state (date, age, log turn) | `updateWorldState` mutates `inGameDate`, `age`, `worldLog[].turn` | `8015`, `8045`, `8054`, `8067`, `8086` |
| Med | UI | World Log mostly empty; same-turn entries overwrite each other | AI `worldLog` reverted by the snapshot; merge map keyed by turn; `Date.now()` key collisions | `4886`, `4907`, `8072-8082` |
| Med | UI | Legacy Changes / Lineage panels can never populate | Snapshot restore plus no tag | `4889-4890`, `4910-4911`, `8122-8145` |
| Low | UI | Choice buttons can double-send; narration lines become buttons | No `isThinking` check; loose regex | `6431`, `6474` |
| Low | UI (iPad) | Header overflows; input zoom on focus; `100vh`; People panel not an overlay on mobile | Non-wrapping 12-button row; 15 px input; `--panel-w` undefined; media query skips `#chars-panel` | `98`, `599`, `803`, `1060-1071` |
| Low | UI | Feed trim ignores XP/sim/banner cards | Selector limited to `.msg-gm/.msg-player/.msg-system` | `6374` |
| Low | UI | Stale setup copy (`starwars_rpg.html`, Gemini 2.0 Flash) | — | `1124`, `1150`, `3504` |
| Low | UI | Duplicate `id` attribute on the sim close button; no-op `stopPropagation` handler | Typos | `1495`, `1470` |
| Med | People | Same NPC duplicated under name variants; INTERACTION stubs confuse stat lookups (V159 cause) | Exact-string keys; stats-less stub creation | `5686-5691`, `5724` |
| Low | People | Scene presence via `lastSeen` never matches | Taught `lastSeen` format starts with the date | `1901`, `3937-3940` |
| Low | People | `INTERACTION:` (colon form, written in prompt `1795`) silently dropped | Key regex requires `=` | `5296` |
| Low | Renown | Mandalorian renown tracked but never sent to the AI; renown fully AI-owned | — | `3423`, `4085` |
| Low | TRAINING tag | `wall`/`standard` difficulty and `fail` outcome fall back to ×1.0 | Keyword maps incomplete vs prompt/CLAUDE.md | `6957-6962`, `1838-1839` |
| Low | TRAINING tag | Hours guard skipped on "seconds" turns | Pre-parse lacks a seconds unit (V152 claimed it was added) | `5036-5043` |



## 4. v170-audit.md verification (consolidated)

Every line-number claim in `docs-v2/spec/v170-audit.md`, checked by the area agents and merged here. Where two agents disagreed, the spot-checked result is used and the disagreement is noted. v170-audit.md itself is unchanged.

| # | Claim in v170-audit.md | Verdict | Correct lines / notes |
|---|---|---|---|
| 1 | The AI returns the full sheet as JSON every turn; code overwrites `characterSheet` | Confirmed | 4711-4712, 4775 |
| 2 | Protected-field snapshot "from line 4720" | Confirmed, refined | 4720 is the comment; snapshot 4722-4772, restore 4784-4803. List: innateTalents, innateAbilities, birthday, lifeStage, rank, storyFlags, alignment, alignmentEquilibrium, equilibriumXP, alignmentPeak, philosophy, darkPressure, momentumWindow, lightsaber, injuries, dominantHand, fightingWith, painChannelActive. **Not** protected: hp, strains, barrier, species, backstory, discoveryAge, inventory, credits, renown, Shatterpoint session fields, levels without `masterXP` |
| 3 | "Any field missing from that list can be silently changed by the AI" | Confirmed | Also true of WORLD JSON (location, era, sceneNPCs, activeThreats): 4894-4932, 6164 |
| 4 | "About 30 tag types" | **Corrected** | About 60 distinct CHANGES tag forms (15 of them untaught direct-set/XP forms) plus 5 roll tags scanned across the whole reply. See ai-contract-legacy.md |
| 5 | "35 regex scans of AI prose" | Partly confirmed | Every named example exists. Area A counts 16 state-writing scans (about 30 regexes) in `callGemini`; adding the date helpers (7700-7729), the render-time date rewrite (8041-8054), the label form scan (10742) and the sim brings the total to roughly 35. Exact count not reproduced |
| 6 | Markdown fallback "around line 6040", runs "if the JSON fails", replaces forceStats/stats/forceAbilities wholesale | **Corrected** | 6034-6100. **Not gated on JSON failure**: it fires whenever markdown markers appear (6035-6036). Also overwrites `hp` (6084) and `alignment` (6085). `forceAbilities` is filtered to catalog roots, not taken wholesale (6087-6097) |
| 7 | Guards: activity check, combat check, READ ONLY label | Confirmed | Activity 5057; combat 5508/5519/5530, 6061-6082; READ ONLY 4059-4060 |
| 8 | HP is a flat 0-100 pool | Confirmed | Init 3410; prompt JSON 1724; nothing scales `maxHp` |
| 9 | HP set via `HP=`, SHEET JSON, markdown (5499, 6084) | Confirmed | 5499, 4775, 6084 |
| 10 | No healing model | Confirmed | No code path changes `hp` over time |
| 11 | HP penalty steps −1/−2/−3/−5 at 10583 | Confirmed | 10583-10590; duplicate in the state block 4069-4070 |
| 12 | Strain: 27 write sites in 7 paths (… Control Pain) | **Corrected** | 26 direct assignment lines + 1 wholesale SHEET replace = 27 (5453, 5510, 5521, 5532, 5923, 5938, 5944-5946, 5953-5955, 5970-5971, 6062, 6071, 6080, 6588-6590, 8554-8556, 12048-12050; JSON 4775). The 7th path is the SHEET JSON, not Control Pain; Control Pain writes `activeCombat.accForce` (6658) |
| 13 | Endurance mitigation implemented four different ways | **Corrected** | The three factors are per pool (Physical ×(1−em), Force ×(1−0.5em), Mental ×(1−0.3em)) and are applied consistently in CHANGES 5509/5520/5531, markdown 6063/6072/6081, sim 11442-11444 and combat 6643-6645. The combat table is a base-rate table. The real problem: SHEET JSON, prose regex, `COMBAT_END_CRASH`, Control Pain and manual sync apply no mitigation, and decreases are never checked |
| 14 | em = compressedBonus(Endurance)/6 | Confirmed | 5502, 5515, 5526, 6057, 6067, 6076, 6620, 11430 |
| 15 | Recovery only via sim sleep or AI text | **Corrected** | Also: sim meditation recovery (11382-11426, applied 11461-11464), any lower value in a strain tag (ungated 5507/5518/5529), SHEET JSON, "reduced to"/arrow regex (5913-5939), manual sync (8554-8556). Sim sleep is applied once per week chunk (12044-12047). Confirmed that nothing recovers with time |
| 16 | Combat strain in a separate tally; bars show a computed preview (6617) | Confirmed, refined | `updateCombatStrain` starts at 6617; DOM writes 6662-6683, wiped by the next `updateCharacterSheet` re-render (7655); commit at 6588-6590 |
| 17 | Roll = d20 + stat + experience + tier gap + tactical (±5) − penalties, from 10835 | Confirmed | `fireRoll` 10835; total 10902; tactical clamp 10839 |
| 18 | Level 41 → +2.0, level 60 → +2.5 | **Corrected** | `compressedBonus(40)` = 2.0, `(41)` = 2.025, `(60)` = 2.5 (6857-6863) |
| 19 | Tier-gap bonus +4/+9/+15/+22/+30/+39 | Confirmed | 10891 (dead duplicate 6877-6882) |
| 20 | 60 vs 61 is a −4 swing; 19 levels inside a tier worth 0.5 | Confirmed | 6869-6870; 41 → 60 = +0.475 |
| 21 | `Math.random()` called directly in 6 places | Confirmed | 3054, 3108, 3174, 6782, 10904, 10960 |
| 22 | Rule functions write the page (`updateCombatStrain`, time parser) | Confirmed | 6670-6683; 6215-6222, 6255-6257. The reverse also holds: render `updateWorldState` writes state (8015, 8045, 8054, 8067) |
| 23 | "Time Elapsed" regex around 6190 | Confirmed | 6189-6198; a second, different parser at 5036-5043 |
| 24 | Second regex for "It is now…" dates | Confirmed | 6229-6258 |
| 25 | 7 date writers (4928, 6219, 6254, 7862, 8045, 8054, 12053) | **Corrected** | All 7 confirmed, plus 3434 (creation), 4894 (WORLD JSON replace) and 8322 (load) = 10, or 11 counting load. Time-of-day has separate writers at 3435, 4932, 6214, 7877 |
| 26 | 12 invented months totalling 368 days; 7-day week | Confirmed | 7662-7667 |
| 27 | XP curve and training XP | Confirmed | Curve 6904-6925; training XP 6956-6965 |
| 28 | Shatterpoint 500 × 1.07^L curve | Confirmed | 6688-6705 |
| 29 | Shatterpoint "about 107 references" | **Corrected** | 175 case-insensitive occurrences on 143 lines |
| 30 | Proficiencies "about 46 references" | Approximately confirmed | 51 lines match proficiency identifiers; 97 lines contain "proficiency"; core 7210-7307 |
| 31 | Talents: flat ×1.2-1.3 applied after everything else | **Corrected** | BattleMeditationAffinity is ÷0.3 ≈ ×3.33 (7002-7005). Applied only on the TRAINING: main path (5142) and in the sim (11996), never on COMBAT:, XP:, PROFICIENCY: or endCombat |
| 32 | Momentum: XP multiplier for story turns only | Confirmed | Call sites 5130, 5141, 5160, 5187, 5214, 6600, 6604; the sim bypasses it (11996) |
| 33 | Story-turn training XP: tier mult up to 3.5×, AI outcome up to 3× | Confirmed | 6932-6939, 6959; the AI also picks difficulty up to 2.0× (6958) |
| 34 | `forceStats` written in 11 places | Confirmed (12) | 3417, 5875-5879, 6086, 7176, 7187, 7199, 8268, 8269 |
| 35 | Repair functions (`repairCharacterProfiles`, `repairTalentConsistency`, `repairForceAbilities`) "keep fixing the gap" | **Corrected** | The three run **only on load** (8321, 8326). `repairCharacterProfiles` (7018-7034) migrates NPC profiles and has nothing to do with stat levels. The per-turn fixer is `syncMasterXPToSheet` (7174; called 4833, 7164) |
| 36 | `npcGenerateStats()` at 3072: stat budget per tier, prodigy one tier higher | Confirmed | 3072-3114; pools 3006-3013; prodigy 3075-3077 |
| 37 | NPC stats "regardless of age or years of training" | Confirmed | No age input in 3072-3114 |
| 38 | `RECURRING_RETURN` re-rolls a returning NPC one or more tiers higher | **Corrected** | That is the intent (prompt 1770, parser 5482-5495), but the tag never runs: `slice(18)` drops the first letter of the name (BUG-003). Area E's table marked this "Confirmed"; the spot-check sides with Areas A and B |
| 39 | `RANK=` sets rank; life stage follows `RANK_LIFESTAGE_MAP` | Confirmed | Map 2997; pre-scan 4744-4750; parser 5239-5246 |
| 40 | Milestone "youngling noticed" at age ≤ 13 with Force ≥ 30 | Confirmed | 3753-3755 (`d.force` = average of 4 Force stats, 3736) |
| 41 | Milestones use fixed stat thresholds | Confirmed | 3751-3881 |
| 42 | Alignment design (philosophy drift, equilibrium, dark pressure, harder redemption) exists | Confirmed | 4186-4336; pressure 5827-5868 |
| 43 | Pre-rolling before narration (V162-V170) exists | Confirmed | `preRollCombatExchange` 4469-4562; call 4598-4602; fallback disclaimer 5007-5019; banner 4967-4984 |
| 44 | Combat XP = base × duration × engagement × outcome | Confirmed | `calcCombatXP` 7099-7123 |
| 45 | `LORE_DATABASE` about 1,500 lines | Confirmed | 8964-10489 (1,526 lines) |
| 46 | "Story memory and saves: Replace — covered in Story memory" | **Corrected** | No story-memory or save spec exists in docs-v2/spec/ yet |
| 47 | V150 (append, not unshift) and V151 (aborted sims still sync) fixes are in place | Confirmed, with new gaps | 12181, 12330; 11924, 12153-12185. Two other paths still skip the sync block (BUG-031, BUG-032) |
| 48 | "Keep as data" items exist | Confirmed | NPC_POOLS 3006-3013, NPC_ARCHETYPES 3018-3040, CC_POOLS 2917-2954, CC_RANKS 2956-2993, SIM_ACTIVITIES 8604-8634, FORM_WEIGHT_PROFILES 8640-8650, FAM_STRAIN_BIAS 8684-8698, SIM_MANDATORY 8711-8728, SIM_INNATE_TALENTS 8731-8745, FORCE_ABILITY_CATALOG 8774-8946, aliases 8951-8959, FORCE_ABILITY_RULES 10518-10556. Caveat: RULES contradicts the catalog and lore, so it is not a source of values |
| 49 | Injury design (taxonomy, severities, dominant hand, Jar'Kai, opponent wounds, Control Pain, pain channel, Battlemind/Valor) exists | Confirmed | 10579-10680, 5347-5458; doc-vs-code conflicts in 10-injury-health-strain.md |
