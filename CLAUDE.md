# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hán Tự App** — a browser-based flashcard/quiz app for learning Classical Chinese (Hán Tự) with Vietnamese (Hán Việt) readings and meanings. Vanilla HTML/CSS/JS, no framework, no dependencies, no build step. The codebase (comments and UI strings) is in Vietnamese.

## Running the App

Open `index.html` directly in a browser, or serve statically:

```bash
python -m http.server 8000
```

There is no npm, build, lint, or automated test setup. "Testing" means manual UI interaction. The Apps Script backend has a `_testPing()` function for validating the deployment from the Apps Script editor.

## Architecture

Four JS modules, each an IIFE that attaches a **single global** to `window`. Modules communicate *only* through these globals — there are no imports/exports.

| Load order | File | Global | Role |
| --- | --- | --- | --- |
| 1 | `js/dictionary-data.js` | `window.HAN_VIET_DICT` | Generated dictionary: `{ "字": { hv, nghia }, ... }` (1040+ entries) |
| 2 | `js/storage.js` | `window.Storage` | localStorage I/O, progress tracking, status classification, Google Sheets sync |
| 3 | `js/tests.js` | `window.Tests` | The 8 test-mode renderers + session control |
| 4 | `js/app.js` | `window.App` | Controller: view routing, dashboard, char grid, file upload, settings; calls `init()` on load |

**Load order is a hard dependency** (set in `index.html`): storage seeds its default char list from `HAN_VIET_DICT`, and `app.init()` aborts with an alert if `HAN_VIET_DICT` is missing. Keep these four `<script>` tags in this order.

Dictionary entries always have two fields: `hv` (Hán Việt reading) and `nghia` (Vietnamese meaning). These field names appear throughout the code.

### Data model (localStorage)

- `hantu:chars` — JSON array of the active character list (the set being studied)
- `hantu:progress` — `{ char: { seen, correct, wrong, lastSeen, customMeaning } }`
- `hantu:settings` — `{ sheetsUrl }`
- `hantu:lastSync` — timestamp

`data/dictionary.json` is the editing source of truth for the dictionary; `js/dictionary-data.js` is the runtime version actually loaded in the browser. **The two must stay in sync, and `dictionary.json` must never be hand-edited** (that's how trailing commas / duplicate keys / bad indentation creep in). Use the script below instead.

## Updating the dictionary (daily workflow)

`tools/update-dict.mjs` (zero-dependency Node, ESM) is the single command that keeps all three files in sync. The daily flow:

1. Add the new characters to `data/ds_cac_chu.txt` (any layout — the script extracts CJK via the same `/[㐀-鿿]/` filter the app uses).
2. Run `node tools/update-dict.mjs`. It finds characters present in the list but missing from `dictionary.json`, prompts for each one's `hv` (Hán Việt) + `nghia`, then:
   - writes `data/dictionary.json` via `JSON.stringify` (always valid — no trailing comma possible),
   - regenerates `js/dictionary-data.js` from it,
   - bumps a `?v=<contenthash>` cache-buster on **every** `js/*.js` `<script>` tag in `index.html` (each tag hashed from its own file), so editing any JS file — not just the dictionary — forces a refetch.
3. `git add -A && git commit && git push`.

`node tools/update-dict.mjs --regen` does steps 2's writes **without prompting** — use it to heal drift or after any manual `dictionary.json` change; it re-stringifies (fixing formatting/dupes) and regenerates. The script is idempotent: a `--regen` with no content change produces zero byte diffs. Path overrides `HANTU_LIST/JSON/JS/HTML` exist for testing.

**Deployment / "why didn't my change show up":** the app is static (GitHub Pages). A push redeploys, but browsers cache the JS files; the per-file `?v=` hashes (maintained by the script) force a refetch whenever any `js/*.js` file changes. After editing **any** JS file or the dictionary, run `node tools/update-dict.mjs --regen` before committing so the hashes update — otherwise users may keep a stale copy. The `SCRIPTS` array in the script lists which tags it versions; add new JS files there.

### Status classification & study ordering (the core learning logic)

`Storage.getStatus(char)` returns one of `new | learning | learned | needs-review` from progress data:

- `new`: never seen
- `learned`: `seen >= 3` AND `accuracy >= 0.85` (and not stale)
- `needs-review`: stale (`lastSeen` older than 7 days) while otherwise learned, OR `accuracy < 0.5` with `seen >= 2`
- `learning`: everything else

This status drives the dashboard stats *and* `Tests.selectStudyChars()`, which builds each session's queue in priority order: **needs-review → learning → new → learned** (shuffled within each tier, sliced to the session size, default 10). This is the de-facto spaced-repetition mechanism — changing the thresholds changes what gets studied.

### Test modes

`Tests.start(mode)` is dispatched from `data-action` attributes on the home/test action cards. The 8 mode keys (see the `switch` in `renderCurrent()`):

`flashcard`, `mc-char-hv`, `mc-meaning-char`, `mc-char-meaning`, `fill-blank`, `arrange`, `reading`, `typing`

Adding a mode requires three coordinated changes: a `renderXxx()` function, a `case` in `renderCurrent()`, and a `data-action` card in `index.html`.

- **fill-blank / arrange / reading** draw from hard-coded `SENTENCE_BANK` / `PASSAGE_BANK` in `tests.js`, and only surface items where **every** CJK character is already in the user's `hantu:chars` list. The banks were curated against the default 1040-char list, so a heavily customized char list may show "not enough characters" for these modes.
- **typing** matching (`matchHanViet`) is diacritic-insensitive (NFD strip) and accepts multiple comma/semicolon-separated readings.

## Google Sheets Sync (backend)

`docs/apps-script.gs` is deployed as a Google Apps Script Web App and handles three POST actions: `ping`, `bulkSync` (push all progress), `loadProgress` (pull + merge). Deploy: paste into a Sheet's Apps Script editor → Deploy as Web App (execute as "Me", access "Anyone") → paste the URL into the app's Settings.

- Sync to Sheets is **debounced 3s** after each progress update (`Storage._scheduleSync`).
- Requests use `Content-Type: text/plain` deliberately, to avoid a CORS preflight against Apps Script.
- `pullFromSheets` merges per-character by newest `lastSeen` (server wins only if newer).

## Conventions

- **Character validation**: valid characters are matched with `/[㐀-鿿]/` (CJK Extension A `U+3400–U+4DBF` plus the main CJK Unified Ideographs block `U+4E00–U+9FFF`). This range **excludes Extension B and beyond** (`U+20000+`), so those characters are silently dropped on `.txt` upload and `setChars`. Use this same range if adding any char-parsing code.
- **Design system** ("Scholar's Notebook" theme) lives in CSS variables in `css/style.css`: `--color-paper` #FAFAF5, `--color-ink` #1A1A1A, `--color-seal` #BC3D3D, `--color-jade` #3F6B5C; fonts Crimson Pro (display), Noto Serif TC (Chinese glyphs), Inter (body), JetBrains Mono (mono).
