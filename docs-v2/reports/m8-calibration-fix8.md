# m8-calibration-fix8: rulings, Darth Karrid's sheet, the side effect (2026-11-25)

Decision D-501.

| Item | Result |
|---|---|
| 1. Consular Willpower | Recorded as ruled: no change; Guardians and Kao Cen Darach accepted |
| 2. Inquisitors | Recorded as ruled: five of nine accepted |
| 3. Karrid | Sheet drafted, **for review** |
| 4. Side effect | Karrid, Rictus and Hadra; nobody else rose more than 8 |

## Darth Karrid's sheet (3,640 BBY, her death, age 44)

Nothing in her lore gives a number, so **every number is invented**. The lore column says what each rests on.

| Stat | Sheet | In the game | Rests on |
|---|---|---|---|
| Willpower | 87 | 87 | your target (86-88; Malgus 94) |
| Force Control | 84 | 84 | a Dark Councillor; Acina 86, Vowrawn 82 |
| Force Output | 84 | 84 | as above |
| Force Sense | 82 | 82 | Acina 82 |
| Force Knowledge | 80 | 80 | below the scholars (Nox 94, Baras 88) |
| Meditation | 72 | 24 | a Jedi's training; outside her focus, so the age curve sets it |
| Niman | 80 | 80 | lore: her form; the level as Nox's and Jadus's best |
| Soresu | 74 | 74 | Gnost-Dural's form; that she learned it is invented |
| Shii-Cho | 72 | 72 | the Jedi basics; invented |
| Force Lightning | 82 | 82 | lore: she uses it; the level as Acina's |
| Telekinesis | 78 | 78 | invented (Acina 80, Baras 78) |
| Strength | 60 | 42 | invented; the game takes the Force out of it, as on every sheet |
| Agility | 74 | 50 | lore: Falleen reflexes; the number invented |
| Endurance | 66 | 42 | invented |
| Charisma | 84 | 71 | lore: Falleen pheromones; the number invented |
| Intelligence | 88 | 60 | lore: "extensive knowledge of technology", "strategic mastermind" |

- **All of it is within the range of the other Inquisitor sheets** (a test). She is not a top duelist.
- **Before her sheet** she grows into it: Willpower 56 as a Padawan of 23 in 3,661, 79 in 3,649. **Force lightning is 0 until 3,658**, when she leaves the Jedi (an estimate in the roster); without that she would have had it as a Padawan.
- **Not modelled:** the Ascendant Spear and its implants (ships come with checklist item 13).
- **Her rank** in the roster stays "Darth" in 3,640. No Dark Councillor span, as with Acina.

**Sources.** Her Wookieepedia page refused automated reads (402), so I used a mirror of it ([starwars.archivum.wiki](https://starwars.archivum.wiki/article/darth_karrid)) and the project's own files. From the mirror, to check against the page (queued): Niman, Force lightning, spinal and cranial implants, "strategic mastermind and ruthless commander", that she executed Gravus at Leritor, and that a blaster thrown into her command pod killed her.

**[conflict]** The mirror has her infiltrating the Empire as Malgus's apprentice in the Cold War (after 3,653), while its introduction says late in the Great Galactic War. The roster's estimate is 3,657. I left it.

## The side effect

Of the 135 unsheeted figures in the Era 09 roster, every year of each one's life from 3,700 to 3,600 BBY, against fix6. Willpower rose more than 8 for three:

| Figure | Path | Species | Age | Before | fix7 | Cause |
|---|---|---|---|---|---|---|
| Darth Karrid | Inquisitor | Falleen | 44 (3,640) | 82.6 | 96.0 | the 1.4 pace; now sheeted at 87 |
| Darth Rictus | Inquisitor | not stated | 85 (3,640); 50 at the widest (3,675) | 72.0; 71.2 | 82.1; 81.4 | the 1.4 pace |
| Darth Hadra | Inquisitor | Human | 48 (3,640) | 69.5 | 79.4 | the 1.4 pace |

- **Rictus and Hadra** are over 8 from 3,689 and 3,652 BBY on. I changed neither.
- **The years-trained stop alone raised nobody more than 8.** The most: Xalek +7.3 (Kaleesh, Warrior), Leeha Narezz +6.7 and Bengel Morr +6.1 (Nautolan, Guardians), Qyzen Fess +5.9 (Trandoshan), Broonmark and Paran Am-Ris +5.1.
- **Not covered:** a figure of another era whom the game builds in play. They have no roster entry to measure; an Inquisitor among them would rise by about 10.

## For you

1. **Karrid's sheet:** review the numbers, Soresu above all.
2. **Rictus at 82 and Hadra at 79:** leave them? Both are Dark Councillors, below the Council sheets (84 to 100).

## Numbers I invented

Every number of Karrid's sheet but the Willpower target, and the Force lightning of 0 in 3,658.

## Tests

tests/m8/karridSheet.test.ts (four).

| Run | Result | Time |
|---|---|---|
| npm test | 1,678 of 1,678 | 26 s |
| test:lifetime | 56 of 56 | 1155 s |
| typecheck, lint | clean | |
