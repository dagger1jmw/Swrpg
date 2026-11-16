# 11 — Alignment, equilibrium and light/dark drift (legacy V170 audit)

Audited file: `legacy/index.html` (V170, commit 8bef4a1). All line numbers were checked by reading the code.

## What it does for the player
- The sheet shows a 7-tier alignment label (Luminous to Consumed), a −100..+100 value with a marker on a gradient bar, and a dark-pressure bar that appears only when pressure is above 0 (`updateCharacterSheet`, legacy/index.html:7313-7380).
- There are two layers. **Current alignment** (`alignment`) can spike, for example after Will of the Force or a pressure discharge, and then drifts back. **Equilibrium** (`alignmentEquilibrium`) is the slow "soul's resting point", moved by an XP pool (`equilibriumXP`) (prompt text legacy/index.html:2569-2577).
- The player picks a Force philosophy at creation (legacy/index.html:1237-1249). It changes how much light or dark alignment XP counts and sets a daily passive drift.
- The AI reports moral acts through tags. Code applies the philosophy multiplier, the redemption penalty, thresholds, drift and discharge.
- When dark pressure reaches 100 it "discharges": a red "◈ PRESSURE DISCHARGED" card appears, equilibrium shifts dark, current alignment dips, and pressure resets to 40 (legacy/index.html:5833-5866).
- Will of the Force shows a blue card and spikes current alignment (legacy/index.html:5269-5294).
- A momentum window (`⚡`) is shown on the pressure bar and in the AI state block.
- Simulated meditation activities grant light-side equilibrium XP (legacy/index.html:12020-12035).

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Light threshold (equilibrium XP per +1 step) | `floor(100 × 1.05^max(0,eq))` | legacy/index.html:4186-4188 |
| Dark threshold (equilibrium XP per −1 step) | for \|eq\|≤50: `max(20, floor(80 × 0.965^abs))`; for ≤75: `floor(24 × 1.055^(abs−50))`; above that: `floor(82 × 1.09^(abs−75))`, where abs = \|min(0,eq)\| | legacy/index.html:4192-4197 |
| Redemption multiplier (divides positive XP while eq<0) | eq≥−25: 1.0; ≥−50: 1.5; ≥−75: 3.0; below that: null, so positive XP is blocked entirely | legacy/index.html:4200-4205, 4253-4258 |
| Philosophy multiplier (light / dark) | livingForce 1.8/0.75; unifyingForce 1.3/0.90; doctrineJedi 1.0/1.0; jediSentinel 1.0/1.0; sithPassion 0.7/1.8; sithInquisitor 0.8/1.3; gray 0.8/0.8; warrior 1.0/1.0; unknown values fall back to doctrineJedi | legacy/index.html:4208-4221 |
| Applied XP | `raw × philosophyMult / redemptionMult` | legacy/index.html:4260 |
| Promotion loop | at most 50 steps per call; equilibrium clamped to ±100; leftover XP clamped to ±max(lightThr, darkThr) | legacy/index.html:4264-4284 |
| Passive equilibrium XP per day | livingForce +0.5; unifyingForce +0.35; doctrineJedi +0.35; jediSentinel +0.28; sithPassion −0.5; sithInquisitor −0.35; gray +0.1; warrior 0; unknown philosophy: −0.35 if the faction contains "sith", otherwise +0.35 | legacy/index.html:4224-4240 |
| Dark pull per day (eq < −24) | eq<−74: −1.0; eq<−49: −0.5; otherwise −0.2 (equilibrium XP) | legacy/index.html:4319-4323 |
| Drift-back rate of current alignment toward equilibrium (pts/day) | \|cur\|≥90: 0.4; ≥75: 0.8; ≥50: 1.8; otherwise 3.5; skipped when \|diff\|≤0.05 | legacy/index.html:4296-4302, 4326-4335 |
| Tick trigger | `processAlignmentTick(turnElapsedHours)` once per story turn when elapsed > 0 | legacy/index.html:6265-6269 |
| Sim tick | lump `addEquilibriumXP(sum)` and then `processAlignmentTick(days×24)` | legacy/index.html:12020-12035 |
| Sim alignment XP per hour | Force Sense Meditation 3, Force Sense (Active) 2, Meditation (Centering) 5, Deep Force Immersion 15, youngling Group Meditation 5, padawan Meditation (with Master) 3 | legacy/index.html:8616-8619, 8714, 8719 |
| `ALIGNMENT_XP=N` | `addEquilibriumXP(N)` | legacy/index.html:5815-5820 |
| `ALIGNMENT=N` (legacy tag) | `addEquilibriumXP(N × 20)` | legacy/index.html:5821-5826 |
| `WILL_OF_FORCE=g,desc` | `alignment = min(100, alignment + g)`, then `addEquilibriumXP(g × 8)` | legacy/index.html:5269-5294 |
| `DARK_PRESSURE=N` | sets the **total**, clamped 0-100 | legacy/index.html:5827-5832 |
| Discharge at ≥100 | pressure→40. Equilibrium XP loss by eq: ≥76: 120; ≥26: 80; ≥1: 60; ≥−25: 40; otherwise 25, all × (1 − surrenderDiscount). Current-alignment spike = loss × 0.06. surrenderDiscount resets to 0 | legacy/index.html:5834-5852 |
| `SURRENDER_DISCOUNT=x` | clamped 0-0.5 and stored in `momentumWindow.surrenderDiscount` | legacy/index.html:5869-5874 |
| `MOMENTUM_WINDOW=m,d` | active, multiplier m, expires on inGameDate + d days; `0,0` closes it | legacy/index.html:5250-5265 |
| Momentum expiry | checked in the WORLD-JSON parse path only | legacy/index.html:4915-4924 |
| Momentum effect | `applyMomentumToXP` multiplies **stat XP** (TRAINING, COMBAT, PROFICIENCY, XP:, endCombat), not alignment XP | legacy/index.html:6969-6972; call sites 5130, 5141, 5160, 5187, 5214, 6600, 6604 |
| Tier bands (label) | ≥76 Luminous; ≥26 Attuned; ≥1 Calm; ≥−25 Balanced; ≥−50 Shadowed; ≥−75 Corrupted; otherwise Consumed | legacy/index.html:4033-4034, 7317-7325 |
| Starting values | Sith −20, Jedi +20, others 0 (both alignment and equilibrium); default philosophy by faction: jedi→doctrineJedi, sith→sithPassion, republic/mandalorian/bounty_hunter→warrior, force_sensitive→livingForce | legacy/index.html:3404-3409, 3318-3322 |
| Pain channel gate | applies only if `painChannelActive && alignment ≤ −25` | legacy/index.html:10657 |
| Ability prereqs `darkSide:N` / `lightSide:N` | `alignment ≤ −N` / `alignment ≥ N` (uses **current** alignment) | legacy/index.html:11192-11195 |
| Prompt tier effects (Deep Light pressure ×0.5, Corrupted dark −15% strain, etc.) | prompt text only; no code | legacy/index.html:2630-2636 |
| Prompt example amounts | meditation 30 min +3; 2 h +10; mercy +25; protect at cost +50; forgive +35; peace +20; release attachment +25; anger −30; selfish deception −25; abandon −50; deliberate dark ability −40 | legacy/index.html:2584-2597 |

## State read / written
- `characterSheet.alignment` (number, 2 dp)
- `characterSheet.alignmentEquilibrium` (integer −100..100)
- `characterSheet.equilibriumXP`
- `characterSheet.alignmentPeak.{light,dark}`
- `characterSheet.philosophy`
- `characterSheet.darkPressure`
- `characterSheet.momentumWindow.{active,multiplier,expiresDate,surrenderDiscount}`
- `characterSheet.lastLightActs`: initialised at legacy/index.html:3410 and 8263, never read
- `characterSheet.painChannelActive`
- `characterSheet.faction`: read for the Sith fallback (4226)
- Reads `worldState.inGameDate`
- All alignment fields are snapshotted before the SHEET JSON overwrite and restored afterwards (legacy/index.html:4755-4762, 4790-4797)

## AI provides vs. code computes
- **AI provides:**
  - `ALIGNMENT_XP` amounts, with the moral judgement of what counts
  - `DARK_PRESSURE` new totals (the AI must add its own delta to the shown total)
  - `WILL_OF_FORCE` gain and description
  - `MOMENTUM_WINDOW` and `SURRENDER_DISCOUNT`
  - `PAIN_CHANNEL`
  - all narration of tier effects (no code applies them)
- **Code computes:**
  - philosophy and redemption multipliers
  - equilibrium promotion, passive drift, dark pull and drift-back
  - discharge and its magnitude
  - momentum expiry
  - display
  - prereq gating
- Also, the markdown fallback lets AI prose `**alignment:** N` set current alignment directly (legacy/index.html:6051, 6085).

## Known bugs and fragile spots
1. **Markdown fallback bypasses the engine.** `**alignment:** N` in prose sets `characterSheet.alignment` directly. It runs after the snapshot restore and is not gated on a JSON failure: it runs whenever markdown markers appear (legacy/index.html:6035-6036, 6085). `parseInt(x) || old` also means 0 can never be set.
2. **Consumed lock is permanent.** Below eq −75 every positive XP is discarded: passive drift, meditation, WILL_OF_FORCE equilibrium XP (4256). No tag or event exists to unblock it, although the comment says "needs narrative event" (4204).
3. **Momentum window is mis-wired.** The prompt (2616) and the changelog say dark acts are amplified. The code multiplies all **stat XP** (6969-6972) and leaves alignment XP alone. As a result, opening a window after a discharge works as a general training-XP boost.
4. **Dark pressure never decays.** Its only writes are 5832 and 5835. It falls only if the AI sends a lower total.
5. **DARK_PRESSURE takes a total, but the prompt lists deltas** ("+5 to +15", 2610-2614). An AI that sends `DARK_PRESSURE=+15` meaning "add 15" sets the pressure to 15, which can lower it. If the AI repeats `DARK_PRESSURE=100`, it discharges again every turn.
6. **One dark act can be counted twice.** The prompt teaches both `ALIGNMENT_XP=-30` (2594) and a `DARK_PRESSURE` increase (2610) for "anger as a tool". The V122 intent (updates.md:2509) was that dark acts move pressure only.
7. **WILL_OF_FORCE gaps.** The current-alignment spike ignores the philosophy and redemption multipliers and still applies when Consumed blocks the equilibrium XP (5277 vs 4256). The spike does not call `updateAlignmentPeak()`. The feed card shows the pre-multiplier "+g×8" (5287).
8. **Pre-V122 saves get reset.** The load migration never seeds `alignmentEquilibrium`, `equilibriumXP`, `philosophy` or `alignmentPeak` (8260-8263). `processAlignmentTick` then sets equilibrium to 0 (4311) and drifts an old save's alignment toward 0. While `philosophy` is null, the snapshot skips it (4795), so the AI's SHEET JSON can set it.
9. **Prereqs use the spikeable current alignment.** A WOF spike or a discharge spike can briefly unlock `lightSide`/`darkSide` abilities in the sim (11192-11195).
10. **Asymmetric fall cost.** For eq ≥ 0 the dark threshold is a flat 80 (`min(0,eq)` gives 0), while climbing at +90 costs about 8,000 XP per point (4187, 4193). A Luminous character loses points about 100× cheaper than they gain them. There is also a small discontinuity at −75/−76 (91 to 89 XP).
11. **Sim lump sum.** The whole period's meditation XP goes through one `addEquilibriumXP` call (12034), with a 50-step safety cap and leftover XP clamped (4264, 4284). The tick uses the starting alignment's drift rate for the entire period (4329).
12. **Momentum expiry only runs inside WORLD-JSON parsing** (4915-4924). A failed WORLD parse leaves the window open.
13. **Formulas and labels are duplicated:**
    - the threshold math is copied into the state block (4035-4036)
    - tier labels appear 3 times (4033-4034, 7317-7325)
    - a fourth, simplified 4-label version is used in the transition scene (12301), which collapses all dark tiers into "Leaning toward the Dark Side"
14. **Bar tick marks are wrong.** They sit at 18/30/37/63/70/82%, but the tier boundaries on a (v+100)/200 bar fall at 12.5/25/37.5/62.5/75/87.5% (7364-7369).
15. **Philosophy cannot change after creation.** It is snapshot-protected and has no tag (4760, 4795). A fallen Jedi keeps doctrineJedi light drift.
16. **Talent and tier effects are prompt-only.** The `DarkAffinity` talent says "alignment drift accelerates" (8740), but no code reads it. The prompt tier effects (2630-2636) have no code either.
17. **`PAIN_CHANNEL=` is stored unconditionally** (5439-5442). The −25 gate is checked only at roll time (10657), so the state block can show "ACTIVE" for a light-side character (4077).

## Conflicts between sources
- **Master Prompt v7.1 vs. code:** the doc says "three zones: Light, Neutral, Dark" (Docs/SW_Legends_RPG_Master_Prompt_v7_1.md:89), but the code has 7 tiers plus equilibrium.
- **ALIGNMENT tag usage:**
  - legacy/CLAUDE.md §5A and §9D, and Docs/CLAUDE changelog.md:111, 188-190, say the AI sends `ALIGNMENT=` for light gains and momentum-window dark hits, and never for dark acts.
  - The in-code prompt says `ALIGNMENT=` is deprecated (2620) and teaches negative `ALIGNMENT_XP` for dark acts (2593-2597).
  - Docs/SWRPG_XP_System_Reference.md:458-465 shows `ALIGNMENT: -8` and `ALIGNMENT: +3`, a colon form that the `=`-only key regex (5296) does not even match.
- **Momentum window:**
  - Docs/CLAUDE changelog.md:188 says "dark acts hit ALIGNMENT= directly" and the window closes on a light choice or meditation.
  - The prompt (2616) says dark acts are amplified.
  - The code amplifies stat XP and closes only by date (6969; 4916-4922).
- **Light-act diminishing returns:** changelog.md:190 promises them, but `lastLightActs` is never read.
- **WOF reducing the next discharge:** changelog.md:190 promises this, but no code does it.
- **Equilibrium tied to life stage:** updates.md:2509 says equilibrium is "determined by life stage". No code uses life stage.
- **Tier ranges:** CLAUDE.md §9D lists "Neutral −25–0" while the code labels it "Balanced". The changelog lists 1-25 as "Leaning Light". These are naming differences only.
- **Activity Bank vs. code:** Docs/SW_Activity_Bank_v1.md:207, 214 say dark-ability practice costs "+2 / +1 Dark Side points per hour". The code's sim activities carry only positive `alignmentXPPerHour`; no dark-side cost is implemented.
- **Philosophy key names:** legacy `doctrineJedi` vs. v2 `jediOrthodox` (docs-v2/spec/alignment.md:16).

## Replaced by
docs-v2/spec/alignment.md. It replaces equilibrium/equilibriumXP/thresholds with Q and D, daily drift, pressure sources and relief, the willing turn, noticing, redemption past Consumed, and effects. The AI tags (`ALIGNMENT_XP`, `DARK_PRESSURE`, `WILL_OF_FORCE`, `MOMENTUM_WINDOW`, `SURRENDER_DISCOUNT`) are replaced by docs-v2/spec/ai-events.md (`moralChoice`, `emotionalEvent`). Momentum windows are replaced by state of mind (docs-v2/spec/progression-numbers.md §17).

## Open questions for Jared
1. Will of the Force (surrender to the Force) has no v2 event. Should it map to `moralChoice light` with weight 3, become its own event, or be dropped?
2. Legacy's philosophy multipliers (Living Force ×1.8 light, Sith Passion ×1.8 dark) have no v2 equivalent beyond the drift rate `p`. Is it intended that philosophy only affects passive drift in v2?
3. Should the sim's meditation activities keep feeding light drift? (v2 §2 requires a "day included practice" flag; the per-activity rates 3/5/15 per hour are not carried over.)
4. Should the "pressure discharge" event (a sudden dark lurch at 100) survive in any form? v2 uses continuous dark drift with no discharge.
