# Calibration check: the character sheets against the game (2026-11-25; m8-calibration-check)

Report only. No value or code is changed. The tier-bar change (m8-world-d2, question 1) is on hold.

**Corrected sheet value (Jared, 25 Nov 2026):** Malgus's Force Control is **88** (the sheet file says 95, not edited yet). The tables below show both.

## The short answer

1. **Every hand-set sheet is converted when the game loads.** D-423 (22 Nov 2026) multiplied almost every stat down, and D-429 (the same day) replaced the result with hand-set numbers for 13 figures.
2. **Malgus's 70 and 88 are hand-set numbers, not the formula.** The formula alone gives Force Control 54 (50 from the corrected 88) and Djem So 74. D-429's hand-set line raised them.
3. **"Matches the game engine" meant the old game.** The sheets' tier line (Knight 41–60, Master 61–80, Grandmaster 81–100, Legendary 101–150) is the tier table of V170, word for word (legacy/index.html:1803). The new game kept the boundaries but rebuilt how fast a character reaches them.
4. **The sheets also carry a second table that disagrees with the first:** Trained 40–60, Veteran 60–85, **Master 85–100**, Legendary 100–150. Their numbers follow this second one. Kit Fisto's 84 is "Grandmaster" by the first table and "Veteran" by the second. So the sheets can't be read straight onto the game's tiers, with or without scaling.
5. **The game tops out one specialty, the sheets fill every stat.** In the game a Master is 61–80 in their main specialty, and well below it in the rest (a Sith Warrior trains Force Control little). The sheets give a Master 76–88 in nearly everything.
6. **The 23 Nov runs are not the cause.** They moved the player's and generated numbers, and only the knowledge stats of the sheets. But they were made after the factors were measured, so the factors are now out of date (section 2).

## 1. Side by side

STR AGI END WIL CHA INT, then Force Sense, Meditation, Force Knowledge, Force Control, Force Output, then the best form. **Sheet** is the lore file. **Game** is what the game uses at the sheet's own date. **Line** is what the game would generate for someone of the same archetype, ranks and age with no talent.

### SWTOR era

| Figure | Row | STR | AGI | END | WIL | CHA | INT | FS | Med | FK | FC | FO | Best form |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Malgus** (3,653) | sheet | 90 | 82 | 92 | 94 | 86 | 80 | 84 | 70 | 80 | 95, **ruled 88** | 90 | Djem So 92 |
| | game | 56 | 49 | 55 | 94 | 16 | 40 | 58 | 28 | 35 | **70** | 75 | **88** |
| | line | 52 | 51 | 57 | 85 | 14 | 17 | 22 | 21 | 22 | 39 | 48 | 68 |
| **Marr** (3,640) | sheet | 84 | 80 | 88 | 96 | 84 | 84 | 86 | 82 | 86 | 92 | 84 | Soresu 88 |
| | game | 52 | 48 | 53 | 100 | 15 | 60 | 70 | 50 | 55 | 78 | 75 | 88 |
| | line | 52 | 50 | 57 | 100 | 15 | 18 | 25 | 26 | 29 | 44 | 54 | 79 |
| **Satele** (3,643) | sheet | 70 | 88 | 76 | 96 | 88 | 84 | 92 | 94 | 90 | 94 | 82 | Ataru 88 |
| | game | 50 | 55 | 54 | 105 | 17 | 60 | 88 | 80 | 72 | 86 | 72 | 86 |
| | line | 51 | 50 | 57 | 93 | 15 | 18 | 59 | 30 | 26 | 61 | – | 80 |
| **Revan, freed** (3,640, fixed) | sheet | 84 | 94 | 86 | 100 | 90 | 100 | 94 | 90 | 98 | 100 | 92 | Niman 100 |
| | game | 61 | 59 | 61 | 110 | 17 | 90 | 100 | 90 | 100 | 105 | 95 | 105 |
| **Scourge** (3,660, fixed) | sheet | 90 | 88 | 98 | 96 | 70 | 78 | 84 | 72 | 82 | 88 | 84 | Djem So 88 |
| | game | 56 | 53 | 59 | 100 | 13 | 78 | 70 | 40 | 50 | 80 | 85 | **98** |
| **Vitiate** (3,660, fixed) | sheet | 88 | 88 | 108 | 135 | 122 | 120 | 126 | 124 | 134 | 130 | 130 | Makashi 92 |
| | game | 55 | 53 | 65 | 135 | 90 | 100 | 120 | 115 | 125 | 120 | 125 | **100** |
| **Zallow** (3,655) | sheet | 70 | 78 | 72 | 84 | 76 | 80 | 82 | 78 | 80 | 82 | 82 | Djem So 80 |
| | game | 50 | 49 | 51 | 84 | 14 | 40 | 60 | 32 | 26 | 58 | 58 | 72 |
| | line | 51 | 50 | 57 | 98 | 15 | 18 | 63 | 32 | 27 | 65 | – | **84** |
| **Zym** (3,660) | sheet | 48 | 52 | 56 | 88 | 80 | 82 | 86 | 90 | 88 | 82 | 76 | Soresu 76 |
| | game | 35 | 33 | 40 | 120 | 15 | 60 | 92 | 100 | 110 | 72 | 60 | 60 |
| | line | 46 | 43 | 48 | 125 | 15 | 18 | 77 | 88 | 133 | 52 | – | 57 |
| **Baras** (3,643) | sheet | 70 | 64 | 78 | 92 | 86 | 90 | 84 | 80 | 88 | 88 | 80 | Shii-Cho 72 |
| | game | 43 | 38 | 47 | 92 | 16 | 60 | 39 | 29 | 45 | 50 | 60 | 58 |
| | line | 41 | 40 | 41 | 76 | 15 | 18 | 23 | 30 | 48 | 47 | 79 | 47 |
| **Kao Cen Darach** (3,681) | sheet (bench row) | 78 | 84 | 76 | 86 | 74 | 80 | 84 | 80 | 80 | 84 | 82 | Ataru 86 |
| | game | 56 | 53 | 54 | 86 | 14 | 40 | 61 | 32 | 26 | 60 | 58 | Jar'Kai 77 |
| | line | 48 | 46 | 53 | 100 | 15 | 18 | 63 | 32 | 27 | 64 | – | **83** |
| **Aryn Leneer** | sheet | a text entry, no stat table in any file | | | | | | | | | | | |
| | game | on the roster with no sheet: generated from archetype, rank and age | | | | | | | | | | | |

- **Where the hand-set lines came in:** Malgus, Marr, Satele, Revan, Scourge, Vitiate and Zym have one. Zallow, Baras and Darach are the plain formula.
- **The form roster differs from the file in two places:** Darach's 86 is Jar'Kai in the game (lore batch 19, from the lore page; Ataru 80), and Baras has Soresu 72 and Shien 70 against the file's Soresu 68.
- **Force pushes and the like** are already cut before the conversion: the roster takes the base rating times its percentage (Malgus's push 88 × 85% = 75, then the factor: 37.5).
- **Zallow and Darach end up weaker than an average Guardian of their age** would be generated (72 against 84, 77 against 83). So canon Masters are below the game's own line, the opposite of what D-423 meant.

### Clone Wars era

None of these figures is on the game's roster, so **there is no game value yet** for any of them. A figure met in play is generated from archetype, rank and age.

| Figure | STR | AGI | END | WIL | CHA | INT | FS | Med | FK | FC | FO | Best form |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Yoda (file 11; 12's row agrees but FO 96) | 60 | 92 | 80 | 104 | 90 | 96 | 100 | 102 | 102 | 100 | 95 | Ataru 100 |
| Mace Windu (11, 12) | 78 | 88 | 80 | 94 | 84 | 86 | 88 | 84 | 86 | 92 | 88 | Vaapad 98 |
| Sidious, Chancellor (11) | 70 | 84 | 80 | 112 | 108 | 100 | 100 | 96 | 108 | 110 | 108 | Juyo 100 |
| Dooku, Jedi (11) | 72 | 90 | 74 | 92 | 88 | 88 | 86 | 82 | 88 | 88 | 82 | Makashi 96 |
| Dooku, Tyranus (12) | 72 | 92 | 74 | 94 | 90 | 90 | 88 | 84 | 92 | 94 | 86 | Makashi 96 |
| Obi-Wan (12) | 74 | 84 | 80 | 92 | 86 | 88 | 88 | 86 | 86 | 92 | 80 | Soresu 96 |
| Anakin, Knight (12) | 88 | 92 | 88 | 90 | 86 | 84 | 92 | 78 | 86 | 92 | 100 | Djem So 94 |
| Anakin, Knightfall (12) | 96 | 98 | 94 | 72 (its tier table says 100) | 80 | 84 | 98 | 72 | 86 | 90 | 120 | Djem So 98 |
| Kit Fisto (12, bench row) | 76 | 84 | 78 | 82 | 78 | 78 | 82 | 76 | 78 | 84 | 80 | Shii-Cho 84 |
| Saesee Tiin (11, bench row) | 76 | 74 | 76 | 82 | 70 | 78 | 84 | 74 | 74 | 78 | 80 | Djem So 78 |
| **Agen Kolar** | **no sheet in any character file** | | | | | | | | | | | |

## 2. The conversion

**The path**

| Step | Where |
|---|---|
| The sheet is typed into the roster with its own numbers | src/data/canon/era09GreatGalacticWar.ts (D-152, D-155) |
| At load, each anchor marked `basis: 'sheet'` is converted; the typed numbers are kept as `authored` | src/data/canonNpcs.ts:13 (`toGame`) |
| The conversion | src/data/canon/sheetScale.ts (`sheetToGame`) |
| The converted anchor is carried to the campaign's date along the figure's growth | src/engine/canonStats.ts (D-414), src/features/npcs/selectors.ts |

**The formula, in the order it applies**

1. **Force Knowledge, Meditation, Intelligence and Tactics are replaced**, not multiplied: the band of the figure's standing at the date (40 Knight or Lord, 60 Master or Darth, 80 the Councils, 100 ancient), one band lower outside the archetype's focus, and never above the sheet. Since D-461 the first two read a measured curve by age.
2. **Everything else is multiplied by one factor per group:**

| | Forms | Force Control | Force Sense | Force Output | Force abilities | Willpower | Strength / Agility / Endurance | Charisma | Melee | Blaster |
|---|---|---|---|---|---|---|---|---|---|---|
| Jedi | 0.90 | 0.71 | 0.73 | 0.71 | 0.51 | 1.0 | 0.72 / 0.63 / 0.71 | 0.19 | 0.24 | 0.60 |
| Sith | 0.80 | 0.57 | 0.46 | 0.75 | 0.50 | 1.0 | 0.62 / 0.60 / 0.60 | 0.18 | 0.24 | 0.60 |
| Careers | 0.80 | 0.60 | 0.50 | 0.60 | 0.50 | 0.77 | 0.68 / 0.72 / 0.67 | 0.19 | 0.24 | 0.60 |

3. **13 figures' stats are then overwritten by hand-set lines** (`GAME_SCALE_LINES`, all invented): Vitiate, Scourge, Malgus, Marr, the Dread Masters, Satele, Revan, Zym, Dar'Nala, Ngani Zho, Tol Braga, Gnost-Dural, the Barsen'thor.

Each factor is the median, over the group's sheets, of the game's own generated line for that figure (with gifted talent) divided by the sheet, and is capped at 1.0 so nothing is raised.

**Which run**

| Run | What it did to the sheets |
|---|---|
| D-152, D-155 (17 Nov), D-414 (22 Nov, date-agnostic refactor) | None scaled the sheet. They only carry it from its date to another date |
| **D-423 (22 Nov, calibration pass item A; commit a4ab3b0)** | **Introduced the conversion:** one factor per stat |
| **D-429 (22 Nov, calibration questions 8–9; commit fd2610d)** | Factors per group, bands for the knowledge stats, the hand-set lines |
| D-461, D-462, D-465 (23 Nov), D-474 (24 Nov) | Only the Force Knowledge and Meditation bands (curves, read ages) |
| D-457 and the other 23 Nov clamp and remeasure runs | Nothing in the sheets. They moved K, the paces and the caps |

**What it was meant to fix.** D-421 [5] rejected draft sheets "pending the stat scale". D-423 made the game's progression the reference: the sheets sit at 76–88 in most stats whatever the figure's focus, while the game spreads figures by archetype and age. Matching them by rank order was tried first and dropped, because one sheet point became up to 20 game levels.

**Two weaknesses of the method**
- **It is circular.** The factors come from the game's own generated line, so a canon figure is pulled towards an average character of the same archetype. That is why the apex figures came out flat and needed hand-set lines the same day.
- **It is out of date.** Measured again today on the same recipe, with nothing changed:

| | Forms | Force Control | Force Sense | Telekinesis | Willpower |
|---|---|---|---|---|---|
| Jedi: in use / today | 0.90 / 0.86 | 0.71 / 0.73 | 0.73 / **0.85** | 0.51 / **0.75** | 1.0 / 1.28 (capped) |
| Sith: in use / today | 0.80 / 0.83 | 0.57 / 0.59 | 0.46 / **0.32** | 0.50 / 0.57 | 1.0 / 1.12 (capped) |

## 3. What else the scaling reaches

| Thing | Reached? | How |
|---|---|---|
| Canon NPCs with sheets (era 09 only) | **Yes** | All of them |
| Canon NPC bands | **Yes, part of it** | The bands replace four stats of every sheet |
| Form ratings | **Yes** | The forms factor, or a hand-set line |
| Force-ability ratings | **Yes** | About half; push-type abilities also by their percentage first |
| Canon NPCs without a sheet (Aryn Leneer, all later eras) | No | Generated |
| Generated NPCs | No | The factors were measured *from* their line, not the other way |
| Archetype paces, K, Y_AVG, the ceiling, rank minimums | No | Measured on the day loop and its profiles. No sheet goes in |
| Player progression targets | No | Years to 41 / 61 / 81 / 101 (progression-targets §2). Legends facts anchor them, not sheets |
| The tier names | No | Same boundaries as the sheets' tier line (Adept 41, Master 61, High Master 81, Legendary 101) |
| The top-duelist bar (95 / 90 / 90) | **No, and that is the mismatch** | I took it from Yoda's and Mace's *sheets*, but it is compared with the player, who is on the game's scale |
| Teachers, healers, fights | **Through canon NPCs only** | They read the figure's converted levels |
| The narrator | No | It never sees sheet numbers (D-81) |

## 4. If the sheets were used as written

Tried on a scratch copy of the repo: the conversion and the hand-set lines off, nothing else touched.

**Tests**

| Run | Result | Failing |
|---|---|---|
| npm test | 1,613 of 1,619 | 6 tests, listed below |
| test:lifetime (the calibration gates) | 50 of 50 (1,016 s) | none |

| Failing test | Why |
|---|---|
| calibrationRulings: per-group factors | It tests the conversion itself |
| calibrationRulings: knowledge stats from the bands | The same |
| calibrationRulings: hand-set lines | The same |
| npcs: Satele matches her converted sheet | 88 instead of 86 |
| npcs: Vitiate does not scale | Force Control 130 instead of 120 |
| duelTiers: Malgus and the roster | Malgus's game line becomes his sheet |

**None of the failures is a calibration gate.** The gates run on player profiles and generated figures, and no sheet feeds them. They test the conversion or pin its results.

**What would change in play**
- **Physical stats jump most:** Malgus's strength 56 to 90, where a Human's trained cap is 80 (and the Force boost, up to 45, comes on top of it).
- **Off-focus stats jump:** Baras's Force Sense 39 to 84, Malgus's Meditation 28 to 70.
- **Forms move little for hand-set figures** (Malgus 88 to 92, Satele 86 to 88), and some **fall**: Scourge 98 to 88, Revan 105 to 100, Vitiate 100 to 92.
- **Force abilities about double** for the rest.
- **Fights get a little harder:** a Master with Soresu 67 won 33 of 200 fights with Jaric Kaedan as now, and 20 of 200 with sheets as written; with Soresu 80, 66 and 38. Darth Thanaton showed no clear change (84 and 82 of 200; 123 and 137).
- **Teachers:** a roster Master teaches a little better (0.5% a level of difference, to 15% at 30 levels).
- **Canon would sit above generated figures:** an average Sith Warrior of Malgus's age has Force Control 39 and form 68; Malgus would be at 88 and 92.
- **The top tier (95 / 90 / 90) would still not be met by Malgus** (combat 92; Force Control 88 after your ruling), so the tier question does not go away.

## What I would do (not applied)

The sheets say *who is stronger than whom, and in what*. The game says *what a level means in years of training*. Neither can simply replace the other.

1. **Keep a conversion, but fix it.** It should not push a canon Master below the average Master. Re-measure the factors (they have drifted), and floor each main stat at the figure's own generated line.
2. **Keep hand-set lines for every top duelist and apex figure**, from the sheets' relations (Malgus's Force Control 88 below combat 92, and so on), and set the ones missing (Zallow, and the later eras when built).
3. **Then set the tier bar on the same scale as the player,** once 1 and 2 are ruled.

## For you

1. **Which scale rules?** The game's (as now), or the sheets'? If the sheets', which of their two tables: Master 61–80, or Master 85–100?
2. **Should Malgus's hand-set line follow your ruling?** You put Force Control 88 below a combat of 92. The game's line has 70 below 88.
3. **Re-measure the factors and floor canon Masters at their own line?** This changes roster numbers, so it needs its own run.
