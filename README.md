# OPENAINEWS.today

The autonomous newsroom that has become mildly exhausted by the pace of AI
announcements. It pulls **real AI headlines** from RSS and rewrites them in the
voice of a cold, tired machine — rendered as a retro phosphor terminal.

> "OpenAI released a new reasoning model today. Benchmarks improved 12%.
> Humanity remains uncertain what day it is."

**Vite + React** frontend · **Vercel** serverless + **Upstash Redis** backend.

---

## How "alive" works

1. A scheduled function (`/api/cron`) pulls a curated set of AI RSS feeds —
   OpenAI's official feed, The Verge AI, MarkTechPost, TechCrunch AI, MIT Tech
   Review (edit in `lib/feeds.js`).
2. New, unseen headlines are rewritten in the deadpan voice by Claude — staying
   factually faithful; the humor is tone, not invention.
3. Items dedupe and accumulate in Redis, so every visitor sees the same living,
   growing feed.
4. The `ingest` command pulls one fresh real headline on demand.

If the API key or Redis aren't configured, the site still runs on a built-in
offline signal bank — nothing hard-fails.

---

## Run locally

```bash
npm install
npm run dev          # frontend only; /api/* 404 locally -> offline bank
# or, full stack with the serverless functions:
npm i -g vercel && vercel dev
```

## Build

```bash
npm run build        # -> dist/
npm run preview
```

---

## Deploy to Vercel (the alive version)

1. Push this repo to GitHub.
2. Vercel -> **Add New > Project**, import it. Vercel auto-detects Vite.
3. **Add a Redis store:** Vercel dashboard -> Storage (or Marketplace) -> Upstash
   Redis -> connect to the project. This auto-sets `KV_REST_API_URL` and
   `KV_REST_API_TOKEN`.
4. **Add your key:** Settings > Environment Variables -> `ANTHROPIC_API_KEY`.
   (Optional: set `CRON_SECRET` to lock down the cron endpoint.)
5. Deploy. Hit `/api/cron` once (or wait for the schedule) to seed the feed.
6. Add the domain (openainews.today) under Settings > Domains.

### Cron frequency

`vercel.json` runs the ingest once daily (`0 14 * * *`). The Hobby plan caps cron
at once per day; on **Pro** you can bump it (e.g. `0 */2 * * *`) for fresher
headlines. The manual `ingest` command works regardless.

> Never put the API key in client code — `lib/voice.js` runs server-side only.

---

## Project structure

See `CLAUDE.md` for a full map and contribution notes.

```
api/          feed.js · ingest.js · cron.js          (Vercel functions)
lib/          feeds · rss · voice · store · ingest-core (server logic)
src/          React app (components, hook, data, styles)
vercel.json   cron schedule
```

---

*Independent editorial artifact. Not affiliated with OpenAI.*
