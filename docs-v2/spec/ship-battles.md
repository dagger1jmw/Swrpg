# Ship battles in play (as built; M8 checklist item 13, part 1 of 2)

Design: [m8-design-notes.md](m8-design-notes.md), "Ships and space combat" (dogfights, fleet battles, tactics menu, battle map, damage and repair). Engines: [combat-scales.md](combat-scales.md) (D-505). Decisions: D-517 (this file), D-516 (the m8-traits fixes that came with it). Report: docs-v2/reports/m8-ship-battles.md. **Every number not from lore, a game book or Jared is invented; section 10 lists them all.** Part 2 (m8-ship-life: ownership, travel, customs, modifications, shipyard repairs, breakdowns, crew wages) finishes item 13.

Code:
- Data: `src/data/shipBattles.config.ts` (every battle number; who flies each class; crew sizes; the standing forces; the blockade pickets).
- Engine (pure): `src/engine/attackRun.ts` (hull skimming and trench runs on a capital ship).
- Feature: `src/features/battles/` — `rules.ts` (the battle: build, menu, step, boarding, evacuation, end; pure), `setup.ts` (reading the narrator's words and the state into a battle), `index.ts` (events and the end), `selectors.ts`, `battles.ts` (the slice).
- Turn: `TurnInput` kind `battle`; `resolveTurn`'s battle branch; the pipeline's quiet battle turns; the BATTLE block (`describeBattle`) and the STATE lines.
- UI: `src/ui/battlePanel.ts`. Dev: `/battle <words>`.
- Tests: `tests/m8/shipBattles.test.ts`, `tests/turn/battlePipeline.test.ts`.

## 1. One battle at a time

A battle is a **dogfight** (the player flies a fighter or a freighter, or crews a freighter's turret; one enemy at a time, the rest waiting in a queue) or a **fleet battle** (capital ships; the player commands, flies a fighter in it, or serves aboard). It is saved whole in the battles slice: a game saved mid-battle loads into the same turn, and the same orders give the same turn.

## 2. How a battle starts

- **The narrator proposes** with `combatStarted` (stakes lethal, no opponents) and one plain-words field, `ships`: `"enemy: two Imperial Terminus destroyers and a squadron of fighters; allies: three Thranta corvettes; mine: Aurek; role: gunner; command: the admiral is dead; ambush"`. One field keeps the response schema under its 12,000-character cap (a structured event cost 696 characters and broke it; the D-512 and D-510 precedent). The combat feature hands it to the battles feature (`shipBattleProposed`, engine source); the narrator cannot send that event itself.
- **The code checks it:** every class named is in service in the year (D-438's dated list); a plain word ("a Sith frigate") becomes the side's class of that kind in service (`CLASS_SIDES`); the enemy is not the player's own side (the Republic and the Order are one side, the Empire and the Sith another); no battle or fight is already on; the character is not a prisoner or dead. A dogfight needs the player's own fighter or freighter (named, or the last one flown, with its damage); a fleet battle needs capital ships on both sides. Freighter gunners are the people present (their Gunnery), an engineer is a present NPC with Repair 20+, and repairs go to the best of the player, a droid (its programmed Repair) and the crew.
- **Command by rank** (Jared): a navy captain or better, an army general, or the `fleetCommand` flag; otherwise only when the story hands it over (`command: why`). Asked for without either, the proposal is refused.
- **From data, whatever the words say:** an occupation's armada (`STANDING_FORCES`: Darth Angral's armada at Coruscant while the Sacking is under way) and a blockade's pickets (`BLOCKADE_PICKETS`, by the blockade's picket strength).
- **The stopgaps replaced:** the blockade's force-through approach starts a ship battle (a fleet's, or an ace alone against the pickets' fighters, where breaking off runs the line); the battle's end records the run, and a run forced through lets the trip go on for a day. The Sacking's PP-1 hinge (`E.3653.sacking#cond.hold`) now takes a fleet battle won against the Empire at Coruscant (a new world test, `battle`) where a won ground fight stood in.
- **An ambush** starts the ambusher 2 up the dogfight track, or holding the enemy's formation in a fleet.

## 3. How a battle ends (the code decides)

Destroyed, disabled, broken off, withdrawn (the fleet engine's withdraw formation at long range, or an NPC side below 35% strength), surrendered (a pirate or militia side under 25% of its strength and outnumbered three to one; the player by order), captured (a boarding lost), time (60 rounds). The narrator never sets damage, positions or the result.

## 4. Playing it

**The tactics menu** before each turn or round: the position or formation now, what is known of the enemy, the moves by group with what each is strong and weak against (`MANOEUVRE.against`, `FORMATION_BEATS`), what it costs (a reform's `-2` for a round on Tactics 14+, else two with gaps; rolling's guns x0.6; an engineer-less power shift's -1), and why a move is closed. Pick one per group, then go; breaking off, withdrawing, an engagement or a boarding go at once.

- **Dogfight:** every combat-scales manoeuvre, offered when `flown()` would fly it here; power to lasers, shields or engines (and what it weakens); shields even, front or back; guns (a snap shot from head-on or the side), torpedo lock (from the tail only), hold fire; repairs by the crew's repairer; break off. A turret gunner's only choice is to fire or hold; an NPC flies.
- **Attack runs** (a pilot in a fleet battle against a capital ship): a strafing pass, **hull skimming** (under the big guns: +3 evasion close in, their fire halved, a scrape when lost by 5) or a **trench run** (a ship with a trench: +4 on a shot at a system, the pursuers' fire, a wreck when lost by 6); which shield facing to strike; a torpedo volley on one facing; the captain rolls the ship when the facing is worn thin. The run's damage is the fleet ship's own.
- **A pilot in a fleet:** pick the next engagement (an enemy wing's fighter, an attack run on a ship) or return to the hangar. The fleet rolls its round when the engagement ends or after 36 turns (3 min / 5 s), with the player's dogfight modifier (half a point a kill, -1 beaten, at most 2) under the NPC commander.
- **Fleet in command:** formation; focus fire; advance, hold or fall back; launch or recall fighters; roll damaged ships; fire warheads; board a disabled ship (lead it, or order it); withdraw.
- **Crew aboard:** the round under the NPC commander; the player watches.
- **"Let it play out"** (Jared): the code plays on with the character's own skills (the NPC pilot's or commander's own choices, the player's levels in the rolls), a chunk at a time (up to 6 steps, or to a big moment), the app continuing on its own; "Take the controls" hands it back at the next turn (pressed mid-turn, as soon as the turn in flight ends).
- **The map** (`fleetMap`, a dogfight's own small map) is redrawn only when something it shows changes: range, position, formations, a ship lost or gone, the next enemy.
- **Time:** a dogfight or attack-run turn 5 s, a fleet round 3 min (less the dogfight turns already flown), through the clock as combat.

## 5. Boarding (Jared, 26 Nov 2026)

- **Who boards:** at close range, a side with a ship that can act boards each disabled enemy ship with a 50% chance a round. A disabled freighter in a dogfight is boarded at once by a ship that can carry boarders (not a fighter).
- **Elsewhere in the fleet:** one hidden roll, d20 + crew level / 10 + 2 for the boarders against the same + 1 for the defenders: taken or thrown back. The battle carries on.
- **The player's own ship:** crew, a pilot or a gunner aboard fight it as ordinary personal combat (the combat feature's `fightBegun`, troops of the boarders' side and year, confined with cover); the battle waits, and the fight's result returns through `boardingFought`.
- **The player commanding** stays in command: the boarders fight through the ship (the hidden roll each round; won by 4 they reach the bridge, lost by 4 or three rounds without it they are beaten off). At the bridge, the bridge fight is personal combat. Command passes to the first officer only if the commander is killed, captured or put out of the fight (the fight lost).
- **A Jedi commanding** leaves command the moment the ship is boarded and goes to the troops (personal combat); command passes to the first officer. NPC Jedi commanders do the same.
- **The player leading a boarding** of a disabled enemy ship: personal combat with its defenders; won, the ship is taken. Ordered but not led: the hidden roll.

## 6. Evacuation (Jared, 26 Nov 2026)

- **Forced:** a ship with no hull left is abandoned and lost (out of the battle, counted as abandoned). A Republic or Jedi commander is the last one off: the player as that commander takes a severe hazard (an explosion, severity 3) at the break-up chance (35%), else a light one; the player's part in the battle ends with the ship.
- **Early (Sith and Imperial):** with the ship crippled, disabled or boarded, a Sith or Imperial player in command may "evacuate now, leaving the crew": they get off; the ship fights on under the first officer (its crew shaken two rounds); the crew and anyone who hears of it remember (`reputation`, in the STATE block), and the dark choice is stored for the alignment system (`darkChoices`, as the economy keeps theft). An NPC Sith or Imperial commander leaves early with a chance by side (Sith 35%, the Empire 20%) and traits (Ambitious +15, Proud +10, Reckless -10, Loyal -25, Disciplined -15, Idealistic -20). Republic and Jedi commanders never do.

## 7. Narration (Jared's brief E)

- **A line or two after each choice** is code-written from the engine's results: a battle turn with no big moment is quiet (no AI call), its lines are the turn's narrative.
- **The big moments** (a shot that reaches the hull for a quarter of it or more, a system lost, a torpedo hit, a ship destroyed or abandoned, a formation broken, a flagship fallen, a strike landing, a boarding, an evacuation) and **the end** call the narrator with the BATTLE block: the lines in order, the big moments to tell fully, and the wrap-up. While the battle goes on the narrator offers no choices (the menu holds them).

## 8. Saved state, events and XP

- **The slice:** the battle in progress, the last one ended (its map and wrap-up), the last step, the record of battles (30 kept), the player's ships' condition, the crews that remember, the dark choices. Old saves load with an empty slice.
- **A battle's events:** its record (outcome, why, the ships destroyed, taken and abandoned on each side, fighters down, casualties by crew size, morale +5 / 0 / -8 doubled for a major battle, a crew left), and **a major battle for the world** (a standing force, two frigate-or-larger ships a side, or eight capital ships in all): the world reads the last battle fought today or yesterday (`WorldFacts.battle`; tests of kind `battle` by scale, factions, place, result and `major`). The blockade run it was. Hazards to the player.
- **XP through the code lines** (m8-skills): Gunnery for the player's own shots (`gunneryXp`); **Piloting as field use** (a new `piloting` source: each piloting roll is an exchange of combat XP, 0.25 x the challenge of the gap x stakes x outcome, all to Piloting, the daily cap); Repair for repairs the player makes in the fight (a quarter hour each) and after it; Tactics from fleet command (`commandXp`, size by the ships: a ship, a squadron from 3, a task force from 8, a fleet from 20).
- **Damage carries over:** hull, systems, burnt projectors and warheads of the ship the player flew stay with it into the next battle. **Field repairs** after a battle: an hour a damaged or disabled system, Repair against 14 (the player's own, for Repair XP), one step better; destroyed systems wait for a shipyard (m8-ship-life).

## 9. Readings (for Jared)

- Quiet turns are code-written (no AI call); the narrator speaks only at the big moments and the end. A setting to narrate every turn is easy to add.
- Abandoning ship ends the player's part even when they commanded the fleet from it (no transfer of the flag to another ship mid-battle).
- A disabled fighter in a fleet battle counts as lost to the player (a hazard as a shot-down pilot).
- A battle's casualties never kill named NPCs on their own: a commander's fate stays a story matter.
- The Galactic Empire's ships read as `sithEmpire` and the Alliance's as `republic` (the factions list has no other names).

## 10. Every invented number

| Number | Where |
| --- | --- |
| Proposal caps: 40 capital ships, 24 fighters a side | `BATTLE_LIMITS` |
| Ambush: 2 up the track | `AMBUSH_TRACK` |
| Generic crews: navy 45, elite 65, militia 30, pirate 30, droid 35 | `GENERIC_CREW` |
| First officer: the commander's Tactics less 15 | `FIRST_OFFICER_GAP` |
| A fleet round per 36 dogfight turns | `TURNS_PER_FLEET_ROUND` |
| Boarding: 50% a round, close range, +2 / +1, the bridge at 4, three rounds; troops 3-6 by kind | `BOARDING` |
| Evacuation: last-off hazard 3 at the break-up chance; early chances by side and traits; shaken 2 rounds | `EVACUATION` |
| Surrender: under 25% and outnumbered 3 to 1 (pirates, militia) | `SURRENDER` |
| A big hit: a quarter of the hull; 40 lines kept | `NARRATION` |
| Command sizes by ships 1 / 3 / 8 / 20 | `COMMAND_SIZE_BY_SHIPS` |
| NPC formations: navies line, raiders brawl | `NPC_FORMATION` |
| Attack runs: three steps, DC 10 + the ship's defences, skim +3 / +1 / 5 / 12, trench +4 / 6 / 2, point defence 2% a fighter, two torpedoes a volley | `ATTACK_RUN` |
| Who flies each class (readings of the lore's operators) | `CLASS_SIDES` |
| Crew sizes by kind; casualty shares 0.6 / 0.15 / 0.05 | `CREW_BY_KIND`, `CASUALTY_SHARE` |
| Morale +5 / 0 / -8, doubled for a major battle | `BATTLE_MORALE` |
| Field repair an hour a system; a fight's patch a quarter hour; rating 40 for Repair XP | `FIELD_REPAIR_HOURS`, `FIGHT_PATCH_HOURS`, `FIELD_REPAIR_RATING` |
| Angral's armada: 2 Harrowers, 6 Terminus, 4 Fury, 48 Supremacy, 12 Extinction (the lore names the armada, no counts) | `STANDING_FORCES` |
| The Hydian pickets: Fury-class for cruisers (0.6 a strength point), Supremacy fighters (1.2) | `BLOCKADE_PICKETS` |
| What a major battle is | `isMajor` |

From the engines and not new here: every roll, hit, shield, damage and formation number (combat-scales, D-505), and the XP rules (m8-skills, D-513; the Piloting line reuses combat XP's exchange rule).
