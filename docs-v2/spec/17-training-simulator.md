# 17 — Training Simulator (legacy V170 audit)

Scope: `legacy/index.html:8541-8762` (manual strain sync, activity registry, constants, mandatory rows, talents, flags) and `legacy/index.html:11116-12411` (simulator engine and UI logic). HTML shell: `legacy/index.html:1479-1694`. The in-play `TRAINING:` tag (`legacy/index.html:5108-5148`) is included because it is the real-play counterpart of the simulator.

## What it does for the player

- A **Simulate** header button (`legacy/index.html:1097`) opens a 6-tab overlay: Schedule, Period, Drills, Talents, Flags and Progress (`legacy/index.html:1487-1494`).
- **Schedule:** locked mandatory rows for the life stage (hours can be changed), any number of training blocks (activity dropdown + hours + intensity), a sleep row, a "Personal Input" textarea, a live hours bar (X / 24), a daily strain estimate and estimated XP per day.
- **Period:** 1 week, 1 month (4 weeks), 3 months (12 weeks), 6 months (26 weeks) or 1 year (52 weeks). There are also pause conditions, a location override and notes for the AI narrator.
- **Drills:** create, edit and delete named custom drills (a primary stat plus secondary stats with weights). Drills are stored in `localStorage`, not in the save file.
- **Talents / Flags:** player toggles for innate talents, innate abilities and story flags. The header **Talents** button also opens this tab (`legacy/index.html:1100`).
- **Run:** the simulation runs one 7-day "chunk" at a time. Each chunk applies XP, alignment, strain and the date immediately, and then makes an optional AI call for 1-2 sentences of narrative. Pause, Resume and Abort are available.
- **Finish:** posts a "Simulation complete" card to the story feed, injects a `[SYSTEM STATE UPDATE]` exchange into `recentHistory`, and offers **Generate Transition Scene**: a 4-6 paragraph AI scene, also injected into history.
- A separate header **Sync** button (`manualStrainSync`, `legacy/index.html:8541`) opens four `prompt()` dialogs to hand-set the Force, Physical and Mental strain and the Force Barrier.

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Intensity XP multiplier `SIM_INTENSITY` | casual 10, standard 15, intense 20, pushing 25, elite 30 | `legacy/index.html:8701`; Sim Rules §3 table |
| Difficulty multiplier `SIM_DIFFICULTY` | easy 0.7, standard 1.0, ceiling 1.2, wall 1.5 (no `impossible`) | `legacy/index.html:8703`; Sim Rules §3 adds Impossible 0.3 |
| Outcome weight `SIM_OUTCOME_WEIGHT` (tiers 1-7) | 1.105, 1.194, 1.195, 1.230, 1.228, 1.263, 1.263 | `legacy/index.html:8705`; Sim Rules §3 (tiers 1-6 only) |
| Block XP per stat path, per week | `hours × SIM_INTENSITY × SIM_DIFFICULTY × outW(tier of THAT stat) × strainPenalty × weight × days` | `legacy/index.html:11951-11952` |
| Talent multiplier | `applyTalentXPMultiplier(path, xp)` applied at commit time only, not in the preview | `legacy/index.html:11996` vs preview `legacy/index.html:11537` |
| Shatterpoint practice XP | `hours × SIM_INTENSITY × SIM_OUTCOME_WEIGHT[min(6, spLevel)] × penalty × days` (no difficulty factor; indexed by **level**, not tier) | `legacy/index.html:11973-11977` |
| Proficiency practice XP | `hours × SIM_INTENSITY × SIM_OUTCOME_WEIGHT[tier] × penalty × days`, with tier = `clamp(floor(effectivePct/20)+1, 1, 5)`; then `applyProficiencyXP` | `legacy/index.html:11978-11984`, `12006-12018` |
| Mandatory row difficulty | always `'standard'` | `legacy/index.html:11962` |
| Training-row difficulty | `r.difficulty`, always `'standard'`; there is no UI control | `legacy/index.html:11296`, `11986` |
| Strain base per hour `SIM_STRAIN_BASE` | f 2.4, p 3.2, m 1.6 | `legacy/index.html:8707`; Sim Rules §5 "Standard" row |
| Intensity strain multiplier | casual 0.5, standard 1.0, intense 1.75, pushing 2.5, elite 3.3 | `legacy/index.html:8708` (Sim Rules §5 table implies 0.42/0.47/0.31 for casual, 1.75 intense, 2.5 pushing, 3.3/3.1/3.75 elite, which is not a single multiplier) |
| Endurance mitigation | `em = compressedBonus(endurance)/6`; Force ×(1−0.5em), Physical ×(1−em), Mental ×(1−0.3em) | `legacy/index.html:11430`, `11442-11444`; Sim Rules §5b says `/10` |
| Talent strain modifiers | NaturalTelekineticBurst: TK-family Force ×0.8; BattleMeditationAffinity: Force ×0.6; IronMind: Mental ×0.8 | `legacy/index.html:11439-11441` |
| Recovery activities | `isRecovery` rows add **no** strain | `legacy/index.html:11436` |
| Meditation recovery per hour | basic f12/p10/m10, deep f20/p18/m18, passive sense f8/p4/m8; × `(1 + meditation/50)`; every mandatory recovery row uses the basic rate | `legacy/index.html:11389-11411`; Activity Bank says "~5 mental per hour" |
| Daily net strain | `max(0, Σ strain − meditation recovery)` per pool | `legacy/index.html:11461-11464` |
| Sleep recovery fraction | ≥8 h 1.0, ≥7 0.85, ≥6 0.65, ≥5 0.45, ≥4 0.25, else 0.10 | `legacy/index.html:11468`; Sim Rules §5 |
| Strain written per **week** | `end = current + daily × (1 − sleepRecovery)`, clamped to max (default 100). Applied **once per 7-day chunk**, not per day | `legacy/index.html:12044-12050` |
| XP strain penalty (worst pool of the **daily** estimate) | >90 ×0.1 (×0.3 with UnbreakableSpirit), >70 ×0.4, >50 ×0.7, >20 ×0.9, else 1.0 | `legacy/index.html:11564-11573`; Sim Rules §5 |
| Alignment equilibrium XP | `alignmentXPPerHour × hours × days` from rows that have it (Sense Meditation 3, Active Sense 2, Centering 5, Deep 15, youngling group meditation 5, padawan meditation 3); then `processAlignmentTick(days×24)` | `legacy/index.html:8616-8619`, `8714`, `8719`, `12020-12035` |
| Hours budget | `Σ mandatory inputs + Σ training rows with activityKey + sleep (default 7)`; display only, never blocks a run | `legacy/index.html:11352-11365` (V165/V166) |
| Period chunks | week 1, month 4, 3 months 12, 6 months 26, year 52 chunks of 7 days (a "year" = 364 days, calendar = 368) | `legacy/index.html:11861-11870` |
| Auto-pause | only if pause-conditions text is non-empty AND more than 3 level-ups happened in a chunk; the text itself is never read | `legacy/index.html:11909`, `12083` |
| Chunk error retry | wait 5 s and retry the same chunk, with no limit | `legacy/index.html:11916-11919` |
| Mandatory rows | youngling: Morning Forms 1.5 h (0.5-2), Group Meditation 1.0 (0.5-1.5), Force Fundamentals 1.0 (0.5-1.5). Padawan: three "(with Master)" rows of 1.0 h (0.5-2): Lightsaber (`PRIMARY_FORM`, the highest form), Meditation, Archive Study. knight/master_with_padawan: Padawan Instruction 1.5 (0.5-2.5). Bare knight/master: none | `legacy/index.html:8711-8728`, `8660-8667` (V165) |
| Dynamic form activity | any learned form without a hardcoded entry gets `form_<Key>` with weights `FORM_WEIGHT_PROFILES[k] ‖ FORM_DEFAULT_WEIGHTS`, bias f0.7/p1.6/m0.6 | `legacy/index.html:8640-8650`, `11216-11234` (V148) |
| Dynamic Force ability activity | every root catalog ability the character has: weights 1.0 + first anchor 0.5 + second anchor 0.3; bias `FAM_STRAIN_BIAS[fam]` | `legacy/index.html:8684-8698`, `11238-11264` |
| Dynamic proficiency activity | every sub-ability whose parent is known and whose prereqs pass (`simCheckPrereqs`, which ignores `flags`); bias f1.6/p0.3/m0.8 | `legacy/index.html:11189-11207`, `11267-11287` |
| Hardcoded activities | 8 saber, 7 Force-stat, 2 Force-ability (Telekinesis, Shatterpoint), 4 physical, 1 academic | `legacy/index.html:8604-8634` |

## State read / written

- **Reads:** `characterSheet.lifeStage`, `.stats.*`, `.forceStats.*`, `.forceAbilities.*`, `.lightsaberForms.*`, `.innateTalents`, `.innateAbilities`, `.alignment`, `.alignmentEquilibrium`, `.forceStrain/.physicalStrain/.mentalStrain`, `.maxForceStrain/.maxPhysicalStrain/.maxMentalStrain`, `.name`, `.age`, `.species`, `.faction`, `.shatterpointLevel`. Also `masterXP.*` (via `applyXPToSheet`, `spGetLevel`, `getEffectiveProficiency`, `masterXP.forceAbilityProficiency`, `masterXP.shatterpoint.main`) and `worldState.inGameDate`, `.inGameTime`, `.location`, `.storyFlags`, `.worldLog`. DOM inputs: `sim-mand-hours-N`, `sim-sleep-hours`, `sim-personal-input`, `sim-ai-notes`, `sim-pause-conditions`, `sim-location-override`.
- **Writes:**
  - `masterXP` and the sheet levels via `applyXPToSheet` (`legacy/index.html:11996`), `spApplyXP` (`12001`) and `applyProficiencyXP` (`12011`).
  - `characterSheet.alignmentEquilibrium` and `alignment` via `addEquilibriumXP` / `processAlignmentTick` (`12034-12035`).
  - `characterSheet.forceStrain/physicalStrain/mentalStrain` (`12048-12050`).
  - `worldState.inGameDate` (`12053`), `worldState.location` (`12129`) and `worldState.worldLog` (`12136-12138`).
  - `recentHistory` (`12180-12185`, `12329-12334`) and `fullHistory` (`12335`; the transition scene only, not the sync block).
  - `characterSheet.innateTalents`, `innateAbilities` and `aptitudes` (`11606-11640`), and `worldState.storyFlags` (`11678-11683`).
  - `localStorage['sw_rpg_custom_drills']` (`11714`, `11781`).
  - `manualStrainSync` writes `forceStrain/physicalStrain/mentalStrain/forceBarrier` (`8554-8559`).
  - Module globals: `simActive`, `simPaused`, `simAborted`, `simTrainingRows`, `simResults` and the others at `11116-11125`.

## AI provides vs. code computes

- **Code computes:** all simulator XP, strain, recovery, alignment and date math, and the sync block text.
- **AI provides (via `simApiCall`, gemini-2.5-flash, key in the URL query, `legacy/index.html:12363-12394`):**
  1. A 1-2 sentence weekly summary (180 max tokens, `12067-12069`). It replaces the code summary in the log when it succeeds.
  2. A one-sentence overtraining consequence when penalty ≤0.4 and daily strain >70 (`12073-12078`). It is pure flavor and has no mechanical effect.
  3. The transition scene (4000 max tokens, `12273-12361`).
- **"Personal Input" is not interpreted.** The label promises "AI interprets → JS applies XP" (`legacy/index.html:1536`, Sim Rules §8), but the text is only pasted into the weekly narrative prompt as "Extra context" (`12066-12067`). It never produces XP.
- **Real play (`TRAINING:` tag):**
  - The AI chooses the stat path, hours, intensity, difficulty keyword and outcome keyword.
  - Code computes `calcTrainingXP = round(hours × i × d × o × statLevelToTierMult(level))` (`legacy/index.html:6956-6965`), then applies momentum, the talent multiplier and the proficiency redirect (`5108-5148`).
  - The real-play difficulty table (`basic 1.0, ceiling 1.3, above 1.6, far 2.0`) differs from the simulator table.
  - The AI picks the outcome **before** the roll fires (the roll is deferred).

## Known bugs and fragile spots

1. **Custom drills give zero XP.** `simBuildActivityOptions` maps saved drills to `{cat, key, label, _custom, unlock}` with no `weights`, `strainBias` or `defaultIntensity` (`legacy/index.html:11211`). `applyBlockXP(act.weights||[])` therefore awards nothing (`11986`), and strain uses the default `{1,1,1}` bias (`11457`). `_custom` is never read anywhere.
2. **Auto-pause dead-ends the simulation.** On an auto-pause, `runSimChunks` does `return` (`11913`) instead of awaiting `waitForResume()`. `resumeSimulation` then calls a null `simPauseCallback` (`12101`) and nothing resumes. `finishSimulation` (the sync block) is never called for the weeks that already ran. This is the V151 symptom on a new path.
3. **Abort while manually paused never syncs.** `runSimChunks` is awaiting `waitForResume()` (`11900`). `abortSimulation` sets flags but never resolves `simPauseCallback` (`12104-12113`), so the loop hangs forever and `finishSimulation` never runs. XP, strain and date are kept with no notice to the AI.
4. **Strain is a once-per-week delta.** One day's net strain × (1 − sleep fraction) is added once per 7-day chunk (`12044-12047`). This ignores the "rolling accumulation, sleep recovers each night" comment and Sim Rules §5 ("residual carries into the next day").
5. **The XP strain penalty ignores real strain.** It uses the planned daily estimate (`11564-11566`), not the character's current or accumulating strain, so it is the same for every week of a year-long run.
6. **Infinite retry, with possible double XP.** The error handler `i--` retries forever (`11916-11919`). If an exception is thrown after `applyXPToSheet` has run (for example in `processAlignmentTick` or `advanceInGameDate`), the retry applies the XP again.
7. **The Shatterpoint outcome weight is indexed by level** (`SIM_OUTCOME_WEIGHT[min(6, spLevel)]`, `11554`, `11976`). The array is meant to be indexed by tier−1, so any level of 6 or more always gets 1.263.
8. **The preview does not match what is applied.** The preview omits `applyTalentXPMultiplier` (`11537` vs `11996`), and the strain warning says ">20: Minor fatigue — no XP penalty" (`11499`) while the code applies ×0.9 (`11571`).
9. **Difficulty and tier-gap training are not implemented.** Rows are always `'standard'` (`11296`), and Sim Rules §3b's tier-gap table has no code.
10. **Mandatory rows ignore faction.** `RANK_LIFESTAGE_MAP` maps a Sith apprentice, a Republic soldier, a Mandalorian warrior and others to `padawan`/`youngling` (`legacy/index.html:2997`). Non-Jedi characters therefore get the Jedi "Archive Study (with Master)" and "Group Meditation" rows.
11. **Mandatory hour edits are lost.** `simBuildMandatoryRows` rebuilds the inputs with default values on every panel open (`11145`, `11177-11184`). Meanwhile `simTrainingRows` and its DOM persist.
12. **Zero is replaced with the default.** `parseFloat(...) || defaultHours` and `|| 7` for sleep (`11362`, `11405`, `11448`, `11960`, `12043`) mean 0 can never be entered. Inputs below the HTML `min` are not enforced.
13. **Hours over 24 are allowed.** The bar only turns red (`11374`), and `startSimulation` does not validate.
14. **Pause-condition text is never evaluated** (`11881`, `11909`). Only ">3 level-ups in a week" triggers a pause.
15. **"1 Year" = 364 days** against a 368-day calendar (`11867`).
16. **The time of day is never advanced.** The sync block reports a stale `inGameTime` (`12156`).
17. **The sync block's "notable stats" are hardcoded** to ForceControl/ForceSense/Meditation/ShiiCho (`12166`). A non-Shii-Cho character's main form is never shown to the AI.
18. **The sync block is not in `fullHistory`.** It goes into `recentHistory` only, while the transition scene goes into both (`12181` vs `12335`). The next summarize therefore loses the time skip.
19. **Old sync blocks are filtered only by prefix** (`12180`). Two runs without an intervening turn still leave duplicate "Acknowledged" model messages, because only the user part is matched.
20. **The world log entry's turn is overwritten.** The sim's `worldLog` push (`12137`) has its `turn` overwritten by `updateWorldState` (`legacy/index.html:8067`) and is keyed by turn, so it can replace or be replaced by other entries with the same turn.
21. **Small output budgets may return empty text.** 180 and 100 max tokens on gemini-2.5-flash count thinking tokens toward the limit, so the AI text can come back empty. The empty case is handled silently (`12069`, `12077`).
22. **The API key is in the URL query string** (`12372`).
23. **Story flags gate nothing.**
    - `simCheckPrereqs` and the catalog code never read `flags` (no `.flags` reads exist in the file).
    - No AI tag sets `storyFlags`, and `worldState.storyFlags` is restored from a snapshot after every WORLD parse (`legacy/index.html:4891`, `4912`). The Flags tab text "Flags are normally set by the AI" (`1670`) is therefore false.
    - `masterAssigned` and `padawanAssigned` (from `legacy/CLAUDE.md` §8) do not exist in code.
24. **`simApplyTalentEffects` is an empty stub** (`11652-11656`).
25. **`manualStrainSync` is fragile.** It uses four blocking `prompt()` calls, which are poor on iPad. A Force Barrier value of `-1` sets the barrier to 0 instead of clearing it (`8559`). Entering text silently produces 0 (`parseFloat||0`).
26. **Custom drills are not in the save.** They live in `localStorage` only, so they are lost on another device or after Clear Cache plus a slot import (`11689`).
27. **Performance:** `simBuildActivityOptions` (which walks the whole catalog) is rebuilt 4+ times per preview update, and `simGetStrainPenalty` re-runs `simCalcDailyStrain` for every weight (`11531`).
28. **Duplicate `id` attributes** on the close button: `id="sim-panel-close" id="sim-close-btn"` (`legacy/index.html:1495`).

## Conflicts between sources

- **Endurance divisor:** Sim Rules §5b says `/10` (max 32.5%). Code uses `/6` (V149, `legacy/index.html:11430`). `legacy/CLAUDE.md` §9C agrees with the code.
- **Meals/hygiene:** Sim Rules §2 budgets 1.5 h for meals and hygiene. V166 deliberately removed the hidden +1.5 (Docs/updates.md V166). There is no meal row in the UI.
- **Strain intensity table:** Sim Rules §5 gives absolute per-hour values per intensity, which are not proportional across pools. Code uses a single multiplier on the Standard row (`8708`).
- **Difficulty:** Sim Rules has Impossible 0.3 and tier-gap strain multipliers. Code has neither (`8703`).
- **Mandatory padawan rows:**
  - Sim Rules §6: "Training with Master 2.0 h (1-3) + Solo Practice 1.0 h".
  - Activity Bank: "Padawan Training with Master 2.0 h, bias P1.4/F1.0/M0.7, +1.5 tactical bonus".
  - Code: three 1.0 h "(with Master)" rows (V165, `8717-8721`).
- **Shii-Cho Basics bias:** Activity Bank Force ×0.5; code f0.5 (matches). Activity Bank also says Shii-Cho solo practice unlocks at ≥15, but code is always unlocked (`8606`).
- **Activities in the Bank but not in code:** Telekinesis Push/Pull drills, Force Barrier, Force Speed, Force Jump, Mind Trick, Force Absorb, Battle Meditation, Force Lightning (+2 dark per hour), Force Choke (+1 dark per hour), Lightsaber History, Jedi Code, Dual Saber, Form Combination, Shadow Training. Dynamic generation covers the abilities, but with family bias and no alignment cost.
- **Shien/Djem So weights:** Bank strength 0.7, end 0.4, fC 0.25, agi 0.2. Code `DjemSo` str 0.6, end 0.4, fC 0.2 (`8642`).
- **Niman weights:** Bank fC 0.5, will 0.4, agi 0.3, str 0.2. Code agi 0.4, fC 0.4, will 0.3 (`8644`).
- **Juyo weights:** Bank agi 0.5, will 0.6, str 0.4, fC 0.3. Code agi 0.5, will 0.5, str 0.3 (`8645`).
- **Outcome weight per stat:** Sim Rules §4 says "the primary skill's tier determines the outcome weight for ALL skills in the block". Code uses each secondary stat's own tier (`11949`).
- **Personal Input:** Sim Rules §8 and the UI label say the AI parses it into XP. Code does not (see above).
- **Calendar advance:** Sim Rules §10 says one day at a time with the time set to the end of the last block. Code advances 7 days per chunk and never touches the time (`12053`).
- **Narrative summary:** Sim Rules §9 says 2-3 paragraphs at the end. Code writes 1-2 sentences per week, plus an optional separate transition scene.
- **Sync block position:** `Docs/CLAUDE changelog.md` §Simulation says the sync block is injected "at the front of recentHistory". Code appends it at the end (V150, `12181`).
- **Real-play difficulty keywords:**
  - The prompt teaches `basic / ceiling / above / far` (`legacy/index.html:1838`).
  - `legacy/CLAUDE.md` §5A teaches `basic|standard|ceiling|wall|above`.
  - `calcTrainingXP` has no `wall` or `standard` key, so both fall back to 1.0 (`6958`). The `legacy/CLAUDE.md` §12 "Known Ambiguities" item 1 is unresolved.
- **Seconds in the elapsed-time pre-parse:** V152 (Docs/updates.md) says the training-hour pre-parse recognizes seconds. The code at `legacy/index.html:5036-5043` matches only `hour`/`min`, so a TRAINING claim on a "seconds" turn skips the hours guard.

## Replaced by

- `docs-v2/spec/training-routines.md`: scheduler, budgets, ordering, montage day loop, report, Order commitments.
- `docs-v2/spec/progression-numbers.md`: XP per session, fatigue model, overtraining streak, drill ceiling, teacher factor and training mode. This replaces `SIM_INTENSITY`/`SIM_DIFFICULTY`/`SIM_OUTCOME_WEIGHT`, the endurance mitigation, and the strain penalty table.
- `docs-v2/spec/health.md`: tiredness meters, which replace the three strain pools, `manualStrainSync` and the meditation/sleep recovery tables.
- `docs-v2/spec/alignment.md`: meditation equilibrium XP.
- `docs-v2/spec/ai-events.md`: the AI receives the montage report; no sync-block prose hacks.
- **Kept as data:** the activity list, weights and strain-bias families, and the Order mandatory rows per life stage. These are inputs to the routine catalog. Their numbers are retuned.

## Open questions for Jared

1. Should custom drills (player-defined activity + weights) exist in v2 routines? If so, should they be saved with the campaign instead of the browser?
2. Should Order requirements per rank be Jedi-only, or does each faction (Sith academy, Republic military, Mandalorian) need its own commitment list?
3. Should padawan "with Master" commitments be three fixed 1 h blocks (V165), or one 2 h block that follows the master's specialty (Activity Bank)?
4. Should free-text "Personal Input" survive as an AI-interpreted routine block, given that the AI may not change state? It would need an intent schema in ai-events.
5. Should story flags (Mace, Aing-Tii, Fallanassi, archive/Sith texts, Council permission) become real gates in v2? Who sets them: story events, the player, or both?
6. Should the legacy activity-specific alignment costs (Force Lightning +2 dark/h, Choke +1 dark/h) and meditation light gains carry into v2 routines?
