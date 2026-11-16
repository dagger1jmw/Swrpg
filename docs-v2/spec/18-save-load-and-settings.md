# 18 — Save/Load and Settings (legacy V170 audit)

Audited: `legacy/index.html` (V170). All line numbers were checked against the file.

## What it does for the player
- The game autosaves to the browser after turns, sims and panel edits. There are 5 named manual slots (Save / Load buttons).
- On page load, if a Gemini API key is stored, the game skips the key screen and loads the autosave. Without a key, the key screen shows "Save detected — Turn N".
- The API key is entered on the title screen, or changed later with a browser `prompt()` (Settings).
- "New Game" asks for confirmation, then resets memory and state.

## Rules and formulas
| Item | Value | Source |
|---|---|---|
| `SAVE_SLOTS` | 5 | legacy/index.html:2790 |
| Storage keys | `sw_rpg_autosave`, `sw_rpg_save_1..5`, `sw_rpg_gemini_key`, `sw_rpg_custom_drills` | legacy/index.html:8211, 12424, 2799, 11689 |
| Save object | slot, name, savedAt (ISO), turnCount, masterXP, characterSheet, worldState, campaignSummary, galaxySimState, lastGalaxyEventDate, recentHistory, fullHistory (last 200), feedHtml (last 50 `.msg` outerHTML) | legacy/index.html:8227-8249 |
| Not saved | `activeCombat`, sim state, `trimmedTurns`, `isSummarizing` | legacy/index.html:8227-8249 (absent) |
| Autosave | `JSON.stringify` → setItem; on exception shows "⚠ Save Failed!" and a system message | legacy/index.html:8207-8225 |
| Startup | key length > 10 → `showGame(); tryAutoLoad()`; else key screen + save-detected message | legacy/index.html:2797-2863 |
| `tryAutoLoad` | parse autosave → `loadFromSave`; parse error → visible warning + welcome | legacy/index.html:2865-2881 |
| Key entry (title) | trimmed, must be ≥ 20 chars | legacy/index.html:3468-3478 |
| Key entry (settings) | `prompt()`, must be > 10 chars, **not trimmed**, stored as plain text | legacy/index.html:3516-3523 |
| Key transport | sent as a `?key=` URL query parameter to generativelanguage.googleapis.com | e.g. legacy/index.html:3680, 4617, 4661, 4693 |
| New game | `confirm()` → `startNewGame()` resets globals; **does not clear `sw_rpg_autosave`**, `activeCombat` or sim state | legacy/index.html:3639-3643, 3542-3568 |

### Migrations done by `loadFromSave` (8251-8370)
| Migration | Lines |
|---|---|
| Strain maximums below 100 raised to 100 | 8257-8259 |
| Default `darkPressure`, `momentumWindow`, `lastLightActs`, `birthday {0,0,0,'BBY'}`, `innateTalents`, `innateAbilities` | 8261-8266 |
| Seed `forceStats.forceOutput`, `stats.intelligence` to 0 | 8268-8271 |
| Derive `rank` from `lifeStage` | 8273-8276 |
| masterXP old `{stat,current}` → `{totalXP}` | 8279-8291 |
| Shatterpoint track restore (fix for an "L5 reset on load") | 8292-8295 |
| Proficiency `{totalProfXP, D}` | 8296-8298 |
| No masterXP → rebuild from the sheet's `*XP` stores | 8299-8316 |
| Repair pass: `syncMasterXPToSheet`, `spSeedIfInnate`, `repairTalentConsistency`, `repairForceAbilities` | 8321 |
| World: `normalizeWorldState`, `seedCanonProfiles`, `repairCharacterProfiles` | 8323-8327 |
| `conversationHistory` (pre-split saves) → recent (last 12) and full history | 8331-8334 |

There is no save version number. Each migration is a field-presence check.

## State read / written
- **Writes:** all of `turnCount, characterSheet, masterXP, worldState, campaignSummary, galaxySimState, lastGalaxyEventDate, recentHistory, fullHistory, trimmedTurns` and the `#story-feed` innerHTML.
- **Reads:** localStorage keys listed above.

## AI provides vs. code computes
Code does everything. The AI is not involved, except that its prose is saved inside `feedHtml` and restored as raw HTML.

## Known bugs and fragile spots
1. **One corrupt slot breaks the Save/Load dialog.** `openSaveLoad` calls `JSON.parse(raw)` with no try/catch (12425), so the whole modal throws and won't open.
2. **Manual saves can fail with no message.** The slot `localStorage.setItem` has no try/catch (12445, 12468): when quota is exceeded, the player gets no "Game saved!" and no error. Each manual save also writes a second full copy through `autoSave()` (12446, 12469), doubling storage use.
3. **Combat is lost on reload.** `activeCombat` is not saved (8227-8249), so a reload mid-combat drops the fight. Accumulated combat strain is also lost (it is kept only in `activeCombat` until the fight ends).
4. **New Game can be undone by a reload.** "New Game" does not clear the autosave (3542-3568), so reloading the page before the next autosave brings the old game back. It also leaves `activeCombat` and sim globals untouched.
5. **Save data is restored as live HTML.** `feedHtml` is set as `innerHTML` (8338), including AI text. Choice buttons are rebound to `callGemini` by text (8339-8345). Save names typed by the player are inserted into innerHTML unescaped (12437).
6. **The API key is exposed.** It is stored in plain text and sent in the URL query string, so it can end up in logs and history. The two entry points validate it differently (≥20 trimmed vs >10 untrimmed).
7. **No save versioning.** Migrations rely on missing-field checks (8255-8334). A field that is present but stale (for example a wrong type) is never migrated.
8. **Load does not clean up session state.** `loadFromSave` does not reset `isSummarizing`, `activeCombat` or open panels. When `campaignSummary` is set it shows "N recent turns" using `recentHistory.length / 2`, which counts sync pairs as turns.
9. **Saves are large.** fullHistory (up to 200 messages) + feedHtml (50 messages) + full character sheet every turn. Docs/updates.md (lines ~2214-2256) records repeated quota failures.

## Conflicts between sources
- The trim notice "Your full save history is preserved" (6386) contradicts the save contents (fullHistory is cut to 12 after a summary at 3696, and the feed is cut to 50 at 8246).
- v170-audit.md "Decisions needed": "V170 saves: decided. Not imported; v2 starts a new campaign". So none of the migrations above carry over.

## Replaced by
- V170 save import: decided not to import (v170-audit.md "Decisions needed").
- The v2 save format, autosave, slots and key handling: **None — needs a v2 spec.**

## Open questions for Jared
1. Is localStorage still the target for v2 saves, or IndexedDB / file export, given the size history?
2. Should the Gemini key stay in browser storage (GitHub Pages has no backend), and should it be sent in a header instead of the URL?
3. Should mid-combat and mid-sim state be saved, so a reload resumes exactly?
4. Keep 5 manual slots plus an autosave, or switch to a per-campaign save history?
