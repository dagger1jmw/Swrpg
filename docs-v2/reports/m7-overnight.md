# M7 overnight run: blockade, alien starts, timeline audit, era profile, wrap-up

2026-11-22. Decisions D-406 to D-410. M7 scope only; nothing from M8 was built.

## 1. Blockade narrowed (D-406)
- **Refused** in 3,661–3,660 (Mandalorians and Imperials pass):
  - a routine trip with an end on the Hydian Way inside the L–N, 14–21 strip (Eriadu M-18, Malastare N-16);
  - a trip along the Hydian Way through the strip, for example Denon to Imynusoph.
- **Where the Hydian Way worlds come from:** the map's route data (`worldsOnRoute`), meaning planets whose route list names the route, plus stops named in its endpoints text.
- **Reachable:** the strip's other worlds (Sullust, Eliad, Thyferra), with the hop × 1.5 for the detour (invented). The narrator gets "Blockade zone: patrols, shortages, scarce passage."
- **Example:** Coruscant to Sullust in a common freighter takes 218 h (146 h without the detour, or after 3,660).
- **The anchor** is unchanged: Coruscant–Alderaan, 10 h.
- **Tests:** Sullust reachable with the detour; Eriadu and Malastare refused; the through trip refused; the zone line in play.

## 2. Alien Imperial starts (M7 item 20, D-407)
Before 3,640, a non-Human can't take the regular Imperial starts:

| Start | Who can take it |
|---|---|
| Imperial soldier | Humans only |
| Junior naval officer | Humans, or a Chiss liaison |
| Imperial Intelligence agent | Humans, a Chiss agent, or any other alien as an informer |
| Slave sent to Korriban | Any species |

- Creation refuses with a message that names the three routes.
- An alien who passes gets the role as an opening thread ("A Chiss liaison", "A Chiss agent", "An informer, not an officer").
- Purebloods keep D-401 [10].
- Tests cover each start, the Pureblood exemption, the lapse after Ilum, and the refusal and thread through creation.

## 3. Timeline audit, 3,661 to 3,640 (D-408)
scripts/audit-timeline.ts prints the year-by-year dump; tests/m7/timelineAudit.test.ts holds the checks.

**Fixed (plain data bugs):**
- **Tython's gate** opened in 3,652, a year before the 3,651 rediscovery in the control table, D-283 amended and the timeline slice. It now opens in 3,651.
- **The Emperor** ended at 3,641, but the roster has Vitiate dying in 3,640, and the death year counts. He now runs to 3,640, followed by "none in power: the Emperor dormant, the Dark Council rules" from 3,640.
- **M1-4X** (found by the profile) had an estimated build year of 3,668. That put him on the board in 3,662 and 3,660 around the snapshot's "not built" in 3,661. The lore says built "before 3,643". The estimate is now 3,645, with his sheet year at 3,644. A new test catches any figure that flickers around the snapshot.

**Filled from the timeline slice Part 2** (the tables stopped at 3,653, leaving Coruscant with no controller after the Sacking):

| Place | Side | Years |
|---|---|---|
| Coruscant | Republic | 3,652 on |
| Alderaan | independent (seceded; civil war) | 3,652 on |
| Tython | Republic | 3,651–3,638 |
| Taris | Republic (resettlement) | 3,648–3,643 |
| Taris | Empire | 3,642 on |
| Voss | independent | 3,645 on |
| Balmorra | Republic | 3,642 on |
| Corellia | contested | 3,640 on |
| Ilum | contested | 3,640–3,636 |

| Office | Holder | Years |
|---|---|---|
| Supreme Chancellor | Janarus | 3,653–3,640 |
| Supreme Chancellor | Saresh | 3,640–3,632 |
| Supreme Commander | Rans | to 3,640 |
| Supreme Commander | Malcom | 3,640 on |

- End years not on record are tagged `inferred` and held to 3,637.
- Every office now has a holder every year from 3,661 to 3,640, except the Grand Master in 3,652 (question 3).

**Checked and consistent:**
- placed figures against the board;
- leaders alive on the roster;
- "unknown" worlds against their gates;
- the seat against the Tython gate;
- rank eras (unchanged through 3,640);
- species gates (Voss 3,645, Kaleesh 3,641);
- planet lines against the new spans.

One small note: a planet's "Control 3661" line is still sent in later years. It carries its year, so it isn't wrong.

**Added to the M8 checklist:**
- item 8, Cold War world events from 3,653 to 3,640;
- item 9, era rules for the Cold War years. Every rule but two ends by 3,653.

## 4. The 3,661 era lifetime profile (D-409)
tests/lifetime/era3661.test.ts. The profile is the Average Jedi Guardian with Padawan at 13: an initiate at 4 in 3,671, and a 14-year-old Padawan in 3,661. It runs through the real game to the start of 3,649, on 20 seeds. The harness gained a start date and a daily hook; every other profile runs as before.

Each year from 3,661, a probe checks:
- the state block's seat, leaders and control lines;
- a canon link for every roster figure, made the way the pipeline makes one;
- travel to every closed map world;
- a refused travel turn, which must pass no time.

The character moves with the Order to Tython in 3,650.

**Results (20 of 20 seeds, 235.0 s):**
- no crash;
- no canon link to an off-board figure (each year links exactly the board, 155–164);
- no trip to a closed world (15–18 tried a year);
- refused turns pass no time.

The changes land on their dates:
- **The seat:** Coruscant to 3,654, relocating 3,653–3,651, Tython from 3,650.
- **Tython:** closed in 3,652, open in 3,651.
- **Control:** Coruscant Republic, then Imperial in 3,653, then Republic again in 3,652; Tython Republic from 3,650.
- **Leaders:** the Lesser to Artus Lok in 3,660; Zym in 3,653, none in 3,652, Satele in 3,651; Janarus from 3,653.
- **The board:** the Lesser and Venemal go in 3,659; Zym, Ven Zallow and Berooken go in 3,652.

**Where world events would fire** (none exist yet; M8):

| Year | Events |
|---|---|
| 3,660 | the Hydian Way battle, the Lesser's death, the Rim Campaign |
| 3,653 | the Sacking, the Treaty |
| 3,652 | Alderaan secedes; Ord Mantell |
| 3,651 | Tython rediscovered |
| 3,650 | the Order moves |
| 3,649 | Janarus re-elected |

## Tests and harness
- **`npm test`:** 113 files, 1,202 tests, all pass. `npm run typecheck` and `npm run lint`: clean.
- **Sweep** (after item 1, which touched `resolveTurn`'s travel path): 2 tests pass, no issues, 41.5 s.
- **Era profile, 20 seeds:** 7 tests pass, 235.0 s.
- **`npm run test:lifetime`** (the lifetime harness was touched): 11 files, 43 tests, all pass, 305.3 s.
- **Mortals:** not re-run. Nothing it measures changed: no combat or progression code, and the harness changes are opt-in.
- **Items 2 and 3:** no harness suite reads creation or the world tables.
- **A slip I fixed:** the item 4 commit went in while `npm test` was running in parallel, and one check failed. M1-4X's sheet year (3,661) came before his new build year. I fixed it in the next commit, 8d8eb44, and everything passes.

## What's left in M7
- **The start checklist:** only item 23, the browser smoke test (yours).
- **The rest of M7** from architecture §15 ("Ranks and milestones"), none started:
  - rank ladders, trials and standing; Order requirements; the Council of Reassignment and the bypass; the rank-flag sources;
  - the Order schedule revisit (D-165);
  - masters (D-124);
  - the Council path and wartime postings (D-356, D-357);
  - forbidden powers and Order reputation (D-346);
  - teaching (D-163);
  - peacetime Sith Force growth;
  - and the design candidates: traditions, career paths, signature moves, the Corellian academy, "Child of the Emperor", the debt, stigma and displeasure tracks.

## Added to the M8 checklist
- **Item 4's text:** updated for the narrowed blockade.
- **Item 8:** Cold War world events, 3,653–3,640.
- **Item 9:** era rules for the Cold War years.

## Questions
1. **Blockade defaults (D-406):**
   - [a] "Along the Hydian Way through the strip" means both ends are Hydian Way worlds with the strip's rows between them. A trip between two other worlds whose line crosses the strip isn't refused, since the map has no routing.
   - [b] Everyone gets the zone line; only those who don't pass take the detour.
   - [c] The detour multiplies the hop, before climb-out.

   Keep all three?
2. **The blockade in 3,660:** the control table ends the Hydian Way span at 3,661 ("broken in 3,660", and tested). But D-402 [16], travel, the Lesser and the era rules all use 3,661–3,660, so in 3,660 the state block shows no blockade while travel still refuses. Which year does it end: the whole of 3,660 blockaded, or travel opening in 3,660?
3. **Grand Master in 3,652:** Zym dies in 3,653 and Satele is made Grand Master in 3,651. Leave 3,652 vacant, as it is now, or name an acting head?
4. **SWTOR protagonists in 3,653:** D-401 [6] says "kept out of 3,681–3,653", but the spans were built to 3,654, so all eight come onto the board in 3,653. Extend them to 3,653?
5. **Cold War spans (D-408 [2], [3]):** the end years not on record are held to 3,637 (`inferred`), and Malcom's to 3,636. Keep them, or end them at the last recorded year?
6. **Alien starts (D-407):**
   - [a] Only `human` counts as Human. Should near-Humans (Miraluka, Rattataki, Echani) count as aliens?
   - [b] The Korriban acolyte and Imperial-born starts are open to any species, since the request named only the military and naval starts. D-388 [10] lists the slave route as the alien way to Korriban. Restrict these two as well?
7. **M1-4X:** he's now built in 3,645 (estimate), inside the lore's "after 3,653, before 3,643" window. Is a different year preferred?
8. **Era rules after the Treaty** (M8 item 9): they're an M7 table (D-401 [8]). Write the Cold War versions in M7, or leave them in M8 as listed?
