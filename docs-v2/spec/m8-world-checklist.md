**Canonical (Jared, 2026-11-22):** this repo file collects the items handed to M8 (World: timeline events, factions, renown, equipment, the species table; architecture §15). Design changes are made here and logged in docs-v2/decisions.md.

# SWRPG M8 checklist: the world (the rest of early access)

Nov 22, 2026 · @Jared Wright

## How to use

Items arrive here when a decision hands them to M8. Each says where it came from, what exists now and what is open. Tick an item once it is built and tested.

## Items

- [ ] **1. World events: the 3,661–3,660 chain, the Sacking and the Treaty (D-401 [7], D-405 [5]).**

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
- [ ] **4. Running the Hydian Way blockade (the Visz storyline; D-405 [5]).**

  The travel system refuses a routine trip across the blockaded corridor (Devaron to the Minos Cluster, 3,661–3,660) for anyone but Mandalorians and Imperials (src/data/travel.config.ts BLOCKADE; D-405 [2]). Running it is a story event: Hutt backing, the Mandalorian pickets (hail, warn, intercept), the risk, and the 3,660 breakthrough by Hylo Visz's smugglers and the Republic Navy (D-380 [4], [10]; SW_Mandalorians_GGW_Part1, Game notes; SW_NarShaddaa_HuttSpace_GGW_Part1). Design the run (stakes, checks, consequences) and tie it to item 1's 3,660 event.
- [ ] **5. Economy and prices (D-405 [5]).**

  Credits, prices and pay for the era, including the Coruscant food-price index of 3,661–3,660 (D-381 hook; numbers `invented`), Hutt debts and Exchange debt (D-385 hook) and bounty payouts. **Lore research due Monday;** design follows the research batch.
- [ ] **6. Medicine and bacta (D-405 [5]).**

  After the economy: kolto (Manaan) and bacta in this era, medcenters, prices and availability, building on the M5 healing rules (health.md: medical, bacta, Force healing).
- [ ] **7. Droids (D-405 [5]).**

  After medicine: droid models by era (the research queue's "Droids by era" gap; D-213's era minion kinds), companions, prices and their place in combat.
