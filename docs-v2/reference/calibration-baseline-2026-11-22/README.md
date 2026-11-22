# Calibration baseline, 2026-11-22

A frozen copy of every calibration number before the 2026-11-22 calibration pass (D-417 onward).
**Do not edit or delete this folder.** A later baseline gets its own new folder.

- **Commit:** `c13461f887b622d3bcb052c71fe37e489e09a841` ("Date-agnostic refactor wrapped up; report (D-416)"), branch `rebuild`.
- **Git tag:** `calibration-baseline-2026-11-22` (pushed to origin).

## What each file is

| File | What it holds |
|---|---|
| summary.md | The key numbers in one page: rank ages, rank minimums, the 4x ceiling, the training-condition multipliers, the calibration targets |
| canon-anchors.md | Every canon stat anchor (the 45 hand-set sheets and the 5 D-415 drafts), one table per figure, in the sheet scale |
| source/rankAges.ts | Typical rank ages for canon birth estimates (D-412) |
| source/rankMinimums.ts | The player's rank ladder: minimum ages, skill minimums, typical ages (Knight 20.5) |
| source/npcGen.config.ts | The generator's NPC config: role archetypes, default ages, role minimum ages, `RANK_AGES`, talent rolls, variance, wars, minions |
| source/npcGen.ts | The generator itself (inputs, variance, minions) |
| source/closedForm.ts | The closed form (level from phase paces and the age integral) and the form-pool maths |
| source/archetypes.ts | Archetype weights and measured phase paces (the closed form's inputs) |
| source/canonStats.ts | The canon stat model (anchors carried along the growth curve, D-414) |
| source/progression.config.ts | Progression numbers: K, the curve, fatigue, challenge, outcomes, talents, `M_CAP` 2.8, `PACE_CAP` 4.0, `Y_AVG`, age rows, teacher factors |
| source/paceClamp.ts | The 4.0x clamp (D-48, D-104) |
| source/profiles.ts | The four lifetime calibration profiles (Average, Obi-Wan, Anakin, Luke) and their targets |
| source/progression-targets.md, progression-numbers.md, npc-generation.md | The specs those numbers serve |
| source/era09GreatGalacticWar.ts, era09Additions.ts | The canon roster files holding the sheets and drafts |

## How to restore

- **Everything at once:** `git checkout calibration-baseline-2026-11-22 -- <path>` for any file (e.g. `git checkout calibration-baseline-2026-11-22 -- src/data/canon/rankAges.ts`). The tag is the full tree at the baseline.
- **One number:** copy it from the matching file in `source/` back into the live file at the path in the table above (the live paths are under `src/`, `tests/lifetime/` and `docs-v2/spec/`).
- **A canon sheet:** canon-anchors.md has every level; the live sheets are in `src/data/canon/era09GreatGalacticWar.ts`.
- After a restore, run `npm run test:all` (the lifetime tests read the calibration).
