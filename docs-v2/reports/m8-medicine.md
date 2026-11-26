# m8-medicine: care, bacta and kolto, wounds, surgery, toxins (2026-11-25)

Decision D-511. Spec: docs-v2/spec/medicine.md (every invented number is in its section 12; the list is repeated below). Checklist item 6 ticked.

## 1. Medicine

What was built, in short (the spec has the rules):

- **The code owns care.** The intent names the care (treat, admit, tank, surgery, antidote, Force healer; where; the fluid; the procedure). The care plan turns it into engine events and the bill. The narrator is told the care that was applied, with the fluid the engine chose and the date's standard.
- **Levels:** none and field care x1, a facility x2, kolto x4, bacta x5. Field care stabilizes the dying by the Medicine check, as before, and dresses every wound.
- **Kolto and bacta by date:** before the 2,000 BBY switch-over, bacta is had only on Core worlds and at the Temple, at 1,200 cr a day against kolto's 400. After it, bacta is the standard at 400 and kolto costs 300.
- **Untreated wounds** by cause: tearing wounds infect and, from severe, bleed; blaster and lightsaber wounds only infect, at about a seventh of the chance.
- **Wound depth** heals without surgery. A bone heals only once set.
- **The treatment roll** decides how a treated severe-or-worse wound heals: lasting, minor lasting, scar or clean. Untreated wounds keep the 10 / 35 / 70% baseline.
- **Surgery** (needs a facility and Medicine 50+), **prosthetics** (priced, fitted by surgery, damaged or broken by hits), **toxins** (cleared by an antidote or the Force).
- **Cost and access:** free for Jedi at the Temple and soldiers in military medbays; everyone else pays through the economy.

### Treatment-roll shares (a critical wound)

| Care, operator | Clean | Scar | Minor lasting | Lasting |
|---|---|---|---|---|
| Untreated (baseline) | 0% | 65% | 0% | 35% |
| Field care, a medic (25 + 5) | 1% | 40% | 29% | 29% |
| A facility, its staff (45 + 20) | 51% | 33% | 8% | 8% |
| A kolto tank, staff (45 + 35) | 81% | 14% | 3% | 3% |
| A bacta tank, a skilled operator (50 + 45) | 94% | 5% | 1% | 1% |

## 2. Docs from the lore chat (J1)

Committed as saved: the 45–138 ABY tag map, Parts 1–3 (reviewed), its review notes, the 4–44 ABY tag map, Parts 1–3 (Luke apex from 25 ABY, Krayt apex), and the design notes (re-exported from Claude Docs rev 60, with a "Built" line added under "Medicine").

Lore rulings of 25 Nov, items 1 and 2, are recorded as applied by the 45–138 ABY review (lore-rulings-2026-11-25.md).

- **Item 1 (Dac):** the lore timeline's 137 ABY row still said "within three days". It now says "within a week", noted in the file.
- **Item 2 (Krayt):** the engine held Krayt as **beyond any duelist** for 130–138 ABY (src/data/duelists.ts, from D-494). He is now **apex**. His sheet was already at apex level (combat 102, Force Control 128, Willpower 110).

## 3. Vrath Xizor (J2)

His main canon date is 3,653 BBY, and he dies that year at about 27, so that is also his peak. On the soldier's line his Blaster never reached Master (61–80), so he now has a **sniper** weighting: an NPC-only career, the soldier's day with drill and staff hours moved to the range and to fieldcraft. Blaster pace 2.2 (the soldier's is 1.48), Stealth 0.45; both invented. Loadout: blaster rifle, light armour. Morale: a mercenary's.

| | Blaster | Stealth | Agility | Endurance | Strength | Willpower | Tactics |
|---|---|---|---|---|---|---|---|
| 3,661, before (soldier) | 15.2 | - | 36.7 | 36.0 | 35.4 | 30.4 | 7.1 |
| **3,661, now (sniper)** | **19.1** | 7.2 | 36.7 | 35.4 | 35.0 | 30.4 | 5.5 |
| 3,653, before (soldier): main date and peak | 37.6 | - | 49.4 | 46.6 | 44.1 | 40.5 | 17.8 |
| **3,653, now (sniper): main date and peak** | **47.3** | 17.9 | 49.4 | 44.5 | 42.8 | 40.5 | 13.8 |

**He is still Adept (47), not Master.** Measured: a Blaster pace of 3.0 gives 56, and 4.0 gives 65. Reaching Master by 27 would take about 3.6, roughly 2.5 times a soldier's pace, which is more than a weighting. If he should be a Master shot, a hand-set sheet is the way. Your call.

## 4. Jedi wealth (J3)

Personal holdings count only over **25,000 cr** (was 10,000). Order-issued gear and mission funds never counted, and still don't. A droid taken in play now doesn't count either (the catalog's three droid rows). Ships aren't sold through `trade`, so a ship taken in play never counts; Order ships aren't in the wallet. Tested: 24,000 plus clothes is no flag, 26,000 is; issued gear, a bought astromech and a speeder bought with mission funds leave possessions at 0.

## 5. Luke Skywalker (J4)

Luke had no line in the game. Only the Era 09 roster had sheets, so any Luke NPC was generated as a generic Jedi Master of his age. He is now a canon figure (src/data/canon/lukeSkywalker.ts) with three complete sheet anchors, and the engine draws one smooth curve through them:

- the **RotJ** sheet at Endor (4 ABY);
- the **New Republic** sheet, dated **19 ABY**. This date is an estimate: it's the sheet's last dated feat (his marriage to Mara), "by the end of the era". The sheet's own numbers ("Output 118 / Control 108") are also cited for the Dark Empire years (10–11 ABY). If you want the anchor there, it's one constant (`LUKE_NR_SHEET_BBY`);
- the **NJO** sheet at **25 ABY**, with Willpower raised **104 -> 105** (noted in the lore file).

Past 25 ABY the D-503 cap holds him: at most +5 over 20 years. Ranks: Padawan from 0 BBY, Knight from 4 ABY, Master from 12 ABY, Grand Master from 36. The Praxeum is c. 11 ABY, but he's 30 then and the role's minimum age is 31, so the Master span starts at 12. Duel bar: top duelist 10–24 ABY, apex 25–45 ABY (the 4–44 ABY map; the 45–138 review has him apex in 45).

| ABY | Before: main form | FC | FO | WP | **After: Djem So** | **FC** | **FO** | **WP** |
|---|---|---|---|---|---|---|---|---|
| 4 | Soresu 39.0 | 38.8 | - | 54.7 | **82.0** | **82.0** | **92.0** | **92.0** |
| 10 | Soresu 46.4 | 43.7 | - | 63.6 | **90.4** | **94.8** | **105.2** | **98.7** |
| 17 | Soresu 54.0 | 48.7 | - | 72.2 | **95.3** | **105.5** | **115.7** | **100.4** |
| 25 | Soresu 61.6 | 54.0 | - | 81.3 | **100.0** | **120.0** | **128.0** | **105.0** |
| 36 | Soresu 70.3 | 60.1 | - | 88.2 | **104.0** | **124.0** | **132.0** | **109.0** |
| 44 | Soresu 73.7 | 62.6 | - | 88.5 | **105.0** | **125.0** | **133.0** | **110.0** |

"Before" is the generator's line for a Jedi Guardian of his age and ranks with no sheet, which is what the game had. With the NJO sheet's old Willpower of 104, 25 ABY read 104.0 (one short of the apex line), 36 ABY 108 and 44 ABY 109. From 25 ABY all three apex lines are met: combat 98, Force Control 110, Willpower 105. This is tested at 25, 30, 36, 40 and 44 ABY.

At 10 ABY he already meets the top-duelist lines (combat 88, Force Control 85, Willpower 90). That fits the map's "top duelist from his return from Byss".

## 6. Runs

- `npm run test:all` (everything, including the lifetime tests): 1,874 of 1,875 passed in **1,301 s (21.7 min)**. All 15 lifetime files passed with the new healing (bacta x5, the treatment roll, the untreated risks). The one failure was the lore index check: I edited the lore timeline (the Dac row) while the run was going, after its index had been built. After a rebuild it passes.
- `npm test`: 1,819 passed (156 files), about 40 s. `npm run typecheck` and `npm run lint`: clean.
- Tests changed to the new rules: health test 7 and the tank multipliers (kolto x4, bacta x5); three care-wording tests (the engine names the fluid it chose); the intent prompt's healing example; the rank-span test (Luke); Xizor's archetype (sniper); Krayt's bar (apex).

## 7. Every invented number

| Number | Where |
|---|---|
| Bacta tank x5 (Jared's design default; kolto x4 and facility x2 are health §7's) | `CARE_MULT` |
| Care bonuses: bacta 45, kolto 35, facility 20, field 5 | `CARE_BONUS` |
| Default operators: field 25, medcenter 45, Temple 60, military 45, ship 35 | `DEFAULT_OPERATOR` |
| Treatment roll: difficulty 30 / 50 / 70, spread 12, minor-lasting base 25 / 35 / 30%, a minor injury 30% of the penalty | `TREATMENT` |
| An untreated severe or worse wound that leaves no lasting injury scars | `UNTREATED_SCARS_FROM` |
| Untreated: infection after 1 day at 15% a day, infected x0.5; bleeding 25% of max Vitality a day from severe; worsening 10% a day; cauterized infection x0.15 | `UNTREATED` |
| Worsening by the day's risks stops at critical | `worsened` (features/health/medicine.ts) |
| Surgery: Medicine 50+, facility +10, difficulty 50 / 60 / 45, spread 20, a bad miss below -15; the three outcome tables | `SURGERY`, `surgery` |
| Prosthetic damaged at W 10, broken at W 20; damaged x0.5 adaptation | `AID_DAMAGE_W`, `AID_DAMAGED_SHARE` |
| Prosthetics available in every year | `PROSTHETIC_PRICE` |
| Toxin: no healing, 20% of max Vitality a day, worsening 10% a day; the Force purge read as Force Heal 10 (+ Meditation 15 for oneself) | `TOXIN`, `FORCE_PURGE` |
| Facility 150 a day; surgery 3,000 / 5,000 / 1,500; repairs 10% / 30% of the price | `MEDICAL_PRICE` |
| Tank a day: standard 400, bacta as a rare import 1,200, kolto after the switch-over 300 | `TANK_DAY` |
| Bacta before the switch-over only on Core worlds and at the Temple | `BACTA_RARE_AT` |
| A tank course at least 6 hours | `TANK_MIN_HOURS` |
| Antidote 250 (the middle of the game's 75-500) | catalog `antidote` |
| A medical bill's shortfall owed on bank terms | `carePlan` |
| Sniper paces: Blaster 2.2, Stealth 0.45 (the rest the soldier's, Strength, Endurance and Tactics lowered); loadout and morale | `SNIPER_PACE`, archetype `sniper` |
| Luke's New Republic sheet dated 19 ABY; his Master span from 12 ABY | `LUKE_NR_SHEET_BBY`, lukeSkywalker.ts |

From lore or a game stat, not invented: medpac 500 (FastFlesh), a doctor's treatment 500 (3,956 BBY), prosthetic arm or leg 2,000 and hand 1,000 (Repli-Limb), quality cybernetic 7,500 (Beemon implant, 3,956 BBY), kolto x4 and facility x2 (health §7).

## 8. Reading of the brief

- "After it, bacta is standard and cheaper": read as cheaper than bacta was before (1,200 down to 400). Kolto after the switch-over is cheaper still (300), because the lore calls it "the cheaper option" by the Galactic Civil War.
- "Field care stabilizes": the existing Medicine check still decides whether a dying wound is stabilized. A `heal` turn with no care named is now field care (`treat`). It used to be a week of medical care.
