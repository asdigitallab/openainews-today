import { runIngest } from '../lib/ingest-core.js'

// Triggered on a schedule by Vercel Cron (see vercel.json).
// If CRON_SECRET is set, Vercel sends it as a Bearer token; we verify it so the
// endpoint can't be hammered by randoms.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  try {
    const items = await runIngest(3)
    res.status(200).json({ ingested: items.length, items })
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) })
  }
}
