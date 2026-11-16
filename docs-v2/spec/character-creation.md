# Character creation (v1)

## 1. Choices
  Path: Jedi | Sith | Force-sensitive outsider | non-Force career
  Species (species spec), birth date, and era (default 3,661 BBY, Great Galactic War year 20; start year is a creation choice)
  Rank: any rank the path allows at that age (ranks spec); the UI shows which ranks fit
  Training start age: path default (Jedi 2-5, Sith academy 8-16, careers per archetype),
    adjustable within the path's range (a late start like Luke's is allowed for outsiders
    found later)
  Specialty and focus: an archetype (NPC spec section 3) plus optional sliders that shift
    the skill weights (the weights always sum to the archetype's total)
  Talents: 3 talent points: gifted costs 1, prodigy 2, exceptional 3, per domain; or roll
    with the NPC talent distribution
  Background flags: war years experienced, notable deeds, master or teacher (generated or
    chosen from canon NPCs where the lore allows), home world, family

## 2. Starting stats (computed, not allocated)
  Every skill uses the NPC closed form (NPC spec section 1):
    level = 41 * (effective years * pace / 16) ^ (1/1.75)
  with the chosen weights, talents and war years. Variance is off for player characters.
  Physical stats are capped by the body cap for age and species, plus the Force boost.
  Applied experience E and combat integration CI start from war years and rank:
    Initiate/Padawan without war: sparring only (E up to 15, CI up to 20)
    each war year adds E +3 and CI +1 on the main combat abilities (scaled as usual)
    Knights and above: +1 E per year of missions (max +15)
  Alignment starts by path: Jedi +20 | outsider 0 | Sith -30 | careers 0; dark pressure 5.

## 3. Validation
  If the chosen rank's skill minimums are not met, the UI offers: raise focus on the needed
    skills, pick a later age, pick a lower rank, or keep it as a story exception (logged, for
    example a battlefield promotion).
  Pace never exceeds 4.0x; talents and focus are capped like everything else.

## 4. Backstory
  The engine creates a short list of backstory facts (teacher, clan or academy, notable
  deeds, war service) as fact records (story memory spec). The AI turns them into an opening
  summary and the first scene; it cannot change any number.

## 5. Starting state
  Routine: the Order or career default for the rank.
  Relationships: master or teacher, clanmates or squadmates (generated NPCs).
  Equipment: rank and path defaults (equipment spec).
  Pacing: the first scene starts a settling-in period (pacing spec).

## 6. Required tests
 1. A 24-year-old Average Jedi Knight (start 4) gets main form 47 +/-1 and meets Knight
    minimums.
 2. A 9-year-old Initiate (start 4) gets main form about 21 (matches the Average profile at
    5 years, within +/-1).
 3. A Luke-style outsider (start 19, Force prodigy) at 24 gets Force skills consistent
    with the progression spec's Luke profile at 5 years.
 4. Choosing an unreachable rank always triggers the validation options.
 5. Talent point costs and caps hold; no combination exceeds 4.0x pace.
 6. The same inputs always produce the same character.
