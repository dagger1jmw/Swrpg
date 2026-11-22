# M7 third pass: travel, rank names and the map fix

2026-11-22. Decision: D-405.

## 1. Kaleesh gate
The gate stays at 3,641, now tagged [inferred] in species.ts and 23-species.md.

## 2. Travel (checklist item 26): approved with changes and built
- **Numbers** (all `invented`, in src/data/travel.config.ts):
  - Hop time is the region's minimum plus a per-square time for each grid square crossed beyond the first: Core 4 h + 3 h per extra square; Colonies and Inner Rim 6 h + 4 h; Expansion and Mid Rim 10 h + 6 h; Outer Rim and Hutt Space 16 h + 8 h; Wild Space and Unknown Regions 30 h + 15 h. A hop across regions uses the slower rate.
  - The hop time is multiplied by the ship's class.
  - Deep Core × 3; an asteroid field × 1.5; off the lanes × 4 plus 3 h of plotting; climb-out 1 h at each end (0.25 h for a station or ship); the Maelstrom is sublight only (72 h).
  - House-default classes: common freighter 2, modified smuggler ship 1.5, civilian transport 3. The rest are as drafted.
- **Engine:** src/engine/travel.ts. It's pure. Distance is counted in grid squares, and a diagonal step counts as one square.
- **In play:** src/turn/travel.ts.
  - A "travel" intent from the current location's map world to a map world named by the player takes the engine's time, which passes like any span.
  - The narrator gets a "Travel:" line giving the hours, the ship and its class.
  - If the player asks for a different span, the engine's time wins, and the report says so.
- **Refused, with no time passing:** a world closed to the character's side, or a routine trip across the blockade.
  - The blockade corridor is grid columns L–N, rows 14–21, running from Devaron's square to the Minos Cluster. That is my invented reading of "between Devaron and the Minos Cluster".
  - Mandalorians and Imperials pass. Running the blockade for anyone else is in the M8 checklist.
- **Places not on the map:** the narrator sets the time, as before.
- **The ship:** a common freighter (Class 2) until ships are data in M8. The smuggler start flies a modified smuggler ship (Class 1.5).

**The anchor, re-run:** Coruscant (L-9) and Alderaan (M-10) are one square apart, so the trip is a single Core hop at the 4-hour minimum, plus 2 hours of climb-out.
- Common freighter (Class 2): **10 hours**.
- Smuggler ship (Class 1.5): 8 hours.
- Class 1: 6 hours.

All three are under the Imperial-era guide of about 16 hours. That guide's route clips the Deep Core, which a hop between two Core Worlds can't see. If you want the anchor near 16 hours, a 1-square minimum of about 7 hours for the Core would do it, or a Deep Core factor applied to Core-to-Core hops that pass near the Deep Core. Neither is built.

## 3. The map generator (Varn and Kintan)
- **The cause:** the generator ran the citation stripper on the index's name cells. Every name in the mention-only index is a link, so the whole link was removed.
- **What was dropped:** no rows. All 427 were kept, which is why the count test still passed. But 398 mention-only names and all 20 off-map names came out empty, Varn and Kintan included.
- **The fix:** names now keep their link text.
- **Duplicates:** the file lists two worlds in both the master table and the index, Malachor V and Mandellia. The master-table entry now wins.
- **Now:** 182 worlds, 406 mention-only nodes and 19 off-map names, none empty.
  - Varn: O-6, Quelii sector.
  - Kintan: S-9, Si'Klaata Cluster.
  - Both are checked in a test.
- D-404's note that Varn and Kintan weren't in the planets files is superseded. The lore index wasn't affected, since it doesn't read the tables.

## 4. Era rank names (checklist item 15): built
- src/data/eraRanks.ts has 9 Jedi rows and 10 Sith rows by year, from the cross-era tables (D-298, D-299, D-308).
- The state block has a "Rank names in this era" line.
- In 3,661 that line covers the Old Republic Jedi (youngling, Padawan, Knight, Master; the High Council and Grand Master; Battlemaster) and Vitiate's Empire (acolyte → apprentice → Sith Lord → Darth → Dark Council → Emperor's Wrath → Emperor; Overseers as staff).

## 5. M8 checklist, extended
Items 1–7 in docs-v2/spec/m8-world-checklist.md:
1. World events: the 3,661–3,660 chain, the 3,653 Sacking of Coruscant and the Treaty of Coruscant.
2. Separate adult and prime ages.
3. Species traits and bodies.
4. Running the Hydian blockade.
5. Economy and prices (research due Monday).
6. Medicine and bacta.
7. Droids.

## Tests and harness
- `npm test`: 112 files, 1,188 tests, all pass (14.7 s). `npm run typecheck` and `npm run lint`: clean.
- New tests (tests/m7/travel.test.ts):
  - the trip-time rules (the anchor, extra squares, the slower region, Deep Core, off-lane, the Maelstrom, the blockade, the classes);
  - travel in play (the time passes; a closed world is refused with no time passing; a place off the map is left to the narrator);
  - rank names by era and in the state block.
- tests/lore/planets.test.ts now checks that every name is non-empty, plus Varn and Kintan.
- **Harness:** the travel wiring changed `resolveTurn`, which the sweep and the mortals suite both call (combat only; the travel branch is never reached there).
  - Sweep: 2 tests pass, no issues, 42.5 s.
  - Mortals (`npm run mortals`): exit 0, Obi-Wan profile on 20 seeds; every gate met (milestones within 20%, not faster than Anakin, the Clone Wars share 20-30% with a mean of 0.236, peacetime combat under 10%); mortal wounds 2.2 a life (median 2), lost limbs 0.7, nothing failing; 1,104.5 s.
