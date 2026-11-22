# Lore batch 22: planets, routes and travel (Old Republic era)

2026-11-22. Batch file: `docs-v2/lore/batches/lore-batch-22-planets-travel.md`. Decisions: D-402 (rulings 1–18, numbered as in the batch), D-403 (parser), D-404 (map data, closed worlds, travel draft). The last number in use before the batch was D-401.

## Files added
`Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part1.md` to `_Part6.md`.

## Lore index (D-403)
The parser didn't cover this layout, so I extended it, with tests. The older layouts are unchanged.
- **New chunks:** 182 planet chunks and 10 route chunks. Nothing else in the index changed.
- **When a planet is sent:** when the scene is at that world, or the world is named.
- **When a route is sent:** only when it's named.
- **Dated lines:** each event line is dated by its own leading date, so a 3,661 game doesn't see later events. For example, the Coruscant entry's Sacking (3,653) is held back until 3,653.
- **Left out:** the 725-page source list (Part 6), the big tables, citations, cross-reference pointers and population figures (ruling 12).

## Map data: the batch's "data exists" branch
There was no galaxy map system before this batch. However, the M7 start places and the 3,661 control table are location data, so I took the branch that adds the planets.
- **What's generated:** `src/data/galaxyMap.generated.ts`, built by `scripts/gen-galaxy-map.mjs` from the planets files. Re-run the script if the files change. It holds:
  - the 182 master-table worlds, each with region, grid, sector, system, routes, 3,661 control (blank when not on record), any 3,653 change, role, gating and full or thin;
  - 407 mention-only worlds as background nodes, with control blank (20 more have only a Canon grid and stay off the map);
  - 22 attested routes, with the Hydian Way's blockade flagged;
  - 73 infobox-only routes, flagged as unattested (the Pabol Hutta is left out as Canon).
- **What's curated:** `src/data/galaxyMap.ts` holds the closed worlds (rulings 5–8), each with its opening year and the side it's closed to. The narrator's state block lists the worlds closed to the character's side, and gives the reason when the scene is at one of them.
  - Dromund Kaas is closed to the Republic until 3,640, with "capture, or a stolen Imperial navicomputer" as the story exception.
  - Ilum is closed to the Empire until 3,640.
  - Belsavis is a Republic secret, reachable with a story reason (SIS or prison staff).
  - Quesh appears in survey records only, until 3,643.
  - Everything else in ruling 7 is closed to all sides until its own year.
- **Not built:** the travel system itself (M7 checklist item 26). Nothing in play reads the map yet.

## Draft travel numbers (for your review; all `invented`, not wired into play)

**Base hop times,** at Class 1, between consecutive stops on a charted route:

| Region of the hop | Hours |
|---|---|
| Core Worlds | 4 |
| Colonies, Inner Rim | 6 |
| Expansion Region, Mid Rim | 10 |
| Outer Rim, Hutt Space | 16 |
| Wild Space, Unknown Regions | 30 |

A hop that crosses two regions takes the slower region's time.

**Modifiers:**
- **Hyperdrive class:** hop time × class.
- **Deep Core:** each hop × 3.
- **Off the charted lanes:** × 4, plus 3 hours to plot a new destination, plus a hazard check that is still to be designed.
- **Climb-out:** 1 hour at each end for a planet, and 0.25 hour for a station or a ship in deep space. Class doesn't change it.
- **Hazards:** an asteroid field on the path × 1.5. The Maelstrom Nebula is sublight only, about 3 days to cross. Ruhnuk is unreachable from 3,663.
- **The blockade:** the Hydian Way between Devaron and the Minos Cluster is closed in 3,661–3,660. Running it is a high-risk attempt, to be designed with the M8 event chain.

**Hyperdrive classes:**
- Lore: the *Ascendant Spear*, Class 0.5.
- Game stat: the *Hammerhead*, *Aurek*, *Foray* and *Kandosii*, Class 2 (the *Kandosii*'s backup drive is Class 9).
- House default: *Valor* 2, *Harrower* 2, *Terminus* 1.5, *Thranta* 1.5, *Fury* 1, *Defender* 1.5, a common freighter 3, a civilian transport 4.

**Anchor check:** Coruscant to Alderaan is two Core hops plus climb-out. That comes to 18 hours for a Class 2 ship and 14 hours for Class 1.5, close to the Imperial-era guide of about 16 hours. That guide comes from another era, so it isn't data for this one.

## The Kalee wording (ruling 10)
Part 2, Kalee, field 2 reads: **"Not stated; Kaleesh only recently contacted by the Galactic War"** [Kalee/Legends §History]. That doesn't put contact before 3,661, so I kept the gate.
- Kaleesh are NPC-only at the 3,661 start, the same as the Voss, and are offered from 3,641 (the Galactic War).
- 36 species are now offered in 3,661.
- The year 3,641 is my own reading of "recently contacted by the Galactic War"; the files give no year. A question below.

## Other rulings applied
- **Ruling 2 (Serenno):** Serenno is Republic-held in 3,661, with Ven Zallow's base. It's in the control table, and Ven Zallow is placed there.
- **Ruling 9 (Odacer-Faustin):** an era rule says no academy is named there before 3,655.
- **Rulings 11 and 12:** one always-on era rule. Places attested only in the SWTOR games may be used, marked unconfirmed for this window, and Coruscant keeps its strict rule. Population is given only as orders of magnitude.
- **Rulings 17 and 18:** applied to SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 and Part2. Neither file had a "Changes from the previous file" section, so I added one to each, naming batch 22.
- **Rulings 1, 13–16:** recorded in D-402 and in the map data.

## Planet spellings
No planet in the planets files is spelled differently from the roster, the character files, the timeline, the control table, the start options or the placements. Two worlds named elsewhere aren't in the planets files at all:
- **Varn:** Guss Tuno's birthplace, in SW_Characters_09_GGW_ColdWar_Part3a.
- **Kintan:** the Nikto homeworld, in SW_Species_OldRepublic_Part2 and the control table.

## Research queue
- Planets and travel are marked done, and the old "Planets, hyperspace routes and travel times" gap is closed.
- Three low-priority follow-ups were added: era trip durations; hyperdrive classes for the 3,661 warships; wartime border and travel documents.
- The README has a new section, "Planets, routes and travel".

## Tests and checks
- `npm test`: 111 files, 1,178 tests, all pass (14.2 s). `npm run typecheck` and `npm run lint`: clean.
- The new `tests/lore/planets.test.ts` covers:
  - parsing (planet and route chunks, tables skipped, citations and population dropped, dated lines);
  - retrieval (a planet sent at its location, a route only when named);
  - the real files (182 planets and 10 routes; no Sacking in the 3,661 Coruscant text);
  - the generated map counts, blanks and 3,653 changes;
  - the closed worlds by side and year;
  - the state-block lines;
  - the era rules.
- The Kaleesh gate is in the species and M7 tests.
- **Harness:** not run. No suite reads the lore index, the map or the era rules.

## Question for Jared
1. **The Kaleesh gate's year:** the files give none. I used 3,641 (the Galactic War). Keep it, or pick another year?
