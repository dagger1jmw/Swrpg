# SW Legends RPG — Injury & Pain System v1
## Design Reference Document

> Status: **DESIGN PHASE — not yet implemented**
> Last updated: 2026-06-15

---

## 1. Design Philosophy

Combat should have lasting consequences within a session (and occasionally beyond). Minor injuries are the texture of a hard fight — they fade with rest. Permanent injuries are rare, story-defining events. Pain is not just an HP number: how a character responds to it — suppressing it, ignoring it, or weaponizing it — reflects who they are.

The system has three interlocking layers:
1. **HP threshold penalties** — automatic, JS-driven, no AI input needed
2. **Injury tracking** — specific wounds logged by the AI via CHANGES tags, with targeted roll penalties
3. **Pain response** — how the character mitigates or channels pain (Force techniques, dark side rage, willpower)

---

## 2. HP Threshold Penalties

Automatic penalty applied to all rolls based on current HP. JS calculates this every roll; the AI never declares it.

| HP Range | State | Roll Penalty |
|----------|-------|-------------|
| 76–100 | Fine | 0 |
| 51–75 | Hurt | −1 |
| 26–50 | Wounded | −2 |
| 11–25 | Critical | −3 |
| 1–10 | Near Death | −5 |
| 0 | Incapacitated | N/A |

These represent general systemic degradation — blood loss, shock, exhaustion from sustained damage. They are **separate from and stack with** specific injury penalties.

---

## 3. Injury Classification

### 3A. Standard Injuries (Healable)

Treatable by bacta/kolto tanks, surgical intervention, or Force healing. Do not persist permanently.

| Severity | Roll Penalty | Description | Healing Method |
|---------|-------------|-------------|---------------|
| `minor` | −1 | Superficial cut, bruise, mild sprain | Auto-clears on next full sleep (7+ hrs) |
| `moderate` | −2 | Deep laceration, hairline fracture, muscle damage, partial tendon tear | Bacta treatment (in-game 1–2 days) or Force healing session |
| `severe` | −3 | Compound fracture, heavy internal bleeding, significant organ damage, full tendon/ligament severance | Intensive bacta/kolto immersion (in-game 3–7 days) + recovery; or multiple Force healing sessions |

> **Bacta/kolto canon note:** In Legends, bacta tanks are highly effective for most non-permanent injuries. Even significant organ trauma is often reversible with sustained treatment. The permanent category below is reserved for what even bacta cannot reverse.

### 3B. Permanent Injuries

These are story-defining events. They do not auto-clear and cannot be healed by bacta or standard medical care. Removal requires specific story events.

| Injury Type | Removal Condition |
|-------------|-----------------|
| Amputated limb | Cybernetic prosthetic fitting (story event) or Midi-chlorian Manipulation (Force healing at legendary level) |
| Severed spinal cord / major nerve trunk | Same as above; extremely rare to heal even with Force |
| Catastrophic organ loss (e.g., lung removed) | Replacement organ + surgery story event; some Force healing at extreme levels |
| Severe burns covering major body area | Kolto + reconstructive surgery story event |

**Permanent injuries are flagged with `permanent: true` in the data.** They show in the injury list with a `[PERMANENT]` tag until surgically or Force-healed. An AI-declared `INJURY_HEAL=bodyPart` tag is ignored for permanent injuries unless a qualifying story event (`STORY_HEAL=bodyPart`) has been declared that turn.

---

## 4. Body Part Taxonomy

Eight zones. Each injury is assigned to one zone; the zone determines which roll categories it affects.

| Zone Key | Display | Affects |
|----------|---------|---------|
| `rightArm` | Right Arm | Saber forms + strength rolls |
| `leftArm` | Left Arm | Saber forms + strength rolls (if off-hand) |
| `rightHand` | Right Hand | Saber forms + fine manipulation |
| `leftHand` | Left Hand | Saber forms (if off-hand) + fine manipulation |
| `rightLeg` | Right Leg | Agility rolls, footwork, movement |
| `leftLeg` | Left Leg | Agility rolls, footwork, movement |
| `torso` | Torso | All rolls (reduced core output + breathing) |
| `head` | Head | Force rolls + mental rolls; concussion effects at severe+ |

> **Targeting scope:** Arm/hand injuries penalize saber forms and strength. Leg injuries penalize agility. Torso and head injuries apply universally. This prevents a leg wound from affecting a Force sense roll or an arm gash from penalizing meditation.

---

## 5. Dominant Hand & Jar'Kai

### 5A. Dominant Hand Tracking

`characterSheet.dominantHand` — defaults to `'right'`. Set at character creation or via `DOMINANT_HAND=left` tag. This is a protected field (not overwritten by AI SHEET JSON).

`characterSheet.fightingWith` — normally mirrors `dominantHand`. Switches when the dominant hand is unusable. AI sets this explicitly with `FIGHTING_HAND=left`.

### 5B. When Dominant Hand Becomes Unusable

A dominant hand is unusable when it has a `severe` or `critical`/permanent injury. The AI should declare `FIGHTING_HAND=[other]` when this occurs narratively (hand cut off, severe tendon damage makes grip impossible, etc.).

### 5C. Off-Hand Saber Penalty

When `fightingWith` differs from `dominantHand`, all saber form rolls take an additional penalty:

| Condition | Additional Saber Penalty |
|-----------|------------------------|
| Off-hand, no Jar'Kai trained | −3 |
| Off-hand, Jar'Kai level 1–30 | −2 |
| Off-hand, Jar'Kai level 31–60 | −1 |
| Off-hand, Jar'Kai level 61+ | 0 |

This stacks with HP threshold and injury penalties. A character who loses their right hand in a fight and switches to left-hand fighting is dramatically impaired unless they have Jar'Kai training — which is the canonical reason Jar'Kai exists.

### 5D. Dominant Hand Injury (Not Severed)

If the dominant hand or arm has a `moderate` injury (damaged but still usable), the saber penalty from §5C does NOT apply — the character fights through it, and the injury's base roll penalty (−2) already represents the impairment. The off-hand penalty only triggers when the AI explicitly declares `FIGHTING_HAND` has switched.

---

## 6. Pain Mitigation

Three paths for a Force user to handle active injury penalties:

### 6A. Control Pain (Force Ability — Light/Neutral)

**Ability key:** `ControlPain`
**Family:** Body
**Prereqs:** `forceControl 20`, `meditation 15`
**Alignment:** Neutral
**Anchor stats:** `forceControl`, `meditation`

Control Pain is a sustained Force technique. The practitioner turns inward through the Force, suppressing the neurological pain signals from active injuries. It requires concentration to maintain — it is not passive.

**Mechanic:** The ability level (0–100+) directly equals the injury penalty mitigation percentage.

```
effectivePenalty = floor(rawInjuryPenalty × (1 - ControlPainLevel / 100))
```

| Control Pain Level | Mitigation | Example: −4 total injury penalty becomes... |
|-------------------|-----------|-------------------------------------------|
| 0 | 0% | −4 |
| 25 | 25% | −3 |
| 50 | 50% | −2 |
| 75 | 75% | −1 |
| 100 | 100% | 0 |

**Above level 100:** The mitigation is capped at 100% (full suppression), but efficiency improves — the Force strain cost to maintain the technique decreases. At very high levels (120+), the technique begins approaching a passive state, requiring only a light background attention to maintain even during intense combat.

**Force strain cost per combat round (or per hour of non-combat sustained use):**

```javascript
// severitySum  = sum of severity weights for ALL active injuries being suppressed
//                minor=1, moderate=2, severe=3, critical=5
// level        = ControlPain ability level (0–150+)
// mitigationPct = min(level, 100) / 100  (capped at 1.0 for cost calc)

suppressionWork  = severitySum × mitigationPct × 3.0
efficiencyFactor = max(0.10, 1.0 − (level / 100) × 0.80)
costPerRound     = floor(suppressionWork × efficiencyFactor)
```

**Reference table:**

| Level | Injuries | Severity Sum | FS Cost/Round |
|-------|----------|-------------|--------------|
| 25 | 1 minor | 1 | 0 |
| 25 | 1 moderate | 2 | 1 |
| 25 | 1 severe | 3 | 1 |
| 50 | 1 minor | 1 | 0 |
| 50 | 1 moderate | 2 | 1 |
| 50 | 1 severe | 3 | 2 |
| 50 | 2 moderate | 4 | 3 |
| 75 | 1 moderate | 2 | 1 |
| 75 | 1 severe | 3 | 2 |
| 75 | 1 critical | 5 | 4 |
| 100 | 1 moderate | 2 | 1 |
| 100 | 1 severe | 3 | 1 |
| 100 | 1 critical | 5 | 2 |
| 100 | 2 moderate | 4 | 2 |
| 125 | 1 critical | 5 | 1 |
| 125 | moderate + severe | 7 | 2 |

Key properties of the formula:
- **Minor injuries always cost 0** regardless of level — trivial pain
- **Single moderate injury costs 1 FS/round at any level** — the increasing work and improving efficiency cancel; it's a constant sustainable tax
- **Severe and critical injuries scale meaningfully** — still expensive even at mastery, representing that major trauma is genuinely hard to suppress
- **Level 125+** brings even critical injuries to 1–2 FS/round — legendary efficiency, approaching passive maintenance

**Light side note:** Using Control Pain is entirely consistent with the light side — Jedi are trained to remain calm and focused regardless of physical pain. It does not require detachment from emotion, only mastery of physical sensation. Using it does not generate Dark Pressure.

**HP threshold penalties are NOT mitigated by Control Pain.** Control Pain suppresses the neurological experience of the wound (the pain signal), not the underlying systemic impairment (blood loss, shock). HP threshold penalties represent physiological degradation that willpower and Force technique cannot fully override — see §6D for the abilities that CAN address HP threshold penalties.

### 6B. Dark Side Pain Channeling

Dark side users (alignment ≤ −25) have access to a fundamentally different relationship with pain: they can convert it into fuel. Rather than suppressing the pain signal, they embrace it, let it feed their rage, and draw power from it.

**Mechanic:** When the AI declares `PAIN_CHANNEL=active` in the CHANGES block:
- The character's injury roll penalties for **strength and forceOutput-based rolls** are converted to a **bonus** of equal magnitude
- Precision-dependent rolls (agility, forceControl, ForceKnowledge, meditation, Force sense) still take the full injury penalty — rage is not a precision instrument
- Each combat exchange while channeling pain generates `Dark Pressure +[severity_total]` (minor=1, moderate=2, severe=3, critical=5 per active injury of that severity)
- Extra physical strain per combat round while channeling: `+severity_total`

**Example:** Character has a moderate right arm injury (−2 raw) and a minor rib injury (−1 raw). Total injury penalty = −3.

| Roll Type | Normal | Pain Channeling |
|-----------|--------|----------------|
| DjemSo (strength-based) | −3 | **+3** |
| Force Lightning (forceOutput) | −3 | **+3** |
| Force Control (precision) | −3 | −3 |
| Force Sense | −3 | −3 |

The rage-fueled aggression is genuinely more powerful for brute-force applications. The cost is alignment pressure and strain — using pain as fuel accelerates the descent.

**Light side characters:** May not use Pain Channeling without generating substantial Dark Pressure (declaring it would be treated as giving into the dark side). If a light side character in extremis briefly channels pain, it is a story event with consequences — not a tactical option.

**`PAIN_CHANNEL` tag can be set to `active` or `inactive`.** It does not persist automatically between turns — the AI must re-declare it each turn where the character is actively channeling (maintaining narrative that they're leaning into the rage).

### 6D. Battlemind / Force Valor — HP Threshold Override

Unlike Control Pain (which addresses injury-specific penalties), **Battlemind** and **Force Valor** can temporarily override HP threshold penalties by pushing the body beyond its physiological limits through the Force. The Force shores up failing circulation, keeps muscles firing past exhaustion, and forces the nervous system to stay sharp despite blood loss and shock.

This is not healing. The underlying damage is still there and getting worse. The Force is merely masking the systemic degradation — deferring the cost until the ability ends.

**HP threshold suppression by ability level:**

| Ability Level | Threshold Penalty Suppression |
|--------------|------------------------------|
| 0–30 | None — ability cannot override bodily limits at this level |
| 31–60 | 50% of threshold penalty suppressed |
| 61–80 | 75% of threshold penalty suppressed |
| 81–100 | 100% suppressed — character fights as if fully healthy despite HP |
| 100+ | 100% suppressed + small active bonus (+1 to rolls) — pushing beyond even what a healthy body could do |

**Example:** Character at 30 HP (Wounded, normally −2 to all rolls) with Battlemind level 75:
- 75% of −2 = −1.5 suppressed → rounded to −2 → effective penalty: 0 (floor applied)
- Actually: `effectivePenalty = ceil(2 × (1 − 0.75)) = ceil(0.5) = 1` → **−1** to rolls instead of −2

**The Crash (ability drops or Force strain maxes out):**

When Battlemind or Valor ends while the character is below the "Fine" HP threshold, the body immediately experiences the full weight of what the Force was compensating for. Physical strain surges:

| HP at the moment ability drops | Physical Strain Surge |
|-------------------------------|----------------------|
| 51–75 (Hurt) | +5 |
| 26–50 (Wounded) | +10 |
| 11–25 (Critical) | +15 |
| 1–10 (Near Death) | +20 |

This surge applies even if the ability was dropped voluntarily after combat ended — the body still needs to process what happened to it. A character who fought through a Wounded state on Battlemind and then returns to the barracks will collapse once they let go.

The AI declares `COMBAT_END_CRASH` when an ability-drop crash occurs, and JS applies the physical strain surge automatically. If Force strain reached 100 mid-combat (causing ability to drop involuntarily), the crash still fires.

**Stacking with Control Pain:** Battlemind/Valor suppresses HP threshold penalties; Control Pain suppresses injury-specific penalties. They address different penalty sources and stack independently. A character using both during a serious fight has exceptional short-term combat effectiveness but is accumulating a significant deferred cost in Force strain and crash physical strain.

**Dark side equivalent:** The Darth Sion method (using pure hatred/darkness to hold a broken body together far past the point of death) follows the same conceptual logic but extended to the 0 HP incapacitation threshold. Full design deferred to v2 — see §15.

### 6F. Willpower Passive Resistance

High Willpower provides a small passive buffer against pain penalties — representing mental discipline without active Force technique. This applies to all characters (Force-sensitive or not).

| Willpower | Passive Resistance |
|-----------|-------------------|
| 0–40 | 0% |
| 41–60 | 10% |
| 61–80 | 20% |
| 81–100 | 30% |
| 100+ | 35% |

This is calculated automatically by JS and stacks with Control Pain multiplicatively (not additively):

```
effectivePenalty = rawPenalty × (1 - willpowerResistance) × (1 - controlPainMitigation)
```

So a character with Willpower 70 (20% resistance) and Control Pain level 50 (50% mitigation) facing a −4 penalty:
```
−4 × 0.80 × 0.50 = −1.6 → rounds to −2
```

---

## 7. Healing System

### 7A. Auto-Clear (Minor Injuries)

Minor injuries automatically clear when the character completes a full sleep (7+ hours in-game). JS handles this when processing a sleep/rest simulation row or when the AI declares "Time Elapsed: 7 hours" with a rest context. No AI INJURY_HEAL tag required for minor injuries.

### 7B. Standard Medical Healing

| Severity | Method | In-Game Time | Notes |
|---------|--------|-------------|-------|
| Moderate | Bacta/kolto patch + rest | 1–2 days | Can continue light activity; no further combat |
| Moderate | Force Healing session (moderate ForceHealing level) | 4–8 hours | Requires dedicated healing trance |
| Severe | Full bacta/kolto immersion | 3–7 days | Must be fully resting in tank; no activity |
| Severe | Force Healing (high level, multiple sessions) | 1–3 days | Multiple sustained trances; depleting |

When medical healing is complete (in-game time has passed + appropriate conditions), the AI declares `INJURY_HEAL=bodyPart`. For severe injuries requiring story involvement, the AI should only declare this if the narrative supports it (medical droid treatment, time in medbay, etc.).

### 7C. Permanent Injury Removal

Permanent injuries require explicit story-flagged healing events:

| Method | Story Requirements | Force Level Required |
|--------|-------------------|---------------------|
| Cybernetic prosthetic | Access to cybernetics lab, surgeon, credits | None |
| Synthflesh regeneration | High-end medical facility | None |
| Force healing (limb) | Not possible at normal levels; requires Midi-chlorian Manipulation at extremely high levels | Legendary (100+) |
| Bacta tank (organ) | High-end tank + extended treatment + surgery | None (but very expensive) |

When a permanent injury is removed via a qualifying story event, the AI declares `STORY_HEAL=bodyPart`. This is distinct from `INJURY_HEAL` and bypasses the permanent flag.

---

## 8. Opponent Injury Tracking

Opponent injuries are tracked in `activeCombat.oppInjuries[]` — **purely combat-local**. They do not carry over to future encounters. When the encounter ends, the array clears. The opponent is assumed to have received treatment (or the injuries were minor) between sessions.

**Persistent opponent injuries** are the exception, not the rule. They apply only when the injury is so significant it permanently changes the character — the Malgus standard (damage so severe it required a rebreather for the rest of his life) or the Vader standard (required full life-support armor). These are story-defining, visually distinctive, permanent alterations to who that NPC is.

**The threshold for persistence:** Lost limbs, disfiguring injuries requiring permanent medical apparatus (rebreather, life support), severe scarring that narratively defines the character. NOT: deep cuts, broken bones, organ damage treatable by bacta.

When the AI establishes such an injury, it uses `OPP_INJURY_PERMANENT=bodyPart,description`. This writes a note to the opponent's `characterProfile` as a story record — it has no mechanical roll effect in future encounters (the NPC has presumably adapted), but it is there as a permanent lore entry visible in the People tab and injected into AI context when that character is present.

Opponent injury penalties are applied as an effective **bonus** to the player's roll margin calculation (the opponent is impaired, which helps the player). The roll card shows this explicitly.

---

## 9. CHANGES Block Tags

### Player Injury Tags

```
INJURY_ADD=bodyPart,severity,description
  // e.g. INJURY_ADD=rightArm,moderate,Deep gash severs forearm muscle
  // e.g. INJURY_ADD=rightHand,critical,Hand severed at the wrist,permanent
  // Add ',permanent' as a 4th field for permanent injuries

INJURY_HEAL=bodyPart
  // Clears non-permanent injury at that zone
  // Ignored silently if the injury is permanent

INJURY_HEAL_ALL
  // Clears all non-permanent injuries (e.g. after overnight bacta treatment)

STORY_HEAL=bodyPart
  // Clears permanent injury — only valid when a qualifying story event occurred this turn
  // e.g. STORY_HEAL=rightHand  (after cybernetic fitting scene)

DOMINANT_HAND=right|left
  // One-time setup. Protected from SHEET JSON.

FIGHTING_HAND=right|left
  // Declares which hand holds the saber THIS turn and forward
  // Triggers off-hand penalty calculation when different from dominantHand

PAIN_CHANNEL=active|inactive
  // Dark side pain conversion — must be re-declared each turn while active
  // Only valid when alignment ≤ −25
```

### Opponent Injury Tags

```
OPP_INJURY_ADD=bodyPart,severity,description
  // e.g. OPP_INJURY_ADD=rightArm,moderate,Droid chassis dented by bench impact

OPP_INJURY_HEAL=bodyPart
  // Clears a specific opponent injury (e.g. droid self-repairs)

OPP_INJURY_HEAL_ALL
  // Full opponent recovery (combat ended, or regeneration ability)

OPP_INJURY_PERMANENT=bodyPart,description
  // Logs a permanent story-level change to opponent's profile
  // No mechanical effect on rolls; purely narrative/profile record
```

---

## 10. Roll Card Integration

The roll card (shown in the feed after each opposed or solo roll) must display all active modifiers so the player can verify the math.

### Player Side
```
Player Bonus breakdown:
  Stats:          +7.26  (Telekinesis:42, forceControl:59, forceOutput:46)
  HP threshold:   −1     (Hurt, 68 HP)
  Injuries:       −2     (right forearm: moderate)
  Control Pain:   +1     (50% mitigation, level 52 → −2 → −1)
  Willpower:      +0     (willpower 35 → 0% passive resistance)
  Net total:      +5.26
```

### Opponent Side (ROLL_OPPOSED)
```
Opponent Bonus breakdown:
  Stats:          +6.38  (ShiiCho:45, strength:40, agility:50)
  Injuries:       −2     (right arm: moderate — chassis dented)
  Net total:      +4.38
```

---

## 11. Strain Interactions

### Control Pain Strain Cost
- Maintaining Control Pain while injured costs Force strain each combat round
- Cost is proportional to total raw injury severity being suppressed
- At low ability levels: expensive (painful to hold)
- At high ability levels: efficient (near-passive maintenance)
- Specific multipliers to be calibrated during implementation; should feel punishing at ControlPain 20 but sustainable at ControlPain 80+

### Pain Channeling Strain Cost
- Physical strain per combat exchange while channeling: +[sum of injury severity points] (minor=1, moderate=2, severe=3, critical=5)
- The body is being pushed harder than it should be given its injuries
- Force strain: minimal (channeling rage is not a Force technique per se)

### HP Threshold Strain Modifiers
- HP threshold penalties do NOT increase strain accumulation — they represent impairment, not additional exertion
- However, fighting through severe HP depletion (Critical / Near Death threshold) should generate narrative consequence from the AI: these are emergencies, not routine combat states

---

## 12. Context Injection (Per Turn)

Injected into `stateBlock` via `buildLoreContext()` or a dedicated injury block. The AI receives this every turn:

```
INJURY STATE:
  [Right Forearm] moderate — Deep gash, muscle damage | Penalty: −2 to arm/saber/strength rolls
  [Ribs] minor — Bruised from impact | Penalty: −1 to all rolls | AUTO-CLEARS on next full sleep
  Dominant hand: right | Fighting with: right
  Control Pain: level 52 (active) → 52% mitigation → injury penalty reduced by 52%
  Willpower passive resistance: 0% (willpower 35)
  HP threshold: 68 HP → Hurt → −1 to all rolls
  TOTAL ROLL PENALTY: (−3 injury × 0.48 mitigation) + (−1 HP threshold) = −2 (rounded)
  OPPONENT INJURIES (Mark IV Droid): right arm moderate (−2 to droid's rolls)
  PAIN CHANNEL: inactive
```

If no injuries: `INJURY STATE: None. No active penalties from injuries.`

---

## 13. AI Behavior Guidelines

### When to Add Injuries
- Combat where the player takes a meaningful hit to a specific body part (not just generic HP loss)
- At minimum: if HP drops by 20+ in a single exchange, the AI should consider a `minor` or `moderate` injury appropriate to the narrative
- Dramatic story moments (lightsaber duel where a strike lands on the arm; falling and injuring a leg; being thrown into a wall)
- Do NOT add injuries every time HP drops slightly — minor HP loss is already represented by threshold penalties

### When to Use Permanent
- Limb fully severed in narrative (not just "damaged" — actually removed)
- Catastrophic organ failure beyond what bacta can reverse
- These should be rare, significant story events, not routine combat outcomes
- When in doubt, use `severe` (healable) rather than `critical, permanent`

### Dominant Hand / FIGHTING_HAND
- Declare `FIGHTING_HAND=left` when the narrative shows the character switching (hand cut off, arm immobilized, etc.)
- Do NOT declare this automatically when the right arm is merely injured — the character fights through a moderate injury without switching
- Switch should only happen when the dominant hand/arm is at `severe` or `critical` and the narrative supports it

### Pain Channeling
- Only declare `PAIN_CHANNEL=active` for dark side characters (alignment ≤ −25) who are actively and consciously embracing their rage
- This is a narrative choice as much as a mechanical one — the AI should describe the shift in demeanor (angrier, more aggressive, more erratic)
- Do NOT auto-declare for any injury without character intent

### Control Pain
- The AI does NOT manage Control Pain activation — the player trains the ability and JS calculates mitigation automatically based on the ability level
- The AI should narrate when the character is visibly struggling to maintain the technique (high cost, severe injuries) or when it's clearly working (staying eerily calm despite serious wounds)

---

## 14. Force Ability Entry: Control Pain

To be added to `FORCE_ABILITY_CATALOG` (in-code) and `SW_Force_Abilities_Forms_v3_complete.md` (lore doc) during implementation:

```javascript
ControlPain: {
  fam: 'Body',
  label: 'Control Pain',
  par: null,                    // root ability in Body family
  D: null,                      // does not use sub-ability proficiency system
  align: 'neutral',
  anchors: ['forceControl', 'meditation'],
  prereqs: { forceControl: 20, meditation: 15 },
  flags: []
}
```

**Mechanic note:** Control Pain uses its base ability level (0–100+) directly as the mitigation percentage, rather than the proficiency sub-system. It is trained via TRAINING: and XP like any other Force ability. Above level 100, mitigation stays at 100% but efficiency/strain cost improves.

**Lore:** Canon source — Legends Force power. Documented across multiple Legends sources as a core Jedi Control technique. Used to remain functional while injured. Luke Skywalker and many Jedi Masters demonstrate it in canon. Sith can and do learn it, but typically prefer Pain Channeling (embrace vs. suppress philosophy).

---

## 15. Open Questions / Future Extensions

- **Concussion effects:** Head injuries at severe+ could impose a penalty specifically to Force sense (distorted perception) or meditation (can't concentrate). Not in v1; flag for later.
- **Darth Sion method (v2):** Using pure dark side hatred to hold a broken body together past the 0 HP incapacitation threshold. Extends the Battlemind/Valor HP override mechanic to the point of functional death. When the will is finally released, instant collapse. Requires high dark side alignment, extreme forceOutput, specific ability unlock. Design deferred — see §6D for the Battlemind/Valor version which covers the same conceptual territory for non-lethal HP ranges.
- **Fatigue vs. injury distinction:** Currently HP threshold covers general fatigue. Could eventually split into a `fatigue` sub-track separate from structural HP (wounds). Left for a future version.
- **Non-Force-user pain management:** Characters without Force sensitivity rely entirely on willpower passive resistance and bacta. This is already covered by the willpower bracket table; no special case needed.
- **Sith Alchemy / Essence Transfer interaction:** High-level dark side practitioners with certain abilities might become partially immune to physical pain through other means. Not in scope for v1.
- **Paralysis and status effects:** Stunned, incapacitated, paralyzed — these could be a separate status system beyond injuries. Future extension.
- **FORCE_ABILITY_RULES entry for ControlPain:** Short summary for AI context injection (anchor stats, prereq summary, effect summary). Add during implementation.
