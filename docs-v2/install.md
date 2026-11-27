# Installing the game on the iPad

Jared, 27 Nov 2026 (m9-release B5). How to run the game locally, deploy it to GitHub Pages, install it on the iPad, back it up, and move a campaign from Safari to the installed app. Decision: D-559. Report: docs-v2/reports/m9-release.md (B).

## 1. Run it locally

1. `npm install` (once).
2. `npm run dev`. The game is at http://localhost:5173. Add `?dev=1` for the dev start and the `/` commands.
3. On the iPad, on the same Wi-Fi: http://<the PC's local address>:5173. The dev server has no service worker, so it does not install or work offline. It is for testing only.
4. To try the built app as it will be deployed: `npm run build`, then `npx vite preview --base /Swrpg/` and open http://localhost:4173/Swrpg/.

`npm run build` checks itself at the end (`scripts/check-dist.ts`). It fails if the manifest, the icons or the service worker are missing, or if any path is absolute (an absolute path would break under the `/Swrpg/` project path).

## 2. Deploy

The workflow `.github/workflows/deploy.yml` builds the app and publishes `dist/` to GitHub Pages on every push to `main`. You can also run it by hand: GitHub, Actions, "Deploy to GitHub Pages", Run workflow.

1. Merge `rebuild` into `main` and push. (The old single-file game on `main` is replaced.)
2. Once, in the repository settings: Pages, Source: **GitHub Actions**.
3. The game is at https://dagger1jmw.github.io/Swrpg/. Every path in the build is relative, so the project path works.

Each deploy is a new version. An app that is already open (or installed) shows **"A new version is ready: reload"** at the bottom of the screen; tap Reload when it suits you, for example between turns. Until you tap it, the open app keeps running the version it started with, so versions never mix.

## 3. Install on the iPad

1. Open https://dagger1jmw.github.io/Swrpg/ in **Safari**.
2. Share button, **Add to Home Screen**, Add.
3. Open the game from its Home Screen icon. It runs full screen, without Safari's bars.
4. The first time, the app shows a note: the Home Screen app has **its own storage, separate from Safari's**. Paste the Gemini API key (Settings), then import a campaign if you have one (section 5).
5. The app opens without a network connection (the page, scripts, styles and icons are cached). Gemini still needs the network for every turn.

Settings, Storage shows whether the storage is persistent and how much is used. The app asks for persistent storage on start and when installed. Safari can clear a website's data after 7 days without a visit. A Home Screen app counts its own days of use instead, so regular play keeps the saves, but export a backup anyway (section 4).

## 4. Back up

- **Export:** Campaign, **Export campaign**. On the iPad this opens the share sheet: choose **Save to Files**, then iCloud Drive (or On My iPad). On a computer it downloads a `.json` file.
- **Reminder:** the status bar asks you to back up after every 5 chapters or every 7 days since the last export, whichever comes first. It has Export and Later buttons. Later hides it until the app is next opened.
- **The file:** one JSON file with the whole campaign: the state, people, places, threads, chapter summaries and the full transcript. The API key is never in it. A long campaign's file is about 15 KB per turn (a 1,500-turn campaign is about 23 MB).
- **Restore:** Campaign, **Import campaign**, and pick the file (from Files or iCloud Drive). If the campaign already exists in this app, the import continues it on a new branch, so nothing already saved is overwritten.

## 5. Move a campaign from Safari to the installed app

Safari and the Home Screen app do not share storage, so you move a campaign with a file.

1. In **Safari**, open the game, go to Campaign, Export campaign, and save the file to Files (iCloud Drive).
2. Open the **Home Screen app**, paste the API key in Settings, and Save.
3. Campaign, Import campaign, and pick the file you saved.
4. Play from the Home Screen app from now on. The copy in Safari stays where it was. You can delete it in Safari's settings (Safari, Advanced, Website Data) once you are sure the import worked.

## 6. Where the saves live

- **The campaigns** (autosave, the last 10 saves and one a day for the last 7 days, and the transcript) live in the browser's IndexedDB (database `swrpg-v2`). After two in-game years the save envelope is about 85 KB. Each turn adds about 16 KB of transcript.
- **Settings, the API key, the usage meter and the backup reminder's record** live in localStorage. They come to a few KB.
- Each origin has its own storage: `localhost:5173` (the dev server), `dagger1jmw.github.io` in Safari, and the Home Screen app are three separate places.
