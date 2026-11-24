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
- [ ] **2. Species ages: separate "adult" and "prime" (D-401 [11]).**

  The age map has one maturity and one lifespan per species, linear between them (species.md §1). The Wookiee can't fit both the books' adult age of 18 and a prime at about 200 (D-399 [4]), so its maturity stays at the house default of 60. Add separate adult and prime ages, with the body-cap peak placed at the prime, and re-check Bowdaar (about 177 in 3,661, in his prime).
- [ ] **3. Species traits and bodies (lore batch 21, D-398; D-401 [12]).**

  Early access needs both this item and item 2 (D-405 [5]). The 33 species added in lore batch 21 have no traits. The clear size outliers have house-default body scales: Hutt 1.5, Talz 1.25, Houk 1.25, Jawa 0.6, Yoda's species 0.5; the rest are 1.0. Design the traits within species.md §3, using the "Game notes" resistances and needs in SW_Species_OldRepublic_Part3 as candidates, and set real body scales.
- [x] **4. Running the Hydian Way blockade (the Visz storyline; D-405 [5]).** *Built as one general system: D-469 (docs-v2/reports/m8-world-c.md; spec/blockades.md). Its numbers and the design notes' open questions wait for Jared's rulings.*

  The travel system refuses a routine trip to a Hydian Way world inside the blockade strip (Eriadu, Malastare), or along the Hydian Way through it, in 3,661–3,660, for anyone but Mandalorians and Imperials; the strip's other worlds take a ×1.5 detour (src/data/travel.config.ts BLOCKADE; D-405 [2], D-406). Running it is a story event: Hutt backing, the Mandalorian pickets (hail, warn, intercept), the risk, and the 3,660 breakthrough by Hylo Visz's smugglers and the Republic Navy (D-380 [4], [10]; SW_Mandalorians_GGW_Part1, Game notes; SW_NarShaddaa_HuttSpace_GGW_Part1). Design the run (stakes, checks, consequences) and tie it to item 1's 3,660 event.
- [ ] **5. Economy and prices (D-405 [5]).**

  Credits, prices and pay for the era, including the Coruscant food-price index of 3,661–3,660 (D-381 hook; numbers `invented`), Hutt debts and Exchange debt (D-385 hook) and bounty payouts. **Lore research due Monday;** design follows the research batch.
- [ ] **6. Medicine and bacta (D-405 [5]).**

  After the economy: kolto (Manaan) and bacta in this era, medcenters, prices and availability, building on the M5 healing rules (health.md: medical, bacta, Force healing).
- [ ] **7. Droids (D-405 [5]).**

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
- [ ] **9. Era rules for the Cold War years (timeline audit, D-408 [7]).**

  Every era rule but `places-and-populations` and `imperial-forces` ends by 3,653, because the M7 table was written for the war years. A campaign that crosses the Treaty loses the Coruscant, Nar Shaddaa, Tatooine, Jedi-life and Korriban rules. The Korriban rule ends in 3,654, though the Academy staff are placed to 3,644. Write the Cold War versions from the topical files (the Korriban, Coruscant and Nar Shaddaa Cold War sections), or extend the current ones where they still hold.
- [ ] **10. An officer archetype with command and staff work (Jared, D-427 [9]; folded into item 12, D-455).**

  Tactics main, Intelligence second, Charisma. Commanding in a battle earns tactics XP the way fighting earns form XP (from the battle's stakes and outcome); staff work (planning, logistics) is an activity for Intelligence and Tactics. Today officers use the soldier archetype, and no source but study grows tactics (calibration report §4).
- [ ] **11. Wartime postings and the Council's other roles (Jared, D-436 [12]).**

  Story-only for now: postings to the front (a Knight or Padawan sent to a war zone or attached to a fleet), and the Council's roles beyond the High Council seat (the Council of Reassignment's work, the Council of First Knowledge, the Reconciliation Council, wartime command of Jedi in the field). Revisit with the world events (items 8 and 9): a posting could follow a world event's front and set the routine and the fight schedule for its duration.
- [ ] **12. XP sources for the non-Force skills, and three new archetypes (Jared's design notes, 2026-11-23; D-455).**

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
  - **After building:** audit what trains Melee, Blaster and Stealth today, then re-measure the archetype paces and the canon NPC bands for Intelligence, Tactics, Charisma, Melee, Blaster and Stealth.
  - **Research queue:** which martial cultures taught close combat to outsiders in Legends, to whom and when (docs-v2/lore/RESEARCH_QUEUE.md).
