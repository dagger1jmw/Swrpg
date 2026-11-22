# Force XP rework: trial 3 (the boost cap)

2026-11-21. Jared's rulings on `force-xp-trial-2.md` (0ccc315).

**Status:**
- The rework is **adopted** as the M6 Force XP model (D-333 to D-337).
- The flag stays off in the game until M6 integration (checklist item 21).

## Verdict

**The cap is Force Control 115 (D-335).**
- Luke's physical peak median is 63, inside the 63–65 target.
- Every gate passes on all 20 seeds, including Orgus and Luke's ceiling-removal gates.
- At 120 every gate also passes, but the median is 65.5, half a year above the target.

| | Cap 115 | Cap 120 | Cap 110 (trial 2) |
|---|---|---|---|
| Luke physical peak, 20-seed median | **63** | 65.5 | 59–60 |
| Luke peak range (seeds) | 62 (6), 63 (14) | 65 (10), 66 (10) | 59–60 |
| Luke gates: peak 58–68; rising at 40–42 y and FC > 100 at 62; milestones ±20%; not faster than Anakin | 20/20 each | 20/20 each | 20/20 each |
| Anakin, Obi-Wan, Average spread gates | 20/20 | 20/20 | 20/20 |
| Mortals suite (lifetime gates, duel table, wounds) | 11/11 tests pass | 11/11 tests pass | pass |
| Y_avg, 20-seed median | worst +2.8% at 90, pass | worst +2.8% at 90, pass | same |
| Orgus: count 7,000 reaches FC 84 within ±2 y of 10,000 | 20/20, median +0.45 y (+0.14 to +0.72) | 20/20, identical | identical |

**What the cap changes and what it doesn't:**
- The cap changes only the physical boost above Force Control 115.
- Force Control growth is the same at every cap. That is why the milestones, the Orgus ages and the Force gates are identical across the three runs.
- Only Luke reaches Force Control 110–120 while still in his physical prime, so only his peak moves.

## Runtimes (8 workers, 20 seeds, one run at a time)

| Job | Cap 115 | Cap 120 |
|---|---|---|
| `npm run mortals` | 1,103 s | 1,273 s |
| `npm run spread` | 1,135 s | 1,223 s |
| Orgus suite (40 lives, 95 years) | 908 s | 794 s |
| **Total** | **3,146 s** | **3,290 s** |

**A discarded first attempt (about 2.1 h of wall time).** The two caps were first run at the same time, and the results had to be thrown away:
- The parallel harness writes each job's result to one shared folder per suite (`node_modules/.cache/swrpg-runs/<suite>`, `tests/support/parallelRuns.ts`).
- Two runs of the same suite at the same time therefore overwrite each other's results. The cap 115 mortals output held 44 lives labelled cap 120.
- **Fixed after this trial (Jared's ruling on b7f3e1f):** each run now writes to its own folder, `node_modules/.cache/swrpg-runs/<suite>/<runId>`, with a `run.json` that records the environment settings (`FORCE_XP`, `CANDIDATE` and so on). The reporter reads only its own run, so overlapping runs no longer mix results. The last 5 run folders per suite are kept.
- **Advice:** still don't run two copies of the same suite at once. The machine is saturated at 8 workers, so two runs take as long as running them one after the other.

## Other rulings

- **Ruling 2:** accepted. Luke's first two milestones stay about 9% slower than off, inside ±20%. There is no step table (D-333).
- **Ruling 3:** accepted. Effort below a tier's normal demand is continuous (D-333).
- **Ruling 4:** backlash and collapse above 1.0 strain are in-scene effects, built and gated at integration. This is checklist item 27, added in this round; D-334 cross-references it.
- **Ruling 5:** D-333 to D-337 are logged with the cap at 115. Checklist items 21 and 23 and the rework spec's status line now say adopted.

## The game is unchanged

- `FORCE_XP_TRIAL.enabled = false`, checked by a unit test.
- The cap applies only when the flag is on. The unit test now expects 0.3 × 75 at Force Control 150.
- The harness takes `cap=` in `FORCE_XP` (for example `on,cap=120`), for later checks.
