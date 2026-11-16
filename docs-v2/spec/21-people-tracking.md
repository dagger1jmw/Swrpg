# 21 — People Tracking / Relationships (legacy V170 audit)

Scope: the People panel data model (`worldState.trackedCharacters`, `interactionWeights`, the `characterProfiles.visibleInPeople` bridge), the `KNOWN_PERSON=` and `INTERACTION=` tags, `repairCharacterProfiles`, and `getSceneNPCs`.

NPC stat generation and opponent lifecycle are covered in the NPC-generation audit file; this file covers only the relationship and "who the player knows" layer.

## What it does for the player

- The **People** header button opens a list of known characters. Each card shows name, title, relation (Ally / Mentor / Hostile / other), summary and last seen (`legacy/index.html:8172-8194`).
- Characters enter the list in two ways:
  1. **Directly:** the AI sends `KNOWN_PERSON=` (the prompt says to do so every turn for everyone in the scene).
  2. **Indirectly:** the AI sends `INTERACTION=` tags. Each tag adds weight; once the total reaches 5, a "◆ Profile added: Name" card appears and the person is added.
- Relationship is a free-text label written by the AI. There are no numbers, trust, affinity, or drift over time.

## Rules and formulas

| Rule | Value | Source |
|---|---|---|
| Interaction weight per tag | combat 3, training 2, force 2, dialogue 1 (unknown types count 1) | `legacy/index.html:5671-5672`; prompt `1753` |
| Visibility threshold | `interactionWeights[name] ≥ 5` sets `visibleInPeople=true` and pushes to `trackedCharacters` | `5693-5704` |
| GENERATE_PROFILE visibility | becomes visible if the weight is already ≥5 (no push to `trackedCharacters`; the push happens later via `repairCharacterProfiles`) | `5601-5610` |
| KNOWN_PERSON merge | overwrites fields that are present; keeps old title / relation / summary / lastSeen when a field is blank; default lastSeen = current date | `5719-5739` |
| Relation CSS class | ally / mentor / hostile, else neutral (the prompt also lists Rival / Friend / Unknown / Neutral, which render as neutral) | `8185`; prompt `1906` |
| Load-time repair | every `characterProfiles` entry with `visibleInPeople` not in `trackedCharacters` gets added | `7018-7034` |
| Scene presence | uses `worldState.sceneNPCs` if set. Otherwise: the `NPC_HOME_LOCATIONS` substring match, plus any tracked character whose `lastSeen` first comma segment is a substring of the location | `3926-3943` |
| Protection | `trackedCharacters`, `characterProfiles` and `interactionWeights` are snapshotted before the WORLD JSON parse and restored after it | `4881-4883`, `4902-4904` |

## State read / written

- **Written:**
  - `worldState.trackedCharacters[]` with fields `{name, title, relation, summary, lastSeen}`
  - `worldState.interactionWeights{name: number}`
  - `worldState.characterProfiles[name]`: `visibleInPeople`, `displayName`, `description`, `tier`, `stats`, `lifecycleState`, `firstMet` (stub created by INTERACTION, `5687-5691`)
  - `activeCombat.opponent` via `syncCombatOpponentName` when INTERACTION names a placeholder opponent (`5682-5685`)
- **Read:** `buildEventInjection` → `getSceneNPCs` (`3966`), which drives which NPC agendas and events are injected.

## AI provides vs. code computes

- **AI provides:** every name, title, relation label, summary and lastSeen string, plus the interaction type.
- **Code computes:** the interaction weight sum, the visibility threshold, the merge, and scene presence by substring match.
- No relationship value exists in code. "Mentor" vs "Hostile" is whatever the AI last wrote.

## Known bugs and fragile spots

1. **Prompt cost.** The prompt asks for `KNOWN_PERSON=` "EVERY TURN for any character who appears or is referenced" (`1902-1904`). This inflates every response, and `autoSave()` runs once per tag (`5738`).
2. **Names are keyed by the exact string.** "Master Denko", "Denko" and "Master Denko " create separate entries. There is no alias or normalization (`5724`, `5686`).
3. **INTERACTION stubs pollute `characterProfiles`.** INTERACTION creates a stats-less stub (`5687-5691`). This was the V159 root cause, where a later `CHARACTER:` lookup found the empty stub. Only `syncCombatOpponentName` papers over it.
4. **INTERACTION can rename the combat opponent.** It still syncs to a bystander if the opponent name starts with "the/a/an" (`5680-5685`). This is the V169 guard, and it is heuristic.
5. **Scene presence is a string-substring heuristic** (`3937-3940`). A `lastSeen` of "Day 5 Frostuary, Training Salle" yields "day 5 frostuary", which never matches a location. The format the prompt teaches (`1901`) puts the date first, so this branch effectively never fires.
6. **People data is rendered unescaped** via `innerHTML` (`8186-8191`, `5707`).
7. **No removal path.** Dead or forgotten NPCs stay listed forever. `lifecycleState: 'deceased'` is not shown on the card.
8. **Two parallel records per person.** `trackedCharacters` (UI) and `characterProfiles` (stats) are kept in sync only on creation; `title`/`summary` never update from profile changes.

## Conflicts between sources

- **Format of the INTERACTION tag:** the prompt teaches `INTERACTION=Name|type` (`1753`, `1910`), but prompt line `1795` and the V159/V169 notes write `INTERACTION:` with a colon. The shared key split, `/^([A-Za-z_][A-Za-z0-9_\s\-]+?)\s*=\s*(.+)$/` (`legacy/index.html:5296`), only matches the `=` form, so a colon-form INTERACTION tag is silently dropped.
- **Relationship mechanics:** `Docs/SW_Legends_RPG_Master_Prompt_v7_1.md` has no numeric relationship system; it only mentions relationships in the override examples (lines 918 and 931). Code matches the doc here: labels only.

## Replaced by

None — needs a v2 spec. Partly touched by:
- `npc-generation.md`: NPC identity and stats
- `ai-events.md`: the AI proposes events and never writes the arrays
- `training-routines.md` §7: "relationship drift (training partners and teachers gain relationship from shared sessions)", which implies a numeric relationship model that has no spec yet

## Open questions for Jared

1. Should relationships be numeric in v2 (trust/affinity per NPC, drifting with shared time, as training-routines §7 implies), or stay as story labels?
2. When should an NPC appear in People: on first meeting, after repeated interaction, or only when the story marks them important?
3. Should dead or departed NPCs stay listed (with status) or be archived?
