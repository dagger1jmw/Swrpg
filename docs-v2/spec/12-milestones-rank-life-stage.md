# 12 — Milestones, rank and life stage (legacy V170 audit)

Audited file: `legacy/index.html` (V170, commit 8bef4a1). All line numbers were checked by reading the code.

## What it does for the player
- **Rank at creation.** The player picks a faction and a rank (legacy/index.html:1232-1235, `CC_RANKS` 2956-2993). For Jedi, changing the age nudges the rank among youngling, initiate and padawan (`ccAgeChanged`, 3298-3308).
- **Rank display.** The rank label appears in the sidebar subtitle (7351-7354) and in the AI state block as `RANK: x (lifeStage)` (4029).
- **Promotions.** The AI promotes the character with `RANK=` (prompt 1771-1775). Code then re-derives `lifeStage` (5239-5245), and the life stage decides which mandatory training rows the simulator forces (`SIM_MANDATORY`, 8711-8728).
- **Milestones.** Each turn, `checkMilestones()` (3883-3911, called from `buildEventInjection` 3963) compares age and domain averages against fixed thresholds. It creates story threads (`pendingEvents`) and NPC agenda items such as "Knight Trials eligibility" or "Agri-Corps risk", which the AI is pushed to play out. Milestones never change rank by themselves.

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Jedi ranks | youngling (3–7), initiate (7–12), padawan (13+), knight, master | legacy/index.html:2957-2963 |
| Sith ranks | acolyte, apprentice, sith_lord, dark_lord | 2964-2969 |
| Republic ranks | conscript, soldier, sergeant, lieutenant, captain | 2970-2976 |
| Mandalorian ranks | foundling, warrior, veteran, champion | 2977-2982 |
| Bounty hunter ranks | rookie, veteran, elite | 2983-2987 |
| Force-sensitive ranks | untrained, self_taught, wandering_adept | 2988-2992 |
| `RANK_LIFESTAGE_MAP` | youngling/initiate/acolyte/conscript/foundling/untrained → youngling; padawan/apprentice/soldier/warrior/rookie/self_taught → padawan; knight/sith_lord/sergeant/lieutenant/veteran/elite/wandering_adept → knight; master/dark_lord/captain/champion → master | 2997 |
| `RANK_VALID_VALUES` | flat set of every faction's rank values | 2999 |
| Valid `LIFE_STAGE` values | youngling, padawan, knight, knight_with_padawan, master, master_with_padawan, council_member | 5227, 4741 |
| Age → Jedi rank at creation | age <7 youngling, <13 initiate, otherwise padawan (only while the rank is one of those three) | 3305-3307 |
| Default rank by faction | jedi padawan, sith apprentice, republic soldier, mandalorian warrior, bounty_hunter veteran, force_sensitive self_taught | 3315 |
| Old-save rank migration | from lifeStage: knight_with_padawan→knight, master_with_padawan/council_member→master, otherwise padawan | 8272-8276 |
| Mandatory rows: youngling | Morning Forms Drills 1.5 h (Shii-Cho), Group Meditation 1.0 h (+5 alignment XP/h), Force Fundamentals 1.0 h | 8712-8716 |
| Mandatory rows: padawan | Lightsaber Practice (with Master) 1.0 h on the highest form (`simResolvePrimaryFormWeights`, 8660-8667), Meditation (with Master) 1.0 h (+3 alignment XP/h), Archive Study (with Master) 1.0 h | 8717-8721 |
| Mandatory rows: knight_with_padawan / master_with_padawan | Padawan Instruction 1.5 h | 8722-8727 |
| Mandatory rows: knight / master / council_member | none | 8711-8728 (no key) |
| Domain averages | force = avg(forceSense, meditation, forceKnowledge, forceControl) (forceOutput excluded); combat = avg(highest form, str, agi, end, wil); ability = avg of force abilities > 0 | 3733-3749 |
| Jedi milestones | noticed: age≤13 & force≥30; exceptional: age≤13 & force≥40; prodigy: age≤13 & force≥50; initiate trials window: 10≤age≤13 & force≥25 & combat≥20; early trials: 9≤age<10 & force≥40; padawan selection due: age≥12 & force≥30 & combat≥25; Agri-Corps risk: age≥13 & force<25; combat rising: age≤13 & combat≥40; Knight Trials eligible: age≥18 & force≥50 & combat≥50; wartime knighting: 16≤age<20 & combat≥55 | 3751-3842 |
| Sith milestones (no age checks) | acolyte noticed: force≥35 or combat≥35; Sith Lord interest: force≥45; Sith Trials: combat≥40; Sith Warrior proven: combat≥60 | 3844-3881 |
| Which milestone set | Sith set if faction contains "sith" or current alignment < −50; otherwise the Jedi set (for every other faction too) | 3888-3890 |
| De-duplication | skips any id already in `pendingEvents` (resolved events stay in the array, so a milestone fires once) | 3892, 5779-5785 |
| Priority escalation | overdue ≥1 day: medium→high; ≥3 days: →critical; mustFire when critical and overdue ≥2 days | 3913-3924 |
| NPCs attached | "Master Denko", "Grand Master Zym" (Jedi); none for Sith | 3758-3839 |

## State read / written
- `characterSheet.rank`, `characterSheet.lifeStage`, `characterSheet.age` (read), `characterSheet.faction`, `characterSheet.alignment` (read), `characterSheet.forceStats`, `characterSheet.stats`, `characterSheet.lightsaberForms`, `characterSheet.forceAbilities` (read for the domain averages).
- `worldState.pendingEvents[]` items have this shape: `{id,type:'milestone',triggerDate,priority,summary,context,npcsInvolved,createdDate,overdueBy,resolved,mustFire,isHardcoded}`.
- `worldState.npcAgendas[npc][]`.
- `worldState.lastMilestoneCheck` is initialised (1889, 3438) but never read or written afterwards.
- `rank` and `lifeStage` are snapshot-protected around the SHEET JSON overwrite, with a CHANGES pre-scan so that a same-turn tag wins (4729-4753, 4787-4788).

## AI provides vs. code computes
- **AI provides:**
  - `RANK=` / `RANK:` (any valid value, from any faction)
  - `LIFE_STAGE=` / `LIFE_STAGE:` (parser live but **not taught in the prompt**; Docs/updates.md:139)
  - `RESOLVE_EVENT=` to close a milestone thread
  - all trials and ceremonies as narration
- **Code computes:**
  - life stage from rank
  - mandatory sim rows
  - milestone triggering, priority escalation and injection
  - creation-time age/rank nudging
- **Code does not check:** any promotion requirement (age, trials, stats, master or Council approval, faction match).

## Known bugs and fragile spots
1. **No promotion validation.** Any value in the flat `RANK_VALID_VALUES` set is accepted (5241). A Jedi youngling can become `master` or `captain` in one tag, and demotions are equally unchecked.
2. **Rank overwrites the sub-stages.** RANK= replaces knight_with_padawan, master_with_padawan and council_member with the bare stage (5243, 4749), so a promotion silently removes the Padawan Instruction row.
3. **Padawan Instruction is effectively unreachable.** The `*_with_padawan` stages are reachable only through `LIFE_STAGE=`, which the AI is never told about (updates.md:139). The `masterAssigned` / `padawanAssigned` flags that legacy/CLAUDE.md §8 says gate these rows are not read anywhere in the code.
4. **Mandatory rows ignore faction.**
   - A Sith acolyte, Republic conscript, Mandalorian foundling or untrained Force-sensitive maps to `youngling` and gets Jedi "Morning Forms Drills" (Shii-Cho) plus "Group Meditation" granting +5 light alignment XP/h (2997, 8712-8716, 12022-12025).
   - Sith apprentices, soldiers and rookies get the "(with Master)" padawan rows.
5. **Milestones ignore rank and life stage.**
   - A padawan aged 13 with force ≥30 still gets "Youngling shows unusual potential" (3754).
   - "Agri-Corps risk" fires for any Jedi-set character aged ≥13 with force avg <25, including padawans and knights (3808).
6. **Non-Jedi factions get the Jedi milestones.** Republic, Mandalorian, bounty-hunter and unaffiliated characters are not Sith, so they receive Padawan selection and Agri-Corps threads (3889-3890).
7. **The milestone set can flip on a spike.** It switches on *current* alignment < −50 (3889), which a discharge or a fall can push past temporarily. Already-fired Jedi ids stay, and the Sith set then also fires.
8. **Domain averages read sheet copies, not `masterXP`.** They also omit `forceOutput` (3736) and use willpower in combat (3741). The thresholds were tuned to the old curve (v170-audit).
9. **Hard-coded, era-blind NPCs.** "Master Denko" does not appear in any `Docs/SWRPG lore/` file. "Grand Master Zym" is era-specific (SW_Characters_09…md:59, 275) but is attached in every era.
10. **Pre-scan and main loop can disagree.** If both `LIFE_STAGE=` and `RANK=` appear in one CHANGES block, the pre-scan prefers RANK (4744-4750), while the main loop applies them in line order (5225-5246). The final lifeStage depends on tag order.
11. **`lastMilestoneCheck` is dead state** (1889, 3438). `checkMilestones` runs every turn.
12. **The age nudge exists only at creation** (3298-3308). Nothing in play links age to rank; for example, a youngling who reaches 13 without selection is never handled except through the milestone thread.

## Conflicts between sources
- **Life-stage values:**
  - legacy/CLAUDE.md §5A lists seven LIFE_STAGE values, and the parser accepts them (5227).
  - `RANK_LIFESTAGE_MAP` produces only four.
  - Docs/SWRPG_XP_System_Reference.md:453 documents `LIFE_STAGE:` as the AI's tag, while the in-code prompt never mentions it.
- **Padawan mandatory training:**
  - XP Reference §15 (Docs/SWRPG_XP_System_Reference.md:471-479) says one 2.0 h "Training with Master" (ForceControl 0.6 / ForceSense 0.4).
  - Docs/SW_Sim_Rules_v1.md:245-253 says 2.0 h "Training with Master" (1-3 h) plus 1.0 h "Solo Practice", and Knight Padawan Instruction applies to plain "Knight".
  - Docs/SW_Activity_Bank_v1.md:297-303 says 2.0 h with the master's specialty and a +1.5 tactical bonus.
  - The code (V165) has three 1.0 h "(with Master)" rows (8717-8721) and no solo row.
- **Tier names vs. stat bands:**
  - Master Prompt v7.1 (Docs/SW_Legends_RPG_Master_Prompt_v7_1.md:445-452) uses Youngling 0–20, Padawan 20–40, Knight 40–80, Master 80–100, High Master 85+.
  - The lore files and the engine use Initiate 0–20, Padawan 21–40, Knight 41–60, Master 61–80, Grandmaster 81–100 (Docs/SWRPG lore/SW_Characters_09_GreatGalacticWar_ColdWar.md:27; legacy/CLAUDE.md §3D).
  - Master Prompt tier labels at v7_1.md:348-351 are different again ("Apprentice / Padawan", "Master / Sith Lord").
- **Rank ladders vs. lore:**
  - The lore records Jedi titles beyond master: Grand Master, High Council, Battlemaster, Barsen'thor (SW_Characters_09…md:193, 275, 301, 471, 497).
  - It records Sith ranks Dark Council and Emperor's Wrath (…09…md:112, 163, 526), and "rose from acolyte to Dark Lord" (…09…md:552).
  - `CC_RANKS` stops at master / dark_lord.
  - The Sith milestone "Sith Warrior" (3874-3878) is not a rank in `CC_RANKS`.
- **Canon ages and requirements.** The age brackets (youngling 3–7, initiate 7–12, padawan 13+), the Initiate Trials at 10–13, the Agri-Corps cutoff at 13 and the Knight Trials at 18+ come only from legacy code (2958-2960, 3780-3829). No file in `Docs/SWRPG lore/` states them. The lore only notes that Obi-Wan was knighted at about 25 (born 57 BBY, knighted 32 BBY; SW_Characters_11…md:219) and that the Sith of 3,661 BBY are an Empire with a Dark Council, not the Rule of Two (…09…md:59, 163).
- **Docs/updates.md:138** says rank is "AI increases rank, JS handles it after". The v2 audit (docs-v2/spec/v170-audit.md:98) and docs-v2/spec/ai-events.md:64-65 say code checks the requirements first.

## Replaced by
- **Rank promotion:** partly docs-v2/spec/ai-events.md (`promotionProposed { rank, grantedByRef, occasion } -> engine checks requirements first`). The requirements themselves have no spec yet: docs-v2/spec/npc-generation.md:59 says "ranks spec (to come)".
- **Mandatory training:** fixed Order commitments per rank in docs-v2/spec/training-routines.md §1 and §7 (Order calendar events such as trials are scheduled facts).
- **Milestones, rank ladders, life stage, trial requirements:** none. They need a v2 spec (a "ranks and milestones" spec).

## Open questions for Jared
1. What are the canon Jedi rank ages and requirements for the Old Republic era (3,661 BBY)? The lore files do not state an age-13 padawan cutoff, Initiate Trials ages or Knight Trials ages. Should the prequel-era rules (Agri-Corps at 13) apply in the Great Galactic War era?
2. Should rank ladders gain Grand Master, Council member and Battlemaster (Jedi), plus Dark Council and Emperor's Wrath (Sith), from the era-09 lore?
3. Should "Padawan assigned" be a separate state (relationship or flag) instead of the `knight_with_padawan` life stage?
4. Should non-Jedi factions have their own milestone sets and Order/duty commitments, or none?
5. Is "Master Denko" meant to be a campaign-specific invented NPC (not in the lore)? If so, where should he be recorded?
6. Which padawan mandatory schedule is canonical for v2: three 1 h "with Master" rows (V165) or 2 h with master plus 1 h solo (Sim Rules)?
