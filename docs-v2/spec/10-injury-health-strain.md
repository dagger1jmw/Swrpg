# 10 — Injury, HP and strain (legacy V170 audit)

Scope: `hp` / `maxHp`, the three strain pools (Force, Physical, Mental, 0-100 each) and every place they are written, Endurance mitigation, recovery, `INJURY_*` / `OPP_INJURY_*` / `STORY_HEAL` / `DOMINANT_HAND` / `FIGHTING_HAND` / `PAIN_CHANNEL` / `COMBAT_END_CRASH` tags, `getSeverityWeight`, `getHPThresholdPenalty`, `calcInjuryPenalties`, `calcRollPenalties`, Control Pain, Battlemind/Valor, Willpower resistance, body-part taxonomy, healing. Compared with `Docs/SW_Injury_System_v1.md` (status line says "DESIGN PHASE — not yet implemented", but V170 implements most of it).

## What it does for the player

- An HP bar (0-100, everyone starts at 100/100) and three strain bars. HP below 76 gives −1 to −5 on every roll.
- The AI logs wounds by body part and severity. Each wound subtracts 1/2/3/5 from rolls that use that body part. Torso and head wounds hit every roll.
- Control Pain (Force ability) removes up to 100% of wound penalties, and costs Force strain each combat exchange. Battlemind / Force Valor removes 50-100% of the HP penalty. Willpower removes 10-35% passively. A dark-side character (alignment ≤ −25) can channel pain to turn wound penalties into a bonus on strength / Force Output rolls.
- Fighting with the non-dominant hand gives −3 to 0 depending on Jar'Kai.
- Minor wounds clear after any reply declaring 7+ hours elapsed. Other wounds clear only when the AI emits a heal tag.
- Strain rises when the AI reports it (tags, sheet JSON or story text) or from combat and the simulator. It never falls on its own with time in normal play.

## Rules and formulas

| Constant / formula | Value | Source |
| --- | --- | --- |
| Initial health/strain | `hp:100, maxHp:100, forceStrain:0, maxForceStrain:100, physicalStrain:0, maxPhysicalStrain:100, mentalStrain:0, maxMentalStrain:100`, `painChannelActive:false` | legacy/index.html:3410-3415 |
| HP threshold penalty | ≥76: 0; ≥51: 1; ≥26: 2; ≥11: 3; ≥1: 5; 0: 0 | legacy/index.html:10583-10590; Docs/SW_Injury_System_v1.md §2 |
| HP read for penalties | `cs.hp ‖ 100` (so 0 → 100) | legacy/index.html:10650, 4069, 5446 |
| Severity weight | minor 1, moderate 2, severe 3, critical 5 (else 0) | legacy/index.html:10579-10581; duplicated at 4068, 5351, 6651-6652 |
| Body parts | rightArm, leftArm, rightHand, leftHand, rightLeg, leftLeg, torso, head | prompt legacy/index.html:1733; code 10630-10633; Docs §4 |
| Targeting | arm/hand → rolls with any `lightsaberForms.*` or `stats.strength`; leg → `stats.agility`; torso and head → all rolls; any wound → "generic" rolls (no arm/leg/Force path) | legacy/index.html:10620-10638 |
| Willpower resistance | ≥81: 0.35; ≥61: 0.30; ≥41: 0.20; ≥21: 0.10; else 0 | legacy/index.html:10604-10610 |
| Control Pain mitigation | `min(CP,100)/100`, always on when CP > 0 | legacy/index.html:10641-10642 |
| Effective injury penalty | `ceil(raw × (1 − willRes) × (1 − cpMit))` | legacy/index.html:10643 |
| Battlemind / Valor HP suppression | level = max(Battlemind, ForceValor); ≤30: 0; ≤60: 0.5; ≤80: 0.75; else 1.0 | legacy/index.html:10593-10601 |
| HP penalty after suppression | `ceil(raw × (1 − bm))` | legacy/index.html:10653 |
| Pain channel | if `painChannelActive` and alignment ≤ −25 and any path is `stats.strength` or `forceStats.forceOutput`: injury penalty → 0, bonus = raw (unmitigated) injury penalty | legacy/index.html:10656-10660 |
| Off-hand penalty (saber rolls) | fightingWith ≠ dominantHand: Jar'Kai 0 → 3; ≤30 → 2; ≤60 → 1; else 0 | legacy/index.html:10661-10665; Docs §5C |
| Total roll penalty | HP + injury + off-hand − pain-channel bonus | legacy/index.html:10666-10672 |
| Opponent injury bonus | Σ weights of `activeCombat.oppInjuries`, subtracted from opponent total | legacy/index.html:10676-10680, 10956-10959 |
| Control Pain Force cost (combat) | see 08: `floor(sevSum·min(CP,100)/100·3·max(0.1, 1−0.8·CP/100))` per exchange → `accForce` | legacy/index.html:6648-6660; Docs §6A |
| Crash surge (`COMBAT_END_CRASH`) | physical strain + 5 / 10 / 15 / 20 for HP ≥51 / ≥26 / ≥11 / ≥1 | legacy/index.html:5444-5458; Docs §6D |
| Endurance mitigation | `em = compressedBonus(END)/6`; increases only: P ×(1−em), F ×(1−0.5em), M ×(1−0.3em) | CHANGES 5502-5532; markdown 6056-6082; sim 11442-11444; combat 6643-6645; prompt 2346-2360 |
| Strain tag gate | positive delta blocked if no `TRAINING:` / `COMBAT:` / `COMBAT_ROUND:` / `COMBAT_START:` line this turn, or if `activeCombat` | legacy/index.html:5057, 5507, 5518, 5529 |
| Minor auto-clear | any reply whose first "time elapsed" line parses to ≥7 h (hours + minutes only) | legacy/index.html:5034-5050 |
| Sim strain | per hour: `SIM_STRAIN_BASE × intensity mult × bias × mitigation × talent mults`; minus meditation recovery; sleep recovery factor 8h 1.0, 7h 0.85, 6h 0.65, 5h 0.45, 4h 0.25, else 0.10 | legacy/index.html:11428-11469 |
| Sim period end | `pool = cur + period − period × sleepRecovery` (only new strain recovers) | legacy/index.html:12043-12050 |
| Prompt-only strain rules | penalties 21-50 −1, 51-80 −2, 81+ −3; Force small +5-10 … heavy +20-30; meditation recovers 15-30; sleep 10-20/h | legacy/index.html:2327-2343, 2638-2643 |

## State read / written

- `characterSheet.hp`, `maxHp`, `forceStrain`, `maxForceStrain`, `physicalStrain`, `maxPhysicalStrain`, `mentalStrain`, `maxMentalStrain`, legacy fallbacks `strain` / `maxStrain` (read at 4056).
- `characterSheet.injuries[]` = `{bodyPart, severity, label, permanent, turnAdded}` (5356).
- `characterSheet.dominantHand`, `fightingWith`, `painChannelActive`, `alignment`, `stats.willpower`, `stats.endurance`, `forceAbilities.ControlPain|Battlemind|ForceValor`, `lightsaberForms.JarKai`.
- `activeCombat.oppInjuries[]` = `{bodyPart, severity, label}`; `worldState.characterProfiles[name].permanentInjuries[]` = `{bodyPart, label, turnAdded}` (written at 5409-5420, **never read**).
- Snapshot/restore across SHEET JSON: `injuries`, `dominantHand`, `fightingWith`, `painChannelActive` are protected (4725-4728, 4800-4803). **`hp` and all strain fields are not protected.**

### Strain write sites (verified)

| # | Path | Lines | Mitigated? | Combat-guarded? |
| --- | --- | --- | --- | --- |
| 1 | SHEET JSON replaces the whole sheet | 4774-4779 | no | no |
| 2 | CHANGES `FORCE_STRAIN=` / `PHYSICAL_STRAIN=` / `MENTAL_STRAIN=` | 5510, 5521, 5532 | increases only | increases only |
| 3 | CHANGES `COMBAT_END_CRASH` | 5453 | no | n/a |
| 4 | Story-text regex: "X Strain: … → N" | 5923 (loop over 3 fields) | no | no |
| 5 | Story-text regex: "X Strain reduced/lowered/dropped to N" | 5938 (loop) | no | no |
| 6 | Story-text regex: "fully restored … strain" → all 0 | 5944-5946 | no | no |
| 7 | Story-text regex: "N Force, N Physical, and N Mental Strain" | 5953-5955 | no | no |
| 8 | Clamp after regex | 5970-5971 | — | — |
| 9 | Markdown fallback `**forceStrain:**` etc. | 6062, 6071, 6080 | increases only | increases only |
| 10 | `endCombat` adds the combat tally | 6588-6590 | (mitigated upstream) | — |
| 11 | `manualStrainSync` (player prompt) | 8554-8556 | no | no |
| 12 | Simulator period end | 12048-12050 | yes (11442-11444) | n/a |

That is 26 direct assignment lines plus the wholesale SHEET JSON replacement = 27, in 7 paths (SHEET JSON, CHANGES tags, story-text regex, markdown fallback, endCombat, manual sync, simulator). Control Pain writes `activeCombat.accForce` (6658), not the sheet. **HP write sites:** SHEET JSON (4775), `HP=` (5499), markdown `**hp:**` (6084). Nothing in code damages or heals HP.

## AI provides vs. code computes

| AI provides | Code computes |
| --- | --- |
| HP value (absolute, any number) via `HP=`, SHEET JSON, markdown | Threshold penalty, Battlemind suppression, crash surge |
| Strain values (absolute) via tags / JSON / prose | Delta, Endurance mitigation on increases (tags/markdown only), clamping, combat gate |
| Wounds: body part, severity, label, permanence (`INJURY_ADD`) | Targeted penalty, Willpower/Control Pain mitigation |
| All healing: `INJURY_HEAL`, `INJURY_HEAL_ALL`, `STORY_HEAL`, "Time Elapsed" ≥7 h | Minor auto-clear |
| `FIGHTING_HAND`, `DOMINANT_HAND`, `PAIN_CHANNEL`, `COMBAT_END_CRASH` | Off-hand penalty, pain-channel conversion, surge |
| Opponent wounds `OPP_INJURY_*` | Opponent penalty |

## Known bugs and fragile spots

1. **HP 0 counts as full health.** `cs.hp ‖ 100` (10650, 4069, 4055, 7335, 7383, 7423) turns 0 into 100, so 0 HP gives no penalty and shows 100/100. `getHPThresholdPenalty(0)` also returns 0 (10589). Markdown `parseInt(hp) ‖ characterSheet.hp` (6084) can't set 0. Nothing makes HP 0 incapacitating (Docs §2 says it should be).
2. **`INJURY_ADD` replaces any wound at the same body part** (5355), including a permanent one. Re-adding `rightHand,minor` after an amputation removes the permanent flag; the next `INJURY_HEAL=rightHand` or a 7 h sleep then clears the amputation. It also lets a severe wound be downgraded to minor.
3. **SHEET JSON bypasses every strain/HP guard.** `hp` and strain aren't snapshotted (4719-4803), so the AI's JSON writes them raw, mid-combat included. The later `FORCE_STRAIN=` delta is computed against the already-overwritten value (5504-5505), so the Endurance mitigation and the V149 combat guard only work when the JSON and tag disagree.
4. **Story-text regex writes strain with no combat or activity gate** (5909-5956). The "triple" pattern and "fully restored" pattern accept any prose, e.g. a recap line. This was the V149 double-count path class.
5. **Decreases are never gated** (5507, 5518, 5529, 6060-6082). Any turn can lower strain to any value with no rest or meditation, and mid-combat a lower echo then has the tally added on top.
6. **Minor auto-clear doesn't check for sleep** (5047-5050). Any 7 h "Time Elapsed" (travel, a long training block) clears minor wounds. It reads only the first line containing "time elapsed". The simulator's sleep never clears injuries.
7. **No time-based recovery.** Strain falls only through AI-written lower values, the regex, manual sync, or the simulator. Even the simulator only offsets that period's new strain (12045-12047): existing strain never recovers there either.
8. **Pain channel persists** until set inactive: the snapshot restores it each turn (4728, 4803). The doc says it must be re-declared every turn (Docs §6B, §9). The dark-pressure and physical-strain costs of channeling (Docs §6B, §11) are not implemented. The bonus uses the raw, unmitigated penalty (10659).
9. **Head wounds hit every roll**, matching Docs §4's "Targeting scope" note, but Docs §4's table says head = Force + mental only (see Conflicts).
10. **"Generic" rolls take every wound** (10636): a roll with only `stats.endurance` or `stats.willpower` paths is penalized by a leg or arm wound.
11. **`OPP_INJURY_PERMANENT` is write-only.** It is never injected into context or shown (only 5409-5420 reference `permanentInjuries`), contrary to Docs §8.
12. **`critical` is accepted as a healable severity** (5351) and is cleared by `INJURY_HEAL` / `INJURY_HEAL_ALL` unless `,permanent` was given. Docs §3A has only minor/moderate/severe as healable.
13. **Control Pain is always on** at full level whether or not the character is using it, and its Force cost is charged only in combat (6648-6660). Docs §6A adds a per-hour cost outside combat.
14. **Strain has no mechanical effect on rolls** (see 09 bug 10). Its only code effects are the simulator XP multiplier (`simGetStrainPenalty`, 11564-11573) and display.
15. **Severity weights are copied four times** (10580, 4068, 5351, 6651-6652); the state-block penalty preview (4069-4070) re-implements `getHPThresholdPenalty`.
16. **Prompt rule 10 says Control Pain "level directly equals % mitigation"** (4150), but code also multiplies Willpower resistance and rounds up, so the card can differ from the AI's expectation.

## Conflicts between sources

| Topic | Docs/SW_Injury_System_v1.md | legacy/index.html | Prompt |
| --- | --- | --- | --- |
| Willpower resistance | 0-40: 0; 41-60: 10%; 61-80: 20%; 81-100: 30%; 100+: 35% (§6F) | ≥21: 10%; ≥41: 20%; ≥61: 30%; ≥81: 35% (10604-10610) | not stated |
| Control Pain rounding | `floor(raw × (1 − CP/100))` (§6A); §6F example rounds −1.6 to −2 | `ceil(raw × (1−will) × (1−cp))` (10643) | "level = % mitigation" (4150) |
| Head targeting | table: Force + mental rolls (§4) vs note: "Torso and head injuries apply universally" (§4) | universal (10634-10636) | — |
| Healable severities | minor, moderate, severe (§3A); critical only in the permanent example (§9) | critical healable unless `permanent` (5351, 5365) | lists critical (1733) |
| Pain channel persistence | re-declare each turn (§6B, §9) | persists (4728, 4803, 5441) | "re-declare each turn" (1743) |
| Pain channel costs | dark pressure + severity per exchange; physical strain + severity per exchange (§6B, §11) | none | — |
| Light-side pain channel | allowed at heavy dark-pressure cost (§6B) | blocked unless alignment ≤ −25 (10657) | dark side only (1743, 4150) |
| Battlemind 100+ | +1 active bonus (§6D) | none (10600) | — |
| Minor auto-clear | full sleep with rest context (§7A) | any 7 h elapsed line (5047-5050) | "full sleep (7+ hrs)" (4150) |
| HP 0 | Incapacitated (§2) | treated as 100 | — |
| Opponent permanent injuries | injected into context when present (§8) | never read | — |
| Status | "DESIGN PHASE — not yet implemented" (header) | implemented | — |
| Moderate healing time | bacta 1-2 days, Force 4-8 h (§7B) | no timers; AI-declared heal | "require bacta/medical" (4150) |
| Endurance mitigation scope | — | tags, markdown, sim, combat only | "applies to ALL strain … whenever you set FORCE_STRAIN=" (2346-2354) |
| Strain roll penalties | — | none | 21/51/81 → −1/−2/−3 (2331-2342) vs TACTICAL 60+/80+ → −1/−3 (2024-2025) |

## Replaced by

- `docs-v2/spec/health.md`: Force meter replaces Force strain; physical/mental meters (progression-numbers.md §3) replace physical/mental strain; Vitality replaces HP; wounds with damage-derived severity (minor/moderate/severe/critical/mortal), derived status, clock-driven healing times, pain suppression (Control Pain, Battlemind/Valor, dark-side channeling) as percentages with Force load; opponents and minions (§9). Replaces every row in the strain write-site table, `getHPThresholdPenalty`, `getSeverityWeight`, `calcInjuryPenalties`, `calcRollPenalties`, `getWillpowerResistance` (no Willpower resistance in health.md), the crash surge, and the minor auto-clear.
- `docs-v2/spec/rolls.md` §1: wound/fatigue/Vitality as effective-level multipliers instead of d20 penalties.
- `docs-v2/spec/ai-events.md`: replaces `HP=`, `*_STRAIN=`, `INJURY_*`, `OPP_INJURY_*`, `STORY_HEAL`, `PAIN_CHANNEL`, `COMBAT_END_CRASH` and all story-text regex.
- Not covered by a decided spec: dominant hand / `fightingWith` and the Jar'Kai off-hand penalty; Willpower passive pain resistance; the Battlemind/Valor "crash" after suppression ends; manual strain/HP correction tool for the player.

## Open questions for Jared

1. Keep dominant hand and the off-hand penalty (scaled by Jar'Kai) in v2? If yes, as a percentage of effective level, and does losing a hand (severed limb, health.md §5) force the switch automatically?
2. Keep Willpower passive pain resistance? health.md §8 has only Force-based suppression.
3. Keep the "crash" (penalty spike when Battlemind/Valor ends while wounded)? If yes, should it be a mental/physical meter load rather than a strain number?
4. Should the player keep a manual correction tool (like `manualStrainSync`) in v2, and if so, should it be logged as a correction event?
5. Which Docs/SW_Injury_System_v1.md items stay canon for v2 design: the doc's Willpower table or the code's? (Recorded as a conflict only; health.md doesn't use either.)
