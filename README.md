# wc3-replay-parser-web

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-PBug90-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/PBug90)

A client-side Warcraft III replay parser and visualizer. Drop in a `.w3g` file (or pull one straight from W3Champions) and get instant stats — no server, no upload, everything runs in the browser.

## Features

- **Drag-and-drop replay parsing** — load `.w3g` files locally
- **W3Champions integration** — search by BattleTag, browse matches by season and gateway, parse replays in one click
- **Action heatmap** — interactive canvas overlay on the minimap with a time slider to scrub through the game
- **APM chart** — per-player actions-per-minute over time
- **Player cards** — heroes, units trained, upgrades researched, and ability progression per player
- **Raw JSON export** — collapsible view of the full parsed replay data

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot reload |
| `npm run build`   | Type-check and build for production       |
| `npm run preview` | Preview the production build locally      |
| `npm run lint`    | Run ESLint + Prettier checks              |
| `npm run test`    | Run unit tests with Vitest                |

## How it works

[w3gjs](https://github.com/PBug90/w3gjs) is a Node.js library for parsing `.w3g` files. Running it in the browser requires a few shims:

- **`src/stubs/fs.js`** — stub for `node:fs`; w3gjs uses it for file-path loading which never happens in the browser
- **`src/stubs/zlib.js`** — custom zlib implementation backed by [fflate](https://github.com/101arrowz/fflate); handles both standard zlib streams and the sync-flushed variant used in some WC3 replay blocks
- **`src/stubs/perf_hooks.js`** — re-exports `globalThis.performance`
- **`vite-plugin-node-polyfills`** — polyfills `buffer`, `events`, `util`, `crypto`, `stream`, and `string_decoder`

## Deployment

The app is deployed to GitHub Pages via the CI/CD workflow on every push to `main`. Build artifacts are produced with:

```bash
npm run build -- --base=/<repo-name>/
```

## Tech stack

- [React 19](https://react.dev) + TypeScript
- [Vite 6](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [w3gjs](https://github.com/PBug90/w3gjs)
- [fflate](https://github.com/101arrowz/fflate)
