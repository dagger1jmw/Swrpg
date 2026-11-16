# 03 — Stats and XP curve (legacy V170 audit)

Scope: the 6 core + 5 Force stats, the 100 x 1.07^n XP curve, how levels are derived and stored, tier bands, domain averages, story-turn training XP (`calcTrainingXP`), creation point pools, and the manual XP-inject panel. Talents and proficiencies are in 04, Shatterpoint in 06, momentum in 07.

## What it does for the player
- The sheet has 6 core stats (`strength, agility, endurance, willpower, charisma, intelligence`) and 5 Force stats (`forceSense, meditation, forceKnowledge, forceControl, forceOutput`), plus open-ended `forceAbilities` and `lightsaberForms`. Every one of them is a level number with an XP bar.
- Levels go up when XP is added. XP comes from AI tags in story turns (`TRAINING:`, `COMBAT:`, `XP:`, `COMBAT_END:`), from the simulation panel, from a prose fallback ("Djem So: +3 XP"), and from the manual XP-inject panel.
- Each level shows a tier name (Untrained ... Transcendent). Tiers drive roll bonuses, NPC challenge, combat XP base and the training tier multiplier.
- At character creation, the player distributes a point pool (by faction and rank) across the 11 stats plus a Shii-Cho level.
- "Domain averages" (Force / combat / ability) feed the milestone system (e.g. "youngling noticed").

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| XP to advance from level n | `floor(100 * 1.07^max(0, floor(n)))` | legacy/index.html:6904-6907; Docs/SWRPG_XP_System_Reference.md §1 |
| XP to reach level L | sum of `xpRequired(0..L-1)` | legacy/index.html:6910-6914 |
| Level from total XP | loop subtracting `xpRequired(level)` until remainder < cost; returns `{level, current, required}` | legacy/index.html:6917-6925 |
| Real cumulative XP (computed from the code) | L10 1,378 · L20 4,089 · L21 4,475 · L40 19,943 · L41 21,440 · L60 81,321 · L61 87,115 · L80 318,865 · L81 341,288 · L100 1,238,115 · L101 1,324,886 · L150 36.5M | computed from 6904-6914 (node, this audit) |
| Real per-level cost | L0 100 · L10 196 · L20 386 · L40 1,497 · L60 5,794 · L80 22,423 · L100 86,771 | computed from 6904-6907 |
| Tier bands (statToTier) | 0-20 Untrained(1) · 21-40 Apprentice(2) · 41-60 Adept(3) · 61-80 Master(4) · 81-100 High Master(5) · 101-150 Legendary(6) · 151+ Transcendent(7) | legacy/index.html:6865-6874 |
| Tier names in prompt / XP doc | Initiate · Padawan · Knight · Master · Grandmaster · Legendary · Transcendent | legacy/index.html:2645-2652; XP Reference §3; legacy/CLAUDE.md §3D |
| Dueling tier | `statToTier(max lightsaber form level)` | legacy/index.html:6885-6890 |
| Force tier | `statToTier(forceControl)` | legacy/index.html:6893-6895 |
| compressedBonus (roll bonus per stat) | ≤40: s/20 · ≤80: 2+(s-40)/40 · ≤100: 3+(s-80)/80 · >100: 3.25+(s-100)/200 | legacy/index.html:6857-6863; XP Reference §4 |
| Tier-gap roll bonus | gap 1..6+: +4, +9, +15, +22, +30, +39 | legacy/index.html:6877-6882 |
| Training XP (story turn) | `round(hours * I * D * O * T)` | legacy/index.html:6956-6965 |
| Intensity I | casual/slow/deliberate 10 · standard/normal/moderate 15 · intense/focused/hard 20 · pushing/limits/extreme 25 · elite/sparring/danger 30 · unknown 15 | legacy/index.html:6957, 6960 |
| Difficulty D (code) | basic/easy/within/familiar 1.0 · ceiling/challenging 1.3 · above/difficult 1.6 · far/impossible 2.0 · unknown 1.0 | legacy/index.html:6958, 6961 |
| Outcome O | failure/struggle 0.8 · partial/contested 1.0 · solid/success 1.2 · strong/good 1.5 · overwhelming/exceptional 2.0 · breakthrough/insight 3.0 · unknown 1.0 | legacy/index.html:6959, 6962 |
| Tier multiplier T (statLevelToTierMult) | <21 1.0 · 21-40 1.2 · 41-60 1.5 · 61-80 2.0 · 81-100 2.7 · 101+ 3.5 | legacy/index.html:6932-6939 (added V127) |
| Max story-turn training XP per hour | 30 * 2.0 * 3.0 * 3.5 = 630 (then x momentum, x talent up to 1.3) | derived from 6957-6963 |
| Hours guard on TRAINING: | rejected if claimed hours > max(0.05, 2 * AI-declared "Time Elapsed" hours) | legacy/index.html:5111-5116 |
| Prose XP fallback | "Name: +N XP" in AI text -> `applyXPToSheet(path, N*50)` when no TRAINING:/COMBAT: tag this turn | legacy/index.html:5976-6002 |
| Domain averages | force = mean(forceSense, meditation, forceKnowledge, forceControl) · combat = mean(max form, strength, agility, endurance, willpower) · ability = mean of Force abilities with level > 0; each rounded | legacy/index.html:3733-3750 |
| Milestone example | `jedi_youngling_noticed`: age ≤ 13 and force avg ≥ 30 | legacy/index.html:3755 |
| Creation pools (Jedi) | youngling core 55 / force 45 / saber 5 / max 18,15 · initiate 78/60/12/22,18 · padawan 115/105/40/30,28 · knight 168/155/80/42,40 · master 220/205/110/55,52 (other factions 2924-2950) | legacy/index.html:2917-2950 |
| Creation seeding | each stat > 0: `masterXP[cat][key] = {totalXP: xpToReachLevel(lvl)}`; Shii-Cho likewise; stats at 0 get NO entry; no Force abilities seeded | legacy/index.html:3389-3398 |
| Random distribution | random walk, 1 point per pick, max 500 picks | legacy/index.html:3167-3181 |
| First-XP seed of an untracked stat | `totalXP = xpToReachLevel(characterSheet level) + characterSheet *XP.current` | legacy/index.html:7136-7155 |
| Canonical stat lists | `CANONICAL_FORCE_STATS` (5), `CANONICAL_CORE_STATS` (6); missing ones seeded to 0 on every sync | legacy/index.html:7171-7172, 7198-7203 |

## State read / written
- `masterXP.stats[key].totalXP`, `masterXP.forceStats[key].totalXP`, `masterXP.forceAbilities[key].totalXP`, `masterXP.lightsaberForms[key].totalXP` — "authoritative" totals (initial declaration 6536; reset 3389, 3553, 8281, 8301, 8318).
- `characterSheet.stats`, `.forceStats`, `.forceAbilities`, `.lightsaberForms` — level numbers (written by `syncMasterXPToSheet` 7174-7208, by AI SHEET JSON 4775, by stat-set CHANGES tags 5875-5885, by markdown fallback 6086-6098, by migration 8268-8271).
- `characterSheet.statsXP`, `.forceStatsXP`, `.forceAbilitiesXP`, `.lightsaberFormsXP` — `{current, required, totalXP}` display copies (7186; also overwritten by prose regex 6005-6031).
- `characterSheet.lightsaber` seeded in sync (7205-7207).
- Read for domain averages: `characterSheet.forceStats`, `.stats`, `.lightsaberForms`, `.forceAbilities` (3733-3750).
- XP inject panel: reads `characterSheet.*` key lists and `masterXP`; writes through `applyXPToSheet`, `spApplyXP`, `applyProficiencyXP` (8375-8539).

## AI provides vs. code computes
| AI provides | Code computes |
|---|---|
| Whether training happened, the stat path, hours, intensity, difficulty and outcome keywords in `TRAINING:` (prompt 1832-1839) | XP amount from the keyword tables and tier multiplier (6956-6965) |
| The outcome keyword itself — chosen by the AI after reading a JS roll card; prompt says "Pick an outcome that fits the narrative context. Use 'breakthrough' ... regardless of table" (2084-2092). The roll is not linked to the outcome in code. | Nothing ties the roll result to the outcome |
| The "Time Elapsed" figure the hours guard compares against | The 2x guard (5111-5116) |
| Raw XP in `XP:` tags (not taught in the V170 prompt; documented in legacy/CLAUDE.md §5A) | `applyXPToSheet` (5214) |
| A full SHEET JSON each turn including stat levels | Overwrites only keys that have a `masterXP` entry (7183-7193) |
| Optional stat-set tags `STRENGTH=40`, `FORCE_CONTROL=60`, or `<AbilityOrForm>=N` (not taught, still parsed) | Writes straight into `characterSheet` (5875-5893) |
| Prose "X: +N XP" lines | x50 conversion (5998) |
| Tier names | Tier from level (6865-6874) |

## Known bugs and fragile spots
1. **Two sources of truth, and the AI can seed the authoritative one.** Sync only overwrites keys that already exist in `masterXP` (7184-7188). Creation seeds only stats > 0 and no Force abilities (3396-3398). So any stat left at 0, and every Force ability, takes whatever level the AI writes in SHEET JSON (4775), and the first XP award seeds `masterXP` from that AI value (7136-7155). Same for the stat-set tags (5875-5893) and markdown fallback (6086-6098).
2. **Stat-set CHANGES tags still parsed.** `FORCE_SENSE=`..`INTELLIGENCE=` and a default branch matching any ability/form name (5875-5893, default at 5888-5893) write levels directly. No sync runs after the CHANGES loop unless an XP award happens later in the same turn, so the AI value is live for the rest of the turn and gets autosaved.
3. **Prose XP fallback reads the whole response, not the narrative.** The comment says narrative only (5902-5904), but `narrativeXPMatches` uses `rawText` (5980; gate at 5976), and it is gated only by `trainingTagFound`, which `XP:`/`PROFICIENCY:`/`SHATTERPOINT_XP` do not set (5053, 5110, 5152). Any "Name: +N XP" line gives N x 50 XP with no momentum, talent or hours guard (5998).
4. **AI picks the outcome multiplier (up to x3.0) and difficulty (up to x2.0).** Roll and outcome are not linked in code (prompt 2084-2092). With the tier multiplier, one AI line can give 630 XP per hour vs 15 for standard.
5. **Hours guard trusts AI time.** The 2x elapsed check (5111-5116) compares AI hours to AI "Time Elapsed"; if `turnElapsedHours` is null the guard is skipped.
6. **Keyword drift.** legacy/CLAUDE.md §5A teaches difficulty `standard|wall` and outcome `fail|contested`; `standard`/`wall` are not in `dMap` and `fail` is not in `oMap`, so they silently become 1.0 (6958-6962). A "fail" outcome therefore gives x1.0, not x0.8.
7. **Tier names disagree in the same context.** The state block sends `statToTier` names (Untrained/Apprentice/Adept/High Master) at 4054 and 4059-4060 while the prompt's PROGRESSION TIERS uses Initiate/Padawan/Knight/Grandmaster (2645-2652). The V123 changelog claims these were unified; only the prompt was changed.
8. **Domain averages are incomplete.** Force average leaves out `forceOutput` (3736); combat average leaves out `forceControl`; ability average only counts abilities above 0, so learning a new ability at level 1 drops it (3743-3747). Milestones (3752+) use these fixed thresholds against the old curve.
9. **Creation pools are inconsistent with the curve.** A Jedi padawan gets Shii-Cho 40 but no other stat above 30 (2920); random distribution can stop after 500 picks without spending the pool when per-stat caps are near (3167-3181).
10. **Prose regex rewrites XP bars.** `xpNarrativeRe` (6005-6031) writes `{current, required}` from AI prose into `*XP` display fields (no `forceOutput`/`intelligence` keys). They are overwritten at the next sync; until then the sidebar shows AI numbers.
11. **XP inject preview is wrong for untracked stats.** Preview reads `masterXP` total 0 (8465-8468) but `applyXPToSheet` seeds from the sheet level (7136-7155), so the preview shows level 0 -> N while the real result is much higher. Integer-only input (`parseInt`, 8487).
12. **Float rounding of the curve.** Code comments (6902-6903) and the XP Reference quote per-level costs 197/387/22,406/86,717; the code actually returns 196/386/22,423/86,771.
13. **Performance.** `deriveFromTotalXP` is O(level) and runs for every key on every sync (7185); fine at level 100, slow only at very high levels.

## Conflicts between sources
- **Cumulative XP table is wrong in the docs.** XP Reference §1 and legacy/CLAUDE.md §4A list L20 4,995 · L40 31,440 · L60 113,978 · L80 331,988 · L100 882,440. Code gives 4,089 · 19,943 · 81,321 · 318,865 · 1,238,115. The §16 "days per level" table and proficiency "equivalent level" table were built on the wrong numbers.
- **Difficulty table.** XP Reference §5 and legacy/CLAUDE.md §4C: above = 1.3, difficult/far = 1.6, impossible 2.0 (CLAUDE.md also lists wall = 1.6). Code: above = 1.6, far = 2.0, wall missing (6958). Sim uses a third table (easy 0.7 / standard 1.0 / ceiling 1.2 / wall 1.5; Sim Rules, CLAUDE.md §4D). legacy/CLAUDE.md §12 already flags this as unresolved.
- **Tier multiplier.** Not in the XP Reference (§5 formula has no T). Added V127 per legacy/CLAUDE.md session log.
- **Tier names.** Code `statToTier` (6865-6874) and v2 progression-numbers.md §1 use Untrained/Apprentice/Adept/Master/High Master; XP Reference §3, legacy/CLAUDE.md §3D and prompt 2645 use Initiate/Padawan/Knight/Master/Grandmaster.
- **Prose XP conversion.** XP Reference §5 documents the x50 conversion as a feature; legacy/CLAUDE.md §5B and prompt 1827 say prose XP gives "NO XP".
- **AI and masterXP.** XP Reference §13 says "The AI never writes to masterXP directly"; it does indirectly via the seeding path (bug 1).
- **Level bands for tiers vs. other bands.** `statToTier` uses ≤20/21+; proficiency factors use ≥20 (see 04).

## Replaced by
- progression-numbers.md (curve `XP(L) = K * L^1.75`, tiers §1, single XP function §5, outcome rolled by code §5, synergy §14, age §16).
- training-routines.md (sim-driven training).
- rolls.md (compressedBonus and tier-gap bonus replaced by d20 + level/4, no tier cliffs).
- ai-events.md (AI never emits XP, levels or stat values).
- Domain averages / milestones: None — needs a v2 spec (v170-audit says milestones must be redefined against the profile tables).
- Creation point pools: None — needs a v2 spec (starting levels should come from the progression model and age).
- XP inject panel: None — needs a v2 spec (debug console).

## Open questions for Jared
1. Should v2 keep a manual XP-inject / debug panel, and should it be hidden from normal play?
2. Which tier names do you want shown in v2: Untrained/Apprentice/Adept/High Master (progression-numbers.md) or Initiate/Padawan/Knight/Grandmaster (old prompt and docs)?
3. Domain averages: should Force Output count in the Force domain and Force Control in the combat domain when milestones are redefined?
4. Character creation: should starting stats come from the progression model (age, start age, talent) instead of a point pool, or do you want to keep a hand-allocated pool on top?
