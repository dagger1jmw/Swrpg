# Star Wars Legends RPG — Simulation System Rules v1.0

## Overview

The Simulation Panel compresses in-game time. Instead of playing out every training session turn-by-turn with the AI, you schedule a day's worth of activities, and the JavaScript engine calculates XP, strain, and time advancement deterministically. The AI is only invoked for **personal input rows** and to generate a **narrative summary** of the simulated period.

---

## 1. Core Architecture

### What JavaScript Handles (No AI tokens)
- All XP calculations via `calcTrainingXP()` and `applyXPToSheet()`
- Strain accumulation and recovery
- Multi-stat weight distribution per activity
- Daily hours budget tracking
- Calendar advancement
- Sleep recovery math
- XP penalty modifiers from overtraining

### What the AI Handles (Tokens used)
- Interpreting **personal input** rows into `{ skill, hours, intensity, outcome }` JSON
- Generating the **narrative summary** at the end of simulation (optional, can skip)
- Flagging narrative consequences when strain thresholds are crossed

---

## 2. Daily Schedule Structure

### Hours Budget
- Each day = 24 hours
- All rows (training, sleep, meals) consume from the 24h budget
- Tracker displays `X/24` updating live as rows are added
- Minimum recommended: 6h sleep, 1.5h meals/hygiene = 16.5h available for training
- Simulation can run for user-specified number of days (1–365)

### Row Types

| Type | Deletable | Locked By | Description |
|------|-----------|-----------|-------------|
| **Mandatory** | No | Life stage | Youngling Drills, Master Training, Padawan Instruction |
| **Sleep** | No | Always | One sleep row per day, hours adjustable |
| **Standard Training** | Yes | — | Dropdown-selected activity + hours + intensity |
| **Personal Input** | Yes | — | Free text → AI interprets → JS applies XP |
| **Custom Drill** | Yes | — | User-created saved drill |
| **Meal/Rest** | Yes | — | No XP, strain recovery (light) |

---

## 3. Roll Math & Outcome Rates

### Method
For simulation, we do not roll dice. Instead we use pre-calculated **average outcome weights** derived from 50,000 simulated rolls at each tier's 75th percentile stat value. This represents a character who is solidly established within their tier — not brand new, not about to level up.

### Tier Definitions (from game code)

| Tier | Stat Range | 75th Pct Stat | Roll Bonus | Fail | Contested | Solid | Strong | Overwhelm | Avg Weight |
|------|-----------|----------------|------------|------|-----------|-------|--------|-----------|-----------|
| Untrained | 0–20 | 15 | +6.5 | 10% | 15% | 25% | 25% | 25% | 1.105 |
| Apprentice | 21–40 | 35 | +8.0 | 0% | 15% | 25% | 25% | 35% | 1.194 |
| Adept | 41–60 | 55 | +8.8 | 0% | 15% | 25% | 25% | 35% | 1.195 |
| Master | 61–80 | 75 | +9.4 | 0% | 10% | 25% | 25% | 40% | 1.230 |
| High Master | 81–100 | 95 | +9.8 | 0% | 10% | 25% | 25% | 40% | 1.228 |
| Legendary | 101–150 | 130 | +10.5 | 0% | 5% | 25% | 25% | 45% | 1.263 |

**Assumptions baked into these numbers:**
- Tactical setup bonus: +1.5 (master/instructor present, standard training environment)
- Cross-skill contribution: 50% of primary bonus × (0.3 ForceControl + 0.2 ForceSense weights)
- No dark side or special circumstance modifiers

**To use:** Look up the character's current tier for the skill being trained. Use that row's `Avg Weight` as the outcome multiplier in XP calculation.

### XP Formula (per training block)
```
XP = hours × intensityMult × difficultyMult × avgOutcomeWeight

**avgOutcomeWeight is a multiplier applied to the base rate, not the XP itself.**
Base rate comes from hours × intensityMult × difficultyMult (e.g. 1hr × 15 × 1.0 = 15 base XP).
avgOutcomeWeight then scales that: a weight of 1.105 means you get 15 × 1.105 = ~16.6 XP.
At Untrained tier, solid outcomes give 1.0, strong give 1.2, overwhelming give 1.5.
The weight represents your average across all simulated rolls at that tier.
```

| Intensity | Multiplier |
|-----------|------------|
| Casual | 10 |
| Standard | 15 |
| Intense | 20 |
| Pushing Limits | 25 |
| Elite / Competition | 30 |

| Difficulty | Multiplier |
|------------|------------|
| Easy / Below Level | 0.7 |
| Standard / At Level | 1.0 |
| Ceiling (hard for tier) | 1.2 |
| Wall (above tier) | 1.5 |
| Impossible | 0.3 |

### Expected XP Per Hour (primary skill, standard conditions)

| Tier | Standard Intensity | Intense |
|------|-------------------|---------|
| Untrained | ~16.6 XP/hr | ~26.5 XP/hr |
| Apprentice | ~17.9 XP/hr | ~28.7 XP/hr |
| Adept | ~17.9 XP/hr | ~28.7 XP/hr |
| Master | ~18.4 XP/hr | ~29.5 XP/hr |
| High Master | ~18.4 XP/hr | ~29.5 XP/hr |
| Legendary | ~18.9 XP/hr | ~30.3 XP/hr |

*Secondary skills receive their weight fraction of this amount (e.g. a skill with weight 0.5 gets 50% of primary XP)*


---

## 3b. Tier-Gap Training (Attempting Above Your Level)

Training at a difficulty tier above your current level is risky but rewarding. The JS applies this as a difficulty multiplier AND a strain multiplier.

| Your Tier vs Drill Tier | Difficulty | XP Multiplier | Strain Multiplier | Notes |
|------------------------|------------|---------------|-------------------|-------|
| Same tier (0 gap) | Standard | 1.0× | 1.0× | Normal training |
| 1 tier above | Ceiling | 1.2× | 1.3× | Harder, more rewarding |
| 2 tiers above | Wall | 1.5× | 1.7× | High failure rate, high strain |
| 3+ tiers above | Impossible | 0.3× | 2.5× | Mostly fail — not recommended |
| 1 tier below | Easy | 0.7× | 0.8× | Lower strain, lower XP |

**Roll outcomes shift dramatically when training above tier.** At 1 tier above:
- Add ~4 to the opponent difficulty (from `tierGapBonus` table: gap 1 = +4)
- This means the roll threshold feels like rolling against a harder target
- Failure rate increases significantly at Untrained vs Apprentice drills

**Strain is also amplified** because your body/mind is working beyond its current capacity.
The endurance mitigation still applies on top of the tier-gap strain multiplier.

**Example:** Padawan (Untrained tier, stat=15) attempting a Apprentice Makashi drill (tier 2):
- Base XP/hr: ~16.6 × 1.2 (ceiling difficulty) = ~20 XP/hr (if succeeds)
- But failure rate is ~25% instead of 10% — so avg outcome weight drops
- Strain/hr: standard × 1.3 = Force 3.1, Physical 4.2, Mental 2.1


---

## 4. Multi-Stat XP Distribution

Every training activity distributes XP across multiple stats using a **weight map**. Primary skill always gets weight 1.0. Secondary skills get fractional weights.

### Weight Map Format
```javascript
{
  primary: 'lightsaberForms.ShiiCho',
  weights: [
    { path: 'lightsaberForms.ShiiCho', weight: 1.0 },
    { path: 'stats.strength',          weight: 0.4 },
    { path: 'stats.agility',           weight: 0.3 },
    { path: 'forceStats.forceControl', weight: 0.2 },
  ]
}
```

XP for each weighted skill = `(baseXP from formula) × weight`

The primary skill's tier determines the outcome weight used for ALL skills in the block.

---

## 5. Strain System

### Strain Accumulation Per Training Hour

| Intensity | Force Strain/hr | Physical Strain/hr | Mental Strain/hr |
|-----------|----------------|-------------------|-----------------|
| Casual | 1.0 | 1.5 | 0.5 |
| Standard | 2.4 | 3.2 | 1.6 |
| Intense | 4.2 | 5.6 | 2.8 |
| Pushing Limits | 6.0 | 8.0 | 4.0 |
| Elite | 8.0 | 10.0 | 6.0 |

*Force-heavy activities (meditation, Force abilities) weight Force Strain higher. Physical activities (agility drills, conditioning) weight Physical Strain higher. Academic/knowledge activities weight Mental Strain.*

### Activity Strain Bias Multipliers
Each activity specifies which strain types are emphasized:
- **Saber forms**: Physical ×1.5, Force ×0.8, Mental ×0.6
- **Force abilities**: Force ×1.8, Mental ×1.0, Physical ×0.3
- **Meditation**: Force ×1.5, Mental ×1.5, Physical ×0.1
- **Physical conditioning**: Physical ×2.0, Force ×0.2, Mental ×0.5
- **Academic / Force Knowledge**: Mental ×2.0, Force ×0.5, Physical ×0.1
- **Sparring (live)**: Physical ×1.8, Force ×1.0, Mental ×0.8

### Daily Strain Thresholds & Consequences

| Strain Level | Effect | Narrative Flag |
|-------------|--------|---------------|
| 0–20 | No effect | None |
| 21–50 | XP gains ×0.9 | "Fatigued" |
| 51–70 | XP gains ×0.7 | "Strained — focus faltering" |
| 71–90 | XP gains ×0.4 | "Overtrained — efficiency crashes" |
| 91+ | XP gains ×0.1 | "Exhausted — narrative consequence generated" |

Strain is tracked live within each simulated day. Once a threshold is crossed, all subsequent training that day uses the lower multiplier.

The worst strain type (highest value of Force/Physical/Mental) determines which threshold category applies.

### Sleep Recovery

| Sleep Hours | Strain Recovered | Notes |
|-------------|----------------|-------|
| 8+ | 100% | Full recovery |
| 7 | 85% | Slight residual fatigue |
| 6 | 65% | Moderate fatigue carries forward |
| 5 | 45% | Significant — carries forward noticeably |
| 4 | 25% | Severe — narrative flag next morning |
| 3 or less | 10% | Dangerous — AI generates consequence |

Recovery applies to all three strain types equally. Residual strain from insufficient sleep carries into the next day's starting values.


---

## 5b. Endurance and Strain Mitigation

Endurance reduces ALL strain accumulation — both in-game turns and in simulation.

**Formula:** `endurance_mitigation (em) = compressedBonus(endurance) / 10`

| Endurance | em | Physical Reduction | Force Reduction | Mental Reduction |
|-----------|----|--------------------|-----------------|-----------------|
| 0 | 0.00 | 0% | 0% | 0% |
| 20 | 0.10 | 10% | 5% | 3% |
| 40 | 0.20 | 20% | 10% | 6% |
| 60 | 0.25 | 25% | 12.5% | 7.5% |
| 80 | 0.30 | 30% | 15% | 9% |
| 100 | 0.325 | 32.5% | 16.3% | 9.8% |

**This is already implemented in the game code.** All three strain paths (CHANGES block, markdown fallback, and combat accumulation) apply endurance mitigation automatically. The AI does not pre-apply it.

A character with END=80 can sustain ~8 hours of intense lightsaber training before hitting 70% physical strain (vs ~6 hours at END=0). Combined with Force-rejuvenation abilities, very high endurance characters can operate for extended periods.


---

## 6. Mandatory Training Rows (Life Stage)

These rows cannot be deleted. Hours can be adjusted within a range.

| Life Stage | Mandatory Row | Default Hours | Min | Max | Skills Trained |
|-----------|--------------|---------------|-----|-----|----------------|
| Youngling | Morning Forms Drills | 1.5 | 0.5 | 2.0 | ShiiCho, Agility, Strength |
| Youngling | Group Meditation | 1.0 | 0.5 | 1.5 | Meditation, ForceSense |
| Youngling | Force Fundamentals Class | 1.0 | 0.5 | 1.5 | ForceKnowledge, ForceControl |
| Padawan | Training with Master | 2.0 | 1.0 | 3.0 | Varies by master specialty |
| Padawan | Solo Practice | 1.0 | 0.5 | 2.0 | Player choice |
| Knight | Padawan Instruction | 1.5 | 0.5 | 2.5 | ForceKnowledge + padawan's skill |
| Any | Sleep | 7.0 | 3.0 | 12.0 | Recovery only |

---

## 7. Custom Drills

Users can create and save custom drills. A drill is a named training configuration stored in `localStorage`.

### Drill Object Format
```javascript
{
  id: 'drill_uuid',
  name: 'Agility Saber Kata',
  description: 'Flowing footwork sequences emphasizing speed over power',
  defaultIntensity: 'intense',
  strainBias: { force: 0.8, physical: 1.5, mental: 0.6 },
  weights: [
    { path: 'lightsaberForms.Ataru', weight: 1.0 },
    { path: 'stats.agility',         weight: 0.6 },
    { path: 'stats.endurance',       weight: 0.3 },
    { path: 'forceStats.forceControl', weight: 0.2 },
  ],
  createdAt: 'ISO date string',
  unlockedBy: null  // or 'lightsaberForms.Ataru' — auto-appears when skill exists
}
```

### Drill Unlock Logic
- Drills with `unlockedBy: null` are always available
- Drills with `unlockedBy: 'lightsaberForms.Ataru'` appear in the dropdown automatically when `masterXP.lightsaberForms.Ataru` exists
- New abilities added to `masterXP` automatically get a generic drill entry: `"[FormName] Basics"` with standard weights

---

## 8. Personal Input Row

1. User types free text: *"I practice the opening sequence of Makashi footwork for 2 hours"*
2. On simulate, JS sends to AI with structured prompt:
   ```
   Interpret this training activity and return ONLY valid JSON, no other text:
   Activity: "[user text]"
   Character skills available: [list from masterXP]
   Return: {"primarySkill":"path.key","hours":N,"intensity":"standard|intense|casual|pushing|elite","difficulty":"easy|standard|ceiling|wall","notes":"brief flavor text"}
   ```
3. AI returns JSON. JS validates and calls `calcTrainingXP()` + `applyXPToSheet()`.
4. If AI returns invalid JSON, row is skipped with a warning.

---

## 9. Narrative Summary

After simulation completes, if the user requests a narrative summary:
- JS sends the AI a compact log: days run, XP gained per skill, strain peaks, any threshold crossings, sleep averages
- AI generates a 2–3 paragraph in-world summary of the training period
- This does NOT call the main game loop — it's a separate lightweight call
- Narrative consequences (exhaustion, breakthrough moments, strain injuries) are flagged here

---

## 10. Calendar Advancement

- Each simulated day advances `worldState.inGameDate` by 1 using `advanceInGameDate()`
- Time is set to the end of the last training block of each day
- After simulation, `autoSave()` is called once
- The main game feed shows a single summary message rather than individual day entries

