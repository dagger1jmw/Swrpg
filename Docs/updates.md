# SWRPG Engine Updates

Detailed change log for each version. CLAUDE.md session log references this file for specifics.

---

## V149 — 2026-06-19

**Fix: combat strain double-counting + endurance mitigation strengthened**

### Problem
Player reported gaining "over 100 strain in every stat" after just 8 rounds of combat — far more than the per-round combat strain constants alone (`updateCombatStrain()`'s base table, e.g. `standard: {p:8,f:6,m:4}` per round) could plausibly produce even unmitigated.

Root cause: combat strain is tracked exclusively via `updateCombatStrain()`'s `activeCombat.accForce/accPhysical/accMental` accumulators during the fight, and is only ever written to the persisted `characterSheet.forceStrain/physicalStrain/mentalStrain` fields once, in full, by `endCombat()`. The master prompt already instructed the AI not to send `FORCE_STRAIN=`/`PHYSICAL_STRAIN=`/`MENTAL_STRAIN=` mid-combat (line ~1809: "NO strain updates to character sheet mid-combat — use COMBAT_ROUND: to track it"), but nothing in the code enforced this. The CHANGES-tag switch-case handlers for those three tags applied any positive value the AI reported as a real delta to the persisted field whenever `_hasStrainActivity` was true — and that flag is true for the AI's *entire* turn output any time a `COMBAT_ROUND:`/`COMBAT_START:` line is present, i.e. every turn of an active fight. The per-turn stateBlock also prominently displays the growing "Accumulated strain so far (NOT yet applied to sheet)" total during combat (line ~4015) — if the AI echoed that running total back through the strain tags (plausible behavior for an LLM, and the same class of prompt-compliance gap that caused the V147 sparring bug), the persisted fields would absorb the accumulating total turn-by-turn AND then get the same full accumulated total added again at `endCombat()`, roughly doubling true strain gain by the end of a multi-round fight. A legacy markdown-fallback sheet parser (for when the AI writes a markdown-style sheet instead of JSON) had the identical unguarded pattern with no `_hasStrainActivity` check at all.

Separately, the player asked for Endurance's mitigation of strain gain to be made more meaningful. The existing curve, `em = compressedBonus(endurance) / 10`, capped out at only 32.5% physical / 16.25% force / 9.75% mental reduction even at a maxed Endurance of 100 — weak for a stat explicitly defined (CLAUDE.md §3A) as "stamina, pain tolerance, strain resistance."

### Fix
1. **Structural guard closing the double-count (both strain-tag parsers, `index.html`):** the `FORCE_STRAIN=`/`PHYSICAL_STRAIN=`/`MENTAL_STRAIN=` switch cases (~line 5094) now block any positive delta whenever `activeCombat` is truthy, not just when `_hasStrainActivity` is false: `if (_rawDeltaF > 0 && (!_hasStrainActivity || activeCombat)) break;` (and the Physical/Mental equivalents). The legacy markdown-fallback duplicate (~line 5640) got the same guard wrapped around its three blocks (`if (!(_dF > 0 && activeCombat)) { ...apply... }`). Combat strain can now only ever be written to the persisted sheet by `endCombat()`, eliminating the double-count regardless of what the AI sends mid-fight. Negative deltas (e.g. narrative strain relief) still pass through during combat, since they aren't part of the bug.
2. **Stronger endurance mitigation curve:** divisor changed from `/10` to `/6` at all 8 sites using the formula for consistency — the two strain-tag parsers (now ×3, ×3, ×3 → ×1 set + fallback set), `updateCombatStrain()` (~line 6161), and the simulation panel's `simCalcDailyStrain()` (~line 10801). New ceiling at END 100: 54% physical / 27% force / 16.25% mental reduction (up from 32.5%/16.25%/9.75%). At a typical Padawan-tier Endurance of ~30, physical mitigation roughly doubled (15%→25%).
3. Prompt's ENDURANCE AND STRAIN MITIGATION reference block (~line 2323) updated with the new formula, corrected em values at each END milestone, and an explicit note that the engine now hard-blocks strain-tag increases during combat so echoing the displayed running total is pointless.
4. Verified via the standard Node `<script>`-block extraction + `new Function()` syntax check — no errors.

### Files changed
- `index.html` — `FORCE_STRAIN`/`PHYSICAL_STRAIN`/`MENTAL_STRAIN` CHANGES switch cases, markdown-fallback duplicate parser, `updateCombatStrain()`, `simCalcDailyStrain()`, ENDURANCE AND STRAIN MITIGATION prompt block
- `CLAUDE.md` — §9C endurance mitigation formula/values + double-count fix note, Session Log row, footer version bump

---

## V148 — 2026-06-19

**Fix: learned lightsaber forms beyond the four hardcoded ones never appeared as trainable in the simulation panel**

### Problem
Player reported DjemSo not appearing as a trainable activity in the simulation panel despite having learned it in-game. Root cause: `SIM_ACTIVITIES` (~line 8138) only has hardcoded saber entries for ShiiCho, Makashi, Soresu, and Ataru. Shien, DjemSo, ShienDjemSo, Niman, Juyo, Vaapad, JarKai, and KiiShikk have no entry at all, so `simBuildActivityOptions()` never offered them regardless of `characterSheet.lightsaberForms` contents — this affects every form outside the original four, not just DjemSo.

Force abilities already solved this exact class of problem (~line 10583, comment "all others generated dynamically") by generating an activity for every unlocked ability not covered by a hardcoded entry. Lightsaber forms had no equivalent.

### Fix
1. New `FORM_WEIGHT_PROFILES` table (next to `SIM_ACTIVITIES`) gives canon-flavored stat weights for Shien, DjemSo, ShienDjemSo, Niman, Juyo, Vaapad, JarKai, KiiShikk (e.g. DjemSo leans strength/endurance, Juyo/Vaapad lean agility/willpower). `FORM_DEFAULT_WEIGHTS` covers any future form key with no profile. `FORM_DISPLAY_LABELS` supplies proper display names (Djem So, Shien/Djem So, Jar'Kai, Kii-Shikk).
2. `simBuildActivityOptions()` now computes `coveredForms` (every form key already referenced by a hardcoded `SIM_ACTIVITIES` saber entry) and generates a `form_<Key>` practice activity for every other key present in `cs.lightsaberForms` — mirroring the existing dynamic-force-ability pattern exactly. Any form learned in-game is immediately trainable in the simulation panel with no hardcoded entry required, present or future.
3. Verified via a Node smoke test extracting `SIM_ACTIVITIES`/`FORM_WEIGHT_PROFILES`/`simBuildActivityOptions` and calling it directly with a mock sheet containing `{ShiiCho, DjemSo, Juyo}` — confirmed ShiiCho still resolves to its hardcoded entries (no duplication) while DjemSo and Juyo each produced a new dynamic `form_*` activity.

### Files changed
- `index.html` — `FORM_WEIGHT_PROFILES`/`FORM_DEFAULT_WEIGHTS`/`FORM_DISPLAY_LABELS` consts, `simBuildActivityOptions()` dynamic form generation block, return statement updated to include `dynFormActs`

---

## V147 — 2026-06-19

**Fix: sparring was routing through the no-fail TRAINING SUCCESS TABLE instead of the combat system**

### Problem
Player reported never being able to fail at activities at or below their tier, and correctly suspected combat/sparring should override that. Root cause was a direct contradiction in the master prompt: the "DO NOT INVENT UNREQUESTED TRAINING" rule (~line 1863) listed "sparring" as a trigger word for generating `TRAINING:` tags, alongside genuinely solo activities like drilling and deliberate Force use. Once a sparring session is logged as `TRAINING:` with difficulty `basic` (partner at or below the player's tier), it falls onto the SUCCESS TABLE, which is explicitly "no failure possible" by design — that table exists for solo practice, not opposed exchanges. Meanwhile the actual combat system (`COMBAT_START:`/`ROLL_OPPOSED`/`COMBAT_END:`) already supported real opposed-roll failure for sparring (it even has a "Light sparring / training bot" intensity row in the strain table) and already said "Any exchange against an opponent requires ROLL_OPPOSED" — but nothing told the AI that sparring must use that path instead of the training-table path, so it was inconsistently picking the no-fail one.

### Fix (prompt-only, three reinforcing edits in `index.html`)
1. **DO NOT INVENT UNREQUESTED TRAINING rule (~line 1863):** removed "sparring" from the TRAINING: trigger list; added an explicit line: sparring is never `TRAINING:` — it's always `COMBAT_START:`/`ROLL_OPPOSED`/`COMBAT_END:`, regardless of the partner's tier relative to the player.
2. **TRAINING OUTCOME SELECTION (~line 2064):** added an explicit carve-out that the SUCCESS/CEILING/WALL tables apply only to solo, unopposed practice — the instant an opponent (partner, droid, NPC) is on the other side of an exchange, the whole table-selection section doesn't apply; use the combat system instead.
3. **WHEN TO ROLL — MANDATORY TRIGGERS (~line 2046):** added a line under "EVERY combat exchange, no exceptions" explicitly naming sparring partners/training droids as opponents requiring ROLL_OPPOSED, with "losing a sparring match must be a real possibility every time."

No JS/engine logic changed — `fireRoll()`'s opposed-roll margin system already supported real failure for either side; this was purely an AI prompt-compliance gap in which system the AI chose to invoke.

### Files changed
- `index.html` — three prompt edits, no JS changes

---

## V146 — 2026-06-18

**Feature: NPC lifecycle states + RECURRING_RETURN — step 2 of the opponent-lifecycle system**

### Problem

V145 added JS-rolled opponent stats but every generated profile lived forever in `worldState.characterProfiles` with no concept of disposability, and there was no mechanism for a defeated-but-escaped NPC to come back later, stronger, with a grudge (the motivating example discussed was Malgus disappearing after the Sacking of Coruscant and resurfacing later). Blanket time-based purging was explicitly rejected — it would make exactly that kind of returning-character story impossible.

### Lifecycle states on `characterProfiles[name].lifecycleState`

Four states, documented at the `npcApplyFate()` definition (~line 3039):
- `disposable` — one-off opponent, default for `NPC_ROLL` with no `recurring` flag. Purged automatically at `COMBAT_END:` unless escalated first.
- `active` — currently relevant (recurring NPCs while present, canon NPCs, anyone tracked via `INTERACTION`/`GENERATE_PROFILE` — both now default new profiles to `active` instead of leaving the field unset).
- `dormant` — survived/escaped, narratively absent for now, kept indefinitely. Never auto-purged by elapsed time.
- `deceased` — permanent, set only by an explicit in-fiction death. No further lifecycle changes are possible once set (`npcApplyFate()` and the `NPC_LIFECYCLE=` handler both refuse to move a profile out of it).

Default `lifecycleState` was also added to the two other profile auto-creation fallbacks: the INLINE-stat auto-register in `scanForRollTags()` (`disposable`) and the `OPP_INJURY_PERMANENT=` fallback creator (`active` — a permanent-injury log already implies story significance).

### `npcApplyFate(name, fate)` (~line 3039)

Called from the `COMBAT_END:` handler with the opponent name captured before `endCombat()` nulls `activeCombat`. `fate` is an optional 6th field on `COMBAT_END:` (default `disposed` if omitted — fully backward compatible with every existing `COMBAT_END:` call the AI already makes):
- `disposed` (default) — only deletes the profile if it's still `disposable`; anything already promoted is left alone.
- `killed` → `deceased`.
- `fled` / `captured` / `recurring` → `dormant`.

### New tag `NPC_LIFECYCLE=name,state` (~line 5037 startsWith handler)

For lifecycle changes outside combat resolution (an NPC confirmed dead off-screen, or one who exits a non-combat scene). `state`: `active|dormant|deceased`.

### New tag `RECURRING_RETURN=name,tierBump` (~line 5052 startsWith handler)

Re-rolls a dormant, archetype-generated NPC's stats via `npcGenerateStats(profile.archetypeKey, profile.tier + tierBump, {prodigy: profile.prodigy})`, sets `lifecycleState` back to `active`, increments `returnCount`. The tier-bump is capped at tier 6 (Legendary) for free — `npcGenerateStats()` already clamps its tier argument to 1-6, which is the structural enforcement of the CLAUDE.md §3E apex-ceiling rule (nothing below Transcendent/Abeloth should be generated above Legendary). Only applies to profiles with an `archetypeKey` (i.e. created via `NPC_ROLL=`) — hand-authored canon NPCs (`PROFILE_STATS=`) are never auto-rerolled by this.

### `NPC_ROLL=` flags extended

Fourth field is now a comma-separated flag list instead of a single `prodigy` check — supports `prodigy`, `recurring`, or both (e.g. `NPC_ROLL=Acolyte Thresh|SithInquisitor|3|prodigy,recurring`). `recurring` at generation time starts the profile at `active` instead of `disposable`, for opponents the AI already knows matter beyond one fight.

### Files changed
- `index.html` — `npcApplyFate()`, `NPC_LIFECYCLE=`/`RECURRING_RETURN=` handlers, `COMBAT_END:` fate field, lifecycle defaults on all profile-creation sites, prompt documentation

---

## V145 — 2026-06-17

**Feature: NPC archetype/weighted-stat opponent generation (`NPC_ROLL=` tag)**

### Problem

The AI had to invent every opponent's exact stat numbers by hand via `PROFILE_STATS=`/`INLINE:`, for both one-off mooks and named opponents. This is the first reported source of "AI self-reporting drift" (see V144) and also caused the minor known issue of training droids occasionally getting nonzero Force stats — there was no structural reason they couldn't.

This is step 1 of the larger opponent-lifecycle system discussed but not yet built (temporary vs. recurring NPC sheets, dormant/deceased states, stronger comeback returns capped at the era's apex ceiling). This step only covers stat *generation* — lifecycle state and recurring-return tier bumps are a follow-up.

### `NPC_POOLS` and `NPC_ARCHETYPES` (new consts, ~line 2922)

`NPC_POOLS` mirrors `CC_POOLS`'s shape (`core`/`force`/`saber`/`coreMax`/`forceMax`) but is keyed 1-6 directly on the dueling-tier scale `statToTier()` already uses (1=Untrained...6=Legendary), so a requested tier always lands the generated stats in the tier the combat UI will display. Tier 7 (Transcendent) is intentionally absent — reserved for Abeloth alone per CLAUDE.md §3E.

`NPC_ARCHETYPES` defines nine templates, each a `forceCapable` flag plus relative per-stat weight multipliers (default 1.0 if omitted): `TrainingDroid`, `Mook`, `Soldier`, `Officer`, `TacticalLeader`, `BattleIntel` (all `forceCapable:false` — structurally impossible for these to roll Force stats, fixing the droid-leakage bug at the source instead of patching around it), and `Guardian`/`JediConsular`/`SithInquisitor` (`forceCapable:true`, with core-vs-Force weight tradeoffs matching the examples discussed: Inquisitor/Consular weighted into Force stats at the cost of physical stats, Guardian the reverse, Officer weighted hard into intelligence over physical).

### `npcWeightedDistribute()` and `npcGenerateStats()` (~line 2961)

`npcWeightedDistribute(keys, total, maxPerStat, weights)` is the same random-walk-to-cap shape as `ccAutoDistribute()`'s internal `distribute()`, but each pick is weighted toward higher-weight keys instead of uniform — so an archetype's bias shows up statistically without making every NPC of that archetype/tier an identical clone.

`npcGenerateStats(archetypeKey, tier, opts)` looks up the archetype + tier's pool, distributes core/force/saber points, and returns stats pre-shaped as `{ cat:{key:val} }` — the exact shape `characterProfiles[name].stats` already uses, so a generated profile is immediately usable by `ROLL_OPPOSED ... vs CHARACTER:Name` with no translation step.

**Prodigy flag:** `opts.prodigy` rolls the stat *budget* from one tier higher (clamped at 6) while the returned `tier` field stays at the originally requested value. Callers use `tier` for the narrative rank label; the actual rolled stats (and therefore the tier shown in the combat roll card, which is derived from real stats per V144) come out a tier higher. This represents a talented individual whose formal rank hasn't caught up to their actual capability, as a mechanism separate from and additive to archetype weighting.

### New CHANGES tag: `NPC_ROLL=[name]|[archetype]|[tier 1-6][|prodigy]` (~line 5108 case handler)

Generates the stat block via `npcGenerateStats()` and writes it into `worldState.characterProfiles[name]`. Documented in the prompt alongside `GENERATE_PROFILE=`/`PROFILE_STATS=`, with explicit guidance: use `PROFILE_STATS=` only for canon NPCs with established stats (Malgus, Satele Shan, etc.); use `NPC_ROLL=` for any generic/template opponent so the AI never invents numbers for those.

### Files changed
- `index.html` — `NPC_POOLS`, `NPC_ARCHETYPES`, `npcWeightedDistribute()`, `npcGenerateStats()`, `NPC_ROLL=` case handler, prompt documentation

---

## V144 — 2026-06-17

**Fixes: tier gap consistency, combat round drift, blade color drift — all moved off AI self-reporting onto JS-derived ground truth**

### Problem

Three related combat-display bugs all traced to the same root cause: JS was trusting AI-self-reported numbers instead of deriving them from data JS already has.

1. **Tier gap inconsistency.** `TIER_GAP=` is an AI-declared tag, completely independent of the `oppStats`/`PROFILE_STATS`/`INLINE` block the AI also declares for the same opponent. The two drifted out of sync — roll cards showed "Player=Untrained (Tier 1) | Opponent=Untrained (Tier 1)" alongside "Gap: 1 tier(s) → +4 to player" (contradictory), and on other turns showed no opponent tier at all (`oppTierNum` was `null` whenever the AI happened to send `TIER_GAP=0`, even though real opponent stats were registered).
2. **Combat round drift ("AI one turn behind").** `activeCombat.round` only ever advanced via the AI's `COMBAT_ROUND: rounds` tag. If the AI miscounted or omitted the tag for a turn, the round counter silently froze or skipped, and the "Current Round: N" reminder fed back into context went stale.
3. **Blade color drift ("silver saber").** V143 added the `LIGHTSABER:` canon-color injection to the prompt every turn, but narrative prose still drifted onto other colors ("your silver blade...") after enough turns despite the injected reminder.

### Fix 1 — Tier gap derived from real opponent stats (`fireRoll()`, ~line 9932)

New helper `getOppPrimaryStatValue(oppStats, primaryPath)` looks up the opponent's value for the player's primary roll stat (tries the full dotted path first, then the bare key, to handle both `PROFILE_STATS` and `INLINE` formats).

When `roll.oppStats` has real registered values (`hasOppData`), `tierGap` is now computed as `tier.num - statToTier(oppPrimaryVal).num` — derived straight from the same numbers already shown on the card, so the tiers line and the gap line can never contradict each other again. The AI's `TIER_GAP=` tag (renamed `aiTierGap` internally) is now only used as a fallback for the rare case where no opponent stat block was registered at all (pure-narrative duel).

Opponent tier display (`oppTierNum`/`oppTierLabel`) is now shown whenever real opponent stats exist, even when the gap is 0 — previously it was suppressed any time `tierGap === 0`.

### Fix 2 — Combat round count derived from rolls actually fired (~line 4396, 4474, 4527)

New turn-scoped counter `combatRollsThisTurn`, incremented once per `ROLL_LABEL=` that resolves an opposed roll while `activeCombat` is active (i.e., once per real exchange JS actually processed). The `COMBAT_ROUND:` handler now uses `combatRollsThisTurn` instead of the AI's claimed rounds count whenever it's nonzero.

Added a fallback safety net after CHANGES/SHEET parsing finishes: if `combatRollsThisTurn > 0` but `activeCombat.round` never changed (the AI omitted `COMBAT_ROUND:` entirely), JS calls `updateCombatStrain()` itself so the round counter can't silently freeze.

### Fix 3 — Blade color narrative scrub (`scrubBladeColor()`, ~line 6157)

New regex-based safety net applied to `displayText` right before it's shown to the player and stored into history. Matches `<off-canon color> blade/saber/lightsaber/plasma/edge/glow` (e.g. "silver blade") and replaces just the color word with `characterSheet.lightsaber.color`. Applied to the stored history text too, so a corrected turn doesn't reinforce the wrong color in the AI's own context on subsequent turns.

### Files changed
- `index.html` — all three fixes above

---

## V143 — 2026-06-16

**Feature: Hardcoded lightsaber properties — blade color, type, sensory canon**

### Problem

The AI inconsistently described the lightsaber: correct green plasma one turn, then "silver" the next, or used metallic "clang" sounds when blades clashed. The AI had no authoritative reference for the saber's appearance or sound physics, so it drifted to generic fantasy sword descriptions.

### `characterSheet.lightsaber`

New field: `{ color: 'green', type: 'training' }`. Auto-seeded in `syncMasterXPToSheet()` if missing on load. Persists in the save file and is player-editable from the sidebar.

Supported colors: blue, green, yellow, purple, orange, white, cyan, viridian, red.
Supported types: training, standard, shoto, double-bladed, curved-hilt.

### sheetSummary injection

Added to `buildContext()` after the LIGHTSABER FORMS line — injected every turn:
```
LIGHTSABER: GREEN training saber — blade is ALWAYS green glowing plasma.
Sensory rules: idle=hum/buzz; swing=whoosh; clash=crackling/hissing plasma energy —
NEVER 'clang', 'ring', or metallic impact. Color is NEVER silver/white/other unless changed here.
```

### MASTER_PROMPT: LIGHTSABER SENSORY CANON section

Added before the TONE section. Covers:
- Blade color consistency — must match the injected color every description, no drift
- Sound physics: idle = hum/drone; swing = whoosh/vwoom; clash = crackling/hissing/electric snap, plasma arcing — never metallic
- Training saber specifics: softer snap-hiss, lighter hum, same plasma physics
- Explicit banned sounds: clang, ring, clatter, metallic crash, steel-on-steel, metallic spark shower

### Sidebar: Lightsaber settings panel

Added in `updateCharacterSheet()` after the Lightsaber Forms section. Includes:
- Color swatches (9 colored dots, each with correct hex glow color)
- Type dropdown
- Active color indicator with CSS glow effect
- Inline `onclick`/`onchange` saves to `characterSheet.lightsaber` and calls `autoSave()`

### Files changed
- `index.html` — all above

---

## V142 — 2026-06-16

**Fix: Tier gap player-only + mandatory combat resolution reminder**

### Fix 1 — Tier gap applies only to player

**Problem:** The tier gap bonus was applied symmetrically: if the player was 1 tier below the opponent, the player got −4 and the opponent got +4 (an 8-point swing). This double-penalized the player — the opponent's stats already reflect their skill level; adding a bonus on top compounded it artificially.

**Fix in `fireRoll()`:** Removed `const oppTierGapBonus = -tierGapBonus` and the `oppTierGapBonus` term from `oppTotal_bonus`. The opponent's roll is now purely `oppStatBonus - oppInjBonus`. The tier gap penalty/bonus now affects only the player's roll.

Gap display line simplified from "→ +4 to opponent / −4 to player" to "→ −4 to player" since it no longer affects the opponent.

### Fix 2 — Mandatory combat resolution in per-turn reminder

**Problem:** The LAST EXCHANGE RESULT was injected into the middle of the stateBlock (inside ACTIVE COMBAT STATE) but the AI consistently ignored it and wrote win narrative on loss exchanges.

**Fix:** Added `lastRollReminder` variable appended to the per-turn `reminder` string — the very last text the AI reads before generating its response. Format:
```
⚠ MANDATORY COMBAT RESOLUTION — LAST EXCHANGE RESULT (JS-computed, cannot be ignored):
  "Exploiting Opening — Djem So Thrust" → Dominant loss (margin: -10.09)
  PLAYER LOST. Your response MUST open with the player being outmaneuvered —
  their attack deflected, missed, or failed. DO NOT write the player striking
  successfully, the opponent stumbling back, or any positive outcome.
```
The reminder only appears when `activeCombat.lastRollResult` exists (i.e., when in active combat after at least one exchange).

### Files changed
- `index.html` — both fixes above

---

## V141 — 2026-06-16

**Fix: Deferred combat roll result injection + Roll card improvements + DjemSo normalization + ForceBarrier sub-ability guard**

Six independent fixes covering combat narration accuracy, roll card display, form key normalization, and catalog integrity.

---

### Fix 1 — Combat round counter (V140 work, now committed)

**Problem:** `activeCombat.round` is JS-tracked but was never sent to the AI. The AI counted rounds from unreliable conversation history, causing the `— COMBAT ROUND [N] —` display to drift (sometimes staying at the same round for 3 player turns, sometimes jumping).

**Fix:** Added `ACTIVE COMBAT STATE` injection block to `stateBlock` in `buildContext()`:
```
ACTIVE COMBAT STATE — JS-TRACKED (authoritative, override your own count):
  Opponent: X | Intensity: Y
  Current Round: N ← use this exact number in the "— COMBAT ROUND [N] —" header this turn
  Accumulated strain so far: Physical X, Force Y, Mental Z
```
Added CRITICAL RULE #11: AI must use the injected round number exactly; do not count from history.

---

### Fix 2 — Roll card: opponent tier, gap direction, math breakdown

**Problem (three sub-issues):**
- Roll card showed "Gap: -4 to opponent" when the effect was actually +4 to opponent / -4 to player — direction was backwards and confusing.
- The `tierGapBonus` was applied in the total bonus calculation but never shown as a separate line, making the displayed components not sum to the shown total (e.g. 5.025 + 2.138 + 3 ≠ 6.16).
- Only the player's tier was shown. Opponent tier was invisible.

**Fix in `fireRoll()`:**
- Computed `oppTierNum = Math.max(1, Math.min(7, tier.num - tierGap))` and added opponent tier to the Tiers display line.
- Fixed gap direction text: `tierGap > 0` → "+N to player / −N to opponent"; `tierGap < 0` → "+N to opponent / −N to player".
- Added explicit "Tier gap (player): −N" breakdown line (amber when negative, green when positive) so the math always visibly adds up.

---

### Fix 3 — Form selection: mandatory rule + DjemSo examples in prompt

**Problem:** Both `ROLL_OPPOSED` prompt examples hardcoded `lightsaberForms.ShiiCho`. When the player declared a Djem So attack, the AI copied the example form and sent `ShiiCho` in the tag despite labeling the roll "Djem So Counter Attack" — a direct mismatch.

**Fix (prompt only):** Changed both examples to `lightsaberForms.DjemSo`. Added `FORM SELECTION IS MANDATORY` rule block:
> "The lightsaber form in the ROLL_OPPOSED path MUST match the technique the character is actually executing this exchange. If the ROLL_LABEL says 'Djem So Counter Attack', the path MUST be `lightsaberForms.DjemSo`. Mismatching them is a hard error."

---

### Fix 4 — DjemSo normalization: canonical lookup + overwrite bug

**Problem (two sub-issues):**
- Two DjemSo entries appeared in the sidebar. Root cause: `normalizeKey()` only applied `charAt(0).toUpperCase() + slice(1)`, so `"Djem so"` became `"Djem so"` (already starts with uppercase) or `"Djemso"` (after stripping non-alpha) — neither matched the canonical `"DjemSo"`.
- When two variants (`"DjemSo"` and `"Djemso"`) both existed, the second overwrote the first with `normalized[nk] = Math.max(mxpLevel, sheetLevel)`, losing the higher-XP value.

**Fix in SHEET parse (form normalization block):**
- Replaced free-form `normalizeKey` with a `_FORM_CANON` lookup table (lowercased stripped key → canonical): `djemso → DjemSo`, `shiicho → ShiiCho`, `shiendjem → ShienDjemSo`, `kii → KiiShikk`, etc.
- Applied same normalization to `masterXP.lightsaberForms` keys (not just characterSheet keys) so the XP source is also deduplicated.
- Fixed overwrite bug: `const prevLevel = normalized[nk] || 0; normalized[nk] = Math.max(mxpLevel, sheetLevel, prevLevel)` so multiple colliding entries merge to the highest level rather than last-write-wins.

---

### Fix 5 — ForceBarrier fake sub-ability guard

**Problem:** The AI invented sub-abilities `SelfShield` and `BasicProjection` for `ForceBarrier` and wrote `PROFICIENCY: ForceBarrier.SelfShield` tags. These were stored in `masterXP.forceAbilityProficiency` and displayed in the sidebar even though neither key exists in `FORCE_ABILITY_CATALOG`.

**Fix A — Sidebar display filter** (`updateCharacterSheet()`, force abilities section):
`subEntries` filter now validates that each `pk` has a catalog entry where `FORCE_ABILITY_CATALOG[subKey].par === k`. Entries failing this check are silently excluded from display. Existing invalid proficiency XP in save data is effectively hidden without needing to purge it.

**Fix B — PROFICIENCY: parser guard** (CHANGES block parser):
Before calling `applyProficiencyXP(abilKey, subKey, profXP)`, validates `FORCE_ABILITY_CATALOG[subKey]?.par === abilKey`. If the sub-key is not a catalog-registered child of the parent ability, the tag is silently dropped with `continue`. AI-invented sub-abilities can no longer accumulate XP.

---

### Fix 6 — Deferred combat roll result injection

**Problem (root cause):** The AI generates its full response text (narrative + CHANGES block) in one shot. JS fires `ROLL_OPPOSED` only after parsing the CHANGES block at the end of the response. The AI's narrative was therefore always written blind to the roll result. The AI had no access to the margin, so it defaulted to narrating player victories regardless of the actual outcome — losses were consistently written as wins.

The existing "THE MARGIN IS ABSOLUTE GROUND TRUTH" prompt rules were structurally incapable of fixing this: the AI cannot comply with rules about a number it has not seen.

**Fix (three parts):**

**Part A — `fireRoll()`: store result on `activeCombat`**

After computing the margin and result label for `ROLL_OPPOSED`, stores:
```javascript
activeCombat.lastRollResult = {
  label,                          // roll label string
  margin: round(margin, 2),       // signed float
  winner: 'player'|'opponent'|'contested',
  marginLabel: result             // e.g. "Dominant loss — in serious trouble"
};
```
Persists on `activeCombat` for the duration of combat; updated each exchange.

**Part B — `buildContext()` stateBlock injection**

`ACTIVE COMBAT STATE` block now appends `⚠ LAST EXCHANGE RESULT` when `activeCombat.lastRollResult` exists:
```
⚠ LAST EXCHANGE RESULT (JS-computed after previous response — OPEN THIS RESPONSE by resolving this):
    Roll: "Exploiting Opening — Djem So Thrust" | Dominant loss — in serious trouble (margin: -10.09)
    → PLAYER LOST — narrate the player being outmaneuvered: attack was deflected/missed/failed, the
      opponent controlled the space. DO NOT write the player striking successfully or gaining position.
```
The AI now has the exact result with unambiguous direction at the top of every combat turn.

**Part C — Prompt restructure**

`YOUR ROLE IN ROLLS` section rewritten to describe the deferred model:
> "ROLL tags go in the CHANGES block. JS fires the roll AFTER your response is complete. You cannot know the result when writing the current turn's narrative. Write setup narrative up to the moment of commitment ('Jared drives the thrust—'), fire the roll, end there. The next turn's ACTIVE COMBAT STATE shows LAST EXCHANGE RESULT — open that turn by resolving the previous exchange before addressing the new player action."

`EXCHANGE RESOLUTION` section restructured to reference `LAST EXCHANGE RESULT` from context rather than claiming the AI can observe the margin in real time.

### Files changed
- `index.html` — all 6 fixes above

---

## V139 — 2026-06-15

**Feature: Combat Injury & Pain System**

### Overview

Full injury tracking system for player and opponents. Injuries generate roll penalties, enable Control Pain mitigation, support dark-side pain channeling, and persist across turns. Lost limbs and major organ damage are permanent; minor/moderate wounds auto-clear after 7+ hours.

### Character sheet additions

- `characterSheet.injuries` — array of injury objects: `{id, body, severity, permanent, description, turn}`
- `characterSheet.dominantHand` — `'right'` | `'left'` | `'ambidextrous'` (default: `'right'`)
- `characterSheet.fightingWith` — `'right'` | `'left'` | `'both'` (default matches dominant)
- `characterSheet.painChannelActive` — boolean; dark-side pain-to-power conversion toggle
- `activeCombat.oppInjuries` — combat-local injury array for current opponent (cleared on COMBAT_END)

### Helper functions (before `fireRoll`)

Seven helpers calculate penalties from injury state each roll:

- `getSeverityWeight(severity)` — maps `minor:0.2 / moderate:0.5 / severe:1.0 / critical:1.5 / permanent:1.2`
- `getHPThresholdPenalty(hp)` — flat penalty from HP level: 76+=0, 51-75=−1, 26-50=−2, 11-25=−3, 1-10=−5
- `getBattlemindSuppressionFactor(abilities)` — returns 0.0–1.0 suppression; 0.0 means no penalty, 1.0 = full penalty
- `getWillpowerResistance(wp)` — `max(0, 1.0 − compressedBonus(wp)/5)` (mental fortitude vs pain)
- `calcInjuryPenalties(injuries, statPaths, dominantHand, fightingWith)` — sums severity-weighted penalties per injury matching relevant body parts for the roll; applies off-hand penalty when `fightingWith !== dominantHand` (halved by 50% if Jar'Kai known)
- `calcRollPenalties(characterSheet, statPaths)` — assembles full penalty: HP threshold + injury penalty (reduced by Battlemind suppression and willpower resistance) + pain channel activation flag
- `calcOppInjuryBonus(oppInjuries)` — returns opponent's total injury encumbrance as a positive bonus to player's roll

### `fireRoll` integration

`penCalc = calcRollPenalties(characterSheet, roll.paths)` called each roll. `totalBonus = statBonus + expBonus + tierGapBonus + tactical − penaltyTotal`. Roll card shows HP penalty, injury penalty, off-hand penalty, and pain channel bonus as separate labelled lines when non-zero. Opponent roll reduced by `calcOppInjuryBonus(activeCombat.oppInjuries)`.

### CHANGES block parsers (12 new tags)

| Tag | Effect |
|---|---|
| `INJURY_ADD=body,severity,permanent,description` | Adds player injury; `permanent=true\|false` |
| `INJURY_HEAL=id` | Removes player injury by ID |
| `INJURY_HEAL_ALL` | Clears all non-permanent player injuries |
| `STORY_HEAL=id` | Removes permanent injury (surgery/Force healing story event only) |
| `OPP_INJURY_ADD=body,severity,permanent,description` | Adds injury to activeCombat.oppInjuries |
| `OPP_INJURY_HEAL=id` | Heals opponent combat-local injury |
| `OPP_INJURY_HEAL_ALL` | Clears all opponent injuries |
| `OPP_INJURY_PERMANENT=id` | Promotes opponent injury to permanent (goes to their profile on combat end) |
| `DOMINANT_HAND=right\|left\|ambidextrous` | Sets character dominant hand |
| `FIGHTING_HAND=right\|left\|both` | Sets active fighting hand |
| `PAIN_CHANNEL=true\|false` | Toggles dark-side pain channeling |
| `COMBAT_END_CRASH` | Fires Battlemind/ForceValor crash: drops HP by 30% of suppressed damage, spikes physical strain |

### Control Pain FS cost (in `updateCombatStrain`)

Each active-combat round with injuries: `floor(severitySum × mitigationPct × 3.0 × max(0.10, 1.0 − (level/100) × 0.80))` where `mitigationPct = min(1.0, controlPainLevel / 100)` and `severitySum` = sum of `getSeverityWeight` for each active injury.

### Auto-clear minor injuries

When SHEET parse detects `turnElapsedHours >= 7`, all non-permanent `minor` and `moderate` severity injuries are removed automatically (bacta/rest healing).

### Protected fields

Snapshot before SHEET parse / restore after: `_savedInjuries`, `_savedDominantHand`, `_savedFightingWith`, `_savedPainChannel` (same pattern as `_savedInnateTalents`).

### Context injection

`sheetSummary` in `buildContext()` now includes two new lines after FORCE BARRIER:
- `INJURY STATE: [count] injuries | dominant: right | fighting: right | pain-channel: off`
- `ACTIVE OPPONENT INJURIES: [list or 'none']`

`updateCharacterSheet()` shows injury cards with severity-color coding and HP threshold label.

### ControlPain in FORCE_ABILITY_CATALOG

Added as `Body` family, `par:null`, `D:2.5`, `align:'neutral'`, anchors `['forceControl','meditation']`, prereqs `{forceControl:25, meditation:20}`.

### Files changed
- `index.html` — all implementation above
- `Docs/SW_Injury_System_v1.md` — design reference doc (committed in prior version)

---

## V138 — 2026-06-15

**Fix: Opponent stats changing mid-combat when AI re-generates INLINE values**

### Problem

In a multi-turn combat, the Mark IV training droid had `ShiiCho(45)/strength(40)/agility(50)` on the first exchange and then dropped to `ShiiCho(30)/strength(35)/agility(32)` the very next turn. The AI had narrated the droid as "damaged" after a Force Push and then re-generated lower INLINE stats to reflect that — causing the roll card to show a fundamentally different opponent.

Root cause: `ROLL_OPPOSED ... vs INLINE:ShiiCho=45,...` passes stats directly in the tag. The AI re-writes this line every turn with whatever values it thinks are appropriate. There was no mechanism to lock the opponent's stat block once established. JS just parsed whatever INLINE values it saw on each turn independently.

### Fix

**INLINE: stats are now auto-registered to `worldState.characterProfiles` on first use in an active combat:**

When JS processes `ROLL_OPPOSED ... vs INLINE:` and `activeCombat` is active with a named opponent:
1. `scanPending.oppName` is set to `activeCombat.opponent` (the name from `COMBAT_START:`) instead of the generic `'Opponent'`
2. If `worldState.characterProfiles[opponentName]` already has stats, those stored stats are used — the AI's new INLINE values are completely ignored
3. If no profile stats exist yet (first roll), the INLINE stats are parsed AND immediately saved to the profile for future rounds

This means: the first ROLL_OPPOSED in an encounter locks the opponent's stats. Every subsequent INLINE: line for the same combatant is silently replaced with the locked values. Damage and fatigue are narrative — the stat block is immutable for the duration of the combat.

**Prompt rule added:** "OPPONENT STAT CONSISTENCY: Once you write INLINE: stats for an opponent, JavaScript locks those values for the entire combat — do NOT change INLINE values in later rounds to reflect 'damaged' or 'fatigued' state."

### Files changed
- `index.html` — INLINE: handler in `scanForRollTags()` rewritten to use `activeCombat.opponent` as name, check/write profile stats; prompt rule added under ROLL_OPPOSED instructions

---

## V137 — 2026-06-15

**Fix: Phantom strain accumulation on non-training turns**

### Problem

Force strain (and physical/mental strain) kept increasing on turns with no training or combat — e.g., walking to breakfast, eating a meal, or having a conversation. A character at 88 force strain would reach 90+ on the next narrative turn and 100 the turn after, solely from carry-over.

Three separate code paths were contributing:

1. **CHANGES block handlers** — `FORCE_STRAIN=`, `PHYSICAL_STRAIN=`, `MENTAL_STRAIN=` use a delta-based calculation against the current value. The AI, still "thinking about" the previous turn's training session, writes a slightly higher value (e.g., `FORCE_STRAIN=92` when current is 88). Delta = 4, endurance-mitigated to ~3.2, applied. Next turn same thing. Strain snowballed toward 100 over 2–3 turns.

2. **Narrative parsers running on full rawText** — The arrow-format regex (`Force Strain: X → Y`) and triple-format regex ran on `rawText` which includes the SHEET and WORLD JSON blocks. Any matching pattern in those blocks could re-apply strain values.

3. **Wrong maxPS/maxMS defaults** — `characterSheet.maxPhysicalStrain || 10` and `characterSheet.maxMentalStrain || 10` in the narrative parsers (should be 100). Values above 10 would fail the `val <= max` guard and not update, but values ≤ 10 could incorrectly set strain to very low numbers.

### Fix

**`_hasStrainActivity` pre-scan (primary fix):**
Added pre-scan of the CHANGES block immediately after `changesMatch` is extracted. Sets `_hasStrainActivity = true` if any of `TRAINING:`, `COMBAT:`, `COMBAT_ROUND:`, or `COMBAT_START:` appear in the block. The pre-scan uses the already-extracted `changesMatch[1]` so no extra regex on rawText.

In all three strain handlers (`FORCE_STRAIN`, `PHYSICAL_STRAIN`, `MENTAL_STRAIN`): if `_rawDelta > 0 && !_hasStrainActivity`, the handler breaks immediately without applying the increase. Recovery (negative delta) still works normally on rest/sleep turns.

**Narrative parsers restricted to narrative text:**
Changed `const rt = rawText` to extract only text before `<<<CHANGES>>>`:
```javascript
const _narrativeEnd = rawText.indexOf('<<<CHANGES>>>');
const rt = _narrativeEnd > 0 ? rawText.slice(0, _narrativeEnd) : rawText;
```

**Fixed wrong defaults:**
`maxPhysicalStrain || 10` → `|| 100`, `maxMentalStrain || 10` → `|| 100`.

**Prompt rule (rule 6 rewrite):**
Replaced the vague "if strain changed this turn, update it" rule with an explicit prohibition: strain values must be copied exactly from context on turns with no training/combat/Force use. Warns that carry-over from a previous turn is already processed by JS and writing a higher value double-applies it.

### Files changed
- `index.html` — `_hasStrainActivity` pre-scan + guard in all three strain CHANGES handlers; narrative parser `rt` scoped to pre-CHANGES text; `maxPS`/`maxMS` defaults fixed to 100; prompt rule 6 rewritten

---

## V135 — 2026-06-13

**Design: Force Choke line split into neutral grip branch and dark wound branch**

### Change

The single linear dark-side chain `ForceWound → ForceChoke → ForceGrip → ForceCrush → ForceRend` has been split into two separate branches off Telekinesis.

**Dark line (intent to harm living tissue):**
- `ForceWound` (dark, Telekinesis:21, darkSide:1) → `ForceRend` (dark, ForceWound:30, darkSide:60)
- ForceRend re-parented from ForceCrush to ForceWound — it is the lethal endpoint of harmful intent, not the crushing-machinery endpoint.

**Neutral line (telekinetic grip):**
- `ForceChoke` (neutral, Telekinesis:21, ForceControl:10) → `ForceGrip` (neutral, ForceChoke:15) → `ForceCrush` (neutral, ForceGrip:21)
- No dark side prereqs anywhere in this chain.

### Rationale

Force Choke, Force Grip, and Force Crush are telekinetic grip techniques documented in Legends canon as used by both Jedi and Sith. Anakin, Luke, and others have applied them without it being categorized as an inherently dark-side act. The moral weight comes from application and intent, not the ability itself.

Force Wound and Force Rend remain dark side — Force Wound is specifically the application of telekinesis to damage living tissue, and Force Rend is lethal destruction. No Jedi in canon are documented using these.

### Alignment system note

The neutral classification removes the hard prerequisite gate (no longer requires dark side alignment to learn). It does not remove alignment consequences from *use* — the AI's alignment system still generates `DARK_PRESSURE` from choking a prisoner; it just no longer does so for choking a droid or using Force Crush on machinery.

### Files changed
- `index.html` — FORCE_ABILITY_CATALOG entries for ForceWound, ForceChoke, ForceGrip, ForceCrush, ForceRend; FORCE_ABILITY_RULES Telekinesis subs list updated to show both branches
- `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md` — section rewritten to document the two branches separately with updated prerequisites and alignment notes

---

## V132 — 2026-06-13

**Fix: Combat outcome narration must match the roll margin**

### Problem

The AI was narrating combat exchanges as player successes regardless of the `ROLL_OPPOSED` margin result. Screenshots showed "Margin: Opponent by 4.19 — Clear loss," "Opponent by 23.99 — Overwhelming loss," and "Opponent by 10.86 — Dominant loss" while the narrative described the player cornering the droid, executing Pressure Steps effectively, and receiving approving nods from Master Denko.

Root cause: the rule "Never ignore the roll result in your prose" (line ~2014) existed only in the training/outcome section (`NARRATIVE RULES FOR OUTCOME FRAMING`). The combat `EXCHANGE RESOLUTION` section had no equivalent binding rule — it said "Winner describes the exchange narratively" but never defined what the narrative must look like when the player *loses*.

### Fix (prompt-only)

Added `THE MARGIN IS ABSOLUTE GROUND TRUTH — THE NARRATIVE MUST MATCH, NO EXCEPTIONS` block to the `EXCHANGE RESOLUTION` section:

- Positive margin → player's action succeeded, narrate accordingly
- Zero → contested, neither side gained
- Negative margin → **THE PLAYER LOST THIS EXCHANGE** — explicit NEVER rules: never show the player's strike landing, never show the opponent being cornered or forced back on a negative margin
- Per-tier loss narrative requirements: Narrow (1–3) / Clear (4–7) / Dominant (8–12) / Overwhelming (13+), each with concrete narrative description
- Force abilities mid-combat: Battlemind being active increases the roll bonus but does not guarantee a win — if margin is still negative, narrate as active but insufficient

Also hardened `FAILURE CONSEQUENCES`: now requires showing the loss in the narrative before listing the mechanical consequence. Previous version listed strain/injury consequences without mandating the loss be depicted first.

---

## V133 — 2026-06-13

**Fix: ROLL_OPPOSED mandatory for every combat exchange without exception**

### Problem

The AI skipped the `ROLL_OPPOSED` tag entirely for a combat exchange when the narrative context appeared to make the outcome obvious (opponent cornered, player pressing advantage). The text showed the player attacking and the droid being overwhelmed with no roll card at all.

The existing `ALWAYS ROLL` list in `WHEN TO ROLL — MANDATORY TRIGGERS` included "Any action explicitly opposed by another character" but this was vague enough that the AI treated apparent narrative momentum as a reason to narrate without rolling.

### Fix (prompt-only)

Added explicit bullet to `ALWAYS ROLL`:

> **EVERY combat exchange, no exceptions.** Even if the opponent appears cornered, outmatched, or on the defensive — the roll still happens. The narrative never makes a roll unnecessary. Skipping a combat roll and narrating the outcome directly is always wrong.

---

## V134 — 2026-06-13

**Feature: Situational tactical modifiers table for combat rolls**

### Problem

When a player had a genuine positional advantage (opponent cornered, surprise attack, sustained momentum), the AI had two wrong responses: (a) narrate the advantage as a guaranteed win without rolling, or (b) roll with `TACTICAL=0` and then ignore a negative margin. There was no guidance on encoding positional advantages into the roll mathematics.

### Fix (prompt-only)

Added `SITUATIONAL TACTICAL MODIFIERS` section after the form counter bonuses table. Key principle stated explicitly:

> Positional/situational advantages encode into TACTICAL= — they are never a reason to skip a roll or override the result. A cornered opponent doesn't mean the player automatically wins. It means the player rolls with a bonus. The dice still decide.

**Player advantage table (positive TACTICAL):**

| Situation | TACTICAL |
|-----------|----------|
| Opponent cornered / back to wall | +2 |
| Opponent cornered + restricted movement | +3 |
| Surprise attack / blindside | +3 |
| Ambush / full initiative | +4 |
| Sustained momentum (3+ consecutive wins) | +1 |
| Opponent visibly injured / impaired | +2 |
| Opponent high strain | +1 |
| Environmental high ground / terrain advantage | +1 |

**Player disadvantage table (negative TACTICAL):**

| Situation | TACTICAL |
|-----------|----------|
| Player off-balance / mid-motion | -2 |
| Recovering from hit last exchange | -2 |
| High strain (60+) | -1 |
| Critical strain (80+) | -3 |
| Patterns read by opponent | -1 |
| Outnumbered / split attention | -2 |
| Environmental hazard affecting player | -1 to -2 |
| Technique at/above tier ceiling mid-combat | -2 |

Stacking rule: sum all situational modifiers + form counter bonuses, declare combined value in `TACTICAL=`. JS hard-cap of ±5 remains enforced.

---

## V129 — 2026-06-12

**Feature: Four innate talent effects in sim — UnbreakableSpirit, IronMind, NaturalTelekineticBurst, BattleMeditationAffinity**

### Problem

Four innate talents listed in the talent grid and XP reference had no mechanical effect in the simulation panel. `simGetStrainPenalty()` and `addStrain()` were talent-blind; `applyTalentXPMultiplier()` had no BattleMeditationAffinity case.

### Fixes

**1. UnbreakableSpirit (`simGetStrainPenalty`)**

At the `w > 90` threshold, check `talents.includes('UnbreakableSpirit')`:
- Without talent: return 0.1 (existing behaviour)
- With talent: return 0.3 (penalty floor raised — spirit pushes through extreme strain)

**2. IronMind + NaturalTelekineticBurst + BattleMeditationAffinity (`addStrain`)**

Extended `addStrain` signature from `(hours, intensity, bias, isRecovery)` to `(hours, intensity, bias, isRecovery, forceFam, abilKey)`:

```javascript
const addStrain = (hours, intensity, bias, isRecovery, forceFam, abilKey) => {
  if (isRecovery) return;
  const talents = characterSheet?.innateTalents || [];
  const iMult = SIM_INTENSITY_STRAIN_MULT[intensity] || 1.0;
  const fFamMult = (forceFam === 'TK' && talents.includes('NaturalTelekineticBurst')) ? 0.8 : 1.0;
  const bmMult   = (abilKey  === 'BattleMeditation' && talents.includes('BattleMeditationAffinity')) ? 0.6 : 1.0;
  const mMult    = talents.includes('IronMind') ? 0.8 : 1.0;
  f += hours * SIM_STRAIN_BASE.f * iMult * (bias.f||1) * (1 - em * 0.5) * fFamMult * bmMult;
  p += hours * SIM_STRAIN_BASE.p * iMult * (bias.p||1) * (1 - em);
  m += hours * SIM_STRAIN_BASE.m * iMult * (bias.m||1) * (1 - em * 0.3) * mMult;
};
```

The training-rows call site passes `act.forceFam` and `act._dynForceAbility || act.coveredAbility || ''`. The mandatory-rows call site is left without these args (mandatories are saber/meditation/knowledge — none are TK or BattleMeditation).

`telekinesis_basic` (hardcoded activity) gained `forceFam: 'TK'` so NaturalTelekineticBurst fires on it.

Dynamic force-ability activities (`dynActs.push`) gained `forceFam: cat.fam` so every dynamically-generated activity carries its catalog family.

**3. BattleMeditationAffinity XP (`applyTalentXPMultiplier`)**

Battle Meditation Affinity gives 70% cost reduction. In our system XP is added as earned (not as cost), so we convert: `xp = Math.round(xp / 0.3)` (equivalent to ×3.33 multiplier). Added as a new case after ForceSensitiveHealer.

---

## V128 — 2026-06-12

**Feature: Momentum window XP application + proficiency trickle-back**

### Problem 1 — Momentum window stored but never applied

`characterSheet.momentumWindow` was parsed and stored correctly (via the `MOMENTUM_WINDOW=` startsWith handler added in V111) and expired day-by-day in `advanceDay()`. But nowhere was the multiplier actually applied to XP. Every TRAINING:, COMBAT:, PROFICIENCY:, XP: call, and `endCombat()` went through `applyXPToSheet` / `applyProficiencyXP` which had no momentum awareness.

### Fix 1

Added `applyMomentumToXP(xp)` helper:

```javascript
function applyMomentumToXP(xp) {
  if (!characterSheet?.momentumWindow?.active) return xp;
  return Math.round(xp * (characterSheet.momentumWindow.multiplier || 1.0));
}
```

Applied at exactly six real-turn XP call sites:
1. TRAINING: sub-ability branch
2. TRAINING: main branch
3. COMBAT: primary and secondary (via `_cp`/`_cs` rename to avoid collision)
4. PROFICIENCY: branch
5. XP: branch
6. `endCombat()` primary + secondary

The simulation panel calls `applyXPToSheet` and `applyProficiencyXP` directly — bypasses `applyMomentumToXP`, which is correct (sim XP should not be momentum-amplified).

### Problem 2 — Proficiency trickle-back missing

The forward direction (base ability training → +5% trickle to each unlocked sub-ability proficiency) was already implemented via `profTrickleFromBase()`. The reverse direction (sub-ability proficiency training → 20% trickle back to base ability) was completely absent.

### Fix 2

Added one line at the end of `applyProficiencyXP()`, after `deriveProficiency()` computes the new state:

```javascript
// 20% trickle-back to base ability
const trickleBack = Math.round(rawXP * 0.20);
if (trickleBack > 0) applyXPToSheet('forceAbilities.' + abilityKey, trickleBack);
```

Cascade check: `applyXPToSheet` calls `profTrickleFromBase` which writes directly to `entry.totalProfXP` — not through `applyProficiencyXP`. So the cascade is: sub → base (20%) → sub (5% of 20% = 1%) — negligible and non-recursive.

### Docs update

`Docs/SWRPG_XP_System_Reference.md` §11 Innate Talents:
- BladeIntuition: changed from "5 bonus levels at creation" → "All lightsaber form XP ×1.3"
- ForceReservoir: new row added — "forceStats.forceOutput XP ×1.3"

---

## V127 — 2026-06-11

**Feature: Tier-based XP scaling + roll threshold recalibration**

### Tier-based XP scaling

**Problem:** Training XP was flat regardless of skill level. Throwing boulders as a master awarded the same base XP as a youngling doing basic Force Push at the same intensity/difficulty/outcome. This made sense mechanically (the XP curve is exponential) but felt wrong narratively.

**Fix:** Added `statLevelToTierMult(level)` returning a multiplier by tier band:

| Tier | Level | Multiplier |
|---|---|---|
| Initiate | 0–20 | ×1.0 |
| Padawan | 21–40 | ×1.2 |
| Knight | 41–60 | ×1.5 |
| Master | 61–80 | ×2.0 |
| Grandmaster | 81–100 | ×2.7 |
| Legendary | 101+ | ×3.5 |

Added `getStatLevelForPath(statPath)` that prefers `masterXP` (authoritative) over raw `characterSheet` values for level derivation. Both `calcTrainingXP()` calls in the TRAINING: handler now pass the relevant stat level as the 5th argument. Sub-ability redirects use the parent ability's level (not the sub-ability's, which has no base-XP track).

This does NOT fully offset the exponential XP curve — progression still gets meaningfully harder at higher tiers. It just reflects that harder actions inherently yield more raw XP.

### Roll threshold recalibration

**Problem:** The solo roll thresholds in `fireRoll()` (Fail<9 / Contested 9-12 / Solid 13-17 / Strong 18-22 / Overwhelming 23+) were miscalibrated relative to both the training outcome tables and the master prompt's roll interpretation scale.

**Fix:** Updated to: Fail<8 / Contested 8-11 / Solid 12-16 / Strong 17-20 / Overwhelming 21+

These align with:
- The CEILING training outcome table (Fail<8, Partial 8-11, Solid 12-16, Strong 17-20, Overwhelming 21+) — confirmed correct reference distributions at stat ~30 and ~60
- The master prompt's margin-based scale (≤1 Contested / 2-3 Solid / 4-6 Strong / 7+ Overwhelming) applied against a DC of ~10

Updated in three places: threshold display string, result if-else chain, `lastRoll.result` ternary. Prompt reference line updated to match.

---

## V126 — 2026-06-11

**Fix: Phantom training XP in social/narrative turns + multiple roll cards per session**

### Root Cause 1 — Phantom training XP appearing in non-training turns

The AI was inserting TRAINING: tags in turns where the player did nothing related to training (e.g., "joining friends for breakfast"). The prompt did not clearly forbid carry-over XP from the previous session into the current turn.

Added explicit rule: TRAINING: tags represent work done **in the current turn only**. If the player spent the previous turn training and this turn is purely social/narrative, write zero TRAINING: tags.

### Root Cause 2 — Session decomposition (multiple roll cards per session)

For a single training session like "30 minutes of Force Push isolation practice", the AI was generating multiple ROLL:/ROLL_LABEL= pairs (Force Push Drill First, Force Push Drill Second, Integration Drill, etc.), creating 3-4 roll cards for what is one activity.

Added explicit rule with example: ONE ROLL PER TRAINING SESSION. The narrative can describe multiple exercises — the mechanics track the session as a unit. Added the example "30 minutes of Force Push isolation practice = ONE roll card + ONE TRAINING: + ONE PROFICIENCY: line."

---

## V125 — 2026-06-11

**Fix: People tab NPCs wiped on every AI response**

### Root Cause

`handleResponse()` parsed the AI's `<<<WORLD>>>` block with a full overwrite:

```javascript
worldState = JSON.parse(worldMatch[1].trim());
```

The AI's WORLD JSON only contains narrative fields (`location`, `inGameDate`, `currentScene`, `sceneNPCs`). It never includes `trackedCharacters`, `characterProfiles`, `npcAgendas`, `pendingEvents`, `storyFlags`, `worldLog`, or any of the other JS-managed arrays. After the overwrite those fields are `undefined`; `normalizeWorldState()` then re-initialises them as empty arrays/objects, silently discarding all accumulated data.

This happened on **every single AI turn**, including the turns immediately after simulation completes. The People tab appeared to clear "after simulating" because that's when the user noticed, but the bug fired on every response.

### Fix

Snapshot all JS-managed fields before the parse and restore them unconditionally after (lines ~4114–4153):

```javascript
const savedTracked       = worldState?.trackedCharacters  ? [...worldState.trackedCharacters]  : [];
const savedProfiles      = worldState?.characterProfiles  ? {...worldState.characterProfiles}  : {};
const savedInteractions  = worldState?.interactionWeights ? {...worldState.interactionWeights} : {};
const savedNpcAgendas    = worldState?.npcAgendas         ? {...worldState.npcAgendas}         : {};
const savedPendingEvents = worldState?.pendingEvents      ? [...worldState.pendingEvents]      : [];
const savedWorldLog      = worldState?.worldLog           ? [...worldState.worldLog]           : [];
const savedGalaxyQueue   = worldState?.galaxyEventQueue   ? [...worldState.galaxyEventQueue]   : [];
const savedGalaxyEvents  = worldState?.galaxyEvents       ? [...worldState.galaxyEvents]       : [];
const savedLegacyChanges = worldState?.legacyChanges      ? [...worldState.legacyChanges]      : [];
const savedLineageRecord = worldState?.lineageRecord      ? [...worldState.lineageRecord]      : [];
const savedStoryFlags    = worldState?.storyFlags         ? {...worldState.storyFlags}         : {};
const savedGalaxyState   = worldState?.galaxyState        ? {...worldState.galaxyState}        : {};
// ... parse ...
worldState.trackedCharacters = savedTracked;
// ... restore all 12 fields ...
```

The AI WORLD JSON now only controls what it legitimately owns: `location`, `inGameDate`, `inGameTime`, `currentScene`, `sceneNPCs`, and other narrative state. None of the JS-managed state can be affected by what the AI writes or omits.

---

## V124 — 2026-06-11

**Fix: Sub-ability proficiency XP not registering (Force Push training showing 0 XP)**

### Root Cause

Three separate gaps in the sub-ability proficiency system:

**Root Cause 1 — Sub-abilities stored in `forceAbilities` as level-0 entries.**
The SHEET JSON parse filter at line ~5010 accepted any key present in `FORCE_ABILITY_CATALOG`:
```javascript
if (canon in FORCE_ABILITY_CATALOG) out[canon] = v;
```
Sub-abilities (`par !== null`, e.g. ForcePush, ForcePull, ForceWave) are catalog entries but should never be stored in `forceAbilities` — they are tracked exclusively in `forceAbilityProficiency`. The AI writes them into SHEET JSON as `"ForcePush": 0`, which created spurious level-0 entries in the sidebar.

**Root Cause 2 — TRAINING: on sub-ability key was a silent no-op or worse.**
If the AI wrote `TRAINING: forceAbilities.ForcePush, ...`, `applyXPToSheet` would seed and increment `masterXP.forceAbilities.ForcePush` — a phantom XP track that has no effect on proficiency and produces no visible result.

**Root Cause 3 — AI consistently omits the PROFICIENCY: tag.**
The prompt said the PROFICIENCY: tag was "MANDATORY" but buried the instruction as a sub-bullet. The 5% trickle from base ability training (~1 XP/session) is too small to matter (moving from 20% to 21% costs ~59 XP at D=1.0), so without an explicit PROFICIENCY: tag the player sees effectively zero progress on sub-abilities.

### Fixes

**Fix 1 — SHEET parse filters sub-abilities (line ~5010):**
```javascript
// before
if (canon in FORCE_ABILITY_CATALOG) out[canon] = v;
// after
if (canon in FORCE_ABILITY_CATALOG && FORCE_ABILITY_CATALOG[canon].par === null) out[canon] = v;
```

**Fix 2 — TRAINING: handler redirects sub-ability keys to proficiency (lines ~4273–4287):**
Added a guard before the normal `applyXPToSheet` path. If `parts[0]` is `forceAbilities.X` and `FORCE_ABILITY_CATALOG[X].par` is set, the XP is routed to `applyProficiencyXP(parentKey, subKey, rawXP)` instead.

**Fix 3 — Prompt PROFICIENCY: rule rewritten (lines ~1770–1781):**
- Added a concrete xpAmount scale (0.5hr casual=8, 0.5hr intense=13, 1hr standard=15, 1hr intense=20, 1hr overwhelming=30)
- Mandatory paired-lines pattern shown with a ForcePush example directly inline
- Explicit statement: "missing PROFICIENCY: means ZERO sub-ability XP"

---

## V123j — 2026-06-11

**Three engine improvements: sim drill UX, sim activity grouping + full-catalog coverage, canonical ability enforcement**

### 1. Drill editor — secondary skills + edit mode

**Problem:** Custom drill creation only allowed a single primary skill with no way to edit saved drills.

**Fix:**
- Drill form now has a "Secondary Skills" section with an **+ Add** button. Each secondary row has a stat dropdown (same options as primary) and a weight selector (Low 0.25 / Med 0.5 / High 0.75 / Full 1.0). Any number of secondaries can be added; each has an ✕ to remove it.
- Each drill card now shows an **Edit** button that populates the form from the saved drill, switches the save button to "Update Drill", and shows a "Cancel Edit" link.
- Deleting a drill that is currently being edited cancels the edit state first.
- Drill cards now show a skill summary line (primary bolded, secondaries with their weight).
- New functions: `simAddSecondaryRow`, `simUpdateSecondariesEmpty`, `simResetDrillForm`, `simCancelEdit`, `simEditDrill`. Updated: `simSaveDrill`, `simDeleteDrill`, `simRenderDrills`.
- New state variable: `simEditingDrillId`.

### 2. Simulation activity dropdown — category grouping + full force-ability catalog coverage

**Problem:** The activity dropdown was a flat unsorted list. Battlemind and most other force abilities were absent. Sub-ability proficiency activities appeared regardless of whether prerequisites were met.

**Root Cause 1 — No category grouping.** `simAddTrainingRow` built a flat `<option>` list. The XP injector uses `<optgroup>` elements but the sim panel did not.

**Root Cause 2 — No dynamic force ability generation.** `SIM_ACTIVITIES` only had a handful of hardcoded entries (Telekinesis, shatterpoint). Any ability the character had unlocked that wasn't hardcoded (Battlemind, ForceBarrier, ForceJump, MindTrick, etc.) was invisible in the sim panel.

**Root Cause 3 — No prereq check on sub-ability proficiency entries.** The proficiency activity generator only checked `cat.par in cs.forceAbilities` (parent exists at all), not whether the sub-ability's actual prereqs were met.

**Root Cause 4 — `SIM_ACTIVITIES.find` used in strain/XP calc functions.** `simCalcMeditationRecovery`, `simCalcDailyStrain`, and `simCalcDailyXP` called `SIM_ACTIVITIES.find` directly, so dynamically generated activities (dynamic force abilities, proficiency tracks) never received strain or XP calculations.

**Fixes:**

- Added `cat` field to every `SIM_ACTIVITIES` entry: `'saber'`, `'force_stat'`, `'force_ability'`, `'physical'`, `'academic'`.
- Added `coveredAbility:'Telekinesis'` to the hardcoded telekinesis entry so the dynamic generator knows it's already covered.
- Added `ANCHOR_TO_SIM_PATH` constant — maps catalog anchor keys (`forceControl`, `meditation`, etc.) to full stat paths.
- Added `FAM_STRAIN_BIAS` constant — default strain bias by force ability family (TK, Sensory, Body, Mental, Defense, Healing, Light, Dark, SpaceTime, Nature, Arcane, SithAlchemy, Misc).
- Added `simCheckPrereqs(prereqs, cs)` — evaluates a catalog prereq object against live character stats, handling `darkSide`, `lightSide`, `anySaberForm`, ability-level, and force/core stat prereqs.
- `simBuildActivityOptions` now dynamically generates a `cat:'force_ability'` entry for every root ability (par:null) in `FORCE_ABILITY_CATALOG` that the character has in `cs.forceAbilities` and is not already covered by a hardcoded entry. Weights are built from catalog anchors (primary anchor w:0.5, secondary w:0.3). Strain bias comes from `FAM_STRAIN_BIAS[cat.fam]`.
- Proficiency activity generation now calls `simCheckPrereqs(cat.prereqs, cs)` and skips sub-abilities whose prerequisites aren't met.
- `simAddTrainingRow` now builds `<optgroup>` sections in order: Lightsaber Forms → Force Stats → Force Abilities → Physical Training → Academic / Study → Custom Drills → Sub-Ability Proficiency.
- Replaced the three `SIM_ACTIVITIES.find` calls in strain/XP calc functions with `simBuildActivityOptions(cs).find` so dynamic activities are fully processed.

### 3. Canonical force ability enforcement — block AI-invented ability names

**Problem:** The AI used a descriptive name ("Force Fortitude") for Battlemind, creating a non-catalog key in `characterSheet.forceAbilities` and `masterXP.forceAbilities`. This key has no XP curve, no sim activity, and no catalog entry — its XP is effectively orphaned.

**Root cause:** No validation prevented non-catalog keys from being written by the AI into the SHEET block, and no prompt rule required canonical keys.

**Fixes:**

- Added `FORCE_ABILITY_ALIASES` constant — maps known AI-invented names to their canonical catalog keys (`ForceFortitude` → `Battlemind`, `BattleMind` → `Battlemind`, etc.). Add new entries here as they are discovered.
- Added `repairForceAbilities()` — iterates `characterSheet.forceAbilities` and `masterXP.forceAbilities`; renames aliased keys (merging XP if the canonical key already exists), drops all non-catalog keys. Called on every save load alongside `repairTalentConsistency`.
- Added inline filter at the SHEET JSON parse point (`forceAbilities` extraction): incoming keys are aliased and non-catalog keys are dropped before `characterSheet.forceAbilities` is updated. Existing abilities are preserved if the filter produces an empty result.
- Added prompt rule under "CANONICAL ABILITY KEYS — NEVER INVENT NEW NAMES": all `forceAbilities` keys in SHEET JSON and all `TRAINING: forceAbilities.Key` tags must exactly match a catalog key; non-catalog keys are stripped by the engine. Includes the Battlemind/ForceFortitude example explicitly.

---

## V123f — 2026-06-11

**Fix: NPC People panel — characters never appeared despite interactions**

### Root Cause

**Root Cause 1 — `isNaN(val) continue` guard killed all string-valued CHANGES tags.**

At line 4430 (pre-fix), immediately before the `switch(key)` block, the parser ran:

```javascript
if (isNaN(val)) continue;
```

`val` was set at line 4384 as:
```javascript
const val = isNaN(rawVal) ? rawVal : parseFloat(rawVal);
```

So for a tag like `KNOWN_PERSON=Ngani Zho|Jedi Master|Mentor|...`, `rawVal = "Ngani Zho|Jedi Master|..."`, `val = "Ngani Zho|..."` (the string), `isNaN(string) = true` → `continue` → the switch was entirely skipped. Every string-valued switch case was dead code:

- `KNOWN_PERSON` — never ran
- `INTERACTION` — never ran
- `GENERATE_PROFILE` — never ran
- `PROFILE_STATS` — never ran
- `PENDING_EVENT` — never ran
- `NPC_AGENDA` — never ran
- `RESOLVE_EVENT` — never ran
- `RESOLVE_NPC_AGENDA` — never ran
- `SCENE_NPCS` — never ran
- `GALAXY_EVENT` — never ran
- `SHATTERPOINT_PERCEIVED` — never ran
- `SHATTERPOINT_ROLL` — never ran
- `SHATTERPOINT_FOCUS_CLEAR` — never ran
- `SHATTERPOINT_MISREAD_RESOLVED` — never ran

**Root Cause 2 — `INTERACTION` threshold reached but `trackedCharacters` never seeded.**

Even if the INTERACTION tag had run, the People panel `renderCharactersPanel()` only reads `worldState.trackedCharacters`. The `INTERACTION` case wrote to `worldState.characterProfiles[name].visibleInPeople = true` but never added a corresponding entry to `trackedCharacters`. The two systems were disconnected.

### Fixes Applied

**Fix 1 — Removed the blanket `isNaN(val) continue` guard; added per-case numeric guards.**

Removed:
```javascript
// Regular stat fields
if (isNaN(val)) continue;
switch(key) {
  case 'HP': characterSheet.hp = val; break;
  ...
```

Replaced with per-case `if (isNaN(val)) break;` guards in all numeric-only cases: `HP`, `FORCE_STRAIN`, `PHYSICAL_STRAIN`, `MENTAL_STRAIN`, `FORCE_BARRIER`, `SHATTERPOINT_FOCUS`, `SHATTERPOINT_XP`, `DARK_PRESSURE`, `SURRENDER_DISCOUNT`. String-valued cases already use `trimmed.slice(N)` and are unaffected.

**Fix 2 — Bridged INTERACTION → `trackedCharacters` when weight threshold is hit.**

In the `INTERACTION` case, when `interactionWeights[name] >= 5` and `visibleInPeople` is set to true, immediately push a `trackedCharacters` entry:

```javascript
if (!worldState.trackedCharacters) worldState.trackedCharacters = [];
if (!worldState.trackedCharacters.find(c => c.name === intName)) {
  const _prof = worldState.characterProfiles[intName];
  worldState.trackedCharacters.push({
    name: intName,
    title: _prof.description || '',
    relation: 'Known',
    summary: _prof.description || 'Met through repeated interactions.',
    lastSeen: worldState.inGameDate || ''
  });
}
```

**Fix 3 — Added `repairCharacterProfiles()` migration for existing saves.**

On load, after `normalizeWorldState()` and `seedCanonProfiles()`, the new function scans `worldState.characterProfiles` for all entries with `visibleInPeople = true` that lack a corresponding `trackedCharacters` entry, and creates the missing entries. This retroactively repairs saves where characters had accumulated enough interaction weight before the fix.

```javascript
function repairCharacterProfiles() {
  if (!worldState) return;
  const profiles = worldState.characterProfiles;
  if (!profiles) return;
  if (!worldState.trackedCharacters) worldState.trackedCharacters = [];
  for (const [name, prof] of Object.entries(profiles)) {
    if (!prof.visibleInPeople) continue;
    if (worldState.trackedCharacters.find(c => c.name === name)) continue;
    worldState.trackedCharacters.push({
      name: name,
      title: prof.description || '',
      relation: 'Known',
      summary: prof.description || 'Met through repeated interactions.',
      lastSeen: prof.firstMet || worldState.inGameDate || ''
    });
  }
}
```

### Code Location

- `isNaN` guard removal: `index.html` ~line 4430 (CHANGES parser switch)
- `INTERACTION` bridge: `index.html` ~line 4575 (INTERACTION case)
- `repairCharacterProfiles()`: `index.html` ~line 5763 (before `repairTalentConsistency`)
- Load call: `index.html` ~line 6887 (`if (worldState) { ... repairCharacterProfiles(); }`)

### Files Changed

- `index.html`
- `Docs/updates.md`

---

## V121b — 2026-06-09

**Fix: Truncated AI responses (missing CHANGES/SHEET/WORLD blocks)**

### Root Cause

`maxOutputTokens` was set to 8192. A full turn response — narrative (~800–1200 tokens) + CHANGES block (~300 tokens) + full SHEET JSON (~1500–2000 tokens) + WORLD JSON (~600 tokens) — can easily exceed 8192 tokens. When hit, Gemini silently cuts off output, dropping the `<<<SHEET>>>` and `<<<WORLD>>>` blocks so no stats update.

### Fixes Applied

**1. Increased `maxOutputTokens` to 32768** (`callGemini`, `generationConfig`)
- Gemini 2.5 Flash supports up to 65536 output tokens; 32768 gives 4× more headroom than before
- Prevents truncation in all normal cases

**2. Auto-continuation on truncation** (new block after `rawText` is set)
- Detects truncation via `finishReason === 'MAX_TOKENS'` OR missing `<<<END_WORLD>>>` in response
- Automatically sends a second API call with the partial response as model context, asking only for the continuation from where it stopped + the missing blocks
- Merges continuation text into `rawText` before the block-parsing step
- If the continuation call itself fails, shows an amber warning banner in the story feed (non-blocking)

### Code Location

Lines ~3775–3815 in `starwars_rpg_V121.html` / `index.html`.

---

## V121 — 2026-06-09

**Feature: Character Creation Screen**

### Overview

Replaced the AI-driven intro Q&A with a full character creation screen that appears when clicking "Begin Campaign". The screen provides structured inputs for all character identity fields, a point-pool stat allocation system, backstory/discovery text fields, an opening scene prompt, and innate talent selection.

### Screen Layout

Three-column layout (stacked on mobile):
- **Left column**: Identity fields (Era, Year, Name, Species, Age, Faction, Rank, Discovery Age) + Innate Talent checkboxes (max 2)
- **Middle column**: Starting Stats — pool tracker + per-stat +/− allocation controls
- **Right column**: Backstory & Discovery textarea (saved permanently) + Opening Scene textarea (becomes first AI turn prompt)

### Point-Pool System

Each rank defines fixed point budgets:
- **Core pool** — total levels to allocate across Strength / Agility / Endurance / Willpower / Charisma / Intelligence
- **Force pool** — total levels for Force Sense / Meditation / Knowledge / Control / Output (0 for non-Force factions)
- **Saber** — fixed ShiiCho starting level (displayed as a read-only bar)
- **Per-stat cap** — prevents dumping all points into one stat

Example pools (Jedi):
| Rank | Core | Force | Saber |
|---|---|---|---|
| Youngling | 55 | 45 | 5 |
| Initiate | 78 | 60 | 12 |
| Padawan | 115 | 105 | 40 |
| Knight | 168 | 155 | 80 |
| Master | 220 | 205 | 110 |

Changing faction or rank auto-redistributes via `ccAutoDistribute()`. "Re-roll" button randomly redistributes within pools. +/− buttons on each stat allow manual fine-tuning, enforcing both the per-stat cap and the group pool total.

### Backstory Injection

`characterSheet.backstory` is now populated from the creation screen and injected into the AI's state block every turn via `buildContext()`:
```
CHARACTER BACKSTORY (permanent record — reference this for narrative consistency):
[user's backstory text]
```

### `finalizeCreation()`

1. Validates name + opening scene required
2. Reads `_ccAlloc` stat allocations
3. Resets all game state (history, XP, worldState)
4. Seeds `masterXP` from allocations using `xpToReachLevel(lvl)` for each stat
5. Builds complete `characterSheet` with all fields including `lifeStage`, `backstory`, `discoveryAge`, `innateTalents`
6. Builds `worldState` with correct era date (`Primeday, Day 1 Coruscann — YEAR BBY`)
7. Calls `syncMasterXPToSheet()`, `spSeedIfInnate()` (if ShatterSense selected), `seedCanonProfiles()`
8. Fires first AI turn: `callGemini("CHARACTER CREATED — BEGIN THE STORY NOW.\n\nOpening scene: [text]")`

### `beginCampaign()` change

Was: `callGemini("BEGIN_GAME")`
Now: `showCreationScreen()` — shows creation screen overlay instead of immediately firing API

---

## V120 — 2026-06-09

**Fix 1: `_savedAptitudes` Force-key filter**
**Fix 2: TRAINING: time-elapsed validation**
**Fix 3: ShatterSense / Shatterpoint exclusivity**

### Problem 1 — "Shatterpoint" re-entering aptitudes after every turn

`_savedAptitudes` (the snapshot taken just before SHEET parse) was missing the Force ability catalog key filter. `repairTalentConsistency()` stripped "Shatterpoint" on load, but the _savedAptitudes snapshot captured it before the repair ran on the first parse, and the SHEET parser then merged it back. Net result: "Shatterpoint" re-appeared in aptitudes on every turn after the first.

### Fix 1

Moved `_forceAbilityKeys` definition before `_savedAptitudes` and added it to the filter:
```javascript
const _forceAbilityKeys = typeof FORCE_ABILITY_CATALOG !== 'undefined' ? new Set(Object.keys(FORCE_ABILITY_CATALOG)) : new Set();
const _savedAptitudes = (characterSheet?.aptitudes || []).filter(a =>
  !SIM_INNATE_TALENTS.some(t => t.label === a) &&
  !SIM_INNATE_ABILITIES.some(ab => ab.label === a) &&
  !_forceAbilityKeys.has(a)
);
```

### Problem 2 — XP jumps on non-training turns

The AI was emitting TRAINING: tags with multi-hour XP on turns where only 5 minutes elapsed (e.g., walking to breakfast, sitting down at a table). V117 prompt fixes reduced frequency but didn't stop it entirely. The JS parser had no cross-check against actual elapsed time.

### Fix 2

Pre-parse the AI's "Time Elapsed: X minutes/hours" declaration from rawText before the CHANGES loop runs. In the TRAINING: parser, reject any tag where claimed hours exceed `Math.max(0.05, turnElapsedHours × 2.0)`. The ×2.0 headroom allows for a training session that ends mid-turn (e.g., 1h remaining from a 2h session), but blocks phantom 2h blocks on a 5-minute walk turn.

```javascript
// Before CHANGES loop:
let turnElapsedHours = null;
{
  const _elapsedLine = rawText.split('\n').find(l => /time elapsed/i.test(l));
  if (_elapsedLine) {
    let _mins = 0;
    const _hr = _elapsedLine.match(/(\d+(?:\.\d+)?)\s*hour/i);
    const _mn = _elapsedLine.match(/(\d+)\s*min/i);
    if (_hr) _mins += parseFloat(_hr[1]) * 60;
    if (_mn) _mins += parseInt(_mn[1]);
    if (_mins > 0) turnElapsedHours = _mins / 60;
  }
}

// In TRAINING: case:
if (parts.length >= 2 && turnElapsedHours !== null) {
  const claimedHours = parseFloat(parts[1]) || 0;
  if (claimedHours > Math.max(0.05, turnElapsedHours * 2.0)) {
    console.log('[TRAINING guard] Rejected...');
    continue;
  }
}
```

### Problem 3 — ShatterSense / Shatterpoint not mutually exclusive

With the ShatterSense innate talent active, the AI could still emit `TRAINING: forceAbilities.Shatterpoint` or `XP: forceAbilities.Shatterpoint` tags, awarding XP to the regular learned Shatterpoint track. The innate version (ShatterSense) is strictly stronger — the learned version should be permanently unavailable once the innate talent is active. Additionally, `buildLoreContext()` was not telling the AI this constraint, so it could generate the tag without realizing it was wrong.

### Fix 3

- TRAINING: parser: if `parts[0] === 'forceAbilities.Shatterpoint'` and `ShatterSense` is in `innateTalents`, `continue` (reject).
- XP: parser: same guard wraps the `applyXPToSheet` call in an else branch.
- `buildLoreContext()`: when `hasShatterSense` is true, appends: `"!! ShatterSense innate is active — regular learned Shatterpoint ability is PERMANENTLY UNAVAILABLE. Never emit TRAINING:/XP: tags for forceAbilities.Shatterpoint."` directly after the Shatterpoint ability rules line.

---

## V119 — 2026-06-09

**Fix: Complete applyTalentXPMultiplier — all XP-effect talents JS-driven**

### Problem

`applyTalentXPMultiplier` only handled `BladeIntuition` and `ForceReservoir`. Two other XP-modifying talents declared in `SIM_INNATE_TALENTS` — `QuickStudy` (ForceKnowledge ×1.2) and `ForceSensitiveHealer` (Healing-family ×1.3) — were missing. If a character ever activates these talents, the multiplier would silently do nothing, leaving the effect dependent on the AI manually calculating bonuses.

### Fix

Added two new checks to `applyTalentXPMultiplier`:
- `QuickStudy` → if stat path is `forceStats.forceKnowledge`, multiply by 1.2
- `ForceSensitiveHealer` → if stat path is a `forceAbilities.*` whose FORCE_ABILITY_CATALOG entry has `fam:'Healing'` or key is `ForceHealSelf`, multiply by 1.3

All four XP-multiplier talents (`BladeIntuition`, `ForceReservoir`, `QuickStudy`, `ForceSensitiveHealer`) are now fully JS-driven through a single function. The AI never needs to account for these bonuses. Updated stale comment in `simApplyTalentEffects` to reflect the complete list.

Note: `BattleMeditationAffinity` (×0.3 cost, ×0.6 strain) uses a cost-reduction model (like `ShatterSense`) and requires its own dedicated XP track handler — deferred to a future session when that talent is relevant.

---

## V118 — 2026-06-09

**Fix: Shatterpoint-as-aptitude + BladeIntuition XP multiplier not firing**

### Problems

**1. "Shatterpoint" showing as a raw aptitude entry** (separate from "Shatterpoint (Innate)"):  
The character had "Shatterpoint" in `innateAbilities[]` — a Force ability name, not a valid innate ability. Since `SIM_INNATE_ABILITIES` only has `TelekineticBurstPassive`, the `abilityLabels` map fell through to the raw key string, displaying "Shatterpoint" as a character trait alongside the correct "Shatterpoint (Innate)" label from `ShatterSense` in `innateTalents`.

**2. BladeIntuition ×1.3 multiplier not applying to lightsaber XP**:  
"Blade Intuition" was present in `aptitudes[]` as an AI-written string, but `BladeIntuition` was absent from `innateTalents[]`. `applyTalentXPMultiplier()` reads `innateTalents` — if the key isn't there, the multiplier silently does nothing. All three stats (ShiiCho, Agility, Strength) received identical XP confirming the multiplier was not applied.

### Root cause

Both issues stem from the same gap: talent data can enter `aptitudes[]` as text strings (via AI SHEET JSON) without the corresponding functional key entering `innateTalents[]`. The existing filters only deduplicate labels but don't enforce the link between aptitude labels and mechanic keys. Additionally, Force ability names (e.g. "Shatterpoint") can appear in `innateAbilities[]` or `aptitudes[]` when the AI mistakenly categorizes learned abilities as innate traits.

### Fixes

**1. `repairTalentConsistency()` function** (added after `applyTalentXPMultiplier`):  
- Strips any key from `innateAbilities[]` not present in `SIM_INNATE_ABILITIES` (removes Force ability names that don't belong there)  
- Scans `aptitudes[]` for strings that match a `SIM_INNATE_TALENTS` label; if found and the key is missing from `innateTalents[]`, promotes it (fixes BladeIntuition, ShatterSense, etc.)  
- Strips raw FORCE_ABILITY_CATALOG keys from `aptitudes[]` (prevents Force ability names from displaying as character traits)

**2. Called in `loadFromSave()`** after `syncMasterXPToSheet()` and `spSeedIfInnate()` — runs once on every game load to self-heal any corrupted talent state from old saves.

**3. SHEET parse `aiAptitudes` filter updated**: Added `!_forceAbilityKeys.has(a)` guard so AI-written Force ability names are stripped from aptitudes during every SHEET parse, not just on load.

**4. `simToggleTalent` `existingAptitudes` filter updated**: Same Force-ability-key guard added so the toggle sync also stays clean.

---

## V117 — 2026-06-09

**Fix: Duplicate XP on the turn after training**

### Problem

XP was being awarded twice for a training session: once in the training turn (correct), and again in the immediately following turn (e.g. walking to breakfast). The user reported seeing "+8 XP" to ForceSense, ForceControl, and Telekinesis on a turn where the player only walked to the refectory.

### Root Cause (multi-factor)

**1. Stale prompt text (line 1730):** The prompt said "The system pre-rolls 3 d20 values every turn" but pre-roll injection was removed in V116. The AI was told to expect pre-rolled d20 values that were never provided. Without finding them in the current stateBlock, the AI may have been leaning on previous-turn roll context to justify applying training XP on the next turn.

**2. Ambiguous CHANGES block rule (line 1550):** "Include ALL stat values AND XP lines every turn" — the AI read "XP lines every turn" as mandatory and found something to fill them with, even when the current turn involved no training.

**3. No prohibition on cross-turn TRAINING: carry-over:** The AI doesn't see the previous turn's CHANGES block (it's stripped from displayText stored in history). Without an explicit rule, it could include TRAINING: tags to "complete accounting" for the previous turn's training session, not knowing those tags were already processed by JS.

**4. Narrative XP fallback parser (lines 4066-4095):** This legacy parser searched rawText for "StatName: +N XP" patterns and applied XP×50 as a fallback. If both the CHANGES-block TRAINING: tags AND the narrative parser fired in the same turn, XP could be double-applied.

### Fixes

**1. Prompt — CHANGES block rule (line 1550):**  
Changed "Include ALL stat values AND XP lines every turn" to "Include TRAINING:/COMBAT: XP lines ONLY if XP was earned in THIS turn. If no training or combat occurred, write NO TRAINING: or COMBAT: lines."

**2. Prompt — pre-roll language (line 1730):**  
Replaced "The system pre-rolls 3 d20 values every turn. Use them whenever any of the following apply." with "JavaScript rolls dice via your ROLL:/ROLL_LABEL= tags — no pre-rolled values are injected into this prompt."

**3. Prompt — "do not fabricate d20 values" clarification (line 1742):**  
Replaced reference to "pre-rolled injection" with plain rule: "Do NOT write d20 values, bonuses, or roll math in narrative text."

**4. Prompt — Rule 9 in stateBlock CRITICAL RULES (line 3134):**  
Appended: "CRITICAL: TRAINING: tags must correspond ONLY to training that visibly occurs in THIS turn's narrative. Never include TRAINING: tags to account for a previous turn's session — those CHANGES blocks were already processed by JavaScript."

**5. JS — Narrative XP fallback parser gated by `trainingTagFound` flag:**  
Added `let trainingTagFound = false` before the CHANGES parsing loop. Set to `true` in the `TRAINING:` case and the `COMBAT:` case. Changed the narrative XP parser condition from `if (characterSheet)` to `if (characterSheet && !trainingTagFound)`. This prevents the fallback from ever running when the AI used proper structured tags, eliminating the double-application path entirely.

---

## V116 addendum I — 2026-06-09

**Fix: Alignment decimal display + JS-only ownership**

### Problem

Alignment was displayed as an integer (e.g. `+0`) even though small fractional shifts happen each turn (e.g. +0.25 for a light-side choice). The user couldn't see progression between whole numbers.

Additionally, `alignment`, `darkPressure`, and `momentumWindow` were being double-tracked: the AI writes these into the `<<<SHEET>>>` JSON block, which was being applied first, then the CHANGES block tags re-applied them. This matched the correct final value but created a risk that AI SHEET JSON could overwrite JS-computed values if the CHANGES block failed to parse.

### Fixes

**1. SHEET parse snapshot/restore for alignment fields:**
Three snapshot vars added before the SHEET parse (alongside the existing `_savedStoryFlags` snapshot):
```javascript
const _savedAlignment      = characterSheet ? (characterSheet.alignment      ?? null) : null;
const _savedDarkPressure   = characterSheet ? (characterSheet.darkPressure   ?? null) : null;
const _savedMomentumWindow = characterSheet?.momentumWindow ? {...characterSheet.momentumWindow} : null;
```
Restore code added after the other player-protected field restores:
```javascript
if (_savedAlignment      !== null) characterSheet.alignment      = _savedAlignment;
if (_savedDarkPressure   !== null) characterSheet.darkPressure   = _savedDarkPressure;
if (_savedMomentumWindow)          characterSheet.momentumWindow  = _savedMomentumWindow;
```
The AI's SHEET JSON values for these three fields are now fully ignored — only the CHANGES block tags (`ALIGNMENT=`, `DARK_PRESSURE=`, `MOMENTUM_WINDOW=`) can update them.

**2. Alignment display shows 2 decimal places:**
Changed `${alignVal > 0 ? '+' : ''}${alignVal}` → `${alignVal > 0 ? '+' : ''}${alignVal.toFixed(2)}` in `updateCharacterSheet()`.

**3. WILL_OF_FORCE and PRESSURE DISCHARGED notification cards:**
All three occurrences of `Math.round(characterSheet.alignment)` in notification cards replaced with `characterSheet.alignment.toFixed(2)`, so the pop-up cards also show exact values.

---

## V116 addendum H — 2026-06-08

**Fix: JS owns the clock entirely — AI inGameTime field fully ignored**

### Root Cause

`advanceClock()` read `worldState.inGameTime` as its base time, but the WORLD JSON parse had already overwritten that field with the AI's value before `advanceClock()` ran. So "Time Elapsed: 10 minutes" was adding 10 minutes to the AI's wrong base (e.g. `18:04`) instead of the real previous time (`16:42`), producing a jump of 82 minutes instead of 10.

The `savedTime` variable (captured before the WORLD parse at line ~3319) was only restored to `worldState.inGameTime` when the AI omitted the field entirely — i.e. `if (savedTime && !worldState.inGameTime)`. Since the AI always includes `inGameTime`, the restore never fired.

### Fixes

**1. `savedTime` always restored after WORLD parse:**
Changed `if (savedTime && !worldState.inGameTime) worldState.inGameTime = savedTime` → `if (savedTime) worldState.inGameTime = savedTime`. The AI's `inGameTime` value is now unconditionally discarded and replaced with the JS-tracked value. `advanceClock()` then advances from the correct base.

**2. "It is now/currently" fallback removed:**
The fallback path that scanned for `"it is now"` / `"it is currently"` time strings in the response is gone. The AI has zero influence over the clock value — only `"Time Elapsed: X"` is read.

**3. GM prompt and per-turn injection updated:**
- `inGameTime` rule in WORLD block docs changed to: `DO NOT SET THIS FIELD. JavaScript owns the clock entirely.`
- Critical Rule 2, confirmed turn message, and turn reminder all updated to tell the AI not to set `inGameTime` and to rely on `"Time Elapsed:"` only.

---

## V116 addendum G — 2026-06-08

**Diagnostic: stack trace in error bubbles + recentHistory/fullHistory array guards**

### Changes

**Stack trace in error bubble** — The catch block in `callGemini` now appends the first 2 lines of `err.stack` to the SYSTEM error message. This makes the next occurrence of "is not iterable" self-identifying: the bubble will show which function and line number threw.

**`recentHistory` and `fullHistory` guards** — `loadFromSave` was using `save.recentHistory || []` which doesn't catch a corrupted `{}` value (object is truthy, so `||` returns the object). Replaced with `Array.isArray(save.recentHistory) ? ... : []` for both fields. Same guard added at the `for (const msg of recentHistory)` iteration site in `buildContext`.

---

## V116 addendum F — 2026-06-08

**Fix: "it is not iterable" — centralised worldState normalization**

### Why V116e wasn't enough

V116e added `Array.isArray` guards after the per-turn WORLD block parse, but had two holes:

1. **Guards only ran when `worldParsed = true`.** If the AI omitted the WORLD block or the JSON failed to parse, the stale worldState from the previous turn (or from the save file) was never normalized. The next turn's `buildContext()` → `buildEventInjection()` → `getSceneNPCs()` would then iterate the still-broken field and throw.

2. **`loadFromSave()` used `if (!x)` checks**, which don't catch `{}` (an empty object is truthy). So a save that had `trackedCharacters: {}` was loaded as-is, survived normalization, and blew up on the first turn. Also, `trackedCharacters` had no guard at all in `loadFromSave`.

### Fix

Extracted a single `normalizeWorldState()` function that uses `Array.isArray` for all array fields and `typeof !== 'object'` for all object fields. Called in three places:

1. **`buildEventInjection()`** — top of the function, before any iteration. Runs every turn unconditionally.
2. **`loadFromSave()`** — replaces the old `if (!x)` guards.
3. **Per-turn WORLD parse handler** — after every successful `JSON.parse`, replacing the V116e inline guards.

Fields normalized: `trackedCharacters`, `pendingEvents`, `sceneNPCs`, `galaxyEventQueue`, `legacyChanges`, `lineageRecord`, `worldLog`, `galaxyEvents` (→ `[]`); `characterProfiles`, `interactionWeights`, `npcAgendas`, `galaxyState` (→ `{}`).

---

## V116 addendum E — 2026-06-08

**Fix: "it is not iterable" system error**

### Problem

After any AI turn, the WORLD JSON block completely replaces `worldState` via `JSON.parse()`. No type guards were applied after this parse. If the AI sent any array field as a plain object (e.g. `"trackedCharacters":{}` instead of `"trackedCharacters":[]`), downstream code that iterates over those fields — specifically `getSceneNPCs()` which runs `for (const tc of worldState.trackedCharacters)` — would throw `TypeError: {} is not iterable`. This surfaced in the UI as a red `⚠ it is not iterable` SYSTEM bubble.

### Fix

Added `Array.isArray` and `typeof` normalization guards immediately after the per-turn `JSON.parse(worldMatch[1])` call in the WORLD block handler (line ~3310). Mirrors the same guards that `loadFromSave()` already had. Fields normalized:

- Arrays: `trackedCharacters`, `pendingEvents`, `sceneNPCs`, `galaxyEventQueue`, `legacyChanges`, `lineageRecord`, `worldLog`, `galaxyEvents`
- Objects: `characterProfiles`, `interactionWeights`, `npcAgendas`, `galaxyState`

---

## V116 addendum D — 2026-06-08

**Fix: game clock jumping ahead from narrative time mentions**

### Problem

The time display was advancing by an hour or more on turns where only 5 minutes elapsed. Root cause: the time parser scanned the **entire** AI response for any `Period (HH:MM)` pattern (e.g. `Morning (07:30)`) and used the **last** match as the new clock value. If the AI wrote something like "by Evening (19:00) you should be ready" anywhere in its narrative, the clock jumped to 19:00 regardless of what "Time Elapsed" declared.

### Fix

Replaced the full-text regex scan with JS-side arithmetic time advancement:

1. Parse `"Time Elapsed: X minutes/hours"` from the response text
2. Parse the current `worldState.inGameTime` HH:MM value
3. Add the delta and compute the new time string entirely in JS
4. Update `worldState.inGameTime` from this computed value — ignoring both the WORLD JSON and any narrative time mentions

Falls back to scanning `"it is now / it is currently"` lines only (never full text) when no "Time Elapsed" declaration is found. The old catch-all third regex pattern that grabbed any time mention anywhere in the response has been removed.

---

## V116 addendum C — 2026-06-08

**Talent rework: BladeIntuition and ForceReservoir changed to XP multipliers**

### What Changed

**BladeIntuition** (was: "First saber form starts +5 levels")
- New effect: lightsaberForms XP ×1.3 for all lightsaber form training
- Rationale: a flat +5 seed is a one-time gift that vanishes into the progression curve. An XP multiplier compounds over the entire growth arc, rewarding sustained investment rather than just the starting gift.

**ForceReservoir** (was: "maxForceBarrier +20")
- New effect: forceStats.forceOutput XP ×1.3
- Rationale: the talent represents a deep natural well of Force energy. That makes raw power *more accessible to develop*, not just a higher ceiling on one shield stat. An output XP multiplier means the character's raw power grows faster across every ability that draws on it.

### Code Changes

**New function `applyTalentXPMultiplier(statPath, baseXP)`** (inserted after `calcTrainingXP`, line ~4907):
- Reads `characterSheet.innateTalents` 
- BladeIntuition check: `statPath.startsWith('lightsaberForms.')` → ×1.3
- ForceReservoir check: `statPath === 'forceStats.forceOutput'` → ×1.3

**TRAINING: parser** (line ~3420): now calls `applyTalentXPMultiplier(parts[0], rawXP)` between `calcTrainingXP` and `applyXPToSheet`.

**Sim XP loop** (line ~8958): `applyXPToSheet(path, applyTalentXPMultiplier(path, xp))` — sim gets the same multipliers.

**`simApplyTalentEffects()`**: maxForceBarrier logic removed (ForceReservoir is now XP-based, not a passive stat boost). Function body replaced with comment pointing to `applyTalentXPMultiplier`.

**`SIM_INNATE_TALENTS` registry**: updated both effect strings to describe the new behavior.

---

## V116 addendum B — 2026-06-08

**Time inflation and passive-reflection XP fixes**

### Problems Fixed

**1. Time going too fast**

The AI was declaring wildly inflated "Time Elapsed" values — going to the refectory for dinner was logging as 2 hours 10 minutes, and a trip to the archives where the narrative said "two hours" logged as 4 hours 44 minutes. The root cause was the "HOW TO DETERMINE TIME PER TURN" section only saying "Use common sense," giving the AI no anchor for realistic durations.

Additionally, the stated elapsed time and the narrative description were allowed to diverge — the AI could write "you spend two hours researching" then declare "Time Elapsed: 4h 44m" with no contradiction.

**2. XP awarded for passive reflection**

The AI was issuing TRAINING: lines for sitting at dinner and mentally reviewing the day:
- ShiiCho: +47 XP (a lightsaber form — requires physical practice)
- Intelligence: +36 XP
- ForceKnowledge: +36 XP
- ForceControl: +27 XP

The existing XP rules said "every skill used meaningfully this turn needs its own TRAINING: line" which the AI was interpreting as "thinking about Shii-Cho footwork = using Shii-Cho." The Intelligence critical rule said to award it "whenever the character engages reasoning" which was too broad.

### Fixes

**Time section** (`HOW TO DETERMINE TIME PER TURN`, line ~2260 of prompt):

Replaced the vague "use common sense" with a concrete activity time table:
- Meal (eating, getting food, sitting): 20–40 minutes
- Short conversation: 5–15 minutes
- Brief task or short walk within the Temple: 5–15 minutes
- Cross-temple walk: 10–20 minutes
- Speeder travel within a city: 15–30 minutes
- Single training session / reading session: exactly as long as described

Added a hard rule: "The time you declare as 'Time Elapsed:' must match exactly what you describe in the narrative."

**XP qualification rules** (after the TRAINING: format block, line ~1577 of prompt):

Added an explicit "WHAT QUALIFIES FOR TRAINING XP" block:
- Physical stats (lightsaberForms, strength, agility, endurance): require active physical practice. Thinking, watching, or reflecting earns ZERO XP. No exceptions.
- Force abilities: require deliberate Force use — not passive recall.
- forceKnowledge / intelligence: require focused study or deliberate analytical work. Brief mental review during a meal earns nothing.

Listed specific zero-XP activities: eating, sleeping, walking, passive observation, mentally reflecting on past training, general conversation, anything requiring no deliberate effort.

Added a quick test: "Could the character fall asleep mid-activity without missing anything? Then no XP."

**Intelligence critical rule tightened** (Critical Rule 5):

Changed "Intelligence gains XP whenever the character engages reasoning" → "Intelligence gains XP only from FOCUSED deliberate effort: sustained archive research (30+ minutes), working through a difficult tactical problem, decoding complex material, academic instruction." Passing thoughts and brief reflections explicitly excluded.

**Per-turn enforcement** (Critical Rules 8 and 9, injected every turn):

Rule 8: Time Elapsed must equal what the narrative describes. Specific examples (meal = 30–40 min, temple walk = 10–20 min).
Rule 9: Passive activity earns zero TRAINING XP. lightsaberForms requires physical practice. forceKnowledge/intelligence requires focused deliberate study.

---

## V116 addendum A — 2026-06-08

**Hotfix: unescaped backticks in MASTER_PROMPT template literal**

### Problem

Buttons on the title screen were dead — HTML rendered but no JavaScript executed. Root cause: four lines in the `MASTER_PROMPT` template literal used markdown inline-code backtick formatting (`` `breakthrough` ``, `` `basic` ``, `` `ceiling` ``, `` `above`/`far`/`wall` ``) added in the V114 training roll section. Each unescaped backtick terminates the template literal early. JavaScript throws a syntax error, the entire script block fails to parse, and no event handlers are ever attached.

This was the root cause of the recurring "stuck on title screen after large updates" bug that had occurred 10+ times.

### Fix

Replaced the four offending lines (html lines 1730–1737) with single-quote formatting:
- `` `breakthrough` `` → `'breakthrough'`
- `` `basic` `` → `'basic'`
- `` `ceiling` `` → `'ceiling'`
- `` `above` / `far` / `wall` `` → `'above' / 'far' / 'wall'`

### Prevention

Never use backtick characters inside the `MASTER_PROMPT` template literal. Use single quotes for inline-code formatting in the GM prompt. After any large edit, run: `node -e "const fs=require('fs');const m=fs.readFileSync('index.html','utf8').match(/<script[^>]*>([\S\s]*?)<\/script>/);try{new Function(m[1]);console.log('OK')}catch(e){console.log(e.message)}"`

---

## V116 — 2026-06-08

**NPC tracking, milestone system, JS-driven roll engine, and canon NPC profiles merged from V120 branch**

### Summary

V116 is the result of merging V120 (an independently developed branch from V110) into V115. V115 had the engine fixes (lore injection, v3 stats, training roll tables, save detection) and V120 had the NPC/event tracking systems and JS-driven roll engine. This merge brings all features into one file.

### New Systems Added

**1. JS-Driven Roll Engine (replacing AI-calculated rolls)**

Previously: AI pre-calculated bonus math and chose d20 values from pre-injected dice.  
Now: AI outputs `ROLL:` tag with stat paths; JS reads live masterXP-derived values and fires the roll.

New tags (scan entire response text, not just CHANGES block):
- `ROLL:stat.path|stat.path2` — solo roll using live stat values
- `ROLL_OPPOSED:player.path vs CHARACTER:Name` or `vs INLINE:stat=val,...` — opposed roll
- `TIER_GAP=N` — tier difference (positive = player stronger)
- `TACTICAL=N` — situational bonus (capped ±5 by JS)
- `ROLL_LABEL=description` — fires the roll with this label

Implementation: `scanForRollTags` IIFE added before CHANGES block parse. Calls `fireRoll()` when ROLL_LABEL is encountered.

`getLiveStatValue(path)` — reads live masterXP-derived level for any `category.key` path. `fireRoll(roll)` — calculates d20 + statBonus + expBonus + tierGapBonus + tactical, posts HTML result card to feed, stores `characterSheet.lastRoll`.

ROLL tag lines now stripped from `displayText` via `/^(ROLL:|ROLL_OPPOSED:|TIER_GAP=|TACTICAL=|ROLL_LABEL=).*/gm` regex.

GM prompt ROLL SYSTEM section replaced: "FULLY REDESIGNED" → "JS-DRIVEN" with tag format documentation.

**2. NPC Tracking System (KNOWN_PERSON + INTERACTION tags)**

New worldState fields: `characterProfiles{}`, `interactionWeights{}`.

- `KNOWN_PERSON=name|title|relation|summary|lastSeen` — upserts a record in `worldState.trackedCharacters[]`, renders People panel, autosaves
- `INTERACTION=name|type` — increments `interactionWeights[name]`; at weight ≥5 marks `characterProfiles[name].visibleInPeople = true` and shows "◆ Profile added" notification
- `GENERATE_PROFILE=name|canon/custom|desc` — creates a `characterProfiles` entry with tier, stats, firstMet
- `PROFILE_STATS=name|stat.path=val,...` — adds mechanically useful stats to a profile (used by ROLL_OPPOSED CHARACTER: lookup)
- `SCENE_NPCS=Name1,Name2` — explicit override for which NPCs are present this scene

**3. Story Event / Milestone System**

New worldState fields: `pendingEvents[]`, `npcAgendas{}`, `galaxyEventQueue[]`, `sceneNPCs[]`.

New tags:
- `PENDING_EVENT=id|type|triggerDate|priority|summary|context|npcs` — creates a story thread
- `NPC_AGENDA=npcName|priority|summary|context` — adds an agenda item to an NPC
- `RESOLVE_EVENT=id` — marks event resolved with timestamp
- `RESOLVE_NPC_AGENDA=npcName|summary` — removes matching agenda items
- `GALAXY_EVENT=summary|context` — queues a background world event

`buildEventInjection()` — called each turn in stateBlock. Runs `checkMilestones()` + `updateEventPriority()`, then injects active story threads (⚑ PENDING STORY THREADS), NPC agendas for NPCs present in the scene (⚑ NPC AGENDAS), and unsurfaced galaxy events (⚑ GALAXY CONTEXT).

`checkMilestones()` — checks `JEDI_MILESTONES` / `SITH_MILESTONES` constants against current age + domain averages (`getDomainAverages()`). Creates pendingEvents + NPC agenda items automatically when thresholds trigger.

`updateEventPriority()` — increments `overdueBy` counters using `dateToAbsoluteDays()`; escalates priority (medium→high at 1 day overdue, anything→critical at 3 days); sets `mustFire=true` for critical events overdue ≥2 days.

`getSceneNPCs()` — returns explicit `sceneNPCs` if set, otherwise infers from `NPC_HOME_LOCATIONS` constant and `trackedCharacters.lastSeen`.

**4. Canon NPC Profiles**

`CANON_PROFILES_3661BBY` const — stat blocks for Grand Master Zym, Satele Shan, Darth Malgus, Master Ngani Zho, Master Gnost-Dural. These are seeded into `worldState.characterProfiles` on every new game and save load, making them available for `ROLL_OPPOSED CHARACTER:` lookups without requiring the AI to declare stats.

`seedCanonProfiles()` — called in `startNewGame()` (after worldState init) and `loadFromSave()` (after worldState migration guards).

**5. loadFromSave migration guards**

New worldState fields initialized on load if absent:
```
characterProfiles, interactionWeights, pendingEvents, npcAgendas, galaxyEventQueue, sceneNPCs
```

---

## V115 — 2026-06-08

**Save detection on title screen — iOS Safari ITP wipes localStorage silently**

### Root Cause Analysis

On iOS Safari, Intelligent Tracking Prevention (ITP) periodically clears `localStorage` for sites that haven't been visited recently (7-day and 30-day windows depending on settings). This meant a player returning to the game after a few days could find their save gone — with no warning. The title screen always showed the API key input form with no indication that a save had existed, so the player had no way to know the save was lost until they entered a key and started playing.

A secondary bug: if an autosave _was_ present but its JSON was corrupted (truncated write, storage limit error, etc.), `tryAutoLoad()` had a bare `catch(e) {}` — it swallowed the error silently and fell through to the welcome prompt as if no save existed.

### The Fix

**1. Save detection display on the API key screen**

Added `<div id="save-found-msg">` inside the API key screen panel. On `window.onload`, after the autosave check runs, the `else` branch (no key stored) now inspects `localStorage.getItem('sw_rpg_autosave')`:

```javascript
const raw = localStorage.getItem('sw_rpg_autosave');
if (raw) {
  try {
    const s = JSON.parse(raw);
    const msg = document.getElementById('save-found-msg');
    if (msg) {
      msg.textContent = `Save detected — Turn ${s.turnCount||0}, saved ${s.savedAt||'(unknown time)'}`;
      msg.style.display = 'block';
    }
  } catch(e) {}
}
```

This shows a green status line under the key input ("Save detected — Turn 42, saved 6/8/2026, 3:15:22 PM") so the player knows their save survived before they commit to entering a key and starting.

**2. Silent parse failure converted to visible error**

`tryAutoLoad()` previously: `catch(e) {}` — the error was swallowed and execution fell through to `showWelcomePrompt()` as if nothing happened.

Fixed to:
```javascript
} catch(e) {
  renderSystemMessage('⚠ Auto-save found but could not be loaded. It may be corrupted. Start a new game or check console for details.');
}
```

This surfaces the failure visibly instead of silently dropping the player into a new game with no explanation.

### Files Changed
- `starwars_rpg_V115.html` (new version — HTML + window.onload JS changes only, no game logic changes)
- `CLAUDE.md` (session log entry added)

---

## V113 — 2026-06-08

**Turn-2 stuck-loading fix — game locked after exactly one turn per page load**

### Root Cause Analysis

Four independent failure modes, all resulting in `isThinking` staying `true` after turn 1 completes (locking the send button and thinking indicator permanently):

**Root cause 1 — `buildContext()` called outside the try block (critical)**

```javascript
// Before (lines ~2812–2824):
const messages = buildContext(userContent);  // OUTSIDE try — any throw escapes
const body = { ... };
try {
  const resp = await fetch(...);
```

`buildContext()` and `JSON.stringify(body)` were executed before the `try` block. If either threw for any reason (e.g., a non-array field from the AI's SHEET response causing `.join()` to fail on a string), the exception escaped the function entirely. Since `setThinking(false)` and `isThinking = false` are after the try-catch, they never ran. `isThinking` stayed `true`, the thinking spinner stayed visible, and the send button stayed disabled — exactly the "stuck loading" symptom.

This is why it happened on **every** turn 2: the AI's SHEET response is parsed into `characterSheet` on turn 1, potentially producing fields (like `aptitudes`, `inventory`, `strengths`, etc.) as strings rather than arrays. On turn 2, `buildContext()` called `.join()` on those fields, throwing a TypeError — outside the try block.

**Root cause 2 — bare `return` inside `if (worldState)` bypasses `isThinking` reset**

```javascript
// Before (inside try block, inside if (worldState)):
if (typeof GSC_MONTHS === 'undefined') return;  // exits callGemini entirely!
```

This bare `return` exits the entire `callGemini` async function, skipping the `setThinking(false); isThinking = false;` lines at the end. GSC_MONTHS is normally always defined, but if any initialization error had occurred (or if the check fired for any other reason), the game would lock.

**Root cause 3 — non-array AI fields crashing `buildContext` (enabler of root cause 1)**

Fields like `cs.aptitudes||[]` only produce `[]` when the field is falsy (null, undefined, 0, ''). If the AI sends `"aptitudes": "Force Sensitivity, ..."` (a non-empty string), then `cs.aptitudes||[]` = the string (truthy). Calling `.join(', ')` on a string throws `TypeError: cs.aptitudes.join is not a function`.

**Root cause 4 — empty model history message (secondary)**

When `displayText` was empty (e.g., AI put all content inside blocks with no preceding narrative), the stored model message `{role:'model', parts:[{text:''}]}` would be invalid for the Gemini API on the next turn, potentially causing a 400 error or unexpected behavior.

### The 4 Fixes

**Fix 1 — Move `buildContext()` and body construction inside the try block** (critical)

```javascript
// After:
try {
  const messages = buildContext(userContent);  // now inside try
  const body = { ... };
  const resp = await fetch(...);
```

Any exception from `buildContext()` or `JSON.stringify(body)` is now caught. `setThinking(false)` always runs, game never locks.

**Fix 2 — Change bare `return` to block-level skip**

```javascript
// Before:
if (typeof GSC_MONTHS === 'undefined') return;
const monthNames = GSC_MONTHS.join('|');
// ... date parsing ...

// After:
if (typeof GSC_MONTHS !== 'undefined') {
  const monthNames = GSC_MONTHS.join('|');
  // ... date parsing ...
} // end if
```

Skips date parsing if GSC_MONTHS is absent instead of exiting the function.

**Fix 3 — Array.isArray guards on all .join() calls in buildContext**

```javascript
// Before:
APTITUDES: ${(cs.aptitudes||[]).join(', ')||'none'}

// After:
APTITUDES: ${(Array.isArray(cs.aptitudes) ? cs.aptitudes : []).join(', ')||'none'}
```

Applied to `inventory`, `strengths`, `weaknesses`, `aptitudes`, `knownSecrets`. A string from the AI is now treated as missing rather than causing a TypeError.

**Fix 4 — Non-empty fallback for model history messages**

```javascript
// Before:
const modelMsg = { role: 'model', parts: [{ text: displayText }] };

// After:
const modelMsg = { role: 'model', parts: [{ text: displayText || '[Turn completed.]' }] };
```

Prevents sending empty `parts[0].text` to Gemini when the AI response had no displayable content.

### Files Changed
- `starwars_rpg_V113.html` (new version)
- `index.html` (deployed version, same changes)

---

## V112 — 2026-06-08

**Quota exhaustion + localStorage save failure fixes**

### Root Cause Analysis

Two related problems stemming from how history was stored:

1. **API quota exceeded faster than expected**: `recentHistory` stored `rawText` (full AI response including CHANGES/SHEET/WORLD JSON blocks, ~5–8KB per model message). 6 turns × 2 messages × ~6KB = ~72KB of raw history sent to Gemini on every single turn. V111's `buildLoreContext()` added another ~1,100 tokens on top per turn.

2. **Silent save failures causing data loss on refresh**: When quota is exceeded, `summarizeCampaign()` also fails (same API key), so `fullHistory` is never trimmed. `buildSave()` was storing `feedHtml: document.getElementById('story-feed').innerHTML` (full rendered HTML of up to 100 DOM turns, potentially 500KB+) plus `fullHistory.slice(-200)` of raw entries. Once the combined save JSON exceeds the browser's localStorage limit (~5–10MB), `localStorage.setItem` throws a `QuotaExceededError` silently — autosave stops working without any visible indication. On refresh, the user loads whatever save was last written successfully (potentially many turns back).

### The 4 Fixes

**Fix 1 — Store `displayText` in history instead of `rawText`** (critical — biggest impact)

File location: `callGemini()` → history update block
```javascript
// Before
const modelMsg = { role: 'model', parts: [{ text: rawText }] };
// After
const modelMsg = { role: 'model', parts: [{ text: displayText }] };
```
`displayText` is already computed by stripping CHANGES/SHEET/WORLD blocks from rawText. Storing it instead reduces each model history entry from ~6KB to ~1KB. The AI receives authoritative current state via `stateBlock` every turn anyway — the JSON blocks in history were pure noise that wasted API tokens.

Effect: ~70–80% fewer tokens sent to Gemini per turn; proportional reduction in save file size.

**Fix 2 — Trim `fullHistory` in summarize catch block even on failure** (prevents unbounded growth)

File location: `summarizeCampaign()` → catch block
```javascript
// Added in catch(e):
if (fullHistory.length > RECENT_TURNS * 4) {
  fullHistory = fullHistory.slice(-(RECENT_TURNS * 4));
}
```
Without this, sustained quota errors prevent summarization indefinitely. `fullHistory` keeps growing with each turn, eventually causing the localStorage save to fail.

**Fix 3 — Catch `localStorage` errors in `autoSave()`** (visibility)

File location: `autoSave()`
```javascript
try {
  localStorage.setItem('sw_rpg_autosave', JSON.stringify(save));
  // ... show ✓ Saved ...
} catch(e) {
  if (ind) { ind.textContent = '⚠ Save Failed!'; ind.style.color = '#e05555'; }
  renderSystemMessage('⚠ Auto-save failed — device storage limit reached. Use the SAVE button...');
}
```
Previously localStorage failures were completely silent. Now the player sees a visible warning and is prompted to use a manual save slot.

**Fix 4 — Cap `feedHtml` to last 50 messages in `buildSave()`** (secondary size reduction)

File location: `buildSave()`
```javascript
// Before
feedHtml: document.getElementById('story-feed').innerHTML

// After
feedHtml: (() => {
  const feed = document.getElementById('story-feed');
  const msgs = feed.querySelectorAll('.msg');
  return Array.from(msgs).slice(-50).map(m => m.outerHTML).join('');
})()
```
Limits the stored feed HTML to last 50 messages (~50KB) instead of potentially 500KB+ for a full session.

### Files Changed
- `starwars_rpg_V112.html` (new version)
- `index.html` (deployed version, same changes)

---

## V112 addendum — Intelligence & ForceOutput stat visibility fixes (2026-06-08)

**Symptoms:** `intelligence` and `forceOutput` did not appear on the character sheet, did not appear in the XP inject panel, and the AI never awarded them even during relevant activities (archive research, Force power use).

### Root Cause Analysis

Three layered problems:

1. **`index.html` had a hardcoded `VALID_FS` filter that actively deleted `forceOutput`** on every turn:
   ```javascript
   // Old — only 4 stats, actively deletes forceOutput from masterXP AND characterSheet
   const VALID_FS = new Set(['forceSense','meditation','forceKnowledge','forceControl']);
   for (const k of Object.keys(masterXP.forceStats)) {
     if (!VALID_FS.has(k)) delete masterXP.forceStats[k];
   }
   ```
   This filter ran inside `syncMasterXPToSheet()`, which fires after every SHEET parse. Even if XP was somehow awarded, it was deleted within the same turn.

2. **Stats at level 0 with no XP earned never get seeded.** `syncMasterXPToSheet`'s `apply()` loop only iterates over keys that already exist in `masterXP`. A brand-new save has no `masterXP.stats.intelligence` entry, so `apply()` never touches `characterSheet.stats.intelligence`, leaving it absent. The sheet renderer then finds no entry and shows nothing.

3. **The renderer iterated `Object.entries(fs)` with an old 4-stat guard**, so even if `forceOutput` somehow survived the delete pass, it would have been skipped in the display loop.

4. **No AI guidance** — the critical rules block in `stateBlock` didn't mention intelligence or forceOutput, so the AI never thought to award them.

### The 4 Fixes

**Fix A — Update `VALID_FS` in `index.html` to use canonical list** (removes active deletion)

`VALID_FS` now built from `CANONICAL_FORCE_STATS` instead of a hardcoded 4-stat set. `forceOutput` is no longer deleted.

**Fix B — Add canonical stat seeding at end of `syncMasterXPToSheet`** (ensures stats always exist)

```javascript
const CANONICAL_FORCE_STATS = ['forceSense','meditation','forceKnowledge','forceControl','forceOutput'];
const CANONICAL_CORE_STATS  = ['strength','agility','endurance','willpower','charisma','intelligence'];

// In syncMasterXPToSheet, after apply() loops:
for (const k of CANONICAL_FORCE_STATS) {
  if (characterSheet.forceStats[k] === undefined) characterSheet.forceStats[k] = 0;
}
for (const k of CANONICAL_CORE_STATS) {
  if (characterSheet.stats[k] === undefined) characterSheet.stats[k] = 0;
}
```

Seeding happens every turn so no stat can disappear after a SHEET parse, regardless of what the AI writes.

**Fix C — Renderer iterates canonical lists, not object keys** (correct order, no missing stats)

Both the Force Stats section and the Core Stats section of `updateCharacterSheet()` now iterate `CANONICAL_FORCE_STATS` and `CANONICAL_CORE_STATS` respectively, using `fs[k] ?? 0` as the fallback. The old `Object.entries()` + guard approach is replaced. Stats section is also no longer gated on `Object.keys(st).length > 0`.

**Fix D — Add intelligence/forceOutput guidance to `stateBlock` critical rules**

New rule #5 (old 5 and 6 shifted to 6 and 7):
```
5. INTELLIGENCE & FORCE OUTPUT — These are fully tracked stats (stats.intelligence,
forceStats.forceOutput). Award them proactively: archive study / research / tactical analysis /
lectures → TRAINING: stats.intelligence. Raw power expenditure (telekinetic bursts, Force Repulse,
channeling large Force energy) → TRAINING: forceStats.forceOutput. Do NOT ignore these stats.
```

### Files Changed
- `index.html` (deployed version — all 4 fixes)
- `starwars_rpg_V112.html` (new version — Fix B, C, D applied; Fix A not needed as V112 had no VALID_FS guard)

---

## V114 — 2026-06-08

**Roll trigger system — AI was auto-succeeding training and skipping rolls for most non-combat actions**

### Root Cause Analysis

The roll system was already well-built for two scenarios: combat (exchange-by-exchange with full tier/gap math) and shatterpoint interpretation (`SHATTERPOINT_ROLL:`). Three d20 values are pre-rolled and injected into every prompt. However, the GM prompt contained **no explicit guidance on when to trigger a roll outside of combat**. With no mandate to use the pre-rolled dice, the AI defaulted to picking `solid` or `strong` as the TRAINING: outcome on every turn — effectively auto-succeeding every training session regardless of difficulty.

Secondary problem: the existing outcome field in `TRAINING:` tags (`failure / partial / solid / strong / overwhelming / breakthrough`) was never linked to any roll formula. The AI was free to pick any outcome by preference, and it consistently chose favorable ones. This removed meaningful variance from training progression and undermined the realism of the system — a padawan attempting ceiling-difficulty Force exercises should fail or struggle a meaningful percentage of the time, not succeed by default.

There was also no guidance for:
- Training at different difficulty levels having different risk profiles (routine drilling vs. pushing your limit vs. attempting something genuinely beyond you)
- NPC social interactions requiring a roll when the outcome has stakes
- Reading/studying having a roll-derived quality-of-comprehension outcome

### The Fix

Added a `### WHEN TO ROLL — MANDATORY TRIGGERS` section to the GM prompt in V114, inserted between the `SUB-ROLL RULE` block and `COMBAT SYSTEM` (lines ~1833–1907 in V114). The section contains:

**1. Mandatory trigger list**

The AI must roll (using pre-rolled d20 values) whenever:
- A training session occurs at any difficulty
- An active Force ability is used with an uncertain outcome
- Jared attempts persuasion, deception, intimidation, or charm in an NPC interaction
- A physical challenge with real consequences is attempted
- Any action is explicitly opposed by another character

The AI must NOT roll for passive narration, zero-stakes dialogue, or guaranteed outcomes.

**2. Training roll procedure**

Four steps:
1. Check raw d20 for Natural 20 first (always Breakthrough, skip all other steps)
2. Compute total = d20 + compressedBonus(primary stat being trained)
3. Select the table matching the difficulty keyword
4. Read outcome from table — AI cannot override the result with narrative preference

The `compressedBonus` formula is the same used in combat (stat ÷ 20 up to stat 40, logarithmic compression above). At Jared's current stat level (~30), the bonus is roughly +1.5, meaning the d20 dominates and variance is genuine.

**3. Three outcome tables with mathematically derived thresholds**

Thresholds were derived by computing the probability distribution at representative stat levels (30, 60, 80) and tuning for realistic feel:

**SUCCESS TABLE** — `basic` difficulty, material at or below current tier (no failure)

| Total | Outcome | XP ×mult |
|-------|---------|----------|
| < 12  | solid   | ×1.2 |
| 12–17 | strong  | ×1.5 |
| ≥ 18  | overwhelming | ×2.0 |
| d20=20 | breakthrough | ×3.0 |

Probability at stat 30 (+1.5): **solid 50% / strong 30% / overwhelming 15% / breakthrough 5%**
Probability at stat 60 (+2.5): **solid 45% / strong 30% / overwhelming 20% / breakthrough 5%**
Probability at stat 80 (+3.0): **solid 40% / strong 30% / overwhelming 25% / breakthrough 5%**

The failure band is absent by design. Even a poor drilling session is a productive session — the player just had an average day (volleyball analogy: you can be off and still play). As skill grows, the bonus shifts outcomes slightly toward strong/overwhelming, representing a more experienced practitioner having better baseline sessions.

**CEILING TABLE** — `ceiling` difficulty, genuinely pushing the skill limit

| Total | Outcome | XP ×mult |
|-------|---------|----------|
| < 8   | failure  | ×0.8 |
| 8–11  | partial  | ×1.0 |
| 12–16 | solid    | ×1.2 |
| 17–20 | strong   | ×1.5 |
| ≥ 21  | overwhelming | ×2.0 |
| d20=20 | breakthrough | ×3.0 |

Probability at stat 30: **failure 30% / partial 20% / solid 25% / strong 20% / breakthrough 5%**
Probability at stat 60: **failure 25% / partial 20% / solid 25% / strong 20% / overwhelming 5% / breakthrough 5%**

Failing 30% of the time at your skill ceiling is realistic. Overwhelming is effectively unreachable at low stats (requires total ≥ 21, which demands d20=20 at stat 30 — but nat 20 = Breakthrough). As stat grows into the 60–80 range, overwhelming becomes possible on very high rolls (d20 19 + 2.5 bonus = 21.5). This models the experienced practitioner occasionally transcending what should still be their ceiling.

**WALL TABLE** — `above` / `far` / `wall` difficulty, 2+ tiers above current level

| Total | Outcome | XP ×mult |
|-------|---------|----------|
| < 12  | failure  | ×0.8 |
| 12–15 | partial  | ×1.0 |
| 16–20 | solid    | ×1.2 |
| ≥ 21  | strong   | ×1.5 |
| d20=20 | breakthrough | ×3.0 |

Probability at stat 30: **failure 50% / partial 20% / solid 25% / breakthrough 5%**
Probability at stat 60: **failure 40% / partial 20% / solid 30% / strong 5% / breakthrough 5%**

Half the sessions fail at stat 30 because the material is genuinely inaccessible at that level. Breakthrough on a nat 20 represents a flash of insight even when fundamentally outmatched — the character glimpsed something they can't yet reliably reproduce.

**4. Natural 20 = Breakthrough rule**

Checked on the raw d20 before adding any bonus, applies to all three tables and all roll types (training, social, Force use). This uses the existing `breakthrough: 3.0` multiplier already in `calcTrainingXP()` — no JS changes required.

**5. Reading/Studying roll formula**

Roll: d20 + compressedBonus(Intelligence) + compressedBonus(ForceKnowledge) × 0.5 for Force texts; pure compressedBonus(Intelligence) for non-Force material. Uses SUCCESS TABLE (no failure). The dual-stat contribution means a knowledgeable Force scholar has a meaningfully higher floor on comprehension quality than a raw beginner even before the d20 is rolled.

### Design Notes

- The `breakthrough` keyword was already a valid `calcTrainingXP()` outcome (×3.0, line 4330 in V113/V114). No JS changes were required — only the GM prompt needed updating.
- The difficulty map in `calcTrainingXP()` uses keywords `basic`, `ceiling`, `above`, `far` (not `wall`). The new section maps AI difficulty language to these: "ceiling" → `ceiling`, "above/far/wall" → `above` or `far`. This is consistent with the existing JS parser.
- The compressedBonus range across the full stat spectrum (+0.5 at stat 10 to +3.25 at stat 100) is intentionally narrow relative to d20 (1–20). The d20 provides the session-to-session variance; the stat bonus provides the slight but real edge that skill gives. This is the same design philosophy as the combat system.

### Files Changed
- `starwars_rpg_V114.html` (new version — GM prompt only, no JS changes)
- `CLAUDE.md` (session log entry added)

---

## V122e — 2026-06-10

**Fix: Shatterpoint XP loss on save/load and display bugs**

Shatterpoint XP was being lost or reset incorrectly across save/load cycles. Display was also inconsistent — ShatterSense innate level and the Shatterpoint proficiency track were being rendered from different sources, causing the UI to show stale values after loading a save. Fixed by ensuring `masterXP.shatterpoint.main` is the authoritative read path on load and that `spSeedIfInnate()` does not overwrite existing XP when loading an existing save (only seeds on first game start).

### Files Changed
- `index.html`

---

## V122d — 2026-06-10

**Fix: Shatterpoint (Innate) vs Shatterpoint — display and XP disambiguation**

`ShatterSense` innate talent and the learnable `Shatterpoint` ability were being displayed ambiguously in the UI — in some panels both appeared as "Shatterpoint," making it impossible to distinguish which track was being shown. XP awards were also sometimes routing to the wrong track.

Fixed by: labeling the innate track explicitly as "Shatterpoint (Innate)" in all UI display paths, adding a guard that prevents `SHATTERPOINT_XP=` from routing to `masterXP.forceAbilities['Shatterpoint']` when ShatterSense is active, and ensuring the XP panel and character sheet consistently read from `masterXP.shatterpoint.main` for the innate track.

### Files Changed
- `index.html`

---

## V122c — 2026-06-10

**UI: Simulation complete card shows level-progress rows instead of XP chips**

The simulation day-complete summary card was displaying XP gains as a list of raw XP chips (e.g. "ShiiCho +847 XP"). Replaced with level-progress rows that show the stat name, level before, level after (if a level-up occurred), and the XP progress toward the next level — matching the information density of the main character sheet panel.

### Files Changed
- `index.html`

---

## V122b — 2026-06-10

**Prompt: Enforce clock-accurate narrative atmosphere**

The GM prompt was not consistently setting atmosphere and environment descriptions to match the in-game time of day. The AI would describe scenes as "the mid-morning bustle of the Temple" even when the clock read 22:00, or describe bright sunlight on a planet in the middle of its night cycle. Added a per-turn injected rule requiring the AI to read `inGameTime` from the state block and match all atmospheric/environmental descriptions to the actual time of day. Added a canonical Coruscant atmosphere table (early morning, morning, midday, afternoon, evening, night) with expected sensory details per period.

### Files Changed
- `index.html`

---

## V122 — 2026-06-10

**Full alignment engine overhaul**

Rewrote the alignment progression system. Key changes:

- **Equilibrium model replaces linear drift**: Alignment now has a natural equilibrium point determined by life stage and accumulated choices. Single dark acts move pressure, not alignment directly — alignment only shifts when pressure discharges (JS-side) or when momentum windows open. Single light acts award alignment directly but decay back toward equilibrium over time without reinforcement.
- **Dark pressure accumulation tuned**: Pressure discharge amounts recalibrated by tier. Light-side momentum windows after discharge now last longer (up to 5 days for major moral choices) and scale with the significance of the event.
- **WILL_OF_FORCE gains scaled**: `wofGain` values tuned — surrendering to the Force in high-stakes moments yields larger gains than routine acceptance.
- **`addEquilibriumXP()` replaces direct alignment sets**: All light-side gain paths now route through the equilibrium function to prevent unbounded drift toward +100 without earned narrative justification.
- **Alignment display and momentum window UI updated**: Momentum window active state now shows countdown in the alignment panel. Discharge notification card shows before/after alignment values and pressure level.

### Files Changed
- `index.html`

---

## V123 — 2026-06-10

**Pure cleanup pass — no logic changes, no gameplay changes**

### Overview

Thorough audit and cleanup of `index.html` after ~100+ accumulated updates since V111. Three categories: dead AI prompt instructions, stale system references, and general code hygiene. File shrank from 10,357 → 10,252 lines. No JS behavior changed.

---

### 1. Dead AI Prompt Instructions Removed

**Individual stat-set tags** — The CHANGES block template listed per-stat tags (`STRENGTH=`, `AGILITY=`, `FORCE_SENSE=`, etc.) and instructed the AI to write them every turn. JS calls `syncMasterXPToSheet()` immediately after every CHANGES parse, which overwrites every XP-tracked stat from `masterXP`. The AI's written values had no effect on gameplay — they were dead on arrival and wasted ~15–30 tokens per line per turn.

Removed: ~20 individual stat-set tag lines from the CHANGES block template section of MASTER_PROMPT.

**Roll step instructions referencing pre-injected d20 values** — Three steps in the training roll procedure instructed the AI to (1) read raw d20 from pre-injected values, (2) calculate the total, and (3) display the roll math. But pre-roll injection was removed in V116. The AI never sees d20 values — JS handles all dice via `ROLL:` tags. These three steps were giving the AI impossible instructions. Removed them; kept only the table-selection and outcome-keyword guidance.

---

### 2. Stale System References Fixed

**`ALIGNMENT=` → `ALIGNMENT_XP=` in CHANGES block template** (critical bug fix)

The CHANGES block template still showed `ALIGNMENT=N` as the tag for light-side gains. In JS, `ALIGNMENT=N` calls `addEquilibriumXP(val * 20)` — a 20× amplification of the raw value. `ALIGNMENT_XP=N` calls `addEquilibriumXP(N)` directly (correct 1× path). The template was instructing the AI to use the wrong tag with a 20× silent multiplier on every light-side gain. Replaced `ALIGNMENT=` with `ALIGNMENT_XP=` in the template and updated the accompanying documentation comment.

**Incorrect tier names and ranges** — Three separate sections of MASTER_PROMPT used different and incorrect tier name systems:

| Location | Old (incorrect) | Fixed to canonical |
|---|---|---|
| TIER REFERENCE block | Untrained (0-20), Apprentice (21-40), Adept (41-60), Master (61-80), High Master (80+) | Initiate (0-20), Padawan (21-40), Knight (41-60), Master (61-80), Grandmaster (81-100), Legendary (101-150), Transcendent (151+) |
| PROGRESSION TIERS block | Knight (stat 40-80), Master (stat 80-100) | Knight (41-60), Master (61-80), Grandmaster (81-100) |
| COMBAT_END opponent tiers | Used "Adept", "High Master" | Uses canonical T1–T7 with correct stat ranges |

All three sections unified to CLAUDE.md canonical tier names and ranges.

**`Djem So` (spaced) → `DjemSo` in key-path examples** — Three examples in the HOW TO REPORT XP section used `lightsaberForms.Djem So` (with a space). JS normalizes form keys to camelCase no-hyphen (`DjemSo`) after every SHEET parse — a key with a space would never match. Fixed all three to `DjemSo`.

---

### 3. Dead Code Removed

**Dead MOMENTUM_WINDOW switch case** — The `startsWith('MOMENTUM_WINDOW=')` handler at line ~4390 catches this tag and calls `continue`, skipping the switch block entirely. A duplicate `case 'MOMENTUM_WINDOW':` block in the switch was unreachable. Removed.

**Dead WILL_OF_FORCE switch case** — Same pattern: the `startsWith('WILL_OF_FORCE=')` handler runs first and calls `continue`. The `case 'WILL_OF_FORCE':` block in the switch was unreachable. Removed.

> ⚠️ **Known unfixed bug noted during this pass**: The running `startsWith('WILL_OF_FORCE=')` handler uses `characterSheet.alignment += wofGain` (old direct-set logic). The correct implementation should call `addEquilibriumXP(wofGain * 8)` to route through the equilibrium system. The switch case that was just removed had the correct implementation — but since it was dead code (never ran), the bug existed before this cleanup. This is a logic fix deferred to a future session.

**11 `console.log` statements removed** — Debug logging throughout JS removed for production. Confirmed via grep that zero `console.log` calls remain.

---

### Files Changed
- `index.html` (10,357 → 10,252 lines)
- `CLAUDE.md` (Section 2 file table, Section 13 session log, footer updated)
- `Docs/updates.md` (this file — V122–V123 entries added)
- `memory/project_swrpg.md` (updated current version reference)

---

## V123b — 2026-06-10

**Fix: Orphaned `if`-statement syntax error + 429 retry-after parsing**

### Problem 1 — Syntax error kills entire script block after console.log removal

#### Root Cause

During the V123 cleanup pass, 11 `console.log` statements were removed. One of them was the sole body of an `if` statement:

```javascript
if (characterSheet.aptitudes.length < before) {
    console.log('repairTalentConsistency stripped', before - characterSheet.aptitudes.length, 'Force-ability keys from aptitudes');
}
```

After removing the `console.log` line, the `if` block was left with an empty body:

```javascript
if (characterSheet.aptitudes.length < before) {
}
```

This is valid JavaScript. However, inspection revealed the actual remaining code was a bare `if (condition)` with no braces at all — the exact form that causes `SyntaxError: Unexpected token '}'` on the closing `}` of the outer enclosing block. The JS engine chokes before executing a single line, so no event handlers attach: the page renders but every button is dead.

**Symptom:** Game loads on the API key / title screen. No button responds. Looks like a localStorage or save detection problem but is a parse error.

**Diagnosis method:**
```bash
# Extract the script block to a temp file
node -e "const fs=require('fs'); const m=fs.readFileSync('index.html','utf8').match(/<script[^>]*>([\s\S]*?)<\/script>/); fs.writeFileSync('_check.js','export {};\n'+m[1])"
node --input-type=module < _check.js
```

Error returned: `SyntaxError: Unexpected token '}' (line 4090 of extracted JS = line ~5747 of index.html)`.

#### Fix Applied

Removed the orphaned `if` line entirely. The condition had no side effects and the body was empty — the whole block was dead after the log was removed.

**Before:**
```javascript
if (characterSheet.aptitudes.length < before) {
}
```

**After:** (line deleted)

### Problem 2 — Rate-limit 429 retries all failing inside the retry window

#### Root Cause

`callGemini` had a retry loop (up to 3 attempts) with fixed waits of 20 s, 40 s, and 60 s. The Gemini free-tier API responds to a rate-limit 429 with an error message like:

```
Quota exceeded for quota metric 'generate_content_free_tier_input_token_count_per_minute_per_project_per_model'
...
retry the request in 56s
```

The fixed 20 s / 40 s waits fire well before the 56 s window expires — all three retries hit the same rate-limit block. After the third failure the function throws a permanent error that the player cannot dismiss without changing their API key (because `isThinking` stays `true` and the UI never unlocks the send button properly).

#### Fix Applied

Parse the actual retry-after duration from the API error message, add a 3-second buffer, and use that as the wait time. Fall back to `(retryCount + 1) × 25` seconds only when the regex does not match.

**Before:**
```javascript
if (resp.status === 429) {
  const waitMs = (retryCount + 1) * 20000;
  if (retryCount < 3) {
    showRetryMessage(waitMs / 1000, retryCount + 1);
    await sleep(waitMs);
    return callGemini(playerMessage, retryCount + 1);
  }
  throw new Error('Rate limit reached. Please wait and try again.');
}
```

**After:**
```javascript
if (resp.status === 429) {
  const err429 = await resp.json().catch(() => ({}));
  const retryMsg = err429?.error?.message || '';
  const retryMatch = retryMsg.match(/retry in ([\d.]+)s/i);
  const waitSecs = retryMatch
    ? Math.ceil(parseFloat(retryMatch[1])) + 3
    : (retryCount + 1) * 25;
  if (retryCount < 3) {
    showRetryMessage(waitSecs, retryCount + 1);
    await sleep(waitSecs * 1000);
    return callGemini(playerMessage, retryCount + 1);
  } else {
    throw new Error(`Rate limit — API requests retry in ${waitSecs}s. Wait and try again.`);
  }
}
```

### Code Location

- Orphaned `if` removal: `repairTalentConsistency()`, line ~5747 in `index.html` (JS line ~4090)
- 429 retry handler: `callGemini()`, lines ~3884–3893 in `index.html`

### Files Changed
- `index.html`
- `memory/feedback_backtick_bug.md` (added Cause 2: orphaned if-statement after console.log removal)

---

## V123c — 2026-06-10

**Fix: Remove ShatterSense ×0.1 XP discount from `spApplyXP`**

### Root Cause

The `ShatterSense` innate talent was originally designed with a 90% XP cost discount (×0.1 multiplier) on all Shatterpoint XP — this predated the 5× cost formula (`spXPRequired(L) = floor(500 × 1.07^L)` vs the standard `xpRequired(L) = floor(100 × 1.07^L)`).

When the 5× cost formula was introduced as the primary cost differentiation, the ×0.1 discount was not removed from `spApplyXP`. The two mechanisms stacked:

- Standard Shatterpoint XP cost: 5× normal
- With `ShatterSense`: 5× normal × 0.1 = 0.5× normal — cheaper than any regular stat

This meant ShatterSense holders were leveling Shatterpoint at half the cost of a standard skill, which was far below design intent. The talent's documented advantage is passive perception (no roll to detect shatterpoints) and an uncapped track — not a cost discount.

The multiplier code:
```javascript
// before fix — spApplyXP()
const hasInnate = characterSheet.innateTalents?.includes('ShatterSense');
const effectiveXP = hasInnate ? rawAmount * 0.1 : rawAmount;
```

### Fix Applied

Removed the `hasInnate` check and the `* 0.1` branch. All Shatterpoint XP now applies at the full raw amount (discounted only by the 5× cost curve already baked into `spXPRequired`).

**Before:**
```javascript
function spApplyXP(rawAmount) {
  const hasInnate = characterSheet.innateTalents?.includes('ShatterSense');
  const effectiveXP = hasInnate ? rawAmount * 0.1 : rawAmount;
  masterXP.shatterpoint.main.totalXP = (masterXP.shatterpoint.main.totalXP || 0) + effectiveXP;
  spSyncFromTotalXP();
}
```

**After:**
```javascript
function spApplyXP(rawAmount) {
  masterXP.shatterpoint.main.totalXP = (masterXP.shatterpoint.main.totalXP || 0) + rawAmount;
  spSyncFromTotalXP();
}
```

Updated three other locations that referenced the old discount behavior:
- `SIM_INNATE_TALENTS` effect description for `ShatterSense` (removed "XP cost ×0.1" line)
- `buildLoreContext()` AI injection note (~line 9155) — updated to "5× XP cost (no discount)"
- `MASTER_PROMPT` `SHATTERPOINT_XP=` doc comment — removed ×0.1 note

Also updated `CLAUDE.md` Section 4B to reflect the change: "No cost discount — same 5× formula applies."

### Code Location

- `spApplyXP()`: line ~5474 in `index.html`
- `SIM_INNATE_TALENTS` ShatterSense entry: line ~5437
- `buildLoreContext()` AI note: line ~9155

### Files Changed
- `index.html`
- `CLAUDE.md` (Section 4B ShatterSense description)

---

## V123d — 2026-06-10

**Feature: Shatterpoint added to XP Injector modal**

### Root Cause / Missing Feature

The XP Injector modal (`openXPInject()`) iterated only over `characterSheet.forceStats`, `characterSheet.stats`, `characterSheet.forceAbilities`, and `characterSheet.lightsaberForms` to build the stat dropdown. Shatterpoint XP lives in `masterXP.shatterpoint.main.totalXP` — a completely separate track not accessible through any of those four object paths. Players had no way to manually inject XP into the Shatterpoint track through the UI.

### Fixes Applied

**1. Added `shatterpoint.main` entry to the injector dropdown**

In `openXPInject()`, after the Force Abilities section, added:
```javascript
if (masterXP.shatterpoint?.main !== undefined) {
  addGroup('Shatterpoint', [['shatterpoint.main', 'Shatterpoint']]);
}
```

**2. Extended `updatePreview()` to handle `shatterpoint.main` path**

The preview function shows current level and projected XP gain. Added a branch that calls `spDeriveFromTotalXP(currentTotal)` and `spDeriveFromTotalXP(currentTotal + amount)` to display Shatterpoint tier and level in the same format as other stats:

```javascript
} else if (selectedPath === 'shatterpoint.main') {
  const cur = masterXP.shatterpoint?.main?.totalXP || 0;
  const before = spDeriveFromTotalXP(cur);
  const after  = spDeriveFromTotalXP(cur + amount);
  preview.textContent = `Shatterpoint: Level ${before.level} → ${after.level}  (${cur} → ${cur + amount} XP)`;
}
```

**3. Extended `confirmXPInject()` to apply via `spApplyXP`**

```javascript
} else if (selectedPath === 'shatterpoint.main') {
  spApplyXP(amount);
  statLabel = 'Shatterpoint';
}
```

**4. Fixed `statLabel` display** — the confirm function used `selectedPath.split('.').pop()` to derive a display name. Added a `statLabel` variable initialized before the branch block and used in the success toast, so all three path types (standard, shatterpoint, proficiency) show human-readable names.

### Code Location

- `openXPInject()`: line ~6935 in `index.html`
- `updatePreview()` / `confirmXPInject()`: lines ~6960, ~6985

### Files Changed
- `index.html`

---

## V123e — 2026-06-10

**Fix + Feature: Sub-ability proficiency system fully wired (XP injector, simulation, prompt)**

### Root Cause

The sub-ability proficiency system (`masterXP.forceAbilityProficiency`) was added in V111 along with `applyProficiencyXP()`, `deriveProficiency()`, and `FORCE_ABILITY_CATALOG` entries with `par` (parent) pointers. However three consumers were never updated to use it:

1. **XP Injector** — had no entries for sub-ability proficiency paths at all
2. **Simulation panel** — `simBuildActivityOptions()` returned only static `SIM_ACTIVITIES`; proficiency sub-abilities never appeared as trainable activities; `simProcessDay()` used `SIM_ACTIVITIES.find()` directly, missing any dynamically-generated entries
3. **AI Prompt** — `TRAINING:` examples listed `TRAINING: forceAbilities.ForcePush` implying sub-abilities had base-ability entries in `masterXP.forceAbilities`. This caused the AI to write `TRAINING: forceAbilities.ForcePush`, which created a phantom `masterXP.forceAbilities.ForcePush` entry that `syncMasterXPToSheet()` then treated as a real ability — inflating displayed Force ability count and wasting XP in the wrong track.

**Result:** Players training Force Push received Telekinesis base XP (correct, via trickle) but zero proficiency progression. ForcePush showed `Novice (0%)` indefinitely regardless of training.

### Fixes Applied

**1. XP Injector: sub-ability proficiency section**

In `openXPInject()`, after the Shatterpoint section, added a dynamic section that iterates `FORCE_ABILITY_CATALOG` to find sub-abilities (`cat.par !== null`) whose parent exists in `characterSheet.forceAbilities`, and exposes them as `proficiency.ParentKey.SubKey` paths:

```javascript
const profPaths = [];
if (typeof FORCE_ABILITY_CATALOG !== 'undefined') {
  for (const [subKey, cat] of Object.entries(FORCE_ABILITY_CATALOG)) {
    if (!cat.par) continue;
    if (!(cat.par in (characterSheet.forceAbilities || {}))) continue;
    profPaths.push([
      `proficiency.${cat.par}.${subKey}`,
      `${cat.label || subKey} (${cat.par})`
    ]);
  }
}
if (profPaths.length) addGroup('Sub-Ability Proficiency', profPaths);
```

**2. XP Injector: `updatePreview()` proficiency branch**

Added a branch for paths starting with `proficiency.` that computes the discount-adjusted effective XP, derives current and projected percentage via `deriveProficiency()`, and displays the proficiency tier and any tier transition:

```javascript
} else if (selectedPath.startsWith('proficiency.')) {
  const compositeKey = selectedPath.slice(12);           // "Telekinesis.ForcePush"
  const parentKey = compositeKey.split('.')[0];
  const subKey    = compositeKey.split('.')[1];
  const entry     = masterXP.forceAbilityProficiency?.[compositeKey];
  const D         = entry?.D || (FORCE_ABILITY_CATALOG[subKey]?.D ?? 1.0);
  const curProfXP = entry?.totalProfXP || 0;
  const baseLevel = deriveLevel(masterXP.forceAbilities?.[parentKey]?.totalXP || 0);
  const fc        = deriveLevel(masterXP.forceStats?.forceControl?.totalXP || 0);
  const discount  = profBaseAbilityFactor(baseLevel) * profControlFactor(fc);
  const effAdded  = amount / discount;
  const before    = deriveProficiency(curProfXP, D);
  const after     = deriveProficiency(curProfXP + effAdded, D);
  preview.textContent =
    `${subKey}: ${before.tier} (${Math.round(before.percentage)}%) → ` +
    `${after.tier} (${Math.round(after.percentage)}%)  [discount ×${discount.toFixed(2)}]`;
}
```

**3. XP Injector: `confirmXPInject()` proficiency branch**

```javascript
} else if (selectedPath.startsWith('proficiency.')) {
  const compositeKey = selectedPath.slice(12);
  const parentKey = compositeKey.split('.')[0];
  const subKey    = compositeKey.split('.')[1];
  applyProficiencyXP(parentKey, subKey, amount);
  statLabel = `${subKey} proficiency`;
}
```

**4. Simulation panel: dynamic proficiency activity generation**

In `simBuildActivityOptions(cs)`, after building the static activity list, appended one entry per sub-ability whose parent is in `cs.forceAbilities`:

```javascript
// Dynamic proficiency activities
if (typeof FORCE_ABILITY_CATALOG !== 'undefined') {
  for (const [subKey, cat] of Object.entries(FORCE_ABILITY_CATALOG)) {
    if (!cat.par) continue;
    if (!(cat.par in (cs.forceAbilities || {}))) continue;
    allActivities.push({
      id: `prof_${cat.par}_${subKey}`,
      label: `${cat.label || subKey} Practice`,
      category: 'proficiency',
      isProficiency: true,
      profKey: `${cat.par}.${subKey}`,
      parentKey: cat.par,
      subKey: subKey,
      D: cat.D ?? 1.0,
      weights: [{ stat: `forceAbilities.${cat.par}`, w: 0.6 }, { stat: `forceStats.forceControl`, w: 0.4 }],
      strainBias: { force: 1.8, mental: 1.0, physical: 0.3 },
      unlock: () => true
    });
  }
}
```

**5. Simulation panel: `simProcessDay()` activity lookup fix**

Was: `SIM_ACTIVITIES.find(a => a.id === actId) || simCustomDrills.find(...)` — missed the dynamically-generated proficiency entries.

Changed to: `simBuildActivityOptions(cs).find(a => a.id === actId)` so all three activity sources (static, custom drills, proficiency) are searched.

Added a `profXPGained = {}` accumulator. Added `isProficiency` branch in the per-hour loop:

```javascript
if (act.isProficiency) {
  const rawXP = baseXP * actWeight * strainPenalty;
  profXPGained[act.profKey] = (profXPGained[act.profKey] || 0) + rawXP;
}
```

After the hours loop, applied accumulated proficiency XP:
```javascript
for (const [compositeKey, rawXP] of Object.entries(profXPGained)) {
  const [parentKey, subKey] = compositeKey.split('.');
  applyProficiencyXP(parentKey, subKey, rawXP);
}
```

**6. Simulation complete card: proficiency progress display**

In `finishSimulation()`, added a `proficiency.*` special case before the standard `category.key` split. Renders a purple progress bar row showing percentage gained and proficiency tier, with a tier-transition tag if the tier changed:

```javascript
if (p.startsWith('proficiency.')) {
  const compositeKey = p.slice(12);
  const subKey = compositeKey.slice(compositeKey.indexOf('.') + 1);
  const entry  = masterXP.forceAbilityProficiency?.[compositeKey];
  const D      = entry?.D || 1.0;
  const curTotal   = entry?.totalProfXP || 0;
  const afterPct   = deriveProficiency(curTotal, D).percentage;
  const afterTier  = deriveProficiency(curTotal, D).tier;
  const beforePct  = deriveProficiency(Math.max(0, curTotal - xpGained), D).percentage;
  const beforeTier = deriveProficiency(Math.max(0, curTotal - xpGained), D).tier;
  const pctGained  = Math.round(afterPct - beforePct);
  const tierTag    = (beforeTier !== afterTier)
    ? `<span class="sim-tier-tag">${afterTier}</span>` : '';
  // ... renders purple bar row with % display and tier tag
  continue;
}
```

**7. AI Prompt fix: sub-abilities removed from `TRAINING:` examples**

Removed `ForcePush` from the `TRAINING:` format example section. Added explicit rules:

```
Sub-abilities (ForcePush, ForceStorm, etc.) are NOT valid TRAINING: targets.
Use PROFICIENCY: ParentAbility.SubAbility,xpAmount instead.
When narrating sub-ability training, include BOTH:
  TRAINING: forceAbilities.Telekinesis, hours, intensity, difficulty, outcome
  PROFICIENCY: Telekinesis.ForcePush, xpAmount
```

This prevents phantom `masterXP.forceAbilities.ForcePush` entries being created.

### Code Location

- `openXPInject()` proficiency section: line ~6940 in `index.html`
- `updatePreview()` proficiency branch: line ~6965
- `confirmXPInject()` proficiency branch: line ~6990
- `simBuildActivityOptions()` dynamic section: line ~9257
- `simProcessDay()` activity lookup + proficiency branch: line ~9843
- `finishSimulation()` proficiency card section: line ~9992
- Prompt `TRAINING:` sub-ability rules: MASTER_PROMPT section ~line 1750

### Files Changed
- `index.html`

---
