# m9-tune: the missions' training gap, the Consular, the slow-call cap (2026-11-27)

Jared's brief of 27 Nov ~1:10 p.m. (his review of reports/m9-release.md and the life-gap breakdown). He revised A5's target at ~3 p.m.: war should make a Jedi stronger. A war career should end above the missions-off curve and a peace career about on it, with combat as the lever. If combat can't reach that without becoming an XP farm, propose a war-year pace and wait.

Decisions D-560 to D-565. Specs: missions.md (sections 4, 4a, 12), architecture.md section 7. The breakdown before any change is the addendum to reports/m9-release.md (commits e24a9d1, e829b23, 6a7919d).

**Every number not from lore or Jared is invented.** Section F lists them all.

## Summary

- **The training gap is roughly halved, but not closed.**
  - In peace, missions now pay a little above the routine: at 25 the Guardian is +0.6 levels, the Sith Warrior +0.8, the soldier +1.1.
  - The rest of the gap is the war. These test lives are Knights through the whole ten-year Light and Darkness War (1,010-1,000 BBY), posted to a front with a mission every 2-5 days.
- **Jared's revised target is not met.** A war career should end about 3 levels above the curve by 35, which is what the NPC generator's own war years give (section B). The Jedi lives end 3.5-7.4 levels below it at 35.
  - Combat alone can't close that. Fights against era minions teach a veteran almost nothing. The obvious combat levers were measured and either barely moved it or made it worse (section B).
  - **A war-year pace is proposed in section D, waiting for approval** (rule 7).
- **Root causes found and fixed in the harness:**
  - posted lives were sent home every night;
  - mission wounds went untreated, and Dying characters were never stabilized;
  - the Sith and the soldier lives got no missions.
- **The Consular's main specialty is Force Knowledge, not a form.** That answers A1.
- **The slow-call cap is built and tested (C).**

## A. The training gap

### A1. Form XP by form, and the Consular puzzle

The archetypes' main specialties: Guardian and Sentinel their highest form, Consular **Force Knowledge**, Sith Warrior its highest form, Inquisitor **Force Output**, soldier Blaster.

So the Consular's −194 total form XP and −8.9 levels in its main are two different skills. Its forms barely move because mission fights add Soresu XP while study is lost.

Nothing routes fight XP away from the main form. The duty player fights with the character's main form (`buildPlayerFighter` takes `mainFormId`, Soresu in these profiles), and there is no stance or form choice in the harness's fights.

**Form level and XP at 41** (means of 20 seeds; off = missions off, before = missions on at e829b23, after = this milestone):

| Life | Soresu (main form) off / before / after | XP off / before / after | Ataru off / before / after |
| --- | --- | --- | --- |
| Guardian | 67.6 / 59.9 / 63.5 | 18,571 / 15,031 / 16,621 | 40.6 / 36.3 / 37.7 |
| Consular | 49.9 / 50.4 / 53.4 | 10,921 / 11,101 / 12,273 | 30.5 / 29.5 / 29.8 |
| Sentinel | 65.9 / 59.9 / 63.3 | 17,756 / 14,998 / 16,538 | 40.3 / 36.4 / 37.5 |
| Sith Warrior | 63.9 / 63.9 / 64.5 | 16,824 / 16,824 / 17,067 | 39.0 / 39.0 / 39.0 |
| Sith Inquisitor | 48.7 / 48.7 / 49.1 | 10,430 / 10,431 / 10,593 | 29.3 / 29.3 / 28.8 |

Shii-Cho and the other forms move by under 1%.

### A6. The harness, fixed first

All in the missions-on harness (tests/support/lifetime.ts). npm test and test:all run duty off and are unchanged.

1. **Posted lives went home every night.** The harness moved the life to its seat at each day's end, also while posted. So each posted morning began with the trip back to the front (in the breakdown, every posted day was a day away from the base). It doesn't move the life while duty holds it now.
2. **The Sith got no missions.** Duty records a non-Jedi home once, where it first sees the character (Korriban). At 13 the harness moves the Sith life to Dromund Kaas, so it was never at home again, and the daily roll runs only at home. Duty's home now follows the harness's seat move.
3. **The soldier got no missions.** The career profile had no place and no side. It is now a Republic Army trooper (the faction as the trooper start sets it; the service ladders are officer ladders, entered at Tactics 10) in a barracks on Coruscant (invented).
4. **Mission wounds went untreated.** The duty player never asked for care after a mission's wound and never stabilized a dying character. A Jedi with missions carried a moderate+ wound for 1,667-2,490 days of the life (about 20 without), and one died.
   - Mission fights now get the harness's own rules for its fights: D-143 B (a field medic stabilizes) and D-162 (30 days of medical care for a new moderate+ wound; a bacta tank in a profile's war years).
   - Wounded days are now 1,023-1,692 for the Jedi. Still high: about 1 mission in 6 ends cut short by a wound, because the duty player resolves every fight to its end and never withdraws.
5. **A crash lost lives.** The death threw and took 12 more lives of its shard with it. A life that ends early is now recorded and left out of the means.
6. **A real bug found on the way (game code).** Two loans from one lender reaching the bounty on the same day set `debtBounty` twice, a rejected duplicate. The economy hook now sets it once.

**Found, not changed (for Jared):**
- The Sith lives are never "at war": the game reads a Sith character's side as `sithEmpire` (the path's default), and in 1,032-995 BBY the wars are fought by `sith` (the Brotherhood). So they get peace missions only.
- A trooper start is never posted in a total war: `postingEligible` needs a service record, which the trooper start doesn't have.

### A2. Practice on mission days

- **Built:** a day of a mission's stage work ends with a short session on the routine's plan (`FIELD_PRACTICE` 1.5 h).
  - The 1.5 h is shared over the day's plan's biggest blocks in half-hour steps. The first version scaled every block and got 4-4.5 h, because each session rounds up to 0.5 h.
  - Each session runs through `resolveTraining`, as the routine does.
  - None on a day with a fight or a battle, none while a moderate+ wound is under three-quarters healed, one a day; a long stage attempt has one each evening.
  - The turn's log shows it: "mission: field practice after the day's work (1.5 h): Force history and lore 1 h, Basic centering 0.5 h".
- **Already so, not changed:**
  - A trip past 12 h is a montage, and a montage runs the routine day by day. Those travel days already have the whole routine, not a short session (about 11,000 h a Jedi life).
  - Quiet days on a posting run the routine at the forward base (it is home).
  - **Ask:** should travel days drop to a short session, as Jared's wording suggests? That would lower progression further.

### A3. Field fights teach

- A real fight begun on a mission is a field fight (not a spar, not a dev command's fight, not a fight at home): **x1.5** on each exchange's XP.
- The multiplier comes before the daily cap (12 XP before M) and the later-fight factor, so it cannot be farmed.
- Combat XP already scales with the opponent's strength: the challenge curve on the level gap, which falls to 0 at 35 levels below.

### A4. XP from stage rolls

- **Before:** only a Stealth roll gave XP. "Talk your way through" needed a named target, which a stage never has, so it gave nothing. No other skill learned from a stage.
- **Now:** every stage roll teaches the skill it used.
  - Stealth by its field-use rule.
  - Charisma by the persuasion rule (the stage's rating as the resistance).
  - Every other skill by a new `fieldCheck` source (`FIELD_CHECK`, stealth's numbers).
  - A social approach (talk, influence, read them) also logs a social line (Charisma).

### A5. The life-gap comparison (20 seeds; all six lives)

Main specialty, means (range at 41 in brackets):

| Life (main) | Missions off: 25 / 30 / 35 / 41 | Before (e829b23): 25 / 30 / 41 | **After**: 25 / 30 / 35 / 41 | Gap at 41: before -> after |
| --- | --- | --- | --- | --- |
| Guardian (highest form) | 49.2 / 55.5 / 61.3 / 67.6 | 48.9 / 52.8 / 59.9 | 49.8 / 54.5 / 57.8 / **63.5** (62.2-64.4) | -7.7 -> **-4.2** |
| Consular (Force Knowledge) | 18.0 / 35.6 / 48.6 / 61.6 | 17.7 / 31.6 / 52.7 | 17.7 / 31.5 / 41.2 / **54.1** (52.6-55.1) | -8.9 -> **-7.6** |
| Sentinel (highest form) | 48.5 / 54.4 / 59.7 / 65.9 | 47.8 / 52.0 / 59.9 | 48.7 / 54.0 / 57.7 / **63.3** (61.9-64.5) | -6.1 -> **-2.6** |
| Sith Warrior (highest form) | 46.1 / 52.1 / 57.6 / 63.9 | no missions | 46.9 / 52.8 / 58.2 / **64.5** | **+0.5** |
| Sith Inquisitor (Force Output) | 36.4 / 48.0 / 57.4 / 67.6 | no missions | 35.2 / 46.5 / 55.5 / **65.3** | **-2.2** |
| soldier (Blaster) | 31.9 / 42.1 / 50.4 / 59.0 | no missions | 33.1 / 44.0 / 52.9 / **62.7** (60.5-67.1) | **+3.7** |

**Missions and time** (means per life):

| Life | Missions (failed, cut short) | Days posted | Training h in duty's turns | Routine h (off -> after) | Duty's form XP | Days wounded | Care given |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guardian | 399 (109, 76) | 2,177 | 11,054 | 67,440 -> 44,467 | 6,390 | 1,692 | 85 |
| Consular | 471 (113, 60) | 2,783 | 11,821 | 63,846 -> 44,328 | 4,432 | 1,023 | 71 |
| Sentinel | 433 (109, 68) | 2,513 | 12,053 | 67,413 -> 44,840 | 6,745 | 1,318 | 77 |
| Sith Warrior | 193 (43, 7) | 0 | 15,298 | 62,607 -> 46,216 | 10,307 | 42 | 6 |
| Sith Inquisitor | 194 (45, 8) | 0 | 12,611 | 55,908 -> 41,077 | 6,894 | 58 | 8 |
| soldier | 133 (31, 30) | 0 | 25,249 | 43,919 -> 20,902 | (Blaster 9,774) | 208 | 29 |

**Readings:**
- **Peace pays about on the curve or a little above:** the Jedi at 25 (Padawans in peace), the Sith Warrior all life, the soldier.
- **The Inquisitor is the exception.** Its main is Force Output study, and missions cost study as they cost the Consular (-2.2).
- **The gap opens in the war.** Guardian at 30 / 35 / 41: -0.9 / -3.5 / -4.2. Consular: -4.1 / -7.4 / -7.6. After the war it neither grows nor closes.
- **Missions per life rose** (Guardian 243 -> 399) because posted lives now stay at the front, where a mission comes every 2-5 days.
- **Charisma at 41 (B2):** Guardian 0 -> 3.1, Consular 0 -> 4.5. The Consular now passes the Guardian. These harness lives train only forms and the Force, so both are very low; a test-start Jedi has Charisma 13.

## B. Jared's revised target, and what combat can do

**The NPC generator already rewards war.** Each war year adds 0.3 of the form pace (`CLOSED_FORM.warFactor`, D-43, D-105). The closed form reproduces the missions-off day loop (Guardian 67.68 against 67.64 at 41), so the closed form with this life's war years is a consistent target:

| Archetype (main) | Closed form at 35: peace -> war years | At 41: peace -> war years | After (day loop, missions on) 35 / 41 |
| --- | --- | --- | --- |
| Guardian | 61.4 -> **64.3** (9 war years) | 67.7 -> **70.6** (10) | 57.8 / 63.5 |
| Sentinel | 59.9 -> **62.7** | 65.9 -> **68.7** | 57.7 / 63.3 |
| Consular (Force Knowledge; half war years) | 48.5 -> **51.6** (4.5) | 61.6 -> **64.6** (5) | 41.2 / 54.1 |

**Proposed target:** a full war career ends about **+3 levels** above the missions-off curve by 35 (the closed form's war years). A peace career ends within about 1 level of the curve. That also makes the player's war veterans match the generator's war-veteran NPCs. Today a player Guardian with a war career ends about 7 levels below an NPC of the same life.

**What combat did** (20 seeds, Jedi and all lives):

| Candidate | Guardian 35 / 41 | Sentinel 41 | Consular 41 | soldier 41 |
| --- | --- | --- | --- | --- |
| After (x1.5) | 57.8 / 63.5 | 63.3 | 54.1 | 62.7 |
| x2 and a Force user among 35% of war fights' foes | 58.4 / 64.0 | 62.6 (57.6-64.8) | 50.3 (33.1-54.2) | 55.8 (31.0-66.3) |

- **The multiplier:** x1.5 -> x2 added 164 main-form XP a Guardian life. So the fight part of mission XP is only about 500 main-form XP a life (most of duty's form XP is the routine run during long trips).
  - Against era minions a veteran learns almost nothing: the challenge of a 25-35-level gap is near 0.
  - Closing the 6-7 levels to the target would take about x10, which is a farm.
- **Force-using foes** (the Sith acolyte, else the Dark Acolyte or Dark Jedi by year) are minions too: about as strong as a young Knight, far below a veteran. They hurt more than they taught. Dying states and lasting injuries crippled a few lives (the duty player never withdraws), and the soldier met them with a blaster.
  - **Not kept.** The code is the x1.5 version, as measured in "After".
- **Fights against Force users already teach more by the opponent's strength** (the gap's challenge). A duelist 10+ stronger also teaches its form (D-427). What war missions lack is near-level opponents: generated or named Sith of the character's own strength. That is mission content, not a number. It would still be capped by the daily cap.

**World consistency:** the NPC side already gives war years to forms (the 0.3 above), and war years raise Tactics. Nothing in the closed form or the canon sheets changed in this milestone. Canon NPCs carry fixed sheets with no generated war years, so **no canon anchor moved** (Satele Shan, Orgus Din, the Clone Wars generals; test:all's anchor tests pass, section E).

## C. The slow-call cap

- **The rule:** on a big moment the stronger model (Flash) gets one try of **25 s** (`PREMIUM_WAIT`) with no retries on it.
  - With no reply, the call goes once to the call type's main model (Flash-Lite), with its usual retries.
  - The status line's counter names the model it waits on: each call reports it, and the counter restarts on the new call.
  - A narration check's retry uses the main model.
- **How:** the limit is a per-call `timeoutMs` on the call options (never sent to the model). The Gemini provider reads it before its own 90 s.
- **`/simulate slow <n>`** (dev) makes the next n requests stall until their time limit, then time out, next to `/simulate 503`.
- **Tested** (tests/m9/tune.test.ts, through `playTurn` with a simulated stall):
  - the opening's Flash call carries 25 s and times out; Flash-Lite answers; the counter's calls are Flash then Flash-Lite; the turn record has both calls; the report says why;
  - a reply in time stays Flash's;
  - a narration-check retry (a summons phrase on the opening) goes to Flash-Lite.
- **Not tried in a browser:** this session had no browser.

## B1. The Consular's Force approaches

- **The approaches:** influence them through the Force (Willpower) and read them through the Force (Force Sense), for Force users only, on the stages section 4 of the spec lists:
  - diplomacy: influence on every stage, reading on the talks and the accord;
  - negotiation: an infiltration's way in, cover and exit;
  - interrogation: a manhunt's trail, a rescue's "locate them", a lead, the recovery stage;
  - investigation: the first lead; lead to lead takes both.
- **The choices:** the code shows up to four ordinary approaches, then the Force ones.
- **The narrator's choices:** a choice on Willpower or Force Sense takes the stage's own approach on that skill; a mind trick is influence.

**The Consular's pooled failure in peace** (`npm run missions`, 20 seeds):

| Who, era | m9-release (before) | **m9-tune** | Complications a mission (after) |
| --- | --- | --- | --- |
| **Consular Knight, peace** | 22.9% | **11.2%** | 1.55 |
| Knight (Guardian), peace | 12.4% | 13.3% | 1.43 |
| Master, peace | 7.7% | 7.8% | 1.01 |
| Padawan with a master, peace | 13.0% | 14.9% | 1.56 |
| Powerful Knight, peace | 17.7% | 8.6% | 1.19 |
| Consular, limited war | 20.5% | 14.0% | 1.54 |
| Consular, total war | 16.0% | 16.8% | 1.50 |

- **The Consular in peace is now a little under the Knight's "about 15%".** Its diplomacy and investigation stages take Willpower and Force Sense, where a test-start Jedi is strong, instead of Charisma 13. The others hardly move.
- **The run:** 300 simulated years (15 cells x 20 seeds) in 277 s. The harness's player still takes the best-skill approach and resolves fights in one go.

## D. Proposal, waiting for approval (rule 7): a war-year pace

Combat can't carry a war career above the curve without becoming a farm (B). The proposal: **while posted to a front in a total war, form and Force-skill XP from every source (the routine, field practice, fights) takes a front pace factor W.** W is tuned on the full 20 seeds so that a full war career lands at the closed form with its war years: Guardian about 64 at 35 and 70-71 at 41, Consular Force Knowledge about 51.6 / 64.6.

- **The estimate:** a Guardian gains about 3,100 Soresu XP from 26 to 35 at the front, and needs about 2,900 more. So W is about 1.9-2.2.
  - Another way to see it: the NPC gets x1.3 pace per war year on a full-time routine, while the player at the front trains about 60% of the peacetime hours.
- **The NPC side stays as it is:** the target is its own formula, so the player and the generator agree by construction.
- **Peace and limited wars are untouched.**
- **Alternatives:**
  - near-level Force-using opponents as war mission content (a combat lever, still capped);
  - fewer missions at the front (Jared set the 2-5 days off; not recommended).

Nothing of this is built.

## E. Checks

| Run | Result | Time |
| --- | --- | --- |
| npm test | 2,236 of 2,236, 184 files | 43 s |
| typecheck | clean | 13 s |
| lint | clean | 12 s |
| test:all (lifetime included) | 2,298 of 2,298, 202 files | 1,206 s (20.1 min) |
| lifegap, missions off, 20 seeds (e829b23, before) | 120 lives | 1,437 s |
| lifegap, missions on, 20 seeds (e829b23, before) | 107 of 120 (one death lost a shard) | 1,670 s |
| lifegap, missions on, 20 seeds (**after**, final code) | 120 lives | 2,029 s |
| lifegap, x2 and Force foes, all lives (rejected) | 120 lives | 2,833 s |
| lifegap, x2 and Force foes, Jedi only (stopped once the full run was started) | 35 of 60 | about 1,100 s |
| npm run missions (20 seeds x 15 cells) | as in B1 | 277 s |

- **Missions off is unchanged by this milestone:** duty is off there, and the harness's own fights carry no field flag. test:all's lifetime tests pass unchanged.
- **Timing caveat:** one early npm test ran beside the baseline and timed out on two 5 s tests (the m8 holds test, already logged as a load flake, and formTransfer). Both pass alone and in the final run.
- **Two baseline runs were restarted** after counters were added, and one after-run after the care fix. Only complete runs are reported.

**Tests added:** tests/m9/tune.test.ts (12):
- the Force approaches, their stages, the choices and the mapping;
- stage XP for influence, talk and investigation;
- practice shares, the session and its blocks;
- the field fight's x1.5 under the cap, and the flag on a mission (not a dev fight, not at home);
- the slow-call cap, a reply in time, the narration retry, `/simulate slow`.

## Not done

- **The revised target is not met.** The war-year pace (D) waits for approval.
- **The Consular:** Force Knowledge stays 7.6 below the curve at 41; under the revised target that is about 10.5 below its war-years closed form. Combat doesn't reach study, so this is part of D.
- **Not changed, for Jared:**
  - travel days (montages) keep the whole routine (A2);
  - a trooper start is never posted (no service record);
  - Sith lives read their side as `sithEmpire` in a `sith` war;
  - the duty player never withdraws from a fight (about 1 mission in 6 cut short).
- **The slow-call cap is not seen in a browser.**

## F. Every invented number

| Number | Where |
| --- | --- |
| Field practice 1.5 h a working day of a mission, in half-hour steps | `FIELD_PRACTICE` (missions.config) |
| A field fight x1.5 on its exchanges | `FIELD_FIGHT` (progression.config) |
| A stage roll's field-check XP: 0.5, half on a failure (stealth's numbers) | `FIELD_CHECK` (skillXp.config) |
| Which stages take influence and reading people | `MISSION_TYPES`, `LEAD_STAGE`, `COMPLICATION_STAGES` |
| The slow-call cap: 25 s | `PREMIUM_WAIT` (ai/models.config) |
| The harness soldier: a Republic Army trooper in a barracks on Coruscant | `CAREER_HOME` (tests/support/lifetime.ts) |
| Tried and not kept: x2, a Force user among 35% of war fights' foes | section B |
