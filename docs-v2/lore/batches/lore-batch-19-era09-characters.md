# Lore batch 19: Era 09 characters (redo) and the canon roster

One commit, or two if the parser change is large (see step 3). Run after lore batch 18.

This batch replaces the pre-bot `SW_Characters_09_GreatGalacticWar_ColdWar.md` with the research bot's redo and brings the built canon roster in line with it. The game's default start is 3661 BBY, so the roster is the most important part.

## Inputs
Copy into `Docs/SWRPG lore/`:
- `SW_Characters_09_GGW_ColdWar_Index.md`
- `SW_Characters_09_GGW_ColdWar_Part1.md` (Jedi and light-side users, 39)
- `SW_Characters_09_GGW_ColdWar_Part2.md` (Sith and dark-side users, 56)
- `SW_Characters_09_GGW_ColdWar_Part3a.md` (Republic non-Force figures, 39)
- `SW_Characters_09_GGW_ColdWar_Part3b.md` (Imperial non-Force figures, Mandalorians, underworld, 49)

183 characters in all. The split of Part 3 into 3a and 3b is accepted.

## Step 1: retire the old file
- Move `SW_Characters_09_GreatGalacticWar_ColdWar.md` out of the `SW_Characters_*` glob so the lore index doesn't read both (e.g. to `Docs/SWRPG lore/superseded/`, or rename it with an `OLD_` prefix — whichever fits CLAUDE.md's rules for `Docs/`). Mark it superseded in the lore index and `RESEARCH_QUEUE.md`. Mark the Era 09 redo brief done.
- **Darth Nyriss** is Era 08 (died 3950 BBY). Keep her old entry text, moved to the Era 08 character file (`SW_Characters_08_DarkWars_SithTriumvirate.md`) if she isn't already there, and note there that her old forms (Makashi, Shii-Cho) contradict her page, which names Juyo.

## Step 2: rulings on the 20 decisions (Index)
1. **Zym's death:** killed by the bounty hunter Braden on Coruscant after the Treaty, 3653 BBY. This fits batch 13's "Zym dies afterwards, in the ruins"; add "killed by Braden" there. The Kiwiiks page's "in the Sacking" is the minority version.
2. **Syo Bakarn:** born c. 3678 BBY.
3. **Bela Kiwiiks:** a Master from 3663 BBY, including at Rhen Var.
4. **Warren Sedoru:** an acclaimed Knight in the war, a Master by c. 3642 BBY.
5. **Satele's knighting:** under Dar'Nala, before 3667 BBY (batch 13).
6. **Vitiate's defeat on Dromund Kaas:** 3640 BBY, matching the Power Structures timeline. The old file's 3637 is dropped as unsourced.
7. **Darth Jadus:** born 3688 BBY, tagged "speculated" (as the infobox marks it).
8. **Darth Angral:** a Sith Lord, not a Dark Councilor. He oversaw the Rim Campaign with the Council and led the Sacking fleet.
9. **Darth Thanaton:** on the Dark Council from c. 3643 BBY ("set for his ascension") until his death in 3640 BBY. Before that, a Darth in the Sphere of Ancient Knowledge. (Batch 12's Library-keeper ruling stands: whoever heads the Sphere at the time.)
10. **Darth Nyriss:** moved to Era 08 (step 1).
11. **Supreme Commanders:** keep batch 6's order: Rans, then Stantorrs late in the Cold War, Rans again briefly, then Malcom from 3640 BBY. Rans in 3661 is [inferred] (batch 17).
12. **Elara Dorne:** born 3669 BBY (her own infobox). Fix the Dromund Kaas file's "3665 BBY" row.
13. **Theron's conception:** after Alderaan (3667 BBY), which fits his 3666 BBY birth. The "after Korriban" line is the minority version.
14. **Bomodon:** keep batch 14's ruling, a ten-month campaign spanning 3674–3673 BBY.
15. **Janarus:** Wookieepedia's default. Killed by the Hunter in 3640 BBY aboard the *Founder*; the game's survival branch isn't used.
16. **Mandalore the Lesser:** died c. 3660 BBY; Artus Lok is Mandalore from then (batch 15). So the Vindicated is Mandalore at the Sacking.
17. **Vasil Dorne:** born c. 3703 BBY (page text); c. 3706 is the infobox variant.
18. **Suudaa Nem'ro:** died c. 3641 BBY (his own infobox).
19. **Hunter (Star Cabal):** died 3640 BBY aboard the *Star Chamber*. Don't state who killed her until it's confirmed; Cipher Nine is a title-only protagonist anyway.
20. **Section order:** the bot's template order is fine. No change needed in future files.

## Step 3: the lore index
`scripts/build-lore.ts` and `src/lore/parse.ts` read the `SW_Characters_*` files (D-81). The new files use a different layout (entry headings with bullet fields, plus tables for minor figures).
- Check whether the parser reads them correctly, including the table rows.
- If not, extend the parser to read the new layout. Don't change the lore files to suit the parser. Keep reading the old layout too, since the other eras' character files are still pre-bot.
- Rebuild the index and report: chunks added, removed and changed, and confirm no Era 09 character appears twice.
- If the parser change is more than a small addition, commit it separately first, with tests.

## Step 4: the canon roster (`src/data/canon/era09GreatGalacticWar.ts`)
Bring the roster in line with the new files. The lore files are the source of truth for facts; the roster's numbers are design.

**Facts to correct for existing entries** (each part's "Changes from the previous file" has the full list):
- Species: Vindican and Vowrawn are Purebloods; Exal Kressh is a Sith hybrid; Dar'Nala is a Togruta; Eleena Daru is a Rutian Twi'lek. The protagonists have no species (title-only).
- Dates: Baras died 3640 BBY; Jadus faked his death in 3643 BBY; Marr died c. 3636 BBY; Revan died c. 3642 BBY (temporarily) and 3637 BBY; Vindican died 3681 BBY.
- Fates: Malgus survives Ilum; Ngani Zho was killed c. 3643 BBY in the Vesla system, not by Malgus; Styrak died on Darvannis; the Dread Masters are prisoners on Belsavis from 3668 to c. 3641 BBY.
- Roles: Angral is a Sith Lord (ruling 8); Gnost-Dural was never "Keeper of the Archives"; Kaedan was never Battlemaster; Kilran was a captain at the Sacking, Grand Moff only after it; Saresh is Chancellor only from 3640 BBY; Mandalore the Lesser, not the Vindicated, reunited the clans.

**Design numbers:**
- Keep the old estimates wherever the sources are silent (all numeric values are; that's expected).
- Change the five the sources contradict:
  - Kao Cen Darach: Jar'Kai, not Ataru, as the main form;
  - Jaric Kaedan: Juyo-Kos (a Juyo variant, batch 10), with battle meditation added;
  - Darth Vowrawn: lower combat ratings (his page says age had probably weakened him), keeping his political and charisma strength;
  - Mandalore the Vindicated: drop "reunified the clans";
  - Darth Nyriss: removed (Era 08).
- Add forms and powers the sources name that the old file lacked: Gnost-Dural (Soresu, Djem So, Juyo); Scourge (Soresu, Juyo, Ataru); Baras (Soresu, Shien); Satele (telekinesis, tutaminis, foresight, telepathy). Leave the old file's unsourced forms in place as estimates unless they contradict.

**New characters:**
- Add every character in the new files that the roster lacks, with the sourced facts: species, sex, homeworld, birth and death, ranks by year, Masters and apprentices, named forms and powers, alignment and visible corruption.
- Characters who are **active adults in 3661 BBY** get provisional stats from the npc-generation rules (npc-generation §5), flagged `provisional` in the data. List them in the report for my review.
- Characters who are children, unborn or dead in 3661 BBY get facts only (no stats yet). The roster needs their birth years so the game can age them in.

**3661 status:**
- Add or update a per-character status for 3661 BBY from the Index's "Status in 3661 BBY" column: active (with location where stated), child (with age), unborn, dead, imprisoned, or not stated. This becomes the "who is on the board" filter for the default start.
- Keep the 3653 BBY status too, as the second snapshot.

**M6 hand-set alignment (checklist item 14):** use the new files' alignment and corruption notes for the canon NPCs that item covers. For example: Dar'Nala's red eyes from 3653 BBY; Zash's yellow eyes and decaying body behind a Force mask; Mekhis visibly warped; Revan's yellow dark-side eyes in his Sith past; Sajar and Praven redeemed; Tol Braga's fall in 3640 BBY.

## Step 5: edits to topic files (Index "Topic-file conflicts")
1. `SW_Dromund_Kaas_KaasCity_OldRepublic_Part1`: Elara Dorne born 3669 BBY (ruling 12).
2. `SW_SWTOR_Era_Power_Structures_Part2`: keep the Emperor's Dromund Kaas defeat in 3640 BBY (ruling 6), noting his page gives only a range.
3. `SW_Jedi_Temple_Life_GGW_Part1`: Kaedan's "born before 3691 BBY" (page text) and "before 3680 BBY" (infobox) are compatible. Add the infobox bound beside it.
4. `SW_Great_Galactic_War_Part1`: change "Malgus beheaded his wounded master" to "executed", as the Vindican page says.
5. `SW_Jedi_Temple_Life_GGW_Part1` and batch 13's roster: add "killed by Braden" to Zym's death (ruling 1).

## Decisions
Enter as D-entries, numbered in sequence at entry time:
- Era 09 character rulings 1–20 (one entry).
- The canon roster update: the corrected facts, the five changed estimates, the new characters, and the 3661 and 3653 status fields (one entry).
- The parser change, if any (one entry).

## Tests and checks
- `npm test`, typecheck, lint.
- Lore index rebuild, with the report from step 3.
- If any roster numbers feed the harness (canon levels, the duel table, Orgus or other named NPCs in the sims), run the affected suites (20 seeds, 8 workers, one suite at a time) and report any gate that moves.

## Report
Write `docs-v2/reports/lore-batch-19.md`: files added and retired, parser changes, index diff, roster changes (corrected, changed estimates, added, provisional stats for review), status fields, topic-file edits, D-entries, test results. Commit.
