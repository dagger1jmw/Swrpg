# Lore batch 19: Era 09 characters (redo) and the canon roster

2026-11-21. Instructions: `docs-v2/lore/batches/lore-batch-19-era09-characters.md`. Decisions:
- D-390: the 20 rulings.
- D-391: the roster.
- D-392: the parser.

There are two commits. The parser change came first, with tests (`ac27899`), because it is more than a small addition. This commit does the rest.

## Files added and retired

- **Added (183 characters):**
  - `Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Index.md`
  - `_Part1.md` (Jedi, 39)
  - `_Part2.md` (Sith, 56)
  - `_Part3a.md` (Republic, 39)
  - `_Part3b.md` (Imperial, Mandalorian, underworld, 49)
- **Retired:**
  - `SW_Characters_09_GreatGalacticWar_ColdWar.md` is renamed `OLD_SW_Characters_09_GreatGalacticWar_ColdWar.md`. That takes it out of the lore index's `SW_Characters_*` glob, so the index doesn't read both files.
  - A rename isn't a new file, so CLAUDE.md's rule for `Docs/` holds.
  - It is marked superseded in the lore index and the research queue, and the Era 09 redo brief is marked done.
- **Darth Nyriss** (ruling 10):
  - Her old bench row moved into the Era 08 file's table (`SW_Characters_08_DarkWars_SithTriumvirate.md`).
  - The move carries a note that her old forms (Makashi, Shii-Cho) contradict her page, which names Juyo.

## Parser (D-392, commit ac27899)

The old parser read only the pre-bot layout. Two things went wrong with the new files:
- It needs a `## Era` line, so the new files would have produced nothing.
- All five new files would have shared the file key `c09`.

`src/lore/parse.ts` now reads the bot's layout alongside the old one:
- **Characters:** a `###` entry with a `**Type:** character` bullet is a character; the era comes from the H1 title.
- **Minor figures:** these are in tables, found by header (Name, Species/ID, Role/Office/Rank, the 3661/3653 column).
- **Ignored tables:** master index tables and "old estimate" tables add nothing.
- **Citations:** links are stripped from story text; table name cells keep their link text.
- **Aliases:**
  - `;`-separated parenthetical names become aliases ("Vitiate (the Sith Emperor; Tenebrae)").
  - So do quoted epithets and "X and Y" pairs.
  - An alias two figures of one set share is dropped. Scourge's old title "Emperor's Wrath" would clash with the Wrath protagonist.
- **File keys:** each part has its own key (`c09p1`, `c09p2`, `c09p3a`, `c09p3b`; the Index, `c09i`, adds no chunks).
- **Old layout:** unchanged, since the other eras' files still use it.
- **Tests:** a fixture covers the new layout (`tests/lore/lore.test.ts`).

## Index diff

| | Chunks | Entities |
|---|---|---|
| Before | 638 | 436 |
| After | 775 | 574 |
| Removed | 47 (the old Era 09 file) | |
| Added | 184 (183 Era 09: 70 entries, 113 table figures; 1 Era 08: Darth Nyriss) | |
| Changed | 0 | |

**No Era 09 character appears twice.** No figure in the Era 09 set shares an alias with another.

**Canon IDs follow the new headings.** For example, "Zym" gives `lore:zym`, where "Grand Master Zym" gave `lore:grand-master-zym`. The tests that named the old IDs or the old Satele wording were updated (lore, context, memory pipeline, roster).

## The seven open canon mismatches (batch 7; Jared's ruling: the new files win)

| # (crosscheck) | Mismatch | Settled by the new files | In the roster |
|---|---|---|---|
| 1 | Satele a Master from 3653 in the data, against 3651 (D-283) | "Made Grand Master after she rediscovered Tython, in 3651 BBY" | Knight until 3652, Master (Grand Master) from 3651. **Flag:** D-283 has Master and a Council seat in 3651 but Grand Master c. 3648; the new file puts Grand Master in 3651 itself. *Settled by "D-283 amended": Grand Master 3651, Master before 3651 (undated).* |
| 3 | Zym "killed in the Sacking" | Killed by the bounty hunter Braden on Coruscant after the Treaty, 3653 (ruling 1) | Note corrected; ID now `lore:zym` |
| 4 | Malgus an acolyte in 3681 vs a Lord; "leads the Sacking" vs Angral | Vindican's apprentice in 3681, a Sith Lord after Korriban, Darth c. 3667; in 3653 he led the infiltration of the Temple | Apprentice (`sithAcolyte`) through 3681, Lord from 3680; note corrected; survives Ilum |
| 5 | Angral "commands the orbital fleet" vs led the Sacking | A Sith Lord who oversaw the Rim Campaign and led the Sacking fleet and the attack on Coruscant, killing Berooken (ruling 8) | Note corrected; died 3643 BBY (lore) |
| 6 | Syo Bakarn born 3725 vs c. 3678 | Born c. 3678 BBY (ruling 2; "before 3678" is the infobox variant) | Born 3678 (lore); Padawan to 3654, Knight to 3644, then Master (estimate); died by 3640 (presumed, estimate) |
| 7 | Gnost-Dural with no Knight period | A Padawan at the Coruscant Temple, knighted on the day of the Tingel Arm news (c. 3681), a Master later; born years before 3685 | Padawan to 3681, Knight to 3654 (Master year an estimate); born 3705 (estimate, was 3760) |
| 8 | Mandalore the Lesser missing | An entry in Part 3b | Added (provisional; title 3667, died c. 3660) |

**Unsettled: none.** The D-283 flag above (when Satele became Grand Master, c. 3648 vs 3651) is settled by "D-283 amended": 3651.

## Roster changes (D-391)

### Corrected facts on the 45 existing sheets

| Kind | Changes |
|---|---|
| Species | Vindican and Vowrawn are Purebloods. Exal Kressh is a Sith hybrid (species `other`, noted). Dar'Nala is a Togruta (was Twi'lek). Eleena Daru is a Rutian Twi'lek. The seven title-only protagonists now have species `unknown` (Hero of Tython, the Barsen'thor, Emperor's Wrath, Darth Nox, Cipher Nine, the Grand Champion, Voidhound, Meteor) |
| Dates | Baras: born 3697, died 3640. Jadus: born 3688 ("speculated"), faked his death in 3643, no death year. Marr: died c. 3636. Revan: born c. 3994, died 3637 (c. 3642 temporarily); the Emperor's prisoner to c. 3643. Vindican: died 3681. Vowrawn: born 3716. Thanaton: born 3695, died 3640. Kilran: born c. 3692, died c. 3641. Orgus Din and Angral: died 3643. Mekhis: died 3643. Dar'Nala: died 3653. Tol Braga and Kaedan: died 3640. Acina: died 3629. Shae Vizla: died c. 3622. Aric Jorgan: born 3673. Kira Carsen: born 3663. Vitiate: defeat in 3640 (was 3637) |
| Fates | Malgus survives Ilum. Ngani Zho was killed c. 3643 in the Vesla system, not by Malgus. The Dread Masters are prisoners on Belsavis from 3668 to c. 3641 (the collective entry and the six individuals) |
| Roles | Angral is a Sith Lord. Gnost-Dural was never "Keeper of the Archives". Kaedan was never Battlemaster. Kilran was a captain at the Sacking and Grand Moff only after it. Saresh is Chancellor only from 3640. The Lesser reunited the clans |
| Removed | Darth Nyriss (Era 08) |

**Renamed IDs.** The renamed entries keep their old ID in `formerCanonIds`, so story NPCs linked under the old file still resolve:
- Zym, Orgus Din, Dar'Nala, Ngani Zho, Gnost-Dural;
- Scourge, the Dread Masters, Rycus Kilran;
- Hero of Tython, Emperor's Wrath, the Grand Champion, Voidhound.

### The five changed estimates

- **Kao Cen Darach:** Jar'Kai is his main form (86), with Ataru 80.
- **Jaric Kaedan:** his main form is Juyo-Kos, entered as `juyo` 84 (a Juyo variant, D-369). Battle meditation 76 is added. Djem So, Shien and Ataru are lowered to secondary.
- **Darth Vowrawn:** his physical stats, forms, lightning and telekinesis are lowered. His Willpower, Charisma and Intelligence are kept.
- **Mandalore the Vindicated:** "reunified the clans" is dropped from his note. He got a death year (between 3636 and 3630; 3633 as an estimate).
- **Darth Nyriss:** removed.

**Added where the sources name them:**
- Gnost-Dural: Djem So, Juyo, telekinesis and Force speed; Soresu raised.
- Scourge: Soresu.
- Baras: Shien; Soresu raised.
- Satele: foresight, telepathy and tutaminis recorded. Her telekinesis and Force absorb were already there.

### New characters (138)

These are generated into `src/data/canon/era09Additions.ts` from the master index and the entries.
- **Facts:** species, sex, homeworld, birth and death, ranks, teachers, forms and powers, and alignment come from the files and sit in a `facts` field.
- **Design:** role, archetype and missing birth years.
- **Birth estimate:** an adult of 25 (45 for a Master or high office) at the earliest year the files date them.
- **Unknown species:** where the files don't state one, the species is `unknown` (13, mostly the individual Dread Masters).
- **Eight hand overrides** (estimates that contradicted the files or earlier rulings):

| Figure | Birth used | Why |
|---|---|---|
| Jewl'a Nightbringer | c. 3670 | a child in the lower levels during the 3661 food riots (D-385) |
| Hylo Visz | c. 3683 | a young Cartel smuggler in 3661 (D-385) |
| Karagga the Unyielding | c. 4460 | "over 800 years old" by the Cold War |
| Nok Drayen | c. 3686 | a rising smuggler in 3661 (D-385) |
| Meetra Surik | c. 3990 | the Jedi Exile, dead by 3950 (here as a spirit) |
| Spindrall | c. 3720 | active in Ajunta Pall's tomb in 3661 (D-376) |
| Darth Gravus | c. 3700 | a Dark Councilor by the Galactic War |
| Tassaa Bareesh | c. 3800 | a long-lived Hutt crime lord by the Cold War |

**Plus:**
- T7-O1 is set as a droid.
- Khem Val is `fixed` (an ancient Dashade).

### Provisional stats for review (100 active adults in 3661 BBY)

None of these has hand-set levels. Their levels are the npc-generation closed form for their archetype at their age: no talents, a variance seeded by the canon ID, their own species (`src/features/npcs/selectors.ts`). Role and birth year are listed; "e" means the birth year is an estimate.

- **Jedi** (18): Aryn Leneer (jediMaster, b. 3706e); Sajar (jediMaster, b. 3706e); Fortris Gall (jediKnight, b. 3686e); Nomen Karr (jediKnight, b. 3686e); Warren Sedoru (jediMaster, b. 3726e); Ardun Kothe (jediKnight, b. 3696); Oteg (jediMaster, b. 3844e); Shol Bestros (jediMaster, b. 3726e); Jerbhen Hulis (jediMaster, b. 3723e); Wyellett (jediMaster, b. 3706e); Xerender (jediMaster, b. 3706e); Bengel Morr (jediMaster, b. 3698e); Tasiele Shan (jediKnight, b. 3724e); Parkanas Tark (padawan, b. 3686e); Kellian Jarro (jediMaster, b. 3698e); Yuon Par (jediMaster, b. 3688e); Leeha Narezz (jediKnight, b. 3686e); Aurei Eadon (jediMaster, b. 3709e).
- **Sith Empire** (51): Darth Ekkage, Darth Vengean, Darth Azamin, Darth Decimus, Darth Ravage, Darth Mortis (sithLord, b. 3706e); Darth Rictus (sithLord, b. 3761e); Darth Karrid (sithLord, b. 3686e); Darth Hadra (sithAcolyte, b. 3686e); Darth Arkous, Darth Arho (sithLord, b. 3706e); Darth Ikoral (sithAcolyte, b. 3757e); the Dread Masters Raptus, Bestia, Brontes, Calphayus, Styrak, Tyrans (sithLord, b. 3706e); Tarnis (sithLord, b. 3706e); Praven (sithAcolyte, b. 3706e); Adraas (sithLord, b. 3706e); Darth Venemal (sithLord, b. 3686e); Darth Lachris (sithLord, b. 3706e); Calypho (sithLord, b. 3723e); Darth Skotia (sithLord, b. 3686e); Nefarid (sithAcolyte, b. 3706e); Darth Gravus (sithLord, b. 3700e); Darth Charnus (sithAcolyte, b. 3688e); Darth Serevin (sithLord, b. 3686e); Darth Tormen (sithLord, b. 3706e); Harkun (sithLord, b. 3688e); Spindrall (sithLord, b. 3720e); Tremel (sithLord, b. 3686e); Ffon Althe (sithAcolyte, b. 3686e); Grathan (sithLord, b. 3686e); Khem Val (sithLord, b. 5501e, fixed); Lana Beniko (sithLord, b. 3682e); Vasil Dorne (official, b. 3703); Zellos (officer, b. 3706e); Shareis (official, b. 3705e); Shullis Khamarr (official, b. 3688e); Layek Davos (officer, b. 3706e); Broysc (officer, b. 3698e); Tarrick (officer, b. 3706e); Keeper (official, b. 3706e); Watcher X (official, b. 3685); Fixer Seven (official, b. 3689e); Malavai Quinn (official, b. 3680); Broonmark (official, b. 3686e); Eckard "Fixer Fifteen" Lokin (official, b. 3707); SCORPIO (droid, b. 3686e).
- **Republic** (18): Berooken, Paran Am-Ris, Dorian Janarus (politician, b. 3706e); Silara Panteer and Gaul Panteer (politician, b. 3712e; one entry in the file); Galena Rans (officer, b. 3706e); Elin Garza (officer, b. 3696); Marcus Trant (official, b. 3706e); Rans, Stantorrs (officer, b. 3706e); Harron Tavus (officer, b. 3686e); Var Suthra (officer, b. 3706e); Zeerid Korr (officer, b. 3686e); Nico Okarr (civilian, b. 3706e); Fideltin Rusk (officer, b. 3682); T7-O1 (droid, b. 3844e); Bowdaar (civilian, b. 3838); Holiday (scholar, b. 3686e); Korvan (officer, b. 3706e).
- **Mandalorians** (2): Mandalore the Lesser (officer, b. 3692e); Dao Stryver (officer, b. 3686e).
- **Independent** (4): Jicoln Cadera, Braden, Blizz (bountyHunter, b. 3686e); Gault Rennow (bountyHunter, b. 3697).
- **Underworld** (7): Karagga the Unyielding (criminal, b. 4460e); Suudaa Nem'ro (criminal, b. 4241); Tassaa Bareesh (criminal, b. 3800e); Nok Drayen (criminal, b. 3686e); Hylo Visz (smuggler, b. 3683e); Zale Barrows (smuggler, b. 3685e); Vrath Xizor (criminal, b. 3686e).

**Facts only (38):**
- 36 children in 3661, each with an age: Ako Domi 13, Nadia Grell 3, Ashara Zavros 0, Xalek 4, Jaesa Willsaam 3, Jebevel Madon 16, Elara Dorne 8, Tanno Vik 15, Yuun 9, "Doc" 9, Corso Riggs 4, Risha Drayen 3, Guss Tuno 14, Qyzen Fess 14, Tharan Cedrax 11, Zenith 3, Felix Iresso 12, Arra Yooms 0, Shara Jenn 6, Ula Vii 7, Hunter 9, Vette 3, Pierce 10, Kaliyo Djannis 11, Vector Hyllus 8, Raina Temple 5, Talos Drellik 8, Andronikos Revel 17, Akaavi Spar 9, Mako 0, Skadge 17, Jewl'a Nightbringer 9, and others.
- The rest are dead or unborn: Belth Allusis, Meetra Surik, Darth Vich and Cipher Twelve are dead; M1-4X and Torian Cadera are unborn.

### Status fields

`src/data/canon/era09Status.ts` gives every one of the 183 figures a `status3661` (kind and the lore wording, plus an age for children) and a `status3653`. The roster merges both onto each entry.

**3661 BBY counts:**

| Status | Figures |
|---|---|
| active | 34 |
| not stated | 96 |
| child | 36 |
| imprisoned | 8 |
| dead | 7 |
| unborn | 2 |

"Not stated" figures are placed by their birth and death years, as the roster already does.

### M6 hand-set alignment (checklist item 14)

Recorded in `facts.alignment`:
- Dar'Nala's red eyes from 3653.
- Zash's yellow eyes and decaying body behind a Force mask.
- Mekhis visibly warped.
- Revan's yellow eyes in his Sith past.
- Tol Braga's fall in 3640.
- Sajar and Praven, as their entries word it (redeemed).

## Topic-file edits (step 5)

| # | File | Edit |
|---|---|---|
| 1 | `SW_Dromund_Kaas_KaasCity_OldRepublic_Part1.md` | Elara Dorne born 3669 BBY (ruling 12); the row also keeps Vasil Dorne's 3665 garrison command |
| 2 | `SW_SWTOR_Era_Power_Structures_Part2.md` | The Emperor's Dromund Kaas defeat kept at 3640 BBY (ruling 6), noting that his page gives only a range |
| 3 | `SW_Jedi_Temple_Life_GGW_Part1.md` | Kaedan: "before 3691 BBY" (page) and "before 3680 BBY" (infobox) side by side, compatible |
| 4 | `SW_Great_Galactic_War_Part1.md` | "Malgus beheaded his wounded master" changed to "executed", as the Vindican page says |
| 5 | `SW_Jedi_Temple_Life_GGW_Part1.md` (roster row, Decision 5); D-379 via D-390 | "Killed by Braden" added to Zym's death (ruling 1) |

## Tests and checks

- **Tests:** `npm test` passes: 107 files, 1,126 tests.
  - New in `tests/data/era09Roster.test.ts`:
    - the roster matches the 183 lore figures one to one;
    - every status is present;
    - former IDs resolve;
    - entries without a sheet have no hand-set levels;
    - the batch 7 mismatches are settled.
  - New in the lore tests: the parser's new layout.
- **Typecheck and lint:** clean.
- **Lore index:** rebuilt, with the diff above.
- **Harness:** no suite reads the canon roster. A search of `tests/support`, `tests/lifetime`, `tests/mortals`, `tests/spread`, `tests/forcexp`, `tests/severs` and `tests/sweep` for the roster, `canonRoster`, `selectNpcLevels` and `buildNpcFighter` found nothing. No gate can move, so no suite was run.
