# m8-calibration-fix3: answers, holds, and duel narration (2026-11-25)

Decision D-496. Holds: [spec/holds.md](../spec/holds.md).

| Item | Result |
|---|---|
| 1. Force Sense gap 5 | Done; the Sith are held closer so a Lord at 25 meets 40 |
| 2. Canon Masters | Kept; the old characters' line is in section 2 (nothing changed) |
| 3, 4, 6. Seers list, Charisma curve, Yoda | Kept as they are |
| 5. Malgus returned | Force Control 88 |
| 7. Bane | Apex duelist (1,002-980 BBY), in the code and the 3,640-1,000 map |
| 8. Throat-crush | Out of the notes |
| 9. Holds | Built, with the escape |
| 10. Duel narration | In the narrator's notes, with a Pace line |
| 11. Careers' paces | Queued in docs-v2/lore/RESEARCH_QUEUE.md |

## 1. Force Sense

**A gap of 5 is not enough for the Lord's 40.** A Sith's Force Control at 25 is 42 on the default routine, so a gap of 5 gives about 37. I kept 5 for everyone and held the Sith to 2 (invented), because their routine has no sensing practice of its own.

| Archetype (day loop; Force Control / Force Sense) | Knight, 25 | Master, 40 |
|---|---|---|
| Guardian | 46.4 / 44.3 | 55.7 / 53.1 |
| Consular | 44.3 / 43.6 | 45.9 / 50.3 |
| Sentinel | 45.6 / 44.1 | 52.7 / 52.8 |
| Sith Warrior | 42.1 / 40.5 | 46.2 / 45.3 |
| Sith Inquisitor | 42.1 / 40.5 | 48.5 / 47.4 |

**Paces moved** (measured before and after, against the routine's own hours)

| Archetype | Force Sense pace (Initiate, Padawan, Knight) | Main at 25 |
|---|---|---|
| Sith Warrior | 0.088 → 0.400, 0.209 → 1.173, 0.155 → 0.231 | 55.51 → 55.51 |
| Sith Inquisitor | 0.088 → 0.398, 0.207 → 1.168, 0.150 → 0.360; everything else by 0.005 or less | 53.94 → 53.88 |
| Guardian, Sentinel, Consular | Initiate only: 0.466 → 0.471, 0.464 → 0.472, 0.470 → 0.477 | unchanged |
| Careers | nothing | unchanged |

No gate moved. A Lord of 25 is still short of the Lord's **Force Control** 44 (42). Same before.

## 2. The generated line for old characters (investigated, not changed)

The average Guardian Master (no talent), by age:

| | 35 | 45 | 55 | 65 | 72 | 80 | 90 |
|---|---|---|---|---|---|---|---|
| Best form | 61 | 72 | 81 | 89 | 94 | 100 | 107 |
| Willpower | 74 | 84 | 94 | 103 | 109 | 114 | 120 |
| Force Control | 53 | 58 | 63 | 68 | 71 | 74 | 79 |

Against the 31 sheeted Jedi and Sith (the ancient, fixed figures left out; Oteg, of Yoda's species, is far off the line and not counted below):

- **Form specialists (Guardians, Sentinels, Warriors):** the sheets are above the line until about 55 (Malgus 92 against 68, Satele 88 against 80) and below it from about 60 (Orgus Din 78 against 93 at 72, Bela Kiwiiks 78 against 89 at 70).
- **Willpower:** the line passes the sheets by about 50 and is usually 10 to 25 above them after 60 (Vindican 80 against 102, Orgus Din 86 against 108; Zym, at 120, 88 against 125).
- **Force Control:** the other way. The line is 14 to 56 *below* every sheet at every age (Orgus Din 84 against 70, Malgus 88 against 39).
- **Consulars and Inquisitors:** the line's best form stays near 50 for life; their sheets say 70 to 84.

**Why:** the line is an unbroken life of full training days. It never slows but for the age factor; the Average was tuned to reach 80 at 57 and 100 at 82 (progression targets). Nobody in it retires, sits on a council, or is ever busy. Willpower has three sources that never stop (training, tiredness, natural growth).

**So yes, forms and Willpower run high after about 60**, by 10 to 15 and 15 to 25 at 72. It is a matter of hours, not of the curve. If you want it changed, I would give NPCs (not the player) a share of training hours that falls with age or office from about 50, and measure it against the sheets. It would not touch the player or the floor.

## 3. Holds

**How it works.** A hold is the exchanges the holder lasts in the duel. Each is worth a set time by how close the two are: 3 s between equals, 0.85 s for a regular Master against Malgus, 0.3 s for one against Sidious. The duel is unchanged.

**What it gives** (400 NPC holds each; the median and the share that buy a corridor's 20 s and a hangar's 45 s)

| Holder | Malgus | Marr | Satele | Revan | Sidious |
|---|---|---|---|---|---|
| Knight, 30 | 9 s, 10% / 1% | 11 s, 24% / 2% | 11 s, 25% / 2% | 7 s, 4% / 0% | 5 s, 0% / 0% |
| **Master, 45** | **21 s, 54% / 19%** | **26 s, 58% / 25%** | **25 s, 59% / 29%** | **20 s, 51% / 18%** | **8 s, 15% / 0%** |
| High Master, 60 | 54 s, 83% / 57% | 59 s, 81% / 60% | 62 s, 81% / 61% | 48 s, 77% / 53% | 23 s, 57% / 22% |
| Near their level | 213 s, 96% / 88% | no limit, 97% / 90% | no limit, 97% / 90% | 311 s, 96% / 88% | 49 s, 76% / 53% |

- **Regular Masters:** 51 to 59%, so about half. One in ten is past in 4 or 5 s.
- **"No limit"** is a duelist who withdrew, was beaten or was still held at 200 exchanges. Only someone near their level gets there.
- **The player's own hold** uses the same worth, so it is as rare.

**Built as you described:** the recorded place, steps that cost time, doors, the hidden NPC duel, the escape told with it, the death felt, the chase on foot, concealment, and the trail. Every listed test is in tests/m8/holds.test.ts.

**Readings of mine**
- A duelist pressed by someone they are above breaks away and is past them. The hold is still only the time it took.
- Behind a closed door the player is away *for now*: the pursuer comes through when the door's time is up, if the player is still aboard or in the building.
- A pursuer who outruns and outlasts the runner follows any route, unless the runner is hidden in the Force.
- Anything the player does instead of a plan is no escape, attacking the foe included: the hold is told first and the fight starts next turn.
- Concealment has no skill yet (M6): the mean of Stealth and Force Control, for a Force user with Stealth 20.
- The narrator says who steps in (holdBegun); the engine checks that both are here.

**Limits**
- **Vehicles are not recorded things.** One can be reached in a street or a hangar only, never on open ground.
- **Blast doors are assumed** aboard any ship or station. Nothing records them.
- **This hold time is not the clock's.** An exchange still takes 5 to 10 s of game time, so a 20-exchange stand is about 150 s on the clock and 17 s of hold.
- **Force Speed:** a figure with no Force Speed or Force Body on record runs like anyone. That holds for Sidious and Vitiate by their sheets.

## 4. Duel narration

One exchange is several blows unless a sequence is described. A Pace line in the block says how fast, by the weaker blade; Force use and heavy strikes read slower; extra blows touch nobody. No engine change.

## For you

1. **Sith held to a gap of 2:** right, or keep 5 for them and lower the Lord's Force Sense 40?
2. **The old characters' line:** change it as in section 2, or leave it?
3. **Holds:** is about half right for a corridor and about a fifth for a hangar?
4. **The clock:** should an exchange between strong duelists take less game time too (now 5 to 10 s)? It would change what fights cost in time.
5. **A High Master of 60 holds Sidious for a corridor 57% of the time.** Too high against an apex?
6. **Force Speed of Sidious, Vitiate and others without it on the sheet:** should a strong Force user have some?
7. **The pursuer and the trail:** 7 days, about 8% a day against Malgus. Right?

## Numbers I invented

| Number | Where |
|---|---|
| Sith Force Sense gap 2; the free 3 | progression.config.ts |
| An exchange's worth: gap 2: 3 s (your 3), 12: 1.7, 24: 0.85, 45: 0.3, 70: 0.15 | data/holds.ts |
| A hold must buy: building 20, hangar 45, street and open 20 (corridor 20 is yours) | data/holds.ts |
| Steps: 8, 5, 4, 12, 30, 18, 12 s | data/holds.ts |
| Doors: 45 and 12 s; without a lightsaber x2.5; ripped: 0.75, 0.45, 0.25, 0.15; a wrecked console +0.5 | data/holds.ts |
| Pace 6 m/s, +4% a Force Speed point; stamina 20 s, +0.5, +0.4; hidden: pace x0.8, stamina x0.7 | data/holds.ts |
| Sight: 60, 60, 150, 150, 400 m, x4 straight; senses 6 m a point; concealment weight 2; chase limit 900 s | data/holds.ts |
| Losing them: +3 evasive, -4 straight, +2 cover, +7 hidden, +1 per 400 m (most 3) | data/holds.ts |
| The trail: 7 days, 3% + 0.06% a point, x0.4 hidden | data/holds.ts |
| A hold is played to 200 exchanges; a planner's gap +12; concealment's Stealth 20 and the mean | data/holds.ts, features/combat/holds.ts |
| Duel pace: 95, 80, 60, 40 and the counts under the apex's ten | data/duelPace.ts |
| Escape turn: 10 s at least, 600 s at most of the hold | features/combat/holds.ts |

## Tests

| Run | Result | Time |
|---|---|---|
| npm test | 1,654 of 1,654 | 22 s |
| test:lifetime | 56 of 56 | 1,106 s |
| typecheck, lint | clean | |
