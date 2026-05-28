import Parser from 'rss-parser'
import { FEEDS } from './feeds.js'

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'openainews.today/1.0 (+https://openainews.today)' },
})

// Pull every feed in parallel, tolerate individual failures, return a single
// newest-first list of normalized candidate items.
export async function fetchCandidates() {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const feed = await parser.parseURL(f.url)
      return (feed.items || []).map((it) => ({
        id: (it.link || it.guid || it.title || '').trim(),
        title: (it.title || '').trim(),
        summary: (it.contentSnippet || it.content || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 320),
        date: it.isoDate || it.pubDate || null,
        sourceName: f.name,
        sourceUrl: it.link || '',
      }))
    }),
  )

  const items = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  return items.filter((x) => x.id && x.title)
}
