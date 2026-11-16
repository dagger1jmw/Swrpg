# 20 — UI Panels (legacy V170 audit)

Scope: CSS `legacy/index.html:13-1081`, HTML `legacy/index.html:1083-1696`, and the render/panel JS. The render/panel JS covers:
- `renderGMMessage`, `renderPlayerMessage`, `renderSystemMessage`, `escapeHtml` and `updateUI` (`legacy/index.html:6368-6525`)
- `updateCharacterSheet` (`7309-7656`)
- `updateWorldState`, `togglePanel`, `renderCharactersPanel` and `updateTimeDisplay` (`8007-8202`)
- the XP inject panel (`8375-8539`)
- `showGame` and `openApiSettings` (`3516-3540`)
- init (`2797-2862`)

The calendar internals, saves and the sim panel internals are covered in other files. This file covers the shells only.

## What it does for the player

- **Header** (`legacy/index.html:1087-1107`). A title and 12 buttons in a single non-wrapping flex row: Character, World Log, People, Simulate, Sync, XP, Talents, Save, Load, New Game, Clear Cache and API Key. A save indicator sits beside them. Most buttons are hidden until `showGame()` (`3525-3539`).
- **API key screen** (`1110-1157`). Setup steps, the key input, and a "save detected" message filled in on init (`2823-2837`).
- **Character creation screen** (`1160-1297`). This is a 3-column grid that collapses to 1 column below 860 px (`224`); its logic is covered by another feature file.
- **Game layout** (`1300-1438`):
  - left: the character sheet panel (hidden until toggled)
  - center: the story area (location / time / date bar, story feed, "thinking" dots, input with override hint)
  - right: the World Log panel (world log, galaxy events, legacy changes, lineage) or the People panel
  - Only one side panel is open at a time (`togglePanel`, `8151-8170`).
- **Character sheet** (`updateCharacterSheet`). It shows, in order:
  - name and sub-line
  - 7-tier alignment bar with marker
  - dark pressure bar (if above 0)
  - HP; Force Barrier (if defined); 3 strain bars
  - injuries
  - Force stats with XP bars
  - Force abilities with proficiency sub-bars
  - lightsaber forms
  - lightsaber color swatches and type select (these write state directly)
  - core stats; renown; inventory and credits; legacy `innatetalent`
  - Shatterpoint section; traits
- **People panel** (`renderCharactersPanel`). Cards for each `worldState.trackedCharacters` entry, with expand-on-tap.
- **XP inject modal** (`1442-1467`, `8375-8539`). Pick any stat, form, ability, Shatterpoint or proficiency path; enter an amount; see a live before→after preview; inject. A green "XP INJECTED" card is posted to the feed.
- **Settings.** There is no settings panel. "API Key" opens a `prompt()` (`3516-3523`). "Clear Cache" wipes `localStorage` except the key, the autosave and slots 1-5 (`8565-8591`).
- **Message rendering:**
  - **GM text** is split line by line into text, roll blocks and choice buttons (`6415-6482`).
  - **Choice lines** are lines matching `^[A-E]\)`, `^[A-E]\s*[.\-)]` or `^Custom:` (`6431`). They become buttons that send that text.
  - **Roll blocks** start at `Action:/Difficulty:/Tactical Setup Bonuses:/Attacker:/Defender:` and end at `Result:` (`6432-6442`). They are HTML-escaped and highlighted.
  - **Player text** goes through `escapeHtml` (`6484-6492`).
  - **Feed trimming:** the feed is capped at 100 `.msg-gm/.msg-player/.msg-system` nodes, with a notice at the top (`6368-6391`).

## Rules and formulas

| Item | Value | Source |
|---|---|---|
| Alignment tier labels | ≥76 Luminous, ≥26 Attuned, ≥1 Calm, ≥−25 Balanced, ≥−50 Shadowed, ≥−75 Corrupted, else Consumed | `legacy/index.html:7317-7325` |
| Alignment marker position | `(alignment+100)/200 × 100%` | `7331` |
| HP penalty label (sheet) | hp ≥76 none; ≥51 −1 Hurt; ≥26 −2 Wounded; ≥11 −3 Critical; else −5 Near Death | `7424-7427` (duplicates `getHPThresholdPenalty`, `10583`) |
| Force tier label | `['', Untrained, Padawan, Knight, Master, Legendary][s.forceTier]` | `7348-7349` (5 names, not the 7-tier scale in `legacy/CLAUDE.md` §3D) |
| Proficiency color bands | ≥91 gold, ≥71 blue, ≥51 green, ≥26 grey, else dark | `7491` |
| Shatterpoint focus color | >70 red (tunnel vision), >40 orange | `7603` |
| Lightsaber colors / types | 9 colors; training, standard, shoto, double-bladed, curved-hilt | `7531-7534` |
| Feed DOM cap | `MAX_DOM_TURNS = 100` | `6368` |
| Mobile breakpoint | ≤700 px: the sheet and log panels become `position:fixed` overlays, `height: calc(100vh − 47px)` | `1060-1071` |
| Input box | 15 px font, 44-160 px auto-grow; Enter sends, Shift+Enter adds a newline | `592-606`, `2841-2852` |

## State read / written

- **Reads:**
  - `characterSheet`: name, species, faction, rank, age, alignment, darkPressure, momentumWindow, hp/maxHp, forceBarrier/maxForceBarrier, the strains and their maxes, injuries, painChannelActive, forceTier, forceStats/forceStatsXP, forceAbilities/forceAbilitiesXP, lightsaberForms/lightsaberFormsXP, lightsaber, stats/statsXP, renown, inventory, credits, innatetalent, innateTalents, tunnelVision, shatterpointFocus, lastShatterpointMisread, strengths, weaknesses, aptitudes.
  - `masterXP.forceAbilityProficiency` and `masterXP.shatterpoint`.
  - `worldState`: location, inGameTime, inGameDate, worldLog, galaxyEvents, legacyChanges, lineageRecord, trackedCharacters.
  - Also `CC_RANKS`.
- **Writes (UI code that mutates game state):**
  - `updateWorldState` sets `characterSheet.age` (`8015`) and rewrites `worldState.inGameDate` in two places (`8045`, `8054`). It also overwrites the latest `worldLog` entry's `turn` (`8067`) and stores `worldState._mergedLog` (`8086`).
  - The lightsaber swatches and select write `characterSheet.lightsaber.color/type` from inline `onclick` (`7538`, `7541`).
  - XP inject calls `applyXPToSheet`, `spApplyXP` or `applyProficiencyXP` (`8497-8506`).
  - `updateCombatStrain` writes strain bar widths and labels straight to the DOM (`legacy/index.html:6662-6683`).
  - `openApiSettings` sets `apiKey` and `localStorage.sw_rpg_gemini_key`.

## AI provides vs. code computes

- **AI provides (unescaped, then rendered as HTML):**
  - character name, species, faction
  - injury labels, inventory items, aptitudes, strengths, weaknesses
  - world log events, galaxy events, legacy changes, lineage
  - People panel name, title, relation, summary, lastSeen
  - choice lines and roll-block text (the roll block is escaped)
- **Code computes:** every bar percentage, tier labels, the HP penalty label, proficiency effective %, XP-bar fractions (from `*XP` mirrors written by `syncMasterXPToSheet`), and the age (from the birthday).
- GM narration is rendered with `textContent`, so it is safe.

## Known bugs and fragile spots

1. **Unescaped AI text is set as `innerHTML`.** This covers `s.name`, inventory, aptitudes, strengths and weaknesses, injury labels (`7353`, `7419`, `7583`, `7642-7650`), world log, galaxy events, legacy and lineage (`8093`, `8108-8113`, `8129-8142`), People cards (`8187-8191`), the "Profile added: name" card (`legacy/index.html:5707`), and custom drill names (`11797-11798`). A stray `<` from the AI breaks the layout, and markup or script injection is possible. `escapeHtml` exists but is used only twice (`6488`, `6498`), and it does not escape quotes.
2. **HP of 0 shows as full.** `s.hp||100` (`7335`, `7383`, `7423`) displays 100/100 with no penalty when HP is 0.
3. **The sheet is fully re-rendered on every `updateUI`** (`7655`). Scroll position, open selects and focus are lost, and the live combat strain preview written by `updateCombatStrain` (`6662-6683`) is wiped back to the stored value. The bars then flip between two numbers.
4. **The force tier label** uses a 5-name array indexed by `s.forceTier`, which is an AI/creation field (`3416`). It is unrelated to `getCharForceTier()` (`6893`).
5. **World log merge keyed by turn number** (`8072-8082`). Several entries in the same turn overwrite each other, and string entries use `str_${Date.now()}` keys, which collide within one loop. In practice `worldLog` only grows on WORLD-parse failure (`legacy/index.html:6168-6172`) or a simulation (`12137`), because the AI's own `worldLog` is reverted by the WORLD snapshot (`4886`, `4907`). The World Log panel is mostly empty in normal play.
6. **Legacy Changes and Lineage panels can never fill.** They are snapshot-restored on every WORLD parse (`4889-4890`, `4910-4911`), and no tag writes them (see `24-legacy-renown-lineage.md`).
7. **People panel does not refresh** while open, except when INTERACTION or KNOWN_PERSON fire (`5714`, `5737`). It does not refresh after load (`togglePanel`, `8168`).
8. **The chars panel width is `var(--panel-w)`, which is never defined** (`803`), so its width falls back to auto. At ≤700 px only the sheet and log panels become fixed overlays (`1061`); People squeezes the story column.
9. **The header row does not wrap.** 12 buttons in a non-wrapping flex row (`98`) overflow on iPad portrait and phones, and there is no menu collapse.
10. **iOS concerns:**
    - `#player-input` is 15 px (`599`), below 16 px, so iOS Safari zooms on focus.
    - `100vh` (`1066`) ignores the Safari toolbar and the on-screen keyboard.
    - No `safe-area-inset` padding.
    - Sim and calendar bodies use `overflow-y:auto` (`932`, `891`), against `legacy/CLAUDE.md` §9H, which asks for `scroll` with momentum.
    - `prompt()`, `confirm()` and `alert()` are used for the API key, Sync, Clear Cache, abort and pause.
11. **Choice detection is too loose.** `^[A-E]\s*[.\-)]` (`6431`) turns narration lines that start with a capital A-E followed by `.`, `-` or `)` into buttons, for example "A-wing fighters scream overhead" or "B. ...". The roll-line regex `\- .+:\s*[+-]` (`6433`) captures narrative bullet lists.
12. **Choice buttons do not check `isThinking`/`gameActive`** (`6474`), so a double-tap sends two turns. `sendMessage` checks both (`6399`).
13. **Feed trimming ignores other card types.** It counts only `.msg-gm/.msg-player/.msg-system` (`6374`). XP cards, sim cards, banners and birthday notices (`.msg` only) are never trimmed.
14. **Save/load modal click guard is a no-op.** `onclick="e=>e.stopPropagation()"` defines a function and never calls it (`1470`). It is harmless only because `closeModal` checks `e.target` (`12482-12485`).
15. **Clear Cache is mislabeled.** The "OK = clear display only" confirm (`8567`) erases the custom drills (`sw_rpg_custom_drills`) and any other keys. The `fullWipe` path is dead (`8571`).
16. **Stale setup text.** The API screen points to `starwars_rpg.html` and "Gemini 2.0 Flash, 15 req/min" (`1124`, `1150`, `3504`), but the code calls `gemini-2.5-flash` (`12372`).
17. **XP inject is invisible to the AI.** It bypasses talent multipliers and momentum and never tells the AI (no history entry). The proficiency preview divides by the discount, while `applyProficiencyXP` applies its own discount (`8455-8460` vs `8504`); whether these match depends on that function.
18. **Debug tools are always shown to the player** in the header: Sync, XP, Talents, Clear Cache.

## Conflicts between sources

- `Docs/CLAUDE changelog.md` §UI Structure says:
  - a "[Turn N]" header item: there is none in the HTML
  - a fixed bottom bar with Location | Time | Date: the location bar is at the top of the story area (`1312-1318`)
  - the Shatterpoint display inside the Force Abilities section: it is a separate section (`7593-7632`)
- **Force tier names:** `legacy/CLAUDE.md` §3D uses 7 tiers (Initiate … Transcendent). The sheet uses 5 (Untrained … Legendary) (`7348`).
- **Talents tab copy:** the Talents tab says "AI cannot modify" (`1651`). `legacy/CLAUDE.md` §7D allows the AI to set talents during creation.

## Replaced by

None — needs a v2 spec (UI shell / layout, message rendering and escaping, panel set, iPad layout rules). Related decided specs:
- `ai-events.md`: the AI never writes displayed state.
- `health.md`: tiredness meters, vitality and wounds replace the HP and strain bars.
- `alignment.md`: alignment display.
- The v170-audit "Engine/UI separation: Replace" verdict applies: UI must only read state.

## Open questions for Jared

1. Is the iPad the only target, portrait and landscape? Should side panels be overlays or a tab bar on iPad?
2. Should debug tools (XP inject, strain sync, talent/flag overrides, clear cache) stay player-visible, move behind a developer toggle, or be removed?
3. Should the AI keep offering lettered A-E choice buttons, or is free text the only input?
4. Which sheet sections must stay visible at a glance (for example the alignment bar and fatigue meters), and which can collapse?
5. Should the lightsaber color/type picker stay a free player toggle, or become story-owned equipment?
