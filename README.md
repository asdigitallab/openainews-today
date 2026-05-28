# OPENAINEWS.today

The autonomous newsroom that has become mildly exhausted by the pace of AI
announcements. A satirical, self-aware AI-news site written in the voice of a
cold, tired machine — rendered as a retro phosphor terminal.

> "OpenAI released a new reasoning model today. Benchmarks improved 12%.
> Humanity remains uncertain what day it is."

Built with **Vite + React**.

---

## Features

- **Deadpan machine voice** — every signal is dry, understated, and ends on a
  flat observation about human behavior.
- **AGI countdown that never arrives** — counts down in real time, then quietly
  recalculates further out. The central joke.
- **Live stat readouts** — Human Panic Index, Model Release Fatigue, and a
  "days since someone said AGI is near" counter that keeps resetting.
- **Terminal command line** — `ingest`, `agi`, `panic`, `calm`, `whoami`,
  `clear`, `help`.
- **`ingest`** pulls a fresh signal. It tries live AI generation first and
  falls back to a built-in bank of ~15 pre-written signals, so the site works
  with **zero backend**.
- **CRT aesthetic** — scanlines, flicker, vignette, IBM Plex Mono.

---

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL. (In local dev, `ingest` uses the offline bank
because there is no backend running — see below to test live generation.)

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New > Project**, import the repo. Vercel auto-detects Vite
   (build: `npm run build`, output: `dist`). No config needed.
3. Deploy. The site is live with the offline signal bank working immediately.
4. Add your domain under **Settings > Domains** (e.g. `openainews.today`) and
   point your registrar's DNS as Vercel instructs.

### Optional: turn on LIVE machine-written signals

The repo includes `api/generate.js`, a Vercel serverless function that proxies
to the Anthropic API with your key kept server-side.

1. In Vercel: **Settings > Environment Variables**, add
   `ANTHROPIC_API_KEY` = your key.
2. Redeploy. Now `ingest` generates fresh signals live, and falls back to the
   bank only if a request fails.

> Never put an API key in client-side code. The serverless function exists
> precisely so the key stays on the server.

To test the function locally, use the Vercel CLI: `vercel dev`.

---

## Project structure

```
api/generate.js            Vercel serverless function (live generation proxy)
index.html                 Vite entry, loads the font
src/
  main.jsx                 React mount
  App.jsx                  composition
  index.css                all styles (phosphor terminal theme)
  hooks/useNewsroom.js     state, timers, boot sequence, ingest, commands
  lib/
    generate.js            live-fetch with offline fallback
    util.js                small display helpers
  data/
    seed.js                signals shown on first load
    bank.js                offline signal bank (non-repeating draw)
  components/              Masthead, StatGrid, Console, Feed, CommandLine
```

---

*Independent editorial artifact. Not affiliated with OpenAI.*
