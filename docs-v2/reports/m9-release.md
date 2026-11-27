# m9-release: the m9-missions review fixes, then install and storage (2026-11-27)

Jared's brief of 27 Nov 2026: his review of reports/m9-missions.md, plus a Claude in Chrome play test of that build (a 3,661 BBY Knight posted to the Hydian Way, a rescue on Manaan from the Devaron forward base). Part A fixes the mission system (committed alone as "m9-release part A"). Part B makes the game installable on the iPad with safe saves. Decisions D-554 to D-559. Specs touched: missions.md, duty.md, architecture.md (§13, §15). New: docs-v2/install.md.

**Every number not from lore or Jared is invented.** Section E lists them all.

Part A and Part B were built in one working tree in this session. The Part A commit was split out of it by file, with app.ts carrying only A1's wait timer. The checks in section C ran on the whole tree.

## A. Mission fixes

### A1. "Resolve to end" froze in the mission fight

**Not reproduced; the cause is not proven.**
- *What was checked:* every engine and render path of that turn is bounded and fast. Replayed through the pipeline with a stubbed narrator:
  - a 3,661 Knight's rescue on Manaan: the narrator starts a fight during "get in", one exchange, then Resolve to end (8 seeds);
  - a mission fight stage, Go in then Resolve to end (4 seeds).
- *Results:* each turn took 6-50 ms. The side panel and the pre-narration preview rendered every state in 6-20 ms. The duel's loops are capped at 400 exchanges. No promise in the pipeline waits on mission state.
- *No record of the frozen turn:* the play test's browser profile holds no save after 20 Nov, and a turn that never commits leaves none.
- *What fits the evidence:* a slow model call.
  - A fight's end is a big moment, so the premium model goes first.
  - The narration check often retries a fight's narration once.
  - Each attempt may wait up to 90 s (REQUEST_TIMEOUT_MS) with nothing on screen beyond "Resolving: Resolve to end".
- *Built, so the next one shows itself:*
  - each call's time in the turn record (`CallRecord.ms`);
  - a status line that names what the turn waits on and counts the seconds ("Resolving: Resolve to end · waiting for the narration (gemini-3.8-flash), 47 s").
- *Test:* a mission fight stage resolved to its end through `playTurn` on 4 seeds. Each fight ends, the stage is decided by the code (`missionStageResolved`), and every call has its time.
- If it happens again, the turn record's call times and the status line will say which call held it.

### A2. The narrator resolved a stage with no roll

**Root cause:**
- the clicked choice "Infiltrate the maintenance bay to rescue the captives" carried no skill;
- choices skip the intent call, so no approach was read and nothing rolled;
- the narrator was free to tell the outcome and start a fight.

**Fixed:**
- The MISSION line lists each approach with its skill id ("slip in unseen (skillId stealth)"). Every choice either takes one (its intent carries that skillId, so clicking it rolls it) or is pure story that does not attempt the stage. The narrator never tells a stage's success, failure or a discovery, and never starts a fight at the stage.
- A clicked choice with no approach while a check stage waits goes to the intent call, as typed text does. So the same B3 rule maps it: the infiltration choice is Stealth, "get in: slip in unseen" (tested through the pipeline).
- A narration check, `stageNarrated`, runs on a turn that rolled no stage. It catches "a guard spots you", "you are spotted", "trips the alarm" and "you slip inside unseen": one retry, then the sentences are removed. An ordinary line passes.
- A narrator's combatStarted during a stage is refused, unless a failed check this turn brought it (a complication). Forcing the way through is the player's approach.

### A3. Code travel was clipped

**Root cause:** `pacingForSpan` turns any span between 12 h and a day into a 12 h scene (a narrator's long-scene rule), and trips went through it.

**Fixed:** a trip's hours are never clamped. Past 12 h the trip is a montage that ends on the morning nearest the arrival. Tested: Devaron to Manaan keeps its hours, with no clamp line.

### A4. The opening hinted at a mission

**Root cause:** the narration check already ran on the opening, but its phrase list had no summons wording.

**Fixed:**
- Summons and Council-call phrases were added: "a summons", "the Council has summoned you", "your presence is requested", "report to the Council", "the Masters wish to see you", "new orders".
- Ordinary lines are not flagged ("the Council Chamber is quiet", "you summon your strength", "your master wishes to see you after the lesson").
- A narrator's choice that offers a mission or a summons is dropped ("Acknowledge the summons and make your way to the Council Chamber").
- Tested on an opening.

### A5. The skip stopped for an order with only the engine line

**Root cause:** the montage report told the narrator only "End the narration at the moment this begins". A posting had no choice but the trip, and "Resume the skip" was offered first.

**Fixed:**
- For a posting or an assignment, the narrator is asked for a short scene of the order arriving: who brings it, where, and what it asks.
- The code's choices come with it: set out, or travel to the front, plus "Take a day to settle your affairs first" for a posting.
- No "Resume the skip" while a new posting waits.

### A6. "Away from the Temple, at Devaron" while still at the Temple

**Fixed:** a posting records whether its base has been reached (`arrived`, false from the posting until arrival). Until then the duty line reads "Posted to the Hydian Way front (the fleet base at Devaron), not yet left".

### A7. Days off on a front

At the forward base the gap between missions is now 2-5 days: the daily roll's own front numbers (none the first day, median 3.5, shape 4; invented). The Temple cadence is unchanged. **The posted Knight's year** (3,661 BBY, 20 seeds; medians, ranges in brackets):

| | Missions | Failed / cut short (pooled) | Postings | Leave | Days at the Temple | Longest away | Mission length (10th / median / 90th) | Days off at the front |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m9-missions (before) | 16 (6-25) | 4 / 2 (medians) | 2 | 1 (0-2) | 131 (20-306) | 239 | 1 / 2 / 5 | (10-day war median) |
| **now** | 14 (1-33) | 16.8% / 13.5% | 2 | 0 (0-2) | 129 (1-246) | 134 (13-333) | 1 / 3 / 5 | **3 / 4 / 5** |

**Reading the table:**
- The days off are where Jared wants them.
- The yearly count did not rise. Most of the year's non-mission days are recovery at the Temple after an evacuation (median 129 days), not days off at the front.
- The Master's days off are 3 / 5 / 6, and the Consular's 3 / 4 / 8 (its 90th percentile includes injury holds).

### A8. Leave from the first posting of the war

The leave clock (`leaveClock`) is set at the war's first posting. A later posting in the same war keeps it while it runs ahead (tested). Leave also waits until the character has reached the base.

The median leave in the simulated year is still 0. The clock's 90-180 days are rarely reached in the same stretch: the first posting ends with the Hydian Way front in 3,660, and evacuations send the character home.

### A9. A moderate wound while posted

This was already so in the code. A mission launched while posted has the forward base as its base, so "sent back" means the forward base's medics. The posting goes on, and only a severe wound or worse evacuates to the Temple. Now tested (a posting set by hand where no all-hands event runs) and in the spec.

### A10. The Council's best: Masters on a field path

A Master counts only when the archetype's war-year share is above 0 (WAR_YEAR_SHARE: Guardians, Sentinels and Consulars yes; scholars no). For a canon figure with no generated archetype, the role and description must contain none of the non-field words (archivist, librarian, scholar, historian, healer...). Tested: a Master described as "Chief Librarian of the Jedi Archives" is not chained.

### A11. Failure rates and the type weights

**Found (measured, 20 seeds, before any change):**
- An ordinary Knight in peace failed 23.4% of missions, a Master 27.1%, a Consular 31.4%.
- **The test start's Jedi have 0 in Stealth, Investigation, Tracking, Piloting and Repair.** A Master has barely more than a Knight in the skills most checks read: Charisma 14 v 13, Intelligence 17 v 16, Tactics 35 v 20. Checks roll on Force Sense, Agility and Willpower where those fit, and on weak skills where they don't. A Master passed fewer checks than a Knight (57.5% v 60.5%).
- **Two root causes of "never set out" failures:**
  - missions to worlds the travel rules close: Voss and Quesh in 3,661; Yavin 4, Ilum and Lehon off the charted routes;
  - long trips out (some 6-9 days) passing the 7-day "never set out" rule during the trip.

**Changed:**
1. **Reachable worlds only.** Missions, follow-ups, a manhunt's next world, postings, proposals and leads now go only to worlds the travel rules open to the character (`worldOpen`: the galaxy map's gates and the charted routes).
2. **Setting out** is recorded when the trip to the target begins (`missionSetOut`).
3. **Type weights by archetype:**
   - a Guardian in peace: escorts 3, rescues 2, manhunts 2, recons 2, investigations 1, diplomacy 1;
   - a Consular: diplomacy 4, investigations 3;
   - new rows for the Sentinel, the Sith Warrior and the Inquisitor (spec/missions.md section 2).
4. **Every stage rating 10 lower** (25-40 became 15-30).
5. **A Master's field experience:** +1 on a stage's check.

**Tuning runs** (each the full 20 seeds; pooled failure in peace):

| Run | Knight | Master | Padawan (with a master) | Consular | Powerful Knight |
| --- | --- | --- | --- | --- | --- |
| before | 23.4% | 27.1% | 25.2% | 31.4% | 24.0% |
| ratings -10, reachable worlds | 14.7% | 21.2% | 14.2% | 23.7% | 22.3% |
| + Master +1 (peace cells only) | 14.7% | 11.6% | 14.2% | 23.7% | 22.3% |
| **+ set out at the trip's start (final, all cells)** | **12.4%** | **7.7%** | **13.0%** | 22.9% | 17.7% |

**Final, pooled over every mission of all 20 seeds** (total failures over total missions; cut short and complications too):

| Who | Era | Missions | Success | **Failed** | Cut short | Complications a mission | Why they failed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Knight (Guardian) | peace | 153 | 87.6% | **12.4%** | 0.0% | 1.59 | complications 38 |
| Knight (Consular) | peace | 140 | 72.1% | 22.9% | 5.0% | 2.17 | complications 64, fight 1 |
| Powerful Knight | peace | 198 | 82.3% | 17.7% | 0.0% | 1.65 | complications 70 |
| Master | peace | 181 | 91.2% | **7.7%** | 1.1% | 1.31 | complications 28 |
| **Padawan with a master** | peace | 146 | 82.9% | **13.0%** | 4.1% | 1.75 | complications 38, fight 1 |
| Knight | limited war | 181 | 66.9% | 16.6% | 16.6% | 1.43 | complications 53, fights 16 |
| Consular | limited war | 234 | 69.2% | 20.5% | 10.3% | 1.87 | complications 93, fights 11 |
| Powerful Knight | limited war | 377 | 84.9% | 10.3% | 4.8% | 1.26 | complications 75, fights 10 |
| Master | limited war | 380 | 88.4% | 5.0% | 6.6% | 0.88 | complications 30, fights 15 |
| Padawan | limited war | 218 | 70.2% | 10.6% | 19.3% | 1.26 | complications 40, fights 12 |
| Knight | total war | 297 | 69.7% | 16.8% | 13.5% | 1.50 | complications 93, fights 22 |
| Consular | total war | 451 | 69.4% | 16.0% | 14.6% | 1.52 | complications 138, fights 16 |
| Powerful Knight | total war | 502 | 82.3% | 12.2% | 5.6% | 1.31 | complications 118, fights 14 |
| Master | total war | 358 | 84.6% | 5.3% | 10.1% | 0.83 | complications 28, fights 23 |
| Padawan | total war | 172 | 62.8% | 13.4% | 23.8% | 1.29 | fights 27, complications 35 |

**Readings for Jared:**
- **On target.** The ordinary Knight (12.4%) and the Master (7.7%) sit a little under "about 15%" and "about 10%". Complications stay common (1.3-2.2 a mission in peace), so the drama is in complications.
- **No "never set out" failure is left in any cell.** Before, they were up to 16 a cell.
- **The Consular fails twice as often as a Guardian.** The new weights send it to diplomacy and investigation as asked, but the closed form gives a Consular no more Charisma or Intelligence than a Guardian (13 and 16). Its strengths are not in the skills those missions read. That is a progression question (the archetype's skill paces); nothing was changed here. Options: Consular paces for Charisma, Intelligence and Investigation, or Willpower and Force Sense approaches on the social stages.
- **Cut short is high at war** (13-24%). These are wounds: a moderate wound outside all hands sends the character back, and a severe one evacuates.
- The Padawan's cut-short share is the highest (23.8% in a total war): its own wounds, as the master holds only half the foes.
- The harness's player always takes the approach with the best skill and resolves fights in one go; a human player will do better or worse.

**Type mix, a year in peace (20 seeds):**
- Guardian: escort 51, recon 28, manhunt 27, rescue 20, diplomacy 17, investigation 12.
- Consular: diplomacy 54, investigation 45, rescue 17, recon 15, escort 13.

### A12. All travel is code-owned

Every trip's end now moves the character in code, not only the code's own mission, posting and leave trips. The narrator's move to another world (locationChanged, or moveHere on a place named for or under another world) is refused, and contract.md tells it to offer a travel choice instead. "I fly to Corellia" on a day off is the player's travel intent, checked by the travel rules with the time it takes.

The old test "moving to another planet closes the chapter" relied on the narrator moving the character to Tython. It now arrives by a code trip, and a new test checks that the narrator's own move is refused.

### A13. Leads found during a mission

`missionLeadFound` (the narrator's; checked like other proposals) works on an investigation or a manhunt:
- "here" adds a "follow the lead" stage after the current one;
- "world" adds the trip to another reachable world and a stage there;
- "followUp" makes a follow-up mission on the same thread when this one succeeds, for anyone, not only the Council's best.

At most 2 leads a mission (invented). The MISSION line mentions it on those missions.

### A14. War intensity

The Great Sith War and the Jedi Civil War are total. New fronts (so a total war can post anyone):
- the war against the Krath (Empress Teta, 3,998-3,996, a reading);
- the defence of Ossus and the assault on Yavin 4 (3,996, SW_Characters_04-05);
- the Dantooine front (3,959-3,956, a reading).

The Star Forge campaign at Lehon was tried and dropped: Lehon is off the charted routes, so no posting could reach it. The existing Ilum front (3,640) is unreachable the same way and is never chosen (D below).

| War | Years (BBY) | Intensity |
| --- | --- | --- |
| the Great Hyperspace War | 5,000-4,999 | limited (a reading) |
| **the Great Sith War** | 4,000-3,996 | **total** (Jared) |
| the Mandalorian Wars | 3,976-3,960 | limited (a reading: the Order stayed out) |
| **the Jedi Civil War** | 3,959-3,956 | **total** (Jared) |
| the Great Galactic War | 3,681-3,653 | total |
| the Galactic War | 3,641-3,637 | total |
| the New Sith Wars: the Schism and the Dark Underlord | 2,000-1,750 | limited |
| the New Sith Wars: Gap Nine to Mizra | 1,500-1,466 | limited |
| the Sictis Wars | 1,250-1,230 | limited |
| the New Sith Wars: the Grumani campaigns | 1,042-1,032 | limited |
| the Light and Darkness War (the Ruusan campaign) | 1,010-1,000 | total |
| the Clone Wars | 22-19 | total |
| the Galactic Civil War | 2 BBY-19 ABY | limited (a reading) |
| the Yuuzhan Vong War | 25-29 ABY | total |
| the Second Galactic Civil War | 40-41 ABY | limited |
| the Sith-Imperial War | 127-130 ABY | limited (a reading) |

### A15. The lifetime gap with missions on (report only)

`npm run lifegap` runs the lifetime suite's six archetype lives (the same profiles and seeds as archetypeLife.ts; born in 1,032 BBY, so a Knight's first years fall in the Light and Darkness War, a total war). It runs them once with duty off, as test:all does, and once with `LIFETIME_MISSIONS=on`: duty on, its missions played by the same duty player as the measure. **No progression number was changed.**

Main specialty (highest form) and Force Sense, missions off -> missions on:

| Life | Main at 25 | Main at 30 | Main at 41 | Force Sense at 41 | Missions in the life (fail, cut short) |
| --- | --- | --- | --- | --- | --- |
| Jedi Guardian | 49.3 -> 48.9 | 55.5 -> 53.5 | **67.6 -> 62.0** | 53.7 -> 49.8 | 268 (74, 41) |
| Jedi Consular | 18.0 -> 17.8 | 35.4 -> 32.4 | **61.6 -> 52.6** | 50.7 -> 47.7 | 277 (98, 33) |
| Jedi Sentinel | 48.5 -> 47.9 | 54.3 -> 52.2 | **65.9 -> 60.1** | 53.4 -> 49.1 | 267 (71, 32) |
| Sith Warrior | 46.2 -> 46.2 | 52.2 -> 52.1 | 64.0 -> 63.9 | 45.5 -> 45.5 | 0 |
| Sith Inquisitor | 36.4 -> 36.4 | 48.1 -> 48.1 | 67.6 -> 67.6 | 47.6 -> 47.6 | 0 |
| soldier | 31.9 -> 31.9 | 42.0 -> 42.0 | 59.0 -> 59.0 | - | 0 |

**Readings:**
- **The gap:** a Jedi with missions ends 5.6-9.1 levels lower in the main form at 41, and about 4 lower in Force Sense.
  - Mission days have no free day and take the training routine's hours (travel, stages, recovery).
  - The harness's mission fights replace few of them.
  - The Consular loses most: its many diplomacy missions give no form XP.
- **The Sith and the soldier got no missions in the harness.** The likely reason, not established: their home base is recorded once, where duty first sees them, and the harness then moves the life by its seat (the Sith from Korriban to Dromund Kaas by date). So the daily roll, which runs only at home, never fires. Not chased in this session.
- The harness's Jedi fail 27-35% of missions: these lives train only their forms and the Force, so their mission skills are lower than the test start's.

### A16. missions.measure in parallel

The measure is now `npm run missions`: `tests/missions/` with 8 shards on the parallel runner (tests/support/parallelRuns.ts, with a new async runner), and a shared duty player (tests/support/dutyPlayer.ts). It ran **300 simulated years (15 cells x 20 seeds) in 271-284 s**. The old single-thread run took 715 s for 180. The old tests/measure/missions.measure.ts is gone.

## B. Install and storage

### B1. Install

- **The manifest** (`public/manifest.webmanifest`): name "Star Wars Legends RPG", short name "SW Legends", standalone, start and scope `./`, colours #070b12 (the app's background).
- **Icons:** 180 (the apple-touch-icon), 192, 512, and a maskable 512. A glowing saber in the app's accent blue on its dark background, drawn by `scripts/make-icons.mjs` with no dependency.
- **index.html:** the Apple tags (apple-mobile-web-app-capable, status bar black-translucent, title "SW Legends").
- **A hand-written service worker** (`sw/service-worker.js`; no PWA plugin or framework).
  - A small plugin in vite.config.ts writes it to `dist/sw.js`, with the build's file list (the page, the bundled script and styles, the manifest, the icons) and a version from their content.
  - It caches the app shell. A page load gets this version's page, so it always matches its own scripts.
  - Requests to other hosts (Gemini) go to the network untouched.
- **Updates:** a new build installs in the background and waits. The app shows **"A new version is ready: reload"** in a bar above every layer, the Settings modal included. Only the player's Reload lets the new version take over; the page reloads once it has. The old cache is deleted.
- **Checked in Chrome** on a `vite preview` of the build under `/Swrpg/`:
  - the worker registers at the `/Swrpg/` scope and caches 9 files;
  - with the server stopped, the app opens offline;
  - a rebuilt version shows the bar, and Reload switches to it and drops the old cache.
- **Found and fixed during that check:**
  - offline, the cached script and styles were not served: their cors-mode requests did not match the cached entries under the server's Vary header (fixed with `ignoreVary`; the files are static and named by their content);
  - the notice sat under the required Settings modal;
  - a page with no worker at load did not reload after the player asked.

**Not checked on an iPad** in this session.

### B2. Storage: where the saves live, and their size

- **Campaigns:** autosave, the last 10 saves, one a day for the last 7 days, and the transcript. These were already in IndexedDB (database `swrpg-v2`; architecture §13), so **no move or migration was needed**.
- **localStorage** holds only the settings, the API key, the usage meter and the backup record: a few KB.
- **Measured** (`tests/measure/campaignSize.measure.ts`): the dev test start's Knight in 3,661 BBY, two in-game years with missions played (548 turns), then 30 pipeline turns with a long reply (about 2,400 characters).

| | Size |
| --- | --- |
| Save envelope: start, 90 days, 180, 365, 545, 730 | 10, 41, 62, 75, 79, **85 KB** |
| Transcript entry, one turn with a long reply | **15.8 KB** |
| Snapshots kept (autosave + 10 + 7) | 18 x 85 KB = **1.5 MB** |
| A campaign of 500 / 1,500 / 3,000 turns | transcript 7.7 / 23 / 46 MB, plus 1.5 MB of snapshots |

- A long campaign stays far from the about 5 MB that matters for localStorage. In IndexedDB, Safari allows far more.
- The app asks for persistent storage (`navigator.storage.persist()`) on start and when installed. Settings, Storage shows whether it is persistent and how much is used of the quota (`navigator.storage.estimate()`).
- The export file is the envelope plus the transcript, so a 1,500-turn campaign exports as about 23 MB.

### B3. Backups

- **The reminder:** after 5 chapters or 7 days of real time since the last export, whichever comes first, or since the campaign began if it was never exported. It sits in the status bar with Export and Later. Later hides it until the app is next opened.
- **The record:** the last export's time and chapter count, per campaign, in localStorage.
- **Export:** where the browser can share a file (the iPad), the share sheet opens (the Web Share API with the file), so it can go straight to Files or iCloud Drive. Elsewhere, or if sharing fails, a download. Cancelling the sheet is not counted as a backup.
- **Import** takes the same file (unchanged).

### B4. The first run in the installed app

In the Home Screen app, while it has no API key or no campaign, Settings opens with a note. It says that this app keeps its own storage, separate from Safari's: paste the API key, then import a campaign file. "Got it" dismisses it for good.

### B5. Deploy

- The old workflow uploaded the repository root. Its index.html loads `/src/main.ts`, which GitHub Pages cannot run, and the absolute path breaks under the project path.
- It now sets up Node 24, runs `npm ci` and `npm run build`, and publishes `dist/`. It still triggers on a push to `main`, or by hand.
- `npm run build` checks dist/ at the end (`scripts/check-dist.ts`): the manifest, the four icons and sw.js are there; index.html links the manifest and the apple-touch-icon; every path in index.html, the manifest and the worker's list is relative; every built asset is cached.
- Jared's steps (run locally, deploy, install on the iPad, back up, move a campaign from Safari to the installed app) are in **docs-v2/install.md**.

### B6. Tests

tests/m9/pwa.test.ts (9 tests):
- the reminder rule and its record;
- the update check's state;
- the storage line;
- the first-run note;
- share or download;
- the dist check on a fake folder (a good build passes; an absolute path, a missing worker or an uncached asset fails).

The real build passes the same check on every `npm run build`.

## C. Checks

| Run | Result | Time |
| --- | --- | --- |
| npm test | 2,224 of 2,224, 183 files | 51.5 s |
| typecheck | clean | 11.6 s |
| lint | clean | 16.8 s |
| test:all | 2,286 of 2,286, 201 files | 1,232 s (20.5 min) |
| npm run missions (20 seeds x 15 cells, 8 cores): baseline, candidate 1, final | as above | 271 s, 276 s, 284 s |
| npm run missions, peace cells only (candidate 2) | as above | 99 s |
| npm run lifegap: missions off, missions on | as above | 82 s, 111 s |
| campaignSize.measure | as above | 23 s |
| npm run build (with the dist check) | passes | about 15 s |

**Tests added:**
- tests/m9/release.test.ts (17): A1-A13, including the mission fight stage resolved to its end through the pipeline;
- tests/m9/pwa.test.ts (9).

**Tests changed, with the reason:**
- m9/partA: the total wars are now seven (A14).
- turn/memoryPipeline: the planet move is the code's trip, and a new test checks that the narrator's move is refused (A12).

**Seen once:** tests/m8/holds.test.ts ("a corridor is bought more often than a hangar...", 5 s) failed in one npm test run under load from a parallel measurement and passed alone and in the next full run. A timing flake, not a result.

## D. Not done, or left for Jared

- **A1's cause is not proven** (above). The next freeze will show its call and time.
- **The Consular's failure rate** (22.9% in peace) needs a progression ruling (A11).
- **The Sith and career lives got no missions** in the lifetime harness's missions-on run (A15). The likely cause is the harness moving their home seat; not chased.
- **Unreachable fronts:** the Ilum front (3,640) is off the charted routes and so is never posted; Lehon was dropped. A fleet's own transport (a posting that takes the character there) is not modelled.
- **Not checked on an iPad:** the Home Screen install, the share sheet, persistence and the first-run note. The service worker, offline start and the update were checked in desktop Chrome only.
- **The bundle is one 3.8 MB script** (1.1 MB gzipped). Vite warns. It is cached after the first load; code-splitting was not attempted.
- **Not pushed.** The deploy happens when Jared merges `rebuild` into `main` and pushes. Pages' source must be set to GitHub Actions once (install.md).

## E. Every invented number

| Number | Where |
| --- | --- |
| A front's days off: none the first day, median 3.5, shape 4 | `MISSION_ROLL_FRONT` (data/duty.config.ts) |
| Stage ratings 15-30 (10 lower) | `MISSION_TYPES`, `COMPLICATION_STAGES` |
| A Master's field experience +1 | `STAGE_RULES.experience` |
| The type weights by archetype | `MISSION_TYPE_WEIGHTS` |
| Leads: investigations and manhunts, 2 a mission, the lead stage (rating 25, 4-12 h) | `LEADS`, `LEAD_STAGE` |
| The non-field words for a canon Master | `NON_FIELD_WORDS` |
| The discovery phrases (stageNarrated) and the summons phrases | `STAGE_TOLD`, `MISSION_SUMMONS` (turn/narrationCheck.ts) |
| The new fronts' bases, and the Krath and Dantooine spans (readings) | `FRONTS` |
| The backup reminder: 5 chapters or 7 days | `BACKUP_REMINDER` (persist/backup.ts) |
| A trip past 12 h ends on the morning nearest the arrival | `tripTargetDay` (turn/resolve.ts) |
| The status line's wait shown from 3 s | `busyLabel` (ui/app.ts) |
| The icons' design and the manifest's short name | public/, scripts/make-icons.mjs |
| The measure's long reply (about 2,400 characters) for the transcript size | tests/measure/campaignSize.measure.ts |

## Addendum (27 Nov 2026, m9-tune): the life-gap breakdown

Jared asked for the breakdown behind A15 before any fix. The life-gap counters are committed (tests/support/lifetime.ts, tests/lifegap/; commits e24a9d1 and e829b23): form XP by form, the XP duty's turns gave each skill, training hours inside duty's turns, fights, posted days and wounded days. The lifegap now runs **20 seeds** per life (seed 0 is the lifetime suite's own). Measured on e829b23, **before any m9-tune change**.

- Missions off: 120 lives in 1,437 s (8 workers).
- Missions on: 1,670 s. **Only 107 of 120 lives finished.** One Sentinel died on a mission (the duty player never stabilized a dying character). The harness then threw, and that took 12 more lives of the same shard with it. So the missions-on means are over 17-20 seeds (Guardian 20, Sentinel 18, Consular 17).

**The main specialty by age** (means; the range at 41 in brackets). The Consular's main specialty is **Force Knowledge**, and the Inquisitor's is Force Output, not a form (the archetypes' `main`):

| Life (main) | Off: 25 / 30 / 41 | On: 25 / 30 / 41 |
| --- | --- | --- |
| Jedi Guardian (highest form) | 49.2 / 55.5 / 67.6 (67.5-67.8) | 48.9 / 52.8 / **59.9** (56.2-62.6) |
| Jedi Consular (Force Knowledge) | 18.0 / 35.6 / 61.6 (61.4-61.8) | 17.7 / 31.6 / **52.7** (50.0-56.0) |
| Jedi Sentinel (highest form) | 48.5 / 54.4 / 65.9 (65.8-66.2) | 47.8 / 52.0 / **59.9** (57.2-61.4) |
| Sith Warrior, Sith Inquisitor, soldier | unchanged | unchanged (no missions) |

**Form XP by form at 41** (the three biggest forms; the rest change by under 1%):

| Life | Soresu (main form) | Ataru | Shien | All forms |
| --- | --- | --- | --- | --- |
| Guardian | 18,571 -> 15,031 | 7,592 -> 6,250 | 3,273 -> 2,940 | 41,658 -> 36,040 (-5,617) |
| Consular | 10,921 -> 11,101 | 4,598 -> 4,338 | 2,568 -> 2,517 | 29,508 -> 29,314 (-194) |
| Sentinel | 17,756 -> 14,998 | 7,499 -> 6,292 | 3,249 -> 2,929 | 40,634 -> 36,011 (-4,623) |

**Where the time went** (means per life, 4 to 41):

| Life | Missions (failed, cut short) | Days in duty's turns | Days posted | Training h in duty's turns | Routine h (off -> on) | Training h a day, all (off -> on) | Days with a moderate+ wound (off -> on) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guardian | 243 (70, 33) | 2,967 | 1,644 | 11,507 | 67,440 -> 41,912 | 4.95 -> 3.92 | 18 -> **2,490** |
| Consular | 302 (90, 37) | 3,553 | 2,350 | 13,637 | 63,846 -> 40,490 | 4.69 -> 3.98 | 18 -> **1,667** |
| Sentinel | 274 (84, 34) | 3,468 | 2,089 | 13,790 | 67,413 -> 41,178 | 4.95 -> 4.04 | 22 -> **1,926** |

**The XP duty's turns gave** (means, the biggest): Guardian Soresu 4,076, Willpower 4,000, Force Control 2,023, Force Sense 1,914. Consular Force Knowledge 4,558 (long trips run the routine), Willpower 3,445, Soresu 2,854. Sentinel Soresu 4,485, Willpower 4,347.

**Readings:**
- **The Consular puzzle (m9-tune A1).** Its total form XP barely moves (-194) because its main specialty is Force Knowledge, not a form. Mission fights add Soresu XP (+180 net), while study time is lost: Force Knowledge ends 8.9 levels lower. Nothing routes mission-fight XP away from the main form: the duty player fights with the character's main form (`buildPlayerFighter` takes `mainFormId`, Soresu in these profiles).
- **Training hours fall about 20%** with missions on, over the whole life.
- **Wounds are the biggest single cost.** A Jedi with missions carries a moderate-or-worse wound for 1,667-2,490 days of the life, against about 20 without. Two harness choices cause it, not game rules:
  - the duty player never asks for care after a mission's wound (the harness's own fights get Temple care, D-162);
  - it never stabilizes a dying character (D-143 B does, for the harness's own fights).
- **Posted lives went home every night.** The harness moved the life to its seat at each day's end, also while posted. So every morning of a posting began with the trip back to the front (posted days were always days away from the base).
- **The Sith and the soldier got no missions.** The Sith: duty records a non-Jedi home once (Korriban), and at 13 the harness moves the life to Dromund Kaas, so it is never "at home" again. The soldier: the career profile has no place and no side, so duty sees no home.
- **Mission fights win back little.** Duty's form XP (3,459-6,315) against a routine loss of 11,000-11,300 form XP.

What m9-tune changed is in reports/m9-tune.md.
