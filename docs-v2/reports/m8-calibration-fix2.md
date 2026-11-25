# m8-calibration-fix2: tonight's rulings, Force Sense, and the re-check (2026-11-25)

Decision D-495. Baseline for "before": m8-calibration-fix (8d68cc1).

| Item | Result |
|---|---|
| 0. Rulings | All in: see section 0 |
| 1. Force Sense | As written on the sheets; never more than 10 levels behind Force Control for anyone else |
| 2. Force Knowledge, Meditation | As written where the focus holds them |
| 3. Charisma | One rising curve, order kept |
| 4. Floor | Never above the sheet |
| 5. Force boost for NPCs | In every fight |
| 6. Force abilities | Already as written |
| 7. PP-9 alternative 2 | Only step 3's ship |
| 8. Files | Committed; apex tier in all six tag maps' design rules |

**Checks:** a Master never beat a top duelist (0 of 800). No gate failed. No pace moved but the Sith's Force Sense.

## 0. Tonight's rulings

| Ruling | State |
|---|---|
| Malgus 92 / 88 / 90 / 94 | already in |
| Revan, freed: 94 / 94 / 106 | already in |
| Yoda: Ataru 100 | already in (32-19 BBY); applied now in exile |
| Yoda: FC 122, FO 112, WP 115 | applied now (eras 11, 12, 13) |
| Sidious, Chancellor: Juyo 98 | already in |
| Sidious, Chancellor: FC 118, FO 125, WP 120 | applied now |
| Emperor: FC 128, FO 130 | already in |
| Emperor: Juyo 98 | applied now |
| Mace 100; Satele FO 90; Baras 84; Saesee Tiin 86 / 82 / 82; Knightfall WP 72; Obi-Wan 96 | already in |
| Vitiate: Makashi 80 | already in; applied now in the Era 09B table |
| Vader, Dark Times | applied now (new sheet) |
| Vader I below it in every stat | already so; its table said 106 / 108, now 107 / 90 as the block |
| Vader II 104 / 108 / 102 / 102 | applied now (FC was 116, FO 105) |
| Luke at Endor 82 | already in; the note applied now |
| Krayt: the block everywhere; Niman, Jar'Kai | applied now, in every file that had 132 |
| Exar Kun Niman 110 | already in; noted |
| Karness Muur's spirit | applied now (new sheet, Era 02 file) |
| Zannah WP 105 | applied now |
| Abeloth: physical, destroyed, 185; Mortis | applied now |
| Top tier 88 / 85 / 90 | already in |
| Apex 98 / 110 / 105 | applied now (was 98 / 100 / 100), code and maps |

- **Krayt's order.** With the block's numbers the Emperor (128 / 130) is level with or above Krayt (128 / 126), so the lists now put Krayt after the Emperor.
- **By the numbers, not on your list:** Bane (104 / 110 / 114) meets the apex tier exactly. So do Palpatine reborn, Krayt, and Luke from 40 ABY. Nothing in the game uses these yet.

## 1. Force Sense

**The rule (proposed; the 5 and 10 are invented).** Each point of Force Control XP also gives Force Sense XP, at a share that rises with the gap: none up to 5 levels behind, all of it at 10 behind. So it is never more than 10 behind. A character's own sensing practice still adds, so seers and Consulars lead.

- **Nothing else pays for it:** no hours move.
- **The Jedi are unchanged:** their routines already keep it within 5. My first version had no free 5; it made the Average meet the Knight's Force Sense 40 2.2 years early, over the gate's 2, so I changed the rule, not the gate.
- **The closed form matches the loop** within 0.5 levels in every Force archetype at 25 and 40.
- **Same rule everywhere:** the player's day loop, character creation and generated NPCs.
- **Careers:** none, unchanged.
- **Rust:** Force Control practice keeps it off Force Sense.

**Player, day loop** (tests/lifetime/forceSense.test.ts)

| Archetype | Knight, 25 | Master, 40 |
|---|---|---|
| Guardian | 46.4 / 44.2 | 55.7 / 53.1 |
| Consular | 44.3 / 43.5 | 45.9 / 50.2 |
| Sentinel | 45.6 / 44.0 | 52.7 / 52.8 |
| Sith Warrior | 42.1 / 33.8 | 46.2 / 39.0 |
| Sith Inquisitor | 42.1 / 33.8 | 48.5 / 41.0 |

(Force Control / Force Sense. A soldier has none.)

**On the sheets:** Malgus 22 → 84, Marr 25 → 86, Thanaton 23 → 82, Scourge 25 → 84, Nox 16 → 88, Jadus 22 → 92.

## 2-6. The sheets in the game

**Force Knowledge and Meditation**, as written for: Consulars (both); Sith Inquisitors (Force Knowledge); and by name Satele, Revan, Vitiate, the Dread Masters, Ragate, Zash, Exal Kressh, Mekhis and Nox (both). The names after your three are my reading. Satele 26 → 90 and 31 → 94; Revan 80 → 98 and 80 → 90; Vitiate 100 → 134 and 100 → 124.

**Charisma** (invented curve)

| Sheet | 40 | 60 | 75 | 90 | 100 | 122 |
|---|---|---|---|---|---|---|
| Game | 25 | 40 | 55 | 82 | 95 | 118 |

Vitiate 118, Revan 82, Satele 78, Vowrawn 78, Malgus 75, Baras 75, Marr 71; Kilran and Malcom 60; Ragate 42. It applies to smugglers too, or they would pass Satele.

**The floor.** Back to the sheet: Orgus Din 94 → 78, Willpower 108 → 86; Bela Kiwiiks 89 → 78; Zym's Willpower 125 → 88; Vindican's 102 → 80; Ragate's, Zash's, Mekhis's and Vowrawn's Force Output. A form the sheet lacks is held just under the figure's best, or Orgus would fight with Soresu 93.

**The Force boost.** Malgus in a fight: Agility 51 → 82, Endurance 60 → 92, Vitality 79 → 107.

## 7. Fight sweep (200 each, before → now)

**Kaedan and Thanaton, 3,661 BBY,** the same sample as before (new seeds): a Master of 45 with only a form.

| Opponent | Soresu 67, won | Soresu 80, won |
|---|---|---|
| Kaedan | 22 → 22 | 36 → 32 |
| Thanaton | 93 → 52 | 151 → 100 |

**Top duelists,** each at the sheet's date. *Master:* the average Guardian of 45 (Soresu 72, FC 58, FS 56, WP 72). *High Master:* the same at 60 (85 / 66 / 64 / 87). *Top tier:* that one raised to 92 / 88 / 88 / 94.

| Opponent | Player | Won | Lost | They broke off |
|---|---|---|---|---|
| Malgus | Master | 0 → 0 | 136 → 186 | 64 → 14 |
| | High Master | 0 → 0 | 122 → 171 | 78 → 28 |
| | Top tier | 136 → 59 | 63 → 136 | — |
| Marr | Master | 0 → 0 | 134 → 160 | 65 → 40 |
| | High Master | 0 → 0 | 76 → 112 | 124 → 86 |
| | Top tier | 129 → 107 | 71 → 92 | — |
| Satele | Master | 0 → 0 | 148 → 154 | 50 → 46 |
| | High Master | 0 → 0 | 88 → 99 | 107 → 96 |
| | Top tier | 120 → 111 | 79 → 84 | — |
| Revan | Master | 0 → 0 | 158 → 162 | 42 → 38 |
| | High Master | 0 → 0 | 143 → 156 | 56 → 42 |
| | Top tier | 95 → 92 | 98 → 103 | — |

The rest of each 200 are stalemates.

- **No Master won outright.** A High Master doesn't either: 66 Force Control is below the top tier.
- **Without the power bar** (the dice alone) a Master would win 13 / 39 / 42 / 36 of 200 against Malgus / Marr / Satele / Revan, where it was 60 / 61 / 43 / 39. So the bar is still needed: a Master would beat a top duelist outright 7 to 21% of the time.
- **Holds:** a Master held one off briefly in 175 to 183 of 200 fights, win or lose. That is nearly every fight, because a fight counts from 6 exchanges. High, if a hold is meant to be an achievement.
- **Malgus gained the most:** Force Sense 22 → 84 gave the precognition back. A top-tier player now beats him 30% of the time.

## 8. Bands re-measured (canon figures with the stat on their sheet, median by standing)

| Stat | Below Master (40) | Master, Darth (60) | Councils (80) | Ancient (100) |
|---|---|---|---|---|
| Intelligence | 22 → 22 | 50 → 50 | 70 → 70 | 84 → 84 |
| Tactics | 70 → 70 | 40 → 40 | — | 60 → 60 |
| Charisma | 13 → 60 | 15 → 62 | 15 → 68 | 15 → 68 |
| Melee | 84 → 84 | — | 84 → 84 | 0 → 0 |
| Blaster | 82 → 82 | — | 84 → 84 | 0 → 0 |
| Stealth | 0 → 0 | — | — | — |

**Moved more than one tier:** only Charisma of the six (45 figures, all up, from 12-19 to 42-118). Outside the six: Force Sense (13 Sith), Force Knowledge (Acina, Baras, Jadus, Nox, Exal Kressh, Satele, Syo Bakarn, the Barsen'thor), Meditation (Dar'Nala, Nox, Exal Kressh, Ragate, Satele, Syo Bakarn, the Barsen'thor), Ragate's Force Output (110 → 62), Vindican's Willpower (102 → 80).

Charisma at 60 for an ordinary Knight reads "a leader" in the band table; the sheets put most Jedi at 74-80, so the curve cannot both spread them and keep them.

**Zeros:** Theron Shan's Stealth 78 reads 0 (the soldier archetype doesn't train it), and Karagga's blaster and melee (16, 22). Same before this run.

## 9. Paces and gates

Measured on the day loop before and after (npm run paces, 198 s; main at 25 years in brackets):

| Archetype | Moved |
|---|---|
| Sith Warrior (55.51 → 55.51) | Force Sense 0.088 → 0.139, 0.209 → 0.907, 0.155 → 0.231 (the three phases); nothing else |
| Sith Inquisitor (53.94 → 53.88) | Force Sense 0.088 → 0.138, 0.207 → 0.902, 0.150 → 0.332; everything else by 0.005 or less |
| Guardian, Consular, Sentinel | nothing |
| All careers | nothing |

The table in archetypes.ts keeps the routine's own hours (the rule is added on top in the closed form), so it is unchanged. The knowledge bands (D-461) don't read Force Sense.

**Older drift, not from this run:** the careers' physical paces in the table are about 5 to 10% above the loop's (soldier Agility 0.683 against 0.623). Both trees measure the same; D-472's ageing is the likely cause.

| Run | Result | Time |
|---|---|---|
| npm test | 1,633 of 1,633 | 21 s |
| test:all | 1,689 of 1,689 | 1,125 s |
| test:lifetime | 56 of 56 | 1,107 s |
| typecheck, lint | clean | |

## For you

1. **A Sith on the default routine is still short of the Lord's Force Sense 40 at 25** (34; 39 to 41 at 40), and of the Force Control 44. The rule lifts it from about 15. A tighter gap would meet it.
2. **Canon Masters now sit below an average generated Master of their age** (Orgus Din 78 and Willpower 86, against 94 and 108). That follows from item 4. Keep?
3. **The gap of 10:** right, or tighter? The sheets' own gaps are at most 10 in the SWTOR era; Yoda's is 22 and Vader's 16.
4. **My list for item 2** after Satele, Revan and Vitiate: right?
5. **Charisma curve:** high enough for the ordinary (60), low enough?
6. **Malgus returned** (Era 09B: FC 95, FO 92, WP 96) is above your 88 / 90 / 94. I left it as a separate snapshot. Bring it down?
7. **Yoda in exile with Ataru 100:** the sheet still says too aged to duel (Agility 54). I kept both, with a note.
8. **Bane meets the apex tier.** Apex duelist, or lower his Willpower or Force Control?
9. **Abeloth's throat-crush** stays in the notes (your ruling doesn't name it; the audit found no source).
10. **A hold happens in about 9 of 10 fights.** Raise the 6 exchanges?
11. **Careers' physical paces** (section 9): re-measure in a later run?

## Numbers I invented

| Number | Where |
|---|---|
| Force Sense's gap: 10, and 5 left to its own training | progression.config.ts |
| Charisma's anchors: 0-0, 40-25, 60-40, 75-55, 90-82, 100-95, 122-118, 150-150 | sheetScale.ts |
| A form not on the sheet: 0.1 under the best | canonStats.ts |
| Dark Times Vader's other stats: 2 above Vader II (Strength 102, Agility 80, Endurance 100, Charisma 82, Intelligence 94, FS 94, Meditation 80, FK 92; Makashi 94, Soresu 92, Shii-Cho 90; Force Choke 104, Telekinesis 106, Force Body 104, Force Sense 94; sub-abilities 94, 94, 90) | Era 13 |
| Karness Muur's spirit: FS 98, Meditation 94, FK 106, FC 116, FO 122, WP 118, Charisma 72 and Intelligence 90 (the living sheet's), Alchemy 108, Lightning 112, Mind Probe 100, Telekinesis 100 | Era 02 |
| Krayt: Niman and Jar'Kai 102 (Djem So's old number), Djem So 98 (Niman's) | Era 18 |

In the sweep only: the top-tier player's 92 / 88 / 88 / 94.
