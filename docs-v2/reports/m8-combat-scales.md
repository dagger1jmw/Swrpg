# m8-combat-scales: space and ground combat rolls (2026-11-25)

Decision D-505. Spec: [combat-scales.md](../spec/combat-scales.md).

| Item | Result |
|---|---|
| A. The core roll | Built: src/engine/track.ts, the duel's bands for every scale |
| B. Ships as combatants | Built: 55 classes as data; shields, ion, projectors, power, targetable systems |
| C. Dogfights | Built, with the lore's manoeuvres, torpedo locks, turrets, engineers and repairs |
| D. Fleet battles | Built, with formations, reforming, forced breaks, fighters and the battle map |
| E. Ground battles | Built: sector rolls, matchups, breakthroughs, morale, meditation |
| F. Tests and calibration | 49 new tests; section 1 below |
| Ship lore | Every Part 2 decision recorded as ruled; class tables merged; fix5's note closed |

**It is engine and data only.** Nothing in the game calls it yet: no menus, narration, saved battles or XP (spec section 7).

## 1. Calibration against the anchors

Won / lost and mean rounds of 3 minutes; equal crews, no fighters, 400 battles each.

| Anchor | Close | Medium | Long |
|---|---|---|---|
| Venator v one Munificent | 100/0, 11 | 100/0, 5 | 100/0, 8 |
| Venator v two | 25/75, 15 | 96/4, 12 | 100/0, 20 |
| Venator v three | 1/99, 9 | 50/50, 14 | 60/41, 27 |
| Venator v four | 0/100, 6 | 8/92, 11 | 5/95, 18 |
| Imperial I v Venator | 100/0, 9 | 100/0, 3 | 100/0, 7 |
| Imperial I v MC80 Liberty | 37/63, 15 | 99/1, 3 | 72/28, 15 |
| Victory I v Venator | 96/4, 17 | 94/6, 7 | 0/100, 21 |
| Four Venators v Lucrehulk | 99/2, 18 | 100/0, 8 | 100/0, 12 |
| Venator v Providence | 92/7, 34 | 100/0, 15 | 100/0, 20 |
| Harrower v Valor | 54/46, 24 | 98/2, 7 | out of reach |
| Thranta v Terminus | 54/45, 25 | 44/56, 35 | out of reach |

With fighters launched (200 each): Imperial I beats a Venator 93%; a Venator beats a Victory I 88%; a Lucrehulk's Vultures beat one Venator every time; a Ton-Falk grinds a Dreadnaught down 93%, and loses to a Victory or an Imperial every time.

**Endor** (400 runs, ten rounds): concentrated fire takes the Executor's forward shields in 74% (round 3), a dome in 74% (4) and the bridge in 72% (5); spread fire 32%, 28% and 24%. Both fleets are invented, but for Ackbar's Naval command 80: Home One, 12 MC80s, 8 Nebulon-Bs, 12 CR90s and 168 fighters against the Executor, six Star Destroyers and 144 TIEs.

**Dogfights** follow the duel's table: 5, 10, 20 and 30 levels better wins 61%, 66%, 82% and 91% (duel 60, 68, 84, 92).

**Not matched, or odd:**
1. **Mon Calamari at long range.** The lore gives them an edge there. They do far better than at medium, but an Imperial I still wins 72%.
2. **Three Munificents** are about even with a Venator except close in. The lore speaks only of four.
3. **Wedges are very strong bow-on:** an MC80 lasts three rounds in front of an Imperial I.
4. **Dedicated carriers** beat a Dreadnaught but no Star Destroyer; a Secutor (144 TIEs) always loses to an Imperial I.
5. **The Sith's ships are wedges too,** so four Thrantas beat a Harrower close in (84%) and lose in front of it (99%).

## 2. Decisions recorded

All ten of Part 2, in the file's "Decisions (ruled)". The eight you listed, and two you did not:
- **9. Turbolaser wattage:** the question was flavour or drop. Read as flavour; no number uses it.
- **10. The missing file:** it does exist; the tables are merged into it as one dated list (your 8). Part 2's own tables are now a pointer.
- **Your 6, the Interceptor:** Part 2 cites one source for each figure. Its Legends page also cites *The Stele Chronicles* (1994) for four, so 4. The B-wing's 8 has two sources against one.

## 3. Readings

- **The strike.** Fleet and ground: the next round, as a duel. Dogfight: the same turn, because getting on a tail is the +3.
- **Matchups** are + on one side and - on the other, so +/-2 is a swing of 4, and the units' 3 a swing of 6.
- **A graze stops at the shields;** a system goes only if the shot reached the hull ("what a hit does comes from the ship").
- **"Down until repaired":** a burnt projector comes back at zero and then recharges.
- **Recovery is slow for capital ships** (about 2% of the pool a round), because Legends has facings beaten down in an action.
- **Guns turned on shields before c. 7500 BBY:** rapid fire beats shields from the 7700s to the 7500s only, as the lore dates it; before and through it recovery is slower.
- **The Executor's linked groups** count as two bolts of eight. At full value it kills a Mon Calamari cruiser and more every round, and Endor cannot happen.
- **Ground units** are the minion kinds. Vehicles, guns and air have no data in the game, so theirs is invented.
- **The bridge** is exposed by the loss of one dome, as at Endor. A bridgeless ship is crippled (guns x0.2), not destroyed.

## 4. Questions

1. **Gunnery and Repair** are not skills in the game (Repair is ruled its own, not built). The rules take a level from the caller. Is Gunnery its own skill, or a pilot's Piloting and a turret gunner's Blaster?
2. **Battle meditation in fleets:** section D does not list it, so a fleet does not get it (a story modifier can). Bastila's was a fleet's. Add it?
3. **Canon hangars:** the Venator's fighters (192 V-wings, 36 ARC-170s) and the Thranta's 14 Liberators come from their Legends pages, not from our lore files. Add them to the files?
4. **The design notes' links:** the Claude Docs version is the working copy. The two links to combat-scales.md are in the exported file and go at the next export unless added there.
5. **Mon Calamari at long range:** leave it, or a larger edge?

## 5. Every invented number

Jared's are the bands and track, the +/-2, +/-3, +1 and -2 of the rolls, the crew's 0 to +2, the terrain's +1, +2 and -2, the turbolaser's x3, the two-second cycle (folded into the round) and the Venator's eight guns. Everything below is invented unless it says lore or game.

### The track
A missed strike moves it 2 toward 0.

### Shields, power and damage (shipCombat.config.ts)
| Number | Value |
|---|---|
| Pools by length (m: shields), flight-game ratings but 20, 60 and 3,200 m | 20: 60, 60: 180, 150: 400, 250: 576, 300: 960, 500: 1,600, 600: 2,080, 900: 3,200, 1,600: 4,800, 3,200: 13,000, 19,000: 96,000 |
| Hull, of shields | 0.47 (the rated ships: 0.43 to 0.57) |
| Reactor | 100 x square root of watts over the Imperial I's; unrated 100 x (shields / 4,800)^0.75 |
| Usual generators by length (m) | 60: 1, 150: 2, 300: 2, 600: 4, 900: 4, 1,600: 6, 19,000: 40 |
| Warhead bypass by particle shielding | 0: 90%, 40: 60%, 75: 20%, 90: 0 |
| Particle shielding by kind | fighter 10, freighter 20, corvette 30, frigate 45, heavy cruiser 60, battleship 70, Star Destroyer 75, battlecruiser 78, dreadnought 85 |
| Particle shields while launching or firing warheads | x0.5; a timed volley, none |
| Retuned: other fire stopped, ion drained | 15%, 35% |
| Ion: pool drain, hull, disabling load, system load | 60%, 10%, 50% of hull, 40% of that |
| Ion: minutes disabled at 1, 2, 4 times the load | 3, 6, 10 |
| Ion cleared a minute | 6% + 0.1% a point of Repair |
| Recovery a minute | 20% small craft, 0.7% capital |
| Generators' exponent; before c. 7500 BBY; rapid fire | 0.5; x0.35; x4 |
| Burn-out: small, capital, hardy | 1.75, 0.5 of a facing; x1.5 |
| Projector swap at Repair 0, 40, 80, 120 | 14, 9, 6, 4 minutes |
| Power: guns, shields, engines | 50, 30, 20% |
| Guns' most | 65%; Venator 95% |
| Fire at 25, 50, 65, 95% to guns | x0.6, 1, 1.2, -; with settings x0.6, 1, 1.25, 1.8 |
| Held fire to shields | 80% of the guns' share |
| System states: damaged, disabled, destroyed | x0.75, 0.35, 0.2 |
| System hit, chance per hull lost | x3, at most 90% |
| Repair DC | 14 |
| Damaged, crippled | 75%, 30% |
| Break-up: overkill, chance a round | 35%, 35% |
| Dome, bridge, cap | 3%, 2% of hull, 400 |
| A destroyed generator | a third of them |
| Crippled guns; bridgeless | x0.5; x0.2 |
| A called shot's share on the tower | 25% |
| Generator called shot | 10 x hull lost, at most 90% |
| Tracking on fighters, small ships | medium 0.35, 0.9; capital 0.06, 0.75 (a shot: -3, -8) |
| Small guns on corvettes | the square root of their share on capital ships |

### Dogfights
| Number | Value |
|---|---|
| Turn | 5 s |
| Volley by band | 0.5, 1, 1.25, 1.5; a graze on a bare facing 0.5 of that |
| Position: head-on, side, tail at 3, 4, 5 | -2, -5 to -3, 0, +1, +2 |
| Track after a hit, a miss | 2, 1 toward 0 |
| Torpedo evasion, decoys, freighter, its own tracking offset | -3, +4, -2, +3 |
| Jink | evasion +2, own shots -3 |
| Range: medium, long | -2, -5 |
| Force Sense 15, 40, 80, 120 | 0, +1, +2.5, +3.5 |
| Boost: lasers, weak; shields, weak; engines, weak | 1.25, 0.75; 2, 0; +1, -1 |
| No engineer; turret; angle | -1; -5; 80% |
| Engines damaged, disabled, destroyed | -2, -5, -8; sensors -1, -3, -3; weapons x0.6 |
| Manoeuvres | spec section 3; risks: stall 3, slip-jaws 4, Koiogran and pivot 5, break, scissors, hop and roll 6, terrain 8; +1 for scissors on plain flying, hop and roll on a trap, roll on scissors; roll +2 on a stall |
| Collision | 20 on the fore shields, 8 on the hull |
| Dogfights' worth to a fleet | half a point a kill, -1 beaten, at most 2 |

### Fleets
| Number | Value |
|---|---|
| Round | 3 minutes, one effective volley a gun |
| Gaps; reforming DC; rounds | -1; 14; 1 or 2 |
| Crew levels for 0, +1, +2 | 20, 50, 80 |
| Fire that lands at -12, -6, 0, 6, 12 | 5, 10, 16, 22.5, 29% |
| Range close, medium, long; Mon Calamari at long | 1.15, 0.9, 0.6; x2 |
| Wedge broadside at close | x0.9 |
| Strike at 4, 10, 16; spread | 1.5, 2.25, 3; half the extra |
| Focused fire | x1.35 |
| Spread over at most | 4 targets |
| Rolling; rolls at | guns x0.6; shown facing under 30% of the freshest |
| Pincer on the aft facing | 40% |
| Brawl | +/-6 |
| Forced break | 30% of strength in a round |
| Flagship lost | -2 for 2 rounds |
| Fighter kills, point defence kills | 0.35, 0.2 of fire over toughness |
| Toughness, fire | shields x0.75 + hull, 6% a point of handling; strike wings fire at 0.4 |
| Pilot skill | x (0.5 + level / 100) |
| Warheads that find the target: fighters, ships | 25%, 8% |
| Interception | point defence over itself + 8 a warhead; over 1,600 m of ship |
| Warheads a fighter a round; guns on a capital ship | 1; 25% |
| Launch a round | 48, or length / 6 |
| Screen | holds 70% at equal numbers |
| Withdraws under | 35% of strength |
| NPC captain's power in a true warship | 85, 10, 5% |
| Engine power for the range | 10 points of speed a whole reactor |
| Battle limit | 60 rounds |
| Formation pairs the notes do not give | line > feigned retreat; brawl > pincer; pincer > withdraw; feigned retreat > slash, brawl, pincer; capping the T > fake |

### Ground
| Number | Value |
|---|---|
| Phase | 1.5 h |
| Plans | each beats two (spec data); all pairs are readings |
| Kind's fire | 1 + 0.32 a grade + 0.35 coordination + 0.15 accuracy, heavy +0.5, melee -0.4, least 0.4; on vehicles 25% (heavy 70%), on air 12% (heavy 30%) |
| Kind's toughness | none 0.8, light 0.95, medium 1.1, heavy 1.3, by the square root of its Vitality multiplier |
| Troop quality | 0.7 of weapon level + 8 coordination + 3 accuracy |
| Where: armour in town or woods; on heavy cover; anti-armour from cover; infantry on armour in town; artillery massed, loose; raiders, air on guns | 0.25; 0.6; 2; 4; 1.6, 0.8; 2.2, 1.8 |
| Matchup scale; numbers | 1; log 2 of the ratio |
| Morale modifier at 0, 30, 60, 100 | -3, -1.5, 0, +1.5 |
| Meditation at 10, 40, 80, 120 | 0, +1, +2, +3 |
| Force user's morale; duelist | +15; +1, +2, +3 |
| Own fight | +2, 0, -2 |
| Out of contact | 0, -1, -2 |
| Losses a phase at -12, -5, 0, 5, 12 | 10, 6, 3.5, 2.5, 1.5% |
| Breakthrough losses | 6, 18, 18, 30%; ground twice takes the position; droids in a rout lose 25% more; a unit is gone at 8% |
| Morale: start, bonded, fear | 65, 60, 60 |
| Checks at; DC; per point lost | 75, 50, 30%; 11; 0.06 |
| Leader, meditator | +3; +7 and -15 morale |
| Bond; mettle | (bond - 50) / 15; -3, 0, +3 |
| Rout by; shaken; steady | 4; -18; -4 |
| Fear-ruled collapse; alone | 45%; 70% |
| Drift at -10, 0, 10; broken through | -8, 0, +5; -10 |
| A shaken unit's weight | 0.6 |

### Weapons, ships and units
Every ship's particle shielding, handling, speed and unstated arcs are invented; its last column names the rest. Years are signed (negative = BBY); a blank is no date on record. Shields and hull are the flight games' where that column does not name them.

| Class | Years | Shields / hull | Generators | Reactor | Particle | Handling | Speed | Invented (beyond particle, handling, speed and unstated arcs) |
|---|---|---|---|---|---|---|---|---|
| Aurek-class tactical strikefighter | -4015 to -1000 | 40 / 18 | 1 | 2.8 | 10 | 2 | 5 | reactor, generators, shields, hull, dates |
| Sith fighter (Star Forge) | -3959 to -3950 | 0 / 14 | 0 | 0.2 | 0 | 3 | 5 | reactor, generators, shields, hull, weapons |
| Davaab-type starfighter | -3976 to -3950 | 30 / 16 | 1 | 2.2 | 10 | 2 | 5 | reactor, generators, shields, hull, weapons |
| Liberator-class starfighter | -3700 to -3600 | 45 / 18 | 1 | 3 | 10 | 2 | 5 | reactor, generators, shields, hull, weapons |
| Mark VI Supremacy-class starfighter | -3681 to -3600 | 25 / 14 | 1 | 1.9 | 10 | 3 | 5 | reactor, generators, shields, hull, weapons |
| B28 Extinction-class bomber | -3681 to -3600 | 40 / 34 | 1 | 2.8 | 10 | -1 | 5 | reactor, generators, shields, hull, weapons |
| Vulture-class droid starfighter | -32 to -19 | 0 / 8 | 0 | 0.2 | 0 | 2 | 5 | reactor, generators, shields, hull, weapons |
| ARC-170 | -22 to  | 70 / 36 | 1 | 4.2 | 10 | 0 | 5 | reactor, generators, shields, hull |
| Alpha-3 Nimbus V-wing | -19 to  | 30 / 14 | 1 | 2.2 | 10 | 3 | 5 | reactor, generators, shields, hull |
| T-65 X-wing | -1 to  | 50 / 20 | 1 | 3.3 | 10 | 2 | 5 | reactor, generators, dates |
| BTL Y-wing | -22 to  | 75 / 40 | 1 | 4.4 | 10 | -1 | 5 | reactor, generators |
| RZ-1 A-wing | -1 to  | 50 / 14 | 1 | 3.3 | 10 | 4 | 5 | reactor, generators, dates |
| A/SF-01 B-wing | 0 to  | 100 / 60 | 1 | 5.5 | 10 | -1 | 5 | reactor, generators |
| TIE/LN | -19 to  | 0 / 9 | 0 | 0.2 | 0 | 3 | 5 | reactor, generators, dates |
| TIE/IN Interceptor | -1 to  | 0 / 16 | 0 | 0.2 | 0 | 3 | 5 | reactor, generators |
| TIE/sa bomber | -19 to  | 0 / 28 | 0 | 0.2 | 0 | -1 | 5 | reactor, generators, dates |
| TIE/D Defender | 3 to  | 100 / 14 | 1 | 5.5 | 10 | 4 | 5 | reactor, generators |
| Dynamic-class freighter | -3976 to -3600 | 82 / 38 | 1 | 4.7 | 20 | 0 | 5 | shields, hull, reactor, generators, weapons |
| XS stock light freighter | -3700 to -3600 | 168 / 79 | 1 | 8.1 | 20 | 0 | 5 | shields, hull, reactor, generators, weapons, decoys |
| Lethisk-class armed freighter | -3970 to -3940 | 143 / 58 | 1 | 7.2 | 20 | 0 | 5 | shields, hull, reactor, generators, weapons |
| the Ebon Hawk | -3956 to -3950 | 131 / 46 | 1 | 6.7 | 20 | 1 | 9 | shields, hull, reactor, generators, weapon counts, decoys |
| Hammerhead-class cruiser | -5000 to -1000 | 1008 / 474 | 2 | 31 | 45 | -2 | 5 | shields, hull, reactor, generators, guns a battery |
| Derriphan-class battleship | -5000 to -3950 | 514 / 242 | 2 | 18.7 | 45 | -2 | 5 | shields, hull, reactor, generators, weapons |
| Interdictor-class cruiser | -3963 to -3600 | 2080 / 978 | 4 | 53.4 | 60 | -3 | 5 | shields, hull, reactor, generators, guns a battery |
| Centurion-class battlecruiser | -3960 to -3600 | 3886 / 1826 | 5 | 85.3 | 75 | -4 | 5 | shields, hull, reactor, generators, guns a battery |
| Inexpugnable-class tactical command ship | -3996 to -3900 | 7493 / 3521 | 9 | 139.7 | 78 | -5 | 4 | shields, hull, reactor, generators, weapons, hangar, dates |
| Kandosii-type dreadnaught | -3976 to -3950 | 4251 / 1998 | 5 | 91.3 | 75 | -4 | 5 | shields, hull, reactor, generators, weapons |
| Thranta-class corvette | -3700 to -3600 | 806 / 379 | 2 | 26.2 | 30 | -1 | 7 | shields, hull, reactor, generators, length for the curves, weapon counts |
| Defender-class light corvette | -3681 to -3600 | 263 / 124 | 1 | 11.3 | 30 | 0 | 8 | shields, hull, reactor, generators |
| Fury-class Imperial interceptor | -3681 to -3600 | 278 / 131 | 1 | 11.8 | 30 | 1 | 8 | shields, hull, reactor, generators |
| Valor-class cruiser | -3681 to -3600 | 2827 / 1329 | 4 | 67.2 | 60 | -3 | 5 | shields, hull, reactor, generators, length for the curves, weapon counts |
| Harrower-class dreadnought | -3681 to -3596 | 2827 / 1594 | 4 | 67.2 | 60 | -3 | 5 | shields, hull, reactor, weapon counts |
| Terminus-class destroyer | -3653 to -3600 | 1120 / 526 | 2 | 33.6 | 45 | -2 | 5 | shields, hull, reactor, generators, length for the curves, weapon counts |
| Dreadnaught-class heavy cruiser (weak source) | -119 to  | 1920 / 1056 | 4 | 50.3 | 60 | -3 | 4 | reactor, generators |
| Acclamator-class assault ship | -22 to  | 2118 / 1244 | 4 | 16 | 60 | -3 | 5 | shields, hull, generators |
| Venator-class Star Destroyer | -22 to  | 3368 / 1583 | 5 | 68 | 75 | -3 | 7 | shields, hull, generators |
| Victory I-class Star Destroyer | -20 to  | 3200 / 1520 | 4 | 73.8 | 75 | -3 | 4 | reactor, generators |
| Victory II-class Star Destroyer | -19 to  | 3200 / 1520 | 4 | 73.8 | 75 | -3 | 5 | reactor, generators, weapon counts, shields, hull, dates |
| Lucrehulk-class battleship | -32 to -19 | 7708 / 4830 | 9 | 142.7 | 70 | -6 | 2 | shields, hull, reactor, generators |
| Providence-class carrier/destroyer | -22 to -19 | 3630 / 1706 | 5 | 37 | 75 | -3 | 5 | shields, hull, generators, hangar |
| Munificent-class star frigate | -22 to -19 | 1314 / 823 | 4 | 16 | 60 | -3 | 5 | shields, hull, generators, hangar |
| Recusant-class light destroyer | -22 to -19 | 1928 / 1087 | 5 | 32 | 75 | -3 | 5 | shields, hull, generators |
| Imperial I-class Star Destroyer | -20 to  | 4800 / 2272 | 6 | 100 | 75 | -4 | 6 | generators, dates |
| Imperial II-class Star Destroyer | 0 to  | 5280 / 2594 | 6 | 110 | 75 | -4 | 6 | shields, hull, generators, point defence, hangar split |
| Executor-class Star Dreadnought | -3 to  | 96000 / 45120 | 40 | 945.7 | 85 | -8 | 5 | hull, reactor, generators, hangar split, what a linked group is worth |
| Interdictor-class Star Destroyer (weak source) | -2 to  | 4800 / 2256 | 6 | 100 | 75 | -4 | 6 | shields, hull, reactor, generators, dates |
| Immobilizer 418 cruiser | -2 to  | 2240 / 960 | 12 | 56.5 | 60 | -3 | 5 | reactor |
| Lancer-class frigate | 0 to  | 576 / 304 | 2 | 20.4 | 45 | -1 | 5 | reactor, generators, dates |
| EF76 Nebulon-B escort frigate | -2 to  | 960 / 448 | 2 | 29.9 | 45 | -1 | 5 | reactor, generators, dates |
| Ton-Falk-class escort carrier | -2 to  | 1600 / 912 | 3 | 43.9 | 60 | -4 | 5 | reactor, generators, dates, hangar split, tubes |
| Secutor-class Star Destroyer (weak source) | -2 to  | 5513 / 3701 | 7 | 110.9 | 78 | -5 | 5 | shields, hull, reactor, generators, dates, domes |
| CR90 corvette | -60 to  | 400 / 188 | 2 | 15.5 | 30 | 0 | 8 | reactor, generators, dates |
| MC80 Liberty type (weak source) | 2 to  | 6217 / 1461 | 15 hardy | 121.4 | 75 | -3 | 5 | shields, hull, reactor, hangar split, dates |
| MC80A Home One type | 0 to  | 6217 / 1461 | 15 hardy | 121.4 | 75 | -3 | 5 | shields, hull, reactor, ion count, point defence, hangar split, dates |
| Quasar Fire-class cruiser-carrier (weak source) | -10 to  | 560 / 316 | 2 | 20 | 45 | -3 | 5 | shields, hull, reactor, generators, dates |

| Weapon | Kind | Damage | Range | Tracking | On a capital ship | Source |
|---|---|---|---|---|---|---|
| laser cannon | energy | 10 | close | fighter | 0.1 | the baseline |
| light laser cannon | energy | 6 | close | fighter | 0.1 | invented: under a laser cannon |
| heavy laser cannon | energy | 15 | close | fighter | 0.2 | invented: between laser (10) and turbolaser (30) |
| autoblaster | energy | 5 | close | fighter | 0.05 | invented |
| quad laser cannon | energy | 40 | close | fighter | 0.1 | four laser bolts |
| point-defence laser | energy | 10 | close | fighter | 0.1 | a laser cannon on a point-defence mount (lore) |
| light point-defence laser | energy | 6 | close | fighter | 0.1 | invented |
| point-defence quad laser | energy | 40 | close | fighter | 0.1 | four laser bolts |
| point-defence ion cannon | ion | 10 | close | fighter | 0.1 | invented |
| flak gun | energy | 20 | close | fighter | 0.02 | dangerous to fighters, much less to larger ships (lore); number invented |
| assault laser cannon | energy | 20 | medium | medium | 0.4 | invented |
| light turbolaser | energy | 20 | medium | medium | 1 | invented: under the turbolaser |
| turbolaser | energy | 30 | medium | capital | 1 | lore: three times a laser cannon bolt (NEGWT) |
| heavy turbolaser | energy | 80 | long | capital | 1 | invented within the lore file's 6-10 lasers (XX-9, DBY-827) |
| prow heavy turbolaser | energy | 240 | long | capital | 1 | invented: three heavy bolts; a Munificent's could pierce a battle station's shields (lore, ROTS ICS) |
| light ion cannon | ion | 10 | close | fighter | 0.3 | invented: as a laser |
| ion cannon | ion | 30 | medium | medium | 1 | invented: as a turbolaser |
| heavy ion cannon | ion | 60 | medium | capital | 1 | invented; NK-7 optimum 10 km, maximum 80 km (lore, NEGWT) |
| long-range heavy ion cannon | ion | 180 | long | capital | 1 | invented: three heavy ion bolts (the Munificent; the lore names it long-range) |
| proton torpedo | warhead | 80 | medium | medium | 1 | the lore file's 8 lasers (suggestion) |
| concussion missile | warhead | 60 | close | fighter | 1 | invented: under a torpedo, follows fighters better |
| assault concussion missile | warhead | 120 | medium | capital | 1 | invented: one and a half torpedoes |

| Unit | Fire: soft / hard / air | Toughness | Quality |
|---|---|---|---|
| militia | 1.3 / 0.3 / 0.2 | 0.80 | 3 |
| line infantry | 2.0 / 0.5 / 0.2 | 1.10 | 25 |
| commandos | 2.5 / 0.6 / 0.3 | 1.30 | 37 |
| Mandalorians | 2.6 / 0.7 / 0.3 | 1.30 | 38 |
| clone infantry | 2.0 / 0.5 / 0.2 | 1.10 | 25 |
| stormtroopers | 2.0 / 0.5 / 0.2 | 1.10 | 25 |
| Sith infantry | 2.0 / 0.5 / 0.2 | 1.10 | 25 |
| Yuuzhan Vong warriors | 1.8 / 0.4 / 0.2 | 1.42 | 29 |
| war beasts | 1.3 / 0.3 / 0.2 | 1.27 | 13 |
| war droids | 1.0 / 0.3 / 0.1 | 0.74 | 4 |
| B1 battle droids | 1.0 / 0.3 / 0.1 | 0.74 | 4 |
| B2 super battle droids | 2.1 / 1.5 / 0.6 | 1.42 | 16 |
| droidekas | 2.5 / 1.7 / 0.7 | 1.59 | 24 |
| Skytroopers | 2.0 / 0.5 / 0.2 | 1.10 | 25 |
| anti-armour teams | 1.0 / 3.0 / 0.6 | 1.00 | 28 |
| armour | 3.5 / 2.5 / 0.2 | 1.80 | 28 |
| droid armour | 3.0 / 2.2 / 0.2 | 1.80 | 21 |
| artillery | 3.0 / 1.5 / 0.0 | 0.80 | 28 |
| anti-air | 0.6 / 0.3 / 4.5 | 0.90 | 28 |
| air support | 2.0 / 3.5 / 2.0 | 1.20 | 31 |
