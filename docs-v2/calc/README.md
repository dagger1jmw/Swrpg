# docs-v2/calc

Calculation scripts behind the numbers in the v2 specs (Fable review fixes, decisions D-39
to D-48, D-51 and D-66). They are not game code and are not part of the build: `src/` is
built from the specs in the milestones, and these scripts only produce the values the specs
quote as "computed by docs-v2/calc/<file>". Plain Node (tested on v24), no dependencies.
Run them from the repository root:

| Script | Produces | Spec |
|---|---|---|
| `node docs-v2/calc/fatigue-reference.mjs` | fatigue reference days and willpower references | progression-numbers §9, §20 tests 4-5 (D-39) |
| `node docs-v2/calc/progression-sim.mjs` | K, the Average profile by age, milestones, crossing ages for rank minimums, yearly main-skill XP for the 4.0x clamp | progression-numbers §2, §5, §12; ranks.md §1 (D-40, D-41, D-42, D-48, D-51, D-66) |
| `node docs-v2/calc/npc-closed-form.mjs` | the age-factor closed form, test 2 against the day loop, the NPC reference table, phase paces | npc-generation §1, §3 (D-43, D-44) |
| `node docs-v2/calc/padawan-selection.mjs` | the Average profile's percentile among 1,000 seeded NPC Initiates, the monthly divisor, a 10,000-run check | ranks.md §1 (D-66) |
| `node docs-v2/calc/profiles.mjs` | Obi-Wan, Anakin and Luke on the same schedule structure (peacetime baseline) | progression-numbers §12 (D-40) |
| `node docs-v2/calc/variants.mjs` | the schedule variants compared when choosing D-41 and D-42 (conflict record) | decisions D-41, D-42 |

Shared code: `model.mjs` (spec constants and curves), `day.mjs` (one day in 30-minute
steps), `activities.mjs` (mirrors spec/skills-and-activities.md; keep the two in sync).

Known simplifications, stated so the numbers can be judged:
- No rust (the profiles train every skill continuously), no synergy spillover, outcome at
  its mean (0.996), no combat XP. The Average profile is peacetime and its drill ceiling
  never binds.
- The scheduler applies the training-routines §3-4 ordering rules and trims fill hours to
  the tiredness limit. It does not search all valid schedules for the highest XP.
- Instruction applies one factor per block to every skill credited by that block.
- Everything that depends on K is provisional until D-67 (Endurance baseline) is decided in
  the M3/M4 lifetime-test session. Re-run every script then.
