# Legacy AI contract (V170)

Every structured tag the AI emits in V170, its format, where the prompt teaches it, where code parses it and what that does to state. Sections 6 and 9 list every place code parses free narrative text. Line numbers refer to `legacy/index.html`. Sections 1–7 are the primary inventory from the AI-pipeline audit (19-ai-pipeline.md); sections 8–10 merge what the other feature audits found.

This documents legacy behaviour only. In v2 all of it is replaced by schema-checked events (`ai-events.md`).

All parser lines are in legacy/index.html. "Prompt" = where MASTER_PROMPT (1702-2774) teaches it. CHANGES lines are parsed one at a time in a loop (5059-5897). Handlers are checked in order: explicit `startsWith` handlers first (5065-5488), then a generic `KEY=value` regex `^([A-Za-z_][A-Za-z0-9_\s\-]+?)\s*=\s*(.+)$` (5296), then `switch(key)` (5498-5896). **A tag with no `=` that is not handled by `startsWith` can never reach the switch.**

## 1. Block delimiters

| Block | Format | Prompt | Parser | What code does |
|---|---|---|---|---|
| SHEET | `<<<SHEET>>>{json}<<<END_SHEET>>>` | 1722-1724, 1882-1885 (asked for twice) | 4711-4712 (two regexes, the second tolerant) | `JSON.parse`. Fallback: first `{...}` (4774-4779). Replaces `characterSheet`, then restores the protected list (4784-4803), rebuilds aptitudes, runs `syncMasterXPToSheet` (4833), normalizes form keys |
| WORLD | `<<<WORLD>>>{json}<<<END_WORLD>>>` | 1887-1889 | 4713-4714 | Replaces `worldState`, restores 12 JS-owned keys plus date and time (4901-4932), checks momentum expiry |
| CHANGES | `<<<CHANGES>>>…<<<END_CHANGES>>>` | 1726-1781 | 5054 | Line loop (5059+). Also pre-scanned for LIFE_STAGE/RANK (4736-4751) and for strain activity (5057) |
| Choices | `A)`…`D)`, `Custom:` | 1709-1716 | 4684 (presence check), 6431 (`/^[A-E]\)/`, `/^[A-E]\s*[\.\-\)]/`, `/^Custom:/`) | Rendered as buttons that call `callGemini` |
| Pre-roll reply | `COMBAT_START:` / `ROLL_OPPOSED:` / `ROLL_LABEL=` / `TIER_GAP=` / `TACTICAL=` or `NO_ROLL_NEEDED` | pre-roll prompt 4491-4519 | 4532-4552 | Starts combat (new fight), fires the roll via `scanAndFireRollTags`, sets `preRolledForCurrentTurn` |

## 2. Roll tags (scanned across the WHOLE response, not only CHANGES) — `scanAndFireRollTags` 4347-4456

Skipped when the pre-roll fired (4989-4993).

| Tag | Format | Prompt | Parser | Effect / guards |
|---|---|---|---|---|
| ROLL: | `ROLL:path1|path2|path3` | 1955-1959 | 4353-4354 | Starts a pending solo roll. It fires only when ROLL_LABEL= follows. **No label means no roll** |
| ROLL_OPPOSED: | `ROLL_OPPOSED:paths vs CHARACTER:Name` or `vs INLINE:k=v,...` | 1961-1971, 2213-2218 | 4355-4436 | Form lock (4362-4370). CHARACTER name reconciled or overridden to the combat opponent (4378-4386). Profile stats flattened. INLINE stats saved once to a `disposable` profile and reused afterward (4396-4434). A missing `vs` clause gives a tier fallback |
| TIER_GAP= | `TIER_GAP=n` | 2033-2035 | 4437-4438 | `pending.tierGap`. fireRoll overrides it with the computed tier gap when the opponent tier is known (10881-10885) |
| TACTICAL= | `TACTICAL=n` | 2002-2054 | 4439-4440 | `pending.tactical` (the cap is in fireRoll) |
| ROLL_LABEL= | `ROLL_LABEL=text` | 1958+ | 4441-4450 | **Trigger:** `backfillOppStats`, count of opposed rolls, `fireRoll(pending)` |

After this, display text strips lines starting with ROLL:/ROLL_OPPOSED:/TIER_GAP=/TACTICAL=/ROLL_LABEL= (6130).

## 3. CHANGES `startsWith` handlers (in parse order)

| Tag | Format | Prompt | Parser | Effect / guards |
|---|---|---|---|---|
| COMBAT_START: | `COMBAT_START: name, intensity` | 1792-1798 | pre-scan over all rawText 4958-4965; loop 5065-5079 | `startCombat`. Skipped if the pre-scan already applied it. If the pre-roll started combat, it only renames the opponent |
| COMBAT_ROUND: | `COMBAT_ROUND: n, intensity` | 1799-1800 | 5081-5089 | `updateCombatStrain(rounds)`. rounds = JS-counted rolls if >0, else the AI's n. Safety net 6102-6107 |
| COMBAT_END: | `COMBAT_END: primary, secondary|none, tier, engagement, outcome[, fate]` | 1801-1814 | 5093-5107 | Rebuilds a stub `activeCombat` if missing (round 5, tier 2). `endCombat(outcome, engagement)`, then `npcApplyFate` |
| TRAINING: | `TRAINING: cat.Key, hours, intensity, difficulty, outcome` | 1783-1789, 1834-1848 | 5109-5149 | Hours guard (≤2× elapsed). shatterpoint perception block. Sub-ability redirected to proficiency. `calcTrainingXP`, then momentum, then talent multiplier, then `applyXPToSheet` |
| COMBAT: | `COMBAT: path, rounds, tierGap, engagement, outcome[, secondary: path2]` | only mentioned ("TRAINING: or COMBAT: lines") 1783, 1828, 1831 | 5151-5172 | `calcCombatXP`, applied to primary and secondary |
| PROFICIENCY: | `PROFICIENCY: Abil.Sub, xp` | 1842-1852 | 5174-5199 | Sub must be in the catalog with `par === Abil`. Momentum applied. `applyProficiencyXP` |
| LOCATION= / LOCATION: | — | not taught | 5201 | Ignored (no-op) |
| XP: | `XP: cat.Key, amount` | **not taught** | 5205-5221 | Direct XP (momentum applied). shatterpoint perception guard |
| LIFE_STAGE= / : | `LIFE_STAGE=value` | **not taught** (legacy/CLAUDE.md:345) | pre-scan 4738-4742; loop 5225-5232 | Whitelist of 7 stages |
| RANK= / : | `RANK=value` | 1771-1775 | pre-scan 4744-4750; loop 5239-5246 | `RANK_VALID_VALUES`; lifeStage via `RANK_LIFESTAGE_MAP` |
| MOMENTUM_WINDOW= | `mult,days` | 1777, 2616 | 5250-5266 | 0 closes; expiry computed |
| WILL_OF_FORCE= | `gain,desc` | 1778, 2599-2604 | 5269-5293 | alignment +gain, equilibrium XP +gain×8, feed banner |
| INJURY_ADD= | `part,severity,label[,permanent]` | 1733 | 5347-5360 | Severity whitelist; replaces the injury on the same part |
| INJURY_HEAL= | `part` | 1734 | 5362-5368 | Keeps permanent injuries |
| INJURY_HEAL_ALL | (no value) | 1735 | 5370-5375 | Keeps permanent injuries |
| STORY_HEAL= | `part` | 1736 | 5377-5383 | Removes any injury on that part |
| OPP_INJURY_ADD= | `part,severity,label` | 1737 | 5385-5395 | Only if `activeCombat`. **No severity whitelist** |
| OPP_INJURY_HEAL= | `part` | 1738 | 5397-5403 | |
| OPP_INJURY_HEAL_ALL | — | 1739 | 5405-5408 | |
| OPP_INJURY_PERMANENT= | `part,desc` | 1740 | 5410-5422 | Writes the profile's `permanentInjuries`; creates a stub profile |
| DOMINANT_HAND= | `right|left` | 1741 | 5424-5431 | SHEET-protected otherwise |
| FIGHTING_HAND= | `right|left` | 1742 | 5433-5437 | |
| PAIN_CHANNEL= | `active|inactive` | 1743 | 5439-5443 | **No alignment ≤ −25 check** (the prompt says the AI must only use it at ≤ −25) |
| COMBAT_END_CRASH | — | 1744 | 5445-5458 | HP-scaled physical strain surge. Not gated on combat |
| NPC_LIFECYCLE= | `name,state` | 1769 | 5465-5476 | Profile must exist; `deceased` is one-way |
| RECURRING_RETURN= | `name,tierBump` | 1770 | 5482-5496 | **slice(18) drops the first letter of the name, so it is always a no-op** |

## 4. Generic `KEY=value` regex (5296), then special prefix and `switch(key)`

| Tag | Format | Prompt | Parser | Effect / guards |
|---|---|---|---|---|
| XP_<Stat>= | `XP_forceSense=45` | **not taught** | 5303-5343 | Sets `*XP[k].current` directly (bypasses masterXP; overwritten on the next sync) |
| HP= | `HP=n` | 1728 | 5499 | Absolute set, numeric only. No clamp |
| FORCE_STRAIN= / PHYSICAL_STRAIN= / MENTAL_STRAIN= | `n` (new total) | 1729-1731 | 5500-5534 | Delta vs current. Increase blocked if no activity or if in combat. Endurance mitigation on increases. Clamped to 0..max |
| FORCE_BARRIER= | `n` | 1732 | 5535 | Absolute set |
| SHATTERPOINT_PERCEIVED= | `tier,desc` | 1746 (`=`), 2540 (`:`) | 5536-5557 | **slice(22) includes the `=`, so tier is always 1.** The colon form never matches. Feed banner |
| SHATTERPOINT_ROLL= | `target` | 1747 (`=`), 2493/2543 (`:`) | 5558-5563 | **slice(17) means the target starts with `=`.** Colon form dropped. `spPerformRoll` |
| SHATTERPOINT_FOCUS= | `0-100` | 1748, 2547 | 5565-5569 | `spSetFocus` |
| SHATTERPOINT_FOCUS_CLEAR | (no value) | 1749, 2553 | 5571-5574 | **Unreachable:** no `=`, so the regex at 5296 fails |
| SHATTERPOINT_XP= | `n` | 1750, 2556 | 5576-5587 | `spApplyXP`, logged in XP |
| SHATTERPOINT_MISREAD_RESOLVED | (no value) | 1751, 2559 | 5589-5592 | **Unreachable** (same reason) |
| GENERATE_PROFILE= | `name|canon/custom|desc` | 1760 | 5594-5612 | **slice(16) means the name starts with `=`, creating an orphan profile `"=Name"`** |
| PROFILE_STATS= | `name|cat.key=v,...` | 1761 | 5614-5633 | Profile must exist. Sets stats as written |
| NPC_ROLL= | `name|archetype|tier[|flags]` | 1762-1768 | 5635-5665 | `npcGenerateStats`. Existing profile merged; disposable unless `recurring` |
| INTERACTION= | `name|type` | 1753, 1909 | 5667-5717 | Weight. Renames a placeholder opponent. Stub profile. At ≥5 weight, bridged to trackedCharacters and a banner shown |
| KNOWN_PERSON= | `name|title|relation|summary|lastSeen` | 1752, 1899-1907 | 5719-5741 | Upsert into trackedCharacters. **Calls autoSave mid-parse** |
| PENDING_EVENT= | `id|type|date|priority|summary|context|npcs` | 1754 | 5743-5759 | Insert if the id is new |
| NPC_AGENDA= | `npc|priority|summary|context` | 1755 | 5761-5777 | Dedupe by summary |
| RESOLVE_EVENT= | `id` | 1756 | 5779-5785 | Marks the event resolved |
| RESOLVE_NPC_AGENDA= | `npc|keyword` | 1757 | 5787-5795 | Removes by substring. **An empty keyword removes all of that NPC's agendas** |
| SCENE_NPCS= | `A,B` | 1758 | 5797-5801 | Replaces sceneNPCs (it is also WORLD JSON, unprotected) |
| GALAXY_EVENT= | `summary|context` | 1759 | 5803-5813 | Queue entry |
| ALIGNMENT_XP= | `n` | 1745, 2580-2597 | 5815-5819 | `addEquilibriumXP(n)` |
| ALIGNMENT= | `n` | taught as deprecated, 2620 | 5821-5825 | `addEquilibriumXP(n × 20)` |
| DARK_PRESSURE= | `0-100 total` | 1776, 2607-2614 | 5827-5868 | Clamp. Discharge at 100 (see the feature file) |
| SURRENDER_DISCOUNT= | `0-0.5` | 1779, 2617 | 5869-5874 | Clamp |
| FORCE_SENSE= MEDITATION= FORCE_KNOWLEDGE= FORCE_CONTROL= FORCE_OUTPUT= STRENGTH= AGILITY= ENDURANCE= WILLPOWER= CHARISMA= INTELLIGENCE= | `n` | **not taught** (forbidden in spirit, 2366) | 5875-5885 | **Direct stat set, bypassing XP**; no isNaN guard (a string value is stored) |
| AGE= | `n` | not taught (legacy/CLAUDE.md:404 says never) | 5886 | Direct set |
| CREDITS= | `n` | not taught | 5887 | Direct set |
| `<AbilityOrFormKey>=n` (default) | e.g. `Telekinesis=40` | not taught | 5888-5894 | **Direct set of an ability or form level**, bypassing XP |

Off-by-one check (verified with node). These slices are correct: PROFILE_STATS(14), NPC_ROLL(9), INTERACTION(12), KNOWN_PERSON(13), PENDING_EVENT(14), NPC_AGENDA(11), RESOLVE_EVENT(14), RESOLVE_NPC_AGENDA(19), SCENE_NPCS(11), GALAXY_EVENT(13), NPC_LIFECYCLE(14), OPP_INJURY_PERMANENT(21). These are wrong: SHATTERPOINT_PERCEIVED(22), SHATTERPOINT_ROLL(17), GENERATE_PROFILE(16), RECURRING_RETURN(18).

## 5. Free-text inputs the code reads

- **`[OVERRIDE]`/`[LORE CHECK]`/`[SYSTEM EXPAND]`/`[WORLD ADJUST]`/`[CORRECTION]`/`[AUTHOR NOTE]`** prefixes on the *player* message (4571-4578; prompt 2739-2747). They skip the pre-roll and render the reply as a system message. The CHANGES/SHEET/WORLD from an override reply are still fully applied.
- **`BEGIN_GAME`** player message gets substituted (4580-4582).
- **`Time Elapsed:`** (prompt 2686-2700, buildContext rule 2), see §6.

## 6. Regex scans of AI prose / raw text that write state

`rt` = narrative before `<<<CHANGES>>>` (5903-5904). For the clock and date, `rt` = all rawText with `**` stripped (6177).

| # | Line | Regex / match | Extracts | Writes |
|---|---|---|---|---|
| 1 | 4540 | `/^COMBAT_START:\s*(.+)$/m` on the pre-roll reply | opponent, intensity | `startCombat` (activeCombat) |
| 2 | 4959 | `/^\s*COMBAT_START:\s*(.+)$/m` on **all** rawText (outside CHANGES too) | opponent, intensity | `startCombat` |
| 3 | 4347-4456 | Line-prefix scan for ROLL tags across all rawText | roll spec | fireRoll, profiles, lockedForm |
| 4 | 5036-5045 | first line matching `/time elapsed/i`, then `(\d+(?:\.\d+)?)\s*hour`, `(\d+)\s*min` | hours | `turnElapsedHours` (TRAINING guard, minor-injury clear 5048-5050, alignment tick 6267-6269) |
| 5 | 5913-5926 | `\bForce|Physical|Mental\s*Strain\s*:[^.\n]*?(?:→|->)\s*(\d+)` (last match) | value | `forceStrain/physicalStrain/mentalStrain`. **No combat or activity guard** |
| 6 | 5929-5940 | `\b… Strain\s+(?:reduced|lowered|dropped)\s+to\s+(\d+)` | value | same three fields |
| 7 | 5943 | `fully restored.*(strain|0 force|0 physical)|all strain.*(cleared|0)|(strain|fatigue).*fully.*(restored|recovered)` | — | all three strains = 0 |
| 8 | 5950 | `(\d+)\s*Force[^,\n]*,\s*(\d+)\s*Physical[^,\n]*,\s*(?:and\s*)?(\d+)\s*Mental\s*Strain` | 3 values | three strains |
| 9 | 5959 | `barrier.*(dissipat|fad|releas|drop|collaps|fell|broke|shatter)|(dissipat|releas|let go).*barrier` | — | `forceBarrier = 0` |
| 10 | 5963 | `(Force\s*Barrier|barrier)[^.\n]*?(:|at|to|=)\s*(\d+)` | value | `forceBarrier` |
| 11 | 5977 | `\*?\s*([A-Za-z][A-Za-z\s\-]+?):\s*\+(\d+(?:\.\d+)?)\s*XP` on **rawText** (only if no TRAINING:/COMBAT:) | name, xp | `applyXPToSheet(path, xp×50)` |
| 12 | 6005 | `([A-Za-z][A-Za-z\s]+?):\s*\+(\d+)\s*XP.*?(->|→|\(now\s+)(\d+)\/(\d+)` | current/required | `*XP[k] = {current, required}` directly (no gate) |
| 13 | 6035-6099 | markdown sheet: `includes('**name:**' | '**strain:**' | '**forceStats:**' | '**forceStrain:**' | '**physicalStrain:**')`, then `\*\*field:\*\*\s*([^\n*]+)` and the JSON variant | forceStrain/strain, physicalStrain, mentalStrain, hp, alignment, forceStats, forceAbilities, stats | Strains (combat-guarded on increase only), **hp, alignment, forceStats, stats replaced wholesale**, forceAbilities filtered to root catalog keys |
| 14 | 6189-6199 | `/time elapsed/i` line, then `hour`, `min`, `sec` | minutes | `worldState.inGameTime`; date on midnight crossings (6219) |
| 15 | 6229-6258 | lines matching `/time elapsed|it is now|it is currently/i`, then `(?:on\s+)?Day\s+(\d+)\s+(Month)(?:\s+[—\-]\s+(\d{3,4})\s*(BBY|ABY))?` | day/month/year/era | `worldState.inGameDate` (forward only) |
| 16 | 6273-6286 | `COMBAT END|combat (concluded|ended|finished|complete|over)|sparring (session )?(concluded|ended|complete)|fight (concluded|ended|over)` + `/win|victor|success/`, `/loss|lost|defeat/` + form-name `includes` | outcome, primary skill | `endCombat(outcome,'mixed')` (XP and strain applied) |
| 17 | 4683-4684 | `/^[A-E]\)/m` on narrative | — | triggers the missing-choices API call |
| 18 | 4650-4652 | `includes('<<<END_WORLD>>>')` | — | triggers the continuation API call |
| 19 | 6131-6132 | `\*\*Revised Character Sheet…`, `\*\*Character Sheet…` | — | display only (replaced with a notice) |
| 20 | 6431-6434 | choices and roll-block line classifiers in renderGMMessage | — | display only (buttons, roll boxes) |

That makes 16 state-writing scans (rows 1-16) plus 4 display/control scans in this area, about 30 distinct regexes. The audit's "35" is plausible once regexes in other areas (simulation, sync tool) are added; Area A cannot confirm it alone.

## 7. Context directives the AI must obey (from buildContext)

- `✅ THIS EXCHANGE — ALREADY RESOLVED` (pre-rolled) vs `⚠ LAST EXCHANGE RESULT` (deferred), in the state block and the trailing reminder.
- `SHATTERPOINT INTERPRETATION PENDING` with outcome directives (fail/contested/solid/strong/overwhelming).
- `Locked Form`, `Current Round`, `Accumulated strain so far` (to be echoed verbatim).
- 11 numbered "CRITICAL RULES FOR THIS TURN", a forged model "Confirmed" turn, and a `[TURN N — REQUIRED …]` suffix on the user message.

## 8. Additions from other areas

Tag behaviour that sections 1–7 don't cover, found by the feature agents (B–H). The full per-feature context is in the NN feature files.

| Tag / block | Note | Lines | File |
|---|---|---|---|
| `NO_ROLL_NEEDED` | Literal reply from the pre-roll call. The pre-roll returns false and the turn uses the old deferred roll path | 4505, 4517, 4533 | 08-combat.md |
| `COMBAT_END:` 6th field (fate) | killed → deceased; fled/captured/recurring → dormant; disposed → profile deleted if disposable. Deceased is permanent. A disposed opponent stays in `trackedCharacters` | 3128-3145 | 02-npc-generation.md |
| `PAIN_CHANNEL=` | Not checked when set; the alignment ≤ −25 gate is applied only at roll time. The flag persists across turns through the snapshot restore | 5439-5443, 10657, 4728, 4803 | 10-injury-health-strain.md |
| `FORCE_BARRIER=` | `isNaN` check only: no clamp to `maxForceBarrier`, no check that the barrier is learned. Nothing outside the display reads the value | 5535, 4064, 7386-7394 | 05-force-abilities.md |
| `ALIGNMENT:` (colon form, documented in the XP Reference) | Never matches the generic regex; only `ALIGNMENT=` works | 5296, 5821 | 11-alignment.md |
| `LIFE_STAGE=` + `RANK=` in the same reply | The pre-scan prefers RANK; the main loop applies them in line order, so the result depends on order | 4738-4750, 5225-5246 | 12-milestones-rank-life-stage.md |
| `INTERACTION:` (colon form, written in the prompt at 1795) | Silently dropped: the key regex needs `=` | 1795, 5296 | 21-people-tracking.md |
| SHEET JSON: items and species | `lightsaber` is restored; `species`, `inventory`, `credits`, `backstory`, `discoveryAge` are AI-owned | 4764, 4798, 4775 | 22-equipment-and-items.md, 23-species.md |
| SHEET JSON: XP stores | `*XP[k].current` from the AI (or `XP_<Stat>=`) is added to total XP when a stat is first seeded into `masterXP`, so AI numbers become real XP | 7136-7155, 7142-7151 | 03-stats-and-xp.md |
| SHEET JSON: `renown{}` | Fully AI-owned; displayed and fed back into the prompt. Mandalorian renown is tracked but never sent | 1724, 2748-2750, 4085, 7566-7577 | 24-legacy-renown-lineage.md |
| WORLD JSON: `galaxyEvents`, `legacyChanges`, `lineageRecord`, `galaxyState`, `worldLog`, `storyFlags` | The prompt asks the AI to maintain them, but the snapshot restore reverts them every turn (dead since V125). Only JS fallbacks append to `worldLog` | 1889, 2732-2737, 4886-4892, 4907-4913, 6168-6172 | 14-world-state-and-events.md, 24-legacy-renown-lineage.md |
| WORLD JSON: `activeThreats` | Merged into `galaxySimState` with `Object.assign`, no validation | 6163-6165 | 14-world-state-and-events.md |
| WORLD JSON: everything else | `location`, `era`, `lastEvent`, `sceneNPCs`, `activeThreats`, `lastMilestoneCheck`, `_mergedLog` are AI-owned; keys the AI omits are deleted | 4874-4934 | 14-world-state-and-events.md |
| `NPC_ROLL=` (ability side) | Seeds `stats.forceAbilities` with the archetype's root abilities, with no catalog gates | 3098-3111 | 05-force-abilities.md |
| Simulator AI calls (free text, no tags) | `simApiCall` for the weekly summary (replaces the log text), the overtraining sentence (appended), and the transition scene (rendered and pushed to `recentHistory`/`fullHistory`). Token caps of 180/100 include Gemini 2.5 thinking tokens, so replies can come back empty | 12066-12077, 12287-12335, 12372 | 17-training-simulator.md |

## 9. More places code reads free text (outside callGemini)

| Line | Match | Extracts | Writes | File |
|---|---|---|---|---|
| 10742-10755 (`extractOppFormFromLabel`) | Roll label normalized, then a substring match against `CANON_FORM_KEYS` (excluding the player's form) | Opponent's form | `characterProfiles[opp].stats.lightsaberForms[form]` via `backfillOppStats` (persisted). `Shien` is checked before `ShienDjemSo`, so "Shien/Djem So" resolves to `Shien` | 09-rolls-and-opponents.md, 05-force-abilities.md |
| 4380-4386, 5682-5685 | `/^(the \|a \|an )/i` on `activeCombat.opponent` | Whether the opponent name is a placeholder | Lets `syncCombatOpponentName` rename the opponent and move profile stats | 09-rolls-and-opponents.md |
| 3933-3940 (`getSceneNPCs`) | Location keywords (`NPC_HOME_LOCATIONS`) and `lastSeen.split(',')[0]` matched as substrings of `worldState.location` | NPCs presumed present | Not stored; drives NPC agenda injection. The taught `lastSeen` format starts with the date, so this never matches | 21-people-tracking.md |
| 4845-4848 (`normalizeKey`) | Strips non-alphanumerics from AI form keys, then looks them up in `_FORM_CANON` | Canonical form key | Renames keys in `masterXP.lightsaberForms` and `characterSheet.lightsaberForms`. `Kii-Shikk` never matches | 05-force-abilities.md |
| 10567 | `key.replace(/[^a-zA-Z0-9]/g,'')` + capitalise | Form key for roll lookup | Read only | 09-rolls-and-opponents.md |
| 7700-7729 (`parseDateString`) | `Day X, Cycle Y`; `(\d{3,4})\s*(BBY\|ABY)`; `Day X MonthName`; `Day X` | Year, era, day of year | Read helper used by every date writer. The 3–4 digit year breaks 1–2 digit eras (BUG-026) | 13-calendar-and-time.md |
| 8039-8054 (`updateWorldState`, a **render** function) | Stored date has no GSC month name → `(\d{3,4})\s*(BBY\|ABY)` + `Day\s*(\d+)`; else `parseDateString` | Year, day | **Rewrites `worldState.inGameDate`** and age during UI render | 13-calendar-and-time.md, 20-ui-panels.md |
| 11024-11025 | `inGameDate.match(/(\d{3,5})\s*BBY/)` | Current BBY year | Lore selection only; falls back to 3661 | 16-lore-injection.md |
| 6168-6171 | First `displayText` line over 20 chars (when the WORLD parse fails) | 120-char summary | `worldState.worldLog.push` | 15-story-memory.md |
| 6184 | `inGameTime.match(/\((\d{2}):(\d{2})\)/)` | Previous time | Clock base; no match means the clock freezes | 13-calendar-and-time.md |
| 7785 | `inGameTime.match(/\((\d{2}:\d{2})\)/)` | HH:MM | Calendar setter prefill (UI) | 13-calendar-and-time.md |
| 6432-6442 | Roll-block line classifiers (`Action:`, `d20=`, `Result:`, `Margin:` …) | — | Display only | 20-ui-panels.md |

## 10. Counts

- **CHANGES tag forms:** about 60, of which 15 are untaught direct-set or XP forms the parser still accepts.
- **Roll tags** scanned across the whole reply: 5 (`ROLL:`, `ROLL_OPPOSED:`, `TIER_GAP=`, `TACTICAL=`, `ROLL_LABEL=`), plus `NO_ROLL_NEEDED` in the pre-roll reply.
- **JSON blocks** that replace whole state objects: 2 (SHEET, WORLD).
- **Free-text scans that write state:** 16 in `callGemini` (§6), plus about 6 elsewhere (§9: form label, placeholder name, normalizeKey, render-time date rewrite, worldLog fallback, clock base). Total regex count across the file is roughly 35, matching v170-audit.md.
- **Tags taught in two incompatible forms:** `SHATTERPOINT_PERCEIVED`, `SHATTERPOINT_ROLL` (`=` and `:`), `INTERACTION` (`=` and `:`), `ALIGNMENT` (`=` and `:`). Only the `=` form works.
- **Tags that can never run as taught:** `SHATTERPOINT_FOCUS_CLEAR`, `SHATTERPOINT_MISREAD_RESOLVED`, `RECURRING_RETURN`. `GENERATE_PROFILE` runs but writes the wrong key.
- **v2 replacement:** every tag and scan above is replaced by schema-checked events in `ai-events.md`. Owners for KNOWN_PERSON, INTERACTION, PENDING_EVENT, NPC_AGENDA, RESOLVE_*, SCENE_NPCS and GALAXY_EVENT still need deciding (see open questions). *(Amended by D-31 and D-62: the owners are decided in architecture.md §3 (event catalog and legacy tag mapping), which supersedes ai-events.md.)*
