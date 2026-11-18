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
    (youngling End 15 Str 10: 32 | Knight End 50 Str 45: 63.5 | Master End 80 Str 70 body 40: 97)
  Recovery: resting 50% of max per hour | light activity 15% per hour | none in combat
    (Force healing can restore it) | sleep 7h+ full.
  Vitality 0 = Spent: all further damage goes to wounds, and effective level is reduced 10%.
  Vitality can never cause death or incapacitation.

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

## 5. Wounds
  Wound damage W -> severity: 1-9 minor | 10-19 moderate | 20-34 severe |
    35-49 critical | 50+ mortal
  Hit location (if not chosen by the attack): torso 35% | left/right arm 25% |
    left/right leg 25% | head 10% | hands 5%
  Limb rule: a lightsaber wound of 35+ to a limb or hand severs it (a lasting injury,
    progression spec section 18) instead of becoming critical or mortal.
  Lost and prosthetic limbs (D-164): a limb severed earlier in the same fight cannot be hit
    again (it leaves the location roll; a lost arm takes its hand). A limb lost before the fight
    carries its prosthetic: a hit there costs Vitality only (no wound, no sever) until M8 makes
    it equipment damage. A limb is never severed twice.
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
  Total wound penalty (status + location) is capped at -50% while still able to fight.
  Dying timer = 10 + Endurance/10 minutes (End 50: 15 min). Force trance or similar
    abilities pause it. Stabilizing (medpac, medical skill, Force healing) converts the mortal
    wound into a stabilized critical wound. Entering Dying always switches pacing to Moment.

## 7. Healing
  Base healing time at rest: minor overnight (7h+ sleep) | moderate 7 days | severe 21 days |
    critical 45 days | stabilized mortal 90 days
  Rate multipliers (combine): medical care x2 | bacta tank x4 (minor 6 hours, moderate 1 day) |
    Force healing x(1 + healer level / 50) | training the injured part x0.5 (with a risk of
    making it worse)
  Healing runs day by day through the clock's onTimeAdvanced.
  Chance of a lasting injury when it heals: severe 10% | critical 35% | mortal 70%
    (then progression spec section 18 adaptation applies).

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

## 9. Opponents
  Named NPCs use this full model. Minions (mooks) use a simplified rule: a moderate or
  worse wound takes them out of the fight; Vitality works the same, and a minion also folds when
  Spent (Vitality 0). Minion groups from combatStarted only; named NPCs and the player keep the
  normal rule. How a folded minion goes down is the narration's; whether it counts as dead follows
  the fight's stakes (amended by D-157).
  Cut-down (D-158): against a minion, a build-up margin of 6+ is already a hit (quality by the margin),
  unless the minion wears saber-resistant armor. Mandalorian beskar is rolled per Mandalorian by era
  (npcGen.config BESKAR_BY_ERA); other saber-resistant gear waits for the M8 equipment spec.

## 10. Required tests
 1. Vitality at 0 never changes status by itself.
 2. Status is identical whether computed before or after save/load (no stored status).
 3. Knight (Vitality 63.5, no armor) takes 3 solid blaster-rifle hits with no wound; the 4th
    creates a moderate wound.
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
