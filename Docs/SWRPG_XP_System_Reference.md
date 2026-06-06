# Star Wars Legends RPG — XP System Reference

> **Source:** Derived directly from `starwars_rpg_V97.html` (JS engine). All formulas and numbers are exact. Updated to reflect v3 additions (Force Output, Intelligence, Sub-ability Proficiency).

---

## 1. The Core XP Curve

Every stat — core stats, Force stats, Force abilities, lightsaber forms — uses the same exponential curve. Getting better always costs 7% more per level.

```
XP required to advance FROM level n TO level n+1:
xpRequired(n) = floor(100 × 1.07^n)
```

### Cost table — XP to advance by 1 level

| Current Level | XP for next level | Cumulative XP to reach this level |
|---|---|---|
| 0 | 100 | 0 |
| 5 | 140 | 575 |
| 10 | 197 | 1,381 |
| 15 | 276 | 2,752 |
| 20 | 387 | 4,995 |
| 25 | 543 | 8,525 |
| 30 | 761 | 13,987 |
| 40 | 1,497 | 31,440 |
| 50 | 2,946 | 62,248 |
| 60 | 5,793 | 113,978 |
| 70 | 11,398 | 197,659 |
| 80 | 22,406 | 331,988 |
| 90 | 44,064 | 545,065 |
| 100 | 86,717 | 882,440 |

> **Key implication:** Going from 0→60 costs ~114,000 XP. Going from 60→80 costs another ~218,000 XP. The upper ranges are long, hard climbs — designed that way intentionally.

---

## 2. Stat Categories

| Category | JS path | Examples |
|---|---|---|
| Core stats | `stats.*` | strength, agility, endurance, willpower, charisma, intelligence |
| Force stats | `forceStats.*` | forceSense, meditation, forceKnowledge, forceControl, forceOutput |
| Force abilities | `forceAbilities.*` | Telekinesis, ForceLightning, MindTrick, Shatterpoint, etc. |
| Lightsaber forms | `lightsaberForms.*` | ShiiCho, Makashi, Soresu, Ataru, ShienDjemSo, Juyo, Vaapad, etc. |

All four categories use `masterXP.[category].[key].totalXP` as the source of truth. The displayed level is always **derived** from totalXP — it is never stored directly and can never be corrupted by AI edits.

---

## 3. Stat Tiers

Tier affects combat rolls, NPC challenge ratings, and XP yield from combat (see §6).

| Level range | Tier # | Name |
|---|---|---|
| 0 – 20 | 1 | **Initiate** |
| 21 – 40 | 2 | **Padawan** |
| 41 – 60 | 3 | **Knight** |
| 61 – 80 | 4 | **Master** |
| 81 – 100 | 5 | **Grandmaster** |
| 101 – 150 | 6 | **Legendary** |
| 151+ | 7 | **Transcendent** |

**Dueling tier** is derived from the character's highest lightsaber form level.
**Force tier** is derived from ForceControl specifically.

---

## 4. The Roll Bonus Formula (compressedBonus)

When rolling dice, each stat contributes a bonus using a compressed curve — not linear, so high stats don't completely break the game:

```
compressedBonus(stat):
  if stat ≤ 40:  bonus = stat / 20               → +0.0 to +2.0
  if stat ≤ 80:  bonus = 2.0 + (stat - 40) / 40  → +2.0 to +3.0
  if stat ≤ 100: bonus = 3.0 + (stat - 80) / 80  → +3.0 to +3.25
  if stat > 100: bonus = 3.25 + (stat - 100) / 200
```

**Roll total = d20 + sum(compressedBonus for each listed stat) + experienceBonus + tierGapBonus + tacticalBonus**

### Experience Bonus (automatic on any combat/Force roll)
Added on top, representing accumulated skill beyond the active form:
- For saber rolls: `compressedBonus(highest form level) × 0.4`
- For Force rolls: `compressedBonus(ForceControl) × 0.3 + compressedBonus(ForceSense) × 0.2`

### Tier Gap Bonus (flat, based on tier difference)
| Tier gap | Flat bonus |
|---|---|
| 0 | +0 |
| 1 | +4 |
| 2 | +9 |
| 3 | +15 |
| 4 | +22 |
| 5 | +30 |
| 6+ | +39 |

---

## 5. Training XP (Real Play — Single Session)

When Jared trains during a story turn, the AI awards XP via the `CHANGES` block:
```
XP: forceAbilities.Telekinesis,150
```

The amount comes from: `calcTrainingXP(hours, intensity, difficulty, outcome)`

```
Training XP = hours × intensity_mult × difficulty_mult × outcome_mult
```

### Intensity multipliers
| Keyword(s) | Multiplier |
|---|---|
| casual, slow, deliberate | 10 |
| standard, normal, moderate | **15** |
| intense, focused, hard | 20 |
| pushing, limits, extreme | 25 |
| elite, sparring, danger | 30 |

### Difficulty multipliers
| Keyword(s) | Multiplier |
|---|---|
| basic, easy, within, familiar | 1.0 |
| ceiling, challenging, above | 1.3 |
| difficult, far | 1.6 |
| impossible | 2.0 |

### Outcome multipliers
| Keyword(s) | Multiplier |
|---|---|
| failure, struggle | 0.8 |
| partial, contested | 1.0 |
| solid, success | 1.2 |
| strong, good | 1.5 |
| overwhelming, exceptional | 2.0 |
| breakthrough, insight | **3.0** |

### Example calculations

| Scenario | Hours | Intensity | Difficulty | Outcome | XP |
|---|---|---|---|---|---|
| Casual TK practice | 1 | 10 | 1.0 | 1.0 | **10** |
| Standard supervised training | 1 | 15 | 1.0 | 1.2 | **18** |
| Intense supervised, challenging difficulty, good outcome | 1 | 20 | 1.3 | 1.5 | **39** |
| 2-hour elite sparring, perfect execution | 2 | 30 | 1.6 | 1.5 | **144** |
| Breakthrough moment — 30 min | 0.5 | 20 | 1.3 | 3.0 | **39** |

> **Narrative XP note:** When the AI awards XP in prose text (e.g., "Telekinesis: +2 XP"), the engine automatically multiplies by **50** as a conversion factor from the old 0-10 scale. So AI prose giving "+2 XP" actually yields 100 XP in the new system.

---

## 6. Combat XP (Real Play — After a Fight)

Combat XP is awarded automatically at the end of a fight via `endCombat()`. The amount is driven primarily by **who you fought** (opponent tier), not just how long it lasted.

```
Combat XP formula:
base = baseTierXP[opponentTier]         // tier of who you fought
primary = base × durationFactor × engagementFactor × outcomeFactor

Secondary skill also gains: primary × 0.4
```

### Base XP by opponent tier
| Opponent Tier | Name | Base XP |
|---|---|---|
| 1 | Initiate | 50 |
| 2 | Padawan | 120 |
| 3 | Knight | **300** |
| 4 | Master | 750 |
| 5 | Grandmaster | 1,800 |
| 6 | Legendary | 4,500 |
| 7 | Transcendent | 11,000 |

### Duration factor
| Rounds | Factor |
|---|---|
| 1–3 (brief) | 0.5 |
| 4–10 (standard) | **1.0** |
| 11+ (extended) | 1.5 |

### Engagement factor
| Keyword | Factor |
|---|---|
| passive, defensive | 0.7 |
| mixed, balanced | **1.0** |
| aggressive, offensive, leading | 1.3 |

### Outcome factor
| Outcome | Factor | Notes |
|---|---|---|
| overwhelming_win, dominated | 0.5 | Easy win, learned little |
| win, victory | **1.2** | Standard win |
| strong_win / won_against_stronger | 2.0 | Punching above weight |
| narrow_loss, close | 1.5 | Close fights teach a lot |
| loss / lost_to_stronger | 1.8 | Defeat is instructive |
| survived / survived_dominant | **2.5** | Near-death experience |

### Example: Standard fight against an Adept
- Opponent tier 3, 5 rounds, balanced engagement, victory
- Primary: 300 × 1.0 × 1.0 × 1.2 = **360 XP** to primary skill
- Secondary: 360 × 0.4 = **144 XP** to secondary skill

### Example: Surviving a Master-tier Sith (brutal)
- Opponent tier 4, 8 rounds, aggressive on your part, survived
- Primary: 750 × 1.0 × 1.3 × 2.5 = **2,438 XP** — a major leap

---

## 7. Time-Skip Simulation XP

The simulation panel runs **JS-driven training** across days/weeks without AI calls. Every week of training is resolved by:

```
Weekly XP per stat path =
  hours_per_day × intensity_mult × difficulty_mult × outcome_weight × strain_penalty × activity_weight × days
```

The outcome weight here is **tier-based** (automatic) rather than declared:

### Simulation outcome weights by current stat tier
| Stat Tier | Name | Outcome Weight |
|---|---|---|
| 1 | Initiate | 1.105 |
| 2 | Padawan | 1.194 |
| 3 | Knight | 1.195 |
| 4 | Master | 1.230 |
| 5 | Grandmaster | 1.228 |
| 6 | Legendary | 1.263 |
| 7 | Transcendent | 1.263 |

**Activity weights:** Each simulation activity splits XP across multiple stats via a weights array. Example, Shii-Cho Basics:
```
ShiiCho: w=1.0 | strength: w=0.4 | agility: w=0.3 | endurance: w=0.2 | forceControl: w=0.15
```
The total XP for the session is split proportionally across all these paths simultaneously.

### Simulation difficulty keywords
| Keyword | Multiplier |
|---|---|
| easy | 0.7 |
| standard | **1.0** |
| ceiling | 1.2 |
| wall | 1.5 |

### Example weekly calculation
1 hour/day of standard Shii-Cho practice, standard difficulty, no strain, 7 days:
- ShiiCho: `1 × 15 × 1.0 × 1.105 (tier 1 outcome weight) × 1.0 (no penalty) × 1.0 (weight) × 7 = 115.5 XP/week`
- Strength simultaneously: `1 × 15 × 1.0 × 1.105 × 1.0 × 0.4 × 7 = 46.4 XP/week`

---

## 8. The Strain Penalty System

Strain affects XP gains during the simulation. The penalty applies to **the worst of the three strain types** (Force, Physical, Mental) *after* meditation recovery is subtracted.

### Daily strain accumulation formula
```
Per-activity per-hour:
  Force strain:    SIM_STRAIN_BASE.f (2.4) × intensity_mult × bias.f × (1 - endurance_bonus × 0.5)
  Physical strain: SIM_STRAIN_BASE.p (3.2) × intensity_mult × bias.p × (1 - endurance_bonus)
  Mental strain:   SIM_STRAIN_BASE.m (1.6) × intensity_mult × bias.m × (1 - endurance_bonus × 0.3)
```
Where `endurance_bonus = compressedBonus(endurance) / 10` — high Endurance directly reduces all strain accumulation.

### Intensity strain multipliers (separate from XP multipliers)
| Intensity | Strain Mult |
|---|---|
| casual | 0.5 |
| standard | **1.0** |
| intense | 1.75 |
| pushing | 2.5 |
| elite | 3.3 |

### XP penalty by daily net strain (worst axis, post-recovery)
| Worst daily strain | XP Penalty | Notes |
|---|---|---|
| 0–20 | **×1.0** | Full gains — well-managed training |
| 21–50 | **×0.9** | Minor fatigue, barely noticeable |
| 51–70 | **×0.7** | Strained — meaningfully reduced |
| 71–90 | **×0.4** | Overtrained — narrative consequence fires |
| 91–100 | **×0.1** | Extreme overtraining — almost no gain |

> **Practical implication:** Meditation activities actively *subtract* from daily strain before the penalty is calculated. Including regular meditation in a schedule is the most important strategy for maintaining high XP rates during long training periods.

---

## 9. Sleep Recovery

Each night, accumulated strain is partially cleared by sleep. Meditation handles the *daily* recovery; sleep handles the *nightly* reset.

| Hours of sleep | Recovery multiplier applied to accumulated daily strain |
|---|---|
| 8+ hours | **100%** — full nightly reset |
| 7 hours | 85% |
| 6 hours | 65% |
| 5 hours | 45% |
| 4 hours | 25% |
| < 4 hours | 10% — dangerously little recovery |

> **Why this matters:** Training on 6 hours of sleep doesn't fully clear the daily strain, so strain builds up across the week. By midweek you're in the 51–70 strain penalty band (×0.7 XP). Full 8-hour sleep keeps the daily reset complete.

---

## 10. Momentum Windows

A breakthrough, exceptional performance, or significant story event can open a **Momentum Window** — a timed XP multiplier set via the AI's `CHANGES` block:

```
MOMENTUM_WINDOW: 1.5,3   ← 1.5× multiplier for 3 in-game days
```

The multiplier applies to all XP earned in real turns (training, combat, narrative) during that window. The window expires automatically at `expiresDate`. A multiplier of 0 or 0 days closes it early.

---

## 11. Innate Talents — XP Effects

These are set at character creation (or via player override). They modify XP costs and rates.

| Talent | XP Effect |
|---|---|
| **Quick Study** | ForceKnowledge XP gains ×1.2 |
| **Force-Sensitive Healer** | All healing ability XP gain ×1.3 |
| **Natural Telekinetic Burst** | Telekinesis family Force *Strain* ×0.8 (reduces strain, indirectly helps XP rate) |
| **Unbreakable Spirit** | At 90+ strain, XP penalty is ×0.3 instead of ×0.1 |
| **ShatterSense** | Shatterpoint XP cost ×0.1 (90% cheaper); uncapped track; passive perception |
| **Battle Meditation Affinity** | Battle Meditation XP ×0.3 (70% cheaper); Force Strain ×0.6 |
| **BladeIntuition** | First lightsaber form starts with 5 bonus levels at character creation |
| **Iron Mind** | Mental Strain accumulates at ×0.8 rate (helps maintain XP rates mentally) |
| **Living Force Connection** | Environmental Force Sense always active; Animal Bond strain-free |

---

## 12. Sub-Ability Proficiency (v3 System)

Sub-abilities within a family (e.g., Force Shock, Chain Lightning, Force Storm under Force Lightning) each have a **proficiency percentage** (0–100%) that tracks how well you've practiced that specific application. The base ability level is the *ceiling*; proficiency determines how much of that ceiling you can actually express.

### The proficiency cost curve
```
profCostPerPoint(pct, D) = floor(D × 20 × 1.07^(pct × 0.8))
```
Where `pct` is current percentage (0–99) and `D` is difficulty tier.

### Total XP investment by difficulty (0→100% full proficiency)
| Difficulty | D value | Total XP | Equivalent base-ability milestone |
|---|---|---|---|
| **Basic** | 1.0 | ~81,700 XP | Same as reaching base ability level 60 |
| **Moderate** | 1.5 | ~122,550 XP | Same as reaching base ability level 67 |
| **Complex** | 2.5 | ~204,250 XP | Same as reaching base ability level 73 |
| **Advanced** | 4.0 | ~326,800 XP | Same as reaching base ability level 80 |

### Proficiency tiers
| Range | Tier | What it means in play |
|---|---|---|
| 0–25% | **Novice** | Unlocked; works but rough, high Strain, imprecise |
| 26–50% | **Developing** | Reliably functional; Strain normalizing |
| 51–70% | **Proficient** | Solid combat utility; controlled execution |
| 71–90% | **Expert** | Refined application; Strain reduced; consistent precision |
| 91–100% | **Mastered** | Signature technique; near-minimum Strain |

### The two discount factors
**Base Ability Factor** — stronger foundation = cheaper sub-ability learning:
| Base ability level | Cost multiplier |
|---|---|
| 0–19 | ×1.00 (no discount) |
| 20–39 | ×0.90 |
| 40–59 | ×0.75 |
| 60–79 | ×0.60 |
| 80–100 | ×0.50 |

**ForceControl Factor** — refined control = faster application learning:
| ForceControl | Cost multiplier |
|---|---|
| 0–19 | ×1.25 (harder) |
| 20–39 | ×1.10 |
| 40–59 | ×1.00 (baseline) |
| 60–79 | ×0.85 |
| 80–100 | ×0.70 |

**Applying discounts:** `effectiveXP = rawXP / (BaseAbilityFactor × ControlFactor)` — higher base ability + higher ForceControl means more effective proficiency XP from each session.

### Soft cap
Proficiency can be trained higher than the soft cap, but effectiveness is capped until the base ability catches up:
| Base ability level | Max effective proficiency |
|---|---|
| 0–20 | 25% |
| 21–40 | 50% |
| 41–60 | 70% |
| 61–80 | 85% |
| 81–100 | 100% |

### Trickle rates (automatic, no tracking needed)
- Training the **base ability** → +5% of base XP earned trickles to all unlocked sub-ability proficiencies (passive sharpening)
- Training a **sub-ability** → 20% of proficiency XP trickles back to the base ability as regular XP

### Awarding proficiency via CHANGES block
```
PROFICIENCY: ForceLightning.ForceStorm,150
```
Amounts follow the same scale as regular XP. Standard supervised session ≈ 15/hour.

---

## 13. masterXP Architecture

This is how the engine stores and derives all XP. Understanding this prevents confusion when reading saves or debugging.

```javascript
masterXP = {
  forceStats:              { forceSense: { totalXP: 0 }, ... },
  stats:                   { strength:   { totalXP: 0 }, ... },
  forceAbilities:          { Telekinesis: { totalXP: 0 }, ... },
  lightsaberForms:         { ShiiCho:    { totalXP: 0 }, ... },
  forceAbilityProficiency: { "ForceLightning.ForceStorm": { totalProfXP: 0, D: 4.0 }, ... }
}
```

**The AI never writes to masterXP directly.** The AI's SHEET JSON is parsed and then `syncMasterXPToSheet()` overwrites the displayed values from masterXP. XP is added only via `applyXPToSheet(path, xpAmount)` or the simulation engine.

**Level is always derived:**
```javascript
function deriveFromTotalXP(totalXP) {
  let level = 0;
  let remaining = totalXP;
  while (remaining >= xpRequired(level)) {
    remaining -= xpRequired(level);
    level++;
  }
  return { level, current: remaining, required: xpRequired(level) };
}
```

---

## 14. CHANGES Block Tags — XP & Progression

Tags the AI uses to update stats and award XP. These are the only legitimate ways the AI modifies the XP system.

| Tag | Format | Effect |
|---|---|---|
| `XP:` | `XP: forceStats.forceSense,150` | Award XP to a stat path |
| `XP:` | `XP: forceAbilities.Telekinesis,200` | Award XP to an ability |
| `XP:` | `XP: lightsaberForms.ShiiCho,100` | Award XP to a form |
| `PROFICIENCY:` | `PROFICIENCY: ForceLightning.ForceStorm,150` | Award proficiency XP to a sub-ability |
| `MOMENTUM_WINDOW:` | `MOMENTUM_WINDOW: 1.5,3` | Open a momentum window (mult, days) |
| `LIFE_STAGE:` | `LIFE_STAGE: padawan` | Update life stage (story event only) |
| `ROLL:` | `ROLL: forceStats.forceControl\|forceAbilities.Telekinesis` | Fire a d20 roll |
| `COMBAT_START:` | `COMBAT_START: opponent\|standard` | Begin combat tracking |
| `COMBAT_ROUNDS:` | `COMBAT_ROUNDS: 3\|standard` | Accumulate combat strain |
| `COMBAT_END:` | `COMBAT_END: win\|mixed\|2` | Close combat, award XP |
| `ALIGNMENT:` | `ALIGNMENT: -8` | Adjust alignment score |

> **CHANGES block format:**
> ```
> <<<CHANGES>>>
> XP: forceAbilities.Telekinesis,180
> XP: forceStats.forceControl,90
> ALIGNMENT: +3
> <<<END_CHANGES>>>
> ```

---

## 15. Mandatory Training by Life Stage (Simulation)

These rows run automatically every simulated week — the character cannot skip them.

| Life stage | Mandatory activity | Default hours | Primary XP target |
|---|---|---|---|
| **Youngling** | Morning Forms Drills | 1.5 hrs | ShiiCho (w=1.0) |
| **Youngling** | Group Meditation | 1.0 hrs | Meditation (w=1.0) — *recovery* |
| **Youngling** | Force Fundamentals | 1.0 hrs | ForceKnowledge (w=1.0) |
| **Padawan** | Training with Master | 2.0 hrs | ForceControl (w=0.6), ForceSense (w=0.4) |
| **Knight/Master with Padawan** | Padawan Instruction | 1.5 hrs | ForceKnowledge (w=1.0) |

---

## 16. Quick Reference — Calibration Card

Use these as a mental anchor when deciding if an XP award feels right.

### "How much is 1 hour of training worth?"
| Context | Approx XP |
|---|---|
| Casual solo practice | 10 |
| Standard supervised session | 15–18 |
| Intense supervised, familiar material | 26–30 |
| Combat — standard sparring session | 15–18 |
| Breakthrough moment (genuine insight) | 40–60 |
| Live combat vs a peer (wins) | ~360 |
| Live combat vs a Master (survives) | ~2,400 |

### "How much does it cost to advance a level?"
At standard supervised training (18 XP/hour, 1 hour/day):
| Stat range | Tier | XP to advance 1 level | Days at 18 XP/day |
|---|---|---|---|
| Level 0–10 | Initiate | 100–197 XP | 5–11 days |
| Level 20–30 | Padawan | 387–761 XP | 22–42 days |
| Level 40–50 | Knight | 1,497–2,946 XP | 83–163 days |
| Level 60–70 | Master | 5,793–11,398 XP | 322–633 days ≈ 1–2 years |
| Level 80–90 | Grandmaster | 22,406–44,064 XP | 5–7 years per level |

### "How much does strain cost me?"
| Daily schedule | Typical worst strain | XP penalty |
|---|---|---|
| Light training (4 hrs casual) | ~15 | None (×1.0) |
| Normal training (6 hrs standard) | ~30 | Minor (×0.9) |
| Heavy training (8 hrs standard) | ~55 | Noticeable (×0.7) |
| Elite training (8 hrs intense) | ~85 | Overtrained (×0.4) |
| Elite + no sleep | ~95 | Extreme (×0.1) |

> **Rule of thumb:** Include at least 1 hour of meditation activity in every sim schedule. It actively subtracts from daily strain and is the primary lever for staying in the full-XP zone.

---

*Last updated: v3 — Force Output, Intelligence, and Sub-ability Proficiency system added.*
*Source file: starwars_rpg_V97.html*
