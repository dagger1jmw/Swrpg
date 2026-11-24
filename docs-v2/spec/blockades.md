# Running a blockade (as built, M8 item 4)

Design: m8-design-notes.md, "Running a blockade". Decisions: D-469, D-470. Every number is `invented`: accepted as starting numbers (D-470), to be revisited after playtests.

Code: `src/data/blockades.ts` (the blockades), `blockade.config.ts` (the numbers), `src/engine/blockade.ts` (rules), `src/features/world/blockades.ts` (state), `src/turn/travel.ts` (play). Tests: `tests/m8/blockade.test.ts`, `tests/m7/travel.test.ts`.

## 1. A blockade

One dated record, for any era: who runs it and what it closes (worlds, or a route inside a grid strip), start and end or the world-event outcomes that begin and end it, sensor coverage (grows with age), who passes freely, the traffic it leaves alone, whether its military is trained, and dated states: level, strength, alertness, patrol coverage, ground patrols, corruptibility, and the ladder of responses (turned back, boarded, fired on, captured).

Levels: 1 trade, 2 enforced, 3 military. The level makes every approach harder. Going around also hardens with age, on a smooth curve; a trade blockade barely tightens. A trained military leaves no holes in its first days.

The Hydian Way blockade (3661–3660) is the first. It stands from O.blockade_active until E.3660.hydian_battle produces O.blockade_broken; if it is never broken, it goes on. Other worlds in its strip keep the detour. The Mandalorians count as a trained military (professional warrior clans with Imperial backing). It counts as 60 days old on 1 January 3661 (`invented`), a known stretch: Legends says only that it was launched in 3661 BBY, with no month, so this is a game convenience that keeps the 3661 start's hunger and riots.

## 2. The approaches

| Approach | What it needs | Check |
|---|---|---|
| Ride under protection | papers (flag), or a friendly NPC in the protected traffic | Charisma |
| Undercover | a friendly NPC who can get fake IDs, codes and a cover, or blockade training. The default intelligence and military route | Charisma or Intelligence; +2 each for a contact and training |
| Smuggle | a known smuggler (or the character is one) | the smuggler's Piloting or Stealth |
| Sneak through | sensor masking (flag) | the lower of Piloting and Stealth |
| Go around, slip in close | a ship | Piloting |
| Go around, land outside, walk in | a ship; only on the way in | Piloting, then the trek |
| Force through | Piloting 90+, or a fleet (flag) | Piloting |

A trip that meets a blockade is refused with every approach, open or not, and what the closed ones need. Code adds the open ones as choices; typed words reach them through the intent's `blockade` field. An approach that is not open rolls nothing and takes no time.

**Forcing through needs an ace pilot by design:** Piloting 90, to outfly the pursuers and not be hit. A specialised stealth ship will lower that requirement once ships are built. Sneaking, papers and a fleet stay closed until ships, items and command are built.

## 3. Where it is safe to land

The distance is the larger of patrol and sensor coverage. It is never sent to the narrator or the player who does not know it.
- **Trained** (a start option, or the flag): a general range by level that never expires.
- **Observed:** 72 counted hours of watching from inside the strip (`observe`) give the exact figure for that blockade; after 21 days it blurs, after 42 it is gone.
- **Neither:** the landing is offered as a guess.
- **The Force:** danger sense (Force Sense 20+) can ease a clear or bad failure by one step on an approach by stealth or the trek. It never knows where to land.

Landing outside makes the way around much easier; inside, harder. For someone who knows, it is the safest way around.

## 4. The trek, and the way out

The trek takes days. Each leg meets the land (Endurance or Tracking), and patrols inside their own coverage (Stealth). A slip costs a day; a bad one is a capture. A ship left outside may be found, likelier with each day.

Getting out uses the same approaches against the blockade as it is then. A ship left outside means walking back to it first.

## 5. When it fails

A failure takes a step on the blockade's own ladder: narrow, clear or bad; one step further when it was forced, one step milder at a trade blockade. Boarding carries a fine; being fired on is a crash hazard and a damaged ship.

**A capture** (D-470) goes through the fight's captor rules: the blockaders' own kind holds the character (named to the narrator and checked in the narration as after a fight), a dying prisoner is stabilized unless that kind takes captives to kill them. Taken aboard, the ship is impounded and its cargo seized (a ledger line); taken on foot, the ship stays outside. A prisoner makes no trip. The narrator ends it with `captivityEnded` (released, escaped, rescued, ransomed, exchanged; with the ship or not), offered only to a prisoner the engine recorded and refused on the turn of the capture; at most 14 days otherwise. Without the ship, trips are by civilian transport (Class 3) and no approach that needs one's own ship is open.

Waits for the ships build: where an impounded ship is held, getting it back, its damage and repair, cargo and its value, and the prisoner's gear (items).

A caught ship sharpens the line for two weeks. A ship turned back or boarded can try one thing more at once, harder (a failed bluff becomes a run).

Costs and fines go to a ledger until the economy is built. A run's fame is recorded with whether it was witnessed, until renown is built.

## 6. The save

World slice v4: `blockades` {runs, watched, heat, pending, shipOutside, ledger, captive, impounded, shipDamagedDay}. A v3 save's "talk" runs become "undercover".
