# Lore batch 10: lightsaber forms catalog check, corrections and the v3 forms content

2026-11-21. Instructions: `docs-v2/lore/batches/lore-batch-10-forms-catalog-corrections.md`. Decisions D-369 (the check, rulings 1–16 and other corrections), D-370 (the Vaapad gate), D-371 (named maneuvers are flavour).

## Summary

- The forms catalog check is applied. The lightsaber content of `SW_Force_Abilities_Forms_v3_complete.md` now matches the SW_Lightsaber_* research set.
- The check's 53 matches were not touched, and the design-only items (Part 1 §E) are unchanged.
- **Code:** the Vaapad gate is built as a pure rule and wired into the Juyo/Vaapad drill. The gate is "a teacher or records", replacing the Mace-alive flags.
- **New tests (6):**
  - Vaapad can be learned from records in the New Jedi Order era, with Windu dead and no teacher.
  - Vaapad can't be learned before Windu creates it.
  - A Sith character can learn Soresu, Ataru, Niman and Sokan.
- **Harness:** unchanged. Details below.

## Files touched

| File | What changed |
|---|---|
| `Docs/SWRPG lore/SW_Lightsaber_Forms_Catalog_Check_Part1.md`, `_Part2.md` | Added (the check) |
| `Docs/SWRPG lore/SW_Lightsaber_Index_AllEras.md` | Already the version that points to the check (committed in batch 3); no diff |
| `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md` | 26 corrections, listed below (lightsaber content only) |
| `docs-v2/spec/force-catalog-m6.md` | §5k: the free form switch citation; a "Lore batch 10 corrections" block superseding the 2026-11-20 rows that differ |
| `docs-v2/spec/05-force-abilities.md`, `14-world-state-and-events.md` | Notes that `maceLiving` and `maceTrustEstablished` are replaced (D-370) |
| `src/features/progression/formAccess.ts` | New. `vaapadAccess` (pure), the design-default years and levels, and `JEDI_ORIGIN_ALSO_SITH` |
| `src/features/progression/training.ts` | The `formGate` unlock (Vaapad's gate; Juyo stays known-only); the Vaapad teacher from the session's NPC; the training record's `fromYear` era check |
| `src/data/activities.ts` | The `formGate` unlock kind; the Juyo/Vaapad drill uses it in place of `known()` |
| `src/data/trainingRecords.ts` | `fromYear` on records; new `record:njoFormVII` (Jedi path, from 11 ABY); Vaapad removed from `record:sithArchiveForms` |
| `tests/features/formAccess.test.ts` | New, 6 tests |
| `docs-v2/decisions.md` | D-369 to D-371 |
| `docs-v2/architecture.md` | §15 M7 note: signature-move effects |
| `docs-v2/lore/README.md`, `RESEARCH_QUEUE.md`, `docs-v2/progress.md` | Index, queue, progress |

**Not found in code:** none of the corrected forms text had been copied into `src/`. The forms' Difficulty and Tradition columns exist only in the v3 file. So the Niman difficulty change and the tradition change touch no code.

## Every item changed (v3)

| ID (check) | Change |
|---|---|
| A3 (table and note), ruling 6 | Makashi: "footwork-centred, minimal energy expenditure"; "minimal movement" and "minimal footwork" removed |
| A4 | Makashi: "high mental and willpower requirements" removed as unsourced. No stat gate depended on it, so none was kept |
| A5, ruling 5 | Ventress restored: skilled, not a master, often with two blades. The 2026-11-20 removal note is reversed |
| A10, ruling 3 | Niman: "No single weakness or strength" replaced by the named weaknesses (relaxed bladework; nearly hopeless against Makashi) |
| A12, ruling 12 | Niman: Revan marked [unclear] (one uncited sentence) |
| A13, ruling 2 | Niman origin kept; "developed from Jar'Kai" noted as the minority version |
| Ruling 4 | Niman difficulty Advanced → Beginner; note added: easy to learn, at least ten years to master |
| A44, ruling 15 | Tradition column: Soresu, Ataru, Niman and Sokan → "Jedi origin; also Sith" |
| A16 | Juyo: available to Old Republic Jedi only for students their teacher judged steady, its status swinging between frowned-upon and taboo. Era access added: Vaunk's hand-picked students after the New Sith Wars; Drallig refusing Anakin |
| A18 | Galen Marek called a Dark Jedi |
| A20, A21, A24, A25; rulings 1, 7, 8, 9 | Vaapad note rewritten. Pre-Windu "Vaapad" is a Juyo alias; the gate is a teacher or records; Billaba and Vos as masters; Windu the last master after Bulq and Billaba died; the Yoda quote deleted; Clone Wars teachers Windu (with permission) and Bulq (unsanctioned) |
| Ruling 9 (learning class) | The learning-class paragraph now points to the Vaapad gate |
| A32, ruling 14 | Dun Möch: "a Sith doctrine; Jedi use is rare and debated" |
| A35, ruling 11 | Saberstaff: "more damage, less precise" replaced with the Legends description; a damage bonus only when thrown; invented by Sith Lords, Exar Kun first |
| A37, ruling 13 | Telekinetic combat peak: Darth Traya with three sabers; Luke removed |
| A40 | Lightsaber pike: the double-bladed Temple Guard pike fights like a saberstaff; the polearm has no stated weaknesses |
| B1, ruling 10 | Trispzest: open to fliers and levitators (S'kytri, Maw) |
| B2 | Form Zero: named by Skarch Vaunk in *The Jedi Path*, supported by Yoda; Kyle Katarn taught a version |
| C1 | Free form switch: "(Sidious was a master of all seven forms)". The mechanic is unchanged |
| D1 | Saber Throw: protosabers can't be thrown |
| D3 | Saber Barrier: needs multiple sabers (Windu with one is the exception) |
| D6 | Force Valor: "necessary" in place of "physically impossible" |
| D8 | Tutaminis: "a rare few masters could catch or dispel a blade or bolt"; "nearly impossible to harm" removed |
| D10 | Force-imbued weapons: the Je'daii line tagged [gray], with its pre-2014 backing noted |
| D11, D12, D13; ruling 9 | Worldstate flags: `maceLiving` and `maceTrustEstablished` replaced by `vaapadTeacherOrRecords`; `jediCouncilPermission` is Juyo only; the Vaapad unlock trigger now checks the new gate |
| Ruling 16 | Added: Juyo-Kos (table row and note); reverse Shien grip; NPC notes (Bane, Zannah and Vader Form V variants, Kas'im's two-saber Ataru); Praetoria Vonil and Ishu; three rings of defence; mounted combat; cross-references to WeaponVariants and SubgroupStyles; the Named maneuvers table (alternative names, form moves, technique moves, basic moves, ready stances) |

## Harness

**No change, so mortals and spread were not re-run.**
- The sims (tests/support, tests/lifetime, tests/spread, tests/mortals) use neither training records nor the Juyo/Vaapad drill. A search found no reference.
- For Juyo, the drill's new `formGate` behaves exactly like the old `known()`.
- Form difficulty isn't used in code. Ruling 4's flag, "breaks any harness gate", therefore doesn't arise.

`npm test`, typecheck and lint pass.

## What didn't map cleanly

- **No M7 checklist file exists.** The "M7 checklist item" for signature moves went into architecture §15's M7 list, where the other M7 items live.
- **Vaapad has no creation year in Legends** ("the late Republic"). The gate uses a design default of c. 40 BBY. The New Jedi Order records use c. 11 ABY (D-352 [21]).
- **Light side only:** alignment isn't built yet, so the gate uses the Sith path as the stand-in for "not light side". Switch it to the alignment value at M6 integration.
- **Windu's permission:** a session in which the NPC Windu (`lore:mace-windu`) teaches counts as his permission. Neither Windu nor Bulq is in the era 09 roster, so their branches run only when a later roster adds them. Any teacher with Vaapad 61+ counts as a Vaapad master.
- **The Index file:** the batch says it replaces batch 3's copy. The committed copy already pointed to the check, so there's no diff.
