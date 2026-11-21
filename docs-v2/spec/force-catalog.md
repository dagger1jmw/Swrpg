# Force ability and lightsaber form catalog (v1)

Source: Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md (authoritative), plus
legacy FORCE_ABILITY_CATALOG / FORCE_ABILITY_ALIASES / FORCE_ABILITY_RULES for coverage.
Every value must cite its lore section, or be listed in docs/spec/force-catalog-questions.md.

## Force ability fields
  id, name, aliases[]
  family (TK, Sensory, Body, Mental, Defense, Healing, Light, Dark, SpaceTime, Nature,
    Arcane, SithAlchemy, Misc)
  parentAbility? (e.g. Force Push -> Telekinesis), subAbilities[]
  use tag: combat | nonCombat | both          (progression spec sec 6, 8)
  side: light | neutral | dark                (dark-tagged abilities interact with anger
                                               channeling and dark pressure)
  prerequisites: minimum stat levels, required talents, required parent level
  Force load: amount + unit (per use | per minute) (health spec sec 2)
  effort scaling notes (what light vs all-out does in the story)
  contest: what it rolls against (Willpower, a Force defense ability, a DC rating)
    Amended by D-192: the contest is the ability's resolution group (forceResistance.config.ts):
    mind (Willpower contest; Force users add Force resistance; droids and lore-immune species
    immune), avoidable (difficulty, then a dodge only if the target can react; cover; saber
    deflection; Force users counter), grip (difficulty; Force users resist), object (difficulty
    only), unopposed. Current groups: mind = Mind Trick; avoidable = Force Push, Force Lightning,
    Telekinesis (throwing an object), Saber Throw; grip = Force Choke; object = Telekinesis on an
    object or a body; unopposed = Force Barrier, Force Speed, Force Jump, Force Absorb, Battle
    Meditation, Force Heal (Self), Force Heal (Others), Revitalize.
  output: what code computes (damage formula, push distance class, heal rate, sense range)
  drills: [{ activityId, difficulty rating, physical/mental/Force load per hour }]
  synergy: [{ targetId, relation type }]      (progression spec sec 14)
  availability: common | rare | lost | forbidden, and the era notes for 3,661 BBY
  combat integration applies: yes/no

## Lightsaber form fields
  id, name, form number, aliases[]
  relations: variant of / derived from / foundation for   (synergy)
  activity weights: the physical stats each form's drills train (0.25 secondary share)
  matchups: vs blasters | one-on-one saber | several opponents | confined space |
    vs Force-heavy opponents  -> each -1, 0 or +1 (rolls spec sec 5)
  drills: [{ activityId, difficulty rating 10-90, loads }]
  state-of-mind notes (e.g. Juyo/Vaapad and anger channeling)
  availability and era notes

## Lightsaber form keys (M6 passes, D-278; lore form table)
  Added form keys: TKSaber (Telekinetic Lightsaber Combat), Lightwhip (Lightwhip Combat),
    SaberPike (Lightsaber Pike Combat), StrongStyle, MediumStyle and FastStyle. The last three
    are era-locked: available only after Luke Skywalker founds the New Jedi Order.
  Zero-G is no longer a form (Legends has none): zero or low gravity is an environment
    modifier, and training in it reduces the penalty. The legacy key ZeroGravity, and the
    current v2 form id zeroG, become that environment training. A save holding ZeroGravity
    (or zeroG) as a form keeps its value as the environment training level; nothing is lost.
    Not built yet: the code still has zeroG as a form (skills.ts, activities.ts zeroGBasics,
    formMatchups.ts, terrain.ts zeroGravity); the change and the save migration are M6 work.

## Shatterpoint reads (D-63; Q20, Q21, D-06)
  Shatterpoint is ShatterSense-only (Q20), on the main curve with an XP cost x3.
  Combat reads: rolls.md §6 (contest d20 + level/10 vs 15, advantage jumps to 3, once per
    fight).
  Non-combat reads (a person, a relationship, a situation, an event): a check (rolls.md §2)
    against a DC set by the D-06 perception band of what is being read:
      | Band (D-06) | Minimum Shatterpoint level | DC = 10 + band start / 10 |
      |---|---|---|
      | physical weaknesses | 1 | 10 |
      | combat | 21 | 12 |
      | personal | 41 | 14 |
      | relational | 61 | 16 |
      | situational | 81 | 18 |
      | event | 101 | 20 |
    A read is possible only when the character's Shatterpoint level is at least the band's
    start. Success reveals the shatterpoint (narrated from the engine's result). A negative
    margin is a misread: the engine records wrong guidance and the AI narrates it as if
    true (Q21). Cost (D-63 amended 2026-11-20, from the lore file's Shatterpoint entry; M6):
    each read is an Advanced instant use, base 40 pool points divided by efficiency,
    multiplied by the read depth (physical weaknesses or combat x1, a person x1.5, a
    relationship x2.25, a situation x3.4, an event x5), plus a fixed focus strain per read
    that does not depend on skill (+0.05 for combat, rising to +0.25 for an event; the lore
    gives no values for the bands between). This replaces the flat 0.3 Force load per read.
    Focus and tunnel-vision states
    are dropped (Q21, D-05). Reads enter only through the intent (intent.forceAbility =
    shatterpoint, D-29).

## Required checks
  Every ability and form has every field, or an entry in force-catalog-questions.md.
  Every synergy relation and matchup cites lore.
  Legacy aliases all resolve to a v2 id, except the removed aliases "ForceFortitude",
    "Force Fortitude", "Fortitude" and "ForceBodyControl" (decisions.md, 2026-11-16), which
    are rejected as unknown names.
  Renamed lore entries (lore update 2026-11-20, D-276): each old key and old display name is
    an alias of the new entry, so it resolves there.
      | Old key / old name                                | New entry               |
      |---|---|
      | ForceCamouflage / Force Camouflage                | Force Cloak             |
      | ForceStrength / Force Strength                    | Enhance Attribute       |
      | ForceEnhancedReflexes / Force-Enhanced Reflexes   | Force Speed (forceSpeed)|
      | PrecognitiveReflexes / Precognitive Reflexes      | Precognition            |
      | AingTiiFightingSight / Aing-Tii Fighting-Sight    | Fighting-sight          |
      | ForceListening / Force Listening                  | Theran Force-listening  |
      | ForceRage / Force Rage                            | Force Enrage            |
      | TransferEssence / Transfer Essence                | Essence Transfer        |
      | Endure                                            | Crucitorn               |
      | TelekineticBarrage                                | Ballistakinesis         |
      | ForceEndurance                                    | Remove Fatigue          |
      | EnvironmentalForceSense                           | Force Sense (forceSense)|
      | ForceInsight                                      | Force Sense (forceSense)|
      | BattleForesight                                   | Battle Precognition     |
      | ForceSubjugate                                    | Mind Control            |
      | DominateMind / Dominate Mind / MindDomination     | Mind Control            |
      | Battle-meld / BattleMeld                          | Force Meld              |
      | Postcognition                                     | Psychometry             |
      | ForceMemory / Force Memory                        | Psychometry             |
      | ForceEcho / Force Echo                            | Psychometry             |
      | DrainKnowledge                                    | Mind Probe              |
      | ForceProjection                                   | Dopplegänger            |
      | AccelerateHealing / HealingMeditation / CuratoSalva | Force Heal (Self) (forceHealSelf) |
      | ControlDisease / ControlAnothersDisease           | Cure Disease            |
      | ControlAnothersPain                               | Control Pain            |
      | RemoveAnothersFatigue                             | Remove Fatigue          |
      | PlaceInHibernationTrance                          | Hibernation Trance      |
      | ForceWhisper                                      | Telepathy               |
      | ForceExhaustion                                   | Force Slow              |
      | ForceStasisField                                  | Stasis Field            |
      | ForceTeleportation                                | Fold Space              |
    Aliases are exact (normalizeAlias, D-13); only the names in this table and in the lore
    entries are added, never a near spelling.
  Dropped legacy names (D-276), rejected as unknown names with no alias: ResistAging (now a
    passive effect of the age system, not an ability), ForceComprehension, AuraOfSerenity,
    KyberResonance, FieryEnergy, Shadowstrike (a Ta-Ree spell, not a Force power; M6 passes,
    D-278).
  Unique abilities (D-277 amended): an ability that cannot be learned and belongs to one
    entity is written in the character files with a "Unique: " prefix (for example
    "Unique: Multipresence 175", "Unique: Beast-form 125"). The alias and catalog check
    accepts any name with this prefix and does not treat it as a catalog ability: it is not
    looked up, aliased or offered for learning. A name without the prefix that is not in the
    catalog or the alias table is still rejected.
  Unknown ability names are always rejected; they never fall back to a nearby ability.
  Non-combat Shatterpoint reads use the D-06 band table above: level below the band start
    cannot attempt; a negative margin is a misread (D-63).
