# Economy (as built, M8 item 5)

Design: m8-design-notes.md, "Economy" (all agreed). Lore: Docs/SWRPG lore/SW_Economy_* with the D-464 rulings. Decision: D-510. Every number not on record is `invented`; section 11 lists them all.

Code: `src/data/economyPrices.ts` (the price catalog), `src/data/shipPrices.ts` (ships and running costs), `src/data/economy.config.ts` (every other number), `src/engine/economy.ts` (rules, pure), `src/features/economy/` (state, events, the day hook, the narrator's lines). Tests: `tests/m8/economy.test.ts`.

## 1. The code owns every credit

The narrator reports what happened; the code sets every sum.

- **AI events** (in the narrative schema): `trade` (buy, sell, or gear issued, with the item in plain words), `money` (pay by kind and size; a bribe, a fine, a loan, a repayment, a money changer, theft or extortion, mission funds returned, the Order learning of rewards kept), and `living` (the lifestyle or a civilian job).
- **No amount field.** The schemas carry no number the narrator could set. An extra field (`credits`, `price`) is stripped by the schema and ignored (tested).
- **Engine and player only:** `creditsCharged` (a sum owed now: a blockade's passage or fine, a ransom), `militaryServiceSet` (enlisting, a grade, discharge), `economyTold`.
- The state block gets an ECONOMY section: the wallet, what the place takes, living and job, debts, and the money lines not yet told. Amounts reach the narrator only from there, the turn after they happen.

## 2. Prices

### 2a. The catalog

`PRICE_CATALOG`: about 80 goods and services, each with a base in Republic credits at a Mid Rim market, a kind (manufactured, military, food, service, luxury), legality, and its source: in-universe first (tier 1), game stat as backup (tier 2), else `invented` from the class table's damage order or a neighbouring item.

**Items in plain words.** The narrator names what was bought ("a heavy blaster pistol", "a bowl of nelab stew"); `resolvePriceId` maps it to a catalog row (ids, catalog names, then a list of common words, longest phrase first). Nothing fits, nothing is sold. This is the equipment design's rule: an item the narrator invents maps to a generic class and never gets a price from the narrator. The price-id list stays out of the per-turn context.

**Equipment (spec 22).** The catalog's weapon, armour and gear rows are the class table's classes. The equipment catalog, when built, prices each named item by a `priceId` on these rows (named variants and quality tiers adjust it there). Until then `WEAPON_KIND_PRICE` and `ARMOR_KIND_PRICE` price the stub weapon and armour kinds.

### 2b. Modifiers

Price = base x location x dated events x black-market markup (restricted only), then haggling. The credit is stable across eras: dates move prices only through events.

| Modifier | Rule |
|---|---|
| Location | By the world's region: Core 0.85, Mid Rim 1, Outer Rim 1.25, Hutt space 1.3, remote (Wild Space, Unknown Regions) 1.6. Manufactured and military goods take it in full; food, services and luxuries half the swing. |
| Legality | Restricted goods are sold only on the black market, at x2 (Hutt space), x2.5 (remote), x3 (Outer Rim), x4 (Mid Rim), x5 (Core): the harder the law presses, the dearer. |
| Coruscant food index | While the Hydian blockade stands in this campaign (the world's record, not the date), food on Coruscant by days since it began: x1.3 at the start, x2 at 90 days, x3 at 200, x4 at a year (interpolated). Living costs there rise with it (half of living is food). |
| Post-Treaty depression | In Republic space, from the Treaty's day (the network's record; the lore's 3,653 when it stands as history): manufactured goods and food x1.15 and wages x0.8, fading smoothly (cosine) to nothing over 10 years. Never in Hutt or Imperial space. |
| Wartime | Military goods x1.5 on worlds of a side at war (the WARS table). |
| Haggling | A Charisma contest (the character against the NPC, or a generic merchant at 40) moves the price by 1 - 0.2 tanh(margin / 10): always inside +/-20%. |

### 2c. Ships and running costs (for item 13)

Every combat-scales class has a price. Recorded: X-wing 150,000, Y-wing 135,000, TIE/D 300,000, TIE/LN 60,000 (inferred: the Defender is over five TIEs), Nebulon-B 19.4 million, ISD 388 million (inferred: twenty Nebulon-Bs), Lucrehulk 40 million (black-market value), Inexpugnable 70 million (the *Courageous*). The rest follow a smooth curve on length through their group's anchor: fighters 150,000 x (length / 12.5 m), freighters 85,000 x (length / 27 m)^1.5 (the YT-1000), capital ships 19.4 million x (length / 300 m)^1.79 (through the Nebulon-B and the ISD). A used ship is half of new.

Old Republic examples: Aurek 110,000; Dynamic freighter 86,100; XS freighter 615,000; Defender corvette 2.43 million; Thranta 17.1 million; Hammerhead 21.2 million; Terminus 25.6 million; Interdictor cruiser 67.1 million; Harrower and Valor 112.3 million; Centurion 232 million.

Running costs by ship kind (`RUNNING_COSTS`): docking a day (a freighter 30 cr, Docking Bay 87), fuel a jump, upkeep a month as a share of the price (freighters and light ships 0.1%, Jared, D-521; warships their own shares). Fees on record: 100 cr on arrival (Ahto City, Anchorhead), 600 cr leaving an Exchange dock, 10 cr a ton for hyperspace coordinates. Repairs: 2%, 10% and 30% of the price for light, heavy and crippling damage. Item 13 charges them; nothing does yet.

## 3. Selling

A dealer pays half of base at the local market, haggled. A fence pays 25-40% of base (the haggle moves it inside the range) and is the only buyer of stolen or restricted goods.

## 4. Currencies

- **The wallet holds each currency apart:** Republic credits, Imperial credits, and Hutt coin (counted in wupiupi, so every sum is exact).
- **Equal face value, refused on the other side's core worlds.** Republic core: a Core-region world the Republic holds or with no control on record. Imperial core: Dromund Kaas, Korriban, Ziost, or a world the planets file marks IMP-CORE, while the Empire holds it. Everywhere else both pass at face value.
- **Money changers** work in border and neutral space (never on either side's core worlds) and take 10-20%, the haggle moving it.
- **Hutt coin** on Tatooine and in Hutt space (by region or Hutt control): peggat 40, trugut 10, wupiupi 0.625 credits (WotC). Hutt coin pays first there; credits pass at a 25% markup.
- Pay arrives in the payer's currency: the Empire's people pay Imperial credits, the Republic's and the Order's Republic credits, others the local one.

## 5. Income

Paid as calendar time passes, in the day hook, so a time jump pays out too.

- **Military:** monthly pay by grade on the first of each month (private 500, corporal 700, sergeant 1,000, lieutenant 2,000, captain 2,600, major 3,200, colonel 4,500, general 8,000), equal for both sides, each in its own credit. Kit is issued free by band (enlisted, NCO, officer: `trade` with dir `issue`), and barracks provide room and board.
- **Wages:** menial 500, skilled 2,000, professional 3,200 a month (the game defaults), lower in Republic space through the depression.
- **One-off pay** by kind and size (small, fair, large), drawn inside a band on a log scale: bounties (street 500-5,000, notable 10,000-100,000, galaxy-class 250,000-2 million), mercenary contracts, smuggling cuts, odd jobs (times risk: low x1, medium x2, high x4), and rewards.
- **Start money, job and lifestyle** by start option (`START_MONEY`): a Republic trooper is a private in barracks with 200 cr; a smuggler has 2,000 cr and no salary; a Jedi owns nothing.

## 6. Jedi and money

- **The Order keeps a Jedi:** room and board (lifestyle `provided`), basic gear from the quartermaster (and armour from Knight), no pay. Mission funds (`money` kind `missionFunds`) go to a separate purse that pays mission purchases first and is returned (`returnFunds`). A Padawan's are held by the Master.
- **Accepting a reward** (`money` kind `reward`) has no mechanical effect unless another Jedi sees it (a Jedi present in the scene, decided by the code) or the Order finds out (`orderLearns`). Then it scales with the pattern: now and then, at most a reprimand (a note for the narrator); three known in two years, a reputation among the Jedi (flag `jediRewardReputation`, for renown once built) and Order standing -5.
- **Amassing wealth:** personal holdings (wallet and goods bought) over 25,000 cr are attachment (Jared, D-511; was 10,000): flag `jediWealth` and Order standing -15, a world reaction (`orderStandingLost` in ranks), alongside alignment. Order-issued gear, mission funds and Order ships never count, and neither does a personal ship or droid taken in play (`JEDI_MONEY.notHoldings`).
- **Theft and extortion** (`money` kind `steal` / `extort`) take what the NPC carries and are recorded as dark-side choices (`darkChoices`) for the alignment system to read once it is built. Honest work for pay is open to a stranded Jedi.
- **NPC Jedi** decline rewards; the GM prompt says so. A share (3%) are less firmly light, by the NPC's own seed: the state block names one present as someone who might keep a reward now and then. No NPC Jedi amasses wealth.

## 7. Living costs

A lifestyle tier is charged each day where the character is: poor 20, modest 50 (the budget traveller), comfortable 120, wealthy 400 cr, as a service at the local market (half the location swing), with the food index on half of it. `provided` (the Temple, barracks, the Academy) is free and can be set only by those housed there. When the money runs short the living steps down to what the wallet covers; with nothing at all the character is destitute (a note to the narrator). A meal or a room bought for the story is a `trade`. Ship upkeep is the running-costs table's (section 2c).

## 8. Debt

- **Lenders:** a bank at 15% a year over 24 months, lending no more than six months of the borrower's pay; a Hutt at 300% over 6 months; the Exchange at 350% over 6 months. Sizes: small 1,000, fair 10,000, large 100,000 (Zeerid Korr's Exchange advance, 3,653).
- **Repayment follows the calendar:** each month an even share of the principal plus a month's interest, paid from the wallet (any currency, as a transfer). A missed payment adds the interest and climbs a stage: a warning, then collectors (a time jump stops), then a bounty on the debtor (flag `debtBounty:<lender>`; a jump stops). `repay` settles a debt in full or in part.
- **Sums owed now:** a blockade's passage or boarding fine, a fine, a ransom (`creditsCharged`): paid as far as the wallet goes, the rest a debt (a Hutt's for blockade sums and ransoms; the authorities' for fines, on bank terms). The blockade ledger keeps its record as before.

## 9. Bribes and NPC wealth

- **A bribe** is a share of the target's monthly pay by size (small 0.1, fair 0.5, large 1, lavish 3 months; pay by role in `ROLE_PAY`), with a Charisma check against rating 50 (DC 15), +3 for each doubling over a fair offer. An honest target refuses any amount, and no credits change hands: every Jedi, every droid, and a share of each role by the NPC's own seed (30% of officials, 40% of officers, none of criminals).
- **What NPCs carry** is derived, never stored: months of the role's pay drawn from the NPC's seed (criminals 0.3-1.5 months, most roles 0.05-0.3), a crime lord's archetype x10, a Jedi 0-50 cr. Robbery takes it once (the slice records what was taken).

## 10. Tests

`tests/m8/economy.test.ts`: each modifier moves prices the right way (location, legality, the food index, the depression, wartime); haggling stays inside +/-20% across seeds; restricted goods only on the black market and only to a fence; the other side's credit refused on core worlds, a changer only off them, at 10-20%; Hutt coins at 40, 10 and 0.625; military pay across a 93-day jump; a Jedi's reward unseen has no effect, seen draws a reprimand, a pattern costs standing, the Order finding out counts, wealth is attachment; the daily lifestyle charge, stepping down, destitution; debt from warning to collectors to bounty, a jump stopped by collectors, a bank lending only against income; an honest official refuses; NPCs carry credits by role and archetype, robbed once; a narrator-invented amount is ignored; ship prices (recorded, monotonic on length); a blockade's passage charged, the shortfall owed; an old save loads with the start money.

## 11. Every invented number

| Number | Where |
|---|---|
| Location factors 0.85 / 1 / 1.25 / 1.3 / 1.6, half swing for food, services, luxuries | `LOCATION_FACTOR`, `HALF_SWING_KINDS` |
| Black-market markup by zone x2 / 2.5 / 3 / 4 / 5 (Jared's x2-5 range; the split is invented) | `BLACK_MARKET_X` |
| Haggle curve 1 - 0.2 tanh(m / 10) (the +/-20% is Jared's); merchant Charisma 40 | `HAGGLE`, `MERCHANT_LEVEL` |
| Fence 25-40% and dealer 50% are Jared's; how the haggle moves the fence inside the range | `SELL`, `fenceShare` |
| Changer cut 10-20% (Jared, invented) and how the haggle moves it | `CHANGER_CUT` |
| Credits in Hutt space at +25% | `HUTT_CREDIT_MARKUP` |
| Coruscant food index 1.3 / 2 / 3 / 4 at 0 / 90 / 200 / 368 days | `CORUSCANT_FOOD_INDEX` |
| Depression: goods x1.15, wages x0.8, 10 years, cosine fade | `DEPRESSION` |
| Wartime military goods x1.5 | `WARTIME_MILITARY_X` |
| Military pay ladder (through the game's 500 / 2,000 / 3,200) and the kit bands | `MILITARY_PAY`, `MILITARY_KIT` |
| Pay bands' unrecorded ends: contract middle and top, odd-job top, reward top, every mission-funds band; risk x1 / 2 / 4 | `PAY_BANDS`, `RISK_X` |
| Lifestyle poor 20, comfortable 120, wealthy 400 (modest 50 is the lore's budget traveller); half of living is food | `LIFESTYLE_DAY`, `selectLivingCost` |
| Exchange 350%; every loan term; bank limit six months of pay; loan sizes small and fair | `LOAN_TERMS`, `BANK_INCOME_MONTHS`, `LOAN_SIZES` |
| Fines 100 / 1,000 / 5,000 | `FINE_SIZES` |
| Bribe sizes 0.1 / 0.5 / 1 / 3 months; rating 50, +3 per doubling | `BRIBE_SIZES`, `BRIBE_CHECK` |
| Monthly pay by NPC role; honest shares by role | `ROLE_PAY`, `HONEST_SHARE` |
| What NPCs carry (months of pay by role, floors, crime lord x10) | `CARRIED_MONTHS`, `CARRIED_FLOOR`, `ARCHETYPE_CARRIED_X` |
| Jedi: pattern 3 in two years, standing -5; wealth 25,000 (Jared, D-511), standing -15; quartermaster lists; 3% of NPC Jedi might keep a reward | `JEDI_MONEY` |
| Start money, job and lifestyle by start option | `START_MONEY`, `PATH_MONEY` |
| Ship price curves' powers (fighter 1, freighter 1.5; the capital 1.79 fits two recorded ships); used ship 50% | `SHIP_PRICE_CURVE`, `SHIP_USED_SHARE` |
| Running costs but the freighter's docking; repair shares | `RUNNING_COSTS`, `REPAIR_SHARE` |
| Catalog bases marked `invented` (27 rows: e.g. carbine 800, heavy rifle 1,500, light armour 1,000, personal shield 10,000, forged papers 3,000, spice 100) | `PRICE_CATALOG` |
| Destitution and stepping the lifestyle down | `dayHook` |

## 12. Not built here

- Charging ship running costs (item 13), droid prices beyond three catalog rows (item 7). Medicine prices and bacta availability: medicine.md (item 6, D-511).
- Renown (spec 24) reads `jediRewardReputation`, `jediWealth` and `debtBounty:*` once built; alignment reads `darkChoices`.
- The narrator gets no per-item price list: a price comes back after a purchase. A price quote before buying would need a check-style resolve step.
