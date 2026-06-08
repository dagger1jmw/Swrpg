# SWRPG Engine Updates

Detailed change log for each version. CLAUDE.md session log references this file for specifics.

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
