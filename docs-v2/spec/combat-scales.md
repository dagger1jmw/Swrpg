# Space and ground combat rolls (D-505; Jared, 25 Nov 2026)

Dogfights, fleet battles and ground battles on the duel's roll and track. Design: m8-design-notes.md, "Ships and space combat" and "Ground command". Lore: SW_Ship_Shields_Weapons_Part1-2, SW_Space_Tactics, SW_Starships_Classes. **Every number is invented unless marked lore, game (a game book or a flight game's rating) or Jared's.**

Data: src/data/shipCombat.config.ts, ships.ts, ground.config.ts. Rules: src/engine/track.ts, ships.ts, dogfight.ts, fleetBattle.ts, groundBattle.ts. Tests: tests/m8/combatScales.test.ts. All pure; nothing in the turn loop calls them yet (section 7).

## 1. The core roll (Jared)
- rolls.md section 1 on each side: d20 + effective level / 10 + modifiers, natural 20 +5, natural 1 -5. The margin is read to the whole point.
- **The track,** -5 to +5: |m| of 1 or less drifts one step to 0; 2-5 one step; 6-9 two; 10+ three.
- **At 3 the leading side has a strike.** Below 4 it does not land and the track comes back 2 steps (as rolls section 3 before D-244); 4 or more lands and the track resets.
- A roll decides position, hits and how well a plan works. What a hit does comes from the ship or the unit.

| Scale | A round is | The strike |
|---|---|---|
| Dogfight | 5 s | a shot from the tail, the same turn |
| Fleet | 3 min | the next round: concentrated fire |
| Ground | 1.5 h, per sector | the next phase: a breakthrough |

## 2. Ships as combatants

### Data
One dated list of classes, read for the year (D-438). Each has: a shield pool per facing (fore and aft for fighters and freighters; fore, aft, port and starboard for capital ships), hull, generators, reactor, particle shielding, mounts (weapon, barrels, arcs, tubes), hangar, handling, speed, and which of its fields no source gives (`invented`). Point defence is the mounts marked so.

- **Scale:** a laser cannon bolt is 10, so the flight games' ratings (SBD shields, RU hull; game) fit as they stand. A turbolaser is 30 (lore, x3), a heavy turbolaser 80 (the lore file's 6 to 10 lasers), a torpedo 80 (its 8).
- **Pools with no rating:** from the rated ships' curve by length, hull at 0.47 of shields, then a factor: a dedicated carrier 0.5 to 0.7, the Confederacy's fragile ships 0.45 to 0.5, a Mon Calamari cruiser 1.6 with hull 0.8.
- **Reactor:** the cross-sections' watts (lore) at the square root, an Imperial I being 100; else in line with the shields.
- **2014 FFG armament counts** are kept and marked `weak` (ruled).
- **Game-book "batteries"** (the KOTOR ships, the Harrower, the Valor) are four guns. The Executor's turbolasers are fire-linked in groups of eight (game); a group counts as two bolts.

### Shields
- The facing's pool is spent before the hull.
- **Torpedoes and missiles** partly bypass it, by particle shielding: 0: 90%, 40: 60%, 75: 20%, 90 or more: none. Fighter 10, freighter 20, corvette 30, frigate 45, heavy cruiser 60, battleship 70, Star Destroyer 75, battlecruiser 78, Star Dreadnought 85. A ship that launches fighters or fires warheads has half its particle shielding that round; a volley timed to that moment meets none.
- **Ion** passes ray shields: 60% of it drains the pool on the way, all of it goes to the ship's systems, 10% to the hull. At 40% of the load that disables, it takes a system off line. Load equal to half the hull disables the ship for 3 to 10 minutes; crews clear 6% a minute plus 0.1% a point of Repair. **Retuned** against ion, the pool takes 35% of it and nothing passes, but stops only 15% of laser fire.
- **Recovery** (a game rule, ruled): 0.7% of the whole pool a minute for a capital ship, 20% for a fighter or freighter, at the usual reactor and 30% of power to shields. In proportion to the reactor and to the power share (guns that hold their fire give 80% of theirs), by the square root of generators over the usual number (Mon Calamari: three times as many, x1.7), and x0.35 before c. 7500 BBY.
- **Burn-out:** fire on one facing in one round of half its full pool (a capital ship; x1.5 for hardy generators) or 1.75 times it in a turn (a fighter), with the pool gone, burns the projector out: down until repaired. A damage-control crew takes 14 minutes at Repair 0, 9 at 40, 6 at 80, 4 at 120 (lore: "a matter of minutes"). Fighters and freighters cannot in flight.
- **Rapid-fire turbolasers** beat any shield from the 7700s to the 7500s BBY (lore): x4 against the pool.
- **Management:** power shares (guns 50%, shields 30%, engines 20%); guns at most 65%, for x1.2 fire; the Venator 95%, for x1.8 from its eight DBY-827s (lore: almost all its reactor, seven settings). Angle the pool between facings (double front: 80%). Roll to show the freshest facing (guns x0.6 that round).
- **Targetable:** generators; on a command tower, the domes and the bridge. Neither can be reached until a forward or side facing is down, nor the bridge until a dome is gone (Endor).

### Damage
Hull does not come back in a fight. Damaged under 75%, crippled under 30% (or the bridge gone: guns x0.2), disabled (ion, or engines and weapons both destroyed: can be boarded), destroyed. At no hull a fighter is lost; a ship is a hulk that breaks up at once at 35% overkill, else with a 35% chance a round. Hull lost brings system hits (three times the share of the hull lost, as a chance); a field repair (Repair against 14; a capital ship's crew tries one system a round) takes a system one step back, never out of destroyed.

## 3. Dogfights
1. **Position:** piloting + handling + the manoeuvre + engines + the Force (Force Sense 40: +1, 80: +2.5, 120: +3.5). The margin moves the track. Three or more: on the tail.
2. **Shots:** gunnery + position (head-on -2, side -5 to -3, tail 0 to +2) + range against evasion (piloting + handling + jinking + the Force). Head-on and side shots only as snap shots.
3. **Hits:** 4-7 half the volley, and it stops at the shields; 8-11 all of it, pool then hull; 12-15 x1.25 and a system knocked out; 16+ x1.5 and a system destroyed. A system goes only if the shot reached the hull. A destroyed cockpit or an empty hull is the fighter.
4. **Torpedo lock:** from the tail; one evasion roll at -3 (decoys +4; a freighter -2). Any margin of 0 or more hits.
5. After a shot the target breaks: the track eases 2 after a hit, 1 after a miss.

**Manoeuvres** are the lore's (SW_Space_Tactics): break +1, jink (evasion +2, own shots -3, the pursuer stays), scissors +1, stall +2, Koiogran +2, power pivot +1, terrain-following +2, trap and Corellian Slip +3 (a wingman), Slip-jaws +4 (droid or Force pilots), Segnor's Loop (positions even again); Reverse Throttle Hop and Tallon Roll +2 against a break. Those with a risk go wrong when lost by 3 to 8: a step more, and near terrain a collision.

**Power:** lasers x1.25 (weak x0.75), shields' recovery x2 (weak none), engines +1 (weak -1). **Freighters:** a gunner a turret, any direction, at -5; without an engineer, shifting power costs the pilot -1; a tech or droid patches systems.

## 4. Fleet battles
- **Tactics:** + formation (+/-2, Jared) + 1 if the enemy formation is known (Jared) + crews 0 to +2 (Jared; levels 20, 50, 80) - 2 reforming (- 1 more with gaps) - 2 for two rounds after the flagship is lost + the player's dogfights (half a point a kill, -1 beaten, at most 2).
- **Formations** beat each other as the notes say; where they do not: exchange beats the feigned retreat, the brawl beats the pincer, the pincer beats withdraw, the feigned retreat beats slash, brawl and pincer. A brawl swings the margin by up to 6 either way.
- **Reforming:** a Tactics roll of 14 makes it one round, less makes it two, with gaps. The fake into a line and the feigned retreat into capping the T or a pincer are free.
- **Fire:** one round is one effective volley of every gun in range and arc. The share that lands: 5% at a margin of -12, 16% at 0, 29% at +12; close x1.15, medium x0.9, long x0.6 (Mon Calamari targeting x2 at long). Fire ordered onto one ship lands x1.35. A strike round: x1.5 at a margin of 4, 2.25 at 10, 3 at 16 (half the extra when the fire is spread).
- **Arcs:** a wedge brings its flanks to bear ahead; at close range big ships fight broadside (a wedge at x0.9); an all-round ship bears with two arcs, or all four on several targets. The shown facing takes the fire; a pincer puts 40% on the aft one.
- **Tracking:** a turbolaser's fire on fighters x0.06, on corvettes x0.75; small guns on capital ships x0.1.
- **Fighters:** a round to launch, at most 48 or a sixth of the ship's length in metres. They kill each other by guns, toughness and skill; a screen of equal numbers holds off 70% of a strike; point defence kills, and takes its share of warheads (8 points a warhead to halve). The strike goes for the weakest facing (the nova flare).
- **Range:** the faster side has the one it wants; a Tactics margin of 3 is worth a point of speed, and engine damage and engine power count.
- **Forced breaks:** 30% of the side's strength in one round, the flagship, or a slash's lead ship. It fights as a brawl until it reforms.
- **The map** is drawn by `fleetMap` (under 41 columns).

## 5. Ground battles
Each sector, each phase: the leader's Tactics, or the troops' quality, + plan (+/-2) + units (within +/-3) + 1 each for artillery, armour and air + terrain + morale + battle meditation + the player's own fight (+/-2).

- **Units** are the minion kinds (data/npcGen.config.ts) for every sort of infantry and droid: quality from the kind's weapon levels by grade, teamwork and aim; fire from its weapon and grades; toughness from its armour; morale from its group. Armour, artillery, anti-armour, anti-air and air have their own numbers.
- **Matchup:** what my units do to theirs, less what theirs do to mine, plus the numbers (log 2), capped at 3. It is + on one side's roll and - on the other's, as the plan is.
- **Terrain (Jared):** cover +1, heavy +2 to the defender; high ground +1 to its holder; a chokepoint -2 to the attacker; attacking armour cannot cross a river but at a bridge. In town or woods armour's fire is x0.25 and infantry's on it x4; anti-armour from cover x2; artillery on massed or dug-in troops x1.6; raiders on guns x2.2, air x1.8.
- **Force users at the front:** +15 morale in the sector; a duelist is +1 (master), +2 (top), +3 (apex), less the enemy's best there.
- **Meditation:** +1 at 40, +2 at 80, +3 at 120, every roll of the side.
- **Out of contact:** bonded units 0, ordinary -1, droids and the fear-ruled -2.
- **Breakthrough (Jared's bands):** 4-7 light losses (6% more) and ground (twice takes the position); 8-11 18% and the position; 12-15 a unit routs; 16+ the sector collapses. Losses a phase otherwise 1.5% to 10% by margin, over toughness.
- **Morale:** starts at 65 and drifts -8 to +5 a phase; its modifier is -3 to +1.5. A check at 75%, 50% and 30% strength, at a leader's death (+3 harder) and at a meditator's (+7, and -15 morale, the whole side): d20 + morale / 10 + (bond - 50) / 15 + mettle (early -3, late +3) against 11 + 0.06 a point of strength lost. Failed by less than 4: shaken; else routed.
- **Fear-ruled** (fear 60+, bond under 60): no checks; they collapse at 45% strength, 70% when the commander they fear is gone. **Droids** never break, and stop when the control signal is lost.

## 6. Calibration
Equal crews (50), no fighters, 400 battles each: won / lost, rounds.

| | Close | Medium | Long |
|---|---|---|---|
| Venator v Munificent | 100/0, 11 | 100/0, 5 | 100/0, 8 |
| Venator v two | 25/75, 15 | 96/4, 12 | 100/0, 20 |
| Venator v three | 1/99, 9 | 50/50, 14 | 60/41, 27 |
| **Venator v four** (lore: easily outgunned) | 0/100, 6 | 8/92, 11 | 5/95, 18 |
| **Imperial I v Venator** (lore: outclassed) | 100/0, 9 | 100/0, 3 | 100/0, 7 |
| Imperial I v two Venators | 84/17, 19 | 88/12, 6 | 86/14, 15 |
| **Imperial I v MC80** (lore: better close) | 37/63, 15 | 99/1, 3 | 72/28, 15 |
| Four Venators v Lucrehulk | 99/2, 18 | 100/0, 8 | 100/0, 12 |
| Venator v Providence | 92/7, 34 | 100/0, 15 | 100/0, 20 |
| Thranta v Terminus | 54/45, 25 | 44/56, 35 | out of reach |

**Endor** (invented fleets, 400 runs, 10 rounds): Home One and 12 MC80s, 20 escorts and 168 fighters against the Executor and six Star Destroyers, close. All fire on the Executor: forward shields down in 74% (round 3), a dome in 74% (4), the bridge in 72% (5). Fire spread: 32%, 28%, 24%.

**Dogfights:** the better of two X-wing pilots by 5, 10, 20 and 30 levels wins 61%, 66%, 82% and 91% (a duel: 60, 68, 84, 92). Median 13 turns, about a minute. X-wing v TIE at 50 each 73%; a TIE ace at 80 wins 78%.

**Ground** (the attacker takes a held sector in 12 phases): even 41%; cover 32%; heavy cover and high ground 17%; chokepoint 23%; Tactics 70 v 50 67%; the better plan 83%; meditation (90) 70%; three to one 78%; armour v infantry 93% in the open, 31% in a town; armour v anti-armour in cover 45%; commandos v guns 96%; air v anti-air 21%. A meditator killed: 45% of line units rout, 17% shaken (Mizra).

## 7. Not built here
The turn loop, menus, narration blocks, saved state, the events a battle raises, and XP; the tactics menu; boarding; hull skimming and trench runs as a player's own manoeuvre (strike fighters have it in their numbers); modifications; the ground grid map, scouting, the reserve and contingencies. Gunnery and Repair are levels the caller passes: neither is a skill yet.
