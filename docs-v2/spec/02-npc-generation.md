# 02 — NPC Generation (legacy V170 audit)

Audited file: `legacy/index.html` (V170). Read-only audit.

## What it does for the player

- **Generic opponents.** The AI sends `NPC_ROLL=name|archetype|tier[|flags]`, and code rolls a stat block from an archetype weighting and a tier point pool (`npcGenerateStats`, 3072). The player sees the numbers in roll cards and the combat tier.
- **Canon NPCs.** Five hand-set profiles (Zym, Satele Shan, Darth Malgus, Ngani Zho, Gnost-Dural) are seeded at creation and on load (`CANON_PROFILES_3661BBY` 3573-3626, `seedCanonProfiles` 3628).
- **People panel.** `renderCharactersPanel()` (8172-8194) shows `worldState.trackedCharacters` as cards with name, title, relation, summary and last seen. Records come from the AI's `KNOWN_PERSON=` tag or from `INTERACTION=` weight reaching 5.
- **Lifecycle.** Profiles are disposable, active, dormant or deceased (comment 3116-3125, `npcApplyFate` 3128). Disposable profiles are deleted at the end of combat. Dormant ones can come back stronger via `RECURRING_RETURN=`.
- **Scene presence and agendas.** `getSceneNPCs()` (3926) works out who is present, and `buildEventInjection()` (3960) sends those NPCs' agendas and the pending story threads to the AI.
- **Opponent stat repair.** Stats are locked after the first INLINE roll (4400-4435), missing categories are backfilled (`backfillOppStats` 10787), and the opponent name is reconciled when it changes (`syncCombatOpponentName` 6561).

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| `NPC_POOLS` (core/force/saber/coreMax/forceMax) by tier | 1: 60/40/8/20/18; 2: 110/95/30/38/35; 3: 170/150/60/58/55; 4: 230/205/90/78/75; 5: 290/260/120/98/95; 6: 380/340/170/145/140. Tier 7 is deliberately absent | 3006-3013 |
| Archetypes (core weights str/agi/end/wil/cha/int; force weights fS/med/fK/fC/fOut) | TrainingDroid 1.1/1.3/1.4/0.2/0.1/0.7; Mook 1.0/1.0/1.0/0.8/0.6/0.7; Soldier 1.1/1.1/1.2/0.9/0.7/0.8; Officer 0.6/0.7/0.8/1.0/1.1/1.5; TacticalLeader 0.7/0.8/0.9/1.0/1.4/1.3; BattleIntel 1.3/0.9/1.0/0.9/0.7/1.3 (all non-Force); Guardian 1.3/1.2/1.3/1.0/0.7/0.7, force 0.8/0.7/0.7/0.9/0.9, form ShiiCho, abilities Telekinesis+ForceSpeed; JediConsular 0.7/0.8/0.8/1.2/1.0/1.1, force 1.3/1.3/1.2/1.2/1.0, form Makashi, abilities Telekinesis+MindTrick+ForceBarrier; SithInquisitor 0.7/0.8/0.8/1.1/0.9/1.0, force 1.2/1.1/1.2/1.3/1.3, form Makashi, abilities Telekinesis+ForceLightning | 3018-3040 |
| Weighted spread | Each point goes to an open key with probability weight/Σweights; keys at the cap are excluded; 3000 iterations max | 3045-3064 |
| Unknown archetype | Falls back to Mook | 3074 |
| Tier clamp | `max(1, min(6, parseInt(tier) or 3))` | 3075 |
| Prodigy | Budget tier = min(6, tier+1); the returned `tier` keeps the requested value | 3076, 3113 |
| Form level | `lightsaberForms[primaryForm] = pool.saber` (fixed, not rolled) | 3095-3097 |
| NPC Force ability level | `round(((fC+fOut)/2) × U(0.85, 1.15))`, clamped to 1..forceMax | 3104-3110 |
| Interaction weights | combat 3, training 2, force 2, dialogue 1; profile becomes visible in People at ≥ 5 | 5671, 5693 |
| GENERATE_PROFILE tier | 'canon' → 1, else 2 (a "canon flag", not the dueling tier) | 5597 |
| Backfill value | Mean of the opponent's existing positive stats, or 20 if it has none | 10758-10762, 10800, 10807 |
| Canon profile values | Zym: Soresu 72; FS85 Med90 FK88 FC80; STR45 AGI48 END55 WIL85. Satele: Ataru 75 Niman 55; FS72 Med68 FK65 FC78; TK62 Barrier58 Speed65; STR58 AGI72 END65 WIL70 CHA68. Malgus: DjemSo 88 Juyo 72; FS68 FC85 FK62 Med45; Lightning75 TK80 Choke72; STR78 AGI65 END80 WIL82. Ngani Zho: Soresu 65 Niman 60; FS78 Med85 FK80 FC68; STR38 AGI35 END42 WIL82. Gnost-Dural: Niman 60 Soresu 55; FS68 Med72 FK92 FC62; STR42 AGI45 END50 WIL78 | 3573-3626 |
| NPC home locations | Denko→salle; Zym→council; Satele→temple/archives/council; Ngani Zho→temple/quarters/meditation; Gnost-Dural→archives; Elara→salle/dormitory/quarters | 3724-3731 |
| Event injection caps | ≤ 2 critical, ≤ 2 high, medium until 5 total; ≤ 3 agenda items per NPC; ≤ 2 unsurfaced galaxy events | 3974-3976, 3996, 4003 |

## State read / written

- `worldState.characterProfiles[name]`: `{ name, displayName, description, tier, archetypeKey, prodigy, stats:{cat:{key:val}}, visibleInPeople, lifecycleState, firstMet, wookieepediaUrl, returnCount, permanentInjuries[] }`
- `worldState.interactionWeights[name]` (number)
- `worldState.trackedCharacters[]`: `{ name, title, relation, summary, lastSeen }`
- `worldState.npcAgendas[name][]`: `{ priority, summary, context, createdDate }`
- `worldState.pendingEvents[]`, `worldState.sceneNPCs[]`, `worldState.galaxyEventQueue[]`
- `activeCombat.opponent`, `activeCombat.lockedForm`, `activeCombat.opponentTier`
- `worldState.trackedCharacters`, `characterProfiles` and `interactionWeights` are snapshotted and restored around the WORLD JSON parse (4881-4904). `sceneNPCs` is **not** restored there, so the AI's WORLD JSON can set it.

## AI provides vs. code computes

| AI provides | Code computes |
|---|---|
| NPC name, archetype key, tier 1-6, flags (`NPC_ROLL=`) | Every stat number, form level and ability level (`npcGenerateStats`) |
| Exact canon stats (`PROFILE_STATS=`), never validated | Nothing; the values are written as given (5614-5633) |
| First-round INLINE stat block (`ROLL_OPPOSED ... vs INLINE:`) | Locks dotted-key stats into the profile (4421-4434) |
| Fate (`COMBAT_END` 6th field), `NPC_LIFECYCLE=`, `RECURRING_RETURN=` tier bump | Lifecycle transitions, deleting disposable profiles, re-rolling stats |
| `KNOWN_PERSON=` title, relation, summary, last seen (sent every turn) | Upsert into trackedCharacters |
| `INTERACTION=` type | Weight sum, visibility threshold, People bridge |
| `SCENE_NPCS=`, `NPC_AGENDA=`, `RESOLVE_NPC_AGENDA=`, `PENDING_EVENT=`, `RESOLVE_EVENT=` | Storage, priority ordering, injection |
| Relationship (free-text "relation" field) | Nothing; there is no relationship number |

## Known bugs and fragile spots

1. **High — `RECURRING_RETURN=` can never work.** It parses with `trimmed.slice(18)` (5483), but `"RECURRING_RETURN="` is 17 characters, so the first letter of the NPC name is dropped. The lookup `characterProfiles[rrName]` (5486) fails every time.
2. **High — `GENERATE_PROFILE=` keys profiles under "=Name".** It parses with `trimmed.slice(16)` (5595), but the prefix with `=` is 17 characters, so `gpName` keeps the leading `=`. The profile is created under the wrong key and later `CHARACTER:Name` lookups miss it.
3. **High — the INLINE stat lock fails for the format the prompt teaches.** The prompt teaches bare keys (`INLINE:ShiiCho=28,strength=35,agility=30`, 1968, 2222), but auto-registration persists only dotted keys (`if (dotIdx >= 0)`, 4426-4432). The profile is created with `stats:{}` (4424), so the next round sees no stats and parses the AI's new INLINE numbers again. This is the exact stat drift V138 claimed to fix. `backfillOppStats` does not save it either, because it skips keys already present (10797, 10805).
4. **Med — `INTERACTION=` creates empty stat stubs** (5687-5692) with `tier:2` and `stats:{}`. These were the root cause of V159. The stubs still feed the `oppStatsFallback` path (4396-4398).
5. **Med — `priorityOrder[x] || 3` turns critical (0) into 3.** `critical` sorts as low in pendingEvents (3970) and in NPC agenda sorting (3994).
6. **Med — `getSceneNPCs()` matches on the date half of lastSeen.** `lastSeen` is "Day 5 Frostuary, Training Salle" (prompt 1901), and `.split(',')[0]` takes the date part (3937), so the location test never matches. Separately, the `'temple'` keyword (3727-3728) puts Satele and Ngani Zho "in scene" at nearly any Temple location.
7. **Med — the `tier` field means three different things.** It is a canon/custom flag in GENERATE_PROFILE (5597), the CANON_PROFILES flag tier:1 (3575), and the dueling tier 1-6 in NPC_ROLL (5655). `RECURRING_RETURN` adds a bump to whichever one is stored (5488).
8. **Med — canon profiles exist only for 3,661 BBY** and are seeded whatever the era (3443, 3566, 3632). Two NPCs in `NPC_HOME_LOCATIONS` (Master Denko, Elara; 3725, 3730) and in milestone npcs (3758) are not in the lore files.
9. **Med — NPCs never age or grow.** The profile has no birth year or species field, so growth happens only through the AI tag `RECURRING_RETURN`. This contradicts Master Prompt v7.1 Part XVIII ("Custom characters age in real time").
10. **Low — `PROFILE_STATS=` only updates an existing profile** (5618). If it arrives before `GENERATE_PROFILE`/`NPC_ROLL`, it is silently dropped. Values are not range-checked (5625).
11. **Low — the KNOWN_PERSON relation is free text.** Only ally/mentor/hostile get colors (8185); "Rival", "Friend" and "Unknown" show as neutral.
12. **Low — NPC_ROLL re-rolls an existing named profile** (5651-5663), including a canon one if the AI uses a canon name. The prompt forbids this (1761), but code does not prevent it.
13. **Low — `npcApplyFate('disposed')` deletes the profile, but the `trackedCharacters` entry, if any, remains** (3145).
14. **Low — `Math.random()` is used directly** (3054, 3108), so generation cannot be seeded.
15. **Low — prompt corruption.** In the WORLD rules, the INTERACTION tag description is followed straight away by "- forceAbilities: plain numbers only." (1909-1911), a fragment from another list.

## Conflicts between sources

- **Three different stat blocks for the same canon NPC.** For example, Satele's Ataru is 75 in CANON_PROFILES (3589), 80 in LORE_DATABASE (9060) and 88 at prime in the lore (SW_Characters_09_GreatGalacticWar_ColdWar.md, Satele sheet; the lore says to "scale down" for 3,661). Zym's lore values are Soresu 76 / ShiiCho 66, STR48 AGI52 END56 WIL88 CHA80 INT82, FS86 Med90 FK88 FC82 FOut76 (lore Zym sheet), against Soresu 72 and lower values in the code (3579-3581), with no CHA/INT/FOut. Ngani Zho's lore table row (line 683) gives Soresu 72 · Shii-Cho 68, STR56 AGI58 END60, against Soresu 65 · Niman 60, STR38 AGI35 END42 in the code (3611-3613). Gnost-Dural's lore row (line 684) gives Soresu 70 · Shii-Cho 66, INT 90, against Niman 60 · Soresu 55 in the code (3621-3623). Malgus's lore primary is "Shien/Djem So 92", against DjemSo 88 / Juyo 72 in the code (3600).
- **Satele's weapon.** LORE_DATABASE says "Double-bladed lightsaber" (9057). The lore sheet does not mention a double-bladed saber.
- **Master Prompt v7.1 Part XVIII** says custom characters "are not disposable props" and "age in real time". The code defaults NPC_ROLL NPCs to `disposable` and deletes them at COMBAT_END (5661, 3145).
- **legacy/CLAUDE.md log V145/V146** describes NPC_ROLL and RECURRING_RETURN as working. RECURRING_RETURN is broken by the slice bug above.
- **NPC_POOLS tier names** (Untrained/Apprentice/Adept/Master/High Master/Legendary, 3007-3012; prompt 1764) vs. legacy/CLAUDE.md §3D (Initiate/Padawan/Knight/Master/Grandmaster/Legendary). The CLAUDE.md V123 log says the old names were removed from the prompt, but they are still at 1764.

## Replaced by

- Stat generation (pools, archetype weights, prodigy, RECURRING_RETURN growth): **Replaced by npc-generation.md** (closed-form level from years × pace, archetype skill weights, talent distribution, seeded variance, lazy generation, recompute on date).
- Canon profiles: **Replaced by npc-generation.md §5** (hand-set from Docs/SWRPG lore/, validated against pace).
- Minion stat blocks (TrainingDroid/Mook): **Replaced by npc-generation.md §6.**
- AI tags `NPC_ROLL`, `GENERATE_PROFILE`, `PROFILE_STATS`, `INTERACTION`, `KNOWN_PERSON`, `NPC_LIFECYCLE`, `RECURRING_RETURN`, `NPC_AGENDA`, `PENDING_EVENT`: **Replaced by ai-events.md** (`npcIntroduced`, `npcStatusChanged`, `relationshipChanged`, `factLearned`, `threadOpened/Progressed/Resolved`).
- Opponent INLINE stats, backfill and name sync: **Replaced by npc-generation.md + rolls.md** (no AI-supplied numbers).
- People panel display, scene-presence inference, NPC agendas: **None — needs a v2 spec** (ai-events.md gives the events but there is no presence/agenda/relationship-model spec).

## Open questions for Jared

1. Should v2 keep NPC agendas (NPC_AGENDA) and AI-proposed story threads as a feature, and does ai-events.md's `thread*` cover agendas?
2. Should the invented NPCs Master Denko and Elara survive into v2? They are not in the lore files.
3. Which canon value wins when a lore sheet is a "prime" sheet and the game year needs a scaled-down value (Satele, Malgus)? Should v2 compute the scale-down from age and pace (npc-generation.md §5) or hand-set it?
4. Does Satele wield a double-bladed lightsaber in 3,661 BBY (LORE_DATABASE says yes, the lore sheet is silent)?
5. Should relationships become a number (ai-events.md `relationshipChanged delta −3..+3`) shown in the People panel, replacing V170's free-text relation labels?
