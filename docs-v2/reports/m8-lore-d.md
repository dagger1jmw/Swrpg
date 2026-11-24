# m8-lore-d: the TCW rule, the five new timeline sets and their rulings (2026-11-24; D-479, D-480)

npm test 1,568 of 1,568 (25 s); typecheck and lint clean. The index now reads 68 files (17 new).

## 1. TCW rule (D-479)

- **Names restored** for the narrator: Trench, Loathsom, Mar Tuuk, Ziro, Ima-Gun Di, Cham Syndulla and Nahdar Vebb. Every row keeps its [S-canon] tag.
- **Rex stays out;** Appo keeps the role, his numbers marked `invented` (D-478). Ahsoka is unchanged.
- **On hold, untouched:** Satine, Pre Vizsla, Bo-Katan, Almec, the TCW Mandalore. Queued.
- **Ahsoka as Anakin's Padawan is out of the three files:** Jedi training (her place on the *Jedi Path* chain, her assignment, Anakin's knighting now c. 20 BBY), Jedi ranks (the expulsion row is kept as "not used"), lightsaber forms.
- **New sets:** nothing TCW in them conflicts with primary Legends. The Kanz "nearly six billion" is tagged [S-canon].

## 2. Dates picked under the blanket rule

| Set | Item | Date picked | Why |
|---|---|---|---|
| 36,453–5,001 | 4 Coruscant the capital | 25,053 BBY | best fit |
| | 9 Hutt Empire ends | c. 15,000 BBY | best fit |
| | 12 Ragnos's accession | c. 5,100 BBY (5,200 noted) | your ruling |
| | 13 First Alsakan Conflict | 17,018 BBY | best fit |
| | 14 Contispex I elected | 11,987 BBY | best fit |
| 5,000–3,997 | 3 Battle of Korriban, counterinvasion | c. 4,999 BBY, late | **no best fit, both cited:** newer source (SWTOR codex) |
| | 8 Beast Wars start | 4,400 BBY | **no best fit, both cited:** the date the row had (*New Essential Chronology*) |
| | 9 Battle of Lorell | c. 4,030 BBY | **no best fit, both cited:** the date the row had (the battle page) |
| | 10 Jev Sunrider dies | 4,008 BBY | his page, over the year page's arithmetic |
| | 11 Krath founded | 3,998 BBY | **no best fit, both cited:** the date the row had (*New Essential Chronology*) |
| 3,996–3,951 | 1 Deneba, Kun crowned | 3,997 BBY | expected |
| | 8 Kanz Disorders | 3,970–3,670 BBY | expected |
| | 9 Revan captured | 3,957 BBY | expected |
| 3,950–3,701 | 3 Nyriss holds Revan | four years, 3,954–3,950 BBY ("three years" is the novel's phrase) | best fit |
| | 8 Duel on Coruscant | c. 3,750 BBY | best fit |
| | 9 Vowrawn born | 3,716 BBY | best fit |
| | 10 Kallea crashes on Nuvar | 3,701 BBY | best fit |
| | 11 Malgus born | 3,700 BBY (the 3,701 row is kept as "not used") | best fit |
| | 13 Karagga's accession | c. 3,840 BBY | best fit |
| 4–25 ABY | 5 Tahiri orphaned | 16 ABY | expected |
| | 7 Diversity Alliance | 23 ABY | expected |
| | 8 Viqi Shesh elected | 19 ABY | expected |
| | 11 Bacta War | 7 ABY | expected |

**Ton Phanan (item 10): 7 ABY.** He dies in the Halmad campaign, dated GrS 43:1:13. The GrS year turns over in its third month (Yavin, 35:3), so 43:1 still belongs to 43 − 36 = 7 ABY. *Iron Fist* agrees; only the 8 ABY year page doesn't. Marked Ruled, not lore.

The calendar rule also moves three rows filed "6/7 ABY" to 6 ABY: Mrisst (42:1:1), Noquivzor (42:1:31) and the release of the Krytos virus. GrS dates are now labelled notes beside the ABY date.

## 3. Could not apply cleanly

1. **Sadow's spirit: two accepted rulings clash.** 5,000–3,997 item 7 has Nadd destroy it in 4,400 BBY. 3,950–3,701 item 7 has Ovair's duel destroy it c. 3,750 BBY and keeps Nadd's version out of the timeline. The rows follow the second: Nadd kills Sadow himself, and nothing is said of the spirit. Queued with the *Shadow of Revan* note. **Which stands?**
2. **Four date clashes had no best fit and two cited sources** (bold above). My picks; please check.
3. **"Ruled" on every ruled row:** your prompt asked for the mark only where a ruling goes beyond the sources, the rulings file for every row. I marked every row, and wrote ", not lore" where it goes beyond them: the Ossus label, Primus Goluud's two steps, Kallea's 3,705–3,704 and Phanan's year.
4. **The same events are now told twice or three times** in places (the old timeline and the sets; 3,997 BBY in two of the sets). They agree, but cost the narrator room. Retiring the old timeline's rows for 36,453–3,701 BBY and 4–25 ABY would fix it: your call.

## 4. Found on the way

- **Two sections never reached the index,** because their headings have no year: the 2,000–1,000 BBY set's Part 2 (the Brotherhood of Darkness and the Ruusan campaign) and *The Clone Wars*' first year. Both headings are fixed, so those rows are sent from now on. Still out for the same reason: the 3,600–2,001 set's "Undated or spanning" table (its rows would give away later endings).
- **The parser read decimal years from their decimals:** "32.5 BBY" became 5 BBY, so eleven rows of the Naboo crisis sat in the wrong era. Fixed, with a test.
- **Not sent any more:** [weak], [unconfirmed], [primary] and "(uncited)" notes, and "Blank centuries" passages.
- **Two old-timeline errors beyond the lists:** the Mandalorian Wars came twenty years after the Great Sith War (it said sixteen), and the 4 ABY row still said "First Imperial Civil War".

## 5. Files changed

**New, committed and indexed:** the 17 files of the five sets, with every ruled row corrected and every Decisions list empty. The 4,000–3,997 BBY rows sit under the Old Sith Wars; 3,997 is the Krath Holy Crusade's, 3,996 the Great Sith War's, in the sets and in the old timeline.

**Old files corrected**
- *SW_Legends_Galaxy_Timeline:* about 65 rows, and the overviews, from Dawn of the Jedi to the Recovery, and 4–25 ABY. Three unsourced rows dropped: Sith infighting c. 4,400 BBY; "fewer than ten" Jedi; the Temple re-staffed c. 3,900 BBY.
- *SW_Characters_01, 02, 03, 04-05, 06, 07, 08, 14:* the errors the sets list. 06 and 08 now have Bao-Dur fire the Mass Shadow Generator on Surik's order.
- *SW_Characters_09 Part 2, SW_SWTOR_Era_Power_Structures_Part1, SW_Sith_Training_AllEras_Part1:* who killed the Dark Council in 3,950 BBY.
- *SW_Tython:* Ossus settled c. 25,783 BBY, not "730 years later".
- *SW_Great_Galactic_War_Part1:* Tol Cressa, last attested 3,946 BBY; the "two and a half centuries" of build-up.
- *SW_Timeline_3700_3600BBY_Part1, Part3:* Malgus's birth; the "250 years" and Dustig Trace (3,693 BBY) verdicts.
- *SW_Timeline_1000_33BBY_Part1, Part3; SW_Timeline_32_19BBY_Part2-4; SW_Timeline_2000_1000BBY_Part2; SW_Characters_12:* the TCW rule, Noga-ta's treaty c. 902 BBY, the headings above.
- *The three Ahsoka files* (section 1).

**Row errors from "Second round":** all five done. Desevro was nowhere called sterilised in a row of its own; the Fall of Desevro row now says it was spared.

**Other:** src/lore/parse.ts, tests/lore/lore.test.ts, decisions.md, RESEARCH_QUEUE.md, world-event-tags-1000BBY-4ABY-draft.md, progress.md.
