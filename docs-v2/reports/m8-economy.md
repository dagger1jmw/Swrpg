# m8-economy: credits, prices, pay, debt (2026-11-25)

Checklist item 5. Decision D-510. Spec: spec/economy.md (linked from the design notes' "Economy").

## 1. What was built

- **The code owns every credit.** Three AI events with no amount field: `trade` (buy, sell, or gear issued; the item in plain words), `money` (pay by kind and size; bribe, fine, loan, repay, exchange, steal, extort, returnFunds, orderLearns) and `living` (lifestyle or a civilian job). An amount the narrator adds is stripped and ignored (tested). Amounts reach the narrator only through the state block's ECONOMY lines, the turn after.
- **Prices:** a catalog of about 80 goods and services with sources; location, black market, the Coruscant food index, the post-Treaty depression, wartime and haggling as multipliers; dealer and fence prices. Every combat-scales ship class has a price, and a running-costs table is ready for item 13.
- **Currencies:** Republic and Imperial credits held apart, refused on each other's core worlds; changers off them; Hutt coin on Tatooine and in Hutt space.
- **Income, living and debt follow the calendar** (time jumps pay and charge).
- **Jedi and money, bribes and NPC wealth** as the brief set them.
- **Joined up:** a blockade's passage or boarding fine and a captivity ransom now come out of the wallet; what it cannot cover is owed to a Hutt (the blockade ledger keeps its record). Two engine flags for renown (`jediRewardReputation`, `jediWealth`) and one for world reactions (`debtBounty:<lender>`); a ranks event `orderStandingLost` for the Order's standing.

**One design call made in the build (for Jared):** the narrator names items in plain words and the code maps them to a catalog row, instead of being sent the list of price ids every turn (about 225 tokens of the 1,500-token state cap). This is the equipment design's rule for invented items. An unknown item is refused and sells nothing.

**Schema budget:** the narrative schema's cap is 12,000 characters with every event legal. The first draft was 346 over, so pay and the money deals share one event and one size field (small, fair, large). It fits now.

## 2. Vrath Xizor

Civilian to **soldier** (a mercenary and ex-Imperial sniper, trained by the Imperial military; the soldier's Blaster and Tactics fit better than the bounty hunter's Tracking). Estimated birth 3,680, dies 3,653.

| | Blaster | Agility | Endurance | Strength | Willpower | Tactics | Intelligence | Profession | Charisma |
|---|---|---|---|---|---|---|---|---|---|
| 3,661, before (civilian) | - | 36 | 36 | 36 | 31 | - | 21 | 21 | 13 |
| **3,661, now (soldier)** | **15** | 37 | 36 | 35 | 30 | 7 | 15 | - | 10 |
| 3,653, before (civilian) | - | 44 | 46 | 44 | 42 | - | 36 | 43 | 20 |
| **3,653, now (soldier)** | **38** | 49 | 47 | 44 | 41 | 18 | 20 | - | 12 |

At 27 in 3,653 he is a Journeyman shot. A sharper sniper would need a sheet.

## 3. Lore rulings of 25 Nov

- **Item 3, ruled and applied.** It amends D-493 ("the plan does not open 'at least a Master' figures"). Now a plan that holds lets the best bounty hunters and Mandalorians beat a Master-level foe (Baras, Grievous); against a top duelist it still only buys time; nothing touches an apex duelist or one beyond any duelist. Code: `planOpens` (engine/who.ts), `selectPlanWins` and `selectCanBeatNpc` (world/player.ts); the planning turn now takes a plan against a Master-level foe (it used to answer "no plan is needed"), the fight clears the power bar for that foe, and the timeline's kill list counts the win. Tested with Baras and Malgus in 3,650.
- **Item 4:** Karrid's invented sheet is kept as ruled. Her "for review" marks are gone from the roster note and the anchor's source, and from the lore note in SW_Characters_09_GGW_ColdWar_Part2 (which now gives Niman 75, as D-503 set).
- Items 1-2 (Dac, Krayt) wait for the 45-138 ABY tag-map review.

## 4. Every invented number

The full table is in the spec's section 11. In short:

- **Location** x0.85 Core, x1 Mid Rim, x1.25 Outer Rim, x1.3 Hutt space, x1.6 remote; food, services and luxuries half the swing.
- **Black market** x2 Hutt space, x2.5 remote, x3 Outer Rim, x4 Mid Rim, x5 Core (the x2-5 range is Jared's).
- **Haggle** 1 - 0.2 tanh(margin / 10); a merchant with no sheet at Charisma 40; the fence's 25-40% and the changer's 10-20% moved by the same curve.
- **Hutt space credits** +25%.
- **Coruscant food index** x1.3 / x2 / x3 / x4 at 0 / 90 / 200 / 368 days of the blockade.
- **Depression** goods x1.15, wages x0.8, fading over 10 years (cosine).
- **Wartime** military goods x1.5.
- **Military pay** private 500, corporal 700, sergeant 1,000, lieutenant 2,000, captain 2,600, major 3,200, colonel 4,500, general 8,000; kit by band.
- **Pay bands** not on record: contracts 3,000-8,000 and 20,000-40,000 (the 1,000 and 30,000 anchors are lore), odd jobs 1,500-4,000, rewards 3,000-8,000, all mission funds (300-600, 1,500-3,000, 8,000-15,000); risk x1 / x2 / x4.
- **Lifestyle** poor 20, comfortable 120, wealthy 400 a day (modest 50 is the lore's budget traveller); half of living is food.
- **Loans** the Exchange 350%; terms 24 months (bank), 6 (Hutt, Exchange); a bank lends up to six months of pay; sizes 1,000 and 10,000 (100,000 is Korr's advance).
- **Fines** 100 / 1,000 / 5,000.
- **Bribes** 0.1 / 0.5 / 1 / 3 months of the target's pay; rating 50, +3 per doubling.
- **NPC pay by role** (soldier 500, officer 2,600, official 2,000, politician 10,000, merchant 3,200, criminal 1,000 and the rest), **honest shares** (officials 30%, officers 40%, criminals 0, every Jedi and droid), **what NPCs carry** (0.05-0.3 months of pay, criminals 0.3-1.5, a crime lord x10, a Jedi 0-50 cr).
- **Jedi** pattern 3 known in two years, standing -5; wealth 10,000 cr, standing -15; quartermaster lists; 3% of NPC Jedi might keep a reward.
- **Start money** by start option (a smuggler 2,000, a trooper 200, a Kaas City family 2,000 Imperial, a Jedi or acolyte nothing).
- **Ships** curve powers 1 (fighters) and 1.5 (freighters); used 50%; running costs but the freighter's 30 cr docking; repairs 2% / 10% / 30%.
- **Catalog** 27 bases, among them carbine 800, heavy rifle 1,500, scattergun 600, disruptors 1,500 and 3,000, light armour 1,000, personal shield 10,000, forged papers 3,000, spice 100 a dose.
- **Rules:** stepping the lifestyle down when money runs short, and destitution.

## 5. Checks

npm test (155 files, 1,794 tests), typecheck and lint pass; test:lifetime passes (15 files, 56 tests).

## 6. Runs

- npm test: 30.6 s.
- test:lifetime: 1,228 s (20.5 min), including the lore rebuild. No progression numbers changed, so test:all was not needed.
