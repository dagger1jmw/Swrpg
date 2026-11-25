# m8-calibration-fix7: old NPCs' Willpower by years trained, Inquisitors (2026-11-25)

Decision D-500.

| Item | Result |
|---|---|
| 1. The stop by years trained | Built. The Kel Dor check passes for a Guardian, **not for a Consular** (section 1) |
| 2. Inquisitors without a sheet | Pace x 1.4. **Five of nine sheets are in the window**; no single pace holds more (section 2) |
| 3. Tag-map review notes | Committed as written |

## 1. The stop by years trained

An NPC without a sheet stops training Willpower once it has trained as many real years, from its own start, as a Human of its path has by 50: a Jedi 46, a Sith 42, a soldier 33. Until then it trains on D-497's day, which still falls by Human-equivalent age. Natural growth is as it was. Humans do not change.

**The sheeted figures of other species** (the generated line at the sheet's age):

| Figure | Species | Age | Sheet | Line before | Line now | Over |
|---|---|---|---|---|---|---|
| Gnost-Dural (Consular) | Kel Dor | 50 | 82 | 84.3 | 84.3 | +2.3 |
| Tol Braga (Consular) | Kel Dor | 85 | 86 | 99.9 | 85.2 | -0.8 |
| Zym (Consular) | Kel Dor | 120 | 88 | 99.9 | 85.2 | -2.8 |
| Oteg (Guardian) | Yoda's species | 202 | 90 | 134.0 | 89.6 | -0.4 |
| Bela Kiwiiks (Sentinel) | Togruta | 70 | 84 | 85.0 | 86.4 | +2.4 |
| Darnala (Consular) | Togruta | 65 | 86 | 83.3 | 84.8 | -1.2 |
| Kao Cen Darach (Guardian) | Zabrak | 59 | 86 | 83.4 | 88.9 | +2.9 |
| Vindican (Warrior) | Sith pureblood | 64 | 80 | 87.9 | 87.9 | +7.9 |

Only the Kel Dor and Oteg are long-lived. Vowrawn is in section 2.

**The check.** An unsheeted Kel Dor's line at 85 and 120, against 86 and 88:

| | Before | Now | Over |
|---|---|---|---|
| Guardian | 106.7 | 90.1 | +4.1, +2.1 |
| Consular (the two figures' own path) | 99.9 | 85.2 | -0.8, -2.8 |

The Consular misses 1 to 8 above because a Human Consular's line is the same 85 (Ngani Zho's: 85.0 against 84). The figures 1 to 8 above in fix6 were Guardians, Warriors and a Sentinel. I did not raise the Consular's pace.

**Species without a sheet, a Guardian in old age:** Wookiee 135 to 90, Falleen 126 to 90, Epicanthix 100 to 90, Yoda's species 135 to 90, Hutt 135 to 71 (adult at 200, so all its 46 years are childhood ones).

**Short-lived species gain a little:** they used to stop at their own fifties, years short of a Human's. A Zabrak, Miraluka, Cathar, Nautolan and the like end 1 to 7 higher, most at 82 to 90.

**Named figures without a sheet that move by 2 or more** (3,640 BBY): Bowdaar 128 to 66, Suudaa Nemro 134 to 61, Shol Bestros 75 to 79, Jerbhen Hulis 83 to 87, Paran Am-Ris 57 to 62, Stantorrs 54 to 58, Broonmark 51 to 55, Khem Val 60 to 63, and the Inquisitors below.

## 2. Inquisitors without a sheet

Willpower trains at 1.4 times the path's measured pace (invented). It is for NPCs without a sheet only: the player's pace is measured on the day loop, and raising it would break that match.

| Sheet | Age | Willpower | Line before | Line now | Over | Within -5 to +3 |
|---|---|---|---|---|---|---|
| Acina | 50 | 88 | 73.5 | 84.3 | -3.7 | yes |
| Vowrawn | 71 | 86 | 74.3 | 85.0 | -1.0 | yes |
| Ragate | 75 | 82 | 73.7 | 84.3 | +2.3 | yes |
| Zash, Mekhis | 80 | 84 | 74.3 | 85.0 | +1.0 | yes |
| Baras | 54 | 92 | 73.9 | 84.7 | -7.3 | no |
| Exal Kressh | 32 | 82 | 59.9 | 67.8 | -14.2 | no |
| Jadus | 50 | 100 | 73.5 | 84.3 | -15.7 | no |
| Nox | 35 | 92 | 62.8 | 71.4 | -20.6 | no |

- **No one pace can hold them all.** Ragate (82 at 75) needs the old line at 85 or less, Baras (92 at 54) at 87 or more, and Jadus (100 at 50) at 95 or more. Kressh and Nox need a line of 77 and 87 at 32 and 35.
- **The four outside** are high for their age. They are sheeted, so they play at their sheets.
- **Left out:** the Dread Masters (96) and Vitiate (135), ancient and fixed.
- **Named Inquisitors without a sheet:** Rictus 72 to 82, Hadra 70 to 79, Karrid 83 to 96. Karrid is a Falleen of 44 whose line was already high for its age; 96 is the highest of any unsheeted Inquisitor.

**Sheeted figures are unaffected:** 228 dated readings (at each sheet, and 10 and 20 years either side), every stat the same as before.

## For you

1. **Consulars:** is 85 right, or should the unsheeted Consular's Willpower rise a little so that it is 1 to 8 above the Consular sheets (82 to 88) too?
2. **Inquisitors:** is five of nine enough, with the young ones (Kressh, Nox) far under?
3. **Karrid at 96:** leave it, or give Karrid a sheet?

## Numbers I invented

| Number | Where |
|---|---|
| Inquisitor Willpower pace 1.4 | data/npcHours.ts (NPC_WILLPOWER_PACE) |

## Tests

Two added in tests/m8/calibrationFix4.test.ts.

| Run | Result | Time |
|---|---|---|
| npm test | 1,674 of 1,674 | 25 s |
| test:lifetime | 56 of 56 | 1148 s |
| typecheck, lint | clean | |
