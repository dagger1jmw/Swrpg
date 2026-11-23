# Lore update, 2026-11-22 (from the lore chat)

Two commits: (1) the lore files, the hard rule and the index; (2) the date-driven game data (D-440 to D-442).

## The hard rule (D-438)
Lore files hold plain dated facts, never era-window framing, unless a file is explicitly scoped to one era. Catalogs are single dated lists; the game resolves status from the start year. In CLAUDE.md (Lore Files) and decisions.md.

## Files (D-439)
- New: SW_Malachor_V, SW_Tython, SW_Korriban_Planet, SW_Dromund_Kaas_History, SW_Ossus, SW_Kolto_Bacta, SW_Holocrons, SW_Meditation, SW_Lightsaber_Crystals.
- Era framing removed: SW_Force_Nexus_Vergence, SW_Temple_of_Eedit, SW_Dagobah, SW_Ilum_Temple_CrystalCaves.
- SW_Lightsabers_Crystals_Materials_AllEras: the crystal table is a pointer to SW_Lightsaber_Crystals.
- Deleted: SW_Dromund_Kaas_After3653 (replaced by SW_Dromund_Kaas_History).
- Lore index (README.md) and research queue updated.

## Game data (commit 2)
- D-440: Malachor V (nexus bonus ends 3951 BBY; a wreckage field on the map after 3951; story notes), Tython (Kalikori; no ordinary settlement), Dromund Kaas c. 3636–3631 (Acina, a blockaded vassal of Zakuul), Korriban (the Zakuul bombardment c. 3636, later rebuilt), Ossus (a ruin from 3996; the colony after 3636; the invasion of 3628), the healing fluid by date and the kolto supply event of 3625.
- D-441: src/data/holocrons.ts and the start-year selection for the narrator.
- D-442: src/data/crystals.ts.
