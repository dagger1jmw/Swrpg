# Lore batch 20: galaxy timeline, slice 1 (c. 3,700–3,600 BBY)

2026-11-21. Batch file: `docs-v2/lore/batches/lore-batch-20-timeline-3700-3600.md`. Decisions: D-393 (rulings 1–23), D-394 (year labels and era ranges), D-395 (sim seeds and Legacy framework), D-396 (parser).

## Files added
- `Docs/SWRPG lore/SW_Timeline_3700_3600BBY_Part1.md`: 3,700–3,653 BBY, with state-of-the-galaxy paragraphs for 3,665–3,655.
- `Docs/SWRPG lore/SW_Timeline_3700_3600BBY_Part2.md`: 3,653 to c. 3,622 BBY.
- `Docs/SWRPG lore/SW_Timeline_3700_3600BBY_Part3.md`: the row-by-row check of the old file, conflicts, decisions and sources.

Parts 1 and 2 were edited to follow the rulings: conflict rows were settled and their tags dropped; Rhen Var moved to 3,654 BBY; the 3,642 rows moved to the Cold War; the 3,629–3,628 rows moved to the Post-Eternal block; the era headings and year labels were fixed; the "(proposed heading)" text was dropped. Part 3's Decisions section now records that Jared ruled all 23 items, that the section order is settled, and that the skipped old rows stay unchecked. All three files named the old timeline `OLD_SW_Legends_Galaxy_Timeline.md`; the file keeps its name, so the references were corrected.

## Rows removed from the old timeline
From `SW_Legends_Galaxy_Timeline.md`, 252 lines in all:
- The six OLD REPUBLIC RECOVERY rows from ~3,700 to ~3,682 BBY. The era's heading, overview and its ~3,950 and ~3,900 rows stay.
- The whole GREAT GALACTIC WAR, COLD WAR, GALACTIC WAR (SECOND), WAR AGAINST ZAKUUL and POST-ETERNAL EMPIRE blocks, through the "~3,625 BBY" rows.
- The LEGACY CHANGE FRAMEWORK and GALAXY SIM FACTION STATE SEEDS blocks, and the "Version 3.1" note between them.

A one-line pointer to the slice files takes their place.

**Where the record went:** the removed text is in `docs-v2/lore/superseded/SW_Legends_Galaxy_Timeline_3700-3600BBY_old-rows.md`. The batch asked for "the superseded location batch 19 used", which was an `OLD_` file in `Docs/SWRPG lore/`. Batch 19 only renamed an existing file, but this record is a new file, and CLAUDE.md forbids new files in `Docs/`, so it went to docs-v2. If you want it beside the lore files, say so.

## Parser changes (src/lore/parse.ts, D-396)
- **Files:** `SW_Timeline_*_PartN.md` files get file key `tl`. They are read after the old file as one timeline, so era chunk ids are unchanged. Old Republic Recovery, which both files open, merges its overview and rows. Part 3 has no era headings and adds nothing.
- **Columns:** columns are found by header, so the old layout (Key Figures, Location) and the new one (Who, Place) both read.
- **Downstream:** the parser never read the fifth column, and nothing else in `src/` reads Downstream, so no consumer is affected. The Legacy Change framework (now in spec 14) is the only text that refers to the tags, and no code implements it.
- **Story text** drops:
  - citations;
  - research tags ([conflict], [inferred], [unclear], [BTS]);
  - asides about the files ("(see … row)", "(SW_… gives …)", "(ruling N)");
  - "[conflict] …" notes after a sentence;
  - overview sentences about the file itself.
- **State paragraphs:** a "State of the galaxy" paragraph becomes the first row of its year.
- **Dates:** "Year 0 (war begins)" headings and "between X and Y BBY" dates now read. Dates with and without the thousands comma were already read; they now have a test.
- **Overview dating (refines D-98):** a sentence naming its era's own span is dated to the era's start. Without this, "a war from 3,681 BBY to 3,653 BBY" would have been held back until 3,653.
- **Places:** asides are removed from a Place cell before it is split, " to " splits a route, and "other" is not a place. Row text now shows the place even when no one is named.

**Lore index rebuild (before → after):**
- Chunks: 775 → 820.
- Entities: 574 → 574.
- Location vocabulary: 216 → 248.
- Slice-era timeline chunks: 47 → 92. 5 removed (rows that moved to another year or era), 50 added, 40 changed.

Outside the slice:
- Two timeline chunks changed: the Yuuzhan Vong War overview lost the junk place "aftermath", and a 32 BBY row lost the aside "(see continuity notes …)".
- 41 character chunks changed only in their location tags (the vocabulary changed).
- Three character chunks also changed text, from this batch's lore edits: Kothe, Janarus and Kilran.

The vocabulary lost 18 junk or old-row places (for example "brentaal iv through entire galaxy", "geonosian arena") and gained 50 real ones (Belsavis, Quesh, Ord Radama and others). One junk place is left: "satele shan mind", from the Place cell "Satele Shan's mind". It is harmless.

**Year labels (ruling 2):** the only code that reads the labels is the parser's "year N" mapping, which handles N = 0. It is tested.

## Sim seeds and Legacy framework (D-395)
Both blocks moved to `docs-v2/spec/14-world-state-and-events.md`, in a new section, "Moved from the lore timeline". No code reads either one.
- The framework text is unchanged.
- The faction seeds are re-dated to 3,661 BBY: the blockade is active, riots are ongoing, Mandalore the Lesser leads the clans, and the Rim Campaign is starting. The unsourced comments are dropped.
- The seed numbers are the old values, unreviewed.

The seeds feed no harness suite, so no suite was run.

## Edits to other files
**Era 09 character files:**
- Kothe and Wyellett die in 3,641; the Index, Part 1 entries and the timeline rows are updated.
- Ekkage dies in 3,641 on Belsavis (Index, Part 2 table and timeline).
- Kilran dies in 3,642 (Index, Part 3b entry and timeline).
- Janarus was elected in 3,653 and re-elected in 3,649 and 3,645 (Part 3a).

**Canon roster:**
- Death years changed: Kothe 3,641, Wyellett 3,641, Ekkage 3,641, Kilran 3,642.
- Janarus's summary adds his terms.
- Silara and Gaul Panteer: the death year was 3,653 (the generator misread "several years after 3,653"). It is now 3,650, marked as an estimate.
- Darth Malgus is unavailable until 3,629; he is revealed alive at Ossus c. 3,628 (was "resurfaces ~3,629").

**3,661 statuses:**
- Ngani Zho: from "not stated" to active, taking Theron to Monastery c. 3,661. Theron's note adds this.
- Prince Shange and Lord Raxxus are not in the roster; the timeline's 3,661 row covers them.
- The Rim Campaign notes already said c. 3,660 and stay as they are.

**SW_SWTOR_Era_Power_Structures Part 1 and Part 2:**
- Plan Zero moved from the 3,643 row to a new 3,642–3,641 row.
- New row: Belsavis, 3,641. Neither part had one.
- The Galactic War starts in mid-3,641; the start-date decision is marked as ruled.

**SW_Great_Galactic_War_Part1:**
- Chiss timing note added.
- The Minos Cluster Campaign row now starts in 3,680, when the Jedi fleet arrived. It said 3,681.
- The Rimma blockade already ended in 3,680, so no change was needed.
- Second Bothawui is now a Sith retreat. The file said "A draw", not "Sith victory".

**Rhen Var (c. 3,654–3,653 [inferred]):**
- SW_Republic_Military_GGW_Part1: the two "war's end" lines get the date.
- SW_Great_Galactic_War_Part3: two rows, which said 3,660–3,653. The Seventh Fleet keeps 3,660–3,653.

**Citations:** "Timeline :NNN" line citations in `src/data` and in two docs (orderSeats, combat.config, npcGen.config, the Era 09 roster, architecture.md and lore-checks.md) now point to the slice, or to the lines' new numbers, which are 252 lower. Citations inside earlier decisions are left as historical. lore-checks.md also notes that the "Temple on rationing" row was dropped as unsourced.

**Queue and index:** RESEARCH_QUEUE.md and README.md list the three slice files. The timeline brief is marked "slice 1 done", stays open for the other eras, and gives the format to use. The Done section has an entry.

## Questions for Jared
1. **Order seat 3,653–3,650.** `src/data/orderSeats.ts` puts the Order on Tython from 3,653 BBY. The slice dates the move to 3,650 (the Temple there was finished in 3,647). Should 3,653–3,650 read as Coruscant (the ruined Temple)? Unchanged until you rule.
2. **Xerender.** He died with Wyellett at Hoth (c. 3,642 in the character file). Ruling 20 moved Wyellett's death to 3,641 but did not name Xerender, so he stays at c. 3,642. Should he follow Wyellett?
3. **Panteer death year.** I set 3,650, marked as an estimate, from "several years after 3,653". Pick another year if you prefer.

## Tests and checks
- `npm test`: 107 files, 1,133 tests, all pass (16.5 s).
- `npm run typecheck`: clean.
- `npm run lint`: clean.
- **Lore tests:** the D-98 overview test was rewritten for the new overviews. It had checked sentences from the old Great Galactic War overview, which the slice replaced. New tests:
  - parsing the slice layout on a small fixture (header-mapped columns, tag and aside removal, state paragraphs, era merge, Year 0 and span dating);
  - years with and without the comma, and "between";
  - the real slice: no research notes left, Rhen Var at 3,654–3,653, and the 3,642 rows in the Cold War.
- **Harness:** not run. No lifetime, spread, mortals, severs, sweep or Orgus suite reads the timeline, the seeds or the canon roster (D-391).
