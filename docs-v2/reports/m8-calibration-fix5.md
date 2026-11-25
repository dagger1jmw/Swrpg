# m8-calibration-fix5: Willpower, High Masters and Knights in holds, the ship lore (2026-11-25)

Decision D-498. Holds: [spec/holds.md](../spec/holds.md).

| Item | Result |
|---|---|
| 1. One clock | As built in D-497 (confirmed by Jared, D-499) |
| 2. Old NPCs' natural Willpower | Built; **it does not bring the line to the sheets** (section 1) |
| 3. High Masters | Struck aside and standing in 17 to 20% of holds |
| 4. Knights | A corridor against Malgus in 11% of holds |
| 5. Ship shields and weapons | Committed and indexed; **nine of the ten decisions are not in the repository** (section 3) |

## 1. Old NPCs' Willpower

Natural Willpower now grows on the training day's schedule past 50. The five sheets again (the generated line for each figure's archetype, rank and age):

| Figure (age) | Sheet | Line before D-497 | Line at D-497 | Line now | The line at 50 | In the game |
|---|---|---|---|---|---|---|
| Ven Zallow (60) | 84 | 98 | 96.2 | 95.9 | 88.7 | 84 |
| Vindican (64) | 80 | 102 | 97.7 | 97.5 | 87.2 | 80 |
| Angral (67) | 86 | 105 | 98.8 | 98.6 | 87.2 | 86 |
| Bela Kiwiiks (70) | 84 | 102 | 94.2 | 93.9 | 85.8 | 84 |
| Orgus Din (72) | 86 | 108 | 99.8 | 99.6 | 88.7 | 86 |

- **It moves the line by 0.2 to 0.3.** Natural Willpower is nearly flat by then (38.3 at 50, 40 at 60, then nothing), and it adds to trained Willpower as XP, so it counts for little up there. My question in fix4 made it sound larger than it is.
- **The rest is in two parts.** The line is already 86 to 89 at 50, 1 to 7 above these sheets. Training past 50, even on the falling schedule, adds another 7 to 11.
- **The five figures are at their sheets in the game**, because the generated line never lifts a sheeted stat (D-495; now a test). The gap only concerns figures without a sheet.
- **To bring the line nearer:** a faster fall for Willpower alone. With none at all after 50 it would be 86 to 89, which is 1 to 7 above. Below that, the years before 50 would have to change, and there the line runs *under* the sheets (Malgus at 47: 85 against 94).

## 2. Holds

**The samples.** The 400-hold tables of fix3 and fix4 were too few for the rare shares, and used the same seeds every time: a fresh set gave 2.5% where that one gave 10%. Everything here is 4,000 holds each on new seeds. Fix4's Knight figure, 23%, has the same flaw.

**High Masters (60)** against the top duelists:

| | Malgus | Marr | Satele | Revan |
|---|---|---|---|---|
| **Struck aside, standing** | **17%** | **18%** | **18%** | **20%** |
| The duelist broke away, standing | 5% | 7% | 7% | 4% |
| Killed | 71% | 69% | 69% | 71% |
| Taken or left | 7% | 6% | 6% | 6% |

The blow of getting past is lighter the nearer the holder is to the duelist (its least margin: 9.5 at a gap of 14 to 21, 12 at 24, 20 at 40). Regular Masters (6 to 7% standing) and Knights (6 to 7%) are as before. Anyone nearer still lives more often: someone near Malgus's level is standing after 43 to 56% of holds against the top duelists, and after 23% against Sidious.

**Knights (30):** the chance to get past at a gap of 38 is 66% (was 53%). A corridor against Malgus: 11%; Marr 10%, Satele 9%, Revan 4%.

**The table again** (a corridor's 20 s / a hangar's 45 s):

| Holder | Malgus | Marr | Satele | Revan | Sidious |
|---|---|---|---|---|---|
| Knight, 30 | **11 / 0** | 10 / 0 | 9 / 0 | 4 / 0 | 1 / 0 |
| Master, 45 | 57 / 24 | 56 / 23 | 55 / 22 | 47 / 15 | 4 / 0 |
| High Master, 60 | 83 / 61 | 83 / 60 | 82 / 58 | 73 / 43 | 15 / 1 |
| Near Malgus's level | 96 / 89 | 96 / 90 | 96 / 90 | 92 / 80 | 60 / 26 |

Only the Knights' row was tuned. The apex duelists now have their own curve, the same as before, so the Knights' change cannot reach them.

## 3. Ship shields and weapons

- **Committed** as written, with `[note: ...]` tags: the rulings, and that SW_Starships_Classes.md does exist (decision 10 says it does not; it was missing from the researcher's uploads only).
- **In the lore index** (docs-v2/lore/README.md, Starships and space combat) and named in checklist item 13. The narrator does not read it, as with the other two ship files.
- **Ruled and recorded:** one shield pool per facing, which torpedoes and missiles partly bypass.
- **Closed, 25 Nov 2026 (D-505):** m8-combat-scales arrived; the other nine are recorded in the file and built in spec/combat-scales.md. What follows is as it stood.
- **Not recorded:** the other nine. "As in m8-combat-scales" names nothing in the repository, its history or its branches. The file's own decisions 2 to 10 point at it.
- **Checked:** Legends only. Its Canon-only and post-2015 items are listed as not used. [S-canon] items (the thermal shield, the *Malevolence*) and [gray] counts are still in the body; decisions 4 and 8 are about them. No year framing (D-438).

## For you

1. **m8-combat-scales:** done (D-505).
2. **Willpower of old figures without a sheet:** leave the line, or a faster fall for Willpower alone?
3. **One clock:** confirmed (Jared, D-499).

## Numbers I invented

| Number | Where |
|---|---|
| The chance to get past, changed: 38: 0.66 (was 0.53), 45: 0.80 (was 0.75) | data/holds.ts |
| The apex curve: D-497's 1.15 times written out (10.4: 0.055, 17.4: 0.1, 20.9: 0.21, 27: 0.28, 33: 0.53, 39.1: 0.75, 60.9: 0.95), never under the ordinary one | data/holds.ts |
| The blow: up to 12 over 0: 5, 14 and 21: 9.5, 24: 12, 40: 20 (was 8 + 0.3 a point) | data/holds.ts |

## Tests

| Run | Result | Time |
|---|---|---|
| npm test | 1,670 of 1,670 | 25 s |
| test:lifetime | 56 of 56 | 1148 s |
| typecheck, lint | clean | |
