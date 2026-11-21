# Lore research queue

Last updated 2026-11-21 (lore batch, docs-v2/lore-batch-2026-11-21.md; dark-side files added the same day).

This file tracks every lore file in `Docs/SWRPG lore/`: what it covers, where it came from, what in docs-v2 relies on it, and what the research bot should redo next. The lore files themselves stay in `Docs/SWRPG lore/` (the canon source of truth). This queue and the lore index (README.md, next to this file) live in `docs-v2/lore/`, because CLAUDE.md forbids new files in `Docs/`.

- **Origin:** "bot (reviewed)" = written by the research bot and reviewed in chat (each opens "Legends lore reference for SWRPG. Researched …"). "pre-bot" = older files from before the research bot.
- **Priority:** 1 = feeds M6 (Force powers, alignment, the dark side); 2 = M7 (Orders, ranks, schedules); 3 = M8 (equipment, lineage); 4 = background only.
- **Cited by:** D-numbers in `docs-v2/decisions.md` and files in `docs-v2/spec/` (plus `architecture.md`) that name the file or rely on its facts. Found by searching for the file name and its short forms (for example "Characters_09", "Timeline :NNN", "the Force lore file"), then checked by hand. "—" = no citation found.
- Every character file and the timeline also feed the runtime lore index (D-81: `scripts/build-lore.ts` reads only `SW_Characters_*` and `SW_Legends_Galaxy_Timeline`). The topical files (Force, marks, sabers, weapons, Orders) are design references and are not indexed for the narrator.

## Files

| File | Scope | Eras | Size | Origin | Priority | D-numbers | Spec files |
|---|---|---|---|---|---|---|---|
| SW_Characters_01_DawnOfTheJedi.md | Character sheets, Era 01 | 36,453–25,783 BBY | 38 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Characters_02_OldRepublicFounding.md | Character sheets, Era 02 | c. 28,000–5,100 BBY | 26 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Characters_03_GoldenAgeSith_GreatHyperspaceWar.md | Character sheets, Era 03 | c. 5,100–4,990 BBY | 28 KB | pre-bot | 4 | D-81, D-155, D-277 | 23-species.md |
| SW_Characters_04-05_GreatSithWar.md | Character sheets, Eras 04/05 | c. 4,400–3,996 BBY | 36 KB | pre-bot | 4 | D-81, D-155, D-213, D-277 | — |
| SW_Characters_06_MandalorianWars.md | Character sheets, Era 06 | c. 3,976–3,960 BBY | 28 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Characters_07_JediCivilWar.md | Character sheets, Era 07 | c. 3,959–3,956 BBY | 31 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Characters_08_DarkWars_SithTriumvirate.md | Character sheets, Era 08 | c. 3,955–3,950 BBY | 33 KB | pre-bot | 4 | D-81, D-155, D-213, D-277 | — |
| SW_Characters_09_GreatGalacticWar_ColdWar.md | Character sheets, Era 09 (the default start era; source of the built canon roster) | c. 3,681–3,636 BBY | 62 KB | pre-bot | 1 | D-81, D-152, D-155, D-205, D-213, D-277 | 02-npc-generation.md, 12-milestones-rank-life-stage.md, 16-lore-injection.md, bugs.md, force-xp-rework.md, lore-checks.md, npc-generation.md |
| SW_Characters_09B_EternalEmpire_Alliance.md | Character sheets, Era 09-B | c. 3,637–3,620 BBY and later | 37 KB | pre-bot | 4 | D-81, D-155, D-213, D-277 | 16-lore-injection.md |
| SW_Characters_10_NewSithWars_DarthBane.md | Character sheets, Era 10 | c. 2,000–990 BBY | 31 KB | pre-bot | 4 | D-81, D-144, D-155, D-277 | — |
| SW_Characters_11_RepublicEra_RiseOfEmpire.md | Character sheets, Era 11 | c. 990–22 BBY | 35 KB | pre-bot | 4 | D-10, D-81, D-155, D-277 | 06-shatterpoint.md, 12-milestones-rank-life-stage.md, 22-equipment-and-items.md, 23-species.md, lore-checks.md |
| SW_Characters_12_CloneWars.md | Character sheets, Era 12 | c. 22–19 BBY | 40 KB | pre-bot | 4 | D-81, D-155, D-277 | 06-shatterpoint.md |
| SW_Characters_13_DarkTimes_GalacticCivilWar.md | Character sheets, Era 13 | c. 19 BBY–4 ABY | 44 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Characters_14_NewRepublic_NewJediOrder.md | Character sheets, Era 14 | c. 4–25 ABY | 36 KB | pre-bot | 4 | D-81, D-155, D-192, D-277 | — |
| SW_Characters_15_NewJediOrder_YuuzhanVongWar.md | Character sheets, Era 15 | c. 25–29 ABY | 39 KB | pre-bot | 4 | D-81, D-155, D-192, D-224, D-277 | — |
| SW_Characters_16_LegacyOfTheForce.md | Character sheets, Era 16 | c. 40 ABY | 33 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Characters_17_FateOfTheJedi.md | Character sheets, Era 17 | c. 43–44 ABY | 31 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Characters_18_LegacyEra.md | Character sheets, Era 18 | c. 130–139 ABY | 30 KB | pre-bot | 4 | D-81, D-155, D-277 | — |
| SW_Force_Abilities_Forms_v3_complete.md | Force abilities master list (13 families), lightsaber forms, Form Rules (M6), Shatterpoint | All eras | 211 KB | pre-bot (checked against Wookieepedia, D-278) | 1 | D-05, D-10, D-53, D-63, D-147, D-276, D-277, D-278 | 00-index.md, 01-character-creation.md, 04-proficiencies-and-talents.md, 05-force-abilities.md, 16-lore-injection.md, 22-equipment-and-items.md, 23-species.md, force-catalog.md, force-catalog-m6.md, lore-checks.md, phase1-answers.md, progression-numbers.md, rolls.md, skills-and-activities.md, architecture.md |
| SW_Legends_Galaxy_Timeline.md | Galaxy timeline: scripted events and NPC deployment by era | 36,453 BBY–c. 139 ABY | 122 KB | pre-bot | 3 | D-01, D-02, D-08, D-38, D-81, D-144, D-213, D-277 | 01-character-creation.md, 13-calendar-and-time.md, 16-lore-injection.md, bugs.md, lore-checks.md, architecture.md |
| SW_Lightsaber_Combat_Marks_Zones_Techniques.md | Marks of contact, target zones, stances and techniques | All eras (general) | 7 KB | pre-bot (written from Wookieepedia, 2026-11-18) | 1 | D-188, D-267 | architecture.md |
| SW_Jedi_Daily_Life_Training_OldRepublic.md | Jedi daily life: *Jedi Path* timetable, clans, Initiate Trials, Padawan life, Service Corps | c. 3,700–3,600 BBY, with general material | 63 KB | bot (reviewed) | 2 | D-286, D-295, D-296, D-298, D-300, D-301, D-303, D-304, D-306, D-319 | force-xp-rework.md, m6-integration-checklist.md |
| SW_Jedi_Order_Ranks_Council_OldRepublic.md | Jedi ranks Initiate → Grand Master, honorary titles, High Council, Tython Temple | c. 3,700–3,600 BBY | 54 KB | bot (reviewed) | 2 | D-283, D-284, D-298, D-302, D-306 | — |
| SW_Jedi_Training_AllEras_Part1.md | Jedi training and organization, Eras 1–5 (Je'daii to Ruusan), Corellian Jedi, Baran Do | c. 36,453–1,000 BBY | 52 KB | bot (reviewed) | 2 | D-285, D-296, D-297, D-298, D-299, D-303 | — |
| SW_Jedi_Training_AllEras_Part2.md | Jedi training and organization, Eras 6–9 (late Republic to Legacy), Matukai, Antarian Rangers, Jensaarai | 1,000 BBY–c. 138 ABY | 42 KB | bot (reviewed) | 2 | D-296, D-297, D-298, D-300, D-302, D-304, D-305, D-307 | — |
| SW_Sith_Academies_Training_OldRepublic.md | Imperial Sith academies and training, compared with JCW Korriban and the Brotherhood of Darkness | c. 3,681–3,636 BBY (also c. 3,956 and 1,010–1,000 BBY) | 67 KB | bot (reviewed) | 2 | D-286, D-312, D-313, D-314, D-315, D-317, D-318, D-319 | m6-integration-checklist.md (via D-319) |
| SW_Sith_Training_AllEras_Part1.md | Sith training and organization, Eras 1–6 (ancient Empire to the Brotherhood of Darkness) | c. 28,000–1,000 BBY | 83 KB | bot (reviewed) | 2 | D-308, D-309, D-310, D-312, D-313, D-314, D-315, D-318 | — |
| SW_Sith_Training_AllEras_Part2.md | Sith training and organization, Eras 7–10 (Rule of Two to the One Sith); non-Sith darksiders | 1,000 BBY–c. 138 ABY | 73 KB | bot (reviewed) | 2 | D-308, D-309, D-311, D-315, D-316, D-317, D-318, D-320 | — |
| SW_Lightsabers_Crystals_Materials_AllEras.md | Lightsaber construction, crystals, blade colours, variants, saber-resistant materials | All eras | 99 KB | bot (reviewed) | 3 | D-285, D-286, D-287, D-288, D-289, D-292, D-301, D-303, D-317 | architecture.md (§15 M8 equipment ideas) |
| SW_Weapons_Armor_AllEras.md | Non-saber weapons, armour, personal shields, anti-Jedi gear | All eras, focused on the Old Republic and Clone Wars | 87 KB | bot (reviewed) | 3 | D-289, D-290, D-291, D-292, D-293, D-294 | architecture.md (§15 prepared Jedi hunters) |
| SW_DarkSide_Fall_Corruption_Redemption_Part1.md | The dark side: how falling works, falls, redemptions, physical corruption, power, madness, places, gray paths | To 1,000 BBY | 48 KB | bot (reviewed) | 1 | — | alignment-m6.md (audited: docs-v2/testing/alignment-lore-audit.md) |
| SW_DarkSide_Fall_Corruption_Redemption_Part2.md | As Part 1 | 1,000 BBY–4 ABY | 44 KB | bot (reviewed) | 1 | — | alignment-m6.md (audited) |
| SW_DarkSide_Fall_Corruption_Redemption_Part3.md | As Part 1, plus Force psychosis | 4 ABY–c. 138 ABY | 50 KB | bot (reviewed) | 1 | — | alignment-m6.md (audited) |

## Redo briefs for the pre-bot files

Ordered by priority. Each brief is a one-paragraph prompt for the research bot.

- **Priority 1. Force abilities and lightsaber forms (redo of SW_Force_Abilities_Forms_v3_complete.md).** Re-research every Legends Force power and lightsaber form across all eras, one entry per power: what it does, how hard it is, who used it and when, Jedi and Sith variants, the light or dark side tag, learning paths (holocron, Master, lore-locked rituals) and known limits (range, scale, duration, strain), with per-entry citations and conflicts listed without picking. Keep the forms' history, masters and weaknesses, and Form Rules facts, but leave out the game numbers (tiers, costs, stat anchors), which the M6 specs own. Game systems: the M6 Force catalog (force-catalog-m6.md), the reserve (force-reserve.md), alignment tags (alignment-m6.md), combat Force actions, form matchups (rolls.md) and the Force XP rework.
- **Priority 1. Lightsaber combat technique (redo of SW_Lightsaber_Combat_Marks_Zones_Techniques.md).** Expand the marks of contact, target zones, stances, ripostes, binds, saber throws and multi-opponent techniques into a full bot file, with each form's own techniques and their sources across all eras, and which techniques are Jedi-only, Sith-only or shared. Game systems: M6 marks as learnable techniques (D-188, D-278), aimed strikes (D-171), Zone 4 back strikes, riposte, cleave, Makashi precision.
- **Priority 1. Era 09 characters (redo of SW_Characters_09_GreatGalacticWar_ColdWar.md).** Re-research every named Jedi, Sith, Imperial, Republic and Mandalorian figure of 3,681–3,636 BBY: birth and death years, rank by year (with the D-283 Satele Shan dates as a check), Masters and apprentices, lightsaber forms and Force powers named in the sources, alignment and visible corruption, species and homeworld. Mark every design estimate as such. Answer the open D-152 questions (Darth Vindican's and Ngani Zho's death years, Aric Jorgan's age in 3,661) and the Orgus Din background (D-319). Game systems: the built canon roster (src/data/canon), M6 hand-set alignment values for canon NPCs (checklist item 14), M7 ranks, the lore index.
- **Priority 3. Galaxy timeline (redo of SW_Legends_Galaxy_Timeline.md).** Rebuild the timeline from Wookieepedia Legends with one dated, cited row per event: wars, treaties, Temple moves, academy foundings, faction control of key worlds, and technology changes (lightsaber, blaster and shield eras), with conflicts listed and Disney-era material flagged. Keep the era headings that the parser reads (src/lore/parse.ts) or propose a format change. Game systems: the lore index (D-81), calendar and era checks (13-calendar-and-time.md), M8 timeline events and factions, D-213 era checks, character-creation era dates.
- **Priority 4. Character sheets, Eras 01–08, 09-B and 10–18 (redo of the other 17 SW_Characters_* files, one era per run, when that era's canon roster is built, D-155).** For the era, research every named Force user and major non-Force figure: dates, rank by year, Masters and apprentices, forms and powers named in the sources, alignment, species and homeworld, with per-entry citations and conflicts listed without picking. Name dark-side figures correctly for their era (D-311: no "Sith" for non-Sith darksiders between 1,000 BBY and 4 ABY). Game systems: canon rosters by era (D-155), canon NPC levels and alignment (npc-generation §5, alignment-m6.md), the lore index.

## Gaps (no file yet)

- **Yuuzhan Vong weapons and armour** (queued). Amphistaffs, thud bugs, razor bugs, coufees, vonduun crab armour (it resists lightsabers; D-239 uses it as saber-resistant), ooglith masquers, and how Jedi fought them. Priority 3 (M8 equipment), also used by the existing Yuuzhan Vong rules (D-192, D-224, D-239).
- **Species traits, lifespans and ageing.** 23-species.md: Docs/SWRPG lore/ has no species table; progression-numbers §11 and §16 need body-cap and lifespan tables for other species. Priority 3 (M8 species table).
- **Medicine, bacta, cybernetics and prosthetics.** health.md and the §15 notes (M8 cybernetics by quality tier, M6 Force loss from lost tissue) rest on design defaults and scattered character-sheet facts. Priority 3.
- **Economy, credits and prices by era.** The M8 items and credits spec (22-equipment-and-items.md) has no lore source for prices, wages or what a Master spends on a Padawan (D-295). Priority 3.
- **Factions, governments and renown by era.** 14-world-state-and-events.md and 24-legacy-renown-lineage.md: who controls which worlds when, faction relations, and how fame works in each era. Partly in the timeline. Priority 3.
- **Master–apprentice lineages and family legacy.** 24-legacy-renown-lineage.md has no lore file for teaching lineages or Force-sensitive families. Priority 3.
- **Planets, hyperspace routes and travel times.** M2 locations and M4 travel in time skips use no lore source. Priority 4.
- **Droids by era.** D-213's era minion kinds (war droids, B1s, droidekas) were checked against the timeline and character files only; no file covers droid models by era. Priority 3.

## Done

- **Jedi training, all eras:** SW_Jedi_Training_AllEras_Part1.md and Part2.md (2026-11-21; decisions D-296..D-307).
- **Sith training, all eras:** SW_Sith_Training_AllEras_Part1.md and Part2.md (2026-11-21; decisions D-308..D-318, D-320).
- **The dark side: fall, corruption and redemption, all eras** (was a gap; alignment-m6.md was written partly from memory): SW_DarkSide_Fall_Corruption_Redemption_Part1.md to Part3.md (2026-11-21). Audited against alignment-m6.md in docs-v2/testing/alignment-lore-audit.md (22 findings, report only).
- Also added in the same batch: Jedi Order ranks and Council, Jedi daily life, Sith academies, lightsabers and materials, weapons and armour.
