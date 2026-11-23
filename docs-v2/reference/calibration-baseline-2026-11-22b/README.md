# Calibration baseline, 2026-11-22b

A frozen copy of every calibration number before the re-measurement pass (D-431 onward): after D-417 to D-430, before
the daily meditation block, the age-scaled Padawan hours, the Sith channelling block, K re-solved, the paces re-measured
on the day loop and the 4.0x table re-measured. **Do not edit or delete this folder.** The first baseline
(calibration-baseline-2026-11-22/) stays as it was; a later baseline gets its own new folder.

- **Commit:** `8bcaa5f` ("Progress line for the D-425 to D-430 session"), branch `rebuild`.
- **Git tag:** `calibration-baseline-2026-11-22b` (pushed to origin).

## What each file is

| File | What it holds |
|---|---|
| summary.md | The key numbers in one page: K, the rank ladder and minimums, the 4.0x table, the training conditions, the lifetime results at this commit (measured from the tag on 2026-11-22) |
| canon-anchors.md | Every canon stat anchor as the engine reads it: the game-scale value (D-429 conversion) next to the authored sheet value |
| source/rankAges.ts, rankMinimums.ts, ranks.config.ts | Canon birth estimates (D-424), the player ladder (Knight at 25, D-426), standing, trials, deeds (D-424) |
| source/npcGen.config.ts, npcGen.ts | The generator's NPC config and code |
| source/closedForm.ts, creation.ts | The closed form and creation (phase ages, the long-life cap of D-429, the daily-life paces of D-427) |
| source/archetypes.ts | Archetype weights and the docs-v2/calc-measured phase paces (K 11.683) |
| source/canonStats.ts, sheetScale.ts | The canon stat model and the D-429 scale mapping |
| source/progression.config.ts | K 11.683, the curve, `Y_AVG` (frozen at 20, 24, 30), the accelerated path x3.2, the daily-life blocks (meditation off), the XP sources of D-427 |
| source/paceClamp.ts | The 4.0x clamp |
| source/orderRequirements.ts, scheduler.ts | The Order rows (Padawan 5 h at every age; the Sith rows of D-427 with the awareness hour) and the scheduler |
| source/forceNexus.ts | The nexus data of D-425 (sites data only) |
| source/species.ts | The species table (Kel Dor lifespan 70) |
| source/profiles.ts | The lifetime profiles (Obi-Wan's Padawan plan Soresu 2 + Shii-Cho 1) |
| source/progression-targets.md, progression-numbers.md, npc-generation.md | The specs those numbers serve |
| source/era09GreatGalacticWar.ts, era09Additions.ts | The canon roster files with the authored sheets |

## How to restore

- **Everything at once:** `git checkout calibration-baseline-2026-11-22b -- <path>` for any file. The tag is the full tree.
- **One number:** copy it from the matching file in `source/` into the live file (src/data, src/engine, src/features,
  tests/lifetime, docs-v2/spec).
- After a restore, run `npm run test:all` and `npm run spread`.
