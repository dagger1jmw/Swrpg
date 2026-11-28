# Combat XP (v1)

**Amended by m9-tune2 (Jared, 27 Nov 2026; D-566 to D-568; report docs-v2/reports/m9-tune2.md):** long duels grant increasing
returns, counted per opponent (section 1); there is no daily combat XP limit: the body limits fighting, not an XP rule
(section 2); fighting tired (section 1a: the gap from rested levels, good form, Willpower under strain, spars as training,
pushing through); the base 0.16.

## 1. Per fight
XP per exchange to the skill used = 0.16 * challenge(gap) * stakes * outcome * long(n, track) * M
  (the base was 0.25 until m9-tune2; lowered to 0.16 to keep the section 5 shares with no daily cap, D-566)
  Exchanges are counted from the duel log, by the skill used in each (main form for melee,
  blaster skill for ranged, or the Force ability).
  gap = opponent's effective level in the opposed skill - own effective level
  challenge = progression spec section 4 curve for gap >= -25; from gap -25 down to -35 it
    ramps linearly from that curve's value (0.3) to 0, and it is 0 below -35 (amended by
    D-65: no step at -30)
  stakes: spar 0.5 | skirmish 1.0 | serious 1.5 | lethal 2.0
  outcome: won 1.0 | lost and survived 1.2 | fled or interrupted 0.8 | truce 1.0
  gap is read from rested levels: both sides' effective levels with no fatigue factor (addendum 3a), so being tired
    never makes the opponent look stronger.
  long (Jared, m9-tune2 item 7; LONG_BOUT, numbers invented): by the exchange's number n in its run against the same
    opponent (addendum 1: a group fight against minions is many short fights, not one long duel; a spar's new bout
    starts a new run): 1.0 through exchange 10, then rising linearly to 2.0 at exchange 40, capped at 2.0
    (long = min(2.0, 1 + (n - 10) / 30) for n > 10). Only while the fight is close: the exchange's challenge above 0
    and the advantage track (before the exchange) within +/-2; otherwise 1.0 (a long beating of a weaker foe or a
    stalled fight gives no ramp). Live fights and spars alike; sparring XP stays under its drill ceiling (D-45).
    Normal bouts of 5-10 exchanges pay as before.
  form: see section 1a (1.0 at rest).
  Split: 0.75 to the skill used, 0.25 to physical stats by that form's activity weights.
Force abilities used in the fight: 0.1 XP per use * challenge * stakes * M (no split, no long factor).

## 1a. Fighting tired (Jared, m9-tune2 addendum 3; numbers invented)
  Strain = the physical meter over its capacity, before the exchange (the hard limit is 4.0, where the fighter
  collapses). Pushing while tired is the best way to grow, but only while keeping form; the risk is the trade-off.
  Good form (GOOD_FORM): an exchange whose natural d20 is 14 or more. Its skill XP x (1 + 1.0 x strain / 4.0), up to
    x2.0 at the hard limit. The raw die, not the margin (the margin mostly reflects the skill gap). No cap.
  Low rolls: in a live fight, no bonus and no penalty (fatigue already lowers the effective level: more losses, more
    injuries, and in lethal fights death). In a spar (a training session, addendum 3d; amends D-55 for spars), a low
    roll pays the training efficiency e(strain) of the fatigue rules (1.0 to 0.4, 0.3 at capacity, 0.1 past it), so
    sloppy tired sparring pays little and good form makes tired sparring a training method.
  Willpower (STRAIN_WILLPOWER): an exchange at strain 0.6 or more teaches Willpower 0.02 x g(strain) (the training
    rule's fatigue curve: 0.25 at 0.6, 1.0 at capacity, 1.5 past it) x challenge x M. Training sessions keep their own
    rule (FATIGUE_WILLPOWER: 1.5 XP an hour x g, at most 3 XP a day); before m9-tune2 a fight taught no Willpower.
  Push through (a setting in any fight or spar, as the stance; pushSet): each exchange costs x2 the physical strain
    instead of a roll penalty; the good-form threshold is 14 - Willpower / 25, never below 10; a good-form exchange
    gives the bonus above plus Endurance 0.05 x challenge x M (PUSH_ENDURANCE). The narrator is told the character
    is pushing; the code decides the numbers. The harness's duty player never pushes.
  Measured (1,000 runs each, reports/m9-tune2.md section C): tests/measure/tiredFight.measure.ts.

Session shape for computeXp (D-55): combat is a branch of the one computeXp function, with
  session = { source: combat, fightId, stakes, outcome: won / lost / fled / truce
              (interrupted counts as fled), exchanges: [{skillId, gap, n, track, form, strain, push}]
              from the duel log (engine/combatXp fightExchanges),
              forceUses: [{abilityId, gap}], day }
  The branch applies section 1 exactly: per exchange 0.16 * challenge(gap) * stakes *
  outcome * long * form * M; no hours, no intensity, no fatigue efficiency in a live fight (a spar's low rolls
  take it, section 1a), and the fight outcome above
  replaces the rolled session outcome (there is no outcome roll for combat). Section 3 E/CI, the
  drill-ceiling rule for sparring (progression spec section 7, D-45) and the clamp hook (D-48; a
  pass-through since D-457) are applied by the same function.

## 2. Limits
  No daily limit (Jared, m9-tune2 item 8; replaces the 12-XP-per-skill daily cap and the x0.5 on the
  third and later fights of a day): fighting a lot is the player's choice, and the body limits it.
  Every exchange adds physical load (EXERTION_PER_EXCHANGE, spars included) that recovers only with
  rest; load lowers the effective level (rolls section 1, D-234) down to 0.4 at the hard limit, where
  the fighter collapses; every real fight can wound, a controlled spar can wound by accident. The
  report (m9-tune2, section C) lists what the body does not yet limit.
  The guards that stay: the challenge curve (nothing from foes 35+ levels weaker), stakes, the
  drill ceiling and the 34-exchange session for sparring, the long factor's closeness rule, and
  the lifetime 4.0x check (progression spec section 20 test 2).
  Storage (D-47): fightsToday and the per-skill combat XP totals for the day still live in the
  progression slice (field practice reads "a fight today"; the counters are reported) and are reset
  by the progression day hook (architecture §10). They no longer limit anything.
  Sparring XP to a lightsaber form is ceiling-limited like drill XP (D-45).
  Combat XP is outside the per-hour 4.0x clamp and its window (D-457): per exchange it differs
  from the Average's in the same fight only by M (capped at 2.8, under 4.0). The lifetime 4.0x
  floor (progression spec section 20 test 2) still counts it.

## 3. Applied experience (E) and combat integration (CI)
  E gains by stakes: spar 0.2 (peer) / 0.4 (master) per session | skirmish +3 | serious +6 |
    lethal +6, or +10 if the opponent is 5+ levels stronger. Scaled by (1 - E/120);
    sparring E capped at 15. (Replaces the wording in progression spec section 7.)
  CI gains per Force ability use: spar +0.1 (capped at 20) | skirmish +0.5 | serious +1 |
    lethal +2. Scaled by (1 - CI/120).
  Any skirmish or higher starts the drill-ceiling bank release (progression spec section 7).
  Amended by D-163 (sparring partners):
    A partner at least 10 levels above the student's form level (a master counts only then) is a
      stronger partner: +0.4 a session, and sparring E rises toward the partner's main-form level
      minus 25 (never capped below 15). Anyone else is a peer: +0.2 a session, sparring E capped
      at 15. Both scaled by (1 - E/120).
    Group sparring: 2-3 partners at once count as one partner at the strongest's level + 10 per
      extra partner (at most 3 count); the bout itself is harder (the numbers modifier).
    Order classes counted as sparring (D-143 A) follow the same rule by the teacher's level: the
      Temple instructor stub (10 ahead) is a stronger partner, but below level 40 its level - 25
      is under 15; the stub master (30 ahead) raises sparring E to the student's level + 5.
    Recorded for M7 (not built): instructors get a higher share of drill XP above the ceiling
      (25% -> 35%) for the forms they teach.

## 4. Experience multiplier removed
  M no longer includes an experience factor. War speeds growth through combat XP, E and CI.

## 5. Calibration targets (checked by the lifetime test)
  Anakin profile, war years: combat gives 25-35% of yearly XP in his main form.
  Obi-Wan profile, Clone Wars years: 20-30%.
  Average and Obi-Wan profiles in peacetime: under 10%.
  The base is tunable to meet these. With the daily cap gone (m9-tune2) the 0.25 base overshot
  (Anakin's war years 36.3%, Obi-Wan's 38.4%); at 0.16 they are 27.5% and 28.6%, peace under 10%
  (reports/m9-tune2.md section D).

## 6. Reference values (M 1.0)
  The long factor over one close bout of 34 exchanges sums to 44 (34 + (1 + 2 + ... + 24) / 30).
  Even serious duel, 34 exchanges in one close bout: 0.16 * 1.0 * 1.5 * 1.0 * 44 = 10.56
    (8.16 at the plain rate: a bout that was not close, or exchanges with no bout number;
    12.75 capped at 12 before m9-tune2)
  Even spar, 34 exchanges: 2.72 (4.25 before m9-tune2)
    (D-168: a spar is a session of bouts up to 34 exchanges in total, rolls section 3; one bout
    alone is about 5-10 exchanges, so the long factor never rises.)
  Lethal duel, opponent 12 levels stronger, lost but survived, 34 exchanges in one close bout:
    0.16 * 1.25 * 2.0 * 1.2 * 44 = 21.12 (16.32 at the plain rate); no cap (12, capped, before m9-tune2)
  Jedi (70) vs trooper (15): 0 (gap -55, below -35)
  A normal bout of 5-10 exchanges: the plain rate, no long factor (5 even serious exchanges: 1.2)

## 7. Required tests
 1. Reference values in section 6 reproduce exactly.
 2. No daily limit: a second and a third fight the same day, and a 200-exchange fight, pay in full
    (m9-tune2; replaces "the daily cap and the third-fight halving apply per skill").
 3. No XP from opponents more than 35 levels weaker; between 25 and 35 levels weaker the
    factor falls linearly from 0.3 to 0, with no step (D-65).
 4. Combat XP is included in the lifetime 4.0x check (D-457: not in the per-hour clamp).
 5. Lifetime test meets the section 5 combat shares.
 6. M has no experience factor anywhere in code.
 7. The combat branch of computeXp reproduces section 6 exactly and never rolls a session
    outcome (D-55).
 8. fightsToday and the daily totals survive the end of a fight and reset at the day hook
    (D-47).
 9. The long factor: 1.0 through exchange 10, linear to 2.0 at 40, capped; only with the track
    within +/-2 and a challenge above 0; the run restarts with a new bout or another opponent; a
    normal bout of 5-10 exchanges pays as before (tests/engine/combatXp.test.ts, tests/m9/tune2.test.ts).
10. A live fight's fightResolved carries each exchange's run number, the track, good form and strain
    (the duel log; a spar's bouts from its session).
11. Section 1a: the gap from rested levels; good form x1 to x2 by strain, from a natural 14; a spar's
    low roll at e(strain); Willpower from strain 0.6 by g; pushing: x2 strain, the threshold by
    Willpower (never below 10), Endurance on good form (tests/m9/tune2.test.ts).
