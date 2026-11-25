# m8-calibration-fix11: one line in every campaign, the cap from the sheet (2026-11-25)

Decision D-504.

| Item | Result |
|---|---|
| 1. The campaign bug | Fixed; every figure's line is the same in every campaign and meets its sheets |
| 2. The cap | From the sheet: 5, or 15 for early-career sheets |
| 3. Safety test | Passes; nobody is listed |
| 4. Report | Sections 2 and 3 |

## 1. The campaign bug

**Cause.** A figure was calculated once, at the campaign's start or when its training began, and everything after was that line multiplied by its growth since. At almost no training the multiplier runs to the hundreds, and it took natural Strength and Willpower with it.

**Fix.** A figure on its canon course is worked out for the date itself, from its sheets, ranks and lived age. The start date plays no part. 163 figures change in some campaign by more than 5; the largest:

| Figure | Campaign from | Was | Now |
|---|---|---|---|
| Gault Rennow | 3,681 | Willpower 3,048 in 3,601 | 66 |
| Andronikos Revel | 3,661 | Willpower 2,949 in 3,601 | 63 |
| Kaliyo Djannis | 3,661 | Strength 2,874 in 3,611 | 37 |
| Pierce | 3,661 | Willpower 2,896 in 3,601 | 67 |
| Aric Jorgan | 3,661 | Endurance 2,741 in 3,621 | 64 |
| Voidhound | 3,661 | Strength 2,703 in 3,621 | 67 |
| Meteor | 3,661 | Endurance 2,703 in 3,621 | 76 |
| Malavai Quinn, Shara Jenn | 3,661 | 167 in 3,616 | 36 |
| Zenith | 3,661 | Agility 232 in 3,616 | 48 |

It was wrong the other way too: figures calculated as young acolytes never gained their later powers (Lana's, Praven's and Decimus's Force Output stood at 5 or 6; now 58, 73, 53), and Initiate Shii-Cho was multiplied up (Baras 80, now 34).

**What it changes in principle.** D-414 let an NPC drift from its canon line after the start so that the story could change its course. Now only a recorded divergence (killed, captured, turned, removed from its post) does. A diverged figure grows from what it was that day.

## 2. Before and after

Form / Force Control / Willpower. Before is fix10.

| Figure (sheet, age) | 3,640 | 3,630 | 3,620 | Largest move |
|---|---|---|---|---|
| Gnost-Dural (3,655, 50) | 79/83/87, same | same | same | none |
| The Barsenthor (3,637, 31) | 75/89/93, same | 100/118/123 to 85/99/103 | 132/156/163 to 91/105/109 | Willpower 175 to 109 |
| Darth Nox (3,637, 35) | 79/93/91, same | 94/110/108 to 89/103/101 | 118/138/135 to 95/109/107 | Force Control 142 to 109 |
| Theron Shan (3,640, 26) | 78/-/82, same | 118/-/124 to 89/-/93 | 149/-/157 to 93/-/97 | Willpower 173 to 97 |
| Darth Jadus (3,643, 50) | 81/99/101, same | same | same | none |
| Cipher Nine (3,640, 30) | 84/-/88, same | 115/-/121 to 95/-/99 | 140/-/147 to 99/-/103 | Willpower 152 to 103 |
| Meteor (3,640, 32) | 84/-/86, same | 111/-/114 to 95/-/97 | 131/-/134 to 99/-/101 | Willpower 138 to 101 |
| Voidhound (3,640, 32) | 82/-/80, same | 109/-/106 to 93/-/91 | 127/-/124 to 97/-/95 | Blaster 132 to 97 |
| Malgus (3,653, 47) | 99/95/102 to 96/92/98 | 101/97/103 to 97/93/99 | the same | Willpower 103 to 99 |
| Aric Jorgan (3,643, 30) | 90/-/90 to 81/-/81 | 117/-/117 to 84/-/84 | 134/-/134 to 85/-/85 | Willpower 138 to 85 |
| The Emperor's Wrath (3,637, 31) | 85/85/85, same | 107/107/107 to 101/101/101 | 125/125/125 to 107/107/107 | Willpower 133 to 107 |
| The Grand Champion (3,640, 30) | 84/-/84, same | 104/-/104 to 95/-/95 | 121/-/121 to 99/-/99 | Willpower 126 to 99 |
| Darth Acina (3,645, 50) | 80/88/90, same | 83/91/93, same | dead | none |
| Hero of Tython (3,637, 28) | 83/83/85, same | 105/105/107 to 99/99/101 | 122/122/125 to 105/105/107 | Willpower 138 to 107 |
| Shae Vizla (3,653, 37) | 106/-/106 to 90/-/90 | 109/-/109 to 91/-/91 | dead | Willpower 111 to 91 |
| Kira Carsen (3,637, 26) | 71/70/73, same | 92/89/94 to 87/85/89 | 109/106/111 to 93/91/95 | Willpower 127 to 95 |
| Jaric Kaedan (3,668, 47) | 92/92/92 to 89/89/89 | dead | dead | Willpower 92 to 89 |
| Mandalore the Vindicated (3,655, 50) | 89/-/89, same | dead by 3,633 | dead | none |
| Leontyne Saresh (3,643, 57) | -/-/83, same | -/-/86, same | -/-/87, same | none |
| Satele Shan (3,643, 56) | 89/95/97, same | 92/98/100, same | 93/99/101, same | none |
| Jace Malcom (3,643, 59) | 85/-/87, same | 88/-/90, same | 89/-/91, same | none |

Also: Rycus Kilran (3,653, 39) Willpower 100 to 84 in 3,642; Syo Bakarn (3,650, 28) 87/94/98 to 85/91/95 in 3,640. Karrid's Niman 75 stays 3.7 under Gnost-Dural's 78.7.

**Who gets 15.** A sheet before 30: the Hero (28), Syo Bakarn (28), Kira Carsen (26), Theron Shan (26). **The eight class heroes get it by name:** your words name them, but the Barsenthor and the Wrath are 31 at theirs, Voidhound and Meteor 32, Nox 35, and Cipher Nine and the Grand Champion just 30, by estimated births. Aric Jorgan, 30, gets 5.

**Padawans and apprentices:** no sheet on the roster was made while its figure was one. The rule is built and tested.

## 3. Duel-tier crossings (top 88/85/90, apex 98/110/105)

| Figure | fix10 | Now |
|---|---|---|
| Darth Nox | top 3,631, **apex 3,628** | top 3,630 |
| The Emperor's Wrath | top 3,637, **apex 3,628** | top 3,637 |
| Hero of Tython | top 3,637, **apex 3,627** | top 3,637 |
| The Barsenthor | top 3,633, **apex 3,630** | top 3,625 |
| Kira Carsen | top 3,632, **apex 3,617** | top 3,628 |
| Jaric Kaedan | top 3,658 | never |
| Malgus, Marr, Satele, Revan, Scourge | top | the same |
| Jaesa Willsaam (no sheet) | top 3,603 | the same |

Nobody reaches the apex by their stats now. These are the stats' tiers; the list of top duelists by name is its own.

## 4. The safety test

Every sheeted figure not beyond any duelist, every stat, every year from 10 to death or 3,590 BBY, against its highest sheet (the authored number, or what the figure had at that date where the sheet leaves the stat to the game): **none passes by more than 15.** Every campaign start is covered, since the line is the same in all (tested from 3,681, 3,661, 3,653 and 3,640, all figures).

- **Not covered:** figures with no sheet. The highest are Suudaa Nemro and Bowdaar at 135, long-lived, whose other skills still bank decades as Willpower did (queued); Jaesa Willsaam 112 by 3,600.
- **Nor figures off their canon course,** who grow by their own ranks and can pass the sheet by a little more.

## For you

1. **The class heroes:** 15 for all eight, or only the ones under 30 (the Hero)?
2. **D-414:** is it right that only a recorded divergence takes a canon figure off its line?
3. **Long-lived figures without a sheet** (Bowdaar, Suudaa Nemro at 135): stop their other skills by years trained too?

## Numbers I invented

None new. The 5, 15, 20 and 30 are yours, tagged invented; the class heroes' list is my reading.

## Tests

tests/m8/canonGrowthCap.test.ts (eleven), tests/engine/canonStats.test.ts changed.

| Run | Result | Time |
|---|---|---|
| npm test | 1,692 of 1,692 | 29 s |
| test:lifetime | 56 of 56 | 1180 s |
| typecheck, lint | clean | |
