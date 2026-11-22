# 14 — World State, Galaxy Events and Story Flags (legacy V170 audit)

Audited: `legacy/index.html` (V170). All line numbers were checked against the file.

## What it does for the player
- Side panels show World Log, Galaxy Simulation events, Legacy Changes, Lineage, People and Story Threads.
- Story threads ("pending events") and NPC agendas are injected into the AI prompt each turn so the AI keeps recurring plots going. Overdue threads get louder ("MUST ADDRESS THIS TURN").
- Hardcoded Jedi/Sith milestones (for example "Sith Trials available") add story threads when stat thresholds are met.
- Background galaxy events queued by the AI surface in a later turn's prompt.
- Story flags (for example "Mace Windu Alive" or "Sith Text Access") are ON/OFF toggles in the Sim panel's Flags tab.

## Rules and formulas
| Rule | Value | Source |
|---|---|---|
| worldState shape at creation | location, era, inGameDate, inGameTime, lastEvent, legacyChanges[], lineageRecord[], worldLog[], galaxyEvents[], galaxyState{jediOrder,sith,republic,mandalorians,underworld}, trackedCharacters[], characterProfiles{}, interactionWeights{}, pendingEvents[], npcAgendas{}, galaxyEventQueue[], sceneNPCs[], lastMilestoneCheck, storyFlags{} | legacy/index.html:3432-3439 |
| Shape normalizer | fixes arrays and objects | legacy/index.html:3944-3958 |
| Overdue | `overdueBy = max(0, today − triggerDate)` in absolute days | legacy/index.html:3915-3919 |
| Escalation | overdue ≥3 → `critical` (from **any** priority, including low); overdue ≥1 and medium → `high` | legacy/index.html:3920-3921 |
| Must fire | `critical && overdueBy ≥ 2` | legacy/index.html:3922 |
| Injection caps | ≤2 critical, ≤2 high, medium only while total < 5; low never injected | legacy/index.html:3973-3977 |
| NPC agendas | only for NPCs in the scene; top 3 per NPC by priority | legacy/index.html:3989-4001 |
| Scene NPCs | explicit `sceneNPCs`, else matched by `NPC_HOME_LOCATIONS` substring, else `trackedCharacters.lastSeen` location prefix | legacy/index.html:3926-3942 |
| Galaxy queue | first 2 unsurfaced events are injected and marked `surfaced=true` | legacy/index.html:4003-4011 |
| Milestones | `JEDI_MILESTONES` / `SITH_MILESTONES`; Sith list used if faction contains "sith" or alignment < −50; added once by id | legacy/index.html:3883-3911 |
| World log | AI's worldLog is discarded; on a WORLD parse failure, code adds the first narrative line ≤120 chars; capped at 20 | legacy/index.html:4907, 6167-6173 |
| galaxySimState | `{faction: event}` from `worldState.galaxyEvents` + `worldState.activeThreats` | legacy/index.html:6153-6166 |
| Story flags list | `SIM_FLAGS` (maceLiving, maceTrustEstablished, aingTiiContact, aingTiiApproved, fallanassiContact, jediArchiveAccess, sithTextAccess, jediCouncilPermission) | legacy/index.html:8752-8761 (v2, D-370: maceLiving and maceTrustEstablished are replaced by the Vaapad teacher-or-records gate; jediCouncilPermission is Juyo only) |
| Flag toggle | `worldState.storyFlags[key] = !…` (player only) | legacy/index.html:11678-11684 |
| Ability flags | `FORCE_ABILITY_CATALOG[*].flags` ("required worldState.storyFlags[] entries") | legacy/index.html:8772, e.g. 8812, 8905-8908, 8929-8934 |
| Canon intent | canon events occur unless the player realistically interferes; Legacy Changes have Strength ratings | SW_Legends_RPG_Master_Prompt_v7_1.md lines 20, 685-698 |

## State read / written
- **Owned by code** (snapshotted at 4879-4892 and restored at 4902-4913 after every WORLD parse): trackedCharacters, characterProfiles, interactionWeights, npcAgendas, pendingEvents, worldLog, galaxyEventQueue, galaxyEvents, legacyChanges, lineageRecord, storyFlags, galaxyState, inGameDate, inGameTime.
- **AI-writable through the WORLD JSON** (anything not in that list): location, era, lastEvent, sceneNPCs, lastMilestoneCheck, activeThreats, `_mergedLog`, plus any extra keys the AI invents. Keys the AI leaves out are deleted.
- Globals: `galaxySimState`, `lastGalaxyEventDate` (2787-2788), both saved (8237-8238).
- `characterSheet.storyFlags` (3424) is a second, separate flag store. It is snapshot-protected (4754, 4789) and nothing else writes it.

## AI provides vs. code computes
- **AI provides** (CHANGES tags): PENDING_EVENT, NPC_AGENDA, RESOLVE_EVENT, RESOLVE_NPC_AGENDA, SCENE_NPCS, GALAXY_EVENT, KNOWN_PERSON, INTERACTION. Through the WORLD JSON it also provides location, era and activeThreats.
- **Code computes:** milestones, overdue and escalation, which NPCs are in the scene, injection selection, and the surfaced flag.

## Known bugs and fragile spots
1. **Four world fields are frozen forever (since V125).** `galaxyEvents`, `legacyChanges`, `lineageRecord` and `galaxyState` are restored from the snapshot after every WORLD parse (4909-4913), and no CHANGES tag or other code path writes them. The comment at 4877-4878 says they are "set via CHANGES tags", but no such tags exist. The Galaxy, Legacy and Lineage panels stay empty. The prompt always shows `Jedi=?, Sith=?` (4092) and `LEGACY CHANGES: []` (4096). The prompt still tells the AI to write galaxyEvents (1897). Introduced in Docs/updates.md V125 (line ~1245).
2. **`lastGalaxyEventDate` never updates.** It depends on new galaxyEvents (6158-6159), which are discarded by bug 1.
3. **Critical events sort as lowest.** `priorityOrder[x]||3` turns `critical` (0) into 3 (3970, 3994), so critical events sort last. Injection still picks them through the `critCount` branch, but in sorted order behind high and medium.
4. **Every thread escalates to critical.** Any thread, including low ones, becomes critical after 3 in-game days (3920). Milestones are created with `triggerDate = today` (3895), so every unresolved milestone becomes "MUST ADDRESS THIS TURN" after 3 days.
5. **Unparseable trigger dates behave by era.** `dateToAbsoluteDays` returns 0 for an AI-written `triggerDate` it cannot parse (7678). In BBY campaigns today is negative, so overdueBy is always 0 and the event never escalates. In ABY it would be overdue immediately.
6. **Building the prompt has side effects.** `buildEventInjection()` marks galaxy events `surfaced = true` (4008) and runs `checkMilestones()` (3963) while building the prompt. `buildContext` runs up to 3 times per turn (4604 main, 4656 truncation continuation, 4688 missing-choices recovery). Events are therefore marked surfaced even if the request fails, or they appear only in the continuation call.
7. **Story flags do nothing.** `storyFlags` are never read by any rule. The catalog `flags` arrays are never checked (no `.flags` read anywhere), and the flags are not sent to the AI (`buildContext` 4018-4135 has no storyFlags line).
8. **Two flag stores.** `characterSheet.storyFlags` and `worldState.storyFlags` both exist.
9. **Out-of-era flags.** `SIM_FLAGS` includes Mace Windu flags, which make no sense for the default 3661 BBY era.
10. **The world log is lost if the AI forgets a field.** `_mergedLog` is not snapshot-protected, so it disappears whenever the AI omits it (it is rebuilt from `worldLog` at 8062-8086). The log is stamped with `turnCount` before the turn increments (8067).
11. **Scene matching by substring is loose.** Location/lastSeen matching (3930-3938) can match broadly, for example `lastSeen` "Day 5 Frostuary" against the location.

## Conflicts between sources
- Master Prompt v7.1 (lines 685-698) describes Legacy Changes with Strength ratings, and the timeline doc (lines ~470-476) describes Legacy Change processing (status `modified`/`cancelled`, galaxyEventQueue notice, lineageRecord log). The code has no writer for legacyChanges or lineageRecord at all (bug 1).
- Docs/updates.md V125 says the AI WORLD JSON "only controls ... location, inGameDate, inGameTime, currentScene, sceneNPCs". In code, inGameDate and inGameTime are also restored (4928, 4932), so that statement is out of date.
- Milestone thresholds are tuned to the old curve. See v170-audit.md "Milestones (rework)". Owned by another audit area.

## Replaced by
- Event application in general: Replaced by ai-events.md (AI returns schema-checked events; code applies them).
- NPC stats and growth: Replaced by npc-generation.md.
- Galaxy simulation, story threads, Legacy Changes and story flags as systems: **None — needs a v2 spec.**

## Open questions for Jared
1. Do you want a code-driven galaxy simulation (canon events firing on date unless changed), or only AI-proposed background events?
2. Should Legacy Changes and the lineage record come back in v2? Both have been dead since V125.
3. Should story flags be set by story events (proposed by the AI, checked by code) rather than toggled by the player, and should they gate abilities as the catalog intended?
4. What escalation do you want for overdue story threads? (Today every thread becomes "must address" after 3 days.)
