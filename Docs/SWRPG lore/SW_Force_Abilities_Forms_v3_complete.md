# Star Wars Legends RPG — Force Abilities & Lightsaber Forms Master List v3.0 (Complete)

> **What's new in v3:** ForceOutput and Intelligence stats added to the system. Proficiency system for sub-abilities added with math grounded in the existing `100 × 1.07^n` XP curve. Anchor stat annotations added to each ability family and sub-ability. Difficulty tier annotations added to sub-abilities. JS implementation spec added at the end.
>
> **v3 Complete edition:** All v2 ability summaries, notes, and sections fully merged. Single canonical reference — no external lookups needed.

This document is the canonical reference for all learnable abilities in the game.
Use this to keep the AI and simulation system consistent. Add new entries as the game expands.

**Alignment Key:** 🔵 Light Side · 🔴 Dark Side · ⚪ Neutral/Universal
**Restriction Key:** ⚠️ Era/Faction/Person locked · 🔒 Requires specific prerequisite chain

---

## STAT SYSTEM (v3 — full stat list)

### Core Stats (characterSheet.stats)
| Stat | Description |
|---|---|
| `strength` | Physical power — raw muscle, melee force, carrying capacity |
| `agility` | Speed, reflexes, coordination, acrobatics |
| `endurance` | Stamina, pain tolerance, strain resistance |
| `willpower` | Mental resolve, resistance to dark side, emotional fortitude |
| `charisma` | Social influence, presence, leadership |
| `intelligence` | **[NEW v3]** Reasoning, tactical acumen, learning speed, cunning. Distinct from Willpower (resolve), Charisma (social), and ForceKnowledge (Force lore). Key for strategists, investigators, scholars. Primary training paths: study, analysis, simulation. |

### Force Stats (characterSheet.forceStats)
| Stat | Description |
|---|---|
| `forceSense` | Perception through the Force — danger sense, life detection, empathy, precognition |
| `meditation` | Inner attunement — battle meditation, Force-trance, calm under pressure, healing trance |
| `forceKnowledge` | Breadth and depth of Force technique lore — theory, history, esoteric arts |
| `forceControl` | Precision and finesse — how honed and refined the application of the Force is |
| `forceOutput` | **[NEW v3]** Raw power and magnitude — how much Force energy can be channeled or unleashed at once |

> **The Output/Control distinction is critical.** A raw powerhouse has high Output but low Control; a refined master has high Control but potentially moderate Output. Training them independently produces genuinely different characters:
> - Force Repulse, Force Lightning, Force Storm → scale primarily with **ForceOutput**
> - Force Choke, Force Levitation, Force Stasis, precise telekinesis → scale primarily with **ForceControl**
> - Most abilities use a weighted blend of both

---

## PROFICIENCY SYSTEM (v3)

### Why it exists
Each Force ability family (Telekinesis, Force Lightning, etc.) has a **base ability level** tracked in `masterXP.forceAbilities`. Sub-applications (Force Push, Force Choke, Chain Lightning, etc.) share the same family foundation. But a character with 94 Force Lightning shouldn't automatically be expert at Force Storm just because they unlocked it. Sub-ability **proficiency** represents how much deliberate practice you've put into that specific application.

### Storage format
```
masterXP.forceAbilityProficiency = {
  "ForceLightning.ForceShock":    { totalProfXP: 0 },
  "ForceLightning.ChainLightning":{ totalProfXP: 0 },
  "ForceLightning.ForceStorm":    { totalProfXP: 0 },
  "Telekinesis.ForcePush":        { totalProfXP: 0 },
  ...
}
```
Keys are `"ParentAbility.SubAbility"`. Proficiency percentage (0–100%) is always **derived** from totalProfXP — never stored directly.

### The proficiency cost curve
Uses the same `1.07` exponential base as the main XP system, tuned for a 0–100% range:

```javascript
function profCostPerPoint(pct, D) {
  // pct = current percentage (0-99)
  // D = difficulty multiplier (1.0 / 1.5 / 2.5 / 4.0)
  return Math.floor(D * 20 * Math.pow(1.07, pct * 0.8));
}

function deriveProficiency(totalProfXP, D) {
  let pct = 0;
  let remaining = Math.max(0, totalProfXP);
  while (pct < 100) {
    const cost = profCostPerPoint(pct, D);
    if (remaining < cost) break;
    remaining -= cost;
    pct++;
  }
  return {
    percentage: pct,
    current: Math.round(remaining),
    required: pct < 100 ? profCostPerPoint(pct, D) : 0
  };
}
```

### Total investment by difficulty
| Difficulty | D value | Total XP (0→100%) | Equivalent base-ability milestone |
|---|---|---|---|
| **Basic** | 1.0 | ~81,700 XP | Same as reaching base ability **level 60** |
| **Moderate** | 1.5 | ~122,550 XP | Same as reaching base ability **level 67** |
| **Complex** | 2.5 | ~204,250 XP | Same as reaching base ability **level 73** |
| **Advanced** | 4.0 | ~326,800 XP | Same as reaching base ability **level 80** |

**What this means in practice** (supervised training at standard intensity = 15 XP/hour):
- 0% → Novice (25%) at D=1.0: **~680 hours** ≈ 4–6 months of regular practice
- 0% → Journeyman (70%) at D=4.0: **~4,000+ hours** ≈ several years of dedicated work
- Mastery (90%+) of any sub-ability is a genuine multi-year achievement

### Proficiency tiers
| Range | Tier | What it means |
|---|---|---|
| 0–25% | **Novice** | Unlocked; functional but rough. High Strain cost, imprecise results, risk of collateral. |
| 26–50% | **Developing** | Getting reliable results; Strain starts normalizing. |
| 51–70% | **Proficient** | Solid combat utility; controlled execution; Strain near baseline. |
| 71–90% | **Expert** | Refined application; Strain significantly reduced; results consistently precise. |
| 91–100% | **Mastered** | Near-perfect expression; minimum Strain; the ability is a genuine signature. |

### Two discount factors that reward doing the groundwork

**1. Base Ability Factor**
| Base Ability Level | Cost Multiplier |
|---|---|
| 0–19 | ×1.00 (no discount) |
| 20–39 | ×0.90 |
| 40–59 | ×0.75 |
| 60–79 | ×0.60 |
| 80–100 | ×0.50 |

**2. ForceControl Factor**
| ForceControl | Cost Multiplier |
|---|---|
| 0–19 | ×1.25 (harder) |
| 20–39 | ×1.10 |
| 40–59 | ×1.00 (baseline) |
| 60–79 | ×0.85 |
| 80–100 | ×0.70 |

**Applying the factors:** When awarding proficiency XP from a training session, multiply the session's contribution by `1 / (BaseAbilityFactor × ControlFactor)`. A session that normally contributes 15 XP toward proficiency, with base ability at 65 (factor 0.60) and ForceControl at 70 (factor 0.85), actually contributes `15 / (0.60 × 0.85) = 29.4 XP`.

### Soft cap
| Base Ability Level | Max Effective Proficiency |
|---|---|
| 0–20 | 25% |
| 21–40 | 50% |
| 41–60 | 70% |
| 61–80 | 85% |
| 81–100 | 100% |

### Trickle rates
- **Training base ability → sub-ability proficiency:** Each training session on the parent ability grants **5% of base XP earned as proficiency XP** to all *already-unlocked* sub-abilities.
- **Training a sub-ability → base ability:** Each dedicated sub-ability session grants **20% of proficiency XP earned back to the base ability** as regular XP (capped at the base ability's `xpRequired` for the current level).

### For NPC character sheets
NPCs don't track proficiency numerically. Use the tier label instead:
```
Force Lightning   (94)  [ForceOutput anchor]
  Force Shock       ● Expert
  Chain Lightning   ● Proficient
  Force Storm       ◌ Novice
```

---

## LIGHTSABER FORMS

| Key (masterXP path) | Display Name | Tradition | Style | Difficulty |
|---|---|---|---|---|
| `ShiiCho` | Shii-Cho (Form I) | Universal | Wide sweeping strikes, disarming | Beginner |
| `Makashi` | Makashi (Form II) | Jedi / Sith | Precise dueling, minimal movement | Intermediate |
| `Soresu` | Soresu (Form III) | Jedi | Defensive, deflection focus | Intermediate |
| `Ataru` | Ataru (Form IV) | Jedi | Acrobatic, aggressive, Force-enhanced | Intermediate |
| `ShienDjemSo` | Shien / Djem So (Form V) | Jedi / Sith | Power strikes, counter-attack | Intermediate |
| `Niman` | Niman (Form VI) | Jedi | Balanced, Force integration | Advanced |
| `Juyo` | Juyo (Form VII) | Sith-leaning | Ferocious, unpredictable | Advanced / Restricted |
| `Vaapad` | Vaapad (Form VII variant) | Light Side only | Channels darkness, requires mastery | Advanced / Restricted |
| `Trakat` | Tràkata | Neutral | Blade deactivation feints | Advanced |
| `JarKai` | Jar'Kai | Neutral | Dual-blade coordination | Advanced |
| `Sokan` | Sokan | Jedi | Terrain exploitation, mobility | Advanced |
| `DunMoch` | Dun Möch | Sith-leaning | Psychological warfare + combat | Restricted |
| `ZeroGravity` | Zero-G Combat | Specialist | Weightless environment adaptation | Specialist |
| `DoubleBlade` | Saberstaff (Double-bladed) | Neutral | Extended weapon, spinning defense | Advanced |

### Form Notes

**Shii-Cho (Form I):** The oldest and most fundamental form. Broad, sweeping strikes designed to disarm multiple opponents. Emphasizes wide coverage over precision. All characters begin here — solo practice unlocks at stat ≥ 15.

**Makashi (Form II):** Elegant dueling form developed as a direct counter to other lightsaber wielders. Minimal footwork, maximum precision. Low physical demand but high mental and willpower requirements. Favored by Count Dooku and Asajj Ventress.

**Soresu (Form III):** The most defensive of all forms. Tight, economical movements designed to deflect blaster bolts and weather overwhelming attacks. Emphasizes endurance and patience. Mastered by Obi-Wan Kenobi.

**Ataru (Form IV):** Highly acrobatic, Force-augmented form emphasizing speed and aggression. Devastating in open spaces but exhausting and impractical in confined areas. Used by Yoda and Qui-Gon Jinn.

**Shien / Djem So (Form V):** Two related sub-variants — Shien optimizes blaster deflection back at shooters; Djem So emphasizes powerful, dominating saber strikes. Both are strength-focused counter-attacking forms. Used by Anakin Skywalker and Darth Vader.

**Niman (Form VI):** The "diplomat's form" — a moderate blend of all previous forms integrated with Force use. No single weakness or strength. Allows Force powers to be woven seamlessly into combat. Used by Exar Kun and Kit Fisto.

**Juyo (Form VII):** ⚠️ Restricted — requires Jedi Council permission. The most aggressive and unpredictable form, drawing on raw emotion to fuel attacks. High mental strain. Dangerous to the practitioner's alignment. Sith-leaning by nature.

**Vaapad (Form VII variant):** ⚠️ **Era-locked — Prequel Era only. Requires Mace Windu to be alive and willing to teach.** Light Side only, requires Juyo 61+. A refined variant of Juyo that channels the practitioner's own darkness *and* the opponent's dark side energy back through the blade. Only Mace Windu truly mastered it. Attempting without guidance risks rapid Dark Side corruption.

**Tràkata:** Neutral technique of deactivating and reactivating the blade mid-combat to feint and confuse opponents. Not a full form — functions as a supplemental style layered onto another form. Some traditionalists consider it dishonorable.

**Jar'Kai:** Dual-blade fighting style. Not a single form but a coordinated system for wielding two sabers simultaneously, drawing on multiple form disciplines. Requires two forms each at Apprentice (21+).

**Sokan:** Jedi mobility technique emphasizing use of terrain — ledges, cover, elevation — to force opponents into disadvantageous positions. Often combined with Ataru.

**Dun Möch:** 🔴 Restricted Sith technique combining combat with psychological warfare — taunting, demoralizing, and breaking the opponent's will. Causes Dark Side drift on use. Considered a dishonor by the Jedi Order.

**Zero-G Combat:** Specialist adaptation for zero-gravity or low-gravity environments. Not a standalone form — a training specialization layered onto existing forms. Rare; primarily military or space-combat oriented.

**Saberstaff (Double-bladed):** Requires separate weapon. Spinning defense and wide-area coverage. High difficulty. Associated with Darth Maul and Zabrak culture. Requires DoubleBlade ≥ 10 before the second blade can be activated in combat.

---

## FORCE ABILITIES

---

### ⚪ TELEKINESIS FAMILY
*Moving objects and people with the Force. The foundational active ability — almost everything physical in the Force traces back here.*
**Anchor Stats:** Burst sub-abilities (Push, Wave, Repulse) → **ForceOutput** primary. Sustained/precise sub-abilities (Choke, Levitation) → **ForceControl** primary. Directional (Pull, Throw) → blend of both.

---

#### Telekinesis ⚪
**Summary:** The ability to move objects with the mind. Ranges from nudging small items to hurling massive structures. The root ability from which most physical Force powers branch.
**Alignment:** Neutral
**Prerequisites:** ForceControl 5+
**Notes:** Foundational. Must be learned before any sub-application below.

> **Sub-applications (all require Telekinesis as root):**

---

#### ↳ Force Push ⚪
**Anchor Stat:** ForceOutput (magnitude of push) + ForceControl (direction/precision)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** A directed burst of telekinetic force that repels a target away from the user. One of the most commonly used combat applications.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 10+
**Notes:** Can be used defensively (deflecting attacks) or offensively (throwing enemies off ledges, creating space).

---

#### ↳ Force Pull ⚪
**Anchor Stat:** ForceControl (precision of grip and vector)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** The inverse of Force Push — draws a target toward the user. Used to disarm opponents, retrieve objects, or drag enemies into melee range.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 10+

---

#### ↳ Force Throw ⚪
**Anchor Stat:** ForceOutput (velocity) + ForceControl (targeting)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Grabs an object (or person) and hurls it as a projectile at high velocity. More controlled than Push but requires locking onto a specific object first.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 15+

---

#### ↳ Force Levitation ⚪
**Anchor Stat:** ForceControl (sustained precision)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Sustained lifting and precise positioning of heavy or large objects. Requires continuous concentration unlike the burst applications of Push/Pull.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 21+
**Notes:** High Force Strain from sustained concentration. Commonly used in training (levitating rocks) and construction/utility contexts.

---

#### ↳ Force Wave ⚪
**Anchor Stat:** ForceOutput (the burst power is the whole point)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** An omnidirectional pulse of telekinetic force radiating outward from the user, pushing everything in a wide arc simultaneously.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 21+, ForceControl 15+
**Notes:** Less precise than Push but covers a full area. Useful against multiple opponents.

---

#### ↳ Force Whirlwind ⚪
**Anchor Stat:** ForceControl (sustaining the vortex precisely)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Telekinetically generates a cyclone of air and debris around a target, trapping them in a spinning vortex. Can incapacitate without direct contact.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 30+, ForceControl 20+
**Notes:** High Strain. Requires sustained concentration to maintain.

---

#### ↳ Saber Throw ⚪
**Anchor Stat:** ForceControl (guiding flight path) + ForceSense (awareness of the arc)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** The user telekinetically throws their lightsaber in a guided arc, controlling its flight path and returning it to hand. A precise and distinctive technique.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 15+, any lightsaber form 10+
**Notes:** The saber can be guided around obstacles. Leaves the user temporarily unarmed — high risk, high reward.

---

#### ↳ Saber Barrier ⚪
**Anchor Stat:** ForceControl (maintaining multiple blades in a defensive pattern simultaneously)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Multiple lightsabers held telekinetically as a defensive screen of spinning blades.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 30+, any lightsaber form 21+
**Notes:** Extremely high Force Strain to maintain. Requires either multiple sabers or exceptional speed.

---

#### ↳ Telekinetic Lightsaber Combat ⚪
**Anchor Stat:** ForceControl (split attention between combat awareness and fine TK)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Fighting with a lightsaber entirely through telekinesis — the user's hand never touches the hilt. The saber flies freely under mental direction.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 41+, any lightsaber form 30+
**Notes:** Master-tier technique. Requires splitting concentration between combat awareness and fine telekinetic control simultaneously.

---

#### ↳ Telekinetic Barrage ⚪
**Anchor Stat:** ForceOutput (sustaining multiple objects at speed) + ForceControl (targeting each)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Simultaneously controlling and hurling multiple objects at a target — rocks, debris, weapons — in a sustained volley.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 41+
**Notes:** Devastating in environments with loose debris. Force Strain scales quickly with the number of objects controlled.

---

#### ↳ Force Repulse ⚪
**Anchor Stat:** ForceOutput (this is a pure power burst — the larger, the more destructive)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** An explosive burst of telekinetic energy released from the user's own body, violently repelling everything nearby.
**Alignment:** Neutral (lethal intent edges toward Dark)
**Prerequisites:** Telekinesis 61+
**Notes:** Galen Marek's signature. One of the clearest Output-dominant abilities in the game — low proficiency + high Output = powerful but indiscriminate; high proficiency adds containment and direction. Strain at Novice proficiency is extreme; at Mastered it becomes (merely) very high.

---

#### ↳ Force Wound → Force Choke → Force Grip → Force Crush → Force Rend 🔴
**Anchor Stat:** ForceControl (precision of grip on specific anatomy) + ForceOutput (can the target break free?)
**Difficulty Tier:** Wound D=1.5 · Choke D=2.5 · Grip D=2.5 · Crush D=4.0 · Rend D=4.0
**Summary:**
- *Force Wound:* Telekinetically constricts the target's internal organs or muscles, causing immediate pain and debilitation without physical contact. Entry-level aggressive application.
- *Force Choke:* The iconic stranglehold — telekinetic constriction of the throat. Non-lethal in short bursts, lethal if sustained.
- *Force Grip:* A more powerful, precise version of Choke — full-body telekinetic immobilization rather than just the throat. The target cannot move at all.
- *Force Crush:* Extends Grip into catastrophic compression — literally crushing the target. Lethal. Almost exclusively Sith.
- *Force Rend:* Telekinetically tears apart a target or object at the molecular level. Exceedingly rare, Sith-only.
**Alignment:** 🔴 Dark Side — all variations. Each step deepens Dark Side alignment.
**Prerequisites:** Force Wound: Telekinesis 21+, Dark Side drift · Force Choke: Force Wound 15+ · Force Grip: Force Choke 15+ · Force Crush: Force Grip 21+, Dark Side 40+ · Force Rend: Force Crush 30+, Dark Side 60+
**Notes:** Using Force Choke on a living being causes Dark Side drift regardless of intent. The Jedi Order explicitly forbids this chain. A character who begins using Wound risks accelerating down this path.

---

#### ↳ Kinetite ⚪/🔴
**Anchor Stat:** ForceOutput (compression magnitude) + ForceControl (formation before throw)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Compresses telekinetic energy into a crackling ball of kinetic force that can be hurled at a target like a grenade, exploding on impact.
**Alignment:** Neutral/Dark-leaning
**Prerequisites:** Telekinesis 30+, ForceControl 25+
**Notes:** Rare technique. Requires intense concentration to form. Explodes with concussive force on contact.

---

#### ↳ Force Orb ⚪
**Anchor Stat:** ForceControl (sustained formation)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Creates a contained sphere of Force energy that can trap objects or serve as a projectile. Unlike Kinetite, it can be sustained rather than immediately detonating.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 25+, ForceControl 20+

---

#### ↳ Force Sphere ⚪
**Anchor Stat:** ForceControl (maintaining a shell rather than directed burst)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A telekinetic barrier formed into a spherical shell around the user, deflecting physical objects and projectiles. Different from Force Barrier (which is energy-based) — this is physically solid.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 30+, ForceBarrier 15+

---

### ⚪ SENSORY FAMILY
*Perceiving the world through the Force. From basic awareness to visions of other times.*
**Anchor Stats:** All sensory abilities anchor to **ForceSense** as primary, with **Meditation** secondary for sustained or deep perception abilities.

---

#### Force Sense ⚪
**Difficulty Tier: N/A (foundational — not a sub-ability)**
**Summary:** The baseline awareness of the Force — sensing living beings nearby, detecting danger, feeling disturbances. The foundation of all sensory Force abilities.
**Alignment:** Neutral
**Prerequisites:** ForceStats.ForceSense 1+ (built in)
**Notes:** Always active at a low level. Training amplifies range, clarity, and subtlety.

---

#### Force Empathy ⚪
**Anchor Stat:** ForceSense (reading emotional resonance)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Reading the emotional state of others through the Force — sensing fear, joy, pain, deception, or intent without the target speaking. Stronger than basic Sense.
**Alignment:** Neutral
**Prerequisites:** ForceSense 10+
**Notes:** Can be done passively (ambient emotional reading) or actively (deliberate probing). Active use is noticeable to Force-sensitive targets.

---

#### Force Sight ⚪
**Anchor Stat:** ForceSense (perceiving Force flows directly)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Perceiving the living Force directly — seeing it flow through beings, objects, and environments. Can be used to see in darkness or beyond physical sight.
**Alignment:** Neutral
**Prerequisites:** ForceSense 21+
**Notes:** Allows a trained user to perceive the world purely through Force connections, bypassing normal vision. Used extensively by blind Force-sensitives.

---

#### Precognitive Reflexes ⚪
**Anchor Stat:** ForceSense (reading incoming threats) + ForceControl (acting on the read in time)
**Difficulty Tier: D=2.5 (Complex)** — the passive always-on version requires sustained refinement
**Summary:** Sensing what is about to happen a fraction of a second before it does — allowing the user to react to attacks before they're launched. The combat application of foresight.
**Alignment:** Neutral
**Prerequisites:** ForceSense 21+, ForceControl 10+
**Notes:** This is largely what makes Jedi seem impossibly fast to normal opponents. Passive when trained enough.

---

#### Environmental Force Sense ⚪
**Anchor Stat:** ForceSense + Meditation (sustaining broad awareness)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Expanding awareness outward to feel the entire living tapestry of an environment — every creature, plant, person, and their emotional states across a wide area.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+
**Notes:** Draining at long range. Experienced users can sense disturbances across kilometers.

---

#### Force Vision ⚪
**Anchor Stat:** ForceSense (cannot be directed — visions surface through it)
**Difficulty Tier: D=4.0 (Advanced)** — cannot be fully controlled even at Grandmaster
**Summary:** Visions of past, present, or future events through the Force — involuntary flashes or deliberately induced meditation visions. Notoriously unreliable and difficult to interpret.
**Alignment:** Neutral
**Prerequisites:** ForceSense 41+
**Notes:** Cannot be fully controlled. What is seen may be symbolic, literal, or conditional. Misinterpreting a vision has historically caused great harm (e.g. Anakin Skywalker).

---

#### Battle Foresight ⚪
**Anchor Stats:** ForceSense (perception of the whole engagement) + ForceControl (filtering signal from noise)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** In the midst of combat, perceiving the flow of the entire engagement — anticipating enemy movements, identifying tactical openings, sensing the moment a battle turns.
**Alignment:** Neutral
**Prerequisites:** ForceSense 61+, ForceControl 41+

---

#### Shatterpoint ⚪

**Summary:** The perception of fracture points — places, moments, objects, or people that are at a critical breaking point where the right action causes the greatest change. More perception than power: not what *is*, but what *could be* and where the lever is.

**Prerequisites (Path A):** ForceSense 61+, ForceKnowledge 51+, Battle Foresight 41+, Meditation 41+
**Prerequisites (Path B — innate):** `ShatterSense` talent flag active (see Innate Talents)

**MECHANICAL TIER: Unique — separate XP track with dual-path mechanics.**
Shatterpoint uses a completely separate proficiency track from all other abilities. It is never stored in `masterXP.forceAbilities`. It has its own track at `masterXP.shatterpoint.main`. The standard XP engine must never process it.

##### Path A — Standard Learning (no innate talent)
Learnable through decades of dedicated training. Per the *Shatterpoint* novel, Mace Windu describes Jedi Masters who spent entire lifetimes working toward a level of perception he possessed naturally at age 7.

- **XP Formula:** `xpRequired(level) = floor(500 × 1.07^level)` — ×5 the standard formula. Level 1 costs ~2,500 XP. Level 5 costs ~15,000 XP total.
- **Force Strain (interpretation):** 20–40 per attempt, scaling with tier depth. Tier 1 reads: 20 strain. Tier 2 reads: 35 strain. Tier 3 reads: not achievable on Path A.
- **Proficiency ceiling:** Hard cap at **level 20** (~57,000 lifetime XP). Limited to Tier 1 and basic Tier 2. Tier 3 permanently beyond reach without innate talent.
- **Reliability:** Below level 10, perception itself is unreliable — must roll even to notice a shatterpoint exists. Above level 10, reliable for Tier 1; Tier 2 perception still requires interpretation roll.

##### Path B — Innate Talent (`ShatterSense` flag)
Born with the perception. Training does not create the ability; it refines and deepens what is already present.

- **Prerequisites:** None — present at birth, seeded at **Level 5** when `ShatterSense` talent is active.
- **XP Formula:** Same high-cost formula as Path A, but **×0.1 XP multiplier** — 90% reduction.
- **Force Strain (interpretation):** ×0.3 of standard (≈6–12 per attempt vs Path A's 20–40). At high proficiency, Tier 1 perception is essentially strain-free.
- **Perception:** Passive and automatic. No roll to perceive — shatterpoints surface like Force Sense surfaces presence. Roll is only for *interpretation*.
- **Proficiency ceiling:** Uncapped. At Level 50+, approaches Mace Windu's full canonical capability.
- **Starting level:** Characters with `ShatterSense` seed at Level 5 automatically.

##### Proficiency Scope by Level (both paths)
| Level | Tier | What Can Be Perceived |
|---|---|---|
| 1–5 | T1 | Physical structural weaknesses — objects, materials, mechanisms |
| 6–10 | T1 | Combat shatterpoints — stance flaws, injuries, openings in a duel |
| 11–20 | T1/T2 | Personal shatterpoints — psychological fractures, defining decisions |
| 21–35 | T2 | Relational shatterpoints — fractures in relationships, alliances |
| 36–50 | T2/T3 | Situational shatterpoints — pivotal moments in unfolding events |
| 51+ | T3 | Event shatterpoints — perceiving the fulcrums of history (Windu-tier) |

Path A caps at Level 20. Path B is uncapped.

##### Awareness Bandwidth in Game
| Depth | Focus Cost |
|---|---|
| Tier 1 — brief tactical read | 20–40 |
| Tier 1 — sustained combat focus | 35–50 |
| Tier 2 — personal read | 50–70 |
| Tier 3 — situational read | 80–90 |

| Focus Level | Ambient Awareness Impact |
|---|---|
| 0–40 | Normal. No degradation. |
| 41–70 | Reduced. May miss peripheral events and beings not in primary focus. |
| 71–100 | **Tunnel Vision active.** Ambient Force awareness severely reduced. Can be surprised by threats not directly in focus. |

**Vaapad amplification:** When Vaapad is active simultaneously with deep Shatterpoint focus, awareness bandwidth cost is multiplied by ×1.3.

##### Rarity Rule
Most scenes have no shatterpoints. The ability is not a combat scanner that pings on every opponent — it is the perception of genuine fracture points, which are rare because genuinely pivotal moments are rare. When deciding whether a shatterpoint exists: ask whether this moment, person, or object is genuinely at a fracture point where one action changes the larger trajectory.

**Notes:** ⚠️ The `ShatterSense` flag is set at character creation or by explicit player override only. The AI cannot grant or remove it. Path A and Path B are permanent — there is no mechanic that converts a Path A learner into a Path B practitioner mid-campaign.

---

#### Farsight ⚪
**Anchor Stats:** ForceSense + Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Extending perception far beyond normal range — sensing events, people, or places at a great distance through the Force, sometimes across planetary distances.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, Meditation 20+
**Notes:** Distinct from Force Vision — Farsight perceives the *present* at a distance, not the future. Range and clarity depend heavily on emotional connection to the target.

---

#### Postcognition ⚪
**Anchor Stats:** ForceSense + ForceKnowledge (interpreting what's perceived)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Reading the Force residue of past events in an object or location — sensing what happened there, who was present, and strong emotions that were felt. Sometimes called "psychometry."
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, ForceKnowledge 15+
**Notes:** Triggered by touching objects or entering locations with significant Force imprints. Strong trauma or dark side events leave vivid impressions.

---

#### Aing-Tii Fighting-Sight ⚪ ⚠️
**Anchor Stats:** ForceSense (hyper-precise present-awareness) + ForceControl (acting on it)
**Difficulty Tier: D=4.0 (Advanced)** — faction-locked; can only be trained via Aing-Tii teaching
**Summary:** A unique Aing-Tii ability that grants hyper-precise awareness of the immediate present — all objects, beings, and their trajectories simultaneously — enabling the practitioner to fight with uncanny precision even blindfolded.
**Alignment:** Neutral (Aing-Tii see the Force as a spectrum, not light/dark)
**Prerequisites:** ForceSense 41+, ForceControl 30+, Aing-Tii approval required
**Notes:** ⚠️ **Faction-locked — requires contact with and approval from the Aing-Tii of the Kathol Rift.** The Aing-Tii rarely share their techniques with outsiders. Jacen Solo and Luke Skywalker are among the few non-Aing-Tii to learn this. Era considerations: accessible from approximately 40 BBY onward in Legends.


---

### ⚪ BODY ENHANCEMENT FAMILY
*Using the Force to push the physical body beyond its natural limits.*
**Anchor Stats:** Speed/strength burst abilities → **ForceOutput** primary. Sustained regulation abilities (Endurance, Breath Control, Tapas) → **Meditation** primary. Precise body control (Force Heal Self, Force Camouflage) → **ForceControl** primary.

---

#### Force Jump ⚪
**Anchor Stat:** ForceOutput (height and distance are raw power)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Channeling the Force through the legs to leap far higher and farther than physically possible. One of the first enhancement abilities Jedi learn.
**Alignment:** Neutral
**Prerequisites:** ForceControl 5+
**Notes:** One of the most visually distinctive Jedi abilities. Height and distance scale with stat level.

---

#### Force Speed ⚪
**Anchor Stat:** ForceOutput (burst acceleration) + ForceControl (sustained without burning out)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Accelerating the body to move faster than humanly possible — a blur of motion that makes the user nearly impossible to track with the naked eye.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+
**Notes:** Very high Physical Strain from sustained use. Short bursts are manageable; sustained Force Speed is exhausting.

---

#### Force Strength ⚪
**Anchor Stat:** ForceOutput (pure amplification burst)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Channeling Force energy into muscles to temporarily amplify physical strength far beyond natural limits.
**Alignment:** Neutral
**Prerequisites:** ForceControl 15+
**Notes:** Not sustained — short explosive bursts. Strain accumulates quickly. Synergizes with Djem So and other strength-based lightsaber forms.
> ⚠️ **Stat reference note:** `ForceStrength` as a prerequisite elsewhere in this document (e.g., Force Rage) refers to *this learnable ability* at the specified level — not to any core or Force stat. There is no stat named ForceStrength in the system.

---

#### Force Endurance ⚪
**Anchor Stat:** Meditation (sustained regulation) + ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Suppressing physical exhaustion through the Force — pushing the body to keep functioning past its natural fatigue threshold.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+, Endurance 10+
**Notes:** Does not eliminate the underlying strain — it defers it. A user who pushes too far will collapse when the ability drops.

---

#### Force-Enhanced Reflexes ⚪
**Anchor Stats:** ForceSense (reading incoming threats) + ForceControl (response precision)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Accelerating neural response time through the Force — enabling faster reactions than physically natural.
**Alignment:** Neutral
**Prerequisites:** ForceSense 15+, ForceControl 10+
**Notes:** Passive when sufficiently trained. Complements Precognitive Reflexes.

---

#### Force Heal (Self) 🔵
**Anchor Stats:** Meditation (attunement to body's state) + ForceControl (directing healing energy)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Channeling the Force into one's own body to accelerate natural healing — closing wounds, neutralizing toxins, recovering from injury far faster than normal.
**Alignment:** Light Side
**Prerequisites:** Meditation 21+, ForceControl 15+
**Notes:** Cannot heal missing limbs or regenerate organs. Works best on wounds, internal damage, and illness. High Force Strain.

---

#### Force Camouflage ⚪
**Anchor Stat:** ForceControl (maintaining the bend in both visual and Force perception simultaneously)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Bending light and Force perception around the user's body to become partially or fully invisible. Different from Force Stealth (which hides the Force presence) — Camouflage affects both visual and Force detection.
**Alignment:** Neutral
**Prerequisites:** ForceControl 41+
**Notes:** Extremely draining. Movement disrupts the camouflage. Requires stillness or very slow movement to maintain full invisibility.

> **Sub-application:**

#### ↳ Force Cloak ⚪
**Anchor Stat:** ForceControl (complete sensory erasure)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A refined and more complete version of Force Camouflage — total concealment from both visual and Force-sensitive detection simultaneously.
**Alignment:** Neutral
**Prerequisites:** ForceCamouflage 30+
**Notes:** ⚠️ One of the rarest stealth abilities. Even other Force-sensitives cannot detect a cloaked user without exceptional skill.

---

#### Breath Control ⚪
**Anchor Stat:** Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** The user can slow their metabolism and oxygen consumption dramatically through Force meditation — surviving without air for extended periods or filtering toxins.
**Alignment:** Neutral
**Prerequisites:** Meditation 15+, Endurance 10+
**Notes:** Old Republic Jedi technique. Allows survival in vacuum for short periods, or in toxic atmospheres. Also used to slow bleeding and regulate body temperature in extremes.

---

#### Tapas ⚪
**Anchor Stat:** Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** The ability to regulate one's own body temperature through the Force — generating warmth internally in extreme cold or suppressing heat in extreme temperatures.
**Alignment:** Neutral
**Prerequisites:** Meditation 21+, Endurance 10+
**Notes:** Survival-oriented ability. Luke Skywalker and Obi-Wan Kenobi used it during cold-climate missions.

---

#### Hibernation Trance ⚪
**Anchor Stat:** Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Entering a Force-induced state of suspended animation — dramatically slowing metabolism, heartbeat, and brain activity to the point of appearing dead, while using minimal resources.
**Alignment:** Neutral
**Prerequisites:** Meditation 30+, Breath Control 15+
**Notes:** Can be held for hours or days. Used to survive injury, vacuum, or captivity. The user cannot act during the trance — they are functionally unconscious.

---

#### Alchaka ⚪ ⚠️
**Anchor Stat:** Meditation (Force-body conditioning)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** An intensely physical Force-meditation technique — a ritualized series of movements and postures repeated to the point of exhaustion to synchronize body and Force. Not combat-relevant but deep spiritual conditioning.
**Alignment:** Neutral (Light Side leaning — Jedi practice)
**Prerequisites:** Meditation 15+, any lightsaber form 10+
**Notes:** ⚠️ **Old Republic era Jedi practice.** Rarely documented outside the Old Republic Jedi Order. Provides passive bonuses to Force attunement and strain recovery when practiced regularly.

---

#### Force Body ⚪
**Anchor Stats:** ForceOutput (burning through personal Force reserves) + ForceControl (directing it)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Converting Force energy directly into physical endurance — allowing the user to ignore mortal wounds and keep fighting at the cost of burning through their own life Force.
**Alignment:** Neutral (extremely dangerous; Light Side users view it as a last resort)
**Prerequisites:** ForceEndurance 30+, ForceControl 30+
**Notes:** Severe risk. Every wound ignored with Force Body still exists physically — the user is burning life force to remain conscious. Death or permanent injury is likely if overused.

---

#### Resist Aging ⚪
**Anchor Stat:** Meditation (sustained attunement required daily)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Slowing the natural aging process through sustained Force attunement and cellular control. Not immortality — significantly extended lifespan.
**Alignment:** Neutral
**Prerequisites:** Meditation 41+, ForceControl 30+, ForceKnowledge 21+
**Notes:** Passive when sufficiently developed. Explains why experienced Jedi Masters like Yoda live for centuries. Requires consistent daily meditation — lapsing causes accelerated aging.

---

### ⚪ MENTAL & SOCIAL FAMILY
*Influencing, reading, and interacting with other minds.*
**Anchor Stats:** Mind influence abilities → **ForceControl** (precision of mental touch) + **ForceSense** (reading the target's resistance). Analytical abilities → **ForceKnowledge** + **Meditation**.

---

#### Mind Trick ⚪
**Anchor Stats:** ForceControl + ForceSense (reading whether the trick is landing)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Using the Force to influence the thoughts of susceptible beings — planting suggestions, altering perceptions, or causing the target to forget. Works best on weak-willed or unfocused minds.
**Alignment:** Neutral
**Prerequisites:** ForceControl 15+, Willpower 10+
**Notes:** Does not work on strong-willed individuals, those aware of the technique, or beings without conventional minds (droids, Hutts, Toydarians). The classic "these aren't the droids you're looking for."

> **Sub-applications:**

#### ↳ Force Persuasion ⚪
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A more powerful and sustained form of mind influence — strong enough to overcome resistance in moderately strong-willed targets.
**Alignment:** Neutral
**Prerequisites:** MindTrick 21+, Charisma 15+
**Notes:** More force required; more noticeable to Force-sensitives nearby.

#### ↳ Mind Control 🔴
**Anchor Stats:** ForceControl (overriding a will entirely requires extreme precision)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Total domination of another mind — overriding their will entirely, making them act against their deepest instincts.
**Alignment:** Dark Side — causes significant drift
**Prerequisites:** MindTrick 30+, ForceControl 30+, Dark Side drift 15+
**Notes:** Forbidden by the Jedi Order. The controlled subject is aware of what is happening, causing psychological trauma. Continued use causes permanent mental damage to the victim.

#### ↳ Force Projection ⚪
**Anchor Stats:** ForceControl + ForceOutput (sustaining the illusion requires power)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Creating a convincing Force-generated illusion of a person or place in another's mind — making them see, hear, or believe something that isn't there.
**Alignment:** Neutral (can be Dark if used to deceive lethally)
**Prerequisites:** MindTrick 21+, ForceControl 25+
**Notes:** Distinguished from Doppelganger (a physical-seeming projection) — Force Projection is purely mental/perceptual.

#### ↳ Force Fear 🔴
**Anchor Stats:** ForceControl (precision) + ForceSense (reading the target's specific vulnerabilities)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A dark-side application of Mind Trick — rather than planting a suggestion, projecting the sensation of all-consuming terror directly into a target's mind. Overwhelms rational thought with irrational fear.
**Alignment:** Dark Side — causes drift
**Prerequisites:** MindTrick 21+, Dark Side drift 10+
**Notes:** Distinct from **Summon Fear** (Sith sorcery, see Sith Alchemy section) — Force Fear is a targeted mind-influence application; Summon Fear draws on the dark side itself to manifest dread rather than projecting it through Force Touch.

#### ↳ Force Horror 🔴
**Anchor Stats:** ForceControl + ForceSense (deeper intrusion than Force Fear)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A deeper, more total version of Force Fear — the target experiences not just terror but a complete collapse of mental defenses, confronting their deepest horrors in overwhelming detail. Can leave lasting psychological damage.
**Alignment:** Dark Side — severe drift
**Prerequisites:** ForceFear 21+, Dark Side 30+
**Notes:** The target may be incapacitated entirely or driven to extreme action. Extended exposure risks permanent psychological harm.

#### ↳ Force Insanity 🔴
**Anchor Stats:** ForceControl (precision required to shatter rather than simply terrify)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The most extreme mental Mind Trick application — fracturing a target's grip on reality itself through sustained dark-side psychic pressure. The victim loses the ability to distinguish real from unreal.
**Alignment:** Dark Side — extreme drift
**Prerequisites:** ForceHorror 21+, Dark Side 50+
**Notes:** Distinguished from Force Horror in that it doesn't just overwhelm — it fundamentally destabilizes cognition. Recovery is possible but takes extended time. Considered one of the cruelest Force techniques.

---

#### Mind Probe 🔴
**Anchor Stats:** ForceControl (surgical entry) + ForceSense (navigating the target's mind)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Forcibly entering another mind to read specific memories or knowledge — an invasive telepathic attack.
**Alignment:** Dark Side leaning (painful and violating; Jedi consider it deeply unethical)
**Prerequisites:** ForceControl 41+, ForceSense 30+
**Notes:** Causes psychological harm to the target. Resisted by strong will. Used extensively by Sith Inquisitors.

---

#### Drain Knowledge 🔴
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Ripping specific knowledge, skills, or memories permanently from a target's mind — the user gains the knowledge while the victim loses it.
**Alignment:** Dark Side
**Prerequisites:** MindProbe 21+, Dark Side 20+
**Notes:** Leaves permanent gaps in the victim's memory. Trauma often accompanies the absorbed knowledge. A Sith technique.

---

#### Memory Walk (Torture by Chagrin) 🔴
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Forcing a victim to relive their most painful memories in an amplified, inescapable loop. Used as interrogation torture.
**Alignment:** Dark Side
**Prerequisites:** MindProbe 30+, Dark Side 25+
**Notes:** ⚠️ Leaves lasting psychological damage. The Fallanassi call a variant of this "Blood Trail." Extremely dark technique.

---

#### Mind Shard 🔴
**Anchor Stats:** ForceControl + ForceSense (precision psychic attack)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Injecting a splinter of pain, confusion, or madness directly into a target's mind — a precision psychic attack causing immediate mental disruption.
**Alignment:** Dark Side
**Prerequisites:** MindProbe 21+, Dark Side 20+
**Notes:** Effective in combat for momentarily breaking concentration. Extended use causes permanent mental damage.

---

#### Force Insight ⚪
**Anchor Stats:** ForceKnowledge + Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Heightened analytical reasoning through the Force — seeing patterns, connections, and solutions that are invisible to normal cognition.
**Alignment:** Neutral
**Prerequisites:** ForceKnowledge 21+, Meditation 15+

---

#### Force Comprehension ⚪
**Anchor Stats:** ForceKnowledge + Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Rapidly absorbing and understanding written or spoken information — reading at superhuman speed with full retention, or grasping the meaning of unknown languages through Force attunement.
**Alignment:** Neutral
**Prerequisites:** ForceKnowledge 15+, Meditation 10+
**Notes:** Different from Comprehend Speech (which is auditory/linguistic) — Force Comprehension is broader analytical acceleration.

---

#### Comprehend Speech ⚪
**Anchor Stats:** ForceSense + ForceKnowledge
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Briefly understanding any spoken language through the Force — not learning the language, but perceiving intent and meaning through Force-attuned intuition.
**Alignment:** Neutral
**Prerequisites:** ForceKnowledge 21+, ForceSense 15+
**Notes:** Temporary and imperfect — conveys meaning and emotion, not precise vocabulary. Useful for initial contact with unknown species.

---

#### Force Listening ⚪ ⚠️
**Anchor Stats:** Meditation + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A deep meditative technique of the Theran Listeners — allowing the user to hear the voice of the Force itself speaking through living things, providing guidance and insight unavailable through normal sense or meditation.
**Alignment:** Neutral (Light Side leaning)
**Prerequisites:** Meditation 41+, ForceSense 30+
**Notes:** ⚠️ **Faction-locked — primarily a Theran Listener tradition.** Extremely rare outside this tradition. Requires complete stillness and silence to initiate.

---

#### Battlemind 🔵
**Anchor Stat:** Meditation (stillness under pressure)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A Force-enhanced mental state of absolute focus and calm in combat — suppressing fear, doubt, and distraction, allowing perfect clarity under lethal pressure.
**Alignment:** Light Side
**Prerequisites:** Meditation 21+, Willpower 20+
**Notes:** Different from Force Rage (which amplifies anger) — Battlemind amplifies calm clarity. Used by Jedi to maintain composure in overwhelming situations.

---

#### Force Valor 🔵
**Anchor Stats:** Meditation + Charisma
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting confidence, courage, and clarity through the Force to nearby allies — boosting their resolve, reaction time, and performance in combat or crisis.
**Alignment:** Light Side
**Prerequisites:** Battlemind 15+, Charisma 15+
**Notes:** Aura-effect ability. Affects nearby allies passively when active. Distinct from Battle Meditation (which is strategic) — Force Valor is personal morale amplification.

---

### ⚪ DEFENSE FAMILY
*Protecting oneself and others from harm.*
**Anchor Stats:** All Force Barrier family → **ForceControl** (sustaining a precise energy shell) + **ForceOutput** (how strong the shell is). Healing/absorb → **Meditation** primary.

---

#### Force Barrier ⚪
**Anchor Stats:** ForceControl (shell precision) + ForceOutput (shell strength)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Generating a telekinetic field of Force energy around the user that deflects physical impacts, mitigates energy attacks, and generally reduces incoming damage. Every Padawan-level Force user has a passive version.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+
**Notes:** Always partially active for trained Force users. Breaks under sustained pressure, overwhelming power, or high strain. Recovers slowly.

> **Sub-applications:**

#### ↳ Protection Bubble ⚪
**Anchor Stats:** ForceControl + ForceOutput (scale of protection)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting the Force Barrier outward into a spherical shell large enough to protect multiple people simultaneously.
**Alignment:** Neutral
**Prerequisites:** ForceBarrier 30+, ForceControl 25+
**Notes:** Drains Force rapidly. More useful in a crisis than sustained combat.

---

#### Tutaminis 🔵
**Anchor Stats:** Meditation (the energy dissipation discipline requires deep attunement) + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The Jedi discipline of energy dissipation — the art of absorbing, redirecting, or nullifying any incoming energy through the body or hands. **Tutaminis is the parent discipline** from which Force Absorb (a specific sub-application) derives. Demonstrated by Yoda (absorbing Dooku's Force Lightning through his hands) and Mace Windu. Requires extreme skill, composure, and deep meditative attunement.
**Alignment:** Light Side
**Prerequisites:** ForceBarrier 21+, Meditation 21+, ForceControl 21+
**Notes:** At high proficiency, a practitioner can absorb lightsaber strikes and blaster bolts channeled directly through the hands or body. This is the ability that makes a master Jedi nearly impossible to harm with energy weapons at close range. Very rare.

> **Sub-application:**

#### ↳ Force Absorb 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A specific application of Tutaminis — actively drawing in Force-based attacks (telekinesis bursts, Force Lightning, Force pushes) and neutralizing or converting them into the user's own reserves.
**Alignment:** Light Side
**Prerequisites:** Tutaminis 15+, Meditation 15+
**Notes:** Focused on Force-energy specifically (rather than physical-energy attacks, which require higher Tutaminis mastery). Passive Force attacks can be absorbed at lower proficiency; concentrated lightning or Sith sorcery requires significant skill.

---

#### Force Resistance ⚪
**Anchor Stats:** Willpower + ForceControl (passive defense)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Strengthening the mind and body against Force-based attacks — reducing the effectiveness of Mind Tricks, Force Lightning, Force Drain, and similar assaults.
**Alignment:** Neutral
**Prerequisites:** ForceBarrier 15+, Willpower 20+
**Notes:** Passive defense that scales with training. A high-resistance user can partially shrug off abilities that would otherwise be devastating.

---

#### Wall of Light 🔵 ⚠️
**Anchor Stats:** ForceOutput (requires multiple users' combined power) + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A devastating Light Side technique — multiple Jedi combining their Force power to create a wall of pure light side energy that severs an area from the dark side of the Force, destroying or driving out dark side entities, spirits, and Sith.
**Alignment:** Light Side only
**Prerequisites:** Tutaminis 21+, ForceControl 41+, ForceKnowledge 41+, Light Side alignment 30+
**Notes:** ⚠️ **Requires multiple Force-users acting in concert — cannot be performed alone.** One of the most powerful Light Side techniques in Legends. Used to destroy Exar Kun's spirit on Yavin IV. The massive Force expenditure required is extremely debilitating for all participants.

---

#### Force Suppression ⚪
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Dampening or temporarily nullifying the Force connection of another being — making it difficult or impossible for them to use Force abilities.
**Alignment:** Neutral (Light Side uses it to restrain; Dark Side uses it to dominate)
**Prerequisites:** ForceControl 41+, ForceKnowledge 30+
**Notes:** Does not permanently sever the connection (that is Sever Force). Temporary suppression during a confrontation.

> **Sub-application:**

#### ↳ Force Breach ⚪
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Actively tearing through a Force Barrier or Force protection to expose the opponent underneath.
**Alignment:** Neutral
**Prerequisites:** ForceSuppression 15+

---

#### Sever Force 🔴/🔵 ⚠️
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Permanently cutting a Force-sensitive being off from the Force — a devastating, irreversible act. The victim loses all Force ability permanently.
**Alignment:** Dark Side if used offensively; Light Side context if used as a mercy or protective measure
**Prerequisites:** ForceControl 61+, ForceKnowledge 51+, ForceSuppression 30+
**Notes:** ⚠️ **Exceptionally rare and grave.** The Jedi Order considers this only in extreme circumstances — it is equivalent to destroying a core part of a person's identity. Causes permanent trauma to the victim regardless of circumstances.

---

#### Battle Meditation 🔵
**Anchor Stat:** Meditation — this is the defining Meditation ability; ForceOutput matters for range/scale
**Difficulty Tier: D=4.0 (Advanced)** — mastering this to any meaningful level takes years
**Summary:** The user extends their consciousness across an entire battlefield through the Force — coordinating allied forces, amplifying their cohesion and morale while inducing confusion and despair in enemies. Strategic ability.
**Alignment:** Light Side (a Dark Side variant exists but is destabilizing)
**Prerequisites:** Meditation 61+, ForceControl 41+, ForceKnowledge 30+
**Notes:** One of the most strategically powerful Force abilities in Legends. Nomi Sunrider, Bastila Shan, and Darth Nihilus (inverted) are notable practitioners. Extremely rare. The practitioner is immobilized while active — they become a strategic anchor, not a combatant. Distinct from Battle Foresight (personal) — Battle Meditation affects entire allied forces.
> **Innate Talent:** `BattleMeditationAffinity` — XP cost ×0.3, Force Strain ×0.6. Equivalent innate case to ShatterSense. Bastila Shan is the canonical example. See Innate Talents section.

---

#### Electric Judgment 🔵 ⚠️
**Anchor Stat:** ForceControl (channeling compassion rather than hatred is the key precision act)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A light side variant of Force Lightning — channeling Force energy through the hands as a bolt of golden or purple-white light. Stuns and incapacitates rather than kills.
**Alignment:** Light Side (distinct from Force Lightning's Dark Side nature)
**Prerequisites:** ForceControl 41+, Willpower 40+, Light Side 40+
**Notes:** ⚠️ **Controversial and rare.** Plo Koon was one of the few Jedi to use this. The Jedi Council historically discouraged it due to its visual similarity to Sith lightning, regardless of alignment. The technique channels compassion rather than hatred — intent is everything.

---

### 🔵 HEALING FAMILY
*Restoring life, health, and vitality.*
**Anchor Stats:** All healing abilities anchor to **Meditation** primary + **ForceControl** secondary. Dark Transfer adds ForceKnowledge.

---

#### Force Heal (Others) 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Channeling healing Force energy into another person's body — accelerating recovery from wounds, illness, or injury.
**Alignment:** Light Side
**Prerequisites:** ForceHeal (Self) 21+, Light Side alignment 10+
**Notes:** More demanding than self-healing. Requires physical contact or very close proximity.

---

#### Revitalize 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Restoring stamina, consciousness, and alertness to an incapacitated or exhausted ally — bringing them back to fighting capacity.
**Alignment:** Light Side
**Prerequisites:** ForceHeal (Others) 21+, Meditation 20+
**Notes:** Cannot restore HP directly — it restores functional capacity. A character revitalized after major injury can act but their wounds remain.

---

#### Transfer Force 🔵
**Anchor Stats:** Meditation + ForceOutput
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Channeling one's own Force reserves directly into another Force-sensitive — sharing life force to sustain them, heal them, or boost their abilities.
**Alignment:** Light Side
**Prerequisites:** ForceHeal (Others) 30+, ForceBarrier 15+
**Notes:** Depletes the giver's own Force reserves and potentially their life force. Used as a last resort to sustain a dying Force-user.

---

#### Detoxify Poison ⚪
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Using the Force to neutralize toxins, venoms, or chemical agents in one's own or another's body.
**Alignment:** Neutral
**Prerequisites:** Meditation 15+, ForceHeal 10+
**Notes:** Works against biological toxins and most chemical agents. High-tech or exotic poisons (like Sith alchemical substances) are harder to neutralize.

---

#### Cure Disease ⚪
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Channeling Force energy to fight and eliminate disease or infection within a body.
**Alignment:** Neutral
**Prerequisites:** ForceHeal (Self) 15+
**Notes:** Less effective against engineered or Force-enhanced diseases. Takes hours to days for serious illness.

---

#### Dark Transfer 🔴/🔵 ⚠️
**Anchor Stats:** ForceKnowledge + Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The ability to pull a recently deceased person back from death — reversing the transition from life to death. An extraordinarily rare and demanding ability.
**Alignment:** ⚠️ In Legends this was developed by Darth Plagueis as a Dark Side power; a compassionate application was demonstrated by Abeloth. Deeply controversial.
**Prerequisites:** ForceHeal (Others) 61+, Midi-chlorian Manipulation 30+ OR extreme innate talent
**Notes:** ⚠️ **Exceptionally rare — borderline mythical.** Only the most powerful healers or dark side practitioners have achieved it. The Force pushes back against this technique.

---

### 🔵 LIGHT SIDE FAMILY
*Powers accessible only to those aligned with the Light Side of the Force.*
**Anchor Stats:** Varies by ability — Meditation dominant for calm/aura abilities, ForceOutput for Force Light, ForceControl for Malacia.

---

#### Force Light 🔵
**Anchor Stats:** ForceOutput + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting a pulse or sustained beam of pure light side Force energy — anathema to dark side beings and entities. Purifies dark side corruption in objects, places, and beings.
**Alignment:** Light Side
**Prerequisites:** ForceBarrier 30+, ForceKnowledge 30+, Light Side 30+
**Notes:** Effective against Sith spirits, dark side nexuses, and Force wraiths. Can be used offensively against dark side Force-users, but is not a standard combat tool.

---

#### Force Enlightenment 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A temporary transcendent state in which all of the user's Force abilities operate at peak efficiency simultaneously — a moment of perfect attunement.
**Alignment:** Light Side
**Prerequisites:** Meditation 61+, ForceControl 51+, all primary abilities at Adept tier
**Notes:** Cannot be forced or rushed — arises from complete serenity. Brief duration. Extremely rare. Associated with Jedi Consular mastery.

---

#### Aura of Serenity 🔵
**Anchor Stats:** Meditation + Charisma
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting calm, peace, and emotional equilibrium outward through the Force — soothing agitated beings, de-escalating confrontations, and calming animals or crowds.
**Alignment:** Light Side
**Prerequisites:** Meditation 41+, Willpower 30+

---

#### Malacia 🔵
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Disrupting a target's inner ear through the Force — causing severe disorientation, nausea, and loss of balance without any physical damage. Non-lethal incapacitation.
**Alignment:** Light Side (uniquely non-harmful; considered acceptable by most of the Jedi Order)
**Prerequisites:** ForceControl 41+, MindTrick 21+
**Notes:** One of the few combat Force abilities the Jedi Order broadly approves of, as it incapacitates without causing injury. Effective even against physically powerful opponents.

---

#### Floating Meditation 🔵
**Anchor Stats:** Meditation + Telekinesis (the ability, not the stat)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** During deep meditative states, levitating the body above the ground — a visible manifestation of deep Force communion.
**Alignment:** Light Side leaning (Neutral in pure practice)
**Prerequisites:** Meditation 41+, Telekinesis 21+
**Notes:** No combat application — purely a meditative state. Demonstrates exceptional attunement.

---

#### Revelation 🔵
**Anchor Stats:** ForceSense + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Perceiving hidden truths — deception, concealed motives, hidden objects, or masked identities — through intense Force clarity.
**Alignment:** Light Side
**Prerequisites:** ForceSense 41+, ForceKnowledge 30+, Light Side 20+
**Notes:** Different from Mind Probe (which is invasive and painful) — Revelation is more like a blinding moment of clarity. The target need not be cooperative.


---

### 🔴 DARK SIDE FAMILY
*Powers accessible only to those who have embraced the dark side of the Force.*
**Anchor Stats:** Destructive/discharge abilities (Lightning, Rage, Drain) → **ForceOutput** primary. Psychological/subtle dark abilities (Fear, Subjugate, Memory Walk) → **ForceControl** primary.

---

#### Force Lightning 🔴
**Anchor Stat:** ForceOutput (the discharge itself) — ForceControl governs precision and Strain efficiency
**Summary:** Channeling raw dark side energy through the hands as destructive electrical discharge — one of the most iconic and feared Sith abilities. Causes extreme pain and physical damage.
**Alignment:** Dark Side — use causes drift regardless of intent
**Prerequisites:** ForceControl 41+, Dark Side alignment 20+
**Notes:** **Requires organic limbs.** Cybernetic hands cannot channel Force Lightning (Darth Vader's limitation). High Force Strain per use.

> **Sub-applications:**

#### ↳ Force Shock 🔴
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** A minor, quick discharge of Force Lightning — less powerful but faster and less draining. A "snap" of electrical Force energy.
**Alignment:** Dark Side
**Prerequisites:** ForceLightning 10+
**Notes:** Can be used as a quick distracting attack or intimidation tool.

#### ↳ Chain Lightning 🔴
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Force Lightning that arcs between multiple targets — a single bolt that leaps from person to person in a chain.
**Alignment:** Dark Side
**Prerequisites:** ForceLightning 30+, Dark Side 30+
**Notes:** Exponentially more draining than standard Lightning. Requires clear lines between targets.

#### ↳ Force Storm (Lightning) 🔴
**Anchor Stat:** ForceOutput — the definitive raw-power expression
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A massive, sustained electrical maelstrom that fills an area with arcing lightning — area-of-effect devastation.
**Alignment:** Dark Side — severe drift
**Prerequisites:** ForceLightning 61+, Dark Side 60+
**Notes:** ⚠️ One of the most destructive single-user abilities in Legends. Used by Palpatine. Extreme Force drain; endangers the user if sustained. A perfect case of the Output/Control gap: high Output + minimal proficiency = powerful but wild and indiscriminate; high proficiency + strong Output = the controlled, fleet-devastating storm of a Palpatine.

---

#### Force Drain 🔴
**Anchor Stats:** ForceOutput (magnitude of leeching) + ForceControl (sustaining without destabilizing)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Leeching life force, Force energy, or physical vitality from living beings to sustain and empower oneself. The parasitic dark side power.
**Alignment:** Dark Side
**Prerequisites:** ForceControl 30+, Dark Side 25+
**Notes:** Addictive tendency — each use makes the temptation stronger. At high levels (Darth Nihilus, Vitiate), can drain an entire planet's population.

---

#### Force Rage 🔴
**Anchor Stat:** ForceOutput (rage amplifies raw power directly)
**Difficulty Tier: D=1.5 (Moderate)** — easy to start, hard to stop
**Summary:** Channeling anger, hatred, and emotion into a surge of Force-enhanced physical power — temporarily amplifying speed, strength, and aggression dramatically at the cost of control and alignment.
**Alignment:** Dark Side — severe drift
**Prerequisites:** ForceStrength 15+, Dark Side drift 20+
**Notes:** *(Prerequisite refers to the Force Strength body enhancement ability at level 15+, not a stat — see stat reference note in that entry.)* During Force Rage the user is difficult to reason with and may attack allies. The crash afterward leaves significant physical strain and mental exhaustion. Addictive.

---

#### Force Scream 🔴
**Anchor Stats:** ForceOutput (the burst) + Willpower
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A psychic burst of raw emotional pain, grief, or rage released through the Force — a wave of Force energy that disrupts concentration and causes psychological pain to those nearby.
**Alignment:** Dark Side leaning (can emerge involuntarily from trauma — less alignment cost if involuntary)
**Prerequisites:** Dark Side drift 40+, Willpower 40+
**Notes:** Often triggered involuntarily by great trauma or grief (Darth Vader on learning of Padmé's death). A controlled version can be used as a weapon.

---

#### Waves of Darkness 🔴
**Anchor Stats:** ForceOutput + Dark Side alignment
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting an aura of pure dark side Force energy outward — causing dread, disorientation, and despair in all nearby beings. Environmental dark side manifestation.
**Alignment:** Dark Side — severe drift
**Prerequisites:** Dark Side 50+, ForceControl 41+
**Notes:** Area effect. Corrupts Force nexuses and weakens Light Side users in the affected area.

---

#### Darksight 🔴
**Anchor Stat:** ForceSense (dark-attuned perception)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Perceiving the dark side of the Force as a source of vision — seeing in complete darkness, sensing dark side nexuses and Sith artifacts, and perceiving dark side influence in beings.
**Alignment:** Dark Side
**Prerequisites:** ForceSense 21+, Dark Side 15+
**Notes:** Complementary ability to Force Sight (which perceives the living Force) — Darksight perceives the dark currents specifically. Sith naturally develop this.

---

#### Dark Energy Trap 🔴
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Setting a Force-imbued trap — a node of stored dark side energy that triggers on contact, delivering a burst of Force damage or mental disruption.
**Alignment:** Dark Side
**Prerequisites:** ForceControl 41+, Dark Side 30+
**Notes:** Requires preparation time. Used by Sith to protect locations or objects.

---

#### Deadly Sight 🔴 ⚠️
**Anchor Stats:** ForceOutput (magnitude of destruction) + ForceControl (sustained, directed gaze)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The extremely rare and terrifying ability to kill through pure Force concentration — projecting destructive Force energy through the user's gaze.
**Alignment:** Dark Side — extreme drift
**Prerequisites:** Dark Side 70+, ForceControl 71+
**Notes:** ⚠️ **Exceptionally rare — considered legendary even among the Sith.** Few practitioners in all of recorded history. Massive Force drain. Direct sustained eye contact required.

---

#### Force Subjugate 🔴
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Breaking a target's will entirely through sustained Force pressure — similar to Mind Control but more thorough and more permanently damaging.
**Alignment:** Dark Side — severe drift
**Prerequisites:** MindControl 21+, Dark Side 30+
**Notes:** Distinct from Mind Control — Subjugate can reshape a person's fundamental personality and loyalties over time. Used by Sith to create servants.

---

#### Sutta Chwituskak 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** An ancient Sith power of unknown exact mechanism — believed to be a form of Force-based psychological domination or spiritual corruption.
**Alignment:** Dark Side
**Prerequisites:** ForceKnowledge 61+, Dark Side 60+
**Notes:** ⚠️ **Ancient Sith technique.** Extremely obscure. Likely era-locked to early Sith Empire periods.

---

#### Fiery Energy 🔴
**Anchor Stats:** ForceOutput + Dark Side alignment
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Channeling destructive dark side Force energy into fire — feeding, directing, and amplifying existing flames or igniting combustible material.
**Alignment:** Dark Side (see also Pyrokinesis for neutral variant)
**Prerequisites:** Dark Side 30+, Telekinesis 21+
**Notes:** Related to but distinct from Pyrokinesis. The dark side application is more destructive and less controlled.

---

#### Spear of Midnight Black (Darkshear) 🔴 ⚠️
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A focused projection of pure dark side Force energy shaped into a blade or spear — a weapon of compressed darkness that bypasses physical defenses.
**Alignment:** Dark Side — severe drift
**Prerequisites:** Dark Side 60+, ForceControl 61+
**Notes:** ⚠️ **Extremely rare Sith technique.** Associated with ancient Sith sorcerers. The technique leaves a distinctive dark side signature in the Force.

---

### ⚪ TELEPORTATION & SPACE/TIME FAMILY
*The rarest abilities — manipulating the fabric of space and time through the Force.*
**Anchor Stats:** ForceControl (folding space) + ForceSense (perceiving where you're going). Meditation dominant for faction techniques (Phase, Fold Space).

---

#### Flow-Walking ⚪ ⚠️
**Anchor Stats:** ForceSense (perceiving the time current) + Meditation (sustaining projection)
**Difficulty Tier: D=4.0 (Advanced)** — faction-locked AND inherently advanced
**Summary:** The extraordinary ability to project one's consciousness (and in advanced cases, one's physical presence) backward or forward along the currents of the Force — experiencing the past or potential future firsthand.
**Alignment:** Neutral (Aing-Tii tradition)
**Prerequisites:** ForceSense 61+, ForceControl 51+, must be taught by Aing-Tii
**Notes:** ⚠️ **Faction-locked — Aing-Tii monks. Exceptionally rare outside this tradition.** Jacen Solo and Luke Skywalker learned it from the Aing-Tii. Cannot change the past — only observe. Advanced practitioners (time-drifting) can actually move through time, which is dangerous and destabilizing.

---

#### Teleportation ⚪ ⚠️
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Instantaneous physical movement through the Force across distances — from meters to potentially kilometers. Folds space around the user.
**Alignment:** Neutral
**Prerequisites:** ForceControl 81+, ForceSense 61+
**Notes:** ⚠️ **Mythically rare.** Almost no documented cases in the Legends timeline. The Phase technique (Fallanassi) is related. Extraordinarily draining.

---

#### Phase ⚪ ⚠️
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Immersing oneself in the White Current (the Fallanassi name for the Force) to become temporarily intangible — passing through physical objects or becoming invisible to Force perception.
**Alignment:** Neutral (Fallanassi tradition)
**Prerequisites:** Meditation 51+, ForceControl 41+, must be taught by Fallanassi
**Notes:** ⚠️ **Faction-locked — exclusively a Fallanassi (White Current) technique.** The Fallanassi are a Force-sensitive group who retreated from the wider galaxy. Era consideration: Fallanassi encountered primarily in the New Republic era.

---

#### Fold Space ⚪ ⚠️
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A Fallanassi technique of manipulating the White Current to teleport objects or small groups across distances — distinct from the full Teleportation ability.
**Alignment:** Neutral (Fallanassi tradition)
**Prerequisites:** Meditation 51+, ForceControl 51+, Fallanassi teaching required
**Notes:** ⚠️ **Faction-locked — Fallanassi tradition only.** Era consideration: primarily accessible in New Republic era.

---

#### Art of the Small ⚪ ⚠️
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The ability to shrink one's Force presence (and eventually physical consciousness) to a microscopic level — perceiving and existing at the cellular or molecular scale. Used for healing from within, sensing microscopic damage, or hiding within a living being's body.
**Alignment:** Neutral
**Prerequisites:** Meditation 51+, ForceControl 41+
**Notes:** ⚠️ **Extremely rare.** Associated with the Neti Jedi Master Ood Bnar. Requires extraordinary sustained concentration.

---

#### Dimension Shift ⚪ ⚠️
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Briefly shifting one's physical form partially outside normal space — passing through objects or becoming intangible for a moment.
**Alignment:** Neutral
**Prerequisites:** ForceControl 61+, Teleportation 15+
**Notes:** ⚠️ Exceptionally rare and poorly documented. Distinct from Phase (which uses the White Current) — Dimension Shift is a direct Force manipulation of physical reality.

---

#### Force Storm (Wormhole) 🔴 ⚠️
**Anchor Stats:** ForceOutput (planetary-scale) + Dark Side alignment
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Creating a hyperspace wormhole of Force energy — capable of swallowing starships or destroying planets. The most destructive Force ability in Legends.
**Alignment:** Dark Side — severe/extreme drift
**Prerequisites:** Dark Side 90+, ForceControl 91+, ForceLightning Storm 41+
**Notes:** ⚠️ **Mythically rare and catastrophically dangerous.** Only Palpatine demonstrated this reliably. Cannot be controlled precisely — a Force Storm is as dangerous to its creator as to targets.

---

### ⚪ NATURE & ENVIRONMENT FAMILY
*Interacting with the living Force through plants, animals, and the environment.*
**Anchor Stats:** Animal Bond → **ForceSense** (living Force empathy). Plant Surge → ForceSense + Meditation. Environmental manipulation → ForceSense + ForceControl.

---

#### Animal Bond ⚪
**Anchor Stat:** ForceSense (living Force empathy)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Communicating with, calming, or forming a deep empathic bond with non-sentient animals through the Force.
**Alignment:** Neutral
**Prerequisites:** ForceSense 21+
**Notes:** Passive calming is automatic. An active bond allows rudimentary communication of intent and emotion.

---

#### Plant Surge 🔵
**Anchor Stats:** ForceSense + Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Channeling Force energy into plant life to accelerate growth, direct vines or branches, or revitalize dying vegetation. Also known as Consitor Sato.
**Alignment:** Light Side
**Prerequisites:** ForceSense 21+, Meditation 15+
**Notes:** Primarily utility and survival application. Can be used defensively (rapidly growing obstacles). Slow-acting in combat contexts.

---

#### Pyrokinesis ⚪
**Anchor Stat:** ForceControl (molecular agitation precision)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Telekinetically exciting molecules in combustible material to generate fire — creating or directing flame through Force-driven molecular agitation.
**Alignment:** Neutral (aggressive use drifts Dark)
**Prerequisites:** Telekinesis 25+, ForceControl 20+
**Notes:** Different from Fiery Energy (which uses raw dark side) — Pyrokinesis is a purely physical application of telekinesis at the molecular level.

---

#### Alter Environment ⚪
**Anchor Stats:** ForceSense + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Influencing environmental conditions through the Force — shifting wind, affecting temperature, creating fog, or directing natural energies.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, ForceControl 30+
**Notes:** Subtle and slow-acting. Cannot conjure weather from nothing — amplifies or redirects existing conditions.

---

### ⚪ KNOWLEDGE & ARCANE FAMILY
*Abilities that access deep Force knowledge, history, or metaphysical secrets.*
**Anchor Stats:** All abilities in this family → **ForceKnowledge** primary + **Meditation** secondary.

---

#### Force Memory / Force Echo ⚪
**Anchor Stats:** ForceKnowledge + Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Perceiving the Force impressions left on objects, locations, or beings by significant past events — reading the "memory" the Force holds of what happened there.
**Alignment:** Neutral
**Prerequisites:** ForceKnowledge 41+, Meditation 30+
**Notes:** Distinct from Postcognition (which is sensory) — Force Echo is more interpretive and narrative. A Jedi might sit in a room and perceive the entire history of battles fought there.

---

#### Force Bond ⚪
**Anchor Stats:** ForceSense + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A deep, sustained Force connection between two individuals — allowing emotional and sensory communication across great distances, awareness of each other's wellbeing, and in some cases shared experiences.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, ForceControl 20+
**Notes:** Can form involuntarily between people with strong emotional connections (master/padawan, close companions). Once formed, difficult to sever. Can be exploited by enemies who learn of it.

---

#### Kyber Resonance ⚪
**Anchor Stats:** ForceKnowledge + ForceSense
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Communicating with and deepening attunement to one's kyber crystal — understanding its nature, influencing its properties, and maintaining the bond between Jedi and saber.
**Alignment:** Neutral
**Prerequisites:** ForceKnowledge 30+
**Notes:** A uniquely Jedi practice. A crystal attuned to its owner functions better and can warn of danger. A Sith bleeds their crystal through a similar but dark-side process.

---

#### Force Phantom ⚪ ⚠️
**Anchor Stats:** ForceControl (maintaining the projection across distance) + ForceOutput (sustaining it for extended periods)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Projecting a convincing Force-constructed image of oneself visible to others — a doppelganger that can move, speak, and interact within limits.
**Alignment:** Neutral
**Prerequisites:** ForceSight 41+, ForceControl 41+
**Notes:** ⚠️ The ultimate expression — appearing in a location you are not physically present — was demonstrated by Luke Skywalker on Crait. Requires enormous Force reserves. The sustained effort can be lethal at the highest levels of projection.

---

#### Mechu-deru 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** An intuitive Force-based understanding and control of mechanical systems — computers, droids, and starships can be influenced or reprogrammed through direct Force connection.
**Alignment:** Dark Side (Sith origin — the Jedi avoided it except rare tech-specialists)
**Prerequisites:** ForceKnowledge 30+, ForceControl 25+, Dark Side drift or Jedi Sentinel specialization
**Notes:** ⚠️ Invented by the ancient Sith. Most Jedi consider it dangerous and avoid it. Jedi Sentinels occasionally developed a benign version. Can be used to create horrific machine-organic hybrid Sithspawn ("technobeasts"). Requires physical contact with or proximity to the machine.

---

#### Force Scribe ⚪
**Anchor Stat:** ForceControl
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Using the Force to write, inscribe, or imprint information into materials with precision — carving, marking, or encoding with Force-guided accuracy.
**Alignment:** Neutral
**Prerequisites:** ForceControl 15+
**Notes:** Primarily utility application. Used for Holocron creation and Sith/Jedi inscription work.

---

### 🔴 SITH ALCHEMY & FORBIDDEN ARTS
**Anchor Stats:** ForceKnowledge (all of these require deep lore mastery) + Dark Side (alignment gating). ForceOutput relevant for Thought Bomb and Force Storm.
**Note:** These abilities have no sub-ability proficiency tracks — each is individually learned through lore access and story events, not proficiency drilling.

---

#### Sith Alchemy 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceOutput (raw power needed to alter matter)
**Summary:** Using the dark side of the Force to alter the fundamental nature of living organisms, objects, and matter — creating monsters, enhanced weapons, and warped creatures.
**Alignment:** Dark Side — extreme drift
**Prerequisites:** ForceKnowledge 81+, Dark Side 80+
**Notes:** ⚠️ **Faction and era locked — Sith tradition only.** Requires access to Sith texts and extensive study. Products of Sith alchemy (Sithspawn, alchemically forged weapons) are powerful but unstable.

---

#### Midi-chlorian Manipulation 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceControl (surgical precision on biological substrates)
**Summary:** Directly manipulating midi-chlorians — the microscopic Force-sensitive organisms in every living thing — to create life, sustain life past its natural end, or corrupt Force-sensitivity.
**Alignment:** Dark Side (defying the natural will of the Force)
**Prerequisites:** Sith Alchemy 30+, ForceKnowledge 91+, Dark Side 90+
**Notes:** ⚠️ **Exceptionally rare — achieved by only a handful of beings in all of history.** Darth Plagueis experimented with this. The Force itself resisted, creating Anakin Skywalker as a counterbalance. Acquiring this ability should be a major story event with significant consequences. Represents the apex of the ForceControl axis — governing life at the microscopic level.

---

#### Transfer Essence 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + Meditation + Dark Side alignment
**Summary:** The ability to transfer one's own consciousness into another body — achieving a form of immortality by abandoning one's dying physical shell and inhabiting a new host.
**Alignment:** Dark Side — extreme drift
**Prerequisites:** Dark Side 80+, ForceKnowledge 71+, Meditation 51+
**Notes:** ⚠️ **Sith technique — era and faction considerations apply.** Palpatine used this repeatedly in Legends. The process destroys the host's original personality. A character pursuing this path should be considered firmly on the Sith path.

---

#### Thought Bomb 🔴 ⚠️
**Anchor Stats:** ForceOutput + ForceKnowledge + Dark Side alignment
**Summary:** A catastrophic Sith ritual that releases a massive burst of dark side Force energy — destroying the minds and Force connection of every Force-sensitive being in a wide radius, trapping their tortured spirits in a void.
**Alignment:** Dark Side — irreversible alignment collapse
**Prerequisites:** Dark Side 95+, ForceControl 91+, Sith Alchemy 41+, must have Sith ritual knowledge
**Notes:** ⚠️ **One of the most catastrophic and forbidden abilities in all of Legends.** Lord Kaan used it at the end of the New Sith Wars (1,000 BBY). It destroys the user as well. Included for completeness — no player character should realistically be on this path and survive.

---

#### Shadowstrike 🔴 ⚠️
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Channeling dark side energy into a lightsaber strike that penetrates Force defenses and barriers — a blade stroke imbued with pure dark side Force that can cut through Force Barrier and Tutaminis.
**Alignment:** Dark Side
**Prerequisites:** Dark Side 50+, any lightsaber form 61+, ForceControl 41+
**Notes:** ⚠️ Rare Sith combat technique. The strike leaves a dark side taint on the wound.

---

#### Summon Fear 🔴 ⚠️
**Anchor Stats:** ForceKnowledge (Sith sorcery mastery) + Dark Side (the ability channels the dark side itself, not just the user's own Force influence)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A Sith sorcery technique that draws on the dark side of the Force to manifest a target's deepest, most primal fears — not by projecting an emotion through Force Touch (as Force Fear does) but by reaching into the dark side itself and pulling horror into being around the target. The target experiences their worst fears as vivid, inescapable reality. Darth Zannah was one of its most proficient practitioners; Darth Maul also demonstrated it, confirming it survived the Rule of Two and Darth Gravid's purge of Sith knowledge intact.
**Alignment:** Dark Side — severe drift
**Prerequisites:** ForceKnowledge 51+, Dark Side 40+, `sithTextAccess` flag required
**Notes:** ⚠️ **Sith sorcery — distinct from the Mind Trick family.** Force Fear (Mind Trick sub-application) is a precision targeted mind-influence; Summon Fear uses a fundamentally different mechanism — it channels the dark side's inherent dread directly, making it harder to resist (even for strong-willed targets who can block mind tricks) and affecting a wider area at high proficiency. Not era-locked — the technique survived through the Rule of Two and is part of the Sith tradition accessible to any Sith with sufficient dark side knowledge. Requires Sith text access or a Sith mentor to discover, but no specific era restriction applies.

---

### ⚪ MISCELLANEOUS ABILITIES

---

#### Force Whisper ⚪
**Anchor Stats:** ForceControl + ForceSense (precision directed telepathy)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Transmitting thoughts, words, or images directly into another person's mind across distances — a subtle, directed telepathic communication rather than a broadcast.
**Alignment:** Neutral
**Prerequisites:** ForceSense 20+, ForceControl 15+
**Notes:** Less invasive than Mind Probe — the other person receives the message but their mind is not entered. Can be used without the target's knowledge.

---

#### Force Stasis / Force Stun 🔵
**Anchor Stats:** ForceControl (pinning and sustaining)
**Summary:** Projecting Force energy to slow or stop a target's physical movement — ranging from sluggishness (Force Slow) to complete immobilization (Force Stasis).
**Alignment:** Light Side leaning (non-lethal; Jedi-favored)
**Prerequisites:** ForceControl 25+, Willpower 20+
**Notes:** Non-lethal incapacitation preferred by Jedi. Sustained Stasis is extremely draining. Field variant (Force Stasis Field) can hold multiple targets simultaneously.

> **Sub-applications:**

#### ↳ Force Slow ⚪
**Anchor Stat:** ForceControl
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Weakest variant — target moves at reduced speed. Subtle enough to use undetected.
**Prerequisites:** ForceControl 15+

#### ↳ Force Stasis Field 🔵
**Anchor Stat:** ForceControl + ForceOutput (scale)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Area-effect Stasis holding multiple targets simultaneously.
**Prerequisites:** ForceStasis 30+, ForceControl 35+

#### ↳ Force Affliction → Force Plague 🔴
**Anchor Stat:** ForceControl + Dark Side
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Dark Side variants — applying a Force-channeled debilitating condition to a target that worsens over time. Force Plague can persist for days.
**Prerequisites:** Force Slow 20+, Dark Side 25+

---

#### Force Weapon ⚪
**Anchor Stats:** ForceControl + Telekinesis (the ability)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Imbuing a conventional (non-lightsaber) weapon with Force energy — making it more durable, sharper, and capable of interacting with Force-based defenses.
**Alignment:** Neutral
**Prerequisites:** ForceControl 21+, Telekinesis 15+
**Notes:** Allows a skilled Force-user to fight effectively without a lightsaber in unusual circumstances.

---

#### Force Bellow ⚪
**Anchor Stats:** ForceOutput + Charisma
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Amplifying one's voice through the Force to project commands, battle cries, or warnings with superhuman volume and resonance — enough to stagger or intimidate those nearby.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+, Charisma 10+
**Notes:** Simple utility ability. Can cause physical disorientation at very high power levels.

---

---

## INNATE TALENTS (Non-trainable — character creation or player override only)

**Registry rules:**
- Set in `characterSheet.innateTalents[]` as an array of key strings
- AI cannot add or remove entries — player override only
- Effects are applied automatically by the JS engine whenever relevant calculations run
- Can be modified mid-campaign via the player override UI panel

| Key | Display Name | Effect | Notes |
|---|---|---|---|
| `NaturalTelekineticBurst` | Natural Telekinetic Burst | All Telekinesis family Force Strain cost ×0.8 | Jared's current innate talent |
| `CombatIntuition` | Combat Intuition | +1 to all combat rolls when outnumbered | |
| `ForceSensitiveHealer` | Force-Sensitive Healer | All healing ability XP gain ×1.3 | |
| `IronMind` | Iron Mind | Mental Strain accumulates at ×0.8 rate | |
| `ForceReservoir` | Force Reservoir | maxForceBarrier +20 | |
| `BladeIntuition` | Blade Intuition | First lightsaber form starts with 5 bonus levels | Applied at character creation only |
| `DarkAffinity` | Dark Affinity | Dark Side ability Force Strain ×0.85; alignment drift accelerates | |
| `UnbreakableSpirit` | Unbreakable Spirit | At 90+ strain, XP penalty is ×0.3 instead of ×0.1 | |
| `QuickStudy` | Quick Study | All ForceKnowledge XP gains ×1.2 | |
| `ShatterSense` | Shatterpoint Innate Talent | See Shatterpoint Path B entry — ×0.1 XP cost, 70% strain reduction, uncapped track, passive perception | See Shatterpoint section for full mechanical spec |
| `BattleMeditationAffinity` | Battle Meditation Affinity | Battle Meditation XP cost ×0.3, Force Strain ×0.6. Equivalent innate case to ShatterSense — Bastila Shan is the canonical example | Separate from ShatterSense; can hold both |
| `LivingForceConnection` | Living Force Connection | Environmental Force Sense always active passively; Animal Bond strain-free | Qui-Gon Jinn archetype |
| `PrecognitiveEdge` | Precognitive Edge | Precognitive Reflexes activates one tier earlier than normal prerequisite | |

**Design note:** The `ShatterSense` and `BattleMeditationAffinity` talents are in the same category — abilities that *can* be learned without innate talent but which innate talent holders reach at a fraction of the cost and to a depth no standard learner can match.

---

## INNATE ABILITIES (Separate class — present from birth, not learnable)

Distinct from Innate Talents (which modify how learned abilities work). These abilities have no learnable path — they either exist in the character or they don't. No XP track. No training. No prerequisites.

**Registry rules:**
- Set in `characterSheet.innateAbilities[]`
- AI cannot set these — player/creation override only

| Key | Display Name | Description |
|---|---|---|
| `NaturalTelekineticBurst_passive` | Telekinetic Burst (Passive) | Passive burst of telekinetic force under extreme emotional stress — not controlled by the user, triggers automatically. Represents Jared's established innate talent manifesting involuntarily. Not a trained ability — it simply happens. |

**Note on Shatterpoint:** Although Shatterpoint has an innate talent flag (`ShatterSense`), it also has a learnable path. It does NOT belong in this table. See the Shatterpoint entry for the dual-path spec.

---

## WORLDSTATE FLAGS (Story-locked ability prerequisites)

These flags live in `worldState.storyFlags{}` and gate abilities that require specific story conditions regardless of stat level. The AI sets them when the relevant story event occurs. The player can override.

| Flag Key | Set When | Gates |
|---|---|---|
| `maceLiving` | Mace Windu is alive in the current era | Vaapad teachable |
| `maceTrustEstablished` | Mace Windu has personally agreed to teach the character | Vaapad learning begins |
| `aingTiiContact` | Character has made peaceful contact with Aing-Tii monks | Flow-walking, Fighting-Sight discoverable |
| `aingTiiApproved` | Aing-Tii have agreed to teach the character | Flow-walking, Fighting-Sight learnable |
| `fallanassiContact` | Character has made contact with the Fallanassi | Phase, Fold Space discoverable |
| `jediArchiveAccess` | Character has access to Jedi Temple Archives | Advanced theory abilities discoverable via research |
| `sithTextAccess` | Character has access to Sith holocron or scroll | Sith-origin abilities discoverable |
| `jediCouncilPermission` | Jedi Council has granted permission | Juyo learnable, Vaapad learnable (also requires maceTrustEstablished) |
| `masterAssigned` | Character has been formally assigned a Jedi Master | Padawan mandatory training rows active |
| `padawanAssigned` | Character has been assigned a Padawan | Knight instruction mandatory row active |

---

## LIFE STAGE VALUES

Stored in `characterSheet.lifeStage`. Set by AI via `LIFE_STAGE:` tag in CHANGES block when a story transition occurs. Never set by stat threshold — it is always a story/institutional recognition.

| Value | Description | Mandatory Training |
|---|---|---|
| `youngling` | Temple student, not yet assigned to a Master | Morning Forms, Group Meditation, Force Fundamentals |
| `padawan` | Assigned to a Master, undergoing apprenticeship | Training with Master, Solo Practice |
| `knight` | Passed the Trials, independent Jedi Knight | None mandatory (professional autonomy) |
| `knight_with_padawan` | Knight who has accepted an apprentice | Padawan Instruction |
| `master` | Formally elevated to Jedi Master by Council | None mandatory |
| `master_with_padawan` | Master with an active apprentice | Padawan Instruction |
| `council_member` | Seat on the Jedi High Council | Council Duties (narrative time cost) |

---

## PROGRESSION UNLOCK TRIGGERS (for simulation auto-unlock)

| Condition | Activity Unlocked |
|---|---|
| Any `lightsaberForms.*` key added | "[Form] Basics" drill auto-added |
| Any `forceAbilities.*` key added | "[Ability] Practice" drill auto-added |
| `lightsaberForms.ShiiCho` ≥ 15 | "Shii-Cho Solo Practice" (supervised always available) |
| `lightsaberForms.ShiiCho` ≥ 21 | "Shii-Cho Advanced Sequences" |
| `lightsaberForms.Makashi` ≥ 21 | "Makashi Precision Footwork" |
| `lightsaberForms.Soresu` ≥ 10 | "Soresu Deflection Drills (Blaster)" |
| `lightsaberForms.Ataru` ≥ 21 | "Ataru Acrobatic Sequences" |
| `forceStats.forceSense` ≥ 10 | "Force Sense Active Scanning" |
| `forceStats.meditation` ≥ 15 | "Deep Force Immersion" |
| Two saber forms both ≥ 21 | "Form Combination Drills" |
| Two saber forms both exist | "Dual Saber Practice" |
| Any Force ability ≥ Apprentice tier (21+) | "Force-Enhanced Athletics" |
| `lightsaberForms.Vaapad` unlocked | ⚠️ Verify Mace Windu alive + Prequel era |
| `forceAbilities.FlowWalking` unlocked | ⚠️ Verify Aing-Tii contact established |
| Any `forceAbilityProficiency` key gains first point | "[Sub-Ability] Focused Practice" drill auto-added |
| Sub-ability proficiency reaches 25% (Novice) | "[Sub-Ability] Developing Application" drill unlocked |
| Sub-ability proficiency reaches 51% (Journeyman) | "[Sub-Ability] Journeyman Refinement" drill unlocked |
| `forceStats.forceOutput` ≥ 10 | "Raw Force Channeling" exercise unlocked |
| `stats.intelligence` ≥ 15 | "Strategic Analysis" study unlocked |


---

## JS IMPLEMENTATION CHANGES REQUIRED

The following changes to `starwars_rpg_V97.html` (or successor version) are needed to implement v3. All reference specific existing code structures.

### 1. Add `forceOutput` to the valid Force Stats set
**Location:** `syncMasterXPToSheet()` function (line ~4990)
```javascript
// Change this line:
const VALID_FS = new Set(['forceSense','meditation','forceKnowledge','forceControl']);
// To:
const VALID_FS = new Set(['forceSense','meditation','forceKnowledge','forceControl','forceOutput']);
```

**Location:** The `validFS` set guard earlier in the file (line ~2857):
```javascript
const validFS = new Set(['forceSense','meditation','forceKnowledge','forceControl','forceOutput']);
```

**Location:** Both `fsMap`/`fsMap2` narrative XP parsing maps (lines ~3601, ~3636):
```javascript
// Add to each map:
forceoutput: 'forceStats.forceOutput'     // fsMap2
forceoutput: 'forceOutput'                // fsMap
```

### 2. Add `intelligence` to the core stats maps
**Location:** Both `stMap`/`stMap2` narrative XP parsing maps (lines ~3601, ~3636):
```javascript
// Add to each map:
intelligence: 'stats.intelligence'        // stMap2
intelligence: 'intelligence'              // stMap
```

### 3. Add `forceOutput` and `intelligence` to SIM_ACTIVITIES
**In `SIM_ACTIVITIES` array:**
```javascript
{ key:'force_output_drills', label:'Raw Force Output Training',
  weights:[{p:'forceStats.forceOutput',w:1.0},{p:'forceStats.forceControl',w:0.3},{p:'stats.willpower',w:0.3}],
  strainBias:{f:2.2,p:0.3,m:0.8}, defaultIntensity:'intense',
  unlock:cs=>(cs.forceStats?.forceOutput||0)>=1 || (cs.forceAbilities?.Telekinesis||0)>=20 },

{ key:'intelligence_study', label:'Strategic Study / Analysis',
  weights:[{p:'stats.intelligence',w:1.0},{p:'forceStats.forceKnowledge',w:0.2},{p:'stats.willpower',w:0.2}],
  strainBias:{f:0.1,p:0.0,m:1.6}, defaultIntensity:'casual',
  unlock:cs=>true },
```

### 4. Add the proficiency XP system to masterXP
**In masterXP initialization** (line ~4096):
```javascript
let masterXP = { forceStats:{}, stats:{}, forceAbilities:{}, lightsaberForms:{},
                 forceAbilityProficiency:{} }; // ADD forceAbilityProficiency
```

**New functions to add (after the existing XP functions, ~line 4980):**
```javascript
// Cost per 1% of proficiency — grounded in same 1.07 curve as main system
function profCostPerPoint(pct, D) {
  return Math.floor(D * 20 * Math.pow(1.07, pct * 0.8));
}

// Derive proficiency percentage from lifetime proficiency XP
function deriveProficiency(totalProfXP, D) {
  let pct = 0;
  let remaining = Math.max(0, totalProfXP || 0);
  while (pct < 100) {
    const cost = profCostPerPoint(pct, D);
    if (remaining < cost) break;
    remaining -= cost;
    pct++;
  }
  return { percentage: pct, current: Math.round(remaining),
           required: pct < 100 ? profCostPerPoint(pct, D) : 0 };
}

// Proficiency discount factors
function profBaseAbilityFactor(baseLevel) {
  if (baseLevel >= 80) return 0.50;
  if (baseLevel >= 60) return 0.60;
  if (baseLevel >= 40) return 0.75;
  if (baseLevel >= 20) return 0.90;
  return 1.00;
}
function profControlFactor(forceControl) {
  if (forceControl >= 80) return 0.70;
  if (forceControl >= 60) return 0.85;
  if (forceControl >= 40) return 1.00;
  if (forceControl >= 20) return 1.10;
  return 1.25;
}

// Apply proficiency XP to a sub-ability
// abilityKey = "ForceLightning", subKey = "ForceStorm", D = difficulty
function applyProficiencyXP(abilityKey, subKey, rawXP) {
  if (!rawXP || rawXP <= 0) return { profAdded: 0, newPct: 0 };
  const compositeKey = `${abilityKey}.${subKey}`;
  if (!masterXP.forceAbilityProficiency) masterXP.forceAbilityProficiency = {};
  if (!masterXP.forceAbilityProficiency[compositeKey])
    masterXP.forceAbilityProficiency[compositeKey] = { totalProfXP: 0, D: 1.0 };

  const entry = masterXP.forceAbilityProficiency[compositeKey];
  const baseLevel = characterSheet?.forceAbilities?.[abilityKey] || 0;
  const fc = characterSheet?.forceStats?.forceControl || 0;
  const discount = profBaseAbilityFactor(baseLevel) * profControlFactor(fc);
  const effectiveXP = rawXP / discount;

  const before = deriveProficiency(entry.totalProfXP, entry.D);
  entry.totalProfXP += effectiveXP;
  const after  = deriveProficiency(entry.totalProfXP, entry.D);
  return { profAdded: Math.round(effectiveXP), newPct: after.percentage,
           pctGained: after.percentage - before.percentage };
}

// Trickle: when base ability XP is gained, spread 5% to all unlocked sub-ability proficiencies
function profTrickleFromBase(abilityKey, baseXPGained) {
  if (!masterXP.forceAbilityProficiency) return;
  const trickleXP = baseXPGained * 0.05;
  for (const [compositeKey, entry] of Object.entries(masterXP.forceAbilityProficiency)) {
    if (compositeKey.startsWith(abilityKey + '.') && entry.totalProfXP > 0) {
      entry.totalProfXP += trickleXP;
    }
  }
}

// Get effective proficiency (capped by soft cap)
function getEffectiveProficiency(abilityKey, subKey) {
  const compositeKey = `${abilityKey}.${subKey}`;
  const entry = masterXP.forceAbilityProficiency?.[compositeKey];
  if (!entry) return 0;
  const raw = deriveProficiency(entry.totalProfXP, entry.D).percentage;
  const baseLevel = characterSheet?.forceAbilities?.[abilityKey] || 0;
  const softCap = baseLevel >= 80 ? 100 : baseLevel >= 60 ? 85 :
                  baseLevel >= 40 ? 70  : baseLevel >= 20 ? 50 : 25;
  return Math.min(raw, softCap);
}

// Get proficiency tier label
function profTierLabel(pct) {
  if (pct >= 91) return 'Mastered';
  if (pct >= 71) return 'Expert';
  if (pct >= 51) return 'Proficient';
  if (pct >= 26) return 'Developing';
  return 'Novice';
}
```

### 5. Update buildSave / loadFromSave to persist proficiency
**In `buildSave()`** — no change needed; masterXP is already saved wholesale.

**In `loadFromSave()`** — after the masterXP migration loop, add:
```javascript
// Migrate: if no forceAbilityProficiency exists, initialize empty
if (!masterXP.forceAbilityProficiency) masterXP.forceAbilityProficiency = {};
```

### 6. Add proficiency rendering to the character sheet sidebar
**In `updateCharacterSheet()`**, in the Force Abilities section, after each ability's XP bar:
```javascript
// For each unlocked sub-ability in forceAbilityProficiency:
const subKeys = Object.keys(masterXP.forceAbilityProficiency || {})
  .filter(k => k.startsWith(abilityKey + '.'));
for (const compositeKey of subKeys) {
  const subName = compositeKey.split('.')[1];
  const effectivePct = getEffectiveProficiency(abilityKey, subName);
  const tier = profTierLabel(effectivePct);
  // Render: "  ↳ ForceStorm: Novice (12%)" with a thin progress bar
}
```

### 7. Add proficiency CHANGES block tag for AI use
The AI can award proficiency via the CHANGES block:
```
PROFICIENCY: ForceLightning.ForceStorm,150
```
This awards 150 raw proficiency XP to Force Storm's track, which then gets discount factors applied.

**In the CHANGES block parsing** (the large switch statement ~line 3000):
```javascript
case 'PROFICIENCY': {
  // Format: AbilityKey.SubKey,xpAmount
  const profParts = trimmed.slice(12).split(',').map(s=>s.trim());
  const [compositeKey, xpStr] = profParts;
  const dotIdx = compositeKey.indexOf('.');
  if (dotIdx > 0) {
    const abilKey = compositeKey.slice(0, dotIdx);
    const subKey  = compositeKey.slice(dotIdx + 1);
    const profXP  = parseFloat(xpStr) || 0;
    if (profXP > 0) {
      const res = applyProficiencyXP(abilKey, subKey, profXP);
      if (res.pctGained > 0) {
        turnXPLog.push({ label: `${subKey} proficiency`, xpAdded: res.profAdded,
                         levelUps: 0, newStat: res.newPct, type: 'proficiency' });
      }
    }
  }
  break;
}
```

### 8. Update the AI system prompt
Add to the GM system prompt's CHANGES block documentation:
```
PROFICIENCY: AbilityKey.SubKey,xpAmount
  — awards proficiency XP toward a specific sub-ability application
  — AbilityKey must match the parent forceAbilities key exactly
  — xpAmount uses same scale as XP: standard supervised training (1hr) ≈ 15 XP
  — Use this when the character specifically practices a sub-application, not just the base ability
  — Example: PROFICIENCY: ForceLightning.ForceStorm,15
```

