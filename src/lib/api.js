import { fromBank } from '../data/bank.js'

// Read the shared, accumulating feed from the backend store.
// Returns [] if there's no backend (e.g. local dev) so the UI can fall back
// to seed signals.
export async function fetchFeed() {
  try {
    const r = await fetch('/api/feed')
    if (!r.ok) throw new Error('status ' + r.status)
    const d = await r.json()
    return Array.isArray(d.items) ? d.items : []
  } catch {
    return []
  }
}

// Pull one fresh real headline, rewritten in the deadpan voice.
//   mode 'live'  -> a real, freshly-ingested item
//   mode 'quiet' -> backend reachable but nothing new upstream
//   mode 'bank'  -> no backend / error; drew from the offline archive
export async function ingestOne() {
  try {
    const r = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!r.ok) throw new Error('status ' + r.status)
    const d = await r.json()
    if (d.item) return { item: d.item, mode: 'live' }
    return { item: fromBank(), mode: 'quiet' }
  } catch {
    return { item: fromBank(), mode: 'bank' }
  }
}

// Daily Machine Observations — the archive / the machine's memory.
export async function fetchObservations() {
  try {
    const r = await fetch('/api/observations')
    if (!r.ok) throw new Error('status ' + r.status)
    const d = await r.json()
    return Array.isArray(d.items) ? d.items : []
  } catch { return [] }
}

export async function fetchObservation(date) {
  try {
    const r = await fetch('/api/observations?date=' + encodeURIComponent(date))
    if (!r.ok) throw new Error('status ' + r.status)
    const d = await r.json()
    return d.item || null
  } catch { return null }
}
