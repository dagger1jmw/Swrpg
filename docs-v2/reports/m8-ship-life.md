# m8-ship-life: owning and running ships, the Possessions and Tactics tabs, plus the m8-ship-battles review fixes (2026-11-26)

Decisions D-518 (Part A) and D-519 (ship life). Spec: docs-v2/spec/ship-life.md (linked from ship-battles.md; every invented number in its section 12, repeated in section 6 here). Checklist item 13 is ticked.

## 1. Part A: the m8-ship-battles review

### A1. Cipher Nine's Stealth

**Root cause.** Her lore sheet gives "Ranged/Stealth combat rating ≈ 84". The roster sheet took that as Blaster 84 only, with no Stealth. The approved draft sheet (D-514) does carry the sheet's own `stealth: 84`, in its `authored` numbers, but drafts were applied with their `draft` numbers only. With no Stealth on any sheet, the game built her Stealth on the generic field-agent line.

**Fix.** A draft's `authored` numbers are the lore sheet's own, so where the roster's sheet of the same date leaves one out, it now goes onto that sheet before the scale conversion (`withAuthored` in data/canonNpcs.ts). The scale rule then takes a main specialty as written. Nothing was hand-set for her.

| Cipher Nine's Stealth, BBY | 3655 | 3650 | 3645 | 3640 (sheet) | 3635 | 3630 |
| --- | --- | --- | --- | --- | --- | --- |
| Before | 0.7 | 12.8 | 26.0 | 35.2 | 41.7 | 46.4 |
| After | 1.6 | 30.6 | 62.1 | **84.0** | 90.6 | 95.3 |

- After 3,640 she grows under the D-504 cap: she was 30 at the sheet, so the cap is 15 over it.
- **Only she moved.** The re-measure probe (`tests/sweep/skillsRemeasure.test.ts`, every figure at its sheet dates, plus 3,655 / 3,650 / 3,645 / 3,635 / 3,630) changed in no other figure.

**Every sheeted figure checked.** A new probe (`tests/sweep/mainSpecialtyGap.test.ts`) compares each figure in the game with what its sheet writes:
- the main specialty: the archetype's `main`, or a Force user's own sheet form;
- every other stat the conversion takes as written.

| More than 10 below the sheet | Before | After |
| --- | --- | --- |
| Main specialty (68 figure-stat-dates) | 1: Cipher Nine, Stealth at 3,640, game 35.2 against sheet 84 (gap 48.8) | **none** |
| Other as-written stats (440) | none | none |

Both runs took about 4 s. A test now holds the "none" (`tests/m8/shipLife.test.ts`).

### A2. Narration

Kept as built. A new setting, **Narrate every ship-battle turn**, is off by default (`narrateEveryBattleTurn`). When it is on, every battle turn goes to the narrator with the BATTLE block. It is a device setting in the Settings screen, beside "retry once".

### A3. Abandoning ship in command

The player's part ends, as approved. The fleet fights on under **the next senior captain**, with the engine's flagship-lost penalty (already built). The captain's Tactics is the better of the fleet's ordinary crews (navy 45) and the first officer's; this is a reading.

Afterwards the player's fate follows who holds the field (the winner; with no winner, each side keeps its own):
- **Their side holds it:** they are picked up.
- **The enemy holds it:** an escape roll, the better of Piloting and Stealth against 15. A failure is capture by 3 captors of the enemy's side (captivity, source `battle`).

The wrap-up the narrator tells includes this. Over 60 seeds of a lost battle, both capture and escape occur (tested).

### A4. A disabled fighter

It counts as lost to its pilot, as approved. The pilot's recovery or capture follows who holds the field, as in A3. The same applies to a pilot who ejected and to a Sith or Imperial commander who left early (a reading).

### A5. Named NPCs aboard a ship lost

Casualties still never kill a named NPC on their own. But a named NPC aboard a ship that is destroyed or abandoned now rolls to survive: 50% when destroyed, 85% when abandoned (both invented). That covers:
- each side's commander, on the ship it began aboard;
- the people present aboard the player's own ship (not a fighter).

Canon figures stay protected by the tag-map rules (only the player breaks tags). A death is the engine's `npcDied`.

### A6. Ruled as is

Recorded: the Hydian pickets use Fury-class ships (the Terminus enters service in 3,653), and the spec's invented numbers stand as defaults to tune in play.

## 2. Parts B to G: ship life (as built)

### How the narrator reports ship acts

- **Buying and selling ships is `trade`**, with the class in the item ("a used Dynamic-class freighter"; "on credit" finances it).
- **Everything else goes on the droid event's one plain-words field**, starting `ship:`, `tactic:` or `item:`.
- **Why:** the narrative schema's worst case is within about 40 characters of its 12,000-character cap, so a new AI event would break it, as with D-510, D-512 and D-517. The worst case is unchanged here: no AI-facing schema changed, and the schema size tests pass.

### B. Ships as data and ownership

- **The class** (combat-scales) plus its life: drive, cargo, consumables, crew and modification capacity, using game stats where the lore gives them.
- **The individual ship** lives in a new `ships` slice: name, owner, how held and how had, issuer, transponder, former owner, mods, wear, patches, cargo, crew, dock, supplies, renown, the customs flag, impound and yard.
  - Hull and systems stay in the battles slice under the same id.
  - A battle now uses the owned ship's id, name and mods: shields and hull, and the engine mods' handling as an edge on the pilot's rolls.
- **Hyperdrives** follow ruling 1:
  - a class keeps the drive the lore gives;
  - an old design with no drive on record keeps Class 8;
  - anything else is Class 2;
  - each upgrade is one step faster (a Dynamic: 3, 2, 1.5).
- **Getting a ship:**
  - bought new or used, with military classes only on the black market;
  - financed: a fifth down, the rest a bank loan if the bank would lend it, else a Hutt's;
  - issued: the Order to Knights and Masters (a Padawan is refused), the Empire to Sith, a navy or service to its people; fleet commanders fly fleet ships; the issuer pays the running costs;
  - won, salvaged, stolen or taken in the story.
- **Selling:** to a dealer, or to a fence for a stolen ship or one with a false or missing ID. An issued ship is not the character's to sell.
- **Stolen ships** keep their old, reported transponder. While it still reads, there is a 5% chance a week that the former owner's people find the ship.
- **The 25,000 cr limit:** a ship a Jedi buys counts at its price; issued ships and ships taken in play never do (tested).
- **Crew:**
  - wages are paid on the first of each month through the economy;
  - an unpaid month costs a point of loyalty, and a crew member leaves at 0 (tested over 132 days);
  - a share crew member takes 10% of smuggling, contract and bounty pay.
- **Ship renown** is kept on the ship for the renown system, which is not built yet.
- **Starts:** the Nar Shaddaa smuggler owns a modified XS freighter, and the Republic pilot is issued a Liberator. Old saves get the start's ship and the ship the last battle left them in.

### C. Travel

- **The ship flown:** the character's own ship docked at that world, else passage on a liner. Passage is priced by distance and by the berth the lifestyle buys, free when transport is provided, and never off the charted routes.
- **Trip time** is the route time x the drive class (D-405 as before). The tests compare a stock Dynamic (Class 3) with one upgraded twice (Class 1.5).
- **Off the charted routes:**
  - a leg per grid square, with an astrogation roll each;
  - the roll uses the better of Piloting and Intelligence, because there is no astrogation skill;
  - charts, an astromech, and a Givin's or Siniteen's head for it help;
  - a failed leg is a reversion; a bad failure is a misjump (a crash hazard).
- **Costs:** fuel a jump, the 100 cr arrival fee, supplies restocked, docking by lifestyle, upkeep. A trip longer than the supplies aboard is refused.
- **Missed upkeep** wears the ship (+0.03 a month) instead of becoming a debt. The economy's upkeep, 1% of the price a month, is 6,150 cr on the smuggler's XS against a 2,000 cr start; as a debt it would bury a new smuggler in a month.
- **Time:** long trips run as montages, so the calendar and the world events move.

### D. Customs and scans

- **On arrival**, a check by zone: Core 60% down to remote 5%. It is likelier in a blockade zone or for a flagged or famous ship, and less likely for a Jedi.
- **The check:** the inspector's scan against the crew's bluff, sensor masking and compartments.
  - Transponder checks catch a missing ID, and a stolen ship's old one.
  - True-identity scans catch an altered ID.
  - Compartments beat a basic search, not a boarding inspection.
- **All seven outcomes are tested:** clear, fine, bribe, cargo impounded, ship impounded, arrest, chase.
  - A chase runs as a ship battle against the patrol, when the player said to run (the travel intent's `force`).
- **Notoriety:** a caught ship stays flagged until its ID changes.

### E. Modifications, repairs and breakdowns

- **Capacity:** the Dynamic 10, the XS 8, freighters 6, military ships half their kind's. There are fourteen mods; going over capacity is allowed and raises the breakdown risk.
- **Installation:** big mods need a shipyard (labour and days); small ones take a crew member's Repair roll or a factory kit.
- **Shipyard repairs** cost the economy's share of the price by damage, plus parts for destroyed systems, and days by size.
- **Field patches** are remembered and may give way when the ship is pushed.
- **Wear** comes from jumps, months and damage; an overhaul clears it.
- **Breakdowns,** as ruled: a roll only when the ship is pushed, or on every jump for a badly worn (0.5 or more) or heavily over-modded (3 points over or more) ship. A well-kept stock ship has under 1% when pushed.

### F. The Possessions tab

Sections: on you (by carry slot, credits by currency, debts in one line), ships, droids, stored elsewhere and holdings.
- **Items:** catalog rows with size tags, from the start kit and from trade. The equipment item has not built items as data yet.
- **Only carried items can be used.** Moving or fetching one is story words, and fetching needs the character where the item is (tested both ways).

### G. Tactics as knowledge and the Tactics tab

- **The catalogue:** 48 entries in one dated list. Space comes from the engines and SW_Space_Tactics.md; the nine ground manoeuvres come from "Ground command".
- **Two levels:** known and seen.
- **Learning:**
  - every pilot knows the basics;
  - training gives sets: a programme's graduation, or what a career's own training implies;
  - study or being taught makes a tactic known at once;
  - three practice sessions move a seen tactic to known.
- **In battle:**
  - the menu offers only known tactics, and an order for any other is refused;
  - letting it play out flies only known ones;
  - NPCs fly what their crew kind knows;
  - a recognised manoeuvre or formation flown against the player gives +1;
  - what each side flew is recorded as seen.
- **The tab:** Space and Ground sections with each entry's source.
- **Old saves** load with the tactics their training implies (tested for a naval officer and a Jedi Knight).

## 3. Readings for Jared

- **One channel for gear words.** The droid event's field carries `ship:`, `tactic:` and `item:` words. The event's name is a leftover; renaming it would cost schema room and the fixtures.
- **Astrogation** rolls the better of Piloting and Intelligence, because there is no astrogation skill.
- **No passage off the charted routes:** a liner flies only charted routes, so that trip needs the character's own ship.
- **Issued ships** cost the character nothing to run; the issuer pays.
- **"Front-line postings fly fleet ships":** only fleet command (the `fleetCommand` flag) is checked. A Jedi on a front-line start is not refused a personal ship, because wartime postings (checklist item 11) are not built yet to say who is front-line.
- **Upkeep against a smuggler's purse:** the economy's 1% of the price a month (D-510, invented) is 6,150 cr on the start XS, three times the smuggler's start money and more than most jobs pay. Missed upkeep now only wears the ship. The share itself may want tuning for freighters.
- **Items** are price-catalog rows until the equipment item builds them as data. Mods to guns, sensors and jammers are recorded for the story but have no engine effect yet. Shields, hull and engine handling do.
- **Customs** reads the market zone of the destination. The side that holds the world does not yet change how strictly a non-Jedi is searched; the standing factors are in the data for when the renown system reads faction standing.
- **What any commander can order:** the line, the brawl, withdrawing and rolling the ship. Every other formation needs training.
- **Who knows how to fly:** Jedi Knights and Masters and Sith Lords know the core dogfight manoeuvres.

## 4. Browser check

Not done: the Chrome extension disconnected early in the session and did not come back. Instead:
- `vite build` bundles the app cleanly;
- the tabs' data comes from selectors the tests cover: the Possessions sections and ship-card fields, the carry slots, and the Tactics rows with their sources.

The two tabs are worth a look in play.

## 5. Runs

| Run | Result | Time |
| --- | --- | --- |
| `test:all` before (a clean HEAD copy, from PowerShell) | 2,009 of 2,009 passed, 176 files | 1,369 s (22.8 min) |
| Main-specialty probe, before and after | 1 -> 0 figure-dates more than 10 below | about 4 s each |
| Re-measure probe, before and after (with the five extra dates) | only Cipher Nine's Stealth moved | about 2 s each |
| `npm test` | 1,982 of 1,982 passed, 162 files | 35 s |
| `npm run typecheck`, `npm run lint`, `vite build` | clean | |
| `test:all` after (final code; a first run was stopped because code changed while it ran) | 2,038 of 2,038 passed, 177 files | 1,274 s (21.2 min) |

## 6. Every invented number

All of them are in spec/ship-life.md section 12, with where each lives. In short:
- **Drives:** an old design's Class 8; Class 2 where none is on record; the step table.
- **Class life** where the lore gives none: cargo, consumables, crews and passengers by kind; capacity (the Dynamic 10, XS 8, Ebon Hawk 10, Lethisk 5, Defender 5, Fury 3, CR90 4; by kind 2 / 6 / 4 / 3 / 2 / 1; military x0.5).
- **Mods:** the fourteen mods' points, prices and effects. Installing: kit x1.5, yard labour 30%, field rating 45, a failure loses half, 2 days + 1 a point, 6 hours a point.
- **Wear:** 0.004 a jump, 0.015 a month, 0.3 per hull lost, 0.03 a month of missed upkeep; badly worn at 0.5.
- **Breakdowns:**
  - pushed: 0.5% + 20% x wear + 6% a point over + 10% when damaged;
  - on a jump: 2% + 12% x wear past 0.5 + 2% a point past 2;
  - a patch fails 25% of the time; a breakdown costs 6-48 h.
- **Shipyards:** days by size and damage; parts 3% of the price per destroyed system; an overhaul 2%.
- **Astrogation:** DCs Core 10, Colonies 11, Mid 12, Outer 14, Wild 16, Deep Core 18; Givin and Siniteen +4; a reversion 2-12 h; a misjump when failed by 5, severity 2; at least 2 legs.
- **Supplies and docking:** supplies 10 cr a crew-day; docking x0.5-3 by lifestyle.
- **Passage:** base 40 / 100 / 400 and 8 / 20 / 70 a square (steerage / standard / luxury); the liner's Class 2.
- **Customs:**
  - density 60 / 35 / 15 / 10 / 5%; war x1.3, flagged x2, cap 95%; standing x0.3 / 0.6 / 1.5;
  - inspectors 35 / 45 / 55 with gear 0 / 2 / 4;
  - compartments +3 / 5 / 7, a shielded one at half in a thorough search; an altered ID 12;
  - major contraband at 5 units; a bribe is half the fine; 40% of inspectors corrupt.
- **Money for ships:** a fifth down when financing; a transponder altered for 10,000 cr; an impound reclaimed for 20%; the wear of ships had with a past.
- **Crew:** loyalty 3 / 3 / 4 at hire, -1 an unpaid month, generic levels by role, a 10% share.
- **Hunters and renown:** a stolen ship found 5% a week; ship renown +5 / +15 / +8, known at 20, famous at 50.
- **Carry slots:** belt 4 (6 with a utility belt), hips 2, back 1, pockets 2, backpack 6 / 3 / 2 / 1, hands 2.
- **Tactics:** the sets and who knows them (archetypes, starts, ranks, programmes, NPC crew kinds), the command basics, practice 3, the ground tactics' strong and weak against.
- **Start ships:** their mods and names.
- **Part A:** the next senior captain's Tactics, the escape DC 15, 3 captors, survival 50% / 85%.
