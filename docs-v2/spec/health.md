# Health (v1)

## 1. Ownership
Only the health module changes meters, Vitality and wounds. Inputs are events from combat
resolution, Force use, activities, the clock, and healing. The AI never sets a value.
Status is DERIVED from the wound list on every read; it is never stored as its own field.

## 2. Tiredness meters
Physical and mental meters: as defined in docs/spec/progression-numbers.md section 3.
Force meter (replaces Force strain):
  Capacity = 3 + 3 * min(ForceControl,100)/100 + 1 * min(Willpower,100)/100
             + max(0, min(ForceControl,150) - 100)/50
  Load per use = ability base load * effort * mastery factor * combat integration factor
    effort: light 0.5 | standard 1.0 | heavy 2.0 | all-out 3.5
    mastery factor = max(0.4, 1 - ability level / 200)
    combat integration factor = (1 + 0.015 * G), max 2.0 (progression spec section 8)
  Example base loads (tunable; every ability in the catalog declares one):
    Force Push 0.15/use | Force Lightning 0.30/use | Saber throw 0.20/use |
    Force Sense (active) 0.05/min | Force healing 0.25/min | Battle Meditation 0.50/min |
    Shatterpoint read 0.3/use (Q21, copied by D-63; combat and non-combat reads)
  Force drills add Force load 0.6/hour in addition to their physical/mental load.
  Efficiency of Force abilities uses the same e(f) curve as the other meters.
  Over 1.0 (backlash): +0.5 mental load per extra Force load point; 5% chance per use of
    collapse (Incapacitated for 1-3 hours, no wound). Channeling anger lets the meter go to
    1.3 without backlash, adding +2 dark pressure per load point above 1.0.
  Recovery: rest -1.0/hour, meditation -2.0/hour, sleep 7h+ full reset.
  Rest and sleep (D-52): elapsed time not covered by an activity is rest for every meter and
    for Vitality (section 3), in story turns and in jumps. Sleep is an intent action
    (actionType sleep) or a routine block, resolved by the engine; only sleep of 7h+ gives
    the full resets here and in section 3 and heals minor wounds overnight (section 7).

## 3. Vitality (short-term buffer)
  Max Vitality = 20 + 0.6 * Endurance + 0.3 * Strength + 0.2 * Force body-ability level
    (youngling End 15 Str 10: 32 | Knight End 50 Str 45: 63.5 | Master End 80 Str 70 body 40: 97),
    then x (1 - the lasting injuries' combined Endurance penalty), each P x (1 - adaptation):
    a lost leg 15%, burns or lung damage 40% (D-255, design default). The same Endurance
    penalties cut the fatigue meters' capacity (D-252, D-254).
  Recovery: resting 50% of max per hour | light activity 15% per hour | none in combat
    (Force healing can restore it) | sleep 7h+ full.
  Vitality 0 = Spent: all further damage goes to wounds, and effective level is reduced 10%.
  Vitality can never cause death or incapacitation. Spent against an opponent who fights to capture
    is the one exception: the fight ends there and the player is taken (D-262, rolls section 5).
  Wounds do not lower Vitality, and Vitality does not show a wound (M5 balance row 19, 2026-11-20):
    only the part of D that is not bypassed comes off Vitality, so a clean or critical saber hit
    (bypass 1) can make a mortal wound and leave Vitality full. Dying, stabilizing (the mortal wound
    marked stabilized) and healing leave Vitality as it is; it recovers by the rates above. A wound's
    weakness is its wound penalty (section 6), not Vitality.
  On screen (m8-fixes D2, D-525): the health card shows the active wounds beside the Vitality bar (the worst, and how many
    more), so a full bar never hides a severe wound. A severe wound capping Vitality until it heals (Jared's and the report's
    recommendation) waits for the realistic-damage build: it would undo balance row 19.

## 4. Damage
  Damage D = weapon base * hit quality - armor (minimum 0)
  Weapon base: unarmed 5 | melee (vibroblade, staff) 12 | blaster pistol 15 |
    blaster rifle 20 | heavy weapon 30 | lightsaber 40 | Force attacks: power-based
    (e.g. Lightning = 0.4 * Force Output level * effort)
  Hit quality (from the roll system): graze x0.5 | solid x1.0 | clean x1.5 | critical x2.5
  Armor: light 3 | medium 6 | heavy 10. Against lightsabers, armor counts x0.25 unless
    lightsaber-resistant (cortosis, beskar: full).
  Vitality bypass (fraction of D sent straight to wounds):
    Lightsaber: graze 0 | solid 0.5 | clean 1.0 | critical 1.0
    Other weapons: 0, except critical 0.5
  Resolution: bypass part -> wound; rest reduces Vitality; any overflow below 0 -> wound.
  Amended by D-161 (Jared): severity depends on the weapon.
    Lightsabers keep the table above (a clean saber hit maims or kills; grazes are Vitality-only)
      and their overflow goes straight into the wound.
    Every other weapon (blasters, slugthrowers, vibroblades, melee, unarmed, heavy and droid
      weapons) and hazards: wound damage follows the strike margin, W = weapon base x curve(margin),
      scaled down with D by armor (health.config NONSABER_WOUND_BY_MARGIN: margin 7 or less 0,
      8: 0.1, 12: 0.5, 17: 1.0, 25: 2.5, interpolated). Hits below margin 8 are Vitality-only; low
      margins give minor wounds, the middle moderate, severe or worse only at high margins. The rest
      of D reduces Vitality. Overflow is banded too: past an empty Vitality the wound stays the
      margin's W, and a hit there is at least a minor wound (W 1). A hazard's severity hint reads as
      margin 10 / 15 / 21 (a fall: minor / moderate / severe).
    The non-saber mortal band (D-267, Jared; tunable, health.config NONSABER_MORTAL): a non-saber
      hit is mortal only at a rounded strike margin of 30 or more; below it the wound stops at
      critical (W 49). Lightsabers are untouched. Measured over 20 lifetimes a profile, mortal
      wounds per life (Obi-Wan / Luke / Anakin / the Average) 2.35 / 5.75 / 14.05 / 0.35 ->
      1.60 / 3.60 / 4.65 / 0.20 (with the harness's fight readiness, D-267), all inside the targets (1-3 / 2-6 / 3-6 / 0-1). Below margin 30,
      a non-Force fighter reaches a killing blow on a Jedi through preparation (architecture §15,
      M8 prepared Jedi hunters), not a lucky shot.
    Measured on a Force user at level 50 (wounding hits, minor/moderate/severe+): a blaster rifle
      55/31/15, a pistol 68/20/11; blaster vs blaster 60/26/14; saber vs saber unchanged 0/6/94.
  Subduing hits (D-262; design defaults, combat.config SUBDUE): a capturing fighter's hits are
    Vitality only, D = the means' base x hit quality - armor: a stun bolt its blaster's base (15 or
    20), a stun weapon in melee 12, nets, whipcords and binders 14, Force Choke 18, low-power
    lightning 18. Nets, binders and a choke go around armor; stun bolts, stun batons and
    lightning are stopped by it as their weapons are. No bypass, no overflow, no wound.

## 5. Wounds
  Wound damage W -> severity: 1-9 minor | 10-19 moderate | 20-34 severe |
    35-49 critical | 50+ mortal
  Hit location (if not chosen by the attack; an aimed strike chooses it, rolls section 5 and
    D-171): torso 35% | left/right arm 25% |
    left/right leg 25% | head 10% | hands 5%
  Limb rule: a lightsaber wound of 35+ to a limb or hand severs it (a lasting injury,
    progression spec section 18) instead of becoming critical or mortal. Only lightsabers sever
    in general (D-260): a non-saber blade (a vibroblade, an amphistaff) severs only on a critical
    hit that leaves a severe wound or worse (W 20+, design default) to the limb of an unarmored
    target who is not a Force user; other weapons never sever (beskar blades and the like are
    M8). Where a striker's hits land follows its strike intent (rolls section 5, D-260); a
    capturing fighter's subduing hits have no location and never sever (D-262).
  Lost and prosthetic limbs (D-164): a limb severed earlier in the same fight cannot be hit
    again (it leaves the location roll; a lost arm takes its hand). A limb lost before the fight
    carries its prosthetic: a hit there costs Vitality only (no wound, no sever); since M8 (D-511, medicine.md §7) the
    wound it would have done damages the prosthetic (W 10+) or breaks it (W 20+): damaged halves its adaptation, broken
    counts as no aid until repaired. A limb is never severed twice.
  Fighting on (D-198): a fighter whose leg is severed, or who has lost a leg with no prosthetic,
    cannot stand or duel: out of the fight (a prosthetic or cybernetic leg is exempt, also while
    the severed wound heals: D-245). A lost or prosthetic leg slows form strikes and cuts the
    fatigue meters' capacity (progression spec section 18; D-251, D-252). A severed weapon arm or
    hand with no prosthetic ends the fight (D-244); the hand switch after a severe arm wound is
    built and switched off.
  Dominant hand (Q39 as amended by D-253): losing the dominant arm or hand switches the dominant
    hand only when the limb is lost and not replaced (no aid, or scar tissue). A prosthetic fitted
    at once counts as whole, and the character keeps the hand.
  Wounds of the same body part do not merge; each heals on its own.
  Location penalties follow Docs/SW_Injury_System_v1.md targeting (arm -> saber and
    strength, leg -> agility, head -> Force and mental, torso -> all), as percentages.

## 6. Status (derived from wounds only)
  Wound load = sum of weights: minor 1 | moderate 3 | severe 6 | critical 10 | mortal 20
  Healthy: load 0
  Hurt: 1-5 | Wounded: 6-11 | Badly wounded: 12-19   (labels for display and narration)
  Status penalty = 0.75% of effective level per wound-load point (load 4: -3%, load 10:
    -7.5%, load 19: -14.25%), added to location penalties. No jumps between labels.
  Incapacitated: load 20+, OR any critical wound to torso or head (cannot fight)
  Dying: any unstabilized mortal wound
  Dead: the dying timer expires, OR a second mortal wound while Dying
  A wound's penalty (its location penalty and its share of the status penalty) eases as it
    heals: it is multiplied by the share still unhealed, 1 - heal progress (a severe arm wound at
    67% healed gives a third of its penalty). The wound load itself, for the labels and for
    incapacitation, does not ease until the wound has healed (Jared, D-203).
  Total wound penalty (status + location) is capped at -50% while still able to fight.
  Dying timer = 10 + Endurance/10 minutes (End 50: 15 min). Force trance or similar
    abilities pause it. Stabilizing (medpac, medical skill, Force healing) converts the mortal
    wound into a stabilized critical wound. Entering Dying always switches pacing to Moment.

## 7. Healing
  Base healing time at rest: minor overnight (7h+ sleep) | moderate 7 days | severe 21 days |
    critical 45 days | stabilized mortal 90 days
  Rate multipliers (combine): medical care x2 | kolto tank x4 (minor 6 hours, moderate 1 day) |
    bacta tank x5 (D-511) | Force healing x(1 + healer level / 50) | training the injured part x0.5
    (with a risk of making it worse). Field care x1 (D-511). The levels of care, the untreated
    risks, wound depth, surgery and toxins: medicine.md.
  Healing runs day by day through the clock's onTimeAdvanced.
  Training the injured part (opt-2 E2, D-539): a session whose skills a wound penalizes marks the wound for the day
    (`injuredPartTrained`); that day it heals at x0.5 and rolls TRAIN_INJURED_WORSEN_CHANCE (2%) to get worse: one band up
    (a minor wound moderate, a moderate severe, a severe critical; critical and mortal never), its healing kept as a share.
  Chance of a lasting injury when it heals: severe 10% | critical 35% | mortal 70%
    (then progression spec section 18 adaptation applies). Since D-511 this is the untreated
    baseline: a wound that had care takes the treatment roll instead (medicine.md §5).

## 8. Pain suppression (temporary, costs Force)
  Control Pain: removes min(60%, level/150) of wound penalties; Force load 0.1/min.
  Battlemind / Force Valor: removes min(50%, level/160); Force load 0.15/min.
  Dark-side pain channeling: removes up to 80%; +1 dark pressure per minute active.
  Suppression never changes status, Dying timers or healing.
  Passive Willpower resistance (Q40, copied by D-63): Willpower removes Willpower / 400 of
    wound penalties (max 25%), always on, no Force load, on top of the abilities above.
  Suppression crash (Q41, copied by D-63): when Battlemind or Force Valor ends while the
    character is wounded, the suppressed penalties return at once and the character takes
    +0.5 mental load.
  In play (opt-2 E1, D-539; health.config SUPPRESSION_POWERS): no catalog entry exists for the four powers, so each reads an
    existing skill: Control Pain and Battlemind Force Control (Battlemind from Force Control 20, invented), Force Valor Battle
    Meditation (the canon sheets' "Force Valor (of Battle Meditation)"), dark-side channeling the Sith path (the alignment
    system that would gate it is M6; its minutes are recorded for the dark pressure). The strongest active one counts (at most
    80%), on the sheet's wound penalty and on the fighter's in a duel.
    Starts: `suppressionBegun`, from the health card's buttons (wounded, a Force path) or from the narrator when the player asks
      for it; the code checks the power is the character's. Allowed while dying: a commander who stays at the post can use it.
    Ends: `suppressionEnded`, by the player's button; or by the code when no wound is left, or when the Force meter passes its
      limit (SUPPRESSION_FORCE_LIMIT, 1.0 of capacity, invented). Ending Battlemind or Force Valor while wounded crashes.
    Force load accrues by the minute (0.1, 0.15, 0.15, 0) through the Force meter's own functions.

## 9. Opponents
  Named NPCs use this full model. Minions (mooks) use a simplified rule: a moderate or
  worse wound takes them out of the fight; Vitality works the same, and a minion also folds when
  Spent (Vitality 0). Minion groups from combatStarted only; named NPCs and the player keep the
  normal rule. How a folded minion goes down is the narration's; whether it counts as dead follows
  the fight's stakes (amended by D-157).
  Morale (D-256, design defaults in combat.config MORALE): an NPC opponent, named or minion, checks
    morale when it takes a severe or worse wound (a sever included), when it is Spent, and when an
    exchange puts half or more of its side out (every standing one checks). A check breaks with its
    group's chance (early 45%, average 20%, late 6%, never 0); a break is a surrender with the
    archetype's share, else the fighter disengages and flees. Groups: civilians (militia, brawlers),
    smugglers and bounty hunters (thugs, mercenaries) early; soldiers average; Jedi, Sith and
    Mandalorians late; the Yuuzhan Vong and droids never; beasts flee and never surrender. A broken
    fighter is out of the fight; a named one's surrender opens the fate choice; the last one breaking
    ends the fight won ("the opponents broke"). The player never checks morale; sparring has none.
  Tactical withdrawal (D-263, D-268) is separate from morale: a losing named Sith duelist
    withdraws at 30%, at most two checks a fight and never unwounded above half its Vitality
    (rolls section 5); it leaves no fate to choose.
    The narration block states each break.
  Cut-down (D-158): against a minion, a build-up margin of 6+ is already a hit (quality by the margin),
  unless the minion wears saber-resistant armor. Mandalorian beskar is rolled per Mandalorian by era
  (npcGen.config BESKAR_BY_ERA); other saber-resistant gear waits for the M8 equipment spec.

## 10. Required tests
 1. Vitality at 0 never changes status by itself.
 2. Status is identical whether computed before or after save/load (no stored status).
 3. Knight (Vitality 63.5, no armor) takes 3 solid blaster-rifle hits with no wound; the 4th
    creates a moderate wound.
    Amended by D-161: rifle grazes below margin 8 are Vitality-only until Vitality is empty (6
    grazes); the 7th is a minor wound (banded overflow); a solid hit at margin 11 is minor, a
    clean hit at margin 14 moderate, a critical at margin 17 severe.
 4. A clean lightsaber hit to the torso of any character is mortal (D 60, fully bypassed);
    to a limb it severs.
 5. A solid lightsaber hit sends 50% to wounds (D 40: severe wound, 20 off Vitality).
 6. Dying timer for End 50 = 15 minutes; stabilizing converts mortal to critical; expiry
    sets Dead; a second mortal wound while Dying sets Dead.
 7. Healing times match section 7 for every severity and multiplier combination tested.
 8. Force meter capacity and loads match section 2; backlash and collapse rules trigger
    only above 1.0 (1.3 when channeling anger).
 9. Pain suppression changes penalties only, never status or timers.
10. Minions leave the fight on a moderate wound, or when Spent (D-157).
11. Willpower 60 removes 15% of wound penalties; Willpower 100+ removes 25% (cap) (Q40).
12. Ending Battlemind or Force Valor while wounded restores the penalties and adds +0.5
    mental load (Q41).
13. A turn with no activity recovers meters at the rest rates; only sleep of 7h+ resets
    them (D-52).
