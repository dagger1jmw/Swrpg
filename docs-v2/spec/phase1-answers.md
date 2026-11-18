# Phase 1 open questions: answers (2026-11-16)

Answers to the 65 open questions in 00-index.md. Labels:
- DECIDED: settled by a spec in docs-v2/spec/ (named).
- JARED: Jared's direct answer.
- DEFAULT: recommended default, accepted unless Jared changes it later. Log it in
  docs-v2/decisions.md when you build it.
- LORE CHECK: answer from Legends sources (see the Legends-only rule below), cite the source,
  and flag it if the lore is silent.

## Legends-only rule (applies to every question and every lore check)
"Canon" in this project always means Star Wars Legends. Disney-era canon (2014 onward) is
never authoritative. The Old Republic (SWTOR) material, including the Great Galactic War
(year 20) of 3,661 BBY, is Legends. If a lore file in Docs/SWRPG lore/ contains a Disney-era idea,
record it as a conflict with Legends and follow Legends.

## Scope and setting
1. DEFAULT: 3,661 BBY (Great Galactic War, year 20) ships first. (Superseded by D-155: there is no default year; every era is treated equally.) The engine and calendar are era-agnostic and
   support BBY and ABY dates, so other eras can be added later.
2. JARED: the start date is a character-creation choice. The galaxy state follows the
   Legends timeline from that date (before or after the Hydian Way blockade breaks).
   LORE CHECK: re-verify the blockade dates against Legends (SWTOR) sources.
3. DEFAULT: launch with Human plus a handful of species common in the era (the species spec, planned for M8,
   to come, lists them). Species traits have small mechanical effects. Lifespan and body-cap
   tables live in the species spec data. Resist Aging slows the body-cap decline if the
   Legends lore supports it (LORE CHECK).
4. JARED: the multi-generation Legacy system (lineage, heirs, renown across characters) is
   NOT in the first build. Design state so it can be added later (character IDs,
   family/lineage links, renown kept per character, campaign-level records).
5. DECIDED (ranks.md): Sith ladder; non-Force careers get faction ranks by service, skill
   and deeds; outsiders have no ladder. Duties come from routines (training-routines.md).
6. JARED: iPad first. Build responsive from the start so phone and desktop can be added
   easily: layout driven by screen width, panels as a side drawer or overlay on iPad, tabs
   on narrow screens, side-by-side on wide screens. Always visible: current date, pacing
   level, Vitality and wound status, tiredness meters, and active combat or montage status.
7. DEFAULT: yes. The prompt is generic and uses the character's name and details from state.
   Never hard-code "Jared".

## Character creation
8. DECIDED (character-creation.md): rank picker validated against age and training;
   starting stats from the progression model, not a point pool.
9. DECIDED: keep the training start age (it drives the stat computation). The player picks
   a birth date.
10. DECIDED: 3 talent points (gifted 1, prodigy 2, exceptional 3). The quiz and Force
    potential tier are dropped (talents replace them). Homeworld is kept as a background flag.
11. DEFAULT: starting alignment comes from the path (character-creation.md) plus a small
    philosophy offset: livingForce +5, unifyingForce +3, jediOrthodox +3, jediSentinel 0,
    gray 0, warrior 0, sithPassion -5, sithInquisitor -5.
    (Copied into character-creation.md §2 and alignment.md §1 by D-63.)

## Ranks and milestones
12. DECIDED (ranks.md): rank ages and trial requirements follow general Legends Jedi Order
    practice (Padawan selection by about 13, Council of Reassignment, the five Knight Trials).
    LORE CHECK: note anything specific to the Old Republic Order on Tython in 3,661 BBY that
    differs.
    Amended by D-02: in 3,661 BBY the Order is at the Jedi Temple on Coruscant under Grand
    Master Zym, not on Tython (Tython only for starts from 3,653 BBY); the age and trial
    rules are a design choice based on prequel-era practice.
13. DEFAULT: yes to Grand Master and High Council member (ranks.md). Battlemaster and Emperor's
    Wrath are titles/roles granted by story events, if the Legends lore supports them for the
    era (LORE CHECK). Dark Council is in ranks.md.
14. DEFAULT: yes. "Has a Padawan" is its own state (a list of apprentices), not a life stage.
15. DEFAULT: the Sim Rules version: 2 h with the master plus 1 h solo, as the Padawan Order
    requirement in training-routines.md.
    Amended by D-42: the Order requirements table is in ranks.md §1a (training-routines.md
    points to it), and the Padawan line adds 1 h Force Control and 1 h Force Sense with the
    master.
16. JARED: drop Master Denko and Elara. v2 starts fresh; NPC generation makes new characters.

## Talents, proficiencies, Shatterpoint
17. DEFAULT: legacy talents map to domain talent levels (gifted/prodigy/exceptional) where
    they speed learning; special talents (ShatterSense, etc.) become unlock flags. Battle
    Meditation's x3.33 XP was not intended; drop it.
18. DEFAULT: strain talents become small health-spec bonuses (for example +0.5 Force meter
    capacity). Talents with no code are kept only if the Legends lore defines an effect;
    otherwise drop them and list them in decisions.md.
19. DECIDED (progression-numbers.md sec 14): sub-abilities are main-curve skills linked by
    synergy. No percentages.
20. DECIDED: learning Shatterpoint without the ShatterSense talent is gone. ShatterSense
    characters start with a Shatterpoint level computed at creation like any skill.
21. DEFAULT: keep it simple. A Shatterpoint read is a contest (rolls.md sec 6); a negative
    margin is a misread (wrong guidance, narrated). Reading costs Force load 0.3 per use.
    Drop focus and tunnel-vision states.
    (Copied into force-catalog.md and health.md §2 by D-63, with the non-combat read rule.)
22. DEFAULT: tier unlocks follow the Legends lore (LORE CHECK; the lore is the source of
    truth). Vaapad amplifies only while fighting in Vaapad.
23. DECIDED: tier names from progression-numbers.md sec 1. Domain averages are display only,
    and include Force Output and Force Control.

## Force abilities and forms
24. DEFAULT: Shien and Djem So are separate skills linked as variants (synergy 0.25), as in
    progression-numbers.md sec 14. Include the other forms the Legends lore file lists
    (Tràkata, Sokan, etc.). Kii-Shikk: LORE CHECK; keep it only if a Legends source exists.
25. LORE CHECK: follow the Legends lore for Force Plague (own ability or a stage of Force
    Affliction). Drop it if it has no Legends source.
26. DEFAULT: the lore's prerequisites (the lore is the source of truth).
27. DEFAULT: yes. Shadowstrike, Midi-chlorian Manipulation and Transfer Essence are
    "forbidden" availability: learning them needs access to a Sith text or teacher (story
    gate). Non-numeric lore prerequisites stay story-checked by code via flags.
28. LORE CHECK: verify the Battlemind and Force Body aliases against the lore. Split
    ForceHeal into Self and Others if the lore distinguishes them.
29. DEFAULT: Force Barrier is a learned ability that uses the Force meter (health.md). No
    separate barrier meter.
30. DEFAULT: innate talent effects come from the lore. The 16 non-catalog ability names in
    the legacy lore database are added to the catalog if a Legends source exists; otherwise
    they are dropped and listed in force-catalog-questions.md.

## Combat and rolls
31. DECIDED (rolls.md, health.md, ai-events.md): the engine ends fights through wounds and
    incapacitation; the player can surrender or flee; the AI may propose combatEnded
    (truce or interruption), which code validates. The opponent's fate comes from the engine;
    at incapacitation the player chooses spare, capture or kill.
32. DEFAULT: form changes are allowed at a player beat and cost 1 advantage step.
    (Copied into rolls.md §3 by D-63.)
33. DECIDED: no. Replaced by the 0.75 / 0.25 split (progression-numbers.md sec 5).
34. DECIDED: no. Every opponent enters through npcIntroduced and gets its numbers from
    npc-generation.md. There is no fallback.
35. DECIDED: yes. Stable IDs with aliases (story memory design, ai-events.md).
36. DECIDED: graze / solid / clean / critical (rolls.md).
37. DECIDED: dropped. Replaced by player beats with a stance or tactic choice (rolls.md sec 3).
38. LORE CHECK: Satele Shan's lightsaber in 3,661 BBY, from Legends (SWTOR) sources.

## Injury and health
39. DEFAULT: keep the dominant hand and the off-hand penalty. Losing the dominant hand
    switches to the off hand automatically until a prosthetic is fitted; then adaptation
    applies (progression-numbers.md sec 18).
40. DEFAULT: keep a small passive version: Willpower removes Willpower / 400 of wound
    penalties (max 25%), on top of pain-suppression abilities. (Copied into health.md §8 by
    D-63.)
41. DEFAULT: keep it. When Battlemind or Force Valor ends while wounded, the suppressed
    penalties return and the character takes +0.5 mental load. (Copied into health.md §8 by
    D-63.)
42. DECIDED: neither. health.md replaces both tables.

## Alignment and momentum
43. DEFAULT: drop "Will of the Force" as its own system. Its role is covered by Force
    insight (rolls.md sec 6) and moralChoice light.
44. DECIDED (alignment.md): philosophy sets passive drift. Meditation in routines counts as
    practice for light drift. Per-activity alignment costs are limited to dark-tagged
    abilities and anger channeling.
45. DEFAULT: no mechanical discharge. At dark pressure 90+, code flags a "breaking point"
    for the AI to build a story scene around; nothing resets automatically. (Copied into
    alignment.md §3 and flag-registry.md by D-63.)
46. DECIDED: momentum is removed. Anger channeling is the dark-side shortcut. The centered
    state is the light-side counterpart; no extra breakthrough high.

## Calendar, world, story
47. DECIDED: the 12-month / 368-day Legends calendar (Essential Atlas version), 7-day weeks,
    numbered months and weekdays unless the lore gives Legends names. Dates shown as
    BBY/ABY.
    Amended by D-38: month lengths (1-8 have 31 days, 9-12 have 30), year 0 (0 BBY/ABY),
    continuous weeks with day 0 as weekday 1; the calendar table is in architecture §10.
48. DECIDED: the AI proposes timeElapsed and code clamps it; montages and skips are run by
    the clock. DEFAULT: a skip ends at morning unless the story sets a time.
    (Copied into architecture §9 by D-63. Amended by D-30: timeElapsed is in seconds and is
    left out of the schema when the engine already advanced time.)
49. DEFAULT: the galaxy simulation is code-driven: scheduled Legends timeline events from the
    lore plus weighted random events. Upcoming events are shown to the AI only when relevant
    to the scene (code decides), never as a full future list.
50. DECIDED: flags come from a registered list, are set by engine events, and can gate
    story content.
51. DEFAULT: keep NPC agendas and story threads. When a thread's deadline passes, code
    generates an escalation (a consequence scene or a worse outcome) as a threadProgressed
    event.
    Amended by D-60: the escalation is the engine event threadEscalated (owner: threads), not
    threadProgressed, so code never writes an AI-text field (architecture §2-3).
52. DECIDED (ai-events.md): KNOWN_PERSON -> npcIntroduced / factLearned; INTERACTION ->
    relationshipChanged; PENDING_EVENT -> threadOpened with a deadline; NPC_AGENDA -> NPC
    facts and threads; RESOLVE_* -> threadResolved; SCENE_NPCS -> scene.presentNpcRefs;
    GALAXY_EVENT -> code galaxy events only (the AI narrates). The story memory feature owns
    the People tab and threads.
    Amended by D-60: threads are owned by the threads feature; the People tab reads the npcs
    and relationships features; memory owns facts, chapters, arc, pins and the review queue
    (architecture §2). ai-events.md is superseded by architecture §3 (D-31).
53. DEFAULT: relationships are numeric (-100..+100) with display labels. An NPC appears in
    People once introduced. Dead NPCs stay listed, marked deceased.
54. DEFAULT: renown is code-owned and numeric per faction. LORE CHECK the faction list for
    3,661 BBY (Republic, Empire, Jedi, Sith, plus Mandalorians or others if the lore
    supports them).
55. DECIDED (npc-generation.md sec 5): canon NPCs are hand-set inputs computed through the
    closed form, with documented overrides. The legacy stat sheets are reference only.

## Memory, saves, AI plumbing
56. DECIDED (story memory section of the prompt pack; now architecture §7, D-59): code-owned facts and chapter
    summaries, 10-15 raw turns per request, montages and skips stored as chapters, and the
    full transcript kept outside the AI's view.
57. DECIDED: retry once with a larger output budget; never stitch or repair. If it still
    fails, show an error with a retry button.
58. DEFAULT: keep out-of-character commands such as [LORE CHECK] as read-only questions to
    the AI. They never change state; corrections go through the debug console.
59. DECIDED: stay on Gemini (check the current recommended Flash model), key in browser
    storage, sent in the x-goog-api-key header. No proxy for now.
60. DECIDED: IndexedDB with 5 slots plus autosave, and file export/import. DEFAULT: saving
    mid-combat and mid-montage is allowed (all state is serializable).

## Items and UI
61. DEFAULT: lightsaber properties have small effects, defined in the equipment spec (planned for M8; D-59).
    Legends: Jedi attune a crystal during construction through meditation; Sith use
    synthetic crystals. "Bleeding" crystals are a Disney-era idea: record the lore file's
    mention as a conflict with Legends and do not use it. The lightsaber is story-owned
    equipment.
62. DEFAULT: a light credits economy; armor and blasters have stats (health.md uses them);
    saberstaff and Jar'Kai are gated by skill and training. Details in the equipment spec.
63. DECIDED: custom drills become saved routine templates, stored with the campaign
    (training-routines.md). The free-text box is the player's normal input; the intent call
    interprets it.
64. DECIDED: the debug console is development-only, behind a toggle. Manual corrections
    happen only there and are always logged.
65. DEFAULT: keep choice buttons (lettered is fine).
