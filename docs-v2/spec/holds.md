# Holds and getting away (D-496 to D-498; Jared, 25 Nov 2026)

Someone stands up to a duelist so that others can get away. Every number is invented unless marked Jared's. Data: src/data/holds.ts. Rules: src/engine/holds.ts. Campaign: src/features/combat/holds.ts. Words: src/turn/holdFacts.ts.

## 1. The hold
- **One clock (Jared, D-499):** an exchange is 5 to 10 s here as everywhere (rolls.md section 3). A hold's time is the fight's own clock.
- **The duel's own dice decide each exchange.** It ends when the holder is beaten, or when the duelist gets past them.
- **Getting past:** a chance each exchange, by the ability gap (the duelist's lead over the holder: the mean of combat, Force Control and Willpower). Against an apex duelist, or one beyond, steeper and never less:

| Gap | 2 or less | 12 | 20 | 24 | 31 | 38 | 45 | 70 |
|---|---|---|---|---|---|---|---|---|
| Chance an exchange | 1.2% | 5.5% | 10% | 21% | 28% | 66% | 80% | 95% |

| Gap, apex | 2 or less | 10.4 | 17.4 | 20.9 | 27 | 33 | 39.1 | 60.9 |
|---|---|---|---|---|---|---|---|---|
| Chance an exchange | 1.2% | 5.5% | 10% | 21% | 28% | 53% | 75% | 95% |

- **Getting past is a blow.** The duelist strikes the holder down or aside: a hit through the fight's own damage, its margin up to 12 over a least that rises with the gap (0: 5, 14 to 21: 9.5, 24: 12, 40: 20). One nearer the duelist is more often only struck aside: a High Master about one time in five (Jared, D-498). Down: section 4's fates. Still up: on their feet, and the duelist is past.
- A duelist above the holder's bar who is pressed breaks away and is past them: the holder still only bought that time.
- A duelist who withdraws, is beaten, or is held to the end (200 exchanges) does not follow at all.

## 2. The place
From the recorded location only, when the hold begins: its kind, what it is in, and its recorded name. Never the narrator's say-so.

| Setting | Recorded as | A hold must buy |
|---|---|---|
| interior | a ship or a station, or a room in one | 20 s (Jared) |
| building | a building, or a room in one | 20 s |
| hangar | any place named a hangar, docking bay, landing pad, spaceport and so on | 45 s |
| street | a city or a district | 20 s of head start |
| open | anything else | 20 s of head start |

## 3. The player holds
The fight is played turn by turn as ever. At its end: the fight's clock until the duelist had the way past (the same chance each exchange, seeded by the fight), against the setting's need. Enough: whoever was getting away is away. Not enough: they had only that time. RESOLVED says which. It counts as a hold for the world (`heldOff`, brief or long by tier as before) only when it was enough. Without the Force and with a plan (D-493), the gap is by combat alone plus 12.

## 4. An NPC holds while the player gets away
1. **holdBegun** (the narrator's event): someone who is here engages a foe who is here. The engine resolves the whole duel at once and stores it hidden (`combat.hold`). No note, state line or choice says how it went. Nobody is hurt yet.
2. **The player's next turn is the escape.** The plan is read from what they say (`escapePlan`) or a choice. Anything else is no escape.
3. **holdTold:** the engine checks the plan against the time bought, and the narrator tells the duel and the escape together from the HOLD block. The holder's fate and both fighters' wounds land now. A Force-sensitive player feels a Force user's death when it happens in the story.
4. **Overtaken:** the fight with the foe begins on the next turn.

A holder beaten alive meets the foe's usual choice (killed, taken, left). A foe leaves the player's own fight for the hold; the last one to leave ends it.

## 5. The plan

| Step | Seconds | Where |
|---|---|---|
| reach the way out | 8 | interior, building, hangar |
| close the door | 5 | the same |
| wreck its console | 4 | interior, hangar |
| reach a ship | 12 | hangar |
| start it and get it out | 30 | hangar |
| reach a vehicle and go | 18 | street, hangar |
| reach cover | 12 | street, building, open |
| run / an evasive route / hide in the Force | — | anywhere |

A step that is needed first is done on the way. The plan stops at the first step the time does not cover. A ship or vehicle not yet moving when the time is up: caught.

**Barriers.** A lightsaber cuts a blast door in 45 s, an ordinary door in 12; without one it takes 2.5 times as long. A strong Force user rips it open instead: Master 0.75 of the cutting time, top duelist 0.45, apex 0.25, beyond 0.15. A wrecked console adds half as much again. A closed door gives the rest of the plan that time too. Behind one the player is away for now: the pursuer comes through when the time is up (`combat.pursuits`, barred), onto the player if they are still aboard or in the building, else onto the trail.

## 6. Open ground
- **Pace** 6 m/s, x (1 + 0.04 a point of Force Speed). **Stamina** 20 s + 0.5 a point of Force Speed + 0.4 a point of Endurance, then 6 m/s. A canon figure's named Force Body counts as Force Speed; one whose sheet lists neither has Force Speed from the mean of Force Control and Force Output (40: 20, 60: 36, 80: 53, 100: 70, 120: 86, 150: 110; D-497).
- **The head start** is the time the hold bought, less what the plan used; the runner is running all of it.
- **Clear** = out of sight (open 400 m, street and hangar 150, indoors 60; 4 times that on a straight route) and out of the pursuer's senses (6 m a point of Force Sense).
- **A pursuer with both more pace and more stamina** follows any route and catches them if they can close the gap. Only a runner hidden in the Force gets clear of one.
- **Losing them** once clear: d20 + level / 10 each. Runner: the best of Stealth and Agility, evasive +3 or straight -4, cover +2, hidden in the Force +7, ground covered +1 per 400 m (at most 3). Pursuer: the best of Tracking and Force Sense; a tie is theirs.
- **Concealment:** the sense range falls to sense / (sense + 2 x concealment). It costs the runner 20% of their pace and 30% of their stamina. Until Concealment is a skill (M6): the mean of Stealth and Force Control for a Force user with Stealth 20 or more.
- **Lost is not safe:** for 7 days the pursuer may find the trail, each day with a chance of 3% + 0.06% a point of Tracking or Force Sense (x 0.4 for a runner who hid). The engine says when.
- **Who else is looking (D-497):** the chance is x 1 with an intelligence service to call on (a Sith lord, inquisitor, officer, official, politician or Jedi Master of the Empire or the Republic), 0.85 with an Order, 0.7 with an organisation (the rest of a state, clans, cartels), 0.5 alone (a bounty hunter, a masterless darksider, anyone cut off from their side, the Sith while there are two, the Jedi while homeless). Malgus: 8% a day. A lone hunter of his skill: 4%.

## 7. How a duel reads (narration only)
An exchange is 5 to 10 s and several blows unless a sequence is described. A Pace line in the COMBAT block says how fast the blows come, by the weaker blade's level this passage: 95 or more a blur, a burst of ten or more blows in a couple of seconds (Jared); 80 six to eight; 60 four or five; 40 three or four; below that two or three. Force use and heavy committed strikes take longer. Extra blows touch nobody. The rest is in src/ai/prompts/combat-narration.md.
