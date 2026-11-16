# 09 — Rolls and opponents (legacy V170 audit)

Scope: `fireRoll` (d20 + compressed stat bonuses + experience bonus + tier-gap bonus + tactical − penalties), opposed vs solo rolls, roll paths, `scanAndFireRollTags`, opponent stat resolution (`CHARACTER:` / `INLINE:` / fallback), `getOppRelevantStats` (V163), `backfillOppStats` / `persistOppStatBackfill` (V164), opponent name sync (V159), `NPC_ROLL` / `PROFILE_STATS` / canon seeding, and randomness. Combat flow is in `08-combat.md`; HP/injury penalties are in `10-injury-health-strain.md`.

## What it does for the player

- When the AI (or the pre-roll call) declares `ROLL:` or `ROLL_OPPOSED:` plus `ROLL_LABEL=`, JS rolls a d20 and shows a roll card with every bonus and penalty.
- Solo rolls give a result band (Fail / Contested / Solid / Strong / Overwhelming) from the total.
- Opposed rolls also roll for the opponent and label the margin (Narrow / Clear / Dominant / Overwhelming win or loss).
- Tier differences matter most: one tier up or down is worth ±4 on the d20, six tiers ±39.
- Opponent stats come from a stored profile (canon seed, `NPC_ROLL`, `PROFILE_STATS`), from inline numbers the AI writes on first contact, or, when nothing is registered, from an estimate based on the player's own bonus.

## Rules and formulas

| Constant / formula | Value | Source |
| --- | --- | --- |
| `compressedBonus(s)` | s≤40: s/20; ≤80: 2 + (s−40)/40; ≤100: 3 + (s−80)/80; else 3.25 + (s−100)/200 | legacy/index.html:6857-6863 |
| `statToTier(s)` | ≤20 → 1 Untrained; ≤40 → 2 Apprentice; ≤60 → 3 Adept; ≤80 → 4 Master; ≤100 → 5 High Master; ≤150 → 6 Legendary; else 7 Transcendent | legacy/index.html:6865-6874 |
| Stat bonus | Σ `compressedBonus(liveValue(path))` over all declared paths | legacy/index.html:10873 |
| Experience bonus (form rolls) | `compressedBonus(highest form level) × 0.4` (highest form overall, not the form used) | legacy/index.html:10854-10862 |
| Experience bonus (form or Force rolls) | + `compressedBonus(forceControl) × 0.3` + `compressedBonus(forceSense) × 0.2` | legacy/index.html:10863-10871 |
| Player tier | `statToTier(paths[0] value)` | legacy/index.html:10874-10875 |
| Opponent tier | `statToTier(getOppPrimaryStatValue(oppStats, paths[0]))` if opponent data; else player tier − AI `TIER_GAP` (clamped 1-7) | legacy/index.html:10880-10889 |
| `tierGap` | player tier − opponent tier (positive = player stronger) | legacy/index.html:10885 |
| Tier-gap bonus (player only, signed) | `[0, 4, 9, 15, 22, 30, 39][min(6,|gap|)]` × sign(gap) | legacy/index.html:10891-10892 |
| Tactical | AI `TACTICAL=`, clamped to ±5 | legacy/index.html:10839 |
| Player total | `d20 + stat + exp + tierGapBonus + tactical − penalties` | legacy/index.html:10902-10905 |
| Penalties | `calcRollPenalties` (HP, injuries, off-hand, pain channel; see 10) | legacy/index.html:10648-10673, 10900 |
| Opponent bonus (registered stats) | Σ `compressedBonus` over `getOppRelevantStats(oppStats, paths)`, or all of `oppStats` if that returns null | legacy/index.html:10946-10950 |
| Opponent bonus (no stats) | `playerStatBonus − tierGapBonus` | legacy/index.html:10953 |
| Opponent injuries | − Σ severity weight (minor 1, moderate 2, severe 3, critical 5) | legacy/index.html:10676-10680, 10956-10959 |
| Opponent total | `d20 + oppBonus − oppInjury` (no experience bonus, no tactical, no tier-gap term) | legacy/index.html:10959-10961 |
| Opposed labels (margin = player − opp) | ≥13 Overwhelming; ≥8 Dominant win; ≥4 Clear win; ≥1 Narrow win; =0 Contested; ≥−3 Narrow loss; ≥−7 Clear loss; ≥−12 Dominant loss; else Overwhelming loss | legacy/index.html:10971-10979; prompt 1982-1984 |
| Solo bands (total) | <8 Fail; 8-11 Contested; 12-16 Solid; 17-20 Strong; 21+ Overwhelming | legacy/index.html:10993-10999; prompt 1983 |
| Banner text by label | `resolutionLineFor` map | legacy/index.html:10820-10833 |
| `getOppRelevantStats` | dotted-key profiles only; form path → opponent's highest `lightsaberForms.*`; other paths → exact key; null if nothing matched | legacy/index.html:10712-10735 |
| `getOppPrimaryStatValue` | exact path → bare key → best form (for form rolls) → **first value in the object** | legacy/index.html:10684-10700 |
| Backfill | for each player path the opponent lacks: form → `extractOppFormFromLabel(label)` ‖ ShiiCho; value = mean of the opponent's positive stats ‖ 20; persisted to the profile | legacy/index.html:10787-10812, 10758-10762, 10767-10778 |
| `CANON_FORM_KEYS` | ShiiCho, Makashi, Soresu, Ataru, Shien, DjemSo, ShienDjemSo, Niman, Juyo, Vaapad, JarKai, KiiShikk | legacy/index.html:10740 |
| NPC pools (tier → core/force/saber/coreMax/forceMax) | 1: 60/40/8/20/18; 2: 110/95/30/38/35; 3: 170/150/60/58/55; 4: 230/205/90/78/75; 5: 290/260/120/98/95; 6: 380/340/170/145/140 | legacy/index.html:3006-3013 |
| NPC archetypes | TrainingDroid, Mook, Soldier, Officer, TacticalLeader, BattleIntel, Guardian, JediConsular, SithInquisitor (weights) | legacy/index.html:3018-3040 |
| NPC force abilities | level = `(fC + fOut)/2 × U(0.85, 1.15)`, clamped 1..forceMax | legacy/index.html:3104-3110 |
| Prodigy | budget pool one tier up (max 6), returned `tier` unchanged | legacy/index.html:3075-3077 |
| `RECURRING_RETURN` | intended: re-roll at tier + bump (clamped to 6). **In V170 it never runs:** `slice(18)` drops the first letter of the name, so no profile matches (see bugs.md BUG-003) | legacy/index.html:5482-5494 |
| Canon seeds (3661 BBY) | Grand Master Zym, Satele Shan, Darth Malgus, Master Ngani Zho, Master Gnost-Dural; seeded on new game and load if missing | legacy/index.html:3573-3636; calls 3443, 3566, 8325 |
| Random sources | `Math.random()` at 3054, 3108, 3174, 6782, 10904, 10960 | grep |

## State read / written

- Read: `characterSheet.lightsaberForms|forceStats|forceAbilities|stats` via `getLiveStatValue` (10562-10573), `characterSheet.injuries|hp|dominantHand|fightingWith|painChannelActive|alignment`, `activeCombat.opponent|lockedForm|oppInjuries`.
- Written: `activeCombat.tierGap` (10897), `activeCombat.lastRollResult` (10983-10988), `activeCombat.lockedForm` (4366), `characterSheet.lastRoll` (11008-11015), `worldState.characterProfiles[name].stats[cat][key]` (INLINE registration 4416-4427, backfill 10767-10778, `PROFILE_STATS` 5614-5633, `NPC_ROLL` 5634-5664), `.archetypeKey|tier|prodigy|lifecycleState|returnCount`, profile renames in `syncCombatOpponentName` (6561-6579).
- DOM: roll card appended to `#story-feed` directly from `fireRoll` (11003-11007).

## AI provides vs. code computes

| AI provides | Code computes |
| --- | --- |
| Which stat paths to roll (`ROLL:` / `ROLL_OPPOSED:`), the label | d20s, compressed bonuses, experience bonus, tier from stats, margin, label |
| `TIER_GAP=` (used only when no opponent data) | Tier gap from registered stats when present |
| `TACTICAL=` (situational and form-counter bonuses, all judged by the AI) | Clamp to ±5 |
| Opponent identity (`CHARACTER:` name) or invented numbers (`INLINE:`) | Profile lookup, placeholder-name sync, persistence, backfill |
| `NPC_ROLL` archetype + tier + flags; `PROFILE_STATS` numbers for canon NPCs | Stat generation from pools |
| `OPP_INJURY_ADD` | Opponent injury penalty |

## Known bugs and fragile spots

1. **Fractional margins in (0,1) get "Narrow loss" with `winner:'player'`** (10971-10979, 10986). "Contested" is unreachable in practice. See 08 bug 1.
2. **Fallback opponent double-counts the tier gap.** With no stats, opponent bonus = `statBonus − tierGapBonus` (10953) while the player also gets `+tierGapBonus` (10902), so a one-tier gap from `TIER_GAP=1` makes an 8-point swing, not 4. This fires on every opening roll against an `NPC_ROLL` / `PROFILE_STATS` opponent (those tags are applied after the scan; see bug 3) and whenever a profile exists with empty stats (`INTERACTION` / `GENERATE_PROFILE` stubs, 5688-5692, 5602-5607).
3. **Ordering: NPC_ROLL / PROFILE_STATS after the roll.** `scanAndFireRollTags(rawText)` runs at 4997, and the CHANGES loop that applies `NPC_ROLL` / `PROFILE_STATS` runs later (5059+). The prompt explicitly tells the AI to emit `NPC_ROLL` and then `ROLL_OPPOSED … vs CHARACTER:` in the same reply (1768), so the first exchange never uses the generated stats. The V170 pre-roll can't see them at all.
4. **NPC pools land saber forms one tier too high at tiers 4-6.** The fixed saber value is 90 (statToTier → 5), 120 (→ 6) and 170 (→ 7 Transcendent) (3010-3012, 3094-3096). This contradicts the comment at 3002-3004 and the "never Transcendent" ceiling (1770, 5476-5481). Core and force budgets, by contrast, average below the tier: tier 3 core 170/6 ≈ 28 → tier 2. So the same NPC is over-tier on forms and under-tier on stats.
5. **Opponents get no experience bonus.** The player's `expBonus` (up to about 1.3 + 1.0 + 0.65) has no opponent equivalent (10956-10959). The prompt says "Both sides roll using … experience modifier" (2191). This is a systematic player bias.
6. **`getOppPrimaryStatValue` final fallback uses the first stat in the object** (10698-10699), e.g. charisma, to set the opponent's tier and therefore the ±4..39 gap bonus. This is the same class of bug that V163 fixed for the bonus sum but not for the tier.
7. **Two-form (hybrid) rolls.** The prompt says "JS averages them for tier calculation" (1993). Code uses only `paths[0]` for the tier (10874) and adds both forms to the stat bonus (10873), so a hybrid roll gets an extra full form bonus.
8. **Experience bonus uses the highest form overall** (10855-10858), not the form being rolled, so a weak form used in a fight still gets the best form's experience.
9. **Opponent injuries double-count with TACTICAL.** The prompt grants +2 TACTICAL for "Opponent visibly injured" (2014) while code already subtracts injury weights from the opponent (10956-10959).
10. **Strain penalties are prompt-only.** The prompt lists −1/−2/−3 roll penalties at strain 21/51/81 (2331, 2337, 2342) and −1/−3 TACTICAL at 60+/80+ (2024-2025). `calcRollPenalties` (10648-10673) applies no strain penalty, so it depends on the AI remembering to fold it into `TACTICAL`.
11. **Form-counter bonuses and multi-opponent rules are prompt-only** (1995-2000, 2048-2054, 2295-2304) and must fit inside the ±5 tactical cap together with all situational bonuses.
12. **`TIER_GAP` sign description is self-contradictory**: "Positive = player is stronger (opponent's tier − player's tier…)" (2034). Code uses player − opponent (10885).
13. **Backfill invents numbers.** The mean of whatever the opponent has, or 20 (10758-10762), is persisted permanently (10767-10778), so a droid with Str 60 gets Soresu 60 forever. `persistOppStatBackfill` creates a `'disposable'` profile even for canon names that were never seeded (10770-10772).
14. **INLINE first-contact numbers are AI-invented** (4415-4420) and then locked for the profile's life, including later fights. Bare-key INLINE values without a dot are not persisted (4422-4432 only stores dotted keys), so a bare-key block (the prompt's own examples at 1968 and 2222) is re-read from each new INLINE tag every exchange. This is the opposite of the "locked" promise in the prompt (2224).
15. **Name matching is exact-string.** `CHARACTER:Malgus` does not find the seeded `'Darth Malgus'` (3596); the placeholder test is a regex on leading articles (4380-4382, 5682-5684). When the main AI's `COMBAT_START` name differs from the pre-roll's, `activeCombat.opponent` is overwritten without moving stats (5072-5073).
16. **Canon seeds carry `tier: 1`** (3575, 3585, 3595, …) although their stats are tier 4-5. The `tier` field is meaningless for canon NPCs. `seedCanonProfiles` runs on every load (8325) and only fills missing names, so seed corrections never reach existing saves.
17. **`NPC_ROLL` re-rolls on every emission**, overwriting stats of an existing profile (5652-5662). An AI that repeats the tag mid-fight changes the opponent.
18. **No seeded RNG**: 6 `Math.random()` sites (3054, 3108, 3174, 6782, 10904, 10960). Rolls can't be replayed or tested.
19. `fireRoll` renders HTML and writes `characterSheet.lastRoll`; there is no pure roll function to test.

## Conflicts between sources

- **Tier names:** prompt (1973-1980, 2645-2652) Initiate/Padawan/Knight/Master/Grandmaster vs code (6865-6874) Untrained/Apprentice/Adept/Master/High Master.
- **Hybrid forms:** prompt "averages" (1993) vs code (first path for tier, both summed for bonus).
- **Experience modifier for both sides:** prompt 2191 and the DUEL DISPLAY FORMAT (2263-2279) vs code (player only).
- **Form counters:** listed twice in the prompt, once as "declare via TACTICAL=" (1995-2000) and once as rules that stack "ON TOP OF tier gap" (2295-2304). Code has neither.
- **Strain roll penalties:** prompt thresholds 21/51/81 (2331-2342) vs prompt TACTICAL 60+/80+ (2024-2025) vs code none.
- **Docs/SW_Injury_System_v1.md §10** shows an opponent roll card with stat bonuses of a different scale (+6.38 for 45/40/50), which doesn't match `compressedBonus`. That is a design-doc example from before compression.
- **NPC pool comment vs data** (3002-3004 vs 3010-3012): see bug 4.

## Replaced by

- `docs-v2/spec/rolls.md`: d20 + effective level/10, no tier-gap bonus anywhere, nat 20/1 ±5, advantage track, circumstance modifiers computed by code (surprise, opening, position, terrain, numbers, form matchups, state of mind), seeded RNG, roll card. Replaces `compressedBonus`-based rolls, `tierGapBonus`, `TACTICAL=`, `TIER_GAP=`, experience bonus, and the solo bands (replaced by DC = 10 + rating/10, §2).
- `docs-v2/spec/npc-generation.md`: replaces `NPC_POOLS` / `npcGenerateStats` / `RECURRING_RETURN` tier re-rolls, INLINE invented stats, and backfill.
- `docs-v2/spec/health.md` §9: opponent wounds replace `OPP_INJURY_*` weights.
- `docs-v2/spec/ai-events.md`: replaces `ROLL:` / `ROLL_OPPOSED:` / `ROLL_LABEL=` text tags.
- Not covered: matching opponents by name (aliases such as "Malgus" vs "Darth Malgus") needs a v2 identity rule.

## Open questions for Jared

1. In v2, can the AI ever introduce an opponent whose numbers aren't generated by npc-generation.md (e.g. a one-off canon cameo with no hand-set values)? If yes, what is the fallback?
2. Should NPC identity use stable IDs with aliases ("Malgus" = "Darth Malgus") so the AI's naming drift can't fork a profile?
3. Do you want the roll card to keep showing the result-band words (Narrow / Clear / Dominant / Overwhelming), or switch fully to rolls.md hit-quality words (graze / solid / clean / critical)?
4. Should canon seed profiles (Zym, Satele, Malgus, Ngani Zho, Gnost-Dural) be migrated as hand-set data and re-checked against the progression curve, as npc-generation.md suggests?
