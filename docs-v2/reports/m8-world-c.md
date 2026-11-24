# M8 world events, Phase C: running a blockade (2026-11-24; D-468, D-469)

Your answers to `m8-world-b.md` are applied (D-468), and any blockade can now be run (D-469). The Hydian Way blockade is the
first. Checklist item 4 is ticked; its numbers and open questions wait for your rulings.

- **Starting point:** commit `0953134`. The tag for this phase is `m8-world-c`.
- **Checks:** `test:all` 1,523 of 1,523 in 959 s (1,485 in Phase B, 38 new). Typecheck and lint clean; the production build works.

## 1. Your answers, applied

| Answer | Result |
|---|---|
| Leads | An action on a place counts only from a lead recorded in play. In the data, the spec and the data checks |
| Three flare-ups | Quesh, Balmorra and Taris have conditions (section 5). Any four of the seven now delay the collapse |
| Months | 3643, 3642 and 3640, in the rows' order. Karrid's assault is the last to start in 3640 |
| Navy | Waits for ship combat |
| Total defeat | The capital taken, plus three losses. Nothing in play can take a capital yet, so it cannot happen yet |
| Headquarters | Korriban |
| Maps and notes | The 1000 BBY map is committed and loads; R1–R3 still need separate plot point ids. "A fourth level" fixed. Design notes at revision 41 |

## 2. What was built

A trip that meets a blockade lists the approaches: which are open, and what the rest need. The open ones become choices, and
typed words work too. A run rolls its checks, takes its time, and is recorded. The blockade ends with the Battle on the
Hydian Way (15 January 3660). If the story never breaks it, it stands on.

Built from the design notes: the six approaches (going around has two endings), three levels, difficulty by age on a smooth
curve, the knowledge tag (trained and observed), the trek, the ship left outside, getting out, danger sense as a warning
only, and every field each blockade records. The patrol and sensor figures reach the narrator only once the character knows them.

**Odds at the Hydian Way blockade** (4,000 seeded runs each; percent through, with the needs met and the skill shown for
every check):

| Approach | Rating | 20 | 40 | 60 | 80 | 100 |
|---|---|---|---|---|---|---|
| Ride under protection | 15 | 56 | 65 | 76 | 86 | 94 |
| Talk through (with a contact) | 65 | 39 | 49 | 60 | 70 | 81 |
| Smuggle | 85 | 19 | 30 | 40 | 50 | 59 |
| Sneak through | 110 | 10 | 20 | 30 | 39 | 50 |
| Around, slip in close | 92 | 15 | 25 | 34 | 46 | 56 |
| Around, on foot, guessing | 92 | 18 | 31 | 41 | 49 | 62 |
| Around, on foot, trained | 92 | 32 | 50 | 58 | 67 | 85 |
| Around, on foot, watched | 92 | 32 | 50 | 57 | 67 | 85 |
| Force through | 130 | 5 | 10 | 20 | 31 | 40 |

Slipping in close at skill 60: 58% on the first day, 34% after two months, 30% after a year. Force failures are mostly
captures (64% at skill 20, 25% at 100). On foot, 4–7% are captured at skill 60.

## 3. Proposals for your ruling (every number `invented`)

**A. Checks.** As in the table in `docs-v2/spec/blockades.md`, section 2.
- Riding: Charisma. Talking: Charisma or Intelligence, +2 for a contact and +2 for training. Smuggling: the smuggler's own
  skill. Sneaking: the lower of Piloting and Stealth. Around and force: Piloting.
- Alertness and strength add 5 to the rating per point over 3; each point of corruptibility takes 5 off riding, talking and
  smuggling.

**B. What opens each.** A friend (relationship 20+) for papers or codes; any known smuggler takes pay. Training comes from
five start options (Mandalorian blockade, Republic pilot, SIS agent, Imperial officer, Imperial agent). Forcing needs
Piloting 90.

**C. Costs** (credits, into a ledger until the economy is built; × level / 3): riding 2,000, talking 1,500, smuggling 5,000;
boarding fine 1,000. Hours: riding 48, talking 24, smuggling 72, sneaking 12, around 72.

**D. Failure.** Narrow, clear or bad steps along the blockade's ladder: turned back, boarded, fired on (a crash hazard and a
damaged ship), captured. Forcing goes a step further; a trade blockade a step milder. A caught ship sharpens the line for 14
days.

**E. One approach into another.** Turned back: riding can become talking; talking, sneaking and slipping in can become a run;
smuggling can become talking or a run (+10). Boarded: only a run (+20). Once only, on the next turn.

**F. Renown.** Fame for a run that gets through: force 5, sneak 3, around 2, talk and smuggle 1, riding 0; × level / 3, +1 for
a decisive margin. Only forcing counts as witnessed. Recorded, not used.

**G. Knowledge.** Trained range 90–190 km at a military blockade. Watching takes 72 counted hours; exact for 21 days, blurred
to 42. Danger sense needs Force Sense 20.

**H. The trek.** 25 km a day; a terrain check every 3 days; a patrol check per 60 km of their coverage. The ship is found at
1% a day per point of ground patrols.

**I. The Hydian Way blockade itself:** strength 3, alertness 3, patrols 110 km, sensors 60 growing to 160 km, ground patrols
2, corruptibility 1, not a "trained military". It counts as 60 days old on 1 January 3661, because the 3661 start has it
standing and Coruscant already hungry.

## 4. Questions

1. **Are the odds in section 2 about right?** Smuggling and talking were "very hard" and "hard" in the notes.
2. **Should the Mandalorians count as a trained military?** It matters only in a blockade's first days.
3. **Is 60 days the right age for the Hydian blockade at the 3661 start?**
4. **A fact or thread recorded about a place counts as a lead, though being there does not.** The narrator writes those facts.
   Agreed?
5. **Nothing can open sneaking, papers or a fleet yet.** They wait for ships, items and command. Leave them closed until then?
6. **Should a capture at a blockade do more than tell the narrator?** Today it names the captors and nothing else.

## 5. New conditions (design calls)

Each needs the foreknowledge first (a medium step from a lead, or one recorded discovery).

| Event | Guard | Who | Foreknowledge | What breaks it |
|---|---|---|---|---|
| Quesh: the Hutt families' deal | medium | an Imperial agent, a Cartel hand, or a soldier on Quesh | that the families are dealing: Nal Hutta, Nar Shaddaa, Quesh, or Nem'ro | persuading Nem'ro; investigating on Quesh; a serious fight won there against Republic forces |
| Balmorra: the rising | high | an Imperial officer, agent or Sith on Balmorra | that the resistance and the Republic mean to rise: investigating there, or Zenith captured | serious fights won there against the Republic; investigating on Balmorra |
| Taris: the landing | medium | a Republic soldier, Jedi or official on Taris | that the Empire is coming: Dromund Kaas, Taris, or Kilran captured | a serious fight won there against the Empire; persuading Saresh to prepare |

"Who" is how a player gets there; the engine does not check it yet (gap 6 in the Phase B report).

## 6. Found while building

- **The trek was wrong at first:** it made walking in worse than slipping in by ship. Patrols are now met only inside their
  own coverage, and a test holds the order you gave (on foot with knowledge is the safest way around).
- **The 1 and 15 January mismatch is gone:** travel and the control line both follow the event. A trip to Malastare on 14
  January is stopped; on 16 January it is not.
- **Not tested end to end:** the appended choices are tested from the refusal to the expanded intent, but not through a full
  narration call. No live model has been asked to classify blockade words.
- **The design notes** were re-exported by applying revision 41's one changed cell to the revision 40 file.
