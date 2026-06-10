# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Тест-тренажёр** — a static PWA (Progressive Web App) for practising medical exam questions. No build tools, no npm, no framework. Deployed as-is to any static host (e.g. GitHub Pages).

## Running locally

Open `index.html` directly in a browser, or serve the directory with any static server:

```
npx serve .
# or
python -m http.server 8080
```

Service worker and PWA install only work over HTTPS or `localhost`; for basic testing a plain `file://` open is enough.

## Architecture

All application logic lives in three files:

| File | Role |
|------|------|
| `index.html` | Static markup only; references `style.css` and `app.js` |
| `style.css` | All styles; dark theme via `:root`, light theme via `.light` override class on `<body>` |
| `app.js` | All JS — state, rendering, answer checking |
| `service-worker.js` | PWA offline cache; dynamically caches topic files from `topics_index.json` on install |

**Data flow:**
1. `loadTopicList()` fetches `topics_index.json` → populates `<select id="topicSelect">`
2. `loadTopic(filename)` fetches `topics/<filename>` → sets `QA[]`
3. `startBtn` → `buildOrder()` (with optional `fisherYates` shuffle) → sets `order[]`
4. `showQA()` renders the current question based on `order[idx]`
5. `showAnswer()` checks correctness via `showResult()`, then displays the canonical answer in `#correctBox`

**Key state variables in `app.js`:**
- `QA` — loaded question array
- `order` — array of indices into `QA`, possibly shuffled
- `idx` — current position in `order`
- `wrongSet` — `Set` of original QA indices marked wrong (drives "Ошибочные" re-run)

## Question JSON formats

All topic files under `topics/` are JSON with a top-level `{ title, questions: [...] }` wrapper (or a bare array).

| `type` field | Required fields | `correct` shape |
|---|---|---|
| *(absent)* — plain Q&A | `q`, `a` | — |
| `single` | `q`, `options[]` | number (index into `options`) |
| `multi` | `q`, `options[]` | number[] (indices) |
| `matching` | `q`, `left[]`, `right[]` | object `{ "leftIdx": rightIdx, … }` |
| `fill_each` | `q`, `items[]`, `answers[]` | — |
| `sequence` | `q`, `items[]` | `correct_order[]` — position `i` holds the original index that belongs at step `i` |
| `assertion` | `q`, `statement1`, `statement2` | 0–4 (index into the fixed 5-option list) |

The fixed assertion options are always: "Оба верны, есть связь" / "Оба верны, связи нет" / "Верно только первое" / "Верно только второе" / "Оба неверны".

**Note:** `single` type is implemented but not yet used in any existing topic file.

## Answer-checking internals

For `single`/`multi`, options are shuffled via `shuffleArray()` on each `showQA()`. The mapping from displayed position → original index is stored in `current._multiMap[]`. `showAnswer()` reads checked inputs, maps through `_multiMap`, and compares to `current.correct`.

## Adding a new topic

1. Create `topics/<name>.json` following one of the formats above.
2. Add an entry `{ "title": "…", "file": "<name>.json" }` to `topics_index.json`.
3. The service worker will auto-cache it on next install.

## Deployment on GitHub Pages

The service worker uses `'./'` as the root asset (not `'/'`) so that the cache key resolves correctly under a subpath like `username.github.io/Test3/`. The `manifest.json` also uses `"start_url": "."` for the same reason.
