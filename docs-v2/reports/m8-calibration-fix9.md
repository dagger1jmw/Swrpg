# m8-calibration-fix9: Darth Karrid corrected (2026-11-25)

Decision D-502.

| Item | Result |
|---|---|
| 1. History | Corrected; the dates are invented |
| 2. Age | Born 3,678 BBY; 38 at her sheet (was 44) |
| 3. Force Lightning | 0 until her fall in 3,645 |
| 4. Combat | Niman 80, below Gnost-Dural's best form every year; Soresu 20 |
| 5. Rictus and Hadra | Recorded as ruled |

## Her years

| From (BBY) | What | Was |
|---|---|---|
| 3,678 | Born, during the Great Galactic War | 3,684 |
| 3,665 | Gnost-Dural's Padawan, a Jedi to 3,653 | 3,671 |
| 3,652 | Malgus's apprentice, a Jedi double agent | 3,657 |
| 3,645 | Her fall | none on record |
| 3,643 | Darth Karrid | 3,649 |
| 3,640 | Dies over Duro | the same |

- Every year but the last is invented and marked an estimate. The lore gives the Cold War (3,653 on) and the order.
- **A reading:** while she is a double agent the roster lists her with the Sith, as she appears to everyone. The span's source says what she is.
- The lore row in SW_Characters_09 Part 2 says the Cold War now, with a note. The queued source check is marked done.

## Her stats

| BBY | Age | Willpower | Force Control | Niman | Force Lightning | Gnost-Dural's best form |
|---|---|---|---|---|---|---|
| 3,661 | 17 | 44 | 42 | 40 | 0 | 64 |
| 3,653 | 25 | 66 | 63 | 60 | 0 | about 77 |
| 3,649 | 29 | 74 | 72 | 68 | 0 | about 83 |
| 3,645 | 33 | 82 | 80 | 76 | 0 | 90 |
| 3,643 | 35 | 86 | 83 | 79 | 68 | about 93 |
| 3,640 | 38 | 87 | 84 | 80 | 82 | 97 |

**Soresu 20** is what the game gives a Jedi for any form outside their plan: the Initiate survey of Forms II to VI. Everything else is as drafted.

## Found on the way (not changed)

- **Gnost-Dural's sheet (3,655) says Soresu 74.** In the game he has grown to 97 by 3,640, so Niman 80 is under him there but over his sheet. The tests compare them in the same year.
- **That growth looks too high.** By 3,640 he reads form 97, Force Control 102 and Willpower 107, over the top-duelist line (88, 85, 90). A Consular's stats, forms too, grow with Force Knowledge, which climbs long and fast. Also high by 3,640: Jaric Kaedan 99 / 99 / 99 (sheet 84 / 84 / 84 in 3,668) and Malgus 104 / 100 / 107 (92 / 88 / 94 in 3,653). Syo Bakarn 87 / 94 / 98 (74 / 80 / 84).
- **Lightning rises fast after the fall,** 68 in two years. Between two dated values the curve follows her overall growth, which is steep there.
- **Force Choke as a Padawan:** the game's line for her Sith archetype gives 17 in 3,661, as it did before she had a sheet.

## For you

1. **Gnost-Dural, Kaedan, Malgus and others past their sheets:** should a canon figure's growth past its last sheet slow? If Gnost-Dural's does, Karrid's Niman has to be checked again.
2. **Niman 80:** right against his grown level, or should it be under his sheet's 74?
3. **Force Choke before her fall:** zero it like the lightning?

## Numbers I invented

The years 3,678, 3,665, 3,652, 3,645 and 3,643. Soresu 20 is the game's own off-form level.

## Tests

tests/m8/karridSheet.test.ts: three added (her years, no lightning before the fall, Niman under Gnost-Dural's best).

| Run | Result | Time |
|---|---|---|
| npm test | 1,681 of 1,681 | 26 s |
| test:lifetime | 56 of 56 | 1144 s |
| typecheck, lint | clean | |
