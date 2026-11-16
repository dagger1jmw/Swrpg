# 01 — Character Creation (legacy V170 audit)

Audited file: `legacy/index.html` (V170, commit 8bef4a1). All line numbers refer to that file. Read-only audit; no design proposed here.

## What it does for the player

1. On load with a saved key, `tryAutoLoad()` (legacy/index.html:2865) loads `localStorage['sw_rpg_autosave']`. On a parse error it shows a visible error and the welcome prompt (2873-2876). With no save it shows the welcome prompt (2880) with a BEGIN CAMPAIGN button (2899-2903).
2. `beginCampaign()` (3458) clears the feed and calls `showCreationScreen()` (3348). That function runs `ccFactionChanged`, `ccEraChanged`, `ccBuildTalents`, `ccAutoDistribute` and `ccRenderStats`.
3. The creation form (HTML 1160-1290) collects: era preset, campaign start year (BBY), name, species (dropdown of 11 plus "Other"), age, faction (6), rank (per faction), Force philosophy (8), age when Force training began, up to 2 innate talents, opening scene (required) and backstory.
4. Starting stats come from a **point pool per faction and rank** (`CC_POOLS`, 2917-2954). The pool is randomly spread across 6 core and 5 Force stats (`ccAutoDistribute`, 3162). The player can re-roll (3191) or adjust with +/- buttons (`ccAdj`, 3194), within a per-stat cap and the pool total. A fixed Shii-Cho level comes from the pool's `saber` value and cannot be adjusted (3273-3285).
5. `finalizeCreation()` (3361) validates name and opening scene, builds `masterXP`, `characterSheet` and `worldState`, seeds the canon NPC profiles, and fires the first Gemini call with the opening scene (3454-3455).

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Point pools (core / force / saber / coreMax / forceMax) | Jedi: youngling 55/45/5/18/15, initiate 78/60/12/22/18, padawan 115/105/40/30/28, knight 168/155/80/42/40, master 220/205/110/55/52. Sith: acolyte 60/50/5/20/16, apprentice 120/110/42/32/30, sith_lord 172/160/82/44/42, dark_lord 225/210/112/56/54. Republic: conscript 65 core/max 20, soldier 105/30, sergeant 140/38, lieutenant 170/45, captain 200/52 (force 0, saber 0). Mandalorian: foundling 65/20, warrior 105/30, veteran 140/38, champion 175/46. Bounty hunter: rookie 70/22, veteran 110/32, elite 148/42. Force-sensitive: untrained 60/25/0/18/10, self_taught 85/55/5/25/18, wandering_adept 110/100/15/32/28 | legacy/index.html:2917-2954 |
| Ranks per faction (value + label) | `CC_RANKS` | 2956-2993 |
| Rank → lifeStage | `RANK_LIFESTAGE_MAP`: youngling/initiate/acolyte/conscript/foundling/untrained→youngling; padawan/apprentice/soldier/warrior/rookie/self_taught→padawan; knight/sith_lord/sergeant/lieutenant/veteran/elite/wandering_adept→knight; master/dark_lord/captain/champion→master | 2997 |
| Valid RANK= values | Union of all faction ranks (`RANK_VALID_VALUES`) | 2999 |
| Random distribution | Uniform random stat pick, +1 if under cap, up to 500 attempts per group | 3167-3178 |
| Manual adjust | Value must stay within 0..coreMax / forceMax; group total cannot exceed pool; saber not adjustable | 3194-3226 |
| Jedi age → rank nudge | age < 7 youngling, < 13 initiate, else padawan (only when the rank is one of those three) | 3298-3308 |
| Faction default rank | jedi padawan, sith apprentice, republic soldier, mandalorian warrior, bounty_hunter veteran, force_sensitive self_taught | 3315 |
| Faction default philosophy | jedi doctrineJedi, sith sithPassion, republic/mandalorian/bounty_hunter warrior, force_sensitive livingForce | 3320 |
| Era presets (start year) | GGW 3661; Cold War 3640; Mandalorian Wars 3970; Jedi Civil War 3958; Old Sith Wars/Interwar 3750; Clone Wars 22; GCW 1; Custom | HTML 1176-1183 |
| Talent limit | Max 2 checked | 3344 |
| Starting XP | `masterXP[cat][key].totalXP = xpToReachLevel(level)` for each allocated stat > 0; ShiiCho likewise | 3391-3398 |
| ShatterSense seed | `masterXP.shatterpoint.main = spXPToReachLevel(5)` | 3399 |
| Birthday | `{ day:1, month:6, year: startYear + age, era:'BBY' }` | 3383, 3403 |
| Alignment start | Sith −20, Jedi +20, others 0 (same for equilibrium and peak) | 3405-3408 |
| HP / strain start | hp 100/100; all strains 0/100; forceBarrier null / max 100 | 3410-3411 |
| Starting date | `"Primeday, Day 1 Coruscann — {year} BBY"`, time "Morning (07:00)" | 3434-3435 |
| Inventory / credits | `[]` / 0 | 3422 |
| Default lightsaber | Seeded later by `syncMasterXPToSheet()`: `{color:'green', type:'training'}` for every faction | 7205-7207 |
| Old-save rank migration | lifeStage → Jedi rank (knight_with_padawan→knight, council_member→master, default padawan) | 8273-8276 |

## State read / written

Written by `finalizeCreation()`: `recentHistory`, `fullHistory`, `campaignSummary`, `isSummarizing`, `galaxySimState`, `lastGalaxyEventDate`, `turnCount`, `trimmedTurns`, `masterXP.{forceStats,stats,forceAbilities,lightsaberForms,shatterpoint,forceAbilityProficiency}`. It also builds `characterSheet` with these fields: `name, species, homeworld(''), faction (display name), age, birthday, philosophy, alignment, alignmentEquilibrium, equilibriumXP, alignmentPeak, darkPressure, momentumWindow, lastLightActs, hp, maxHp, forceBarrier, maxForceBarrier, forceStrain, maxForceStrain, physicalStrain, maxPhysicalStrain, mentalStrain, maxMentalStrain, injuries, dominantHand, fightingWith, painChannelActive, forceTier, forceStats, forceStatsXP, forceAbilities, forceAbilitiesXP, lightsaberForms, lightsaberFormsXP, stats, statsXP, strengths, weaknesses, aptitudes, inventory, credits, renown, innateTalents, innateAbilities, storyFlags, knownSecrets, activeBonds, rank, lifeStage, backstory, discoveryAge`.

`worldState` gets: `location, era, inGameDate, inGameTime, lastEvent, legacyChanges, lineageRecord, worldLog, galaxyEvents, galaxyState, trackedCharacters, characterProfiles, interactionWeights, pendingEvents, npcAgendas, galaxyEventQueue, sceneNPCs, lastMilestoneCheck, storyFlags` (3432-3439). Module state: `_ccAlloc` (3151), `gameActive`, `isThinking`.

Read from the DOM: `cc-name, cc-story-start, cc-faction, cc-rank, cc-age, cc-discovery-age, cc-species, cc-year, cc-backstory, cc-philosophy, cc-era, cc-talents-list`.

## AI provides vs. code computes

- Code computes all starting stats, XP, alignment, date, birthday and lifeStage. The AI does nothing during creation, so the old Master Prompt's AI-driven Q&A creation was replaced (CLAUDE.md log, V121).
- The AI receives the opening scene as a user prompt (3454), and every turn afterward it receives `sheetSummary` (4029-4089), which includes species, rank and backstory.
- After turn 1 the AI **owns most of the sheet**: `characterSheet = JSON.parse(SHEET)` (4775) replaces it wholesale, and only a fixed list of fields is restored (4784-4803). Creation fields that are **not** restored: `species, name, homeworld, faction, age, backstory, discoveryAge, strengths, weaknesses, inventory, credits, renown`. The AI can also write `RANK=` (validated against `RANK_VALID_VALUES`) and `AGE=` (5886).

## Known bugs and fragile spots

1. **Age is off by one right after creation.** Birthday = month 6 day 1, `startYear+age` BBY (3383, 3403), but the start date is Day 1 of month 1 (3434). `computeAge()` subtracts 1 when the current day of the year is before the birthday (7820), and `updateWorldState()` overwrites `characterSheet.age` (8012-8015). A character created at 16 shows 15 on the first update.
2. **Backstory and discoveryAge are not protected.** The SHEET JSON fully replaces the sheet (4775), the SHEET template the AI is taught (1724) has no `backstory`, `discoveryAge`, `rank`, `lifeStage` or `lightsaber` keys, and the restore list (4784-4803) leaves out backstory and discoveryAge. Both survive only if the AI happens to echo them back.
3. **`discoveryAge` is dead data.** It is written at 3429 and never read anywhere in the file.
4. **Wrong key in the context.** The sheetSummary sends `INNATE TALENT: ${cs.innatetalent}` (4088), but the field is `innateTalents`, so the AI always sees "none" on this line. The sheet render also checks `s.innatetalent` (7589).
5. **BBY is hard-coded.** The birthday era is always 'BBY' (3403) and the start date is `${year} BBY` (3433-3434), yet the year input allows −200 (HTML 1189) and the GCW preset spans into ABY. ABY campaigns are not supported.
6. **Canon profiles are seeded for 3,661 BBY whatever the era** (`seedCanonProfiles()` 3443 → `CANON_PROFILES_3661BBY` 3573). A Clone Wars campaign gets Zym, Satele and Malgus profiles.
7. **Rank values collide across factions.** `veteran` exists for both mandalorian and bounty_hunter (2980, 2985). The label lookup at 7351 takes the first match, so a bounty hunter veteran is labeled with the Mandalorian text. `RANK=` accepts any faction's rank (2999, 4747), so a Jedi can be promoted to `captain`.
8. **Old-save rank migration is Jedi-only** (8274). A Sith or Mandalorian save with lifeStage `knight` becomes rank `knight`.
9. **Changing rank re-randomizes stats** (HTML 1234 `onchange="ccAutoDistribute();ccRenderStats()"`), which silently throws away manual allocations.
10. **Same lightsaber default for every faction.** A green training saber is seeded for everyone, Sith and non-Force factions included (7205-7207). Creation offers no lightsaber choice.
11. **Alignment ignores the chosen philosophy.** Starting alignment depends only on faction (3405), so a Jedi who picks "Gray" still starts at +20.
12. **Creation uses `Math.random()` directly** (3174), so it is not seedable and cannot be tested.
13. **The `AGE=` tag sets age directly** (5886), against the prompt rule "never set age". It is overwritten again by `computeAge` on the next update, but this is a second writer.
14. Minor: in `ccRenderStats`, `MAX_BAR` is computed but never used (3244). The touchstart handlers call `ccAdj()` and then `ccRenderStats()` again (3253-3254), and `ccAdj` already renders (3225), so it renders twice.

## Conflicts between sources

- **Master Prompt v7.1 Part II vs. code.** The doc requires homeworld, discovery event, a Force potential tier (Low…Legendary), a 20-question personality quiz, strengths and weaknesses, and **one** innate talent (Docs/SW_Legends_RPG_Master_Prompt_v7_1.md:49-82, 619). The code sets homeworld to '', has no Force-potential tier and no quiz, leaves strengths and weaknesses empty, and allows **2** talents (3344, HTML 1259).
- **Era list.** The Master Prompt (lines 39-47) lists Old Republic, GGW, Mandalorian Wars, **New Sith Wars**, Clone Wars, GCW and **Legacy Era**. The code (HTML 1176-1183) has no New Sith Wars or Legacy Era, and adds Jedi Civil War, Cold War and "Old Sith Wars / Interwar (3800–3700 BBY)".
- **Era dates vs. timeline lore.** "Old Sith Wars / Interwar (3800–3700 BBY)" matches no lore heading; the lore calls 3,950–3,681 BBY "Old Republic Recovery" (Docs/SWRPG lore/SW_Legends_Galaxy_Timeline.md:286). The code labels GCW "1 BBY – 4 ABY" but the lore says 0 BBY–4 ABY (timeline:714). The code labels Cold War "3653–3636 BBY" but the lore Cold War is 3,653–3,642 BBY (timeline:417).
- **Saber start.** The lore says "All characters begin here [Shii-Cho] — solo practice unlocks at stat ≥ 15" (SW_Force_Abilities_Forms_v3_complete.md, Form Notes). The code gives Shii-Cho 0 to non-Force factions and 5 to younglings and acolytes (2919, 2926).
- **legacy/CLAUDE.md §5A** says LIFE_STAGE is set only by the `LIFE_STAGE=` tag. In the code, `RANK=` also derives lifeStage (4744-4750), so there are two writers.
- **Progression model.** Creation turns rank into a flat point pool with no link to age or years trained. This conflicts with docs-v2/spec/progression-numbers.md (levels come from years × pace, §12, and the age body cap, §11).

## Replaced by

- Starting stat levels (point pools, random spread): **Replaced by progression-numbers.md** (levels from years trained × pace, talent multipliers in §5, human body cap §11).
- Talent picks (13 flat-multiplier talents, `SIM_INNATE_TALENTS` 8731-8745): **Replaced by progression-numbers.md** (domain talents none/gifted/prodigy/exceptional) and force-catalog.md (ShatterSense as a talent gate).
- Starting alignment: **Replaced by alignment.md**.
- Starting HP and strain: **Replaced by health.md**.
- `RANK=` / `AGE=` AI tags: **Replaced by ai-events.md** (no direct state tags).
- Creation flow, faction/rank/era option lists, opening scene, backstory storage and save loading: **None — needs a v2 spec.**

## Open questions for Jared

1. Should v2 creation keep a rank picker at all, or derive rank from age + years trained + faction (progression-numbers.md)?
2. Which eras should v2 offer at launch? Only 3,661 BBY, or the full V170 list, which conflicts with Master Prompt v7.1 and the timeline?
3. Should v2 still collect "age when Force training began"? V170 collects it and never uses it, while progression-numbers.md needs a start age.
4. One innate talent (Master Prompt) or two (V170)? And should the 20-question quiz, Force potential tier and homeworld from Master Prompt v7.1 come back?
5. Should starting alignment follow the chosen philosophy instead of the faction?
6. Should ABY start years be supported?
