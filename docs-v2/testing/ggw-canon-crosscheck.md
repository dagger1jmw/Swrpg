# Great Galactic War: lore vs canon data cross-check

2026-11-21, lore batch 7. **Report only. No data changed; these wait for Jared's ruling.**

**Status (lore batch 19, D-390, D-391):** all eight are settled. #2 was settled in batch 13 (D-378 [2]); the other seven were folded into batch 19, where the new SW_Characters_09_GGW_ColdWar files win. How each was settled is in docs-v2/reports/lore-batch-19.md. One new difference is flagged: the new file has Satele made Grand Master in 3651 BBY, against D-283's c. 3648.

**What was compared:**
- **Lore:** the dated events and the "who was where" table in `Docs/SWRPG lore/SW_Great_Galactic_War_Part1.md` to `_Part3.md` (Part 3 has the table).
- **Canon data:** the NPC data in `src/data/canon/era09GreatGalacticWar.ts`, using birth and death years, `earlierRoles` and notes.
- **Logged dates:** Satele Shan's (D-152, D-283). Padawan at Korriban in 3681, Knight by 3667 and in 3661, Master 3651.

In the canon data, an `earlierRoles` entry means the role is held "until (and including) the year `untilBby`".

## Mismatches

| # | NPC | Canon data says | Lore or log says | Size |
|---|---|---|---|---|
| 1 | **Satele Shan** | Knight until 3654 BBY, so a Master from 3653 | D-283: Master and Council seat in **3651** BBY | 2 years early |
| 2 | **Satele Shan** | Padawan until 3678 BBY, so a Knight from 3677 | GGW Part 3: in 3677–3668 she "trained under Dar'Nala" at the Temple. Knight first named at Alderaan, 3667. The log says only "Knight by 3667" | Possible. Training under Dar'Nala in 3677–3668 reads as still a Padawan, but neither source gives a Knighting date |
| 3 | **Grand Master Zym** | Note: "killed in the Sacking of Coruscant (3,653)" | GGW decision [2] (D-363): he survives the Sacking and is killed afterwards, by Braden, still in 3653 | The death year agrees; the note is wrong |
| 4 | **Darth Malgus** | Acolyte until 3678 BBY; note: "Darth Vindican's apprentice at Korriban (3,681)" and "leads the Sacking of Coruscant (3,653)" | Part 3: already a **Lord** at Korriban in 3681; Darth c. 3667. At the Sacking he led the **Temple assault** and orbital security; **Darth Angral led the Sacking** | The 3681 rank (acolyte vs Lord) and who led the Sacking |
| 5 | **Darth Angral** | Note: "commands the orbital fleet at the Sacking (3,653)" | Part 3: led the Sacking, then provisional governor; Dantooine | Role at the Sacking (pairs with #4) |
| 6 | **Syo Bakarn** | Born 3725 BBY (estimate) | Part 3 and decision [11]: born c. **3678** BBY; a Knight at Rhen Var c. 3653 | 47 years. The canon estimate makes him 72 at Rhen Var, where the lore has him in his mid-twenties |
| 7 | **Gnost-Dural** | Jedi Master with no earlier roles (born 3760, estimate) | Part 3: a **Knight** at Eliad in 3680 BBY; Hydian Way commander in 3661 BBY | No Knight period before Mastery; date of Mastery unknown |
| 8 | **Mandalore the Lesser** | Not in the roster | Installed by Imperial Intelligence in 3667 BBY; Hydian Way blockade 3661; dies c. 3660 (D-363 [5], [6]) | Missing NPC. Mandalore the Vindicated (Artus Lok, born 3705) is present |

## Consistent (checked)

- **Jace Malcom:** a soldier until 3667, then an officer. Matches Corporal at Korriban in 3681 and Captain at Alderaan in 3667 (decision [9]).
- **Theron Shan:** born c. 3666 (decision [10]).
- **Ven Zallow:** killed in the Temple, 3653.
- **Jaric Kaedan:** captured the Dread Masters, 3668.
- **Darth Marr:** born 3702. He arrested Calypho c. 3678 and was one of the 7 surviving Councilors in 3653.
- **Darth Mekhis:** Sphere of Technology through the war; born 3720.
- **Shae Vizla:** Alderaan 3667 and the Sacking; born 3690.
- **Grand Moff Kilran:** "Butcher" at the Sacking.
- **Kao Cen Darach:** dies at Korriban, 3681.
- **Darth Thanaton:** Korriban 3678 is consistent with a Lord from then (D-362's nuance).
- **Orgus Din:** at Minos through 3681–3654, then the Coruscant Underlevels in 3653. Nothing in the canon data conflicts.
- **The default start (3661):** Zym alive at the Coruscant Temple and Satele a Knight. Both match the canon data.
