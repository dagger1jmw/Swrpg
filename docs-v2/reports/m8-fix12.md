# m8-fix12: calibration follow-ups and combat-scales rulings (2026-11-25)

Decision D-506.

| Item | Result |
|---|---|
| 1. Class heroes keep +15 | Ruled and recorded (growthCap.ts, D-506) |
| 2. Leaving the canon line by training | Built: a master's death, a broken apprenticeship, another order; Karrid tested |
| 3. Long-lived NPCs without a sheet | Built: every trained skill stops by years trained; section 2 |
| 4. Gunnery and Repair | Noted in combat-scales.md and checklist item 12 |
| 5. Battle meditation in fleets | Built and tested; section 3 |
| 6. Hangars into the lore | Venator and Thranta, in SW_Starships_Classes.md |
| 7. Mon Calamari at long range | Ruled as is |
| 8. Invented combat numbers | Accepted as defaults |

## 1. Leaving the canon line by training

- **Recorded apprenticeships:** the "teachers" facts are free text, so the pairs on the roster are now one dated table (src/data/canon/apprenticeships.ts), 12 of them, dated by the student's Padawan or apprentice spans: Karrid under Gnost-Dural and then Malgus, Aryn Leneer, Sajar, Warren Sedoru, Fortris Gall, Bengel Morr, Xerender, Ashara Zavros, Praven, Nefarid and Jaesa Willsaam.
- **A master killed** (npcDied) before an apprenticeship ends changes the student's training. The engine records it on the student, or keeps it until the student is linked to their canon figure.
- **The narrator** can report an apprenticeship broken or another order joined (new event `npcTrainingChanged`).
- **What it changes:** the figure's levels only. From that day it grows by the ranks begun by then, as a diverged figure does (D-504). Unlike a divergence, it leaves the lore's whereabouts and world-event roles alone. Reading: the ruling is about the line.

**Karrid**, Gnost-Dural killed in 3,668, before her apprenticeship (3,665):

| | 3,666 | 3,660 | 3,650 | 3,645 | 3,640 |
|---|---|---|---|---|---|
| Niman | 25 / 25 | 40 / 41 | 62 / 60 | 71 / 68 | 75 / 75 |
| Force Control | 28 / 28 | 45 / 46 | 70 / 67 | 80 / 76 | 84 / 84 |
| Force Lightning | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 82 / 0 |

On her line / off it. **Small, and you should know why:** with no new master on record she grows as a Temple initiate, and an initiate's line keeps rising nearly as fast. She is 2 to 4 under at 3,650 to 3,645, has no fall and so no dark powers, and by 3,640 her sheet's own values cap her again. If an unmastered student should fall further behind, the generator needs a pace for one: see question 1.

## 2. Long-lived NPCs without a sheet

Every trained skill now reads the falling training day by **years trained in real years** from the NPC's own start (its Human-equivalent age then, plus the years since), and stops by 90 (invented: 0.15 at 80, none at 90). Willpower still stops at 50 as fix7 built it. Lines under a sheet are unchanged.

- **Humans:** the same to 80, then the 15% tail ends by 90. A Guardian Master of 95: Soresu 89 to 88; a soldier: Blaster 88 to 86.
- **Short-lived species** gain a little (Chiss Guardian at 60: 76 to 83), as fix7 found for Willpower.
- **Generated long-lived NPCs** now end where a Human of 85 to 90 does:

| | Before | Now |
|---|---|---|
| Kel Dor Guardian Master, 100 / 200 / 350 | 105 / 111 / 111 | 88 |
| Kel Dor soldier | 107 / 114 / 114 | 86 |
| Wookiee Guardian Master | 113 / 133 / 135 | 88 |
| Wookiee soldier | 117 / 134 / 135 | 86 |
| Hutt soldier, 300 / 500 / 800 | 127 / 135 / 135 | 88 |
| Hutt Guardian Master | 134 / 135 / 135 | 73 |

The Hutt Jedi is low because a Hutt's childhood is 150 real years long, and it trains its whole allowance before adulthood. No Hutt Jedi is on the roster.

**The canon figures without a sheet who are long-lived and over 100 on anything:** only two. Strength / Agility / Endurance, Charisma, Intelligence, Profession:

| Figure | Year | Before | Now |
|---|---|---|---|
| Bowdaar (Wookiee) | 3,661 | 98 / 91 / 99, 77, 127, 134 | 73 / 65 / 68, 41, 72, 98 |
| | 3,621 | 105 / 97 / 100, 87, 131, 135 | 73 / 64 / 68, 41, 72, 98 |
| Suudaa Nemro (Hutt) | 3,661 | 111 / 71 / 111, 102, 135, 135 | 69 / 51 / 71, 35, 66, 94 |

Two others are long-lived and unsheeted but never reached 100: Ula Vii (Epicanthix; Piloting 92 to 83 in 3,591) and Tassaa Bareesh (no change). Body caps still bound the physical stats (tested).

**Worth a look:** Bowdaar's and Nemro's mental stats now sit with a Human's of 85, and their Charisma falls with age as it does for everyone. Both have lived several Human lives. If you want "a lifetime of experience" for the long-lived, it would be a separate rule; I have not added one.

## 3. Battle meditation in fleets

- **On the Tactics roll,** by the meditator's Meditation level, on the ground's scale: +1 at 40, +2 at 80, +3 at 120 (invented).
- **Killed or broken** (`loseFleetMeditator`): every crew checks, d20 + crew level / 10 against 18 (invented). Failed by less than 4: shaken, guns x0.6 for two rounds. By more: the ship breaks off. Crews of 50 break off about 40% of the time (the ground's line units: 45%).

## 4. Questions

1. **An unmastered student:** should a canon figure whose master died grow more slowly than a Temple initiate (a pace for training without a master), or is the small change in section 1 right?
2. **The long-lived:** are Bowdaar and Nemro where you want them, or should long life count for something beyond the Human line?

## 5. Invented numbers

- The training day for NPCs without a sheet: 0 at 90 years trained, Human-equivalent.
- Fleet meditation: +1 at 40, +2 at 80, +3 at 120 Meditation; the check's DC 18, rout margin 4, shaken guns x0.6 for 2 rounds.
