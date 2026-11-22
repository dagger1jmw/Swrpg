<!-- Exported 2026-11-21 from the claude.ai doc "SWRPG M6 integration checklist" (https://claude.ai/artifact/5nJqew4V3WKMwPSKSsumKe, rev 46). Superseded doc: since 2026-11-21 this repo copy is canonical and the doc is no longer updated. Changes made in the repo after the export (Jared's rulings, 2026-11-21): the item 16 correction, items 20-21, items 22-23 and the Sith-academy re-measure line (lore batch 1, D-319), from lore batch 2 the new item 15, items 24-25 and the fall-path re-measure line (D-323..D-326), and from the rulings on 84ec410 the item 15 curve, the item 24 approval and Korriban table, the item 25 intent discount and three re-measure sims (D-323 amended, D-329..D-331), from the rulings on cb3f0d1 the item 25 gate note and item 26 (D-330 amended, D-332), and the item 26 sensing and reconnection tweak (D-332 amended). -->

**Canonical (Jared, 2026-11-21):** this repo file is the source of truth for M6. The claude.ai design doc it was exported from is superseded and no longer maintained; design changes are made here and logged in docs-v2/decisions.md.

# SWRPG M6 integration checklist

Nov 21, 2026 · @Jared Wright

## How to use

These are the points where the M6 specs (reserve, alignment, catalog) touch systems M5 already built and calibrated. Each needs a decision here before Claude Code integrates it. Spec-only fixes are in the separate look-overs doc for the M6 design chat.

- **Order:** blockers first. Item 1 (drill fatigue) and item 3 (units) can change the whole calibration, so settle them before anything else.
- **Per item:** the risk, what M5 has now, and the open decision. Tick an item once its decision is made and logged.
- **After integration:** run the re-measure list at the end.

**Build reference (2026-11-21):** Claude Code builds from the repo copies of the three specs: `docs-v2/spec/force-reserve.md` (reserve), `docs-v2/spec/alignment-m6.md` (alignment) and `docs-v2/spec/force-catalog-m6.md` (catalog). Since 2026-11-21 these repo files (and this checklist) are canonical: design changes are made here, not in the claude.ai design docs, which are superseded.

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
- [ ] **15. Cybernetics and the Force ceiling (D-323; replaces "cybernetic ceiling loss", 5/10/20% plus 15 points):**
  - A single lost or replaced limb never lowers the pool ceiling (Legends: Luke's hand, Anakin's arm).
  - The ceiling falls only when a large share of the living body is lost or replaced. Curve (D-323 amended, approved): permanent loss = max(0, share lost − 0.30) × 1.3, with the body-share table (hand 1%, forearm 2%, arm 5%, leg 17%, lungs 5%, extensive burns 15%). Vader's post-Mustafar 61% gives about 40%; both legs about 5%; all four limbs under 20%.
  - A psychological part (about 20% for Vader) is recoverable through story events. Vader's total is about 60%, so his ceiling is about 80% of Palpatine's.
  - Cybernetic hands or arms block lightning-type powers (separate from the ceiling). The suit's immobility is a combat mobility effect (M5/M8), not a Force effect.
  - **Build:** with tests: one lost hand gives no ceiling change; both legs about 5%; all four limbs under 20%; Vader's injury set gives about 40% permanent and 20% recoverable (ceiling 0.80 of Palpatine's at 17,300); lightning is blocked with a cybernetic arm. Add it to the `npm run severs` re-measure.
- [ ] **16. Valor, Battlemind and Force Body:** M5 already uses them; they become per-round draws, and their M5 numbers convert with item 3.

  **Correction (Jared, 2026-11-21, from the step 1 report):** the per-minute loads in health.md §2 for Valor, Battlemind and Control Pain were never coded in M5. Only the suppression crash (+0.5 mental) is built. Their M6 per-round draws are therefore **new costs, not a conversion**. Measure them on the D-158 rows plus a Sith-heavy duel set before adopting the catalog values.
- [ ] **17. Learning-class gates:** lore-locked and story-event abilities are gated by story flags (Q50), not only by stat levels.
- [ ] **18. Potential at character creation:** the creation flow gains the pick-or-roll Potential step and the awakening state (character-creation.md).
- [ ] **19. New catalog data:** load the 15 new aliases, the six new form keys and the per-ability costs from the lore file.
- [ ] **20. Force efficiency (health.md §2's e(f), never coded):** the spec says Force abilities use the same e(f) performance curve as the other meters, but M5 never applied it (step 1 report, finding 2). Under M6, the strain thresholds apply the performance curve to Force abilities. Build it and gate it during integration; don't fix it in M5. (Jared, 2026-11-21.)
- [ ] **21. Force XP rework:** the direction for item 1 is written up as `docs-v2/spec/force-xp-rework.md`. It covers the finesse axis, which skill each exercise trains, the day trim and the Orgus Din check. **Adopted as the M6 Force XP model (D-333 to D-337, 2026-11-21):** built behind `FORCE_XP_TRIAL.enabled`, which stays off in the game until integration. At integration: switch the flag on, fold the trial hook into the progression feature, apply the D-335 boost cap (Force Control 115) to progression-numbers §11, and re-run every lifetime gate and the Orgus suite on all 20 seeds (force-xp-trial-3.md has the last passing run).

- [ ] **22. Conversion by torture (D-319, lore batch 2026-11-21):** a captured Jedi (captured by subduing, D-262) may face a conversion arc. Torture works only through temptation moments and corruption pressure; it never sets alignment directly. A fall still comes from the character's own deeds.
- [ ] **23. Step 1 review check: Orgus Din (D-319):** weak Force aptitude, Council-level combat skill "through endless practice" (`Docs/SWRPG lore/SW_Jedi_Daily_Life_Training_OldRepublic.md`). Low Potential and talent plus heavy drilling must still reach high skill. The proposed lifetime gate is in force-xp-rework.md §6. It is now the D-334 gate (`vitest.forcexp.config.ts`): count 7,000 reaches Force Control 84 within ±2 y of count 10,000; passes 20/20 (median +0.45 y, force-xp-trial-3.md). Re-run it at integration.

- [ ] **24. Pressure multipliers (D-324; lore: SW_DarkSide_Fall_Corruption_Redemption_Part1-3.md, Sections 1, 2 and 7):** dark-side sites (Korriban by era, Malachor, Byss, Yavin 4's temples, the Dagobah cave), Sith artifacts, Sith mentors and torture speed up deeds' effect and temptation frequency.
  - **Check against alignment-m6.md: not there.** The spec's nexus sites and outside power sources add only immersion and Corruption, which never raise Dark (alignment-lore-audit.md finding 2).
  - **Approved (D-329, cap 4):** a pressure factor P, the product of the sources present, capped at 4. P multiplies Dark from deeds and from dark-tagged Force use, multiplies the per-scene deed cap (+15), and divides the temptation cool-down (rounded down, at least 0 scenes).
    - Sites: a wound in the Force (Malachor V, 3,960–3,951 BBY) 3; Byss (the reborn Emperor, 10–11 ABY) 2; Korriban by era (table below); Yavin 4's temples while Kun's spirit is there (to 11 ABY) 1.5; the Dagobah cave 1.5 while inside (it also masks presence from sensing).
    - A carried Sith artifact (an amulet, a Sith holocron in use) 1.5. A Sith mentor actively turning the character 1.25. A dark spirit or entity working on the character (Kun on Kyp) 2.
    - Torture: 1.5, plus one temptation moment each scene of captivity (the D-319 conversion-by-torture rule still routes through temptation, never setting alignment directly).
  - **Korriban's pull by era:**

  | Year | Korriban's pull (P) | Basis |
  | --- | --- | --- |
  | To 3,951 BBY (the ancient Sith to the KOTOR era) | 1.5, strong | Lore: the tombs' permanent dark aura and dark-side pools (*KotOR II*) |
  | 3,636 BBY | 1.5, strong | Design default: the Imperial academy era; the lore files give no reading |
  | c. 1,000 BBY | 1.1, faded | Lore: Bane found the dark side had "retreated from the ancient edifices long ago" |
  | c. 23 BBY | 1.5, strong | Lore: a pull "powerful, insistent, irresistible" (*Jedi Quest*) |
  | After 23 BBY | 1.5 | Design default |

  Straight-line between the rows. Lore: SW_DarkSide_Fall_Corruption_Redemption_Part1.md §7 and Part2.md §7.

  - **Targets:** the D-324 fall speeds: self-driven years; outside pressure days to months; torture about a week; a wound in the Force immediate.
- [ ] **25. Gray use (D-326; lore: Part1 §8, Part2 §5 and §8, Part3 §8):** a dark-tagged power used calmly with light intent should weigh far less than a deed done in anger (Kyle Katarn, Jolee Bindo, Mace Windu's Vaapad).
  - **Ruled (D-330): an intent discount.** A dark-tagged power used calmly with light intent gives a small Dark gain (+0.2), no immersion and no Corruption, at most one such gain per scene. Calm with light intent: no fear or rage state, no anger fuel that scene, no dark deed tag on the use. Anger deeds count in full. alignment-m6.md §3 amended.
  - *Earlier check, before the ruling:* per use it does weigh less. A calm standard dark-tagged use is +1 Dark (+0.5 while Gray); the same act in anger is anger fuel +1 plus `indulged_anger` (moderate +3) or `murder` (major +6), ×1.5 at a temptation moment: 4 to 10 times as much. But dark-tagged use has no intent discount (only the knockout Choke) and sits outside the per-scene cap, so a career of calm use (Kyle) still climbs to the Dark band (audit finding 13). Gray keeps 25% of Corruption build-up where the lore says none (audit finding 11).
  - **Gate for the +0.2 value (D-330 amended):** the Kyle Katarn–style career sim (re-measure list) decides it. If the career drifts into the Dark band, report it and propose either a lower value or letting meditation and atonement wear down calm-use Dark. The value is not adopted until the sim passes.
  - **Vaapad (draft, pending Jared's review):** a risky light-side form. Heavy use (a fight in Vaapad) shortens the temptation cool-down by one scene; Vaapad fought in rage counts as anger fuel. Juyo the same (the New Sith Wars falls). Design defaults for review.
- [ ] **26. "Severed from the Force" status (D-332; proposal, don't build yet; lore: Ulic Qel-Droma, Meetra Surik):**
  - **Cause:** the D-331 severance event (by another: Nomi Sunrider severing Ulic) or self-severance at a wound in the Force (Meetra at Malachor V). Needs a visible cause event; the narrator can't declare it.
  - **While severed:** no Force use at all (no draws, abilities, Force Sense, precognitive defense or surge). Force skills frozen (no XP, no rust). Forms work as physical skill only; Force-dependent techniques are off. Sensed as an absence in the Force (D-332 amended): ordinary sensing reads nothing, but a strong senser (a clear win on the sensing contest) notices the void (Kreia and Meetra). Deeds still count.
  - **Return (D-332 amended):** usable pool R × pool max, Force skills at R × level. Fallback: R = smoothstep(t ÷ T) with T = 10 years (Ulic). A reconnection event (a Force bond, a teacher, returning to the place of the wound; a visible cause event, not declared by the narrator) starts a faster recovery: R rises from its current value to 1 along a smoothstep over months (design default 6 months; Meetra). A permanent severance is a story choice.
  - **Tests when built:** severed means no Force action is offered or resolved; R at 5 years on the slow curve is 0.5; a reconnection event at year 9 brings R to 1 within the fast window; a strong senser's clear win reads a void, a weak one reads nothing; the fallen flag clears through D-331's event path with no Light gain.
- [ ] **27. Backlash and collapse above 1.0 strain, in scene (reserve spec §5; Jared, 2026-11-21, ruling 4 on force-xp-trial-2.md):** in-scene effects only, built and gated at integration. They are not modelled in training: the Force XP rework fits each day's exercises to the pool (D-334), so training strain stays under the 0.75 standard limit and never reaches 1.0 (force-xp-trial-2.md §3).
  - **Build:** every point of strain above 1.0 spills into mental fatigue (backlash). Each use above 1.0 has a collapse chance starting at 5% and rising 5 points per further use, capped at 50%; collapse means Incapacitated for 1 to 3 hours. The overdraw Willpower check and its Vitality toll scaled by the age penalty apply. Anger fuel moves the backlash line to 1.3. Item 3 maps the M5 thresholds; item 9 shows the collapse chance.
  - **Tests:** strain 1.2 adds 0.2 to mental fatigue; the collapse chance runs 5, 10, 15 … 50% over successive uses above 1.0 and resets after rest; anger fuel moves the line to 1.3; an old fighter's overdraw costs more Vitality than one in their prime; a training day never exceeds 1.0 strain.
  - **Gate:** the re-measure list below (duel tables, D-158 rows, precognition trial) with backlash and collapse on.
- [ ] **28. Anchor duels for the duel harness (lore batch 3; D-355; lore: SW_Lightsaber_Duels_AllEras.md, timeline). Report only, don't build.** Check whether the harness can reproduce these outcomes within plausible variance, and report which ones the current engine can express (terrain, form switching, blade-locks) and which need new rules:
  - Lehon, 1000 BBY: Bane's Force power beats Kas'im's better swordsmanship.
  - Coruscant, 19 BBY: the form-switch feint catches Dooku.
  - Naboo, 32 BBY: the catwalk limits Qui-Gon's Ataru.
  - Byss, 10 ABY: strength breaks a blade-lock.
  - Mustafar, 19 BBY: Soresu holds against a furious Form V.
  - *Starting point (from a code read, 2026-11-21, not a run):* terrain exists (src/data/terrain.ts; the `confined` matchup gives Ataru −1, which covers Naboo in part). There is no mid-duel form switch: the free form switch of force-catalog-m6.md §5k is not built, so the Coruscant feint can't be expressed. There is no blade-lock rule, so Byss can't be expressed. Lehon and Mustafar run on existing Force use and matchups (src/data/formMatchups.ts has no Soresu-versus-Djem So defence entry, only Djem So +1 against Soresu).
- [ ] **29. Form matchup table against the sources (lore batch 3; lore: SW_Lightsaber_Forms_AllEras_Part1.md, sourced matchups). Report only.** Compare the engine's form-counter rules (src/data/formMatchups.ts, built from the v3 file's form notes and rolls §5) with the sourced matchups in Forms Part 1. List every rule with no source, and every sourced matchup the engine lacks.
- [ ] **30. Vaapad and Juyo drafts (D-350, D-352; lore: Forms Part 1, Juyo/Vaapad and dark-side risk).** The Vaapad and Juyo drafts awaiting review use D-350's access rule (the forbidden/restricted class, D-346; Juyo needs several forms mastered first; Vaapad needs Windu's permission) and the "superconducting loop" (power drawn from a dark-sided opponent at a corruption cost) as their lore basis.

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
- [ ] A simulated Sith-academy run (interrogation, judging prisoners, trial killings): how fast Dark climbs under the per-turn and per-scene deed caps (D-319)
- [ ] Fall-path sim (D-324): an Anakin-like path where the Tusken massacre alone does not cause the fall, but the Dooku execution, Windu betrayal and Temple chain does, within a day. Report the Dark, Corruption and immersion trajectory
- [ ] Kyp-style fall (D-329): a dark spirit (×2) and Yavin 4's temples (×1.5), P = 3, on a Knight-level character with no other pressure: the fall comes in days to weeks. Report the days to the fall and the Dark trajectory
- [ ] Kyle Katarn–style career (D-330): frequent calm tool use of dark-tagged powers, no anger deeds, a normal Jedi routine with meditation: ends below the Dark band (lean label not "Leaning dark" or worse) at career end. Report the Light and Dark trajectory
- [ ] Vader-like redemption (D-331): Dark 90, Light 0, high Corruption, redeemed by one act: lands just below the fall line (Dark 49), not fallen, eyes clear, Corruption unchanged; then Dark falls only through atonement over time
