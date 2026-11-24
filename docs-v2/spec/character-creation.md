# Character creation (v1)

## 1. Choices
  Path: Jedi | Sith | Force-sensitive outsider | non-Force career
  Species (species.md; moved into M3 by D-103), birth date, and era (no default year, D-155: the player picks an era, which fills its first year, or types any date)
  Rank: any rank the path allows at that age (ranks spec); the UI shows which ranks fit
  Dev test start (D-178; ?dev=1 only, not part of creation): rank (Initiate, Padawan, Knight,
    Master) and age for an Average Human Jedi Guardian; marked testCharacter in the save.
  Training start age: path default (Jedi 2-5, Sith academy 8-16, careers per archetype),
    adjustable within the path's range (a late start like Luke's is allowed for outsiders
    found later)
  Specialty and focus: an archetype (NPC spec section 3) plus optional sliders that shift
    the skill shares (the shares always sum to 1; amended by D-44). All lightsaber forms share
    one focus slider (the forms pool, D-118).
  Form plans (D-118): Initiates train Shii-Cho only. From Padawan, a form plan splits the 2 h
    master session and the 1 h solo hour among any forms (default Soresu 2 h, Ataru 1 h);
    optionally a separate Knight+ plan. Each form a plan starts begins at 0.75 x the highest form
    (the fundamentals transfer, progression-numbers sec 7a). The main and second form are the
    plan's two largest entries.
  Talents: 3 talent points: gifted costs 1, prodigy 2, exceptional 3, per domain; or roll
    with the NPC talent distribution. A confirmed "Ignore talent point limit" toggle (D-116)
    allows any number (each domain still at most exceptional; the 2.8 M cap and 4.0x pace limit
    still apply) and flags the campaign unbalanced on the character sheet.
  Background flags: war years experienced, notable deeds, master or teacher (generated or
    chosen from canon NPCs where the lore allows), home world, family

## 2. Starting stats (computed, not allocated)
  Every skill uses the NPC closed form (NPC spec section 1; phase paces per D-105) with the
  archetype's measured phase paces adjusted by the focus sliders (npc-generation §3),
  talents, species learning factors and war years, and the age-factor integral (D-43), read
  on the species' training age (real years from adulthood; D-474, species.md sec 1). Variance is off for player characters.
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
 1. Amended by D-118 / D-119: a 24-year-old Average Jedi Knight (start 4, default plan) gets
    highest form 46.4 +/-1 (Soresu; Shii-Cho 30.1, Ataru 33.4) and meets the Knight minimums
    (highest form 39, Force Control 34, Force Sense 31, Willpower 53; D-120).
    Before: a 24-year-old Average Jedi Knight (start 4) gets main form 46.6 +/-1 (D-105 phase
    closed form; 46.0 under D-43, 47 before) and meets Knight minimums (main form 39, D-111; Force Sense 26,
    D-102).
 2. Amended by D-118 / D-119: a 9-year-old Initiate (start 4) trains Shii-Cho only: 23.4 +/-1,
    the day loop at 5 years (23.4). A 16-year-old Padawan has Shii-Cho 30.1, Soresu 34.2 and
    Ataru 28.0; a 3-form plan splits the hours as set; dropping Shii-Cho never removes its XP.
    Before: a 9-year-old Initiate (start 4) gets main form 20.1 +/-1 (D-105; 22.2 under D-43) and
    matches the Average profile at 5 years within +/-1 (day loop 19.8).
 3. A Luke-style outsider (start 19, Force prodigy) at 24 gets Force skills consistent
    with the progression spec's Luke profile at 5 years.
 4. Choosing an unreachable rank always triggers the validation options.
 5. Talent point costs and caps hold; no combination exceeds 4.0x pace.
 6. The same inputs always produce the same character.
