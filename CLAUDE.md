# CLAUDE.md — Star Wars Legends RPG
## Persistent orientation document for every Claude Code session

> **Read this entire file before touching any code or running any session.** It is the single source of truth for project architecture, game rules, and AI behavior. Update the "Current Character State" and "Session Log" sections at the end of every session.

---

## 1. PROJECT OVERVIEW

A single-file browser-based Star Wars Legends text RPG deployed to GitHub Pages at `dagger1jmw.github.io`. The **entire game** — HTML, CSS, JavaScript, AI system prompt — lives in one `.html` file. There is no build system, no npm, no bundler, no external JS files. This is an intentional hard constraint.

**AI Backend:** Gemini API (`gemini-2.5-flash`). The API key is stored in `localStorage` as `sw_rpg_gemini_key`. The AI acts as Game Master: narrating, resolving actions, and awarding XP. JS handles all math.

**Primary device:** iPad Safari. All UI/CSS decisions must be mobile-first. iOS Safari has specific quirks documented in the dev notes section below.

**The game:** Player controls Jared Wright, a Human Jedi padawan in 3661 BBY (Old Republic era, Great Galactic War year 20). The world is a living sandbox — persistent stats, real XP progression, canonical Legends lore. The Jedi Order and Sith Empire are at war. Coruscant is under blockade (recently broken by Hylo Visz).

**Overall goal:** A long-running sandbox RPG with genuine stat growth, canonical lore fidelity, and mechanically grounded Force progression. The character will grow from padawan to potentially legendary power over many real-world sessions.

---

## 2. FILE STRUCTURE

All paths relative to the project root (`C:\Users\dagge\OneDrive\Desktop\Swrpg\`).

### Root
| File | Contents | When to reference |
|---|---|---|
| `index.html` | **The entire game.** HTML + CSS + JS (~10,250 lines). Contains the AI system prompt (MASTER_PROMPT), all game logic, UI, XP engine, simulation panel, calendar, shatterpoint system, alignment system, FORCE_ABILITY_CATALOG, LORE_DATABASE, FORCE_ABILITY_RULES, `getEraLore()`, `buildLoreContext()`. | Always — this is the only file you run or edit. |

**Versioning rule:** When making significant changes, save as a new version (V112, V113, etc.). Never overwrite the current version without creating a new one first.

**Key code structures added in V111** (all embedded in the single HTML file):
| Structure | Approx Line | Purpose |
|---|---|---|
| `FORCE_ABILITY_CATALOG` | ~5605 | Canonical lookup for every learnable ability: family, parent/child, D-value, alignment, anchor stats, prereqs, story flags |
| `LORE_DATABASE` | ~5781 | 157 NPC character sheets (Eras 01–18 + Era09B), `currentEra` faction state, `apexCeiling` hierarchy, `timeline` events |
| `getEraLore(dateBBY)` | ~7310 | Filters LORE_DATABASE to active NPCs + nearby timeline events; returns structured object for AI injection |
| `FORCE_ABILITY_RULES` | ~7335 | Compact lookup (anchor stats, prereq summary, sub-application list) for abilities the player currently knows — injected into AI context |
| `buildLoreContext()` | ~7379 | Assembles the per-turn lore block: situation, factions, temple state, timeline events, active NPCs with power stats, apex ceiling, player ability rules. Injected into `stateBlock` in `buildContext()` every turn. |

### Docs/
| File | Contents | When to reference |
|---|---|---|
| `Docs/CLAUDE changelog.md` | Project changelog, architecture rules, global variable list, AI response format, alignment system, shatterpoint system, simulation system, calendar, innate talents, story flags, character state snapshot, known issues, dev notes. **This was the prior orientation document.** | For architecture details, engine behavior, changelog history. |
| `Docs/updates.md` | Detailed per-version engine change log with root cause analysis, code locations, and before/after diffs for each fix. | When reviewing what changed in a specific version or debugging a regression. |
| `Docs/SW_Sim_Rules_v1.md` | Simulation panel deep-dive: roll math, outcome weights by tier, XP formula, strain accumulation, tier-gap training, multi-stat weight maps, sleep recovery, endurance mitigation, mandatory training rows. | Whenever editing the simulation panel or calculating sim XP. |
| `Docs/SW_Activity_Bank_v1.md` | Every training activity: primary skill, secondary weights, strain bias, unlock conditions, default intensity. Reference for simulation activity definitions. | When adding new sim activities or checking weight maps. |
| `Docs/SWRPG_XP_System_Reference.md` | XP math reference: the 100×1.07^n curve, stat categories, tier definitions, roll bonus formula (compressedBonus), training XP formula with all multiplier tables, combat XP formula, simulation outcome weights, proficiency system (D-values, cost curve, discount factors, soft cap, trickle rates), masterXP architecture, CHANGES block XP tags, mandatory training by life stage. | For all XP calculations, calibration, and debugging. |
| `Docs/SW_Legends_RPG_Master_Prompt_v7_1.md` | The master GM prompt (v7.1 FINAL): identity rules, era selection, character creation, alignment system overview, combat system, Force path system, strain system, leveling/progression, galaxy simulation, legacy system, player override system. | For GM behavior rules, combat resolution principles, override keywords. |
| `Docs/SW Legends RPG Master Prompt v7.1 FINAL.docx` | Same content as above, `.docx` format. | Backup/offline reference only. |

### Docs/SWRPG lore/

See `Docs/SWRPG lore/` for all canonical lore. Files are named explicitly by content:
- `SW_Legends_Galaxy_Timeline.md` — galaxy timeline: dates, key figures, downstream sensitivity ratings
- `SW_Force_Abilities_Forms_v3_complete.md` — all learnable abilities: prereqs, anchor stats, forms, D-values, era/faction/person locks
- `SW_Characters_NN_EraName.md` (Eras 01–18 + 09B) — character sheets per era; current campaign: `SW_Characters_09_GreatGalacticWar_ColdWar.md`

---

## 3. THE STAT SYSTEM (v3)

### 3A. Core Stats — `characterSheet.stats`

| Key | Display | Measures |
|---|---|---|
| `strength` | Strength | Physical power, melee force, carrying capacity |
| `agility` | Agility | Speed, reflexes, coordination, acrobatics |
| `endurance` | Endurance | Stamina, pain tolerance, strain resistance |
| `willpower` | Willpower | Mental resolve, resistance to dark side, emotional fortitude |
| `charisma` | Charisma | Social influence, presence, leadership |
| `intelligence` | Intelligence | **[v3]** Reasoning, tactical acumen, learning speed, cunning. Distinct from Willpower (resolve), Charisma (social), and ForceKnowledge (Force lore). |

### 3B. Force Stats — `characterSheet.forceStats`

| Key | Display | Measures |
|---|---|---|
| `forceSense` | Force Sense | Perception through the Force — danger sense, life detection, empathy, precognition |
| `meditation` | Meditation | Inner attunement — battle meditation, Force-trance, calm under pressure, healing trance |
| `forceKnowledge` | Force Knowledge | Breadth and depth of Force technique lore — theory, history, esoteric arts |
| `forceControl` | Force Control | Precision and finesse — how honed and refined the application of Force is |
| `forceOutput` | Force Output | **[v3]** Raw power and magnitude — how much Force energy can be channeled or unleashed at once |

### 3C. The Output vs. Control Distinction (Critical)

> **ForceOutput** = raw power/magnitude. **ForceControl** = precision/finesse. These are trained independently and create genuinely different characters.

- **Output-dominant abilities** (scale primarily with ForceOutput): Force Repulse, Force Lightning, Force Storm, Force Wave, Force Rage, Force Drain
- **Control-dominant abilities** (scale primarily with ForceControl): Force Choke, Force Levitation, Force Stasis, precise telekinesis, Mind Trick, Mechu-deru
- **Most abilities** use a weighted blend of both

### 3D. Tier Bands

| Level Range | Tier # | Name | Notes |
|---|---|---|---|
| 0–20 | 1 | Initiate / Youngling | Fast growth |
| 21–40 | 2 | Padawan | Foundational training |
| 41–60 | 3 | Knight | Reliable competence |
| 61–80 | 4 | Master | Experienced, powerful |
| 81–100 | 5 | Grandmaster | Near-ceiling for most |
| 101–150 | 6 | Legendary | Far beyond normal mastery — per-stat, not blanket |
| 151+ | 7 | Transcendent | **Off the scale.** Only Abeloth occupies this band. |

**Dueling tier** is derived from the character's highest lightsaber form level.
**Force tier** is derived from ForceControl specifically.

### 3E. The Apex Ceiling — Fixed, Never Violated

This hierarchy is permanent. No NPC's stats, no narrative event, and no player growth can place anyone above Abeloth. Key tier anchors: Abeloth ~185 (Transcendent — tier of her own), Peak Luke ~138 (S — highest realized mortal), Vitiate ~134 / Krayt ~132 / Palpatine ~130 (A — apex legendary). **Nothing in 3,661 BBY approaches Tier A.** Full NPC power levels are in `LORE_DATABASE.apexCeiling` (auto-injected each turn via `buildLoreContext()`) and `Docs/SWRPG lore/SW_Characters_09_GreatGalacticWar_ColdWar.md`.

---

## 4. XP & PROGRESSION MATH

### 4A. The Core XP Curve

Every stat — core, Force, Force abilities, lightsaber forms — uses the same exponential curve:

```
xpRequired(n) = floor(100 × 1.07^n)    // XP to go from level n to level n+1
xpToReachLevel(N) = sum of xpRequired(0..N-1)
```

**Key milestones:**
| Level | XP to next level | Cumulative XP to reach |
|---|---|---|
| 0 | 100 | 0 |
| 10 | 197 | 1,381 |
| 20 | 387 | 4,995 |
| 40 | 1,497 | 31,440 |
| 60 | 5,793 | 113,978 |
| 80 | 22,406 | 331,988 |
| 100 | 86,717 | 882,440 |

Level is **always derived** from totalXP — it is never stored. `masterXP` is the sole source of truth.

### 4B. Shatterpoint XP Track (separate)

```
spXPRequired(n) = floor(500 × 1.07^n)    // 5× the standard cost
```

Innate (`ShatterSense` talent): uncapped track, passive perception, strain ×0.3, seeded at Level 5. **No cost discount** — same 5× formula applies.
Standard path (no innate): hard cap at Level 20, limited to Tier 1 and basic Tier 2.

### 4C. Training XP Formula (AI CHANGES block)

```
Training XP = hours × intensity_mult × difficulty_mult × outcome_mult
```

**Intensity multipliers:**
| Keyword | Multiplier |
|---|---|
| casual, slow, deliberate | 10 |
| standard, normal, moderate | 15 |
| intense, focused, hard | 20 |
| pushing, limits, extreme | 25 |
| elite, sparring, danger | 30 |

**Difficulty multipliers (CHANGES block / real-play):**
| Keyword | Multiplier |
|---|---|
| basic, easy, within, familiar | 1.0 |
| ceiling, challenging, above | 1.3 |
| difficult, far, wall | 1.6 |
| impossible | 2.0 |

**Outcome multipliers:**
| Keyword | Multiplier |
|---|---|
| failure, struggle | 0.8 |
| partial, contested | 1.0 |
| solid, success | 1.2 |
| strong, good | 1.5 |
| overwhelming, exceptional | 2.0 |
| breakthrough, insight | 3.0 |

**Quick calibration (1 hour of training, approximate XP):**
| Context | XP |
|---|---|
| Casual solo practice | 10 |
| Standard supervised session | 15–18 |
| Intense supervised, familiar material | 26–30 |
| Breakthrough moment (genuine insight) | 40–60 |
| Combat vs peer (wins) | ~360 |
| Combat vs Master (survives) | ~2,400 |

### 4D. Simulation XP Formula (JS-driven, different multipliers)

The simulation panel uses slightly different difficulty values and tier-based outcome weights (not declared by AI):

```
sim XP = hours × intensity_mult × difficulty_mult × outcome_weight(tier) × strain_penalty × activity_weight × days
```

**Sim difficulty multipliers:**
| Keyword | Multiplier |
|---|---|
| easy | 0.7 |
| standard | 1.0 |
| ceiling | 1.2 |
| wall | 1.5 |

**Sim outcome weights by stat tier (automatic, not declared):**
| Tier | Weight |
|---|---|
| Initiate | 1.105 |
| Padawan | 1.194 |
| Knight | 1.195 |
| Master | 1.230 |
| Grandmaster | 1.228 |
| Legendary | 1.263 |

> ⚠️ **AMBIGUITY FLAG:** The difficulty multipliers for real-play CHANGES block training (basic=1.0, ceiling=1.3) differ from simulation panel multipliers (easy=0.7, standard=1.0, ceiling=1.2). These are intentionally separate systems. Do not conflate them.

### 4E. Combat XP Formula

```
primary XP = baseTierXP[opponentTier] × durationFactor × engagementFactor × outcomeFactor
secondary XP = primary × 0.4
```

**Base XP by opponent tier:**
| Opponent Tier | Base XP |
|---|---|
| Initiate | 50 |
| Padawan | 120 |
| Knight | 300 |
| Master | 750 |
| Grandmaster | 1,800 |
| Legendary | 4,500 |
| Transcendent | 11,000 |

### 4F. Sub-Ability Proficiency System (v3) — **LIVE IN V111**

Each Force ability family has a **base level** in `masterXP.forceAbilities`. Sub-applications (Force Push, Force Storm, etc.) have a separate **proficiency percentage** (0–100%) tracking deliberate practice of that specific application.

Storage key: `masterXP.forceAbilityProficiency["ForceLightning.ForceStorm"]`

**Cost curve:**
```javascript
profCostPerPoint(pct, D) = floor(D × 20 × 1.07^(pct × 0.8))
```
Where `pct` = current percentage (0–99), `D` = difficulty tier.

**Difficulty tiers (D values):**
| Tier | D | Total XP (0→100%) | Equivalent base-ability milestone |
|---|---|---|---|
| Basic | 1.0 | ~81,700 XP | Base level 60 |
| Moderate | 1.5 | ~122,550 XP | Base level 67 |
| Complex | 2.5 | ~204,250 XP | Base level 73 |
| Advanced | 4.0 | ~326,800 XP | Base level 80 |

**Proficiency tiers:**
| Range | Tier | Meaning |
|---|---|---|
| 0–25% | Novice | Functional but rough; high Strain, imprecise |
| 26–50% | Developing | Reliably functional; Strain normalizing |
| 51–70% | Proficient | Solid combat utility; controlled execution |
| 71–90% | Expert | Refined application; Strain significantly reduced |
| 91–100% | Mastered | Signature technique; near-minimum Strain |

**Two discount factors:**
1. **Base Ability Factor** (stronger foundation = cheaper sub-ability learning):
   - Base 0–19: ×1.00 | Base 20–39: ×0.90 | Base 40–59: ×0.75 | Base 60–79: ×0.60 | Base 80–100: ×0.50
2. **ForceControl Factor** (refined control = faster learning):
   - FC 0–19: ×1.25 | FC 20–39: ×1.10 | FC 40–59: ×1.00 | FC 60–79: ×0.85 | FC 80–100: ×0.70

`effectiveXP = rawXP / (BaseAbilityFactor × ControlFactor)`

**Soft cap** (proficiency can be trained above this but effectiveness is capped until base ability catches up):
| Base Ability | Max Effective Proficiency |
|---|---|
| 0–20 | 25% |
| 21–40 | 50% |
| 41–60 | 70% |
| 61–80 | 85% |
| 81–100 | 100% |

**Trickle rates (automatic):**
- Training base ability → +5% of base XP earned trickles to all already-unlocked sub-ability proficiencies
- Training a sub-ability → 20% of proficiency XP trickles back to the base ability as regular XP

### 4G. compressedBonus Formula

Used for combat rolls and some XP modifier calculations:
```javascript
compressedBonus(stat):
  if stat ≤ 40:  bonus = stat / 20               → +0.0 to +2.0
  if stat ≤ 80:  bonus = 2.0 + (stat - 40) / 40  → +2.0 to +3.0
  if stat ≤ 100: bonus = 3.0 + (stat - 80) / 80  → +3.0 to +3.25
  if stat > 100: bonus = 3.25 + (stat - 100) / 200
```

---

## 5. THE CHANGES BLOCK FORMAT

Every AI response **must** end with three blocks, in this order:

```
<<<CHANGES>>>
[tags listed below]
<<<END_CHANGES>>>

<<<SHEET>>>
{ ...full characterSheet JSON... }
<<<END_SHEET>>>

<<<WORLD>>>
{ ...full worldState JSON... }
<<<END_WORLD>>>
```

### 5A. All Valid CHANGES Tags

**Combat/HP/Strain:**
```
HP=[current]
FORCE_STRAIN=[current]
PHYSICAL_STRAIN=[current]
MENTAL_STRAIN=[current]
FORCE_BARRIER=[current]
```

**Alignment system:**
```
ALIGNMENT=[value]                    // Light side gains and momentum-window hits ONLY
                                     // NEVER use for dark side acts — use DARK_PRESSURE instead
DARK_PRESSURE=[0-100]                // Dark side accumulation (new total, not delta)
                                     // JS auto-discharges at 100 and sends notification
MOMENTUM_WINDOW=[multiplier],[days]  // Opens after pressure discharge (e.g. MOMENTUM_WINDOW=1.5,3)
WILL_OF_FORCE=[gain],[description]   // Surrendering to the will of the Force (light-side XP)
                                     // e.g. WILL_OF_FORCE=5,Released attachment to mission outcome
SURRENDER_DISCOUNT=[0-0.5]           // Reduces next pressure discharge by this fraction
```

**World/location:**
Location is set via the `worldState.location` field in the `<<<WORLD>>>` JSON block — not via a CHANGES tag. Always keep `location` current in the WORLD JSON.

**Life stage (story event only — never from raw JSON):**
```
LIFE_STAGE=[value]   // Values: youngling|padawan|knight|knight_with_padawan|master|master_with_padawan|council_member
```
> The parser pre-scans the CHANGES block for this tag before the SHEET snapshot runs, so the new value survives the snapshot/restore cycle. Do not rely on SHEET JSON — it is always overwritten.

**Shatterpoint system:**
```
SHATTERPOINT_PERCEIVED=[tier],[description]   // Passive perception surfaces
SHATTERPOINT_ROLL=[target]                    // Triggers JS interpretation roll
SHATTERPOINT_FOCUS=[0-100]                    // Awareness bandwidth
SHATTERPOINT_FOCUS_CLEAR                      // Resets focus at scene end (no value)
SHATTERPOINT_XP=[amount]                      // Proficiency XP (JS applies ×0.1 for ShatterSense innate)
SHATTERPOINT_MISREAD_RESOLVED                 // After misread consequence fully played out (no value)
```

**XP awards — ALWAYS use these structured formats, never prose XP:**
```
TRAINING: category.StatName, hours, intensity, difficulty, outcome
  // intensity: casual|standard|intense|pushing|elite
  // difficulty: basic|standard|ceiling|wall|above
  // outcome: fail|contested|solid|strong|overwhelming
  // Example: TRAINING: lightsaberForms.ShiiCho, 2.0, intense, ceiling, solid
  // Example: TRAINING: forceStats.forceControl, 1.0, standard, standard, solid
  // Example: TRAINING: forceAbilities.Telekinesis, 1.5, intense, ceiling, strong

COMBAT: category.StatName, rounds, tierGap, engagement, outcome
  // tierGap: 0=same tier, positive=attacker higher, negative=defender higher (attacker's perspective)
  // engagement: light|standard|aggressive|desperate
  // outcome: decisive_loss|narrow_loss|draw|narrow_win|decisive_win
  // Example: COMBAT: lightsaberForms.ShiiCho, 8, -1, aggressive, narrow_win
```

**Proficiency XP (sub-ability specific):**
```
PROFICIENCY: AbilityKey.SubKey,xpAmount
  // Example: PROFICIENCY: ForceLightning.ForceStorm,15
  // Use when character specifically practices a sub-application
  // xpAmount uses same scale: standard supervised session (1hr) ≈ 15 XP
```

**Direct XP injection (for non-training contexts — story breakthroughs, ceremonies):**
```
XP: category.StatKey,amount   // e.g. XP: forceAbilities.Telekinesis,150
```
Prefer `TRAINING:` for anything that involved practice time — reserve `XP:` for instantaneous story events.

**Rolls:**
```
ROLL: stat1.key|stat2.key     // Fires a d20 roll using listed stats
```

### 5B. Rules the AI Must Follow When Writing CHANGES Blocks

1. **Every response requires all three blocks** (CHANGES, SHEET, WORLD) even if no stats changed.
2. **Use TRAINING: and COMBAT: format for all XP** — never award XP in prose.
3. **Never use ALIGNMENT= for dark side acts.** Use DARK_PRESSURE= with a new 0–100 total.
4. **Never set age directly.** Age is computed automatically from `characterSheet.birthday` vs `worldState.inGameDate`.
5. **Never set LIFE_STAGE: from raw JSON.** Only via the `LIFE_STAGE:` CHANGES tag.
6. **Always include current location** in WORLD JSON — do not leave it empty.
7. **Shatterpoints are rare.** Most scenes have none. Do not manufacture them for drama. Ask: is this moment genuinely at a fracture point where one action changes the larger trajectory?
8. **Shatterpoint perception for `ShatterSense` holders is passive.** No roll needed to notice — only to interpret. `SHATTERPOINT_ROLL:` triggers interpretation quality, not detection.
9. **TRAINING/COMBAT outcome keywords must exactly match** the listed options. No free-text outcomes.
10. **Multiple XP awards in one block are fine** — list one TRAINING: or COMBAT: line per skill trained.
11. **Innate talents in SHEET JSON are protected.** JS restores them from snapshot after every parse. The AI writing different values there has no effect on gameplay, but should match actual state.

---

## 6. LORE REFERENCE

All canonical lore is in `Docs/SWRPG lore/` — see Section 2 for the file list. Current era NPC stats, faction states, apex ceiling, and timeline events are also auto-injected into the AI context each turn by `buildLoreContext()` — see Section 9G.

### FORCE_ABILITY_CATALOG (live in V111)

The in-code `FORCE_ABILITY_CATALOG` is a JS const at ~line 5605. It is the **runtime authority** for every ability's mechanical data. The lore doc (`SW_Force_Abilities_Forms_v3_complete.md`) remains the narrative/design source of truth; the catalog is its engine-side implementation.

**Structure of each entry:**
```javascript
AbilityKey: {
  fam:      'TK|Sensory|Body|Mental|Defense|Healing|Light|Dark|SpaceTime|Nature|Arcane|SithAlchemy|Misc',
  label:    'Display name',
  par:      null | 'ParentAbilityKey',   // null = root ability; string = sub-application
  D:        null | 1.0 | 1.5 | 2.5 | 4.0, // proficiency difficulty tier (null = no proficiency track)
  align:    'neutral' | 'light' | 'dark',
  anchors:  ['forceControl', 'forceOutput', ...],  // primary stat anchors
  prereqs:  { statKey: minLevel, AbilityKey: minLevel, darkSide: N, lightSide: N, anySaberForm: N },
  flags:    ['storyFlagRequired', ...]  // empty array = no story flag gate
}
```

**Key hierarchy facts confirmed in catalog:**
- `Tutaminis` → `par:null` (root); `ForceAbsorb` → `par:'Tutaminis'` ✓
- `ForceFear` → `par:'MindTrick'`; `ForceHorror` → `par:'ForceFear'`; `ForceInsanity` → `par:'ForceHorror'` ✓
- `SummonFear` → `flags:['sithTextAccess']` only — no era lock ✓
- `ForceLightning` → `prereqs:{forceControl:41, darkSide:20}` — hard dark-side gate ✓
- `SithAlchemy`, `MidiChlorianManipulation`, `TransferEssence`, `ThoughtBomb`, `SummonFear` → all require `sithTextAccess` flag ✓
- `FlowWalking`, `AingTiiFightingSight` → require `aingTiiContact` + `aingTiiApproved` ✓
- `Phase`, `FoldSpace` → require `fallanassiContact` ✓

---

## 7. HARD RULES — NEVER VIOLATE

### 7A. The Apex Ceiling Is Fixed

The apex tier hierarchy (Section 3E) is permanent. **No being in 3,661 BBY approaches Tier A** (Vitiate is the most powerful being alive in this era at ~134 — far below peak Luke, far below Abeloth).

### 7B. Abeloth Is in a Class of Her Own

**Abeloth ≈ 185 (Transcendent, 151+ band).** She is not a "very powerful being" — she is cosmically beyond mortal measurement. In the game system she occupies the Transcendent tier (151+) alone. No mortal Force user reaches this tier regardless of training. The only reason to reference Abeloth at all in a 3,661 BBY campaign is historical lore context.

### 7C. The Yuuzhan Vong Force Status

**Notation:** `✗` = Force-invisible (Yuuzhan Vong). `—` = non-Force-sensitive (ordinary beings). **These are fundamentally different:**

- `—` (Han Solo, stormtroopers): still *exists* in the Force. Jedi can sense, mind-trick, and telekinetically grab them.
- `✗` (Yuuzhan Vong): **void in the Force.** Jedi cannot sense them, read their emotions, mind-trick them, or reliably touch them with telekinesis. Danger sense does not trigger against them. Precognition fails. To a Jedi's Force-senses they are a *hole in the universe.*

**Only exception:** Onimi — the single Force-sensitive Yuuzhan Vong in all of Legends.

### 7D. Innate Talent Rules

**Innate Talents** (`characterSheet.innateTalents[]`) are player-protected:
- **Player override** via the Talents panel in the UI — can add/remove at any time
- **AI during character backstory/creation** — the AI MAY set innate talents during the initial character creation sequence, based on what makes narrative sense for the backstory (e.g., a character described as always having unusually strong telekinesis would logically have `NaturalTelekineticBurst`)
- **AI during normal gameplay** — the AI **cannot** grant or remove innate talents through SHEET JSON or any other mechanism. The field is snapshotted by JS and restored after every SHEET parse.
- Innate talents affect XP costs, strain rates, and unlock behavior — they are mechanical, not just narrative labels.

**Innate Abilities** (`characterSheet.innateAbilities[]`) — same protection rules. These have no XP track whatsoever; they either exist or they don't.

### 7E. Shatterpoint Cannot Be in masterXP.forceAbilities

`masterXP.shatterpoint.main` is the **only valid location** for Shatterpoint XP. If `masterXP.forceAbilities['Shatterpoint']` ever appears, it must be deleted immediately — it will cause the XP engine to inflate the level to garbage values.

### 7F. masterXP Is the Source of Truth

The AI writes a `<<<SHEET>>>` block every turn. JS **overwrites** the displayed stats from `masterXP` after parsing — the AI's reported stat values for XP-tracked stats are ignored except for display reference. **Level is always derived, never stored.** Adding XP via `TRAINING:`, `COMBAT:`, `PROFICIENCY:`, or `XP:` tags is the only legitimate way to change XP-tracked stats.

### 7G. Player-Protected Fields (JS snapshots before SHEET parse, restores after)

The AI writing these fields in SHEET JSON has **no effect** — JS restores them from the pre-parse snapshot. The AI should write them correctly for display consistency but cannot change their values:

| Field | Protection |
|---|---|
| `innateTalents[]` | Player/creation only |
| `innateAbilities[]` | Player/creation only |
| `birthday` | Set via calendar UI only |
| `lifeStage` | Set via `LIFE_STAGE:` CHANGES tag only |
| `storyFlags{}` | Set via AI narrative events or player override panel |
| `aptitudes[]` | Merged (AI + talent labels), deduplicated by JS |

### 7H. Lightsaber Form Key Normalization

After every SHEET parse, JS normalizes form keys to camelCase no-hyphen:
- `Shii-Cho` → `ShiiCho`
- `Djem So` → `DjemSo`
- `Shien/Djem So` → `ShienDjemSo`

JS uses `masterXP` derived level as authoritative for the stat value — not whatever the AI reports. Duplicate/hyphenated keys are merged correctly.

### 7I. Single-File Architecture

**No exceptions.** One `.html` file contains everything. No npm, no bundler, no external JS files, no build step. The file is currently ~8,000 lines (V111). This is intentional. Be concise when adding features; avoid duplicating logic.

---

## 8. STORY FLAGS

Stored in `worldState.storyFlags{}`. Gate era/faction-locked abilities. AI sets via narrative events; player can override in Flags panel.

| Key | Set When | Gates |
|---|---|---|
| `maceLiving` | Mace Windu is alive in current era | Vaapad teachable at all |
| `maceTrustEstablished` | Mace Windu personally agreed to teach character | Vaapad learning begins |
| `aingTiiContact` | Peaceful contact with Aing-Tii monks | Flow-walking, Fighting-Sight discoverable |
| `aingTiiApproved` | Aing-Tii agreed to teach | Flow-walking, Fighting-Sight learnable |
| `fallanassiContact` | Contact with Fallanassi | Phase, Fold Space discoverable |
| `jediArchiveAccess` | Access to Jedi Temple Archives | Advanced theory abilities via research |
| `sithTextAccess` | Access to Sith holocron or scroll | Sith-origin abilities (Summon Fear, etc.) discoverable |
| `jediCouncilPermission` | Council granted permission | Juyo/Vaapad learnable |
| `masterAssigned` | Formally assigned a Jedi Master | Padawan mandatory training rows active |
| `padawanAssigned` | Assigned a Padawan | Knight instruction mandatory row active |

**In the current era (3,661 BBY):** `maceLiving` = false (Mace Windu will not be born for ~3,590 years). Vaapad is permanently unavailable unless playing in a future era.

---

## 9. GAME ENGINE RULES

### 9A. The Three Panels / Systems

**1. Real-play turns (main game loop):** Player types action → AI narrates → AI writes CHANGES/SHEET/WORLD blocks → JS parses and applies XP/strain/alignment changes → UI updates. Each turn uses Gemini API with the last 6 turns + campaign summary in context.

**2. Simulation panel (JS-driven):** Player schedules a day of activities → JS calculates XP, strain, time advancement deterministically. AI is only invoked for (a) interpreting free-text "Personal Input" rows into `{skill, hours, intensity, outcome}` JSON, and (b) optionally generating a narrative summary. The AI does **not** do XP math in simulation mode.

**3. Calendar panel:** Tracks `worldState.inGameDate` using the Galactic Standard Calendar (12 months, 368 days/year, 7-day weeks). Age is computed automatically every turn from `characterSheet.birthday` vs `worldState.inGameDate` — the AI never sets age.

### 9B. Simulation Panel Rules

**JS handles (no AI tokens):** All XP calculations, strain accumulation/recovery, multi-stat weight distribution, daily hours budget, calendar advancement, sleep recovery math, XP penalty modifiers from overtraining.

**Mandatory training rows** by life stage (cannot be deleted, hours adjustable):
| Life Stage | Mandatory Row | Default Hours | Primary Skill |
|---|---|---|---|
| Youngling | Morning Forms Drills | 1.5 hrs | ShiiCho |
| Youngling | Group Meditation | 1.0 hrs | Meditation (recovery) |
| Youngling | Force Fundamentals Class | 1.0 hrs | ForceKnowledge |
| Padawan | Training with Master | 2.0 hrs | Master's specialty |
| Knight/Master with padawan | Padawan Instruction | 1.5 hrs | ForceKnowledge |
| All | Sleep | 7.0 hrs | Recovery only |

**Tier-gap training (attempting above your level):**
| Gap | Difficulty | XP Mult | Strain Mult |
|---|---|---|---|
| Same tier (0) | Standard | 1.0× | 1.0× |
| 1 tier above | Ceiling | 1.2× | 1.3× |
| 2 tiers above | Wall | 1.5× | 1.7× |
| 3+ tiers above | Impossible | 0.3× | 2.5× |
| 1 tier below | Easy | 0.7× | 0.8× |

### 9C. Strain System

**Accumulation per hour by intensity (standard activity strain base rates):**
| Intensity | Force/hr | Physical/hr | Mental/hr |
|---|---|---|---|
| Casual | 1.0 | 1.5 | 0.5 |
| Standard | 2.4 | 3.2 | 1.6 |
| Intense | 4.2 | 5.6 | 2.8 |
| Pushing Limits | 6.0 | 8.0 | 4.0 |
| Elite | 8.0 | 10.0 | 6.0 |

**Activity strain bias multipliers:**
- Saber forms: Physical ×1.5, Force ×0.8, Mental ×0.6
- Force abilities: Force ×1.8, Mental ×1.0, Physical ×0.3
- Meditation: Force ×1.5, Mental ×1.5, Physical ×0.1
- Physical conditioning: Physical ×2.0, Force ×0.2, Mental ×0.5
- Academic/Force Knowledge: Mental ×2.0, Force ×0.5, Physical ×0.1
- Sparring (live): Physical ×1.8, Force ×1.0, Mental ×0.8

**Endurance mitigation:** `em = compressedBonus(endurance) / 10`
- Physical strain reduced by `em × 100%`
- Force strain reduced by `em × 50%`
- Mental strain reduced by `em × 30%`
- **Already implemented in game code.** AI does NOT pre-apply it.

**Strain thresholds and XP penalties (worst of Force/Physical/Mental):**
| Strain Level | XP Penalty | Narrative Flag |
|---|---|---|
| 0–20 | ×1.0 | None |
| 21–50 | ×0.9 | "Fatigued" |
| 51–70 | ×0.7 | "Strained" |
| 71–90 | ×0.4 | "Overtrained — narrative consequence fires" |
| 91–100 | ×0.1 | "Exhausted — AI generates consequence" |

**Sleep recovery:**
| Sleep Hours | Strain Recovered |
|---|---|
| 8+ | 100% |
| 7 | 85% |
| 6 | 65% |
| 5 | 45% |
| 4 | 25% |
| <4 | 10% |

### 9D. Alignment System

Scale: −100 (Consumed) to +100 (Luminous). Seven tiers:
| Range | Tier | Label |
|---|---|---|
| 76–100 | Deep Light | Luminous |
| 26–75 | Light | Attuned |
| 1–25 | Leaning Light | Calm |
| −25–0 | Neutral | Balanced |
| −26–−50 | Leaning Dark | Shadowed |
| −51–−75 | Dark | Corrupted |
| −76–−100 | Deep Dark | Consumed |

**Dark side mechanics:** AI sends `DARK_PRESSURE=` with a new 0–100 total. When pressure hits 100, JS automatically discharges: alignment drops by tier-dependent amount, pressure resets to 40, red `◈ PRESSURE DISCHARGED` notification appears. AI never directly sets alignment for dark acts.

**Momentum window:** After discharge, AI sends `MOMENTUM_WINDOW=[multiplier],[days]`. During window, dark acts hit `ALIGNMENT=` directly (not pressure).

**Light side:** AI sends `ALIGNMENT=[new value]` directly for positive moral choices. `WILL_OF_FORCE=[gain],[description]` for surrendering to the Force.

### 9E. Shatterpoint System

**Three tiers (unlocked by level):**
- **Tier 1 (Tactical, always active):** Structural weaknesses, combat stance flaws, injuries, objects near breaking point
- **Tier 2 (Personal, Level 6+):** Psychological fractures, defining decisions, relationships at breaking point
- **Tier 3 (Situational, Level 11+):** Battle/event fulcrums, strategic pivots — extremely rare

**Perception vs. interpretation:** For `ShatterSense` holders, shatterpoints surface passively (no roll to notice). `SHATTERPOINT_ROLL:[target]` triggers an *interpretation* roll to determine quality of understanding.

**Roll formula:** `level × 0.15 + compressedBonus(meditation) × 0.4 + compressedBonus(willpower) × 0.2 + 1.0 (innate bonus)`

**Tunnel vision:** Focus above 70 → `tunnelVision: true` → AI treats character as having reduced ambient awareness.

**Vaapad amplification:** When Vaapad is simultaneously active, multiply focus bandwidth cost by ×1.3.

### 9F. What the AI Cannot Do Autonomously

- Set age (computed by JS from birthday)
- Modify `masterXP` directly (only via CHANGES block tags)
- Change `innateTalents[]` or `innateAbilities[]` (player-protected)
- Change `lifeStage` except via `LIFE_STAGE:` tag
- Grant abilities whose prerequisites are unmet or whose story flags are not set
- Grant abilities that are era-locked (Vaapad in 3,661 BBY), faction-locked (Aing-Tii without contact), or person-locked (requires a specific teacher who doesn't exist in the era)
- Create shatterpoints for dramatic effect — they must be genuine fracture points

**Additionally, the following are engine responsibilities — AI must not simulate or pre-apply these:**
- **Endurance mitigation on strain** — already computed in the FORCE_STRAIN/PHYSICAL_STRAIN/MENTAL_STRAIN handlers
- **Proficiency discount factors** — `applyProficiencyXP()` applies base-ability and ForceControl discounts automatically
- **Trickle XP** — `profTrickleFromBase()` fires automatically when base abilities are trained; AI does not add trickle manually

### 9G. LORE DATABASE AND DYNAMIC INJECTION SYSTEM

#### LORE_DATABASE structure (in-code const, ~line 5781)

```javascript
LORE_DATABASE = {
  currentEra: {
    label, dateBBY,
    factionStates: { jediOrder, sithEmpire, republic, mandalorians },
    temple: { supplyLevel, trainingQuality, focus },
    situationNow: 'Current situation string'
  },
  apexCeiling: {
    TRANSCENDENT: [{ name, approxLevel, note }],  // Abeloth ~185
    S:            [{ name, approxLevel, era }],    // Peak Luke ~138
    A:            [{ name, approxLevel, era }],    // Vitiate ~134, Krayt ~132, Palpatine ~130
    notable:      [{ name, approxLevel, stat? }],  // Anakin ~120, Bane ~114, Nihilus ~112, etc.
    rule: 'No being in 3,661 BBY approaches Tier A...'
  },
  characters: {
    KeyName: {
      name, faction, tier, lifespan,
      stats: { str, agi, end, wil, cha, int },
      force: { fS, med, fK, fC, fOut },      // null for non-Force beings; force:null + vongForceInvisible:true for Yuuzhan Vong
      forms: { ShiiCho, Makashi, ... },
      abilities: { Telekinesis, ForceLightning, ... },
      statusIn3661: 'Status string or null',  // null or absent = not active in 3,661 BBY
      note: 'Sheet notes'
    }, ...
  },
  timeline: {
    events: [
      { date: BBY_number, label, desc, keyFigures:[], location, downstream:'LOW|MODERATE|HIGH|CRITICAL' },
      ...
    ]
  }
}
```

**Total characters:** 157 across Eras 01–18 + Era09B (Eternal Empire).

**Yuuzhan Vong Force status** — stored as `force:null` with `note` containing `vongForceInvisible:true`. Only Onimi has full Force stats (the single Force-sensitive Vong in Legends).

#### getEraLore(dateBBY) — what it returns

```javascript
{
  era:           'label from currentEra',
  factionStates: { ... } or null,          // null if outside war period (3681–3636 BBY)
  temple:        { ... } or null,
  situationNow:  'string' or null,
  recentPast:    [ up to 8 events with date >= dateBBY, sorted descending ],
  upcomingEvents:[ up to 5 events within 30 years future, sorted descending ],
  apexRule:      'immutable rule string',
  activeNPCs:    { KeyName: { name, faction, tier, status } }
  // activeNPCs = characters where statusIn3661 is set and does not start with 'NOT ACCESSIBLE'
}
```

**Note on BBY sorting:** Higher BBY number = further in the past. `recentPast` uses `e.date >= dateBBY` (higher numbers = older events). `upcomingEvents` uses `e.date < dateBBY && e.date >= dateBBY - 30` (lower numbers = future events). Both sort descending by date number.

#### buildLoreContext() — what gets injected each turn

Called inside `buildContext()` every turn. Adds ~4,000–5,000 characters (~1,100 tokens) to the AI context. Returns `''` on any error (try-catch) — never breaks the game loop.

Sections in order:
1. **LORE CONTEXT header** — current BBY
2. **SITUATION** — `currentEra.situationNow`
3. **FACTIONS** — power/morale for JediOrder, SithEmpire, Republic, Mandalorians
4. **TEMPLE** — supply level, training quality, current focus
5. **KNOWN RECENT EVENTS** — up to 5 past events with 90-char truncated descriptions
6. **FUTURE EVENTS (GM-only)** — up to 4 upcoming events; labeled "do NOT reveal to player"
7. **ACTIVE ERA NPCs** — each: `Name [Tier] FC:N FOut:N — status (115-char truncated)`
8. **POWER CEILING** — TRANSCENDENT/S/A tiers with names and levels + the immutable rule
9. **PLAYER FORCE ABILITY RULES** — for each ability the player has: anchor stats, prereqs, sub-applications, proficiency soft-cap; plus Shatterpoint info if applicable

#### FORCE_ABILITY_RULES compact table (line ~7335)

A second, smaller lookup (`FORCE_ABILITY_RULES`) covers padawan-range abilities with human-readable summaries injected into the AI context. Unlike `FORCE_ABILITY_CATALOG` (exhaustive machine-readable data), this table is tuned for concise AI consumption. Add entries as the player unlocks new ability families.

### 9H. iOS Safari / iPad Dev Notes

- Fixed-position overlays: use `position:fixed` not `position:absolute` inside overflow containers
- Scrollable modals: `overflow-y:scroll` with `-webkit-overflow-scrolling:touch` set; `overflow-y:auto` on fixed elements does not work
- `position:sticky` does not work inside `overflow:scroll` containers on iOS
- Use `display:flex; flex-direction:column` with a fixed header div and a scrollable body div for any modal with a persistent header
- Always run a mental or actual syntax check after JS edits — large template literals and unclosed brackets cause silent failures in Safari

### 9I. Common Bug Watch List

1. **Shatterpoint contamination:** If shatterpoint level spikes, check that `masterXP.forceAbilities['Shatterpoint']` doesn't exist. Delete it if found.
2. **Duplicate form keys:** AI sometimes uses `Shii-Cho` vs `ShiiCho`. Normalization runs after every SHEET parse — masterXP derived level is authoritative.
3. **Player fields wiped:** If innate talents or birthday disappear after a turn, check the SHEET parse snapshot/restore block.
4. **Calendar popup not scrolling on iOS:** Must use `overflow-y:scroll` with a flex-column structure.
5. **simApiCall using wrong key:** Uses `apiKey` variable (loaded from `localStorage.getItem('sw_rpg_gemini_key')`). Never use `sw_rpg_api_key`.
6. **Location reset:** AI should always include current location in WORLD JSON — empty string will cause location to appear reset.
7. **Compound-value CHANGES tags silently dropped (V111 fix):** Tags like `MOMENTUM_WINDOW=1.5,3` or `WILL_OF_FORCE=5,desc` were previously skipped by the `if (isNaN(val)) continue` guard before the switch block. Fixed in V111 — all compound-value tags now have `startsWith()` handlers that run before the guard. If a new tag appears to do nothing and its value contains a comma or text, it needs a `startsWith()` handler, not a switch case.

---

## 10. SESSION WORKFLOW

### Starting a Session

1. **Read this CLAUDE.md in full** — do not skip sections
2. **Check the Current Character State section below** — note life stage, current stats, active story flags
3. **Confirm the in-game date** from the worldState in the save file (format: Galactic Standard Calendar)
4. **For lore lookups** mid-session: check `Docs/SWRPG lore/` (see Section 2) before inventing NPC stats or ability details; current era lore is also auto-injected via `buildLoreContext()`
5. **For ability questions** (can Jared learn X?): always check `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md` for prerequisites and flags before the AI grants anything

### During a Session

- All XP must be awarded via CHANGES block tags — never in prose
- All three blocks (CHANGES, SHEET, WORLD) must appear in every response
- The AI's real job is narration and XP calibration — the JS handles all math
- If the player uses an **[OVERRIDE]**, **[LORE CHECK]**, **[SYSTEM EXPAND]**, **[WORLD ADJUST]**, **[CORRECTION]**, or **[AUTHOR NOTE]** keyword: immediately exit narrative voice and respond plainly in plain language (see Master Prompt Part XIX)

### Ending a Session

Update the **Current Character State** and **Session Log** sections of this file with:
1. New stat levels (any that changed by 3+ points)
2. New abilities unlocked
3. Story events that changed flags
4. What the character is doing next / where the story left off
5. Any ambiguities that came up that need resolution

### Handling Mid-Session Lore Conflicts

If you find a conflict between what the AI produced and the lore files:
1. Flag it immediately with `[LORE CHECK]` — do not ignore it
2. Check the relevant character sheet or timeline file
3. Canon accuracy is a shared responsibility — if genuinely ambiguous, note the preferred interpretation for the campaign going forward

---

## 11. CURRENT CHARACTER STATE

*(Update this section at the end of every session)*

**Character:** Jared Wright
**Species:** Human
**Faction:** Jedi Order
**Life Stage:** Padawan
**In-Game Date:** Year 20 of the Great Galactic War (~3,661 BBY)
**Location:** Jedi Temple, Coruscant

**Innate Talents (player-set, protected):**
- `NaturalTelekineticBurst` — All Telekinesis family Force Strain ×0.8
- `ShatterSense` — Shatterpoint: ×0.1 XP cost, seeded at L5, passive perception, uncapped track

**Approximate Stats (last known):**
| Stat | ~Value |
|---|---|
| ForceSense | ~34 |
| Meditation | ~35 |
| ForceControl | ~38 |
| ForceKnowledge | unknown |
| ForceOutput | unknown (new v3 stat) |
| ShiiCho | ~32 |
| Telekinesis | ~28 |
| Shatterpoint | Level 5, Tier 1 (Tactical) |

**Active Story Flags:**
- `maceLiving` = false (era: 3,661 BBY — Mace not yet born)
- (All other flags: check worldState in save file)

**Notes for next session:**
- Jared is a padawan in Year 20 of the Great Galactic War. The Hydian Way blockade was just broken. The Jedi Temple is recovering from supply disruption. The Sith Empire holds most of the Outer Rim.
- ForceOutput and Intelligence are now auto-seeded to 0 on save load if missing — no manual initialization needed.

---

## 12. KNOWN AMBIGUITIES

*(Document unresolved contradictions here so they can be explicitly resolved)*

1. **Difficulty multiplier discrepancy:** The XP Reference doc lists CHANGES block training difficulty multipliers as `basic=1.0, ceiling=1.3, wall≈1.6, impossible=2.0`. The Sim Rules doc lists simulation panel multipliers as `easy=0.7, standard=1.0, ceiling=1.2, wall=1.5, impossible=0.3`. These are different tables for different systems, which is correct, but the CHANGES block TRAINING tag format uses the keywords `basic|standard|ceiling|wall|above` — it's unclear whether `wall` in the CHANGES block uses 1.3 or 1.6 as its multiplier. **Resolution needed.**

2. **TRAINING difficulty keyword `above`:** The CHANGES block docs list `above` as a valid difficulty keyword but the multiplier tables don't have an entry for it. Likely synonymous with `ceiling` (1.3). **Unresolved — treat `above` as `ceiling` until clarified.**

---

## 13. SESSION LOG

*(Append a line per session: date, summary of what happened, what changed)*

| Session Date | Summary | Key Changes |
|---|---|---|
| 2026-06-05 | **Pure engine session — no gameplay.** Added 157-character LORE_DATABASE (Eras 01–18 + Era09B), FORCE_ABILITY_CATALOG, FORCE_ABILITY_RULES, getEraLore(), buildLoreContext() (per-turn lore injection). Fixed 5 CHANGES parser bugs. Auto-seeded ForceOutput and Intelligence. | V110 → V111. See `Docs/updates.md` for details. |
| 2026-06-08 | **Quota + save failure fixes.** History now stores displayText (blocks stripped) instead of rawText — ~70% fewer API tokens per turn and proportional save size reduction. Also: summarize catch trims fullHistory to prevent unbounded growth; autoSave catches localStorage errors with visible warning; feedHtml capped to last 50 messages. | V111 → V112. See `Docs/updates.md` for full root cause analysis. |
| 2026-06-08 | **Turn-2 stuck-loading fix.** `buildContext()` and `JSON.stringify(body)` moved inside the try block so any throw resets `isThinking`. Bare `return` inside `if (worldState)` (GSC_MONTHS guard) converted to block-skip. Empty model history messages now use `'[Turn completed.]'` fallback. `Array.isArray` guards added to all `.join()` calls in `buildContext` to prevent TypeError on non-array AI fields. | V112 → V113. See `Docs/updates.md`. |
| 2026-06-08 | **Roll trigger system.** Added `WHEN TO ROLL — MANDATORY TRIGGERS` section to GM prompt. Three outcome tables (SUCCESS/CEILING/WALL) with specific thresholds derived from compressedBonus math. Nat 20 always = breakthrough (×3.0). Reading/studying roll formula. AI must now roll for every training session, NPC social interactions, uncertain Force use, and physical challenges. | V113 → V114. |
| 2026-06-08 | **Save detection on title screen.** `<div id="save-found-msg">` added to API screen showing turn count + timestamp if autosave exists. `tryAutoLoad` silent catch replaced with visible error message. | V114 → V115. |
| 2026-06-08 | **NPC tracking + milestone system + JS roll engine + canon profiles merged from V120 branch.** JS-driven ROLL:/ROLL_LABEL= tags replace AI-calculated rolls. `KNOWN_PERSON`/`INTERACTION`/`GENERATE_PROFILE`/`PROFILE_STATS`/`PENDING_EVENT`/`NPC_AGENDA`/`RESOLVE_EVENT`/`SCENE_NPCS`/`GALAXY_EVENT` parser cases added. `buildEventInjection()` injects story threads + NPC agendas per turn. `checkMilestones()` auto-creates pendingEvents from JEDI/SITH_MILESTONES. Canon NPC stat blocks seeded at game start (Zym, Satele, Malgus, Ngani Zho, Gnost-Dural). | V115 → V116. See `Docs/updates.md`. |
| 2026-06-09 | **Duplicate XP bug fix.** AI was awarding TRAINING: XP on the turn after training (e.g. walking to breakfast). Three prompt fixes: removed stale "pre-rolls 3 d20 values" language, clarified TRAINING: tags are ONLY for current-turn activity, and added explicit rule against carry-over from previous turns. JS fix: `trainingTagFound` flag gates the narrative-XP fallback parser so it can't double-apply XP when proper TRAINING:/COMBAT: tags are present. | V116 → V117. See `Docs/updates.md`. |
| 2026-06-09 | **Shatterpoint aptitude display fix + BladeIntuition XP multiplier fix.** "Shatterpoint" was stored in `innateAbilities[]` (wrong array) showing as a duplicate aptitude. "Blade Intuition" was in `aptitudes[]` as AI text but `BladeIntuition` was absent from `innateTalents[]`, so the ×1.3 XP multiplier never fired. Added `repairTalentConsistency()` (called on load): strips invalid keys from `innateAbilities`, promotes aptitude labels to `innateTalents` keys, strips Force ability catalog keys from `aptitudes`. Same Force-key guard added to SHEET parse and toggle sync filters. | V117 → V118. See `Docs/updates.md`. |
| 2026-06-09 | **Complete applyTalentXPMultiplier.** Added `QuickStudy` (forceKnowledge ×1.2) and `ForceSensitiveHealer` (Healing-family abilities ×1.3) to the multiplier function so all four XP-effect talents are purely JS-driven. The AI never needs to manually calculate these bonuses. | V118 → V119. See `Docs/updates.md`. |
| 2026-06-09 | **XP-jump enforcement + ShatterSense/Shatterpoint exclusivity.** Three JS fixes: (1) `_savedAptitudes` snapshot now strips Force ability catalog keys so "Shatterpoint" never re-enters aptitudes after SHEET parse. (2) Pre-parse "Time Elapsed" before CHANGES loop; reject TRAINING: tags where claimed hours exceed 2× elapsed time. (3) Guard in TRAINING:/XP: parsers blocks `forceAbilities.Shatterpoint` XP when ShatterSense is active; `buildLoreContext()` injects note to AI that learned Shatterpoint is permanently unavailable. | V119 → V120. See `Docs/updates.md`. |
| 2026-06-09 | **Character Creation screen.** Full creation screen replaces AI Q&A intro: Era/Year, Name, Species, Age, Faction, Rank, Discovery Age, Opening Scene, Backstory. Point-pool stat system: rank determines core/force pool sizes (e.g. Padawan = 115 core / 105 force points), user allocates via +/- buttons with live pool tracker, re-roll randomly redistributes. Backstory saved permanently to `characterSheet.backstory` and injected into AI context every turn. Innate talent selection (max 2). `finalizeCreation()` seeds masterXP from allocations, builds full characterSheet/worldState, fires first AI turn with opening scene. | V120 → V121. See `Docs/updates.md`. |
| 2026-06-10 | **Alignment engine overhaul + Shatterpoint fixes + sim UI.** Full alignment engine rewrite (V122). Clock-accurate narrative atmosphere enforcement (V122b). Sim complete card now shows level-progress rows instead of XP chips (V122c). Shatterpoint (Innate) vs Shatterpoint display and XP disambiguation (V122d). Shatterpoint XP loss on save/load fixed (V122e). File renamed from versioned `starwars_rpg_V121.html` to `index.html`. | V121 → V122e. See `Docs/updates.md`. |
| 2026-06-10 | **Pure cleanup session — no gameplay, no logic changes.** Removed dead AI prompt instructions (individual stat-set tags the AI was instructed to write that JS immediately overwrites). Fixed `ALIGNMENT=` → `ALIGNMENT_XP=` in CHANGES template (was 20× amplifying light-side gains). Unified all tier names/ranges to canonical CLAUDE.md values (removed Untrained/Apprentice/Adept/High Master from prompt). Removed dead MOMENTUM_WINDOW and WILL_OF_FORCE switch cases (never ran — startsWith handlers catch first). Removed 11 `console.log` statements. Fixed `Djem So` (spaced) → `DjemSo` in all key-path examples. File shrank from 10,357 → 10,252 lines. **Known unfixed bug flagged:** WILL_OF_FORCE startsWith handler uses old `characterSheet.alignment +=` instead of `addEquilibriumXP(wofGain * 8)` — needs separate logic fix. | V122e → V123 (index.html). No `Docs/updates.md` entry needed — structural cleanup only. |
| 2026-06-11 | **Sub-ability proficiency XP fixes.** Three changes: (1) SHEET parse now filters sub-abilities (par !== null in FORCE_ABILITY_CATALOG) from forceAbilities — prevents spurious "ForcePush: 0" entries. (2) TRAINING: handler now detects sub-ability keys and redirects to applyProficiencyXP instead of applyXPToSheet, so `TRAINING: forceAbilities.ForcePush` works as a proficiency award. (3) Prompt PROFICIENCY: rule strengthened with concrete xpAmount scale and mandatory paired-lines example for ForcePush. | V123n → V124 (index.html). |
| 2026-06-11 | **People tab NPC persistence fix.** Root cause: WORLD JSON parse was `worldState = JSON.parse(...)` — a full overwrite. Every AI response wiped trackedCharacters, characterProfiles, npcAgendas, pendingEvents, worldLog, storyFlags, and all other JS-managed arrays/objects if the AI omitted them from WORLD JSON. Fix: snapshot all JS-managed fields before the overwrite and restore them after. The AI WORLD JSON now only controls narrative fields (location, inGameDate, currentScene, sceneNPCs). | V124 → V125 (index.html). |
| 2026-06-11 | **Phantom training XP + multiple roll cards fix.** Two AI prompt compliance issues: (1) AI was inserting TRAINING: tags in non-training turns (social/narrative carry-over). Added explicit rule: TRAINING: tags represent current-turn work only. (2) AI was decomposing a single training session into multiple ROLL:/ROLL_LABEL= pairs. Added explicit rule: ONE ROLL PER TRAINING SESSION with example. | V125 → V126. See `Docs/updates.md`. |
| 2026-06-11 | **Tier-based XP scaling + roll threshold recalibration.** (1) `statLevelToTierMult()` scales training XP by tier band (×1.0 Initiate → ×3.5 Legendary) so harder actions at higher skill levels yield proportionally more XP. `getStatLevelForPath()` derives current level from masterXP for any stat path. Both TRAINING: call sites updated to pass stat level. (2) Solo roll thresholds updated to Fail<8 / Contested 8-11 / Solid 12-16 / Strong 17-20 / Overwhelming 21+ — calibrated to match CEILING training table distributions and master prompt margin scale. | V126 → V127. See `Docs/updates.md`. |
| 2026-06-12 | **Momentum window XP + proficiency trickle-back.** Two fixes: (1) `applyMomentumToXP()` helper multiplies XP by `characterSheet.momentumWindow.multiplier` when window is active; applied at all six real-turn XP call sites (TRAINING:, COMBAT:, PROFICIENCY:, XP:, endCombat ×2) — simulation code bypasses it. (2) `applyProficiencyXP()` now trickles 20% of proficiency XP back to the base ability via `applyXPToSheet` (reverse of the existing 5% forward trickle). `Docs/SWRPG_XP_System_Reference.md` §11 updated: BladeIntuition changed from "5 bonus levels at creation" to ongoing ×1.3 multiplier; ForceReservoir row added (forceOutput ×1.3). | V127 → V128. See `Docs/updates.md`. |
| 2026-06-12 | **Four talent effects in sim.** (1) `simGetStrainPenalty`: UnbreakableSpirit raises 90+ strain XP floor from 0.1 to 0.3. (2) `addStrain` in `simCalcDailyStrain`: IronMind reduces mental strain ×0.8; NaturalTelekineticBurst reduces Force strain ×0.8 for TK-family activities; BattleMeditationAffinity reduces Force strain ×0.6 for BattleMeditation specifically. `addStrain` signature extended with `forceFam` and `abilKey` params; training-rows call site passes `act.forceFam` and `act._dynForceAbility\|\|act.coveredAbility`. `telekinesis_basic` activity gains `forceFam:'TK'`; dynamic force-ability activities gain `forceFam: cat.fam`. (3) `applyTalentXPMultiplier`: BattleMeditationAffinity case adds `xp/0.3` (70% cost reduction) for `forceAbilities.BattleMeditation`. | V128 → V129. See `Docs/updates.md`. |
| 2026-06-13 | **Combat outcome narration enforcement.** AI was ignoring ROLL_OPPOSED margin results and narrating player as succeeding on Clear Loss / Dominant Loss / Overwhelming Loss. Root cause: the "Never ignore the roll result" rule existed only in the training section; the combat EXCHANGE RESOLUTION section had no equivalent. Fix: added "THE MARGIN IS ABSOLUTE GROUND TRUTH" block in EXCHANGE RESOLUTION with per-loss-tier narrative requirements (Narrow/Clear/Dominant/Overwhelming) and explicit prohibition on narrating player attacks succeeding on negative margins. Also hardened FAILURE CONSEQUENCES to require showing the loss first before applying consequences. Prompt-only fix. | V129 → V132 (index.html). |
| 2026-06-15 | **Phantom strain fix.** Three independent inflation sources blocked: `_hasStrainActivity` pre-scan gates FORCE/PHYSICAL/MENTAL_STRAIN handlers so positive deltas only apply on training/combat turns; narrative parsers scoped to pre-CHANGES text only; `maxPhysicalStrain\|\|10` and `maxMentalStrain\|\|10` defaults corrected to 100. | V132 → V137. See `Docs/updates.md`. |
| 2026-06-15 | **Opponent stat locking.** AI re-generating lower INLINE stats for "damaged" opponents caused mid-combat stat drift. Fix: first ROLL_OPPOSED INLINE values are saved to `worldState.characterProfiles`; subsequent rounds use stored values, ignoring AI-rewritten INLINE. | V137 → V138. See `Docs/updates.md`. |
| 2026-06-15 | **Combat Injury & Pain System (V139).** Full injury tracking: severity-weighted roll penalties (HP threshold + body-part injuries + off-hand penalty), Control Pain FS-cost mitigation, dark-side pain channeling, Battlemind crash mechanic, opponent injury tracking. 12 new CHANGES tags (INJURY_ADD=, OPP_INJURY_ADD=, PAIN_CHANNEL=, COMBAT_END_CRASH, etc.). Auto-clear of minor/moderate injuries after 7+ hours. ControlPain added to FORCE_ABILITY_CATALOG. | V138 → V139. See `Docs/updates.md`. |
| 2026-06-16 | **Six combat/display fixes (V141).** (1) Combat round counter: `ACTIVE COMBAT STATE` block injected into stateBlock so AI uses JS-tracked round number, not history. (2) Roll card: opponent tier displayed, gap direction text corrected, tier gap shown as explicit player penalty in breakdown. (3) Form selection: `FORM SELECTION IS MANDATORY` rule + DjemSo examples replacing ShiiCho in prompt. (4) DjemSo normalization: `_FORM_CANON` canonical lookup table fixes `"Djem so" → "DjemSo"`; overwrite bug fixed with prevLevel in Math.max. (5) ForceBarrier sub-ability guard: sidebar filters to catalog-valid children only; PROFICIENCY: parser validates subKey against catalog before applying XP. (6) Deferred roll result: `activeCombat.lastRollResult` stored after each ROLL_OPPOSED; stateBlock injects `⚠ LAST EXCHANGE RESULT` each combat turn with exact outcome and narrative directive; prompt restructured to describe deferred model. | V139 → V141. See `Docs/updates.md`. |
| 2026-06-16 | **Tier gap player-only + mandatory combat resolution reminder (V142).** Tier gap now applies only to player roll — removed `oppTierGapBonus` from opponent calculation. `lastRollReminder` appended to per-turn reminder (last thing AI reads) with explicit PLAYER LOST/WON directive when `activeCombat.lastRollResult` exists. | V141 → V142. See `Docs/updates.md`. |
| 2026-06-16 | **Hardcoded lightsaber properties (V143).** `characterSheet.lightsaber = { color, type }` auto-seeded on load. LIGHTSABER line injected into sheetSummary every turn with blade color + sensory rules (no clang/ring/metallic). LIGHTSABER SENSORY CANON section added to MASTER_PROMPT covering sound physics and color drift prevention. Sidebar: color swatches + type dropdown with glow indicator. | V142 → V143. See `Docs/updates.md`. |
| 2026-06-17 | **Tier gap, combat round, and blade color moved off AI self-reporting onto JS-derived ground truth (V144).** (1) `fireRoll()` derives tier gap from real registered opponent stats (`oppStats`) instead of the independently-declared `TIER_GAP=` tag — fixes contradictory "same tier but +4 gap" displays and opponent tier silently not showing. AI's tag is now only a fallback when no opponent stats are registered. (2) New `combatRollsThisTurn` counter (one per resolved `ROLL_LABEL=` during active combat) overrides the AI's self-reported `COMBAT_ROUND:` count, plus a fallback that advances the round if the AI omits the tag entirely — fixes round-counter drift ("AI one turn behind"). (3) New `scrubBladeColor()` regex safety net corrects off-canon color words ("silver blade") in displayed/stored narrative to match `characterSheet.lightsaber.color`, so a drifted description can't reinforce itself in future context. Training-droid Force-stat leakage and a temp-vs-recurring NPC/opponent profile architecture were discussed but deferred — see chat log. | V143 → V144. See `Docs/updates.md`. |
| 2026-06-17 | **NPC archetype/weighted-stat opponent generation — step 1 of the opponent-lifecycle system (V145).** New `NPC_POOLS` (tier-keyed 1-6, same scale as `statToTier()`) and `NPC_ARCHETYPES` (TrainingDroid, Mook, Soldier, Officer, TacticalLeader, BattleIntel, Guardian, JediConsular, SithInquisitor — each with relative stat weights; droid/mook/soldier/officer archetypes are `forceCapable:false`, structurally fixing the droid-Force-stat leakage bug). `npcWeightedDistribute()` biases the existing point-pool-random-walk pattern toward an archetype's weighted stats; `npcGenerateStats()` rolls a full opponent stat block shaped to drop straight into `characterProfiles[name].stats`. New `prodigy` flag rolls the stat budget one tier above the requested tier while keeping the narrative rank label at the original tier — for a talented individual whose rank hasn't caught up to their capability. New CHANGES tag `NPC_ROLL=name|archetype|tier[|prodigy]` replaces hand-invented `PROFILE_STATS=` numbers for any non-canon opponent. Lifecycle states (disposable/active/dormant/deceased) and apex-capped `RECURRING_RETURN` tier-bumps are the planned next step, not yet built. | V144 → V145. See `Docs/updates.md`. |
| 2026-06-18 | **NPC lifecycle states + RECURRING_RETURN — step 2 of the opponent-lifecycle system (V146).** `characterProfiles[name].lifecycleState` now tracks `disposable\|active\|dormant\|deceased`; all profile-creation sites (`NPC_ROLL=`, `GENERATE_PROFILE`, `INTERACTION`, INLINE auto-register, `OPP_INJURY_PERMANENT=` fallback) default it appropriately. New `npcApplyFate(name, fate)` resolves a fight's outcome into a lifecycle change — `disposed` (default) deletes only if still `disposable`, `killed` → `deceased` (permanent, never reversible), `fled`/`captured`/`recurring` → `dormant` (kept indefinitely, no time-based purge). `COMBAT_END:` gained an optional 6th `fate` field wired to `npcApplyFate()`, captured before `endCombat()` nulls `activeCombat`. New tag `NPC_LIFECYCLE=name,state` for off-combat lifecycle changes. New tag `RECURRING_RETURN=name,tierBump` re-rolls a dormant archetype-generated NPC's stats via `npcGenerateStats()` and flips it back to `active`, incrementing `returnCount`; the tier bump is capped at tier 6 (Legendary) for free since `npcGenerateStats()` already clamps 1-6 — the structural enforcement of the §3E apex-ceiling rule. `NPC_ROLL=` flags field extended to a comma-separated list (`prodigy`, `recurring`, or both). | V145 → V146. See `Docs/updates.md`. |
| 2026-06-19 | **Sparring no-fail bug fix (V147).** Player reported never failing at-or-below-tier activities and correctly suspected combat/sparring should override that. Root cause: the prompt's "DO NOT INVENT UNREQUESTED TRAINING" rule listed "sparring" as a `TRAINING:` trigger word, which routed sparring into the no-fail SUCCESS TABLE (intended for solo practice only) instead of the combat system's real opposed-roll failure (`COMBAT_START:`/`ROLL_OPPOSED`/`COMBAT_END:`). Three prompt-only fixes: removed "sparring" from the TRAINING: trigger list with an explicit "sparring is never TRAINING:" rule; added a carve-out to TRAINING OUTCOME SELECTION stating the no-fail tables apply only to solo unopposed practice; added an explicit line under the mandatory-roll combat rule naming sparring partners/training droids as opponents requiring ROLL_OPPOSED. No JS/engine logic changed. | V146 → V147. See `Docs/updates.md`. |

---

*End of CLAUDE.md — Last updated: 2026-06-19 (V147)*
