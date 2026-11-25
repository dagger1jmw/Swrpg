# m8-calibration-fix6: one clock confirmed, old NPCs' Willpower (2026-11-25)

Decision D-499.

| Item | Result |
|---|---|
| 1. One clock | Confirmed; the "Jared to confirm" marks on it are gone (spec, decisions, two reports) |
| 2. Old NPCs without a sheet | Willpower training gains stop at 50 |

## Old NPCs' Willpower

Training gains stop at Human-equivalent 50, for every path and career. What is left is the natural baseline's slowed growth (D-498): 0.6 to 0.9 of a level, ending at 60. Everything else still grows on the falling training day. The player is unchanged.

| No talent | 40 | 50 | 60, before | 60, now | 72, before | 72, now | 90, before | 90, now |
|---|---|---|---|---|---|---|---|---|
| Jedi Guardian | 79 | 89 | 97 | 90 | 100 | 90 | 103 | 90 |
| Jedi Consular | 76 | 85 | 91 | 86 | 94 | 86 | 97 | 86 |
| Sith Warrior | 80 | 91 | 99 | 92 | 103 | 92 | 106 | 92 |
| Soldier | 54 | 62 | 68 | 63 | 71 | 63 | 73 | 63 |

Against the five sheets (the generated line of each figure's archetype, rank and age):

| Figure (age) | Sheet | Line before | Line now |
|---|---|---|---|
| Ven Zallow (60) | 84 | 95.9 | 89.4 |
| Vindican (64) | 80 | 97.5 | 87.9 |
| Angral (67) | 86 | 98.6 | 87.9 |
| Bela Kiwiiks (70) | 84 | 93.9 | 85.0 |
| Orgus Din (72) | 86 | 99.6 | 89.4 |

- **1 to 8 above**, not 1 to 7: Vindican's line is 7.9 over, because the natural baseline still adds its part.
- **Long-lived species are still further above:** a Kel Dor reaches its own fifties later, so the line is 99.9 at Zym's age and at Tol Braga's (sheets 88 and 86; it was 114 and 108). They are sheeted; a Kel Dor without a sheet would have it.
- **Inquisitors run under their sheets:** 74 against 82 to 92 (Ragate, Zash, Vowrawn, Baras). The stop makes that 2 to 8 wider.
- **Canon figures without a sheet** take the new line, so an old one's Willpower falls by up to about 10 at 64 to 72.

**Sheeted figures are unaffected.** My first version moved seven of them slightly before their sheet's date, because the floor reads the same line (Kao Cen Darach in 3,691 BBY: 86 to 83). The line under a figure whose sheet has Willpower now keeps the old schedule. Every stat of every sheeted figure, at its sheet and 10 and 20 years either side, is the same as before this run.

## Numbers I invented

None.

## Tests

Two added in tests/m8/calibrationFix4.test.ts.

| Run | Result | Time |
|---|---|---|
| npm test | 1,672 of 1,672 | 27 s |
| test:lifetime | 56 of 56 | 1162 s |
| typecheck, lint | clean | |
