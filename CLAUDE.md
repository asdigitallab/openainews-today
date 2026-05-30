# CLAUDE.md

Context for Claude Code working in this repo.

## What this is

**OPENAINEWS.today** — a satirical AI-news site written in the voice of a cold,
mildly exhausted machine. It pulls **real** AI headlines from RSS, rewrites them
in a deadpan "tired machine" register, and renders them in a retro phosphor
terminal UI. Vite + React frontend; Vercel serverless functions + Upstash Redis
backend.

The personality is the product. When editing copy or prompts, preserve the
voice: dry, understated, observational, never emotional, occasionally
self-aware; treats AI announcements like recurring weather; separates substance
from marketing; never uses hype words sincerely. **Rewrites must stay factually
faithful to the source headline — the humor is tone, never invented facts.**

## Architecture

```
Frontend (Vite + React)
  src/App.jsx                 composition
  src/hooks/useNewsroom.js    all state, timers, boot sequence, ingest, commands
  src/components/             Masthead, StatGrid, Console, Feed, CommandLine
  src/components/MissionStatus.jsx  fixed identity block under masthead — hardcoded, intentionally never changes, never rotated
  src/lib/api.js              fetchFeed() + ingestOne() (calls the backend)
  src/lib/util.js             display helpers
  src/data/seed.js            first-load signals (used only if store is empty)
  src/data/bank.js            offline fallback signals (non-repeating draw)
  src/index.css               phosphor terminal theme

Backend (Vercel serverless, ESM)
  api/feed.js                 GET  -> stored shared feed
  api/ingest.js               POST -> ingest ONE fresh headline (the command)
  api/cron.js                 GET  -> scheduled ingest (3 headlines)
  lib/feeds.js                RSS source list (edit to add/remove sources)
  lib/rss.js                  fetch + parse all feeds, newest-first
  lib/voice.js                Anthropic rewrite (deadpan, faithful) -> JSON
  lib/store.js                Upstash Redis (feed list + seen set); no-op if unset
  lib/ingest-core.js          fetch -> dedupe -> rewrite -> persist -> display items
  vercel.json                 cron schedule
```

Data flow: cron/ingest -> `runIngest()` -> fetch RSS -> skip seen -> `rewrite()`
-> store in Redis -> frontend reads `/api/feed`.

## Graceful degradation (important)

Every external dependency is optional so the site never hard-fails:
- No `ANTHROPIC_API_KEY` -> ingest falls back to the offline bank.
- No Redis env -> no persistence/dedupe; `/api/feed` returns `[]` and the UI
  shows seed signals; `ingest` surfaces the newest item ephemerally.
- A dead feed or bad rewrite is skipped, not fatal.

## Commands

```
npm install
npm run dev       # frontend only; /api/* 404s locally -> bank fallback
vercel dev        # full stack locally (needs Vercel CLI + env vars)
npm run build     # production frontend -> dist/
```

## Env vars

See `.env.example`. Needed for the live experience: `ANTHROPIC_API_KEY` and an
Upstash Redis pair (`KV_REST_API_URL`/`KV_REST_API_TOKEN` or `UPSTASH_*`).
Optional: `CRON_SECRET`. Optional analytics: `VITE_GA_ID` (GA4 measurement ID, e.g. `G-XXXXXXXXXX`; must be set in Vercel before building since Vite inlines it at build time).

## Deploy (Vercel)

1. Push to GitHub, import in Vercel (auto-detects Vite).
2. Add env vars; add Upstash via Vercel Marketplace (auto-sets KV_* vars).
3. Add the domain (openainews.today).
4. Cron is daily by default (`vercel.json`). Hobby plan caps cron at once/day;
   on Pro, bump to e.g. `0 */2 * * *` for hourly-ish freshness.

## Good next tasks (ideas)

- Cross-source de-duplication is in place (Jaccard 0.4 over stemmed tokens,
  with source-priority pick-best per cluster + 200-fingerprint cross-run check
  in `lib/dedup.js`). It handles the common case — three sources running the
  same OpenAI launch in similar wording will collapse to one item. The known
  limitation is terse official headlines like "Introducing GPT-5" vs wordy
  coverage of the same event: too few shared tokens for any threshold to
  anchor. Fixing this well would need NER or a small product-name allow-list.
- A "recalculating…" micro-animation when the AGI estimate resets.
- Per-source weighting beyond the current FEEDS-array order.
- A small RSS/JSON output of the rewritten feed (meta: a deadpan feed of feeds).
- Newsletter signup + small "built by" footer (in-voice) for if/when the site
  catches traction — captured-audience play, not an SEO play.
- Wire the same `runIngest` into a GHL workflow if mirroring there.
- HUMAN BEHAVIOR LOG (src/components/HumanBehaviorLog.jsx + src/data/trends.json):
  Google Trends panic telemetry between the system log and the feed. Manual
  refresh via `npm run trends:update -- path/to/trends.csv` (needs
  ANTHROPIC_API_KEY); it asks the deadpan voice to pick ~5 queries and write
  notes, then writes trends.json for you to review and commit.
