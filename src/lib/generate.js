import { fromBank } from '../data/bank.js'

// Where to fetch a live, machine-written signal.
//   - In production on Cloudflare Pages, /api/generate maps to
//     functions/api/generate.js (which holds your API key server-side).
//   - Override with VITE_GENERATE_URL in a .env file if you host the
//     proxy elsewhere.
// If the request fails for any reason (no backend in local dev, network
// error, bad JSON), we silently fall back to the offline bank so the UI
// always produces a signal.
const ENDPOINT = import.meta.env.VITE_GENERATE_URL || '/api/generate'

function clean(s) {
  return {
    headline: String(s.headline || '').slice(0, 160),
    body: String(s.body || ''),
    hype: Math.max(0, Math.min(100, parseInt(s.hype, 10) || 50)),
    wrapper: Boolean(s.wrapper),
    panic: typeof s.panic === 'string' ? s.panic : '+1',
  }
}

export async function generateSignal() {
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: ctrl.signal,
    })
    clearTimeout(to)
    if (!res.ok) throw new Error('status ' + res.status)
    const data = await res.json()
    if (!data || !data.headline) throw new Error('empty signal')
    return { signal: clean(data), live: true }
  } catch (err) {
    return { signal: fromBank(), live: false }
  }
}
