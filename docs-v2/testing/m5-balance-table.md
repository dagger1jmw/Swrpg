# M5 held balance recommendations (2026-11-20)

Every balance item held for Jared: the nine from the pass-5 handoff (pass 4's flags, numbered as pass 4 numbered
them) and the ten from combat-pass-5.md (issue 17). Nothing in this table has been changed. Recommendation: **bug**
(the engine does something it should not), **tunable** (works as built; a number could move), or **as intended**.

| # | From | Item | What was seen | Recommendation | Why |
|---|---|---|---|---|---|
| 1 | Pass 4 flag 1 | Duel lengths | Gap 0 median 41 exchanges in 8 duels (table: 34); long tails (144, 167) | As intended | D-244's table holds at 10,000 duels; 8 duels is noise |
| 2 | Pass 4 flag 2 | A Knight 12 above lost 4 of 8 | Two losses to mortal wounds at exchanges 2 and 9 | As intended | The table's 60-68% wins gives about 3 losses in 8; one more is noise |
| 3 | Pass 4 flag 3 | 4 Mandalorians with slugthrower rifles on ice | The Knight at 30 won 8 of 8 | As intended | Pass 3's single loss was the dice bug (D-238). A sweep row would settle it if wanted |
| 4 | Pass 4 flag 4 | Cover cancels on a build-up exchange | Both shooters +2: the margin is as without cover | As intended (a card note is UX) | D-243 gives cover to both shooters on a build-up and to the defender on a strike. Suggest a card note "cover on both sides" |
| 5 | Pass 4 flag 5 | The smuggler vs 4 troopers | One fight each way | As intended | One sample each; see row 14 |
| 6 | Pass 4 flag 7 | A cybernetic arm adapts slowly while the wound heals | 3% adapted at 30 days (a leg: 69% at 40) | Tunable | As built (D-230). It is what makes row 13's Knight weak for months; a faster arm curve is one number |
| 7 | Pass 4 flag 8 | A lightsaber graze is "no wound" | "lands squarely against his chest, dealing no physical wound" | As intended | Health §3: a graze is Vitality only. D-271's highlights and the stamina wording now keep the narration plainer |
| 8 | Pass 4 flag 9 | heroicAct against dev "lords" | Set at gaps +12 and +8 | As intended | As decided; dev-made opponents only |
| 9 | Pass 4 flag 10 | Surrender fates | One Sith execution, one bounty-hunter capture | As intended | Unit-tested at 30 surrenders; one sample each |
| 10 | Pass 5 flag 1 | Sith tactical withdrawal | 40 of 58 won duels ended in withdrawal | **Done by D-268** (Jared's rule) | Measured 20.6% of won duels (19.2 / 24.5 / 17.1% at gaps -10 / 0 / +10), inside 20-30%; the old rule 65.4%. To centre it at 25%, the chance 0.30 is the one number (not changed) |
| 11 | Pass 5 flag 2 | A duelist striking to disarm still kills | With a prosthetic weapon arm, 8 torso hits in 10 duels, 4 mortal | As intended until M8 | Disarm puts most hits on the hand and limbs; a prosthetic takes them as Vitality only (D-164), so the torso share rises. Equipment damage (M8) gives those hits an effect. The killing strike after was the fate rule at lethal stakes |
| 12 | Pass 5 flag 3 | Hit locations by intent | Kill: torso 14, head 3 of 22; disarm: hand 2, leg 1, torso 2 | As intended | Small samples, right direction; D-260's unit test has 20,000 hits each |
| 13 | Pass 5 flag 4 | A Knight on two prosthetics loses to duelists 10-12 below | 14 of 43 lost (leg 64%, arm 0% adapted; roll level +3.0 vs +4.2) | Tunable | As built (D-251, D-252, D-255). The arm's slow adaptation (row 6) is most of it |
| 14 | Pass 5 flag 5 | The smuggler won 11 of 12 against 4 line troopers | The sweep row says 67% (flat ground) | Check (likely as intended) | 11 of 12 at p = 0.67 happens about 4% of the time. The pass fought 3,653 BBY line troopers with morale breaks in 3 fights; the sweep fights its own date's troopers. One 300-fight row in 3,653 BBY would settle it |
| 15 | Pass 5 flag 6 | Blaster wounds by margin | Graze 4-8, solid 9-11, clean 12-15, critical 16-24; none mortal | As intended | D-267's band: a non-saber hit is mortal only at margin 30+ |
| 16 | Pass 5 flag 7 | Lightsaber hits "out of order" with the margin | "solid hit" at margin 21 next to "clean hit · severed" at 12 | As intended | Read after the pass: the solid hits at 21 were the smuggler's own bolts deflected back by the Sith; a redirected bolt is capped at solid (engine/duel.ts, the redirect). The card could say "redirected" (UX) |
| 17 | Pass 5 flag 8 | Vong minions | 3 grade-3 warriors took 144-149 exchanges and ten wounds; one at +4.3 fell in 11 | As intended | The grade spread (D-239). 0 XP was the daily cap. With D-270 the named warrior is in the same range |
| 18 | Pass 5 flag 9 | A gap-0 duel ended at exchange 3 | A critical mortal hit on the player's natural 1 | As intended | A lethal duel can end at once; D-244's length table includes these |
| 19 | Pass 5 flag 10 | Vitality full after a stabilized mortal wound | Varek, captured and stabilized: "69 / 69" with a stabilized critical torso wound; a dying Joren showed "0 / 68 (spent)" | **Possible bug** (check) | One sample. The fight was 3 exchanges and one hit, so the Vitality lost may really have been small, but full Vitality next to a mortal wound reads wrong. Worth one unit test of the captured-and-stabilized path before M5 closes |

## Jared's calls (2026-11-20)

Accepted as recommended, with these done:

- **Row 6 (tunable): done, D-273.** ARM_OTHER_SHARE 1: a quality cybernetic arm or hand 48% at day 20, 72% at 30,
  98% at 40, 100% on day 41 (was 3% at 30). The 3%-a-day cap and the rest days bind, so no share brings it under 40.
- **Row 13 (checked after row 6).** Lost to dev duelists 10 below, 200 duels each: a whole Knight 28.0%; leg and arm
  at day 40 38.5% (before 68.5%), at day 60 41.0% (before 71.0%); an arm alone at day 40 27.5%; a leg alone 28.5%. What
  remains is the leg when both limbs are lost (17% adapted at day 40: the arm wound blocks the form drills it adapts
  from). Not changed.
- **Row 14 (check): as intended.** npm run sweep's new row: the smuggler at 30 against 4 line troopers in 3,653 BBY,
  300 fights, flat ground: won 67.3%, wounded 78.0% (the neutral year 67.0% / 71.3%). Pass 5's 11 of 12 was a lucky
  sample.
- **Row 19 (possible bug): not a bug.** Health §3's bypass sends all of a clean saber hit to the wound, so a mortal
  wound can leave Vitality full; stabilizing does not touch Vitality. Spec amended (it was silent), unit test added.
- **Row 4: done, D-274.** The roll card says "cover on both sides: the two bonuses cancel".

## Pass-5 minor issues left as they are, with reasons

- **Issue 14, graze places.** A graze's location is in the block ("HIT (Duelist 1, torso, no wound, stamina only)"), so
  "grazes the duelist's torso" is right. Rell's "burns along their arm and hand" could not be checked against the
  block after the pass; no rule change without a case.
- **Issue 14, "Regaining your footing".** Pass 3 put this exact sentence on the allowed list (narrationCheckPass3
  "ordinary prose"); changing it would reverse that decision.
- **Issue 11, "your stamina holds", "outpaces their guard", "seizes the initiative", "a dozen breathless exchanges".**
  Ordinary prose by earlier decisions: a bare "stamina" noun has no natural swap (D-242), "outpacing your guard" is
  not the card's "is outpaced" (pass 4), and an unnumbered "exchanges" and "initiative" are plain fencing words that
  match the block. The repair's "unable to fight on" after "dropping" stays: clumsy but grammatical, and rare.
- **Issue 15, "dark armor and helm", "the creature".** The block does not say how much of the body the armor covers,
  and the lore files do not either, so there is no ground truth for a rule; calling a Vong a creature is an in-world
  view, not a lore error. The dev-made scenes (a Sith Lord in the Jedi Temple, a Jedi holding a
  Sith in his own citadel) come from `/fight` set-ups.
- **Issue 16, the model picker cut at 820 px, 30 px buttons, "killingStrike" in the engine log.** The picker is a
  native select (it cannot shorten its own text); the turn number is hidden at that width on purpose; the button
  height is left for Jared (D-216); the engine log prints ids by design, and the end card no longer does.
