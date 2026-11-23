# Calibration baseline, 2026-11-23b

A frozen copy of every calibration number before the second re-measurement of 2026-11-23 (Phase B of the answers to the
overnight re-measure). It comes after D-456 (rest before trim, K 12.45, the 4.0x table, the paces, Luke x3.5) and
D-457 / D-458 (the per-hour clamp and its first table), and before the Initiate lightsaber curriculum and the
recalibration. **Do not edit or delete this folder.** The earlier baselines stay as they were; a later baseline gets its
own new folder.

- **Commit:** `5498ac3` ("Per-hour 4.0x clamp, discarded counter, montage test (D-457, D-458; Phase A)"), branch `rebuild`.
- **Git tag:** `calibration-baseline-2026-11-23b` (pushed to origin).

## What each file is

| File | What it holds |
|---|---|
| summary.md | The key numbers in one page: K, the ladder and minimums, the clamp and its tables, the last measured lifetime results |
| canon-anchors.md | Every canon stat anchor as the engine reads it. Carried unchanged from calibration-baseline-2026-11-23: nothing between the two changed a stat formula, the roster or the scale |
| source/progression.config.ts | K 12.45, the curve, `Y_AVG` (now the lifetime floor's reference), the accelerated path x3.5 (cap x3.2), the nexus factors |
| source/paceRates.ts, paceClamp.ts | The per-hour 4.0x clamp (D-457) and the Average's per-hour table (Phase A measurement, before the curriculum) |
| source/archetypes.ts | Archetype weights and the measured paces (D-456: Sith at their seats) |
| source/forceNexus.ts, orderSeats.ts | The nexus data and the Jedi and Sith seat tables |
| source/profiles.ts | The lifetime profiles |
| source/rankMinimums.ts, ranks.config.ts, rankAges.ts | The ladder, the trials (the Initiate Trials before the curriculum), standing, canon birth estimates |
| source/orderRequirements.ts, scheduler.ts | The Order rows (the Initiate row: 2 h of Shii-Cho a day, before the curriculum) and the scheduler (rest before trim) |
| source/closedForm.ts, creation.ts | The closed form and creation |
| source/npcGen.config.ts, npcGen.ts, canonStats.ts, sheetScale.ts | The generator and the canon stat model |
| source/species.ts | The species table |
| source/era09GreatGalacticWar.ts, era09Additions.ts | The canon roster files with the authored sheets |
| source/progression-numbers.md, progression-targets.md, npc-generation.md | The specs those numbers serve |
