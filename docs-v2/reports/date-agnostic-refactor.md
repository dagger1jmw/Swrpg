# Date-agnostic refactor and the overnight answers

2026-11-22. Decisions D-411 to D-416. Brief: docs-v2/spec/date-agnostic-refactor.md. This pass comes before the rest of M7's §15 "Ranks and milestones", so ranks can build on dated rank spans.

## 1. The overnight answers (D-411)
- **The blockade** ends with 3,661: travel is open from the start of 3,660, as the control table has it.
- **Grand Master in 3,652:** a leader line reads "vacant: the Jedi Council leads the Order".
- **The eight SWTOR protagonists** stay off the board through 3,653.
- **Cold War spans** end at their last recorded year; nothing is held to 3,637. For example:
  - Coruscant (Republic) to 3,632;
  - Alderaan to 3,638;
  - Taris, Balmorra and Corellia in their single recorded year;
  - Malcom in 3,640.
- **Near-Humans** count as aliens. The Imperial-born start takes Humans and Purebloods only, and an alien takes the slave-born route. The acolyte start stays open.
- **M1-4X** stays at 3,645 (estimate). The Cold War era rules stay in M8.

## 2. What the refactor built
**Stage 1, the roster as dated spans (D-412).**
- **What replaced the snapshots:**
  - Every one of the 183 figures now has rank, role and office spans, status spans and location spans.
  - Each span carries the lore's wording and an `estimate` tag where the sources don't date it. They live in src/data/canon/era09Timeline.ts.
  - The 3,661 and 3,653 snapshots and `role`/`earlierRoles`/`unavailable` are gone.
  - The old snapshot wording survives as cited facts in one-year spans.
- **What reads the spans:** the board, the link refusal, placements and the narrator's board view all query them at the campaign date.
- **Birth estimates:** re-derived from each figure's rank facts with typical rank ages (src/data/canon/rankAges.ts, invented and tagged). Every estimate has a written basis.
- **The brief's §4 corrections are all in:**
  - Lana is a youth in 3,661, and Karrid is Gnost-Dural's Padawan then.
  - Yuon Par and Aryn are Knights, and Sedoru is a Knight (Master from 3,642).
  - Harkun is an Overseer from c. 3,655. Tark is lost on Malachor III.
  - Tremel is born 3,716. Ikoral is a Darth.
  - The Caderas are older, and Rusk is born 3,680.
  - Khem Val is in stasis until the Cold War. Khem Val and Broonmark are warriors.
  - Galena Rans is kept separate: she married the Supreme Commander.

**Stage 2, starts, keyframes and the 3,661 audit (D-413).**
- **Start options:** each of the 17 has its valid years, from 3,681–3,654 for the war starts to 3,681–3,642 through the Cold War.
  - Threads, place notes and premises are dated, so a 3,670 Temple start gets no blockade.
  - The form offers starts by the picked date. Refusals name the picked year.
- **Spec 14's seeds** are recorded as a keyframe at 3,661. The galaxy map's control fields are dated keyframes.
- **The audit's fixes:** an era rule that said "for 3,661", the start messages and the map fields. Everything else was already dated.

**Stage 3, the stat model (D-414; src/engine/canonStats.ts).**
- **Anchors:** complete and partial.
  - Each stat is carried from its nearest anchor along the figure's growth curve.
  - Between two anchors it is interpolated in growth space.
  - Going backward it is clamped at the archetype's baseline.
- **What shapes the curve:** rank spans set the Padawan and Knight phase ages. Dated events multiply stats from their date on. Stasis years count toward neither age nor growth.
- **No anchor:** the generator builds the line.
- **In a campaign:**
  - The line is calculated once at the start date (a new optional `clock.startDay`).
  - From then on it grows by the normal maths.
  - Old saves use today.

**Stage 4, works and anchors (D-415).**
- **The works table** (src/data/canon/works.ts) has 29 works, each dated from the lore event it shows. Five are marked undated.
- **Appearances:** recorded for 15 hand-set figures, with their gaps.
- **Sheets:** the priority figures' sheets now cite their works.
- **Draft anchors** for review: Spindrall, Tremel, Rans, Shol Bestros and Jerbhen Hulis.
- **One dated event in the data:** Sedoru's war injuries.

## 3. Tests and harness
- **`npm test`:** 117 files, 1,231 tests, all pass. `npm run typecheck` and `npm run lint` are clean.
- **New test files:**
  - tests/data/canonTimeline.test.ts: rank ages, birth bases, offices, the §4 corrections, and the board at 3,681, 3,667, 3,661, 3,653, 3,643, 3,640 and 3,630;
  - tests/engine/canonStats.test.ts: three ages, a partial anchor, interpolation, the clamp, stasis, events, fixed figures and the campaign start;
  - tests/features/canonLevels.test.ts: Satele at three ages, the rank shape, and a generated line;
  - tests/data/works.test.ts.
  - Start-date checks were added to tests/m7/startOptions.test.ts.
- **`npm run test:lifetime`** (includes the 3,661 era profile, 20 seeds): 11 files, 43 tests, all pass, 361.6 s (305.3 s last run; the probe now reads the spans).
- **Sweep:** 2 tests pass, no issues, 40.6 s.
- **Mortals:** not re-run. It reads no canon figure, and generated NPCs take the same path as before.

## 4. Board changes to know about
- **Now off the board:**
  - Nico Okarr, 3,681–3,632 (missing and unageing; he was on the board before);
  - Ngani Zho, 3,652–3,644 (vanished after 3,653);
  - Parkanas Tark, 3,665–3,644 (lost on Malachor III).
- **Now on the board:** the Dread Masters in 3,641, the year the Empire takes Belsavis (the old span kept them off through 3,641).
- **Now kept off by span:** Lana Beniko holds no rank in 3,661 (a child), and the protagonists are off through 3,653.

## 5. Questions
1. **Typical rank ages:**
   - The estimates use a Knight at 25, as in the Obi-Wan check.
   - The game's own calibration knights the Average at 20.5.
   - Keep 25 for canon estimates, or align to 20.5?
2. **Growth after the campaign start:**
   - A figure's line is set once at the start, then grows along its canon rank spans: it gets its canon promotions, but no later anchor pulls it back.
   - The alternative freezes its rank as of the start.
   - Which one?
3. **What the narrator sees:**
   - Only the D-401 [3] placements are sent to the narrator.
   - The other on-record locations (Satele on Coruscant in 3,661, Kellian Jarro on Coruscant in 3,653) are kept as data only.
   - Send all on-record locations?
4. **Starts outside 3,661:**
   - The valid ranges are listed in D-413 [1].
   - A start whose threads are all 3,661 events has no opening thread in other years.
   - Its other-year premise is a plain invented line.
   - Are the ranges and that default acceptable, or should other years get threads of their own?
5. **The draft anchors:**
   - Please review the five drafts.
   - Karagga and Oteg need hand-set lines: the generator gives none for an 800-year-old Hutt, and it overshoots for Oteg.
   - Overseer Ragate needs a lore index entry before he can have one.
6. **Rans:**
   - The leaders table has him Supreme Commander from 3,681 [inferred], but his birth estimate (3,706) makes him 25 then.
   - Stantorrs is Supreme Commander in 3,643 "replaced by Rans", while the table has Rans throughout.
   - Which spans are right?
7. **Ages on record that are below the role minimums:** Thanaton was a Lord and Darth at 17 (born 3,695, both lore). The Barsen'thor was made a Master at 28. Keep both as on record?
8. **A warrior archetype:** there's no melee career archetype, so Khem Val and Broonmark use bountyHunter. Add a "warrior" archetype in M7?
9. **Readings to confirm:**
   - Lana born 3,672.
   - Karrid born 3,684.
   - The Malachor III expedition c. 3,665.
   - Sedoru's injury factor of 0.8.
10. **Board changes:** Nico Okarr and Ngani Zho are now off the board in the years above. Confirm?

## 6. Next
The rest of M7's §15, "Ranks and milestones", builds on the rank spans from here.
