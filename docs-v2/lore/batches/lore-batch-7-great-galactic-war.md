# Lore batch 7, 2026-11-21: the Great Galactic War (instructions for Claude Code)

Run this after lore batch 6. Read the whole file first, then carry it out in order. Don't change game code. One commit at the end.

## 1. Add the lore files

Copy into `Docs/SWRPG lore/` (research bot, reviewed in chat):
1. `SW_Great_Galactic_War_Part1.md` (3681–3667 BBY)
2. `SW_Great_Galactic_War_Part2.md` (3666–3660 BBY)
3. `SW_Great_Galactic_War_Part3.md` (3659–3653 BBY)

Mark the topic done in `docs-v2/lore/RESEARCH_QUEUE.md` and add the files to the lore index.

**Cross-check, report only:** compare the dated events and the "who was where" table (Part 3) with the canon timeline and NPC data in `src/data/canon/` (era 09 / Great Galactic War files) and the logged Satele Shan dates (Padawan at Korriban in 3681, Knight by 3667 and in 3661, Master 3651). List mismatches. Don't change data; I'll rule on them.

## 2. Log decisions in docs-v2/decisions.md (setting data)

Number them in sequence after the last D-number. Each entry names its lore file. Numbers in brackets are the bot's decision numbers.

- **[1] Peace process:** the Dark Council's offer comes in 3654 BBY; the Alderaan talks, the Sacking and the treaty in 3653 BBY.
- **[2] Grand Master Zym:** survives the Sacking and is killed afterwards (by Braden), consistent with the logged "killed after the fall of the Temple".
- **[3] Bomodon:** 3674 BBY (already logged in batch 6; no new entry needed if it exists).
- **[4] Hydian Way blockade:** 3661–3660 BBY, broken in 3660.
- **[5] Mandalore the Lesser:** dies c. 3660 BBY, after the Great Hunt he called; Artus Lok becomes Mandalore the Vindicated.
- **[6] Mandalorians:** Imperial Intelligence installs Mandalore the Lesser in 3667 BBY; the Mandalorians enter open war in 3661 BBY (the blockade).
- **[7] Outer Rim:** the Empire holds nearly half of it by c. 3671 BBY. "Finalized" refers to the end of the Seswenna campaign.
- **[8] Galaxy at the treaty:** roughly half under Sith rule (the main war page). The treaty's territorial terms in the power-structures file stand.
- **[9] Jace Malcom:** Corporal at Korriban (3681), Captain commanding Havoc Squad at Alderaan (3667). Treat "General" in 3666 as an error. He reaches General later.
- **[10] Theron Shan:** conceived after Alderaan (3667 BBY), born c. 3666 BBY (*Annihilation*). The author's 3670 BBY tweet stays as [BTS], not used.
- **[11] Battle of Rhen Var:** c. 3653 BBY. Syo Bakarn (born c. 3678) fights there as a Knight, which rules out a date soon after Alderaan.
- **[12] Havoc Squad:** a Great War unit (at Alderaan in 3667). The "formed after the move to Tython" line is treated as a page error.
- **[13] Ord Mantell:** no Great War battle there.
- **[14] Balmorra:** fighting from early in the war (by 3670 BBY at the latest), still contested at the treaty, with the resistance continuing into the Cold War.
- **[15] Admiral Greik's victory at Bothawui:** 3671 BBY.
- **[16] First Republic counter-offensive:** the Battle over Korriban (3678 BBY) is the first planned strike into Sith space. The 3680 BBY Seswenna and Minos fighting was defensive.
- **[17] "Brentaal campaign":** dropped (it was an error in my brief).
- **The default start (c. 3661 BBY) setting, as M7 input:** the Hydian Way blockade is starving Coruscant's lower levels, there are riots against the Senate and talk of surrender, a Jedi strike force has been wiped out near Devaron, Satele Shan (a Knight and war hero) has been recalled to Coruscant, and the Rim Campaign has begun. The Jedi are still at the Coruscant Temple under Grand Master Zym, and Berooken is in the latter stages of his chancellorship. No source covers Initiate life in wartime, so Temple routine uses the logged *Jedi Path* defaults.

## 3. Commit

One commit for all of the above.
