**Canonical (Jared, 2026-11-22):** this repo file collects the items handed to M8 (World: timeline events, factions, renown, equipment, the species table; architecture §15). Design changes are made here and logged in docs-v2/decisions.md.

# SWRPG M8 checklist: the world (the rest of early access)

Nov 22, 2026 · @Jared Wright

## How to use

Items arrive here when a decision hands them to M8. Each says where it came from, what exists now and what is open. Tick an item once it is built and tested.

## Items

- [x] **1. World events: the 3,661–3,660 chain, the Sacking and the Treaty (D-401 [7], D-405 [5]).** *Built: D-466, D-467 (docs-v2/reports/m8-world-a.md, m8-world-b.md). Two of the D-379 hooks have no event in the tag map: the Council debate is a start thread, and the surrender talk is not built.*

  M7 applies the blockade as standing state at the 3,661 start (the control table, the leaders, the timeline's state row and the seeds; D-400). Nothing yet fires the events as play crosses the date:
  - the Battle on the Hydian Way, with Hylo Visz's smugglers breaking the blockade (3,660, D-393 [9]);
  - the end of the Coruscant riots;
  - the Lesser's death and Artus Lok's accession (c. 3,660, D-393 [10]);
  - the Rim Campaign battles (Ord Radama won and lost, Ashas Ree, Serenno, Ziost and Korriban, c. 3,660);
  - and the D-379 Hydian Way hooks (Council debate, the Devaron strike, food riots, surrender talk, the 3,660 relief).

  Also the **Sacking of Coruscant** and the **Treaty of Coruscant** (3,653 BBY: the peace conference on Alderaan, the strike on the Jedi Temple, Angral's armada, two days of occupation, the Treaty's terms, the riots that follow; timeline slice Part 1, 3,653). The control table already changes on these dates (Coruscant's 3,653 span, Balmorra after 3,653); the events give the narrator the scene. Build them as scheduled world events (src/features/world), dated from the timeline slice, so a player can change them (the Legacy Change framework in spec 14).
- [x] **2. Species ages: separate "adult" and "prime" (D-401 [11]).** *Built: D-472 (spec/species.md section 1; docs-v2/reports/m8-species.md). Ruled: D-474 (Luke's gate split; training in real years).*

  The age map has one maturity and one lifespan per species, linear between them (species.md §1). The Wookiee can't fit both the books' adult age of 18 and a prime at about 200 (D-399 [4]), so its maturity stays at the house default of 60. Add separate adult and prime ages, with the body-cap peak placed at the prime, and re-check Bowdaar (about 177 in 3,661, in his prime).
- [x] **3. Species traits and bodies (lore batch 21, D-398; D-401 [12]).** *Built: D-473 (spec/species.md section 3a; docs-v2/reports/m8-species.md). Ruled: D-474 (size out of Strength and Agility).*

  Early access needs both this item and item 2 (D-405 [5]). The 33 species added in lore batch 21 have no traits. The clear size outliers have house-default body scales: Hutt 1.5, Talz 1.25, Houk 1.25, Jawa 0.6, Yoda's species 0.5; the rest are 1.0. Design the traits within species.md §3, using the "Game notes" resistances and needs in SW_Species_OldRepublic_Part3 as candidates, and set real body scales.
- [x] **4. Running the Hydian Way blockade (the Visz storyline; D-405 [5]).** *Built as one general system: D-469, D-470 (docs-v2/reports/m8-world-c.md, m8-world-c2.md; spec/blockades.md). Its numbers are accepted as invented starting numbers, to be revisited after playtests.*

  The travel system refuses a routine trip to a Hydian Way world inside the blockade strip (Eriadu, Malastare), or along the Hydian Way through it, in 3,661–3,660, for anyone but Mandalorians and Imperials; the strip's other worlds take a ×1.5 detour (src/data/travel.config.ts BLOCKADE; D-405 [2], D-406). Running it is a story event: Hutt backing, the Mandalorian pickets (hail, warn, intercept), the risk, and the 3,660 breakthrough by Hylo Visz's smugglers and the Republic Navy (D-380 [4], [10]; SW_Mandalorians_GGW_Part1, Game notes; SW_NarShaddaa_HuttSpace_GGW_Part1). Design the run (stakes, checks, consequences) and tie it to item 1's 3,660 event.
- [x] **5. Economy and prices (D-405 [5]).** *Built: D-510 (spec/economy.md; docs-v2/reports/m8-economy.md). Every number not on record is invented (the spec's section 11); ship running costs wait for item 13, medicine prices for item 6.*

  Credits, prices and pay for the era, including the Coruscant food-price index of 3,661–3,660 (D-381 hook; numbers `invented`), Hutt debts and Exchange debt (D-385 hook) and bounty payouts. **Lore research due Monday;** design follows the research batch.
- [x] **6. Medicine and bacta (D-405 [5]).** *Built: D-511 (spec/medicine.md; docs-v2/reports/m8-medicine.md). Every number not from lore is invented (the spec's section 12). Combat assigns wound depth once realistic damage is built.*

  After the economy: kolto (Manaan) and bacta in this era, medcenters, prices and availability, building on the M5 healing rules (health.md: medical, bacta, Force healing).
- [x] **7. Droids (D-405 [5]).** *Built: D-512 (spec/droids.md; docs-v2/reports/m8-droids.md). Every number not from lore is invented (the spec's section 11). The duel engine does not yet use droid systems for droid opponents; the astromech hooks wait for item 13, the Repair stand-in for item 12.*

  After medicine: droid models by era (the research queue's "Droids by era" gap; D-213's era minion kinds), companions, prices and their place in combat.
- [x] **8. Cold War world events, 3,653–3,640 (timeline audit, D-408 [6]).** *Built: D-467 (docs-v2/reports/m8-world-b.md). Janarus's two re-elections are one event (3,649), as in the tag map.*

  The control and leader tables now change on the Cold War's recorded dates (D-408 [2], [3]), but nothing gives the narrator the scene. Candidates from the timeline slice Part 2, as scheduled world events (with item 1):
  - Alderaan's secession and the Alderaan Civil War (after 3,653);
  - the Separatist War on Ord Mantell (after 3,653);
  - Satele Shan rediscovers Tython and becomes Grand Master (3,651);
  - the Senate shelves the Coruscant Temple, and the Order moves to Tython (3,650); the Tython Temple is finished (3,647);
  - Janarus's re-elections (3,649, 3,645);
  - the Taris Resettlement (3,648) and the Imperial invasion of Taris (3,642);
  - the Desolator crisis (3,643);
  - Balmorra freed (3,642), and the Maelstrom raid that frees Revan (3,642);
  - the Treaty's collapse in mid-3,641, and the invasion of Belsavis that frees the Dread Masters (3,641);
  - and, in 3,640: Corellia, Ilum, the Emperor's Voice, Janarus's death, and Saresh and Malcom taking office.
- [x] **9. Era rules for the Cold War years (timeline audit, D-408 [7]).** *Built: D-475 (src/data/eraRules.ts; docs-v2/reports/m8-item9.md). The gaps are in docs-v2/lore/RESEARCH_QUEUE.md; the Galactic War years are later work.*

  Every era rule but `places-and-populations` and `imperial-forces` ends by 3,653, because the M7 table was written for the war years. A campaign that crosses the Treaty loses the Coruscant, Nar Shaddaa, Tatooine, Jedi-life and Korriban rules. The Korriban rule ends in 3,654, though the Academy staff are placed to 3,644. Write the Cold War versions from the topical files (the Korriban, Coruscant and Nar Shaddaa Cold War sections), or extend the current ones where they still hold.
- [x] **10. An officer archetype with command and staff work (Jared, D-427 [9]; folded into item 12, D-455).** *Built with item 12: D-513 (spec/skills-m8.md; docs-v2/reports/m8-skills.md).*

  Tactics main, Intelligence second, Charisma. Commanding in a battle earns tactics XP the way fighting earns form XP (from the battle's stakes and outcome); staff work (planning, logistics) is an activity for Intelligence and Tactics. Today officers use the soldier archetype, and no source but study grows tactics (calibration report §4).
- [ ] **11. Wartime postings and the Council's other roles (Jared, D-436 [12]).**

  Story-only for now: postings to the front (a Knight or Padawan sent to a war zone or attached to a fleet), and the Council's roles beyond the High Council seat (the Council of Reassignment's work, the Council of First Knowledge, the Reconciliation Council, wartime command of Jedi in the field). Revisit with the world events (items 8 and 9): a posting could follow a world event's front and set the routine and the fight schedule for its duration.
- [x] **12. XP sources for the non-Force skills, and three new archetypes (Jared's design notes, 2026-11-23; D-455).** *Built: D-513 (spec/skills-m8.md; docs-v2/reports/m8-skills.md). Gunnery and Repair, XP from play, the new activities, melee styles, programmes, nine archetypes and the rank ladders. Not wired then: the fleet and ground battles' calls to commandXp and gunneryXp; wired since by D-517 (fleets) and D-522 (ground).*

  Design notes, not built yet. Every number is set and tagged when it is built. All XP comes through structured lines, never awarded by the narrator directly, and teachers multiply gains as they do everywhere else. Item 10 (the officer) is folded in here.
  - **Intelligence:** academic study (Archives, libraries, universities); staff work (planning, logistics, intelligence analysis); negotiations and political work (you learn from them). Anything that grants Tactics XP also grants a small Intelligence share.
  - **Tactics:**
    - commanding in battle, from the battle's stakes and outcome, as form XP comes from fighting;
    - studying historical campaigns and tactics;
    - discussing tactics at any stage of life. A Padawan reviewing a war report with their master, asking questions or making suggestions, learns from the master (the teacher multiplier applies); discussing with a peer gives less;
    - successful sequences in personal combat;
    - cultural understanding, but only at Intelligence 80+ (the Thrawn model: you have to be smart enough to link culture to tactics).
  - **Charisma:** every meaningful conversation gives some, on a curve low enough that everyone reaches a decent Charisma through ordinary social life. Persuasion gives a large amount on success and a small amount on failure. Training in politics, negotiation, diplomacy, rhetoric and the like gives more, so diplomats, senators and negotiators end up clearly higher.
  - **Melee (close-quarters combat):** CQC training on military paths; CQC in the Jedi and Sith curricula; learning from martial cultures with culture-specific teachers (the Echani and the Mandalorians are placeholders until sourced; research queue); field use in fights, as with the other combat skills.
  - **Stealth:** field use; stealth training as an activity; hunting.
  - **Blaster:** training droids and target practice; teachers for more effective training; field use.
  - **Archetypes:** add officer, senator/politician and scholar archetypes, so generated NPCs reflect these paths.
  - **Gunnery and Repair (Jared, D-506):** two new skills. Pilots train Gunnery alongside Piloting (Blaster stays personal arms); Repair as ruled 2026-11-23 (ships, mods, droids). Until they exist, ship combat (combat-scales.md) takes Piloting for a pilot's shots and Blaster for a turret gunner's.
  - **After building:** audit what trains Melee, Blaster and Stealth today, then re-measure the archetype paces and the canon NPC bands for Intelligence, Tactics, Charisma, Melee, Blaster and Stealth.
  - **Martial cultures (research done, D-484):** `Docs/SWRPG lore/SW_Martial_Cultures_AllEras_Part1-3.md`, inputs for the skills and the archetypes:
    - *Part 3's training tables* (sections 1 to 8): who trains, where, for how long, what is taught, and entry. Lengths the sources give: Raithal one year, Royal Guard one year, Carida stormtrooper programme two (full course four), Prefsbelt IV three, flight school on Carida two, clone regulars ten years of accelerated life, commandos close to ten; *verd'goten* ages 8 to 13; hrrtayyk about 12.
    - *Who teaches outsiders:* Echani (military versions only; the full art stays in the castes, ruled), Teräs Käsi (a Follower of Palawa or one of their graduates), Stava (after 9 ABY, ruled), K'tara (Alliance SpecForces), Hijkata (Senate Guard), Mandalorians (open membership).
    - *[game-derived] lines* (Matukai powers, Teräs Käsi meditation healing and strike power, K'thri techniques, Gand moves, prices and weights): ideas for mechanics only. They are not lore and never reach the narrator; any number is set here, when the item is built.
- [x] **13. Ships and space combat (Jared, 2026-11-24; D-475).** *Part 1 built: D-517 (spec/ship-battles.md; reports/m8-ship-battles.md): dogfights and fleet battles in play, the tactics menu, boarding, evacuation, narration, saved state, events and XP; the blockade's force-through and the Coruscant stand-in run as ship battles. Part 2 built: D-519 (spec/ship-life.md; reports/m8-ship-life.md): ships as data and ownership, crew wages, travel and passage, customs and scans, modifications, shipyard repairs, wear and breakdowns, ship renown, the Possessions and Tactics tabs, tactics as knowledge; with the m8-ship-battles review fixes (D-518).*

  Build from the design notes (docs-v2/spec/m8-design-notes.md: ships, space tactics and fleet battles; lore: SW_Starships_Classes.md, SW_Space_Tactics.md, SW_Ship_Shields_Weapons_Part1-2.md, its decisions ruled: D-505). The rolls, shields, damage, dogfights and fleet battles are built as pure engine with ships as data (combat-scales.md, D-505); what is left is in its section 7, with travel, modifications, customs and ownership. Comes after items 5 to 7 in the build order (economy sets ship prices; droids cover astromechs and crews). It replaces the stopgaps: the blockade's force-through approach and the Coruscant ground-fight stand-in for breaking the occupying navy.
- [x] **14. Ground command (Jared, 2026-11-24; D-475, D-476).** *Built: D-522 (spec/ground-command.md; reports/m8-ground.md): the planning scene, the map with its terrain key (known sites from the lore), scouting, the plan (objectives, a known manoeuvre, sectors, support, a reserve, two contingencies), phases on the D-505 engine, plan changes by command-post contact, Jedi and Sith at the front, battle meditation, the player's own fight, let it play out, saves mid-battle, results, command and field XP. With the event schema's split into parts (D-520) and the m8-ship-life review fixes (D-521). Wartime postings (item 11) stay story-only; spec section 10 says where a posting hooks in.*

  Guiding troops as a general, with locations and objectives, like the fleet battles. Designed 2026-11-24; build after item 13: docs-v2/spec/m8-design-notes.md, "Ground command (checklist item 14)". The sector rolls, matchups, breakthroughs and morale are built as pure engine (combat-scales.md, D-505); the plan's scene, the map, scouting, the reserve and contingencies are not. Wartime postings (item 11) stay story-only until it exists.
- [ ] **15. Calibration queue (Jared, D-507).** *(Item 15; "Starting traits and formative events" is item 16, as recorded in D-512 and D-513.)*

  Not to build now; each waits for its own ruling.
  - **A self-taught pace:** a canon student recorded as cut off from any order (no Temple, no Academy, no master) trains more slowly than the Temple pace. A master's death alone does not count: the Order reassigns the Padawan (D-507).
  - **Midi-chlorian counts as one curve (Jared, 26 Nov 2026; D-322 amended):** consider letting the count set both the Force ceiling and the Force learning pace on one smooth curve, replacing the separate potential tier. Fixed: Anakin 27,700 (the maximum), the average Jedi 10,000, the minimum 7,000. Yoda stays under 20,000 (*The Phantom Menace*: Anakin's "over 20,000" is higher than Yoda's); suggested Yoda about 19,800 and Palpatine just below him (about 19,000). The "Anakin twice the Emperor" pool ratio is dropped as a hard rule (a Lucas statement, not Legends); Vader at about 80% of the Emperor stays (Legends). The curve must be flat at the top: about 19,000 reaches about 130, and Luke's 27,700 reaches his 138.
  - **Yoda's Force Control 122 -> 128 (Jared):** level with the Emperor; Sidious keeps the edge in Force Output.
  - **A Rule of Two bonus (Jared):** Bane's line (Bane and Zannah down to Plagueis, Sidious and his apprentices, about 1,000 BBY-4 ABY) learns Force skills faster (one master, one apprentice, all Sith knowledge open to study), with a small capped step per generation, tuned so Palpatine reaches his sheets on his count. A player apprenticed to a Bane-line master gets it too.
  - **A Force Output lean (Jared):** generated dark-side lines lean toward Force Output, Jedi lines toward Control and Sense. A default lean only, never a cap or a rebalance: Output still grows from use (a Jedi who fights with Force powers grows it), and canon sheets win.
  - **Oteg:** his generated Force Control is 115.7, above the apex line (110): a long life pushes past apex (m8-skills report section 7).
- [x] **16. Starting traits and formative events (Jared, 25 Nov 2026).** *Built: D-515 (spec/traits.md; docs-v2/reports/m8-traits.md), with the m8-skills review fixes (D-514). The alignment pressures wait for M6; the canon trait assignments are for Jared's review.*

  Designed in the design notes ("Starting traits and formative events"); build after item 12.
- [ ] **17. Distances in fights (future work, not now; Jared, 28 Nov 2026; D-585).** *Backlog.*

  Fights have no distance or range: every engaged opponent is equally close. Future: fights track distance and range (closing, melee reach, firing range, cover lines), so "the nearest shooter" and range-based choices become possible (a redirect at the nearest, a blade that must close on a gunman first, range modifiers for blasters). Until then the redirect (D-583) and its Deflect back button (D-585) default to the target when it shoots, else the first engaged shooter.
