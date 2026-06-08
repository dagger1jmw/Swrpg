# SWRPG Engine Updates

Detailed change log for each version. CLAUDE.md session log references this file for specifics.

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
