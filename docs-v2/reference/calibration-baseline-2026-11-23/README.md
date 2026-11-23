# Calibration baseline, 2026-11-23

A frozen copy of every calibration number before the overnight re-measurement of 2026-11-23 (Phase B of the follow-up
answers): after D-445 to D-455 (the Temple calibration, the major-nexus tier, the order seats by date, Luke's month on
Dagobah), before the dip fix and the re-measurement. **Do not edit or delete this folder.** The earlier baselines
(calibration-baseline-2026-11-22/ and -22b/) stay as they were; a later baseline gets its own new folder.

- **Commit:** `07d3a11` ("Follow-up answers Phase A (D-451 to D-455) ..."), branch `rebuild`.
- **Git tag:** `calibration-baseline-2026-11-23` (pushed to origin).

## What each file is

| File | What it holds |
|---|---|
| summary.md | The key numbers in one page: K, the ladder and minimums, the 4.0x table, the training conditions, the last measured lifetime results |
| canon-anchors.md | Every canon stat anchor as the engine reads it: the game-scale value next to the authored sheet value |
| source/progression.config.ts | K 12.30, the curve, `Y_AVG`, the accelerated path x3.4 (cap x3.2), the nexus factors (x1.10, major x1.15, site x1.15) |
| source/archetypes.ts | Archetype weights and the measured paces (Jedi in the Coruscant Temple, D-445; Sith not yet at their seats) |
| source/forceNexus.ts, orderSeats.ts | The nexus data with the major tier (D-451) and the Jedi and Sith seat tables |
| source/profiles.ts | The lifetime profiles (the seat option; Luke one month on Dagobah) |
| source/rankMinimums.ts, ranks.config.ts, rankAges.ts | The ladder (Knight 47 / 41 / 40 / 58, Master 64), trials, standing, canon birth estimates |
| source/orderRequirements.ts, scheduler.ts | The Order rows and the scheduler (the conditional-rest rule before the dip fix) |
| source/closedForm.ts, creation.ts, paceClamp.ts | The closed form, creation, the 4.0x clamp |
| source/npcGen.config.ts, npcGen.ts, canonStats.ts, sheetScale.ts | The generator and the canon stat model |
| source/species.ts | The species table |
| source/era09GreatGalacticWar.ts, era09Additions.ts | The canon roster files with the authored sheets |
| source/progression-numbers.md, progression-targets.md, npc-generation.md | The specs those numbers serve |
