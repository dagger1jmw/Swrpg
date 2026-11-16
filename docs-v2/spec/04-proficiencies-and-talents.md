# 04 — Proficiencies, sub-abilities and innate talents (legacy V170 audit)

Scope: sub-ability proficiency percentages (Force Push under Telekinesis, etc.), their cost curve, discount factors, soft cap and trickle; the `PROFICIENCY:` tag; innate talents (`SIM_INNATE_TALENTS`) and their XP/strain effects; talent protection and repair.

## What it does for the player
- A Force ability family (e.g. Telekinesis) has a level. Each sub-application (Force Push, Force Pull ...) has a separate 0-100% proficiency with a tier label: Novice, Developing, Proficient, Expert, Mastered.
- Proficiency is capped by the parent level (soft cap); the sidebar shows "(N% raw)" when capped (7488-7493).
- Training the parent trickles 5% into every sub-ability that has any XP; training a sub-ability sends 20% back to the parent.
- At creation (max 2) or any time in the Talents panel, the player picks innate talents. Five change XP gains, four change strain, one (ShatterSense) unlocks Shatterpoint (see 06); the rest are labels for the AI.

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Cost per proficiency point | `floor(D * 20 * 1.07^(pct * 0.8))`, pct 0..99 | legacy/index.html:7212-7214; XP Reference §12 |
| Derive pct | loop to 100 subtracting cost | legacy/index.html:7217-7228 |
| Total XP 0 -> 100% (computed) | D 1.0: 80,231 · 1.5: 120,360 · 2.5: 200,636 · 4.0: 321,047 | computed from 7212-7214 (doc says ~81,700 / 122,550 / 204,250 / 326,800) |
| D per sub-ability | `FORCE_ABILITY_CATALOG[subKey].D ?? 1.0`, fixed when the entry is first created | legacy/index.html:7253-7256 |
| Base ability factor | base ≥80 0.50 · ≥60 0.60 · ≥40 0.75 · ≥20 0.90 · else 1.00 | legacy/index.html:7231-7237 |
| ForceControl factor | FC ≥80 0.70 · ≥60 0.85 · ≥40 1.00 · ≥20 1.10 · else 1.25 | legacy/index.html:7240-7246 |
| Effective proficiency XP | `rawXP / (baseFactor * controlFactor)` (range x0.8 .. x2.86) | legacy/index.html:7259-7262 |
| Trickle back to parent | `round(rawXP * 0.20)` via `applyXPToSheet('forceAbilities.'+parent)` | legacy/index.html:7268-7270 |
| Trickle forward | every parent XP award adds `baseXP * 0.05` raw to each `parent.*` entry with `totalProfXP > 0` | legacy/index.html:7163, 7277-7285 |
| Soft cap (code) | base ≥80 100% · ≥60 85% · ≥40 70% · ≥20 50% · else 25% | legacy/index.html:7294-7296 |
| Soft cap (sent to AI) | base ≤20 25% · ≤40 50% · ≤60 70% · ≤80 85% · else 100% | legacy/index.html:11090 |
| Tier labels | ≥91 Mastered · ≥71 Expert · ≥51 Proficient · ≥26 Developing · else Novice | legacy/index.html:7300-7306 |
| `PROFICIENCY:` amount | AI-chosen raw number; prompt scale 0.5h casual 8 · 0.5h standard 10 · 0.5h intense 13 · 1h standard 15 · 1h intense 20 · 1h overwhelming 30 | prompt legacy/index.html:1843-1853; parser 5174-5196 |
| `TRAINING:` on a sub-ability | redirected: `calcTrainingXP(..., parentLevel)` -> momentum -> `applyProficiencyXP` | legacy/index.html:5123-5137 |
| Sim proficiency XP | `hours * SIM_INTENSITY * SIM_OUTCOME_WEIGHT[tierNum-1] * strainPenalty * days`, tierNum = floor(effPct/20)+1 | legacy/index.html:11978-11984, 12006-12017 |
| Talent: BladeIntuition | `lightsaberForms.*` XP x1.3 | legacy/index.html:6985-6987 |
| Talent: ForceReservoir | `forceStats.forceOutput` XP x1.3 | legacy/index.html:6988-6990 |
| Talent: QuickStudy | `forceStats.forceKnowledge` XP x1.2 | legacy/index.html:6991-6993 |
| Talent: ForceSensitiveHealer | catalog `fam:'Healing'` or `ForceHealSelf` XP x1.3 | legacy/index.html:6994-7001 |
| Talent: BattleMeditationAffinity | `forceAbilities.BattleMeditation` XP / 0.3 (= x3.33); sim Force strain x0.6 | legacy/index.html:7003-7005, 11440 |
| Talent: NaturalTelekineticBurst | sim Force strain x0.8 for `forceFam === 'TK'` activities | legacy/index.html:11439 |
| Talent: IronMind | sim mental strain x0.8 | legacy/index.html:11441 |
| Talent: UnbreakableSpirit | sim XP penalty above 90 strain 0.3 instead of 0.1 | legacy/index.html:11568 |
| Talents with no code effect | CombatIntuition (+1 when outnumbered), DarkAffinity, LivingForceConnection, PrecognitiveEdge | defined 8737-8742; no other references in the file |
| Talent registry | 13 talents, 2 marked `special` (ShatterSense, BattleMeditationAffinity) | legacy/index.html:8731-8745 |
| Creation limit | max 2 talents | legacy/CLAUDE.md session log V121 |

## State read / written
- `masterXP.forceAbilityProficiency["Parent.Sub"] = { totalProfXP, D }` (7252-7266, 7282; restored on load 8297-8299).
- `masterXP.forceAbilities[parent].totalXP` (trickle back, 7270).
- Read: `characterSheet.forceAbilities[parent]` (level, assumed numeric, 7259, 7293), `characterSheet.forceStats.forceControl` (7260).
- `characterSheet.innateTalents[]`, `characterSheet.innateAbilities[]`, `characterSheet.aptitudes[]` — snapshot before SHEET parse (4722-4723) and restored after (4784-4785, aptitudes merged 4812-4830); repaired on load by `repairTalentConsistency` (7036-7064).
- `simApplyTalentEffects()` is an empty placeholder (11651-11656).

## AI provides vs. code computes
| AI provides | Code computes |
|---|---|
| `PROFICIENCY: Parent.Sub, xpAmount` — the raw amount | Validates `Sub` is a catalog child of `Parent` (5182-5185); applies momentum (5187), discounts, cost curve, trickle |
| `TRAINING:` lines that name a sub-ability | Redirect into proficiency (5122-5137) |
| Talents at character creation only (legacy/CLAUDE.md §7D); in play any SHEET change is reverted | Talent XP multipliers (6981-7008), sim strain effects (11435-11444) |
| Narrative of non-coded talents (Combat Intuition, Dark Affinity, ...) | Nothing |
| Aptitude labels in SHEET | Merged and de-duplicated; labels matching a talent are promoted to `innateTalents` on load (7044-7052) |

## Known bugs and fragile spots
1. **Talent multiplier only on two paths.** Applied in the main `TRAINING:` branch (5142) and in sim (11996). Not applied to `TRAINING:` on sub-abilities (5130), `COMBAT:` (5160-5168), `PROFICIENCY:` (5187), `XP:` (5214), `endCombat` (6600, 6604), prose fallback (5998), XP inject (8501) or trickle-back (7270). Blade Intuition never boosts combat XP for forms.
2. **Talent multiplier applied after momentum and rounded twice** (5141-5142); both outside any cap.
3. **BattleMeditationAffinity label says "XP x0.3"** (8744) but code multiplies XP by 3.33 (7004). The XP Reference §11 calls it "XP x0.3 (70% cheaper)".
4. **Soft cap is off by one between code and AI context.** At parent level 20/40/60/80 code gives 50/70/85/100% (7294-7295); the AI is told 25/50/70/85% (11090); the XP Reference gives 0-20 -> 25%.
5. **Two different XP scales for the same session.** `TRAINING: forceAbilities.ForcePush ...` uses `calcTrainingXP` with the parent's tier multiplier (5129-5130); `PROFICIENCY: Telekinesis.ForcePush, N` uses the AI's raw N with no tier multiplier (5187). The prompt asks for both lines every session (1847-1850), so the parent gets base XP plus a 20% trickle-back on top.
6. **Trickle is not discounted, the direct award is.** Forward trickle adds raw XP to `totalProfXP` (7282); direct awards are divided by the discount (7262). A sub trained directly also receives 1% back through sub -> parent -> sub (7270 -> 7163 -> 7282).
7. **Trickle-back bypasses the hours guard and talents** and feeds the parent from AI-chosen `PROFICIENCY:` amounts.
8. **Level read as number only.** `characterSheet.forceAbilities[k] || 0` (7259, 7293, 8450) — if the AI writes an object `{level: N}`, comparisons fail and the factor falls to 1.0 / cap to 25%. Sync normally makes these numbers, but not for keys without a `masterXP` entry (see 03 bug 1).
9. **D frozen at first award** (7255); catalog changes never reach existing entries.
10. **Four talents do nothing in code** (CombatIntuition, DarkAffinity, LivingForceConnection, PrecognitiveEdge, 8737-8742). Their effect strings promise mechanics (+1 to rolls, strain x0.85, prerequisite one tier lower).
11. **Talent repair promotes AI text into mechanics.** `repairTalentConsistency` turns any aptitude label that matches a talent label into an active talent (7044-7052). An AI-written aptitude "Blade Intuition" becomes a real x1.3 talent on next load.
12. **Talent snapshot restore is skipped when empty.** `if (_savedInnateTalents.length)` (4784): a character with zero talents keeps whatever talents the AI writes into SHEET JSON. Same for `innateAbilities` (4785).
13. **Sim proficiency outcome weight** uses the proficiency band as a tier index (11981-11982), a different meaning from the stat-tier weights.

## Conflicts between sources
- **Proficiency totals.** XP Reference §12 and legacy/CLAUDE.md §4F: ~81,700 / 122,550 / 204,250 / 326,800. Code: 80,231 / 120,360 / 200,636 / 321,047. The "equivalent base-ability level" column (60/67/73/80) was matched to the wrong cumulative table (see 03).
- **Soft cap bands.** XP Reference §12 (0-20 -> 25%) vs code (≥20 -> 50%) vs AI context (≤20 -> 25%).
- **BattleMeditationAffinity.** XP Reference §11 "XP x0.3 (70% cheaper)"; talent label "XP x0.3"; code x3.33 XP.
- **ShatterSense XP effect.** XP Reference §11 "XP cost x0.1"; code none (see 06).
- **v170-audit "flat multipliers x1.2-1.3".** BattleMeditationAffinity is x3.33.
- **Lore vs code.** `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md` (line ~1614) lists ShatterSense as "x0.1 XP cost, 70% strain reduction"; code has no discount and no strain reduction for Shatterpoint.

## Replaced by
- progression-numbers.md §14 (synergy: parent -> sub-ability 0.10, sub -> parent 0.15, ceilings, 25% spillover cap) replaces trickle and the proficiency track.
- progression-numbers.md §5 (talent per domain: none 1.0 / gifted 1.25 / prodigy 1.5 / exceptional 1.8, cross-talent, all inside the 2.8 cap) replaces flat talent multipliers.
- force-catalog.md (parent/sub-ability structure, prerequisites incl. required talents).
- npc-generation.md §2 (talent distribution for NPCs).
- Strain-modifying talents (IronMind, NaturalTelekineticBurst, BattleMeditationAffinity strain, UnbreakableSpirit): None — needs a v2 spec (health.md fatigue model has no talent hooks).
- Non-XP narrative talents (CombatIntuition, DarkAffinity, LivingForceConnection, PrecognitiveEdge): None — needs a v2 spec.

## Open questions for Jared
1. Should sub-abilities still show a percentage (Novice..Mastered), or become ordinary levels on the main curve linked by synergy as progression-numbers.md §14 implies?
2. Which legacy talents carry into v2, and how does each map onto domain talent levels (gifted / prodigy / exceptional)? For example, is Blade Intuition "gifted in lightsaber forms"?
3. Do you want strain/fatigue talents (Iron Mind, Natural Telekinetic Burst, Unbreakable Spirit) in v2? They would need hooks in the fatigue model.
4. Combat Intuition, Dark Affinity, Living Force Connection and Precognitive Edge never had code. Keep, redesign, or drop?
5. Should Battle Meditation (Innate) stay a separate special talent, and was x3.33 XP the intended strength?
