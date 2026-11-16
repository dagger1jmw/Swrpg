# 15 — Story Memory (legacy V170 audit)

Audited: `legacy/index.html` (V170). All line numbers were checked against the file.

## What it does for the player
- The AI sees the last 6 turns word for word, plus a compressed "campaign summary" rebuilt by a side AI call every 10 turns.
- A "MEMORY COMPRESSED" notice appears when a summary is made. A "CAMPAIGN MEMORY LOADED" notice appears on load.
- After a training simulation, a fake user/model exchange tells the AI that time has skipped. An optional button writes a transition scene and adds it to memory.
- The on-screen feed keeps only the last 100 messages.

## Rules and formulas
| Constant / rule | Value | Source |
|---|---|---|
| `RECENT_TURNS` | 6 (12 messages) | legacy/index.html:2791 |
| `SUMMARIZE_EVERY` | 10 turns (`turnCount % 10 === 0`), fire-and-forget | legacy/index.html:2792, 6291-6293 |
| recentHistory update | `push(user, model)` then `slice(-12)` (oldest first) | legacy/index.html:6148-6151 |
| Stored model text | `displayText` (data blocks stripped), not `rawText` | legacy/index.html:6136-6142 |
| fullHistory | push every turn; saved as `slice(-200)` | legacy/index.html:6145, 8240 |
| Summarizer input | `fullHistory.slice(0, -12)`; each message cut to 600 chars; SHEET/WORLD blocks removed; needs ≥4 messages | legacy/index.html:3653-3674 |
| Summarizer model | gemini-2.5-flash, temperature 0.3, maxOutputTokens 2048, "under 800 words", third person | legacy/index.html:3680-3686, 3676 |
| Accept summary | length > 100 chars → replace `campaignSummary`, `fullHistory = slice(-12)` | legacy/index.html:3693-3697 |
| On failure | `fullHistory = slice(-24)` if longer | legacy/index.html:3704-3706 |
| Prompt placement | `CAMPAIGN HISTORY (turns 1–${max(1, turnCount − recentHistory.length/2)})` inside the state block | legacy/index.html:4121 |
| History order in request | state block, then a model "Confirmed" turn, then recentHistory, then a reminder on the user turn | legacy/index.html:4112-4173 |
| Sim sync block | `[SYSTEM STATE UPDATE — TIME SKIP COMPLETE]` user msg + "Acknowledged…" model msg; earlier sync blocks removed; **appended** (V150); trimmed to 12 | legacy/index.html:12153-12185 |
| Aborted sim | `finishSimulation` still runs when `simChunksDone > 0` (V151), with "stopped early" wording | legacy/index.html:11924, 12120-12121, 12154 |
| Transition scene | `simApiCall(…, 4000)`; appended to recentHistory **and** fullHistory | legacy/index.html:12311, 12327-12335 |
| `MAX_DOM_TURNS` | 100 `.msg-gm/.msg-player/.msg-system` nodes; oldest removed; a notice is shown | legacy/index.html:6368-6390 |

## State read / written
`recentHistory`, `fullHistory`, `campaignSummary`, `isSummarizing`, `turnCount`, `trimmedTurns`, `domTurnCount` (2780-2786, 6369-6370). All except the DOM counters are saved (8232-8240).

## AI provides vs. code computes
- **AI provides:** the narrative (stored), the summary text (side call) and the transition scene.
- **Code computes:** what is kept, trimming, when to summarize, sync-block contents, and the turn range label.

## Known bugs and fragile spots
1. **Race between the summarizer and play.** `toSummarize` is captured before `await fetch` (3653), but the trim afterwards is `fullHistory.slice(-12)` on the *current* array (3696). Any turns played while the summarizer runs push the oldest of the 12 "kept" messages out without ever summarizing them. Every turn played during summarization loses one older turn from memory.
2. **The sim sync block is never added to `fullHistory`.** It goes only into recentHistory (12181), so the summarizer never learns about the time skip. After 6 more turns the skip disappears from AI memory unless a transition scene was generated.
3. **The player is misled about saved history.** The trim notice says "Your full save history is preserved" (6386), but after every summary fullHistory is cut to 12 messages (3696), and the save keeps only 50 rendered messages (8246).
4. **Summarization is lossy.** It is lossy twice: each message is cut to 600 chars, and each summary rewrites the previous one. Nothing is pinned, so old facts can drift or vanish. Repeated summary-of-summary compounds this.
5. **Summaries can silently fail.** They are dropped if the API returns ≤100 chars or a non-OK response, and the summary never runs while quota is exhausted (3690-3699).
6. **The turn-range label is approximate.** It is `turnCount − recentHistory.length/2` (4121) and goes wrong once sync or transition pairs are counted as turns.
7. **The summary is not part of a typed state.** It sits in the prompt as free text, next to state that says it is "ground truth" (4112).
8. **Engine and DOM are mixed.** Summary notices write directly to the feed (3711-3718).

## Conflicts between sources
- The changelog at 2785 says "rebuilt every 10 turns". That matches the code.
- Docs/CLAUDE changelog.md line 230 says the sync block is injected at the "front" of recentHistory. The code appends it (V150, Docs/updates.md ~446-456).
- SW_Sim_Rules_v1.md §9 describes an optional 2–3 paragraph narrative summary. The code's transition scene asks for 4–6 paragraphs (12288, 12293).

## Replaced by
- v170-audit.md lists "Story memory and saves: Replace — covered in Story memory". No decided spec file for it exists in docs-v2/spec/. **None — needs a v2 spec.**

## Open questions for Jared
1. Should v2 memory keep pinned structured facts (NPCs met, promises, injuries, places) owned by code, with AI prose summaries used only for flavor?
2. How many raw turns should be sent each request in v2? (Legacy: 6.)
3. Should time skips be recorded as permanent memory entries, which would fix bug 2?
4. Should the full story transcript be kept somewhere (export, IndexedDB) even if the AI does not see it?
