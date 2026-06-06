# Star Wars Legends RPG — Activity Bank v1.0
# Training Activities, Skill Weights & Strain Profiles

---

## FORMAT

Each entry:
- **Activity name** + category
- **Unlocked by**: always available OR requires specific skill in masterXP
- **Primary skill** (weight 1.0 always)
- **Secondary skills** with weights
- **Strain bias**: multipliers applied to standard strain/hour rates
- **Default intensity**
- **Difficulty**: how to classify difficulty tier relative to character level
- **Notes**: flavor and mechanical notes

---

## LIGHTSABER FORMS

### Shii-Cho (Form I) — Basics
- **Unlocked by**: Always available for supervised group training; solo practice unlocks at `lightsaberForms.ShiiCho` ≥ 15 (enough foundation to drill independently)
- **Primary**: `lightsaberForms.ShiiCho` 1.0
- **Secondary**: `stats.strength` 0.4, `stats.agility` 0.3, `stats.endurance` 0.2, `forceStats.forceControl` 0.15
- **Strain bias**: Physical ×1.5, Force ×0.5, Mental ×0.4
- **Default intensity**: Standard
- **Difficulty**: Standard (broad sweeping strikes, focus on fundamentals)
- **Notes**: First form taught. Emphasis on disarming, wide coverage. Physical demand moderate.

### Shii-Cho — Advanced Sequences
- **Unlocked by**: `lightsaberForms.ShiiCho` ≥ 21 (Apprentice)
- **Primary**: `lightsaberForms.ShiiCho` 1.0
- **Secondary**: `stats.strength` 0.5, `stats.agility` 0.4, `stats.endurance` 0.3, `forceStats.forceControl` 0.2
- **Strain bias**: Physical ×1.8, Force ×0.6, Mental ×0.5
- **Default intensity**: Intense
- **Difficulty**: Ceiling

### Makashi (Form II) — Basics
- **Unlocked by**: `lightsaberForms.Makashi` exists in masterXP
- **Primary**: `lightsaberForms.Makashi` 1.0
- **Secondary**: `stats.agility` 0.6, `stats.willpower` 0.3, `forceStats.forceControl` 0.3, `stats.strength` 0.1
- **Strain bias**: Physical ×1.0, Force ×0.8, Mental ×0.9
- **Default intensity**: Standard
- **Difficulty**: Ceiling (precision-heavy, mentally demanding)
- **Notes**: Elegant dueling form. Low physical demand but high mental concentration. Willpower drives the composed footwork.

### Makashi — Precision Footwork Drills
- **Unlocked by**: `lightsaberForms.Makashi` ≥ 21
- **Primary**: `lightsaberForms.Makashi` 1.0
- **Secondary**: `stats.agility` 0.7, `stats.willpower` 0.4, `forceStats.forceControl` 0.3
- **Strain bias**: Physical ×1.2, Force ×0.7, Mental ×1.2

### Soresu (Form III) — Basics
- **Unlocked by**: `lightsaberForms.Soresu` exists
- **Primary**: `lightsaberForms.Soresu` 1.0
- **Secondary**: `stats.endurance` 0.6, `stats.willpower` 0.4, `forceStats.forceSense` 0.3, `forceStats.forceControl` 0.25
- **Strain bias**: Physical ×1.2, Force ×0.9, Mental ×1.0
- **Default intensity**: Standard
- **Difficulty**: Ceiling
- **Notes**: Defensive form. Anticipation and endurance are paramount. ForceSense secondary for reading attacks. Long sessions wear on willpower.

### Soresu — Deflection Drills (blaster training)
- **Unlocked by**: `lightsaberForms.Soresu` ≥ 10
- **Primary**: `lightsaberForms.Soresu` 1.0
- **Secondary**: `stats.endurance` 0.5, `forceStats.forceSense` 0.5, `stats.agility` 0.3, `stats.willpower` 0.3
- **Strain bias**: Physical ×1.3, Force ×1.2, Mental ×0.9

### Ataru (Form IV) — Basics
- **Unlocked by**: `lightsaberForms.Ataru` exists
- **Primary**: `lightsaberForms.Ataru` 1.0
- **Secondary**: `stats.agility` 0.7, `stats.strength` 0.3, `forceStats.forceControl` 0.3, `stats.endurance` 0.4
- **Strain bias**: Physical ×2.0, Force ×0.8, Mental ×0.5
- **Default intensity**: Intense
- **Difficulty**: Ceiling (extremely physically demanding)
- **Notes**: Acrobatic form. Highest physical strain of all forms. Short training windows recommended — 1–2 hours max before diminishing returns hit. Agility is king.

### Ataru — Acrobatic Sequences
- **Unlocked by**: `lightsaberForms.Ataru` ≥ 21
- **Primary**: `lightsaberForms.Ataru` 1.0
- **Secondary**: `stats.agility` 0.8, `stats.endurance` 0.5, `forceStats.forceControl` 0.3, `stats.strength` 0.25
- **Strain bias**: Physical ×2.5, Force ×0.7, Mental ×0.4
- **Default intensity**: Intense
- **Notes**: Very high physical strain. Do not schedule >2 hours without a rest block.

### Shien / Djem So (Form V) — Basics
- **Unlocked by**: `lightsaberForms.ShienDjemSo` exists OR `lightsaberForms.DjemSo` exists
- **Primary**: primary form key 1.0
- **Secondary**: `stats.strength` 0.7, `stats.endurance` 0.4, `forceStats.forceControl` 0.25, `stats.agility` 0.2
- **Strain bias**: Physical ×1.8, Force ×0.6, Mental ×0.5
- **Default intensity**: Intense
- **Notes**: Power form. Strength is the primary secondary stat. Counter-attacking emphasis.

### Niman (Form VI) — Basics
- **Unlocked by**: `lightsaberForms.Niman` exists
- **Primary**: `lightsaberForms.Niman` 1.0
- **Secondary**: `forceStats.forceControl` 0.5, `stats.willpower` 0.4, `stats.agility` 0.3, `stats.strength` 0.2
- **Strain bias**: Physical ×1.1, Force ×1.3, Mental ×0.8
- **Notes**: Balanced form integrating Force use with bladework. ForceControl is unusually important as a secondary.

### Juyo / Vaapad (Form VII) — Basics
- **Unlocked by**: `lightsaberForms.Juyo` exists OR `lightsaberForms.Vaapad` exists
- **Primary**: primary form key 1.0
- **Secondary**: `stats.agility` 0.5, `stats.willpower` 0.6, `stats.strength` 0.4, `forceStats.forceControl` 0.3
- **Strain bias**: Physical ×1.6, Force ×1.0, Mental ×1.4
- **Difficulty**: Wall (dangerous, emotionally taxing)
- **Notes**: Most aggressive form. High mental strain from channeling emotion. Willpower is critical for control. Not recommended for Younglings or early Padawans.

---

## FORCE DISCIPLINES

### Telekinesis — Object Levitation Practice
- **Unlocked by**: `forceAbilities.Telekinesis` exists (or always available as Force basic)
- **Primary**: `forceAbilities.Telekinesis` 1.0 (or `forceStats.forceControl` if no Telekinesis ability)
- **Secondary**: `forceStats.forceControl` 0.6, `forceStats.forceSense` 0.3, `stats.willpower` 0.3
- **Strain bias**: Force ×1.8, Mental ×1.0, Physical ×0.2
- **Default intensity**: Standard
- **Difficulty**: Standard at Untrained; Ceiling at Apprentice+
- **Notes**: Foundational Force training. Force Strain primary concern. Longer sessions accumulate rapidly.

### Telekinesis — Force Push/Pull Drills
- **Unlocked by**: `forceAbilities.Telekinesis` ≥ 10
- **Primary**: `forceAbilities.Telekinesis` 1.0
- **Secondary**: `forceStats.forceControl` 0.7, `stats.willpower` 0.4, `forceStats.forceSense` 0.2
- **Strain bias**: Force ×2.2, Mental ×1.0, Physical ×0.3

### Force Sense — Passive Awareness Meditation
- **Unlocked by**: Always available
- **Primary**: `forceStats.forceSense` 1.0
- **Secondary**: `forceStats.meditation` 0.5, `stats.willpower` 0.3, `forceStats.forceControl` 0.2
- **Strain bias**: Force ×1.2, Mental ×1.5, Physical ×0.1
- **Default intensity**: Casual
- **Notes**: Low physical demand. Extended sessions build Force Sense and Meditation simultaneously.

### Force Sense — Active Scanning (people/objects)
- **Unlocked by**: `forceStats.forceSense` ≥ 10
- **Primary**: `forceStats.forceSense` 1.0
- **Secondary**: `forceStats.forceControl` 0.5, `stats.willpower` 0.4, `forceStats.forceKnowledge` 0.2
- **Strain bias**: Force ×1.6, Mental ×1.8, Physical ×0.1
- **Difficulty**: Ceiling
- **Notes**: High mental strain. Reading living beings is significantly harder than objects.

### Meditation — Basic Centering
- **Unlocked by**: Always available
- **Primary**: `forceStats.meditation` 1.0
- **Secondary**: `stats.willpower` 0.4, `forceStats.forceSense` 0.2, `forceStats.forceControl` 0.2
- **Strain bias**: Force ×1.0, Mental ×1.2, Physical ×0.05
- **Default intensity**: Casual
- **Difficulty**: Easy
- **Notes**: Gentle strain. Can be done after other training. Recovers ~5 mental strain per hour at Casual intensity (net positive).

### Meditation — Deep Force Immersion
- **Unlocked by**: `forceStats.meditation` ≥ 15
- **Primary**: `forceStats.meditation` 1.0
- **Secondary**: `forceStats.forceControl` 0.4, `forceStats.forceKnowledge` 0.3, `stats.willpower` 0.5
- **Strain bias**: Force ×1.5, Mental ×1.5, Physical ×0.0
- **Default intensity**: Standard

### Force Barrier — Sustained Hold Practice
- **Unlocked by**: `forceAbilities.ForceBarrier` exists
- **Primary**: `forceAbilities.ForceBarrier` 1.0
- **Secondary**: `forceStats.forceControl` 0.7, `stats.willpower` 0.5, `stats.endurance` 0.2
- **Strain bias**: Force ×2.0, Mental ×1.2, Physical ×0.1
- **Default intensity**: Standard
- **Notes**: Very high Force Strain. Do not exceed 2 hours without rest block.

### Force Speed — Sprint Intervals
- **Unlocked by**: `forceAbilities.ForceSpeed` exists
- **Primary**: `forceAbilities.ForceSpeed` 1.0
- **Secondary**: `forceStats.forceControl` 0.5, `stats.agility` 0.5, `stats.endurance` 0.4
- **Strain bias**: Force ×1.6, Physical ×1.8, Mental ×0.6
- **Notes**: Unusual dual drain on Force and Physical.

### Force Jump — Height/Distance Practice
- **Unlocked by**: `forceAbilities.ForceJump` exists
- **Primary**: `forceAbilities.ForceJump` 1.0
- **Secondary**: `forceStats.forceControl` 0.5, `stats.agility` 0.4, `stats.strength` 0.3
- **Strain bias**: Force ×1.4, Physical ×1.6, Mental ×0.5

### Mind Trick — Concentration Exercises
- **Unlocked by**: `forceAbilities.MindTrick` exists
- **Primary**: `forceAbilities.MindTrick` 1.0
- **Secondary**: `forceStats.forceControl` 0.6, `stats.willpower` 0.6, `stats.charisma` 0.4
- **Strain bias**: Force ×1.3, Mental ×2.0, Physical ×0.1
- **Notes**: Extremely mentally draining. High charisma contribution. 

### Force Absorb — Channeling Drills
- **Unlocked by**: `forceAbilities.ForceAbsorb` exists
- **Primary**: `forceAbilities.ForceAbsorb` 1.0
- **Secondary**: `forceStats.forceControl` 0.7, `stats.willpower` 0.5, `forceStats.meditation` 0.3
- **Strain bias**: Force ×1.9, Mental ×1.1, Physical ×0.1

### Battle Meditation — Focus Training
- **Unlocked by**: `forceAbilities.BattleMeditation` exists
- **Primary**: `forceAbilities.BattleMeditation` 1.0
- **Secondary**: `forceStats.forceControl` 0.6, `forceStats.meditation` 0.5, `stats.willpower` 0.5, `forceStats.forceKnowledge` 0.3
- **Strain bias**: Force ×1.5, Mental ×2.0, Physical ×0.0
- **Difficulty**: Wall
- **Notes**: Rarest ability. Extremely high mental demand. Only practical for 1 hour at a time.

### Force Lightning — Control Exercises  
- **Unlocked by**: `forceAbilities.ForceLightning` exists (Dark Side path)
- **Primary**: `forceAbilities.ForceLightning` 1.0
- **Secondary**: `forceStats.forceControl` 0.7, `stats.willpower` 0.5
- **Strain bias**: Force ×2.5, Mental ×1.5, Physical ×0.2
- **Notes**: Alignment consequence: +2 Dark Side points per hour of practice

### Force Choke / Grip — Control Practice
- **Unlocked by**: `forceAbilities.ForceChoke` exists (Dark Side path)
- **Primary**: `forceAbilities.ForceChoke` 1.0
- **Secondary**: `forceStats.forceControl` 0.6, `stats.willpower` 0.4
- **Strain bias**: Force ×1.8, Mental ×1.3, Physical ×0.1
- **Notes**: Alignment consequence: +1 Dark Side point per hour

---

## PHYSICAL CONDITIONING

### General Conditioning — Cardio
- **Unlocked by**: Always available
- **Primary**: `stats.endurance` 1.0
- **Secondary**: `stats.strength` 0.2, `stats.agility` 0.2
- **Strain bias**: Physical ×2.0, Force ×0.1, Mental ×0.3
- **Default intensity**: Standard

### Strength Training
- **Unlocked by**: Always available
- **Primary**: `stats.strength` 1.0
- **Secondary**: `stats.endurance` 0.4
- **Strain bias**: Physical ×2.2, Force ×0.1, Mental ×0.2

### Agility and Flexibility Training
- **Unlocked by**: Always available
- **Primary**: `stats.agility` 1.0
- **Secondary**: `stats.endurance` 0.3, `stats.strength` 0.2
- **Strain bias**: Physical ×1.6, Force ×0.2, Mental ×0.3

### Combat Sparring (live drills with partner)
- **Unlocked by**: Always available (any saber form or hand-to-hand)
- **Primary**: highest unlocked `lightsaberForms.*` or `stats.strength` 1.0
- **Secondary**: `stats.agility` 0.5, `stats.endurance` 0.5, `stats.strength` 0.4, `forceStats.forceSense` 0.3
- **Strain bias**: Physical ×1.8, Force ×1.0, Mental ×0.8
- **Default intensity**: Intense
- **Notes**: Best XP/hr for combat skills but heaviest combined strain.

---

## ACADEMIC & KNOWLEDGE

### Force History and Lore Study
- **Unlocked by**: Always available
- **Primary**: `forceStats.forceKnowledge` 1.0
- **Secondary**: `stats.willpower` 0.3
- **Strain bias**: Mental ×1.8, Force ×0.3, Physical ×0.0
- **Default intensity**: Casual

### Lightsaber History and Form Theory
- **Unlocked by**: Always available
- **Primary**: `forceStats.forceKnowledge` 1.0
- **Secondary**: any known lightsaber form 0.2 (apply to all known forms equally)
- **Strain bias**: Mental ×1.5, Force ×0.4, Physical ×0.0

### Jedi Code and Philosophy
- **Unlocked by**: Always available (Jedi characters)
- **Primary**: `forceStats.forceKnowledge` 1.0
- **Secondary**: `stats.willpower` 0.4, `forceStats.meditation` 0.2
- **Strain bias**: Mental ×1.5, Force ×0.5, Physical ×0.0
- **Notes**: Reduces alignment drift toward Dark Side slightly over time (narrative note).

---

## MANDATORY TRAINING ACTIVITIES

### Youngling Morning Forms (Mandatory)
- **Life stage**: Youngling
- **Primary**: `lightsaberForms.ShiiCho` 1.0
- **Secondary**: `stats.agility` 0.3, `stats.strength` 0.2, `stats.endurance` 0.2
- **Strain bias**: Physical ×1.3, Force ×0.5, Mental ×0.4
- **Default hours**: 1.5 | Min: 0.5 | Max: 2.0
- **Default intensity**: Standard

### Youngling Group Meditation (Mandatory)
- **Life stage**: Youngling
- **Primary**: `forceStats.meditation` 1.0
- **Secondary**: `forceStats.forceSense` 0.4, `stats.willpower` 0.3
- **Strain bias**: Force ×1.2, Mental ×1.0, Physical ×0.0
- **Default hours**: 1.0 | Min: 0.5 | Max: 1.5

### Youngling Force Fundamentals Class (Mandatory)
- **Life stage**: Youngling
- **Primary**: `forceStats.forceKnowledge` 1.0
- **Secondary**: `forceStats.forceControl` 0.3, `forceStats.forceSense` 0.2
- **Strain bias**: Mental ×1.6, Force ×0.5, Physical ×0.0
- **Default hours**: 1.0 | Min: 0.5 | Max: 1.5

### Padawan Training with Master (Mandatory)
- **Life stage**: Padawan
- **Primary**: Master's specialty skill 1.0 (default: primary saber form)
- **Secondary**: `forceStats.forceControl` 0.4, primary saber form 0.5 (if not primary), `stats.willpower` 0.3
- **Strain bias**: Physical ×1.4, Force ×1.0, Mental ×0.7
- **Default hours**: 2.0 | Min: 1.0 | Max: 3.0
- **Notes**: Grants +1.5 tactical bonus (master present) built into outcome weight.

### Knight Padawan Instruction (Mandatory when padawan assigned)
- **Life stage**: Knight/Master with padawan
- **Primary**: `forceStats.forceKnowledge` 1.0
- **Secondary**: `stats.willpower` 0.3, `stats.charisma` 0.3
- **Strain bias**: Mental ×1.5, Force ×0.4, Physical ×0.1
- **Default hours**: 1.5 | Min: 0.5 | Max: 2.5

---

## SPECIAL / SITUATIONAL

### Dual Saber Practice
- **Unlocked by**: Any two lightsaber form skills in masterXP
- **Primary**: highest form 1.0
- **Secondary**: second form 0.6, `stats.agility` 0.5, `stats.strength` 0.3
- **Strain bias**: Physical ×2.0, Force ×0.8, Mental ×0.7

### Form Combination Drills (two specific forms)
- **Unlocked by**: Both named forms in masterXP at Apprentice (21+) tier
- **Primary**: average of both forms 1.0 (apply to each form at 0.8 and 0.8)
- **Secondary**: `stats.agility` 0.4, `forceStats.forceControl` 0.3
- **Strain bias**: Physical ×1.6, Force ×1.0, Mental ×0.8

### Shadow Training (alone, no instructor)
- **Unlocked by**: Always available (any form/ability)
- **Modifier**: Outcome weight reduced by 10% (no tactical bonus), Difficulty +0.2
- **Notes**: Player removes the +1.5 tactical bonus from outcome weight table

### Force-Enhanced Athletics
- **Unlocked by**: Any Force ability at Apprentice tier
- **Primary**: `stats.agility` or `stats.strength` (player choice) 1.0
- **Secondary**: `forceStats.forceControl` 0.5, chosen stat's pair 0.3
- **Strain bias**: Physical ×1.5, Force ×1.2, Mental ×0.4

