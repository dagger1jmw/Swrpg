# Project Instructions

## Project
- Star Wars Legends text RPG. Gemini writes the story; game code owns all rules and state.
- Folder mapping: in all prompts and specs, `docs/` means `docs-v2/` (e.g. `docs/spec/` = `docs-v2/spec/`, `docs/architecture.md` = `docs-v2/architecture.md`). `Docs/` (capital D) is the old reference folder: lore in `Docs/SWRPG lore/` is still the canon source of truth and is read from there. Never write new files into `Docs/`.

## Stack
- Vite + TypeScript (`strict`), Vitest, and Zod. Deployed to GitHub Pages.
- Do not add other frameworks unless `docs-v2/architecture.md` says so.

## Golden Rules
1. The AI never changes game state directly. It returns schema-checked events; game code validates and applies them.
2. Game rules are pure functions in `src/engine/` with unit tests. No DOM or network access there.
3. `Docs/SWRPG lore/` is the canon source of truth. Never contradict it.
4. `legacy/` is read-only reference. Never import from it or edit it.
5. Fix root causes, not symptoms. If a fix needs a second patch, stop and explain why.
6. Run `npm test` and `npm run typecheck` before saying a task is done.
7. Specs in `docs-v2/spec/` define targets and tests, not exact math. Never carry a formula over from `legacy/` just because it existed. If a cleaner formula hits the same targets and passes the same tests, propose it, log it in `docs-v2/decisions.md`, and wait for approval before switching. Prefer smooth (interpolated) curves over step tables.

## Documentation
- Read the relevant feature spec in `docs-v2/spec/` before working.
- Read `docs-v2/architecture.md` for design and `docs-v2/decisions.md` for design-change history.
- `Docs/SWRPG lore/` contains canon reference material; use it for lore questions.

## Session Habit
- End each session by adding a dated line to `docs-v2/progress.md`.