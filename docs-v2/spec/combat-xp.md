# Combat XP (v1)

## 1. Per fight
XP per exchange to the skill used = 0.25 * challenge(gap) * stakes * outcome * M
  Exchanges are counted from the duel log, by the skill used in each (main form for melee,
  blaster skill for ranged, or the Force ability).
  gap = opponent's effective level in the opposed skill - own effective level
  challenge = progression spec section 4 curve for gap >= -25; from gap -25 down to -35 it
    ramps linearly from that curve's value (0.3) to 0, and it is 0 below -35 (amended by
    D-65: no step at -30)
  stakes: spar 0.5 | skirmish 1.0 | serious 1.5 | lethal 2.0
  outcome: won 1.0 | lost and survived 1.2 | fled or interrupted 0.8 | truce 1.0
  Split: 0.75 to the skill used, 0.25 to physical stats by that form's activity weights.
Force abilities used in the fight: 0.1 XP per use * challenge * stakes * M (no split).

Session shape for computeXp (D-55): combat is a branch of the one computeXp function, with
  session = { source: combat, fightId, stakes, outcome: won / lost / fled / truce
              (interrupted counts as fled), exchanges: [{skillId, gap}] from the duel log,
              forceUses: [{abilityId, gap}], day }
  The branch applies section 1 exactly: per exchange 0.25 * challenge(gap) * stakes *
  outcome * M; no hours, no intensity, no fatigue efficiency, and the fight outcome above
  replaces the rolled session outcome (there is no outcome roll for combat). Section 2 caps,
  section 3 E/CI, the drill-ceiling rule for sparring (progression spec section 7, D-45)
  and the 4.0x clamp (D-48) are applied by the same function.

## 2. Limits
  Daily cap: 12 XP per skill before M (about 4 days of standard training).
  The third and later fights in one day: x0.5.
  Storage (D-47): fightsToday and the per-skill combat XP totals for the day live in the
  progression slice (combat is null outside a fight) and are reset by the progression day
  hook (architecture §10).
  Sparring XP to a lightsaber form is ceiling-limited like drill XP (D-45).
  Combat XP counts toward the 4.0x pace limit (progression spec section 5).

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
  The 0.25 base and the daily cap are tunable to meet these.

## 6. Reference values (M 1.0)
  Even serious duel, 34 exchanges: 34 * 0.25 * 1.0 * 1.5 * 1.0 = 12.75 -> capped at 12
  Even spar, 34 exchanges: 4.25
  Lethal duel, opponent 12 levels stronger, lost but survived:
    34 * 0.25 * 1.25 * 2.0 * 1.2 = 25.5 -> capped at 12
  Jedi (70) vs trooper (15): 0 (gap -55, below -35)

## 7. Required tests
 1. Reference values in section 6 reproduce exactly.
 2. Daily cap and the third-fight halving apply per skill.
 3. No XP from opponents more than 35 levels weaker; between 25 and 35 levels weaker the
    factor falls linearly from 0.3 to 0, with no step (D-65).
 4. Combat XP is included in the 4.0x pace check.
 5. Lifetime test meets the section 5 combat shares.
 6. M has no experience factor anywhere in code.
 7. The combat branch of computeXp reproduces section 6 exactly and never rolls a session
    outcome (D-55).
 8. fightsToday and the daily totals survive the end of a fight and reset at the day hook
    (D-47).
