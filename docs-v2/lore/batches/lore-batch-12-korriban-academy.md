# Lore batch 12: the Sith Academy on Korriban

One commit. Run after lore batch 11. Lore and design defaults only; no code. It does give the "Sith academy run" sim on the M6 checklist its anchors.

## Inputs
Copy into `Docs/SWRPG lore/`:
- `SW_Korriban_Academy_Part1.md`
- `SW_Korriban_Academy_Part2.md`

Add both to the lore index and mark the topic done in `docs-v2/lore/RESEARCH_QUEUE.md`.

## Cross-check with existing files (decision 12)
The bot couldn't see `SW_Sith_Academies_Training_OldRepublic.md` or `SW_Sith_Training_AllEras*`. Compare their Korriban content with the two new files:
- where they agree, change nothing;
- where the old files contradict the new ones, the new files win (they were researched under the current rules). Correct the old text and list each change in the report;
- anything in the old files that the new ones don't cover stays, tagged `unverified`, and goes into `RESEARCH_QUEUE.md` for a check.

## Rulings on the 13 decisions (Part 2)
1. **Main academy:** Korriban is the destination for new acolytes in game from 3681 BBY, as batch 9 set. It is sourced as the main academy from 3653 BBY; for 3681–3653 it is tagged [inferred]. The default start (3661 BBY) falls in the inferred stretch, which is acceptable.
2. **Dromund Kaas academy, 3681–3640:** a lesser academy, tagged unconfirmed. This matches batch 9.
3. **Founding:** an ancient site (the Ritual Chambers are older); the academy itself was founded in 3996 BBY by Exar Kun's disciples.
4. **Admission:**
   - Force-sensitive slaves from the Great Galactic War (the Emperor's decree);
   - aliens in small numbers early (the Rattataki rumour), then widely from the Cold War;
   - every Force-sensitive in Imperial territory by law from the Cold War.
   In 3661, an alien acolyte is rare and faces open prejudice.
   **Narrow the Dromund Kaas file:** in `SW_Dromund_Kaas_KaasCity_OldRepublic_Part1/2`, change "Korriban for all Force-sensitives after 3681 BBY" to:
   - during the war (3681–3653), only the decree sending Force-sensitive slaves is dated;
   - the law covering all Force-sensitives in Imperial territory is attested from the Cold War.
   In game, an Imperial-born Force-sensitive in 3661 still goes to Korriban by default. In wartime that is custom and family ambition, not law [inferred]; the lesser Dromund Kaas academy is the alternative.
5. **Killing rivals:** an "unauthorized murder" is punishable by death. Killings ordered or sanctioned by staff, or protected by a powerful patron, go unpunished. Most acolyte killings are staged as tomb accidents. The killer still takes the dark deed under the M6 rules.
6. **Dreshdae:** built over in this era. The three-days'-walk figure is from another era.
7. **Library keeper:** whoever heads the Sphere of Ancient Knowledge at the time. Thanaton holds the post only from 3640 BBY.
8. **Sphere responsible:** the Dark Council owns the academy and the Sphere of Ancient Knowledge supervises it [inferred].
9. **Tremel and Harkun:** both killed (c. 3643 and 3640 BBY).
10. **Kallig's class:** six.
11. **SWTOR protagonists:** the Warrior/Wrath and Inquisitor/Nox are title-only canon NPCs, consistent with batch 6. Their trials are background events. Player characters are other acolytes in the same years. See the protagonist ruling below, which closes the batch 6 question.
12. **Developer files:** see the cross-check section above.
13. **Tomb of Ludo Kressh:** include it in the Valley, tagged as attested only in 3951 BBY.

## Ruling on SWTOR protagonists (closes the open question from batch 6)
- Players cannot take over a SWTOR class-story protagonist. All eight stay title-only canon NPCs whose paths a player character can cross: as allies, rivals, patrons or enemies, consistent with their recorded deeds and dates.
- **Later expansions (design backlog, not now):** consider letting the player become the leader figure during the KOTFE/KOTET era (the Outlander / Alliance Commander role), possibly in place of the canon Outlander. Undecided; it needs its own design pass. Add it to the design backlog (`docs-v2/spec` or wherever deferred design items live).

## Who is on Korriban in 3661 BBY (default start)
- **On record as active then:** Tremel (an Overseer for decades), Ragate (reopened the Ritual Chambers during the war), Spindrall (hermit in Ajunta Pall's tomb), the Dark Honor Guard, and the Children machinery in the depths. The Republic attack of 3678 BBY is recent history.
- **Not in post yet:** Harkun (he trained there himself; still an acolyte or junior then [inferred]) and Zash. Don't place either as staff in 3661.
- **Only in the Cold War:** Rance, Cestus, Sathel, Ardran, Markan, Loun, Samus, Knash, Arzanon. Don't place them in 3661.
- Other staff the start needs are invented, tagged `invented`.

## Design defaults for the gaps (tagged `invented`)
- **Age on arrival:** usually 10 to 18; Teneb Kel at about 14 is the one anchor.
- **Length of stay:** one to four years. Prodigies reach apprenticeship much faster (as the Warrior and Kallig did).
- **Class:** an Overseer runs a cohort of 6 or 7 acolytes; groups compete for a visiting Lord's notice.
- **Routine:** the narrator invents meals, wake times and lessons, within the attested rooms (dormitories, lecture, meditation and training chambers, library, jail).
- **Acolyte dress:** plain dark robes (`invented`). Staff wear black and red (on record). The acolyte's weapon is a warblade; the lightsaber comes with apprenticeship (on record).
- **Unchosen acolytes:** of the sourced outcomes (executed, killed in trials or by rivals, sent home, retrained by Spindrall for re-entry, kept as never-Sith hangers-on, deserting into the tombs), use those. Military or Intelligence service and re-enslavement are invented outcomes, tagged as such, used sparingly.
- **Mortality:** high. The sources say only one of many may survive a trial. The sim (below) should reflect this.

## M6 checklist: Sith academy run sim
Calibrate it against these anchors:
- a cohort of 6–7 under one Overseer;
- the trials on record (tomb retrieval, prisoner judgment, the rite of blood and bone, wilds survival, a beast hunt);
- death in trials and by rivals is common;
- the visiting Lord chooses the apprentice, not the Overseer;
- typical stay one to four years, prodigies faster.
Add these to the checklist item; the sim itself is built when that item comes up.

## Decisions
Enter as D-entries, numbered in sequence at entry time:
- Korriban academy rulings 1–13 (one entry).
- The 3661 roster rule and the gap defaults (one entry).
- SWTOR protagonists stay NPCs; no player takeover. The KOTFE/KOTET leader role is on the design backlog (one entry).

## Report
Write `docs-v2/reports/lore-batch-12.md`: files added, the old-file cross-check results, D-entries, checklist update, backlog item added. Commit.
