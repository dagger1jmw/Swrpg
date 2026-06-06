# Star Wars Legends RPG — Claude Code Project

## Project Overview

A single-file browser-based Star Wars Legends text RPG. The entire game lives in one HTML file deployed via GitHub Pages at `dagger1jmw.github.io`. The AI game master runs on the Gemini API (`gemini-2.5-flash`). Primary device is **iPad Safari** — all UI decisions must be mobile-first.

The player controls Jared Wright, a Human Jedi youngling/padawan in 3661 BBY (Old Republic era, Knights of the Old Republic timeline). The game is a living sandbox — persistent world, real stat progression, canonical Star Wars Legends lore.

\---

## File Structure

```
starwars-rpg/
  starwars\_rpg\_V97.html     ← current working file (always use highest version)
  CLAUDE.md                  ← this file
  docs/
    SW\_Sim\_Rules\_v1.md       ← simulation system rules and XP math
    SW\_Activity\_Bank\_v1.md   ← training activities with skill weight maps
    SW\_Force\_Abilities\_Forms\_v2.md  ← canonical Force abilities, lightsaber forms, shatterpoint spec
```

**Versioning rule:** When making significant changes, save as V98, V99, etc. Never overwrite the current version without creating a new one first.

\---

## ARCHITECTURE RULES — NEVER VIOLATE THESE

1. **Single file only.** No build system, no npm packages, no bundling, no external JS files. One `.html` file contains everything: HTML, CSS, JS, and the full AI prompt.
2. **`masterXP` is the sole source of truth** for all stat levels and XP. Structure: `{ totalXP: number }` per stat. Level is always *derived* via `deriveFromTotalXP()`, never stored. Never read stat levels from `characterSheet` directly for XP calculations.
3. **The AI's `<<<SHEET>>>` JSON is always one turn behind.** JS always wins for: `masterXP`, `innateTalents`, `innateAbilities`, `birthday`, `lifeStage`, `storyFlags`, shatterpoint track. These fields are snapshotted before every SHEET parse and restored after.
4. **Shatterpoint is NEVER in `masterXP.forceAbilities`.** It has its own dedicated track at `masterXP.shatterpoint.main`. Writing it to `masterXP.forceAbilities` causes the standard XP engine to process it incorrectly, inflating the level to garbage values. `characterSheet.forceAbilities\['Shatterpoint']` is fine (display only, sourced from the SP track).
5. **All strain values are 0–100 scale.** `maxForceStrain`, `maxPhysicalStrain`, `maxMentalStrain` all default to 100.
6. **Stat tiers:** Normal 0–100, Legendary 101–150, Transcendent 151+.
7. **Lightsaber form keys are normalized to camelCase no-hyphen** after every SHEET parse. `Shii-Cho` → `ShiiCho`, `Djem So` → `DjemSo`. The normalization uses `masterXP` derived level as authoritative — never the AI's reported stat value.
8. **Never let the AI set age.** Age is computed automatically from `characterSheet.birthday` vs `worldState.inGameDate` by `computeAge()` inside `updateWorldState()`. The `AGE=` CHANGES tag is a fallback only.

\---

## Key Global Variables

```javascript
let characterSheet = null;    // full character state — source of truth for display
let worldState = null;        // world/environment state — location, date, time, etc.
let masterXP = { forceStats:{}, stats:{}, forceAbilities:{}, lightsaberForms:{}, shatterpoint:{} };
let recentHistory = \[];       // last 6 turns sent to AI each request
let fullHistory = \[];         // complete history — kept in save file only
let campaignSummary = '';     // compressed narrative memory, rebuilt every 10 turns
let turnCount = 0;
let apiKey = '';              // Gemini API key — stored in localStorage as 'sw\_rpg\_gemini\_key'
const RECENT\_TURNS = 6;      // how many raw turns in AI context per request
```

\---

## XP System

### Standard Stats

```javascript
xpRequired(level)     = floor(100 × 1.07^level)
xpToReachLevel(N)     = sum of xpRequired(0) through xpRequired(N-1)
deriveFromTotalXP(xp) → { level, current, required }
applyXPToSheet(path, xpToAdd)  // path e.g. 'forceStats.forceSense', 'lightsaberForms.ShiiCho'
syncMasterXPToSheet()          // runs after every SHEET parse — masterXP overwrites AI values
```

**`masterXP` categories:** `forceStats`, `stats`, `forceAbilities`, `lightsaberForms`, `shatterpoint`

### Shatterpoint XP (separate track)

```javascript
spXPRequired(level)       = floor(500 × 1.07^level)  // 5× the normal formula
spXPToReachLevel(N)       = sum of spXPRequired(0..N-1)
spDeriveFromTotalXP(xp)   → { level, current, required }
spApplyXP(rawAmount)      // applies ×0.1 multiplier if ShatterSense innate talent active
spSeedIfInnate()          // seeds at level 5 if ShatterSense active and level < 5
spGetLevel()              → current shatterpoint level
spGetTier(level)          → 1 (tactical), 2 (personal, L6+), 3 (situational, L11+)
spPerformRoll(target)     // d20 + bonuses → outcome, posts to feed, stores in lastShatterpointRoll
spSetFocus(value)         // sets bandwidth, applies Vaapad ×1.3 if active, sets tunnelVision flag
spClearFocus()            // resets focus to 0
spClearMisread()          // clears unresolved misread flag
```

**Shatterpoint seeding:** `spSeedIfInnate()` is called after every SHEET parse, after `loadFromSave`, and when `ShatterSense` is toggled on in the Talents panel.

### compressedBonus

Used for combat and XP modifier calculations:

```javascript
compressedBonus(stat) // logarithmic compression — compressedBonus(50) ≈ 2.5
```

\---

## AI Response Format

Every AI response must contain three blocks at the end:

### CHANGES Block

```
<<<CHANGES>>>
HP=\[current]
FORCE\_STRAIN=\[current]
PHYSICAL\_STRAIN=\[current]
MENTAL\_STRAIN=\[current]
FORCE\_BARRIER=\[current]
ALIGNMENT=\[value]                    // light side gains and momentum-window hits only
DARK\_PRESSURE=\[0-100]                // dark side accumulation — JS handles discharge at 100
MOMENTUM\_WINDOW=\[multiplier],\[days]  // opens after pressure discharge
WILL\_OF\_FORCE=\[gain],\[description]   // surrendering to the will of the Force
SURRENDER\_DISCOUNT=\[0-0.5]           // reduces next pressure discharge
LOCATION=\[full location string]      // when location changes
SHATTERPOINT\_PERCEIVED:\[tier],\[desc] // passive perception surfaces
SHATTERPOINT\_ROLL:\[target]           // triggers JS interpretation roll
SHATTERPOINT\_FOCUS=\[0-100]           // awareness bandwidth
SHATTERPOINT\_FOCUS\_CLEAR             // resets focus at scene end
SHATTERPOINT\_XP=\[amount]             // proficiency XP (JS applies ×0.1 for innate)
SHATTERPOINT\_MISREAD\_RESOLVED        // after misread consequence fully played out

// XP — ALWAYS use these formats, never prose:
TRAINING: category.StatName, hours, intensity, difficulty, outcome
  // intensity: casual|standard|intense|pushing|elite
  // difficulty: basic|standard|ceiling|wall|above
  // outcome: fail|contested|solid|strong|overwhelming
  // Example: TRAINING: lightsaberForms.ShiiCho, 2.0, intense, ceiling, solid

COMBAT: category.StatName, rounds, tierGap, engagement, outcome
  // tierGap: 0=same tier, positive=attacker higher, negative=defender higher
  // engagement: light|standard|aggressive|desperate
  // outcome: decisive\_loss|narrow\_loss|draw|narrow\_win|decisive\_win
  // Example: COMBAT: lightsaberForms.ShiiCho, 8, -1, aggressive, narrow\_win
<<<END\_CHANGES>>>
```

### SHEET Block

```
<<<SHEET>>>
{ ...full characterSheet JSON... }
<<<END\_SHEET>>>
```

### WORLD Block

```
<<<WORLD>>>
{ ...full worldState JSON... }
<<<END\_WORLD>>>
```

\---

## Player-Owned Fields (Protected from AI Overwrites)

These fields are snapshotted before SHEET parse and restored after. The AI cannot change them — only JS or explicit player action:

|Field|What It Is|
|-|-|
|`innateTalents\[]`|Array of talent keys (e.g. `'ShatterSense'`, `'NaturalTelekineticBurst'`)|
|`innateAbilities\[]`|Array of innate ability keys (e.g. `'TelekineticBurstPassive'`)|
|`birthday`|`{ day, month, year, era }` — auto-computes age each turn|
|`lifeStage`|`'youngling'`/`'padawan'`/`'knight'`/etc — AI sets via `LIFE\_STAGE:` tag, never raw JSON|
|`storyFlags`|`{ maceLiving, aingTiiContact, ... }` — story condition flags|
|`aptitudes\[]`|Merged: AI-authored aptitudes + talent display labels (deduplicated)|

\---

## Alignment System

**Scale:** −100 (Consumed) to +100 (Luminous). Seven tiers:

|Range|Tier|Label|
|-|-|-|
|76–100|Deep Light|Luminous|
|26–75|Light|Attuned|
|1–25|Leaning Light|Calm|
|−25–0|Neutral|Balanced|
|−26–−50|Leaning Dark|Shadowed|
|−51–−75|Dark|Corrupted|
|−76–−100|Deep Dark|Consumed|

**Dark side works through pressure.** AI sends `DARK\_PRESSURE=` with a new 0–100 total. When pressure hits 100, JS automatically discharges: alignment drops by tier-dependent amount, pressure resets to 40, a red `◈ PRESSURE DISCHARGED` notification appears in feed. AI never directly sets alignment for dark acts.

**Momentum window.** After discharge, AI sends `MOMENTUM\_WINDOW=\[multiplier],\[days]`. During the window, dark acts hit `ALIGNMENT=` directly (not pressure). Window closes when enough time passes, or character makes a light/neutral choice, or meditates.

**Light side.** AI sends `ALIGNMENT=\[new value]` directly for positive moral choices. Diminishing returns apply for repeated similar acts. `WILL\_OF\_FORCE=\[gain],\[description]` for surrendering to the Force (unique — also reduces next pressure discharge).

\---

## Shatterpoint System

**Three tiers:**

* **Tier 1 (Tactical, always active):** Structural weaknesses, combat stance flaws, injuries
* **Tier 2 (Personal, L6+):** Psychological fractures, defining decisions, relationships at breaking point
* **Tier 3 (Situational, L11+):** Battle/event fulcrums, strategic pivots — extremely rare

**Passive perception, active interpretation.** Shatterpoints surface without effort for innate talent holders. The interpretation roll (`SHATTERPOINT\_ROLL:`) determines quality of understanding, not whether it's perceived.

**Roll bonuses:** `level × 0.15 + compressedBonus(meditation) × 0.4 + compressedBonus(willpower) × 0.2 + 1.0 (innate talent bonus)`

**Tunnel vision.** `SHATTERPOINT\_FOCUS=` sets bandwidth (0–100). Above 70, `tunnelVision: true` is set — AI must treat character as having reduced ambient awareness. Vaapad active simultaneously multiplies focus by 1.3.

**Rarity rule.** Most scenes have no shatterpoints. The AI must not manufacture them for dramatic effect.

\---

## Simulation System

JS-driven — no AI involvement in XP math. AI only provides weekly narrative summary (optional, lightweight call).

**Activity registry:** `SIM\_ACTIVITIES` array. Each entry has `key`, `label`, `weights\[]`, `strainBias`, `defaultIntensity`, `unlock(cs)` condition, and optional `isRecovery` or `isShatterpoint` flags.

**Shatterpoint Practice** (`isShatterpoint: true`) routes to `spApplyXP` instead of the standard weight map.

**Meditation activities** (`isRecovery: true`) reduce strain instead of adding it. Recovery rates per hour (scaled by `medBonus = 1 + meditationStat/50`):

* Force Sense Meditation: F−8, P−4, M−8
* Meditation (Centering): F−12, P−10, M−10
* Deep Force Immersion: F−20, P−18, M−18

**Strain thresholds / XP penalty:** >20 ×0.9, >50 ×0.7, >70 ×0.4, >90 ×0.1

**Mandatory training rows** by `lifeStage` (youngling/padawan/knight\_with\_padawan/master\_with\_padawan) defined in `SIM\_MANDATORY`.

**Transition scene.** After simulation completes: (1) JS injects a `\[SYSTEM STATE UPDATE]` block at the front of `recentHistory` so AI knows the new date/location. (2) Optional "Generate Transition Scene" button makes one AI call (`simApiCall`, 4000 tokens, `gemini-2.5-flash`) for a 4–6 paragraph narrative bridge.

\---

## Calendar System

**Galactic Standard Calendar:** 12 months, 368 days/year, 7-day weeks.

```javascript
GSC\_MONTHS = \['Coruscann','Frostuary','Warming','Seedmonth','Bloomtide','Midyear',
              'Heatmonth','Harvestide','Goldfall','Stormtide','Coldmonth','Yearend']
GSC\_DAYS\_IN\_MONTH = \[31,30,31,31,31,30,31,30,31,31,31,30]
GSC\_WEEK\_DAYS = \['Primeday','Centaxday','Taungsday','Zhellday','Benduday','Restday','Endday']
```

Functions: `parseDateString()`, `dateToString()`, `dateToAbsoluteDays()`, `advanceInGameDate()`, `updateCalendarContent()`, `computeAge()`, `saveBirthday()`.

Calendar popup is a fixed centered overlay (same structure as sim panel) with two tabs: **Calendar** (month grid, year progress bar, month position) and **Birthday** (date inputs, auto-age display).

\---

## Innate Talents Registry (`SIM\_INNATE\_TALENTS`)

Stored in `characterSheet.innateTalents\[]`. Player-set only — AI cannot modify. Toggled via Talents tab in sim panel. Effects applied automatically by `simApplyTalentEffects()`.

Key talents:

* `ShatterSense` — Shatterpoint XP ×0.1, seeds at L5, strain ×0.3, passive perception, uncapped track
* `BattleMeditationAffinity` — Battle Meditation XP ×0.3, Strain ×0.6
* `NaturalTelekineticBurst` — Telekinesis family Force Strain ×0.8
* `IronMind` — Mental Strain ×0.8
* `ForceReservoir` — maxForceBarrier +20

\---

## Story Flags (`worldState.storyFlags`)

Gate era/faction-locked abilities. AI sets via narrative events. Player can override in Flags tab.

|Key|Gates|
|-|-|
|`maceLiving`|Vaapad teachable|
|`maceTrustEstablished`|Vaapad learning begins|
|`aingTiiContact`|Flow-walking, Aing-Tii Fighting-Sight discoverable|
|`aingTiiApproved`|Flow-walking, Aing-Tii Fighting-Sight learnable|
|`fallanassiContact`|Phase, Fold Space discoverable|
|`jediArchiveAccess`|Advanced theory abilities via research|
|`sithTextAccess`|Sith-origin abilities discoverable|
|`jediCouncilPermission`|Juyo/Vaapad learnable|

\---

## Character: Jared Wright

* Human · Jedi Order · Age \~9 · 3661 BBY (Old Republic, KOTOR timeline)
* Innate talents: `NaturalTelekineticBurst` (active), `ShatterSense` (active)
* Life stage: Padawan
* Location: Jedi Temple, Coruscant
* Shatterpoint: Level 5, Tier 1 (Tactical), innate talent active
* Current approximate stats: ForceSense \~34, Meditation \~35, ForceControl \~38, ShiiCho \~32, Telekinesis \~28

\---

## Lore Rules for AI

* Era: 3661 BBY, Old Republic. The Jedi Order is deeply intertwined with the Republic (which Dooku later criticizes as corruption). Sith Empire is active.
* No prequel/sequel era technology, characters, or events unless canonically present in this era.
* Mace Windu does not exist yet (he is born \~72 BBY). Do not reference him as a contemporary.
* Force abilities must match the `SW\_Force\_Abilities\_Forms\_v2.md` spec. The AI cannot grant abilities that have unmet prerequisites or locked story flags.
* Shatterpoint rarity: most scenes have none. Do not manufacture them for drama.
* Alignment: never set alignment directly for dark side acts — use `DARK\_PRESSURE=` only.

\---

## UI Structure

```
Header bar (fixed):
  \[Turn N] \[CHARACTER] \[WORLD LOG] \[PEOPLE] \[SIMULATE] \[SYNC] \[XP] \[TALENTS] \[SAVE] \[LOAD] \[NEW GAME] \[CLEAR CACHE] \[API KEY]

Left panel: Character sheet (scrollable)
  - Name, species, faction, age
  - Alignment bar (7-tier gradient) + Dark Pressure bar
  - HP, Force Barrier, strain bars
  - Force Stats section
  - Force Abilities section (includes Shatterpoint display if active)
  - Lightsaber Forms section
  - Stats section
  - Traits (aptitudes, strengths, weaknesses)
  - Shatterpoint section (level, tier, XP bar, focus bar, tunnel vision warning)

Main area: Story feed (scrollable)
  - GM narrative, XP cards, alignment events, shatterpoint cards

Bottom bar (fixed): Location | Time | Date | Input field | ACT button

Overlays (fixed position, z-index 300+):
  - Simulate panel (tabs: Schedule / Period / Drills / Talents / Flags / Progress)
  - Calendar panel (tabs: Calendar / Birthday)
  - Save/Load modal
  - XP inject modal
  - World Log panel
  - People panel
```

\---

## Known Issues / In Progress

* Location sometimes resets to old value if AI outputs empty string in WORLD JSON — protected by pre-parse snapshot but AI should be reminded to include current location every turn
* Duplicate Shii-Cho normalized on every SHEET parse — but if AI persists in using hyphenated key, normalization merges correctly
* Transition scene requires good API key and no quota limits — errors shown in feed

\---

## Development Notes

### Syntax Check After Every Edit

Always run a mental or actual syntax check after JS edits. The file is large (\~6000+ lines) and unclosed brackets or template literals cause silent failures in Safari.

### Testing on iPad Safari

* Fixed-position overlays must use `position:fixed` not `position:absolute` inside overflow containers
* iOS Safari ignores `overflow-y:auto` on fixed elements unless `-webkit-overflow-scrolling:touch` is set
* `position:sticky` does not work inside `overflow:scroll` containers on iOS
* Use `display:flex; flex-direction:column` with a fixed header div and a scrollable body div for any modal that needs a persistent header

### Common Bugs to Watch For

1. **Shatterpoint contamination:** If shatterpoint level spikes, check that `masterXP.forceAbilities\['Shatterpoint']` doesn't exist. Delete it if found.
2. **Duplicate forms:** AI sometimes uses `Shii-Cho` vs `ShiiCho`. Normalization runs after every SHEET parse and uses masterXP derived level as authoritative.
3. **Player fields wiped:** If innate talents or birthday disappear after a turn, check the SHEET parse snapshot/restore block.
4. **Calendar popup not scrolling on iOS:** Must use `overflow-y:scroll` with a flex-column structure — not `overflow-y:auto` on a position:fixed element.
5. **simApiCall using wrong key:** Uses `apiKey` variable (module-level, loaded from `localStorage.getItem('sw\_rpg\_gemini\_key')`). Never use `sw\_rpg\_api\_key`.

### File Size

The single HTML file is currently \~6500 lines. This is intentional — it's a constraint we're keeping. When adding features, be concise and avoid duplicating logic.

\---

## Changelog

|Version|Major Changes|
|-|-|
|V110|Shatterpoint engine (passive perception, interpretation rolls, tunnel vision, Vaapad amplification). Birthday/auto-age system. Calendar panel redesign (fixed overlay, two tabs). Alignment pressure system (7 tiers, momentum window, surrender mechanic). Transition scene system (state sync block + AI narrative). Simulation v2 (JS-driven XP, activity registry, strain model, meditation recovery). Innate talents system (player-only, protected from AI). Location persistence fix. Lightsaber form key normalization.|
|V96|Base version uploaded for Claude Code migration. Contained: masterXP system, TRAINING/COMBAT XP tags, combat system, simulation panel, calendar, alignment, shatterpoint seeding.|



