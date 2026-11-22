**Canonical (Jared, 2026-11-22):** this repo file collects the items handed to M8 (World: timeline events, factions, renown, equipment, the species table; architecture §15). Design changes are made here and logged in docs-v2/decisions.md.

# SWRPG M8 checklist: the world

Nov 22, 2026 · @Jared Wright

## How to use

Items arrive here when a decision hands them to M8. Each says where it came from, what exists now and what is open. Tick an item once it is built and tested.

## Items

- [ ] **1. The 3,661–3,660 BBY event chain (D-401 [7]).**

  M7 applies the blockade as standing state at the 3,661 start (the control table, the leaders, the timeline's state row and the seeds; D-400). Nothing yet fires the events as play crosses the date:
  - the Battle on the Hydian Way, with Hylo Visz's smugglers breaking the blockade (3,660, D-393 [9]);
  - the end of the Coruscant riots;
  - the Lesser's death and Artus Lok's accession (c. 3,660, D-393 [10]);
  - the Rim Campaign battles (Ord Radama won and lost, Ashas Ree, Serenno, Ziost and Korriban, c. 3,660);
  - and the D-379 Hydian Way hooks (Council debate, the Devaron strike, food riots, surrender talk, the 3,660 relief).

  Build them as scheduled world events (src/features/world), dated from the timeline slice, so a player can change them (the Legacy Change framework in spec 14).
- [ ] **2. Species ages: separate "adult" and "prime" (D-401 [11]).**

  The age map has one maturity and one lifespan per species, linear between them (species.md §1). The Wookiee can't fit both the books' adult age of 18 and a prime at about 200 (D-399 [4]), so its maturity stays at the house default of 60. Add separate adult and prime ages, with the body-cap peak placed at the prime, and re-check Bowdaar (about 177 in 3,661, in his prime).
- [ ] **3. Species traits and bodies (lore batch 21, D-398; D-401 [12]).**

  The 33 species added in lore batch 21 have no traits. The clear size outliers have house-default body scales: Hutt 1.5, Talz 1.25, Houk 1.25, Jawa 0.6, Yoda's species 0.5; the rest are 1.0. Design the traits within species.md §3, using the "Game notes" resistances and needs in SW_Species_OldRepublic_Part3 as candidates, and set real body scales.
