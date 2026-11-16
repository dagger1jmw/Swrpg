# 07 — Momentum windows (legacy V170 audit)

Scope: `characterSheet.momentumWindow`, the `MOMENTUM_WINDOW` tag, `applyMomentumToXP`, expiry, and the related `SURRENDER_DISCOUNT` field stored on the same object. (Dark-pressure discharge itself belongs to the alignment audit; it is described here only where it touches momentum. The in-combat "Momentum: Player/Neutral/Opponent" header is unrelated narrative text, prompt 2158-2163, 2265.)

## What it does for the player
- After an AI-chosen event, the AI opens a "momentum window": a multiplier and a number of in-game days.
- While it is open, every XP award in story turns is multiplied (training, proficiency, direct XP, combat). Simulation XP is not.
- The alignment line in the state block and the Dark Pressure bar show a lightning mark while a window is active (4038, 7379).
- The window closes when the in-game date passes its expiry, or when the AI sends `0,0`.

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Default object | `{ active:false, multiplier:1.0, expiresDate:'', surrenderDiscount:0 }` | legacy/index.html:1724, 3409, 5251, 8262 |
| Tag | `MOMENTUM_WINDOW=mult,days` or `MOMENTUM_WINDOW:mult,days` | parser legacy/index.html:5250-5264 |
| Open | `mult = parseFloat || 0`, `days = parseInt || 0`; if either is 0 -> close; else active, multiplier = mult, expiresDate = `advanceInGameDate(inGameDate, days)` (or '' if no date) | legacy/index.html:5253-5263 |
| Bounds | none on multiplier or days | legacy/index.html:5253-5263 |
| XP effect | `round(xp * multiplier)` when active | legacy/index.html:6969-6972 |
| Where applied | TRAINING: sub-ability 5130 · TRAINING: main 5141 · COMBAT: 5160 · PROFICIENCY: 5187 · XP: 5214 · endCombat primary 6600, secondary 6604 | grep `applyMomentumToXP` |
| Where not applied | simulation (11996, 12001, 12011), `SHATTERPOINT_XP` (5576-5587), prose XP fallback (5998), XP inject (8493-8501), proficiency trickle-back (7270) | grep |
| Order with talents | momentum first, then talent multiplier (TRAINING: main only) | legacy/index.html:5141-5142 |
| Expiry | when WORLD JSON is parsed: if `dateToAbsoluteDays(inGameDate) >= dateToAbsoluteDays(expiresDate)` -> inactive; errors swallowed | legacy/index.html:4915-4924 |
| SHEET protection | `momentumWindow` snapshot and restore around SHEET parse | legacy/index.html:4762, 4797 |
| Surrender discount | `SURRENDER_DISCOUNT=v`, clamped 0-0.5, stored at `momentumWindow.surrenderDiscount`; reduces next dark-pressure discharge, then reset to 0 | legacy/index.html:5869-5873, 5836-5852 |
| Prompt teaching | "set after pressure discharge; 0,0 to close" | legacy/index.html:1777 |
| Prompt teaching (alignment section) | "set after discharge. During window, dark acts are amplified." | legacy/index.html:2616 |
| Prompt teaching (ALIGNMENT_XP) | "momentum-window direct hits use this too" | legacy/index.html:1745 |

## State read / written
- `characterSheet.momentumWindow.active`, `.multiplier`, `.expiresDate`, `.surrenderDiscount`.
- Reads `worldState.inGameDate` (5261, 4916-4919).
- Read for display: 4032-4038 (state block), 7315, 7379 (sidebar).

## AI provides vs. code computes
| AI provides | Code computes |
|---|---|
| When a window opens (taught as: after a dark-pressure discharge) | Nothing checks that a discharge happened |
| The multiplier and the day count | Expiry date from the in-game calendar; XP scaling |
| Closing early (`0,0`) | Closing on expiry |
| Surrender discount value | Clamp 0-0.5, applied at next discharge |

## Known bugs and fragile spots
1. **A dark-side discharge is rewarded with XP.** The prompt tells the AI to open a window right after a dark-pressure discharge (1777, 2616); code turns the window into an XP multiplier for every story-turn award (6969-6972, added V128). The alignment effect the prompt promises ("dark acts are amplified", "direct hits") is not implemented anywhere — no alignment code reads `momentumWindow.active` (grep: only 4032-4038, 7315, 7379 read it).
2. **No bounds.** `MOMENTUM_WINDOW=10,365` gives x10 XP for a year (5253-5263). A multiplier below 1 is a penalty; a negative one makes every award ≤ 0, which `applyXPToSheet` silently drops (7128).
3. **Can become permanent.** If `worldState.inGameDate` is empty when the tag arrives, `expiresDate` is '' (5261) and the expiry check requires a non-empty date (4916), so the window never closes. Date-parse errors are swallowed (4917-4923), with the same effect.
4. **Expiry only runs on a parsed WORLD block** (4915-4924). A sim time skip past the expiry leaves the window active until the next real turn's WORLD parse (no XP harm, since sim ignores momentum, but the UI still shows it).
5. **Stacks outside every cap**, and with talents (5141-5142). Combined with the AI-chosen outcome (x3.0) and tier multiplier (x3.5), there is no ceiling on one turn's XP.
6. **Inconsistent coverage.** Shatterpoint XP, prose XP and trickle-back ignore it (see table), so the same session gives different multipliers depending on which tag the AI used.
7. **Surrender discount lives on the momentum object** (5871-5872) though it has nothing to do with XP; it survives window open/close.

## Conflicts between sources
- **What opens a window.** XP Reference §10: "A breakthrough, exceptional performance, or significant story event". Prompt (1777, 2616) and legacy/CLAUDE.md §5A / §9D: after a dark-pressure discharge. Docs/updates.md (V122 alignment overhaul, ~line 2510): "Light-side momentum windows after discharge ... up to 5 days for major moral choices".
- **What a window does.** XP Reference §10 and Docs/updates.md V128 (~line 1139-1164): XP multiplier on real-turn XP. Prompt 2616 and Docs/CLAUDE changelog.md line 188: dark acts hit alignment directly during the window. Code does only the XP part.
- **Expiry mechanism.** Docs/updates.md V128 says the window "expired day-by-day in `advanceDay()`"; in V170 the only expiry check is in the WORLD-parse path (4915-4924).
- **v170-audit** calls it "an AI-triggered XP multiplier outside the cap" — matches code, but not the prompt's alignment framing.

## Replaced by
- progression-numbers.md §17 (state of mind set by code: centered x1.05, distracted x0.90, grief x0.80, anger channeling x1.20-1.30 with +0.5 dark pressure per hour, all inside the 2.8 cap) and §5 (code-rolled breakthrough outcome, 4% x1.75).
- ai-events.md (the AI never emits XP multipliers; it may propose emotional events that code validates).
- alignment.md for anything the window was meant to do to alignment after a discharge.
- Surrender discount: see alignment.md (not in this audit's scope).

## Open questions for Jared
1. Was the momentum window meant to reward XP at all, or only to make dark acts hit alignment harder after a discharge? The two meanings were merged in V128.
2. In v2, is the "dark side shortcut" fully covered by anger channeling (x1.20-1.30 with dark pressure, progression-numbers.md §17), or do you want a separate post-discharge window?
3. Should a light-side "breakthrough high" exist (the XP Reference's "exceptional performance" window), or is the code-rolled breakthrough outcome enough?
