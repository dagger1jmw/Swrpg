<!-- Exported 2026-11-21 from the claude.ai doc "SWRPG M6 integration checklist" (https://claude.ai/artifact/5nJqew4V3WKMwPSKSsumKe, rev 46). The repo copy is the build reference; design changes go in the doc first, then re-export. Repo-only additions since the export (Jared's rulings, 2026-11-21): the item 16 correction and items 20-21; copy them into the doc before the next re-export. -->

# SWRPG M6 integration checklist

Nov 21, 2026 · @Jared Wright

## How to use

These are the points where the M6 specs (reserve, alignment, catalog) touch systems M5 already built and calibrated. Each needs a decision here before Claude Code integrates it. Spec-only fixes are in the separate look-overs doc for the M6 design chat.

- **Order:** blockers first. Item 1 (drill fatigue) and item 3 (units) can change the whole calibration, so settle them before anything else.
- **Per item:** the risk, what M5 has now, and the open decision. Tick an item once its decision is made and logged.
- **After integration:** run the re-measure list at the end.

**Build reference (2026-11-21):** Claude Code builds from the repo copies of the three specs: `docs-v2/spec/force-reserve.md` (reserve), `docs-v2/spec/alignment-m6.md` (alignment) and `docs-v2/spec/force-catalog-m6.md` (catalog). Design changes go in the design docs first, then are re-exported to the repo.

## Blockers

These four can break M5 or its calibration if M6 is built as written.

- [x] **1. Force drill fatigue**

  Since M4, the Force meter caps daily Force-drill hours, and the lifetime calibration (Luke, Obi-Wan, the K gate) depends on it. Under M6, free and comfort-range uses cost almost nothing, so that cap disappears. Direction (Jared, 2026-11-21): rework Force training XP around difficulty, not hours. Free uses are second nature and earn little or no XP; real growth comes from pushing (harder abilities, bigger scale classes, more effort, holding several at once), which draws pool and builds strain, so fatigue limits it naturally. Requirements: no artificial ceiling (a harder exercise always exists at every level), time still matters (the routine sets the hours; no one floats objects all day), and the lifetime gates are re-measured. Check how M4's challenge factor already scales drill XP, and build on it.

  **Decided (Jared, 2026-11-21):** adopt this direction. The numbers (XP by difficulty, strain from pushing) get tuned in testing against the lifetime gates on all 20 seeds, with K unchanged.

  M6 review (2026-11-21): consistent with the reserve spec, which grows the pool from meditation, training near your limits and overreach. Free uses may give a trickle of XP, but must never be a way to grind.
- [x] **2. The AI contract**

  The specs have the narrator emit `FORCE_USE:` and `ALIGN:` text lines. M5's contract is bounded schema events only, with all Force use resolved before narration. Proposed:
  - Force use comes only from the player's intent or NPC logic, never the narrator.
  - Deed tags become an `alignmentDeed {tag, severity, modifiers}` event, capped per turn.
  - Hidden temptation tags become an `alignTag` field on choices in the schema.

  Proposed fix in detail:
  1. **Force use: intent and engine only.**
     - The player's Force actions come through the intent call, which gains `forceAction {ability, target, effort, scale}`. Effort is light, normal, strong or all-out; scale is the class from the reserve spec.
     - NPC Force use comes from engine policy by archetype.
     - The engine resolves every draw, check and effect before narration (the D-30 rule). The narrator gets the reserve spec's tier labels read-only and can't emit Force use.
     - Rejected: any narrator event that implies a Force use the block doesn't contain.
  2. **Deeds: `alignmentDeed` event from the narrator.**
     - Fields: `tag` (enum of the fixed alignment-spec list), `severity` (minor, moderate, major, extreme), `modifiers` (provoked, defending\_others, coerced), `actor` (player or an NPC ref), `why` (short text).
     - At most 2 per turn. Severity is clamped to each tag's allowed range, unknown tags are refused, and the scene caps apply in the engine.
     - Deeds the engine already knows from combat outcomes (item 7) come only from the engine; a narrator deed repeating one is refused.
  3. **Temptation: engine flag plus a hidden choice field.**
     - The engine decides when a scene is a temptation moment, using the alignment spec's triggers, cooldown and pacing, and passes `temptationMoment: true` in the context.
     - Only then, choices in the response schema can carry an optional hidden `alignTag {tag, severity}`. The UI never shows it.
     - Picking a tagged choice applies it at ×1.5; picking an untagged one applies `resisted_temptation` in the engine.
     - Typed input during a temptation moment: the intent call returns `alignTag` when the typed action is dark.
     - If the narrator offers no dark option, nothing is applied.
  4. **Schema composition (D-15):** `alignTag` appears only when the flag is set; `alignmentDeed` stays in the always-legal set with its cap. The size-cap test covers the new variants.
  5. **Tests:** fixtures for a narrator Force-use line being refused, a deed clamped by severity, an unknown tag refused, a duplicate of a combat deed refused, a temptation pick at ×1.5, an untagged pick giving `resisted_temptation`, and a typed dark action tagged by the intent call.

  **Decided (Jared, 2026-11-21):** adopt the proposed fix as written. Tick this item once Claude Code has logged it.

  M6 review (2026-11-21): the tags, severities, modifiers, ×1.5 and `resisted_temptation` match the alignment spec. Enforce both the per-turn cap (2) and the spec's per-scene caps (+15 Dark, +6 Light). Gap: `forceAction` gains `darkSurge` (none, flicker, give in, surrender, mapping to +15/25/35%) and `angerFuel` (true or false, for the Willpower zone). Choosing to surge during a temptation moment is a temptation choice at ×1.5, so the engine must see it in the intent.
- [x] **3. Units**

  M5's Force meter has a capacity per character (the iPad sheet showed "Force 0.1 / 4.8"), so its 1.0 thresholds are relative. M6 strain is absolute, 0 to 1.0 and beyond. Decide whether strain is load ÷ capacity or capacity becomes 1.0. Gate the build on the read-only report in reserve spec build step 1.

  Further detail (2026-11-21): M6's flat meter is the right model. The issue is that M5 expresses "what you're used to" a different way, and the two must not both apply.
  - **M5 today:** each character has a Force meter capacity (for example 4.8), set from their stats. Each use adds a fixed load (precognition 0.4 per trigger), and every threshold reads load ÷ capacity: backlash past 1.0, the sequence-cap reduction, the D-194 warning.
  - **M6:** strain is the same flat 0–1.0+ tracker for everyone. Being accustomed lives in how fast strain builds: a bigger pool means a smaller share per draw, and Conditioning sets the comfort line and the usual rate. So an Inquisitor draws much more before strain moves, while the meter itself means the same for everyone.
  - **Strain is already relative by construction (Jared, 2026-11-21): both multipliers are ratios to the character's own pool (depth against their comfort line, rate against their usual rate), so the same relative act gives the same strain to a Padawan and a Master. The 1.0 line means "past your limit" for everyone. No double counting, because capacity doesn't survive as a separate value**.
  - **Decided mapping (Jared, 2026-11-21): M5 capacity (the 4.8) becomes pool max (absolute, set by Potential and growth); M5 load (the 0.1) becomes pool drawn (draw units); M5's 1.0 thresholds (backlash, collapse) become strain thresholds. The build stays gated on the step 1 report, which settles the unit conversion: M5's small scale (4.8) versus M6 draw units (Basic instant = 10, ceiling 500 × (count ÷ 10,000)^1.5), and where the M5 thresholds and constants (precognition 0.4, the 0.5 mental backlash) land**.

  M6 review (2026-11-21): the step 1 report also converts the Shatterpoint read cost (M5's flat 0.3 load, replaced by the D-63 amendment formula), alongside precognition's 0.4 and the 0.5 mental backlash.
- [x] **4. Potential vs Force talent**

  Creation, NPC generation, the lifetime profiles and the M multiplier already use Force talent to speed growth. Potential now also sets pool growth and access. Without a mapping, Anakin and Luke get counted twice. List every place talent affects growth and define how Potential relates to it.

  M6 review proposal (recommended): two separate axes, so nothing counts twice.
  - **Potential:** how big the connection is. Sets pool size, ceiling, pool growth speed and untrained access. Never multiplies XP.
  - **Force talent:** how fast you learn. Speeds XP for Force stats and abilities, as in M5. Never touches the pool.
  - **Lore:** Anakin is high on both; a modest-Potential, high-talent character like Obi-Wan masters fewer abilities deeply.
  - **Risk:** M5's lifetime profiles were tuned with talent partly standing in for raw power. If Luke or Anakin overshoot once Potential is added, tune how much the pool matters in combat. Don't cut talent; K stays.
  - **Generated NPCs:** roll Potential and talent separately; a Force path guarantees a Potential band.

  **Decided (Jared, 2026-11-21): two axes.** Talent stays on XP only; Potential takes the pool. Before integrating, Claude Code lists every place Force talent affects growth (creation, NPC generation, lifetime profiles, the M multiplier, the Force meter capacity, anything else). For each, it reports whether talent only speeds XP there, or also feeds something M6 moves to the pool (size, ceiling, pool growth, access). Any talent-to-capacity link retires with the old meter. Report, then integrate.

## Integration items

- [x] **5. Precognition as a sustained draw**

  The overnight trial (precog-m6-trial.md) tests M6's model against the M5 calibration. The trigger chance stays as tuned in D-244 (min(0.5, FS/200)); only the cost changes. The lore-accurate model is preferred, with M5's as the fallback. Also decide on the §15 note about precognition softening killing blows: build it with the redesign, or drop it.

  M6 review (recommended): drop the softening idea. Precognition already pays off through its trigger, so damage reduction on top doubles the benefit. Revisit only if the trial shows precognition is too weak.
- [x] **6. Dark surge**

  Revised 2026-11-21: the surge is the rush of first letting go. It fades by Dark, full at Dark 0 and gone at the fall (Dark 50+ and above Light). It fades by Dark, not immersion, because Dooku has high Dark and low immersion. Established dark-side NPCs never surge; a Jedi or gray NPC surges only through a code-validated story event. To do: confirm the Jedi-vs-Sith duel tables are unchanged, then the report-only Luke-vs-Vader case (Luke's Dark is low, so he gets close to the full +25%, for a few rounds, stopping by Willpower) with win rate, rounds held, and Dark and immersion gained.
- [x] **7. Deeds tagged by the engine from combat**

  Combat outcomes the engine already knows should tag deeds in code, not by the AI:
  - Kill on a surrendered or helpless foe: `murder`.
  - Spare: `mercy`.
  - Maiming a beaten foe: `excessive_force`.
  - Fate choices count as temptation moments (an enemy at your mercy).
  - The capture rule's knockout Choke (D-262) matches the brief-knockout exception (no Dark).

  M6 review, severities (redemption needs a major or extreme mercy at a temptation moment, so these matter):
  - `murder` of a surrendered or helpless foe: major. `provoked` applies if the engine knows the foe provoked it.
  - `mercy`: moderate; major when the engine's strong-pressure flags are set (rage state, or a loved one hurt), the same test as `resisted_temptation`.
  - `excessive_force` from maiming a beaten foe: moderate.
- [x] **8. Manifestation and known-ability XP**

  D-203 gives XP only to abilities a character knows, so "manifestation" needs an `abilityManifested` engine event to add an ability. Also check that every archetype keeps the M5 combat abilities it uses (Push, saber throw and recall, telekinetic throws), or the sweep rows will shift.

  M6 review: the lore file now gives every ability a learning class. `abilityManifested` fires only for "can manifest" entries, triggered by Potential, awakening or an emotional surge.

## Small connections

- [ ] **9. Collapse warning (D-194):** it shows a flat 5% per use. M6 ramps collapse from 5% to a 50% cap, so the duel panel and the Force buttons should show the current chance.
- [ ] **10. `STUB_LIGHT_PHILOSOPHY`:** Force insight's light-side bonus reads the path today. Switch it to the Light score.
- [ ] **11. Narration check additions:** flag "out of Force" or "no Force left" phrasing (reserve spec rule 3), and eye or dark-side changes the block doesn't list.
- [ ] **12. Save migrations:** keep writing them for every changed slice, as in M5, despite the reserve spec's "no save migration" line. Test campaigns exist.

  Resolved: the "no save migration" line is gone from the spec.
- [ ] **13. Zero-G code conversion:** the `zeroG` form key becomes an environment modifier. Existing characters with that form need a migration rule.

## Added from the M6 review

Integration points the M6 design chat found that the first pass missed.

- [ ] **14. NPC alignment values in code:** the agreed archetype table and the hand-set canon values go into npc-generation, so eyes and sensing work for opponents.
- [ ] **15. Cybernetic ceiling loss:** M5's severed limbs apply the ceiling loss when a cybernetic is fitted (5/10/20% plus 15 points per replacement). Add it to the `npm run severs` re-measure.
- [ ] **16. Valor, Battlemind and Force Body:** M5 already uses them; they become per-round draws, and their M5 numbers convert with item 3.

  **Correction (Jared, 2026-11-21, from the step 1 report):** the per-minute loads in health.md §2 for Valor, Battlemind and Control Pain were never coded in M5. Only the suppression crash (+0.5 mental) is built. Their M6 per-round draws are therefore **new costs, not a conversion**. Measure them on the D-158 rows plus a Sith-heavy duel set before adopting the catalog values.
- [ ] **17. Learning-class gates:** lore-locked and story-event abilities are gated by story flags (Q50), not only by stat levels.
- [ ] **18. Potential at character creation:** the creation flow gains the pick-or-roll Potential step and the awakening state (character-creation.md).
- [ ] **19. New catalog data:** load the 15 new aliases, the six new form keys and the per-ability costs from the lore file.
- [ ] **20. Force efficiency (health.md §2's e(f), never coded):** the spec says Force abilities use the same e(f) performance curve as the other meters, but M5 never applied it (step 1 report, finding 2). Under M6, the strain thresholds apply the performance curve to Force abilities. Build it and gate it during integration; don't fix it in M5. (Jared, 2026-11-21.)
- [ ] **21. Force XP rework:** the direction for item 1 is written up as `docs-v2/spec/force-xp-rework.md`. It covers the finesse axis, which skill each exercise trains, the day trim and the Orgus Din check. Approved in direction, not adopted; build it with the M6 integration and tune it on all 20 seeds.

## Re-measure after integration

Run these with full 20-seed runs in parallel, and report runtimes. Tune only the tunables; anything needing K or a formula change is reported, not done.

- [ ] Rolls §8 duel tables (medians 30–40 at gaps 0–10, +20 within 29 ± 5, win rates within ±3)
- [ ] D-158 group-fight rows, via `npm run sweep`
- [ ] Lifetime suite, all gates (`npm run spread`)
- [ ] Lost limbs and mortal wounds per life (`npm run severs`, `npm run mortals`)
- [ ] The Sidious-like report, with Force use in trials so CI can grow
- [ ] A short browser smoke test of Force use, alignment tags and the two-bar UI
- [ ] The Luke-vs-Vader surge report
- [ ] The precognition trial result (precog-m6-trial.md)
- [ ] An eye-state check on canon NPCs: Dooku normal, a practising Sith "while channeling", Palpatine "constant" but hidden by the Mask
