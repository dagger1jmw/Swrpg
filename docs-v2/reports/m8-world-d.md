# m8-world-d: D-489's rules in the engine (2026-11-24)

Decisions D-490 (your rulings), D-491 (the engine), D-492 (the maps). As built: docs-v2/spec/world-events.md §2.

## What changed

| Part | Result |
|---|---|
| 1. Rulings | Recorded in D-490, with the top-duelist list of each map |
| 2. Engine | Who, the power bar, no premonitions, closed events; the 31 conditions gated; 28 new tests |
| 3. Data | The three maps and the 3,661 rows carry the rulings; the 4–44 ABY draft is committed, unread by anything |

- **Who (A1).** A condition, prerequisite or scene names who the player must be. All 31 conditions have it, except the two only an earlier outcome can break. The data checks now refuse a new one without it.
- **The power bar (A2) is in the fight itself.** If only the network's credit were gated, Malgus could lie dead in the fight and still strike the Temple. Below the bar, a top duelist is never killed, taken or driven to surrender: they break off, and the fight is a stalemate. Over 20 seeds, a swordsman with 99 in the forms and too little Force never wins against Malgus; a Master never wins and sometimes holds; a top-tier player can win.
- **No premonitions (A3, A4).** Force sense never counts as inquiry, lead or deed. Facts and threads from visions are no leads.
- **Closed.** On this map: the Emperor on Voss, the Voice, and killing Revan in the Maelstrom.
- **Mind trick and the Force on a place (A5, A6)** are out of every test.

## What you should know

1. **Eleven posts cannot be held yet.** They come with wartime postings: Republic command, Imperial command, Republic security, Temple security, Republic investigator, the raiders, Imperial agent to the Hutts, Belsavis staff, a Sith household, the Maelstrom team, the Maelstrom jailers. Two conditions need one of them and nothing else fits: the shuttle at the Temple (A16) and Revan freed early (A27). Others are narrower until then.
2. **A hold moves no date.** A Master's fight with Malgus saves people in the Temple (one added condition, so the network has 32). Nothing shifts a day for a minute's fight.
3. **A guarded figure out of reach gets away.** Angral aboard the flagship, Baras and Azamin use the same break-off. The engine does not stop the fight from starting.
4. **Vision leads rest on the narrator's mark and a word list.** A fact worded plainly after a vision, and unmarked, still passes.

## For you

1. **The player's tier.** Is this mapping right? Master: the rank, a Council seat, or every Master skill with the best fighting skill in place of the main specialty. Top: a Master with combat 95, Force Control 90, Willpower 90. A non-Force-user never reaches Master here.
2. **The Emperor, 3,661–3,640.** Your list has the Emperor as a top duelist, so a top-tier player could win. The other maps say beyond any duelist. Both events here are closed, so it only matters for a meeting elsewhere. I'd make it beyond.
3. **Scourge** is on the 5,000–3,662 list, but not on the 3,661 list. Is that meant?
4. **PP-9 alternative 2 after B7.** If the Outlander's ship gets away, the Outlander never stood before Valkorion, so does not carry the spirit. I wrote it that way; it changes what PP-10 starts from.
5. **The proof scenes.** Three are invented: the peace offer's orders, the strike team's orders and Korriban's plans are each carried out by an insider (high).
6. **The prerequisites the report did not name**, in the maps' PP-3 to PP-13 steps and in the encoded rows, are my wording.

## Numbers I invented

| Number | Where |
|---|---|
| Top tier: combat 95, Force Control 90, Willpower 90 | data/duelists.ts |
| A hold counts from 6 exchanges | data/duelists.ts |
| Trust: relationship 40 (as the Knight Trials' master), known 30 days | data/who.ts |
| First years of some duelists: Bane and Kas'im 1,002, Maul 32, Obi-Wan, Anakin and Vader 22, Galen 3, the rest of the last list 100 BBY; Bane's span to 980 | data/duelists.ts |
| The map's edge years: 3,639 and 1,001 | data/duelists.ts |
| The Imperial agent's Mandalorian liaison post ends 3,660 | data/worldPosts.ts |
| End dates: Devaron 12 Mar 3,661; Korriban 21 Aug 3,660; Quesh 10 Feb 3,643; Balmorra 25 Feb 3,642; Taris 25 Apr 3,642; Belsavis 25 Oct 3,641 | data/worldNetwork3661.ts |
| Strengths: a won fight at Devaron and Quesh minor (three needed); a hold against Malgus major; the Senate never turned on the Jedi decisive | data/worldNetwork3661.ts |
| Guards of the three proof scenes: high. Those in the Temple: medium | data/worldNetwork3661.ts |
| Scene years: proofs from 3,655, 3,654 and 3,661 | data/worldNetwork3661.ts |
| Break-off wounds: severe 34, moderate 19, minor 9 (the tops of the existing bands) | engine/powerBar.ts |
| The word list for visions | data/worldNetwork.config.ts |

The guards themselves are your report's. Word lists and gates ("who") are design calls, not lore.

## Tests and runtimes

| Run | Result | Time |
|---|---|---|
| npm test | 1,610 of 1,610 | 22 s |
| npm run test:all | 1,660 of 1,660 | 1,441 s |
| typecheck, lint | clean | |

test:all ran once, on the state of all three parts together. An earlier run was stopped for two lint fixes; its processes kept going beside this one, so the time is longer than usual (about 937 s) and that leftover run ended in errors of its own (a timed-out hook, workers that could not start). No code changed after the run began.
