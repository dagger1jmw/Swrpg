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
| alignment.md | Alignment, dark pressure, redemption (v1). **Superseded by alignment-m6.md**; kept as the v1 record (its Force philosophies carried over into alignment-m6.md §9) |
| force-catalog.md | Force ability and form catalog |
| force-catalog-m6.md | M6 Force ability catalog: entry fields, the family passes (§5 to §5k), lightsaber forms (exported 2026-11-21; M6 build reference) |
| force-reserve.md | M6 Force reserve: pool, draw, strain, the Willpower zone, recovery, growth, NPC Potential (exported 2026-11-21; M6 build reference) |
| alignment-m6.md | M6 alignment: values, deeds, temptation, thresholds, the fall and redemption, Force philosophies (§9) (exported 2026-11-21; M6 build reference; supersedes alignment.md) |
| m6-integration-checklist.md | M6 integration checklist: where the M6 specs touch built M5 systems (blockers, integration items, small connections, re-measure list) (exported 2026-11-21; M6 build reference) |
| npc-generation.md | NPC levels from age and pace, canon NPCs |
| npc-tags.md | NPC deployment tags from the retired timeline file (design data; not built, read by nothing) |
| ai-events.md | Event catalog the AI may emit |
| ranks.md | Jedi and Sith rank ladders, trials, Order requirements, milestones |
| character-creation.md | Creation choices, computed starting stats, validation |
| phase1-answers.md | Answers to the 65 Phase 1 open questions |
| lore-checks.md | Legends lore results for the LORE CHECK answers (L-01 to L-18) |
| v170-audit.md | Earlier audit of V170 vs v2 (verified in bugs.md §4) |
| m8-world-checklist.md | M8 world checklist: the open items (blockade, economy, medicine, droids, XP sources and more) |
| m8-design-notes.md | M8 design notes: blockades, weapon proficiency, species traits and ages, world events, wartime postings, equipment, economy, renown, the Sith acolyte curriculum, medicine, ships, droids (exported from Claude Docs, revision 40, 2026-11-23; the Claude Docs version is the working copy; D-465) |
| blockades.md | Running a blockade as built: the approaches, levels and age, landing knowledge, the trek, failure (numbers invented, waiting for rulings) |
| world-events.md | World events as built: the tag network (tags, guards, the ripple, the freeze, plot points, the narrator hand-off) |
| world-event-tags-3640-1000BBY-draft.md | World event tag map, 3640–1000 BBY (reviewed draft, Jared's rulings in its section 10; not encoded) |
| world-event-tags-draft.md | World event tag map, 3661–3640 BBY (design data for the tag network in the design notes; reviewed by Jared 2026-11-23, rulings in its section 6) |
| world-event-tags-1000BBY-4ABY-draft.md | World event tag map, 1000 BBY–4 ABY (reviewed by Jared 2026-11-23, rulings in its section 8; the PP-0 alternatives are still open; LF rows not re-checked) |

## Legacy audit (Phase 1)

| File | Feature | Status | Replaced by / gap |
|---|---|---|---|
| 01-character-creation.md | Creation flow, pools, talents, eras, factions | Replaced | character-creation, progression-numbers, alignment, health, ai-events |
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
| 12-milestones-rank-life-stage.md | Jedi/Sith milestones, rank, life stage | Replaced | ranks, ai-events `promotionProposed`, training-routines (Order requirements) |
| 13-calendar-and-time.md | GSC calendar, clock, birthdays, age, date writers | Needs spec | Calendar shape decided in v170-audit; names and clock module need a spec |
| 14-world-state-and-events.md | World state, galaxy events, story threads, story flags | Partly: galaxy events and Legacy Changes by world-events.md (D-466) | ai-events for event application only |
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

## Open questions for Jared (answered)

All 65 questions are answered in [phase1-answers.md](phase1-answers.md) (labels: DECIDED, JARED, DEFAULT, LORE CHECK). Lore results are in [lore-checks.md](lore-checks.md) (IDs L-NN). Each question below ends with a pointer to its answer.

Deduplicated from the "Open questions" section of each audit file; the source file is in brackets. Questions already answered by a decided spec were left out.

### Scope and setting
1. Which eras ship at launch, and should ABY start years be supported? [01, 16] → **Answer:** [Q1](phase1-answers.md), DEFAULT; lore: [L-16](lore-checks.md)
2. Does the 3661 BBY campaign open before or after the Hydian Way blockade breaks (Legends timeline: begins 3661, broken 3660)? [16] → **Answer:** [Q2](phase1-answers.md), JARED; lore: [L-01](lore-checks.md)
3. Which species ship at launch? Do species traits have mechanical effects, and where should lifespan and body-cap tables live? Should Resist Aging slow aging? [23] → **Answer:** [Q3](phase1-answers.md), DEFAULT; lore: [L-02](lore-checks.md)
4. Is the multi-generation Legacy system (legacy changes, lineage) in v2 scope? [14, 24] → **Answer:** [Q4](phase1-answers.md), JARED
5. Should non-Jedi factions have their own rank ladders, milestones and Order/duty commitments, or none? [12, 17] → **Answer:** [Q5](phase1-answers.md), DECIDED (ranks.md)
6. Is iPad the only target? Should side panels be overlays or tabs? Which sheet sections must always be visible? [20] → **Answer:** [Q6](phase1-answers.md), JARED
7. Should the prompt and context be generic (character name from state, no hard-coded "Jared")? [19] → **Answer:** [Q7](phase1-answers.md), DEFAULT

### Character creation
8. Rank picker at creation, or derive rank from age and training? Starting stats from the progression model, or keep a hand-allocated pool? [01, 03] → **Answer:** [Q8](phase1-answers.md), DECIDED (character-creation.md)
9. Keep "age training began" (V170 never uses it)? Should the player pick a birthday? [01, 13] → **Answer:** [Q9](phase1-answers.md), DECIDED
10. One talent or two? Bring back the quiz, Force potential tier and homeworld? [01] → **Answer:** [Q10](phase1-answers.md), DECIDED
11. Starting alignment from philosophy instead of faction? [01] → **Answer:** [Q11](phase1-answers.md), DEFAULT

### Ranks, milestones, life stage
12. What are the canon Jedi rank ages and requirements for 3661 BBY (the lore files give no padawan cutoff or trial ages)? [12] → **Answer:** [Q12](phase1-answers.md), DECIDED (ranks.md); lore: [L-03](lore-checks.md)
13. Add Grand Master, Council member and Battlemaster (Jedi), and Dark Council and Emperor's Wrath (Sith), from the era-09 lore? [12] → **Answer:** [Q13](phase1-answers.md), DEFAULT; lore: [L-04](lore-checks.md)
14. Should "has a padawan" be a separate state (relationship or flag) rather than the `knight_with_padawan` life stage? [12] → **Answer:** [Q14](phase1-answers.md), DEFAULT
15. Padawan "with Master" schedule: three fixed 1 h rows (V165), or 2 h with master plus 1 h solo (Sim Rules), following the master's specialty? [12, 17] → **Answer:** [Q15](phase1-answers.md), DEFAULT
16. Keep the invented NPCs Master Denko and Elara? If so, where are they recorded? [01, 12] → **Answer:** [Q16](phase1-answers.md), JARED

### Talents, proficiencies, Shatterpoint
17. Which legacy talents carry over, and how do they map to gifted/prodigy/exceptional? Was Battle Meditation (Innate) ×3.33 XP intended? [04] → **Answer:** [Q17](phase1-answers.md), DEFAULT
18. Keep the strain/fatigue talents (Iron Mind, Natural Telekinetic Burst, Unbreakable Spirit)? Keep, redesign or drop the four talents with no code (Combat Intuition, Dark Affinity, Living Force Connection, Precognitive Edge)? [04] → **Answer:** [Q18](phase1-answers.md), DEFAULT; lore: [L-13](lore-checks.md)
19. Sub-abilities: keep percentages, or switch to main-curve levels linked by synergy? [04] → **Answer:** [Q19](phase1-answers.md), DECIDED (progression-numbers.md sec 14)
20. Is Path A (Shatterpoint without the talent) gone for good? Seed shatterpoint perception at a starting level? [06] → **Answer:** [Q20](phase1-answers.md), DECIDED; lore: [L-18](lore-checks.md)
21. Keep Shatterpoint focus, tunnel vision and misreads? Should partial reads count as misreads? Should interpretation cost Force load, and should the talent reduce it? [06] → **Answer:** [Q21](phase1-answers.md), DEFAULT; lore: [L-18](lore-checks.md)
22. Shatterpoint tier unlocks: the code's (6/11) or the lore's (11/36-51)? Vaapad amplification: whenever Vaapad is known, or only while fighting in it? [06] → **Answer:** [Q22](phase1-answers.md), DEFAULT; lore: [L-05](lore-checks.md)
23. Tier names: Untrained/Apprentice/Adept/… or Initiate/Padawan/Knight/Grandmaster? Should Force Output and Force Control count in the domain averages? [03] → **Answer:** [Q23](phase1-answers.md), DECIDED

### Force abilities and lightsaber forms
24. Form list: the lore doc (one ShienDjemSo key, plus Tràkata, Sokan, Dun Möch, Zero-G, Saberstaff) or the code (separate Shien and Djem So, plus Kii-Shikk)? Is Kii-Shikk wanted? [05] → **Answer:** [Q24](phase1-answers.md), DEFAULT; lore: [L-06](lore-checks.md). **Superseded by D-278:** Zero-G is no longer a form (environment training); new form keys TKSaber, Lightwhip, SaberPike, StrongStyle, MediumStyle, FastStyle; Kii-Shikk stays as the Q24 answer left it
25. Force Plague: its own ability, a stage of Force Affliction, or dropped? [05] → **Answer:** [Q25](phase1-answers.md), LORE CHECK; lore: [L-07](lore-checks.md). **Superseded by D-278:** Force Plague is its own Advanced ability under Force Slow, after Force Affliction (Wookieepedia, "Force Slow")
26. Control Pain prerequisites: lore (FC 25 / Med 20, D 2.5) or code (FC 20 / Med 15, no sub track)? [05] → **Answer:** [Q26](phase1-answers.md), DEFAULT
27. Should Shadowstrike, Midi-chlorian Manipulation and Transfer Essence need Sith-text access? Should non-numeric lore prerequisites stay story-checked or become numbers? [05] → **Answer:** [Q27](phase1-answers.md), DEFAULT. **Closed in full by D-278:** Shadowstrike removed (a Ta-Ree spell); Midi-chlorian Manipulation and Essence Transfer (old name Transfer Essence) have the learning class "Story event", stricter than Sith-text access; non-numeric lore prerequisites are carried by each entry's learning class (Taught / Can manifest / Lore-locked / Story event), gated by story flags per Q50; stat prerequisites stay numeric (lore: Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md, the **Learning class:** line on each ability entry and the learning-class note at the top of Form Notes)
28. Are "Force Fortitude → Battlemind" and "ForceBodyControl → Force Body" correct alias mappings? Does "ForceHeal" mean Self, Others or both? [05] → **Answer:** [Q28](phase1-answers.md), LORE CHECK; lore: [L-08, L-09, L-10](lore-checks.md)
29. Is the Force Barrier learned or passive? Keep a barrier meter? [05] → **Answer:** [Q29](phase1-answers.md), DEFAULT
30. Innate talent effects: from the lore or from the code? What happens to the 16 non-catalog ability names in LORE_DATABASE? [05] → **Answer:** [Q30](phase1-answers.md), DEFAULT; lore: [L-15](lore-checks.md)

### Combat and rolls
31. Who decides a fight is over: the engine (wound status / disengage), the player, or an AI-proposed event that code validates? Should opponent fate (killed/fled/captured/recurring) come from the engine? [08] → **Answer:** [Q31](phase1-answers.md), DECIDED (rolls.md, health.md, ai-events.md)
32. Keep the "form locked for the whole fight" rule, or allow form changes at each player beat (with a cost)? [08] → **Answer:** [Q32](phase1-answers.md), DEFAULT
33. Is a separate secondary-skill XP award (0.4× primary) still wanted, or does combat-xp.md replace it? [08] → **Answer:** [Q33](phase1-answers.md), DECIDED
34. Can the AI ever introduce an opponent whose numbers don't come from npc-generation.md (e.g. a one-off canon cameo)? If yes, what's the fallback? [08, 09] → **Answer:** [Q34](phase1-answers.md), DECIDED
35. Should NPC identity use stable IDs with aliases ("Malgus" = "Darth Malgus")? [09, 21] → **Answer:** [Q35](phase1-answers.md), DECIDED
36. Roll card wording: keep the result bands (Narrow/Clear/Dominant/Overwhelming) or switch to rolls.md hit quality (graze/solid/clean/critical)? [09] → **Answer:** [Q36](phase1-answers.md), DECIDED
37. Should the player input modes SEQUENCE/INTENT (several exchanges per turn) survive under rolls.md's one-exchange model? [19] → **Answer:** [Q37](phase1-answers.md), DECIDED
38. Does Satele Shan use a double-bladed saber in 3661 BBY? [01] → **Answer:** [Q38](phase1-answers.md), LORE CHECK; lore: [L-11](lore-checks.md)

### Injury and health
39. Keep dominant hand and the off-hand penalty (scaled by Jar'Kai)? If so, as a percentage of effective level, and does losing a hand force the switch automatically? [10] → **Answer:** [Q39](phase1-answers.md), DEFAULT
40. Keep Willpower passive pain resistance (health.md has only Force-based suppression)? [10] → **Answer:** [Q40](phase1-answers.md), DEFAULT
41. Keep the "crash" when Battlemind/Valor ends while wounded? If so, as a meter load? [10] → **Answer:** [Q41](phase1-answers.md), DEFAULT
42. Which Willpower table in SW_Injury_System_v1.md stays canon, the doc's or the code's? [10] → **Answer:** [Q42](phase1-answers.md), DECIDED

### Alignment and momentum
43. Will of the Force has no v2 event: map it to `moralChoice light` (weight 3), make it its own event, or drop it? [11] → **Answer:** [Q43](phase1-answers.md), DEFAULT
44. Is it intended that philosophy only affects passive drift in v2 (legacy had ×1.8 multipliers)? Should sim meditation keep feeding light drift? Should per-activity alignment costs carry over? [11, 17] → **Answer:** [Q44](phase1-answers.md), DECIDED (alignment.md)
45. Should the dark-pressure "discharge" (a sudden lurch at 100) survive in any form? [11] → **Answer:** [Q45](phase1-answers.md), DEFAULT
46. Was the momentum window meant to give XP, or only to make dark acts hit alignment harder? Is anger channeling enough as the dark-side shortcut? Should a light-side "breakthrough high" exist? [07] → **Answer:** [Q46](phase1-answers.md), DECIDED

### Calendar, world and story
47. Month and weekday names, and week length, for the 12-month / 368-day calendar? Show "BBY", or era-correct dating? [13] → **Answer:** [Q47](phase1-answers.md), DECIDED; lore: [L-17](lore-checks.md)
48. Should time skips set a time of day? Should the AI ever propose time passing (checked by code), or only code-known durations? [13] → **Answer:** [Q48](phase1-answers.md), DECIDED
49. Galaxy simulation driven by code, or AI-proposed events only? Keep the GM-only future-events injection? [14, 16] → **Answer:** [Q49](phase1-answers.md), DEFAULT
50. Story flags: real gates on abilities and content? Who sets them (code from story events, or validated AI events)? [05, 14, 17] → **Answer:** [Q50](phase1-answers.md), DECIDED
51. What escalation for overdue story threads? Keep NPC agendas and story threads? [01, 14] → **Answer:** [Q51](phase1-answers.md), DEFAULT
52. Which tags without a v2 owner (KNOWN_PERSON, INTERACTION, PENDING_EVENT, NPC_AGENDA, RESOLVE_*, SCENE_NPCS, GALAXY_EVENT) become v2 events, and who owns the People tab and story threads? [19] → **Answer:** [Q52](phase1-answers.md), DECIDED (ai-events.md)
53. Relationships: numeric or story labels? When does an NPC appear in People? Do dead NPCs stay listed or get archived? [01, 21] → **Answer:** [Q53](phase1-answers.md), DEFAULT
54. Renown: code-owned and numeric? 4 factions or 5? [24] → **Answer:** [Q54](phase1-answers.md), DEFAULT; lore: [L-12](lore-checks.md)
55. Canon NPCs: which of the two legacy stat sheets (CANON_PROFILES vs LORE_DATABASE) seeds v2, if either? Migrate Zym, Satele, Malgus, Ngani Zho and Gnost-Dural as hand-set data re-checked against the curve? Should prime vs scaled-down values be computed or hand-set? [01, 09, 16] → **Answer:** [Q55](phase1-answers.md), DECIDED (npc-generation.md sec 5)

### Memory, saves, AI plumbing
56. Memory: pinned structured facts owned by code with AI summaries only for flavour, or a rolling AI summary (how often)? How many raw turns per request? Record time skips as permanent memory? Keep the full transcript outside the AI's view? [15, 19] → **Answer:** [Q56](phase1-answers.md), DECIDED (story memory section of the prompt pack; now architecture §7, amended by D-59)
57. When the AI reply is cut off or missing choices: retry, repair with a second call, or show the story with fallback choices? [19] → **Answer:** [Q57](phase1-answers.md), DECIDED
58. Keep the out-of-character commands ([OVERRIDE], [LORE CHECK], [SYSTEM EXPAND], [WORLD ADJUST], [CORRECTION], [AUTHOR NOTE])? If yes, can they ever change state, and how? [19] → **Answer:** [Q58](phase1-answers.md), DEFAULT
59. Gemini model and key: stay on gemini-2.5-flash with the key in browser storage and the URL, send it in a header, or move to a proxy? [18, 19] → **Answer:** [Q59](phase1-answers.md), DECIDED
60. Saves: localStorage, IndexedDB or file export? 5 slots plus autosave, or a per-campaign history? Save mid-combat and mid-sim (full duel state), or block saves during fights? [08, 18] → **Answer:** [Q60](phase1-answers.md), DECIDED

### Items and UI
61. Should lightsaber properties have mechanical effects? Kyber bond bonus? Crystal bleeding as the lore's Force file describes it, or Legends synthetic crystals? Is the lightsaber picker a player toggle or equipment owned by the story? [20, 22] → **Answer:** [Q61](phase1-answers.md), DEFAULT; lore: [L-14](lore-checks.md)
62. A real credits economy? Armor and blasters with stats? Keep saberstaff and Jar'Kai gating? [22] → **Answer:** [Q62](phase1-answers.md), DEFAULT
63. Custom drills in v2, saved with the campaign? Should free-text "Personal Input" become an AI-interpreted block? [17] → **Answer:** [Q63](phase1-answers.md), DECIDED
64. Debug tools and the XP-inject panel: visible, behind a toggle, or removed? Keep a manual correction tool (logged as a correction event)? [03, 10, 20] → **Answer:** [Q64](phase1-answers.md), DECIDED
65. Keep the lettered A–E choice buttons? [20] → **Answer:** [Q65](phase1-answers.md), DEFAULT
