# Lore batch 20: galaxy timeline, slice 1 (c. 3700–3600 BBY)

One commit, or two if the parser change is large. Run after lore batch 19, because some rulings here adjust dates in the Era 09 character files and the canon roster that batch 19 rebuilds.

## Inputs
Copy into `Docs/SWRPG lore/`:
- `SW_Timeline_3700_3600BBY_Part1.md` (3,700–3,653 BBY; state-of-the-galaxy paragraphs for 3,665–3,655)
- `SW_Timeline_3700_3600BBY_Part2.md` (3,653 to c. 3,622 BBY)
- `SW_Timeline_3700_3600BBY_Part3.md` (row-by-row check of the old file, conflicts, decisions, sources)

## Step 1: the slice replaces part of the old timeline
`SW_Legends_Galaxy_Timeline.md` still covers every other era, so it stays.
- Remove its rows for 3,700–3,600 BBY (from the Hydian Way row c. 3,700 BBY through the "~3,625 BBY" rows), so the index doesn't read the slice twice. Keep a copy of the removed text in the superseded location batch 19 used, for the record.
- Move the old file's LEGACY CHANGE FRAMEWORK and GALAXY SIM FACTION STATE SEEDS blocks out of the lore file. They are game mechanics (ruling 8).
- Mark the slice done in `RESEARCH_QUEUE.md`, keeping the timeline redo open for the other eras, and update the lore index.

## Step 2: parser (`src/lore/parse.ts`, `scripts/build-lore.ts`)
The slice keeps the old era headings, ═ lines, "### Overview", "### Year-by-Year Scripted Events" and "#### year — Year N" forms, with these changes:
- **Columns** are now Date | Event | Type | Place | Who | Source. The old Downstream column is gone.
- **New headings:** an Overview under GALACTIC WAR (SECOND); single-year headings 3,665–3,653; a range heading "#### 3,676–3,672 BBY — Years 5-9"; "#### Undated within the war (3,681–3,653 BBY)"; the new LEGACY OF THE SITH block.

Make the parser read the new files. Don't change the lore files to suit it. Keep it reading the old layout for the rest of the old file. If anything consumed the Downstream value, it now defaults to empty; list the consumers in the report. Accept dates both with and without the comma ("3,681 BBY" and "3681 BBY"), so the timeline and the topic files match each other. Rebuild the index and report the diff.

## Step 3: rulings on the 23 decisions (Part 3)
1. **Section order:** fine as it is. (Tell the bot it needn't ask again.)
2. **Year labels:** Year = 3,681 − year. 3,681 BBY becomes "Year 0 (war begins)"; 3,680 becomes Year 1, 3,671 Year 10, 3,661 Year 20, 3,653 Year 28. That fits the "twenty-eight-year war" and the ATC count. Fix the few old labels that break the rule (3,681 = Year 1, 3,680 = Year 2). If any code reads these labels, check it still works.
3. **Downstream column:** dropped. It was a game value with no source; if a game system needs priorities, they belong in game data, not the lore file.
4. **Added headings:** accepted (step 2).
5. **New era block:** accept "LEGACY OF THE SITH — 3,624–3,600 BBY". The last dated event is c. 3,622 BBY; the rest of the range is empty on record.
6. **Overlapping ranges:** tidy them. COLD WAR 3,653–3,642; GALACTIC WAR (SECOND) 3,642–3,636 (the Treaty officially collapses midway through 3,641); WAR AGAINST ZAKUUL 3,636–3,630; POST-ETERNAL EMPIRE 3,630–3,625; LEGACY OF THE SITH 3,624–3,600. Move rows to match.
7. **Date format:** the timeline keeps "3,681 BBY"; the parser accepts both (step 2).
8. **Sim seeds and Legacy framework:** move both to game data or a spec file, wherever the code reads them, and say where in the report. Re-date the faction seeds to the 3,661 BBY start: blockade active, riots ongoing, Mandalore the Lesser leading the clans, the Rim Campaign starting. Drop their unsourced comments ("Temple restaffing", "rationing easing").
9. **Blockade end:** 3,660 BBY (batches 14 and 15).
10. **Mandalore the Lesser:** took the title in 3,667 BBY; killed by Artus Lok c. 3,660 BBY (batch 15).
11. **Peace offer:** 3,654 BBY; the Alderaan conference and the Sacking are 3,653 (batches 7 and 14).
12. **Zym:** killed by Braden on Coruscant after the Treaty, 3,653 BBY (batch 19).
13. **Janarus:** the three dates fit a four-year term, given the Chancellor elections listed for 3,653, 3,645 and 3,641. He is elected in 3,653, shortly after the Treaty (the *Encyclopedia*'s "immediately"; Am-Ris is interim until then), and re-elected in 3,649 and 3,645. He is killed in 3,640.
14. **Satele as Grand Master:** 3,651 BBY ("by 3,645" is consistent with it).
15. **Galactic War start:** the Treaty collapses midway through 3,641 BBY. The 3,642 events (Balmorra freed, Taris invaded, the Maelstrom raid) are the Cold War's last flare-ups (batch 6).
16. **Rhen Var:** the sources say only "the war's final years". Game default: c. 3,654–3,653 BBY, tagged [inferred], matching the character files' "around 3,653". So it is not an active front in 3,661.
17. **Minos campaign:** fighting ends with the peace offer in 3,654; the Empire withdraws in 3,653. Both stand.
18. **Chiss alliance:** in place from the start of the war (the Ascendancy is the Empire's only true ally from 3,681, batch 18). The formal treaty terms were negotiated during the war. Both stand.
19. **Belsavis:** the Imperial invasion and the Dread Masters' release in 3,641 BBY; Darth Ekkage dies there in 3,641.
20. **Deaths at the war's start:** follow the event each death is tied to. Ardun Kothe dies in 3,641 (the Quesh war); Wyellett in 3,641 (fighting on Hoth); Rycus Kilran in 3,642 (the Maelstrom raid).
21. **Later SWTOR dates:** Iokath rediscovered 3,631 BBY, the war on Iokath 3,629; Mek-Sha missions spanning 3,627–3,626; Plan Zero spanning 3,642–3,641 (correct Power Structures' 3,643).
22. **Player-choice branches:** use the version on Wookieepedia's year pages (Acina dies and Vowrawn becomes Emperor at Iokath; Malcom lives). The class protagonists' outcomes are background, by title only. Whether the player can take the KOTFE/KOTET leader role stays on the design backlog (batch 12).
23. **Minor dates:** Bomodon 3,674–3,673 (batch 14); First Bothawui 3,671 (batch 17); Elara Dorne born 3,669 (batch 19).

## Step 4: matching edits elsewhere
Apply these to the files batch 19 just updated, and to any topic file that has the old date:
- **Era 09 character files and the canon roster:** Ardun Kothe dies 3,641 (not c. 3,642); Wyellett 3,641; Darth Ekkage 3,641 (not 3,640); Rycus Kilran 3,642 (not c. 3,641); Janarus elected 3,653, re-elected 3,649 and 3,645. Silara and Gaul Panteer die "several years after 3,653" (the character file's version; the year page's listing under 3,653 is the minority version).
- **`SW_SWTOR_Era_Power_Structures`:** Plan Zero 3,642–3,641; Belsavis 3,641; Galactic War from mid-3,641 (ruling 15).
- **`SW_Great_Galactic_War_Part1`:** add the Chiss timing note (ruling 18). Correct the Jedi fleet to Minos and the end of the Rimma blockade from 3,681 to 3,680. Correct Second Bothawui to a Sith retreat, not a Sith victory.
- **`SW_Republic_Military_GGW_Part1`:** Rhen Var default c. 3,654–3,653 (ruling 16).
- **The 3,661 statuses from batch 19:** check them against the timeline's 3,661 row. In particular: Ngani Zho takes Theron to Monastery c. 3,661; Prince Shange and Lord Raxxus are imprisoned on Belsavis; the Rim Campaign is starting.

## Not needed
The bot offered to check the few old rows it skipped (the Senate accepting the peace offer over Jedi warnings, the Jedi returning to Coruscant, the "tribute" to Zakuul). Not needed now; leave them as unchecked in Part 3.

## Decisions
Enter as D-entries, numbered in sequence at entry time:
- Timeline slice rulings 1–23 (one entry).
- The year-label rule and the era ranges (one entry).
- The move of the sim seeds and Legacy framework, and the 3,661 re-dating (one entry).
- The parser change, if any (one entry).

## Tests and checks
`npm test`, typecheck, lint, and the lore index rebuild with its diff. If the sim seeds feed the harness, run the affected suites one at a time and report any gate that moves.

## Report
Write `docs-v2/reports/lore-batch-20.md`: files added, rows removed from the old timeline, parser changes, where the seeds and framework went, the edits to other files, D-entries, test results. Commit.
