# M8 world events, Phase A: the tag network's engine (2026-11-23; D-466)

Phase A of checklist items 1, 8 and 4. The engine is built and tested on a made-up fixture. **The game plays the same as
before**, because no era data ships until Phase B. No checklist item is ticked. The spec is `docs-v2/spec/world-events.md`.

- **Starting point:** commit `650e47e`, plus `16bb004` (see section 5). The tag for this phase is `m8-world-a`.
- **Checks:** `test:all` 1,446 of 1,446 in 851 s (1,403 before, 43 new). `npm test` 1,397 of 1,397 in 20 s. Typecheck and lint clean; the production build works.

## 1. What was built

| Asked for | Built |
|---|---|
| Event schema | Types, a Zod schema and cross-reference checks that a network must pass before it ships. Years BBY or ABY, circa dates, multi-day events |
| Breaking tags | Only recorded facts, rolled player actions and won fights. The narrator has no event that breaks a tag, moves control or sets a tested flag |
| Scheduler | Runs in the world's time hook: events start and settle as play crosses their dates, producers before consumers |
| The ripple | Substituted, adjusted, altered, cancelled. Broken inputs carry the divergence on |
| Freeze | Control, leader and seat rows can name the outcomes that start and end them. The links themselves are Phase B data |
| Plot points | A tracker, and scored alternatives. One is chosen, once |
| Convergence | Events with untouched crucial tags still fire, marked adjusted. Broken tags and outcomes never come back |
| Narrator hand-off | A news line (with a heading per item, told once) and a standing list of changed history. Nothing future, and no tag that still holds |
| Save | World slice v2, with a migration from v1 |

The requested tests all exist: substitution, divergence, a two-step ripple, the freeze, convergence, and no alternative
before its tracker condition. Others cover guards, the hand-off, saves, and a montage stopped by an event in a real turn.

## 2. Guards: the proposal (every number `invented`)

A condition collects points until it reaches its guard. A player's roll is compared with the guard's DC. It is the roll
the scene already made, so nothing is rolled twice. Only one action counts per condition per day.

| Guard | DC | Points | Meaning |
|---|---|---|---|
| low | 15 | 1 | one good roll, or any one recorded fact |
| medium | 17 | 3 | several successes on different days, or one major fact or won fight |
| high | 19 | 6 | foreknowledge first, then repeated successes, or one decisive fact |

An exceptional success scores 3, a strong or decisive one 2, a narrow or clear one 1, and a bad failure -1. Recorded facts
and won fights score 1 (minor), 3 (major) or 6 (decisive).

**Counted attempts needed if the player relies on rolls alone** (simulated, 4,000 runs per cell: median, then the 90th
percentile). "High" excludes the foreknowledge step.

| Skill level | Low | Medium | High |
|---|---|---|---|
| 20 | 2 (5) | 12 (34) | 147 (400 or more) |
| 40 | 2 (4) | 8 (20) | 40 (112) |
| 60 | 1 (3) | 5 (11) | 20 (44) |
| 80 | 1 (2) | 4 (7) | 12 (21) |
| 100 | 1 (2) | 3 (5) | 7 (12) |

## 3. Questions for Jared

1. **Guards.** Are these sizes right? A medium guard takes a level-40 character about 8 attempts by rolls alone.
2. **Captures.** Only a capture the engine recorded breaks a role. A figure the narrator reports as captured, turned or
   removed does not. Keep it that strict?
3. **When a divergence is decided.** On the event's date, not when the tag breaks. A broken plan is told at once, but the
   Treaty (for example) is only lost when its date comes. Agreed?
4. **Year-only dates.** They fall on the first day of their year, as the control table reads them. For the 3661 and 3653
   chains that would put every event on the same day, with no time to act in between. Proposal for Phase B: give those
   chains months, marked `invented`.
5. **Stand-ins.** Same side and role, the same title first, then the nearest age. The player's own acquaintances come
   after canon figures. Agreed?
6. **Foreknowledge by a roll.** One success against a medium guard's DC. Enough for a high guard?
7. **How a lost role shows.** A dead crucial figure is not announced as a broken tag, since that would give the future
   away. The narrator hears of it when the event's date comes. Agreed?

## 4. What Phase B needs to settle in the tag map

Found while fitting the 3661–3640 map to the schema:
- **E.3651.tython** consumes O.grand_master_vacant, but section 5 calls it a convergence anchor. It only converges if that
  input is optional, with O.grand_master_set depending on it.
- **O.malgus_alive** is produced only by the Temple strike. If the strike never happens, Malgus would lose his later story
  while alive, against the PP-1 ruling. Proposal: drop the outcome and make Malgus himself the crucial role in the Maelstrom
  and Ilum.
- **Deaths on record.** The canon roster still takes figures off the board at their recorded death year (Zym in 3653), even
  when the event that kills them diverges. Proposal: freeze deaths with the same links.
- **Conditions without a test.** The map names conditions and guards but not which actions or facts break them. I will
  draft the tests in Phase B, tagged as design calls.
- **Flags.** `sceneOutcome:<id>` is registered for scene outcomes, engine only, but nothing sets one yet.

## 5. Notes

- **Not counted as actions:** mind contests (Force persuasion on a person) and fights that end without a win.
- **Not seen:** a canon figure who was never linked to the roster, such as a story NPC with a similar name.
- **Commit `16bb004`** holds the two birth-year corrections (Darth Acina, Exal Kressh; D-465 follow-up) that were already in
  the working tree uncommitted. They are separate from this phase.
- **`docs-v2/spec/world-event-tags-3640-1000BBY-draft.md`** appeared in the working tree during this run. It is not mine, so
  it is left uncommitted and unread beyond its header.
- **Spec 14:** the Legacy Change framework, its priority tags, galaxyEventQueue, legacyChanges and lineageRecord are recorded
  there as superseded. The faction seeds are not.
- **Cost:** about 17 ms per 1,000 in-game days on the fixture.
