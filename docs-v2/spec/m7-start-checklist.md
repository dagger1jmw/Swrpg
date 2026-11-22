**Canonical (Jared, 2026-11-21):** this repo file is the source of truth for the M7 playable 3,661 BBY start, as m6-integration-checklist.md is for M6. Design changes are made here and logged in docs-v2/decisions.md.

# SWRPG M7 checklist: the playable 3,661 BBY start

Nov 21, 2026 · @Jared Wright

## How to use

This checklist turns the M7 start options in architecture §15 into the work for a playable start in 3,661 BBY, together with what lore batches 12–21 settled for that year. Each item gives what exists now, the lore it rests on, and either "Built" or the decision it waits for.

- **Order:** A and B make the start load correctly, so they come first. C is the galaxy around the start, D is character creation, and E is the checks.
- **Per item:** tick an item once it is built and tested, or once its decision is made and logged.
- **The rule for building:** anything that needs a design decision waits for Jared. Lore facts and rulings already made are built directly.
- **Questions:** the numbered questions at the end of docs-v2/reports/m7-start-1.md match the open items here.

## A. The start

- [x] **1. The default start date (D-400; amends D-155).**

  The new-campaign form opens on 1 January 3,661 BBY with a 14-year-old character, and the era picker preselects the Great Galactic War. It is only a prefill: any era or date can still be chosen, and no rule favours a year. Constants: `DEFAULT_START_DATE` and `DEFAULT_START_AGE` in src/turn/campaign.ts.

  **Built.** D-155 said "no default year". This item amends it, per Jared's M7 brief; confirmation is asked as question 1.
- [x] **2. Start options: how a player picks one.**

  The §15 notes list candidate starts from lore batches 8–18. None of them is in the game yet:
  - Jedi starts (D-378, D-379): a Padawan at the Coruscant Temple; apprenticeship as a sequence of Masters, with field postings to specialists; the Corellian academy as an alternative. Flagged for design, not a default: the unknowing Child of the Emperor.
  - Coruscant non-Jedi starts (D-381): the 3,661 riots seen from the street.
  - Korriban and Imperial-born starts (D-366 to D-368, D-376): an Imperial-born start on Dromund Kaas, the slave-born Force-sensitive sent to Korriban, and the acolyte cohort.
  - Mandalorian starts (D-383): five options, from the nomad who refused the Sith to the blockade warrior under the Lesser.
  - Underworld starts (D-385): three homes (Undercity orphan, Cartel dock mechanic, freelance smuggler).
  - Republic military starts (D-387): trooper, pilot, SIS spy.
  - Imperial non-Sith starts (D-389): conscript, junior naval officer, Intelligence agent.
  - Force traditions (D-359): candidate backgrounds.

  Today a start is a premise text plus computed creation (path, rank, archetype, species).

  **Waits for question 2:** are start options premise presets (text plus suggested creation choices), or mechanical starts that set location, faction, rank and first threads?

  **Decided and built (D-401 [2]):** mechanical starts with an editable premise; 17 starts for 3,661 in src/data/startOptions.ts, checked against creation and seeded at campaign start; the form has a start picker. No start is a SWTOR protagonist.

- [x] **3. Start locations as data.**

  The Coruscant Temple and city tables (D-364, D-365) are in the lore files. Rooms not on record are flagged `invented: true`. Today, locations exist only once the narrator introduces them.

  **Waits for question 2.** If starts are mechanical, each one names its first location and the record is seeded with it.

  **Built (D-401 [2]):** each start's places are seeded as location records; places not on record are flagged `invented` in the data.

## B. Who is on the board

- [x] **4. The board filter (lore batch 19's status3661, batch 20's dates; D-400).**

  `canonOffBoard` and `canonBoardAt` in src/engine/canonRoster.ts decide who can be on the board at a date.
  - **On the board:** a figure who is "active" in 3,661; a figure whose status is not stated, placed by birth, death and unavailable years; and a child, as a child (Theron, about 5).
  - **Off the board:** the dead, the unborn, the imprisoned and the out of sight. The snapshot status wins over the dates where it says dead, unborn or imprisoned.
  - **In other years:** dates and unavailable spans only.

  **Built and tested** (tests/m7/start3661.test.ts).
- [x] **5. No canon link to an off-board figure (D-400).**

  When the narrator introduces a canon name, the engine links it to the canon entry (D-81). The `npcCanonLinked` handler now refuses the link for an off-board figure and gives the reason (for example "Kao Cen Darach is dead in 3,661 BBY"). The NPC stays an ordinary story NPC.

  **Built and tested.**
- [x] **6. Data fixes the board needed.**
  - Wyellett is unavailable 3,665–3,643. D-379 lists him as lost in 3,665 (captured, his transport lost at Hoth), and he was found in 3,642.
  - The Hero of Tython and the Barsen'thor are unavailable 3,681–3,654 (D-378 [9]: Cold War protagonists, not in the 3,681–3,653 setting).

  **Built.** The other five SWTOR protagonists are still on the board as children by their estimated birth years: question 6.

  **Done (D-401 [6]):** the other SWTOR protagonists (the Emperor's Wrath, Darth Nox, Cipher Nine, the Grand Champion, Voidhound and Meteor, Havoc's commander) are unavailable 3,681–3,654; Theron and the companions stay.

- [x] **7. Placing the rostered figures at the start.**

  The 3,661 placements are in the roster's status notes (D-379 Jedi, D-381 Coruscant, D-376 Korriban, D-383 Mandalorians, D-385 underworld, D-387 Republic military, D-389 Imperials). For example: Satele on Coruscant, recalled; Gnost-Dural at the Devaron strike, then the fleet; Ngani Zho hidden with Theron, taking him to Monastery. The narrator learns them only when a figure is named, through the lore index.

  **Waits for question 3:** should the engine pre-place canon NPCs at locations at the start (an NPC record with a location for each figure on the board), or leave placement to the narrator, from the status notes?

  **Decided and built (D-401 [3]):** only figures whose 3,661 location is on record, as a placements table (src/data/canonPlacements.ts), not NPC records: Tremel, Spindrall and Ragate (Korriban), Karagga (Nal Hutta, per the lore), Ngani Zho and Theron (Monastery), the Dread Masters (Belsavis).

- [x] **8. The narrator's view of the board.**

  The narrator sees canon figures only when they are named. It has no list of who is on the board, so it can still name a dead figure; the link is then refused (item 5), but the prose already said it.

  **Waits for question 4:** add a short "on the board here" list to the state block (cost about 150–300 tokens a turn), a "not on the board" warning only when a dead or absent figure is named in the player's input, or nothing?

  **Decided and built (D-401 [4]):** the state block lists the placed figures at the current location only, plus a warning for any story NPC named after an off-board figure.

- [x] **9. Imprisoned figures at their prison.**

  The Dread Masters (on Belsavis since 3,668) are off the board, so a story that reaches the Tomb can't link them. Prince Shange and Lord Raxxus are in the timeline, not in the roster.

  **Waits for question 5:** allow a link to an imprisoned figure when the scene is at their prison?

  **Decided and built (D-401 [5]):** linked at the prison with status `imprisoned`; prison spans count in every year (the Dread Masters 3,668–3,642).

## C. The galaxy in 3,661 BBY

- [x] **10. Who controls what, and who leads (D-400).**

  src/data/worldControl.ts holds 29 dated control spans for 27 places, and the leaders in office, from the timeline slice and batches 12–21.
  - **3,661 examples:** Coruscant Republic; Korriban, Dromund Kaas and Ziost Imperial; the Hydian Way Mandalorian-blockaded; Nar Shaddaa and Nal Hutta Hutt; Ryloth Hutt [inferred]; Balmorra, Geonosis, the Minos Cluster and Iridonia contested; Csilla the Chiss Ascendancy, an Imperial ally; Tython and Voss unknown to the galaxy.
  - **Leaders:** the Emperor; Chancellor Berooken [inferred]; Supreme Commander Rans [inferred]; Grand Master Zym [inferred]; Mandalore the Lesser.
  - **Left out:** places the files leave unstated (D-399 [18]).
  - **Narrator:** the state block gets a "Leaders:" line, and a "Control:" line when the current location (or one it lies in) is listed.

  **Built and tested.**
- [x] **11. The Order seat.** The Jedi Temple on Coruscant in 3,661 (src/data/orderSeats.ts; D-397: in ruins and relocating 3,653–3,650, then Tython). **Built** (already in the state block).
- [x] **12. The blockade, the Lesser and the Rim Campaign as facts.** The blockade is active in 3,661 and broken in 3,660 (D-393 [9]). The Lesser leads the clans from 3,667 until he dies c. 3,660 (D-393 [10]). The Rim Campaign starts c. 3,661–3,660. All three are in the control and leaders table, and in the timeline's 3,661 "State of the galaxy" row, which the lore index sends for the year. **Built.**
- [x] **13. Events that happen during play (3,661–3,660).**

  A 3,661 campaign reaches 3,660 within a year: the blockade breaks, the riots end, the Lesser dies and the Rim Campaign battles are fought. Today the narrator learns them only from the timeline as the date passes (timeline eligibility), and the control table changes on its dates. Nothing fires them as scripted world events.

  **Waits for question 7:** build the D-379 Hydian Way event chain (Council debate, Devaron strike, riots, surrender talk, the 3,660 relief) as scheduled world events now, or leave world events to M8?

  **Decided (D-401 [7]):** the blockade is standing state at the start (built); the event chain goes to M8 (docs-v2/spec/m8-world-checklist.md item 1).

- [x] **14. Era rules the narrator can't see.**

  The lore index holds only the character files, the timeline and (from batch 21) the species (D-81). The topical rulings for 3,661 never reach the narrator:
  - Coruscant: no formal rationing, curfew or conscription; the security tiers; named places that stay out (D-380 [7], [11], [12]).
  - Nar Shaddaa: which districts are in and out; Shadow Town doesn't exist yet (D-384 [7]).
  - Tatooine is not Hutt-ruled (D-384 [8]).
  - A Padawan has no braid (D-378 [1]).
  - The formal Senate Guard is out (D-380 [7]).
  - Korriban gap defaults (D-376).
  - Beskar is rare (D-382 [8]).
  - No aliens in the regular Imperial forces (D-388 [10]).

  **Waits for question 8:** an era-rules table in src/data, sent to the narrator like the planned era rank names (one short block per place when the scene is there)?

  **Decided and built (D-401 [8]):** src/data/eraRules.ts, nine rules, each sent only when its place or faction is relevant.

- [ ] **15. Era rank names for the narrator** (architecture §15, D-298, D-308). Specified in full in §15 (era-keyed data plus a state-block line), so it needs no decision. **Not built in this pass**; ready for the next one.
- [x] **16. The galaxy-sim faction seeds (spec 14, D-395).** No code reads them (no galaxy simulation yet). The review against batches 12–21 is below; **the values wait for question 9.**

  **Decided (D-401 [9]):** all five values and the three additions accepted and written into spec 14.

## D. Character creation at 3,661 BBY

- [x] **17. The species offered (lore batch 21, D-399 [20], [21]).** 37 species in 3,661 (38 from 3,645, when the Voss are known). NPC-only species are refused for players, and the creation form lists only those offered for the start date. **Built** in lore batch 21.
- [x] **18. Sith Pureblood: Empire only.** species.ts says `factions: ['empire']` and the sheet note says "Empire only", but computeCreation doesn't check it, so a Pureblood Jedi or outsider can be made. **Waits for question 10:** enforce it (Purebloods only on the Sith path, or the Sith path and Imperial outsiders), or allow it with a backstory?

  **Decided and built (D-401 [10]):** an Imperial origin is required at the 3,661 start (Imperial starts, or Imperial-born defector and underworld starts); Republic and Jedi starts are refused. Free starts in 3,681–3,653 need the Sith path.

- [x] **19. Bodies for the batch 21 species.** All 33 new species have bodyScale 1.0, Jawas and Hutts included. **Waits for** lore batch 21's question 2.

  **Decided and built (D-401 [12]):** clear outliers set (Hutt 1.5, Talz 1.25, Houk 1.25, Jawa 0.6, Yoda's species 0.5; house default); the rest stay 1.0 until M8 (m8-world-checklist.md item 3).

- [ ] **20. Alien Imperial starts (D-388 [10]).** No aliens in the regular Imperial forces in 3,661. The routes are a Chiss agent or liaison, a Force-sensitive slave sent to Korriban, or an informer. This is a creation constraint once Imperial career starts exist (item 2).
- [x] **21. Late Jedi recruits (D-378 [6]).** Recruits are normally young children, and older recruits are allowed as exceptions. The creation path's training-start range already covers this; no change.

## E. Checks

- [x] **22. Tests and harness.** tests/m7/start3661.test.ts covers the start date, the board, the link refusal, the control table, the leaders and the state-block lines. Harness: sweep and the lifetime suite, results in the report.
- [ ] **23. Browser smoke test of the 3,661 start.** Open a new campaign on the default date and play the opening turn. Check the Leaders and Control lines, that a canon figure on the board links, and that a dead one does not. This needs a real API key session.

## Seed review: spec 14's 3,661 faction seeds against lore batches 12–21

These are the seeds as moved in D-395. The numbers are the old 3,660 values ("just after the blockade broke"), re-dated without review. A value is listed if it contradicts what batches 12–21 settled for 3,661. **None has been changed; each waits for question 9.**

| Value | Now | Contradicted by | Proposed |
|---|---|---|---|
| `republic.morale` | 58 (above the middle) | In 3,661 many senators, war hawks among them, talk of surrender (D-380 [2]); food riots; the failed Devaron strike (D-378 [4]); a depression since 3,680 (timeline slice, 3,680). | 35 |
| `republic.stability` | 44 | Riots on Coruscant for food, and no formal rationing because the Republic isn't supplying (D-380 [11]). 44 is a mild figure for a capital in riot. | 35 |
| `jediOrder.morale` | 55 | The Devaron strike force destroyed with heavy losses, and the Council reluctant (D-378 [4]); Satele recalled to a rioting capital (D-379). The 55 was set for "post-blockade recovery". | 45 |
| `mandalorians.morale` | 48 | 48 was set for the clans just after their defeat. In 3,661 the Lesser's blockade is succeeding and the clans are rallied under him (D-382 [1], D-393 [10]). | 65 |
| `temple.supplyLevel` | 68 | Set for "rationing easing" after the blockade. No source says the Temple was rationed (the row was unsourced and dropped, D-393), but the blockade cuts Coruscant's supplies (D-380 [6]). Not a contradiction in itself; flagged because its basis is gone. | 55, tagged `invented` |
| `temple.currentFocus` | "Hydian Way blockade cutting supplies" | Fits Coruscant (D-380), but the Temple's own supply is unrecorded. | "The Hydian Way blockade and the Council's strike (Devaron)" |
| Missing: the Hutts | — | The Hutt Cartel is a neutral power whose money is behind blockade runs (D-380 [10], D-384). | Add `hutts: { neutral: true }`; numbers to be set by the sim spec |
| Missing: the Chiss | — | The Ascendancy is the Empire's only true ally (D-393 [18]). | Add `chiss: { alliedWith: 'sithEmpire' }`, or fold into the Empire |
| Missing: the Mandalorians' patron | — | The Lesser was installed and backed by Imperial Intelligence (D-382; timeline slice, 3,667). | Add `mandalorians.alliedWith: 'sithEmpire'` |

Not contradicted, and kept: `sithEmpire` power 72 and morale 68 with "Rim Campaign starting"; `jediOrder.power` 58; `republic.power` 52; `mandalorians.power` 52; `temple.trainingQuality` 78 (no source either way); `blockadeActive: true`; `riotsOngoing: true`; and `leader: 'Mandalore the Lesser'`.
