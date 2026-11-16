# 08 — Combat (legacy V170 audit)

Scope: combat lifecycle (`COMBAT_START:` / `COMBAT_ROUND:` / `COMBAT_END:`), one exchange per turn, the 3-10 s time budget, `startCombat` / `endCombat`, the V162 pre-roll two-call flow and the V170 same-turn opening, combat strain accumulation, combat XP, `getCharDuelingTier`, and the ground-truth banners (V154/V156). The roll math itself is in `09-rolls-and-opponents.md`. Sheet strain/HP/injuries are in `10-injury-health-strain.md`.

## What it does for the player

- The player describes an action. If it starts or continues a fight, a small secondary Gemini call (the "pre-roll") picks the form/stat paths for this exchange. JS then rolls d20s for both sides **before** the main story call, so the story is written to match a result that is already known (V162; V170 extended this to the turn that opens combat).
- Each turn resolves about one exchange (3-10 seconds of fighting). A JS roll card shows both sides' bonuses, the margin and a result label.
- If the pre-roll fails or isn't used, the old "deferred" model runs: the AI declares the roll at the end of its reply, JS rolls after the story was written, a "dice are final; narrative may not match" notice appears (V156), and next turn a "Last Exchange — Resolved" banner states the real outcome (V154).
- Strain builds up in a hidden combat tally. The bars show a live preview, and the tally is added to the sheet when the AI emits `COMBAT_END:`. XP for the fight's main (and optional secondary) skill is awarded at the same moment.
- The opponent's profile gets a "fate" (killed / fled / captured / recurring / disposed) at combat end.

## Rules and formulas

| Constant / formula | Value | Source |
| --- | --- | --- |
| `activeCombat` initial shape | `{opponent, intensity:'standard', round:1, accPhysical:0, accForce:0, accMental:0, momentum:'Neutral', startTime, primarySkill:null, secondarySkill:null, tierGap:0, oppInjuries:[], lockedForm:null}` | legacy/index.html:6538-6553 |
| Intensities | light, sparring, standard, intense, desperate | legacy/index.html:6626-6632 |
| Per-exchange strain base (P/F/M) | light & sparring 1.3/1.0/0.7; standard 2.5/2.0/1.3; intense 4.0/3.3/2.0; desperate 6.5/5.0/3.3; unknown intensity → standard | legacy/index.html:6626-6632 (V160; was ~3x higher: Docs/updates.md V160) |
| Tier strain factor | gap>0: `max(0.4, 1 − 0.15·gap)`; gap<0: `min(1.8, 1 + 0.2·|gap|)`; gap 0: 1 | legacy/index.html:6637-6640 |
| Endurance mitigation | `em = compressedBonus(endurance ‖ 30) / 6`; P ×(1−em), F ×(1−0.5em), M ×(1−0.3em) | legacy/index.html:6619-6620, 6643-6645 |
| Per-exchange accumulation | `acc += round1dp(base · tierFactor · mitigation) · rounds`; `round += rounds` | legacy/index.html:6642-6646 |
| Control Pain Force cost (combat only) | `sevSum` (minor 1, moderate 2, severe 3, critical 5) · `min(CP,100)/100` · 3.0 → work; efficiency `max(0.10, 1 − 0.8·CP/100)`; cost = `floor(work·eff)·rounds`, added to `accForce` | legacy/index.html:6648-6660; Docs/SW_Injury_System_v1.md §6A |
| Strain applied at end | sheet pool = `min(max, pool + acc)` for all three | legacy/index.html:6585-6590 |
| Rounds counted per turn | JS-counted opposed rolls this turn override the AI's `COMBAT_ROUND:` number; pre-rolled turn counts as 1 | legacy/index.html:4997-5001, 5084-5086 |
| Safety net if AI omits `COMBAT_ROUND:` | `updateCombatStrain(combatRollsThisTurn, intensity)` | legacy/index.html:6100-6105 |
| Combat XP base by opponent tier | `[0, 50, 120, 300, 750, 1800, 4500, 11000]` (index = tier 0-7) | legacy/index.html:7103; prompt legacy/index.html:1815 |
| Duration factor | rounds ≤3: 0.5; ≤10: 1.0; else 1.5 | legacy/index.html:7107 |
| Engagement factor | passive/defensive 0.7; mixed/balanced 1.0; aggressive/offensive/leading 1.3 | legacy/index.html:7109 |
| Outcome factor | overwhelming_win/dominated 0.5; win/victory 1.2; strong_win/won_against_stronger 2.0; narrow_loss/close 1.5; loss/lost_to_stronger 1.8; survived/survived_dominant 2.5; unknown 1.2 | legacy/index.html:7110-7117, 7120 |
| Combat XP | primary = `round(base·dur·eng·outcome)`; secondary = `round(0.4·primary)`; each passes through `applyMomentumToXP` then `applyXPToSheet` | legacy/index.html:7121-7122, 6592-6606 |
| Opponent tier fallback (XP) | `opponentTier ‖ 1 + tierGap`, clamped 0-7; `COMBAT_END` default tier 2 | legacy/index.html:7104, 5102 |
| Dueling tier (display only) | `statToTier(highest lightsaberForms level)` | legacy/index.html:6885-6890; used only at 4026 |
| Tier bands | ≤20 Untrained(1), ≤40 Apprentice(2), ≤60 Adept(3), ≤80 Master(4), ≤100 High Master(5), ≤150 Legendary(6), else Transcendent(7) | legacy/index.html:6865-6874 |
| Exchange time budget | 3-10 s per exchange; "Time Elapsed: X seconds" | prompt only: legacy/index.html:2217, 2698, state-block rule 2 at 4142 and rule 8 at 4148 |
| Clock rounding | seconds → minutes, `Math.round`; ≤0 → no advance | legacy/index.html:6191-6198 |
| Pre-roll call | gemini-2.5-flash, temperature 0.4, maxOutputTokens 200, topP 0.9 | legacy/index.html:4521-4529 |
| Form lock | first `lightsaberForms.*` path in a combat is locked; later different form paths are rewritten to it | legacy/index.html:4362-4370 |
| Fate | killed → deceased; fled/captured/recurring → dormant; disposed (default) → delete if `lifecycleState==='disposable'` | legacy/index.html:3134-3154, 5104 |

## State read / written

- `activeCombat` (module global, legacy/index.html:6530): `opponent`, `intensity`, `round`, `accPhysical`, `accForce`, `accMental`, `momentum` (never updated after init), `startTime` (never read), `primarySkill`, `secondarySkill`, `tierGap`, `opponentTier`, `oppInjuries[]`, `lockedForm`, `startedByPreRoll`, `lastRollResult{label, margin, winner, marginLabel, preRolledForCurrentTurn}`.
- `characterSheet.forceStrain|physicalStrain|mentalStrain` and `max*` (written by `endCombat`), `characterSheet.stats.endurance`, `characterSheet.lightsaberForms`, `characterSheet.injuries`, `characterSheet.forceAbilities.ControlPain` (read).
- `masterXP` via `applyXPToSheet`; `turnXPLog` (pushed with `type:'combat'`).
- `worldState.characterProfiles[name].lifecycleState` (fate), `worldState.sceneNPCs` (pre-roll prompt), `worldState.inGameTime` (clock).
- `recentHistory` (last model turn, 400 chars, for pre-roll context: legacy/index.html:4481-4482).
- DOM: bar widths `[data-stat=…]` and labels `[data-stat-val=…]` written from `updateCombatStrain` (6670-6680); roll cards and banners appended to `#story-feed`.
- **Not saved:** `buildSave` (legacy/index.html:8227-8247) has no `activeCombat`, so a reload in the middle of a fight loses the tally, round, opponent injuries and locked form.

## AI provides vs. code computes

| AI provides | Code computes |
| --- | --- |
| Whether a fight starts, the opponent name and intensity (`COMBAT_START:`; in the pre-roll or main reply) | `startCombat` state, form lock, round counter |
| Roll paths and label (pre-roll reply or main reply), optional `TIER_GAP=` / `TACTICAL=` | Both d20s, bonuses, margin, result label (see 09) |
| `COMBAT_ROUND: n, intensity` (n overridden when JS counted rolls) | Per-exchange strain, tier factor, Endurance mitigation, Control Pain cost |
| `COMBAT_END:` primary/secondary skill, **opponent tier**, engagement, **outcome**, fate | Strain commit, XP amount, fate application |
| "Time Elapsed: X seconds" | Clock advance (rounded to whole minutes) |
| Narrative, "— COMBAT ROUND [N] —" header, strain echo | Banners: "Last Exchange — Resolved" (4971-4981), "Dice are final…" (5007-5017) |

The AI chooses the outcome label and opponent tier that drive XP; neither is checked against the actual exchange results or the registered opponent stats.

## Known bugs and fragile spots

1. **Margin between 0 and 1 is labelled "Narrow loss" while `winner` is `'player'`.** Margins are fractional (compressed bonuses), and the label chain checks `>=1`, then `===0`, then `>=-3` (legacy/index.html:10971-10979; winner at 10986). The state block then tells the AI "PLAYER WINS" (4130) while the banner says "You barely lost" (`resolutionLineFor`, 10820-10833). This is exactly the roll/narration contradiction that V132-V170 tried to remove. "Contested" (`margin===0`) is effectively unreachable.
2. **`activeCombat` is not saved** (8227-8247). After a reload, `COMBAT_END:` rebuilds `{round:5, acc*:0, opponentTier:2}` (5096-5098): all combat strain from the fight is lost and the duration factor is invented.
3. **Pre-roll exception wipes a live fight.** In the `catch`, `if (!activeCombat?.lastRollResult) activeCombat = null` (4559) runs for ongoing fights too, so a network error during any exchange that has no stored result (e.g. the first exchange after a main-reply `COMBAT_START:`, or any turn after the result was cleared at 5022-5031) silently ends combat with no strain or XP.
4. **Round count is off by one.** `round` starts at 1 and is incremented by each exchange (6553, 6646), so after N exchanges it is N+1; `calcCombatXP` uses it as the duration (6595, 7107). A 3-exchange fight gets the 4-10 factor (1.0, not 0.5).
5. **XP ignores the actual fight.** Base XP uses the AI's `COMBAT_END` tier field (5102), not the stat-derived `activeCombat.tierGap` from `fireRoll` (10897); `tierGap` is passed to `calcCombatXP` but only used when tier is falsy (7104). Outcome and engagement are AI-chosen. `overwhelming_win` (0.5) earns less than `narrow_loss` (1.5) or `survived` (2.5).
6. **Tier labels in the prompt don't match code.** The prompt tells the AI tier 1 = Initiate, 2 = Padawan, 3 = Knight, 5 = Grandmaster (1803, 1973-1980, 2645-2652); code says Untrained / Apprentice / Adept / High Master (6865-6874). The NPC_ROLL text (1764) uses the code names.
7. **Prose COMBAT_END fallback is unsafe** (6271-6287): any "combat over" / "fight ended" phrase in the full reply ends combat; the outcome regex `/win|victor|success/` matches words such as "window", "wind" and "winter" and is tested before "loss", so it nearly always returns `win`; no fate is applied, so disposable profiles stay; the primary skill is the first form name found anywhere in the text.
8. **3-10 s exchanges never move the clock.** `advanceClock` rounds to whole minutes and returns on 0 (6197-6198), with no seconds carry-over. A 10-exchange duel at 5 s each advances 0 minutes. The budget itself is prompt-only; code does not enforce it.
9. **Strain preview vs saved value.** Bars show `sheet + acc` (6662-6680), but the sheet is only written at `COMBAT_END`. If the fight never ends cleanly (bug 3, reload, AI forgets `COMBAT_END`), the shown strain is never saved. `updateCombatStrain` writes the DOM directly from engine code.
10. **SHEET JSON / regex paths bypass the combat strain guard.** The `activeCombat` guard exists only in the `FORCE_STRAIN=` cases (5506-5531) and the markdown fallback (6060-6082). The SHEET JSON replaces `characterSheet` wholesale with no strain/HP snapshot (4775; snapshot list 4719-4803), and the narrative regex (5909-5956) has no combat check, so the AI can still move strain mid-fight (see 10).
11. **Pre-roll new-combat path cannot see NPC_ROLL / PROFILE_STATS.** Those tags are applied in the main CHANGES loop (5614-5664) after the roll has already fired, so an opening roll against a freshly generated NPC always uses the "tier estimate" fallback (see 09, bug 2).
12. **Form lock overrides intended switches.** The lock rewrites any different form path (4366-4369) even when the player explicitly changes form. The pre-roll prompt says "unless the player's action explicitly names one" (4484), but code never checks this.
13. `activeCombat.momentum` and `startTime` are set (6545-6546) but never updated or used. Momentum lives only in AI prose.
14. `tierGapBonus()` (6877-6882) is dead code (`fireRoll` uses its own inline table at 10891). `getCharDuelingTier` (6885) is display-only (4026); the comment there says so.
15. Prompt still contains a hand-written "Accumulated strain" reference table (2240-2245) that duplicates the engine table at 6626-6632. That kind of duplicate table drifted before (V161).
16. Momentum multiplier (`applyMomentumToXP`) is applied to combat XP (6600, 6603). This is an AI-triggered multiplier outside any cap.

## Conflicts between sources

- **Opponent tier names:** prompt 1803 / 1973-1980 / 2645-2652 (Initiate, Padawan, Knight, Grandmaster) vs `statToTier` 6865-6874 (Untrained, Apprentice, Adept, High Master).
- **Sparring and outcome tone:** prompt outcome definitions (2250-2256) say `win` = "beat equal or stronger opponent clearly", but code gives `win` 1.2 vs `strong_win` 2.0 regardless of the real gap.
- **Combat strain "applies to ALL strain":** the prompt says Endurance mitigation applies whenever strain tags are set (2346-2354), but the SHEET JSON and regex paths apply none (see 10).
- **Pre-roll vs main AI opponent name:** when the main reply's `COMBAT_START:` name differs, code overwrites `activeCombat.opponent` (5072-5073) without moving the stats registered under the pre-roll name. This partly undoes V159.
- **Docs/updates.md V152** says sub-minute exchanges "correctly round down to 0 added minutes, which is the realistic outcome". That holds for one exchange, but because there is no carry-over, a whole duel also adds 0. The intent ("a duel totals a minute or two") conflicts with the code.
- **Prompt DUEL DISPLAY FORMAT** (2263-2279) has the AI write `d20=[SYSTEM]` lines and a defender tier gap, while the JS roll card already shows both, and opponents never get a tier-gap term in code (10956-10959).

## Replaced by

- `docs-v2/spec/rolls.md`: exchanges, advantage track, strike/maneuver, player beats, 5-10 s clock per exchange (rolled), seeded RNG, duel log.
- `docs-v2/spec/combat-xp.md`: per-exchange XP from the duel log, stakes/outcome factors, daily cap, E/CI gains. Replaces `calcCombatXP` (7099-7123), the AI-declared tier/outcome and momentum on combat XP.
- `docs-v2/spec/health.md`: combat exertion → physical meter (0.08 per exchange in rolls.md §3), Force meter loads, Vitality/wounds. Replaces `updateCombatStrain`, the strain tally and the `endCombat` strain commit.
- `docs-v2/spec/ai-events.md`: replaces `COMBAT_START:` / `COMBAT_ROUND:` / `COMBAT_END:` text tags and the prose fallback.
- Not covered by a decided spec: the opponent fate lifecycle (killed/fled/captured/recurring/disposed) partly overlaps `npc-generation.md`. Combat session persistence across save/load (bug 2) needs a v2 rule.

## Open questions for Jared

1. Should a fight in progress survive save/load in v2 (full duel state saved), or are saves blocked during Moment pacing?
2. Who decides the fight is over in v2: the engine (wound status / disengage maneuver), the player, or an AI-proposed event that code validates?
3. Keep the "form locked for the whole fight" rule, or allow free form changes at each player beat (with a cost)?
4. Opponent fate (killed/fled/captured/recurring): should it stay an AI-proposed event, or come from the engine (e.g. "Dying + not stabilized = killed")?
5. Is a separate secondary-skill XP award (0.4× primary) still wanted, or does combat-xp.md's per-exchange skill attribution fully replace it?
