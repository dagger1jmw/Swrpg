# Lore batch 13: Jedi life at the Coruscant Temple during the Great Galactic War

One commit. Run after lore batch 12. Lore and design defaults only; no code.

## Inputs
Copy into `Docs/SWRPG lore/`:
- `SW_Jedi_Temple_Life_GGW_Part1.md`
- the corrected `SW_Korriban_Academy_Part1.md` and `_Part2.md` if the bot has sent them (they replace the batch 12 copies; same content, plus the 8-point checklist and the "Changes from the previous file" section)

Add the new file to the lore index and mark the topic done in `docs-v2/lore/RESEARCH_QUEUE.md`.

## Cross-check with existing files (decision 10)
The bot couldn't see `SW_Jedi_Daily_Life_Training_OldRepublic.md`, `SW_Jedi_Training_AllEras_Part1.md` or `SW_Jedi_Order_Ranks_Council_OldRepublic.md`. Compare their 3681–3653 BBY content with the new file, using the same rule as batch 12:
- where they agree, change nothing;
- where they contradict the new file, the new file wins. Correct the old text and list each change in the report;
- post-Ruusan *Jedi Path* detail that the old files present as fact for this era gets the tag "later-era default" (ruling 1), not deletion;
- anything else not covered stays, tagged `unverified`, and goes into `RESEARCH_QUEUE.md`.

## Rulings on the 11 decisions
1. **Daily-life defaults:** adopt the post-Ruusan *Jedi Path* details as defaults, tagged "later-era default", with two exceptions:
   - **Adopt:** Initiate clans (about ten, with fosterers), refectories, the daily schedule (Force studies, politics, history, physical training, meditation), and plain tunics.
   - **Do not adopt:** the Padawan braid and severing ceremony, the annual selection tournament, and the age limit for selection. They contradict this era's attested practice: Padawans served several Masters, Knighthood came in the field, and older recruits were taken. A narrator description of a Padawan in 3661 has no braid.
   - Wartime colour: many Initiates and Padawans are away with Masters at the front, so the Temple feels emptier than in peacetime [inferred].
2. **Satele's Knighthood:** she completed some Trials under Darach in 3681 BBY and became a Knight under Dar'Nala, before 3667 BBY (Alderaan).
3. **Invented Temple rooms:** confirmed. Any room not on record stays `invented`, per batch 8's layout rule.
4. **Devaron strike:** heavy losses; survivors, Gnost-Dural among them, retreated to Devaron. The "five squadrons" figure in the Great Galactic War file stays, tagged unconfirmed.
5. **Council deaths in 3653 BBY:** six in the Sacking; Zym dies afterwards in the ruins. This matches batch 7.
6. **Recruitment age:** normally young children; older recruits are allowed as exceptions (Kaedan at twelve, Bestros as a youth). This is the rule for a Jedi PC who starts late.
7. **Corellian Jedi academy:** include it, existing by 3653 BBY, founding date [unclear]. Its distinct customs (green robes, marriage allowed, Jedi Credits) make it a possible alternative Jedi start, noted for M7.
8. **Malachor III:** mid-war, no fixed date. In a 3661 start it may be recent history or a rumour; don't place it after 3661.
9. **SWTOR protagonists:** the Hero of Tython and the Barsen'thor are excluded from the 3681–3653 setting (they belong to the Cold War). This follows the protagonist ruling in batch 12.
10. **Developer files:** see the cross-check section above.
11. **Lightsaber Training §2:** rewrite to follow the Padawan page: Core World politics before the war; the shift to military readiness and diplomatic service during wartime liaison with the Republic military; completed in the Cold War after the move to Tython.

## Edits to earlier files (from the file's "Changes from the previous file")
- **`SW_Great_Galactic_War_Part1`, "The Jedi at war":** add that Masters including Gnost-Dural led the strike near Devaron; the Council's reluctance and its motives (not pulling Knights from the Sith fronts, suspicion of Mandalorian goading, duty to the starving poor); the outcome per ruling 4; and the Jedi starfighter fleet supporting the 3660 BBY relief.
- **`SW_Great_Galactic_War_Part3` and `SW_Coruscant_Jedi_Temple_Part1`:** record the six-vs-half Council deaths conflict and resolve it per ruling 5.
- **`SW_Coruscant_Jedi_Temple_Part1`:** mark the Tython decision confirmed (the Order was briefly homeless after the Sacking, then resettled Tython). Add Shol Bestros as a Master and mentor at the Temple, and the Battlemaster post (Darach, until 3681 BBY).

## Who is where in 3661 BBY (default start)
- **On Coruscant:** Satele Shan (Knight, recalled this year, witnessing the riots); Shol Bestros (mentor); Grand Master Zym [inferred].
- **At the front:** Ven Zallow (Rim Campaign); Gnost-Dural (the Devaron strike, then the fleet); Orgus Din; Jaric Kaedan; Bela Kiwiiks; Aryn Leneer; Syo Bakarn (a young Padawan, about 17).
- **Hidden:** Ngani Zho, raising Theron (about 5) away from the Order's eyes.
- **Location unknown in 3661:** Dar'Nala (on Coruscant in 3671) and Tol Braga. Place them where a story needs them, consistent with their recorded deeds.
- **Dead by 3661:** Darach (3681), Belth Allusis (3671), Wyellett (lost 3665).

## Game hooks recorded (from the file's Game notes)
- Apprenticeship as a sequence of Masters, with field postings to specialists.
- The 3661 Hydian Way crisis as an event chain: Council debate, the Devaron strike, food riots, surrender talk, smuggler relief in 3660.
- A Padawan PC could be an unknowing Child of the Emperor (the Bakarn pattern). This is a heavy hook; flag it for M7 design, not a default.

## Decisions
Enter as D-entries, numbered in sequence at entry time:
- Jedi Temple life rulings 1–11 (one entry).
- The 3661 Jedi roster (one entry).

## Report
Write `docs-v2/reports/lore-batch-13.md`: files added, the old-file cross-check results, the edits to earlier files, D-entries. Commit.
