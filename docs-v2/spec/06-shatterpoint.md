# 06 — Shatterpoint (legacy V170 audit)

Scope: the separate Shatterpoint XP track (500 x 1.07^L), Path A (learned) vs Path B (shatterpoint perception innate), seeding, tiers, perception and interpretation rolls, focus / tunnel vision / Vaapad amplification, misreads, the six `SHATTERPOINT_*` tags, and sim practice.

**Name (D-349, 2026-11-21):** the talent is now called shatterpoint perception (key `shatterpointPerception`). The legacy code and lore files call it `ShatterSense`; the line numbers below still point at that key.

## What it does for the player
- A character with the shatterpoint perception talent ("Shatterpoint (Innate)") starts at Shatterpoint level 5 and sees shatterpoints passively. The AI decides when one exists and posts a perception card (Tactical / Personal / Situational).
- The AI can ask for an interpretation roll; JS rolls d20 + bonus and posts a card (Misread / Partial / Clear / Deep / Total clarity). The next turn must narrate the concrete content (V158).
- Focus (0-100) narrows awareness; above 70 the character has tunnel vision. Knowing Vaapad multiplies focus by 1.3.
- A misread is flagged until the AI plays out its consequence.
- Shatterpoint has its own sidebar section and XP bar (7593-7630), can be trained in the sim ("Shatterpoint Practice") and can be given XP from the inject panel (8415-8417, 8493).
- A character without the talent can, in theory, learn "Shatterpoint" as an ordinary Force ability (catalog entry, 8809).

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| XP to advance from SP level n | `floor(500 * 1.07^n)` (5x the main curve) | legacy/index.html:6688-6690 |
| XP to reach SP level L | sum `spXPRequired(0..L-1)`; computed: L5 2,874 · L6 3,575 · L10 6,905 · L11 7,888 · L20 20,490 | legacy/index.html:6692-6696; computed this audit |
| Level from total | same loop as main curve | legacy/index.html:6698-6705 |
| SP tier | L ≥ 11 -> 3 · L ≥ 6 -> 2 · else 1 | legacy/index.html:6713-6718 |
| XP applied | raw amount, no discount, no cap, no momentum, no talent | legacy/index.html:6721-6740 (x0.1 innate discount removed in V123c, Docs/updates.md:2691-2738) |
| Innate seed | if shatterpoint perception and level < 5: `totalXP = spXPToReachLevel(5)` | legacy/index.html:6744-6763; also at creation 3399 |
| Seed call sites | creation 3442, every SHEET parse 4835, save load 8321, talent toggle 11646 | grep |
| Interpretation roll bonus | `L * 0.15 + compressedBonus(meditation) * 0.4 + compressedBonus(willpower) * 0.2 + (innate ? 1.0 : 0)` | legacy/index.html:6774-6780 |
| Roll | `d20 = floor(Math.random()*20)+1`; total = d20 + bonus | legacy/index.html:6782-6783 |
| Outcome bands | < 9 fail · < 13 contested · < 18 solid · < 23 strong · else overwhelming | legacy/index.html:6786-6790 |
| Misread flag | set when outcome is fail OR contested | legacy/index.html:6798, 6802-6804 |
| Focus | `Vaapad totalXP > 0 ? min(100, value * 1.3) : value`; tunnelVision = focus > 70 | legacy/index.html:6824-6841 |
| Bandwidth guidance (prompt) | Tier 1 brief 20-40 · Tier 1 sustained combat 35-50 · Tier 2 50-70 · Tier 3 80-90 | prompt legacy/index.html:2531-2551; lore Forms v3 "Awareness Bandwidth" |
| Path A interpretation strain (prompt only) | 20-40 per attempt | prompt legacy/index.html:2474-2477 |
| Path B interpretation strain (prompt only) | x0.3 of Path A (~6-12) | prompt legacy/index.html:2478-2489 |
| `SHATTERPOINT_XP` guidance | "50-150 per significant use" | prompt legacy/index.html:2556-2557 |
| Sim practice XP | `hours * SIM_INTENSITY * SIM_OUTCOME_WEIGHT[min(6, spLevel)] * strainPenalty * days` | legacy/index.html:11973-11977 (preview 11552-11556) |
| Sim practice strain bias | f 2.2 · p 0.1 · m 2.5; no innate reduction | legacy/index.html:8625 |
| Sim unlock | shatterpoint perception or `characterSheet.shatterpointLevel > 0` | legacy/index.html:8625 |
| Learned path (catalog) | `Shatterpoint` root ability, prereqs forceSense 61, forceKnowledge 51, BattleForesight 41, meditation 41; uses the main 100 x 1.07^n curve via `forceAbilities.Shatterpoint` | legacy/index.html:8809 |

## State read / written
- `masterXP.shatterpoint.main.totalXP` (6722-6728, 6751; restored on load 8292-8294; not in the initial declaration at 6536).
- `characterSheet.shatterpointLevel`, `characterSheet.shatterpointTier` (6732-6733, 6757-6758).
- `characterSheet.lastShatterpointRoll = { outcome, total, d20, bonus, target, misread, turn, resolved }` (6793-6801); `resolved` set to true when the reminder is built (4172).
- `characterSheet.lastShatterpointMisread = { unresolved, target, outcome, turn }` (6803), cleared only by `spClearMisread` (6853-6855).
- `characterSheet.lastShatterpointPerceived = { tier, description, turn }` (5542).
- `characterSheet.shatterpointFocus`, `.tunnelVision`, `.vaapadAmplification` (6828-6830, 6846-6848).
- Deletes `masterXP.forceAbilities.Shatterpoint` on every SP award or seed (6736-6737, 6760-6762); deletes `characterSheet.forceAbilities.Shatterpoint` / `forceAbilitiesXP.Shatterpoint` for shatterpoint perception holders (4806-4810, 7060-7063).
- Reads `characterSheet.forceStats.meditation`, `.stats.willpower`, `.innateTalents`, `masterXP.lightsaberForms.Vaapad`.

## AI provides vs. code computes
| AI provides | Code computes |
|---|---|
| Whether a shatterpoint exists, its tier and description (`SHATTERPOINT_PERCEIVED`) | Feed card only (5536-5556); no tier check against level |
| When to roll and the target (`SHATTERPOINT_ROLL`) | d20 roll, outcome, misread flag, card (6767-6821) |
| Focus value (`SHATTERPOINT_FOCUS`) | Vaapad x1.3, tunnel vision flag (6824-6841) |
| XP amount (`SHATTERPOINT_XP`) | Adds it to the 5x track (5576-5587) |
| When a misread is resolved, when focus ends | Clears flags (5571-5574, 5589-5592) — but see bugs 1-2 |
| Strain cost of reading (expected via `FORCE_STRAIN=`) | Nothing Shatterpoint-specific |
| The content perceived (next turn) | A pending-roll reminder in the state block (4098-4113, 4172) |

## Known bugs and fragile spots
1. **Colon-form tags never parse.** The generic parser only matches `KEY = value` (5296-5297). The prompt teaches `SHATTERPOINT_PERCEIVED:` and `SHATTERPOINT_ROLL:` with a colon (2493, 2540-2545); those lines are silently dropped. Only the `=` forms taught at 1746-1747 work.
2. **Bare tags never parse.** `SHATTERPOINT_FOCUS_CLEAR` and `SHATTERPOINT_MISREAD_RESOLVED` have no value, so they never match the same regex (5296) and their switch cases (5571, 5589) are unreachable as taught (1749, 1751, 2553, 2559). A misread flag therefore stays set forever (nothing else clears it; a later successful roll does not), and focus only resets if the AI sends `SHATTERPOINT_FOCUS=0`.
3. **Perceived tier is always 1.** `trimmed.slice(22)` (5538) keeps the separator, so `parseInt("=2")` is NaN and the tier defaults to 1. Same off-by-one in `SHATTERPOINT_ROLL`: `slice(17)` (5560) leaves "=" at the start of the target text.
4. **"JS enforces unlock based on level" is false** (prompt 2455). `SHATTERPOINT_PERCEIVED` accepts any tier (5536-5556); only the state block tells the AI which tiers are locked (4051).
5. **No strain is ever applied by code**, and the AI cannot apply it on most turns: `FORCE_STRAIN=` increases are dropped unless the turn has a TRAINING:/COMBAT:/COMBAT_ROUND:/COMBAT_START: tag, and always dropped during combat (5057, 5508). Path A's 20-40 and Path B's x0.3 strain exist only as prompt text (2474-2489).
6. **"Contested" is flagged as a misread** (6798, 6802) while the prompt calls it an accurate but incomplete read (2497). The state block then demands misread consequences for partial reads (4049).
7. **`window.turnCount` is always undefined.** `turnCount` is a top-level `let` (2784), which is not a `window` property, so `turn` is always 0 (6799, 6803).
8. **Session fields are not protected from SHEET JSON.** The snapshot list (4722-4772) omits `lastShatterpointRoll`, `lastShatterpointMisread`, `shatterpointFocus`, `tunnelVision`, `vaapadAmplification` and (for non-innate characters) `shatterpointLevel`. The AI can rewrite or drop them every turn; an AI-written `shatterpointLevel > 0` unlocks sim practice (8625).
9. **Path A has two tracks.** Without shatterpoint perception, `TRAINING:`/`XP:` on `forceAbilities.Shatterpoint` uses the 1x curve (5119-5121 only guard innate holders), while `SHATTERPOINT_XP` uses the 5x track, and every 5x award deletes the 1x `masterXP` entry (6736-6737) but not the sheet level, which then re-seeds it on the next award (7136-7155).
10. **Path A rules not implemented.** No level-20 cap, no "must roll to notice below level 10", no Tier 3 lock for Path A (lore Forms v3 Path A; legacy/CLAUDE.md §4B).
11. **Sim outcome weight uses level as a tier index.** `SIM_OUTCOME_WEIGHT[min(6, spLevel)]` (11975, 11554): a seeded level-5 character gets the Legendary weight 1.263.
12. **No shatterpoint perception strain reduction in sim** (8625, 11435-11444) despite the talent label "strain x0.3" (8743).
13. **Vaapad check means "has ever trained Vaapad"** (6826), not "Vaapad is active", and multiplies the focus value rather than a cost.
14. **Lore context mislabels non-innate characters.** `buildLoreContext` prints "innate — uncapped track" whenever SP level > 0 (11099-11102), and a `profCap` that has no meaning for Shatterpoint.
15. **Unbounded XP tag.** `SHATTERPOINT_XP` has no cap or hours guard (5576-5587); at level 5 the next level costs 701 XP, so the prompt's 50-150 per use gives a level every 5-14 uses.
16. **Seeding resets partial progress.** Below level 5, `spSeedIfInnate` replaces the total with exactly `spXPToReachLevel(5)` (6750-6752), losing any partial XP above that floor (only matters for saves where the track was damaged).

## Conflicts between sources
- **shatterpoint perception XP discount.** Lore Forms v3 (Path B and the Innate Talents table, ~line 1614) and the XP Reference §11 say x0.1 XP cost; legacy/CLAUDE.md §5A and Docs/CLAUDE changelog.md (lines 76, 121, 257) say "JS applies x0.1"; legacy/CLAUDE.md §4B and Docs/updates.md V123c say "no cost discount". Code: no discount (6723).
- **Tier unlock levels.** Code: Tier 2 at L6, Tier 3 at L11 (6713-6718; prompt 2462, 2468; legacy/CLAUDE.md §9E). Lore Forms v3 "Proficiency Scope by Level": T1 only to L10, T2 from L11-20, T3 from L36-50 / L51+.
- **Lore cost examples don't match its own formula.** Lore says level 1 costs ~2,500 XP, level 5 ~15,000 total, level 20 ~57,000; `floor(500 * 1.07^L)` gives 500, 2,874 and 20,490.
- **Roll anchors.** `buildLoreContext` tells the AI the anchors are Meditation + Willpower + Force Sense (11102); the roll uses only Meditation and Willpower (6777-6778).
- **Strain.** Lore and prompt give Path A 20-40 / Path B x0.3; code applies none.
- **Mace Windu canon value.** Lore Era 11 sheet: "Shatterpoint perception ... Mastered 92%" (SW_Characters_11 line 182); Era 12 table: "Shatterpoint 95" (SW_Characters_12 line 322). One is a percentage, one a level.
- **v2 decision vs lore.** v170-audit and progression-numbers.md §6 make Shatterpoint shatterpoint perception-only; lore Forms v3 still describes a learnable Path A with prerequisites.

## Replaced by
- progression-numbers.md §6 (Shatterpoint is a rare Force ability tagged both, on the main curve, shatterpoint perception only, XP cost x3, no separate track).
- rolls.md §6 (Shatterpoint in combat: d20 + level/10 vs 15, advantage to 3, once per fight; code rolls it, AI cannot grant it).
- ai-events.md (AI never emits XP or roll results).
- Perception tiers, focus / tunnel vision, Vaapad amplification, misreads and out-of-combat interpretation: None — needs a v2 spec.

## Open questions for Jared
1. Path A (learning Shatterpoint without the talent) is in the lore but not in the v2 decision. Is it gone for good, or should non-talented characters be able to learn it at a higher cost?
2. Should a shatterpoint perception character still start at a seeded level (legacy: level 5), and what does that mean on the v2 curve?
3. Do you want focus, tunnel vision and misreads in v2? If so, should "partial" reads count as misreads?
4. Which tier unlock levels are right: the code's (Tier 2 at 6, Tier 3 at 11) or the lore table's (Tier 2 from 11, Tier 3 from 36-51), rescaled to the v2 curve?
5. Should interpreting a shatterpoint cost Force load in the v2 health model, and should the talent reduce it (legacy idea: x0.3)?
6. Vaapad amplification: does it apply whenever the character knows Vaapad, or only while fighting in Vaapad? (Moot in 3,661 BBY, but it affects the data model.)
