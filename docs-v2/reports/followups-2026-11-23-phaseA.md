# Follow-up answers, Phase A (2026-11-23; D-451 to D-455)

Phase A of the answers to followups-2026-11-22.md: code and quick tests only, nothing re-measured. Commit `07d3a11` on
`rebuild`, pushed. `npm test`: 129 files, 1,336 tests, all pass (21 s); typecheck and lint clean.

## What was built

- **0. Nexus tiers (D-451).**
  - Tython (balanced), Korriban (dark) and Dromund Kaas (dark) are major nexus planets at x1.15.
  - Ordinary nexus and Force-rich planets stay at x1.10; sites stay at x1.15.
  - The stronger bonus wins, with no stacking. The Valley of the Dark Lords and a new Dark Temple site on Dromund Kaas equal their planets.
  - Mortis is story-only: no multiplier, and it isn't on the map.
  - Tested: a Jedi on Tython gets x1.15, and the leaning check still applies (a Jedi on Korriban gets nothing).
- **1. Knight minimums:** they stay at Force Control 41 / Force Sense 40.
- **3. Order seats by date (D-451).**
  - Each Jedi seat now names a home place: the Coruscant Temple; its ruins 3,653-3,651 BBY; the Temple on Tython from 3,650; Coruscant again from 3,600 (design default); none from 19 BBY to 11 ABY; the Praxeum; Ossus.
  - A new Sith table gives the Korriban academy to acolytes and the Lords' seat to apprentices and Lords:
    - Dromund Kaas from 4980 BBY;
    - the academy from 3681 to 3637;
    - Kaas alone to 3,600 (the lore stops at 3630);
    - Revan's Korriban 3959-3956;
    - the Brotherhood of Darkness 1010-1000;
    - the One Sith from 27 ABY.
  - There is no seat while a site is abandoned.
  - Wired into the harness (the `seat` option), the profiles, the era profile (which now moves with the seat) and the archetype runs.
  - The Sith have no seat at the neutral test year (1,032 BBY), so Sith archetypes are measured from 3,671 BBY.
- **4. Onimi (D-453).** A per-character `insideForce` flag; the species block stays. While building it I found that the NPC generator built a Vong on the human body, so creation's D-447 block never fired for story Vong. That is fixed.
- **5. Trials held back, enforced (D-454).** From the 3rd discovery on, each discovery delays Knight Trials eligibility by 1 year, counted from the later of the discovery and the running hold. The hold lifts on its own. The narrator gets the date.
- **6. Luke on Dagobah:** one month, with Jared's reasoning recorded in D-452. Changed in the profile only.
- **7. Obi-Wan's Clone Wars share** at 19 of 20 seeds: accepted.
- **8. M8 design notes:** filed as M8 checklist item 12 (item 10 folded in). The martial-cultures question is on the research queue.

## Item 2: the dip at 30 (diagnosis)

No rule is tied to Force skill 45. The chain is:

1. The Force boost (0.3 x (Force Control - 40)) lifts Endurance performance, and with it the physical capacity the planner projects against.
2. The planner takes a 0.5 h rest between physical blocks only when the physical meter has passed 0.7.
3. As capacity rises, the meter at those rest points slips just under 0.7 (mean 0.68 -> 0.635), so the rests are skipped: about 790 taken a year become 640-655 at ages 29-32.
4. The day then projects over the 0.9 limit, and the fill is trimmed: 68 -> 117-130 h a year, mostly Soresu.
5. Days end less tired (f 0.63 -> 0.58), so the Willpower earned from fatigue falls too.
6. Two to three years later the higher capacity clears the limit without the rests, and the dip ends.

The Temple brings the dip two years earlier because it raises Force Control, and so the boost, sooner.

**Verdict: accidental.** The spec says to rest when the meter *would* pass 0.7; the code checks whether it *has* passed. In either reading, getting fitter should never cost training hours.

**Proposed fix (applied in Phase B as D-456):** a rest before a trim. When the projected day passes the tiredness limit, the planner first takes the rests between physical blocks (they cost clock time, not training hours), and trims the fill only if the day is still over. The real day loop takes the rests the plan marks as needed.
