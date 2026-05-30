import { FEEDS } from './feeds.js'

// Common words that aren't useful for telling two AI stories apart.
// Note we keep 'ai', 'openai', 'gpt', 'claude', 'model' — those ARE the
// distinguishing tokens in this domain (mostly excluded already by length > 2).
const STOPWORDS = new Set([
  'the','and','for','from','with','that','this','these','those','their','there',
  'will','would','could','should','have','has','had','was','were','been','being',
  'are','its','itself','about','into','over','under','via','through','between',
  'new','newest','latest','today','yesterday','week','year','years',
  'says','said','told','tells','can','may','might','must',
  'how','why','what','when','where','who','which','more','most','some','any','all',
  'just','only','also','than','then','here','out','off','still',
])

// Light stemming. Real stemmers (Porter, Snowball) are overkill for this; we
// just need "launches" and "launch" to collide, "models" and "model" to
// collide, etc. Imperfect on irregulars — that's fine.
function stem(t) {
  if (t.length <= 4) return t
  if (t.endsWith('ies')) return t.slice(0, -3) + 'y'
  if (t.endsWith('ing') && t.length > 5) return t.slice(0, -3)
  if (t.endsWith('ed') && t.length > 4) return t.slice(0, -2)
  if (t.endsWith('es') && t.length > 4) return t.slice(0, -2)
  if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1)
  return t
}

// Extract distinctive content tokens from a headline.
export function tokenSet(title) {
  if (!title) return new Set()
  const toks = title
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, ' ')   // en/em dashes
    .replace(/[\u2018\u2019]/g, '')    // smart apostrophes
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .map(stem)
  return new Set(toks)
}

export function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = a.size + b.size - inter
  return inter / union
}

// String fingerprint for storage. Sorted tokens joined by spaces; reversible
// by `new Set(fp.split(' '))`.
export function fingerprint(title) {
  return Array.from(tokenSet(title)).sort().join(' ')
}

// Cluster candidates that look like the SAME story by Jaccard similarity, then
// pick the best representative per cluster (highest-priority source, newest).
const SOURCE_PRIORITY = new Map(FEEDS.map((f, i) => [f.name, i]))

function pickBest(items) {
  return items.slice().sort((a, b) => {
    const pa = SOURCE_PRIORITY.get(a.sourceName) ?? 99
    const pb = SOURCE_PRIORITY.get(b.sourceName) ?? 99
    if (pa !== pb) return pa - pb
    return new Date(b.date || 0) - new Date(a.date || 0)
  })[0]
}

export function clusterAndPick(candidates, threshold = 0.4) {
  const clusters = []
  for (const c of candidates) {
    const tset = tokenSet(c.title)
    c.__tokens = tset
    let placed = false
    for (const cl of clusters) {
      if (jaccard(tset, cl.tokens) >= threshold) {
        cl.items.push(c)
        for (const t of tset) cl.tokens.add(t)
        placed = true
        break
      }
    }
    if (!placed) clusters.push({ tokens: new Set(tset), items: [c] })
  }
  // Preserve overall newest-first order using each cluster's best pick's date.
  return clusters
    .map((cl) => pickBest(cl.items))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

// Does a candidate's token set match anything we already published recently?
export function isDuplicateOfRecent(candidateTokens, recentFingerprints, threshold = 0.4) {
  for (const fp of recentFingerprints) {
    if (!fp) continue
    const prev = new Set(fp.split(' ').filter(Boolean))
    if (jaccard(candidateTokens, prev) >= threshold) return true
  }
  return false
}
