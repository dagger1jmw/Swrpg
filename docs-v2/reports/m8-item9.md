# M8 item 9: era rules for the Cold War years (2026-11-24; D-475)

Built, tested and ticked. Tag: `m8-item9`.

| Check | Result | Runtime |
|---|---|---|
| Era-rule tests (tests/m8/eraRulesColdWar.test.ts) | 22 of 22 | under 3 s |
| test:all | 1,603 of 1,603 | 956 s |
| typecheck, lint | clean | - |

## 1. The rules by period

Each column is a period between your boundaries. "-" means the lore states nothing, so the rule is silent.

| | 3,653 (Treaty) to 3,651 | 3,650–3,648 | 3,647 to mid-3,641 | Late 3,641–3,640 |
|---|---|---|---|---|
| Coruscant, the Treaty and security | under the Treaty; a drained CSF | same | same | - |
| Coruscant underworld | Guild, gangs, Black Sun, Justicars | same | same | - |
| Coruscant places | strict rule, new list | same | same | same |
| Coruscant Temple | a ruin, nothing rebuilt | shelved; a Senate delegation and guardians | same | shelved |
| Nar Shaddaa | Cold War districts; the SIS bureau | Cold War districts; Shadow Town from 3,649 | adds the Shadow Syndicate from 3,643 | - |
| Tatooine | not Hutt-ruled; Mos Ila, Anchorhead | same | same | not Hutt-ruled |
| Jedi life | homeless | building on Tython; training; the Forge | the Tython Temple; training; the Forge to 3,643 | the Tython Temple |
| Korriban | academy rule; Cold War rule | same | academy rule to 3,644; acolytes from 3,643; Cold War rule | - |

- **Korriban's end:** now 3,644, matching the staff placements. Its line about Harkun and Zash became a separate rule ending in 3,656, because the roster makes Harkun an Overseer from 3,655 (estimate). From 3,643 a second rule carries the warblade and the staff colours, which are on record for c. 3,643.
- **Extended:** Tatooine not Hutt-ruled (to 3,640). **Replaced at the Treaty:** Coruscant security and places, Nar Shaddaa districts, Mos Ila, Jedi life.
- **Checklist:** items 13 (ships and space combat) and 14 (ground command) added, unticked.

## 2. One code change

A year alone cannot tell early from late 3,641, so a rule may now start or end on a day (`fromDate`, `toDate` in src/data/eraRules.ts), and one line of src/turn/context.ts passes the day. Nothing in src/engine changed. The two dates are the world network's: 23 June 3,653 (the day is invented) and 15 June 3,641 (the lore says mid-3,641).

## 3. Gaps

All listed in docs-v2/lore/RESEARCH_QUEUE.md ("Era rules for the Cold War"). The main ones: Coruscant, Nar Shaddaa, Korriban and Jedi training after the Treaty collapses; where Padawans train while the Order is homeless; Cold War Jedi dress; when Mos Ila changes hands; when Black Sun, the Justicars and Shadow Town begin.

## 4. Questions for you

1. **Should era rules follow the campaign?** They read the lore's dates. If a player averts the Sacking, or the Treaty falls early, the narrator still gets the Cold War rules. The control table already has this link (`dependsOn`, `endsWith`); giving it to era rules is a small code change.
2. **The Temple vote:** the Coruscant Temple file puts the Senate's vote in 3,653, timeline slice Part 2 in 3,650. I used 3,650, your boundary. Keep it?
3. **The Exchange's defeat by the Shadow Syndicate:** you ruled c. 3,643 (D-384), but the world network has it in 3,653 (E.3653.exchange_out). Move the event?
4. **The Order's home, 3,653–3,651:** the seat table has Jedi living in the ruined Temple; the new rule says they have left it and have no home. Which should the seat table say?
5. **Hutt control:** the control table stops at 3,653 for Nar Shaddaa and Nal Hutta, so no one controls them in the Cold War. Extend it?
6. **Jedi dress:** "plain tunics, no braid" is ruled only to 3,653. Extend it to the Cold War?
