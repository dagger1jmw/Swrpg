# M5 final check (2026-11-20)

Scope: the 10-call browser check of pass-5 items 1, 2, 4 and 5 (the final handoff in `docs-v2/progress.md`). Nothing
was fixed. Build under test: commit 82c11b9 plus the uncommitted working tree.

How it was run: one new tab at `http://localhost:5173/?dev=1`, closed at the end. Test campaigns only: Rell Tarn
(smuggler, 3,653 BBY, already there from pass 5), Joren Tal (Jedi Guardian Knight, 30, 22 BBY) and Daven Rook (Knight,
30, 26 ABY). The API key was already saved in the browser; it was never read or typed. Model:
`gemini-3.5-flash-lite`. Dev fights were run with `/exchanges 400` (no call), then the chosen ones replayed from
their save with Resolve to end.

**AI calls: 7 answered of the 10 allowed** (usage meter 23 -> 30). No check retry, no 503.

| Call | What |
|---|---|
| 1 | Rell: Resolve to end, the 65-exchange capture fight |
| 2 | Joren: opening |
| 3 | Joren: Resolve to end, a 77-exchange duel won, five natural 1s |
| 4 | Joren: Resolve to end, an 89-exchange duel ending in a Sith withdrawal |
| 5 | Daven: opening (the narrator's Vong) |
| 6 | Daven: the opening's first choice |
| 7 | Daven: Resolve to end |

## Results

| # | Check | Result |
|---|---|---|
| 1 | Sith withdrawal (D-268) | **Pass** |
| 2 | Natural-1 fumbles (D-269) | **Pass** for the misstep with no false alarm; a real slip being caught was **not seen live** (unit tests only) |
| 3 | The narrator's Vong (D-270) | **Pass** |
| 4 | Long fights (D-271) | **Pass** for the arc before the aftermath; the asked length is not met (new issue 1) |

### 1. Sith withdrawal: pass

27 dev duels, `/fight 1 duelist at -10` (duelist 43.6 against 53.6), `/exchanges 400`. 17 won, 10 lost.
**3 of the 17 won duels ended in a withdrawal (18%;** D-268 measured 20.6%, pass 5 had 40 of 58).

| Duel | Withdrawal at | The Sith before it |
|---|---|---|
| 1 | exchange 10 | moderate wound (left hand) at #2, a graze at #9, the track at +5 for Joren twice; withdrew on its own natural 1, margin +13.3 for Joren. Vitality not read (the save had left the last-10 list) |
| 5 | exchange 63 | one wound; Joren winning the last two exchanges. Vitality not read |
| 27 | exchange 89 | 52 / 72 at exchange 88 with a severe head wound; a second severe wound (left leg) at #89, track +5 for Joren, then "withdraws: breaks off the fight and escapes" |

- No unwounded Sith withdrew. The two 2-exchange duels both ended with a severed arm, not a withdrawal.
- Every withdrawal came on an exchange the Sith lost, after at least one wound.
- Duel 27 narrated (call 4): the escape is told ("Battered and unable to maintain the fight, the duelist breaks
  off, leaping backward and retreating hastily from the courtyard to escape").
- Not run: `/archetype bountyHunter` on a Sith (not in this check's list).

### 2. Fumbles: pass, with one part not seen live

- Capture fight (call 1): the block has "Line trooper 1 makes a mistake (fumble): an opening for Rell Tarn; tell
  it as a misstep, a stumble or an overextension". Prose: "Line trooper 1 overextends in a clumsy misstep". No slip
  flag, no retry.
- 77-exchange duel (call 3): five natural 1s on the cards (three by the duelist, two by Joren), five fumble lines
  in the block. Prose: "A misstep by your opponent leaves a momentary opening", "The duelist overextends in a
  desperate lunge". No slip flag, no retry. Joren's own two fumbles were not told.
- Withdrawal duel (call 4): "stumbling slightly in their footing" and "Another misstep" by the duelist, no slip flag.
- In all 7 calls the narration check fired only on engine terms (reworded in code, no retry call).
- **A real slip still caught: not observed.** The narrator invented no slip in these 7 calls, so the check had
  nothing to catch. Evidence is the unit tests only: `tests/turn/combatPass5.test.ts`, 20 of 20 passed (a slip on
  the ground with a natural 1 in the passage, the other fighter's misstep, and the pass-5 words with no natural 1
  all still give `slipNoHazard`).

### 3. The narrator's Vong: pass

- Panel after the opening's choice: Yuuzhan Vong Warrior 61 / 61, amphistaff, "vonduun crab armor (resists
  lightsabers)", lethal.
- Roll card #1: "Yuuzhan Vong Warrior: d20 9 +4.1 level" (pass 5: +0.4).
- The opening's choice ("Ignite your lightsaber and assume a Soresu defensive stance") was understood and ran one
  exchange.
- Resolve to end (call 7): 14 more exchanges, won (the Vong's right leg severed at #15, Daven took a severe torso
  wound at #7). Both are in the prose, in order, to the end. Engine log: **"combat XP 6.54 (lethal, won)"**.
- The fight block has "Outside the Force: Yuuzhan Vong Warrior. No Force push, choke, lightning or mind trick can
  touch them". The opening still offers a push (new issue 2).

### 4. Long fights: pass on the arc, short on length

- Capture, 65 exchanges (call 1). Block: Highlights (#8 to #60 hits, "#13 Line trooper 1 stuns Rell Tarn", "#49
  Rell Tarn shoots down Line trooper 1", "#65 Rell Tarn is Spent and subdued: taken captive") and "Length: about 4
  paragraphs for these 65 exchanges". Prose: the firefight, the wounds on trooper 1 (torso, arm, hand, leg, as on
  the cards), the stun bolts with no body part, trooper 1 down by the right leg, then "Overborne and spent, you
  are subdued", then the binders. The fight comes before the capture.
- Duel won, 77 exchanges (call 3). Highlights: "#27 the turning point", "#77 ... right arm, severed". Prose tells
  the long even stretch, the turn, the two grazes and the severed arm, then the quiet courtyard.
- Withdrawal, 89 exchanges (call 4): Joren's two severe wounds, the turn, the duelist's two severe wounds, the
  escape, in order.

## New issues

| # | Severity | Issue |
|---|---|---|
| 1 | minor | The Length line is not followed: "about 4 paragraphs" was asked three times and one paragraph came back each time (about 1,000, 1,350 and 2,600 characters for 65, 77 and 89 exchanges). The arc is there, compressed |
| 2 | minor | The Vong opening still offers "Sidestep the charge and use the Force to push him off balance". The fight is deferred to the next turn (D-29), so the opening's block has no "Outside the Force" line (pass-5 minor 12, still there) |
| 3 | minor | "stamina" in the prose of 2 of the 4 fight narrations ("draining your remaining stamina", "rattles your stamina"); the block itself says "no wound, stamina only". Also "outpace" once. The check did not flag these words |
| 4 | minor | The engine-term reword in code repeats itself: "grievous" three times in one paragraph (call 4), "unable to stand, left unable to fight on" (call 7) |
| 5 | minor (balance, for Jared) | Duel 27: the Sith withdrew while Joren was at 1 / 61 Vitality with two severe wounds. The rule looks only at the Sith's state; one more hit would have won it the duel |
| 6 | minor (dev) | `/heal` leaves lost limbs, so the handoff's loop (`/heal`, `/fatigue physical 0`) carried a lost arm and leg at 0% adapted through the later duels; most of the 10 losses are from that, not from balance. The loop should use `/heal all` |
| 7 | minor (UX) | The withdrawal's card still reads oddly: "#10 exchange · Joren Tal gains ground · track +0 → +0" on a margin of +13.3 (pass-5 minor 9) |
| 8 | nit | Highlights grammar: "from here on only Joren Tal land anything". Prose: "steel and light meet" for two lightsabers |

No major issue found.
