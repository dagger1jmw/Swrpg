# m8-calibration-fix: the sheet scale (2026-11-25)

Decision D-494. Background: calibration-check-sheets.md, SW_Stat_Calibration_Evidence.md.

| Part | Result |
|---|---|
| 1. The scale | The sheets are on the game's scale. D-423's factors and all 13 hand-set lines are gone |
| 2. Sheet fixes | Done in the files, each with a "Ruled, Jared 25 Nov 2026" note |
| 3. Duel tiers | Top 88 / 85 / 90, apex 98 / 100 / 100 |
| 4. Fight check | Below. Tests that pinned the old conversion are updated |

## 1. The scale as built (src/data/canon/sheetScale.ts, src/engine/canonStats.ts)

| Stat | Rule |
|---|---|
| Forms, Force Control, Force Output, Willpower | as written |
| Force abilities (telekinesis, lightning and so on) | as written. **My reading:** your ruling doesn't name them |
| Force Sense | as written for Guardians, Consulars and Sentinels (it is in their focus), and for Vitiate, Baras, Angral, the Dread Masters and Ragate (their own sheets make it a specialty). Otherwise the game builds it |
| What else the archetype trains (a soldier's blaster and tactics, a smuggler's charisma) | as written |
| Strength, Agility, Endurance | see below |
| Force Knowledge, Meditation | D-461's curves; Intelligence and Tactics outside the focus keep the D-429 bands |
| The rest (a Sith Warrior's Force Sense, a Jedi's Charisma) | what the game generates |
| Floor | never below the plain generated line. A figure's main form stays its best |

**The physical mapping (proposed).** A Force-user's sheet wrote the stat in combat with the Force in it. So the boost the game gives in play comes off: 0.3 for each point of Force Control over 40, and 0.2 of the Force Body ability, both from the sheet, at most 45 (the game's own rule, nothing new). Malgus: 90 less 31.6 = 58. A career fighter has no boost: what is above 40 is drawn in by two thirds, so 100 on a sheet is the Human limit of 80 (invented). Then the species' cap at the figure's age.

**No hand-set line stays.** All 13 figures have sheets.

**One exception to the floor:** Oteg is floored to the sheet and no further. The game's line for so long a life runs past the apex (Soresu 132, Force Control 122), above Yoda. You placed Oteg among the Council Masters (D-421).

**What the game now has, at the sheet's date (before → now)**

| Figure | STR | AGI | END | WIL | FS | Med | FK | FC | FO | Best form |
|---|---|---|---|---|---|---|---|---|---|---|
| Malgus | 56 → 58 | 49 → 50 | 55 → 60 | 94 | 58 → 22 | 28 → 21 | 35 → 22 | 70 → 88 | 75 → 90 | Djem So 88 → Djem So 92 |
| Marr | 52 | 48 → 50 | 53 → 57 | 100 | 70 → 25 | 50 → 26 | 55 → 29 | 78 → 92 | 75 → 84 | Soresu 88 → Soresu 88 |
| Satele | 50 → 51 | 55 | 54 → 57 | 105 → 96 | 88 → 92 | 80 → 31 | 72 → 26 | 86 → 94 | 72 → 90 | Ataru 86 → Ataru 88 |
| Revan, freed | 60 → 51 | 59 → 61 | 61 → 57 | 110 → 106 | 100 → 94 | 90 → 80 | 100 → 80 | 105 → 94 | 95 → 92 | Niman 105 → Niman 94 |
| Scourge | 56 → 58 | 53 → 56 | 59 → 66 | 100 → 98 | 70 → 25 | 40 → 72 | 50 → 80 | 80 → 88 | 85 → 84 | Djem So 98 → Soresu 88 |
| Vitiate | 55 → 61 | 53 → 61 | 65 → 80 | 135 | 120 → 126 | 115 → 100 | 125 → 100 | 120 → 130 | 125 → 130 | Makashi 100 → Makashi 80 |
| Zallow | 50 → 51 | 49 → 50 | 51 → 57 | 84 → 98 | 60 → 82 | 32 | 26 → 27 | 58 → 82 | 58 → 82 | Soresu 92 → Djem So 84 |
| Zym | 35 → 46 | 33 → 43 | 40 → 48 | 120 → 125 | 92 → 86 | 100 → 88 | 110 → 133 | 72 → 82 | 60 → 76 | Soresu 60 → Soresu 76 |
| Baras | 43 → 56 | 38 → 50 | 47 → 64 | 92 | 39 → 84 | 29 → 30 | 45 → 48 | 50 → 88 | 60 → 80 | Shii-Cho 58 → Soresu 84 |
| Darach | 56 → 48 | 53 → 54 | 54 → 53 | 86 → 100 | 61 → 84 | 32 | 26 | 60 → 84 | 58 → 82 | Soresu 91 → Jar'Kai 86 |
| Kaedan | 53 → 49 | 50 | 52 → 53 | 84 → 86 | 60 → 82 | 27 | 22 → 23 | 60 → 84 | 60 → 84 | Juyo 76 → Juyo 84 |
| Orgus Din | 46 → 52 | 45 → 50 | 50 → 58 | 86 → 108 | 60 → 82 | 37 | 30 | 60 → 84 | 55 → 78 | Djem So 70 → Djem So 94 |
| Hero of Tython | 58 → 48 | 57 → 58 | 60 → 52 | 92 | 63 → 86 | 18 | 15 → 17 | 64 → 90 | 61 → 86 | Ataru 81 → Ataru 90 |
| Emperor's Wrath | 57 → 58 | 52 | 54 → 56 | 92 | 38 → 15 | 14 → 16 | 14 → 23 | 52 → 92 | 68 → 90 | Djem So 74 → Djem So 92 |
| Nox | 40 → 48 | 47 → 62 | 42 → 54 | 92 | 40 → 16 | 19 → 20 | 28 → 33 | 54 → 94 | 66 → 88 | Niman 64 → Niman 80 |
| Dread Masters | 41 → 50 | 42 → 54 | 42 → 54 | 100 → 96 | 95 → 90 | 85 → 100 | 95 → 92 | 92 | 100 → 87 | Makashi 62 → Makashi 74 |
| Angral | 50 → 66 | 47 → 64 | 49 → 68 | 86 → 105 | 38 → 82 | 26 → 27 | 23 → 30 | 50 → 88 | 63 → 84 | Djem So 66 → Djem So 83 |
| Oteg | 29 → 40 | 49 → 78 | 43 → 32 | 90 | 61 → 84 | 45 → 72 | 37 → 57 | 60 → 84 | 55 → 78 | Ataru 72 → Ataru 80 |

**Raised above the sheet by the floor** (more than 3 points)

| Figure | Raised |
|---|---|
| Orgus Din | Djem So 78 → 94, Soresu 74 → 93, Willpower 86 → 108 |
| Bela Kiwiiks | Ataru 78 → 89, Willpower 84 → 102 |
| Zallow; Darach | Djem So 80 → 84, Willpower 84 → 98; Ataru 80 → 83, Willpower 86 → 100 |
| Zym; Tol Braga; Ngani Zho; Dar'Nala | Force Knowledge 88 → 133, 84 → 124, 82 → 121, 84 → 103; Willpower 88 → 125, 86 → 110, 84 → 107, 86 → 97 |
| Ragate; Zash; Mekhis; Vowrawn | Force Output 62 → 110, 82 → 109, 82 → 109, 78 → 100 |
| Angral; Vindican; Marr; Thanaton; Zash; Mekhis; Ragate | Willpower 86 → 105, 80 → 102, 96 → 100, 86 → 90, 84 → 92, 84 → 92, 82 → 89 |
| Saresh; Kilran; Ragate | Strength 42 → 49; Agility 50 → 56; Strength 30 → 36 |

## 2. The sheet fixes

Done as ruled, in SW_Characters_11, 12 and OLD_SW_Characters_09. The second band table is out of all 18 sheet files (17 and 18 also held a "Transcendent 151+" row; the tier line has it).

- **Vader, Era 13:** Willpower 102 at Endor, 88 at Yavin. The high one is there.
- **Knightfall:** 72 in the block and in the quick table.
- **Left alone, for you:** the Era 13 sheets still have the Emperor's Juyo at 100 and Yoda's Force Control at 100 (Dagobah). Your ruling names Era 11 and 12.
- **Darach's Jar'Kai 86 can't be fought with:** the fight engine never picks Jar'Kai as the main form, so Darach fights with Ataru 83.

## 3. The tiers

| | Top (88 / 85 / 90) | Apex (98 / 100 / 100) |
|---|---|---|
| Sheets | Mace 100 / 92 / 94, Dooku, Obi-Wan, Anakin (Knight) | Yoda 100 / 104 / 104, Sidious 98 / 104 / 112, the Emperor |
| In the game | Malgus, Marr, Satele, Revan, Scourge, the Hero of Tython, the Emperor's Wrath | none |
| Not | Kit Fisto, Darach, Zallow, Saesee Tiin, Cin Drallig | Mace, Malgus, Revan |

- **Rules:** only an apex beats an apex, and a top-tier fighter holds one off briefly. A Master can't even hold an apex. Planning (hunters, Mandalorians) works against top duelists only.
- **Lists:** Yoda and Sidious (and Palpatine as Emperor) are apex. Abeloth (43–44 ABY) and Krayt (130–138 ABY) joined those beyond any duelist.
- **Maps:** the five maps that define the tiers carry it. The 4–44 ABY map's line is in your working copy, **not committed**: that file holds your own uncommitted review edits. It puts Palpatine reborn in the apex tier and leaves Luke for you.
- **PP-5 part B and PP-6 alternative 3** face Sidious. "Top tier" there now only buys time; winning takes an apex.

## 4. The fight check

A Master of 45 with Soresu at 67 or 80, 200 fights each, in 3,661 BBY.

| Opponent | Before | Now |
|---|---|---|
| Jaric Kaedan, Soresu 67 | 33 won, 167 lost | 21 won, 179 lost |
| Jaric Kaedan, Soresu 80 | 66 won, 133 lost, 1 drawn | 39 won, 161 lost |
| Darth Thanaton, Soresu 67 | 84 won, 116 lost | 102 won, 98 lost |
| Darth Thanaton, Soresu 80 | 123 won, 77 lost | 153 won, 47 lost |

- **Kaedan is harder:** best form 82 → 91, Force Control 65 → 91, Force Sense 65 → 89.
- **Thanaton is easier although his form rose** (57 → 63). His Force Sense fell 29 → 18, and Willpower 79 → 71: the old numbers kept a lucky draw of the generator for what the sheet left out, and the new rule takes the plain line. He is a young Lord in 3,661, well before his sheet.
- **A Sith Warrior's Force Sense is the main loss:** Malgus 58 → 22, Marr 70 → 25, Scourge 70 → 25. It drives precognition and ambush rolls.

## For you

1. **Force Sense of Sith Warriors and Inquisitors.** By your rule it is off their focus, so the game's 15–25 stands. Keep it, or use the sheets (Malgus 84)?
2. **Satele's, Vitiate's and Revan's Force Knowledge and Meditation** fall by the curves: Satele 72 → 26 and 80 → 31, Vitiate 125 → 100 and 115 → 100. Keep the curves for a Grand Master and for the Emperor?
3. **Vitiate's Charisma** is 15 (sheet 122, hand line 90). Keep?
4. **The floor makes a few minor figures strong:** Orgus Din fights at 94, Ragate has Force Output 110. Keep it literal, or cap it at the sheet's tier?
5. **Opponents get no Force boost to their body in a fight.** Only the player does, so "Force Body supplies it in play" is not true for any NPC yet. Adding it changes every fight with a Force-user, so I left it out.
6. **The Force abilities as written:** right?
7. **The Era 13 Emperor's Juyo 100 and Yoda's Force Control 100:** follow the ruling?

## Numbers I invented

| Number | Where |
|---|---|
| A career's physical stat: from 40, two thirds | sheetScale.ts |
| The main form's edge over another form's line: 0.1 | canonStats.ts |
| Vitiate's other forms: Niman 78, Soresu 76, Shii-Cho 74 | the sheet |
| Revan's other forms: each 6 lower | the sheet |
| Baras: Shien 82 | the sheet |
| Scourge: Soresu 88 (Djem So's number) | the sheet |
| The list of Sith whose focus includes Force Sense | sheetScale.ts |
| The years for Abeloth and Krayt | duelists.ts |

Yours: the tiers and every other sheet value.

## Tests

| Run | Result | Time |
|---|---|---|
| npm test | 1,621 of 1,621 | 23 s |
| npm run test:lifetime | 50 of 50 | 1,029 s |
| typecheck, lint | clean | |
