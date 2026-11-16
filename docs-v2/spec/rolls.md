# Rolls and combat resolution (v2)

Reference tables (simulated with the health model, 8,000-10,000 duels per case):

| Level gap             | 0   | 5   | 10  | 20  | 30  | 40  | 60  |
| --------------------- | --- | --- | --- | --- | --- | --- | --- |
| Stronger fighter wins | 50% | 60% | 68% | 84% | 92% | 96% | 99% |
| Median exchanges      | 34  | 33  | 34  | 29  | 24  | 20  | 13  |

| Scenario                                                              | Weaker fighter wins |
| --------------------------------------------------------------------- | ------------------- |
| 15 levels weaker, straight duel                                       | 23%                 |
| 15 levels weaker, opens with surprise, then an opening                | 32%                 |
| 10 levels weaker, holding decisive high ground (+2)                   | 68%                 |
| Same, against a reckless, enraged opponent (attack +1, defense -2)    | 81%                 |

## 1. Basic roll
Total = d20 + effective level / 10 + modifiers
  Natural 20: +5 extra. Natural 1: -5 extra.
Effective level = level of the skill used (form, Force ability, Agility, blaster skill...)
  * (1 - wound penalty) * (1 - rust) * (0.9 if Vitality is spent)
  * (1 - 0.25 * (1 - e(f_phys)))   [fatigue, e(f) from progression spec section 3]
  Combat Force abilities use their combat-integration effective level (progression sec 8).
There is no tier-gap bonus anywhere. 1 modifier point = 10 levels.

## 2. Checks against difficulty
  DC = 10 + difficulty rating / 10   (rating 40 -> DC 14; rating 80 -> DC 18)
  Margin = total - DC. Success at margin >= 0; margins grade the result like section 3.

## 3. Melee duels: exchanges and the advantage track
One exchange = about 5-10 seconds of fighting. Both sides roll each exchange.
Advantage track: an integer from -5 to +5 (positive favors side A), starting at 0.

Build-up exchange (no side at advantage 3 or more):
  m = total A - total B, using each side's attack AND defense modifiers (net)
  |m| <= 1: advantage moves 1 toward 0
  2-5: winner +1 | 6-9: winner +2 | 10+: winner +3

Strike exchange (a side has advantage >= 3; that side is the striker):
  strike margin = striker total (with attack modifiers) - defender total (with defense modifiers)
  below 4: defender recovers, no hit
  4-7 graze | 8-11 solid | 12-15 clean | 16+ critical  (hit quality for health spec sec 4)
  Instead of a hit, the striker may take a maneuver: gain position 2+ | knockdown 4+ | disarm 8+
  After any strike exchange, advantage resets to 0.

Precognitive defense: when struck, a defender with Force Sense may spend 0.4 Force load to
  avoid the strike, with chance min(0.5, Force Sense / 200), +0.10 when centered. Not usable
  against a surprise strike or while the Force meter is above 1.0.
Exertion: each exchange adds 0.08 physical load (tunable). Fatigue lowers effective level
  (section 1), so very long duels are also decided by stamina.
Non-Force fighters have no precognitive defense, so their fights are much shorter.

Player beats (Moment pacing): the player does not act every exchange. The engine resolves
  exchanges between beats, and the player chooses a stance or tactic at each beat:
  every strike, whenever advantage reaches +/-2, after any maneuver, and at least every 5
  exchanges. The AI narrates the beats from the engine's exchange log.
Time: the clock advances 5-10 seconds per exchange (rolled).

Duration targets: equal Force users median 30-40 exchanges (about 3-6 minutes);
  20-level gap about 25-30; 60-level gap about 10-15; Jedi (70) vs trooper (15) 4 or fewer.

## 4. Ranged and Force
  Blaster vs saber deflection: shooter d20 + blaster skill/10 vs defender d20 + form
    level/10 + form vs-blaster modifier; a defender margin of 8+ can redirect the bolt
    (rated by Soresu/Shien skill per the lore).
  Force vs resistance: d20 + effective ability level/10 vs d20 + Willpower/10 (or a Force
    defense ability). Force load per use comes from the health spec section 2.
  Ranged firefights use build-up exchanges too (cover and suppression shift the track).

## 5. Circumstance modifiers (d20 points; 1 point = 10 levels)
  Surprise: the fight starts with the attacker at advantage 3 (the first exchange is a strike),
    and the defender cannot use precognitive defense on it. Triggered when a perception contest
    fails: defender d20 + Force Sense/10 (or awareness) vs attacker d20 + stealth/10.
  Opening: +2 advantage. Created by winning a feint, taunt or trick contest
    (d20 + Charisma, Intelligence or form level / 10 vs d20 + Willpower or Force Sense / 10),
    or by an opponent's natural 1 in a build-up exchange.
  Position: +1 while held (cover, better footing); decisive position (high ground over a fall,
    a choke point) +2. Taken with a maneuver, or set by the scene.
  Terrain: unstable footing -1 | confined space: Ataru and Jar'Kai -1
  Numbers: +1 per extra attacker engaged on the same target (max +3).
  Form matchups: +/-1 (e.g. Soresu vs blasters, Makashi in one-on-one saber duels; Makashi vs
    several opponents -1). Build the full table from Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md.
  State of mind (progression spec sec 17):
    centered: precognitive defense chance +0.10
    anger or hatred (reckless): attack +1, defense -2
    fear, despair or grief: attack -1, defense -1
    pride or overconfidence (facing someone they believe weaker): defense -1

## 6. Force insight and shatterpoints (rare)
  Force insight: once per fight, when facing an opponent 15+ levels stronger or when Dying
    risk is present, a character with Force Sense 60+ has a chance at the start of each
    exchange of Force Sense / 200 (+0.10 for light-side philosophies) to gain +2 advantage.
  Shatterpoint (ShatterSense talent only): contest d20 + Shatterpoint level/10 vs 15; on
    success, advantage jumps to 3 (an immediate strike), once per fight.
  The AI cannot grant either; code rolls them.

## 7. Randomness and display
  All rolls use the seeded RNG. The roll card shows both d20s, bonuses, each modifier with its
  source, the margin, the advantage track, and the outcome. A duel log lists every exchange.

## 8. Required tests
 1. With the health spec, seeded simulation of 10,000 duels per gap between equal-Vitality
    Force users reproduces the upset and median-exchange table above (+/-3 points, +/-5
    exchanges).
 2. Scenario table above reproduces within +/-5 points.
 3. Jedi (70, Force Sense 70) vs trooper (15): Jedi wins 99%+ with median 4 or fewer exchanges.
 4. Natural 20 and natural 1 each occur 5% (+/-0.5%) over 100,000 rolls.
 5. No code path adds a tier-gap bonus; one level of difference never changes duel odds by
    more than 1.5 points.
 6. Precognitive defense never applies to a surprise strike or above Force meter 1.0.
 7. The player gets a beat at every strike, at advantage +/-2, and at least every 5 exchanges.
 8. Same seed gives identical duels.
