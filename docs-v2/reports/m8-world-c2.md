# M8 Phase C follow-up: your answers (2026-11-24; D-470)

- **Starting point:** commit `0597255`. The tag is `m8-world-c2`.
- **Checks:** `test:all` 1,529 of 1,529 in 938 s (1,523 before, 6 new). Typecheck and lint clean; the production build works.

## 1. Please check

- **The PP-5 rework is not in the repo.** `world-event-tags-1000BBY-4ABY-draft.md` on disk (01:46) has Maul's death in 16 BBY
  and the plot-point status line, but PP-5 is still the old text, and the status line says "PP-3 and PP-4 done; PP-5 to PP-8
  next". I committed it as it stands. Please save the reworked version.
- **The design notes are at revision 42, not 43.** Both changes you named are in 42, and that is what I exported. If a 43
  should exist, it has not been saved.

## 2. Done

| Answer | Result |
|---|---|
| Undercover | Renamed everywhere. A test covers saves that still say "talk" |
| Trained military | The Hydian Way instance. No change to the 3661 odds: the blockade is already past its first days |
| 60 days | Kept and recorded as a known stretch |
| Leads | Must be learned in a scene and must not state the secret. The check compares words (60%, `invented`) |
| Closed approaches | Unchanged |
| Captures | Prisoner, ship impounded, cargo seized (section 3) |
| Proposals A–I | Recorded as accepted; the ace-pilot note is in the spec |

## 3. Captures

**Built with what exists:**
- The captors are the blockaders' own kind, named to the narrator and checked in the narration as after a fight.
- A dying prisoner is stabilized, unless that kind takes captives to kill them.
- A prisoner makes no trip.
- The narrator reports the end (`captivityEnded`: released, escaped, rescued, ransomed or exchanged, with the ship or not).
  The engine allows it only for a prisoner it recorded, and not on the turn of the capture. Otherwise it ends after 14 days
  (`invented`).
- Without the ship, trips are by civilian transport (Class 3), and no approach that needs one's own ship is open.
- Taken on foot, the ship stays outside.

**Waits for ships, items or the economy:** where the ship is held and how to get it back, damage and repair, cargo and its
value (the ledger has an empty line for now), the prisoner's gear, and checks for an escape.

**Question:** an escape or rescue is now the narrator's to tell, with only its scene's ordinary checks behind it. Should it
need an engine check of its own?

## 4. The 1000 BBY map

It loads, and its plot points still load. New gaps, from your description of PP-5 (added to the list in `m8-world-b.md`):

12. **A decision that depends on which character is present in a scene** (who is with Anakin when he chooses).
13. **Loyalty per clone unit:** a condition holds or breaks for all clones at once.
14. **A warning race after Sidious escapes:** events cannot compete to come first.
