# Ship life (as built; M8 checklist item 13, part 2 of 2)

Design: [m8-design-notes.md](m8-design-notes.md), "Ships and space combat": Ships as data, Damage and repair, Modifications, Travel, Customs and scans, Ownership (all agreed). Builds on [ship-battles.md](ship-battles.md) (part 1). Lore: Docs/SWRPG lore/SW_Starships_Classes.md (classes, modifications, the hyperdrive ruling), SW_Space_Tactics.md (tactics). Prices and running costs through [economy.md](economy.md); astromechs and droid crews through [droids.md](droids.md). Decisions: D-518 (the m8-ship-battles review, Part A), D-519 (this file), D-521 (the m8-ship-life review: upkeep, mods in battle, readings ruled; m8-ground Part B). Report: docs-v2/reports/m8-ship-life.md. **Every number not from lore, a game book or Jared is invented; section 12 lists them all.**

Code:
- Data: `src/data/shipLife.config.ts` (class life, mods, wear, breakdowns, yards, astrogation, passage, customs, crew, renown, start ships), `src/data/tactics.ts` (the tactics catalogue and its sets).
- Engine (pure): `src/engine/shipLife.ts` (drives, mod effects, capacity, wear, breakdowns, yard quotes, astrogation legs, passage, customs, reading a class from words).
- Features: `src/features/ships/` (the character's ships, ship acts, the day hook), `src/features/tactics/` (known and seen tactics), `src/features/possessions/` (items and where they are).
- Turn: `turn/travel.ts` `shipTrip` (passage or the own ship's legs, breakdowns, costs, customs), called from `resolveTurn`'s travel branch.
- UI: `src/ui/possessionsTab.ts`, `src/ui/tacticsTab.ts` (two new side-panel tabs).
- Tests: `tests/m8/shipLife.test.ts`; the narrate-every-turn setting in `tests/turn/battlePipeline.test.ts`; the main-specialty probe `tests/sweep/mainSpecialtyGap.test.ts` (rows in `tests/support/mainSpecialty.ts`).

## 1. The narrator and the code

- **Buying and selling ships is `trade`**, like any gear: the item names a class ("a Dynamic-class freighter", "a used XS freighter", "an Aurek on credit"). The economy prices it and sends `shipAcquired` / `shipSold`.
- **Everything else is `shipAct`** (its own event since D-520, offered in the schema's ship part); where it is not offered, **the droid event's one plain-words field, starting `ship:`** ("ship: salvaged a Dynamic-class freighter", "ship: the Order issued her a Defender-class light corvette", "ship: fitted a hidden compartment at a shipyard", "ship: hired a pilot named Sela Dorn"). Likewise `tactic:` for a tactic taught, studied or practised, and `item:` for an item stored or fetched. The droids feature hands the words on (`shipAct`, `tacticStudied`, `itemMoved`), as combatStarted hands its `ships` words to the battles feature.
  - *Why one channel (then):* the narrative schema's worst case sat at its 12,000-character cap. The schema's parts (D-520) made room: `shipAct`, `tacticStudied` and `itemMoved` are their own AI events now (a straight move: the same handlers, the droid words still routed to them).
- **The STATE block** gets a SHIPS line (each ship: class, how held, where, transponder, flags, damage, crew, contraband), the last customs check and ship news not yet told (`shipsTold` marks them), and a TACTICS line (the story tactics known, and how to report learning one).
- **Engine events:** `shipAcquired`, `shipSold`, `shipTraveled`, `customsChecked`, `crewUnpaid`, `shipLost`, `shipRenown`, `shipConditionSet` (battles), `shipCostsDue` (economy), `tacticsLearned`, `tacticsSeen`, `itemAcquired`, `itemRemoved`.

## 2. Ships as data

- **The class** (data/ships.ts, combat-scales) plus its life (`CLASS_LIFE`, `CLASS_LIFE_BY_KIND`): hyperdrive class, cargo, consumables, crew, passengers, modification capacity, built-in compartments. Game-stat figures where the lore file gives them (the Dynamic's Class 3, 60 t, crew 2; the Hammerhead's 4,000 t; crews of the SWTOR ships), the rest by kind.
- **The individual ship** (`ships` slice): a copy of the class plus its own history: name, owner, how held (owned, issued, stolen) and how had (bought new or used, financed, issued, won, salvaged, stolen, taken, start), issuer, transponder (real, altered, missing), former owner and reported stolen, mods, wear, field patches, cargo, crew aboard, where docked, supplies, renown, the customs flag, impounded, in a yard until, price new. Hull, systems, burnt projectors and warheads stay in the battles slice under the same id (one owner per field); a battle uses the owned ship's id, name and mods.
- **Hyperdrives (ruling 1, Jared, 23 Nov 2026):** a class keeps the drive the lore gives; a class in service before the Mandalorian Wars ended (3,960 BBY) with no drive on record keeps a slow one (Class 8); everything else is the ruling's ordinary Class 2. An upgrade moves a drive one step faster on the table 15 / 12 / 10 / 8 / 6 / 4 / 3 / 2 / 1.5 / 1 / 0.75 / 0.5 (the Ebon Hawk's Class 3 to 1 took two). Interceptors without a hyperdrive cannot be given one.

## 3. Getting a ship

- **Bought new or used** through the economy: the ship price curve (economy.md 2c), used at half, at the local market; military classes (anything not a freighter) only on the black market; haggled as any trade.
- **Financed:** "on credit" in the item: a fifth down from the wallet, the rest a loan, a bank's when the bank would lend it (six months of income), else a Hutt's.
- **Issued (Jared):** an issued ship is effectively the character's: no checkout, free personal use, customisable. The Order issues to Knights and Masters (a Padawan flies with their Master), the Empire to Sith from apprentice up, a navy or an intelligence service to its people. Two kinds for a Jedi: a starfighter for squadron work, or a personal ship (the Defender-class) for missions away from front-line command; a character with fleet command (`fleetCommand`) flies fleet ships, not a personal one; the Republic Navy issues fighters, not capital ships, except a personal ship for the SIS. The issuer pays its docking, fuel, upkeep and repairs.
- **Won, salvaged, stolen, taken** in the story (`ship:` words): a ship with a past is worn (salvage 0.6-0.9, the rest 0.2-0.6).
- **Stolen ships** keep their old transponder (reported stolen) until it is altered or removed; while it still reads, the former owner's people find it on a 5% chance a week (ship news, for the narrator).
- **Sold or fenced** through the economy: a dealer pays half of the used price; a stolen ship or one with a false or missing ID goes to a fence (25-40%). An issued ship is not the character's to sell.
- **Jedi wealth (D-511, Jared):** a ship a Jedi buys counts toward the 25,000 cr limit at its price; an issued ship never does, nor one taken in play (won, salvaged, stolen, taken).
- **Starts:** the Nar Shaddaa smuggler owns a modified XS stock light freighter (hyperdrive, engines, a hidden compartment, sensor masking); the Republic pilot is issued a Liberator. Old saves get the start's ship and the ship the last battle left them in.

## 4. Crew

- Hired in the story ("ship: hired a pilot named Sela Dorn"; a present NPC by name), by role (pilot, co-pilot, gunner, engineer, medic, hand) and pay: wages, a share, or loyalty (a companion).
- **Wages on the calendar:** on the first of each month the ships' day hook sends `shipCostsDue` to the economy (wages by the role's tier: skilled 2,000, a medic professional 3,200, a hand menial 500). An unpaid wage costs a point of loyalty (`crewUnpaid`); at 0 they leave. Back wages paid ("ship: paid the crew") restore a point.
- **Shares:** a share crew member takes 10% of the character's smuggling, contract and bounty pay (at most half in all).

## 5. Travel

- **Charted routes:** trip time = the base route time x the hyperdrive class (Class 1 the base; engine/travel.ts as before, D-405). The character flies their own ship docked at this world; without one, passage.
- **Passage** on a liner or freighter for those without a ship: a base and a price per grid square by berth (steerage, standard, luxury by the lifestyle); free when the Order or the service provides transport (lifestyle `provided`). No liner flies off the charted routes.
- **Off the charted routes** (an end in Wild Space or the Unknown Regions): many short jumps, one leg per grid square (at least two), the trip x4 plus plotting (D-405); an astrogation roll a leg against the region's DC (Core 10 to the Deep Core 18): the better of Piloting and Intelligence (no astrogation skill exists), plus navicomputer charts (+2), an astromech's co-pilot bonus (D-512) and a Givin's or Siniteen's head for it (+4). A failed leg is a reversion short of the mark (2-12 hours); failed by 5 or more, a misjump near a mass shadow (a crash hazard, severity 2).
- **Hazards stretch even charted trips:** the Deep Core x3, asteroid fields x1.5, a blockade's detour (D-405, D-469), and breakdowns (section 7).
- **Running costs** (owned and stolen ships; issued ones cost nothing): fuel per jump and the arrival fee (100 cr, on record) on each trip, supplies used restocked on arrival (10 cr a crew-day), docking by the day at the lifestyle's berths (poor x0.6 to wealthy x3), upkeep by the month (economy.md 2c): freighters and light ships about 0.1% of their value (Jared, D-521: the start XS 615 cr), warships their shares (fighters 1%, corvettes 0.8% down to dreadnoughts 0.3%). A trip longer than the supplies aboard cannot be made. Unpaid fuel, fees and docking are owed (bank terms); unpaid upkeep is skipped maintenance: the ship wears 0.03 faster that month instead (ruled, D-521).
- **Time:** a trip's hours pass; a trip over 12 hours is a montage or a skip, so the calendar and the world events advance (as before).

## 6. Customs and scans

- **Where and how often:** a check on arrival by the market zone (Core 60%, Mid Rim 35%, Outer Rim 15%, Hutt space 10%, remote 5%), x1.3 in a blockade zone (a military checkpoint), x2 for a flagged ship, a famous ship drawing more; a Jedi x0.3. At most 95%.
- **The check:** the inspector's scan (port 35, police 45, military 55, each with its gear) against concealment: the crew's bluff (the character's Charisma roll), sensor masking, the compartment (basic +3, good +5, shielded +7). A transponder check catches a missing ID always and a stolen ship's old one; police and military scan for a true identity and catch an altered one when the scan beats the work (12, more with a transponder mask). Compartments beat a basic search, not a thorough boarding inspection (a military check, a flagged ship, or a bluff failed by 5), where only a shielded one counts, at half. Illegal gear is found when the scan beats the masking and the bluff.
- **Outcomes:** clear; a fine (1,000) for illegal gear or a little contraband, or a bribe (half the fine) to a corrupt inspector (40%); major contraband (5 units or more) impounded with a large fine (5,000); a missing or altered ID or ID gear: the ship impounded; a ship reported stolen: the ship impounded and the character arrested (captivity, source `customs`); a chase when the player said to run (the travel intent's `force`) and the finding is worth stopping them for: it runs as a ship battle against the patrol (`shipBattleProposed` with `chase`, which may be the player's own side's authorities).
- **Notoriety:** a ship caught once is flagged and searched more often until its ID changes (a transponder altered, removed or registered); a changed ID also leaves its renown behind.

## 7. Modifications, repairs and breakdowns

- **Capacity points by class:** the Dynamic-class 10 (built for it), the XS 8, freighters 6, a corvette 4, military ships half their kind's. Each mod uses points.
- **Mods (`SHIP_MODS`):** hyperdrive upgrade, sublight engines (handling +1: an edge on the pilot's rolls in a dogfight), upgraded guns, military-grade weapons (illegal for civilians), shield generator (+25%), armour (+20% hull, -1 handling), sensor suite, jammer, navicomputer charts, cargo expansion, a hidden compartment, a sensor-shielded compartment (illegal), sensor masking (illegal), a transponder mask (illegal). In battle (D-521): shields and hull as before; **weapon mods** add a barrel to every gun mount (upgraded guns) and military-grade weapons a barrel and heavier guns (x1.3); a **jammer** is +2 on the evasion roll against a torpedo lock, beside decoys (+4); a **sensor suite** reads the enemy: +1 on the dogfight position roll, the enemy formation known in a fleet battle, an ambush spotted sooner (the ambusher starts 1 up the track, not 2). The battle reads them from the owned ship (`ShipState.kit`).
- **Over capacity is allowed;** every point over adds breakdown risk.
- **Installation:** credits and time. A big mod needs a shipyard (labour 30% on the parts, 2 days plus a day a point in the yard); a small one a crew member's Repair roll (rating 45; a failure spoils half the parts) or a factory kit (x1.5, no roll).
- **Shipyard repairs:** the economy's repair share of the price by damage (light 2%, heavy 10%, crippling 30%) plus 3% a destroyed system for parts, and days by size (a freighter 2 / 5 / 12); the battles slice's condition is restored. Destroyed systems wait for a yard (field repairs, D-517, mend only damaged and disabled ones). An overhaul (2% of the price) clears wear.
- **Wear:** 0.004 a jump, 0.015 a month, more for battle damage; an overhaul clears it.
- **Breakdowns (ruled):** a roll when the ship is pushed (an emergency jump, overloaded systems, hard manoeuvres, running damaged): 0.5% plus wear and points over; a field patch may give way (25% each). On every jump only for a badly worn ship (wear 0.5+) or one 3 or more points over. A well-kept stock ship almost never breaks down. A breakdown damages a system (the hyperdrive on a jump) and costs 6-48 hours.

## 8. Ship renown

The renown system is not built, so each ship keeps its own fame for it to read: +5 a battle won in it, +15 a major one, +8 a blockade run. Known from 20 (the narrator is told it is recognised), famous from 50; a famous ship is searched more often. A changed ID resets it.

## 9. The Possessions tab (Jared, 26 Nov 2026)

A new side-panel tab, by where things are:
- **On you:** worn and carried, by carry slot (the equipment design: worn, a belt of small things, two hip holsters and one on the back, pockets, a backpack if carried, then the hands, then too much to carry); credits by currency; debts in one line.
- **Ships:** a card each: name and class, how held, where docked, hull and systems, drive and wear, mods against capacity, transponder, cargo, crew, fuel and supplies, search flag.
- **Droids:** a card each: model, condition, modules, time since the last memory wipe and the personality it has grown, restraining bolt, where.
- **Stored elsewhere:** by place (a ship's hold, quarters, a Temple locker, a safehouse), and whether it is here.
- **Holdings:** credits and goods bought; for a Jedi, what counts toward the 25,000 cr limit and what never does (issued ships and gear, ships taken in play, droids, mission funds).

**Items:** until the equipment item (spec 22) builds items as data, an item is a price-catalog row with a size tag: the start kit (from the loadout stub, a comlink, clothes and a belt) and trade (bought, sold, issued). Everything is visible from anywhere; only what is carried can be used (`selectUsableItems`). The page shows; the story acts: moving an item is `item:` words, and fetching one needs the character where it is (aboard the ship docked here, or on that world).

## 10. Tactics as knowledge and the Tactics tab (Jared, 26 Nov 2026; amended by m8-fixes Part B, D-524)

- **The catalogue** (`data/tactics.ts`) is one dated list: the dogfight manoeuvres, attack runs and fleet formations the engines fly (their ids are the engine's), the lore's story tactics (the Under Split, Feint and Backstab, the Luftberry circle, the nova flare, targeted barrages, the Vanjervalis Chain and more), and the nine ground manoeuvres of "Ground command". Each with a description, strong against, weak against, requirements and dates, and a teaching tier (basic, standard, advanced; `tacticTier`).
- **One list per character** (D-524): the tactics slice. The Tactics tab and every battle menu (dogfight, attack run, fleet command, ground planning and phases) read it, so they never disagree. What anyone can order (the line, the brawl, withdrawing and rolling the ship; a frontal assault and a fighting withdrawal on the ground) is in the list itself ("anyone can order these"), no longer added by the menus.
- **Two levels:** known, and seen but not practised (watched in a battle the character took part in, by an enemy or an ally). A seen one is recognised when used against the character (the +1 of a known enemy formation), shown on the tab as "seen, not practised", and can be ordered in battle at -2 (`SEEN_TACTIC_PENALTY`, invented) on its roll: the dogfight position roll, the attack run, the fleet round, the ground side's sector rolls.
- **Starting sets** (D-524):
  - every pilot knows the head-on pass, the break, the jink and a strafing pass;
  - anyone who went through the Jedi initiate stage (a Padawan, Knight or Master; an initiate when promoted to Padawan): frontal assault, defence in depth (holding a position), fighting withdrawal; the line, a starfighter screen, withdrawing (`jediInitiate`). The Sith Academy the same for an apprentice or Lord (`sithAcademy`, a proposal);
  - Knights, Masters and Sith Lords learned to fly (flight school);
  - backgrounds: a soldier the army's ground basics; an officer ground command; a naval officer the fleet formations; a pilot flight school and flying a screen (`pilotFleet`); a Jedi at the front flanking and ambushes (`frontLine`, a proposal); smugglers, Mandalorians, bounty hunters and agents their own sets.
- **Learning more:**
  - a programme's graduation gives its sets (as before);
  - taught (`tacticStudied`, "taught ... by <name>"): the teacher's own Tactics decides how hard a tactic they can pass on: anyone teaches the basics, standard tactics need Tactics 20 (military experience), advanced ones 50 (a seasoned commander) (`TEACH_NEEDS`, invented). The master in the scene teaches when the words name nobody; a named teacher the game does not know counts as Tactics 30 (invented). Generated Jedi Masters have no Tactics, so they teach the basics only; a master with military experience teaches more. A commander in the field teaches the same way;
  - studied (a manual, historical campaigns): known at once;
  - in the field: a seen tactic used successfully in battle (a dogfight turn won on position, a strike that reached the hull or a system, a fleet round won, a ground phase won on balance) is known at the battle's end ("used successfully in battle");
  - practice after seeing it: three sessions (as before).
- **NPCs** fly only what their crew kind knows (as before). What each side flew is recorded as seen at the end; under an NPC commander on the ground, our own side's manoeuvres are seen too. The battle record keeps the tactics the player chose (`tacticsUsed`).
- **The tab:** Space and Ground sections; each entry with its description, strong and weak against, requirements, known or seen-not-practised, and how it was learned.
- **Old saves** (D-524): the starting set for their background (archetype, start, rank), plus every tactic already used in a battle (the battle records' `tacticsUsed`, the last ship battle's formation in command, the last ground battle's manoeuvres in command); the tactics slice's migration v2.

## 11. Tests

`tests/m8/shipLife.test.ts`: Part A (Cipher Nine's Stealth follows her sheet and no sheeted main specialty sits more than 10 below its sheet; command passing on after abandoning ship; pickup or capture by who holds the field; a disabled fighter; a named NPC on a destroyed ship rolls to survive and canon figures are protected); the hyperdrive ruling; ships bought, used, financed, sold, issued (and refused to a Padawan), salvaged and stolen; a Jedi's issued ship not counted toward the wealth limit and a bought one counted; wages paid on the calendar, unpaid crew losing loyalty and leaving; the smuggler's start ship; trip time by route and drive class, passage without a ship; astrogation legs, reversions and misjumps; travel advancing the calendar and costing fuel and fees; customs density, every outcome, compartments against basic and thorough searches, illegal mods found by scans, the flag cleared by a new ID; capacity and over-capacity breakdown risk; breakdowns only when pushed or on worn and over-modded ships; small and big mods; shipyard repairs costing credits and time; the Possessions tab's sections, carry slots, nothing away usable; the Tactics tab's known and seen with sources; practice; the battle menu offering only known tactics and seen ones giving the recognition bonus only; old saves loading with implied tactics. `tests/turn/battlePipeline.test.ts`: the narrate-every-turn setting.

## 12. Every invented number

| Number | Where |
| --- | --- |
| The old-design drive Class 8; Class 2 by kind where none is on record; the drive step table | `OLD_DESIGN_DRIVE`, `DRIVE_BY_KIND`, `DRIVE_STEPS` |
| Class life where the lore gives none: cargo, consumables, crews, passengers by kind; drives marked invented (Liberator 2, Centurion 2; interceptors none) | `CLASS_LIFE`, `CLASS_LIFE_BY_KIND` |
| Capacity: Dynamic 10, XS 8, Ebon Hawk 10, Lethisk 5, Defender 5, Fury 3, CR90 4; by kind 2 / 6 / 4 / 3 / 2 / 1; military x0.5 | `CLASS_LIFE`, `CLASS_LIFE_BY_KIND`, `MILITARY_CAPACITY_X` |
| Every mod's points, price (share or flat) and effect | `SHIP_MODS` |
| Mods in battle: +1 barrel (both weapon mods), x1.3 (military), jammer +2, sensors +1 position, an ambush spotted by 1 (D-521) | `MOD_BATTLE` |
| Kit x1.5; yard labour 30%; field rating 45, failure loses half; 2 days + 1 a point; 6 hours a point | `MOD_INSTALL` |
| Wear 0.004 a jump, 0.015 a month, 0.3 per hull lost, 0.03 a month of missed upkeep; badly worn at 0.5 | `WEAR` |
| Breakdown chances (pushed 0.5% + 20% x wear + 6% a point over + 10% damaged; a jump 2% + 12% x wear past 0.5 + 2% a point past 2; patch fails 25%; 6-48 h) | `BREAKDOWN` |
| Yard days by size and damage; parts 3% a destroyed system; overhaul 2% | `YARD_DAYS`, `REPLACEMENT_PART_SHARE`, `OVERHAUL_SHARE` |
| Astrogation DCs by region; Givin and Siniteen +4; reversion 2-12 h; misjump at 5, severity 2; at least 2 legs | `ASTROGATION` |
| Supplies 10 cr a crew-day; docking by lifestyle x0.5-3 | `CONSUMABLE_CREW_DAY`, `DOCK_LIFESTYLE_X` |
| Passage bases and per-square prices by berth; the liner's Class 2; berth by lifestyle | `PASSAGE`, `BERTH_BY_LIFESTYLE` |
| Customs density by zone; war x1.3, flagged x2, cap 95%; standing x0.3 / 0.6 / 1.5 | `CUSTOMS_DENSITY`, `CUSTOMS` |
| Inspectors 35 / 45 / 55 and gear 0 / 2 / 4; compartments +3 / 5 / 7, shielded at half in a thorough search; altered ID 12; major at 5 units; bribe half the fine; 40% corrupt | `CUSTOMS` |
| Financing: a fifth down | `SHIP_FINANCE` |
| Crew loyalty 3 / 3 / 4 at the start, -1 a month unpaid, generic levels by role, a share of 10% | `CREW` |
| A hunter's chance 5% a week | `HUNTED_WEEKLY` |
| Ship renown +5 / +15 / +8; known 20, famous 50 | `SHIP_RENOWN` |
| The wear of ships had with a past (salvage 0.6-0.9, prizes and thefts 0.2-0.6, used 0.3); a transponder altered for 10,000 cr; impound reclaimed at 20% | `features/ships` |
| Start ships, their mods and names | `START_SHIPS_BY_OPTION` |
| Carry slots: belt 4 (6 with a utility belt), hips 2, back 1, pockets 2, backpack 6 / 3 / 2 / 1, hands 2 | `CARRY` |
| Tactic sets and who knows them (archetypes, starts, ranks, programmes, NPC crew kinds); command basics; practice 3 | `TACTIC_SETS`, `ARCHETYPE_TACTICS`, `START_TACTICS`, `RANK_TACTICS`, `PROGRAMME_TACTICS`, `NPC_TACTICS`, `COMMAND_BASICS`, `PRACTICE_TO_KNOW` |
| m8-fixes B (D-524): the Jedi initiate set and the Sith Academy's (a proposal); the pilot's screen and the Jedi front-line set (proposals); the anyone-can-order basics in every list; teaching tiers (which tactics are basic, standard, advanced) and the teacher's Tactics 0 / 20 / 50; an unknown teacher 30; a seen tactic at -2; "used successfully" (a won position roll, a strike on the hull or a system, a won fleet round, a ground phase won on balance) | `TACTIC_SETS.jediInitiate`, `sithAcademy`, `pilotFleet`, `frontLine`, `PAST_INITIATE`, `COMMON_GROUND`, `tacticTier`, `TEACH_NEEDS`, `UNKNOWN_TEACHER_TACTICS`, `SEEN_TACTIC_PENALTY`, `usedTactic` (battles/rules.ts), `stepGround` |
| Ground tactics' strong and weak against | `TACTICS` (ground) |
| Part A: the next senior captain's Tactics (the better of the fleet's crews and the first officer's); escape DC 15 against the better of Piloting and Stealth; 3 captors; survival 50% destroyed, 85% abandoned | `commandPassesOn`, `AFTERMATH` |

From the lore or a game book and not invented: the drives, cargo and crews marked lore or game stat in `CLASS_LIFE`; the Dynamic-class built for modification, the XS's standard compartments, the Ebon Hawk's Class 1; transponders, interrogation circuits, sensor-stealth systems and compartments as kinds; the 100 cr arrival fee and the freighter's 30 cr docking (shipPrices); every price curve (economy.md 2c).

## 13. Readings ruled (Jared, 26 Nov 2026; D-521)

- **The front-line Jedi ship check** (a Jedi on a front-line posting flies fleet ships, not a personal one) waits for wartime postings (checklist item 11); until then only the fleet-command flag is checked.
- **Customs standing beyond the Jedi discount** (the side that holds a world searching its own people less, its enemies more) waits for the renown system; the standing factors stay in the data.
- **Astrogation** uses the better of Piloting and Intelligence (there is no astrogation skill).
- **Liners fly only charted routes:** a trip off them needs the character's own ship.
- **Upkeep:** freighters and light ships about 0.1% of their value a month, warships their shares; missed upkeep wears the ship (+0.03 a month) instead of becoming a debt.
