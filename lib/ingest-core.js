import { fetchCandidates } from './rss.js'
import { rewrite } from './voice.js'
import { getSeen, publishItems, hasStore } from './store.js'

const pad = (n) => String(n).padStart(2, '0')
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function idNum(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return 40000 + (h % 59999)
}

function toDisplayItem(sig, c) {
  const d = c.date ? new Date(c.date) : new Date()
  return {
    id: 'SIG-' + idNum(c.id),
    ts: pad(d.getHours()) + ':' + pad(d.getMinutes()),
    headline: String(sig.headline || c.title).slice(0, 200),
    body: String(sig.body || ''),
    hype: clamp(parseInt(sig.hype, 10) || 50, 0, 100),
    wrapper: Boolean(sig.wrapper),
    panic: typeof sig.panic === 'string' ? sig.panic : '+1',
    use: Math.random() < 0.5 ? 'inconclusive' : 'probably not',
    source: { name: c.sourceName, url: c.sourceUrl },
  }
}

// Run one ingestion cycle. Fetches all feeds, skips anything already seen,
// rewrites up to `limit` of the newest fresh stories, and persists them.
// Returns the newly published display items (newest first).
export async function runIngest(limit = 3) {
  const candidates = await fetchCandidates()
  if (candidates.length === 0) return []

  const seen = hasStore ? await getSeen() : new Set()
  let pick = candidates.filter((c) => !seen.has(c.id)).slice(0, limit)

  // With no store we can't dedupe across runs; just surface the newest item so
  // the ingest command still works in local dev.
  if (pick.length === 0 && !hasStore) pick = [candidates[0]]

  const published = []
  const seenIds = []
  for (const c of pick) {
    try {
      const sig = await rewrite({ title: c.title, summary: c.summary })
      published.push(toDisplayItem(sig, c))
      seenIds.push(c.id)
    } catch {
      // skip this story; a bad rewrite shouldn't sink the whole cycle
    }
  }

  if (hasStore && published.length) await publishItems(published, seenIds)
  return published
}
