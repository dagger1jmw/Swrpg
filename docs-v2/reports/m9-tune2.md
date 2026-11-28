# m9-tune2: the front pace, combat XP without daily limits, long duels, fighting tired (2026-11-27)

Jared's brief of 27 Nov ~5 p.m. (his review of reports/m9-tune.md) and its addendum of ~5:45 p.m. (on the interim findings). Decisions D-566 to D-573. Specs: combat-xp.md (sections 1, 1a, 2, 5, 6, 7), missions.md (sections 4a, 6, 6a, 12, 13), rolls.md (sparring sessions), ranks.md (section 3a).

**Every number not from lore or Jared is invented.** Section H lists them all.

## Summary

- **The front pace W is tuned.** A full Jedi war career now lands on the closed form with its war years (section A):

  | Life (main) | W | At 35: after / target | At 41: after / target |
  | --- | --- | --- | --- |
  | Guardian (highest form) | **2.75** | 64.3 / 64.3 | 70.5 / 70.6 |
  | Sentinel (highest form) | **2.15** | 62.9 / 62.7 | 68.7 / 68.7 |
  | Consular (Force Knowledge) | **1.9** | 51.8 / 51.6 | 64.9 / 64.6 |

  - W came out higher than m9-tune's 1.9-2.2 estimate for the Guardian. Items 7 and 8 closed none of the gap: with the base lowered they widened it by about 0.8 levels.
  - The Sith take their Jedi counterpart's W. The Warrior lands 1.0 level under its target at 41; the Inquisitor 2.5 under at 35 and 3.8 under at 41 (section A3).
- **Peace is untouched.** The missions-off curve is within 0.1 level of m9-tune's everywhere. The Jedi at 25 (Padawans in peace) are within 0.3 of it.
- **No daily combat XP limits (item 8).** With the cap gone the combat shares overshot, so the base is now **0.16** (was 0.25). Anakin's war share also needed a fight-count retune after the addendum (section D).
- **Long duels (item 7)** pay more per opponent (addendum 1). Only 3-5% of a Jedi's runs against one opponent pass 10 exchanges; the soldier's 27% (section E).
- **Fighting tired (addendum 3) is built:** the rested gap, good form, Willpower under strain, spars as training, and push through. It is measured over 1,000 runs per case (section C).
- **The body check (item 8):**
  - Strain rises with every exchange and recovers with rest.
  - Strain worsens fighting.
  - Training-saber spars could not injure. They now can, mildly (addendum 2).
  - A real bug was found and fixed: a spar went on after a collapse.
- **Items 3, 4 and 4 of the addendum:** the military starts have service records. A Sith serves the era's Sith power by date, with the Brotherhood's own fronts. So the soldier and both Sith lives now fight their war.
- **Item 5:** the duty player withdraws when hurt and losing. It barely changes missions cut short or days wounded (section F).
- **test:all: one real failure.** Luke's body peak (Endurance at 75, not by 68) moved on a flat curve because of the no-cap rule. Reported with a proposal; the gate is not changed (Not done).

## A. The life-gap tables (20 seeds, all six lives)

Main specialty, means at 25 / 30 / 35 / 41.
- **off:** missions off.
- **m9-tune:** that milestone's "after".
- **A:** items 7 and 8 with the addendum's combat rules, missions on, without items 3-5 (a worktree at HEAD with those rules only).
- **B:** everything, W = 1.
- **after:** everything, the final W.

| Life (main) | off | m9-tune | A (items 7+8) | B (all, W = 1) | **after** (range at 41) |
| --- | --- | --- | --- | --- | --- |
| Guardian | 49.2 / 55.4 / 61.2 / 67.6 | 49.8 / 54.5 / 57.8 / 63.5 | 49.5 / 54.0 / 57.0 / 62.7 | 49.4 / 53.8 / 57.0 / 62.7 | 49.4 / 57.7 / **64.3 / 70.5** (68.8-72.9) |
| Consular | 18.0 / 35.5 / 48.6 / 61.6 | 17.7 / 31.5 / 41.2 / 54.1 | 17.7 / 31.6 / 41.1 / 53.8 | 17.7 / 31.7 / 41.1 / 53.8 | 17.7 / 37.6 / **51.8 / 64.9** (63.2-67.4) |
| Sentinel | 48.5 / 54.4 / 59.7 / 65.9 | 48.7 / 54.0 / 57.7 / 63.3 | 48.4 / 53.3 / 57.0 / 62.5 | 48.4 / 53.2 / 56.7 / 62.2 | 48.4 / 56.3 / **62.9 / 68.7** (67.8-69.7) |
| Sith Warrior | 46.1 / 52.1 / 57.5 / 63.9 | 46.9 / 52.8 / 58.2 / 64.5 | 46.5 / 52.4 / 57.8 / 64.1 | 46.4 / 52.3 / 55.5 / 58.8 | 46.4 / 52.3 / **59.4 / 65.9** (64.9-67.9) |
| Sith Inquisitor | 36.4 / 48.0 / 57.4 / 67.6 | 35.2 / 46.5 / 55.5 / 65.3 | 35.2 / 46.5 / 55.5 / 65.3 | 35.1 / 46.4 / 52.3 / 58.4 | 35.1 / 46.4 / **56.3 / 65.8** (64.5-67.7) |
| soldier (Blaster) | 31.9 / 42.1 / 50.4 / 59.0 | 33.1 / 44.0 / 52.9 / 62.7 | 35.1 / 45.3 / 54.1 / 65.6 | 33.0 / 43.5 / 51.8 / 59.7 | 33.0 / 43.5 / **51.8 / 59.7** (58.7-60.5) |

### A1. Peace and war

- **Peace:**
  - The Jedi at 25 are Padawans in peace: Guardian 49.4 against 49.2 off, Consular 17.7 against 18.0, Sentinel 48.4 against 48.5. That is within 0.3, so W touches no peace year.
  - The missions-off curve moved by no more than 0.1 level against m9-tune's at any age (duty is off there, and the harness's own fights carry the new rules). So the combat changes do not move the missions-off curve.
- **War (1,010-1,000 BBY):**
  - The Jedi are posted from 26 to 36: Guardian 2,238 days, Sentinel 2,542, Consular 2,841.
  - The Sith from 30 to 40 (item 4): Warrior 2,058 days, Inquisitor 2,610.
  - The soldier is posted at 39 (item 3): 662 days.

### A2. Items 7 and 8 on their own, before W

The war gap at 35 against the closed form with war years (Guardian 64.3, Sentinel 62.7, Consular 51.6):

| Life | m9-tune | A (items 7 and 8 with the addendum's rules) |
| --- | --- | --- |
| Guardian | -6.5 | -7.3 |
| Sentinel | -5.0 | -5.7 |
| Consular | -10.4 | -10.5 |

- **They close none of the gap.** Removing the cap freed little: a mission fight against era minions teaches a veteran almost nothing (m9-tune B). The base fell from 0.25 to 0.16 to hold the combat shares. Per opponent, almost no fight runs long (E).
- The soldier gains 2.9 levels at 41 (62.7 -> 65.6): blaster fights run long and close (E). That was before item 3 posted it.

### A3. W per specialty, and the Sith

| Life | W | Rounds (20 seeds) |
| --- | --- | --- |
| Guardian | 2.75 | 2.1 gave 61.7 / 67.8; 2.75 gave 64.3 / 70.5 |
| Sentinel | 2.15 | 1.9 gave 61.5 / 67.4; 2.15 gave 62.9 / 68.7 |
| Consular | 1.9 | 1.8 gave 50.3 / 63.8 (the first round missed Force Knowledge, below); 1.9 gave 51.8 / 64.9 |
| Sith Warrior | 2.75 (the Guardian's) | 59.4 / 65.9 against its closed form with war years 59.5 / 66.9 (5 war years by 35, 10 by 41) |
| Sith Inquisitor | 1.9 (the Consular's) | 56.3 / 65.8 against 58.8 / 69.6 (half war years: 2.5 / 5) |

- **Found in tuning:** Force Knowledge is a knowledge-category skill, not a Force skill. So the first W covered only the forms and the Force category, and the Consular's main did not move at all (41.0 / 54.1 at W 1.8).
  - The front pace now covers the forms, the Force skills and powers, and Force Knowledge. Your target for the Consular is on Force Knowledge.
- **For you (the Sith):** the brief said "W from 1 applies to them", so they use their counterpart's value.
  - The Warrior is on target at 35 and 1.0 short at 41.
  - The Inquisitor is 2.5 / 3.8 short. Its main (Force Output) is studied, and its war years cost study more than the Consular's: it was 7 levels down at W 1.
  - **Proposal:** a W of their own (about 2.3 for the Inquisitor by the same arithmetic). Not done: the brief tunes W per Jedi specialty.
- **The soldier** has no form or Force main, so W doesn't apply.
  - War years: 0 at 35, 2 at 41.
  - Blaster: 51.8 at 35, 59.7 at 41.
  - Closed form with those war years: 51.1 / 60.7.
  - Missions off: 50.4 / 59.0.
  - Missions on before item 3: 54.1 / 65.6. Posting it at 39 cost it the long blaster fights of a home-based career.

## B. Item 1 as built

- `FRONT_PACE` (progression.config) sets W by archetype. `selectFrontPace` applies it while duty holds a posting in a total war, the character has arrived at the base, and is not on leave.
  - Not on the trip out, not on leave, not a visit to a war zone, not in peace or a limited war.
- W multiplies M for the forms, the Force skills and powers, and Force Knowledge.
  - It applies past the 2.8 cap and past the per-hour 4.0x ceiling, like the accelerated path (D-418). Otherwise the ceiling would have discarded part of it.
  - So it covers every source: the routine at the forward base, field practice, fights, stage rolls.
- Tests (tests/m9/tune2.test.ts) cover posted and arrived (W), not yet arrived (1), and on leave (1).

## C. Fighting tired, and the body check (item 8, addendum 2 and 3)

### C1. Does the body limit fighting?

- **(a) Strain rises with every exchange, spars included, and recovers with rest: yes.**
  - Each exchange adds 0.08 physical load (times the form's stamina).
  - The duel's meters reach health (`healthSynced`) and start the next fight.
  - Rest recovers 0.75 an hour; 7 h of sleep resets it.
  - A Knight (Endurance 50, capacity 5) reaches capacity in about two 34-exchange spar sessions.
- **(b) Strain worsens fighting: yes.**
  - The fatigue factor on the effective level is 0.825 at capacity, falling to 0.4 at the hard limit (4x capacity), where the fighter collapses.
  - It lowers the chance to win, so more losses and more wounds.
  - Found: the XP gap was read from the fatigued level, so being tired made the opponent look stronger and paid more. Fixed by addendum 3a: the gap is now read from rested levels.
- **(c) Every duel carries an injury chance: was missing for training-saber spars.**
  - They did Vitality only: no wound was possible, outside a terrain hazard.
  - Built (addendum 2): a landed training-saber hit leaves a minor injury (a welt, a light burn, a bruise, a sprain from a fall). The chance is 0.5% at rest, 3% at capacity and 10% at the hard limit, linear between. Never worse than minor.
  - Controlled live-blade spars already had the accident rule (a natural 1 with a margin of 16+).
- **A real bug found (D-208):** a spar session went on after a side collapsed from exhaustion.
  - `afterBout` ended a session on injury or Spent, never on a collapse. So the collapsed fighter began the next bout and kept earning XP to the 34th exchange.
  - A collapse now ends the session.

### C2. The rules (addendum 3)

- **3a.** The gap is read from both sides' rested effective levels.
- **3b. Strain already gave Willpower, in training only:**
  - `FATIGUE_WILLPOWER`: 1.5 XP an hour x g(f) from f 0.6, at most 3 XP a day. Fights gave none. The training rule is left as it was.
  - Added for fights: an exchange at strain 0.6+ teaches Willpower 0.02 x g(strain) x challenge x M. That is about 1 XP a 34-exchange fight at capacity.
- **3c. Good form:** a natural d20 of 14+ under strain pays the exchange's skill XP x (1 + strain / 4), up to x2.0 at the hard limit.
  - Low rolls get nothing extra in a live fight.
  - Tried x3.0 while tuning the shares: no clear effect inside the noise. Kept x2.0.
- **3d. A spar is a training session:** a low roll pays the training efficiency e(strain) (0.3 at capacity, 0.1 past it). Good form still earns 3c. This amends D-55 for spars.
- **3e. Push through:**
  - A setting in any fight or spar, like the stance: the duel panel's "Push through" toggle, `pushSet`, and a line on the narrator's COMBAT context.
  - x2 strain per exchange.
  - The good-form threshold is 14 - Willpower / 25, never below 10.
  - Endurance 0.05 x challenge x M on each good-form exchange.
  - The duty player never pushes.

### C3. Measured (1,000 runs each; tests/measure/tiredFight.measure.ts; 16 s)

A Knight with Soresu 60, Willpower 50 and Endurance 50. The live fight is a lethal duel against a Sith duelist of the same level who fights to kill. The spar is a training-saber session with a peer of the same level. XP at M 1.0. "Mortal" is a Dying wound (the harness stabilizes; nobody died outright in these fights).

| Case | Form XP | Willpower XP | Endurance XP | Exchanges | To the hard limit | Injury (worst): none / minor / severe / critical / mortal | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Live, at rest | 19.32 | 0.14 | 0 | 37.8 | never | 27.0 / 0 / 28.6 / 1.8 / 42.6% | 0% |
| Live, moderate (strain 1.0) | 18.61 | 1.01 | 0 | 33.3 | never | 17.3 / 0.4 / 26.4 / 2.7 / 53.2% | 0% |
| Live, near the hard limit (3.8) | 6.62 | 0.38 | 0 | 12.4 | 17.0 (47.6% collapse) | 26.9 / 0.1 / 32.9 / 0 / 40.1% | 0% |
| Live, pushing from rest | 20.26 | 0.40 | 0.84 | 36.9 | 168 (0.3%) | 26.7 / 0 / 25.2 / 2.1 / 46.0% | 0% |
| Spar, at rest | 2.55 | 0 | 0 | 34 | never | 98.7 / 1.3% | - |
| Spar, moderate | 1.30 | 1.01 | 0 | 34 | never | 92.3 / 7.7% | - |
| Spar, near the hard limit | 1.27 | 0.51 | 0 | 17 | 17 (100% collapse) | 84.3 / 15.7% | - |
| Spar, pushing from rest | 2.44 | 0.07 | 0.76 | 34 | never | 97.2 / 2.8% | - |

**Readings:**
- **Live:** a tired fighter in good form earns more per exchange, but the fight is shorter and more likely lost and deadly.
  - At moderate strain: Dying states 42.6% -> 53.2% for the same fight, and about the same XP.
  - Near the limit, half collapse.
- **Pushing from rest:** +5% form XP and 0.84 Endurance in a duel; Endurance 0.76 in a spar.
  - It rarely reaches the limit in one fight (doubled strain is about 1.1 capacity over 37 exchanges). It burns out over a day's fights, not one.
- **Tired sparring** pays half (1.30 against 2.55): sloppy low rolls at e(1.0) = 0.3, good form x1.25. Willpower about 1 XP a session.
- **The death rate in a fight is 0%:** the lethal risk is the Dying state (40-53%), and whoever finds the character decides it.

## D. The combat shares and the base (combat-xp.md section 5)

Fixed seed (test:all's lifetime tests), war-year means:

| Step | Anakin (25-35%) | Obi-Wan (20-30%) | Peace under 10% |
| --- | --- | --- | --- |
| Base 0.25, no cap | **36.3%** (32.3 / 39.9 / 36.5) | **38.4%** (37.5 / 41.7 / 36.0) | yes |
| Base 0.16 | 27.5% | 28.6% | yes |
| Base 0.16 + addendum | **23.1%** | 27.9% | yes |

- **Why the base is 0.16:** with no cap, combat XP scales with the base. Both shares fit only for a base factor between about 0.59 and 0.69, so 0.25 -> **0.16**.
- **The addendum dropped Anakin's share.** His war XP comes mostly from B1 groups of ten (80 a year at gap -30), and per-opponent runs (addendum 1) stopped those ramping. The rested gap (3a) also lowered his tired fights.
  - On the base alone, the two windows met only near 0.177, inside the single-seed noise. At 0.17 and 0.175, Anakin's share moved by 1-2 points either way.
  - So the lever is Anakin-only, as D-244 and D-264 did: fight counts in his profile.
    - Clone Wars elite squads (gap -10): 8 -> 16 a war year.
    - B1 groups: 80 -> 100.
  - Measured on 20 seeds (`SPREAD_ONLY=anakin,obiwan npm run spread`):
    - Anakin median **29.8%** (27.8-32.5%), 20 of 20 seeds pass every gate.
    - Obi-Wan median **26.8%** (23.7-30.3%), 19 of 20.
  - Before the elite retune (B1 100 only): Anakin 24.8%, 8 of 20.
- **Canon anchors:** test:all's anchor tests pass (section G). Canon NPCs carry fixed sheets, and the closed form changed in nothing.

## E. How often a run against one opponent passes 10 exchanges (item 7, addendum 1)

| Where | Runs a life | Past 10 exchanges | Exchanges ramped |
| --- | --- | --- | --- |
| Harness fights and spars, missions off (Jedi and Sith) | 102-104 | 3.7-4.5% | 11-15 |
| Duty's fights, missions on (Jedi) | 1,631-2,052 | 3.1-4.3% | 137-287 |
| Duty's fights (Sith) | 1,551-1,774 | 3.7-4.7% | 170-272 |
| Duty's fights (soldier) | 1,087 | **27.1%** | 1,684 |
| `npm run missions`, war cells | 537-2,425 fights a cell | 1-3% | - |
| `npm run missions`, peace cells | - | about 1% | - |

- **Before addendum 1** (the whole fight counted, a 1-seed look): 282 of the soldier's 356 fights ran past 10 exchanges.
- **The soldier's runs stay long against one target:** blaster exchanges at range miss and the track stays close. The ramp pays it there.

## F. The withdrawal (item 5)

The game offers Disengage in every live fight, mission fights included: the duel panel's tactic, a contest of Agility against the opponent's skill, -1 a step behind on the track. The duty player now fights beat by beat and disengages at a moderate or worse wound with the track at -2 or lower.

| Life (missions on) | Cut short: before (A) -> after (B) | Days wounded: before -> after | Withdrawals tried / got away a life (B) |
| --- | --- | --- | --- |
| Guardian | 72 -> 74 | 1,699 -> 1,698 | 140 / 56 |
| Consular | 64 -> 63 | 1,060 -> 984 | 120 / 49 |
| Sentinel | 67 -> 68 | 1,283 -> 1,301 | 122 / 50 |

- **It hardly changes either.** The rule fires only once a moderate wound is taken, and that wound already cuts the mission short (missions.md section 8). Getting away spares a worse wound, not the cut.
- The Sith and the soldier now fight a war, so their before and after aren't comparable:
  - Sith Warrior: 77 cut short, 1,993 days wounded.
  - Inquisitor: 71 cut short, 1,339 days wounded.
  - soldier: 67 cut short, 526 days wounded.
- **For you:** a Sith Warrior at war spends about 2,000 days of its life wounded. The duty player fights everything to a moderate wound. A withdrawal at the track alone, or before a wound, would be the lever, if you want one.

## G. Checks

| Run | Result | Time |
| --- | --- | --- |
| npm test | 2,256 of 2,256, 185 files | 44 s |
| typecheck | clean | 13 s |
| lint | clean | 12 s |
| test:all (lifetime included) | 2,315 of 2,318: **Luke's body-peak gate fails** (below); two 5 s timeouts under load (formTransfer, the m8 holds test), both pass alone (32 of 32) | 2,359 s (39.3 min, beside the final lifegap) |
| Shares, fixed seed (anakin, obiwan, average): 0.25 no cap; 0.16; 0.16 + addendum; 0.17 / 0.175 with good form x3 (two looks); the B1 retune | as in D | 9 m 56 s (under load), 1 m 59 s, 1 m 58 s, about 2 m each |
| Spread, 20 seeds, Anakin and Obi-Wan (B1 100) | as in D | 923 s |
| Spread, 20 seeds, Anakin (elites 16) | as in D | 392 s |
| lifegap A (items 7+8 with the addendum, missions on, worktree) | 120 lives | 3,976 s (beside B) |
| lifegap B (everything, W = 1, missions on) | 120 lives | 3,982 s (beside A) |
| lifegap missions off (final code) | 120 lives | 2,422 s (beside W round 1) |
| lifegap W round 1 (Jedi, 20 seeds) | 60 lives | 2,808 s |
| lifegap W round 2 (Jedi, 20 seeds) | 60 lives | 1,769 s (beside npm run missions) |
| lifegap final (everything, final W, missions on) | 120 lives | 2,290 s (beside test:all) |
| npm run missions (20 seeds x 15 cells) | 300 years | 618 s (beside W round 2) |
| tests/measure/tiredFight.measure.ts | as in C3 | 16 s |

**Stopped runs, not reported:**
- The first A and B runs, when the shares needed the base lowered.
- The second A and B, when your addendum arrived.

**`npm run missions`, pooled failure:**

| Who | Peace | Total war |
| --- | --- | --- |
| Knight | 13.3% (m9-tune 13.3%) | 20.6% |
| Consular Knight | 11.9% (11.2%) | 19.9% (16.8%) |
| Master | 7.2% (7.8%) | 7.6% |
| Padawan | 15.6% (14.9%) | 19.1% |
| Powerful Knight | 8.6% (8.6%) | 9.0% |

**Tests added or changed:**
- tests/m9/tune2.test.ts (16): the enlisted and commissioned records, the Sith side and the Brotherhood's fronts, the withdrawal, the runs per opponent, fighting tired (3a-3e, push's strain), the spar injuries, the front pace.
- tests/engine/combatXp.test.ts: the reference values at 0.16, no daily limit, the long factor, short spar bouts.
- tests/engine/duel.test.ts: training sabers now minor-only.
- tests/features/combatAndRecords.test.ts: three fights a day pay in full.
- tests/m9/tune.test.ts: the field fight with no cap.

## Not done, and found for you

- **test:all has one real failure: Luke's body gate** ("Strength, Agility and Endurance have each peaked by 68 and are slowly declining"). Endurance now peaks at 75; it was 66-69 at HEAD.
  - The cause is the approved no-cap rule. Luke's Vong-war fights (44-50) now pay their physical XP in full, so his Endurance and Strength are higher from 50 on:
    - Endurance 43.19 against 43.05 at HEAD;
    - Strength 42.52 against 42.29.
  - His body Endurance from 60 is flat to within 0.02 levels for twenty years: 43.40-43.42 from 66 to 80, against 43.29 at 66-69 at HEAD. So a shift that small moves the top from 66-69 to 75.
  - Not the new Willpower rule: switched off, the curve is the same.
  - **Not changed** (a progression gate). **Proposal:** read "peaked by 68" with a tolerance (the level at 68 within 0.05 of the peak), or measure it on the 20-seed spread.

- **The Sith's W:** the Inquisitor ends 2.5 / 3.8 below its war-years closed form and the Warrior 1.0 below at 41 on their counterparts' W (A3). A W of their own is proposed.
- **The withdrawal rule changes little** (F). The lever would be withdrawing before the wound.
- **The profile retune for Anakin** (D) is a harness input, as D-244 and D-264 were. The 20-seed spread is the evidence; the fixed seed is in test:all.
- **Fronts shared by both sides name one side's base:** the Republic strike fleet's flagship (the Great Galactic War's strike into Imperial space), the Jedi Enclave on Dantooine, the Republic outpost on Rhen Var, the Republic garrison on Alderaan. Only the Light and Darkness War's were split (item 4). Proposal: a base per side on `FrontDef`.
- **Two more Sith-Empire year lists exist and disagree with `SITH_POWERS` and each other:**
  - devCommands `SITH_EMPIRE_YEARS` (dev duelists; counts Revan's as the Empire);
  - traits `SITH_EMPIRE_YEARS` (the Imperial-born trait, -4,980 to -3,600).
  - Not merged.
- **Push through in a browser:** the toggle and the narrator's line are tested in code only. This session had no browser.
- **The Consular in a total war** fails more often in `npm run missions` (16.8% -> 19.9%).

## H. Every invented number

| Number | Where |
| --- | --- |
| The front pace W: Guardian 2.75, Sentinel 2.15, Consular 1.9; the Sith their counterparts' | `FRONT_PACE` (progression.config) |
| The combat XP base 0.16 (was 0.25) | `COMBAT_XP.perExchange` |
| The long factor: x1 through exchange 10, x2 at 40, capped; close = challenge above 0 and the track within +/-2 | `LONG_BOUT` |
| Good form: a natural 14+, x(1 + strain / 4) up to x2.0 at the hard limit | `GOOD_FORM` |
| Willpower under strain: 0.02 an exchange x g(strain), from strain 0.6 | `STRAIN_WILLPOWER` |
| Push through: x2 strain; the threshold 14 - Willpower / 25, never below 10; Endurance 0.05 a good-form exchange | `PUSH_THROUGH` (combat.config), `GOOD_FORM`, `PUSH_ENDURANCE` |
| Training-saber spar injuries: 0.5% at rest, 3% at capacity, 10% at the hard limit, a landed hit; W 3 (minor); the four kinds | `SPAR_INJURY` (combat.config) |
| The duty player withdraws at a moderate wound with the track at -2 or lower | `DUTY_WITHDRAWAL` (tests/support/dutyPlayer.ts) |
| Anakin's Clone Wars elite squads 16 and B1 groups 100 a year (harness inputs) | tests/lifetime/profiles.ts |
| The Brotherhood's fronts' bases, and the Korriban front's span (1,010-1,004) | `FRONTS` |
| The Sith powers marked "reading" (the scattered Sith after 3,600, the Lost Tribe era) and the Empire to 3,600 (SITH_SEATS' design default) | `SITH_POWERS` (data/wars.ts) |
| The tired-fight measurement's cases (Soresu 60, strains 1.0 and 3.8, a lethal duel, a training-saber spar) | tests/measure/tiredFight.measure.ts |
