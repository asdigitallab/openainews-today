import { fetchCandidates } from './rss.js'
import { rewrite } from './voice.js'
import { getSeen, getRecentTopics, publishItems, hasStore } from './store.js'
import { clusterAndPick, fingerprint, isDuplicateOfRecent, tokenSet } from './dedup.js'

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

// Run one ingestion cycle:
//   fetch all feeds -> drop exact-link duplicates we've seen
//   -> cluster same-story candidates ACROSS sources (pick the best per cluster)
//   -> skip topics we already published recently
//   -> rewrite up to `limit` survivors and persist them.
export async function runIngest(limit = 3) {
  const candidates = await fetchCandidates()
  if (candidates.length === 0) return []

  const [seen, recentTopics] = await Promise.all([
    hasStore ? getSeen() : Promise.resolve(new Set()),
    hasStore ? getRecentTopics() : Promise.resolve([]),
  ])

  // 1. Drop exact-link duplicates already in the store.
  const unseen = candidates.filter((c) => !seen.has(c.id))

  // 2. Cluster same-story candidates and keep the best representative each.
  //    (OpenAI's own feed wins ties — see lib/dedup.js source priority.)
  const clustered = clusterAndPick(unseen)

  // 3. Drop any cluster whose topic looks like something we already published.
  let pick = clustered.filter(
    (c) => !isDuplicateOfRecent(c.__tokens || tokenSet(c.title), recentTopics),
  )

  // No-store dev fallback: still surface something so `ingest` feels alive.
  if (pick.length === 0 && !hasStore && candidates.length > 0) pick = [candidates[0]]

  pick = pick.slice(0, limit)

  const published = []
  const seenIds = []
  const topicFps = []
  for (const c of pick) {
    try {
      const sig = await rewrite({ title: c.title, summary: c.summary })
      published.push(toDisplayItem(sig, c))
      seenIds.push(c.id)
      topicFps.push(fingerprint(c.title))
    } catch {
      // skip this story; a bad rewrite shouldn't sink the whole cycle
    }
  }

  if (hasStore && published.length) await publishItems(published, seenIds, topicFps)
  return published
}
