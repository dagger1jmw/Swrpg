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

## Required checks
  Every ability and form has every field, or an entry in force-catalog-questions.md.
  Every synergy relation and matchup cites lore.
  Legacy aliases all resolve to a v2 id.
