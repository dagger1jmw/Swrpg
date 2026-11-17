# Character creation (v1)

## 1. Choices
  Path: Jedi | Sith | Force-sensitive outsider | non-Force career
  Species (species.md; moved into M3 by D-103), birth date, and era (default 3,661 BBY, Great Galactic War year 20; start year is a creation choice)
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
  Every skill uses the NPC closed form (NPC spec section 1; phase paces per D-105) with the
  archetype's measured phase paces adjusted by the focus sliders (npc-generation §3),
  talents, species learning factors and war years, and the age-factor integral (D-43), read
  on the species' Human-equivalent age (species.md). Variance is off for player characters.
  Every level is reachable in play with the same routine (D-44). The natural baseline is
  added on top (progression-numbers sec 11a). Physical stats are capped by the body cap for
  age and species, plus the Force boost.
  Applied experience E and combat integration CI start from war years and rank (M5):
    Initiate/Padawan without war: sparring only (E up to 15, CI up to 20)
    each war year adds E +3 and CI +1 on the main combat abilities (scaled as usual)
    Knights and above: +1 E per year of missions (max +15)
  Alignment starts by path (M6): Jedi +20 | outsider 0 | Sith -30 | careers 0; dark pressure 5.
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
 1. A 24-year-old Average Jedi Knight (start 4) gets main form 46.6 +/-1 (D-105 phase
    closed form; 46.0 under D-43, 47 before) and meets Knight minimums (Force Sense 26,
    D-102).
 2. A 9-year-old Initiate (start 4) gets main form 20.1 +/-1 (D-105; 22.2 under D-43) and
    matches the Average profile at 5 years within +/-1 (day loop 19.8).
 3. A Luke-style outsider (start 19, Force prodigy) at 24 gets Force skills consistent
    with the progression spec's Luke profile at 5 years.
 4. Choosing an unreachable rank always triggers the validation options.
 5. Talent point costs and caps hold; no combination exceeds 4.0x pace.
 6. The same inputs always produce the same character.
