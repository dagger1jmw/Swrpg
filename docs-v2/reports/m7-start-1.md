# M7, the playable 3,661 BBY start: first pass

2026-11-21. Decision: D-400. Checklist: `docs-v2/spec/m7-start-checklist.md` (canonical; same format as the M6 checklist).

## The checklist
23 items in five groups:
- **A. The start:** the default date; how a start option is picked; start locations.
- **B. Who is on the board:** the filter; link refusal; data fixes; pre-placing figures; the narrator's view of the board; imprisoned figures.
- **C. The galaxy in 3,661:** control and leaders; the Order seat; the blockade, the Lesser and the Rim Campaign; events during play; era rules the narrator can't see; era rank names; the spec 14 seeds.
- **D. Character creation:** the species offered; Pureblood "Empire only"; bodies for the new species; alien Imperial starts; late Jedi recruits.
- **E. Checks:** tests and harness; a browser smoke test.

The checklist also has the spec 14 seed review, with a proposed value for each contradicted seed.

## What's built
1. **Default start (item 1):** the new-campaign form opens on 1 January 3,661 BBY, with a 14-year-old character and the Great Galactic War preselected. It's only a prefill; any era or date can still be picked.
2. **The board (items 4–6):**
   - `canonOffBoard` and `canonBoardAt` (src/engine/canonRoster.ts) put a figure on the board if they're "active" in 3,661, or if their dates place them when no status is given. Children count, as children.
   - Figures the 3,661 status calls dead, unborn or imprisoned are off the board, and so are figures dated out or out of sight.
   - When the narrator names a canon figure who is off the board, the engine refuses to link them and says why ("Kao Cen Darach is dead in 3,661 BBY"). The NPC stays an ordinary story NPC.
   - Data fixes the board needed: Wyellett is lost at Hoth 3,665–3,643 (D-379); the Hero of Tython and the Barsen'thor are out of the 3,681–3,653 setting (D-378 [9]).
3. **Control and leaders (items 10–12):**
   - src/data/worldControl.ts has 29 dated, sourced control spans over 27 places, with inferred readings tagged and unstated places left out.
   - It also lists the leaders in office: the Emperor, Berooken [inferred], Rans [inferred], Zym [inferred] and Mandalore the Lesser, then the Vindicated and Satele as Grand Master in later years.
   - The narrator's state block now has a "Leaders:" line, and a "Control:" line for the current place and the places it's inside. The Order seat line was already there.
4. **Species at creation (item 17):** 37 species are offered in 3,661, and the Voss only from 3,645. This was built in lore batch 21.

## Seed review (spec 14): values that contradict the batches
None was changed. Proposed: `republic.morale` 58 → 35, `republic.stability` 44 → 35, `jediOrder.morale` 55 → 45, `mandalorians.morale` 48 → 65, and `temple.supplyLevel` 68 → 55 (tagged `invented`; its basis, "rationing easing", is gone). Also proposed: new entries for the Hutts (neutral), the Chiss (the Empire's ally) and the Mandalorians' Imperial patron. Reasons and sources are in the checklist's table.

## Questions for Jared
1. **D-155:** confirm the amendment. The form now opens on 3,661 BBY by default; "no default year" no longer holds, but nothing in the rules favours a year.
2. **Start options (items 2–3):** should starts be premise presets (text plus suggested creation choices) or mechanical starts that set location, faction, rank and opening threads? The answer also decides whether start locations are seeded as data.
3. **Placing canon figures (item 7):** should the engine pre-place the 3,661 roster at locations when the game starts, or leave it to the narrator, from the status notes?
4. **The narrator's view of the board (item 8):** a short "on the board here" list in the state block (about 150–300 tokens a turn), a warning only when a dead or absent figure is named, or nothing?
5. **Imprisoned figures (item 9):** allow a canon link to an imprisoned figure when the scene is at their prison (the Dread Masters on Belsavis)?
6. **The other SWTOR protagonists (item 6):** the Emperor's Wrath, Darth Nox, Cipher Nine, the Hunter (Grand Champion) and Havoc's commander (Voidhound) are on the 3,661 board as children, by their estimated births. Should they be out of the 3,681–3,653 setting like the Hero of Tython and the Barsen'thor (the D-378 [9] reasoning)?
7. **Events during play (item 13):** build the 3,661–3,660 Hydian Way event chain as scheduled world events now, or in M8?
8. **Era rules (item 14):** an era-rules table sent to the narrator per place (no rationing on Coruscant, the Nar Shaddaa districts, no Padawan braid and so on)?
9. **Seeds:** accept the proposed values and the three additions, change them, or leave them for the simulation spec?
10. **Purebloods (item 18):** enforce "Empire only" at creation, or allow it with a backstory?

Lore batch 21's three questions (Wookiee maturity, bodies for the new species, the NPC entity enum) are still open as well.

## Tests and harness
- `npm test`: 109 files, 1,152 tests, all pass (13.3 s). `npm run typecheck` and `npm run lint`: clean.
- tests/m7/start3661.test.ts (10 tests) covers:
  - the start date;
  - on the board: Zym, Satele, Malgus, Marr, Ngani Zho, Theron as a child, the Lesser, Orgus Din, Gnost-Dural, Angral;
  - off the board: Darach and Allusis (dead), the Dread Masters, Wyellett, Torian Cadera (unborn), the Hero of Tython and the Barsen'thor;
  - the link refusal, with the reason;
  - the control and leaders checks, including a blank for Dantooine and the Coruscant Sacking year;
  - the state-block lines;
  - the species count.
- **Harness, run one at a time (none reads non-Human species or the canon roster, so no gate could move):**
  - `npm run sweep`: 2 tests passed, no issues, 41.7 s.
  - `npm run test:lifetime`: 10 files, 36 tests, all pass, 155.4 s.
- **Not done:** the browser smoke test (item 23) needs a session with a real API key.
