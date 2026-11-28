# Starting traits and formative events (as built, M8 checklist item 16)

Design: [m8-design-notes.md](m8-design-notes.md), "Starting traits and formative events", with its trait catalog (44 traits) and the five event sets, all agreed by Jared on 25 Nov 2026. Extends [character-creation.md](character-creation.md) (talents, background flags, backstory facts, philosophy). Decision: D-515. Report: docs-v2/reports/m8-traits.md. **Every number not from Jared is `invented`; section 9 lists them all.**

Code:
- Data: `src/data/traits.ts` (the catalog with its hooks and gates, the dated massacres, tie names), `src/data/wars.ts` (the one war list with its factions, shared with the NPC generator; opt-2 A1, D-535), `src/data/formativeEvents.ts` (the event pool, the quiz's stages and limits), `src/data/canon/canonTraits.ts` (canon figures' traits from the lore).
- Rules (pure): `src/features/traits/rules.ts` (gates, the creation check, hooks, the quiz's plan and scoring, suggestions, NPC traits).
- Feature: `src/features/traits/` (slice, the `formativeQuizTaken`, `traitMoment` and `tieEnded` events, the youngling's skip hook, selectors).
- Wiring: the check (`turn/resolve.ts`: the intent's `situation`, the NPC target's kind, a mind trick on a Stubborn target), the duel (`engine/duel.ts` trait edges, `engine/sequence.ts` taunts), learning (`engine/speed.ts`, `features/progression/training.ts`), the starting purse and an old debt (`features/economy`), Order standing (`features/ranks/selectors.ts`), ties ending (`features/npcs` npcDied), bonds from the past (`relationshipSeeded`), the narrator's STATE block (`turn/context.ts`), creation (`turn/campaign.ts`), the screens (`ui/traitsUi.ts`, `ui/app.ts`).
- Tests: `tests/m8/traits.test.ts`.

## 1. What a trait is

A backstory fact with a small hook and a narrator note; every trait cuts both ways (the catalog's good and bad sides). Four kinds: 12 origins, 14 temperaments, 10 scars, 8 ties. Traits are separate from talents: no aptitude traits.

## 2. At creation

- **One origin, one temperament, one scar or tie;** an optional fourth only if it is flaw-heavy (`traitChoiceErrors`). The fourth may be a temperament, scar or tie, never a second origin. Contradicting temperaments are refused (hot-headed and patient, reckless and cautious, witty and reserved; a reading).
- **Flaw-heavy** (a reading of the catalog, for the fourth slot): Hot-headed, Stubborn, Reckless, Proud, Betrayed by a friend, Brush with the dark side, Outcast or exile, First kill young, Disgraced, Forbidden bond.
- **The screen:** a list filtered by the gates for each slot, an optional homeworld, the outside mentor's field when that tie is taken, "Suggest from my backstory" (leanings from the path, archetype, war years and massacres lived), and the quiz's suggestions. A trait closed by a number on the form (war years, the start age, the Temple arrival age; m8-fixes D1, D-525) is greyed with its short reason instead of hidden, and un-ticked when it closes; path, species and date gates still hide.
- **Requirements** (`requires` on a trait; m8-fixes D1): War veteran needs war years above 0 (Jared); First kill young a start age of 8 or more, a Ward 12 or more, the Forbidden bond 14 or more, an Old debt 16 or more (invented). A background option too: war years are served from age 14 (at most the years since 14, a year begun counting: 14.5 allows 1, exactly 14 none; invented, the veteran age; m8-audit A3, D-528).
- **The quiz returns to the form** (m8-fixes G2): accepting its suggestions fills the trait slots and shows what changed; only Begin starts the campaign, and Begin waits while the quiz runs. A slot still holding the accepted suggestion goes to the game as the quiz's swap (so a tie links to the quiz's person).
- **The Character tab** lists the traits (m8-fixes G3): each with its upside, its downside, how it came and the person it is tied to.
- **Ties** become NPCs at creation (`npcIntroduced` from the engine, a name drawn from the seed) with a bond seeded (`relationshipSeeded`: rival -25, creditor -5, the rest +30; invented). A canon partner stands in where the lore allows (canon figures' ties, section 8).
- **A programmatic or dev start without traits** has none and no quiz (the creation screen always sends them).

## 3. Weight

- **Rolls:** +-1-2 in the trait's situation; all traits together held to +-2 on one roll (`traitRollMod`). The situations are a fixed list (`TRAIT_SITUATIONS`). The intent call may name one for a check (`situation`, from `INTENT_SITUATIONS`); the code adds what it sees itself: a Stealth or Investigation check in a city (`cityStreet`), the reaction with an NPC target on a Charisma or Willpower check. A player's mind trick meets the target's own traits (a Stubborn mind +2).
- **Combat** (roll modifiers only, held to +-2): Hot-headed +1 pressing an attack in an aggressive stance; Reckless -1 defending; Patient -1 in the first exchange of a sudden fight; a taunt meets the target's traits (Proud -2, Hot-headed -2 against provocation).
- **Learning:** +-10-20% on linked skills, the product held to 0.8-1.2 (`traitLearning`), multiplied inside M before the 2.8 cap (`speedM`), so the 4.0x pace cap is untouched. XP from play takes the deeds factor (Ambitious +10%, Disgraced +5%) and the rival's spur (+10% for 30 days after the rival outdoes the character). The outside mentor gives +10% in the mentor's field. Starting levels from the closed form do not take trait factors (the factor applies from the start of play).
- **Reactions:** a shift with kinds of NPC (elite, commoner, criminal, law, jedi, imperial, republic, slaver, mandalorian, formal, suffering; read from role and faction), held to +-2, on social rolls with them; the narrator plays it.
- **Never the duel tiers or the 4.0x cap:** traits never change a level, so `duelTier` and every pace are as before (tested).
- **Start money:** a multiplier on the starting purse (Noble house x2; Temple-raised, underlevels, refugee x0.5; Old debt x3 with a Hutt loan for what it added, on the economy's debt rules).

## 4. Dated and gated

Traits are one dated catalog (D-438); the gates resolve from the character's dates (`traitRefusal`):
- **Path:** Temple-raised (Jedi), Academy-raised (Sith), Brush with the dark side (Force paths), the Forbidden bond (Jedi under the Order's rule against attachment, to 19 ABY), Old debt (not a Jedi).
- **Temple-raised needs arrival at the Temple (the training start age) before 10;** arriving at 10 or older takes an ordinary origin for the life before.
- **War veteran:** war years above 0 on the form (Jared, m8-fixes D1, D-525; was: recorded war years, or a war from the dated list lived from age 14). The dated wars still date the quiz's first-battle scenes, whose War veteran scar is given (the scene is the war experience). A first battle is war service (m8-audit A3, D-528): the scene implies war years of at least 1 (`implies` on the event), the form is raised to it when the quiz returns (named in its "what changed" line), a campaign with fewer is refused, and the scene is drawn only when the form could record a war year by the start.
- **Massacre survivor:** alive (age 4+) at the Sacking of Coruscant (3,653 BBY) and on Coruscant then (a Jedi already at the Temple, an underlevels origin or a Coruscant homeworld); a Jedi of the Order at Order 66 (19 BBY) or the Massacre at Ossus (130 ABY).
- **Imperial-born:** born in a Sith Empire's years and on its side (the Sith path or marked Imperial-born). The years are the Sith Empires of the one dated list of Sith powers (data/wars.ts `SITH_POWERS`, `sithEmpireSpans`; m9-tune3 item 5, D-578): the ancient Empire and Vitiate's to 3,600 BBY, Palpatine's (19 BBY-4 ABY) and Krayt's (130-138 ABY). Was 4,980-3,600 BBY only, a list of its own. **Slave-born:** open in every era (slavery stands in Hutt space throughout the lore).

## 5. Alignment (for M6)

The alignment system is not built yet (M6); traits store what it will read (`selectTraitAlignment`): multipliers on anger's dark pressure (Hot-headed x1.25), mercy (Compassionate x0.75), attachment (Compassionate x1.15, Family you still see x1.2, Forbidden bond x1.5), grief (Lost family x1.2), hatred of those responsible (Massacre survivor x1.25); start offsets (Brush with the dark side +3 dark pressure, First kill young +2 guilt); and the quiz's alignment and dark-pressure nudges. **Ambitious has no pressure hook:** dark pressure comes only from dark acts, which the alignment system scores as acts.

## 6. Change in play

Only through recorded events (`traitMoment` from the narrator, `tieEnded` from the engine); the narrator names a moment, the code counts and decides:
- **What the narrator is offered (D-529):** only the moments that can change something for this character now: the scars not yet held (a brush with the dark only on a Force path), a fear faced for a held unovercome fear, an ideal broken for Idealistic, a temperament tested for a held temperament, a rival outdoing them for Rival.
- **A fear faced:** a held scar with a fear (War veteran: bombardment; Former prisoner: confinement; Disaster survivor: the disaster) is overcome after 3 recorded faces: its bad side and pressures go, its good side stays.
- **A betrayal, a massacre, family lost, prison, a brush with the dark, a first kill, a public failure, a disaster, exile:** each adds its scar if not held.
- **A broken ideal** ends Idealistic. **A temperament tested** toward another 3 times gives way to it. **The rival outdoes you:** the spur.
- **A tie ends** when its person dies (npcDied emits `tieEnded` when the character holds a tie to them).
- Every change is in the slice's history. An old save loads with no traits and the quiz 'never'; neither is offered later.

## 7. Formative events (the growing-up quiz)

- **When, once:** a character starting older takes it at creation, covering childhood to the start age. A youngling start (a Jedi Initiate, a Sith acolyte, or anyone under 13) plays its first days; the quiz comes due at the first skip of a year or more (one skip, or skips resumed within 7 days of an interruption) and covers the skipped years (the window grows while the skip runs). Never again after that. NPCs don't take it.
- **Scenes:** two per stage the character has lived through (stages: Jedi 5-9, 9-13 Initiate, 13-16.5, 16.5-20 Padawan; Sith 8-13, 13-18; military childhood 6-14 then cadet 14-17 and service 17-20; civilian 6-10, 10-14, 14-18), held to 4-8. Since m8-fixes G1 (D-525) a stage counts once a quarter year of it is behind (`STAGE_LIVED_MIN`; was half the stage, which gave a 14-year-old Padawan no Padawan scene), and the scenes are shared out weighted toward the latest stage (`stageAllocation`: one a stage at least, then by the stage's place in the order); a short stage tops up from the latest stages first; a shorter window takes the stage it overlaps most. Dated events come first where they fit (the Sacking for a child at the Temple in 3,653; a first battle in a war's years). Civilian scenes come from the upbringing the origin names (street, noble, spacer) and "Anyone"; a Force moment only for a Force-sensitive child. The draw is seeded from the creation inputs (the same inputs, the same scenes).
- **The pool:** Initiate 9, Padawan 10, Sith 9, military 9, civilian 13 (street 4, noble 4, spacer 3, anyone 2): 50 distinct events (the design notes' 52 counts the two shared events twice).
- **An answer:** 3 or 4 fixed choices and an optional line of the player's own (narrator colour, kept as a fact). It gives a backstory fact; trait leanings (a choice's leans count 1, a person's tie 2, a scar 3); an alignment and dark-pressure nudge (+-2 an event, +-10 overall; the catalog's 3s are clamped to 2); a person (a named NPC with a bond or rivalry, no Charisma XP); a little standing (the Order, the academy, the unit or the community: +-2 an event, +-4 overall); flags (`knowsOfTechnique:choke`: knowing of it, never the power). Never a stat or a skill. A choice's roll ("caught on a roll") is drawn from the seed.
- **Scars:** a dated event's scar is given (the Sacking: Massacre survivor; a first battle: War veteran), recorded on top of the chosen traits; any other answer's scar is a strong leaning.
- **The people** (m8-fixes G4, G5, D-525): each fits the scene and the tie: a tie from outside or family is a civilian outside the Order; a ward is younger; an officer, sergeant, patron, Sith Lord or agent an elder with the matching role; everyone else (a clanmate, a rival, a friend) a peer, of the Order's role their age now gives (an Initiate clanmate of a 14-year-old is a Padawan). Their age is the age they are now (a peer the character's; a ward 4 under; an elder 20 over; someone outside 5 over; invented). The player's note on that scene is read for what code can read reliably (a relation such as "older sister", which sets the age; a homeworld stated with "from" or "on" a map world) and kept on the NPC in plain words for the narrator (`relation`, `homeworld`, `playerNote`; the memory lines carry them).
- **The end:** the suggested temperament and scar or tie (the most-leaned open ones) to accept or keep; the origin stays. Skipping declines the quiz (it is over).
- **Order standing:** a Jedi's Order steps add 2 standing points each (`QUIZ_ORDER_STANDING`) to the ranks' standing.

## 8. NPCs

- **Canon figures:** traits only from the lore, each with its line (`canonTraits.ts`; 26 figures, listed in the report for Jared's review). A figure not on the list has none.
- **Generated NPCs:** one temperament and, half the time, a second trait (a temperament or scar that does not contradict it), drawn from the campaign seed and the NPC's id; stable, not stored.
- **Effects apply to NPCs too:** combat edges, the mind-trick resistance, taunts; the narrator plays them (their lines go in the STATE block when present).

## 9. Every invented number

| Number | Where |
| --- | --- |
| Every roll, learning and reaction hook value (inside the catalog's bands) | `TRAITS` |
| The pressure multipliers and start offsets (x1.15-1.5, x0.75, +3, +2) | `TRAITS` |
| Start money: x2, x0.5, x3; the old debt as a Hutt loan | `TRAITS`, `initialEconomy` |
| The flaw-heavy list and the contradicting temperaments (readings) | `TRAITS`, `CONFLICTS` |
| Total roll cap +-2, learning 0.8-1.2, reaction +-2 (the band's edges) | `TRAIT_LIMITS` |
| Mentor +10%; the rival's spur +10% for 30 days | `MENTOR_LEARNING`, `RIVAL_SPUR` |
| Fears faced 3; temperament moments 3 | `FEAR_FACED_TO_OVERCOME`, `TEMPERAMENT_SHIFT_MOMENTS` |
| Memory age 4; veteran age 14 (one constant with the form's, opt-2 A1) | `rules.ts`, `WAR_SERVICE_FROM_AGE` (data/wars.ts) |
| The Sith Empires' years: from data/wars.ts SITH_POWERS since m9-tune3 (was 4,980-3,600 BBY here); the Forbidden bond to 19 ABY; the Galactic War's end at 3,637 (the lore's coverage) | `traits.ts` |
| Tie names; tie bonds -25 / -5 / +30; tie ages | `TIE_NAMES`, `traitCreationEvents` |
| Event age windows; roll chances 0.5 (0.25 for a disaster's loss); bond sizes 30 / 20 / 10 / -15 / -25 / -35 | `FORMATIVE_EVENTS`, `BOND` |
| The quiz's stage splits, a stage lived at a quarter year (m8-fixes G1; was the cover share 0.5), the youngling age 13, the skip of 368 days and the 7-day gap | `QUIZ_STAGES`, `STAGE_LIVED_MIN`, `YOUNGLING_START_AGE`, `QUIZ_SKIP_DAYS`, `QUIZ_SKIP_GAP_DAYS` |
| Scenes weighted toward the latest stage (m8-fixes G1) | `stageAllocation` |
| Requirements: First kill young 8, Ward 12, Forbidden bond 14, Old debt 16 (start age); war years from 14 (m8-fixes D1) | `requires` (data/traits.ts), `WAR_SERVICE_FROM_AGE` |
| Quiz people now: a peer the character's age, a ward 4 under, an elder 20 over, outside 5 over; older/younger relatives +-4, parents, aunts and uncles +25, grandparents +50 (m8-fixes G4, G5) | `quizPersonAge`, `readPersonNote` |
| Standing per event +-2, overall +-4; Order standing 2 points a step | `QUIZ_LIMITS`, `QUIZ_ORDER_STANDING` |
| Leaning weights 1 / 2 / 3 | `scoreQuiz` |
| A generated NPC's second trait 50% | `NPC_SECOND_TRAIT` |
| "Suggest from my backstory" leanings | `backstoryLeans` |

From Jared, not invented: the catalog (44 traits, sides and notes), the five event sets with their choices and effects, one origin / temperament / scar or tie and the flaw-heavy fourth, the +-1-2, +-10-20% and +-2 / +-10 bands, Temple-raised before 10, Ambitious neutral, 4-8 scenes, 3-4 choices and a note.

## 10. Not built here

Trait effects with no system to read them yet: the alignment pressures (M6 reads `selectTraitAlignment`), the factions' standing outside the Order (renown, spec 24), less training fatigue (Disciplined), nightmares' fatigue (War veteran), slower bonds (Reserved, Betrayed), the patron's one intervention, a cortosis shield for the player (items). These are in the narrator's notes until then.

## 11. Tests

`tests/m8/traits.test.ts`: the catalog's 44 and every hook in its band; the five sets; answers never give a stat or skill; creation needs one origin, one temperament, one scar or tie, and a fourth only if flaw-heavy; Temple-raised needs arrival before 10; the Sacking, Order 66 and war gates follow their dates; trait effects stay within +-2 on rolls and 0.8-1.2 on learning, M keeps its cap and no trait moves a level or the duel tier; Ambitious adds no pressure; Compassionate, family and the dark brush press as set; the quiz runs once, at creation for an older start and at the first long skip for a youngling, with 4-8 scenes fitting path, age and date; answers give facts, leanings, people (no Charisma XP), standing and nudges within +-2 an event and +-10 overall; flags never the power; a trait changes only through a recorded event (fears, scars, temperaments, a tie's death); generated and canon NPC traits; the narrator's STATE block; an old save loads without traits and is never offered the quiz.
