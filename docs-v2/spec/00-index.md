# Spec index

`docs/spec/` = `docs-v2/spec/`. Two kinds of file live here:

- **Decided v2 specs** (unnumbered): the design targets for the rebuild.
- **Legacy audit files** (`NN-*.md`, Phase 1): what V170 actually does, with line citations. Where a decided spec covers a feature, the audit file records legacy behaviour and says "Replaced by …"; it does not propose a design.

Status key: **Replaced** = a decided spec covers it fully. **Partly replaced** = a decided spec covers some of it, and the rest needs a v2 spec. **Needs spec** = no decided spec yet. **Keep as data** = legacy data worth carrying over, values to be checked against lore.

## Decided v2 specs

| File | Covers |
|---|---|
| progression-numbers.md | Tiers, XP curve, talents, synergy, fatigue, age, state of mind |
| training-routines.md | Training scheduler and montage loop |
| health.md | Tiredness meters, Vitality, wounds, healing |
| rolls.md | d20 + level, exchanges, advantage, combat resolution |
| combat-xp.md | Per-exchange combat XP |
| alignment.md | Alignment, dark pressure, redemption |
| force-catalog.md | Force ability and form catalog |
| npc-generation.md | NPC levels from age and pace, canon NPCs |
| ai-events.md | Event catalog the AI may emit |
| v170-audit.md | Earlier audit of V170 vs v2 (verified in bugs.md §4) |

## Legacy audit (Phase 1)

| File | Feature | Status | Replaced by / gap |
|---|---|---|---|
| 01-character-creation.md | Creation flow, pools, talents, eras, factions | Partly replaced | progression-numbers, alignment, health, ai-events; creation flow and option lists need a spec |
| 02-npc-generation.md | NPC pools, archetypes, canon profiles, lifecycle | Partly replaced | npc-generation, ai-events; agendas and presence need a spec |
| 03-stats-and-xp.md | 6 core + 5 Force stats, 100 × 1.07^n curve, tiers, XP inject | Replaced | progression-numbers, rolls, ai-events (domain averages go with milestones) |
| 04-proficiencies-and-talents.md | Sub-ability proficiency, trickle, talents | Partly replaced | progression-numbers §5/§14; strain-type and narrative talents need a spec |
| 05-force-abilities.md | Catalog, aliases, rules, unlocks, barrier, forms | Replaced, keep as data | force-catalog (the legacy catalog is a coverage source) |
| 06-shatterpoint.md | Shatterpoint track, perception, focus, misreads | Partly replaced | progression-numbers §6, rolls §6; perception and misreads need a spec |
| 07-momentum.md | Momentum windows, surrender discount | Replaced | progression-numbers §17, alignment |
| 08-combat.md | Combat start/round/end, pre-roll, combat strain, combat XP | Partly replaced | rolls, combat-xp, health, ai-events; opponent fate and mid-fight saves need a rule |
| 09-rolls-and-opponents.md | Roll engine, tier gap, opponent stats and backfill | Replaced | rolls, npc-generation; NPC identity/aliases need a rule |
| 10-injury-health-strain.md | HP, 3 strain pools, injuries, pain channel, hands | Partly replaced | health, rolls, ai-events; dominant hand, crash and Willpower resistance need a spec |
| 11-alignment.md | Equilibrium, drift, dark pressure, Will of the Force | Replaced | alignment |
| 12-milestones-rank-life-stage.md | Jedi/Sith milestones, rank, life stage | Needs spec | ai-events `promotionProposed` only; ranks/milestones spec needed |
| 13-calendar-and-time.md | GSC calendar, clock, birthdays, age, date writers | Needs spec | Calendar shape decided in v170-audit; names and clock module need a spec |
| 14-world-state-and-events.md | World state, galaxy events, story threads, story flags | Needs spec | ai-events for event application only |
| 15-story-memory.md | Campaign summary, recentHistory, sync blocks | Needs spec | None |
| 16-lore-injection.md | LORE_DATABASE, era lore, context building | Needs spec, keep as data | npc-generation and force-catalog for numbers; lore selection needs a spec |
| 17-training-simulator.md | Sim activities, drills, mandatory rows, day loop, transition scene | Replaced, keep as data | training-routines, progression-numbers, health, alignment |
| 18-save-load-and-settings.md | 5 slots, autosave, API key, settings | Needs spec | V170 save import decided against (v170-audit) |
| 19-ai-pipeline.md | Master prompt, callGemini, tag parser, JSON ownership, regex scans | Replaced | ai-events, rolls, health, progression-numbers, alignment, npc-generation |
| 20-ui-panels.md | Sheet, calendar, People, XP inject, settings, rendering, iPad layout | Needs spec | None (UI shell spec needed) |
| 21-people-tracking.md | People panel, KNOWN_PERSON / INTERACTION | Needs spec | Partly ai-events, npc-generation |
| 22-equipment-and-items.md | Lightsaber properties, inventory, credits (V170 has almost none) | Needs spec | ai-events `itemGained`/`itemLost` only |
| 23-species.md | Species, lifespans, traits (V170: no mechanical effect) | Partly replaced | progression-numbers §11/§16 (human only); species table needed |
| 24-legacy-renown-lineage.md | Legacy changes, lineage, renown (V170: panels never fill) | Needs spec | None |
| ai-contract-legacy.md | Every V170 AI tag and every free-text parse | Reference | ai-events |
| bugs.md | All bugs and design flaws, root causes, v170-audit verification | Reference | — |

## Open questions for Jared (consolidated)

Deduplicated from the "Open questions" section of each audit file; the source file is in brackets. Questions already answered by a decided spec were left out.

### Scope and setting
1. Which eras ship at launch, and should ABY start years be supported? [01, 16]
2. Does the 3661 BBY campaign open before or after the Hydian Way blockade breaks (canon: begins 3661, broken 3660)? [16]
3. Which species ship at launch? Do species traits have mechanical effects, and where should lifespan and body-cap tables live? Should Resist Aging slow aging? [23]
4. Is the multi-generation Legacy system (legacy changes, lineage) in v2 scope? [14, 24]
5. Should non-Jedi factions have their own rank ladders, milestones and Order/duty commitments, or none? [12, 17]
6. Is iPad the only target? Should side panels be overlays or tabs? Which sheet sections must always be visible? [20]
7. Should the prompt and context be generic (character name from state, no hard-coded "Jared")? [19]

### Character creation
8. Rank picker at creation, or derive rank from age and training? Starting stats from the progression model, or keep a hand-allocated pool? [01, 03]
9. Keep "age training began" (V170 never uses it)? Should the player pick a birthday? [01, 13]
10. One talent or two? Bring back the quiz, Force potential tier and homeworld? [01]
11. Starting alignment from philosophy instead of faction? [01]

### Ranks, milestones, life stage
12. What are the canon Jedi rank ages and requirements for 3661 BBY (the lore files give no padawan cutoff or trial ages)? [12]
13. Add Grand Master, Council member and Battlemaster (Jedi), and Dark Council and Emperor's Wrath (Sith), from the era-09 lore? [12]
14. Should "has a padawan" be a separate state (relationship or flag) rather than the `knight_with_padawan` life stage? [12]
15. Padawan "with Master" schedule: three fixed 1 h rows (V165), or 2 h with master plus 1 h solo (Sim Rules), following the master's specialty? [12, 17]
16. Keep the invented NPCs Master Denko and Elara? If so, where are they recorded? [01, 12]

### Talents, proficiencies, Shatterpoint
17. Which legacy talents carry over, and how do they map to gifted/prodigy/exceptional? Was Battle Meditation (Innate) ×3.33 XP intended? [04]
18. Keep the strain/fatigue talents (Iron Mind, Natural Telekinetic Burst, Unbreakable Spirit)? Keep, redesign or drop the four talents with no code (Combat Intuition, Dark Affinity, Living Force Connection, Precognitive Edge)? [04]
19. Sub-abilities: keep percentages, or switch to main-curve levels linked by synergy? [04]
20. Is Path A (Shatterpoint without the talent) gone for good? Seed ShatterSense at a starting level? [06]
21. Keep Shatterpoint focus, tunnel vision and misreads? Should partial reads count as misreads? Should interpretation cost Force load, and should the talent reduce it? [06]
22. Shatterpoint tier unlocks: the code's (6/11) or the lore's (11/36-51)? Vaapad amplification: whenever Vaapad is known, or only while fighting in it? [06]
23. Tier names: Untrained/Apprentice/Adept/… or Initiate/Padawan/Knight/Grandmaster? Should Force Output and Force Control count in the domain averages? [03]

### Force abilities and lightsaber forms
24. Form list: the lore doc (one ShienDjemSo key, plus Tràkata, Sokan, Dun Möch, Zero-G, Saberstaff) or the code (separate Shien and Djem So, plus Kii-Shikk)? Is Kii-Shikk wanted? [05]
25. Force Plague: its own ability, a stage of Force Affliction, or dropped? [05]
26. Control Pain prerequisites: lore (FC 25 / Med 20, D 2.5) or code (FC 20 / Med 15, no sub track)? [05]
27. Should Shadowstrike, Midi-chlorian Manipulation and Transfer Essence need Sith-text access? Should non-numeric lore prerequisites stay story-checked or become numbers? [05]
28. Are "Force Fortitude → Battlemind" and "ForceBodyControl → Force Body" correct alias mappings? Does "ForceHeal" mean Self, Others or both? [05]
29. Is the Force Barrier learned or passive? Keep a barrier meter? [05]
30. Innate talent effects: from the lore or from the code? What happens to the 16 non-catalog ability names in LORE_DATABASE? [05]

### Combat and rolls
31. Who decides a fight is over: the engine (wound status / disengage), the player, or an AI-proposed event that code validates? Should opponent fate (killed/fled/captured/recurring) come from the engine? [08]
32. Keep the "form locked for the whole fight" rule, or allow form changes at each player beat (with a cost)? [08]
33. Is a separate secondary-skill XP award (0.4× primary) still wanted, or does combat-xp.md replace it? [08]
34. Can the AI ever introduce an opponent whose numbers don't come from npc-generation.md (e.g. a one-off canon cameo)? If yes, what's the fallback? [08, 09]
35. Should NPC identity use stable IDs with aliases ("Malgus" = "Darth Malgus")? [09, 21]
36. Roll card wording: keep the result bands (Narrow/Clear/Dominant/Overwhelming) or switch to rolls.md hit quality (graze/solid/clean/critical)? [09]
37. Should the player input modes SEQUENCE/INTENT (several exchanges per turn) survive under rolls.md's one-exchange model? [19]
38. Does Satele Shan use a double-bladed saber in 3661 BBY? [01]

### Injury and health
39. Keep dominant hand and the off-hand penalty (scaled by Jar'Kai)? If so, as a percentage of effective level, and does losing a hand force the switch automatically? [10]
40. Keep Willpower passive pain resistance (health.md has only Force-based suppression)? [10]
41. Keep the "crash" when Battlemind/Valor ends while wounded? If so, as a meter load? [10]
42. Which Willpower table in SW_Injury_System_v1.md stays canon, the doc's or the code's? [10]

### Alignment and momentum
43. Will of the Force has no v2 event: map it to `moralChoice light` (weight 3), make it its own event, or drop it? [11]
44. Is it intended that philosophy only affects passive drift in v2 (legacy had ×1.8 multipliers)? Should sim meditation keep feeding light drift? Should per-activity alignment costs carry over? [11, 17]
45. Should the dark-pressure "discharge" (a sudden lurch at 100) survive in any form? [11]
46. Was the momentum window meant to give XP, or only to make dark acts hit alignment harder? Is anger channeling enough as the dark-side shortcut? Should a light-side "breakthrough high" exist? [07]

### Calendar, world and story
47. Month and weekday names, and week length, for the 12-month / 368-day calendar? Show "BBY", or era-correct dating? [13]
48. Should time skips set a time of day? Should the AI ever propose time passing (checked by code), or only code-known durations? [13]
49. Galaxy simulation driven by code, or AI-proposed events only? Keep the GM-only future-events injection? [14, 16]
50. Story flags: real gates on abilities and content? Who sets them (code from story events, or validated AI events)? [05, 14, 17]
51. What escalation for overdue story threads? Keep NPC agendas and story threads? [01, 14]
52. Which tags without a v2 owner (KNOWN_PERSON, INTERACTION, PENDING_EVENT, NPC_AGENDA, RESOLVE_*, SCENE_NPCS, GALAXY_EVENT) become v2 events, and who owns the People tab and story threads? [19]
53. Relationships: numeric or story labels? When does an NPC appear in People? Do dead NPCs stay listed or get archived? [01, 21]
54. Renown: code-owned and numeric? 4 factions or 5? [24]
55. Canon NPCs: which of the two legacy stat sheets (CANON_PROFILES vs LORE_DATABASE) seeds v2, if either? Migrate Zym, Satele, Malgus, Ngani Zho and Gnost-Dural as hand-set data re-checked against the curve? Should prime vs scaled-down values be computed or hand-set? [01, 09, 16]

### Memory, saves, AI plumbing
56. Memory: pinned structured facts owned by code with AI summaries only for flavour, or a rolling AI summary (how often)? How many raw turns per request? Record time skips as permanent memory? Keep the full transcript outside the AI's view? [15, 19]
57. When the AI reply is cut off or missing choices: retry, repair with a second call, or show the story with fallback choices? [19]
58. Keep the out-of-character commands ([OVERRIDE], [LORE CHECK], [SYSTEM EXPAND], [WORLD ADJUST], [CORRECTION], [AUTHOR NOTE])? If yes, can they ever change state, and how? [19]
59. Gemini model and key: stay on gemini-2.5-flash with the key in browser storage and the URL, send it in a header, or move to a proxy? [18, 19]
60. Saves: localStorage, IndexedDB or file export? 5 slots plus autosave, or a per-campaign history? Save mid-combat and mid-sim (full duel state), or block saves during fights? [08, 18]

### Items and UI
61. Should lightsaber properties have mechanical effects? Kyber bond bonus? Crystal bleeding as the lore's Force file describes it, or Legends synthetic crystals? Is the lightsaber picker a player toggle or equipment owned by the story? [20, 22]
62. A real credits economy? Armor and blasters with stats? Keep saberstaff and Jar'Kai gating? [22]
63. Custom drills in v2, saved with the campaign? Should free-text "Personal Input" become an AI-interpreted block? [17]
64. Debug tools and the XP-inject panel: visible, behind a toggle, or removed? Keep a manual correction tool (logged as a correction event)? [03, 10, 20]
65. Keep the lettered A–E choice buttons? [20]
