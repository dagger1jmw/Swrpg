# Character creation (v1)

## 1. Choices
  Path: Jedi | Sith | Force-sensitive outsider | non-Force career
  Species (species spec, planned for M8; Human only until then, D-56), birth date, and era (default 3,661 BBY, Great Galactic War year 20; start year is a creation choice)
  Rank: any rank the path allows at that age (ranks spec); the UI shows which ranks fit
  Training start age: path default (Jedi 2-5, Sith academy 8-16, careers per archetype),
    adjustable within the path's range (a late start like Luke's is allowed for outsiders
    found later)
  Specialty and focus: an archetype (NPC spec section 3) plus optional sliders that shift
    the skill shares (the shares always sum to 1; amended by D-44)
  Talents: 3 talent points: gifted costs 1, prodigy 2, exceptional 3, per domain; or roll
    with the NPC talent distribution
  Background flags: war years experienced, notable deeds, master or teacher (generated or
    chosen from canon NPCs where the lore allows), home world, family

## 2. Starting stats (computed, not allocated)
  Every skill uses the NPC closed form (NPC spec section 1):
    level = 41 * (effective years * pace / 16) ^ (1/1.75)
  with the chosen shares (pace = share / 0.5, phase paces before Knight; npc-generation §3),
  talents and war years, and the age-factor integral (npc-generation §1, D-43). Variance is
  off for player characters. Every level is reachable in play with the same routine (D-44).
  Physical stats are capped by the body cap for age and species, plus the Force boost.
  Applied experience E and combat integration CI start from war years and rank:
    Initiate/Padawan without war: sparring only (E up to 15, CI up to 20)
    each war year adds E +3 and CI +1 on the main combat abilities (scaled as usual)
    Knights and above: +1 E per year of missions (max +15)
  Alignment starts by path: Jedi +20 | outsider 0 | Sith -30 | careers 0; dark pressure 5.
  Philosophy offset (Q11, copied by D-63): livingForce +5, unifyingForce +3, jediOrthodox
    +3, jediSentinel 0, gray 0, warrior 0, sithPassion -5, sithInquisitor -5.

## 3. Validation
  If the chosen rank's skill minimums are not met, the UI offers: raise focus on the needed
    skills, pick a later age, pick a lower rank, or keep it as a story exception (logged, for
    example a battlefield promotion).
  Pace never exceeds 4.0x; talents and focus are capped like everything else.

## 4. Backstory
  The engine creates a short list of backstory facts (teacher, clan or academy, notable
  deeds, war service) as fact records (architecture §7, story memory; amended by D-59). The AI turns them into an opening
  summary and the first scene; it cannot change any number.

## 5. Starting state
  Routine: the Order or career default for the rank.
  Relationships: master or teacher, clanmates or squadmates (generated NPCs).
  Equipment: rank and path defaults (equipment spec, planned for M8; D-27, D-59).
  Pacing: the first scene starts a settling-in period (architecture §8; amended by D-59).
  Routine: the rank's Order requirements (ranks.md §1a) plus the archetype's default
    template (training-routines §1).

## 6. Required tests
 1. A 24-year-old Average Jedi Knight (start 4) gets main form 46.0 +/-1 (amended by D-43,
    age-factor closed form; was 47) and meets Knight minimums. Open (D-67): Force Sense
    (minimum 30) is not yet met by the Average profile at 20-21.
 2. A 9-year-old Initiate (start 4) gets main form 22.2 +/-1 (closed form, D-43; was about
    21) and matches the Average profile at 5 years within +/-1. Open (D-67): the current
    day loop gives 20.1 at 5 years, 2.1 below the closed form; re-check after D-67 is
    decided.
 3. A Luke-style outsider (start 19, Force prodigy) at 24 gets Force skills consistent
    with the progression spec's Luke profile at 5 years.
 4. Choosing an unreachable rank always triggers the validation options.
 5. Talent point costs and caps hold; no combination exceeds 4.0x pace.
 6. The same inputs always produce the same character.
