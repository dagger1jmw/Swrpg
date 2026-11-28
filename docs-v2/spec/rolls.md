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

"Then an opening" in the surprise scenario: the attacker holds at least +2 after the surprise strike; under the
D-156 pressure rule a missed surprise strike already leaves +2, so no second opening is added (D-156).

Build order (D-34): sections 1, 2 and 7 (basic roll, checks, seeded RNG and roll card) are
built in M1 as pure engine, with the M1 stubs named in architecture §15. Duels (sections 3-6)
stay in M5. Whether a check is required is decided by the engine from the intent, never by
the AI (D-37).

## 1. Basic roll
Total = d20 + effective level / 10 + modifiers
  Natural 20: +5 extra. Natural 1: -5 extra.
Effective level = level of the skill used (form, Force ability, Agility, blaster skill...)
  * (1 - wound penalty) * (1 - rust) * (0.9 if Vitality is spent)
  * (1 - 0.25 * (1 - e(f_phys)))   [fatigue, e(f) from progression spec section 3]
    In a fight past 1.0 x capacity (D-234): a straight line from 0.825 at 1.0 to 0.40 at the physical
    hard limit (4.0, D-208), where the fighter collapses.
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
  After a strike that lands (a hit or a maneuver), advantage resets to 0. A strike that misses or is blocked
    (recovery, precognitive defense) keeps the pressure: the track moves 2 steps toward 0 (amended by D-156; 2 since D-206, was 1).
  Bands (build-up steps, hit quality, maneuver thresholds) read the margin rounded to the nearest whole point, so a
    fraction of a level never tips a band edge (D-156). Circumstances on a side's total (matchups, position, footing,
    numbers) count on both its attack and defense rolls; stance and state of mind split as listed (D-156).

Precognitive defense: when struck, a defender with Force Sense may spend 0.4 Force load to
  avoid the strike, with chance min(0.4, Force Sense / 250), +0.10 when centered (amended by D-206;
  was min(0.5, Force Sense / 200), then min(0.25, Force Sense / 400) under D-156). Not usable
  against a surprise strike or while the Force meter is above 1.0.
Exertion: each exchange adds 0.08 physical load (tunable). Fatigue lowers effective level
  (section 1), so very long duels are also decided by stamina.
Non-Force fighters have no precognitive defense, so their fights are much shorter.

Player beats (Moment pacing): the player does not act every exchange. The engine resolves
  exchanges between beats, and the player chooses an action at each beat:
  every strike, whenever advantage reaches +/-2, after any maneuver, and at least every 5
  exchanges. The AI narrates the beats from the engine's exchange log.
  Amended by D-182: the stance is a setting, not an action. Setting it (the stance buttons)
  changes the stance only: no exchange, no AI call, no time, no turn. It stays until changed,
  across a sparring session's bouts. Exchanges resolve only from an action: Continue, Fight on,
  a tactic, a maneuver, a Force action, an aimed strike, a form change, Narrate, Resolve to end,
  or typed input (typed words can still name a stance, D-179, and then resolve to the next beat).
  Natural combat words (D-179): typed input (or a choice) read for moves when the intent names
  none (src/data/combatWords.ts): parry, block, defend, hold, guard -> defensive stance; press,
  attack, push forward, overwhelm -> aggressive stance; dodge, evade, sidestep, roll -> defensive
  stance and a take-position attempt; circle, reposition, high ground, get behind -> take
  position; a form name, number or technique -> switch to (at the form-change cost) or stay in
  that form. Words with no move ask back: no exchange, the beat buttons and a short line.
  Form change (Q32, copied by D-63): changing lightsaber form is allowed at a player beat and
  costs 1 advantage step (the track moves 1 toward the opponent).
Time: the clock advances 5-10 seconds per exchange (rolled). One clock (Jared, D-499): the same in a hold (holds.md) and between
any duelists; how fast a duel reads is narration only.

Duration targets: equal Force users median 30-40 exchanges (about 3-6 minutes);
  20-level gap about 25-30; 60-level gap about 10-15; Jedi (70) vs trooper (15) 4 or fewer.

Sparring sessions (Jared, D-168): a spar is a session of bouts up to 34 exchanges in total
  (combat.config SPAR_SESSION). Each bout ends by its sparring mode's rule (controlled live
  blades: a point; training sabers: the first side Spent; Sith academy: wounds). Between bouts
  each side gets back 50% of its maximum Vitality (design default); fatigue and wounds carry.
  The session ends at the exchange count, or early when a side is still Spent after the
  recovery, when someone is really hurt (an accident, an academy wound), when a side has collapsed
  from exhaustion (D-208; m9-tune2 found the next bout starting with the collapsed fighter), or
  when the player stops. Training sabers can injure mildly (Jared, m9-tune2 addendum 2;
  combat.config SPAR_INJURY, invented): a landed hit leaves a minor injury (a welt, a light burn,
  a bruise, a sprain from a fall) with a chance by the struck fighter's strain: 0.5% at rest, 3% at
  capacity, 10% at the hard limit, linear between; never worse than minor. Exchange numbering and the log run on across bouts; the session's outcome is the bout
  tally (more won: won; more lost: lost; equal: truce).
  Live play: by default the session resolves in code like a montage, with one narration call
  for the whole session (bouts won and lost, the highlights, any accident or injury). The
  player can choose Play this bout to play the current bout out with the normal beats (any
  tactical action does the same; setting the stance does not, D-182); after it the next bout waits for the same choice. Stop
  sparring ends the session with the bouts so far.
  Amended by D-177: input that describes a specific combat action (a parry, a strike, a feint, a
  form technique, any sequence; a fight choice) plays the bout out with the beats, also when it
  is the input that starts the session. Only sparring asked for as an activity ("spar with the
  other Initiates for an hour") resolves like a montage, as do the routine and Order sparring
  blocks (training sessions, not fights). After a session resolves like a montage, Play the next
  bout starts the next bout with the same named partners in play-out mode, unless someone was
  really hurt.
  Amended by D-181: a bout's end is not the session's end. The fight stays active (the duel panel
  shows the bout's result and the next bout); the narration cannot end a session with
  combatEnded except as interrupted (the story stops it), which ends it with the bouts so far.
  Extended by D-181 to every fight: the narration ends a fight only as interrupted, with why (an
  outside event: reinforcements, a collapse, an alarm). Fled and surrendered come from the
  player's Disengage and Surrender beats or an engine-rolled fate; a truce is offered by the
  narration (truceOffered) and taken only when the player presses Accept the truce.
  Target selection is a setting like the stance (D-182): no exchange, no turn; it stays until
  changed, and when that opponent is out the duel strikes at the next engaged one.

## 4. Ranged and Force
  Blaster vs saber deflection: shooter d20 + blaster skill/10 vs defender d20 + form
    level/10 + form vs-blaster modifier; a defender margin of 8+ can redirect the bolt
    (rated by Soresu/Shien skill per the lore).
  Force vs resistance (amended by D-192): almost nothing resists the Force. Mind abilities:
    d20 + effective ability level/10 vs d20 + Willpower/10 (+ half the Force resistance of a Force
    user); droids, Hutts and Toydarians cannot be affected. Avoidable manifestations (Push,
    lightning, a thrown object or saber): the difficulty, then a dodge (d20 + Agility/10 + the
    ability's dodge modifier) only for a target that can react; cover blocks lightning and thrown
    objects; a lightsaber catches lightning; a Force user counters with Force resistance. Grips:
    difficulty only, unless the target is a Force user. Telekinesis on an object or a body:
    difficulty only (mass, size). A Force-null bubble (ysalamiri) stops every use; the Yuuzhan
    Vong cannot be touched directly (a thrown object still hits). Numbers in
    src/data/forceResistance.config.ts. Force load per use comes from the health spec section 2.
  Sequences (D-199): a stance step is a setting and does not count toward the length cap. When
    the opponent holds the strike, the first step resolves, then the opponent's strike, and the
    remaining steps are not reached. A feint or taunt step shows its dice and margin.
  Saber throw (D-193): telekinesis control vs a difficulty; up to 3 minion strikes in the arc,
    each its own roll; one deflectable strike on a duelist (a Force user may wrench it away); a
    failed control roll drops the saber until a recall.
  Slugthrowers (D-200): solid slugs, fired with the blaster skill until M8. A lightsaber blocks
    them with the normal defense roll (they melt on the blade) but never redirects them, and the
    forms' vs-blaster modifiers do not apply. Rapid slugthrower fire and scatter shot give a
    defender with a saber -1. Mandalorians carry them by an era share (data/weapons.ts).
  Ranged firefights use build-up exchanges too (cover and suppression shift the track).

## 5. Circumstance modifiers (d20 points; 1 point = 10 levels)
  Surprise: the fight starts with the attacker at advantage 3 (the first exchange is a strike),
    and the defender cannot use precognitive defense on it. Triggered when a perception contest
    fails: defender d20 + Force Sense/10 (or awareness) vs attacker d20 + stealth/10.
    Amended by D-170: a defender caught by a surprise strike gets no numbers modifier for that
    strike (the others cannot cover them); the numbers modifier applies again from the next
    exchange. The section 8 tables have no surprise and are unchanged.
  Aimed strike (D-171): a strike, or a sequence strike step, can aim at the head, the torso or a
    limb. The strike roll takes -2 (combat.config AIMED_STRIKE) and the chosen part replaces the
    location roll (health section 5); a part already lost falls back to the roll. The aim is spent
    on the next strike. The intent call maps typed input such as "go for his head".
  Strike intent (D-260): each NPC fighter strikes to kill, to disarm or to capture (combat.config
    INTENT_WEIGHTS, strikeIntentFor; design defaults). Jedi disarm (the weapon hand and the limbs,
    the marks of contact) and kill only in lethal stakes; Sith, soldiers, mercenaries,
    Mandalorians, the Yuuzhan Vong and everyone else kill (torso and head). Kill and disarm
    replace the striker's location weights; intent is not an aimed strike, so there is no -2.
    The player has no intent: the base roll, or an aimed strike as above. The narration block
    states each opponent's intent. The section 8 tables use fighters with no intent and are
    unchanged.
  Capture (amended by D-262; Legends: a Jedi is taken by being subdued, not out-fenced): a fighter
    the scene or a contract sets to bring the player in alive (combatStarted wantAliveRefs, or a
    minion group's wantAlive) captures when its loadout has a subduing means (combat.config
    SUBDUE, subdueFor): Force Choke to unconsciousness or low-power Force lightning for a Force
    user with the ability at 10+; nets, whipcords and binders for Mandalorians and bounty
    hunters; a stun baton, an electrostaff or a force pike in melee; a blaster pistol or rifle
    on stun. Its landed strikes drain Vitality and never wound (health section 4); no location,
    no sever, no killing blow. The fight ends in capture when the player is Spent (the player
    is taken, the captors' fate is capture). A fighter with no subduing means (a lightsaber
    without Choke or lightning, an amphistaff, a heavy repeater, a slugthrower) keeps its
    archetype's kill or disarm. A stun bolt deflected back stuns its shooter. No capture in a
    spar.
  Tactical withdrawal (D-263, narrowed by D-268; design default, combat.config
    TACTICAL_WITHDRAWAL): apart from panic morale, a named Sith duelist who is losing (a severe
    or worse wound or a sever this exchange, Spent this exchange, or the track swinging to 4
    against it while its Vitality is at or below 50%) withdraws with its archetype's chance, 30%
    for Sith warriors and inquisitors: it breaks off and escapes, out of the fight, with no fate
    to choose (Dooku, Ventress and Grievous fled sometimes, not every time). One check per
    exchange with a trigger, at most two a fight; an unwounded Sith above half its Vitality never
    withdraws. Target: 20-30% of the player's won duels against Sith end this way (measured by
    npm run sweep). The last opponent withdrawing ends the fight won ("the opponents broke").
    Real fights only.
  Power bar (D-489, D-491; world-events.md section 2): an opponent above the player's tier is never killed, put down,
    maimed, worn out or driven to surrender. A blow that would do it lands as a lighter wound (severe at most, less when
    the load has no room) and they break off; the fight ends as a stalemate ("brokeOff"), never won, and no fate is
    offered. Real fights only.
  Disengage (tactic): d20 + Agility / 10 (+ position) against d20 + the current opponent's
    skill / 10; a win ends the fight as fled (engine/duel.ts disengageContest). The lifetime
    harness plays its profiles as sensible Jedi who use it when severely wounded, near Spent
    while losing on the track, or against a clearly stronger opponent (D-264).
  Opening: +2 advantage. Created by winning a feint, taunt or trick contest
    (d20 + Charisma, Intelligence or form level / 10 vs d20 + Willpower or Force Sense / 10),
    or by an opponent's natural 1 in a build-up exchange.
  Position: +1 while held (cover, better footing); decisive position (high ground over a fall,
    a choke point) +2. Taken with a maneuver, or set by the scene.
  Terrain: unstable footing -1 | confined space: Ataru and Jar'Kai -1 | slippery ground: -1 to
    take-position attempts (on the maneuver's margin, D-184)
  Terrain accidents (D-144, built in D-184; D-185): at the start of each sparring bout, and in a
    real fight at its start and then once per 10 exchanges (combat.config TERRAIN_HAZARD_EVERY),
    every fighter still in it rolls each hazardous tag (src/data/terrain.ts chance, severity and
    type: flat floor 0.5% a minor injury, kept in the minor band; slippery 5% and uneven ground 3%
    a minor fall, ledges 4% moderate, floating platforms 6% severe, loose rock 2% minor, fire 3%
    moderate); a hit is a hazard by the health rules (a fall lands by the fall location weights),
    synced to health like duel damage and narrated as ground truth. In every sparring mode,
    training sabers included.
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
  Shatterpoint (shatterpoint perception talent only): contest d20 + Shatterpoint level/10 vs 15; on
    success, advantage jumps to 3 (an immediate strike), once per fight.
  The AI cannot grant either; code rolls them.
  Non-combat Shatterpoint reads (perceiving a person, a relationship, a situation or an
  event) are a check against a DC set by the D-06 band, defined in force-catalog.md
  (D-63).

## 7. Randomness and display
  All rolls use the seeded RNG. The roll card shows both d20s, bonuses, each modifier with its
  source, the margin, the advantage track, and the outcome. A duel log lists every exchange.

## 8. Required tests
 1. With the health spec, seeded simulation of 10,000 duels per gap between equal-Vitality
    Force users reproduces the upset and median-exchange table above (+/-3 points; medians
    within the §3 band of 30-40 exchanges for gaps 0-10 and +/-5 exchanges for gaps 20+;
    amended by D-156).
 2. Scenario table above reproduces within +/-5 points.
 3. Jedi (70, Force Sense 70) vs trooper (15): Jedi wins 99%+ with median 5 or fewer exchanges
    (amended by D-157: measured 100%, median 5).
 4. Natural 20 and natural 1 each occur 5% (+/-0.5%) over 100,000 rolls.
 5. No code path adds a tier-gap bonus; one level of difference never changes duel odds by
    more than 2.5 points (amended by D-50; the reference table itself has 2.0 points per
    level between gaps 0 and 5).
 6. Precognitive defense never applies to a surprise strike or above Force meter 1.0.
 7. The player gets a beat at every strike, at advantage +/-2, and at least every 5 exchanges.
 8. Same seed gives identical duels.
