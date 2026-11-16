# SWRPG V170 Audit: Clashes With the v2 Design

Nov 16, 2026 · @Jared Wright

## Verdict

Of 16 V170 systems checked against the v2 design, 11 must be replaced and 5 reworked, though several hold data worth carrying over. The root problem behind most clashes is the same: the AI writes game state, and code tries to protect, correct or re-parse it afterward. Audited V170 (commit 8bef4a1, June 24); line numbers refer to `index.html`.

| System | Verdict | Main clash with v2 |
| --- | --- | --- |
| Character sheet ownership | Replace | The AI rewrites the whole sheet as JSON every turn; code restores protected fields afterward |
| Health (HP) | Replace | Fixed 0–100 pool the AI sets directly; doesn't scale with Endurance or level |
| Strain (Force, Physical, Mental) | Replace | 27 write sites in 7 code paths; duplicates the new fatigue meters |
| Combat strain | Replace | Separate per-exchange formula with its own Endurance mitigation |
| Rolls | Rework | d20 plus tier-gap bonuses creates cliffs at tier boundaries; randomness can't be seeded |
| Time and date | Replace | Parsed from free text ("Time Elapsed:"); 7 separate places write the date |
| Calendar | Rework | Invented month names and a 7-day week; Legends sources differ (needs your decision) |
| XP curve and training XP | Replace | Covered in the Progression spec |
| Training simulator | Replace | Covered in Training routines |
| Shatterpoint XP | Replace | Its own 500 × 1.07^L curve, outside the new progression |
| Proficiencies and talents | Rework | Separate cost system and flat XP multipliers that bypass the speed cap |
| Momentum windows | Replace | AI-triggered XP multiplier outside the cap |
| NPC generation | Rework | Stats from tier pools, not from age and the progression model |
| Milestones, rank and life stage | Rework | Fixed stat thresholds tuned to the old curve; rank set by an AI tag |
| Story memory and saves | Replace | Covered in Story memory |
| Engine/UI separation | Replace | Rule functions write directly to the page; all state is global |

Keep as data (sources for v2): Force ability catalog and aliases, NPC archetypes, injury body-part taxonomy, lore database content. Details in "What to keep" below.

## AI owns the character sheet

This is the clash behind most V170 bugs. Every turn the AI returns the full character sheet as JSON, and code overwrites `characterSheet` with it. Code then restores the fields the AI isn't supposed to touch from a snapshot taken just before (from line 4720: talents, birthday, injuries, dominant hand, rank, life stage, alignment, lightsaber properties and more). Any field missing from that list can be silently changed by the AI.

Three more paths also let AI text change state:

- **CHANGES tags.** About 30 tag types (`HP=`, `FORCE_STRAIN=`, `RANK=`, `COMBAT_START:`...) parsed line by line.
- **Regex on the story text.** 35 regex scans of AI prose, including strain values ("Physical Strain: 2 → 0"), "fully restored", Force Barrier phrases, XP lines like "Djem So: +3 XP", the date, and "Time Elapsed".
- **Markdown fallback** (around line 6040). If the JSON fails, code reads `**forceStats:**` and similar from the text and replaces `forceStats`, `stats` and `forceAbilities` wholesale.

Each path has guards (an "activity happened this turn" check, an "in combat" check, a READ ONLY label in the prompt) added after bugs, which is why fixes kept creating new bugs.

**In v2:** the AI returns events only, checked by a schema. State has one owner per field (code), and nothing parses story text. This is already in Phases 2 and 5. *(Amended by D-28: the prompt pack's Phases 3-8 are replaced by milestones M1-M9 in architecture.md §15; the AI contract is architecture.md §3.)*

## Health, Force and strain

You're right that this needs a full rework. The V170 numbers were never reliable because many unrelated code paths could change them.

**What V170 does:**

- **HP** is a flat 0–100 pool for everyone, a youngling and a Grand Master alike. The AI sets it to an absolute value through the `HP=` tag, the SHEET JSON or the markdown fallback (lines 5499, 6084). There's no healing model in code. Penalties come in steps (HP 51–75: −1 on the d20, 26–50: −2, 11–25: −3, 1–10: −5; line 10583).
- **Strain** is three pools, Force, Physical and Mental, each 0–100. There are **27 write sites in 7 code paths**: CHANGES tags, story-text regex, the markdown fallback, end of combat, the manual sync tool, the simulator and Control Pain.
- **Endurance mitigation is implemented four different ways:** ×(1 − em), ×(1 − em × 0.5), ×(1 − em × 0.3), and a separate per-exchange table in combat, where em = compressedBonus(Endurance) / 6. The same exertion gives different strain depending on which path records it.
- **Recovery** happens only through the simulator's sleep step or AI text such as "fully restored". Strain doesn't recover with time in normal play.
- **Combat strain** is kept in a separate tally that's only added to the sheet when combat ends, while the bars show a computed preview (line 6617). A turn can show one number and save another.
- **Overlap with v2:** the new fatigue model already has physical and mental meters, so keeping strain would mean two tiredness systems.

**Proposed v2 replacement** (a direction to agree on; exact numbers come next, as with progression):

1. **Fatigue meters: physical, mental and a new Force meter.** They replace all three strain pools. Force meter capacity comes from Force Control and Willpower. Every Force ability has a Force load per use, scaled by how much power you put in. Past 1.0 you get backlash: mental fatigue, nosebleeds and collapse, and an opening for the dark side. Sleep and rest recover the meters; only the overtraining streak carries over between days.
2. **Vitality** is short-term resilience against glancing blows, exhaustion and minor hits. It scales with Endurance, Strength and Force body abilities, so a Master really is tougher than a youngling, and it recovers within hours. Running out doesn't kill you. It means the next hit becomes a real wound.
3. **Wounds** come from the existing injury taxonomy (body part, severity, healing time) plus the lasting-injury adaptation in the Progression spec. Wound penalties are smooth percentages, not d20 steps. Incapacitation and death come from wounds (for example a critical torso or head wound), not from HP reaching 0.
4. **One owner.** Combat resolution, Force use, activities and healing produce events, and only the health module changes these values. The AI describes what happened and never sets a number.
5. **Healing in time.** Wounds heal day by day through the clock (`onTimeAdvanced`). Bacta, Force healing and medical care change the healing rate, and Control Pain and pain channeling carry over as ways to suppress penalties temporarily at a Force cost.

## Rolls, time and calendar

**Rolls (rework).** A V170 roll is d20 + stat bonuses + experience bonus + tier-gap bonus + tactical (±5) − penalties (from line 10835).

- **Tier boundaries are cliffs.** Stat bonuses are heavily compressed (level 41 gives +2.0, level 60 gives +2.5), but the tier-gap bonus is +4 / +9 / +15 / +22 / +30 / +39 for a 1–6 tier gap. A level 60 fighter facing level 61 takes a −4 swing, while 19 levels inside the same tier are worth only 0.5. Against the new decades-long curve, where each level is earned, this makes most progress invisible in fights and a single level up enormous.
- **Randomness can't be seeded.** `Math.random()` is called directly in 6 places, so rolls and NPC generation can't be tested or replayed.
- **In v2:** a continuous contest based on the level difference, with no tier cliffs. One example shape is an Elo-style curve, P(win) = 1 / (1 + 10^(−Δ/40)): +10 levels gives 64%, +20 gives 76%, +40 gives 91%. Injuries, fatigue, rust and combat integration feed in as effective-level changes. All rolls use the seeded RNG. The numbers get worked out alongside health.

**Time and date (replace).** The AI writes "Time Elapsed: 2 hours 15 min" in the story and code pulls the numbers out with regex (around line 6190). A second regex looks for dates in lines like "It is now...". There are 7 separate date writers (lines 4928, 6219, 6254, 7862, 8045, 8054, 12053), including the simulator and manual date setters. This is why time tracking drifted. **In v2:** the clock module owns time, as in the Pacing section.

**Calendar (rework, needs your decision).** V170 uses 12 invented months (Coruscann, Frostuary, Warming...) of 30–31 days totaling 368, and a 7-day week built from the five Legends day names (Primeday, Centaxday, Taungsday, Zhellday, Benduday) plus two invented ones (Restday, Endday). Legends itself has two versions:

- **Original:** 5-day weeks, 7 weeks per month, 10 months plus 3 fete weeks and 3 holidays = 368 days ([Wookieepedia mirror](https://starwars.archivum.wiki/article/Calendar)).
- **Later reform:** a 12-month / 368-day calendar, used by The Essential Atlas and The New Essential Chronology, with months of 30 or 31 days ([Wookieepedia: Standard year](https://starwars.fandom.com/wiki/Standard_year/Legends); [archive](https://starwars.archivum.wiki/article/calendar)).

Either is defensible; the invented month names and the extra two weekdays aren't canon.

## XP side systems, NPCs, milestones and ranks

**Two sources of truth for every stat.** Levels live in both `masterXP` (total XP per stat, treated as authoritative) and `characterSheet` (raw level numbers the AI can write). `syncMasterXPToSheet()` and a set of repair functions (`repairCharacterProfiles`, `repairTalentConsistency`, `repairForceAbilities`) keep fixing the gap, and `forceStats` is written directly in 11 places. **In v2:** one value per stat, total XP, with levels always derived from it.

| System | What V170 does | v2 replacement |
| --- | --- | --- |
| Shatterpoint | Its own XP track, 500 × 1.07^L (5× the old curve), about 107 references | A rare Force ability on the main curve, unlocked by the ShatterSense talent; add a cost multiplier if it should stay harder to learn |
| Proficiencies | Separate cost-per-point system with "trickle" from the parent ability (about 46 references) | Sub-ability synergy in the Progression spec (parent to sub-ability 0.10, sub-ability to parent 0.15) |
| Talents | Flat XP multipliers (×1.2–1.3) applied after everything else, bypassing caps | Domain talent levels (gifted, prodigy, exceptional) inside the 2.8 cap |
| Momentum windows | AI tag `MOMENTUM_WINDOW` sets an XP multiplier for story turns only | State of mind (centered ×1.05) and rolled breakthroughs |
| Story-turn training XP | Tier multiplier up to 3.5× and AI-chosen outcome up to 3× | The single XP function |

**NPC generation (rework).** `npcGenerateStats()` (line 3072) hands out a stat budget per tier, with prodigies getting one tier higher, regardless of the NPC's age or years of training. The AI tag `RECURRING_RETURN` re-rolls a returning NPC one or more tiers higher. Under v2 this breaks consistency: a 40-year-old Knight could be stronger or weaker than the player's own curve allows. **In v2:** NPCs are generated from the same progression model (species, age, starting age, talent, specialty, wartime experience), which computes their levels in closed form. Canon NPCs get hand-set values, checked against the curve, with any exception documented. Growth between appearances comes from elapsed time, not a tag.

**Milestones (rework).** `JEDI_MILESTONES` and `SITH_MILESTONES` use fixed thresholds tuned to the old fast curve, for example "youngling noticed" at age 13 or younger with Force 30 or more. Under v2 an average 13-year-old is around level 20, so most thresholds would fire late or never. **In v2:** thresholds are defined against the profile tables, for example "noticed" means progressing at 1.5× Average pace or faster for their age.

**Rank and life stage (rework).** The AI's `RANK=` tag sets rank, and life stage follows through `RANK_LIFESTAGE_MAP`. **In v2:** rank is story-granted. The AI may propose a promotion event, and code checks the requirements (trials completed, skill minimums, master's approval or a Council decision) before applying it.

**Engine and UI are tangled (replace).** Rule functions update the page directly. For example, `updateCombatStrain()` sets bar widths, and the time parser updates on-screen labels. All state is global (`characterSheet`, `worldState`, `masterXP`, `activeCombat`...), so any function can change anything. **In v2:** the feature module contract and the rule that UI only reads state.

## What to keep from V170

The rebuild discards V170's code, but not its design work. These carry over, as data or as ideas re-implemented under v2 rules:

- **Force ability catalog and aliases** (`FORCE_ABILITY_CATALOG`, `FORCE_ABILITY_ALIASES`, `FORCE_ABILITY_RULES`). Becomes typed data, with each ability tagged combat, non-combat or both, plus its Force load.
- **Lore database content** (`LORE_DATABASE`, about 1,500 lines). Checked against `Docs/SWRPG lore/` and merged there; the lore files stay the source of truth.
- **NPC archetypes and pools.** Archetypes become inputs (specialty, typical talent) to the progression-based NPC generator.
- **Injury design** (`Docs/SW_Injury_System_v1.md`). Body-part taxonomy, severity classes, dominant hand and Jar'Kai, off-hand penalties, opponent injury tracking, Control Pain, dark-side pain channeling, and Battlemind and Force Valor suppression all carry over as concepts. Their numbers are redone for the new health model.
- **Alignment design.** Philosophy-based passive drift, equilibrium, dark pressure and harder redemption are good ideas. Re-tune them and connect them to state of mind (anger channeling adds dark pressure).
- **Combat XP shape.** base × duration × engagement × outcome is reasonable. Fold it into the single XP function, scaled to the new curve.
- **Pre-rolling before narration** (the V162–V170 fix). Already the core of the v2 turn pipeline.
- **Character creation options** (eras, factions, ranks per life stage, talent list). Kept as data.
- **Activity list and Order training per life stage** from the simulator. Feeds the routine catalog and Order requirements.
- **Milestone concepts.** Keep the events and their story hooks, and recalibrate the triggers.

## Decisions needed

- [x] **Health model:** decided. Fatigue meters (with a Force meter) + Vitality + Wounds; only wounds can incapacitate or kill. Spec is in the prompt pack's Health section. *(Now docs-v2/spec/health.md; amended by D-59.)*
- [x] **Roll model:** decided. A visible d20 + level ÷ 4 *(amended by D-22: d20 + effective level / 10, rolls.md)* with no tier cliffs, margin-based hit quality and maneuvers, and strong earned circumstances (surprise, openings, position, state of mind). Spec is in the prompt pack's Rolls section. *(Now docs-v2/spec/rolls.md; amended by D-59.)*
- [x] **Calendar:** decided. The 12-month / 368-day Legends calendar (Essential Atlas version), with no invented month or weekday names. *(Amended by D-38: numbered months, 1-8 have 31 days and 9-12 have 30, year 0, continuous 7-day weeks; architecture.md §10.)*
- [x] **Shatterpoint:** decided. A rare ability on the main curve (ShatterSense talent only, XP cost ×3).
- [x] **V170 saves:** decided. Not imported; v2 starts a new campaign.

This audit should be read alongside the Phase 1 feature audit in the prompt pack (not in the repo; the Phase 1 audit is docs-v2/spec/01-24 and bugs.md, amended by D-59). Claude Code's audit will confirm these findings in more detail and add line-level bug lists.
