# Lore index

Every lore file in `Docs/SWRPG lore/`, the canon source of truth for story facts (CLAUDE.md Golden Rule 3). Canon here means Star Wars Legends only. The files stay in `Docs/SWRPG lore/`; this index and the research queue (`RESEARCH_QUEUE.md`, next to this file: origins, citations, redo briefs, gaps) live in `docs-v2/lore/`, because nothing new is written into `Docs/`.

Game-mechanics sections in these files (Game notes, tiers, numbers) are suggestions that docs-v2 specs may override; every override is logged in `docs-v2/decisions.md`. The runtime lore index for the narrator (D-81, `scripts/build-lore.ts`) reads only the character files, the timeline (the old file and its slices), the species files (sent only when a species is named) and the planets files (a world when the scene is there or it is named; a route when named).

Last updated 2026-11-23 (D-465: droid classes; the galaxy timeline corrected against Legends Wookieepedia; the world-event tag maps and the M8 design notes listed; Nexus of Power treated as not Legends). Before that, 2026-11-23 (the economy set, Sith academies, weapon classes and named gear, starship classes and space tactics; the Jedi Path ruling, D-463; the economy rulings, D-464). Earlier: 2026-11-22 (the Nov 22 lore update, D-439). Every lore file holds plain dated facts unless its scope names an era window (CLAUDE.md hard rule, D-438).

## Character sheets (one file per era)

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Characters_01_DawnOfTheJedi.md` | Era 01: Dawn of the Jedi, the Je'daii on Tython (36,453–25,783 BBY) |
| `Docs/SWRPG lore/SW_Characters_02_OldRepublicFounding.md` | Era 02: Old Republic founding and first conflicts (c. 28,000–5,100 BBY) |
| `Docs/SWRPG lore/SW_Characters_03_GoldenAgeSith_GreatHyperspaceWar.md` | Era 03: Golden Age of the Sith and the Great Hyperspace War (c. 5,100–4,990 BBY) |
| `Docs/SWRPG lore/SW_Characters_04-05_GreatSithWar.md` | Eras 04/05: the Sith interwar and the Great Sith War (c. 4,400–3,996 BBY) |
| `Docs/SWRPG lore/SW_Characters_06_MandalorianWars.md` | Era 06: the Mandalorian Wars and the rise of Revan (c. 3,976–3,960 BBY) |
| `Docs/SWRPG lore/SW_Characters_07_JediCivilWar.md` | Era 07: the Jedi Civil War (c. 3,959–3,956 BBY) |
| `Docs/SWRPG lore/SW_Characters_08_DarkWars_SithTriumvirate.md` | Era 08: the Dark Wars and the Sith Triumvirate (c. 3,955–3,950 BBY) |
| `Docs/SWRPG lore/OLD_SW_Characters_09_GreatGalacticWar_ColdWar.md` | **Superseded** by the SW_Characters_09_GGW_ColdWar files below (lore batch 19); not read by the lore index. Was: Era 09: the Great Galactic War, Cold War and Galactic War (c. 3,681–3,636 BBY); source of the built canon roster |
| `Docs/SWRPG lore/SW_Characters_09B_EternalEmpire_Alliance.md` | Era 09-B: the Eternal Empire, the Alliance and the later SWTOR era (c. 3,637–3,620 BBY and later) |
| `Docs/SWRPG lore/SW_Characters_10_NewSithWars_DarthBane.md` | Era 10: the New Sith Wars and the rise of Darth Bane (c. 2,000–990 BBY) |
| `Docs/SWRPG lore/SW_Characters_11_RepublicEra_RiseOfEmpire.md` | Era 11: the Republic era and the rise of the Empire (c. 990–22 BBY) |
| `Docs/SWRPG lore/SW_Characters_12_CloneWars.md` | Era 12: the Clone Wars (c. 22–19 BBY) |
| `Docs/SWRPG lore/SW_Characters_13_DarkTimes_GalacticCivilWar.md` | Era 13: the Dark Times and the Galactic Civil War (c. 19 BBY–4 ABY) |
| `Docs/SWRPG lore/SW_Characters_14_NewRepublic_NewJediOrder.md` | Era 14: the New Republic and the rise of the New Jedi Order (c. 4–25 ABY) |
| `Docs/SWRPG lore/SW_Characters_15_NewJediOrder_YuuzhanVongWar.md` | Era 15: the New Jedi Order and the Yuuzhan Vong War (c. 25–29 ABY) |
| `Docs/SWRPG lore/SW_Characters_16_LegacyOfTheForce.md` | Era 16: Legacy of the Force and the Second Galactic Civil War (c. 40 ABY) |
| `Docs/SWRPG lore/SW_Characters_17_FateOfTheJedi.md` | Era 17: Fate of the Jedi (c. 43–44 ABY) |
| `Docs/SWRPG lore/SW_Characters_18_LegacyEra.md` | Era 18: the Legacy era (c. 130–139 ABY) |
| `Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Index.md` | Era 09 (redo): master index of 183 figures with their 3661 BBY status (source of the built canon roster) |
| `Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Part1.md` | Era 09 (redo), Part 1: Jedi and light-side Force users (39) |
| `Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Part2.md` | Era 09 (redo), Part 2: Sith and dark-side users (56) |
| `Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Part3a.md` | Era 09 (redo), Part 3a: Republic non-Force figures (39) |
| `Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Part3b.md` | Era 09 (redo), Part 3b: Imperial non-Force figures, Mandalorians, underworld (49) |

## Galaxy and timeline

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Legends_Galaxy_Timeline.md` | Complete galaxy timeline: scripted events and NPC deployment by era, all eras except 3,700–3,600 BBY (in the slice files below, lore batch 20). Corrected against Legends Wookieepedia on 23 Nov 2026 (D-465); rows marked "not re-checked" still need verifying |
| `Docs/SWRPG lore/SW_Timeline_3700_3600BBY_Part1.md` | Galaxy timeline, 3,700–3,653 BBY (replaces the old timeline's rows for these years; read by the lore index) |
| `Docs/SWRPG lore/SW_Timeline_3700_3600BBY_Part2.md` | Galaxy timeline, 3,653 to c. 3,622 BBY (read by the lore index) |
| `Docs/SWRPG lore/SW_Timeline_3700_3600BBY_Part3.md` | Galaxy timeline slice 1, Part 3: checks, conflicts and decisions (no entries) |

## The Force and lightsaber combat

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md` | Force abilities master list (13 families), lightsaber forms, Form Rules (M6) and Shatterpoint. **Force powers sections superseded** by the six SW_Force_Powers files below (D-338); **lightsaber forms sections corrected** by the forms catalog check (lore batch 10) and retired as a source: the SW_Lightsaber_* set below is the forms source of truth |
| `Docs/SWRPG lore/SW_Force_Powers_Part1a.md` | Force powers: shared index for Parts 1–3, scale anchors, Control powers |
| `Docs/SWRPG lore/SW_Force_Powers_Part1b.md` | Force powers: Sense and universal powers (Force-bond, oneness, harmony, battle meditation) |
| `Docs/SWRPG lore/SW_Force_Powers_Part2a.md` | Force powers: Alter (telekinesis, mind influence, environment), Alter scale anchors |
| `Docs/SWRPG lore/SW_Force_Powers_Part2b.md` | Force powers: dark side (lightning, drain and spirit powers, destructive powers, Sith sorcery and alchemy) |
| `Docs/SWRPG lore/SW_Force_Powers_Part3a.md` | Force powers: rare, lost, species and order-specific techniques |
| `Docs/SWRPG lore/SW_Force_Powers_Part3b.md` | Force powers: catalog check of force-catalog-m6.md (design reference; applied by D-338 to D-349) |
| `Docs/SWRPG lore/SW_Lightsaber_Index_AllEras.md` | Lightsaber combat set: file list, continuity checks, the 34 combined decisions, pointer to the forms catalog check |
| `Docs/SWRPG lore/SW_Lightsaber_Forms_AllEras_Part1.md` | Forms I–VII, Shien variants, Juyo/Vaapad and dark-side risk, practitioners, sourced matchups |
| `Docs/SWRPG lore/SW_Lightsaber_Forms_AllEras_Part2.md` | Sokan, Tràkata, Jar'Kai, Dun Möch, Form Zero, Su ma, Lus-ma, Trispzest, Juyo-Kos, mounted and telekinetic combat, NJO styles, Praetoria styles |
| `Docs/SWRPG lore/SW_Lightsaber_SubgroupStyles_AllEras.md` | Teräs Käsi, Echani, Sith swords, Force-imbued swords, Mandalorian methods, Jedi hunters, Matukai, Jensaarai, Zeison Sha, Imperial Knights |
| `Docs/SWRPG lore/SW_Lightsaber_Training_AllEras.md` | Lightsaber training progression from Tython to the Legacy era |
| `Docs/SWRPG lore/SW_Lightsaber_WeaponVariants_AllEras.md` | Hilt and blade variants, pre-saber and saber-capable weapons |
| `Docs/SWRPG lore/SW_Lightsaber_CombatTechniques_AllEras.md` | Zones, rings, marks of contact, stances, deflection, throws and telekinesis, mobility, multiple opponents, anti-Jedi tactics, resistant materials |
| `Docs/SWRPG lore/SW_Lightsaber_Duels_AllEras.md` | Sourced duelist rankings and anchor duels by era |
| `Docs/SWRPG lore/SW_Lightsaber_Combat_Marks_Zones_Techniques.md` | Marks of contact, target zones, stances and techniques of lightsaber combat |
| `Docs/SWRPG lore/SW_Lightsaber_Forms_Catalog_Check_Part1.md` | Lightsaber forms catalog check, Part 1: verdicts on the v3 lightsaber content (applied in lore batch 10) |
| `Docs/SWRPG lore/SW_Lightsaber_Forms_Catalog_Check_Part2.md` | Lightsaber forms catalog check, Part 2: missing items, practitioner check, the 16 decisions |

## Jedi Order

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Jedi_Order_Ranks_Council_OldRepublic.md` | Jedi ranks from Initiate to Grand Master, honorary titles, the High Council and the Tython Temple (c. 3,700–3,600 BBY) |
| `Docs/SWRPG lore/SW_Jedi_Daily_Life_Training_OldRepublic.md` | Jedi daily life and training: the *Jedi Path* timetable, clans, Initiate Trials, Padawan life, the Service Corps (c. 3,700–3,600 BBY, with general material) |
| `Docs/SWRPG lore/SW_Jedi_Training_AllEras_Part1.md` | Jedi training and organization from the Je'daii to the Ruusan Reformation, plus the Corellian Jedi and the Baran Do (to 1,000 BBY) |
| `Docs/SWRPG lore/SW_Jedi_Training_AllEras_Part2.md` | Jedi training and organization from the late Republic to the Legacy era, plus the Matukai, Antarian Rangers and Jensaarai (1,000 BBY onward) |
| `Docs/SWRPG lore/SW_Jedi_Ranks_Councils_Roles_AllEras_Part1.md` | Jedi ranks, councils and roles, all eras, Part 1: to 1000 BBY (extends the Old Republic ranks file) |
| `Docs/SWRPG lore/SW_Jedi_Ranks_Councils_Roles_AllEras_Part2.md` | Jedi ranks, councils and roles, all eras, Part 2: 1000 BBY to the Legacy era |
| `Docs/SWRPG lore/SW_Jedi_Temple_Life_GGW_Part1.md` | Jedi life at the Coruscant Temple in the Great Galactic War (3681–3653 BBY, focus 3661 BBY) |

**The Jedi Path ruling (D-463, Jared; replaces the narrower lore-batch-13 framing of D-378 [1], "post-Ruusan details as later-era defaults"):** *The Jedi Path* is the baseline curriculum for the academy-based Jedi Order in any era: what is taught (the Code and the Three Pillars, Force studies, classroom subjects, meditation, courses in Forms I–VI). Known era differences override it:
- **Entry ages:** from infancy is post-Ruusan; earlier eras take teens or twenties.
- **Strictness:** "progress or leave" and one Master, one Padawan are post-Ruusan; earlier Masters could have several students.
- **The Initiate Trials' form:** pre-Ruusan, lightsaber construction is the second test; on Dantooine, facing the dark side.
- **No academy stage:** the Je'daii, the early Order and the New Sith Wars.
- **Lightsaber forms:** the Initiate survey covers the Forms I–VI that exist at the date (each form's earliest attested date, SW_Lightsaber_Forms_AllEras_Part1).

## Sith and other dark-side orders

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Sith_Academies_Training_OldRepublic.md` | Imperial Sith academies and training (c. 3,681–3,636 BBY), compared with Jedi Civil War Korriban and the Brotherhood of Darkness |
| `Docs/SWRPG lore/SW_Sith_Training_AllEras_Part1.md` | Sith training and organization from the ancient Sith Empire to the Brotherhood of Darkness (to 1,000 BBY) |
| `Docs/SWRPG lore/SW_Sith_Training_AllEras_Part2.md` | Sith training and organization from the Rule of Two to the One Sith, and the non-Sith darksiders (1,000 BBY onward) |
| `Docs/SWRPG lore/SW_Korriban_Academy_Part1.md` | Korriban Academy, Part 1: history, staff, acolytes, trials, graduation (3681–3640 BBY) |
| `Docs/SWRPG lore/SW_Korriban_Academy_Part2.md` | Korriban Academy, Part 2: layout, dangers, daily life, other eras, timeline |
| `Docs/SWRPG lore/SW_Sith_Academies_AllEras.md` | Every Sith academy on record and each Sith order's training methods, as dated facts (the general academy method, the Blademaster's role); companion to the Old Republic academy and Korriban files |

## Force potential

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Midichlorians_Force_Potential.md` | Midi-chlorian counts and Force potential in Legends: measurement, named counts, thresholds, inheritance, potential versus skill, losing potential, late awakening (revision 2) |
| `Docs/SWRPG lore/SW_Lucas_Statements_Force_Potential.md` | George Lucas's statements on Force potential, Vader's power, midi-chlorians, balance and the dark side. **Behind-the-scenes material, not in-universe lore:** it informs design numbers and never overrides Legends |

## The dark side

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_DarkSide_Fall_Corruption_Redemption_Part1.md` | The dark side to 1,000 BBY: how falling works (Shim's Four Stages), falls, redemptions, physical corruption, power, madness, dark places and gray paths |
| `Docs/SWRPG lore/SW_DarkSide_Fall_Corruption_Redemption_Part2.md` | The dark side 1,000 BBY–4 ABY: the same eight sections (Anakin, Dooku, Vos, Vaapad, Mustafar, the Potentium) |
| `Docs/SWRPG lore/SW_DarkSide_Fall_Corruption_Redemption_Part3.md` | The dark side from 4 ABY: the same eight sections (Luke on Byss, Kyp, Caedus, Cade, Force psychosis) |

## Equipment

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Lightsabers_Crystals_Materials_AllEras.md` | Lightsaber construction, blade colours, hilt variants and lightsaber-resistant materials, all eras (its crystal table is now a pointer to SW_Lightsaber_Crystals, D-439) |
| `Docs/SWRPG lore/SW_Lightsaber_Crystals.md` | Lightsaber crystals: one dated catalog of natural, synthetic and unique crystals with sources, effects and dated limits; the single source of truth for crystal types (game data: src/data/crystals.ts) |
| `Docs/SWRPG lore/SW_Kolto_Bacta.md` | Kolto and bacta: sources, uses, kolto's undated decline, bacta known from c. 4100 BBY |
| `Docs/SWRPG lore/SW_Weapons_Armor_AllEras.md` | Non-lightsaber weapons, armour, personal energy shields and anti-Jedi gear, all eras (focus on the Old Republic and Clone Wars) |
| `Docs/SWRPG lore/SW_Weapons_Classes_AllEras.md` | Weapon and armour classes, all eras, from the 84 class pages of the sorted list's Layer 1; adds the classes the older weapons file lacks (numbers are game stats, for scale) |
| `Docs/SWRPG lore/SW_Weapons_Armor_Named.md` | Named weapons and armour from Old Republic sources (Mandalorian, Echani, Krath, Arkanian, Zabrak, Cathar items; about 150 pages), dated by their facts |
| `Docs/SWRPG lore/SW_Droids_Classes.md` | Droids: the five classes, control (restraining bolts, memory wipes), droid rights, the Great Droid Revolution, and Old Republic droid models by affiliation and purpose (prices are game stats) |
| `Docs/SWRPG lore/SW_YuuzhanVong_Gear_Index.md` | Yuuzhan Vong personal gear: index of the three parts |
| `Docs/SWRPG lore/SW_YuuzhanVong_Gear_Part1.md` | Yuuzhan Vong gear, Part 1: living weapons and armour |
| `Docs/SWRPG lore/SW_YuuzhanVong_Gear_Part2.md` | Yuuzhan Vong gear, Part 2: biots, tools, implants, the Embrace of Pain, counter-tech |
| `Docs/SWRPG lore/SW_YuuzhanVong_Gear_Part3.md` | Yuuzhan Vong gear, Part 3: the Force and the Vong, Vongsense, availability, decisions |

## Starships and space combat

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Starships_Classes.md` | Starship types and classes from Old Republic sources: 292 of 1,814 Legends class articles (those in an Old Republic–era work) |
| `Docs/SWRPG lore/SW_Space_Tactics.md` | Starfighter and naval tactics: general, reusable methods (mostly *The Rebel Alliance Sourcebook*), dated where the lore dates them |

## Economy

Researched 23 Nov 2026. Source tiers on every line: in-universe (tier 1); game stat with game and date (tier 2); [gray] FFG to early 2016 (rule 7); [canon] gap-fill (tier 3, this topic only, in its own file). D-464 (Jared): lines sourced only to *Endless Vigil* (2016) and the [gray] *Nexus of Power* rows are under each file's Not used; CanonGapFill's 12 broken rows are deleted. The economy rulings are in D-464.

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Economy_Index.md` | Index of the economy set: files, source tiers, cross-references |
| `Docs/SWRPG lore/SW_Economy_Currencies.md` | The credit and its names by era, aurodium, wartime and local currencies, Sith Empire currency, Hutt coins, scrip, exchange rates |
| `Docs/SWRPG lore/SW_Economy_Wages_Bounties.md` | Wages, military pay, mercenary rates, bounties, guild and licence fees, smuggler cuts, broker fees, Jedi funding |
| `Docs/SWRPG lore/SW_Economy_Institutions_Debt.md` | Taxes and tariffs, banks (Aargau, the Banking Clan), corporations and guilds, debt and loan sharks, the Exchange and Hutt Cartel, smuggling, black markets, slavery, the bacta trade |
| `Docs/SWRPG lore/SW_Economy_Events.md` | Dated economic events and their effects on prices, Old Republic to 40 ABY |
| `Docs/SWRPG lore/SW_Economy_Prices_Goods.md` | Tier 1 prices: food and drink, clothing, lodging, fares, medical care, information and forgeries, luxury goods, slaves (historical record) |
| `Docs/SWRPG lore/SW_Economy_Prices_Ships_Weapons_Droids.md` | Tier 1 prices: ships and running costs, weapons, armour, droids; in-universe vs game-stat conflicts |
| `Docs/SWRPG lore/SW_Economy_GamePriceLists_Part1.md` … `Part9.md` | Tier 2 game-stat prices and FFG [gray]: Parts 1–8 ships, vehicles, weapons, armour, droids, equipment; Part 9 goods and services, the full source list and the main Not used list |
| `Docs/SWRPG lore/SW_Economy_CanonGapFill.md` | Tier 3 [canon] gap-fill prices (items with a Legends page but no Legends price); Canon figures that contradict Legends are under Not used |

## Design data built on the lore (specs, not lore files)

| Path | Scope |
|---|---|
| `docs-v2/spec/world-event-tags-draft.md` | World event tag map, 3661–3640 BBY: facts from the 3700–3600 BBY timeline slices, tags as design calls (reviewed by Jared; rulings in section 6) |
| `docs-v2/spec/world-event-tags-1000BBY-4ABY-draft.md` | World event tag map, 1000 BBY–4 ABY (rulings in section 8; PP-0 alternatives open; rows marked LF come from the galaxy timeline and are not re-checked) |
| `docs-v2/spec/m8-design-notes.md` | M8 design notes (exported from Claude Docs, revision 40; the Claude Docs version is the working copy) |

## Research lists (not lore files)

| Path | Scope |
|---|---|
| `docs-v2/lore/SW_Weapons_Armor_CategoryIndex.md` | Weapons and armour: the Legends category index (the Weapons and Armor category trees), the full link reference |
| `docs-v2/lore/SW_Weapons_Armor_Sorted.md` | Weapons and armour: the sorted research worklist (4,482 Legends articles in priority layers); source of the weapon classes and named gear files |

## Places, Force sites and nexuses

Plain dated facts (D-438); the game resolves each place's state from the date.

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Force_Nexus_Vergence.md` | Force nexuses, vergences and wounds in the Force: the dated nexus sites and their leanings (Tython, Korriban, Dromund Kaas, Malachor V, Dagobah's cave, the Coruscant spire, Ilum, Eedit and later sites) |
| `Docs/SWRPG lore/SW_Malachor_V.md` | Malachor V: the Sith world and the Trayus Academy, the 3960 BBY wound, destruction in 3951 BBY, the wreckage field surveyed by 3640 BBY |
| `Docs/SWRPG lore/SW_Tython.md` | Tython: the Je'daii, the cataclysm of 25,783 BBY, the lost centuries, the 3651 BBY rediscovery and the Order's seat, Kalikori (an illegal Twi'lek settlement) |
| `Docs/SWRPG lore/SW_Korriban_Planet.md` | Korriban the planet: the Valley of the Dark Lords, its abandonments and reclamations, the Zakuul bombardment (c. 3636 BBY) |
| `Docs/SWRPG lore/SW_Dromund_Kaas_History.md` | Dromund Kaas after 3653 BBY (explicitly era-scoped): the Cold War capital, the 3640 attack, Empress Acina's blockaded vassal state under Zakuul (c. 3636–3631 BBY); replaces SW_Dromund_Kaas_After3653 |
| `Docs/SWRPG lore/SW_Ossus.md` | Ossus: the Jedi library world, the Cron Cluster supernova (3996 BBY), the Ysanna, Gnost-Dural's colony after 3636 BBY and the 3628 BBY invasion |
| `Docs/SWRPG lore/SW_Dagobah.md` | Dagobah and the Dark Side Cave: the 700 BBY duel that made the cave a dark nexus, Yoda's exile |
| `Docs/SWRPG lore/SW_Ilum_Temple_CrystalCaves.md` | Ilum: the Jedi Temple and the Crystal Caves (the nexus), dated control and access |
| `Docs/SWRPG lore/SW_Temple_of_Eedit.md` | The Temple of Eedit on Devaron: a light-associated vergence site (founding date unclear) |

## Force practice and Force objects

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Meditation.md` | Meditation, Jedi and Sith: methods, chambers, moving and healing meditation, meditation spheres |
| `Docs/SWRPG lore/SW_Holocrons.md` | Holocrons: how they work, gatekeepers, Sith holocron making, and one dated catalog of named holocrons (game data: src/data/holocrons.ts) |

## Force traditions

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Force_Traditions_AllEras_Part1.md` | Force traditions, Part 1: Dai Bendu to the Corellian Jedi (Baran Do, Aing-Tii, Luka Sene, Ysanna, Voss Mystics, Rhand, Paladins and others) |
| `Docs/SWRPG lore/SW_Force_Traditions_AllEras_Part2.md` | Force traditions, Part 2: Dathomir to the Imperial Knights, plus the who-exists-in-each-era narrator table for both parts |

## Old Republic era setting (SWTOR, the default start)

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_SWTOR_Era_Power_Structures_Part1.md` | SWTOR era, Part 1: the Sith Empire (Emperor, Dark Council and Spheres, ministries, Intelligence, Kaggath, military ranks) |
| `Docs/SWRPG lore/SW_SWTOR_Era_Power_Structures_Part2.md` | SWTOR era, Part 2: the Republic (Chancellors, Senate, military, SIS, Jedi and government), full timeline for both sides |
| `Docs/SWRPG lore/SW_Great_Galactic_War_Part1.md` | The Great Galactic War, Part 1: 3681–3667 BBY |
| `Docs/SWRPG lore/SW_Great_Galactic_War_Part2.md` | The Great Galactic War, Part 2: 3666–3660 BBY (the default start year) |
| `Docs/SWRPG lore/SW_Great_Galactic_War_Part3.md` | The Great Galactic War, Part 3: 3659–3653 BBY, the Sacking and the treaty, plus the who-was-where NPC table |
| `Docs/SWRPG lore/SW_Coruscant_Jedi_Temple_OldRepublic_Part1.md` | Coruscant, Part 1: the Jedi Temple and other Jedi sites, c. 3700–3653 BBY |
| `Docs/SWRPG lore/SW_Coruscant_Jedi_Temple_OldRepublic_Part2.md` | Coruscant, Part 2: the city, law, crime, NPCs and the location table, c. 3700–3653 BBY |
| `Docs/SWRPG lore/SW_Dromund_Kaas_KaasCity_OldRepublic_Part1.md` | Dromund Kaas, Part 1: the planet, Kaas City, the Citadel, the Dark Temple, location table |
| `Docs/SWRPG lore/SW_Dromund_Kaas_KaasCity_OldRepublic_Part2.md` | Dromund Kaas, Part 2: daily life, other Imperial worlds, NPCs |
| `Docs/SWRPG lore/SW_Coruscant_City_GGW_Part1.md` | Coruscant the city in the Great Galactic War (focus 3661 BBY): riots, blockade, Senate, security, underworld |
| `Docs/SWRPG lore/SW_Mandalorians_GGW_Part1.md` | The Mandalorians in the Great Galactic War: the Lesser, the clans, the blockade, the schism, culture |
| `Docs/SWRPG lore/SW_NarShaddaa_HuttSpace_GGW_Part1.md` | Nar Shaddaa and Hutt Space in the Great Galactic War: the Cartel, the treaty, the underworld |
| `Docs/SWRPG lore/SW_Republic_Military_GGW_Part1.md` | The Republic Military in the Great Galactic War: command, Army, Special Forces, Navy, SIS, ranks and medals |
| `Docs/SWRPG lore/SW_Imperial_Military_Intelligence_GGW_Part1.md` | The Imperial Military and Imperial Intelligence in the Great Galactic War: command, ranks, ships, Watchers and Fixers |

## Species

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Species_OldRepublic_Part1.md` | Old Republic species, Part 1: Humans, Sith Purebloods and 18 core species |
| `Docs/SWRPG lore/SW_Species_OldRepublic_Part2.md` | Old Republic species, Part 2: 25 more species; cyborgs, Zakuulans, rakghouls |
| `Docs/SWRPG lore/SW_Species_OldRepublic_Part3.md` | Old Republic species, Part 3: comparison, ageing, conflicts, decisions (no entries) |

## Planets, routes and travel

| Path | Scope |
|---|---|
| `Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part1.md` | Planets and travel, Part 1: the galaxy in 3661, master table, full entries (Alderaan to Tython) |
| `Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part2.md` | Planets and travel, Part 2: Voss, Zakuul, Ziost; thin entries Aderalis to Kalee |
| `Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part3.md` | Planets and travel, Part 3: thin entries Kant to Umbara |
| `Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part4.md` | Planets and travel, Part 4: thin entries to Zosha, mention-only index, routes begin |
| `Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part5.md` | Planets and travel, Part 5: routes, travel, places timeline, conflicts |
| `Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part6.md` | Planets and travel, Part 6: sources, checklist, decisions (no entries) |
