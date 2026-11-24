# 13 — Calendar and Time (legacy V170 audit)

Audited: `legacy/index.html` (V170, commit 8bef4a1). All line numbers were checked against the file.

## What it does for the player
- A header shows the time of day (`Morning (07:00)`) and the date (`Centaxday, Day 4 Coruscann — 3661 BBY`).
- Each AI turn should start with "Time Elapsed: X seconds/minutes/hours". Code reads that line, moves the clock forward and rolls the date past midnight.
- The calendar panel has two tabs. **Calendar** shows a month grid, a year progress bar and a month strip, plus a manual date/time setter. **Birthday** lets the player enter a birthday; age is then worked out from it every turn.
- When a simulation (time skip) runs, the date moves forward by the simulated days. The time of day does not change.

## Rules and formulas
| Constant / formula | Value | Source |
|---|---|---|
| `GSC_MONTHS` | Coruscann, Frostuary, Warming, Seedmonth, Bloomtide, Midyear, Heatmonth, Harvestide, Goldfall, Stormtide, Coldmonth, Yearend (invented) | legacy/index.html:7662 |
| `GSC_DAYS_IN_MONTH` | [31,30,31,31,31,30,31,30,31,31,31,30] | legacy/index.html:7663 |
| `GSC_DAYS_PER_YEAR` | sum = 368 | legacy/index.html:7667 |
| `GSC_DAYS_PER_WEEK` | 7 | legacy/index.html:7664 |
| `GSC_WEEK_DAYS` | Primeday, Centaxday, Taungsday, Zhellday, Benduday, **Restday, Endday** (last two invented) | legacy/index.html:7665 |
| `GSC_MONTH_OFFSETS` | cumulative day-of-year at which each month starts (0,31,61,92,…) | legacy/index.html:7670-7673 |
| Absolute day | `(era==='BBY' ? -year : year) * 368 + dayOfYear` | legacy/index.html:7676-7681 (`dateToAbsoluteDays`), 7690 |
| Weekday | `((absDay % 7) + 7) % 7` → `GSC_WEEK_DAYS` | legacy/index.html:7691 |
| Date string format | `${weekday}, Day ${dayInMonth} ${month} — ${year} ${era}` | legacy/index.html:7692 |
| Year rollover | BBY: when dayOfYear > 368, year−− (and the reverse going backward); ABY: year++. **BBY never switches to ABY** (it goes 1 BBY → 0 BBY → −1 BBY) | legacy/index.html:7739-7746 |
| Parse order | (1) "Day X, Cycle Y" fallback (Y = month); (2) needs `(\d{3,4})\s*(BBY\|ABY)`; (3) "Day X MonthName"; (4) fallback: "Day X" read as **day of year** | legacy/index.html:7696-7731 |
| Clock delta | hours×60 + minutes + seconds/60, rounded; ≤0 means no change | legacy/index.html:6191-6199 |
| Time-of-day labels | 3–6 Pre-Dawn, 6–7 Dawn, 7–12 Morning, 12–14 Midday, 14–18 Afternoon, 18–21 Evening, 21–24 Night, 0–3 Late Night | legacy/index.html:6208-6212 (repeated at 7874-7876) |
| Midnight crossing | `daysCrossed = floor((prev+delta)/1440)` → `advanceInGameDate` | legacy/index.html:6202, 6218-6219 |
| Training-hours pre-parse | a second, separate parser: hours + whole minutes only, **no seconds**, bold markers not stripped | legacy/index.html:5034-5045 |
| Sleep injury clear | if `turnElapsedHours ≥ 7`, minor injuries are removed | legacy/index.html:5048-5050 |
| Age | `currentYearAbs − birthYearAbs`, minus 1 if current dayOfYear < birthday dayOfYear; floored at 0 | legacy/index.html:7812-7825 |
| New-game start | date `Primeday, Day 1 Coruscann — ${year} BBY`, time `Morning (07:00)` | legacy/index.html:3434-3435 |
| New-game birthday | `{day:1, month:6, year: year+age, era:'BBY'}` | legacy/index.html:3383, 3403 |
| Sim advance | `advanceInGameDate(date, days)` once per simulated chunk | legacy/index.html:12053 |
| Canon calendar rule | "Track days, months, and years. Characters age in real time." | SW_Legends_RPG_Master_Prompt_v7_1.md "Time System" (line 118-120) |
| Canon dating | Ruusan Reformation (1,000 BBY) sets that year as year zero; BBY/ABY adopted ~25 ABY | SW_Timeline_2000_1000BBY_Part2, SW_Timeline_4_25ABY_Part5 (the old SW_Legends_Galaxy_Timeline.md, retired, D-484) |

### Every place that writes the date or time
| Line | Writer | Field |
|---|---|---|
| 3434-3435 | Character creation | inGameDate, inGameTime |
| 4894 | AI WORLD JSON replaces all of `worldState`. If there was no date before (`savedDate` null), the AI's date stays | inGameDate, inGameTime |
| 4928 / 4932 | Restores the snapshot after the WORLD parse | inGameDate / inGameTime |
| 6214 | `advanceClock()` from "Time Elapsed" | inGameTime |
| 6219 | Midnight crossing | inGameDate |
| 6254 | Regex reads "Day N Month" from "time elapsed / it is now / it is currently" lines (forward-only) | inGameDate |
| 7862 / 7877 | Manual setter `setManualDate()` | inGameDate / inGameTime |
| 8045 | `updateWorldState()` reformats a date with no month name, reading "Day N" as day of year | inGameDate |
| 8054 | `updateWorldState()` re-parse and reformat | inGameDate |
| 12053 | Simulation chunk | inGameDate |
| 8322 | `loadFromSave` (replaces the whole worldState) | both |

That makes 10 date writers inside turn and UI logic (11 counting load), and 5 time writers (6 counting load).

## State read / written
- `worldState.inGameDate` (string), `worldState.inGameTime` (string `Label (HH:MM)`), `worldState.era` (string, AI-writable, used only for display)
- `characterSheet.birthday {day, month, year, era}` and `characterSheet.age`
- Locals and globals: `turnElapsedHours` (5034), `lastGalaxyEventDate` (2788)
- Dates are also stored as strings in `characterSheet.momentumWindow.expiresDate` (5261, 4916-4924), `pendingEvents[].triggerDate/createdDate`, `trackedCharacters[].lastSeen` and `characterProfiles[].firstMet`

## AI provides vs. code computes
- **AI provides:** the "Time Elapsed:" prose line (the only thing that moves the clock); any "It is now Day N Month" line (this can move the date forward); and the WORLD JSON `inGameDate`/`inGameTime`, which are discarded unless no date existed before.
- **Code computes:** the clock, midnight rollover, weekday, age, birthday notices and the sim date advance.

## Known bugs and fragile spots
1. **Age is one year too low from the first turn.** Creation sets the birthday to Day 1 of month 6 (Midyear, day-of-year 155) and the start date to Day 1 Coruscann (day-of-year 1), so `computeAge` subtracts 1 (3383, 3403, 3434, 7820). `updateWorldState` then overwrites `characterSheet.age` with the lower value (8012-8015).
2. **Dates with 1–2 digit or 5-digit years never parse.** The parser requires `\d{3,4}` (7704, 7711). The Clone Wars (`22`) and Galactic Civil War (`1`) eras are offered at creation (1181-1182), and the year input allows −200…12000 (1189). For those campaigns `advanceInGameDate` returns the string unchanged (7736), so the date never advances. Age (`computeAge` → null) and event overdue checks also stop working.
3. **The date is never ABY.** Creation hardcodes BBY (3434). BBY years count down past 0 into negatives (7741).
4. **The starting weekday is wrong.** It is hardcoded "Primeday" (3434), but the formula gives Centaxday for Day 1 of 3661 BBY. The weekday changes formula on the first `dateToString` call.
5. **Two "Time Elapsed" parsers disagree.** 5036-5043 ignores seconds, uses whole minutes only and does not strip `**`. 6189-6198 handles seconds and strips bold. A "30 seconds" combat exchange therefore gives `turnElapsedHours = null`, which skips the alignment tick (6267).
6. **Days and words are not parsed.** "Time Elapsed: 1 day", "a few hours" or "half an hour" all move the clock by 0. Only the first matching line is read (6189). A number-word or a typo leaves the clock frozen.
7. **The AI can move the date.** It can still jump the date forward with any "It is now Day N Month" text (6229-6258), which contradicts the "JS owns the date" comment at 4925-4927. Only backward jumps are blocked (6253).
8. **Unknown month names silently become a day of year.** `parseDateString`'s fallback (7729-7730) and `updateWorldState` (8040-8046) read "Day N" as a day of year, so "Day 5 Elona" becomes 5 Coruscann.
9. **Fake midnight crossing.** If `inGameTime` lacks `(HH:MM)`, the clock silently never advances (6184-6185). There is also no check against the AI declaring 20 hours.
10. **The sim never sets the time of day.** It only moves the date (12053), which contradicts SW_Sim_Rules_v1.md §10 ("Time is set to the end of the last training block of each day").
11. **The engine writes to the DOM.** Time and date parsers update DOM labels directly (6215-6222, 6255-6257, 7863-7865).
12. **The setter can save a half-applied change.** `setManualDate` writes the date and then returns early on a bad time string without saving (7862 then 7871). The date change stays in memory but is not autosaved.
13. **The prompt contradicts itself.** 1895 says "DO NOT CHANGE inGameDate", but 1912 says "Update every turn when time advances past midnight".

## Conflicts between sources
- **Calendar shape.** The code uses 12 invented months and a 7-day week with 2 invented weekdays (7662-7665). Legends has either a 5-day-week / 10-month + fete-week calendar or the later 12-month / 368-day calendar (v170-audit.md "Calendar"). Docs/CLAUDE changelog.md "Calendar System" documents the invented names as intended.
- **Era label.** The code always writes "BBY". The canon timeline says BBY/ABY was only adopted ~25 ABY and that the Ruusan calendar (year zero = 1,000 BBY) came earlier (Timeline lines 585, 771). In-universe, a 3661 BBY character would not use "BBY".
- **Sim advancement.** SW_Sim_Rules_v1.md §10 says the date advances one day at a time and the time is set to the end of the last block. The code advances by whole chunks and leaves the time untouched (12053).
- **"It is now" fallback.** Docs/updates.md (line ~1786) says the "it is now / it is currently" fallback was removed. It was removed for **time** only; it is still active for the **date** (6229-6231).
- **Transition sync.** Docs/CLAUDE changelog.md line 230 says the sync block goes at the "front of recentHistory". That is stale: since V150 it is appended at the end (12181).

## Replaced by
- Calendar shape: decided in v170-audit.md "Decisions needed" (the 12-month / 368-day Essential Atlas calendar, with no invented month or weekday names). The month and weekday names themselves still need a v2 spec.
- Clock ownership and time advancement: no decided spec file yet. **None — needs a v2 spec** (a clock module with `onTimeAdvanced`, per v170-audit.md "Time and date"). Fatigue and healing over time: Replaced by health.md (it consumes the clock).

## Open questions for Jared
1. For the Essential Atlas 12-month calendar, which month and weekday names (and which week length) do you want? The canon names are known only for the 5 Legends weekdays.
2. Should in-universe dates in 3661 BBY show "BBY" (a player convenience) or an era-correct reckoning (canon timeline line 585)?
3. Should time skips (sims) set a time of day, and if so, to what (wake time, end of the last block)?
4. Should the AI ever propose time passing (as an event with bounds that code checks), or should time come only from code-known activity durations?
5. Should a new character's birthday be picked by the player at creation, rather than defaulting to Day 1 of month 6?
